/*
 * Shared boilerplate for the standalone hw/*.html worksheets:
 * dark mode + font size, global Vorname sync (with first-visit prompt),
 * default Klasse/Datum, and a generic per-page form autosave.
 *
 * Include this script BEFORE a page's own inline <script> so its
 * functions (applyDefaultClassAndDate, setupUniversalAutoSave, initTheme, ...)
 * are already defined when that page's init code runs.
 */

/* ---------- Print safety net ---------- */
/* @media print never neutralizes the .dark class itself, so pages using
   dark:-prefixed Tailwind classes (dark cards, light text) would otherwise
   print with those dark colors still active. Inject a print-only override
   and expose a helper that strips .dark before window.print() and restores
   it afterwards. */
(function injectPrintSafetyCSS() {
    var style = document.createElement('style');
    style.textContent = '@media print { .dark, .dark * { background-color: #fff !important; color: #000 !important; border-color: #cbd5e1 !important; } }';
    document.head.appendChild(style);
})();

function safePrint() {
    var wasDark = document.documentElement.classList.contains('dark');
    if (wasDark) document.documentElement.classList.remove('dark');
    window.print();
    if (wasDark) document.documentElement.classList.add('dark');
}

/* ---------- Theme (dark mode) ---------- */
var THEME_KEY = 'ib-theme';

function applyTheme(theme) {
    var isDark = (theme === 'dark');
    if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        document.body.setAttribute('data-theme', 'light');
    }
    var themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.checked = isDark;
    var themeIcon = document.getElementById('themeIcon');
    if (themeIcon) themeIcon.className = isDark ? 'fa-solid fa-sun text-amber-400 text-sm' : 'fa-solid fa-moon text-sm';
}

function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
}

function initTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved) {
        applyTheme(saved);
    } else {
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
    }
}

function toggleDarkMode() {
    var isCurrentlyDark = document.documentElement.classList.contains('dark') || document.body.getAttribute('data-theme') === 'dark';
    saveTheme(isCurrentlyDark ? 'light' : 'dark');
}

window.setTheme = function(theme) { saveTheme(theme); };

/* ---------- Font size ---------- */
var FONT_KEY = 'ib-font-size';

function applyFontSize(sizeVal) {
    var val = Number(sizeVal) || 100;
    var scale = val / 100;
    document.documentElement.style.setProperty('--font-scale', scale);
    document.documentElement.style.fontSize = val + '%';
    var slider = document.getElementById('fontSizeRange');
    if (slider) slider.value = val;
}

function saveFontSize(sizeVal) {
    var val = Number(sizeVal) || 100;
    localStorage.setItem(FONT_KEY, val);
    localStorage.setItem('onedrive_font_size', val);
    applyFontSize(val);
}

function initFontSize() {
    var saved = localStorage.getItem(FONT_KEY) || localStorage.getItem('onedrive_font_size') || 100;
    applyFontSize(saved);
}

window.setFontSize = function(val) { saveFontSize(val); };

/* ---------- Global Vorname sync + first-visit prompt ---------- */
function getSavedVorname() {
    return localStorage.getItem('studentVorname') || localStorage.getItem('student_vorname') || '';
}

function setSavedVorname(name) {
    if (name && name.trim()) {
        var clean = name.trim();
        localStorage.setItem('studentVorname', clean);
        localStorage.setItem('student_vorname', clean);
        syncVornameInputs(clean);
    }
}

function syncVornameInputs(name) {
    var el = document.getElementById('studentName');
    if (el && name) {
        el.value = name;
        if (typeof updateProgress === 'function') updateProgress();
    }
}

function checkAndPromptVorname() {
    var name = getSavedVorname();
    var el = document.getElementById('studentName');
    if (el && el.value && el.value.trim()) {
        name = el.value.trim();
        setSavedVorname(name);
    }
    if (!name) {
        setTimeout(function() {
            var entered = prompt("Willkommen! Wie lautet dein Vorname?");
            if (entered && entered.trim()) {
                setSavedVorname(entered);
            }
        }, 300);
    } else {
        syncVornameInputs(name);
    }
}

/* ---------- Default Klasse/Datum + readonly student-metadata fields ---------- */
function applyDefaultClassAndDate() {
    var classInput = document.getElementById('studentClass');
    if (classInput && !classInput.value.trim()) {
        classInput.value = 'B24';
    }

    var dateInput = document.getElementById('studentDate');
    if (!dateInput) return;

    var d = new Date();
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var yyyy = d.getFullYear();
    var todayStr = dd + '.' + mm + '.' + yyyy;

    dateInput.value = todayStr;
    dateInput.readOnly = true;
    dateInput.setAttribute('tabindex', '-1');
    dateInput.style.pointerEvents = 'none';

    var mobDate = document.getElementById('mobDate');
    if (mobDate) mobDate.textContent = todayStr;
}

/* ---------- Generic per-page form autosave (hw_autosave_<file>.html) ---------- */
function setupUniversalAutoSave() {
    var pageKey = 'hw_autosave_' + location.pathname.split('/').pop();

    function saveAll() {
        var data = {};
        document.querySelectorAll('input, textarea, select').forEach(function(el) {
            if (el.id) {
                if (el.type === 'checkbox') {
                    data[el.id] = el.checked;
                } else if (el.type === 'radio') {
                    if (el.checked) data[el.name] = el.value;
                } else {
                    data[el.id] = el.value;
                }
            } else if (el.name && el.type === 'radio') {
                if (el.checked) data[el.name] = el.value;
            }
        });
        localStorage.setItem(pageKey, JSON.stringify(data));
    }

    try {
        var saved = localStorage.getItem(pageKey);
        if (saved) {
            var data = JSON.parse(saved);
            Object.keys(data).forEach(function(key) {
                var el = document.getElementById(key);
                if (el) {
                    if (el.type === 'checkbox') {
                        el.checked = !!data[key];
                    } else if (el.type === 'radio') {
                        if (el.value === data[key]) el.checked = true;
                    } else {
                        if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
                            el.value = data[key];
                        }
                    }
                } else {
                    var radio = document.querySelector('input[name="' + key + '"][value="' + data[key] + '"]');
                    if (radio) radio.checked = true;
                }
            });
        }
    } catch (e) {}

    applyDefaultClassAndDate();

    saveAll();

    document.querySelectorAll('input, textarea, select').forEach(function(el) {
        el.addEventListener('input', saveAll);
        el.addEventListener('change', saveAll);
    });
}

/* ---------- A9: progress semantics + visual consistency ---------- */
var A9_PAGE = location.pathname.split('/').pop().toLowerCase() === 'a9.html';
var A9_AUTOSAVE_BEFORE_BOOT = A9_PAGE ? localStorage.getItem('hw_autosave_A9.html') : null;

function setupA9WorksheetAlignment() {
    if (!A9_PAGE || typeof lifecycleItems === 'undefined') return;

    var choiceIds = ['q1', 'q2', 'q3', 'q4'];
    var touchedKey = 'onedrive_a9_ecocheck_touched';
    var touched = {};
    try { touched = JSON.parse(localStorage.getItem(touchedKey) || '{}') || {}; } catch (e) { touched = {}; }

    var previous = {};
    try { previous = JSON.parse(A9_AUTOSAVE_BEFORE_BOOT || '{}') || {}; } catch (e) { previous = {}; }

    choiceIds.forEach(function(id) {
        var select = document.getElementById(id);
        if (!select) return;

        if (!select.querySelector('option[value=""]')) {
            var placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = 'Bitte wählen …';
            select.insertBefore(placeholder, select.firstChild);
        }

        var oldValue = previous[id];
        var preserve = touched[id] === true || (oldValue !== undefined && oldValue !== null && oldValue !== '' && oldValue !== '0');
        select.value = preserve ? String(oldValue) : '';
        if (preserve) touched[id] = true;

        select.addEventListener('change', function() {
            touched[id] = true;
            localStorage.setItem(touchedKey, JSON.stringify(touched));
        });
    });
    localStorage.setItem(touchedKey, JSON.stringify(touched));

    var label = document.getElementById('headerPercentText');
    if (label && label.previousElementSibling) {
        label.previousElementSibling.textContent = 'Bearbeitungsfortschritt';
    }

    var ringNumber = document.getElementById('headerPercentNumber');
    if (ringNumber && ringNumber.parentElement) {
        ringNumber.parentElement.style.display = 'none';
    }

    var requiredIds = [
        'raw_cobalt_match', 'raw_lithium_match', 'raw_gold_match',
        'impact_cobalt', 'impact_gold', 'impact_backpack',
        'ai_energy_reason', 'impact_mining_count', 'school_green_criteria',
        'q1', 'q2', 'q3', 'q4',
        'action_1', 'action_2', 'action_3'
    ];
    var radioGroups = ['recycle_q1', 'recycle_q2', 'recycle_q3'];
    var completionKey = 'onedrive_a9_worksheet_8sek';

    window.updateProgress = function() {
        var filled = 0;

        requiredIds.forEach(function(id) {
            var el = document.getElementById(id);
            if (el && String(el.value || '').trim().length > 0) filled++;
        });

        radioGroups.forEach(function(name) {
            if (document.querySelector('input[name="' + name + '"]:checked')) filled++;
        });

        var chipsPlaced = 0;
        lifecycleItems.forEach(function(item) {
            if (chipState && chipState[item.id] && chipState[item.id] !== 'bank') chipsPlaced++;
        });

        var totalTracked = requiredIds.length + radioGroups.length + lifecycleItems.length;
        var percent = Math.round(((filled + chipsPlaced) / totalTracked) * 100);

        var progressBar = document.getElementById('progressBar');
        if (progressBar) progressBar.style.width = percent + '%';

        var headerPercentText = document.getElementById('headerPercentText');
        if (headerPercentText) headerPercentText.innerText = percent + '% bearbeitet';

        var headerPercentNumber = document.getElementById('headerPercentNumber');
        if (headerPercentNumber) headerPercentNumber.innerText = percent + '%';

        var headerSvgCircle = document.getElementById('headerSvgCircle');
        if (headerSvgCircle) {
            var offset = 100.53 - (100.53 * percent) / 100;
            headerSvgCircle.style.strokeDashoffset = offset;
        }

        var s1 = parseInt(document.getElementById('q1').value) || 0;
        var s2 = parseInt(document.getElementById('q2').value) || 0;
        var s3 = parseInt(document.getElementById('q3').value) || 0;
        var s4 = parseInt(document.getElementById('q4').value) || 0;
        var totalScore = s1 + s2 + s3 + s4;

        var headerScore = document.getElementById('headerScore');
        if (headerScore) headerScore.innerText = totalScore;

        var scoreDisplay = document.getElementById('scoreDisplay');
        if (scoreDisplay) scoreDisplay.innerText = totalScore + ' / 100 Pkt.';

        var rankBox = document.getElementById('rankBox');
        if (rankBox) {
            if (totalScore >= 80) {
                rankBox.innerHTML = '<i class="fa-solid fa-trophy text-yellow-300"></i> Hardware-Hero';
                rankBox.className = 'inline-flex items-center gap-2 px-6 py-3 bg-eco-600 text-white rounded-xl text-xl font-extrabold shadow-md eco-rank-bounce';
                if (scoreDisplay) scoreDisplay.className = 'text-3xl font-black mt-2 text-eco-600 dark:text-eco-400';
            } else if (totalScore >= 45) {
                rankBox.innerHTML = '<i class="fa-solid fa-seedling"></i> Eco-Starter';
                rankBox.className = 'inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl text-xl font-extrabold shadow-md';
                if (scoreDisplay) scoreDisplay.className = 'text-3xl font-black mt-2 text-amber-600 dark:text-amber-400';
            } else {
                rankBox.innerHTML = '<i class="fa-solid fa-leaf"></i> Eco-Newbie';
                rankBox.className = 'inline-flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xl font-extrabold';
                if (scoreDisplay) scoreDisplay.className = 'text-3xl font-black mt-2 text-slate-700 dark:text-slate-300';
            }
        }

        var printBtn = document.getElementById('hdrPdfBtn');
        var printIcon = document.getElementById('printIcon');
        if (printBtn) {
            if (percent >= 100) {
                printBtn.classList.remove('opacity-60', 'cursor-not-allowed', 'bg-slate-200', 'dark:bg-slate-800', 'text-slate-400');
                printBtn.classList.add('bg-eco-600', 'hover:bg-eco-700', 'text-white', 'shadow-md');
                printBtn.title = 'PDF exportieren / drucken';
                if (printIcon) printIcon.className = 'fa-solid fa-file-pdf text-sm';
            } else {
                printBtn.classList.remove('bg-eco-600', 'hover:bg-eco-700', 'text-white', 'shadow-md');
                printBtn.classList.add('opacity-60', 'cursor-not-allowed', 'bg-slate-200', 'dark:bg-slate-800', 'text-slate-400');
                printBtn.title = 'Erst bei 100% Bearbeitung möglich';
                if (printIcon) printIcon.className = 'fa-solid fa-lock text-sm';
            }
        }

        localStorage.setItem(completionKey, JSON.stringify({
            version: 1,
            percent: percent,
            completed: percent === 100,
            updatedAt: new Date().toISOString()
        }));
    };

    updateProgress();
}

/* ---------- Bootstrap ---------- */
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initFontSize();

    var themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', function() {
            saveTheme(themeToggle.checked ? 'dark' : 'light');
        });
    }

    var fontSlider = document.getElementById('fontSizeRange');
    if (fontSlider) {
        fontSlider.addEventListener('input', function() {
            saveFontSize(fontSlider.value);
        });
    }

    var nameEl = document.getElementById('studentName');
    if (nameEl) {
        var existing = getSavedVorname();
        if (existing) nameEl.value = existing;
        nameEl.addEventListener('input', function() { setSavedVorname(nameEl.value); });
        nameEl.addEventListener('change', function() { setSavedVorname(nameEl.value); });
    }
    checkAndPromptVorname();

    if (A9_PAGE) {
        setTimeout(setupA9WorksheetAlignment, 0);
    }
});

window.addEventListener('storage', function(e) {
    if (e.key === THEME_KEY) {
        if (e.newValue) applyTheme(e.newValue);
    }
    if (e.key === FONT_KEY || e.key === 'onedrive_font_size') {
        if (e.newValue) applyFontSize(e.newValue);
    }
    if (e.key === 'studentVorname' || e.key === 'student_vorname') {
        if (e.newValue) syncVornameInputs(e.newValue);
    }
});


/* ---------- Shared score history bootstrap ---------- */
(function loadSharedScoreHistory(){
    if (document.querySelector('script[data-score-history]')) return;
    var script = document.createElement('script');
    script.src = 'assets/js/score-history.js';
    script.async = false;
    script.setAttribute('data-score-history', '1');
    document.head.appendChild(script);
})();
