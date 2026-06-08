"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { DayPicker } from "react-day-picker";
import { de } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { EMPLOYEES, SERVICES, type EmployeeId, type ServiceId } from "@/lib/booking";

type Status = "idle" | "loading-slots" | "submitting" | "success" | "error";

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BookingForm({
  initialEmployee,
}: { initialEmployee?: EmployeeId } = {}) {
  const [service, setService] = useState<ServiceId>(SERVICES[0].id);
  const [employee, setEmployee] = useState<EmployeeId>(initialEmployee || "any");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsClosed, setSlotsClosed] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");

  const dateISO = useMemo(() => (date ? toISODate(date) : ""), [date]);

  useEffect(() => {
    let cancelled = false;
    if (!dateISO) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setSlots([]);
        setSlotsClosed(false);
      });
      return () => {
        cancelled = true;
      };
    }
    Promise.resolve().then(() => {
      if (cancelled) return;
      setStatus("loading-slots");
      setTime("");
    });
    fetch(`/api/availability?date=${dateISO}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setSlots(d.slots || []);
        setSlotsClosed(Boolean(d.closed));
        setStatus("idle");
      })
      .catch(() => {
        if (cancelled) return;
        setSlots([]);
        setStatus("idle");
      });
    return () => {
      cancelled = true;
    };
  }, [dateISO]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 60);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    if (!date || !time) {
      setErrorMessage("Bitte Datum und Uhrzeit auswählen.");
      return;
    }
    if (!consent) {
      setErrorMessage("Bitte der Datenschutzerklärung zustimmen.");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service,
          employee,
          date: dateISO,
          time,
          firstName,
          lastName,
          phone,
          email,
          notes,
          consent,
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Buchung fehlgeschlagen (HTTP ${res.status})`);
      }
      if (data.checkoutUrl) {
        // Paid booking → redirect to Stripe
        window.location.href = data.checkoutUrl;
        return;
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Unbekannter Fehler");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-cream-dark">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-7 w-7 text-accent-dark"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-2xl text-ink">Termin gebucht!</h3>
        <p className="mt-3 text-ink-soft">
          Eine Bestätigung wurde an <strong>{email}</strong> gesendet. Sollte
          etwas dazwischenkommen, melden wir uns telefonisch bei Ihnen.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setDate(undefined);
            setTime("");
            setFirstName("");
            setLastName("");
            setPhone("");
            setEmail("");
            setNotes("");
            setConsent(false);
          }}
          className="mt-8 text-sm font-medium text-accent-dark underline-offset-4 hover:underline"
        >
          Weiteren Termin buchen
        </button>
      </div>
    );
  }

  const selectedService = SERVICES.find((s) => s.id === service)!;

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-cream-dark sm:p-8 lg:grid-cols-[1.1fr,1fr] lg:p-10"
    >
      <div>
        <Step number={1} title="Leistung wählen" />
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setService(s.id)}
              className={`group flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition ${
                service === s.id
                  ? "border-accent bg-rose/40 text-ink"
                  : "border-cream-dark bg-cream/50 text-ink-soft hover:border-accent/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{s.label}</span>
                <span className="text-xs uppercase tracking-wider opacity-70">
                  {s.minutes} min
                </span>
              </div>
              <div className="text-xs opacity-70">
                {s.priceLabel}
                {s.depositCents > 0 &&
                  ` · Anzahlung ${(s.depositCents / 100).toFixed(0)} €`}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8">
          <Step number={2} title="Mitarbeiter:in wählen" />
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setEmployee("any")}
              className={`rounded-xl border px-3 py-3 text-center text-sm transition ${
                employee === "any"
                  ? "border-accent bg-rose/40 text-ink"
                  : "border-cream-dark bg-cream/50 text-ink-soft hover:border-accent/60"
              }`}
            >
              <div className="font-medium">Egal welche:r</div>
              <div className="text-xs opacity-70">Nächster freier Slot</div>
            </button>
            {EMPLOYEES.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEmployee(e.id)}
                className={`flex items-center gap-3 rounded-xl border p-2 text-left transition ${
                  employee === e.id
                    ? "border-accent bg-rose/40 text-ink"
                    : "border-cream-dark bg-cream/50 text-ink-soft hover:border-accent/60"
                }`}
              >
                <Image
                  src={e.photo}
                  alt={e.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <div className="truncate font-medium">{e.name}</div>
                  <div className="truncate text-xs opacity-70">{e.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <Step number={3} title="Datum wählen" />
          <div className="mt-4 overflow-hidden rounded-2xl border border-cream-dark bg-cream/40 p-2">
            <DayPicker
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={de}
              disabled={[
                { dayOfWeek: [0] },
                { before: today },
                { after: maxDate },
              ]}
              weekStartsOn={1}
              showOutsideDays
              className="rdp-custom"
              styles={{
                day: { borderRadius: "10px" },
              }}
              modifiersClassNames={{
                selected: "rdp-selected",
                today: "rdp-today",
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <Step number={4} title="Uhrzeit wählen" />
        <div className="mt-4 min-h-[100px]">
          {!date && (
            <p className="text-sm text-ink-soft">
              Bitte zuerst ein Datum auswählen.
            </p>
          )}
          {date && status === "loading-slots" && (
            <p className="text-sm text-ink-soft">Verfügbarkeit wird geprüft…</p>
          )}
          {date && status !== "loading-slots" && slotsClosed && (
            <p className="text-sm text-ink-soft">
              An diesem Tag ist der Salon geschlossen.
            </p>
          )}
          {date && status !== "loading-slots" && !slotsClosed && slots.length === 0 && (
            <p className="text-sm text-ink-soft">
              An diesem Tag sind keine Slots mehr verfügbar.
            </p>
          )}
          {slots.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTime(s)}
                  className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                    time === s
                      ? "border-accent bg-ink text-cream"
                      : "border-cream-dark bg-cream/40 text-ink-soft hover:border-accent/60 hover:text-ink"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <Step number={5} title="Ihre Daten" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              label="Vorname"
              value={firstName}
              onChange={setFirstName}
              required
              autoComplete="given-name"
            />
            <Input
              label="Nachname"
              value={lastName}
              onChange={setLastName}
              required
              autoComplete="family-name"
            />
            <Input
              label="Telefon"
              value={phone}
              onChange={setPhone}
              required
              autoComplete="tel"
              type="tel"
            />
            <Input
              label="E-Mail"
              value={email}
              onChange={setEmail}
              required
              autoComplete="email"
              type="email"
            />
          </div>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-sm font-medium text-ink-soft">
              Notiz (optional)
            </span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sonderwünsche, Haarlänge, gewünschte Mitarbeiterin…"
              className="w-full rounded-lg border border-cream-dark bg-cream px-4 py-3 text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>

          <div className="hidden" aria-hidden="true">
            <label>
              Website
              <input
                type="text"
                tabIndex={-1}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>

          <label className="mt-4 flex items-start gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-cream-dark text-accent focus:ring-accent"
            />
            <span>
              Ich stimme der Verarbeitung meiner Daten gemäß Datenschutz­erklärung
              zu.
            </span>
          </label>
        </div>

        {errorMessage && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        {selectedService.depositCents > 0 && (
          <p className="mt-4 rounded-lg bg-rose/40 px-4 py-3 text-xs text-ink-soft">
            💡 Sie haben einen <strong>Gutscheincode</strong>? Lösen Sie ihn
            direkt im nächsten Schritt auf der Stripe-Seite unter
            &bdquo;Gutscheincode hinzufügen&ldquo; ein.
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-cream-dark pt-5">
          <div className="text-sm text-ink-soft">
            {date && time ? (
              <>
                <span className="font-medium text-ink">
                  {selectedService.label}
                </span>{" "}
                am{" "}
                <span className="font-medium text-ink">
                  {date.toLocaleDateString("de-DE", {
                    weekday: "short",
                    day: "2-digit",
                    month: "long",
                  })}
                </span>{" "}
                um <span className="font-medium text-ink">{time}</span>
              </>
            ) : (
              <span>Wählen Sie Datum & Uhrzeit, um zu buchen.</span>
            )}
          </div>
          <button
            type="submit"
            disabled={status === "submitting" || !date || !time}
            className="inline-flex items-center justify-center rounded-full bg-ink px-7 py-3 text-sm font-semibold uppercase tracking-wider text-cream transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "submitting"
              ? "Wird gebucht…"
              : selectedService.depositCents > 0
                ? `Weiter zur Zahlung (${(selectedService.depositCents / 100).toFixed(0)} €)`
                : "Termin buchen"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Step({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-cream">
        {number}
      </span>
      <h3 className="font-display text-xl text-ink">{title}</h3>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">
        {label}
        {required && <span className="text-accent-dark"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-cream-dark bg-cream px-4 py-3 text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
    </label>
  );
}
