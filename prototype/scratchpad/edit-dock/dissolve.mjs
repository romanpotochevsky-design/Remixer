/* THE DISSOLVE — after the dock flight lands, the clone's glass must fade over the rail tile, not vanish in a frame */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173/'
const b = await chromium.launch({ executablePath: process.env.CHROME }); const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(BASE + '?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await p.evaluate(() => localStorage.removeItem('remixer-prototype/world/v6')); await p.waitForTimeout(400)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await p.waitForSelector('[data-ve-bar]', { timeout: 20000 }); await p.waitForTimeout(800)
const bar = await p.locator('[data-ve-bar]').boundingBox()
await p.mouse.move(bar.x + 20, bar.y + 20); await p.waitForTimeout(700)
await p.locator('[data-ve-dock-to-rail]').dispatchEvent('click')
const film = []
for (let i = 0; i < 60; i++) {
  await p.waitForTimeout(16)
  film.push(await p.evaluate(() => { const f = document.querySelector('[data-ve-flight]'); const h = document.querySelector('[data-ve-dock-host]'); return { t: performance.now(), clone: f ? +getComputedStyle(f).opacity : null, w: f ? Math.round(f.getBoundingClientRect().width) : null, host: h ? getComputedStyle(h).visibility : null } }))
  if (film.length > 8 && !film.at(-1).clone && !film.at(-2).clone) break
}
const t0 = film[0].t
const land = film.find((f) => f.w === 48 && f.host === 'visible')
const fading = film.filter((f) => f.host === 'visible' && f.clone !== null && f.clone < 1 && f.clone > 0)
const gone = film.find((f) => f.clone === null)
console.log('landed+host visible at', land ? Math.round(land.t - t0) : null, 'ms; fading frames', fading.length, fading.map((f) => f.clone.toFixed(2)).join(' '), '; clone gone at', gone ? Math.round(gone.t - t0) : null)
console.log('monotone fade', fading.every((f, i) => i === 0 || f.clone <= fading[i - 1].clone + 1e-6))
console.log(fading.length >= 4 && land ? 'PASS the glass dissolves over the visible tile through several frames' : 'FAIL dissolve')
await b.close()
