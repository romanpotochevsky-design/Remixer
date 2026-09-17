/* The panel's SHRINK after Publish, frame by frame: height of the panel, presence of the green
   card, title. Prints the dip below the resting height (the bounce) and when the edge settles.
   Run against the served dist; `tag` names the build. */
import { chromium } from 'playwright'
const tag = process.argv[2] || 'x'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await p.goto('http://localhost:4173/?p=built&a=paid&d=ready&n=fit-ration.com&v=true&u=0&t=22&c=640', { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(400)
await p.click('header button:has-text("Publish")'); await p.waitForTimeout(1400)
const res = await p.evaluate(async () => {
  const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
  const btn = [...d.querySelectorAll('button')].find((b) => /^Publish to/.test(b.textContent.trim()))
  if (!btn) return { labels: [...d.querySelectorAll('button')].map((b) => b.textContent.trim().slice(0, 30)) }
  const samples = []
  const t0 = performance.now()
  const tick = () => {
    const now = performance.now()
    samples.push({ t: Math.round(now - t0), h: +d.getBoundingClientRect().height.toFixed(1), card: /is connected/.test(d.innerText), title: d.querySelector('h3')?.textContent.trim() })
    if (now - t0 < 4200) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  btn.click()
  await new Promise((r) => setTimeout(r, 4300))
  return { samples }
})
if (!res.samples) { console.log(tag, 'NO BUTTON', JSON.stringify(res)); await b.close(); process.exit(0) }
const s = res.samples
const h0 = s[0].h, hEnd = s[s.length - 1].h
const moving = s.filter((x) => Math.abs(x.h - h0) > 0.5)
const start = moving[0]
const minH = Math.min(...s.map((x) => x.h))
const minAt = s.find((x) => x.h === minH)
const settle = [...s].reverse().find((x) => Math.abs(x.h - hEnd) > 0.5)
const titleAt = s.find((x) => x.title === 'Published')
console.log(tag, JSON.stringify({ n: s.length, h0, hEnd, drop: +(h0 - hEnd).toFixed(1), startAt: start?.t, minH, minAt: minAt?.t, dip: +(minH - hEnd).toFixed(1), settledAt: settle ? settle.t : null, publishedAt: titleAt?.t }))
const keyframes = s.filter((x, i) => i === 0 || x.h !== s[i - 1].h || x.card !== s[i - 1].card || x.title !== s[i - 1].title)
console.log(tag, 'frames', JSON.stringify(keyframes.map((x) => [x.t, x.h, x.card ? 1 : 0]).filter((_, i) => i % 1 === 0)))
await b.close()
