"use client";

/** Auswahl der Fälle – als Vollbild-Overlay, damit es auf dem iPad gut trifft. */

import { CASES, type LabCase } from "@/lib/bio/cases";
import { Chip } from "../ui";

interface Props {
  activeId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const TAG_TONE: Record<string, "emerald" | "rose" | "cyan" | "amber" | "slate"> = {
  Heilen: "emerald",
  "Krank machen": "rose",
  Verbessern: "cyan",
  "Grenzen der Methode": "amber",
};

export function CasePicker({ activeId, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur">
      <header className="flex min-h-16 items-center justify-between border-b border-slate-800 px-5">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Fälle</h2>
          <p className="text-[11px] text-slate-500">Neun Szenarien – vom Heilen bis zum Verbessern.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ touchAction: "manipulation" }}
          className="min-h-11 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-200"
        >
          Schließen
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CASES.map((labCase: LabCase) => {
            const active = labCase.id === activeId;
            return (
              <button
                key={labCase.id}
                type="button"
                onClick={() => {
                  onSelect(labCase.id);
                  onClose();
                }}
                style={{ touchAction: "manipulation" }}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  active
                    ? "border-emerald-400 bg-emerald-500/10"
                    : "border-slate-800 bg-slate-900/60 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{labCase.patient.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-100">{labCase.title}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-500">{labCase.subtitle}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 text-[11px] leading-relaxed text-slate-400">
                  {labCase.patient.story}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {labCase.tags.map((tag) => (
                    <Chip key={tag} tone={TAG_TONE[tag] ?? "slate"}>
                      {tag}
                    </Chip>
                  ))}
                  <span className="ml-auto text-[10px] text-slate-500">
                    {"●".repeat(labCase.difficulty)}
                    <span className="text-slate-700">{"●".repeat(3 - labCase.difficulty)}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
