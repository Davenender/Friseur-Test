import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ChatWidget } from "@/components/ChatWidget";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-head",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Haarstudio Graziella – Ihr Friseur in Mühlheim am Main",
  description:
    "Haarstudio Graziella in Mühlheim am Main / Lämmerspiel. Schnitt, Coloration, Strähnen, Keratinglättung. Jetzt online Termin anfragen.",
  openGraph: {
    title: "Haarstudio Graziella",
    description: "Ihr Friseur in Mühlheim am Main – wo Haarträume wahr werden.",
    locale: "de_DE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
