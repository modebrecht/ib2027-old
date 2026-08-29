// XP Engine & Gamification System for Tastenkombinationen (Class B25)

const XP_STORAGE_KEY = 'tk_global_xp_v1';
const QUEST_SCORES_KEY = 'tk_quest_scores_v1';
const STUDENT_NAME_KEY = 'tk_student_name_v1';
const QUEST_XP_BEST_KEY = 'tk_quest_xp_best_v1';

// INITIALIZE LOCALSTORAGE
function getGlobalXP() {
    return parseInt(localStorage.getItem(XP_STORAGE_KEY) || '0', 10);
}

function setGlobalXP(val) {
    localStorage.setItem(XP_STORAGE_KEY, Math.max(0, val).toString());
    updateXPDisplays();
}

function addGlobalXP(amount) {
    let current = getGlobalXP();
    setGlobalXP(current + amount);
}

function getQuestScores() {
    try {
        return JSON.parse(localStorage.getItem(QUEST_SCORES_KEY) || '{}');
    } catch(e) {
        return {};
    }
}

function saveQuestScore(questId, percentage) {
    let scores = getQuestScores();
    scores[questId] = Math.max(scores[questId] || 0, percentage);
    localStorage.setItem(QUEST_SCORES_KEY, JSON.stringify(scores));
}

function getQuestXpBest() {
    try {
        return JSON.parse(localStorage.getItem(QUEST_XP_BEST_KEY) || '{}');
    } catch(e) {
        return {};
    }
}

function awardQuestImprovementXP(questId, correctCount, xpPerNewCorrect = 5) {
    const bestByQuest = getQuestXpBest();
    const previousBest = Math.max(0, parseInt(bestByQuest[questId] || '0', 10));
    const currentCorrect = Math.max(0, parseInt(correctCount || '0', 10));
    const improvement = Math.max(0, currentCorrect - previousBest);

    if (currentCorrect > previousBest) {
        bestByQuest[questId] = currentCorrect;
        localStorage.setItem(QUEST_XP_BEST_KEY, JSON.stringify(bestByQuest));
    }

    const awardedXP = improvement * Math.max(0, xpPerNewCorrect);
    if (awardedXP > 0) addGlobalXP(awardedXP);
    return awardedXP;
}

function getStudentName() {
    return (localStorage.getItem(STUDENT_NAME_KEY) || '').trim();
}

function saveStudentName(name) {
    const trimmedName = (name || '').trim();
    if (trimmedName) {
        localStorage.setItem(STUDENT_NAME_KEY, trimmedName);
    }
    return trimmedName;
}

function requireStudentName() {
    const savedName = getStudentName();
    if (savedName) return savedName;

    const enteredName = prompt("Bitte gib deinen Vornamen ein:", "");
    if (enteredName === null) return '';

    const studentName = saveStudentName(enteredName);
    if (!studentName) {
        alert("Bitte gib einen Vornamen ein.");
        return '';
    }
    return studentName;
}

function sanitizeStudentNameForFileName(name) {
    return (name || '')
        .replace(/Ä/g, 'Ae')
        .replace(/Ö/g, 'Oe')
        .replace(/Ü/g, 'Ue')
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

// CONSISTENT, STUDENT-FRIENDLY COURSE LANGUAGE
// Keep the gamification structure (Quest + XP), but avoid exaggerated game/AI wording.
const TK_TEXT_REPLACEMENTS = [
    ['A1: Praxiskurs - Allgemeine Tastenkürzel', 'A1: Allgemeine Tastenkürzel'],
    ['A2: Praxiskurs - Sonderzeichen (AltGr - CH-Layout)', 'A2: Sonderzeichen mit AltGr'],
    ['A3: Mission Maus weglegen - Boss Challenge', 'A3: Praxisaufgabe – Maus weglegen'],
    ['Arbeitsblatt A3: Mission: Maus weglegen', 'Praxisaufgabe – Maus weglegen'],
    ['Arbeitsblatt A3 (Mission: Maus weglegen)', 'Praxisaufgabe – Maus weglegen'],
    ['Boss-Challenge "Maus weglegen"', 'Praxisaufgabe – Maus weglegen'],
    ['Boss-Challenge (A3.html)', 'Praxisaufgabe A3'],
    ['Boss Challenge A3', 'Praxisaufgabe A3'],
    ['Boss-Challenge A3', 'Praxisaufgabe A3'],
    ['Boss Challenge', 'Praxisaufgabe'],
    ['Boss-Challenge', 'Praxisaufgabe'],
    ['Mission: Maus weglegen', 'Praxisaufgabe – Maus weglegen'],
    ['Memory Mode – Aus dem Gedächtnis:', 'Aus dem Gedächtnis:'],
    ['Memory Mode', 'Aus dem Gedächtnis'],
    ['Geführter Mode', 'Geführt'],
    ['AltGr Geführt', 'Geführt'],
    ['50/50 Mode', 'Kürzel-Rätsel'],
    ['50/50 Rätsel', 'Kürzel-Rätsel'],
    ['Blind-Profi-Modus', 'Übung ohne Hilfe'],
    ['Blind-Profi', 'Ohne Hilfe'],
    ['Gedächtnis-Test', 'Test aus dem Gedächtnis'],
    ['Blind-Test', 'Test ohne Hilfe'],
    ['Überragend!', 'Geschafft!'],
    ['Super gemacht!', 'Geschafft!'],
    ['🇨🇭', ''],
    ['gemeistert!', 'geschafft!'],
    ['FREIGESCHALTET!', 'freigeschaltet.'],
    ['Neues Game', 'Neu starten'],
    ['Tastatur-Kürzel', 'Tastenkürzel'],
    ['Arbeitsblatt Download', 'Arbeitsblatt herunterladen'],
    ['originale Word-Arbeitsblatt', 'Word-Arbeitsblatt'],
    ['A1 Starten', 'A1 starten'],
    ['A2 Starten', 'A2 starten'],
    ['A3 Starten', 'A3 starten'],
    ['PDF Herunterladen', 'PDF herunterladen'],
    ['Zusammenfassung der Leistungswerte in den Praxiskursen:', 'Zusammenfassung der Ergebnisse aus den Übungen:'],
    ['Meistere alle Quests', 'Schliesse alle Quests ab'],
    ['Danach starten wir mit Quest 1 im Praxistrainer!', 'Danach startest du mit Quest 1 in der Übung!'],
    ['Kopieren, Einfügen, Rückgängig, Speichern, Ende und Suchen & Ersetzen.', 'Kopieren, Einfügen, Rückgängig, Speichern, Suchen und mehr.'],
    ['Suchen & Ersetzen', 'Suchen und Ersetzen'],
    ['Warte auf Tastatur-Eingabe...', 'Warte auf Tastatureingabe...'],
    ['freizuschalten!', 'freizuschalten.'],
    ['ist gesperrt!', 'ist gesperrt.'],
    ['noch gesperrt!', 'noch gesperrt.']
];

function normalizeTkText(text) {
    let normalized = text;

    TK_TEXT_REPLACEMENTS.forEach(([from, to]) => {
        normalized = normalized.split(from).join(to);
    });

    normalized = normalized
        .replace(/\s*\(A[1-4]\.html\)/g, '')
        .replace(/Quest (\d+) \((?:AltGr )?(Geführt|Kürzel-Rätsel|Ohne Hilfe)\)/g, 'Quest $1 – $2')
        .replace(/Q1: Geführt/g, 'Quest 1 – Geführt')
        .replace(/Q2: Kürzel-Rätsel/g, 'Quest 2 – Kürzel-Rätsel')
        .replace(/Q3: Ohne Hilfe/g, 'Quest 3 – Ohne Hilfe')
        .replace(/Q4: Geführt/g, 'Quest 4 – Geführt')
        .replace(/Q5: Kürzel-Rätsel/g, 'Quest 5 – Kürzel-Rätsel')
        .replace(/Q6: Ohne Hilfe/g, 'Quest 6 – Ohne Hilfe')
        .replace(/50\/50 (\d+) von/g, 'Rätsel $1 von')
        .replace(/Blind (\d+) von/g, 'Ohne Hilfe $1 von')
        .replace(/mindestens (\d+)% Genauigkeit/g, 'mindestens $1 % richtig')
        .replace(/Genauigkeit:\s*(\d+)%/g, 'Richtig: $1 %')
        .replace(/(\d+)% Genauigkeit/g, '$1 % richtig')
        .replace(/(\d+)%/g, '$1 %')
        .replace(/ {2,}/g, ' ');

    return normalized;
}

function applyTkLanguage(root) {
    if (!root) return;

    if (root.nodeType === Node.TEXT_NODE) {
        const parentTag = root.parentElement ? root.parentElement.tagName : '';
        if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parentTag)) return;
        if (!root.nodeValue || !root.nodeValue.trim()) return;

        const normalized = normalizeTkText(root.nodeValue);
        if (normalized !== root.nodeValue) root.nodeValue = normalized;
        return;
    }

    if (![Node.ELEMENT_NODE, Node.DOCUMENT_FRAGMENT_NODE].includes(root.nodeType)) return;
    if (root.nodeType === Node.ELEMENT_NODE && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(root.tagName)) return;

    root.childNodes.forEach(child => applyTkLanguage(child));
}

function applyTkPagePolish() {
    const page = location.pathname.split('/').pop() || 'index.html';

    if (page === 'A1.html') {
        document.body.classList.add('tk-page-a1');
        const headerLabel = document.querySelector('.top-bar > div:last-child > span:last-child');
        if (headerLabel && headerLabel.textContent.trim() === 'Arbeitsblatt A1') {
            headerLabel.classList.add('badge-a1');
        }
    }

    if (page === 'A2.html') {
        const q6Title = document.getElementById('q6-title');
        if (q6Title && !document.getElementById('q6-symbol-box')) {
            const symbolByTitle = {
                'Klammeraffe': '@',
                'Hashtag / Raute': '#',
                'Euro-Zeichen': '€',
                'Senkrechter Strich (Pipe)': '|',
                'Backslash': '\\',
                'Eckige Klammer auf': '[',
                'Eckige Klammer zu': ']',
                'Geschweifte Klammer auf': '{',
                'Geschweifte Klammer zu': '}',
                'Gradzeichen': '°'
            };

            const symbolBox = document.createElement('div');
            symbolBox.className = 'symbol-hero-box';
            symbolBox.id = 'q6-symbol-box';
            q6Title.parentNode.insertBefore(symbolBox, q6Title);

            const syncQ6Symbol = () => {
                symbolBox.textContent = symbolByTitle[q6Title.textContent.trim()] || '';
            };

            syncQ6Symbol();
            new MutationObserver(syncQ6Symbol).observe(q6Title, {
                subtree: true,
                childList: true,
                characterData: true
            });
        }
    }
}

function startTkLanguageNormalization() {
    document.title = normalizeTkText(document.title);
    applyTkLanguage(document.body);

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'characterData') {
                applyTkLanguage(mutation.target);
            } else {
                mutation.addedNodes.forEach(node => applyTkLanguage(node));
            }
        });
    });

    observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true
    });
}

function applyTkQuizAttemptPolish() {
    const page = location.pathname.split('/').pop() || '';
    if (!['A4.html', 'A5.html'].includes(page)) return;

    const questionsContainer = document.getElementById('questionsContainer');
    if (!questionsContainer) return;

    let shuffleScheduled = false;

    const randomizeVisibleQuestionOrder = () => {
        const cards = Array.from(questionsContainer.children)
            .filter((child) => child.classList && child.classList.contains('question-card'));
        if (cards.length < 2) return;

        const shuffledCards = cards
            .map((card) => ({ card, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map((entry) => entry.card);

        shuffledCards.forEach((card, index) => {
            card.style.order = String(index);
            const label = card.querySelector('.question-label');
            if (label) label.textContent = `Frage ${index + 1}`;
        });
    };

    const scheduleQuestionShuffle = () => {
        if (shuffleScheduled) return;
        shuffleScheduled = true;
        queueMicrotask(() => {
            shuffleScheduled = false;
            randomizeVisibleQuestionOrder();
        });
    };

    new MutationObserver((mutations) => {
        if (mutations.some((mutation) => mutation.type === 'childList')) {
            scheduleQuestionShuffle();
        }
    }).observe(questionsContainer, { childList: true });

    // Shuffle the questions already rendered before DOMContentLoaded.
    scheduleQuestionShuffle();

    if (page !== 'A4.html') return;

    const lessonCard = document.querySelector('.lesson-card');
    const checkBtn = document.getElementById('checkBtn');
    const setTabs = document.getElementById('setTabs');
    if (!lessonCard || !checkBtn) return;

    let wasRetryClick = false;

    // A retry starts from the "Neuer Versuch" button. Hide the theory before
    // A4 re-renders so the student has to retrieve the shortcuts from memory.
    checkBtn.addEventListener('click', () => {
        wasRetryClick = checkBtn.textContent.includes('Neuer Versuch');
        if (wasRetryClick) lessonCard.style.display = 'none';
    }, true);

    // After checking a retry, show the theory again so students can compare
    // their answers with the learning cards before deciding on another attempt.
    checkBtn.addEventListener('click', () => {
        const retryStarted = wasRetryClick;
        wasRetryClick = false;
        setTimeout(() => {
            if (!retryStarted) lessonCard.style.display = 'block';
        }, 0);
    });

    // Changing to another quest always restores that quest's theory cards.
    if (setTabs) {
        setTabs.addEventListener('click', (event) => {
            if (event.target.closest('.set-tab')) lessonCard.style.display = 'block';
        }, true);
    }
}

function isQuestUnlocked(questId) {
    let scores = getQuestScores();
    if (questId === 'q1') return true; // Quest 1 always unlocked
    if (questId === 'q2') return (scores.q1 || 0) >= 80;
    if (questId === 'q3') return (scores.q2 || 0) >= 70;
    if (questId === 'q4') return (scores.q3 || 0) >= 70;
    if (questId === 'q5') return (scores.q4 || 0) >= 80;
    if (questId === 'q6') return (scores.q5 || 0) >= 70;
    if (questId === 'q7') return (scores.q6 || 0) >= 70; // Legacy tk/A3 only; tk2/A3 is always open.
    return true;
}

// SECRET TEACHER CHEAT CODE
let teacherBuffer = "";
let teacherTimer = null;

document.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey) {
        const key = e.key.toUpperCase();
        if (['L', 'O', 'K'].includes(key)) {
            e.preventDefault(); // Block browser shortcut interference
            teacherBuffer += key;
            clearTimeout(teacherTimer);
            teacherTimer = setTimeout(() => { teacherBuffer = ""; }, 3500);

            if (teacherBuffer.endsWith("LOKLOK")) {
                teacherBuffer = "";
                unlockAllQuests();
            }
        }
    }
});

function unlockAllQuests() {
    let scores = { q1: 100, q2: 100, q3: 100, q4: 100, q5: 100, q6: 100, q7: 100, q8: 100, q9: 100, q10: 100, q11: 100, q12: 100, q13: 100, q14: 100 };
    localStorage.setItem(QUEST_SCORES_KEY, JSON.stringify(scores));
    addGlobalXP(500);
    alert("🔑 LEHRER-MODUS: Alle Quests freigeschaltet.");
    location.reload();
}

function updateXPDisplays() {
    const xpVal = getGlobalXP();
    document.querySelectorAll('.global-xp-val').forEach(el => {
        el.innerText = xpVal;
    });
}

// SOUND EFFECTS
function playSound(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'correct') {
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } else if (type === 'wrong') {
            osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
            osc.frequency.exponentialRampToValueAtTime(146.83, ctx.currentTime + 0.2); // D3
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } else if (type === 'hint') {
            osc.frequency.setValueAtTime(392.00, ctx.currentTime); // G4
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        }
    } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {
    updateXPDisplays();
    applyTkPagePolish();
    startTkLanguageNormalization();
    applyTkQuizAttemptPolish();
});

// PDF CERTIFICATE GENERATOR FOR TEACHER (1 PAGE SUMMARY)
function downloadCertificatePDF(studentName) {
    studentName = saveStudentName(studentName || getStudentName());

    if (!studentName) {
        studentName = requireStudentName();
    }

    if (!studentName) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 850;
    const ctx = canvas.getContext('2d');

    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 850);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 850);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 1140, 790);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(42, 42, 1116, 766);

    ctx.fillStyle = '#60a5fa';
    ctx.font = '800 20px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('INFORMATIK B25', 600, 95);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 38px "Space Grotesk", sans-serif';
    ctx.fillText('LEISTUNGSNACHWEIS TASTENKOMBINATIONEN (A1 - A3)', 600, 160);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 19px sans-serif';
    ctx.fillText('Zusammenfassung der Ergebnisse aus den Übungen:', 600, 205);

    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(250, 230, 700, 70, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    let nameFontSize = 30;
    ctx.font = `800 ${nameFontSize}px "Space Grotesk", sans-serif`;
    while (ctx.measureText(studentName).width > 640 && nameFontSize > 14) {
        nameFontSize -= 2;
        ctx.font = `800 ${nameFontSize}px "Space Grotesk", sans-serif`;
    }
    ctx.fillText(studentName, 600, 275);

    const currentXP = getGlobalXP();
    const today = new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
    ctx.fillStyle = '#f59e0b';
    ctx.font = '700 19px sans-serif';
    ctx.fillText(`⚡ Erreichte XP: ${currentXP} XP   •   Datum: ${today}`, 600, 340);

    const scores = getQuestScores();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(90, 370, 1020, 370, 20);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'left';

    ctx.fillStyle = '#38bdf8';
    ctx.font = '800 22px "Space Grotesk", sans-serif';
    ctx.fillText('Arbeitsblatt A1 (Allgemeine Tastenkürzel)', 130, 420);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 18px sans-serif';
    ctx.fillText(`• Quest 1 – Geführt: ${scores.q1 || 0} %`, 150, 465);
    ctx.fillText(`• Quest 2 – Kürzel-Rätsel: ${scores.q2 || 0} %`, 150, 505);
    ctx.fillText(`• Quest 3 – Ohne Hilfe: ${scores.q3 || 0} %`, 150, 545);

    ctx.fillStyle = '#fde047';
    ctx.font = '800 22px "Space Grotesk", sans-serif';
    ctx.fillText('Arbeitsblatt A2 (Sonderzeichen mit AltGr)', 630, 420);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 18px sans-serif';
    ctx.fillText(`• Quest 4 – Geführt: ${scores.q4 || 0} %`, 650, 465);
    ctx.fillText(`• Quest 5 – Kürzel-Rätsel: ${scores.q5 || 0} %`, 650, 505);
    ctx.fillText(`• Quest 6 – Ohne Hilfe: ${scores.q6 || 0} %`, 650, 545);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(130, 580);
    ctx.lineTo(1070, 580);
    ctx.stroke();

    let a3Progress = {};
    try {
        a3Progress = JSON.parse(localStorage.getItem('tk_a3_progress_v1') || '{}');
    } catch(e) {
        a3Progress = {};
    }
    const a3Completed = a3Progress.schemaVersion === 2 && a3Progress.completed === true && Array.isArray(a3Progress.choices) && a3Progress.choices.length === 3;

    ctx.fillStyle = '#a5b4fc';
    ctx.font = '800 22px "Space Grotesk", sans-serif';
    ctx.fillText('A3 · Meine drei Tastenkürzel', 130, 620);

    ctx.font = '600 16px sans-serif';
    if (a3Completed) {
        ctx.fillStyle = '#e2e8f0';
        a3Progress.choices.forEach((choice, index) => {
            const shortcut = (choice.shortcut || '').trim();
            const reason = (choice.reason || '').trim();
            const line = `${index + 1}. ${shortcut} – weil ${reason}`;
            ctx.fillText(line.length > 105 ? line.slice(0, 102) + '…' : line, 150, 650 + index * 25);
        });
    } else {
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('Noch offen: Merkblatt herunterladen und drei Kürzel mit Begründung festlegen.', 150, 660);
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Leistungsnachweis Informatik B25', 600, 730);

    function generatePDF() {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [297, 210]
        });

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);

        const safeStudentName = sanitizeStudentNameForFileName(studentName);
        const sanitizedFileName = `Leistungsnachweis_${safeStudentName}.pdf`;
        pdf.save(sanitizedFileName);

        localStorage.setItem('tk_pdf_downloaded_v1', 'true');
        if (typeof updatePdfSharedUI === 'function') updatePdfSharedUI();
    }

    if (window.jspdf) {
        generatePDF();
    } else {
        const script = document.createElement('script');
        script.src = 'vendor/jspdf.umd.min.js';
        script.onload = () => {
            generatePDF();
        };
        document.head.appendChild(script);
    }
}

// tk2 uses one shared PDF exporter for A1-A5 and the course overview.
// The synchronous insert keeps the index PDF card available before its
// particle initializer scans the module cards.
if (location.pathname.includes('/tk2/')) {
    document.write('<script src="pdf.js"><\/script>');
}
