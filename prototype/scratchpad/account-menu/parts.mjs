import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 2560, height: 1166 } })
await p.goto('http://localhost:4173/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' }); await p.waitForTimeout(700)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(900)
await p.click('[data-account-trigger]'); await p.waitForTimeout(1400)
console.log(JSON.stringify(await p.evaluate(() => { const c = document.querySelector('[data-account-credits]'); const walk = (e, d) => d > 3 ? [] : [...e.children].flatMap((k) => { const r = k.getBoundingClientRect(); return [[d, k.tagName, (k.className+'').slice(0, 50), +r.height.toFixed(2)], ...walk(k, d + 1)] }); return walk(c, 0) })))
await b.close()
