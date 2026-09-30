import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.CHROME }); const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto('http://localhost:4173/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await p.evaluate(() => localStorage.removeItem('remixer-prototype/world/v6'))
await p.waitForTimeout(400)
await p.click('.home-card-face')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await p.waitForSelector('[data-ve-bar] [data-ve-glass]', { timeout: 20000 })
await p.waitForTimeout(800)
const geo = () => p.evaluate(() => { const g = document.querySelector('[data-ve-bar] [data-ve-glass]').getBoundingClientRect(), t = document.querySelector('[data-ve-bar] [data-ve-tool]').getBoundingClientRect(); return { glass: [g.x, g.y, g.width, g.height].map(v => +v.toFixed(1)), radius: getComputedStyle(document.querySelector('[data-ve-bar] [data-ve-glass]')).borderRadius, tool: [t.x, t.y, t.width, t.height].map(v => +v.toFixed(1)) } })
const rest = await geo()
const bar = await p.locator('[data-ve-bar]').boundingBox()
await p.mouse.move(bar.x + 20, bar.y + 20); const film = []
for (let i = 0; i < 16; i++) { await p.waitForTimeout(50); film.push((await geo()).glass) }
const hov = await geo()
console.log('rest', JSON.stringify(rest)); console.log('hover', JSON.stringify(hov))
console.log('heights', film.map(f => f[3]).join(' '))
await p.screenshot({ path: 'scratchpad/edit-dock/swell-hover.png', clip: { x: bar.x - 40, y: bar.y - 30, width: bar.width + 120, height: bar.height + 60 } })
await b.close()
