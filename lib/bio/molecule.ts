/**
 * Der molekulare Bauplan der DNA.
 *
 * Alle Längen stehen in Ångström. Das Basenpaar wird nicht hingemalt, sondern
 * aus echten Maßen konstruiert: Ringe mit 1,39 Å Bindungslänge, Wasserstoff-
 * brücken mit 2,9 Å, glykosidische Bindung mit 1,47 Å. Aus der so entstehenden
 * Breite des Basenpaars ergibt sich dann, wie weit die beiden Stränge auf dem
 * Helixkreis auseinanderstehen – und damit von selbst die große und die kleine
 * Furche.
 *
 * Idealisiert ist die Ebenheit: Echte Basenpaare sind leicht gegeneinander
 * verdreht (Propeller Twist), der Zucker ist gewellt. Beides ist weggelassen,
 * weil es das Bild unruhig macht, ohne etwas zu erklären.
 */

import type { Base } from "./genetics";

/* ------------------------------------------------------------------ */
/* Maße                                                                */
/* ------------------------------------------------------------------ */

/** Höhenzuwachs pro Basenpaar in der B-DNA. */
export const RISE_A = 3.38;
/** Drehung pro Basenpaar: 10,5 Basenpaare je Umdrehung. */
export const TWIST_RAD = (2 * Math.PI) / 10.5;
/** Radius, auf dem das C1'-Atom des Zuckers liegt. */
export const SUGAR_RADIUS_A = 5.85;
/** Umrechnung von Ångström in Szeneneinheiten. */
export const SCALE = 0.35;

const AROMATIC_BOND = 1.39;
const PENTAGON_RADIUS = 1.18;
const GLYCOSIDIC_BOND = 1.47;
const HYDROGEN_BOND = 2.9;

/* ------------------------------------------------------------------ */
/* Atome                                                               */
/* ------------------------------------------------------------------ */

export type Element = "C" | "N" | "O" | "P";

/** Farben nach dem CPK-Schema, wie in jedem Molekülviewer. */
export const ELEMENT_COLORS: Record<Element, string> = {
  C: "#8e9bad",
  N: "#3b82f6",
  O: "#ef4444",
  P: "#f59e0b",
};

export const ELEMENT_NAMES: Record<Element, string> = {
  C: "Kohlenstoff",
  N: "Stickstoff",
  O: "Sauerstoff",
  P: "Phosphor",
};

export const ELEMENT_RADIUS_A: Record<Element, number> = {
  C: 0.62,
  N: 0.58,
  O: 0.55,
  P: 0.8,
};

/** Bauteil, zu dem ein Atom gehört – bestimmt, was beim Antippen erklärt wird. */
export type PartKind = "phosphat" | "zucker" | "base";

export interface Atom {
  u: number;
  v: number;
  w: number;
  element: Element;
  part: PartKind;
  /** Fachbezeichnung wie „N9" oder „C1'". */
  label: string;
}

export interface Bond {
  from: number;
  to: number;
  part: PartKind;
  /** Doppelbindungen im Ring werden etwas dicker gezeichnet. */
  aromatic?: boolean;
}

/* ------------------------------------------------------------------ */
/* Kleine Vektorhilfen in der Ebene                                    */
/* ------------------------------------------------------------------ */

type Point = { u: number; v: number };

const add = (a: Point, b: Point): Point => ({ u: a.u + b.u, v: a.v + b.v });
const sub = (a: Point, b: Point): Point => ({ u: a.u - b.u, v: a.v - b.v });
const scale = (a: Point, factor: number): Point => ({ u: a.u * factor, v: a.v * factor });
const length = (a: Point) => Math.hypot(a.u, a.v);
const normalize = (a: Point): Point => {
  const len = length(a) || 1;
  return { u: a.u / len, v: a.v / len };
};
/** Dreht einen Punkt um den Ursprung. */
const rotate = (a: Point, angle: number): Point => ({
  u: a.u * Math.cos(angle) - a.v * Math.sin(angle),
  v: a.u * Math.sin(angle) + a.v * Math.cos(angle),
});

function ringVertices(count: number, radius: number, center: Point, startAngle: number): Point[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = startAngle + (index * 2 * Math.PI) / count;
    return { u: center.u + Math.cos(angle) * radius, v: center.v + Math.sin(angle) * radius };
  });
}

/* ------------------------------------------------------------------ */
/* Basenpaar konstruieren                                              */
/* ------------------------------------------------------------------ */

interface RawBase {
  points: Point[];
  labels: string[];
  elements: Element[];
  /** Ringreihenfolge des Sechsrings. */
  sixRing: number[];
  /** Ringreihenfolge des Fünfrings, bei Pyrimidinen leer. */
  fiveRing: number[];
  bonds: [number, number][];
  /** Atom, an dem der Zucker hängt (N9 bzw. N1). */
  glycosidic: number;
  /** Atome der Watson-Crick-Kante, von der „oberen" Ecke zur „unteren". */
  wc: number[];
}

/**
 * Purin (Adenin, Guanin): Sechsring und Fünfring teilen sich die Bindung C4–C5.
 * Gebaut mit N9 im Ursprung.
 */
function buildPurine(base: "A" | "G"): RawBase {
  const points: Point[] = [];
  const labels: string[] = [];
  const elements: Element[] = [];
  const bonds: [number, number][] = [];
  const push = (point: Point, element: Element, label: string) => {
    points.push(point);
    elements.push(element);
    labels.push(label);
    return points.length - 1;
  };

  // Fünfring: N9 – C8 – N7 – C5 – C4
  const fiveCenter: Point = { u: PENTAGON_RADIUS, v: 0 };
  const fivePoints = ringVertices(5, PENTAGON_RADIUS, fiveCenter, Math.PI);
  const fiveLabels = ["N9", "C8", "N7", "C5", "C4"];
  const fiveElements: Element[] = ["N", "C", "N", "C", "C"];
  const fiveRing = fivePoints.map((point, index) =>
    push(point, fiveElements[index], fiveLabels[index]),
  );
  for (let i = 0; i < 5; i++) bonds.push([fiveRing[i], fiveRing[(i + 1) % 5]]);

  // Sechsring, angesetzt an die Bindung C4–C5.
  const c4 = points[fiveRing[4]];
  const c5 = points[fiveRing[3]];
  const middle = scale(add(c4, c5), 0.5);
  const outward = normalize(sub(middle, fiveCenter));
  const sixCenter = add(middle, scale(outward, AROMATIC_BOND * Math.cos(Math.PI / 6)));
  const angleC4 = Math.atan2(c4.v - sixCenter.v, c4.u - sixCenter.u);
  const angleC5 = Math.atan2(c5.v - sixCenter.v, c5.u - sixCenter.u);
  // In welche Richtung läuft der Ring von C4 nach C5?
  let step = angleC5 - angleC4;
  while (step > Math.PI) step -= 2 * Math.PI;
  while (step < -Math.PI) step += 2 * Math.PI;
  const direction = Math.sign(step);
  // Ringfolge C4 – C5 – C6 – N1 – C2 – N3
  const sixLabels = ["C4", "C5", "C6", "N1", "C2", "N3"];
  const sixElements: Element[] = ["C", "C", "C", "N", "C", "N"];
  const sixRing = sixLabels.map((label, index) => {
    if (index === 0) return fiveRing[4];
    if (index === 1) return fiveRing[3];
    const angle = angleC4 + direction * index * (Math.PI / 3);
    const point = {
      u: sixCenter.u + Math.cos(angle) * AROMATIC_BOND,
      v: sixCenter.v + Math.sin(angle) * AROMATIC_BOND,
    };
    return push(point, sixElements[index], label);
  });
  for (let i = 0; i < 6; i++) {
    const from = sixRing[i];
    const to = sixRing[(i + 1) % 6];
    const fused =
      (from === fiveRing[4] && to === fiveRing[3]) || (from === fiveRing[3] && to === fiveRing[4]);
    if (!fused) bonds.push([from, to]);
  }

  /** Setzt eine Gruppe außen an einen Ringatom-Platz. */
  const substituent = (ringAtom: number, distance: number, element: Element, label: string) => {
    const atom = points[ringAtom];
    const dir = normalize(sub(atom, sixCenter));
    const index = push(add(atom, scale(dir, distance)), element, label);
    bonds.push([ringAtom, index]);
    return index;
  };

  const c6 = sixRing[2];
  const n1 = sixRing[3];
  const c2 = sixRing[4];

  const wc: number[] = [];
  if (base === "A") {
    wc.push(substituent(c6, 1.34, "N", "N6 (Aminogruppe)"));
    wc.push(n1);
  } else {
    wc.push(substituent(c6, 1.23, "O", "O6 (Carbonyl)"));
    wc.push(n1);
    wc.push(substituent(c2, 1.34, "N", "N2 (Aminogruppe)"));
  }

  return { points, labels, elements, sixRing, fiveRing, bonds, glycosidic: fiveRing[0], wc };
}

/**
 * Pyrimidin (Cytosin, Thymin): ein Sechsring, N1 trägt den Zucker.
 * Gebaut mit N3 im Ursprung – von dort wird es später an das Purin gesetzt.
 */
function buildPyrimidine(base: "C" | "T"): RawBase {
  const points: Point[] = [];
  const labels: string[] = [];
  const elements: Element[] = [];
  const bonds: [number, number][] = [];
  const push = (point: Point, element: Element, label: string) => {
    points.push(point);
    elements.push(element);
    labels.push(label);
    return points.length - 1;
  };

  // N3 sitzt im Ursprung, der Ringmittelpunkt liegt in +u-Richtung.
  const center: Point = { u: AROMATIC_BOND, v: 0 };
  // Ringfolge ab N3: N3 – C4 – C5 – C6 – N1 – C2
  const ringLabels = ["N3", "C4", "C5", "C6", "N1", "C2"];
  const ringElements: Element[] = ["N", "C", "C", "C", "N", "C"];
  const sixRing = ringLabels.map((label, index) => {
    const angle = Math.PI + index * (Math.PI / 3);
    const point = {
      u: center.u + Math.cos(angle) * AROMATIC_BOND,
      v: center.v + Math.sin(angle) * AROMATIC_BOND,
    };
    return push(point, ringElements[index], label);
  });
  for (let i = 0; i < 6; i++) bonds.push([sixRing[i], sixRing[(i + 1) % 6]]);

  const substituent = (ringAtom: number, distance: number, element: Element, label: string) => {
    const atom = points[ringAtom];
    const dir = normalize(sub(atom, center));
    const index = push(add(atom, scale(dir, distance)), element, label);
    bonds.push([ringAtom, index]);
    return index;
  };

  const c4 = sixRing[1];
  const n3 = sixRing[0];
  const c2 = sixRing[5];
  const c5 = sixRing[2];

  const wc: number[] = [];
  if (base === "C") {
    wc.push(substituent(c4, 1.34, "N", "N4 (Aminogruppe)"));
    wc.push(n3);
    wc.push(substituent(c2, 1.23, "O", "O2 (Carbonyl)"));
  } else {
    wc.push(substituent(c4, 1.23, "O", "O4 (Carbonyl)"));
    wc.push(n3);
    wc.push(substituent(c2, 1.23, "O", "O2 (Carbonyl)"));
    // Die Methylgruppe an C5 unterscheidet Thymin von Uracil.
    substituent(c5, 1.5, "C", "C7 (Methylgruppe)");
  }

  return { points, labels, elements, sixRing, fiveRing: [], bonds, glycosidic: sixRing[4], wc };
}

export interface PlacedAtom extends Atom {
  /** Zu welcher der beiden Basen des Paars das Atom gehört. */
  strand: 0 | 1;
}

export interface BasePairLayout {
  /** Atome beider Basen im Basenpaar-System: u entlang der Paarachse. */
  atoms: PlacedAtom[];
  bonds: (Bond & { strand: 0 | 1 })[];
  /** Wasserstoffbrücken als Atompaare. */
  hydrogenBonds: [number, number][];
  /** Ringe für das vereinfachte Ringmodell. */
  rings: { indices: number[]; strand: 0 | 1; kind: "sechs" | "fuenf" }[];
  /** Abstand der beiden C1'-Atome – bestimmt die Geometrie der Helix. */
  c1Distance: number;
  /** Ankerpunkt für den Zucker der jeweiligen Base. */
  glycosidic: [Point, Point];
}

/**
 * Setzt Purin und Pyrimidin zu einem Watson-Crick-Paar zusammen und dreht das
 * Ergebnis so, dass die Verbindungslinie der beiden C1'-Atome auf der u-Achse
 * liegt. Das Purin steht dabei immer links.
 */
function buildPair(purineBase: "A" | "G", pyrimidineBase: "C" | "T"): BasePairLayout {
  const purine = buildPurine(purineBase);
  const pyrimidine = buildPyrimidine(pyrimidineBase);

  // Die Watson-Crick-Kante des Purins: Von ihr aus wird das Pyrimidin gesetzt.
  const first = purine.points[purine.wc[0]];
  const last = purine.points[purine.wc[purine.wc.length - 1]];
  const edge = normalize(sub(last, first));
  // Senkrechte, die vom Ring wegzeigt.
  const middleWc = purine.points[purine.wc[1]];
  const sixCenterApprox = purine.points[purine.sixRing[0]];
  let normal: Point = { u: -edge.v, v: edge.u };
  if ((middleWc.u - sixCenterApprox.u) * normal.u + (middleWc.v - sixCenterApprox.v) * normal.v < 0) {
    normal = scale(normal, -1);
  }

  // Das Pyrimidin so drehen, dass seine Kante zur Kante des Purins passt.
  const pyrFirst = pyrimidine.points[pyrimidine.wc[0]];
  const pyrLast = pyrimidine.points[pyrimidine.wc[pyrimidine.wc.length - 1]];
  const pyrEdge = normalize(sub(pyrLast, pyrFirst));
  const targetAngle = Math.atan2(edge.v, edge.u);
  const currentAngle = Math.atan2(pyrEdge.v, pyrEdge.u);
  const turn = targetAngle - currentAngle;

  const pyrPoints = pyrimidine.points.map((point) => rotate(point, turn));
  // N3 des Pyrimidins gegenüber N1 des Purins, im Abstand einer Wasserstoffbrücke.
  const target = add(middleWc, scale(normal, HYDROGEN_BOND));
  const offset = sub(target, pyrPoints[pyrimidine.wc[1]]);
  const placed = pyrPoints.map((point) => add(point, offset));

  // Anker der Zucker: 1,47 Å vom Ringatom nach außen, weg vom Partner.
  const purineAnchorDir = normalize(
    sub(purine.points[purine.glycosidic], purine.points[purine.fiveRing[2]]),
  );
  const c1Purine = add(purine.points[purine.glycosidic], scale(purineAnchorDir, GLYCOSIDIC_BOND));
  const pyrRingCenter = placed
    .slice(0, 6)
    .reduce((sum, point) => add(sum, point), { u: 0, v: 0 });
  const pyrCenter = scale(pyrRingCenter, 1 / 6);
  const pyrAnchorDir = normalize(sub(placed[pyrimidine.glycosidic], pyrCenter));
  const c1Pyrimidine = add(placed[pyrimidine.glycosidic], scale(pyrAnchorDir, GLYCOSIDIC_BOND));

  // Alles so drehen und schieben, dass C1'(Purin) im Ursprung liegt und
  // C1'(Pyrimidin) auf der positiven u-Achse.
  const axis = sub(c1Pyrimidine, c1Purine);
  const c1Distance = length(axis);
  const align = -Math.atan2(axis.v, axis.u);
  const place = (point: Point) => rotate(sub(point, c1Purine), align);

  const atoms: PlacedAtom[] = [];
  const bonds: (Bond & { strand: 0 | 1 })[] = [];
  const rings: BasePairLayout["rings"] = [];

  const purineOffset = 0;
  purine.points.forEach((point, index) => {
    const flat = place(point);
    atoms.push({
      u: flat.u,
      v: flat.v,
      w: 0,
      element: purine.elements[index],
      part: "base",
      label: purine.labels[index],
      strand: 0,
    });
  });
  purine.bonds.forEach(([from, to]) =>
    bonds.push({ from: from + purineOffset, to: to + purineOffset, part: "base", strand: 0 }),
  );
  rings.push({ indices: purine.sixRing.map((i) => i + purineOffset), strand: 0, kind: "sechs" });
  rings.push({ indices: purine.fiveRing.map((i) => i + purineOffset), strand: 0, kind: "fuenf" });

  const pyrOffset = atoms.length;
  placed.forEach((point, index) => {
    const flat = place(point);
    atoms.push({
      u: flat.u,
      v: flat.v,
      w: 0,
      element: pyrimidine.elements[index],
      part: "base",
      label: pyrimidine.labels[index],
      strand: 1,
    });
  });
  pyrimidine.bonds.forEach(([from, to]) =>
    bonds.push({ from: from + pyrOffset, to: to + pyrOffset, part: "base", strand: 1 }),
  );
  rings.push({ indices: pyrimidine.sixRing.map((i) => i + pyrOffset), strand: 1, kind: "sechs" });

  const hydrogenBonds: [number, number][] = [];
  const count = Math.min(purine.wc.length, pyrimidine.wc.length);
  for (let i = 0; i < count; i++) {
    hydrogenBonds.push([purine.wc[i] + purineOffset, pyrimidine.wc[i] + pyrOffset]);
  }

  return {
    atoms,
    bonds,
    hydrogenBonds,
    rings: rings.filter((ring) => ring.indices.length > 0),
    c1Distance,
    glycosidic: [place(c1Purine), place(c1Pyrimidine)],
  };
}

/* ------------------------------------------------------------------ */
/* Zucker und Phosphat                                                 */
/* ------------------------------------------------------------------ */

export interface BackboneLayout {
  atoms: Atom[];
  bonds: Bond[];
  sugarRing: number[];
  phosphorus: number;
  /** Sauerstoff am C3' – von hier geht es zum nächsten Nukleotid. */
  o3: number;
  o5: number;
}

/**
 * Zucker und Phosphat liegen in der Ebene aus Radialrichtung und Helixachse –
 * also ungefähr senkrecht zu den Basen, wie in der echten DNA.
 * u zeigt von C1' nach außen, w nach oben.
 */
function buildBackbone(): BackboneLayout {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const push = (u: number, v: number, w: number, element: Element, part: PartKind, label: string) => {
    atoms.push({ u, v, w, element, part, label });
    return atoms.length - 1;
  };

  // Fünfring der Desoxyribose, C1' im Ursprung. Ringfolge C1'-C2'-C3'-C4'-O4'.
  const center: Point = { u: -1.05, v: 0.05 };
  const startAngle = Math.atan2(-center.v, -center.u);
  const ring = ringVertices(5, PENTAGON_RADIUS, center, startAngle);
  const ringLabels = ["C1'", "C2'", "C3'", "C4'", "O4'"];
  const ringElements: Element[] = ["C", "C", "C", "C", "O"];
  const sugarRing = ring.map((point, index) =>
    push(point.u, 0, point.v, ringElements[index], "zucker", ringLabels[index]),
  );
  for (let i = 0; i < 5; i++) {
    bonds.push({ from: sugarRing[i], to: sugarRing[(i + 1) % 5], part: "zucker" });
  }

  /*
   * Der Strang läuft von 5' nach 3' nach oben. Deshalb hängt das Phosphat
   * unterhalb und ein Stück entgegen der Laufrichtung, das O3' oberhalb und ein
   * Stück in Laufrichtung. So ist die Bindung zum nächsten Nukleotid kurz und
   * das Rückgrat wird zu einem durchgehenden Band.
   */
  const c5 = push(-3.0, -0.9, -1.15, "C", "zucker", "C5'");
  bonds.push({ from: sugarRing[3], to: c5, part: "zucker" });
  const o5 = push(-3.5, -1.85, -1.95, "O", "zucker", "O5'");
  bonds.push({ from: c5, to: o5, part: "zucker" });
  const phosphorus = push(-3.55, -2.9, -2.85, "P", "phosphat", "P (Phosphat)");
  bonds.push({ from: o5, to: phosphorus, part: "phosphat" });
  const o1 = push(-4.6, -3.35, -3.15, "O", "phosphat", "O1P");
  const o2 = push(-3.3, -3.05, -4.3, "O", "phosphat", "O2P");
  bonds.push({ from: phosphorus, to: o1, part: "phosphat" });
  bonds.push({ from: phosphorus, to: o2, part: "phosphat" });
  const o3 = push(-2.75, 1.45, 0.65, "O", "zucker", "O3'");
  bonds.push({ from: sugarRing[2], to: o3, part: "zucker" });

  return { atoms, bonds, sugarRing, phosphorus, o3, o5 };
}

const BACKBONE = buildBackbone();
export function backbone(): BackboneLayout {
  return BACKBONE;
}

/* ------------------------------------------------------------------ */
/* Zugriff                                                             */
/* ------------------------------------------------------------------ */

const PAIRS: Record<string, BasePairLayout> = {
  AT: buildPair("A", "T"),
  GC: buildPair("G", "C"),
};

/**
 * Liefert das Basenpaar für eine Base des Sinnstrangs.
 * `flipped` ist wahr, wenn das Purin auf dem Gegenstrang sitzt – dann wird das
 * Paar gespiegelt, damit der Sinnstrang immer bei u = 0 bleibt.
 */
export function basePair(senseBase: Base): { layout: BasePairLayout; flipped: boolean } {
  if (senseBase === "A") return { layout: PAIRS.AT, flipped: false };
  if (senseBase === "G") return { layout: PAIRS.GC, flipped: false };
  if (senseBase === "T") return { layout: PAIRS.AT, flipped: true };
  return { layout: PAIRS.GC, flipped: true };
}

/** Abstand der beiden C1'-Atome, gemittelt über beide Paartypen. */
export const C1_DISTANCE_A = (PAIRS.AT.c1Distance + PAIRS.GC.c1Distance) / 2;

/**
 * Winkelversatz der beiden Stränge auf dem Helixkreis. Er folgt aus der Breite
 * des Basenpaars – deshalb wird er berechnet und nicht gesetzt. Weil er unter
 * 180° liegt, entstehen die ungleich breite große und kleine Furche.
 */
export const STRAND_OFFSET_RAD = 2 * Math.asin(Math.min(1, C1_DISTANCE_A / (2 * SUGAR_RADIUS_A)));

export function hydrogenBondCount(base: Base): 2 | 3 {
  return base === "G" || base === "C" ? 3 : 2;
}
