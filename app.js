(function(){
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var API=window.CAUCE_API||'';

// cabecera
var top=$('.top');addEventListener('scroll',function(){top.classList.toggle('sc',scrollY>8)},{passive:true});
var bg=$('.burger'),mm=$('.mm');
if(bg)bg.addEventListener('click',function(){var o=bg.getAttribute('aria-expanded')!=='true';bg.setAttribute('aria-expanded',o);mm.classList.toggle('on',o);mm.setAttribute('aria-hidden',!o);document.body.style.overflow=o?'hidden':''});
$$('.mm a').forEach(function(a){a.addEventListener('click',function(){if(bg.getAttribute('aria-expanded')==='true')bg.click()})});

// aparición
var io='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.08,rootMargin:'0px 0px -50px'}):null;
$$('.rv').forEach(function(el,i){if(io){el.style.transitionDelay=(i%4)*70+'ms';io.observe(el)}else el.classList.add('in')});

// ---------- analítica propia ----------
var S={};
try{S=JSON.parse(sessionStorage.getItem('cauce_s')||'{}')}catch(e){}
if(!S.id){S.id=Math.random().toString(36).slice(2)+Date.now().toString(36);S.t0=Date.now();S.n=0;}
function save(){try{sessionStorage.setItem('cauce_s',JSON.stringify(S))}catch(e){}}
function dev(){var w=innerWidth;return w<700?'movil':w<1100?'tablet':'ordenador'}
function origen(){
 var u=new URL(location.href),c=u.searchParams.get('utm_source')||u.searchParams.get('ref');
 if(c)return c.toLowerCase();
 var r=document.referrer;
 if(!r)return 'directo';
 try{var h=new URL(r).hostname.replace(/^www\./,'');
  if(h===location.hostname)return '';
  if(/google|bing|duckduckgo|ecosia|yahoo/.test(h))return 'buscador';
  if(/instagram/.test(h))return 'instagram';
  if(/whatsapp|wa\.me/.test(h))return 'whatsapp';
  if(/facebook|fb\./.test(h))return 'facebook';
  if(/linkedin/.test(h))return 'linkedin';
  if(/tiktok/.test(h))return 'tiktok';
  return h}catch(e){return 'directo'}
}
function envia(tipo,extra){
 if(!API)return;
 var d=Object.assign({api:'ev',t:tipo,sid:S.id,pg:location.pathname.split('/').pop()||'index.html',
  src:origen(),dev:dev(),w:innerWidth,nv:S.n,ref:(document.referrer||'').slice(0,120)},extra||{});
 try{
  var b=new Blob([JSON.stringify(d)],{type:'text/plain'});
  if(navigator.sendBeacon&&tipo!=='lead')return navigator.sendBeacon(API,b);
 }catch(e){}
 return fetch(API,{method:'POST',body:JSON.stringify(d),headers:{'Content-Type':'text/plain'},keepalive:true}).catch(function(){});
}
S.n=(S.n||0)+1;save();
envia('vista');

// profundidad de scroll + tiempo
var maxp=0,marks={25:0,50:0,75:0,100:0};
addEventListener('scroll',function(){
 var h=document.documentElement,p=Math.min(100,Math.round((scrollY+innerHeight)/h.scrollHeight*100));
 if(p>maxp){maxp=p;[25,50,75,100].forEach(function(m){if(p>=m&&!marks[m]){marks[m]=1;envia('scroll',{v:m})}})}
},{passive:true});
var t0=Date.now();
addEventListener('visibilitychange',function(){
 if(document.visibilityState==='hidden')envia('salida',{seg:Math.round((Date.now()-t0)/1000),v:maxp});
});

// clics que importan
$$('a[href^="https://wa.me"],a[href^="tel:"]').forEach(function(a){
 a.addEventListener('click',function(){envia('clic',{q:/wa\.me/.test(a.href)?'whatsapp':'telefono'})});
});
$$('a[href="#contacto"]').forEach(function(a){a.addEventListener('click',function(){envia('clic',{q:'cta_'+(a.textContent||'').trim().slice(0,22)})})});
$$('.wc').forEach(function(a){a.addEventListener('click',function(){envia('clic',{q:'trabajo_'+(($('h3',a)||{}).textContent||'').trim()})})});
$$('.faq summary').forEach(function(s){s.addEventListener('click',function(){envia('clic',{q:'faq_'+s.textContent.trim().slice(0,34)})})});
var pv=$('#precios');
if(pv&&io){new IntersectionObserver(function(es,o){es.forEach(function(e){if(e.isIntersecting){envia('hito',{q:'ve_precios'});o.disconnect()}})},{threshold:.4}).observe(pv)}

// formulario
var fm=$('[data-form]');
if(fm){
 var msg=$('[data-msg]'),btn=$('[data-send]');
 fm.addEventListener('submit',function(e){
  e.preventDefault();
  var f={};['n','c','b','s','m'].forEach(function(k){var el=fm.elements[k];if(el)f[k]=(el.value||'').trim()});
  if(!f.n||!f.c||!f.b){msg.className='fmsg err';msg.textContent='Rellena tu nombre, el contacto y tu negocio.';return}
  btn.disabled=true;var old=btn.innerHTML;btn.textContent='Enviando…';
  var done=function(ok){
   btn.disabled=false;btn.innerHTML=old;
   msg.className='fmsg '+(ok?'ok':'err');
   msg.textContent=ok?'¡Recibido! Te escribimos hoy mismo con tu muestra.':'No se ha podido enviar. Escríbenos por WhatsApp y lo vemos.';
   if(ok)fm.reset();
  };
  if(!API){done(false);return}
  envia('lead',f).then(function(){done(true)}).catch(function(){done(false)});
 });
}
})();
