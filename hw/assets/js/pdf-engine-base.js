/*
 * Standalone PDF direct-download engine (native jsPDF text, no window.print()).
 * Draws real PDF text/lines/rectangles via jsPDF's own drawing API - NOT an
 * HTML canvas rasterized into a per-page image. Rasterizing full pages as PNG
 * (the first version of this file) produced multi-page worksheets in the
 * double-digit megabytes for pure text content, because every page - even
 * ones with nothing but a few lines of text - was a full-resolution
 * screenshot. Native text is typically kilobytes regardless of page count,
 * and is selectable/searchable/copyable as a side benefit.
 *
 * Trade-off: the 14 standard PDF fonts (Helvetica etc.) only support the
 * Latin-1 range (covers German umlauts ä/ö/ü/ß fine) - no emoji, no bullet
 * "•". pdfSafeText() strips anything outside that range so unsupported
 * glyphs never silently corrupt layout; callers should avoid emoji in
 * strings passed here and use "·" (middle dot, U+00B7) instead of "•" for
 * separators.
 *
 * Deliberately has zero page-lifecycle side effects (no DOMContentLoaded
 * listeners, no globals besides the functions below) so it can be included
 * on any worksheet - including ones that don't use worksheet-common.js -
 * without risking double-initialization.
 */

var PDF_PAGE_W = 210;   // A4 portrait, mm
var PDF_PAGE_H = 297;
var PDF_MARGIN = 18;

function pdfSafeText(str) {
    var s = String(str == null ? '' : str)
        // Typografische Zeichen (aus Word-Copy-Paste, Emoji-Trennzeichen, etc.), die es in
        // WinAnsiEncoding/Latin-1 nicht gibt, durch ASCII-Entsprechungen ersetzen, statt sie
        // ersatzlos zu verschlucken:
        .replace(/[‒-―]/g, '-')      // Gedankenstriche -> Bindestrich
        .replace(/[‘’]/g, "'")       // typografische einfache Anfuehrungszeichen
        .replace(/[“”]/g, '"')       // typografische doppelte Anfuehrungszeichen
        .replace(/…/g, '...')             // Ellipse
        .replace(/•/g, '-')               // Aufzaehlungspunkt -> Bindestrich
        .replace(/↔/g, '<->')             // Pfeil links-rechts
        .replace(/→/g, '->')              // Pfeil rechts
        .replace(/←/g, '<-');             // Pfeil links

    return s
        .replace(/[^\x00-\xFF\n]/g, '') // alles ausserhalb Latin-1 verwerfen (u.a. Emoji)
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

function pdfWrapText(pdf, text, maxWidth, fontSize, fontStyle) {
    if (fontStyle) pdf.setFont('helvetica', fontStyle);
    if (fontSize) pdf.setFontSize(fontSize);
    var paragraphs = pdfSafeText(text).split('\n');
    var lines = [];
    paragraphs.forEach(function (para) {
        if (para.trim() === '') { lines.push(''); return; }
        pdf.splitTextToSize(para, maxWidth).forEach(function (l) { lines.push(l); });
    });
    return lines;
}

function pdfEnsureJsPdfLoaded(callback) {
    if (window.jspdf) { callback(); return; }
    var script = document.createElement('script');
    script.src = 'assets/js/jspdf.umd.min.js';
    script.onload = callback;
    document.head.appendChild(script);
}

function pdfPreloadImages(sections, callback) {
    var imagesToLoad = [];
    (sections || []).forEach(function (sec) {
        if (sec.imageData) {
            if (typeof sec.imageData === 'object' && sec.imageData.dataUrl) {
                sec._imgData = {
                    dataUrl: sec.imageData.dataUrl,
                    ratio: sec.imageData.ratio || (720 / 393)
                };
            } else {
                sec._imgData = {
                    dataUrl: sec.imageData,
                    ratio: (720 / 393)
                };
            }
        } else if (sec.image) {
            imagesToLoad.push(sec);
        }
    });

    if (imagesToLoad.length === 0) {
        callback();
        return;
    }

    var loadedCount = 0;
    function checkDone() {
        loadedCount++;
        if (loadedCount >= imagesToLoad.length) {
            callback();
        }
    }

    imagesToLoad.forEach(function (sec) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            try {
                var maxDim = 360;
                var w = img.naturalWidth || img.width || 300;
                var h = img.naturalHeight || img.height || 200;
                var scale = Math.min(1, maxDim / Math.max(w, h));
                var targetW = Math.max(1, Math.round(w * scale));
                var targetH = Math.max(1, Math.round(h * scale));

                var canvas = document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, targetW, targetH);
                var dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                sec._imgData = {
                    dataUrl: dataUrl,
                    ratio: targetW / targetH
                };
            } catch (e) {
                console.warn('Could not rasterize image for PDF:', sec.image, e);
                sec._imgData = null;
            }
            checkDone();
        };
        img.onerror = function () {
            console.warn('Image failed to load for PDF:', sec.image);
            sec._imgData = null;
            checkDone();
        };
        img.src = sec.image;
    });
}

/*
 * Rendert ein vollständiges Arbeitsblatt als direkt herunterladbares,
 * mehrseitiges PDF - kein window.print(), kein Druckdialog.
 *
 * opts = {
 *   title: 'Aufbau eines Computers',
 *   filenamePrefix: 'A3_Computeraufbau',
 *   sections: [
 *     { heading: '1. Prozessor (CPU)', image: 'assets/VL-CPU.webp', fields: [
 *       { label: 'Funktion', value: '...' },
 *       { label: 'Analogie', value: '...', optional: true }
 *     ] }
 *   ]
 * }
 */
function downloadTextWorksheetPDF(opts) {
    var studentName = (document.getElementById('studentName') || {}).value || '';
    var rawClass = (document.getElementById('studentClass') || {}).value || '';
    var studentClass = (!rawClass || rawClass === 'B24' || rawClass === 'B25') ? '9. Klasse' : rawClass;
    var studentDate = (document.getElementById('studentDate') || {}).value || '';

    pdfEnsureJsPdfLoaded(function () {
        pdfPreloadImages(opts.sections, function () {
            var jsPDF = window.jspdf.jsPDF;
            var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            var contentW = PDF_PAGE_W - PDF_MARGIN * 2;
            var y;

            function drawPageHeader(isFirst) {
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(10);
                pdf.setTextColor(15, 23, 42);
                pdf.text(pdfSafeText('Informatik 9. Klasse'), PDF_MARGIN, PDF_MARGIN);

                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(9);
                pdf.setTextColor(100, 116, 139);
                var classDisplay = studentClass.toLowerCase().includes('klasse') ? studentClass : ('Klasse ' + studentClass);
                var metaText = (studentName || 'Unbenannt') + '  ·  ' + classDisplay + '  ·  ' + studentDate;
                pdf.text(pdfSafeText(metaText), PDF_PAGE_W - PDF_MARGIN, PDF_MARGIN, { align: 'right' });

                pdf.setDrawColor(203, 213, 225);
                pdf.setLineWidth(0.3);
                pdf.line(PDF_MARGIN, PDF_MARGIN + 3, PDF_PAGE_W - PDF_MARGIN, PDF_MARGIN + 3);

                if (isFirst) {
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(18);
                    pdf.setTextColor(15, 23, 42);
                    pdf.text(pdfSafeText(opts.title), PDF_MARGIN, PDF_MARGIN + 13);
                    return PDF_MARGIN + 21;
                }
                return PDF_MARGIN + 10;
            }

            y = drawPageHeader(true);

            function newPage() {
                pdf.addPage();
                y = drawPageHeader(false);
            }

            function ensureSpace(neededHeight) {
                if (y + neededHeight > PDF_PAGE_H - PDF_MARGIN) newPage();
            }

            (opts.sections || []).forEach(function (section) {
                var hasImg = !!section._imgData;
                var imgRatio = (hasImg && section._imgData.ratio) ? section._imgData.ratio : (720 / 393);
                var thumbW = hasImg ? 85 : 0;
                var thumbH = hasImg ? Math.round((thumbW / imgRatio) * 10) / 10 : 0;
                var textOffsetLeft = hasImg ? (thumbW + 6) : 0;
                var textW = contentW - textOffsetLeft;

                // Berechne Gesamthöhe für den Block (Überschrift + ggf. Bild + Textfelder),
                // damit die Komponente niemals unschön mitten im Block über den Seitenumbruch gerissen wird.
                var headingLines = pdfWrapText(pdf, section.heading, contentW, 12, 'bold');
                var headingH = headingLines.length * 5.5 + 2;

                var textLinesTotal = 0;
                var fieldData = [];
                (section.fields || []).forEach(function (field) {
                    var value = pdfSafeText(field.value || '');
                    if (!value && field.optional) return;
                    var lines = pdfWrapText(pdf, value || '(keine Angabe)', textW - 2, 9.5, 'normal');
                    fieldData.push({ label: field.label, value: value, lines: lines });
                    textLinesTotal += (lines.length * 4.2) + 6.5;
                });

                var bodyH = hasImg ? Math.max(thumbH + 2, textLinesTotal) : textLinesTotal;
                var totalSectionH = headingH + bodyH + 6;

                ensureSpace(totalSectionH);

                // Überschrift
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(12);
                pdf.setTextColor(29, 78, 216);
                headingLines.forEach(function (line) {
                    pdf.text(line, PDF_MARGIN, y);
                    y += 5.5;
                });
                y += 1.5;

                var blockStartY = y;

                // Bauteil-Foto Thumbnail zeichnen (falls vorhanden)
                if (hasImg) {
                    try {
                        // Dezent abgerundeter Hintergrund/Rahmen
                        pdf.setFillColor(248, 250, 252);
                        pdf.roundedRect(PDF_MARGIN, blockStartY, thumbW, thumbH, 1.5, 1.5, 'F');
                        pdf.addImage(section._imgData.dataUrl, 'JPEG', PDF_MARGIN, blockStartY, thumbW, thumbH);
                        pdf.setDrawColor(203, 213, 225);
                        pdf.setLineWidth(0.2);
                        pdf.roundedRect(PDF_MARGIN, blockStartY, thumbW, thumbH, 1.5, 1.5, 'D');
                    } catch (err) {
                        console.warn('PDF image add failed:', err);
                    }
                }

                // Textfelder (Funktion & Analogie)
                var currentTextY = blockStartY;
                fieldData.forEach(function (f) {
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(8.5);
                    pdf.setTextColor(71, 85, 105);
                    pdf.text(pdfSafeText(f.label) + ':', PDF_MARGIN + textOffsetLeft, currentTextY + 3);
                    currentTextY += 4.2;

                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(9.5);
                    if (f.value) { pdf.setTextColor(15, 23, 42); } else { pdf.setTextColor(148, 163, 184); }
                    f.lines.forEach(function (line) {
                        pdf.text(line, PDF_MARGIN + textOffsetLeft, currentTextY + 3);
                        currentTextY += 4.2;
                    });
                    currentTextY += 2;
                });

                y = Math.max(blockStartY + thumbH, currentTextY) + 3;

                // Trennlinie
                pdf.setDrawColor(226, 232, 240);
                pdf.setLineWidth(0.2);
                pdf.line(PDF_MARGIN, y, PDF_PAGE_W - PDF_MARGIN, y);
                y += 4.5;
            });

            var safeName = pdfSafeText(studentName || 'Unbenannt').replace(/[^a-zA-Z0-9]/g, '_');
            pdf.save((opts.filenamePrefix || 'Arbeitsblatt') + '_' + safeName + '.pdf');
        });
    });
}

/*
 * Rendert ein kompaktes Ergebnis-Zertifikat (Kopf + Schüler-Info + beliebige
 * Ergebnis-Blöcke: Tabelle / Statistik-Kacheln / Zusammenfassung / Fliesstext)
 * als direkt herunterladbares PDF - kein window.print(). Gedacht für
 * Spiel-/Quiz-Auswertungen wie A1 (Memory) und A4 (Kabel-Quiz), im Gegensatz
 * zu downloadTextWorksheetPDF() für volle Arbeitsblätter mit Freitextfeldern.
 *
 * opts = {
 *   title: 'Leistungsnachweis - IT-Hardware Memory',
 *   subtitle: 'Informatische Bildung · IT-Hardware · A1',
 *   badge: 'Modi absolviert', badgeOk: true,
 *   filenamePrefix: 'A1_Leistungsnachweis',
 *   blocks: [
 *     { type: 'table', heading: '...', headers: [...], colWidths: [...], rows: [[...], ...] },
 *     { type: 'stats', items: [{ label, value, color }] },
 *     { type: 'summary', label: '...', value: '...', note: '...' },
 *     { type: 'text', heading: '...', lines: ['...'] }
 *   ]
 * }
 */
function downloadCertificatePDF(opts) {
    var studentName = (document.getElementById('studentName') || {}).value || 'Unbekannt';
    var rawClass = (document.getElementById('studentClass') || {}).value || '';
    var studentClass = (!rawClass || rawClass === 'B24' || rawClass === 'B25') ? '9. Klasse' : rawClass;
    var studentDate = (document.getElementById('studentDate') || {}).value || '';

    pdfEnsureJsPdfLoaded(function () {
        var jsPDF = window.jspdf.jsPDF;
        var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        var contentW = PDF_PAGE_W - PDF_MARGIN * 2;
        var y = PDF_MARGIN;

        function drawFooter() {
            var footerY = PDF_PAGE_H - PDF_MARGIN + 4;
            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.2);
            pdf.line(PDF_MARGIN, footerY - 5, PDF_PAGE_W - PDF_MARGIN, footerY - 5);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7);
            pdf.setTextColor(148, 163, 184);
            pdf.text(pdfSafeText('Generiert am ' + new Date().toLocaleString('de-CH') + '  ·  Digitaler Leistungsnachweis IB2026'), PDF_MARGIN, footerY);
            pdf.text(pdfSafeText('Unterschrift Lehrperson: ______________________'), PDF_PAGE_W - PDF_MARGIN, footerY, { align: 'right' });
        }

        function newPage() {
            drawFooter();
            pdf.addPage();
            y = PDF_MARGIN;
        }

        function ensureSpace(neededHeight) {
            if (y + neededHeight > PDF_PAGE_H - PDF_MARGIN - 12) newPage(); // -12: Platz fuer Fusszeile reservieren
        }

        // Kopfbereich: Titel/Untertitel links, Status-Badge rechts
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.setTextColor(15, 23, 42);
        pdf.text(pdfSafeText(opts.title), PDF_MARGIN, y + 6);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text(pdfSafeText(opts.subtitle || ''), PDF_MARGIN, y + 13);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        if (opts.badgeOk) { pdf.setTextColor(5, 150, 105); } else { pdf.setTextColor(220, 38, 38); }
        pdf.text(pdfSafeText(opts.badge || ''), PDF_PAGE_W - PDF_MARGIN, y + 6, { align: 'right' });

        y += 20;
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.3);
        pdf.line(PDF_MARGIN, y, PDF_PAGE_W - PDF_MARGIN, y);
        y += 10;

        // Schüler-Info-Zeile (Name / Klasse / Datum)
        var infoColW = contentW / 3;
        [['Schueler / Schuelerin', studentName], ['Klasse', studentClass], ['Datum', studentDate]].forEach(function (pair, i) {
            var x = PDF_MARGIN + i * infoColW;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(7);
            pdf.setTextColor(148, 163, 184);
            pdf.text(pdfSafeText(pair[0]).toUpperCase(), x, y);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(11);
            pdf.setTextColor(15, 23, 42);
            pdf.text(pdfSafeText(pair[1]), x, y + 6);
        });
        y += 16;

        (opts.blocks || []).forEach(function (block) {
            if (block.type === 'table') {
                if (block.heading) {
                    ensureSpace(8);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(11);
                    pdf.setTextColor(15, 23, 42);
                    pdf.text(pdfSafeText(block.heading), PDF_MARGIN, y);
                    y += 8;
                }
                var cols = block.headers.length;
                var colWidths = block.colWidths || block.headers.map(function () { return contentW / cols; });
                // Sicherheitsnetz: colWidths muessen in mm sein und zur contentW passen - eine
                // falsch skalierte (z.B. versehentlich in Pixel statt mm angegebene) Breitenliste
                // wuerde spaetere Spalten sonst lautlos ausserhalb der Seite zeichnen.
                var colWidthsSum = colWidths.reduce(function (a, b) { return a + b; }, 0);
                if (colWidthsSum > contentW * 1.05 || colWidthsSum < contentW * 0.5) {
                    var scale = contentW / colWidthsSum;
                    colWidths = colWidths.map(function (w) { return w * scale; });
                }
                var rowH = 8;

                ensureSpace(rowH);
                pdf.setFillColor(29, 78, 216);
                pdf.rect(PDF_MARGIN, y - 5.5, contentW, rowH, 'F');
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(8);
                pdf.setTextColor(255, 255, 255);
                var hx = PDF_MARGIN + 2;
                block.headers.forEach(function (h, i) {
                    pdf.text(pdfSafeText(h), hx, y);
                    hx += colWidths[i];
                });
                y += rowH;

                block.rows.forEach(function (row, ri) {
                    ensureSpace(rowH);
                    if (ri % 2 === 1) {
                        pdf.setFillColor(248, 250, 252);
                        pdf.rect(PDF_MARGIN, y - 5.5, contentW, rowH, 'F');
                    }
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(8);
                    pdf.setTextColor(30, 41, 59);
                    var cx = PDF_MARGIN + 2;
                    row.forEach(function (cell, i) {
                        pdf.text(pdfSafeText(String(cell)), cx, y);
                        cx += colWidths[i];
                    });
                    y += rowH;
                });
                y += 6;

            } else if (block.type === 'stats') {
                ensureSpace(18);
                var n = block.items.length;
                var sw = contentW / n;
                block.items.forEach(function (item, i) {
                    var cx = PDF_MARGIN + i * sw + sw / 2;
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(7);
                    pdf.setTextColor(148, 163, 184);
                    pdf.text(pdfSafeText(String(item.label)).toUpperCase(), cx, y, { align: 'center' });
                    var c = item.color ? pdfHexToRgb(item.color) : [15, 23, 42];
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(15);
                    pdf.setTextColor(c[0], c[1], c[2]);
                    pdf.text(pdfSafeText(String(item.value)), cx, y + 8, { align: 'center' });
                });
                y += 20;

            } else if (block.type === 'summary') {
                ensureSpace(18);
                pdf.setFillColor(239, 246, 255);
                pdf.rect(PDF_MARGIN, y - 5, contentW, 16, 'F');
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(8);
                pdf.setTextColor(15, 23, 42);
                pdf.text(pdfSafeText(block.label || ''), PDF_MARGIN + 3, y);
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(7);
                pdf.setTextColor(71, 85, 105);
                pdf.text(pdfSafeText(block.note || ''), PDF_MARGIN + 3, y + 6);
                if (block.value) {
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(13);
                    pdf.setTextColor(29, 78, 216);
                    pdf.text(pdfSafeText(block.value), PDF_PAGE_W - PDF_MARGIN - 3, y + 3, { align: 'right' });
                }
                y += 20;

            } else if (block.type === 'text') {
                if (block.heading) {
                    ensureSpace(6);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10);
                    pdf.setTextColor(190, 18, 60);
                    pdf.text(pdfSafeText(block.heading), PDF_MARGIN, y);
                    y += 6;
                }
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(9);
                pdf.setTextColor(51, 65, 85);
                (block.lines || []).forEach(function (line) {
                    pdfWrapText(pdf, line, contentW - 3).forEach(function (l) {
                        ensureSpace(5);
                        pdf.text(l, PDF_MARGIN + 3, y);
                        y += 5;
                    });
                    y += 1.5;
                });
                y += 2;
            }
        });

        drawFooter();

        var safeName = pdfSafeText(studentName || 'Unbenannt').replace(/[^a-zA-Z0-9]/g, '_');
        pdf.save((opts.filenamePrefix || 'Zertifikat') + '_' + safeName + '.pdf');
    });
}

function pdfHexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [15, 23, 42];
}
