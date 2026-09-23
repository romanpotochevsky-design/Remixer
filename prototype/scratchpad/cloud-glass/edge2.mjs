import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
await p.click('nav.arrive-rail [aria-label="Cloud"]'); await p.waitForSelector('[data-cloud-close]'); await p.waitForTimeout(1600)
console.log(JSON.stringify(await p.evaluate(() => {
  const at = (x, y) => { const e = document.elementFromPoint(x, y); return e ? `${e.tagName}.${(e.className || '').toString().slice(0, 40)}|${e.textContent.slice(0, 10)}` : null }
  const edit = document.querySelector('button[aria-label^="Edit "]'); const host = edit.parentElement; const row = host.parentElement
  const price = row.children[3]; const span = price.querySelector('span') || price
  const range = document.createRange(); range.selectNodeContents(span); const tr = range.getBoundingClientRect()
  const hs = getComputedStyle(host)
  return { top1518: at(1518, 281), top1517: at(1517, 281), top1519: at(1519, 281), priceText: { l: tr.left, r: tr.right, text: span.textContent }, host: { z: hs.zIndex, pos: hs.position, bgi: hs.backgroundImage, w: hs.width, pr: hs.paddingRight }, rowOverflow: getComputedStyle(row).overflow }
}), null, 1))
await b.close()
