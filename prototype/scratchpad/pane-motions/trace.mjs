/* THREE MOTIONS, ONE TRACE. For each `paneMotion` (unfold · sheet · focus), set in the console the way the
   designer does (⌘. → the option → ⌘.), film: OPEN Cloud by its rail button, SWITCH to Analytics by its
   button (both panes sampled), CLOSE by the button. Samples per frame: each pane's opacity / transform
   matrix (scale, translateY) / clip inset / z-index, the site's opacity + scale, frame interval.
     CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scratchpad/pane-motions/trace.mjs [motion|all]
   BASE = preview (4173) by default. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const which = process.argv[2] || 'all'
const MOTIONS = which === 'all' ? ['unfold', 'sheet', 'focus'] : [which]
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)

const setMotion = async (m) => {
  await p.keyboard.press('Control+.'); await p.waitForTimeout(350)
  const label = { unfold: 'Unfold', sheet: 'Sheet', focus: 'Focus' }[m]
  await p.evaluate((label) => {
    const btn = [...document.querySelectorAll('[data-console] button')].find((b) => b.textContent.trim() === label)
    if (!btn) throw new Error('no console button ' + label)
    btn.click()
  }, label)
  await p.waitForTimeout(150)
  await p.keyboard.press('Control+.'); await p.waitForTimeout(350)
  const v = await p.evaluate(() => JSON.parse(localStorage.getItem('remixer-prototype/world/v5') || '{}').paneMotion)
  if (v !== m) throw new Error(`paneMotion is ${v}, wanted ${m}`)
}

const film = (ms) => p.evaluate(async (ms) => {
  const inset = (el) => { const m = getComputedStyle(el).clipPath.match(/inset\(([^)]*)\)/); if (!m) return null; const v = m[1].split('round')[0].trim().split(/\s+/).map(parseFloat); return v.length === 1 ? [v[0], v[0], v[0], v[0]] : v.length === 2 ? [v[0], v[1], v[0], v[1]] : v.length === 3 ? [v[0], v[1], v[2], v[1]] : v }
  const mat = (el) => { const m = getComputedStyle(el).transform; if (!m || m === 'none') return null; const a = m.match(/matrix\(([^)]+)\)/); return a ? a[1].split(',').map(Number) : null }
  const snap = (pane) => {
    if (!pane) return null
    const m = mat(pane); const cs = getComputedStyle(pane)
    return { id: pane.dataset.canvasPane, motion: pane.dataset.paneMotion, o: +(+cs.opacity).toFixed(3), s: m ? +m[0].toFixed(4) : 1, y: m ? Math.round(m[5]) : 0, clip: inset(pane)?.map((v) => Math.round(v)), z: cs.zIndex, fresh: pane.hasAttribute('data-pane-fresh') }
  }
  const s = []; const t0 = performance.now(); let last = t0
  const tick = () => {
    const now = performance.now()
    const panes = [...document.querySelectorAll('[data-canvas-pane]')].map(snap)
    const site = document.querySelector('[data-canvas-site]'); const sm = site ? mat(site) : null
    s.push({ t: Math.round(now - t0), dt: Math.round(now - last), panes, site: site ? { o: +(+getComputedStyle(site).opacity).toFixed(2), s: sm ? +sm[0].toFixed(3) : 1, y: sm ? Math.round(sm[5]) : 0 } : null })
    last = now
    if (now - t0 < ms) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  await new Promise((r) => setTimeout(r, ms + 60)); return s
}, ms)

const fmtPane = (q) => q ? `${q.id}[${q.motion}] o${q.o} s${q.s} y${q.y}${q.clip ? ' clip' + q.clip.join('/') : ''}${q.z !== 'auto' ? ' z' + q.z : ''}` : '-'
const show = (label, s) => {
  const key = (x) => JSON.stringify([x.panes, x.site])
  console.log(`\n== ${label} frames=${s.length} worst dt=${Math.max(...s.slice(1).map((x) => x.dt))}ms`)
  for (const x of s.filter((x, i) => i === 0 || key(x) !== key(s[i - 1]))) console.log(String(x.t).padStart(5), x.panes.map(fmtPane).join(' | ').padEnd(96), x.site ? `site o${x.site.o} s${x.site.s} y${x.site.y}` : 'site -')
}
const bbox = async (label) => (await p.$(`nav.arrive-rail [aria-label="${label}"]`)).boundingBox()

for (const m of MOTIONS) {
  await setMotion(m)
  console.log(`\n\n######## ${m.toUpperCase()} ########`)
  const cloud = await bbox('Cloud'), an = await bbox('Analytics')
  const [, so] = await Promise.all([p.mouse.click(cloud.x + 12, cloud.y + 12), film(1300)]); show('OPEN Cloud', so)
  await p.mouse.move(800, 800); await p.waitForTimeout(300)
  const [, sw] = await Promise.all([p.mouse.click(an.x + 24, an.y + 24), film(1300)]); show('SWITCH Cloud → Analytics', sw)
  await p.mouse.move(800, 800); await p.waitForTimeout(300)
  const [, sc] = await Promise.all([p.mouse.click(an.x + 36, an.y + 36), film(1100)]); show('CLOSE by button', sc)
  await p.mouse.move(800, 800); await p.waitForTimeout(500)
}
await b.close()
