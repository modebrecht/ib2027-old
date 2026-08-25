(function(){
  'use strict';

  // All course sections and quests are intentionally accessible at all times.
  window.isQuestUnlocked=function(){return true;};

  function installChordKeyHoldStyles(){
    if(document.getElementById('tk2-chord-key-hold'))return;
    var style=document.createElement('style');
    style.id='tk2-chord-key-hold';
    style.textContent=''
      // A1: a chord that has reached its second key stays visibly pressed together.
      +'.tk2-doc-scene .tk2-key.tk2-chord-held,'
      +'.tk2-utility-scene .tk2-u-key.tk2-chord-held{filter:drop-shadow(0 0 11px rgba(56,189,248,.95))!important;translate:0 4px!important}'
      +'.tk2-doc-scene .tk2-key.tk2-chord-held rect,'
      +'.tk2-utility-scene .tk2-u-key.tk2-chord-held rect{fill:#1d4ed8!important;stroke:#93c5fd!important;stroke-width:2!important}'
      // A2: AltGr and the character key stay visibly pressed together as one chord.
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
      if(index<1)return; // Modifier alone is not yet a chord.

      var oldTimer=rowTimers.get(row);
      if(oldTimer)window.clearTimeout(oldTimer);

      // Hold every key already reached in the chord. Ctrl+Shift+V grows 2 -> 3.
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
      // Theory scenes are inserted dynamically; pick up later replacements/replays too.
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

  installChordKeyHoldStyles();
  installChordHoldTiming();
  document.addEventListener('DOMContentLoaded',openIndexCards);
})();
