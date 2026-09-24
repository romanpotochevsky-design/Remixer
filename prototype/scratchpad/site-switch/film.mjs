/* SLOW-MOTION STRIPS of the two flights for the designer's eye: the site closing into its card
   (open) and a picked card growing out to the canvas (pick). `addInitScript` slows the page's
   clock 4× before motion captures it (CLAUDE.md: patching from `evaluate` does nothing to motion),
   and the flights are JS-driven motion values, so they slow with it. Screenshots lag the request on
   the software renderer, so each frame is labelled by the page's own slowed time. */
import { chromium } from 'playwright'
import { execSync } from 'node:child_process'
const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = 'scratchpad/site-switch'
const SLOW = 4
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.addInitScript((k) => {
  const now0 = performance.now(); const real = performance.now.bind(performance)
  performance.now = () => now0 + (real() - now0) / k
  const raf = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = (cb) => raf((t) => cb(performance.now()))
  window.__slow = k
}, SLOW)
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(700); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 60000 }); await p.waitForTimeout(1500)
const clip = { x: 432, y: 52, width: 1112, height: 848 }
const strip = async (name, act, n, every) => {
  const t0 = await p.evaluate(() => performance.now())
  await act()
  const frames = []
  for (let i = 0; i < n; i++) {
    const t = await p.evaluate(() => performance.now())
    await p.screenshot({ path: `${OUT}/${name}-${String(i).padStart(2, '0')}.png`, clip })
    frames.push(Math.round(t - t0))
    await p.waitForTimeout(every)
  }
  return frames
}
const open = await strip('open', () => p.click('[data-site-switch]'), 8, 160)
await p.waitForTimeout(3000)
const pick = await strip('pick', () => p.click('[data-site-card="synco"] [data-site-open]'), 8, 140)
await b.close()
execSync(`python3 - <<'PY'
from PIL import Image, ImageDraw
import json
out='${OUT}'
def sheet(name, times, label):
    ims=[Image.open(f'{out}/{name}-{i:02d}.png') for i in range(len(times))]
    tw=520; th=int(ims[0].height*tw/ims[0].width); cols=4; rows=(len(ims)+cols-1)//cols
    s=Image.new('RGB',(cols*tw, rows*(th+22)+30),(9,9,11)); d=ImageDraw.Draw(s)
    d.text((8,6), label, fill=(228,228,231))
    for k,im in enumerate(ims):
        x=(k%cols)*tw; y=30+(k//cols)*(th+22)
        s.paste(im.resize((tw,th)),(x,y+22)); d.text((x+6,y+4), f'{times[k]} ms (page time)', fill=(255,255,255))
    s.save(f'{out}/sheet-{name}.jpg', quality=85); print(name, s.size)
sheet('open', json.loads('${JSON.stringify(open)}'), 'OPEN - the site closes into its card, the shelf comes into place behind it (4x slow)')
sheet('pick', json.loads('${JSON.stringify(pick)}'), 'PICK - synco.com grows out of its card to the canvas; the shelf goes under it (4x slow)')
PY`, { stdio: 'inherit' })
console.log(JSON.stringify({ open, pick }))
