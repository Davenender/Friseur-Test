"use client";

/** Laborprotokoll – jede Aktion mit ihrem tatsächlichen Ergebnis. */

import type { LogEntry } from "@/lib/bio/lab";

const TONE: Record<LogEntry["kind"], string> = {
  edit: "border-l-cyan-400",
  info: "border-l-slate-600",
  warn: "border-l-amber-400",
  fail: "border-l-rose-500",
  success: "border-l-emerald-400",
};

export function LogPanel({ entries }: { entries: LogEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-[12px] text-slate-500">
        Noch keine Einträge. Jede Aktion im Labor wird hier festgehalten – mit dem, was tatsächlich
        passiert ist, nicht mit dem, was vorhergesagt war.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className={`rounded-r-xl border-l-4 border-y border-r border-slate-800 bg-slate-900/60 p-3 ${TONE[entry.kind]}`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12px] font-semibold text-slate-100">{entry.title}</p>
            <span className="shrink-0 font-mono text-[10px] text-slate-500">{entry.time}</span>
          </div>
          <p className="mt-1 whitespace-pre-line text-[11px] leading-relaxed text-slate-400">
            {entry.detail}
          </p>
        </li>
      ))}
    </ol>
  );
}
