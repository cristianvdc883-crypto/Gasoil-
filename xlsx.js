// Generador de archivos Excel (.xlsx) para la exportación
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
