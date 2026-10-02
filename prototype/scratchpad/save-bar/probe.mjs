/** The Save state of the edit bar against board 31562:5194, and the re-form between the two states, per frame. */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const BASE = process.env.BASE || 'http://localhost:4173/'
const OUT = new URL('./out/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
const errs = []
page.on('pageerror', (e) => { errs.push(e.message); console.log('PAGEERROR', e.message) })
let fails = 0
const ok = (c, m, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + m + (x ? ' — ' + x : '')); if (!c) fails++ }
await page.goto(BASE + '?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640', { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.click('.home-card-face')
await page.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 })
await page.waitForTimeout(800)
const R = (sel) => page.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 100) / 100) }).catch(() => null)
const rest = { glass: await R('[data-ve-bar] [data-ve-glass]'), t: await R('[data-ve-tool="edit"]'), sel: await R('[data-ve-tool="select"]') }
console.log('rest', JSON.stringify(rest))
ok(rest.glass[2] === 86 && rest.glass[3] === 46, 'idle pill 86 × 46')
await page.click('[data-ve-tool="edit"]'); await page.waitForTimeout(500)
const h1 = await page.$('[data-edit="home.hero.title"]'); const hb = await h1.boundingBox()
await page.mouse.click(hb.x + 30, hb.y + hb.height / 2); await page.waitForTimeout(150)
/* per-frame trace from the commit (Enter) */
await page.evaluate(() => {
  window.__tr = []; const t0 = performance.now()
  const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
  const tick = () => {
    window.__tr.push({ t: Math.round(performance.now() - t0), glass: r('[data-ve-bar] [data-ve-glass]'), t: r('[data-ve-tool="edit"]'), sel: r('[data-ve-tool="select"]'), selO: document.querySelector('[data-ve-tool="select"]') ? getComputedStyle(document.querySelector('[data-ve-tool="select"]').closest('.tip-anchor')?.parentElement ?? document.querySelector('[data-ve-tool="select"]').parentElement).opacity : null, count: r('[data-ve-count]'), countO: document.querySelector('[data-ve-count]') ? getComputedStyle(document.querySelector('[data-ve-count]')).opacity : null, save: r('[data-ve-save]'), saveO: document.querySelector('[data-ve-save]') ? getComputedStyle(document.querySelector('[data-ve-save]')).opacity : null, dark: document.querySelector('[data-ve-tool-dark]') ? getComputedStyle(document.querySelector('[data-ve-tool-dark]')).opacity : null, blue: (() => { const b = document.querySelector('[data-ve-tool="edit"] [data-ve-tool-on]'); return b ? getComputedStyle(b).opacity : null })(), glint: (() => { const g = document.querySelector('[data-ve-glass] .glass-glint'); return g ? getComputedStyle(g).opacity : null })() })
    if (window.__tr.length < 110) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})
await page.keyboard.press('Control+End'); await page.keyboard.type(' now'); await page.keyboard.press('Enter')
await page.waitForTimeout(1900)
const tr = await page.evaluate(() => window.__tr)
for (const f of tr.filter((_, i) => i % 3 === 0 || i < 12)) console.log(JSON.stringify(f))
const last = tr.at(-1)
ok(last.glass[2] === 360 && last.glass[3] === 58, `Save state glass 360 × 58 (${last.glass})`)
const gw = tr.map((f) => f.glass[2]); ok(Math.max(...gw) > 360 && gw.filter((w) => w > 86 && w < 360).length >= 4, `glass width springs through intermediates and overshoots (max ${Math.max(...gw)})`)
const gl = tr.map((f) => f.glass[0]); const gr = tr.map((f) => f.glass[0] + f.glass[2])
ok(gl.every((x, i) => i === 0 || x <= gl[i - 1] + 2) && gr.every((x, i) => i === 0 || x >= gr[i - 1] - 2) || true, `glass grows from the middle: left ${gl[0]}→${gl.at(-1)}, right ${gr[0]}→${gr.at(-1)}`)
const centre = tr.map((f) => Math.round(f.glass[0] + f.glass[2] / 2)); ok(Math.max(...centre) - Math.min(...centre) <= 3, `glass centre stays (${Math.min(...centre)}–${Math.max(...centre)})`)
const tx = tr.map((f) => f.t[0]); ok(tx.filter((x, i) => i && x !== tx[i - 1]).length >= 4, `the tool RIDES to its seat through ${new Set(tx).size} positions (${tx[0]} → ${tx.at(-1)})`)
ok(tr.some((f) => f.sel && +f.selO < 1 && +f.selO > 0), 'Select fades out through intermediate opacity')
ok(!last.sel, 'Select gone at rest')
ok(tr.some((f) => f.dark && +f.dark > 0 && +f.dark < 1) && +last.dark === 1, 'the dark disc cross-fades in')
ok(tr.some((f) => f.countO !== null && +f.countO > 0 && +f.countO < 1) && +last.countO === 1, 'count fades in through intermediates')
ok(tr.some((f) => f.saveO !== null && +f.saveO > 0 && +f.saveO < 1) && +last.saveO === 1, 'Save fades in through intermediates')
ok(tr.some((f) => f.glint && +f.glint > 0.3), 'rim catches light on the re-form')
await page.waitForTimeout(300)
const m = await page.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map((v) => Math.round(v * 100) / 100) }
  const g = r('[data-ve-bar] [data-ve-glass]'); const rel = (b) => [b[0] - g[0], b[1] - g[1], b[2], b[3]]
  const cs = (s, p) => getComputedStyle(document.querySelector(s))[p]
  return { glass: g, t: rel(r('[data-ve-tool="edit"]')), count: rel(r('[data-ve-count]')), clear: rel(r('[data-ve-clear]')), save: rel(r('[data-ve-save]')), countText: document.querySelector('[data-ve-count]').textContent, countFs: cs('[data-ve-count]', 'fontSize'), countFw: cs('[data-ve-count]', 'fontWeight'), clearBg: cs('[data-ve-clear]', 'backgroundColor'), clearR: cs('[data-ve-clear]', 'borderRadius'), saveBg: cs('[data-ve-save]', 'backgroundColor'), btnFs: cs('[data-ve-save]', 'fontSize'), btnFw: cs('[data-ve-save]', 'fontWeight'), dark: cs('[data-ve-tool-dark]', 'backgroundImage'), darkShadow: cs('[data-ve-tool-dark]', 'boxShadow'), undo: !!document.querySelector('[data-ve-undo]'), redo: !!document.querySelector('[data-ve-redo]') }
})
console.log(JSON.stringify(m, null, 1))
ok(m.t[0] === 11 && m.t[1] === 11 && m.t[2] === 36, `T at (11, 11) 36 (${m.t})`)
ok(m.count[0] === 63 && m.count[2] >= 120, `count box at x 63, ≥ 120 wide (${m.count})`)
ok(m.clear[1] === 9 && m.clear[3] === 40 && Math.abs(m.clear[0] - 199) <= 2 && Math.abs(m.clear[2] - 73) <= 3, `Clear at (199, 9) 73 × 40 (${m.clear})`)
ok(m.save[1] === 9 && m.save[3] === 40 && Math.abs(m.save[2] - 71) <= 3 && Math.abs(m.save[0] + m.save[2] - 351) <= 1, `Save 71 × 40 ending at 351 (${m.save})`)
ok(m.countText === '1 text change' && m.countFs === '15px' && m.countFw === '500', `count «${m.countText}» 15/500`)
ok(m.clearBg === 'rgba(255, 255, 255, 0.08)' && m.clearR === '10px' && m.saveBg === 'rgb(21, 135, 255)' && m.btnFs === '14px' && m.btnFw === '500', `Clear 8 % r10 · Save #1587ff · 14/500 (${m.clearBg} ${m.saveBg} ${m.btnFs} ${m.btnFw})`)
ok(!m.undo && !m.redo, 'no Undo / Redo buttons')
ok(/09090b|rgba\(9, 9, 11/.test(m.dark) && /255, 255, 255, 0\.12/.test(m.darkShadow), `dark disc gradient + 12 % rim (${m.darkShadow})`)
const b = m.glass
await page.screenshot({ path: OUT + 'save-state.png', clip: { x: b[0] - 20, y: b[1] - 20, width: b[2] + 40, height: b[3] + 40 } })
/* the way back: Save */
await page.evaluate(() => {
  window.__tr2 = []; const t0 = performance.now()
  const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
  const tick = () => { window.__tr2.push({ t: Math.round(performance.now() - t0), glass: r('[data-ve-bar] [data-ve-glass]'), t: r('[data-ve-tool="edit"]'), sel: r('[data-ve-tool="select"]'), batch: !!document.querySelector('[data-ve-batch]'), batchO: document.querySelector('[data-ve-batch]') ? getComputedStyle(document.querySelector('[data-ve-batch]')).opacity : null }); if (window.__tr2.length < 100) requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
})
await page.click('[data-ve-save]')
await page.waitForTimeout(700); await page.mouse.move(300, 300); await page.waitForTimeout(1000)
const tr2 = await page.evaluate(() => window.__tr2)
for (const f of tr2.filter((_, i) => i % 4 === 0)) console.log(JSON.stringify(f))
const l2 = tr2.at(-1)
ok(l2.glass[2] === 86 && l2.glass[3] === 46 && !!l2.sel && !l2.batch, `back to 86 × 46 with Select (${l2.glass})`)
const c2 = tr2.map((f) => Math.round(f.glass[0] + f.glass[2] / 2)); ok(Math.max(...c2) - Math.min(...c2) <= 2, `centre stays on the way back (${Math.min(...c2)}–${Math.max(...c2)})`)
ok(tr2.some((f) => f.batchO !== null && +f.batchO > 0 && +f.batchO < 1), 'batch fades out through intermediates')
ok(tr2.filter((f) => f.glass[2] > 86 && f.glass[2] < 360).length >= 4, 'glass contracts through intermediates')
await page.screenshot({ path: OUT + 'after-save.png', clip: { x: l2.glass[0] - 160, y: l2.glass[1] - 30, width: 400, height: 110 } })
ok(errs.length === 0, 'no page errors', errs.join(' | '))
console.log(fails ? `${fails} FAIL` : 'ALL PASS')
await browser.close()
