/**
 * Edit bar docking smoke on the production build (vite preview 4173).
 *   CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scratchpad/edit-dock/smoke.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const BASE = process.env.BASE || 'http://localhost:4173/'
const OUT = new URL('./shots/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const KEY = 'remixer-prototype/world/v6'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
const log = (...a) => console.log(...a)
const fails = []
const check = (n, ok, ev) => { log(ok ? 'PASS' : 'FAIL', n, ok ? '' : JSON.stringify(ev)); if (!ok) fails.push(n) }
page.on('pageerror', (e) => log('PAGE ERROR', e.message))
await page.goto(BASE + '?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await page.evaluate((k) => localStorage.removeItem(k), KEY)
await page.waitForTimeout(400)
await page.click('.home-card-face')
await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await page.waitForSelector('[data-ve-bar]', { timeout: 15000 })
await page.waitForTimeout(800)

/* 1 · at rest: no dock handle; hover grows it */
const rest = await page.evaluate(() => { const b = document.querySelector('[data-ve-bar]'); const r = b.getBoundingClientRect(); return { w: r.width, seg: !!document.querySelector('[data-ve-dock-segment]'), slot: !!document.querySelector('[data-rail-dock]') } })
check('at rest: 76 wide, no handle, no rail slot', rest.w === 76 && !rest.seg && !rest.slot, rest)
const bb = await (await page.$('[data-ve-bar]')).boundingBox()
await page.mouse.move(bb.x + 20, bb.y + 20)
const widths = []
for (let i = 0; i < 12; i++) { await page.waitForTimeout(50); widths.push(await page.evaluate(() => Math.round(document.querySelector('[data-ve-bar]').getBoundingClientRect().width))) }
const hov = await page.evaluate(() => { const b = document.querySelector('[data-ve-bar]'); return { w: Math.round(b.getBoundingClientRect().width), handle: !!document.querySelector('[data-ve-dock-to-rail]'), divider: !!document.querySelector('[data-ve-dock-segment] span[aria-hidden]') } })
log('widths on hover', widths.join(' '))
check('hover: the handle segment grows the pill through intermediate widths to 117', hov.handle && hov.divider && hov.w === 117 && new Set(widths).size >= 3, { hov, widths })
await page.screenshot({ path: OUT + 'd1-hover.png' })
await page.mouse.move(bb.x + 20, bb.y - 200); await page.waitForTimeout(400)
check('leave: handle folds, 76 again', (await page.evaluate(() => Math.round(document.querySelector('[data-ve-bar]').getBoundingClientRect().width))) === 76)

/* 2 · click › → the glass flies into the rail slot above the support button */
await page.mouse.move(bb.x + 20, bb.y + 20); await page.waitForTimeout(500)
const from = await page.evaluate(() => { const r = document.querySelector('[data-ve-bar]').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })
await page.click('[data-ve-dock-to-rail]')
const trace = []
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(25)
  trace.push(await page.evaluate(() => { const f = document.querySelector('[data-ve-flight]'); if (!f) return null; const r = f.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), barVis: getComputedStyle(document.querySelector('[data-ve-bar]') || document.body).visibility, dockVis: document.querySelector('[data-ve-dock-host]') ? getComputedStyle(document.querySelector('[data-ve-dock-host]')).visibility : null } }))
}
const frames = trace.filter(Boolean)
log('flight frames', frames.length, JSON.stringify(frames.slice(0, 3)), '…', JSON.stringify(frames.slice(-2)))
await page.waitForTimeout(600)
const docked = await page.evaluate(() => {
  const d = document.querySelector('[data-ve-dock]'); const s = document.querySelector('[data-rail-dock]'); const sup = document.querySelector('nav button[aria-label="Support chat"]')
  if (!d || !s || !sup) return { d: !!d, s: !!s, sup: !!sup }
  const r = d.getBoundingClientRect(), q = sup.getBoundingClientRect(), nav = d.closest('nav').getBoundingClientRect()
  return { w: r.width, h: r.height, radius: getComputedStyle(d).borderRadius, gapToSupport: Math.round(q.top - r.bottom), centreOff: Math.round((r.x + r.width / 2) - (nav.x + nav.width / 2)), bar: !!document.querySelector('[data-ve-bar]'), flight: !!document.querySelector('[data-ve-flight]')}
})
log(docked)
check('the flight starts at the pill and ends at the slot (box springs)', frames.length >= 8 && Math.abs(frames[0].x - from.x) < 120 && frames[0].w > 90 && frames.at(-1).w <= 52 && frames.at(-1).h >= 44, { first: frames[0], last: frames.at(-1), from })
check('during the flight neither home is drawn', frames.every((f) => f.barVis === 'hidden' && (f.dockVis === null || f.dockVis === 'hidden')), frames.slice(0, 4))
check('docked: 48 × 48 r16 centred on the rail, 8 above the support button, floating bar gone', docked.w === 48 && docked.h === 48 && docked.radius === '16px' && docked.gapToSupport === 8 && docked.centreOff === 0 && !docked.bar && !docked.flight, docked)
await page.screenshot({ path: OUT + 'd2-docked.png' })

/* 3 · hover the rail button → tools pop out to its left; Edit works from there */
const db = await (await page.$('[data-ve-dock]')).boundingBox()
await page.mouse.move(db.x + 24, db.y + 24); await page.waitForTimeout(700)
const pop = await page.evaluate(() => { const p = document.querySelector('[data-ve-popped]'); if (!p) return null; const r = p.getBoundingClientRect(), d = document.querySelector('[data-ve-dock]').getBoundingClientRect(); return { gap: Math.round(d.left - r.right), centreOff: Math.round((r.y + r.height / 2) - (d.y + d.height / 2)), tools: document.querySelectorAll('[data-ve-popped] [data-ve-tool]').length, undock: !!document.querySelector('[data-ve-undock]'), glass: p.classList.contains('liquid-glass'), opacity: getComputedStyle(p).opacity, transform: getComputedStyle(p).transform } })
log(pop)
check('pop-out: glass pill 8 px left of the button, centred on it, Edit + Select + ‹', pop && pop.gap === 8 && Math.abs(pop.centreOff) <= 1 && pop.tools === 2 && pop.undock && pop.glass && pop.opacity === '1', pop)
await page.screenshot({ path: OUT + 'd3-popped.png' })
await page.click('[data-ve-popped] [data-ve-tool="edit"]'); await page.waitForTimeout(500)
const on = await page.evaluate(() => ({ pressed: document.querySelector('[data-ve-tool="edit"]')?.getAttribute('aria-pressed'), hosts: document.querySelectorAll('[data-edit]').length, dockBg: getComputedStyle(document.querySelector('[data-ve-dock]')).backgroundColor, dockPressed: document.querySelector('[data-ve-dock]').getAttribute('aria-pressed') }))
check('Edit from the pop-out switches the mode on; the rail button lights blue', on.pressed === 'true' && on.hosts > 0 && on.dockBg === 'rgba(21, 135, 255, 0.12)' && on.dockPressed === 'true', on)
await page.mouse.move(400, 400); await page.waitForTimeout(500)
check('leaving folds the pop-out (no batch pending)', !(await page.$('[data-ve-popped]')))
/* the keyboard ladder still works with the bar docked */
await page.keyboard.press('Escape'); await page.waitForTimeout(300)
check('Esc turns the tool off while docked', (await page.evaluate(() => document.querySelector('[data-ve-dock]').getAttribute('aria-pressed'))) === 'false')

/* 4 · ‹ flies the glass back to the canvas's foot */
await page.mouse.move(db.x + 24, db.y + 24); await page.waitForTimeout(600)
await page.click('[data-ve-undock]')
const back = []
for (let i = 0; i < 40; i++) { await page.waitForTimeout(25); back.push(await page.evaluate(() => { const f = document.querySelector('[data-ve-flight]'); if (!f) return null; const r = f.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), barVis: document.querySelector('[data-ve-bar]') ? getComputedStyle(document.querySelector('[data-ve-bar]')).visibility : 'none' } })) }
const bf = back.filter(Boolean)
log('return frames', bf.length, JSON.stringify(bf.slice(0, 2)), '…', JSON.stringify(bf.slice(-2)))
await page.waitForTimeout(600)
const home = await page.evaluate(() => { const b = document.querySelector('[data-ve-bar]'); const m = document.querySelector('main').getBoundingClientRect(); if (!b) return null; const r = b.getBoundingClientRect(); return { w: r.width, centreOff: Math.round((r.x + r.width / 2) - (m.x + m.width / 2)), lift: Math.round(m.bottom - r.bottom), vis: getComputedStyle(b).visibility, opacity: getComputedStyle(b).opacity, slot: !!document.querySelector('[data-rail-dock]'), dock: !!document.querySelector('[data-ve-dock]'), flight: !!document.querySelector('[data-ve-flight]') } })
log(home)
check('the return flight starts at the slot and lands on the pill (hidden until it lands)', bf.length >= 8 && bf[0].w <= 52 && bf.at(-1).w >= 70 && bf.every((f) => f.barVis === 'hidden'), { first: bf[0], last: bf.at(-1) })
check('back home: 76 wide, centred, 29 up, visible; slot and rail button gone', home && home.w === 76 && home.centreOff === 0 && home.lift === 29 && home.vis === 'visible' && home.opacity === '1' && !home.slot && !home.dock && !home.flight, home)
await page.screenshot({ path: OUT + 'd4-home.png' })

log(fails.length ? `\n${fails.length} FAIL` : '\nall green')
await browser.close()
process.exit(fails.length ? 1 : 0)
