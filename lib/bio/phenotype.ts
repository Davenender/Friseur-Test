/**
 * Auswertung eines Genotyps: Aus der aktuellen DNA-Sequenz wird das Protein
 * abgeleitet, mit der Referenz verglichen und daraus ein Krankheitsbild
 * bestimmt – über bekannte Varianten, regulatorische Stellen und allgemeine
 * Mutationsregeln.
 */

import {
  type AminoChange,
  diffProteins,
  formatChangeLong,
  translate,
} from "./genetics";

export type Severity =
  | "enhanced"
  | "healthy"
  | "benign"
  | "carrier"
  | "unknown"
  | "mild"
  | "severe"
  | "critical";

export const SEVERITY_ORDER: Record<Severity, number> = {
  enhanced: 0,
  healthy: 1,
  benign: 2,
  carrier: 3,
  unknown: 4,
  mild: 5,
  severe: 6,
  critical: 7,
};

export const SEVERITY_STYLE: Record<Severity, { label: string; color: string; ring: string }> = {
  enhanced: { label: "verbessert", color: "#38bdf8", ring: "rgba(56,189,248,0.35)" },
  healthy: { label: "gesund", color: "#34d399", ring: "rgba(52,211,153,0.35)" },
  benign: { label: "gutartig", color: "#a3e635", ring: "rgba(163,230,53,0.35)" },
  carrier: { label: "Anlageträger", color: "#facc15", ring: "rgba(250,204,21,0.35)" },
  unknown: { label: "unklar", color: "#94a3b8", ring: "rgba(148,163,184,0.35)" },
  mild: { label: "leicht betroffen", color: "#fb923c", ring: "rgba(251,146,60,0.35)" },
  severe: { label: "schwer betroffen", color: "#f87171", ring: "rgba(248,113,113,0.35)" },
  critical: { label: "lebensbedrohlich", color: "#e11d48", ring: "rgba(225,29,72,0.4)" },
};

export interface Phenotype {
  title: string;
  severity: Severity;
  health: number;
  summary: string;
  symptoms: string[];
  /** Warum? Der fachliche Hintergrund. */
  mechanism?: string;
}

export interface Finding {
  severity: Severity;
  title: string;
  text: string;
  /** Optional: Kürzel wie „p.Glu6Val“. */
  code?: string;
}

/** Eine bekannte Variante: exakt diese Aminosäure-Austausche. */
export interface VariantRule {
  keys: string[];
  hgvs?: string;
  phenotype: Phenotype;
}

/** Eine funktionelle Stelle außerhalb des Leserasters (Spleißstelle, Promotor …). */
export interface SiteMarker {
  id: string;
  /** Startindex im Sinnstrang. */
  index: number;
  wildType: string;
  label: string;
  description: string;
  /** Phänotyp je beobachteter Sequenz. */
  alleles?: Record<string, Phenotype>;
  /** Phänotyp, wenn die Stelle anders verändert wurde. */
  fallback?: Phenotype;
  /** Phänotyp für die Wildtyp-Sequenz (z. B. „laktoseintolerant“). */
  wildTypePhenotype?: Phenotype;
}

/** Ein Genotyp, der an der kompletten Sequenz erkannt wird – etwa eine Deletion. */
export interface ExactVariantRule {
  id: string;
  sequence: string;
  hgvs?: string;
  phenotype: Phenotype;
}

export type GeneKind = "coding" | "regulatory";

export interface GeneDef {
  id: string;
  symbol: string;
  name: string;
  locus: string;
  kind: GeneKind;
  /** Nicht-kodierender Bereich vor dem Startcodon (Sinnstrang). */
  leader: string;
  /** Kodierende Sequenz, Länge durch 3 teilbar. Bei regulatorischen Genen leer. */
  cds: string;
  /** Nicht-kodierender Bereich dahinter (z. B. Intronanfang). */
  trailer: string;
  /** Verschiebung der angezeigten Restnummer gegenüber dem Codon-Index. */
  proteinOffset: number;
  /** Verlust der Genfunktion: schädlich, schützend oder folgenlos. */
  lossOfFunction: "harmful" | "protective" | "neutral";
  lossOfFunctionPhenotype?: Phenotype;
  variants: VariantRule[];
  /** Genotypen, die über die komplette Sequenz erkannt werden (z. B. Deletionen). */
  exactVariants: ExactVariantRule[];
  markers: SiteMarker[];
  /** Ehrlichkeitshinweis zur Herkunft der Sequenz. */
  sequenceNote: string;
  healthyPhenotype: Phenotype;
}

export function referenceSequence(gene: GeneDef): string {
  return gene.leader + gene.cds + gene.trailer;
}

export function cdsStart(gene: GeneDef): number {
  return gene.leader.length;
}

export function cdsEnd(gene: GeneDef): number {
  return gene.leader.length + gene.cds.length;
}

/** Schneidet aus der Gesamtsequenz den kodierenden Teil heraus. */
export function extractCds(gene: GeneDef, sequence: string): string {
  const start = cdsStart(gene);
  const end = sequence.length - gene.trailer.length;
  return sequence.slice(start, Math.max(start, end));
}

function worse(a: Severity, b: Severity): Severity {
  return SEVERITY_ORDER[a] >= SEVERITY_ORDER[b] ? a : b;
}

export interface GenotypeReport {
  health: number;
  severity: Severity;
  title: string;
  summary: string;
  symptoms: string[];
  mechanism?: string;
  findings: Finding[];
  protein: string;
  referenceProtein: string;
  changes: AminoChange[];
  frameshift: boolean;
  lengthDelta: number;
  /** Codon-Index des ersten vorzeitigen Stopps, sonst null. */
  prematureStop: number | null;
  /** Signatur für Zielabgleich: sortierte Änderungsschlüssel. */
  signature: string;
}

function keySetEquals(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

/**
 * Hauptauswertung. Reihenfolge: Rasterschub → funktionelle Stellen →
 * bekannte Varianten → allgemeine Regeln (Nonsense, Missense, stumm).
 */
export function evaluateGenotype(gene: GeneDef, sequence: string): GenotypeReport {
  const reference = referenceSequence(gene);
  const lengthDelta = sequence.length - reference.length;

  const referenceProtein = gene.kind === "coding" ? translate(gene.cds) : "";
  const currentCds = gene.kind === "coding" ? extractCds(gene, sequence) : "";
  const protein = gene.kind === "coding" ? translate(currentCds) : "";

  const findings: Finding[] = [];
  let severity: Severity = "healthy";
  let phenotype: Phenotype = gene.healthyPhenotype;
  let matched = false;

  const frameshift = gene.kind === "coding" && lengthDelta % 3 !== 0;

  /* 0 — Exakt bekannter Genotyp (z. B. eine benannte Deletion) -------- */
  const exact = gene.exactVariants.find((rule) => rule.sequence === sequence);
  if (exact) {
    findings.push({
      severity: exact.phenotype.severity,
      title: exact.phenotype.title,
      text: exact.phenotype.summary,
      code: exact.hgvs,
    });
    phenotype = exact.phenotype;
    severity = exact.phenotype.severity;
    matched = true;
  }

  /* 1 — Rasterschub oder In-Frame-Indel ------------------------------ */
  if (lengthDelta !== 0) {
    if (frameshift) {
      findings.push({
        severity: "critical",
        title: "Rasterschubmutation (Frameshift)",
        text: `Die Sequenz ist um ${Math.abs(lengthDelta)} Base${
          Math.abs(lengthDelta) === 1 ? "" : "n"
        } ${lengthDelta > 0 ? "länger" : "kürzer"} geworden. Ab dieser Stelle wird das Leseraster verschoben – jedes folgende Codon ist falsch. Das Protein ist praktisch immer zerstört.`,
      });
      severity = "critical";
      if (!matched) phenotype = gene.lossOfFunctionPhenotype ?? {
        title: "Genfunktion zerstört",
        severity: "critical",
        health: gene.lossOfFunction === "protective" ? 82 : 12,
        summary: "Durch den Rasterschub entsteht kein funktionsfähiges Protein mehr.",
        symptoms: [],
      };
      matched = true;
    } else {
      findings.push({
        severity: "mild",
        title: "Insertion/Deletion im Leseraster",
        text: `${Math.abs(lengthDelta) / 3} Aminosäure${
          Math.abs(lengthDelta) / 3 === 1 ? "" : "n"
        } ${lengthDelta > 0 ? "eingefügt" : "entfernt"}. Das Leseraster bleibt erhalten, das Protein ist aber verändert.`,
      });
      severity = worse(severity, "mild");
    }
  }

  /* 2 — Funktionelle Stellen ---------------------------------------- */
  if (lengthDelta === 0) {
    for (const marker of gene.markers) {
      const observed = sequence.slice(marker.index, marker.index + marker.wildType.length);
      if (observed === marker.wildType) {
        if (marker.wildTypePhenotype && !matched) {
          phenotype = marker.wildTypePhenotype;
          severity = worse(severity, marker.wildTypePhenotype.severity);
          matched = true;
          findings.push({
            severity: marker.wildTypePhenotype.severity,
            title: marker.label,
            text: marker.description,
          });
        }
        continue;
      }

      const allele = marker.alleles?.[observed] ?? marker.fallback;
      if (allele) {
        findings.push({
          severity: allele.severity,
          title: `${marker.label}: ${marker.wildType} → ${observed}`,
          text: allele.summary,
        });
        if (!matched || SEVERITY_ORDER[allele.severity] > SEVERITY_ORDER[severity]) {
          phenotype = allele;
          matched = true;
        }
        severity = worse(severity, allele.severity);
      } else {
        findings.push({
          severity: "unknown",
          title: `${marker.label} verändert`,
          text: `Die Stelle „${marker.wildType}“ wurde zu „${observed}“. ${marker.description}`,
        });
        severity = worse(severity, "unknown");
      }
    }
  }

  /* 3 — Protein vergleichen ----------------------------------------- */
  const changes =
    gene.kind === "coding" && !frameshift
      ? diffProteins(referenceProtein, protein, gene.proteinOffset)
      : [];

  const stopIndex = protein.indexOf("*");
  const prematureStop =
    gene.kind === "coding" && stopIndex >= 0 && stopIndex < referenceProtein.length - 1
      ? stopIndex
      : null;

  const changeKeys = changes.map((c) => c.key);

  if (!frameshift && lengthDelta === 0 && gene.kind === "coding") {
    const rule = gene.variants.find((variant) => keySetEquals(variant.keys, changeKeys));

    if (rule) {
      findings.push({
        severity: rule.phenotype.severity,
        title: rule.phenotype.title,
        text: rule.phenotype.summary,
        code: rule.hgvs ?? changes.map(formatChangeLong).join(", "),
      });
      if (!matched || SEVERITY_ORDER[rule.phenotype.severity] >= SEVERITY_ORDER[severity]) {
        phenotype = rule.phenotype;
        matched = true;
      }
      severity = worse(severity, rule.phenotype.severity);
    } else if (prematureStop !== null) {
      const residue = prematureStop + 1 + gene.proteinOffset;
      const protective = gene.lossOfFunction === "protective";
      const stopPhenotype: Phenotype =
        gene.lossOfFunctionPhenotype ?? {
          title: protective ? "Genfunktion ausgeschaltet" : "Nonsense-Mutation",
          severity: protective ? "enhanced" : "severe",
          health: protective ? 88 : 22,
          summary: protective
            ? "Das Gen ist stillgelegt – in diesem Fall ein erwünschter Effekt."
            : "Das Protein bricht vorzeitig ab und ist funktionslos.",
          symptoms: [],
        };
      findings.push({
        severity: stopPhenotype.severity,
        title: `Vorzeitiges Stoppcodon an Position ${residue}`,
        text: `Aus einem Aminosäure-Codon wurde ein Stoppcodon. Die Ribosomen halten hier an; das Protein bleibt ein Fragment. Zusätzlich baut die Zelle solche mRNAs oft gleich ab (Nonsense-mediated Decay).`,
        code: `p.(${residue}Ter)`,
      });
      if (!matched) {
        phenotype = stopPhenotype;
        matched = true;
      }
      severity = worse(severity, stopPhenotype.severity);
    } else if (changes.length > 0) {
      for (const change of changes) {
        findings.push({
          severity: "unknown",
          title: `Missense-Mutation ${change.key}`,
          text: "Diese Variante steht in keiner Datenbank. In der Praxis heißt das: Variante unklarer Signifikanz (VUS) – man weiß schlicht nicht, was sie anrichtet.",
          code: formatChangeLong(change),
        });
      }
      if (!matched) {
        phenotype = {
          title: "Variante unklarer Signifikanz",
          severity: "unknown",
          health: Math.max(45, 85 - changes.length * 8),
          summary:
            "Das Protein ist verändert, die Folgen sind unbekannt. Genau solche Befunde sind in der Humangenetik der Alltag – und der Grund, warum man nicht einfach drauflos editiert.",
          symptoms: ["Keine eindeutige Prognose möglich"],
        };
        matched = true;
      }
      severity = worse(severity, "unknown");
    }
  }

  /* 4 — Stille Änderungen sichtbar machen --------------------------- */
  if (lengthDelta === 0 && gene.kind === "coding" && changes.length === 0) {
    const silent = countSilentChanges(gene, sequence);
    if (silent > 0) {
      findings.push({
        severity: "benign",
        title: `${silent} stumme Basenänderung${silent === 1 ? "" : "en"}`,
        text: "Die DNA ist verändert, das Protein nicht – der genetische Code ist degeneriert. Achtung: Auch stumme Mutationen können Spleißstellen zerstören.",
      });
    }
  }

  if (!matched) phenotype = gene.healthyPhenotype;

  // Der angezeigte Schweregrad geht vom erkannten Phänotyp aus und wird nur von
  // Befunden nach oben korrigiert. Sonst könnte ein „besser als gesund“-Ergebnis
  // (etwa ein gezielt stillgelegtes PCSK9) nie sichtbar werden.
  let finalSeverity = phenotype.severity;
  for (const finding of findings) finalSeverity = worse(finalSeverity, finding.severity);

  const health = Math.max(0, Math.min(100, phenotype.health));

  return {
    health,
    severity: finalSeverity,
    title: phenotype.title,
    summary: phenotype.summary,
    symptoms: phenotype.symptoms,
    mechanism: phenotype.mechanism,
    findings,
    protein,
    referenceProtein,
    changes,
    frameshift,
    lengthDelta,
    prematureStop,
    signature:
      lengthDelta !== 0
        ? `indel${lengthDelta > 0 ? "+" : ""}${lengthDelta}`
        : [...changeKeys].sort().join("+"),
  };
}

/**
 * Zählt Basenänderungen, die das Protein nicht verändern. Nur der kodierende
 * Bereich zählt – eine Änderung im Intron ist keine stumme Mutation, sondern
 * wird bereits über die Spleißstellen bewertet.
 */
export function countSilentChanges(gene: GeneDef, sequence: string): number {
  const reference = referenceSequence(gene);
  const from = gene.kind === "coding" ? cdsStart(gene) : 0;
  const to = gene.kind === "coding" ? cdsEnd(gene) : reference.length;
  let count = 0;
  const length = Math.min(reference.length, sequence.length, to);
  for (let i = from; i < length; i++) if (reference[i] !== sequence[i]) count++;
  return count;
}

/** Alle Basenunterschiede zur Referenz – für die Sequenzanzeige. */
export function changedIndices(gene: GeneDef, sequence: string): Set<number> {
  const reference = referenceSequence(gene);
  const set = new Set<number>();
  const length = Math.min(reference.length, sequence.length);
  for (let i = 0; i < length; i++) if (reference[i] !== sequence[i]) set.add(i);
  return set;
}
