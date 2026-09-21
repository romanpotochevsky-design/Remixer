/** The switch in the screen's corner, and the chevron taking the plan to 16 from the top. */
const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = '/home/user/Remixer/prototype/scratchpad/plan-simple'
let chromium
try { ({ chromium } = await import('playwright')) }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')) }
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('PAGEERROR', e.message))
await p.goto(BASE, { waitUntil: 'load' })
await p.waitForTimeout(500)
await p.click('.home-card-face')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await p.waitForTimeout(500)
await p.click('[aria-label="Prototype console"]')
await p.waitForTimeout(300)
await p.evaluate(() => [...document.querySelectorAll('[data-console] button')].find((x) => x.textContent.trim().startsWith('Plan — waiting')).click())
await p.waitForTimeout(400)
await p.click('[aria-label="Close console"]')
await p.mouse.move(8, 8)
await p.waitForTimeout(1400)

const read = () => p.evaluate(() => {
  const cs = getComputedStyle
  const r = (el) => { if (!el) return null; const q = el.getBoundingClientRect(); return [q.x, q.y, q.width, q.height].map((n) => Math.round(n * 100) / 100) }
  const card = document.querySelector('section[aria-label="Plan, waiting for your approval"]')
  const body = document.querySelector('[data-plan-body]')
  const track = document.querySelector('[data-plan-variant]')
  const foot = card?.querySelector('footer.dock-foot')
  return {
    card: r(card), body: r(body),
    cardTop: card ? Math.round(card.getBoundingClientRect().top * 100) / 100 : null,
    switchBox: r(track),
    switchPos: track ? cs(track.parentElement.parentElement).position + ' z' + cs(track.parentElement.parentElement).zIndex : null,
    switchInFooter: !!foot?.querySelector('[data-plan-variant]'),
    footButtons: foot ? [...foot.querySelectorAll('button')].map((x) => x.innerText.trim()) : null,
    composer: r(document.querySelector('.composer-field')),
    sheet: r(document.querySelector('[data-plan-sheet]')),
    sheetRadius: (() => { const el = document.querySelector('[data-plan-sheet]'); return el ? cs(el).borderTopLeftRadius + ' ' + cs(el).backgroundColor : null })(),
    scrim: (() => { const el = document.querySelector('[role="dialog"][aria-modal] > div'); return el ? cs(el).backgroundColor : null })(),
    docMeasure: (() => { const el = document.querySelector('[data-plan-sheet] [data-plan-path="title"]'); return el ? Math.round(el.getBoundingClientRect().width) : null })(),
    viewport: [window.innerWidth, window.innerHeight],
  }
})
const show = (tag) => read().then((v) => console.log(`\n=== ${tag} ===\n` + JSON.stringify(v, null, 1)))
await show('simple, at rest')
await p.screenshot({ path: `${OUT}/c1-rest.png` })
await p.click('[data-plan-unfold]'); await p.waitForTimeout(1100)
await show('after the chevron')
await p.screenshot({ path: `${OUT}/c2-fullscreen.png` })
await p.click('[data-plan-fold]'); await p.waitForTimeout(900)
await show('folded back')
await p.click('[data-plan-seat="full"]'); await p.waitForTimeout(900)
await show('full variant')
await p.screenshot({ path: `${OUT}/c3-full.png` })
await b.close()
