(function(){
  'use strict';

  function el(target){
    return typeof target==='string'?document.getElementById(target):target;
  }

  function keyList(keys){
    if(Array.isArray(keys))return keys.slice();
    return String(keys||'').split(' + ').filter(Boolean);
  }

  function keyHtml(keys){
    return keyList(keys).map(function(key){return '<kbd>'+key+'</kbd>';}).join('<span class="anim-plus">+</span>');
  }

  function flowHtml(flow){
    return (flow||[]).map(function(part,index){return (index?'<b>→</b>':'')+'<span>'+part+'</span>';}).join('');
  }

  function mount(options){
    options=options||{};
    var grid=el(options.grid);
    if(!grid)throw new Error('tk2TheoryCards: grid not found');
    if(typeof options.sceneFactory!=='function')throw new Error('tk2TheoryCards: sceneFactory missing');

    var items=options.items||[];
    var groups=options.groups||{};
    var active=options.active!==false;
    var scenes=[];
    var lastGroup='';

    grid.innerHTML='';
    grid.classList.add('theory-grid');
    grid.style.setProperty('--theory-accent',options.accent||'#38bdf8');
    grid.style.setProperty('--theory-rgb',options.rgb||'56,189,248');
    grid.style.setProperty('--theory-accent-text',options.accentText||options.accent||'#bae6fd');

    items.forEach(function(item,index){
      if(item.group!==lastGroup){
        var meta=groups[item.group]||{icon:'•',title:item.group||'',desc:''};
        var section=document.createElement('div');
        section.className='theory-section';
        section.innerHTML='<div class="theory-section-icon">'+meta.icon+'</div><div><h2>'+meta.title+'</h2><p>'+meta.desc+'</p></div>';
        grid.appendChild(section);
        lastGroup=item.group;
      }

      var card=document.createElement('article');
      card.className='anim-card';
      card.dataset.group=item.group||'';
      card.innerHTML='<div class="anim-head"><div><div class="anim-number">Kürzel '+(index+1)+' von '+items.length+'</div><h2 class="anim-title">'+item.title+'</h2></div><div class="anim-keys">'+keyHtml(item.keys)+'</div></div><div class="anim-scene"></div><div class="anim-foot"><div class="anim-flow">'+flowHtml(item.flow)+'</div><p class="anim-desc">'+item.desc+'</p><p class="anim-remember"><strong>Merke:</strong> '+item.remember+'</p><div class="anim-actions"><button type="button" class="replay-btn" data-replay="'+index+'" aria-label="Animation zu '+item.title+' wiederholen">↻ Wiederholen</button></div></div>';
      grid.appendChild(card);

      var scene=options.sceneFactory(card.querySelector('.anim-scene'),item,index);
      scenes.push({scene:scene,card:card,visible:false});
    });

    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var current=scenes.find(function(x){return x.card===entry.target;});
        if(!current)return;
        current.visible=entry.isIntersecting&&entry.intersectionRatio>.18;
        current.card.classList.toggle('is-visible',current.visible);
        current.scene.setActive(active&&current.visible);
      });
    },{threshold:[0,.18,.4]});

    scenes.forEach(function(x){observer.observe(x.card);});

    function onClick(event){
      var btn=event.target.closest('[data-replay]');
      if(!btn||!grid.contains(btn))return;
      var index=Number(btn.dataset.replay);
      if(scenes[index])scenes[index].scene.play();
    }
    grid.addEventListener('click',onClick);

    function setActive(value){
      active=Boolean(value);
      scenes.forEach(function(x){x.scene.setActive(active&&x.visible);});
    }

    function destroy(){
      observer.disconnect();
      grid.removeEventListener('click',onClick);
      scenes.forEach(function(x){x.scene.setActive(false);});
      scenes=[];
    }

    return {setActive:setActive,destroy:destroy,scenes:scenes};
  }

  window.tk2TheoryCards={mount:mount};
})();
