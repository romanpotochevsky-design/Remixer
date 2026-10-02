import { chromium } from 'playwright'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
await page.goto('http://localhost:4173/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await page.waitForTimeout(700); await page.click('.home-card-face')
await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await page.waitForTimeout(900)
console.log((await page.evaluate(() => { const out = []; let e = document.querySelector('.site-stage'); while (e && e.tagName !== 'MAIN') { const b = e.getBoundingClientRect(), cs = getComputedStyle(e); out.push(`${e.tagName.toLowerCase()} ${(e.getAttribute('class') || '').slice(0, 110)} ${[...e.attributes].filter((a) => a.name.startsWith('data-')).map((a) => a.name).join(',')} b=${b.bottom} pb=${cs.paddingBottom} mb=${cs.marginBottom} bottom=${cs.bottom} pos=${cs.position}`); e = e.parentElement } return out })).join('\n'))
await browser.close()
