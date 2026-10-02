/**
 * Website media panel smoke run on the production build (vite preview on 4173).
 *   CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scratchpad/media-library/smoke.mjs
 * Rail button → panel (geometry, tabs, grid) → hover check → select two → bar → select all / clear →
 * delete one with the confirm → tabs → lightbox → Esc ladder → pick mode from the Image window.
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
const check = (name, ok, ev) => { log(ok ? 'PASS' : 'FAIL', name, ok ? '' : JSON.stringify(ev)); if (!ok) fails.push(name) }
const world = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), KEY)
page.on('pageerror', (e) => log('PAGE ERROR', e.message))

await page.goto(BASE + '?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await page.evaluate((k) => localStorage.removeItem(k), KEY)
await page.waitForTimeout(500)
await page.click('.home-card-face')
await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await page.waitForSelector('[data-canvas-toolbar]', { timeout: 15000 })
await page.waitForTimeout(500)

/* 1 · the rail button and the panel */
const rail = await page.$('[data-rail-media]')
check('rail has a Website media button', !!rail)
await rail.click()
await page.waitForTimeout(900)
const geo = await page.evaluate(() => {
  const p = document.querySelector('[data-media-panel]'); if (!p) return null
  const r = p.getBoundingClientRect()
  const cs = getComputedStyle(p)
  const tabs = [...document.querySelectorAll('[data-media-tab]')].map((b) => [b.dataset.mediaTab, b.getAttribute('aria-selected')])
  const tiles = document.querySelectorAll('[data-media-tile]').length
  const rail = document.querySelector('[data-rail-media]')
  return { x: r.x, y: r.y, w: r.width, right: innerWidth - r.right, bottom: innerHeight - r.bottom, bg: cs.backgroundColor, radius: cs.borderRadius, mode: p.dataset.mediaPanel, title: document.querySelector('[data-media-title]')?.textContent, tabs, tiles, railOn: rail?.getAttribute('aria-pressed'), railBg: getComputedStyle(rail).backgroundColor }
})
log(geo)
check('panel 480 wide, 8 from the rail, 8 from the top bar and the bottom', geo && geo.w === 480 && geo.right === 64 && geo.y === 60 && geo.bottom === 8, geo)
check('Gray/850 r16, title «Website media», Image tab selected, 10 tiles', geo && geo.bg === 'rgb(31, 31, 34)' && geo.radius === '16px' && geo.title === 'Website media' && geo.tabs[0][1] === 'true' && geo.tiles === 10, geo)
check('rail button pressed and lit', geo && geo.railOn === 'true' && geo.railBg !== 'rgba(0, 0, 0, 0)', geo)
await page.screenshot({ path: OUT + 'm1-open.png' })

/* 2 · hover → check-circle; click the circle → selected */
const first = await page.$('[data-media-tile]:nth-child(1)')
const fb = await first.boundingBox()
await page.mouse.move(fb.x + 60, fb.y + 60); await page.waitForTimeout(250)
const hov = await page.evaluate(() => getComputedStyle(document.querySelector('[data-media-tile]:nth-child(1) [data-media-check]')).opacity)
check('hover shows the check-circle', hov === '1', hov)
await page.click('[data-media-tile]:nth-child(1) [data-media-check]'); await page.waitForTimeout(500)
const sel = await page.evaluate(() => {
  const t = document.querySelector('[data-media-tile]:nth-child(1)')
  const img = t.querySelector('img')
  return { selected: t.dataset.selected, bg: getComputedStyle(t).backgroundColor, scale: getComputedStyle(img).transform, radius: getComputedStyle(img).borderRadius, check: getComputedStyle(t.querySelector('[data-media-check]')).color, bar: !!document.querySelector('[data-media-bar]'), count: document.querySelector('[data-media-count]')?.textContent }
})
log(sel)
check('selected: Gray/750 tile, photo shrunk with r10, blue check, bar «1 selected»', sel.selected === 'true' && sel.bg === 'rgb(51, 51, 58)' && sel.scale.includes('0.81') && sel.radius === '10px' && sel.check === 'rgb(21, 135, 255)' && sel.bar && sel.count === '1 selected', sel)
await page.screenshot({ path: OUT + 'm2-selected.png' })

/* 3 · while selecting, a click on a PHOTO toggles; shift-click ranges */
await page.click('[data-media-tile]:nth-child(3) [data-media-open]'); await page.waitForTimeout(300)
const two = await page.evaluate(() => document.querySelector('[data-media-count]')?.textContent)
check('click on a photo while selecting toggles it → «2 selected»', two === '2 selected', two)
await page.keyboard.down('Shift'); await page.click('[data-media-tile]:nth-child(6) [data-media-open]'); await page.keyboard.up('Shift'); await page.waitForTimeout(300)
const range = await page.evaluate(() => document.querySelector('[data-media-count]')?.textContent)
check('shift-click selects the range → «5 selected»', range === '5 selected', range)

/* 4 · the chevron menu: clear, select all */
await page.click('[data-media-count]'); await page.waitForTimeout(300)
check('menu opens', !!(await page.$('[data-media-menu]')))
await page.click('[data-media-menu] [role="menuitem"]:nth-child(1)'); await page.waitForTimeout(300)
const all = await page.evaluate(() => document.querySelector('[data-media-count]')?.textContent)
check('Select all → «10 selected»', all === '10 selected', all)
await page.keyboard.press('Escape'); await page.waitForTimeout(400)
check('Esc clears the selection, panel stays', !(await page.$('[data-media-bar]')) && !!(await page.$('[data-media-panel]')))

/* 5 · delete one through the confirm */
await page.click('[data-media-tile]:nth-child(4) [data-media-check]'); await page.waitForTimeout(300)
await page.click('[data-media-delete]'); await page.waitForTimeout(400)
const dlg = await page.evaluate(() => ({ title: document.querySelector('[role="alertdialog"] h2, [role="alertdialog"] [data-confirm-title]')?.textContent ?? document.querySelector('[role="alertdialog"]')?.innerText?.split('\n')[0], present: !!document.querySelector('[role="alertdialog"]') }))
log(dlg)
check('confirm dialog «Delete this image?»', dlg.present && /Delete this image\?/.test(dlg.title || ''), dlg)
await page.screenshot({ path: OUT + 'm3-confirm.png' })
await page.click('[role="alertdialog"] button:has-text("Delete")'); await page.waitForTimeout(700)
const after = await page.evaluate(() => ({ tiles: document.querySelectorAll('[data-media-tile]').length, bar: !!document.querySelector('[data-media-bar]') }))
const w1 = await world()
check('deleted: 9 tiles, bar gone, world.media has 9', after.tiles === 9 && !after.bar && w1.media?.length === 9, { after, media: w1.media?.length })

/* 6 · tabs */
await page.click('[data-media-tab="video"]'); await page.waitForTimeout(300)
check('Video tab: two posters', (await page.$$('[data-media-video]')).length === 2)
await page.click('[data-media-tab="audio"]'); await page.waitForTimeout(300)
check('Audio empty state', (await page.evaluate(() => document.querySelector('[data-media-empty]')?.textContent)) === 'No audio files found')
await page.screenshot({ path: OUT + 'm4-audio.png' })
await page.click('[data-media-tab="image"]'); await page.waitForTimeout(300)

/* 7 · lightbox */
await page.click('[data-media-tile]:nth-child(1) [data-media-open]'); await page.waitForTimeout(600)
const lb = await page.evaluate(() => { const l = document.querySelector('[data-media-lightbox]'); const img = l?.querySelector('img'); return { up: !!l, bg: l && getComputedStyle(l).backgroundColor, img: !!img, h: img?.getBoundingClientRect().height } })
check('lightbox up over an 85 % scrim', lb.up && lb.bg === 'rgba(0, 0, 0, 0.85)' && lb.img && lb.h <= 740, lb)
await page.screenshot({ path: OUT + 'm5-lightbox.png' })
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(300)
await page.keyboard.press('Escape'); await page.waitForTimeout(400)
check('Esc closes the lightbox, panel stays', !(await page.$('[data-media-lightbox]')) && !!(await page.$('[data-media-panel]')))
await page.keyboard.press('Escape'); await page.waitForTimeout(500)
check('Esc closes the panel, rail button off', !(await page.$('[data-media-panel]')) && (await page.evaluate(() => document.querySelector('[data-rail-media]')?.getAttribute('aria-pressed'))) === 'false')

/* 8 · pick mode from the Image window */
await page.click('[data-ve-tool="edit"]'); await page.waitForTimeout(600)
const photo = await page.$('[data-edit="meal.power-bowl.photo"]')
const pb = await photo.boundingBox()
await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2); await page.waitForTimeout(200)
await page.click('[data-edit="meal.power-bowl.photo"] .ve-replace'); await page.waitForTimeout(500)
await page.click('[data-ve-row="library"]'); await page.waitForTimeout(800)
const pk = await page.evaluate(() => {
  const p = document.querySelector('[data-media-panel]')
  const tiles = [...document.querySelectorAll('[data-ve-library] button[data-media-open]')]
  return { mode: p?.dataset.mediaPanel, current: p?.dataset.mediaCurrent, title: document.querySelector('[data-media-title]')?.textContent, n: tiles.length, pressed: tiles.map((t) => t.getAttribute('aria-pressed')), checks: document.querySelectorAll('[data-media-check]').length, row: document.querySelector('[data-ve-row="library"]')?.getAttribute('aria-pressed'), imagePanel: !!document.querySelector('[data-ve-image-panel]') }
})
log(pk)
check('pick mode: «Choose a photo», 9 tiles, the current one pressed, no check-circles, Image window still up', pk.mode === 'pick' && pk.title === 'Choose a photo' && pk.n === 9 && pk.pressed.filter((x) => x === 'true').length === 1 && pk.checks === 0 && pk.row === 'true' && pk.imagePanel, pk)
await page.screenshot({ path: OUT + 'm6-pick.png' })
const before = await page.evaluate(() => document.querySelector('[data-edit="meal.power-bowl.photo"] img')?.getAttribute('src')?.slice(0, 60))
await page.click('[data-ve-library] [data-media-tile]:nth-child(3) [data-media-open]'); await page.waitForTimeout(400)
const picked = await page.evaluate(() => ({ src: document.querySelector('[data-edit="meal.power-bowl.photo"] img')?.getAttribute('src')?.slice(0, 60), count: document.querySelector('[data-ve-count]')?.textContent, panel: !!document.querySelector('[data-media-panel]'), pressed: [...document.querySelectorAll('[data-ve-library] button[data-media-open]')].map((t) => t.getAttribute('aria-pressed')) }))
check('picking swaps the site photo, «1 photo change», panel stays, ring moved', picked.src !== before && picked.count === '1 photo change' && picked.panel && picked.pressed[2] === 'true', picked)
await page.screenshot({ path: OUT + 'm7-picked.png' })
await page.click('[data-ve-panel-close]'); await page.waitForTimeout(500)
check('closing the Image window takes the pick panel with it', !(await page.$('[data-media-panel]')))

log(fails.length ? `\n${fails.length} FAIL` : '\nall green')
await browser.close()
process.exit(fails.length ? 1 : 0)
