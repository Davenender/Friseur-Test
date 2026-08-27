/**
 * Erklärtexte für das Labor: Bauteile der DNA, Steckbriefe der vier Basen,
 * Glossar und Selbsttest. Alles an einer Stelle, damit dieselbe Erklärung
 * überall gleich lautet.
 */

import type { Base } from "./genetics";
import type { PartKind } from "./molecule";

/* ------------------------------------------------------------------ */
/* Bauteile eines Nukleotids                                           */
/* ------------------------------------------------------------------ */

export interface PartInfo {
  title: string;
  short: string;
  what: string;
  job: string;
  /** Warum dieses Bauteil fürs Base-Editing wichtig ist. */
  relevance: string;
  color: string;
}

export const PART_INFO: Record<PartKind, PartInfo> = {
  phosphat: {
    title: "Phosphatgruppe",
    short: "Das Bindeglied",
    what:
      "Ein Phosphoratom mit vier Sauerstoffatomen drumherum. Es sitzt ganz außen an der Helix, dort wo sie am dicksten ist.",
    job:
      "Das Phosphat verbindet den Zucker eines Nukleotids mit dem Zucker des nächsten. So entsteht eine durchgehende Kette – das Rückgrat. Weil jede Phosphatgruppe negativ geladen ist, ist die ganze DNA nach außen hin negativ. Deshalb wandert sie bei der Gelelektrophorese zum Pluspol.",
    relevance:
      "Genau diese Kette darf beim Base-Editing nicht zerschnitten werden. Die Cas9-Nickase ritzt sie nur an einer Stelle an – das ist der ganze Unterschied zur Genschere.",
    color: "#fbbf24",
  },
  zucker: {
    title: "Desoxyribose (Zucker)",
    short: "Das Gerüst",
    what:
      "Ein Fünfring aus vier Kohlenstoffatomen und einem Sauerstoffatom. Das „Desoxy“ heißt: An einer Stelle fehlt ein Sauerstoff, den die RNA dort noch hätte.",
    job:
      "Der Zucker trägt beides: vorne die Base, hinten die Phosphatgruppen zu den Nachbarn. Seine Kohlenstoffe sind durchnummeriert (C1' bis C5'), und daraus kommt die Richtungsangabe der DNA: Ein Strang läuft von 5' nach 3', der Gegenstrang genau andersherum.",
    relevance:
      "Diese Richtung entscheidet mit, auf welchem Strang eine Guide-RNA sitzen muss – und damit, ob dein Editor die Zielbase überhaupt erreicht.",
    color: "#a5b4fc",
  },
  base: {
    title: "Base",
    short: "Der Buchstabe",
    what:
      "Ein flacher Ring aus Kohlenstoff- und Stickstoffatomen. A und G haben zwei verwachsene Ringe (Purine), C und T nur einen (Pyrimidine) – deshalb sind A und G im Modell deutlich größer.",
    job:
      "Die Base trägt die Information. Ihre Abfolge ist der genetische Text. Über Wasserstoffbrücken hält sie an der passenden Base des Gegenstrangs: A immer an T, G immer an C.",
    relevance:
      "Nur die Base wird beim Base-Editing verändert. Ein Enzym reißt eine Aminogruppe ab – der Ring bleibt an Ort und Stelle, das Rückgrat bleibt unberührt.",
    color: "#4ade80",
  },
};

/* ------------------------------------------------------------------ */
/* Steckbriefe der vier Basen                                          */
/* ------------------------------------------------------------------ */

export interface BaseInfo {
  letter: Base;
  name: string;
  klasse: "Purin" | "Pyrimidin";
  partner: Base;
  bonds: 2 | 3;
  rings: 1 | 2;
  note: string;
}

export const BASE_INFO: Record<Base, BaseInfo> = {
  A: {
    letter: "A",
    name: "Adenin",
    klasse: "Purin",
    partner: "T",
    bonds: 2,
    rings: 2,
    note: "Trägt eine Aminogruppe. Genau die reißt ein Adenin-Base-Editor ab – dann wird Adenin wie Guanin gelesen.",
  },
  T: {
    letter: "T",
    name: "Thymin",
    klasse: "Pyrimidin",
    partner: "A",
    bonds: 2,
    rings: 1,
    note: "Der einzige Unterschied zum Uracil der RNA ist eine Methylgruppe. Im Modell ist sie der kleine Zacken am Ring.",
  },
  G: {
    letter: "G",
    name: "Guanin",
    klasse: "Purin",
    partner: "C",
    bonds: 3,
    rings: 2,
    note: "Bildet drei Wasserstoffbrücken zu Cytosin. Abschnitte mit viel G und C halten deshalb fester zusammen.",
  },
  C: {
    letter: "C",
    name: "Cytosin",
    klasse: "Pyrimidin",
    partner: "G",
    bonds: 3,
    rings: 1,
    note: "Verliert es seine Aminogruppe, entsteht Uracil – die Zelle liest das dann als Thymin. Genau darauf beruht der Cytosin-Base-Editor.",
  },
};

/** Merksatz zur Basenpaarung. */
export const PAIRING_RULE =
  "Adenin passt nur zu Thymin, Guanin nur zu Cytosin. Ein großer Purinring paart immer mit einem kleinen Pyrimidinring – dadurch ist die Helix überall gleich breit.";

/* ------------------------------------------------------------------ */
/* Glossar                                                             */
/* ------------------------------------------------------------------ */

export interface GlossaryEntry {
  term: string;
  /** Weitere Schreibweisen, unter denen man sucht. */
  aliases?: string[];
  short: string;
  long: string;
  group: "Aufbau" | "Mutationen" | "Werkzeuge" | "Ablauf";
}

export const GLOSSARY: readonly GlossaryEntry[] = [
  {
    term: "Nukleotid",
    group: "Aufbau",
    short: "Ein Baustein der DNA",
    long: "Phosphat + Zucker + Base. Tausende davon aneinandergehängt ergeben einen DNA-Strang.",
  },
  {
    term: "Basenpaar",
    aliases: ["bp"],
    group: "Aufbau",
    short: "Zwei Basen, die sich gegenüberstehen",
    long: "A mit T oder G mit C, zusammengehalten von Wasserstoffbrücken. Die Einheit „bp“ zählt genau diese Paare.",
  },
  {
    term: "Purin",
    group: "Aufbau",
    short: "Base mit zwei Ringen: A und G",
    long: "Purine sind die größeren Basen. Im Molekülmodell erkennst du sie sofort an den zwei verwachsenen Ringen.",
  },
  {
    term: "Pyrimidin",
    group: "Aufbau",
    short: "Base mit einem Ring: C und T",
    long: "Die kleineren Basen. Ein Purin paart immer mit einem Pyrimidin – sonst wäre die Helix mal dicker, mal dünner.",
  },
  {
    term: "Wasserstoffbrücke",
    group: "Aufbau",
    short: "Schwache Anziehung zwischen den Basen",
    long: "A=T hat zwei, G≡C hat drei. Einzeln sind sie schwach, in der Menge halten sie die Helix zusammen – und lassen sich beim Ablesen leicht wieder öffnen.",
  },
  {
    term: "Zucker-Phosphat-Rückgrat",
    group: "Aufbau",
    short: "Die tragende Kette außen",
    long: "Abwechselnd Zucker und Phosphat. Sie ist bei allen vier Basen gleich – die Information steckt allein in der Reihenfolge der Basen.",
  },
  {
    term: "5'- und 3'-Ende",
    aliases: ["5 Strich", "3 Strich"],
    group: "Aufbau",
    short: "Die beiden Enden eines Strangs",
    long: "Benannt nach den Kohlenstoffatomen des Zuckers. Die beiden Stränge laufen gegenläufig: Wo der eine sein 5'-Ende hat, hat der andere sein 3'-Ende.",
  },
  {
    term: "Große und kleine Furche",
    group: "Aufbau",
    short: "Die zwei ungleich breiten Rillen der Helix",
    long: "Weil die beiden Stränge nicht genau gegenüberliegen, sondern um etwa 137° versetzt, entsteht eine breite und eine schmale Rille. Proteine lesen die DNA meist durch die große Furche.",
  },
  {
    term: "Codon",
    group: "Aufbau",
    short: "Drei Basen, eine Aminosäure",
    long: "Das Ribosom liest die mRNA in Dreierschritten. 64 Codons stehen für 20 Aminosäuren und das Stoppsignal – deshalb sind mehrere Codons gleichbedeutend.",
  },
  {
    term: "Leseraster",
    group: "Mutationen",
    short: "Wo die Dreiergruppen anfangen",
    long: "Ab dem Startcodon wird strikt in Dreierschritten gelesen. Schiebt sich das Raster, ist ab dieser Stelle jedes Codon falsch.",
  },
  {
    term: "Punktmutation",
    group: "Mutationen",
    short: "Ein einzelnes Basenpaar ist ausgetauscht",
    long: "Das Thema dieses Labors. Je nachdem, welches Codon betroffen ist, bleibt sie folgenlos oder verursacht eine schwere Krankheit.",
  },
  {
    term: "Transition",
    group: "Mutationen",
    short: "Purin zu Purin oder Pyrimidin zu Pyrimidin",
    long: "A↔G und C↔T. Nur diese Austausche beherrschen Base-Editoren zuverlässig.",
  },
  {
    term: "Transversion",
    group: "Mutationen",
    short: "Purin zu Pyrimidin oder umgekehrt",
    long: "Zum Beispiel A→T. Für Base-Editoren kaum machbar – dafür braucht es Prime-Editing.",
  },
  {
    term: "Stumme Mutation",
    aliases: ["synonym"],
    group: "Mutationen",
    short: "DNA verändert, Protein gleich",
    long: "Möglich, weil mehrere Codons dieselbe Aminosäure kodieren. Harmlos ist sie trotzdem nicht immer – siehe den Progerie-Fall.",
  },
  {
    term: "Missense-Mutation",
    group: "Mutationen",
    short: "Eine Aminosäure wird ausgetauscht",
    long: "Die Folgen hängen davon ab, wie unterschiedlich die beiden Aminosäuren sind und wo im Protein sie sitzen.",
  },
  {
    term: "Nonsense-Mutation",
    group: "Mutationen",
    short: "Ein Stoppcodon entsteht mitten im Gen",
    long: "Das Ribosom hält vorzeitig an, das Protein bleibt ein funktionsloses Bruchstück.",
  },
  {
    term: "Rasterschub",
    aliases: ["Frameshift"],
    group: "Mutationen",
    short: "Basen fehlen oder kommen dazu",
    long: "Ist ihre Anzahl nicht durch drei teilbar, verschiebt sich das Leseraster und ab dort stimmt nichts mehr.",
  },
  {
    term: "Guide-RNA",
    aliases: ["sgRNA"],
    group: "Werkzeuge",
    short: "Die Adresse für das Enzym",
    long: "20 Basen, die zur Zielstelle passen. Sie bestimmt nicht nur den Ort, sondern auch, welcher der beiden Stränge bearbeitet wird.",
  },
  {
    term: "Protospacer",
    group: "Werkzeuge",
    short: "Die 20 Basen, an die die Guide-RNA bindet",
    long: "Im 3D-Bild orange eingefärbt. Gezählt wird von der PAM-fernen Seite: Position 1 liegt am weitesten weg vom PAM.",
  },
  {
    term: "PAM",
    group: "Werkzeuge",
    short: "Erkennungsmotiv direkt hinter dem Protospacer",
    long: "Beim Wildtyp-Cas9 muss dort NGG stehen. Ohne PAM bindet Cas9 nicht – deshalb ist längst nicht jede Base erreichbar. Im 3D-Bild pink.",
  },
  {
    term: "Editierfenster",
    group: "Werkzeuge",
    short: "Der Bereich, den die Desaminase erreicht",
    long: "Meist die Protospacer-Positionen 4 bis 8, am wirksamsten Position 6. Alles, was in diesem Fenster passt, wird verändert – auch ungewollt.",
  },
  {
    term: "Bystander-Edit",
    group: "Werkzeuge",
    short: "Eine Nachbarbase wird mitverändert",
    long: "Das größte praktische Problem der Methode. Liegen zwei gleiche Basen im Fenster, trifft das Enzym beide.",
  },
  {
    term: "Off-Target",
    group: "Werkzeuge",
    short: "Ein Treffer an der völlig falschen Stelle",
    long: "Die Guide-RNA passt auch zu ähnlichen Sequenzen anderswo im Genom. Cas9-Varianten mit gelockertem PAM machen das schlimmer.",
  },
  {
    term: "Desaminase",
    group: "Werkzeuge",
    short: "Das Enzym, das die Base chemisch umbaut",
    long: "Sie reißt eine Aminogruppe ab: aus Cytosin wird Uracil, aus Adenin wird Inosin. Der Ring bleibt sitzen, nur ein Anhängsel ändert sich.",
  },
  {
    term: "Nickase",
    group: "Werkzeuge",
    short: "Cas9, die nur einen Strang anritzt",
    long: "Der entscheidende Umbau. Ein Nick ist kein Bruch – die Zelle repariert ihn sauber und benutzt dabei den anderen Strang als Vorlage.",
  },
  {
    term: "R-Schleife",
    group: "Ablauf",
    short: "Die lokal geöffnete Stelle",
    long: "Die Guide-RNA paart mit einem Strang, der andere hängt frei heraus. Nur diesen freien Einzelstrang kann die Desaminase überhaupt angreifen.",
  },
  {
    term: "Semikonservative Replikation",
    group: "Ablauf",
    short: "Jede Tochterhelix behält einen alten Strang",
    long: "Die Helix trennt sich, an jeden alten Strang wird ein neuer gebaut. So wird eine neu geschriebene Base an alle Tochterzellen weitergegeben.",
  },
  {
    term: "Spleißen",
    group: "Ablauf",
    short: "Introns werden aus der mRNA herausgeschnitten",
    long: "Die Schnittstellen erkennt die Zelle an kurzen Signalen – fast jedes Intron beginnt mit GT. Zerstört man dieses Signal, geht das Gen kaputt.",
  },
];

export function findGlossary(term: string): GlossaryEntry | undefined {
  const needle = term.toLowerCase();
  return GLOSSARY.find(
    (entry) =>
      entry.term.toLowerCase() === needle ||
      entry.aliases?.some((alias) => alias.toLowerCase() === needle),
  );
}

export function searchGlossary(query: string): readonly GlossaryEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return GLOSSARY;
  return GLOSSARY.filter(
    (entry) =>
      entry.term.toLowerCase().includes(needle) ||
      entry.short.toLowerCase().includes(needle) ||
      entry.long.toLowerCase().includes(needle) ||
      entry.aliases?.some((alias) => alias.toLowerCase().includes(needle)),
  );
}

/* ------------------------------------------------------------------ */
/* Selbsttest                                                          */
/* ------------------------------------------------------------------ */

export interface Question {
  question: string;
  answer: string;
}

export const QUESTIONS: readonly Question[] = [
  {
    question: "Warum kann ein Cytosin-Base-Editor kein A in ein G umwandeln?",
    answer:
      "Weil seine Desaminase nur Cytosin erkennt. Jede Desaminase passt zu genau einer Base – für A→G braucht es die des Adenin-Base-Editors.",
  },
  {
    question: "Du willst auf dem Sinnstrang ein T zu einem C machen. Warum geht das nicht direkt?",
    answer:
      "Kein Base-Editor schreibt T→C. Aber gegenüber dem T steht auf dem Gegenstrang ein A – und A→G beherrscht der Adenin-Base-Editor. Wird dieses A zu G, steht gegenüber automatisch ein C.",
  },
  {
    question: "Warum reicht es nicht, die Zielbase zu kennen? Was muss noch stimmen?",
    answer:
      "Es muss eine Guide-RNA geben, die die Base auf Position 4 bis 8 des Protospacers legt, und dahinter muss ein passendes PAM stehen. Sonst bindet das Enzym gar nicht erst.",
  },
  {
    question: "Was ist ein Bystander-Edit, und warum lässt er sich nicht einfach abschalten?",
    answer:
      "Die Desaminase sitzt fest am Enzym und erreicht ein Fenster von etwa fünf Basen. Sie unterscheidet nicht zwischen der gemeinten Base und einer gleichartigen daneben – beide liegen im Fenster.",
  },
  {
    question: "Warum ist eine stumme Mutation nicht automatisch harmlos?",
    answer:
      "Sie ändert zwar die Aminosäure nicht, kann aber Signale in der DNA zerstören oder neu schaffen – etwa Spleißstellen. Die Progerie-Mutation c.1824C>T ist genau so ein Fall.",
  },
  {
    question: "Warum benutzt man für eine Korrektur keine normale Cas9-Schere?",
    answer:
      "Sie erzeugt einen Doppelstrangbruch. Beim Zusammenflicken verliert oder gewinnt die Zelle zufällig Basen. Man kann damit ein Gen zerstören, aber nicht gezielt einen Buchstaben austauschen.",
  },
  {
    question: "Ein Basenpaar hat drei Wasserstoffbrücken. Welche Basen sind das, und was folgt daraus?",
    answer:
      "G und C. Abschnitte mit vielen G-C-Paaren halten fester zusammen und haben einen höheren Schmelzpunkt als A-T-reiche Abschnitte.",
  },
  {
    question: "Wie kommt es, dass ein Edit an alle Tochterzellen weitergegeben wird?",
    answer:
      "Über die semikonservative Replikation: Der Strang mit der neuen Base dient als Vorlage für einen neuen Gegenstrang. Der Nick im unveränderten Strang sorgt schon vorher dafür, dass die Reparatur ihn und nicht die neue Base korrigiert.",
  },
];
