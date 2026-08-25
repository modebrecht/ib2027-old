(function(name, clazz, date) {
    // 1. Globale Variablen für den Namen im Local Storage anpassen
    if (name) {
        localStorage.setItem('studentVorname', name);
        localStorage.setItem('student_vorname', name);
    }
    
    // 2. Felder auf der aktuellen Seite suchen und überschreiben
    const fields = {
        'studentName': name,
        'studentClass': clazz,
        'studentDate': date
    };
    
    for (const [id, value] of Object.entries(fields)) {
        if (!value) continue;
        
        const el = document.getElementById(id);
        if (el) {
            el.value = value;
            // Löst das automatische Speichern (Auto-Save) auf der Seite aus
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
    
    // 3. Fallback für das spezielle 'memory.html' oder 'A1.html' Info-Objekt
    try {
        const memInfo = JSON.parse(localStorage.getItem('memStudentInfo') || '{}');
        if (name) memInfo.name = name;
        if (clazz) memInfo.sClass = clazz;
        if (date) memInfo.date = date;
        localStorage.setItem('memStudentInfo', JSON.stringify(memInfo));
    } catch(e) {}
    
    console.log('✅ Daten erfolgreich aktualisiert:');
    console.log('Name:', name || '(unverändert)');
    console.log('Klasse:', clazz || '(unverändert)');
    console.log('Datum:', date || '(unverändert)');
    
})('Max Mustermann', 'B25', '07.08.2026'); 