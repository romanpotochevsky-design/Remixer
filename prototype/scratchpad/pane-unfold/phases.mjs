/* PHASE SHOTS — the unfold as five stills, for eyes rather than numbers. A screenshot on the software
   rasteriser lands 30–760 ms after it is asked for, so a live capture never shows the frame you meant;
   instead the pane is put at measured points of its own flight by hand (the values motion writes),
   with the site under it at the matching point of its recession, and each is photographed at rest.
   Progress p of the spring is applied to the clip inset (from → 0), the pane scale (1.015 → 1) and the
   site (opacity by its late ease-in, scale 1 → .955). */
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'
const BASE = process.env.BASE || 'http://localhost:5174'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
/* open, let it settle, then freeze both layers by hand */
await p.evaluate(() => document.querySelector('nav.arrive-rail [aria-label="Cloud"]').click())
await p.waitForTimeout(1600)
/* re-mount the site under the pane for the stills: simplest is to reopen with the site present —
   so instead we photograph the OPEN direction by driving styles on the pane and a cloned site */
const geo = await p.evaluate(() => {
  const pane = document.querySelector('[data-canvas-pane]')
  const main = document.querySelector('main')
  return { clipRest: getComputedStyle(pane).clipPath, origin: getComputedStyle(pane).transformOrigin, box: main.getBoundingClientRect().toJSON() }
})
console.log(JSON.stringify(geo))
// the "from" inset for this viewport (button 1548,234,48,48; canvas 440,52,1104,840)
const from = { t: 182, r: -52, b: 610, l: 1108 }
const phases = [0.12, 0.3, 0.5, 0.72, 1]
// spring-like progress → eased value; the site recedes with it
const shots = []
for (const q of phases) {
  await p.evaluate(({ q, from }) => {
    const pane = document.querySelector('[data-canvas-pane]')
    const mix = (a, b) => a + (b - a) * q
    pane.style.clipPath = `inset(${mix(from.t, 0)}px ${mix(from.r, 0)}px ${mix(from.b, 0)}px ${mix(from.l, 0)}px round 16px)`
    pane.style.transform = `scale(${mix(1.015, 1)})`
    pane.style.opacity = '1'
    // freeze the contents cascade at its matching moment: rows/menu visible from q>.45
    pane.querySelectorAll('.pane-in-menu, .pane-in-head, .pane-in-cols, .pane-in-row').forEach((el) => { el.style.animation = 'none'; el.style.opacity = q > 0.45 ? '1' : '0' })
    pane.querySelector('.glass-glint').style.animation = 'none'
    pane.querySelector('.glass-glint').style.opacity = q >= 0.72 ? String(1 - (q - 0.72) / 0.28 * 0.6) : '0'
    // the site under it: a static stand-in — the real one has left by now, so paint a proxy ground
    let ghost = document.querySelector('#ghost-site')
    if (!ghost) {
      ghost = document.createElement('div'); ghost.id = 'ghost-site'
      ghost.style.cssText = 'position:absolute;left:8px;right:0;top:0;bottom:8px;z-index:0;border-radius:16px;background:#fff url("data:image/svg+xml,") center/cover;'
      document.querySelector('main').appendChild(ghost)
    }
    const op = Math.max(0, 1 - Math.pow(q, 1.6) * 1.35)
    ghost.style.opacity = String(op)
    ghost.style.transform = `translateY(${10 * q}px) scale(${1 - 0.045 * q})`
  }, { q, from })
  await p.waitForTimeout(150)
  const file = `phase-${Math.round(q * 100)}.png`
  await p.screenshot({ path: file, clip: { x: 432, y: 0, width: 1168, height: 900 } })
  shots.push(file)
}
console.log(shots.join(' '))
await b.close()
