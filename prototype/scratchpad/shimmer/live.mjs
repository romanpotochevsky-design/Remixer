// Film the three-hue shimmer on the REAL surfaces: the build card's working line during a
// live generation (long enough to see the hue rotate) and the chat's "Thinking" word during
// a send (one sweep). Frames every 100 ms; a strip per surface plus the hue/position trace.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const OUT = new URL('./live/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const BASE = 'http://localhost:4173'
const FF = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'

const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()

async function film(selector, key, ms, every = 100) {
  const el = await p.$(selector)
  const box = await el.boundingBox()
  const clip = { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 6), width: box.width + 16, height: box.height + 12 }
  const trace = []
  const t0 = Date.now()
  let i = 0
  while (Date.now() - t0 < ms) {
    const facts = await p.evaluate((sel) => {
      const e = document.querySelector(sel)
      if (!e) return null
      const cs = getComputedStyle(e)
      return { hue: cs.getPropertyValue('--sh-hue').trim(), pos: cs.backgroundPosition, text: e.textContent.trim().slice(0, 40) }
    }, selector)
    if (!facts) break
    await p.screenshot({ path: `${OUT}${key}-${String(i).padStart(3, '0')}.png`, clip })
    trace.push({ t: Date.now() - t0, ...facts })
    i++
    await p.waitForTimeout(every)
  }
  writeFileSync(`${OUT}${key}-trace.json`, JSON.stringify(trace, null, 1))
  return trace
}

// ── 1. the build card's working line, during a real generation ─────────────────────
await p.goto(`${BASE}?p=empty&h=empty&a=trial&t=1&c=2000&i=none`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800)
await p.fill('input[aria-label="Describe the site you want"]', "Bella's Bakery")
await p.click('button:has-text("Build")')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await p.waitForSelector('.gen-work', { timeout: 30000 })
await p.waitForTimeout(300)
const gen = await film('.gen-work', 'gen', 11200, 100)
console.log('gen frames', gen.length, 'hues seen:', [...new Set(gen.map((f) => f.hue))].join(' '))

// ── 2. the chat's Thinking word, during a send on a built project ───────────────────
await p.goto(`${BASE}?p=built&h=long&a=paid&c=900`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800)
await p.click('.home-card-face')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await p.waitForTimeout(600)
await p.fill('textarea', 'Make the headline shorter.')
await p.keyboard.press('Enter')
await p.waitForSelector('aside .thinking', { timeout: 8000 })
const think = await film('aside .thinking', 'think', 1400, 70)
console.log('think frames', think.length, 'hue:', think[0]?.hue, 'pos', think[0]?.pos, '→', think.at(-1)?.pos)

// ── peaks: per sentence, the frame where the band is centred on the text ──────────
import { copyFileSync } from 'node:fs'
const peaks = []
for (const [i, f] of gen.entries()) {
  const pos = parseFloat(f.pos)
  if (Math.abs(pos - 50) < 9 && !peaks.some((q) => q.text === f.text && Math.abs(q.t - f.t) < 3000)) peaks.push({ i, ...f })
}
peaks.forEach((q, n) => copyFileSync(`${OUT}gen-${String(q.i).padStart(3, '0')}.png`, `${OUT}peak-${n}.png`))
console.log('peaks:', peaks.map((q) => `${(q.t / 1000).toFixed(1)}s ${q.hue} «${q.text.slice(0, 24)}»`).join(' | '))
if (peaks.length) execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', '1', '-pattern_type', 'glob', '-i', `${OUT}peak-*.png`,
  '-vf', `scale=1100:-1,tile=1x${peaks.length}`, '-frames:v', '1', `${OUT}gen-peaks.png`])

// ── strips ──────────────────────────────────────────────────────────────────────────
// gen: one frame every 350 ms → 32 frames, 4 rows of 8; think: all frames, 2 rows of 10
execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', '10', '-pattern_type', 'glob', '-i', `${OUT}gen-*.png`,
  '-vf', "select='not(mod(n\\,3))',scale=560:-1,tile=4x9", '-frames:v', '1', `${OUT}gen-strip.png`])
execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', '10', '-pattern_type', 'glob', '-i', `${OUT}think-*.png`,
  '-vf', 'scale=560:-1,tile=2x10', '-frames:v', '1', `${OUT}think-strip.png`])
console.log('strips:', `${OUT}gen-strip.png`, `${OUT}think-strip.png`)
await b.close()
