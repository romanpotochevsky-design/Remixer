import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const out = []
for (let r = 0; r < 4; r++) {
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
  await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`); await p.waitForTimeout(1200)
  await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(1500)
  await p.click('nav.arrive-rail [aria-label="Cloud"]'); await p.waitForTimeout(2500)
  await p.mouse.move(800, 800)
  const f = p.evaluate(() => new Promise((res) => { let t0 = null; const ts = []; addEventListener('keydown', () => { t0 = performance.now() }, { once: true, capture: true }); const tick = (n) => { if (t0 !== null) ts.push(n - t0); if (t0 === null || n - t0 < 300) requestAnimationFrame(tick); else res(ts.length) }; requestAnimationFrame(tick) }))
  await p.waitForTimeout(100); await p.keyboard.press('Escape')
  out.push(await f); await p.close()
}
console.log(BASE, out.join(','))
await b.close()
