/* the rim sweep: freeze the glint at phases and photograph the pill's rim + read --gl-a over time */
import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const page = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:4173/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('remixer-prototype/world/v6'))
await page.waitForTimeout(400); await page.click('.home-card-face')
await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await page.waitForSelector('[data-ve-bar]'); await page.waitForTimeout(800)
const bb = await (await page.$('[data-ve-bar]')).boundingBox()
await page.mouse.move(bb.x + 20, bb.y + 20); await page.waitForTimeout(900)
await page.click('[data-ve-dock-to-rail]'); await page.waitForTimeout(1600)
const db = await (await page.$('[data-ve-dock]')).boundingBox()
await page.mouse.move(db.x + 24, db.y + 24)
const trace = []
for (let i = 0; i < 40; i++) { await page.waitForTimeout(25); trace.push(await page.evaluate(() => { const g = document.querySelector('[data-ve-popped] .glass-glint'); if (!g) return null; const cs = getComputedStyle(g); return { a: cs.getPropertyValue('--gl-a').trim(), o: +(+cs.opacity).toFixed(2) } })) }
console.log(trace.filter(Boolean).map((t) => `${t.a}/${t.o}`).join(' '))
// phases: pause the animations and step
await page.waitForTimeout(1500)
const pb = await (await page.$('[data-ve-popped]')).boundingBox()
const clip = { x: pb.x - 12, y: pb.y - 12, width: pb.width + 24, height: pb.height + 24 }
for (const t of [150, 250, 350, 450, 700, 1000]) {
  await page.evaluate((t) => { const g = document.querySelector('[data-ve-popped] .glass-glint'); for (const a of g.getAnimations()) { a.pause(); a.currentTime = t } }, t)
  await page.waitForTimeout(80)
  await page.screenshot({ path: `scratchpad/edit-dock/shots/sweep-${t}.png`, clip })
}
await b.close()
