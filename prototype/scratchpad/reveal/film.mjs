// The Publish panel through a connection walk, AFTER the Reveal (ui/Reveal.tsx): does the
// panel's height move continuously, do the blocks unfold/fold, and what does it cost?
//
//  1. CONSOLE-DRIVEN WALK (deterministic states, real-time motion): connecting → propagating
//     → ready + letter owed → letter confirmed (the green card unfolds) → back to connecting.
//     The prototype console moves the world while the panel stays open (its clicks no longer
//     count as "outside"); it is made invisible for the film so it does not cover the panel.
//     Sampled per rAF: the dialog's height, the body card's height, frame time. Recorded as
//     video, cut into an MP4 of the panel and a contact sheet.
//  2. THE REPAIR PATH, the product's own six seconds: unreachable → Fix this → connecting →
//     live. The red card folds away below the field while the in-flight card unfolds above it,
//     and at the end the card folds and the chip's word hands over.
//  3. COST: CDP Performance metrics (LayoutCount / LayoutDuration / RecalcStyleDuration) over
//     one transition, and the rAF frame-time distribution while the edge moves.
import { chromium } from 'playwright'
import { mkdirSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const OUT = new URL('./film/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const BASE = process.env.BASE || 'http://localhost:4173'
const FF = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
const PANEL = '[role="dialog"][aria-label="Publish"]'

const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })

async function openPublish(p, q) {
  await p.goto(`${BASE}?${q}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await p.click('.home-card-face')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
  await p.waitForTimeout(400)
  await p.click('header button:has-text("Publish")')
  await p.waitForTimeout(900)
}
/* a per-rAF sampler of the panel's geometry, living in the page */
const SAMPLER = () => {
  const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
  const body = [...d.querySelectorAll('div')].find((e) => getComputedStyle(e).backgroundColor === 'rgba(255, 255, 255, 0.04)')
  window.__s = []
  window.__marks = []
  let last = performance.now()
  const tick = () => {
    const now = performance.now()
    window.__s.push({ t: Math.round(now), dt: +(now - last).toFixed(1), h: +d.getBoundingClientRect().height.toFixed(1), body: +body.getBoundingClientRect().height.toFixed(1) })
    last = now
    window.__raf = requestAnimationFrame(tick)
  }
  window.__raf = requestAnimationFrame(tick)
  window.__mark = (label) => window.__marks.push({ t: Math.round(performance.now()), label })
}
const consoleClick = async (p, label) => {
  await p.evaluate((label) => {
    window.__mark(label)
    const btn = [...document.querySelectorAll('[data-console] button')].find((b) => b.textContent.trim() === label)
    if (!btn) throw new Error('no console button ' + label)
    btn.click()
  }, label)
}
/* a toggle axis renders a label and an On/Off button in one row */
const consoleToggle = async (p, label) => {
  await p.evaluate((label) => {
    window.__mark(label)
    const lab = [...document.querySelectorAll('[data-console] label')].find((l) => l.textContent.trim() === label)
    if (!lab) throw new Error('no console toggle ' + label)
    lab.parentElement.parentElement.querySelector('button').click()
  }, label)
}
const analyse = (samples, marks, name) => {
  const out = []
  for (const m of marks) {
    const win = samples.filter((s) => s.t >= m.t && s.t <= m.t + 1400)
    if (win.length < 3) continue
    const h0 = win[0].h, hEnd = win[win.length - 1].h
    const hs = win.map((s) => s.h)
    const maxStep = Math.max(...win.slice(1).map((s, i) => Math.abs(s.h - win[i].h)))
    const peak = hEnd > h0 ? Math.max(...hs) : Math.min(...hs)
    const over = +(peak - hEnd).toFixed(1)
    const settleAt = (() => { for (let i = win.length - 1; i >= 0; i--) if (Math.abs(win[i].h - hEnd) > 0.5) return win[i].t - m.t + 16; return 0 })()
    const frames = win.filter((s) => s.t <= m.t + settleAt).map((s) => s.dt)
    const worst = Math.max(...frames)
    const fps = frames.length ? +(1000 / (frames.reduce((a, c) => a + c, 0) / frames.length)).toFixed(1) : null
    out.push({ step: m.label, from: h0, to: hEnd, travel: +(hEnd - h0).toFixed(1), overshoot: over, overshootPct: h0 !== hEnd ? +((over / (hEnd - h0)) * 100).toFixed(1) : 0, maxFrameStep: +maxStep.toFixed(1), settleMs: settleAt, fps, worstFrameMs: worst, frames: frames.length })
  }
  console.log(`\n${name}`)
  console.table(out)
  return out
}

// ── 1. console-driven walk ────────────────────────────────────────────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, recordVideo: { dir: OUT, size: { width: 1600, height: 900 } } })
  const p = await ctx.newPage()
  const videoStart = Date.now()
  const cdp = await ctx.newCDPSession(p)
  await cdp.send('Performance.enable')
  await openPublish(p, 'p=built&a=paid&d=connecting&k=true&n=fit-ration.net&v=false&u=0')
  const box = await (await p.$(PANEL)).boundingBox()
  await p.keyboard.press('Control+.')
  await p.waitForTimeout(500)
  await p.addStyleTag({ content: '[data-console]{opacity:0 !important}' })
  await p.waitForTimeout(300)
  const stillOpen = await p.$(PANEL)
  console.log('panel still open after the console opened:', !!stillOpen)
  await p.evaluate(SAMPLER)
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.filter((m) => /^(LayoutCount|LayoutDuration|RecalcStyleCount|RecalcStyleDuration|ScriptDuration)$/.test(m.name)).map((m) => [m.name, m.value]))
  const m0 = await metrics()
  await p.waitForTimeout(600)
  await consoleClick(p, 'Propagating (bought)')
  await p.waitForTimeout(1600)
  const m1 = await metrics()
  await consoleClick(p, 'Ready, not published')
  await p.waitForTimeout(1600)
  await consoleToggle(p, 'Email unconfirmed')           // toggle off: the letter is confirmed → green card unfolds
  await p.waitForTimeout(1600)
  await consoleClick(p, 'Connecting')
  await p.waitForTimeout(1800)
  const { samples, marks, origin } = await p.evaluate(() => { cancelAnimationFrame(window.__raf); return { samples: window.__s, marks: window.__marks, origin: performance.timeOrigin } })
  const firstAt = (origin + marks[0].t - videoStart) / 1000   // seconds into the video
  writeFileSync(`${OUT}walk-samples.json`, JSON.stringify({ samples, marks, firstMarkVideoSec: firstAt }))
  console.log('first transition at', firstAt.toFixed(2), 's of the video')
  const rows = analyse(samples, marks, 'CONSOLE WALK — panel height per step (1.4 s windows)')
  const dLayout = { count: m1.LayoutCount - m0.LayoutCount, ms: +((m1.LayoutDuration - m0.LayoutDuration) * 1000).toFixed(1), styleMs: +((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000).toFixed(1), scriptMs: +((m1.ScriptDuration - m0.ScriptDuration) * 1000).toFixed(1) }
  console.log('cost of the first transition (2.2 s window incl. idle):', JSON.stringify(dLayout), `→ ${(dLayout.ms / Math.max(1, dLayout.count)).toFixed(2)} ms per layout`)
  // what is on screen after it all
  const end = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
    return { text: d.innerText.replace(/\s+/g, ' ').slice(0, 400), glints: d.querySelectorAll('.card-arrive').length }
  })
  console.log('end state:', JSON.stringify(end))
  await ctx.close()
  const webm = readdirSync(OUT).find((f) => f.endsWith('.webm'))
  renameSync(`${OUT}${webm}`, `${OUT}walk.webm`)
  const x = Math.round(box.x) - 8, y = Math.round(box.y) - 8, w = Math.round(box.width) + 16, h = 700
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', `${OUT}walk.webm`, '-ss', String(Math.max(0, firstAt - 1)), '-t', '8.5',
    '-vf', `crop=${w}:${h}:${x}:${y}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', `${OUT}walk.mp4`])
  // a contact sheet: 6 columns × 8 rows at 8 fps from the first transition
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', `${OUT}walk.mp4`, '-ss', '0.5', '-t', '3',
    '-vf', 'fps=12,scale=240:-1,tile=6x7', '-frames:v', '1', '-update', '1', `${OUT}walk-sheet.png`])
  console.log('walk mp4 + sheet ok')
}

// ── 2. the repair path ───────────────────────────────────────────────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, recordVideo: { dir: OUT, size: { width: 1600, height: 900 } } })
  const p = await ctx.newPage()
  const videoStart = Date.now()
  await openPublish(p, 'p=built&a=paid&d=unreachable&n=fit-ration.net&v=true&u=0')
  const box = await (await p.$(PANEL)).boundingBox()
  await p.evaluate(SAMPLER)
  await p.waitForTimeout(500)
  await p.evaluate(() => {
    window.__mark('Fix this')
    const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
    ;[...d.querySelectorAll('button')].find((e) => /Fix this/.test(e.innerText)).click()
  })
  await p.waitForTimeout(6300)
  await p.evaluate(() => window.__mark('→ live (walk ends)'))
  await p.waitForTimeout(1600)
  const { samples, marks, origin } = await p.evaluate(() => { cancelAnimationFrame(window.__raf); return { samples: window.__s, marks: window.__marks, origin: performance.timeOrigin } })
  const firstAt = (origin + marks[0].t - videoStart) / 1000
  writeFileSync(`${OUT}repair-samples.json`, JSON.stringify({ samples, marks, firstMarkVideoSec: firstAt }))
  // the walk's end is not a click; find the moment the height starts moving after 6 s
  const endMove = samples.find((s, i) => i > 0 && s.t > marks[0].t + 5000 && Math.abs(s.h - samples[i - 1].h) > 0.5)
  if (endMove) marks[1].t = endMove.t - 16
  analyse(samples, marks, 'REPAIR — panel height per step')
  const end = await p.evaluate(() => document.querySelector('[role="dialog"][aria-label="Publish"]').innerText.replace(/\s+/g, ' ').slice(0, 300))
  console.log('end state:', end)
  await ctx.close()
  const webm = readdirSync(OUT).find((f) => f.endsWith('.webm'))
  renameSync(`${OUT}${webm}`, `${OUT}repair.webm`)
  const x = Math.round(box.x) - 8, y = Math.round(box.y) - 8, w = Math.round(box.width) + 16, h = 700
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', `${OUT}repair.webm`, '-ss', String(Math.max(0, firstAt - 1)), '-t', '9',
    '-vf', `crop=${w}:${h}:${x}:${y}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', `${OUT}repair.mp4`])
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', `${OUT}repair.mp4`, '-ss', '0.2', '-t', '2.5',
    '-vf', 'fps=12,scale=240:-1,tile=6x6', '-frames:v', '1', '-update', '1', `${OUT}repair-sheet.png`])
  console.log('repair mp4 + sheet ok')
}
await b.close()
