// THE TOOLTIP ON THE STATUS CHIP — a live probe on the built prototype (16.09.2026).
// Hover the chip in the Publish panel's domain row; read the bubble's geometry, material,
// the entrance frame by frame and the exit; shoot it at 3× for the designer.
import { chromium } from 'playwright'
const OUT = new URL('./live/', import.meta.url).pathname
const BASE = 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 3 })
const p = await ctx.newPage()
const CHIP = '[role="dialog"][aria-label="Publish"] .liquid-glass--chip[data-tone]'
const open = async (q) => {
  await p.goto(`${BASE}?p=built&a=paid&u=0&${q}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
  await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(400)
  await p.click('header button:has-text("Publish")'); await p.waitForTimeout(900)
}
const readTip = () => p.evaluate((sel) => {
  const el = document.querySelector('[role="tooltip"]'); if (!el) return null
  const chip = document.querySelector(sel).getBoundingClientRect()
  const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); const host = el.parentElement
  const rim = el.querySelector('.tip-rim-line')
  return {
    text: el.innerText.trim(), w: +r.width.toFixed(1), h: +r.height.toFixed(1),
    tipToChip: +(chip.top - r.bottom).toFixed(1), centreDx: +((r.left + r.width / 2) - (chip.left + chip.width / 2)).toFixed(1),
    clip: cs.clipPath.slice(0, 40), blur: cs.backdropFilter, bg: cs.backgroundColor, opacity: cs.opacity, origin: cs.transformOrigin,
    rimStroke: rim ? getComputedStyle(rim).stroke.slice(0, 30) : null, inDialog: !!el.closest('[role="dialog"]'),
    hostZ: getComputedStyle(host).zIndex, hostPE: getComputedStyle(host).pointerEvents, side: el.dataset.side,
    styleW: el.style.width, styleH: el.style.height,
  }
}, CHIP)

const results = {}
for (const [name, q] of [['live', 'd=live&n=fitration.shop&v=true'], ['ready', 'd=ready&n=fitration.shop&v=false'], ['waiting', 'd=ready&k=true&n=fitration.shop&v=false'], ['unreachable', 'd=unreachable&n=fitration.shop&v=true']]) {
  await open(q)
  const before = await p.evaluate(() => document.querySelectorAll('[role="tooltip"]').length)
  await p.hover(CHIP)
  await p.waitForTimeout(150)
  const early = await p.evaluate(() => document.querySelectorAll('[role="tooltip"]').length)
  // frames of the entrance: sample from just before it shows
  const frames = await p.evaluate(() => new Promise((res) => {
    const out = []; const t0 = performance.now()
    const tick = () => {
      const el = document.querySelector('[role="tooltip"]')
      if (el) { const cs = getComputedStyle(el); const m = cs.transform === 'none' ? null : new DOMMatrix(cs.transform); out.push({ t: Math.round(performance.now() - t0), s: m ? +m.a.toFixed(3) : 1, o: +(+cs.opacity).toFixed(2) }) }
      if (performance.now() - t0 < 900) requestAnimationFrame(tick); else res(out)
    }
    requestAnimationFrame(tick)
  }))
  const tip = await readTip()
  // shoot the row with the bubble above it, 3×
  const row = await p.evaluateHandle((sel) => document.querySelector(sel).closest('.rounded-\\[16px\\]'), CHIP)
  const rb = await row.asElement().boundingBox()
  await p.screenshot({ path: `${OUT}${name}.png`, clip: { x: rb.x - 8, y: rb.y - 64, width: rb.width + 16, height: rb.height + 72 } })
  // leave
  await p.mouse.move(20, 20)
  const exitFrames = await p.evaluate(() => new Promise((res) => {
    const out = []; const t0 = performance.now()
    const tick = () => {
      const el = document.querySelector('[role="tooltip"]')
      if (el) { const cs = getComputedStyle(el); const m = cs.transform === 'none' ? null : new DOMMatrix(cs.transform); out.push({ t: Math.round(performance.now() - t0), s: m ? +m.a.toFixed(3) : 1, o: +(+cs.opacity).toFixed(2) }) } else out.push({ t: Math.round(performance.now() - t0), gone: true })
      if (performance.now() - t0 < 400) requestAnimationFrame(tick); else res(out)
    }
    requestAnimationFrame(tick)
  }))
  const panelStillOpen = await p.$('[role="dialog"][aria-label="Publish"]')
  results[name] = { before, early, tip, entrance: frames.filter((f, i) => i % 2 === 0).slice(0, 18), peak: Math.max(...frames.map((f) => f.s)), last: frames.at(-1), exit: exitFrames.filter((f, i) => i % 2 === 0).slice(0, 12), panelStillOpen: !!panelStillOpen }
}
console.log(JSON.stringify(results, null, 1))
await b.close()
