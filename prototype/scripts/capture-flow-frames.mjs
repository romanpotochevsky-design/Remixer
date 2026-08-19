/**
 * Walks both domain chains through the REAL prototype and captures every step.
 *
 * These renders replace the hand-drawn cards in the Figma flow page: the prototype is
 * the coded hi-fi of the designer's own mockups, so a screenshot of it is more faithful
 * than anything redrawn by hand.
 *
 * Wait-states are set through the URL rather than waited out: the timeline is real
 * (registering -> propagating -> verifying -> live spans ~11s) and a crisp frame beats
 * a race. Interactive steps are driven through the UI so the capture proves the chain
 * actually connects.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:4175'
const OUT = process.env.SHOTS ?? '/tmp/shots'
const VP = { width: 1800, height: 1000 }

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})

const log = []

async function open(query) {
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => console.log('  !! pageerror:', e.message))
  await p.goto(`${BASE}/${query}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
  return p
}

async function shoot(p, name) {
  await p.screenshot({ path: `${OUT}/${name}.png` })
  log.push(name)
  console.log('  shot', name)
}

/** The console handle must never appear in a deliverable render. */
async function hideChrome(p) {
  await p.addStyleTag({
    content: '[aria-label="Prototype console"]{opacity:0 !important;pointer-events:none}',
  })
}

async function openDomains(p) {
  await p.getByRole('button', { name: /^(Publish|Update)/ }).first().click()
  await p.waitForTimeout(300)
  const dashed = p.getByText('Connect your own domain')
  if (await dashed.count()) {
    await dashed.click()
  } else {
    // A domain is already in play, so the dashed card is gone: the topbar address
    // button is the other door into the surface.
    await p.keyboard.press('Escape')
    await p.getByRole('button', { name: /fit-ration|trulieve|emberandoak/ }).first().click()
  }
  await p.waitForTimeout(800)
}

async function search(p, q) {
  const f = p.getByPlaceholder(/Search a name/)
  await f.fill(q)
  await f.press('Enter')
  await p.waitForTimeout(1000)
}

async function openPanel(p) {
  await p.getByRole('button', { name: /^(Publish|Update)/ }).first().click()
  await p.waitForTimeout(600)
}

/* ══════════════════════════════════════ CHAIN 1 — buying a new domain ══════ */
console.log('CHAIN 1 — buy a new domain')
{
  // A trial user who owns nothing: the honest starting point for "I need a domain".
  const p = await open('?a=trial&i=none&p=built&h=long&u=0')
  await hideChrome(p)
  await openDomains(p)
  await shoot(p, 'a1-search')

  await search(p, 'trulieve')
  await shoot(p, 'a2-results')

  await p.getByRole('button', { name: 'Buy' }).first().click()
  await p.waitForTimeout(700)
  await shoot(p, 'a3-sheet')

  await p.getByRole('button', { name: 'Continue to checkout' }).click()
  await p.waitForTimeout(1100)
  await shoot(p, 'a4-cart')

  await p.getByRole('button', { name: 'Submit Order' }).click()
  await p.waitForTimeout(2200)
  await shoot(p, 'a5-registering')
  await p.close()
}

// The wait states, set directly so each frame is clean.
for (const [state, name] of [
  ['propagating', 'a6-propagating'],
  ['verifying', 'a7-verifying'],
  ['live', 'a8-live'],
  ['icann-hold', 'a9-icann'],
  ['unreachable', 'a10-failed'],
]) {
  const p = await open(`?a=paid&d=${state}&p=built&h=long&u=0`)
  await hideChrome(p)
  await openPanel(p)
  await shoot(p, name)
  await p.close()
}

/* ══════════════════════════════ CHAIN 2 — a domain held elsewhere ══════════ */
console.log('CHAIN 2 — connect a domain from GoDaddy')
{
  const p = await open('?a=paid&i=none&p=built&h=long&u=0')
  await hideChrome(p)
  await openDomains(p)
  await shoot(p, 'b1-search')

  await search(p, 'emberandoak.com')
  await shoot(p, 'b2-taken')

  await p.getByRole('button', { name: 'This is my domain' }).click()
  await p.waitForTimeout(700)
  await shoot(p, 'b3-sheet')

  await p.getByRole('dialog').getByRole('button', { name: /Show me what to change|Continue to checkout/ }).click()
  await p.waitForTimeout(900)
  await shoot(p, 'b4-setup')

  const check = p.getByRole('button', { name: /check now|added them/i })
  if (await check.count()) {
    await check.first().click()
    await p.waitForTimeout(1200)
    await shoot(p, 'b5-checking')
  }
  await p.close()
}

// The external domain's own wait + finish, on the external-manual inventory.
for (const [state, name] of [
  ['connecting', 'b6-connecting'],
  ['verifying', 'b7-verifying'],
  ['live', 'b8-live'],
  ['unreachable', 'b9-failed'],
]) {
  const p = await open(`?a=paid&i=external-manual&d=${state}&p=built&h=long&u=0`)
  await hideChrome(p)
  await openPanel(p)
  await shoot(p, name)
  await p.close()
}

await browser.close()
console.log(`\ncaptured ${log.length} frames:\n${log.join('\n')}`)
