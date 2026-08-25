(function(){
  'use strict';

  var counter = 0;
  var LOOP_MS = 4200;
  var CONFIG = {
    find:{keys:['Ctrl','F'],label:'Suchen im Text'},
    replace:{keys:['Ctrl','H'],label:'Suchen und Ersetzen'},
    print:{keys:['Ctrl','P'],label:'Drucken'},
    open:{keys:['Ctrl','O'],label:'Datei öffnen'},
    home:{keys:['Ctrl','Home'],label:'Zum Anfang springen'},
    end:{keys:['Ctrl','End'],label:'Zum Ende springen'}
  };

  function keyMarkup(keys){
    var x=0;
    return keys.map(function(key,index){
      var w=key==='Ctrl'?68:(key.length>2?70:48);
      var base='translate('+x+' 0)';
      var out='<g class="tk2-u-key" data-base="'+base+'" transform="'+base+'"><rect width="'+w+'" height="42" rx="10" fill="#172033" stroke="#475569" stroke-width="1.5"/><text x="'+(w/2)+'" y="27" text-anchor="middle" font-family="Arial,sans-serif" font-size="'+(key.length>4?11:14)+'" font-weight="800" fill="#dbeafe">'+key+'</text></g>';
      x+=w;
      if(index<keys.length-1){out+='<text x="'+(x+9)+'" y="27" font-family="Arial,sans-serif" font-size="16" font-weight="800" fill="#64748b">+</text>';x+=26;}
      return out;
    }).join('');
  }

  function createUtilityScene(container, options){
    options=options||{};
    var mode=options.mode||'find';
    var cfg=CONFIG[mode]||CONFIG.find;
    var active=options.autoplay!==false;
    var autoLoop=options.loop!==false;
    var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var uid='tk2util'+(++counter);
    var timers=[];
    var running=false;

    function commonDefs(){
      return '<defs><filter id="'+uid+'Shadow" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="0" dy="9" stdDeviation="10" flood-color="#020617" flood-opacity=".38"/></filter><linearGradient id="'+uid+'Paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#f8fafc"/></linearGradient></defs>';
    }

    function searchScene(){
      var replacement = mode==='replace';
      return '<svg class="tk2-utility-scene" viewBox="0 0 560 320" role="img" aria-label="Animation: '+cfg.label+'">'+commonDefs()+
      '<rect width="560" height="320" rx="24" fill="#07101f"/><circle cx="500" cy="45" r="95" fill="#8b5cf6" opacity=".055"/>'+
      '<g filter="url(#'+uid+'Shadow)"><rect x="30" y="25" width="365" height="268" rx="16" fill="url(#'+uid+'Paper)"/><rect x="30" y="25" width="365" height="36" rx="16" fill="#e2e8f0"/><rect x="30" y="45" width="365" height="16" fill="#e2e8f0"/><circle cx="50" cy="43" r="4" fill="#fb7185"/><circle cx="66" cy="43" r="4" fill="#fbbf24"/><circle cx="82" cy="43" r="4" fill="#34d399"/><text x="108" y="47" font-family="Arial" font-size="10" font-weight="700" fill="#475569">Geschichte.docx</text>'+
      '<text x="58" y="92" font-family="Arial" font-size="15" fill="#334155">Der <tspan class="word1">Hund</tspan> läuft durch den Garten.</text><text x="58" y="126" font-family="Arial" font-size="15" fill="#334155">Später schläft der <tspan class="word2">Hund</tspan> auf dem Sofa.</text><text x="58" y="160" font-family="Arial" font-size="15" fill="#334155">Der Garten ist ruhig und hell.</text>'+
      '<rect class="hl1" x="84" y="77" width="42" height="20" rx="5" fill="#fde047" opacity="0"/><rect class="hl2" x="174" y="111" width="42" height="20" rx="5" fill="#fde047" opacity="0"/>'+
      '<text class="word1top" x="87" y="92" font-family="Arial" font-size="15" font-weight="700" fill="#713f12" opacity="0">Hund</text><text class="word2top" x="177" y="126" font-family="Arial" font-size="15" font-weight="700" fill="#713f12" opacity="0">Hund</text>'+
      '</g>'+
      '<g class="search-panel" transform="translate(414 64)" filter="url(#'+uid+'Shadow)" opacity="0"><rect width="126" height="'+(replacement?160:110)+'" rx="17" fill="#111c30" stroke="#334155"/><text x="15" y="24" font-family="Arial" font-size="10" font-weight="800" fill="#cbd5e1">'+(replacement?'Suchen & Ersetzen':'Suchen')+'</text><rect class="search-box" x="13" y="36" width="100" height="29" rx="8" fill="#08111f" stroke="#475569" stroke-width="1.5"/><text class="search-text" x="22" y="55" font-family="Arial" font-size="12" font-weight="700" fill="#7dd3fc"></text>'+
      (replacement?'<rect class="replace-box" x="13" y="76" width="100" height="29" rx="8" fill="#08111f" stroke="#475569" stroke-width="1.5"/><text class="replace-text" x="22" y="95" font-family="Arial" font-size="12" font-weight="700" fill="#a7f3d0"></text><rect class="replace-btn" x="13" y="116" width="100" height="28" rx="8" fill="#2563eb" opacity=".65"/><text x="63" y="134" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#fff">Alle ersetzen</text>':'<text class="matches" x="17" y="90" font-family="Arial" font-size="9" fill="#94a3b8" opacity="0">2 Treffer</text>')+
      '</g><g class="keys" transform="translate(414 244)">'+keyMarkup(cfg.keys)+'</g><g class="toast" transform="translate(392 20)" opacity="0"><rect width="150" height="30" rx="15" fill="#052e2b" stroke="#10b981"/><text class="toast-text" x="75" y="19" text-anchor="middle" font-family="Arial" font-size="11" font-weight="700" fill="#a7f3d0">Gefunden</text></g></svg>';
    }

    function printOpenScene(){
      var printing=mode==='print';
      return '<svg class="tk2-utility-scene" viewBox="0 0 560 320" role="img" aria-label="Animation: '+cfg.label+'">'+commonDefs()+
      '<rect width="560" height="320" rx="24" fill="#07101f"/><circle cx="500" cy="52" r="98" fill="#06b6d4" opacity=".055"/>'+
      '<g class="main-window" filter="url(#'+uid+'Shadow)"><rect x="34" y="28" width="345" height="262" rx="16" fill="url(#'+uid+'Paper)"/><rect x="34" y="28" width="345" height="36" rx="16" fill="#e2e8f0"/><rect x="34" y="48" width="345" height="16" fill="#e2e8f0"/><circle cx="54" cy="46" r="4" fill="#fb7185"/><circle cx="70" cy="46" r="4" fill="#fbbf24"/><circle cx="86" cy="46" r="4" fill="#34d399"/><text class="window-title" x="112" y="50" font-family="Arial" font-size="10" font-weight="700" fill="#475569">'+(printing?'Projektbericht.docx':'Leeres Dokument')+'</text><rect x="64" y="89" width="142" height="12" rx="6" fill="#0f172a" opacity=".88"/><rect x="64" y="124" width="252" height="8" rx="4" fill="#94a3b8"/><rect x="64" y="144" width="226" height="8" rx="4" fill="#94a3b8"/><rect x="64" y="164" width="246" height="8" rx="4" fill="#94a3b8"/><g class="opened-content" opacity="0"><rect x="64" y="202" width="170" height="10" rx="5" fill="#60a5fa"/><rect x="64" y="222" width="214" height="8" rx="4" fill="#94a3b8"/><rect x="64" y="242" width="188" height="8" rx="4" fill="#94a3b8"/></g></g>'+
      (printing?'<g class="dialog" transform="translate(404 48)" filter="url(#'+uid+'Shadow)" opacity="0"><rect width="136" height="174" rx="17" fill="#111c30" stroke="#334155"/><rect width="136" height="31" rx="17" fill="#172033"/><rect y="17" width="136" height="14" fill="#172033"/><text x="16" y="20" font-family="Arial" font-size="11" font-weight="800" fill="#e2e8f0">Drucken</text><text x="15" y="50" font-family="Arial" font-size="8" fill="#94a3b8">Drucker</text><rect x="15" y="57" width="106" height="27" rx="8" fill="#08111f" stroke="#475569"/><text x="25" y="74" font-family="Arial" font-size="10" fill="#cbd5e1">Schuldrucker</text><text x="15" y="102" font-family="Arial" font-size="8" fill="#94a3b8">Seiten</text><rect x="15" y="108" width="46" height="24" rx="7" fill="#08111f" stroke="#475569"/><text x="38" y="124" text-anchor="middle" font-family="Arial" font-size="9" fill="#cbd5e1">Alle</text><rect class="print-btn" x="70" y="108" width="51" height="24" rx="7" fill="#2563eb"/><text x="95" y="124" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#fff">Drucken</text><g class="paper-out" opacity="0"><rect x="39" y="140" width="58" height="48" rx="4" fill="#fff"/><rect x="48" y="151" width="39" height="4" rx="2" fill="#94a3b8"/><rect x="48" y="162" width="31" height="4" rx="2" fill="#94a3b8"/></g></g>':'<g class="dialog" transform="translate(400 44)" filter="url(#'+uid+'Shadow)" opacity="0"><rect width="140" height="183" rx="17" fill="#111c30" stroke="#334155"/><rect width="140" height="31" rx="17" fill="#172033"/><rect y="17" width="140" height="14" fill="#172033"/><text x="15" y="20" font-family="Arial" font-size="11" font-weight="800" fill="#e2e8f0">Datei öffnen</text><text x="15" y="48" font-family="Arial" font-size="8" fill="#94a3b8">Dokumente</text><g class="file-row"><rect x="13" y="56" width="114" height="45" rx="9" fill="#172554" stroke="#3b82f6"/><rect x="24" y="67" width="22" height="20" rx="4" fill="#60a5fa"/><path d="M37 67v6h7" fill="none" stroke="#dbeafe" stroke-width="1.5"/><text x="53" y="73" font-family="Arial" font-size="9" font-weight="700" fill="#dbeafe">Referat.docx</text><text x="53" y="87" font-family="Arial" font-size="8" fill="#94a3b8">Word-Dokument</text></g><rect class="open-btn" x="69" y="116" width="58" height="29" rx="8" fill="#2563eb"/><text x="98" y="135" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#fff">Öffnen</text><text x="15" y="165" font-family="Arial" font-size="8" fill="#64748b">Dateiname: Referat.docx</text></g>')+
      '<g class="keys" transform="translate(404 248)">'+keyMarkup(cfg.keys)+'</g><g class="toast" transform="translate(392 18)" opacity="0"><rect width="150" height="30" rx="15" fill="#052e2b" stroke="#10b981"/><text class="toast-text" x="75" y="19" text-anchor="middle" font-family="Arial" font-size="11" font-weight="700" fill="#a7f3d0">Fertig</text></g></svg>';
    }

    function scrollScene(){
      var toTop=mode==='home';
      return '<svg class="tk2-utility-scene" viewBox="0 0 560 320" role="img" aria-label="Animation: '+cfg.label+'">'+commonDefs()+
      '<rect width="560" height="320" rx="24" fill="#07101f"/><circle cx="500" cy="45" r="95" fill="#10b981" opacity=".05"/>'+
      '<g filter="url(#'+uid+'Shadow)"><rect x="38" y="26" width="355" height="266" rx="16" fill="url(#'+uid+'Paper)"/><rect x="38" y="26" width="355" height="36" rx="16" fill="#e2e8f0"/><rect x="38" y="46" width="355" height="16" fill="#e2e8f0"/><text x="70" y="50" font-family="Arial" font-size="10" font-weight="700" fill="#475569">Langes_Dokument.docx</text><clipPath id="'+uid+'Clip"><rect x="60" y="77" width="290" height="185" rx="7"/></clipPath><g class="scroll-content" clip-path="url(#'+uid+'Clip)"><g class="doc-lines">'+Array.from({length:18},function(_,i){return '<rect x="68" y="'+(86+i*20)+'" width="'+(210+(i%3)*22)+'" height="8" rx="4" fill="'+(i===0||i===17?'#3b82f6':'#94a3b8')+'" opacity="'+(i===0||i===17?'.95':'.72')+'"/>';}).join('')+'</g></g><rect x="362" y="78" width="8" height="181" rx="4" fill="#e2e8f0"/><rect class="scroll-thumb" x="362" y="'+(toTop?220:84)+'" width="8" height="38" rx="4" fill="#64748b"/></g><g class="position-badge" transform="translate(416 72)"><rect width="120" height="72" rx="14" fill="#111c30" stroke="#334155"/><text x="60" y="22" text-anchor="middle" font-family="Arial" font-size="9" fill="#94a3b8">Dokumentposition</text><text class="pos-text" x="60" y="44" text-anchor="middle" font-family="Arial" font-size="14" font-weight="800" fill="#7dd3fc">'+(toTop?'unten':'oben')+'</text><text class="page-text" x="60" y="61" text-anchor="middle" font-family="Arial" font-size="9" fill="#94a3b8">'+(toTop?'Seite 6 von 6':'Seite 1 von 6')+'</text></g><g class="keys" transform="translate(406 230)">'+keyMarkup(cfg.keys)+'</g><g class="toast" transform="translate(392 20)" opacity="0"><rect width="150" height="30" rx="15" fill="#052e2b" stroke="#10b981"/><text class="toast-text" x="75" y="19" text-anchor="middle" font-family="Arial" font-size="11" font-weight="700" fill="#a7f3d0">'+(toTop?'Am Anfang':'Am Ende')+'</text></g></svg>';
    }

    container.innerHTML=(mode==='find'||mode==='replace')?searchScene():((mode==='print'||mode==='open')?printOpenScene():scrollScene());
    var svg=container.querySelector('svg');
    var $=function(sel){return svg.querySelector(sel);};
    var $$=function(sel){return Array.from(svg.querySelectorAll(sel));};
    function later(ms,fn){timers.push(window.setTimeout(fn,ms));}
    function clearTimers(){timers.forEach(window.clearTimeout);timers=[];}
    function trans(el,val){if(el)el.style.transition=reduceMotion?'none':val;}
    function opacity(el,val){if(el)el.setAttribute('opacity',String(val));}

    function pressKeys(){
      $$('.tk2-u-key').forEach(function(k,i){
        later(i*115,function(){
          var base=k.getAttribute('data-base');
          trans(k,'transform 100ms ease, filter 100ms ease');
          k.setAttribute('transform',base+' translate(0 4)');
          k.style.filter='drop-shadow(0 0 8px rgba(56,189,248,.75))';
          later(170,function(){k.setAttribute('transform',base);k.style.filter='';});
        });
      });
    }

    function reset(){
      clearTimers();running=false;
      $$('.tk2-u-key').forEach(function(k){k.style.transition='none';k.style.filter='';k.setAttribute('transform',k.getAttribute('data-base'));});
      opacity($('.toast'),0);opacity($('.search-panel'),0);opacity($('.matches'),0);opacity($('.hl1'),0);opacity($('.hl2'),0);opacity($('.word1top'),0);opacity($('.word2top'),0);opacity($('.dialog'),0);opacity($('.paper-out'),0);opacity($('.opened-content'),0);
      if($('.search-text'))$('.search-text').textContent='';if($('.replace-text'))$('.replace-text').textContent='';
      if($('.word1'))$('.word1').textContent='Hund';if($('.word2'))$('.word2').textContent='Hund';if($('.word1top')){$('.word1top').textContent='Hund';$('.word1top').setAttribute('fill','#713f12');}if($('.word2top')){$('.word2top').textContent='Hund';$('.word2top').setAttribute('fill','#713f12');}
      if($('.hl1')){$('.hl1').setAttribute('fill','#fde047');$('.hl1').setAttribute('width','42');}if($('.hl2')){$('.hl2').setAttribute('fill','#fde047');$('.hl2').setAttribute('width','42');}
      if($('.search-box'))$('.search-box').setAttribute('stroke','#475569');if($('.replace-box'))$('.replace-box').setAttribute('stroke','#475569');
      if($('.paper-out'))$('.paper-out').setAttribute('transform','translate(0 0)');
      if($('.window-title'))$('.window-title').textContent=mode==='print'?'Projektbericht.docx':'Leeres Dokument';
      if($('.scroll-thumb'))$('.scroll-thumb').setAttribute('y',mode==='home'?'220':'84');
      if($('.scroll-content'))$('.scroll-content').setAttribute('transform',mode==='home'?'translate(0 -170)':'translate(0 0)');
      if($('.pos-text'))$('.pos-text').textContent=mode==='home'?'unten':'oben';
      if($('.page-text'))$('.page-text').textContent=mode==='home'?'Seite 6 von 6':'Seite 1 von 6';
    }

    function typeInto(el,text,start){text.split('').forEach(function(ch,i){later(start+i*115,function(){el.textContent+=ch;});});}

    function playSearch(){
      later(420,pressKeys);
      later(900,function(){opacity($('.search-panel'),1);if($('.search-box'))$('.search-box').setAttribute('stroke','#3b82f6');});
      typeInto($('.search-text'),'Hund',1160);
      later(1760,function(){opacity($('.hl1'),1);opacity($('.hl2'),1);opacity($('.word1top'),1);opacity($('.word2top'),1);if($('.matches'))opacity($('.matches'),1);});
      if(mode==='replace'){
        later(1940,function(){if($('.replace-box'))$('.replace-box').setAttribute('stroke','#10b981');});
        typeInto($('.replace-text'),'Katze',2040);
        later(2820,function(){
          $('.word1').textContent='Katze';$('.word2').textContent='Katze';$('.word1top').textContent='Katze';$('.word2top').textContent='Katze';
          $('.word1top').setAttribute('fill','#065f46');$('.word2top').setAttribute('fill','#065f46');$('.hl1').setAttribute('fill','#bbf7d0');$('.hl2').setAttribute('fill','#bbf7d0');$('.hl1').setAttribute('width','47');$('.hl2').setAttribute('width','47');
          $('.toast-text').textContent='Hund → Katze · 2×';opacity($('.toast'),1);
        });
      } else later(2360,function(){$('.toast-text').textContent='2 Treffer gefunden';opacity($('.toast'),1);});
    }

    function playSystem(){
      later(430,pressKeys);
      later(980,function(){opacity($('.dialog'),1);});
      if(mode==='print'){
        later(1800,function(){trans($('.paper-out'),'opacity 250ms ease, transform 450ms ease');opacity($('.paper-out'),1);$('.paper-out').setAttribute('transform','translate(0 14)');$('.toast-text').textContent='Druckauftrag gesendet';opacity($('.toast'),1);});
      } else {
        later(1840,function(){opacity($('.dialog'),0);opacity($('.opened-content'),1);$('.window-title').textContent='Referat.docx';$('.toast-text').textContent='Referat.docx geöffnet';opacity($('.toast'),1);});
      }
    }

    function playScroll(){
      later(430,pressKeys);
      later(1000,function(){
        trans($('.scroll-thumb'),'y 700ms cubic-bezier(.2,.8,.25,1)');trans($('.scroll-content'),'transform 700ms cubic-bezier(.2,.8,.25,1)');
        $('.scroll-thumb').setAttribute('y',mode==='home'?'84':'220');$('.scroll-content').setAttribute('transform',mode==='home'?'translate(0 0)':'translate(0 -170)');
      });
      later(1780,function(){
        $('.pos-text').textContent=mode==='home'?'Anfang':'Ende';$('.page-text').textContent=mode==='home'?'Seite 1 von 6':'Seite 6 von 6';opacity($('.toast'),1);
      });
    }

    function applyEndState(){
      reset();
      if(mode==='find'){
        opacity($('.search-panel'),1);$('.search-text').textContent='Hund';opacity($('.hl1'),1);opacity($('.hl2'),1);opacity($('.word1top'),1);opacity($('.word2top'),1);opacity($('.matches'),1);$('.toast-text').textContent='2 Treffer gefunden';opacity($('.toast'),1);
      } else if(mode==='replace'){
        opacity($('.search-panel'),1);$('.search-text').textContent='Hund';$('.replace-text').textContent='Katze';opacity($('.hl1'),1);opacity($('.hl2'),1);opacity($('.word1top'),1);opacity($('.word2top'),1);$('.word1top').textContent='Katze';$('.word2top').textContent='Katze';$('.hl1').setAttribute('fill','#bbf7d0');$('.hl2').setAttribute('fill','#bbf7d0');$('.toast-text').textContent='Hund → Katze · 2×';opacity($('.toast'),1);
      } else if(mode==='print'){
        opacity($('.dialog'),1);opacity($('.paper-out'),1);$('.paper-out').setAttribute('transform','translate(0 14)');$('.toast-text').textContent='Druckauftrag gesendet';opacity($('.toast'),1);
      } else if(mode==='open'){
        opacity($('.opened-content'),1);$('.window-title').textContent='Referat.docx';$('.toast-text').textContent='Referat.docx geöffnet';opacity($('.toast'),1);
      } else if(mode==='home'){
        $('.scroll-thumb').setAttribute('y','84');$('.scroll-content').setAttribute('transform','translate(0 0)');$('.pos-text').textContent='Anfang';$('.page-text').textContent='Seite 1 von 6';opacity($('.toast'),1);
      } else if(mode==='end'){
        $('.scroll-thumb').setAttribute('y','220');$('.scroll-content').setAttribute('transform','translate(0 -170)');$('.pos-text').textContent='Ende';$('.page-text').textContent='Seite 6 von 6';opacity($('.toast'),1);
      }
    }

    function run(){
      if(reduceMotion){applyEndState();running=false;return;}
      reset();running=true;
      later(120,function(){if(mode==='find'||mode==='replace')playSearch();else if(mode==='print'||mode==='open')playSystem();else playScroll();});
      later(LOOP_MS,function(){running=false;if(active&&autoLoop)run();});
    }

    function play(){active=true;run();}
    function setActive(v){active=Boolean(v);if(!active){clearTimers();running=false;}else if(!running)run();}
    reset();if(active)run();
    return {play:play,reset:reset,setActive:setActive};
  }

  window.createUtilityScene=createUtilityScene;
})();
