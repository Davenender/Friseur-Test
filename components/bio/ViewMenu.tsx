"use client";

/** Alle Einstellungen der 3D-Ansicht in einem ausklappbaren Menü. */

import { useEffect, useRef } from "react";
import type { HelixDetail } from "./HelixCanvas";

const DETAILS: { id: HelixDetail; label: string; hint: string }[] = [
  { id: "schema", label: "Schema", hint: "Stäbe und Kugeln – am übersichtlichsten" },
  { id: "molekuel", label: "Moleküle", hint: "Echte Ringformen, Zucker als Fünfeck" },
  { id: "atome", label: "Atome", hint: "Jedes Atom einzeln, wie in der Zelle" },
];

const SPANS = [13, 21, 31];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: HelixDetail;
  onDetailChange: (detail: HelixDetail) => void;
  span: number;
  onSpanChange: (span: number) => void;
  showLabels: boolean;
  onShowLabelsChange: (value: boolean) => void;
  showParts: boolean;
  onShowPartsChange: (value: boolean) => void;
  replicating: boolean;
  onReplicatingChange: () => void;
}

export function ViewMenu({
  open,
  onOpenChange,
  detail,
  onDetailChange,
  span,
  onSpanChange,
  showLabels,
  onShowLabelsChange,
  showParts,
  onShowPartsChange,
  replicating,
  onReplicatingChange,
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={panelRef} className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        style={{ touchAction: "manipulation" }}
        className={`min-h-11 rounded-xl border px-4 text-xs font-semibold backdrop-blur transition-colors ${
          open
            ? "border-slate-500 bg-slate-800 text-white"
            : "border-slate-700/70 bg-slate-950/80 text-slate-200"
        }`}
      >
        Ansicht
      </button>

      {open && (
        <div className="w-64 rounded-2xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Darstellung
          </p>
          <div className="space-y-1.5">
            {DETAILS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onDetailChange(entry.id)}
                style={{ touchAction: "manipulation" }}
                className={`w-full rounded-xl border p-2 text-left transition-colors ${
                  detail === entry.id
                    ? "border-cyan-400 bg-cyan-500/10"
                    : "border-slate-800 bg-slate-900/60"
                }`}
              >
                <span
                  className={`block text-xs font-semibold ${
                    detail === entry.id ? "text-cyan-200" : "text-slate-200"
                  }`}
                >
                  {entry.label}
                </span>
                <span className="block text-[10px] leading-tight text-slate-500">{entry.hint}</span>
              </button>
            ))}
          </div>

          <p className="mt-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Ausschnitt
          </p>
          <div className="flex overflow-hidden rounded-xl border border-slate-800">
            {SPANS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onSpanChange(option)}
                style={{ touchAction: "manipulation" }}
                className={`min-h-10 flex-1 text-[11px] font-semibold ${
                  span === option ? "bg-slate-700 text-white" : "bg-slate-900/60 text-slate-400"
                }`}
              >
                {option} bp
              </button>
            ))}
          </div>

          <p className="mt-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Hilfen
          </p>
          <div className="space-y-1.5">
            <MenuToggle
              label="Buchstaben A T G C"
              checked={showLabels}
              onChange={onShowLabelsChange}
            />
            <MenuToggle
              label="Was ist was?"
              hint="Beschriftet die Bauteile im Bild"
              checked={showParts}
              onChange={onShowPartsChange}
            />
            <button
              type="button"
              onClick={onReplicatingChange}
              style={{ touchAction: "manipulation" }}
              className={`min-h-10 w-full rounded-xl border px-3 text-left text-xs font-semibold transition-colors ${
                replicating
                  ? "border-cyan-400 bg-cyan-500/15 text-cyan-200"
                  : "border-slate-800 bg-slate-900/60 text-slate-200"
              }`}
            >
              {replicating ? "Zellteilung läuft" : "Zellteilung zeigen"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{ touchAction: "manipulation" }}
      className="flex min-h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 text-left"
    >
      <span>
        <span className="block text-xs font-semibold text-slate-200">{label}</span>
        {hint && <span className="block text-[10px] text-slate-500">{hint}</span>}
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-emerald-500" : "bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
