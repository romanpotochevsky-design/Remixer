import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 2480, height: 1172 }, deviceScaleFactor: 1 })
const p = await ctx.newPage()
await p.goto('http://localhost:5174/?p=built&v=true&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await p.waitForTimeout(600); await p.click('.home-card-face')
await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(400)
await p.click('nav.arrive-rail [aria-label="Cloud"]'); await p.waitForTimeout(900)
console.log(JSON.stringify(await p.evaluate(() => {
  const row = document.querySelector('[data-cloud-row]')
  const act = row.querySelector('.sticky')
  const list = document.querySelector('[data-cloud-list]')
  const R = (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.right), Math.round(r.width)] }
  return { row: R(row), actions: R(act), list: R(list), scroll: [list.clientWidth, list.scrollWidth],
           btns: [...act.querySelectorAll('button')].map(R) }
}), null, 1))
await b.close()
