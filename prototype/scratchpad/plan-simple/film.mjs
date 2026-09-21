/**
 * The two motions this change adds, sampled frame by frame:
 *  · throwing the switch (full ⇄ simple) — the sheet's height changes, so the dock's edge
 *    has to GLIDE there, and the composer must not move by a pixel;
 *  · the header chevron (320 ⇄ 440) — same test, bigger travel.
 */
const BASE = process.env.BASE || 'http://localhost:4173'
let chromium
try { ({ chromium } = await import('playwright')) }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')) }
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
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
await p.waitForTimeout(1200)

const film = async (ms = 1100) => p.evaluate((ms) => new Promise((done) => {
  const out = []
  const t0 = performance.now()
  const tick = () => {
    const card = document.querySelector('section[aria-label="Plan, waiting for your approval"]')
    const piston = document.querySelector('.dock-piston')
    const field = document.querySelector('.composer-field')
    const body = document.querySelector('[data-plan-body]')
    const m = piston ? /matrix\(([^)]+)\)/.exec(getComputedStyle(piston).transform) : null
    const f = field.getBoundingClientRect()
    out.push({
      t: Math.round(performance.now() - t0),
      top: card ? Math.round(card.getBoundingClientRect().top) : null,
      h: card ? Math.round(card.getBoundingClientRect().height) : null,
      body: body ? Math.round(body.getBoundingClientRect().height) : null,
      y: m ? Math.round(Number(m[1].split(',')[5]) * 10) / 10 : 0,
      field: [Math.round(f.x), Math.round(f.y), Math.round(f.width), Math.round(f.height)].join(','),
    })
    if (performance.now() - t0 < ms) requestAnimationFrame(tick)
    else done(out)
  }
  requestAnimationFrame(tick)
}), ms)

const run = async (tag, sel) => {
  const before = film()
  await p.click(sel)
  const frames = await before
  const fields = new Set(frames.map((f) => f.field))
  console.log(`\n=== ${tag} ===`)
  console.log('field boxes:', [...fields].join(' | '))
  console.log('piston y:', frames.map((f) => f.y).filter((v, i, a) => v !== a[i - 1]).join(' '))
  console.log('card top:', frames.map((f) => f.top).filter((v, i, a) => v !== a[i - 1]).join(' '))
  console.log('body h:', frames.map((f) => f.body).filter((v, i, a) => v !== a[i - 1]).join(' '))
  await p.waitForTimeout(600)
}

await run('switch → Full', '[data-plan-seat="full"]')
await run('switch → Simple', '[data-plan-seat="simple"]')
await run('chevron → tall', '[data-plan-unfold]')
await run('chevron → back', '[data-plan-unfold]')
await b.close()
