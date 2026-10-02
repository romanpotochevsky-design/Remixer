import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto('http://localhost:4173/'); await p.waitForTimeout(800)
await p.evaluate(() => localStorage.setItem('remixer-prototype/world/v6', JSON.stringify({ site: 'still', projects: [
  { id: 'fit-ration', name: 'fit-ration', updatedLabel: { en: 'x', uk: 'x' }, thumb: 'live' },
  { id: 'site-1', name: 'bellas', updatedLabel: { en: 'x', uk: 'x' }, thumb: 'live' },
  { id: 'synco', name: 'synco.com', updatedLabel: { en: 'x', uk: 'x' }, thumb: 'synco' },
  { id: 'meridian', name: 'meridianroast.com', updatedLabel: { en: 'x', uk: 'x' }, thumb: 'coffee' },
  { id: 'still', name: 'still-studio.com', updatedLabel: { en: 'x', uk: 'x' }, thumb: 'yoga' }] })))
await p.goto('http://localhost:4173/'); await p.waitForTimeout(1500)
console.log(await p.$$eval('.home-card-face', (els) => els.map((e) => e.querySelector('.home-thumb + div p')?.textContent + ':' + !!e.querySelector('[data-site-mini]'))))
await b.close()
