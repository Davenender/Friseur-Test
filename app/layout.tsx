import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

/** Für Basensequenzen und Codons: gleiche Zeichenbreite hält die Spalten sauber. */
const mono = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Base-Editing-Labor",
  description:
    "Interaktive Biologie-App zum Base-Editing: An einer dreidimensionalen DNA-Doppelhelix ein einzelnes Basenpaar gezielt austauschen – Krankheiten heilen, auslösen und die Grenzen der Methode verstehen.",
  applicationName: "Base-Editing-Labor",
  openGraph: {
    title: "Base-Editing-Labor",
    description:
      "Punktmutationen gezielt setzen: 3D-Doppelhelix, Base- und Prime-Editoren, neun Fälle vom Heilen bis zum Verbessern.",
    locale: "de_DE",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
