/**
 * The first question of the brief, measured against Figma 30594:24778.
 *
 * Opens the builder with a thin prompt (the only honest route into the panel — the same one
 * check:brief walks), waits for the question sheet, and prints the boxes the board names:
 * the answers card, the question block, the field row, the field itself and the footer.
 *
 * Board (card 770 wide):
 *   question 82  (px 16, pt 20, pb 18)
 *   field row 72 (p 16, one child: the input, full width, NO radio)
 *   input     40 (r8, rim rgba(255,255,255,.12), fill rgba(9,9,11,.16), pl 16 / pr 8)
 *   footer    60 (pt 12, pb 16, pl 6, pr 10)
 */
const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = process.env.OUT || '/home/user/Remixer/prototype/scratchpad/brief-q1'

let chromium
try { ({ chromium } = await import('playwright')) }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')) }

const at = (q) => `${BASE}${BASE.includes('?') ? '&' : '?'}${q}`
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('PAGEERROR', e.message))

await p.goto(at('p=empty&h=empty&a=trial&t=1&c=2000&i=none'), { waitUntil: 'load' })
await p.waitForSelector('input[aria-label="Describe the site you want"]', { timeout: 20000 })
await p.fill('input[aria-label="Describe the site you want"]', 'website')
await p.keyboard.press('Enter')
await p.waitForSelector('section[aria-label="Questions before building"]', { timeout: 30000 })
await p.waitForTimeout(2600)

const box = (el) => { const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) } }

const m = await p.evaluate(() => {
  const bx = (el) => { const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) } }
  const sec = document.querySelector('section[aria-label="Questions before building"]')
  if (!sec) return { error: 'no sheet' }
  const cs = getComputedStyle
  // the answers card: the only surface inside the sheet
  const card = [...sec.querySelectorAll('div')].find((e) => /rgba\(9, 9, 11, 0\.56\)/.test(cs(e).backgroundColor))
  const input = sec.querySelector('input')
  const qp = [...sec.querySelectorAll('p')].find((e) => e.innerText.trim().length > 20)
  const footerBtns = [...sec.querySelectorAll('button')]
  const next = footerBtns.find((e) => /Next|Submit/.test(e.innerText))
  const skip = footerBtns.find((e) => /Skip all/.test(e.innerText))
  const arrows = footerBtns.filter((e) => e.getAttribute('aria-label') && /back|forward|Back|Forward|previous|next/i.test(e.getAttribute('aria-label') || ''))
  const row = input ? input.parentElement : null
  const msg = [...document.querySelectorAll('aside p')].find((e) => /guess costs you a build/.test(e.innerText))
  return {
    sheet: bx(sec),
    card: card ? { ...bx(card), radius: cs(card).borderRadius, bg: cs(card).backgroundColor, border: cs(card).borderColor, bw: cs(card).borderWidth } : null,
    question: qp ? { ...bx(qp), size: cs(qp).fontSize, weight: cs(qp).fontWeight, lh: cs(qp).lineHeight, color: cs(qp).color, text: qp.innerText.slice(0, 60) } : null,
    questionBlock: qp ? (() => { const blk = qp.closest('div'); return { ...bx(blk), pad: cs(blk).padding } })() : null,
    fieldRow: row ? { ...bx(row), pad: cs(row).padding } : null,
    field: input ? { ...bx(input), radius: cs(input).borderRadius, bg: cs(input).backgroundColor, border: cs(input).borderColor, bw: cs(input).borderWidth, pl: cs(input).paddingLeft, pr: cs(input).paddingRight, size: cs(input).fontSize, ph: input.placeholder } : null,
    radios: sec.querySelectorAll('.brief-radio-off, [class*="brief-radio"]').length,
    rows: sec.querySelectorAll('.brief-opt').length,
    next: next ? { ...bx(next), text: next.innerText, bg: cs(next).backgroundColor, size: cs(next).fontSize } : null,
    skip: skip ? { ...bx(skip), text: skip.innerText } : null,
    arrows: arrows.map((e) => ({ ...bx(e), op: cs(e).opacity, dis: e.disabled, al: e.getAttribute('aria-label') })),
    allButtons: footerBtns.map((e) => ({ t: e.innerText.trim().slice(0, 14), al: e.getAttribute('aria-label'), op: cs(e).opacity, dis: e.disabled, ...bx(e) })),
    aiMessage: msg ? { size: cs(msg).fontSize, lh: cs(msg).lineHeight, color: cs(msg).color } : null,
  }
})

console.log(JSON.stringify(m, null, 2))
await p.screenshot({ path: `${OUT}/live.png` })
const sheet = await p.$('section[aria-label="Questions before building"]')
if (sheet) await sheet.screenshot({ path: `${OUT}/sheet.png` })
await b.close()
