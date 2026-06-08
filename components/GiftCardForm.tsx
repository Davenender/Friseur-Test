"use client";

import { useState } from "react";

const PRESETS = [25, 50, 75, 100];

export function GiftCardForm() {
  const [amount, setAmount] = useState<number>(50);
  const [custom, setCustom] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setPreset(v: number) {
    setAmount(v);
    setCustom("");
  }

  function setCustomAmount(v: string) {
    setCustom(v);
    const n = parseInt(v, 10);
    if (!isNaN(n)) setAmount(n);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          buyerName,
          buyerEmail,
          recipientName,
          personalMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Checkout fehlgeschlagen");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-cream-dark sm:p-8 lg:grid-cols-[1fr,1.1fr] lg:p-10"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink via-ink to-accent-dark p-8 text-cream">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-rose/20" />
        <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-accent/10" />
        <div className="relative">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-rose">
            Gutschein
          </div>
          <div className="mt-2 font-display text-2xl">Haarstudio Graziella</div>
          <div className="mt-12 font-display text-6xl tracking-tight">
            {amount}
            <span className="ml-1 text-3xl text-rose/80">€</span>
          </div>
          {recipientName && (
            <div className="mt-4 text-sm text-cream/80">
              Für <strong>{recipientName}</strong>
            </div>
          )}
          {personalMessage && (
            <div className="mt-3 max-w-xs text-sm italic text-cream/70">
              &bdquo;{personalMessage.slice(0, 80)}
              {personalMessage.length > 80 && "…"}&ldquo;
            </div>
          )}
          <div className="mt-10 text-[11px] uppercase tracking-widest text-cream/60">
            Einlösbar im Salon · Friedrich-Ebert-Str. 8 · Mühlheim
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl text-ink">Betrag wählen</h3>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {PRESETS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setPreset(v)}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                amount === v && !custom
                  ? "border-accent bg-ink text-cream"
                  : "border-cream-dark bg-cream/40 text-ink hover:border-accent/60"
              }`}
            >
              {v} €
            </button>
          ))}
        </div>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm font-medium text-ink-soft">
            Oder freier Betrag (10 – 500 €)
          </span>
          <input
            type="number"
            min={10}
            max={500}
            value={custom}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="z. B. 80"
            className="w-full rounded-lg border border-cream-dark bg-cream px-4 py-3 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </label>

        <h3 className="mt-7 font-display text-xl text-ink">Ihre Daten</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input
            label="Ihr Name"
            value={buyerName}
            onChange={setBuyerName}
            required
          />
          <Input
            label="Ihre E-Mail"
            value={buyerEmail}
            onChange={setBuyerEmail}
            required
            type="email"
          />
          <Input
            label="Für (optional)"
            value={recipientName}
            onChange={setRecipientName}
          />
          <div className="hidden sm:block" />
        </div>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm font-medium text-ink-soft">
            Persönliche Nachricht (optional)
          </span>
          <textarea
            rows={2}
            value={personalMessage}
            onChange={(e) => setPersonalMessage(e.target.value)}
            className="w-full rounded-lg border border-cream-dark bg-cream px-4 py-3 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </label>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || amount < 10}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-ink px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-cream transition hover:bg-accent-dark disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Weiterleitung…" : `Jetzt ${amount} € bezahlen`}
        </button>
        <p className="mt-3 text-xs text-ink-soft">
          Sichere Bezahlung über Stripe. Sie erhalten den Gutschein direkt per
          E-Mail.
        </p>
      </div>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
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
        className="w-full rounded-lg border border-cream-dark bg-cream px-4 py-3 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
    </label>
  );
}
