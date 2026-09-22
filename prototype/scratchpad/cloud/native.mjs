import { chromium } from 'playwright'
const BASE = 'http://localhost:5174'
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 2480, height: 1172 }, deviceScaleFactor: 1 })
const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('PAGEERROR', e.message))
await p.goto(`${BASE}?p=built&v=true&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(700)
await p.click('.home-card-face')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await p.waitForTimeout(500)
await p.click('nav.arrive-rail [aria-label="Cloud"]')
await p.waitForTimeout(1200)
await p.mouse.move(1240, 1160)
await p.waitForTimeout(200)
const win = await p.$('[data-cloud-window]')
const box = await win.boundingBox()
console.log('window box', JSON.stringify(box))
await win.screenshot({ path: '/tmp/mine-window.png' })
await p.screenshot({ path: '/tmp/mine-top.png', clip: { x: box.x, y: box.y, width: box.width, height: 190 } })
// tones, straight off the composited pixels
const tone = await p.evaluate(() => {
  const g = (s, prop = 'backgroundColor') => { const e = document.querySelector(s); return e ? getComputedStyle(e)[prop] : null }
  const win = document.querySelector('[data-cloud-window]')
  return {
    winBg: getComputedStyle(win).backgroundImage.slice(0, 90),
    page: g('[data-cloud-window] nav + div > div:nth-child(2)'),
    pageBorder: g('[data-cloud-window] nav + div > div:nth-child(2)', 'borderTopColor'),
    pageRadius: g('[data-cloud-window] nav + div > div:nth-child(2)', 'borderTopRightRadius'),
    menuCard: g('[data-cloud-menu]'),
  }
})
console.log(JSON.stringify(tone, null, 1))
await b.close()
