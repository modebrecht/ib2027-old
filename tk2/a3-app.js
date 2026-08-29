(function(){
  'use strict';

  var STORAGE_KEY='tk_a3_progress_v1';
  var QUEST_SCORES_KEY='tk_quest_scores_v1';
  var SCHEMA_VERSION=2;

  function byId(id){return document.getElementById(id);}
  function freshProgress(){return{schemaVersion:SCHEMA_VERSION,downloaded:false,onedriveStored:false,choices:[{shortcut:'',reason:''},{shortcut:'',reason:''},{shortcut:'',reason:''}],completed:false,rewarded:false};}
  function parseProgress(){
    var progress;
    try{progress=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch(e){progress={};}
    if(!progress||progress.schemaVersion!==SCHEMA_VERSION)return freshProgress();
    if(!Array.isArray(progress.choices)||progress.choices.length!==3)progress.choices=freshProgress().choices;
    if(typeof progress.onedriveStored!=='boolean')progress.onedriveStored=false;
    return progress;
  }
  function saveProgress(progress){
    progress.schemaVersion=SCHEMA_VERSION;
    localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));
    if(window.tk2Pdf&&typeof window.tk2Pdf.sync==='function')window.tk2Pdf.sync();
  }
  function shortcutValid(shortcut){
    var text=(shortcut||'').trim();
    return text.length>=2&&/[A-Za-z0-9ÄÖÜäöü]/.test(text);
  }
  function duplicateKey(shortcut){
    return(shortcut||'').trim().replace(/\s+/g,'').toLowerCase();
  }
  function reasonValid(reason){
    var text=(reason||'').trim();
    return text.length>=5&&/[A-Za-zÄÖÜäöüß]/.test(text);
  }
  function choicesComplete(progress){
    var choices=progress.choices||[];
    if(choices.length!==3)return false;
    if(!choices.every(function(c){return shortcutValid(c.shortcut)&&reasonValid(c.reason);})){return false;}
    var keys=choices.map(function(c){return duplicateKey(c.shortcut);});
    return new Set(keys).size===3;
  }
  function isCompleted(progress){return progress.downloaded===true&&progress.onedriveStored===true&&choicesComplete(progress);}

  function syncCompatibilityScore(completed){
    try{
      var scores=JSON.parse(localStorage.getItem(QUEST_SCORES_KEY)||'{}');
      if(completed)scores.q7=100;
      else delete scores.q7;
      localStorage.setItem(QUEST_SCORES_KEY,JSON.stringify(scores));
    }catch(e){}
  }

  function syncChoiceStep(progress){
    var enabled=progress.downloaded===true;
    document.querySelectorAll('.shortcut-choice,.shortcut-reason').forEach(function(input){
      input.disabled=!enabled;
    });
  }

  function syncChoiceValidation(progress){
    var enabled=progress.downloaded===true;
    var keys=(progress.choices||[]).map(function(c){return duplicateKey(c.shortcut);});
    document.querySelectorAll('.shortcut-choice').forEach(function(input,index){
      var value=(progress.choices[index]&&progress.choices[index].shortcut)||'';
      var key=keys[index];
      var duplicate=key&&keys.filter(function(k){return k===key;}).length>1;
      input.classList.toggle('is-invalid',enabled&&value.trim()!==''&&(!shortcutValid(value)||duplicate));
    });
    document.querySelectorAll('.shortcut-reason').forEach(function(input,index){
      var value=(progress.choices[index]&&progress.choices[index].reason)||'';
      input.classList.toggle('is-invalid',enabled&&value.trim()!==''&&!reasonValid(value));
    });
  }

  function syncOneDriveStep(progress){
    var checkbox=byId('onedrive-confirm'),status=byId('onedrive-status');
    if(!checkbox)return;
    var choicesDone=choicesComplete(progress);
    checkbox.checked=progress.onedriveStored===true;
    checkbox.disabled=progress.downloaded!==true||!choicesDone;
    if(status){
      if(progress.onedriveStored)status.textContent='Gesichert ✓';
      else if(!progress.downloaded)status.textContent='Zuerst das Merkblatt herunterladen und anschauen.';
      else if(!choicesDone)status.textContent='Trage zuerst deine drei Kürzel mit Begründung ein.';
      else status.textContent='Setze den Haken, sobald die PDF im Ordner „IB“ liegt.';
    }
  }

  function renderCompleted(progress){
    var card=byId('completion-card'),hint=byId('choice-hint');
    if(card)card.classList.toggle('is-visible',progress.completed===true);
    syncChoiceStep(progress);
    syncChoiceValidation(progress);
    syncOneDriveStep(progress);
    if(hint){
      if(progress.completed)hint.textContent='✓ Merkblatt angeschaut, drei Kürzel ausgewählt und in OneDrive gesichert.';
      else if(!progress.downloaded)hint.textContent='1. Lade zuerst das Merkblatt herunter und schau es dir an.';
      else if(!choicesComplete(progress))hint.textContent='PDF heruntergeladen ✓ 2. Trage jetzt drei unterschiedliche Kürzel mit Begründung ein.';
      else if(!progress.onedriveStored)hint.textContent='Drei Kürzel vollständig ✓ 3. Sichere das Merkblatt jetzt in OneDrive und bestätige unten den Haken.';
    }
  }

  function evaluate(progress){
    var wasCompleted=progress.completed===true;
    progress.completed=isCompleted(progress);
    if(progress.completed&&!wasCompleted){
      progress.completedAt=new Date().toISOString();
      if(!progress.rewarded&&typeof addGlobalXP==='function'){
        addGlobalXP(50);
        progress.rewarded=true;
      }
    }
    syncCompatibilityScore(progress.completed===true);
    saveProgress(progress);
    renderCompleted(progress);
  }

  document.addEventListener('DOMContentLoaded',function(){
    var progress=parseProgress();
    saveProgress(progress);

    document.querySelectorAll('.shortcut-choice').forEach(function(input,index){
      input.value=(progress.choices[index]&&progress.choices[index].shortcut)||'';
      input.addEventListener('input',function(){
        progress.choices[index].shortcut=input.value;
        evaluate(progress);
      });
    });

    document.querySelectorAll('.shortcut-reason').forEach(function(input,index){
      input.value=(progress.choices[index]&&progress.choices[index].reason)||'';
      input.addEventListener('input',function(){
        progress.choices[index].reason=input.value;
        evaluate(progress);
      });
    });

    var checkbox=byId('onedrive-confirm');
    if(checkbox)checkbox.addEventListener('change',function(){
      progress.onedriveStored=checkbox.checked;
      evaluate(progress);
    });

    var download=byId('theory-download');
    if(download)download.addEventListener('click',function(){
      progress.downloaded=true;
      if(!progress.downloadedAt)progress.downloadedAt=new Date().toISOString();
      evaluate(progress);
    });

    evaluate(progress);
  });
})();
