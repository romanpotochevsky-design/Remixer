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
 *      Start Building. Review moves it into the canvas at full size and ✕ brings it back. Then
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
/*
 * A card's ARRIVAL, sampled every frame from the first one it exists in (motion.ts `cardIn`,
 * design-system §5 «Карточки, которые появляются»): the glass (opacity, transform), its inner
 * surface, the first and last row, the rim light (`::after`), and the card's box.
 */
const arrival = (sel, wait, ms) => p.evaluate(`((sel, wait, ms) => new Promise((resolve) => {
  const out = []; const tw = performance.now(); let t0 = 0; let seen = false
  const m = (tf) => { const a = tf.match(/matrix\\(([^)]+)\\)/); return a ? +a[1].split(',')[0] : tf === 'none' ? 1 : NaN }
  const tick = () => {
    const card = document.querySelector(sel)
    if (!card && !seen) return performance.now() - tw < wait ? requestAnimationFrame(tick) : resolve(out)
    if (!seen) { seen = true; t0 = performance.now(); out.push({ appeared: +(t0 - tw).toFixed(0) }) }
    const cs = getComputedStyle(card), body = card.firstElementChild
    const rows = card.querySelectorAll('dt, li, [class*="rounded-b-"]')
    const r = card.getBoundingClientRect()
    out.push({ t: +(performance.now() - t0).toFixed(1), op: +cs.opacity, scale: m(cs.transform), tf: cs.transform,
      body: m(getComputedStyle(body).transform), row0: rows[0] ? +getComputedStyle(rows[0]).opacity : null,
      rowN: rows.length ? +getComputedStyle(rows[rows.length - 1]).opacity : null,
      glint: +getComputedStyle(card, '::after').opacity, box: [r.left, r.top, r.width, r.height].map((n) => +n.toFixed(1)).join(',') })
    if (performance.now() - t0 < ms) requestAnimationFrame(tick); else resolve(out)
  }
  requestAnimationFrame(tick)
}))(${JSON.stringify(sel)}, ${wait}, ${ms})`)
/* the assertions every arriving card has to pass; `what` names the card in the check */
const checkArrival = (what, s) => {
  const f = s.filter((x) => x.t !== undefined)
  const first = f[0], last = f[f.length - 1]
  check(`the ${what} arrives as glass: transparent and smaller than its box in its first frame`,
    !!first && first.op < 0.1 && first.scale < 0.96, JSON.stringify(first))
  check(`…inflates with one soft overshoot past its size and settles clean`,
    Math.max(...f.map((x) => x.scale)) > 1.0003 && last.tf === 'none' && last.op === 1,
    `peak ${Math.max(...f.map((x) => x.scale)).toFixed(4)}, last ${last.tf} / ${last.op}`)
  check(`…its inner surface focusing onto it a beat behind the glass`,
    f.some((x) => x.body > 1.02 && x.scale < 0.98) && last.body === 1, `body ${f.slice(0, 12).map((x) => x.body.toFixed(3)).join(' ')}`)
  check(`…its rows coming up one after another, top to bottom`,
    f.some((x) => x.row0 > 0.8 && x.rowN < 0.2) && last.row0 === 1 && last.rowN === 1,
    `row0/rowN at 40% of the run ${JSON.stringify(f[Math.floor(f.length * 0.4)])}`)
  check(`…and a rim light that peaks and is gone`,
    Math.max(...f.map((x) => x.glint)) > 0.9 && last.glint === 0, `peak ${Math.max(...f.map((x) => x.glint)).toFixed(3)}, last ${last.glint}`)
  return { first, last, f }
}
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
/*
 * THE CARD ARRIVES LIKE GLASS (designer, 09.09.2026: "красивую и плавную анимацию появления
 * этих компонентов в чате, в стиле apple liquid glass") — motion.ts `cardIn`: the summary
 * rises out of the dock and inflates from .94 with one soft overshoot, its inner surface
 * focuses onto it a beat later from 1.035, the rows come up one after another and a rim light
 * peaks and fades. Sampled every frame from the first one the card exists in.
 */
{
  const sampling = arrival('.chat-col .card-arrive', 3000, 1400)
  await p.click('text=Submit')
  const s = await sampling
  const { last } = checkArrival('summary card', s)
  await p.waitForTimeout(300)
  const box = await p.$eval('.chat-col .card-arrive', (el) => { const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => +n.toFixed(1)).join(',') })
  check('the summary card has not moved since it settled: the settled box is the laid-out box', last && last.box === box, `${last?.box} → ${box}`)
}
await shot('08-summary')
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
  /*
   * THE PLAN CARD, PIXEL BY PIXEL — Figma 29816:21533 (designer, 09.09.2026: "изучи макет
   * максимально детально… сделай перфект пиксель как в макете"). Everything here is a
   * number read off the board, so a restyle that drifts fails loudly rather than quietly.
   */
  /* ⚠️ PARK THE POINTER FIRST. Submit was clicked where the plan card's blue button now
     is, so the button sat hovered and read `--action-hover` instead of `--action` — a probe
     bug that looked exactly like a wrong token. */
  await p.mouse.move(8, 8); await p.waitForTimeout(220)
  const g = await p.evaluate(() => {
    const px = (v) => Math.round(parseFloat(v) * 100) / 100
    const card = document.querySelector('section[aria-label="Plan, waiting for your approval"]')
    const sheet = card.querySelector('.dock-sheet')
    const head = sheet.children[0]
    const title = head.querySelector('p')
    const block = sheet.children[1]
    const inner = block.children[0]
    const fade = block.children[1]
    const foot = card.querySelector('footer.dock-foot')
    const [review, start] = [...foot.querySelectorAll('button')]
    const cs = (el) => getComputedStyle(el)
    const box = (el) => { const r = el.getBoundingClientRect(); return [r.width, r.height].map((n) => Math.round(n * 100) / 100) }
    const bs = cs(block), is = cs(inner), fs = cs(fade), ft = cs(foot)
    return {
      head: box(head)[1], headPad: [px(cs(head).paddingLeft), px(cs(head).paddingRight)],
      titleSize: px(cs(title).fontSize), titleWeight: cs(title).fontWeight,
      titleTrim: cs(title).textBoxTrim || cs(title).webkitTextBoxTrim || '',
      titleY: Math.round((title.getBoundingClientRect().top - head.getBoundingClientRect().top) * 100) / 100,
      blockH: box(block)[1], blockR: px(bs.borderTopLeftRadius), blockBg: bs.backgroundColor,
      blockRim: [bs.borderTopWidth, bs.borderTopColor].join(' '),
      pad: [px(is.paddingTop), px(is.paddingRight), px(is.paddingBottom), px(is.paddingLeft)],
      gapOuter: px(is.rowGap), gapInner: px(cs(inner.children[0]).rowGap),
      lead: [...inner.querySelectorAll('p')].slice(0, 2).map((el) => [px(cs(el).fontSize), cs(el).fontWeight, cs(el).color, px(cs(el).lineHeight)]),
      fadeTop: Math.round((fade.getBoundingClientRect().top - block.getBoundingClientRect().top) * 100) / 100,
      fadeH: box(fade)[1], fadeInk: fs.backgroundImage, fadeR: px(fs.borderBottomLeftRadius),
      foot: [px(ft.paddingTop), px(ft.paddingRight), px(ft.paddingBottom), px(ft.paddingLeft)],
      review: { box: box(review), r: px(cs(review).borderTopLeftRadius), bg: cs(review).backgroundColor,
        size: px(cs(review).fontSize), weight: cs(review).fontWeight, bloom: review.classList.contains('press-bloom'), label: review.innerText },
      start: { box: box(start), r: px(cs(start).borderTopLeftRadius), bg: cs(start).backgroundColor,
        size: px(cs(start).fontSize), weight: cs(start).fontWeight, bloom: start.classList.contains('press-bloom'), label: start.innerText },
      /* the one invariant that outranks the board: the field never moves (CLAUDE.md) */
      sameWidth: Math.abs(box(block)[0] - box(document.querySelector('.composer-field'))[0]) < 0.6,
    }
  })
  check('the plan card\u2019s header is the board\u2019s 56 with 16 either side',
    g.head === 56 && g.headPad.join(',') === '16,16', `${g.head} / ${g.headPad}`)
  check('\u2026its title is 18 semibold, trimmed to the cap band, a pixel below plain centring',
    g.titleSize === 18 && g.titleWeight === '600' && g.titleTrim.includes('trim-both') &&
      g.titleY > 22 && g.titleY < 23.6,
    `${g.titleSize}/${g.titleWeight} ${g.titleTrim} y=${g.titleY}`)
  check('\u2026the document block is 194 at radius 16, Black/600 under a 1px NA/100 rim',
    g.blockH === 194 && g.blockR === 16 && g.blockBg === 'rgba(9, 9, 11, 0.56)' &&
      g.blockRim === '1px rgba(255, 255, 255, 0.08)',
    `${g.blockH} r${g.blockR} ${g.blockBg} / ${g.blockRim}`)
  check('\u2026padded 18 / 24 / 18 / 16, with 16 between the blocks and 10 inside each',
    g.pad.join(',') === '18,24,18,16' && g.gapOuter === 16 && g.gapInner === 10,
    `${g.pad} gaps ${g.gapOuter}/${g.gapInner}`)
  check('\u2026a 15 medium white line over a 14 regular one at 64% white, both at leading 1.4',
    JSON.stringify(g.lead) === JSON.stringify([[15, '500', 'rgb(255, 255, 255)', 21], [14, '400', 'rgba(255, 255, 255, 0.64)', 19.6]]),
    JSON.stringify(g.lead))
  check('\u2026and the tail dissolves over the last 152px, from y=42, into the card\u2019s own colour',
    g.fadeTop === 42 && g.fadeH === 152 && g.fadeR === 16 &&
      /rgba\(16, 16, 18, 0\)/.test(g.fadeInk) && /rgb\(16, 16, 18\)/.test(g.fadeInk),
    `top ${g.fadeTop} h ${g.fadeH} r${g.fadeR} ${g.fadeInk}`)
  check('the plan card is one width with the composer, as the questions are', g.sameWidth)
  check('the footer is pt 12 / pb 16 / px 10',
    g.foot.join(',') === '12,10,16,10', g.foot.join(','))
  check('Review is the board\u2019s TONAL button \u2014 8% white, not an outline',
    g.review.label === 'Review' && g.review.box[1] === 32 && g.review.r === 8 &&
      g.review.bg === 'rgba(255, 255, 255, 0.08)' && g.review.size === 13 && g.review.weight === '600',
    JSON.stringify(g.review))
  check('\u2026and the blue one says Start Building, on our --action',
    g.start.label === 'Start Building' && g.start.box[1] === 32 && g.start.r === 8 &&
      g.start.bg === 'rgb(21, 135, 255)' && g.start.size === 13 && g.start.weight === '600',
    JSON.stringify(g.start))
  check('both footer buttons take the house click', g.review.bloom && g.start.bloom)
}
{
  const body = await text()
  check('the plan is compiled from the answers, not canned',
    body.includes('A site that sells') && body.includes('Four pages'),
    'title and structure should follow goal=sell, pages=few')
  /* The status line must not name a button by a label the button does not wear: the board
     renamed `Approve` to `Start Building`, so the line moved with it. */
  check('the waiting line points at the verb the card actually carries',
    body.includes('start the build when it looks right') && !body.toLowerCase().includes('approve it'))
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

{
  /* The outline card takes the same arrival — after the "Got it — …" line has written itself,
     not on the click: the beat is the card's place in the turn, not a delay for its own sake. */
  const sampling = arrival('section[aria-label="What Remixer is building"]', 8000, 1600)
  await p.click('section[aria-label="Plan, waiting for your approval"] >> text=Start Building')
  const s = await sampling
  check('the outline card lands after the acknowledgement has been written, not on the click',
    (s[0]?.appeared ?? 0) > 1500, `appeared after ${s[0]?.appeared}ms`)
  checkArrival('outline card', s)
}
await shot('11-ack-building')
check('Start Building is what starts the build', !(await planUp()))
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
/*
 * THE SEND FLASH SHOWS ABOVE THE FIELD (designer's recording, 09.09.2026: "что-то обрезает или
 * перекрывает при отправке сообщения эффект свечения над полем ввода"). The flash lives in the
 * composer, inside the dock; the thread's bottom fade is a sticky `z-10` flush with the field's
 * top edge. Once the dock isolated, the composer's own `z-20` no longer outranked that fade and
 * the light along the field's top edge painted UNDER it. The dock must outrank the fades, and a
 * real pixel above the field at the flash's pose must carry the light.
 */
{
  const fb = await p.$eval('.composer-field', (el) => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width } })
  const z = await p.evaluate(() => ({
    dock: +getComputedStyle(document.querySelector('.dock')).zIndex || 0,
    fade: Math.max(...[...document.querySelectorAll('.chat-col [class*="sticky"]')].map((e) => +getComputedStyle(e).zIndex || 0)),
  }))
  check('the dock outranks the thread’s fades, so nothing paints over the composer’s light', z.dock > z.fade, JSON.stringify(z))
  await p.keyboard.press('Enter')
  await p.waitForTimeout(230)
  const px = await pixelAt(Math.round(fb.l + fb.w * 0.72), Math.round(fb.t - 3))
  check('the flash’s light shows above the field’s top edge at its pose', Math.max(...px) - Math.min(...px) > 20, `pixel ${px.join(',')} 3px above the field`)
}
await p.waitForTimeout(470); await shot('20-override')
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
 * Figma 29816:19015 — the section that carries every state (designer, 09.09.2026: "вот тут
 * находятся все макеты для переключателя, включая выпадающий список… вот тут ты можешь
 * увидеть как выглядит ховер"). It supersedes the first pass off 29697:54553.
 *
 * The pill (29697:55394 closed / 29816:19007 open): 32 tall, 1px `Neutral Alpha/300` round
 * a padding box of pl 12 + label + gap 2 + chevron 16 + pr 6 — 91 for "Autopilot", 68 for
 * "Build" on the board's own Proxima Nova. `Black/700` under blur 16, radius 999. The
 * chevron is 16 and CENTRED, its ink 48% white, and it FLIPS when the menu opens.
 * Autopilot's label is a gradient; Build's is neutral white.
 *
 * The menu (29816:18942): 200×113, Gray/750, radius 10, px 3 / py 4, rows 194×52 whose
 * state layer FILLS THE ROW and lights `Neutral Alpha/50` on hover, the tick a 24 frame at
 * the row's x=158 / y=14 wearing Autopilot's gradient.
 *
 * ⚠️ Widths that depend on the LABEL are asserted as the board's box arithmetic, not as
 * 91: Proxima Nova is not in this repo (public), so Figtree stands in and "Autopilot"
 * measures ~2px wider. Every number the layout owns is exact; the one the font owns is
 * named as such.
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
  /*
   * THE GLASS CIRCLES BESIDE IT — the designer pasted this button's own Figma CSS
   * (09.09.2026: "у кнопок этих в стиле Apple liquid glass вот такие параметры, у тебя в
   * вёрстке они не такие"): 32×32, rgba(9,9,11,.64) under blur 16, radius 999, and a stroke
   * that is a LINEAR gradient top-left → bottom-right with stops 24 % → 4 % → 20 % white.
   * The box, fill, blur and radius were already right; the rim was the shell's own
   * (150°, 20 → 9 → 7 → 16) and read dimmer on the wrong axis.
   */
  {
    const circles = await p.evaluate(() => ['button[aria-label="Attach"]', 'button[aria-label="Voice input"]'].map((sel) => {
      const el = document.querySelector(sel), cs = getComputedStyle(el), bs = getComputedStyle(el, '::before')
      const b = el.getBoundingClientRect()
      return { box: `${b.width}×${b.height}`, fill: cs.backgroundColor, blur: cs.backdropFilter, radius: cs.borderRadius, rim: bs.backgroundImage, pad: bs.padding }
    }))
    check('the composer’s glass circles are 32 × 32 in Black/700 under blur 16, fully round',
      circles.every((c) => c.box === '32×32' && c.fill === 'rgba(9, 9, 11, 0.64)' && c.blur === 'blur(16px)' && c.radius === '9999px'),
      JSON.stringify(circles[0]))
    check('…and their 1px rim is the board’s 24 → 4 → 20 % white, top-left to bottom-right',
      circles.every((c) => c.pad === '1px' && c.rim === 'linear-gradient(to right bottom, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.04) 50%, rgba(255, 255, 255, 0.2))'),
      circles[0].rim)
  }
  /*
   * THE HOUSE GESTURE ON THE WHOLE ROW (designer, 09.09.2026: "нужно добавить ховер на кнопки
   * эти и эффект клика который мы используем везде в стиле гугл"). design-system §5
   * «Интерактивные состояния Liquid Glass»: hover is an 8 % white wash on a composited
   * `::after`, press is a bloom that opens FROM THE CLICK POINT, clipped to the control's own
   * rounded box, and leaves nothing in the DOM. The glass members take both
   * (`glass-interactive`); the send button, which owns its own hover and pressed paint, takes
   * the bloom alone (`press-bloom`) — the split ui/ripple.ts calls "TWO HOSTS, ONE BLOOM".
   */
  {
    const glass = ['button[aria-label="Chat mode"]', 'button[aria-label="Attach"]', 'button[aria-label="Voice input"]']
    const rest = await p.evaluate((sels) => sels.map((s) => getComputedStyle(document.querySelector(s), '::after').opacity), glass)
    check('the row’s glass controls carry no wash at rest', rest.every((o) => o === '0'), JSON.stringify(rest))
    const washed = []
    for (const sel of glass) {
      await p.hover(sel)
      await p.waitForTimeout(200)
      washed.push(await p.$eval(sel, (el) => { const a = getComputedStyle(el, '::after'); return `${a.opacity}/${a.backgroundColor}` }))
    }
    check('…and each lights the house 8 % wash on hover',
      washed.every((w) => w === '1/rgba(255, 255, 255, 0.08)'), JSON.stringify(washed))
    /* the bloom, pressed deliberately off-centre so its position can be read */
    const pressed = async (sel) => {
      const b = await p.$eval(sel, (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })
      await p.mouse.move(b.x + b.w * 0.25, b.y + b.h * 0.7)
      await p.mouse.down()
      await p.waitForTimeout(120)
      const r = await p.$eval(sel, (el) => {
        const layer = el.querySelector(':scope > .glass-ripples'), rip = layer && layer.firstElementChild
        if (!rip) return null
        const rb = rip.getBoundingClientRect(), eb = el.getBoundingClientRect()
        return { clip: getComputedStyle(layer).overflow, radius: getComputedStyle(layer).borderRadius,
          paint: getComputedStyle(rip).backgroundImage.startsWith('radial-gradient'),
          cx: +((rb.x + rb.width / 2 - eb.x) / eb.width).toFixed(2), cy: +((rb.y + rb.height / 2 - eb.y) / eb.height).toFixed(2) }
      })
      await p.mouse.up()
      await p.waitForTimeout(400)
      const left = await p.$eval(sel, (el) => el.querySelectorAll(':scope > .glass-ripples > *').length)
      return { ...r, left }
    }
    const onPill = await pressed('button[aria-label="Chat mode"]')
    check('a press blooms FROM the click point, clipped to the control’s own rounded box',
      !!onPill && onPill.paint && onPill.clip === 'hidden' && onPill.radius === '9999px'
        && onPill.cx === 0.25 && onPill.cy === 0.7, JSON.stringify(onPill))
    check('…and the gesture leaves nothing behind in the DOM', onPill && onPill.left === 0, `${onPill?.left} ripples`)
    /* the send button is the solid member: disabled until armed, then the bloom alone */
    check('the send button is not bloomed while it is disabled',
      (await pressed('button[aria-label="Send"]')).cx === undefined, 'disabled → no ripple')
    await p.fill('textarea[aria-label="Message Remixer"]', 'Make the hero warmer')
    await p.waitForTimeout(150)
    const onSend = await pressed('button[aria-label="Send"]')
    check('…and takes the bloom once it is armed', !!onSend && onSend.paint && onSend.left === 0, JSON.stringify(onSend))
    await p.fill('textarea[aria-label="Message Remixer"]', '')
    await p.mouse.move(4, 4)
    await p.waitForTimeout(200)
  }
  check('the composer carries the mode switcher once there is a site', !!(await pill()))
  check('…and it starts on Autopilot', (await label()) === 'Autopilot', await label())
  /* the pill, part by part — everything except the label's own run of glyphs */
  const pillGeo = () => p.$eval('button[aria-label="Chat mode"]', (el) => {
    const box = el.getBoundingClientRect()
    const rel = (e) => { const b = e.getBoundingClientRect(); return { x: +(b.x - box.x).toFixed(2), y: +(b.y - box.y).toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2) } }
    const cs = getComputedStyle(el)
    /* the pill's two OWN spans, by index. Not `querySelector('span:last-of-type')` (it finds
       the INK span nested inside the label first) and not `lastElementChild` (after a press
       the ripple engine's `.glass-ripples` layer is the last child). */
    const lab = el.firstElementChild, chev = el.querySelector(':scope > span:nth-of-type(2)')
    const ls = getComputedStyle(lab.querySelector('.mode-ink') || lab)
    return {
      h: +box.height.toFixed(2), w: +box.width.toFixed(2), radius: cs.borderRadius, fill: cs.backgroundColor,
      blur: cs.backdropFilter, border: cs.borderTopWidth,
      rim: getComputedStyle(el, '::before').backgroundImage, rimPad: getComputedStyle(el, '::before').padding,
      rimZ: getComputedStyle(el, '::before').zIndex,
      pl: cs.paddingLeft, pr: cs.paddingRight, gap: cs.columnGap,
      label: rel(lab), chev: rel(chev), tf: getComputedStyle(chev).transform,
      glyph: chev.querySelector('svg')?.getAttribute('width'), chevInk: getComputedStyle(chev.querySelector('svg')).stroke,
      ink: ls.color, grad: ls.backgroundImage, clip: ls.webkitBackgroundClip || ls.backgroundClip,
    }
  })
  {
    const g = await pillGeo()
    check('the pill is the board’s box: 32 tall, radius 999, Black/700 under blur 16',
      g.h === 32 && g.radius === '9999px' && g.fill === 'rgba(9, 9, 11, 0.64)' && g.blur === 'blur(16px)',
      JSON.stringify([g.h, g.radius, g.fill, g.blur]))
    /*
     * ⚠️ ITS RIM IS GLASS, not a flat 24 % stroke (designer, 09.09.2026: "на кнопке нет
     * эффекта стекла на бордере, сделай как в макете"). The export flattens a gradient stroke
     * to `border-solid` bound to its first stop's variable — the tell was the unexplained
     * `Neutral Alpha/50` (4 %) sitting in the same variable list, this gradient's middle stop.
     * The rim is therefore the masked `::before` ring the glass family uses, which takes NO
     * layout box — so the padding carries the board's inside-stroke pixel instead: 13 + label
     * + 2 + 16 + 7 = the same 91, and the label still starts at x=13.
     */
    check('…and that rim is the glass 24 → 4 → 20 %, a 1px masked ring ABOVE the wash and the bloom',
      g.border === '0px' && g.rimPad === '1px' && g.rimZ === '1'
        && g.rim === 'linear-gradient(to right bottom, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.04) 50%, rgba(255, 255, 255, 0.2))',
      `${g.border} border, rim ${g.rim}`)
    check('…pl 13 / gap 2 / pr 7 (the rim takes no box), and its width is exactly that round the label',
      g.pl === '13px' && g.pr === '7px' && g.gap === '2px'
        && Math.abs(g.w - (13 + g.label.w + 2 + 16 + 7)) < 0.05,
      `${g.w} = 13+${g.label.w}+2+16+7 (the board’s 91 on Proxima Nova)`)
    /*
     * The label's box is its CAP BAND — the board's 53×9 for 13px, and the reason the
     * glyphs sit on the pill's centre line instead of a line box's.
     *
     * ⚠️ AND ONE PIXEL BELOW IT, on the designer's eye (09.09.2026: "текст в кнопке явно
     * выше визуально, не отцентрирован по высоте"). Cap-band centring is what the board
     * draws and what every measurement here agrees with; a lowercase word read against a
     * pill still looks high there, because the eye weighs the x-height mass. Filmed as a
     * ladder (scratchpad/mode/ladder-sheet.png) and 1px down is the frame that reads
     * centred. So the assertion is 17, not 16 — the one number to turn if he wants more.
     */
    check('…the label’s box is the cap band, a pixel below the pill’s middle by eye',
      Math.abs(g.label.h - 9) < 0.3 && Math.abs(g.label.y + g.label.h / 2 - 17) < 0.4,
      `cap ${g.label.h} at y ${g.label.y}`)
    check('…the chevron is 16 and centred, its ink 48% white',
      g.glyph === '16' && g.chev.w === 16 && g.chev.h === 16 && g.chev.y === 8
        && g.chevInk === 'rgba(255, 255, 255, 0.48)',
      JSON.stringify([g.glyph, g.chev, g.chevInk]))
    /* AUTOPILOT'S INK IS THE GRADIENT (designer, 09.09.2026) — clipped to the text, at the
       board's 99.64° between its two stops. */
    check('…and Autopilot’s label is the gradient, not white',
      g.ink === 'rgba(0, 0, 0, 0)' && g.clip === 'text'
        && g.grad.includes('99.64deg') && g.grad.includes('rgb(188, 166, 239)') && g.grad.includes('rgb(171, 179, 250)'),
      `${g.ink} / ${g.clip} / ${g.grad.slice(0, 64)}`)
    const lb = await p.$eval('button[aria-label="Chat mode"] span:first-of-type', (el) => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } })
    const px = await pixelAt(Math.round(lb.x + 2), Math.round(lb.y + lb.h / 2))
    check('…and it really paints: a glyph pixel carries the gradient’s lavender',
      px[2] > 150 && px[2] - px[1] > 25, `pixel ${px.join(',')} in the first glyph`)
    /*
     * ⚠️ THE REGRESSION THIS ONE EXISTS FOR (designer, 09.09.2026: "что это за фигня?" over
     * a sliced "Autopilot"). A background never paints outside its element's border box, and
     * `background-clip: text` narrows it to the glyphs — so the gradient on the label's
     * TRIMMED box was cut to the cap band: 9.09px where the glyphs need 15, with the
     * ascenders and the p's descender unpainted. It rendered whole on this software
     * rasteriser and sliced on his GPU, so the assertion is the BOX, not a pixel: the inked
     * element's paint area must contain every glyph of the word, with room to spare.
     */
    const ink = await p.$eval('button[aria-label="Chat mode"] .mode-ink', (el) => {
      const tn = el.firstChild
      let top = Infinity, bot = -Infinity
      for (let i = 0; i < tn.data.length; i++) {
        const r = document.createRange(); r.setStart(tn, i); r.setEnd(tn, i + 1)
        const b = r.getBoundingClientRect(); top = Math.min(top, b.top); bot = Math.max(bot, b.bottom)
      }
      const b = el.getBoundingClientRect()
      return { top: +b.top.toFixed(2), bottom: +b.bottom.toFixed(2), glyphTop: +top.toFixed(2), glyphBottom: +bot.toFixed(2) }
    })
    check('…on a paint box that contains every glyph, so no ascender or descender is shaved',
      ink.top <= ink.glyphTop - 2 && ink.bottom >= ink.glyphBottom + 2,
      `ink ${ink.top}…${ink.bottom} vs glyphs ${ink.glyphTop}…${ink.glyphBottom}`)
  }
  await (await pill()).click()
  await p.waitForTimeout(400)
  await shot('24-mode-menu')
  check('the chevron flips when the menu opens (29816:19007), rather than swapping glyph',
    (await pillGeo()).tf === 'matrix(1, 0, 0, -1, 0, 0)', (await pillGeo()).tf)
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
      rowW: +items[0].getBoundingClientRect().width.toFixed(1),
      pad: `${cs.paddingLeft}/${cs.paddingTop}`,
      plate: (() => { const b = items[0].firstElementChild.getBoundingClientRect(); const ps = getComputedStyle(items[0].firstElementChild)
        return { w: +b.width.toFixed(1), h: +b.height.toFixed(1), radius: ps.borderRadius, pad: ps.paddingLeft, gap: ps.columnGap } })(),
      /* the plate holds a content COLUMN, and the two lines are its children — reaching
         for `span > span` picks the column itself, whose font is the composer's 16/24 */
      title: (() => { const col = items[0].firstElementChild.firstElementChild
        const ts = getComputedStyle(col.firstElementChild); return `${ts.fontSize}/${ts.lineHeight} ${ts.color}` })(),
      detail: (() => { const col = items[0].firstElementChild.firstElementChild
        const ds = getComputedStyle(col.lastElementChild); return `${ds.fontSize}/${ds.lineHeight} ${ds.color}` })(),
      /* the content column: 41 tall (22 + 2 + 17) centred in the 52 row — board y 5.5 */
      col: (() => { const col = items[0].firstElementChild.firstElementChild
        const b = col.getBoundingClientRect(), rb = items[0].firstElementChild.getBoundingClientRect()
        return { y: +(b.y - rb.y).toFixed(1), h: +b.height.toFixed(1) } })(),
      tick: (() => { const g = m.querySelector('.mode-check'); if (!g) return null
        const b = g.parentElement.getBoundingClientRect(), rb = items[0].firstElementChild.getBoundingClientRect()
        return { x: +(b.x - rb.x).toFixed(1), y: +(b.y - rb.y).toFixed(1), w: +b.width.toFixed(1), glyph: g.getAttribute('width'), stroke: getComputedStyle(g).stroke } })(),
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
  check('…px 3 / py 4, so the rows are the board’s 194 × 52',
    !!menu && menu.pad === '3px/4px' && menu.rows.join() === '52,52' && menu.rowW === 194,
    menu && `${menu.pad} · ${menu.rowW} × ${menu.rows.join()}`)
  /* 29816:18945 — the state layer is flex-1 in the row, so the plate IS the row (194×52 at
     radius 8), not the 40px inset plate the first board was read as giving it. */
  check('…and each row’s plate fills it: 194 × 52 at radius 8, px 12, gap 12',
    !!menu && menu.plate.w === 194 && menu.plate.h === 52 && menu.plate.radius === '8px'
      && menu.plate.pad === '12px' && menu.plate.gap === '12px', JSON.stringify(menu && menu.plate))
  check('…the row’s title is 14/22 white over a 12/1.4 line at 56%, the pair centred in the 52',
    !!menu && menu.title === '14px/22px rgb(255, 255, 255)' && menu.detail === '12px/16.8px rgba(255, 255, 255, 0.56)'
      && Math.abs(menu.col.h - 41) < 0.4 && Math.abs(menu.col.y - 5.5) < 0.4,
    menu && `${menu.title} · ${menu.detail} · column ${menu.col.h} at y ${menu.col.y}`)
  /* THE TICK (29816:18951): a 24 frame at the row's x=158 / y=14, wearing Autopilot's
     gradient rather than `--action` blue — the board binds it to no variable, which is what
     a raw gradient paint looks like in the export, and the designer asked for it by name. */
  check('…the tick is the board’s 24 frame at x 158 / y 14, inked with the gradient',
    !!menu?.tick && menu.tick.x === 158 && menu.tick.y === 14 && menu.tick.w === 24
      && menu.tick.glyph === '24' && menu.tick.stroke.includes('chat-mode-ink'), JSON.stringify(menu?.tick))
  {
    /* …and it PAINTS: a `url()` stroke whose paint server does not resolve renders nothing
       at all, so read real pixels along the tick's long arm (the 24 glyph runs from its
       elbow at 9.5,17 up to 19,7.5). */
    const tb = await p.$eval('.mode-check', (el) => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y } })
    const arm = [[12, 14.5], [14, 12.5], [16, 10.5]]
    const px = []
    for (const [dx, dy] of arm) px.push(await pixelAt(Math.round(tb.x + dx), Math.round(tb.y + dy)))
    const lav = px.filter((c) => c[2] > 140 && c[2] - c[1] > 20)
    check('…and the paint server resolves, so the tick really carries the lavender',
      lav.length > 0, px.map((c) => c.join(',')).join(' · '))
  }
  check('…Autopilot ticked, and both rows say what the mode does',
    !!menu && menu.checked.join() === 'true,false' &&
      menu.copy[0].includes('Get smart suggestions') && menu.copy[1].includes('Make changes directly'),
    menu && JSON.stringify(menu.checked))
  /* THE HOVER THE DESIGNER DREW (29816:18942): `Neutral Alpha/50` over the whole row. */
  await p.hover('[role="menuitemradio"]:nth-of-type(2)')
  await p.waitForTimeout(260)
  {
    const h = await p.$eval('[role="menuitemradio"]:nth-of-type(2) > span', (el) => {
      const cs = getComputedStyle(el), b = el.getBoundingClientRect()
      return { bg: cs.backgroundColor, w: +b.width.toFixed(1), h: +b.height.toFixed(1) }
    })
    check('a hovered row lights 4% white across the whole 194 × 52, not an inset plate',
      h.bg === 'rgba(255, 255, 255, 0.04)' && h.w === 194 && h.h === 52, JSON.stringify(h))
  }
  {
    /* THE HOUSE CLICK, ON THESE ROWS TOO (designer, 09.09.2026: "на кнопки в этом меню тоже
       эффект клика добавь такой же") — `press-bloom` alone, since the row's hover paint is
       the board's own plate. Pressed and held so the bloom is still on screen when read. */
    const row = await p.$('[role="menuitemradio"]:nth-of-type(2)')
    const rb = await row.boundingBox()
    await p.mouse.move(rb.x + 30, rb.y + rb.height / 2)
    await p.mouse.down()
    /*
     * ⚠️ SAMPLED UNTIL IT MOVES, not read once. The bloom is a Web Animations pair with
     * `fill: forwards`, so before the first frame after the press it computes as its FROM
     * keyframe — scale(0) at opacity 0, indistinguishable from "no bloom". A single read
     * 120ms in failed for exactly that reason on this software rasteriser, on a gesture
     * that a direct probe showed working. Growth over frames is also the better assertion:
     * it proves the bloom expands rather than that one frame happened to be lit.
     */
    const bloom = await p.evaluate(() => new Promise((resolve) => {
      const t0 = performance.now()
      const sc = (tf) => { const m = tf.match(/matrix\(([^)]+)\)/); return m ? +m[1].split(',')[0] : tf === 'none' ? 1 : NaN }
      const out = []
      const tick = () => {
        const r = document.querySelector('[role="menuitemradio"]:nth-of-type(2) .glass-ripples .glass-ripple')
        if (r) { const cs = getComputedStyle(r); out.push({ op: +cs.opacity, s: +sc(cs.transform).toFixed(3), ink: cs.backgroundImage.slice(0, 24) }) }
        if (performance.now() - t0 < 420) requestAnimationFrame(tick)
        else resolve({ n: out.length, first: out[0] ?? null, peak: out.length ? Math.max(...out.map((x) => x.s)) : 0,
          op: out.length ? Math.max(...out.map((x) => x.op)) : 0, ink: out[0]?.ink ?? '' })
      }
      requestAnimationFrame(tick)
    }))
    /* Released OFF the row: up on the row is a click, which picks that mode and unmounts
       the menu — the reason the next step's click found a detaching element. */
    await p.mouse.move(8, 8); await p.mouse.up()
    await p.waitForTimeout(200)
    check('a pressed row blooms from the click point, like every other button in the product',
      bloom.peak > 0.25 && bloom.op > 0.5 && bloom.ink.startsWith('radial-gradient'),
      JSON.stringify(bloom))
    check('…and the menu is still open, because the bloom is not a selection',
      !!(await p.$('[role="menu"]')))
  }
  await shot('24-mode-hover')
  await p.click('[role="menuitemradio"]:has-text("Build")')
  await p.waitForTimeout(400)
  check('picking a mode renames the pill and closes the menu',
    (await label()) === 'Build' && !(await p.$('[role="menu"]')), await label())
  {
    /* 29816:19011 — Build's pill is the same box round a shorter word (68 on the board's
       font), and its label is NEUTRAL: the gradient belongs to Autopilot alone. */
    const g = await pillGeo()
    check('Build’s pill is the same box round its own label, and its label is not the gradient',
      Math.abs(g.w - (1 + 12 + g.label.w + 2 + 16 + 6 + 1)) < 0.05 && g.grad === 'none'
        && g.ink === 'rgba(255, 255, 255, 0.95)' && g.chevInk === 'rgba(255, 255, 255, 0.48)',
      `${g.w} wide (board 68), ink ${g.ink}`)
  }
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
