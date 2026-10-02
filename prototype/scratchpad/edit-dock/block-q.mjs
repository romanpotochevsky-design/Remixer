/**
 * Block Q of scripts/check-brief-flow.mjs — THE EDIT BAR DOCKS — standing alone, for a quick rerun
 * (~40 s) without the suite's other ~6 minutes. The body between the BLOCK-O markers is the same
 * text as the block in the harness; keep them in step (the block was spliced from here).
 *
 *   cd prototype && npm run build && (npx vite preview --port 4173 &)
 *   CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scratchpad/visual-editor/block-o.mjs
 */
import fs from 'node:fs'

let chromium
try { ({ chromium } = await import('playwright')) }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')) }

const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = process.env.OUT || '/tmp/check-brief'
fs.mkdirSync(OUT, { recursive: true })

const NEW_PROJECT = 'p=empty&h=empty&a=trial&t=1&c=2000&i=none'
const at = (q = NEW_PROJECT) => `${BASE}${BASE.includes('?') ? '&' : '?'}${q}`

const results = []
const check = (name, ok, extra = '') => {
  results.push([name, ok])
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`)
}

const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } })
const p = await ctx.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(e.message))

const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png` })
const siteUp = () => p.$('.site-stage h1').then(Boolean)

/* BLOCK-Q-BEGIN */
/* ═══════════════════════════════════════════════════════════════════════════════════════════
 * Q · THE EDIT BAR DOCKS — one glass object with two homes (designer 30.09.2026, from a Lovable
 *     recording: «при ховере… появляется кнопка со стрелкой (прибить этот бар в панель справа)…
 *     этот бар… перелетает и прикрепляется справа… при ховере на иконку… выскакивают кнопки…
 *     по клику вернуть бар снова по центру»; with a screenshot of the rail: «вот сюда оно должно
 *     перелетать и прикрепляться справа» — the slot above the support button).
 *
 * WHAT THIS BLOCK GUARDS:
 *  · at rest the pill is 76 and carries no handle; hovering grows a glass segment with «›|» through
 *    intermediate widths (the box springs, not snaps); leaving folds it;
 *  · «›» flies the glass: a fixed flight box starts at the pill and lands on a 48 × 48 r16 rail
 *    button centred on the rail, 8 above the support button; while it flies NEITHER home is drawn
 *    (one object, never two); the floating pill is gone once it lands;
 *  · hovering the rail button pops a glass pill 8 px to its left, centred on it, with Edit, Select
 *    and «|‹»; Edit from there switches the mode on and lights the rail button in the action blue;
 *    leaving folds the pop-out; the Esc ladder still works while docked;
 *  · «‹» flies the glass back: the pill mounts hidden at its resting place and shows only when the
 *    flight lands — 86 wide, centred, 10 up; slot and rail button gone.
 * ═══════════════════════════════════════════════════════════════════════════════════════════ */
{
  const KEY = 'remixer-prototype/world/v6'
  const LIVE = 'p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'
  const widthOf = (sel) => p.evaluate((q) => Math.round(document.querySelector(q)?.getBoundingClientRect().width ?? 0), sel)
  await p.goto(at(LIVE), { waitUntil: 'networkidle' })
  await p.evaluate((k) => localStorage.removeItem(k), KEY)
  await p.waitForTimeout(600); await p.click('.home-card-face')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
  await p.waitForSelector('[data-ve-bar]', { timeout: 15000 }); await p.waitForTimeout(800)
  await p.click('[data-ve-clear]').catch(() => {})

  /* ── 1 · the handle grows on hover ─────────────────────────────────────────────── */
  const rest = { w: await widthOf('[data-ve-bar]'), seg: !!(await p.$('[data-ve-dock-segment]')), slot: !!(await p.$('[data-rail-dock]')), tools: await p.evaluate(() => [...document.querySelectorAll('[data-ve-bar] [data-ve-tool]')].map((t) => { const r = t.getBoundingClientRect(); return [Math.round(r.x * 10) / 10, Math.round(r.width * 10) / 10, getComputedStyle(t).transform] })) }
  check('at rest the pill is 86 wide (board 31442:44737: 1 px rim + 4 pad around 36 tools) with no dock handle, and the rail has no dock slot', rest.w === 86 && !rest.seg && !rest.slot, JSON.stringify({ w: rest.w, seg: rest.seg, slot: rest.slot }))
  const bb = await (await p.$('[data-ve-bar]')).boundingBox()
  await p.mouse.move(bb.x + 20, bb.y + 20)
  const widths = []
  for (let i = 0; i < 12; i++) { await p.waitForTimeout(50); widths.push(await widthOf('[data-ve-bar] [data-ve-glass]')) }
  const hov = { w: widths.at(-1), handle: !!(await p.$('[data-ve-dock-to-rail]')), steps: new Set(widths).size, tools: await p.evaluate(() => [...document.querySelectorAll('[data-ve-bar] [data-ve-tool]')].map((t) => { const r = t.getBoundingClientRect(); return [Math.round(r.x * 10) / 10, Math.round(r.width * 10) / 10, getComputedStyle(t).transform] })), bar: await widthOf('[data-ve-bar]') }
  check('hovering STRETCHES THE GLASS over the tools to uncover the «›|» handle — through intermediate widths, past 135 (131 + 2 px swell each side) and back (a liquid edge), the tools\' box still 86', hov.handle && hov.w === 135 && hov.steps >= 3 && Math.max(...widths) > 135 && hov.bar === 86, JSON.stringify({ hov, widths }))
  check('…and the tools themselves neither move nor scale while it stretches', hov.tools.length === 2 && hov.tools.every((t, i) => Math.abs(t[0] - rest.tools[i][0]) < 0.6 && Math.abs(t[1] - rest.tools[i][1]) < 0.6 && t[2] === 'none'), JSON.stringify({ hov: hov.tools, rest: rest.tools }))
  await shot('Q1-dock-handle')
  await p.mouse.move(bb.x + 20, bb.y - 200); await p.waitForTimeout(450)
  check('leaving folds the handle — 86 again', (await widthOf('[data-ve-bar] [data-ve-glass]')) === 86)

  /* ── 2 · «›» flies the glass into the rail ─────────────────────────────────────── */
  await p.mouse.move(bb.x + 20, bb.y + 20); await p.waitForTimeout(500)
  const from = await p.evaluate(() => { const r = document.querySelector('[data-ve-bar] [data-ve-glass]').getBoundingClientRect(); return { x: r.x, w: r.width } })
  /* sampled IN THE PAGE on every frame from the press — a 25 ms poll from here lands its first sample
     ~50 ms in, when the .42 s flight has already crossed ~200 px (measured on the build before and
     after the Select rebuild alike: the trajectories match frame for frame; the poll missed the start) */
  await p.evaluate(() => {
    window.__dockTr = []; window.__dockT0 = 0
    document.addEventListener('pointerdown', () => { window.__dockT0 = performance.now() }, { capture: true, once: true })
    const tick = () => {
      if (window.__dockT0) {
        const f = document.querySelector('[data-ve-flight]')
        if (f) { const r = f.getBoundingClientRect(); const bar = document.querySelector('[data-ve-bar]'); const host = document.querySelector('[data-ve-dock-host]'); window.__dockTr.push({ x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height), barVis: bar ? getComputedStyle(bar).visibility : 'none', dockVis: host ? getComputedStyle(host).visibility : null }) }
      }
      if (!window.__dockT0 || performance.now() - window.__dockT0 < 1200) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  await p.click('[data-ve-dock-to-rail]')
  await p.waitForTimeout(1300)
  const fr = await p.evaluate(() => window.__dockTr)
  await p.waitForTimeout(600)
  const docked = await p.evaluate(() => {
    const d = document.querySelector('[data-ve-dock]'); const sup = document.querySelector('nav button[aria-label="Support chat"]')
    if (!d || !sup) return { d: !!d, sup: !!sup }
    const r = d.getBoundingClientRect(), q = sup.getBoundingClientRect(), nav = d.closest('nav').getBoundingClientRect()
    return { w: r.width, h: r.height, radius: getComputedStyle(d).borderRadius, gap: Math.round(q.top - r.bottom), off: Math.round((r.x + r.width / 2) - (nav.x + nav.width / 2)), bar: !!document.querySelector('[data-ve-bar]'), flight: !!document.querySelector('[data-ve-flight]'), slot: !!document.querySelector('[data-rail-dock]') }
  })
  check('«›» flies ONE glass box from the STRETCHED glass (131, swollen to 135) to the slot — it starts at that size and lands 48 tall, through at least 8 sampled frames',
    fr.length >= 8 && Math.abs(fr[0].x - from.x) < 160 && fr[0].w > 90 && fr[0].w <= 160 && fr.at(-1).w <= 52 && fr.at(-1).h >= 44, JSON.stringify({ first: fr[0], last: fr.at(-1), from }))
  check('while it flies neither home is drawn — the pill is hidden and the rail button is hidden until the clone has LANDED (≤ 50 wide); then the tile is revealed under the still-present clone, which dissolves over it (the glass never vanishes in one frame)', fr.length > 0 && fr.every((f) => f.barVis === 'hidden' && (f.dockVis === null || f.dockVis === 'hidden' || f.w <= 50)) && fr.some((f) => f.dockVis === 'visible' && f.w <= 50), JSON.stringify(fr.slice(0, 3)))
  check('docked: a 48 × 48 r16 rail button centred on the rail, 8 above the support button; the floating pill is gone',
    docked.w === 48 && docked.h === 48 && docked.radius === '16px' && docked.gap === 8 && docked.off === 0 && !docked.bar && !docked.flight && docked.slot, JSON.stringify(docked))
  await shot('Q2-docked')

  /* ── 3 · the tools pop out of the rail button ──────────────────────────────────── */
  const db = await (await p.$('[data-ve-dock]')).boundingBox()
  await p.mouse.move(db.x + 24, db.y + 24); await p.waitForTimeout(700)
  const pop = await p.evaluate(() => { const el = document.querySelector('[data-ve-popped]'); if (!el) return null; const r = el.getBoundingClientRect(), d = document.querySelector('[data-ve-dock]').getBoundingClientRect(); return { gap: Math.round(d.left - r.right), off: Math.round((r.y + r.height / 2) - (d.y + d.height / 2)), tools: el.querySelectorAll('[data-ve-tool]').length, undock: !!el.querySelector('[data-ve-undock]'), glass: !!el.querySelector('.liquid-glass'), opacity: getComputedStyle(el).opacity } })
  check('hovering the rail button pops a glass pill 8 px to its left, centred on it, with Edit, Select and «|‹»', !!pop && pop.gap === 8 && Math.abs(pop.off) <= 1 && pop.tools === 2 && pop.undock && pop.glass && pop.opacity === '1', JSON.stringify(pop))
  await shot('Q3-popped')
  await p.click('[data-ve-popped] [data-ve-tool="edit"]'); await p.waitForTimeout(500)
  const on = await p.evaluate(() => ({ pressed: document.querySelector('[data-ve-tool="edit"]')?.getAttribute('aria-pressed'), hosts: document.querySelectorAll('[data-edit]').length, bg: getComputedStyle(document.querySelector('[data-ve-dock]')).backgroundColor, dock: document.querySelector('[data-ve-dock]').getAttribute('aria-pressed') }))
  check('Edit from the pop-out switches the mode on, and the rail button lights in the action blue like a selected rail tile', on.pressed === 'true' && on.hosts > 0 && on.bg === 'rgba(21, 135, 255, 0.12)' && on.dock === 'true', JSON.stringify(on))
  await p.mouse.move(400, 400); await p.waitForTimeout(500)
  check('leaving folds the pop-out while nothing is pending', !(await p.$('[data-ve-popped]')))
  await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  check('Esc still climbs the ladder while docked — the tool goes off', (await p.evaluate(() => document.querySelector('[data-ve-dock]').getAttribute('aria-pressed'))) === 'false')

  /* ── 4 · «‹» flies it back ─────────────────────────────────────────────────────── */
  await p.mouse.move(db.x + 24, db.y + 24); await p.waitForTimeout(600)
  await p.click('[data-ve-undock]')
  const back = []; const hand = []
  for (let i = 0; i < 60; i++) {
    await p.waitForTimeout(16)
    const g = await p.evaluate(() => {
      const r = (e) => { if (!e) return null; const q = e.getBoundingClientRect(); return [Math.round(q.x * 10) / 10, Math.round(q.y * 10) / 10, Math.round(q.width * 10) / 10, Math.round(q.height * 10) / 10] }
      const f = document.querySelector('[data-ve-flight]'); const bar = document.querySelector('[data-ve-bar]')
      if (f) { const svgs = f.querySelectorAll('svg'); return { who: 'flight', w: Math.round(f.getBoundingClientRect().width), barVis: bar ? getComputedStyle(bar).visibility : 'none', box: r(f), t: r(svgs[0]), sel: r(svgs[1]) } }
      if (bar && getComputedStyle(bar).visibility === 'visible') { const svgs = bar.querySelectorAll('[data-ve-tool] svg'); return { who: 'pill', box: r(bar.querySelector('[data-ve-glass]')), t: r(svgs[0]), sel: r(svgs[1]) } }
      return null
    })
    if (g && g.who === 'flight') back.push(g)
    if (g) hand.push(g)
    if (g && g.who === 'pill') break
  }
  const bf = back
  /* THE HAND-OVER IS INVISIBLE: the clone carries the pill's own tools, so its last frame and the pill's first are the same picture */
  const lastF = hand.filter((f) => f.who === 'flight').at(-1); const firstP = hand.find((f) => f.who === 'pill')
  const dev = (a, b) => (a && b ? Math.max(...a.map((v, i) => Math.abs(v - b[i]))) : 99)
  check('the clone lands as the pill\'s own picture: on the hand-over frame its glass box, «T» and Select sit within 1.5 px of the pill\'s (no glyph jumps, no button unfolding)',
    !!lastF && !!firstP && dev(lastF.box, firstP.box) <= 1.5 && dev(lastF.t, firstP.t) <= 1.5 && dev(lastF.sel, firstP.sel) <= 1.5, JSON.stringify({ lastF, firstP }))
  await p.waitForTimeout(600)
  const home = await p.evaluate(() => { const el = document.querySelector('[data-ve-bar]'); const m = document.querySelector('main').getBoundingClientRect(); if (!el) return null; const r = el.getBoundingClientRect(); return { w: r.width, off: Math.round((r.x + r.width / 2) - (m.x + m.width / 2)), lift: Math.round(m.bottom - r.bottom), vis: getComputedStyle(el).visibility, opacity: getComputedStyle(el).opacity, slot: !!document.querySelector('[data-rail-dock]'), dock: !!document.querySelector('[data-ve-dock]'), flight: !!document.querySelector('[data-ve-flight]') } })
  check('«‹» flies the glass back — from 48 wide to the pill\'s width, the pill hidden until it lands', bf.length >= 8 && bf[0].w <= 84 && bf.at(-1).w >= 70 && bf.every((f) => f.barVis === 'hidden'), JSON.stringify({ first: bf[0], last: bf.at(-1) }))
  check('home again: the pill is 86 wide, centred, 10 up and visible; the slot and the rail button are gone', !!home && home.w === 86 && home.off === 0 && home.lift === 10 && home.vis === 'visible' && home.opacity === '1' && !home.slot && !home.dock && !home.flight, JSON.stringify(home))
  await shot('Q4-home')
}

/* BLOCK-Q-END */

check('no page errors anywhere in the run', errors.length === 0, errors.join(' | ').slice(0, 300))
await b.close()

const failed = results.filter(([, ok]) => !ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed · screenshots in ${OUT}`)
process.exit(failed ? 1 : 0)
