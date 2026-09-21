/** What is BEHIND the corner instrument — the blur argument has to be re-measured after a move. */
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
await p.mouse.move(700, 300)
await p.waitForTimeout(1200)
/* what sits under the instrument's box, with the instrument hidden for the read */
const under = await p.evaluate(() => {
  const host = document.querySelector('[data-plan-variant]').closest('.fixed')
  host.style.visibility = 'hidden'
  const r = { x: 10, y: 858, w: 136, h: 32 }
  const els = []
  for (const [dx, dy] of [[4, 4], [68, 16], [132, 28]]) {
    const el = document.elementFromPoint(r.x + dx, r.y + dy)
    els.push(el ? `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ').slice(0, 2).join('.')} bg=${getComputedStyle(el).backgroundColor}` : 'none')
  }
  return els
})
const px = [await pixelAt(20, 862), await pixelAt(80, 874), await pixelAt(140, 886)]
await p.evaluate(() => { const h = document.querySelector('[data-plan-variant]').closest('.fixed'); h.style.visibility = '' })
console.log('elements under the switch:', JSON.stringify(under, null, 1))
console.log('painted pixels under it:', JSON.stringify(px))
await b.close()
