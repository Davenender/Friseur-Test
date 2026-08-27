"use client";

/** Werkzeugkasten: Editor wählen, Guide-RNA auswählen, Vorhersage lesen, editieren. */

import { EDITORS, PAM_SPECS, type EditorSpec, type PamId, type PredictedEdit } from "@/lib/bio/editors";
import { type Base, aminoInfo, complement } from "@/lib/bio/genetics";
import { type RankedGuide, formatPercent } from "@/lib/bio/lab";
import { ActionButton, Chip, EfficiencyBar, Panel, Toggle } from "../ui";
import { BASE_COLORS } from "@/lib/bio/colors";

export interface PrimeOperationState {
  type: "substitute" | "insert" | "delete";
  base: Base;
  insert: string;
  deleteLength: number;
}

interface Props {
  editor: EditorSpec;
  onEditorChange: (id: EditorSpec["id"]) => void;
  pamId: PamId;
  onPamChange: (id: PamId) => void;
  selected: number | null;
  sequence: string;
  codonInfo: { codonNumber: number; residue: number; codon: string; amino: string; position: 1 | 2 | 3 } | null;
  rankedGuides: RankedGuide[];
  activeGuideId: string | null;
  onGuideChange: (id: string) => void;
  predicted: PredictedEdit[];
  realistic: boolean;
  onRealisticChange: (value: boolean) => void;
  prime: PrimeOperationState;
  onPrimeChange: (next: PrimeOperationState) => void;
  onRun: () => void;
  onUndo: () => void;
  onReset: () => void;
  canUndo: boolean;
  busy: boolean;
}

export function ToolPanel({
  editor,
  onEditorChange,
  pamId,
  onPamChange,
  selected,
  sequence,
  codonInfo,
  rankedGuides,
  activeGuideId,
  onGuideChange,
  predicted,
  realistic,
  onRealisticChange,
  prime,
  onPrimeChange,
  onRun,
  onUndo,
  onReset,
  canUndo,
  busy,
}: Props) {
  const senseBase = selected !== null ? (sequence[selected] as Base) : null;
  const usesGuide = editor.kind !== "prime";
  const canRun =
    selected !== null &&
    (editor.kind === "prime" ? true : rankedGuides.length > 0 && activeGuideId !== null);

  return (
    <div className="space-y-4">
      <Panel title="1 · Werkzeug wählen" subtitle="Jedes Enzym kann genau eine Sorte Umwandlung.">
        <div className="grid grid-cols-3 gap-2">
          {EDITORS.map((item) => {
            const active = item.id === editor.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onEditorChange(item.id)}
                style={{ touchAction: "manipulation", borderColor: active ? item.color : undefined }}
                className={`min-h-16 rounded-xl border p-2 text-left transition-colors ${
                  active ? "bg-slate-800" : "border-slate-800 bg-slate-900/60 hover:bg-slate-800/60"
                }`}
              >
                <span className="block text-xs font-bold" style={{ color: active ? item.color : "#e2e8f0" }}>
                  {item.short}
                </span>
                <span className="mt-0.5 block text-[10px] leading-tight text-slate-400">
                  {item.from && item.to ? `${item.from} → ${item.to}` : item.kind === "prime" ? "frei" : "Schnitt"}
                </span>
                {item.experimental && <span className="mt-1 block text-[9px] text-amber-400">experimentell</span>}
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-xs font-semibold" style={{ color: editor.color }}>
            {editor.name}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{editor.chemistry}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip tone="cyan">{editor.pairChange}</Chip>
            <Chip>{editor.typicalEfficiency}</Chip>
            {editor.kind === "base" && (
              <Chip tone="amber">Fenster: Position {editor.window[0]}–{editor.window[1]}</Chip>
            )}
            {editor.doubleStrandBreak ? (
              <Chip tone="rose">Doppelstrangbruch</Chip>
            ) : (
              <Chip tone="emerald">kein Doppelstrangbruch</Chip>
            )}
          </div>
        </div>
      </Panel>

      {usesGuide && (
        <Panel
          title="2 · Cas9-Variante"
          subtitle="Das PAM entscheidet, welche Stellen überhaupt erreichbar sind."
        >
          <div className="grid grid-cols-3 gap-2">
            {PAM_SPECS.map((spec) => {
              const active = spec.id === pamId;
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => onPamChange(spec.id)}
                  style={{ touchAction: "manipulation" }}
                  className={`min-h-14 rounded-xl border p-2 text-left transition-colors ${
                    active
                      ? "border-cyan-400 bg-cyan-500/10"
                      : "border-slate-800 bg-slate-900/60 hover:bg-slate-800/60"
                  }`}
                >
                  <span className={`block font-mono text-xs font-bold ${active ? "text-cyan-300" : "text-slate-200"}`}>
                    {spec.motif}
                  </span>
                  <span className="mt-0.5 block text-[9px] leading-tight text-slate-400">{spec.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            {PAM_SPECS.find((spec) => spec.id === pamId)?.description}
          </p>
        </Panel>
      )}

      <Panel
        title="3 · Zielbase"
        subtitle="Tippe ein Basenpaar in der Helix oder in der Sequenzleiste an."
      >
        {selected === null || !senseBase ? (
          <p className="text-xs text-slate-500">Noch nichts ausgewählt.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex flex-col items-center">
                <span className="font-mono text-2xl font-black" style={{ color: BASE_COLORS[senseBase] }}>
                  {senseBase}
                </span>
                <span className="my-0.5 text-[10px] text-slate-600">
                  {senseBase === "G" || senseBase === "C" ? "≡" : "="}
                </span>
                <span
                  className="font-mono text-2xl font-black"
                  style={{ color: BASE_COLORS[complement(senseBase)] }}
                >
                  {complement(senseBase)}
                </span>
              </div>
              <div className="min-w-0 flex-1 text-[11px] text-slate-400">
                <p>
                  Position <span className="font-mono text-slate-200">{selected + 1}</span> der Sequenz ·{" "}
                  {senseBase === "G" || senseBase === "C" ? "3" : "2"} Wasserstoffbrücken
                </p>
                {codonInfo ? (
                  <p className="mt-1">
                    Codon{" "}
                    <span className="font-mono text-slate-200">{codonInfo.codon}</span> ={" "}
                    <span className="text-slate-200">{aminoInfo(codonInfo.amino).name}</span> (
                    {aminoInfo(codonInfo.amino).code3}
                    {codonInfo.residue}) · {codonInfo.position}. Base im Codon
                    {codonInfo.position === 3 && (
                      <span className="text-emerald-300"> · Wobble-Position</span>
                    )}
                  </p>
                ) : (
                  <p className="mt-1 text-slate-500">Liegt außerhalb der kodierenden Sequenz.</p>
                )}
              </div>
            </div>

            {editor.kind === "base" && editor.from && senseBase !== editor.from && complement(senseBase) !== editor.from && (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-200">
                Hier steht {senseBase}•{complement(senseBase)}. Der {editor.short} braucht ein{" "}
                {editor.from} auf dem Strang, auf dem die Guide-RNA sitzt. Prüfe, ob ein anderer Editor passt.
              </p>
            )}
          </div>
        )}
      </Panel>

      {usesGuide && (
        <Panel
          title="4 · Guide-RNA"
          subtitle="Sie bestimmt Strang und Editierfenster."
          action={<span className="text-[10px] text-slate-500">{rankedGuides.length} gefunden</span>}
        >
          {rankedGuides.length === 0 ? (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-[11px] text-rose-200">
              Keine passende Guide-RNA. Wähle eine andere Cas9-Variante mit lockererem PAM oder eine
              andere Zielbase.
            </p>
          ) : (
            <div className="space-y-2">
              {!rankedGuides.some((entry) => entry.hitsTarget) && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] leading-relaxed text-amber-200">
                  Keine dieser Guide-RNAs erreicht die ausgewählte Base mit dem {editor.short}. Sie
                  würden nur Nachbarbasen verändern. Prüfe Editor, Zielbase und Cas9-Variante.
                </p>
              )}
              {rankedGuides.slice(0, 6).map((entry) => {
                const active = entry.guide.id === activeGuideId;
                const target = entry.edits.find((edit) => !edit.bystander);
                return (
                  <button
                    key={entry.guide.id}
                    type="button"
                    onClick={() => onGuideChange(entry.guide.id)}
                    style={{ touchAction: "manipulation" }}
                    className={`w-full rounded-xl border p-2.5 text-left transition-colors ${
                      active
                        ? "border-emerald-400 bg-emerald-500/10"
                        : "border-slate-800 bg-slate-900/60 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-200">
                        {entry.guide.strand === 1 ? "Sinnstrang" : "Gegenstrang"}
                        {target ? ` · Position ${target.position}` : ""}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        PAM {entry.guide.pam}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <EfficiencyBar value={entry.onTarget} color={editor.color} />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">
                        Treffer am Ziel {formatPercent(entry.onTarget)}
                      </span>
                      {entry.bystanders > 0 ? (
                        <span className="text-amber-300">{entry.bystanders} Bystander</span>
                      ) : (
                        <span className="text-emerald-300">sauber</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {editor.kind === "prime" && selected !== null && (
        <Panel title="4 · Was soll dort stehen?" subtitle="Der Prime-Editor bringt seine eigene Vorlage mit.">
          <div className="grid grid-cols-3 gap-2">
            {(["substitute", "insert", "delete"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onPrimeChange({ ...prime, type })}
                style={{ touchAction: "manipulation" }}
                className={`min-h-11 rounded-xl border px-2 text-[11px] font-semibold transition-colors ${
                  prime.type === type
                    ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                    : "border-slate-800 bg-slate-900/60 text-slate-300"
                }`}
              >
                {type === "substitute" ? "Austausch" : type === "insert" ? "Einfügen" : "Löschen"}
              </button>
            ))}
          </div>

          {prime.type === "substitute" && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {(["A", "C", "G", "T"] as Base[]).map((base) => (
                <button
                  key={base}
                  type="button"
                  onClick={() => onPrimeChange({ ...prime, base })}
                  style={{ touchAction: "manipulation", color: BASE_COLORS[base] }}
                  className={`min-h-12 rounded-xl border font-mono text-lg font-black transition-colors ${
                    prime.base === base ? "border-white bg-slate-800" : "border-slate-800 bg-slate-900/60"
                  }`}
                >
                  {base}
                </button>
              ))}
            </div>
          )}

          {prime.type === "insert" && (
            <div className="mt-3">
              <label className="block text-[11px] text-slate-400" htmlFor="prime-insert">
                Einzufügende Basen (A, C, G, T – höchstens 12)
              </label>
              <input
                id="prime-insert"
                value={prime.insert}
                inputMode="text"
                autoCapitalize="characters"
                spellCheck={false}
                onChange={(event) =>
                  onPrimeChange({
                    ...prime,
                    insert: event.target.value
                      .toUpperCase()
                      .replace(/[^ACGT]/g, "")
                      .slice(0, 12),
                  })
                }
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 font-mono text-base tracking-[0.3em] text-emerald-300 outline-none focus:border-emerald-400"
                placeholder="TTT"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Wird vor der ausgewählten Position eingefügt. Nicht durch drei teilbar? Dann verschiebt
                sich das Leseraster.
              </p>
            </div>
          )}

          {prime.type === "delete" && (
            <div className="mt-3">
              <label className="block text-[11px] text-slate-400" htmlFor="prime-delete">
                Wie viele Basen entfernen? {prime.deleteLength}
              </label>
              <input
                id="prime-delete"
                type="range"
                min={1}
                max={12}
                value={prime.deleteLength}
                onChange={(event) => onPrimeChange({ ...prime, deleteLength: Number(event.target.value) })}
                className="mt-2 w-full accent-emerald-400"
              />
            </div>
          )}
        </Panel>
      )}

      {editor.kind === "base" && (
        <Panel
          title="5 · Vorhersage"
          subtitle="Base-Editoren treffen alles, was im Fenster passt – nicht nur das Ziel."
        >
          {predicted.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              Im Fenster dieser Guide-RNA liegt keine passende Base.
            </p>
          ) : (
            <ul className="space-y-2">
              {predicted.map((edit) => (
                <li
                  key={edit.senseIndex}
                  className={`rounded-lg border p-2 ${
                    edit.bystander
                      ? "border-amber-500/40 bg-amber-500/10"
                      : "border-emerald-500/40 bg-emerald-500/10"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-200">
                      Pos. {edit.senseIndex + 1}: {edit.fromSense}•{complement(edit.fromSense)} →{" "}
                      {edit.toSense}•{complement(edit.toSense)}
                    </span>
                    <span className={edit.bystander ? "text-amber-300" : "text-emerald-300"}>
                      {formatPercent(edit.efficiency)}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <EfficiencyBar value={edit.efficiency} color={edit.bystander ? "#fbbf24" : "#34d399"} />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Protospacer-Position {edit.position}
                    {edit.bystander ? " · unerwünschter Nachbar-Edit" : " · gewünschtes Ziel"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {editor.kind === "nuclease" && (
        <Panel title="5 · Warnung" subtitle="Diese Schere schneidet beide Stränge durch.">
          <p className="text-[11px] leading-relaxed text-amber-200">
            Das Ergebnis lässt sich nicht vorhersagen: Die Zelle flickt den Bruch selbst zusammen und
            verliert oder gewinnt dabei zufällig Basen. Ein gezielter Austausch eines einzelnen
            Basenpaares ist damit praktisch unmöglich. Genau deshalb wurde Base-Editing entwickelt.
          </p>
        </Panel>
      )}

      <div className="space-y-3">
        <Toggle
          checked={realistic}
          onChange={onRealisticChange}
          label="Realistische Effizienz"
          hint={realistic ? "Wie im Labor: Der Edit kann misslingen." : "Lehrmodus: Alles im Fenster wird sicher editiert."}
        />

        <ActionButton onClick={onRun} disabled={!canRun || busy} className="w-full">
          {busy
            ? "Läuft …"
            : editor.kind === "nuclease"
              ? "Doppelstrang schneiden"
              : editor.kind === "prime"
                ? "Prime-Editing starten"
                : `${editor.short} einsetzen`}
        </ActionButton>

        <div className="grid grid-cols-2 gap-2">
          <ActionButton tone="ghost" onClick={onUndo} disabled={!canUndo}>
            Rückgängig
          </ActionButton>
          <ActionButton tone="ghost" onClick={onReset}>
            Zurücksetzen
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
