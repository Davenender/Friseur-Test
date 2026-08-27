/**
 * Gene und Fälle des Base-Editing-Labors.
 *
 * Wichtig für die Einordnung: Varianten, Positionen und Mechanismen sind real.
 * Die Sequenzen sind Ausschnitte – beim HBB-Gen der echte Abschnitt, bei den
 * übrigen Genen didaktisch vereinfachte Lehrsequenzen, damit alle Zielstellen
 * mit einer handhabbaren Sequenzlänge erreichbar bleiben.
 */

import type { GeneDef, Phenotype, Severity } from "./phenotype";

const codons = (...list: string[]) => list.join("");

/* ================================================================== */
/* HBB – β-Globin                                                      */
/* ================================================================== */

/** Echter 5'-untranslatierter Bereich des humanen HBB-Gens (50 nt). */
const HBB_LEADER = "ACATTTGCTTCTGACACAACTGTGTTCACTAGCAACCTCAAACAGACACC";

/** Echte kodierende Sequenz, Codon 1–68 (Met + Aminosäure 1–67). */
const HBB_CDS = codons(
  "ATG", "GTG", "CAT", "CTG", "ACT", "CCT", "GAG", "GAG", "AAG", "TCT",
  "GCC", "GTT", "ACT", "GCC", "CTG", "TGG", "GGC", "AAG", "GTG", "AAC",
  "GTG", "GAT", "GAA", "GTT", "GGT", "GGT", "GAG", "GCC", "CTG", "GGC",
  "AGG", "CTG", "CTG", "GTG", "GTC", "TAT", "CCT", "TGG", "ACC", "CAG",
  "CGT", "TTC", "TTT", "GAG", "TCT", "TTT", "GGT", "GAC", "CTG", "AGC",
  "ACC", "CCT", "GAT", "GCT", "GTC", "ATG", "GGC", "AAC", "CCT", "AAG",
  "GTG", "AAG", "GCT", "CAT", "GGC", "AAG", "AAA", "GTG",
);

/** Sinnstrang-Index einer Base: Codon-Nummer (1-basiert) und Position im Codon. */
function baseIndex(leader: string, codonNumber: number, positionInCodon: 1 | 2 | 3): number {
  return leader.length + (codonNumber - 1) * 3 + (positionInCodon - 1);
}

export const HBB_SICKLE_INDEX = baseIndex(HBB_LEADER, 7, 2); // GAG → GTG
export const HBB_STOP39_INDEX = baseIndex(HBB_LEADER, 40, 1); // CAG → TAG

const HBB_HEALTHY: Phenotype = {
  title: "Gesundes β-Globin",
  severity: "healthy",
  health: 100,
  summary:
    "Beide β-Globin-Ketten falten sich korrekt und binden zusammen mit den α-Ketten den Sauerstoff. Die roten Blutkörperchen sind rund und flexibel.",
  symptoms: [],
  mechanism:
    "Hämoglobin A besteht aus zwei α- und zwei β-Ketten. Jede Kette trägt ein Häm-Molekül mit einem Eisenion, an das Sauerstoff reversibel bindet.",
};

export const HBB: GeneDef = {
  id: "hbb",
  symbol: "HBB",
  name: "β-Globin (Hämoglobin-Untereinheit β)",
  locus: "Chromosom 11p15.4",
  kind: "coding",
  leader: HBB_LEADER,
  cds: HBB_CDS,
  trailer: "",
  proteinOffset: -1,
  lossOfFunction: "harmful",
  lossOfFunctionPhenotype: {
    title: "β⁰-Thalassämie",
    severity: "critical",
    health: 18,
    summary:
      "Es entsteht überhaupt kein funktionsfähiges β-Globin mehr. Die überschüssigen α-Ketten fallen in den Vorläuferzellen aus und zerstören sie.",
    symptoms: [
      "Schwere Blutarmut ab dem 6. Lebensmonat",
      "Lebenslang alle 2–4 Wochen Bluttransfusionen",
      "Eisenüberladung von Herz und Leber",
    ],
    mechanism:
      "Ohne β-Ketten kann kein Hämoglobin A gebildet werden. Der Körper versucht gegenzusteuern und weitet das Knochenmark aus.",
  },
  sequenceNote:
    "Echte Sequenz: 5'-UTR und Codon 1–68 des humanen HBB-Gens. Gezählt wird wie in der Literatur ohne Start-Methionin, deshalb heißt die Sichelzellmutation E6V und nicht E7V.",
  healthyPhenotype: HBB_HEALTHY,
  exactVariants: [],
  markers: [],
  variants: [
    {
      keys: ["E6V"],
      hgvs: "p.Glu6Val (HbS)",
      phenotype: {
        title: "Sichelzellanämie (HbS)",
        severity: "severe",
        health: 34,
        summary:
          "Die geladene Glutaminsäure ist durch das wasserabweisende Valin ersetzt. Bei Sauerstoffmangel verhaken sich die Hämoglobin-Moleküle zu langen Fasern und verformen die Blutkörperchen zu Sicheln.",
        symptoms: [
          "Schmerzkrisen durch verstopfte Kapillaren",
          "Chronische Blutarmut, ständige Müdigkeit",
          "Erhöhtes Risiko für Schlaganfälle und Infektionen",
        ],
        mechanism:
          "Valin ist unpolar. Auf der Oberfläche des Hämoglobins entsteht ein klebriger Fleck, der in eine Tasche des Nachbarmoleküls passt – die Moleküle polymerisieren.",
      },
    },
    {
      keys: ["E6A"],
      hgvs: "p.Glu6Ala (Hb G-Makassar)",
      phenotype: {
        title: "Hb G-Makassar – gutartige Variante",
        severity: "benign",
        health: 94,
        summary:
          "Alanin ist zwar auch unpolar, aber viel kleiner als Valin. Es passt nicht in die Bindetasche des Nachbarmoleküls, deshalb polymerisiert nichts. Träger dieser Variante sind klinisch gesund.",
        symptoms: ["Keine Beschwerden", "Auffällig nur in der Hämoglobin-Elektrophorese"],
        mechanism:
          "Genau dieser Trick wurde 2021 im Labor von David Liu benutzt: Ein Adenin-Base-Editor wandelt HbS in Hb G-Makassar um – aus einer Krankheit wird eine harmlose Variante, obwohl die ursprüngliche Mutation gar nicht rückgängig gemacht wurde.",
      },
    },
    {
      keys: ["E6K"],
      hgvs: "p.Glu6Lys (HbC)",
      phenotype: {
        title: "Hämoglobin C",
        severity: "mild",
        health: 76,
        summary:
          "Statt der sauren Glutaminsäure sitzt das basische Lysin an Position 6. Das Hämoglobin kristallisiert leicht, die Blutkörperchen werden starr – aber sie versicheln nicht.",
        symptoms: ["Leichte hämolytische Anämie", "Vergrößerte Milz", "Meist gute Lebensqualität"],
      },
    },
    {
      keys: ["E26K"],
      hgvs: "p.Glu26Lys (HbE)",
      phenotype: {
        title: "Hämoglobin E",
        severity: "mild",
        health: 78,
        summary:
          "Die weltweit zweithäufigste Hämoglobin-Variante. Der Austausch schafft nebenbei eine unechte Spleißstelle, sodass zusätzlich zu wenig β-Globin gebildet wird.",
        symptoms: ["Milde Anämie", "Kleine rote Blutkörperchen (Mikrozytose)"],
        mechanism:
          "Ein Lehrstück dafür, dass eine Punktmutation zwei Ebenen gleichzeitig treffen kann: Proteinstruktur und Spleißen der mRNA.",
      },
    },
    {
      keys: ["Q39*"],
      hgvs: "p.Gln39Ter (β39-Nonsense)",
      phenotype: {
        title: "β⁰-Thalassämie (β39)",
        severity: "critical",
        health: 18,
        summary:
          "Ein einziges C→T hat aus dem Glutamin-Codon CAG das Stoppcodon TAG gemacht. Das Ribosom hält nach 38 von 146 Aminosäuren an – funktionsloses Bruchstück.",
        symptoms: [
          "Schwere Blutarmut ab dem 6. Lebensmonat",
          "Lebenslang regelmäßige Bluttransfusionen",
          "Eisenüberladung als Folge der Transfusionen",
        ],
        mechanism:
          "Die häufigste β-Thalassämie-Mutation im Mittelmeerraum. Genau diese Umwandlung C→T beherrscht ein Cytosin-Base-Editor – in beide Richtungen gedacht: Er kann sie erzeugen, und ein Adenin-Base-Editor kann sie am Gegenstrang wieder heilen.",
      },
    },
  ],
};

/* ================================================================== */
/* CFTR – Exon 11 (F508del)                                            */
/* ================================================================== */

const CFTR11_LEADER = "TTAATGGTGCCAGGCATAATCCAGGAA";
const CFTR11_CDS = codons(
  "AAA", "GAA", "AAT", "ATC", "ATC", "TTT", "GGT", "GTT", "TCC", "TAT",
  "GAT", "GAA", "TAT", "AGA", "TAC", "AGA", "AGC", "GTC", "ATC", "AAA",
  "GCA", "TGC", "CAA", "CTA", "GAA", "GAG",
);
const CFTR11_TRAILER = "GTAAGTACTTGGCCAAGGCAATCCTA";

/** Der Codon-Block, den die ΔF508-Mutation entfernt (3 Basen). */
const CFTR11_DELETION_INDEX = CFTR11_LEADER.length + 14;

const CFTR_HEALTHY: Phenotype = {
  title: "Funktionierender Chloridkanal",
  severity: "healthy",
  health: 100,
  summary:
    "Das CFTR-Protein sitzt in der Zellmembran und schleust Chlorid-Ionen nach außen. Wasser folgt osmotisch – der Schleim auf den Schleimhäuten bleibt dünnflüssig.",
  symptoms: [],
  mechanism:
    "CFTR ist ein ABC-Transporter mit 1480 Aminosäuren. Er öffnet sich, wenn ATP an seine Nukleotid-Bindedomänen andockt.",
};

const CF_SEVERE: Phenotype = {
  title: "Mukoviszidose (zystische Fibrose)",
  severity: "severe",
  health: 30,
  summary:
    "Ohne funktionierenden Chloridkanal bleibt das Wasser in der Zelle. Der Schleim auf Lunge, Bauchspeicheldrüse und Darm wird zäh wie Kleber.",
  symptoms: [
    "Chronischer Husten, wiederkehrende Lungenentzündungen",
    "Bauchspeicheldrüse arbeitet nicht mehr – Verdauungsenzyme müssen ersetzt werden",
    "Salziger Schweiß (Grundlage des Schweißtests)",
  ],
};

export const CFTR_EXON11: GeneDef = {
  id: "cftr-11",
  symbol: "CFTR (Exon 11)",
  name: "Cystic Fibrosis Transmembrane Conductance Regulator",
  locus: "Chromosom 7q31.2",
  kind: "coding",
  leader: CFTR11_LEADER,
  cds: CFTR11_CDS,
  trailer: CFTR11_TRAILER,
  proteinOffset: 502,
  lossOfFunction: "harmful",
  lossOfFunctionPhenotype: CF_SEVERE,
  sequenceNote:
    "Der kodierende Kernbereich um Phe508 ist die reale Sequenz. Die flankierenden Intronabschnitte sind didaktisch ergänzt, damit genügend PAM-Stellen zur Verfügung stehen.",
  healthyPhenotype: CFTR_HEALTHY,
  markers: [],
  variants: [],
  exactVariants: [
    {
      id: "f508del",
      sequence:
        CFTR11_LEADER +
        CFTR11_CDS.slice(0, 14) +
        CFTR11_CDS.slice(17) +
        CFTR11_TRAILER,
      hgvs: "p.Phe508del (ΔF508)",
      phenotype: {
        ...CF_SEVERE,
        title: "Mukoviszidose durch ΔF508",
        summary:
          "Drei Basen fehlen – die Aminosäure Phenylalanin 508 ist ersatzlos verschwunden. Das Leseraster bleibt intakt, aber das Protein faltet sich falsch und wird von der Qualitätskontrolle der Zelle sofort wieder abgebaut. Rund 70 % aller Mukoviszidose-Allele weltweit tragen genau diese Deletion.",
        mechanism:
          "Entscheidend für dieses Labor: Ein Base-Editor kann hier nichts ausrichten. Er tauscht Basen aus, er fügt keine ein. Für eine Deletion braucht es Prime-Editing.",
      },
    },
  ],
};

export const CFTR_F508DEL_SEQUENCE = CFTR_EXON11.exactVariants[0].sequence;
export const CFTR_F508DEL_INDEX = CFTR11_DELETION_INDEX;

/* ================================================================== */
/* CFTR – Exon 23 (W1282X)                                             */
/* ================================================================== */

const CFTR23_LEADER = "TTGTCTTACCAATGGCAATCTTAGGCC";
const CFTR23_CDS = codons(
  "AGC", "CTG", "CAG", "GCA", "AGG", "AGG", "AGG", "CAG", "AGT", "GTC",
  "TGG", "CCT", "TCA", "GGA", "CAG", "CTG", "GAT", "CCA", "GTG", "CTT",
  "TTC", "AAA", "GCC", "CTG", "AGG", "AAG",
);
const CFTR23_TRAILER = "GTGAGTACCTGGCAATCCTTAGGACA";

/** Dritte Base des Tryptophan-Codons 1282 – hier entsteht das Stoppcodon. */
export const CFTR_W1282_INDEX = CFTR23_LEADER.length + 32;

export const CFTR_EXON23: GeneDef = {
  id: "cftr-23",
  symbol: "CFTR (Exon 23)",
  name: "Cystic Fibrosis Transmembrane Conductance Regulator",
  locus: "Chromosom 7q31.2",
  kind: "coding",
  leader: CFTR23_LEADER,
  cds: CFTR23_CDS,
  trailer: CFTR23_TRAILER,
  proteinOffset: 1271,
  lossOfFunction: "harmful",
  lossOfFunctionPhenotype: CF_SEVERE,
  sequenceNote:
    "Lehrsequenz. Die Variante W1282X und ihre Korrektur durch einen Adenin-Base-Editor sind real, die umgebenden Codons sind vereinfacht.",
  healthyPhenotype: CFTR_HEALTHY,
  markers: [],
  exactVariants: [],
  variants: [
    {
      keys: ["W1282*"],
      hgvs: "p.Trp1282Ter (c.3846G>A)",
      phenotype: {
        title: "Mukoviszidose durch W1282X",
        severity: "severe",
        health: 28,
        summary:
          "Aus dem Tryptophan-Codon TGG ist durch ein einziges G→A das Stoppcodon TGA geworden. Das Protein bricht 198 Aminosäuren vor dem Ende ab.",
        symptoms: CF_SEVERE.symptoms,
        mechanism:
          "Die häufigste CFTR-Mutation bei aschkenasischen Juden. Weil hier nur eine Base falsch ist, lässt sie sich – anders als ΔF508 – mit einem Adenin-Base-Editor zurückschreiben: A→G macht aus TGA wieder TGG.",
      },
    },
  ],
};

/* ================================================================== */
/* LMNA – Progerie                                                     */
/* ================================================================== */

const LMNA_LEADER = "CCTGGAGCCTTGGCAATCCTAGGACT";
const LMNA_CDS = codons(
  "CGG", "AGC", "GTG", "GCC", "GTG", "AGG", "GCC", "ACG", "GGC", "AGT",
  "CAG", "AGG", "GTC", "ACC", "AGC", "GGA", "CCT", "ACA", "CAG", "ACC",
  "CAC", "GTG", "AGC", "CGG", "GGC", "CGG",
);
const LMNA_TRAILER = "GTGAGTCCTGGCAATGCCTAGGACAT";

/** c.1824 – die dritte Base von Codon 608 (Glycin). */
export const LMNA_C1824_INDEX = LMNA_LEADER.length + 26;

export const LMNA: GeneDef = {
  id: "lmna",
  symbol: "LMNA",
  name: "Lamin A/C – Gerüstprotein des Zellkerns",
  locus: "Chromosom 1q22",
  kind: "coding",
  leader: LMNA_LEADER,
  cds: LMNA_CDS,
  trailer: LMNA_TRAILER,
  proteinOffset: 599,
  lossOfFunction: "harmful",
  sequenceNote:
    "Lehrsequenz um Codon 608. Die Variante c.1824C>T, ihr stummer Charakter und die Heilung durch einen Adenin-Base-Editor sind real.",
  healthyPhenotype: {
    title: "Stabiler Zellkern",
    severity: "healthy",
    health: 100,
    summary:
      "Lamin A bildet ein Netz an der Innenseite der Kernhülle und hält den Zellkern in Form.",
    symptoms: [],
  },
  exactVariants: [],
  variants: [],
  markers: [
    {
      id: "lmna-cryptic-splice",
      index: LMNA_LEADER.length + 26,
      wildType: "C",
      label: "Kryptische Spleißstelle in Exon 11",
      description:
        "An dieser Stelle entscheidet eine einzige Base darüber, ob die Zelle das Exon korrekt abliest.",
      alleles: {
        T: {
          title: "Hutchinson-Gilford-Progerie",
          severity: "critical",
          health: 20,
          summary:
            "Das C ist zu einem T geworden. Für das Protein ändert sich nichts – GGC und GGT kodieren beide Glycin. Trotzdem ist die Mutation verheerend: Die neue Basenfolge sieht für die Spleiß-Maschinerie wie eine Exon-Grenze aus. 150 Basen werden herausgeschnitten, es entsteht das verkürzte Protein Progerin.",
          symptoms: [
            "Wachstumsstillstand ab dem ersten Lebensjahr",
            "Haarverlust, dünne Haut, steife Gelenke",
            "Arteriosklerose bereits im Kindesalter",
          ],
          mechanism:
            "Der Musterfall gegen den Satz „stumme Mutationen sind harmlos“. Progerin bleibt dauerhaft mit einem Fettanker in der Kernmembran verhaftet und verbeult den Zellkern. 2021 verdoppelte ein Adenin-Base-Editor die Lebenszeit von Progerie-Mäusen – er schrieb genau dieses T am Gegenstrang wieder zu C zurück.",
        },
      },
      fallback: {
        title: "Spleißstelle verändert",
        severity: "unknown",
        health: 60,
        summary:
          "Die kritische Base wurde verändert, aber nicht auf die bekannte Progerie-Variante. Wie die Zelle dieses Exon nun spleißt, ist offen.",
        symptoms: ["Keine Prognose möglich"],
      },
    },
  ],
};

/* ================================================================== */
/* PCSK9 – Cholesterin-Regler                                          */
/* ================================================================== */

const PCSK9_LEADER = "GCCTAGGCAATCCTTGGACCATGCCA";
const PCSK9_CDS = codons(
  "ATG", "GGC", "ACC", "GTG", "AGC", "AGC", "CGG", "TGG", "CTG", "CCG",
  "CTG", "CAG", "GCC", "CTG", "CTG", "CTG", "CTG", "GCC", "GCC", "TGC",
  "TAC", "GCC", "CAG", "GAC",
);
/** Beginn von Intron 1: Die Spleiß-Donorstelle „GT“ ist das Ziel. */
const PCSK9_TRAILER = "GTAAGTGCCTGGACCCTAGGCTTCAG";

export const PCSK9_SPLICE_INDEX = PCSK9_LEADER.length + PCSK9_CDS.length;
export const PCSK9_Q12_INDEX = PCSK9_LEADER.length + 33;

export const PCSK9: GeneDef = {
  id: "pcsk9",
  symbol: "PCSK9",
  name: "Proproteinkonvertase Subtilisin/Kexin Typ 9",
  locus: "Chromosom 1p32.3",
  kind: "coding",
  leader: PCSK9_LEADER,
  cds: PCSK9_CDS,
  trailer: PCSK9_TRAILER,
  proteinOffset: 0,
  lossOfFunction: "protective",
  lossOfFunctionPhenotype: {
    title: "PCSK9 stillgelegt – LDL dauerhaft gesenkt",
    severity: "enhanced",
    health: 96,
    summary:
      "Ohne PCSK9 bleiben die LDL-Rezeptoren länger auf der Leberzelle sitzen und fischen mehr Cholesterin aus dem Blut. Das LDL sinkt um 40–60 Prozent – dauerhaft, mit einer einzigen Behandlung.",
    symptoms: ["Deutlich gesenktes Herzinfarktrisiko", "Keine bekannten Nachteile"],
    mechanism:
      "Menschen mit natürlichen PCSK9-Ausfallvarianten sind seit Jahrzehnten bekannt: Sie sind gesund und bekommen fast nie einen Herzinfarkt. Genau dieses Vorbild ahmt VERVE-101 nach – ein Adenin-Base-Editor, der beim Menschen bereits erprobt wird.",
  },
  sequenceNote:
    "Lehrsequenz: Anfang der kodierenden Sequenz plus Beginn von Intron 1. Der Angriffspunkt Spleiß-Donor und die klinische Strategie sind real.",
  healthyPhenotype: {
    title: "Normaler Cholesterinstoffwechsel",
    severity: "healthy",
    health: 100,
    summary:
      "PCSK9 wird gebildet und baut LDL-Rezeptoren ab. Der Cholesterinspiegel liegt im Normbereich – bei diesem Patienten allerdings zu hoch für sein Risikoprofil.",
    symptoms: [],
  },
  exactVariants: [],
  variants: [],
  markers: [
    {
      id: "pcsk9-splice-donor",
      index: PCSK9_LEADER.length + PCSK9_CDS.length,
      wildType: "GT",
      label: "Spleiß-Donorstelle Intron 1",
      description:
        "Fast jedes Intron beginnt mit GT. Fehlt dieses Signal, findet die Spleiß-Maschinerie die Exon-Grenze nicht mehr.",
      fallback: {
        title: "PCSK9 stillgelegt – LDL dauerhaft gesenkt",
        severity: "enhanced",
        health: 96,
        summary:
          "Die Spleiß-Donorstelle ist zerstört. Intron 1 bleibt in der mRNA stehen, das Leseraster kippt, es entsteht kein funktionsfähiges PCSK9 mehr. Der LDL-Spiegel fällt dauerhaft.",
        symptoms: ["Deutlich gesenktes Herzinfarktrisiko"],
        mechanism:
          "Genau diese Strategie verfolgt VERVE-101: nicht reparieren, sondern gezielt abschalten. Ein einziges Basenpaar entscheidet.",
      },
    },
  ],
};

/* ================================================================== */
/* MCM6 – Laktasepersistenz (regulatorisch)                            */
/* ================================================================== */

const MCM6_SEQUENCE =
  "GATTACAGCT" +
  "TTGCAAGGTA" +
  "CCTTGGAACA" +
  "TTGACTTAAG" +
  "C" +
  "AAGATTGGT" +
  "AACCTTGGCA" +
  "TTAGGCCATT" +
  "GAACCTTAGG" +
  "CATTGGACCT" +
  "TAGGCA";

export const MCM6_13910_INDEX = 40;

export const MCM6: GeneDef = {
  id: "mcm6",
  symbol: "MCM6 / LCT",
  name: "Enhancer der Laktase – Position −13 910",
  locus: "Chromosom 2q21.3",
  kind: "regulatory",
  leader: MCM6_SEQUENCE,
  cds: "",
  trailer: "",
  proteinOffset: 0,
  lossOfFunction: "neutral",
  sequenceNote:
    "Lehrsequenz eines regulatorischen Abschnitts – hier wird kein Protein kodiert. Die Variante −13 910 C>T und ihre Wirkung sind real.",
  healthyPhenotype: {
    title: "Laktase wird im Erwachsenenalter abgeschaltet",
    severity: "healthy",
    health: 92,
    summary: "Der ursprüngliche Zustand aller Säugetiere.",
    symptoms: [],
  },
  exactVariants: [],
  variants: [],
  markers: [
    {
      id: "mcm6-13910",
      index: MCM6_13910_INDEX,
      wildType: "C",
      label: "Enhancer-Position −13 910",
      description:
        "Diese Base liegt 13 910 Basen vor dem Laktase-Gen, mitten in einem Enhancer im Intron des Nachbargens MCM6.",
      wildTypePhenotype: {
        title: "Laktoseintoleranz (Wildtyp)",
        severity: "healthy",
        health: 88,
        summary:
          "Mit dem C an dieser Stelle fährt der Körper die Laktase-Produktion nach dem Abstillen herunter. Das ist der Normalzustand für rund zwei Drittel der Menschheit – keine Krankheit, sondern die ursprüngliche Variante.",
        symptoms: ["Blähungen und Bauchschmerzen nach Milchprodukten"],
        mechanism:
          "Der Enhancer bindet den Transkriptionsfaktor Oct-1 nur schwach; das Laktase-Gen wird kaum noch abgelesen.",
      },
      alleles: {
        T: {
          title: "Laktasepersistenz",
          severity: "enhanced",
          health: 96,
          summary:
            "Ein einziges C→T sorgt dafür, dass der Transkriptionsfaktor Oct-1 den Enhancer fest bindet – die Laktase wird ein Leben lang gebildet. Milch bleibt verdaulich.",
          symptoms: ["Milchprodukte werden problemlos vertragen"],
          mechanism:
            "Diese Mutation entstand vor etwa 7 500 Jahren in Mitteleuropa und breitete sich mit der Viehhaltung rasant aus – eines der stärksten Beispiele für natürliche Selektion beim Menschen. Eine Punktmutation in nicht-kodierender DNA, die kein einziges Protein verändert.",
        },
      },
      fallback: {
        title: "Unbekannte Enhancer-Variante",
        severity: "unknown",
        health: 80,
        summary:
          "Weder C noch T – wie dieser Enhancer nun arbeitet, ist experimentell nicht untersucht.",
        symptoms: [],
      },
    },
  ],
};

/* ================================================================== */
/* Sandkasten                                                          */
/* ================================================================== */

const LAB_CDS = codons(
  "ATG", "AGC", "AAG", "GGC", "GAG", "GAG", "CTG", "TTC", "ACC", "GGC",
  "GTG", "GTG", "CCC", "ATC", "CTG", "GTC", "GAG", "CTG", "GAC", "GGC",
  "GAC", "GTA", "AAC", "GGC", "CAC", "AAG", "TTC", "AGC", "GTG", "TCC",
);

export const SANDBOX: GeneDef = {
  id: "sandbox",
  symbol: "REP1",
  name: "Reportergen im Übungsmodus",
  locus: "Plasmid, Zellkultur",
  kind: "coding",
  leader: "TTGACCAGGCAATCCTTAGGCCATTGA",
  cds: LAB_CDS,
  trailer: "GTAAGCCTTGGCAATCCTAGGACATTC",
  proteinOffset: 0,
  lossOfFunction: "neutral",
  sequenceNote:
    "Frei erfundenes Reportergen für den Übungsmodus. Hier geht nichts kaputt – ideal, um Editierfenster, Bystander-Edits und Leseraster auszuprobieren.",
  healthyPhenotype: {
    title: "Reporter leuchtet",
    severity: "healthy",
    health: 100,
    summary:
      "Das Reporterprotein faltet sich korrekt und fluoresziert grün. Jede Veränderung wird sofort an der Leuchtkraft sichtbar.",
    symptoms: [],
  },
  lossOfFunctionPhenotype: {
    title: "Reporter erloschen",
    severity: "mild",
    health: 55,
    summary: "Das Protein ist zerstört – die Zellen leuchten nicht mehr. In der Zellkultur folgenlos.",
    symptoms: [],
  },
  exactVariants: [],
  variants: [],
  markers: [],
};

export const GENES: readonly GeneDef[] = [
  HBB,
  CFTR_EXON11,
  CFTR_EXON23,
  LMNA,
  PCSK9,
  MCM6,
  SANDBOX,
];

export function getGene(id: string): GeneDef {
  const gene = GENES.find((g) => g.id === id);
  if (!gene) throw new Error(`Unbekanntes Gen: ${id}`);
  return gene;
}

/* ================================================================== */
/* Fälle                                                               */
/* ================================================================== */

export interface LabGoal {
  text: string;
  /** Erfolg bei exakt dieser Änderungssignatur (leerer String = Wildtyp). */
  signatures?: string[];
  /** Erfolg bei einem dieser Schweregrade. */
  severities?: Severity[];
  /** Erfolg ab diesem Gesundheitswert. */
  minHealth?: number;
  /** Erfolg, wenn an dieser Stelle exakt diese Basenfolge steht. */
  site?: { index: number; sequence: string };
}

export interface LabCase {
  id: string;
  geneId: string;
  title: string;
  subtitle: string;
  patient: { name: string; age: string; emoji: string; story: string };
  /** Abweichende Startsequenz; ohne Angabe wird die Referenz benutzt. */
  startSequence?: string;
  mission: string;
  /** Basenpaar, auf das beim Öffnen des Falls gezoomt wird. */
  focusIndex?: number;
  goal: LabGoal;
  hints: string[];
  difficulty: 1 | 2 | 3;
  tags: string[];
  ethics?: string;
}

function withBase(sequence: string, index: number, base: string): string {
  return sequence.slice(0, index) + base + sequence.slice(index + 1);
}

const HBB_REFERENCE = HBB.leader + HBB.cds;
const HBB_SICKLE_SEQUENCE = withBase(HBB_REFERENCE, HBB_SICKLE_INDEX, "T");
const HBB_THAL_SEQUENCE = withBase(HBB_REFERENCE, HBB_STOP39_INDEX, "T");

const CFTR23_REFERENCE = CFTR23_LEADER + CFTR23_CDS + CFTR23_TRAILER;
const CFTR23_W1282X_SEQUENCE = withBase(CFTR23_REFERENCE, CFTR_W1282_INDEX, "A");

const LMNA_REFERENCE = LMNA_LEADER + LMNA_CDS + LMNA_TRAILER;
const LMNA_PROGERIA_SEQUENCE = withBase(LMNA_REFERENCE, LMNA_C1824_INDEX, "T");

export const CASES: readonly LabCase[] = [
  {
    id: "sichelzelle",
    geneId: "hbb",
    title: "Sichelzellanämie heilen",
    subtitle: "HBB · p.Glu6Val · A•T → G•C",
    patient: {
      name: "Amir",
      age: "12 Jahre",
      emoji: "🧑🏽",
      story:
        "Amir liegt zum vierten Mal in diesem Jahr auf der Station. Seine Blutkörperchen verstopfen die feinsten Gefäße – die Schmerzkrisen kommen ohne Vorwarnung. Beide Kopien seines HBB-Gens tragen dieselbe Mutation.",
    },
    startSequence: HBB_SICKLE_SEQUENCE,
    mission:
      "Amirs Codon 6 lautet GTG statt GAG. Der Austausch A→T ist eine Transversion – kein Base-Editor der Welt kann sie direkt rückgängig machen. Finde den Umweg.",
    goal: {
      text: "Bringe Amirs Hämoglobin in einen harmlosen Zustand (Hb G-Makassar) oder stelle den Wildtyp wieder her.",
      signatures: ["E6A", ""],
    },
    hints: [
      "Schau dir an, welche Umwandlung dein Editor kann – und welche Base auf welchem Strang dafür stehen muss.",
      "Aus GTG (Valin) wird GCG (Alanin), wenn das T zu einem C wird. Auf dem Sinnstrang kann kein Base-Editor T→C. Auf dem Gegenstrang steht dort aber ein A.",
      "Ein Adenin-Base-Editor mit einer Guide-RNA auf dem Gegenstrang macht aus diesem A ein G. Ergebnis: Hb G-Makassar – klinisch gesund.",
      "Mit dem NGG-PAM des Wildtyp-Cas9 findest du hier keine Guide-RNA. Genau dieses Problem hatten die Forschenden 2021 auch – sie brauchten die Variante ABE8e-NRCH. Stelle im Labor auf SpRY um.",
    ],
    difficulty: 2,
    tags: ["Heilen", "Transversion", "Strangwahl"],
  },
  {
    id: "thalassaemie",
    geneId: "hbb",
    title: "β-Thalassämie zurückschreiben",
    subtitle: "HBB · p.Gln39Ter · A•T → G•C",
    patient: {
      name: "Chiara",
      age: "8 Jahre",
      emoji: "👧🏻",
      story:
        "Chiara bekommt seit ihrem ersten Lebensjahr alle drei Wochen eine Bluttransfusion. Ihr Körper baut kein β-Globin – ein einziges Basenpaar hat mitten im Gen ein Stoppschild aufgestellt.",
    },
    startSequence: HBB_THAL_SEQUENCE,
    mission:
      "Das Codon 39 lautet TAG statt CAG. Schreibe das Stoppcodon zurück in ein Glutamin-Codon.",
    goal: {
      text: "Stelle die Wildtyp-Sequenz des β-Globins wieder her.",
      signatures: [""],
    },
    hints: [
      "TAG → CAG heißt: T wird zu C. Kein Base-Editor kann das auf dem Sinnstrang.",
      "Auf dem Gegenstrang steht gegenüber dem T ein A – und A→G beherrscht der Adenin-Base-Editor.",
      "Achte auf das Editierfenster: Es gibt mehrere Guide-RNAs, aber nur wenige mit dem Ziel auf Position 5 bis 7.",
      "Falls keine Guide-RNA erscheint: Der Wildtyp-Cas9 braucht ein NGG. Wechsle auf SpCas9-NG oder SpRY.",
    ],
    difficulty: 2,
    tags: ["Heilen", "Nonsense-Mutation"],
  },
  {
    id: "krank-machen",
    geneId: "hbb",
    title: "Wie eine Krankheit entsteht",
    subtitle: "HBB · gesundes Gen · C•G → T•A",
    patient: {
      name: "Zellkultur HBB-wt",
      age: "Laborprobe",
      emoji: "🧫",
      story:
        "Keine Patientin, kein Patient: eine Zellkultur mit gesundem β-Globin-Gen. Hier darfst du zerstören, um zu verstehen, wie wenig zwischen gesund und krank liegt.",
    },
    mission:
      "Erzeuge mit einem Cytosin-Base-Editor die häufigste β-Thalassämie-Mutation des Mittelmeerraums: Aus dem Glutamin-Codon CAG an Position 39 soll das Stoppcodon TAG werden.",
    focusIndex: HBB_STOP39_INDEX,
    goal: {
      text: "Erzeuge eine schwere oder lebensbedrohliche Variante des β-Globins.",
      severities: ["severe", "critical"],
    },
    hints: [
      "Das erste C von CAG steht auf dem Sinnstrang – ein Cytosin-Base-Editor kann es direkt treffen.",
      "Suche eine Guide-RNA, die genau dieses C ins Fenster (Position 4–8) holt – dafür brauchst du hier SpCas9-NG oder SpRY.",
      "Beobachte, ob dein Editor Nachbar-Cytosine mitverändert. Genau das ist das größte Sicherheitsproblem der Methode.",
    ],
    difficulty: 1,
    tags: ["Krank machen", "Bystander"],
    ethics:
      "Dieses Szenario zeigt die Kehrseite der Technik: Dasselbe Werkzeug, das heilt, erzeugt in der Gegenrichtung Krankheit. Deshalb sind Eingriffe in menschliche Keimbahnzellen in Deutschland und den meisten Ländern verboten – Körperzellen dürfen unter strengen Auflagen behandelt werden.",
  },
  {
    id: "cf-w1282x",
    geneId: "cftr-23",
    title: "Mukoviszidose: Stoppschild entfernen",
    subtitle: "CFTR · p.Trp1282Ter · A•T → G•C",
    patient: {
      name: "Jonas",
      age: "16 Jahre",
      emoji: "🧑🏼",
      story:
        "Jonas inhaliert dreimal täglich, macht zweimal täglich Physiotherapie und nimmt zu jeder Mahlzeit Verdauungsenzyme. Sein Chloridkanal bricht nach 1281 von 1480 Aminosäuren ab.",
    },
    startSequence: CFTR23_W1282X_SEQUENCE,
    mission:
      "Das Tryptophan-Codon TGG wurde zu TGA. Mache aus dem Stoppcodon wieder ein Tryptophan-Codon.",
    goal: {
      text: "Stelle das vollständige CFTR-Protein wieder her.",
      signatures: [""],
    },
    hints: [
      "TGA → TGG bedeutet A→G. Diese Umwandlung ist die Spezialität des Adenin-Base-Editors.",
      "Das A steht auf dem Sinnstrang – du brauchst also eine Guide-RNA auf dem Sinnstrang.",
      "Prüfe die Vorhersage: Liegen noch andere Adenine im Fenster? Ein Bystander-Edit im Codon davor würde das Protein erneut verändern.",
    ],
    difficulty: 1,
    tags: ["Heilen", "Nonsense-Mutation"],
  },
  {
    id: "cf-f508del",
    geneId: "cftr-11",
    title: "Wo Base-Editing an seine Grenze stößt",
    subtitle: "CFTR · p.Phe508del · Deletion",
    patient: {
      name: "Lena",
      age: "6 Jahre",
      emoji: "👧🏽",
      story:
        "Lena trägt auf beiden Chromosomen die häufigste Mukoviszidose-Mutation der Welt. Ihr fehlt keine falsche Base – ihr fehlen drei Basen komplett.",
    },
    startSequence: CFTR_F508DEL_SEQUENCE,
    mission:
      "Versuche zuerst, Lena mit einem Base-Editor zu helfen. Wenn du verstanden hast, warum das nicht funktionieren kann, hol den Prime-Editor.",
    goal: {
      text: "Füge das fehlende Phenylalanin-Codon wieder ein.",
      signatures: [""],
    },
    hints: [
      "Base-Editoren tauschen Basen aus. Sie fügen keine ein und entfernen keine.",
      "Zähle nach: Lenas Sequenz ist drei Basen kürzer als die Referenz. Kein Basenaustausch der Welt ändert daran etwas.",
      "Der Prime-Editor bringt seine eigene Vorlage mit. Wähle ihn, markiere die Lücke und füge TTT wieder ein.",
    ],
    difficulty: 3,
    tags: ["Grenzen der Methode", "Prime-Editing"],
  },
  {
    id: "progerie",
    geneId: "lmna",
    title: "Die stumme Mutation, die tötet",
    subtitle: "LMNA · c.1824C>T · A•T → G•C",
    patient: {
      name: "Mia",
      age: "9 Jahre",
      emoji: "👧",
      story:
        "Mia ist so groß wie eine Vierjährige, ihre Gelenke sind steif, ihre Arterien so verkalkt wie die einer 70-Jährigen. Ihre Mutation verändert keine einzige Aminosäure.",
    },
    startSequence: LMNA_PROGERIA_SEQUENCE,
    mission:
      "Vergleiche zuerst das Protein mit der Referenz – du wirst keinen Unterschied finden. Schau dann in den Befund und schreibe die Base zurück.",
    goal: {
      text: "Schreibe c.1824 wieder auf C zurück, ohne das Protein zu verändern.",
      site: { index: LMNA_C1824_INDEX, sequence: "C" },
      signatures: [""],
    },
    hints: [
      "GGC und GGT kodieren beide Glycin – deshalb heißt die Variante p.Gly608Gly.",
      "Trotzdem entsteht eine unechte Spleißstelle. Die Zelle schneidet 150 Basen heraus.",
      "T→C geht nur über den Gegenstrang: Dort steht ein A, und der Adenin-Base-Editor macht daraus ein G.",
      "Im Fenster liegt ein zweites A. Es wird mitverändert – aber schau im Befund nach, was das für das Protein bedeutet.",
    ],
    difficulty: 2,
    tags: ["Heilen", "Stumme Mutation", "Spleißen"],
  },
  {
    id: "pcsk9",
    geneId: "pcsk9",
    title: "Gesunde Menschen verbessern?",
    subtitle: "PCSK9 · Spleiß-Donor · A•T → G•C",
    patient: {
      name: "Herr Bauer",
      age: "58 Jahre",
      emoji: "🧔🏻",
      story:
        "Herr Bauer ist nicht krank. Sein LDL-Cholesterin liegt bei 190 mg/dl, sein Vater starb mit 61 an einem Herzinfarkt. Tabletten nimmt er unregelmäßig. Eine einzige Base könnte sein Risiko lebenslang senken.",
    },
    mission:
      "Zerstöre die Spleiß-Donorstelle am Anfang von Intron 1, damit PCSK9 nicht mehr gebildet wird. Alternativ kannst du mit einem Cytosin-Base-Editor ein vorzeitiges Stoppcodon einbauen.",
    focusIndex: PCSK9_SPLICE_INDEX + 1,
    goal: {
      text: "Lege das PCSK9-Gen still, ohne das Leseraster zu zerstören.",
      severities: ["enhanced"],
    },
    hints: [
      "Jedes Intron beginnt mit GT. Wird daraus GC, findet die Spleiß-Maschinerie die Grenze nicht mehr.",
      "T→C heißt am Gegenstrang A→G – also Adenin-Base-Editor, Guide-RNA auf dem Gegenstrang.",
      "Zweiter Weg: Das Codon CAG an Position 12 lässt sich mit einem Cytosin-Base-Editor zu TAG machen.",
    ],
    difficulty: 2,
    tags: ["Verbessern", "Spleißen", "Ethik"],
    ethics:
      "Hier wird niemand geheilt – hier wird ein gesunder Mensch umgebaut. Genau das ist der Streitpunkt: Ab wann ist eine dauerhafte, nicht rückholbare Veränderung des Erbguts gerechtfertigt? Wer trägt das Risiko unbekannter Spätfolgen? Und wer bezahlt eine Therapie, die pro Person mehrere hunderttausend Euro kostet?",
  },
  {
    id: "laktose",
    geneId: "mcm6",
    title: "Eine Base, 7 500 Jahre Evolution",
    subtitle: "MCM6 · −13 910 C>T · C•G → T•A",
    patient: {
      name: "Sofia",
      age: "19 Jahre",
      emoji: "👩🏻",
      story:
        "Sofia bekommt nach jedem Cappuccino Bauchkrämpfe. Krank ist sie nicht – sie trägt schlicht die ursprüngliche Variante, die zwei Drittel der Menschheit haben.",
    },
    mission:
      "Diese Base liegt in keinem Gen. Sie sitzt in einem Enhancer und entscheidet nur darüber, wie stark ein anderes Gen abgelesen wird. Mach Sofia laktosetolerant.",
    goal: {
      text: "Setze an Position −13 910 ein T statt des C.",
      site: { index: MCM6_13910_INDEX, sequence: "T" },
    },
    hints: [
      "C→T ist genau die Umwandlung, die ein Cytosin-Base-Editor beherrscht.",
      "Das C steht auf dem Sinnstrang – such eine Guide-RNA auf dem Sinnstrang.",
      "Beachte: Hier ändert sich kein einziges Protein. Nicht-kodierende DNA ist nicht wirkungslos.",
    ],
    difficulty: 1,
    tags: ["Verbessern", "Nicht-kodierende DNA", "Evolution"],
    ethics:
      "Ein harmloses Beispiel mit ernstem Kern: Wenn man eine Unbequemlichkeit wegeditieren kann – wo hört Medizin auf und wo fängt Optimierung an?",
  },
  {
    id: "sandbox",
    geneId: "sandbox",
    title: "Freies Labor",
    subtitle: "Reportergen · alle Werkzeuge",
    patient: {
      name: "Übungszellen",
      age: "Zellkultur",
      emoji: "🔬",
      story:
        "Ein erfundenes Reportergen ohne Krankheitswert. Probiere aus, was passiert: Bystander-Edits, Rasterschübe, Doppelstrangbrüche, Prime-Editing – hier kostet nichts etwas.",
    },
    mission:
      "Kein Ziel, keine Vorgaben. Verändere die DNA, wie du willst, und beobachte, was mit dem Protein passiert.",
    goal: { text: "Freies Experimentieren – kein Ziel vorgegeben." },
    hints: [
      "Vergleiche die Werkzeuge: Wie viele Basen verändert ein Base-Editor, wie unvorhersehbar ist die Cas9-Schere?",
      "Füge mit dem Prime-Editor eine einzelne Base ein und beobachte den Rasterschub.",
      "Schalte die realistische Effizienz aus, wenn du eine Mechanik gezielt untersuchen willst.",
    ],
    difficulty: 1,
    tags: ["Übungsmodus"],
  },
];

export function getCase(id: string): LabCase {
  const found = CASES.find((c) => c.id === id);
  if (!found) throw new Error(`Unbekannter Fall: ${id}`);
  return found;
}

export function startSequenceFor(labCase: LabCase, gene: GeneDef): string {
  return labCase.startSequence ?? gene.leader + gene.cds + gene.trailer;
}
