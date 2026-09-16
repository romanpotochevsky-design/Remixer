// Two films of the three-hue shimmer on the FROZEN mid-build scene (scenario preset
// «Generating — mid-build»: the card stands still, so the working line is one element):
//   1. a real-time screen recording of the chat column, 12 s — what the eye sees;
//   2. a deterministic frame-by-frame film: the line's own CSS animations paused and
//      stepped through one full 10.5 s cycle at 100 ms — what the keyframes actually paint,
//      free of the software renderer's latency. Made into a 10 fps GIF (real time).
import { chromium } from 'playwright'
import { mkdirSync, readdirSync, renameSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const OUT = new URL('./film2/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const BASE = 'http://localhost:4173'
const FF = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'

const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })

async function stageMidBuild(p) {
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
  await p.waitForTimeout(400)
}

// ── 1. real-time recording ────────────────────────────────────────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, recordVideo: { dir: OUT, size: { width: 1600, height: 900 } } })
  const p = await ctx.newPage()
  await stageMidBuild(p)
  const card = await p.$('.gen-work')
  const box = await card.boundingBox()
  console.log('work line at', JSON.stringify(box))
  await p.waitForTimeout(12000)
  await ctx.close()
  const webm = readdirSync(OUT).find((f) => f.endsWith('.webm'))
  renameSync(`${OUT}${webm}`, `${OUT}realtime.webm`)
  // crop the chat column around the card (x 0..800, the card sits in the 432 column + margins)
  const x = Math.max(0, Math.round(box.x - 40)), y = Math.max(0, Math.round(box.y - 260)), w = 560, h = 400
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', `${OUT}realtime.webm`, '-ss', '2', '-t', '11',
    '-vf', `crop=${w}:${h}:${x}:${y}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', `${OUT}shimmer-realtime.mp4`])
  console.log('realtime mp4 written')
}

// ── 2. deterministic frames through one full cycle ──────────────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  await stageMidBuild(p)
  const el = await p.$('.gen-work')
  const box = await el.boundingBox()
  const clip = { x: box.x - 12, y: box.y - 8, width: box.width + 24, height: box.height + 16 }
  await p.evaluate(() => {
    const e = document.querySelector('.gen-work')
    e.style.setProperty('--sh-slot', '0')
    for (const a of e.getAnimations()) { a.pause(); a.currentTime = 0 }
  })
  const CYCLE = 10500, STEP = 100
  const trace = []
  for (let t = 0; t <= CYCLE; t += STEP) {
    const facts = await p.evaluate((t) => {
      const e = document.querySelector('.gen-work')
      for (const a of e.getAnimations()) a.currentTime = t
      const cs = getComputedStyle(e)
      return { hue: cs.getPropertyValue('--sh-hue').trim(), pos: cs.backgroundPosition.split(' ')[0] }
    }, t)
    await p.screenshot({ path: `${OUT}f-${String(t / STEP).padStart(3, '0')}.png`, clip })
    trace.push({ t, ...facts })
  }
  // the palette at the three sweeps' centres
  for (const k of [0, 1, 2]) {
    const mid = trace.find((f) => f.t >= k * 3500 + 450)
    console.log(`sweep ${k + 1} at ${mid.t} ms: hue ${mid.hue}, band position ${mid.pos}`)
  }
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', '10', '-i', `${OUT}f-%03d.png`,
    '-vf', 'scale=900:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=none', `${OUT}shimmer-cycle.gif`])
  // and one contact sheet: 3 sweeps × 10 frames (every 100 ms from each sweep start)
  const picks = [0, 1, 2].flatMap((k) => Array.from({ length: 10 }, (_, i) => k * 35 + i))
  const list = picks.map((n) => `file '${OUT}f-${String(n).padStart(3, '0')}.png'`).join('\n')
  const { writeFileSync } = await import('node:fs')
  writeFileSync(`${OUT}picks.txt`, list)
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${OUT}picks.txt`,
    '-vf', 'scale=640:-1,tile=3x10', '-frames:v', '1', `${OUT}shimmer-sheet.png`])
  await ctx.close()
  console.log('gif + sheet written')
}
await b.close()
