/** The review agents' repros for the Lovable-style Select tool (01.10.2026), as checks. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4174/'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
const errs = []
page.on('pageerror', (e) => { errs.push(e.message); console.log('PAGEERROR', e.message) })
let fails = 0
const ok = (c, m, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + m + (x ? ' — ' + x : '')); if (!c) fails++ }
const open = async () => {
  await page.goto(BASE + '?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await page.click('.home-card-face')
  await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
  await page.waitForTimeout(500)
}
const state = () => page.evaluate(() => ({
  path: document.querySelector('[data-site-page]')?.getAttribute('data-site-page'),
  pick: (() => { const r = document.querySelector('[data-ve-pick]')?.getBoundingClientRect(); return r ? [r.x, r.y, r.width, r.height].map((v) => Math.round(v)) : null })(),
  hover: !!document.querySelector('[data-ve-hover]'),
  tag: document.querySelector('[data-ve-tag]')?.textContent ?? null,
  tagInPage: !!document.querySelector('[data-ve-tag]')?.closest('[data-ve-overlay]'),
  bar: document.querySelector('[data-ve-pick-count]')?.textContent ?? null,
  chip: document.querySelector('[data-about-chip]')?.textContent ?? null,
  edit: !!document.querySelector('[data-ve-tool="edit"]:not([data-ve-ghost])'),
  pressed: document.querySelector('[data-ve-tool="select"]')?.getAttribute('aria-pressed') ?? null,
}))
const goPage = async (row) => {
  await page.click('[data-page-switch]'); await page.waitForTimeout(400)
  await page.click(`[data-page-row="${row}"]`); await page.waitForTimeout(900)
}
const box = async (sel) => page.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })

await open()
/* A · page switch with the tool off, then on: the tool works on the new page */
await goPage('/about')
await page.click('[data-ve-tool="select"]'); await page.waitForTimeout(300)
const p1 = await box('[data-site-page="/about"] h1')
await page.mouse.move(p1.x + 30, p1.y + p1.h / 2, { steps: 4 }); await page.waitForTimeout(150)
let s = await state()
ok(s.hover && s.tag === 'h1', 'after a page switch the tool rings and names (About h1)', JSON.stringify(s))
const homeBtn = await page.$('[data-site-page="/about"] footer button, [data-site-page="/about"] nav button')
if (homeBtn) {
  const hb = await homeBtn.boundingBox()
  await page.mouse.click(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.waitForTimeout(600)
  s = await state()
  ok(s.path === '/about' && !!s.pick, 'a click on a site button there picks it, the page stays', JSON.stringify(s))
}
/* B · tool on through a page switch: a pick on the new page draws its ring */
await page.click('[data-ve-pick-clear]').catch(() => {}); await page.waitForTimeout(400)
await goPage('/')
const para = await box('[data-site-page="/"] p')
await page.mouse.click(para.x + 10, para.y + para.h / 2); await page.waitForTimeout(400)
s = await state()
ok(!!s.pick && s.bar === '1 selection', 'tool left on through the switch: the pick draws its ring', JSON.stringify(s))
await page.click('[data-ve-pick-clear]'); await page.waitForTimeout(500)

/* C · a canvas window round trip keeps the pick — keyed (h1) and unkeyed (its container div) */
for (const which of ['h1', 'div']) {
  const sel = which === 'h1' ? '[data-pick="home.hero.title"]' : '[data-pick="home.hero.title"]'
  const b = await box(sel)
  if (which === 'h1') await page.mouse.click(b.x + 30, b.y + b.h / 2)
  else await page.evaluate(() => {
    const h = document.querySelector('[data-pick="home.hero.title"]')
    const r = h.parentElement.getBoundingClientRect()
    window.__pt = [r.x + 4, r.y + 4]
  }), await page.mouse.click(...(await page.evaluate(() => window.__pt)))
  await page.waitForTimeout(400)
  const before = await state()
  await page.click('[aria-label="Cloud"]'); await page.waitForTimeout(1300)
  await page.keyboard.press('Escape'); await page.waitForTimeout(1300)
  const after = await state()
  ok(!!after.pick && before.pick && after.pick.every((v, i) => Math.abs(v - before.pick[i]) <= 1) && after.bar === '1 selection' && after.chip === before.chip,
    `${which} pick survives a Cloud round trip, ring on the same box`, JSON.stringify({ before: before.pick, after }))
  await page.click('[data-ve-pick-clear]').catch(() => {}); await page.waitForTimeout(500)
}

/* D · the nav's logo rings above the sticky nav */
const logo = await box('[data-site-page="/"] .sticky button, [data-site-page="/"] .sticky a')
await page.mouse.move(logo.x + 6, logo.y + logo.h / 2, { steps: 3 }); await page.waitForTimeout(150)
const navRing = await page.evaluate(() => {
  const r = document.querySelector('[data-ve-hover]'); const o = document.querySelector('[data-ve-overlay]')
  const nav = document.querySelector('[data-site-page="/"] .sticky')
  return { ring: !!r, overlayZ: o && getComputedStyle(o).zIndex, navZ: nav && getComputedStyle(nav).zIndex }
})
ok(navRing.ring && +navRing.overlayZ > +navRing.navZ, 'nav element ring stands above the sticky nav', JSON.stringify(navRing))
const shot = await page.screenshot({ clip: { x: Math.round(logo.x) - 2, y: Math.round(logo.y) - 2, width: 6, height: 6 } })
console.log('   (nav ring pixel shot', shot.length, 'bytes)')

/* E · the pill lives inside the page (under the edit bar) */
s = await state()
ok(s.tagInPage, 'tag pill is inside the page overlay, not in the body', JSON.stringify(s))
const bar = await box('[data-ve-glass]')
await page.mouse.move(bar.x + bar.w / 2, bar.y - 6, { steps: 3 }); await page.waitForTimeout(150)
const cover = await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); return !!e?.closest('[data-ve-bar]') }, { x: bar.x + bar.w / 2 + 20, y: bar.y + 14 })
ok(cover, 'just above the bar, the bar stays on top of the pill')

/* F · Escape with a canvas window open: the window closes, the pick and the tool stay */
const h1b = await box('[data-pick="home.hero.title"]')
await page.mouse.click(h1b.x + 30, h1b.y + h1b.h / 2); await page.waitForTimeout(400)
await page.click('[aria-label="Analytics"]'); await page.waitForTimeout(1300)
await page.keyboard.press('Escape'); await page.waitForTimeout(1300)
s = await state()
ok(!!s.pick && s.pressed === 'true', 'Escape on Analytics closes it and leaves the pick and the tool', JSON.stringify(s))
/* G · Escape in the composer (where the pick put the caret) drops the pick */
const active = await page.evaluate(() => document.activeElement?.tagName)
await page.focus('aside textarea'); await page.keyboard.press('Escape'); await page.waitForTimeout(500)
s = await state()
ok(!s.pick && !s.chip && s.pressed === 'true', `Escape in the composer drops the pick (focus was ${active})`, JSON.stringify(s))

/* H · Clear changes the bar's width once: the select disc never steps left */
await page.mouse.click(h1b.x + 30, h1b.y + h1b.h / 2); await page.waitForTimeout(600)
const clr = await box('[data-ve-pick-clear]')
await page.mouse.move(clr.x + clr.w / 2, clr.y + clr.h / 2); await page.waitForTimeout(200)
await page.evaluate(() => {
  window.__xs = []
  const t0 = performance.now()
  const tick = () => { const b = document.querySelector('[data-ve-tool="select"]'); if (b) window.__xs.push(Math.round(b.getBoundingClientRect().x)); if (performance.now() - t0 < 700) requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
})
await page.mouse.down(); await page.mouse.up()
await page.waitForTimeout(800)
const xs = await page.evaluate(() => window.__xs)
let wentLeft = false
for (let i = 1; i < xs.length; i++) if (xs[i] < xs[i - 1] - 0.5) wentLeft = true
ok(!wentLeft, 'Clear: the select disc only moves one way', JSON.stringify([...new Set(xs)]))

/* I · undock with a pick standing: no clone flies a wrong picture */
await page.mouse.click(h1b.x + 30, h1b.y + h1b.h / 2); await page.waitForTimeout(500)
await page.click('[data-ve-pick-clear]'); await page.waitForTimeout(500)
const g = await box('[data-ve-glass]')
await page.mouse.move(g.x + 20, g.y + g.h / 2, { steps: 3 }); await page.waitForTimeout(500)
await page.click('[data-ve-dock-to-rail]'); await page.waitForTimeout(900)
await page.hover('[data-ve-dock]'); await page.waitForTimeout(500)
if ((await page.$eval('[data-ve-popped] [data-ve-tool="select"]', (e) => e.getAttribute('aria-pressed')).catch(() => null)) !== 'true') await page.click('[data-ve-popped] [data-ve-tool="select"]').catch(() => {})
await page.waitForTimeout(300)
const pressedDocked = await page.$eval('[data-ve-tool="select"]', (e) => e.getAttribute('aria-pressed')).catch(() => null)
await page.mouse.click(h1b.x + 30, h1b.y + h1b.h / 2); await page.waitForTimeout(500)
await page.hover('[data-ve-dock]'); await page.waitForTimeout(500)
await page.evaluate(() => { window.__fl = 0; new MutationObserver(() => { if (document.querySelector('[data-ve-flight]')) window.__fl++ }).observe(document.body, { childList: true, subtree: true }) })
await page.click('[data-ve-undock]').catch((e) => console.log('undock click', e.message)); await page.waitForTimeout(900)
const fl = await page.evaluate(() => window.__fl)
s = await state()
ok(fl === 0 && s.bar === '1 selection', `undocking with a pick: no flight, the pill comes back with its pick (select ${pressedDocked})`, JSON.stringify({ fl, s }))

ok(errs.length === 0, 'no page errors', errs.join(' | '))
console.log(fails ? `${fails} FAIL` : 'ALL PASS')
await browser.close()
