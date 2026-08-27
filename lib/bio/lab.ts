/**
 * Bindeglied zwischen Daten und Oberfläche: Zielprüfung, Protokolleinträge
 * und ein paar Auswertungen, die die UI mehrfach braucht.
 */

import type { LabCase, LabGoal } from "./cases";
import type { GenotypeReport } from "./phenotype";
import { type Guide, type PredictedEdit, guideQuality } from "./editors";

export type LogKind = "edit" | "info" | "warn" | "fail" | "success";

export interface LogEntry {
  id: number;
  kind: LogKind;
  title: string;
  detail: string;
  /** Uhrzeit, erst im Client gesetzt – sonst gäbe es Hydrationsfehler. */
  time: string;
}

export function checkGoal(goal: LabGoal, report: GenotypeReport, sequence: string): boolean {
  if (goal.site) {
    const observed = sequence.slice(goal.site.index, goal.site.index + goal.site.sequence.length);
    if (observed !== goal.site.sequence) return false;
    if (!goal.signatures && !goal.severities && goal.minHealth === undefined) return true;
  }
  if (goal.signatures?.includes(report.signature)) return true;
  if (goal.severities?.includes(report.severity)) return true;
  if (goal.minHealth !== undefined && report.health >= goal.minHealth) return true;
  return false;
}

export function hasGoal(labCase: LabCase): boolean {
  const { goal } = labCase;
  return Boolean(goal.signatures || goal.severities || goal.site || goal.minHealth !== undefined);
}

export interface RankedGuide {
  guide: Guide;
  edits: PredictedEdit[];
  onTarget: number;
  bystanders: number;
  score: number;
  hitsTarget: boolean;
}

/** Sortiert Guide-RNAs so, dass die sauberste Option oben steht. */
export function rankGuides(
  guides: Guide[],
  predict: (guide: Guide) => PredictedEdit[],
  targetSenseIndex: number | null,
): RankedGuide[] {
  return guides
    .map((guide) => {
      const edits = predict(guide);
      const quality = guideQuality(edits, targetSenseIndex);
      return {
        guide,
        edits,
        onTarget: quality.onTarget,
        bystanders: quality.bystanders,
        score: quality.score,
        hitsTarget: quality.onTarget > 0,
      };
    })
    .filter((entry) => entry.edits.length > 0)
    .sort((a, b) => {
      if (a.hitsTarget !== b.hitsTarget) return a.hitsTarget ? -1 : 1;
      return b.score - a.score;
    });
}

export function formatPercent(value: number): string {
  if (value <= 0) return "0 %";
  if (value < 0.01) return "< 1 %";
  return `${Math.round(value * 100)} %`;
}

/** Kurzbeschreibung eines Basenpaars für die Kopfzeile. */
export function describePair(base: string, complementBase: string): string {
  const bonds = base === "G" || base === "C" ? 3 : 2;
  return `${base}•${complementBase} · ${bonds} Wasserstoffbrücken`;
}
