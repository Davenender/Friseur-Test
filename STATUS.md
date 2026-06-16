# VOLLSTÄNDIGE PROJEKT-ÜBERGABE — David / Agents Gilt
(Stand: Juni 2026 — alle Details aus dem bisherigen Chat)

---

## 0. WER ICH BIN & ARBEITSWEISE

- **David Hesse**, geb. 28.12.2007 (18, volljährig). Wohnt Lämmerspieler Straße 100, 63165 Mühlheim am Main.
- Blutiger Anfänger, hat Anfang Juni 2026 angefangen. Lernt nach Kurs **„CLS — Von 0€ zu wiederkehrenden Umsätzen mit Claude"**.
- Baut **1-Personen-KI-Agentur „Agents Gilt"** (Domain: agents-gilt.agency). Verkauft KI-Lösungen an lokale Unternehmen (Setup-Preis + monatlicher Retainer).
- **Arbeitsweise-Regeln:**
  - Terminal-Befehle (npm install, npm run dev) tippt David SELBST.
  - Claude darf Code/Dateien/.env.local direkt schreiben.
  - Immer ERST Plan zeigen + Fragen stellen, DANN bauen.
  - Einfache Schritt-für-Schritt-Erklärungen (Anfänger).
  - Claude soll David vor Tool-Sammelei bewahren (nur holen was ein Projekt konkret braucht — David neigt dazu, Accounts/Keys auf Vorrat anzulegen).
  - Keys NIE im Chat posten (David macht das oft → bei Live-Keys gefährlich, rotieren wenn geleakt).

---

## 1. DAS GESCHÄFTSMODELL (CLS-Kurs)

**In einem Satz:** Mit Claude in Stunden bauen, wofür Agenturen Wochen brauchen (Websites, Chatbots, AI-Agenten, Automatisierungen, interne Tools, SaaS), an lokale KMU verkaufen — einmalig Bau + monatliche Betreuung.

**4 Einkommensstufen:** 1) Quick Wins (Landingpage/Chatbot) 300–1.500€. 2) Produktisiert (CRM/Voice/Buchung) 1.500–5.000€ + Retainer. 3) Custom (Portal/RAG) 5.000–20.000€ + Retainer. 4) SaaS/Consulting wiederkehrend/Tagessatz.

**13 Module:** 1–4 Fundament · 5–7 Werkzeugkiste (200+ Prompts, Bauanleitungen, 50+ Angebote) · 8–10 Verkaufen · 11–12 Betrieb/SOPs · 13 90-Tage-Plan.

**Prinzipien (Modul 4):** Erst Plan dann Code · ROLLE/ZIEL/KONTEXT/CONSTRAINTS/OUTPUT/QUALITÄT · große Aufgaben zerlegen · Keys in .env, nie committen · „Frag nach bevor du rätst" · CLAUDE.md pro Projekt.

**90-Tage-Stand:** Woche 1 Setup ✅ · Woche 2 Demo-Landingpage ✅ (Friseur) · Woche 3 Chatbot ✅ · Woche 4+ (Nische/Angebot/Akquise) OFFEN.

**Kurs liegt als PDF:** /Users/david/Downloads/pdf24_umgewandelt.pdf (36MB, 372 Seiten).

---

## 2. PROJEKT 1: FRISEUR-WEBSITE (Übungs-Demo)

**Pfad:** /Users/david/Desktop/Friseur-Test · **GitHub:** Davenender/Friseur-Test · läuft lokal (npm run dev → localhost:3000), Build+Lint grün, NOCH NICHT auf Vercel deployed.

**Vorbild:** haarstudio-graziella.de — echter Salon „Haarstudio Graziella", Mühlheim/Lämmerspiel. David war dort. Inhaberin **Graziella Faro-Lombardi** (seit 2012), 2. Stylistin **Aurelia** (Coloration). Echte Team-Fotos in public/team/ (graziella.jpg, aurelia.jpg).

**Salon-Daten:** Friedrich-Ebert-Str. 8, 63165 Mühlheim am Main · Tel 06108/799865 · kontakt@haarstudio-graziella.de · Mo–Fr 09:00–18:30, Sa 08:30–14:00, So zu.

**Leistungen (Preis/Dauer/Anzahlung):** Schnitt ab 35€/45min/10€ · Coloration ab 65€/90min/20€ · Strähnen ab 85€/120min/25€ · Keratinglättung ab 180€/180min/50€ · Kostenlose Beratung 30min/0€.

**Tech-Stack:** Next.js 16 (App Router, Turbopack), React 19, Tailwind v4, TypeScript, Resend, Stripe, @anthropic-ai/sdk, react-day-picker, date-fns, zod, react-hook-form.

### Features & Dateien
- **Landingpage** (app/page.tsx): Header, Hero (Stats, Review-Card), Marquee, About, **Team** (Graziella+Aurelia), Services (4 Foto-Karten), Unique, Gallery, **Reviews** (als „Google Rezensionen" gebrandet, Testimonials Julia/Renate/Nicole), Booking, GiftCard, Contact (Google-Maps-iframe + „Route planen"), Footer.
- **Buchung** (components/BookingForm.tsx, app/api/booking + availability): 5 Schritte Service→Mitarbeiterin(Graziella/Aurelia/egal)→Datum(DayPicker, So+Vergangenheit gesperrt)→Slot→Daten. Kostenlos=direkt gebucht, bezahlt=Stripe-Anzahlung. 2 Mails (Kundin-Bestätigung + Salon-Notification) mit .ics-Anhang.
- **Slots** (lib/booking.ts): aus Öffnungszeiten generiert, 45-min, 2h Vorlauf, max 60 Tage.
- **Stripe-Gutscheine** (components/GiftCardForm.tsx, app/api/checkout, lib/giftcard-mail.ts): Presets 25/50/75/100€ o. frei. Nach Zahlung: Voucher-Mail mit Code (Webhook ODER /gutschein/erfolg, idempotent). Gutschein erzeugt Stripe-Coupon + Promotion-Code → bei Buchung einlösbar (allow_promotion_codes:true).
- **Restguthaben-Rollover** (lib/giftcard-refund.ts): bei Teil-Einlösung wird alter Promo-Code deaktiviert + neuer Coupon mit Restbetrag (gleicher Code) erstellt + Mail. WICHTIGE BUGS GEFIXT: Stripe-Expand max 4 Ebenen (war 5); Coupon liegt unter discount.source.coupon (nicht discount.coupon).
- **Chatbot „Lia"** (components/ChatWidget.tsx, app/api/chat + chat-lead, lib/chatbot-knowledge.ts): Floating-Button unten rechts, Attention-Bubble nach 10s (dismissbar, sessionStorage), Chat-Panel (Desktop 400×640, Mobile Vollbild). Persona Lia, warm, duzt, Streaming (SSE, claude-sonnet-4-5). Beantwortet Salon-Fragen, lotst zu #termin, sammelt E-Mail-Lead wenn unsicher ([LEAD_REQUEST]-Marker → Inline-Form → 2 Mails). Preise nur „ab ca.", bleibt strikt beim Salon-Thema.
- **Mail** (lib/mail.ts): Resend-Wrapper, degradet sauber ohne Key (skip + Warning), loggt Erfolg/Fehler.
- **Stripe** (lib/stripe.ts), **ICS** (lib/ics.ts), **Voucher** (lib/voucher.ts).
- **Google Calendar** (lib/calendar.ts): gebaut, aber DEAKTIVIERT. Slots gelten alle als frei, keine Einträge. Service-Account JSON (Projekt haarstudio-graziella, haarstudio-booking@haarstudio-graziella.iam.gserviceaccount.com) war eingerichtet, ist in .env.local auskommentiert. Reaktivierbar.

### Erledigte Design-Fixes
Strähnen-Bild (zeigte Schuhe → echtes Foto), Sterne-Karte Position (verdeckte Text → an Bildecke), Chat-Dots (Bounce → sanftes Pulsieren).

---

## 3. VOICE-AGENT (Vapi)

**Wie es funktioniert:** Telefonie (Twilio) → STT (Deepgram) → LLM (Claude) → TTS (ElevenLabs) → Tools. Plattform Vapi bündelt alles. Region: **Irland (EU)** wegen DSGVO+Latenz. Salon installiert NICHTS — nur Rufumleitung (besetzt/keine Antwort → Twilio-Nr), Termin landet in Google Calendar.

**A) „Lia – Haarstudio Graziella" (INBOUND):**
- Assistant ID: **954d6f47-5e2a-4421-bb8f-1ab6c75d86ed**
- claude-haiku-4-5, Deepgram nova-3 (DE), Voice Vapi „Elliot"
- Tools (nur Schemas, KEIN Backend → eskaliert korrekt): getFreeSlots, createBooking, sendSmsConfirmation, transferToHuman (→ +496108799865)
- Erster Testanruf: $0.28 für 2:41min, 30k Prompt-Tokens (zu lang) → Prompt gekürzt, {{date}} für Datumslogik eingebaut
- US-Testnummer provisioniert: +1 640 214 9755 (zum Testen aus DE Auslandsgespräch → besser Web-Call im Vapi-Dashboard)

**B) „Lia Sales" (OUTBOUND Akquise):**
- Konzept: ruft lokale Geschäfte an, stellt sich SOFORT als KI vor (=Demo des Produkts), matcht Branche→Produkt, erfasst Lead.
- Wissensbasis: **vapi/lia-sales-knowledge.md** (alle 52 Produkte aus Kurs, Branchen-Empfehlungen, Einwand-Bibliothek, Marke „Agents Gilt", „unser Team")
- Tools: saveLead (→ Webhook zu Make/Google Sheet), endCall
- Kompakter Verhaltens-Prompt getrennt von Wissensdatei (Token sparen)

**Twilio-Nummer = SACKGASSE für jetzt:** Deutsche +49-Nummern brauchen Regulatory Bundle (Bundesnetzagentur, 1–3 Tage Prüfung). Ortsnummern (z.B. +49 89) nur „Business", nicht Privatperson. Mobile/National kaum verfügbar. → Echte Nummer erst nach Gewerbe holen. Web-Call zum Testen.

**Kosten Vapi:** ~0,07–0,10$/Min. 100 Anrufe/Monat ≈ 25$ real → Verkauf 300–600€/Monat Retainer = >90% Marge. Spending-Limit setzen.

**Rechtlich Cold-Call (§7 UWG):** Privatpersonen NIE. B2B nur bei mutmaßlichem Interesse. KI-Transparenz sofort. Sperrliste bei Ablehnung. Vor echter Akquise Anwalt fragen.

---

## 4. GESCHÄFTLICHES / RECHTLICHES

### Gewerbe
- Angemeldet über gewerbeanmeldung-sofort.de, **80€ bezahlt** (überteuert — direkt beim Amt 20–40€), in Bearbeitung/Versand.
- **Tätigkeit:** „Entwicklung und Vermarktung von KI-gestützten Softwarelösungen, insbesondere Chatbots, AI-Agenten und Prozessautomatisierungen für Unternehmen." (top formuliert, deckt alles ab)
- Einzelunternehmer, **Kleinunternehmer §19 UStG**.
- WARTET AUF: Gewerbeschein (Post) → dann Finanzamt-Fragebogen (oder proaktiv via ELSTER) → Steuernummer → DANN Rechnungen erlaubt.
- WARNUNG: Nach Gewerbeanmeldung kommen Fake-Briefe (Gewerbeauskunft-Zentrale etc.) die amtlich aussehen + Geld fordern → ignorieren/wegwerfen.

### Steuern
- Kleinunternehmer: keine USt ausweisen, „Gemäß §19 UStG keine USt" auf Rechnung. Behält erste Rechnung komplett. Steuer erst nächstes Jahr (Einkommensteuer), bei wenig Einkommen oft 0€ (Grundfreibetrag ~12.084€). 30% beiseitelegen. EÜR (einfache Tabelle). Belege 10 Jahre.

### Verträge (in business/ als .docx UND .md)
- **1_Dienstleistungsvertrag.docx** — Setup+Retainer, Mindestlaufzeit 6 Mon, Kündigung 30 Tage, Haftung begrenzt (KI-Fehler!), §19 UStG
- **2_AVV_Auftragsverarbeitung.docx** — DSGVO Art.28, Sub-Prozessoren (Anthropic/Vapi/Twilio/Stripe/Resend/Supabase/Google/Vercel), TOM, Löschfristen
- **3_Rechnungsvorlage.docx** — Kleinunternehmer-konform, fortlaufende Nr.
- Ein Basis-Vertrag reicht für ALLE Produkte: §1 (was) + §4/§5 (einmalig vs. Setup+Retainer) anpassen. AVV nur wenn Personendaten verarbeitet (Chatbot/Voice/Portal ja; reine Info-Landingpage nein).
- WICHTIG: vom Anwalt prüfen lassen (~150–250€), dann für alle Kunden wiederverwendbar.

### Zahlung (Stripe)
- Setup = One-time-Produkt, Retainer = Recurring-Abo (monatlich). Kunde gibt 1× Zahlungsdaten → Stripe zieht automatisch ein.
- Kunde kann technisch stoppen (SEPA 8-Wochen-Rückbuchung, Karten-Chargeback) ABER Vertrag (Mindestlaufzeit) sichert rechtlich ab. Stripe macht KEIN Inkasso (Kurs-Typ lag falsch). → Vertrag IMMER nötig, nicht nur Zahlungslink.
- Ablauf: erst Vertrag (DocuSign-Signatur) → dann Stripe-Zahlungslink → per E-Mail.
- E-Signatur-Tool: **DocuSign** (empfohlen, eIDAS, bekannt) / PandaDoc / Yousign.

### Anwalt (anwalt.de)
- Suche „IT-Recht" (Ort leer = bundesweit, beraten online).
- **Favoritin: Anne Sulmann (ITjur, Düsseldorf)** — Bewertung beschreibt EXAKT Davids Fall: „IT-Rahmenvertrag und AVV für IT-Einzelunternehmer mit modularen Leistungsscheinen". 5,0/50, Fachanwältin IT-Recht + Datenschutz.
- 2. Wahl: Christian Kramarz (Darmstadt, 26km, macht explizit Vertragsprüfung).
- Personalisierte Nachricht geschrieben (Bezug auf Bewertung, Festpreis erfragen, 3 Dokumente). David schreibt 2–3 an, vergleicht Festpreise.
- Stelle Fragen zu: Haftung (KI-Fehler), AVV-DSGVO mit US-Diensten, Widerrufsbelehrung, Einmal- vs. Retainer-Variante.

---

## 5. MARKE & INFRASTRUKTUR

### Branding
- Name **„Agents Gilt"** (David behält es; Alternativen wie „Lia Digital" wurden diskutiert).
- **Logo:** Wortmarke „AGENTS GILT" + Gold-Diamant-Icon (gewählt über Roboter-Version). Transparent via remove.bg, Diamant-Icon separat als Favicon.

### Domain & E-Mail
- **Domain agents-gilt.agency:** Registrar **Namecheap**, DNS verwaltet bei **Vercel** (Projekt „agents", Vercel-Account Hobby).
- Die „Produkt X kaufen 29,99€"-Seite auf der Domain = harmloses Test-Deployment (Platzhalter).
- **Google Workspace** eingerichtet, Geschäfts-Mail: **kontakt@agents-gilt.agency** (~6€/Monat).
- DNS-Einträge bei Vercel hinzugefügt: Google-TXT (Domain-Bestätigung) + MX (smtp.google.com, Priorität 1). Resend-Einträge (auf send.-Subdomain) NICHT gelöscht.
- E-Mail-Signatur in Gmail eingerichtet (Logo + Name + kontakt@ + Tel + agents-gilt.agency).
- Gmail als Mac-App via Chrome-Verknüpfung („In eigenem Fenster öffnen").

### Telefon/WhatsApp (für später)
- WhatsApp Business braucht echte Prepaid-SIM (~5€, z.B. Aldi Talk). Twilio-Nummern funktionieren dafür meist NICHT. Erst wenn erster Kunde.

### Impressum
- Pflicht sobald Geschäfts-Website live (Name, Adresse, Mail, oft Tel). Generator: e-recht24.de. → eigene Mail/Nr. sinnvoll (wird öffentlich).

---

## 6. ACCOUNTS & KEYS (Werte im Passwort-Manager, NICHT hier)
Anthropic (sk-ant-api03-…) · Resend (re_… , Domain agents-gilt.agency verifiziert → Mails an alle Empfänger) · Stripe TEST (pk_test_51TfpYk… / sk_test_51TfpYk…) · Vapi · Vercel (vck_…) · Supabase (Projekt ggixjusdavjfphlvwntg — wird wegen Inaktivität pausiert, EGAL weil ungenutzt, NICHT auf Pro upgraden) · Twilio (Trial) · Airtable · Pinecone · Cloudflare · Apify · Make · Google Workspace.
Stripe-Testkarte: 4242 4242 4242 4242, beliebiges Zukunftsdatum, bel. CVC.

---

## 7. TOOLS-EINORDNUNG (was wofür, was BRAUCHT David)
**Kern (nutzt David):** Claude Code, GitHub, Vercel, Stripe, Resend, Anthropic API, Vapi.
**Bald/projektspezifisch:** Supabase (DB/Auth/pgvector), Cal.com, Make/n8n, Twilio, Apify, ElevenLabs/Deepgram.
**NICHT nötig (Doppelungen):** Netlify (Vercel reicht), Firebase (Supabase), LangChain (direktes SDK), Airtable (Supabase), OpenAI (Anthropic), Railway/Docker (erst bei 24/7-Workern), PostHog (erst bei Nutzern), Pinecone/Weaviate (Supabase pgvector reicht), Cloudflare (erst bei DNS-Automation).
**Grundbegriffe:** AI-Agent=handelt mit Tools · MCP=USB für KI · API=Schnittstelle+Key · Webhook=Dienst ruft dich · RAG=KI antwortet aus deinen Docs (Chunks→Embeddings→Vektor-DB).

---

## 8. NÄCHSTE SCHRITTE (offen)
1. Anwaltsprüfung der Verträge abwarten (Anne Sulmann / Christian Kramarz anschreiben, Festpreise vergleichen)
2. Steuernummer abwarten (Gewerbeschein → ELSTER-Fragebogen → Kleinunternehmer ankreuzen)
3. Friseur-Website auf Vercel live deployen
4. Nische & Angebot finalisieren (EINE Nische, z.B. Buchung+KI-Telefon für Friseure/Praxen)
5. Mit echtem Salon Graziella über Voice-Agent sprechen („Wie viele Anrufe verpasst ihr? 300€/Monat wert?")
6. Voice-Agent technisch fertig: 3 API-Routen (/api/voice/free-slots, create-booking, send-sms) in Friseur-Projekt, in Vapi als Tool-URLs, Google Calendar reaktivieren, deutsche Twilio-Nummer (nach Gewerbe, Business-Bundle)
7. Erste Lead-Liste (Apify/Google Maps, nur öffentliche Firmendaten, DSGVO) + Outreach
8. WhatsApp Business (Prepaid-SIM) wenn Kunden kommen

---

## 9. WORKFLOW / ZWEI-CHAT-SYSTEM
- **Claude.ai Browser → Projekt „Agents Gilt"** (Projects-Funktion): Kurs-PDF + diese Zusammenfassung als Projekt-Wissen hochladen → jeder Chat dort kennt alles. Für Strategie/Business/allgemeine Fragen. (Browser-Claude kann KEINE Mac-Dateien lesen.)
- **Claude Code (Coding-Bereich):** für echtes Bauen pro Projekt. Zusammenfassung rein + „lies STATUS.md/HANDOFF.md". Kann Dateien lesen.

## TERMINAL-SPICKZETTEL (auch in HANDOFF.md)
Start: `cd /Users/david/Desktop/Friseur-Test && npm run dev` (stop: Ctrl+C)
Speichern: `git add . && git commit -m "..." && git push`
Anderer PC: `git clone https://github.com/Davenender/Friseur-Test.git` → `npm install` → `.env.local` neu (Keys aus Passwort-Manager) → `npm run dev`
Neues Projekt verbinden: Ordner+leeres GitHub-Repo selbst erstellen, dann: `git init` → `git add .` → `git commit -m "..."` → `git branch -M main` → `git remote add origin <URL>` → `git push -u origin main`
Vercel/andere Apps = optional, nur wenn Projekt sie braucht. Desktop=arbeiten, GitHub=Backup, Vercel=live.
