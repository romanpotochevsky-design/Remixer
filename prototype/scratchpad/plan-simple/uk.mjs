const BASE = process.env.BASE || 'http://localhost:4173'
let chromium
try { ({ chromium } = await import('playwright')) }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')) }
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
await p.goto(`${BASE}?l=uk`, { waitUntil: 'load' })
await p.waitForTimeout(500)
await p.click('.home-card-face')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await p.waitForTimeout(500)
await p.click('[aria-label="Prototype console"]')
await p.waitForTimeout(300)
await p.evaluate(() => [...document.querySelectorAll('[data-console] button')].find((x) => /Plan — waiting|План — очікує/.test(x.textContent.trim())).click())
await p.waitForTimeout(400)
await p.click('[aria-label="Close console"]')
await p.mouse.move(8, 8)
await p.waitForTimeout(1200)
console.log(await p.evaluate(() => {
  const t = document.querySelector('[data-plan-variant]')
  const seats = [...t.querySelectorAll('button')].map((s) => [s.innerText, Math.round(s.getBoundingClientRect().width * 100) / 100])
  const thumb = t.querySelector('.plan-variant-thumb').getBoundingClientRect()
  const card = document.querySelector('section[aria-label*="лан"]')
  return { track: Math.round(t.getBoundingClientRect().width * 100) / 100, seats,
    thumb: [Math.round(thumb.width * 100) / 100, Math.round(thumb.left - t.getBoundingClientRect().left)],
    card: card ? Math.round(card.getBoundingClientRect().height) : null }
}))
const el = await p.$('[data-plan-variant]')
await el.screenshot({ path: '/home/user/Remixer/prototype/scratchpad/plan-simple/switch-uk.png' })
await b.close()
