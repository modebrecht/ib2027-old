# TK2 Analyze Worksheet — 2026-08-21

## Heute geprüft / korrigiert

| Bereich | Ergebnis |
|---|---|
| A1 Animationen | Shortcut-Semantik geprüft/korrigiert |
| A2 Navigation | Link zu A3 korrigiert |
| A1–A6 Mobile | Header/Abstände verbessert |
| Kurszugang | A1–A6 bewusst offen gehalten |
| A2 Fluganimation | Sonderzeichen-Ziel korrigiert |
| A1/A2 Tastendruck | Chord sichtbar 1000 ms gehalten |
| A1 Ctrl+C/X | fliegender Text landet korrekt in Zwischenablage |
| A1 Statusbox | statisch über Zwischenablage zentriert |
| A1 Clipboard | nur C/X/V/Shift+V; bei Z/Y/S/A entfernt |
| A1–A6 Header | einheitlich `← Zurück zur Übersicht` |
| Root B24/B25 Filter | Single-Ansicht zentriert, Breite wie 2er-Ansicht; Mobile 100 % |

## JS Cleanup / Unlock-Logik

| Datei | Status | Cleanup |
|---|---|---|
| `courseAccess.js` | **aktiv / zentral** | 1000-ms-Key-Hold + bewusst offener Kurs. Doppelter A2/A3-DOM-Lock-Hack entfernt. |
| `../tk/xp.js` | **aktiv / shared** | XP, Scores und Shared-Funktionen weiterhin benötigt. `isQuestUnlocked()` wird in `tk2` bewusst überschrieben. |
| `a1-app.js` | **aktiv** | Quest-Logik bleibt unverändert. |
| `a2-app.js` | **aktiv** | Quest-Logik bleibt unverändert. |
| `a3-app.js` | **aktiv** | Praxis-/Timer-Logik bleibt unverändert. |
| `pdf.js` | **aktiv** | Lädt `courseAccess.js` + `pdf-base.js`; aktuell beibehalten. |
| `utilityScenes.js` | **aktiv** | Loader für Utility-Scenes; nicht obsolet. |

**Aktuell komplett löschbare JS-Datei wegen Unlock: keine.**

Entscheid: kein Ausbau des 1000-ms-Holds in mehrere Scene-Dateien. Zentrale Lösung beibehalten und nur nachweislich redundanten Code entfernen.

## Deployment / Branches

- `dev` = Entwicklung, kein Produktions-Deploy.
- `render` = OnRender/Staging (`ib2026.onrender.com`), **nicht Vercel**.
- `main` = Vercel/Production.
- Promotion bewusst: `dev → render → main`; kein automatisches Überspringen.

## QA

- A1 Textflüge code-seitig geprüft; kein weiterer fehlerhafter Flug gefunden.
- A1–A6 Header nach Änderung auf `dev` gegengeprüft.
- A2/A3 verwenden weiterhin `isQuestUnlocked()`; durch zentralen Override bleiben sie offen, daher ist der entfernte direkte DOM-Hack redundant.
- Browser-Visual-/Download-Test nicht vollständig durchgeführt.
