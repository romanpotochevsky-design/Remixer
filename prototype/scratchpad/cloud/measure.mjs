import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:5174'
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } })
const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('PAGEERROR', e.message))
await p.goto(`${BASE}?p=built&v=true&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(700)
await p.click('.home-card-face')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await p.waitForTimeout(500)
await p.click('[aria-label="Cloud"]')
await p.waitForTimeout(900)

const m = await p.evaluate(() => {
  const win = document.querySelector('[data-cloud-window]')
  const g = (e) => getComputedStyle(e)
  const R = (e) => { const b = e.getBoundingClientRect(); return { x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2) } }
  const rel = (e) => { const a = R(e), o = R(win); return { x: +(a.x - o.x).toFixed(2), y: +(a.y - o.y).toFixed(2), w: a.w, h: a.h } }
  const nav = win.querySelector('nav')
  const card = nav.firstElementChild
  const head = card.firstElementChild
  const mark = head.querySelector('svg')
  const word = head.querySelector('span')
  const dbCard = card.querySelector('[class*="rounded-\\[16px\\]"]')
  const dbTop = dbCard.querySelector('button')
  const subs = [...dbCard.querySelectorAll('button[aria-current], button[aria-current="false"]')]
  const content = nav.nextElementSibling
  const topbar = content.firstElementChild
  const closeBtn = topbar.querySelector('button')
  const pageWrap = content.children[1]
  const header = pageWrap.children[0]
  const topRow = header.children[0]
  const headings = header.children[1]
  const labels = [...headings.querySelectorAll('span')]
  const page = pageWrap.children[1]
  const rows = [...win.querySelectorAll('[data-cloud-window] .flex.h-\\[72px\\]')]
  const bar = win.querySelector('[data-cloud-scrollbar]')
  return {
    win: { ...R(win), bg: g(win).backgroundColor, radius: g(win).borderTopLeftRadius, border: g(win).borderTopColor, bw: g(win).borderTopWidth },
    nav: rel(nav),
    card: { ...rel(card), radius: g(card).borderTopLeftRadius, bg: g(card).backgroundColor, shadow: g(card).boxShadow },
    menuHead: { ...rel(head), markX: rel(mark).x, markW: rel(mark).w, wordX: rel(word).x, size: g(word).fontSize, weight: g(word).fontWeight, family: g(word).fontFamily.split(',')[0] },
    dbCard: { ...rel(dbCard), radius: g(dbCard).borderTopLeftRadius, bg: g(dbCard).backgroundColor },
    dbTop: { ...rel(dbTop), radius: g(dbTop).borderTopLeftRadius, pl: g(dbTop).paddingLeft, pr: g(dbTop).paddingRight, gap: g(dbTop).gap },
    subs: subs.map((e) => ({ t: e.textContent, ...rel(e), radius: g(e).borderTopLeftRadius, bg: g(e).backgroundColor, pl: g(e).paddingLeft, size: g(e).fontSize, weight: g(e).fontWeight, color: g(e).color })),
    topbar: { ...rel(topbar), close: { ...rel(closeBtn), radius: g(closeBtn).borderTopLeftRadius, bg: g(closeBtn).backgroundColor } },
    topRow: { ...rel(topRow), pl: g(topRow).paddingLeft, pr: g(topRow).paddingRight },
    title: (() => { const e = topRow.querySelector('h2'); return { ...rel(e), size: g(e).fontSize, weight: g(e).fontWeight, family: g(e).fontFamily.split(',')[0] } })(),
    search: (() => { const e = topRow.querySelector('label'); return { ...rel(e), bg: g(e).backgroundColor, radius: g(e).borderTopLeftRadius } })(),
    headings: { ...rel(headings), borderTop: g(headings).borderTopColor, labels: labels.map((e) => ({ t: e.textContent, x: rel(e).x, w: rel(e).w, size: g(e).fontSize, color: g(e).color, weight: g(e).fontWeight })) },
    page: { ...rel(page), borderTop: g(page).borderTopColor, pt: g(page).paddingTop },
    rowCount: rows.length,
    row0: (() => { const e = rows[0]; const th = e.querySelector('.rounded-\\[8px\\]'); return { ...rel(e), pl: g(e).paddingLeft, pr: g(e).paddingRight, bb: g(e).borderBottomColor, bbw: g(e).borderBottomWidth, thumb: { ...rel(th), radius: g(th).borderTopLeftRadius, bg: g(th).backgroundColor } } })(),
    rowLast: { ...rel(rows[rows.length - 1]), bbw: getComputedStyle(rows[rows.length - 1]).borderBottomWidth },
    bar: bar ? { ...rel(bar), bg: g(bar).backgroundColor, radius: g(bar).borderTopLeftRadius, thumb: (() => { const t = bar.firstElementChild; return { ...rel(t), bg: g(t).backgroundColor, h: R(t).h } })() } : null,
    scroller: (() => { const s = win.querySelector('.overflow-x-auto'); return { clientW: s.clientWidth, scrollW: s.scrollWidth, ...rel(s) } })(),
  }
})
console.log(JSON.stringify(m, null, 1))
await b.close()
