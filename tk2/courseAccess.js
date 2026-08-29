(function(){
  'use strict';

  // A1-A6 are always accessible from the course overview.
  // Quest progression inside A1/A2 is handled by the shared isQuestUnlocked()
  // rules from ../tk/xp.js (Q1 -> Q2 -> Q3 and Q4 -> Q5 -> Q6).

  function syncA3CompatibilityScore(){
    var scoreKey='tk_quest_scores_v1',progressKey='tk_a3_progress_v1';
    try{
      var scores=JSON.parse(localStorage.getItem(scoreKey)||'{}');
      var progress=JSON.parse(localStorage.getItem(progressKey)||'{}');
      var choices=Array.isArray(progress.choices)?progress.choices:[];
      var shortcuts=choices.map(function(c){return(c&&c.shortcut||'').trim();});
      var reasonsValid=choices.length===3&&choices.every(function(c){
        var text=(c&&c.reason||'').trim();
        return text.length>=5&&/[A-Za-zÄÖÜäöüß]/.test(text);
      });
      var shortcutsValid=shortcuts.length===3&&!shortcuts.some(function(v){return!v;})&&new Set(shortcuts).size===3;
      var currentA3Done=progress.schemaVersion===2&&progress.downloaded===true&&progress.completed===true&&shortcutsValid&&reasonsValid;

      // q7 ist nur noch ein Kompatibilitätsmarker für ältere Root-Logik.
      // Historische Pizza-q7-Werte werden entfernt, solange die neue A3 nicht abgeschlossen ist.
      if(currentA3Done)scores.q7=100;
      else delete scores.q7;
      localStorage.setItem(scoreKey,JSON.stringify(scores));
    }catch(e){}
  }

  function installChordKeyHoldStyles(){
    if(document.getElementById('tk2-chord-key-hold'))return;
    var style=document.createElement('style');
    style.id='tk2-chord-key-hold';
    style.textContent=''
      +'.tk2-doc-scene .tk2-key.tk2-chord-held,'
      +'.tk2-utility-scene .tk2-u-key.tk2-chord-held{filter:drop-shadow(0 0 11px rgba(56,189,248,.95))!important;translate:0 4px!important}'
      +'.tk2-doc-scene .tk2-key.tk2-chord-held rect,'
      +'.tk2-utility-scene .tk2-u-key.tk2-chord-held rect{fill:#1d4ed8!important;stroke:#93c5fd!important;stroke-width:2!important}'
      +'.tk2-altgr-scene .key.tk2-chord-held{filter:drop-shadow(0 0 12px rgba(245,158,11,.98))!important;translate:0 5px!important}'
      +'.tk2-altgr-scene .key.tk2-chord-held rect{fill:#78350f!important;stroke:#fbbf24!important;stroke-opacity:1!important;stroke-width:2.5!important}'
      +'.tk2-altgr-scene .keys:has(.key-main[style*="drop-shadow"]) .key-alt{filter:drop-shadow(0 0 12px rgba(245,158,11,.98))!important}'
      +'.tk2-altgr-scene .keys:has(.key-main[style*="drop-shadow"]) .key-alt rect,'
      +'.tk2-altgr-scene .key[style*="drop-shadow"] rect{fill:#78350f!important;stroke:#fbbf24!important;stroke-opacity:1!important;stroke-width:2.5!important}';
    document.head.appendChild(style);
  }

  function installChordHoldTiming(){
    if(window.__tk2ChordHoldTiming)return;
    window.__tk2ChordHoldTiming=true;
    var HOLD_MS=1000;
    var rowTimers=new WeakMap();

    function isChordKey(el){
      return el&&el.matches&&el.matches('.tk2-doc-scene .tk2-key,.tk2-utility-scene .tk2-u-key,.tk2-altgr-scene .key');
    }

    function holdChord(key){
      var row=key.closest('.keys');
      if(!row)return;
      var isAltGr=row.closest('.tk2-altgr-scene');
      var keys=Array.from(row.querySelectorAll(isAltGr?'.key':'.tk2-key,.tk2-u-key'));
      var index=keys.indexOf(key);
      if(index<1)return;

      var oldTimer=rowTimers.get(row);
      if(oldTimer)window.clearTimeout(oldTimer);

      keys.forEach(function(k,i){
        if(i<=index)k.classList.add('tk2-chord-held');
      });

      rowTimers.set(row,window.setTimeout(function(){
        keys.forEach(function(k){k.classList.remove('tk2-chord-held');});
        rowTimers.delete(row);
      },HOLD_MS));
    }

    var observer=new MutationObserver(function(records){
      records.forEach(function(record){
        var key=record.target;
        if(!isChordKey(key))return;
        if((key.style.filter||'').indexOf('drop-shadow')!==-1)holdChord(key);
      });
    });

    function observe(){
      document.querySelectorAll('.tk2-doc-scene .tk2-key,.tk2-utility-scene .tk2-u-key,.tk2-altgr-scene .key').forEach(function(key){
        observer.observe(key,{attributes:true,attributeFilter:['style']});
      });
    }

    document.addEventListener('DOMContentLoaded',function(){
      observe();
      var treeObserver=new MutationObserver(observe);
      treeObserver.observe(document.body,{childList:true,subtree:true});
    });
  }

  function openIndexCards(){
    document.querySelectorAll('.module[id^="module-a"]').forEach(function(card){
      card.classList.remove('locked');
      var state=card.querySelector('.module-state');
      if(state&&!card.classList.contains('done'))state.textContent='offen';
      var btn=card.querySelector('.module-btn');
      if(btn){
        btn.removeAttribute('aria-disabled');
        btn.style.display='inline-flex';
        var id=(card.id||'').replace('module-','').toUpperCase();
        if(/^A[1-6]$/.test(id))btn.textContent=id+' öffnen ➔';
      }
    });
  }

  syncA3CompatibilityScore();
  installChordKeyHoldStyles();
  installChordHoldTiming();
  document.addEventListener('DOMContentLoaded',openIndexCards);
})();
