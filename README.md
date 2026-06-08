# Haarstudio Graziella – Landingpage

Moderne Single-Page-Website für Haarstudio Graziella (Mühlheim am Main) mit
**Online-Terminbuchung** und **Gutschein-Verkauf via Stripe**.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · Resend · Stripe · react-day-picker.

## Features

- 🎨 Helles, modernes Design (Cream/Karamell/Rosé)
- 📅 Buchungs-Wizard mit Datum + Zeit-Picker, Live-Verfügbarkeit
- 📧 Doppel-Mail bei Buchung: Bestätigung an Kund:in + Benachrichtigung an Salon (mit **.ics**-Anhang für Kalender-Import)
- 💳 Gutschein-Shop mit Stripe Checkout, Voucher-Mail mit Code, Erfolgsseite
- 🛡 Webhook-Verifikation (mit Fallback auf Success-Page für lokales Testen)
- 🗺 Google-Maps-Einbettung, Sticky Header, Galerie

## Setup

```bash
npm install
cp .env.example .env.local   # Werte eintragen
npm run dev
```

Öffnen: <http://localhost:3000>

## Environment Variables

| Variable | Beschreibung |
| --- | --- |
| `RESEND_API_KEY` | API-Key aus [Resend](https://resend.com) |
| `MAIL_FROM` | z. B. `"Haarstudio Graziella <noreply@deine-domain.de>"` – Domain muss bei Resend verifiziert sein (oder `onboarding@resend.dev` für Tests) |
| `MAIL_TO` | Empfänger für Benachrichtigungen (`Davidhes4a@gmail.com`) |
| `STRIPE_SECRET_KEY` | Stripe Secret (sk_test_…/sk_live_…) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key |
| `STRIPE_WEBHOOK_SECRET` | Optional in Dev. **Pflicht in Production.** |
| `NEXT_PUBLIC_SITE_URL` | Basis-URL für Stripe-Redirects |
| `GOOGLE_CALENDAR_ID` / `GOOGLE_SERVICE_ACCOUNT_JSON` | Optional – siehe unten |

## Stripe Webhook (Production)

In Dev funktioniert der Gutschein-Versand auch ohne Webhook, weil die
Erfolgsseite (`/gutschein/erfolg`) den Versand als Fallback triggert.

Für Production unbedingt einen Webhook anlegen:

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://deine-domain.de/api/stripe/webhook`
3. Event: `checkout.session.completed`
4. Signing Secret kopieren → `STRIPE_WEBHOOK_SECRET` in den Vercel-Settings hinterlegen.

Lokal testen mit der Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# zeigt einen whsec_… an → in .env.local eintragen → npm run dev neu starten
```

## Google Calendar (optional)

Die App funktioniert ohne Google-Integration: Slots werden aus den
Öffnungszeiten generiert, jede Buchung verschickt ein .ics an
`MAIL_TO` → 1 Klick = im Kalender.

Für echte 2-Wege-Sync (Slot-Belegung lesen + Termine schreiben):

1. [Google Cloud Console](https://console.cloud.google.com) → Projekt anlegen
2. **Google Calendar API** aktivieren
3. **Service Account** anlegen → JSON-Key herunterladen
4. Salon-Kalender öffnen → Einstellungen → den Service-Account als
   "Termine ändern" hinzufügen
5. `.env.local`:
   ```
   GOOGLE_CALENDAR_ID=primary
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```
6. `npm install googleapis` und [lib/calendar.ts](lib/calendar.ts) ausfüllen
   (Stub mit TODOs ist da). Nichts anderes muss angefasst werden.

## Deploy auf Vercel

1. Repo zu GitHub pushen
2. <https://vercel.com/new> → Repo importieren
3. Alle ENV-Variablen oben in den Project Settings hinterlegen
4. Deploy

## Projekt-Struktur

```
app/
  page.tsx                       Landingpage (Hero, About, Services, Galerie, Stimmen, Buchung, Gutschein, Kontakt)
  layout.tsx                     Root layout, Fonts
  gutschein/erfolg/page.tsx      Stripe Success Page
  api/
    availability/route.ts        GET freie Slots für Datum
    booking/route.ts             POST Terminbuchung → 2 Mails + .ics
    checkout/route.ts            POST → Stripe Checkout Session
    stripe/webhook/route.ts      Stripe webhook receiver
components/
  BookingForm.tsx                4-Step-Wizard mit DayPicker + Slots
  GiftCardForm.tsx               Betragspicker + Live-Vorschau
lib/
  booking.ts                     Öffnungszeiten, Slot-Generator, Service-Katalog
  schema.ts                      Zod-Schemas (booking, giftCard, contact)
  mail.ts                        Resend wrapper + HTML shell
  ics.ts                         iCalendar Generator
  voucher.ts                     Code-Generator + €-Formatter
  stripe.ts                      Stripe client singleton
  giftcard-mail.ts               Gutschein-Mail-Versand (idempotent)
  calendar.ts                    Google Calendar Stub
```
