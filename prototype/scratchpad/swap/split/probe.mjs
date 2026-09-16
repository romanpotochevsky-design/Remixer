import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const here = path.dirname(fileURLToPath(import.meta.url))
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 600, height: 240 }, deviceScaleFactor: 1 })
await p.goto('file://' + path.join(here, 'page.html'))
// pause the sweep at a chosen progress and compare the split line against the single-element reference
const res = await p.evaluate(async () => {
  const out = []
  for (const t of [0.15, 0.3, 0.45, 0.6]) {
    for (const a of document.getAnimations()) { a.pause(); a.currentTime = t * 2700 }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    const gp = (el) => getComputedStyle(el).getPropertyValue('--sh-p')
    out.push({ t, p_split: gp(document.getElementById('split')), p_seg: gp(document.getElementById('v')), pos_v: getComputedStyle(document.getElementById('v')).backgroundPositionX, pos_h: getComputedStyle(document.getElementById('h')).backgroundPositionX, size_v: getComputedStyle(document.getElementById('v')).backgroundSize, lineW: document.getElementById('split').style.getPropertyValue('--line-w'), segx_h: document.getElementById('h').style.getPropertyValue('--seg-x') })
  }
  return out
})
console.log(JSON.stringify(res, null, 1))
// screenshot at t=0.3 and compare rows pixelwise: split vs single
await p.evaluate(async () => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = 0.3 * 2700 } })
await p.waitForTimeout(100)
const png = await p.screenshot({ path: path.join(here, 'shot.png') })
const boxes = await p.evaluate(() => ['split', 'single', 'moved'].map((id) => { const r = document.getElementById(id).getBoundingClientRect(); return { id, x: r.x, y: r.y, w: r.width, h: r.height } }))
console.log(JSON.stringify(boxes))
await b.close()
