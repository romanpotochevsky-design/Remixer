/**
 * Version cards — motion traces on the production build (rAF sampling of computed styles).
 *   CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scratchpad/version-cards/film.mjs
 */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173/'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message))
const fails = []
const check = (n, ok, ev) => { console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : JSON.stringify(ev)); if (!ok) fails.push(n) }
await page.goto(BASE + '?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await page.click('.home-card-face')
await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await page.waitForTimeout(600)
/** Sample `fn` every frame for `ms`, starting now, in the page. */
const film = (fn, ms) => page.evaluate(([src, ms]) => new Promise((res) => {
  const f = new Function('return (' + src + ')()')
  const out = []; const t0 = performance.now()
  const tick = () => { const t = performance.now() - t0; out.push({ t: Math.round(t), ...f() }); if (t < ms) requestAnimationFrame(tick); else res(out) }
  requestAnimationFrame(tick)
}), [fn.toString(), ms])

/* 1 · a chat edit lands */
await page.fill('textarea', 'Please add a testimonials section'); await page.keyboard.press('Enter')
await page.waitForTimeout(3000)
const land = await film(() => {
  const c1 = document.querySelector('[data-version-card="1"]'); const c2 = document.querySelector('[data-version-card="2"]')
  const t2 = c2?.querySelector('[data-version-title]')
  const b = c1?.querySelector('[data-version-revert]')
  const sc = b ? getComputedStyle(b.parentElement.parentElement).transform : null
  return { w2: c2?.hasAttribute('data-version-working'), title: t2?.textContent, rev: !!b, revT: sc, cur1: c1?.hasAttribute('data-version-current') }
}, 1500)
const landAt = land.find((f) => f.w2 === false)
check('the card lands inside the window (working → settled)', !!landAt, land.slice(0, 3))
const popped = land.filter((f) => f.rev && f.revT && f.revT !== 'none')
check('the old card’s revert POPS in (scaled frames, not a snap)', popped.length >= 3, land.filter((f) => f.rev).slice(0, 4))
console.log('landing at', landAt?.t, 'ms; revert scale frames', popped.length)

/* 2 · three free edits → stack fold */
async function freeEdit(suffix) {
  await page.click('[data-ve-tool="edit"]'); await page.waitForTimeout(250)
  await page.click('[data-edit="home.hero.title"]'); await page.waitForTimeout(80)
  await page.keyboard.press('Control+End'); await page.keyboard.type(suffix)
  await page.click('[data-edit="home.hero.lead"]'); await page.waitForTimeout(120)
  await page.click('[data-ve-save]')
}
await page.waitForTimeout(1500)
await freeEdit(' a'); await page.waitForTimeout(600); await page.click('[data-ve-tool="edit"]').catch(() => {}); await page.waitForTimeout(300)
await freeEdit(' b'); await page.waitForTimeout(600); await page.click('[data-ve-tool="edit"]').catch(() => {}); await page.waitForTimeout(300)
await freeEdit(' c')
const fold = await film(() => {
  const run = document.querySelector('[data-version-run]')
  const cards = run ? [...run.querySelectorAll('[data-run-card]')] : []
  return { h: run ? Math.round(run.getBoundingClientRect().height) : null, ys: cards.map((c) => Math.round(c.getBoundingClientRect().top - run.getBoundingClientRect().top)) }
}, 900)
const hs = fold.map((f) => f.h)
console.log('fold heights', hs.join(' '))
console.log('fold ys first/last', JSON.stringify(fold[0]?.ys), JSON.stringify(fold.at(-1)?.ys))
check('the 3rd edit folds the run: the stack height travels (≥ 4 distinct heights) and ends at 72', new Set(hs).size >= 4 && hs.at(-1) === 72, hs)
check('…the cards end on the board’s peeks 0 / 8 / 16', JSON.stringify(fold.at(-1)?.ys) === '[0,8,16]', fold.at(-1))
const jumps = fold.slice(1).map((f, i) => Math.abs(f.h - fold[i].h))
check('…and no frame jumps more than 40 px', Math.max(...jumps) <= 40, jumps)
await page.click('[data-ve-tool="edit"]').catch(() => {}); await page.waitForTimeout(400)

/* 3 · fan out and back */
await page.click('[data-version-run] [data-run-card]:last-child [data-version-title]')
const fan = await film(() => { const run = document.querySelector('[data-version-run]'); return { h: Math.round(run.getBoundingClientRect().height), ys: [...run.querySelectorAll('[data-run-card]')].map((c) => Math.round(c.getBoundingClientRect().top - run.getBoundingClientRect().top)) } }, 900)
const fh = fan.map((f) => f.h)
console.log('fan heights', fh.join(' '))
check('fan-out: height grows through frames to 224, overshoots a touch (spring)', fh.at(-1) === 224 && new Set(fh).size >= 5 && Math.max(...fh) >= 224, fh)
check('…the front card moves DOWN to its place, older ones spread above', JSON.stringify(fan.at(-1).ys) === '[40,104,168]', fan.at(-1))
await page.click('[data-version-collapse]')
const back = await film(() => { const run = document.querySelector('[data-version-run]'); return { h: Math.round(run.getBoundingClientRect().height) } }, 900)
check('Show less folds back to 72 through frames', back.at(-1).h === 72 && new Set(back.map((f) => f.h)).size >= 5, back.map((f) => f.h))

/* 4 · details unfold */
await page.click('[data-version-card="1"] [data-version-details]')
const det = await film(() => ({ h: Math.round(document.querySelector('[data-version-card="1"]').getBoundingClientRect().height) }), 900)
const dh = det.map((f) => f.h)
console.log('details heights', dh.join(' '))
check('details unfold on a spring: the card grows through frames with an overshoot', new Set(dh).size >= 6 && Math.max(...dh) > dh.at(-1), dh)

/* 5 · the preview dip */
await page.click('[data-version-card="1"] [data-version-preview]')
const dip = await film(() => ({ o: +getComputedStyle(document.querySelector('[data-canvas-site] [data-prototype-note]')).opacity.slice(0, 5), v: document.querySelector('[data-site-version]')?.getAttribute('data-site-version') ?? null }), 700)
const minO = Math.min(...dip.map((f) => f.o))
const swapAt = dip.find((f) => f.v === '1')
check('the canvas dips (≤ .35) and turns to version 1 at the bottom of the dip', minO <= 0.35 && swapAt && swapAt.o <= 0.5, { minO, swapAt })
console.log('dip', dip.map((f) => `${f.t}:${f.o}${f.v ? '*' : ''}`).join(' '))

console.log(`\n${fails.length ? 'FAILED ' + fails.length : 'ALL PASS'}`)
await browser.close()
process.exit(fails.length ? 1 : 0)
