import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
const errs = []; p.on('pageerror', (e) => errs.push(e.message))
await p.goto('http://localhost:4173/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'); await p.waitForTimeout(1500)
await p.screenshot({ path: 'scratchpad/landings/fit-dock.png' })
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(3500)
await p.screenshot({ path: 'scratchpad/landings/fit-1.png' })
for (const [i, y] of [[2, 700], [3, 800], [4, 2000]]) { await p.mouse.move(1000, 500); await p.mouse.wheel(0, y); await p.waitForTimeout(700); await p.screenshot({ path: `scratchpad/landings/fit-${i}.png` }) }
console.log(errs, await p.$eval('[data-canvas-site] h1', (e) => getComputedStyle(e).fontFamily + ' ' + getComputedStyle(e).fontWeight), await p.evaluate(() => document.fonts.check("40px 'Site Serif'")))
await b.close()
