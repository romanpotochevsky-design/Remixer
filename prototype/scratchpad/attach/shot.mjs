import { chromium } from 'playwright'
const OUT = '/tmp/claude-0/-home-user-Remixer/f35098fc-6ffd-52d5-9242-03d717382a39/scratchpad/attach'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1656, height: 1100 }, deviceScaleFactor: 1 })
await p.goto('http://localhost:4173/?page=home', { waitUntil: 'networkidle' })
await p.waitForTimeout(5200)
const box = async (sel) => { const e = p.locator(sel).first(); return (await e.count()) ? await e.boundingBox() : null }
const r = (o) => o && Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v * 100) / 100]))

console.log('bare  field   ', JSON.stringify(r(await box('.he-composer'))))
await p.screenshot({ path: `${OUT}/01-bare.png`, clip: { x: 300, y: 380, width: 1060, height: 420 } })

await p.click('[data-attach-open]')
await p.waitForTimeout(500)
console.log('plus          ', JSON.stringify(r(await box('[data-attach-open]'))))
console.log('menu          ', JSON.stringify(r(await box('[role="menu"]'))))
await p.screenshot({ path: `${OUT}/02-menu.png`, clip: { x: 300, y: 300, width: 1060, height: 420 } })

await p.getByRole('menuitem', { name: /Attach Domain/ }).click()
await p.waitForTimeout(400)
await p.screenshot({ path: `${OUT}/03-list.png`, clip: { x: 300, y: 130, width: 1060, height: 590 } })

await p.getByRole('menuitem', { name: /odesa-coffee-roasters/ }).click()
await p.waitForTimeout(900)
console.log('chip  field   ', JSON.stringify(r(await box('.he-composer'))))
console.log('chip          ', JSON.stringify(r(await box('[data-attach-domain]'))))
console.log('text row      ', JSON.stringify(r(await box('.he-composer input'))))
console.log('chips row     ', JSON.stringify(r(await box('.he-chips'))))
await p.screenshot({ path: `${OUT}/04-chip.png`, clip: { x: 300, y: 380, width: 1060, height: 440 } })

// a template on top of the chip
await p.click('[data-template-trigger]')
await p.waitForTimeout(1100)
await p.locator('[role="dialog"] [aria-label^="Use "]').first().evaluate((el) => el.click())
await p.waitForTimeout(1800)
await p.keyboard.press('Escape')
await p.waitForTimeout(900)
console.log('both  field   ', JSON.stringify(r(await box('.he-composer'))))
console.log('both  bar tile', JSON.stringify(r(await box('[data-attach-tile]'))))
console.log('both  chip    ', JSON.stringify(r(await box('[data-attach-domain]'))))
console.log('both  input   ', JSON.stringify(r(await box('.he-composer input'))))
await p.screenshot({ path: `${OUT}/05-both.png`, clip: { x: 300, y: 380, width: 1060, height: 460 } })

// remove the tile → the field must settle back on the chip's 164
await p.locator('.attach-badge').first().evaluate((el) => el.click()).catch((e) => console.log('x fail', e.message.slice(0,60)))
await p.waitForTimeout(900)
console.log('after ✕ field ', JSON.stringify(r(await box('.he-composer'))))
await p.screenshot({ path: `${OUT}/06-after-x.png`, clip: { x: 300, y: 380, width: 1060, height: 440 } })
await b.close()
