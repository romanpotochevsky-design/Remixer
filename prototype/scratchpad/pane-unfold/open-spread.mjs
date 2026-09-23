/* Films the Cloud unfold N times and reports the FIRST sampled clip inset — the number the
   suite asserts starts at the rail button's footprint (~1108 at 1600x900). Written to tell a
   real regression from the sampler simply catching the first frame late. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const N = +(process.env.N || 6)
const at = (q) => `${BASE}${BASE.includes('?') ? '&' : '?'}${q}`

const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } })
const p = await ctx.newPage()

const film = (ms) => p.evaluate(async (ms) => {
  const inset = (el) => { const m = getComputedStyle(el).clipPath.match(/inset\(([^)]*)\)/); if (!m) return null; const v = m[1].split('round')[0].trim().split(/\s+/).map(parseFloat); return v.length === 1 ? [v[0],v[0],v[0],v[0]] : v.length === 2 ? [v[0],v[1],v[0],v[1]] : v.length === 3 ? [v[0],v[1],v[2],v[1]] : v }
  const out = []; const t0 = performance.now(); let last = t0
  await new Promise((res) => {
    const tick = () => {
      const now = performance.now(); const pane = document.querySelector('[data-canvas-pane]')
      out.push({ t: Math.round(now - t0), dt: Math.round(now - last), clip: pane ? inset(pane) : null })
      last = now
      if (now - t0 < ms) requestAnimationFrame(tick); else res()
    }
    requestAnimationFrame(tick)
  })
  return out
}, ms)

const rows = []
for (let i = 0; i < N; i++) {
  await p.goto(at('p=built&v=true&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'), { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  await p.click('.home-card-face')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
  await p.waitForTimeout(500)
  const btn = await (await p.$('nav.arrive-rail [aria-label="Cloud"]')).boundingBox()
  const [f] = await Promise.all([film(1300), p.mouse.click(btn.x + 12, btn.y + 12)])
  const withClip = f.filter((s) => s.clip)
  const first = withClip[0]
  rows.push({ run: i + 1, firstT: first?.t, firstDt: first?.dt, left0: first?.clip?.[3], frames: withClip.length })
  console.log(JSON.stringify(rows.at(-1)))
}
const l = rows.map((r) => r.left0).filter((v) => v != null)
console.log('\nleft0: min %s · max %s · runs at/above 1100: %d/%d (suite wants ~1108, tolerance: boxW 1104)',
  Math.min(...l).toFixed(1), Math.max(...l).toFixed(1), l.filter((v) => v >= 1100).length, l.length)
console.log('first sampled frame lands at t = %s ms', rows.map((r) => r.firstT).join(' · '))
await b.close()
