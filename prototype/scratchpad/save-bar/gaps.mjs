/** Where the preview and the edit bar stand against the window's bottom edge (designer 02.10.2026:
 *  preview 2 px above the screen's bottom, the bar 8 px above the preview's). */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173/'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
for (const [w, h] of [[1600, 900], [2560, 1166]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  await page.goto(BASE + '?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
  await page.waitForTimeout(700); await page.click('.home-card-face')
  await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await page.waitForTimeout(900)
  const m = await page.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right } }
    const chain = []
    let e = document.querySelector('[data-ve-bar-host]')
    while (e && e !== document.body) { const b = e.getBoundingClientRect(); chain.push(`${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? '.' + e.className.split(' ').slice(0, 4).join('.') : ''}${[...e.attributes].filter((a) => a.name.startsWith('data-')).map((a) => `[${a.name}]`).join('')} b=${Math.round(b.bottom * 10) / 10} pb=${getComputedStyle(e).paddingBottom}`); e = e.parentElement }
    return { vh: innerHeight, stage: r('.site-stage'), canvasSite: r('[data-canvas-site]'), host: r('[data-ve-bar-host]'), glass: r('[data-ve-bar] [data-ve-glass]'), chain }
  })
  console.log(w, h, JSON.stringify({ vh: m.vh, stageB: m.stage?.bottom, siteB: m.canvasSite?.bottom, hostB: m.host?.bottom, glassB: m.glass?.bottom }))
  console.log(m.chain.join('\n'))
  await page.close()
}
await browser.close()
