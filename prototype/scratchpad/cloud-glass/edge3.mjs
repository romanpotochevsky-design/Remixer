import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
await p.click('nav.arrive-rail [aria-label="Cloud"]'); await p.waitForSelector('[data-cloud-close]'); await p.waitForTimeout(1600)
await p.mouse.move(800, 800)
const px = async (tag) => { await p.screenshot({ path: `scratchpad/cloud-glass/edge-${tag.trim()}.png`, clip: { x: 1510, y: 280, width: 12, height: 3 } }) }
await px('asis')
await p.evaluate(() => { const row = document.querySelector('[data-cloud-row]'); row.children[3].style.visibility = 'hidden' })
await p.waitForTimeout(100); await px('hidden')
await p.evaluate(() => { const row = document.querySelector('[data-cloud-row]'); row.children[3].style.visibility = ''; const host = document.querySelector('button[aria-label^="Edit "]').parentElement; host.style.background = 'red' })
await p.waitForTimeout(100); await px('red')
await p.evaluate(() => { const list = document.querySelector('[data-cloud-list]'); const r = list.getBoundingClientRect(); const cs = getComputedStyle(list); console.log(JSON.stringify({ listRight: r.right, clientW: list.clientWidth, offsetW: list.offsetWidth, scrollW: list.scrollWidth, border: cs.borderRightWidth, pad: cs.paddingRight })) })
p.on('console', (m) => console.log('page:', m.text()))
await p.evaluate(() => { const list = document.querySelector('[data-cloud-list]'); const r = list.getBoundingClientRect(); console.log(JSON.stringify({ listRight: r.right, clientW: list.clientWidth, offsetW: list.offsetWidth, scrollW: list.scrollWidth })) })
await b.close()
