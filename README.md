# Base-Editing-Labor

Interaktive Biologie-App zum **gezielten Austausch eines einzelnen Basenpaares**
in der DNA. An einer dreidimensionalen Doppelhelix lassen sich Punktmutationen
setzen und zurücknehmen: Krankheiten heilen, Krankheiten auslösen, gesunde
Menschen verändern – und dabei sehen, wo die Methode an ihre Grenzen stößt.

Ausgelegt auf Bedienung per Touch, insbesondere auf dem iPad.

```bash
npm install
npm run dev        # http://localhost:3000
```

## Bedienung

| Geste | Wirkung |
| --- | --- |
| Ein Finger ziehen | Helix drehen |
| Zwei Finger zusammen/auseinander | Zoomen |
| Zwei Finger hoch/runter | An der Sequenz entlangfahren |
| Auf ein Basenpaar tippen | Als Ziel auswählen |
| Auf Phosphat, Zucker, Base tippen | Erklärung zum Bauteil |

## Was die App kann

**3D-Doppelhelix** in drei umschaltbaren Detailstufen:

| Stufe | Was man sieht |
| --- | --- |
| Schema | Stäbe und Kugeln – am übersichtlichsten |
| Moleküle | Echte Ringformen: Zucker als Fünfeck, Purine als Doppelring, Pyrimidine als Einzelring, gestrichelte Wasserstoffbrücken |
| Atome | Jedes Atom einzeln in CPK-Farben, wie in einem Molekülviewer |

Das Modell ist nicht gemalt, sondern aus echten Maßen konstruiert: Ringbindungen
von 1,39 Å, Wasserstoffbrücken von 2,9 Å, glykosidische Bindung von 1,47 Å. Aus
der so entstehenden Breite des Basenpaars (10,7 Å zwischen den C1'-Atomen) folgt
der Winkelversatz der beiden Stränge von 132° – und damit von selbst die ungleich
breite große und kleine Furche. `scripts/inspect-molecule.ts` und
`scripts/inspect-backbone.ts` rechnen das nach.

Der Cas9-Komplex mit Desaminase und Guide-RNA fährt an die Zielstelle und klappt
die Helix lokal auf (R-Schleife). „Zellteilung" zeigt die semikonservative
Replikation: Die Helix trennt sich in zwei Tochterhelices aus je einem alten und
einem neu wachsenden Strang – so wird der Edit vererbt.

**Zum Verstehen** ist alles antippbar: Phosphat, Zucker und Base erklären sich im
3D-Bild selbst, die Farblegende erklärt die Buchstaben. „Was ist was?" beschriftet
die Bauteile direkt am Modell, inklusive der beiden Furchen. Der Wissensteil hat
Steckbriefe der vier Basen, ein durchsuchbares Glossar und einen Selbsttest.

**Werkzeuge** mit ihren echten Beschränkungen:

| Werkzeug | Umwandlung | Doppelstrangbruch |
| --- | --- | --- |
| CBE (BE4max) | C•G → T•A | nein |
| ABE (ABE8e) | A•T → G•C | nein |
| CGBE | C•G → G•C | nein |
| AYBE | A•T → C•G | nein |
| Prime-Editor | beliebig, auch Insertion und Deletion | nein |
| Cas9-Nuklease | zufällige Indels | ja |

Dazu die Cas9-Varianten NGG, NG und SpRY: Manche Zielstellen sind erst mit
gelockertem PAM erreichbar – zum Preis geringerer Effizienz und mehr
Off-Target-Aktivität. Base-Editoren arbeiten in einem Fenster von
Protospacer-Position 4 bis 8, mit positions- und sequenzabhängigen Effizienzen,
Bystander-Edits an Nachbarbasen und gelegentlichen Off-Targets.

**Auswertung** vom Genotyp über das Protein bis zum Krankheitsbild: stumme,
Missense-, Nonsense- und Rasterschubmutationen, Spleißstellen, regulatorische
Positionen und Varianten unklarer Signifikanz.

## Die Fälle

| Fall | Gen | Aufgabe |
| --- | --- | --- |
| Sichelzellanämie | HBB | p.Glu6Val über den Gegenstrang zu Hb G-Makassar umschreiben |
| β-Thalassämie | HBB | Stoppcodon β39 zurückschreiben |
| Wie eine Krankheit entsteht | HBB | Mit dem CBE genau diese Mutation erzeugen |
| Mukoviszidose W1282X | CFTR | Stoppcodon TGA wieder zu TGG machen |
| ΔF508 | CFTR | Zeigt, warum Base-Editing hier scheitert – Prime-Editing muss ran |
| Progerie | LMNA | Die stumme Mutation c.1824C>T, die trotzdem tötet |
| PCSK9 | PCSK9 | Einen gesunden Menschen „verbessern" – mit Ethikfrage |
| Laktasepersistenz | MCM6 | Eine Base in nicht-kodierender DNA, 7 500 Jahre Evolution |
| Freies Labor | Reportergen | Alles ausprobieren, ohne Folgen |

## Aufbau

```
app/
  page.tsx                       Route
  layout.tsx                     Fonts, Metadata, Viewport
components/bio/
  BaseEditorLab.tsx              Zustand, Layout, Aktionen
  HelixCanvas.tsx                3D-Doppelhelix, Enzymkomplex, Replikation (three.js)
  SequenceTrack.tsx              Sequenzleiste mit Protein-Spur
  ui.tsx                         Gemeinsame Bausteine
  panels/                        Fallakte, Werkzeugkasten, Befund, Protokoll, Wissen
lib/bio/
  genetics.ts                    Genetischer Code, Komplementierung, Proteinvergleich
  editors.ts                     Base-/Prime-Editoren, PAM-Varianten, Guide-Suche, Effizienzen
  phenotype.ts                   Auswertung Genotyp → Krankheitsbild
  cases.ts                       Gene und Fälle
  lab.ts                         Zielprüfung, Guide-Bewertung
  colors.ts                      Farbschema der vier Basen
standalone/                      Einstiegspunkt und Stile für den Einzeldatei-Build
scripts/
  validate-bio.ts                Prüft Leseraster, Proteine und Erreichbarkeit der Zielstellen
  build-standalone.mjs           Bündelt die App in eine einzelne HTML-Datei
```

Die 3D-Ansicht ist direkt mit three.js gebaut, ohne Wrapper-Bibliothek. Alle
Meshes werden einmal angelegt und danach nur noch bewegt und umgefärbt – beim
Blättern durch die Sequenz entsteht keine Geometrie-Neuberechnung.

## Einzelne HTML-Datei

```bash
npm run build:standalone   # dist/base-editing-labor.html
```

Bündelt die komplette App in eine Datei von rund 870 kB – React, three.js und
alle Fälle inbegriffen. Sie läuft in jedem Browser per Doppelklick: ohne Server,
ohne Installation, ohne Netzverbindung. Praktisch zum Weitergeben oder zum
Öffnen auf einem Tablet.

Statt der Schriften aus `next/font` benutzt dieser Build die Systemschriften,
damit die Datei nichts nachladen muss.

## Prüfen

```bash
npm run verify:bio   # Leseraster, β-Globin-Protein, erreichbare Zielstellen, Startzustände
npm run lint
npm run build
```

## Zur Datengrundlage

Varianten, Positionen und Mechanismen sind real. Die Sequenzen sind Ausschnitte:
beim HBB-Gen der echte Abschnitt (5'-UTR plus Codon 1–68, gegen das bekannte
β-Globin-Protein verifiziert), bei den übrigen Genen didaktisch vereinfachte
Lehrsequenzen, damit alle Zielstellen mit handhabbarer Sequenzlänge erreichbar
bleiben. Jedes Gen weist seine Herkunft in der App aus.

Die App ist ein Lernwerkzeug, keine medizinische oder wissenschaftliche
Fachanwendung.
