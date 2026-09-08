/**
 * Drives the thin-prompt brief end to end in headless Chromium and screenshots every state.
 *
 *   cd prototype && npm run build && (npx vite preview --port 4173 &) && node scripts/check-brief-flow.mjs
 *
 * Env: BASE (default http://localhost:4173), OUT (screenshot dir, default /tmp/check-brief),
 *      CHROME (chromium executable; defaults to Playwright's own install).
 * Uses the globally installed playwright (the cloud sandbox ships it at /opt/node22);
 * `npm i -D playwright` works too — the import below tries both.
 *
 * EVERY RUN STARTS ON THE HOME PAGE, because that is where the customer starts
 * (07.09.2026, when the brief and the Home page became one prototype). Driving the
 * builder directly would prove the brief works and skip the only question the
 * designer actually asked: does a thin prompt typed into the HERO composer end up in
 * the questions instead of a generation. The whole fork hangs on that one hand-off —
 * `startBuild` clears the project axes and calls the builder's own `sendMessage`, so
 * a regression there is invisible from inside the builder.
 *
 * The four cases, in the order they run:
 *
 *   A. thin prompt ("website", 7 chars) → no build. The builder opens with the canvas
 *      COLLAPSED and the chat centred at 800, Remixer asks for direction, the four questions
 *      dock above the composer, the answers survive paging, Submit compiles the summary
 *      card — and then the PLAN, which is Remixer's own step: nothing generates until
 *      Approve. Review moves it into the canvas at full size and ✕ brings it back. Then
 *      the GENERATION: one hardcoded minute with the outline card naming every section
 *      of the home page, one in hand at a time, and NO CANVAS AT ALL until that page is
 *      finished — then the canvas opens on it. Then the three ways to work the divider.
 *   B. strong prompt ("Bella's Bakery" — the composer's own example) → straight to the
 *      build with no questions anywhere, and the same generation outline over a brief
 *      that was never answered (every question on its fallback).
 *   C. a template from the dock ("Use Template") → the seeded prompt is a brief in
 *      itself, so it builds too.
 *   D. the escape hatch: a message typed into the composer while the questions are open
 *      takes over — the panel goes away and the prompt is built as given.
 *
 * ⚠️ The run is ~3 minutes, and most of it is the two builds. That is the point of the
 * case rather than an accident: the generation IS a minute (Figma 29480:48478), and the
 * check that matters most is the negative one — the site does not appear, anywhere,
 * before the page it is a preview of.
 * PASS/FAIL per check, exit code 1 on any FAIL.
 */
import fs from 'node:fs'

let chromium
try { ({ chromium } = await import('playwright')) }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')) }

const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = process.env.OUT || '/tmp/check-brief'
fs.mkdirSync(OUT, { recursive: true })

/** A brand-new trial customer with one site on the shelf (URL keys: p project, h chat, a account…). */
const NEW_PROJECT = 'p=empty&h=empty&a=trial&t=1&c=2000&i=none'

/**
 * BASE may be a directory (`vite preview`) or the single published FILE — point it at
 * `…/remixer-prototype.html` and the same run checks the artifact Roman actually looks
 * at, which is not the same page as a dev tab (see the note about the preview panel's
 * frame budget in CLAUDE.md). So the query is appended, never path-joined.
 */
const at = (q = NEW_PROJECT) => `${BASE}${BASE.includes('?') ? '&' : '?'}${q}`

const results = []
const check = (name, ok, extra = '') => {
  results.push([name, ok])
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`)
}

const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } })
const p = await ctx.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(e.message))

const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png` })
const previewState = () => p.evaluate(() => document.querySelector('[data-preview]')?.getAttribute('data-preview'))
const asideWidth = () => p.$eval('aside', (el) => el.getBoundingClientRect().width)
/**
 * What is actually ON SCREEN.
 *
 * `textContent` is a trap here: the published artifact is ONE file with the whole JS
 * bundle inlined inside `<body>`, so every string the app can render is in the body's
 * text whether it was drawn or not — `includes('Editorial')` would have passed on the
 * source literal and the artifact run would have proved nothing. `innerText` is
 * rendered text only, script and style excluded.
 */
const text = () => p.evaluate(() => document.body.innerText)
const onHome = () => p.$('input[aria-label="Describe the site you want"]').then(Boolean)
const panelUp = () => p.$('section[aria-label="Questions before building"]').then(Boolean)
const planUp = () => p.$('section[aria-label="Plan, waiting for your approval"]').then(Boolean)
const cardUp = () => p.$('section[aria-label="What Remixer is building"]').then(Boolean)
/** The composer field's box, rounded — the one thing the dock's bubble must never move. */
const fieldBox = () =>
  p.$eval('.composer-field', (el) => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 100) / 100) })
/**
 * The generation outline, as the DOM has it: the page being built, every section with
 * the state it is in, the work line under the one in hand, and the pages queued below.
 * `data-state` is read rather than inferred from a colour, so a restyle cannot make
 * this check quietly meaningless.
 */
const outline = () =>
  p.evaluate(() => {
    const c = document.querySelector('section[aria-label="What Remixer is building"]')
    if (!c) return null
    return {
      page: c.querySelector('p').innerText,
      rows: [...c.querySelectorAll('li')].map((li) => ({
        name: li.querySelector('span.block').innerText,
        state: li.dataset.state,
        work: li.querySelector('.gen-work')?.innerText ?? null,
      })),
      pages: [...c.querySelectorAll('div.h-12')].map((d) => d.innerText),
      shimmer: !!c.querySelector('.gen-work'),
    }
  })
/** Is the demo site actually rendered in the canvas, or is the stage still empty? */
const siteUp = () => p.$('.site-stage h1').then(Boolean)
/** How many of the rail's site tools (Style / Integrations / Analytics / Cloud) are up. */
const railTools = () => p.$$eval('nav button[aria-label]', (els) =>
  els.filter((e) => ['Website Styles', 'Integrations', 'Analytics', 'Cloud'].includes(e.getAttribute('aria-label'))).length)
/**
 * The measure of the chat's content and how it sits in the column that holds it.
 *
 * Measured against the ASIDE, not the window: the 56px right rail is chrome outside
 * the chat column, so a column centred in the chat would read 56px off centre against
 * the viewport and the check would fail on correct layout.
 */
const chatCol = () =>
  p.$$eval('.chat-col', (els) => {
    const aside = document.querySelector('aside').getBoundingClientRect()
    return els.map((e) => {
      const r = e.getBoundingClientRect()
      return { w: Math.round(r.width), left: Math.round(r.left - aside.left), right: Math.round(aside.right - r.right) }
    })
  })

/**
 * Pull the divider right until the canvas is gone — the only way to collapse it.
 *
 * ⚠️ WAIT FOR THE STATE, not for a fixed pause. A flat `waitForTimeout` after mouse-up
 * made this flake: the collapse fires inside a pointermove, and on a loaded machine the
 * moves coalesce and land late. Two runs failed and the third passed on identical code,
 * which is worse than a red check — it teaches you to ignore the run. The wait is
 * swallowed so a genuinely broken collapse still reports FAIL rather than throwing.
 */
async function dragShut() {
  const bb = await (await p.$('.chat-resizer')).boundingBox()
  const far = await p.evaluate(() => window.innerWidth - 20)
  await p.mouse.move(bb.x, bb.y + 300)
  await p.mouse.down()
  for (let x = bb.x; x < far; x += 60) { await p.mouse.move(x, bb.y + 300); await p.waitForTimeout(16) }
  await p.mouse.move(far, bb.y + 300)
  await p.mouse.up()
  await p
    .waitForFunction(() => document.querySelector('[data-preview]')?.getAttribute('data-preview') === 'closed',
      null, { timeout: 4000 })
    .catch(() => {})
  await p.waitForTimeout(450)
}

/** Type into the hero composer and press Build — the one hand-off under test. */
async function buildFromHome(prompt) {
  await p.goto(at(), { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  await p.fill('input[aria-label="Describe the site you want"]', prompt)
  await p.click('button:has-text("Build")')
  /* The transition (darken → glow → arrive, ~3.6s): wait for its layer to leave, then a
     beat for the shell to settle. */
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 10000 })
  await p.waitForTimeout(400)
}

/* =============================================== A. thin prompt from the hero */

await p.goto(at(), { waitUntil: 'networkidle' })
await p.waitForTimeout(700)
await shot('01-home')
check('the prototype opens on the Home page', await onHome())

await p.fill('input[aria-label="Describe the site you want"]', 'website')
await p.click('button:has-text("Build")')
/* The transition: the Home page darkens, the Remixer glow runs along the edge of the
   screen for a couple of seconds, then the shell arrives (~3.6s, BOOT_MS). Sampled during
   the darkening and during the glow beat, then waited out before anything is clicked. */
await p.waitForTimeout(200)
check('the Home → builder step plays under a cover', !!(await p.$('.boot-cover')))
await shot('02a-corridor-darken')
await p.waitForTimeout(1000)
check('the edge glow runs on the black, and no mark does',
  !!(await p.$('.boot-cover[data-phase="glow"] .boot-glow .siri-glow')) && !(await p.$('.boot-cover svg')))
await shot('02b-corridor-glow')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 10000 })
check('the transition ends by itself', !(await p.$('.boot-cover')))
await p.waitForTimeout(300)
await shot('02-builder-collapsed')
/* The field as it stands alone — the reference the bubble must not move. */
const fieldAlone = await fieldBox()
check('a thin prompt from the hero opens the builder, not a generation', !(await onHome()))
check('the canvas is collapsed on arrival', (await previewState()) === 'closed', `preview=${await previewState()}`)
check('the chat takes the whole shell', (await asideWidth()) > 1200, `aside=${Math.round(await asideWidth())}px`)
{
  /* 800 is Figma 29464:33917's own measure for the chat standing alone (CHAT_CONTENT),
     not Lovable's 600 — the designer pointed at his board on 07.09.2026. */
  const cols = await chatCol()
  const centred = cols.length > 0 && cols.every((c) => c.w <= 800 && Math.abs(c.left - c.right) <= 24)
  check('the chat content is an 800px column, centred', centred, JSON.stringify(cols))
}

await p.waitForTimeout(4600)
await shot('03-question-1')
const askedBody = await text()
check('Remixer asks for direction instead of guessing', askedBody.includes('a guess costs you a build'))
check('the reply carries its thinking time', askedBody.includes('Thought for 5s'))
check('the question panel docks above the composer', await panelUp())
/*
 * THE FIELD DOES NOT MOVE (designer, 07.09.2026: "само поле не должно смещаться или менять
 * размер"). The dock's bubble grows AROUND the composer — the shell is drawn outside the
 * field's box — so the field's rectangle with the questions up must be the one it had
 * standing alone, to the hundredth of a pixel.
 */
{
  const withSheet = await fieldBox()
  check('the composer field has not moved or resized under the questions',
    JSON.stringify(withSheet) === JSON.stringify(fieldAlone), `${JSON.stringify(fieldAlone)} → ${JSON.stringify(withSheet)}`)
}
check('the composer relabels itself as the escape hatch',
  (await p.getAttribute('textarea', 'placeholder'))?.startsWith('Tell Remixer'))

/*
 * THE ANSWER ROW'S HOVER — Figma 29688:26919 (designer, 08.09.2026: "ховер это скруглёный
 * полупрозрачный бордер как в макете"), DRAWN — 29688:29507 ("цвет бордера не равномерно
 * одновременно по всему бордеру появляется, а градиентно по бордеру наполняет объект").
 * A 1px ring at radius 16 in 32% white that RUNS once round the row from the top-left
 * corner, clockwise, no fill, and the hairlines on both sides of the ring go. The negative half is the one
 * that matters: the ring is a stroke on an overlay, never a border — so the boxes must be
 * identical hovered and not, drawing and drawn.
 */
const rowBoxes = () => p.$$eval('.brief-opt', (els) => els.map((el) => {
  const b = el.getBoundingClientRect()
  return [+b.left.toFixed(2), +b.top.toFixed(2), +b.width.toFixed(2), +b.height.toFixed(2)]
}))
const dividers = () => p.$$eval('.brief-opt', (els) => els.map((el) => {
  const cs = getComputedStyle(el, '::after')
  return cs.content === 'none' ? null : +(+cs.opacity).toFixed(2)
}))
/* one ring of a row — its SVG overlay, `hover` or `pick` — as the eye has it now */
const ring = (sel, kind) => p.$eval(sel, (el, kind) => {
  const svg = el.querySelector(`.brief-draw--${kind}`)
  const cs = getComputedStyle(svg)
  const ink = svg.querySelector('.ink')
  const body = svg.querySelector('.body')
  /* a stroke's lightness 0…1 — the fade is a COLOUR, from the ground under the ring
     (`--ring-ground`, a registered property, so it reads back resolved) to white */
  const lum = (st) => { const m = st.match(/[\d.]+/g); return !m ? 0 : st.startsWith('color(') ? +m[0] : +m[0] / 255 }
  const g0 = lum(cs.getPropertyValue('--ring-ground'))
  const lit = (r) => (lum(getComputedStyle(r).stroke) - g0) / (1 - g0)
  const segs = [...svg.querySelectorAll('.is-drawing .seg')].map(lit)
  const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1)
  const geo = getComputedStyle(body || svg.querySelector('rect'))
  return {
    op: +cs.opacity, vis: cs.visibility, drawing: segs.length > 0,
    /* how far the draw has got: the dashes' mean lightness, ground 0 → white 1; 1 once
       the lap is done and the stroke stands solid */
    l: body ? 1 : +mean(segs).toFixed(3),
    /* the gradient of the moment: the corner's first dashes against the far side (p ≈ .5) */
    corner: +mean(segs.slice(0, 4)).toFixed(3), far: +mean(segs.slice(30, 34)).toFixed(3),
    solid: !!body && geo.strokeDasharray === 'none',
    white: body ? +lit(body).toFixed(3) : null, width: geo.strokeWidth, rx: geo.rx,
    /* the ring's translucency lives on `.ink`: the hover's 32%, the pick's gradient mask */
    alpha: +getComputedStyle(ink).opacity,
    masked: (getComputedStyle(ink).maskImage || getComputedStyle(ink).webkitMaskImage || '').includes('brief-pick-mask'),
    ground: cs.getPropertyValue('--ring-ground'),
    radius: getComputedStyle(el).borderRadius, fill: getComputedStyle(el).backgroundColor,
    shadow: getComputedStyle(el).boxShadow, gap: getComputedStyle(el).marginBottom,
    press: el.hasAttribute('data-press'), on: el.getAttribute('aria-pressed') === 'true',
  }
}, kind)
/* one pixel of the page as the screen has it — a 1×1 PNG's only sample: whatever the
   scanline filter, a pixel with no neighbours is stored raw */
const pixelAt = async (x, y) => {
  const png = await p.screenshot({ clip: { x, y, width: 1, height: 1 } })
  let off = 8, idat = []
  while (off < png.length) {
    const len = png.readUInt32BE(off), type = png.toString('ascii', off + 4, off + 8)
    if (type === 'IDAT') idat.push(png.subarray(off + 8, off + 8 + len))
    off += 12 + len
  }
  const raw = (await import('node:zlib')).inflateSync(Buffer.concat(idat))
  return [raw[1], raw[2], raw[3]]
}
{
  const before = await rowBoxes()
  await p.hover('.brief-opt:nth-of-type(2)')
  /* ⚠️ WAIT FOR THE DRAW TO HAVE STARTED, not for a fixed 90ms. A flat pause makes this
     check depend on how loaded the machine is: on a busy run the animation's first frame
     lands late and the ring measures 0.039 lit against a 0.05 floor — a red on correct
     code, which is worse than no check (the same lesson `dragShut` carries). This polls
     the ring's own mean lightness and reads the first frame that is measurably lit, which
     is early in the 220ms lap by construction. */
  await p.waitForFunction(() => {
    const svg = document.querySelector('.brief-opt:nth-of-type(2) .brief-draw--hover')
    const segs = svg ? [...svg.querySelectorAll('.is-drawing .seg')] : []
    if (!segs.length) return false
    const lum = (st) => { const m = st.match(/[\d.]+/g); return m ? +m[0] / 255 : 0 }
    const g0 = lum(getComputedStyle(svg).getPropertyValue('--ring-ground'))
    const mean = segs.reduce((a, r) => a + (lum(getComputedStyle(r).stroke) - g0) / (1 - g0), 0) / segs.length
    return mean > 0.06
  }, null, { timeout: 2000 }).catch(() => {})
  const mid = await ring('.brief-opt:nth-of-type(2)', 'hover')
  check('the hover ring DRAWS itself: part-way in, the ring is part-way lit',
    mid.drawing && mid.op === 1 && mid.vis === 'visible' && mid.l > 0.05 && mid.l < 0.9, `l=${mid.l} drawing=${mid.drawing} op=${mid.op}`)
  check('…as a gradient that appears, brightest at the corner it grew from, thinning toward the far side',
    mid.corner > 0.5 && mid.far < mid.corner * 0.85, `corner=${mid.corner} far=${mid.far}`)
  await p.waitForTimeout(800)
  const done = await ring('.brief-opt:nth-of-type(2)', 'hover')
  check('…and closes into a full 1px ring at radius 16, 32% white (white strokes, the alpha on the group), nothing left animating',
    done.solid && !done.drawing && done.width === '1px' && done.white === 1 && done.alpha === 0.32 && done.rx === '15.5px' && done.radius === '16px',
    JSON.stringify(done))
  /*
   * The dashes fade from the colour of the GROUND under the ring to white (index.css "THE
   * BORDER THAT DRAWS ITSELF"), so an unlit dash is invisible only while `--ring-ground` is
   * that ground — the answers card over the dock — to the pixel. Read a pixel of the card
   * beside the row and hold the constant to it.
   */
  {
    const [rl, rt] = (await rowBoxes())[1]
    const px = await pixelAt(Math.round(rl + 8), Math.round(rt - 12))
    const m = done.ground.match(/[\d.]+/g).map(Number)
    const want = done.ground.startsWith('color(') ? m.slice(0, 3).map((v) => v * 255) : m.slice(0, 3)
    check('the unlit dash colour is the card\'s own ground, to the pixel',
      px.every((v, i) => Math.abs(v - want[i]) <= 2), `pixel ${px.join(',')} vs --ring-ground ${done.ground}`)
  }
  check('the ring is a stroke, not a fill and not a box-shadow', done.fill === 'rgba(0, 0, 0, 0)' && done.shadow === 'none', `${done.fill} / ${done.shadow}`)
  check('the hairlines on both sides of the ring go', (await dividers()).slice(0, 2).every((o) => o === 0), JSON.stringify(await dividers()))
  check('the rows sit apart, so two rings can never meet', done.gap === '6px', done.gap)
  const after = await rowBoxes()
  check('nothing in the card moves under the hover, drawing or drawn',
    JSON.stringify(before) === JSON.stringify(after), `${JSON.stringify(before[1])} → ${JSON.stringify(after[1])}`)
  await p.mouse.move(4, 4)
  await p.waitForTimeout(260)
  const gone = await ring('.brief-opt:nth-of-type(2)', 'hover')
  check('the ring leaves with the pointer', gone.op === 0 && gone.vis === 'hidden', `op=${gone.op} ${gone.vis}`)
}

/*
 * THE PICKED ROW — Figma 29688:27643 (designer, 08.09.2026: "бордер 2px и градиентный"),
 * DRAWN — 29688:29507 ("то же самое и на клик, более светлый белый цвет в 2 пикселя так же
 * плавно заполняет пункт по кругу, создавая этот бордер в 2px"). The 2px gradient ring runs
 * round the row on the press and then STANDS as the resting ring — the last frame of its
 * own draw, nothing left animating.
 */
{
  const before = await rowBoxes()
  await p.click('.brief-opt:nth-of-type(2)')
  await p.waitForTimeout(110) /* ~40% into the 280ms draw */
  const mid = await ring('.brief-opt:nth-of-type(2)', 'pick')
  check('a press starts the 2px ring drawing round the row',
    mid.drawing && mid.press && mid.op === 1 && mid.l > 0.05 && mid.l < 0.9 && mid.width === '2px', `l=${mid.l} drawing=${mid.drawing} press=${mid.press} w=${mid.width}`)
  check('…in the house gradient, worn as a luminance mask over white strokes, not a flat token', mid.masked && mid.alpha === 1, `masked=${mid.masked} alpha=${mid.alpha}`)
  check('…appearing as a gradient round the row, not arriving as a strip', mid.corner > 0.5 && mid.far < mid.corner * 0.85, `corner=${mid.corner} far=${mid.far}`)
  await p.waitForTimeout(900)
  const done = await ring('.brief-opt:nth-of-type(2)', 'pick')
  check('the lap closes into the resting ring, nothing left animating',
    done.on && !done.drawing && !done.press && done.solid && done.white === 1 && done.masked && done.op === 1 && done.rx === '15px', JSON.stringify(done))
  check('drawn as strokes on an overlay, so the rows have not moved',
    JSON.stringify(await rowBoxes()) === JSON.stringify(before))
  check('the hairlines around the picked row go', (await dividers()).slice(0, 2).every((o) => o === 0), JSON.stringify(await dividers()))
  /* the 2px ring is the stronger statement: a picked row does not also take the hover ring */
  const hov = await ring('.brief-opt:nth-of-type(2)', 'hover')
  check('a picked row gives up its hover ring', hov.op === 0 && hov.vis === 'hidden', `op=${hov.op} ${hov.vis}`)
  /*
   * THE ONE THE DESIGNER REPORTED (08.09.2026): a picked row's 2px ring and the hover
   * ring of the row above it used to land a pixel apart and smear together. They must
   * stay a clear few pixels apart, whatever either ring is doing.
   */
  await p.hover('.brief-opt:nth-of-type(1)')
  await p.waitForTimeout(260)
  const clearance = await p.$$eval('.brief-opt', (els) =>
    +(els[1].getBoundingClientRect().top - els[0].getBoundingClientRect().bottom).toFixed(1))
  check('a picked row and a hovered neighbour keep their distance', clearance >= 6, `${clearance}px`)
  /* picking another row: the old ring fades, the new one draws — and the run goes on
     with row 1 picked, as the rest of it expects */
  await p.click('.brief-opt:nth-of-type(1)')
  await p.waitForTimeout(200) /* past the old ring's 160ms fade, inside the new ring's 280ms draw */
  const old = await ring('.brief-opt:nth-of-type(2)', 'pick')
  const next = await ring('.brief-opt:nth-of-type(1)', 'pick')
  check('the ring of the row given up fades out while the new one draws',
    !old.on && old.op === 0 && next.on && next.drawing, `old op=${old.op} on=${old.on}; new drawing=${next.drawing}`)
  await p.mouse.move(4, 4)
  await p.waitForTimeout(800)
}

/*
 * The four questions are ours (brief.ts): a goal, how many pages, the colour grid, the
 * lettering. Answered here the way the demo answers them — every one a PICKED option, so
 * the summary prints real names and both drawn shapes of the panel get exercised.
 */
await p.click('section button[aria-label="Sell something"]'); await p.waitForTimeout(200)
await p.click('text=Next'); await p.waitForTimeout(400); await shot('04-q2-pages')
await p.click('section button[aria-label="A few pages"]'); await p.waitForTimeout(200)
await p.click('text=Next'); await p.waitForTimeout(400); await shot('05-q3-palette')
/* Back and forward again: paging must not eat an answer. */
await p.click('button[aria-label="Previous question"]'); await p.waitForTimeout(300)
check('paging back keeps the answer',
  (await p.getAttribute('section button[aria-label="A few pages"]', 'aria-pressed')) === 'true')
/*
 * THE STEP MORPH, FILMED — the designer's screen recording, 08.09.2026 ("при переходах
 * есть дефекты и глюки визуальные"). Two defects it showed, both caught here by sampling
 * every frame of the morph rather than by looking at the end of it:
 *  · the sheet rides the piston, so on a morph to a TALLER question it starts the height
 *    difference LOWER — and hung over the footer and down across the composer. It is now
 *    clipped at the footer's line (`.dock-clip`), which never moves.
 *  · the two questions were painted over each other at about half alpha for 90ms, which on
 *    a whole panel of content reads as a double exposure, not as a cross-fade.
 */
{
  await p.evaluate(() => {
    const out = (window.__morph = [])
    const t0 = performance.now()
    const tick = () => {
      const clip = document.querySelector('.dock-clip')
      const foot = document.querySelector('.dock-foot')
      const piston = document.querySelector('.dock-piston'), base = document.querySelector('.dock-base')
      if (clip && foot) out.push({
        drift: +(clip.getBoundingClientRect().bottom - foot.getBoundingClientRect().top).toFixed(1),
        lit: [...document.querySelectorAll('.dock-sheet > div')].map((g) => +getComputedStyle(g).opacity),
        /* how far the piston's bottom edge is ABOVE the collar's seam: > 0 is ground showing */
        gap: +(base.getBoundingClientRect().top - piston.getBoundingClientRect().bottom).toFixed(1),
      })
      if (performance.now() - t0 < 700) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  await p.click('button[aria-label="Next question"]')
  await p.waitForTimeout(900)
  const f = await p.evaluate(() => window.__morph)
  check('the sheet is clipped at the footer’s line for every frame of the morph',
    f.length > 20 && f.every((x) => Math.abs(x.drift) < 1),
    `${f.length} frames, worst ${Math.max(...f.map((x) => Math.abs(x.drift)))}px`)
  /* ⚠️ THE PANEL IS EXACTLY AS TALL AS WHAT IT HOLDS. The clip's first cut opened the box
     upward with a negative margin, which collapsed through the panel's own edge: the panel
     grew 640px, `--rise` with it, and a black slab stood above every question — on the
     designer's screen, while every motion check here was green. Whatever the clip does,
     the panel's box is its sheet plus its footer, and the piston's edge sits on it. */
  const tall = await p.evaluate(() => {
    const sec = document.querySelector('section[aria-label="Questions before building"]')
    const r = (e) => e.getBoundingClientRect()
    const piston = document.querySelector('.dock-piston')
    return { section: r(sec).height, inner: r(sec.querySelector('.dock-sheet')).height + r(sec.querySelector('.dock-foot')).height,
             edge: +(r(piston).top - r(sec).top).toFixed(1), rise: getComputedStyle(document.querySelector('.dock')).getPropertyValue('--rise') }
  })
  check('the panel is exactly as tall as its sheet plus its footer, and the edge sits on it',
    Math.abs(tall.section - tall.inner) < 1 && Math.abs(tall.edge) < 1 && Math.abs(parseFloat(tall.rise) - tall.section) < 1,
    JSON.stringify(tall))
  const both = f.filter((x) => x.lit.length > 1 && Math.min(...x.lit) > 0.06)
  check('…and one question is lit at a time: the old is gone before the new appears',
    both.length === 0, `${both.length} of ${f.length} frames with two lit`)
  /* THE BLACK GAP (designer's recording, 09.09.2026 00:32: "внизу какая-то чёрная щель
     мелькает"): on a morph to a SHORTER question the piston starts higher, and its overhang
     below the seam — 48px then — did not reach the collar for a 120–224px drop, so the ground
     showed under the answers with the footer sitting on it. This step IS a shrink (pages →
     colours); the piston's bottom must never rise above the collar's seam. */
  const worst = Math.max(...f.map((x) => x.gap))
  check('the piston always reaches the collar: no ground shows under the panel while it shrinks',
    worst <= 0, `worst gap ${worst}px over ${f.length} frames`)
}
{
  /* THE THIRD DEFECT IN THE FIRST RECORDING (frame 118): a hover ring on a row nobody pointed
     at. The rows ride the piston, so with the pointer parked they slide UNDER it and light one
     after another as they pass — measured two rows in turn on one morph. A hover is the
     pointer's gesture, not the content's: an enter that arrives while the dock moves is
     ignored (`dockInMotion`, BriefPanel.tsx). Park the pointer in the card, step by keyboard,
     and nothing may light; then step back the same way. */
  const sheet = await (await p.$('section[aria-label="Questions before building"] .dock-sheet')).boundingBox()
  await p.mouse.move(sheet.x + sheet.width / 2, sheet.y + sheet.height * 0.55); await p.waitForTimeout(250)
  const parked = async (btn) => {
    await p.evaluate(() => {
      const out = (window.__hov = []); const t0 = performance.now()
      const tick = () => {
        out.push([...document.querySelectorAll('.brief-pick[data-hov]')].map((e) => e.getAttribute('aria-label')))
        if (performance.now() - t0 < 900) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    await p.focus(btn); await p.keyboard.press('Enter'); await p.waitForTimeout(1000)
    const h = await p.evaluate(() => window.__hov)
    return { frames: h.length, lit: [...new Set(h.flat())] }
  }
  const grow = await parked('footer button:has-text("Next")')
  check('rows sliding under a parked pointer do not light: nothing hovers during the morph',
    grow.frames > 20 && grow.lit.length === 0, JSON.stringify(grow))
  const back = await parked('footer button[aria-label="Previous question"]')
  check('…and not on the way back either', back.frames > 20 && back.lit.length === 0, JSON.stringify(back))
}
{
  /* The house press bloom on the footer's buttons (designer, 08.09.2026: "на эти все кнопки
     нужно добавить наш эффект клика, который мы делали в стиле гугл") — the same delegation
     the Home controls use: positional, and clipped to the button's own rounded box. The
     press is released OFF the button, so measuring it does not also page the brief. */
  const sel = 'footer button:has-text("Skip all")'
  const bb = await (await p.$(sel)).boundingBox()
  await p.mouse.move(bb.x + bb.width * 0.25, bb.y + bb.height * 0.5)
  await p.mouse.down()
  await p.waitForTimeout(120)
  const bloom = await p.$eval(sel, (el) => {
    const layer = el.querySelector(':scope > .glass-ripples')
    const rip = layer?.querySelector('.glass-ripple')
    const b = el.getBoundingClientRect(), l = layer?.getBoundingClientRect(), r = rip?.getBoundingClientRect()
    return {
      fits: l ? [+(l.width - b.width).toFixed(1), +(l.height - b.height).toFixed(1)] : null,
      clipped: layer ? getComputedStyle(layer).overflow : null,
      from: r ? +((r.left + r.width / 2 - b.left) / b.width).toFixed(2) : null,
      op: rip ? +getComputedStyle(rip).opacity : 0,
    }
  })
  await p.mouse.move(10, 10); await p.mouse.up(); await p.waitForTimeout(260)
  check('the footer’s buttons bloom from the point of the press, clipped to their own box',
    bloom.op > 0 && bloom.clipped === 'hidden' && bloom.fits.every((d) => Math.abs(d) < 0.5) &&
      Math.abs(bloom.from - 0.25) < 0.08, JSON.stringify(bloom))
}
{
  /* The colour question is the drawn GRID (25732:139123), not rows: four plates of four
     cells, and its own field with no radio beside it. */
  const plates = await p.$$eval('section [aria-label="Warm Clay"] > span > span', (els) => els.length)
  check('the colour question is a grid of four-cell plates', plates === 4, `${plates} cells`)
}
/*
 * THE PLATES WEAR THE ROWS' RINGS — Figma 25732:138657 (hovered) and 29745:57892 (picked),
 * both sent by the designer on 08.09.2026 with "сделай перфект пиксель… анимации ховера и
 * клика возьми из компонента с обычным выбором". Three things have to hold at once: the
 * 4px he put round each plate is a GAP that survives the ring thickening (so the stroke is
 * drawn outside the box, `x` negative, and the radius grows with it); nothing moves, ever,
 * as the rows already promise; and the blue `--action` ring we had while the boards were
 * silent is gone.
 */
const tiles = (sel) => p.$$eval(sel, (els) => els.map((el) => {
  const b = el.getBoundingClientRect(), i = el.querySelector('span').getBoundingClientRect()
  return [b, i].map((r) => [r.left, r.top, r.width, r.height].map((v) => +v.toFixed(1)))
}))
{
  const rest = await tiles('.brief-tile--swatch')
  check('every plate sits in a 4px box of its own, and the boxes stand 8 apart',
    rest.length === 4 && rest.every(([b, i]) => i[0] - b[0] === 4 && i[1] - b[1] === 4 && b[2] - i[2] === 8 && b[3] - i[3] === 8) &&
      +(rest[1][0][0] - rest[0][0][0] - rest[0][0][2]).toFixed(1) === 8,
    JSON.stringify(rest[0]))
  await p.hover('.brief-tile--swatch[aria-label="Warm Clay"]'); await p.waitForTimeout(320)
  const hov = await ring('.brief-tile--swatch[aria-label="Warm Clay"]', 'hover')
  check('a hovered plate takes the row\'s own 1px ring at 32% white, drawn and closed',
    hov.op === 1 && hov.alpha === 0.32 && hov.width === '1px' && hov.solid && hov.white === 1,
    JSON.stringify(hov))
  check('…drawn OUTSIDE the box, so the designer\'s 4px stays clear of the stroke',
    hov.rx === '12.5px' && hov.radius === '12px', `rx=${hov.rx} box=${hov.radius}`)
}
await p.click('section button[aria-label="Warm Clay"]'); await p.waitForTimeout(400); await shot('06-palette-picked')
check('a picked plate shows it', (await p.getAttribute('section button[aria-label="Warm Clay"]', 'aria-pressed')) === 'true')
{
  const pick = await ring('.brief-tile--swatch[aria-label="Warm Clay"]', 'pick')
  check('a picked plate takes the 2px gradient ring, not our old blue one',
    pick.op === 1 && pick.width === '2px' && pick.masked && pick.shadow === 'none' && pick.rx === '13px',
    JSON.stringify(pick))
  await p.mouse.move(20, 20); await p.waitForTimeout(300)
  const after = await tiles('.brief-tile--swatch')
  check('and nothing in the grid moved: same boxes, same plates, hovered, picked and at rest',
    JSON.stringify(after) === JSON.stringify(await tiles('.brief-tile--swatch')) &&
      after.every(([b, i]) => b[2] - i[2] === 8 && b[3] - i[3] === 8), JSON.stringify(after[1]))
}
await p.click('text=Next'); await p.waitForTimeout(400); await shot('07-q4-lettering')
{
  /* The lettering cards set each pair's name IN that pair, which is only worth anything
     if the faces are really there. `fonts.check` plus a width that differs from the
     fallback — a bundled-but-broken woff2 would pass the first test and fail the second. */
  const faces = await p.evaluate(() => {
    const fams = ['Space Grotesk','DM Sans','Instrument Serif','Work Sans','DM Serif Display','Fira Sans']
    const c = document.createElement('canvas').getContext('2d')
    const w = (f) => { c.font = `17px '${f}', monospace`; return c.measureText('Title - ' + f).width }
    return fams.map((f) => ({ f, ok: document.fonts.check(`17px '${f} Specimen'`), differs: Math.abs(w(`${f} Specimen`) - w('__nope__')) > 1 }))
  })
  const bad = faces.filter((x) => !x.ok || !x.differs).map((x) => x.f)
  check('every typeface on the lettering cards is really loaded', bad.length === 0, bad.join(', ') || '6/6')
  check('the lettering question is a grid of four cards',
    (await p.$$eval('section button[aria-pressed]', els => els.length)) === 4)
}
await p.click('section button[aria-label="Friendly"]'); await p.waitForTimeout(400)
{
  /* The lettering cards follow the plates ("тоже самое и для выбора шрифта можно
     сделать"): the same 4px box, the same drawn pair, and the box's radius the card's 12
     plus that 4. */
  const cards = await tiles('.brief-tile--card')
  const pick = await ring('.brief-tile--card[aria-label="Friendly"]', 'pick')
  check('a picked lettering card takes the same ring, on a box 4px round the card',
    cards.every(([b, i]) => i[0] - b[0] === 4 && b[2] - i[2] === 8) &&
      pick.width === '2px' && pick.masked && pick.shadow === 'none' && pick.rx === '17px' && pick.radius === '16px',
    JSON.stringify(pick))
}
await p.click('text=Submit'); await p.waitForTimeout(900); await shot('08-summary')
{
  const body = await text()
  check('the summary card prints the answers',
    body.includes('Sell something') && body.includes('A few pages') && body.includes('Warm Clay') && body.includes('Friendly'))
  check('nothing is left as Remixer’s pick when every question was answered', !body.includes('Remixer’s pick'))
  check('the panel is gone after Submit', !(await panelUp()))
}

/* ---- the plan: Remixer's own step, and the one that gates the build ---- */
await p.waitForTimeout(2600); await shot('09-plan-card')
check('the plan is docked where the questions were', await planUp())
{
  const body = await text()
  check('the plan is compiled from the answers, not canned',
    body.includes('A site that sells') && body.includes('Four pages'),
    'title and structure should follow goal=sell, pages=few')
}
check('NOTHING is generated while the plan waits', (await previewState()) === 'closed')
check('Publish is dead while there is nothing to publish',
  await p.$eval('button:has-text("Publish")', (el) => el.disabled))
check('the questions and the plan cost nothing', (await text()).includes('2 000'))

/* Review: the chat narrows back to the split and the document takes the canvas. */
await p.click('text=Review'); await p.waitForTimeout(900); await shot('10-plan-review')
check('Review opens the canvas on the plan', (await previewState()) === 'open')
check('…with the chat back at its split width', (await asideWidth()) < 480, `aside=${Math.round(await asideWidth())}px`)
{
  const doc = await text()
  check('the document carries what the card could only start',
    doc.includes('What we’ll check before handing it back') && doc.includes('#c4553d'),
    'the checks section and the palette hexes')
  check('the plan is still awaiting approval, not building', await planUp())
}
/* ✕ hands the canvas back and returns to the card. */
await p.click('button[aria-label="Close the plan"]'); await p.waitForTimeout(700)
check('closing the plan puts the canvas away again', (await previewState()) === 'closed')
check('the plan card is still there after closing the review', await planUp())

await p.click('section[aria-label="Plan, waiting for your approval"] >> text=Approve')
await p.waitForTimeout(3400); await shot('11-ack-building')
check('Approve is what starts the build', !(await planUp()))
/* THE CANVAS STAYS AWAY FOR THE MINUTE. A preview is a preview OF a page, and there
   is no page yet; the outline card carries the wait and gets the chat's full width to
   do it in (designer, 07.09.2026). It opens by itself when that page exists. */
check('the canvas stays away while the page is being written', (await previewState()) === 'closed')

/* ---- the generation: one minute, named section by section (Figma 29480:48478) ---- */
check('the outline card lands when the build starts', await cardUp())
{
  const o = await outline()
  check('the outline names the page being built', o?.page === 'Home', JSON.stringify(o?.page))
  check('the sections come from the answers, not a fixed list',
    o?.rows.map((r) => r.name).join(' · ') === 'Layout & navigation · Hero · Product grid · Cart & checkout · Footer',
    o?.rows.map((r) => r.name).join(' · '))
  check('the pages this pass does NOT build are named and waiting',
    o?.pages.join(' · ') === 'About · Services · Contact', o?.pages.join(' · '))
  check('exactly one section is in hand', o?.rows.filter((r) => r.state === 'active').length === 1)
  check('the section in hand says what is happening to it', !!o?.rows.find((r) => r.state === 'active')?.work)
}
/*
 * THE CANVAS STAYS EMPTY FOR THE WHOLE MINUTE. This pass builds the home page and the
 * preview appears when that page is done (designer, 07.09.2026) — a site on screen at
 * second three would make the outline card a decoration over an already-finished job.
 */
check('there is no site anywhere while the page is being written', !(await siteUp()))
/* The rail's tools all act on a site, and there is none for the whole minute. */
check('the rail offers no site tools while there is no site', (await railTools()) === 0,
  `${await railTools()} up`)

await p.waitForTimeout(20000); await shot('12a-mid-build')
{
  const o = await outline()
  const done = o?.rows.filter((r) => r.state === 'done').length ?? 0
  check('sections finish as the minute runs', done >= 1 && done < 5, `${done} done after ~24s`)
  check('…and still exactly one is in hand', o?.rows.filter((r) => r.state === 'active').length === 1)
  check('the site has still not appeared', !(await siteUp()))
  check('Publish stays dead while the page is being written',
    await p.$eval('button:has-text("Publish")', (el) => el.disabled))
}

/* Out to the far side of the hardcoded minute (5 sections + the assembling beat). */
await p.waitForTimeout(45000); await shot('12-built')
{
  const body = await text()
  check('the canvas opens by itself on the page it is a preview of',
    (await previewState()) === 'open')
  check('the site appears when the page is finished', await siteUp())
  check('every section of the page is done',
    (await outline())?.rows.every((r) => r.state === 'done'), JSON.stringify((await outline())?.rows.map((r) => r.state)))
  check('the outline stays in the transcript as the record of what was built', await cardUp())
  check('the rail\u2019s site tools arrive with the site', (await railTools()) === 4,
    `${await railTools()} of 4`)
  check('the first version lands and is announced', body.includes('Done —') && body.includes('built to sell'))
  check('the acknowledgement reads as one sentence',
    body.includes('a site built to sell, across a few pages, in Warm Clay with friendly lettering'))
  check('the brief is still readable after the build', body.includes('Warm Clay') && body.includes('Friendly'))
  check('the build spends credits', body.includes('1 990'), 'toolbar balance after one build')
  check('Publish comes alive once the site exists',
    !(await p.$eval('button:has-text("Update"), button:has-text("Publish")', (el) => el.disabled)))
  /*
   * ONE DIRECTION per place, Lovable's arrangement and the designer's call (07.09.2026):
   * hiding the canvas is a control ON the canvas, and the chat header only carries the
   * arrow that brings it back — and only once there is no canvas to look at.
   */
  check('NO preview arrow anywhere in the shell while the canvas is open',
    (await p.$$('button[aria-label="Hide preview"], button[aria-label="Show preview"]')).length === 0)
  check('…and the chat header keeps its own two controls there',
    !!(await p.$('aside > header button[aria-label="Version history"]'))
      && !!(await p.$('aside > header button[aria-label="Collapse chat"]')))
}

/* Collapsing is a DRAG, not a button (designer, 07.09.2026, said twice): pulling the
   divider past the canvas minimum puts the preview away. */
{
  await dragShut()
  await shot('13-hidden')
}
check('dragging the divider past the canvas minimum collapses it', (await previewState()) === 'closed')
{
  /* With the chat filling the shell, the header pill holds ONE control — the arrow that
     brings the canvas back. "Collapse chat" would have nothing to collapse to, and
     version history would sit a thousand pixels from the thread it belongs to. */
  const pill = await p.$$eval('aside > header button[aria-label]', (els) =>
    els.map((e) => e.getAttribute('aria-label')))
  check('with the chat at full width the header offers only "bring the canvas back"',
    !pill.includes('Version history') && !pill.includes('Collapse chat') && pill.includes('Show preview'),
    pill.join(' · '))
}
{
  /* The board's 416 is the width of the message column it was drawn in, not the card's
     own size: with the canvas away the column is 800 and every other turn spans it. */
  const fits = await p.evaluate(() => {
    const card = document.querySelector('section[aria-label="What Remixer is building"]')
    /* Against the TURN LIST, not `.chat-col`: the scroller's own 16/8 gutters sit between
       them, so a card that correctly fills the content area is 24px inside the column. */
    const list = card.parentElement
    const cs = getComputedStyle(list)
    const inner = list.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
    return { card: Math.round(card.getBoundingClientRect().width), inner: Math.round(inner) }
  })
  check('the outline card fills the chat column, whatever its width',
    fits.card === fits.inner && fits.card > 700, JSON.stringify(fits))
  /* The brief summary is the same object one moment earlier — what was agreed, then what
     is being built from it — so it is the same material and the same width. */
  const sum = await p.evaluate(() => {
    const dl = document.querySelector('dl')
    const card = dl && dl.parentElement.parentElement
    return card && Math.round(card.getBoundingClientRect().width)
  })
  check('the brief summary is built to match, and matches its width',
    sum === fits.card, `summary=${sum} outline=${fits.card}`)
}
check('…and only then does the chat header offer to bring it back',
  !!(await p.$('aside > header button[aria-label="Show preview"]')))
await p.click('.chat-reopen'); await p.waitForTimeout(600); await shot('14-reopened')
check('the grip brings it back', (await previewState()) === 'open')

{
  await dragShut()
  await shot('15-dragged-shut')
  check('…and does so again from a reopened canvas', (await previewState()) === 'closed')
}

/* ========================================= B. the composer's own example builds */

await buildFromHome('Bella’s Bakery')
await shot('16-strong-prompt')
check('“Bella’s Bakery” goes straight to the build', (await previewState()) === 'closed' && !(await siteUp()))
check('no questions for a prompt with substance in it', !(await panelUp()))
/* 3.4s of thinking, then the hand-over line, then 0.9s to the card. */
await p.waitForTimeout(5200); await shot('17-strong-building')
{
  const body = await text()
  check('the line before the build names the work, not a business it cannot know',
    body.includes('Starting on your home page'))
  check('a prompt that skips the brief still gets the outline', await cardUp())
  const o = await outline()
  /*
   * No brief behind this path, so every question falls back to its FIRST option —
   * goal=enquiries, pages=few. That order is deliberate (brief.ts): with "one page"
   * first this path drew a card with nothing under Home, which is the one thing the
   * card exists to show.
   */
  check('the fallback outline still names the pages this pass does not build',
    o?.rows.map((r) => r.name).join(' · ') === 'Layout & navigation · Hero · What you offer · Enquiry form · Footer'
      && o?.pages.join(' · ') === 'About · Services · Contact',
    `${o?.rows.map((r) => r.name).join(' · ')} | pages=${o?.pages.join(' · ')}`)
  check('the canvas waits for the page here too',
    (await previewState()) === 'closed' && !(await siteUp()))
}

/* ================================================== C. a template from the dock */

await p.goto(at(), { waitUntil: 'networkidle' })
await p.waitForTimeout(700)
await p.click('button:has-text("Templates")')
await p.waitForTimeout(500)
await p.click('[aria-label="Open Marketing Campaign Hub"]')
await p.waitForTimeout(1200)
await shot('18-template-preview')
/* `Use Template` is the panel's CTA on every door; on the DOCK CARD's door it means
   build (TemplatePicker's `onRemix`), which is the path under test here. */
await p.click('button:has-text("Use Template")')
await p.waitForTimeout(1800)
await shot('19-template-building')
check('a template seeds a brief of its own, so it builds', !(await panelUp()) && !(await siteUp()))
check('the template names itself in the first message', (await text()).includes('template'))
await p.waitForTimeout(3600)
check('the template path runs the same generation', await cardUp())

/* ============================= D. the composer overrides the open question panel */

await buildFromHome('website')
await p.waitForTimeout(4600)
check('the panel is up before the override', await panelUp())
await p.fill('textarea', 'A one-page site for my ceramics studio in Odesa')
await p.keyboard.press('Enter')
await p.waitForTimeout(700); await shot('20-override')
check('typing into the composer dismisses the questions', !(await panelUp()))
/* THINKING_MS + CARD_MS before the outline lands — the same two beats every other
   first build takes, which is the point of the check. */
await p.waitForTimeout(4200)
check('…and the typed prompt is built as given', await cardUp())

/* ========================== E. the Publish panel for a site that is not live yet
 *
 * Figma 29697:36970 (designer, 08.09.2026): an unpublished site's panel is titled by
 * its STATUS, and carries a 120px nudge banner that can be waved off with its own ✕.
 * Both hang off `world.published`, never off the pending-edit count — the negative
 * checks here are the ones that matter: a published site gets neither.
 */
{
  /* A dock project opens the builder with the world as it is, so the panel's state can
     be staged from the URL instead of waiting out a real build. `v=false` is `published`. */
  const openPublish = async (q) => {
    await p.goto(at(q), { waitUntil: 'networkidle' })
    await p.waitForTimeout(800)
    await p.click('.home-card-face')
    await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 })
    await p.waitForTimeout(400)
    await p.click('header button:has-text("Publish"), header button:has-text("Update")')
    await p.waitForTimeout(600)
  }
  const panel = () => p.$('[role="dialog"][aria-label="Publish"]')
  const title = () => p.$eval('[role="dialog"][aria-label="Publish"] h3', (el) => el.textContent.trim())
  const hint = () => p.$('[role="dialog"] .pub-hint-dots')

  await openPublish('p=built&u=1&v=false&a=trial&t=22&c=640')
  await shot('21-publish-not-published')
  check('an unpublished site’s panel is titled by its status', (await title()) === 'Not published', await title())
  check('…and carries the nudge banner', !!(await hint()))
  /* the board's box: 480 panel, 468 card, 452 banner at 120 tall, ✕ inset 8 from the
     banner's top-right corner, copy held to a 324px column that breaks in two lines.
     Rims are inset shadows, not borders — a border would eat these very pixels. */
  const box = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
    const banner = d.querySelector('.pub-hint-dots').parentElement
    const card = banner.parentElement.parentElement
    const close = banner.querySelector('button')
    const para = banner.querySelectorAll('p')[1]
    const bb = banner.getBoundingClientRect(), cb = close.getBoundingClientRect()
    const w = (el) => +el.getBoundingClientRect().width.toFixed(1)
    return {
      panel: w(d), card: w(card), banner: w(banner), bannerH: +bb.height.toFixed(1),
      close: +cb.width.toFixed(1), insetRight: +(bb.right - cb.right).toFixed(1),
      insetTop: +(cb.top - bb.top).toFixed(1), gap: getComputedStyle(card).gap,
      para: w(para), lines: Math.round(para.getBoundingClientRect().height / parseFloat(getComputedStyle(para).lineHeight)),
      fill: getComputedStyle(banner).backgroundColor, radius: getComputedStyle(banner).borderRadius,
    }
  })
  check('the panel is the board’s 480 with a 468 card and a 452 × 120 banner',
    box.panel === 480 && box.card === 468 && box.banner === 452 && box.bannerH === 120, JSON.stringify(box))
  check('the ✕ is 32 at radius 10, inset 8 from the banner’s corner',
    box.close === 32 && box.insetRight === 8 && box.insetTop === 8, `${box.close} / ${box.insetRight} / ${box.insetTop}`)
  check('the copy keeps the board’s 324px column and its two lines',
    box.para === 324 && box.lines === 2, `${box.para}px / ${box.lines} lines`)
  check('the banner is gray-900 at radius 12, 8px under the card’s other child',
    box.fill === 'rgb(24, 24, 27)' && box.radius === '12px' && box.gap === '8px', JSON.stringify([box.fill, box.radius, box.gap]))
  /* the ✕ takes it down — and nothing else moves */
  const wide = box.panel
  await p.click('[role="dialog"] [aria-label="Dismiss"]')
  await p.waitForTimeout(400)
  await shot('22-publish-hint-dismissed')
  check('the ✕ takes the banner down', !(await hint()))
  check('…and the panel keeps its width doing it',
    (await p.$eval('[role="dialog"][aria-label="Publish"]', (el) => el.getBoundingClientRect().width)) === wide)
  check('the title stays the status until the site is actually live', (await title()) === 'Not published')
  /* pressing Publish is what changes the answer */
  await p.click('[role="dialog"] button:has-text("Publish")')
  await p.waitForTimeout(500)
  await shot('23-publish-done')
  check('publishing retitles the panel and leaves no nudge',
    (await title()) === 'Publish' && !(await hint()), await title())

  /* the negative: a site that has been published gets neither, banner state or not */
  await openPublish('p=built&u=3&v=true&a=trial&t=22&c=640')
  check('a published site’s panel is titled by the action', (await title()) === 'Publish', await title())
  check('…and never shows the nudge', !(await hint()))
  check('…and its topbar button says Update with the pending count',
    !!(await p.$('header button:has-text("Update")')))
  await p.keyboard.press('Escape')
  await p.waitForTimeout(400)   // it leaves on the popover's own exit, not instantly
  check('the panel closes on Escape', !(await panel()))
}

/* ============================== F. the composer's Autopilot / Build switcher
 *
 * Figma 29697:54553 (the pill 55394, the menu 55602; designer 08.09.2026). The pill is
 * 95×32, the menu 200×113 opening UPWARD with its right edge flush to the pill's and 8px
 * of air between them, rows 52 tall carrying a 40px plate. Autopilot is the default from
 * the first generation on — and the pill is not there at all before there is a site.
 */
{
  const enter = async (q) => {
    await p.goto(at(q), { waitUntil: 'networkidle' })
    await p.waitForTimeout(800)
    await p.click('.home-card-face')
    await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 })
    await p.waitForTimeout(400)
  }
  const pill = () => p.$('button[aria-label="Chat mode"]')
  const label = () => p.$eval('button[aria-label="Chat mode"]', (el) => el.textContent.trim())

  await enter('p=built&u=1&a=trial&t=22&c=640')
  check('the composer carries the mode switcher once there is a site', !!(await pill()))
  check('…and it starts on Autopilot', (await label()) === 'Autopilot', await label())
  const pb = await (await pill()).boundingBox()
  check('the pill is the board’s 95 × 32',
    Math.round(pb.width) === 95 && Math.round(pb.height) === 32, `${pb.width} × ${pb.height}`)
  await (await pill()).click()
  await p.waitForTimeout(400)
  await shot('24-mode-menu')
  const menu = await p.evaluate(() => {
    const trigger = document.querySelector('button[aria-label="Chat mode"]')
    const m = document.querySelector('[role="menu"]')
    if (!m) return null
    const items = [...m.querySelectorAll('[role="menuitemradio"]')]
    const mb = m.getBoundingClientRect(), tb = trigger.getBoundingClientRect()
    const cs = getComputedStyle(m)
    return {
      w: +mb.width.toFixed(1), h: +mb.height.toFixed(1),
      flush: +(mb.right - tb.right).toFixed(1), above: +(tb.top - mb.bottom).toFixed(1),
      rows: items.map((i) => +i.getBoundingClientRect().height.toFixed(1)),
      plate: +items[0].firstElementChild.getBoundingClientRect().height.toFixed(1),
      bg: cs.backgroundColor, radius: cs.borderRadius,
      checked: items.map((i) => i.getAttribute('aria-checked')),
      copy: items.map((i) => i.textContent.trim()),
    }
  })
  check('the menu is 200 × 113 in Gray/750 at radius 10',
    !!menu && menu.w === 200 && menu.h === 113 && menu.bg === 'rgb(51, 51, 58)' && menu.radius === '10px',
    JSON.stringify(menu && [menu.w, menu.h, menu.bg, menu.radius]))
  check('…opening UPWARD, right edges flush, 8px of air',
    !!menu && menu.flush === 0 && menu.above === 8, menu && `${menu.flush} / ${menu.above}`)
  check('…two rows of 52 carrying a 40px plate',
    !!menu && menu.rows.join() === '52,52' && menu.plate === 40, menu && `${menu.rows.join()} / ${menu.plate}`)
  check('…Autopilot ticked, and both rows say what the mode does',
    !!menu && menu.checked.join() === 'true,false' &&
      menu.copy[0].includes('Get smart suggestions') && menu.copy[1].includes('Make changes directly'),
    menu && JSON.stringify(menu.checked))
  await p.click('[role="menuitemradio"]:has-text("Build")')
  await p.waitForTimeout(400)
  check('picking a mode renames the pill and closes the menu',
    (await label()) === 'Build' && !(await p.$('[role="menu"]')), await label())
  await (await pill()).click()
  await p.waitForTimeout(300)
  await p.keyboard.press('Escape')
  await p.waitForTimeout(400)
  check('the menu closes on Escape', !(await p.$('[role="menu"]')))
  /* The negative that keeps the rule: nothing to lead, no control. It has to be the HERO
     path — opening a dock card sets `project: 'built'` on purpose (Dock.tsx: standing in a
     card means standing in that site), so it can never show the pre-generation shell. */
  await buildFromHome('website')
  await p.waitForTimeout(1200)
  check('there is no switcher before the first site exists', !(await pill()))
}

check('no page errors anywhere in the run', errors.length === 0, errors.join(' | ').slice(0, 300))
await b.close()

const failed = results.filter(([, ok]) => !ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed · screenshots in ${OUT}`)
process.exit(failed ? 1 : 0)
