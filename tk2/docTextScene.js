(function(){
  'use strict';

  var sceneCounter = 0;
  var LOOP_MS = 4200;
  var MODES = {
    copy:{keys:['Ctrl','C'],label:'Kopieren'},
    cut:{keys:['Ctrl','X'],label:'Ausschneiden'},
    paste:{keys:['Ctrl','V'],label:'Einfügen'},
    pastePlain:{keys:['Ctrl','Shift','V'],label:'Ohne Formatierung einfügen'},
    undo:{keys:['Ctrl','Z'],label:'Rückgängig'},
    redo:{keys:['Ctrl','Y'],label:'Wiederherstellen'},
    save:{keys:['Ctrl','S'],label:'Speichern'},
    selectAll:{keys:['Ctrl','A'],label:'Alles markieren'}
  };

  function createDocTextScene(container, options){
    options = options || {};
    var mode = options.mode || 'copy';
    var active = options.autoplay !== false;
    var autoLoop = options.loop !== false;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var uid = 'tk2doc' + (++sceneCounter);
    var timers = [];
    var running = false;
    var cfg = MODES[mode] || MODES.copy;

    function keyWidth(key){
      return key === 'Shift' ? 78 : (key === 'Ctrl' ? 68 : 48);
    }

    function keyRowWidth(keys){
      return keys.reduce(function(total,key){ return total + keyWidth(key); },0) + Math.max(0,keys.length-1)*26;
    }

    function keyMarkup(keys){
      var x = 0;
      return keys.map(function(key, index){
        var w = keyWidth(key);
        var base = 'translate('+x+' 0)';
        var block = '<g class="tk2-key" data-key="'+key+'" data-base="'+base+'" transform="'+base+'">'+
          '<rect width="'+w+'" height="42" rx="10" fill="#172033" stroke="#475569" stroke-width="1.5"/>'+
          '<text x="'+(w/2)+'" y="27" text-anchor="middle" font-family="Arial,sans-serif" font-size="'+(key.length>4?12:14)+'" font-weight="800" fill="#dbeafe">'+key+'</text></g>';
        x += w;
        if(index < keys.length-1){
          block += '<text x="'+(x+9)+'" y="27" font-family="Arial,sans-serif" font-size="16" font-weight="800" fill="#64748b">+</text>';
          x += 26;
        }
        return block;
      }).join('');
    }

    var keyX = 425;

    container.innerHTML = ''+
      '<svg class="tk2-doc-scene" viewBox="0 0 680 320" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animation: '+cfg.label+'">'+
      '<defs>'+
        '<filter id="'+uid+'Shadow" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="0" dy="9" stdDeviation="10" flood-color="#020617" flood-opacity=".38"/></filter>'+
        '<linearGradient id="'+uid+'Paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f8fafc"/></linearGradient>'+
        '<linearGradient id="'+uid+'Sel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#60a5fa" stop-opacity=".58"/><stop offset="1" stop-color="#22d3ee" stop-opacity=".34"/></linearGradient>'+
      '</defs>'+
      '<rect width="680" height="320" rx="24" fill="#07101f"/>'+
      '<circle cx="620" cy="42" r="110" fill="#2563eb" opacity=".06"/>'+
      '<g class="doc" filter="url(#'+uid+'Shadow)">'+
        '<rect x="30" y="24" width="365" height="270" rx="16" fill="url(#'+uid+'Paper)"/>'+
        '<rect x="30" y="24" width="365" height="36" rx="16" fill="#e2e8f0"/>'+
        '<rect x="30" y="44" width="365" height="16" fill="#e2e8f0"/>'+
        '<circle cx="50" cy="42" r="4" fill="#fb7185"/><circle cx="66" cy="42" r="4" fill="#fbbf24"/><circle cx="82" cy="42" r="4" fill="#34d399"/>'+
        '<text x="108" y="46" font-family="Arial,sans-serif" font-size="10" font-weight="700" fill="#475569">Projektbericht.docx</text>'+
        '<g class="unsaved-dot"><circle cx="370" cy="42" r="5" fill="#f59e0b"/></g>'+
        '<g class="saved-badge" opacity="0"><circle cx="366" cy="42" r="8" fill="#10b981"/><path d="M362 42l3 3 5-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>'+
        '<rect x="60" y="80" width="148" height="13" rx="6.5" fill="#0f172a" opacity=".9"/>'+
        '<g class="text-lines">'+
          '<rect x="60" y="111" width="270" height="8" rx="4" fill="#94a3b8"/>'+
          '<rect x="60" y="130" width="246" height="8" rx="4" fill="#94a3b8"/>'+
          '<rect x="60" y="149" width="278" height="8" rx="4" fill="#94a3b8"/>'+
        '</g>'+
        '<g class="source-row">'+
          '<rect class="single-selection" x="56" y="174" width="0" height="31" rx="7" fill="url(#'+uid+'Sel)"/>'+
          '<text class="source-text" x="64" y="195" font-family="Arial,sans-serif" font-size="17" font-weight="700" fill="#0f172a">wichtiger Text</text>'+
        '</g>'+
        '<g class="all-selection" opacity="0"><rect x="54" y="105" width="292" height="101" rx="9" fill="url(#'+uid+'Sel)"/></g>'+
        '<g class="paste-target">'+
          '<line class="caret" x1="64" y1="224" x2="64" y2="246" stroke="#2563eb" stroke-width="2.5" opacity="0"/>'+
          '<text class="pasted-rich" x="70" y="241" font-family="Arial,sans-serif" font-size="17" font-weight="800" fill="#2563eb" opacity="0">WICHTIGER TEXT</text>'+
          '<line class="rich-underline" x1="70" y1="246" x2="208" y2="246" stroke="#f59e0b" stroke-width="3" opacity="0"/>'+
          '<text class="pasted-plain" x="70" y="241" font-family="Arial,sans-serif" font-size="17" font-weight="400" fill="#334155" opacity="0">wichtiger Text</text>'+
        '</g>'+
        '<g class="history-state">'+
          '<rect class="history-chip" x="60" y="259" width="120" height="19" rx="9.5" fill="#dbeafe" opacity="0"/>'+
          '<text class="history-text" x="120" y="272" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="700" fill="#1d4ed8" opacity="0">Änderung aktiv</text>'+
        '</g>'+
      '</g>'+
      '<path class="transfer-path" d="M205 190 C300 164 350 120 435 121" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="7 8" opacity="0"/>'+
      '<circle class="transfer-dot" cx="205" cy="190" r="5" fill="#7dd3fc" opacity="0"/>'+
      '<g class="clipboard" transform="translate(425 68)" filter="url(#'+uid+'Shadow)">'+
        '<rect width="104" height="139" rx="18" fill="#111c30" stroke="#334155" stroke-width="1.5"/>'+
        '<rect x="30" y="-9" width="44" height="25" rx="9" fill="#334155"/>'+
        '<rect x="18" y="31" width="68" height="7" rx="3.5" fill="#64748b"/>'+
        '<rect x="18" y="48" width="57" height="7" rx="3.5" fill="#64748b"/>'+
        '<rect x="15" y="72" width="74" height="34" rx="8" fill="#09111f" stroke="#475569"/>'+
        '<text class="clip-text" x="52" y="93" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="700" fill="#7dd3fc" opacity="0">wichtiger Text</text>'+
        '<text class="clip-rich" x="52" y="90" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="900" fill="#60a5fa" opacity="0">WICHTIG</text>'+
        '<rect class="clip-rich-line" x="30" y="96" width="44" height="3" rx="1.5" fill="#f59e0b" opacity="0"/>'+
        '<text x="52" y="126" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#94a3b8">Zwischenablage</text>'+
      '</g>'+
      '<g class="keys" transform="translate('+keyX+' 240)">'+keyMarkup(cfg.keys)+'</g>'+
      '<g class="flying" opacity="0"><rect x="56" y="174" width="148" height="31" rx="7" fill="#2563eb" opacity=".2"/><text x="64" y="195" font-family="Arial,sans-serif" font-size="17" font-weight="700" fill="#7dd3fc">wichtiger Text</text></g>'+
      '<g class="history-arrow" opacity="0" transform="translate(427 205)"><path d="M60 10C31 -5 8 6 9 31" fill="none" stroke="#10b981" stroke-width="5" stroke-linecap="round"/><path d="M2 22l7 11 10-9" fill="none" stroke="#10b981" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>'+
      '<g class="status-toast" opacity="0" transform="translate(382 20)"><rect width="190" height="30" rx="15" fill="#052e2b" stroke="#10b981"/><circle cx="18" cy="15" r="7" fill="#10b981"/><path d="M14 15l3 3 5-6" fill="none" stroke="#fff" stroke-width="1.8"/><text class="toast-text" x="32" y="19" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="#a7f3d0">Fertig</text></g>'+
      '</svg>';

    var svg = container.querySelector('svg');
    var $ = function(sel){ return svg.querySelector(sel); };
    var $$ = function(sel){ return Array.from(svg.querySelectorAll(sel)); };

    function later(ms, fn){ timers.push(window.setTimeout(fn, ms)); }
    function clearTimers(){ timers.forEach(window.clearTimeout); timers = []; }
    function trans(el, value){ if(el) el.style.transition = reduceMotion ? 'none' : value; }
    function opacity(el, value){ if(el) el.setAttribute('opacity', String(value)); }
    function toast(text){ $('.toast-text').textContent = text; opacity($('.status-toast'),1); }
    function usesClipboard(){ return mode==='copy'||mode==='cut'||mode==='paste'||mode==='pastePlain'; }

    function pressKeys(){
      $$('.tk2-key').forEach(function(key, i){
        later(i*150, function(){
          var base = key.getAttribute('data-base');
          trans(key,'transform 160ms ease, filter 160ms ease');
          key.setAttribute('transform', base + ' translate(0 4)');
          key.style.filter='drop-shadow(0 0 8px rgba(56,189,248,.75))';
          later(240,function(){ key.setAttribute('transform',base); key.style.filter=''; });
        });
      });
    }

    function reset(){
      clearTimers(); running=false;
      trans($('.single-selection'),'none'); $('.single-selection').setAttribute('width','0');
      opacity($('.all-selection'),0);
      opacity($('.source-text'),1);
      opacity($('.flying'),0); $('.flying').setAttribute('transform','translate(0 0) scale(1)');
      opacity($('.transfer-path'),0); opacity($('.transfer-dot'),0); $('.transfer-dot').setAttribute('transform','translate(0 0)');
      opacity($('.clipboard'),usesClipboard()?1:0);
      opacity($('.clip-text'),0); opacity($('.clip-rich'),0); opacity($('.clip-rich-line'),0);
      opacity($('.caret'),0); opacity($('.pasted-rich'),0); opacity($('.pasted-plain'),0); opacity($('.rich-underline'),0);
      opacity($('.status-toast'),0); opacity($('.saved-badge'),0); opacity($('.unsaved-dot'),1);
      opacity($('.history-arrow'),0); $('.history-arrow').setAttribute('transform','translate(427 205) scale(1 1)');
      opacity($('.history-chip'),0); opacity($('.history-text'),0);
      $$('.tk2-key').forEach(function(k){k.style.transition='none';k.style.filter='';k.setAttribute('transform',k.getAttribute('data-base'));});
    }

    function showTransfer(){
      opacity($('.transfer-path'),.75); opacity($('.transfer-dot'),1);
      trans($('.transfer-dot'),'transform 720ms cubic-bezier(.2,.75,.25,1)');
      $('.transfer-dot').setAttribute('transform','translate(230 -69)');
    }

    function selectSingle(){
      later(180,function(){ trans($('.single-selection'),'width 520ms cubic-bezier(.2,.8,.25,1)'); $('.single-selection').setAttribute('width','152'); });
    }

    function playCopy(cut){
      selectSingle();
      later(830,pressKeys);
      later(1260,function(){
        showTransfer();
        opacity($('.flying'),1);
        trans($('.flying'),'transform 720ms cubic-bezier(.2,.78,.25,1), opacity 160ms ease');
        $('.flying').setAttribute('transform','translate(415 66) scale(.48)');
      });
      later(2030,function(){
        opacity($('.flying'),0); opacity($('.transfer-dot'),0); opacity($('.clip-text'),1);
        if(cut){ trans($('.source-text'),'opacity 330ms ease'); opacity($('.source-text'),0); toast('Original entfernt · Kopie bleibt'); }
        else toast('Kopie in Zwischenablage');
      });
      later(2480,function(){ opacity($('.transfer-path'),0); });
    }

    function playPaste(plain){
      if(plain){ opacity($('.clip-rich'),1); opacity($('.clip-rich-line'),1); }
      else opacity($('.clip-text'),1);
      later(300,function(){opacity($('.caret'),1);});
      later(780,pressKeys);
      later(1300,function(){
        if(plain){
          trans($('.pasted-plain'),'opacity 300ms ease'); opacity($('.pasted-plain'),1);
          toast('Formatierung entfernt');
        } else {
          trans($('.pasted-rich'),'opacity 300ms ease'); opacity($('.pasted-rich'),1); opacity($('.rich-underline'),1);
          toast('Inhalt eingefügt');
        }
      });
    }

    function playUndo(){
      opacity($('.history-chip'),1); opacity($('.history-text'),1);
      $('.history-text').textContent='Vorher: Text gelöscht';
      opacity($('.source-text'),0);
      later(720,pressKeys);
      later(1210,function(){ opacity($('.history-arrow'),1); });
      later(1580,function(){
        trans($('.source-text'),'opacity 300ms ease'); opacity($('.source-text'),1);
        $('.history-text').textContent='Nachher: Text wieder da';
        toast('Letzte Änderung rückgängig');
      });
    }

    function playRedo(){
      opacity($('.history-chip'),1); opacity($('.history-text'),1);
      $('.history-text').textContent='Vorher: rückgängig';
      opacity($('.source-text'),1);
      $('.history-arrow').setAttribute('transform','translate(527 205) scale(-1 1)');
      later(720,pressKeys);
      later(1210,function(){ opacity($('.history-arrow'),1); });
      later(1580,function(){
        trans($('.source-text'),'opacity 300ms ease'); opacity($('.source-text'),0);
        $('.history-text').textContent='Nachher: Löschen erneut';
        toast('Änderung wiederholt');
      });
    }

    function playSave(){
      later(560,pressKeys);
      later(1160,function(){ opacity($('.unsaved-dot'),0); opacity($('.saved-badge'),1); toast('Änderungen gespeichert'); });
    }

    function playSelectAll(){
      later(560,pressKeys);
      later(1160,function(){ trans($('.all-selection'),'opacity 300ms ease'); opacity($('.all-selection'),1); toast('Gesamter Inhalt markiert'); });
    }

    function applyEndState(){
      reset();
      if(mode==='copy'){
        $('.single-selection').setAttribute('width','152'); opacity($('.clip-text'),1); toast('Kopie in Zwischenablage');
      } else if(mode==='cut'){
        $('.single-selection').setAttribute('width','152'); opacity($('.clip-text'),1); opacity($('.source-text'),0); toast('Original entfernt · Kopie bleibt');
      } else if(mode==='paste'){
        opacity($('.clip-text'),1); opacity($('.caret'),1); opacity($('.pasted-rich'),1); opacity($('.rich-underline'),1); toast('Inhalt eingefügt');
      } else if(mode==='pastePlain'){
        opacity($('.clip-rich'),1); opacity($('.clip-rich-line'),1); opacity($('.caret'),1); opacity($('.pasted-plain'),1); toast('Formatierung entfernt');
      } else if(mode==='undo'){
        opacity($('.history-chip'),1); opacity($('.history-text'),1); $('.history-text').textContent='Nachher: Text wieder da'; opacity($('.source-text'),1); toast('Letzte Änderung rückgängig');
      } else if(mode==='redo'){
        opacity($('.history-chip'),1); opacity($('.history-text'),1); $('.history-text').textContent='Nachher: Löschen erneut'; opacity($('.source-text'),0); toast('Änderung wiederholt');
      } else if(mode==='save'){
        opacity($('.unsaved-dot'),0); opacity($('.saved-badge'),1); toast('Änderungen gespeichert');
      } else if(mode==='selectAll'){
        opacity($('.all-selection'),1); toast('Gesamter Inhalt markiert');
      }
    }

    function run(){
      if(reduceMotion){ applyEndState(); running=false; return; }
      reset(); running=true;
      later(120,function(){
        if(mode==='copy') playCopy(false);
        else if(mode==='cut') playCopy(true);
        else if(mode==='paste') playPaste(false);
        else if(mode==='pastePlain') playPaste(true);
        else if(mode==='undo') playUndo();
        else if(mode==='redo') playRedo();
        else if(mode==='save') playSave();
        else if(mode==='selectAll') playSelectAll();
      });
      later(LOOP_MS,function(){ running=false; if(active && autoLoop) run(); });
    }

    function play(){ active=true; run(); }
    function setActive(value){
      active=Boolean(value);
      if(!active){ clearTimers(); running=false; }
      else if(!running) run();
    }
    function setMode(next){ mode=next; cfg=MODES[mode]||MODES.copy; run(); }

    reset();
    if(active) run();
    return {play:play,reset:reset,setActive:setActive,setMode:setMode};
  }

  window.createDocTextScene = createDocTextScene;
})();
