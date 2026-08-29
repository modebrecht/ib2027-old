(function(){
  'use strict';

  var A3_PROGRESS_KEY='tk_a3_progress_v1';
  var A4_KEY='tk_a4_progress_v1';
  var A5_KEY='tk_a5_progress_v1';
  var A6_KEY='tk_a6_progress_v1';
  var A7_KEY='tk_a7_training_v1';
  var page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  var scope=page==='index.html'?'all':page.replace('.html','').toUpperCase();
  var pdfButton=null;

  var QUEST_LABELS={
    1:'Geführt',2:'Kürzel-Rätsel',3:'Memory',
    4:'Geführt',5:'Kürzel-Rätsel',6:'Memory',
    8:'Programme & Browser',9:'Windows & Arbeitsalltag',
    10:'Wiederholung A1',11:'Wiederholung A2',12:'Wiederholung A4 + A5',13:'Alles gemischt'
  };
  var SHEET_TITLES={A1:'Allgemeine Tastenkürzel',A2:'Sonderzeichen mit AltGr',A3:'Meine drei Tastenkürzel',A4:'Programme & Browser',A5:'Windows & Arbeitsalltag',A6:'Wiederholen & festigen',A7:'Training & Statistik'};

  function parse(key){try{return JSON.parse(localStorage.getItem(key)||'{}');}catch(e){return{};}}
  function owns(obj,key){return Object.prototype.hasOwnProperty.call(obj,key);}
  function num(value){return typeof value==='number'&&isFinite(value);}
  function getScores(){return typeof getQuestScores==='function'?getQuestScores():parse('tk_quest_scores_v1');}
  function attemptCount(entry){if(!entry)return 0;if(num(entry.attempts))return entry.attempts;return num(entry.first)?1:0;}

  function simpleRows(from,to){var scores=getScores(),rows=[];for(var q=from;q<=to;q++){var key='q'+q;if(!owns(scores,key))continue;rows.push({q:q,label:QUEST_LABELS[q],value:'Best '+String(scores[key])+' %'});}return rows;}
  function a3Rows(){
    var progress=parse(A3_PROGRESS_KEY);
    if(progress.schemaVersion!==2||progress.completed!==true||!Array.isArray(progress.choices)||progress.choices.length!==3)return[];
    return progress.choices.map(function(choice,index){
      return{q:null,label:(index+1)+'. '+(choice.shortcut||'Tastenkürzel'),value:'weil '+(choice.reason||'').trim()};
    });
  }
  function richRows(storageKey,defs,includeSecond){var data=parse(storageKey),rows=[];defs.forEach(function(def){var entry=data[def.key];if(!entry||!num(entry.first))return;var parts=['1. Versuch '+entry.first+' %'];if(includeSecond&&attemptCount(entry)>=2&&num(entry.second))parts.push('2. Versuch '+entry.second+' %');if(num(entry.best))parts.push('Best '+entry.best+' %');rows.push({q:def.q,label:QUEST_LABELS[def.q],value:parts.join(' · ')});});return rows;}

  function a7StationDetail(data,mode){
    var buckets=Object.values((data.modes&&data.modes[mode])||{});
    var runs=buckets.reduce(function(sum,b){return sum+(Number(b.completedRuns)||0);},0);
    var correct=buckets.reduce(function(sum,b){return sum+(Number(b.correct)||0);},0);
    var wrong=buckets.reduce(function(sum,b){return sum+(Number(b.wrong)||0);},0);
    var attempts=correct+wrong;
    var moves=buckets.reduce(function(sum,b){return sum+(Number(b.moves)||0);},0);
    var pairs=buckets.reduce(function(sum,b){return sum+(Number(b.pairs)||0);},0);
    return{runs:runs,correct:correct,wrong:wrong,attempts:attempts,accuracy:attempts?Math.round(correct/attempts*100):null,moves:moves,pairs:pairs};
  }
  function a7Rows(){
    var data=parse(A7_KEY);if(!data.modes)data.modes={};
    var challenge=a7StationDetail(data,'challenge'),hunt=a7StationDetail(data,'hunt'),memory=a7StationDetail(data,'memory');
    if(challenge.runs+hunt.runs+memory.runs===0)return[];
    var overallCorrect=challenge.correct+hunt.correct,overallWrong=challenge.wrong+hunt.wrong,overallAttempts=overallCorrect+overallWrong,overallAccuracy=overallAttempts?Math.round(overallCorrect/overallAttempts*100):null;
    return[
      {q:null,label:'Challenge',value:'Runden '+challenge.runs+' · Genauigkeit '+(challenge.accuracy===null?'–':challenge.accuracy+' %')+' · richtig '+challenge.correct+' · falsch '+challenge.wrong},
      {q:null,label:'Fehlerjagd',value:'Runden '+hunt.runs+' · Genauigkeit '+(hunt.accuracy===null?'–':hunt.accuracy+' %')+' · richtig '+hunt.correct+' · falsch '+hunt.wrong},
      {q:null,label:'Memory',value:'Runden '+memory.runs+' · Paare '+memory.pairs+' · Züge '+memory.moves+' · Genauigkeit separat'},
      {q:null,label:'Gesamt',value:'Gesamtgenauigkeit aus Challenge + Fehlerjagd: '+(overallAccuracy===null?'–':overallAccuracy+' %')+' · Gesammelte Antworten / Entscheidungen: '+overallAttempts}
    ];
  }

  function collectSheets(){return[
    {id:'A1',title:SHEET_TITLES.A1,rows:simpleRows(1,3)},
    {id:'A2',title:SHEET_TITLES.A2,rows:simpleRows(4,6)},
    {id:'A3',title:SHEET_TITLES.A3,rows:a3Rows()},
    {id:'A4',title:SHEET_TITLES.A4,rows:richRows(A4_KEY,[{key:'A',q:8}],true)},
    {id:'A5',title:SHEET_TITLES.A5,rows:richRows(A5_KEY,[{key:'A',q:9}],true)},
    {id:'A6',title:SHEET_TITLES.A6,rows:richRows(A6_KEY,[{key:'A',q:10},{key:'B',q:11},{key:'C',q:12},{key:'D',q:13}],false)},
    {id:'A7',title:SHEET_TITLES.A7,rows:a7Rows()}
  ];}
  function selectedSheets(which){var sheets=collectSheets();if(which==='all')return sheets.filter(function(s){return s.rows.length;});return sheets.filter(function(s){return s.id===which&&s.rows.length;});}

  function ensureJsPdf(){if(window.jspdf&&window.jspdf.jsPDF)return Promise.resolve();if(window.__tk2PdfLoading)return window.__tk2PdfLoading;window.__tk2PdfLoading=new Promise(function(resolve,reject){var script=document.createElement('script');script.src='../tk/vendor/jspdf.umd.min.js';script.onload=function(){window.jspdf&&window.jspdf.jsPDF?resolve():reject(new Error('jsPDF nicht verfügbar'));};script.onerror=function(){reject(new Error('jsPDF konnte nicht geladen werden'));};document.head.appendChild(script);});return window.__tk2PdfLoading;}
  function safeName(name){if(typeof sanitizeStudentNameForFileName==='function')return sanitizeStudentNameForFileName(name)||'Schueler';return(name||'Schueler').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'')||'Schueler';}

  function drawPdf(which,student,sheets){
    var jsPDF=window.jspdf.jsPDF,doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'}),W=210,H=297,M=16,y=18,green=[16,185,129],muted=[100,116,139],dark=[15,23,42];
    var entries=sheets.reduce(function(sum,s){return sum+s.rows.length;},0),title=which==='all'?'Zwischenstand Tastenkombinationen':'Arbeitsblatt '+which+' - '+SHEET_TITLES[which];
    function pageHeader(first){if(!first){doc.addPage();y=18;}doc.setFillColor(dark[0],dark[1],dark[2]);doc.rect(0,0,W,30,'F');doc.setTextColor(186,230,253);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('INFORMATIK B25 · TASTENKOMBINATIONEN',M,10);doc.setTextColor(255,255,255);doc.setFontSize(17);doc.text(title,M,20);y=38;}
    function ensure(height){if(y+height>H-18)pageHeader(false);}
    pageHeader(true);doc.setTextColor(dark[0],dark[1],dark[2]);doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text(student,M,y);y+=7;doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(muted[0],muted[1],muted[2]);var today=new Date().toLocaleDateString('de-CH',{day:'2-digit',month:'2-digit',year:'numeric'}),xp=typeof getGlobalXP==='function'?getGlobalXP():0,entryText=entries===1?'1 Eintrag':entries+' Einträge';doc.text('Stand: '+today+' · '+entryText+' · '+xp+' XP',M,y);y+=8;
    sheets.forEach(function(sheet){ensure(16+sheet.rows.length*10);doc.setFillColor(241,245,249);doc.roundedRect(M,y,W-M*2,11,2,2,'F');doc.setTextColor(2,132,199);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(sheet.id+' · '+sheet.title,M+4,y+7);y+=15;sheet.rows.forEach(function(row){ensure(11);doc.setTextColor(dark[0],dark[1],dark[2]);doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.text((row.q?'Q'+row.q+' · ':'')+row.label,M+2,y);doc.setFont('helvetica','normal');doc.setTextColor(71,85,105);doc.setFontSize(8.7);var wrapped=doc.splitTextToSize(row.value,W-M*2-8);doc.text(wrapped,M+6,y+5);y+=5+wrapped.length*4.3+2;doc.setDrawColor(226,232,240);doc.line(M+2,y-1,W-M-2,y-1);});y+=4;});
    ensure(18);doc.setFillColor(236,253,245);doc.roundedRect(M,y,W-M*2,14,2,2,'F');doc.setTextColor(green[0],green[1],green[2]);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text(which==='all'?'Enthält nur bereits bearbeitete Aufgaben, abgeschlossene Reflexionen und gespeicherte Trainingsdaten.':'Zwischenstand dieses Arbeitsblatts.',M+4,y+6);doc.setFont('helvetica','normal');doc.setTextColor(71,85,105);doc.setFontSize(8);doc.text('Weitere Versuche können später in einem neuen PDF erneut exportiert werden.',M+4,y+11);doc.save((which==='all'?'Zwischenstand_Tastenkombinationen':which+'_Tastenkombinationen')+'_'+safeName(student)+'.pdf');
  }
  function download(which){var sheets=selectedSheets(which);if(!sheets.length){alert(which==='all'?'Es gibt noch keine bearbeiteten Aufgaben für den PDF-Zwischenstand.':'In '+which+' gibt es noch keinen gespeicherten Fortschritt.');return;}var student=typeof requireStudentName==='function'?requireStudentName():prompt('Bitte gib deinen Vornamen ein:','');if(!student)return;ensureJsPdf().then(function(){drawPdf(which,student,sheets);}).catch(function(){alert('Das PDF konnte nicht erzeugt werden. Bitte lade die Seite neu und versuche es noch einmal.');});}
  function hasData(which){return selectedSheets(which).length>0;}

  function addHeaderButton(){var top=document.querySelector('.top-bar');if(!top)return;var host=top.querySelector('div:last-child')||top,btn=document.createElement('button');btn.type='button';btn.className='tk-btn-secondary tk2-pdf-action';btn.textContent='📄 PDF erzeugen';btn.style.whiteSpace='nowrap';btn.addEventListener('click',function(){download(scope);});host.appendChild(btn);pdfButton=btn;syncButton();}
  function addIndexCard(){var modules=document.querySelector('.modules');if(!modules)return;var card=document.createElement('article');card.className='module module-wide';card.id='module-pdf';card.style.cssText='--accent:#8b5cf6;--accent-dark:#6d28d9;--rgb:139,92,246;--glow:rgba(139,92,246,.07)';card.innerHTML='<div class="module-head"><span class="module-badge">PDF · Zwischenstand</span><span class="module-state" id="pdf-module-state">wird geprüft</span></div><div><h2>Deine bisherigen Ergebnisse als PDF</h2><p>Fasst automatisch nur die Arbeitsblätter, Quests und Trainingsdaten zusammen, die du bereits bearbeitet hast. Du kannst jederzeit einen neuen Zwischenstand erzeugen.</p></div><div class="module-tags"><span>A1–A7</span><span>nur bearbeitete Inhalte</span><span>Name + XP</span></div><div class="module-action"><span class="module-meta" id="pdf-module-meta">Noch keine Ergebnisse</span><button type="button" class="module-btn" id="pdf-module-btn" style="border:0;cursor:pointer">📄 Zwischenstand erzeugen</button></div>';modules.appendChild(card);pdfButton=card.querySelector('#pdf-module-btn');pdfButton.addEventListener('click',function(){download('all');});syncButton();}
  function syncButton(){if(!pdfButton)return;var available=hasData(scope);pdfButton.disabled=!available;pdfButton.style.opacity=available?'1':'.52';pdfButton.style.cursor=available?'pointer':'not-allowed';pdfButton.title=available?'PDF mit aktuellem Zwischenstand erzeugen':'PDF verfügbar, sobald mindestens eine Aufgabe bearbeitet wurde';if(scope==='all'){var sheets=selectedSheets('all'),entries=sheets.reduce(function(n,s){return n+s.rows.length;},0),state=document.getElementById('pdf-module-state'),meta=document.getElementById('pdf-module-meta');if(state)state.textContent=entries?entries+' Eintr'+(entries===1?'ag':'äge')+' erfasst':'noch keine Ergebnisse';if(meta)meta.textContent=entries?sheets.length+' Arbeitsblatt'+(sheets.length===1?'':'blätter')+' · '+entries+' Eintr'+(entries===1?'ag':'äge'):'Noch keine Ergebnisse';}}
  function hideLegacyA6Pdf(){if(page!=='a6.html')return;['quickPdfBtn','downloadPdfBtn','finishPdfBtn'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none';});}
  var originalSave=window.saveQuestScore;if(typeof originalSave==='function'){window.saveQuestScore=function(){var result=originalSave.apply(this,arguments);setTimeout(syncButton,0);return result;};}
  if(scope==='all')addIndexCard();else if(scope!=='A7')addHeaderButton();hideLegacyA6Pdf();document.addEventListener('visibilitychange',function(){if(!document.hidden)syncButton();});window.addEventListener('focus',syncButton);window.tk2Pdf={download:download,collectSheets:collectSheets,sync:syncButton};
})();
