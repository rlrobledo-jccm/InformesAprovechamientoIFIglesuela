"""Convierte el KML de superficie quemada por parcela catastral en data/parcelas.json.
Uso: python tools/kml_a_json.py QuemadoxParcelaCatastral.kml data/parcelas.json
Campos usados: MASA (polígono), PARCELA, Shape_Area (ha) o AREA (m²), COORX/COORY si existen."""
import re,json,sys,math
s=open(sys.argv[1],encoding='utf-8').read()
pms=re.findall(r'<Placemark.*?</Placemark>',s,re.S)
def g(p,n):
    m=re.search(r'name="%s">([^<]*)<'%n,p); return m.group(1) if m else ''
def dp(pts,tol):
    if len(pts)<5: return pts
    stack=[(0,len(pts)-1)]; keep=[False]*len(pts); keep[0]=keep[-1]=True
    while stack:
        a,b=stack.pop(); ax,ay=pts[a]; bx,by=pts[b]; dx,dy=bx-ax,by-ay; L=math.hypot(dx,dy)
        md,mi=0,-1
        for i in range(a+1,b):
            px,py=pts[i]
            d=abs(dy*(px-ax)-dx*(py-ay))/L if L else math.hypot(px-ax,py-ay)
            if d>md: md,mi=d,i
        if md>tol: keep[mi]=True; stack+= [(a,mi),(mi,b)]
    return [p for p,k in zip(pts,keep) if k]
def utm(lon,lat,zone=30):
    a=6378137.0;f=1/298.257222101;e2=f*(2-f);k0=0.9996
    lon0=math.radians(zone*6-183);phi=math.radians(lat);lam=math.radians(lon)
    N=a/math.sqrt(1-e2*math.sin(phi)**2);T=math.tan(phi)**2;C=e2/(1-e2)*math.cos(phi)**2;A=math.cos(phi)*(lam-lon0)
    M=a*((1-e2/4-3*e2**2/64-5*e2**3/256)*phi-(3*e2/8+3*e2**2/32+45*e2**3/1024)*math.sin(2*phi)+(15*e2**2/256+45*e2**3/1024)*math.sin(4*phi)-(35*e2**3/3072)*math.sin(6*phi))
    ep=e2/(1-e2)
    x=k0*N*(A+(1-T+C)*A**3/6+(5-18*T+T*T+72*C-58*ep)*A**5/120)+500000
    y=k0*(M+N*math.tan(phi)*(A*A/2+(5-T+9*C+4*C*C)*A**4/24+(61-58*T+T*T+600*C-330*ep)*A**6/720))
    return x,y
def centroid(c):
    pts=[tuple(map(float,x.split(',')[:2])) for x in c.split()]
    A=cx=cy=0
    for (x1,y1),(x2,y2) in zip(pts,pts[1:]+pts[:1]):
        cr=x1*y2-x2*y1;A+=cr;cx+=(x1+x2)*cr;cy+=(y1+y2)*cr
    if abs(A)<1e-15: return sum(p[0] for p in pts)/len(pts),sum(p[1] for p in pts)/len(pts),0
    return cx/(3*A),cy/(3*A),abs(A)/2
out=[]; npts=0
for p in pms:
    polys=[]
    for poly in re.findall(r'<Polygon>(.*?)</Polygon>',p,re.S):
        rings=[]
        for c in re.findall(r'<coordinates>(.*?)</coordinates>',poly,re.S):
            pts=[(round(float(a.split(',')[0])*1e6),round(float(a.split(',')[1])*1e6)) for a in c.split()]
            pts=dp(pts,1.5)  # ~0.15 m
            if len(pts)<4: continue
            flat=[pts[0][0],pts[0][1]]
            for (x0,y0),(x1,y1) in zip(pts,pts[1:]): flat+= [x1-x0,y1-y0]
            rings.append(flat); npts+=len(pts)
        if rings: polys.append(rings)
    area=float(g(p,'AREA') or 0) or float(g(p,'Shape_Area') or 0)*1e4
    X,Y=float(g(p,'COORX') or 0),float(g(p,'COORY') or 0)
    if not X:
        best=max((centroid(c) for c in re.findall(r'<outerBoundaryIs>.*?<coordinates>(.*?)</coordinates>',p,re.S)),key=lambda t:t[2])
        X,Y=utm(best[0],best[1])
    out.append([g(p,'MASA'),g(p,'PARCELA'),g(p,'TIPO'),round(area),round(X),round(Y),polys])
meta={'municipio':g(pms[0],'MUNICIPIO'),'delegacion':g(pms[0],'DELEGACIO'),'n':len(out),'id':'%s-%d-%s'%(g(pms[0],'MUNICIPIO'),len(out),out[0][1])}
json.dump({'meta':meta,'p':out},open(sys.argv[2],'w'),separators=(',',':'))
import os; print(npts, os.path.getsize(sys.argv[2]))
