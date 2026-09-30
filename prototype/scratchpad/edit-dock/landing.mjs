/* the hand-over from the flight clone to the pill: pixel diff of the region right before / after */
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const page = await b.newPage({ viewport: { width: 1600, height: 900 } })
await page.goto('http://localhost:4173/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('remixer-prototype/world/v6'))
await page.waitForTimeout(400); await page.click('.home-card-face')
await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await page.waitForSelector('[data-ve-bar]'); await page.waitForTimeout(800)
const bb = await (await page.$('[data-ve-bar]')).boundingBox()
await page.mouse.move(bb.x + 20, bb.y + 20); await page.waitForTimeout(900)
await page.click('[data-ve-dock-to-rail]'); await page.waitForTimeout(1600)
const db = await (await page.$('[data-ve-dock]')).boundingBox()
await page.mouse.move(db.x + 24, db.y + 24); await page.waitForTimeout(700)
// freeze time near the end of the return flight: sample DOM each frame and grab shots when the clone is nearly settled
await page.click('[data-ve-undock]')
const geo = () => page.evaluate(() => {
  const r = (e) => { if (!e) return null; const q = e.getBoundingClientRect(); return [Math.round(q.x * 10) / 10, Math.round(q.y * 10) / 10, Math.round(q.width * 10) / 10, Math.round(q.height * 10) / 10] }
  const f = document.querySelector('[data-ve-flight]'); const bar = document.querySelector('[data-ve-bar]')
  if (f) { const svgs = f.querySelectorAll('svg'); return { who: 'flight', box: r(f), t: r(svgs[0]), sel: r(svgs[1]), selO: getComputedStyle(svgs[1].parentElement).opacity } }
  if (bar && getComputedStyle(bar).visibility === 'visible') { const g = bar.querySelector('[data-ve-glass]'); const svgs = bar.querySelectorAll('[data-ve-tool] svg'); return { who: 'pill', box: r(g), t: r(svgs[0]), sel: r(svgs[1]), selO: getComputedStyle(svgs[1]).opacity } }
  return null
})
const frames = []
for (let i = 0; i < 90; i++) { await page.waitForTimeout(16); const g = await geo(); if (g) frames.push(g); if (g && g.who === 'pill') break }
const lastF = frames.filter((f) => f.who === 'flight').at(-1); const firstP = frames.find((f) => f.who === 'pill')
console.log('flight frames', frames.filter((f) => f.who === 'flight').length)
console.log('last clone', JSON.stringify(lastF)); console.log('first pill', JSON.stringify(firstP))
const dev = (a, b) => a && b ? Math.max(...a.map((v, i) => Math.abs(v - b[i]))) : 99
console.log('hand-over max deviation: box', dev(lastF.box, firstP.box), 'T', dev(lastF.t, firstP.t), 'Select', dev(lastF.sel, firstP.sel), 'selO', lastF.selO, firstP.selO)
// the drop: widest mid-flight box vs its straight lerp
const mid = frames.filter((f) => f.who === 'flight'); const widths = mid.map((f) => f.box[2]); console.log('widths', widths.join(' '))
await b.close()
