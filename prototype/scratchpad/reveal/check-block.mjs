// Stand-alone runner for the Reveal checks before they go into check-brief-flow.mjs —
// same shape as the suite's block, so the text can be pasted across verbatim.
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const at = (q) => `${BASE}/?${q}`
let pass = 0, fail = 0
const check = (name, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : ' — ' + (detail ?? '')}`); ok ? pass++ : fail++ }
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } })
const p = await ctx.newPage()
const openPublish = async (q) => {
  await p.goto(at(q), { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await p.click('.home-card-face')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 })
  await p.waitForTimeout(400)
  await p.click('header button:has-text("Publish")')
  await p.waitForTimeout(600)
}
// ─────────────────────────────────────────────────────────────────────── BLOCK START
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
  const trace = await p.evaluate(async () => {
    const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
    const btn = [...document.querySelectorAll('[data-console] button')].find((b) => b.textContent.trim() === 'Propagating (bought)')
    const samples = []
    let last = performance.now()
    const t0 = last
    const tick = () => { const now = performance.now(); samples.push({ t: Math.round(now - t0), dt: Math.round(now - last), h: +d.getBoundingClientRect().height.toFixed(1) }); last = now; if (now - t0 < 1400) requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
    btn.click()
    await new Promise((r) => setTimeout(r, 1500))
    return samples
  })
  const h0 = trace[0].h, h1 = trace[trace.length - 1].h
  const travel = h1 - h0
  const between = trace.filter((s) => s.h > Math.min(h0, h1) + 2 && s.h < Math.max(h0, h1) - 2)
  const worstStep = Math.max(...trace.slice(1).map((s, i) => Math.abs(s.h - trace[i].h)))
  const settled = trace.filter((s) => s.t > 900).every((s) => Math.abs(s.h - h1) < 1)
  check('…and the console still moves the world while the panel stays open — the walk grows the panel',
    !!(await p.$(panelSel)) && travel > 120, JSON.stringify({ h0, h1, travel }))
  check('the panel’s height TRAVELS to its new size — through intermediate frames, never in one snap',
    between.length >= 6 && worstStep < Math.abs(travel) * 0.6, JSON.stringify({ intermediate: between.length, worstStep, travel }))
  check('…and has settled within 900 ms', settled, JSON.stringify(trace.filter((s) => s.t > 900).slice(0, 3)))
  /* the blocks that arrived carry the glint; the one that stayed does not */
  const glints = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
    return [...d.querySelectorAll('.card-arrive')].map((e) => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 24))
  })
  check('the blocks that ARRIVED wear the glint — the letter and the domain row — and the in-flight card that stayed does not',
    glints.length === 2 && glints.some((t) => /One last step/.test(t)) && glints.some((t) => /Setting up/.test(t)), JSON.stringify(glints))
  /* the in-flight card is one element: the same node before and after the stage changed */
  const sameCard = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
    const card = d.querySelector('.shimmer-card')
    window.__card = card
    return { text: card?.innerText.replace(/\s+/g, ' ').slice(0, 30) }
  })
  await p.evaluate(() => { [...document.querySelectorAll('[data-console] button')].find((b) => b.textContent.trim() === 'Connecting').click() })
  await p.waitForTimeout(900)
  const after = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
    const card = d.querySelector('.shimmer-card')
    return { same: card === window.__card, text: card?.innerText.replace(/\s+/g, ' ').slice(0, 30), letter: /One last step/.test(d.innerText) }
  })
  check('the in-flight card is ONE card whose words change, not a card per stage',
    after.same && /Propagating/.test(sameCard.text) && /Connecting/.test(after.text), JSON.stringify({ before: sameCard.text, after: after.text, same: after.same }))
  check('…and the letter folded away when the stage stepped back', !after.letter)
  /* leaving is quicker and flat: the fold settles under 400 ms and never dips past its end */
  const fold = await p.evaluate(async () => {
    const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
    const btn = [...document.querySelectorAll('[data-console] button')].find((b) => b.textContent.trim() === 'Propagating (bought)')
    btn.click()
    await new Promise((r) => setTimeout(r, 1500))
    const back = [...document.querySelectorAll('[data-console] button')].find((b) => b.textContent.trim() === 'Connecting')
    const samples = []
    const t0 = performance.now()
    const tick = () => { const now = performance.now(); samples.push({ t: Math.round(now - t0), h: +d.getBoundingClientRect().height.toFixed(1) }); if (now - t0 < 1200) requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
    back.click()
    await new Promise((r) => setTimeout(r, 1300))
    return samples
  })
  const fEnd = fold[fold.length - 1].h
  const foldSettle = fold.findLast ? fold.findLast((s) => Math.abs(s.h - fEnd) > 1) : null
  const dip = Math.min(...fold.map((s) => s.h)) - fEnd
  check('folding is quicker than unfolding and does not bounce: settled under 500 ms, no dip past the end',
    foldSettle && foldSettle.t < 500 && dip > -1.5, JSON.stringify({ lastMovingAt: foldSettle?.t, dip }))
  await p.keyboard.press('Control+.')
  await p.waitForTimeout(300)
  await p.keyboard.press('Escape')
  await p.waitForTimeout(400)
}
// ─────────────────────────────────────────────────────────────────────── BLOCK END
console.log(`\n${pass}/${pass + fail} passed`)
await b.close()
