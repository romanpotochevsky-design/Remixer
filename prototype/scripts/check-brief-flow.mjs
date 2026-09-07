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
 *      COLLAPSED and the chat centred, Remixer asks for direction, the four questions
 *      dock above the composer, the answers survive paging, Submit compiles the summary
 *      card, the canvas opens by itself for the build, the site lands. Then the three
 *      ways to work the divider: Hide preview, the grip, and a drag past the minimum.
 *   B. strong prompt ("Bella's Bakery" — the composer's own example) → straight to the
 *      build with the canvas OPEN and no questions anywhere.
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
const NEW_PROJECT = '?p=empty&h=empty&a=trial&t=1&c=2000&i=none'

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
const onHome = () => p.$('input[aria-label="Describe the site you want"]').then(Boolean)
const panelUp = () => p.$('section[aria-label="Questions before building"]').then(Boolean)
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
  await p.goto(`${BASE}/${NEW_PROJECT}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  await p.fill('input[aria-label="Describe the site you want"]', prompt)
  await p.click('button:has-text("Build")')
  await p.waitForTimeout(600)
}

/* =============================================== A. thin prompt from the hero */

await p.goto(`${BASE}/${NEW_PROJECT}`, { waitUntil: 'networkidle' })
await p.waitForTimeout(700)
await shot('01-home')
check('the prototype opens on the Home page', await onHome())

await p.fill('input[aria-label="Describe the site you want"]', 'website')
await p.click('button:has-text("Build")')
await p.waitForTimeout(600)
await shot('02-builder-collapsed')
check('a thin prompt from the hero opens the builder, not a generation', !(await onHome()))
check('the canvas is collapsed on arrival', (await previewState()) === 'closed', `preview=${await previewState()}`)
check('the chat takes the whole shell', (await asideWidth()) > 1200, `aside=${Math.round(await asideWidth())}px`)
{
  const cols = await chatCol()
  const centred = cols.length > 0 && cols.every((c) => c.w <= 600 && Math.abs(c.left - c.right) <= 24)
  check('the chat content is a 600px column, centred', centred, JSON.stringify(cols))
}

await p.waitForTimeout(2600)
await shot('03-question-1')
const askedBody = await p.textContent('body')
check('Remixer asks for direction instead of guessing', askedBody.includes('I’d love to build you a website'))
check('the reply carries its thinking time', askedBody.includes('Thought for 3s'))
check('the question panel docks above the composer', await panelUp())
check('the composer relabels itself as the escape hatch',
  (await p.getAttribute('textarea', 'placeholder'))?.startsWith('Tell Remixer'))

await p.fill('section input', 'design portfolio'); await p.click('text=Next'); await p.waitForTimeout(400); await shot('04-q2')
await p.fill('section input', 'landing'); await p.click('text=Next'); await p.waitForTimeout(400); await shot('05-q3-palette')
/* Back and forward again: paging must not eat an answer (Lovable lets you revise). */
await p.click('button[aria-label="Previous question"]'); await p.waitForTimeout(300)
check('paging back keeps the answer', (await p.inputValue('section input')) === 'landing')
await p.click('button[aria-label="Next question"]'); await p.waitForTimeout(300)
await p.click('section button[aria-label="Midnight Indigo"]'); await p.click('text=Next'); await p.waitForTimeout(400); await shot('06-q4-typography')
await p.click('section button:has-text("Editorial")'); await p.waitForTimeout(200)
await shot('07-q4-picked')
await p.click('text=Submit'); await p.waitForTimeout(700); await shot('08-summary')
{
  const body = await p.textContent('body')
  check('the summary card prints the answers', body.includes('Other: design portfolio') && body.includes('Midnight Indigo'),
    body.includes('Remixer’s pick') ? 'shows Remixer’s pick where an answer was given' : '')
  check('the panel is gone after Submit', !(await panelUp()))
}

await p.waitForTimeout(1600); await shot('09-ack-building')
check('the canvas opens by itself when the build starts', (await previewState()) === 'open')
check('the questions cost nothing — only the build is metered',
  (await p.textContent('body')).includes('2 000'), 'the toolbar should still read 2 000 while building')

await p.waitForTimeout(4600); await shot('10-built')
{
  const body = await p.textContent('body')
  check('the first version lands and is announced', body.includes('Done —') && body.includes('design portfolio'))
  check('the brief is still readable after the build', body.includes('Midnight Indigo') && body.includes('Editorial'))
  check('the build spends credits', body.includes('1 990'), 'toolbar balance after one build')
}

await p.click('button[aria-label="Hide preview"]'); await p.waitForTimeout(600); await shot('11-hidden')
check('Hide preview collapses the canvas', (await previewState()) === 'closed')
await p.click('.chat-reopen'); await p.waitForTimeout(600); await shot('12-reopened')
check('the grip brings it back', (await previewState()) === 'open')

{
  const bb = await (await p.$('.chat-resizer')).boundingBox()
  await p.mouse.move(bb.x, bb.y + 300); await p.mouse.down()
  for (let x = bb.x; x < 1500; x += 60) { await p.mouse.move(x, bb.y + 300); await p.waitForTimeout(16) }
  await p.mouse.up(); await p.waitForTimeout(300); await shot('13-dragged-shut')
  check('dragging past the canvas minimum collapses it', (await previewState()) === 'closed')
}

/* ========================================= B. the composer's own example builds */

await buildFromHome('Bella’s Bakery')
await shot('14-strong-prompt')
check('“Bella’s Bakery” goes straight to the build', (await previewState()) === 'open')
check('no questions for a prompt with substance in it', !(await panelUp()))
await p.waitForTimeout(3200); await shot('15-strong-built')
check('the strong prompt produces a site', (await p.textContent('body')).includes('Bella'))

/* ================================================== C. a template from the dock */

await p.goto(`${BASE}/${NEW_PROJECT}`, { waitUntil: 'networkidle' })
await p.waitForTimeout(700)
await p.click('button:has-text("Templates")')
await p.waitForTimeout(500)
await p.click('[aria-label="Open Marketing Campaign Hub"]')
await p.waitForTimeout(1200)
await shot('16-template-preview')
/* `Use Template` is the panel's CTA on every door; on the DOCK CARD's door it means
   build (TemplatePicker's `onRemix`), which is the path under test here. */
await p.click('button:has-text("Use Template")')
await p.waitForTimeout(1200)
await shot('17-template-building')
check('a template seeds a brief of its own, so it builds', (await previewState()) === 'open' && !(await panelUp()))
check('the template names itself in the first message', (await p.textContent('body')).includes('template'))

/* ============================= D. the composer overrides the open question panel */

await buildFromHome('website')
await p.waitForTimeout(2800)
check('the panel is up before the override', await panelUp())
await p.fill('textarea', 'A one-page site for my ceramics studio in Odesa')
await p.keyboard.press('Enter')
await p.waitForTimeout(700); await shot('18-override')
check('typing into the composer dismisses the questions', !(await panelUp()))
check('…and the typed prompt is built as given', (await previewState()) === 'open')

check('no page errors anywhere in the run', errors.length === 0, errors.join(' | ').slice(0, 300))
await b.close()

const failed = results.filter(([, ok]) => !ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed · screenshots in ${OUT}`)
process.exit(failed ? 1 : 0)
