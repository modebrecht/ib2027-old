# TK2 Analyze Worksheet — 2026-08-26

## Aktueller Entscheid

- **A1–A6 sind jederzeit frei anwählbar.**
- **A1 intern:** Q1 → Q2 → Q3 als Progression.
- **A2 intern:** Q4 → Q5 → Q6 als Progression.
- **A3 ist keine Quest und keine Praxis-/Timer-Aufgabe mehr.**
- A3 besteht aus Merkblatt-Download + persönlicher Auswahl von drei Tastenkürzeln mit je einer kurzen Begründung.

## Heute geprüft / korrigiert

| Bereich | Ergebnis |
|---|---|
| A1 Animationen | Shortcut-Semantik geprüft/korrigiert |
| A2 Navigation | Link zu A3 korrigiert |
| A1–A6 Mobile | Header/Abstände verbessert |
| Kurszugang | A1–A6 offen; interne Quest-Progression in A1/A2 bleibt erhalten |
| A2 Fluganimation | Sonderzeichen-Ziel korrigiert |
| A1/A2 Tastendruck | Chord sichtbar 1000 ms gehalten |
| A1 Ctrl+C/X | fliegender Text landet korrekt in Zwischenablage |
| A1 Statusbox | statisch über Zwischenablage zentriert |
| A1 Clipboard | nur C/X/V/Shift+V; bei Z/Y/S/A entfernt |
| A1–A6 Header | einheitlich `← Zurück zur Übersicht` |
| A3 | Pizza/Timer entfernt; Merkblatt + „Meine drei Kürzel“ |
| A3 Progress | nur neues Schema 2 zählt; alte Pizza-Abschlüsse werden bewusst ignoriert |
| A3 PDF | zeigt die drei gewählten Kürzel und die drei „weil“-Begründungen |
| Root B24/B25 Filter | Single-Ansicht zentriert, Breite wie 2er-Ansicht; Mobile 100 % |

## JS Cleanup / Progress-Logik

| Datei | Status | Aufgabe |
|---|---|---|
| `courseAccess.js` | **aktiv / zentral** | 1000-ms-Key-Hold + offene A1–A6-Karten. Kein A3-Legacy-Migrationscode. |
| `../tk/xp.js` | **aktiv / shared** | XP, Scores und interne Quest-Freischaltung für A1/A2; kein A3-Boss-Timer-XP-Sonderfall mehr. |
| `a1-app.js` | **aktiv** | Q1 → Q2 → Q3. |
| `a2-app.js` | **aktiv** | Q4 → Q5 → Q6; A2 selbst bleibt offen. |
| `a3-app.js` | **aktiv** | Merkblatt-Download + drei unterschiedliche Kürzel + drei Begründungen + XP-Einmalvergabe. |
| `a3-docx.js` | **gelöscht** | Alte Pizza-DOCX-Datei nicht mehr benötigt. |
| `pdf.js` | **aktiv** | Lädt `courseAccess.js` + `pdf-base.js`. |
| `pdf-base.js` | **aktiv** | A3 wird nur über das neue Schema 2 exportiert. |
| `utilityScenes.js` | **aktiv** | Loader für Utility-Scenes; nicht obsolet. |

## A3 Progress-Schema 2

Der bestehende LocalStorage-Key `tk_a3_progress_v1` bleibt technisch erhalten, aber **alte Inhalte werden nicht als Abschluss übernommen**.

Neues A3 zählt nur mit `schemaVersion: 2`.

- `downloaded`: Merkblatt wurde angeklickt/heruntergeladen.
- `choices`: genau drei Einträge mit `shortcut` und `reason`.
- Die drei Kürzel müssen unterschiedlich sein.
- Jede Begründung muss ausgefüllt sein.
- `completed`: wird erst gesetzt, wenn Download + alle drei Zeilen vollständig sind.
- `rewarded`: verhindert mehrfache XP-Vergabe.
- Alte `first`, `second` oder historische `q7`-Pizza-Werte zählen **nicht** als A3-Abschluss.

## Deployment / Branches

- `dev` = Entwicklung, kein Produktions-Deploy.
- `render` = OnRender/Staging (`ib2026.onrender.com`), **nicht Vercel**.
- `main` = Vercel/Production.
- Promotion bewusst: `dev → render → main`; kein automatisches Überspringen.

## QA

- A1–A6 müssen von der Übersicht jederzeit anklickbar bleiben.
- Q2/Q3 und Q5/Q6 müssen innerhalb ihrer Arbeitsblätter weiterhin von den vorherigen Quests abhängen.
- A3 darf keinerlei Voraussetzung aus A2 haben.
- A3 gilt erst als abgeschlossen, wenn das Merkblatt heruntergeladen wurde und drei unterschiedliche Tastenkürzel mit je einer Begründung gespeichert sind.
- Alte Pizza-Daten dürfen A3 weder abschliessen noch im A3-PDF erscheinen.
- A3 vergibt die Abschluss-XP höchstens einmal.
