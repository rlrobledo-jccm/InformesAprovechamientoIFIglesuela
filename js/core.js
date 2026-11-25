// ===== Núcleo: tablas IFN3, cálculo y generación del Word =====
var CDS=[10,15,20,25,30,35,40,45,50,55,60,65,70];
var ESPECIES={
  Pinaster:{nombre:'Pinus pinaster',p:0.0004474,q:2.01474,r:0.87153,fuente:'IFN3 Toledo',
    h:{10:[null,5.88,6.75,6.10,null,null,6.12],15:[null,8.72,7.80,6.60,4.50,null,8.51],20:[null,10.02,8.37,8.80,8.50,null,9.85],25:[null,11.48,8.99,9.00,9.00,null,11.34],30:[null,13.02,10.84,11.50,null,null,12.91],35:[null,14.20,14.85,null,null,null,14.23],40:[19.25,15.19,14.50,null,null,null,15.26],45:[null,15.82,12.38,10.50,null,null,15.53],50:[19.50,16.50,null,null,null,null,16.68]}},
  Pinea:{nombre:'Pinus pinea',p:0.001618,q:1.7209,r:1.02968,fuente:'IFN3 Toledo',
    h:{10:[null,4.07,5.50,null,null,null,4.39],15:[null,5.62,6.50,6.00,null,null,5.77],20:[null,6.65,7.14,null,null,null,6.81],25:[null,7.87,8.44,5.90,null,null,7.89],30:[null,8.93,9.94,null,null,null,9.11],35:[null,9.81,10.02,null,null,null,9.83],40:[null,11.12,11.62,null,null,null,11.21],45:[null,11.79,9.67,null,null,null,11.65],50:[null,14.37,17.50,null,null,null,14.50],55:[null,14.59,16.30,null,null,null,14.69],60:[null,15.25,null,null,null,null,15.25],70:[null,19.82,8.60,null,null,null,17.95]}},
  Halepensis:{nombre:'Pinus halepensis',p:0.0011788,q:1.89153,r:0.71216,fuente:'IFN3 Cuenca',
    h:{10:[null,5.96,5.86,5.10,4.00,null,5.91],15:[null,7.74,7.37,5.48,6.50,null,7.62],20:[null,9.04,8.66,8.75,7.50,null,8.95],25:[null,10.24,9.66,7.94,7.25,null,10.07],30:[null,11.22,10.42,7.80,7.83,null,10.96],35:[null,11.79,11.58,8.50,null,null,11.72],40:[null,12.50,12.24,7.50,9.50,null,12.33],45:[null,13.37,13.06,12.50,null,null,13.30],50:[null,14.23,12.97,null,null,null,13.74],55:[null,14.67,14.50,null,null,null,14.62],60:[null,15.53,null,null,null,null,15.53]}}
};
// Clases del informe: <20, 20-24, ..., 45-49, >=50  -> índices de CDS
var GRUPOS=[[0,1],[2],[3],[4],[5],[6],[7],[8,9,10,11,12]];
var MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function num(v){if(v===null||v===undefined||v==='')return 0;var n=parseFloat(String(v).replace(',','.'));return isFinite(n)?n:0;}
function alturaIFN(esp,cd,cal){
  var e=ESPECIES[esp];if(!e)return null;var row=e.h[cd];if(!row)return null;
  var i=(cal==='Todas'||!cal)?6:(parseInt(cal,10)-1);var v=row[i];
  if(v===null||v===undefined)v=row[6];return v===undefined?null:v;
}
function nuevaEspecie(){return {esp:'',d:'',disp:'Cuadrada',cal:'Todas',pct:CDS.map(function(){return '';}),ext:CDS.map(function(){return '';}),hm:CDS.map(function(){return '';})};}

// Cálculo de una especie. A = superficie total (ha)
function calcEspecie(s,A){
  var e=ESPECIES[s.esp];var d=num(s.d);
  var r={ok:false,N:0,filas:[],Vha:0,Gha:0,Vext_ha:0,Next_ha:0,Nrem_ha:0,sumPct:0,avisos:[]};
  if(!e||d<=0)return r;
  var sup=s.disp==='Tresbolillo'?d*d*Math.sqrt(3)/2:d*d;r.N=10000/sup;
  CDS.forEach(function(cd,i){
    var pct=num(s.pct[i])/100,ex=Math.min(Math.max(num(s.ext[i])/100,0),1);
    var hm=num(s.hm[i]);var h=hm>0?hm:alturaIFN(s.esp,cd,s.cal);
    var n=r.N*pct;var dmm=cd*10;
    var v=(h&&h>0)?e.p*Math.pow(dmm,e.q)*Math.pow(h,e.r)/1000:0;
    if(pct>0&&!(h>0))r.avisos.push('CD '+cd+': sin altura en el IFN3, indica la altura medida');
    var f={cd:cd,pct:pct,n:n,h:h,v:v,ext:ex,next:n*ex,vext:n*ex*v};
    r.filas.push(f);r.sumPct+=pct;r.Vha+=n*v;r.Gha+=n*Math.PI*Math.pow(dmm/2000,2);r.Vext_ha+=f.vext;r.Next_ha+=f.next;r.Nrem_ha+=n-f.next;
  });
  if(Math.abs(r.sumPct-1)>0.001)r.avisos.unshift('Los % de pies suman '+(r.sumPct*100).toFixed(1).replace('.',',')+' % (deben sumar 100 %)');
  r.A=A;r.Vtot=r.Vha*A;r.Vext=r.Vext_ha*A;r.Next=r.Next_ha*A;
  r.grupos=GRUPOS.map(function(g){
    var n=0,v=0,hn=0;g.forEach(function(i){var f=r.filas[i];n+=f.next;v+=f.vext;hn+=f.next*(f.h||0);});
    return {n:n*A,h:n>0?hn/n:0,v:v*A};
  });
  var tn=0,thn=0;r.filas.forEach(function(f){tn+=f.next;thn+=f.next*(f.h||0);});r.hExt=tn>0?thn/tn:0;
  r.ok=true;return r;
}
function supTotal(sol){return sol.parcels.reduce(function(a,p){return a+num(p.sup);},0);}

function fmt(n,dec){if(n===null||n===undefined||!isFinite(n))return '';return Number(n).toLocaleString('es-ES',{minimumFractionDigits:dec,maximumFractionDigits:dec});}

// ---------- ZIP (sin compresión) ----------
var CRC_T=(function(){var t=new Uint32Array(256);for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(b){var c=0xFFFFFFFF;for(var i=0;i<b.length;i++)c=CRC_T[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function zipStore(files){ // files: [{name, data:Uint8Array}]
  var enc=new TextEncoder(),parts=[],central=[],off=0;
  files.forEach(function(f){
    var nm=enc.encode(f.name),crc=crc32(f.data),sz=f.data.length;
    var h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);
    h.setUint16(10,0,true);h.setUint16(12,0x5A21,true);h.setUint32(14,crc,true);h.setUint32(18,sz,true);h.setUint32(22,sz,true);
    h.setUint16(26,nm.length,true);h.setUint16(28,0,true);
    parts.push(new Uint8Array(h.buffer),nm,f.data);
    var c=new DataView(new ArrayBuffer(46));
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);
    c.setUint16(12,0,true);c.setUint16(14,0x5A21,true);c.setUint32(16,crc,true);c.setUint32(20,sz,true);c.setUint32(24,sz,true);
    c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    central.push(new Uint8Array(c.buffer),nm);
    off+=30+nm.length+sz;
  });
  var csz=central.reduce(function(a,b){return a+b.length;},0);
  var e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);
  e.setUint32(12,csz,true);e.setUint32(16,off,true);
  var all=parts.concat(central,[new Uint8Array(e.buffer)]),tot=all.reduce(function(a,b){return a+b.length;},0),out=new Uint8Array(tot),p=0;
  all.forEach(function(b){out.set(b,p);p+=b.length;});return out;
}
function b64bytes(s){var bin=atob(s),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;}
function xesc(s){return String(s===null||s===undefined?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// ---------- Valores del informe ----------
function valoresInforme(sol,P){ // P = array de parcelas del KML
  var v={},f=sol.f||{},cb=sol.cb||{};Object.keys(f).forEach(function(k){v[k]=f[k];});
  var A=supTotal(sol);v.superficie=fmt(A,2);v.exp=f.exp||'';
  var res=sol.sp.map(function(s){return calcEspecie(s,A);});
  [0,1].forEach(function(k){var s=sol.sp[k],r=res[k],c=k===0?1:5;
    if(r&&r.ok){v['esp'+(k+1)]=ESPECIES[s.esp].nombre;v['esp'+(k+1)+'_pies']=fmt(r.N,0);
      r.grupos.forEach(function(g,gi){if(g.n>0.5){v['md'+gi+'_'+c]=ESPECIES[s.esp].nombre;v['md'+gi+'_'+(c+1)]=fmt(g.n,0);v['md'+gi+'_'+(c+2)]=fmt(g.h,1);v['md'+gi+'_'+(c+3)]=fmt(g.v,2);}});
      v['md8_'+c]=ESPECIES[s.esp].nombre;v['md8_'+(c+1)]=fmt(r.Next,0);v['md8_'+(c+2)]=fmt(r.hExt,1);v['md8_'+(c+3)]=fmt(r.Vext,2);
    }});
  if(!f.fin_pies){var rem=0,any=false;res.forEach(function(r){if(r&&r.ok){rem+=r.Nrem_ha;any=true;}});if(any)v.fin_pies=fmt(rem,0);}
  // fecha
  if(f.fecha){var p=f.fecha.split('-');v.anio=p[0];v.mes=MESES[parseInt(p[1],10)-1];v.dia=String(parseInt(p[2],10));}
  if(!v.lugar)v.lugar='______________';if(!v.dia)v.dia='__';if(!v.mes)v.mes='___________';if(!v.anio)v.anio='____';
  if(!v.agente)v.agente='_____________________________';
  // rejillas
  var g=sol.g||{};
  function grid(pre,rows,cols,tot,sumCols){var d=g[pre]||[];var sums={};
    for(var r=0;r<rows;r++)for(var c=0;c<cols.length;c++){var val=(d[r]||[])[c]||'';v[pre+r+'_'+cols[c]]=val;if(sumCols.indexOf(cols[c])>=0)sums[cols[c]]=(sums[cols[c]]||0)+num(val);}
    sumCols.forEach(function(c){if(sums[c])v[tot+c]=fmt(sums[c],c===1&&pre==='de'?2:0).replace(/^0$/,'');});}
  grid('le',5,[0,1,2,3,4,5],'lt0_',[1,2,3,4]);grid('re',4,[1,2,3,4,5,6],'re4_',[1,2,4,5]);
  grid('co',6,[1,2,3,4,5,6],'co6_',[1,2,4,5]);grid('de',3,[0,1,2],'dt0_',[1]);
  v._cb=cb;v._res=res;v._A=A;
  // localización
  var r1=res[0],r2=res[1];
  v._loc=sol.parcels.map(function(pp){var q=P[pp.i];var s=num(pp.sup);var vol=0;
    if(r1&&r1.ok)vol+=r1.Vext_ha*s;if(r2&&r2.ok)vol+=r2.Vext_ha*s;
    var obs=[];if(vol>0)obs.push('Vol. a extraer: '+fmt(vol,2)+' m³');if(pp.obs)obs.push(pp.obs);
    return {pol:String(parseInt(q[0],10)),par:String(parseInt(q[1],10)),rec:pp.rec||'',sup:fmt(s,2),x:fmt(q[4],0),y:fmt(q[5],0),obs:obs.join('. ')};});
  return v;
}

function buildDocx(TPL,sol,P,img){ // img: {bytes:Uint8Array,w,h} o null
  var v=valoresInforme(sol,P);var enc=new TextEncoder();
  var xml=TPL['word/document.xml'].t;
  // filas de localización (mínimo 3)
  var i0=xml.indexOf('{{L_pol}}');var a=xml.lastIndexOf('<w:tr ',i0),b=xml.indexOf('</w:tr>',i0)+7;var row=xml.slice(a,b);
  var locs=v._loc.slice();while(locs.length<3)locs.push({pol:'',par:'',rec:'',sup:'',x:'',y:'',obs:''});
  var rows=locs.map(function(l){return row.replace(/\{\{L_(\w+)\}\}/g,function(m,k){return xesc(l[k]);});}).join('');
  xml=xml.slice(0,a)+rows+xml.slice(b);
  // casillas
  xml=xml.replace(/\{\{cb_(\w+)\}\}/g,function(m,k){return v._cb[k]?'1':'0';});
  // croquis
  var rels=TPL['word/_rels/document.xml.rels'].t,files=[];
  if(img){
    var cx=6120000,cy=Math.round(cx*img.h/img.w);
    var dr='<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="'+cx+'" cy="'+cy+'"/><wp:docPr id="9001" name="Croquis"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="9001" name="croquis.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdCroquis"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
    xml=xml.replace('<w:r><w:t>{{CROQUIS}}</w:t></w:r>',dr);
    rels=rels.replace('</Relationships>','<Relationship Id="rIdCroquis" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/croquis.jpg"/></Relationships>');
    files.push({name:'word/media/croquis.jpg',data:img.bytes});
    v.croquis_pie='Superficie quemada a aprovechar (rojo) sobre ortofoto PNOA máxima actualidad © IGN-CNIG. Superficie total: '+fmt(v._A,2)+' ha.';
  }else{xml=xml.replace('<w:r><w:t>{{CROQUIS}}</w:t></w:r>','');v.croquis_pie='';}
  xml=xml.replace(/\{\{(\w+)\}\}/g,function(m,k){return xesc(v[k]);});
  Object.keys(TPL).forEach(function(n){
    if(n==='word/document.xml')files.unshift({name:n,data:enc.encode(xml)});
    else if(n==='word/_rels/document.xml.rels')files.push({name:n,data:enc.encode(rels)});
    else files.push({name:n,data:TPL[n].t!==undefined?enc.encode(TPL[n].t):b64bytes(TPL[n].b)});
  });
  // [Content_Types].xml primero
  files.sort(function(x,y){return (x.name==='[Content_Types].xml'?-1:0)-(y.name==='[Content_Types].xml'?-1:0);});
  return zipStore(files);
}
if(typeof module!=='undefined')module.exports={buildDocx:buildDocx,calcEspecie:calcEspecie,nuevaEspecie:nuevaEspecie,valoresInforme:valoresInforme,CDS:CDS};
