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
    const rows = card.querySelectorAll('.card-row').length ? card.querySelectorAll('.card-row') : card.querySelectorAll('dt, li, [class*="rounded-b-"]')
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
      /* the active row's ring reads the SATURATED twin of the row's hue (`--sh-arc`), not the
         text's pastel (designer, 16.09.2026) — read as a colour equality, so a retoken cannot
         quietly break the pairing */
      ringArc: (() => {
        const row = c.querySelector('.shimmer-hue')
        const ring = row?.querySelector('span.flex-none')
        if (!row || !ring) return null
        const cs = getComputedStyle(row)
        return getComputedStyle(ring).color === cs.getPropertyValue('--sh-arc').trim() && cs.getPropertyValue('--sh-arc').trim() !== cs.getPropertyValue('--sh-hue').trim()
      })(),
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

/*
 * THE LINE GETS READ BEFORE THE PANEL LANDS ON IT (designer, 09.09.2026: "пользователь не
 * успеет прочитать этот текст… нужно добавить небольшую паузу перед появлением формы"). A
 * docked form takes the thread to half, and the two used to land in the same commit — so the
 * one sentence explaining why nothing is being built was dimmed while it was still writing
 * itself. The pause is the reveal's own length plus the reading; this measures the whole gap
 * from the line landing to the thread going down.
 */
{
  const gap = await p.evaluate(() => new Promise((done) => {
    let t0 = 0
    const tick = () => {
      const lit = [...document.querySelectorAll('aside .arrive-msg')]
        .some((e) => e.innerText.includes('a guess costs you a build'))
      if (lit && !t0) t0 = performance.now()
      if (t0 && document.querySelector('aside .chat-dim--on')) return done(Math.round(performance.now() - t0))
      if (performance.now() - (t0 || performance.now()) < 12000) requestAnimationFrame(tick)
      else done(null)
    }
    requestAnimationFrame(tick)
  }))
  check('the line asking for direction is read before the form dims it', gap !== null && gap > 2500,
    `${gap}ms between the line landing and the thread stepping back`)
}
await p.waitForTimeout(1200)
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
 * ──────────────────────────────────────────── THE BRIEF OPENS ON A QUESTION WITH NO ANSWERS
 *
 * Figma 30594:24360 / 30594:24778 (designer, 18.09.2026: «первым делом мы должны узнать что
 * вообще он хочет… тут нет выбора, тут только поле для ввода текста»). The card holds ONE
 * `List item` of 72 whose only child is the input, full width, no radio; the question block
 * above it and the footer below it stand on the glass as they always have.
 *
 * The board's own arithmetic closes twice at 15, not at the 16 it prints — Figma measures
 * that padding from a frame edge that already contains the card's 1px stroke. So the row is
 * 1 + 15 + 40 + 15 + 1 = 72 and the input is 770 − 2 − 30 = 738 of its 770 card. Both are
 * checked, because getting one right with the other wrong is exactly what a `p-4` would do.
 */
{
  const q1 = await p.evaluate(() => {
    const sec = document.querySelector('section[aria-label="Questions before building"]')
    const cs = getComputedStyle
    const bx = (el) => { const r = el.getBoundingClientRect(); return { w: +r.width.toFixed(2), h: +r.height.toFixed(2), x: +r.x.toFixed(2), y: +r.y.toFixed(2) } }
    const card = [...sec.querySelectorAll('div')].find((e) => /rgba\(9, 9, 11, 0\.56\)/.test(cs(e).backgroundColor))
    const input = sec.querySelector('input')
    const row = input.parentElement
    const qp = [...sec.querySelectorAll('p')].find((e) => e.innerText.trim().length > 20)
    const back = sec.querySelector('button[aria-label="Previous question"]')
    return {
      rows: sec.querySelectorAll('.brief-opt').length,
      radios: sec.querySelectorAll('.brief-radio-off').length + sec.querySelectorAll('[aria-hidden].rounded-full').length,
      card: { ...bx(card), r: cs(card).borderRadius, bg: cs(card).backgroundColor, rim: cs(card).borderColor },
      row: { ...bx(row), pad: cs(row).padding },
      field: { ...bx(input), r: cs(input).borderRadius, rim: cs(input).borderColor, bg: cs(input).backgroundColor, pl: cs(input).paddingLeft, pr: cs(input).paddingRight, size: cs(input).fontSize, ph: input.placeholder },
      question: { text: qp.innerText.trim(), size: cs(qp).fontSize, weight: cs(qp).fontWeight, lh: cs(qp).lineHeight, colour: cs(qp).color },
      back: back ? { disabled: back.disabled, op: +(+cs(back).opacity).toFixed(2) } : null,
      focused: document.activeElement === input,
      cardKids: card.children.length,
    }
  })
  check('the brief opens on the question that asks what kind of site this is',
    /^What kind of website do you want to build\?/.test(q1.question.text), q1.question.text?.slice(0, 60))
  check('…and it offers nothing to pick: no rows, no radio, one child in the card',
    q1.rows === 0 && q1.radios === 0 && q1.cardKids === 1,
    `${q1.rows} rows / ${q1.radios} radios / ${q1.cardKids} children`)
  /* The card is the board's 72; the row inside it is 70, because the 1px the card spends on
     its CSS border is the 1px Figma drew inside the row's own frame. 15 + 40 + 15 = 70, and
     the two borders put it back: that is the whole correction, checked from both ends. */
  check('…the answers card is the board’s 72: 1 + 15 + 40 + 15 + 1',
    q1.card.h === 72 && q1.row.h === 70 && q1.row.pad === '15px',
    `card ${q1.card.h} / row ${q1.row.h} pad ${q1.row.pad}`)
  check('…the field is the row’s full width at the board’s 40 tall',
    q1.field.h === 40 && +(q1.card.w - q1.field.w).toFixed(2) === 32,
    `field ${q1.field.w}×${q1.field.h} in a ${q1.card.w} card`)
  /* ⚠️ THE RIM IS READ AFTER A BLUR AND A BEAT, not in the same turn as everything else. The
     field takes focus by itself on this question, so `focus:border-[var(--action)]` owns the
     colour — and blurring alone is not enough: `FIELD` carries `transition-colors`, so a
     computed read in the same task returns the value the transition STARTED from, which is the
     blue. Same shape as the reduced-motion trap CLAUDE.md records: write the style, read it back
     synchronously, get the old number. Let the transition land, then look. */
  await p.$eval('section[aria-label="Questions before building"] input', (el) => el.blur())
  await p.waitForTimeout(400)
  const restingRim = await p.$eval('section[aria-label="Questions before building"] input', (el) => getComputedStyle(el).borderColor)
  check('…wearing the drawn rim, fill, radius and insets',
    q1.field.r === '8px' && restingRim === 'rgba(255, 255, 255, 0.12)' && q1.field.bg === 'rgba(9, 9, 11, 0.16)'
      && q1.field.pl === '16px' && q1.field.pr === '8px' && q1.field.size === '14px',
    `${restingRim} | ${JSON.stringify(q1.field)}`)
  check('…and prompting for the answer rather than for one of the options',
    q1.field.ph === 'Your answer…', q1.field.ph)
  check('the question keeps the board’s 16 semibold on 1.4, white',
    q1.question.size === '16px' && q1.question.weight === '600' && q1.question.lh === '22.4px'
      && q1.question.colour === 'rgb(255, 255, 255)', JSON.stringify(q1.question))
  check('there is nowhere to page back to from the first question',
    q1.back?.disabled === true && q1.back?.op === 0.25, JSON.stringify(q1.back))
  check('the field has taken focus, so the customer can just type', q1.focused)
}

/*
 * ⚠️ AND IT CAN HOLD A SPACE. `asOther` trimmed on every keystroke while the input was
 * controlled by the trimmed store value, so an inner space never survived the round trip:
 * typing "personal portfolio" left "personalportfolio" (measured on the live build,
 * 18.09.2026). Harmless while free text was an escape hatch beside picks; fatal as the only
 * way to answer a question whose own examples are all two words long.
 */
await p.click('section[aria-label="Questions before building"] input')
await p.type('section[aria-label="Questions before building"] input', 'a corner bakery', { delay: 25 })
check('the free-text field keeps the spaces it is typed',
  (await p.$eval('section[aria-label="Questions before building"] input', (e) => e.value)) === 'a corner bakery',
  await p.$eval('section[aria-label="Questions before building"] input', (e) => JSON.stringify(e.value)))

/*
 * Enter advances from the field — the only question where the keyboard is the whole control,
 * so it is the only one where "type and press Enter" has to work without reaching for a
 * button. Then back, to prove the typed answer survives paging the way a picked one does.
 */
/*
 * ⚠️ AND THIS IS NOW THE BIGGEST MORPH IN THE FLOW — film it. The text-only sheet is the
 * shortest the dock ever holds (~216 against `goal`'s ~438), so `site → goal` is a larger
 * jump than the `pages → colours` shrink the sampler further down was written for, in the
 * other direction. The piston's overhang has to cover it: whatever it does not cover is
 * ground, and it shows as the black gap under the answers that the 320px overhang was sized
 * to kill (`.dock-piston`, CLAUDE.md «СВЕС ПОРШНЯ ЗА ШОВ — 320, НЕ 48»).
 */
await p.evaluate(() => {
  const out = (window.__grow = [])
  const t0 = performance.now()
  const tick = () => {
    const piston = document.querySelector('.dock-piston'), base = document.querySelector('.dock-base')
    if (piston && base) out.push({ gap: +(base.getBoundingClientRect().top - piston.getBoundingClientRect().bottom).toFixed(1) })
    if (performance.now() - t0 < 1200) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})
await p.keyboard.press('Enter'); await p.waitForTimeout(1400)
{
  const f = await p.evaluate(() => window.__grow || [])
  const worst = Math.max(...f.map((x) => x.gap))
  check('the piston covers the flow’s largest morph too — no ground under the panel as it grows',
    f.length > 10 && worst <= 0, `worst gap ${worst}px over ${f.length} frames`)
}
check('Enter from the field pages forward',
  /^What should this site do for you\?/.test(await p.$eval('section p', (e) => e.innerText.trim())),
  await p.$eval('section p', (e) => e.innerText.trim().slice(0, 40)))
await p.click('button[aria-label="Previous question"]'); await p.waitForTimeout(600)
check('…and paging back keeps a typed answer, as it keeps a picked one',
  (await p.$eval('section[aria-label="Questions before building"] input', (e) => e.value)) === 'a corner bakery',
  await p.$eval('section[aria-label="Questions before building"] input', (e) => JSON.stringify(e.value)))

/* On to `goal`, which is where every row check below has always run. */
await p.click('text=Next'); await p.waitForTimeout(500); await shot('03b-question-2')

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
    /* The gradient of the moment: the corner's first dashes against the ANTIPODE — derived
       from the dash count, never a literal index. It was `slice(30, 34)`, which was p ≈ .5
       while there were 64 dashes and quietly became p ≈ .33 when there were 96. */
    corner: +mean(segs.slice(0, 4)).toFixed(3),
    far: +mean(segs.slice(Math.round(segs.length / 2) - 2, Math.round(segs.length / 2) + 2)).toFixed(3),
    /* The largest RISE walking from the ignition corner to the antipode. The ring is a
       gradient falling away from where it lit, so this is ~0; a travelling strip, or a
       schedule with a seam in it, would show a step here. */
    climb: +Math.max(0, ...segs.slice(0, Math.round(segs.length / 2)).map((v, i, a) => (i ? v - a[i - 1] : 0))).toFixed(3),
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
  /*
   * …AND ON EVERY PICKABLE (designer, 09.09.2026: "может добавить эффект клика и на эти
   * кнопки? я про тот эффект клика который мы на кнопках используем (в стиле гугл)"). One
   * class on the shared `Pick` reaches the answer row, the colour plate, the lettering card
   * and the satisfaction card's cells at once. It has to clip to the ROW's rounded box, not
   * a square: `.brief-pick` already carries `--ring-r` as its own radius, and this is the
   * check that says the bloom found it.
   */
  const bb = await (await p.$('.brief-opt')).boundingBox()
  await p.mouse.move(bb.x + bb.width * 0.3, bb.y + bb.height * 0.5)
  await p.mouse.down()
  await p.waitForTimeout(120)
  const bloom = await p.$eval('.brief-opt', (el) => {
    const layer = el.querySelector(':scope > .glass-ripples')
    const rip = layer?.querySelector('.glass-ripple')
    const b = el.getBoundingClientRect(), r = rip?.getBoundingClientRect()
    return {
      radius: getComputedStyle(layer ?? el).borderTopLeftRadius,
      clipped: layer ? getComputedStyle(layer).overflow : null,
      from: r ? +((r.left + r.width / 2 - b.left) / b.width).toFixed(2) : null,
      op: rip ? +getComputedStyle(rip).opacity : 0,
    }
  })
  /* Released off the row: a pointerup on it is a click, and that would answer the question. */
  /* 500, not 260: the fade out is 200ms but it may not START before MIN_HOLD (180ms after
     the press), and the press here was only held 120 — so the earliest it can be gone is
     380ms after the release. 260 caught it mid-fade. */
  await p.mouse.move(10, 10); await p.mouse.up(); await p.waitForTimeout(500)
  check('an answer row blooms from the press, clipped to the ring’s own radius',
    bloom.op > 0 && bloom.clipped === 'hidden' && bloom.radius === '16px'
      && Math.abs(bloom.from - 0.3) < 0.08, JSON.stringify(bloom))
  check('…and leaves nothing behind once the pointer is up',
    (await p.$$('.brief-opt .glass-ripple')).length === 0)
}
{
  const before = await rowBoxes()
/* The recommendation lives on `pages`, one step in — so step there to look at it. */
await p.click('.dock-foot button:has-text("Next")')
await p.waitForTimeout(800)
/* ⚠️ RECOMMENDED — one option in a question can wear Remixer's own suggestion (designer,
   11.09.2026). It is the plate the plan already carries as "Remixer's pick", one moment
   earlier: there it says "you left this to me", here "take this one". `pages` is the only
   question in the brief that carries it, and not as a preference — it is the option every
   unanswered `pages` already falls to, said before the skip instead of apologised for
   after. `goal` carries none: only the customer knows what their site is for. */
{
  const tags = await p.evaluate(() => {
    const rows = [...document.querySelectorAll('.brief-opt')]
    return rows.map((r) => [r.innerText.split('\n')[0], r.innerText.includes('Recommended')])
  })
  check('at most one option in a question is recommended', tags.filter(([, r]) => r).length <= 1,
    JSON.stringify(tags))
  /* ⚠️ THE RECOMMENDED ROW BREATHES (board 30420:25403, designer 16.09.2026: «каша получается»):
     with the chip the title row is the chip's 24, and 8px separate it from the consequence;
     a plain row keeps its 2. Only the chip's row changed. */
  const rowGap = await p.evaluate(() => {
    const rows = [...document.querySelectorAll('.brief-opt')]
    const gapOf = (r) => {
      const title = r.querySelector('span.flex.flex-wrap')
      const desc = title && title.nextElementSibling
      return title && desc ? +(desc.getBoundingClientRect().top - title.getBoundingClientRect().bottom).toFixed(1) : null
    }
    const rec = rows.find((r) => r.innerText.includes('Recommended'))
    const plain = rows.find((r) => !r.innerText.includes('Recommended'))
    return {
      rec: rec ? gapOf(rec) : null, plain: plain ? gapOf(plain) : null,
      recTitleRow: rec ? +rec.querySelector('span.flex.flex-wrap').getBoundingClientRect().height.toFixed(1) : null,
    }
  })
  check('the recommended row breathes: a 24px title row and 8px down to the consequence; plain rows keep their 2',
    rowGap.rec === 8 && rowGap.plain === 2 && rowGap.recTitleRow === 24, JSON.stringify(rowGap))
}
{
  /* ⚠️ THE CHIP IS GLASS AT THE SIZE OF A WORD, AND SINCE 16.09.2026 IT IS LIT LIKE A BADGE,
     NOT A BUTTON (designer: «мне не нравится что они похожи на кнопки… более реалистичным и
     стеклянным»): two specular streaks on the rim (light in top-left, out bottom-right — radial
     gradients centred on the edge), a nearly-gone rim between them, a clear body with light
     gathering at the top, and a thin dark band inside for thickness. NO blur, because what is
     behind it is flat in every home; NO diagonal button rim any more. */
  const chip = await p.evaluate(() => {
    const n = [...document.querySelectorAll('span')].find((x) => x.textContent === 'Recommended')
    if (!n) return null
    const c = getComputedStyle(n)
    const rim = getComputedStyle(n, '::before').backgroundImage
    const alpha = (col) => { const m = /\/\s*([\d.]+)\)/.exec(col) || /,\s*([\d.]+)\)$/.exec(col); return m ? +m[1] : 1 }
    return {
      round: c.borderRadius, fillA: +alpha(c.backgroundColor).toFixed(3), topLit: /radial-gradient/.test(c.backgroundImage),
      blur: c.backdropFilter,
      streaks: (rim.match(/radial-gradient\(/g) || []).length, buttonRim: /to right bottom/.test(rim),
      depth: /0px 0px 5px 0px inset/.test(c.boxShadow),   /* Chrome serialises the shadow colour-first, `inset` last */
    }
  })
  check('Recommended is a fully round badge of LIT glass — two streaks and two traces on the rim, no button diagonal',
    chip?.round === '9999px' && chip?.streaks === 4 && chip?.buttonRim === false, JSON.stringify(chip))
  check('…with a clear body (≤ 4% at the base, light gathering at the top) and a thin dark band inside',
    chip != null && chip.fillA <= 0.04 && chip.topLit && chip.depth, JSON.stringify(chip))
  check('…and it does not buy a blur for a flat ground', chip?.blur === 'none', chip?.blur)
}

/* back to the first question for what follows */
await p.click('.dock-foot button >> nth=0')  /* ‹ — back to the question the block measures */
await p.waitForTimeout(700)

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
  /* The corner is the brightest place and the ring only DIMS from there to the antipode —
     that is what makes it a gradient appearing rather than a strip arriving. The old form of
     this check also demanded `corner > 0.5` at the sampled instant; the softened schedule
     (10.09.2026) raises the corner more gently, so the threshold measured the easing rather
     than the shape. Monotonicity is the property that actually matters and it is stricter. */
  check('…as a gradient that appears, brightest at the corner it grew from, only dimming toward the far side',
    mid.corner > 0.15 && mid.far < mid.corner * 0.85 && mid.climb <= 0.02,
    `corner=${mid.corner} far=${mid.far} climb=${mid.climb}`)
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
  /*
   * ─── HOW SOFT THE DRAW ACTUALLY IS ───────────────────────────────────────────────────
   * The designer's whole complaint on 10.09.2026 was that the ring looked "слишком грубо",
   * and the cure was a schedule, so the schedule is what has to be held. Not by screenshot:
   * pause every dash's animation and step its `currentTime`, which reads alpha(position,
   * time) straight out of the engine at any resolution.
   *
   * Three quantities, and the third is the one that decides. SLOPE is how fast brightness
   * changes along the ring. BANDING is the step between neighbouring dashes — the ring is a
   * sampled gradient and too few dashes show as stripes. CURVATURE is where the gradient
   * BENDS, and the eye reads a bend as an edge however gentle the slope beside it (Mach
   * banding): the schedule that lost to this one had the flattest slope of all and two hard
   * bends. Measured on the build this replaced: slope 16.7, banding 24.6%, curvature 4.28.
   */
  {
    await p.mouse.move(4, 4)
    await p.waitForTimeout(260)
    await (await p.$('.brief-opt:nth-of-type(3)')).hover()
    await p.waitForTimeout(50)
    const m = await p.evaluate(() => {
      const g = document.querySelector('.brief-opt[data-hov] .brief-draw--hover .is-drawing')
      if (!g) return null
      const segs = [...g.querySelectorAll('.seg')]
      const anims = segs.map((r) => r.getAnimations()[0]).filter(Boolean)
      if (anims.length !== segs.length) return null
      const cs = getComputedStyle(g)
      const num = (st) => { const v = st.match(/[\d.]+/g); return v ? v.slice(0, 3).map(Number) : [0, 0, 0] }
      const g0 = num(cs.getPropertyValue('--ring-ground'))[0]
      const lit = (r) => (num(getComputedStyle(r).stroke)[0] - g0) / (255 - g0)
      const dur = parseFloat(cs.animationDuration) * 1000
      anims.forEach((a) => a.pause())
      const n = segs.length
      let slope = 0, band = 0, kink = 0
      for (let i = 0; i <= 80; i++) {
        anims.forEach((a) => { a.currentTime = (i / 80) * dur })
        const a = segs.map(lit)
        for (let k = 0; k < n; k++) {
          const d1 = Math.abs(a[(k + 1) % n] - a[k])
          const d2 = Math.abs(a[(k + 1) % n] - 2 * a[k] + a[(k + n - 1) % n])
          if (d1 > band) band = d1
          if (d1 * n / 100 > slope) slope = d1 * n / 100
          if (d2 * (n / 100) ** 2 > kink) kink = d2 * (n / 100) ** 2
        }
      }
      anims.forEach((a) => a.play())
      /* the schedule itself: delays must mirror about the corner and ease in and out */
      const d = segs.map((r) => parseFloat(getComputedStyle(r).animationDelay) * 1000)
      const mirror = Math.max(...d.map((v, k) => Math.abs(v - d[n - 1 - k])))
      const step = d.slice(1).map((v, k) => v - d[k])
      const half = step.slice(0, Math.round(n / 2) - 1)
      return {
        n, dur,
        slope: +(slope * 100).toFixed(1), band: +(band * 100).toFixed(1), kink: +kink.toFixed(2),
        mirror: +mirror.toFixed(2),
        stepFirst: +half[0].toFixed(2), stepMid: +half[Math.floor(half.length / 2)].toFixed(2),
        stepLast: +half[half.length - 1].toFixed(2),
        head: +Math.max(...d).toFixed(1),
      }
    })
    check('the draw is measurable at all — the dashes are real animations that can be stepped',
      !!m, JSON.stringify(m))
    if (m) {
      check('no hard edge anywhere on the ring: the gradient never bends',
        m.kink <= 0.15, `curvature ${m.kink} (was 4.28)`)
      check('…and never steepens into one: brightness changes gently all the way round',
        m.slope <= 4, `slope ${m.slope} (was 16.7)`)
      check('…and the dashes are fine enough that the gradient is not stripes',
        m.band <= 4 && m.n >= 96, `${m.band}% across ${m.n} dashes (was 24.6% across 64)`)
      check('the two arms are mirror images — neither side is harder than the other',
        m.mirror <= 1, `worst mismatch ${m.mirror}ms`)
      check('the front eases out of the corner and decelerates into the far one',
        m.stepFirst < m.stepMid && m.stepLast < m.stepMid && m.head > 40,
        `steps ${m.stepFirst} → ${m.stepMid} → ${m.stepLast} ms, head ${m.head}ms`)
    }
    /* Hand the pointer back where the checks around this block left it: row 2, hovered and
       settled. This measurement borrows row 3 for a fresh draw, and the first version of it
       parked the pointer in the corner afterwards — which un-hovered row 2 and cost the next
       check its ring ("the hairlines on both sides of the ring go — [1,1,null]"). */
    await (await p.$('.brief-opt:nth-of-type(2)')).hover()
    await p.waitForTimeout(800)
  }

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
  check('…appearing as a gradient round the row, not arriving as a strip',
    mid.corner > 0.15 && mid.far < mid.corner * 0.85 && mid.climb <= 0.02,
    `corner=${mid.corner} far=${mid.far} climb=${mid.climb}`)
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
 * The remaining four questions are ours (brief.ts): a goal, how many pages, the colour grid,
 * the lettering. (The first, `site`, is the designer's own and was typed into above.)
 * Answered here the way the demo answers them — every one a PICKED option, so the summary
 * prints real names and both drawn shapes of the panel get exercised.
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
  /* ⚠️ The typed answer prints WITH ITS SPACE and WITHOUT an "Other:" prefix: `asOther` used to
     trim on every keystroke, so the field could never hold an inner space ("personal portfolio"
     came out "personalportfolio"), and "Other:" means "other than the ones listed" — this
     question lists none. */
  check('…including the first question, typed, spaces intact and unprefixed',
    body.includes('a corner bakery') && !body.includes('Other: a corner bakery'))
  check('nothing is left as Remixer’s pick when every question was answered', !body.includes('Remixer’s pick'))
  check('the panel is gone after Submit', !(await panelUp()))
}

/* ---- the plan: Remixer's own step, and the one that gates the build ---- */
await p.waitForTimeout(2600); await shot('09-plan-card')
check('the plan is docked where the questions were', await planUp())
{
  /*
   * THE SIMPLIFIED WINDOW — Figma 30596:27064, and what this step OPENS on (designer,
   * 21.09.2026, carrying the product owners' call for release one: «нет кнопки Review… все
   * показываем в этом окне… нужно дать редактировать текст прямо в этом окне»). The full
   * card with `Review` is still shipped and is checked below, after the switch is thrown.
   */
  await p.mouse.move(8, 8); await p.waitForTimeout(220)
  const s = await p.evaluate(() => {
    const px = (v) => Math.round(parseFloat(v) * 100) / 100
    const cs = (el) => getComputedStyle(el)
    const box = (el) => { const r = el.getBoundingClientRect(); return [r.width, r.height].map((n) => Math.round(n * 100) / 100) }
    const card = document.querySelector('section[aria-label="Plan, waiting for your approval"]')
    const sheet = card.querySelector('.dock-sheet')
    const head = sheet.children[0]
    const title = head.querySelector('p')
    const unfold = head.querySelector('[data-plan-unfold]')
    const body = sheet.querySelector('[data-plan-body]')
    const inner = body.querySelector('.flex.flex-col.gap-4')
    const fade = body.lastElementChild
    const scroller = body.querySelector('.overflow-y-auto')
    const foot = card.querySelector('footer.dock-foot')
    /* ⚠️ DOCUMENT SCOPE, and that is the whole point of 21.09.2026: the switch is an
       INSTRUMENT parked in the screen's bottom-left corner, not a control in this card's
       footer («я просил это вставить в нижний левый угол экрана, а не формы»). Reading it
       through the footer is what the first cut did, and it is what the check below forbids. */
    const track = document.querySelector('[data-plan-variant]')
    const thumb = track.querySelector('.plan-variant-thumb')
    const seats = [...track.querySelectorAll('button')]
    const host = track.closest('.fixed') ?? track.parentElement
    const lines = [...inner.querySelectorAll('[data-plan-path]')].slice(0, 2)
    const bodyRect = body.getBoundingClientRect()
    const is = cs(inner), bs = cs(body)
    return {
      card: box(card)[1],
      head: box(head)[1], headPad: [px(cs(head).paddingLeft), px(cs(head).paddingRight)],
      titleSize: px(cs(title).fontSize), titleWeight: cs(title).fontWeight,
      unfold: { box: box(unfold), r: px(cs(unfold).borderTopLeftRadius),
        y: Math.round((unfold.getBoundingClientRect().top - head.getBoundingClientRect().top) * 100) / 100 },
      bodyH: box(body)[1], bodyR: px(bs.borderTopLeftRadius), bodyBg: bs.backgroundColor,
      bodyBorder: px(bs.borderTopWidth), bodyRim: bs.boxShadow.includes('rgba(255, 255, 255, 0.08) 0px 0px 0px 1px inset'),
      pad: [px(is.paddingTop), px(is.paddingRight), px(is.paddingBottom), px(is.paddingLeft)],
      gapOuter: px(is.rowGap), gapInner: px(cs(inner.children[0]).rowGap),
      lead: lines.map((el) => [px(cs(el).fontSize), cs(el).fontWeight, cs(el).color, px(cs(el).lineHeight)]),
      /* the INK, not the box: `.plan-edit` bleeds its hover surface 8px either side and
         pushes the text back in by its own padding, so the letters still land on 16 */
      inkX: Math.round((lines[0].getBoundingClientRect().left + parseFloat(cs(lines[0]).paddingLeft) - bodyRect.left) * 100) / 100,
      /* ⚠️ THE HOST is editable, not the line (21.09.2026): one `contentEditable` for the
         whole prose is what lets a selection cross a paragraph. A line carrying the attribute
         would mean the field idiom is back. */
      editable: inner.getAttribute('contenteditable'),
      linesEditable: lines.filter((el) => el.hasAttribute('contenteditable')).length,
      paths: [...inner.querySelectorAll('[data-plan-path]')].map((el) => el.dataset.planPath),
      scrolls: scroller ? [scroller.scrollHeight, scroller.clientHeight] : null,
      whole: inner.innerText,
      fade: { box: box(fade), ink: cs(fade).backgroundImage,
        gap: Math.round((bodyRect.bottom - fade.getBoundingClientRect().bottom) * 100) / 100 },
      /* a clean pixel of the window itself: inside it, above the first line, clear of text */
      sample: [Math.round(bodyRect.right - 30), Math.round(bodyRect.top + 8)],
      foot: [px(cs(foot).paddingTop), px(cs(foot).paddingRight), px(cs(foot).paddingBottom), px(cs(foot).paddingLeft)],
      track: { box: box(track), r: px(cs(track).borderTopLeftRadius), bg: cs(track).backgroundColor, pad: px(cs(track).paddingLeft) },
      corner: (() => {
        const r = track.getBoundingClientRect()
        return { left: Math.round(r.left), bottom: Math.round(window.innerHeight - r.bottom),
          position: cs(host).position, z: cs(host).zIndex,
          inFooter: !!foot.querySelector('[data-plan-variant]'), inCard: card.contains(track) }
      })(),
      thumb: { box: box(thumb), x: Math.round((thumb.getBoundingClientRect().left - track.getBoundingClientRect().left) * 100) / 100 },
      seats: seats.map((el) => ({ label: el.innerText, on: el.dataset.on ?? null, w: box(el)[0], h: box(el)[1], color: cs(el).color })),
      review: !!foot.querySelector('[data-plan-review]'),
      start: !!foot.querySelector('[data-plan-start]'),
    }
  })
  check('the step opens on the SIMPLIFIED plan — one window, no Review',
    s.bodyH === 320 && s.review === false && s.start === true && s.card === 436,
    `body ${s.bodyH} card ${s.card} review ${s.review}`)
  check('…its header is the board\u2019s 56, 16 on the left and 8 on the right for the chevron',
    s.head === 56 && s.headPad.join(',') === '16,8' && s.titleSize === 18 && s.titleWeight === '600',
    `${s.head} / ${s.headPad} / ${s.titleSize}${s.titleWeight}`)
  /* ⚠️ y=9, not a centred 8: the chevron shares the title's pt 20 / pb 18 box, which is
     what tips it one pixel below the row's centre line — exactly as the board draws it. */
  check('…the chevron is a 40 icon button at radius 10, a pixel below plain centring',
    s.unfold.box.join(',') === '40,40' && s.unfold.r === 10 && s.unfold.y === 9,
    JSON.stringify(s.unfold))
  check('…the window is 320 at radius 16, Black/200 under a 1px NA/100 rim drawn as an INSET SHADOW',
    s.bodyH === 320 && s.bodyR === 16 && s.bodyBg === 'rgba(9, 9, 11, 0.16)' && s.bodyBorder === 0 && s.bodyRim,
    `${s.bodyH} r${s.bodyR} ${s.bodyBg} border ${s.bodyBorder} rim ${s.bodyRim}`)
  check('…padded 18 / 24 / 18 / 16, with 16 between the blocks and 10 inside each',
    s.pad.join(',') === '18,24,18,16' && s.gapOuter === 16 && s.gapInner === 10,
    `${s.pad} gaps ${s.gapOuter}/${s.gapInner}`)
  check('…a 15 medium white line over a 14 regular one at 64% white, both at leading 1.4',
    JSON.stringify(s.lead) === JSON.stringify([[15, '500', 'rgb(255, 255, 255)', 21], [14, '400', 'rgba(255, 255, 255, 0.64)', 19.6]]),
    JSON.stringify(s.lead))
  check('…and the text still lands on the board\u2019s 16, through `.plan-edit`\u2019s own bleed',
    s.inkX === 16, String(s.inkX))
  /* "мы все показываем в этом окне": the WHOLE document, not the teaser's first screen —
     and it scrolls, which is why the board draws a scrollbar in it. */
  check('the whole plan is in the window, and it scrolls',
    s.whole.includes('Not in this pass') && s.whole.includes('What we\u2019ll check') &&
      s.scrolls && s.scrolls[0] > s.scrolls[1],
    `${s.scrolls} / last heading ${s.whole.includes('Not in this pass')}`)
  check('the whole prose is editable in place — ONE host, the lines at the document\u2019s own paths',
    s.editable === 'plaintext-only' && s.linesEditable === 0 && s.paths.includes('title') &&
      s.paths.includes('goal') && s.paths.includes('s0:h') && s.paths.includes('s0:0'),
    JSON.stringify([s.editable, s.linesEditable, s.paths.slice(0, 6)]))
  const px0 = await pixelAt(s.sample[0], s.sample[1])
  check('…the tail dissolves over the last 32 into the window\u2019s OWN painted colour',
    s.fade.box[1] === 32 && s.fade.gap === 0 &&
      /rgba\(22, 22, 25, 0\)/.test(s.fade.ink) && /rgb\(22, 22, 25\)/.test(s.fade.ink) &&
      Math.abs(px0[0] - 22) <= 1 && Math.abs(px0[1] - 22) <= 1 && Math.abs(px0[2] - 25) <= 1,
    `${s.fade.box} gap ${s.fade.gap} · painted ${px0}`)
  check('the footer is pt 12 / pb 16 / px 10 in this variant too',
    s.foot.join(',') === '12,10,16,10', s.foot.join(','))
  /* THE SWITCH — the house's third segmented control: equal seats, one capsule that
     travels exactly its own width, the selected word white and the other at 48%. */
  check('the switch is a 32 glass pill with two equal seats, the pill on Simple',
    s.track.box[1] === 32 && s.track.pad === 4 && s.track.bg === 'rgba(9, 9, 11, 0.64)' &&
      s.seats.length === 2 && s.seats[0].label === 'Full' && s.seats[1].label === 'Simple' &&
      s.seats[0].w === s.seats[1].w && s.seats.every((x) => x.h === 24) &&
      s.seats[1].on === 'true' && s.seats[1].color === 'rgb(255, 255, 255)' &&
      s.seats[0].color === 'rgba(255, 255, 255, 0.48)',
    JSON.stringify(s.seats))
  /*
   * ⚠️ THE PLACEMENT IS THE CHECK. The geometry below was green while the switch sat in the
   * card's footer — which is exactly where the designer did not want it. This is the
   * assertion that keeps it out: the screen's bottom-left corner, on the console handle's own
   * 10px inset, fixed, and not a descendant of the plan card at all.
   */
  check('the switch is an INSTRUMENT in the screen’s bottom-left corner, not a control in the form',
    s.corner.left === 10 && s.corner.bottom === 10 && s.corner.position === 'fixed' &&
      s.corner.inFooter === false && s.corner.inCard === false,
    JSON.stringify(s.corner))
  check('…and its capsule is a seat wide, parked on the selected one',
    Math.abs(s.thumb.box[0] - s.seats[0].w) < 0.6 && s.thumb.box[1] === 24 &&
      Math.abs(s.thumb.x - (4 + s.seats[0].w)) < 0.6,
    `thumb ${s.thumb.box} at ${s.thumb.x}, seat ${s.seats[0].w}`)
}
{
  /*
   * THE PLAN IS REWRITTEN IN THE WINDOW ITSELF — the second half of the release-one ask
   * («нужно дать редактировать текст прямо в этом окне»). The edits are the same layer the
   * full-size document writes (`world.planEdits`), which is what the flip below proves: one
   * text, two variants, no second copy of it anywhere.
   */
  /* ⚠️ ONE EDITABLE HOST, NOT ONE PER LINE (designer, 21.09.2026: «выделяется только строка,
     почему не сделать так как в редактировании обычных документов, как в гугл док?»). So the
     selection has to be able to cross a paragraph — two separate `contentEditable` hosts
     cannot hold one — and a line may carry no field dress: no plate, no focus ring. */
  const doc = await p.evaluate(() => {
    const host = document.querySelectorAll('[data-plan-doc]')
    const hosts = document.querySelectorAll('[data-plan-body] [contenteditable]')
    const a = document.querySelector('[data-plan-path="goal"]')
    const c = document.querySelector('[data-plan-path="s0:h"]')
    const range = document.createRange()
    range.setStart(a.firstChild ?? a, 0)
    range.setEnd(c.firstChild ?? c, Math.min(4, (c.textContent || '').length))
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range)
    const crosses = sel.toString()
    sel.removeAllRanges()
    const cs = getComputedStyle(document.querySelector('[data-plan-path="title"]'))
    return { hosts: hosts.length, docs: host.length, crosses: crosses.length,
      spans: crosses.includes('\\n') || crosses.length > (a.textContent || '').length,
      ring: cs.boxShadow, plate: cs.backgroundColor }
  })
  check('the plan reads as a DOCUMENT — one editable host for the whole prose',
    doc.docs === 1 && doc.hosts === 1, JSON.stringify([doc.docs, doc.hosts]))
  check('\u2026so one selection crosses paragraphs, and a line wears no field dress',
    doc.spans && doc.crosses > 60 && doc.ring === 'none' && doc.plate === 'rgba(0, 0, 0, 0)',
    JSON.stringify(doc))
  /* and it is still the plan being written: select one line the way a document does, retype
     it, click away — the store keeps it */
  await p.click('[data-plan-path="s0:h"]')
  await p.keyboard.press('End')
  await p.keyboard.down('Shift'); await p.keyboard.press('Home'); await p.keyboard.up('Shift')
  await p.keyboard.type('What we will build')
  await p.click('section[aria-label="Plan, waiting for your approval"] footer')
  await p.waitForTimeout(300)
  check('the plan is edited in the small window, not only in the full document',
    (await p.$eval('[data-plan-path="s0:h"]', (e) => e.textContent)) === 'What we will build')
}
{
  /*
   * THE HEADER CHEVRON UNFOLDS THE WINDOW TO 16 FROM THE TOP OF THE SCREEN, and nothing else
   * moves (designer, 21.09.2026: «эта кнопка должна делать на всю всю экрана с отступом от
   * верха в 16px», and then, on the full-screen sheet that was built first, «я просил просто
   * высоту окна увеличивать, а не делать его на весь экран»).
   *
   * Two numbers carry the whole thing: the card's top lands on 16, and the composer's box is
   * byte-identical before, during and after. The second is the older law — the field does not
   * move — and it is what killed the first cut, where the growing dock pushed it 36px past the
   * bottom of the screen. The column packs to its end now, so the overflow goes UP.
   */
  const fieldWas = await p.$eval('.composer-field', (el) => JSON.stringify(el.getBoundingClientRect()))
  await p.click('[data-plan-unfold]')
  await p.waitForTimeout(1100)
  await shot('09b-plan-unfolded')
  const tall = await p.evaluate(() => {
    const r = (q) => { const el = document.querySelector(q); if (!el) return null; const b = el.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map((n) => Math.round(n * 100) / 100) }
    const card = r('section[aria-label="Plan, waiting for your approval"]')
    return { card, body: r('[data-plan-body]'), field: JSON.stringify(document.querySelector('.composer-field').getBoundingClientRect()),
      /* no second surface: the window grew, nothing was opened over the screen */
      sheets: document.querySelectorAll('[data-plan-sheet]').length,
      scrims: [...document.querySelectorAll('div')].filter((el) => getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0.5)').length }
  })
  check('the chevron takes the window to 16 from the top of the screen — his number',
    tall.card?.[1] === 16, JSON.stringify(tall.card))
  check('\u2026by growing the window itself, with no sheet and no scrim over the screen',
    tall.sheets === 0 && tall.scrims === 0 && tall.body[3] > 600,
    `sheets ${tall.sheets} scrims ${tall.scrims} window ${tall.body?.[3]}`)
  check('\u2026and the composer does not move a pixel, which is the older law',
    tall.field === fieldWas, `${fieldWas} vs ${tall.field}`)
  /* ⚠️ AND THE FOLD MUST NOT SHOW GROUND. The piston hangs below the seam to cover exactly
     this: on the way down the sheet starts the height difference ABOVE its rest, and whatever
     the overhang does not cover is the page showing through — the black slit the designer
     filmed on 09.09.2026, now with a drop that can be a whole screen. Sampled mid-fold, a
     pixel just above the composer has to be the dock's own material, never the ground. */
  const seam = await p.evaluate(() => {
    const f = document.querySelector('.composer-field').getBoundingClientRect()
    return [Math.round(f.x + f.width / 2), Math.round(f.y - 10)]
  })
  await p.click('[data-plan-unfold]')
  await p.waitForTimeout(220)
  const midFold = await pixelAt(seam[0], seam[1])
  await p.waitForTimeout(900)
  check('\u2026and nothing shows the ground under it as it comes down',
    Math.max(...midFold) > 20, `pixel ${midFold} just above the field, 220ms into the fold`)
  check('\u2026folding it puts the card back at the drawn 320, the field still where it was',
    (await p.$eval('[data-plan-body]', (el) => Math.round(el.getBoundingClientRect().height))) === 320 &&
      (await p.$eval('.composer-field', (el) => JSON.stringify(el.getBoundingClientRect()))) === fieldWas)
}
/* ---- the switch: the full card the designer asked to keep, and the rest of its board ---- */
await p.click('[data-plan-seat="full"]'); await p.waitForTimeout(900)
check('the switch brings the full card back — with Review, and the edit made in the window',
  (await p.$('[data-plan-review]')) !== null &&
    (await p.$eval('[data-plan-body]', (el) => Math.round(el.getBoundingClientRect().height))) === 194 &&
    (await text()).includes('What we will build'))
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
    /* by ITS OWN mark, not by position: the two variants hand over under an
       `AnimatePresence`, so the body is a motion wrapper's child now */
    const block = sheet.querySelector('[data-plan-body]')
    const inner = block.children[0]
    const fade = block.children[1]
    const foot = card.querySelector('footer.dock-foot')
    const review = foot.querySelector('[data-plan-review]')
    const start = foot.querySelector('[data-plan-start]')
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
  /* ⚠️ The structure stopped being a sentence on 11.09.2026: the plan draws the stack the
     generation card draws, so "Four pages — Home, About…" is gone and the pages are NAMED in
     it instead. The compiled-not-canned claim is the same one, read off the new drawing. */
  /* ⚠️ Read off the CARD, which is what is on screen here — the stack with the page names
     is drawn only by the full document. TWO different answers drive two different parts, which
     is what "compiled" has to mean: the title carries the typed `site` answer (since
     18.09.2026 it outranks `goal` there — it is the one answer that says what this IS, and a
     document headed "A site that sells" over a customer who wrote "a corner bakery" would name
     the mechanism and skip the subject), and the lede follows `pages`: with "one page" it would
     read "One page, top to bottom" instead. `goal` still drives the pitch, the blocks and the
     checks further down, so nothing about it stopped being compiled. */
  check('the plan is compiled from the answers, not canned',
    body.includes('A site for a corner bakery') && body.includes('Home first, and only Home'),
    'title should carry the typed site answer and the lede pages=few')
  /* The status line must not name a button by a label the button does not wear: the board
     renamed `Approve` to `Start Building`, so the line moved with it. */
  check('the waiting line points at the verb the card actually carries',
    body.includes('start the build when it looks right') && !body.toLowerCase().includes('approve it'))
}
check('NOTHING is generated while the plan waits', (await previewState()) === 'closed')
/* ⚠️ PUBLISH IS NOT DEAD ANY MORE — IT IS ABSENT, and so is the whole canvas toolbar
   (designer, 11.09.2026, off the Build Plan board: "эти кнопки пока сайт не сгенерирован нам
   не нужны, потому их нет в макете"). Same sentence as the right rail's, one control
   further: Visual Editor, the reload, the device toggle, the address and Publish all act ON
   a site, and through the brief, the plan and the build there is none. */
check('the canvas carries no site controls before there is a site',
  !(await p.$('button:has-text("Publish")')) && !(await p.$('text=Visual Editor')))
/* ⚠️ …which costs the counter its place on screen, so the claim is read off the WORLD.
   The questions and the plan are free; only `Start Building` spends. */
check('the questions and the plan cost nothing',
  (await p.evaluate(() => JSON.parse(localStorage.getItem('remixer-prototype/world/v4') || '{}').credits)) === 2000)

/* Review: the chat narrows back to the split and the document takes the canvas. */
await p.click('[data-plan-review]'); await p.waitForTimeout(900); await shot('10-plan-review')
check('Review opens the canvas on the plan', (await previewState()) === 'open')
{
  /* THE PLAN IS A DOCUMENT YOU CAN TYPE IN (designer, 09.09.2026: "возможность редактировать
     Build Plan текст как в обычном ворд документе"). The edits are a layer over the compiled
     plan, so the card in the dock has to come back saying the same thing. */
  const before = await p.$$eval('[data-plan-path^="s2:"]', (els) =>
    els.filter((e) => /s2:\d+$/.test(e.dataset.planPath)).length)
  await p.click('[data-plan-path="title"]')
  await p.keyboard.press('Control+a')
  await p.keyboard.type('Our studio, on one page')
  await p.keyboard.press('Enter')
  await p.waitForTimeout(300)
  check('the plan’s own words can be rewritten in place',
    (await p.$eval('[data-plan-path="title"]', (e) => e.textContent)) === 'Our studio, on one page')
  /* Enter opens the next bullet — the first thing anybody tries in a list. */
  await p.click('[data-plan-path="s2:0"]')
  await p.keyboard.press('End'); await p.keyboard.press('Enter')
  await p.waitForTimeout(300)
  const after = await p.$$eval('[data-plan-path^="s2:"]', (els) =>
    els.filter((e) => /s2:\d+$/.test(e.dataset.planPath)).length)
  check('…and Enter in a bullet opens the next one', after === before + 1, `${before} → ${after}`)
  /* Backspace closes an empty one again, so the document goes back as it was. */
  await p.keyboard.press('Backspace')
  await p.waitForTimeout(300)
  check('…and Backspace on an empty bullet closes it',
    (await p.$$eval('[data-plan-path^="s2:"]', (els) =>
      els.filter((e) => /s2:\d+$/.test(e.dataset.planPath)).length)) === before)
}
/* ⚠️ REVIEW SPLITS A WIDE SHELL IN HALF (designer, 11.09.2026). The plan is a document and
   the thread beside it is the conversation that wrote it — neither previews the other, so on
   a monitor with room they are two equal columns. The half is taken only when the canvas
   half still holds the document's own 800 measure plus its padding; the checker's viewport
   is 1440, where it does not, so the split stays where the board puts it. */
check('…with the chat back at its split width on a laptop-sized shell',
  (await asideWidth()) < 480, `aside=${Math.round(await asideWidth())}px`)
{
  const doc = await text()
  check('the document carries what the card could only start',
    doc.includes('What we’ll check before handing it back') && doc.includes('#c4553d'),
    'the checks section and the palette hexes')
  check('the plan is still awaiting approval, not building', await planUp())
}
/* ✕ hands the canvas back and returns to the card. */
{
  /*
   * THE GUARD IN `setPlanVariant`: the simplified variant has no door to the full-size
   * document — `Review` IS that door — so throwing the switch while the document stands
   * open in the canvas has to hand the canvas back on the way, or it would leave a room
   * with no way in and no way out.
   */
  await p.click('[data-plan-seat="simple"]'); await p.waitForTimeout(900)
  check('switching to the simple window takes the canvas back with it',
    (await previewState()) === 'closed' && (await p.$('[data-plan-review]')) === null && (await planUp()))
  await p.click('[data-plan-seat="full"]'); await p.waitForTimeout(900)
  await p.click('[data-plan-review]'); await p.waitForTimeout(900)
}
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
  check('…and its ring wears the SATURATED twin of the row\'s hue (`--sh-arc`), not the work line\'s pastel — designer, 16.09.2026: «конкретно в спинере цвета более яркие и насыщенные»',
    o?.ringArc === true, JSON.stringify(o?.ringArc))
}

/*
 * THE CARD'S EDGES — Figma 29531:17269, after the designer reported them twice in one day:
 * first as a DOUBLED line ("бордер как будто двойной… видно внизу там где About, Services"),
 * then, once the card's own border had been removed to cure that, as BROKEN lines with gaps
 * ("какие-то поломанные бордеры с обрывами").
 *
 * Both defects are one geometry. The card's stroke is the continuous rail; every seam inside
 * it is an arc that leaves the side 16–24px early. Nest a full-width child's border inside
 * the card's and CSS puts them a pixel apart (a 2px rail); take the card's away and each arc
 * ends in mid-air. The cure is to pull the children ONTO the rail, and that is what these
 * checks measure: coincident boxes, one seam per row except the last, and then the rail
 * itself, sampled down the page — lit at every step, dark one pixel in.
 */
{
  const geo = await p.evaluate(() => {
    const card = document.querySelector('[aria-label="What Remixer is building"]')
    const r = card.getBoundingClientRect()
    const cs = getComputedStyle(card)
    const kids = [...card.children]
    const edge = (el) => {
      const k = el.getBoundingClientRect()
      return { l: +(k.left - r.left).toFixed(2), r: +(r.right - k.right).toFixed(2) }
    }
    return {
      box: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
      border: `${cs.borderTopWidth} ${cs.borderTopColor}`,
      radius: cs.borderRadius,
      overflow: cs.overflow,
      kids: kids.map((el) => ({
        ...edge(el),
        bw: getComputedStyle(el).borderBottomWidth,
        radius: getComputedStyle(el).borderBottomLeftRadius,
      })),
    }
  })
  check('the card draws the rail itself — 1px #272728 at radius 24 (29531:17269)',
    geo.border === '1px rgb(39, 39, 40)' && geo.radius === '24px', `${geo.border} / ${geo.radius}`)
  check('…and does not clip it: overflow would shave the strokes pulled onto it',
    geo.overflow === 'visible', geo.overflow)
  check('every block inside sits ON that rail, not a pixel inside it',
    geo.kids.every((k) => k.l === 0 || (k.l === 1 && k.bw === '0px')),
    JSON.stringify(geo.kids.map((k) => `${k.l}/${k.bw}`)))
  check('every waiting page seals its bottom at radius 16 — except the last, which draws nothing',
    geo.kids.slice(1, -1).every((k) => k.bw === '1px' && k.radius === '16px') &&
      geo.kids[geo.kids.length - 1].bw === '0px',
    JSON.stringify(geo.kids.slice(1).map((k) => `${k.bw} r${k.radius}`)))

  /* The rail as the screen has it: every 8px down the straight part of the left edge, the
     card's own column must be lit and the next one dark. A gap fails the first, a doubled
     line the second. */
  const lit = ([r, g, bl]) => r >= 30 && g >= 30 && bl >= 30
  const dark = []
  const beside = []
  let i = 0
  for (let y = geo.box.y + 26; y < geo.box.y + geo.box.h - 26; y += 8, i++) {
    const on = await pixelAt(geo.box.x, y)
    const next = await pixelAt(geo.box.x + 1, y)
    if (!lit(on)) dark.push([y - geo.box.y, on])
    if (lit(next)) beside.push([i, y - geo.box.y, next])
  }
  check('the rail runs unbroken from corner to corner — no gaps anywhere down it',
    dark.length === 0, JSON.stringify(dark.slice(0, 4)))
  /*
   * A DOUBLED rail lights the neighbouring column at EVERY step; a seam's arc lights it for
   * the two rows where the curve leaves the side, and no more. Scanned row by row at dpr 1
   * this build gives exactly three such runs — [297,298], [352,353], [400,401], the page
   * block's bottom and the two sealed rows', 48px apart — so on an 8px grid no two
   * consecutive samples can ever be lit unless a real second line is there.
   */
  const consecutive = beside.filter((b, n) => n > 0 && b[0] === beside[n - 1][0] + 1)
  check('…and it is ONE pixel wide: what lights beside it is a seam leaving, never a second line',
    consecutive.length === 0, JSON.stringify(beside.slice(0, 6)))
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

/*
 * THE THREAD FOLLOWS ITS OWN CONTENT (designer, 09.09.2026: "нужно добавить автоскрол чата
 * точно так же как у lovable.dev… контент что в чате появляется может быть обрезан").
 * The outline card grows for a minute; measured before the follower existed, its bottom
 * finished under the composer and stayed there.
 */
const tail = () => p.evaluate(() => {
  const vp = document.querySelector('aside .scroll-area > div')
  const turns = [...document.querySelectorAll('aside .arrive-msg')]
  const last = turns[turns.length - 1]
  if (!vp || !last) return null
  return {
    below: +(last.getBoundingClientRect().bottom - vp.getBoundingClientRect().bottom).toFixed(1),
    fromEnd: Math.round(vp.scrollHeight - vp.scrollTop - vp.clientHeight),
    top: Math.round(vp.scrollTop),
  }
})

await p.waitForTimeout(20000); await shot('12a-mid-build')
{
  /* ONE EDGE, NOT TWO — and not none either. The designer reported this card's edges twice on
     09.09.2026: first doubled ("бордер как будто двойной… видно внизу там где About, Services"),
     then, once the card's own stroke had been taken away to cure that, broken ("поломанные
     бордеры с обрывами"). The board (29531:17269) keeps the card's stroke as the continuous rail
     and the children are pulled ONTO it, so every full-width child shares the card's box exactly
     — except the last waiting page, which draws nothing and stays inside. */
  const edges = await p.evaluate(() => {
    const c = document.querySelector('section[aria-label="What Remixer is building"]')
    const r = c.getBoundingClientRect()
    return {
      card: getComputedStyle(c).borderLeftWidth,
      kids: [...c.children].map((k) => {
        const b = k.getBoundingClientRect()
        return +(b.x - r.x).toFixed(1) + '/' + +(b.width - r.width).toFixed(1) + '/' + getComputedStyle(k).borderBottomWidth
      }),
    }
  })
  check('the second build keeps the one rail too — card strokes, children lie on it',
    edges.card === '1px' &&
      edges.kids.slice(0, -1).every((k) => k.startsWith('0/0/1px')) &&
      edges.kids[edges.kids.length - 1] === '1/-2/0px',
    JSON.stringify(edges))
}
check('the growing card stays inside the panel instead of finishing under the composer',
  (await tail())?.below < 0, JSON.stringify(await tail()))
{
  const o = await outline()
  const done = o?.rows.filter((r) => r.state === 'done').length ?? 0
  check('sections finish as the minute runs', done >= 1 && done < 5, `${done} done after ~24s`)
  check('…and still exactly one is in hand', o?.rows.filter((r) => r.state === 'active').length === 1)
  check('the site has still not appeared', !(await siteUp()))
  /* ⚠️ ABSENT, not dead, since 11.09.2026 — the canvas carries no site controls while the
     page it would act on is still being written. */
  check('Publish stays away while the page is being written', !(await p.$('button:has-text("Publish")')))
}

/* Out to the far side of the hardcoded minute (5 sections + the assembling beat). */
await p.waitForTimeout(45000); await shot('12-built')
/* The canvas opening halves the chat's width and re-wraps the whole thread taller. That is
   the moment a naive follower switches ITSELF off: the re-wrap fires `scroll` with nobody
   touching anything, and read as a reader's gesture it strands the thread short of its end
   (measured before the fix: 666px). Only a wheel, a touch or a key may turn it off. */
check('…and is still at its end after the canvas opens and re-wraps it',
  (await tail())?.fromEnd === 0, JSON.stringify(await tail()))
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
  /* ⚠️ The typed first answer leads the sentence as a DESCRIPTION, not as a quotation. The
     customer's own words are already on screen twice by now — the summary row above and the
     plan's heading — and this file's own `briefDone` records what happens when the ack echoes
     free text back a third time: it "read as a machine repeating itself". */
  check('the acknowledgement reads as one sentence',
    body.includes('a site for what you described, built to sell, across a few pages, in Warm Clay with friendly lettering'))
  check('the brief is still readable after the build', body.includes('Warm Clay') && body.includes('Friendly'))
  /* the toolbar is back, because the site is — and the balance is on it again */
  check('the build spends credits', body.includes('1 990'), 'toolbar balance after one build')
  check('Publish comes alive once the site exists',
    !(await p.$eval('header button:has-text("Publish")', (el) => el.disabled)))
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

{
  /* …and a reader who scrolls up to re-read something is not yanked back to the bottom by
     the next thing that arrives. Following is a courtesy, not a leash. */
  await p.mouse.move(300, 400)
  await p.mouse.wheel(0, -500)
  await p.waitForTimeout(500)
  const parked2 = (await tail())?.top
  await p.waitForTimeout(2500)
  check('a reader who scrolls up keeps their place', (await tail())?.top === parked2,
    `${parked2} → ${(await tail())?.top}`)
  /* and coming back to the end turns it on again */
  await p.mouse.wheel(0, 3000)
  await p.waitForTimeout(600)
  check('…and coming back to the end picks the following up again', (await tail())?.fromEnd <= 32,
    JSON.stringify(await tail()))
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
  /*
   * THE SUMMARY NO LONGER MATCHES IT. It has its own board now (29848:28823) and its own
   * width — 480, the designer's number and the one the board is drawn at (09.09.2026). It
   * used to be sized off the generation outline's board, which is where "the full width of
   * the chat column" came from; in the collapsed chat that is 800, and the values floated an
   * inch from their labels. So the outline still fills the column and the summary caps.
   */
  const sum = await p.evaluate(() => {
    const dl = document.querySelector('dl')
    const card = dl && dl.parentElement.parentElement
    if (!card) return null
    const cs = getComputedStyle(card)
    const rows = [...dl.children]
    const dt = rows[0]?.querySelector('dt')
    return {
      w: Math.round(card.getBoundingClientRect().width),
      h: Math.round(card.getBoundingClientRect().height),
      max: cs.maxWidth,
      radius: cs.borderTopLeftRadius,
      border: `${cs.borderTopWidth} ${cs.borderTopColor}`,
      fill: cs.backgroundColor,
      listFill: getComputedStyle(dl).backgroundColor,
      head: (() => { const p2 = card.querySelector('p'); const c = getComputedStyle(p2)
        return `${Math.round(p2.getBoundingClientRect().height)}/${c.fontSize}/${c.fontWeight}/${c.paddingLeft}` })(),
      rows: rows.map((r) => Math.round(r.getBoundingClientRect().height)).join(','),
      label: dt ? `${Math.round(dt.getBoundingClientRect().width)}/${getComputedStyle(dt).color}` : null,
    }
  })
  check('the brief summary caps at the 480 its board is drawn at', sum?.w === 480 && sum?.max === '480px',
    `${sum?.w} (max ${sum?.max}) in a ${fits.card}px column`)
  /* 1 + 56 + (11 + 5×36 + 12) + 1. The list's top padding is 11 because Figma's stroke sits
     INSIDE the geometry and a CSS border adds — the same correction the plan card's fade needed.
     ⚠️ FIVE rows since 18.09.2026: the brief opens with a free-text question (30594:24360), and
     ChatPanel maps BRIEF_QUESTIONS, so the card grew by one 36px row. Board 29848:28823 still
     draws four — flagged to the designer, the card is his pixel spec. */
  check('…and is exactly as tall as the board, one row per question', sum?.h === 262, `${sum?.h} vs 262`)
  check('…with the board’s frame: 1px #272728, radius 24, and no fill on either surface',
    sum?.radius === '24px' && sum?.border === '1px rgb(39, 39, 40)'
      && sum?.fill === 'rgba(0, 0, 0, 0)' && sum?.listFill === 'rgba(0, 0, 0, 0)',
    `${sum?.radius} / ${sum?.border} / ${sum?.fill} / ${sum?.listFill}`)
  check('…a 56px header at 15 medium on the board’s 16 of padding', sum?.head === '56/15px/500/16px', sum?.head)
  check('…rows of 36 behind a 160px label column at 48% white',
    sum?.rows === '36,36,36,36,36' && sum?.label === '160/rgba(255, 255, 255, 0.48)',
    `${sum?.rows} | ${sum?.label}`)
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

/* ===================== A2. Autopilot takes the lead once the first page is live */
/*
 * The mode switcher has sat in the composer since 08.09.2026 with nothing behind it; this
 * is the behaviour (designer, 09.09.2026: "это режим когда чат сам присылает форму с
 * выбором и рекомендацией что делать дальше"). It is checked HERE, at the tail of case A,
 * because the only honest way to reach the first proposal is the customer's own: a real
 * brief, a real plan and the real minute this case has just sat through. A staged world
 * would prove the panel renders and prove nothing about when it arrives.
 *
 * ⚠️ The last check here presses "Turn off Autopilot", so cases B–D run in `build` mode —
 * which is what they ran in before this feature existed, so their expectations are
 * untouched. That is deliberate: the alternative is proposals docking in the middle of
 * three other cases' assertions.
 */
const modeLabel = () => p.evaluate(() => document.querySelector('.mode-switch, [aria-haspopup="menu"]')?.innerText.trim() ?? null)
const suggest = () => p.evaluate(() => {
  const sec = document.querySelector('section[aria-label="What Remixer suggests next"]')
  if (!sec) return null
  const rows = [...sec.querySelectorAll('.brief-opt')]
  const foot = sec.querySelector('.dock-foot')
  const f = document.querySelector('.composer-field').getBoundingClientRect()
  const head = rows.map((r) => r.innerText.split('\n')[0])
  return {
    question: sec.querySelector('p').innerText,
    rows: head,
    picked: rows.filter((r) => r.getAttribute('aria-pressed') === 'true').map((r) => r.innerText.split('\n')[0]),
    /* ⚠️ The consequence is the row's LAST line, not its second: since 11.09.2026 a
       recommended row carries its plate on the title's own line, so `innerText` puts
       "Recommended" between the name and the consequence. */
    detail: rows.map((r) => r.innerText.trim().split('\n').at(-1) ?? ''),
    buttons: [...foot.querySelectorAll('button')].map((x) => x.innerText.trim()),
    arrows: foot.querySelectorAll('button[aria-label]').length,
    shell: !!document.querySelector('.dock.brief-dock'),
    field: [f.x, f.y, f.width, f.height].map((n) => +n.toFixed(2)).join(','),
  }
})

/*
 * ⚠️ AND THE MODE IS THE DEFAULT ONE, on a site started from the Home page in a browser whose
 * previous site was left in `Build` — the designer's own build did exactly that on 09.09.2026
 * and he got neither the proposal nor the Autopilot sign-off line. The mode belongs to the
 * project, so `startBuild` puts it back; this is the check that says so.
 */
{
  /* THE THREAD STEPS BACK FOR A DOCKED FORM (designer, 09.09.2026: "содержимое переписки должно
     становится прозрачным на 50%… она не будет сливаться"). Half is his number. */
  const dim = await p.evaluate(() => {
    const el = document.querySelector('aside .chat-dim')
    return el ? { op: getComputedStyle(el).opacity, on: el.classList.contains('chat-dim--on') } : null
  })
  check('the thread steps back to half while a form is docked', dim?.op === '0.5' && dim?.on === true,
    JSON.stringify(dim))
}
await shot('15a-autopilot-proposes')
{
  /* ONE SHAPE FOR EVERY WAIT (designer, 09.09.2026, off a recording of Lovable's first turn:
     "мне нравится что под синкингом есть … и не так пусто"). The ellipsis is the turn that has
     not been written yet, standing where it will be; without it the answer's column is empty
     while the agent thinks, and empty reads as nothing happening. */
  const wait = await p.evaluate(() => {
    const th = document.querySelector('aside .thinking')
    if (!th) return null
    const block = th.closest('div')
    return { label: th.textContent, lines: block.querySelectorAll('p').length,
      dots: block.querySelector('p:last-child')?.textContent }
  })
  check('a waiting turn is the status AND the ellipsis under it, never the status alone',
    wait === null || (wait.lines === 2 && wait.dots === '…'), JSON.stringify(wait))
}
check('a new site starts in Autopilot, whatever the last one was left in',
  (await modeLabel())?.includes('Autopilot') === true, await modeLabel())
const first = await suggest()
check('Autopilot proposes the next piece of work once the first page is live', !!first)
check('…as ONE question, not a new brief', first?.question === 'What should I do next?', first?.question)
/*
 * COMPILED FROM THE PLAN, not written down: the pages on offer are pages the outline card
 * one turn above named, and the page that is already live is not among them. A proposal
 * that could offer a page the plan never promised is the failure this is guarding.
 */
check('the pages it offers are the plan’s own, minus the one that is live',
  first?.rows.join(' · ') === 'Keep working on this page · Start the About page · Start the Services page',
  first?.rows.join(' · '))
check('every option says what happens if it is picked',
  first?.detail.every((d) => d.length > 20), JSON.stringify(first?.detail))
/* The recommendation IS a pick — same ring a chosen brief answer wears, so the button
   under it is already true. A panel of empty radios would be a quiz, not guidance. */
check('it arrives with its recommendation picked, and only that one',
  first?.picked.length === 1 && first?.picked[0] === 'Keep working on this page',
  JSON.stringify(first?.picked))
/* One question has nothing to page through and no "all" to skip. */
check('no paging arrows and no "Skip all" on a single proposal',
  first?.arrows === 0 && !first?.buttons.includes('Skip all'), JSON.stringify(first?.buttons))
check('the footer offers the way out of the MODE, as the designer asked',
  first?.buttons[0] === 'Turn off Autopilot', JSON.stringify(first?.buttons))
check('the blue button names what the press does', first?.buttons[1] === 'Keep going', first?.buttons[1])
check('the proposal and the composer are ONE glass object, like the brief’s panel', first?.shell === true)
{
  const body = await text()
  /* The line above the panel stops listing what to do next, because the panel below it now
     does that in rows with consequences — the plan card's status line had to learn the same
     thing on 09.09.2026. What it says instead is the one thing a panel cannot: how much of
     the plan is still outstanding. */
  check('the hand-over line does not name options the panel owns',
    !body.includes('Tell me what to change, or hit Publish'))
  check('…and says how much of the plan is still waiting',
    body.includes('Three more pages are waiting in the plan'))
}

/* Picking a page re-labels the button: the two options do different things and the press
   has to name the one it will do (the plan card's `Start Building` rule). */
await p.click('.brief-opt >> nth=1'); await p.waitForTimeout(400)
{
  const s = await suggest()
  check('picking a page moves the pick and re-labels the button',
    s?.picked.join('') === 'Start the About page' && s?.buttons[1] === 'Start Building',
    `${s?.picked.join('')} / ${s?.buttons[1]}`)
  check('the field has not moved a pixel through any of it', s?.field === first?.field,
    `${first?.field} → ${s?.field}`)
}

/* Accepting posts the row's own sentence AS THE CUSTOMER'S. The transcript is the record of
   what was decided; a decision taken in a panel that left no turn behind is one the thread
   cannot account for. */
await p.click('.dock-foot button >> nth=1')
await p.waitForTimeout(700)
check('accepting takes the panel away and puts the decision in the thread',
  !(await suggest()) && (await text()).includes('Start the About page.'))
/* The answer, the 1.3s hand-over — and then the SATISFACTION CARD, not a second proposal. */
await p.waitForTimeout(6000); await shot('15b-autopilot-rating')
{
  const body = await text()
  check('Remixer answers naming the page the row named', body.includes('About is in'))
  check('the outline card keeps the sections it was built with',
    body.includes('Product grid') && !body.includes('Enquiry form'),
    'a send used to clear the answered brief and rewrite the card')
  check('the build it started spends a build’s worth of credits', body.includes('1 980'),
    'toolbar balance after the accepted proposal')
}

/* ------------------ the satisfaction card (Figma 25744:139153), asked once, after the
   first proposal the customer answered. It takes the second proposal's turn rather than
   stacking on it: the dock holds one thing. */
const rating = () => p.evaluate(() => {
  const sec = document.querySelector('section[aria-label="How would you rate Remixer?"]')
  if (!sec) return null
  const cs = (el, k) => getComputedStyle(el)[k]
  const cells = [...sec.querySelectorAll('.brief-cell')]
  /* The two ends of the scale — scoped off the cells' own row so the digits inside the
     cells cannot answer for them (they did, the first time this was written). */
  const ends = [...(cells[0].parentElement.previousElementSibling?.children ?? [])]
  const input = sec.querySelector('input')
  const foot = sec.querySelector('.dock-foot')
  const card = sec.querySelector('.dock-sheet > div')
  const f = document.querySelector('.composer-field').getBoundingClientRect()
  const w = (e) => Math.round(e.getBoundingClientRect().width)
  return {
    title: sec.querySelector('p').innerText,
    n: cells.length,
    digits: cells.map((c) => c.innerText).join(''),
    equal: new Set(cells.map(w)).size === 1,
    h: Math.round(cells[0].getBoundingClientRect().height),
    gap: Math.round(cells[1].getBoundingClientRect().x - cells[0].getBoundingClientRect().right),
    rim: cs(cells[0], 'boxShadow'),
    picked: cells.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.innerText),
    ends: ends.map((e) => e.innerText).join('|'),
    endsColour: ends[0] ? cs(ends[0], 'color') : null,
    cardBg: cs(card, 'backgroundColor'),
    note: { h: Math.round(input.getBoundingClientRect().height), place: input.placeholder },
    buttons: [...foot.querySelectorAll('button')].map((b) => ({ t: b.innerText.trim(), off: b.disabled })),
    field: [f.x, f.y, f.width, f.height].map((n) => +n.toFixed(2)).join(','),
  }
})

await shot('15c-rating')
const r0 = await rating()
check('the satisfaction card is asked once the first proposal has been answered', !!r0)
check('…and it takes the second proposal’s turn, not a slot beside it', !(await suggest()))
check('the scale is 1–10, ten equal cells 40 tall six apart',
  r0?.n === 10 && r0?.digits === '12345678910' && r0?.equal && r0?.h === 40 && r0?.gap === 6,
  `${r0?.n} cells / ${r0?.h}h / gap ${r0?.gap} / equal ${r0?.equal}`)
/* Neutral Alpha/200 read in the DARK theme is 12% white; the light export prints .16 of a
   near-black, which on this card would be a rim darker than the surface it sits on. */
check('each cell rests on the board’s 12% rim',
  r0?.rim === 'rgba(255, 255, 255, 0.12) 0px 0px 0px 1px inset', r0?.rim)
check('the ends of the scale are named, and the board’s "Exellent" ships spelled right',
  r0?.ends === 'Poor|Excellent', r0?.ends)
check('…at 48% white, the token read in the dark theme',
  r0?.endsColour === 'rgba(255, 255, 255, 0.48)', r0?.endsColour)
check('the card is the same surface the questions and the proposals stand in',
  r0?.cardBg === 'rgba(9, 9, 11, 0.56)', r0?.cardBg)
check('the note is optional and says so', r0?.note.h === 40 && /optional/.test(r0?.note.place ?? ''),
  JSON.stringify(r0?.note))
/* Nothing to send before a number is chosen, so the button says so rather than lying. */
check('nothing is picked when it arrives, and Submit is dead until something is',
  r0?.picked.length === 0 && r0?.buttons[1]?.off === true, JSON.stringify(r0?.buttons))
check('the way out is Skip, and it is the only other control', r0?.buttons[0]?.t === 'Skip'
  && r0?.buttons.length === 2, JSON.stringify(r0?.buttons))

await p.click('.brief-cell >> nth=8')
await p.waitForTimeout(400)
{
  const r = await rating()
  /* THE CHOSEN SCORE IS A WHITE PLATE WITH BLACK FIGURES — Figma 25744:139649. Read in the
     DARK theme: Neutral Alpha/1000 is #ffffff and Text/Default/On Default is #09090b; the light
     export prints both inverted, which would paint a black plate with white figures. The rim
     leaves with the plate arriving, and the figure thickens to SemiBold. */
  const plate = await p.evaluate(() => {
    const on = [...document.querySelectorAll('.brief-cell')].find((c) => c.getAttribute('aria-pressed') === 'true')
    if (!on) return null
    const s = getComputedStyle(on), d = getComputedStyle(on.querySelector('.cell-digit'))
    return { bg: s.backgroundColor, rim: s.boxShadow, ink: d.color, weight: d.fontWeight,
      ring: getComputedStyle(on.querySelector('.brief-draw--pick') ?? document.body).display,
      moves: s.transitionProperty }
  })
  check('the chosen score is a white plate with black figures, and gives up its rim',
    plate?.bg === 'rgb(255, 255, 255)' && plate?.ink === 'rgb(9, 9, 11)' && plate?.weight === '600'
      && plate?.rim === 'rgba(0, 0, 0, 0) 0px 0px 0px 1px inset', JSON.stringify(plate))
  check('…and it arrives rather than appearing: fill, rim and ink all travel',
    /background-color/.test(plate?.moves ?? '') && /color/.test(plate?.moves ?? '')
      && plate?.ring === 'none', plate?.moves)
  check('picking a score picks exactly one cell and wakes Submit',
    r?.picked.join('') === '9' && r?.buttons[1]?.off === false, JSON.stringify(r?.picked))
  check('the composer has not moved through any of it', r?.field === r0?.field,
    `${r0?.field} → ${r?.field}`)
}
await p.fill('section[aria-label="How would you rate Remixer?"] input', 'The hero came out better than I expected.')
await p.click('.dock-foot button >> nth=1')
await p.waitForTimeout(2200); await shot('15d-rated')
{
  const body = await text()
  check('sending the score takes the card away and puts the answer in the thread',
    !(await rating()) && body.includes('9 out of 10.'))
  check('…with the note the customer wrote', body.includes('The hero came out better than I expected.'))
  /* Three replies, not one: a three and a ten cannot honestly get the same sentence. */
  check('Remixer answers in the band the score falls in',
    body.includes('that is good to hear') && body.includes('Your note goes with it'))
  /* THE ONE LINE THAT MUST NEVER CHANGE: telling us how we did is free. Charging for it —
     and above all charging for a bad score — would be the worst line in the product. */
  check('rating costs nothing', body.includes('1 980'), 'toolbar balance unchanged by the rating')
}

/* And now the second proposal, on the next edit — the card does not come back. */
await p.fill('textarea', 'Make the headline shorter.')
await p.keyboard.press('Enter')
await p.waitForTimeout(6200); await shot('15e-autopilot-again')
{
  const s = await suggest()
  check('the next proposal comes after the next edit, and drops the page already asked for',
    s?.rows.join(' · ') === 'Keep working on this page · Start the Services page · Start the Contact page',
    s?.rows.join(' · '))
  check('the satisfaction card is asked ONCE and does not come back', !(await rating()))
}

/* Turning the mode off is a mode switch, so it says so and names the way back. */
await p.click('.dock-foot button >> nth=0'); await p.waitForTimeout(1200); await shot('15c-autopilot-off')
{
  const body = await text()
  check('Turn off Autopilot takes the panel down', !(await suggest()))
  check('…flips the composer’s mode pill to Build', (await modeLabel())?.includes('Build') === true,
    await modeLabel())
  check('…and leaves one line naming the way back', body.includes('Autopilot is off')
    && body.includes('mode button below'))
}

/* The mark in the chat header is the way back to the Home page — the one exit from the
   builder, as it is in every builder in the category. Checked HERE because the next line
   navigates from scratch anyway, so leaving the shell costs nothing (10.09.2026: the
   designer asked why the logo had stopped leading Home — it had not; the artifact had
   rolled back to a build from a branch that has no Home page at all, so its mark was a
   picture. Nothing had ever clicked it in 250 checks). Both halves are probed: the mark
   and the wordmark are one button, and nothing may cover either. */
{
  const hit = await p.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Back to Home"]')
    if (!btn) return null
    const r = btn.getBoundingClientRect()
    return [r.left + 16, r.left + r.width - 16].map((x) => {
      const el = document.elementFromPoint(x, r.top + r.height / 2)
      return !!el && btn.contains(el)
    })
  })
  check('the mark in the chat header is a live button, mark and word alike',
    !!hit && hit[0] === true && hit[1] === true, JSON.stringify(hit))
  await p.click('button[aria-label="Back to Home"]')
  await p.waitForTimeout(500)
  check('…and clicking it returns to the Home page', await onHome())
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
/* 4600 was enough while the line and the panel landed together; since the line now gets read
   first (see READ_MS), the panel is ~3.7s behind it. Waited for rather than slept through. */
await p.waitForSelector('section[aria-label="Questions before building"]', { timeout: 20000 })
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
    await p.click('header button:has-text("Publish")')
    await settled()
  }
  /* ⚠️ MEASURE A PANEL THAT HAS LANDED. The panel arrives as glass (motion.ts `panelIn`): a spring
     whose scale tail (1.0009 → 1) runs ~680 ms after arrival, and a box read through
     `getBoundingClientRect()` is the PAINTED box — at 600 ms the domain row measured 64.01, the
     explanation box's bottom rounded a pixel off the card's. So every opening waits for the panel's
     transform to be identity before anything is measured (Reveal.tsx carries the same lesson). */
  const settled = async () => {
    await p.waitForFunction(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
      if (!d) return false
      const t = getComputedStyle(d).transform
      return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)'
    }, null, { timeout: 4000 })
    await p.waitForTimeout(120)
  }
  const panel = () => p.$('[role="dialog"][aria-label="Publish"]')
  const title = () => p.$eval('[role="dialog"][aria-label="Publish"] h3', (el) => el.textContent.trim())
  const hint = () => p.$('[role="dialog"] .pub-hint-dots')

  await openPublish('p=built&u=1&v=false&a=trial&t=22&c=640')
  await shot('21-publish-not-published')
  check('an unpublished site’s panel is titled by its status', (await title()) === 'Not published', await title())
  /*
   * WHERE IT SITS — shell board 29697:54553 (designer, 09.09.2026: "сделай расположение
   * этого открытого окна Publish как в макете"). `Frame 22` is x=2025 y=8 in a 2560 frame,
   * so the panel rides at the TOP of the window, over the right end of the topbar, with its
   * right edge one pixel inside the 56px rail. Measured from the right and the top, so the
   * assertion holds at any window width.
   */
  {
    const pos = await p.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
      const r = d.getBoundingClientRect()
      const bar = document.querySelector('header').getBoundingClientRect()
      return { top: Math.round(r.top), fromRight: Math.round(innerWidth - r.right), overTopbar: r.top < bar.bottom }
    })
    /* 56, not 55: board 30282:18491 puts `Frame 22` at x=2072 in a 2560 frame (14.09.2026). */
    check('the panel sits where the shell board puts it — 8 down, 56 in from the right',
      pos.top === 8 && pos.fromRight === 56, JSON.stringify(pos))
    check('…which means it rides OVER the topbar, not tucked under it', pos.overTopbar)
  }
  check('…and carries the nudge banner', !!(await hint()))
  /* ⚠️ THE BOX MOVED TO 432 (board 30282:18491, the designer's correction of 14.09.2026):
     432 panel, 420 card, 404 banner at 120 tall, ✕ inset 8 from the banner's top-right
     corner. The copy column went with it — 276px and three lines where 480 gave 324 and
     two; the newer board draws no banner at all, so its two drawn lines are not a rule the
     new width can keep. Raised with the designer, shipped as the width he named.
     Rims are inset shadows, not borders — a border would eat these very pixels. */
  const box = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
    const banner = d.querySelector('.pub-hint-dots').parentElement
    /* The banner sits inside a Reveal (ui/Reveal.tsx: clip › sizer › glass), so the body card
       is found by its fill, not by counting parents; the 8px inset is on the Reveal's sizer —
       the first ancestor that carries any padding at all. */
    const card = [...d.querySelectorAll('div')].find((e) => getComputedStyle(e).backgroundColor === 'rgba(255, 255, 255, 0.04)')
    const padOwner = (() => { let e = banner.parentElement; while (e && e !== card && getComputedStyle(e).padding === '0px') e = e.parentElement; return e })()
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
      bannerPad: getComputedStyle(padOwner).padding,
    }
  })
  check('the panel is the board’s 432 with a 420 card and a 404 × 120 banner',
    box.panel === 432 && box.card === 420 && box.banner === 404 && box.bannerH === 120, JSON.stringify(box))
  check('the ✕ is 32 at radius 10, inset 8 from the banner’s corner',
    box.close === 32 && box.insetRight === 8 && box.insetTop === 8, `${box.close} / ${box.insetRight} / ${box.insetTop}`)
  check('the copy fills the column the 432 panel gives it', box.para === 276, `${box.para}px / ${box.lines} lines`)
  /* ⚠️ The 8px no longer comes from a gap on the card — board 30282:53241 has its children
     flush and the field block's own pb 16 is the whole distance — so the banner carries its
     own inset instead (`p-2` on its wrapper). Same pixels, different owner. */
  check('the banner is gray-900 at radius 12, inset 8 inside the card',
    box.fill === 'rgb(24, 24, 27)' && box.radius === '12px' && box.bannerPad === '8px', JSON.stringify([box.fill, box.radius, box.bannerPad]))
  /* the ✕ takes it down — and nothing else moves */
  const wide = box.panel
  await p.click('[role="dialog"] [aria-label="Dismiss"]')
  /* the banner's node stays for the edge's whole spring (.62 s, with the bounce — 17.09.2026), its
     glass gone in 140 ms; the assertion is about the node */
  await p.waitForTimeout(900)
  await shot('22-publish-hint-dismissed')
  check('the ✕ takes the banner down', !(await hint()))
  check('…and the panel keeps its width doing it',
    (await p.$eval('[role="dialog"][aria-label="Publish"]', (el) => el.getBoundingClientRect().width)) === wide)
  check('the title stays the status until the site is actually live', (await title()) === 'Not published')
  /* pressing Publish is what changes the answer */
  await p.click('[role="dialog"] button:has-text("Publish")')
  await p.waitForTimeout(400)
  /* PUBLISHING TAKES A MOMENT (designer, 16.09.2026): for PUBLISHING_MS the blue button holds
     a turning white arc and its word wears the white sweep — and it cannot be pressed again */
  const busy = await p.evaluate(() => {
    const b = document.querySelector('[role="dialog"][aria-label="Publish"] button[aria-busy="true"]')
    if (!b) return null
    const svg = b.querySelector('svg'); const arc = svg?.querySelector('path'); const word = b.querySelector('.busy-ink')
    const cs = word ? getComputedStyle(word) : null
    return { disabled: b.disabled, bg: getComputedStyle(b).backgroundColor, spinner: !!svg && Math.round(svg.getBoundingClientRect().width) === 24,
      spinning: !!arc && getComputedStyle(arc).animationName === 'step-spin', arcInk: arc ? getComputedStyle(arc).stroke : null,
      clip: cs?.backgroundClip, sweep: cs?.animationName, base: cs?.getPropertyValue('--sh-base').trim(), text: b.innerText.trim(),
      padL: getComputedStyle(b).paddingLeft, gap: getComputedStyle(b).columnGap }
  })
  check('the press does not publish at once: the blue button holds a turning white arc (24 box, pl 12, 8 to the word) and its word wears the white sweep — and cannot be pressed twice',
    !!busy && busy.disabled && busy.bg === 'rgb(21, 135, 255)' && busy.spinner && busy.spinning && busy.arcInk === 'rgb(255, 255, 255)' && busy.clip === 'text' && busy.sweep === 'sh-sweep' && /^rgba\(255, 255, 255, 0?\.56\)$/.test(busy.base) && busy.text === 'Publish' && busy.padL === '12px' && busy.gap === '8px',
    JSON.stringify(busy))
  check('…and the title has not changed yet', (await title()) === 'Not published')
  await p.waitForTimeout(2600)
  await shot('23-publish-done')
  /* ⚠️ `Published`, not `Publish` (designer, 14.09.2026; board 30282:53241): the press just
     emptied the queue, so the heading is the status, not the action. */
  check('publishing retitles the panel and leaves no nudge',
    (await title()) === 'Published' && !(await hint()), await title())

  /*
   * ⚠️ THE DOMAIN CARD IS THE BODY CARD'S LAST CHILD, not a sibling of it.
   *
   * This is the one the designer had to say five times (14.09.2026), and no width ever
   * caught it: as a sibling the card is still 420 and still flush against the card above,
   * but two radius-16 corners meet and leave a dark wedge — a GAP where board 30282:19132
   * has a SEAM. Measured by PARENT, because that is the thing that was wrong; and by the
   * field beside it, which is 388 only because the block holding it carries the px 16 this
   * card does not.
   */
  await openPublish('p=built&u=1&v=true&d=live&n=adovasio.com&a=paid&t=22&c=640')
  const seam = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
    /* ⚠️ FOUND BY CONTENT, NEVER BY COLOUR. This selector matched a baked hex, then a
       token, and each time the value moved the selector found NOTHING and took the whole
       run down with a TypeError — a check that dies when the thing it guards changes is
       worse than no check. The card is the one holding `Unlink`; its colour is asserted
       separately below, so a change is REPORTED instead of fatal. */
    /* …and since 16.09.2026 the stroke is an INSET SHADOW, not a border (board 30282:19216:
       420 × 64 with the 1px stroke inside — a CSS border made the row 66), so the row is the
       420-wide box holding Unlink whose box-shadow is an inset ring. */
    /* the INNERMOST such box: the body card is also 420 wide, also holds "Unlink" in its text and
       also wears an inset ring (its own rim), so the outermost match would be the wrong card */
    const rimCands = [...d.querySelectorAll('div')].filter((e) => /Unlink|Відв/.test(e.textContent || '')
      && /inset/.test(getComputedStyle(e).boxShadow) && Math.round(e.getBoundingClientRect().width) === 420
      && e.getBoundingClientRect().height < 100)
    const rim = rimCands.find((e) => !rimCands.some((o) => o !== e && e.contains(o)))
    /* the ring is the comma-separated shadow that says `inset` — Tailwind's shadow utility
       prints two transparent ring placeholders before it */
    const insetParts = (el) => getComputedStyle(el).boxShadow.split(/,(?![^(]*\))/).map((part) => part.trim()).filter((part) => /inset/.test(part))
    /* the RING (spread 1px) and the TOP HAIRLINE (offset 1px down, no spread) — two strokes since
       16.09.2026 night: «разделительную линию цветом 353538… только у верхней части этого блока» */
    const ringPart = (el) => insetParts(el).find((part) => /0px 0px 0px 1px inset/.test(part)) || ''
    const topPart = (el) => insetParts(el).find((part) => /0px 1px 0px 0px inset/.test(part)) || ''
    const insetPart = ringPart
    const body = [...d.querySelectorAll('div')].find((e) => getComputedStyle(e).backgroundColor === 'rgba(255, 255, 255, 0.04)')
    const field = [...d.querySelectorAll('p')].find((e) => e.textContent === 'Website URL').parentElement.querySelector('div')
    const w = (el) => Math.round(el.getBoundingClientRect().width)
    /* ⚠️ THROUGH THE REVEAL, NOT PAST IT. The row unfolds inside ui/Reveal.tsx (clip › sizer ›
       glass), so its DOM parent is a wrapper. What the designer's five corrections were
       about is the PAINT — no wedge, one surface split by a line — and that survives only
       if every box between the row and the body card paints nothing: no fill, no rim, no
       padding, no margin. So that is what is asserted, plus that the row is still what the
       body card ENDS with. */
    const clear = (el, root) => {
      let e = el.parentElement
      while (e && e !== root) {
        const cs = getComputedStyle(e)
        if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderTopWidth !== '0px' || cs.padding !== '0px' || cs.margin !== '0px') return false
        e = e.parentElement
      }
      return e === root
    }
    return {
      parented: clear(rim, body) && body.lastElementChild.contains(rim),
      seamColour: (insetPart(rim).match(/rgba?\([^)]+\)/) || [null])[0],
      seamRing: insetPart(rim).replace(/rgba?\([^)]+\)\s*/, '').trim(),
      topColour: (topPart(rim).match(/rgba?\([^)]+\)/) || [null])[0],
      topLine: topPart(rim).replace(/rgba?\([^)]+\)\s*/, '').trim(),
      insetCount: insetParts(rim).length,
      rowH: +rim.getBoundingClientRect().height.toFixed(2), rowPad: getComputedStyle(rim).padding, rowBorder: getComputedStyle(rim).borderTopWidth,
      card: w(rim), body: w(body), field: w(field),
      flush: Math.round(rim.getBoundingClientRect().bottom) === Math.round(body.getBoundingClientRect().bottom),
    }
  })
  check('the domain card is a CHILD of the body card, ending on its own bottom edge',
    seam.parented && seam.flush, JSON.stringify(seam))
  check('…and so it spans 420 where the field spans 388',
    seam.card === 420 && seam.body === 420 && seam.field === 388, JSON.stringify(seam))
  /*
   * ⚠️ AND THE SEAM IS `#313133`, THE BOARD'S RAW HEX — the designer settled this against
   * my own arithmetic (15.09.2026): 8% white over the panel's ground flattens to exactly
   * that, so the hex LOOKS derived, but board 30289:60056 leaves this stroke bound to no
   * variable while binding everything else in the card. Δ10 against the body card's fill
   * is the design: a seam, not a line.
   */
  check('…and its seam is the board’s #313133, not a composited token',
    seam.seamColour === 'rgb(49, 49, 51)', seam.seamColour)
  check('…drawn as a 1px INSET ring, so the row is the board’s 420 × 64 with its content at 16 / 16 / 16 / 18 — a CSS border made it 66 (16.09.2026)',
    seam.seamRing === '0px 0px 0px 1px inset' && seam.rowBorder === '0px' && seam.rowH === 64 && seam.rowPad === '16px 16px 16px 18px',
    JSON.stringify({ ring: seam.seamRing, border: seam.rowBorder, h: seam.rowH, pad: seam.rowPad }))
  check('…and its TOP edge alone is the designer’s #353538 — a second inset hairline (offset 1px, no spread) over the ring; sides and bottom stay #313133 (16.09.2026, night)',
    seam.insetCount === 2 && seam.topColour === 'rgb(53, 53, 56)' && seam.topLine === '0px 1px 0px 0px inset',
    JSON.stringify({ count: seam.insetCount, top: seam.topColour, line: seam.topLine }))

  /*
   * ⚠️ THE CONFIRM SCRIM IS 70%, AGAINST ITS OWN BOARD'S 50% (designer, 15.09.2026:
   * «можно чуть сильнее затемнять фон, чтобы каши такой не было»). Guarded here because
   * the board says 50 and a future session reading 30282:51628 would "fix" it back: at 50
   * the canvas keeps full-strength colour under a question, and the product's other
   * app-modal — the checkout sheet — has always been 70. Cancel is asserted too: a
   * confirm that unlinks anyway is worse than no confirm.
   */
  await p.click('[role="dialog"][aria-label="Publish"] button:has-text("Unlink")')
  await p.waitForTimeout(500)
  const dlg = await p.evaluate(() => {
    const sheet = document.querySelector('[role="alertdialog"]')
    if (!sheet) return { err: 'no dialog' }
    let scrim = sheet.parentElement
    while (scrim && getComputedStyle(scrim).backgroundColor === 'rgba(0, 0, 0, 0)') scrim = scrim.parentElement
    return {
      title: sheet.getAttribute('aria-label'),
      scrim: getComputedStyle(scrim).backgroundColor,
      covers: Math.round(scrim.getBoundingClientRect().width) === window.innerWidth,
    }
  })
  check('Unlink asks first, over a scrim that covers the whole shell at 70% black',
    dlg.scrim === 'rgba(0, 0, 0, 0.7)' && dlg.covers && /^Disconnect /.test(dlg.title || ''), JSON.stringify(dlg))
  await p.click('[role="alertdialog"] button:has-text("Cancel")')
  await p.waitForTimeout(400)
  const afterCancel = await p.evaluate(() => ({
    gone: !document.querySelector('[role="alertdialog"]'),
    field: document.querySelector('[role="dialog"][aria-label="Publish"] input, [role="dialog"][aria-label="Publish"] p')
      ? document.querySelector('[role="dialog"][aria-label="Publish"]').innerText
      : '',
  }))
  check('…and Cancel leaves the domain where it was',
    afterCancel.gone && /adovasio\.com/.test(afterCancel.field), JSON.stringify({ gone: afterCancel.gone }))

  await p.keyboard.press('Escape')
  await p.waitForTimeout(400)

  /*
   * ⚠️ THE DOMAINS HEADER COLLAPSES AS A FUNCTION OF THE SCROLL (designer, 15.09.2026:
   * «заголовок прятался, сначала он уменьшался, а потом уходил плавно в прозрачность…
   * оставался прибитым к верху только поиск»). The assertion that matters is the LAST
   * one: the answer may move ONLY with the scroll. A collapsing header that hands the
   * scroller its band in one commit makes every row jump by that band at an unchanged
   * scrollTop — the picker's rewrite of 26.08.2026 exists because of exactly that, and
   * this header carries its law rather than a second mechanism.
   */
  await openPublish('p=built&u=1&v=true&a=paid&t=22&c=640')
  await p.click('[role="dialog"][aria-label="Publish"] button:has-text("Buy or connect a domain")')
  await p.waitForTimeout(900)
  await p.fill('input[placeholder^="Search a name"]', 'maplewood')
  await p.keyboard.press('Enter')
  await p.waitForTimeout(1100)
  await p.evaluate(() => {
    window.__ansScroll = () => {
      let el = [...document.querySelectorAll('h3')].find((e) => /^Featured$/.test((e.textContent || '').trim()))
      while (el && !(el.scrollHeight - el.clientHeight > 40 && /auto|scroll/.test(getComputedStyle(el).overflowY))) el = el.parentElement
      return el
    }
    window.__head = () => {
      const h = [...document.querySelectorAll('div')].find((e) => e.style.height
        && e.className.includes('pointer-events-none') && e.className.includes('absolute') && e.querySelector('h2'))
      const hb = h.getBoundingClientRect()
      const [plate, rule, inner] = h.children
      const title = inner.querySelector('h2'), pill = inner.lastElementChild
      const row = [...document.querySelectorAll('h3')].find((e) => /^Featured$/.test((e.textContent || '').trim()))
      return {
        pos: Math.round(window.__ansScroll().scrollTop),
        headH: Math.round(hb.height),
        foot: Math.round(plate.getBoundingClientRect().bottom - hb.top),
        rule: Math.round(rule.getBoundingClientRect().top - hb.top),
        pill: Math.round(pill.getBoundingClientRect().top - hb.top),
        titleTop: +(title.getBoundingClientRect().top - hb.top).toFixed(2),
        op: +getComputedStyle(title).opacity,
        tf: getComputedStyle(title).transform,
        rowY: +row.getBoundingClientRect().top.toFixed(2),
      }
    }
  })
  const head0 = await p.evaluate(() => window.__head())
  check('the domains header rests on the board’s 185 with the pill at 105 and no inline transform',
    head0.headH === 185 && head0.pill === 105 && head0.foot === 185 && head0.tf === 'none' && head0.op === 1,
    JSON.stringify(head0))
  const track = [head0]
  for (let i = 0; i < 14; i++) {
    await p.evaluate(() => { window.__ansScroll().scrollTop += 8 })
    await p.waitForTimeout(80)
    track.push(await p.evaluate(() => window.__head()))
  }
  let slip = 0
  for (let i = 1; i < track.length; i++) {
    slip = Math.max(slip, Math.abs((track[i].rowY - track[i - 1].rowY) + (track[i].pos - track[i - 1].pos)))
  }
  check('…and the answer under it moves ONLY with the scroll', slip < 0.6, JSON.stringify({ slip }))
  const fading = track.filter((r) => r.op > 0.02 && r.op < 0.98)
  check('…the title shrinks BEFORE it fades, and is gone before the top edge cuts it',
    fading.length >= 2 && fading.every((r) => Number(/matrix\(([-\d.]+)/.exec(r.tf)[1]) < 0.95)
    && track.every((r) => r.op < 0.02 || r.titleTop > -1),
    JSON.stringify(fading.map((r) => ({ pos: r.pos, op: +r.op.toFixed(2) }))))
  await p.evaluate(() => { window.__ansScroll().scrollTop += 400 })
  await p.waitForTimeout(150)
  const headEnd = await p.evaluate(() => window.__head())
  check('…and it lands with only the search pinned: pill 8, plate 88, title gone',
    headEnd.pill === 8 && headEnd.foot === 88 && headEnd.op === 0, JSON.stringify(headEnd))
  await p.keyboard.press('Escape')
  await p.waitForTimeout(500)

  /*
   * ⚠️ THE EXPLANATION BOX IS A FULL-WIDTH DIVIDER, NOT AN INSET BOX (board 30289:60956,
   * read the day the designer complained the dividing border was wrong). Its stroke lies
   * ON the progress card's, so the line under the headline runs wall to wall; inset by the
   * card's own border it drew a 2px rail down both sides and along the bottom — the double
   * border this project has now been bitten by three times.
   */
  await openPublish('p=built&u=0&v=false&d=ready&n=fit-ration.com&a=paid&t=22&c=640')
  const divider = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
    const box = [...d.querySelectorAll('div')].find((e) => getComputedStyle(e).borderTopColor === 'rgb(73, 73, 76)')
    /* the card is the first BORDERED ancestor: the box sits in a keyed group inside the card
       (its words hand over there, PublishPanel `ProgressCard`), and the group draws nothing */
    let card = box.parentElement
    while (card && getComputedStyle(card).borderTopWidth === '0px') card = card.parentElement
    const r = (el) => { const b = el.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right), b: Math.round(b.bottom), w: Math.round(b.width) } }
    const t = box.querySelector('p').getBoundingClientRect()
    return { box: r(box), card: r(card), textFromCard: Math.round(t.left - card.getBoundingClientRect().left), measure: Math.round(t.width) }
  })
  check('the explanation box spans the progress card wall to wall, stroke on stroke',
    divider.box.w === 408 && divider.card.w === 408
    && divider.box.l === divider.card.l && divider.box.r === divider.card.r
    && divider.box.b === divider.card.b, JSON.stringify(divider))
  check('…with the board’s own inset: text 17 in from the card, measure 374',
    divider.textFromCard === 17 && divider.measure === 374, JSON.stringify(divider))
  /* VISITORS sit where board 30289:59982 seats them: `pt 19`, and `pr 16` off the panel
     edge on top of the button's own `pr 16` — not centred and not flush. */
  const seat = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
    const pill = d.querySelector('h3').parentElement.lastElementChild
    const pb = pill.getBoundingClientRect(), db = d.getBoundingClientRect()
    return { top: Math.round(pb.top - db.top), right: Math.round(db.right - pb.right), h: Math.round(pb.height) }
  })
  check('the visitors pill hangs at pt 19 with 16 off the panel’s edge',
    seat.top === 19 && seat.right === 16 && seat.h === 32, JSON.stringify(seat))
  await p.keyboard.press('Escape')
  await p.waitForTimeout(400)

  /*
   * ⚠️ WHICH ADDRESS THE PANEL PRINTS, STATE BY STATE (designer, 15.09.2026: «когда
   * происходит пропагейтинг, кастомный домен уже по факту подключен, а это значит что
   * отображается в этом окне уже кастомный домен!»).
   *
   * The rule is his of 14.09 — swap to the custom name once it is ATTACHED — applied where
   * he draws that line: `provisioning` and `connecting` are the attaching, `propagating` is
   * the address spreading, so the swap happens at `propagating`. The letter being owed no
   * longer holds the free address in the field: the amber card under it is what says the
   * name does not open yet, and it is on screen in every state that can produce that.
   * Checked as a table because the two halves used to be one predicate and drifted.
   */
  for (const [q, expect, label] of [
    ['d=provisioning&k=true&n=fitration.shop&v=false&u=0', 'staging', 'the registry still has the order'],
    ['d=propagating&k=true&n=fitration.shop&v=false&u=0', 'custom', 'the address is spreading'],
    ['d=ready&k=true&n=fitration.shop&v=false&u=0', 'custom', 'set up, waiting on the letter'],
    ['d=live&n=fitration.shop&v=true&u=0', 'custom', 'live and confirmed'],
  ]) {
    await openPublish(`p=built&a=paid&${q}`)
    const seen = await p.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
      const field = [...d.querySelectorAll('div')].find((e) => Math.round(e.getBoundingClientRect().width) === 388)
      return {
        field: field.innerText.replace(/\s+/g, ''),
        mail: /One last step for/.test(d.innerText),
      }
    })
    const custom = /fitration\.shop$/.test(seen.field)
    const staging = /remixer\.ai$/.test(seen.field)
    check(`the field prints the ${expect} address — ${label}`,
      expect === 'custom' ? custom : staging, JSON.stringify(seen))
    await p.keyboard.press('Escape')
    await p.waitForTimeout(300)
  }
  /*
   * ⚠️ THE UNLINK CARD HANGS ON THE CONNECTION TOO (designer, 15.09.2026: «нам нужно на
   * этой стадии под уведомлением о почте показать этот элемент с кнопкой для отвязки»),
   * and it sits UNDER the letter's card as the body card's last child. Before this a
   * domain that was connected, set up and merely waiting on a letter could not be taken
   * off the site from the window that owns the connection.
   *
   * The status half of that row is the DOMAIN'S WORD, as the `Recommended` chip dyed in
   * the status tone (designer, 16.09.2026: form C of `scratchpad/slot-stand/`, «стекла в
   * цвет статуса … и текст … оттенков статуса»). `Secure padlock on` is gone from the
   * whole panel (his own ruling of 15.09), and the `● Live` dot-and-word form that came
   * between is gone too: his screenshot showed two identical green dots in one column
   * reading as a two-item list. So per state this asserts the word, the tone attribute,
   * that fill, rim AND ink are dyed (not the neutral chip with green writing), and — on the
   * live panel — that the ONLY 8px dot left is the bar's.
   */
  /* the ink per tone — `ready` reads in `--action-ink` #51a6ff (designer, 16.09.2026), not the glass's `--action` */
  const INK = { working: 'rgb(229, 195, 89)', stuck: 'rgb(239, 68, 68)', ready: 'rgb(81, 166, 255)', live: 'rgb(72, 186, 121)' }
  for (const [q, want, label, chip] of [
    ['d=provisioning&k=true&n=fitration.shop&v=false&u=0', false, 'not while the registry has the order', null],
    /* ⚠️ Since 16.09.2026 (board 30425:28847) the row stays DOWN while the letter is owed:
       Unlink lives inside the letter's card then, and the word with it. */
    ['d=propagating&k=true&n=fitration.shop&v=false&u=0', false, 'not while the letter is owed — Unlink lives in the letter (30425:28847)', null],
    ['d=ready&n=fitration.shop&v=false&u=0', true, 'yes once it is connected, waiting on the press', ['Ready', 'ready']],
    ['d=ready&k=true&n=fitration.shop&v=false&u=0', false, 'not while the letter is owed, even set up — Unlink is in the letter', null],
    ['d=live&n=fitration.shop&v=true&u=0', true, 'yes on a live domain', ['Live', 'live']],
    ['d=unreachable&n=fitration.shop&v=true&u=0', true, 'yes when it stopped answering', ['Not responding', 'stuck']],
    ['d=old-site&i=dh-in-use&n=fitration.shop&v=true&u=0', true, 'yes while an older site sits on it', ['Showing your old site', 'stuck']],
  ]) {
    await openPublish(`p=built&a=paid&${q}`)
    const row = await p.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
      /* the row's stroke is an inset ring since 16.09.2026 (board 30282:19216, 420 × 64); take the
         INNERMOST 420-wide inset-ringed box holding Unlink — the body card matches too */
      const cardCands = [...d.querySelectorAll('div')].filter((e) => /Unlink|Відв/.test(e.textContent || '')
        && /inset/.test(getComputedStyle(e).boxShadow) && Math.round(e.getBoundingClientRect().width) === 420
        && e.getBoundingClientRect().height < 100)
      const card = cardCands.find((e) => !cardCands.some((o) => o !== e && e.contains(o)))
      const mail = [...d.querySelectorAll('div')].find((e) => /^One last step for/.test((e.textContent || '').trim()))
      const body = [...d.querySelectorAll('div')].find((e) => getComputedStyle(e).backgroundColor === 'rgba(255, 255, 255, 0.04)')
      const clear = (el, root) => {
        let e = el.parentElement
        while (e && e !== root) {
          const cs = getComputedStyle(e)
          if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderTopWidth !== '0px' || cs.padding !== '0px' || cs.margin !== '0px') return false
          e = e.parentElement
        }
        return e === root
      }
      const unlinkBtn = card ? [...card.querySelectorAll('button')].find((e) => /Unlink|Відв/.test(e.textContent || '')) : null
      return {
        card: !!card,
        parented: card ? clear(card, body) && body.lastElementChild.contains(card) : null,
        belowMail: card && mail ? Math.round(card.getBoundingClientRect().top - mail.getBoundingClientRect().bottom) : null,
        padlock: /Secure padlock on/.test(d.innerText),
        /* one verb, one colour: grey in the row as in the letter (designer, 16.09.2026: «ёлка рождественская») */
        unlinkInk: unlinkBtn ? getComputedStyle(unlinkBtn).color : null,
      }
    })
    check(`the Unlink row is there: ${label}`, row.card === want && !row.padlock, JSON.stringify(row))
    if (want) {
      check('…as the body card’s last child, under whatever card is above it',
        row.parented && (row.belowMail === null || row.belowMail === 16), JSON.stringify(row))
      check('…and its `Unlink` is grey, as in the letter — not the board’s amber (designer, 16.09.2026)',
        row.unlinkInk === 'rgba(255, 255, 255, 0.56)', JSON.stringify({ unlinkInk: row.unlinkInk }))
      const seen = await p.evaluate(() => {
        const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
        const btn = [...d.querySelectorAll('button')].find((b) => /^(Unlink|Відв)/.test(b.textContent.trim()))
        const rowEl = btn.parentElement
        const el = rowEl.querySelector('.liquid-glass--chip[data-tone]')
        if (!el) return { chip: null }
        const cs = getComputedStyle(el), rim = getComputedStyle(el, '::before')
        /* the dot lives INSIDE the pill (designer, 16.09.2026): 8px, in the tone, and 8 from the
           left edge, 8 from the top, 8 to the word — one number three times */
        const dot = el.querySelector('.h-2.w-2.rounded-full')
        const label = el.querySelector('.chip-label')
        const cb = el.getBoundingClientRect(), db = dot?.getBoundingClientRect(), lb = label?.getBoundingClientRect()
        return {
          chip: { word: el.textContent.trim(), tone: el.dataset.tone },
          ink: cs.color,
          fillDyed: cs.backgroundColor !== 'rgba(255, 255, 255, 0.08)' && cs.backgroundColor !== 'rgba(0, 0, 0, 0)',
          /* the rim is the lit badge glass (radial streaks) in the tone — no pure white anywhere in it */
          rimDyed: /radial-gradient/.test(rim.backgroundImage) && !/rgba\(255, 255, 255/.test(rim.backgroundImage) && !/rgb\(255, 255, 255\)/.test(rim.backgroundImage),
          h: Math.round(el.getBoundingClientRect().height),
          dot: dot && db && lb ? {
            color: getComputedStyle(dot).backgroundColor, size: Math.round(db.width),
            left: Math.round(db.left - cb.left), top: Math.round(db.top - cb.top), gap: Math.round(lb.left - db.right),
          } : null,
          rowDotsOutside: [...rowEl.querySelectorAll('.h-2.w-2.rounded-full')].filter((n) => !el.contains(n)).length,
          panelDotsOutside: [...d.querySelectorAll('.h-2.w-2.rounded-full')].filter((n) => !el.contains(n)).length,
          /* the chip sits in a slot (its word hands over inside it, PublishPanel), and the slot is first */
          first: rowEl.firstElementChild === el || rowEl.firstElementChild.contains(el),
        }
      })
      check(`…and its word is the domain’s: ${chip[0]} in ${chip[1]}`,
        seen.chip && seen.chip.word === chip[0] && seen.chip.tone === chip[1], JSON.stringify(seen.chip))
      check('…as the Recommended chip dyed in the tone — fill, rim and ink, 24 high, first in the row',
        seen.ink === INK[chip[1]] && seen.fillDyed && seen.rimDyed && seen.h === 24 && seen.first, JSON.stringify(seen))
      check('…its dot inside the pill: 8px in the tone, 8 from the edge, 8 from the top, 8 to the word',
        !!seen.dot && seen.dot.color === INK[chip[1]] && seen.dot.size === 8 && seen.dot.left === 8 && seen.dot.top === 8 && seen.dot.gap === 8,
        JSON.stringify(seen.dot))
      check('…and no loose dot beside it — outside the pill, the bar keeps the panel’s only one',
        seen.rowDotsOutside === 0 && (chip[1] !== 'live' || seen.panelDotsOutside === 1),
        JSON.stringify({ rowDotsOutside: seen.rowDotsOutside, panelDotsOutside: seen.panelDotsOutside }))
    }
    await p.keyboard.press('Escape')
    await p.waitForTimeout(300)
  }

  /* …and the letter is announced from the beat the domain is connected, not before it */
  /*
   * THE PANEL MOVES, IT DOES NOT JUMP (designer, 16.09.2026, from a recording of the walk:
   * «внутри формы появляются и исчезают объекты, и высота формы резко меняется… нужно чтобы оно
   * не резко прыгало, а плавно и красиво с плавной анимацией меняло высоту»). ui/Reveal.tsx:
   * every block unfolds and folds on a measured height spring, so the panel's bottom edge
   * travels through intermediate heights instead of snapping. Driven from the prototype
   * console, which the panel's outside-click closer now leaves alone — the second thing
   * asserted here, because it is what lets a designer watch the walk at all.
   */
  {
    await openPublish('p=built&a=paid&d=connecting&k=true&n=fit-ration.net&v=false&u=0&t=22&c=640')
    const panelSel = '[role="dialog"][aria-label="Publish"]'
    const h = () => p.$eval(panelSel, (el) => el.getBoundingClientRect().height)
    const before = await h()
    await p.keyboard.press('Control+.')
    await p.waitForTimeout(500)
    check('the prototype console opens without closing the panel', !!(await p.$(panelSel)))
    /* a block that is up when the panel opens came in with the panel — no glint of its own */
    check('a card that is up when the panel opens wears no arrival glint',
      (await p.$$eval(`${panelSel} .card-arrive`, (els) => els.length)) === 0)
    /*
     * THE WORLD MOVES TO THE SPREADING BEAT. The in-flight card's words hand over; its
     * explanation stands open for FIVE SECONDS with the letter held back (board 30425:28847,
     * designer 16.09.2026: «пока описание для Propagating раскрыто эти 5 секунд, мы не
     * показываем One last step, чтобы не создавать каши»); then the explanation FOLDS and,
     * after it, the letter UNFOLDS below the field. Sampled through all of it.
     */
    const trace = await p.evaluate(async () => {
      const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
      const btn = [...document.querySelectorAll('[data-console] button')].find((b) => b.textContent.trim() === 'Propagating (bought)')
      const samples = []
      const t0 = performance.now()
      const tick = () => { const now = performance.now(); samples.push({ t: Math.round(now - t0), h: +d.getBoundingClientRect().height.toFixed(1), sub: /updating across the web/.test(d.innerText), letter: /One last step/.test(d.innerText) }); if (now - t0 < 7400) requestAnimationFrame(tick) }
      requestAnimationFrame(tick)
      btn.click()
      await new Promise((r) => setTimeout(r, 7500))
      return samples
    })
    check('…and the console still moves the world while the panel stays open', !!(await p.$(panelSel)))
    const early = trace.filter((s) => s.t > 300 && s.t < 4500)
    check('for the first five seconds of the spreading beat the explanation stands open and the letter is held back (board 30425:28847)',
      early.length > 40 && early.every((s) => s.sub && !s.letter), JSON.stringify({ n: early.length, subAll: early.every((s) => s.sub), letterAny: early.some((s) => s.letter) }))
    const h0 = trace[0].h, h1 = trace[trace.length - 1].h
    const foldStart = trace.find((s) => s.t > 4500 && s.h < h0 - 2)
    const letterAt = trace.find((s) => s.letter)
    const hFolded = Math.min(...trace.filter((s) => s.t > 4500).map((s) => s.h))
    check('…then, at five seconds, the explanation folds FIRST and the letter unfolds AFTER it — two motions in sequence, not one pile',
      !!foldStart && !!letterAt && foldStart.t >= 4700 && foldStart.t <= 5700 && letterAt.t > foldStart.t && hFolded < h0 - 60,
      JSON.stringify({ h0, foldStart: foldStart?.t, letterAt: letterAt?.t, hFolded, h1 }))
    const between = trace.filter((s) => s.t > 4500 && s.h > hFolded + 2 && s.h < h1 - 2)
    const settled = trace.filter((s) => s.t > 7000).every((s) => Math.abs(s.h - h1) < 1)
    check('the panel’s height TRAVELS to its new size — through intermediate frames, never in one snap',
      between.length >= 6 && h1 > h0 + 100, JSON.stringify({ intermediate: between.length, h0, hFolded, h1 }))
    check('…and has settled by the end', settled, JSON.stringify(trace.filter((s) => s.t > 7000).slice(0, 3)))
    /* the block that arrived carries the glint; the card that stayed does not */
    const glints = await p.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
      return [...d.querySelectorAll('.card-arrive')].map((e) => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 24))
    })
    check('the block that ARRIVED wears the glint — the letter — and the in-flight card that stayed does not',
      glints.length === 1 && /One last step/.test(glints[0]), JSON.stringify(glints))
    /* the in-flight card is one element: the same node before and after the stage changed */
    const sameCard = await p.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
      const card = d.querySelector('.shimmer-card')
      window.__card = card
      return { text: card?.innerText.replace(/\s+/g, ' ').slice(0, 30) }
    })
    /*
     * THE VERB ROLLS, THE NAME STAYS, THE ARC IS NEVER TOUCHED (designer, 16.09.2026, on a
     * recording of this very hand-over: «выглядит просто как блимание в 1 кадр… как эту смену
     * текста сделать более аккуратной и плавной и изящной?», and his pick from the stand of four,
     * variant B: «меняется только глагол, имя стоит»). The recording's blink was the whole row —
     * arc included — fading to nothing between a 120 ms out and a 200 ms in. Film the hand-over
     * frame by frame: the arc's node and opacity, the host's node and glide, both verbs' rolls.
     */
    const roll = await p.evaluate(async () => {
      const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
      const row = d.querySelector('.shimmer-hue')
      const line = row.querySelector('p')
      const arc0 = row.querySelector('path.step-spin')
      const host0 = [...line.querySelectorAll('.shimmer-seg')].find((s) => /\./.test(s.textContent))
      const samples = []
      const t0 = performance.now()
      const tick = () => {
        const now = performance.now()
        const arc = row.querySelector('path.step-spin')
        const segs = [...line.querySelectorAll('.shimmer-seg')].map((s) => {
          const cs = getComputedStyle(s)
          const m = cs.transform === 'none' ? [0, 0] : cs.transform.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number).slice(4)
          return { text: s.textContent.trim(), op: +cs.opacity, x: m[0], y: m[1], abs: cs.position === 'absolute', host: s === host0 }
        })
        samples.push({ t: Math.round(now - t0), arcSame: arc === arc0, arcOp: arc ? +getComputedStyle(arc.parentElement.parentElement).opacity : 0, segs })
        if (now - t0 < 700) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
      ;[...document.querySelectorAll('[data-console] button')].find((b) => b.textContent.trim() === 'Connecting').click()
      await new Promise((r) => setTimeout(r, 900))
      return samples
    })
    const oldVerb = (s) => s.segs.find((g) => /^Propagating/.test(g.text))
    const newVerb = (s) => s.segs.find((g) => /^Connecting/.test(g.text))
    const hostSeg = (s) => s.segs.find((g) => g.host)
    const outFrames = roll.filter((s) => oldVerb(s))
    const inFrames = roll.filter((s) => newVerb(s))
    check('the arc is ONE node through the hand-over and never dims — the recording\'s blink was this arc fading with the words',
      roll.length > 20 && roll.every((s) => s.arcSame && s.arcOp === 1), JSON.stringify({ frames: roll.length, dims: roll.filter((s) => !s.arcSame || s.arcOp < 1).length }))
    check('the host is the same node throughout and GLIDES to its new x on a layout transform — never re-created, never dimmed',
      roll.every((s) => hostSeg(s) && hostSeg(s).op === 1) && roll.some((s) => Math.abs(hostSeg(s).x) > 1) && Math.abs(hostSeg(roll[roll.length - 1]).x) < 0.5,
      JSON.stringify({ glide: roll.slice(0, 6).map((s) => +hostSeg(s).x.toFixed(1)), end: hostSeg(roll[roll.length - 1]).x }))
    check('the old verb rolls UP and out — popped out of the flow, y → −8, gone within 300 ms — while the new one rolls up INTO place from 10 px below after a 60 ms beat',
      outFrames.length > 4 && outFrames.every((s) => oldVerb(s).abs) && Math.min(...outFrames.map((s) => oldVerb(s).y)) < -6 && outFrames[outFrames.length - 1].t < 300
        && newVerb(inFrames[0]).y > 8 && newVerb(inFrames[0]).op < 0.05 && inFrames.some((s) => s.t >= 30 && s.t <= 100 && newVerb(s).op < 0.05)
        && Math.abs(newVerb(roll[roll.length - 1]).y) < 0.5 && newVerb(roll[roll.length - 1]).op === 1,
      JSON.stringify({ outLast: outFrames[outFrames.length - 1], inFirst: newVerb(inFrames[0]), inLast: newVerb(roll[roll.length - 1]) }))
    check('…the two verbs CROSS mid-roll — no frame leaves the line empty — and the arriving one lands monotonically: no zero once it is up (the WAAPI hand-back frame, kept off the main thread\'s way)',
      roll.every((s) => Math.max(oldVerb(s)?.op ?? 0, newVerb(s)?.op ?? 0) >= 0.3)
        && (() => { const up = inFrames.findIndex((s) => newVerb(s).op >= 0.9); return up > 0 && inFrames.slice(up).every((s) => newVerb(s).op >= 0.9) })(),
      JSON.stringify(roll.filter((s) => s.t < 420).map((s) => [s.t, +(oldVerb(s)?.op ?? 0).toFixed(2), +(newVerb(s)?.op ?? 0).toFixed(2)])))
    /*
     * THE ARC IS THE SATURATED TWIN OF THE TEXT'S HUE (designer, 16.09.2026: «конкретно в спинере
     * цвета более яркие и насыщенные» — A66FFF · 5077FE · FF8363 — and, on the text: «трогать
     * цвета не нужно, они не должны быть яркими такими насыщенными»). Two registered hues on the
     * row, one clock: park both in each of the three holds and read the pair.
     */
    const twins = await p.evaluate(async () => {
      const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
      const row = d.querySelector('.shimmer-hue')
      const arc = row.querySelector('path.step-spin')
      const anims = row.getAnimations().filter((a) => /^sh-(hue|arc)$/.test(a.animationName))
      const delay = anims[0]?.effect.getComputedTiming().delay ?? 0
      const was = anims.map((a) => a.currentTime)
      const start = performance.now()
      const out = []
      /* ⚠️ a CSS animation with a NEGATIVE delay is in its BEFORE phase at any negative local
         time (before-active boundary = max(delay, 0)) — the effect is simply not applied and
         the initial values show. Seek to the hold a whole number of 8.1 s cycles later, so the
         local time is positive and the progress is the hold's. */
      for (const hold of [500, 3200, 5900]) {
        const seek = hold + delay + 8100 * Math.max(0, Math.ceil(-(hold + delay) / 8100))
        anims.forEach((a) => { a.pause(); a.currentTime = seek })
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        out.push({ hue: getComputedStyle(row).getPropertyValue('--sh-hue').trim(), arc: getComputedStyle(row).getPropertyValue('--sh-arc').trim(), stroke: getComputedStyle(arc).stroke })
      }
      /* back in step with the page clock, as if never touched */
      anims.forEach((a, i) => { a.currentTime = was[i] + (performance.now() - start); a.play() })
      return { names: anims.map((a) => a.animationName).sort(), delays: [...new Set(anims.map((a) => a.effect.getComputedTiming().delay))].length, out }
    })
    const PASTEL = ['rgb(164, 185, 255)', 'rgb(202, 170, 254)', 'rgb(254, 187, 170)']
    const VIVID = ['rgb(80, 119, 254)', 'rgb(166, 111, 255)', 'rgb(255, 131, 99)']
    check('the arc\'s stroke is the SATURATED twin of the headline\'s hue — two hue clocks on one delay, and in every hold the pair is blue/blue, violet/lilac, coral/peach, the text keeping the board\'s pastels',
      twins.names.join() === 'sh-arc,sh-hue' && twins.delays === 1 && twins.out.length === 3 && twins.out.every((o, i) => o.hue === PASTEL[i] && o.arc === VIVID[i] && o.stroke === VIVID[i]),
      JSON.stringify(twins))
    const after = await p.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
      const card = d.querySelector('.shimmer-card')
      return { same: card === window.__card, text: card?.innerText.replace(/\s+/g, ' ').slice(0, 30), letter: /One last step/.test(d.innerText), sub: /Pointing the domain/.test(d.innerText) }
    })
    check('the in-flight card is ONE card whose words change, not a card per stage',
      after.same && /Propagating/.test(sameCard.text) && /Connecting/.test(after.text), JSON.stringify({ before: sameCard.text, after: after.text, same: after.same }))
    check('…and the letter folded away when the stage stepped back, the explanation standing again (only the spreading beat folds)', !after.letter && after.sub, JSON.stringify(after))
    /* THE EDGE BOUNCES ON THE WAY DOWN TOO (designer, 17.09.2026: «да нужен», to whether the
       panel's shrink should carry the bounce) — measured on the explanation's own fold (the
       chevron): the edge passes its end by a few pixels (Reveal's negative bottom margin) and
       comes back, settled within a second; the letter is not taken back. Measured 17.09.2026:
       595.8 → 520.4, dip −4.1 at 277 ms, within 1px by ~400 ms. */
    const fold = await p.evaluate(async () => {
      const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
      const btn = [...document.querySelectorAll('[data-console] button')].find((b) => b.textContent.trim() === 'Propagating (bought)')
      btn.click()
      await new Promise((r) => setTimeout(r, 6300))
      const chevron = d.querySelector('.shimmer-card button[aria-expanded]')
      chevron.click()
      await new Promise((r) => setTimeout(r, 1000))
      const samples = []
      const t0 = performance.now()
      const tick = () => { const now = performance.now(); samples.push({ t: Math.round(now - t0), h: +d.getBoundingClientRect().height.toFixed(1) }); if (now - t0 < 1200) requestAnimationFrame(tick) }
      requestAnimationFrame(tick)
      chevron.click()
      await new Promise((r) => setTimeout(r, 1300))
      return { samples, expanded: chevron.getAttribute('aria-expanded'), letter: /One last step/.test(d.innerText) }
    })
    const fEnd = fold.samples[fold.samples.length - 1].h
    const foldSettle = fold.samples.findLast ? fold.samples.findLast((s) => Math.abs(s.h - fEnd) > 1) : null
    const dip = Math.min(...fold.samples.map((s) => s.h)) - fEnd
    check('the chevron folds the explanation by hand — the edge dips PAST its end and comes back (the bounce on the shrink), settled within 900 ms — and the letter stays',
      !!foldSettle && foldSettle.t < 900 && dip <= -1 && dip > -12 && fold.expanded === 'false' && fold.letter && fold.samples[0].h > fEnd + 60,
      JSON.stringify({ lastMovingAt: foldSettle?.t, dip, from: fold.samples[0].h, to: fEnd, letter: fold.letter }))
    await p.keyboard.press('Control+.')
    await p.waitForTimeout(300)
    await p.keyboard.press('Escape')
    await p.waitForTimeout(400)
  }

  /*
   * THE WHITE-WORD A/B (designer, 16.09.2026, on the blue `Ready`: «попробуй сделать цвет
   * белым в пилюле, пусть будет 2 варианта цвет цветной или белый»). `world.chipInkWhite`,
   * flipped from the prototype console: the word goes white, the DOT keeps the tone (it is the
   * status), the glass is untouched; off by default, so every check above saw the tone.
   */
  {
    await openPublish('p=built&a=paid&d=live&n=fitration.shop&v=true&u=0&t=22&c=640')
    const read = () => p.evaluate(() => {
      const el = document.querySelector('[role="dialog"][aria-label="Publish"] .liquid-glass--chip[data-tone]')
      return { ink: el.dataset.ink ?? 'tone', word: getComputedStyle(el.querySelector('.chip-label')).color,
        dot: getComputedStyle(el.querySelector('.h-2.w-2')).backgroundColor, fill: getComputedStyle(el).backgroundColor }
    })
    const before = await read()
    await p.keyboard.press('Control+.')
    await p.waitForTimeout(400)
    const flip = () => p.evaluate(() => {
      const lab = [...document.querySelectorAll('[data-console] label')].find((l) => l.textContent.trim() === 'Status chip — white word')
      lab.parentElement.parentElement.querySelector('button').click()
    })
    await flip()
    await p.waitForTimeout(400)
    const on = await read()
    await flip()
    await p.waitForTimeout(300)
    const back = await read()
    check('the status chip’s word is the tone by default, and the console can turn it white — the dot and the glass stay',
      before.ink === 'tone' && before.word === INK.live && on.ink === 'white' && on.word === 'rgb(255, 255, 255)' && on.dot === INK.live && on.fill === before.fill,
      JSON.stringify({ before, on }))
    check('…and the flip goes back to the tone', back.ink === 'tone' && back.word === INK.live, JSON.stringify(back))
    await p.keyboard.press('Control+.')
    await p.waitForTimeout(200)
    await p.keyboard.press('Escape')
    await p.waitForTimeout(300)
  }

  /*
   * WHAT THE WORD MEANS — the glass tooltip on the status chip (ui/Tooltip.tsx; designer,
   * 16.09.2026: «непонятно что значат эти статусы… что такое "Ready"? нужно сделать тултип
   * стильный при ховере на статус… как в macOS… с лёгким эффектом стекла… анимация появления
   * и пропадания в стиле Apple liquid glass»). Hover the chip: after a beat a bubble with a
   * tail stands above it — one clip-path shape, blurred glass, a stroked rim — inside the
   * panel's edges with its tail on the chip; it grows out of the tail with one soft overshoot
   * and leaves in a straight fade; the panel underneath does not close.
   */
  {
    const CHIP = '[role="dialog"][aria-label="Publish"] .liquid-glass--chip[data-tone]'
    const readTip = () => p.evaluate((sel) => {
      const el = document.querySelector('[role="tooltip"]'); if (!el) return null
      const chipEl = document.querySelector(sel); const chip = chipEl.getBoundingClientRect()
      const dlg = chipEl.closest('[role="dialog"]').getBoundingClientRect()
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); const host = el.parentElement
      const rim = el.querySelector('.tip-rim-line')
      const originX = parseFloat(cs.transformOrigin)
      return {
        text: el.innerText.trim(), gap: +(chip.top - r.bottom).toFixed(1),
        tailOnChip: +((r.left + originX) - (chip.left + chip.width / 2)).toFixed(1),
        insidePanel: r.left >= dlg.left + 7 && r.right <= dlg.right - 7,
        clip: cs.clipPath.startsWith('path('), blur: cs.backdropFilter, bg: cs.backgroundColor,
        rim: !!rim && getComputedStyle(rim).stroke.startsWith('url('), inDialog: !!el.closest('[role="dialog"]'),
        z: getComputedStyle(host).zIndex, pe: getComputedStyle(host).pointerEvents,
      }
    }, CHIP)
    const sample = (ms) => p.evaluate((ms) => new Promise((res) => {
      const out = []; const t0 = performance.now()
      const tick = () => {
        const el = document.querySelector('[role="tooltip"]')
        if (el) { const cs = getComputedStyle(el); const m = cs.transform === 'none' ? null : new DOMMatrix(cs.transform); out.push({ t: Math.round(performance.now() - t0), s: m ? +m.a.toFixed(3) : 1, o: +(+cs.opacity).toFixed(2) }) }
        else out.push({ t: Math.round(performance.now() - t0), gone: true })
        if (performance.now() - t0 < ms) requestAnimationFrame(tick); else res(out)
      }
      requestAnimationFrame(tick)
    }), ms)

    await openPublish('p=built&a=paid&d=live&n=fitration.shop&v=true&u=0&t=22&c=640')
    const none = await p.evaluate(() => document.querySelectorAll('[role="tooltip"]').length)
    await p.hover(CHIP)
    await p.waitForTimeout(150)
    const early = await p.evaluate(() => document.querySelectorAll('[role="tooltip"]').length)
    const entrance = await sample(800)
    const shown = entrance.filter((f) => !f.gone)
    const tip = await readTip()
    check('hovering the status chip raises a glass tooltip above it — one clip-path shape with its tail on the chip, blurred glass with a stroked rim, inside the panel, in <body>, over everything, touching nothing',
      !!tip && tip.text === 'Your site is up at this address.' && Math.abs(tip.gap - 6) <= 1 && Math.abs(tip.tailOnChip) <= 1.5 && tip.insidePanel && tip.clip && /blur\(16px\)/.test(tip.blur) && tip.bg === 'rgba(24, 24, 27, 0.82)' && tip.rim && !tip.inDialog && tip.z === '10000' && tip.pe === 'none',
      JSON.stringify(tip))
    check('…it waits a beat before it shows — nothing on a pass-through', none === 0 && early === 0, JSON.stringify({ none, early }))
    const peak = Math.max(...shown.map((f) => f.s)); const first = shown[0]; const last = shown.at(-1)
    check('…the glass grows out of its tail with one soft overshoot and settles at 1, the words a beat behind',
      shown.length > 6 && !!first && first.s < 0.9 && peak > 1.003 && peak < 1.05 && !!last && Math.abs(last.s - 1) < 0.002 && last.o === 1,
      JSON.stringify({ first, peak, last, n: shown.length }))
    await p.mouse.move(20, 20)
    const exit = await sample(400)
    const goneAt = exit.find((f) => f.gone)?.t
    const shrank = exit.filter((f) => !f.gone).every((f) => f.s <= 1.001)
    check('…and leaves when the pointer does — a straight fade, no bounce, gone within a quarter second; the panel stays',
      goneAt !== undefined && goneAt < 260 && shrank && !!(await p.$('[role="dialog"][aria-label="Publish"]')), JSON.stringify({ goneAt, exit: exit.slice(0, 6) }))
    await openPublish('p=built&a=paid&d=ready&n=fitration.shop&v=false&u=0&t=22&c=640')
    await p.hover(CHIP); await p.waitForTimeout(700)
    const ready = await readTip()
    check('…and each word carries its own meaning: `Ready` says what to do next',
      !!ready && /Hit Publish/.test(ready.text) && ready.insidePanel && Math.abs(ready.tailOnChip) <= 1.5, JSON.stringify(ready))
    await p.mouse.move(20, 20); await p.waitForTimeout(300)
    await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  }

  /*
   * THE FIVE SECONDS AND THE LETTER — board 30425:28847 (designer, 16.09.2026: «вначале у нас
   * видно процесс Propagating и описание… раскрыто секунд 5! и пока описание раскрыто эти 5
   * секунд, мы не показываем One last step… через 5 секунд мы красиво и плавно скрываем описание
   * (его можно сворачивать, разворачивать) и показываем уведомление… эксклюзивно для этого кейса
   * Unlink находится внутри One last step»). Opened on the spreading beat: the row's percent and
   * chevron, the explanation's box and words, no letter and no domain row; after the five
   * seconds the explanation is gone, the letter stands in the board's anatomy with Unlink inside
   * it, and the chevron brings the explanation back without taking the letter away.
   */
  {
    const readPanel = () => p.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
      const card = d.querySelector('.shimmer-card')
      const rowEl = card ? [...card.children].find((e) => e.tagName === 'DIV') : null
      const btn = card?.querySelector('button[aria-expanded]')
      const pct = card ? [...card.querySelectorAll('span')].find((e) => /%$/.test(e.textContent.trim())) : null
      const subBox = card ? [...card.querySelectorAll('div')].find((e) => getComputedStyle(e).borderTopColor === 'rgb(73, 73, 76)') : null
      const letterTitle = [...d.querySelectorAll('p')].find((e) => /^One last step for/.test(e.textContent.trim()))
      const letter = letterTitle ? letterTitle.closest('.rounded-\\[12px\\].border') : null
      const body = letter ? letter.children[1]?.firstElementChild : null
      const resend = [...d.querySelectorAll('button')].find((e) => /Resend email|^Sent$/.test(e.textContent.trim()))
      const unlink = [...d.querySelectorAll('button')].find((e) => /Unlink/.test(e.textContent))
      const cs = (el) => getComputedStyle(el)
      const box = (el) => el ? el.getBoundingClientRect() : null
      return {
        rowH: rowEl ? Math.round(box(rowEl).height) : null, rowPad: rowEl ? cs(rowEl).padding : null,
        pct: pct?.textContent, pctFont: pct ? cs(pct).fontFamily : null, pctSize: pct ? cs(pct).fontSize : null, pctColor: pct ? cs(pct).color : null,
        btn: btn ? { w: Math.round(box(btn).width), h: Math.round(box(btn).height), expanded: btn.getAttribute('aria-expanded'), border: cs(btn).borderTopColor, radius: cs(btn).borderRadius } : null,
        sub: subBox ? { w: Math.round(box(subBox).width), pad: cs(subBox).padding, size: cs(subBox.querySelector('p')).fontSize, color: cs(subBox.querySelector('p')).color, text: subBox.innerText } : null,
        letter: letter ? { w: Math.round(box(letter).width), h: +box(letter).height.toFixed(1), bg: cs(letter).backgroundColor, border: cs(letter).borderTopColor, kids: [...letter.children].map((c) => ({ h: +box(c).height.toFixed(1), pad: cs(c).padding })) } : null,
        body: body ? { bg: cs(body).backgroundColor, border: cs(body).borderTopColor, pad: cs(body).padding, size: cs(body.querySelector('p')).fontSize, color: cs(body.querySelector('p')).color, text: body.innerText } : null,
        resend: resend ? { text: resend.textContent.trim(), h: Math.round(box(resend).height), color: cs(resend).color, size: cs(resend).fontSize, pad: cs(resend).padding } : null,
        unlink: unlink ? { inLetter: !!(letter && letter.contains(unlink)), color: cs(unlink).color, h: Math.round(box(unlink).height), icon: !!unlink.querySelector('svg') } : null,
        domainRow: !![...d.querySelectorAll('div')].find((e) => /Unlink/.test(e.textContent || '') && cs(e).borderTopColor === 'rgb(49, 49, 51)'),
        chip: !!d.querySelector('.liquid-glass--chip[data-tone]'),
      }
    })
    await openPublish('p=built&a=paid&d=propagating&k=true&n=fit-ration.net&v=false&u=0&t=22&c=640')
    const t1 = await readPanel()
    check('opened on the spreading beat: the in-flight card’s row is 56 (pl 16 / pr 12 / py 12), the beat’s percent beside the title in Gilroy 13 at 48 %, and a 32 × 32 r10 fold button with a 24 %-white rim, open',
      t1.rowH === 56 && t1.rowPad === '12px 12px 12px 16px' && t1.pct === '27%' && /^Gilroy/.test(t1.pctFont || '') && t1.pctSize === '13px' && t1.pctColor === 'rgba(255, 255, 255, 0.48)'
        && !!t1.btn && t1.btn.w === 32 && t1.btn.h === 32 && t1.btn.radius === '10px' && t1.btn.border === 'rgba(255, 255, 255, 0.24)' && t1.btn.expanded === 'true',
      JSON.stringify({ rowH: t1.rowH, rowPad: t1.rowPad, pct: t1.pct, pctFont: t1.pctFont, pctSize: t1.pctSize, pctColor: t1.pctColor, btn: t1.btn }))
    check('…the explanation stands in its box — 408 wide, pt 19 / pb 18 / px 16, 13 px at 64 % — in the designer’s own sentence',
      !!t1.sub && t1.sub.w === 408 && t1.sub.pad === '19px 16px 18px' && t1.sub.size === '13px' && t1.sub.color === 'rgba(255, 255, 255, 0.64)' && /^Your address is updating across the web\. Most visitors will see your site within hours, up to 72 max\.$/.test(t1.sub.text),
      JSON.stringify(t1.sub))
    check('…and neither the letter nor the domain row is up yet — nor the chip', !t1.letter && !t1.domainRow && !t1.chip && !t1.unlink, JSON.stringify({ letter: !!t1.letter, domainRow: t1.domainRow, chip: t1.chip, unlink: !!t1.unlink }))
    await p.waitForTimeout(5900)
    const t2 = await readPanel()
    check('five seconds on: the explanation has folded (chevron down) and the letter is up — 408 wide in the in-flight card’s material (8 % fill and rim, r12): a 56 row (pl 16 / pr 12 / py 16), a body box 4 px in, a 48 footer (pl 8 / pr 12 / py 8)',
      !t2.sub && t2.btn?.expanded === 'false' && !!t2.letter && t2.letter.w === 408 && t2.letter.h >= 203 && t2.letter.h <= 207
        && t2.letter.bg === 'rgba(255, 255, 255, 0.08)' && t2.letter.border === 'rgba(255, 255, 255, 0.08)'
        && t2.letter.kids.length === 3 && t2.letter.kids[0].h === 56 && t2.letter.kids[0].pad === '16px 12px 16px 16px' && t2.letter.kids[1].pad === '0px 4px' && t2.letter.kids[2].h === 48 && t2.letter.kids[2].pad === '8px 12px 8px 8px',
      JSON.stringify({ sub: !!t2.sub, expanded: t2.btn?.expanded, letter: t2.letter }))
    check('…its body: 24 % black under a 4 %-white rim, pt 20 / pb 18 / px 16, 14 px at 72 %, the address in white',
      !!t2.body && t2.body.bg === 'rgba(9, 9, 11, 0.24)' && t2.body.border === 'rgba(255, 255, 255, 0.04)' && t2.body.pad === '20px 16px 18px' && t2.body.size === '14px' && t2.body.color === 'rgba(255, 255, 255, 0.72)' && /We sent the link to roman@example\.com\./.test(t2.body.text),
      JSON.stringify(t2.body))
    check('…`Resend email` on the left in the board’s #3c9bff (13 semibold, h 32, px 14) and `Unlink` on the right INSIDE the letter (14 at 56 %, icon 20) — no domain row, no chip',
      !!t2.resend && t2.resend.text === 'Resend email' && t2.resend.h === 32 && t2.resend.color === 'rgb(60, 155, 255)' && t2.resend.size === '13px' && t2.resend.pad === '0px 14px'
        && !!t2.unlink && t2.unlink.inLetter && t2.unlink.color === 'rgba(255, 255, 255, 0.56)' && t2.unlink.h === 32 && t2.unlink.icon && !t2.domainRow && !t2.chip,
      JSON.stringify({ resend: t2.resend, unlink: t2.unlink, domainRow: t2.domainRow, chip: t2.chip }))
    await p.click('[role="dialog"][aria-label="Publish"] .shimmer-card button[aria-expanded]')
    await p.waitForTimeout(900)
    const t3 = await readPanel()
    check('the chevron opens the explanation again — and the letter stays', !!t3.sub && t3.btn?.expanded === 'true' && !!t3.letter, JSON.stringify({ sub: !!t3.sub, expanded: t3.btn?.expanded, letter: !!t3.letter }))
    await p.click('[role="dialog"][aria-label="Publish"] button:has-text("Resend email")')
    await p.waitForTimeout(300)
    const t4 = await readPanel()
    check('`Resend email` answers with `Sent`, and the body says so', t4.resend?.text === 'Sent' && /Sent again to roman@example\.com — check your inbox\./.test(t4.body?.text || ''), JSON.stringify({ resend: t4.resend?.text, body: t4.body?.text }))
    await p.keyboard.press('Escape')
    await p.waitForTimeout(300)
    /* the letter's place in the other states, unchanged: not before the domain connects; at once when it is set up */
    for (const [q, want, label] of [
      ['d=provisioning&k=true&n=fitration.shop&v=false&u=0', false, 'not while the registry has the order'],
      ['d=ready&k=true&n=fitration.shop&v=false&u=0', true, 'at once, once it is set up'],
    ]) {
      await openPublish(`p=built&a=paid&${q}`)
      const mail = await p.evaluate(() => /One last step for/.test(
        document.querySelector('[role="dialog"][aria-label="Publish"]').innerText))
      check(`the registrant letter is announced: ${label}`, mail === want, JSON.stringify({ mail }))
      await p.keyboard.press('Escape')
      await p.waitForTimeout(300)
    }
  }

  /*
   * ⚠️ CONNECTING IS NOT PUBLISHING — THE WHOLE WALK, DRIVEN THROUGH THE UI (designer,
   * 15.09.2026, on a screen recording of an attach on a site he had already published:
   * «почему после привязки кастомного домена, у меня в окне паблиш статус Опубликовано?
   * типа как будто сразу после привязки кастомного домена произошла сразу публикация
   * автоматически перед капотом?»). It had: the walk's last leg landed on `live` for
   * anybody carrying `published`, so finishing a connect released the site onto the new
   * name by itself, and the panel then titled itself for a press nobody made.
   *
   * A staged state cannot catch that, because it is a TRANSITION — so this one is the real
   * thing: topbar chip → domains dashboard → Connect → the sheet, the six seconds of the
   * attach timeline, and then the press. Run for BOTH customers, because the defect had
   * exactly one of them: the site that had been published before, which is the commonest
   * shape in the flow.
   *
   * The load-bearing assertion is the NEGATIVE one — `published` is the same after the
   * walk as before it. Everything else here is what the customer sees because of it.
   */
  const world = () => p.evaluate(() => {
    const w = JSON.parse(localStorage.getItem('remixer-prototype/world/v4') || '{}')
    return { domain: w.domain, published: w.published }
  })
  for (const [v, want, label] of [
    ['true', 'Publish', 'a site that had published before'],
    ['false', 'Not published', 'a site that never had'],
  ]) {
    await p.goto(at(`p=built&v=${v}&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`), { waitUntil: 'networkidle' })
    await p.waitForTimeout(800)
    await p.click('.home-card-face')
    await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 })
    await p.waitForTimeout(500)
    /* the address chip with no domain on it is the door to the dashboard (App.tsx) */
    await p.evaluate(() => [...document.querySelectorAll('header button')]
      .find((e) => /remixer\.ai/.test(e.innerText)).click())
    await p.waitForTimeout(800)
    await p.locator('button:has-text("Connect")').first().click()
    await p.waitForTimeout(800)
    /*
     * THE CANVAS HANDS OVER ONE THING AT A TIME (designer, 16.09.2026, from a recording of this
     * press: «сейчас мы закрываем окно с доменами после нажатия на Connect… у этого нет анимации,
     * оно просто происходит в один кадр»). Film the press: the Domains window must LEAVE (fade,
     * several frames, never back to 1), the site must come back after it (fade in), and the
     * Publish panel must arrive only once the site stands — three moves, in order.
     */
    const hand = await p.evaluate(async () => {
      const main = document.querySelector('main')
      const win = () => [...main.querySelectorAll('span')].find((s) => s.textContent.trim() === 'Domains')?.closest('main > *')
      const scaleOf = (el) => { const m = getComputedStyle(el).transform; const a = m && m !== 'none' ? m.match(/matrix\(([^)]+)\)/) : null; return a ? +a[1].split(',')[0] : 1 }
      const samples = []
      const t0 = performance.now()
      const tick = () => {
        const now = performance.now()
        const w = win(); const site = document.querySelector('.site-stage'); const panel = document.querySelector('[role="dialog"][aria-label="Publish"]')
        const glint = panel?.querySelector('.glass-glint')
        samples.push({ t: Math.round(now - t0), win: w ? +getComputedStyle(w).opacity : null, winS: w ? scaleOf(w) : null, site: site ? +getComputedStyle(site.parentElement).opacity : null,
          panel: panel ? +getComputedStyle(panel).opacity : null, panelS: panel ? scaleOf(panel) : null, glint: glint ? +getComputedStyle(glint).opacity : null })
        if (now - t0 < 1500) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
      ;[...document.querySelectorAll('[role="dialog"] button')].filter((b) => /Connect domain/.test(b.textContent)).pop().click()
      await new Promise((r) => setTimeout(r, 1600))
      return samples
    })
    const winFrames = hand.filter((s) => s.win !== null)
    const winGone = hand.find((s) => s.win === null)
    const siteFrames = hand.filter((s) => s.site !== null)
    const siteFull = siteFrames.find((s) => s.site >= 0.99)
    const panelFirst = hand.find((s) => s.panel !== null)
    const monoDown = winFrames.every((s, i) => i === 0 || s.win <= winFrames[i - 1].win + 0.001)
    const monoUp = siteFrames.every((s, i) => i === 0 || s.site >= siteFrames[i - 1].site - 0.001)
    const panelMono = hand.filter((s) => s.panel !== null).every((s, i, a) => i === 0 || s.panel >= a[i - 1].panel - 0.001)
    /* the window closes the way the fullscreen sheet does: fading AND shrinking to .975 (motion.ts
       `surfaceWindow`, 17.09.2026 — «сначала анимация закрытия окна Domains»), not a 1 % nobody sees */
    const winShrunk = winFrames.length > 0 && winFrames[winFrames.length - 1].winS <= 0.985
    check(`Connect: the Domains window LEAVES over several frames, fading and shrinking toward .975, never flashing back — ${label}`,
      winFrames.length >= 4 && winFrames[winFrames.length - 1].win < 0.4 && monoDown && !!winGone && winShrunk,
      JSON.stringify({ frames: winFrames.length, last: winFrames[winFrames.length - 1]?.win, lastScale: winFrames[winFrames.length - 1]?.winS, mono: monoDown, goneAt: winGone?.t }))
    check(`…the site fades back in AFTER the window is gone, monotonically — ${label}`,
      !!winGone && siteFrames.length >= 4 && siteFrames[0].t >= winGone.t - 1 && siteFrames[0].site < 0.3 && !!siteFull && monoUp,
      JSON.stringify({ first: siteFrames[0], full: siteFull?.t, mono: monoUp }))
    check(`…and the Publish panel arrives only once the site stands, then springs in without a blink — ${label}`,
      !!panelFirst && !!siteFull && panelFirst.t >= siteFull.t - 1 && panelFirst.panel < 0.2 && panelMono && hand[hand.length - 1].panel === 1,
      JSON.stringify({ panelAt: panelFirst?.t, siteFullAt: siteFull?.t, first: panelFirst?.panel, mono: panelMono, last: hand[hand.length - 1].panel }))
    /* …AS GLASS (designer, 17.09.2026: «плавная и стильная анимация открытия Publish в стиле Apple
       liquid glass»; motion.ts `panelIn`): born at .94 in its top-right corner, inflating past 1 by
       a hair (the cards' 1.0009) and settling at 1, while its rim catches the light — the glint
       element rises from 0 and is on its way back down by the end of the film. Measured 17.09.2026:
       .94 → 1.0009 at ~400 ms after arrival, glint peak at ~440 ms. */
    const pf = hand.filter((s) => s.panelS !== null)
    const maxS = pf.length ? Math.max(...pf.map((s) => s.panelS)) : 0
    const glintPeak = Math.max(0, ...hand.map((s) => s.glint ?? 0))
    const glintLast = pf.length ? pf[pf.length - 1].glint : null
    check(`…as glass: from .94 in its corner, one soft overshoot past 1, seated at 1, the rim catching the light — ${label}`,
      pf.length >= 10 && Math.abs(pf[0].panelS - 0.94) < 0.01 && maxS > 1.0003 && maxS < 1.01 && Math.abs(pf[pf.length - 1].panelS - 1) < 0.0015
        && glintPeak > 0.9 && glintLast !== null && glintLast < glintPeak,
      JSON.stringify({ first: pf[0]?.panelS, maxS, maxAt: pf.find((s) => s.panelS === maxS)?.t, last: pf[pf.length - 1]?.panelS, glintPeak, glintLast }))
    const flight = await world()
    check(`the connect starts the walk and touches nothing else — ${label}`,
      flight.domain === 'connecting' && String(flight.published) === v, JSON.stringify(flight))
    /* ATTACH is one 6s leg (connect.ts, TIMELINES) */
    await p.waitForTimeout(6400)
    const landed = await world()
    check('…and the walk ENDS AT `ready`, however published the site is',
      landed.domain === 'ready', JSON.stringify(landed))
    check('…having published nothing by itself', String(landed.published) === v, JSON.stringify(landed))
    const seen = await p.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
      return { title: d.querySelector('h3').textContent.trim(), text: d.innerText.replace(/\s+/g, ' ') }
    })
    check(`…so the title is "${want}" — ${label}`, seen.title === want, JSON.stringify(seen.title))
    check('…over the all-clear card naming the domain',
      /fit-ration\.com is connected/.test(seen.text), JSON.stringify(seen.text.slice(0, 160)))
    /* the card's sentence follows the same fact: a site already out there is MOVED, not
       made live — the board's copy is written for the customer who has never published */
    check(`…whose sentence says ${v === 'true' ? 'move' : 'make live'}`,
      v === 'true' ? /Publish to move your site onto it/.test(seen.text)
                   : /to make your site live/.test(seen.text), JSON.stringify(seen.text.slice(0, 220)))
    check('…and the one blue verb names the address',
      /Publish to fit-ration\.com/.test(seen.text), JSON.stringify(seen.text.slice(-120)))
    /* ONE DOOR TO `live`, and this is it */
    await p.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
      ;[...d.querySelectorAll('button')].find((e) => /^Publish to/.test(e.innerText.trim())).click()
    })
    await p.waitForTimeout(400)
    check('…the press starts the busy beat first — the arc turns in the blue button and the world has not moved yet',
      await p.evaluate(() => !!document.querySelector('[role="dialog"][aria-label="Publish"] button[aria-busy="true"] svg')) && (await world()).domain === 'ready',
      JSON.stringify(await world()))
    /* THE PANEL'S SHRINK BOUNCES (designer, 17.09.2026: «да нужен»). When the beat lands, the green
       card leaves and the panel loses ~139 px: the edge passes its resting height by ~5 % (Reveal's
       negative bottom margin) and comes back, settled inside a second. Measured 17.09.2026: 449 →
       302.1 → 309.6, dip −7.5 at ~266 ms after the drop began, within 1 px by ~430 ms. */
    const shrink = await p.evaluate(async () => {
      const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
      const samples = []
      const t0 = performance.now()
      const tick = () => { const now = performance.now(); samples.push({ t: Math.round(now - t0), h: +d.getBoundingClientRect().height.toFixed(1) }); if (now - t0 < 2700) requestAnimationFrame(tick) }
      requestAnimationFrame(tick)
      await new Promise((r) => setTimeout(r, 2800))
      return samples
    })
    const sh0 = shrink[0].h, shEnd = shrink[shrink.length - 1].h
    const shMin = Math.min(...shrink.map((x) => x.h))
    const shDrop = shrink.find((x) => x.h < sh0 - 2)
    const shSettle = [...shrink].reverse().find((x) => Math.abs(x.h - shEnd) > 1)
    check(`…the panel SHRINKS with the house bounce: past its new height by a few pixels and back, settled inside a second — ${label}`,
      !!shDrop && sh0 - shEnd > 100 && shMin - shEnd <= -3 && shMin - shEnd > -16 && !!shSettle && shSettle.t - shDrop.t < 1000 && shSettle.t < shrink[shrink.length - 1].t - 200,
      JSON.stringify({ from: sh0, to: shEnd, min: shMin, dip: +(shMin - shEnd).toFixed(1), dropAt: shDrop?.t, settledAt: shSettle?.t }))
    const out = await world()
    check('…and the press is what puts the site on it', out.domain === 'live' && out.published === true,
      JSON.stringify(out))
    const after = await p.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
      return { title: d.querySelector('h3').textContent.trim(), card: /is connected/.test(d.innerText),
        unlink: /Unlink|Відв/.test(d.innerText) }
    })
    check('…leaving the quiet terminal panel: titled Published, all-clear spent, Unlink in place',
      after.title === 'Published' && !after.card && after.unlink, JSON.stringify(after))
    await p.keyboard.press('Escape')
    await p.waitForTimeout(300)
  }

  /*
   * …AND THE ONE EXCEPTION IS THE OPPOSITE CASE: A REPAIR PUTS THE SITE BACK.
   *
   * `Fix this` on `unreachable` is "it worked and it stopped" — the site was published on
   * that name and the address broke under it. Ending that walk at `ready` would ask for a
   * press to "move your site onto it" about a site that is already there, so a repair
   * lands where it came from. Same six seconds as an attach, different ending, which is
   * why it is its own walk rather than a flag (connect.ts, `Path`).
   *
   * Only the published case is exercised: `unreachable` means it worked and stopped, so a
   * never-published one is a hand-staged oddity, and there the code falls back to `ready`
   * for the reason `violations()` gives — `live` cannot stand in front of a site nobody
   * ever published.
   */
  await openPublish('p=built&v=true&u=0&a=paid&d=unreachable&n=fitration.shop&t=22&c=640')
  await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
    ;[...d.querySelectorAll('button')].find((e) => /Fix this/.test(e.innerText)).click()
  })
  await p.waitForTimeout(900)
  check('Fix this starts the same six-second walk', (await world()).domain === 'connecting',
    JSON.stringify(await world()))
  await p.waitForTimeout(6400)
  const repaired = await world()
  check('…and a REPAIR ends the outage rather than asking for a press',
    repaired.domain === 'live' && repaired.published === true, JSON.stringify(repaired))
  const quiet = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
    return { title: d.querySelector('h3').textContent.trim(), card: /is connected/.test(d.innerText),
      unlink: /Unlink|Відв/.test(d.innerText) }
  })
  check('…leaving the quiet panel, with no all-clear to act on',
    quiet.title === 'Published' && !quiet.card && quiet.unlink, JSON.stringify(quiet))
  await p.keyboard.press('Escape')
  await p.waitForTimeout(300)

  /* the negative: a site that has been published gets neither, banner state or not */
  await openPublish('p=built&u=3&v=true&a=trial&t=22&c=640')
  check('a published site’s panel is titled by the action', (await title()) === 'Publish', await title())
  check('…and never shows the nudge', !(await hint()))
  /* ONE VERB in both places (designer, 14.09.2026): the topbar says what the panel's
     own button says, and the count rides beside it. "Update" is gone from the product. */
  check('…and its topbar button says Publish changes with the pending count',
    !!(await p.$('header button:has-text("Publish changes")')) &&
      !(await p.$('header button:has-text("Update")')))
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

/* =========================== G. the Build Plan by its own board (Figma 30115:55247 /
 * 30121:59891, designer 11.09.2026: "тебе нужно перфект пиксель сделать вот эти компоненты").
 *
 * The document draws two things the prose used to describe: the page stack — one page is
 * generated in a pass, the rest are named and wait — and the palette and lettering as
 * controls. The measurements here are the board's numbers; the last two checks are the ones
 * that matter, because they say which of those edits reaches the build and which does not. */

await buildFromHome('website')
await p.click('.dock-foot button:has-text("Skip all")')
await p.waitForTimeout(2600)
/* ⚠️ The step OPENS on the simplified window now (21.09.2026), and that one has no `Review`
   by design — this whole section is about the full-size document, so throw the switch first.
   Without it the click below waits out its timeout on a button that is not there. */
await p.click('[data-plan-seat="full"]'); await p.waitForTimeout(900)
await p.click('[data-plan-review]')
await p.waitForTimeout(900)
await shot('30-plan-review')
{
  const box = (sel) => p.$eval(sel, (n) => { const r = n.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 100) / 100) })
  const doc = await p.evaluate(() => {
    const h1 = document.querySelector('h1')
    const c = getComputedStyle(h1)
    const col = h1.parentElement.getBoundingClientRect()
    return { col: Math.round(col.width), size: c.fontSize, weight: c.fontWeight }
  })
  /* 30107:53167 — the document is 800 wide; 30107:53245 — Gilroy Medium 48. */
  check('the plan document is the board’s 800 measure', doc.col === 800, `${doc.col}px`)
  check('…and its title is 48 medium', doc.size === '48px' && doc.weight === '500', `${doc.size}/${doc.weight}`)

  const stack = await p.evaluate(() => {
    const pill = document.querySelector('[data-plan-pill]')
    const head = pill?.closest('div')
    const page = [...document.querySelectorAll('[data-plan-path]')].filter((n) => n.getAttribute('data-plan-path')?.startsWith('outline:page:'))
    const rows = [...document.querySelectorAll('.plan-row')]
    const seam = page.map((n) => getComputedStyle(n.closest('.plan-row')).borderBottomWidth)
    const c = getComputedStyle(pill)
    return {
      head: head ? [Math.round(head.getBoundingClientRect().width), Math.round(head.getBoundingClientRect().height)] : null,
      pillInk: c.color,
      pillPlate: getComputedStyle(pill.parentElement).backgroundColor,
      seam,
      rows: rows.length,
    }
  })
  /* 30107:53402 — 48 tall and 796 wide: the card's stroke and the page block's each take a
     pixel, and the board's `px-px` IS that stroke, not padding on top of it. */
  check('the page block’s header is the board’s 796 × 48', stack.head?.[0] === 796 && stack.head?.[1] === 48, JSON.stringify(stack.head))
  /* 30121:60003 — `Neutral Alpha/1000` is #ffffff in the dark theme and the label is
     `Text/default/on-default` #09090b. The light export prints both inverted. */
  check('…and "In this build" is a WHITE plate with dark ink, as the dark theme resolves it',
    stack.pillPlate === 'rgb(255, 255, 255)' && stack.pillInk === 'rgb(9, 9, 11)',
    `${stack.pillPlate} / ${stack.pillInk}`)
  /* 30107:53498 / 30107:53507 — every waiting page seals its bottom EXCEPT the last, whose
     corner is the card's own. The same rule the generation card already follows. */
  check('every waiting page seals its bottom except the last',
    stack.seam.length > 1 && stack.seam.slice(0, -1).every((w) => w === '1px') && stack.seam.at(-1) === '0px',
    stack.seam.join(' · '))

  /* ⚠️ ONE RAIL, NOT TWO (designer, 12.09.2026, with a photo of the seam: "у тебя тут
     двойные бордеры снова"). Figma's stroke sits INSIDE the geometry, so on the board the
     card's ring and every seam inside it are ONE line; a CSS border adds, and children left
     where they fell drew a second rail a pixel in — measured at 2 CSS px down both sides,
     and 3 where the sheet's own hairline joined the pile. The cure is the repo's rule and
     the generation card's own anatomy: pull the children out onto the card's stroke.
     Asserted on EDGES, so a restyled border cannot slip past this. */
  const rails = await p.evaluate(() => {
    const stack = document.querySelector('[data-plan-stack]')
    const card = stack.firstElementChild
    const block = card.firstElementChild
    const waits = [...card.children].slice(1)
    const e = (n) => { const r = n.getBoundingClientRect(); return [+r.left.toFixed(2), +r.right.toFixed(2)] }
    const sealed = waits.filter((n) => getComputedStyle(n).borderBottomWidth === '1px')
    return { card: e(card), block: e(block), sealed: sealed.map(e), n: waits.length,
      h: +card.getBoundingClientRect().height.toFixed(2) }
  })
  check('one rail, not two: the page block rides ON the card\u2019s stroke',
    rails.block[0] === rails.card[0] && rails.block[1] === rails.card[1],
    `${rails.block} vs ${rails.card}`)
  check('…and so does every sealed waiting page',
    rails.sealed.length > 0 && rails.sealed.every((r) => r[0] === rails.card[0] && r[1] === rails.card[1]),
    JSON.stringify(rails.sealed))
  /* 30107:53395 — the board's card is 1 + 275 + 48·pages + 1, and it lands there only
     because the seam BELOW the block is shared too: on the board the block's bottom stroke
     is the first waiting page's top edge. */
  check('…so the card comes out at the board\u2019s own height',
    rails.h === 277 + 48 * rails.n, `${rails.h} vs ${277 + 48 * rails.n}`)

  /* 30107:53487 — on the board the add row carries its own (empty) elbow frame, so its disc
     stands in the sections' icon column at x=36 and its label under their names at x=72,
     with 16 of air above it. The first version hung it off the sheet's own padding at x=20,
     a column nothing else stands in. */
  const addRow = await p.evaluate(() => {
    const stack = document.querySelector('[data-plan-stack]')
    const S = stack.getBoundingClientRect().left
    const sheet = stack.firstElementChild.firstElementChild.children[1]
    const rows = [...sheet.querySelectorAll('li[data-row]')]
    const add = sheet.querySelector('button.plan-add')
    const x = (n) => +(n.getBoundingClientRect().left - S).toFixed(2)
    return {
      icon: x(rows[0].querySelector('svg')),
      name: x(rows[0].querySelector('[contenteditable]').parentElement),
      disc: x(add.querySelector('svg')), label: x(add.querySelector('span')),
      air: +(add.querySelector('svg').getBoundingClientRect().top - rows.at(-1).getBoundingClientRect().bottom).toFixed(2),
    }
  })
  check('the section columns are the board\u2019s: icon 36, name 72',
    addRow.icon === 36 && addRow.name === 72, JSON.stringify(addRow))
  check('…and "Add a section" stands in them, with 16 of air above',
    addRow.disc === 36 && addRow.label === 72 && addRow.air === 16, JSON.stringify(addRow))

  const cards = await p.evaluate(() => {
    const c = [...document.querySelectorAll('div')].filter((n) => getComputedStyle(n).backgroundColor === 'rgb(35, 35, 37)')
    const pencil = document.querySelector('button[aria-label="Choose another palette"]')
    const pc = pencil ? getComputedStyle(pencil) : null
    return {
      palette: c[0] ? [Math.round(c[0].getBoundingClientRect().width), Math.round(c[0].getBoundingClientRect().height)] : null,
      n: c.length,
      pencil: pencil ? [Math.round(pencil.getBoundingClientRect().width), pc.borderRadius] : null,
    }
  })
  /* 30121:55288 — 800 × 74 on `#232325`, and the rim is an inset shadow: a border would add
     the 2px that measured 76. 30121:59085 — the pencil is 40 at radius 10. */
  check('the palette decision is the board’s 800 × 74 card', cards.palette?.[0] === 800 && cards.palette?.[1] === 74, JSON.stringify(cards.palette))
  check('…there are two of them, and the pencil is 40 at radius 10',
    cards.n === 2 && cards.pencil?.[0] === 40 && cards.pencil?.[1] === '10px', JSON.stringify(cards))

  /* The pencil opens the question's own grid, and picking there recompiles the document. */
  await p.click('button[aria-label="Choose another palette"]')
  await p.waitForTimeout(500)
  await shot('31-plan-decision-open')
  const tiles = await p.$$('.brief-tile--swatch')
  check('the pencil opens the question’s own grid', tiles.length === 4, String(tiles.length))
  await tiles[1].click()
  await p.waitForTimeout(600)
  const body = await text()
  /* the palette stops being a pick; the other three questions are still unanswered, so the
     tag is still on them — the claim is about THIS decision, not the document */
  const swatchTag = await p.evaluate(() => {
    const hex = [...document.querySelectorAll('span')].find((n) => n.textContent?.startsWith('#'))
    return hex?.closest('div')?.parentElement?.innerText ?? ''
  })
  check('…and picking there recompiles the plan',
    body.includes('Sea Glass') && !swatchTag.includes('Remixer’s pick'), swatchTag.replace(/\n/g, ' · ').slice(0, 60))
}
{
  /* ⚠️ THE ONE EDIT THAT REACHES THE BUILD. The stack's names compile into `buildOutline`,
     which the generation card reads — so a rename here has to come out of the other end. */
  await p.click('[data-plan-path="outline:page:1"]')
  await p.keyboard.press('Control+a')
  await p.keyboard.type('Menu')
  await p.click('h1')
  await p.waitForTimeout(400)
  const named = await p.$eval('[data-plan-path="outline:page:1"]', (n) => n.textContent)
  check('a page renames in place in the plan', named === 'Menu', String(named))

  /* and the prose beside it does NOT: the document is a record, not a command line */
  const goalWas = await p.$eval('[data-plan-path="goal"]', (n) => n.textContent)
  await p.click('[data-plan-path="goal"]')
  await p.keyboard.press('Control+a')
  await p.keyboard.type('Build me a spaceship instead.')
  await p.click('h1')
  await p.waitForTimeout(300)

  await p.click('button:has-text("Start Building")')
  /* wait for the CARD rather than a stopwatch: the ack lands first, the outline after it.
     ⚠️ By its element, not by a section name: the plan document lists the same section names,
     and since the canvas hands over with an exit (16.09.2026) the leaving plan surface is still
     on the page for 140 ms after the press — a text wait resolved on IT, 400 ms before the card
     had landed, and read the page without the card. */
  await p.waitForSelector('section[aria-label="What Remixer is building"]', { timeout: 15000 })
  await p.waitForTimeout(400)
  await shot('32-plan-build-started')
  const card = await text()
  check('…and the generation card builds the page the customer named', card.includes('Menu'), card.includes('Menu') ? 'Menu' : 'not carried')
  check('…while the rewritten prose changed nothing about the build',
    !card.includes('spaceship') && goalWas.length > 0)
}

/* ============================ H. a DOMAIN attached to the prompt on the Home page
 *  Figma 28726:64760 «Domain-Only Customer» + the menu instance 30771:31103 (designer,
 *  21.09.2026). A DreamHost panel customer arrives with a name already chosen, so the
 *  intake has to be able to say which domain this build is for.
 *
 *  ⚠️ `i=dh-free` and NOT the suite's usual NEW_PROJECT: that query carries `i=none`, an
 *  account with no domains, where the menu is correctly empty and there is nothing to pick.
 */
{
  const HOME_WITH_DOMAINS = 'p=empty&h=empty&a=trial&t=1&c=2000&i=dh-free'
  const box = (sel) => p.$eval(sel, (el) => { const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => +n.toFixed(2)) })
  const gone = (sel) => p.$(sel).then((n) => !n)

  await p.goto(at(HOME_WITH_DOMAINS), { waitUntil: 'networkidle' })
  /* ⚠️ 2.6s, not the usual 700ms: the hero's entrance (`home-rise-in`, 0.8s at 1.25s)
     is still lifting the composer at 900ms, and every travel here is measured against
     where the field sits. Measured mid-flight: the field reads 445.25 at 900ms and
     442.83 once it has landed — a 2.4px error that looks exactly like a layout bug. */
  await p.waitForTimeout(2600)
  const bare = await box('.he-composer')
  const bareInput = await box('.he-composer input')
  const bareChips = await box('.he-chips')
  check('the bare field is the drawn 138', bare[3] === 138, String(bare[3]))
  check('nothing is attached to a fresh intake', await gone('[data-attach-domain]'))

  await p.click('[data-attach-open]')
  await p.waitForTimeout(450)
  await shot('33-attach-menu')
  const plus = await box('[data-attach-open]')
  const menu = await box('[role="menu"]')
  /* The board's own box: 208 × 89 = 4 + 40 + 1 + 40 + 4. It is what forbids the dimmed
     row a subtitle (AttachMenu.tsx). */
  check('the attach menu is the board’s 208 × 89', menu[2] === 208 && menu[3] === 89, menu.join(','))
  /*
   * AND IT OPENS DOWNWARD OUT OF THE "+", at the board's own offset: the `Menu` instance
   * sits at (364, 610) where the button's box is (340, 602, 36, 36) — 24 right, 8 down,
   * covering the button row it grew from. The designer had to say this twice: the first
   * build read that overlap as a loose placement and hung the menu above the field.
   */
  check('…opening downward out of the "+", 24 right and 8 down, where the board puts it',
    Math.abs(menu[0] - (plus[0] + 24)) < 0.6 && Math.abs(menu[1] - (plus[1] + 8)) < 0.6,
    `menu ${menu.join(',')} | + ${plus.join(',')}`)
  /*
   * ⚠️ WHICH ONLY WORKS BECAUSE THE MENU IS OUT OF THE HERO. The hero is a clipped panel,
   * and a menu opening down from a "+" that sits 52px above the field's bottom edge runs
   * out of panel before the domain list ends — filmed: the third name sliced in half.
   */
  const escaped = await p.$eval('[role="menu"]', (el) => {
    for (let n = el.parentElement; n; n = n.parentElement) if (n.classList?.contains('home-hero')) return false
    return true
  })
  check('…from outside the hero’s clip, so nothing can cut it', escaped)
  /* The field's own backdrop-blur is a stacking context, so this is the check that the
     prompt chips are not painted across the menu (they were, measured 21.09.2026). */
  const onTop = await p.evaluate(([x, y]) => {
    const el = document.elementFromPoint(x, y)
    return !!el?.closest('[role="menu"]')
  }, [menu[0] + menu[2] / 2, menu[1] + menu[3] - 20])
  check('…and it paints above the prompt-chip row', onTop)

  const rows = await p.$$eval('[role="menu"] [role="menuitem"]', (els) => els.map((e) => ({ label: e.innerText.trim(), off: e.disabled })))
  check('the menu draws the board’s two rows', rows.length === 2 && /Attach File/.test(rows[0].label) && /Attach Domain/.test(rows[1].label),
    rows.map((r) => r.label).join(' | '))
  check('Attach File is dimmed, because this prototype has no files', rows[0].off === true)

  await p.click('[role="menu"] [role="menuitem"]:last-child')
  await p.waitForTimeout(350)
  await shot('34-attach-domain-list')
  const names = await p.$$eval('[role="menu"] [role="menuitem"]', (els) => els.map((e) => e.innerText.trim()))
  check('…and Attach Domain lists the names this account actually owns',
    names.join(' · ') === 'fit-ration.com · odesa-coffee-roasters.com · design-portfolio.net · vegan-burger-delivery.co',
    names.join(' · '))
  /* A real name does not fit the drawn 208; that level is ours and undrawn. */
  const list = await box('[role="menu"]')
  check('…in a box wide enough for a real domain name', list[2] === 280, String(list[2]))
  check('…whose corner by the "+" has not moved, and which the window still holds',
    Math.abs(list[0] - menu[0]) < 0.6 && Math.abs(list[1] - menu[1]) < 0.6
      && list[1] + list[3] < 900 - 8,
    `${list.join(',')} vs ${menu.join(',')}`)

  await p.keyboard.press('Escape')
  await p.waitForTimeout(300)
  check('Escape closes it, like every menu in this shell', await gone('[role="menu"]'))

  await p.click('[data-attach-open]')
  await p.waitForTimeout(400)
  await p.click('[role="menu"] [role="menuitem"]:last-child')
  await p.waitForTimeout(350)
  await p.click('[role="menu"] [role="menuitem"]:nth-child(2)')
  await p.waitForTimeout(900)
  await shot('35-domain-attached')
  const withChip = await box('.he-composer')
  const chip = await box('[data-attach-domain]')
  const chipInput = await box('.he-composer input')
  const chipChips = await box('.he-chips')
  const chipName = await p.$eval('[data-attach-domain]', (el) => el.innerText.trim())
  check('the picked name sits in the composer', chipName === 'odesa-coffee-roasters.com', chipName)
  /* 28726:64923 on this board: the field is 164 with a domain chip, and 138 without. */
  check('the field grows to the drawn 164', withChip[3] === 164, String(withChip[3]))
  check('…the chip is the drawn 36, 16 in from the field’s corner',
    chip[3] === 36 && Math.abs(chip[0] - (withChip[0] + 16)) < 0.6 && Math.abs(chip[1] - (withChip[1] + 16)) < 0.6,
    chip.join(','))
  /*
   * ⚠️ AND IT IS GLASS ON THE HOUSE CANON, not a hand-rolled hairline (designer 21.09.2026:
   * «домен находится внутри стеклянной кнопки-пилюли, ты стекло не добавил»). The board's
   * flat rgba(255,255,255,.2) is the pill gradient's bright end; drawn flat it reads dead.
   * The ✕ inside wears the same material — the board gives it its own fill and stroke.
   */
  const glass = await p.evaluate(() => {
    const el = document.querySelector('[data-attach-domain]')
    const x = el?.querySelector('button')
    const rim = (n) => getComputedStyle(n, '::before').backgroundImage
    return {
      canon: !!el?.classList.contains('liquid-glass') && !!el?.classList.contains('liquid-glass--attach'),
      fill: getComputedStyle(el).backgroundColor,
      blur: getComputedStyle(el).backdropFilter,
      rim: rim(el),
      border: getComputedStyle(el).borderTopWidth,
      xCanon: !!x?.classList.contains('liquid-glass--attach'),
      xRim: rim(x),
      xBox: [x?.offsetWidth, x?.offsetHeight],
    }
  })
  check('…wearing the canon’s glass: a gradient rim over the board’s 4% fill, blur 16',
    glass.canon && /gradient/.test(glass.rim) && glass.fill === 'rgba(255, 255, 255, 0.04)'
      && glass.blur.includes('blur(16px)') && glass.border === '0px',
    JSON.stringify(glass).slice(0, 200))
  check('…and its ✕ is the same glass at 18',
    glass.xCanon && /gradient/.test(glass.xRim) && glass.xBox[0] === 18 && glass.xBox[1] === 18,
    JSON.stringify(glass.xBox))
  /*
   * THE DERIVED TRAVELS (attachment.ts § barTextShift/barRowShift): h + 16 for the
   * placeholder line, h − 10 for everything under it — 52 and 26 for a 36-tall chip,
   * and the board closes on both (Text at y=52 with its caret at 17; Buttons at 112).
   */
  check('…the placeholder line travels the derived 52', Math.abs(chipInput[1] - bareInput[1] - 52) < 0.6, String(chipInput[1] - bareInput[1]))
  check('…and the chip row under the field the derived 26', Math.abs(chipChips[1] - bareChips[1] - 26) < 0.6, String(chipChips[1] - bareChips[1]))
  /* The box grows DOWNWARD: the hero above it must not move a pixel. */
  check('…while nothing above the field moves', Math.abs(withChip[1] - bare[1]) < 0.6, `${bare[1]} → ${withChip[1]}`)

  /* A name is not a description of a site — the designer's own sentence about this
     customer. A template arms Build; a domain does not. */
  const armed = await p.$eval('button:has-text("Build")', (el) => !el.disabled)
  check('a domain alone does not arm Build', armed === false)

  /* The one axis a new project KEEPS (send.ts § startBuild). */
  await p.fill('input[aria-label="Describe the site you want"]', 'Bella’s Bakery')
  await p.click('button:has-text("Build")')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 10000 })
  await p.waitForTimeout(600)
  const kept = await p.evaluate(() => JSON.parse(localStorage.getItem('remixer-prototype/world/v4') || '{}').intakeDomain)
  check('the attached domain survives into the build', kept === 'odesa-coffee-roasters.com', String(kept))
  /* …and it is NOT smuggled into the prompt: the transcript is what the customer typed. */
  const firstSaid = await p.evaluate(() => (JSON.parse(localStorage.getItem('remixer-prototype/world/v4') || '{}').sent || [])[0]?.text ?? '')
  check('…without the name being typed into the prompt for them',
    firstSaid === 'Bella’s Bakery', firstSaid)

  /* And the ✕ takes it off again, all the way back to the bare 138. */
  await p.goto(at(HOME_WITH_DOMAINS + '&g=fit-ration.com'), { waitUntil: 'networkidle' })
  await p.waitForTimeout(2600)
  check('a link can carry the domain a panel customer arrived with',
    (await p.$eval('[data-attach-domain]', (el) => el.innerText.trim())) === 'fit-ration.com')
  await p.click('[data-attach-domain] button')
  await p.waitForTimeout(900)
  await shot('36-domain-detached')
  const off = await box('.he-composer')
  check('…and its ✕ puts the field back on the bare 138', off[3] === 138 && await gone('[data-attach-domain]'), String(off[3]))
}

/* ═══════════════════════════════════════════════════════════════════════════════════
 * I · THE CLOUD WINDOW AND THE RIGHT RAIL
 *
 * Board 30816:49569 for the window (its own geometry is spelled out at the head of
 * `modules/cloud/CloudSurface.tsx`), and 17471:40596 — the designer's state sheet — plus
 * 30816:50043 ("Right Toolbar") for the rail that opens it.
 *
 * What these checks are really guarding: the numbers that came off the board and cannot
 * be re-derived from the code (column x positions, the inset strokes, the accents read in
 * the DARK theme), and the two behaviours the board draws but a mock cannot have — the
 * headings riding the list's horizontal scroll, and the actions sticking to the right edge.
 * ═══════════════════════════════════════════════════════════════════════════════════ */
{
  const R = (sel) => p.$eval(sel, (n) => { const r = n.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 100) / 100) })
  const CSS = (sel, prop) => p.$eval(sel, (n, q) => getComputedStyle(n)[q], prop)

  await p.goto(at('p=built&v=true&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'), { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  await p.click('.home-card-face')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
  await p.waitForTimeout(500)

  /* ── the rail, before anything is open ───────────────────────────────────────── */
  const rail = await p.evaluate(() => {
    const btns = [...document.querySelectorAll('nav.arrive-rail button[aria-pressed]')]
    return btns.map((e) => { const r = e.getBoundingClientRect(); const g = getComputedStyle(e)
      return { label: e.getAttribute('aria-label'), w: r.width, h: r.height, x: r.x, y: r.y, radius: g.borderTopLeftRadius, bg: g.backgroundColor, color: g.color,
               glyph: (() => { const s = e.querySelector('svg'); return [s.getAttribute('width'), s.getAttribute('fill')] })() } })
  })
  check('the rail carries the board’s four buttons, 48 at radius 16 with a 24 glyph',
    rail.length === 4 && rail.every((b) => b.w === 48 && b.h === 48 && b.radius === '16px' && b.glyph[0] === '24'),
    JSON.stringify(rail.map((b) => [b.label, b.w, b.radius, b.glyph[0]])))
  check('…and the glyphs are FILLED, as the kit draws them — not our old outlines',
    rail.every((b) => b.glyph[1] === 'currentColor'), JSON.stringify(rail.map((b) => b.glyph[1])))
  check('the buttons stand 8 apart (30816:50043)',
    rail.slice(1).every((b, i) => Math.round(b.y - rail[i].y) === 56), JSON.stringify(rail.map((b) => Math.round(b.y))))
  check('at rest every button is a bare white glyph on nothing',
    rail.every((b) => b.bg === 'rgba(0, 0, 0, 0)' && b.color === 'rgb(255, 255, 255)'),
    JSON.stringify(rail.map((b) => [b.bg, b.color])))

  /* the avatar row is 56 — four taller than the 52 top bar, which is the board's own rhythm */
  const avatarRow = await R('nav.arrive-rail > div:first-child')
  check('the avatar row is the board’s 56, not the top bar’s 52', avatarRow[3] === 56, String(avatarRow[3]))

  /* ── open it ─────────────────────────────────────────────────────────────────── */
  await p.click('nav.arrive-rail [aria-label="Cloud"]')
  await p.waitForTimeout(900)
  await shot('37-cloud-window')
  check('the rail’s Cloud button opens the Cloud window', !!(await p.$('[data-cloud-window]')))

  const sel = await p.$eval('nav.arrive-rail [aria-label="Cloud"]', (e) => { const g = getComputedStyle(e); return [g.backgroundColor, g.color] })
  check('…and the button takes its SELECTED state: the tile at a tenth, the glyph whole (17478:42337)',
    sel[0] === 'rgba(149, 117, 205, 0.12)' && sel[1] === 'rgb(149, 117, 205)', sel.join(' · '))
  const others = await p.evaluate(() => [...document.querySelectorAll('nav.arrive-rail button[aria-pressed="false"]')]
    .map((e) => getComputedStyle(e).backgroundColor))
  check('…while the three buttons with no window of their own stay dark',
    others.length === 3 && others.every((c) => c === 'rgba(0, 0, 0, 0)'), others.join(' · '))

  /* ── the window ──────────────────────────────────────────────────────────────── */
  const win = await R('[data-cloud-window]')
  /* the base and the sheet on it — the pair the board's own `Dashboard` and `Page content` print */
  check('the window base is 24% black over --gray-900, the house window recipe (board `Dashboard`)',
    (await CSS('[data-cloud-window]', 'backgroundColor')) === 'rgb(24, 24, 27)'
    && /rgba\(9, 9, 11, 0\.24\)/.test(await CSS('[data-cloud-window]', 'backgroundImage')),
    await CSS('[data-cloud-window]', 'backgroundImage'))
  const sheet = await p.$eval('[data-cloud-page]', (n) => {
    const g = getComputedStyle(n.parentElement)
    const r = n.parentElement.getBoundingClientRect()
    return { bg: g.backgroundColor, line: g.borderTopColor, w: g.borderTopWidth, rad: g.borderTopRightRadius, y: r.y }
  })
  check('…and the page is a LIGHTER sheet on it: gray-900 under a 1px 8%-white edge, corner 6 (board `Page content`)',
    sheet.bg === 'rgb(24, 24, 27)' && sheet.line === 'rgba(255, 255, 255, 0.08)' && sheet.w === '1px' && sheet.rad === '6px',
    JSON.stringify(sheet))
  check('…so the darker base is what shows behind the top bar — the strip the designer caught missing',
    Math.round(sheet.y - (await R('[data-cloud-window]'))[1]) === 49, String(Math.round(sheet.y - (await R('[data-cloud-window]'))[1])))
  check('…under the house window chrome: radius 16 and a 1px --gray-800 hairline',
    (await CSS('[data-cloud-window]', 'borderTopLeftRadius')) === '16px'
    && (await CSS('[data-cloud-window]', 'borderTopColor')) === 'rgb(39, 39, 42)'
    && (await CSS('[data-cloud-window]', 'borderTopWidth')) === '1px')
  check('the page does NOT repeat the board’s right border onto that hairline (no 2px rail)',
    (await CSS('[data-cloud-page]', 'borderRightWidth')) === '0px')

  /* menu */
  const nav = await R('[data-cloud-window] nav')
  const card = await R('[data-cloud-menu]')
  check('the menu column is 264 and its card 256, inset 8', nav[2] === 264 && card[2] === 256 && Math.round(card[0] - nav[0]) === 8,
    `${nav[2]} · ${card[2]} · ${Math.round(card[0] - nav[0])}`)
  check('…the card’s stroke is INSIDE it (an inset shadow), so the 256 stays 256',
    (await CSS('[data-cloud-menu]', 'borderTopWidth')) === '0px'
    && /inset/.test(await CSS('[data-cloud-menu]', 'boxShadow'))
    && (await CSS('[data-cloud-menu]', 'borderTopLeftRadius')) === '14px')
  const head = await R('[data-cloud-menu] > div:first-child')
  const mark = await R('[data-cloud-menu] svg')
  check('the menu header is 84 tall with the 25-wide cloud at 20 and the word 10 after it',
    head[3] === 84 && mark[2] === 25 && Math.round(mark[0] - card[0]) === 20, `${head[3]} · ${mark[2]} · ${Math.round(mark[0] - card[0])}`)
  check('…set in Gilroy 24 bold', (await CSS('[data-cloud-menu] > div:first-child span', 'fontSize')) === '24px'
    && (await CSS('[data-cloud-menu] > div:first-child span', 'fontWeight')) === '700')

  const dbs = await p.evaluate(() => [...document.querySelectorAll('[data-cloud-db]')].map((e) => {
    const r = e.getBoundingClientRect(); const g = getComputedStyle(e)
    return { t: e.textContent, w: r.width, h: r.height, radius: g.borderTopLeftRadius, bg: g.backgroundColor, pl: g.paddingLeft, weight: g.fontWeight, color: g.color }
  }))
  check('the selected database row is 40 at radius 10, filled in the module’s accent at half strength',
    dbs[0].h === 40 && dbs[0].radius === '10px' && dbs[0].bg === 'rgba(126, 87, 194, 0.5)' && dbs[0].weight === '600' && dbs[0].pl === '16px',
    JSON.stringify(dbs[0]))
  check('…and the one beside it keeps the board’s own 15 of left padding, regular, at 48% white',
    dbs[1].pl === '15px' && dbs[1].weight === '400' && dbs[1].color === 'rgba(255, 255, 255, 0.48)', JSON.stringify(dbs[1]))
  const menuRows = await p.evaluate(() => [...document.querySelectorAll('[data-cloud-menurow]')].map((e) => e.getBoundingClientRect().height))
  check('five top-level menu rows (Database plus the four rooms), all 48',
    menuRows.length === 5 && menuRows.every((h) => h === 48), JSON.stringify(menuRows))

  /* top bar + header */
  const close = await R('[data-cloud-close]')
  check('the top bar holds one button and it is the way out: 32 at radius 10, 8 from the window’s edge',
    close[2] === 32 && (await CSS('[data-cloud-close]', 'borderTopLeftRadius')) === '10px'
    && Math.round(win[0] + win[2] - (close[0] + close[2])) === 9, // 8 + the window's own 1px border
    `${close[2]} · ${Math.round(win[0] + win[2] - (close[0] + close[2]))}`)
  const top = await p.$eval('[data-cloud-window] h2', (h) => {
    const row = h.parentElement, nav = document.querySelector('[data-cloud-window] nav')
    const r = row.getBoundingClientRect(), n = nav.getBoundingClientRect(), g = getComputedStyle(h)
    return { h: r.height, pl: Math.round(h.getBoundingClientRect().x - (n.x + n.width)), size: g.fontSize, weight: g.fontWeight }
  })
  check('the header top row is the board\u2019s 87, its title Gilroy 32 bold at pl-36',
    Math.round(top.h) === 87 && top.pl === 36 && top.size === '32px' && top.weight === '700', JSON.stringify(top))
  const search = await R('[data-cloud-window] label')
  check('the search field is the drawn 400 on #18181b, fully round',
    search[2] === 400 && search[3] === 40 && (await CSS('[data-cloud-window] label', 'backgroundColor')) === 'rgb(24, 24, 27)',
    `${search[2]}×${search[3]}`)

  /* column headings — every x straight off 30816:52093 */
  const heads = await p.evaluate(() => {
    const row = document.querySelector('[data-cloud-headings]')
    const content = row.parentElement.parentElement
    const x0 = content.getBoundingClientRect().x
    const g = getComputedStyle(row.querySelector('span'))
    return { h: row.getBoundingClientRect().height, line: getComputedStyle(row).borderTopColor, size: g.fontSize, weight: g.fontWeight, color: g.color,
      cols: [...row.querySelectorAll('span')].map((e) => [e.textContent, Math.round(e.getBoundingClientRect().x - x0), Math.round(e.getBoundingClientRect().width)]) }
  })
  check('the column headings row is 47 under a #33333a line, its labels 12 medium at 32% white',
    heads.h === 47 && heads.line === 'rgb(51, 51, 58)' && heads.size === '12px' && heads.weight === '500' && heads.color === 'rgba(255, 255, 255, 0.32)',
    JSON.stringify([heads.h, heads.line, heads.size, heads.weight, heads.color]))
  check('…and all seven land on the board’s own x and width (36/116/356/802/969/1101/1157)',
    JSON.stringify(heads.cols.map((c) => c[1])) === JSON.stringify([36, 116, 356, 802, 969, 1101, 1157])
    && JSON.stringify(heads.cols.map((c) => c[2])) === JSON.stringify([80, 240, 446, 167, 132, 56, 56]),
    JSON.stringify(heads.cols))

  /* the list */
  const rows = await p.evaluate(() => [...document.querySelectorAll('[data-cloud-row]')].map((e) => {
    const r = e.getBoundingClientRect(); const g = getComputedStyle(e)
    return { w: Math.round(r.width), h: r.height, pl: g.paddingLeft, pr: g.paddingRight, bb: g.borderBottomWidth, bc: g.borderBottomColor }
  }))
  check('rows are 72 with pl-16 / pr-8 and a #33333a divider',
    rows.length > 1 && rows.every((r) => r.h === 72 && r.pl === '16px' && r.pr === '8px')
    && rows.slice(0, -1).every((r) => r.bb === '1px' && r.bc === 'rgb(51, 51, 58)'), JSON.stringify(rows[0]))
  check('…and the LAST row draws none: the stack’s bottom edge is the card’s own (29612:24923’s rule, here too)',
    rows[rows.length - 1].bb === '0px', rows[rows.length - 1].bb)
  check('the row wants the board’s 1553 before it scrolls', rows[0].w === 1553, String(rows[0].w))
  const thumb = await R('[data-cloud-row] .rounded-\\[8px\\]')
  check('the thumbnail is a white 48 tile at radius 8',
    thumb[2] === 48 && thumb[3] === 48 && (await CSS('[data-cloud-row] .rounded-\\[8px\\]', 'backgroundColor')) === 'rgb(255, 255, 255)')
  check('…with the 42 image inside it, as drawn',
    (await R('[data-cloud-row] .rounded-\\[8px\\] > div'))[2] === 42)

  /* the scrollbar sits 10 under the list, exactly as wide, and its thumb is the real share */
  const listBox = await R('[data-cloud-list]')
  const bar = await R('[data-cloud-scrollbar]')
  const metrics = await p.$eval('[data-cloud-list]', (n) => [n.clientWidth, n.scrollWidth])
  check('the scrollbar is the list’s width, 10 under it, 8 tall on #33333a',
    bar[2] === listBox[2] && Math.round(bar[1] - (listBox[1] + listBox[3])) === 10 && bar[3] === 8
    && (await CSS('[data-cloud-scrollbar]', 'backgroundColor')) === 'rgb(51, 51, 58)',
    `${bar[2]} vs ${listBox[2]} · gap ${Math.round(bar[1] - (listBox[1] + listBox[3]))}`)
  const barThumb = await R('[data-cloud-scrollbar] b')
  check('…and the 6-tall thumb is the viewport’s real share of the content',
    barThumb[3] === 6 && Math.abs(barThumb[2] - (bar[2] - 2) * (metrics[0] / metrics[1])) < 1.5,
    `${barThumb[2]} vs ${((bar[2] - 2) * (metrics[0] / metrics[1])).toFixed(1)}`)

  /* the two behaviours a mock cannot have */
  const ride = await p.evaluate(async () => {
    const s = document.querySelector('[data-cloud-list]')
    const head = document.querySelector('[data-cloud-headings] > div')
    const act = document.querySelector('[data-cloud-row] .sticky')
    const before = [getComputedStyle(head).transform, act.getBoundingClientRect().right]
    s.scrollLeft = 200
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    const after = [getComputedStyle(head).transform, act.getBoundingClientRect().right]
    s.scrollLeft = 0
    return { before, after, listRight: s.getBoundingClientRect().right }
  })
  check('the column headings ride the list’s horizontal scroll, so the table stays a table',
    /matrix\(1, 0, 0, 1, -200/.test(ride.after[0]) && !/matrix\(1, 0, 0, 1, -/.test(ride.before[0]),
    `${ride.before[0]} → ${ride.after[0]}`)
  check('…and the row actions stay 8 from the visible right edge while it scrolls',
    Math.abs(ride.before[1] - (ride.listRight - 8)) < 1.5 && Math.abs(ride.after[1] - (ride.listRight - 8)) < 1.5,
    `${ride.before[1].toFixed(1)} / ${ride.after[1].toFixed(1)} vs ${(ride.listRight - 8).toFixed(1)}`)

  /* a room the board names but does not draw shows no table at all, rather than an empty one */
  await p.evaluate(() => [...document.querySelectorAll('[data-cloud-menurow]')].find((e) => /Secrets/.test(e.textContent)).click())
  await p.waitForTimeout(300)
  check('a room with nothing drawn for it shows no table and no headings',
    (await p.$('[data-cloud-headings]')) === null && (await p.$('[data-cloud-row]')) === null
    && /Nothing here yet/.test(await p.$eval('[data-cloud-window]', (e) => e.innerText)))
  await p.evaluate(() => [...document.querySelectorAll('[data-cloud-db]')][0].click())
  await p.waitForTimeout(300)

  /* out again */
  await p.keyboard.press('Escape')
  await p.waitForTimeout(600)
  /* the pointer is parked off the rail first: a button under the cursor wears its HOVER,
     and reading that as its resting state is how a true check reports a false failure */
  await p.mouse.move(800, 800)
  await p.waitForTimeout(200)
  check('Escape closes the window and the rail button goes dark again',
    (await p.$('[data-cloud-window]')) === null
    && (await p.$eval('nav.arrive-rail [aria-label="Cloud"]', (e) => getComputedStyle(e).backgroundColor)) === 'rgba(0, 0, 0, 0)')
  await p.click('nav.arrive-rail [aria-label="Cloud"]')
  await p.waitForTimeout(700)
  await p.click('nav.arrive-rail [aria-label="Cloud"]')
  await p.waitForTimeout(600)
  check('…and the button is a toggle: pressing it again puts the site back on the canvas',
    (await p.$('[data-cloud-window]')) === null)
}

check('no page errors anywhere in the run', errors.length === 0, errors.join(' | ').slice(0, 300))
await b.close()

const failed = results.filter(([, ok]) => !ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed · screenshots in ${OUT}`)
process.exit(failed ? 1 : 0)
