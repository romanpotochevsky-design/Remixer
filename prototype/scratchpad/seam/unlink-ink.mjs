/* Where the WORD's ink sits in the Unlink button — rows of bright pixels under the label vs the icon
   vs the plate. Boxes lie (a cap-trimmed box is a font metric, not the glyphs); ink does not. */
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
const sel = '[role="dialog"][aria-label="Publish"] div[class*="#313133"] button'
await p.hover(sel); await p.waitForTimeout(400)
const g = await p.evaluate((sel) => {
  const btn = document.querySelector(sel)
  const span = btn.querySelector('span'); const svg = btn.querySelector('svg')
  const r = (el) => { const q = el.getBoundingClientRect(); return { x: q.x, y: q.y, w: q.width, h: q.height } }
  return { btn: r(btn), span: r(span), svg: r(svg), font: getComputedStyle(span).fontFamily.slice(0, 40), fs: getComputedStyle(span).fontSize, lh: getComputedStyle(span).lineHeight, trim: getComputedStyle(span).textBoxTrim, edge: getComputedStyle(span).textBoxEdge }
}, sel)
const clip = { x: Math.floor(g.btn.x), y: Math.floor(g.btn.y), width: Math.ceil(g.btn.w), height: Math.ceil(g.btn.h) }
await p.screenshot({ path: path.join(here, 'unlink-ink.png'), clip })
execFileSync(FF, ['-y', '-loglevel', 'error', '-i', path.join(here, 'unlink-ink.png'), '-f', 'rawvideo', '-pix_fmt', 'rgb24', path.join(here, 'unlink-ink.raw')])
const W = clip.width * 2, H = clip.height * 2
const raw = fs.readFileSync(path.join(here, 'unlink-ink.raw'))
const px = (x, y) => raw[(y * W + x) * 3]
const inkRows = (x0, x1) => { const rows = []; for (let y = 0; y < H; y++) { let m = 0; for (let x = x0; x < x1; x++) m = Math.max(m, px(x, y)); rows.push(m) } return rows }
const span = (rows, thr) => { const on = rows.map((v, i) => [v, i]).filter(([v]) => v > thr).map(([, i]) => i); return on.length ? { top: on[0], bottom: on[on.length - 1], centre: (on[0] + on[on.length - 1]) / 2 } : null }
const sx0 = Math.round((g.span.x - clip.x) * 2), sx1 = Math.round((g.span.x + g.span.w - clip.x) * 2)
const ix0 = Math.round((g.svg.x - clip.x) * 2), ix1 = Math.round((g.svg.x + g.svg.w - clip.x) * 2)
const word = inkRows(sx0, sx1), icon = inkRows(ix0, ix1)
/* the word's rows: all ink (ascenders + descenders — "Unlink" has no descender), and the x-height body
   (the rows where MANY columns are lit, i.e. the lowercase mass) */
const wordInk = span(word, 140)
const dense = []; for (let y = 0; y < H; y++) { let n = 0; for (let x = sx0; x < sx1; x++) if (px(x, y) > 140) n++; dense.push(n) }
const maxN = Math.max(...dense); const body = span(dense.map((n) => (n > maxN * 0.45 ? 255 : 0)), 100)
const iconInk = span(icon, 140)
console.log(JSON.stringify({ font: g.font, fs: g.fs, lh: g.lh, trim: g.trim, edge: g.edge, plateDevPx: H, plateCentre: H / 2, spanBox: { top: (g.span.y - clip.y) * 2, bottom: (g.span.y - clip.y + g.span.h) * 2 }, wordInk, wordBody: body, iconInk }, null, 1))
await b.close()
