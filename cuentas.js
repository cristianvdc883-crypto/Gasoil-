// Datos de cobro que ven los clientes. Si ponés tu WhatsApp en "wa" (con código de país, sin + ni espacios, ej: 5493534123456), el botón "Ya pagué" abre WhatsApp. Si queda vacío, abre el mail.
const PAGO={alias:'cristian-30.1',titular:'Cristian Nicolás Pereyra',wa:'',mail:'apps19445@gmail.com'};
let CU=null,COTC=null,errC='';
try{CU=JSON.parse(localStorage.getItem('cuenta')||'null');COTC=JSON.parse(localStorage.getItem('cotc')||'null')}catch(e){}
const pesoC=n=>'$ '+Math.round(n).toLocaleString('es-AR');
const ddC=s=>new Date(s).toLocaleDateString('es-AR');
const hoyC=()=>{const x=new Date();x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10)};
const difC=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);
const montoC=()=>CU&&COTC?Math.round(+CU.precio_usd*COTC.v/100)*100:0;
function estadoC(c){
if(!c)return{t:'',col:'#777',m:''};
if(c.activo===false)return{t:'SUSPENDIDA',col:'#c62828',m:'Tu cuenta está suspendida. Pagá y avisanos para reactivarla.'};
if(!c.vence)return{t:'ACTIVA',col:'#1e9e4a',m:'Sin fecha de vencimiento.'};
const d=difC(hoyC(),c.vence),f=ddC(c.vence+'T00:00:00');
if(d<0)return{t:'VENCIDA',col:'#c62828',m:'Venció el '+f+' (hace '+(-d)+' días).'};
if(d<=7)return{t:'POR VENCER',col:'#e08a00',m:'Vence el '+f+(d===0?' (hoy).':' (en '+d+' días).')};
return{t:'ACTIVA',col:'#1e9e4a',m:'Vence el '+f+' (en '+d+' días).'};
}
async function traerCotC(t){
try{const r=await fetch('https://dolarapi.com/v1/dolares/'+t),j=await r.json();
if(!(j.venta>0))return;
COTC={v:j.venta,f:new Date().toISOString(),t:t};localStorage.setItem('cotc',JSON.stringify(COTC))}catch(e){}
}
function pintarCuentaUI(){
const bl=perfil&&perfil.bloq,e=estadoC(CU),m=montoC();
$('cBanner').classList.toggle('hide',!bl);
$('cBanner').innerHTML=bl?'<b>Tu cuenta no está activa.</b><div class="st" style="font-size:14px">Pagá tu suscripción y avisanos con el botón “Ya pagué”. Cuando te la reactivemos, tocá el botón de abajo.</div><button class="sec" data-c="act">Ya me reactivaron: actualizar</button>':'';
$('cEstado').innerHTML=CU?`<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:18px">${esc(CU.campo||'')}</b><b style="color:${e.col}">${e.t}</b></div><div class="st" style="font-size:15px">${e.m}</div>${errC?'<div class="st">'+esc(errC)+'</div>':''}<button class="sec" data-c="ref">Actualizar</button>`:`<div class="st">${errC?esc(errC):'Todavía no hay datos. Conectate a internet para ver tu cuenta.'}</div><button class="sec" data-c="ref">Actualizar</button>`;
$('cMonto').innerHTML=CU?`<h3 style="margin-top:0">Monto del mes</h3><div style="font-size:26px;font-weight:700">${COTC?pesoC(m):'USD '+(+CU.precio_usd)}</div><div class="st">USD ${+CU.precio_usd} por mes${COTC?' × $ '+COTC.v.toLocaleString('es-AR')+' (dólar '+esc(CU.tipo_dolar||'oficial')+', '+ddC(COTC.f)+')':' · sin cotización: consultá el monto en pesos'}</div>`:'';
$('cPagar').innerHTML=`<h3 style="margin-top:0">Cómo pagar</h3><div class="st">Transferí desde cualquier banco o billetera a este alias:</div><div class="row"><div><b style="font-size:20px">${esc(PAGO.alias)}</b><br><small>Titular: ${esc(PAGO.titular)}</small></div><button class="chip" data-c="copiar">Copiar</button></div><button class="big" data-c="pague" style="margin-top:12px;padding:16px;font-size:18px">✔ Ya pagué</button><div class="st">Se abre un mensaje para que mandes el comprobante.</div>`;
const pg=(CU&&CU.pagos||[]).slice(0,8);
$('cPagos').innerHTML=pg.map(x=>`<div class="row"><div style="flex:1"><b>${pesoC(+x.monto)}</b><br><small>${esc(x.medio||'')} · +${x.dias} días · ${ddC(x.creado)}</small></div></div>`).join('')||'<div class="st">Todavía no hay pagos registrados.</div>';
$('cContacto').innerHTML=`<h3 style="margin-top:0">Contacto</h3><div class="st" style="font-size:15px">Consultas, pagos o bajas:<br><a href="mailto:${PAGO.mail}">${PAGO.mail}</a>${PAGO.wa?'<br><a href="https://wa.me/'+PAGO.wa+'" target="_blank">WhatsApp</a>':''}</div><div class="st"><a href="terminos.html" target="_blank">Términos y condiciones</a> · <a href="privacidad.html" target="_blank">Política de privacidad</a></div>`;
}
async function pintarCuenta(){
if(!perfil||perfil.rol!=='ADMIN')return;
pintarCuentaUI();
if(!navigator.onLine||!sb)return;
const {data,error}=await sb.rpc('mi_cuenta');
if(!error&&data&&!Array.isArray(data)){CU=data;localStorage.setItem('cuenta',JSON.stringify(CU));errC=''}
else errC='No se pudieron actualizar los datos de la cuenta.'+(error?' ('+String(error.message).slice(0,60)+')':'');
await traerCotC((CU&&CU.tipo_dolar)||'oficial');
pintarCuentaUI();
}
$('v-cuenta').onclick=async e=>{
const c=e.target.dataset.c;if(!c)return;
if(c==='ref')return pintarCuenta();
if(c==='copiar'){try{await navigator.clipboard.writeText(PAGO.alias);alert('Alias copiado: '+PAGO.alias)}catch(x){prompt('Copiá el alias:',PAGO.alias)}return}
if(c==='pague'){
const m=montoC(),campo=(CU&&CU.campo)||'',msg='Hola, soy '+perfil.email+' del campo "'+campo+'". Ya pagué la suscripción de Gasoil Campo'+(m?' ('+pesoC(m)+')':'')+'. Te mando el comprobante.';
if(PAGO.wa)window.open('https://wa.me/'+PAGO.wa+'?text='+encodeURIComponent(msg),'_blank');
else location.href='mailto:'+PAGO.mail+'?subject='+encodeURIComponent('Pago Gasoil Campo - '+campo)+'&body='+encodeURIComponent(msg);
return}
if(c==='act'){
if(sinRed())return;
try{await cargarPerfil({id:perfil.id})}catch(err){return alert('No se pudo actualizar: '+(err.message||err))}
if(perfil.bloq)return alert('Todavía figura sin activar. Si ya pagaste, mandanos el comprobante.');
mostrarApp();sync()}
};
                                                                                                                   
