(function(){
  'use strict';

  var altgrItems=[
    {title:'Klammeraffe',char:'@',key2:'2',desc:'Wichtig für E-Mail-Adressen.',q5Wrong:'3'},
    {title:'Hashtag / Raute',char:'#',key2:'3',desc:'Für Hashtags, Social Media und Code.',q5Wrong:'2'},
    {title:'Euro-Zeichen',char:'€',key2:'E',desc:'Das Währungszeichen für Euro.',q5Wrong:'4'},
    {title:'Senkrechter Strich (Pipe)',char:'|',key2:'7',desc:'Wird häufig in Informatik und Befehlszeilen verwendet.',q5Wrong:'<'},
    {title:'Backslash',char:'\\',key2:'<',desc:'Kommt zum Beispiel in Windows-Dateipfaden vor.',q5Wrong:'7'},
    {title:'Eckige Klammer auf',char:'[',key2:'ü',desc:'Öffnet eine eckige Klammer, zum Beispiel bei Listen im Code.',q5Wrong:'ä'},
    {title:'Eckige Klammer zu',char:']',key2:'¨',desc:'Schliesst eine eckige Klammer.',q5Wrong:'$'},
    {title:'Geschweifte Klammer auf',char:'{',key2:'ä',desc:'Öffnet häufig einen Codeblock.',q5Wrong:'ü'},
    {title:'Geschweifte Klammer zu',char:'}',key2:'$',desc:'Schliesst häufig einen Codeblock.',q5Wrong:'¨'},
    {title:'Gradzeichen',char:'°',key2:'4',desc:'Für Temperaturangaben wie 21 °C.',q5Wrong:'3'}
  ];

  function byId(id){return document.getElementById(id);}
  function shuffle(arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function accuracy(c,t){return t===0?100:Math.round(c/t*100);}
  function escapeHtml(value){return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function comboHtml(item,mode){
    if(mode==='guided')return '<div class="big-kbd">AltGr</div><div class="plus-sign">+</div><div class="big-kbd">'+escapeHtml(item.key2)+'</div>';
    if(mode==='partial')return '<div class="big-kbd">AltGr</div><div class="plus-sign">+</div><div class="big-kbd">?</div>';
    return '<div class="big-kbd">?</div><div class="plus-sign">+</div><div class="big-kbd">?</div>';
  }

  var activePhase=1;
  var q4Items=shuffle(altgrItems),q4Index=0,q4Correct=0,q4Attempts=0,q4Locked=false;
  var q5Items=shuffle(altgrItems),q5Index=0,q5Correct=0,q5Attempts=0,q5Locked=false,q5Hint=false,q5Choices=[];
  var q6Items=shuffle(altgrItems),q6Index=0,q6Correct=0,q6Attempts=0,q6Locked=false,q6Hint=false,q6Misses=0;

  function ensureMemoryHintNudgeUi(){
    if(document.getElementById('tk2-memory-hint-style'))return;
    var style=document.createElement('style');
    style.id='tk2-memory-hint-style';
    style.textContent='@keyframes tk2HintNudge{0%,100%{transform:scale(1)}50%{transform:scale(1.04);box-shadow:0 0 0 5px rgba(245,158,11,.12)}}.memory-hint-nudge{animation:tk2HintNudge 1.05s ease-in-out 2}';
    document.head.appendChild(style);
  }

  function nudgeQ6Hint(){
    if(q6Misses<2||q6Hint||getGlobalXP()<30)return false;
    ensureMemoryHintNudgeUi();
    var hint=byId('q6-hint-btn');
    if(!hint||hint.disabled)return false;
    hint.classList.remove('memory-hint-nudge');
    void hint.offsetWidth;
    hint.classList.add('memory-hint-nudge');
    return true;
  }

  function ensureQ5FiftyUi(){
    if(document.getElementById('tk2-q5-fifty-style'))return;
    var style=document.createElement('style');
    style.id='tk2-q5-fifty-style';
    style.textContent=''
      +'.q5-choice-key{flex:0 0 92px!important;max-width:92px!important;min-width:72px!important;border-color:rgba(6,182,212,.55)!important;color:#cffafe!important;background:rgba(6,182,212,.08)!important}'
      +'.q5-choice-or{font-family:\'Outfit\',sans-serif;font-size:.75rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;flex:0 0 auto}'
      +'.q5-choice-key.q5-choice-correct{background:linear-gradient(135deg,#10b981,#047857)!important;border-color:#34d399!important;color:#fff!important;box-shadow:0 0 35px rgba(16,185,129,.9)!important}'
      +'.q5-choice-key.q5-choice-wrong{background:linear-gradient(135deg,#ef4444,#b91c1c)!important;border-color:#f87171!important;color:#fff!important;box-shadow:0 0 30px rgba(239,68,68,.75)!important}'
      +'.q5-choice-key.q5-choice-muted{opacity:.34;filter:saturate(.45);box-shadow:0 3px 0 rgba(0,0,0,.45)!important}'
      +'@media(max-width:520px){.q5-choice-key{flex-basis:68px!important;max-width:68px!important;min-width:58px!important}.q5-choice-or{font-size:.64rem;letter-spacing:.04em}}';
    document.head.appendChild(style);
  }

  function renderQ5Keys(item){
    ensureQ5FiftyUi();
    q5Choices=shuffle([item.key2,item.q5Wrong]);
    byId('q5-shortcut-display').innerHTML=''
      +'<div class="big-kbd">AltGr</div>'
      +'<div class="plus-sign">+</div>'
      +'<div class="big-kbd q5-choice-key" data-q5-key="'+escapeHtml(q5Choices[0])+'">'+escapeHtml(q5Choices[0])+'</div>'
      +'<div class="q5-choice-or">oder</div>'
      +'<div class="big-kbd q5-choice-key" data-q5-key="'+escapeHtml(q5Choices[1])+'">'+escapeHtml(q5Choices[1])+'</div>';
  }

  function q5CharForKey(key){
    for(var i=0;i<altgrItems.length;i++)if(altgrItems[i].key2===key)return altgrItems[i].char;
    return '';
  }

  function clearQ5Feedback(){
    document.querySelectorAll('#q5-shortcut-display .q5-choice-key').forEach(function(key){key.classList.remove('q5-choice-correct','q5-choice-wrong','q5-choice-muted');});
  }

  function showQ5Success(item){
    var choices=document.querySelectorAll('#q5-shortcut-display .q5-choice-key');
    if(!choices.length){document.querySelectorAll('#q5-shortcut-display .big-kbd').forEach(function(key){key.classList.add('pressed-success');});return;}
    choices.forEach(function(key){
      if(key.getAttribute('data-q5-key')===item.key2)key.classList.add('q5-choice-correct');
      else key.classList.add('q5-choice-muted');
    });
  }

  function showQ5Wrong(item,typed){
    var wrongChar=q5CharForKey(item.q5Wrong);
    if(!wrongChar||String(typed).indexOf(wrongChar)===-1)return;
    document.querySelectorAll('#q5-shortcut-display .q5-choice-key').forEach(function(key){
      if(key.getAttribute('data-q5-key')===item.q5Wrong)key.classList.add('q5-choice-wrong');
    });
  }

  document.addEventListener('DOMContentLoaded',function(){
    // Das Arbeitsblatt A2 ist immer offen. Nur die Quests innerhalb von A2
    // bauen weiterhin aufeinander auf.
    byId('a2-lock-screen').style.display='none';
    byId('a2-content-wrap').style.display='block';
    var next=byId('q6-to-a3-btn');if(next)next.setAttribute('href','A3.html');
    var q6Tab=byId('tab-4');if(q6Tab)q6Tab.textContent='🧠 Q6: Memory';
    var q6Heading=byId('q6-card')&&byId('q6-card').firstElementChild;if(q6Heading)q6Heading.textContent='🧠 Memory – Aus dem Gedächtnis';
    var q5Heading=byId('q5-card')&&byId('q5-card').firstElementChild;if(q5Heading)q5Heading.textContent='🎲 Welche zweite Taste passt?';
    ['q4-char-input','q5-char-input','q6-char-input'].forEach(function(id){
      var input=byId(id);if(!input)return;
      input.addEventListener('paste',function(e){e.preventDefault();});
      input.addEventListener('drop',function(e){e.preventDefault();});
      input.addEventListener('contextmenu',function(e){e.preventDefault();});
    });
  });

  function switchPhase(n){
    activePhase=n;
    [1,2,3,4].forEach(function(i){byId('phase-'+i).style.display=i===n?'block':'none';byId('tab-'+i).classList.toggle('active',i===n);});
    if(n===2)updateQ4();else if(n===3)checkQ5();else if(n===4)checkQ6();
    if(window.tk2SetTheoryActive)window.tk2SetTheoryActive(n===1);
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function finishQuest(prefix,questId,correct,attempts,pass,toNext,nextLabel){
    var pct=accuracy(correct,attempts);saveQuestScore(questId,pct);
    byId(prefix+'-card').style.display='none';byId(prefix+'-trophy-view').style.display='flex';
    if(pct>=pass){byId(prefix+'-result-title').textContent='🏆 '+prefix.toUpperCase()+' bestanden!';byId(prefix+'-result-title').style.color='var(--accent-green)';byId(prefix+'-result-desc').textContent='Du hast '+pct+' % richtig. '+nextLabel+' ist freigeschaltet.';if(toNext)byId(toNext).style.display='inline-block';}
    else{byId(prefix+'-result-title').textContent='⚠️ Noch nicht ganz';byId(prefix+'-result-title').style.color='var(--accent-amber)';byId(prefix+'-result-desc').textContent='Du hast '+pct+' % richtig. Du brauchst mindestens '+pass+' %.';if(toNext)byId(toNext).style.display='none';}
  }

  function setCommon(prefix,item,index,total,correct,attempts){
    byId(prefix+'-symbol-box').textContent=item.char;byId(prefix+'-title').textContent=item.title;byId(prefix+'-desc').textContent=item.desc;
    byId(prefix+'-counter-label').textContent=(index+1)+' / '+total+' Zeichen';byId(prefix+'-progress-bar').style.width=((index+1)/total*100)+'%';byId(prefix+'-score-live').textContent='Richtig: '+accuracy(correct,attempts)+' %';
    var input=byId(prefix+'-char-input');input.value='';setTimeout(function(){input.focus();},0);
  }

  function resetQ4(){q4Items=shuffle(altgrItems);q4Index=0;q4Correct=0;q4Attempts=0;q4Locked=false;byId('q4-card').style.display='block';byId('q4-trophy-view').style.display='none';updateQ4();}
  function updateQ4(){
    q4Locked=false;if(q4Index>=q4Items.length){finishQuest('q4','q4',q4Correct,q4Attempts,80,'q4-to-q5-btn','Quest 5');return;}
    var item=q4Items[q4Index];setCommon('q4',item,q4Index,q4Items.length,q4Correct,q4Attempts);byId('q4-shortcut-display').innerHTML=comboHtml(item,'guided');byId('q4-status-msg').textContent='Tippe das gezeigte Sonderzeichen selbst mit AltGr.';byId('q4-card').classList.remove('success-flash','error-flash');
  }
  byId('q4-char-input').addEventListener('input',function(e){if(activePhase!==2||q4Locked||q4Index>=q4Items.length||!e.target.value)return;var item=q4Items[q4Index];q4Locked=true;q4Attempts++;if(e.target.value.indexOf(item.char)!==-1){q4Correct++;addGlobalXP(10);playSound('correct');byId('q4-card').classList.add('success-flash');byId('q4-status-msg').innerHTML='✨ <span style="color:var(--accent-green)">+10 XP</span>';setTimeout(function(){q4Index++;updateQ4();},600);}else{addGlobalXP(-10);playSound('wrong');byId('q4-card').classList.add('error-flash');byId('q4-status-msg').innerHTML='❌ <span style="color:var(--accent-red)">-10 XP</span>';setTimeout(function(){byId('q4-card').classList.remove('error-flash');e.target.value='';q4Locked=false;},600);}});

  function checkQ5(){var ok=isQuestUnlocked('q5');byId('q5-lock-screen').style.display=ok?'none':'flex';byId('q5-game-screen').style.display=ok?'flex':'none';if(ok)updateQ5();}
  function resetQ5(){q5Items=shuffle(altgrItems);q5Index=0;q5Correct=0;q5Attempts=0;q5Locked=false;q5Hint=false;q5Choices=[];byId('q5-card').style.display='block';byId('q5-trophy-view').style.display='none';updateQ5();}
  function updateQ5(){
    q5Locked=false;if(q5Index>=q5Items.length){finishQuest('q5','q5',q5Correct,q5Attempts,70,'q5-to-q6-btn','Quest 6');return;}
    q5Hint=false;var item=q5Items[q5Index];setCommon('q5',item,q5Index,q5Items.length,q5Correct,q5Attempts);renderQ5Keys(item);
    var hint=byId('q5-hint-btn'),xp=getGlobalXP();hint.disabled=xp<30;hint.textContent=xp<30?'💡 Tipp (-30 XP | Zu wenig XP)':'💡 Tipp (-30 XP)';byId('q5-status-msg').textContent='Das Zielzeichen bleibt sichtbar. Entscheide zwischen den zwei Tasten und tippe das Zeichen mit AltGr.';byId('q5-card').classList.remove('success-flash','error-flash');
  }
  function useQ5Hint(){if(q5Hint)return;if(getGlobalXP()<30){playSound('wrong');return;}q5Hint=true;addGlobalXP(-30);playSound('hint');var item=q5Items[q5Index];byId('q5-shortcut-display').innerHTML=comboHtml(item,'guided');byId('q5-hint-btn').disabled=true;byId('q5-hint-btn').textContent='💡 Tipp genutzt (-30 XP)';}
  byId('q5-char-input').addEventListener('input',function(e){if(activePhase!==3||q5Locked||q5Index>=q5Items.length||!e.target.value)return;var item=q5Items[q5Index],typed=e.target.value;q5Locked=true;q5Attempts++;if(typed.indexOf(item.char)!==-1){q5Correct++;addGlobalXP(10);playSound('correct');showQ5Success(item);byId('q5-card').classList.add('success-flash');byId('q5-status-msg').innerHTML='✨ <span style="color:var(--accent-green)">Richtig – +10 XP</span>';setTimeout(function(){q5Index++;updateQ5();},700);}else{addGlobalXP(-10);playSound('wrong');showQ5Wrong(item,typed);byId('q5-card').classList.add('error-flash');byId('q5-status-msg').innerHTML='❌ <span style="color:var(--accent-red)">Noch nicht.</span> Entscheide zwischen den beiden sichtbaren Tasten und versuche es erneut.';setTimeout(function(){byId('q5-card').classList.remove('error-flash');clearQ5Feedback();e.target.value='';q5Locked=false;},650);}});

  function checkQ6(){var ok=isQuestUnlocked('q6');byId('q6-lock-screen').style.display=ok?'none':'flex';byId('q6-game-screen').style.display=ok?'flex':'none';if(ok)updateQ6();}
  function resetQ6(){q6Items=shuffle(altgrItems);q6Index=0;q6Correct=0;q6Attempts=0;q6Locked=false;q6Hint=false;q6Misses=0;byId('q6-card').style.display='block';byId('q6-trophy-view').style.display='none';updateQ6();}
  function updateQ6(){
    q6Locked=false;if(q6Index>=q6Items.length){finishQuest('q6','q6',q6Correct,q6Attempts,70,'q6-to-a3-btn','A3');return;}
    q6Hint=false;q6Misses=0;var item=q6Items[q6Index];setCommon('q6',item,q6Index,q6Items.length,q6Correct,q6Attempts);byId('q6-shortcut-display').innerHTML=comboHtml(item,'blind');
    var hint=byId('q6-hint-btn'),xp=getGlobalXP();hint.disabled=xp<30;hint.textContent=xp<30?'💡 Tipp (-30 XP | Zu wenig XP)':'💡 Tipp (-30 XP)';hint.classList.remove('memory-hint-nudge');byId('q6-status-msg').textContent='Das Zielzeichen bleibt sichtbar. Erinnere dich an beide Tasten.';byId('q6-card').classList.remove('success-flash','error-flash');
  }
  function useQ6Hint(){if(q6Hint)return;if(getGlobalXP()<30){playSound('wrong');return;}q6Hint=true;addGlobalXP(-30);playSound('hint');var item=q6Items[q6Index];byId('q6-shortcut-display').innerHTML=comboHtml(item,'guided');byId('q6-hint-btn').classList.remove('memory-hint-nudge');byId('q6-hint-btn').disabled=true;byId('q6-hint-btn').textContent='💡 Tipp genutzt (-30 XP)';}
  byId('q6-char-input').addEventListener('input',function(e){if(activePhase!==4||q6Locked||q6Index>=q6Items.length||!e.target.value)return;var item=q6Items[q6Index];q6Locked=true;q6Attempts++;if(e.target.value.indexOf(item.char)!==-1){q6Correct++;addGlobalXP(10);playSound('correct');byId('q6-shortcut-display').innerHTML=comboHtml(item,'guided');document.querySelectorAll('#q6-shortcut-display .big-kbd').forEach(function(k){k.classList.add('pressed-success');});byId('q6-card').classList.add('success-flash');byId('q6-status-msg').innerHTML='✨ <span style="color:var(--accent-green)">+10 XP</span>';setTimeout(function(){q6Index++;updateQ6();},600);}else{addGlobalXP(-10);playSound('wrong');q6Misses++;var nudged=nudgeQ6Hint();byId('q6-card').classList.add('error-flash');byId('q6-status-msg').innerHTML=nudged?'❌ <span style="color:var(--accent-red)">-10 XP.</span> <span style="color:var(--accent-amber)">💡 Unsicher? Der Tipp ist verfügbar.</span>':'❌ <span style="color:var(--accent-red)">-10 XP</span>';setTimeout(function(){byId('q6-card').classList.remove('error-flash');e.target.value='';q6Locked=false;},600);}});

  window.switchPhase=switchPhase;window.resetQ4=resetQ4;window.resetQ5=resetQ5;window.resetQ6=resetQ6;window.useQ5Hint=useQ5Hint;window.useQ6Hint=useQ6Hint;
})();