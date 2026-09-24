/* PUBLISHED-FILE PROBE (v105, 25.09.2026). On the PUBLISHED file, with a clean browser and the console untouched: Cloud from the rail, Analytics from
   the rail and Domains from the chip must all arrive tagged as sheets — the house motion by default. */
import { chromium } from 'playwright'
const BASE = 'http://127.0.0.1:4321/index.html'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
const errors = []; p.on('pageerror', (e) => errors.push(String(e)))
await p.goto(`${BASE}?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
const bbox = async (label) => (await p.$(`nav.arrive-rail [aria-label="${label}"]`)).boundingBox()
const snap = () => p.evaluate(() => [...document.querySelectorAll('[data-canvas-pane]')].map((e) => { const m = getComputedStyle(e).transform.match(/matrix\(([^)]+)\)/); const a = m ? m[1].split(',').map(Number) : null; return { id: e.dataset.canvasPane, motion: e.dataset.paneMotion, o: +(+getComputedStyle(e).opacity).toFixed(2), s: a ? +a[0].toFixed(3) : 1, y: a ? Math.round(a[5]) : 0, rim: !!e.querySelector('[data-pane-rim]') } }))
const out = { stored: await p.evaluate(() => Object.keys(localStorage)) }
let c = await bbox('Cloud'); await p.mouse.click(c.x + 12, c.y + 12); await p.waitForTimeout(80); out.cloudEarly = await snap(); await p.waitForTimeout(900); out.cloudLanded = await snap()
const an = await bbox('Analytics'); await p.mouse.click(an.x + 24, an.y + 24); await p.waitForTimeout(80); out.switchEarly = await snap(); await p.waitForTimeout(1000); out.switchLanded = await snap()
await p.keyboard.press('Escape'); await p.waitForTimeout(800)
await p.evaluate(() => [...document.querySelectorAll('header button')].find((e) => /remixer\.ai/.test(e.innerText)).click()); await p.waitForTimeout(80); out.domainsEarly = await snap(); await p.waitForTimeout(900); out.domainsLanded = await snap()
await p.keyboard.press('Escape'); await p.waitForTimeout(700)
await p.keyboard.press('Control+.'); await p.waitForTimeout(400)
out.seats = await p.evaluate(() => [...document.querySelectorAll('[data-segmented="paneMotion"] button')].map((b) => [b.textContent.trim(), b.getAttribute('aria-pressed')]))
out.panesLeft = (await p.$$('[data-canvas-pane]')).length; out.errors = errors
console.log(JSON.stringify(out, null, 1))
await b.close()
