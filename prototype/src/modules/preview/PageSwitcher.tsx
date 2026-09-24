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
 * WHAT IS OURS: the rows show the pages' NAMES (Home, About…), not routes — a Remixer customer
 * knows the site by the pages the Build Plan named, and the plan, the generation card and this
 * list are one outline (pages.ts); the route survives in the pill only when the preview stands on
 * an address the outline does not know. The material is the toolbar's glass, the entrance grows
 * out of the pill (motion.ts `pageMenuIn`), hover is the house 8 % wash, the press the house bloom,
 * the rim catches the light on arrival. The pill keeps the board's 280 × 40 box (Figma
 * 25819:143144, "project button") — what changed is what stands in it.
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
import { IconArrowRight, IconCheck, IconChevronDown, IconClose, IconEnter, IconPage, IconSearch } from '@/ui/icons'
import { pageMenuIn, pageMenuInFade, popoverContent } from '@/ui/motion'
import { findPage, matchPages, normalizePath, sitePages, type SitePage } from './pages'

/** Air between the pill's bottom edge and the menu's top. */
const GAP = 6
/** Rows are 40 tall; eight show before the list scrolls under the field (Lovable shows eight). */
const ROW_H = 40
const VISIBLE_ROWS = 8
const keepOnMainThread = () => {}

type Item = { kind: 'page'; page: SitePage } | { kind: 'goto'; path: string }

export function PageSwitcher() {
  const { t } = useT()
  const answers = useWorld((s) => s.world.brief.answers)
  const outline = useWorld((s) => s.world.planEdits.outline)
  const previewPath = useUI((s) => s.previewPath)
  const setPreviewPath = useUI((s) => s.setPreviewPath)
  const pages = useMemo(() => sitePages(answers, outline), [answers, outline])
  const current = findPage(pages, previewPath)
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
          {/* the current page's name; an address the outline does not know prints as itself */}
          <span className="truncate text-[15px] font-semibold leading-[1.4]" data-page-label>
            {current ? t(current.name) : previewPath}
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

  /* the menu hangs under the pill: left edge to left edge, the pill's width, GAP below it */
  useLayoutEffect(() => {
    if (!open) return
    const measure = () => {
      const r = anchor.current?.getBoundingClientRect()
      if (r) setAt({ left: r.left, top: r.bottom + GAP, width: r.width })
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
          /* the toolbar's glass, grown from the pill it hangs under (origin at the top edge) */
          className="liquid-glass fixed z-[60] origin-top rounded-[12px] p-1"
          style={{ left: at.left, top: at.top, width: at.width }}
        >
          {!reduce && <span className="glass-glint" aria-hidden />}
          <motion.div variants={popoverContent} onUpdate={keepOnMainThread}>
            {/* the field: magnifier · the route, selected whole · ✕ while there is text */}
            <div className="flex h-10 items-center gap-2 rounded-[8px] px-2">
              <span className="grid h-5 w-5 flex-none place-items-center text-[var(--white-400)]">
                <IconSearch size={16} />
              </span>
              <input
                ref={input}
                data-page-input
                defaultValue=""
                onChange={(e) => write(e.target.value)}
                onKeyDown={onFieldKey}
                placeholder={t({ en: 'Find page or enter path', uk: 'Знайти сторінку або ввести шлях' })}
                spellCheck={false}
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-[14px] leading-5 text-white outline-none placeholder:text-[var(--white-400)]"
              />
              {query && (
                <button
                  type="button"
                  data-page-clear
                  aria-label={t({ en: 'Clear', uk: 'Очистити' })}
                  onClick={() => { write(''); input.current?.focus() }}
                  className="grid h-6 w-6 flex-none place-items-center rounded-full text-[var(--white-400)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white"
                >
                  <IconClose size={10} />
                </button>
              )}
            </div>
            <div className="mx-2 h-px bg-[var(--glass-divider)]" aria-hidden />
            {/* the list: eight rows show, the rest scroll under the field */}
            <ScrollArea className="mt-1" innerClassName="p-0" thumb="light" style={{ maxHeight: ROW_H * VISIBLE_ROWS }}>
              <div ref={list} className="flex flex-col">
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
                      className={`press-bloom flex h-10 w-full flex-none items-center gap-2 rounded-[8px] px-2 text-left transition-colors duration-[var(--dur-fast)] ease-std ${
                        isActive ? 'bg-[var(--white-100)]' : ''
                      }`}
                    >
                      <span className="grid h-5 w-5 flex-none place-items-center text-white">
                        {isCurrent && <IconCheck size={14} />}
                        {!isPage && <IconArrowRight size={16} />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[14px] leading-5 text-white">
                        {isPage ? t(item.page.name) : t({ en: `Go to ${item.path}`, uk: `Перейти на ${item.path}` })}
                      </span>
                      <span className="grid h-5 w-5 flex-none place-items-center text-[var(--white-400)]">
                        {isActive && <IconEnter size={16} />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
