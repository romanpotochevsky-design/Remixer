/* The Domains window opened from the topbar chip: where does its clip start? (It should drop from
   the chip, above the canvas.) Also the fallback: a surface set with no press. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:5174'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
const first = await p.evaluate(async () => {
  const chip = [...document.querySelectorAll('header button')].find((e) => /remixer\.ai/.test(e.innerText))
  const cr = chip.getBoundingClientRect()
  chip.click()
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  const pane = document.querySelector('[data-canvas-pane]')
  return { chip: [cr.x, cr.y, cr.width, cr.height], clip: getComputedStyle(pane).clipPath, origin: getComputedStyle(pane).transformOrigin, id: pane.dataset.canvasPane }
})
console.log('chip →', JSON.stringify(first))
await p.waitForTimeout(1200)
await p.screenshot({ path: 'domains-from-chip.png', clip: { x: 432, y: 0, width: 1168, height: 900 } })
await p.keyboard.press('Escape'); await p.waitForTimeout(900)
console.log('closed:', (await p.$('[data-canvas-pane]')) === null)
await b.close()
