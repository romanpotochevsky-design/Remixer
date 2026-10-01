/** Dock flight trajectory, new build vs old: rAF-sampled in the page from the click, plus the suite's own polling. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173/'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
for (let run = 0; run < 3; run++) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  await page.goto(BASE + '?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await page.click('.home-card-face')
  await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
  await page.waitForTimeout(800)
  const bb = await page.$eval('[data-ve-bar]', (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y } })
  await page.mouse.move(bb.x + 20, bb.y + 20); await page.waitForTimeout(500)
  const from = await page.evaluate(() => { const r = document.querySelector('[data-ve-bar] [data-ve-glass]').getBoundingClientRect(); return { x: Math.round(r.x), w: Math.round(r.width) } })
  await page.evaluate(() => {
    window.__tr = []; window.__t0 = 0
    document.addEventListener('pointerdown', () => { window.__t0 = performance.now() }, { capture: true, once: true })
    const tick = () => {
      const f = document.querySelector('[data-ve-flight]')
      if (window.__t0) { const r = f?.getBoundingClientRect(); window.__tr.push([Math.round(performance.now() - window.__t0), r ? Math.round(r.x) : null, r ? Math.round(r.width) : null]) }
      if (window.__tr.length < 80) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  await page.click('[data-ve-dock-to-rail]')
  const poll = []
  for (let i = 0; i < 6; i++) { await page.waitForTimeout(25); poll.push(await page.evaluate(() => { const f = document.querySelector('[data-ve-flight]'); if (!f) return null; const r = f.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.width)] })) }
  await page.waitForTimeout(800)
  const tr = await page.evaluate(() => window.__tr)
  const firstFlight = tr.find((s) => s[1] !== null)
  console.log(`run ${run}: from ${JSON.stringify(from)} · first flight frame ${JSON.stringify(firstFlight)} · frames ${tr.slice(0, 8).map((s) => s.join('/')).join(' ')} · poll ${JSON.stringify(poll.filter(Boolean).slice(0, 3))}`)
  await page.close()
}
await browser.close()
