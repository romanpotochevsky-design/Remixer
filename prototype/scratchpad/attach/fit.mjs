import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
for (const h of [1100, 900, 800, 720]) {
  const ctx = await b.newContext({ viewport: { width: 1600, height: h } })
  const p = await ctx.newPage()
  await p.goto('http://localhost:4173/?page=home&p=empty&h=empty&i=dh-free', { waitUntil: 'networkidle' })
  await p.waitForTimeout(2600)
  const box = (s) => p.$eval(s, (e) => { const r = e.getBoundingClientRect(); return [+r.left.toFixed(1), +r.top.toFixed(1), +r.width.toFixed(1), +r.height.toFixed(1)] })
  await p.click('[data-attach-open]'); await p.waitForTimeout(400)
  const plus = await box('[data-attach-open]')
  const root = await box('[role="menu"]')
  await p.click('[role="menu"] [role="menuitem"]:last-child'); await p.waitForTimeout(350)
  const list = await box('[role="menu"]')
  console.log(h, '| + at', plus[1], '| root', root[1], `(+${(root[1]-plus[1]).toFixed(0)})`, 'x+' + (root[0]-plus[0]),
    '| list', list[1], `(+${(list[1]-plus[1]).toFixed(0)})`, 'bottom', (list[1]+list[3]).toFixed(0), 'of', h)
  await ctx.close()
}
await b.close()
