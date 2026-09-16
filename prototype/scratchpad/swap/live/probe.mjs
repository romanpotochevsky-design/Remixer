/* THE VERB ROLLS, THE ARC STAYS — live probe on the built prototype (port 4173).
   Opens the Publish panel on a staged Provisioning world, steps the stage from the console,
   and samples the row frame by frame. */
import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const here = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.env.BASE || 'http://localhost:4173/'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
await p.goto(BASE + '?p=built&a=paid&d=provisioning&n=fit-ration.com&v=true&u=0&t=22&c=640&k=1', { waitUntil: 'networkidle' })
await p.waitForTimeout(800)
await p.click('.home-card-face')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 })
await p.waitForTimeout(400)
await p.click('header button:has-text("Publish")')
await p.waitForTimeout(900)
const dialog = '[role="dialog"][aria-label="Publish"]'
await p.waitForSelector(dialog)
await p.keyboard.press('Control+.')
await p.waitForTimeout(400)

console.log('CONSOLE', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('[data-console] button')].map((b) => b.textContent.trim()).filter((t) => /Provision|Connect|Propag|Ready|Live/.test(t)))))
const before = await p.evaluate(() => {
  const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
  const row = d.querySelector('.shimmer-hue')
  const arc = row.querySelector('path.step-spin')
  const line = row.querySelector('p')
  const segs = [...line.querySelectorAll('.shimmer-seg')].map((s) => ({ text: s.textContent, x: s.offsetLeft, segx: s.style.getPropertyValue('--seg-x') }))
  window.__arc = arc; window.__host = [...line.querySelectorAll('.shimmer-seg')].find((s) => /fit-ration/.test(s.textContent))
  return { title: line.innerText, lineW: line.style.getPropertyValue('--line-w'), clientW: line.clientWidth, segs, arcStroke: getComputedStyle(arc).stroke, hue: getComputedStyle(row).getPropertyValue('--sh-hue'), arcVar: getComputedStyle(row).getPropertyValue('--sh-arc') }
})
console.log('BEFORE', JSON.stringify(before))

/* pause the hue clocks in each hold and read the pair */
const pairs = await p.evaluate(async () => {
  const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
  const row = d.querySelector('.shimmer-hue')
  const anims = row.getAnimations().filter((a) => /sh-hue|sh-arc/.test(a.animationName))
  const out = []
  for (const t of [0.5, 3.2, 5.9]) {
    anims.forEach((a) => { a.pause(); a.currentTime = t * 1000 })
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    out.push({ t, hue: getComputedStyle(row).getPropertyValue('--sh-hue').trim(), arc: getComputedStyle(row).getPropertyValue('--sh-arc').trim(), stroke: getComputedStyle(window.__arc).stroke })
  }
  anims.forEach((a) => a.play())
  return { names: anims.map((a) => a.animationName), out }
})
console.log('PAIRS', JSON.stringify(pairs))

/* step the stage and film the row */
const film = await p.evaluate(async () => {
  const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
  const row = d.querySelector('.shimmer-hue')
  const line = row.querySelector('p')
  const samples = []
  const t0 = performance.now()
  const tick = () => {
    const now = performance.now()
    const segs = [...line.querySelectorAll('.shimmer-seg')].map((s) => {
      const cs = getComputedStyle(s)
      return { text: s.textContent.trim().slice(0, 14), op: +(+cs.opacity).toFixed(2), tf: cs.transform, pos: cs.position, sameHost: s === window.__host }
    })
    const arc = row.querySelector('path.step-spin')
    samples.push({ t: Math.round(now - t0), arcSame: arc === window.__arc, arcOp: arc ? +getComputedStyle(arc.closest('span')).opacity : null, segs })
    if (now - t0 < 700) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  ;[...document.querySelectorAll('[data-console] button')].find((b) => b.textContent.trim() === 'Connecting').click()
  await new Promise((r) => setTimeout(r, 800))
  return { samples, title: line.innerText, segs: [...line.querySelectorAll('.shimmer-seg')].map((s) => ({ text: s.textContent, x: s.offsetLeft, segx: s.style.getPropertyValue('--seg-x') })), lineW: line.style.getPropertyValue('--line-w'), clientW: line.clientWidth }
})
console.log('AFTER', JSON.stringify({ title: film.title, segs: film.segs, lineW: film.lineW, clientW: film.clientW }))
for (const s of film.samples.filter((_, i) => i % 2 === 0 || i < 30)) console.log(JSON.stringify(s))

/* frames mid-roll for the eye */
await p.evaluate(() => { [...document.querySelectorAll('[data-console] button')].find((b) => b.textContent.trim() === 'Provisioning (bought)').click() })
await p.waitForTimeout(1200)
const box = await p.evaluate(() => { const r = document.querySelector('[role="dialog"][aria-label="Publish"] .shimmer-card').getBoundingClientRect(); return { x: r.x - 8, y: r.y - 8, width: r.width + 16, height: 72 } })
await p.evaluate(() => { [...document.querySelectorAll('[data-console] button')].find((b) => b.textContent.trim() === 'Connecting').click() })
await p.keyboard.press('Control+.') // the console overlaps the card — off for the frames
for (const [i, wait] of [[1, 40], [2, 60], [3, 60], [4, 80], [5, 120], [6, 300]]) {
  await p.waitForTimeout(wait)
  await p.screenshot({ path: path.join(here, `roll-0${i}.png`), clip: box })
}
/* the finish: propagating → ready (host first) */
await p.keyboard.press('Control+.')
await p.waitForTimeout(400)
await p.evaluate(() => { [...document.querySelectorAll('[data-console] button')].find((b) => b.textContent.trim() === 'Propagating (bought)').click() })
await p.waitForTimeout(1200)
const fin = await p.evaluate(async () => {
  const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
  const card = d.querySelector('.shimmer-card') || d.querySelector('[class*="rounded-[12px]"]')
  window.__card = card
  const btn = [...document.querySelectorAll('[data-console] button')].find((b) => b.textContent.trim() === 'Ready, not published')
  const samples = []
  const t0 = performance.now()
  const line = card.querySelector('p')
  const tick = () => {
    const now = performance.now()
    samples.push({ t: Math.round(now - t0), segs: [...line.querySelectorAll('.shimmer-seg')].map((s) => ({ text: s.textContent.trim().slice(0, 14), op: +(+getComputedStyle(s).opacity).toFixed(2), tf: getComputedStyle(s).transform, pos: getComputedStyle(s).position })), ticks: card.querySelectorAll('circle[fill]').length })
    if (now - t0 < 700) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  btn?.click()
  await new Promise((r) => setTimeout(r, 900))
  return { btn: btn?.textContent.trim(), samples: samples.filter((_, i) => i % 3 === 0), title: line.innerText, sameCard: window.__card === (d.querySelector('.shimmer-card') || line.closest('[class*="rounded-[12px]"]')) }
})
console.log('FINISH', JSON.stringify({ btn: fin.btn, title: fin.title }))
for (const s of fin.samples) console.log(JSON.stringify(s))
await p.keyboard.press('Control+.')
await p.waitForTimeout(500)
await p.screenshot({ path: path.join(here, 'ready.png'), clip: box })
await b.close()
