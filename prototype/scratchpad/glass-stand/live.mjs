// The lit chip on the real build: the Publish panel's domain row (amber / blue / green / red)
// and the brief's Recommended chip, at 3× — plus the computed paint the suite will assert.
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
const FF = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
const OUT = new URL('./live/', import.meta.url).pathname
import { mkdirSync } from 'node:fs'; mkdirSync(OUT, { recursive: true })
const BASE = 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 3 })
const p = await ctx.newPage()
const openPublish = async (q) => {
  await p.goto(`${BASE}?${q}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
  await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(400)
  await p.click('header button:has-text("Publish")'); await p.waitForTimeout(900)
}
const shots = []
for (const [q, name] of [
  ['p=built&a=paid&d=ready&k=true&n=fit-ration.net&v=false&u=0', 'amber'],
  ['p=built&a=paid&d=ready&n=fit-ration.net&v=false&u=0', 'blue'],
  ['p=built&a=paid&d=live&n=fit-ration.net&v=true&u=0', 'green'],
  ['p=built&a=paid&d=unreachable&n=fit-ration.net&v=true&u=0', 'red'],
]) {
  await openPublish(q)
  const row = await p.$('[role="dialog"][aria-label="Publish"] button:has-text("Unlink")')
  const rowEl = await row.evaluateHandle((b) => b.parentElement)
  await rowEl.asElement().screenshot({ path: `${OUT}row-${name}.png` })
  const facts = await p.evaluate(() => {
    const el = document.querySelector('[role="dialog"][aria-label="Publish"] .liquid-glass--chip[data-tone]')
    const cs = getComputedStyle(el), rim = getComputedStyle(el, '::before')
    return { tone: el.dataset.tone, fill: cs.backgroundColor, rimRadials: (rim.backgroundImage.match(/radial-gradient\(/g) || []).length,
      rimHasWhite: /rgba\(255, 255, 255|rgb\(255, 255, 255\)/.test(rim.backgroundImage), rimSample: rim.backgroundImage.slice(0, 160) }
  })
  console.log(name, JSON.stringify(facts))
  shots.push(`${OUT}row-${name}.png`)
  await p.keyboard.press('Escape'); await p.waitForTimeout(300)
}
// the Recommended chip — Autopilot's first proposal via the console preset
await p.goto(`${BASE}?p=built&h=long&a=paid&c=900`, { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(400)
await p.keyboard.press('Control+.'); await p.waitForTimeout(400)
await p.click('button:has-text("Autopilot — the first proposal")'); await p.waitForTimeout(300)
await p.keyboard.press('Control+.'); await p.waitForTimeout(1200)
const rec = await p.$('.liquid-glass--chip:not([data-tone])')
if (rec) {
  const rowH = await rec.evaluateHandle((c) => c.closest('button, li, [role="radio"]') || c.parentElement)
  await rowH.asElement().screenshot({ path: `${OUT}recommended-row.png` })
  const facts = await p.evaluate(() => {
    const el = document.querySelector('.liquid-glass--chip:not([data-tone])')
    const cs = getComputedStyle(el), rim = getComputedStyle(el, '::before')
    return { fill: cs.backgroundColor, bgImg: cs.backgroundImage.slice(0, 90), shadow: cs.boxShadow, rimRadials: (rim.backgroundImage.match(/radial-gradient\(/g) || []).length, buttonRim: /to right bottom/.test(rim.backgroundImage) }
  })
  console.log('recommended', JSON.stringify(facts))
} else console.log('no Recommended chip found')
await b.close()
execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...shots.flatMap((f) => ['-i', f]), '-filter_complex', '[0]pad=1300:ih:0:0:0x1f1f22[a];[1]pad=1300:ih:0:0:0x1f1f22[b];[2]pad=1300:ih:0:0:0x1f1f22[c];[3]pad=1300:ih:0:0:0x1f1f22[d];[a][b][c][d]vstack=4', `${OUT}rows.png`])
console.log('ok')
