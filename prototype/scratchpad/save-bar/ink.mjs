/** Where the INK of «1 text change» and of «Clear» sits against the bar's centre, per font and per line-box recipe.
 *  The designer has Proxima Nova installed (system font); colleagues get the embedded Figtree. */
import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import { readFileSync } from 'node:fs'
const probeFonts = { 'Cap55 (cap-height field too small)': readFileSync(new URL('./figtree-cap55.woff2', import.meta.url)).toString('base64'), 'Cap125 (cap-height field too big)': readFileSync(new URL('./figtree-cap125.woff2', import.meta.url)).toString('base64') }
const BASE = process.env.BASE || 'http://localhost:4173/'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
await page.goto(BASE + '?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await page.waitForTimeout(700); await page.click('.home-card-face')
await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await page.waitForTimeout(800)
await page.click('[data-ve-tool="edit"]'); await page.waitForTimeout(400)
const hb = await (await page.$('[data-edit="home.hero.title"]')).boundingBox()
await page.mouse.click(hb.x + 30, hb.y + hb.height / 2); await page.waitForTimeout(100)
await page.keyboard.press('Control+End'); await page.keyboard.type(' now'); await page.keyboard.press('Enter')
await page.mouse.move(200, 200); await page.waitForTimeout(1500)
const inkRows = (png, x0, x1, y0, y1) => { let top = -1, bot = -1; for (let y = y0; y < y1; y++) { let hit = false; for (let x = x0; x < x1; x++) { const i = (y * png.width + x) * 4; if (png.data[i] > 200 && png.data[i + 1] > 200 && png.data[i + 2] > 200) { hit = true; break } } if (hit) { if (top < 0) top = y; bot = y } } return [top, bot] }
await page.evaluate((fonts) => { const st = document.createElement('style'); st.textContent = Object.entries(fonts).map(([n, b]) => `@font-face { font-family: '${n}'; src: url(data:font/woff2;base64,${b}) format('woff2'); font-weight: 100 900; }`).join('\n'); document.head.appendChild(st) }, probeFonts)
await page.evaluate(() => document.fonts.ready)
for (const font of [null, 'Cap55 (cap-height field too small)', 'Cap125 (cap-height field too big)']) for (const recipe of ['trim', 'normal']) {
  await page.evaluate(({ font, recipe }) => {
    let s = document.getElementById('__probe'); if (!s) { s = document.createElement('style'); s.id = '__probe'; document.head.appendChild(s) }
    s.textContent = (font ? `[data-ve-bar] * { font-family: '${font}' !important; }` : '') + (recipe === 'trim' ? `[data-ve-count] { text-box-trim: trim-both !important; text-box-edge: cap alphabetic !important; line-height: 1 !important; }` : '')
  }, { font, recipe })
  await page.waitForTimeout(150); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(150)
  const r = await page.evaluate(() => { const ce = document.querySelector('[data-ve-count]'); window.__trim = getComputedStyle(ce).textBoxTrim + '/' + getComputedStyle(ce).lineHeight + '/' + Math.round(ce.getBoundingClientRect().height*10)/10; const b = (s) => { const e = document.querySelector(s).getBoundingClientRect(); return [e.x, e.y, e.width, e.height] }; return { g: b('[data-ve-bar] [data-ve-glass]'), c: b('[data-ve-count]'), k: b('[data-ve-clear]') } })
  const buf = await page.screenshot({ clip: { x: r.g[0], y: r.g[1], width: r.g[2], height: r.g[3] } })
  const png = PNG.sync.read(buf); const s = 2
  const cx0 = Math.round((r.c[0] - r.g[0]) * s), cx1 = Math.round((r.c[0] - r.g[0] + 7) * s)
  const kx0 = Math.round((r.k[0] - r.g[0] + 20) * s), kx1 = Math.round((r.k[0] - r.g[0] + 29) * s)
  const [ct, cb] = inkRows(png, cx0, cx1, 4, png.height - 4), [kt, kb] = inkRows(png, kx0, kx1, 22, png.height - 22)
  const mid = png.height / 2
  console.log(await page.evaluate(() => window.__trim)); console.log(`${(font || 'Figtree (embedded)').padEnd(36)} ${recipe.padEnd(6)} «1» ink ${ct}–${cb} centre ${((ct + cb) / 2 - mid).toFixed(1)} dpx · «C» ink ${kt}–${kb} centre ${((kt + kb) / 2 - mid).toFixed(1)} dpx`)
}
await browser.close()
