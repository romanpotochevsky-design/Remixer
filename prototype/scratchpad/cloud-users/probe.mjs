/* Users room vs board 30971:98655 — geometry on the built preview at the board's own 2560 × 1166. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 2481, height: 1166 } })
await p.goto(`${BASE}${BASE.endsWith('.html') ? '' : '/'}?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=514`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
await p.click('nav.arrive-rail [aria-label="Cloud"]')
await p.waitForSelector('[data-cloud-plate]', { timeout: 10000 })
await p.waitForTimeout(1600)
await p.click('[data-cloud-seat="users"]')
await p.waitForSelector('[data-users-room]')
await p.waitForTimeout(1400)
await p.mouse.move(5, 5)
const m = await p.evaluate(() => {
  const sheet = document.querySelector('[data-cloud-page]').parentElement
  const S = sheet.getBoundingClientRect()
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return [+(b.x - S.x).toFixed(2), +(b.y - S.y).toFixed(2), +b.width.toFixed(2), +b.height.toFixed(2)] }
  const q = (s) => document.querySelector(s)
  const win = q('[data-cloud-window]').getBoundingClientRect()
  const inkY = (el) => { const b = el.getBoundingClientRect(); return +(b.y - S.y).toFixed(2) }
  const heads = [...q('[data-users-headings]').querySelectorAll('span')].filter((s) => s.children.length === 0).map((s) => [s.textContent, r(s)])
  const row = (id) => {
    const el = q(`[data-users-row="${id}"]`)
    const kids = [...el.children]
    return { box: r(el), avatar: r(el.querySelector('.rounded-full')), name: r(kids[0].querySelector('.truncate')), email: r(kids[1].querySelector('span')), logins: r(kids[2].querySelector('span')), prov: r(kids[3].querySelector('svg')), last: r(kids[4].querySelector('span')) }
  }
  return {
    window: [win.width, win.height], sheet: [S.width, S.height],
    menuSeats: Object.fromEntries([...document.querySelectorAll('[data-cloud-seat]')].map((e) => { const c = q('[data-cloud-menu-list]').getBoundingClientRect(); const b = e.getBoundingClientRect(); return [e.dataset.cloudSeat, [+(b.x - c.x).toFixed(1), +(b.y - c.y).toFixed(1), +b.width.toFixed(1), +b.height.toFixed(1)]] })),
    plate: (() => { const c = q('[data-cloud-menu-list]').getBoundingClientRect(); const e = q('[data-cloud-plate]'); const b = e.getBoundingClientRect(); return [+(b.x - c.x).toFixed(1), +(b.y - c.y).toFixed(1), +b.width.toFixed(1), +b.height.toFixed(1), getComputedStyle(e).backgroundColor, getComputedStyle(e).borderTopLeftRadius] })(),
    usersLabel: getComputedStyle(q('[data-cloud-seat="users"]').children[1]).fontWeight,
    dbLabel: getComputedStyle(q('[data-cloud-seat="database"]').children[1]).fontWeight,
    headRow: r(q('h2').parentElement), title: r(q('[data-cloud-title-word]')), titleW: getComputedStyle(q('[data-cloud-title-word]')).fontWeight,
    statTotal: r(q('[data-users-stat="total"]')), statWeek: r(q('[data-users-stat="week"]')), add: r(q('[data-users-add]')),
    signin: r(q('[data-users-signin]')), well: r(q('[data-users-well]')),
    methods: [...document.querySelectorAll('[data-users-method]')].map((e) => r(e)),
    avatars: [...document.querySelectorAll('[data-users-method] .rounded-full')].map((e) => r(e)),
    switches: [...document.querySelectorAll('[data-users-switch]')].map((e) => [r(e), e.getAttribute('aria-checked'), getComputedStyle(e).backgroundColor, r(e.firstElementChild)]),
    chart: r(q('[data-users-chart]')), axis: r(q('[data-users-axis]')), axisLabels: [...q('[data-users-axis]').children].map((e) => r(e)), grid: r(q('[data-users-grid]')), gridLines: [...q('[data-users-grid]').children].map((e) => r(e)[1]), graph: r(q('[data-users-graph]')),
    days: [...q('[data-users-grid]').nextElementSibling.children].map((e) => r(e)),
    people: r(q('[data-users-people]')), search: r(q('[data-users-search]')), peopleTitle: r(q('[data-users-people] h3')),
    headings: r(q('[data-users-headings]')), heads,
    list: r(q('[data-users-list]')),
    rows: ['maya', 'liam'].map(row), chip: r(q('[data-users-chip]')),
    room: r(q('[data-users-room]')),
  }
})
console.log(JSON.stringify(m, null, 1))
await p.screenshot({ path: new URL('./users-2560.png', import.meta.url).pathname, clip: { x: 432 + 8 + 264 + 1, y: 52 + 48 + 1, width: 1719, height: 1056 } })
await b.close()
