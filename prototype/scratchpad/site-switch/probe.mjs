/* THE SITE SWITCHER, PROBED ON THE PRODUCTION BUILD (25.09.2026): the header control, the shelf
   opening (the site closing into its card), a pick (the card growing out to the canvas), the world
   swapping, the glow, and the way back. rAF films of both flights. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = 'scratchpad/site-switch'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
const errors = []; p.on('pageerror', (e) => errors.push(String(e)))
await p.goto(`${BASE}${BASE.endsWith('.html') ? '' : '/'}?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(700); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(600)
const shot = (n, clip) => p.screenshot({ path: `${OUT}/${n}.png`, clip })
const out = {}
out.header = await p.$eval('[data-site-switch]', (e) => ({ text: e.querySelector('[data-site-name]').textContent, expanded: e.getAttribute('aria-expanded'), box: e.getBoundingClientRect().toJSON() }))
out.wordmark = await p.$$eval('header span.arrive-word', (els) => els.map((e) => e.textContent))
await shot('01-header', { x: 0, y: 0, width: 600, height: 120 })
/* film: the site layer's park wrapper transform, the shelf's opacity/scale, per frame */
const film = (ms) => p.evaluate(async (ms) => {
  const mat = (el) => { const m = getComputedStyle(el).transform; if (!m || m === 'none') return null; const a = m.match(/matrix\(([^)]+)\)/); return a ? a[1].split(',').map(Number) : null }
  const s = []; const t0 = performance.now()
  const tick = () => {
    const now = performance.now()
    const park = document.querySelector('[data-site-park]'); const pm = park ? mat(park) : null
    const shelf = document.querySelector('[data-sites-shelf]'); const sm = shelf ? mat(shelf) : null
    const fl = document.querySelector('[data-site-flight]'); const fm = fl ? mat(fl) : null
    const site = document.querySelector('[data-canvas-site]')
    s.push({ t: Math.round(now - t0),
      park: pm ? { sx: +pm[0].toFixed(4), sy: +pm[3].toFixed(4), x: +pm[4].toFixed(1), y: +pm[5].toFixed(1), r: getComputedStyle(park).borderTopLeftRadius } : null,
      parkBox: park ? park.getBoundingClientRect().toJSON() : null,
      shelf: shelf ? { o: +(+getComputedStyle(shelf).opacity).toFixed(3), s: sm ? +sm[0].toFixed(4) : 1 } : null,
      flight: fm ? { sx: +fm[0].toFixed(4), x: +fm[4].toFixed(1), y: +fm[5].toFixed(1), box: fl.getBoundingClientRect().toJSON() } : null,
      siteZ: site ? getComputedStyle(site).zIndex : null, surface: document.querySelector('[data-sites-shelf]') ? 'sites' : 'other' })
    if (now - t0 < ms) setTimeout(() => requestAnimationFrame(tick), 0)
  }
  requestAnimationFrame(tick); await new Promise((r) => setTimeout(r, ms + 60)); return s
}, ms)
/* open */
const openFilm = film(1100)
await p.waitForTimeout(30)
await p.click('[data-site-switch]')
out.open = await openFilm
await p.waitForTimeout(200)
out.shelf = await p.$eval('[data-sites-shelf]', (e) => ({ box: e.getBoundingClientRect().toJSON(), cards: [...e.querySelectorAll('[data-site-card]')].map((c) => ({ id: c.dataset.siteCard, current: c.hasAttribute('data-site-current'), thumb: c.querySelector('[data-site-thumb]').getBoundingClientRect().toJSON(), pictureVis: getComputedStyle(c.querySelector('[data-site-picture]')).visibility })) }))
out.parkAtRest = await p.$eval('[data-site-park]', (e) => ({ box: e.getBoundingClientRect().toJSON(), r: getComputedStyle(e).borderTopLeftRadius, transform: getComputedStyle(e).transform }))
out.chevron = await p.$eval('[data-site-chevron]', (e) => getComputedStyle(e).transform)
out.expanded = await p.$eval('[data-site-switch]', (e) => e.getAttribute('aria-expanded'))
await shot('02-shelf')
/* hover the second card */
const c2 = out.shelf.cards[1]
await p.mouse.move(c2.thumb.x + 80, c2.thumb.y + 60); await p.waitForTimeout(250)
await shot('03-hover')
/* pick synco: film the card growing out */
const pickFilm = film(1200)
await p.waitForTimeout(30)
await p.click('[data-site-card="synco"] [data-site-open]')
out.pick = await pickFilm
await p.waitForTimeout(300)
out.after = {
  header: await p.$eval('[data-site-name]', (e) => e.textContent),
  shelf: !!(await p.$('[data-sites-shelf]')), flight: !!(await p.$('[data-site-flight]')),
  world: await p.evaluate(() => { const w = JSON.parse(localStorage.getItem('remixer-prototype/world/v6') || '{}'); return { site: w.site, domain: w.domain, published: w.published, unpublished: w.unpublished, sent: (w.sent || []).length, stashKeys: Object.keys(w.stash || {}) } }),
  drawing: await p.$eval('[data-site-drawing]', (e) => e.dataset.siteDrawing).catch(() => null),
  reloading: await p.$eval('header .animate-spin', () => true).catch(() => false),
  publishLabel: await p.$eval('header button:has-text("Publish")', (e) => e.innerText).catch(() => null),
  chat: await p.$$eval('.chat-col [data-msg], .chat-col article, .chat-col li', (els) => els.length),
}
await shot('04-synco')
await p.waitForTimeout(2500)
out.glowGone = !(await p.$('header .animate-spin'))
/* back to the shelf and home to fit-ration */
const openFilm2 = film(900)
await p.waitForTimeout(30)
await p.click('[data-site-switch]')
out.open2 = await openFilm2
await p.waitForTimeout(200)
await shot('05-shelf-from-synco')
const backFilm = film(900)
await p.waitForTimeout(30)
await p.click('[data-site-card="fit-ration"] [data-site-open]')
out.back = await backFilm
await p.waitForTimeout(400)
out.afterBack = { header: await p.$eval('[data-site-name]', (e) => e.textContent), shelf: !!(await p.$('[data-sites-shelf]')), h1: await p.$eval('.site-stage h1', (e) => e.textContent).catch(() => null), world: await p.evaluate(() => { const w = JSON.parse(localStorage.getItem('remixer-prototype/world/v6') || '{}'); return { site: w.site, domain: w.domain, sent: (w.sent || []).length } }) }
await shot('06-back')
/* Esc closes the way it opened: open, then Esc, film the return */
await p.click('[data-site-switch]'); await p.waitForTimeout(900)
const escFilm = film(900)
await p.waitForTimeout(30)
await p.keyboard.press('Escape')
out.esc = await escFilm
await p.waitForTimeout(300)
out.afterEsc = { shelf: !!(await p.$('[data-sites-shelf]')), park: await p.$eval('[data-site-park]', (e) => getComputedStyle(e).transform), expanded: await p.$eval('[data-site-switch]', (e) => e.getAttribute('aria-expanded')) }
out.errors = errors
const brief = (f) => f.filter((_, i) => i % 6 === 0 || i === f.length - 1).map((x) => ({ t: x.t, park: x.park && [x.park.sx, x.park.x, x.park.y, x.park.r], shelf: x.shelf && [x.shelf.o, x.shelf.s], flight: x.flight && [x.flight.sx, x.flight.x, x.flight.y], z: x.siteZ }))
console.log(JSON.stringify({ ...out, open: brief(out.open), pick: brief(out.pick), open2: brief(out.open2), back: brief(out.back), esc: brief(out.esc) }, null, 1))
await b.close()
