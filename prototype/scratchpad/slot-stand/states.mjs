// The domain row's status chip across every state the row renders in — the REAL panel,
// staged from the URL, one panel per state plus a 2× crop of the row so the dyed rim can
// be judged. Run against `npx vite preview --port 4173`.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = new URL('./states/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const BASE = 'http://localhost:4173'
const PANEL = '[role="dialog"][aria-label="Publish"]'

const STATES = [
  ['setting-up', 'propagating — Setting up (amber)', 'd=propagating&k=true&n=fitration.shop&v=false&u=0'],
  ['ready', 'ready — Ready (blue), publish is one press away', 'd=ready&n=fitration.shop&v=false&u=0'],
  ['waiting', 'ready + letter owed — Waiting on your email (amber)', 'd=ready&k=true&n=fitration.shop&v=false&u=0'],
  ['live', 'live, everything published — Live (green)', 'd=live&n=adovasio.com&v=true&u=0'],
  ['live-edits', 'live, 3 edits queued — title Publish, row Live, bar counts', 'd=live&n=adovasio.com&v=true&u=3'],
  ['unreachable', 'unreachable — Not responding (red)', 'd=unreachable&n=adovasio.com&v=true&u=0'],
  ['old-site', 'old-site — Showing your old site (red)', 'd=old-site&i=dh-in-use&n=adovasio.com&v=true&u=0'],
]

const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()

async function openPublish(q) {
  await p.goto(`${BASE}?${q}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await p.click('.home-card-face')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 })
  await p.waitForTimeout(400)
  await p.click('header button:has-text("Publish")')
  await p.waitForTimeout(900)
}

const shots = []
for (const [key, title, q] of STATES) {
  await openPublish(`p=built&a=paid&${q}`)
  const panel = await p.$(PANEL)
  await panel.screenshot({ path: `${OUT}${key}.png` })
  const row = await p.evaluateHandle(() => {
    const btn = [...document.querySelectorAll('[role="dialog"][aria-label="Publish"] button')].find((b) => b.textContent.trim().startsWith('Unlink'))
    return btn.parentElement
  })
  await row.asElement().screenshot({ path: `${OUT}${key}-row.png` })
  const facts = await p.evaluate(() => {
    const chip = document.querySelector('[role="dialog"][aria-label="Publish"] .liquid-glass--chip[data-tone]')
    if (!chip) return null
    const cs = getComputedStyle(chip)
    const rim = getComputedStyle(chip, '::before')
    return { word: chip.textContent.trim(), tone: chip.dataset.tone, color: cs.color, bg: cs.backgroundColor, rim: rim.backgroundImage.slice(0, 90), h: chip.getBoundingClientRect().height }
  })
  console.log(key, JSON.stringify(facts))
  shots.push({ key, title, facts })
}

const sheet = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#0b0b0d;font:13px/1.35 -apple-system,Segoe UI,sans-serif;color:#ddd;padding:20px">
<h1 style="font-size:16px;font-weight:600;margin:0 0 14px;color:#fff">Плашка статуса домена — стекло в тоне, все состояния ряда (живая панель)</h1>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
${shots.map((s) => `<figure style="margin:0"><figcaption style="margin:0 0 6px;color:#bbb;min-height:34px">${s.title}</figcaption><img src="file://${OUT}${s.key}.png" style="width:100%;display:block;border-radius:8px;outline:1px solid #222"><img src="file://${OUT}${s.key}-row.png" style="width:100%;display:block;margin-top:8px;border-radius:8px;outline:1px solid #333"></figure>`).join('')}
</div></body>`
writeFileSync(`${OUT}sheet.html`, sheet)
const sp = await ctx.newPage()
await sp.setViewportSize({ width: 1700, height: 900 })
await sp.goto(`file://${OUT}sheet.html`, { waitUntil: 'load' })
await sp.waitForTimeout(500)
await sp.screenshot({ path: `${OUT}sheet.png`, fullPage: true })
console.log('sheet:', `${OUT}sheet.png`)
await b.close()
