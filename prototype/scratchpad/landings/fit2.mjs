import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
const errs = []; p.on('pageerror', (e) => errs.push(e.message))
await p.goto('http://localhost:4173/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'); await p.waitForTimeout(1500)
await p.screenshot({ path: 'scratchpad/landings/fit-dock.png' })
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(3500)
await p.mouse.move(1000, 500); await p.mouse.wheel(0, 500); await p.waitForTimeout(700); await p.screenshot({ path: 'scratchpad/landings/fit-2.png' })
for (const path of ['/about', '/services', '/contact']) {
  await p.click('[data-site-link="' + path + '"]').catch(() => {}); await p.waitForTimeout(1200)
  await p.screenshot({ path: `scratchpad/landings/fit${path.replace('/', '-')}.png` })
}
console.log(errs)
await b.close()
