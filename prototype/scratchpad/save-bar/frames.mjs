import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173/'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
await page.goto(BASE + '?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await page.waitForTimeout(700); await page.click('.home-card-face')
await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await page.waitForTimeout(800)
await page.click('[data-ve-tool="edit"]'); await page.waitForTimeout(500)
const hb = await (await page.$('[data-edit="home.hero.title"]')).boundingBox()
await page.mouse.click(hb.x + 30, hb.y + hb.height / 2); await page.waitForTimeout(150)
await page.evaluate(() => {
  window.__tr = []; const t0 = performance.now()
  const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.width)] }
  const tick = () => { const bar = document.querySelector('[data-ve-bar]'); window.__tr.push({ t: Math.round(performance.now() - t0), glass: r('[data-ve-bar] [data-ve-glass]'), sizer: r('[data-ve-bar]'), row: bar ? [Math.round(bar.firstElementChild.nextElementSibling.getBoundingClientRect().x), Math.round(bar.firstElementChild.nextElementSibling.getBoundingClientRect().width)] : null, tool: r('[data-ve-tool="edit"]'), sel: r('[data-ve-tool="select"]'), batch: r('[data-ve-batch]') }); if (window.__tr.length < 50) requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
})
await page.keyboard.press('Control+End'); await page.keyboard.type(' now'); await page.keyboard.press('Enter')
await page.waitForTimeout(1200)
for (const f of (await page.evaluate(() => window.__tr)).slice(0, 30)) console.log(JSON.stringify(f))
await browser.close()
