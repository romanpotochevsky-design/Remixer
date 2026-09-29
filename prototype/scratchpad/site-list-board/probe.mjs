/* The sites list against its board 31164:75936 — geometry at the board's 2560 × 1166, and a trace of the
   toolbar stepping aside and coming back. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = 'scratchpad/site-list-board'
const W = +(process.env.W || 2560), H = +(process.env.H || 1166)
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: W, height: H } })
const errors = []; p.on('pageerror', (e) => errors.push(String(e)))
await p.goto(`${BASE}${BASE.endsWith('.html') ? '' : '/'}?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' }); await p.waitForTimeout(700)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(800)
/* trace the toolbar and the site across the open */
await p.evaluate(() => { window.__tr = []; const t0 = performance.now(); const tick = () => { const tb = document.querySelector('[data-canvas-toolbar]'); const pk = document.querySelector('[data-site-park]'); window.__tr.push([Math.round(performance.now() - t0), tb && +getComputedStyle(tb).opacity, tb && getComputedStyle(tb).transform, pk && getComputedStyle(pk).transform]); if (performance.now() - t0 < 1400) requestAnimationFrame(tick) }; requestAnimationFrame(tick) })
await p.click('[data-site-switch]')
await p.waitForTimeout(1500)
const open = await p.evaluate(() => window.__tr)
await p.screenshot({ path: `${OUT}/ours-${W}.png` })
const r = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map((v) => Math.round(v * 100) / 100) }
const geo = await p.evaluate((rs) => { const r = new Function('return ' + rs)(); return {
  clip: r('[data-sites-clip]'), head: r('[data-sites-head]'), title: r('[data-sites-head] h2'), newBtn: r('[data-sites-new]'), close: r('[data-sites-close]'),
  grid: r('[data-sites-grid]'), card0: r('[data-site-card]'), thumb0: r('[data-site-card] [data-site-thumb]'), meta0: r('[data-site-card] [data-site-meta]'), more0: r('[data-site-card] [data-site-more]'),
  newSlot: r('[data-sites-new-slot]'), newSlotBtn: r('[data-sites-new-slot] button'), empties: document.querySelectorAll('[data-sites-empty]').length,
  cards: [...document.querySelectorAll('[data-site-card]')].map((e) => { const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width)] }),
  park: (() => { const e = document.querySelector('[data-site-park]'); return [getComputedStyle(e).transform, getComputedStyle(e).clipPath] })(),
  toolbar: (() => { const e = document.querySelector('[data-canvas-toolbar]'); return [getComputedStyle(e).opacity, getComputedStyle(e).pointerEvents] })(),
} }, r.toString())
/* close back */
await p.evaluate(() => { window.__tr = []; const t0 = performance.now(); const tick = () => { const tb = document.querySelector('[data-canvas-toolbar]'); window.__tr.push([Math.round(performance.now() - t0), tb && +getComputedStyle(tb).opacity]); if (performance.now() - t0 < 1200) requestAnimationFrame(tick) }; requestAnimationFrame(tick) })
await p.click('[data-sites-close]')
await p.waitForTimeout(1300)
const close = await p.evaluate(() => window.__tr)
const after = await p.evaluate(() => ({ shelf: !!document.querySelector('[data-sites-shelf]'), tb: getComputedStyle(document.querySelector('[data-canvas-toolbar]')).opacity }))
console.log(JSON.stringify({ geo, after, errors, open: open.filter((_, i) => i % 4 === 0).map((x) => [x[0], x[1], x[2]].join(' ')), close: close.filter((_, i) => i % 4 === 0).map((x) => x.join(' ')) }, null, 1))
await b.close()
