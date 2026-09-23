/* The composer's attach menu and the domain / file chip — real-time trace on the built preview.
   Measures against Figma 28726:64760 (menu 30871:57297 ON the "+" box, 208 × 105, rows 48) and
   films: menu entrance, level resize, menu exit, chip arrival, chip removal, file chip. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
const url = (q) => `${BASE}${BASE.endsWith('.html') ? '' : '/'}?${q}`
await p.goto(url('p=empty&h=empty&a=trial&t=1&c=2000&i=dh-free'), { waitUntil: 'networkidle' })
await p.waitForTimeout(2600)

const box = (sel) => p.$eval(sel, (el) => { const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => +n.toFixed(2)) })
const style = (sel, props) => p.$eval(sel, (el, props) => { const g = getComputedStyle(el); return Object.fromEntries(props.map((k) => [k, g[k]])) }, props)

/* ── 1. the menu box against the "+" ─────────────────────────────── */
const plus = await box('[data-attach-open]')
/* film the entrance per rAF */
const entrance = await p.evaluate(async () => {
  const out = []; const t0 = performance.now()
  document.querySelector('[data-attach-open]').click()
  await new Promise((res) => {
    const tick = () => {
      const now = performance.now() - t0
      const m = document.querySelector('[role="menu"]'); const bx = m?.querySelector('[data-attach-box]')
      if (m) {
        const r = m.getBoundingClientRect(); const g = getComputedStyle(m)
        const tr = new DOMMatrix(g.transform)
        const glint = bx?.querySelector('.glass-glint')
        out.push({ t: Math.round(now), x: +r.left.toFixed(1), y: +r.top.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), scale: +tr.a.toFixed(4), op: +(+g.opacity).toFixed(3),
          origin: g.transformOrigin, glint: glint ? +(+getComputedStyle(glint).opacity).toFixed(3) : null,
          rowOp: +(+getComputedStyle(m.querySelector('[role="menuitem"]').parentElement.parentElement).opacity).toFixed(3) })
      } else out.push({ t: Math.round(now), none: true })
      if (now < 900) requestAnimationFrame(tick); else res()
    }
    requestAnimationFrame(tick)
  })
  return out
})
console.log('\nENTRANCE (menu grows out of the "+")')
for (const s of entrance.filter((_, i) => i % 2 === 0 || i < 8)) console.log(`${String(s.t).padStart(4)}  ${s.none ? 'none' : `box ${s.x},${s.y} ${s.w}×${s.h}  scale ${s.scale}  op ${s.op}  glint ${s.glint}  rows ${s.rowOp}  origin ${s.origin}`}`)
const menu = await box('[role="menu"]')
const menuBox = await box('[data-attach-box]')
console.log('\nPLUS ', plus.join(','), '\nMENU ', menu.join(','), '\nBOX  ', menuBox.join(','))
console.log('menu on the "+" box: dx', +(menu[0] - plus[0]).toFixed(2), 'dy', +(menu[1] - plus[1]).toFixed(2), ' size', menuBox[2], '×', menuBox[3], '(board 208 × 105)')
console.log('box style', JSON.stringify(await style('[data-attach-box]', ['backgroundColor', 'borderRadius', 'paddingLeft', 'paddingTop', 'boxShadow'])))
const rows = await p.$$eval('[role="menu"] [role="menuitem"]', (els) => els.map((e) => { const r = e.getBoundingClientRect(); const g = getComputedStyle(e); const lab = e.querySelector('span:last-child'); const gl = getComputedStyle(lab)
  return { label: e.innerText.trim(), off: e.disabled, box: [r.left, r.top, r.width, r.height].map((n) => +n.toFixed(2)), radius: g.borderRadius, pad: g.paddingLeft, gap: g.gap, color: gl.color, font: gl.fontSize + '/' + gl.lineHeight, bg: g.backgroundColor } }))
console.log('ROWS', JSON.stringify(rows, null, 0))
/* icons: leading box */
console.log('ICON', JSON.stringify(await p.$eval('[role="menu"] [role="menuitem"] span:first-child', (e) => { const r = e.getBoundingClientRect(); const svg = e.querySelector('svg'); const sr = svg.getBoundingClientRect(); return { box: [r.width, r.height], svg: [sr.width, sr.height], fill: getComputedStyle(svg).fill, color: getComputedStyle(e).color } })))

/* ── 2. hover wash + bloom on a row ──────────────────────────────── */
const r1 = rows[1].box
await p.mouse.move(r1[0] + 60, r1[1] + 24)
await p.waitForTimeout(260)
console.log('\nHOVER row bg', (await p.$eval('[role="menu"] [role="menuitem"]:nth-child(2)', (e) => getComputedStyle(e).backgroundColor)), '(expect rgba(255,255,255,0.08))')
await p.mouse.down()
await p.waitForTimeout(90)
const bloom = await p.evaluate(() => [...document.querySelectorAll('[role="menu"] .glass-ripple, [role="menu"] [class*="ripple"], [role="menu"] [class*="bloom"]')].map((e) => ({ cls: e.className, r: e.getBoundingClientRect().width, op: getComputedStyle(e).opacity })))
console.log('BLOOM during press', JSON.stringify(bloom))
await p.mouse.move(r1[0] - 400, r1[1] + 24) /* release outside: a pointerup on the row would pick it */
await p.mouse.up()
await p.waitForTimeout(500)

/* ── 3. level resize: root → domains ─────────────────────────────── */
const resize = await p.evaluate(async () => {
  const out = []; const t0 = performance.now()
  document.querySelector('[role="menu"] [role="menuitem"]:last-child').click()
  await new Promise((res) => {
    const tick = () => {
      const now = performance.now() - t0
      const bx = document.querySelector('[data-attach-box]'); const r = bx.getBoundingClientRect()
      const lists = [...bx.querySelectorAll('[role="menuitem"]')].map((e) => e.innerText.trim().slice(0, 12))
      const groups = [...bx.querySelectorAll('.flex.flex-col')].map((g) => ({ n: g.children.length, op: +(+getComputedStyle(g).opacity).toFixed(2), x: +new DOMMatrix(getComputedStyle(g).transform).e.toFixed(1) }))
      out.push({ t: Math.round(now), x: +r.left.toFixed(1), y: +r.top.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), groups, items: lists.length })
      if (now < 800) requestAnimationFrame(tick); else res()
    }
    requestAnimationFrame(tick)
  })
  return out
})
console.log('\nRESIZE root → domains (208×105 → 280×203)')
for (const s of resize.filter((_, i) => i % 2 === 0)) console.log(`${String(s.t).padStart(4)}  box ${s.x},${s.y} ${s.w}×${s.h}  groups ${JSON.stringify(s.groups)}  items ${s.items}`)
const names = await p.$$eval('[role="menu"] [role="menuitem"]', (els) => els.map((e) => ({ label: e.innerText.trim(), h: e.getBoundingClientRect().height })))
console.log('NAMES', JSON.stringify(names))
const list = await box('[data-attach-box]')
console.log('LIST box', list.join(','), ' corner drift', +(list[0] - menuBox[0]).toFixed(2), +(list[1] - menuBox[1]).toFixed(2))

/* ── 4. exit (Escape) ────────────────────────────────────────────── */
const exit = await p.evaluate(async () => {
  const out = []; const t0 = performance.now()
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await new Promise((res) => {
    const tick = () => {
      const now = performance.now() - t0
      const m = document.querySelector('[role="menu"]')
      if (m) { const g = getComputedStyle(m); out.push({ t: Math.round(now), scale: +new DOMMatrix(g.transform).a.toFixed(4), op: +(+g.opacity).toFixed(3) }) } else out.push({ t: Math.round(now), gone: true })
      if (now < 400) requestAnimationFrame(tick); else res()
    }
    requestAnimationFrame(tick)
  })
  return out
})
console.log('\nEXIT (Escape)')
for (const s of exit) console.log(`${String(s.t).padStart(4)}  ${s.gone ? 'gone' : `scale ${s.scale}  op ${s.op}`}`)

/* ── 5. chip arrival ─────────────────────────────────────────────── */
await p.click('[data-attach-open]'); await p.waitForTimeout(500)
await p.click('[role="menu"] [role="menuitem"]:last-child'); await p.waitForTimeout(600)
const bare = await box('.he-composer')
const arrival = await p.evaluate(async () => {
  const out = []; const t0 = performance.now()
  document.querentSelectorAll = null
  document.querySelector('[role="menu"] [role="menuitem"]:nth-child(2)').click()
  await new Promise((res) => {
    const tick = () => {
      const now = performance.now() - t0
      const c = document.querySelector('[data-attach-domain]'); const f = document.querySelector('.he-composer')
      const fh = +f.getBoundingClientRect().height.toFixed(1)
      const menu = document.querySelector('[role="menu"]')
      if (c) {
        const g = getComputedStyle(c); const m = new DOMMatrix(g.transform)
        const body = c.querySelector(':scope > span:not(.glass-glint)'); const x = c.querySelector('button'); const glint = c.querySelector('.glass-glint')
        const gb = getComputedStyle(body); const gx = getComputedStyle(x)
        out.push({ t: Math.round(now), field: fh, menu: menu ? +(+getComputedStyle(menu).opacity).toFixed(2) : null, scale: +m.a.toFixed(4), tx: +m.e.toFixed(1), op: +(+g.opacity).toFixed(3),
          body: `${(+gb.opacity).toFixed(2)}@${new DOMMatrix(gb.transform).a.toFixed(3)}`, x: `${(+gx.opacity).toFixed(2)}@${new DOMMatrix(gx.transform).a.toFixed(3)}`, glint: glint ? +(+getComputedStyle(glint).opacity).toFixed(3) : null, origin: g.transformOrigin })
      } else out.push({ t: Math.round(now), field: fh, menu: menu ? +(+getComputedStyle(menu).opacity).toFixed(2) : null, none: true })
      if (now < 1400) requestAnimationFrame(tick); else res()
    }
    requestAnimationFrame(tick)
  })
  return out
})
console.log('\nCHIP ARRIVAL (pick odesa-coffee-roasters.com)')
for (const s of arrival.filter((_, i) => i % 2 === 0 || i < 10)) console.log(`${String(s.t).padStart(4)}  field ${s.field}  menu ${s.menu}  ${s.none ? 'no chip' : `chip scale ${s.scale} tx ${s.tx} op ${s.op}  body ${s.body}  ✕ ${s.x}  glint ${s.glint}  origin ${s.origin}`}`)
const withChip = await box('.he-composer'); const chip = await box('[data-attach-domain]')
console.log('FIELD', bare[3], '→', withChip[3], ' CHIP', chip.join(','), ' inset', +(chip[0] - withChip[0]).toFixed(2), +(chip[1] - withChip[1]).toFixed(2))
console.log('chip style', JSON.stringify(await style('[data-attach-domain]', ['backgroundColor', 'backdropFilter', 'borderRadius', 'paddingLeft', 'paddingRight', 'gap', 'fontSize', 'color'])))
/* hover on the chip and on its ✕ */
await p.mouse.move(chip[0] + 40, chip[1] + 18); await p.waitForTimeout(260)
console.log('chip hover bg', await p.$eval('[data-attach-domain]', (e) => getComputedStyle(e).backgroundColor))
const xb = await box('[data-attach-domain] button')
await p.mouse.move(xb[0] + 9, xb[1] + 9); await p.waitForTimeout(260)
console.log('✕ hover', JSON.stringify(await p.$eval('[data-attach-domain] button', (e) => ({ bg: getComputedStyle(e).backgroundColor, wash: [...e.querySelectorAll('*')].map((n) => n.className).join('|').slice(0, 120), after: getComputedStyle(e, '::after').opacity }))))
await p.mouse.down(); await p.waitForTimeout(80)
console.log('✕ press ink', JSON.stringify(await p.$eval('[data-attach-domain] .attach-x-ink', (e) => getComputedStyle(e).transform)), ' bloom', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('[data-attach-domain] .glass-ripple, [data-attach-domain] [class*="ripple"]')].map((e) => e.className))))
await p.mouse.move(chip[0] - 300, chip[1] + 18); await p.mouse.up(); await p.waitForTimeout(400)

/* ── 6. chip removal ─────────────────────────────────────────────── */
const removal = await p.evaluate(async () => {
  const out = []; const t0 = performance.now()
  document.querySelector('[data-attach-domain] button').click()
  await new Promise((res) => {
    const tick = () => {
      const now = performance.now() - t0
      const c = document.querySelector('[data-attach-domain]'); const f = document.querySelector('.he-composer')
      const fh = +f.getBoundingClientRect().height.toFixed(1)
      if (c) { const g = getComputedStyle(c); out.push({ t: Math.round(now), field: fh, scale: +new DOMMatrix(g.transform).a.toFixed(4), op: +(+g.opacity).toFixed(3), origin: g.transformOrigin }) }
      else out.push({ t: Math.round(now), field: fh, gone: true, focus: document.activeElement?.tagName + (document.activeElement?.getAttribute('aria-label') || '') })
      if (now < 900) requestAnimationFrame(tick); else res()
    }
    requestAnimationFrame(tick)
  })
  return out
})
console.log('\nCHIP REMOVAL (✕)')
for (const s of removal.filter((_, i) => i % 2 === 0 || i < 14)) console.log(`${String(s.t).padStart(4)}  field ${s.field}  ${s.gone ? `gone  focus ${s.focus}` : `chip scale ${s.scale} op ${s.op} origin ${s.origin}`}`)
console.log('FIELD after', (await box('.he-composer'))[3])

/* ── 7. Attach File → chooser → file chip ────────────────────────── */
await p.click('[data-attach-open]'); await p.waitForTimeout(500)
const [chooser] = await Promise.all([p.waitForEvent('filechooser'), p.click('[role="menu"] [role="menuitem"]:first-child')])
await chooser.setFiles({ name: 'brand-guidelines.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') })
await p.waitForTimeout(900)
const fchip = await p.$('[data-attach-file]')
console.log('\nFILE chip', fchip ? JSON.stringify(await p.$eval('[data-attach-file]', (e) => ({ text: e.innerText.trim(), h: e.getBoundingClientRect().height, icon: !!e.querySelector('svg') }))) : 'MISSING', ' field', (await box('.he-composer'))[3], ' menu open?', !!(await p.$('[role="menu"]')))
await p.screenshot({ path: 'scratchpad/attach-menu/file-chip.png', clip: { x: bare[0] - 10, y: bare[1] - 10, width: bare[2] + 20, height: 200 } })
await p.click('[data-attach-file] button'); await p.waitForTimeout(700)
console.log('after ✕ on file chip: field', (await box('.he-composer'))[3], ' chip gone', !(await p.$('[data-attach-file]')))

/* ── 8. both chips at once + page-load chip does NOT animate ─────── */
await p.goto(url('p=empty&h=empty&a=trial&t=1&c=2000&i=dh-free&g=fit-ration.com'), { waitUntil: 'networkidle' })
const early = await p.evaluate(async () => { const out = []; for (let i = 0; i < 12; i++) { const c = document.querySelector('[data-attach-domain]'); out.push(c ? +new DOMMatrix(getComputedStyle(c).transform).a.toFixed(3) : null); await new Promise(requestAnimationFrame) } return out })
console.log('\nPAGE-LOAD chip scale over first frames (should be 1 or hidden by hero entrance, never a spring):', JSON.stringify(early))
await p.waitForTimeout(2600)
console.log('page-load field', (await box('.he-composer'))[3], ' glint on load-chip?', !!(await p.$('[data-attach-domain] .glass-glint')))
await b.close()
console.log('\ndone')
