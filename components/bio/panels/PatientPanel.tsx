"use client";

/** Fallakte: Wer ist betroffen, was ist die Aufgabe, wie weit bin ich? */

import { useState } from "react";
import type { LabCase } from "@/lib/bio/cases";
import type { GeneDef, GenotypeReport } from "@/lib/bio/phenotype";
import { ActionButton, Chip, HealthBar, Panel, SeverityBadge } from "../ui";

interface Props {
  labCase: LabCase;
  gene: GeneDef;
  report: GenotypeReport;
  goalReached: boolean;
  hasGoal: boolean;
  onOpenCases: () => void;
}

export function PatientPanel({ labCase, gene, report, goalReached, hasGoal, onOpenCases }: Props) {
  const [hintLevel, setHintLevel] = useState(0);

  return (
    <div className="space-y-4">
      <Panel
        title="Fallakte"
        subtitle={labCase.subtitle}
        action={
          <ActionButton tone="ghost" onClick={onOpenCases} className="!min-h-9 !px-3 !text-xs">
            Fall wechseln
          </ActionButton>
        }
      >
        <div className="flex gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-3xl">
            {labCase.patient.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100">{labCase.patient.name}</p>
            <p className="text-[11px] text-slate-500">{labCase.patient.age}</p>
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-slate-300">{labCase.patient.story}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {labCase.tags.map((tag) => (
            <Chip key={tag} tone={tag === "Heilen" ? "emerald" : tag === "Krank machen" ? "rose" : "slate"}>
              {tag}
            </Chip>
          ))}
        </div>
      </Panel>

      <Panel title="Aktueller Befund" subtitle={`${gene.symbol} · ${gene.locus}`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-100">{report.title}</span>
          <SeverityBadge severity={report.severity} />
        </div>
        <HealthBar value={report.health} severity={report.severity} />
        <p className="mt-3 text-[12px] leading-relaxed text-slate-300">{report.summary}</p>
        {report.symptoms.length > 0 && (
          <ul className="mt-3 space-y-1">
            {report.symptoms.map((symptom) => (
              <li key={symptom} className="flex gap-2 text-[11px] text-slate-400">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
                {symptom}
              </li>
            ))}
          </ul>
        )}
        {report.mechanism && (
          <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-[11px] leading-relaxed text-slate-400">
            {report.mechanism}
          </p>
        )}
      </Panel>

      {hasGoal && (
        <Panel title="Auftrag" subtitle={goalReached ? "Erledigt" : "Offen"}>
          <p className="text-[12px] leading-relaxed text-slate-300">{labCase.mission}</p>
          <div
            className={`mt-3 rounded-xl border p-3 ${
              goalReached
                ? "border-emerald-500/50 bg-emerald-500/10"
                : "border-slate-800 bg-slate-950/60"
            }`}
          >
            <p className="flex items-start gap-2 text-[12px] font-medium">
              <span className={goalReached ? "text-emerald-400" : "text-slate-500"}>
                {goalReached ? "✓" : "○"}
              </span>
              <span className={goalReached ? "text-emerald-200" : "text-slate-300"}>
                {labCase.goal.text}
              </span>
            </p>
          </div>

          {!goalReached && labCase.hints.length > 0 && (
            <div className="mt-3">
              {labCase.hints.slice(0, hintLevel).map((hint, index) => (
                <p
                  key={hint}
                  className="mb-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2.5 text-[11px] leading-relaxed text-cyan-100"
                >
                  <span className="font-semibold">Tipp {index + 1}: </span>
                  {hint}
                </p>
              ))}
              {hintLevel < labCase.hints.length && (
                <ActionButton
                  tone="ghost"
                  onClick={() => setHintLevel((level) => level + 1)}
                  className="w-full !text-xs"
                >
                  {hintLevel === 0 ? "Tipp anzeigen" : "Noch einen Tipp"}
                </ActionButton>
              )}
            </div>
          )}
        </Panel>
      )}

      {labCase.ethics && (
        <Panel title="Zum Nachdenken">
          <p className="text-[12px] leading-relaxed text-slate-300">{labCase.ethics}</p>
        </Panel>
      )}

      <Panel title="Woher kommt diese Sequenz?">
        <p className="text-[11px] leading-relaxed text-slate-400">{gene.sequenceNote}</p>
      </Panel>
    </div>
  );
}
