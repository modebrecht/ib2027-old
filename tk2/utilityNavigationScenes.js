(function(){
  'use strict';

  var baseUtility=window.createUtilityScene;
  var baseDoc=window.createDocTextScene;
  if(typeof baseUtility!=='function')return;

  var counter=0;
  var LOOP_MS=4400;

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

  function polishCard(container,mode){
    var card=container.closest&&container.closest('.anim-card');
    if(!card)return;
    var flow=card.querySelector('.anim-flow');
    var desc=card.querySelector('.anim-desc');
    var remember=card.querySelector('.anim-remember');
    var home=mode==='home';
    if(flow)flow.innerHTML=home
      ?'<span>Cursor auf Seite 6</span><b>→</b><span>Ctrl + Home</span><b>→</b><span>Cursor auf Seite 1</span>'
      :'<span>Cursor auf Seite 1</span><b>→</b><span>Ctrl + End</span><b>→</b><span>Cursor auf Seite 6</span>';
    if(desc)desc.textContent=home
      ?'Die Einfügemarke springt an den Anfang des Dokuments. Die Ansicht scrollt automatisch mit, damit die neue Cursorposition sichtbar ist.'
      :'Die Einfügemarke springt an das Ende des Dokuments. Die Ansicht scrollt automatisch mit, damit die neue Cursorposition sichtbar ist.';
    if(remember)remember.innerHTML=home
      ?'<strong>Merke:</strong> Ctrl + Home bewegt den Cursor zum Dokumentanfang – nicht nur den Scrollbalken.'
      :'<strong>Merke:</strong> Ctrl + End bewegt den Cursor zum Dokumentende – nicht nur den Scrollbalken.';
  }

  function createNavigationScene(container,options){
    options=options||{};
    var mode=options.mode==='home'?'home':'end';
    var toTop=mode==='home';
    var active=options.autoplay!==false;
    var autoLoop=options.loop!==false;
    var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var uid='tk2nav'+(++counter);
    var timers=[];
    var running=false;
    var startTransform=toTop?'translate(0 -198)':'translate(0 0)';
    var endTransform=toTop?'translate(0 0)':'translate(0 -198)';
    var startThumb=toTop?'220':'84';
    var endThumb=toTop?'84':'220';

    container.innerHTML=''
      +'<svg class="tk2-utility-scene" viewBox="0 0 560 320" role="img" aria-label="Animation: '+(toTop?'Zum Anfang springen':'Zum Ende springen')+'">'
      +'<defs><filter id="'+uid+'Shadow" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="0" dy="9" stdDeviation="10" flood-color="#020617" flood-opacity=".38"/></filter><linearGradient id="'+uid+'Paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#f8fafc"/></linearGradient><clipPath id="'+uid+'Clip"><rect x="60" y="77" width="290" height="185" rx="7"/></clipPath></defs>'
      +'<rect width="560" height="320" rx="24" fill="#07101f"/><circle cx="500" cy="45" r="95" fill="#10b981" opacity=".05"/>'
      +'<g filter="url(#'+uid+'Shadow)"><rect x="38" y="26" width="355" height="266" rx="16" fill="url(#'+uid+'Paper)"/><rect x="38" y="26" width="355" height="36" rx="16" fill="#e2e8f0"/><rect x="38" y="46" width="355" height="16" fill="#e2e8f0"/><circle cx="56" cy="44" r="4" fill="#fb7185"/><circle cx="72" cy="44" r="4" fill="#fbbf24"/><circle cx="88" cy="44" r="4" fill="#34d399"/><text x="108" y="49" font-family="Arial" font-size="10" font-weight="700" fill="#475569">Langes_Dokument.docx</text>'
      +'<rect x="60" y="77" width="290" height="185" rx="7" fill="#dfe5ec"/>'
      +'<g clip-path="url(#'+uid+'Clip)"><g class="doc-strip" transform="'+startTransform+'">'
      +'<g class="page-first"><rect x="66" y="82" width="278" height="166" rx="4" fill="#fff" stroke="#cbd5e1"/><text x="82" y="101" font-family="Arial" font-size="8" font-weight="700" fill="#94a3b8">Seite 1</text><line class="caret-start" x1="80" y1="112" x2="80" y2="136" stroke="#2563eb" stroke-width="2.5" opacity="0"/><rect x="88" y="113" width="154" height="10" rx="4" fill="#0f172a" opacity=".88"/><rect x="82" y="145" width="232" height="7" rx="3.5" fill="#94a3b8"/><rect x="82" y="164" width="214" height="7" rx="3.5" fill="#94a3b8"/><rect x="82" y="183" width="244" height="7" rx="3.5" fill="#94a3b8"/><rect x="82" y="202" width="198" height="7" rx="3.5" fill="#94a3b8"/><rect x="82" y="221" width="226" height="7" rx="3.5" fill="#94a3b8"/></g>'
      +'<g class="page-gap"><text x="205" y="270" text-anchor="middle" font-family="Arial" font-size="9" font-weight="700" fill="#64748b">⋮ Seiten 2–5 ⋮</text></g>'
      +'<g class="page-last"><rect x="66" y="280" width="278" height="166" rx="4" fill="#fff" stroke="#cbd5e1"/><text x="82" y="299" font-family="Arial" font-size="8" font-weight="700" fill="#94a3b8">Seite 6</text><rect x="82" y="315" width="226" height="7" rx="3.5" fill="#94a3b8"/><rect x="82" y="334" width="244" height="7" rx="3.5" fill="#94a3b8"/><rect x="82" y="353" width="202" height="7" rx="3.5" fill="#94a3b8"/><rect x="82" y="372" width="236" height="7" rx="3.5" fill="#94a3b8"/><rect x="82" y="391" width="190" height="7" rx="3.5" fill="#94a3b8"/><rect x="82" y="410" width="126" height="7" rx="3.5" fill="#0f172a" opacity=".82"/><line class="caret-end" x1="214" y1="403" x2="214" y2="427" stroke="#2563eb" stroke-width="2.5" opacity="0"/></g>'
      +'</g></g>'
      +'<rect x="362" y="78" width="8" height="181" rx="4" fill="#e2e8f0"/><rect class="scroll-thumb" x="362" y="'+startThumb+'" width="8" height="38" rx="4" fill="#64748b"/></g>'
      +'<g class="position-badge" transform="translate(416 72)"><rect width="120" height="78" rx="14" fill="#111c30" stroke="#334155"/><text x="60" y="21" text-anchor="middle" font-family="Arial" font-size="9" fill="#94a3b8">Cursor + Ansicht</text><text class="pos-text" x="60" y="45" text-anchor="middle" font-family="Arial" font-size="14" font-weight="800" fill="#7dd3fc">'+(toTop?'Ende':'Anfang')+'</text><text class="page-text" x="60" y="63" text-anchor="middle" font-family="Arial" font-size="9" fill="#94a3b8">'+(toTop?'Seite 6 von 6':'Seite 1 von 6')+'</text></g>'
      +'<g class="keys" transform="translate(406 230)">'+keyMarkup(['Ctrl',toTop?'Home':'End'])+'</g>'
      +'<g class="toast" transform="translate(388 20)" opacity="0"><rect width="158" height="30" rx="15" fill="#052e2b" stroke="#10b981"/><text class="toast-text" x="79" y="19" text-anchor="middle" font-family="Arial" font-size="11" font-weight="700" fill="#a7f3d0">'+(toTop?'Cursor am Anfang':'Cursor am Ende')+'</text></g>'
      +'</svg>';

    polishCard(container,mode);

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
      trans($('.doc-strip'),'none');trans($('.scroll-thumb'),'none');trans($('.caret-start'),'none');trans($('.caret-end'),'none');
      $('.doc-strip').setAttribute('transform',startTransform);$('.scroll-thumb').setAttribute('y',startThumb);
      opacity($('.caret-start'),toTop?0:1);opacity($('.caret-end'),toTop?1:0);opacity($('.toast'),0);
      $('.pos-text').textContent=toTop?'Ende':'Anfang';$('.page-text').textContent=toTop?'Seite 6 von 6':'Seite 1 von 6';
    }

    function playScroll(){
      later(430,pressKeys);
      later(900,function(){
        var oldCaret=toTop?$('.caret-end'):$('.caret-start');
        trans(oldCaret,'opacity 180ms ease');opacity(oldCaret,0);
        $('.pos-text').textContent='springt …';$('.page-text').textContent='Ansicht folgt';
      });
      later(1000,function(){
        trans($('.doc-strip'),'transform 850ms cubic-bezier(.2,.8,.25,1)');trans($('.scroll-thumb'),'y 850ms cubic-bezier(.2,.8,.25,1)');
        $('.doc-strip').setAttribute('transform',endTransform);$('.scroll-thumb').setAttribute('y',endThumb);
      });
      later(1880,function(){
        var newCaret=toTop?$('.caret-start'):$('.caret-end');
        trans(newCaret,'opacity 160ms ease');opacity(newCaret,1);
        $('.pos-text').textContent=toTop?'Anfang':'Ende';$('.page-text').textContent=toTop?'Seite 1 von 6':'Seite 6 von 6';opacity($('.toast'),1);
      });
    }

    function applyEndState(){
      reset();
      $('.doc-strip').setAttribute('transform',endTransform);$('.scroll-thumb').setAttribute('y',endThumb);
      opacity($('.caret-start'),toTop?1:0);opacity($('.caret-end'),toTop?0:1);
      $('.pos-text').textContent=toTop?'Anfang':'Ende';$('.page-text').textContent=toTop?'Seite 1 von 6':'Seite 6 von 6';opacity($('.toast'),1);
    }

    function run(){
      if(reduceMotion){applyEndState();running=false;return;}
      reset();running=true;later(120,playScroll);later(LOOP_MS,function(){running=false;if(active&&autoLoop)run();});
    }
    function play(){active=true;run();}
    function setActive(v){active=Boolean(v);if(!active){clearTimers();running=false;}else if(!running)run();}
    reset();if(active)run();
    return{play:play,reset:reset,setActive:setActive};
  }

  function polishDocScene(container,mode){
    var svg=container.querySelector('svg');
    if(!svg)return;

    if(mode==='cut'){
      var source=svg.querySelector('.source-text');
      var selection=svg.querySelector('.single-selection');
      if(source&&selection){
        var syncCut=function(){selection.setAttribute('opacity',source.getAttribute('opacity')==='0'?'0':'1');};
        new MutationObserver(syncCut).observe(source,{attributes:true,attributeFilter:['opacity']});
        syncCut();
      }
    }

    if(mode==='paste'){
      var clipText=svg.querySelector('.clip-text');
      var clipRich=svg.querySelector('.clip-rich');
      var clipLine=svg.querySelector('.clip-rich-line');
      if(clipText&&clipRich&&clipLine){
        clipText.style.opacity='0';
        var syncPaste=function(){
          var visible=clipText.getAttribute('opacity')!=='0';
          clipRich.setAttribute('opacity',visible?'1':'0');
          clipLine.setAttribute('opacity',visible?'1':'0');
        };
        new MutationObserver(syncPaste).observe(clipText,{attributes:true,attributeFilter:['opacity']});
        syncPaste();
      }
    }

    if(mode==='selectAll'){
      var all=svg.querySelector('.all-selection rect');
      if(all){
        all.setAttribute('x','54');
        all.setAttribute('y','74');
        all.setAttribute('width','292');
        all.setAttribute('height','180');
      }
    }
  }

  function polishUtilityScene(container,mode){
    var svg=container.querySelector('svg');
    if(!svg)return;

    if(mode==='replace'){
      var replacement=svg.querySelector('.replace-text');
      var button=svg.querySelector('.replace-btn');
      if(replacement&&button){
        var pressed=false;
        new MutationObserver(function(){
          if(replacement.textContent==='Katze'&&!pressed){
            pressed=true;
            button.style.transition='transform 120ms ease, fill 120ms ease';
            button.setAttribute('transform','translate(0 2)');
            button.setAttribute('fill','#1d4ed8');
            window.setTimeout(function(){
              button.setAttribute('transform','translate(0 0)');
              button.setAttribute('fill','#2563eb');
            },220);
          }else if(replacement.textContent!=='Katze'){
            pressed=false;
            button.setAttribute('transform','translate(0 0)');
            button.setAttribute('fill','#2563eb');
          }
        }).observe(replacement,{subtree:true,childList:true,characterData:true});
      }
    }

    if(mode==='print'){
      var paper=svg.querySelector('.paper-out');
      var printToast=svg.querySelector('.toast-text');
      if(paper)paper.style.display='none';
      if(printToast){
        new MutationObserver(function(){
          if(printToast.textContent==='Druckauftrag gesendet')printToast.textContent='Druckdialog geöffnet';
        }).observe(printToast,{subtree:true,childList:true,characterData:true});
      }
    }

    if(mode==='open'){
      var opened=svg.querySelector('.opened-content');
      var dialog=svg.querySelector('.dialog');
      var title=svg.querySelector('.window-title');
      var toast=svg.querySelector('.toast');
      var toastText=svg.querySelector('.toast-text');
      if(opened)opened.style.display='none';
      if(title&&dialog&&toast&&toastText){
        new MutationObserver(function(){
          if(title.textContent==='Referat.docx'){
            title.textContent='Leeres Dokument';
            dialog.setAttribute('opacity','1');
            toastText.textContent='Dateidialog geöffnet';
            toast.setAttribute('opacity','1');
          }
        }).observe(title,{subtree:true,childList:true,characterData:true});
      }
    }
  }

  window.createUtilityScene=function(container,options){
    var mode=options&&options.mode;
    if(mode==='home'||mode==='end')return createNavigationScene(container,options);
    var scene=baseUtility(container,options);
    polishUtilityScene(container,mode);
    return scene;
  };

  if(typeof baseDoc==='function'){
    window.createDocTextScene=function(container,options){
      var mode=options&&options.mode;
      var scene=baseDoc(container,options);
      polishDocScene(container,mode);
      return scene;
    };
  }
})();