/* The edges: the Home dock with the live card, the console's new axis, reduced motion, mobile mode,
   a collapsed preview, and a build from Home creating a new site on the shelf. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = 'scratchpad/site-switch'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const out = {}
const errors = []
/* 1 · Home dock */
{
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); p.on('pageerror', (e) => errors.push('home:' + e))
  await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
  out.home = { cards: await p.$$eval('.home-card-face', (els) => els.map((e) => e.querySelector('p')?.textContent)), minis: await p.$$eval('[data-site-mini]', (els) => els.length), h1s: await p.$$eval('h1', (els) => els.map((e) => e.textContent)) }
  await p.screenshot({ path: `${OUT}/edge-home.png` })
  /* build from Home: a new site on the shelf */
  await p.fill('input[aria-label="Describe the site you want"]', "Bella's Bakery in Odesa")
  await p.keyboard.press('Enter'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(500)
  out.newSite = await p.evaluate(() => { const w = JSON.parse(localStorage.getItem('remixer-prototype/world/v6') || '{}'); return { site: w.site, names: (w.projects || []).map((x) => x.name), domain: w.domain, stash: Object.keys(w.stash || {}) } })
  out.newSiteHeader = await p.$$eval('header span.arrive-word', (els) => els.map((e) => e.textContent))
  await p.close()
}
/* 2 · console axis + reduced motion */
{
  const p = await b.newPage({ viewport: { width: 1600, height: 900 }, reducedMotion: 'reduce' }); p.on('pageerror', (e) => errors.push('reduce:' + e))
  await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' }); await p.waitForTimeout(700)
  await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(500)
  await p.keyboard.press('Control+.'); await p.waitForTimeout(400)
  out.console = await p.evaluate(() => document.body.innerText.includes('Open site') && document.body.innerText.includes('Their four sites'))
  await p.screenshot({ path: `${OUT}/edge-console.png` })
  await p.keyboard.press('Control+.'); await p.waitForTimeout(300)
  await p.click('[data-site-switch]'); await p.waitForTimeout(500)
  out.reduce = { shelf: !!(await p.$('[data-sites-shelf]')), park: await p.$eval('[data-site-park]', (e) => [getComputedStyle(e).transform, getComputedStyle(e).opacity]), pictureVis: await p.$eval('[data-site-card="fit-ration"] [data-site-picture]', (e) => getComputedStyle(e).visibility) }
  await p.click('[data-site-card="meridian"] [data-site-open]'); await p.waitForTimeout(500)
  out.reducePick = { header: await p.$eval('[data-site-name]', (e) => e.textContent), shelf: !!(await p.$('[data-sites-shelf]')), drawing: await p.$eval('[data-site-drawing]', (e) => e.dataset.siteDrawing).catch(() => null), park: await p.$eval('[data-site-park]', (e) => getComputedStyle(e).opacity) }
  await p.close()
}
/* 3 · mobile mode + collapsed preview */
{
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); p.on('pageerror', (e) => errors.push('mobile:' + e))
  await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' }); await p.waitForTimeout(700)
  await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(500)
  await p.click('button[aria-label="Switch to mobile view"]'); await p.waitForTimeout(500)
  await p.click('[data-site-switch]'); await p.waitForTimeout(900)
  await p.screenshot({ path: `${OUT}/edge-mobile.png` })
  out.mobile = { park: await p.$eval('[data-site-park]', (e) => e.getBoundingClientRect().toJSON()), slot: await p.$eval('[data-site-card="fit-ration"] [data-site-thumb]', (e) => e.getBoundingClientRect().toJSON()) }
  await p.keyboard.press('Escape'); await p.waitForTimeout(800)
  await p.click('button[aria-label="Switch to desktop view"]'); await p.waitForTimeout(400)
  /* collapse the preview by dragging the divider far right */
  const div = await (await p.$('[data-resizer], .chat-resizer, [aria-label*="Resize"]')).boundingBox().catch(() => null)
  out.divider = div
  if (div) {
    await p.mouse.move(div.x + div.width / 2, 450); await p.mouse.down(); await p.mouse.move(1500, 450, { steps: 12 }); await p.mouse.up(); await p.waitForTimeout(600)
    out.collapsed = await p.evaluate(() => document.querySelector('[data-preview]')?.getAttribute('data-preview'))
    await p.click('[data-site-switch]'); await p.waitForTimeout(1400)
    out.reopened = { preview: await p.evaluate(() => document.querySelector('[data-preview]')?.getAttribute('data-preview')), shelf: !!(await p.$('[data-sites-shelf]')) }
    await p.screenshot({ path: `${OUT}/edge-collapsed.png` })
  }
  await p.close()
}
out.errors = errors
console.log(JSON.stringify(out, null, 1))
await b.close()
