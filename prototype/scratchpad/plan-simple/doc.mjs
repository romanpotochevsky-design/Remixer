/**
 * Two things at once: the window unfolding to 16 from the top of the screen without moving
 * anything below it, and the prose behaving like a document — one caret, one selection that
 * crosses paragraphs, no per-line boxes.
 */
const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = '/home/user/Remixer/prototype/scratchpad/plan-simple'
let chromium
try { ({ chromium } = await import('playwright')) }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')) }
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('PAGEERROR', e.message))
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

const geo = () => p.evaluate(() => {
  const r = (q) => { const el = document.querySelector(q); if (!el) return null; const b = el.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map((n) => Math.round(n * 100) / 100) }
  return { card: r('section[aria-label="Plan, waiting for your approval"]'), body: r('[data-plan-body]'),
    composer: r('.composer-field'), doc: r('[data-plan-doc]'), hosts: document.querySelectorAll('[contenteditable]').length }
})
console.log('rest      ', JSON.stringify(await geo()))
await p.click('[data-plan-unfold]'); await p.waitForTimeout(1100)
console.log('unfolded  ', JSON.stringify(await geo()))
await p.screenshot({ path: `${OUT}/d1-tall.png` })
await p.click('[data-plan-unfold]'); await p.waitForTimeout(1100)
console.log('folded    ', JSON.stringify(await geo()))

/* the document test: drag a selection from the first paragraph into the third */
const sel = await p.evaluate(() => {
  const a = document.querySelector('[data-plan-path="goal"]')
  const c = document.querySelector('[data-plan-path="s0:h"]')
  const range = document.createRange()
  range.setStart(a.firstChild ?? a, 0)
  range.setEnd(c.firstChild ?? c, Math.min(4, (c.textContent || '').length))
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(range)
  return { crosses: s.toString().length, text: s.toString().slice(0, 60) }
})
console.log('selection across paragraphs:', JSON.stringify(sel))

/* typing: put the caret in one line, select just it, replace */
await p.click('[data-plan-path="s0:h"]')
await p.keyboard.press('End'); await p.keyboard.down('Shift'); await p.keyboard.press('Home'); await p.keyboard.up('Shift')
await p.keyboard.type('What we will build')
await p.click('[data-plan-path="title"]')
await p.waitForTimeout(200)
await p.click('section[aria-label="Plan, waiting for your approval"] footer')
await p.waitForTimeout(400)
console.log('after typing:', await p.$eval('[data-plan-path="s0:h"]', (e) => e.textContent))
console.log('stored     :', await p.evaluate(() => JSON.parse(localStorage.getItem('remixer-prototype/world/v4') || '{}').planEdits?.text?.['s0:h']))
const ring = await p.evaluate(() => {
  const el = document.querySelector('[data-plan-path="title"]')
  const cs = getComputedStyle(el)
  return { boxShadow: cs.boxShadow, background: cs.backgroundColor, outline: cs.outlineStyle }
})
console.log('a line in the document wears:', JSON.stringify(ring))
await p.screenshot({ path: `${OUT}/d2-doc.png` })
await b.close()
