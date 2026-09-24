/* Does the approaching shelf stay inside the canvas box? Sample the clip and the scaled inner mid-approach,
   and hit-test the Publish button's bottom edge and the credits pill while the shelf is at its largest. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(700); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(600)
const canvas = await p.$eval('[data-canvas-site]', (e) => e.getBoundingClientRect().toJSON())
const publish = await p.$eval('header button:has-text("Publish")', (e) => e.getBoundingClientRect().toJSON())
const film = p.evaluate(async () => {
  const s = []; const t0 = performance.now()
  const tick = () => {
    const now = performance.now(); const clip = document.querySelector('[data-sites-clip]'); const shelf = document.querySelector('[data-sites-shelf]')
    if (clip && shelf) {
      const c = clip.getBoundingClientRect(), r = shelf.getBoundingClientRect()
      const pub = [...document.querySelectorAll('header button')].find((b) => /Publish/.test(b.textContent))
      const pr = pub.getBoundingClientRect()
      const hit = document.elementFromPoint(pr.left + pr.width / 2, pr.bottom - 2)
      s.push({ t: Math.round(now - t0), clip: [c.x, c.y, c.width, c.height].map(Math.round), shelf: [r.x, r.y, r.width, r.height].map((n) => +n.toFixed(1)), s: getComputedStyle(shelf).transform, o: getComputedStyle(shelf).opacity, hitIsPublish: hit === pub || pub.contains(hit) })
    }
    if (now - t0 < 700) setTimeout(() => requestAnimationFrame(tick), 0)
  }
  requestAnimationFrame(tick); await new Promise((r) => setTimeout(r, 760)); return s
})
await p.waitForTimeout(30)
await p.click('[data-site-switch]')
const f = await film
const worst = f.reduce((a, x) => (x.shelf[1] < a.shelf[1] ? x : a), f[0])
console.log(JSON.stringify({ canvas, publish, frames: f.length, first: f[0], largest: worst, allHitPublish: f.every((x) => x.hitIsPublish), clipConstant: f.every((x) => x.clip.join() === f[0].clip.join()) }, null, 1))
await b.close()
