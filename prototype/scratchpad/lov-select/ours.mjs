/** Our Select tool against Lovable's measured behaviour (scratchpad/lov-select/): ring ON the box,
 *  tag pill at cursor +14/+18, any element, click picks and never follows, bar «1 selection · Clear». */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const BASE = process.env.BASE || 'http://localhost:4173/'
const OUT = new URL('./ours/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
const errs = []
page.on('pageerror', (e) => { errs.push(e.message); console.log('PAGEERROR', e.message) })
let fails = 0
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++ }

await page.goto(BASE + '?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.click('.home-card-face')
await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await page.waitForTimeout(500)
const pathBefore = await page.$eval('[data-site-page]', (e) => e.getAttribute('data-site-page'))
await page.click('[data-ve-tool="select"]')
await page.waitForTimeout(400)
ok((await page.$eval('[data-ve-tool="select"]', (e) => e.getAttribute('aria-pressed'))) === 'true', 'select tool on')
ok(!(await page.$('.ve-ring--reveal')), 'no edit-mode reveal rings in select')
ok((await page.$eval('[data-site-page] h1', (e) => getComputedStyle(e).cursor)) === 'crosshair', 'crosshair cursor over the site')

/* hover the hero heading: ring exactly on its box, pill «h1» at +14/+18 */
const h1 = await page.$('[data-pick="home.hero.title"]')
const hb = await h1.boundingBox()
const cx = Math.round(hb.x + 40), cy = Math.round(hb.y + hb.height / 2)
await page.mouse.move(cx, cy, { steps: 4 })
await page.waitForTimeout(150)
const ring = await page.$eval('[data-ve-hover]', (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, bs: getComputedStyle(e).boxShadow, bg: getComputedStyle(e).backgroundColor, rad: getComputedStyle(e).borderRadius } }).catch(() => null)
const tagOf = async () => page.$eval('[data-ve-tag]', (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { text: e.textContent, x: r.x, y: r.y, w: r.width, h: r.height, bg: cs.backgroundColor, fs: cs.fontSize, fw: cs.fontWeight, rad: cs.borderRadius } }).catch(() => null)
const dTag = (h1.textContent ? null : null)
const word = await h1.evaluate((e) => e.tagName.toLowerCase())
ok(!!ring && Math.abs(ring.x - hb.x) < 0.6 && Math.abs(ring.y - hb.y) < 0.6 && Math.abs(ring.w - hb.width) < 0.6 && Math.abs(ring.h - hb.height) < 0.6, `hover ring ON the box (ring ${JSON.stringify(ring && [ring.x, ring.y, ring.w, ring.h])} vs ${JSON.stringify([hb.x, hb.y, hb.width, hb.height])})`)
ok(!!ring && ring.bs.includes('21, 135, 255') && ring.bs.includes('inset') && ring.rad === '0px', `ring 1 px inset action blue, square (${ring && ring.bs}, ${ring && ring.rad})`)
ok(!!ring && /rgba\(21, 135, 255, 0\.05\)/.test(ring.bg), `ring tint 5 % (${ring && ring.bg})`)
let tag = await tagOf()
ok(!!tag && tag.text === word, `pill names the tag «${tag && tag.text}» (element ${word})`)
ok(!!tag && Math.abs(tag.x - (cx + 14)) <= 1 && Math.abs(tag.y - (cy + 18)) <= 1, `pill at cursor +14/+18 (${tag && [tag.x - cx, tag.y - cy]})`)
ok(!!tag && tag.h === 23 && tag.bg === 'rgb(21, 135, 255)' && tag.fs === '13px' && tag.fw === '600', `pill 23 high, action blue, 13/600 (${tag && [tag.h, tag.bg, tag.fs, tag.fw]})`)

/* the pill follows the pointer */
await page.mouse.move(cx + 60, cy + 4, { steps: 3 })
await page.waitForTimeout(80)
tag = await tagOf()
ok(!!tag && Math.abs(tag.x - (cx + 60 + 14)) <= 1 && Math.abs(tag.y - (cy + 4 + 18)) <= 1, `pill follows the pointer (${tag && [tag.x - cx - 60, tag.y - cy - 4]})`)
await page.screenshot({ path: OUT + 'o1-hover-h1.png' })

/* any element: hover the hero's container (a div with no content key) — move into padding of the section */
const sect = await page.evaluate(() => {
  const h = document.querySelector('[data-pick="home.hero.title"]')
  let p = h.parentElement
  while (p && p.tagName !== 'SECTION' && !p.matches('[data-site-page] > * > *')) p = p.parentElement
  const el = h.parentElement
  const r = el.getBoundingClientRect()
  return { tag: el.tagName.toLowerCase(), x: r.x, y: r.y, w: r.width, h: r.height }
})
console.log('hero parent:', sect)

/* click the photo (img): pick ring, chip, bar */
const img = await page.$('[data-site-page] img')
const ib = await img.boundingBox()
await page.mouse.move(ib.x + ib.width / 2, ib.y + ib.height / 2, { steps: 4 })
await page.waitForTimeout(120)
tag = await tagOf()
ok(!!tag && tag.text === 'img', `photo pill «${tag && tag.text}»`)
await page.mouse.click(ib.x + ib.width / 2, ib.y + ib.height / 2)
await page.waitForTimeout(450)
const pick = await page.$eval('[data-ve-pick]', (e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height] }).catch(() => null)
ok(!!pick && Math.abs(pick[0] - ib.x) < 0.6 && Math.abs(pick[2] - ib.width) < 0.6 && Math.abs(pick[3] - ib.height) < 0.6, `pick ring ON the photo (${JSON.stringify(pick)})`)
ok((await page.$eval('[data-about-chip]', (e) => e.textContent).catch(() => 'none')) === 'img', 'composer chip says «img»')
ok(!!(await page.$('[data-ve-picked]')), 'bar shows the pick segment')
ok((await page.$eval('[data-ve-pick-count]', (e) => e.textContent).catch(() => '')) === '1 selection', 'bar says «1 selection»')
ok(!!(await page.$('[data-ve-tool="edit"][data-ve-ghost]')), 'the Edit tool ghosts out of reach while a pick stands')
await page.waitForTimeout(500)
const bar = await page.$eval('[data-ve-bar]', (e) => { const r = e.getBoundingClientRect(); return [r.x, r.width, r.height] })
console.log('bar with pick:', bar)
await page.screenshot({ path: OUT + 'o2-picked-img.png' })

/* hover another element while picked: two rings */
await page.mouse.move(cx, cy, { steps: 4 })
await page.waitForTimeout(150)
ok((await page.$$('.ve-sel')).length === 2, 'pick keeps its ring while another element is ringed')
await page.screenshot({ path: OUT + 'o3-two-rings.png' })

/* a click on a link picks it and does not follow */
const link = await page.$('[data-site-page] a, [data-site-page] button')
if (link) {
  const lb = await link.boundingBox()
  const lt = await link.evaluate((e) => e.tagName.toLowerCase())
  await page.mouse.click(lb.x + lb.width / 2, lb.y + lb.height / 2)
  await page.waitForTimeout(500)
  const pathNow = await page.$eval('[data-site-page]', (e) => e.getAttribute('data-site-page'))
  ok(pathNow === pathBefore, `clicking a ${lt} picks it, page stays ${pathNow}`)
  const chip = await page.$eval('[data-about-chip]', (e) => e.textContent).catch(() => 'none')
  ok(chip === lt || chip === 'svg' || chip === 'span', `chip now «${chip}»`)
}

/* Clear drops the pick, keeps the tool */
await page.click('[data-ve-pick-clear]')
await page.waitForTimeout(450)
ok(!(await page.$('[data-ve-pick]')), 'Clear drops the pick ring')
ok(!(await page.$('[data-about-chip]')), 'Clear drops the composer chip')
await page.waitForTimeout(400); ok(!!(await page.$('[data-ve-tool="edit"]:not([data-ve-ghost])')), 'Edit tool is back')
ok((await page.$eval('[data-ve-tool="select"]', (e) => e.getAttribute('aria-pressed'))) === 'true', 'select stays on after Clear')

/* leaving the site hides the pill */
await page.mouse.move(5, 450, { steps: 4 })
await page.waitForTimeout(150)
ok(!(await page.$('[data-ve-tag]')), 'pill gone when the pointer leaves the site')

/* pill near the preview's bottom-right corner stays inside */
const port = await page.$eval('[data-site-page] .scroll-area > div', (e) => { const r = e.getBoundingClientRect(); return { r: r.right, b: r.bottom, l: r.left, t: r.top } }).catch(() => null)
if (port) {
  await page.mouse.move(port.r - 6, port.b - 120, { steps: 4 })
  await page.waitForTimeout(150)
  tag = await tagOf()
  ok(!!tag && tag.x + tag.w <= port.r - 3.5, `pill clamped inside the preview at its right edge (${tag && tag.x + tag.w} ≤ ${port.r - 4})`)
}

/* human names on the console's other side */
await page.click('button[data-console]')
await page.waitForTimeout(500)
const seg = await page.$('[data-segmented="selectNames"]')
ok(!!seg, 'console carries the Select names switch')
if (seg) {
  await page.click('[data-segmented="selectNames"] button:not([data-on])')
  await page.waitForTimeout(400)
  const close = await page.$('[aria-label="Close console"]'); if (close) await close.click()
  await page.waitForTimeout(400)
  await page.mouse.move(cx, cy, { steps: 4 }); await page.waitForTimeout(150)
  tag = await tagOf()
  ok(!!tag && tag.text === 'Heading', `names mode: heading pill «${tag && tag.text}»`)
  const img2 = await page.$('[data-site-page] img'); const ib2 = await img2.boundingBox()
  await page.mouse.move(ib2.x + ib2.width / 2, ib2.y + 20, { steps: 4 }); await page.waitForTimeout(150)
  tag = await tagOf()
  ok(!!tag && tag.text === 'Photo', `names mode: photo pill «${tag && tag.text}»`)
  await page.mouse.click(ib2.x + ib2.width / 2, ib2.y + 20); await page.waitForTimeout(300)
  { const c = await page.$eval('[data-about-chip]', (e) => e.textContent).catch(() => 'none'); ok(c === 'Photo', `names mode: composer chip «${c}»`) }
}
console.log('errors:', errs.length)
console.log(fails ? `${fails} FAIL` : 'ALL PASS')
await browser.close()
