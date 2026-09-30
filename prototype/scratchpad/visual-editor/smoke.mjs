/**
 * Visual Editor smoke run on the production build (vite preview on 4173).
 *   CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scratchpad/visual-editor/smoke.mjs
 * Opens the builder on the default world (built site, fit-ration live), turns the Edit tool on,
 * edits the hero title, checks the bar's count, Undo / Redo, Save → unpublished +1 with credits
 * unchanged, opens the Image panel and switches Fit. Screenshots land beside this file.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE || 'http://localhost:4173/'
const OUT = new URL('./shots/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const KEY = 'remixer-prototype/world/v6'

const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
page.on('console', (m) => { if (m.text().startsWith('VE-DEBUG')) console.log(m.text()) })
const log = (...a) => console.log(...a)
const world = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), KEY)

// the harness's idiom: a world in the URL, then the first project card in the Home dock
await page.goto(BASE + '?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.click('.home-card-face')
await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await page.waitForSelector('[data-canvas-toolbar]', { timeout: 15000 })
await page.waitForTimeout(500)

const bar = await page.$('[data-ve-bar]')
log('edit bar present:', !!bar)
if (!bar) { await page.screenshot({ path: OUT + 'no-bar.png' }); await browser.close(); process.exit(1) }
const barBox = await bar.boundingBox()
log('bar box', barBox)
await page.screenshot({ path: OUT + '01-rest.png' })

const before = await world()
log('credits before', before.credits, 'unpublished before', before.unpublished)

await page.click('[data-ve-tool="edit"]')
await page.waitForTimeout(600)
log('rings after enter (reveal):', await page.$$eval('.ve-ring', (r) => r.length))
await page.screenshot({ path: OUT + '02-mode-on.png' })

const title = await page.$('[data-edit="home.hero.title"]')
log('title host contentEditable:', await title.getAttribute('contenteditable'))
await title.hover()
await page.waitForTimeout(200)
log('hover ring:', !!(await page.$('.ve-ring--hover')))
await page.screenshot({ path: OUT + '03-hover.png' })
await title.click()
await page.keyboard.press('End')
await page.keyboard.type(' — fresh daily')
await page.screenshot({ path: OUT + '04-typing.png' })
await page.keyboard.press('Enter')
await page.waitForTimeout(500)
log('count after edit:', await page.$eval('[data-ve-count]', (e) => e.textContent).catch(() => 'NO COUNT'))
log('title text now:', await page.$eval('[data-edit="home.hero.title"]', (e) => e.textContent))
await page.screenshot({ path: OUT + '05-dirty.png' })

await page.click('[data-ve-undo]')
await page.waitForTimeout(200)
log('after undo:', await page.$eval('[data-edit="home.hero.title"]', (e) => e.textContent), 'batch present:', !!(await page.$('[data-ve-batch]')))
await page.click('[data-ve-redo]')
await page.waitForTimeout(200)
log('after redo:', await page.$eval('[data-edit="home.hero.title"]', (e) => e.textContent), 'count:', await page.$eval('[data-ve-count]', (e) => e.textContent))

// a photo: open the Image panel, switch to Fit, set opacity
const photo = await page.$('[data-edit="meal.power-bowl.photo"]')
await photo.scrollIntoViewIfNeeded()
await photo.hover(); await page.waitForTimeout(250)
await page.screenshot({ path: OUT + '06-photo-hover.png' })
await photo.click()
await page.waitForSelector('[data-ve-image-panel]', { timeout: 3000 })
await page.waitForTimeout(500)
log('panel box', await (await page.$('[data-ve-image-panel]')).boundingBox())
await page.screenshot({ path: OUT + '07-panel.png' })
await page.click('[data-ve-fit] button:has-text("Fit")')
await page.waitForTimeout(200)
log('img object-fit:', await page.$eval('[data-edit="meal.power-bowl.photo"] img', (e) => getComputedStyle(e).objectFit))
await page.click('[data-ve-row="library"]'); await page.waitForTimeout(300)
await page.screenshot({ path: OUT + '08-library.png' })
await page.click('[data-ve-library] button:nth-child(3)'); await page.waitForTimeout(200)
log('count now:', await page.$eval('[data-ve-count]', (e) => e.textContent))
log('active before Esc:', await page.evaluate(() => { const e = document.activeElement; return e ? e.tagName + ' ' + (e.className || '').toString().slice(0, 50) : null }))
await page.keyboard.press('Escape'); await page.waitForTimeout(600)
log('panel closed by Esc @600:', !(await page.$('[data-ve-image-panel]')), 'host data-panel-open:', await page.$eval('[data-edit="meal.power-bowl.photo"]', (e) => e.hasAttribute('data-panel-open')))
await page.waitForTimeout(1500)
log('panel closed by Esc @2100:', !(await page.$('[data-ve-image-panel]')), 'opacity:', await page.$eval('[data-ve-image-panel]', (e) => getComputedStyle(e).opacity).catch(() => 'gone'))
if (await page.$('[data-ve-image-panel]')) { await page.click('[data-ve-panel-close]').catch(() => log('close btn not clickable')); await page.waitForTimeout(600); log('after ✕:', !(await page.$('[data-ve-image-panel]'))) }

const mid = await world()
log('credits mid (must equal before):', mid.credits, 'unpublished mid (must equal before):', mid.unpublished)
await page.click('[data-ve-save]')
await page.waitForTimeout(400)
const after = await world()
log('after save → credits', after.credits, 'unpublished', after.unpublished, 'siteEdits', JSON.stringify(after.siteEdits))
log('batch gone after save:', !(await page.$('[data-ve-batch]')), 'tool still on:', await page.$eval('[data-ve-tool="edit"]', (e) => e.getAttribute('aria-pressed')))
await page.screenshot({ path: OUT + '09-saved.png' })

// reload keeps the saved edits (URL has ?p=built → world from URL + storage rule)
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }).catch(() => {})
if (!(await page.$('[data-canvas-toolbar]'))) { await page.click('.home-card-face').catch(() => {}); await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }).catch(() => {}) }
await page.waitForSelector('[data-canvas-toolbar]', { timeout: 15000 })
await page.waitForTimeout(800)
log('after reload title:', await page.$eval('[data-site-page="/"] h1', (e) => e.textContent))
log('after reload fit:', await page.$eval('[data-site-page="/"] img', (e) => getComputedStyle(e).objectFit))

await browser.close()
