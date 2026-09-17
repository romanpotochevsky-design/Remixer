/* The explanation box's stroke must lie ON the progress card's (the suite's wall-to-wall check),
   measured after the panel's transform has landed. */
import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await p.goto('http://localhost:4173/?p=built&u=0&v=false&d=ready&n=fit-ration.com&a=paid&t=22&c=640', { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(400)
await p.click('header button:has-text("Publish")')
await p.waitForFunction(() => { const d = document.querySelector('[role="dialog"][aria-label="Publish"]'); if (!d) return false; const t = getComputedStyle(d).transform; return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)' }, null, { timeout: 4000 })
await p.waitForTimeout(120)
const r = await p.evaluate(() => {
  const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
  const box = [...d.querySelectorAll('div')].find((e) => getComputedStyle(e).borderTopColor === 'rgb(73, 73, 76)')
  let card = box.parentElement
  while (card && getComputedStyle(card).borderTopWidth === '0px') card = card.parentElement
  const bb = box.getBoundingClientRect(), cb = card.getBoundingClientRect()
  const clip = box.closest('.overflow-hidden')
  return { box: { l: bb.left, r: bb.right, b: bb.bottom, w: bb.width }, card: { l: cb.left, r: cb.right, b: cb.bottom, w: cb.width }, clipMargin: clip ? getComputedStyle(clip).marginBottom : null, clipInline: clip ? clip.style.marginBottom : null }
})
console.log(JSON.stringify(r))
await b.close()
