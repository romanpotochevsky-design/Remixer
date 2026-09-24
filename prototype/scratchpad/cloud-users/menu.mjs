/* The Cloud menu in both states — folded (Users, board 30971:98965) and open (Meals, board 30816:52025). */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 2481, height: 1166 } })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
await p.click('nav.arrive-rail [aria-label="Cloud"]')
await p.waitForSelector('[data-cloud-plate]', { timeout: 10000 }); await p.waitForTimeout(1600)
const nav = await p.$eval('nav[aria-label="Cloud menu"]', (n) => { const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: 400 } })
await p.mouse.move(5, 5)
await p.screenshot({ path: new URL('./menu-open.png', import.meta.url).pathname, clip: nav })
await p.click('[data-cloud-seat="users"]'); await p.waitForTimeout(1200); await p.mouse.move(5, 5); await p.waitForTimeout(300)
await p.screenshot({ path: new URL('./menu-users.png', import.meta.url).pathname, clip: nav })
await b.close()
