/* FIRST FRAME OF THE UNFOLD. The suite films the Cloud open with the film and the click started together
   (Promise.all) and expects the first pane sample AT the button footprint (clip left ≈ box + 4, right ≈ −52):
   the law "the first frame of a motion is drawn before the motion". This probe repeats exactly that, N times,
   and prints the first three pane samples of each run — so a late first sample can be told from a pane that
   is already moving when it is first painted.
     CHROME=… node scratchpad/pane-motions/first-frame.mjs [runs] [BASE] */
import { chromium } from 'playwright'
const BASE = process.argv[3] || process.env.BASE || 'http://localhost:4173'
const RUNS = +(process.argv[2] || 5)
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}${BASE.endsWith('.html') ? '' : '/'}?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)
const film = (ms) => p.evaluate(async (ms) => {
  const inset = (el) => { const m = getComputedStyle(el).clipPath.match(/inset\(([^)]*)\)/); if (!m) return null; const v = m[1].split('round')[0].trim().split(/\s+/).map(parseFloat); return v.length === 1 ? [v[0], v[0], v[0], v[0]] : v.length === 2 ? [v[0], v[1], v[0], v[1]] : v.length === 3 ? [v[0], v[1], v[2], v[1]] : v }
  const s = []; const t0 = performance.now()
  const tick = () => {
    const now = performance.now(); const pane = document.querySelector('[data-canvas-pane]')
    s.push({ t: Math.round(now - t0), clip: pane ? inset(pane)?.map((v) => Math.round(v * 10) / 10) : null, o: pane ? +(+getComputedStyle(pane).opacity).toFixed(3) : null })
    if (now - t0 < ms) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  await new Promise((r) => setTimeout(r, ms + 60)); return s
}, ms)
const bbox = async (label) => (await p.$(`nav.arrive-rail [aria-label="${label}"]`)).boundingBox()
for (let i = 0; i < RUNS; i++) {
  const cloud = await bbox('Cloud')
  const [s] = await Promise.all([film(700), p.mouse.click(cloud.x + 12, cloud.y + 12)])
  const withPane = s.filter((x) => x.clip)
  const before = s.filter((x) => !x.clip).length
  console.log(`run ${i + 1}: ${before} empty frames, then`, withPane.slice(0, 3).map((x) => `${x.t}ms clip ${x.clip.join('/')} o${x.o}`).join(' · '))
  await p.waitForTimeout(400)
  await p.keyboard.press('Escape'); await p.waitForTimeout(900)
}
await b.close()
