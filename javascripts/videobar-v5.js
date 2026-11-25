(function(){
var io=null, keyed=false;
function init(){
 var vids=[].slice.call(document.querySelectorAll('.md-content video'));
 if('IntersectionObserver' in window){ if(io)io.disconnect(); io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting&&!e.target.paused)e.target.pause();});},{threshold:0}); }
 vids.forEach(function(v){
  if(io)io.observe(v);
  if(v.dataset.vbar)return; v.dataset.vbar='1';
  v.setAttribute('controls','');
  var bar=document.createElement('div');bar.className='we-vbar';
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
 if(!keyed){keyed=true;document.addEventListener('keydown',function(ev){
  if(ev.key!==' '||/INPUT|TEXTAREA|BUTTON|VIDEO/.test(document.activeElement.tagName))return;
  var best=null,bd=1e9,mid=window.innerHeight/2;
  [].slice.call(document.querySelectorAll('.md-content video')).forEach(function(v){var r=v.getBoundingClientRect();if(r.bottom<0||r.top>window.innerHeight)return;var d=Math.abs((r.top+r.bottom)/2-mid);if(d<bd){bd=d;best=v;}});
  if(best){ev.preventDefault();if(best.paused)best.play();else best.pause();}
 });}
}
document.addEventListener('DOMContentLoaded',init); init();
if(window.document$)document$.subscribe(init);
})();
