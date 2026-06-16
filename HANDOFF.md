# HANDOFF — David / Agents Gilt

## TERMINAL-BEFEHLE (Spickzettel)

### Projekt starten (täglich)
```bash
cd /Users/david/Desktop/Friseur-Test
npm install        # nur beim 1. Mal oder nach neuen Paketen nötig
npm run dev        # startet Server → http://localhost:3000
```
Stoppen: im Terminal `Ctrl + C`

### Stand auf GitHub speichern (nach Änderungen)
```bash
cd /Users/david/Desktop/Friseur-Test
git add .
git commit -m "Kurze Beschreibung was du geändert hast"
git push
```

### Auf einem ANDEREN Computer weitermachen
```bash
# 1. Code von GitHub holen
git clone https://github.com/Davenender/Friseur-Test.git
cd Friseur-Test

# 2. Pakete installieren
npm install

# 3. .env.local NEU anlegen (Werte aus Passwort-Manager!)
cp .env.example .env.local
# Dann .env.local öffnen und Keys eintragen:
code .env.local

# 4. Starten
npm run dev
```
WICHTIG: `.env.local` ist NICHT auf GitHub (Sicherheit). Die Keys musst du
auf dem neuen Rechner aus deinem Passwort-Manager neu eintragen.

---

## NEUES PROJEKT ANFANGEN (Schritt für Schritt)

### 1. Ordner auf dem Desktop anlegen + Next.js erstellen
```bash
cd /Users/david/Desktop
npx create-next-app@latest mein-neues-projekt
# Fragen mit Enter/Empfehlung beantworten (TypeScript: ja, Tailwind: ja, App Router: ja)
cd mein-neues-projekt
```

### 2. Auf GitHub ein leeres Repo erstellen
- Auf github.com → grüner Button "New" (oben rechts)
- Name vergeben (z.B. "mein-neues-projekt")
- KEIN README/gitignore ankreuzen (Next.js hat das schon)
- "Create repository"
- GitHub zeigt dir dann eine URL wie: https://github.com/Davenender/mein-neues-projekt.git

### 3. Desktop-Ordner mit GitHub verbinden
```bash
cd /Users/david/Desktop/mein-neues-projekt
git init
git add .
git commit -m "Erster Commit"
git branch -M main
git remote add origin https://github.com/Davenender/mein-neues-projekt.git
git push -u origin main
```

### 4. Auf Vercel deployen (live stellen)
- vercel.com → "Add New" → "Project"
- Das GitHub-Repo auswählen → "Deploy"
- ENV-Variablen in den Vercel-Settings eintragen (die gleichen wie in .env.local)

### Merksatz
- DESKTOP-Ordner = wo du arbeitest (lokal)
- GITHUB-Repo = Backup + Cloud (über `git push`)
- VERCEL = macht die Seite live im Internet (zieht automatisch von GitHub)

---

## PROJEKT-DATEIEN (Übersicht)
- `app/` = Seiten + API-Routen
- `components/` = wiederverwendbare Bausteine (Forms, Widgets)
- `lib/` = Logik (booking, mail, stripe, chatbot-knowledge…)
- `business/` = Verträge (Dienstleistung, AVV, Rechnung) als .docx + .md
- `vapi/` = Wissensbasis für Voice-Agent "Lia Sales"
- `.env.local` = alle Keys (NICHT auf GitHub)
- `STATUS.md` + `HANDOFF.md` = Übergabe-Dokumente

## WICHTIGE FAKTEN (Stand zuletzt)
- Geschäfts-E-Mail: kontakt@agents-gilt.agency (Google Workspace)
- Domain: agents-gilt.agency (Registrar: Namecheap, DNS: Vercel)
- GitHub: Davenender/Friseur-Test
- Marke: Agents Gilt · Logo: Wortmarke "AGENTS GILT" + Gold-Diamant
- Gewerbe angemeldet (Kleinunternehmer §19 UStG), warte auf Gewerbeschein + Steuernummer
- Verträge in business/ → Anwaltsprüfung läuft (Favoritin: Anne Sulmann / ITjur)
- Vapi Voice-Agent "Lia" Inbound: 954d6f47-5e2a-4421-bb8f-1ab6c75d86ed
