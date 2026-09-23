/* Reads the REAL pixels of the menu gutter down the column: proof that the board's two stops
   land where the export said, on the built file rather than in arithmetic. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const at = (q) => `${BASE}${BASE.includes('?') ? '&' : '?'}${q}`

const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const p = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage()
await p.goto(at('p=built&v=true&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'), { waitUntil: 'networkidle' })
await p.waitForTimeout(700)
await p.click('.home-card-face')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await p.waitForTimeout(500)
await p.click('nav.arrive-rail [aria-label="Cloud"]')
await p.waitForTimeout(1400)

const nav = await p.$eval('nav[aria-label="Cloud menu"]', (n) => { const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })
const shot = (await p.screenshot({ clip: { x: nav.x, y: nav.y, width: 6, height: nav.h } })).toString('base64')
const px = await p.evaluate(async ({ shot, h }) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + shot
  await img.decode()
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
  c.getContext('2d').drawImage(img, 0, 0)
  const g = c.getContext('2d')
  const out = []
  for (const frac of [0, .25, .5, .75, .8745, .92, .96, .999]) {
    const y = Math.min(img.height - 1, Math.round((img.height - 1) * frac))
    const d = g.getImageData(3, y, 1, 1).data
    out.push({ at: +(frac * 100).toFixed(2) + '%', y: Math.round(frac * (h - 1)), rgb: `${d[0]},${d[1]},${d[2]}` })
  }
  return out
}, { shot, h: nav.h })
console.log('menu gutter, top → bottom:')
for (const s of px) console.log('  ', s.at.padStart(7), 'y=' + String(s.y).padStart(4), '→ rgb(' + s.rgb + ')')
console.log('\nwant: rgb(20,20,23) #141417 flat to 87.455%, then ramp to rgb(29,29,32) #1d1d20')
await b.close()
