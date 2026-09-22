/* SLOW-MOTION STILLS of the live hand-over. The pane's clip, scale and opacity and the site's
   recession are all main-thread values (motion, `onUpdate` stubs), so patching the clocks BEFORE
   the bundle loads (`addInitScript` — motion captures them at import) slows every one of them
   ×0.1; the CSS cascade inside the window is slowed by playbackRate on the page's animations.
   A screenshot on the software rasteriser lands late by 30–760 ms — at ×0.1 that is 3–76 ms of
   animation time, a smear of one or two real frames. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:5174'
const RATE = 0.1
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.addInitScript((RATE) => {
  const realNow = performance.now.bind(performance)
  const realRaf = window.requestAnimationFrame.bind(window)
  let slow = false, origin = 0, originSlow = 0
  const now = () => (slow ? originSlow + (realNow() - origin) * RATE : realNow())
  performance.now = now
  window.requestAnimationFrame = (cb) => realRaf(() => cb(now()))
  window.__slow = (on) => { const r = realNow(); originSlow = now(); origin = r; slow = on }
}, RATE)
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
const glintColor = async () => p.evaluate(() => { const g = document.querySelector('[data-canvas-pane] .glass-glint'); return g ? getComputedStyle(g).boxShadow.slice(0, 90) : null })
const clip = { x: 432, y: 0, width: 1168, height: 900 }
const shoot = async (dir, moments) => {
  const files = []
  const t0 = Date.now()
  for (const m of moments) {
    const wait = t0 + m / RATE - Date.now()
    if (wait > 0) await p.waitForTimeout(wait)
    const f = `slow-${dir}-${String(m).padStart(3, '0')}.png`
    await p.screenshot({ path: f, clip })
    files.push(f)
  }
  return files
}
/* OPEN */
await p.evaluate(() => { window.__slow(true); document.querySelector('nav.arrive-rail [aria-label="Cloud"]').click()
  /* slow the CSS cascade too, for the first real second */
  const t = setInterval(() => document.getAnimations().forEach((a) => { if (a.playbackRate !== 0.1) a.playbackRate = 0.1 }), 30); setTimeout(() => clearInterval(t), 12000) })
const opened = await shoot('open', [30, 70, 110, 160, 220, 300, 420, 600])
console.log('glint shadow:', await glintColor())
await p.evaluate(() => window.__slow(false)); await p.waitForTimeout(1800)
/* CLOSE */
await p.evaluate(() => window.__slow(true))
await p.keyboard.press('Escape')
const closed = await shoot('close', [30, 80, 130, 190, 260, 340])
await p.evaluate(() => window.__slow(false))
console.log(opened.concat(closed).join(' '))
await b.close()
