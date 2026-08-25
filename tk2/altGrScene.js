(function(){
  'use strict';

  var counter=0;
  var LOOP_MS=5000;
  var CHORD_HOLD_MS=500;
  var CONTEXT_X=410;
  var CONTEXT_Y=58;
  var FLY_X=207;
  var FLY_Y=204;
  var CONFIG={
    at:{char:'@',key2:'2',label:'Klammeraffe',kind:'email',context:'anna@schule.ch',before:'anna',after:'schule.ch'},
    hash:{char:'#',key2:'3',label:'Hashtag / Raute',kind:'tag',context:'#Informatik',before:'',after:'Informatik'},
    euro:{char:'€',key2:'E',label:'Euro-Zeichen',kind:'price',context:'29.90 €',before:'29.90 ',after:''},
    pipe:{char:'|',key2:'7',label:'Senkrechter Strich',kind:'terminal',context:'cat daten.txt | sort',before:'cat daten.txt ',after:' sort'},
    backslash:{char:'\\',key2:'<',label:'Backslash',kind:'path',context:'C:\\Users\\Schule',before:'C:',after:'Users\\Schule'},
    squareOpen:{char:'[',key2:'ü',label:'Eckige Klammer auf',kind:'code',context:'[1, 2, 3]',before:'',after:'1, 2, 3]'},
    squareClose:{char:']',key2:'¨',label:'Eckige Klammer zu',kind:'code',context:'[1, 2, 3]',before:'[1, 2, 3',after:''},
    curlyOpen:{char:'{',key2:'ä',label:'Geschweifte Klammer auf',kind:'codeblock',context:'if (ok) {',before:'if (ok) ',after:''},
    curlyClose:{char:'}',key2:'$',label:'Geschweifte Klammer zu',kind:'codeblock',context:'if (ok) { starten(); }',before:'',after:'',multilineClose:true},
    degree:{char:'°',key2:'4',label:'Gradzeichen',kind:'temp',context:'21 °C',before:'21 ',after:'C'}
  };

  if(!document.getElementById('tk2-a2-theory-layout')){
    var layoutStyle=document.createElement('style');
    layoutStyle.id='tk2-a2-theory-layout';
    layoutStyle.textContent=''
      +'#a2-content-wrap #phase-1.card{padding:0;background:none;border:0;box-shadow:none}'
      +'#a2-content-wrap .theory-intro,#a2-content-wrap .theory-grid,#a2-content-wrap .theory-finish{max-width:1040px;margin-left:auto;margin-right:auto}'
      +'#a2-content-wrap .theory-grid{grid-template-columns:minmax(0,1040px)!important;justify-content:center;gap:18px;width:100%}'
      +'#a2-content-wrap .theory-section{grid-column:auto;width:100%}'
      +'#a2-content-wrap .anim-card{width:100%;max-width:1040px;margin:0 auto}'
      +'#a2-content-wrap .anim-scene{min-height:250px}'
      +'#a2-content-wrap .anim-scene svg{width:100%;max-width:100%;height:auto}'
      +'@media(max-width:780px){#a2-content-wrap .anim-scene{min-height:0}}';
    document.head.appendChild(layoutStyle);
  }

  function createAltGrScene(container,options){
    options=options||{};
    var mode=options.mode||'at';
    var cfg=CONFIG[mode]||CONFIG.at;
    var active=options.autoplay!==false;
    var autoLoop=options.loop!==false;
    var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var uid='tk2alt'+(++counter);
    var timers=[];
    var running=false;

    function contextMarkup(){
      var title='Beispiel';
      var icon='⌨';
      if(cfg.kind==='email'){title='E-Mail-Adresse';icon='✉';}
      else if(cfg.kind==='tag'){title='Hashtag';icon='#';}
      else if(cfg.kind==='price'){title='Preis';icon='€';}
      else if(cfg.kind==='terminal'){title='Terminal';icon='>_';}
      else if(cfg.kind==='path'){title='Windows-Pfad';icon='📁';}
      else if(cfg.kind==='code'||cfg.kind==='codeblock'){title='Code';icon='</>';}
      else if(cfg.kind==='temp'){title='Temperatur';icon='🌡';}

      var mono=(cfg.kind==='terminal'||cfg.kind==='path'||cfg.kind==='code'||cfg.kind==='codeblock');
      var font=mono?'Consolas,monospace':'Arial,sans-serif';
      var size=(cfg.context.length>16?16:19);
      var content='';
      if(cfg.multilineClose){
        content=''
          +'<text x="29" y="83" font-family="'+font+'" font-size="15" font-weight="700" fill="#e2e8f0">if (ok) {</text>'
          +'<text x="29" y="103" font-family="'+font+'" font-size="15" font-weight="700" fill="#e2e8f0">  starten();</text>'
          +'<text class="ctx-before" x="29" y="123" font-family="'+font+'" font-size="15" font-weight="700" fill="#e2e8f0"></text>'
          +'<text class="ctx-char" x="29" y="123" font-family="'+font+'" font-size="15" font-weight="900" fill="#fde047" opacity="0">'+escapeText(cfg.char)+'</text>'
          +'<text class="ctx-after" x="29" y="123" font-family="'+font+'" font-size="15" font-weight="700" fill="#e2e8f0"></text>';
      }else{
        content=''
          +'<text class="ctx-before" x="29" y="100" font-family="'+font+'" font-size="'+size+'" font-weight="700" fill="#e2e8f0">'+escapeText(cfg.before)+'</text>'
          +'<text class="ctx-char" x="29" y="100" font-family="'+font+'" font-size="'+size+'" font-weight="900" fill="#fde047" opacity="0">'+escapeText(cfg.char)+'</text>'
          +'<text class="ctx-after" x="29" y="100" font-family="'+font+'" font-size="'+size+'" font-weight="700" fill="#e2e8f0">'+escapeText(cfg.after)+'</text>';
      }
      return '<g class="context" transform="translate('+CONTEXT_X+' '+CONTEXT_Y+')" filter="url(#'+uid+'Shadow)">'+
        '<rect width="205" height="178" rx="20" fill="#101a2c" stroke="#334155" stroke-width="1.5"/>'+
        '<rect width="205" height="42" rx="20" fill="#17233a"/>'+
        '<rect y="23" width="205" height="19" fill="#17233a"/>'+
        '<text x="18" y="26" font-family="Arial,sans-serif" font-size="11" font-weight="800" fill="#cbd5e1">'+icon+'  '+title+'</text>'+
        '<rect x="17" y="61" width="171" height="66" rx="13" fill="#08111f" stroke="#334155"/>'+
        content+
        '<g class="context-result" opacity="0"><rect x="17" y="141" width="171" height="25" rx="12.5" fill="#052e2b" stroke="#10b981"/><circle cx="34" cy="153.5" r="6" fill="#10b981"/><path d="M31 153.5l2 2 4-5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><text x="47" y="157" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="#a7f3d0">Zeichen eingesetzt</text></g>'+
      '</g>';
    }

    function escapeText(v){
      return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function keyMarkup(){
      return '<g class="keys" transform="translate(36 219)" filter="url(#'+uid+'Shadow)">'+
        '<g class="key key-alt" data-base="translate(0 0)" transform="translate(0 0)"><rect width="96" height="50" rx="12" fill="#182235" stroke="#f59e0b" stroke-opacity=".55" stroke-width="2"/><text x="48" y="31" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="900" fill="#fde68a">AltGr</text></g>'+
        '<text x="112" y="31" font-family="Arial,sans-serif" font-size="18" font-weight="900" fill="#64748b">+</text>'+
        '<g class="key key-main" data-base="translate(136 0)" transform="translate(136 0)"><rect width="70" height="50" rx="12" fill="#182235" stroke="#f59e0b" stroke-opacity=".55" stroke-width="2"/><text x="35" y="31" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="900" fill="#fde68a">'+escapeText(cfg.key2)+'</text><text x="58" y="44" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="900" fill="#fbbf24">'+escapeText(cfg.char)+'</text></g>'+
      '</g>';
    }

    container.innerHTML='<svg class="tk2-altgr-scene" viewBox="0 0 680 320" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animation: '+cfg.label+' mit AltGr und '+escapeText(cfg.key2)+'">'+
      '<defs><filter id="'+uid+'Shadow" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="0" dy="9" stdDeviation="10" flood-color="#020617" flood-opacity=".38"/></filter><radialGradient id="'+uid+'Glow"><stop offset="0" stop-color="#f59e0b" stop-opacity=".24"/><stop offset="1" stop-color="#f59e0b" stop-opacity="0"/></radialGradient></defs>'+
      '<rect width="680" height="320" rx="24" fill="#07101f"/>'+
      '<circle cx="95" cy="84" r="112" fill="url(#'+uid+'Glow)"/>'+
      '<g class="symbol-stage" filter="url(#'+uid+'Shadow)"><rect x="36" y="38" width="238" height="152" rx="22" fill="#0f1b2f" stroke="#334155" stroke-width="1.5"/><text x="55" y="67" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="#94a3b8">SONDERZEICHEN</text><circle cx="155" cy="119" r="48" fill="#1e293b" stroke="#f59e0b" stroke-opacity=".5" stroke-width="2"/><text class="hero-char" x="155" y="139" text-anchor="middle" font-family="Consolas,monospace" font-size="62" font-weight="900" fill="#fde047" opacity=".28">'+escapeText(cfg.char)+'</text><text x="155" y="178" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="800" fill="#cbd5e1">'+cfg.label+'</text></g>'+
      contextMarkup()+keyMarkup()+
      '<g class="flying-char" opacity="0"><circle cx="'+FLY_X+'" cy="'+FLY_Y+'" r="24" fill="#f59e0b" opacity=".18"/><text x="'+FLY_X+'" y="'+(FLY_Y+13)+'" text-anchor="middle" font-family="Consolas,monospace" font-size="38" font-weight="900" fill="#fde047">'+escapeText(cfg.char)+'</text></g>'+
      '<g class="press-label" transform="translate('+CONTEXT_X+' 250)" opacity="0"><rect width="205" height="35" rx="17.5" fill="#422006" stroke="#f59e0b"/><text x="102.5" y="22" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="800" fill="#fde68a">AltGr aktiviert 3. Zeichen</text></g>'+
      '</svg>';

    var svg=container.querySelector('svg');
    var $=function(sel){return svg.querySelector(sel);};
    var $$=function(sel){return Array.from(svg.querySelectorAll(sel));};
    function later(ms,fn){timers.push(window.setTimeout(fn,ms));}
    function clearTimers(){timers.forEach(window.clearTimeout);timers=[];}
    function trans(el,val){if(el)el.style.transition=reduceMotion?'none':val;}
    function opacity(el,val){if(el)el.setAttribute('opacity',String(val));}

    function textLength(el,fallback){
      if(!el)return fallback;
      try{
        var measured=el.getComputedTextLength();
        if(Number.isFinite(measured))return measured;
      }catch(e){}
      return fallback;
    }

    function layoutContext(){
      var before=$('.ctx-before'),ch=$('.ctx-char'),after=$('.ctx-after');
      if(cfg.multilineClose){
        ch.setAttribute('x',29);
        return;
      }
      var x=29;
      before.setAttribute('x',x);
      var fallbackBefore=Math.max(0,cfg.before.length*(cfg.context.length>16?8.5:10));
      var beforeWidth=textLength(before,fallbackBefore);
      ch.setAttribute('x',x+beforeWidth);
      var fallbackChar=cfg.char.length>1?16:11;
      var charWidth=textLength(ch,fallbackChar);
      after.setAttribute('x',x+beforeWidth+charWidth);
    }

    function flyingTargetTransform(){
      var ch=$('.ctx-char');
      var targetX=CONTEXT_X+parseFloat(ch.getAttribute('x')||29);
      var targetY=CONTEXT_Y+parseFloat(ch.getAttribute('y')||100)-8;
      var scale=.55;
      var dx=targetX-(FLY_X*scale);
      var dy=targetY-(FLY_Y*scale);
      return 'translate('+dx+' '+dy+') scale('+scale+')';
    }

    function reset(){
      clearTimers();running=false;
      $$('.key').forEach(function(k){k.style.filter='';k.style.transition='none';k.setAttribute('transform',k.getAttribute('data-base'));});
      opacity($('.hero-char'),.28);opacity($('.flying-char'),0);$('.flying-char').setAttribute('transform','translate(0 0) scale(1)');
      opacity($('.ctx-char'),0);opacity($('.context-result'),0);opacity($('.press-label'),0);
      layoutContext();
    }

    function keyDown(el){
      var base=el.getAttribute('data-base');
      trans(el,'transform 180ms ease, filter 180ms ease');
      el.setAttribute('transform',base+' translate(0 5)');
      el.style.filter='drop-shadow(0 0 10px rgba(245,158,11,.9))';
    }

    function keyUp(el){
      var base=el.getAttribute('data-base');
      trans(el,'transform 160ms ease, filter 160ms ease');
      el.setAttribute('transform',base);
      el.style.filter='';
    }

    function showEndState(){
      reset();opacity($('.hero-char'),1);opacity($('.ctx-char'),1);opacity($('.context-result'),1);opacity($('.press-label'),1);
    }

    function run(){
      if(reduceMotion){showEndState();return;}
      reset();running=true;
      var secondKeyAt=700;
      later(350,function(){keyDown($('.key-alt'));});
      later(secondKeyAt,function(){keyDown($('.key-main'));});
      later(1000,function(){
        trans($('.hero-char'),'opacity 260ms ease');
        opacity($('.hero-char'),1);
        opacity($('.press-label'),1);
      });
      later(1100,function(){
        opacity($('.flying-char'),1);
        trans($('.flying-char'),'transform 820ms cubic-bezier(.2,.78,.24,1), opacity 180ms ease');
        $('.flying-char').setAttribute('transform',flyingTargetTransform());
      });
      later(secondKeyAt+CHORD_HOLD_MS,function(){keyUp($('.key-main'));});
      later(secondKeyAt+CHORD_HOLD_MS+120,function(){keyUp($('.key-alt'));});
      later(1920,function(){opacity($('.flying-char'),0);opacity($('.ctx-char'),1);opacity($('.context-result'),1);});
      later(LOOP_MS,function(){running=false;if(active&&autoLoop)run();});
    }

    function play(){active=true;run();}
    function setActive(v){active=Boolean(v);if(!active){clearTimers();running=false;}else if(!running)run();}
    reset();if(active)run();
    return {play:play,reset:reset,setActive:setActive};
  }

  window.createAltGrScene=createAltGrScene;
})();