/* Second film: the polished hand-over — pane clip + opacity, the rim (top line's translate vs the clip
   top, group opacity), the flyer (transform, colour, visibility of the real mark), the contents'
   settle (scale of [data-pane-settle]), the rail flood (clip-path radius of .rail-fill, base tile
   colour), frame intervals. BASE = dev (5174) or preview (4173) or a served .html file. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:5174'
const tag = process.argv[2] || 'x'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}${BASE.endsWith('.html') ? '?' : '/?'}p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)

const film = (ms) => p.evaluate(async (ms) => {
  const inset = (el) => { const m = getComputedStyle(el).clipPath.match(/inset\(([^)]*)\)/); if (!m) return null; const v = m[1].split('round')[0].trim().split(/\s+/).map(parseFloat); return v.length === 1 ? [v[0], v[0], v[0], v[0]] : v.length === 2 ? [v[0], v[1], v[0], v[1]] : v.length === 3 ? [v[0], v[1], v[2], v[1]] : v }
  const circleR = (el) => { const m = getComputedStyle(el).clipPath.match(/circle\(([\d.]+)px/); return m ? +m[1] : null }
  const mat = (el) => { const m = getComputedStyle(el).transform; if (!m || m === 'none') return null; const a = m.match(/matrix\(([^)]+)\)/); return a ? a[1].split(',').map(Number) : null }
  const btn = document.querySelector('nav.arrive-rail [aria-label="Cloud"]')
  const s = []; const t0 = performance.now(); let last = t0
  const tick = () => {
    const now = performance.now()
    const pane = document.querySelector('[data-canvas-pane]'); const site = document.querySelector('[data-canvas-site]')
    const rim = pane?.querySelector('[data-pane-rim]'); const topLine = rim?.querySelector('.pane-rim-line')
    const flyer = pane?.querySelector('[data-pane-flyer]'); const mark = pane?.querySelector('[data-cloud-mark]')
    const settle = pane?.querySelector('[data-pane-settle]'); const fill = btn.querySelector('.rail-fill')
    const tm = topLine ? mat(topLine) : null; const fm = flyer ? mat(flyer) : null; const sm = settle ? mat(settle) : null
    s.push({ t: Math.round(now - t0), dt: Math.round(now - last),
      pane: pane ? +(+getComputedStyle(pane).opacity).toFixed(2) : null, clip: pane ? inset(pane)?.map((v) => Math.round(v)) : null,
      rimO: rim ? +(+getComputedStyle(rim).opacity).toFixed(2) : null, rimTopY: tm ? Math.round(tm[5]) : null, rimTopLen: tm ? Math.round(tm[0]) : null,
      flyX: fm ? Math.round(fm[4]) : null, flyColor: flyer ? getComputedStyle(flyer).color : null, flying: pane ? pane.hasAttribute('data-pane-flying') : null,
      markVis: mark ? getComputedStyle(mark).visibility : null,
      settle: sm ? +sm[0].toFixed(4) : null,
      site: site ? +(+getComputedStyle(site).opacity).toFixed(2) : null,
      fillR: fill ? circleR(fill) : null, fillDir: fill ? fill.dataset.railFill : null, tile: getComputedStyle(btn).backgroundColor, glyph: getComputedStyle(btn).color })
    last = now
    if (now - t0 < ms) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  await new Promise((r) => setTimeout(r, ms + 60)); return s
}, ms)
const show = (label, s) => {
  const key = (x) => JSON.stringify([x.pane, x.clip, x.rimO, x.rimTopY, x.flyX, x.flying, x.markVis, x.settle, x.site, x.fillR, x.fillDir, x.tile])
  console.log(`\n== ${label} (${tag}) frames=${s.length} worst dt=${Math.max(...s.slice(1).map((x) => x.dt))}ms`)
  for (const x of s.filter((x, i) => i === 0 || key(x) !== key(s[i - 1]))) console.log([x.t, 'pane', x.pane, x.clip ? x.clip.join('/') : '-', 'rim', x.rimO, 'topY', x.rimTopY, 'len', x.rimTopLen, 'fly', x.flyX, x.flying ? 'FLY' : '', x.flyColor, 'mark', x.markVis, 'settle', x.settle, 'site', x.site, 'fill', x.fillDir, x.fillR, x.tile, x.glyph].join(' '))
}
/* OPEN by a real click at (12,12) inside the button */
const bb = await (await p.$('nav.arrive-rail [aria-label="Cloud"]')).boundingBox()
const [, so] = await Promise.all([p.mouse.click(bb.x + 12, bb.y + 12), film(1400)])
show('OPEN', so)
await p.mouse.move(800, 800)
/* CLOSE by clicking the button again at (36,36) */
const [, sc] = await Promise.all([p.mouse.click(bb.x + 36, bb.y + 36), film(1000)])
show('CLOSE by button', sc)
await p.mouse.move(800, 800); await p.waitForTimeout(400)
await b.close()
