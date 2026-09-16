// THE FIVE SECONDS — probe on the built prototype (16.09.2026, board 30425:28847).
import { chromium } from 'playwright'
const OUT = new URL('./live/', import.meta.url).pathname
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
const SEL = '[role="dialog"][aria-label="Publish"]'
await p.goto('http://localhost:4173/?p=built&a=paid&d=propagating&k=true&n=fit-ration.net&v=false&u=1&t=22&c=640', { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(400)
const tOpen = Date.now()
await p.click('header button:has-text("Publish")'); await p.waitForTimeout(700)
const read = () => p.evaluate(() => {
  const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
  const card = d.querySelector('.shimmer-card')
  const row = card?.firstElementChild?.nextElementSibling  // band is first child
  const rowEl = [...card.children].find((e) => e.tagName === 'DIV')
  const btn = card.querySelector('button[aria-expanded]')
  const pct = [...card.querySelectorAll('span')].find((e) => /%$/.test(e.textContent.trim()))
  const subBox = [...card.querySelectorAll('div')].find((e) => getComputedStyle(e).borderTopColor === 'rgb(73, 73, 76)')
  const letterTitle = [...d.querySelectorAll('p')].find((e) => /^One last step for/.test(e.textContent.trim()))
  const letter = letterTitle ? letterTitle.closest('.rounded-\\[12px\\].border') : null
  const unlinkBtns = [...d.querySelectorAll('button')].filter((e) => /Unlink/.test(e.textContent))
  const resend = [...d.querySelectorAll('button')].find((e) => /Resend email|Sent/.test(e.textContent))
  const r = (el) => el ? (({ x, y, width, height }) => ({ x: +x.toFixed(1), y: +y.toFixed(1), w: +width.toFixed(1), h: +height.toFixed(1) }))(el.getBoundingClientRect()) : null
  return {
    panelH: +d.getBoundingClientRect().height.toFixed(1),
    card: r(card), row: r(rowEl), rowPad: rowEl ? getComputedStyle(rowEl).padding : null,
    title: rowEl?.querySelector('p')?.textContent, pct: pct?.textContent, pctStyle: pct ? { font: getComputedStyle(pct).fontFamily.slice(0, 20), size: getComputedStyle(pct).fontSize, color: getComputedStyle(pct).color } : null,
    btn: btn ? { ...r(btn), expanded: btn.getAttribute('aria-expanded'), border: getComputedStyle(btn).borderTopColor, radius: getComputedStyle(btn).borderRadius, blur: getComputedStyle(btn).backdropFilter } : null,
    sub: subBox ? { ...r(subBox), text: subBox.innerText, pad: getComputedStyle(subBox).padding, color: getComputedStyle(subBox.querySelector('p')).color, size: getComputedStyle(subBox.querySelector('p')).fontSize } : null,
    letter: letter ? { ...r(letter), bg: getComputedStyle(letter).backgroundColor, border: getComputedStyle(letter).borderTopColor, children: [...letter.children].map((c) => ({ h: +c.getBoundingClientRect().height.toFixed(1), pad: getComputedStyle(c).padding })) } : null,
    letterBody: letter ? (() => { const bx = letter.children[1].firstElementChild; return { ...r(bx), bg: getComputedStyle(bx).backgroundColor, border: getComputedStyle(bx).borderTopColor, pad: getComputedStyle(bx).padding, text: bx.innerText, size: getComputedStyle(bx.querySelector('p')).fontSize, color: getComputedStyle(bx.querySelector('p')).color } })() : null,
    resend: resend ? { text: resend.textContent, ...r(resend), color: getComputedStyle(resend).color, size: getComputedStyle(resend).fontSize, pad: getComputedStyle(resend).padding } : null,
    unlinks: unlinkBtns.map((e) => ({ ...r(e), color: getComputedStyle(e).color, inLetter: !!(letter && letter.contains(e)) })),
    domainRow: !![...d.querySelectorAll('div')].find((e) => /Unlink/.test(e.textContent || '') && getComputedStyle(e).borderTopColor === 'rgb(49, 49, 51)'),
    chip: !!d.querySelector('.liquid-glass--chip[data-tone]'),
    glints: [...d.querySelectorAll('.card-arrive')].map((e) => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 24)),
  }
})
const t1 = await read()
const panel = await (await p.$(SEL)).boundingBox()
await p.screenshot({ path: `${OUT}01-expanded.png`, clip: { x: panel.x - 8, y: panel.y - 8, width: panel.width + 16, height: panel.height + 16 } })
// sample the panel height through the fold and the letter's arrival: from ~3.9 s to ~7.5 s after staging
const sinceOpen = Date.now() - tOpen
await p.waitForTimeout(Math.max(0, 3900 - sinceOpen))
const trace = await p.evaluate(() => new Promise((res) => {
  const d = document.querySelector('[role="dialog"][aria-label="Publish"]'); const out = []; const t0 = performance.now()
  const tick = () => { const now = performance.now(); out.push({ t: Math.round(now - t0), h: +d.getBoundingClientRect().height.toFixed(1), letter: /One last step/.test(d.innerText), sub: /updating across the web/.test(d.innerText) }); if (now - t0 < 3600) requestAnimationFrame(tick); else res(out) }
  requestAnimationFrame(tick)
}))
const t2 = await read()
const panel2 = await (await p.$(SEL)).boundingBox()
await p.screenshot({ path: `${OUT}02-letter.png`, clip: { x: panel2.x - 8, y: panel2.y - 8, width: panel2.width + 16, height: panel2.height + 16 } })
// toggle by hand: open the explanation again — the letter stays
await p.click(`${SEL} button[aria-expanded]`); await p.waitForTimeout(900)
const t3 = await read()
const panel3 = await (await p.$(SEL)).boundingBox()
await p.screenshot({ path: `${OUT}03-reopened.png`, clip: { x: panel3.x - 8, y: panel3.y - 8, width: panel3.width + 16, height: panel3.height + 16 } })
await p.click(`${SEL} button[aria-expanded]`); await p.waitForTimeout(700)
const t4 = await read()
await p.click(`${SEL} button:has-text("Resend email")`); await p.waitForTimeout(300)
const t5 = await read()
const compact = (t) => ({ panelH: t.panelH, row: t.row && { h: t.row.h, pad: t.rowPad }, pct: t.pct, pctStyle: t.pctStyle, btn: t.btn && { w: t.btn.w, h: t.btn.h, expanded: t.btn.expanded, border: t.btn.border, radius: t.btn.radius }, sub: t.sub && { h: t.sub.h, w: t.sub.w, pad: t.sub.pad, size: t.sub.size, color: t.sub.color, text: t.sub.text }, letter: t.letter && { h: t.letter.h, w: t.letter.w, bg: t.letter.bg, border: t.letter.border, kids: t.letter.children }, letterBody: t.letterBody && { h: t.letterBody.h, w: t.letterBody.w, bg: t.letterBody.bg, border: t.letterBody.border, pad: t.letterBody.pad, size: t.letterBody.size, color: t.letterBody.color }, resend: t.resend && { text: t.resend.text, h: t.resend.h, color: t.resend.color, size: t.resend.size, pad: t.resend.pad }, unlinks: t.unlinks, domainRow: t.domainRow, chip: t.chip, glints: t.glints, card: t.card && { h: t.card.h, w: t.card.w } })
console.log('T1 (≈0.7s, expanded):', JSON.stringify(compact(t1)))
console.log('TRACE (from 3.9s):', JSON.stringify(trace.filter((_, i) => i % 3 === 0).map((s) => [s.t, s.h, s.sub ? 'S' : '-', s.letter ? 'L' : '-'])))
console.log('T2 (≈7.5s, letter):', JSON.stringify(compact(t2)))
console.log('T3 (reopened by hand):', JSON.stringify({ panelH: t3.panelH, sub: !!t3.sub, expanded: t3.btn?.expanded, letter: !!t3.letter, glints: t3.glints }))
console.log('T4 (folded by hand):', JSON.stringify({ panelH: t4.panelH, sub: !!t4.sub, expanded: t4.btn?.expanded, letter: !!t4.letter }))
console.log('T5 (resend pressed):', JSON.stringify({ resend: t5.resend?.text, body: t5.letterBody?.text }))
await b.close()
