/* The band handoff: the toolbar and the shelf's title row must never share a frame above a faint level. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}${BASE.endsWith('.html') ? '' : '/'}?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' }); await p.waitForTimeout(700)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(800)
const arm = (ms) => p.evaluate((ms) => { window.__tr = []; const t0 = performance.now(); const tick = () => { const tb = document.querySelector('[data-canvas-toolbar]'); const hd = document.querySelector('[data-sites-head]'); window.__tr.push([Math.round(performance.now() - t0), tb ? +(+getComputedStyle(tb).opacity).toFixed(3) : null, hd ? +(+getComputedStyle(hd).opacity).toFixed(3) : null, hd ? getComputedStyle(hd).transform : null]); if (performance.now() - t0 < ms) requestAnimationFrame(tick) }; requestAnimationFrame(tick) }, ms)
const read = () => p.evaluate(() => window.__tr)
const both = (tr) => tr.filter(([, tb, hd]) => tb != null && hd != null && tb > 0.08 && hd > 0.08)
await arm(1200); await p.click('[data-site-switch]'); await p.waitForTimeout(1300); const open = await read()
await arm(1200); await p.keyboard.press('Escape'); await p.waitForTimeout(1300); const esc = await read()
await p.click('[data-site-switch]'); await p.waitForTimeout(1300)
await arm(1400); await p.click('[data-site-card="synco"] [data-site-open]'); await p.waitForTimeout(1500); const pick = await read()
const sum = (tr) => ({ overlap: both(tr).length, tbGone: tr.find((x) => x[1] === 0)?.[0], headOn: tr.find((x) => x[2] != null && x[2] >= 0.99)?.[0], headOff: tr.find((x) => x[2] === 0)?.[0], tbBack: tr.find((x, i) => i > 3 && x[1] === 1)?.[0], samples: tr.filter((_, i) => i % 3 === 0).slice(0, 26).map((x) => `${x[0]}:${x[1]}/${x[2]}`).join(' ') })
console.log(JSON.stringify({ open: sum(open), esc: sum(esc), pick: sum(pick) }, null, 1))
await b.close()
