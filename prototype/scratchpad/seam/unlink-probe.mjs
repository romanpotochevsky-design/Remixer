import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
await p.goto('http://localhost:4173/?p=built&a=paid&d=live&n=fit-ration.com&v=true&u=0&t=22&c=640', { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(400)
await p.click('header button:has-text("Publish")'); await p.waitForTimeout(1200)
const m = await p.evaluate(() => {
  const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
  const root = [...d.querySelectorAll('div')].find((e) => e.className.toString().includes('inset_0_0_0_1px_#313133'))
  const btn = [...root.querySelectorAll('button')].find((b) => /Unlink/.test(b.textContent))
  const span = btn.querySelector('span')
  const svg = btn.querySelector('svg')
  const r = (el) => { const q = el.getBoundingClientRect(); return { top: +q.top.toFixed(2), bottom: +q.bottom.toFixed(2), left: +q.left.toFixed(2), right: +q.right.toFixed(2), h: +q.height.toFixed(2), w: +q.width.toFixed(2), cy: +((q.top + q.bottom) / 2).toFixed(2) } }
  return { btn: r(btn), span: r(span), svg: r(svg), trim: getComputedStyle(span).textBoxTrim, edge: getComputedStyle(span).textBoxEdge, gap: +(r(svg).left - r(span).right).toFixed(2), padL: +(r(span).left - r(btn).left).toFixed(2), padR: +(r(btn).right - r(svg).right).toFixed(2), rowH: root.getBoundingClientRect().height }
})
console.log(JSON.stringify(m, null, 1))
const box = await p.evaluate(() => { const r = document.querySelector('[role="dialog"][aria-label="Publish"] div[class*="inset_0_0_0_1px_#313133"]').getBoundingClientRect(); return { x: r.right - 140, y: r.top, width: 140, height: r.height } })
await p.hover('[role="dialog"][aria-label="Publish"] div[class*="inset_0_0_0_1px_#313133"] button')
await p.waitForTimeout(300)
await p.screenshot({ path: 'scratchpad/seam/unlink-hover.png', clip: box })
await b.close()
