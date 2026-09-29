/* Account menu against board 31243:82905: geometry at 2560 × 1166, then the open / close trace. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const W = +(process.env.W || 2560), H = +(process.env.H || 1166)
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: W, height: H } })
await p.goto(`${BASE}${BASE.endsWith('.html') ? '' : '/'}?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' }); await p.waitForTimeout(700)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(900)
const arm = (ms) => p.evaluate((ms) => { window.__tr = []; const t0 = performance.now(); const tick = () => { const m = document.querySelector('[data-account-menu]'); if (m) { const cs = getComputedStyle(m); const tr = cs.transform; const sc = tr === 'none' ? 1 : +new DOMMatrix(tr).a.toFixed(4); const g = m.querySelector('.glass-glint'); window.__tr.push([Math.round(performance.now() - t0), +(+cs.opacity).toFixed(3), sc, g ? +(+getComputedStyle(g).opacity).toFixed(3) : null]) } else window.__tr.push([Math.round(performance.now() - t0), null]); if (performance.now() - t0 < ms) requestAnimationFrame(tick) }; requestAnimationFrame(tick) }, ms)
await arm(1300); await p.click('[data-account-trigger]'); await p.waitForTimeout(1400); const open = await p.evaluate(() => window.__tr)
const g = await p.evaluate(() => {
  const r = (s, root = document) => { const e = root.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map((n) => +n.toFixed(2)) }
  const m = document.querySelector('[data-account-menu]')
  const av = document.querySelector('[data-account-trigger]').getBoundingClientRect()
  return { vw: innerWidth, menu: r('[data-account-menu]'), header: r('[data-account-header]'), avatar: r('[data-account-avatar]'), name: r('[data-account-name]'), credits: r('[data-account-credits]'), bar: r('[data-account-bar]'), add: r('[data-account-add]'), list: r('[data-account-list]'), rows: [...document.querySelectorAll('[data-account-row]')].map((e) => { const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map((n) => +n.toFixed(1)) }), logout: r('[data-account-logout]'), trigger: [av.x + av.width / 2, av.y + av.height / 2], blur: getComputedStyle(m).backdropFilter, bg: getComputedStyle(m).backgroundColor, shadow: getComputedStyle(m).boxShadow }
})
await p.screenshot({ path: 'scratchpad/account-menu/ours.png', clip: { x: g.menu[0] - 40, y: 0, width: g.menu[2] + 48, height: g.menu[3] + 60 } })
await arm(500); await p.keyboard.press('Escape'); await p.waitForTimeout(600); const close = await p.evaluate(() => window.__tr)
console.log(JSON.stringify(g, null, 1))
console.log('OPEN', open.filter((_, i) => i % 3 === 0).map((x) => x.join('/')).join(' '))
console.log('CLOSE', close.map((x) => x.join('/')).join(' '))
await b.close()
