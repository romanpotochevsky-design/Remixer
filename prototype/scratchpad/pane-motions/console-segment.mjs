/* THE CONSOLE'S SEGMENTED CONTROL, filmed and photographed: open the console, shoot the «Canvas windows»
   group at rest (Unfold), pick Sheet and sample the capsule's left edge per frame, shoot it landed.
     CHROME=… node scratchpad/pane-motions/console-segment.mjs [BASE] */
import { chromium } from 'playwright'
const BASE = process.argv[2] || process.env.BASE || 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`${BASE}${BASE.endsWith('.html') ? '' : '/'}?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
await p.keyboard.press('Control+.'); await p.waitForTimeout(500)
const track = await p.$('[data-segmented="paneMotion"]')
await track.scrollIntoViewIfNeeded(); await p.waitForTimeout(300)
const box = await track.boundingBox()
const shot = (name) => p.screenshot({ path: `scratchpad/pane-motions/${name}`, clip: { x: box.x - 24, y: box.y - 40, width: box.width + 48, height: box.height + 64 } })
await shot('console-segment-unfold.png')
const flight = await p.evaluate(async () => {
  const track = document.querySelector('[data-segmented="paneMotion"]')
  const thumb = track.querySelector('[data-seg-thumb]'); const seats = [...track.querySelectorAll('button')]
  const seat = seats.map((s) => s.getBoundingClientRect().left)
  const xs = []; const t0 = performance.now()
  seats[1].click()
  await new Promise((r) => { const tick = () => { xs.push([Math.round(performance.now() - t0), +thumb.getBoundingClientRect().left.toFixed(1)]); if (performance.now() - t0 < 900) requestAnimationFrame(tick); else r() }; requestAnimationFrame(tick) })
  return { seat, xs }
})
console.log('seats at', flight.seat.map((v) => v.toFixed(1)).join(' · '))
console.log('thumb x by frame:', flight.xs.filter((_, i) => i % 2 === 0).map(([t, x]) => `${t}:${x}`).join(' '))
console.log('max', Math.max(...flight.xs.map((q) => q[1])), 'last', flight.xs[flight.xs.length - 1][1])
await shot('console-segment-sheet.png')
await b.close()
