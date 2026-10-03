import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } })
const p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message))
const BASE = 'http://localhost:4173/'; const at = (q) => BASE + '?' + q
const results = []; const check = (n, ok, d = '') => { results.push([n, ok]); console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : '  ' + d)) }
const shot = (n) => p.screenshot({ path: 'scratchpad/rail-drawer/' + n + '.png' })
{
  const KEY = 'remixer-prototype/world/v6'
  const LIVE = 'p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'
  const media = () => p.evaluate((k) => (JSON.parse(localStorage.getItem(k) || '{}').media || []).length, KEY)
  const panel = () => p.$('[data-media-panel]').then(Boolean)
  const countText = () => p.$eval('[data-media-count]', (e) => e.textContent).catch(() => null)
  await p.goto(at(LIVE), { waitUntil: 'networkidle' })
  await p.evaluate((k) => localStorage.removeItem(k), KEY)
  await p.waitForTimeout(600); await p.click('.home-card-face')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(600)

  /* ── 1 · the rail button and the panel ─────────────────────────────────────────── */
  check('the rail has a fifth button, Website media, and it opens the panel', !!(await p.$('[data-rail-media]')) && !(await panel()))
  await p.click('[data-rail-media]'); await p.waitForTimeout(900)
  const geo = await p.evaluate(() => {
    const el = document.querySelector('[data-media-panel]'); if (!el) return null
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); const rail = document.querySelector('[data-rail-media]')
    return { w: r.width, right: innerWidth - r.right, top: r.top, bottom: innerHeight - r.bottom, bg: cs.backgroundColor, radius: cs.borderRadius, mode: el.dataset.mediaPanel,
      title: document.querySelector('[data-media-title]')?.textContent, tab: document.querySelector('[data-media-tab="image"]')?.getAttribute('aria-selected'),
      tiles: document.querySelectorAll('[data-media-tile]').length, railOn: rail?.getAttribute('aria-pressed'), railBg: getComputedStyle(rail).backgroundColor }
  })
  /* 03.10.2026: at 1600 there is room, so the library DOCKS beside the preview (block S has both forms) */
  check('the panel stands 480 wide as a room beside the preview — flush to the rail, under the top bar, 2 from the bottom — Gray/850 r16, «Website media», Image tab, the site’s ten pictures',
    geo && geo.w === 480 && geo.right === 56 && geo.top === 52 && geo.bottom === 2 && geo.bg === 'rgb(31, 31, 34)' && geo.radius === '16px' && geo.mode === 'manage' && geo.title === 'Website media' && geo.tab === 'true' && geo.tiles === 10, JSON.stringify(geo))
  check('the rail button is pressed and wears its tile while the panel is up', geo && geo.railOn === 'true' && geo.railBg !== 'rgba(0, 0, 0, 0)', JSON.stringify({ on: geo?.railOn, bg: geo?.railBg }))
  await shot('P1-media-open')

}
/* ═══════════════════════════════════════════════════════════════════════════════════════════
 * S · THE RAIL DRAWER — Website media and Integrations open as a ROOM beside the preview, or as
 *     glass over it when there is no room (designer 03.10.2026, with the live editor's recording:
 *     «галерея и Integrations должны открываться вот так как на видео… но если места не хватает…
 *     поверх вебсайт превью с тенью»). ui/drawer.ts, ui/RailDrawer.tsx.
 *
 * WHAT THIS BLOCK GUARDS:
 *  · DOCKED (1600): the canvas's right margin travels 0 → 488 through frames, never past it (no
 *    re-flow overshoot); the panel's clip opens from the rail edge with it; the panel lands flush to
 *    the rail, the preview's right edge 8 px from it; the Integrations copy is the live product's.
 *  · HANDOFF: Integrations → media while docked — the gutter does not move, the new room reveals
 *    over the old one, one drawer left.
 *  · CLOSE: the margin goes back to 0 through frames and the drawer is gone only after it.
 *  · FLOATING (1280): no margin at all, the drawer stands over the preview 8 from the rail with a
 *    deep shadow; an outside press closes it.
 *  · The chevron hands the ask to the composer — in the field, focused, not sent, no credits.
 * ═══════════════════════════════════════════════════════════════════════════════════════════ */
{
  const LIVE = 'p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'
  const film = (fn, ms) => p.evaluate(([src, ms]) => new Promise((res) => {
    const f = new Function('return (' + src + ')()'); const out = []; const t0 = performance.now()
    const tick = () => { const t = performance.now() - t0; out.push({ t: Math.round(t), ...f() }); if (t < ms) requestAnimationFrame(tick); else res(out) }
    requestAnimationFrame(tick)
  }), [fn.toString(), ms])
  const read = () => {
    const m = document.querySelector('[data-canvas-main]'); const d = document.querySelectorAll('[data-rail-drawer]')
    const c = d[d.length - 1]?.style.clipPath || ''
    return { mr: m ? Math.round(parseFloat(getComputedStyle(m).marginRight)) : -1, n: d.length, form: d[d.length - 1]?.getAttribute('data-rail-drawer') ?? null, clip: +(c.match(/([\d.]+)%/)?.[1] ?? -1) }
  }
  await p.goto(at(LIVE), { waitUntil: 'networkidle' })
  await p.waitForTimeout(600); await p.click('.home-card-face')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(800)

  check('the rail’s Integrations button is live now (it opens a drawer)', !!(await p.$('[data-rail-integrations]')))
  await p.click('[data-rail-integrations]')
  const open = await film(read, 900)
  const mrs = open.map((f) => f.mr)
  check('DOCKED at 1600: the preview gives way 0 → 488 through ≥ 8 distinct frames and never past it', new Set(mrs).size >= 8 && Math.max(...mrs) === 488 && mrs.at(-1) === 488 && open.every((f) => f.form === 'docked'), mrs.join(' '))
  const clips = open.filter((f) => f.clip >= 0).map((f) => f.clip)
  check('…and the panel’s clip opens from the rail edge with it, 100 % → 0 monotonically', clips.length >= 8 && clips[0] > 60 && clips.at(-1) === 0 && clips.every((c, i) => i === 0 || c <= clips[i - 1] + 0.01), clips.map((c) => Math.round(c)).join(' '))
  const g = await p.evaluate(() => {
    const d = document.querySelector('[data-integrations-panel]').getBoundingClientRect(); const st = document.querySelector('[data-canvas-main]').getBoundingClientRect()
    return { w: Math.round(d.width), right: Math.round(innerWidth - d.right), top: Math.round(d.top), gap: Math.round(d.left - st.right), rows: [...document.querySelectorAll('[data-integration]')].map((r) => r.innerText.replace(/\s+/g, ' ').trim()), on: document.querySelector('[data-rail-integrations]').getAttribute('aria-pressed') }
  })
  check('…it lands 480 wide, flush to the rail, under the top bar, 8 from the preview; the rail button is pressed',
    g.w === 480 && g.right === 56 && g.top === 52 && g.gap === 8 && g.on === 'true', JSON.stringify(g))
  check('the rows carry the live product’s copy — Stripe and Shippo',
    g.rows.length === 2 && /^Stripe Payments, subscriptions, checkout, plus sign-ups, logins, and backend features\.$/.test(g.rows[0]) && /^Shippo Shipping rates, labels, tracking, plus sign-ups, logins, and backend features\.$/.test(g.rows[1]), JSON.stringify(g.rows))
  await shot('S1-integrations-docked')

  const credits = await p.evaluate(() => JSON.parse(localStorage.getItem('remixer-prototype/world/v6') || '{}').credits)
  await p.click('[data-integration-go="stripe"]'); await p.waitForTimeout(300)
  const seed = await p.evaluate(() => ({ v: document.querySelector('textarea')?.value, focus: document.activeElement?.tagName, credits: JSON.parse(localStorage.getItem('remixer-prototype/world/v6') || '{}').credits, panel: !!document.querySelector('[data-integrations-panel]') }))
  check('the chevron puts the ask in the composer — focused, not sent, nothing spent — and the room stays', seed.v === 'Connect Stripe so people can pay on my site' && seed.focus === 'TEXTAREA' && seed.credits === credits && seed.panel, JSON.stringify(seed))
  await p.evaluate(() => { const t = document.querySelector('textarea'); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(t, ''); t.dispatchEvent(new Event('input', { bubbles: true })) })

  await p.click('[data-rail-media]')
  const swap = await film(read, 700)
  check('HANDOFF to the library: the gutter stands at 488 on every frame, two rooms overlap only while the new one reveals, then one',
    swap.every((f) => f.mr === 488) && swap.some((f) => f.n === 2) && swap.at(-1).n === 1 && !!(await p.$('[data-media-panel]')) && !(await p.$('[data-integrations-panel]')), swap.map((f) => `${f.mr}/${f.n}`).join(' '))
  await p.click('[data-media-close]')
  const close = await film(read, 800)
  const cm = close.map((f) => f.mr)
  const goneAt = close.findIndex((f) => f.n === 0)
  check('CLOSE: the preview takes its width back 488 → 0 through frames, and the drawer leaves only once the edge is home',
    new Set(cm).size >= 6 && cm.at(-1) === 0 && goneAt > 0 && close[goneAt].mr <= 2, cm.join(' '))

  await p.setViewportSize({ width: 1280, height: 860 }); await p.waitForTimeout(500)
  await p.click('[data-rail-integrations]')
  const fl = await film(read, 600)
  const fg = await p.evaluate(() => { const d = document.querySelector('[data-integrations-panel]'); const r = d.getBoundingClientRect(); return { form: d.dataset.railDrawer, right: Math.round(innerWidth - r.right), top: Math.round(r.top), shadow: getComputedStyle(d).boxShadow } })
  check('FLOATING at 1280 (no room for 600 of preview beside it): the preview never moves, the drawer stands over it 8 from the rail with a deep shadow',
    fl.every((f) => f.mr === 0) && fg.form === 'floating' && fg.right === 64 && fg.top === 60 && /72px/.test(fg.shadow), JSON.stringify({ mr: [...new Set(fl.map((f) => f.mr))], fg }))
  await shot('S2-integrations-floating')
  await p.mouse.click(500, 500); await p.waitForTimeout(500)
  check('…and a press outside closes the floating form', !(await p.$('[data-integrations-panel]')))
  await p.setViewportSize({ width: 1600, height: 900 }); await p.waitForTimeout(400)
}

console.log(errors); await b.close()
