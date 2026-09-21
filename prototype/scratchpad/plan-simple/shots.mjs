const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = '/home/user/Remixer/prototype/scratchpad/plan-simple'
let chromium
try { ({ chromium } = await import('playwright')) }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')) }
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
await p.goto(BASE, { waitUntil: 'load' })
await p.waitForTimeout(500)
await p.click('.home-card-face')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await p.waitForTimeout(500)
await p.click('[aria-label="Prototype console"]')
await p.waitForTimeout(300)
await p.evaluate(() => [...document.querySelectorAll('[data-console] button')].find((x) => x.textContent.trim().startsWith('Plan — waiting')).click())
await p.waitForTimeout(400)
await p.click('[aria-label="Close console"]')
await p.mouse.move(8, 8)
await p.waitForTimeout(1400)
const card = async (name) => {
  const el = await p.$('section[aria-label="Plan, waiting for your approval"]')
  await el.screenshot({ path: `${OUT}/${name}` })
}
await card('card-simple.png')
await p.click('[data-plan-unfold]'); await p.waitForTimeout(1000); await card('card-tall.png')
await p.click('[data-plan-unfold]'); await p.waitForTimeout(1000)
await p.click('[data-plan-seat="full"]'); await p.waitForTimeout(1000); await card('card-full.png')
/* the switch on its own, magnified by the device scale */
const track = await p.$('[data-plan-variant]')
await track.screenshot({ path: `${OUT}/switch.png` })
await p.hover('[data-plan-seat="simple"]'); await p.waitForTimeout(400)
await track.screenshot({ path: `${OUT}/switch-hover.png` })
await b.close()
