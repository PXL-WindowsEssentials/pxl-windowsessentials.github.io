(function(){
function apply(){var h=false;try{h=localStorage.getItem('we-nav')==='hidden';}catch(e){}document.body.classList.toggle('we-nav-hidden',h);}
function init(){
 if(document.querySelector('.we-navtoggle')){apply();return;}
 var h=document.querySelector('.md-header__inner'); if(!h)return;
 var b=document.createElement('button'); b.className='we-navtoggle'; b.type='button';
 b.setAttribute('aria-label','Menu in- of uitklappen'); b.title='Menu in- of uitklappen';
 b.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1m6 2v14h12V5H9m-2 0H4v14h3V5z"/></svg>';
 b.onclick=function(){try{localStorage.setItem('we-nav',localStorage.getItem('we-nav')==='hidden'?'shown':'hidden');}catch(e){} apply();};
 var t=h.querySelector('.md-header__title'); h.insertBefore(b,t||h.firstChild); apply();
}
document.addEventListener('DOMContentLoaded',init); init();
if(window.document$)document$.subscribe(init);
})();
