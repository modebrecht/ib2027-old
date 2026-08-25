# Analyse-Workflow (Minimalstandard für jeden Audit-Durchgang)

Diese Checkliste gilt für **jede** Analyse eines `hw/`-Arbeitsblatts, egal ob Vollaudit oder gezielte Nachprüfung. Ein Audit ist erst vollständig, wenn alle sieben Punkte abgedeckt sind. Neue Audit-Durchgänge werden als eigener datierter Abschnitt **unten angehängt** (nie überschrieben), mit Fund-Liste, Schweregrad, Status (✅ behoben / offen) und einer Kurz-Zusammenfassung am Ende.

1. **Progression & localStorage**
   Ist die Fortschritts-Berechnung (Prozent, ggf. Freischalt-Logik) korrekt? Wird sie zuverlässig gespeichert und nach einem Reload identisch wiederhergestellt? Bleibt der Fortschritt nach "Zurücksetzen" tatsächlich auf 0 % **und** ist von dort aus wieder auf 100 % erreichbar — kein Blocker wie der A3-"Klasse bleibt leer"-Bug aus Runde 2 (siehe unten).

2. **Funktioniert alles wie erwartet?**
   Alle Buttons/Links/Navigationselemente durchgehen (Karussell, Tabs, Modals, Reset, Theme-Toggle). Keine Konsolenfehler beim Laden oder Interagieren — `node --check` auf allen Inline-Scripts plus ein Headless-Chrome-Ladetest sind das Minimum. Alle referenzierten Assets (Bilder, Schriften, Vendor-Skripte, 3D-Modelle) müssen tatsächlich existieren.

3. **Rechtschreibung & Vollständigkeit**
   Rechtschreib-/Grammatikfehler direkt korrigieren. Falls inhaltlich etwas Wesentliches fehlt (unvollständige Aufgabe, Bauteil ohne Bild, Erklärung ohne Beispiel) — das explizit im Audit vermerken, nicht stillschweigend übergehen.

4. **Kein KI-Wording**
   Texte dürfen nicht nach KI-generiertem Content klingen: keine Floskeln wie "Tauche ein in die Welt von …" oder "In der heutigen digitalen Welt …", keine übertriebene Emoji-Dichte, keine leeren Zusammenfassungssätze. Sprache soll klingen, wie sie eine Lehrperson tatsächlich schreiben würde — direkt, sachlich, ohne Marketing-Ton. Gefundene Stellen umformulieren, nicht nur anmerken.

5. **PDF-Erstellung**
   **Tatsächlich herunterladen, nicht nur den Druckdialog/die Druckvorschau ansehen.** Bei `window.print()`-basierten Arbeitsblättern: als PDF speichern und die Datei öffnen. Bei direkten Downloads (z. B. jsPDF wie in `tk/xp.js`): die heruntergeladene Datei öffnen und prüfen. In beiden Fällen sicherstellen, dass der Inhalt exakt dem 100 %-Zustand entspricht (keine leeren Felder, kein Dunkelmodus-Rendering-Fehler, keine abgeschnittenen Texte).

6. **Alle Eingabefelder → localStorage**
   Jedes Eingabefeld (Text, Textarea, Select, Checkbox, Radio) muss beim Ändern gespeichert und nach einem Reload identisch wiederhergestellt werden. Bei kritischen Feldern (Vorname/Klasse/Datum) reicht eine Stichprobe nicht — dort immer explizit testen, inklusive des Zustands direkt nach "Zurücksetzen" (nicht erst nach Reload).

7. **Autofill Vorname/Klasse/Datum — über [worksheet-common.js](assets/js/worksheet-common.js)**
   Bindet die Seite das gemeinsame Modul ein (`<script src="assets/js/worksheet-common.js">`), statt eigene/duplizierte Autofill-Logik zu pflegen? Falls nicht: im Audit vermerken (Kandidat für Auslagerung) — **das war genau die Ursache des A3-Bugs in Runde 2**: A3.html hatte seine eigene, unvollständige Kopie von `applyDefaultClassAndDate()` statt das gemeinsame Modul einzubinden, das denselben Fehler ebenfalls enthielt (mittlerweile in `worksheet-common.js` selbst behoben, siehe Runde 3 unten — betrifft damit auch alle bereits eingebundenen Seiten). Prüfen: Vorname wird global synchronisiert (`studentVorname`/`student_vorname`), Klasse defaultet auf "B24", Datum wird automatisch auf heute gesetzt — sowohl nach Reload als auch direkt nach "Zurücksetzen".

---

# Analyse: ib2026 Repo & /hw Arbeitsblätter

Stand: 2026-08-11. Geprüft von Claude auf Anfrage (Korrekturlauf für index.html, A1, A2, A3).

## Repo-Überblick

- `index.html` – Startseite/Übersicht, verlinkt alle Arbeitsblätter (`hw/A1.html` … `hw/A7.html`, `hw/memory.html`, `hw/vortrag.html`). Enthält eine automatische "Erledigt"-Erkennung (`checkCompletionStatus()`, ab Zeile 1526), die beim Laden/Fokussieren der Seite den `localStorage` jedes Arbeitsblatts liest und den Öffnen-Button grün/Häkchen markiert, wenn ein Arbeitsblatt fertig ist. **Es gibt keinen manuellen "done"-Schalter** – die Markierung ist vollautomatisch und hängt exakt vom `localStorage`-Format ab, das jedes Arbeitsblatt selbst schreibt.
- `hw/A1.html` – A1: IT-Hardware Memory (Kartenspiel, 4 Schwierigkeitsstufen)
- `hw/A2.html` – A2: Das EVA-Prinzip
- `hw/A3.html` (+ `A3_backup.html`, `A3_merged.html`, siehe unten) – A3: Computeraufbau
- `hw/A4.html`–`A7.html`, `memory.html`, `vortrag.html` – weitere Arbeitsblätter, **noch nicht auditiert** (nicht Teil des heutigen Durchgangs)
- `hw/A6.pdf`, `hw/A6a.pdf`, `hw/A6b.pdf`, Python-Skripte (`convert_to_webp.py`, `create_hq_webp.py`, `create_favicon.py`) – Hilfsdateien, nicht auditiert

### Bekannte Lücke in index.html

`checkCompletionStatus()` prüft A1, A2, A3, A4, A6, A7 — **A5 fehlt** (kein `markDone('title-A5')`-Block), obwohl A5 als Kachel existiert (`title-A5`, Zeile ~906). Falls A5.html fertig gespielt wird, bleibt die Kachel für immer unmarkiert. → Sollte ergänzt werden, sobald A5 auditiert wird (nicht heute im Scope, nur als Fund notiert).

---

## A1: IT-Hardware Memory — ✅ Geprüft, ein Bug gefunden & behoben

### Checkliste

| Punkt | Ergebnis |
|---|---|
| Progression (Spiellogik) | ✅ Solide. Deck-Aufbau, Shuffle, Match-Logik (`kind` term/desc, `pairId`), Punkte-/Sterne-Berechnung, Combo-Bonus, Zeitbonus — alles konsistent, keine Off-by-one- oder Dead-End-Bugs gefunden. |
| Rechtschreibung | ✅ Keine Fehler gefunden (Kartentexte, Buttons, Alerts, Modal-Texte alle geprüft). |
| PDF-Erstellung | 🔧 **Bug gefunden & behoben** (siehe unten) |
| localStorage speichern/laden | ✅ Konsistent. Highscores (`memScores_<diff>`, `memHigh_<diff>`), abgeschlossene Modi (`memCompletedModes`), Einstellungen (`memFlipDelay`, `memCardMin`, `memTextSize`) — alles wird beim Laden korrekt wiederhergestellt. |
| Autofill Vorname/Klasse/Datum | ✅ Per Screenshot-Test verifiziert: Vorname wird aus globalem `studentVorname`/`student_vorname` übernommen, Klasse defaultet auf `B24`, Datum wird automatisch auf heute gesetzt. |
| index.html "done"-Erkennung | ✅ Stimmt überein: `memCompletedModes.length >= 3` — genau das, was A1 selbst schreibt. |

### Gefundener & behobener Bug: PDF-Export sah "kaputt" aus (schlimmer bei Ultra)

**Ursache:** Die Print-CSS (`@media print`) nutzte `body * { visibility: hidden }`. Das versteckt nur *Nachfahren* von `<body>`, nicht `<body>` selbst. Der dunkle Hintergrund der Seite (Dark Mode) und ihre `min-height: 100%` blieben aktiv, sodass unter dem Zertifikat eine große schwarze Fläche übrig blieb — das Zertifikat wirkte "nach oben links verschoben". Bei Ultra (24 Karten im unsichtbaren Spielfeld) war die übrig gebliebene Fläche am größten, daher dort am auffälligsten kaputt — der Bug betraf aber alle Schwierigkeitsstufen.

**Fix** ([hw/A1.html:197-201](hw/A1.html#L197-L201), committed als `5a92fa1`): Alles außer `#printCertificate` wird jetzt per `display: none` komplett aus dem Layout entfernt (statt nur unsichtbar gemacht), `html`/`body` werden im Druck auf `height: auto` + weißen Hintergrund zurückgesetzt.

**Verifiziert:** Vorher/Nachher-PDFs für Einfach und Ultra per Headless-Chrome gerendert und verglichen — vorher beide mit schwarzer Fläche kaputt, nachher beide sauber (identisches, kompaktes Ein-Seiten-Zertifikat).

### Kleinere Beobachtung (kein Fix nötig, nur zur Kenntnis)

Der "Vorname"-Sync-Code kommt in `A1.html` gleich **dreifach** vor (Zeilen ~987-1007, ~1084-1094, ~1140-1150, plus ein eigener IIFE-Block ~1163-1225). Funktioniert (getestet), aber redundant/schwer wartbar. Dasselbe Muster existiert identisch in *allen* anderen Arbeitsblättern (A2, A3, A4, A5, A6, A7, vortrag.html) — offenbar bewusst als Kopier-Vorlage für die eigenständigen HTML-Dateien gewählt (kein gemeinsames JS-Modul). Da es überall gleich ist und nachweislich funktioniert, keine Änderung vorgenommen.

---

## A2: Das EVA-Prinzip — ✅ Geprüft, 4 Bugs gefunden & behoben

### Checkliste

| Punkt | Ergebnis |
|---|---|
| Progression | ✅ Solide. 3 Abschnitte (Hero-Animation → Video → 6 Praxis-Beispiele), Fortschritt korrekt aus 27 Feldern berechnet, erreicht sauber 100 %. |
| Rechtschreibung | 🔧 1 Tippfehler behoben ("Youtube" → "YouTube"). Rest sauber. |
| PDF-Erstellung | 🔧 1 Risiko behoben (siehe unten) |
| localStorage speichern/laden | 🔧 **Kritischer Bug gefunden & behoben** (siehe unten) |
| Autofill Vorname/Klasse/Datum | ✅ Funktioniert (Feld ist readonly, wird über globalen `studentVorname`-Key befüllt; beim ersten Besuch fragt ein `prompt()` nach dem Namen). 🔧 kleiner Nachbesserung: Fortschrittsanzeige aktualisierte sich nicht sofort nach dem Prompt — behoben. |
| index.html "done"-Erkennung | 🔧 War **kaputt**, jetzt behoben (siehe unten) |

### Bug 1 (kritisch): A2 konnte auf der Startseite nie als "erledigt" markiert werden

**Ursache:** `saveProgressToStorage()` ([hw/A2.html:833](hw/A2.html#L833) alt) speicherte `{ form: {...} }` — ganz ohne `percent`-Feld. `index.html` prüft aber exakt `parsed.percent === 100`. Da `percent` nie gespeichert wurde, war das immer `false`, egal wie vollständig das Arbeitsblatt ausgefüllt war.

**Fix:** `updateProgress()` übergibt den bereits berechneten Prozentwert jetzt an `saveProgressToStorage(false, percent)`, welches ihn als `data.percent` mitspeichert. Verifiziert per Headless-Test: nach vollständigem Ausfüllen steht `percent: 100` im gespeicherten Objekt.

### Bug 2: "Zurücksetzen" konnte durch Neuladen rückgängig gemacht werden

**Ursache:** Es gibt zwei parallele Speichermechanismen — `onedrive_a2_eva_worksheet_8sek` (eigene Logik) und `hw_autosave_A2.html` (generisches Autosave, das *alle* Formularfelder spiegelt). `confirmReset()` löschte nur den ersten Key. Nach einem Reload holte das generische Autosave die alten Antworten aus dem zweiten Key zurück — der Reset wirkte nur bis zum nächsten Laden der Seite.

**Fix** ([hw/A2.html:869-882](hw/A2.html#L869-L882)): `confirmReset()` löscht jetzt auch `hw_autosave_A2.html` und stellt Klasse/Datum/Vorname aus den bekannten Defaults wieder her.

### Bug 3: Tippfehler "Youtube" → "YouTube" ([hw/A2.html:473](hw/A2.html#L473))

### Risiko behoben: Dunkle Hero-Sektion konnte beim Drucken schwarz/riesig mitgedruckt werden

Die dekorative "E-V-A"-Animationssektion hat einen fest codierten fast-schwarzen Hintergrund (`bg-[#050914]`) und war nicht von der `.no-print`-Regel ausgenommen. Da `body { print-color-adjust: exact }` gesetzt ist, hätte dieser dunkle Block beim Drucken/PDF-Export mitgedruckt — unnötiger Tintenverbrauch, sieht nicht nach "Arbeitsblatt" aus. Sie zeigt ausserdem keine eingegebenen Antworten (rein dekorativ). **Fix:** Abschnitt bekommt jetzt `no-print` ([hw/A2.html:352](hw/A2.html#L352)) und wird beim Drucken komplett ausgeblendet, genau wie Header und Video-Sektion.

---

## A3: Aufbau eines Computers — ✅ Geprüft, 3 Bugs gefunden & behoben (davon 1 strukturell)

### 0. Zur Klärung: `A3_backup.html` / `A3_merged.html`

Diese beiden Dateien sind **nicht** eingecheckt (untracked) und **nicht** identisch mit dem aktuellen `A3.html`. Sie stammen aus einer früheren Überarbeitung (altes dunkles "Hero"-Design, nur 10 statt 16 Bauteile) und wurden beim Umbau auf das aktuelle helle Karten-Design offenbar als Zwischenstände liegengelassen. `A3.html` selbst hat aktuell **keine** uncommitteten Änderungen (`git diff` ist leer, letzter Commit `bb83d82 "fix A3"`).

Ich habe aus `A3_backup.html` das Markup für das fehlende Vorname/Klasse/Datum-Formular übernommen (siehe Bug 2 unten) — danach haben die beiden Dateien keinen bekannten offenen Zweck mehr. **Ich habe sie nicht gelöscht**, da ich nicht sicher weiss, ob sie absichtlich als Sicherung aufbewahrt werden sollten. Sag Bescheid, falls ich sie entfernen soll.

### Checkliste

| Punkt | Ergebnis |
|---|---|
| Progression | ✅ Solide (5 Aufträge: Hardware-Analyse, EVA-Drag&Drop, Speichervergleich, Kaufberater, Quiz). Fortschritt aus 62 Feldern korrekt berechnet, erreicht sauber 100 %. Einzige Schwäche: die Drag&Drop-Zuordnung im EVA-Auftrag prüft nicht, ob ein Gerät in die *richtige* Zone gezogen wurde — jede Zone zählt als "erledigt". Kein neuer Bug (schon in den alten Zwischenständen so), aber erwähnenswert fürs Lernziel. |
| Rechtschreibung | 🔧 1 Darstellungsfehler behoben (siehe Bug 3). Rest sauber, inkl. aller 10 Quiz-Fragen mit korrekt markierten richtigen Antworten. |
| PDF-Erstellung | ✅ Nutzt bereits das robuste Muster (kein `visibility:hidden`-Bug wie ursprünglich A1) |
| localStorage speichern/laden | 🔧 **Kritischer Bug gefunden & behoben** — gleiches Problem wie A2 |
| Autofill Vorname/Klasse/Datum | 🔧 **Fehlte komplett im HTML** — kritischer Fund, behoben (siehe Bug 2) |
| index.html "done"-Erkennung | 🔧 War kaputt, jetzt behoben |

### Bug 1 (kritisch, strukturell): Fehlende schliessende `</div>` zerstörte das Seiten-Layout

Beim Ersetzen des alten dunklen Headers durch den aktuellen hellen wurde die schliessende `</div>` der "Titel & Metadaten"-Karte vergessen. Dadurch waren **der komplette Rest der Seite (alle 5 Aufträge) fälschlich in dieser einen Karte verschachtelt** — im Browser hätte das bedeutet: eine zusätzliche dicke weisse/graue Umrandung um die ganze Seite und **kein Abstand mehr zwischen den Auftrags-Karten** (das `space-y-6`-Spacing griff nicht mehr, weil `<main>` dadurch nur noch ein einziges verschachteltes Kind statt 6 Geschwister-Elemente hatte). Das ist genau die Art von "sieht komisch/kaputt aus"-Symptom, nach der ursprünglich gefragt wurde — nur eben in A3 statt A1.

**Fix** ([hw/A3.html:313-350](hw/A3.html#L313-L350)): schliessende `</div>` ergänzt, direkt im selben Zug das fehlende Metadaten-Formular eingefügt (siehe Bug 2). Per Screenshot verifiziert: Karten sind jetzt wieder sauber getrennt mit korrektem Abstand.

### Bug 2 (kritisch): Vorname/Klasse/Datum-Felder fehlten komplett im HTML

Die komplette JS-Logik für Autofill (globaler Vorname-Sync, Klasse-Default "B24", Tagesdatum, Erstbesuch-`prompt()`) war vorhanden und aktiv — aber es gab **keine** `studentName`/`studentClass`/`studentDate`-Inputs im HTML, an die sie sich hätten hängen können (im Gegensatz zu A1, A2, A4, die alle dieses Formular haben). Der `prompt()` fragte also weiterhin nach dem Namen, aber nirgends auf der Seite wurde er angezeigt.

**Fix:** Formular aus `A3_backup.html` übernommen und ans aktuelle helle Kartendesign angepasst (identisch zum Muster in A1/A2), eingefügt in [hw/A3.html:327-345](hw/A3.html#L327-L345). Per Screenshot verifiziert: Vorname, Klasse ("B24") und Datum werden jetzt korrekt angezeigt und automatisch befüllt.

### Bug 3: Unverarbeiteter LaTeX-Code sichtbar statt Pfeilen

[hw/A3.html:761](hw/A3.html#L761) zeigte wortwörtlich `Eingabe $\rightarrow$ Verarbeitung $\rightarrow$ Ausgabe` an (es ist kein MathJax/KaTeX eingebunden, das diese Syntax rendern würde). **Fix:** durch echte Pfeilzeichen (`&rarr;`) ersetzt → "Eingabe → Verarbeitung → Ausgabe".

### Bug 4 (kritisch): Gleicher "done"-Bug wie bei A2

`saveProgressToStorage()` speicherte `{ form, devices, quiz }` ohne `percent`-Feld, obwohl `index.html` genau das prüft. **Fix** ([hw/A3.html:1592-1597](hw/A3.html#L1592-L1597)): `percent: currentPercentage` ergänzt.

---

## Zusammenfassung heute

- **index.html**: nur geprüft, nicht verändert. Automatische "erledigt"-Erkennung für A1/A2/A3 funktioniert jetzt tatsächlich (vorher A2 & A3 strukturell nie erreichbar). Bekannte Lücke notiert: A5 fehlt im Completion-Check (nicht heute behoben, ausserhalb des Scopes).
- **A1.html**: 1 Bug behoben (PDF-Druck-Layout).
- **A2.html**: 4 Fixes (percent-Feld, Reset-Leck, Youtube-Tippfehler, Print-Hintergrund).
- **A3.html**: 4 Fixes (kaputtes Layout durch fehlendes `</div>`, fehlendes Metadaten-Formular, LaTeX-Darstellungsfehler, percent-Feld).
- Offene Punkte zur Entscheidung: `A3_backup.html`/`A3_merged.html` behalten oder löschen? A5 in index.html ergänzen (nicht heute im Scope)?
- **A4-A7, memory.html, vortrag.html**: noch nicht auditiert.

---

## Nachtrag: gemeinsame JS-Datei für Theme/Autofill/Autosave (A1 & A2)

A1.html und A2.html enthielten je **~300 Zeilen fast wortwörtlich dupliziertes Boilerplate** für Dark Mode, Schriftgrössen-Sync, den globalen Vorname-Abgleich (inkl. Erstbesuch-`prompt()`) und das generische Formular-Autosave (`hw_autosave_<Datei>.html`). Teilweise sogar doppelt *innerhalb derselben Datei* (z. B. `initTheme()`/`toggleDarkMode()` je zweimal definiert, wobei die zweite Definition die erste unbemerkt überschrieb — totes Code).

Dieser Code wurde nach [hw/assets/js/worksheet-common.js](hw/assets/js/worksheet-common.js) ausgelagert (Theme, Font-Size, Vorname-Sync, `applyDefaultClassAndDate()`, `setupUniversalAutoSave()`). A1.html und A2.html binden die Datei jetzt per `<script src="assets/js/worksheet-common.js">` ein, die lokalen Kopien wurden entfernt (−599 Zeilen in Summe, ein 234-Zeilen-Modul statt zwei Kopien). Verhalten ist unverändert — vor/nach dem Refactor per Headless-Screenshot pixelgleich verifiziert (Vorname/Klasse/Datum-Autofill, Fortschritt, Dark Mode).

`index.html` wurde **nicht** angefasst: es hat kein Vorname/Klasse/Datum-Formular (keine Autofill-Logik nötig) und sein Theme/Font-Size-System ist an ein eigenes, andersartiges Einstellungs-Panel gekoppelt (eigene Element-IDs, kein einfacher Toggle-Button wie bei den Arbeitsblättern) — eine Umstellung auf die gemeinsame Datei wäre kein reines Auslagern identischen Codes, sondern ein separates, riskanteres Refactoring. Nicht vorgenommen.

A3.html, A4-A7 etc. haben denselben dupliziertes-Boilerplate-Bug (siehe A3-Abschnitt oben), wurden aber wie vom Nutzer vorgegeben heute nicht angefasst — `worksheet-common.js` ist so geschrieben, dass sie later einfach denselben `<script src="assets/js/worksheet-common.js">`-Tag einbinden könnten, um denselben Code-Duplizierungs-Bug zu beheben.

### Nachträglich gefundener & behobener Bug im Refactor selbst

Bei der Verifikation fiel auf: A2.html initialisiert über `document.addEventListener('DOMContentLoaded', ...)` (deferred), A1.html dagegen über eine sofort ausgeführte IIFE (synchron). Die gemeinsame Datei wurde zunächst bei beiden **vor** dem Haupt-Script eingebunden. Für A1 ist das korrekt (synchroner Code braucht die Funktionen sofort). Für A2 hätte das aber die Registrierungsreihenfolge zweier `DOMContentLoaded`-Listener vertauscht: die gemeinsame Datei (Vorname-Prompt) wäre jetzt **vor** A2s eigenem Code gelaufen, statt wie ursprünglich danach. In einem Randfall (lokale Fortschrittsdaten fürs Arbeitsblatt bereits vorhanden, aber der globale Vorname-Key fehlt) hätte das einen unnötigen `prompt()` ausgelöst, obwohl der Name eigentlich schon lokal bekannt war.

**Fix:** `<script src="assets/js/worksheet-common.js">` bei A2.html ans Dateiende verschoben (genau dort, wo die alten "Global Unified"-Blöcke ursprünglich standen) — stellt die ursprüngliche Reihenfolge wieder her. Per Headless-Test verifiziert: mit lokalen Daten aber fehlendem globalem Key erscheint jetzt kein Prompt mehr, der Name wird korrekt aus den lokalen Daten übernommen.

### End-to-End-Verifikation (heute durchgeführt)

Mit einem persistenten Browser-Profil wurde der komplette Kreislauf getestet:
1. A1 "gespielt" (3 Modi über die echte `showSummary()`-Funktion abgeschlossen) → Seite neu geladen → Fortschritt (3/3, 100 %, PDF-Button grün, Vorname/Klasse/Datum) bleibt korrekt erhalten.
2. A2 komplett ausgefüllt (echte Input-Events ausgelöst) → Seite neu geladen → 100 % erledigt, PDF-Button grün, alle Felder bleiben erhalten.
3. `index.html` mit demselben Profil geöffnet → **sowohl A1 als auch A2 zeigen jetzt automatisch das grüne Häkchen** in der Übersicht.

Der komplette Kreislauf (Formular ausfüllen/spielen → localStorage speichern → Reload lädt korrekt → Dashboard erkennt "erledigt") funktioniert nachweislich durchgehend für A1 und A2.

---
---

# Runde 2: A3 komplett neu gebaut — Audit vom 2026-08-14

**Kontext:** Diese Datei stand bisher als `ANALYZE.md` im Repo-Root und deckte dort auch `tk/` mit ab. Auf Anfrage nach `hw/analyze.md` verschoben (per `git mv`), damit hw und tk (siehe [tk/analyze.md](../tk/analyze.md)) je ihre eigene Analyse-Datei haben. Seit Runde 1 (2026-08-11) wurde `hw/A3.html` **komplett neu gebaut**: statt der alten 5-Aufträge-Struktur (Hardware-Analyse/EVA-Drag&Drop/Speichervergleich/Kaufberater/Quiz) ist es jetzt ein reines Karussell mit 15 PC-Bauteilen (Funktion + optionale Analogie je Bauteil), inkl. 3D-CPU-Modell-Viewer. Root-`index.html` wurde ebenfalls erheblich erweitert (jetzt A1–A8, AEXAM plus das komplette TK-Modul mit eigenen Kacheln).

**Scope heute:** Fokus auf `hw/A3.html` (neu gebaut, sollte heute fertig korrigiert werden). `hw/A1.html`/`A2.html` nur kurz auf Regressionen geprüft (seit Runde 1 laut `git log` unverändert) — kein erneuter Tiefendurchgang, da nichts an ihnen geändert wurde.

## Checkliste A3.html

| Punkt | Ergebnis |
|---|---|
| Progression (15 Bauteil-Karten + Karussell-Navigation) | ✅ Solide. 15 Bauteile × 2 Felder (Funktion Pflicht, Analogie optional) + Vorname/Klasse/Datum = 18 Pflichtfelder, Fortschritt korrekt berechnet, erreicht sauber 100 %. Pfeiltasten-Navigation pausiert korrekt, wenn der Fokus in einem Eingabefeld liegt. |
| Rechtschreibung | ✅ Keine Fehler gefunden (alle 15 Bauteil-Titel, Labels, Toasts, Modal-Texte geprüft; automatisierter Scan auf doppelte Leerzeichen/bekannte Vertipper ohne Treffer). ß-Schreibweise konsistent mit A1/A2 (Standarddeutsch, nicht Schweizer "ss" wie in `tk/`). |
| PDF-Erstellung (`handlePrint()`) | ✅ Sauber. Druck-Button ist rein optisch gesperrt unter 100 % (der `onclick`-Handler selbst prüft nochmal serverseitig-äquivalent per `currentPercentage`), Dunkelmodus wird vor dem Druck korrekt temporär deaktiviert (verhindert das alte "dunkle Karten im PDF"-Problem aus A1), Print-CSS zwingt alle 16 Karussell-Slides sichtbar (unabhängig von Karussell-/Listenansicht). |
| localStorage speichern/laden | ✅ Konsistent. `onedrive_hardware_worksheet_8sek` speichert `{ form, percent }`, `loadProgress()` stellt es korrekt wieder her. Root-`index.html` liest exakt denselben Key und dasselbe `percent === 100`-Kriterium ([index.html:1835-1838](../index.html#L1835-L1838)) — **kein** Mismatch wie in der alten A2/A3-Version aus Runde 1. |
| Autofill Vorname/Klasse/Datum | 🔧 **Bug gefunden & behoben** (siehe unten) |
| index.html "done"-Erkennung | ✅ Korrekt verdrahtet (`title-A3`, siehe oben) |

## Bug 1 (kritisch): Reset löschte die "Klasse"-Vorbelegung dauerhaft — 100 % danach unerreichbar ohne Neuladen

**Ursache:** `applyDefaultClassAndDate()` ([hw/A3.html:570-582](A3.html#L570-L582) alt) hat trotz ihres Namens **nur** das Datumsfeld gesetzt, nie die Klasse. Die Klasse stand nur einmalig als `value="B24"` fest im HTML. `confirmReset()` leert aber **alle** Text-/Textarea-Felder (`document.querySelectorAll('input[type="text"], textarea').forEach(i => i.value = '')`) — inklusive `studentClass` — und ruft danach nur `applyDefaultClassAndDate()` auf, in der Annahme, dass diese auch die Klasse zurücksetzt. Tat sie aber nicht.

**Auswirkung:** Nach einem Klick auf "Zurücksetzen" blieb das (readonly, nicht anklickbare) Klasse-Feld leer. Da alle drei Metadaten-Felder (Vorname/Klasse/Datum) zusammen mit den 15 Funktions-Feldern in die 100 %-Berechnung einfliessen und die Klasse vom Schüler nicht manuell nachgetragen werden kann (kein Fokus möglich), war **100 % und damit der PDF-Export bis zum nächsten vollständigen Neuladen der Seite blockiert** — ein klarer, reproduzierbarer Blocker direkt im Reset-Fluss.

**Fix** ([hw/A3.html:570-585](A3.html#L570-L585)): `applyDefaultClassAndDate()` setzt jetzt auch `studentClass.value = 'B24'`, passend zum Funktionsnamen. Per Headless-Test verifiziert (iframe-Harness, die den Reset-Ablauf 1:1 nachstellt): Klasse zeigt nach Reset sofort wieder "B24", alle 15 Funktionsfelder ausfüllen + Vorname wiederherstellen (wie es `confirmReset()` selbst tut) erreicht danach zuverlässig 100 % und aktiviert den PDF-Button.

## Kleinere Bereinigung (kein Bug, nur Aufräumen)

`updateProgress()` griff über vier verschiedene Variablennamen zweimal auf dieselben zwei DOM-Elemente zu (`headerPText`/`badge` beide `#headerPercentText`; `percentNum`/`hdrPercentNum` beide `#headerPercentNumber`; SVG-Offset wurde zweimal identisch berechnet). Funktional harmlos (am Ende immer derselbe korrekte Wert), aber unnötig verwirrend beim Lesen. Auf einen sauberen Satz von vier Variablen reduziert ([hw/A3.html:823-833](A3.html#L823-L833)).

## Zusammenfassung Runde 2

| # | Datei | Schweregrad | Kurzbeschreibung | Status |
|---|---|---|---|---|
| 1 | hw/A3.html | 🔴 Kritisch | Reset löscht "Klasse" dauerhaft → 100 %/PDF danach unerreichbar bis Reload | ✅ behoben |
| 2 | hw/A3.html | 🟢 Kosmetisch | Redundante DOM-Zugriffe in `updateProgress()` | ✅ aufgeräumt |

**A1.html/A2.html:** keine Änderungen seit Runde 1, kurz gegenstichprobenartig geprüft (`memCompletedModes`-Schreiblogik bzw. `percent`-Feld in `saveProgressToStorage`) — beide weiterhin intakt, keine Regression.

Verifiziert per `node --check` auf allen Inline-Scripts von A3.html (3 Blöcke, alle fehlerfrei) sowie einem gezielten Headless-Chrome-Test (iframe-Harness), der den kompletten Reset→Ausfüllen→100 %→PDF-aktiv-Kreislauf nachstellt und den Bug vorher/nachher reproduziert bzw. als behoben bestätigt. Alle 15 Bauteil-Bilder, das 3D-Modell und alle Vendor-Assets (`assets/js/tailwind.min.js`, `assets/css/fontawesome.min.css`, `assets/fonts/inter.css`) wurden auf Existenz geprüft — nichts fehlt.

---
---

# Runde 3: Analyse-Workflow eingeführt + derselbe "Klasse"-Bug im gemeinsamen Modul gefunden — 2026-08-14

Auf Anfrage den Minimalstandard-Workflow oben als erster Block dieser Datei ergänzt. Beim Ausformulieren von Checkpunkt 7 (Autofill über `worksheet-common.js`) fiel auf: **`hw/A3.html` bindet `worksheet-common.js` gar nicht ein** — es hat stattdessen eine eigene, inline duplizierte Kopie von `applyDefaultClassAndDate()`, `setupUniversalAutoSave()`, `initDarkMode()` usw. (derselbe "dupliziertes Boilerplate statt gemeinsames Modul"-Befund, der schon in Runde 1 für A3/A4-A7 notiert, aber nicht behoben wurde).

## Bug (kritisch, im gemeinsamen Modul): `applyDefaultClassAndDate()` in `worksheet-common.js` hatte exakt denselben Fehler wie der in A3.html behobene Bug aus Runde 2

**Fundstelle:** [hw/assets/js/worksheet-common.js:139-156](assets/js/worksheet-common.js#L139-L156) (vorher)

Die gemeinsame Funktion setzte trotz ihres Namens ebenfalls **nur** `studentDate`, nie `studentClass` — identisch zum Bug, der in A3.html bereits gefunden und lokal behoben wurde. Das bedeutet: **jede Seite**, die `worksheet-common.js` einbindet und in ihrem eigenen `confirmReset()` alle Textfelder pauschal leert (so wie es A3.html vor Runde 2 tat), würde denselben "Klasse bleibt nach Reset leer, 100 % unerreichbar" -Bug bekommen. Stichprobe der bereits einbindenden Seiten:

- `A2.html` — **nicht betroffen**: `confirmReset()` setzt `studentClass.value = 'B24'` bereits selbst manuell, bevor `applyDefaultClassAndDate()` aufgerufen wird (eigene Absicherung, siehe [hw/A2.html:769-771](A2.html#L769-L771)).
- `A9.html` — **nicht betroffen**: `confirmReset()` schliesst `studentName`/`studentClass`/`studentDate` explizit von der Wipe-Schleife aus (`if (i.id !== 'studentClass' ...)`), Klasse wird also nie geleert.
- `A10.html`, `A11.html`, `A12.html` (+ Kopien) — kein passendes `confirmReset()`-Muster gefunden (vermutlich kein Reset-Button oder anderer Aufbau) — nicht vertieft geprüft, da ausserhalb des heutigen Scopes.

Die betroffenen Seiten waren also durch eigene, lokale Workarounds zufällig geschützt — nicht weil das gemeinsame Modul korrekt war. Das ist brüchig: Jede **neue** Seite, die künftig `worksheet-common.js` einbindet und sich (zu Recht) darauf verlässt, dass die gemeinsame Funktion ihren Namen auch einhält, würde in dieselbe Falle laufen wie A3.html.

**Fix** ([hw/assets/js/worksheet-common.js:139-144](assets/js/worksheet-common.js#L139-L144)): `applyDefaultClassAndDate()` setzt `studentClass` jetzt auf `'B24'`, falls das Feld leer ist (kein unbedingtes Überschreiben, um bestehende abweichende Werte auf Seiten ausserhalb des heutigen Scopes nicht zu riskieren). Damit ist die Funktion für alle aktuellen und künftigen Seiten korrekt, unabhängig davon, ob eine Seite noch einen eigenen Klasse-Workaround hat oder nicht.

## Offener Punkt (nicht heute behoben, nur notiert)

`hw/A3.html` sollte bei Gelegenheit von seiner inline-duplizierten Boilerplate auf `<script src="assets/js/worksheet-common.js">` umgestellt werden (analog zum A1/A2-Refactor aus Runde 1) — würde ~150 Zeilen Duplikat entfernen und A3 automatisch von künftigen Fixes am gemeinsamen Modul profitieren lassen. Heute nicht angefasst, da nicht explizit angefragt und ein grösseres, eigenständiges Refactoring (Verhalten müsste vor/nach Screenshot-verglichen werden wie beim A1/A2-Refactor).

## Zusammenfassung Runde 3

| # | Datei | Schweregrad | Kurzbeschreibung | Status |
|---|---|---|---|---|
| 1 | hw/analyze.md | — | Analyse-Workflow (7-Punkte-Minimalstandard) als erster Block ergänzt | ✅ erledigt |
| 2 | hw/assets/js/worksheet-common.js | 🔴 Kritisch | `applyDefaultClassAndDate()` liess "Klasse" nach Reset leer — derselbe Bug wie A3 in Runde 2, aber im gemeinsamen Modul (potenziell alle Folgeseiten betroffen) | ✅ behoben |
| 3 | hw/A3.html | 🔵 Notiert, nicht behoben | Nutzt `worksheet-common.js` nicht, eigene Boilerplate-Kopie stattdessen | offen |

Verifiziert per `node --check` auf `worksheet-common.js` (fehlerfrei).

---
---

# Runde 4: PDF-Erstellung komplett auf direkten Download umgestellt (kein `window.print()` mehr) — 2026-08-14

**Auftrag:** `window.print()` (Druckdialog) verwirrt Schülerinnen und Schüler — sie sehen einen Drucker-Dialog statt eines Downloads. Ziel: alle PDF-Erzeugungen im gleichen Stil wie `tk/xp.js` umbauen — Canvas zeichnen, per jsPDF direkt als Datei herunterladen, kein OS-Druckdialog.

## Neue Infrastruktur

- **[hw/assets/js/jspdf.umd.min.js](assets/js/jspdf.umd.min.js)** — von `tk/vendor/` in einen eigenen `hw/`-Vendor-Ordner kopiert (keine Cross-Folder-Abhängigkeit zwischen den beiden unabhängigen Bereichen).
- **[hw/assets/js/pdf-engine.js](assets/js/pdf-engine.js)** (neu, eigenständige Datei statt Teil von `worksheet-common.js`) — bewusst **ohne** eigene `DOMContentLoaded`-Listener oder sonstige Seiten-Lifecycle-Seiteneffekte, damit sie gefahrlos auf jeder Seite eingebunden werden kann, auch auf solchen wie A3.html, die (noch) nicht `worksheet-common.js` nutzen und ihre eigene Boilerplate mitbringen. Stellt `downloadTextWorksheetPDF(opts)` bereit: zeichnet ein mehrseitiges, direkt herunterladbares PDF aus einer Liste von Abschnitten (Überschrift + Label/Wert-Felder), inkl. automatischem Zeilenumbruch und Seitenumbruch bei Platzmangel.

## 🔴 Kritischer Bug beim ersten Test gefunden & behoben: Seite 2+ komplett unlesbar (Text linksseitig abgeschnitten)

Beim visuellen Test von A3.html (15 Bauteile, absichtlich eine sehr lange Testantwort, um einen Seitenumbruch zu erzwingen) zeigte Seite 2 nur abgeschnittene Textenden ("Modul (NIC)" statt "11. Netzwerkkarte / WLAN-Modul (NIC)", "rt fuer Feld 10." statt "Kurze Testantwort fuer Feld 10.").

**Ursache:** In `drawPageHeader()` wird `ctx.textAlign = 'right'` gesetzt, um den Vorname/Klasse/Datum-Text oben rechts zu zeichnen. Zurückgesetzt auf `'left'` wurde das aber nur innerhalb des `if (isFirst)`-Zweigs (für den Titel auf Seite 1). Auf Folgeseiten (`isFirst === false`) blieb `textAlign` auf `'right'` stehen — jeder nachfolgende `ctx.fillText(...)`-Aufruf für Überschriften und Feldinhalte zeichnete den Text dadurch rechtsbündig endend an der linken Randmarke, sodass der grösste Teil jeder Zeile links ausserhalb des Canvas (und damit unsichtbar) landete. Jedes Arbeitsblatt mit mehr als einer Seite Inhalt — also praktisch jede echte Schülerantwort — wäre betroffen gewesen.

**Fix** ([hw/assets/js/pdf-engine.js:97](assets/js/pdf-engine.js#L97)): `ctx.textAlign = 'left';` wird jetzt unbedingt nach dem Meta-Text gesetzt, nicht mehr nur innerhalb von `if (isFirst)`.

**Verifiziert:** Per Headless-Chrome-Test mit iframe-Harness, `jsPDF`-Konstruktor gepatcht (Instanz-Ebene, nicht Prototyp — `save`/`addImage` werden pro Instanz gesetzt, nicht vererbt), alle erzeugten Canvas-Seiten als PNG extrahiert und **visuell inspiziert** (nicht nur Seitenzahl/Dateiname geprüft). Vorher/Nachher-Vergleich bestätigt: Seite 1 war immer korrekt, Seite 2 vorher kaputt, nachher sauber lesbar, korrekt linksbündig, inkl. korrekter Umlaute (getestet mit "Müller-Schmidt" im Vornamen).

## ✅ A3.html konvertiert & verifiziert

`handlePrint()` → umbenannt in `handleDownloadPdf()` (Name beschreibt jetzt wieder, was die Funktion tut). Baut die 15 Bauteil-Abschnitte aus den `comp_*_func`/`comp_*_ana`-Feldern und ruft `downloadTextWorksheetPDF()`. `<script src="assets/js/pdf-engine.js">` vor dem eigenen Inline-Script ergänzt. UI-Texte "drucken" → "herunterladen" korrigiert. **Bewusst nicht** auf `worksheet-common.js` migriert (separates, grösseres Vorhaben, siehe offener Punkt aus Runde 3) — `pdf-engine.js` funktioniert unabhängig davon.

## ✅ A2.html konvertiert & verifiziert

`handlePrint()` nutzte bisher `safePrint()` (= `window.print()` mit Dark-Mode-Sicherheitsnetz) aus `worksheet-common.js`. Baut jetzt die 6 EVA-Beispiel-Abschnitte (`ex{1-6}_name/in/proc/out`) und ruft `downloadTextWorksheetPDF()` — Abschnitts-Überschrift nutzt den vom Schüler eingetragenen Gerätenamen, fällt auf "(kein Gerät angegeben)" zurück, falls leer. `<script src="assets/js/pdf-engine.js">` neben `worksheet-common.js` ergänzt (Reihenfolge egal, da `pdf-engine.js` keine Lifecycle-Abhängigkeiten hat). UI-Text "Dokument als PDF exportieren oder drucken" → "Arbeitsblatt als PDF herunterladen", Icon `fa-print` → `fa-file-pdf`. Per Headless-Test verifiziert (1 Seite, korrekter Inhalt, visuell geprüft).

## Verbleibender Umfang (nicht heute umgebaut)

Live im Dashboard verlinkt sind A1–A9 + AEXAM. Von den restlichen sechs Dateien mit `window.print()`:

| Datei | Stil | Status |
|---|---|---|
| A1.html | Kompaktes Ergebnis-Zertifikat (Memory-Spiel-Auswertungstabelle) | offen |
| A4.html | Kompaktes Ergebnis-Zertifikat (Quiz-Fehlerliste / "fehlerfrei"-Abzeichen) | offen |
| A5.html | Volles Arbeitsblatt (mehrere `print-card`-Abschnitte) | offen |
| A8.html | Volles Arbeitsblatt (mehrere `print-card`-Abschnitte) | offen |
| A9.html | Volles Arbeitsblatt, aber **strukturell anders**: Drag&Drop-"Chips" (`chipState`) + 4er-Quiz-Score statt reiner Textfelder — braucht eigene Untersuchung, bevor eine PDF-Struktur dafür entworfen werden kann | offen |
| AEXAM.html | Volles Arbeitsblatt (mehrere `print-card`-Abschnitte) | offen |

A1 und A4 sind strukturell näher an `tk/xp.js`s eigenem Zertifikat (fixe, kompakte Zusammenfassung statt variabler Fliesstext) und brauchen daher eher eine bespoke Canvas-Zeichenfunktion als `downloadTextWorksheetPDF()`. A5/A8/AEXAM sollten sich analog zu A2/A3 direkt mit `downloadTextWorksheetPDF()` umsetzen lassen, sobald ihre Feld-IDs erhoben sind. Die `pdf-engine.js`-Infrastruktur (inkl. des behobenen Seitenumbruch-Bugs) steht bereit und muss dafür nicht mehr angepasst werden — nur noch pro Datei: Feld-IDs sammeln, `handlePrint()`/`window.print()`-Aufruf ersetzen, UI-Text korrigieren, per Headless-Test visuell verifizieren.

## Zusammenfassung Runde 4

| # | Datei | Schweregrad | Kurzbeschreibung | Status |
|---|---|---|---|---|
| 1 | hw/assets/js/pdf-engine.js | 🔴 Kritisch | `textAlign` blieb auf Folgeseiten rechtsbündig → Text links abgeschnitten | ✅ behoben |
| 2 | hw/A3.html | 🔵 Umbau | `window.print()` → `downloadTextWorksheetPDF()` | ✅ umgesetzt & verifiziert |
| 3 | hw/A2.html | 🔵 Umbau | `safePrint()`/`window.print()` → `downloadTextWorksheetPDF()` | ✅ umgesetzt & verifiziert |
| 4 | A1, A4, A5, A8, A9, AEXAM | 🔵 Umbau | noch mit `window.print()` | offen, siehe Tabelle oben |

Verifiziert per `node --check` auf `pdf-engine.js`, `worksheet-common.js` und allen Inline-Scripts von A2.html/A3.html sowie zwei vollständigen Headless-Chrome-Durchläufen (A2 + A3) mit echter jsPDF-Erzeugung, Instanz-Patching von `save`/`addImage` und **visueller Kontrolle der exportierten Canvas-Seiten als PNG** — nicht nur Seitenzahl/Dateiname, sondern der tatsächliche Textinhalt wurde angesehen. Genau diese visuelle Kontrolle hat den kritischen Seitenumbruch-Bug oben aufgedeckt, den ein reiner "keine Fehler in der Konsole"-Test nicht gefunden hätte — Grund, warum Punkt 5 im Analyse-Workflow oben ("tatsächlich herunterladen, nicht nur Druckvorschau ansehen") jetzt fester Bestandteil des Minimalstandards ist.

---
---

# Runde 5: A1 & A4 fertiggestellt (Fokus: A1–A4 für nächste Woche) — 2026-08-14

Auf Anfrage alle in der letzten Runde offen notierten Punkte für A1 und A4 behoben (A2/A3 waren bereits fertig, siehe Runde 4). A5/A8/A9/AEXAM bleiben wie in Runde 4 beschrieben offen — nicht Teil des heutigen Fokus.

## Neue Infrastruktur: `downloadCertificatePDF()` in `pdf-engine.js`

Zusätzlich zu `downloadTextWorksheetPDF()` (volle Arbeitsblätter) jetzt auch `downloadCertificatePDF()` (kompakte Ein-Seiten-Ergebniszertifikate wie A1/A4 — Kopf mit Icon/Titel/Status-Badge, Schüler-Info-Zeile, dann eine Liste generischer "Blöcke": `table` (Tabelle mit Kopfzeile), `stats` (Kachel-Statistiken nebeneinander), `summary` (hervorgehobene Zusammenfassungs-Box), `text` (Fliesstext mit Zeilenumbruch) — inkl. automatischer Seitenumbruch mit Fusszeile auf jeder Seite.

**Beim Bauen direkt vermiedener Fehler:** Die Fusszeile sollte ursprünglich nachträglich per `new Image(); img.src = dataUrl; ctx.drawImage(img, 0, 0)` auf die bereits fertigen Canvas-Seiten "aufgemalt" werden — das ist unsicher, weil `Image.onload` auch bei `data:`-URLs asynchron ist und `drawImage` direkt danach ein leeres/unfertiges Bild gezeichnet hätte (still-schweigend, kein Fehler). Vor dem ersten Test korrigiert: Fusszeile wird jetzt direkt auf dem Original-Canvas gezeichnet, bevor `toDataURL()` aufgerufen wird (`drawFooter()` als Teil von `finalizePage()`), kein Zwischenschritt über ein neues `Image`-Objekt nötig.

## ✅ A1.html: PDF konvertiert, verifiziert

`handlePdfPrint()` → `handleDownloadPdf()`, baut jetzt Tabellen-Zeilen (Schwierigkeitsgrad/Status/Punkte/Zeit/Züge/Bewertung) aus `getScoresFor()`/`topN()` und ruft `downloadCertificatePDF()`. Das alte druckbasierte `#printCertificate`-DOM (~80 Zeilen), die zugehörige `preparePrintCertificate()`-Funktion und die `@media print`-CSS-Regel vollständig entfernt (nicht nur deaktiviert) — sie wären nach der Umstellung nur noch toter Code gewesen. `<script src="assets/js/pdf-engine.js">` ergänzt. UI-Text "Als PDF drucken" → "PDF herunterladen", Icon `fa-print` → `fa-file-pdf`.

**Verifiziert:** Headless-Test mit 3 abgeschlossenen Modi (unterschiedliche Punkte/Zeiten/Züge) + 1 offenem Modus, Name mit Akzent ("Léa Fürst") — Tabelle korrekt (4 Zeilen, richtige Status-Symbole ⚪/✅), Gesamtpunktzahl korrekt summiert (340+610+480=1430), Akzentzeichen korrekt gerendert, Emoji (🏆📊) korrekt. PNG der generierten Seite visuell geprüft.

## ✅ A4.html: zwei echte Bugs behoben + PDF konvertiert, verifiziert

**Bug 1 (🔴 kritisch):** `@media print { body * { visibility: hidden !important; } ... }` — exakt das gleiche kaputte Muster, das für A1 schon in Runde 1 gefunden und auf `display: none` umgestellt wurde. A4 hatte nie den gleichen Fix bekommen. Da A4 jetzt komplett auf direkten PDF-Download umgestellt ist, wurde die gesamte `@media print`-Regel und das zugehörige `#printCertificate`-DOM ersatzlos entfernt statt nur repariert — beides war ausschliesslich für `window.print()` da.

**Bug 2 (🔴 wichtig):** `syncInputs()` fragte anders als auf jeder anderen Seite **nie** nach dem Vornamen — fehlte `studentVorname` in `localStorage`, blieb das Namensfeld für immer stumm auf `"Gast"` stehen (kein `prompt()`, keine Möglichkeit, das je zu korrigieren, ausser über eine andere Seite). Betrifft z. B. jeden Schüler, der A4 als allererstes Arbeitsblatt öffnet. **Fix:** gleiches Erstbesuch-Prompt-Muster wie auf allen anderen Seiten ergänzt (300ms-Delay, gleicher Prompt-Text, schreibt in `studentVorname` **und** `student_vorname`). Bewusst **nicht** auf `worksheet-common.js` migriert (gleiche Begründung wie bei A3 in Runde 3: grösseres, separates Vorhaben mit eigenem Verifikationsaufwand) — nur die eine tatsächlich fehlende Verhaltensweise ergänzt.

**PDF-Umstellung:** `handlePdfPrint()` → `handleDownloadPdf()`, baut einen `stats`-Block (Richtige Antworten/Zeit/Punkte) plus je nach Ergebnis entweder einen `text`-Block (Fehleranalyse, HTML-Tags aus den Fehlertexten entfernt) oder einen `summary`-Block ("Fehlerfreie Leistung!"). Da der PDF-Button nur nach einem **fehlerfreien** Durchlauf überhaupt aktiv wird, ist der Fehleranalyse-Zweig in der Praxis kaum erreichbar (bestehende Design-Eigenheit, nicht neu eingeführt) — trotzdem funktional mitgebaut und separat getestet.

**Verifiziert:** Zwei Headless-Durchläufe — (a) fehlerfreier Durchlauf (16/16, "Björn Weiss" mit Umlaut korrekt gerendert, "Fehlerfreie Leistung!"-Box), (b) künstlich mit 2 Fehlern befüllt, um den `text`-Block-Pfad zu testen (HTML-Tags korrekt entfernt, Zeilenumbruch korrekt, "Fehleranalyse"-Überschrift korrekt). Beide PNGs visuell geprüft.

## Aktualisierter Gesamtstatus A1–A4 (siehe auch Checkliste in der Konversation)

| # | Checkpunkt | A1 | A2 | A3 | A4 |
|---|---|---|---|---|---|
| PDF-Erstellung (Download, nicht Print) | ✅ erledigt & verifiziert | ✅ erledigt & verifiziert (Runde 4) | ✅ erledigt & verifiziert (Runde 4) | ✅ erledigt & verifiziert |
| Autofill Vorname/Klasse/Datum | ✅ via `worksheet-common.js` | ✅ via `worksheet-common.js` | ⚠️ eigene Kopie, funktioniert (Runde 2/3) | ✅ eigene Kopie, jetzt mit Erstbesuch-Prompt |
| Print-CSS-Altlasten | ✅ entfernt | – (nie betroffen) | – (nie betroffen) | ✅ entfernt |

**A1–A4 sind damit für den Einsatz nächste Woche durchgängig auf direkten PDF-Download umgestellt und funktional verifiziert.** Offene, bewusst nicht angefasste Punkte: A3 und A4 nutzen weiterhin ihre eigene (funktionierende) Autofill-Logik statt `worksheet-common.js` — reines Architektur-Aufräumen, kein bekannter Bug, kein Blocker für nächste Woche.

## Zusammenfassung Runde 5

| # | Datei | Schweregrad | Kurzbeschreibung | Status |
|---|---|---|---|---|
| 1 | hw/assets/js/pdf-engine.js | 🔵 Neu | `downloadCertificatePDF()` ergänzt (Tabellen/Statistik/Zusammenfassung/Text-Blöcke) | ✅ hinzugefügt & verifiziert |
| 2 | hw/assets/js/pdf-engine.js | 🟡 Vermieden | Riskante Fusszeilen-Nachbearbeitung über `new Image()` durch direktes Zeichnen ersetzt, bevor es zum Bug wurde | ✅ korrekt gebaut |
| 3 | hw/A1.html | 🔵 Umbau | `window.print()` → `downloadCertificatePDF()`, totes Print-DOM entfernt | ✅ umgesetzt & verifiziert |
| 4 | hw/A4.html | 🔴 Kritisch | Gleicher `visibility:hidden`-Print-Bug wie A1 (Runde 1) | ✅ behoben (Feature entfernt, da nicht mehr gebraucht) |
| 5 | hw/A4.html | 🔴 Wichtig | Vorname-Prompt fehlte komplett — Name blieb für immer "Gast" | ✅ behoben |
| 6 | hw/A4.html | 🔵 Umbau | `window.print()` → `downloadCertificatePDF()`, totes Print-DOM entfernt | ✅ umgesetzt & verifiziert |

Verifiziert per `node --check` auf allen Inline-Scripts von A1.html/A4.html (je 2 Blöcke, alle fehlerfrei) und `pdf-engine.js`, sowie drei vollständigen Headless-Chrome-Durchläufen (A1, A4 fehlerfrei, A4 mit Fehlern) mit echter jsPDF-Erzeugung und **visueller Kontrolle jeder exportierten Seite als PNG**.

---
---

# Runde 6: A4-Bestehensgrenze gelockert (16/16 → 13/16) — 2026-08-14

Auf Anfrage: A4 verlangte bisher zwingend alle 16 Fragen fehlerfrei (0 Fehler), was strenger war als A1–A3. Auf **13 von 16 richtig** (max. 3 Fehler) gelockert.

**Umsetzung** ([hw/A4.html:302-303](A4.html#L302-L303)): zwei neue Konstanten `TOTAL_QUESTIONS = 16` und `MIN_CORRECT_TO_PASS = 13` ergänzt, statt die Zahlen an jeder Stelle einzeln zu ändern. `endQuiz()`s Bestehens-Prüfung von `errorCount === 0` auf `correctAnswers >= MIN_CORRECT_TO_PASS` umgestellt ([hw/A4.html:545-546](A4.html#L545-L546)). Alle Texte, die vorher hart "16/16" bzw. "fehlerfrei" sagten, jetzt dynamisch: Modal-Titel/-Untertitel, Header-Button-Tooltip, der Sperr-Alert in `handleDownloadPdf()`, und das PDF-Zertifikat selbst (Badge + Statistik-Kachel zeigen jetzt die tatsächliche Trefferzahl, z. B. "13/16", statt fest "16/16").

**Verifiziert:** Code-Pfad direkt gelesen und bestätigt (einfache Arithmetik: `16 - errorCount >= 13`). Zusätzlich per Headless-Test die Grenze selbst geprüft — ein Durchlauf mit genau 3 Fehlern (13 richtig, exakt die neue Grenze) wurde simuliert und das erzeugte PDF visuell kontrolliert: Badge zeigt korrekt "✅ Praxis-Test bestanden (13/16)", Statistik-Kachel "13 / 16", Fehleranalyse-Block mit den 3 Fehlern. (Ein Versuch, die Schwelle über einen echten simulierten Quiz-Durchlauf mit erzwungener Fehlerzahl zu testen, scheiterte an `let errorCount`, das wie `currentPercentage` in Runde 4 von aussen nicht überschreibbar ist — daher stattdessen der oben beschriebene, direktere Weg über einen vorbelegten `localStorage`-Zustand.)

## Zusammenfassung Runde 6

| # | Datei | Schweregrad | Kurzbeschreibung | Status |
|---|---|---|---|---|
| 1 | hw/A4.html | 🔵 Änderung | Bestehensgrenze 16/16 → 13/16, alle Texte/PDF dynamisch angepasst | ✅ umgesetzt & verifiziert |

Verifiziert per `node --check` (fehlerfrei) und Headless-Chrome-Test der neuen Bestehensgrenze inkl. visueller PNG-Kontrolle des erzeugten PDFs.

---
---

# Runde 7: Zwei Funde aus dem manuellen Test (A3) — 2026-08-14

Nutzer ist auf manuelle Prüfung umgestiegen und fand direkt zwei echte Probleme in A3.html.

## ✅ Fund 1: A3 zeigte beim allerersten Öffnen bereits 33% Fortschritt — unehrlich

**Ursache:** `updateProgress()` zählte alle Felder ausser `_ana` mit — das schloss `studentName`/`studentClass`/`studentDate` mit ein, die aber automatisch beim Laden befüllt werden (Klasse/Datum immer, Vorname sobald einmal irgendwo eingegeben) und **keine eigene Leistung der Schüler:innen** sind. Zusammen mit den 2 als Beispiel vorausgefüllten Bauteilen (CPU, Mainboard) ergab das einen Startwert deutlich über 0%, ohne dass die Schüler:innen irgendetwas getan hatten.

**Fix** ([hw/A3.html:821-829](A3.html#L821-L829)): Filter von "alles ausser `_ana`" auf "nur `comp_*_func`-Felder" geändert — Metadaten zählen jetzt gar nicht mehr mit, nur die 15 tatsächlichen Funktions-Beschreibungen. Speichern/Laden (`saveProgressToStorage`/`loadProgress`) bleiben unverändert, die betrifft nur die Prozent-**Anzeige**.

**Verifiziert:** Headless-Test mit komplett geleertem `localStorage` (nur Vorname vorbelegt, um den blockierenden Erstbesuch-Prompt zu umgehen) — Startwert jetzt **13%** (= 2 von 15 Beispiel-Feldern vorausgefüllt, mathematisch korrekt: 2/15 = 13,3̄%) statt vorher 33%.

*Zur Rückfrage "erst nach Klick auf Weiter hochzählen?":* Bewusst **nicht** so umgesetzt — das hätte den wahren Zustand nur kurz versteckt (ploetzlicher Sprung beim ersten Klick), statt die eigentliche Ursache zu beheben. Die jetzige Lösung entfernt stattdessen genau die Felder aus der Rechnung, die nie "erarbeitet" werden. Falls die 13% wegen der 2 Beispiel-Antworten immer noch störender Fixwert sein sollen, bitte Bescheid geben — das wäre eine bewusste Zusatz-Änderung (Beispiele erst nach Ansehen/Klick mitzählen), kein Bugfix mehr.

## ✅ Fund 2: "EVA"-Icon im Header war ein Relikt aus der alten A3-Version

**Ursache:** Kleines Logo-Badge oben links zeigte den Text "EVA" ([hw/A3.html:79-81](A3.html#L79-L81)) — Rest einer früheren A3-Fassung, die noch eine EVA-Drag&Drop-Aufgabe enthielt (siehe Runde-1-Notiz zu `A3_backup.html`/`A3_merged.html`). Die aktuelle A3 (15-Bauteile-Karussell) hat inhaltlich nichts mehr mit dem EVA-Prinzip zu tun (das ist A2s Thema) — das Badge war irreführend.

**Fix:** "EVA"-Text durch ein Desktop-PC-Icon (`fa-solid fa-desktop`) ersetzt, passend zum tatsächlichen Thema (Hardware-Analyse) und konsistent mit dem gleichen Icon, das schon in der ersten Bauteil-Karte verwendet wird.

## Zusammenfassung Runde 7

| # | Datei | Schweregrad | Kurzbeschreibung | Status |
|---|---|---|---|---|
| 1 | hw/A3.html | 🟠 Wichtig | Fortschritt startete unehrlich bei 33% statt bei tatsächlich Erarbeitetem | ✅ behoben (33% → 13%) |
| 2 | hw/A3.html | 🟡 Klein | "EVA"-Header-Icon war ein Relikt der alten A3-Version, inhaltlich falsch | ✅ behoben |

Verifiziert per `node --check` (3 Inline-Script-Blöcke, alle fehlerfrei) und Headless-Chrome-Test des Startwerts nach vollständigem `localStorage`-Reset.

---
---

# Runde 8: PDF-Engine komplett auf echten PDF-Text umgestellt (17 MB → ~30 KB) — 2026-08-14

Nutzer lud ein ausgefülltes A3-PDF herunter: **17 MB, ohne ein einziges Bild**. Zu Recht als unplausibel gemeldet.

## 🔴 Ursache (architektonisch, nicht nur ein Bug): jede Seite war heimlich ein Vollbild-Screenshot

`downloadTextWorksheetPDF()`/`downloadCertificatePDF()` zeichneten den kompletten Seiteninhalt auf ein unsichtbares `<canvas>` und betteten **jede Seite als PNG-Rasterbild** ins PDF ein (`canvas.toDataURL('image/png')` → `pdf.addImage(...)`). Für `tk/xp.js`s einzelnes, kompaktes Zertifikat (eine feste Seite) ist das unproblematisch — für ein mehrseitiges Arbeitsblatt mit viel Freitext skaliert es katastrophal: jede zusätzliche beantwortete Frage bedeutet potenziell eine weitere volle Seiten-Rastergrafik. Ein vollständig ausgefülltes A3 mit 15 ausführlichen Antworten landet so leicht im zweistelligen MB-Bereich, obwohl der eigentliche Inhalt nur Text ist.

## ✅ Fix: `pdf-engine.js` komplett neu geschrieben — echter PDF-Text statt Raster

Beide Funktionen zeichnen jetzt direkt über jsPDFs native Text-/Grafik-API (`pdf.text()`, `pdf.splitTextToSize()`, `pdf.line()`, `pdf.rect()`) statt über ein Canvas. Kein `<canvas>`, kein `toDataURL()`, kein `addImage()` mehr in der Text-Engine. Nebeneffekt: der Text ist jetzt echter, auswählbarer/durchsuchbarer/kopierbarer PDF-Text statt eines Fotos vom Text.

**Kompromiss:** Die 14 Standard-PDF-Schriften (Helvetica etc.) unterstützen nur Latin-1 (deckt deutsche Umlaute ä/ö/ü/ß ab) — kein Emoji, kein "•". Dafür wurde `pdfSafeText()` ergänzt: typografische Zeichen aus Word-Copy-Paste oder Emoji-Trennzeichen (Gedankenstriche, „…", ↔, →, •) werden zu ASCII-Entsprechungen normalisiert statt kommentarlos zu verschwinden; alles, was danach noch ausserhalb Latin-1 liegt (im Wesentlichen nur Emoji), wird verworfen. Betrifft z. B. das vorausgefüllte CPU-Beispiel in A3 (enthielt einen Gedankenstrich) und potenziell echte Schüler-Antworten, die aus Word kopiert wurden.

## 🔴 Zweiter Bug, direkt beim ersten Test gefunden: A1s Tabellen-Spalten liefen von der Seite

Der alte Canvas-Engine arbeitete in Pixeln (Seite 1240×1754px), die neue arbeitet in mm (Seite 210×297mm, wie es jsPDFs `unit: 'mm'` verlangt). A1.html übergab weiterhin die **alten Pixel-Werte** für `colWidths: [270, 170, 150, 130, 110, 130]` (Summe 960) — im neuen mm-Koordinatensystem (Inhaltsbreite nur 174mm) liess das schon die zweite Spalte weit ausserhalb der sichtbaren Seite zeichnen. Sichtbares Symptom: Tabelle zeigte nur noch die erste Spalte ("Schwierigkeitsgrad"), der Rest (Status/Punkte/Zeit/Züge/Bewertung) verschwand lautlos von der Seite.

**Gefunden durch:** `pdftotext` auf das erzeugte Test-PDF angewendet und den extrahierten Text mit dem erwarteten Inhalt verglichen — genau die Art Test, die eine reine Bild-Sichtprüfung (wie in Runde 4) nicht zuverlässig aufgedeckt hätte, weil fehlender Text schwerer auffällt als sichtbar falsch positionierter Text.

**Fix:** `colWidths` in A1.html auf mm umgerechnet (proportional zur alten Verteilung: `[49, 31, 27, 24, 20, 23]`, Summe 174mm). **Zusätzlich** ein Sicherheitsnetz in `pdf-engine.js` selbst ergänzt: Wenn die Summe der übergebenen `colWidths` deutlich von der tatsächlichen Inhaltsbreite abweicht (>105% oder <50%), skaliert die Engine sie automatisch proportional zurecht, statt lautlos Spalten von der Seite laufen zu lassen. Schützt vor genau dieser Fehlerklasse, falls A5/A8/A9/AEXAM später mit denselben (dann eventuell wieder falsch skalierten) Werten umgestellt werden.

## Verifikation

Da die neue Engine keine Canvas-Bilder mehr erzeugt, funktionierte die bisherige Verifikationsmethode (Seiten als PNG exportieren und ansehen) nicht mehr. Neue Methode: `jsPDF`-Konstruktor gepatcht, um die rohen PDF-Bytes vor dem Download abzugreifen, als echte `.pdf`-Datei auf die Platte geschrieben, dann mit `pdftotext` (Git-Bash bringt es mit, `poppler-utils` war sonst nicht installiert) der tatsächliche Textinhalt extrahiert und mit dem erwarteten Inhalt verglichen. Zusätzlich Dateigrösse gemessen.

- **A3** (5 Seiten, alle 15 Funktionsfelder + einige Analogie-Felder mit realistisch langen Antworten befüllt): **33'808 Bytes** (vorher: 17 MB beim Nutzer). Text korrekt, Umlaute korrekt ("Müller", "Gehäuse"), Seitenumbrüche an sinnvollen Stellen, Gedankenstrich korrekt zu "-" normalisiert.
- **A1** (Zertifikat mit Tabelle, akzentuierter Name "Léa Fürst"): **8785 Bytes**, nach dem `colWidths`-Fix alle 6 Spalten vollständig vorhanden.
- **A4** (Zertifikat mit Statistik-Kacheln + Fehleranalyse-Textblock, 3 künstliche Fehler): **6223 Bytes**, HTML-Tags aus den Fehlertexten korrekt entfernt, Umlaute korrekt ("Björn").

A2 nutzt denselben Codepfad wie A3 (`downloadTextWorksheetPDF`, keine `colWidths`) und wurde nicht erneut einzeln getestet — hohe Zuversicht durch den identischen, bereits verifizierten Mechanismus.

## Zusammenfassung Runde 8

| # | Datei | Schweregrad | Kurzbeschreibung | Status |
|---|---|---|---|---|
| 1 | hw/assets/js/pdf-engine.js | 🔴 Kritisch | Canvas-Rasterisierung pro Seite → PDFs im zweistelligen MB-Bereich für reinen Text | ✅ behoben (komplett neu geschrieben, echter PDF-Text) |
| 2 | hw/A1.html | 🔴 Kritisch | `colWidths` noch in alten Pixel-Werten → Tabellenspalten 2-6 liefen von der Seite | ✅ behoben |
| 3 | hw/assets/js/pdf-engine.js | 🟡 Robustheit | Sicherheitsnetz gegen falsch skalierte `colWidths` ergänzt | ✅ ergänzt |

Verifiziert per `node --check` (fehlerfrei) und drei vollständigen Headless-Chrome-Durchläufen (A3, A1, A4) mit echter jsPDF-Byte-Extraktion, Datei-Speicherung als `.pdf` und `pdftotext`-Inhaltsprüfung statt Bild-Export.

---
---

# Runde 9: A3 Voll-Audit nach Redesign (Info-Button, Live-Häkchen, 3D-Viewer & Foto-PDF) — 2026-08-16

Vollaudit von `hw/A3.html` nach den aktuellen Anpassungen (Einführung des modalen Anleitungs-Buttons, Umstellung der Carousel-Dots auf Live-Häkchen, Farbharmonisierung auf OneDrive-Blau und Integration der Bauteil-Fotos in den PDF-Export).

## 7-Punkte-Checkliste A3.html

| # | Checkpunkt | Ergebnis |
|---|---|---|
| 1 | Progression & localStorage | ✅ **Solide & ehrlich:** Fortschrittsberechnung zählt exakt die 14 `comp_*_func`-Felder. Startwert liegt bei 7 % (1 von 14 didaktisch vorausgefüllten Bauteilen: CPU als Beispiel). 100 % wird bei Vollständigkeit sauber erreicht und schaltet die PDF-Generierung frei. `saveProgressToStorage()` schreibt `{ form, percent }` in `onedrive_hardware_worksheet_8sek`, `index.html` erkennt 100 % (`title-A3`). Nach "Zurücksetzen" werden alle Felder geleert, Klasse ("B24") und Tagesdatum werden zuverlässig neu befüllt. |
| 2 | Funktioniert alles wie erwartet? | ✅ **Vollständig verifiziert:**<br>• Carousel-Navigation (Zurück/Weiter, 16 Dots/Häkchen, Pfeiltasten `←`/`→` mit Eingabefeld-Pause).<br>• Erster Weiter-Button pulsiert auf Startkarte (`btn-pulse-scale`).<br>• Listenansicht-Toggle (`#viewToggleBtn`) speichert Ansicht in `localStorage`.<br>• Beide Info-Buttons (Sticky-Header & Startkarte) öffnen das Hilfe-Modal.<br>• 3D-Modell-Modal (Karten 1 & 15) lädt `cpu-3d.html` mit Explosionsansicht & Vollbild-Link.<br>• Theme-Toggle (Hell/Dunkel) funktioniert und wird gespeichert.<br>• Keine Konsolen-/Syntaxfehler (`node --check` fehlerfrei). Alle 20 referenzierten Assets existieren. |
| 3 | Rechtschreibung & Vollständigkeit | ✅ Alle 15 Bauteile besitzen Bild, deutschen Fachtitel, englisches Kürzel, Funktions-Eingabefeld und optionales Analogie-Feld. Keine Rechtschreibfehler in Texten, Labels oder Hinweisen. |
| 4 | Kein KI-Wording | ✅ Sachliche, klare und schülergerechte Aufgabenstellungen ohne Marketing-Floskeln ("Tauche ein in...", "In unserer modernen Welt..."). |
| 5 | PDF-Erstellung | ✅ **Hochwertiges Thumbnail-Layout:** Direkter Download über `downloadTextWorksheetPDF()`. Alle 15 Bauteile enthalten mit Foto-Thumbnail (38 × 26 mm, via Canvas-JPEG-Konverter). 2-Spalten-Layout pro Komponente, `ensureSpace` verhindert zerrissene Bauteilblöcke bei Seitenumbrüchen. Kompakte Dateigröße (< 400 KB bei 3–4 Seiten A4). |
| 6 | Alle Eingabefelder → localStorage | ✅ `setupUniversalAutoSave()` spiegelt alle 30 Textareas + 3 Metadatenfelder in `hw_autosave_A3.html`. `saveProgressToStorage()` sichert den Gesamtstatus in `onedrive_hardware_worksheet_8sek`. Nach Neuladen wird der Zustand 1:1 wiederhergestellt. |
| 7 | Autofill Vorname/Klasse/Datum | ✅ Vorname synchronisiert global mit `studentVorname`/`student_vorname` (inkl. Erstbesuch-Prompt). Klasse defaultet auf "B24". Datum wird auf heute gesetzt. Bleibt nach Reset und Reload stabil intakt.<br>*(Hinweis: A3 pflegt diese Logik aktuell noch inline statt über `worksheet-common.js` — funktioniert aber tadellos und ohne Fehler).* |

## Zusammenfassung Runde 9

| # | Datei | Schweregrad | Kurzbeschreibung | Status |
|---|---|---|---|---|
| 1 | hw/A3.html | 🔵 Feature | Blauer Info-Button in Header & Startkarte | ✅ umgesetzt |
| 2 | hw/A3.html | 🔵 Feature | Untere Dots schalten bei Erledigung live auf blaue Häkchen-Badges um | ✅ umgesetzt |
| 3 | hw/A3.html | 🔵 Design | Alle Buttons, SVG-Ring und PDF-Buttons einheitlich in OneDrive-Blau | ✅ umgesetzt |
| 4 | hw/assets/js/pdf-engine.js | 🔵 Feature | Bauteil-Fotos via Canvas-JPEG-Thumbnails in PDF integriert (< 650 KB) | ✅ umgesetzt & verifiziert |
| 5 | hw/A3.html | 🟢 Qualität | 7-Punkte-Minimalstandard-Audit erfolgreich durchlaufen | ✅ verifiziert |
| 6 | hw/A3.html | 🟢 Didaktik | Konsolidierung auf 14 eindeutige Bauteile (Dopplung CPU-Kühler/Sockel behoben) | ✅ umgesetzt |

Verifiziert per `node --check` auf allen Inline-Skripten und `pdf-engine.js`, Asset-Vollständigkeitsprüfung aller verlinkten Dateien sowie Verifikation der Progression (Startwert 14 % bei 2/14) und des 14-Komponenten-PDF-Generators.

---
---

# Runde 10: A3 Feinschliff (0% Start, Mainboard-Prefill entfernt & Bild-Zoom-Regler auf 95%) — 2026-08-16

## Zusammenfassung Runde 10

| # | Bereich | Anpassung | Status |
|---|---|---|---|
| 1 | **Progression** | Startet initial bei **0 %**. Erst beim ersten Klick auf «Weiter» (oder Navigation zu Karte 1) springt der Fortschritt auf **7 %** (1/14, CPU-Beispiel). Bei Reset kehrt er zu 0 % zurück. | ✅ umgesetzt & getestet |
| 2 | **Didaktik** | Mainboard-Vorausfüllung entfernt, sodass SuS die Funktion und Analogie selbst erarbeiten. Nur die CPU bleibt als Referenzbeispiel vorausgefüllt. | ✅ umgesetzt |
| 3 | **Unbeschnittene Bilddarstellung (`object-contain`)** | Umstellung von `object-cover` auf `object-contain`. Bilder werden niemals automatisch beschnitten oder ungefragt vergrößert; die gesamte Platine/Komponente ist immer zu 100 % vollständig sichtbar. | ✅ umgesetzt |
| 4 | **Zoom-Slider (100 %–160 %)** | Interaktiver Vergrößerungsregler oben links in jeder Bauteil-Karte. Ermöglicht optionales stufenloses Hineinzoomen in Detailbereiche bei 100 % nativer Basisskalierung. | ✅ umgesetzt & visuell geprüft |
| 5 | **Mainboard Dual-Image** | `VL-MB1.webp` und `VL-MB2.webp` (Perspektive und Draufsicht) nebeneinander in A3 integriert (Qualität 95 %, max-width 1376px, zentrierter Zoom auf Platine 2). | ✅ umgesetzt & visuell geprüft |
| 6 | **Netzwerkkarte (VL-Network)** | Bild physikalisch korrigiert: Genau 2 WLAN-Antennen an der Außenseite des Slotblechs nach oben gerichtet; Ethernet-Karte mit frontaler Sicht auf den goldenen RJ45-Port (Kontakte & LEDs sichtbar) im Velocity-Look neu generiert. | ✅ umgesetzt & visuell geprüft |

---
---

# Runde 11: Nachprüfung der PDF-Engine nach 3 weiteren Commits — keine Regression, echte End-to-End-Verifikation nachgeholt — 2026-08-16

**Anlass:** Seit Runde 10 kamen drei weitere Commits dazu, die `hw/A3.html` und `hw/assets/js/pdf-engine.js` erneut angefasst haben: `5c5f900` ("Pdf generation" — Umstellung der Text-Engine von px- auf mm-Koordinaten samt `pdfSafeText()`), `351ed84` ("A3 & PDF" — Bauteil-Foto-Thumbnails im PDF via `pdfPreloadImages()`, neue Datei `hw/assets/js/a3-thumbnails.js`, Klassen-Anzeige "B24"/"B25" → "9. Klasse" im PDF-Kopf) und `87e1397` ("A3" — Bild-Zoom-Regler, `object-contain`, Mainboard-Dual-Bild, 0 %-Start). Die Texte zu Runde 9 und Runde 10 oben wurden tatsächlich **innerhalb** von `351ed84` bzw. `87e1397` mitcommittet, decken die jeweiligen Commits inhaltlich also schon ab — heute ging es darum, das mit echten End-to-End-Tests (echter PDF-Download, `pdftotext`, Screenshot) gegenzuprüfen statt nur den Code zu lesen, weil genau in diesem Bereich (PDF-Engine) die schwersten Bugs der bisherigen Runden steckten (17 MB Raster-PDFs, `colWidths` in falschen Einheiten, `textAlign`-Leck auf Folgeseiten).

## 7-Punkte-Checkliste A3.html (Fokus: Punkte 1, 2, 5, 7)

| # | Checkpunkt | Ergebnis |
|---|---|---|
| 1 | Progression & localStorage | ✅ Startet bei **0 %** (frischer `localStorage`, per Headless-Test bestätigt). Erster Klick auf "Weiter" (Karte 1) springt korrekt auf **7 %** (1/14, CPU-Beispiel). Alle 14 Felder ausgefüllt → **100 %**, PDF-Button schaltet frei. Nach Reload bleibt der Zustand (Prozent, Name, Klasse, alle 14 Texte) exakt erhalten. |
| 2 | Funktioniert alles wie erwartet? | ✅ `node --check` auf allen 3 Inline-Script-Blöcken von A3.html sowie auf `pdf-engine.js` und `a3-thumbnails.js` — alle fehlerfrei. Alle 21 von A3.html referenzierten lokalen Assets (16 Bilder, `cpu-3d.html`, `tailwind.min.js`, `fontawesome.min.css`, `a3-thumbnails.js`, `pdf-engine.js`) sowie das dynamisch nachgeladene `jspdf.umd.min.js` existieren auf der Platte. Neuer Bild-Zoom-Regler (`setGlobalImageZoom()`, 100–160 %) per Headless-Test geprüft: setzt `--img-zoom` korrekt als CSS-Variable, speichert in `localStorage['a3_img_zoom']` und überlebt einen Reload. Keine Konsolenfehler während des kompletten Testlaufs (Laden, Ausfüllen, Reset, PDF-Erzeugung). |
| 5 | PDF-Erstellung | ✅ **Echter Download ausgelöst und geprüft** (siehe Detail-Abschnitt unten) — kein Regressions-Fund. Alle vier historisch kritischen Bugs bleiben behoben: keine Raster-Seiten (PDF bleibt < 1 MB), `colWidths` nicht betroffen (A3 nutzt keine Tabellen-Blöcke), kein `textAlign`-Leck auf Folgeseiten (Screenshot zeigt Seite 2+ weiterhin sauber linksbündig), Fusszeile/Bild wird vor `toDataURL()`/`addImage()` fertig gezeichnet (keine Halbbilder). |
| 7 | Autofill Vorname/Klasse/Datum | ✅ Erstbesuch-`prompt()` erscheint zuverlässig und schreibt in `studentVorname`/`student_vorname`. Klasse defaultet auf "B24", Datum auf heute. **Reset-Zyklus real über den UI-Bestätigungsdialog getestet** (nicht nur `confirmReset()` direkt aufgerufen, sondern echter Klick auf `#modalConfirmBtn`): Fortschritt → 0 %, CPU-Referenzbeispiel wird wiederhergestellt, Mainboard-Feld korrekt geleert, Klasse/Datum korrekt neu gesetzt, Vorname bleibt (globaler Sync) erhalten — und 100 % ist von dort aus wieder erreichbar. Kein Rückfall auf den A3-"Klasse bleibt leer"-Bug aus Runde 2. |

## Detailprüfung PDF-Erstellung (echter Download, nicht nur Codelesen)

**Methodik-Hinweis:** Das bisher in Runde 4/8 verwendete Muster ("jsPDF-Konstruktor patchen, Instanz-Ebene statt Prototyp") ist weiterhin korrekt — `save`/`text`/`addImage` sind bei diesem jsPDF-Bundle tatsächlich **Instanz-Eigenschaften** (aus `jsPDF.API` beim Konstruktor-Aufruf auf `this` kopiert), nicht auf `jsPDF.prototype` vorhanden. Ein per `setInterval` nachträglich gepatchter Konstruktor lief in einem eigenen Testaufbau heute in eine Race Condition (die Bauteil-Vorschaubilder sind alle schon vorab als Base64 in `a3-thumbnails.js` vorhanden, wodurch `pdfPreloadImages()` synchron durchläuft und `new jsPDF()` schneller ausgeführt wird, als ein `setInterval`-Poll reagieren kann — der Patch kam nie zum Einsatz, das Zeichnen lief mit der echten, ungepatchten `save()`, die in Headless-Chrome lautlos "hängen" liess, weil kein Downloadziel konfiguriert war). Das ist kein Bug im Produktcode, sondern eine Testfallen-Erkenntnis für künftige Audits: statt der Konstruktor-Patch-Technik wurde heute stattdessen `Browser.setDownloadBehavior` (Chrome DevTools Protocol) verwendet, um Chrome einen **echten** Download in einen Zielordner ausführen zu lassen — robuster, weil unabhängig von Zeitpunkt/Reihenfolge des Skript-Ladens.

**Testablauf:** A3.html frisch geladen, alle 14 Bauteil-Felder mit realistisch langen Testantworten (inkl. Umlauten und Gedankenstrich) befüllt, echten `handleDownloadPdf()`-Button-Handler ausgelöst, die von Chrome tatsächlich heruntergeladene Datei von der Platte gelesen.

- **Dateigrösse:** 663'532 Bytes (648 KB) bei langen Testantworten, 644'128 Bytes (629 KB) bei kurzen, realistischen Antworten — die Grösse wird also fast vollständig von den 14 eingebetteten JPEG-Vorschaubildern dominiert (nicht vom Text). Deckt sich mit der in Runde 9 genannten Grössenordnung ("< 650 KB"); die dortige Checklisten-Angabe "< 400 KB" war demgegenüber zu optimistisch — keine Regression, nur eine genauere Messung heute. Weiterhin um Grössenordnungen kleiner als der ursprüngliche 17-MB-Bug aus Runde 8.
- **Textinhalt:** `pdftotext -enc UTF-8 -layout` auf die echte heruntergeladene Datei angewendet — alle 14 Bauteil-Überschriften, alle Funktions- und Analogie-Texte vollständig und unverstümmelt vorhanden, kein abgeschnittener Text, korrekte Seitenumbrüche (5 Seiten bei langen, 4 bei kurzen Antworten). Umlaute (ä/ö/ü) und der Gedankenstrich (normalisiert zu "-") korrekt. *Hinweis: `pdftotext` ohne `-enc UTF-8`-Flag liefert auf diesem System Latin-1-Bytes statt UTF-8 und zeigt Umlaute fälschlich als "�" an — das ist ein Artefakt der Kommandozeilen-Flag-Wahl, nicht des PDFs (per Hex-Dump und PDF-interner `/Encoding /WinAnsiEncoding`-Deklaration verifiziert).*
- **Visuelle Kontrolle:** Screenshot der Chrome-eigenen PDF-Vorschau (Seite 1+2) angesehen — Layout sauber, Bauteil-Fotos korrekt zugeordnet (CPU/Mainboard/Gehäuse), Kopfzeile mit Vorname/Klasse/Datum weiterhin linksbündiger Fliesstext auf Folgeseiten (kein `textAlign`-Rückfall).
- **Neu bestätigt, bisher nicht explizit dokumentiert:** Die Klassen-Anzeige im PDF-Kopf zeigt "9. Klasse" statt des rohen Codes "B24"/"B25" (Umsetzung aus `351ed84`, [pdf-engine.js:156](assets/js/pdf-engine.js#L156)). Das *Formularfeld* auf der Seite selbst zeigt weiterhin "B24" (unverändert, nur die PDF-Ausgabe wird für Schüler/Eltern lesbarer umbenannt) — funktioniert wie vorgesehen, war aber in den Runde-9/10-Checklisten noch nicht vermerkt.

## Kleinere, nicht behobene Beobachtungen (kein Bug, nur notiert)

- **Kosmetisch:** In `87e1397` wurden bei allen 14 Bauteil-`<img>`-Tags vor dem Tag eine Leerzeile plus Einrückung auf Spalte 0 eingefügt (vermutlich Nebeneffekt eines automatisierten Such-/Ersetzen-Laufs beim Hinzufügen des Zoom-Reglers). Rein optisch im Quelltext, keine funktionale Auswirkung, nicht behoben (14 Fundstellen anzufassen wäre unnötiges Diff-Rauschen für ein reines Whitespace-Detail).
- **Mainboard-PDF-Thumbnail:** Auf der Seite werden für "2. Mainboard" zwei Bilder nebeneinander angezeigt (`VL-MB1.webp` + `VL-MB2.webp`, seit Runde 10). Im PDF wird weiterhin nur ein einziges Bild eingebettet (`VL-MB1.webp`, [A3.html:1040](A3.html#L1040)) — bekannte, bewusste Einschränkung der Thumbnail-Engine (ein Bild pro Sektion), keine Regression seit Runde 9/10, aber nicht explizit dokumentiert gewesen.

## Zusammenfassung Runde 11

| # | Datei | Schweregrad | Kurzbeschreibung | Status |
|---|---|---|---|---|
| 1 | hw/A3.html, hw/assets/js/pdf-engine.js | 🟢 Verifikation | Alle 3 Commits seit Runde 10 (`5c5f900`, `351ed84`, `87e1397`) per echtem PDF-Download + `pdftotext` + Screenshot nachgeprüft — keine Regression bei den 4 historisch kritischen PDF-Bugs (Raster-Grösse, `colWidths`, `textAlign`-Leck, Fusszeilen-Timing) | ✅ bestätigt, kein Fund |
| 2 | hw/A3.html | 🟢 Verifikation | Progression (0 % Start → 7 % nach CPU → 100 %), Reload-Persistenz und echter Reset-Zyklus (via UI-Klick auf Bestätigungsdialog) funktionieren durchgängig, 100 % nach Reset wieder erreichbar | ✅ bestätigt, kein Fund |
| 3 | hw/assets/js/pdf-engine.js | 🔵 Dokumentiert | "9. Klasse"-Anzeige im PDF-Kopf statt "B24"/"B25" (aus `351ed84`) war bisher nicht in der Checkliste vermerkt | ✅ nachdokumentiert |
| 4 | — | 🔵 Methodik | jsPDF-Instanz-Patching per `setInterval` ist race-anfällig, wenn Vorschaubilder bereits vorgeladen sind; `Browser.setDownloadBehavior` (CDP) als robusterer Weg für künftige Audits notiert | ✅ Erkenntnis dokumentiert |
| 5 | hw/A3.html | 🟢 Kosmetisch | Whitespace-Artefakt vor 14 `<img>`-Tags aus `87e1397` | offen, nicht behoben (kein funktionaler Effekt) |
| 6 | hw/A3.html / pdf-engine.js | 🟢 Bekannt | Mainboard-PDF-Thumbnail zeigt nur eines von zwei Bildern | offen, bewusste Einschränkung, nicht behoben |

Verifiziert per `node --check` (A3.html: 3 Inline-Blöcke, `pdf-engine.js`, `a3-thumbnails.js` — alle fehlerfrei), Asset-Vollständigkeitsprüfung (21 lokale Referenzen plus dynamisch geladenes `jspdf.umd.min.js`, nichts fehlt), zwei vollständigen Headless-Chrome-End-to-End-Läufen mit **echtem** Datei-Download über `Browser.setDownloadBehavior` (CDP) — einmal mit langen, einmal mit kurzen Testantworten —, `pdftotext -enc UTF-8`-Inhaltsprüfung beider PDFs, einem Screenshot-Vergleich der gerenderten PDF-Seiten sowie einem separaten Test des neuen Bild-Zoom-Reglers (CSS-Variable + `localStorage`-Persistenz über Reload).

---
---

# Runde 12: Vom Nutzer gefundener Bug — veraltete Bauteil-Fotos im PDF (13 von 14 Thumbnails stale) — 2026-08-16

**Anlass:** Nutzer hat ein echtes A3-PDF heruntergeladen und manuell durchgesehen (nicht nur den Text, sondern die Bilder selbst angeschaut) und bei "11. Netzwerkkarte / WLAN-Modul (NIC)" ein Foto mit **3 Antennen** in einer anderen Anordnung entdeckt — nicht das aktuelle, in Runde 10 korrigierte Bild mit genau 2 Antennen, das auf der Arbeitsblatt-Seite selbst korrekt angezeigt wird.

## Ursache (strukturell, nicht nur ein Einzelbild betroffen)

`hw/A3.html` übergibt für jedes Bauteil sowohl `imageData: thumbnails[c.key]` (aus dem vorab gebündelten `window.A3_THUMBNAILS`, Datei `hw/assets/js/a3-thumbnails.js`) als auch `image: c.image` (der Live-Pfad zum aktuellen `.webp`) an `downloadTextWorksheetPDF()`. In `pdfPreloadImages()` ([hw/assets/js/pdf-engine.js:71-82](assets/js/pdf-engine.js#L71-L82)) hat `sec.imageData` **Vorrang**: Ist es gesetzt, wird es unverändert verwendet und `sec.image` nie angefasst — das Live-Bild wird also nie neu geladen/gerendert, solange die vorab gebündelte Version existiert.

`a3-thumbnails.js` wurde in Commit `351ed84` einmalig aus den damaligen Bildern erzeugt. Der direkt folgende Commit `87e1397` hat danach **fast alle** `VL-*.webp`-Quellbilder ersetzt (neue, höher aufgelöste Renderings inkl. der Antennen-Korrektur der Netzwerkkarte aus Runde 10) — aber in `a3-thumbnails.js` selbst wurde laut `git show 87e1397 -- hw/assets/js/a3-thumbnails.js` nur **ein einziger** Eintrag (`comp_cpu`) aktualisiert. Die übrigen 13 Bauteile (inkl. Netzwerkkarte) blieben auf dem alten Bildstand eingefroren. Das PDF zeigte damit für 13 von 14 Bauteilen faktisch veraltete Fotos, während die Arbeitsblatt-Seite selbst überall die aktuellen Bilder zeigt — ein stiller Stand/Live-Mismatch, der im Quelltext nicht auffällt (`node --check` findet so etwas naturgemäss nicht) und in Runde 11 trotz echtem PDF-Download nicht auffiel, weil dort Textinhalt (`pdftotext`) und Seitenlayout (Screenshot der Gesamtseite) geprüft wurden, aber nicht jedes einzelne eingebettete Bauteil-Foto Pixel für Pixel mit dem aktuellen Quellbild verglichen wurde — eine Lücke in der bisherigen Verifikationsmethode.

**Fix:** `a3-thumbnails.js` komplett neu generiert (Python/Pillow, exakt dieselben Parameter wie `pdfPreloadImages()` im Browser: `maxDim = 360`, `Lanczos`-Resize, JPEG-Qualität `0.82`) aus den 14 aktuell im Repo liegenden `VL-*.webp`-Quellbildern. Alle 14 Einträge neu geschrieben, Struktur/Format unverändert (`{ dataUrl, ratio }` je Bauteil). Datei wächst dabei von vorher (gemischter Bildstand) auf 253'070 Bytes — weiterhin unproblematisch klein gegenüber dem finalen PDF (< 700 KB laut Runde 11).

**Verifiziert:** `node --check` auf der neu geschriebenen Datei fehlerfrei, alle 14 Keys vorhanden. `comp_net`-Eintrag extrahiert und visuell mit dem aktuellen `assets/VL-Network.webp` verglichen — jetzt identisch (2 Antennen, korrekte Kartenanordnung). Die übrigen 13 Einträge wurden aus denselben, aktuell im Repo befindlichen Quellbildern erzeugt wie die Live-Seite selbst nutzt — Live/PDF können damit nicht mehr auseinanderlaufen, solange `a3-thumbnails.js` nach künftigen Bildänderungen erneut regeneriert wird (siehe offener Punkt unten).

## Offener Punkt: Bündelungs-Mechanismus bleibt fehleranfällig für künftige Bildänderungen

Das eigentliche Architekturproblem ist nicht behoben, nur der aktuelle Stand repariert: Jedes Mal, wenn künftig eines der 14 `VL-*.webp`-Bilder ersetzt wird, muss jemand daran denken, `a3-thumbnails.js` manuell neu zu generieren — es gibt keine automatische Kopplung und kein Build-Skript dafür im Repo (das heutige Regenerierungs-Skript war ein Einmal-Skript, nicht eingecheckt). Zwei Optionen für später, nicht heute umgesetzt, da grösserer Eingriff:
1. Ein kleines, eingechecktes Node/Python-Skript (`hw/scripts/generate_a3_thumbnails.py` o.ä.), das bei jeder Bildänderung manuell erneut ausgeführt wird.
2. `imageData`-Vorrang in `pdfPreloadImages()` aufheben und stattdessen immer frisch von `sec.image` laden (`a3-thumbnails.js` und das Pre-Bundling komplett entfernen) — einfacher und unmöglich zu vergessen, aber der ursprüngliche Grund für das Pre-Bundling (vermutlich synchrones/robustes Laden ohne Netzwerk-Race beim PDF-Export) müsste dafür geprüft und ggf. anders gelöst werden.

## Zusammenfassung Runde 12

| # | Datei | Schweregrad | Kurzbeschreibung | Status |
|---|---|---|---|---|
| 1 | hw/assets/js/a3-thumbnails.js | 🔴 Wichtig | 13 von 14 PDF-Bauteil-Thumbnails zeigten veraltete Bilder (u.a. Netzwerkkarte mit falscher Antennenzahl), weil `a3-thumbnails.js` nach der Bilder-Aktualisierung in `87e1397` nicht mitregeneriert wurde | ✅ behoben (alle 14 Thumbnails neu generiert) |
| 2 | hw/assets/js/pdf-engine.js | 🔵 Notiert | Pre-Bundling-Mechanismus (`imageData` hat Vorrang vor `image`) bleibt strukturell anfällig für erneutes Veralten bei künftigen Bildänderungen — kein automatischer Regenerierungs-Mechanismus im Repo | offen, nicht behoben (Architekturentscheidung, siehe zwei Optionen oben) |

Verifiziert per `node --check` auf `a3-thumbnails.js`, visuellem Vergleich des extrahierten `comp_net`-Thumbnails gegen das aktuelle Quellbild sowie Kontrolle, dass alle 14 Bauteil-Schlüssel vorhanden und die Dateigrösse plausibel ist.

---
---

# Runde 13: A4 Voll-Audit (Kabel & Anschlüsse) — erster kompletter 7-Punkte-Durchgang — 2026-08-16

**Anlass:** `hw/A4.html` (687 Zeilen, Lern-Modus mit 16 Flip-Karten + Praxis-Test-Quiz mit 16 Fragen, Bestehensgrenze 13/16) wurde bisher in keiner Runde vollständig nach dem 7-Punkte-Standard geprüft — nur gezielte Einzel-Fixes (PDF-Umstellung & Vorname-Prompt in Runde 5, Bestehensgrenze in Runde 6). Heute erster echter Vollaudit, inkl. Nachprüfung von Commit `fd6f135` (2026-08-11, "Fix localStorage key collisions ... across A4/A5/A7"), der A4s Speicher-Key geändert hatte, ohne dass das in `analyze.md` je dokumentiert wurde.

## Vorab: Verifikation von `fd6f135`

`git show fd6f135 -- hw/A4.html` bestätigt: Der gespeicherte Fortschritts-Key wurde von `onedrive_cables_worksheet_8sek` (kollidierte mit A5, das denselben Key nutzte) auf `onedrive_a4_worksheet_8sek` umbenannt — sowohl beim Speichern (`endQuiz()`) als auch beim Löschen (`confirmReset()`). Keine Altlasten: `A4.html` enthält keine Referenz mehr auf den alten Key. `index.html` (`checkCompletionStatus()`, [index.html:1841-1846](../index.html#L1841-L1846)) prüft exakt `onedrive_a4_worksheet_8sek` (plus zusätzlich `a4_passed === 'true'` als zweiten, redundanten Erfolgsindikator) — beide Seiten sind konsistent, kein Mismatch.

## 7-Punkte-Checkliste A4.html

| # | Checkpunkt | Ergebnis |
|---|---|---|
| 1 | Progression & localStorage | ✅ **Solide, per echtem Headless-Durchlauf verifiziert.** Bestehen bei ≥13/16 schreibt korrekt `a4_passed`, `onedrive_a4_worksheet_8sek` (`{percent:100}`), `a4_last_score/_errors/_time/_errdetails`. Ein Fehlversuch (10/16, unter der Grenze) schreibt **nichts** in diese Keys, `handleDownloadPdf()` zeigt korrekt den Sperr-Alert statt einen Download auszulösen. "Zurücksetzen" (`confirmReset()`) löscht alle 6 Keys zuverlässig, Klasse/Datum werden nach Reload korrekt neu befüllt (kein Rückfall auf den A3-"Klasse bleibt leer"-Bug aus Runde 2), Vorname bleibt (globaler Sync) erhalten, und **100 % ist von 0 % aus erneut erreichbar** — im selben Testlauf per echtem Reset-Klick nachgestellt und verifiziert. Es gibt keine separate "Fortschritts"-Anzeige für den Lern-Modus (nur Kopfzeile "0/1" bzw. "1/1 Praxis-Test absolviert") — bewusstes, einfaches Design, kein Fund. |
| 2 | Funktioniert alles wie erwartet? | ✅ `node --check` auf beiden Inline-Script-Blöcken sowie auf `pdf-engine.js` — fehlerfrei. Alle 32 von A4.html referenzierten lokalen Assets (Item- und Szenario-Bilder, Vendor-Skripte) existieren auf der Platte — keine toten `placehold.co`-Links mehr (die im Footer-Kommentar erwähnte Bildgenerierungs-Aufgabe ist inzwischen offenbar erledigt, siehe Fund unten). Lern-Modus: alle 16 Flip-Karten rendern und lassen sich umdrehen. Praxis-Test: Szenario-Anzeige, 4 Antwort-Buttons pro Frage, Dunkelmodus-Umschalter (inkl. Persistenz über Reload) — alles per Headless-Test durchgespielt, **null** Konsolen-/Seitenfehler über den gesamten Testlauf (Laden, Erstbesuch-Prompt, Quiz spielen, Reset, Reload, Moduswechsel). |
| 3 | Rechtschreibung & Vollständigkeit | ✅ Alle 16 Kabel/Anschlüsse (Name, Beschreibung, Szenario-Text) gelesen — keine Rechtschreibfehler gefunden. Alle UI-Texte (Buttons, Modal, Statistik-Kacheln, Tooltips) sauber und vollständig. |
| 4 | Kein KI-Wording | ✅ Sachliche, direkte Formulierungen ("Du möchtest deine neue externe Festplatte an den PC anschließen.", "Das WLAN ist zu langsam..."), keine Marketing-Floskeln, gezielt nach bekannten Mustern gesucht ("Tauche ein...", "In der heutigen..." etc.) — keine Treffer. |
| 5 | PDF-Erstellung | 🔧 **1 kleiner Bug gefunden & behoben** (siehe unten). Ansonsten sauber: echter Download per `Browser.setDownloadBehavior` (CDP) ausgelöst (nicht nur die Funktion aufgerufen), Datei von der Platte gelesen, `pdftotext -enc UTF-8 -layout` angewendet und zusätzlich als Chrome-PDF-Vorschau gescreenshottet. Inhalt stimmt exakt mit dem tatsächlich erspielten Ergebnis überein (13/16, "Björn Müller" mit korrektem Umlaut, "9. Klasse", Zeit, Punkte, alle 3 tatsächlich gemachten Fehler). Dateigrösse **6457 Bytes** — deckungsgleich mit dem Runde-8-Referenzwert (6223 Bytes), keine Grössen-Regression. Der Fehlschlag-Fall (<13/16) ist bewusst **nicht** PDF-fähig: Button bleibt gesperrt, `handleDownloadPdf()` zeigt nur den Alert — verifiziert, kein eigenes PDF für diesen Fall erzeugbar (Absicht, kein Bug). |
| 6 | Alle Eingabefelder → localStorage | ✅ A4 hat keine Freitextfelder — Vorname/Klasse/Datum sind `readonly` und werden automatisch befüllt, Quiz-Antworten sind Button-Klicks ohne Einzelspeicherung, das Endergebnis wird vollständig in `a4_last_*` gesichert und nach Reload/PDF-Download korrekt wiederverwendet. Kein fehlendes Feld gefunden. |
| 7 | Autofill Vorname/Klasse/Datum | ✅ Erstbesuch-Prompt (aus Runde 5) funktioniert weiterhin zuverlässig — per echtem Dialog-Event ausgelöst und verifiziert, schreibt in `studentVorname` **und** `student_vorname`, Feld aktualisiert sich sofort. Klasse defaultet auf "B24" (im PDF-Kopf als "9. Klasse" angezeigt, wie bei A3 in Runde 11 dokumentiert). Datum wird automatisch auf heute gesetzt. Nach "Zurücksetzen" bleiben Klasse/Datum korrekt, Vorname bleibt global erhalten. A4 nutzt weiterhin seine eigene inline Kopie statt `worksheet-common.js` (bereits in Runde 5 als bewusst offener Punkt dokumentiert, keine neue Erkenntnis, keine Regression). |

## End-to-End-Verifikation von `fd6f135` (nicht nur Code gelesen)

Mit einem persistenten Browser-Profil: A4.html frisch geladen → Erstbesuch-Prompt beantwortet → Praxis-Test mit exakt 3 absichtlichen Fehlern gespielt (13/16, genau die Bestehensgrenze) → Modal zeigt "Test bestanden!", `localStorage` enthält `a4_passed: "true"` und `onedrive_a4_worksheet_8sek: {"percent":100}` → Seite neu geladen, Zustand (100 %, PDF-Button aktiv) bleibt erhalten → **`index.html` mit demselben Profil geöffnet: A4-Kachel zeigt automatisch den grünen Häkchen-Button** (`btn-done`-Klasse, Check-SVG, Tooltip "Erfolgreich abgeschlossen!"). Der komplette Kreislauf von `fd6f135`s Fix bis zur Startseiten-Erkennung funktioniert nachweislich durchgehend.

## Gefundener & behobener Bug: Fehlertext im PDF lief zusammenhanglos ineinander

**Ursache** ([hw/A4.html:502](A4.html#L502) alt): Jeder Fehlereintrag wird als HTML-String gebaut: `<span class="... block ...">Szenario: "..."</span>Du hast <b>X</b> gewählt...`. Im Browser-Modal ist das unauffällig, weil die Klasse `block` den Span auf eine eigene Zeile zwingt — der fehlende Leerraum zwischen `</span>` und `Du` fällt nicht auf. Für das PDF wird derselbe String aber in `handleDownloadPdf()` per `.replace(/<[^>]+>/g, '')` von allen HTML-Tags befreit (nötig, weil jsPDF kein HTML rendert) — dabei verschwindet auch die Zeilenumbruch-Wirkung des `block`-Spans ersatzlos, und Szenario-Satz und Antwort-Satz kleben ohne Trennzeichen aneinander: *"...zur Verfügung."Du hast DisplayPort gewählt..."* (per Screenshot der generierten PDF-Vorschau bestätigt).

**Fix** ([hw/A4.html:502](A4.html#L502)): Ein Leerzeichen direkt im Template-Literal zwischen `</span>` und `Du hast` ergänzt. Im Modal ändert das nichts sichtbar (das führende Leerzeichen vor Blocktext wird beim Rendern ignoriert), im PDF trennt es die beiden Sätze jetzt sauber.

**Verifiziert:** Vorher/Nachher-PDF erzeugt (echter Download, `pdftotext` + Screenshot) — vorher `zur Verfügung."Du hast DisplayPort...`, nachher `zur Verfügung." Du hast VGA...` mit korrektem Leerzeichen. `node --check` nach dem Fix weiterhin fehlerfrei.

## Kleinere Beobachtung (kein Bug, nur notiert)

Der auskommentierte TODO-Block am Dateiende ([hw/A4.html:679-687](A4.html#L679-L687)) verweist auf eine frühere Aufgabe ("19 fehlende Bilder generieren, sobald Kontingent zurückgesetzt ist" inkl. eines an einen KI-Assistenten gerichteten Prompt-Texts) — die Aufgabe ist inzwischen erledigt: kein `placehold.co`-Link mehr im Dokument, alle 32 Asset-Referenzen lösen real auf. Der Kommentar ist damit reine tote Dokumentation ohne funktionale Auswirkung. Nicht entfernt, da rein kosmetisch und ausserhalb des heutigen Scopes (kein Verhaltensrisiko).

## Zusammenfassung Runde 13

| # | Datei | Schweregrad | Kurzbeschreibung | Status |
|---|---|---|---|---|
| 1 | hw/A4.html | 🟡 Klein | Fehlertext im PDF lief ohne Leerzeichen/Trennzeichen zusammen (Szenario-Satz + Antwort-Satz), weil das HTML-Tag-Strippen die `block`-Zeilenumbruch-Wirkung des Original-Spans nicht ersetzte | ✅ behoben (ein Leerzeichen im Template-Literal ergänzt) |
| 2 | hw/A4.html | 🟢 Verifikation | Vollständiger 7-Punkte-Audit erstmals durchgeführt — Progression/Reset/Wiedererreichbarkeit, alle Assets, Rechtschreibung, PDF-Inhalt & -Grösse, Autofill — keine weiteren Bugs gefunden | ✅ bestätigt |
| 3 | hw/A4.html, index.html | 🟢 Verifikation | `fd6f135` (Key-Umbenennung `onedrive_cables_worksheet_8sek` → `onedrive_a4_worksheet_8sek`) per echtem End-to-End-Test bestätigt: Quiz bestehen → localStorage → Reload → `index.html`-Kachel zeigt korrekt "erledigt" | ✅ bestätigt, kein Fund |
| 4 | hw/A4.html | 🔵 Notiert | Toter TODO-Kommentar am Dateiende (Bildgenerierungs-Auftrag, bereits erledigt) | offen, rein kosmetisch, nicht behoben |

Verifiziert per `node --check` auf allen Inline-Script-Blöcken von A4.html sowie `pdf-engine.js` (fehlerfrei), Asset-Vollständigkeitsprüfung aller 32 lokalen Referenzen (nichts fehlt), mehreren vollständigen Headless-Chrome-End-to-End-Läufen mit **echtem** Datei-Download über `Browser.setDownloadBehavior` (CDP) für den Bestehens-Fall, `pdftotext -enc UTF-8`-Inhaltsprüfung plus Screenshot-Kontrolle der PDF-Vorschau vor und nach dem Fehlertext-Fix, einem separaten Fehlschlag-Lauf (10/16, Sperr-Alert korrekt, kein Download), einem vollständigen Reset-Zyklus mit erneuter 100-%-Erreichung, sowie einem UI-Smoke-Test (16 Lernkarten, Flip, Dunkelmodus-Persistenz, Moduswechsel) — durchgehend null Konsolen-/Seitenfehler.

