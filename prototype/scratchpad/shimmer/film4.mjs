// The progress card's flash: the whole card stepped through one 2.7 s period at 50 ms, all
// three clocks (band, headline sweep, hue scope) paused and driven together — a GIF of the
// card, a trace of the band's position against the headline's, and the card wash sampled
// at rest vs under the band (board 30425:27467 says 8% → 14%). Plus a real-time MP4.
import { chromium } from 'playwright'
import { mkdirSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const OUT = new URL('./film4/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const BASE = 'http://localhost:4173'
const FF = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
const PANEL = '[role="dialog"][aria-label="Publish"]'
const Q = 'p=built&a=paid&d=connecting&k=false&n=odesa-coffee-roasters.com&v=false&u=0'

const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
async function openPublish(p) {
  await p.goto(`${BASE}?${Q}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await p.click('.home-card-face')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
  await p.waitForTimeout(400)
  await p.click('header button:has-text("Publish")')
  await p.waitForTimeout(900)
}

// ── 1. deterministic period ──────────────────────────────────────────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  await openPublish(p)
  const card = await p.$(`${PANEL} .shimmer-card`)
  const box = await card.boundingBox()
  const clip = { x: box.x - 6, y: box.y - 6, width: box.width + 12, height: box.height + 12 }
  const n = await p.evaluate(() => {
    const card = document.querySelector('[role="dialog"][aria-label="Publish"] .shimmer-card')
    for (const e of card.querySelectorAll('[style]')) e.style.setProperty('--sh-t', '0ms')
    card.style.setProperty('--sh-t', '0ms')
    const anims = card.getAnimations({ subtree: true })
    for (const a of anims) { a.pause(); a.currentTime = 0 }
    return anims.map((a) => a.animationName)
  })
  console.log('animations under the card:', n.join(', '))
  const PERIOD = 2700, STEP = 50
  const trace = []
  for (let t = 0; t <= PERIOD; t += STEP) {
    const f = await p.evaluate((t) => {
      const card = document.querySelector('[role="dialog"][aria-label="Publish"] .shimmer-card')
      for (const a of card.getAnimations({ subtree: true })) a.currentTime = t
      const band = getComputedStyle(card.querySelector('.shimmer-card-band'), '::before')
      const ink = getComputedStyle(card.querySelector('.shimmer-ink'))
      return { band: band.transform, pos: ink.backgroundPosition.split(' ')[0] }
    }, t)
    await p.screenshot({ path: `${OUT}f-${String(t / STEP).padStart(3, '0')}.png`, clip })
    trace.push({ t, ...f })
  }
  writeFileSync(`${OUT}trace.json`, JSON.stringify(trace, null, 1))
  const tx = (m) => { const a = /matrix\(([^)]+)\)/.exec(m); return a ? Math.round(parseFloat(a[1].split(',')[4])) : m }
  console.log('band translateX at 0 / 675 / 1350 / 2700 ms:', [0, 650, 1350, 2700].map((t) => tx(trace.find((f) => f.t === t).band)).join(' · '), '(px; layer is 3 cards wide)')
  console.log('headline band position at the same beats:', [0, 650, 1350, 2700].map((t) => trace.find((f) => f.t === t).pos).join(' · '))
  // wash brightness: sample the card's blank strip (right of the headline) at rest and mid-sweep
  const sample = async (t) => {
    await p.evaluate((t) => { const card = document.querySelector('[role="dialog"][aria-label="Publish"] .shimmer-card'); for (const a of card.getAnimations({ subtree: true })) a.currentTime = t }, t)
    const png = await p.screenshot({ clip: { x: box.x + box.width - 40, y: box.y + 8, width: 24, height: 24 } })
    execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'png_pipe', '-i', 'pipe:0', '-vf', 'scale=1:1:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', `${OUT}px-${t}.rgb`], { input: png })
    const d = require('node:fs').readFileSync(`${OUT}px-${t}.rgb`)
    return `rgb(${d[0]},${d[1]},${d[2]})`
  }
  const { createRequire } = await import('node:module'); globalThis.require = createRequire(import.meta.url)
  console.log('wash at rest (t=2000):', await sample(2000), '· wash under the band (t≈675, right side lit later → t=1000):', await sample(1000))
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', '20', '-i', `${OUT}f-%03d.png`,
    '-vf', 'scale=900:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=none', `${OUT}card-flash-cycle.gif`])
  await ctx.close()
  console.log('gif ok')
}

// ── 2. real time ─────────────────────────────────────────────────────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, recordVideo: { dir: OUT, size: { width: 1600, height: 900 } } })
  const p = await ctx.newPage()
  await openPublish(p)
  const box = await (await p.$(PANEL)).boundingBox()
  await p.waitForTimeout(8500)
  await ctx.close()
  const webm = readdirSync(OUT).find((f) => f.endsWith('.webm'))
  renameSync(`${OUT}${webm}`, `${OUT}realtime.webm`)
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', `${OUT}realtime.webm`, '-ss', '1.5', '-t', '8',
    '-vf', `crop=${Math.round(box.width)}:${Math.min(400, Math.round(box.height))}:${Math.round(box.x)}:${Math.round(box.y)}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', `${OUT}card-flash-realtime.mp4`])
  console.log('mp4 ok')
}
await b.close()
