/**
 * Prüft die Datengrundlage des Base-Editing-Labors:
 * Leseraster, erwartete Proteine, erreichbare Zielstellen und Fallziele.
 * Aufruf: npx tsx scripts/validate-bio.ts
 */
import { translate } from "../lib/bio/genetics";
import {
  EDITORS,
  findGuides,
  getEditor,
  guidesForTarget,
  predictEdits,
  PAM_SPECS,
  type EditorId,
  type Guide,
  type PamId,
} from "../lib/bio/editors";
import {
  CASES,
  GENES,
  getGene,
  startSequenceFor,
  HBB_SICKLE_INDEX,
  HBB_STOP39_INDEX,
  CFTR_W1282_INDEX,
  LMNA_C1824_INDEX,
  PCSK9_SPLICE_INDEX,
  PCSK9_Q12_INDEX,
  MCM6_13910_INDEX,
} from "../lib/bio/cases";
import { evaluateGenotype, referenceSequence } from "../lib/bio/phenotype";

let failures = 0;
const check = (ok: boolean, label: string, extra = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : " FAIL "} ${label}${extra ? ` — ${extra}` : ""}`);
};

console.log("\n=== Gene ===");
for (const gene of GENES) {
  check(gene.cds.length % 3 === 0, `${gene.symbol}: Leseraster`, `${gene.cds.length} nt`);
  const protein = translate(gene.cds);
  check(!protein.includes("*"), `${gene.symbol}: kein Stopp in der Referenz`);
  check(!protein.includes("?"), `${gene.symbol}: alle Codons bekannt`);
  const report = evaluateGenotype(gene, referenceSequence(gene));
  console.log(
    `        ${gene.symbol} Referenz → ${report.title} (${report.severity}, ${report.health})`,
  );
}

const HBB_MATURE =
  "VHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPKVKAHGKKV";
const hbbProtein = translate(getGene("hbb").cds);
check(hbbProtein[0] === "M", "HBB: Startcodon");
check(
  hbbProtein.slice(1) === HBB_MATURE,
  "HBB: reifes Protein entspricht β-Globin",
  hbbProtein.slice(1) === HBB_MATURE ? "" : hbbProtein.slice(1),
);

console.log("\n=== Zielstellen erreichbar? ===");
type Target = { label: string; index: number; geneId: string; editor: EditorId; sequence?: string };
const targets: Target[] = [
  { label: "HBB Sichelzelle → Makassar (ABE, Gegenstrang)", index: HBB_SICKLE_INDEX, geneId: "hbb", editor: "ABE", sequence: "sickle" },
  { label: "HBB β39 heilen (ABE, Gegenstrang)", index: HBB_STOP39_INDEX, geneId: "hbb", editor: "ABE", sequence: "thal" },
  { label: "HBB β39 erzeugen (CBE, Sinnstrang)", index: HBB_STOP39_INDEX, geneId: "hbb", editor: "CBE" },
  { label: "CFTR W1282X heilen (ABE, Sinnstrang)", index: CFTR_W1282_INDEX, geneId: "cftr-23", editor: "ABE", sequence: "w1282x" },
  { label: "LMNA c.1824 heilen (ABE, Gegenstrang)", index: LMNA_C1824_INDEX, geneId: "lmna", editor: "ABE", sequence: "progeria" },
  { label: "PCSK9 Spleiß-Donor T (ABE, Gegenstrang)", index: PCSK9_SPLICE_INDEX + 1, geneId: "pcsk9", editor: "ABE" },
  { label: "PCSK9 Q12 → Stopp (CBE, Sinnstrang)", index: PCSK9_Q12_INDEX, geneId: "pcsk9", editor: "CBE" },
  { label: "MCM6 −13910 (CBE, Sinnstrang)", index: MCM6_13910_INDEX, geneId: "mcm6", editor: "CBE" },
];

const startSequences = new Map<string, string>();
for (const labCase of CASES) {
  startSequences.set(labCase.id, startSequenceFor(labCase, getGene(labCase.geneId)));
}
const seqAlias: Record<string, string> = {
  sickle: startSequences.get("sichelzelle")!,
  thal: startSequences.get("thalassaemie")!,
  w1282x: startSequences.get("cf-w1282x")!,
  progeria: startSequences.get("progerie")!,
};

for (const target of targets) {
  const gene = getGene(target.geneId);
  const sequence = target.sequence ? seqAlias[target.sequence] : referenceSequence(gene);
  const editor = getEditor(target.editor);
  let reached = false;
  const notes: string[] = [];
  for (const pam of PAM_SPECS) {
    const guides = findGuides(sequence, pam.id as PamId);
    const usable = guidesForTarget(sequence, guides, editor, target.index);
    const best = usable
      .map((guide: Guide) => {
        const edits = predictEdits(sequence, guide, editor, target.index);
        const hit = edits.find((e) => e.senseIndex === target.index);
        const bystanders = edits.filter((e) => e.bystander && e.efficiency > 0.1).length;
        return { guide, efficiency: hit?.efficiency ?? 0, position: hit?.position ?? 0, bystanders };
      })
      .sort((a, b) => b.efficiency - a.efficiency)[0];
    if (best && best.efficiency > 0.15) {
      reached = true;
      notes.push(
        `${pam.motif}: ${usable.length}× (${best.guide.strand === 1 ? "Sinn" : "Gegen"}, Pos ${best.position}, ${Math.round(best.efficiency * 100)} %, ${best.bystanders} By)`,
      );
    }
  }
  check(reached, target.label, notes.join(" | ") || "mit keiner Cas9-Variante erreichbar");
}

console.log("\n=== Fälle ===");
for (const labCase of CASES) {
  const gene = getGene(labCase.geneId);
  const sequence = startSequences.get(labCase.id)!;
  const report = evaluateGenotype(gene, sequence);
  console.log(
    `        ${labCase.id.padEnd(14)} ${report.title} (${report.severity}, ${report.health}) sig="${report.signature}"`,
  );
  const goal = labCase.goal;
  const siteOk = goal.site
    ? sequence.slice(goal.site.index, goal.site.index + goal.site.sequence.length) ===
      goal.site.sequence
    : null;
  const already =
    siteOk !== null
      ? siteOk
      : (goal.signatures?.includes(report.signature) ?? false) ||
        (goal.severities?.includes(report.severity) ?? false);
  if (labCase.id !== "sandbox") {
    check(!already || labCase.id === "sandbox", `${labCase.id}: Startzustand erfüllt Ziel noch nicht`);
  }
}

console.log("\n=== Editoren ===");
for (const editor of EDITORS) {
  check(
    editor.kind !== "base" || (editor.from !== null && editor.to !== null),
    `${editor.short}: Umwandlung definiert`,
  );
}

console.log(failures === 0 ? "\nAlles in Ordnung.\n" : `\n${failures} Problem(e).\n`);
process.exit(failures === 0 ? 0 : 1);
