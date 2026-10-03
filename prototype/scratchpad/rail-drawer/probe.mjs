import { chromium } from 'playwright'
const W = +(process.env.W || 1920), H = +(process.env.H || 1000)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: W, height: H } })
const errs = []; p.on('pageerror', (e) => errs.push(e.message))
await p.goto('http://localhost:4173/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'); await p.waitForTimeout(1500)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(2500)
const trace = () => p.evaluate(() => new Promise((res) => {
  const out = []; const t0 = performance.now()
  const tick = () => {
    const m = document.querySelector('[data-canvas-main]'); const d = document.querySelector('[data-rail-drawer]')
    out.push({ t: Math.round(performance.now() - t0), mr: m ? Math.round(parseFloat(getComputedStyle(m).marginRight)) : null,
      form: d?.getAttribute('data-rail-drawer') ?? null, clip: d ? getComputedStyle(d).clipPath.slice(0, 40) : null, op: d ? (+getComputedStyle(d).opacity).toFixed(2) : null, n: document.querySelectorAll('[data-rail-drawer]').length })
    if (performance.now() - t0 < 900) requestAnimationFrame(tick); else res(out)
  }
  requestAnimationFrame(tick)
}))
const tag = `${W}`
const [tr] = await Promise.all([trace(), p.click('[data-rail-integrations]')])
console.log('OPEN integrations', tr.filter((_, i) => i % 3 === 0).map((x) => `${x.t}:${x.mr}/${x.form}/${x.clip?.match(/[\d.]+%/)?.[0] ?? '-'}/${x.op}`).join(' '))
await p.waitForTimeout(400); await p.screenshot({ path: `scratchpad/rail-drawer/int-${tag}.png` })
const [tr2] = await Promise.all([trace(), p.click('[data-rail-media]')])
console.log('SWAP → media', tr2.filter((_, i) => i % 3 === 0).map((x) => `${x.t}:${x.mr}/n${x.n}/${x.op}`).join(' '))
await p.waitForTimeout(400); await p.screenshot({ path: `scratchpad/rail-drawer/media-${tag}.png` })
const [tr3] = await Promise.all([trace(), p.click('[data-media-close]')])
console.log('CLOSE', tr3.filter((_, i) => i % 3 === 0).map((x) => `${x.t}:${x.mr}/n${x.n}`).join(' '))
await p.click('[data-rail-integrations]'); await p.waitForTimeout(250); await p.screenshot({ path: `scratchpad/rail-drawer/int-mid-${tag}.png` })
await p.waitForTimeout(800)
await p.click('[data-integration-go="stripe"]'); await p.waitForTimeout(300)
console.log('composer:', await p.$eval('textarea', (e) => e.value), 'focused', await p.evaluate(() => document.activeElement?.tagName))
console.log(errs)
await b.close()
