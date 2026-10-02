/** Chat scroll bar at the extremes (designer 01.10.2026: «как то странно скрол выглядит когда его вниз самый
 *  докручиваешь или вверх»): the thread's sticky fades must not wash the thumb's ends. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173/'
const OUT = new URL('./', import.meta.url).pathname
const TAG = process.env.TAG || 'now'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
let fails = 0
const check = (n, ok, x) => { console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : JSON.stringify(x)); if (!ok) fails++ }
await page.goto(BASE + '?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle' })
await page.click('.home-card-face'); await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await page.waitForTimeout(600)
await page.click('button[aria-label="Prototype console"]'); await page.waitForTimeout(400)
await page.click('button:has-text("Versions — the board’s thread")'); await page.waitForTimeout(400)
await page.click('button[aria-label="Prototype console"]').catch(() => {}); await page.waitForTimeout(1200)
await page.mouse.move(200, 400)
const pixelAt = async (x, y) => {
  const png = await page.screenshot({ clip: { x, y, width: 1, height: 1 }, scale: 'css' })
  let off = 8, idat = []
  while (off < png.length) {
    const len = png.readUInt32BE(off), type = png.toString('ascii', off + 4, off + 8)
    if (type === 'IDAT') idat.push(png.subarray(off + 8, off + 8 + len))
    off += 12 + len
  }
  const raw = (await import('node:zlib')).inflateSync(Buffer.concat(idat))
  return raw[1]
}
const shot = async (name) => {
  const m = await page.evaluate(() => {
    const t = document.querySelector('.chat-thumb'); const tb = t.getBoundingClientRect()
    const vp = t.previousElementSibling; const vb = vp.getBoundingClientRect()
    /* who paints on top at the thumb's ends? */
    /* the LEFT half: the old fades reached only the middle of the 16 px gutter and washed exactly that half */
    return { x: Math.floor(tb.left + 1), y0: Math.floor(tb.top + 3), y1: Math.floor(tb.bottom - 4), ym: Math.floor(tb.top + tb.height / 2),
      top: tb.top - vb.top, bottom: vb.bottom - tb.bottom, h: tb.height, z: getComputedStyle(t).zIndex, vpTop: vb.top, vpBot: vb.bottom }
  })
  m.ink = [await pixelAt(m.x, m.y0), await pixelAt(m.x, m.ym), await pixelAt(m.x, m.y1)]
  console.log(name, JSON.stringify(m))
  await page.screenshot({ path: OUT + `${TAG}-${name}.png`, clip: { x: 300, y: name === 'top' ? m.vpTop - 10 : m.vpBot - 120, width: 140, height: 130 } })
  return m
}
await page.evaluate(() => { document.querySelector('.chat-thumb').previousElementSibling.scrollTop = 0 }); await page.waitForTimeout(200)
const top = await shot('top')
await page.evaluate(() => { const v = document.querySelector('.chat-thumb').previousElementSibling; v.scrollTop = v.scrollHeight }); await page.waitForTimeout(200)
const bot = await shot('bottom')
/* one tone end to end: the ends read the same ink as the middle (±3/255), not the fade's ground */
const even = (m) => m.ink.every((v) => Math.abs(v - m.ink[1]) <= 3)
check('scrolled to the top: the bar is one tone end to end (the top fade does not wash it)', even(top), top.ink)
check('scrolled to the bottom: the bar is one tone end to end (the bottom fade does not wash it)', even(bot), bot.ink)
check('the bar keeps its 4 px inset at both extremes', Math.round(top.top) === 4 && Math.round(bot.bottom) === 4, [top.top, bot.bottom])
await browser.close(); console.log(fails ? `${fails} FAIL` : 'ALL PASS'); process.exit(fails ? 1 : 0)
