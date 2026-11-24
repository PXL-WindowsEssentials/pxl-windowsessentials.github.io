(function(){
'use strict';
var ROOT=document.body.getAttribute('data-root')||'';
function $(s,c){return (c||document).querySelector(s);}
function norm(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');}
function esc(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function terms(q){return norm(q).split(/[^a-z0-9_\-\.\\@:$#%]+/).filter(function(t){return t.length>0;});}

/* ---------- zoeken ---------- */
var input=$('#q'),panel=$('#results'),list=$('#rlist'),count=$('#rcount'),sel=-1,timer=null,prepared=false;
function prepare(){
  if(prepared||!window.SEARCH_INDEX)return;
  window.SEARCH_INDEX.forEach(function(e){e._h=norm(e.h);e._p=norm(e.p+' '+e.c);e._t=norm(e.t);});
  prepared=true;
}
function countOcc(hay,t){var n=0,i=0;while((i=hay.indexOf(t,i))!==-1){n++;i+=t.length;if(n>=6)break;}return n;}
function search(q){
  prepare();
  var ts=terms(q);if(!ts.length)return [];
  var nq=norm(q.trim()),res=[];
  window.SEARCH_INDEX.forEach(function(e){
    var score=0,ok=true;
    for(var k=0;k<ts.length;k++){
      var t=ts[k],h=countOcc(e._h,t),p=countOcc(e._p,t),b=countOcc(e._t,t);
      if(!h&&!p&&!b){ok=false;break;}
      score+=h*8+p*2+Math.min(b,5);
    }
    if(!ok)return;
    if(ts.length>1&&(e._t.indexOf(nq)!==-1||e._h.indexOf(nq)!==-1))score+=15;
    res.push({e:e,s:score});
  });
  res.sort(function(a,b){return b.s-a.s;});
  return res.slice(0,60);
}
function snippet(e,ts){
  var raw=e.t,n=e._t,pos=-1;
  for(var i=0;i<ts.length;i++){var p=n.indexOf(ts[i]);if(p!==-1&&(pos===-1||p<pos))pos=p;}
  if(pos===-1)return esc(raw.slice(0,160));
  var from=Math.max(0,pos-60),to=Math.min(raw.length,pos+140);
  var s=raw.slice(from,to);
  var ns=n.slice(from,to);
  // markeer op genormaliseerde posities (lengte blijft gelijk voor de meeste tekens)
  var out='',last=0,marks=[];
  ts.forEach(function(t){var i=0;while((i=ns.indexOf(t,i))!==-1){marks.push([i,i+t.length]);i+=t.length;}});
  marks.sort(function(a,b){return a[0]-b[0];});
  marks.forEach(function(m){if(m[0]<last)return;out+=esc(s.slice(last,m[0]))+'<mark>'+esc(s.slice(m[0],m[1]))+'</mark>';last=m[1];});
  out+=esc(s.slice(last));
  return (from>0?'… ':'')+out+(to<raw.length?' …':'');
}
function show(q){
  var res=search(q),ts=terms(q);
  panel.hidden=false;sel=-1;
  count.textContent=res.length?(res.length+(res.length>=60?'+':'')+' resultaten voor “'+q+'”'):'Geen resultaten voor “'+q+'”';
  var qs=encodeURIComponent(q.trim());
  list.innerHTML=res.map(function(r){
    var e=r.e,u=e.u,hash='',i=u.indexOf('#');
    if(i!==-1){hash=u.slice(i);u=u.slice(0,i);}
    return '<li><a href="'+ROOT+u+'?q='+qs+hash+'"><div class="crumb">'+esc(e.c)+' › '+esc(e.p)+'</div><div class="rh">'+esc(e.h)+'</div><div class="sn">'+snippet(e,ts)+'</div></a></li>';
  }).join('');
}
function hide(){panel.hidden=true;}
function move(d){
  var items=list.querySelectorAll('li');if(!items.length)return;
  if(sel>=0)items[sel].classList.remove('sel');
  sel=(sel+d+items.length)%items.length;
  items[sel].classList.add('sel');items[sel].scrollIntoView({block:'nearest'});
}
if(input){
  input.addEventListener('input',function(){
    clearTimeout(timer);
    var v=input.value;
    if(!v.trim()){hide();return;}
    timer=setTimeout(function(){show(v);},120);
  });
  input.addEventListener('keydown',function(ev){
    if(ev.key==='ArrowDown'){ev.preventDefault();move(1);}
    else if(ev.key==='ArrowUp'){ev.preventDefault();move(-1);}
    else if(ev.key==='Enter'){
      var items=list.querySelectorAll('li');
      if(!items.length&&input.value.trim()){show(input.value);return;}
      var t=items[sel>=0?sel:0];if(t){window.location.href=t.querySelector('a').href;}
    }
    else if(ev.key==='Escape'){hide();input.blur();}
  });
  $('#rclose').addEventListener('click',hide);
  document.addEventListener('keydown',function(ev){
    if(ev.key==='/'&&document.activeElement!==input&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){ev.preventDefault();input.focus();input.select();}
    if(ev.key==='Escape'&&!panel.hidden)hide();
    if(ev.key==='Escape'&&!$('#lightbox').hidden)$('#lightbox').hidden=true;
  });
}

/* ---------- zoektermen markeren op doelpagina ---------- */
var params=new URLSearchParams(window.location.search),pq=params.get('q');
if(pq){
  if(input)input.value=pq;
  var ts=terms(pq),main=$('#content article');
  if(main&&ts.length){
    var walker=document.createTreeWalker(main,NodeFilter.SHOW_TEXT,null),nodes=[],n;
    while((n=walker.nextNode()))nodes.push(n);
    var first=null;
    nodes.forEach(function(node){
      var txt=node.nodeValue,nt=norm(txt);
      if(nt.length!==txt.length)return; // sla uitzonderlijke normalisatieverschillen over
      var marks=[];
      ts.forEach(function(t){var i=0;while((i=nt.indexOf(t,i))!==-1){marks.push([i,i+t.length]);i+=t.length;}});
      if(!marks.length)return;
      marks.sort(function(a,b){return a[0]-b[0];});
      var frag=document.createDocumentFragment(),last=0;
      marks.forEach(function(m){
        if(m[0]<last)return;
        frag.appendChild(document.createTextNode(txt.slice(last,m[0])));
        var el=document.createElement('mark');el.className='hit';el.textContent=txt.slice(m[0],m[1]);frag.appendChild(el);last=m[1];
        if(!first)first=el;
      });
      frag.appendChild(document.createTextNode(txt.slice(last)));
      node.parentNode.replaceChild(frag,node);
    });
    var target=window.location.hash?document.getElementById(decodeURIComponent(window.location.hash.slice(1))):null;
    var tgt=target||first;
    if(tgt)setTimeout(function(){tgt.scrollIntoView({block:'start'});},50);
    var btn=$('#clearhits');
    if(first&&btn){
      btn.hidden=false;
      btn.addEventListener('click',function(){
        document.querySelectorAll('mark.hit').forEach(function(m){m.replaceWith(document.createTextNode(m.textContent));});
        btn.hidden=true;
        history.replaceState(null,'',window.location.pathname+window.location.hash);
      });
    }
  }
}

/* ---------- zijbalk ---------- */
try{
  var sb=$('#sidebar'),k='we-sb-scroll';
  var saved=sessionStorage.getItem(k);if(saved)sb.scrollTop=parseInt(saved,10)||0;
  var act=sb.querySelector('li.active');
  if(act&&!saved)act.scrollIntoView({block:'center'});
  window.addEventListener('beforeunload',function(){sessionStorage.setItem(k,sb.scrollTop);});
}catch(e){}
var mb=$('#menubtn');
if(mb)mb.addEventListener('click',function(){document.body.classList.toggle('menu');});
document.querySelectorAll('#sidebar a').forEach(function(a){a.addEventListener('click',function(){document.body.classList.remove('menu');});});

/* ---------- code kopiëren ---------- */
document.querySelectorAll('.copy').forEach(function(b){
  b.addEventListener('click',function(){
    var code=b.parentNode.querySelector('code').innerText;
    function done(){b.textContent='Gekopieerd';setTimeout(function(){b.textContent='Kopieer';},1500);}
    if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(code).then(done);}
    else{var ta=document.createElement('textarea');ta.value=code;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done();}catch(e){}document.body.removeChild(ta);}
  });
});

/* ---------- afbeeldingen vergroten ---------- */
var lb=$('#lightbox'),lbi=lb?lb.querySelector('img'):null;
document.querySelectorAll('#content article img').forEach(function(im){
  if(im.closest('table'))return;
  im.addEventListener('click',function(){lbi.src=im.src;lb.hidden=false;});
});
if(lb)lb.addEventListener('click',function(){lb.hidden=true;lbi.removeAttribute('src');});

/* ---------- video: eigen knoppenbalk (pauze, herstart, snelheid), spatie, pauze buiten beeld ---------- */
var vids=[].slice.call(document.querySelectorAll('#content video'));
vids.forEach(function(v){
  v.setAttribute('controls','');
  var bar=document.createElement('div');bar.className='vbar';
  function btn(t,fn,title){var b=document.createElement('button');b.type='button';b.textContent=t;if(title)b.title=title;b.addEventListener('click',fn);bar.appendChild(b);return b;}
  var pb=btn('⏸ Pauzeer',function(){if(v.paused)v.play();else v.pause();});
  btn('⏮ Opnieuw',function(){v.currentTime=0;v.play();});
  btn('−5s',function(){v.currentTime=Math.max(0,v.currentTime-5);});
  btn('+5s',function(){v.currentTime=Math.min(v.duration||1e9,v.currentTime+5);});
  [0.5,1,1.5,2].forEach(function(r){var b=btn(r+'×',function(){v.playbackRate=r;[].forEach.call(bar.querySelectorAll('.sp'),function(x){x.classList.remove('on');});b.classList.add('on');},'Snelheid');b.classList.add('sp');if(r===1)b.classList.add('on');});
  btn('⛶',function(){if(v.requestFullscreen)v.requestFullscreen();},'Volledig scherm');
  function sync(){pb.textContent=v.paused?'▶ Afspelen':'⏸ Pauzeer';}
  v.addEventListener('play',sync);v.addEventListener('pause',sync);sync();
  v.parentNode.insertBefore(bar,v.nextSibling);
});
document.addEventListener('keydown',function(ev){
  if(ev.key!==' '||/INPUT|TEXTAREA|BUTTON|VIDEO/.test(document.activeElement.tagName))return;
  var best=null,bd=1e9,mid=window.innerHeight/2;
  vids.forEach(function(v){var r=v.getBoundingClientRect();if(r.bottom<0||r.top>window.innerHeight)return;
    var d=Math.abs((r.top+r.bottom)/2-mid);if(d<bd){bd=d;best=v;}});
  if(best){ev.preventDefault();if(best.paused)best.play();else best.pause();}
});
if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(!e.isIntersecting&&!e.target.paused)e.target.pause();
  });},{threshold:0});
  vids.forEach(function(v){io.observe(v);});
}
})();
