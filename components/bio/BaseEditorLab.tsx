"use client";

/**
 * Das Base-Editing-Labor: 3D-Doppelhelix, Sequenzleiste und Werkzeugkasten.
 * Die gesamte Zustandsverwaltung liegt hier; die Panels sind reine Anzeige.
 */

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyBaseEdit,
  applyNucleaseCut,
  applyPrimeEdit,
  findGuides,
  getEditor,
  getPam,
  guidesForTarget,
  predictEdits,
  type EditOutcome,
  type EditorId,
  type Guide,
  type PamId,
} from "@/lib/bio/editors";
import { type Base, aminoInfo, complement, translate } from "@/lib/bio/genetics";
import { BASE_COLORS, BASE_NAMES } from "@/lib/bio/colors";
import {
  CASES,
  getCase,
  getGene,
  startSequenceFor,
  type LabCase,
} from "@/lib/bio/cases";
import {
  cdsEnd,
  cdsStart,
  changedIndices,
  evaluateGenotype,
  referenceSequence,
  type GeneDef,
} from "@/lib/bio/phenotype";
import { checkGoal, hasGoal, rankGuides, type LogEntry, type RankedGuide } from "@/lib/bio/lab";
import { SequenceTrack } from "./SequenceTrack";
import { ActionButton, SeverityBadge } from "./ui";
import { ToolPanel, type PrimeOperationState } from "./panels/ToolPanel";
import { PatientPanel } from "./panels/PatientPanel";
import { ReportPanel } from "./panels/ReportPanel";
import { KnowledgePanel } from "./panels/KnowledgePanel";
import { LogPanel } from "./panels/LogPanel";
import { CasePicker } from "./panels/CasePicker";

const HelixCanvas = dynamic(() => import("./HelixCanvas").then((m) => m.HelixCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-slate-600">
      Doppelhelix wird aufgebaut …
    </div>
  ),
});

type Tab = "fall" | "labor" | "befund" | "protokoll" | "wissen";

const TABS: { id: Tab; label: string }[] = [
  { id: "fall", label: "Fall" },
  { id: "labor", label: "Labor" },
  { id: "befund", label: "Befund" },
  { id: "protokoll", label: "Protokoll" },
  { id: "wissen", label: "Wissen" },
];

const SPAN_OPTIONS = [13, 21, 31];

function initialFocus(labCase: LabCase, gene: GeneDef, sequence: string): number {
  if (labCase.focusIndex !== undefined) return labCase.focusIndex;
  if (labCase.goal.site) return labCase.goal.site.index;
  const reference = referenceSequence(gene);
  const shared = Math.min(reference.length, sequence.length);
  for (let i = 0; i < shared; i++) if (reference[i] !== sequence[i]) return i;
  if (reference.length !== sequence.length) return Math.max(0, shared - 1);
  return Math.floor(sequence.length / 2);
}

function timeStamp(): string {
  return new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/**
 * Äußere Hülle: Sie hält nur Fallauswahl und Voreinstellungen. Der Arbeitsbereich
 * bekommt den Fall als `key`, damit ein Fallwechsel ihn sauber neu aufbaut –
 * ohne Zustands-Zurücksetzen in einem Effekt.
 */
export function BaseEditorLab() {
  const [caseId, setCaseId] = useState<string>(CASES[0].id);
  const [showCases, setShowCases] = useState(false);
  const [settings, setSettings] = useState<LabSettings>({
    editorId: "ABE",
    pamId: "NGG",
    realistic: true,
    showLabels: true,
    span: 21,
    tab: "fall",
  });

  return (
    <>
      <LabWorkspace
        key={caseId}
        caseId={caseId}
        settings={settings}
        onSettingsChange={(patch) => setSettings((current) => ({ ...current, ...patch }))}
        onOpenCases={() => setShowCases(true)}
      />
      {showCases && (
        <CasePicker activeId={caseId} onSelect={setCaseId} onClose={() => setShowCases(false)} />
      )}
    </>
  );
}

interface LabSettings {
  editorId: EditorId;
  pamId: PamId;
  realistic: boolean;
  showLabels: boolean;
  span: number;
  tab: Tab;
}

interface WorkspaceProps {
  caseId: string;
  settings: LabSettings;
  onSettingsChange: (patch: Partial<LabSettings>) => void;
  onOpenCases: () => void;
}

function LabWorkspace({ caseId, settings, onSettingsChange, onOpenCases }: WorkspaceProps) {
  const { editorId, pamId, realistic, showLabels, span, tab } = settings;
  const labCase = useMemo(() => getCase(caseId), [caseId]);
  const gene = useMemo(() => getGene(labCase.geneId), [labCase]);
  const reference = useMemo(() => referenceSequence(gene), [gene]);
  const startSequence = useMemo(() => startSequenceFor(labCase, gene), [labCase, gene]);

  const [sequence, setSequence] = useState(startSequence);
  const [history, setHistory] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(() => initialFocus(labCase, gene, startSequence));
  const [center, setCenter] = useState<number>(() => initialFocus(labCase, gene, startSequence));
  const [guideId, setGuideId] = useState<string | null>(null);
  const [prime, setPrime] = useState<PrimeOperationState>({
    type: "substitute",
    base: "A",
    insert: "CTT",
    deleteLength: 3,
  });
  const [log, setLog] = useState<LogEntry[]>([]);
  const [replicating, setReplicating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ token: number; indices: number[] }>({ token: 0, indices: [] });
  const [showHint, setShowHint] = useState(true);
  const [celebrating, setCelebrating] = useState(false);

  const logCounter = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const list = timers.current;
    return () => {
      list.forEach(clearTimeout);
      list.length = 0;
    };
  }, []);

  const later = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timers.current.push(id);
  }, []);

  const addLog = useCallback((entry: Omit<LogEntry, "id" | "time">) => {
    logCounter.current += 1;
    setLog((entries) => [{ ...entry, id: logCounter.current, time: timeStamp() }, ...entries].slice(0, 60));
  }, []);

  const report = useMemo(() => evaluateGenotype(gene, sequence), [gene, sequence]);
  const editor = useMemo(() => getEditor(editorId), [editorId]);
  const pamSpec = useMemo(() => getPam(pamId), [pamId]);
  const goalReached = useMemo(() => checkGoal(labCase.goal, report, sequence), [labCase, report, sequence]);
  const caseHasGoal = hasGoal(labCase);

  const guides = useMemo(
    () => (editor.kind === "prime" ? [] : findGuides(sequence, pamId)),
    [sequence, pamId, editor.kind],
  );

  const rankedGuides: RankedGuide[] = useMemo(() => {
    if (selected === null) return [];
    if (editor.kind === "base") {
      const onTarget = guidesForTarget(sequence, guides, editor, selected);
      const nearby = guides.filter((guide) => guide.senseIndex.includes(selected));
      const pool = onTarget.length > 0 ? onTarget : nearby;
      return rankGuides(pool, (guide) => predictEdits(sequence, guide, editor, selected), selected);
    }
    if (editor.kind === "nuclease") {
      return guides
        .filter((guide) => Math.abs(guide.nickSenseIndex - selected) <= 8)
        .slice(0, 6)
        .map((guide) => ({ guide, edits: [], onTarget: 0.75, bystanders: 0, score: 0.75, hitsTarget: true }));
    }
    return [];
  }, [guides, editor, selected, sequence]);

  const activeGuide: Guide | null = useMemo(() => {
    const chosen = rankedGuides.find((entry) => entry.guide.id === guideId);
    return chosen?.guide ?? rankedGuides[0]?.guide ?? null;
  }, [rankedGuides, guideId]);

  const predicted = useMemo(
    () =>
      activeGuide && editor.kind === "base" && selected !== null
        ? predictEdits(sequence, activeGuide, editor, selected)
        : [],
    [activeGuide, editor, selected, sequence],
  );

  /* Markierungen für Helix und Sequenzleiste ------------------------ */
  const highlights = useMemo(() => {
    if (editor.kind === "prime") {
      return {
        protospacer: [] as number[],
        editWindow: selected !== null ? [selected] : [],
        pam: [] as number[],
        guideStrand: null as 1 | -1 | null,
      };
    }
    if (!activeGuide) {
      return { protospacer: [], editWindow: [], pam: [], guideStrand: null as 1 | -1 | null };
    }
    const [from, to] = editor.kind === "base" ? editor.window : ([15, 20] as [number, number]);
    return {
      protospacer: activeGuide.senseIndex,
      editWindow: activeGuide.senseIndex.slice(from - 1, to),
      pam: activeGuide.pamSenseIndex,
      guideStrand: activeGuide.strand,
    };
  }, [activeGuide, editor, selected]);

  const changed = useMemo(() => [...changedIndices(gene, sequence)], [gene, sequence]);
  const predictedIndices = useMemo(() => predicted.map((edit) => edit.senseIndex), [predicted]);
  const enzymeBound = editor.kind === "prime" ? selected !== null : activeGuide !== null;

  const codonInfo = useMemo(() => {
    if (selected === null || gene.kind !== "coding") return null;
    const start = cdsStart(gene);
    const end = cdsEnd(gene) + (sequence.length - reference.length);
    if (selected < start || selected >= end) return null;
    const offset = selected - start;
    const codonIndex = Math.floor(offset / 3);
    const codon = sequence.slice(start + codonIndex * 3, start + codonIndex * 3 + 3);
    const protein = translate(sequence.slice(start, end));
    return {
      codonNumber: codonIndex + 1,
      residue: codonIndex + 1 + gene.proteinOffset,
      codon,
      amino: protein[codonIndex] ?? "?",
      position: ((offset % 3) + 1) as 1 | 2 | 3,
    };
  }, [selected, gene, sequence, reference.length]);

  const caseMarkers = useMemo(() => {
    const list: { index: number; label: string }[] = [];
    if (labCase.goal.site) list.push({ index: labCase.goal.site.index, label: "Ziel" });
    if (labCase.focusIndex !== undefined) list.push({ index: labCase.focusIndex, label: "Ziel" });
    for (const marker of gene.markers) list.push({ index: marker.index, label: marker.label });
    return list;
  }, [labCase, gene]);

  /* Aktionen -------------------------------------------------------- */
  const handleSelect = useCallback((index: number) => {
    setSelected(index);
    setCenter(index);
    setGuideId(null);
  }, []);

  const describeOutcome = useCallback(
    (outcome: EditOutcome, nextSequence: string) => {
      const lines: string[] = [];
      const onTarget = outcome.applied.filter((edit) => !edit.bystander && !edit.offTarget);
      const bystanders = outcome.applied.filter((edit) => edit.bystander && !edit.offTarget);

      for (const edit of onTarget) {
        lines.push(
          `Ziel getroffen: Position ${edit.senseIndex + 1} ${edit.fromSense}•${complement(edit.fromSense)} → ${edit.toSense}•${complement(edit.toSense)}`,
        );
      }
      for (const edit of bystanders) {
        lines.push(
          `Bystander-Edit: Position ${edit.senseIndex + 1} ${edit.fromSense} → ${edit.toSense} (nicht beabsichtigt)`,
        );
      }
      for (const edit of outcome.offTarget) {
        lines.push(
          `Off-Target: Position ${edit.senseIndex + 1} ${edit.fromSense} → ${edit.toSense} – außerhalb der Zielstelle.`,
        );
      }
      for (const miss of outcome.missed) {
        lines.push(
          `Nicht umgesetzt: Position ${miss.senseIndex + 1} (Trefferwahrscheinlichkeit lag bei ${Math.round(miss.efficiency * 100)} %)`,
        );
      }
      if (outcome.indel) {
        lines.push(
          outcome.indel.inserted
            ? `${outcome.indel.inserted.length} Base(n) eingefügt an Position ${outcome.indel.at + 1}: ${outcome.indel.inserted}`
            : `${outcome.indel.removed} Base(n) entfernt ab Position ${outcome.indel.at + 1}`,
        );
      }
      if (lines.length === 0) lines.push("Es hat sich nichts verändert.");

      const nextReport = evaluateGenotype(gene, nextSequence);
      lines.push(`Neuer Befund: ${nextReport.title}`);
      return { text: lines.join("\n"), nextReport };
    },
    [gene],
  );

  const runEdit = useCallback(() => {
    if (selected === null || busy) return;

    let outcome: EditOutcome | null = null;
    let title = "";

    if (editor.kind === "base") {
      if (!activeGuide) return;
      outcome = applyBaseEdit(sequence, activeGuide, editor, selected, {
        guaranteed: !realistic,
        offTargetRisk: 0.04 * pamSpec.offTargetFactor,
        random: Math.random,
      });
      title = `${editor.short} an Position ${selected + 1} · ${activeGuide.strand === 1 ? "Sinnstrang" : "Gegenstrang"} · PAM ${activeGuide.pam}`;
    } else if (editor.kind === "prime") {
      const operation =
        prime.type === "substitute"
          ? ({ type: "substitute", base: prime.base } as const)
          : prime.type === "insert"
            ? ({ type: "insert", bases: prime.insert } as const)
            : ({ type: "delete", length: prime.deleteLength } as const);
      if (operation.type === "insert" && operation.bases.length === 0) {
        addLog({ kind: "warn", title: "Prime-Editing abgebrochen", detail: "Es wurden keine Basen zum Einfügen angegeben." });
        return;
      }
      outcome = applyPrimeEdit(sequence, selected, operation, {
        guaranteed: !realistic,
        efficiency: 0.45,
        random: Math.random,
      });
      title = `Prime-Editing an Position ${selected + 1}`;
    } else {
      if (!activeGuide) return;
      outcome = applyNucleaseCut(sequence, activeGuide, Math.random);
      title = `Cas9-Doppelstrangbruch bei Position ${activeGuide.nickSenseIndex + 1}`;
    }

    if (!outcome) return;
    const result = outcome;

    setBusy(true);
    later(() => {
      const { text, nextReport } = describeOutcome(result, result.sequence);
      const wasReached = goalReached;

      setHistory((entries) => [...entries.slice(-24), sequence]);
      setSequence(result.sequence);
      setFlash((current) => ({
        token: current.token + 1,
        indices: result.applied.map((edit) => edit.senseIndex),
      }));

      const kind: LogEntry["kind"] =
        result.applied.length === 0 && !result.indel
          ? "fail"
          : result.offTarget.length > 0 || result.applied.some((edit) => edit.bystander)
            ? "warn"
            : "edit";
      addLog({ kind, title, detail: text });

      if (!wasReached && checkGoal(labCase.goal, nextReport, result.sequence)) {
        addLog({
          kind: "success",
          title: "Auftrag erfüllt",
          detail: labCase.goal.text,
        });
        setCelebrating(true);
        later(() => setCelebrating(false), 6000);
      }

      setBusy(false);
    }, 620);
  }, [
    selected,
    busy,
    editor,
    activeGuide,
    sequence,
    realistic,
    pamSpec,
    prime,
    addLog,
    describeOutcome,
    goalReached,
    labCase,
    later,
  ]);

  const undo = useCallback(() => {
    setHistory((entries) => {
      if (entries.length === 0) return entries;
      const previous = entries[entries.length - 1];
      setSequence(previous);
      addLog({ kind: "info", title: "Schritt zurückgenommen", detail: "Die vorherige Sequenz ist wiederhergestellt." });
      return entries.slice(0, -1);
    });
  }, [addLog]);

  const reset = useCallback(() => {
    setSequence(startSequence);
    setHistory([]);
    setCelebrating(false);
    addLog({ kind: "info", title: "Labor zurückgesetzt", detail: "Die Ausgangssequenz des Falls ist wiederhergestellt." });
  }, [startSequence, addLog]);

  const toggleReplication = useCallback(() => {
    setReplicating((value) => {
      const next = !value;
      if (next) {
        addLog({
          kind: "info",
          title: "Zellteilung simuliert",
          detail:
            "Die Doppelhelix trennt sich, an jedem alten Strang entsteht ein neuer. Beide Tochterhelices bestehen aus einem alten und einem neuen Strang – semikonservative Replikation. Der Edit wird dabei auf beide Stränge festgeschrieben und an alle Tochterzellen weitergegeben.",
        });
      }
      return next;
    });
  }, [addLog]);

  const selectedBase = selected !== null ? (sequence[selected] as Base | undefined) : undefined;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-slate-950 text-slate-100 overscroll-none">
      {/* Kopfzeile */}
      <header className="flex min-h-14 shrink-0 items-center gap-3 border-b border-slate-800 px-3 sm:px-4">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold tracking-tight text-slate-100 sm:text-base">
            Base-Editing-Labor
          </h1>
          <p className="truncate text-[10px] text-slate-500">
            {gene.symbol} · {labCase.title}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SeverityBadge severity={report.severity} />
          <ActionButton tone="ghost" onClick={onOpenCases} className="!min-h-10 !px-3 !text-xs">
            Fälle
          </ActionButton>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Linke Seite: 3D und Sequenz */}
        <div className="flex min-h-0 min-w-0 flex-[1.15] flex-col lg:flex-1">
          <div className="relative min-h-0 flex-1 bg-[radial-gradient(ellipse_at_center,#0f172a_0%,#020617_70%)]">
            <HelixCanvas
              sequence={sequence}
              center={center}
              span={span}
              selected={selected}
              protospacer={highlights.protospacer}
              editWindow={highlights.editWindow}
              pam={highlights.pam}
              predicted={predictedIndices}
              changed={changed}
              guideStrand={highlights.guideStrand}
              editorColor={editor.color}
              enzymeBound={enzymeBound}
              mode={replicating ? "replication" : "helix"}
              showLabels={showLabels}
              flashToken={flash.token}
              flashIndices={flash.indices}
              onSelect={handleSelect}
              onCenterChange={(next) =>
                setCenter(Math.max(0, Math.min(sequence.length - 1, next)))
              }
            />

            {/* Auswahl-Anzeige */}
            {selectedBase && (
              <div className="pointer-events-none absolute left-3 top-3 rounded-xl border border-slate-700/70 bg-slate-950/80 px-3 py-2 backdrop-blur">
                <p className="font-mono text-lg font-black leading-none">
                  <span style={{ color: BASE_COLORS[selectedBase] }}>{selectedBase}</span>
                  <span className="mx-1 text-slate-600">
                    {selectedBase === "G" || selectedBase === "C" ? "≡" : "="}
                  </span>
                  <span style={{ color: BASE_COLORS[complement(selectedBase)] }}>
                    {complement(selectedBase)}
                  </span>
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {BASE_NAMES[selectedBase]} · Position {selected! + 1}
                </p>
                {codonInfo && (
                  <p className="text-[10px] text-slate-500">
                    {codonInfo.codon} → {aminoInfo(codonInfo.amino).code3}
                    {codonInfo.residue}
                  </p>
                )}
              </div>
            )}

            {/* Ansichtssteuerung */}
            <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
              <div className="flex overflow-hidden rounded-xl border border-slate-700/70 bg-slate-950/80 backdrop-blur">
                {SPAN_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onSettingsChange({ span: option })}
                    style={{ touchAction: "manipulation" }}
                    className={`min-h-10 px-3 text-[11px] font-semibold ${
                      span === option ? "bg-slate-700 text-white" : "text-slate-400"
                    }`}
                  >
                    {option} bp
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onSettingsChange({ showLabels: !showLabels })}
                style={{ touchAction: "manipulation" }}
                className="min-h-10 rounded-xl border border-slate-700/70 bg-slate-950/80 px-3 text-[11px] font-semibold text-slate-300 backdrop-blur"
              >
                {showLabels ? "Buchstaben aus" : "Buchstaben an"}
              </button>
              <button
                type="button"
                onClick={toggleReplication}
                style={{ touchAction: "manipulation" }}
                className={`min-h-10 rounded-xl border px-3 text-[11px] font-semibold backdrop-blur ${
                  replicating
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                    : "border-slate-700/70 bg-slate-950/80 text-slate-300"
                }`}
              >
                {replicating ? "Zellteilung läuft" : "Zellteilung"}
              </button>
            </div>

            {/* Legende */}
            <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2 rounded-xl border border-slate-800/70 bg-slate-950/70 px-2.5 py-1.5 backdrop-blur">
              {(["A", "T", "G", "C"] as Base[]).map((base) => (
                <span key={base} className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BASE_COLORS[base] }} />
                  {base}
                </span>
              ))}
              {activeGuide && (
                <>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-orange-400" /> Protospacer
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-pink-400" /> PAM
                  </span>
                </>
              )}
            </div>

            {replicating && (
              <div className="pointer-events-none absolute bottom-3 right-3 max-w-xs rounded-xl border border-cyan-500/40 bg-cyan-950/70 p-3 text-[11px] leading-relaxed text-cyan-100 backdrop-blur">
                Semikonservative Replikation: Jede Tochterhelix besteht aus einem alten und einem neuen
                Strang. Der neu geschriebene Buchstabe wird dabei auf beide Stränge übernommen – und an
                alle Tochterzellen weitergegeben.
              </div>
            )}

            {showHint && (
              <div className="absolute inset-x-3 bottom-14 mx-auto max-w-md rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
                <p className="text-xs font-semibold text-slate-100">So bedienst du die Helix</p>
                <ul className="mt-2 space-y-1 text-[11px] text-slate-400">
                  <li>· Ein Finger ziehen: Helix drehen</li>
                  <li>· Zwei Finger zusammen/auseinander: zoomen</li>
                  <li>· Zwei Finger hoch/runter: an der Sequenz entlangfahren</li>
                  <li>· Auf ein Basenpaar tippen: als Ziel auswählen</li>
                </ul>
                <ActionButton onClick={() => setShowHint(false)} className="mt-3 w-full !min-h-10 !text-xs">
                  Verstanden
                </ActionButton>
              </div>
            )}

            {celebrating && (
              <div className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center px-4">
                <div className="rounded-2xl border border-emerald-400/60 bg-emerald-500/15 px-5 py-4 text-center backdrop-blur">
                  <p className="text-lg font-bold text-emerald-200">Auftrag erfüllt</p>
                  <p className="mt-1 max-w-sm text-[11px] text-emerald-100/80">{labCase.goal.text}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sequenzleiste */}
          <div className="min-w-0 shrink-0 border-t border-slate-800 bg-slate-950/90 px-2 py-2">
            <SequenceTrack
              gene={gene}
              sequence={sequence}
              referenceSequence={reference}
              selected={selected}
              protospacer={highlights.protospacer}
              editWindow={highlights.editWindow}
              pam={highlights.pam}
              predicted={predictedIndices}
              guideStrand={highlights.guideStrand}
              onSelect={handleSelect}
              markers={caseMarkers}
            />
          </div>
        </div>

        {/* Rechte Seite: Panels */}
        <aside className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-slate-800 lg:w-[400px] lg:flex-none lg:border-l lg:border-t-0">
          <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-800 px-2 py-2">
            {TABS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSettingsChange({ tab: entry.id })}
                style={{ touchAction: "manipulation" }}
                className={`min-h-10 shrink-0 rounded-xl px-3 text-xs font-semibold transition-colors ${
                  tab === entry.id
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {entry.label}
                {entry.id === "fall" && caseHasGoal && goalReached && (
                  <span className="ml-1 text-emerald-400">✓</span>
                )}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            {tab === "fall" && (
              <PatientPanel
                labCase={labCase}
                gene={gene}
                report={report}
                goalReached={goalReached}
                hasGoal={caseHasGoal}
                onOpenCases={onOpenCases}
              />
            )}
            {tab === "labor" && (
              <ToolPanel
                editor={editor}
                onEditorChange={(id) => {
                  onSettingsChange({ editorId: id });
                  setGuideId(null);
                }}
                pamId={pamId}
                onPamChange={(id) => {
                  onSettingsChange({ pamId: id });
                  setGuideId(null);
                }}
                selected={selected}
                sequence={sequence}
                codonInfo={codonInfo}
                rankedGuides={rankedGuides}
                activeGuideId={activeGuide?.id ?? null}
                onGuideChange={setGuideId}
                predicted={predicted}
                realistic={realistic}
                onRealisticChange={(value) => onSettingsChange({ realistic: value })}
                prime={prime}
                onPrimeChange={setPrime}
                onRun={runEdit}
                onUndo={undo}
                onReset={reset}
                canUndo={history.length > 0}
                busy={busy}
              />
            )}
            {tab === "befund" && (
              <ReportPanel
                gene={gene}
                report={report}
                sequence={sequence}
                reference={reference}
                changedIndices={changed}
                onSelect={handleSelect}
              />
            )}
            {tab === "protokoll" && <LogPanel entries={log} />}
            {tab === "wissen" && <KnowledgePanel />}
          </div>
        </aside>
      </div>
    </div>
  );
}
