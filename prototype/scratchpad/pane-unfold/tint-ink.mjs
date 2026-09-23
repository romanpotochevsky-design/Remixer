/* The pane's TINTED lights at half ink (designer 24.09.2026, «раза в 2 прозрачнее»): reads the rim's and the
   glint's computed colour mid-unfold, and the REAL pixel of the top edge at its brightest frame — so the
   halving is a number, not an impression. Run against dev (5173) for `before` via git stash, and the
   preview (4173) for `after`. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const at = (q) => `${BASE}${BASE.includes('?') ? '&' : '?'}${q}`
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const p = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage()
await p.goto(at('p=built&v=true&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'), { waitUntil: 'networkidle' })
await p.waitForTimeout(600)
await p.click('.home-card-face')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await p.waitForTimeout(500)
const canvas = await p.$eval('[data-canvas-pane], main', () => 0).catch(() => 0)
/* sample computed inks + the top-edge pixel every frame for 1.6 s */
const film = await p.evaluate(async () => {
  const out = []
  const t0 = performance.now()
  document.querySelector('nav.arrive-rail [aria-label="Cloud"]').click()
  await new Promise((done) => {
    const tick = () => {
      const t = performance.now() - t0
      const rim = document.querySelector('[data-pane-rim]')
      const glint = document.querySelector('[data-canvas-pane] .glass-glint')
      out.push({
        t: Math.round(t),
        rimInk: rim ? getComputedStyle(rim).color : null,
        rimO: rim ? +getComputedStyle(rim).opacity : null,
        glintShadow: glint ? getComputedStyle(glint).boxShadow.slice(0, 40) : null,
        glintO: glint ? +getComputedStyle(glint).opacity : null,
      })
      if (t < 1600) requestAnimationFrame(tick); else done()
    }
    requestAnimationFrame(tick)
  })
  return out
})
const lit = film.find((f) => f.rimO >= 0.98 && f.rimInk)
const glintPeak = film.reduce((a, f) => (f.glintO ?? 0) > (a.glintO ?? 0) ? f : a, film[0])
console.log('rim ink (lit)    ', lit?.rimInk, 'at', lit?.t, 'ms')
console.log('glint ring       ', glintPeak?.glintShadow, '· peak opacity', glintPeak?.glintO, 'at', glintPeak?.t, 'ms')
/* the real pixel: open again to a known frame — the landed pane with the rim still lit (≈ 200 ms after
   landing the rim is cooling; sample at 420 ms where clip has landed and rim is at ~1) */
await p.keyboard.press('Escape'); await p.waitForTimeout(900)
const box = await p.$eval('main', (m) => { const r = m.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })
await p.evaluate(() => document.querySelector('nav.arrive-rail [aria-label="Cloud"]').click())
await p.waitForTimeout(430)
const shot = (await p.screenshot({ clip: { x: box.x, y: box.y, width: box.w, height: 40 } })).toString('base64')
const px = await p.evaluate(async ({ shot, box }) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + shot; await img.decode()
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
  const g = c.getContext('2d'); g.drawImage(img, 0, 0)
  const pane = document.querySelector('[data-canvas-pane]').getBoundingClientRect()
  const yTop = Math.round(pane.top - box.y)
  const row = (y) => { const out = []; for (const fx of [0.3, 0.5, 0.7]) { const d = g.getImageData(Math.round(pane.left - box.x + pane.width * fx), y, 1, 1).data; out.push(`${d[0]},${d[1]},${d[2]}`) } return out }
  return { yTop, edge: row(yTop), edgePlus1: row(yTop + 1), below: row(yTop + 4) }
}, { shot, box })
console.log('top-edge pixels @430 ms  edge', px.edge, '· +1', px.edgePlus1, '· +4 (sheet)', px.below)
await b.close()
