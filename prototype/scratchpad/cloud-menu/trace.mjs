/* Cloud menu: the fold and the flying plate — real-time trace on the built preview. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}${BASE.endsWith('.html') ? '' : '/'}?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
await p.click('nav.arrive-rail [aria-label="Cloud"]')
await p.waitForSelector('[data-cloud-plate]', { timeout: 10000 })
await p.waitForTimeout(1600)

const state = () => p.evaluate(() => {
  const col = document.querySelector('[data-cloud-menu-list]')
  const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); const c = col.getBoundingClientRect(); return [+(r.x - c.x).toFixed(2), +(r.y - c.y).toFixed(2), +r.width.toFixed(2), +r.height.toFixed(2)] }
  const plate = document.querySelector('[data-cloud-plate]')
  const g = getComputedStyle(plate)
  const seat = (id) => box(document.querySelector(`[data-cloud-seat="${id}"]`))
  const fold = document.querySelector('[data-cloud-fold]'); const body = document.querySelector('[data-cloud-fold-body]')
  return {
    plate: box(plate), plateR: g.borderTopLeftRadius, plateBg: g.backgroundColor,
    fold: fold.getBoundingClientRect().height, sizer: body.offsetHeight, bodyOpacity: getComputedStyle(body).opacity, bodyVis: getComputedStyle(body).visibility, inert: body.hasAttribute('inert'),
    cardBg: getComputedStyle(document.querySelector('[data-cloud-card]')).backgroundColor,
    wrapPb: getComputedStyle(document.querySelector('[data-cloud-card-wrap]')).paddingBottom, wrapMb: getComputedStyle(document.querySelector('[data-cloud-card-wrap]')).marginBottom,
    seats: { database: seat('database'), meals: seat('meals'), orders: seat('orders'), emails: seat('emails'), secrets: seat('secrets'), users: seat('users'), storage: seat('storage') },
    moving: col.hasAttribute('data-cloud-moving'),
    title: [...document.querySelectorAll('[data-cloud-title-word]')].map((e) => e.textContent),
    headings: !!document.querySelector('[data-cloud-headings]'), rows: document.querySelectorAll('[data-cloud-row]').length,
    bloom: Object.fromEntries([...document.querySelectorAll('[data-cloud-seat]')].map((e) => [e.dataset.cloudSeat, e.classList.contains('press-bloom')])),
  }
})
console.log('REST', JSON.stringify(await state()))

/* film a click: sample per rAF for `ms` */
const film = (sel, ms) => p.evaluate(async ({ sel, ms }) => {
  const col = document.querySelector('[data-cloud-menu-list]')
  const rel = (el) => { const r = el.getBoundingClientRect(); const c = col.getBoundingClientRect(); return [+(r.x - c.x).toFixed(1), +(r.y - c.y).toFixed(1), +r.width.toFixed(1), +r.height.toFixed(1)] }
  const out = []; const t0 = performance.now()
  const target = sel.startsWith('seat:') ? document.querySelector(`[data-cloud-seat="${sel.slice(5)}"]`) : document.querySelector(sel)
  target.click()
  await new Promise((res) => {
    const tick = () => {
      const now = performance.now() - t0
      const plate = document.querySelector('[data-cloud-plate]'); const fold = document.querySelector('[data-cloud-fold]'); const body = document.querySelector('[data-cloud-fold-body]')
      const secrets = document.querySelector('[data-cloud-seat="secrets"]'); const meals = document.querySelector('[data-cloud-seat="meals"]')
      out.push({ t: Math.round(now), plate: rel(plate), r: parseFloat(getComputedStyle(plate).borderTopLeftRadius), fold: +fold.getBoundingClientRect().height.toFixed(1),
        secrets: rel(secrets)[1], meals: rel(meals)[1], body: +(+getComputedStyle(body).opacity).toFixed(2), vis: getComputedStyle(body).visibility[0],
        card: getComputedStyle(document.querySelector('[data-cloud-card]')).backgroundColor, mb: getComputedStyle(document.querySelector('[data-cloud-card-wrap]')).marginBottom,
        moving: col.hasAttribute('data-cloud-moving') ? 1 : 0, words: document.querySelectorAll('[data-cloud-title-word]').length, heads: document.querySelector('[data-cloud-headings]') ? 1 : 0, rows: document.querySelectorAll('[data-cloud-row]').length })
      if (now < ms) requestAnimationFrame(tick); else res()
    }
    requestAnimationFrame(tick)
  })
  return out
}, { sel, ms })

const show = (name, f) => {
  console.log(`\n${name}`)
  for (const s of f) console.log(`${String(s.t).padStart(4)}  plate ${JSON.stringify(s.plate)} r${s.r}  fold ${s.fold}  secrets.y ${s.secrets}  meals.y ${s.meals}  body ${s.body}${s.vis}  mb ${s.mb}  card ${s.card}  mv${s.moving} w${s.words} h${s.heads} rows${s.rows}`)
}
const leave = await film('seat:secrets', 900); show('LEAVE → Secrets', leave.filter((_, i) => i % 2 === 0))
console.log('AFTER LEAVE', JSON.stringify(await state()))
const back = await film('seat:database', 900); show('BACK → Database', back.filter((_, i) => i % 2 === 0))
console.log('AFTER BACK', JSON.stringify(await state()))
const hop = await film('seat:orders', 600); show('HOP → Orders', hop.filter((_, i) => i % 2 === 0))
console.log('AFTER HOP', JSON.stringify(await state()))
const rooms = await film('seat:users', 700); show('LEAVE from Orders → Users', rooms.filter((_, i) => i % 3 === 0))
const room2 = await film('seat:storage', 600); show('ROOM → Storage', room2.filter((_, i) => i % 3 === 0))
console.log('END', JSON.stringify(await state()))
await b.close()
