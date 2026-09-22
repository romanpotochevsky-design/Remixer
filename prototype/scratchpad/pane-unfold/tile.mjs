/* The rail tile stays lit while the pane folds back into it (App.tsx `closingTile`). Film the tile's
   background through a close by Escape and by the button itself. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:5174'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
const film = (ms) => p.evaluate(async (ms) => {
  const btn = document.querySelector('nav.arrive-rail [aria-label="Cloud"]')
  const inset = (el) => { const m = getComputedStyle(el).clipPath.match(/inset\(([^)]*)\)/); return m ? Math.round(parseFloat(m[1].split(/\s+/)[3])) : null }
  const s = []; const t0 = performance.now()
  const tick = () => { const now = performance.now(); const pane = document.querySelector('[data-canvas-pane]')
    s.push({ t: Math.round(now - t0), tile: getComputedStyle(btn).backgroundColor, pressed: btn.getAttribute('aria-pressed'), clipL: pane ? inset(pane) : null, pane: pane ? +(+getComputedStyle(pane).opacity).toFixed(2) : null })
    if (now - t0 < ms) requestAnimationFrame(tick) }
  requestAnimationFrame(tick); await new Promise((r) => setTimeout(r, ms + 60)); return s
}, ms)
const key = (x) => `${x.tile}|${x.pressed}|${x.pane === null}`
const show = (label, s) => { console.log('==', label); for (const x of s.filter((x, i) => i === 0 || key(x) !== key(s[i - 1]) || i === s.length - 1)) console.log(x.t, x.tile, 'pressed', x.pressed, 'clipL', x.clipL, 'pane', x.pane) }
await p.evaluate(() => document.querySelector('nav.arrive-rail [aria-label="Cloud"]').click()); await p.waitForTimeout(1500)
const [, esc] = await Promise.all([p.keyboard.press('Escape'), film(900)]); show('close by Escape', esc)
await p.mouse.move(800, 800); await p.waitForTimeout(300)
await p.evaluate(() => document.querySelector('nav.arrive-rail [aria-label="Cloud"]').click()); await p.waitForTimeout(1500)
const [, tog] = await Promise.all([p.evaluate(() => document.querySelector('nav.arrive-rail [aria-label="Cloud"]').click()), film(900)]); show('close by the button', tog)
await b.close()
