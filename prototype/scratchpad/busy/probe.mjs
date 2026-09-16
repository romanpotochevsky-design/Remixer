import { chromium } from 'playwright'
const OUT = new URL('./live/', import.meta.url).pathname
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 3 })
const p = await ctx.newPage()
await p.goto('http://localhost:4173/?p=built&a=paid&u=1&v=false&t=22&c=640', { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(400)
await p.click('header button:has-text("Publish")'); await p.waitForTimeout(900)
const SEL = '[role="dialog"][aria-label="Publish"]'
const btn = () => p.$(`${SEL} button:has-text("Publish")`)
const before = await (await btn()).boundingBox()
await p.click(`${SEL} > div > div:last-child button`).catch(() => {})
// click the footer Publish precisely
await p.evaluate(() => { const d = document.querySelector('[role="dialog"][aria-label="Publish"]'); [...d.querySelectorAll('button')].filter((e) => /^Publish/.test(e.innerText.trim())).pop().click() })
const frames = await p.evaluate(() => new Promise((res) => {
  const out = []; const t0 = performance.now()
  const tick = () => {
    const b = document.querySelector('[role="dialog"][aria-label="Publish"] button[aria-busy="true"]')
    const arc = b?.querySelector('svg path'); const word = b?.querySelector('.busy-ink')
    out.push({ t: Math.round(performance.now() - t0), busy: !!b, rot: arc ? getComputedStyle(arc).transform : null, pos: word ? getComputedStyle(word).backgroundPosition : null, w: b ? +b.getBoundingClientRect().width.toFixed(1) : null,
      title: document.querySelector('[role="dialog"][aria-label="Publish"] h3')?.textContent.trim(), label: [...document.querySelectorAll('[role="dialog"][aria-label="Publish"] button')].pop()?.innerText.trim() })
    if (performance.now() - t0 < 3400) requestAnimationFrame(tick); else res(out)
  }
  requestAnimationFrame(tick)
}))
console.log('button before:', JSON.stringify(before))
const pick = [0, 3, 6, 12, 20, 40, 60, 80, 100, 120, 140, 150, 160, 170, 190]
console.log(JSON.stringify(pick.map((i) => frames[i]).filter(Boolean)))
console.log('last:', JSON.stringify(frames.at(-1)))
await b.close()
