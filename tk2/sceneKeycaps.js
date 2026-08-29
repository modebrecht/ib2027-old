(function(){
  'use strict';

  var CHORD_HOLD_MS=800;
  var RELEASE_STEP_MS=100;

  var PROFILES={
    doc:{step:150,hold:240,duration:160},
    utility:{step:115,hold:170,duration:100}
  };

  function profile(name){return PROFILES[name]||PROFILES.utility;}
  function baseOf(key){return key.getAttribute('data-base')||'';}


  function keyWidth(key,name){
    if(name==='doc'){
      if(key==='Shift')return 78;
      if(key==='Ctrl')return 68;
      return 48;
    }
    return key==='Ctrl'?68:(String(key).length>2?70:48);
  }

  function rowWidth(keys,name){
    return Array.from(keys||[]).reduce(function(total,key){return total+keyWidth(key,name);},0)+Math.max(0,Array.from(keys||[]).length-1)*26;
  }

  function esc(value){
    return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function markup(keys,name){
    var x=0;
    var isDoc=name==='doc';
    var cls=isDoc?'tk2-key':'tk2-u-key';
    return Array.from(keys||[]).map(function(key,index){
      var w=keyWidth(key,name);
      var base='translate('+x+' 0)';
      var dataKey=isDoc?' data-key="'+esc(key)+'"':'';
      var fontSize=String(key).length>4?(isDoc?12:11):14;
      var out='<g class="'+cls+'"'+dataKey+' data-base="'+base+'" transform="'+base+'"><rect width="'+w+'" height="42" rx="10" fill="#172033" stroke="#475569" stroke-width="1.5"/><text x="'+(w/2)+'" y="27" text-anchor="middle" font-family="Arial,sans-serif" font-size="'+fontSize+'" font-weight="800" fill="#dbeafe">'+esc(key)+'</text></g>';
      x+=w;
      if(index<Array.from(keys||[]).length-1){
        out+='<text x="'+(x+9)+'" y="27" font-family="Arial,sans-serif" font-size="16" font-weight="800" fill="#64748b">+</text>';
        x+=26;
      }
      return out;
    }).join('');
  }

  function down(key,trans,name){
    if(!key)return;
    var p=profile(name);
    var base=baseOf(key);
    if(typeof trans==='function')trans(key,'transform '+p.duration+'ms ease, filter '+p.duration+'ms ease');
    else key.style.transition='transform '+p.duration+'ms ease, filter '+p.duration+'ms ease';
    key.setAttribute('transform',base+' translate(0 4)');
    key.style.filter='drop-shadow(0 0 8px rgba(56,189,248,.75))';
  }

  function up(key){
    if(!key)return;
    key.setAttribute('transform',baseOf(key));
    key.style.filter='';
  }

  function reset(key){
    if(!key)return;
    key.style.transition='none';
    key.style.filter='';
    key.setAttribute('transform',baseOf(key));
  }

  function resetMany(keys){Array.from(keys||[]).forEach(reset);}

  function pressSequence(keys,later,trans,name){
    var p=profile(name);
    var list=Array.from(keys||[]);
    if(!list.length)return;

    list.forEach(function(key,index){
      later(index*p.step,function(){
        down(key,trans,name);
      });
    });

    var allDownAt=Math.max(0,(list.length-1)*p.step);
    later(allDownAt+CHORD_HOLD_MS,function(){
      list.slice().reverse().forEach(function(key,index){
        later(index*RELEASE_STEP_MS,function(){up(key);});
      });
    });
  }

  window.tk2SceneKeycaps={markup:markup,rowWidth:rowWidth,down:down,up:up,reset:reset,resetMany:resetMany,pressSequence:pressSequence,chordHoldMs:CHORD_HOLD_MS};
})();
