import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
for (const q of ['p=built&u=1&v=true&d=live&n=adovasio.com&a=paid&t=22&c=640', 'p=built&a=paid&d=ready&k=true&n=fit-ration.com&v=true&u=0&t=22&c=640']) {
  await p.goto('http://localhost:4173/?' + q, { waitUntil: 'networkidle' })
  await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(400)
  await p.click('header button:has-text("Publish")'); await p.waitForTimeout(1200)
  const r = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"][aria-label="Publish"]')
    const cands = [...d.querySelectorAll('div')].filter((e) => /Unlink|Відв/.test(e.textContent || '') && /inset/.test(getComputedStyle(e).boxShadow) && Math.round(e.getBoundingClientRect().width) === 420 && e.getBoundingClientRect().height < 100)
    const rim = cands.find((e) => !cands.some((o) => o !== e && e.contains(o)))
    const insetPart = (el) => (getComputedStyle(el).boxShadow.split(/,(?![^(]*\))/).find((part) => /inset/.test(part)) || '').trim()
    return { n: cands.length, found: !!rim, h: rim && rim.getBoundingClientRect().height, colour: rim && (insetPart(rim).match(/rgba?\([^)]+\)/) || [null])[0], ring: rim && insetPart(rim).replace(/rgba?\([^)]+\)\s*/, '').trim(), letter: /One last step/.test(d.innerText) }
  })
  console.log(q.slice(0, 40), JSON.stringify(r))
}
await b.close()
