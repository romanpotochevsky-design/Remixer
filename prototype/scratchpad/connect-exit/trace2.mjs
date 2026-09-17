/* The Connect hand-over, second film: window opacity+scale, site opacity, Publish panel
   opacity+scale, glint element presence. Run against the served dist; `tag` names the build. */
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
  const scaleOf = (el) => { const m = getComputedStyle(el).transform; if (!m || m === 'none') return 1; const a = m.match(/matrix\(([^)]+)\)/); return a ? +(+a[1].split(',')[0]).toFixed(4) : 1 }
  const samples = []
  const t0 = performance.now()
  const tick = () => {
    const now = performance.now()
    const w = win()
    const site = document.querySelector('.site-stage')
    const panel = document.querySelector('[role="dialog"][aria-label="Publish"]')
    const glint = panel?.querySelector('.glass-glint')
    samples.push({ t: Math.round(now - t0), win: w ? +(+getComputedStyle(w).opacity).toFixed(2) : null, winS: w ? scaleOf(w) : null, site: site ? +(+getComputedStyle(site.parentElement).opacity).toFixed(2) : null, panel: panel ? +(+getComputedStyle(panel).opacity).toFixed(2) : null, panelS: panel ? scaleOf(panel) : null, glint: glint ? +(+getComputedStyle(glint).opacity).toFixed(2) : null })
    if (now - t0 < 1700) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  ;[...document.querySelectorAll('[role="dialog"] button')].filter((b) => /Connect domain/.test(b.textContent)).pop().click()
  await new Promise((r) => setTimeout(r, 1800))
  return samples
})
const key = (s) => JSON.stringify([s.win, s.winS, s.site, s.panel, s.panelS, s.glint])
const keyframes = res.filter((s, i) => i === 0 || key(s) !== key(res[i - 1]))
const panelFrames = res.filter((s) => s.panelS !== null)
const maxScale = Math.max(...panelFrames.map((s) => s.panelS))
const glintPeak = Math.max(...res.map((s) => s.glint ?? 0))
console.log(tag, JSON.stringify({ frames: res.length, panelFirstAt: panelFrames[0]?.t, panelScaleFirst: panelFrames[0]?.panelS, maxScale, maxScaleAt: panelFrames.find((s) => s.panelS === maxScale)?.t, lastScale: panelFrames[panelFrames.length - 1]?.panelS, glintPeak, glintPeakAt: res.find((s) => s.glint === glintPeak)?.t, winFrames: res.filter((s) => s.win !== null).length, winLastScale: res.filter((s) => s.win !== null).pop()?.winS }))
console.log(tag, JSON.stringify(keyframes.map((s) => [s.t, s.win, s.winS, s.site, s.panel, s.panelS, s.glint])))
await b.close()
