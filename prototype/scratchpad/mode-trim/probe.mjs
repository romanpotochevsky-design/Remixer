// Where does "Autopilot" sit in its pill — with `text-box-trim` (Chrome 133+, Safari 18.2+)
// and without it (Firefox, older Chrome/Safari)? Measures the INK, not the boxes.
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173/'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const out = {}
for (const mode of ['trim', 'no-trim']) {
  const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
  await p.goto(`${BASE}?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await p.click('.home-card-face')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 })
  await p.waitForSelector('button[aria-label="Chat mode"]')
  if (mode === 'no-trim') await p.addStyleTag({ content: '*{text-box-trim:none!important;text-box-edge:auto!important}' })
  await p.waitForTimeout(600)
  const g = await p.$eval('button[aria-label="Chat mode"]', (el) => {
    const r = el.getBoundingClientRect(), l = el.firstElementChild.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height, labY: l.y - r.y, labH: l.height,
      supported: CSS.supports('text-box-trim', 'trim-both') }
  })
  const buf = await p.screenshot({ clip: { x: g.x, y: g.y, width: g.w, height: g.h } })
  // decode in the page: ink rows = pixels clearly brighter than the pill's dark glass,
  // inside the label's columns (left 62 % of the pill, past the rim)
  const [top, bot] = await p.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const x2 = c.getContext('2d'); x2.drawImage(img, 0, 0)
    const d = x2.getImageData(0, 0, c.width, c.height).data
    let top = -1, bot = -1
    for (let y = 0; y < c.height; y++) {
      let hit = false
      for (let x = 20; x < c.width * 0.62; x++) {
        const i = (y * c.width + x) * 4
        if (d[i] + d[i + 1] + d[i + 2] > 300) { hit = true; break }
      }
      if (hit) { if (top < 0) top = y; bot = y }
    }
    return [top, bot]
  }, buf.toString('base64'))
  out[mode] = { ...g, inkTop: top / 2, inkBot: (bot + 1) / 2, inkCentre: (top + bot + 1) / 4, pillCentre: g.h / 2 }
  await p.screenshot({ path: `scratchpad/mode-trim/${mode}.png`, clip: { x: g.x - 8, y: g.y - 8, width: g.w + 16, height: g.h + 16 } })
  await p.close()
}
console.log(JSON.stringify(out, null, 1))
await b.close()
