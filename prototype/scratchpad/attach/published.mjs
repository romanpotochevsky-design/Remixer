/* The attach flow on the PUBLISHED single file — the page the designer actually opens.
   Served with `; charset=utf-8`, because the host adds the meta the build does not. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://127.0.0.1:4199/remixer-prototype.html'
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
const errs = []; p.on('pageerror', (e) => errs.push(e.message))
await p.goto(`${BASE}?p=empty&h=empty&a=trial&t=1&c=2000&i=dh-free`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2600)
const box = (s) => p.$eval(s, (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => +n.toFixed(2)) })
const out = []
const ok = (n, v, x = '') => out.push(`${v ? 'PASS' : 'FAIL'}  ${n}${x ? ' — ' + x : ''}`)
ok('bare field 138', (await box('.he-composer'))[3] === 138)
await p.click('[data-attach-open]'); await p.waitForTimeout(450)
const m = await box('[role="menu"]')
ok('menu 208 × 89', m[2] === 208 && m[3] === 89, m.join(','))
await p.click('[role="menu"] [role="menuitem"]:last-child'); await p.waitForTimeout(350)
await p.click('[role="menu"] [role="menuitem"]:nth-child(2)'); await p.waitForTimeout(900)
ok('field 164 with the chip', (await box('.he-composer'))[3] === 164)
ok('the name is rendered, not just bundled',
  (await p.evaluate(() => document.body.innerText)).includes('odesa-coffee-roasters.com'))
ok('no page errors', errs.length === 0, errs.join(' | ').slice(0, 200))
console.log(out.join('\n'))
await b.close()
process.exit(out.some((l) => l.startsWith('FAIL')) ? 1 : 0)
