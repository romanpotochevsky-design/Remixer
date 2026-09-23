/* Cloud window: the glass close button and the row-action fade — stills + computed styles on the built preview. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
await p.click('nav.arrive-rail [aria-label="Cloud"]')
await p.waitForSelector('[data-cloud-close]', { timeout: 10000 })
await p.waitForTimeout(1600)
const info = await p.evaluate(() => {
  const c = document.querySelector('[data-cloud-close]'); const cs = getComputedStyle(c)
  const r = c.getBoundingClientRect()
  const edit = document.querySelector('button[aria-label^="Edit "]'); const host = edit.parentElement
  return {
    close: { classes: c.className, bg: cs.backgroundColor, blur: cs.backdropFilter, radius: cs.borderTopLeftRadius, w: r.width, h: r.height, x: r.x, y: r.y,
      rim: getComputedStyle(c, '::before').backgroundImage.slice(0, 120) },
    fade: { bg: getComputedStyle(host).backgroundImage, glyph: getComputedStyle(edit).color, w: host.getBoundingClientRect().width },
  }
})
console.log(JSON.stringify(info, null, 1))
const c = info.close
if (process.env.ROW_ONLY !== '1') await p.screenshot({ path: 'scratchpad/cloud-glass/close-rest.png', clip: { x: c.x - 24, y: c.y - 16, width: c.w + 48, height: c.h + 32 } })
await p.hover('[data-cloud-close]'); await p.waitForTimeout(250)
await p.screenshot({ path: 'scratchpad/cloud-glass/close-hover.png', clip: { x: c.x - 24, y: c.y - 16, width: c.w + 48, height: c.h + 32 } })
// press: hold the pointer down so the bloom is mid-flight
await p.mouse.move(c.x + 10, c.y + 10); await p.mouse.down(); await p.waitForTimeout(140)
await p.screenshot({ path: 'scratchpad/cloud-glass/close-press.png', clip: { x: c.x - 24, y: c.y - 16, width: c.w + 48, height: c.h + 32 } })
await p.mouse.move(800, 800); await p.mouse.up(); await p.waitForTimeout(300)
// the pane should still be open (pointerup happened away from the button → no click)
const stillOpen = !!(await p.$('[data-cloud-close]'))
const row = await p.$eval('button[aria-label^="Edit "]', (b) => { const r = b.parentElement.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })
await p.screenshot({ path: 'scratchpad/cloud-glass/row-actions.png', clip: { x: Math.max(0, row.x - 260), y: row.y - 20, width: Math.min(row.w + 280, 1600 - Math.max(0, row.x - 260)), height: row.h + 40 } })
console.log('paneStillOpen', stillOpen)
await b.close()
