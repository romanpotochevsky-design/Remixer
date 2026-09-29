/* Contact sheets of the top of the canvas across open and pick, 1600 × 900, real speed. */
import { chromium } from 'playwright'
import { execSync } from 'node:child_process'
const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = 'scratchpad/site-list-board'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' }); await p.waitForTimeout(700)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(800)
const clip = { x: 440, y: 0, width: 1104, height: 400 }
const shoot = async (tag, n, step) => { for (let i = 0; i < n; i++) { await p.screenshot({ path: `${OUT}/f-${tag}-${String(i).padStart(2, '0')}.png`, clip }); await p.waitForTimeout(step) } }
p.click('[data-site-switch]'); await shoot('open2', 12, 70)
await p.waitForTimeout(600)
p.click('[data-site-card="synco"] [data-site-open]'); await shoot('pick2', 10, 70)
await b.close()
for (const tag of ['open2', 'pick2']) execSync(`cd ${OUT} && python3 -c "
from PIL import Image; import glob
fs=sorted(glob.glob('f-${tag}-*.png')); ims=[Image.open(f).resize((552,200)) for f in fs]
w,h=ims[0].size; cols=3; rows=(len(ims)+cols-1)//cols; sheet=Image.new('RGB',(w*cols,h*rows),(40,40,40))
for i,im in enumerate(ims): sheet.paste(im,((i%cols)*w,(i//cols)*h))
sheet.save('sheet-${tag}.jpg',quality=80)
" && rm f-${tag}-*.png`)
