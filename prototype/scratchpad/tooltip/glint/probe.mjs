/* The tooltip rim's glint at its PEAK — pause the CSS animation at the brightest frame, read the
   glint stroke's computed colour/opacity and the rim's device pixels. */
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const here = path.dirname(fileURLToPath(import.meta.url))
const tag = process.argv[2] || 'x'
const FF = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
await p.goto('http://localhost:4173/?p=built&a=paid&d=live&n=fit-ration.com&v=true&u=0&t=22&c=640', { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(400)
await p.click('header button:has-text("Publish")'); await p.waitForTimeout(1200)
await p.hover('[role="dialog"][aria-label="Publish"] .liquid-glass--chip')
await p.waitForSelector('[role="tooltip"]', { timeout: 3000 })
await p.waitForTimeout(150)
const info = await p.evaluate(async () => {
  const tip = document.querySelector('[role="tooltip"]')
  const glint = tip.querySelector('.tip-rim-glint')
  const anims = glint.getAnimations()
  const a = anims[0]
  const timing = a ? a.effect.getComputedTiming() : null
  /* find the peak: step through the animation, read opacity */
  let peak = { t: 0, op: 0 }
  if (a) {
    a.pause()
    for (let t = 0; t <= timing.delay + timing.duration; t += 10) {
      a.currentTime = t
      const op = +getComputedStyle(glint).opacity
      if (op > peak.op) peak = { t, op }
    }
    a.currentTime = peak.t
  }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  const cs = getComputedStyle(glint)
  const r = tip.getBoundingClientRect()
  return { stroke: cs.stroke, strokeWidth: cs.strokeWidth, peak, timing: timing && { delay: timing.delay, duration: timing.duration, easing: timing.easing }, rect: { x: r.x, y: r.y, w: r.width, h: r.height }, text: tip.innerText }
})
console.log(tag, JSON.stringify(info))
const clip = { x: Math.floor(info.rect.x) - 4, y: Math.floor(info.rect.y) - 4, width: Math.ceil(info.rect.w) + 8, height: Math.ceil(info.rect.h) + 8 }
await p.screenshot({ path: path.join(here, `peak-${tag}.png`), clip })
execFileSync(FF, ['-y', '-loglevel', 'error', '-i', path.join(here, `peak-${tag}.png`), '-f', 'rawvideo', '-pix_fmt', 'rgb24', path.join(here, `peak-${tag}.raw`)])
const W = clip.width * 2
const raw = fs.readFileSync(path.join(here, `peak-${tag}.raw`))
const px = (x, y) => { const i = (y * W + x) * 3; return [raw[i], raw[i + 1], raw[i + 2]] }
/* the top edge of the bubble, mid-width: rows across the rim */
const col = Math.round(W / 2)
const rows = []
for (let y = 0; y < 24; y++) rows.push(y + ':' + px(col, y).join(','))
console.log(tag, 'top rim column', rows.join('  '))
/* the brightest pixel along that column = the rim at the peak */
let best = [0, 0]
for (let y = 0; y < 24; y++) { const v = px(col, y); if (v[0] > best[1]) best = [y, v[0]] }
console.log(tag, 'rim peak pixel R =', best[1], 'at row', best[0])
await b.close()
