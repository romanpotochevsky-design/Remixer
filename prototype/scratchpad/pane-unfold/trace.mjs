/* THE PANE UNFOLDS FROM ITS BUTTON — film both directions of the site ⇄ Cloud hand-over and print
   what moved when: the pane's clip (parsed inset), opacity, scale; the site's opacity and scale;
   the glint; the rows' cascade; frame intervals. Run against dev (5174) or preview (4173): BASE. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:5174'
const tag = process.argv[2] || 'x'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(`${BASE}${BASE.endsWith('.html') ? '?' : '/?'}p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(800); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(700)

const film = (ms) => p.evaluate(async (ms) => {
  const inset = (el) => {
    const c = getComputedStyle(el).clipPath
    const m = c.match(/inset\(([^)]*)\)/); if (!m) return null
    const nums = m[1].split('round')[0].trim().split(/\s+/).map(parseFloat)
    return nums.length === 4 ? nums : (nums.length === 1 ? [nums[0], nums[0], nums[0], nums[0]] : nums)
  }
  const scaleOf = (el) => { const m = getComputedStyle(el).transform; if (!m || m === 'none') return 1; const a = m.match(/matrix\(([^)]+)\)/); return a ? +(+a[1].split(',')[0]).toFixed(4) : 1 }
  const samples = []; const t0 = performance.now(); let last = t0
  const tick = () => {
    const now = performance.now()
    const pane = document.querySelector('[data-canvas-pane]')
    const site = document.querySelector('[data-canvas-site]')
    const glint = pane?.querySelector('.glass-glint')
    const rows = [...document.querySelectorAll('[data-cloud-row]')].map((r) => +(+getComputedStyle(r).opacity).toFixed(2))
    const menu = document.querySelector('[data-cloud-menu]')
    samples.push({
      t: Math.round(now - t0), dt: Math.round(now - last),
      pane: pane ? +(+getComputedStyle(pane).opacity).toFixed(2) : null, paneS: pane ? scaleOf(pane) : null, clip: pane ? inset(pane) : null,
      site: site ? +(+getComputedStyle(site).opacity).toFixed(2) : null, siteS: site ? scaleOf(site) : null,
      glint: glint ? +(+getComputedStyle(glint).opacity).toFixed(2) : null,
      rows: rows.length ? rows : null, menu: menu ? +(+getComputedStyle(menu).opacity).toFixed(2) : null,
      fresh: pane ? pane.hasAttribute('data-pane-fresh') : null,
    })
    last = now
    if (now - t0 < ms) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  await new Promise((r) => setTimeout(r, ms + 60))
  return samples
}, ms)

const summarize = (label, s) => {
  const key = (x) => JSON.stringify([x.pane, x.paneS, x.clip?.map((v) => Math.round(v)), x.site, x.siteS, x.glint, x.menu, x.rows?.[0], x.rows?.[x.rows.length - 1]])
  const kf = s.filter((x, i) => i === 0 || key(x) !== key(s[i - 1]))
  const worst = Math.max(...s.slice(1).map((x) => x.dt))
  console.log(`\n== ${label} (${tag}) frames=${s.length} worst dt=${worst}ms`)
  for (const x of kf) console.log([x.t, 'pane', x.pane, x.paneS, x.clip ? x.clip.map((v) => Math.round(v)).join('/') : '-', 'site', x.site, x.siteS, 'glint', x.glint, 'menu', x.menu, 'rows', x.rows ? `${x.rows[0]}…${x.rows[x.rows.length - 1]}` : '-', x.fresh ? 'fresh' : ''].join(' '))
}

/* OPEN: press the rail's Cloud button and film */
const btn = await p.$('nav.arrive-rail [aria-label="Cloud"]')
const bb = await btn.boundingBox()
const open = p.evaluate(() => { document.querySelector('nav.arrive-rail [aria-label="Cloud"]').click() })
const [, so] = await Promise.all([open, film(1500)])
summarize('OPEN site → Cloud', so)
console.log('button box', JSON.stringify(bb), 'pane custom clip at t0:', JSON.stringify(so[0].clip))
await p.screenshot({ path: `open-rest-${tag}.png` })

/* CLOSE: Escape and film */
const close = p.keyboard.press('Escape')
const [, sc] = await Promise.all([close, film(1300)])
summarize('CLOSE Cloud → site', sc)
await b.close()
