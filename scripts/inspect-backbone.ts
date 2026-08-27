/** Prüft, ob das Zucker-Phosphat-Rückgrat eine durchgehende Kette bildet. */
import { RISE_A, SUGAR_RADIUS_A, TWIST_RAD, backbone } from "../lib/bio/molecule";

const model = backbone();
const place = (u: number, v: number, w: number, angle: number, y: number) => {
  const radial = [Math.cos(angle), 0, Math.sin(angle)];
  const tangent = [-Math.sin(angle), 0, Math.cos(angle)];
  const r = SUGAR_RADIUS_A - u;
  return [
    radial[0] * r + tangent[0] * v,
    y + w,
    radial[2] * r + tangent[2] * v,
  ];
};
const d = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const o3 = model.atoms[model.o3];
const p = model.atoms[model.phosphorus];
const o3Pos = place(o3.u, o3.v, o3.w, 0, 0);
const pNext = place(p.u, p.v, p.w, TWIST_RAD, RISE_A);
console.log(`O3'(i) → P(i+1):  ${d(o3Pos, pNext).toFixed(2)} Å   (echte Bindung 1,6 Å)`);

const pThis = place(p.u, p.v, p.w, 0, 0);
console.log(`P(i) → P(i+1):    ${d(pThis, pNext).toFixed(2)} Å   (real ~7 Å)`);
console.log(`Phosphat-Radius:  ${(SUGAR_RADIUS_A - p.u).toFixed(2)} Å   (real ~9,4 Å)`);

const inner = model.bonds.map((bond) => {
  const a = model.atoms[bond.from];
  const b = model.atoms[bond.to];
  return { label: `${a.label}-${b.label}`, len: Math.hypot(a.u - b.u, a.v - b.v, a.w - b.w) };
});
console.log("\nBindungen im Nukleotid (real 1,4-1,6 Å):");
for (const bond of inner) console.log(`  ${bond.label.padEnd(14)} ${bond.len.toFixed(2)} Å`);
