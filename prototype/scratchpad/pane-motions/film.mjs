/* Contact sheets for the designer: the three motions, OPEN / SWITCH / CLOSE, one strip each — 8 stills
   taken during the real animation (software rasteriser; frames land a little late, the numbers are in
   trace.mjs). CHROME=… node scratchpad/pane-motions/film.mjs [motion] */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { writeFileSync } from 'node:fs'
const BASE = process.env.BASE || 'http://localhost:4173'
const MOTIONS = process.argv[2] ? [process.argv[2]] : ['unfold', 'sheet', 'focus']
const OUT = 'scratchpad/pane-motions'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
const setMotion = async (m) => {
  await p.keyboard.press('Control+.'); await p.waitForTimeout(350)
  const label = { unfold: 'Unfold', sheet: 'Sheet', focus: 'Focus' }[m]
  await p.evaluate((label) => { [...document.querySelectorAll('[data-console] button')].find((b) => b.textContent.trim() === label).click() }, label)
  await p.waitForTimeout(150); await p.keyboard.press('Control+.'); await p.waitForTimeout(350)
}
const bbox = async (label) => (await p.$(`nav.arrive-rail [aria-label="${label}"]`)).boundingBox()
/* the canvas region only: from the chat resizer to the rail */
const CLIP = { x: 540, y: 52, width: 1000, height: 848 }
const strip = async (name, act, times) => {
  const shots = []
  const t0 = Date.now()
  await act()
  for (const t of times) {
    const wait = t - (Date.now() - t0); if (wait > 0) await p.waitForTimeout(wait)
    shots.push({ t, buf: await p.screenshot({ clip: CLIP, type: 'jpeg', quality: 80 }) })
  }
  shots.forEach((sh, i) => writeFileSync(`${OUT}/raw-${name}-${i}-${sh.t}.jpg`, sh.buf))
  console.log('shot', name, times.join('/'))
}
for (const m of MOTIONS) {
  await setMotion(m)
  const cloud = await bbox('Cloud'), an = await bbox('Analytics')
  await strip(`${m}-open`, () => p.mouse.click(cloud.x + 12, cloud.y + 12), [0, 60, 120, 200, 300, 420, 600, 1000])
  await p.mouse.move(800, 800); await p.waitForTimeout(500)
  await strip(`${m}-switch`, () => p.mouse.click(an.x + 24, an.y + 24), [0, 60, 120, 200, 300, 420, 600, 1000])
  await p.mouse.move(800, 800); await p.waitForTimeout(500)
  await strip(`${m}-close`, () => p.mouse.click(an.x + 36, an.y + 36), [0, 60, 120, 180, 240, 320, 450, 800])
  await p.mouse.move(800, 800); await p.waitForTimeout(600)
}
await b.close()
