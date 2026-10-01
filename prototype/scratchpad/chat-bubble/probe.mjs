/** The customer's message by board 31422:42646 — geometry, paint, spacing to the card below. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173/'
const OUT = new URL('./', import.meta.url).pathname
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 2 })
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message))
let fails = 0
const check = (name, ok, extra) => { console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : JSON.stringify(extra)); if (!ok) fails++ }
await page.goto(BASE + '?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await page.click('.home-card-face')
await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await page.waitForTimeout(600)
await page.click('button[aria-label="Prototype console"]')
await page.waitForTimeout(400)
await page.click('button:has-text("Versions — the board’s thread")')
await page.waitForTimeout(400)
await page.click('button[aria-label="Prototype console"]').catch(() => {})
await page.waitForTimeout(1400)
const m = await page.evaluate(() => {
  const b = [...document.querySelectorAll('[data-user-bubble]')]
  return b.map((el) => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const rim = getComputedStyle(el, '::before')
    const p = el.querySelector('p')
    const ps = getComputedStyle(p)
    const next = el.parentElement.parentElement.nextElementSibling
    const card = next?.querySelector('.vcard')
    return {
      w: r.width, h: r.height, bg: cs.backgroundImage, blur: cs.backdropFilter, radius: [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].join('/'),
      pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join('/'), rim: rim.backgroundImage, rimPad: rim.padding, angle: el.style.getPropertyValue('--bub-a'),
      text: ps.color, font: ps.fontSize + '/' + ps.lineHeight, toCard: card ? Math.round(card.getBoundingClientRect().top - r.bottom) : null,
      cardBg: card ? getComputedStyle(card).backgroundColor : null,
    }
  })
})
console.log(JSON.stringify(m, null, 1))
const a = m[0]
check('bubbles staged', m.length >= 2, m.length)
check('fill: white 4 % → 0 % along the diagonal, no blur', m.every((x) => /rgba\(255, 255, 255, 0\.04\).*rgba\(255, 255, 255, 0\)/.test(x.bg) && (x.blur === 'none' || !x.blur)), m.map((x) => [x.bg, x.blur]))
check('rim: 1 px ring 24 % → 4 % @50 % → 8 %', m.every((x) => /0\.24\).*0\.04\) 50%.*0\.08\)/.test(x.rim) && x.rimPad === '1px'), m.map((x) => x.rim))
check('radius 24/24/8/24, padding 13/20/11/20', m.every((x) => x.radius === '24px/24px/8px/24px' && x.pad === '13px/20px/11px/20px'), m.map((x) => [x.radius, x.pad]))
check('text white 64 %, 15/26', m.every((x) => x.text === 'rgba(255, 255, 255, 0.64)' && x.font === '15px/26px'), m.map((x) => [x.text, x.font]))
check('angle = the box diagonal', m.every((x) => Math.abs(parseFloat(x.angle) - (90 + Math.atan2(x.h, x.w) * 180 / Math.PI)) < 0.05), m.map((x) => [x.angle, x.w, x.h]))
check('40 from the bubble to the card that answers it (board: pb 16 + gap 16 + card py 8)', m.filter((x) => x.toCard !== null).every((x) => x.toCard === 40), m.map((x) => x.toCard))
check('cards #18181a', m.filter((x) => x.cardBg).every((x) => x.cardBg === 'rgb(24, 24, 26)'), m.map((x) => x.cardBg))
await (await page.$('.chat-dim')).screenshot({ path: OUT + 'chat.png' })
const first = await page.$('[data-user-bubble]')
await first.screenshot({ path: OUT + 'bubble.png' })
await browser.close()
console.log(fails ? `${fails} FAIL` : 'ALL PASS')
process.exit(fails ? 1 : 0)
