import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto('http://localhost:5174/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(600)
const g = await p.evaluate(() => {
  const r = (el) => { if (!el) return null; const q = el.getBoundingClientRect(); return [q.x, q.y, q.width, q.height].map((v) => Math.round(v * 10) / 10) }
  const main = document.querySelector('main')
  const cs = getComputedStyle(main)
  return {
    main: r(main), pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft], mainChildren: [...main.children].map((c) => c.className.slice(0, 40)),
    site: r(document.querySelector('.site-stage')),
    siteWrap: r(document.querySelector('.site-stage')?.parentElement),
    cloudBtn: r(document.querySelector('nav.arrive-rail [aria-label="Cloud"]')),
    rail: r(document.querySelector('nav.arrive-rail')),
    chip: r([...document.querySelectorAll('header button')].find((e) => /remixer\.ai/.test(e.innerText))),
    header: r(document.querySelector('header')),
  }
})
console.log(JSON.stringify(g))
await b.close()
