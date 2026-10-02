import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
const errs = []; p.on('pageerror', (e) => errs.push(e.message))
await p.goto('http://localhost:4173/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'); await p.waitForTimeout(1500)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(800)
await p.screenshot({ path: 'scratchpad/landings/00b.png' })
for (const id of ['synco', 'meridian', 'fit-ration']) {
  await p.click('[data-site-switch]'); await p.waitForTimeout(1500)
  if (id === 'synco') await p.screenshot({ path: 'scratchpad/landings/shelf.png' })
  await p.click(`[data-site-card="${id}"] [data-site-thumb]`, { force: true }); await p.waitForTimeout(3000)
  await p.waitForTimeout(300); await p.screenshot({ path: `scratchpad/landings/${id}.png` })
  await p.mouse.move(1000, 500); await p.mouse.wheel(0, 650); await p.waitForTimeout(800)
  await p.screenshot({ path: `scratchpad/landings/${id}-2.png` })
}
console.log(errs)
await b.close()
