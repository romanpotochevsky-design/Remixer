/* how many frames does the pane-close film get in its first 300 ms on this renderer? three runs */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
for (let run = 0; run < 3; run++) {
  await p.click('nav.arrive-rail [aria-label="Cloud"]'); await p.waitForSelector('[data-cloud-close]'); await p.waitForTimeout(2000)
  const film = p.evaluate(async () => {
    const out = []; const t0 = performance.now()
    await new Promise((res) => { const tick = () => { const now = performance.now() - t0; const pane = document.querySelector('[data-canvas-pane]'); const btn = document.querySelector('nav.arrive-rail [aria-label="Cloud"]'); out.push({ t: Math.round(now), pane: !!pane, tile: getComputedStyle(btn).backgroundColor }); if (now < 800) requestAnimationFrame(tick); else res() }; requestAnimationFrame(tick) })
    return out
  })
  await p.keyboard.press('Escape')
  const f = await film
  const within = f.filter((s) => s.t <= 300)
  const dts = f.slice(1, 16).map((s, i) => s.t - f[i].t)
  console.log(`run ${run}: samples≤300ms=${within.length} lit≤300=${within.every((s) => s.tile === 'rgba(149, 117, 205, 0.12)')} dark≥700=${f.filter((s) => s.t >= 700).every((s) => s.tile === 'rgba(0, 0, 0, 0)')} pane gone at ${f.find((s) => !s.pane)?.t} dts=${dts.join(',')}`)
  await p.waitForTimeout(800)
}
await b.close()
