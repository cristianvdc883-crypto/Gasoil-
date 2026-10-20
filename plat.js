async function pintarPlat(){
if(!perfil||!perfil.dueno||!navigator.onLine)return;
const [a,b]=await Promise.all([sb.rpc('dueno_clientes'),sb.rpc('dueno_codigos')]);
if(a.error||b.error)return alert('No se pudo cargar: '+(a.error||b.error).message);
$('pCodigos').innerHTML=b.data.map(c=>`<div class="row"><div><b style="font-size:18px">${esc(c.codigo)}</b><br><small>${c.max_devices} usuarios · ${c.dias?c.dias+' días':'sin vencimiento'}</small></div><button class="chip" data-k="${esc(c.codigo)}">Copiar</button></div>`).join('')||'<div class="st">No hay códigos sin usar.</div>';
$('pClientes').innerHTML=a.data.map(c=>`<div class="row" style="display:block"><div style="display:flex;justify-content:space-between"><b>${esc(c.nombre)}</b><small>${c.activo?'activo':'SUSPENDIDO'}</small></div><small>${esc(c.patron||'')} · ${c.usuarios}/${c.max_devices} usuarios · ${c.vence?'vence '+c.vence:'sin vencimiento'}</small><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px"><button class="chip" data-a="${c.activo?'suspender':'reactivar'}" data-c="${c.campo_id}">${c.activo?'Suspender':'Reactivar'}</button><button class="chip" data-a="dias" data-c="${c.campo_id}">＋ Días</button><button class="chip" data-a="usuarios" data-c="${c.campo_id}">Usuarios</button></div></div>`).join('')||'<div class="st">Todavía no hay clientes.</div>';
}
$('pCrear').onclick=async()=>{
if(sinRed())return;
const {data,error}=await sb.rpc('dueno_crear_codigo',{p_max:parseInt($('pMax').value),p_dias:parseInt($('pDias').value)||0});
if(error)return alert('No se pudo: '+error.message);
try{await navigator.clipboard.writeText(data)}catch(e){}
alert('Código creado: '+data);pintarPlat();
};
$('pCodigos').onclick=async e=>{
const k=e.target.dataset.k;if(!k)return;
try{await navigator.clipboard.writeText(k);alert('Copiado: '+k)}catch(x){prompt('Copiá el código:',k)}
};
$('pClientes').onclick=async e=>{
const a=e.target.dataset.a,c=e.target.dataset.c;if(!a||sinRed())return;
let v=null;
if(a==='dias'){v=parseInt(prompt('¿Cuántos días sumar a la suscripción?','30'));if(!(v>0))return}
if(a==='usuarios'){v=parseInt(prompt('Cantidad máxima de usuarios:','3'));if(!(v>0))return}
if(a==='suspender'&&!confirm('¿Suspender este cliente? Nadie de su campo podrá usar la app.'))return;
const {error}=await sb.rpc('dueno_cliente',{p_id:c,p_accion:a,p_valor:v});
if(error)return alert('No se pudo: '+error.message);
pintarPlat();
};
  
