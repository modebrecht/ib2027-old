(function(){
  'use strict';

  var STORAGE_KEY='tk_a3_progress_v1';
  var startTime=0;
  var timerId=null;
  var running=false;

  function byId(id){return document.getElementById(id);}
  function parseProgress(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch(e){return{};}}
  function saveProgress(progress){localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));if(window.tk2Pdf&&typeof window.tk2Pdf.sync==='function')window.tk2Pdf.sync();}
  function formatTime(ms){
    var totalSeconds=Math.max(0,Math.floor(ms/1000));
    var minutes=Math.floor(totalSeconds/60);
    var seconds=totalSeconds%60;
    return String(minutes).padStart(2,'0')+':'+String(seconds).padStart(2,'0');
  }
  function render(){if(running)byId('boss-timer').textContent=formatTime(Date.now()-startTime);}

  function downloadDocx(){
    if(!window.A3_PIZZA_DOCX_BASE64){alert('Die Word-Datei konnte nicht geladen werden.');return;}
    var binary=atob(window.A3_PIZZA_DOCX_BASE64);
    var bytes=new Uint8Array(binary.length);
    for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    var blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;
    a.download='A3_Pizza-Werkstatt.docx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function(){URL.revokeObjectURL(url);},1000);
    var progress=parseProgress();
    progress.downloaded=true;
    saveProgress(progress);
  }

  function ensureCompletionReward(progress){
    if(progress.rewarded)return;
    addGlobalXP(50);
    progress.rewarded=true;
    progress.completed=true;
    saveProgress(progress);
  }

  function showFirstReady(progress){
    byId('boss-timer').textContent=progress.first||'00:00';
    byId('run-instruction').textContent='Runde 2: Scrolle im selben Word-Dokument auf Seite 2. Starte erst, wenn Seite 2 bereit ist.';
    byId('start-boss-btn').style.display='inline-flex';
    byId('start-boss-btn').textContent='▶ Runde 2 starten';
    byId('stop-boss-btn').style.display='none';
    byId('result-time-msg').style.display='block';
    byId('result-prefix').textContent='Runde 1: ';
    byId('result-time-value').textContent=progress.first;
    byId('result-next').textContent=' gespeichert. Jetzt im selben Dokument auf Seite 2 wechseln.';
    byId('completion-panel').style.display='none';
  }

  function applyReflection(progress){
    document.querySelectorAll('.choice-btn').forEach(function(btn){
      btn.classList.toggle('selected',btn.dataset.choice===progress.preference);
    });
    if(byId('remember-shortcut'))byId('remember-shortcut').value=progress.rememberShortcut||'';
  }

  function showCompleted(progress){
    ensureCompletionReward(progress);
    byId('boss-timer').textContent=progress.second||'00:00';
    byId('run-instruction').textContent='Beide Pizza-Runden sind abgeschlossen.';
    byId('start-boss-btn').style.display='none';
    byId('stop-boss-btn').style.display='none';
    byId('result-time-msg').style.display='block';
    byId('result-prefix').textContent='Runde 2 mit Shortcuts: ';
    byId('result-time-value').textContent=progress.second;
    byId('result-next').textContent=' · Runde 1: '+progress.first;
    byId('completion-panel').style.display='block';
    byId('completion-note').textContent='Runde 1 ohne Shortcuts: '+progress.first+' · Runde 2 mit Shortcuts: '+progress.second+'. Entscheide jetzt kurz, welche Bedienung für dich angenehmer war.';
    applyReflection(progress);
  }

  function showInitial(){
    byId('boss-timer').textContent='00:00';
    byId('run-instruction').textContent='Öffne die Word-Datei und bleibe auf Seite 1. Starte den Timer erst, wenn das Dokument bereit ist.';
    byId('start-boss-btn').style.display='inline-flex';
    byId('start-boss-btn').textContent='▶ Runde 1 starten';
    byId('stop-boss-btn').style.display='none';
    byId('result-time-msg').style.display='none';
    byId('completion-panel').style.display='none';
  }

  function refreshFromProgress(){
    var progress=parseProgress();
    if(progress.second){showCompleted(progress);return;}
    if(progress.first){showFirstReady(progress);return;}
    showInitial();
  }

  function startBossChallenge(){
    if(running)return;
    var progress=parseProgress();
    if(progress.second)return;
    running=true;
    startTime=Date.now();
    byId('boss-timer').textContent='00:00';
    byId('start-boss-btn').style.display='none';
    byId('stop-boss-btn').style.display='inline-flex';
    byId('result-time-msg').style.display='none';
    byId('completion-panel').style.display='none';
    byId('timer-box').classList.add('is-running');
    timerId=window.setInterval(render,250);
  }

  function stopBossChallenge(){
    if(!running)return;
    running=false;
    if(timerId){window.clearInterval(timerId);timerId=null;}
    var elapsed=Date.now()-startTime;
    var text=formatTime(elapsed);
    var progress=parseProgress();
    byId('timer-box').classList.remove('is-running');

    if(!progress.first){
      progress.first=text;
      progress.firstMs=elapsed;
      progress.attempts=1;
      saveProgress(progress);
      showFirstReady(progress);
      return;
    }

    progress.second=text;
    progress.secondMs=elapsed;
    progress.attempts=2;
    progress.completed=true;
    saveProgress(progress);
    showCompleted(progress);
  }

  document.addEventListener('DOMContentLoaded',function(){
    var unlocked=isQuestUnlocked('q7');
    byId('a3-lock-screen').style.display=unlocked?'none':'flex';
    byId('a3-content-wrap').style.display=unlocked?'block':'none';

    var download=byId('docx-download-btn');
    if(download)download.addEventListener('click',downloadDocx);

    document.querySelectorAll('.choice-btn').forEach(function(btn){
      btn.addEventListener('click',function(){
        var progress=parseProgress();
        progress.preference=btn.dataset.choice;
        saveProgress(progress);
        applyReflection(progress);
      });
    });

    var remember=byId('remember-shortcut');
    if(remember)remember.addEventListener('change',function(){
      var progress=parseProgress();
      progress.rememberShortcut=remember.value;
      saveProgress(progress);
    });

    if(unlocked)refreshFromProgress();
  });

  window.startBossChallenge=startBossChallenge;
  window.stopBossChallenge=stopBossChallenge;
})();
