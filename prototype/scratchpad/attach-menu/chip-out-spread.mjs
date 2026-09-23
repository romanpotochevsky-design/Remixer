/* Replays exactly the suite's chip-removal film, N times, and prints the spread of
   "the frame the chip is gone on" against the suite's 300 ms bound. */
import { chromium } from 'playwright'

const BASE = process.env.BASE || 'http://localhost:4173'
const N = +(process.env.N || 8)
const HOME_WITH_DOMAINS = 'p=empty&h=empty&a=trial&t=1&c=2000&i=dh-free'
const at = (q) => `${BASE}${BASE.includes('?') ? '&' : '?'}${q}`

const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } })
const p = await ctx.newPage()

const film = (act, read, ms) => p.evaluate(async ({ act, read, ms }) => {
  const out = []; const t0 = performance.now()
  new Function(act)()
  const reader = new Function('return (' + read + ')')()
  await new Promise((res) => {
    const tick = () => { const now = performance.now() - t0; out.push({ t: Math.round(now), ...reader() }); if (now < ms) requestAnimationFrame(tick); else res() }
    requestAnimationFrame(tick)
  })
  return out
}, { act, read: read.toString(), ms })

const rows = []
for (let i = 0; i < N; i++) {
  await p.goto(at(HOME_WITH_DOMAINS + '&g=fit-ration.com'), { waitUntil: 'networkidle' })
  await p.waitForTimeout(2600)
  const removal = await film(`document.querySelector('[data-attach-domain] button').click()`, () => {
    const c = document.querySelector('[data-attach-domain]')
    const field = +document.querySelector('.he-composer').getBoundingClientRect().height.toFixed(1)
    if (!c) return { field, none: true }
    const g = getComputedStyle(c)
    return { field, scale: +new DOMMatrix(g.transform).a.toFixed(4), op: +(+g.opacity).toFixed(3) }
  }, 900)
  const rm = removal.filter((f) => !f.none)
  const gone = removal.find((f) => f.none)
  // frame cadence while the chip plays, and the last frame before it vanishes
  const dts = rm.slice(1).map((f, k) => f.t - rm[k].t)
  rows.push({
    run: i + 1,
    goneAt: gone?.t ?? null,
    lastAlive: rm.at(-1)?.t ?? null,
    gap: gone && rm.at(-1) ? gone.t - rm.at(-1).t : null,
    minScale: Math.min(...rm.map((f) => f.scale)),
    frames: rm.length,
    medianDt: dts.sort((a, z) => a - z)[Math.floor(dts.length / 2)] ?? null,
    fieldAtGone: gone?.field ?? null,
    fieldEnd: removal.at(-1).field,
  })
  console.log(JSON.stringify(rows.at(-1)))
}
const g = rows.map((r) => r.goneAt)
console.log('\ngoneAt: min %d · max %d · median %d · over-300 %d/%d',
  Math.min(...g), Math.max(...g), g.slice().sort((a, z) => a - z)[Math.floor(g.length / 2)],
  g.filter((v) => v >= 300).length, g.length)
console.log('median frame interval while the chip plays: %d ms', rows.map((r) => r.medianDt).sort((a, z) => a - z)[Math.floor(rows.length / 2)])
await b.close()
