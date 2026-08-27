"use client";

/** Der Wissensteil: Mechanismus, Grenzen, Vererbung des Edits, Recht und Ethik. */

import { useMemo, useState, type ReactNode } from "react";
import { type Base } from "@/lib/bio/genetics";
import { BASE_COLORS } from "@/lib/bio/colors";
import { GLOSSARY, PAIRING_RULE, PART_INFO, QUESTIONS, searchGlossary } from "@/lib/bio/explain";
import { BaseProfile } from "../PartCard";

function Section({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details
      open={open}
      className="group rounded-2xl border border-slate-800 bg-slate-900/60 [&_p]:leading-relaxed"
    >
      <summary
        className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold text-slate-100 marker:hidden"
        style={{ touchAction: "manipulation" }}
      >
        {title}
        <span className="text-slate-500 transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="space-y-3 px-4 pb-4 text-[12px] text-slate-300">{children}</div>
    </details>
  );
}

const BASES: Base[] = ["A", "C", "G", "T"];

/** Welches Werkzeug schafft welchen Austausch? Null = nur Prime-Editing. */
const TOOL_MATRIX: Record<string, { tool: string; strand: string; color: string } | null> = {
  "C>T": { tool: "CBE", strand: "direkt", color: "#38bdf8" },
  "G>A": { tool: "CBE", strand: "Gegenstrang", color: "#38bdf8" },
  "A>G": { tool: "ABE", strand: "direkt", color: "#f472b6" },
  "T>C": { tool: "ABE", strand: "Gegenstrang", color: "#f472b6" },
  "C>G": { tool: "CGBE", strand: "direkt", color: "#a78bfa" },
  "G>C": { tool: "CGBE", strand: "Gegenstrang", color: "#a78bfa" },
  "A>C": { tool: "AYBE", strand: "direkt", color: "#fbbf24" },
  "T>G": { tool: "AYBE", strand: "Gegenstrang", color: "#fbbf24" },
  "A>T": null,
  "T>A": null,
  "C>A": null,
  "G>T": null,
};

type Section = "basen" | "erklaert" | "glossar" | "selbsttest";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "basen", label: "Basen" },
  { id: "erklaert", label: "Erklärt" },
  { id: "glossar", label: "Glossar" },
  { id: "selbsttest", label: "Selbsttest" },
];

export function KnowledgePanel() {
  const [section, setSection] = useState<Section>("basen");

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
        {SECTIONS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setSection(entry.id)}
            style={{ touchAction: "manipulation" }}
            className={`min-h-9 flex-1 rounded-lg text-[11px] font-semibold transition-colors ${
              section === entry.id ? "bg-slate-700 text-white" : "text-slate-400"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {section === "basen" && <BasesSection />}
      {section === "glossar" && <GlossarySection />}
      {section === "selbsttest" && <QuizSection />}
      {section === "erklaert" && <Explained />}
    </div>
  );
}

function BasesSection() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="text-sm font-semibold text-slate-100">Was die Buchstaben bedeuten</h3>
        <p className="mt-1.5 text-[12px] leading-relaxed text-slate-300">
          A, T, G und C sind Abkürzungen für vier Moleküle. Nur ihre Reihenfolge unterscheidet ein
          Gen vom nächsten – Zucker und Phosphat sind überall gleich.
        </p>
        <p className="mt-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2.5 text-[11px] leading-relaxed text-cyan-100">
          {PAIRING_RULE}
        </p>
      </div>

      <div className="space-y-2">
        {(["A", "T", "G", "C"] as Base[]).map((base) => (
          <BaseProfile key={base} base={base} />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="text-sm font-semibold text-slate-100">Die drei Bauteile eines Nukleotids</h3>
        <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">
          Jeder Baustein der DNA besteht aus denselben drei Teilen. Tippe sie in der 3D-Ansicht an,
          dann erscheint die Erklärung direkt am Modell.
        </p>
        <ul className="mt-3 space-y-2">
          {(["phosphat", "zucker", "base"] as const).map((kind) => {
            const info = PART_INFO[kind];
            return (
              <li
                key={kind}
                className="rounded-lg border-l-2 bg-slate-950/60 p-2.5"
                style={{ borderColor: info.color }}
              >
                <p className="text-[12px] font-semibold text-slate-100">
                  {info.title} <span className="font-normal text-slate-500">· {info.short}</span>
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{info.job}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function GlossarySection() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchGlossary(query), [query]);
  const groups = useMemo(() => {
    const map = new Map<string, typeof GLOSSARY>();
    for (const entry of results) {
      map.set(entry.group, [...(map.get(entry.group) ?? []), entry] as typeof GLOSSARY);
    }
    return [...map.entries()];
  }, [results]);

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Begriff suchen …"
        aria-label="Glossar durchsuchen"
        className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-400"
      />
      {results.length === 0 && (
        <p className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-[12px] text-slate-500">
          Kein Eintrag gefunden. Versuch es mit einem kürzeren Suchwort.
        </p>
      )}
      {groups.map(([group, entries]) => (
        <div key={group}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {group}
          </p>
          <div className="space-y-1.5">
            {entries.map((entry) => (
              <details
                key={entry.term}
                className="group rounded-xl border border-slate-800 bg-slate-900/60"
              >
                <summary
                  className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 marker:hidden"
                  style={{ touchAction: "manipulation" }}
                >
                  <span>
                    <span className="block text-[12px] font-semibold text-slate-100">{entry.term}</span>
                    <span className="block text-[10px] text-slate-500">{entry.short}</span>
                  </span>
                  <span className="text-slate-600 transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <p className="px-3 pb-3 text-[11px] leading-relaxed text-slate-400">{entry.long}</p>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function QuizSection() {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  return (
    <div className="space-y-2">
      <p className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-[12px] leading-relaxed text-slate-400">
        Erst selbst antworten, dann aufdecken. Die Fragen zielen genau auf das, was man beim
        Ausprobieren leicht übersieht.
      </p>
      {QUESTIONS.map((entry, index) => {
        const open = revealed.has(index);
        return (
          <div key={entry.question} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-[12px] font-medium leading-relaxed text-slate-100">
              {index + 1}. {entry.question}
            </p>
            {open ? (
              <p className="mt-2 rounded-lg border-l-2 border-emerald-500 bg-emerald-500/10 p-2.5 text-[11px] leading-relaxed text-emerald-100">
                {entry.answer}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setRevealed((current) => new Set(current).add(index))}
                style={{ touchAction: "manipulation" }}
                className="mt-2 min-h-9 rounded-lg border border-slate-700 px-3 text-[11px] font-semibold text-slate-300"
              >
                Antwort zeigen
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Explained() {
  return (
    <div className="space-y-3">
      <Section title="Was Base-Editing überhaupt macht" open>
        <p>
          Eine <strong className="text-slate-100">Punktmutation</strong> ist der Austausch eines
          einzigen Basenpaares. Genau diesen Austausch gezielt herbeizuführen – als Korrektur einer
          Krankheit oder als Experiment – war lange das größte Problem der Gentechnik.
        </p>
        <p>
          Base-Editing löst es chemisch statt mechanisch: Ein Enzymkomplex fährt an die richtige
          Stelle im Genom, klappt die Doppelhelix dort lokal auf und wandelt eine einzelne Base
          chemisch um – <em>ohne den Doppelstrang zu durchtrennen</em>. Der Zucker-Phosphat-Rücken
          bleibt intakt, es entsteht kein Bruch, den die Zelle fehleranfällig zusammenflicken müsste.
        </p>
        <p className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2.5 text-cyan-100">
          Kurzformel: Base-Editing schreibt einen Buchstaben um. Die klassische CRISPR-Schere reißt
          die Seite heraus und hofft, dass die Zelle sie richtig wieder einklebt.
        </p>
      </Section>

      <Section title="Der Bauplan des Enzyms">
        <p>Ein Base-Editor besteht aus vier Teilen, die als ein einziges Molekül gebaut sind:</p>
        <ol className="space-y-2">
          {[
            ["Cas9-Nickase (nCas9)", "Die Adresssuche. Sie ist so verändert, dass sie nur noch einen der beiden Stränge anritzt statt beide zu durchtrennen."],
            ["Guide-RNA (sgRNA)", "Die Adresse selbst: 20 Basen, die zur Zielstelle passen. Sie bestimmt auch, welcher der beiden Stränge bearbeitet wird."],
            ["Desaminase", "Der eigentliche Chemiker. Sie reißt eine Aminogruppe von der Base ab und macht so aus C ein U oder aus A ein Inosin."],
            ["UGI (nur beim CBE)", "Ein Hemmstoff, der die zelleigene Reparatur davon abhält, das frisch erzeugte Uracil sofort wieder auszuschneiden."],
          ].map(([title, text]) => (
            <li key={title} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
              <p className="font-semibold text-slate-100">{title}</p>
              <p className="mt-0.5 text-slate-400">{text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Ablauf in sechs Schritten">
        <ol className="space-y-2">
          {[
            "Die Guide-RNA findet über Basenpaarung ihre 20 Basen lange Zielstelle.",
            "Direkt daneben muss das PAM sitzen – ohne dieses Signal bindet Cas9 nicht.",
            "Der Komplex trennt die beiden Stränge lokal auf: Es entsteht eine R-Schleife. Ein Strang paart mit der RNA, der andere hängt frei heraus.",
            "Die Desaminase greift nur diesen freihängenden Einzelstrang an – und zwar in einem schmalen Fenster von etwa fünf Basen.",
            "Die Nickase ritzt den gegenüberliegenden Strang an. Damit signalisiert sie der Zelle: „Dieser Strang hier ist der falsche.“",
            "Beim Reparieren und spätestens bei der nächsten Replikation wird die neue Base auf beiden Strängen festgeschrieben.",
          ].map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-300">
                {index + 1}
              </span>
              <span className="text-slate-300">{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Welcher Austausch geht mit welchem Werkzeug?">
        <p>
          Zwölf Austausche sind denkbar. Base-Editoren beherrschen acht davon – vier direkt und vier,
          indem man die Guide-RNA auf den Gegenstrang legt. Für die restlichen vier braucht es
          Prime-Editing.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1 text-center text-[10px]">
            <thead>
              <tr>
                <th className="text-slate-500">von ↓ / zu →</th>
                {BASES.map((to) => (
                  <th key={to} className="font-mono text-sm" style={{ color: BASE_COLORS[to] }}>
                    {to}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BASES.map((from) => (
                <tr key={from}>
                  <th className="font-mono text-sm" style={{ color: BASE_COLORS[from] }}>
                    {from}
                  </th>
                  {BASES.map((to) => {
                    if (from === to) {
                      return (
                        <td key={to} className="rounded bg-slate-800/40 py-2 text-slate-600">
                          –
                        </td>
                      );
                    }
                    const entry = TOOL_MATRIX[`${from}>${to}`];
                    return (
                      <td
                        key={to}
                        className="rounded py-1.5"
                        style={{
                          backgroundColor: entry ? `${entry.color}22` : "rgba(52,211,153,0.12)",
                        }}
                      >
                        <span
                          className="block font-bold"
                          style={{ color: entry ? entry.color : "#34d399" }}
                        >
                          {entry ? entry.tool : "PE"}
                        </span>
                        <span className="block text-[8px] text-slate-500">
                          {entry ? entry.strand : "nur Prime"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-slate-400">
          Merksatz: Base-Editoren können nur <strong className="text-slate-200">Transitionen</strong>{" "}
          (Purin ↔ Purin, Pyrimidin ↔ Pyrimidin) wirklich zuverlässig. Die vier Felder mit „PE“ sind{" "}
          <strong className="text-slate-200">Transversionen</strong>, für die es bis heute keinen
          verlässlichen Base-Editor gibt.
        </p>
      </Section>

      <Section title="Das Editierfenster und die Bystander">
        <p>
          Die Desaminase sitzt an einer festen Stelle des Komplexes. Sie erreicht deshalb nur einen
          schmalen Ausschnitt des Protospacers – meist die Positionen 4 bis 8, gezählt vom
          PAM-fernen Ende. Am effektivsten arbeitet sie in der Mitte, um Position 6.
        </p>
        <p>
          Das ist Segen und Fluch zugleich: Sie unterscheidet nicht zwischen der Base, die du meinst,
          und einer gleichartigen Base zwei Stellen daneben. Solche unbeabsichtigten Nachbar-Edits
          heißen <strong className="text-slate-100">Bystander-Edits</strong> und sind das größte
          praktische Problem der Methode.
        </p>
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-amber-100">
          Deshalb ist die Auswahl der Guide-RNA keine Formsache: Zwei Guides können dieselbe Base
          treffen – die eine sauber, die andere mit drei zusätzlichen Treffern im selben Codon.
        </p>
      </Section>

      <Section title="Das PAM-Problem">
        <p>
          Cas9 bindet nur, wenn unmittelbar hinter der Zielsequenz ein kurzes Erkennungsmotiv steht:
          das <strong className="text-slate-100">PAM</strong> (Protospacer Adjacent Motif). Beim
          Original aus <em>Streptococcus pyogenes</em> lautet es NGG.
        </p>
        <p>
          Daraus folgt eine harte Einschränkung: Eine Base ist nur dann editierbar, wenn zufällig
          13 bis 17 Basen weiter ein GG steht. Für viele Krankheitsmutationen ist das schlicht nicht
          der Fall. Die Antwort der Forschung waren umgebaute Cas9-Varianten mit gelockertem PAM –
          SpCas9-NG, SpRY, NRCH. Sie erreichen mehr Stellen, arbeiten aber langsamer und schneiden
          häufiger an falschen Orten mit.
        </p>
      </Section>

      <Section title="Wie der Edit vererbt wird">
        <p>
          Nach dem Editieren steht die neue Base zunächst nur auf einem der beiden Stränge – das
          Basenpaar ist eine <strong className="text-slate-100">Fehlpaarung</strong>. Hier greift
          derselbe Mechanismus, den das Meselson-Stahl-Experiment sichtbar gemacht hat.
        </p>
        <p>
          Die DNA repliziert <strong className="text-slate-100">semikonservativ</strong>: Die
          Doppelhelix wird aufgetrennt, und jeder alte Strang dient als Vorlage für einen neuen. Jede
          Tochterhelix besteht danach aus einem alten und einem neuen Strang.
        </p>
        <p>
          Für den Edit heißt das: Der Strang mit der neuen Base gibt sie an seine Tochterhelix weiter
          – dort steht sie nun auf beiden Strängen. Der Nick, den die Nickase in den unveränderten
          Strang gesetzt hat, sorgt schon vorher dafür, dass die Reparaturenzyme meist genau diesen
          Strang als den „falschen“ behandeln und ihn passend zur neuen Base umschreiben.
        </p>
        <p className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2.5 text-cyan-100">
          Probier es aus: Der Knopf „Zellteilung“ über der Helix zeigt, wie sich der Doppelstrang
          teilt und der Edit in beide Tochterzellen übergeht.
        </p>
      </Section>

      <Section title="Warum nicht einfach schneiden?">
        <p>
          Die klassische Cas9-Schere erzeugt einen Doppelstrangbruch. Die Zelle repariert ihn fast
          immer über <strong className="text-slate-100">Non-Homologous End Joining</strong> – ein
          Verfahren, das die losen Enden zusammenklebt und dabei zufällig Basen verliert oder
          hinzufügt. Man kann damit ein Gen zuverlässig zerstören, aber praktisch nicht korrigieren.
        </p>
        <p>
          Dazu kommen große Deletionen, Chromosomenverluste und die p53-Antwort der Zelle. Base- und
          Prime-Editing vermeiden all das, weil sie den Doppelstrang nie durchtrennen.
        </p>
      </Section>

      <Section title="Risiken und Grenzen">
        <ul className="space-y-2">
          {[
            ["Bystander-Edits", "Nachbarbasen im Fenster werden mitverändert."],
            ["Off-Target-Edits", "Ähnliche Sequenzen anderswo im Genom werden ebenfalls getroffen."],
            ["RNA-Off-Targets", "Manche Desaminasen greifen auch RNA an – unabhängig von der Guide-RNA."],
            ["Mosaik", "Nicht jede Zelle wird erreicht. In der Praxis liegt der Anteil editierter Zellen selten bei 100 %."],
            ["Transport in die Zelle", "Der Komplex ist groß. Ihn in die richtigen Zellen zu bringen, ist oft schwieriger als das Editieren selbst."],
            ["Kosten", "Zugelassene Gentherapien kosten pro Person mehrere hunderttausend bis über zwei Millionen Euro."],
          ].map(([title, text]) => (
            <li key={title} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
              <p className="font-semibold text-slate-100">{title}</p>
              <p className="mt-0.5 text-slate-400">{text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Recht und Ethik">
        <p>
          Entscheidend ist, <strong className="text-slate-100">welche Zellen</strong> verändert
          werden:
        </p>
        <p>
          <strong className="text-slate-100">Körperzellen (somatisch):</strong> Die Änderung betrifft
          nur die behandelte Person und wird nicht vererbt. Solche Therapien sind erlaubt und
          zugelassen – seit 2023 etwa Casgevy gegen Sichelzellanämie und β-Thalassämie.
        </p>
        <p>
          <strong className="text-slate-100">Keimbahn (Ei-, Samenzellen, Embryonen):</strong> Die
          Änderung wird an alle folgenden Generationen weitergegeben. In Deutschland verbietet das
          Embryonenschutzgesetz das ausdrücklich; international besteht ein breites Moratorium. Der
          chinesische Forscher He Jiankui, der 2018 zwei Embryonen editieren ließ, wurde dafür zu
          drei Jahren Haft verurteilt.
        </p>
        <p>
          Die schwierigen Fragen liegen dazwischen: Ab wann ist eine Veränderung Therapie und ab wann
          Optimierung? Wer entscheidet das für einen Menschen, der noch nicht gefragt werden kann?
          Und was passiert mit einer Gesellschaft, in der nur ein Teil sich solche Behandlungen
          leisten kann?
        </p>
      </Section>

      <Section title="Meilensteine">
        <ul className="space-y-1.5">
          {[
            ["2012", "CRISPR-Cas9 wird als programmierbare Genschere beschrieben."],
            ["2016", "Der erste Cytosin-Base-Editor (BE1) entsteht im Labor von David Liu."],
            ["2017", "Adenin-Base-Editoren werden durch gerichtete Evolution erzeugt – A→G war in der Natur nicht vorhanden."],
            ["2019", "Prime-Editing wird vorgestellt: beliebige Austausche plus kurze Insertionen und Deletionen."],
            ["2021", "Base-Editing verdoppelt die Lebenszeit von Progerie-Mäusen; HbS wird in die harmlose Makassar-Variante umgeschrieben."],
            ["2022", "Ein Base-Editor rettet in Großbritannien das Leben der 13-jährigen Alyssa mit T-Zell-Leukämie."],
            ["2023", "Casgevy wird als erste CRISPR-Therapie zugelassen."],
            ["2024", "Erste klinische Daten zu VERVE-101: eine einmalige Base-Editing-Infusion senkt das LDL-Cholesterin dauerhaft."],
          ].map(([year, text]) => (
            <li key={year} className="flex gap-3">
              <span className="w-10 shrink-0 font-mono text-[11px] font-bold text-emerald-400">{year}</span>
              <span className="text-slate-400">{text}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Begriffe">
        <dl className="space-y-2">
          {[
            ["Punktmutation", "Austausch eines einzelnen Basenpaares."],
            ["Transition", "Purin ↔ Purin (A↔G) oder Pyrimidin ↔ Pyrimidin (C↔T). Für Base-Editoren machbar."],
            ["Transversion", "Purin ↔ Pyrimidin. Für Base-Editoren kaum machbar."],
            ["stumme Mutation", "Die DNA ändert sich, das Protein nicht – weil mehrere Codons dieselbe Aminosäure kodieren."],
            ["Missense-Mutation", "Eine Aminosäure wird durch eine andere ersetzt."],
            ["Nonsense-Mutation", "Ein Aminosäure-Codon wird zum Stoppcodon; das Protein bricht ab."],
            ["Rasterschub", "Einfügen oder Entfernen von Basen, deren Anzahl nicht durch drei teilbar ist. Ab der Stelle wird alles falsch abgelesen."],
            ["Protospacer", "Die 20 Basen, an die die Guide-RNA bindet."],
            ["PAM", "Kurzes Erkennungsmotiv direkt hinter dem Protospacer, ohne das Cas9 nicht bindet."],
            ["R-Schleife", "Die lokal geöffnete Stelle, an der RNA und ein DNA-Strang paaren und der andere Strang frei liegt."],
            ["Nickase", "Cas9-Variante, die nur einen der beiden Stränge anritzt."],
            ["Desaminase", "Enzym, das eine Aminogruppe von einer Base entfernt."],
          ].map(([term, text]) => (
            <div key={term} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
              <dt className="text-[11px] font-semibold text-slate-100">{term}</dt>
              <dd className="text-[11px] text-slate-400">{text}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </div>
  );
}
