import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:5174'
const W = +(process.env.W || 1600), H = +(process.env.H || 900)
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('PAGEERROR', e.message))
await p.goto(`${BASE}?p=built&v=true&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(700)
await p.click('.home-card-face')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await p.waitForTimeout(600)
await p.screenshot({ path: '/tmp/cloud-0-rail.png' })
await p.click('[aria-label="Cloud"]')
await p.waitForTimeout(900)
await p.screenshot({ path: '/tmp/cloud-1-window.png' })

const m = await p.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) } }
  const win = document.querySelector('[data-cloud-window]')
  const menu = win?.querySelector('nav')
  const rows = [...win.querySelectorAll('[data-cloud-window] nav + div')]
  const g = (e) => getComputedStyle(e)
  const railBtn = [...document.querySelectorAll('nav[class*="arrive-rail"] button')]
  return {
    win: r('[data-cloud-window]'),
    winBg: g(win).backgroundColor, winRadius: g(win).borderRadius, winBorder: g(win).borderColor,
    menu: menu ? { x: menu.getBoundingClientRect().x, w: menu.getBoundingClientRect().width } : null,
    menuCard: (() => { const e = menu.querySelector('div'); const b = e.getBoundingClientRect(); return { w: +b.width.toFixed(1), r: g(e).borderRadius, bg: g(e).backgroundColor, sh: g(e).boxShadow } })(),
    rail: railBtn.map((e) => ({ label: e.getAttribute('aria-label'), bg: g(e).backgroundColor, color: g(e).color, w: e.getBoundingClientRect().width, h: e.getBoundingClientRect().height })),
    scrollbar: r('[data-cloud-scrollbar]'),
  }
})
console.log(JSON.stringify(m, null, 1))
await b.close()
