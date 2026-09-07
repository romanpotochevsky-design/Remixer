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
 * What it asserts (printed as PASS/FAIL, exit code 1 on any FAIL):
 *   1. a new project opens with the preview collapsed (chat column = full width)
 *   2. "Build me a website." does NOT build — the question panel docks above the composer
 *   3. answers survive Next/Submit and show up in the summary card ("Other: design portfolio", "Midnight Indigo")
 *   4. the preview opens by itself when the build starts, and the site is built afterwards
 *   5. Hide preview / grip click / divider drag past the canvas minimum collapse and reopen it
 */
import fs from 'node:fs'

let chromium
try { ({ chromium } = await import('playwright')) }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')) }

const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = process.env.OUT || '/tmp/check-brief'
fs.mkdirSync(OUT, { recursive: true })

const results = []
const check = (name, ok, extra = '') => { results.push([name, ok]); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`) }

const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } })
const p = await ctx.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png` })
const previewState = () => p.evaluate(() => document.querySelector('[data-preview]')?.getAttribute('data-preview'))
const asideWidth = () => p.$eval('aside', (el) => el.getBoundingClientRect().width)

// A brand-new trial project, nothing typed yet (URL keys: p project, h chat, a account …)
await p.goto(`${BASE}/?p=empty&h=empty&a=trial&t=1&c=2000&i=none`, { waitUntil: 'networkidle' })
await p.waitForTimeout(600)
await shot('01-collapsed-empty')
check('new project opens with the preview collapsed', (await previewState()) === 'closed' && (await asideWidth()) > 1200)

await p.fill('textarea', 'Build me a website.')
await p.keyboard.press('Enter')
await p.waitForTimeout(1200); await shot('02-thinking')
check('thin prompt does not start a build', (await previewState()) === 'closed')
await p.waitForTimeout(2400); await shot('03-question-1')
check('question panel docked above the composer', !!(await p.$('section[aria-label]')))
check('composer relabels itself', (await p.getAttribute('textarea', 'placeholder'))?.startsWith('Tell Remixer'))

await p.fill('section input', 'design portfolio'); await p.click('text=Next'); await p.waitForTimeout(400); await shot('04-q2')
await p.fill('section input', 'landing'); await p.click('text=Next'); await p.waitForTimeout(400); await shot('05-q3-palette')
await p.click('section button[aria-label="Midnight Indigo"]'); await p.click('text=Next'); await p.waitForTimeout(400); await shot('06-q4-typography')
await p.click('section button:has-text("Editorial")'); await p.waitForTimeout(200)
await p.click('text=Submit'); await p.waitForTimeout(600); await shot('07-summary')
check('summary card shows the answers', (await p.textContent('body')).includes('Other: design portfolio') && (await p.textContent('body')).includes('Midnight Indigo'))
check('panel is gone after Submit', !(await p.$('section[aria-label]')))

await p.waitForTimeout(1600); await shot('08-ack-opening')
check('preview opens by itself when the build starts', (await previewState()) === 'open')
await p.waitForTimeout(4600); await shot('09-built')
const body = await p.textContent('body')
check('first version is built and announced', body.includes('Done —') && body.includes('Other: design portfolio'))
check('answers still in the card after the build', body.includes('Midnight Indigo') && body.includes('Editorial'))

await p.click('button[aria-label="Hide preview"]'); await p.waitForTimeout(600); await shot('10-collapsed-built')
check('Hide preview collapses it', (await previewState()) === 'closed')
await p.click('.chat-reopen'); await p.waitForTimeout(600); await shot('11-reopened')
check('grip click reopens it', (await previewState()) === 'open')

const sep = await p.$('.chat-resizer'); const bb = await sep.boundingBox()
await p.mouse.move(bb.x, bb.y + 300); await p.mouse.down()
for (let x = bb.x; x < 1500; x += 60) { await p.mouse.move(x, bb.y + 300); await p.waitForTimeout(16) }
await p.mouse.up(); await p.waitForTimeout(300); await shot('12-drag-collapsed')
check('dragging past the canvas minimum collapses the preview', (await previewState()) === 'closed')

check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 200))
await b.close()

const failed = results.filter(([, ok]) => !ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed · screenshots in ${OUT}`)
process.exit(failed ? 1 : 0)
