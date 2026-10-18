let listaEq=[],sitios=[],stock={},eqLista=[],fSit='';
try{
listaEq=JSON.parse(localStorage.getItem('equipos')||'[]').map(x=>typeof x==='string'?{n:x,s:null}:x);
sitios=JSON.parse(localStorage.getItem('sitios')||'[]');
stock=JSON.parse(localStorage.getItem('stock')||'{}');
}catch(e){}
const nSit=id=>(sitios.find(x=>x.id===id)||{}).nombre||'';
const sinRed=()=>!navigator.onLine&&(alert('Necesitás señal para esto.'),true);
const litros=v=>v==null?'—':Math.round(v).toLocaleString('es-AR')+' L';

function pintarEq(){
const ss=$('sitioSel'),cur=ss.value||localStorage.getItem('sitio')||'';
$('sitioBox').classList.toggle('hide',!sitios.length);
ss.innerHTML='<option value="">— Elegí el campo —</option>'+sitios.map(s=>`<option value="${s.id}">${esc(s.nombre)}</option>`).join('');
ss.value=sitios.some(s=>s.id===cur)?cur:(sitios.length===1?sitios[0].id:'');
const sid=ss.value;
eqLista=[...new Set(listaEq.filter(e=>!e.s||e.s===sid).map(e=>e.n))];
const es=$('equipoSel'),ce=es.value,h=eqLista.length>0;
es.innerHTML='<option value="">— Elegí el equipo —</option>'+eqLista.map(n=>`<option>${esc(n)}</option>`).join('');
if(eqLista.includes(ce))es.value=ce;
es.classList.toggle('hide',!h);$('equipo').classList.toggle('hide',h);
$('listaEq').innerHTML=listaEq.map(e=>`<div class="row"><div><b>${esc(e.n)}</b><br><small>${e.s?esc(nSit(e.s)):'Todos los campos'}</small></div><button class="x" data-n="${esc(e.n)}" data-s="${e.s||''}">🗑</button></div>`).join('')||'<div class="st">Sin equipos: se escriben a mano.</div>';
pintarSitios();
}
function pintarSitios(){
$('listaSitios').innerHTML=sitios.map(s=>`<div class="row" style="display:block"><div style="display:flex;justify-content:space-between"><b>${esc(s.nombre)}</b><b>${litros(stock[s.id])}</b></div><div style="display:flex;gap:8px;margin-top:6px"><button class="chip" data-a="mas" data-s="${s.id}">＋ Cargar cisterna</button><button class="chip" data-a="fijar" data-s="${s.id}">Fijar stock</button><button class="x" data-a="del" data-s="${s.id}">🗑</button></div></div>`).join('')||'<div class="st">Todavía no hay campos.</div>';
const v=$('eqSitio').value;
$('eqSitio').innerHTML='<option value="">Todos los campos</option>'+sitios.map(s=>`<option value="${s.id}">${esc(s.nombre)}</option>`).join('');
$('eqSitio').value=v;
}
async function bajarSitios(){
const {data,error}=await sb.from('sitios').select('id,nombre').eq('campo_id',perfil.campo_id).order('nombre');
if(error)return;
sitios=data;localStorage.setItem('sitios',JSON.stringify(sitios));pintarEq();
}
async function bajarEquipos(){
const {data,error}=await sb.from('equipos').select('nombre,sitio_id').eq('campo_id',perfil.campo_id).order('nombre');
if(error)return;
listaEq=data.map(x=>({n:x.nombre,s:x.sitio_id}));localStorage.setItem('equipos',JSON.stringify(listaEq));pintarEq();
}
async function bajarStock(){
const {data,error}=await sb.rpc('stock_sitios');
if(error)return;
stock={};data.forEach(x=>stock[x.sitio_id]=+x.litros);localStorage.setItem('stock',JSON.stringify(stock));pintarSitios();bajarIngresos();
}
$('sitioSel').onchange=e=>{localStorage.setItem('sitio',e.target.value);pintarEq()};
$('addSitio').onclick=async()=>{
const n=$('nuevoSitio').value.trim();if(!n||sinRed())return;
const {error}=await sb.from('sitios').insert({campo_id:perfil.campo_id,nombre:n});
if(error)return alert('No se pudo agregar: '+(error.code==='23505'?'ya existe.':error.message));
$('nuevoSitio').value='';await bajarSitios();bajarStock();
};
$('listaSitios').onclick=async e=>{
const a=e.target.dataset.a,id=e.target.dataset.s;if(!a||sinRed())return;
if(a==='del'){
if(!confirm('¿Borrar el campo "'+nSit(id)+'"? Se borran también sus equipos.'))return;
const {error}=await sb.from('sitios').delete().eq('id',id);
if(error)return alert(error.code==='23503'?'No se puede borrar: ya tiene cargas.':error.message);
await bajarSitios();bajarEquipos();return;
}
const t=prompt(a==='mas'?'Litros que se cargan a la cisterna de '+nSit(id)+':':'Litros que hay AHORA en la cisterna de '+nSit(id)+':');
const n=parseFloat((t||'').replace(',','.'));
if(!(n>=0)||(a==='mas'&&n===0))return;
const l=a==='mas'?n:n-(stock[id]||0);
if(!l)return;
const {error}=await sb.from('ingresos').insert({sitio_id:id,campo_id:perfil.campo_id,litros:l});
if(error)return alert('No se pudo guardar: '+error.message);
bajarStock();
};
$('addEq').onclick=async()=>{
const n=$('nuevoEq').value.trim();if(!n||sinRed())return;
const {error}=await sb.from('equipos').insert({campo_id:perfil.campo_id,nombre:n,sitio_id:$('eqSitio').value||null});
if(error)return alert('No se pudo agregar: '+(error.code==='23505'?'ya existe.':error.message));
$('nuevoEq').value='';bajarEquipos();
};
$('listaEq').onclick=async e=>{
const n=e.target.dataset.n,s=e.target.dataset.s;
if(!n||!confirm('¿Quitar "'+n+'" de la lista?')||sinRed())return;
let q=sb.from('equipos').delete().eq('campo_id',perfil.campo_id).eq('nombre',n);
q=s?q.eq('sitio_id',s):q.is('sitio_id',null);
await q;bajarEquipos();
};

function porQuien(l){
const m={};l.forEach(r=>(m[r.quien]=m[r.quien]||[]).push(r));
return Object.entries(m).sort((a,b)=>sum(b[1])-sum(a[1])).map(([q,ls])=>{
const e={};ls.forEach(r=>{const k=r.eq+(r.sitio?' · '+nSit(r.sitio):'');(e[k]=e[k]||[]).push(r)});
return `<div class="row" style="display:block"><div style="display:flex;justify-content:space-between"><b>${esc(q)}</b><b>${sum(ls).toFixed(1)} L</b></div>`+Object.entries(e).map(([n,x])=>`<div class="st" style="display:flex;justify-content:space-between"><span>${esc(n)} · ${x.length} cargas${lph(x)}</span><span>${sum(x).toFixed(1)} L</span></div>`).join('')+'</div>';
}).join('')||'<div class="st">Sin datos.</div>';
}
function renderRes(){
const ms=[...new Set([new Date().toISOString().slice(0,7),...panel().map(r=>r.f.slice(0,7))])].sort().reverse();
$('mes').innerHTML=ms.map(m=>`<option ${m===mes?'selected':''}>${m}</option>`).join('');
$('fBox').classList.toggle('hide',!sitios.length);
$('fSitio').innerHTML='<option value="">Todos los campos</option>'+sitios.map(s=>`<option value="${s.id}" ${s.id===fSit?'selected':''}>${esc(s.nombre)}</option>`).join('');
$('stockBox').innerHTML=sitios.length?'<h3 style="margin-top:0">Cisternas (litros que quedan)</h3>'+sitios.map(s=>{const v=stock[s.id];return `<div class="row"><b>${esc(s.nombre)}</b><b style="font-size:20px;${v<=0?'color:#c62828':''}">${litros(v)}</b></div>`}).join(''):'';
const l=panel().filter(r=>r.f.startsWith(mes)&&(!fSit||r.sitio===fSit));
$('resTot').textContent=`${l.length} cargas · ${sum(l).toFixed(1)} L en el mes`;
$('porQ').innerHTML=porQuien(l);$('porLote').innerHTML=grupo(l,'lote','(sin lote)');pintarCargas(l);
}
$('fSitio').onchange=e=>{fSit=e.target.value;renderRes()};

let editSid='',ingr=[];
function pintarCargas(l){
const S=new Set(remoto.filas.map(x=>x.sid));
$('listaC').innerHTML=l.filter(r=>S.has(r.sid)).sort((a,b)=>b.f.localeCompare(a.f)).slice(0,40).map(r=>r.sid===editSid?
`<div class="row" style="display:block"><label style="margin-top:0">Litros</label><input id="eL" type="number" step="0.01" value="${r.l}"><label>Equipo</label><input id="eE" value="${esc(r.eq)}"><div class="two"><div><label>Horómetro</label><input id="eH" type="number" step="0.1" value="${r.h||''}"></div><div><label>Lote</label><input id="eT" value="${esc(r.lote)}"></div></div><label>Campo</label><select id="eS"><option value="">(sin campo)</option>${sitios.map(s=>`<option value="${s.id}" ${s.id===r.sitio?'selected':''}>${esc(s.nombre)}</option>`).join('')}</select><div style="display:flex;gap:8px;margin-top:10px"><button class="chip" data-c="g" data-i="${r.sid}">Guardar</button><button class="chip" data-c="c">Cancelar</button></div></div>`:
`<div class="row"><div style="flex:1"><b>${r.l} L</b> · ${esc(r.eq)}<br><small>${esc(r.quien)}${r.sitio?' · '+esc(nSit(r.sitio)):''} · ${fmtF(r.f)}${r.h?' · '+r.h+' hs':''}${r.lote?' · '+esc(r.lote):''}</small></div><button class="x" data-c="e" data-i="${r.sid}">✏️</button><button class="x" data-c="b" data-i="${r.sid}">🗑</button></div>`).join('')||'<div class="st">Sin cargas.</div>';
}
$('listaC').onclick=async e=>{
const c=e.target.dataset.c,i=e.target.dataset.i;if(!c)return;
if(c==='e'){editSid=i;return renderRes()}
if(c==='c'){editSid='';return renderRes()}
if(sinRed())return;
let r;
if(c==='b'){
if(!confirm('¿Borrar esta carga? El stock de la cisterna se recalcula.'))return;
r=await sb.from('cargas').delete().eq('sync_id',i).select('sync_id');
}else{
const l=parseFloat($('eL').value),eq=$('eE').value.trim();
if(!(l>0)||!eq)return alert('Litros y equipo son obligatorios.');
r=await sb.from('cargas').update({litros:l,maquina:eq,horometro:parseFloat($('eH').value)||null,lote:$('eT').value.trim()||null,sitio_id:$('eS').value||null}).eq('sync_id',i).select('sync_id');
}
if(r.error||!r.data.length)return alert('No se pudo: '+(r.error?r.error.message:'sin permiso o la carga ya no existe.'));
editSid='';await bajarPanel();await bajarStock();renderRes();
};
async function bajarIngresos(){
const {data,error}=await sb.from('ingresos').select('id,sitio_id,litros,created_at').order('created_at',{ascending:false}).limit(20);
if(error)return;ingr=data;pintarIng();
}
function pintarIng(){
$('listaIng').innerHTML=ingr.map(x=>`<div class="row"><div><b>${x.litros>0?'+':''}${Math.round(x.litros)} L</b> · ${esc(nSit(x.sitio_id))}<br><small>${fmtF(x.created_at)}</small></div><button class="x" data-m="${x.id}">🗑</button></div>`).join('')||'<div class="st">Sin movimientos.</div>';
}
$('listaIng').onclick=async e=>{
const id=e.target.dataset.m;if(!id||sinRed()||!confirm('¿Borrar este movimiento? El stock se recalcula.'))return;
const {data,error}=await sb.from('ingresos').delete().eq('id',id).select('id');
if(error||!data.length)return alert('No se pudo borrar.');
bajarStock();
};
  
