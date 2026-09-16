/* Frame trace of the Connect press: the Domains window leaving, the site returning, the Publish
   panel arriving. Run against the served dist; `tag` names the build. */
import { chromium } from 'playwright'
const tag = process.argv[2] || 'x'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('http://localhost:4173/?p=built&v=true&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(500)
await p.evaluate(() => [...document.querySelectorAll('header button')].find((e) => /remixer\.ai/.test(e.innerText)).click())
await p.waitForTimeout(900)
await p.locator('button:has-text("Connect")').first().click()
await p.waitForTimeout(900)
const res = await p.evaluate(async () => {
  const main = document.querySelector('main')
  const win = () => [...main.querySelectorAll('span')].find((s) => s.textContent.trim() === 'Domains')?.closest('main > *')
  const samples = []
  const t0 = performance.now()
  const tick = () => {
    const now = performance.now()
    const w = win()
    const site = document.querySelector('.site-stage')
    const sheet = [...document.querySelectorAll('[role="dialog"]')].find((d) => /Connect domain/.test(d.textContent))
    const panel = document.querySelector('[role="dialog"][aria-label="Publish"]')
    samples.push({ t: Math.round(now - t0), win: w ? +(+getComputedStyle(w).opacity).toFixed(2) : null, site: site ? +(+getComputedStyle(site.parentElement).opacity).toFixed(2) : null, sheet: sheet ? +(+getComputedStyle(sheet).opacity).toFixed(2) : null, panel: panel ? +(+getComputedStyle(panel).opacity).toFixed(2) : null })
    if (now - t0 < 1400) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  ;[...document.querySelectorAll('[role="dialog"] button')].filter((b) => /Connect domain/.test(b.textContent)).pop().click()
  await new Promise((r) => setTimeout(r, 1500))
  return samples
})
const keyframes = res.filter((s, i) => i === 0 || JSON.stringify([s.win, s.site, s.sheet, s.panel]) !== JSON.stringify([res[i - 1].win, res[i - 1].site, res[i - 1].sheet, res[i - 1].panel]))
console.log(tag, JSON.stringify(keyframes))
await b.close()
