/**
 * Die Werkzeuge des Labors: Base-Editoren, Prime-Editor und die klassische
 * Cas9-Nuklease – inklusive Suche nach passenden Guide-RNAs, Vorhersage der
 * Edits im Editierfenster und Ausführung mit realistischen Effizienzen.
 */

import { type Base, complement, isBase, reverseComplement } from "./genetics";

export type EditorId = "CBE" | "ABE" | "CGBE" | "AYBE" | "PE" | "CAS9";

export type EditorKind = "base" | "prime" | "nuclease";

export interface EditorSpec {
  id: EditorId;
  kind: EditorKind;
  /** Kurzname für Buttons. */
  short: string;
  name: string;
  /** Was die Deaminase chemisch macht. */
  chemistry: string;
  /** Umwandlung auf dem Protospacer-Strang. */
  from: Base | null;
  to: Base | null;
  /** Ergebnis auf Ebene des Basenpaars, z. B. „C•G → T•A“. */
  pairChange: string;
  /** Editierfenster: Protospacer-Positionen (1 = PAM-fern). */
  window: [number, number];
  color: string;
  glow: string;
  /** Kurzbeschreibung für die Werkzeugkarte. */
  summary: string;
  /** Ausführlicher Fachtext. */
  detail: string;
  /** Typische Effizienz im Zellversuch (Anzeige). */
  typicalEfficiency: string;
  /** Erzeugt der Editor einen Doppelstrangbruch? */
  doubleStrandBreak: boolean;
  /** Reale Beispiel-Anwendung. */
  realWorld: string;
  experimental?: boolean;
}

export const EDITORS: readonly EditorSpec[] = [
  {
    id: "CBE",
    kind: "base",
    short: "CBE",
    name: "Cytosin-Base-Editor (BE4max)",
    chemistry: "Cytidin-Desaminase (APOBEC1) macht aus C ein Uracil, die DNA-Reparatur liest daraus ein T.",
    from: "C",
    to: "T",
    pairChange: "C•G → T•A",
    window: [4, 8],
    color: "#38bdf8",
    glow: "#0ea5e9",
    summary: "Schreibt C zu T um. Zusammen mit dem Gegenstrang wird aus C•G ein T•A.",
    detail:
      "Der CBE besteht aus einer Cas9-Nickase (nur ein Strang wird angeritzt), einer Cytidin-Desaminase und einem Uracil-Glykosylase-Inhibitor (UGI). Die Desaminase entfernt eine Aminogruppe am Cytosin – es entsteht Uracil. Der UGI verhindert, dass die Zelle diesen Fehler sofort ausschneidet. Beim nächsten Reparatur- oder Replikationsschritt wird das U wie ein T gelesen. Der Doppelstrang bleibt dabei ganz.",
    typicalEfficiency: "30–70 % in Zellkultur",
    doubleStrandBreak: false,
    realWorld:
      "Erste klinische Anwendung: BEAM-101 gegen Sichelzellanämie – ein CBE schaltet einen Repressor ab, damit wieder fetales Hämoglobin gebildet wird.",
  },
  {
    id: "ABE",
    kind: "base",
    short: "ABE",
    name: "Adenin-Base-Editor (ABE8e)",
    chemistry: "Eine im Labor entwickelte Adenosin-Desaminase macht aus A ein Inosin, das wie G gelesen wird.",
    from: "A",
    to: "G",
    pairChange: "A•T → G•C",
    window: [4, 8],
    color: "#f472b6",
    glow: "#ec4899",
    summary: "Schreibt A zu G um. Aus dem Basenpaar A•T wird G•C.",
    detail:
      "Adenin-Base-Editoren gab es in der Natur nicht – sie wurden durch gerichtete Evolution aus einem bakteriellen tRNA-Enzym entwickelt. Sie desaminieren Adenin zu Inosin; Polymerasen lesen Inosin als Guanin. ABE8e arbeitet besonders schnell und ist der derzeit präziseste Base-Editor.",
    typicalEfficiency: "50–80 % in Zellkultur",
    doubleStrandBreak: false,
    realWorld:
      "VERVE-101 senkt mit einem ABE dauerhaft das LDL-Cholesterin, indem es das PCSK9-Gen stilllegt. Bei Progerie-Mäusen verlängerte ein ABE die Lebenszeit um mehr als das Doppelte.",
  },
  {
    id: "CGBE",
    kind: "base",
    short: "CGBE",
    name: "C-zu-G-Base-Editor",
    chemistry: "Wie ein CBE, aber ohne UGI: Die Zelle schneidet das Uracil heraus und setzt beim Reparieren ein G ein.",
    from: "C",
    to: "G",
    pairChange: "C•G → G•C",
    window: [4, 8],
    color: "#a78bfa",
    glow: "#8b5cf6",
    summary: "Erzeugt eine Transversion C → G. Deutlich unsauberer als CBE und ABE.",
    detail:
      "Transversionen (Purin ↔ Pyrimidin) sind für Base-Editoren schwierig. Der CGBE nutzt gezielt die Basen-Exzisionsreparatur: Das Uracil wird herausgeschnitten, und eine fehleranfällige Polymerase setzt bevorzugt ein G ein. Das funktioniert – aber mit deutlich mehr Nebenprodukten (Indels, C→T).",
    typicalEfficiency: "10–40 %, stark sequenzabhängig",
    doubleStrandBreak: false,
    realWorld: "Noch Forschungswerkzeug, keine klinische Anwendung.",
    experimental: true,
  },
  {
    id: "AYBE",
    kind: "base",
    short: "A→C",
    name: "Adenin-Transversions-Editor (AYBE)",
    chemistry: "Kombination aus Adenosin-Desaminase und einer Glykosylase, die das Zwischenprodukt entfernt.",
    from: "A",
    to: "C",
    pairChange: "A•T → C•G",
    window: [4, 8],
    color: "#fbbf24",
    glow: "#f59e0b",
    summary: "Experimentelle Transversion A → C. Niedrige Effizienz, viele Nebenprodukte.",
    detail:
      "AYBEs erweitern die Palette der Base-Editoren um A→C und A→T. Sie sind erst wenige Jahre alt, arbeiten deutlich langsamer als ABE8e und erzeugen häufiger unerwünschte Nebenprodukte.",
    typicalEfficiency: "5–30 %",
    doubleStrandBreak: false,
    realWorld: "Reines Forschungswerkzeug.",
    experimental: true,
  },
  {
    id: "PE",
    kind: "prime",
    short: "PE",
    name: "Prime-Editor (PE2/PE3)",
    chemistry: "Eine Reverse Transkriptase schreibt die gewünschte Sequenz direkt von einer pegRNA-Vorlage in die DNA.",
    from: null,
    to: null,
    pairChange: "jede Base → jede Base, auch kurze Insertionen und Deletionen",
    window: [1, 30],
    color: "#34d399",
    glow: "#10b981",
    summary: "Schreibt beliebige Änderungen – die einzige Option für Transversionen und Deletionen.",
    detail:
      "Der Prime-Editor koppelt eine Cas9-Nickase an eine Reverse Transkriptase. Die pegRNA enthält nicht nur die Zieladresse, sondern auch die neue Wunschsequenz als Vorlage. Damit sind alle zwölf möglichen Basenaustausche machbar, dazu Einfügungen und Löschungen von wenigen Basen. Preis: geringere Effizienz und ein sehr viel größeres Konstrukt, das schwerer in Zellen zu bringen ist.",
    typicalEfficiency: "5–50 %, je nach Ziel",
    doubleStrandBreak: false,
    realWorld:
      "Erste Prime-Editing-Studien am Menschen laufen seit 2024, u. a. gegen die chronische Granulomatose.",
  },
  {
    id: "CAS9",
    kind: "nuclease",
    short: "Cas9",
    name: "Klassische Cas9-Nuklease",
    chemistry: "Schneidet beide Stränge durch. Die Zelle flickt den Bruch fehleranfällig wieder zusammen.",
    from: null,
    to: null,
    pairChange: "unkontrollierte Insertionen und Deletionen (Indels)",
    window: [17, 17],
    color: "#f87171",
    glow: "#ef4444",
    summary: "Zum Vergleich: der Doppelstrangbruch. Zeigt, warum Base-Editing überhaupt erfunden wurde.",
    detail:
      "Die klassische CRISPR-Cas9-Schere trennt den Doppelstrang drei Basenpaare vor dem PAM. Die Zelle repariert den Bruch meist über Non-Homologous End Joining – dabei gehen zufällig Basen verloren oder kommen dazu. Für ein gezieltes Austauschen eines einzelnen Basenpaares ist das ungeeignet: Man kann ein Gen damit zuverlässig zerstören, aber nicht korrigieren.",
    typicalEfficiency: "60–90 % Indels",
    doubleStrandBreak: true,
    realWorld:
      "Casgevy (2023 zugelassen) nutzt genau diesen Mechanismus – zum gezielten Ausschalten, nicht zum Korrigieren.",
  },
];

export function getEditor(id: EditorId): EditorSpec {
  const found = EDITORS.find((e) => e.id === id);
  if (!found) throw new Error(`Unbekannter Editor: ${id}`);
  return found;
}

/* ------------------------------------------------------------------ */
/* Guide-RNAs                                                          */
/* ------------------------------------------------------------------ */

export const PROTOSPACER_LENGTH = 20;
export const PAM_LENGTH = 3;

/**
 * Cas9-Varianten unterscheiden sich darin, welches PAM sie akzeptieren.
 * Der Wildtyp braucht NGG – damit ist längst nicht jede Stelle im Genom
 * erreichbar. Genau deshalb wurden Varianten mit gelockertem PAM entwickelt;
 * sie erkaufen die größere Reichweite mit weniger Effizienz und mehr
 * Off-Target-Aktivität.
 */
export type PamId = "NGG" | "NG" | "SpRY";

export interface PamSpec {
  id: PamId;
  label: string;
  motif: string;
  /** Effizienz im Vergleich zum Wildtyp. */
  factor: number;
  /** Faktor für das Off-Target-Risiko. */
  offTargetFactor: number;
  description: string;
}

export const PAM_SPECS: readonly PamSpec[] = [
  {
    id: "NGG",
    label: "SpCas9 (Wildtyp)",
    motif: "NGG",
    factor: 1,
    offTargetFactor: 1,
    description:
      "Das Original aus Streptococcus pyogenes. Es braucht zwingend ein NGG direkt hinter dem Protospacer. Präzise – aber viele Stellen im Genom sind damit schlicht nicht erreichbar.",
  },
  {
    id: "NG",
    label: "SpCas9-NG",
    motif: "NG",
    factor: 0.7,
    offTargetFactor: 1.6,
    description:
      "Eine im Labor umgebaute Variante, der ein einzelnes G hinter dem Protospacer genügt. Sie verdoppelt die Zahl der Zielstellen und arbeitet dafür langsamer.",
  },
  {
    id: "SpRY",
    label: "SpRY (nahezu PAM-frei)",
    motif: "NNN",
    factor: 0.45,
    offTargetFactor: 2.8,
    description:
      "Praktisch ohne PAM-Beschränkung – damit ist jede Base erreichbar. Der Preis ist hoch: deutlich geringere Effizienz und ein stark erhöhtes Risiko, an ähnlichen Stellen im Genom mitzuschneiden. SpRY bevorzugt weiterhin ein Purin (A oder G) an zweiter Position.",
  },
];

export function getPam(id: PamId): PamSpec {
  const spec = PAM_SPECS.find((p) => p.id === id);
  if (!spec) throw new Error(`Unbekanntes PAM: ${id}`);
  return spec;
}

function pamMatches(pam: string, spec: PamSpec): boolean {
  if (pam.length < PAM_LENGTH) return false;
  if (spec.id === "NGG") return pam[1] === "G" && pam[2] === "G";
  if (spec.id === "NG") return pam[1] === "G";
  return true;
}

/** SpRY arbeitet an NRN-Stellen spürbar besser als an NYN-Stellen. */
function pamEfficiency(pam: string, spec: PamSpec): number {
  if (spec.id !== "SpRY") return spec.factor;
  const purine = pam[1] === "A" || pam[1] === "G";
  return spec.factor * (purine ? 1.25 : 0.75);
}

export type Strand = 1 | -1;

export interface Guide {
  id: string;
  /** 1 = Sinnstrang (oben), −1 = Gegenstrang (unten). */
  strand: Strand;
  /** Protospacer 5'→3' auf dem jeweiligen Strang. */
  protospacer: string;
  /** Das PAM, 5'→3' auf dem jeweiligen Strang (NGG). */
  pam: string;
  /**
   * senseIndex[p − 1] = Index im Sinnstrang, an dem Protospacer-Position p liegt.
   * Für den Gegenstrang läuft diese Liste rückwärts durch die Sequenz.
   */
  senseIndex: number[];
  /** Sinnstrang-Indizes des PAM, in Leserichtung des Strangs. */
  pamSenseIndex: number[];
  /** Schnitt- bzw. Nick-Stelle zwischen Position 17 und 18. */
  nickSenseIndex: number;
  /** Cas9-Variante, mit der diese Stelle erreichbar ist. */
  pamId: PamId;
  /** Effizienzfaktor dieser PAM-Stelle. */
  pamFactor: number;
}

/**
 * Effizienz nach Protospacer-Position. Base-Editoren arbeiten in einem
 * schmalen Fenster; das Maximum liegt bei Position 6.
 */
const POSITION_EFFICIENCY: Record<number, number> = {
  1: 0.01, 2: 0.03, 3: 0.16, 4: 0.55, 5: 0.82,
  6: 0.94, 7: 0.68, 8: 0.31, 9: 0.07, 10: 0.02,
};

/**
 * Sequenzkontext: Die APOBEC1-Desaminase des CBE bevorzugt TC, ein G davor
 * bremst sie stark aus. ABE8e mag TA und AA lieber als GA.
 */
function contextFactor(editorId: EditorId, precedingBase: string | undefined): number {
  if (editorId === "CBE" || editorId === "CGBE") {
    if (precedingBase === "T") return 1.15;
    if (precedingBase === "C") return 1.0;
    if (precedingBase === "A") return 0.85;
    if (precedingBase === "G") return 0.45;
  }
  if (editorId === "ABE" || editorId === "AYBE") {
    if (precedingBase === "T") return 1.1;
    if (precedingBase === "A") return 1.0;
    if (precedingBase === "C") return 0.9;
    if (precedingBase === "G") return 0.7;
  }
  return 1;
}

function buildGuide(
  sense: string,
  strand: Strand,
  protoStartOnStrand: number,
  pamSpec: PamSpec,
): Guide | null {
  const length = sense.length;
  const strandSeq = strand === 1 ? sense : reverseComplement(sense);
  const protospacer = strandSeq.slice(protoStartOnStrand, protoStartOnStrand + PROTOSPACER_LENGTH);
  const pam = strandSeq.slice(
    protoStartOnStrand + PROTOSPACER_LENGTH,
    protoStartOnStrand + PROTOSPACER_LENGTH + PAM_LENGTH,
  );
  if (protospacer.length < PROTOSPACER_LENGTH || pam.length < PAM_LENGTH) return null;

  const toSense = (indexOnStrand: number) => (strand === 1 ? indexOnStrand : length - 1 - indexOnStrand);

  const senseIndex: number[] = [];
  for (let p = 0; p < PROTOSPACER_LENGTH; p++) senseIndex.push(toSense(protoStartOnStrand + p));

  const pamSenseIndex: number[] = [];
  for (let p = 0; p < PAM_LENGTH; p++) {
    pamSenseIndex.push(toSense(protoStartOnStrand + PROTOSPACER_LENGTH + p));
  }

  return {
    id: `${strand === 1 ? "S" : "A"}${protoStartOnStrand}-${pamSpec.id}`,
    strand,
    protospacer,
    pam,
    senseIndex,
    pamSenseIndex,
    nickSenseIndex: senseIndex[16],
    pamId: pamSpec.id,
    pamFactor: pamEfficiency(pam, pamSpec),
  };
}

/**
 * Sucht alle SpCas9-Zielstellen (PAM = NGG) auf beiden Strängen.
 * Der Protospacer liegt immer unmittelbar 5' vor dem PAM.
 */
export function findGuides(sense: string, pamId: PamId = "NGG"): Guide[] {
  const pamSpec = getPam(pamId);
  const guides: Guide[] = [];
  for (const strand of [1, -1] as const) {
    const strandSeq = strand === 1 ? sense : reverseComplement(sense);
    for (let i = PROTOSPACER_LENGTH; i + PAM_LENGTH <= strandSeq.length; i++) {
      if (pamMatches(strandSeq.slice(i, i + PAM_LENGTH), pamSpec)) {
        const guide = buildGuide(sense, strand, i - PROTOSPACER_LENGTH, pamSpec);
        if (guide) guides.push(guide);
      }
    }
  }
  return guides;
}

/* ------------------------------------------------------------------ */
/* Vorhersage                                                          */
/* ------------------------------------------------------------------ */

export interface PredictedEdit {
  /** Index im Sinnstrang. */
  senseIndex: number;
  /** Protospacer-Position 1–20. */
  position: number;
  /** Base vor der Änderung – auf dem Protospacer-Strang gelesen. */
  fromStrandBase: Base;
  toStrandBase: Base;
  /** Dieselbe Änderung, ausgedrückt für den Sinnstrang. */
  fromSense: Base;
  toSense: Base;
  efficiency: number;
  /** Liegt die Base im eigentlichen Editierfenster? */
  inWindow: boolean;
  /** Ist das ein unerwünschter Nachbar-Edit? */
  bystander: boolean;
}

/**
 * Sagt vorher, welche Basen ein Base-Editor an dieser Guide-RNA verändern würde.
 * `targetSenseIndex` markiert die gewollte Base – alles andere ist ein Bystander.
 */
export function predictEdits(
  sense: string,
  guide: Guide,
  editor: EditorSpec,
  targetSenseIndex: number | null,
): PredictedEdit[] {
  if (editor.kind !== "base" || !editor.from || !editor.to) return [];

  const edits: PredictedEdit[] = [];
  const [windowStart, windowEnd] = editor.window;
  const maxPosition = Math.max(windowEnd + 2, 10);

  for (let position = 1; position <= maxPosition; position++) {
    const strandBase = guide.protospacer[position - 1];
    if (strandBase !== editor.from) continue;

    const base = POSITION_EFFICIENCY[position] ?? 0;
    if (base <= 0) continue;

    const preceding = position >= 2 ? guide.protospacer[position - 2] : undefined;
    const efficiency = Math.min(
      0.97,
      base * contextFactor(editor.id, preceding) * guide.pamFactor,
    );
    if (efficiency < 0.02) continue;

    const senseIndex = guide.senseIndex[position - 1];
    const fromSense = (guide.strand === 1 ? editor.from : complement(editor.from)) as Base;
    const toSense = (guide.strand === 1 ? editor.to : complement(editor.to)) as Base;

    edits.push({
      senseIndex,
      position,
      fromStrandBase: editor.from,
      toStrandBase: editor.to,
      fromSense,
      toSense,
      efficiency,
      inWindow: position >= windowStart && position <= windowEnd,
      bystander: targetSenseIndex !== null && senseIndex !== targetSenseIndex,
    });
  }

  return edits.sort((a, b) => a.position - b.position);
}

/** Findet die Guide-RNAs, die eine bestimmte Base ins Editierfenster holen. */
export function guidesForTarget(
  sense: string,
  guides: Guide[],
  editor: EditorSpec,
  targetSenseIndex: number,
): Guide[] {
  if (editor.kind !== "base" || !editor.from) return [];
  const [windowStart, windowEnd] = editor.window;
  return guides.filter((guide) => {
    for (let position = windowStart; position <= windowEnd; position++) {
      if (
        guide.senseIndex[position - 1] === targetSenseIndex &&
        guide.protospacer[position - 1] === editor.from
      ) {
        return true;
      }
    }
    return false;
  });
}

/** Bewertet, wie sauber eine Guide-RNA ist: wenige Bystander = hohe Punktzahl. */
export function guideQuality(edits: PredictedEdit[], targetSenseIndex: number | null): {
  onTarget: number;
  bystanders: number;
  score: number;
} {
  const target = edits.find((e) => e.senseIndex === targetSenseIndex);
  const bystanders = edits.filter((e) => e.bystander && e.efficiency > 0.1);
  const onTarget = target?.efficiency ?? 0;
  const penalty = bystanders.reduce((sum, e) => sum + e.efficiency, 0);
  return { onTarget, bystanders: bystanders.length, score: Math.max(0, onTarget - 0.45 * penalty) };
}

/* ------------------------------------------------------------------ */
/* Ausführung                                                          */
/* ------------------------------------------------------------------ */

export interface AppliedEdit {
  senseIndex: number;
  fromSense: Base;
  toSense: Base;
  position: number | null;
  bystander: boolean;
  offTarget: boolean;
}

export interface EditOutcome {
  sequence: string;
  applied: AppliedEdit[];
  /** Vorhergesagte, aber nicht eingetretene Änderungen. */
  missed: PredictedEdit[];
  indel: { at: number; removed: number; inserted: string } | null;
  offTarget: AppliedEdit[];
}

function replaceAt(seq: string, index: number, base: Base): string {
  return seq.slice(0, index) + base + seq.slice(index + 1);
}

/**
 * Führt einen Base-Editing-Schritt aus.
 * `random` wird injiziert, damit sich Läufe im Lehrmodus reproduzieren lassen.
 */
export function applyBaseEdit(
  sense: string,
  guide: Guide,
  editor: EditorSpec,
  targetSenseIndex: number | null,
  options: { guaranteed: boolean; offTargetRisk: number; random: () => number },
): EditOutcome {
  const predicted = predictEdits(sense, guide, editor, targetSenseIndex);
  let sequence = sense;
  const applied: AppliedEdit[] = [];
  const missed: PredictedEdit[] = [];

  for (const edit of predicted) {
    const hit = options.guaranteed ? edit.efficiency > 0.05 : options.random() < edit.efficiency;
    if (hit && sequence[edit.senseIndex] === edit.fromSense) {
      sequence = replaceAt(sequence, edit.senseIndex, edit.toSense);
      applied.push({
        senseIndex: edit.senseIndex,
        fromSense: edit.fromSense,
        toSense: edit.toSense,
        position: edit.position,
        bystander: edit.bystander,
        offTarget: false,
      });
    } else {
      missed.push(edit);
    }
  }

  const offTarget: AppliedEdit[] = [];
  if (!options.guaranteed && editor.from && options.random() < options.offTargetRisk) {
    const inGuide = new Set(guide.senseIndex);
    const candidates: number[] = [];
    const fromSense = guide.strand === 1 ? editor.from : complement(editor.from);
    const toSense = guide.strand === 1 ? editor.to! : complement(editor.to!);
    for (let i = 0; i < sequence.length; i++) {
      if (!inGuide.has(i) && sequence[i] === fromSense) candidates.push(i);
    }
    if (candidates.length > 0) {
      const index = candidates[Math.floor(options.random() * candidates.length)];
      sequence = replaceAt(sequence, index, toSense as Base);
      const hit: AppliedEdit = {
        senseIndex: index,
        fromSense: fromSense as Base,
        toSense: toSense as Base,
        position: null,
        bystander: false,
        offTarget: true,
      };
      offTarget.push(hit);
      applied.push(hit);
    }
  }

  return { sequence, applied, missed, indel: null, offTarget };
}

export type PrimeOperation =
  | { type: "substitute"; base: Base }
  | { type: "insert"; bases: string }
  | { type: "delete"; length: number };

/** Prime-Editing: beliebige Änderung an genau einer Stelle, ohne Bystander. */
export function applyPrimeEdit(
  sense: string,
  senseIndex: number,
  operation: PrimeOperation,
  options: { guaranteed: boolean; efficiency: number; random: () => number },
): EditOutcome {
  const empty: EditOutcome = { sequence: sense, applied: [], missed: [], indel: null, offTarget: [] };
  if (!options.guaranteed && options.random() > options.efficiency) return empty;

  if (operation.type === "substitute") {
    const before = sense[senseIndex];
    if (!isBase(before) || before === operation.base) return empty;
    return {
      sequence: replaceAt(sense, senseIndex, operation.base),
      applied: [
        {
          senseIndex,
          fromSense: before,
          toSense: operation.base,
          position: null,
          bystander: false,
          offTarget: false,
        },
      ],
      missed: [],
      indel: null,
      offTarget: [],
    };
  }

  if (operation.type === "insert") {
    return {
      sequence: sense.slice(0, senseIndex) + operation.bases + sense.slice(senseIndex),
      applied: [],
      missed: [],
      indel: { at: senseIndex, removed: 0, inserted: operation.bases },
      offTarget: [],
    };
  }

  const removed = sense.slice(senseIndex, senseIndex + operation.length);
  return {
    sequence: sense.slice(0, senseIndex) + sense.slice(senseIndex + operation.length),
    applied: [],
    missed: [],
    indel: { at: senseIndex, removed: removed.length, inserted: "" },
    offTarget: [],
  };
}

/**
 * Doppelstrangbruch mit anschließender fehlerhafter Reparatur (NHEJ).
 * Das Ergebnis ist absichtlich unvorhersehbar – genau das ist der Lerninhalt.
 */
export function applyNucleaseCut(
  sense: string,
  guide: Guide,
  random: () => number,
): EditOutcome {
  const cutIndex = Math.min(guide.nickSenseIndex, sense.length - 1);
  const roll = random();

  if (roll < 0.18) {
    return { sequence: sense, applied: [], missed: [], indel: null, offTarget: [] };
  }

  if (roll < 0.78) {
    const length = 1 + Math.floor(random() * 5);
    const start = Math.max(0, cutIndex - Math.floor(length / 2));
    const removed = sense.slice(start, start + length);
    return {
      sequence: sense.slice(0, start) + sense.slice(start + length),
      applied: [],
      missed: [],
      indel: { at: start, removed: removed.length, inserted: "" },
      offTarget: [],
    };
  }

  const inserted = (["A", "C", "G", "T"] as const)[Math.floor(random() * 4)];
  return {
    sequence: sense.slice(0, cutIndex) + inserted + sense.slice(cutIndex),
    applied: [],
    missed: [],
    indel: { at: cutIndex, removed: 0, inserted },
    offTarget: [],
  };
}
