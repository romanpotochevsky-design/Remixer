import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await p.goto('http://localhost:4173/?p=built&a=paid&d=ready&n=fit-ration.com&v=true&u=0&t=22&c=640', { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(400)
await p.click('header button:has-text("Publish")'); await p.waitForTimeout(1200)
const a = await p.evaluate(async () => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 < 500) requestAnimationFrame(tick) }; requestAnimationFrame(tick); await new Promise((r) => setTimeout(r, 600)); return n })
console.log('loop without click:', a)
const c = await p.evaluate(async () => {
  const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
  let n = 0; const hs = []; const t0 = performance.now()
  const tick = () => { n++; hs.push([Math.round(performance.now() - t0), +d.getBoundingClientRect().height.toFixed(1), d.querySelector('h3')?.textContent]); if (performance.now() - t0 < 3600) requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
  ;[...d.querySelectorAll('button')].find((b) => /^Publish to/.test(b.textContent.trim())).click()
  await new Promise((r) => setTimeout(r, 3700))
  return { n, changes: hs.filter((s, i) => i === 0 || s[1] !== hs[i - 1][1] || s[2] !== hs[i - 1][2]) }
})
console.log('loop with click:', c.n)
console.log(JSON.stringify(c.changes))
await b.close()
