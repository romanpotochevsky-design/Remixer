/**
 * Version cards — end-to-end probe on the production build (vite preview 4173).
 *   CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scratchpad/version-cards/probe.mjs
 * Walks: the demo thread's V1 → a chat edit (working card → settled) → a second edit → the eye on
 * V1 (canvas shows it, bar + ring, edit bar away) → Esc → restore V2 through the confirmation →
 * three Visual Editor saves in a row (the stack folds with a count) → fan out → Show less.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const BASE = process.env.BASE || 'http://localhost:4173/'
const OUT = new URL('./shots/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const KEY = 'remixer-prototype/world/v6'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const log = (...a) => console.log(...a)
const fails = []
const check = (n, ok, ev) => { log(ok ? 'PASS' : 'FAIL', n, ok ? '' : JSON.stringify(ev)); if (!ok) fails.push(n) }
page.on('pageerror', (e) => log('PAGE ERROR', e.message))
const shot = (n) => page.screenshot({ path: OUT + n + '.png' })
const shotChat = async (n) => { const el = await page.$('.chat-dim'); if (el) await el.screenshot({ path: OUT + n + '.png' }) }

await page.goto(BASE + '?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await page.evaluate((k) => localStorage.removeItem(k), KEY)
await page.waitForTimeout(400)
await page.click('.home-card-face')
await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await page.waitForTimeout(900)

const cards = () => page.evaluate(() => [...document.querySelectorAll('[data-version-card]')].map((c) => {
  const r = c.getBoundingClientRect()
  return {
    n: +c.dataset.versionCard, kind: c.dataset.versionKind, cur: c.hasAttribute('data-version-current'), working: c.hasAttribute('data-version-working'),
    title: c.querySelector('[data-version-title]')?.textContent, revert: !!c.querySelector('[data-version-revert]'), eye: !!c.querySelector('[data-version-preview]'), chev: !!c.querySelector('[data-version-details]'),
    x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height), prev: c.hasAttribute('data-previewing'),
  }
}))

/* 1 · the demo thread's first version */
let cs = await cards()
check('demo thread: one card, «First Version», current, only the chevron', cs.length === 1 && cs[0].title === 'First Version' && cs[0].cur && !cs[0].revert && cs[0].chev, cs)
const geo = await page.evaluate(() => { const c = document.querySelector('[data-version-card]'); const col = document.querySelector('.chat-col'); const r = c.getBoundingClientRect(), q = col.getBoundingClientRect(); return { dx: Math.round(r.x - q.x), w: Math.round(r.width), colW: Math.round(q.width), h: Math.round(r.height), bg: getComputedStyle(c).backgroundColor, radius: getComputedStyle(c).borderRadius } })
check('card metrics: 8 px from the column edge (board x 8), 56 tall, #171719, r16', geo.dx === 8 && geo.h === 56 && geo.bg === 'rgb(23, 23, 25)' && geo.radius === '16px' && geo.w === geo.colW - 16, geo)
await shotChat('p1-demo')

/* 2 · a chat edit */
const send = async (text) => { await page.fill('textarea', text); await page.keyboard.press('Enter') }
await send('Can you update the main navigation menu?')
await page.waitForTimeout(1500)
cs = await cards()
const w2 = cs.find((c) => c.n === 2)
check('1.5 s after sending: card 2 is posted WORKING with its -ing line, no buttons', !!w2 && w2.working && /Updating/.test(w2.title) && !w2.chev && !w2.revert, cs)
await shotChat('p2-working')
await page.waitForTimeout(3200)
cs = await cards()
const c1 = cs.find((c) => c.n === 1), c2 = cs.find((c) => c.n === 2)
check('landed: «Navigation Update» is current (chevron only); First Version lost the mark and grew revert + eye', c2?.title === 'Navigation Update' && c2.cur && !c2.working && !c2.revert && c1 && !c1.cur && c1.revert && c1.eye, cs)
const nav = await page.evaluate(() => document.querySelector('[data-canvas-site] .site-nav-links')?.textContent)
check('the site changed: the nav reads Menu Plans Reviews FAQ', nav === 'MenuPlansReviewsFAQ', nav)
await page.waitForTimeout(1500)
await shotChat('p3-landed')

await send('Please add a testimonials section')
await page.waitForTimeout(5200)
check('the testimonials block is on the page', !!(await page.$('[data-canvas-site] [data-site-block="testimonials"]')))
cs = await cards()
check('three versions, the third current', cs.length === 3 && cs[2].cur && cs[2].title === 'Testimonials Section Added', cs)

/* 3 · the eye on version 1 */
await page.click('[data-version-card="1"] [data-version-preview]')
await page.waitForTimeout(700)
const pv = await page.evaluate(() => ({
  bar: document.querySelector('[data-version-bar]')?.getAttribute('data-version-bar'),
  ring: getComputedStyle(document.querySelector('[data-version-ring]')).opacity,
  ve: !!document.querySelector('[data-ve-bar]'),
  testi: !!document.querySelector('[data-canvas-site] [data-site-block="testimonials"]'),
  nav: document.querySelector('[data-canvas-site] .site-nav-links')?.textContent,
  ver: document.querySelector('[data-site-version]')?.getAttribute('data-site-version'),
  prev: document.querySelector('[data-version-card="1"]')?.hasAttribute('data-previewing'),
}))
check('eye: the canvas shows version 1 (no testimonials, the old nav), the bar says so, the ring is on, the edit bar stepped aside, the card is marked', pv.bar === '1' && pv.ring === '1' && !pv.ve && !pv.testi && pv.nav === 'MenuHow it worksPricingFAQ' && pv.ver === '1' && pv.prev, pv)
await shot('p4-preview')
await page.keyboard.press('Escape')
await page.waitForTimeout(600)
const back = await page.evaluate(() => ({ bar: !!document.querySelector('[data-version-bar]'), testi: !!document.querySelector('[data-canvas-site] [data-site-block="testimonials"]') }))
check('Esc: back to the site as it is', !back.bar && back.testi, back)

/* 4 · restore version 2 */
await page.click('[data-version-card="2"] [data-version-revert]')
await page.waitForSelector('[role="alertdialog"]')
const dlg = await page.evaluate(() => document.querySelector('[role="alertdialog"]').innerText)
check('the confirmation names the version and promises nothing is deleted, free', /Restore this version\?/.test(dlg) && /Navigation Update/.test(dlg) && /Nothing is deleted/.test(dlg) && /free/.test(dlg), dlg)
await page.click('[role="alertdialog"] button:has-text("Restore")')
await page.waitForTimeout(900)
cs = await cards()
const w = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY)
check('restored: card 4 «Restored “Navigation Update”» is current, nothing deleted, testimonials gone, nav kept, free', cs.length === 4 && cs[3].cur && /Restored/.test(cs[3].title) && !(await page.$('[data-canvas-site] [data-site-block="testimonials"]')) && w.credits === 620, { cs, credits: w.credits })
await shotChat('p5-restored')

/* 5 · three free edits in a row fold into a stack */
async function freeEdit(suffix) {
  await page.click('[data-ve-tool="edit"]'); await page.waitForTimeout(250)
  await page.click('[data-edit="home.hero.title"]'); await page.waitForTimeout(80)
  await page.keyboard.press('Control+End'); await page.keyboard.type(suffix)
  await page.click('[data-edit="home.hero.lead"]'); await page.waitForTimeout(120)
  await page.click('[data-ve-save]'); await page.waitForTimeout(500)
  await page.click('[data-ve-tool="edit"]').catch(() => {}); await page.waitForTimeout(250)
}
await freeEdit(' now')
cs = await cards()
check('a Save posts a free card: «Text Edit», current, with the T slot kind', cs.length === 5 && cs[4].kind === 'edit' && cs[4].title === 'Text Edit' && cs[4].cur, cs)
await freeEdit('!')
check('two free edits stand apart (no stack yet)', !(await page.$('[data-version-stacked]')))
await freeEdit('!')
await page.waitForTimeout(700)
const st = await page.evaluate(() => {
  const run = document.querySelector('[data-version-run]')
  const badge = document.querySelector('[data-version-badge]')?.textContent
  const r = run?.getBoundingClientRect()
  return { run: run?.getAttribute('data-version-run'), stacked: run?.hasAttribute('data-version-stacked'), badge, h: r ? Math.round(r.height) : null }
})
check('the third folds them into a stack: 3 in the run, the count badge «3», 72 tall (16 + 56)', st.run === '3' && st.stacked && st.badge === '3' && st.h === 72, st)
await shotChat('p6-stack')
await page.click('[data-version-run] [data-run-card]:last-child [data-version-title]')
await page.waitForTimeout(900)
const fan = await page.evaluate(() => { const run = document.querySelector('[data-version-run]'); return { stacked: run.hasAttribute('data-version-stacked'), h: Math.round(run.getBoundingClientRect().height), badge: !!document.querySelector('[data-version-badge]') } })
check('a tap fans it out: header + three cards (32 + 8 + 3×56 + 2×8 = 224), no badge', !fan.stacked && fan.h === 224 && !fan.badge, fan)
await shotChat('p7-fanned')
await page.click('[data-version-collapse]')
await page.waitForTimeout(900)
const fold = await page.evaluate(() => { const run = document.querySelector('[data-version-run]'); return { stacked: run.hasAttribute('data-version-stacked'), h: Math.round(run.getBoundingClientRect().height) } })
check('Show less folds it back to 72', fold.stacked && fold.h === 72, fold)

/* 6 · details */
await page.click('[data-version-card="2"] [data-version-details]')
await page.waitForTimeout(900)
const det = await page.evaluate(() => { const c = document.querySelector('[data-version-card="2"]'); return { h: Math.round(c.getBoundingClientRect().height), body: c.querySelector('[data-version-body]')?.innerText } })
check('the chevron unfolds what changed: version, time, price, the links before → after', det.h > 120 && /Version 2/.test(det.body) && /10 credits/.test(det.body) && /Menu · Plans · Reviews · FAQ/.test(det.body), det)
await shotChat('p8-details')

log(`\n${fails.length ? 'FAILED ' + fails.length : 'ALL PASS'}`)
await browser.close()
process.exit(fails.length ? 1 : 0)
