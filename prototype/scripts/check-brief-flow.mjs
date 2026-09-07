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
 *      of the home page, one in hand at a time, the canvas empty until that page is
 *      finished. Then the site, and the three ways to work the divider.
 *
 * ⚠️ The run is ~3 minutes now, and most of it is the two builds. That is the point of
 * the case rather than an accident: the generation IS a minute (Figma 29480:48478), and
 * the check that matters most is the negative one — that the site does not appear before
 * the page it is a preview of.
 *   B. strong prompt ("Bella's Bakery" — the composer's own example) → straight to the
 *      build with the canvas OPEN and no questions anywhere, and the same generation
 *      outline over a brief that was never answered (every question on its fallback).
 *   C. a template from the dock ("Use Template") → the seeded prompt is a brief in
 *      itself, so it builds too.
 *   D. the escape hatch: a message typed into the composer while the questions are open
 *      takes over — the panel goes away and the prompt is built as given.
 *
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

/** Type into the hero composer and press Build — the one hand-off under test. */
async function buildFromHome(prompt) {
  await p.goto(at(), { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  await p.fill('input[aria-label="Describe the site you want"]', prompt)
  await p.click('button:has-text("Build")')
  /* BOOT_MS (850) of corridor, then a beat for the shell to settle. */
  await p.waitForTimeout(1400)
}

/* =============================================== A. thin prompt from the hero */

await p.goto(at(), { waitUntil: 'networkidle' })
await p.waitForTimeout(700)
await shot('01-home')
check('the prototype opens on the Home page', await onHome())

await p.fill('input[aria-label="Describe the site you want"]', 'website')
await p.click('button:has-text("Build")')
/* The corridor: a full-screen plate with the mark, ~850ms (BOOT_MS). Sampled early
   enough to still be up, then waited out before anything is clicked. */
await p.waitForTimeout(250)
check('the Home → builder step plays a covered corridor', !!(await p.$('.boot-cover')))
await shot('02a-corridor')
await p.waitForTimeout(1200)
check('the corridor lifts by itself', !(await p.$('.boot-cover')))
await shot('02-builder-collapsed')
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
check('the composer relabels itself as the escape hatch',
  (await p.getAttribute('textarea', 'placeholder'))?.startsWith('Tell Remixer'))

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
await p.click('button[aria-label="Next question"]'); await p.waitForTimeout(300)
{
  /* The colour question is the drawn GRID (25732:139123), not rows: four plates of four
     cells, and its own field with no radio beside it. */
  const plates = await p.$$eval('section [aria-label="Warm Clay"] span', (els) => els.length)
  check('the colour question is a grid of four-cell plates', plates === 4, `${plates} cells`)
}
await p.click('section button[aria-label="Warm Clay"]'); await p.waitForTimeout(250); await shot('06-palette-picked')
check('a picked plate shows it', (await p.getAttribute('section button[aria-label="Warm Clay"]', 'aria-pressed')) === 'true')
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
await p.click('section button[aria-label="Friendly"]'); await p.waitForTimeout(250)
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
check('the canvas opens by itself when the build starts', (await previewState()) === 'open')

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
check('the canvas is open but the site is NOT there yet', (await previewState()) === 'open' && !(await siteUp()))

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
  check('the site appears when the page is finished', await siteUp())
  check('every section of the page is done',
    (await outline())?.rows.every((r) => r.state === 'done'), JSON.stringify((await outline())?.rows.map((r) => r.state)))
  check('the outline stays in the transcript as the record of what was built', await cardUp())
  check('the first version lands and is announced', body.includes('Done —') && body.includes('built to sell'))
  check('the acknowledgement reads as one sentence',
    body.includes('a site built to sell, across a few pages, in Warm Clay with friendly lettering'))
  check('the brief is still readable after the build', body.includes('Warm Clay') && body.includes('Friendly'))
  check('the build spends credits', body.includes('1 990'), 'toolbar balance after one build')
  check('Publish comes alive once the site exists',
    !(await p.$eval('button:has-text("Update"), button:has-text("Publish")', (el) => el.disabled)))
  /* The toggle is in the chat header in BOTH states, so it never jumps the window. */
  check('the chat header carries the preview toggle while the preview is open',
    !!(await p.$('aside > header button[aria-label="Hide preview"]')))
}

await p.click('aside > header button[aria-label="Hide preview"]'); await p.waitForTimeout(600); await shot('13-hidden')
check('Hide preview collapses the canvas', (await previewState()) === 'closed')
check('…and the same button now offers to show it again',
  !!(await p.$('aside > header button[aria-label="Show preview"]')))
await p.click('.chat-reopen'); await p.waitForTimeout(600); await shot('14-reopened')
check('the grip brings it back', (await previewState()) === 'open')

{
  const bb = await (await p.$('.chat-resizer')).boundingBox()
  await p.mouse.move(bb.x, bb.y + 300); await p.mouse.down()
  for (let x = bb.x; x < 1500; x += 60) { await p.mouse.move(x, bb.y + 300); await p.waitForTimeout(16) }
  await p.mouse.up(); await p.waitForTimeout(300); await shot('15-dragged-shut')
  check('dragging past the canvas minimum collapses it', (await previewState()) === 'closed')
}

/* ========================================= B. the composer's own example builds */

await buildFromHome('Bella’s Bakery')
await shot('16-strong-prompt')
check('“Bella’s Bakery” goes straight to the build', (await previewState()) === 'open')
check('no questions for a prompt with substance in it', !(await panelUp()))
/* 3.4s of thinking, then the hand-over line, then 0.9s to the card. */
await p.waitForTimeout(5200); await shot('17-strong-building')
{
  const body = await text()
  check('the line before the build names the work, not a business it cannot know',
    body.includes('Starting on your home page'))
  check('a prompt that skips the brief still gets the outline', await cardUp())
  const o = await outline()
  /* No brief behind this path, so every question falls back to its first option —
     goal=enquiries, pages=one. The same rule the plan uses for a skipped question. */
  check('the fallback outline is the one-page landing site',
    o?.rows.map((r) => r.name).join(' · ') === 'Layout & navigation · Hero · What you offer · Enquiry form · Footer'
      && o?.pages.length === 0,
    `${o?.rows.map((r) => r.name).join(' · ')} | pages=${o?.pages.length}`)
  check('the canvas waits for the page here too', !(await siteUp()))
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
check('a template seeds a brief of its own, so it builds', (await previewState()) === 'open' && !(await panelUp()))
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
check('…and the typed prompt is built as given', (await previewState()) === 'open')

check('no page errors anywhere in the run', errors.length === 0, errors.join(' | ').slice(0, 300))
await b.close()

const failed = results.filter(([, ok]) => !ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed · screenshots in ${OUT}`)
process.exit(failed ? 1 : 0)
