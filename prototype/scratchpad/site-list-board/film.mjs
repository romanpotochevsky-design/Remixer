/* Frames of the band across the open and the close, 1600 × 900, real speed — a contact sheet. */
import { chromium } from 'playwright'
import { execSync } from 'node:child_process'
const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = 'scratchpad/site-list-board'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' }); await p.waitForTimeout(700)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(800)
const clip = { x: 440, y: 0, width: 1104, height: 140 }
const shoot = async (tag, n, step) => { for (let i = 0; i < n; i++) { await p.screenshot({ path: `${OUT}/f-${tag}-${String(i).padStart(2, '0')}.png`, clip }); await p.waitForTimeout(step) } }
p.click('[data-site-switch]'); await shoot('open', 12, 60)
await p.waitForTimeout(600)
p.keyboard.press('Escape'); await shoot('close', 12, 60)
await b.close()
for (const tag of ['open', 'close']) execSync(`cd ${OUT} && python3 -c "
from PIL import Image; import glob
fs=sorted(glob.glob('f-${tag}-*.png')); ims=[Image.open(f) for f in fs]
w,h=ims[0].size; sheet=Image.new('RGB',(w,h*len(ims)),(40,40,40))
for i,im in enumerate(ims): sheet.paste(im,(0,i*h))
sheet.save('sheet-${tag}.jpg',quality=80)
" && rm f-${tag}-*.png`)
