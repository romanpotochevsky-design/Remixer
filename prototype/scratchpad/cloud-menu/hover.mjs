/* real pointer: hover wash and press bloom on the menu rows */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
await p.click('nav.arrive-rail [aria-label="Cloud"]')
await p.waitForSelector('[data-cloud-plate]', { timeout: 10000 }); await p.waitForTimeout(1600)
const box = async (sel) => p.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })
const menu = await p.$eval('[data-cloud-menu]', (e) => { const r = e.getBoundingClientRect(); return { x: r.x - 6, y: r.y + 80, width: r.width + 12, height: 380 } })
// hover an unselected room row
const users = await box('[data-cloud-seat="users"]')
await p.mouse.move(users.x + 60, users.y + 24); await p.waitForTimeout(250)
const hov = await p.$eval('[data-cloud-seat="users"]', (e) => getComputedStyle(e).backgroundColor)
await p.screenshot({ path: 'scratchpad/cloud-menu/hover-users.png', clip: menu })
// hover the selected table row: nothing
const meals = await box('[data-cloud-seat="meals"]')
await p.mouse.move(meals.x + 60, meals.y + 20); await p.waitForTimeout(250)
const hovOn = await p.$eval('[data-cloud-seat="meals"]', (e) => getComputedStyle(e).backgroundColor)
// press Orders and hold: the bloom grows
const orders = await box('[data-cloud-seat="orders"]')
await p.mouse.move(orders.x + 40, orders.y + 20); await p.waitForTimeout(200)
await p.mouse.down(); await p.waitForTimeout(120)
const ripples = await p.$eval('[data-cloud-seat="orders"]', (e) => e.querySelectorAll('.glass-ripple').length)
await p.screenshot({ path: 'scratchpad/cloud-menu/press-orders.png', clip: menu })
await p.mouse.up(); await p.waitForTimeout(700)
await p.screenshot({ path: 'scratchpad/cloud-menu/after-orders.png', clip: menu })
// hover the Database header when Orders is on: wash + bloom class
const dbh = await p.$eval('[data-cloud-seat="database"]', (e) => ({ bloom: e.classList.contains('press-bloom'), expanded: e.getAttribute('aria-expanded') }))
// real click on Secrets, then hover Users while the fold moves → must not light
const secrets = await box('[data-cloud-seat="secrets"]')
await p.mouse.move(secrets.x + 60, secrets.y + 24); await p.mouse.down(); await p.mouse.up()
await p.waitForTimeout(60)
const moving = await p.$eval('[data-cloud-menu-list]', (e) => e.hasAttribute('data-cloud-moving'))
// the row under the cursor now is whatever slid there; check no hover wash while moving
const under = await p.evaluate(() => { const el = document.elementFromPoint(arguments[0], arguments[1]); return el ? el.closest('[data-cloud-seat]')?.dataset.cloudSeat : null }, ).catch(() => null)
const washes = await p.evaluate(() => [...document.querySelectorAll('[data-cloud-seat]')].map((e) => [e.dataset.cloudSeat, getComputedStyle(e).backgroundColor]))
await p.waitForTimeout(900)
await p.screenshot({ path: 'scratchpad/cloud-menu/after-secrets.png', clip: menu })
console.log(JSON.stringify({ hov, hovOn, ripples, dbh, moving, washes }, null, 1))
await b.close()
