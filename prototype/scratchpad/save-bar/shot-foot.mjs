/** The canvas foot at 2560 × 1166: the bar 8 above the preview, the preview 2 above the window — and the Cloud window on the same foot. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173/'
const OUT = new URL('./out/', import.meta.url).pathname
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 2560, height: 1166 }, deviceScaleFactor: 2 })
await page.goto(BASE + '?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await page.waitForTimeout(700); await page.click('.home-card-face')
await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await page.waitForTimeout(900)
const g = await page.$eval('[data-ve-bar] [data-ve-glass]', (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })
await page.screenshot({ path: OUT + 'foot-site.png', clip: { x: g.x - 60, y: g.y - 20, width: g.w + 120, height: 1166 - g.y + 20 } })
await page.click('[aria-label="Cloud"]'); await page.waitForTimeout(1500)
const pane = await page.$eval('[data-canvas-pane]', (e) => { const r = e.getBoundingClientRect(); return { y: r.y, h: r.height, b: innerHeight - r.bottom } })
console.log('cloud pane', JSON.stringify(pane))
await page.screenshot({ path: OUT + 'foot-cloud.png', clip: { x: 1000, y: 1166 - 80, width: 600, height: 80 } })
await browser.close()
