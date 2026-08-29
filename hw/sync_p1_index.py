from pathlib import Path

INDEX = Path('index.html')
html = INDEX.read_text(encoding='utf-8')

if 'href="hw/P1.docx"' in html:
    print('P1 download already present in index')
    raise SystemExit(0)

anchor = '''    <!-- Unterkachel: A14 Green-IT-Challenge -->
    <div class="unterkachel task-card">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
        <div>
          <h4 class="unterkachel-title" id="title-A14" style="margin-bottom: 2px;">
             <span class="task-number">A14</span><span class="task-name">Green-IT-Challenge</span>
          </h4>
        </div>
        <a href="hw/A14.html" target="_blank" rel="noopener" class="btn-link" title="In neuem Tab öffnen" aria-label="In neuem Tab öffnen"></a>
      </div>
    </div>'''

p1 = '''

    <!-- Übungsprüfung: P1 DOCX -->
    <div class="unterkachel task-card">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
        <div>
          <h4 class="unterkachel-title" id="title-P1" style="margin-bottom: 2px;">
             <span class="task-number">P1</span><span class="task-name">Übungsprüfung Hardware</span>
          </h4>
        </div>
        <a href="hw/P1.docx" download="P1_Uebungspruefung_Hardware.docx" class="btn-link" title="Übungsprüfung herunterladen" aria-label="Übungsprüfung als DOCX herunterladen"><span class="btn-status-text">DOCX ↓</span></a>
      </div>
    </div>'''

if html.count(anchor) != 1:
    raise RuntimeError(f'Expected A14 card exactly once, found {html.count(anchor)}')

html = html.replace(anchor, anchor + p1, 1)
INDEX.write_text(html, encoding='utf-8')
print('Added direct P1 DOCX download to index')
