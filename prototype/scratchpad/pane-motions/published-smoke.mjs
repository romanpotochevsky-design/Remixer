/* SMOKE ON THE PUBLISHED FILE (v103): the console shows the three motions; picking Sheet makes the next
   window arrive tagged as a sheet and travelling; picking Focus arrives in place; Unfold folds with a rim. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://127.0.0.1:4321/index.html'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
const errors = []; p.on('pageerror', (e) => errors.push(String(e)))
await p.goto(`${BASE}?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
const setMotion = async (label) => {
  await p.keyboard.press('Control+.'); await p.waitForTimeout(350)
  const row = await p.evaluate((label) => {
    const lab = [...document.querySelectorAll('[data-console] label')].find((l) => l.textContent.trim() === 'Window motion')
    const r = lab?.parentElement?.nextElementSibling
    const btns = r ? [...r.querySelectorAll('button')] : []
    const b = btns.find((x) => x.textContent.trim() === label); b?.click()
    return btns.map((x) => x.textContent.trim())
  }, label)
  await p.waitForTimeout(150); await p.keyboard.press('Control+.'); await p.waitForTimeout(350)
  return row
}
const bbox = async (label) => (await p.$(`nav.arrive-rail [aria-label="${label}"]`)).boundingBox()
const snap = () => p.evaluate(() => [...document.querySelectorAll('[data-canvas-pane]')].map((e) => { const m = getComputedStyle(e).transform.match(/matrix\(([^)]+)\)/); const a = m ? m[1].split(',').map(Number) : null; return { motion: e.dataset.paneMotion, o: +getComputedStyle(e).opacity, s: a ? +a[0].toFixed(3) : 1, y: a ? Math.round(a[5]) : 0, rim: !!e.querySelector('[data-pane-rim]') } }))
const out = {}
out.row = await setMotion('Sheet')
let c = await bbox('Cloud'); await p.mouse.click(c.x + 12, c.y + 12); await p.waitForTimeout(90); out.sheetEarly = await snap(); await p.waitForTimeout(900); out.sheetLanded = await snap()
await p.keyboard.press('Escape'); await p.waitForTimeout(700)
await setMotion('Focus'); c = await bbox('Cloud'); await p.mouse.click(c.x + 12, c.y + 12); await p.waitForTimeout(90); out.focusEarly = await snap(); await p.waitForTimeout(600); out.focusLanded = await snap()
await p.keyboard.press('Escape'); await p.waitForTimeout(600)
await setMotion('Unfold'); c = await bbox('Cloud'); await p.mouse.click(c.x + 12, c.y + 12); await p.waitForTimeout(120); out.unfoldEarly = await snap(); await p.waitForTimeout(800); out.unfoldLanded = await snap()
await p.keyboard.press('Escape'); await p.waitForTimeout(600)
out.panesLeft = (await p.$$('[data-canvas-pane]')).length; out.errors = errors
console.log(JSON.stringify(out, null, 1))
await b.close()
