const $=id=>document.getElementById(id),K='gasoil_v2';
const SB_URL='https://wzozpqcsypdszueitpzo.supabase.co',SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6b3pwcWNzeXBkc3p1ZWl0cHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxODg0MzcsImV4cCI6MjEwNzc2NDQzN30.63xT-7SUAUdL4poVnemUFxSFBxBaVW7mRjgpMgZxBfk';
let sb=null;try{sb=supabase.createClient(SB_URL,SB_KEY)}catch(e){}
let recup=/type=recovery/.test(location.hash);
if(sb)sb.auth.onAuthStateChange(ev=>{if(ev==='PASSWORD_RECOVERY'){recup=true;show('nueva')}});
let regs=load(),thumb='',mes=new Date().toISOString().slice(0,7),perfil=null,pos=null,destino='litros',chipT='litros';
let remoto=JSON.parse(localStorage.getItem('remoto')||'null')||{filas:[],miembros:[]};
regs.forEach(r=>{if(!r.sid){r.sid=crypto.randomUUID();r.ok=0}});
function load(){try{return JSON.parse(localStorage.getItem(K))||[]}catch(e){return[]}}
function persist(){try{localStorage.setItem(K,JSON.stringify(regs));return true}catch(e){alert('No se pudo guardar: sin espacio.');return false}}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const st=t=>$('st').textContent=t;
function nowLocal(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)}
const fmtF=f=>new Date(f).toLocaleString('es-AR',{dateStyle:'short',timeStyle:'short'});
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>show(b.dataset.v));
function show(v){
document.querySelectorAll('section').forEach(s=>s.classList.toggle('hide',s.id!=='v-'+v));
document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
if(v==='plat')pintarPlat();
if(v==='cuenta')pintarCuenta();
if(v==='resumen'){renderRes();sync().then(renderRes)} if(v==='datos'){renderInfo();sync().then(renderInfo)}
}
function openForm(){
$('form').classList.remove('hide');
['litros','equipo','horo','lote','equipoSel'].forEach(i=>$(i).value='');pintarEq();
$('chips').innerHTML='';st('');$('fecha').value=nowLocal();
pos=null;if(navigator.geolocation)navigator.geolocation.getCurrentPosition(p=>pos={lat:p.coords.latitude,lng:p.coords.longitude},()=>{},{timeout:8000,maximumAge:600000});
}
$('btnFoto').onclick=()=>$('file').click();
$('sinFoto').onclick=()=>{thumb='';openForm();$('prev').classList.add('hide');$('form').scrollIntoView({behavior:'smooth'})};
$('file').onchange=async e=>{
const f=e.target.files[0]; if(!f) return; e.target.value='';
const d=destino;destino='litros';
if(d==='litros')openForm();
const img=new Image(); img.src=URL.createObjectURL(f);
await img.decode().catch(()=>{});
if(d==='litros'){thumb=draw(img,240,false).toDataURL('image/jpeg',0.6);
$('prev').src=thumb;$('prev').classList.remove('hide');
$('form').scrollIntoView({behavior:'smooth'});}
leer(img,d);
};
function draw(img,max,enhance){
const s=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');
c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
const x=c.getContext('2d');x.drawImage(img,0,0,c.width,c.height);
if(!enhance)return c;
const d=x.getImageData(0,0,c.width,c.height),p=d.data;
for(let i=0;i<p.length;i+=4){let g=.3*p[i]+.59*p[i+1]+.11*p[i+2];g=g>128?Math.min(255,g*1.3):g*.7;p[i]=p[i+1]=p[i+2]=g}
x.putImageData(d,0,0);
const m=40,o=document.createElement('canvas');o.width=c.width+2*m;o.height=c.height+2*m;
const y=o.getContext('2d');y.fillStyle='#fff';y.fillRect(0,0,o.width,o.height);y.drawImage(c,m,m);
return o;
}
async function ocrTexto(cs){
if(!window.Tesseract) throw new Error('sin motor');
const w=await Tesseract.createWorker('eng');
await w.setParameters({tessedit_char_whitelist:'0123456789.,',tessedit_pageseg_mode:'11'});
let t='';
for(const c of [].concat(cs)){t+='\n'+(await w.recognize(c)).data.text}
await w.terminate();
return t;
}
async function leer(img,d){
const h=d==='horo',tg=h?'horo':'litros';chipT=tg;
st('Leyendo números…');
try{
const t=await ocrTexto([draw(img,900,true),draw(img,450,true)]);
const nums=[...new Set((t.match(/\d+[.,]\d+|\d{2,}/g)||[]).map(s=>parseFloat(s.replace(',','.'))).filter(v=>v>0&&v<(h?100000:5000)))];
if(!nums.length){st('No pude leer números. Cargá los litros a mano.');return}
$(tg).value=h?Math.max(...nums):(nums.find(v=>!Number.isInteger(v))??nums[0]);
$('chips').innerHTML=nums.slice(0,8).map(v=>`<button class="chip" data-v="${v}">${v}</button>`).join('');
st('Revisá: tocá otro número si el de '+(h?'horómetro':'litros')+' es otro.');
}catch(e){st('OCR no disponible (preparalo en Datos con internet). Cargá los litros a mano.')}
}
$('chips').onclick=e=>{if(e.target.dataset.v)$(chipT).value=e.target.dataset.v};
$('leerH').onclick=()=>{destino='horo';$('file').click()};
$('cancel').onclick=()=>$('form').classList.add('hide');
$('guardar').onclick=()=>{
const l=parseFloat($('litros').value),eq=eqLista.length?$('equipoSel').value:$('equipo').value.trim();
if(!(l>0)) return alert('Falta cargar los litros.');
if(!eq) return alert('Falta el equipo.');
if(sitios.length&&!$('sitioSel').value)return alert('Elegí el campo.');
regs.push({id:Date.now(),sid:crypto.randomUUID(),ok:0,sitio_id:$('sitioSel').value||null,eq,l,h:parseFloat($('horo').value)||0,lote:$('lote').value.trim(),f:$('fecha').value||nowLocal(),img:thumb,lat:pos&&pos.lat,lng:pos&&pos.lng});
if(!persist()){regs.pop();return}
$('form').classList.add('hide');render();sync();
};
let mias=[];try{mias=JSON.parse(localStorage.getItem('mias')||'[]')}catch(e){}
function historial(){
const lo=new Map(regs.map(r=>[r.sid,r])),m=new Map(),ok=localStorage.getItem('miasOk');
if(ok)mias.forEach(r=>m.set(r.sid,{...r,img:(lo.get(r.sid)||{}).img}));
regs.forEach(r=>{if(!m.has(r.sid)&&(!r.ok||!ok))m.set(r.sid,r)});
return [...m.values()].sort((a,b)=>b.f.localeCompare(a.f)).slice(0,30);
}
async function bajarMias(){
const {data,error}=await sb.from('cargas').select('sync_id,maquina,litros,horometro,lote,created_at').eq('user_id',perfil.id).order('created_at',{ascending:false}).limit(100);
if(error)return;
mias=data.map(r=>({sid:r.sync_id,eq:r.maquina,l:+r.litros,h:+r.horometro||0,lote:r.lote||'',f:loc(r.created_at),ok:1}));
localStorage.setItem('mias',JSON.stringify(mias));localStorage.setItem('miasOk','1');
regs=regs.filter(r=>!r.ok||mias.some(m=>m.sid===r.sid));persist();
}
function render(){
const opt=a=>[...new Set(a.filter(Boolean))].map(e=>`<option value="${esc(e)}">`).join('');
$('equipos').innerHTML=opt(regs.map(r=>r.eq));$('lotes').innerHTML=opt(regs.map(r=>r.lote));
const rec=historial();
$('lista').innerHTML=rec.length?rec.map(r=>`<div class="row">${r.img?`<img src="${r.img}">`:''}<div style="flex:1"><b>${r.l} L</b> · ${esc(r.eq)}<br><small>${fmtF(r.f)}${r.h?' · '+r.h+' hs':''}${r.lote?' · '+esc(r.lote):''}${r.ok?' · ✔ guardada':' · ⏳ sin subir'}</small></div>${r.ok?'':`<button class="x" data-d="${r.id}">🗑</button>`}</div>`).join(''):'<div class="st">Todavía no hay cargas.</div>';
}
$('lista').onclick=e=>{const id=e.target.dataset.d;if(id&&confirm('¿Borrar esta carga?')){regs=regs.filter(r=>r.id!=id);persist();render()}};
function lph(list){
const c=list.filter(r=>r.h>0).sort((a,b)=>a.h-b.h);if(c.length<2)return '';
const d=c[c.length-1].h-c[0].h;if(d<=0)return '';
return ' · '+(c.slice(1).reduce((a,r)=>a+r.l,0)/d).toFixed(1)+' L/h';
}
function grupo(list,k,vacio){
const m={};list.forEach(r=>(m[r[k]||vacio]=m[r[k]||vacio]||[]).push(r));
return Object.entries(m).sort((a,b)=>sum(b[1])-sum(a[1])).map(([n,l])=>`<div class="row"><div><b>${esc(n)}</b><br><small>${l.length} cargas${k==='eq'?lph(l):''}</small></div><b>${sum(l).toFixed(1)} L</b></div>`).join('')||'<div class="st">Sin datos.</div>';
}
const sum=l=>l.reduce((a,r)=>a+r.l,0);
$('mes').onchange=e=>{mes=e.target.value;renderRes()};
function bajar(texto,tipo,nombre){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([texto],{type:tipo}));a.download=nombre;a.click()}
$('exp').onclick=()=>bajar(JSON.stringify(regs),'application/json','gasoil-backup-'+nowLocal().slice(0,10)+'.json');
$('imp2').onclick=()=>$('imp').click();
$('imp').onchange=async e=>{
const f=e.target.files[0];e.target.value='';if(!f)return;
try{const a=JSON.parse(await f.text());if(!Array.isArray(a))throw 0;
const ids=new Set(regs.map(r=>r.id));let n=0;
a.forEach(r=>{if(r&&r.id&&r.l&&r.eq&&!ids.has(r.id)){r.sid=r.sid||crypto.randomUUID();r.ok=0;regs.push(r);n++}});
persist();render();alert(n+' cargas importadas.')}catch(x){alert('Archivo inválido.')}
};
/*XLSX_START*/
const crcT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=u=>{let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=crcT[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0};
function zipU8(files){
const te=new TextEncoder(),parts=[],cen=[];let off=0;
files.forEach(([name,text])=>{
const nb=te.encode(name),d=te.encode(text),crc=crc32(d);
const lh=new DataView(new ArrayBuffer(30));
lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(8,0,true);lh.setUint16(10,0,true);lh.setUint16(12,0x21,true);lh.setUint32(14,crc,true);lh.setUint32(18,d.length,true);lh.setUint32(22,d.length,true);lh.setUint16(26,nb.length,true);lh.setUint16(28,0,true);
parts.push(new Uint8Array(lh.buffer),nb,d);
const ch=new DataView(new ArrayBuffer(46));
ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(10,0,true);ch.setUint16(12,0,true);ch.setUint16(14,0x21,true);ch.setUint32(16,crc,true);ch.setUint32(20,d.length,true);ch.setUint32(24,d.length,true);ch.setUint16(28,nb.length,true);ch.setUint16(30,0,true);ch.setUint16(32,0,true);ch.setUint16(34,0,true);ch.setUint16(36,0,true);ch.setUint32(38,0,true);ch.setUint32(42,off,true);
cen.push(new Uint8Array(ch.buffer),nb);
off+=30+nb.length+d.length;
});
const cs=cen.reduce((a,x)=>a+x.length,0),en=new DataView(new ArrayBuffer(22));
en.setUint32(0,0x06054b50,true);en.setUint16(4,0,true);en.setUint16(6,0,true);en.setUint16(8,files.length,true);en.setUint16(10,files.length,true);en.setUint32(12,cs,true);en.setUint32(16,off,true);en.setUint16(20,0,true);
const all=parts.concat(cen,[new Uint8Array(en.buffer)]),out=new Uint8Array(all.reduce((a,x)=>a+x.length,0));
let p=0;all.forEach(x=>{out.set(x,p);p+=x.length});return out;
}
const xe=s=>String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const serialXl=f=>{const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(f);return m?(Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5])-Date.UTC(1899,11,30))/864e5:null};
function armarXlsx(filas,tot){
const C=['A','B','C','D','E','F','G'],hd=['Fecha','Equipo','Litros','Horómetro','Lote','Maquinista','Campo'];
const sc=(r,c,t,s)=>`<c r="${C[c]}${r}" t="inlineStr"${s?` s="${s}"`:''}><is><t xml:space="preserve">${xe(t)}</t></is></c>`;
const nc=(r,c,v,s)=>`<c r="${C[c]}${r}" s="${s}"><v>${v}</v></c>`;
let rows=`<row r="1">${hd.map((h,i)=>sc(1,i,h,1)).join('')}</row>`;
filas.forEach((x,i)=>{const r=i+2,sr=serialXl(x.f);
rows+=`<row r="${r}">${sr==null?sc(r,0,x.f):nc(r,0,sr,2)}${sc(r,1,x.eq)}${nc(r,2,+x.l,3)}${x.h?nc(r,3,+x.h,4):''}${x.lote?sc(r,4,x.lote):''}${x.quien?sc(r,5,x.quien):''}${x.sitioN?sc(r,6,x.sitioN):''}</row>`});
const t=filas.length+2;
rows+=`<row r="${t}">${sc(t,0,'TOTAL',5)}<c r="C${t}" s="6"><f>SUM(C2:C${t-1})</f><v>${tot}</v></c></row>`;
const H='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main',RL='http://schemas.openxmlformats.org/officeDocument/2006/relationships',PK='http://schemas.openxmlformats.org/package/2006/relationships';
const sheet=H+`<worksheet xmlns="${NS}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="18" customWidth="1"/><col min="2" max="2" width="24" customWidth="1"/><col min="3" max="3" width="12" customWidth="1"/><col min="4" max="4" width="12" customWidth="1"/><col min="5" max="5" width="20" customWidth="1"/><col min="6" max="6" width="22" customWidth="1"/><col min="7" max="7" width="20" customWidth="1"/></cols><sheetData>${rows}</sheetData></worksheet>`;
const styles=H+`<styleSheet xmlns="${NS}"><numFmts count="3"><numFmt numFmtId="164" formatCode="dd/mm/yyyy hh:mm"/><numFmt numFmtId="165" formatCode="#,##0.00"/><numFmt numFmtId="166" formatCode="0.0"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9EAD3"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="165" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
return zipU8([
['[Content_Types].xml',H+`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
['_rels/.rels',H+`<Relationships xmlns="${PK}"><Relationship Id="rId1" Type="${RL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
['xl/workbook.xml',H+`<workbook xmlns="${NS}" xmlns:r="${RL}"><sheets><sheet name="Cargas" sheetId="1" r:id="rId1"/></sheets></workbook>`],
['xl/_rels/workbook.xml.rels',H+`<Relationships xmlns="${PK}"><Relationship Id="rId1" Type="${RL}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${RL}/styles" Target="styles.xml"/></Relationships>`],
['xl/styles.xml',styles],
['xl/worksheets/sheet1.xml',sheet]]);
}
function bajarBin(u8,tipo,nombre){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([u8],{type:tipo}));a.download=nombre;a.click()}
/*XLSX_END*/
if($('xPer')){
$('xMes').value=nowLocal().slice(0,7);
$('xPer').options[0].textContent='Este mes ('+nowLocal().slice(0,7)+')';
$('xPer').onchange=()=>$('xMes').classList.toggle('hide',$('xPer').value!=='otro');
const rangoMes=m=>{const [y,n]=m.split('-').map(Number);return [new Date(y,n-1,1).toISOString(),new Date(y,n,1).toISOString()]};
const cargasDe=async m=>{
if(navigator.onLine&&sb){
try{
await sync();
const quien=Object.fromEntries((remoto.miembros||[]).filter(x=>x&&x.id).map(x=>[x.id,(x.nombre||x.email.split('@')[0])+(x.baja?' (baja)':'')]));
let out=[],from=0;
for(;;){
let q=sb.from('cargas').select('maquina,litros,horometro,lote,created_at,user_id,sitio_id').eq('campo_id',perfil.campo_id).order('created_at',{ascending:true}).order('sync_id').range(from,from+999);
if(m){const [d,h]=rangoMes(m);q=q.gte('created_at',d).lt('created_at',h)}
const {data,error}=await q;
if(error)throw error;
out=out.concat(data);
if(data.length<1000)break;
from+=1000;
}
return {filas:out.map(r=>({f:loc(r.created_at),eq:r.maquina,l:+r.litros,h:+r.horometro||0,lote:r.lote||'',quien:quien[r.user_id]||'',sitio:r.sitio_id})),local:false};
}catch(e){}
}
return {filas:panel().filter(r=>!m||r.f.startsWith(m)).map(r=>({f:r.f,eq:r.eq,l:r.l,h:r.h,lote:r.lote||'',quien:r.quien||'',sitio:r.sitio})),local:true};
};
$('csv').onclick=async()=>{
const per=$('xPer').value,m=per==='mes'?nowLocal().slice(0,7):per==='otro'?$('xMes').value:'';
if(per==='otro'&&!m)return $('xSt').textContent='Elegí el mes.';
$('xSt').textContent='Preparando…';
const {filas,local}=await cargasDe(m);
if(!filas.length)return $('xSt').textContent='No hay cargas en ese período.';
filas.sort((a,b)=>a.f.localeCompare(b.f));
const tot=Math.round(filas.reduce((a,r)=>a+r.l,0)*100)/100;
filas.forEach(r=>{r.sitioN=r.sitio?nSit(r.sitio):''});
bajarBin(armarXlsx(filas,tot),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','gasoil-'+(m||'historial-'+nowLocal().slice(0,10))+'.xlsx');
$('xSt').textContent=filas.length+' cargas · '+tot.toLocaleString('es-AR')+' L en total'+(local?' (sin señal: solo lo que hay en este celular)':'');
};
}
$('prep').onclick=async()=>{
if(!navigator.onLine) return $('ocrst').textContent='Necesitás internet para este paso.';
$('ocrst').textContent='Descargando motor… puede tardar un minuto.';
try{
const c=document.createElement('canvas');c.width=260;c.height=90;const x=c.getContext('2d');
x.fillStyle='#fff';x.fillRect(0,0,260,90);x.fillStyle='#000';x.font='bold 56px sans-serif';x.fillText('123.4',14,68);
await ocrTexto(c);localStorage.setItem('ocr_ok','1');$('ocrst').textContent='Listo ✔ El OCR ya debería andar sin internet.';
}catch(e){$('ocrst').textContent='No se pudo descargar. Probá de nuevo con mejor señal.'}
};
function renderInfo(){
if(perfil&&perfil.rol==='ADMIN')$('campoInfo').innerHTML=`Campo: <b>${esc(perfil.campo||'')}</b><br>Código para tus maquinistas: <b style="font-size:22px">${esc(perfil.code||'')}</b><br>Usuarios activos: ${remoto.miembros.filter(x=>x&&!x.baja).length}/${perfil.max||3}${pintarMiembros()||''}`;
$('ocrst').textContent=localStorage.getItem('ocr_ok')?'Listo ✔ El OCR ya debería andar sin internet.':'';
$('info').textContent=`${regs.length} cargas guardadas en este celular. Si borrás los datos del navegador, se pierden: hacé backup seguido.`;
}
const aMsg=t=>$('aMsg').textContent=t;
let errSync='';
const loc=d=>{const x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,16)};
function panel(){const s=new Set(remoto.filas.map(r=>r.sid));return remoto.filas.concat(regs.filter(r=>!s.has(r.sid)).map(r=>({...r,quien:perfil?perfil.email.split('@')[0]:'yo',sitio:r.sitio_id})))}
async function cargarPerfil(u){
const {data,error}=await sb.from('profiles').select('id,email,rol,campo_id,invite_code,baja,es_dueno,campos!campo_id(nombre,max_devices)').eq('id',u.id).single();
if(error)throw error;
if(data.baja)throw new Error('El patrón dio de baja tu acceso.');
if(!data.campos){
if(data.rol!=='ADMIN')throw new Error('Tu cuenta está vencida o suspendida. Consultá con quien te dio la app.');
perfil={bloq:true,dueno:!!data.es_dueno,id:data.id,email:data.email,rol:data.rol,campo_id:data.campo_id,code:data.invite_code,campo:'',max:0};
localStorage.setItem('perfil',JSON.stringify(perfil));return;
}
perfil={bloq:false,dueno:!!data.es_dueno,id:data.id,email:data.email,rol:data.rol,campo_id:data.campo_id,code:data.invite_code,campo:data.campos&&data.campos.nombre,max:data.campos&&data.campos.max_devices};
localStorage.setItem('perfil',JSON.stringify(perfil));
}
async function iniciar(u){
await cargarPerfil(u);mostrarApp();sync();
if(navigator.onLine&&!perfil.bloq&&!localStorage.getItem('ocr_ok'))$('prep').click();
}
$('aIng').onclick=async()=>{
if(!sb)return aMsg('No cargó el servidor. Abrí la app con señal.');
aMsg('In
