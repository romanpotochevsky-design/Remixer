/** Chat gutters (designer 01.10.2026): 16 left, 16 right, 16 below the composer; the scroll bar in the
 *  middle of the right gutter, never touching the text. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173/'
const OUT = new URL('./', import.meta.url).pathname
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
/* scroll the thread so the bar shows */
await page.mouse.move(200, 300); await page.mouse.wheel(0, -200); await page.waitForTimeout(150)
const m = await page.evaluate(() => {
  const r = (e) => e.getBoundingClientRect()
  const aside = document.querySelector('.chat-dim').getBoundingClientRect()
  const col = document.querySelector('.chat-dim .chat-col'); const cs = getComputedStyle(col)
  const field = r(document.querySelector('.composer-field'))
  const thumb = document.querySelector('.chat-thumb'); const tb = r(thumb)
  const bubbles = [...document.querySelectorAll('[data-user-bubble]')].map((b) => r(b).right)
  const cards = [...document.querySelectorAll('.vcard')].map((c) => [r(c).left, r(c).right])
  const resizer = document.querySelector('.chat-resizer')?.getBoundingClientRect()
  return { colPad: [cs.paddingLeft, cs.paddingRight], left: field.left - aside.left, right: (resizer ? resizer.left : aside.right) - field.right, bottom: innerHeight - field.bottom,
    fieldW: field.width, thumb: { left: tb.left, right: tb.right, w: tb.width, op: getComputedStyle(thumb).opacity }, edge: resizer ? resizer.left : aside.right, bubbles, cards, asideL: aside.left }
})
console.log(JSON.stringify(m))
check('thread gutters 16 / 16', m.colPad[0] === '16px' && m.colPad[1] === '16px', m.colPad)
check('composer 16 from the left, 16 from the divider, 16 from the bottom', Math.round(m.left) === 16 && Math.round(m.right) === 16 && Math.round(m.bottom) === 16, m)
check('the bar sits mid-gutter: 6 to the divider, 4 wide', Math.round(m.edge - m.thumb.right) === 6 && Math.round(m.thumb.w) === 4, m.thumb)
check('bubbles end 16 from the divider — 6 of air between them and the bar', m.bubbles.every((x) => Math.round(m.edge - x) === 16), m.bubbles)
check('cards end 16 from the divider too (the stack’s narrower back layers aside)', m.cards.filter(([l]) => Math.round(l) === 8).every(([, rr]) => Math.round(m.edge - rr) === 16), m.cards)
await page.screenshot({ path: OUT + 'shell.png', clip: { x: 0, y: 0, width: 460, height: 900 } })
await browser.close(); console.log(fails ? `${fails} FAIL` : 'ALL PASS'); process.exit(fails ? 1 : 0)
