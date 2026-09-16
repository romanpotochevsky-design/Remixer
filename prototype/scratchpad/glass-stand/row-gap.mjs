import { chromium } from 'playwright'
const OUT = new URL('./live/', import.meta.url).pathname
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 3 })
const p = await ctx.newPage()
await p.goto('http://localhost:4173/?p=built&h=long&a=paid&c=900', { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(400)
await p.keyboard.press('Control+.'); await p.waitForTimeout(400)
await p.click('button:has-text("Autopilot — the first proposal")'); await p.waitForTimeout(300)
await p.keyboard.press('Control+.'); await p.waitForTimeout(1200)
const card = await p.evaluateHandle(() => document.querySelector('.brief-opt').parentElement)
await card.asElement().screenshot({ path: `${OUT}rows-recommended.png` })
const facts = await p.evaluate(() => [...document.querySelectorAll('.brief-opt')].map((r) => {
  const title = r.querySelector('span.flex.flex-wrap'), desc = title.nextElementSibling, radio = r.querySelector('span.flex.items-center.pt-1\\.5')
  const rb = r.getBoundingClientRect(), tb = title.getBoundingClientRect(), db = desc.getBoundingClientRect()
  return { row: r.innerText.split('\n')[0], recommended: r.innerText.includes('Recommended'), titleRowH: +tb.height.toFixed(1), gap: +(db.top - tb.bottom).toFixed(1), padTop: +(tb.top - rb.top).toFixed(1), padBottom: +(rb.bottom - db.bottom).toFixed(1), rowH: +rb.height.toFixed(1) }
}))
console.table(facts)
await b.close()
