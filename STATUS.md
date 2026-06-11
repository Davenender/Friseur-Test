# Projekt-Übergabe & Gesamtkontext — David

> Diese Datei fasst ALLES zusammen: das Geschäftsmodell (CLS-Kurs), den Tech-Stack,
> was bisher gebaut wurde, den Vapi-Voice-Agent, und die nächsten Schritte.
> Gedacht zum Weitergeben an einen frischen Claude-Chat (Browser oder Code).

---

## 1. WER & ZIEL

- David, blutiger Anfänger, hat „gestern" (Anfang Juni 2026) mit dem Ganzen angefangen.
- Lernt anhand des Kurses **„CLS — Von 0€ zu wiederkehrenden Umsätzen mit Claude"**.
- Ziel: Eine **1-Personen-KI-Agentur** aufbauen, die lokalen Geschäften (KMU)
  KI-Lösungen baut und verkauft — einmaliger Setup-Preis + monatlicher Retainer.
- Markenname (selbst gewählt, passt zur Domain): **Agents Gilt** (Domain: agents-gilt.agency)
- Arbeitsstil: will Terminal-Befehle (npm install, npm run dev) am liebsten selbst tippen;
  Claude darf Dateien/Code direkt schreiben + `.env.local` bearbeiten.

---

## 2. DAS GESCHÄFTSMODELL (aus CLS-Kurs)

**In einem Satz:** Mit Claude in Stunden bauen, wofür Agenturen Wochen brauchen
(Websites, Chatbots, AI-Agenten, Automatisierungen, interne Tools, SaaS), und an
lokale Unternehmen/KMU verkaufen — einmalig für den Bau + monatliche Betreuung.

### Die 4 Einkommensstufen
| Stufe | Was | Preis | Aufwand |
|---|---|---|---|
| 1 Quick Wins | Landingpage, einfacher Chatbot, kleine Automation | 300–1.500 € einmalig | Stunden–Tage |
| 2 Produktisierte Services | CRM-Setup, Voice-Agent, Terminbuchung | 1.500–5.000 € + Retainer | Tage |
| 3 Custom Systeme | Kundenportal, RAG-Agent, internes Tool | 5.000–20.000 € + Retainer | 1–4 Wochen |
| 4 SaaS / Consulting | Eigenes Produkt, AI-Strategie | wiederkehrend / Tagessatz | laufend |

### Kursstruktur (13 Module)
- Modul 1–4: Fundament (Was ist Claude, Tech-Stack, Setup, Claude wie ein Senior Engineer steuern)
- Modul 5–7: Werkzeugkiste (200+ Prompts, Bauanleitungen für AI-Produkte, 50+ verkaufsfertige Angebote)
- Modul 8–10: Verkaufen (Kunden finden, ansprechen, closen)
- Modul 11–12: Betrieb (was man vom Kunden braucht, SOPs/Standardabläufe)
- Modul 13: 90-Tage-Plan bis zum ersten Kunden

### Wichtigste Kurs-Prinzipien (Modul 4 — Claude steuern)
- **Erst Plan, dann Code.** Immer Claude zuerst den Plan schreiben lassen, prüfen, dann bauen.
- Prompt-Struktur: ROLLE / ZIEL / KONTEXT / CONSTRAINTS / OUTPUT / QUALITÄT.
- Große Aufgaben in kleine Schritte zerlegen, nach jedem Schritt testen.
- Immer Kontext liefern (Ziel + Constraints + Zustand).
- Keys in `.env`, niemals committen.
- „Frag nach, bevor du rätst" in jeden großen Prompt.
- CLAUDE.md pro Projekt anlegen (Stack, Konventionen, Befehle).

### 90-Tage-Fahrplan (wo David steht)
- Woche 1: Setup & Grundlagen (GitHub, Git, VS Code, Claude Code, Supabase, Vercel) — ✅ erledigt
- Woche 2: Erste Demo-Landingpage bauen & deployen — ✅ (Friseur-Test war die Übung)
- Woche 3: RAG-Chatbot als Flaggschiff — ✅ (Chatbot Lia gebaut, allerdings ohne Vektor-DB, simpler System-Prompt-Ansatz)
- Woche 4: Nische & Angebot definieren — OFFEN (wichtigster nächster Schritt)
- Woche 5–8: Leads recherchieren, Outreach, erster Kunde — OFFEN
- Woche 9–12: Liefern, Referenz, Retainer, skalieren — OFFEN

---

## 3. DER KOMPLETTE TECH-STACK (CLS Modul 2)

### Tools die David WIRKLICH braucht (Kern)
- **Claude Code** (Terminal) — Haupt-Bauwerkzeug
- **GitHub** — Code speichern (Repo: Davenender/Friseur-Test)
- **Vercel** — Hosting + Deployment (1 Klick von GitHub)
- **Stripe** — Zahlungen (aktuell Test-Mode)
- **Resend** — transaktionale E-Mails (Domain agents-gilt.agency verifiziert ✅)
- **Anthropic API** — Claude in eigene Produkte einbauen (Chatbot läuft darüber)
- **Supabase** — DB + Auth + Vektor-DB (pgvector) für spätere Projekte (Konto da, noch nicht angebunden)
- **Vapi** — Voice-Agents (Telefon-KI)

### Tools die später/projektspezifisch kommen
- Cal.com (Terminbuchungs-Komponente), Make/n8n/Zapier (Automatisierungen),
  Twilio (Telefonie für Voice), Apify (Lead-Scraping aus öffentlichen Quellen),
  Pinecone/Weaviate (Vektor-DB-Alternativen — aber Supabase pgvector reicht meist),
  Cloudflare (DNS), ElevenLabs/Deepgram (Voice-Bausteine).

### Tools die NICHT gebraucht werden (Doppelungen)
- Netlify (Vercel reicht), Namecheap (Domain läuft über Vercel/Namecheap eh schon),
  Firebase (Supabase reicht), LangChain (direktes SDK besser), Airtable (Supabase reicht),
  OpenAI (Anthropic reicht), Railway/Docker (erst bei 24/7-Workern), PostHog (erst bei echten Nutzern).

### Wichtigste Grundbegriffe (Modul 1)
- **AI-Agent**: kann handeln (Tools nutzen: Kalender, DB, Mail), nicht nur antworten.
- **MCP** (Model Context Protocol): „USB für KI" — Claude an externe Systeme anstöpseln.
- **API**: Schnittstelle, über die zwei Programme reden. Braucht meist einen API-Key.
- **Webhook**: ein Dienst ruft DICH an wenn etwas passiert (Rückgrat von Automatisierungen).
- **RAG** (Retrieval Augmented Generation): KI antwortet anhand DEINER Dokumente (Chunks → Embeddings → Vektor-DB → relevante Stücke an Claude). Herzstück der meisten Agenten.

---

## 4. WAS BISHER GEBAUT WURDE

### Projekt: Friseur-Website „Haarstudio Graziella"
Pfad: `/Users/david/Desktop/Friseur-Test`
Echtes Vorbild: haarstudio-graziella.de (Friseursalon in Mühlheim am Main / Lämmerspiel).
David war im echten Salon — die Inhaberinnen heißen **Graziella** (Inhaberin) und
**Aurelia** (Stylistin/Coloration). Echte Team-Fotos sind eingebaut (`public/team/`).

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript · Resend · Stripe · Anthropic.

**Salon-Daten:**
- Adresse: Friedrich-Ebert-Str. 8, 63165 Mühlheim am Main (Lämmerspiel)
- Telefon: 06108 / 79 98 65 · Mail: kontakt@haarstudio-graziella.de
- Öffnungszeiten: Mo–Fr 09:00–18:30, Sa 08:30–14:00, So zu
- Leistungen (ungefähre Preise): Schnitt ab 35€/45min, Coloration ab 65€/90min,
  Strähnen ab 85€/2h, Keratinglättung ab 180€/3h (hält 5 Monate), Beratung kostenlos 30min

**Was die Website kann:**
- Single-Page-Landingpage (Hero, About, Team, Leistungen, Galerie, Rezensionen, Buchung, Gutschein, Kontakt mit Google-Maps)
- **Online-Terminbuchung**: Leistung → Mitarbeiterin (Graziella/Aurelia/egal) → Datum → Slot → Daten.
  Kostenlose Beratung = direkt gebucht; bezahlte Services = Stripe-Anzahlung (10–50€, wird angerechnet).
- **Stripe-Gutscheine**: 25/50/75/100€ oder frei. Werden via Stripe Coupon+Promotion-Code angelegt,
  beim Buchen einlösbar. **Restguthaben-Logik**: bei Teil-Einlösung wird Code automatisch
  durch neuen Code mit Restbetrag ersetzt (Rollover). War ein wichtiger Bugfix.
- **Mails via Resend**: Bestätigung an Kund:in + Benachrichtigung an Salon, mit .ics-Kalenderanhang.
- **Chatbot „Lia"** (siehe unten).

**Wichtige Dateien:**
- `app/page.tsx` — Landingpage
- `app/api/booking/route.ts` — Buchung (frei → direkt, bezahlt → Stripe)
- `app/api/checkout/route.ts` — Gutschein-Kauf
- `app/api/stripe/webhook/route.ts` — Stripe Webhook
- `app/api/chat/route.ts` + `app/api/chat-lead/route.ts` — Chatbot Backend
- `components/BookingForm.tsx`, `components/GiftCardForm.tsx`, `components/ChatWidget.tsx`
- `lib/booking.ts` (Services, Mitarbeiter, Slots), `lib/chatbot-knowledge.ts`,
  `lib/giftcard-mail.ts`, `lib/giftcard-refund.ts`, `lib/mail.ts`, `lib/calendar.ts` (Google Cal, DEAKTIVIERT)

**Status:** läuft lokal (`npm run dev` → localhost:3000), Build+Lint grün, auf GitHub gepusht.
NOCH NICHT live auf Vercel deployed.

### Chatbot „Lia" (auf der Website)
- Floating-Widget unten rechts, Persona „Lia", warm/freundlich, duzt.
- Beantwortet Fragen zu Salon (aus `lib/chatbot-knowledge.ts`), lotst zur Buchung,
  sammelt E-Mail-Lead wenn sie was nicht weiß ([LEAD_REQUEST]-Marker → Lead-Form → Mail an David).
- Läuft über Anthropic-API (Streaming). Preise nur als „ab ca."-Range. Bleibt strikt beim Salon-Thema.
- Funktioniert getestet (Preis-Frage, Öffnungszeiten, Off-Topic-Rücklenkung, Lead-Capture).

### Google Calendar
- Integration ist vorbereitet (`lib/calendar.ts`) aber DEAKTIVIERT — Slots gelten aktuell alle als frei,
  keine echten Einträge. Service-Account-JSON existierte mal (Projekt haarstudio-graziella), ist
  aber in .env.local auskommentiert. Kann reaktiviert werden wenn nötig.

---

## 5. VAPI — VOICE-AGENT (Telefon-KI)

### Was Vapi ist
Plattform die alle 5 Voice-Komponenten bündelt: Telefonie + Speech-to-Text + LLM + Text-to-Speech + Tool-Calls.
Man konfiguriert einen Agenten (System-Prompt + Voice + Tools), kein eigenes Audio-Engineering nötig.
Region für David: **Irland (EU)** wegen DSGVO + Latenz.

### Zwei Voice-Agenten gebaut/geplant

**A) „Lia – Haarstudio Graziella" (INBOUND, Salon)**
- Assistant ID: `954d6f47-5e2a-4421-bb8f-1ab6c75d86ed`
- Nimmt verpasste Salon-Anrufe entgegen (Rufumleitung bei besetzt/keine Antwort),
  beantwortet FAQs, soll Termine in Google Calendar buchen, SMS-Bestätigung, Eskalation an Salon.
- Test-Anruf lief erfolgreich. Tools (getFreeSlots, createBooking, sendSmsConfirmation) sind
  nur Schemas OHNE echtes Backend → Lia eskaliert korrekt wenn sie nicht buchen kann.
- Erster Test: 0,28 $ für 2:41 min. Prompt war zu lang (30k Tokens) → wurde gekürzt.
- Modell: claude-haiku-4-5, Voice: Vapi Elliot/Deepgram nova-3 (deutsch).
- Kürzerer optimierter System-Prompt existiert (mit {{date}} für Datumslogik).

**B) „Lia Sales" (OUTBOUND, Akquise)**
- Idee: ruft lokale Geschäfte an, stellt sich als KI vor (= ist gleichzeitig Demo des Produkts),
  matched Branche/Pain-Point auf passendes Produkt aus dem Portfolio, erfasst Lead (Name, Tel, Mail,
  bevorzugter Kanal), David meldet sich dann.
- Wissensbasis als Datei: `vapi/lia-sales-knowledge.md` (alle 52 Produkte aus dem Kurs,
  Branchen-Empfehlungen, Einwand-Bibliothek). Marke „Agents Gilt", Selbstreferenz „unser Team".
- Kompakter Verhaltens-Prompt getrennt von Wissensdatei (Token sparen).
- Tools nötig: saveLead (→ Webhook zu Make/Sheet), endCall.

### Kostenstruktur Vapi (real gemessen)
- ~0,07–0,10 $/Min gesamt. Bei 100 Anrufen × 2,5 min ≈ 25 $/Monat reale Kosten.
- Verkauf als Retainer 300–600 €/Monat → Marge >90%.
- WICHTIG: Spending Limit in Vapi setzen (z.B. 5 $) während Testphase.

### Wie Voice im echten Einsatz läuft (Salon installiert NICHTS)
- Salon richtet nur **Rufumleitung** ein (bei besetzt/keine Antwort → Twilio-Nummer).
- Twilio nimmt Anruf → streamt an Vapi → Vapi (STT+LLM+TTS) → ruft Tools auf Davids Vercel-Server →
  Termin landet in Google Calendar, SMS-Bestätigung. Salon sieht nur: Termin im Kalender.
- Alte Salon-Nummer bleibt, kein App/Hardware-Setup beim Salon.

### Twilio-Nummer = SACKGASSE für jetzt (wichtige Erkenntnis)
- Deutsche +49-Nummern brauchen ein **Regulatory Bundle** (Bundesnetzagentur-Pflicht, 1–3 Tage Prüfung).
- Deutsche ORTSnummern (z.B. +49 89 München) gibt's NUR als „Business", NICHT als Privatperson.
- Als Privatperson ginge nur Mobile/National — kaum verfügbar, trotzdem Bundle-Pflicht.
- FAZIT: Twilio-Nummer erst holen wenn Gewerbe angemeldet ist + echter Bedarf.
- Zum TESTEN reicht der **Web-Call im Vapi-Dashboard** (Browser + Mikro, gratis, keine Nummer nötig).

---

## 6. RECHTLICHES & GESCHÄFTLICHES (besprochen)

### Gewerbe
- Vor dem ersten Verkauf: Gewerbe anmelden (~20–40€, 15 min beim Gewerbeamt).
- **Kleinunternehmerregelung § 19 UStG** wählen (Umsatz Jahr 1 < 22.000€): keine USt ausweisen,
  auf Rechnung „Gemäß § 19 UStG wird keine Umsatzsteuer berechnet".
- Steuer kommt erst nächstes Jahr über Einkommensteuererklärung — bei wenig Einkommen oft 0€
  (Grundfreibetrag ~12.084€). Erste 800€-Rechnung behält man komplett.

### Verträge (für Kunden)
1. **Dienstleistungsvertrag**: Leistung, Setup-Preis + Retainer, Mindestlaufzeit 6 Monate,
   Kündigung 30 Tage, Drittkosten (Twilio/Vapi) im Retainer enthalten, Haftung begrenzt.
2. **AVV (Auftragsverarbeitungsvertrag, Art. 28 DSGVO)** — PFLICHT weil personenbezogene Daten
   (Namen, Telefonnummern, Anrufe) im Kundenauftrag verarbeitet werden. Sub-Unternehmer nennen
   (Twilio, Vapi, Anthropic, Google). Vorlagen: IHK, existenzgruender.de, oder Anwalt ~150–300€.
- Tools: PDF + DocuSign Free-Trial reicht für erste Verträge.

### Cold-Call-Recht (WICHTIG für „Lia Sales")
- Cold Calls in DE streng reguliert (§ 7 UWG). Privatpersonen NIEMALS ohne Einwilligung.
- B2B nur bei „mutmaßlichem Interesse". Sofort-Transparenz dass es KI ist. Sperrliste bei Ablehnung.
- VOR echten Akquise-Anrufen: Anwalt-Konsultation (~150€) empfohlen. Bis dahin nur Demo/Eigentests.

---

## 7. ACCOUNTS & KEYS (Werte im Passwort-Manager / .env.local, NICHT hier)

David hat Accounts/Keys bei: Anthropic, Resend, Stripe (test), Supabase, Vercel, Airtable,
Pinecone, Cloudflare, Apify, Make, Vapi, Twilio (Trial), Google Cloud (Service Account).
Alle Secret-Keys sind passwortgeschützt in Notizen + teils in `.env.local` (gitignored).
Resend-Domain agents-gilt.agency ist verifiziert (Mails gehen an beliebige Empfänger).
HINWEIS: David neigt dazu Keys im Chat zu posten — bei Live-Keys vermeiden, rotieren wenn geleakt.

---

## 8. NÄCHSTE SCHRITTE (offen)

Kurzfristig:
1. **Nische & Angebot festlegen** (Modul 4 des Plans) — z.B. „Online-Buchung + KI-Telefon für Friseure/Praxen in Davids Region". EINE Nische zum Start.
2. **Friseur-Website live deployen** auf Vercel → echte URL zum Vorzeigen.
3. **Lia Sales** im Vapi fertig: kurzer Prompt + Wissensdatei hochladen + saveLead-Tool (Webhook → Google Sheet via Make).

Mittelfristig:
4. Gewerbe anmelden (Kleinunternehmer).
5. Mit dem echten Salon Graziella sprechen: „Wie viele Anrufe verpasst ihr? Wäre euch eine KI 300€/Monat wert?" → wenn ja, Voice-Agent echt anbinden (Google Calendar Tools + Twilio-Nummer nach Gewerbe).
6. Erste Lead-Liste (Apify/Google Maps, nur öffentliche Firmendaten, DSGVO-konform) + Outreach.
7. Vertragsvorlagen vom Anwalt prüfen lassen.

Voice-Agent technisch fertigstellen (wenn echter Kunde):
- 3 API-Routen in Friseur-Projekt bauen: /api/voice/free-slots, /api/voice/create-booking, /api/voice/send-sms (nutzen bestehende Booking-Logik wieder)
- In Vapi als Tool-URLs eintragen
- Google Calendar reaktivieren (lib/calendar.ts)
- Deutsche Twilio-Nummer (nach Gewerbe, „Business"-Bundle)

---

## 9. ARBEITSWEISE-NOTIZEN (wie David mit Claude arbeiten will)

- Terminal-Befehle (npm install, npm run dev): David tippt selbst.
- Datei-Edits, Code, .env.local: Claude macht direkt.
- Immer erst Plan zeigen, Fragen stellen, dann bauen (Modul-4-Prinzip).
- David ist Anfänger — Erklärungen einfach halten, Schritt für Schritt, nichts voraussetzen.
- Claude soll David vor Tool-Sammelei/Rabbit-Holes bewahren (er neigt dazu, Tools/Accounts
  anzulegen die er nicht braucht). Nur holen was ein konkretes Projekt braucht.
