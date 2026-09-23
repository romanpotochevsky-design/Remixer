import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
await p.click('nav.arrive-rail [aria-label="Cloud"]'); await p.waitForSelector('[data-cloud-close]'); await p.mouse.move(800, 800); await p.waitForTimeout(3000)
console.log(JSON.stringify(await p.evaluate(() => {
  const t = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).transform : 'missing' }
  const host = document.querySelector('button[aria-label^="Edit "]').parentElement
  const row = host.parentElement
  return { pane: t('[data-canvas-pane]'), paneClip: getComputedStyle(document.querySelector('[data-canvas-pane]')).clipPath, settle: t('[data-pane-settle]'), row: getComputedStyle(row).transform, rowAnims: row.getAnimations().map((a) => `${a.animationName}:${a.playState}`), plate: getComputedStyle(host).transform, list: t('[data-cloud-list]'),
    hostRect: host.getBoundingClientRect().right, rowRect: row.getBoundingClientRect().left, dpr: devicePixelRatio }
}), null, 1))
await p.screenshot({ path: 'scratchpad/cloud-glass/full-3s.png' })
await p.screenshot({ path: 'scratchpad/cloud-glass/clip-3s.png', clip: { x: 1500, y: 270, width: 30, height: 20 } })
await b.close()
