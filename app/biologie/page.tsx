import type { Metadata, Viewport } from "next";
import { BaseEditorLab } from "@/components/bio/BaseEditorLab";

export const metadata: Metadata = {
  title: "Base-Editing-Labor · Gezielter Austausch eines Basenpaares",
  description:
    "Interaktive Biologie-App zum Base-Editing: An einer dreidimensionalen DNA-Doppelhelix ein einzelnes Basenpaar gezielt austauschen – Krankheiten heilen, auslösen und die Grenzen der Methode verstehen.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function BiologiePage() {
  return <BaseEditorLab />;
}
