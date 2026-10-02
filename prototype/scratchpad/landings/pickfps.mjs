import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto('http://localhost:4173/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'); await p.waitForTimeout(1500)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(3000)
for (const id of ['synco', 'meridian', 'fit-ration']) {
  await p.click('[data-site-switch]'); await p.waitForTimeout(1500)
  const f = p.evaluate(() => new Promise((res) => { const t0 = performance.now(); const ts = []; const tick = (n) => { ts.push(Math.round(n - t0)); if (n - t0 < 1000) requestAnimationFrame(tick); else res(ts) }; requestAnimationFrame(tick) }))
  await p.click(`[data-site-card="${id}"] [data-site-open]`)
  const ts = await f
  const gaps = ts.slice(1).map((t, i) => t - ts[i])
  console.log(id, 'frames', ts.length, 'worst', Math.max(...gaps), gaps.slice(0, 12).join(','))
  await p.waitForTimeout(3000)
}
await b.close()
