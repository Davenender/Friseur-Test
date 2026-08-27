import {
  C1_DISTANCE_A,
  STRAND_OFFSET_RAD,
  SUGAR_RADIUS_A,
  basePair,
  hydrogenBondCount,
} from "../lib/bio/molecule";
import type { Base } from "../lib/bio/genetics";

const dist = (a: { u: number; v: number }, b: { u: number; v: number }) =>
  Math.hypot(a.u - b.u, a.v - b.v);

for (const base of ["A", "G"] as Base[]) {
  const { layout } = basePair(base);
  console.log(`\n=== Paar mit ${base} auf dem Sinnstrang ===`);
  console.log(`C1'-C1'-Abstand: ${layout.c1Distance.toFixed(2)} Å  (real 10,4-10,7)`);
  console.log(`Wasserstoffbrücken: ${layout.hydrogenBonds.length} (erwartet ${hydrogenBondCount(base)})`);
  for (const [a, b] of layout.hydrogenBonds) {
    const atomA = layout.atoms[a];
    const atomB = layout.atoms[b];
    console.log(
      `  ${atomA.label.padEnd(20)} … ${atomB.label.padEnd(20)} ${dist(atomA, atomB).toFixed(2)} Å  (real 2,8-3,0)`,
    );
  }
  // Ringbindungslängen stichprobenartig
  const lengths = layout.bonds.map((bond) => dist(layout.atoms[bond.from], layout.atoms[bond.to]));
  console.log(
    `  Bindungslängen: min ${Math.min(...lengths).toFixed(2)} / max ${Math.max(...lengths).toFixed(2)} Å`,
  );
  // Liegen beide Basen zwischen den Zuckern?
  const uValues = layout.atoms.map((atom) => atom.u);
  console.log(
    `  u-Bereich der Atome: ${Math.min(...uValues).toFixed(2)} … ${Math.max(...uValues).toFixed(2)}`,
  );
}

console.log(`\n=== Helix ===`);
console.log(`Mittlerer C1'-C1'-Abstand: ${C1_DISTANCE_A.toFixed(2)} Å`);
console.log(
  `Daraus folgender Strangversatz: ${((STRAND_OFFSET_RAD * 180) / Math.PI).toFixed(1)}°  (real ~137°)`,
);
console.log(`C1'-Radius: ${SUGAR_RADIUS_A} Å`);
const minor = STRAND_OFFSET_RAD;
const major = 2 * Math.PI - STRAND_OFFSET_RAD;
console.log(
  `Furchenbreiten als Winkel: kleine ${((minor * 180) / Math.PI).toFixed(0)}°, große ${((major * 180) / Math.PI).toFixed(0)}°`,
);
