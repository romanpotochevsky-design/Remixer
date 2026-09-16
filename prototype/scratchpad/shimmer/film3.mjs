// Films for the scoped shimmer — text AND spinner sharing one hue:
//   1. the Publish panel's progress card while a bought name propagates (real time, 9 s);
//   2. the same card stepped through one full 8.1 s hue cycle at 100 ms (deterministic), as a
//      GIF, plus a trace of headline hue vs arc stroke to prove they never differ;
//   3. the build card's active row (ring + working line) on the frozen mid-build preset.
import { chromium } from 'playwright'
import { mkdirSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const OUT = new URL('./film3/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const BASE = 'http://localhost:4173'
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

// ── 1. real time: the propagating card ─────────────────────────────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, recordVideo: { dir: OUT, size: { width: 1600, height: 900 } } })
  const p = await ctx.newPage()
  await openPublish(p, 'p=built&a=paid&d=propagating&k=false&n=odesa-coffee-roasters.com&v=false&u=0')
  const box = await (await p.$(PANEL)).boundingBox()
  await p.waitForTimeout(9500)
  await ctx.close()
  const webm = readdirSync(OUT).find((f) => f.endsWith('.webm'))
  renameSync(`${OUT}${webm}`, `${OUT}card-realtime.webm`)
  const x = Math.round(box.x), y = Math.round(box.y), w = Math.round(box.width), h = Math.min(420, Math.round(box.height))
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', `${OUT}card-realtime.webm`, '-ss', '1.5', '-t', '9',
    '-vf', `crop=${w}:${h}:${x}:${y}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', `${OUT}progress-card-realtime.mp4`])
  console.log('card realtime mp4 ok')
}

// ── 2. deterministic cycle on the card: headline vs arc ─────────────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  await openPublish(p, 'p=built&a=paid&d=propagating&k=false&n=odesa-coffee-roasters.com&v=false&u=0')
  const row = await p.$(`${PANEL} .shimmer-hue`)
  const box = await row.boundingBox()
  const clip = { x: box.x - 4, y: box.y - 4, width: box.width + 8, height: box.height + 8 }
  await p.evaluate(() => {
    const scope = document.querySelector('[role="dialog"][aria-label="Publish"] .shimmer-hue')
    const ink = scope.querySelector('.shimmer-ink')
    for (const e of [scope, ink]) { e.style.setProperty('--sh-t', '0ms'); for (const a of e.getAnimations()) { a.pause(); a.currentTime = 0 } }
  })
  const CYCLE = 8100, STEP = 100
  const trace = []
  for (let t = 0; t <= CYCLE; t += STEP) {
    const f = await p.evaluate((t) => {
      const scope = document.querySelector('[role="dialog"][aria-label="Publish"] .shimmer-hue')
      const ink = scope.querySelector('.shimmer-ink')
      for (const e of [scope, ink]) for (const a of e.getAnimations()) a.currentTime = t
      const arc = scope.querySelector('path.step-spin')
      return { hue: getComputedStyle(ink).getPropertyValue('--sh-hue').trim(), arc: getComputedStyle(arc).stroke, pos: getComputedStyle(ink).backgroundPosition.split(' ')[0] }
    }, t)
    await p.screenshot({ path: `${OUT}c-${String(t / STEP).padStart(3, '0')}.png`, clip })
    trace.push({ t, ...f })
  }
  const same = trace.every((f) => f.hue === f.arc)
  const toRgb = (c) => c
  console.log('headline hue == arc stroke on every frame:', same, '· sample', trace[5].hue, '|', trace[5].arc)
  console.log('hue at sweep starts:', [0, 2700, 5400].map((t) => trace.find((f) => f.t === t).hue).join(' → '))
  console.log('band position at 0 / 1350 / 2700 ms:', [0, 1300, 2700].map((t) => trace.find((f) => f.t === t).pos).join(' · '))
  writeFileSync(`${OUT}card-trace.json`, JSON.stringify(trace, null, 1))
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', '10', '-i', `${OUT}c-%03d.png`,
    '-vf', 'scale=900:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=none', `${OUT}progress-card-cycle.gif`])
  await ctx.close()
  console.log('card gif ok')
}

// ── 3. real time: the build card's active row on the frozen preset ────────────────
{
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, recordVideo: { dir: OUT, size: { width: 1600, height: 900 } } })
  const p = await ctx.newPage()
  await p.goto(`${BASE}?p=built&h=long&a=paid&c=900`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await p.click('.home-card-face')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
  await p.waitForTimeout(500)
  await p.keyboard.press('Control+.')
  await p.waitForTimeout(400)
  await p.click('button:has-text("Generating — mid-build")')
  await p.waitForTimeout(300)
  await p.keyboard.press('Escape')
  await p.waitForSelector('.gen-work', { timeout: 10000 })
  const scope = await p.$('.shimmer-hue')
  const box = await scope.boundingBox()
  const facts = await p.evaluate(() => {
    const scope = document.querySelector('.shimmer-hue')
    const ring = scope.querySelector('svg circle.step-spin')
    return { ringStroke: getComputedStyle(ring).stroke, hue: getComputedStyle(scope).getPropertyValue('--sh-hue').trim(), lineHue: getComputedStyle(document.querySelector('.gen-work')).getPropertyValue('--sh-hue').trim() }
  })
  console.log('build row: ring stroke', facts.ringStroke, '· scope hue', facts.hue, '· line hue', facts.lineHue)
  await p.waitForTimeout(9500)
  await ctx.close()
  const webm = readdirSync(OUT).find((f) => f.endsWith('.webm') && !f.startsWith('card-'))
  renameSync(`${OUT}${webm}`, `${OUT}build-realtime.webm`)
  const x = Math.max(0, Math.round(box.x - 24)), y = Math.max(0, Math.round(box.y - 24)), w = Math.round(box.width + 48), h = Math.round(box.height + 48)
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', `${OUT}build-realtime.webm`, '-ss', '1.5', '-t', '9',
    '-vf', `crop=${w}:${h}:${x}:${y}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', `${OUT}build-row-realtime.mp4`])
  console.log('build row mp4 ok')
}
await b.close()
