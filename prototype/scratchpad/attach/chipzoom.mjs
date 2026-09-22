import { chromium } from 'playwright'
const OUT = '/tmp/claude-0/-home-user-Remixer/f35098fc-6ffd-52d5-9242-03d717382a39/scratchpad/attach'
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const p = await b.newPage({ viewport: { width: 1656, height: 1100 }, deviceScaleFactor: 4 })
await p.goto('http://localhost:4173/?page=home&p=empty&h=empty&i=dh-free&g=domainame.com', { waitUntil: 'networkidle' })
await p.waitForTimeout(3000)
const r = await p.$eval('[data-attach-domain]', (e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } })
console.log('chip', JSON.stringify(r))
await p.screenshot({ path: `${OUT}/07-chip-zoom.png`, clip: { x: r.x - 14, y: r.y - 14, width: r.w + 28, height: r.h + 28 } })
const close = await p.$eval('[data-attach-domain] button', (e) => { const b = e.getBoundingClientRect(); return [b.width, b.height] })
console.log('close', close)
await b.close()
