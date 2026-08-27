/** Farbschema der vier Basen – gemeinsam genutzt von 3D-Ansicht und Sequenzleiste. */

import type { Base } from "./genetics";

export const BASE_COLORS: Record<Base, string> = {
  A: "#4ade80",
  T: "#fb7185",
  G: "#fbbf24",
  C: "#60a5fa",
};

export const BASE_NAMES: Record<Base, string> = {
  A: "Adenin",
  T: "Thymin",
  G: "Guanin",
  C: "Cytosin",
};
