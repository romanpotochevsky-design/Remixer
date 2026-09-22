/**
 * THE CLOUD WINDOW — Figma 30816:49569 ("Website Builder / Image Library / Expanded view").
 *
 * Opened by the Cloud button in the right rail, it takes the canvas the way the domains
 * dashboard and the plan document do: a surface in place of the site, not a modal over it
 * (`state/ui.ts`, `Surface`). It is the site's backend in one screen — the databases behind
 * the page, plus the rooms the board names but does not draw: Emails · Secrets · Users ·
 * Storage.
 *
 * ── WHAT THE BOARD SAYS, AND WHERE ITS NUMBERS COME FROM ─────────────────────────────
 *
 * Window 1983×1112 sitting in a canvas area of 1991×1114 — i.e. inset 8 on the left, flush
 * on the right and top. Our `<main>` already carries exactly that (`pb-2 pl-2`), so this
 * window needs no inset of its own; it mounts like `DomainsSurface` and inherits it.
 *
 *   Menu 264 │ content column (flex-1; 1719 on the board's 2560 screen)
 *            ├── Top bar 48 — one button, the close, at the right
 *            ├── Header 134 = Top 87 + column headings 47
 *            └── Page — pt-8, then the list in a px-24 container, the scrollbar 10 under it
 *
 * ⚠️ COLOURS READ IN THE DARK THEME ONLY. `get_design_context` resolves the light theme:
 * it prints `Text/Default/Default` as #09090b (black-on-black here) and the close button's
 * hairline as `rgba(9,9,11,0.08)`. In the dark theme those are #ffffff and 8% WHITE. The
 * same trap the brief panel, the checkout sheet and the Publish panel each paid for once.
 *
 * ⚠️ THE WINDOW'S OWN FILL IS #1f1f22 (`--gray-850`), and the evidence is the one opaque
 * number on the board: every row's action block fades `rgba(31,31,34,0) → #1f1f22`. A fade
 * that hides text has to END in the colour behind the text, and no ancestor of the row
 * carries a fill — so that literal IS the window body. (The Window node's own export is too
 * large to fetch and figma.com assets are refused by the proxy, so the frame's radius,
 * border and shadow are the house window chrome — radius 16, `--gray-800` hairline, the
 * same double shadow `DomainsSurface` has carried since 27085:106964.)
 *
 * ⚠️ THE PAGE'S `border-r` IS NOT DRAWN HERE. The board puts a `Gray/800` right border on
 * the Page, whose right edge IS the window's right edge — so in CSS it would land on top of
 * the window's own hairline and read as a 2px rail. Fourth time this project has met the
 * doubled stroke (generation card, plan page block, connection card): the cure is to let
 * one line do the work, not to stack two.
 *
 * ── WHAT IS REPRODUCED AS DRAWN, AND FLAGGED ─────────────────────────────────────────
 *
 * · The column headings sit 4px LEFT of their data — headings `pl-36` inside the content
 *   column, data at 24 (the list's `px-24`) + 16 (the row's `pl-16`) = 40. The offset is
 *   the same −4 on every one of the seven columns, so it is the mock's slop, not a design
 *   with meaning. Left as drawn; raised with the designer.
 * · The board's `image_url` box is 240 wide and holds a 408-wide text that spills out of it.
 *   A box narrower than its own text is a mock artifact and it makes the scroll extent lie,
 *   so the BOX here is the 408 the text actually occupies. Nothing visible moves: the box
 *   has neither fill nor border, and the text still truncates at 408, exactly as drawn.
 * · Five identical placeholder rows ("Ambre Sacré" — a perfume named, a shoe pictured, a
 *   home category, pasted five times) under a table titled "Blogs" while the menu selects
 *   "Blog". The chrome is the board's to the pixel; the DATA is the demo customer's, i.e.
 *   the site standing in the preview (`data/cloud.ts` explains it in full).
 * · The two row actions are ONE placeholder glyph used twice on the board (same asset id for
 *   both buttons). They are edit and delete here — the two things a row in a table affords.
 * · The scrollbar is drawn always. It is rendered only when the table can actually scroll:
 *   a control with nothing to do is better absent than dead (the designer's rule, on the
 *   right rail and on Publish). On the board's 2560 screen it scrolls; on ours it usually
 *   does too — the row wants 1553.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useUI } from '@/state/ui'
import { useT, type Text } from '@/i18n'
import { ScrollArea } from '@/ui/ScrollArea'
import { CLOUD_TABLES, type CloudRow } from '@/data/cloud'
import {
  IconCloud, IconDatabase, IconMail, IconSecrets, IconUsers, IconStorage,
  IconFilter, IconAdd, IconTrash, IconPencil, IconSearch, IconCloseM,
} from '@/ui/icons'


/* ─────────────────────────────── geometry, off the board ─────────────────────────────── */

/** Data columns, in row space: `pl-16` then each block, then `pr-8`. */
const COL = { thumb: 80, name: 240, desc: 240, price: 253, category: 252, size: 56, url: 408 }
/** 16 + 80 + 240 + 240 + 253 + 252 + 56 + 408 + 8 — what one row needs before it scrolls. */
const ROW_W = 16 + COL.thumb + COL.name + COL.desc + COL.price + COL.category + COL.size + COL.url + 8

/** Column headings (30816:52093): `pl-36`, every label left-aligned at its block. */
const HEADINGS: { key: string; w: number; label: Text }[] = [
  { key: 'image', w: 80, label: { en: 'Image', uk: 'Зображення' } },
  { key: 'name', w: 240, label: { en: 'Name', uk: 'Назва' } },
  { key: 'description', w: 446, label: { en: 'Description', uk: 'Опис' } },
  { key: 'price', w: 167, label: { en: 'Price', uk: 'Ціна' } },
  { key: 'category', w: 132, label: { en: 'Category', uk: 'Категорія' } },
  /* `size` and `image_url` are column NAMES in the customer's table, not our labels —
     they stay lowercase and snake_cased in both locales, as the board writes them. */
  { key: 'size', w: 56, label: { en: 'size', uk: 'size' } },
  { key: 'image_url', w: 56, label: { en: 'image_url', uk: 'image_url' } },
]

/** The menu's second group — named by the board, all four still empty rooms. */
const ROOMS = [
  { id: 'emails', Icon: IconMail, label: { en: 'Emails', uk: 'Пошта' } as Text },
  { id: 'secrets', Icon: IconSecrets, label: { en: 'Secrets', uk: 'Секрети' } as Text },
  { id: 'users', Icon: IconUsers, label: { en: 'Users', uk: 'Користувачі' } as Text },
  { id: 'storage', Icon: IconStorage, label: { en: 'Storage', uk: 'Сховище' } as Text },
]


/* ────────────────────────────────────── the menu ─────────────────────────────────────── */

/** A 48-tall top-level row: 24 icon box holding a 20 glyph, then the label. */
function MenuRow({ Icon, label, strong, onClick }: {
  Icon: (p: { size?: number; className?: string }) => JSX.Element
  label: string
  strong?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-cloud-menurow
      className="flex h-12 w-full items-center gap-3 rounded-[12px] pl-3 pr-4 text-left transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-050)]"
    >
      <span className="grid h-6 w-6 flex-none place-items-center overflow-hidden text-white">
        <Icon size={20} />
      </span>
      <span className={`text-[15px] leading-none text-white${strong ? ' font-semibold' : ''}`}>{label}</span>
    </button>
  )
}

/**
 * A 40-tall database row. The selected one is filled with the module's accent at half
 * strength and set in semibold; the others are regular at 48% white. The 1px difference in
 * their left padding (16 selected, 15 not) is the board's, kept as drawn.
 */
function TableRow({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={on}
      data-cloud-db
      className={
        on
          ? 'flex h-10 w-full items-center rounded-[10px] bg-[rgba(126,87,194,0.5)] px-4 text-left text-[14px] font-semibold leading-none text-white'
          : 'flex h-10 w-full items-center rounded-[10px] pl-[15px] pr-4 text-left text-[14px] leading-none text-[var(--white-480)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-050)] hover:text-white'
      }
    >
      {label}
    </button>
  )
}


/* ───────────────────────────────────── the table ─────────────────────────────────────── */

function Row({ row, last, t }: { row: CloudRow; last: boolean; t: (x: Text) => string }) {
  return (
    <div
      data-cloud-row
      className={`flex h-[72px] w-full items-center pl-4 pr-2${last ? '' : ' border-b border-[var(--gray-750)]'}`}
    >
      {/* the thumbnail: a white 48 tile with the 42 image inside it, as drawn. We ship no
          photographs, so the "image" is the dish's own tint and mark from the site. */}
      <div className="flex flex-none items-center" style={{ width: COL.thumb }}>
        <div className="grid h-12 w-12 place-items-center rounded-[8px] bg-white">
          <div
            className="grid h-[42px] w-[42px] place-items-center text-[22px] leading-none"
            style={{ background: row.tint }}
            aria-hidden
          >
            {row.emoji}
          </div>
        </div>
      </div>
      <div className="flex-none truncate pr-4 text-[15px] font-medium text-white" style={{ width: COL.name }}>
        {row.name}
      </div>
      <div className="flex-none truncate text-[15px] text-[var(--white-480)]" style={{ width: COL.desc }}>
        {row.description}
      </div>
      <div className="flex flex-none justify-end text-[15px] text-[var(--white-480)]" style={{ width: COL.price }}>
        {row.price}
      </div>
      <div className="flex-none pl-[120px] text-[15px] text-[var(--white-480)]" style={{ width: COL.category }}>
        {row.category}
      </div>
      <div className="flex-none text-[15px] text-[var(--white-480)]" style={{ width: COL.size }}>
        {row.size}
      </div>
      <div className="flex-none" style={{ width: COL.url }}>
        <span className="block w-[408px] truncate text-[15px] text-[var(--white-480)]">{row.imageUrl}</span>
      </div>

      {/*
        * THE ACTIONS RIDE THE RIGHT EDGE. The board draws them absolutely, 8 from the row's
        * right, over a fade that ends in the window's fill — which is the sticky-action-column
        * idiom drawn in a mock that never scrolls. Here the row really does scroll, so they are
        * `sticky right-2`; the negative margin keeps them out of the row's width, so they sit
        * exactly 8 from its end when the table is scrolled home.
        */}
      <div
        className="sticky right-2 flex h-10 flex-none items-center justify-end gap-2.5"
        style={{
          width: 155,
          marginLeft: -155,
          background: 'linear-gradient(to right, rgba(31,31,34,0) 0%, var(--gray-850) 38.942%)',
        }}
      >
        <button
          type="button"
          aria-label={`${t({ en: 'Edit', uk: 'Редагувати' })} ${row.name}`}
          className="press-bloom grid h-10 w-10 place-items-center rounded-[10px] text-[var(--white-480)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white"
        >
          <IconPencil size={24} />
        </button>
        <button
          type="button"
          aria-label={`${t({ en: 'Delete', uk: 'Видалити' })} ${row.name}`}
          className="press-bloom grid h-10 w-10 place-items-center rounded-[10px] text-[var(--white-480)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white"
        >
          <IconTrash size={24} />
        </button>
      </div>
    </div>
  )
}

/**
 * The drawn horizontal scrollbar (30816:52255): an 8 track in `Gray/750` with a 6 thumb in
 * `Gray/600`, both fully rounded, sitting 10 under the list and exactly as wide as it.
 *
 * It is a real control, not an indicator: the thumb drags. Per-frame it writes `width` and
 * `transform` straight to the element — never through React, which would re-render every
 * row of the table on every scroll event.
 */
function ScrollBar({ scroller }: { scroller: React.RefObject<HTMLDivElement> }) {
  const track = useRef<HTMLDivElement>(null)
  const thumb = useRef<HTMLElement>(null)
  const [live, setLive] = useState(false)

  const paint = useCallback(() => {
    const s = scroller.current
    const tr = track.current
    const th = thumb.current
    if (!s || !tr || !th) return
    const can = s.scrollWidth - s.clientWidth > 1
    setLive(can)
    if (!can) return
    const w = tr.clientWidth
    const ratio = s.clientWidth / s.scrollWidth
    const tw = Math.max(32, w * ratio)
    th.style.width = `${tw}px`
    th.style.transform = `translateX(${(s.scrollLeft / (s.scrollWidth - s.clientWidth)) * (w - tw)}px)`
  }, [scroller])

  useLayoutEffect(() => {
    const s = scroller.current
    if (!s) return
    paint()
    s.addEventListener('scroll', paint, { passive: true })
    const ro = new ResizeObserver(paint)
    ro.observe(s)
    return () => { s.removeEventListener('scroll', paint); ro.disconnect() }
  }, [paint, scroller])

  const drag = (e: React.PointerEvent) => {
    const s = scroller.current
    const tr = track.current
    const th = thumb.current
    if (!s || !tr || !th) return
    e.preventDefault()
    const x0 = e.clientX
    const left0 = s.scrollLeft
    const span = tr.clientWidth - th.clientWidth
    const move = (ev: PointerEvent) => {
      if (span <= 0) return
      s.scrollLeft = left0 + ((ev.clientX - x0) / span) * (s.scrollWidth - s.clientWidth)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      ref={track}
      data-cloud-scrollbar
      className={`flex h-2 w-full flex-none items-center rounded-full bg-[var(--gray-750)] px-px${live ? '' : ' invisible'}`}
    >
      <b ref={thumb} onPointerDown={drag} className="block h-1.5 cursor-grab rounded-full bg-[var(--gray-600)]" />
    </div>
  )
}


/* ───────────────────────────────────── the window ────────────────────────────────────── */

export function CloudSurface() {
  const { t } = useT()
  const closeSurface = useUI((s) => s.closeSurface)
  const [room, setRoom] = useState<string>(CLOUD_TABLES[0].id)
  const [query, setQuery] = useState('')
  const scroller = useRef<HTMLDivElement>(null)
  const headRow = useRef<HTMLDivElement>(null)

  const table = CLOUD_TABLES.find((x) => x.id === room) ?? null
  const q = query.trim().toLowerCase()
  const rows = table
    ? table.rows.filter((r) => !q || `${r.name} ${r.description} ${r.category}`.toLowerCase().includes(q))
    : []

  /* The headings live in the header and the data in the page, so the one horizontal scroll
     has to be handed up: the heading row rides the list's `scrollLeft` on a transform. Read
     straight from the DOM on the scroll event — a table that re-rendered its header on every
     scroll frame would be the per-frame paint the performance contract forbids. */
  useEffect(() => {
    const s = scroller.current
    if (!s) return
    const sync = () => {
      if (headRow.current) headRow.current.style.transform = `translateX(${-s.scrollLeft}px)`
    }
    sync()
    s.addEventListener('scroll', sync, { passive: true })
    return () => s.removeEventListener('scroll', sync)
  }, [room])

  /* Esc closes, like every other surface and sheet in the shell. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSurface() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeSurface])

  const title = table ? table.title : t(ROOMS.find((r) => r.id === room)?.label ?? { en: 'Cloud', uk: 'Cloud' })

  return (
    <div
      data-cloud-window
      className="flex h-full overflow-hidden rounded-[16px] border border-[var(--gray-800)]"
      style={{ background: 'var(--gray-850)', boxShadow: '0px 8px 8px rgba(0,0,0,0.12), 0px 56px 72px rgba(0,0,0,0.12)' }}
    >
      {/* ───────────────────────────── menu, 264 ───────────────────────────── */}
      {/* ⚠️ NOT aria-label="Cloud": that is the rail BUTTON's name, and two things answering
          to one name is how a query means the wrong element (it cost a check run here). */}
      <nav className="flex w-[264px] flex-none flex-col py-2 pl-2" aria-label="Cloud menu">
        {/* Conteiner 256: 8% white on 8% white — the stroke sits INSIDE the 256 on the
            board, so it is an inset shadow here and the box stays 256 (the law this
            project has paid for on every card it has drawn). */}
        <div data-cloud-menu className="flex min-h-0 flex-1 flex-col rounded-[14px] bg-[var(--white-100)] shadow-[inset_0_0_0_1px_var(--white-100)]">
          <div className="flex h-[84px] flex-none items-center gap-2.5 pl-5">
            <IconCloud size={25} className="flex-none text-[#7e57c2]" />
            <span className="font-display text-[24px] font-bold leading-[1.2] text-white">Cloud</span>
          </div>

          <ScrollArea className="min-h-0 flex-1" thumb="light">
            <div className="flex flex-col gap-[3px] px-1.5 pb-2">
              {/* the database card */}
              <div className="pb-[5px]">
                <div className="rounded-[16px] bg-[var(--white-100)]">
                  <div className="p-1">
                    <MenuRow Icon={IconDatabase} label={t({ en: 'Database', uk: 'База даних' })} strong />
                  </div>
                  <div className="flex flex-col gap-1 rounded-[12px] border-t border-[var(--white-100)] p-1.5">
                    {CLOUD_TABLES.map((x) => (
                      <TableRow key={x.id} label={x.name} on={room === x.id} onClick={() => setRoom(x.id)} />
                    ))}
                  </div>
                  <div className="px-3 pb-3 pt-2.5">
                    {/*
                      * `pl-36` plus the 36-wide glyph box on the right is how the board keeps
                      * the label optically centred while the plus hangs off the end — the left
                      * padding is the mirror of the trailing box, not a guess.
                      */}
                    <button
                      type="button"
                      className="press-bloom flex h-9 w-full items-center overflow-hidden rounded-[10px] bg-[#09090bcc] pl-9 transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#09090b]"
                    >
                      <span className="flex-1 text-center text-[14px] font-semibold leading-none text-white">
                        {t({ en: 'Add database', uk: 'Додати базу' })}
                      </span>
                      <span className="grid h-9 w-9 flex-none place-items-center text-white">
                        <IconAdd size={24} />
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* the rooms the board names but does not draw */}
              <div className="flex flex-col gap-[3px] px-1">
                {ROOMS.map(({ id, Icon, label }) => (
                  <MenuRow key={id} Icon={Icon} label={t(label)} onClick={() => setRoom(id)} />
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>
      </nav>

      {/* ──────────────────────────── content column ───────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* top bar 48: one button, and it is the way out */}
        <div className="flex h-12 flex-none items-center justify-end pr-2">
          <button
            type="button"
            onClick={closeSurface}
            aria-label={t({ en: 'Close', uk: 'Закрити' })}
            data-cloud-close
            className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#09090b7a] text-white shadow-[inset_0_0_0_1px_var(--white-100)] backdrop-blur-[16px] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#09090bcc]"
          >
            <IconCloseM size={24} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {/* header: title · search · actions, then the column headings */}
          <div className="flex-none">
            <div className="flex h-[87px] items-center pl-9 pr-6">
              <h2 className="flex-none font-display text-[32px] font-bold leading-[1.2] text-white">{title}</h2>
              <div className="ml-14 flex min-w-0 flex-1 justify-center">
                <label className="flex h-10 w-full min-w-0 max-w-[400px] items-center gap-4 rounded-full bg-[var(--gray-900)] pl-2 pr-[7px]">
                  <span className="grid h-6 w-6 flex-none place-items-center text-[var(--gray-500)]">
                    <IconSearch size={24} />
                  </span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t({ en: 'Search', uk: 'Пошук' })}
                    className="min-w-0 flex-1 bg-transparent pt-px text-[15px] text-white outline-none placeholder:text-[var(--gray-500)]"
                  />
                </label>
              </div>
              <div className="ml-4 flex flex-none items-center gap-4">
                <button
                  type="button"
                  aria-label={t({ en: 'Filter', uk: 'Фільтр' })}
                  className="press-bloom grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--white-100)] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-200)]"
                >
                  <IconFilter size={24} />
                </button>
                <button
                  type="button"
                  className="press-bloom flex h-10 items-center gap-[7px] rounded-[10px] bg-[#7e57c2] pl-5 pr-2 text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#8d68cd]"
                >
                  <span className="text-[14px] font-semibold leading-none">
                    {t({ en: 'Add an object', uk: 'Додати обʼєкт' })}
                  </span>
                  <IconAdd size={24} />
                </button>
              </div>
            </div>

            {table && (
              <div data-cloud-headings className="h-[47px] overflow-hidden border-t border-[var(--gray-750)]">
                <div ref={headRow} className="flex h-full w-max min-w-full items-center pl-9">
                  {HEADINGS.map((h) => (
                    <span
                      key={h.key}
                      className="flex-none [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] text-[12px] font-medium leading-[1.2] text-[#ffffff52]"
                      style={{ width: h.w }}
                    >
                      {t(h.label)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* page */}
          <div data-cloud-page className="min-h-0 flex-1 border-t border-[var(--gray-800)] pt-2">
            <ScrollArea className="h-full" thumb="light">
              {table ? (
                <div className="flex flex-col gap-2.5 px-6">
                  <div ref={scroller} data-cloud-list className="w-full overflow-x-auto">
                    <div className="flex w-max min-w-full flex-col" style={{ minWidth: ROW_W }}>
                      {rows.map((r, i) => (
                        <Row key={r.id} row={r} last={i === rows.length - 1} t={t} />
                      ))}
                    </div>
                  </div>
                  {rows.length > 0 && <ScrollBar scroller={scroller} />}
                  {rows.length === 0 && (
                    <p className="px-4 py-10 text-[15px] text-[var(--white-480)]">
                      {t({ en: 'Nothing matches that.', uk: 'Нічого не знайшлося.' })}
                    </p>
                  )}
                </div>
              ) : (
                <p className="px-9 py-10 text-[15px] text-[var(--white-480)]">
                  {t({ en: 'Nothing here yet.', uk: 'Тут поки порожньо.' })}
                </p>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}
