import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
await p.click('nav.arrive-rail [aria-label="Cloud"]'); await p.waitForSelector('[data-cloud-close]'); await p.waitForTimeout(1600)
console.log(JSON.stringify(await p.evaluate(() => {
  const edit = document.querySelector('button[aria-label^="Edit "]'); const host = edit.parentElement; const row = host.parentElement
  const list = document.querySelector('[data-cloud-list]')
  const r = (e) => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, w: b.width } }
  const cells = [...row.children].map((c) => ({ cls: c.className.slice(0, 30), ...r(c), text: c.textContent.slice(0, 12) }))
  return { host: r(host), list: r(list), listCS: { overflow: getComputedStyle(list).overflowX, pr: getComputedStyle(list).paddingRight }, cells }
}), null, 1))
await b.close()
