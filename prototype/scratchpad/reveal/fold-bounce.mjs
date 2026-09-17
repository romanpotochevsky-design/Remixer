/* The in-flight card's explanation folding by hand (the chevron) — the panel's height frame by
   frame, so the suite's numbers for the fold (dip, settle) are measured, not guessed. */
import { chromium } from 'playwright'
const tag = process.argv[2] || 'x'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await p.goto('http://localhost:4173/?p=built&a=paid&d=connecting&k=true&n=fit-ration.net&v=false&u=0&t=22&c=640', { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(400)
await p.click('header button:has-text("Publish")'); await p.waitForTimeout(1200)
await p.keyboard.press('Control+.'); await p.waitForTimeout(500)
const fold = await p.evaluate(async () => {
  const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
  const btn = [...document.querySelectorAll('[data-console] button')].find((b) => b.textContent.trim() === 'Propagating (bought)')
  btn.click()
  await new Promise((r) => setTimeout(r, 6300))
  const chevron = d.querySelector('.shimmer-card button[aria-expanded]')
  chevron.click()
  await new Promise((r) => setTimeout(r, 1200))
  const samples = []
  const t0 = performance.now()
  const tick = () => { const now = performance.now(); samples.push({ t: Math.round(now - t0), h: +d.getBoundingClientRect().height.toFixed(1) }); if (now - t0 < 1400) requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
  chevron.click()
  await new Promise((r) => setTimeout(r, 1500))
  return { samples, expanded: chevron.getAttribute('aria-expanded'), letter: /One last step/.test(d.innerText) }
})
const s = fold.samples
const end = s[s.length - 1].h
const settle = [...s].reverse().find((x) => Math.abs(x.h - end) > 1)
const minH = Math.min(...s.map((x) => x.h))
console.log(tag, JSON.stringify({ from: s[0].h, to: end, minH, dip: +(minH - end).toFixed(1), minAt: s.find((x) => x.h === minH)?.t, lastMovingAt: settle?.t, expanded: fold.expanded, letter: fold.letter }))
console.log(tag, JSON.stringify(s.filter((x, i) => i === 0 || x.h !== s[i - 1].h).map((x) => [x.t, x.h])))
await b.close()
