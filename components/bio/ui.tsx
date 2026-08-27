"use client";

/** Kleine, wiederverwendete Bausteine der Laboroberfläche. */

import type { ReactNode } from "react";
import { SEVERITY_STYLE, type Severity } from "@/lib/bio/phenotype";

export function Panel({ title, subtitle, children, action }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-slate-100">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SeverityBadge({ severity, children }: { severity: Severity; children?: ReactNode }) {
  const style = SEVERITY_STYLE[severity];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ backgroundColor: style.ring, color: style.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.color }} />
      {children ?? style.label}
    </span>
  );
}

export function HealthBar({ value, severity }: { value: number; severity: Severity }) {
  const style = SEVERITY_STYLE[severity];
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-widest text-slate-500">Gesundheitszustand</span>
        <span className="font-mono text-sm font-bold" style={{ color: style.color }}>
          {value}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${value}%`, backgroundColor: style.color }}
        />
      </div>
    </div>
  );
}

export function Chip({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "amber" | "cyan" | "rose" | "emerald" | "fuchsia" }) {
  const tones: Record<string, string> = {
    slate: "border-slate-700 bg-slate-800/60 text-slate-300",
    amber: "border-amber-500/40 bg-amber-500/15 text-amber-200",
    cyan: "border-cyan-500/40 bg-cyan-500/15 text-cyan-200",
    rose: "border-rose-500/40 bg-rose-500/15 text-rose-200",
    emerald: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
    fuchsia: "border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function ActionButton({
  children,
  onClick,
  disabled,
  tone = "primary",
  className = "",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "primary" | "ghost" | "danger";
  className?: string;
  title?: string;
}) {
  const tones = {
    primary:
      "bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500",
    ghost:
      "border border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60 disabled:text-slate-600",
    danger: "bg-rose-500 text-white hover:bg-rose-400 disabled:bg-slate-800 disabled:text-slate-500",
  };
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{ touchAction: "manipulation" }}
      className={`min-h-11 rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{ touchAction: "manipulation" }}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 text-left"
    >
      <span>
        <span className="block text-xs font-semibold text-slate-200">{label}</span>
        {hint && <span className="block text-[10px] text-slate-500">{hint}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-emerald-500" : "bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export function EfficiencyBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(2, Math.round(value * 100))}%`, backgroundColor: color }}
      />
    </div>
  );
}
