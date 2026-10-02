/**
 * Block O of scripts/check-brief-flow.mjs — THE VISUAL EDITOR — standing alone, for a quick rerun
 * (~40 s) without the suite's other ~6 minutes. The body between the BLOCK-O markers is the same
 * text as the block in the harness; keep them in step (the block was spliced from here).
 *
 *   cd prototype && npm run build && (npx vite preview --port 4173 &)
 *   CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scratchpad/visual-editor/block-o.mjs
 */
import fs from 'node:fs'

let chromium
try { ({ chromium } = await import('playwright')) }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')) }

const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = process.env.OUT || '/tmp/check-brief'
fs.mkdirSync(OUT, { recursive: true })

const NEW_PROJECT = 'p=empty&h=empty&a=trial&t=1&c=2000&i=none'
const at = (q = NEW_PROJECT) => `${BASE}${BASE.includes('?') ? '&' : '?'}${q}`

const results = []
const check = (name, ok, extra = '') => {
  results.push([name, ok])
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`)
}

const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } })
const p = await ctx.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(e.message))

const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png` })
const siteUp = () => p.$('.site-stage h1').then(Boolean)

/* BLOCK-O-BEGIN */
/* ═══════════════════════════════════════════════════════════════════════════════════
 * O · THE VISUAL EDITOR — the glass bar at the canvas's foot (board 31280:115372) and the Image
 *     panel beside a photo (the designer's own sketch, 31384:21963)
 *
 * Designer, 30.09.2026: «делаем Visual Editor мод так же как у lovable.dev… инструменты для
 * редактирования сайта (бесплатно, не через чат) находятся в такой панели внизу превью… с нашим
 * крутым apple liquid glass дизайном»; «кнопка с иконкой "T" — она и включает режим Visual Editor,
 * которая позволяет текст менять и фото»; «[вторая] это инструмент select — нажать на что-то и
 * задать контекст чату»; «мы хотим оставить Undo/Redo функции и встроить их в ту панель где кнопка
 * Save… кнопки очистить правки или Save чтобы применить изменения все». modules/editor: session.ts
 * (the STAGED draft with its past / future; Save the one writer to `World.siteEdits`), EditBar.tsx,
 * EditableText.tsx, EditOverlay.tsx, ImagePanel.tsx; the keys in modules/preview/content.ts.
 *
 * WHAT THIS BLOCK GUARDS is the MODEL, not the motion — the things a restyle must not bend and a
 * film would only blur (the suite already carries two known flappers under load, so: state and
 * geometry, no frame counts):
 *  · THE TWO LANES. Manual edits are the one free path in the product («manual edits, hosting, and
 *    publishing never use credits» — the KB, confirmed by the designer 13.09.2026): a Save moves
 *    `unpublished` by ONE and nothing else, while the Select tool's message goes down the chat's
 *    paid lane and costs the chat's COST. Both are read off the stored world, the way block N reads
 *    the balance, so a refactor that quietly routed Save through `sendMessage` shows up as a number.
 *  · THE STAGING. Nothing reaches the world before Save — the bar counts, the site shows, the store
 *    is not written; Undo walks the batch back and leaves Redo standing; a reload after Save keeps
 *    the words (world.ts, the own-snapshot rule: «a reload of our own page is not a shared link»),
 *    and the session — tool, draft, history — dies with the page, which is what «unsaved» means.
 *  · WHERE THE BAR IS NOT. Only where there is a live site to edit: not through the brief, not on a
 *    drawn demo site, not while the sites shelf has the canvas, not in the staging view — absent, not
 *    dead (the rail's rule) — and the toolbar's old «Visual Editor» pill is gone with board 31379:2968.
 * ═══════════════════════════════════════════════════════════════════════════════════ */
{
  const KEY = 'remixer-prototype/world/v6'
  const LIVE = 'p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'
  const ORIGINAL = 'Chef-made meals with exact macros'
  const TYPED = ' — fresh'
  const ACTION = 'rgb(21, 135, 255)'
  /* the stored world, the fields this block reads. `credits` / `unpublished` fall back to the URL's
     own 640 / 0 while the store is empty — the block clears it before entering, so that "nothing
     reached the world" can be read as "nothing was written" rather than as a stale number. */
  const world = () => p.evaluate((k) => {
    const raw = localStorage.getItem(k)
    const w = JSON.parse(raw || '{}')
    const e = w.siteEdits ?? { text: {}, photo: {}, fit: {}, opacity: {}, height: {} }
    return {
      raw, credits: w.credits ?? 640, unpublished: w.unpublished ?? 0, site: w.site, project: w.project, chat: w.chat,
      sent: (w.sent || []).map((m) => ({ who: m.who, about: m.about, kind: m.kind })), versions: (w.versions || []).map((v) => ({ kind: v.kind, cost: v.cost })), siteEdits: e, search: location.search,
      /* how many edits each OTHER site's stashed slice carries — the leak SITE_AXES exists to prevent */
      stash: Object.fromEntries(Object.entries(w.stash || {}).map(([id, s]) => [id, s.siteEdits ? Object.keys(s.siteEdits.text || {}).length + Object.keys(s.siteEdits.photo || {}).length + Object.keys(s.siteEdits.fit || {}).length : 0])),
    }
  }, KEY)
  const bar = () => p.$('[data-ve-bar]').then(Boolean)
  const pressed = (tool) => p.$eval(`[data-ve-tool="${tool}"]`, (e) => e.getAttribute('aria-pressed')).catch(() => null)
  const count = () => p.$eval('[data-ve-count]', (e) => e.textContent).catch(() => null)
  /* the canvas instance's title — not a miniature's (the shelf and the Home dock draw the same page again) */
  const canvasTitle = () => p.$eval('[data-canvas-site] [data-site-page="/"] h1', (e) => e.textContent).catch(() => null)
  const fitOfPhoto = () => p.$eval('[data-canvas-site] [data-site-page="/"] .site-grid img, [data-canvas-site] [data-site-page="/"] img', (e) => getComputedStyle(e).objectFit).catch(() => null)
  const enter = async (q, card = '.home-card-face') => {
    await p.goto(at(q), { waitUntil: 'networkidle' }); await p.waitForTimeout(700)
    await p.click(card)
    await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(600)
  }

  /* ── 1 · where the bar is NOT ───────────────────────────────────────────────────── */
  /* through the brief: the thin prompt of block A opens the builder with no site behind it */
  await p.goto(at(), { waitUntil: 'networkidle' }); await p.waitForTimeout(700)
  await p.fill('input[aria-label="Describe the site you want"]', 'website')
  await p.click('button:has-text("Build")')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 10000 }); await p.waitForTimeout(1500)
  const brief = { bar: await bar(), site: await siteUp(), project: (await world()).project, hosts: await p.$$eval('[data-edit],[data-pick]', (els) => els.length) }
  check('no edit bar before a site exists: the builder opened by a thin prompt (Remixer asking) has no bar and no editable host',
    !brief.bar && !brief.site && brief.project !== 'built' && brief.hosts === 0, JSON.stringify(brief))

  /* a DRAWN demo site: the dock's second card, synco.com — its picture is a drawing (`thumb` ≠ live) */
  await enter(LIVE, 'button[aria-label="Open synco.com"]')
  const drawn = { bar: await bar(), name: await p.$eval('[data-site-name]', (e) => e.textContent).catch(() => null), site: (await world()).site, toolbar: !!(await p.$('[data-canvas-toolbar]')), h1: !!(await p.$('[data-canvas-site] h1')) }
  check('…and none on a drawn demo site (synco.com — a drawing has nothing editable): the builder stands in it, toolbar up, no bar',
    !drawn.bar && drawn.name === 'synco.com' && drawn.site === 'synco' && drawn.toolbar, JSON.stringify(drawn))

  /* the staging view (Root.tsx `?view=site` — the toolbar's «open in new tab»): the bare site, no chrome */
  await p.goto(at(`${LIVE}&view=site&path=/`), { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
  const staging = { view: !!(await p.$('[data-site-view]')), bar: await bar(), toolbar: !!(await p.$('[data-canvas-toolbar]')), hosts: await p.$$eval('[data-edit],[data-pick]', (els) => els.length), h1: await p.$eval('[data-site-view] h1', (e) => e.textContent).catch(() => null) }
  check('…nor in the staging view (`?view=site`): the bare site with its title, no toolbar, no bar, no editable host',
    staging.view && !staging.bar && !staging.toolbar && staging.hosts === 0 && staging.h1 === ORIGINAL, JSON.stringify(staging))

  /* ── 2 · the bar at rest, on the live site ─────────────────────────────────────── */
  /* a cleared store: entering fit-ration from the dock writes nothing (the site is already the world's),
     so the first world write of this block has to be the editor's Save — and a stale synco snapshot
     from the step above would otherwise pose as "the world" */
  await p.evaluate(() => localStorage.clear())
  await enter(LIVE)
  await p.waitForFunction(() => { const el = document.querySelector('[data-ve-bar]'); return !!el && getComputedStyle(el).transform === 'none' && getComputedStyle(el).opacity === '1' }, null, { timeout: 4000 }).catch(() => {})
  const rest = await p.evaluate(() => {
    const el = document.querySelector('[data-ve-bar]'); const main = document.querySelector('main')
    if (!el || !main) return null
    const r = el.getBoundingClientRect(), m = main.getBoundingClientRect(), cs = getComputedStyle(el.querySelector('[data-ve-glass]') || el)
    const tools = [...el.querySelectorAll('[data-ve-tool]')].map((t) => { const q = t.getBoundingClientRect(); return { tool: t.dataset.veTool, x: +q.x.toFixed(2), w: +q.width.toFixed(2), h: +q.height.toFixed(2), pressed: t.getAttribute('aria-pressed'), glyph: !!t.querySelector('svg'), disc: !!t.querySelector('span[aria-hidden]') } })
    return {
      inMain: main.contains(el), centreOff: +((r.x + r.width / 2) - (m.x + m.width / 2)).toFixed(2), lift: +(m.bottom - r.bottom).toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2),
      tools, gap: tools.length === 2 ? +(tools[1].x - (tools[0].x + tools[0].w)).toFixed(2) : null,
      glass: !!el.querySelector('.liquid-glass'), glint: !!el.querySelector('.glass-glint'), radius: cs.borderRadius, shadow: cs.boxShadow, pointer: getComputedStyle(el).pointerEvents, hostPointer: getComputedStyle(el.closest('[data-ve-bar-host]')).pointerEvents,
      batch: !!document.querySelector('[data-ve-batch]'), dirty: el.hasAttribute('data-ve-dirty'),
      toolbarText: document.querySelector('[data-canvas-toolbar]')?.innerText ?? '', editing: document.querySelector('[data-site-editing]')?.getAttribute('data-site-editing') ?? null,
    }
  })
  check('the bar stands where the board puts it: centred on the canvas column, its bottom edge 29 above the canvas’s, 46 tall (1 + 4 + 36 + 4 + 1, board 31442:44737) — two 36 × 36 tools 4 apart, neither pressed, no batch segment',
    !!rest && rest.inMain && Math.abs(rest.centreOff) <= 1 && rest.lift === 29 && rest.h === 46 && rest.tools.length === 2 && rest.tools.map((t) => t.tool).join() === 'edit,select'
      && rest.tools.every((t) => t.w === 36 && t.h === 36 && t.pressed === 'false' && t.glyph && !t.disc) && rest.gap === 4 && !rest.batch && !rest.dirty && rest.editing === null,
    JSON.stringify(rest && { centreOff: rest.centreOff, lift: rest.lift, w: rest.w, h: rest.h, tools: rest.tools, gap: rest.gap, batch: rest.batch }))
  check('…in the house glass: `liquid-glass` with its glint, r16, the board’s 0 8 32 at 33 %, taking the pointer inside a pointer-blind host',
    !!rest && rest.glass && rest.glint && rest.radius === '16px' && /rgba\(0, 0, 0, 0\.33\) 0px 8px 32px/.test(rest.shadow) && rest.pointer === 'auto' && rest.hostPointer === 'none',
    JSON.stringify(rest && { glass: rest.glass, glint: rest.glint, radius: rest.radius, shadow: rest.shadow, pointer: rest.pointer, hostPointer: rest.hostPointer }))
  check('the old «Visual Editor» pill is gone from the toolbar (board 31379:2968 — the mode lives in the bar now)',
    !!rest && !/Visual Editor/.test(rest.toolbarText) && rest.toolbarText.length > 0, JSON.stringify(rest?.toolbarText))
  await shot('O1-bar-rest')

  /* ── 3 · the Edit tool on ──────────────────────────────────────────────────────── */
  await p.click('[data-ve-tool="edit"]'); await p.waitForTimeout(120)
  /* the reveal rings exist only for ~0.9 s + 40 ms a target — read at once, before the disc's spring is judged */
  const reveal = await p.$$eval('.ve-ring--reveal', (r) => r.length)
  await p.waitForTimeout(450)
  const on = await p.evaluate(() => {
    const btn = document.querySelector('[data-ve-tool="edit"]'); const disc = btn.querySelector('span[aria-hidden]')
    const title = document.querySelector('[data-edit="home.hero.title"]')
    return {
      pressed: btn.getAttribute('aria-pressed'), disc: disc ? getComputedStyle(disc).backgroundColor : null, discRadius: disc ? getComputedStyle(disc).borderRadius : null,
      editing: document.querySelector('[data-site-editing]')?.getAttribute('data-site-editing'), texts: document.querySelectorAll('[data-edit-kind="text"]').length, photos: document.querySelectorAll('[data-edit-kind="photo"]').length,
      picks: document.querySelectorAll('[data-pick]').length, ce: title?.getAttribute('contenteditable'), role: title?.getAttribute('role'), tag: title?.tagName, text: title?.textContent,
      overlay: !!document.querySelector('[data-ve-overlay]'), selectUp: !!document.querySelector('[data-ve-tool="select"]'), batch: !!document.querySelector('[data-ve-batch]'),
    }
  })
  check('pressing the T turns the mode on: aria-pressed, a blue (`--action`) r8 disc under the glyph, `data-site-editing="edit"` on the canvas, and every text run of the home page a `plaintext-only` host — the h1 among them — every photo a photo host',
    on.pressed === 'true' && on.disc === ACTION && on.discRadius === '12px' && on.editing === 'edit' && on.texts >= 20 && on.photos >= 6 && on.picks === 0
      && on.ce === 'plaintext-only' && on.role === 'textbox' && on.tag === 'H1' && on.text === ORIGINAL && on.overlay && on.selectUp && !on.batch,
    JSON.stringify(on))
  check('…and the REVEAL rings every target once on entry (≥ 20 `.ve-ring--reveal` right after the press)', reveal >= 20, `${reveal} rings`)
  await shot('O2-mode-on')
  const title = await p.$('[data-edit="home.hero.title"]')
  await title.hover(); await p.waitForTimeout(160)
  const hover = await p.evaluate(() => {
    const ring = document.querySelector('.ve-ring--hover'); const t = document.querySelector('[data-edit="home.hero.title"]')
    if (!ring || !t) return { ring: !!ring }
    const r = ring.getBoundingClientRect(), q = t.getBoundingClientRect()
    return { ring: true, op: getComputedStyle(ring).opacity, dl: +(q.left - r.left).toFixed(1), dt: +(q.top - r.top).toFixed(1), dr: +(r.right - q.right).toFixed(1), db: +(r.bottom - q.bottom).toFixed(1), shadow: getComputedStyle(ring).boxShadow, cursor: getComputedStyle(t).cursor, caret: getComputedStyle(t).caretColor }
  })
  check('hovering the title rings it — the ring 4 outside the text’s own box on every side (a heading’s leading is tight), one blue, the host wearing a text cursor and a blue caret',
    hover.ring && hover.op === '1' && [hover.dl, hover.dt, hover.dr, hover.db].every((d) => d === 4) && /rgba\(21, 135, 255/.test(hover.shadow) && hover.cursor === 'text' && hover.caret === ACTION,
    JSON.stringify(hover))

  /* ── 4 · an edit stages; nothing reaches the world ─────────────────────────────── */
  const storeBefore = (await world()).raw
  await title.click(); await p.waitForTimeout(80)
  const caretIn = await p.evaluate(() => document.activeElement?.getAttribute('data-edit'))
  /* Control+End, not End: the h1 is balanced across lines, and End stops at the end of the visual
     line the caret landed on — the text would be spliced mid-sentence */
  await p.keyboard.press('Control+End'); await p.keyboard.type(TYPED); await p.keyboard.press('Enter'); await p.waitForTimeout(400)
  const edited = await p.evaluate(() => ({
    active: document.activeElement?.getAttribute('data-edit') ?? document.activeElement?.tagName, count: document.querySelector('[data-ve-count]')?.textContent ?? null, batch: !!document.querySelector('[data-ve-batch]'),
    save: document.querySelector('[data-ve-save]')?.disabled, undo: !!document.querySelector('[data-ve-undo]'), redo: !!document.querySelector('[data-ve-redo]'), clear: !!document.querySelector('[data-ve-clear]'),
    dirty: document.querySelector('[data-ve-bar]')?.hasAttribute('data-ve-dirty'), selectUp: !!document.querySelector('[data-ve-tool="select"]'), pressed: document.querySelector('[data-ve-tool="edit"]')?.getAttribute('aria-pressed'),
    dark: !!document.querySelector('[data-ve-tool-dark]'), blue: !!document.querySelector('[data-ve-tool="edit"] [data-ve-tool-on]'),
  }))
  const w4 = await world()
  check('a click puts the caret in the title; typing at its end and Enter commits: the h1 reads the new words, the bar re-forms into its SAVE STATE (board 31562:5194) — «1 text change», Clear, Save live, NO Undo / Redo (hidden 02.10.2026 at the developers\' request) — the Select tool gone while a batch is pending, the Edit tool still pressed and on the board\'s DARK disc, not the blue one',
    caretIn === 'home.hero.title' && (await canvasTitle()) === ORIGINAL + TYPED && edited.active !== 'home.hero.title' && edited.count === '1 text change' && edited.batch && edited.save === false && !edited.undo && !edited.redo && edited.clear && edited.dirty && !edited.selectUp && edited.pressed === 'true' && edited.dark && !edited.blue,
    JSON.stringify({ caretIn, title: await canvasTitle(), ...edited }))
  check('…and NOTHING has reached the world: the store is byte-for-byte what it was before the click — credits 640, unpublished 0, no saved edit',
    w4.raw === storeBefore && w4.credits === 640 && w4.unpublished === 0 && Object.keys(w4.siteEdits.text).length === 0,
    JSON.stringify({ storeUnchanged: w4.raw === storeBefore, credits: w4.credits, unpublished: w4.unpublished, text: w4.siteEdits.text }))
  await shot('O3-dirty')

  /* ── 5 · the Save state against the board, 1:1 (31562:5194) ──────────────────── */
  await p.waitForTimeout(700)
  const board = await p.evaluate(() => {
    const r = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map((v) => Math.round(v * 100) / 100) }
    const g = r('[data-ve-bar] [data-ve-glass]'); const rel = (b) => [b[0] - g[0], b[1] - g[1], b[2], b[3]]
    const cs = (s, k) => getComputedStyle(document.querySelector(s))[k]
    return { glass: g, t: rel(r('[data-ve-tool="edit"]')), count: rel(r('[data-ve-count]')), clear: rel(r('[data-ve-clear]')), save: rel(r('[data-ve-save]')), countFs: cs('[data-ve-count]', 'fontSize'), countFw: cs('[data-ve-count]', 'fontWeight'), clearBg: cs('[data-ve-clear]', 'backgroundColor'), clearR: cs('[data-ve-clear]', 'borderRadius'), saveBg: cs('[data-ve-save]', 'backgroundColor'), saveR: cs('[data-ve-save]', 'borderRadius'), btnFs: cs('[data-ve-save]', 'fontSize'), btnFw: cs('[data-ve-save]', 'fontWeight'), darkRim: cs('[data-ve-tool-dark]', 'boxShadow'), darkBg: cs('[data-ve-tool-dark]', 'backgroundImage'), main: (() => { const m = document.querySelector('main').getBoundingClientRect(); return [m.x, m.width] })() }
  })
  check('the Save state is the board\'s, 1:1: glass 360 × 58 centred on the canvas, the tool on (11, 11) 36, the count box at x 63 ≥ 120 wide in 15 Medium, Clear (199, 9) 73 × 40 on 8 % white r10, Save 71 × 40 r10 in the action blue ending at 351, labels 14 Medium; the tool\'s disc Black/600 → Black/900 under a 12 % rim',
    board.glass[2] === 360 && board.glass[3] === 58 && Math.abs(board.glass[0] + 180 - (board.main[0] + board.main[1] / 2)) <= 1
      && board.t[0] === 11 && board.t[1] === 11 && board.t[2] === 36 && board.count[0] === 63 && board.count[2] >= 120 && board.countFs === '15px' && board.countFw === '500'
      && board.clear[1] === 9 && board.clear[3] === 40 && Math.abs(board.clear[0] - 199) <= 2 && Math.abs(board.clear[2] - 73) <= 3 && board.clearBg === 'rgba(255, 255, 255, 0.08)' && board.clearR === '10px'
      && board.save[1] === 9 && board.save[3] === 40 && Math.abs(board.save[2] - 71) <= 3 && Math.abs(board.save[0] + board.save[2] - 351) <= 1 && board.saveBg === ACTION && board.saveR === '10px' && board.btnFs === '14px' && board.btnFw === '500'
      && /rgba\(255, 255, 255, 0\.12\) 0px 0px 0px 1px inset/.test(board.darkRim) && /rgba\(9, 9, 11, 0\.56\).*rgba\(9, 9, 11, 0\.8\)/.test(board.darkBg),
    JSON.stringify(board))
  await shot('O3b-save-state')

  /* ── 6 · a photo: the Replace pill, the Image panel, Fit, the library, Esc ─────── */
  const photo = await p.$('[data-edit="meal.power-bowl.photo"]')
  await photo.scrollIntoViewIfNeeded(); await p.waitForTimeout(200)
  await photo.hover(); await p.waitForTimeout(300)
  const pill = await p.$eval('[data-edit="meal.power-bowl.photo"]', (host) => {
    const s = host.querySelector('.ve-replace'); const cs = getComputedStyle(s); const h = host.getBoundingClientRect(), q = s.getBoundingClientRect()
    return { op: cs.opacity, text: s.textContent, glass: s.classList.contains('liquid-glass'), h: +q.height.toFixed(1), radius: cs.borderRadius, pointer: cs.pointerEvents, centred: Math.abs((q.x + q.width / 2) - (h.x + h.width / 2)) <= 1 && Math.abs((q.y + q.height / 2) - (h.y + h.height / 2)) <= 1, cursor: getComputedStyle(host).cursor, role: host.getAttribute('role'), kind: host.dataset.editKind, hoverRing: !!document.querySelector('.ve-ring--hover') }
  })
  check('hovering a photo shows its affordance — the «Replace photo» glass pill, 36 tall, round, centred on the photo, pointer-blind (CSS :hover, no React state) — over a pointer-cursor photo host',
    pill.op === '1' && pill.text === 'Replace photo' && pill.glass && pill.h === 36 && pill.radius === '999px' && pill.pointer === 'none' && pill.centred && pill.cursor === 'pointer' && pill.role === 'button' && pill.kind === 'photo' && pill.hoverRing, JSON.stringify(pill))
  const srcBefore = await p.$eval('[data-edit="meal.power-bowl.photo"] img', (e) => e.getAttribute('src'))
  await photo.click()
  await p.waitForSelector('[data-ve-image-panel]', { timeout: 3000 }).catch(() => {})
  await p.waitForTimeout(500)
  const panel = await p.evaluate(() => {
    const pn = document.querySelector('[data-ve-image-panel]'); const ph = document.querySelector('[data-edit="meal.power-bowl.photo"]')
    if (!pn || !ph) return { panel: !!pn }
    const r = ph.getBoundingClientRect(); const cs = getComputedStyle(pn)
    return {
      panel: true, left: parseFloat(pn.style.left), top: parseFloat(pn.style.top), w: pn.offsetWidth, photo: { l: +r.left.toFixed(1), r: +r.right.toFixed(1), t: +r.top.toFixed(1), h: Math.round(r.height), w: Math.round(r.width) }, vw: innerWidth, vh: innerHeight,
      role: pn.getAttribute('role'), label: pn.getAttribute('aria-label'), title: pn.querySelector('h2')?.textContent, radius: cs.borderRadius, bg: cs.backgroundColor, glass: pn.classList.contains('liquid-glass'), shadow: cs.boxShadow, z: cs.zIndex, fixed: cs.position,
      tabs: [...pn.querySelectorAll('[data-ve-fit] [role="tab"]')].map((t) => [t.textContent, t.getAttribute('aria-selected')]), seat: !!pn.querySelector('[data-ve-fit-seat]'), rows: [...pn.querySelectorAll('[data-ve-row]')].map((e) => e.dataset.veRow),
      hVal: pn.querySelector('[data-ve-h]')?.value, wVal: pn.querySelector('[data-ve-w]')?.value, wRO: pn.querySelector('[data-ve-w]')?.readOnly, opVal: pn.querySelector('[data-ve-opacity]')?.value, opText: pn.querySelector('[data-ve-opacity-value]')?.textContent,
      close: !!pn.querySelector('[data-ve-panel-close]'), preview: !!pn.querySelector('[data-ve-preview] img'), panelOpen: ph.hasAttribute('data-panel-open'), pillOp: getComputedStyle(ph.querySelector('.ve-replace')).opacity, inBody: pn.parentElement === document.body,
    }
  })
  const expectTop = panel.panel ? Math.max(8, Math.min(panel.photo.t, panel.vh - 640 - 88)) : null
  check('a press on the photo opens the Image panel as a popover ANCHORED to it: 320 wide, 12 to the photo’s side (right where there is room, else left), top-aligned with it or clamped to keep the bar’s room under it, fixed in the body at z60, the photo keeping its pill lit while it is open',
    panel.panel && panel.w === 320 && (panel.left >= panel.photo.r + 8 || panel.left + 320 <= panel.photo.l - 8) && Math.abs(panel.top - expectTop) <= 1 && panel.fixed === 'fixed' && panel.z === '60' && panel.inBody && panel.panelOpen && panel.pillOp === '1',
    JSON.stringify({ left: panel.left, top: panel.top, expectTop, w: panel.w, photo: panel.photo, panelOpen: panel.panelOpen, pillOp: panel.pillOp }))
  check('…drawn as the sketch (31384:21963): a dialog titled «Image» in glass — rgba(31,31,31,.7), r24, the 0 8 72 shadow — with the `Fit | Fill` segmented on Fill and one moving seat, the picture preview, the layout’s width read-only beside an editable height that reads the photo’s own box, Opacity at 100 %, and the three doors Upload · Library · Generate',
    panel.panel && panel.role === 'dialog' && panel.label === 'Image' && panel.title === 'Image' && panel.glass && panel.bg === 'rgba(31, 31, 31, 0.7)' && panel.radius === '24px' && /rgba\(0, 0, 0, 0\.5\) 0px 8px 72px/.test(panel.shadow)
      && JSON.stringify(panel.tabs) === JSON.stringify([['Fit', 'false'], ['Fill', 'true']]) && panel.seat && panel.rows.join() === 'upload,library,generate' && panel.preview && panel.close
      && panel.wRO === true && +panel.wVal === panel.photo.w && +panel.hVal === panel.photo.h && panel.opVal === '100' && panel.opText === '100%',
    JSON.stringify({ role: panel.role, label: panel.label, title: panel.title, bg: panel.bg, radius: panel.radius, shadow: panel.shadow, tabs: panel.tabs, rows: panel.rows, wVal: panel.wVal, hVal: panel.hVal, photo: panel.photo, opVal: panel.opVal, opText: panel.opText }))
  await shot('O4-image-panel')
  await p.click('[data-ve-fit] [role="tab"]:text-is("Fit")'); await p.waitForTimeout(250)
  const fitted = await p.evaluate(() => ({
    site: getComputedStyle(document.querySelector('[data-edit="meal.power-bowl.photo"] img')).objectFit,
    preview: getComputedStyle(document.querySelector('[data-ve-preview] img')).objectFit, tabs: [...document.querySelectorAll('[data-ve-fit] [role="tab"]')].map((t) => t.getAttribute('aria-selected')).join(), count: document.querySelector('[data-ve-count]')?.textContent,
  }))
  check('Fit stages `contain` on the photo — on the site AND in the panel’s preview — and the bar counts «2 changes»',
    fitted.site === 'contain' && fitted.preview === 'contain' && fitted.tabs === 'true,false' && fitted.count === '2 changes', JSON.stringify(fitted))
  /* since 30.09.2026 (evening) «From Library» opens the WEBSITE MEDIA panel in pick mode (block P) — the grid is
     the panel's, each tile a `[data-media-open]` button; the panel takes its Panel Arrival, so wait for it */
  await p.click('[data-ve-row="library"]'); await p.waitForTimeout(800)
  const lib = await p.evaluate(() => {
    const g = document.querySelector('[data-ve-library]'); if (!g) return { up: false }
    const tiles = [...g.querySelectorAll('button[data-media-open]')]
    return { up: true, n: tiles.length, on: tiles.map((t) => t.getAttribute('aria-pressed')), third: tiles[2]?.querySelector('img')?.getAttribute('src') ?? null, pressedRow: document.querySelector('[data-ve-row="library"]')?.getAttribute('aria-pressed') }
  })
  await p.click('[data-ve-library] [data-media-tile]:nth-child(3) [data-media-open]'); await p.waitForTimeout(400)
  const picked = await p.evaluate(() => ({ src: document.querySelector('[data-edit="meal.power-bowl.photo"] img')?.getAttribute('src'), count: document.querySelector('[data-ve-count]')?.textContent, on: [...document.querySelectorAll('[data-ve-library] button[data-media-open]')].map((t) => t.getAttribute('aria-pressed')), preview: document.querySelector('[data-ve-preview] img')?.getAttribute('src') }))
  check('From Library opens the Website media panel in pick mode with the current picture marked; picking the third swaps the photo on the site and in the preview to that tile, marks it, and the bar counts «3 changes»',
    lib.up && lib.n >= 6 && lib.on.filter((x) => x === 'true').length === 1 && lib.pressedRow === 'true' && !!lib.third && lib.third !== srcBefore && picked.src === lib.third && picked.preview === lib.third && picked.on[2] === 'true' && picked.on.filter((x) => x === 'true').length === 1 && picked.count === '3 changes',
    JSON.stringify({ n: lib.n, on: lib.on, pressedRow: lib.pressedRow, changed: lib.third !== srcBefore, picked: picked.src === lib.third, count: picked.count }))
  await shot('O5-library')
  await p.keyboard.press('Escape')
  await p.waitForSelector('[data-ve-image-panel]', { state: 'detached', timeout: 600 }).catch(() => {})
  const esc6 = { panel: !!(await p.$('[data-ve-image-panel]')), pressed: await pressed('edit'), count: await count(), panelOpen: await p.$eval('[data-edit="meal.power-bowl.photo"]', (e) => e.hasAttribute('data-panel-open')), fit: await p.$eval('[data-edit="meal.power-bowl.photo"] img', (e) => getComputedStyle(e).objectFit) }
  check('Esc with the panel open climbs ONE rung: the panel is gone within 600 ms, the mode stays on with its three staged changes, the photo keeps Fit',
    !esc6.panel && esc6.pressed === 'true' && esc6.count === '3 changes' && !esc6.panelOpen && esc6.fit === 'contain', JSON.stringify(esc6))

  /* ── 7 · Save: the one free write ──────────────────────────────────────────────── */
  const w7a = await world()
  await p.click('[data-ve-save]')
  await p.waitForSelector('[data-ve-batch]', { state: 'detached', timeout: 2000 }).catch(() => {})
  await p.waitForTimeout(200)
  const w7 = await world()
  const savedPhoto = w7.siteEdits.photo['meal.power-bowl.photo']
  check('Save applies the batch as ONE change to the world: `unpublished` + 1, credits UNTOUCHED (640 — «manual edits… never use credits»), ONE free version card in the transcript (block R), the chat idle; the saved layer carries the words, the Fit and the picked picture under their keys',
    w7.unpublished === w7a.unpublished + 1 && w7.unpublished === 1 && w7.credits === 640 && w7a.credits === 640 && w7.sent.at(-1)?.kind === 'version' && w7.versions.at(-1)?.kind === 'edit' && w7.versions.at(-1)?.cost === 0 && w7.chat !== 'working'
      && w7.siteEdits.text['home.hero.title'] === ORIGINAL + TYPED && w7.siteEdits.fit['meal.power-bowl.photo'] === 'fit' && savedPhoto?.kind === 'site' && savedPhoto?.id !== 'power-bowl' && Object.keys(w7.siteEdits.text).length === 1,
    JSON.stringify({ unpublished: [w7a.unpublished, w7.unpublished], credits: [w7a.credits, w7.credits], sent: [w7a.sent.length, w7.sent.length], chat: w7.chat, text: w7.siteEdits.text, fit: w7.siteEdits.fit, photo: savedPhoto }))
  const afterSave = await p.evaluate(() => {
    const pub = [...document.querySelectorAll('[data-canvas-toolbar] button')].find((b) => /Publish/.test(b.textContent))
    return { batch: !!document.querySelector('[data-ve-batch]'), pressed: document.querySelector('[data-ve-tool="edit"]')?.getAttribute('aria-pressed'), selectUp: !!document.querySelector('[data-ve-tool="select"]'), dirty: document.querySelector('[data-ve-bar]')?.hasAttribute('data-ve-dirty'), title: document.querySelector('[data-canvas-site] [data-site-page="/"] h1')?.textContent, fit: getComputedStyle(document.querySelector('[data-edit="meal.power-bowl.photo"] img')).objectFit, publish: pub ? { text: pub.textContent.trim(), bg: getComputedStyle(pub).backgroundColor, disabled: pub.disabled } : null, u: new URLSearchParams(location.search).get('u') }
  })
  check('…the bar folds its batch away, the Edit tool stays pressed with the Select tool back beside it, the site keeps showing the saved words and Fit, the toolbar’s Publish is blue and still says «Publish» (never published → no count), and `u=1` is in the address bar',
    !afterSave.batch && afterSave.pressed === 'true' && afterSave.selectUp && !afterSave.dirty && afterSave.title === ORIGINAL + TYPED && afterSave.fit === 'contain' && afterSave.publish?.text === 'Publish' && afterSave.publish?.bg === ACTION && afterSave.publish?.disabled === false && afterSave.u === '1',
    JSON.stringify(afterSave))
  await shot('O6-saved')

  /* ── 9 · the edits belong to ONE site; the shelf shows the same layer and takes the bar ── */
  check('the saved edits are keyed under the site they were made on and nowhere else: `world.site` is fit-ration and no stashed slice carries an edit',
    w7.site === 'fit-ration' && Object.values(w7.stash).every((n) => n === 0), JSON.stringify({ site: w7.site, stash: w7.stash }))
  await p.click('[data-site-switch]')
  await p.waitForSelector('[data-ve-bar]', { state: 'detached', timeout: 3000 }).catch(() => {})
  await p.waitForSelector('[data-sites-shelf]', { timeout: 3000 }).catch(() => {})
  await p.waitForTimeout(1200)
  const shelf = await p.evaluate(() => ({
    bar: !!document.querySelector('[data-ve-bar]'), shelf: !!document.querySelector('[data-sites-shelf]'), current: document.querySelector('[data-site-card="fit-ration"]')?.hasAttribute('data-site-current') ?? null,
    mini: document.querySelector('[data-site-card="fit-ration"] [data-site-mini] h1')?.textContent ?? null, parked: document.querySelector('[data-site-park] h1')?.textContent ?? null,
    others: [...document.querySelectorAll('[data-site-card]:not([data-site-card="fit-ration"])')].map((c) => [c.dataset.siteCard, !!c.querySelector('[data-site-mini]')]), panel: !!document.querySelector('[data-ve-image-panel]'),
  }))
  check('the bar steps aside with the toolbar while the sites shelf has the canvas; the fit-ration card’s miniature reads the SAME saved layer (the words are in it), and the three drawn sites carry no miniature for an edit to leak into',
    !shelf.bar && shelf.shelf && shelf.current === true && shelf.mini === ORIGINAL + TYPED && shelf.others.length === 3 && shelf.others.every(([, m]) => !m) && !shelf.panel, JSON.stringify(shelf))
  await p.click('[data-sites-close]')
  await p.waitForSelector('[data-sites-shelf]', { state: 'detached', timeout: 5000 }).catch(() => {})
  await p.waitForSelector('[data-ve-bar]', { timeout: 5000 }).catch(() => {})
  await p.waitForTimeout(300)
  check('…and comes back when the shelf closes, the tool as it was', (await bar()) && (await pressed('edit')) === 'true' && (await canvasTitle()) === ORIGINAL + TYPED, JSON.stringify({ bar: await bar(), pressed: await pressed('edit') }))

  /* ── 8 · a reload keeps what was saved, and only that ──────────────────────────── */
  const before8 = await world()
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(700)
  const after8 = await world()
  /* the proof is the DOM, not the store: a URL-wins reload would leave the old snapshot in storage and render the
     compiled copy — so what the Home dock's fit-ration miniature PRINTS is what the world came back as */
  const dockMini = await p.$eval('.home-card-face [data-site-mini] h1', (e) => e.textContent).catch(() => null)
  check('a reload with the address bar as the app left it (its query equal to the stored snapshot’s own) restores the snapshot WHOLE (world.ts, the own-snapshot rule): the Home dock’s fit-ration miniature already prints the saved words',
    after8.search === before8.search && /(^|&)u=1(&|$)/.test(after8.search.slice(1)) && dockMini === ORIGINAL + TYPED, JSON.stringify({ search: after8.search, dockMini }))
  await p.click('.home-card-face')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(700)
  const back = { title: await canvasTitle(), fit: await fitOfPhoto(), src: await p.$eval('[data-canvas-site] [data-site-page="/"] img', (e) => e.getAttribute('src')).catch(() => null), bar: await bar(), pressed: await pressed('edit'), batch: !!(await p.$('[data-ve-batch]')), hosts: await p.$$eval('[data-edit]', (els) => els.length) }
  check('…and the builder reopens on the edited site — the words, the Fit and the picked picture — with the bar at rest: the SESSION died with the page (tool off, no batch, no hosts), the SAVED layer did not',
    back.title === ORIGINAL + TYPED && back.fit === 'contain' && back.src === lib.third && back.bar && back.pressed === 'false' && !back.batch && back.hosts === 0,
    JSON.stringify({ ...back, src: back.src === lib.third ? 'the picked tile' : (back.src || '').slice(0, 40) }))

  /* ── 11 · the Escape ladder, rung by rung, on a clean mode ─────────────────────── */
  await p.click('[data-ve-tool="edit"]'); await p.waitForTimeout(300)
  await p.click('[data-edit="home.hero.title"]'); await p.waitForTimeout(100)
  const rung0 = await p.evaluate(() => ({ caret: document.activeElement?.getAttribute('data-edit'), pinned: !!document.querySelector('.ve-ring--pinned') }))
  await p.keyboard.press('Escape'); await p.waitForTimeout(250)
  const rung1 = await p.evaluate(() => ({ active: document.activeElement?.getAttribute('data-edit') ?? document.activeElement?.tagName, pressed: document.querySelector('[data-ve-tool="edit"]')?.getAttribute('aria-pressed'), pinned: !!document.querySelector('.ve-ring--pinned'), batch: !!document.querySelector('[data-ve-batch]'), title: document.querySelector('[data-canvas-site] [data-site-page="/"] h1')?.textContent }))
  await p.keyboard.press('Escape'); await p.waitForTimeout(250)
  const rung2 = await p.evaluate(() => ({ pressed: document.querySelector('[data-ve-tool="edit"]')?.getAttribute('aria-pressed'), pinned: !!document.querySelector('.ve-ring--pinned') }))
  await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  const rung3 = await p.evaluate(() => ({ pressed: document.querySelector('[data-ve-tool="edit"]')?.getAttribute('aria-pressed'), editing: document.querySelector('[data-site-editing]')?.getAttribute('data-site-editing') ?? null, hosts: document.querySelectorAll('[data-edit],[data-pick]').length, overlay: !!document.querySelector('[data-ve-overlay]'), bar: !!document.querySelector('[data-ve-bar]') }))
  check('Escape climbs out one rung at a time: a caret in the title (its ring pinned) → Esc COMMITS and leaves the text, nothing staged, the selection still ringed → Esc drops the selection → Esc on a clean mode turns it off — hosts and overlay gone, the bar still there',
    rung0.caret === 'home.hero.title' && rung0.pinned && rung1.active !== 'home.hero.title' && rung1.pressed === 'true' && rung1.pinned && !rung1.batch && rung1.title === ORIGINAL + TYPED
      && rung2.pressed === 'true' && !rung2.pinned && rung3.pressed === 'false' && rung3.editing === null && rung3.hosts === 0 && !rung3.overlay && rung3.bar,
    JSON.stringify({ rung0, rung1, rung2, rung3 }))

  /* ── 10 · the Select tool: an element handed to the chat, down the PAID lane ───── */
  const w10a = await world()
  await p.click('[data-ve-tool="select"]'); await p.waitForTimeout(300)
  const sel = await p.evaluate(() => ({ pressed: document.querySelector('[data-ve-tool="select"]')?.getAttribute('aria-pressed'), editPressed: document.querySelector('[data-ve-tool="edit"]')?.getAttribute('aria-pressed'), picks: document.querySelectorAll('[data-pick]').length, edits: document.querySelectorAll('[data-edit]').length, selecting: document.querySelector('[data-site-editing]')?.getAttribute('data-site-editing'), ce: document.querySelector('[data-pick="home.hero.title"]')?.getAttribute('contenteditable') ?? null }))
  const pick = await p.$('[data-pick="home.hero.title"]')
  /* Lovable's tool, in our blue (01.10.2026, scratchpad/lov-select/): the ring sits 1 px ON the box with a 5 % tint,
     a pill with the TAG rides at the cursor +14/+18, a click picks and the bar re-forms into «1 selection · Clear» */
  const pb = await pick.boundingBox()
  const hx = Math.round(pb.x + 40), hy = Math.round(pb.y + pb.height / 2)
  await p.mouse.move(hx, hy, { steps: 4 }); await p.waitForTimeout(160)
  const selHover = await p.evaluate(({ hx, hy }) => {
    const ring = document.querySelector('[data-ve-hover]'); const tag = document.querySelector('[data-ve-tag]'); const t = document.querySelector('[data-pick="home.hero.title"]')
    if (!ring || !tag || !t) return { ring: !!ring, tag: !!tag }
    const r = ring.getBoundingClientRect(); const b = t.getBoundingClientRect(); const q = tag.getBoundingClientRect(); const cs = getComputedStyle(ring)
    return { on: Math.max(Math.abs(r.x - b.x), Math.abs(r.y - b.y), Math.abs(r.width - b.width), Math.abs(r.height - b.height)) < 0.6, shadow: cs.boxShadow, radius: cs.borderRadius, tint: cs.backgroundColor,
      word: tag.textContent, dx: q.x - hx, dy: q.y - hy, h: q.height, bg: getComputedStyle(tag).backgroundColor, cursor: getComputedStyle(t).cursor,
      inPage: !!tag.closest('[data-ve-overlay]'), discX: document.querySelector('[data-ve-tool="select"]')?.getBoundingClientRect().x }
  }, { hx, hy })
  await p.mouse.click(hx, hy); await p.waitForTimeout(800)
  const chosen = await p.evaluate(() => {
    const ring = document.querySelector('[data-ve-pick]'); const t = document.querySelector('[data-pick="home.hero.title"]'); const ta = document.querySelector('aside textarea')
    const r = ring?.getBoundingClientRect(); const b = t?.getBoundingClientRect()
    const g = document.querySelector('[data-ve-bar] [data-ve-glass]')?.getBoundingClientRect(); const c = document.querySelector('[data-ve-pick-clear]')?.getBoundingClientRect()
    return { pinned: !!ring, on: r && b ? Math.max(Math.abs(r.x - b.x), Math.abs(r.y - b.y), Math.abs(r.width - b.width), Math.abs(r.height - b.height)) < 0.6 : null, oldChip: !!document.querySelector('[data-ve-chip]'),
      discX: document.querySelector('[data-ve-tool="select"]')?.getBoundingClientRect().x, clearInGlass: g && c ? c.left >= g.left && c.right <= g.right + 0.5 : null,
      composer: document.querySelector('[data-about-chip]')?.textContent ?? null, placeholder: ta?.getAttribute('placeholder'), focused: document.activeElement === ta,
      bar: document.querySelector('[data-ve-picked] [data-ve-pick-count]')?.textContent ?? null, clear: !!document.querySelector('[data-ve-pick-clear]'), editTool: !!document.querySelector('[data-ve-tool="edit"]:not([data-ve-ghost])'), edits: document.querySelectorAll('[data-edit]').length }
  })
  check('the Select tool, Lovable\'s: pressed, every content target a `data-pick` (no contentEditable anywhere), a crosshair; the hover ring sits 1 px ON the heading\'s box (inset action blue, square, 5 % tint) and a pill «h1» rides at the cursor +14/+18; a click PINS the heading on its box, no chip on the site, the composer grows a chip «h1», its placeholder asks about the selected element, the caret is in the field, and the bar re-forms into «1 selection · Clear» — the glass stretching over it from a disc that stays put, the Edit tool ghosted out of reach',
    sel.pressed === 'true' && sel.editPressed === 'false' && sel.picks >= 20 && sel.edits === 0 && sel.selecting === 'select' && sel.ce === null
      && selHover.on && /21, 135, 255/.test(selHover.shadow || '') && /inset/.test(selHover.shadow || '') && selHover.radius === '0px' && selHover.tint === 'rgba(21, 135, 255, 0.05)'
      && selHover.word === 'h1' && Math.abs(selHover.dx - 14) <= 1 && Math.abs(selHover.dy - 18) <= 1 && selHover.h === 23 && selHover.bg === ACTION && selHover.cursor === 'crosshair'
      && chosen.pinned && chosen.on && !chosen.oldChip && chosen.composer === 'h1' && /selected element/.test(chosen.placeholder || '') && chosen.focused
      && chosen.bar === '1 selection' && chosen.clear && !chosen.editTool && selHover.inPage && Math.abs(chosen.discX - selHover.discX) < 0.5 && chosen.clearInGlass === true,
    JSON.stringify({ sel, selHover, chosen }))
  await shot('O7-select-picked')
  await p.keyboard.type('Make it shorter'); await p.keyboard.press('Enter'); await p.waitForTimeout(700)
  const sent = await p.evaluate(() => ({ bubbles: [...document.querySelectorAll('aside [data-about]')].map((e) => e.textContent), composer: !!document.querySelector('[data-about-chip]'), pinned: !!document.querySelector('[data-ve-pick]'), bar: !!document.querySelector('[data-ve-picked]'), placeholder: document.querySelector('aside textarea')?.getAttribute('placeholder'), text: document.querySelector('aside').innerText.includes('Make it shorter') }))
  /* the paid lane: the chat's COST comes off when the answer lands (send.ts `deliverAnswer`, ~2.6 s) */
  await p.waitForFunction((k) => (JSON.parse(localStorage.getItem(k) || '{}').credits ?? 640) === 630, KEY, { timeout: 8000 }).catch(() => {})
  const w10 = await world()
  check('sending carries the pick: a user bubble tagged «h1», the composer’s chip, the pick ring and the bar’s «1 selection» gone, the placeholder back to plain — and the message went down the CHAT’s lane: 10 credits off (640 → 630), one more unpublished change (1 → 2), the transcript carrying `about: "h1"`; the editor’s saved layer untouched by the send',
    sent.bubbles.join() === 'h1' && !sent.composer && !sent.pinned && !sent.bar && !/selected element/.test(sent.placeholder || '') && sent.text
      && w10a.credits === 640 && w10.credits === 630 && w10a.unpublished === 1 && w10.unpublished === 2 && w10.sent.some((m) => m.who === 'user' && m.about === 'h1')
      && w10.siteEdits.text['home.hero.title'] === ORIGINAL + TYPED && w10.siteEdits.fit['meal.power-bowl.photo'] === 'fit',
    JSON.stringify({ sent, credits: [w10a.credits, w10.credits], unpublished: [w10a.unpublished, w10.unpublished], about: w10.sent.filter((m) => m.about), text: w10.siteEdits.text, fit: w10.siteEdits.fit }))
  await shot('O8-select-sent')

  /* ── 11 · the Select tool where the review (01.10.2026) broke it: after a page switch, through a
     canvas window round trip, on Clear, on Escape in the composer ───────────────────────────── */
  await p.waitForTimeout(2600) /* the chat's answer lands */
  const sel11 = () => p.evaluate(() => {
    const r = document.querySelector('[data-ve-pick]')?.getBoundingClientRect()
    return {
      path: document.querySelector('[data-site-page]')?.getAttribute('data-site-page'), pick: r ? [r.x, r.y, r.width, r.height] : null,
      hover: !!document.querySelector('[data-ve-hover]'), tag: document.querySelector('[data-ve-tag]')?.textContent ?? null,
      bar: document.querySelector('[data-ve-picked] [data-ve-pick-count]')?.textContent ?? null, chip: document.querySelector('[data-about-chip]')?.textContent ?? null,
      pressed: document.querySelector('[data-ve-tool="select"]')?.getAttribute('aria-pressed') ?? null, edit: !!document.querySelector('[data-ve-tool="edit"]:not([data-ve-ghost])'),
    }
  })
  const toPage = async (row) => { await p.click('[data-page-switch]'); await p.waitForTimeout(400); await p.click(`[data-page-row="${row}"]`); await p.waitForTimeout(900) }
  await toPage('/about')
  const ab = await p.$eval('[data-site-page="/about"] h1', (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, h: r.height } })
  await p.mouse.move(ab.x + 30, ab.y + ab.h / 2, { steps: 4 }); await p.waitForTimeout(160)
  const s11a = await sel11()
  const btn = await p.$('[data-site-page="/about"] footer button, [data-site-page="/about"] nav button')
  const bb = await btn.boundingBox()
  await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(500)
  const s11b = await sel11()
  await toPage('/')
  const s11c = await sel11()
  check('after a page switch the Select tool works on the new page: the About heading rings with a pill «h1», a click on a site button there PICKS it (chip «button», «1 selection») and the page stays /about — and switching back to Home drops that pick',
    s11a.hover && s11a.tag === 'h1' && s11b.path === '/about' && !!s11b.pick && s11b.chip === 'button' && s11b.bar === '1 selection' && s11c.path === '/' && !s11c.pick && !s11c.chip && s11c.pressed === 'true',
    JSON.stringify({ s11a, s11b, s11c }))
  const hh = await p.$eval('[data-pick="home.hero.title"]', (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, h: r.height } })
  await p.mouse.click(hh.x + 30, hh.y + hh.h / 2); await p.waitForTimeout(500)
  const s11d = await sel11()
  await p.click('[aria-label="Cloud"]'); await p.waitForTimeout(1300)
  await p.keyboard.press('Escape'); await p.waitForTimeout(1400)
  const s11e = await sel11()
  check('a pick survives a canvas window round trip: Cloud opened and closed over a picked heading, the ring stands on the SAME box (the site layer remounted, the pick re-seated by its key), «1 selection» and the chip «h1» as before',
    !!s11d.pick && !!s11e.pick && s11e.pick.every((v, i) => Math.abs(v - s11d.pick[i]) <= 1) && s11e.bar === '1 selection' && s11e.chip === 'h1' && s11e.pressed === 'true',
    JSON.stringify({ s11d, s11e }))
  const disc0 = await p.$eval('[data-ve-tool="select"]', (e) => e.getBoundingClientRect().x)
  await p.click('[data-ve-pick-clear]'); await p.waitForTimeout(700)
  const s11f = await sel11()
  const disc1 = await p.$eval('[data-ve-tool="select"]', (e) => e.getBoundingClientRect().x)
  await p.mouse.click(hh.x + 30, hh.y + hh.h / 2); await p.waitForTimeout(500)
  await p.focus('aside textarea'); await p.keyboard.press('Escape'); await p.waitForTimeout(500)
  const s11g = await sel11()
  check('Clear drops the pick and keeps the tool, the Edit tool back in reach and the select disc where it stood all along; Escape in the composer (where a pick puts the caret) drops the pick too',
    !s11f.pick && !s11f.chip && s11f.pressed === 'true' && s11f.edit && Math.abs(disc1 - disc0) < 0.5 && !s11g.pick && !s11g.chip && s11g.pressed === 'true',
    JSON.stringify({ s11f, s11g, disc: [disc0, disc1] }))
}
/* BLOCK-O-END */

check('no page errors anywhere in the run', errors.length === 0, errors.join(' | ').slice(0, 300))
await b.close()

const failed = results.filter(([, ok]) => !ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed · screenshots in ${OUT}`)
process.exit(failed ? 1 : 0)
