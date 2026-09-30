/**
 * THE PAGE PILL — the canvas toolbar's centre control: the site's PAGE, with the preview's three
 * tools riding inside it, and the page menu under it.
 *
 * TWO BOARDS, one control:
 *
 *  1. THE PILL — Figma 31379:2968 `V2` on the toolbar board 31280:85401 «Design 2.0» (designer,
 *     30.09.2026: «вот так выглядит теперь верхняя панель без кнопки Visual Editor и я перекомпоновал
 *     оставшиеся кнопки»). One box 360 × 40, radius 10, the `Neutral Alpha/200` rim (12 % white in
 *     the dark theme), padding 4 left / 2 right, centred in the toolbar's content box — and it
 *     ABSORBED the toolbar's left group: the Visual Editor pill went to the edit bar at the bottom of
 *     the preview (modules/editor/EditBar.tsx), and the reload and the device switch moved in here.
 *       · at 4 / 4: the RELOAD, a 32 icon button (radius 10, the board's filled 24 glyph), the glow
 *         pulse it always triggered;
 *       · at 44: the page's NAME — «Home», «About» — Body Strong 15/1.4 Semibold, white, pt 2. The
 *         name, not the route: the 25.09 pill printed routes after the menu's board, and this board
 *         is the later word. The MENU's rows still print routes (their own board, below). NO CHEVRON
 *         — the board draws none, and the designer confirmed the pill stays the door: «клик по полю
 *         открывает страницы». So the whole pill, less its three buttons, is the menu's trigger;
 *       · at 285 / 2: `Preview buttons` — 73 × 36, radius 12, padding 2, gap 2, no fill of its own:
 *         the DEVICE switch (32; the glyph IS the current stop — monitor, tablet, phone — and a press
 *         cycles desktop → tablet → mobile, three stops since this board: «это просто кнопка
 *         переключателя девайса для превью, пк, телефон, планшет, иконки должны меняться»), a 1 × 32
 *         divider at `Neutral Alpha/100` (8 %), and OPEN IN NEW TAB (32; «открывает превью сайта на
 *         новой вкладке на весь экран, по сути стейджинг» — Root.tsx renders the bare site for
 *         `?view=site&path=…`).
 *     The credits chip that stood at the toolbar's right is gone with this board («кредиты убрал
 *     потому что спрятаны в меню пользователя» — the account menu under the rail's avatar carries
 *     the balance); Publish stands alone there.
 *     ⚠️ The rim is an INSET box-shadow, never `border`: a border would push every child 1 px off
 *     the board's coordinates (the kit's rule since the composer — CLAUDE.md «inset box-shadow, не
 *     border»). ⚠️ The trigger is a button laid UNDER the three tool buttons (absolute, the pill's
 *     whole box) rather than around them: a button inside a button is not HTML, and the board's
 *     `state-layer` is the whole pill — so the hover wash and the press bloom cover the pill to its
 *     corners, while the tools, above it, keep their own 32 × 32 wash.
 *
 *  2. THE MENU — Figma 31076:31629, the frame `Menu` 31076:37714 (designer, 25.09.2026: «вот макет
 *     дропдауна и расположения страниц… сделай дизайн перфект пиксель как в макете»). Its logic is
 *     Lovable's, frame by frame off a 30 s recording of their route picker (scratchpad/lov-pages;
 *     the designer that morning: «саму логику и UX делаем как у lovable на видео один в один, но
 *     дизайн, анимации и эффекты используем наши, крутые»):
 *      · it sits ON the pill, corner on corner, as wide as the pill (360 now) — the search field takes
 *        the pill's place, the list hangs below; it grows out of the pill it covers (motion.ts
 *        `pageMenuIn`), the attach menu's law over its «+»;
 *      · SOLID `Gray/700` under a 4 % inset rim at radius 10 with the board's shadow — no glass;
 *      · the field is 47 + a 1 px `Neutral Alpha/100` rule: the board's search glyph at 32 % white,
 *        the route in 15/1.7 Proxima at `Background/Neutral/500` (#c7c7cd in the dark theme), no ✕;
 *        PRE-FILLED with the current route, selected whole, and that pre-fill does NOT filter the
 *        list — typing does; the first row highlighted on open (cmdk's law), ↑ ↓ move it, Enter
 *        takes it, Esc and a press outside close;
 *      · the rows are the kit's `-2 density` items — 48 tall, radius 8, 12 in, a 24 leading slot,
 *        15/24 — printing ROUTES: `/`, `/about`… The current page wears the check and Semibold; the
 *        highlighted row wears `Neutral Alpha/100` and FOLLOWS THE POINTER (one highlight for mouse
 *        and keyboard). No trailing glyph — the board draws none;
 *      · five rows show, then the list scrolls beside a DRAWN bar — 4 wide in its own 10 px column,
 *        24 % white, always on while there is something to scroll;
 *      · pressing a row closes the menu, the pill reads the new page AT ONCE, the preview follows
 *        (their iframe blanks ~600 ms; our site hands over — motion.ts `pageSwap`); typing what
 *        matches no route collapses the list to ONE row, «Go to <typed>», which navigates there and
 *        the site answers with its own not-found page (their app: its 404 route) — the pill then
 *        prints that route, having no name for it; the pill FOLLOWS THE SITE: a link inside the
 *        preview writes the same `ui.previewPath`.
 *
 * ⚠️ Every fade here is on the main thread (`onUpdate` stub): a composited fade hands the element
 * back with its pre-animation opacity for one frame between `finish` and the next render — the
 * attach menu and the Publish panel's rolling verb both paid for that frame before this was built.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useUI, nextDevice, type Device } from '@/state/ui'
import { useT } from '@/i18n'
import { ScrollArea } from '@/ui/ScrollArea'
import { IconArrowRight, IconMonitor, IconPhone, IconTablet } from '@/ui/icons'
import { pageMenuIn, pageMenuInFade, popoverContent } from '@/ui/motion'
import { findPage, matchPages, normalizePath, sitePages, type SitePage } from './pages'
import { GlyphCheck24, GlyphOpenNew24, GlyphReload24, GlyphSearch24 } from './boardIcons'

/** The kit's `-2 density` rows are 48 with 1 px between them; the board's list window is five of
 *  them (5 × 48 + 4 = 244) before it scrolls. */
const ROW_H = 48
const VISIBLE_ROWS = 5
/* = 244, the literal `max-h-[244px]` on the scroller below (Tailwind needs the literal) */
export const LIST_MAX = VISIBLE_ROWS * ROW_H + (VISIBLE_ROWS - 1)
const keepOnMainThread = () => {}

type Item = { kind: 'page'; page: SitePage } | { kind: 'goto'; path: string }

/** The board's `Preview icon button (Dark theme)`: 32 × 32, radius 10, the house 8 % wash on hover, the
 *  house bloom on press. Shared by the pill's three tools. */
const TOOL_BTN =
  'press-bloom grid h-8 w-8 flex-none place-items-center rounded-[10px] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]'

/** The device button's glyph IS the stop the canvas is on (Lovable's law, three stops since 30.09.2026). */
const DeviceGlyph = ({ device }: { device: Device }) =>
  device === 'desktop' ? <IconMonitor size={24} /> : device === 'tablet' ? <IconTablet size={24} /> : <IconPhone size={24} />

export function PageSwitcher() {
  const { t } = useT()
  const answers = useWorld((s) => s.world.brief.answers)
  const outline = useWorld((s) => s.world.planEdits.outline)
  const previewPath = useUI((s) => s.previewPath)
  const setPreviewPath = useUI((s) => s.setPreviewPath)
  const reloading = useUI((s) => s.reloading)
  const triggerReload = useUI((s) => s.triggerReload)
  const device = useUI((s) => s.device)
  const setDevice = useUI((s) => s.setDevice)
  const pages = useMemo(() => sitePages(answers, outline), [answers, outline])
  const [open, setOpen] = useState(false)
  /* the menu measures the WHOLE pill — it lies on it corner on corner, as wide */
  const pill = useRef<HTMLDivElement>(null)

  /* the page's name; a route the outline has no page for («Go to /promo») prints as the route */
  const current = findPage(pages, previewPath)
  const label = current ? t(current.name) : normalizePath(previewPath)

  /* what one press of the device button does next, said in the label (EN/UK, like every control here) */
  const next = nextDevice(device)
  const deviceLabel =
    next === 'tablet' ? t({ en: 'Switch to tablet view', uk: 'Перемкнути на вигляд планшета' })
    : next === 'mobile' ? t({ en: 'Switch to mobile view', uk: 'Перемкнути на мобільний вигляд' })
    : t({ en: 'Switch to desktop view', uk: 'Перемкнути на вигляд десктопа' })

  /*
   * STAGING: the bare site in a tab of its own (Root.tsx reads `view=site`). `path` carries the page
   * the canvas stands on; the world itself is not in the link — the new tab reads the same stored
   * snapshot (world.ts `paramsToWorld` knows only its short keys, so the two extra ones are ignored
   * and storage wins whole). `noopener`: the tab is a viewer, it gets no handle on the builder.
   */
  const openStaging = () => {
    const url = `${location.pathname}?view=site&path=${encodeURIComponent(normalizePath(previewPath))}`
    window.open(url, '_blank', 'noopener')
  }

  return (
    <>
      <div
        ref={pill}
        data-page-pill
        /* the board's project button: 360 × 40, radius 10, the NA/200 rim INSIDE (an inset shadow, so
           the children sit at the board's coordinates), 4 of padding at the left and 2 at the right;
           `shrink` so a narrow canvas (down to 480) squeezes the pill rather than the toolbar */
        className="relative flex h-10 w-[360px] min-w-0 shrink items-center rounded-[10px] pl-1 pr-0.5 shadow-[inset_0_0_0_1px_var(--white-200)]"
      >
        {/* the trigger — the pill's whole box, under the tools: its wash and bloom reach the corners */}
        <button
          type="button"
          data-page-switch
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={t({ en: 'Page', uk: 'Сторінка' })}
          onClick={() => setOpen((o) => !o)}
          className={`press-bloom absolute inset-0 flex items-center rounded-[10px] pl-[44px] pr-[80px] text-left transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] ${
            open ? 'bg-[var(--white-100)]' : ''
          }`}
        >
          {/* `Project Name` 31379:2977: a 24 box with the 15/1.4 name 2 below its top */}
          <span className="block h-6 min-w-0 truncate pt-0.5 text-[15px] font-semibold leading-[1.4] text-white" data-page-label>
            {label}
          </span>
        </button>
        {/* reload — 32 at 4 / 4; the glyph turns while the pulse runs, as it always has */}
        <button
          type="button"
          data-page-reload
          onClick={() => triggerReload()}
          aria-label={t({ en: 'Reload preview', uk: 'Перезавантажити прев’ю' })}
          className={`relative z-10 ${TOOL_BTN}`}
        >
          <span className={reloading ? 'flex animate-spin' : 'flex'} style={reloading ? { animationDuration: '1.1s' } : undefined}>
            <GlyphReload24 />
          </span>
        </button>
        {/* `Preview buttons` 31379:3007 — 73 × 36 at the pill's right: device | divider | open */}
        <div className="relative z-10 ml-auto flex h-9 flex-none items-center gap-0.5 rounded-[12px] p-0.5" data-page-tools>
          <button type="button" data-page-device={device} onClick={() => setDevice(next)} aria-label={deviceLabel} className={TOOL_BTN}>
            <DeviceGlyph device={device} />
          </button>
          <span className="h-8 w-px flex-none bg-[var(--white-100)]" aria-hidden />
          <button
            type="button"
            data-page-open
            onClick={openStaging}
            aria-label={t({ en: 'Open the site in a new tab', uk: 'Відкрити сайт у новій вкладці' })}
            className={TOOL_BTN}
          >
            <GlyphOpenNew24 />
          </button>
        </div>
      </div>
      <PageMenu
        open={open}
        anchor={pill}
        pages={pages}
        currentPath={previewPath}
        onClose={() => setOpen(false)}
        onPick={(path) => { setPreviewPath(path); setOpen(false) }}
      />
    </>
  )
}

function PageMenu({ open, anchor, pages, currentPath, onClose, onPick }: {
  open: boolean
  anchor: React.RefObject<HTMLElement | null>
  pages: SitePage[]
  currentPath: string
  onClose: () => void
  onPick: (path: string) => void
}) {
  const { t } = useT()
  const reduce = useReducedMotion()
  const [at, setAt] = useState<{ left: number; top: number; width: number } | null>(null)
  /* the field is UNCONTROLLED (`defaultValue`, its text written by hand below): a controlled
     input that React rewrites after `select()` lands with the caret at the end — measured on the
     second open: selection [6, 6] on «/about». `query` mirrors the DOM for the filter and the ✕. */
  const [query, setQuery] = useState('')
  /* the pre-filled route does not filter the list (the recording shows the full list under a
     selected «/history»); only what the customer TYPES does */
  const [touched, setTouched] = useState(false)
  const [active, setActive] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)

  /* the menu sits ON the pill — its board lays `Menu` at the pill's own x and y, as wide */
  useLayoutEffect(() => {
    if (!open) return
    const measure = () => {
      const r = anchor.current?.getBoundingClientRect()
      if (r) setAt({ left: r.left, top: r.top, width: r.width })
    }
    measure()
    addEventListener('resize', measure)
    return () => removeEventListener('resize', measure)
  }, [open, anchor])

  /* every open starts the same way: the current route in the field, selected whole, the first
     row highlighted, the field focused. The field exists only once the box is placed (`at`), so
     this waits for both; `armed` keeps a resize from re-arming it mid-use. */
  const armed = useRef(false)
  useEffect(() => {
    if (!open) { armed.current = false; return }
    if (!at || armed.current) return
    armed.current = true
    const path = normalizePath(currentPath)
    setQuery(path)
    setTouched(false)
    setActive(0)
    const el = input.current
    if (el) { el.value = path; el.focus(); el.select() }
  }, [open, at]) // eslint-disable-line react-hooks/exhaustive-deps
  const write = (text: string) => { if (input.current) input.current.value = text; setQuery(text); setTouched(true); setActive(0) }
  /* the list reserves the drawn scrollbar's 10 px column only while it has something to scroll */
  const [scrolls, setScrolls] = useState(false)

  /* Esc closes; a press anywhere but the menu or its pill closes */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
    const onDown = (e: PointerEvent) => {
      const el = e.target as Node
      if (box.current?.contains(el) || anchor.current?.contains(el)) return
      onClose()
    }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('pointerdown', onDown, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('pointerdown', onDown, true)
    }
  }, [open, onClose, anchor])

  const q = touched ? query.trim() : ''
  const matches = q ? matchPages(pages, q) : pages
  const items: Item[] = q && matches.length === 0
    ? [{ kind: 'goto', path: normalizePath(q) }]
    : matches.map((page) => ({ kind: 'page', page }))
  const clampedActive = Math.min(active, Math.max(0, items.length - 1))

  const pick = (item: Item) => onPick(item.kind === 'page' ? item.page.path : item.path)

  /* keyboard on the field: ↑ ↓ move the highlight (and keep it in view), Enter takes it */
  const onFieldKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = e.key === 'ArrowDown' ? Math.min(items.length - 1, clampedActive + 1) : Math.max(0, clampedActive - 1)
      setActive(next)
      list.current?.querySelector<HTMLElement>(`[data-page-index="${next}"]`)?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Home' || e.key === 'End') {
      if (e.key === 'Home' && (e.currentTarget.selectionStart ?? 0) > 0) return
      e.preventDefault()
      setActive(e.key === 'Home' ? 0 : items.length - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = items[clampedActive]
      if (item) pick(item)
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && at && (
        <motion.div
          ref={box}
          data-page-menu
          role="listbox"
          aria-label={t({ en: 'Pages', uk: 'Сторінки' })}
          variants={reduce ? pageMenuInFade : pageMenuIn}
          initial="initial"
          animate="animate"
          exit="exit"
          onUpdate={keepOnMainThread}
          /* the board's box: `Gray/700` at radius 10, a 4 % inset rim (the stroke sits inside the
             frame), the drop shadow 0 8 32 at 50 %, 2 px of side padding and 4 under the list —
             grown out of the pill it covers (origin: the pill's centre) */
          className="fixed z-[60] rounded-[10px] bg-[var(--gray-700)] px-0.5 pb-1 shadow-[inset_0_0_0_1px_var(--white-050),0_8px_32px_rgba(39,39,39,0.5)]"
          style={{ left: at.left, top: at.top, width: at.width, transformOrigin: '50% 20px' }}
        >
          {!reduce && <span className="glass-glint" aria-hidden />}
          <motion.div variants={popoverContent} onUpdate={keepOnMainThread}>
            {/* the field, 47 + its 1 px rule: the search glyph at 12, the route at 48 on the pill's
                old line, 16 of air at the right; its text box is 15/1.7 under 3 px, as drawn */}
            <div className="flex h-[47px] items-center gap-3 pl-3 pr-4" data-page-field>
              <GlyphSearch24 className="flex-none text-[var(--white-320)]" />
              <span className="flex min-w-0 flex-1 pt-[3px]">
                <input
                  ref={input}
                  data-page-input
                  data-prefill={touched ? undefined : ''}
                  defaultValue=""
                  onChange={(e) => write(e.target.value)}
                  onKeyDown={onFieldKey}
                  placeholder={t({ en: 'Find page or enter path', uk: 'Знайти сторінку або ввести шлях' })}
                  spellCheck={false}
                  autoComplete="off"
                  className="h-[25.5px] min-w-0 flex-1 bg-transparent text-[15px] leading-[1.7] text-[#c7c7cd] outline-none placeholder:text-[var(--white-480)]"
                />
              </span>
            </div>
            <div className="h-px bg-[var(--white-100)]" aria-hidden />
            {/* the list: five rows show, the rest scroll beside the drawn bar */}
            {/* 4 of air under the rule OUTSIDE the scroll area: the drawn bar measures its 4 px
                inset from the scroller's own top, as the board's column does */}
            <div className="pt-1">
            <ScrollArea
              innerClassName={`max-h-[244px] ${scrolls ? 'pr-[10px]' : ''}`}
              thumb="light"
              thumbClassName="scroll-thumb--drawn"
              onMetrics={(m) => { const on = m.extent - m.visible > 1; if (on !== scrolls) setScrolls(on) }}
            >
              <div ref={list} className="flex flex-col gap-px">
                {items.map((item, i) => {
                  const isPage = item.kind === 'page'
                  const path = isPage ? item.page.path : item.path
                  const isCurrent = isPage && item.page.path === normalizePath(currentPath)
                  const isActive = i === clampedActive
                  return (
                    <button
                      key={isPage ? item.page.id : `goto:${item.path}`}
                      type="button"
                      role="option"
                      aria-selected={isCurrent}
                      data-page-row={path}
                      data-page-index={i}
                      data-active={isActive || undefined}
                      data-current={isCurrent || undefined}
                      data-page-goto={isPage ? undefined : ''}
                      /* the highlight follows the pointer, as it does in the recording — one
                         highlight for mouse and keyboard, so ↓ continues from where the pointer is */
                      onPointerMove={() => { if (!isActive) setActive(i) }}
                      onClick={() => pick(item)}
                      /* the kit's `-2 density` item: 48, radius 8, 12 in, a 24 leading slot, 12 to the
                         label; the highlighted row wears `Neutral Alpha/100` */
                      className={`press-bloom flex h-12 w-full flex-none items-center gap-3 rounded-[8px] px-3 text-left transition-colors duration-[var(--dur-fast)] ease-std ${
                        isActive ? 'bg-[var(--white-100)]' : ''
                      }`}
                    >
                      <span className="grid h-6 w-6 flex-none place-items-center text-white" data-page-lead>
                        {isCurrent && <GlyphCheck24 />}
                        {!isPage && <IconArrowRight size={20} />}
                      </span>
                      {/* the route, as drawn — Semibold on the page the preview stands on */}
                      <span className={`min-w-0 flex-1 truncate text-[15px] leading-6 text-white ${isCurrent ? 'font-semibold' : ''}`} data-page-text>
                        {isPage ? item.page.path : t({ en: `Go to ${item.path}`, uk: `Перейти на ${item.path}` })}
                      </span>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
