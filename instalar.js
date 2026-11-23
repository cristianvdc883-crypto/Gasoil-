// Ofrece instalar la app en la pantalla de inicio (Android, iPhone y iPad).
(function(){
var K='instalar_no';
if((window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true)return;
var ev=null;
var ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function ayuda(){
alert(ios
?'Para instalarla en iPhone o iPad: abrí esta página en Safari, tocá el botón Compartir (el cuadrado con la flecha hacia arriba) y elegí "Agregar a inicio".'
:'Para instalarla: tocá el menú ⋮ del navegador (arriba a la derecha) y elegí "Instalar app" o "Agregar a la pantalla de inicio".');
}
var banner=null;
function ocultar(){if(banner)banner.style.display='none'}
async function instalar(){
if(ev){
var e=ev;ev=null;
try{e.prompt();await e.userChoice}catch(x){}
ocultar();return;
}
ayuda();
}
addEventListener('beforeinstallprompt',function(e){e.preventDefault();ev=e});
addEventListener('appinstalled',function(){ocultar();try{localStorage.setItem(K,String(Date.now()+365*864e5))}catch(x){}});
var visto=0;try{visto=Number(localStorage.getItem(K)||0)}catch(x){}
if(Date.now()-visto>14*864e5){
banner=document.createElement('div');
banner.className='card';
banner.style.cssText='margin:0 0 12px;display:flex;gap:10px;align-items:center;justify-content:space-between';
banner.innerHTML='<span style="font-size:14px">📲 Instalá la app en tu pantalla de inicio</span><span style="display:flex;gap:6px;align-items:center"><button class="chip" id="iBtn">Instalar</button><button class="x" id="iNo" aria-label="Cerrar">✕</button></span>';
var h=document.querySelector('h1');
if(h)h.insertAdjacentElement('afterend',banner);else document.body.insertBefore(banner,document.body.firstChild);
document.getElementById('iBtn').onclick=instalar;
document.getElementById('iNo').onclick=function(){ocultar();try{localStorage.setItem(K,String(Date.now()))}catch(x){}};
}
var d=document.getElementById('v-datos');
if(d){
var c=document.createElement('div');
c.className='card';
c.innerHTML='<h3 style="margin-top:0">Instalar la app</h3><div class="st">Agregá Gasoil Campo a tu pantalla de inicio para abrirla como una app.</div><button class="sec" id="iBtn2">📲 Instalar en la pantalla de inicio</button>';
d.appendChild(c);
document.getElementById('iBtn2').onclick=instalar;
}
})();
