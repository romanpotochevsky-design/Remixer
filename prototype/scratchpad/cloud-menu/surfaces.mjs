/* Reads the REAL pixel of every surface of the Cloud window, so a comparison with the board is
   made on numbers instead of on two screenshots' colour handling. */
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
await p.waitForTimeout(1500)

const box = (sel) => p.$eval(sel, (n) => { const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })
const win = await box('[data-cloud-window]')
const card = await box('[data-cloud-menu]')

const shot = (await p.screenshot({ clip: { x: win.x, y: win.y, width: win.w, height: win.h } })).toString('base64')
const px = await p.evaluate(async ({ shot, win, card }) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + shot
  await img.decode()
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
  const g = c.getContext('2d'); g.drawImage(img, 0, 0)
  const at = (x, y) => { const d = g.getImageData(Math.round(x), Math.round(y), 1, 1).data; return `rgb(${d[0]},${d[1]},${d[2]})` }
  const rel = (X, Y) => at(X - win.x, Y - win.y)
  return {
    'menu card (middle)': rel(card.x + card.w / 2, card.y + card.h * 0.75),
    'menu gutter (left of card)': rel(win.x + 4, win.y + win.h * 0.5),
    'page sheet (empty, below rows)': rel(win.x + win.w * 0.6, win.y + win.h * 0.8),
    'page sheet (beside the title)': rel(win.x + win.w * 0.55, win.y + 120),
    'top bar strip (right of menu)': rel(win.x + win.w * 0.6, win.y + 20),
  }
}, { shot, win, card })
console.log('window', JSON.stringify(win), '\ncard  ', JSON.stringify(card), '\n')
for (const [k, v] of Object.entries(px)) console.log(k.padEnd(32), v)
await b.close()
