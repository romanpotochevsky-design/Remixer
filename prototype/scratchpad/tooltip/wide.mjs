import { chromium } from 'playwright'
const OUT = new URL('./live/', import.meta.url).pathname
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
await p.goto('http://localhost:4173/?p=built&a=paid&u=0&d=ready&n=fitration.shop&v=false', { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(400)
await p.click('header button:has-text("Publish")'); await p.waitForTimeout(900)
const CHIP = '[role="dialog"][aria-label="Publish"] .liquid-glass--chip[data-tone]'
await p.hover(CHIP); await p.waitForTimeout(800)
const panel = await (await p.$('[role="dialog"][aria-label="Publish"]')).boundingBox()
await p.screenshot({ path: `${OUT}wide-ready.png`, clip: { x: panel.x - 340, y: panel.y, width: panel.width + 350, height: panel.height + 8 } })
// mid-entrance frame with the glint: re-hover and shoot at ~+70ms after show
await p.mouse.move(20, 20); await p.waitForTimeout(400)
await p.hover(CHIP); await p.waitForTimeout(350 + 60)
const chip = await (await p.$(CHIP)).boundingBox()
await p.screenshot({ path: `${OUT}mid-entrance.png`, clip: { x: chip.x - 200, y: chip.y - 90, width: 460, height: 130 } })
await b.close()
