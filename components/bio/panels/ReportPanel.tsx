"use client";

/** Molekularer Befund: Was hat sich an DNA und Protein tatsächlich geändert? */

import { aminoInfo, formatChangeLong, gcContent, meltingTemperature } from "@/lib/bio/genetics";
import { SEVERITY_STYLE, type GeneDef, type GenotypeReport } from "@/lib/bio/phenotype";
import { Chip, Panel } from "../ui";

interface Props {
  gene: GeneDef;
  report: GenotypeReport;
  sequence: string;
  reference: string;
  changedIndices: number[];
  onSelect: (index: number) => void;
}

export function ReportPanel({ gene, report, sequence, reference, changedIndices, onSelect }: Props) {
  const propertyChanged = report.changes.filter(
    (change) => aminoInfo(change.from).property !== aminoInfo(change.to).property,
  );

  return (
    <div className="space-y-4">
      <Panel title="Veränderte Basenpaare" subtitle={`${changedIndices.length} Abweichung(en) von der Referenz`}>
        {changedIndices.length === 0 ? (
          <p className="text-[11px] text-slate-500">Die Sequenz entspricht exakt der Referenz.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {changedIndices.map((index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSelect(index)}
                style={{ touchAction: "manipulation" }}
                className="rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/10 px-2 py-1 font-mono text-[11px] text-fuchsia-200"
              >
                {index + 1}: {reference[index] ?? "–"} → {sequence[index] ?? "–"}
              </button>
            ))}
          </div>
        )}
        {report.lengthDelta !== 0 && (
          <p className="mt-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-2 text-[11px] text-rose-200">
            Längenänderung: {report.lengthDelta > 0 ? "+" : ""}
            {report.lengthDelta} Basen{report.frameshift ? " – das Leseraster ist verschoben." : " – das Leseraster bleibt erhalten."}
          </p>
        )}
      </Panel>

      {gene.kind === "coding" && (
        <Panel title="Protein" subtitle={`${report.protein.length} Aminosäuren`}>
          {report.changes.length === 0 && !report.frameshift ? (
            <p className="text-[11px] text-emerald-300">
              Das Protein entspricht der Referenz.
              {changedIndices.length > 0 && " Die DNA-Änderungen sind stumm – der genetische Code ist degeneriert."}
            </p>
          ) : (
            <ul className="space-y-2">
              {report.changes.map((change) => {
                const from = aminoInfo(change.from);
                const to = aminoInfo(change.to);
                const shift = from.property !== to.property;
                return (
                  <li
                    key={change.key}
                    className={`rounded-lg border p-2.5 ${
                      to.code1 === "*"
                        ? "border-rose-500/40 bg-rose-500/10"
                        : shift
                          ? "border-amber-500/40 bg-amber-500/10"
                          : "border-slate-800 bg-slate-950/60"
                    }`}
                  >
                    <p className="font-mono text-[12px] text-slate-100">{formatChangeLong(change)}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {from.name} ({from.property}) → {to.code1 === "*" ? "Stoppcodon" : `${to.name} (${to.property})`}
                    </p>
                    {shift && to.code1 !== "*" && (
                      <p className="mt-1 text-[10px] text-amber-300">
                        Die chemische Eigenschaft wechselt – solche Austausche verändern die Faltung am ehesten.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {report.frameshift && (
            <p className="mt-2 text-[11px] text-rose-200">
              Durch den Rasterschub ist ein Vergleich Aminosäure für Aminosäure sinnlos – ab der
              Bruchstelle stimmt nichts mehr.
            </p>
          )}
          {propertyChanged.length > 0 && (
            <p className="mt-3 text-[10px] text-slate-500">
              {propertyChanged.length} von {report.changes.length} Austauschen ändern die chemische
              Klasse der Aminosäure.
            </p>
          )}
        </Panel>
      )}

      <Panel title="Bewertung" subtitle="Wie ein humangenetisches Labor den Befund liest">
        {report.findings.length === 0 ? (
          <p className="text-[11px] text-slate-500">Keine Auffälligkeiten.</p>
        ) : (
          <ul className="space-y-2">
            {report.findings.map((finding, index) => {
              const style = SEVERITY_STYLE[finding.severity];
              return (
                <li
                  key={`${finding.title}-${index}`}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5"
                  style={{ borderLeftColor: style.color, borderLeftWidth: 3 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12px] font-semibold text-slate-100">{finding.title}</p>
                    <Chip>{style.label}</Chip>
                  </div>
                  {finding.code && (
                    <p className="mt-0.5 font-mono text-[10px] text-slate-500">{finding.code}</p>
                  )}
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{finding.text}</p>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Sequenzkennwerte">
        <dl className="grid grid-cols-2 gap-3 text-[11px]">
          <div>
            <dt className="text-slate-500">Länge</dt>
            <dd className="font-mono text-slate-200">{sequence.length} bp</dd>
          </div>
          <div>
            <dt className="text-slate-500">GC-Gehalt</dt>
            <dd className="font-mono text-slate-200">{gcContent(sequence).toFixed(1)} %</dd>
          </div>
          <div>
            <dt className="text-slate-500">Wasserstoffbrücken</dt>
            <dd className="font-mono text-slate-200">
              {[...sequence].reduce((sum, base) => sum + (base === "G" || base === "C" ? 3 : 2), 0)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Schmelzpunkt (Wallace)</dt>
            <dd className="font-mono text-slate-200">{meltingTemperature(sequence)} °C</dd>
          </div>
        </dl>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          G≡C-Paare halten mit drei Wasserstoffbrücken stärker zusammen als A=T-Paare mit zweien.
          Deshalb steigt der Schmelzpunkt mit dem GC-Gehalt.
        </p>
      </Panel>
    </div>
  );
}
