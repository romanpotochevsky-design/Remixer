const BASE = process.env.BASE || 'http://localhost:4173'
let chromium
try { ({ chromium } = await import('playwright')) }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')) }
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } })
const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('PAGEERROR', e.message))
const pixelAt = async (x, y) => {
  const png = await p.screenshot({ clip: { x, y, width: 1, height: 1 } })
  let off = 8, idat = []
  while (off < png.length) {
    const len = png.readUInt32BE(off), type = png.toString('ascii', off + 4, off + 8)
    if (type === 'IDAT') idat.push(png.subarray(off + 8, off + 8 + len))
    off += 12 + len
  }
  const raw = (await import('node:zlib')).inflateSync(Buffer.concat(idat))
  return [raw[1], raw[2], raw[3]]
}
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

const sample = await p.evaluate(() => {
  const body = document.querySelector('[data-plan-body]')
  const r = body.getBoundingClientRect()
  return [Math.round(r.right - 30), Math.round(r.top + 8)]
})
console.log('sample at', sample, '→', await pixelAt(sample[0], sample[1]))

/* editing */
await p.click('[data-plan-path="s0:h"]')
await p.keyboard.press('Control+A')
await p.keyboard.type('What we will build')
await p.keyboard.press('Enter')
await p.waitForTimeout(300)
console.log('edited to:', await p.$eval('[data-plan-path="s0:h"]', (e) => e.textContent))

/* the trip */
const trip = await p.evaluate(() => new Promise((done) => {
  const out = []
  const t0 = performance.now()
  const piston = document.querySelector('.dock-piston')
  const field = document.querySelector('.composer-field')
  const tick = () => {
    const m = /matrix\(([^)]+)\)/.exec(getComputedStyle(piston).transform)
    const f = field.getBoundingClientRect()
    out.push([m ? Math.round(Number(m[1].split(',')[5]) * 10) / 10 : 0, [f.x, f.y, f.width, f.height].join(',')])
    if (performance.now() - t0 < 900) requestAnimationFrame(tick)
    else done(out)
  }
  document.querySelector('[data-plan-unfold]').click()
  requestAnimationFrame(tick)
}))
const ys = trip.map((x) => x[0])
console.log('piston max', Math.max(...ys), 'min', Math.min(...ys), 'last', ys[ys.length - 1],
  'mids', ys.filter((v) => v > 1 && v < 100).length, 'fields', new Set(trip.map((x) => x[1])).size)
await p.waitForTimeout(400)
console.log('tall:', await p.$eval('[data-plan-body]', (el) => Math.round(el.getBoundingClientRect().height)))
/* flip to full and check the edit travelled */
await p.click('[data-plan-unfold]'); await p.waitForTimeout(900)
await p.click('[data-plan-seat="full"]'); await p.waitForTimeout(900)
console.log('full body:', await p.$eval('[data-plan-body]', (el) => Math.round(el.getBoundingClientRect().height)),
  '· review:', !!(await p.$('[data-plan-review]')),
  '· edit visible:', (await p.evaluate(() => document.body.innerText)).includes('What we will build'))
await b.close()
