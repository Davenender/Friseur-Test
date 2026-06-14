# Auftragsverarbeitungsvertrag (AVV) — Vorlage nach Art. 28 DSGVO

> ⚠️ STARTVORLAGE, kein anwaltlich geprüfter Vertrag. Einmal vom Anwalt prüfen
> lassen (zusammen mit dem Dienstleistungsvertrag). Danach für alle Kunden nutzbar.
> Dieser AVV ist Anlage zum Dienstleistungsvertrag und wird mit unterschrieben.

---

## AUFTRAGSVERARBEITUNGSVERTRAG (AVV)

gemäß Art. 28 DSGVO

zwischen

**Auftraggeber (Verantwortlicher):**
[Firmenname des Kunden], [Inhaber]
[Straße], [PLZ Ort]
(nachfolgend „Verantwortlicher")

und

**Auftragnehmer (Auftragsverarbeiter):**
David Hesse, Agents Gilt
Lämmerspieler Straße 100, 63165 Mühlheim am Main
(nachfolgend „Auftragsverarbeiter")

---

### § 1 Gegenstand und Dauer
Der Auftragsverarbeiter verarbeitet personenbezogene Daten im Auftrag des
Verantwortlichen im Rahmen des Dienstleistungsvertrages (z.B. Betrieb eines
Chatbots / KI-Telefonassistenten / Buchungssystems). Die Dauer entspricht der
Laufzeit des Dienstleistungsvertrages.

### § 2 Art und Zweck der Verarbeitung
- **Zweck:** Entgegennahme von Anfragen, Terminbuchung, Beantwortung von
  Kundenfragen, Versand von Bestätigungen im Auftrag des Verantwortlichen.
- **Art der Verarbeitung:** Erheben, Speichern, Übermitteln, Löschen.

### § 3 Art der Daten
- Kontaktdaten (Name, Telefonnummer, E-Mail-Adresse)
- Termin-/Buchungsdaten
- Inhalte von Anfragen / Gesprächen / Chats
- ggf. Audiodaten / Transkripte (bei Voice-Agent)

### § 4 Kategorien betroffener Personen
- Kunden und Interessenten des Verantwortlichen
- Anrufer / Website-Besucher

### § 5 Pflichten des Auftragsverarbeiters
Der Auftragsverarbeiter verpflichtet sich:
1. Daten nur auf dokumentierte Weisung des Verantwortlichen zu verarbeiten.
2. Vertraulichkeit zu wahren (auch eingesetzte Personen zur Verschwiegenheit zu verpflichten).
3. Geeignete technische und organisatorische Maßnahmen (TOM) zu treffen (siehe § 8).
4. Den Verantwortlichen bei Betroffenenrechten, Datenschutz-Folgenabschätzungen
   und Meldepflichten zu unterstützen.
5. Datenschutzverletzungen unverzüglich (i.d.R. binnen 24 Stunden) zu melden.
6. Nach Vertragsende alle Daten zu löschen oder zurückzugeben (nach Wahl des
   Verantwortlichen), soweit keine gesetzliche Aufbewahrungspflicht besteht.

### § 6 Unterauftragsverarbeiter (Sub-Prozessoren)
Der Verantwortliche stimmt dem Einsatz folgender Unterauftragsverarbeiter zu:

| Dienst | Zweck | Sitz / Datenstandort |
|---|---|---|
| Anthropic (Claude API) | KI-Sprachverarbeitung | USA / EU (Standardvertragsklauseln) |
| Vapi | Voice-Agent-Plattform | USA / EU-Region |
| Twilio | Telefonie / SMS | USA / EU (SCC) |
| Deepgram / ElevenLabs | Sprache-zu-Text / Text-zu-Sprache | USA (SCC) |
| Stripe | Zahlungsabwicklung | EU/USA (SCC) |
| Resend | E-Mail-Versand | USA (SCC) |
| Supabase | Datenbank / Hosting | EU-Region |
| Google (Calendar) | Terminverwaltung | USA/EU (SCC) |
| Vercel | Hosting der Anwendung | EU/USA (SCC) |

Der Auftragsverarbeiter informiert den Verantwortlichen über beabsichtigte
Änderungen. Der Verantwortliche kann widersprechen (führt ggf. zur Kündigung,
wenn die Leistung sonst nicht erbringbar ist).
[Hinweis: nur die Dienste auflisten, die im konkreten Projekt wirklich genutzt werden.]

### § 7 Drittlandtransfer
Soweit Daten in Drittländer (z.B. USA) übermittelt werden, erfolgt dies auf
Grundlage von EU-Standardvertragsklauseln (SCC) bzw. dem EU-US Data Privacy
Framework. Wo möglich, werden EU-Regionen der Dienste gewählt.

### § 8 Technische und organisatorische Maßnahmen (TOM)
- Verschlüsselte Datenübertragung (TLS/HTTPS)
- Zugriffsschutz durch Passwörter / Zwei-Faktor-Authentifizierung
- API-Schlüssel werden sicher und getrennt vom Code gespeichert
- Zugriff nur durch den Auftragsverarbeiter, keine Weitergabe an Dritte
- Regelmäßige Löschung nicht mehr benötigter Daten
- Audiodaten/Transkripte werden nach [30] Tagen automatisch gelöscht

### § 9 Rechte des Verantwortlichen
Der Verantwortliche bleibt Herr der Daten. Er kann jederzeit Auskunft über die
Verarbeitung verlangen und Weisungen erteilen.

### § 10 Haftung
Es gelten die Haftungsregelungen des Dienstleistungsvertrages. Die Haftung
richtet sich im Übrigen nach Art. 82 DSGVO.

---

Ort, Datum: ________________________

Verantwortlicher (Kunde): ________________________

Auftragsverarbeiter (David Hesse): ________________________
