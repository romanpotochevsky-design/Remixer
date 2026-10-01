import subprocess, sys, numpy as np, json
FF='/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
V=sys.argv[1]; W,H=2440,1616
pts=[float(x) for x in open('pts.txt')]
p=subprocess.Popen([FF,'-hide_banner','-loglevel','error','-i',V,'-vsync','0','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
out=[]; n=0
while True:
    buf=p.stdout.read(W*H*3)
    if len(buf)<W*H*3: break
    im=np.frombuffer(buf,np.uint8).reshape(H,W,3).astype(np.int16)
    r,g,b=im[...,0],im[...,1],im[...,2]
    blue=(b>195)&(r<75)&(g>55)&(g<125)
    # filled blue: blue and blue 8px above and below and 8px left/right
    f=blue.copy()
    f[8:-8,8:-8]=blue[8:-8,8:-8]&blue[:-16,8:-8]&blue[16:,8:-8]&blue[8:-8,:-16]&blue[8:-8,16:]
    f[:8,:]=False; f[-8:,:]=False; f[:,:8]=False; f[:,-8:]=False
    f[1480:,:]=False  # toolbar zone
    ys,xs=np.nonzero(f)
    pill=None
    if len(xs): pill=[int(xs.min())-8,int(ys.min())-8,int(xs.max())+8,int(ys.max())+8]
    # crosshair
    wht=im.min(axis=2)>225
    c=wht[12:-12,12:-12]
    def S(dy,dx): return wht[12+dy:H-12+dy,12+dx:W-12+dx]
    cand=c&S(-10,0)&S(10,0)&S(0,-10)&S(0,10)&~S(-6,-6)&~S(6,6)&~S(-6,6)&~S(6,-6)&~S(-10,-5)&~S(-10,5)&~S(10,-5)&~S(10,5)
    cy,cx=np.nonzero(cand)
    cur=[int(cx.mean())+12,int(cy.mean())+12] if len(cx) else None
    out.append({'i':n,'t':pts[n] if n<len(pts) else None,'pill':pill,'cur':cur})
    n+=1
json.dump(out,open('track.json','w'))
print(n)
