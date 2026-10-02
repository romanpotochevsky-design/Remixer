import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } })
await p.goto('http://localhost:4173/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'); await p.waitForTimeout(1500)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(800)
for (const id of ['synco', 'meridian']) {
  await p.click('[data-site-switch]'); await p.waitForTimeout(1500)
  await p.click(`[data-site-card="${id}"] [data-site-thumb]`, { force: true }); await p.waitForTimeout(2500)
  const dev = await p.$('[aria-label*="evice"], [data-device-toggle]')
  while ((await p.evaluate(() => document.querySelector('.site-stage')?.getBoundingClientRect().width)) > 400) { await p.click('[data-page-device]'); await p.waitForTimeout(900) }
  await p.screenshot({ path: `scratchpad/landings/${id}-phone.png` })
  while ((await p.evaluate(() => document.querySelector('.site-stage')?.getBoundingClientRect().width)) < 600) { await p.click('[data-page-device]'); await p.waitForTimeout(900) }
}
await b.close()
