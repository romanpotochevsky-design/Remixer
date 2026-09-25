/**
 * THE PAGE SWITCHER — the canvas toolbar's centre control, in place of the address chip
 * (designer, 25.09.2026, with a 30 s screen recording of Lovable's preview toolbar: «вместо этой
 * кнопки мы по классике хотим туда вставить переключатель страниц сайта… нужно сделать точно так
 * же логику работы этого переключателя как у lovable… саму логику и UX делаем как у lovable на
 * видео один в один, но дизайн, анимации и эффекты используем наши, крутые»).
 *
 * WHAT THE RECORDING SHOWS, frame by frame (scratchpad/lov-pages, 10 fps), and what each beat is
 * here:
 *  · a pill in the toolbar's centre reads the CURRENT ROUTE with a chevron; pressing it toggles a
 *    menu hung under the pill, left-aligned and as wide as the pill; the chevron flips while open;
 *  · the menu is a SEARCH FIELD on top (magnifier, placeholder «Find page or enter path», a ✕ that
 *    clears) over a LIST of routes; the current one carries a check; the field is PRE-FILLED with
 *    the current route, fully selected, and that pre-fill does NOT filter the list — typing does;
 *  · the list scrolls under the field, which stays put; the highlighted row follows the pointer and
 *    carries a glyph at its right edge; the first row is highlighted when the menu opens
 *    (cmdk's law), ↑ ↓ move it, Enter takes it, Esc closes;
 *  · pressing a row closes the menu, the pill reads the new route AT ONCE and the preview follows
 *    (their iframe blanks for ~600 ms while it loads — we have no iframe, the site hands over);
 *  · typing something that matches no route collapses the list to ONE row, «Go to <what you
 *    typed>», which navigates to that path — their app answers with its 404 route, our site with
 *    its own not-found page;
 *  · the pill FOLLOWS THE SITE: when the app itself navigates (their /auth redirected to /admin),
 *    the pill updates. Here a link inside the preview writes the same `ui.previewPath`.
 *
 * THE MENU HAS ITS OWN BOARD — Figma 31076:31629, the frame `Menu` 31076:37714 (designer,
 * 25.09.2026: «вот макет дропдауна и расположения страниц… сделай дизайн перфект пиксель как в
 * макете»), and it replaced what this file had invented around Lovable's logic:
 *  · it sits ON the pill, corner on corner (the board's `Menu` lies at the pill's own x and y, 280
 *    wide) — the search field takes the pill's place, the list hangs below; it grows out of the
 *    pill it covers (motion.ts `pageMenuIn`), the attach menu's law over its «+»;
 *  · it is SOLID `Gray/700` under a 4 % inset rim at radius 10 with the board's shadow — not the
 *    toolbar's glass we had put on it;
 *  · the field is 47 + a 1 px `Neutral Alpha/100` rule: the board's search glyph at 32 % white,
 *    the route in 15/1.7 Proxima at `Background/Neutral/500` (#c7c7cd in the dark theme), no ✕;
 *  · the rows are the kit's `-2 density` items — 48 tall, radius 8, 12 in, a 24 leading slot, 15/24
 *    — and they print ROUTES: `/`, `/about`… The current page wears the check and Semibold; the
 *    highlighted row wears `Neutral Alpha/100` (8 % white). No trailing glyph — the board draws
 *    none. This REPLACES the names (Home, About…) the designer had picked the same morning over
 *    the alternatives shown him; the board is the later word. The pill follows the list: it prints
 *    the route too, as Lovable's does;
 *  · five rows show, then the list scrolls beside a DRAWN bar — 4 wide in its own 10 px column,
 *    24 % white, always on while there is something to scroll.
 * Hover is still the pointer's (one highlight for mouse and keyboard), the press the house bloom,
 * the rim catches the light on arrival. The pill keeps the board's 280 × 40 box (Figma
 * 25819:143144, "project button").
 *
 * ⚠️ Every fade here is on the main thread (`onUpdate` stub): a composited fade hands the element
 * back with its pre-animation opacity for one frame between `finish` and the next render — the
 * attach menu and the Publish panel's rolling verb both paid for that frame before this was built.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useUI } from '@/state/ui'
import { useT } from '@/i18n'
import { ScrollArea } from '@/ui/ScrollArea'
import { IconArrowRight, IconChevronDown, IconPage } from '@/ui/icons'
import { pageMenuIn, pageMenuInFade, popoverContent } from '@/ui/motion'
import { matchPages, normalizePath, sitePages, type SitePage } from './pages'
import { GlyphCheck24, GlyphSearch24 } from './boardIcons'

/** The kit's `-2 density` rows are 48 with 1 px between them; the board's list window is five of
 *  them (5 × 48 + 4 = 244) before it scrolls. */
const ROW_H = 48
const VISIBLE_ROWS = 5
/* = 244, the literal `max-h-[244px]` on the scroller below (Tailwind needs the literal) */
export const LIST_MAX = VISIBLE_ROWS * ROW_H + (VISIBLE_ROWS - 1)
const keepOnMainThread = () => {}

type Item = { kind: 'page'; page: SitePage } | { kind: 'goto'; path: string }

export function PageSwitcher() {
  const { t } = useT()
  const answers = useWorld((s) => s.world.brief.answers)
  const outline = useWorld((s) => s.world.planEdits.outline)
  const previewPath = useUI((s) => s.previewPath)
  const setPreviewPath = useUI((s) => s.setPreviewPath)
  const pages = useMemo(() => sitePages(answers, outline), [answers, outline])
  const [open, setOpen] = useState(false)
  const pill = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        ref={pill}
        type="button"
        data-page-switch
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t({ en: 'Page', uk: 'Сторінка' })}
        onClick={() => setOpen((o) => !o)}
        /* the board's project-button box (280 × 40, radius 10, NA/200 rim), the house wash on hover
           and the house bloom on press */
        className={`press-bloom mx-2 flex h-10 w-[280px] min-w-0 shrink items-center justify-between rounded-[10px] border border-[var(--white-200)] px-2 transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] ${
          open ? 'bg-[var(--white-100)]' : ''
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid h-6 w-6 flex-none place-items-center text-[var(--white-400)]">
            <IconPage size={20} />
          </span>
          {/* the route the preview stands on — the list prints routes (its board), so the pill does */}
          <span className="truncate text-[15px] font-semibold leading-[1.4]" data-page-label>
            {normalizePath(previewPath)}
          </span>
        </span>
        <span
          data-page-chevron
          className="grid h-6 w-6 flex-none place-items-center text-[var(--white-400)]"
          /* the chevron flips while the menu is up — Lovable's pill does the same */
          style={{ transform: open ? 'scaleY(-1)' : undefined, transition: 'transform .2s var(--ease-std)' }}
        >
          <IconChevronDown size={18} />
        </span>
      </button>
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
  anchor: React.RefObject<HTMLButtonElement | null>
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
