// The page menu against its board (Figma 31076:31629 → Menu 31076:37714). Measures the box, the
// field, the rows and the drawn scrollbar; screenshots the open menu at dsf 2.
// Pass 1: the default outline (4 pages). Pass 2: 7 pages, so the list scrolls.
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173/'
const OUT = 'scratchpad/page-menu-board'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const url = `${BASE}${BASE.includes('?') ? '&' : '?'}p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`
for (const pass of ['default', 'many']) {
  const p = await b.newPage({ viewport: { width: 2560, height: 1166 }, deviceScaleFactor: 2 })
  await p.goto(url, { waitUntil: 'networkidle' })
  if (pass === 'many') {
    /* the URL wins whole over storage (world.ts initialWorld), so this pass stores a world with six
       pages under Home and opens the bare address */
    await p.evaluate(() => {
      localStorage.setItem('remixer-prototype/world/v6', JSON.stringify({ planEdits: { text: {}, items: {}, outline: { rest: ['About', 'Blog', 'Menu', 'Contacts', 'Careers', 'FAQ'] } } }))
    })
    await p.goto(BASE, { waitUntil: 'networkidle' })
  }
  await p.waitForTimeout(800)
  await p.click('.home-card-face')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
  await p.waitForTimeout(600)
  const pill = await p.$eval('[data-page-switch]', (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, label: e.querySelector('[data-page-label]').textContent } })
  await p.mouse.click(pill.x + 140, pill.y + 20)
  await p.waitForTimeout(900)
  const m = await p.evaluate(() => {
    const menu = document.querySelector('[data-page-menu]'); const mr = menu.getBoundingClientRect(); const cs = getComputedStyle(menu)
    const rel = (el) => { const r = el.getBoundingClientRect(); return { x: +(r.x - mr.x).toFixed(2), y: +(r.y - mr.y).toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) } }
    const field = document.querySelector('[data-page-field]'); const input = document.querySelector('[data-page-input]'); const ics = getComputedStyle(input)
    const rule = field.nextElementSibling
    const rows = [...document.querySelectorAll('[data-page-row]')].map((r) => ({ ...rel(r), path: r.dataset.pageRow, text: r.querySelector('[data-page-text]').textContent, weight: getComputedStyle(r.querySelector('[data-page-text]')).fontWeight, bg: getComputedStyle(r).backgroundColor, lead: rel(r.querySelector('[data-page-lead]')), textX: rel(r.querySelector('[data-page-text]')).x, check: !!r.querySelector('[data-page-lead] svg') }))
    const thumb = menu.querySelector('.scroll-thumb'); const tcs = getComputedStyle(thumb)
    return {
      menu: { x: mr.x, y: mr.y, w: mr.width, h: mr.height, bg: cs.backgroundColor, r: cs.borderTopLeftRadius, shadow: cs.boxShadow, blur: cs.backdropFilter, origin: cs.transformOrigin },
      field: rel(field), icon: rel(field.querySelector('svg')), iconInk: getComputedStyle(field.querySelector('svg')).color, input: { ...rel(input), value: input.value, color: ics.color, size: ics.fontSize, lh: ics.lineHeight, sel: [input.selectionStart, input.selectionEnd], focused: document.activeElement === input },
      rule: { ...rel(rule), bg: getComputedStyle(rule).backgroundColor }, rows,
      thumb: thumb.hasAttribute('data-off') ? 'off' : { ...rel(thumb), bg: tcs.backgroundColor, o: tcs.opacity },
      clear: !!document.querySelector('[data-page-clear]'),
    }
  })
  console.log(pass, JSON.stringify({ pill, ...m }, null, 1))
  const mr = m.menu
  await p.screenshot({ path: `${OUT}/${pass}-open.png`, clip: { x: mr.x - 24, y: 0, width: mr.w + 48, height: mr.h + 40 } })
  await p.close()
}
await b.close()
