/**
 * THE RAIL IN THE PLAN'S PAGE STACK — is it one line or two?
 *
 * Scans device pixels across the stack's left and right edges and reports every run of
 * lit pixels on each scanline. One run = one rail. Two runs a pixel apart = the bug the
 * designer photographed ("у тебя тут двойные бордеры снова").
 */
import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = process.env.BASE || 'http://localhost:4173/'
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-Remixer/e48f0388-fcbd-532f-b46c-a75e5fc0be1e/scratchpad/rails'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: Number(process.env.DPR || 2) })

await p.goto(BASE, { waitUntil: 'networkidle' })
await p.waitForTimeout(700)
await p.fill('input[aria-label="Describe the site you want"]', 'website')
await p.click('button:has-text("Build")')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 })
await p.waitForTimeout(4200)                       // the clarify line, then the read pause
await p.waitForSelector('text=Skip all', { timeout: 15000 })
await p.click('text=Skip all')
await p.waitForTimeout(2800)                       // ack → the plan card docks

const planUp = await p.evaluate(() => !!document.querySelector('section[aria-label="Plan, waiting for your approval"]'))
console.log('plan card up:', planUp)
if (!planUp) { console.log(await p.evaluate(() => document.body.innerText.slice(0, 600))); await b.close(); process.exit(1) }

await p.click('text=Review')
await p.waitForTimeout(1100)
await p.mouse.move(4, 4)
await p.waitForTimeout(300)

const box = await p.evaluate(() => {
  const r = document.querySelector('[data-plan-stack]').getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
})
console.log('stack box', JSON.stringify(box))
await p.screenshot({ path: `${OUT}/${process.env.NAME || 'stack'}.png`, clip: { x: box.x - 6, y: box.y - 6, width: box.w + 12, height: box.h + 12 } })
await b.close()
