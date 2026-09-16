// The white-word A/B on the real build: the domain row with the toggle off and on, 3×.
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
const FF = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
const OUT = new URL('./live/', import.meta.url).pathname; mkdirSync(OUT, { recursive: true })
const BASE = 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 3 })
const p = await ctx.newPage()
const rowShot = async (name) => {
  const btn = await p.$('[role="dialog"][aria-label="Publish"] button:has-text("Unlink")')
  const row = await btn.evaluateHandle((b) => b.parentElement)
  await row.asElement().screenshot({ path: `${OUT}${name}.png` })
  return p.evaluate(() => {
    const el = document.querySelector('[role="dialog"][aria-label="Publish"] .liquid-glass--chip[data-tone]')
    const dot = el.querySelector('.h-2.w-2'), word = el.querySelector('.chip-label')
    return { ink: el.dataset.ink ?? 'tone', word: getComputedStyle(word).color, dot: getComputedStyle(dot).backgroundColor }
  })
}
const files = []
for (const [q, name] of [['d=ready&k=true&n=fit-ration.net&v=false', 'amber'], ['d=ready&n=fit-ration.net&v=false', 'blue'], ['d=live&n=fit-ration.net&v=true', 'green'], ['d=unreachable&n=fit-ration.net&v=true', 'red']]) {
  await p.goto(`${BASE}?p=built&a=paid&u=0&${q}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
  await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(400)
  await p.click('header button:has-text("Publish")'); await p.waitForTimeout(900)
  const off = await rowShot(`ink-${name}-tone`)
  await p.keyboard.press('Control+.'); await p.waitForTimeout(400)
  await p.addStyleTag({ content: '[data-console]{opacity:0 !important}' })
  await p.evaluate(() => { const lab = [...document.querySelectorAll('[data-console] label')].find((l) => l.textContent.trim() === 'Status chip — white word'); lab.parentElement.parentElement.querySelector('button').click() })
  await p.waitForTimeout(400)
  const on = await rowShot(`ink-${name}-white`)
  // leave the world as it was
  await p.evaluate(() => { const lab = [...document.querySelectorAll('[data-console] label')].find((l) => l.textContent.trim() === 'Status chip — white word'); lab.parentElement.parentElement.querySelector('button').click() })
  await p.waitForTimeout(200)
  console.log(name, 'off', JSON.stringify(off), '· on', JSON.stringify(on))
  files.push(`${OUT}ink-${name}-tone.png`, `${OUT}ink-${name}-white.png`)
}
await b.close()
// a 2-column sheet: tone | white, four rows
const pads = files.map((f, i) => `[${i}]crop=760:ih:0:0,pad=760:ih:0:0:0x1f1f22[p${i}]`).join(';')
const stack = `[p0][p1]hstack=2[r0];[p2][p3]hstack=2[r1];[p4][p5]hstack=2[r2];[p6][p7]hstack=2[r3];[r0][r1][r2][r3]vstack=4`
execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...files.flatMap((f) => ['-i', f]), '-filter_complex', `${pads};${stack}`, '-update', '1', `${OUT}ink-ab.png`])
console.log('ok')
