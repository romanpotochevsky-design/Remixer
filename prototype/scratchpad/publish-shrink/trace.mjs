import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await p.goto('http://localhost:4173/?p=built&a=paid&d=ready&n=fit-ration.com&v=true&u=0&t=22&c=640', { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(400)
await p.click('header button:has-text("Publish")'); await p.waitForTimeout(1200)
const res = await p.evaluate(async () => {
  const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
  const btn = [...d.querySelectorAll('button')].find((b) => /^Publish to/.test(b.textContent.trim()))
  const labels = [...d.querySelectorAll('button')].map((b) => b.textContent.trim().slice(0, 30))
  if (!btn) return { labels }
  const samples = []
  const t0 = performance.now()
  const errors = []
  const tick = () => { try { const now = performance.now(); const card = d.querySelector('.shimmer-card') || [...d.querySelectorAll('div')].find((e) => /is connected/.test(e.textContent) && String(e.className).includes('rounded-[12px]')); samples.push({ t: Math.round(now - t0), h: +d.getBoundingClientRect().height.toFixed(1), card: card ? +getComputedStyle(card).opacity.toFixed(2) : null, title: d.querySelector('h3')?.textContent.trim() }); if (now - t0 < 3600) requestAnimationFrame(tick) } catch (e) { errors.push(String(e)); window.__errs = errors } }
  requestAnimationFrame(tick)
  btn.click()
  await new Promise((r) => setTimeout(r, 3700))
  return { samples, labels, n: samples.length, errors: window.__errs }
})
if (!res.samples) { console.log('NO BUTTON', JSON.stringify(res)); process.exit(0) }
const arr = res.samples
const changes = arr.filter((s, i) => i === 0 || s.h !== arr[i - 1].h || s.title !== arr[i - 1].title || s.card !== arr[i - 1].card)
console.log('samples', res.n, 'labels', JSON.stringify(res.labels))
console.log(JSON.stringify(changes))
await b.close()
