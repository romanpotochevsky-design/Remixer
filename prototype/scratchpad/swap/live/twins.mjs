import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('http://localhost:4173/?p=built&a=paid&d=connecting&n=fit-ration.com&v=true&u=0&t=22&c=640', { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(400)
await p.click('header button:has-text("Publish")'); await p.waitForTimeout(900)
const out = await p.evaluate(async () => {
  const row = document.querySelector('[role="dialog"][aria-label="Publish"] .shimmer-hue')
  const anims = row.getAnimations().filter((a) => /^sh-(hue|arc)$/.test(a.animationName))
  const res = { names: anims.map((a) => a.animationName), timing: anims.map((a) => { const t = a.effect.getComputedTiming(); return { delay: t.delay, duration: t.duration, localTime: t.localTime, progress: t.progress, iter: t.currentIteration, ct: a.currentTime, st: a.startTime, state: a.playState } }), reads: [] }
  const delay = anims[0].effect.getComputedTiming().delay
  for (const hold of [500, 3200, 5900]) {
    const seek = hold + delay + 8100 * Math.max(0, Math.ceil(-(hold + delay) / 8100)); anims.forEach((a) => { a.pause(); a.currentTime = seek })
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    const t = anims[0].effect.getComputedTiming()
    res.reads.push({ hold, set: hold + delay, ct: anims[0].currentTime, localTime: t.localTime, progress: +t.progress?.toFixed(3), hue: getComputedStyle(row).getPropertyValue('--sh-hue').trim(), arc: getComputedStyle(row).getPropertyValue('--sh-arc').trim() })
    await new Promise((r) => setTimeout(r, 60))
    const t2 = anims[0].effect.getComputedTiming()
    res.reads.push({ hold, after60: true, ct: anims[0].currentTime, progress: +t2.progress?.toFixed(3), hue: getComputedStyle(row).getPropertyValue('--sh-hue').trim() })
  }
  return res
})
console.log(JSON.stringify(out, null, 1))
await b.close()
