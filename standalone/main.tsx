/**
 * Einstiegspunkt des Einzeldatei-Builds: dieselbe App wie unter Next.js,
 * nur ohne Framework drumherum.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BaseEditorLab } from "@/components/bio/BaseEditorLab";

const container = document.getElementById("app");
if (!container) throw new Error("Container #app fehlt im Dokument.");

createRoot(container).render(
  <StrictMode>
    <BaseEditorLab />
  </StrictMode>,
);
