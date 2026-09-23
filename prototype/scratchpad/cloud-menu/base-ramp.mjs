/* Samples the Cloud window's menu column down its height and crops the foot the designer
   photographed, so the board's `#141417 87.455% → #1d1d20` can be checked on the real build
   instead of trusted from the export. */
import { chromium } from 'playwright'

const BASE = process.env.BASE || 'http://localhost:4173'
const at = (q) => `${BASE}${BASE.includes('?') ? '&' : '?'}${q}`
const OUT = process.env.OUT || 'scratchpad/cloud-menu'

const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()

await p.goto(at('p=built&v=true&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'), { waitUntil: 'networkidle' })
await p.waitForTimeout(700)
await p.click('.home-card-face')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await p.waitForTimeout(500)
await p.click('nav.arrive-rail [aria-label="Cloud"]')
await p.waitForTimeout(1400)

const nav = await p.$eval('nav[aria-label="Cloud menu"]', (n) => {
  const r = n.getBoundingClientRect()
  return { x: r.x, y: r.y, w: r.width, h: r.height, bg: getComputedStyle(n).backgroundImage }
})
const win = await p.$eval('[data-cloud-window]', (n) => {
  const r = n.getBoundingClientRect()
  return { x: r.x, y: r.y, w: r.width, h: r.height, bg: getComputedStyle(n).background.slice(0, 60) }
})
console.log('nav  ', JSON.stringify({ ...nav, bg: nav.bg.replace(/\s+/g, ' ') }))
console.log('window', JSON.stringify(win))
console.log('ramp starts at', (nav.h * 0.87455).toFixed(1), 'px of', nav.h.toFixed(1), '→ ramp is', (nav.h * 0.12545).toFixed(1), 'px tall')

/* read the real pixels: a column 4 px left of the card (bare gutter) top → bottom */
const png = await p.screenshot({ clip: { x: nav.x, y: nav.y, width: 8, height: nav.h } })
const { createCanvas, loadImage } = await import('canvas').catch(() => ({}))
if (!createCanvas) {
  // no canvas module — sample through the DOM instead, with a probe element
  const samples = await p.evaluate(({ x, y, h }) => {
    const out = []
    for (let i = 0; i <= 10; i++) {
      const yy = y + (h - 1) * (i / 10)
      const el = document.elementFromPoint(x + 3, yy)
      out.push([Math.round(yy - y), el?.getAttribute('aria-label') || el?.tagName])
    }
    return out
  }, nav)
  console.log('gutter hit-test', JSON.stringify(samples))
}

await p.screenshot({ path: `${OUT}/base-foot.png`, clip: { x: win.x, y: win.y + win.h - 320, width: 620, height: 320 } })
await p.screenshot({ path: `${OUT}/base-window.png`, clip: { x: win.x, y: win.y, width: Math.min(900, win.w), height: win.h } })
console.log('shots → base-foot.png (the crop he photographed) · base-window.png')
await b.close()
