import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
const FF = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
const PANEL = '[role="dialog"][aria-label="Publish"]'
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto('http://localhost:4173/?p=built&a=paid&d=connecting&k=false&n=odesa-coffee-roasters.com&v=false&u=0', { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(400)
await p.click('header button:has-text("Publish")'); await p.waitForTimeout(900)
const box = await (await p.$(`${PANEL} .shimmer-card`)).boundingBox()
await p.evaluate(() => { const c = document.querySelector('[role="dialog"][aria-label="Publish"] .shimmer-card'); for (const e of [c, ...c.querySelectorAll('[style]')]) e.style.setProperty('--sh-t', '0ms'); for (const a of c.getAnimations({ subtree: true })) { a.pause(); a.currentTime = 0 } })
const sample = async (t) => {
  await p.evaluate((t) => { const c = document.querySelector('[role="dialog"][aria-label="Publish"] .shimmer-card'); for (const a of c.getAnimations({ subtree: true })) a.currentTime = t }, t)
  const png = await p.screenshot({ clip: { x: box.x + box.width - 40, y: box.y + 8, width: 24, height: 24 } })
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'png_pipe', '-i', 'pipe:0', '-vf', 'scale=1:1:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '/tmp/px.rgb'], { input: png })
  const d = readFileSync('/tmp/px.rgb'); return `rgb(${d[0]},${d[1]},${d[2]})`
}
console.log('wash at rest:', await sample(2000), '· under the band:', await sample(1000))
await b.close()
