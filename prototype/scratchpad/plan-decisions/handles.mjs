import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
const DIR = '/tmp/claude-0/-home-user-Remixer/e48f0388-fcbd-532f-b46c-a75e5fc0be1e/scratchpad/plan-decisions'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await (await b.newContext({ viewport: { width: 1240, height: 1300 }, deviceScaleFactor: 2 })).newPage()
const errs = []; p.on('pageerror', (e) => errs.push(String(e)))
await p.goto('file://' + DIR + '/bench.html', { waitUntil: 'load' })
await p.waitForTimeout(900)
const names = () => p.$$eval('.stack-wait-name', (n) => n.map((x) => x.textContent))
const secs  = () => p.$$eval('.stack-row-name', (n) => n.map((x) => x.textContent))
const ok = (l, c, note = '') => console.log((c ? 'PASS  ' : 'FAIL  ') + l + (note ? ' — ' + note : ''))

// the controls are hidden at rest and appear under the pointer
const xAt = async (sel) => p.$eval(sel, (n) => +getComputedStyle(n.querySelector('.row-x')).opacity)
ok('nothing shows at rest', (await xAt('.stack-wait')) === 0)
await p.hover('.stack-wait')
await p.waitForTimeout(200)
ok('…the remove control appears under the pointer', (await xAt('.stack-wait')) === 1)
ok('…and so does the grip',
  (await p.$eval('.stack-wait .row-grip .grip', (n) => +getComputedStyle(n).opacity)) === 1)

// the row keeps its box whether or not the controls are showing
const box = (sel) => p.$eval(sel, (n) => { const r = n.getBoundingClientRect(); return [r.x, r.width, r.height].map(Math.round).join(',') })
const hot = await box('.stack-wait')
await p.mouse.move(4, 4); await p.waitForTimeout(200)
ok('the row does not move when they hide again', hot === (await box('.stack-wait')), hot + ' vs ' + await box('.stack-wait'))

// remove a page, remove a section
await p.hover('.stack-wait >> nth=0')
await p.click('.stack-wait >> nth=0 >> .row-x')
await p.waitForTimeout(250)
ok('✕ removes the page', (await names()).join(' · ') === 'Services · Contact', (await names()).join(' · '))
await p.hover('.stack-row >> nth=1')
await p.click('.stack-row >> nth=1 >> .row-x')
await p.waitForTimeout(250)
ok('✕ removes the section', !(await secs()).includes('Hero'), (await secs()).join(' · '))

// drag the last page above the first
const from = await p.$eval('.stack-wait >> nth=1 >> .row-grip', (n) => { const r = n.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2] })
const to = await p.$eval('.stack-wait >> nth=0', (n) => { const r = n.getBoundingClientRect(); return [r.x + 60, r.y + 4] })
await p.mouse.move(from[0], from[1]); await p.mouse.down()
await p.mouse.move(to[0], to[1] + 20, { steps: 8 }); await p.mouse.move(to[0], to[1], { steps: 8 })
await p.waitForTimeout(120); await p.mouse.up(); await p.waitForTimeout(300)
ok('dragging a page by its grip reorders the stack', (await names()).join(' · ') === 'Contact · Services', (await names()).join(' · '))

// and a section
const s0 = (await secs()).slice()
const sf = await p.$eval('.stack-row >> nth=2 >> .row-grip', (n) => { const r = n.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2] })
const st = await p.$eval('.stack-row >> nth=0', (n) => { const r = n.getBoundingClientRect(); return [r.x + 60, r.y + 4] })
await p.mouse.move(sf[0], sf[1]); await p.mouse.down()
await p.mouse.move(st[0], st[1] + 20, { steps: 8 }); await p.mouse.move(st[0], st[1], { steps: 8 })
await p.waitForTimeout(120); await p.mouse.up(); await p.waitForTimeout(300)
const s1 = await secs()
ok('dragging a section reorders it too', s1[0] === s0[2] && s1.length === s0.length, s0.join(' · ') + '  →  ' + s1.join(' · '))

// typing still works after all that
await p.click('[data-edit="sec:0"]')
await p.keyboard.press('Control+a'); await p.keyboard.type('Opening shot')
await p.click('.doc h1'); await p.waitForTimeout(200)
ok('the name still edits in place', (await secs())[0] === 'Opening shot', (await secs()).join(' · '))
ok('no page errors', errs.length === 0, errs.join(' | '))
await p.$eval('.doc-well', (n) => n.scrollTop = 210)
await p.hover('.stack-wait >> nth=0'); await p.waitForTimeout(250)
await p.screenshot({ path: DIR + '/H-handles.png', clip: { x: 70, y: 300, width: 1100, height: 700 } })
await b.close()
