/* Cloud menu in slow motion (motion's JS clock scaled via addInitScript): contact sheets of the menu region
   for leaving Database (→ Secrets), returning (→ Database) and the table hop (→ Orders). */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const BASE = process.env.BASE || 'http://localhost:4173'
const K = +(process.env.K || 6)
const OUT = 'scratchpad/cloud-menu/film'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
await p.click('nav.arrive-rail [aria-label="Cloud"]')
await p.waitForSelector('[data-cloud-plate]', { timeout: 10000 })
await p.waitForTimeout(1800)
/* slow the JS clock now (motion reads performance.now through its frameloop) */
await p.evaluate((k) => { const o = performance.now.bind(performance); const t0 = o(); performance.now = () => t0 + (o() - t0) / k }, K)
const menu = await p.$eval('[data-cloud-menu]', (e) => { const r = e.getBoundingClientRect(); return { x: r.x - 6, y: r.y - 6, width: r.width + 12, height: Math.min(r.height + 12, 520) } })
const head = await p.$eval('[data-cloud-window] h2', (e) => { const r = e.getBoundingClientRect(); return { x: r.x - 8, y: r.y, width: 360, height: r.height } })
const run = async (name, seat, frames, stepMs) => {
  await p.evaluate((id) => document.querySelector(`[data-cloud-seat="${id}"]`).click(), seat)
  for (let i = 0; i < frames; i++) {
    await p.screenshot({ path: `${OUT}/${name}-${String(i).padStart(2, '0')}.png`, clip: menu })
    await p.screenshot({ path: `${OUT}/${name}-h${String(i).padStart(2, '0')}.png`, clip: head })
    await p.waitForTimeout(stepMs)
  }
  await p.waitForTimeout(1200 * K)
}
await run('leave', 'secrets', 14, 60 * K / 3)
await run('back', 'database', 14, 60 * K / 3)
await run('hop', 'orders', 10, 60 * K / 3)
await b.close()
console.log('done')
