/**
 * The Build Plan's two variants, measured against Figma 30596:27064 (simple) and
 * 29816:21533 (full). Staged in one click through the console's `Plan — waiting for
 * approval` preset rather than walked through the brief.
 */
const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = process.env.OUT || '/home/user/Remixer/prototype/scratchpad/plan-simple'

let chromium
try { ({ chromium } = await import('playwright')) }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')) }

const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('PAGEERROR', e.message))

await p.goto(BASE, { waitUntil: 'load' })
await p.waitForTimeout(600)
/* into the builder first — a preset stages the WORLD, and the plan lives in the shell */
await p.click('.home-card-face')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await p.waitForTimeout(600)
/* the console's handle, then the preset by its own label */
await p.click('[aria-label="Prototype console"]')
await p.waitForTimeout(400)
await p.evaluate(() => {
  const btn = [...document.querySelectorAll('[data-console] button')].find((x) => x.textContent.trim().startsWith('Plan — waiting'))
  if (!btn) throw new Error('preset not found')
  btn.click()
})
await p.waitForTimeout(500)
await p.click('[aria-label="Close console"]')
await p.mouse.move(8, 8)
await p.waitForTimeout(1200)

const read = () => p.evaluate(() => {
  const px = (v) => Math.round(parseFloat(v) * 100) / 100
  const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return [r.width, r.height].map((n) => Math.round(n * 100) / 100) }
  const cs = getComputedStyle
  const card = document.querySelector('section[aria-label="Plan, waiting for your approval"]')
  if (!card) return { error: 'no plan card' }
  const sheet = card.querySelector('.dock-sheet')
  const head = sheet.children[0]
  const title = head.querySelector('p')
  const body = sheet.querySelector('[data-plan-body]')
  const inner = body.querySelector('.flex.flex-col.gap-4')
  const fade = body.lastElementChild
  const foot = card.querySelector('footer.dock-foot')
  const track = foot.querySelector('[data-plan-variant]')
  const thumb = track?.querySelector('.plan-variant-thumb')
  const seats = [...(track?.querySelectorAll('button') ?? [])]
  const unfold = head.querySelector('[data-plan-unfold]')
  const review = foot.querySelector('[data-plan-review]')
  const start = foot.querySelector('[data-plan-start]')
  const lines = [...inner.querySelectorAll('p')].slice(0, 2)
  return {
    card: box(card),
    head: box(head), headPad: [px(cs(head).paddingLeft), px(cs(head).paddingRight)],
    titleSize: px(cs(title).fontSize), titleWeight: cs(title).fontWeight,
    titleY: Math.round((title.getBoundingClientRect().top - head.getBoundingClientRect().top) * 100) / 100,
    unfold: unfold ? { box: box(unfold), r: px(cs(unfold).borderTopLeftRadius),
      y: Math.round((unfold.getBoundingClientRect().top - head.getBoundingClientRect().top) * 100) / 100 } : null,
    body: box(body), bodyR: px(cs(body).borderTopLeftRadius), bodyBg: cs(body).backgroundColor,
    bodyRim: cs(body).boxShadow || cs(body).borderTopWidth + ' ' + cs(body).borderTopColor,
    pad: [px(cs(inner).paddingTop), px(cs(inner).paddingRight), px(cs(inner).paddingBottom), px(cs(inner).paddingLeft)],
    gapOuter: px(cs(inner).rowGap), gapInner: px(cs(inner.children[0]).rowGap),
    lead: lines.map((el) => [px(cs(el).fontSize), cs(el).fontWeight, cs(el).color, px(cs(el).lineHeight)]),
    inkX: Math.round((lines[0].getBoundingClientRect().left - body.getBoundingClientRect().left) * 100) / 100,
    editable: lines.map((el) => el.getAttribute('contenteditable')),
    fade: { box: box(fade), ink: cs(fade).backgroundImage.slice(0, 70),
      bottom: Math.round((body.getBoundingClientRect().bottom - fade.getBoundingClientRect().bottom) * 100) / 100 },
    scrolls: (() => { const sc = body.querySelector('.overflow-y-auto'); return sc ? [sc.scrollHeight, sc.clientHeight] : null })(),
    foot: [px(cs(foot).paddingTop), px(cs(foot).paddingRight), px(cs(foot).paddingBottom), px(cs(foot).paddingLeft)],
    track: track ? { box: box(track), r: px(cs(track).borderTopLeftRadius), bg: cs(track).backgroundColor,
      pad: px(cs(track).paddingLeft) } : null,
    thumb: thumb ? { box: box(thumb), x: Math.round((thumb.getBoundingClientRect().left - track.getBoundingClientRect().left) * 100) / 100,
      bg: cs(thumb).backgroundColor } : null,
    seats: seats.map((s) => ({ label: s.innerText, on: s.dataset.on ?? null, color: cs(s).color, box: box(s) })),
    review: review ? { label: review.innerText, box: box(review) } : null,
    start: start ? { label: start.innerText, box: box(start), bg: cs(start).backgroundColor } : null,
  }
})

const show = (tag, v) => console.log(`\n=== ${tag} ===\n` + JSON.stringify(v, null, 1))
show('simple (default)', await read())
await p.screenshot({ path: `${OUT}/01-simple.png` })

/* the header chevron: more room */
await p.click('[data-plan-unfold]')
await p.waitForTimeout(900)
show('simple, unfolded', await read())
await p.screenshot({ path: `${OUT}/02-tall.png` })
await p.click('[data-plan-unfold]')
await p.waitForTimeout(900)

/* the switch: back to the full card */
await p.click('[data-plan-seat="full"]')
await p.waitForTimeout(900)
show('full', await read())
await p.screenshot({ path: `${OUT}/03-full.png` })

await b.close()
