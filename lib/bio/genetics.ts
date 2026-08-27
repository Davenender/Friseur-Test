/**
 * Molekulargenetische Grundlagen für das Base-Editing-Labor.
 * Reine Funktionen, keine React-Abhängigkeit – dadurch testbar und
 * sowohl auf dem Server als auch im Client verwendbar.
 */

export type Base = "A" | "C" | "G" | "T";

export const BASES: readonly Base[] = ["A", "C", "G", "T"] as const;

export const PURINES: readonly Base[] = ["A", "G"] as const;

/** Wasserstoffbrücken pro Basenpaar: A=T zwei, G≡C drei. */
export const H_BONDS: Record<Base, number> = { A: 2, T: 2, G: 3, C: 3 };

const COMPLEMENT: Record<Base, Base> = { A: "T", T: "A", G: "C", C: "G" };

export function isBase(value: string): value is Base {
  return value === "A" || value === "C" || value === "G" || value === "T";
}

export function complement(base: Base): Base {
  return COMPLEMENT[base];
}

export function isPurine(base: Base): boolean {
  return base === "A" || base === "G";
}

/** Wandelt A↔G bzw. C↔T: gleiche Basenklasse = Transition. */
export function isTransition(from: Base, to: Base): boolean {
  return isPurine(from) === isPurine(to) && from !== to;
}

export function complementStrand(seq: string): string {
  let out = "";
  for (const ch of seq) out += isBase(ch) ? COMPLEMENT[ch] : ch;
  return out;
}

/** Reverses Komplement – der Gegenstrang, gelesen von 5' nach 3'. */
export function reverseComplement(seq: string): string {
  let out = "";
  for (let i = seq.length - 1; i >= 0; i--) {
    const ch = seq[i];
    out += isBase(ch) ? COMPLEMENT[ch] : ch;
  }
  return out;
}

export function sanitizeSequence(input: string): string {
  return input
    .toUpperCase()
    .split("")
    .filter((ch): ch is Base => isBase(ch))
    .join("");
}

/* ------------------------------------------------------------------ */
/* Genetischer Code                                                    */
/* ------------------------------------------------------------------ */

export const CODON_TABLE: Readonly<Record<string, string>> = {
  TTT: "F", TTC: "F", TTA: "L", TTG: "L",
  CTT: "L", CTC: "L", CTA: "L", CTG: "L",
  ATT: "I", ATC: "I", ATA: "I", ATG: "M",
  GTT: "V", GTC: "V", GTA: "V", GTG: "V",
  TCT: "S", TCC: "S", TCA: "S", TCG: "S",
  CCT: "P", CCC: "P", CCA: "P", CCG: "P",
  ACT: "T", ACC: "T", ACA: "T", ACG: "T",
  GCT: "A", GCC: "A", GCA: "A", GCG: "A",
  TAT: "Y", TAC: "Y", TAA: "*", TAG: "*",
  CAT: "H", CAC: "H", CAA: "Q", CAG: "Q",
  AAT: "N", AAC: "N", AAA: "K", AAG: "K",
  GAT: "D", GAC: "D", GAA: "E", GAG: "E",
  TGT: "C", TGC: "C", TGA: "*", TGG: "W",
  CGT: "R", CGC: "R", CGA: "R", CGG: "R",
  AGT: "S", AGC: "S", AGA: "R", AGG: "R",
  GGT: "G", GGC: "G", GGA: "G", GGG: "G",
};

export type AminoProperty = "unpolar" | "polar" | "sauer" | "basisch" | "stopp";

export interface AminoAcidInfo {
  code1: string;
  code3: string;
  name: string;
  property: AminoProperty;
}

export const AMINO_ACIDS: Readonly<Record<string, AminoAcidInfo>> = {
  A: { code1: "A", code3: "Ala", name: "Alanin", property: "unpolar" },
  R: { code1: "R", code3: "Arg", name: "Arginin", property: "basisch" },
  N: { code1: "N", code3: "Asn", name: "Asparagin", property: "polar" },
  D: { code1: "D", code3: "Asp", name: "Asparaginsäure", property: "sauer" },
  C: { code1: "C", code3: "Cys", name: "Cystein", property: "polar" },
  E: { code1: "E", code3: "Glu", name: "Glutaminsäure", property: "sauer" },
  Q: { code1: "Q", code3: "Gln", name: "Glutamin", property: "polar" },
  G: { code1: "G", code3: "Gly", name: "Glycin", property: "unpolar" },
  H: { code1: "H", code3: "His", name: "Histidin", property: "basisch" },
  I: { code1: "I", code3: "Ile", name: "Isoleucin", property: "unpolar" },
  L: { code1: "L", code3: "Leu", name: "Leucin", property: "unpolar" },
  K: { code1: "K", code3: "Lys", name: "Lysin", property: "basisch" },
  M: { code1: "M", code3: "Met", name: "Methionin", property: "unpolar" },
  F: { code1: "F", code3: "Phe", name: "Phenylalanin", property: "unpolar" },
  P: { code1: "P", code3: "Pro", name: "Prolin", property: "unpolar" },
  S: { code1: "S", code3: "Ser", name: "Serin", property: "polar" },
  T: { code1: "T", code3: "Thr", name: "Threonin", property: "polar" },
  W: { code1: "W", code3: "Trp", name: "Tryptophan", property: "unpolar" },
  Y: { code1: "Y", code3: "Tyr", name: "Tyrosin", property: "polar" },
  V: { code1: "V", code3: "Val", name: "Valin", property: "unpolar" },
  "*": { code1: "*", code3: "Ter", name: "Stopp", property: "stopp" },
};

export function aminoInfo(code1: string): AminoAcidInfo {
  return AMINO_ACIDS[code1] ?? { code1: "?", code3: "Xaa", name: "unbekannt", property: "polar" };
}

/** Übersetzt eine kodierende DNA-Sequenz (Sinnstrang, 5'→3') in Aminosäuren. */
export function translate(cds: string): string {
  let protein = "";
  for (let i = 0; i + 2 < cds.length; i += 3) {
    protein += CODON_TABLE[cds.slice(i, i + 3)] ?? "?";
  }
  return protein;
}

export function codonAt(cds: string, codonIndex: number): string {
  return cds.slice(codonIndex * 3, codonIndex * 3 + 3);
}

/** Index der Base innerhalb der Sequenz → 0-basierter Codon-Index. */
export function codonIndexOfBase(baseIndex: number): number {
  return Math.floor(baseIndex / 3);
}

/** Position der Base im Codon: 1, 2 oder 3. */
export function positionInCodon(baseIndex: number): 1 | 2 | 3 {
  return ((baseIndex % 3) + 1) as 1 | 2 | 3;
}

/**
 * Wobble-Position: die dritte Base eines Codons ist häufig austauschbar,
 * ohne dass sich die Aminosäure ändert (Degeneration des Codes).
 */
export function isWobble(baseIndex: number): boolean {
  return positionInCodon(baseIndex) === 3;
}

/* ------------------------------------------------------------------ */
/* Proteinvergleich                                                    */
/* ------------------------------------------------------------------ */

export interface AminoChange {
  /** 0-basierter Codon-Index in der Sequenz. */
  codonIndex: number;
  /** Angezeigte Restnummer (inkl. gen-spezifischem Offset). */
  residue: number;
  from: string;
  to: string;
  /** Kurzschreibweise wie „E6V“. */
  key: string;
}

/**
 * Vergleicht zwei Proteine gleicher Länge und liefert alle Austausche.
 * `offset` verschiebt die angezeigte Nummerierung (z. B. −1 bei HBB,
 * weil in der Literatur ohne Start-Methionin gezählt wird).
 */
export function diffProteins(reference: string, current: string, offset = 0): AminoChange[] {
  const changes: AminoChange[] = [];
  const len = Math.min(reference.length, current.length);
  for (let i = 0; i < len; i++) {
    if (reference[i] !== current[i]) {
      const residue = i + 1 + offset;
      changes.push({
        codonIndex: i,
        residue,
        from: reference[i],
        to: current[i],
        key: `${reference[i]}${residue}${current[i]}`,
      });
    }
  }
  return changes;
}

export function formatChangeLong(change: AminoChange): string {
  const from = aminoInfo(change.from);
  const to = aminoInfo(change.to);
  return `p.${from.code3}${change.residue}${to.code3}`;
}

/** GC-Gehalt in Prozent – ein Standardmaß für die Stabilität eines Abschnitts. */
export function gcContent(seq: string): number {
  if (seq.length === 0) return 0;
  let gc = 0;
  for (const ch of seq) if (ch === "G" || ch === "C") gc++;
  return (gc / seq.length) * 100;
}

/** Schmelztemperatur nach der einfachen Wallace-Regel (didaktisch). */
export function meltingTemperature(seq: string): number {
  let at = 0;
  let gc = 0;
  for (const ch of seq) {
    if (ch === "A" || ch === "T") at++;
    else if (ch === "G" || ch === "C") gc++;
  }
  return 2 * at + 4 * gc;
}
