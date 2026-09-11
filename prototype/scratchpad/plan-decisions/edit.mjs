import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await (await b.newContext({ viewport: { width: 1240, height: 1200 }, deviceScaleFactor: 2 })).newPage()
const errs = []; p.on('pageerror', (e) => errs.push(String(e)))
await p.goto('file://' + process.cwd() + '/bench.html', { waitUntil: 'load' })
await p.waitForTimeout(900)

const names = () => p.$$eval('.stack-wait-name', (n) => n.map((x) => x.textContent))
const secs  = () => p.$$eval('.stack-row-name', (n) => n.map((x) => x.textContent))
const lede  = () => p.$eval('.lede', (n) => n.textContent)
const ok = (l, c, note = '') => console.log((c ? 'PASS  ' : 'FAIL  ') + l + (note ? ' — ' + note : ''))

// 1. rename a waiting page
await p.click('[data-edit="page:1"]')
await p.keyboard.press('Control+a'); await p.keyboard.type('Menu')
await p.click('.doc h1')  // blur
await p.waitForTimeout(150)
ok('a waiting page renames in place', (await names())[1] === 'Menu', (await names()).join(' · '))

// 2. Enter opens the next page, and typing fills it
await p.click('[data-edit="page:1"]')
await p.keyboard.press('End'); await p.keyboard.press('Enter')
await p.waitForTimeout(150)
await p.keyboard.type('Prices')
await p.click('.doc h1'); await p.waitForTimeout(150)
ok('Enter opens the next page under it', (await names()).join(' · ') === 'About · Menu · Prices · Contact', (await names()).join(' · '))

// 3. Backspace on an empty one closes it
await p.click('[data-edit="page:2"]')
await p.keyboard.press('Control+a'); await p.keyboard.press('Backspace')
await p.waitForTimeout(80)
await p.keyboard.press('Backspace')
await p.waitForTimeout(200)
ok('Backspace on an empty page closes it', (await names()).join(' · ') === 'About · Menu · Contact', (await names()).join(' · '))

// 4. the section list edits the same way
const before = (await secs()).length
await p.click('.stack-add-sec'); await p.waitForTimeout(150)
await p.keyboard.type('Gallery')
await p.click('.doc h1'); await p.waitForTimeout(150)
ok('a section can be added to the page being built',
  (await secs()).length === before + 1 && (await secs()).at(-1) === 'Gallery', (await secs()).join(' · '))

// 5. rename Home and the prose that names it follows
await p.click('[data-edit="home"]')
await p.keyboard.press('Control+a'); await p.keyboard.type('Start')
await p.click('.doc h1'); await p.waitForTimeout(200)
ok('renaming the built page carries into the prose around it', (await lede()).startsWith('Start first, and only Start'), (await lede()).slice(0, 40))

// 6. empty the waiting list and the plan becomes a one-page plan by itself
for (const i of [2, 1, 0]) {
  await p.click('[data-edit="page:' + i + '"]')
  await p.keyboard.press('Control+a'); await p.keyboard.press('Backspace')
  await p.waitForTimeout(60); await p.keyboard.press('Backspace'); await p.waitForTimeout(150)
}
ok('with nothing left under it, the plan says one page', (await names()).length === 0 && (await lede()).startsWith('One page'), (await lede()).slice(0, 30))

// 7. nothing moved that should not have
ok('no page errors', errs.length === 0, errs.join(' | '))
await p.screenshot({ path: 'E-edited.png', clip: { x: 70, y: 300, width: 1100, height: 620 } })
await b.close()
