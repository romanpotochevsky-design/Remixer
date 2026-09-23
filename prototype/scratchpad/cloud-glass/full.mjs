import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
await p.click('nav.arrive-rail [aria-label="Cloud"]'); await p.waitForSelector('[data-cloud-close]'); await p.mouse.move(800, 800); await p.waitForTimeout(Number(process.env.WAIT || 1600))
await p.screenshot({ path: process.env.OUT || 'scratchpad/cloud-glass/window.png' })
const geo = await p.evaluate(() => {
  const edit = document.querySelector('button[aria-label^="Edit "]'); const host = edit.parentElement; const row = host.parentElement
  const scroller = row.closest('[class*="scroll"]') || row.parentElement
  const r = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
  return { host: r(host), row: r(row), rowScrollW: row.scrollWidth, parent: r(row.parentElement), gp: r(row.parentElement.parentElement), nextText: host.nextElementSibling?.textContent?.slice(0, 20) ?? null, prevText: host.previousElementSibling?.textContent?.slice(0, 30) ?? null }
})
console.log(JSON.stringify(geo))
await b.close()
