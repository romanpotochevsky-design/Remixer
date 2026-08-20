#!/usr/bin/env node
/**
 * `npm run smoke` — the browser walk. Quality gate 2, docs/global/AGREEMENTS.md §5.
 *
 * WHY THIS FILE EXISTS. On 20.08.2026 work was accepted on a green `npm run build` and a
 * green `tsc`, and the designer opened the prototype on a BLACK SCREEN: inside
 * DomainsSurface an `inAccount` check ran `.some()` over a callback that read `hero` two
 * lines ABOVE the `const hero` — a temporal dead zone entered synchronously during
 * render. React threw in the commit phase and the whole tree unmounted (commit 4b7992d).
 * TypeScript cannot see a TDZ read through a closure, and it cannot see any of that
 * class: `undefined` at render time, a missing key in a lookup table, a throw in the
 * first effect. A green build proves the code COMPILES. The designer sees the RUNTIME.
 *
 * So this drives the real artifact in a real browser and clicks through the screens the
 * designer actually looks at, with every error channel wired to a listener.
 *
 * THE THREE RULES THAT MAKE IT A GATE RATHER THAN A RITUAL
 *
 * 1. THE ARTIFACT, NOT THE DEV SERVER. What gets published is one self-contained HTML
 *    file with its CSS, JS and fonts folded in (`scripts/build-artifact.mjs`). A green
 *    `npm run dev` proves nothing about that file, so `npm run smoke` rebuilds it first
 *    and this script refuses to run without it. It is loaded over `file://` — verified
 *    self-contained, zero failed requests, so a static server would buy nothing and add
 *    a port, a lifecycle and a teardown-flake surface.
 *
 * 2. A FRESH CONTEXT PER SITUATION, closed by `run()` so no situation body can forget.
 *    World state travels in the URL and in `localStorage` under `remixer-prototype/world`
 *    (src/state/world.ts), and ONE click persists the whole world including the chat
 *    transcript. A reused context stages a situation nobody asked for and the failure
 *    lands in the next step.
 *
 * 3. NO ALLOWLIST, EVER. Zero `pageerror`, zero console errors, zero failed requests,
 *    zero renderer crashes. The first `if (msg.includes(...)) return` added here is the
 *    moment this file stops gating. If a real error shows up, fix the cause.
 *
 * AND ONE MORE, learned from the injected-crash rehearsal: EVERY SITUATION ASSERTS
 * SOMETHING POSITIVE. On the broken build the cold open passed clean — the crash only
 * surfaced once a click reached the crashing screen. An error-only walk passes on a page
 * that renders nothing. So each situation checks structural liveness (`#root` has a
 * child, body text over a floor) AND one named element only that screen renders.
 *
 * WHAT IS DELIBERATELY NOT ASSERTED
 *  · Intermediate stages of the self-advancing domain road (state/progress.ts walks
 *    connecting → verifying → securing → live on 2.2/2.4/2.6s timers). Asserting "one
 *    tick is ticked" is a race by construction. We assert the rows EXIST, then wait for
 *    the terminal copy.
 *  · Transitional computed styles (the search header's 40 → 32px title measures 32.73px
 *    while it settles). Presence, not pixels.
 *  · Glow presence around a send — it is held back 700ms on purpose (App.tsx). Only the
 *    staged `?h=working` situation looks for it.
 *  · Screenshot comparison, and clicking by coordinates. Locators only.
 *
 * NAVIGATION IS NOT IN THE URL. `surface`, `domainScreen`, `domainModal`, `publishOpen`
 * and `device` all start at fixed defaults in src/state/ui.ts and are neither persisted
 * nor URL-encoded. `?d=live` does NOT open the Publish panel; `?d=searching` does NOT
 * open the domains window. Only the WORLD travels in the query string. Every surface,
 * panel and sheet here is reached by a real click — an earlier ad-hoc probe opened
 * `?d=searching` and typed into what it assumed was the search field, which with the
 * domains window closed was the chat composer.
 *
 * RUNTIME. Tens of seconds, sequential, and kept there by: ONE `browser.launch()` for
 * the whole run with a cheap context per situation; no `waitForTimeout` anywhere as a
 * synchronisation primitive — every wait is a `waitFor` on the thing the step is about;
 * and pressing `Refresh status` to accelerate the connect road (~2.3s) instead of
 * waiting it out (~6.4s). Situations run one after another because the output is read by
 * a human and parallelism would scramble it.
 *
 * ENVIRONMENT. `playwright` is installed GLOBALLY and the browsers live where
 * PLAYWRIGHT_BROWSERS_PATH points. It is resolved through `createRequire` seeded at the
 * global root because ESM ignores NODE_PATH; ask for 'playwright', never
 * 'playwright-core' (that one is nested inside it and is not resolvable). It is NOT a
 * dependency of package.json — that would invite npm to fetch a second browser set —
 * and `playwright install` must never run: the browsers are already on disk.
 *
 * Usage:  node scripts/smoke.mjs [path-to-artifact.html]
 */
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// playwright lives in the GLOBAL node_modules and ESM ignores NODE_PATH, so it is
// resolved through a require() seeded at the global root. See the header.
const globalRequire = createRequire(
  execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim() + '/',
)
const { chromium } = globalRequire('playwright')

/* ------------------------------------------------------------------ the artifact */

const ARTIFACT = resolve(process.argv[2] ?? `${ROOT}/dist/remixer-prototype.html`)
if (!existsSync(ARTIFACT)) {
  console.error(`smoke: no artifact at ${ARTIFACT}`)
  console.error('smoke: run `npm run artifact` first (or `npm run smoke`, which does it).')
  console.error('smoke: never fall back to the dev server — the artifact is what ships.')
  process.exit(1)
}
const BASE = pathToFileURL(ARTIFACT).href
const SHOTS = `${ROOT}/dist/smoke`

/*
 * The `domain` axis, READ OUT OF THE SOURCE rather than copied here.
 *
 * The cold sweep below must cover every value the axis can hold, including the ones no
 * click in the walk visits. A list retyped here would drift the first time somebody
 * edits the union — `checkout` was a legal value until 20.08.2026 and is not one now.
 * So the values come from the runtime-validation table in state/world.ts, which `tsc`
 * already forces to match the union exactly (`Record<DomainState, true>`).
 */
function domainStatesFromSource() {
  const src = readFileSync(`${ROOT}/src/state/world.ts`, 'utf8')
  const block = src.match(/domain:\s*values<DomainState>\(\{([\s\S]*?)\}\)/)
  if (!block) {
    console.error('smoke: could not find `domain: values<DomainState>({…})` in src/state/world.ts.')
    console.error('smoke: the sweep needs the real axis — fix this parse, do not hardcode a list.')
    process.exit(1)
  }
  const found = [...block[1].matchAll(/([A-Za-z][\w-]*)\s*:\s*true/g)].map((m) => m[1])
  if (found.length < 2) {
    console.error('smoke: parsed the domain axis but found no values. Refusing to run a fake sweep.')
    process.exit(1)
  }
  return found
}
const DOMAIN_STATES = domainStatesFromSource()

/* ------------------------------------------------------------------ the harness */

/** Healthy shell measures ~1000+ characters of body text; a crashed tree measures 0. */
const TEXT_FLOOR = 300

const results = []
let browser

/**
 * One situation: fresh context, every error channel listening, liveness checked at the
 * first paint and again at the end, screenshot on failure, context always closed.
 */
async function run(id, name, query, body, opts = {}) {
  const url = BASE + (query ? `?${query}` : '')
  const started = Date.now()
  const context = await browser.newContext(opts.context ?? {})
  // Runs in the page before any of the app's own code — the only way to take
  // capabilities AWAY from the prototype (see situation 15).
  if (opts.init) await context.addInitScript(opts.init)
  const page = await context.newPage()

  const errs = { pageerror: [], console: [], requestfailed: [], crash: [] }
  page.on('pageerror', (e) => errs.pageerror.push(String((e && e.stack) || e)))
  page.on('console', (m) => { if (m.type() === 'error') errs.console.push(m.text()) })
  page.on('requestfailed', (r) =>
    errs.requestfailed.push(`${r.url()} — ${r.failure()?.errorText ?? 'failed'}`))
  page.on('crash', () => errs.crash.push('the renderer process crashed'))

  let step = 'load the artifact'
  let vitals = null

  /** Structural liveness — the second net, and the one the black screen tripped. */
  const alive = async () => {
    const v = await page.evaluate(() => ({
      kids: document.getElementById('root')?.childElementCount ?? -1,
      chars: (document.body.innerText || '').trim().length,
    }))
    vitals = v
    if (v.kids < 1) throw new Error(`#root has ${v.kids} children — the tree is not mounted`)
    if (v.chars < TEXT_FLOOR) throw new Error(`body text is ${v.chars} chars (floor ${TEXT_FLOOR})`)
  }

  // The situation body gets these and nothing else, so every wait is a wait on the
  // thing the step is about and every failure carries the step's own name.
  const at = (label) => { step = label }
  const must = async (locator, what, timeout = 6000) => {
    at(`expected ${what}`)
    try {
      await locator.first().waitFor({ state: 'visible', timeout })
    } catch {
      throw new Error(`expected ${what}`)
    }
  }
  const attached = async (locator, what, timeout = 6000) => {
    at(`expected ${what}`)
    try {
      await locator.first().waitFor({ state: 'attached', timeout })
    } catch {
      throw new Error(`expected ${what}`)
    }
  }
  const gone = async (locator, what, timeout = 6000) => {
    at(`expected ${what} to disappear`)
    try {
      await locator.first().waitFor({ state: 'detached', timeout })
    } catch {
      throw new Error(`expected ${what} to disappear`)
    }
  }
  const absent = async (locator, what) => {
    at(`expected no ${what}`)
    const n = await locator.count()
    if (n !== 0) throw new Error(`expected no ${what}, found ${n}`)
  }
  const click = async (locator, what) => {
    at(`click ${what}`)
    await locator.first().click({ timeout: 6000 })
  }
  const layoutWidth = async (selector, expected, what) => {
    at(`${what} laid out at ${expected}px`)
    // offsetWidth, not the bounding box: it is the LAYOUT width, so a spring still
    // scaling the element cannot make this assertion flake.
    await page.waitForFunction(
      ([sel, px]) => document.querySelector(sel)?.offsetWidth === px,
      [selector, expected],
      { timeout: 6000 },
    ).catch(async () => {
      const got = await page.evaluate((sel) => document.querySelector(sel)?.offsetWidth ?? null, selector)
      throw new Error(`${what}: expected offsetWidth ${expected}px, got ${got}`)
    })
  }

  let failure = null
  try {
    await page.goto(url, { waitUntil: 'load' })
    at('first paint')
    await alive()
    await body({ page, context, at, must, attached, gone, absent, click, layoutWidth, alive })
    at('settle')
    // Two frames, not a sleep: lets an error thrown from a render or a layout effect
    // land in the listeners above before the situation is called a pass.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    await alive()
  } catch (e) {
    failure = e instanceof Error ? e.message : String(e)
    // Re-measure so the FAIL block reports the tree AT THE MOMENT OF DEATH rather than at
    // the first paint — otherwise a black screen is reported with the healthy shell's
    // numbers, which is the opposite of useful. Measured on the TDZ rehearsal: the cold
    // open reads 1 child / 1023 chars and passes clean, and the same page after the click
    // into search reads 0 / 0. Both halves matter: the zero is why liveness is a real net,
    // and the clean cold open is why every situation must also assert something POSITIVE —
    // a shorter walk that never reaches the crashing screen goes green on a dead page.
    vitals = await page.evaluate(() => ({
      kids: document.getElementById('root')?.childElementCount ?? -1,
      chars: (document.body.innerText || '').trim().length,
    })).catch(() => vitals)
  }

  const noise = [
    ...errs.pageerror.map((t) => ['page error', t]),
    ...errs.console.map((t) => ['console error', t]),
    ...errs.requestfailed.map((t) => ['failed request', t]),
    ...errs.crash.map((t) => ['crash', t]),
  ]
  if (!failure && noise.length) failure = `${noise.length} error(s) on a page that otherwise passed`

  const ms = Date.now() - started
  if (failure) {
    mkdirSync(SHOTS, { recursive: true })
    const shot = `${SHOTS}/${id}-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`
    await page.screenshot({ path: shot, fullPage: false }).catch(() => {})
    console.log(`FAIL ${id}  ${name}`)
    console.log(`  situation: ${url}`)
    console.log(`  step:      ${step}`)
    console.log(`  reason:    ${failure}`)
    if (vitals) console.log(`  #root children: ${vitals.kids}   body text: ${vitals.chars} chars`)
    for (const [kind, text] of noise) {
      console.log(`  ${kind}: ${text.split('\n').slice(0, 3).join('\n             ')}`)
    }
    console.log(`  screenshot: ${shot}`)
    results.push({ id, name, ok: false, step, ms })
  } else {
    const q = query ? `  (?${query})` : ''
    console.log(`ok   ${id}  ${name.padEnd(46)}${String(ms).padStart(6)} ms${q}`)
    results.push({ id, name, ok: true, ms })
  }

  await context.close()
}

/* ------------------------------------------------------------------ situations */

async function main() {
  const t0 = Date.now()
  console.log(`smoke: ${ARTIFACT}`)
  console.log(`smoke: ${DOMAIN_STATES.length} domain states read from src/state/world.ts: ${DOMAIN_STATES.join(' ')}`)
  browser = await chromium.launch()

  /* ---- 00 -------------------------------------------------------------------
   * Cold sweep of the whole `domain` axis. Liveness plus the permanent chrome —
   * it is the only net that reaches branches no click in this walk visits, and
   * the only thing that would have caught the axis value with no screen behind
   * it. Every `d=` is paired with `a=paid`: a custom domain without a plan is a
   * `violations()` combination (state/world.ts) and not a real situation.
   */
  for (const d of DOMAIN_STATES) {
    await run(`00.${d}`, `cold: domain=${d}`, `a=paid&d=${d}&i=dh-free`, async ({ must, page }) => {
      await must(page.locator('[data-testid="toolbar-address"]'), 'the toolbar address button')
      await must(page.getByLabel('Message Remixer'), 'the composer')
    })
  }

  /* ---- 01 -------------------------------------------------------------------
   * Cold open with NO query string — literally what the designer's click on the
   * artifact link does, and the only path through `initialWorld()`'s
   * localStorage-then-DEFAULT_WORLD branch.
   */
  await run('01', 'cold open, virgin context', '', async ({ page, must }) => {
    await must(page.getByLabel('Message Remixer'), 'the composer')
    await must(page.locator('[data-testid="chat-thread"]'), 'the chat thread')
    await must(page.locator('.site-stage'), 'the site preview stage')
    await must(page.locator('[title="Credits"]').filter({ hasText: '640' }), 'credits reading 640')
    await must(
      page.locator('[data-testid="toolbar-address"]').filter({ hasText: 'remixer.ai' }),
      'the staging address in the toolbar',
    )
  })

  /* ---- 02 -------------------------------------------------------------------
   * The chat send — the one gesture the user performs, and one send moves five
   * world axes at once (modules/chat/send.ts).
   *
   * ⚠️ `Try again` is NOT a reply signal: it sits under every prior AI message,
   * so the default `chat: 'long'` thread already has one and waiting on its
   * presence returns instantly with no reply having arrived. The deterministic
   * signal is the credits value (640 − COST 10) and the dot appearing on the
   * toolbar's Publish button (unpublished 0 → 1).
   */
  const sendPath = async ({ page, must, gone, click }) => {
    await page.getByLabel('Message Remixer').fill('add a pricing section')
    await click(page.getByLabel('Message Remixer'), 'the composer (focus)')
    await page.getByLabel('Message Remixer').press('Enter')
    await must(page.getByText('Thinking', { exact: true }), 'the Thinking indicator')
    await must(page.getByText('add a pricing section'), 'the sent bubble')
    await must(page.locator('[title="Credits"]').filter({ hasText: '630' }), 'credits down to 630', 12000)
    await gone(page.getByText('Thinking', { exact: true }), 'the Thinking indicator')
    await must(
      page.locator('[data-testid="toolbar-publish"] > span'),
      'the unpublished dot on the toolbar Publish button',
    )
  }
  await run('02', 'chat send → reply lands', '', sendPath)

  /* ---- 03 -------------------------------------------------------------------
   * The burning glow. It is the ONLY loading indicator in the product (the
   * skeleton was removed deliberately), and SiriGlow — quality governor and all
   * — mounts nowhere else. It is held back 700ms after a send on purpose, which
   * is why this is a staged situation and not an assertion around step 02.
   */
  await run('03', 'generating, glow burning', 'a=trial&h=working&p=generating', async ({ page, must, attached }) => {
    await must(page.getByText('Building your pages…'), 'the generating copy on the canvas')
    await must(page.getByText('Thinking', { exact: true }), 'the Thinking indicator')
    await attached(page.locator('[class*="siri-glow"]'), 'the Siri edge glow', 4000)
  })

  /* ---- 04 -------------------------------------------------------------------
   * The domains dashboard — the second surface in the app, reachable only by a
   * click on the toolbar address. `owned.length > 0` selects the two-column
   * layout. `Renews at $19.99` is the "renewal is never hidden" rule made
   * executable. The connect row is the newest thing on this screen (20.08.2026)
   * and it has NO Figma frame — asserted here so a silent removal goes red.
   */
  await run('04', 'domains dashboard', 'a=paid&i=dh-free', async ({ page, must, click }) => {
    await click(page.locator('[data-testid="toolbar-address"]'), 'the toolbar address')
    await must(page.locator('[data-testid="domains-surface"]'), 'the domains window')
    await must(page.getByText('Find your domain name'), 'the dashboard title')
    await must(page.getByPlaceholder('Search a name to buy, or enter one you already own'), 'the search field')
    await must(page.getByText('Existing domains'), 'the Existing domains column')
    await must(page.getByText('AI suggestions'), 'the AI suggestions column')
    await must(page.getByText('Best match'), 'the Best match hero')
    await must(page.getByText(/Renews at \$19\.99/), 'an honest renewal price')
    // the permanent door for a domain you already own
    await must(page.getByText('Already have a domain?'), 'the connect row question')
    await must(page.getByText('Connect it', { exact: true }), 'the connect row verb')
    // With nothing typed the row puts the caret in the universal field — it must
    // not navigate, because the external screen would then hand somebody records
    // for a demo domain they never typed.
    await click(page.getByText('Connect it', { exact: true }), 'the connect row')
    const focused = await page.evaluate(() => {
      const el = document.activeElement
      return el ? `${el.tagName}:${el.getAttribute('placeholder') ?? ''}` : 'none'
    })
    if (!focused.startsWith('INPUT:Search a name')) {
      throw new Error(`connect row with an empty field should focus the search input, focus was ${focused}`)
    }
    await must(page.locator('[data-testid="domains-surface"]'), 'the dashboard (the row must not navigate)')
  })

  /* ---- 05 -------------------------------------------------------------------
   * Search → results. THIS IS THE SCREEN THAT WENT BLACK (4b7992d): ResultsScreen
   * is reached by exactly one path and by nothing else.
   *
   * `fit-ration` on purpose — it is deliberately kept out of TAKEN_DOMAINS so the
   * first search anyone runs lands on the available Best-match hero.
   *
   * The bonus assertion locks down the persistent-field decision: the header is
   * mounted once, OUTSIDE the screen swap, so searching must not remount the
   * field. The DOM node is tagged before the search and looked for after.
   */
  await run('05', 'search → results (the black-screen path)', 'a=paid&i=dh-free', async ({ page, must, click }) => {
    await click(page.locator('[data-testid="toolbar-address"]'), 'the toolbar address')
    const field = page.getByPlaceholder('Search a name to buy, or enter one you already own')
    await must(field, 'the search field')
    await field.evaluate((el) => { el.dataset.smokeMark = 'kept' })
    await field.fill('fit-ration')
    await field.press('Enter')
    await must(page.locator('[data-testid="domains-results"]'), 'the results sheet')
    await must(page.getByText('Best match'), 'the Best match hero')
    await must(page.getByText('Show more endings'), 'the other-endings footer')
    await must(page.getByText('400+ more available'), 'the "there are more" line')
    await must(page.getByText('Name ideas for your site'), 'the AI name-ideas block')
    await must(page.getByText('Already have a domain?'), 'the connect row (permanent on results too)')
    await must(page.locator('input[data-smoke-mark="kept"]'), 'the SAME search input, never remounted')
    const still = await page.evaluate(() => document.activeElement?.tagName ?? 'none')
    if (still !== 'INPUT') throw new Error(`focus should stay in the search field, activeElement was ${still}`)
  })

  /* ---- 06 -------------------------------------------------------------------
   * Search → a registered name. The only path through `heroTaken` / `inAccount`
   * — the exact expression that carried the TDZ read — and the highest-churn copy
   * on the surface, since the taken state is drawn in no Figma frame at all
   * (docs/features/domains/OPEN-QUESTIONS.md 01).
   */
  await run('06', 'search → registered hero (is it yours?)', 'a=paid&i=dh-free', async ({ page, must, click }) => {
    await click(page.locator('[data-testid="toolbar-address"]'), 'the toolbar address')
    const field = page.getByPlaceholder('Search a name to buy, or enter one you already own')
    await field.fill('coffeeshop.com')
    await field.press('Enter')
    await must(page.locator('[data-testid="domains-results"]'), 'the results sheet')
    await must(page.getByText('Already registered'), 'the "Already registered" eyebrow')
    await must(page.getByText('Registered at GoDaddy. Is it yours?'), 'the ownership question')
    await must(page.getByRole('button', { name: 'Yes, connect it' }), 'the affirmative exit')
    await must(page.getByText('Name ideas for your site'), 'the alternatives, i.e. the other exit')
  })

  /* ---- 07 -------------------------------------------------------------------
   * The checkout sheet, corner one: `buy` × no plan — the tall sheet, where the
   * paywall is disclosed. Six drawn states, two axes, ONE component; asserting
   * two opposite corners is what proves that claim still holds.
   */
  await run('07', 'checkout sheet: buy × no plan', 'a=trial&i=dh-free', async ({ page, must, click, layoutWidth }) => {
    await click(page.locator('[data-testid="toolbar-address"]'), 'the toolbar address')
    await click(page.getByRole('button', { name: 'Buy', exact: true }), 'the hero Buy button')
    await must(page.locator('[data-testid="checkout-sheet"]'), 'the checkout sheet')
    await must(page.getByRole('dialog', { name: 'Connect domain' }), 'the app-modal wrapper')
    await must(page.getByText('Remixer Build'), 'the plan being disclosed inside the sheet')
    await must(page.locator('[data-term="yearly"]'), 'the yearly plan card')
    await must(page.locator('[data-term="monthly"]'), 'the monthly plan card')
    await must(page.getByText('Save 33%'), 'the yearly saving badge')
    await must(page.getByRole('button', { name: 'Continue to checkout' }), 'the checkout CTA')
    await layoutWidth('[data-testid="checkout-sheet"]', 600, 'the tall sheet')
  })

  /* ---- 08 -------------------------------------------------------------------
   * The opposite corner: `connect-existing` × has plan — the lean sheet. Owned
   * domains cost nothing to attach, so the absence of a price here is a product
   * rule, not a layout accident.
   *
   * `Connect domain` is both the sheet's h3 and its CTA; the role filter keeps
   * them apart, which is verified by the click landing.
   */
  await run('08', 'checkout sheet: connect × has plan', 'a=paid&i=dh-free', async ({ page, must, absent, click, layoutWidth }) => {
    await click(page.locator('[data-testid="toolbar-address"]'), 'the toolbar address')
    await click(page.getByRole('button', { name: 'Connect', exact: true }), 'the first Connect row button')
    await must(page.locator('[data-testid="checkout-sheet"]'), 'the checkout sheet')
    await must(page.getByText('On DreamHost · connects in a few seconds'), 'the zero-record sub-label')
    await must(page.getByRole('button', { name: 'Connect domain' }), 'the connect CTA')
    await absent(page.locator('[data-term]'), 'plan cards on the lean sheet')
    await absent(page.locator('[data-testid="checkout-sheet"]').getByText(/^\$/), 'a price on an owned domain')
    await layoutWidth('[data-testid="checkout-sheet"]', 560, 'the lean sheet')
  })

  /* ---- 09 -------------------------------------------------------------------
   * The connect road, ticking to live IN THE PUBLISH PANEL. Three separate doors
   * hand the sheet off to the panel (DomainModal, OwnScreen, ExternalScreen);
   * this walks the purchase-path one, which is the most demoed.
   *
   * `Refresh status` is pressed to accelerate, not to assert: state/progress.ts
   * advances the road on its own timers, so a press can race the clock and find
   * the button already gone. The presses are therefore best-effort and the REAL
   * assertion is the terminal copy, which is reached either way.
   */
  await run('09', 'connect → live in the Publish panel', 'a=paid&i=dh-free', async ({ page, must, click }) => {
    await click(page.locator('[data-testid="toolbar-address"]'), 'the toolbar address')
    await click(page.getByRole('button', { name: 'Connect', exact: true }), 'the first Connect row button')
    await click(page.getByRole('button', { name: 'Connect domain' }), 'the connect CTA')
    const panel = page.getByRole('dialog', { name: 'Publish' })
    await must(panel, 'the Publish panel taking the handoff')
    await must(panel.getByText('Domain settings updated'), 'checklist row 1')
    await must(panel.getByText('Connected to your site'), 'checklist row 2')
    await must(panel.getByText('Security (SSL) on'), 'checklist row 3 (the padlock, always last)')
    for (let i = 0; i < 3; i++) {
      // best-effort accelerator; see the note above
      await panel.getByRole('button', { name: 'Refresh status' })
        .click({ timeout: 1200 }).catch(() => {})
    }
    await must(panel.getByText('Secure padlock on · anyone can visit.'), 'the terminal success line', 12000)
    await must(panel.getByRole('button', { name: 'Manage domains' }), 'the way out of the panel')
  })

  /* ---- 10 -------------------------------------------------------------------
   * The Publish panel, dirty × live, and the press. The panel's CLEAN half is
   * flagged in its own source as not being on the designer's board — "this half
   * is a reading" — and the half nobody drew is the half most likely to break.
   */
  await run('10', 'publish panel: dirty → clean', 'a=paid&d=live&u=4', async ({ page, must, gone, click }) => {
    await click(page.locator('[data-testid="toolbar-publish"]'), 'the toolbar Publish button')
    const panel = page.getByRole('dialog', { name: 'Publish' })
    await must(panel, 'the Publish panel')
    await must(panel.getByText('4 unpublished changes'), 'the pending-changes sentence')
    await must(panel.getByText('Secure padlock on · anyone can visit.'), 'the padlock line on a live site')
    await click(panel.getByRole('button', { name: 'Publish changes' }), 'Publish changes')
    await gone(page.getByText('4 unpublished changes'), 'the pending-changes sentence')
    await must(panel.getByRole('button', { name: 'Visit site' }), 'the clean state offering Visit site')
  })

  /* ---- 11 -------------------------------------------------------------------
   * `ready` — the address works and nobody ever pressed Publish. STATES.md calls
   * it the most common state a novice reaches, and it is one of two states whose
   * only home is the status screen behind the toolbar address.
   */
  await run('11', 'ready → publish → live', 'a=paid&d=ready&i=dh-free&u=2', async ({ page, must, click }) => {
    await click(page.locator('[data-testid="toolbar-address"]'), 'the toolbar address')
    await must(page.locator('[data-testid="domains-surface"]'), 'the domains window on the status screen')
    await must(page.getByText('Ready to publish'), 'the ready eyebrow')
    await must(page.getByText('fit-ration.com'), 'the attached domain')
    await click(page.locator('main').getByRole('button', { name: 'Publish', exact: true }), 'the Publish verb')
    await must(page.getByText('Live', { exact: true }), 'the live eyebrow')
    await must(page.getByText('Secure padlock on · anyone can visit.'), 'the success line')
  })

  /* ---- 12 -------------------------------------------------------------------
   * `unreachable` — the failure state, and the other state with no other home.
   * Its verb was reachable by no click at all until 20.08.2026.
   */
  await run('12', 'unreachable → Fix this', 'a=paid&d=unreachable&i=dh-external-ns', async ({ page, must, click }) => {
    await click(page.locator('[data-testid="toolbar-address"]'), 'the toolbar address')
    await must(page.getByText('Stopped showing your site'), 'the failure eyebrow')
    await must(page.getByRole('button', { name: 'Fix this' }), 'the repair verb')
    await must(page.getByText(/Your site is safe/), 'the reassurance about the site')
  })

  /* ---- 13 -------------------------------------------------------------------
   * Mobile preview — on the designer's list in AGREEMENTS §5, and the only thing
   * in the app that reflows on a STAGE resize rather than a window resize
   * (container queries). Width only: `maxHeight: 100%` clamps the height, so 844
   * is not what lands.
   */
  await run('13', 'mobile preview', '', async ({ page, must, click, layoutWidth }) => {
    await click(page.getByRole('button', { name: 'Switch to mobile view' }), 'the device switch')
    await must(page.getByRole('button', { name: 'Switch to desktop view' }), 'the switch now reading desktop')
    await layoutWidth('.site-stage', 390, 'the phone frame')
  })

  /* ---- 14 -------------------------------------------------------------------
   * Reduced motion. Two animation engines, one policy: the CSS blocks plus
   * `<MotionConfig reducedMotion="user">` in main.tsx. Getting it wrong reads as
   * "broken" rather than as a setting honoured, and nothing else covers this path
   * — so the whole send pipeline is walked again with the animations dead.
   */
  await run('14', 'chat send under reduced motion', '', sendPath, { context: { reducedMotion: 'reduce' } })

  /* ---- 15 -------------------------------------------------------------------
   * Storage and history DENIED — the sandboxed-embed path. The published artifact
   * runs inside an embed where `localStorage` and `history` may be walled off;
   * state/world.ts carries try/catch for exactly that, and over file:// those
   * branches never run. This is the only situation that enters them.
   */
  await run('15', 'localStorage and history denied', 'a=paid&d=live', async ({ page, must }) => {
    await must(page.locator('[data-testid="toolbar-address"]'), 'the toolbar address button')
    await must(page.getByLabel('Message Remixer'), 'the composer')
    await must(page.locator('.site-stage'), 'the site preview stage')
    // Prove the denial actually took, so a future change to addInitScript that
    // silently stops applying cannot leave this situation passing as a no-op.
    const denied = await page.evaluate(() => {
      let storage = false
      let history = false
      try { window.localStorage.getItem('x') } catch { storage = true }
      try { window.history.replaceState(null, '', location.href) } catch { history = true }
      return { storage, history }
    })
    if (!denied.storage || !denied.history) {
      throw new Error(`the sandbox denial did not apply: ${JSON.stringify(denied)}`)
    }
  }, {
    init: () => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() { throw new Error('localStorage is walled off in this embed') },
      })
      window.history.replaceState = () => { throw new Error('history is walled off in this embed') }
    },
  })

  /* ---- 16 -------------------------------------------------------------------
   * The prototype console — how the designer stages anything, and the one
   * component that calls `violations()` for every preset on every render. A throw
   * there blanks the tree exactly like 4b7992d did.
   *
   * Ordering rule: once open it is 400px of fixed overlay covering the right rail
   * and the Publish button, so it goes LAST, and it is reached by its aria-label,
   * never by position.
   */
  await run('16', 'prototype console', '', async ({ page, must, gone, click }) => {
    await click(page.getByRole('button', { name: 'Prototype console' }), 'the console handle')
    await must(page.getByText('On screen now'), 'the situation description')
    await must(page.getByRole('button', { name: /Live site/ }), 'a Situations preset')
    await page.keyboard.press('Escape')
    await gone(page.getByText('On screen now'), 'the console')
  })

  /* ---- 17 -------------------------------------------------------------------
   * A LINK SHARED YESTERDAY, opened today. `checkout` was a legal value of the
   * `domain` axis until 20.08.2026; a link copied then still carries
   * `?d=checkout`, and unvalidated it would land in the world as-is — where a
   * `Record<DomainState, …>` lookup returns undefined and reading a field off it
   * throws inside render. That is the black-screen class arriving by URL, which
   * is why `sanitize()` exists in state/world.ts. This is the situation that
   * keeps it honest: the stale key must DEGRADE to the default, not throw.
   */
  await run('17', 'stale link from an older build', 'a=paid&d=checkout', async ({ page, must }) => {
    await must(
      page.locator('[data-testid="toolbar-address"]').filter({ hasText: 'remixer.ai' }),
      'the shell on the default domain state, the unknown value dropped',
    )
    await must(page.locator('.site-stage'), 'the site preview stage')
  })

  /* ---- 18 -------------------------------------------------------------------
   * The connect row with a domain already typed. It adds no screen, no route and
   * no state flag: it goes through `submit()`, the one router, which sends a
   * registered name to the ownership question rather than handing over records
   * for a domain nobody has proved is theirs.
   */
  await run('18', 'connect row routes a typed domain', 'a=paid&i=dh-free', async ({ page, must, click }) => {
    await click(page.locator('[data-testid="toolbar-address"]'), 'the toolbar address')
    await page.getByPlaceholder('Search a name to buy, or enter one you already own').fill('emberandoak.com')
    await click(page.getByText('Connect it', { exact: true }), 'the connect row')
    await must(page.locator('[data-testid="domains-results"]'), 'the results sheet')
    await must(page.getByText('Already registered'), 'the ownership question, not a records dump')
    await must(page.getByRole('button', { name: 'Yes, connect it' }), 'the affirmative exit')
  })

  /* ---- 19 -------------------------------------------------------------------
   * The external domain: registrar detected, guided-manual records. Nothing here
   * may promise one-click — DreamHost supports Domain Connect in no role and has
   * no Entri, so this path is the honest one and it must stay reachable.
   *
   * The de-jargon rule (COPY-RULES §2) is made executable here rather than left
   * as prose: this is the screen where DNS vocabulary would leak in first, and it
   * is the screen where a novice is least able to absorb it. If the wording has to
   * change, this assertion going red is the right behaviour, not flake.
   */
  await run('19', 'external domain → guided records', 'a=paid&i=external-manual', async ({ page, at, must, click }) => {
    await click(page.locator('[data-testid="toolbar-address"]'), 'the toolbar address')
    const field = page.getByPlaceholder('Search a name to buy, or enter one you already own')
    await field.fill('mycafe.com')
    await field.press('Enter')
    await must(page.getByText('Connect your domain'), 'the external-domain eyebrow')
    await must(page.getByText('Registered at Namecheap. It stays there — no transfer needed.'), 'the detection line')
    await must(page.getByText('Point your domain to us — 2 lines to paste at Namecheap'), 'the de-jargoned records card')
    await must(page.getByText('Website address'), 'the first named value')
    await must(page.getByText('Proof it’s yours'), 'the second named value')
    at('the surface carries no DNS jargon')
    const words = await page.locator('[data-testid="domains-surface"]').innerText()
    for (const banned of ['nameserver', 'A record', 'CNAME', 'TXT record', 'SSL certificate', 'DNS']) {
      if (words.includes(banned)) throw new Error(`"${banned}" is banned on primary paths (COPY-RULES §2)`)
    }
    // door two of the three that hand off to the Publish panel
    await click(page.getByRole('button', { name: 'I’ve added them — check now' }), 'the check-now verb')
    const panel = page.getByRole('dialog', { name: 'Publish' })
    await must(panel, 'the Publish panel taking the handoff')
    await must(panel.getByText('Domain settings updated'), 'the checklist in the panel')
  })

  /* ---- 20 -------------------------------------------------------------------
   * "You own this" — the zero-record go-live, which is the whole of the product's
   * claim to owning the 60 seconds around go-live. It is also door three of the
   * three that hand off to the Publish panel, so all three are now walked.
   */
  await run('20', 'own domain → zero-record connect', 'a=paid&i=dh-free', async ({ page, must, click }) => {
    await click(page.locator('[data-testid="toolbar-address"]'), 'the toolbar address')
    const field = page.getByPlaceholder('Search a name to buy, or enter one you already own')
    await field.fill('odesa-coffee-roasters.com')
    await field.press('Enter')
    await must(page.getByText('You own this'), 'the ownership eyebrow')
    await must(page.getByText('It’s already in your DreamHost account — nothing to change anywhere else.'), 'the zero-record promise')
    await must(page.getByText('Under a minute · nothing to configure'), 'the honest wait')
    await click(page.locator('main').getByRole('button', { name: 'Connect', exact: true }), 'the connect verb')
    const panel = page.getByRole('dialog', { name: 'Publish' })
    await must(panel, 'the Publish panel taking the handoff')
    await must(panel.getByText('odesa-coffee-roasters.com'), 'the panel printing THE CONNECTED domain, not a constant')
  })

  /* ------------------------------------------------------------------ summary */

  await browser.close()

  const failed = results.filter((r) => !r.ok)
  const wall = ((Date.now() - t0) / 1000).toFixed(1)
  console.log('')
  console.log(`smoke: ${results.length} situations, ${results.length - failed.length} passed, ${failed.length} failed, ${wall}s wall clock`)
  if (failed.length) {
    for (const f of failed) console.log(`  ${f.id}  ${f.name} — died at: ${f.step}`)
    // The LAST line is the answer, so tailing the log is enough.
    console.log(`FAILED at step ${failed[0].id} — ${failed[0].name}  (${failed.length} of ${results.length} situations)`)
    process.exitCode = 1
  } else {
    console.log(`PASSED all ${results.length} situations — zero page errors, zero console errors, zero failed requests`)
  }
}

main().catch(async (e) => {
  console.error('smoke: the harness itself failed —', e)
  if (browser) await browser.close().catch(() => {})
  process.exitCode = 1
})
