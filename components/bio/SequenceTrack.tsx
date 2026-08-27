"use client";

/**
 * Die flache Sequenzansicht unter der Helix: Sinnstrang, Gegenstrang und –
 * bei kodierenden Genen – die daraus abgeleiteten Aminosäuren. Jede Base ist
 * ein Tippziel.
 */

import { useEffect, useMemo, useRef } from "react";
import { type Base, aminoInfo, complement, translate } from "@/lib/bio/genetics";
import { type GeneDef, cdsEnd, cdsStart } from "@/lib/bio/phenotype";
import { BASE_COLORS } from "@/lib/bio/colors";

interface Props {
  gene: GeneDef;
  sequence: string;
  referenceSequence: string;
  selected: number | null;
  protospacer: number[];
  editWindow: number[];
  pam: number[];
  predicted: number[];
  guideStrand: 1 | -1 | null;
  onSelect: (index: number) => void;
  /** Markierungen aus dem Fall, z. B. die Zielbase. */
  markers: { index: number; label: string }[];
}

const CELL = 26;

export function SequenceTrack({
  gene,
  sequence,
  referenceSequence,
  selected,
  protospacer,
  editWindow,
  pam,
  predicted,
  guideStrand,
  onSelect,
  markers,
}: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const sets = useMemo(
    () => ({
      protospacer: new Set(protospacer),
      window: new Set(editWindow),
      pam: new Set(pam),
      predicted: new Set(predicted),
      markers: new Map(markers.map((m) => [m.index, m.label])),
    }),
    [protospacer, editWindow, pam, predicted, markers],
  );

  const coding = gene.kind === "coding";
  const start = cdsStart(gene);
  const end = coding ? cdsEnd(gene) + (sequence.length - referenceSequence.length) : start;
  const protein = useMemo(
    () => (coding ? translate(sequence.slice(start, Math.max(start, end))) : ""),
    [coding, sequence, start, end],
  );

  useEffect(() => {
    if (selected === null || !scrollRef.current) return;
    const container = scrollRef.current;
    const target = selected * CELL;
    const left = target - container.clientWidth / 2 + CELL / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [selected]);

  return (
    <div className="flex min-h-0 min-w-0 flex-col">
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="relative" style={{ width: sequence.length * CELL }}>
          {/* Positionsleiste */}
          <div className="flex h-4 items-end">
            {Array.from({ length: sequence.length }, (_, index) =>
              index % 10 === 0 ? (
                <span
                  key={index}
                  className="shrink-0 text-[9px] tabular-nums text-slate-500"
                  style={{ width: CELL }}
                >
                  {index + 1}
                </span>
              ) : (
                <span key={index} className="shrink-0" style={{ width: CELL }} />
              ),
            )}
          </div>

          {/* Sinnstrang */}
          <StrandRow
            sequence={sequence}
            reference={referenceSequence}
            complementRow={false}
            selected={selected}
            sets={sets}
            guideStrand={guideStrand}
            onSelect={onSelect}
            geneStart={start}
            geneEnd={end}
          />

          {/* Wasserstoffbrücken */}
          <div className="flex h-2 items-center">
            {Array.from({ length: sequence.length }, (_, index) => {
              const base = sequence[index];
              const strong = base === "G" || base === "C";
              return (
                <span key={index} className="flex shrink-0 justify-center" style={{ width: CELL }}>
                  <span
                    className={`block rounded-full ${strong ? "bg-slate-400/70" : "bg-slate-500/40"}`}
                    style={{ width: strong ? 12 : 8, height: 2 }}
                  />
                </span>
              );
            })}
          </div>

          {/* Gegenstrang */}
          <StrandRow
            sequence={sequence}
            reference={referenceSequence}
            complementRow
            selected={selected}
            sets={sets}
            guideStrand={guideStrand}
            onSelect={onSelect}
            geneStart={start}
            geneEnd={end}
          />

          {/* Aminosäuren */}
          {coding && (
            <div className="mt-1 flex h-7">
              {Array.from({ length: sequence.length }, (_, index) => {
                if (index < start || index >= end) {
                  return <span key={index} className="shrink-0" style={{ width: CELL }} />;
                }
                const offsetInCds = index - start;
                if (offsetInCds % 3 !== 0) return null;
                const codonIndex = offsetInCds / 3;
                const letter = protein[codonIndex];
                if (!letter) return <span key={index} className="shrink-0" style={{ width: CELL * 3 }} />;
                const info = aminoInfo(letter);
                const residue = codonIndex + 1 + gene.proteinOffset;
                const isStop = letter === "*";
                return (
                  <span
                    key={index}
                    className={`flex shrink-0 flex-col items-center justify-center rounded-md border text-[10px] leading-none ${
                      isStop
                        ? "border-rose-500/60 bg-rose-500/20 text-rose-200"
                        : "border-slate-700/60 bg-slate-800/50 text-slate-300"
                    }`}
                    style={{ width: CELL * 3 - 2, marginRight: 2 }}
                    title={`${info.name} (${info.code3}) · ${info.property}`}
                  >
                    <span className="font-semibold">{isStop ? "STOPP" : info.code3}</span>
                    <span className="text-[9px] text-slate-500">{residue}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StrandRowProps {
  sequence: string;
  reference: string;
  complementRow: boolean;
  selected: number | null;
  guideStrand: 1 | -1 | null;
  geneStart: number;
  geneEnd: number;
  sets: {
    protospacer: Set<number>;
    window: Set<number>;
    pam: Set<number>;
    predicted: Set<number>;
    markers: Map<number, string>;
  };
  onSelect: (index: number) => void;
}

function StrandRow({
  sequence,
  reference,
  complementRow,
  selected,
  guideStrand,
  geneStart,
  geneEnd,
  sets,
  onSelect,
}: StrandRowProps) {
  const onThisStrand = complementRow ? guideStrand === -1 : guideStrand === 1;

  return (
    <div className="flex">
      {Array.from({ length: sequence.length }, (_, index) => {
        const senseBase = sequence[index] as Base;
        const shown = complementRow ? complement(senseBase) : senseBase;
        const isSelected = index === selected;
        const inProtospacer = sets.protospacer.has(index);
        const inWindow = sets.window.has(index);
        const isPam = sets.pam.has(index);
        const isPredicted = sets.predicted.has(index);
        const changed = reference[index] !== undefined && reference[index] !== senseBase;
        const coding = index >= geneStart && index < geneEnd;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`Basenpaar ${index + 1}: ${senseBase} gepaart mit ${complement(senseBase)}`}
            className="relative shrink-0 select-none"
            style={{ width: CELL, height: 30, touchAction: "manipulation" }}
          >
            <span
              className={[
                "absolute inset-x-[1px] inset-y-0 flex items-center justify-center rounded font-mono text-[13px] font-bold transition-colors",
                isPam ? "bg-pink-500/25" : inWindow && onThisStrand ? "bg-amber-400/25" : inProtospacer && onThisStrand ? "bg-orange-500/12" : coding ? "bg-slate-800/40" : "bg-slate-900/40",
                isSelected ? "ring-2 ring-white" : isPredicted ? "ring-2 ring-dashed ring-amber-300" : "",
              ].join(" ")}
              style={{ color: BASE_COLORS[shown] }}
            >
              {shown}
              {changed && !complementRow && (
                <span className="absolute -top-[1px] right-[2px] h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
              )}
            </span>
            {sets.markers.has(index) && !complementRow && (
              <span className="pointer-events-none absolute -top-[3px] left-1/2 -translate-x-1/2 text-[8px] text-fuchsia-300">
                ▼
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
