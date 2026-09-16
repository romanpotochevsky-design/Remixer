import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const here = path.dirname(fileURLToPath(import.meta.url))
const FF = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
await p.goto('http://localhost:4173/?p=built&a=paid&d=live&n=fit-ration.com&v=true&u=0&t=22&c=640', { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(400)
await p.click('header button:has-text("Publish")'); await p.waitForTimeout(1200)
const geo = await p.evaluate(() => {
  const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
  const row = [...d.querySelectorAll('div')].find((e) => e.className.toString().includes('shadow-[inset_0_0_0_1px_#313133]'))
  const r = row.getBoundingClientRect()
  const cs = getComputedStyle(row)
  const chain = []
  let el = row.parentElement
  while (el && el !== d) { const c = getComputedStyle(el); chain.push({ cls: el.className.toString().slice(0, 60), bg: c.backgroundColor, ov: c.overflow, h: el.getBoundingClientRect().height, tf: c.transform, br: c.borderRadius, bs: c.boxShadow.slice(0, 60) }); el = el.parentElement }
  return { rect: { x: r.x, y: r.y, w: r.width, h: r.height }, shadow: cs.boxShadow, bw: cs.borderTopWidth, pad: cs.padding, bg: cs.backgroundColor, offH: row.offsetHeight, chain }
})
console.log(JSON.stringify(geo, null, 1))
const clip = { x: Math.floor(geo.rect.x) - 6, y: Math.floor(geo.rect.y) - 8, width: Math.ceil(geo.rect.w) + 12, height: Math.ceil(geo.rect.h) + 16 }
await p.screenshot({ path: path.join(here, 'row.png'), clip })
execFileSync(FF, ['-y', '-loglevel', 'error', '-i', path.join(here, 'row.png'), '-f', 'rawvideo', '-pix_fmt', 'rgb24', path.join(here, 'row.raw')])
const W = clip.width * 2, H = clip.height * 2
const raw = fs.readFileSync(path.join(here, 'row.raw'))
const px = (x, y) => { const i = (y * W + x) * 3; return [raw[i], raw[i + 1], raw[i + 2]] }
const col = Math.round(W / 2)
console.log('column x=' + col + ' (device px), top edge rows:')
for (let y = 0; y < 40; y++) console.log(y, px(col, y).join(','))
console.log('bottom edge rows:')
for (let y = H - 40; y < H; y++) console.log(y, px(col, y).join(','))
console.log('left edge, mid row:')
const mid = Math.round(H / 2)
for (let x = 0; x < 30; x++) console.log(x, px(x, mid).join(','))
await b.close()
