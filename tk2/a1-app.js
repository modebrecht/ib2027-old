(function(){
  'use strict';

  var shortcuts = [
    {title:'Kopieren',desc:'Markierten Text oder Elemente kopieren.',keys:['Ctrl','C'],code:'KeyC',q2Wrong:'X'},
    {title:'Ausschneiden',desc:'Inhalt entfernen und in die Zwischenablage legen.',keys:['Ctrl','X'],code:'KeyX',q2Wrong:'C'},
    {title:'Einfügen',desc:'Kopierten Inhalt an der Cursor-Position einfügen.',keys:['Ctrl','V'],code:'KeyV',q2Wrong:'C'},
    {title:'Einfügen ohne Format',desc:'In vielen Programmen reinen Text ohne ursprüngliche Formatierung einfügen.',keys:['Ctrl','Shift','V'],code:'KeyV',shift:true,q2Wrong:'X'},
    {title:'Rückgängig machen',desc:'Den letzten Schritt wieder aufheben.',keys:['Ctrl','Z'],code:'KeyZ',q2Wrong:'Y'},
    {title:'Wiederherstellen',desc:'Eine rückgängig gemachte Aktion wiederholen.',keys:['Ctrl','Y'],code:'KeyY',q2Wrong:'Z'},
    {title:'Speichern',desc:'Das aktuelle Dokument sichern.',keys:['Ctrl','S'],code:'KeyS',q2Wrong:'P'},
    {title:'Alles markieren',desc:'Den gesamten Inhalt auswählen.',keys:['Ctrl','A'],code:'KeyA',q2Wrong:'S'},
    {title:'Suchen im Text',desc:'Ein Wort im Dokument oder Browser suchen.',keys:['Ctrl','F'],code:'KeyF',q2Wrong:'H'},
    {title:'Suchen & Ersetzen',desc:'In vielen Programmen Wörter suchen und ersetzen; im Browser kann Ctrl+H den Verlauf öffnen.',keys:['Ctrl','H'],code:'KeyH',q2Wrong:'F'},
    {title:'Drucken',desc:'Den Druckdialog öffnen.',keys:['Ctrl','P'],code:'KeyP',q2Wrong:'O'},
    {title:'Datei öffnen',desc:'Eine bestehende Datei auswählen und öffnen.',keys:['Ctrl','O'],code:'KeyO',q2Wrong:'P'},
    {title:'Zum Anfang springen',desc:'Ganz an den Anfang des Dokuments springen.',keys:['Ctrl','Home'],code:'Home',q2Wrong:'End'},
    {title:'Zum Ende springen',desc:'Ganz an das Ende des Dokuments springen.',keys:['Ctrl','End'],code:'End',q2Wrong:'Home'}
  ];

  function shuffleArray(arr){
    var array=arr.slice();
    for(var i=array.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=array[i];array[i]=array[j];array[j]=t;}
    return array;
  }

  var activePhase=1;
  var q1Shortcuts=shuffleArray(shortcuts),q1Index=0,q1CorrectHits=0,q1TotalAttempts=0,q1Locked=false;
  var q2Shortcuts=shuffleArray(shortcuts),q2Index=0,q2CorrectHits=0,q2TotalAttempts=0,q2HintRevealed=false,q2Locked=false,q2Choices=[];
  var q3Shortcuts=shuffleArray(shortcuts),q3Index=0,q3CorrectHits=0,q3TotalAttempts=0,q3HintRevealed=false,q3Locked=false,q3Misses=0;

  function byId(id){return document.getElementById(id);}
  function renderKeys(target,item,hiddenIndex,hiddenAll){
    target.innerHTML=item.keys.map(function(k,idx){
      var text=hiddenAll?'?':(idx===hiddenIndex?'?':k);
      return '<div class="big-kbd" data-keyname="'+k+'">'+text+'</div>';
    }).join('<div class="plus-sign">+</div>');
  }
  function accuracy(correct,total){return total===0?100:Math.round(correct/total*100);}

  function ensureQ3MemoryUi(){
    if(document.getElementById('tk2-q3-memory-style'))return;
    var style=document.createElement('style');
    style.id='tk2-q3-memory-style';
    style.textContent='.q3-memory-prompt{min-width:118px!important;max-width:none!important;padding:0 24px!important;border-style:dashed!important;border-color:rgba(139,92,246,.58)!important;color:#ddd6fe!important;background:rgba(139,92,246,.08)!important}';
    document.head.appendChild(style);
  }

  function renderQ3MemoryPrompt(){
    ensureQ3MemoryUi();
    byId('q3-shortcut-display').innerHTML='<div class="big-kbd q3-memory-prompt" aria-label="Kürzel aus dem Gedächtnis">?</div>';
  }

  function clarifyContextDependentTheory(){
    document.querySelectorAll('#theoryGrid .anim-card').forEach(function(card){
      var title=card.querySelector('.anim-title');
      var desc=card.querySelector('.anim-desc');
      var remember=card.querySelector('.anim-remember');
      if(!title||!desc||!remember)return;
      var name=title.textContent.trim();
      if(name==='Einfügen ohne Format'){
        desc.textContent='In vielen Programmen wird Text ohne ursprüngliche Formatierung eingefügt.';
        remember.innerHTML='<strong>Merke:</strong> Nicht jedes Programm unterstützt Ctrl + Shift + V.';
      }else if(name==='Suchen & Ersetzen'||name==='Suchen und Ersetzen'){
        desc.textContent='In vielen Programmen öffnet Ctrl + H Suchen und Ersetzen.';
        remember.innerHTML='<strong>Merke:</strong> Im Browser kann Ctrl + H stattdessen den Verlauf öffnen.';
      }
    });
  }

  function ensureMemoryHintNudgeUi(){
    if(document.getElementById('tk2-memory-hint-style'))return;
    var style=document.createElement('style');
    style.id='tk2-memory-hint-style';
    style.textContent='@keyframes tk2HintNudge{0%,100%{transform:scale(1)}50%{transform:scale(1.04);box-shadow:0 0 0 5px rgba(245,158,11,.12)}}.memory-hint-nudge{animation:tk2HintNudge 1.05s ease-in-out 2}';
    document.head.appendChild(style);
  }

  function nudgeQ3Hint(){
    if(q3Misses<2||q3HintRevealed||getGlobalXP()<30)return false;
    ensureMemoryHintNudgeUi();
    var hint=byId('q3-hint-btn');
    if(!hint||hint.disabled)return false;
    hint.classList.remove('memory-hint-nudge');
    void hint.offsetWidth;
    hint.classList.add('memory-hint-nudge');
    return true;
  }

  function ensureQ2FiftyUi(){
    if(!document.getElementById('tk2-q2-fifty-style')){
      var style=document.createElement('style');
      style.id='tk2-q2-fifty-style';
      style.textContent=''
        +'.q2-choice-key{flex:0 0 92px!important;max-width:92px!important;min-width:72px!important;border-color:rgba(6,182,212,.55)!important;color:#cffafe!important;background:rgba(6,182,212,.08)!important}'
        +'.q2-choice-or{font-family:\'Outfit\',sans-serif;font-size:.75rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;flex:0 0 auto}'
        +'.q2-choice-key.q2-choice-correct{background:linear-gradient(135deg,#10b981,#047857)!important;border-color:#34d399!important;color:#fff!important;box-shadow:0 0 35px rgba(16,185,129,.9)!important}'
        +'.q2-choice-key.q2-choice-wrong{background:linear-gradient(135deg,#ef4444,#b91c1c)!important;border-color:#f87171!important;color:#fff!important;box-shadow:0 0 30px rgba(239,68,68,.75)!important}'
        +'.q2-choice-key.q2-choice-muted{opacity:.34;filter:saturate(.45);box-shadow:0 3px 0 rgba(0,0,0,.45)!important}'
        +'@media(max-width:520px){.q2-choice-key{flex-basis:68px!important;max-width:68px!important;min-width:58px!important}.q2-choice-or{font-size:.64rem;letter-spacing:.04em}}';
      document.head.appendChild(style);
    }
    var heading=byId('q2-card')&&byId('q2-card').firstElementChild;
    if(heading)heading.textContent='🎲 Welche letzte Taste passt?';
  }

  function renderQ2Keys(item){
    ensureQ2FiftyUi();
    var correct=item.keys[item.keys.length-1];
    q2Choices=shuffleArray([correct,item.q2Wrong]);
    var fixed=item.keys.slice(0,-1).map(function(k){return '<div class="big-kbd" data-keyname="'+k+'">'+k+'</div>';}).join('<div class="plus-sign">+</div>');
    byId('q2-shortcut-display').innerHTML=''
      +fixed
      +'<div class="plus-sign">+</div>'
      +'<div class="big-kbd q2-choice-key" data-q2-key="'+q2Choices[0]+'">'+q2Choices[0]+'</div>'
      +'<div class="q2-choice-or">oder</div>'
      +'<div class="big-kbd q2-choice-key" data-q2-key="'+q2Choices[1]+'">'+q2Choices[1]+'</div>';
  }

  function clearQ2Feedback(){
    document.querySelectorAll('#q2-shortcut-display .q2-choice-key').forEach(function(key){key.classList.remove('q2-choice-correct','q2-choice-wrong','q2-choice-muted');});
  }

  function showQ2Success(item){
    var correct=item.keys[item.keys.length-1];
    var choices=document.querySelectorAll('#q2-shortcut-display .q2-choice-key');
    if(!choices.length){document.querySelectorAll('#q2-shortcut-display .big-kbd').forEach(function(key){key.classList.add('pressed-success');});return;}
    choices.forEach(function(key){
      if(key.getAttribute('data-q2-key')===correct)key.classList.add('q2-choice-correct');
      else key.classList.add('q2-choice-muted');
    });
  }

  function q2EventMatchesKey(key,e){
    if(key==='Home')return e.key==='Home'||e.code==='Home'||e.key==='Pos1';
    if(key==='End')return e.key==='End'||e.code==='End'||e.key==='Ende';
    return String(e.key).toLowerCase()===String(key).toLowerCase()||e.code==='Key'+String(key).toUpperCase();
  }

  function showQ2Wrong(item,e){
    if(!q2EventMatchesKey(item.q2Wrong,e))return;
    document.querySelectorAll('#q2-shortcut-display .q2-choice-key').forEach(function(key){
      if(key.getAttribute('data-q2-key')===item.q2Wrong)key.classList.add('q2-choice-wrong');
    });
  }

  function switchPhase(phaseNum){
    activePhase=phaseNum;
    [1,2,3,4].forEach(function(n){byId('phase-'+n).style.display=n===phaseNum?'block':'none';byId('tab-'+n).classList.toggle('active',n===phaseNum);});
    if(phaseNum===2)updateQ1Card();else if(phaseNum===3)checkQ2Unlock();else if(phaseNum===4)checkQ3Unlock();
    if(window.tk2SetTheoryActive)window.tk2SetTheoryActive(phaseNum===1);
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function resetQ1(){q1Shortcuts=shuffleArray(shortcuts);q1Index=0;q1CorrectHits=0;q1TotalAttempts=0;byId('q1-card').style.display='block';byId('q1-trophy-view').style.display='none';updateQ1Card();}
  function updateQ1Card(){
    q1Locked=false;
    if(q1Index>=q1Shortcuts.length){
      byId('q1-card').style.display='none';byId('q1-trophy-view').style.display='flex';
      var pct=accuracy(q1CorrectHits,q1TotalAttempts);saveQuestScore('q1',pct);
      if(pct>=80){byId('q1-result-title').textContent='🏆 Quest 1 bestanden!';byId('q1-result-title').style.color='var(--accent-green)';byId('q1-result-desc').textContent='Du hast '+pct+' % richtig. Quest 2 ist freigeschaltet.';byId('q1-to-q2-btn').style.display='inline-block';}
      else{byId('q1-result-title').textContent='⚠️ Noch nicht ganz';byId('q1-result-title').style.color='var(--accent-amber)';byId('q1-result-desc').textContent='Du hast '+pct+' % erreicht. Für Quest 2 brauchst du mindestens 80 %.';byId('q1-to-q2-btn').style.display='none';}
      return;
    }
    var item=q1Shortcuts[q1Index];byId('q1-title').textContent=item.title;byId('q1-desc').textContent=item.desc;renderKeys(byId('q1-shortcut-display'),item,-1,false);
    byId('q1-counter-label').textContent=(q1Index+1)+' / '+q1Shortcuts.length+' Kürzel';byId('q1-progress-bar').style.width=((q1Index+1)/q1Shortcuts.length*100)+'%';byId('q1-score-live').textContent='Richtig: '+accuracy(q1CorrectHits,q1TotalAttempts)+' %';
    byId('q1-status-msg').innerHTML='Warte auf Tastatur-Eingabe... <span style="color:var(--accent-amber)">Drücke die Tasten!</span>';byId('q1-card').classList.remove('success-flash','error-flash');
  }
  function handleQ1Success(){q1Locked=true;addGlobalXP(10);playSound('correct');q1CorrectHits++;q1TotalAttempts++;document.querySelectorAll('#q1-shortcut-display .big-kbd').forEach(function(b){b.classList.add('pressed-success');});byId('q1-card').classList.add('success-flash');byId('q1-status-msg').innerHTML='✨ <span style="color:var(--accent-green)">+10 XP!</span>';setTimeout(function(){q1Index++;updateQ1Card();},600);}
  function handleQ1Wrong(){q1Locked=true;addGlobalXP(-10);playSound('wrong');q1TotalAttempts++;byId('q1-card').classList.add('error-flash');byId('q1-status-msg').innerHTML='❌ <span style="color:var(--accent-red)">-10 XP!</span>';setTimeout(function(){byId('q1-card').classList.remove('error-flash');q1Locked=false;},600);}

  function checkQ2Unlock(){var ok=isQuestUnlocked('q2');byId('q2-lock-screen').style.display=ok?'none':'flex';byId('q2-game-screen').style.display=ok?'flex':'none';if(ok)updateQ2Card();}
  function resetQ2(){q2Shortcuts=shuffleArray(shortcuts);q2Index=0;q2CorrectHits=0;q2TotalAttempts=0;q2HintRevealed=false;q2Choices=[];byId('q2-card').style.display='block';byId('q2-trophy-view').style.display='none';updateQ2Card();}
  function updateQ2Card(){
    q2Locked=false;
    if(q2Index>=q2Shortcuts.length){
      byId('q2-card').style.display='none';byId('q2-trophy-view').style.display='flex';var pct=accuracy(q2CorrectHits,q2TotalAttempts);saveQuestScore('q2',pct);
      if(pct>=70){byId('q2-result-title').textContent='🎲🏆 Quest 2 gemeistert!';byId('q2-result-title').style.color='var(--accent-green)';byId('q2-result-desc').textContent='Du hast '+pct+' % richtig. Quest 3 ist freigeschaltet.';byId('q2-to-q3-btn').style.display='inline-block';}
      else{byId('q2-result-title').textContent='⚠️ Noch nicht ganz';byId('q2-result-title').style.color='var(--accent-amber)';byId('q2-result-desc').textContent='Du hast '+pct+' % erreicht. Für Quest 3 brauchst du mindestens 70 %.';byId('q2-to-q3-btn').style.display='none';}
      return;
    }
    q2HintRevealed=false;var item=q2Shortcuts[q2Index];byId('q2-title').textContent=item.title;byId('q2-desc').textContent=item.desc;renderQ2Keys(item);
    var xp=getGlobalXP(),hint=byId('q2-hint-btn');hint.disabled=xp<30;hint.textContent=xp<30?'💡 Tipp (-30 XP | Zu wenig XP)':'💡 Tipp (-30 XP)';
    byId('q2-counter-label').textContent=(q2Index+1)+' / '+q2Shortcuts.length+' Rätsel';byId('q2-progress-bar').style.width=((q2Index+1)/q2Shortcuts.length*100)+'%';byId('q2-score-live').textContent='Richtig: '+accuracy(q2CorrectHits,q2TotalAttempts)+' %';byId('q2-status-msg').innerHTML='<span style="color:var(--accent-amber)">Drücke das richtige vollständige Kürzel auf deiner Tastatur.</span>';byId('q2-card').classList.remove('success-flash','error-flash');
  }
  function useQ2Hint(){if(q2HintRevealed)return;if(getGlobalXP()<30){playSound('wrong');return;}q2HintRevealed=true;addGlobalXP(-30);playSound('hint');var item=q2Shortcuts[q2Index];renderKeys(byId('q2-shortcut-display'),item,-1,false);byId('q2-hint-btn').textContent='💡 Tipp genutzt (-30 XP)';byId('q2-hint-btn').disabled=true;}
  function handleQ2Success(){q2Locked=true;addGlobalXP(10);playSound('correct');q2CorrectHits++;q2TotalAttempts++;var item=q2Shortcuts[q2Index];showQ2Success(item);byId('q2-card').classList.add('success-flash');byId('q2-status-msg').innerHTML='✨ <span style="color:var(--accent-green)">Richtig – +10 XP!</span>';setTimeout(function(){q2Index++;updateQ2Card();},700);}
  function handleQ2Wrong(e){q2Locked=true;addGlobalXP(-10);playSound('wrong');q2TotalAttempts++;var item=q2Shortcuts[q2Index];showQ2Wrong(item,e);byId('q2-card').classList.add('error-flash');byId('q2-status-msg').innerHTML='❌ <span style="color:var(--accent-red)">Noch nicht.</span> Entscheide zwischen den beiden sichtbaren Tasten und versuche es erneut.';setTimeout(function(){byId('q2-card').classList.remove('error-flash');clearQ2Feedback();q2Locked=false;},650);}

  function checkQ3Unlock(){var ok=isQuestUnlocked('q3');byId('q3-lock-screen').style.display=ok?'none':'flex';byId('q3-game-screen').style.display=ok?'flex':'none';if(ok)updateQ3Card();}
  function resetQ3(){q3Shortcuts=shuffleArray(shortcuts);q3Index=0;q3CorrectHits=0;q3TotalAttempts=0;q3HintRevealed=false;q3Misses=0;byId('q3-card').style.display='block';byId('q3-trophy-view').style.display='none';updateQ3Card();}
  function updateQ3Card(){
    q3Locked=false;
    if(q3Index>=q3Shortcuts.length){
      byId('q3-card').style.display='none';byId('q3-trophy-view').style.display='flex';var pct=accuracy(q3CorrectHits,q3TotalAttempts);saveQuestScore('q3',pct);
      if(pct>=70){byId('q3-result-title').textContent='🧠🏆 Quest 3 gemeistert!';byId('q3-result-title').style.color='var(--accent-green)';byId('q3-result-desc').textContent='Du hast '+pct+' % richtig. A2 ist freigeschaltet.';byId('q3-to-a2-btn').style.display='inline-block';}
      else{byId('q3-result-title').textContent='⚠️ Noch nicht ganz';byId('q3-result-title').style.color='var(--accent-amber)';byId('q3-result-desc').textContent='Du hast '+pct+' % erreicht. Für A2 brauchst du mindestens 70 %.';byId('q3-to-a2-btn').style.display='none';}
      return;
    }
    q3HintRevealed=false;q3Misses=0;var item=q3Shortcuts[q3Index];byId('q3-title').textContent=item.title;byId('q3-desc').textContent=item.desc;renderQ3MemoryPrompt();
    var xp=getGlobalXP(),hint=byId('q3-hint-btn');hint.disabled=xp<30;hint.textContent=xp<30?'💡 Tipp (-30 XP | Zu wenig XP)':'💡 Tipp (-30 XP)';hint.classList.remove('memory-hint-nudge');
    byId('q3-counter-label').textContent=(q3Index+1)+' / '+q3Shortcuts.length+' Memory';byId('q3-progress-bar').style.width=((q3Index+1)/q3Shortcuts.length*100)+'%';byId('q3-score-live').textContent='Richtig: '+accuracy(q3CorrectHits,q3TotalAttempts)+' %';byId('q3-status-msg').innerHTML='Aus dem Gedächtnis: <span style="color:var(--accent-amber)">Drücke das passende Kürzel.</span>';byId('q3-card').classList.remove('success-flash','error-flash');
  }
  function useQ3Hint(){if(q3HintRevealed)return;if(getGlobalXP()<30){playSound('wrong');return;}q3HintRevealed=true;addGlobalXP(-30);playSound('hint');var item=q3Shortcuts[q3Index];renderKeys(byId('q3-shortcut-display'),item,-1,false);byId('q3-hint-btn').classList.remove('memory-hint-nudge');byId('q3-hint-btn').textContent='💡 Tipp genutzt (-30 XP)';byId('q3-hint-btn').disabled=true;}
  function handleQ3Success(){q3Locked=true;addGlobalXP(10);playSound('correct');q3CorrectHits++;q3TotalAttempts++;var item=q3Shortcuts[q3Index];renderKeys(byId('q3-shortcut-display'),item,-1,false);document.querySelectorAll('#q3-shortcut-display .big-kbd').forEach(function(b){b.classList.add('pressed-success');});byId('q3-card').classList.add('success-flash');byId('q3-status-msg').innerHTML='✨ <span style="color:var(--accent-green)">+10 XP!</span>';setTimeout(function(){q3Index++;updateQ3Card();},600);}
  function handleQ3Wrong(){q3Locked=true;addGlobalXP(-10);playSound('wrong');q3TotalAttempts++;q3Misses++;var nudged=nudgeQ3Hint();byId('q3-card').classList.add('error-flash');byId('q3-status-msg').innerHTML=nudged?'❌ <span style="color:var(--accent-red)">-10 XP.</span> <span style="color:var(--accent-amber)">💡 Unsicher? Der Tipp ist verfügbar.</span>':'❌ <span style="color:var(--accent-red)">-10 XP!</span>';setTimeout(function(){byId('q3-card').classList.remove('error-flash');q3Locked=false;},600);}

  function checkMatch(target,e){
    var ctrl=e.ctrlKey||e.metaKey;if(!ctrl)return false;if(Boolean(target.shift)!==e.shiftKey)return false;
    if(target.code==='Home')return e.key==='Home'||e.code==='Home'||e.key==='Pos1';
    if(target.code==='End')return e.key==='End'||e.code==='End'||e.key==='Ende';
    var last=target.keys[target.keys.length-1].toLowerCase();return e.key.toLowerCase()===last||(target.code&&e.code===target.code);
  }
  function preventBrowserShortcut(e){var k=e.key.toLowerCase();if(['s','p','f','h','a','z','y','v','x','c','o'].indexOf(k)>=0||e.key==='Home'||e.key==='End')e.preventDefault();}
  function showPressed(prefix,e){
    if(e.ctrlKey||e.metaKey||e.key==='Control'){var c=document.querySelector('#'+prefix+'-shortcut-display .big-kbd[data-keyname="Ctrl"]');if(c)c.classList.add('pressed');}
    if(e.shiftKey||e.key==='Shift'){var s=document.querySelector('#'+prefix+'-shortcut-display .big-kbd[data-keyname="Shift"]');if(s)s.classList.add('pressed');}
  }

  window.addEventListener('keydown',function(e){
    if(e.repeat)return;
    var target;
    if(activePhase===2){if(q1Locked||q1Index>=q1Shortcuts.length)return;target=q1Shortcuts[q1Index];showPressed('q1',e);if(e.ctrlKey||e.metaKey){preventBrowserShortcut(e);if(checkMatch(target,e))handleQ1Success();else if(e.key!=='Control'&&e.key!=='Shift')handleQ1Wrong();}}
    else if(activePhase===3&&isQuestUnlocked('q2')){if(q2Locked||q2Index>=q2Shortcuts.length)return;target=q2Shortcuts[q2Index];showPressed('q2',e);if(e.ctrlKey||e.metaKey){preventBrowserShortcut(e);if(checkMatch(target,e))handleQ2Success();else if(e.key!=='Control'&&e.key!=='Shift')handleQ2Wrong(e);}}
    else if(activePhase===4&&isQuestUnlocked('q3')){if(q3Locked||q3Index>=q3Shortcuts.length)return;target=q3Shortcuts[q3Index];showPressed('q3',e);if(e.ctrlKey||e.metaKey){preventBrowserShortcut(e);if(checkMatch(target,e))handleQ3Success();else if(e.key!=='Control'&&e.key!=='Shift')handleQ3Wrong();}}
  });
  window.addEventListener('keyup',function(e){if(!e.ctrlKey&&e.key!=='Control')document.querySelectorAll('.big-kbd[data-keyname="Ctrl"]').forEach(function(b){b.classList.remove('pressed');});if(!e.shiftKey&&e.key!=='Shift')document.querySelectorAll('.big-kbd[data-keyname="Shift"]').forEach(function(b){b.classList.remove('pressed');});});

  window.switchPhase=switchPhase;window.resetQ1=resetQ1;window.resetQ2=resetQ2;window.resetQ3=resetQ3;window.useQ2Hint=useQ2Hint;window.useQ3Hint=useQ3Hint;
  document.addEventListener('DOMContentLoaded',function(){
    var next=byId('q3-to-a2-btn');if(next)next.setAttribute('href','A2.html');
    var back=document.querySelector('.top-bar .back-link');if(back)back.setAttribute('href','index.html');
    var q2LockText=byId('q2-lock-screen')&&byId('q2-lock-screen').querySelector('p');if(q2LockText)q2LockText.innerHTML='Du benötigst <strong>mindestens 80 % richtig</strong> in Quest 1.';
    var q3LockText=byId('q3-lock-screen')&&byId('q3-lock-screen').querySelector('p');if(q3LockText)q3LockText.innerHTML='Du benötigst <strong>mindestens 70 % richtig</strong> in Quest 2.';
    clarifyContextDependentTheory();
    switchPhase(1);
  });
})();