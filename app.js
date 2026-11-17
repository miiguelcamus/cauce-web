(function(){
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var API=window.CAUCE_API||'';

// cabecera
var top=$('.top');function sc(){top.classList.toggle('sc',scrollY>16)}sc();addEventListener('scroll',sc,{passive:true});
var bg=$('.burger'),mm=$('.mm');
if(bg)bg.addEventListener('click',function(){var o=bg.getAttribute('aria-expanded')!=='true';bg.setAttribute('aria-expanded',o);mm.classList.toggle('on',o);mm.setAttribute('aria-hidden',!o);document.body.style.overflow=o?'hidden':'';top.classList.toggle('sc',o||scrollY>16)});
$$('.mm a').forEach(function(a){a.addEventListener('click',function(){if(bg.getAttribute('aria-expanded')==='true')bg.click()})});
var RM=matchMedia('(prefers-reduced-motion: reduce)').matches;

// aparición escalonada por grupo
var io='IntersectionObserver' in window&&!RM?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -40px'}):null;
var grp=new Map();
$$('.rv,.bx').forEach(function(el){var p=el.parentElement,n=grp.get(p)||0;grp.set(p,n+1);if(io){el.style.transitionDelay=Math.min(n,6)*90+'ms';io.observe(el)}else el.classList.add('in')});

// capas del fondo con parallax
var cv=$$('.curvas');
if(cv.length&&!RM){var tk=0;addEventListener('scroll',function(){if(tk)return;tk=requestAnimationFrame(function(){tk=0;var y=scrollY;cv.forEach(function(c){c.style.transform='translate3d(0,'+(y*.18)+'px,0)'})})},{passive:true})}

// iframes de las webs a escala
function escala(){$$('.fr').forEach(function(f){var i=$('iframe',f);if(i)i.style.setProperty('--s',f.clientWidth/1280)})}
escala();addEventListener('resize',escala);

// el cauce: una reserva baja por el río y activa cada paso
var C=$('[data-cauce]');
if(C){
 var P=$('[data-path]',C),G=$('[data-gota]',C),L=$$('.evs li',C),svg=$('.rio',C),len=P.getTotalLength(),VB=[1200,300];
 function coloca(){L.forEach(function(li){var pt=P.getPointAtLength(+li.dataset.p*len);li.style.left=(pt.x/VB[0]*100)+'%';li.style.top=(pt.y/VB[1]*100)+'%'})}
 coloca();addEventListener('resize',coloca);
 var movil=matchMedia('(max-width:820px)'),DUR=9000,t0=null,vista=false;
 function paso(ts){
  if(!vista){t0=null;requestAnimationFrame(paso);return}
  if(t0===null)t0=ts;var t=((ts-t0)%(DUR+1800))/DUR;
  if(t<=1){
   if(!movil.matches){var pt=P.getPointAtLength(t*len),r=svg.getBoundingClientRect(),cr=C.getBoundingClientRect();
    G.style.transform='translate('+(pt.x/VB[0]*r.width+(r.left-cr.left))+'px,'+(pt.y/VB[1]*r.height+(r.top-cr.top))+'px)';G.style.opacity=t<.02||t>.98?0:1}
   L.forEach(function(li){li.classList.toggle('on',t>=+li.dataset.p-.015)})
  }else{G.style.opacity=0}
  requestAnimationFrame(paso)}
 if(RM){L.forEach(function(li){li.classList.add('on')})}
 else{new IntersectionObserver(function(es){vista=es[0].isIntersecting}).observe(C);requestAnimationFrame(paso)}
}

// antes / después
var AD=$('[data-ad]');
if(AD){var bs=$$('.ad-sw button',AD),tocado=false;
 function pon(v){AD.classList.toggle('con',v==='con');bs.forEach(function(b){b.setAttribute('aria-selected',b.dataset.v===v)})}
 bs.forEach(function(b){b.addEventListener('click',function(){tocado=true;pon(b.dataset.v);envia('clic',{q:'dia_'+b.dataset.v})})});
 if(io)new IntersectionObserver(function(es,o){if(es[0].isIntersecting){o.disconnect();setTimeout(function(){if(!tocado)pon('con')},2600)}},{threshold:.5}).observe(AD)}

// río de página: se dibuja al bajar
var RP=$('[data-rp]');
if(RP){var rl=RP.getTotalLength();RP.style.strokeDasharray=rl;RP.style.strokeDashoffset=rl;
 function dib(){var h=document.documentElement,p=Math.min(1,scrollY/Math.max(1,h.scrollHeight-innerHeight));RP.style.strokeDashoffset=rl*(1-(RM?1:Math.max(.04,p)))}
 dib();addEventListener('scroll',dib,{passive:true});addEventListener('resize',dib)}

// pedir muestra: sector + vista previa en vivo
var SEC={'Peluquería':['#B0476E','#F7DCE6',['Corte','Color','Peinado']],'Barbería':['#1F2A44','#DDE3EE',['Corte','Barba','Corte + barba']],
 'Fisioterapia':['#0B6E8A','#D4ECF4',['Espalda','Deportiva','Pilates']],'Estética':['#9A5A2E','#F6E4D6',['Facial','Manicura','Depilación']],
 'Peluquería canina':['#7A5BB5','#E7DFF6',['Baño','Corte','Uñas']],'Restaurante':['#B23A2A','#F8DED6',['Carta','Menú del día','Reservar mesa']],
 'Otro':['#0A1F1C','#D3F6EA',['Servicio 1','Servicio 2','Servicio 3']]};
var PV=$('[data-pv]'),sector='Peluquería';
if(PV){var lv=$('[data-live]'),nm=$('[data-pv-name]'),lg=$('[data-pv-logo]'),ur=$('[data-pv-url]'),tg=$('[data-pv-tag]'),rs=$('[data-pv-res]'),cs=$$('[data-pv-cards] b');
 function slug(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'').slice(0,22)}
 function pinta(){var x=SEC[sector],v=lv.value.trim(),n=v||'Tu negocio';n=n.charAt(0).toUpperCase()+n.slice(1);
  PV.style.setProperty('--pa',x[0]);PV.style.setProperty('--ps',x[1]);
  nm.textContent=n;lg.textContent=n;ur.textContent=(v?slug(n):'tunegocio')+'.es';tg.textContent=sector+' · Abierto hoy';
  cs.forEach(function(b,i){b.textContent=x[2][i]});rs.textContent='Jueves 17:00 · '+x[2][0]}
 $$('[data-sec]').forEach(function(b){b.addEventListener('click',function(){sector=b.dataset.sec;$$('[data-sec]').forEach(function(o){o.setAttribute('aria-checked',o===b)});pinta()})});
 lv.addEventListener('input',pinta);pinta()}

// contacto: chat de preguntas rápidas
var CH=$('[data-chat]');
if(CH){var body=$('[data-ch-body]',CH),wa=$('[data-ch-wa]',CH),ocup=false;
 function burbuja(cls,html){var d=document.createElement('div');d.className='bu '+cls;d.innerHTML=html;body.appendChild(d);body.scrollTop=body.scrollHeight;return d}
 $$('[data-ch-q] button',CH).forEach(function(b){b.addEventListener('click',function(){if(ocup)return;ocup=true;b.classList.add('usada');
  burbuja('tu',b.textContent);envia('clic',{q:'chat_'+b.dataset.k});
  var e=burbuja('yo esc','<i></i><i></i><i></i>');
  setTimeout(function(){e.remove();burbuja('yo',b.dataset.a+(b.dataset.l?'<br><a href="'+b.dataset.l+'">'+b.dataset.lt+'</a>':''));ocup=false},RM?0:900);
  wa.href=CH.dataset.wa+'?text='+encodeURIComponent('Hola, vengo de vuestra web. '+b.textContent)})})}

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
$$('a[href^="contacto.html"]').forEach(function(a){a.addEventListener('click',function(){envia('clic',{q:'cta_'+(a.closest('.top,.mm')?'menu_':'')+(a.textContent||'').trim().slice(0,22)})})});
$$('.tr .nav-f,.tr-t .btn').forEach(function(a){a.addEventListener('click',function(){var t=a.closest('.tr');envia('clic',{q:'trabajo_'+(($('h2',t)||{}).textContent||'').trim()})})});
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
  if(f.b&&typeof sector!=='undefined'&&$('[data-sec]'))f.b=f.b+' · '+sector;
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
