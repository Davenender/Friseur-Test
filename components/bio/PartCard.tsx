"use client";

/**
 * Erklärt, was gerade im 3D-Bild angetippt wurde – Bauteil, Base und, im
 * Atommodell, sogar das einzelne Atom.
 */

import { type Base, complement } from "@/lib/bio/genetics";
import { BASE_COLORS } from "@/lib/bio/colors";
import { BASE_INFO, PAIRING_RULE, PART_INFO } from "@/lib/bio/explain";
import { ELEMENT_COLORS, ELEMENT_NAMES, type Element } from "@/lib/bio/molecule";
import type { PartHit } from "./HelixCanvas";

interface Props {
  hit: PartHit;
  sequence: string;
  onClose: () => void;
}

export function PartCard({ hit, sequence, onClose }: Props) {
  const info = PART_INFO[hit.part];
  const senseBase = sequence[hit.index] as Base | undefined;
  if (!senseBase) return null;
  const base = hit.strand === 1 ? senseBase : complement(senseBase);
  const baseInfo = BASE_INFO[base];
  const element = hit.element as Element | null;

  return (
    <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-950/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: info.color }}>
            {info.short}
          </p>
          <h3 className="text-sm font-bold text-slate-100">
            {hit.part === "base" ? `${baseInfo.name} (${base})` : info.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Erklärung schließen"
          style={{ touchAction: "manipulation" }}
          className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-200"
        >
          ✕
        </button>
      </div>

      {hit.part === "base" ? (
        <>
          <div className="mt-3">
            <BaseProfile base={base} />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-300">{baseInfo.note}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{info.job}</p>
        </>
      ) : (
        <>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-300">{info.what}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{info.job}</p>
        </>
      )}

      <p
        className="mt-3 rounded-lg border-l-2 p-2.5 text-[11px] leading-relaxed text-slate-300"
        style={{ borderColor: info.color, backgroundColor: `${info.color}12` }}
      >
        <span className="font-semibold">Fürs Editieren wichtig: </span>
        {info.relevance}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3 text-[10px] text-slate-500">
        <span>
          Basenpaar {hit.index + 1} · {hit.strand === 1 ? "Sinnstrang" : "Gegenstrang"}
        </span>
        {element && (
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: ELEMENT_COLORS[element] }}
            />
            {hit.atomLabel} · {ELEMENT_NAMES[element]}
          </span>
        )}
      </div>
    </div>
  );
}


/** Steckbrief einer Base – auch außerhalb der 3D-Ansicht verwendet. */
export function BaseProfile({ base }: { base: Base }) {
  const info = BASE_INFO[base];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono text-xl font-black"
        style={{ backgroundColor: `${BASE_COLORS[base]}22`, color: BASE_COLORS[base] }}
      >
        {base}
      </span>
      <dl className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        <div className="col-span-2">
          <dt className="text-slate-500">Name</dt>
          <dd className="font-semibold text-slate-100">{info.name}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Klasse</dt>
          <dd className="text-slate-200">
            {info.klasse} · {info.rings} Ring{info.rings === 2 ? "e" : ""}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Paart mit</dt>
          <dd style={{ color: BASE_COLORS[info.partner] }}>
            {info.partner} ({BASE_INFO[info.partner].name})
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate-500">Wasserstoffbrücken</dt>
          <dd className="text-slate-200">
            {info.bonds}
            {info.bonds === 3 ? " – hält fester als A=T" : " – lässt sich leichter öffnen"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** Kleine Karte, die von der Farblegende aus geöffnet wird. */
export function BaseInfoPopover({ base, onClose }: { base: Base; onClose: () => void }) {
  const info = BASE_INFO[base];
  return (
    <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-950/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-100">
          {info.name} – der Buchstabe {base}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          style={{ touchAction: "manipulation" }}
          className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-200"
        >
          ✕
        </button>
      </div>
      <div className="mt-3">
        <BaseProfile base={base} />
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-300">{info.note}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{PAIRING_RULE}</p>
    </div>
  );
}
