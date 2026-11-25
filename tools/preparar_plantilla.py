"""Convierte el modelo de informe (.docx) en data/plantilla.json con los marcadores que rellena la app.
Uso: python tools/preparar_plantilla.py modelo.docx data/plantilla.json
Solo funciona con el modelo actual; si cambia la maqueta del Word hay que adaptar este script."""
import sys,copy,json,base64,os,re
from lxml import etree
src=sys.argv[1]; out=sys.argv[2]
if src.lower().endswith('.docx'):
    import zipfile,tempfile
    tmp=tempfile.mkdtemp(); zipfile.ZipFile(src).extractall(tmp); src=tmp
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
def w(t): return '{%s}%s'%(W,t)
t=etree.parse(os.path.join(src,'word/document.xml')); root=t.getroot(); body=root.find(w('body'))
def run(text,sz='20',bold=False):
    r=etree.Element(w('r')); rp=etree.SubElement(r,w('rPr'))
    if bold: etree.SubElement(rp,w('b'))
    s=etree.SubElement(rp,w('sz')); s.set(w('val'),sz); s2=etree.SubElement(rp,w('szCs')); s2.set(w('val'),sz)
    tt=etree.SubElement(r,w('t')); tt.text=text; tt.set('{http://www.w3.org/XML/1998/namespace}space','preserve'); return r
def ptx(p): return ''.join(x.text or '' for x in p.iter(w('t')))
def append(p,key,sz='20'): p.append(run(' {{%s}}'%key,sz))
tbls=body.findall(w('tbl'))
def cell(ti,ri,ci): return tbls[ti].findall(w('tr'))[ri].findall(w('tc'))[ci]
def cellp(ti,ri,ci,pi=0): return cell(ti,ri,ci).findall(w('p'))[pi]
# checkboxes
cbkeys=['mup','vp','dph','consorcio','carretera','igfs_no','igfs_si','solana','umbria','forestal','agricola','silic','calizo','yesoso','salino','sust_otros','vigoroso','normal','decrepito','plagas','seca','enp_no','enp_si']+['m%d'%i for i in range(1,13)]+['buen','mal']
cbs=list(body.iter(w('checkBox'))); assert len(cbs)==37
for k,cb in zip(cbkeys,cbs):
    for ch in list(cb):
        if ch.tag in (w('default'),w('checked')): cb.remove(ch)
    d=etree.SubElement(cb,w('default')); d.set(w('val'),'{{cb_%s}}'%k)
# Exp
for p in body.findall(w('p')):
    if ptx(p).startswith('Exp'): append(p,'exp'); break
# titular
for (ri,ci,k) in [(1,0,'nombre'),(1,1,'ap1'),(1,2,'ap2'),(2,0,'razon'),(3,0,'domicilio'),(4,0,'tit_prov'),(4,1,'tit_cp'),(4,2,'tit_pob'),(5,0,'tel'),(5,1,'movil'),(5,2,'email')]:
    append(cellp(1,ri,ci),k)
# parcela
for (ri,ci,k) in [(1,0,'monte'),(1,1,'prov'),(1,2,'tm'),(3,0,'igfs_fecha'),(3,1,'pendiente'),(3,2,'altitud'),(5,0,'sust_otros_txt'),(7,0,'superficie'),(7,1,'cauces'),(8,0,'enp_cual'),(9,0,'fauna'),(11,0,'obs_parcela')]:
    append(cellp(2,ri,ci),k)
row6=tbls[2].findall(w('tr'))[6]
for p in row6.iter(w('p')):
    x=ptx(p); rs=p.findall(w('r'))
    def rebuild(text):
        rr=[r for r in rs if r.find(w('t')) is not None]
        rr[0].find(w('t')).text=text; rr[0].find(w('t')).set('{http://www.w3.org/XML/1998/namespace}space','preserve')
        for r in rr[1:]: p.remove(r)
    if x.startswith('Especie 1'): rebuild('Especie 1: {{esp1}}     Pies/ha: {{esp1_pies}}     Fcc (%): {{esp1_fcc}}')
    elif x.startswith('Especie 2'): rebuild('Especie 2: {{esp2}}     Pies/ha: {{esp2_pies}}     Fcc (%): {{esp2_fcc}}')
    elif x.startswith('Especies:'): rebuild('Especies: {{mat_esp}}     Fcc (%): {{mat_fcc}}')
    elif x.startswith('Estado vegetativo'): append(p,'plaga_txt')
# localizacion: keep row2 as template, drop rows 3,4
trs=tbls[3].findall(w('tr'))
cols=['pol','par','rec','sup','x','y','obs']
for ci,k in enumerate(cols): cellp(3,2,ci).append(run('{{L_%s}}'%k,'18'))
tbls[3].remove(trs[3]); tbls[3].remove(trs[4])
# maderas: table 3 rows 7..15 (after removal indices shift by -2) -> rows 5..13
trs=tbls[3].findall(w('tr'))
for r in range(9):
    tcs=trs[5+r].findall(w('tc'))
    for c in range(1,9): tcs[c].findall(w('p'))[0].append(run('{{md%d_%d}}'%(r,c),'18'))
def grid(ti,r0,nrows,c0,c1,pre):
    trs=tbls[ti].findall(w('tr'))
    for r in range(nrows):
        tcs=trs[r0+r].findall(w('tc'))
        for c in range(c0,c1):
            tcs[c].findall(w('p'))[0].append(run('{{%s%d_%d}}'%(pre,r,c),'18'))
grid(4,2,5,0,6,'le'); grid(4,7,1,1,6,'lt')
grid(5,3,5,1,7,'re'); grid(6,3,7,1,7,'co'); grid(7,2,3,0,3,'de'); grid(7,5,1,1,3,'dt')
# obs finales
append(cellp(8,0,0),'obsA'); append(cellp(8,1,0),'obsB')
# monte queda
for p in body.findall(w('p')):
    x=ptx(p)
    if x.startswith('El monte quedará'):
        for r in p.findall(w('r')):
            tt=r.find(w('t'))
            if tt is not None and 'densidad de' in tt.text: tt.text=' Buen estado, con una densidad de {{fin_pies}}'
        p.append(run(': {{fin_fcc}}'))
    elif x.startswith('CROQUIS'):
        np_=etree.Element(w('p')); pp=etree.SubElement(np_,w('pPr')); jc=etree.SubElement(pp,w('jc')); jc.set(w('val'),'center')
        r=etree.SubElement(np_,w('r')); tt=etree.SubElement(r,w('t')); tt.text='{{CROQUIS}}'
        p.addnext(np_)
        cap=etree.Element(w('p')); pp=etree.SubElement(cap,w('pPr')); jc=etree.SubElement(pp,w('jc')); jc.set(w('val'),'center')
        cap.append(run('{{croquis_pie}}','16')); np_.addnext(cap)
    elif x.startswith('En,'):
        rs=[r for r in p.findall(w('r')) if r.find(w('t')) is not None]
        rs[0].find(w('t')).text='En {{lugar}}, a {{dia}} '; rs[2].find(w('t')).text=' {{mes}} '; rs[4].find(w('t')).text=' {{anio}}'
    elif x.startswith('Fdo.'):
        rs=[r for r in p.findall(w('r')) if r.find(w('t')) is not None]
        rs[0].find(w('t')).text='Fdo.: {{agente}}'
        for r in rs[1:]: p.remove(r)
xml=etree.tostring(t,xml_declaration=True,encoding='UTF-8',standalone=True).decode()
toks=sorted(set(re.findall(r'\{\{([^}]+)\}\}',xml))); print(len(toks),'tokens'); 
# assemble template file map
files={}
for dp,dn,fn in os.walk(src):
    for f in fn:
        full=os.path.join(dp,f); rel=os.path.relpath(full,src).replace(os.sep,'/')
        if rel=='word/document.xml': files[rel]={'t':xml}; continue
        b=open(full,'rb').read()
        if rel=='[Content_Types].xml':
            s=b.decode(); s=s.replace('<Default Extension="png"','<Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="png"'); files[rel]={'t':s}
        elif rel.endswith('.xml') or rel.endswith('.rels'): files[rel]={'t':b.decode('utf-8')}
        else: files[rel]={'b':base64.b64encode(b).decode()}
json.dump(files,open(out,'w'),ensure_ascii=False)
print('size',os.path.getsize(out)); print(toks)
