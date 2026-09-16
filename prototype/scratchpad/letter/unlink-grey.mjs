import { chromium } from 'playwright'
const OUT = new URL('./live/', import.meta.url).pathname
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
await p.goto('http://localhost:4173/?p=built&a=paid&d=live&n=fit-ration.net&v=true&u=0&t=22&c=640', { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(400)
await p.click('header button:has-text("Publish")'); await p.waitForTimeout(900)
const SEL = '[role="dialog"][aria-label="Publish"]'
const row = await p.evaluateHandle(() => [...document.querySelectorAll('[role="dialog"][aria-label="Publish"] div')].find((e) => /Unlink/.test(e.textContent || '') && getComputedStyle(e).borderTopColor === 'rgb(49, 49, 51)'))
const rb = await row.asElement().boundingBox()
await p.screenshot({ path: `${OUT}04-row-unlink-grey.png`, clip: { x: rb.x - 8, y: rb.y - 8, width: rb.width + 16, height: rb.height + 16 } })
const ink = await p.evaluate(() => { const b = [...document.querySelectorAll('[role="dialog"][aria-label="Publish"] button')].find((e) => /Unlink/.test(e.textContent)); return getComputedStyle(b).color })
console.log('row Unlink ink:', ink)
await b.close()
