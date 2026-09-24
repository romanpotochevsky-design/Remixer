/* THE PAGE SWITCHER, PROBED ON THE PRODUCTION BUILD (25.09.2026). Stills of every state the
   recording of Lovable shows, and an rAF film of the open and the close — scale, opacity, the glint,
   the chevron — so the motion is read off the build and not off intent. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = 'scratchpad/page-switcher'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
const errors = []; p.on('pageerror', (e) => errors.push(String(e)))
await p.goto(`${BASE}${BASE.endsWith('.html') ? '' : '/'}?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(700); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(600)
const shot = (n, clip) => p.screenshot({ path: `${OUT}/${n}.png`, clip })
const pill = await (await p.$('[data-page-switch]')).boundingBox()
const out = { pill, label0: await p.$eval('[data-page-label]', (e) => e.textContent) }
const clipTop = { x: 0, y: 0, width: 1600, height: 460 }
await shot('01-closed', clipTop)
/* film the open */
const film = (ms) => p.evaluate(async (ms) => {
  const mat = (el) => { const m = getComputedStyle(el).transform; if (!m || m === 'none') return null; const a = m.match(/matrix\(([^)]+)\)/); return a ? a[1].split(',').map(Number) : null }
  const s = []; const t0 = performance.now()
  const tick = () => {
    const now = performance.now(); const menu = document.querySelector('[data-page-menu]'); const m = menu ? mat(menu) : null
    const chev = document.querySelector('[data-page-chevron]'); const cm = chev ? mat(chev) : null
    const glint = menu?.querySelector('.glass-glint')
    s.push({ t: Math.round(now - t0), menu: menu ? { o: +(+getComputedStyle(menu).opacity).toFixed(3), s: m ? +m[0].toFixed(4) : 1, y: m ? +m[5].toFixed(1) : 0, top: Math.round(menu.getBoundingClientRect().top * 10) / 10, glint: glint ? +(+getComputedStyle(glint).opacity).toFixed(2) : null } : null,
      chev: cm ? +cm[3].toFixed(2) : 1, rows: [...document.querySelectorAll('[data-page-row]')].map((r) => +(+getComputedStyle(r).opacity).toFixed(2)) })
    if (now - t0 < ms) setTimeout(() => requestAnimationFrame(tick), 0)
  }
  requestAnimationFrame(tick); await new Promise((r) => setTimeout(r, ms + 60)); return s
}, ms)
const openFilm = film(900)
await p.waitForTimeout(30)
await p.mouse.click(pill.x + 140, pill.y + 20)
out.open = await openFilm
await p.waitForTimeout(300)
out.menu = await p.$eval('[data-page-menu]', (e) => { const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height } })
out.input = await p.$eval('[data-page-input]', (e) => ({ value: e.value, focused: document.activeElement === e, sel: [e.selectionStart, e.selectionEnd], placeholder: e.placeholder }))
out.rows = await p.$$eval('[data-page-row]', (els) => els.map((e) => ({ path: e.dataset.pageRow, text: e.textContent, active: e.hasAttribute('data-active'), current: e.hasAttribute('data-current'), h: e.getBoundingClientRect().height, bg: getComputedStyle(e).backgroundColor })))
await shot('02-open', clipTop)
/* hover the third row */
const r3 = await (await p.$('[data-page-row="/services"]')).boundingBox()
await p.mouse.move(r3.x + 60, r3.y + 20); await p.waitForTimeout(200)
out.hover = await p.$$eval('[data-page-row]', (els) => els.map((e) => [e.dataset.pageRow, e.hasAttribute('data-active'), getComputedStyle(e).backgroundColor]))
await shot('03-hover', clipTop)
/* keyboard: down, down → Enter picks Services? active follows the pointer (Services), so Down → Contact */
await p.keyboard.press('ArrowDown'); await p.waitForTimeout(80)
out.afterDown = await p.$$eval('[data-page-row][data-active]', (els) => els.map((e) => e.dataset.pageRow))
await p.keyboard.press('ArrowUp'); await p.waitForTimeout(80)
/* type: filter */
await p.keyboard.type('con'); await p.waitForTimeout(200)
out.filtered = await p.$$eval('[data-page-row]', (els) => els.map((e) => e.dataset.pageRow))
await shot('04-filter', clipTop)
for (let i = 0; i < 3; i++) await p.keyboard.press('Backspace')
await p.waitForTimeout(150)
out.emptyQuery = { rows: await p.$$eval('[data-page-row]', (els) => els.length), value: await p.$eval('[data-page-input]', (e) => e.value), clear: !!(await p.$('[data-page-clear]')) }
await p.keyboard.type('promo'); await p.waitForTimeout(200)
out.goto = await p.$$eval('[data-page-row]', (els) => els.map((e) => ({ path: e.dataset.pageRow, text: e.textContent, goto: e.hasAttribute('data-page-goto') })))
await shot('05-goto', clipTop)
/* the close, filmed, on Enter */
const closeFilm = film(700)
await p.waitForTimeout(30)
await p.keyboard.press('Enter')
out.close = await closeFilm
await p.waitForTimeout(400)
out.afterGoto = { label: await p.$eval('[data-page-label]', (e) => e.textContent), page: await p.$eval('[data-site-page]', (e) => e.dataset.sitePage), notFound: !!(await p.$('[data-site-notfound]')), menu: !!(await p.$('[data-page-menu]')) }
await shot('06-notfound')
/* the site's own link home */
await p.click('[data-site-notfound] [data-site-link="/"]'); await p.waitForTimeout(700)
out.backHome = { label: await p.$eval('[data-page-label]', (e) => e.textContent), page: await p.$eval('[data-site-page]', (e) => e.dataset.sitePage) }
/* pick Services from the menu; film the site handover */
await p.mouse.click(pill.x + 140, pill.y + 20); await p.waitForTimeout(500)
const swapFilm = p.evaluate(async () => {
  const s = []; const t0 = performance.now()
  const tick = () => { const now = performance.now(); s.push({ t: Math.round(now - t0), pages: [...document.querySelectorAll('[data-site-page]')].map((e) => [e.dataset.sitePage, +(+getComputedStyle(e).opacity).toFixed(2)]), label: document.querySelector('[data-page-label]')?.textContent }); if (now - t0 < 900) setTimeout(() => requestAnimationFrame(tick), 0) }
  requestAnimationFrame(tick); await new Promise((r) => setTimeout(r, 960)); return s
})
await p.waitForTimeout(30)
await p.click('[data-page-row="/services"]')
out.swap = await swapFilm
await p.waitForTimeout(300)
out.services = { label: await p.$eval('[data-page-label]', (e) => e.textContent), page: await p.$eval('[data-site-page]', (e) => e.dataset.sitePage), h1: await p.$eval('[data-site-page] h1', (e) => e.textContent) }
await shot('07-services')
/* the footer link → the pill follows the site */
const footer = await p.$('[data-site-page] [data-site-link="/about"]'); await footer.scrollIntoViewIfNeeded(); await p.waitForTimeout(200); await footer.click(); await p.waitForTimeout(700)
out.footer = { label: await p.$eval('[data-page-label]', (e) => e.textContent), page: await p.$eval('[data-site-page]', (e) => e.dataset.sitePage) }
await shot('08-about')
/* reopen: check moves, input pre-filled with the new route; Esc closes; click-outside closes */
await p.mouse.click(pill.x + 140, pill.y + 20); await p.waitForTimeout(500)
out.reopen = { input: await p.$eval('[data-page-input]', (e) => [e.value, e.selectionStart, e.selectionEnd]), current: await p.$$eval('[data-page-row][data-current]', (els) => els.map((e) => e.dataset.pageRow)) }
await p.keyboard.press('Escape'); await p.waitForTimeout(300)
out.escClosed = !(await p.$('[data-page-menu]'))
await p.mouse.click(pill.x + 140, pill.y + 20); await p.waitForTimeout(500)
await p.mouse.click(1000, 600); await p.waitForTimeout(300)
out.outsideClosed = !(await p.$('[data-page-menu]'))
out.errors = errors
console.log(JSON.stringify(out, null, 1))
await b.close()
