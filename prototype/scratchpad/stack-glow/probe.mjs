/** The folded stack's front card lights softly under the pointer (designer 03.10.2026: «лёгкий и очень
 *  нежный эффект свечения растушёванный в том месте где ты наводишь на блок который раскрывает стек»). */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173/'
const OUT = new URL('./', import.meta.url).pathname
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
let fails = 0
const check = (n, ok, x) => { console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : JSON.stringify(x)); if (!ok) fails++ }
await page.goto(BASE + '?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle' })
await page.click('.home-card-face'); await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await page.waitForTimeout(600)
await page.click('button[aria-label="Prototype console"]'); await page.waitForTimeout(400)
await page.click('button:has-text("Versions — the board’s thread")'); await page.waitForTimeout(400)
await page.click('button[aria-label="Prototype console"]').catch(() => {}); await page.waitForTimeout(1200)
const run = page.locator('[data-version-stacked]').first()
await run.scrollIntoViewIfNeeded()
const glow = page.locator('[data-run-glow]').first()
check('a folded stack carries the glow layer on its front card', await glow.count() === 1)
const op0 = await glow.evaluate((g) => getComputedStyle(g).opacity)
check('…invisible while the pointer is elsewhere', op0 === '0', op0)
const front = await page.locator('[data-version-stacked] [data-run-card]').last().boundingBox()
const shot = async (name) => page.screenshot({ path: OUT + name + '.png', clip: { x: front.x - 20, y: front.y - 40, width: front.width + 40, height: front.height + 60 } })
await shot('rest')
await page.mouse.move(front.x + 90, front.y + 20); await page.waitForTimeout(80)
await page.mouse.move(front.x + 100, front.y + 22); await page.waitForTimeout(400)
const m1 = await glow.evaluate((g) => { const b = g.querySelector('.vc-glow-wash i').getBoundingClientRect(), r = g.getBoundingClientRect(); return { op: getComputedStyle(g).opacity, cx: b.left + b.width / 2 - r.left, cy: b.top + b.height / 2 - r.top } })
check('hovered: the glow is lit (opacity 1)', m1.op === '1', m1)
check('…and centred on the pointer (±1 px)', Math.abs(m1.cx - 100) < 1.5 && Math.abs(m1.cy - 22) < 1.5, m1)
await shot('hover-left')
await page.mouse.move(front.x + front.width - 120, front.y + 40, { steps: 6 }); await page.waitForTimeout(300)
const m2 = await glow.evaluate((g) => { const b = g.querySelector('.vc-glow-wash i').getBoundingClientRect(), r = g.getBoundingClientRect(); return { cx: b.left + b.width / 2 - r.left, cy: b.top + b.height / 2 - r.top, w: r.width } })
check('…it follows the pointer across the card', Math.abs(m2.cx - (m2.w - 120)) < 1.5 && Math.abs(m2.cy - 40) < 1.5, m2)
await shot('hover-right')
/* gentle: the brightest pixel inside the card under the pointer gains only a few levels */
const px = async (x, y) => { const png = await page.screenshot({ clip: { x, y, width: 1, height: 1 }, scale: 'css' }); let o = 8, d = []; while (o < png.length) { const l = png.readUInt32BE(o), t = png.toString('ascii', o + 4, o + 8); if (t === 'IDAT') d.push(png.subarray(o + 8, o + 8 + l)); o += 12 + l } const raw = (await import('node:zlib')).inflateSync(Buffer.concat(d)); return raw[1] }
const lit = await px(front.x + front.width - 140, front.y + 30)
await page.mouse.move(10, 10); await page.waitForTimeout(500)
const dark = await px(front.x + front.width - 140, front.y + 30)
check('gentle: under the pointer the card brightens by a few levels only (2–14 / 255)', lit - dark >= 2 && lit - dark <= 14, { lit, dark })
const op3 = await glow.evaluate((g) => getComputedStyle(g).opacity)
check('pointer gone: the glow fades out', op3 === '0', op3)
await page.locator('[data-version-stacked]').first().click({ position: { x: 60, y: 30 } }); await page.waitForTimeout(800)
check('a fanned-out stack has no glow (it is the cue to open, not decoration)', await page.locator('[data-run-glow]').count() === 0)
await browser.close(); console.log(fails ? `${fails} FAIL` : 'ALL PASS'); process.exit(fails ? 1 : 0)
