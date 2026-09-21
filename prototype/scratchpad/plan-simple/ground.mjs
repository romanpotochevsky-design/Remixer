const BASE = process.env.BASE || 'http://localhost:4173'
let chromium
try { ({ chromium } = await import('playwright')) }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')) }
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } })
const p = await ctx.newPage()
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
await p.waitForTimeout(1400)
const pts = await p.evaluate(() => {
  const body = document.querySelector('[data-plan-body]')
  const card = document.querySelector('section[aria-label="Plan, waiting for your approval"]')
  const foot = card.querySelector('footer.dock-foot')
  const piston = document.querySelector('.dock-piston')
  const r = body.getBoundingClientRect(), f = foot.getBoundingClientRect(), pr = piston.getBoundingClientRect()
  return {
    window: [Math.round(r.right - 30), Math.round(r.top + 8)],
    windowLow: [Math.round(r.left + 30), Math.round(r.bottom - 40)],
    dockGround: [Math.round(f.left + f.width / 2), Math.round(f.top + 8)],
    pistonTop: [Math.round(pr.left + 40), Math.round(r.top - 20)],
    fadeEnd: [Math.round(r.right - 30), Math.round(r.bottom - 2)],
  }
})
for (const [k, v] of Object.entries(pts)) console.log(k, v, await pixelAt(v[0], v[1]))
await b.close()
