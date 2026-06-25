# VOLLSTÄNDIGE PROJEKT-ÜBERGABE — David / Agents Gilt
(Stand: 17. Juni 2026 — v2, inkl. live geschalteter Agentur-Website)

> Diese Datei ist der Master-Handoff. In einen neuen Chat einfügen ODER „lies STATUS.md". 
> Zusätzlich liegt eine Kopie in /Users/david/Desktop/AgentsGilt/STATUS.md.

---

## 0. WER ICH BIN & ARBEITSWEISE
- **David Hesse**, geb. 28.12.2007 (18, volljährig). Lämmerspieler Straße 100, 63165 Mühlheim am Main.
- Blutiger Anfänger (Start Anfang Juni 2026), lernt nach Kurs **„CLS — Von 0€ zu wiederkehrenden Umsätzen mit Claude"**.
- Baut 1-Personen-KI-Agentur **„Agents Gilt"** (Domain agents-gilt.agency). Verkauft KI-Lösungen an lokale KMU: Setup-Preis + monatlicher Retainer.
- **Arbeitsweise-Regeln:**
  - Terminal-Befehle (npm install, npm run dev, git) tippt **David SELBST**. Claude darf Code/Dateien/.env.local direkt schreiben.
  - Immer ERST Plan zeigen + Fragen stellen, DANN bauen. Einfache Schritt-für-Schritt-Erklärungen.
  - Claude bewahrt David vor Tool-Sammelei (nur holen, was ein Projekt konkret braucht).
  - **Keys NIE im Chat posten** (David macht das oft → bei Leak rotieren). Keys gehören in .env.local / Passwort-Manager.
  - David editiert teils selbst mit anderem Tool → vor Überschreiben Dateien lesen.

---

## 1. GESCHÄFTSMODELL (CLS-Kurs)
Mit Claude in Stunden bauen, wofür Agenturen Wochen brauchen (Websites, Chatbots, AI-Agenten, Automatisierungen, interne Tools, SaaS), an lokale KMU verkaufen — einmalig Bau + monatliche Betreuung.
**4 Stufen:** 1) Quick Wins (Landingpage/Chatbot) 300–1.500€ · 2) Produktisiert (CRM/Voice/Buchung) 1.500–5.000€ + Retainer · 3) Custom (Portal/RAG) 5.000–20.000€ + Retainer · 4) SaaS/Consulting.
**Prinzipien:** Erst Plan dann Code · ROLLE/ZIEL/KONTEXT/CONSTRAINTS · große Aufgaben zerlegen · Keys in .env · CLAUDE.md pro Projekt · „Frag nach bevor du rätst".
**Kurs-PDF:** /Users/david/Downloads/pdf24_umgewandelt.pdf (372 S.)

---

## 2. 🟢 AGENTUR-WEBSITE (in diesem Chat gebaut & LIVE)
**Live: https://agents-gilt.agency** · Pfad /Users/david/Desktop/AgentsGilt · GitHub Davenender/AgentsGilt · Vercel-Projekt „agents-gilt" (Hobby).

**Tech-Stack:** Next.js 16.2.7 (App Router, Turbopack), React 19.2.4, Tailwind v4 (Theme in app/globals.css via @theme, KEINE tailwind.config.js), TypeScript, **GSAP + ScrollTrigger** (Animationen), **@anthropic-ai/sdk** (Chatbot), Resend (Kontaktmail), Zod. (Bewusst dieselben Versionen wie Friseur gespiegelt.)

**Struktur:**
- app/: page.tsx (Onepage), layout.tsx (Fonts Inter+Sora, bindet ChatWidget ein), globals.css (Marken-Theme), icon.png (Favicon), impressum/page.tsx, datenschutz/page.tsx, api/chat/route.ts (Streaming-Chatbot), api/contact/route.ts (Formular→Resend).
- components/: Header, Hero, HeroContent, HeroTrail (Gold-Diamant-Partikelfeld, von David), DiamondBackground, Reveal, Services, ServiceCard, Process, WhyUs, Contact, Footer, ChatWidget.
- lib/: content.ts (ALLE Texte zentral), gsap.ts, mail.ts, chatbot-knowledge.ts (AGENTS_GILT_SYSTEM_PROMPT).
- public/: logo-full.png (Wortmarke), logo-mark.png (Gold-Diamant).

**Farben (globals.css @theme):** gold #d4a23c, gold-dark #b8842b, ink #0c0e14, cream #faf9f6, line #e6e2d8.

**Features/Animationen (GSAP):** Hero-Intro-Timeline (Eyebrow→Zeilen aus Maske hoch→Sub→Buttons), Diamant scrollgebunden (scrub) + dezenter Maus-Tilt + Aufleuchten via CSS-Var `--dg`, Reveal-on-Scroll für Sektionen, Produktkarten mit 3D-Tilt + Gold-Glanz, alles reduced-motion-sicher. Anklickbare Leistungskarten → wählen Leistung im Kontakt-Dropdown + scrollen dorthin („Sonstiges" = frei beschreiben). Kontaktformular (Resend) + E-Mail-/WhatsApp-Buttons (Nummer 4916098427943).

**Chatbot „Agents Gilt"** (heißt so, NICHT mehr Lia): runder Logo-Button unten rechts, 10-Sek-Bubble in Gold. Streaming (claude-sonnet-4-5). Antwortet NUR aus chatbot-knowledge.ts (Verkaufsinfos: Leistungen, grobe Preis-Spannen, Ablauf, Vorteile, Kontakt). Regeln: keine festen Preise (nur Spanne + „hängt von Umfang/Nutzung ab"), NICHTS über Tools/Technik/Internas/andere Projekte (kennt KEINEN Friseur). Bei zu spezifischen Fragen → Marker [KONTAKT] → Widget zeigt „Kontakt aufnehmen"-Button → scrollt zu #kontakt.

**Env-Vars (lokal in .env.local UND in Vercel gesetzt):** ANTHROPIC_API_KEY, RESEND_API_KEY, MAIL_FROM=`Agents Gilt <kontakt@agents-gilt.agency>`, MAIL_TO=`kontakt@agents-gilt.agency`. .env.local ist gitignored (kommt NICHT auf GitHub).

**Impressum + Datenschutz:** vollständig ausgefüllt (David Hesse, Lämmerspieler Str. 100, 63165 Mühlheim, Tel +49 1609 8427943, §19 UStG; Datenschutz mit Vercel/Resend/Anthropic-USA/WhatsApp, keine Tracking-Cookies).

**Deployment:** Push zu GitHub → Vercel deployt automatisch. Domain agents-gilt.agency vom alten „agents"-Projekt umgezogen (www + apex beide Production, alte vercel.app = 307-Redirect).

**WICHTIG – Lehren:**
- Animationen: KEIN Framer Motion / keine selbstgebauten Reveals (in Next16/React19 unzuverlässig) → **GSAP ScrollTrigger** ist die zuverlässige Lösung. Grundzustand sichtbar (nie unsichtbar wenn JS fehlt).
- Der Claude-Preview-Headless-Browser pausiert requestAnimationFrame → GSAP-Animationen sind dort „eingefroren"/unsichtbar. KEIN echter Bug — nur in Davids echtem Browser sichtbar. Verifikation: `npm run build` grün + echter Browser.

**OFFENE TO-DOs Website:**
1. **Anthropic-Key ROTIEREN** (wurde im Chat geleakt) → neuen erstellen, alten löschen, in .env.local + Vercel ersetzen + 1× Redeploy.
2. **Spending-Limit** im Anthropic-Konto setzen (Chatbot kostet pro Nachricht).
3. Impressum/Datenschutz ggf. anwaltlich prüfen lassen (Kür).

---

## 3. PROJEKT: FRISEUR-WEBSITE (Übungs-Demo)
**Pfad:** /Users/david/Desktop/Friseur-Test · GitHub Davenender/Friseur-Test · läuft lokal, NICHT deployed.
Vorbild echter Salon „Haarstudio Graziella" (Mühlheim). Next.js 16, Tailwind v4, Resend, Stripe (TEST), @anthropic-ai/sdk.
Features: Landingpage, Buchung 5 Schritte (kostenlos=direkt, bezahlt=Stripe-Anzahlung, 2 Mails+.ics), Stripe-Gutscheine mit Restguthaben-Rollover, Chatbot „Lia" (Streaming), Google Calendar (gebaut, deaktiviert).
> Diese Friseur-Geschichte ist KOMPLETT getrennt von Agents Gilt — der Agentur-Chatbot weiß davon nichts.

---

## 4. VOICE-AGENT (Vapi) — „Lia"
Telefonie Twilio → STT Deepgram → LLM Claude → TTS ElevenLabs, Region Irland/EU.
- INBOUND „Lia – Haarstudio Graziella": Assistant ID 954d6f47-5e2a-4421-bb8f-1ab6c75d86ed, claude-haiku-4-5. Tools nur Schemas (eskaliert).
- OUTBOUND „Lia Sales": Akquise, stellt sich sofort als KI vor. Wissensbasis vapi/lia-sales-knowledge.md.
- Deutsche Twilio-Nummer = Sackgasse bis Gewerbe (Regulatory Bundle). Bis dahin Web-Call zum Testen.
- Kosten ~0,07–0,10$/Min. Rechtlich §7 UWG: Privatpersonen NIE cold callen, B2B nur mutmaßliches Interesse, KI-Transparenz sofort.
- Technisch offen: 3 API-Routen (free-slots, create-booking, send-sms) im Friseur-Projekt + Vapi-Tool-URLs, Google Calendar reaktivieren.

---

## 5. GESCHÄFTLICH / RECHTLICH
- **Gewerbe:** angemeldet (über gewerbeanmeldung-sofort.de, 80€), wartet auf Schein → Finanzamt-Fragebogen → Steuernummer → DANN erst Rechnungen. Einzelunternehmer, Kleinunternehmer §19 UStG. Achtung Fake-Briefe (Gewerbeauskunft-Zentrale) → ignorieren.
- **Steuern:** keine USt ausweisen, „Gemäß §19 UStG keine USt". 30% beiseitelegen, EÜR, Belege 10 Jahre.
- **Verträge** (in Friseur business/ als .docx+.md, auch in DocuSign als Vorlagen): Dienstleistungsvertrag (Setup+Retainer, Mindestlaufzeit 6 Mon, Kündigung 30 Tage, Haftung begrenzt, §19), AVV (DSGVO Art.28), Rechnungsvorlage. + 5 Leistungsscheine (Website, Chatbot, Voice-Agent, Terminbuchung, Automatisierung). Ein Basisvertrag reicht für alle Produkte. **Vom Anwalt prüfen lassen.**
- **Anwalt (anwalt.de, IT-Recht):** Favoritin Anne Sulmann (ITjur Düsseldorf), 2. Christian Kramarz (Darmstadt). Festpreise vergleichen.
- **Zahlung:** Stripe Setup=one-time, Retainer=Abo. Vertrag IMMER nötig (Mindestlaufzeit). DocuSign-Signatur vor Zahlungslink. Stripe-Statement-Descriptor: „AGENTS GILT".

---

## 6. MARKE & INFRASTRUKTUR
- Name **„Agents Gilt"**. Logo: Wortmarke „AGENTS GILT" + Gold-Diamant. Favicon = Diamant.
- **Domain agents-gilt.agency:** Registrar Namecheap, DNS bei Vercel. Jetzt auf Vercel-Projekt „agents-gilt" (die Website, LIVE). Altes „agents"-Platzhalter-Projekt ist abgelöst.
- **Google Workspace:** kontakt@agents-gilt.agency (~6€/Mon), Gmail-Signatur eingerichtet.
- **Resend:** Domain agents-gilt.agency verifiziert.
- Telefon/WhatsApp: WhatsApp-Business-Nummer 4916098427943 (im Kontaktbereich der Website verlinkt).

---

## 7. ACCOUNTS & KEYS (Werte im Passwort-Manager / .env.local, NICHT hier!)
Anthropic (sk-ant-…; im Chat geleakt → ROTIEREN), Resend (re_…), Stripe TEST (pk_test/sk_test), Vapi, Vercel, Supabase (pausiert, ungenutzt), Twilio (Trial), Google Workspace.
Stripe-Testkarte 4242 4242 4242 4242.
**Kern-Tools:** Claude Code, GitHub, Vercel, Stripe, Resend, Anthropic API, Vapi, GSAP.
**Nicht nötig (Doppelungen):** Netlify, Firebase, LangChain, Airtable, OpenAI, Pinecone, Cloudflare.

---

## 8. WO DAS WISSEN GESPEICHERT IST
1. **Auto-Memory (persistiert automatisch über Claude-Code-Sitzungen, die im Ordner Friseur-Test laufen):**
   `/Users/david/.claude/projects/-Users-david-Desktop-Friseur-Test/memory/`
   - MEMORY.md (Index) + user-david.md, feedback-arbeitsweise.md, project-agents-gilt.md, project-friseur-website.md, project-voice-agent.md, project-agentsgilt-website.md
   - ⚠️ Diese Memory hängt am Projektpfad Friseur-Test. Startest du Claude Code direkt im AgentsGilt-Ordner, ist die Memory dort NICHT automatisch da → dann diese STATUS.md nutzen.
2. **STATUS.md** (diese Datei) — Master-Handoff zum Einfügen in neue Chats. Liegt in Friseur-Test/ UND AgentsGilt/.
3. **Kurs-PDF:** /Users/david/Downloads/pdf24_umgewandelt.pdf.
4. **Claude.ai Browser-Projekt „Agents Gilt":** PDF + diese STATUS.md als Projekt-Wissen hochladen → jeder Chat dort kennt alles (für Strategie/Business).

---

## 9. NÄCHSTE SCHRITTE (offen)
1. Anthropic-Key rotieren + Spending-Limit (Website-To-dos oben).
2. Anwaltsprüfung Verträge (Anne Sulmann / Kramarz, Festpreise).
3. Steuernummer abwarten (Gewerbeschein → ELSTER → Kleinunternehmer).
4. Nische & Angebot finalisieren (EINE Nische, z.B. Buchung+KI-Telefon für Friseure/Praxen) — Woche 4 im 90-Tage-Plan.
5. Mit echtem Salon Graziella über Voice-Agent sprechen.
6. Voice-Agent technisch fertigstellen (3 API-Routen, Google Calendar, dt. Nummer nach Gewerbe).
7. Erste Lead-Liste (Apify/Google Maps, nur öffentliche Firmendaten, DSGVO) + Outreach.
8. Friseur-Demo optional auf Vercel deployen.

---

## TERMINAL-SPICKZETTEL
- **Agentur-Website starten:** `cd /Users/david/Desktop/AgentsGilt && npm run dev` → localhost:3000 (Stop: Ctrl+C)
- **Website-Änderung live bringen (auto-Deploy via Vercel):**
  `cd /Users/david/Desktop/AgentsGilt && git add . && git commit -m "..." && git push`
- **Friseur starten:** `cd /Users/david/Desktop/Friseur-Test && npm run dev`
- **Anderer PC:** `git clone <repo-url>` → `npm install` → `.env.local` neu (Keys aus Passwort-Manager) → `npm run dev`
- **Neues Projekt verbinden:** Ordner + leeres GitHub-Repo erstellen → `git init` → `git add .` → `git commit -m "..."` → `git branch -M main` → `git remote add origin <URL>` → `git push -u origin main`
- Desktop = arbeiten, GitHub = Backup, Vercel = live.
