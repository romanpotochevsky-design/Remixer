/* Attach menu + chip in slow motion. Motion's springs read performance.now (patched ×K after load);
   CSS animations (the glint) and the chip's WAAPI collapse are slowed via playbackRate on
   document.getAnimations() right after each gesture. Stills at K=1 first, for the side-by-side. */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const BASE = process.env.BASE || 'http://localhost:4173'
const K = +(process.env.K || 6)
const OUT = 'scratchpad/attach-menu/film'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
const open = async (q = '') => { await p.goto(`${BASE}/?p=empty&h=empty&a=trial&t=1&c=2000&i=dh-free${q}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(2600) }
await open()
const field = await p.$eval('.he-composer', (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })
/* the region: the field plus the menu hanging under its "+" */
const clip = { x: field.x - 24, y: field.y - 24, width: 640, height: field.h + 24 + 240 }
const wide = { x: field.x - 24, y: field.y - 24, width: field.w + 48, height: field.h + 24 + 240 }

/* ── stills at real speed ── */
await p.click('[data-attach-open]'); await p.waitForTimeout(1500)
await p.screenshot({ path: `${OUT}/still-menu.png`, clip: wide })
await p.click('[role="menu"] [role="menuitem"]:last-child'); await p.waitForTimeout(1200)
await p.screenshot({ path: `${OUT}/still-list.png`, clip: wide })
await p.click('[role="menu"] [role="menuitem"]:nth-child(1)'); await p.waitForTimeout(1600)
await p.click('[data-attach-open]'); await p.waitForTimeout(1500)
const wide2 = { ...wide, height: wide.height + 26 }
await p.screenshot({ path: `${OUT}/still-chip-and-menu.png`, clip: wide2 })
/* hover a row for the still */
const row = await p.$eval('[role="menu"] [role="menuitem"]:last-child', (e) => { const r = e.getBoundingClientRect(); return [r.x + 60, r.y + 24] })
await p.mouse.move(row[0], row[1]); await p.waitForTimeout(300)
await p.screenshot({ path: `${OUT}/still-row-hover.png`, clip: wide2 })
await p.keyboard.press('Escape'); await p.waitForTimeout(400)
/* hover the chip's ✕ */
const xb = await p.$eval('[data-attach-domain] button', (e) => { const r = e.getBoundingClientRect(); return [r.x + 9, r.y + 9] })
await p.mouse.move(xb[0], xb[1]); await p.waitForTimeout(300)
await p.screenshot({ path: `${OUT}/still-x-hover.png`, clip: { x: field.x - 8, y: field.y - 8, width: 320, height: 70 } })
await p.mouse.move(10, 10)

/* ── slow motion ── */
await open()
await p.evaluate((k) => { const o = performance.now.bind(performance); const t0 = o(); performance.now = () => t0 + (o() - t0) / k }, K)
const slowCss = () => p.evaluate((k) => { for (const a of document.getAnimations()) if (a.playbackRate === 1) a.playbackRate = 1 / k }, K)
/* one frame every `step` ms of ANIMATION time */
const run = async (name, act, frames, step, region = clip) => {
  await act()
  await slowCss()
  for (let i = 0; i < frames; i++) {
    await p.screenshot({ path: `${OUT}/${name}-${String(i).padStart(2, '0')}.png`, clip: region })
    await slowCss()
    await p.waitForTimeout(step * K)
  }
  await p.waitForTimeout(1500 * K / 3)
}
await run('open', () => p.evaluate(() => document.querySelector('[data-attach-open]').click()), 16, 40)
await p.waitForTimeout(600 * K / 3)
await run('level', () => p.evaluate(() => document.querySelector('[role="menu"] [role="menuitem"]:last-child').click()), 14, 40)
await p.waitForTimeout(600 * K / 3)
await run('close', () => p.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))), 8, 25)
/* chip arrival: open → level → pick */
await p.evaluate(() => document.querySelector('[data-attach-open]').click()); await p.waitForTimeout(900 * K / 2)
await p.evaluate(() => document.querySelector('[role="menu"] [role="menuitem"]:last-child').click()); await p.waitForTimeout(900 * K / 2)
await run('chip-in', () => p.evaluate(() => document.querySelector('[role="menu"] [role="menuitem"]:nth-child(2)').click()), 18, 40, { ...clip, height: clip.height + 26 })
await p.waitForTimeout(1500 * K / 3)
/* chip removal: the WAAPI collapse is slowed by playbackRate immediately after the click */
await run('chip-out', () => p.evaluate((k) => { const c = document.querySelector('[data-attach-domain]'); c.querySelector('button').click(); for (const a of c.getAnimations()) a.playbackRate = 1 / k }, K), 14, 30, { ...clip, height: clip.height + 26 })
await b.close()
console.log('filmed')
