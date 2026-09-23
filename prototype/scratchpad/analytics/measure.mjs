/**
 * Analytics window against board 30934:93319 — the numbers that cannot be re-derived from
 * the code. Run against the PRODUCTION build (port 4173), the way check:brief runs.
 *
 *   CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scratchpad/analytics/measure.mjs
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE || 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
const at = (q) => `${BASE}/?${q}`
await p.goto(at('p=built&v=true&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'), { waitUntil: 'networkidle' })
await p.waitForTimeout(700)
await p.click('.home-card-face')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await p.waitForTimeout(500)
await p.click('nav.arrive-rail [aria-label="Analytics"]')
await p.waitForTimeout(1400)

const R = (s) => p.$eval(s, (n) => { const r = n.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 100) / 100) })
const CSS = (s, q) => p.$eval(s, (n, k) => getComputedStyle(n)[k], q)

const win = await R('[data-analytics-window]')
console.log('window', win, await CSS('[data-analytics-window]', 'backgroundColor'))
console.log('topbar', await R('[data-analytics-window] > div > div:first-child'))
console.log('mark box', await R('[data-analytics-mark]'))
console.log('sheet', await R('[data-analytics-window] [data-analytics-sheet]').catch(() => 'n/a'))

const head = await p.evaluate(() => {
  const h = document.querySelector('[data-analytics-window] h2')
  const sel = document.querySelector('[data-analytics-range]')
  const hr = h.getBoundingClientRect(), sr = sel.getBoundingClientRect()
  const g = getComputedStyle(h)
  return { title: [hr.x, hr.y, hr.width, hr.height], font: [g.fontSize, g.lineHeight, g.fontWeight],
           sel: [sr.x, sr.y, sr.width, sr.height], selRing: getComputedStyle(sel).boxShadow }
})
console.log('head', JSON.stringify(head))

const metrics = await R('[data-analytics-metrics]')
console.log('metrics card', metrics, await CSS('[data-analytics-metrics]', 'borderTopLeftRadius'),
  await CSS('[data-analytics-metrics]', 'borderBottomLeftRadius'), await CSS('[data-analytics-metrics]', 'boxShadow'))

const tabs = await p.evaluate(() => [...document.querySelectorAll('[data-analytics-tab]')].map((e) => {
  const r = e.getBoundingClientRect(); const g = getComputedStyle(e)
  return { on: !!e.dataset.on, x: Math.round(r.x), y: Math.round(r.y * 100) / 100, w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100, ring: g.boxShadow, bg: g.backgroundColor }
}))
console.log('tabs', JSON.stringify(tabs, null, 1))

const strip = await R('[data-analytics-metrics] > div > div')
console.log('strip', strip, await CSS('[data-analytics-metrics] > div > div', 'borderTopLeftRadius'), await CSS('[data-analytics-metrics] > div > div', 'backgroundColor'))

const graph = await R('[data-analytics-graph]')
console.log('graph', graph, 'baseline', await R('[data-analytics-baseline]'))

const cards = await p.evaluate(() => [...document.querySelectorAll('[data-analytics-card]')].map((e) => {
  const r = e.getBoundingClientRect()
  const head = e.querySelector('h3').getBoundingClientRect()
  const inner = e.querySelector('[data-analytics-card] > div > div, section > div > div')
  return { id: e.dataset.analyticsCardId, box: [Math.round(r.x), Math.round(r.height * 100) / 100, Math.round(r.width * 100) / 100],
           headTop: Math.round((head.y - r.y) * 100) / 100 }
}))
console.log('cards', JSON.stringify(cards))

const rows = await p.evaluate(() => [...document.querySelectorAll('[data-analytics-card-id="country"] [data-analytics-bar]')].map((e) => {
  const r = e.getBoundingClientRect(); const par = e.parentElement.getBoundingClientRect()
  return { pct: Math.round((r.width / par.width) * 1000) / 10, h: r.height, bg: getComputedStyle(e).backgroundColor }
}))
console.log('country bars', JSON.stringify(rows))

const axis = await p.evaluate(() => {
  const col = document.querySelector('[data-analytics-graph]').parentElement.previousElementSibling
  const r = col.getBoundingClientRect()
  return { box: [Math.round(r.height * 100) / 100], labels: [...col.children].map((e) => Math.round((e.getBoundingClientRect().y - r.y) * 100) / 100) }
})
console.log('y axis', JSON.stringify(axis))
const days = await p.evaluate(() => {
  const row = document.querySelector('[data-analytics-graph]').previousElementSibling
  const r = row.getBoundingClientRect()
  const plot = row.parentElement.getBoundingClientRect()
  return { top: Math.round((r.y - plot.y) * 100) / 100, h: r.height, n: row.children.length }
})
console.log('days', JSON.stringify(days))
await p.screenshot({ path: 'scratchpad/analytics/window.png' })
await b.close()
