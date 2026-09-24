// Does a machine with a SYSTEM font called "Proxima Nova" render the prototype in it?
// Label width tells: Figtree draws "Autopilot" 55.03 px wide at 13px medium.
import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.CHROME })
for (const base of process.argv.slice(2)) {
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
  await p.goto(`${base}${base.includes('?') ? '&' : '?'}p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await p.click('.home-card-face')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 })
  const r = await p.$eval('button[aria-label="Chat mode"]', (el) => {
    const lab = el.firstElementChild
    return { pill: +el.getBoundingClientRect().width.toFixed(2), label: +lab.getBoundingClientRect().width.toFixed(2),
      family: getComputedStyle(lab).fontFamily.slice(0, 40),
      faces: [...document.fonts].filter((f) => /Proxima|Figtree/.test(f.family)).map((f) => `${f.family} ${f.weight} ${f.status}`) }
  })
  console.log(base, JSON.stringify(r))
  await p.close()
}
await b.close()
