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
 * ⚠️ TWO SURFACES, NOT ONE (corrected 22.09.2026 after the designer's «у тебя не все совпадает с
 * макетом»). The window BASE (`Dashboard` 30816:52018) is 24 % black over `--gray-900` — the house
 * window recipe `DomainsSurface` has carried since 27085:106964, radius 16, `--gray-800` hairline,
 * the same double shadow; written flat as `--window-base` #141417 since 24.09.2026. On it lies the
 * PAGE SHEET (`Page content` 30816:55869 → 30911:59222): `Neutral Alpha/50` = 4 % white over that
 * base = `--window-lift` #1d1d20, a 1px hairline of 8 % white along its top and a 6px radius at its
 * top-right corner. The base shows exactly where the board shows it — behind the top bar and behind
 * the menu column.
 * The first build derived a single flat `--gray-850` from the one opaque literal in the leaves
 * (the row-action fade, then misread as `rgba(31,31,34,0) → #1f1f22`) and lost both the strip and the hairline:
 * leaves carry no surfaces — those live on the wrappers, whose export had been skipped because
 * it exceeded the MCP response size (it is saved to a file; slice it, do not route around it).
 * The fade ends in the SHEET's colour, whatever it is — #18181b while the sheet was `--gray-900`
 * (board 30816:52156), #1d1d20 now (30911:59315). Both now read the one token.
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
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react'
import { EXIT, MENU_SPRING, menuGlass, menuGlassFade, verbRoll, verbRollFade } from '@/ui/motion'
import { useUI } from '@/state/ui'
import { usePaneSettle } from '@/App'
import { useT, type Text } from '@/i18n'
import { ScrollArea } from '@/ui/ScrollArea'
import { CLOUD_TABLES, type CloudRow } from '@/data/cloud'
import {
  IconCloud, IconDatabase, IconMail, IconSecrets, IconUsers, IconStorage,
  IconFilter, IconAdd, IconTrash, IconPencil, IconSearchM, IconCloseM,
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

const FIRST_TABLE = CLOUD_TABLES[0].id
const isTable = (id: string) => CLOUD_TABLES.some((x) => x.id === id)
/** The board's 5 under the Database card, between it and the rooms — it folds with the card. */
const CARD_GAP = 5
/** The selection plate: the module's accent at half strength (30816:52025, the selected sub-row). */
const PLATE = 'rgba(126,87,194,0.5)'
/** Keeps a motion element's fades on the main thread (see the verb roll in PublishPanel.tsx). */
const noop = () => {}

type Glyph = (p: { size?: number; className?: string }) => JSX.Element

/**
 * A 48-tall top-level row: 24 icon box holding a 20 glyph, then the label. The row that is
 * `on` sits over the flying plate: its glyph goes white and its label semibold. Every other
 * row carries the house hover — 8 % white, the one wash every control in this product wears —
 * and the Google-style press bloom (`press-bloom`, ui/ripple.ts; designer 23.09.2026: «на эти
 * кнопки тоже нужно добавить эффект ховера и клика красивый наш»). The Database header is
 * `strong` in every state, as drawn, and blooms only when pressing it changes something.
 * ⚠️ `relative z-[2]`: the rows paint ABOVE the selection plate (`z-[1]`), which flies under
 * them as a single element — see `CloudMenu`.
 */
function MenuRow({ Icon, label, seat, strong, on, bloom = !on, expanded, onClick }: {
  Icon: Glyph
  label: string
  /** The id the selection plate seats on (`data-cloud-seat`). */
  seat: string
  strong?: boolean
  on?: boolean
  bloom?: boolean
  expanded?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-cloud-menurow
      data-cloud-seat={seat}
      aria-current={on ? 'true' : undefined}
      aria-expanded={expanded}
      className={`relative z-[2] flex h-12 w-full items-center gap-3 rounded-[12px] pl-3 pr-4 text-left transition-colors duration-[var(--dur-fast)] ease-std${
        bloom ? ' press-bloom' : ''}${on ? '' : ' hover:bg-[var(--white-100)]'}`}
    >
      {/* the glyph is `Icon/Default/Secondary` (48% white), a step under its label — the board
          renders it that way and that token is otherwise unclaimed in this window */}
      <span className={`grid h-6 w-6 flex-none place-items-center overflow-hidden transition-colors duration-[var(--dur-fast)] ease-std ${
        on ? 'text-white' : 'text-[var(--white-480)]'}`}>
        <Icon size={20} />
      </span>
      <span className={`text-[15px] leading-none text-white${strong || on ? ' font-semibold' : ''}`}>{label}</span>
    </button>
  )
}

/**
 * A 40-tall database row. The selected one is set in semibold white over the plate; the others
 * are regular at 48% white with the house hover and bloom. The 1px difference in their left
 * padding (16 selected, 15 not) is the board's, kept as drawn. The plate itself is not this
 * row's background any more — it is the one `[data-cloud-plate]` that flies (see `CloudMenu`).
 */
function TableRow({ id, label, on, onClick }: { id: string; label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={on ? 'true' : undefined}
      data-cloud-db
      data-cloud-seat={id}
      className={`relative z-[2] flex h-10 w-full items-center rounded-[10px] text-left text-[14px] leading-none transition-colors duration-[var(--dur-fast)] ease-std ${
        on
          ? 'px-4 font-semibold text-white'
          : 'press-bloom pl-[15px] pr-4 text-[var(--white-480)] hover:bg-[var(--white-100)] hover:text-white'}`}
    >
      {label}
    </button>
  )
}

type Box = { top: number; left: number; width: number; height: number; radius: number }

/** An element's LAYOUT box inside `host` (transforms ignored), summed up the offsetParent chain. */
function boxIn(el: HTMLElement, host: HTMLElement): Box {
  let top = 0
  let left = 0
  let n: HTMLElement | null = el
  while (n && n !== host && host.contains(n)) {
    top += n.offsetTop
    left += n.offsetLeft
    n = n.offsetParent as HTMLElement | null
  }
  return { top, left, width: el.offsetWidth, height: el.offsetHeight, radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0 }
}

/**
 * THE MENU: a Database card that FOLDS, and one selection plate that FLIES.
 *
 * The live editor (designer's recording, 23.09.2026, scratchpad/cloud-menu): clicking Database
 * unfolds a card of tables under it and pushes the rooms down; picking a room folds it back and
 * the rooms jump up — ~5 frames each way, linear, with a ripple artefact on the selected plate.
 * The board (30816:52025) draws only the open card. «Сделать это более плавно и красиво в нашем
 * стиле Apple liquid glass» — so, from `MENU_SPRING` in ui/motion.ts (the law is written there):
 *
 *  · `p` — the fold's progress, 1 open / 0 folded — is THE ONE CLOCK. It writes the clip's
 *    height (p × the content's natural height), the 5px the card keeps under itself (p × 5),
 *    the card's glass (8 % white × p: folded, the Database row is a plain room row, not a group
 *    in a plate) and, past zero, the deficit as a negative bottom margin so the rooms dip a few
 *    pixels past their seat and come back (the Reveal's bounce through zero). All written to
 *    the elements from the value's `change` event, never through React.
 *  · THE PLATE is one absolutely positioned span in the list column (`[data-cloud-plate]`),
 *    flying on the same spring, started on the same tick: top, left, width, height and radius
 *    (40 × r10 on a table row, 48 × r12 on a room row). A room row's seat is where the row will
 *    REST — its offset now, corrected by the fold's remaining travel — so the plate flying down
 *    to it meets the row gliding up to it exactly at the end, on identical normalised curves.
 *    The rows paint above it (`z-[2]` over `z-[1]`); the folding content paints above it too
 *    (`z-[2]` on the glass), so the plate passes UNDER the rows leaving, not over them.
 *  · Pressing Database always means "go to the database": the first table opens (the live
 *    editor lands on its first table too). Pressing the row that is already on is a no-op and
 *    carries no bloom — the flight is the acknowledgement (PlanVariantSwitch's rule).
 *  · While anything moves the column carries `data-cloud-moving`, and CSS keeps rows sliding
 *    under a still cursor from lighting up: hover is a gesture of the cursor, not of the content
 *    (the question dock's rule).
 *  · Folded content is `visibility: hidden` and `inert` only once the edge has come to rest
 *    (`closed`) — flipping it at the start of the fold would take the rows away before they left.
 *  · `.glass-glint` in the module's violet on the card as it unfolds: the rim catches the light
 *    the way every arriving block in this product does.
 *
 * ⚠️ `height` is animated here and it is a MEASURED exception to the transform/opacity contract
 * (the Reveal's clause): the layout is contained to this 256-wide column's dozen boxes, and a
 * transform cannot do the work — a card shrinking by scaleY squashes its rows, and the rooms
 * under it must move by real layout to rest where they rest.
 */
function CloudMenu({ room, setRoom, t }: { room: string; setRoom: (id: string) => void; t: (x: Text) => string }) {
  const reduce = useReducedMotion()
  const open = isTable(room)
  const column = useRef<HTMLDivElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const clip = useRef<HTMLDivElement>(null)
  const sizer = useRef<HTMLDivElement>(null)
  const rooms = useRef<HTMLDivElement>(null)
  const p = useMotionValue(open ? 1 : 0)
  const plateTop = useMotionValue(0)
  const plateLeft = useMotionValue(0)
  const plateW = useMotionValue(0)
  const plateH = useMotionValue(0)
  const plateR = useMotionValue(10)
  const [closed, setClosed] = useState(!open)
  const [arriving, setArriving] = useState(false)
  const seated = useRef(false)
  const token = useRef(0)
  /* THE PLATE RIDES THE FOLD'S CLOCK while the fold moves. Two springs on identical parameters
     meet at the end — but a bounce sends them PAST the end in opposite directions: measured, the
     plate (overshooting down, off its own 43px of travel) sat 5.6px under a room row that was
     overshooting up (off the fold's 164px) for ~150 ms. So while the fold moves the plate is not a
     spring of its own: its box is a function of `p` — size, x and radius lerped on the fold's
     clipped progress `u`, and its top GLUED to the target row's live position plus an offset that
     decays with `u`. When `u` reaches 1 the plate IS on the row and stays on it through the bounce.
     A hop with the fold at rest (table → table, room → room) is a plain spring flight. */
  const ride = useRef<null | { from: Box; to: Box; toMoves: boolean; nat: number; vStart: number; pTo: number }>(null)

  /* the fold, as a function of `p` — written straight to the elements (see above) */
  const paint = useCallback(() => {
    const v = p.get()
    const nat = sizer.current?.offsetHeight ?? 0
    const edge = v * (nat + CARD_GAP)
    if (clip.current) clip.current.style.height = `${Math.max(0, v * nat)}px`
    if (wrap.current) {
      wrap.current.style.paddingBottom = `${Math.max(0, v * CARD_GAP)}px`
      wrap.current.style.marginBottom = `${Math.min(0, edge)}px`
    }
    if (card.current) card.current.style.backgroundColor = `rgba(255,255,255,${(0.08 * Math.min(1, Math.max(0, v))).toFixed(4)})`
    const r = ride.current
    if (r) {
      const u = Math.min(1, Math.max(0, (v - r.vStart) / (r.pTo - r.vStart)))
      const mix = (a: number, b: number) => a + (b - a) * u
      /* everything under the card sits `edge` lower than its resting place — exactly, at every v */
      const rowTop = r.toMoves ? r.to.top + (v - r.pTo) * (r.nat + CARD_GAP) : r.to.top
      const rowStart = r.toMoves ? r.to.top + (r.vStart - r.pTo) * (r.nat + CARD_GAP) : r.to.top
      plateTop.set(rowTop + (r.from.top - rowStart) * (1 - u))
      plateLeft.set(mix(r.from.left, r.to.left))
      plateW.set(mix(r.from.width, r.to.width))
      plateH.set(mix(r.from.height, r.to.height))
      plateR.set(mix(r.from.radius, r.to.radius))
    }
  }, [p, plateTop, plateLeft, plateW, plateH, plateR])
  useMotionValueEvent(p, 'change', paint)
  useLayoutEffect(paint, [paint])

  /* a change of room: seat the plate — flying, with the fold if the fold moves */
  useLayoutEffect(() => {
    const host = column.current
    const el = host?.querySelector<HTMLElement>(`[data-cloud-seat="${room}"]`)
    if (!host || !el) return
    const willOpen = isTable(room)
    const pNow = p.get()
    const pTo = willOpen ? 1 : 0
    const nat = sizer.current?.offsetHeight ?? 0
    const box = boxIn(el, host)
    /* everything under the card moves by the fold's remaining travel: the seat is where the
       row will REST, not where it stands now */
    if (rooms.current?.contains(el)) box.top += (pTo - pNow) * (nat + CARD_GAP)
    const my = ++token.current
    if (!seated.current || reduce) {
      /* mount, or reduced motion: everything in one commit */
      seated.current = true
      p.jump(pTo)
      plateTop.jump(box.top)
      plateLeft.jump(box.left)
      plateW.jump(box.width)
      plateH.jump(box.height)
      plateR.jump(box.radius)
      paint()
      setClosed(!willOpen)
      return
    }
    host.dataset.cloudMoving = ''
    if (willOpen && pNow < 1) {
      setClosed(false)
      setArriving(true)
    }
    const from: Box = { top: plateTop.get(), left: plateLeft.get(), width: plateW.get(), height: plateH.get(), radius: plateR.get() }
    let runs
    if (pTo !== pNow) {
      /* the fold moves: the plate rides its clock (see `ride`) */
      ride.current = { from, to: box, toMoves: !!rooms.current?.contains(el), nat, vStart: pNow, pTo }
      runs = [animate(p, pTo, MENU_SPRING)]
    } else {
      ride.current = null
      runs = [
        animate(plateTop, box.top, MENU_SPRING),
        animate(plateLeft, box.left, MENU_SPRING),
        animate(plateW, box.width, MENU_SPRING),
        animate(plateH, box.height, MENU_SPRING),
        animate(plateR, box.radius, MENU_SPRING),
      ]
    }
    /* ⚠️ `stop()` on a motion animation RESOLVES its promise (the Reveal's lesson), so a later
       click lands here for the flight it interrupted: the token says whose finish this is */
    Promise.all(runs).then(() => {
      if (token.current !== my) return
      ride.current = null
      delete host.dataset.cloudMoving
      if (!willOpen) setClosed(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room])

  /* the glint plays once, 1.1 s + its 0.1 s beat */
  useEffect(() => {
    if (!arriving) return
    const id = window.setTimeout(() => setArriving(false), 1200)
    return () => window.clearTimeout(id)
  }, [arriving])

  const inertProps = closed ? ({ inert: '' } as Record<string, string>) : {}

  return (
    /* ⚠️ NOT aria-label="Cloud": that is the rail BUTTON's name, and two things answering
       to one name is how a query means the wrong element (it cost a check run here). */
    /* THE COLUMN LIFTS AT ITS FOOT (board 30887:57756 `Menu`, designer 24.09.2026: "обрати
       внимание как я по хитрому сделал цвет фона под меню, чтобы не было видно швов").
       The board fills this 264 column with `linear-gradient(to bottom, #141417 87.455%, #1d1d20)`
       — flat window base for the top seven eighths, then a ramp that brightens by exactly
       Neutral Alpha/50 at the very bottom. Both stops are opaque BECAUSE it is a ramp: over a
       translucent base the two alphas would multiply down its length. The card above stays
       translucent (8 % white) on purpose — that is what carries the lift up into the card's own
       foot, so the card dissolves into the column instead of ending on a line. */
    <nav
      className="flex w-[264px] flex-none flex-col py-2 pl-2"
      style={{ background: 'linear-gradient(to bottom, var(--window-base) 87.455%, var(--window-lift))' }}
      aria-label="Cloud menu"
    >
      {/* Conteiner 256: 8% white on 8% white — the stroke sits INSIDE the 256 on the
          board, so it is an inset shadow here and the box stays 256 (the law this
          project has paid for on every card it has drawn). */}
      <div data-cloud-menu className="pane-in-menu flex min-h-0 flex-1 flex-col rounded-[14px] bg-[var(--white-100)] shadow-[inset_0_0_0_1px_var(--white-100)]">
        <div className="flex h-[84px] flex-none items-center gap-2.5 pl-5">
          {/* the mark the pane flies in from the rail button (App.tsx `PaneFlyer`): hidden while the
              flight is on, shown once the clone has landed on this very box */}
          <span data-cloud-mark className="flex flex-none text-[#7e57c2]">
            <IconCloud size={25} />
          </span>
          <span data-cloud-title className="font-display text-[24px] font-bold leading-[1.2] text-white">Cloud</span>
        </div>

        <ScrollArea className="min-h-0 flex-1" thumb="light">
          <div ref={column} data-cloud-menu-list className="relative flex flex-col gap-[3px] px-1.5 pb-2">
            {/* the one selection plate, flying under the rows */}
            <motion.span
              data-cloud-plate
              aria-hidden
              className="pointer-events-none absolute z-[1]"
              style={{ top: plateTop, left: plateLeft, width: plateW, height: plateH, borderRadius: plateR, backgroundColor: PLATE }}
            />

            {/* the database card: header, then the fold */}
            <div ref={wrap} data-cloud-card-wrap>
              <div ref={card} data-cloud-card className="relative rounded-[16px]">
                {arriving && <span className="glass-glint" style={{ '--glint-rgb': '149 117 205' } as CSSProperties} aria-hidden />}
                <div className="px-1 pt-1">
                  <MenuRow
                    Icon={IconDatabase}
                    seat="database"
                    label={t({ en: 'Database', uk: 'База даних' })}
                    strong
                    expanded={open}
                    bloom={room !== FIRST_TABLE}
                    onClick={() => setRoom(FIRST_TABLE)}
                  />
                </div>
                <div ref={clip} data-cloud-fold className="overflow-hidden">
                  {/* the glass inside the fold: the 4 under the header is ITS padding (a margin
                      would collapse out of the sizer's height and the clip would cut the last 4px) */}
                  <motion.div
                    ref={sizer}
                    data-cloud-fold-body
                    {...inertProps}
                    className={`relative z-[2] pt-1${closed ? ' invisible' : ''}`}
                    style={{ transformOrigin: 'top center' }}
                    variants={reduce ? menuGlassFade : menuGlass}
                    initial={false}
                    animate={open ? 'in' : 'out'}
                    onUpdate={noop}
                  >
                    <div className="flex flex-col gap-1 rounded-[12px] border-t border-[var(--white-100)] p-1.5">
                      {CLOUD_TABLES.map((x) => (
                        <TableRow key={x.id} id={x.id} label={x.name} on={room === x.id} onClick={() => setRoom(x.id)} />
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
                        <span className="grid h-9 w-9 flex-none place-items-center text-[var(--white-480)]">
                          <IconAdd size={24} />
                        </span>
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* the rooms the board names but does not draw */}
            <div ref={rooms} className="flex flex-col gap-[3px] px-1">
              {ROOMS.map(({ id, Icon, label }) => (
                <MenuRow key={id} Icon={Icon} seat={id} label={t(label)} on={room === id} onClick={() => setRoom(id)} />
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </nav>
  )
}


/* ───────────────────────────────────── the table ─────────────────────────────────────── */

function Row({ row, i, last, t }: { row: CloudRow; i: number; last: boolean; t: (x: Text) => string }) {
  return (
    <div
      data-cloud-row
      /* the floor the columns add up to; above it the last column takes the slack. `--i` is the
         row's place in the cascade: rows come in one after another, top-down (index.css
         `.pane-in-row`) — a beat after the window itself when it has just unfolded. */
      style={{ minWidth: ROW_W, '--i': i } as CSSProperties}
      className={`pane-in-row flex h-[72px] w-full items-center pl-4 pr-2${last ? '' : ' border-b border-[var(--gray-750)]'}`}
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
      {/*
        * The last column TAKES THE SLACK. Every other one is fixed, so when the table is wider
        * than the row wants (1553) the leftover used to pile up AFTER the columns and the action
        * block — which is placed off the end of the content — landed ~120 short of the row's
        * right edge, where the board pins it to `right-8`. Growing this one keeps the natural
        * width at the drawn 408 (so the scroll extent is unchanged) and puts the actions on the
        * edge at every width.
        */}
      <div style={{ flex: '1 0 auto', minWidth: COL.url }}>
        <span className="block w-[408px] truncate text-[15px] text-[var(--white-480)]">{row.imageUrl}</span>
      </div>

      {/*
        * THE ACTIONS RIDE THE RIGHT EDGE. The board draws them absolutely, 8 from the row's
        * right, over a fade that ends in the window's fill — which is the sticky-action-column
        * idiom drawn in a mock that never scrolls. Here the row really does scroll, so they are
        * `sticky right-0` with the board's 8 as padding INSIDE the plate; the negative margin keeps
        * the block out of the row's width, so the buttons sit exactly 8 from the visible edge at every
        * scroll position — and the plate covers the gap the next column would otherwise peek through.
        */}
      <div
        className="sticky right-[-1px] flex h-10 flex-none items-center justify-end gap-2.5 pr-[9px]"
        style={{
          /* 155 on the board + the row's 8 of end padding: the plate reaches the viewport's edge, so
             the column that scrolls under it cannot peek out in that gap (at scroll-home the price's
             `$` did — seen on the live build, 23.09.2026). Its left edge is the board's (row end − 163);
             the right OVERSHOOTS the scrollport by 1px, clipped by the scroller — on the software
             rasteriser a full-frame capture showed the plate's own layer edge one device pixel short,
             and a glyph of the next column bled through it. The buttons keep their 8 (`pr-[9px]`), and
             the fade keeps the board's length: 38.942 % of 155 = 60.36px. */
          width: 164,
          marginLeft: -164,
          /* board 30911:59315: `from-[rgba(29,29,32,0)] to-[#1d1d20] to-[38.942%]` — the fade ends in
             the SHEET's own colour, so the plate is invisible and only the text under it dims. It
             followed the sheet up on 24.09.2026 (it read `#18181b` off 30816:52156 while the sheet was
             `--gray-900`; the `#1f1f22` before that was a misread of a partial export, not the mock's
             slip — designer 23.09.2026: «у тебя под кнопками цвет градиента не как в макете»). Both
             ends are the ONE token, so the pair cannot drift apart again. */
          background: 'linear-gradient(to right, rgba(29,29,32,0) 0%, var(--window-lift) 60.36px)',
        }}
      >
        <button
          type="button"
          aria-label={`${t({ en: 'Edit', uk: 'Редагувати' })} ${row.name}`}
          className="press-bloom grid h-10 w-10 place-items-center rounded-[10px] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
        >
          <IconPencil size={24} />
        </button>
        <button
          type="button"
          aria-label={`${t({ en: 'Delete', uk: 'Видалити' })} ${row.name}`}
          className="press-bloom grid h-10 w-10 place-items-center rounded-[10px] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
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
  const reduce = useReducedMotion()
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
  const syncHead = (s: HTMLDivElement) => {
    if (headRow.current) headRow.current.style.transform = `translateX(${-s.scrollLeft}px)`
  }
  /* a new list mounts at scroll-home (and only after the old one has left — `mode="wait"`), so
     the headings go home the moment the room changes; from then on the list's own onScroll leads */
  useEffect(() => {
    if (headRow.current) headRow.current.style.transform = 'translateX(0px)'
  }, [room])

  /* Esc closes, like every other surface and sheet in the shell. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSurface() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeSurface])

  const title = table ? table.title : t(ROOMS.find((r) => r.id === room)?.label ?? { en: 'Cloud', uk: 'Cloud' })
  const settle = usePaneSettle()

  return (
    <div
      data-cloud-window
      className="flex h-full overflow-hidden rounded-[16px] border border-[var(--gray-800)]"
      style={{
        /* The house window base — 24 % black over `--gray-900`, the recipe DomainsSurface has
           carried since 27085:106964. WRITTEN FLAT as `--window-base` since 24.09.2026: board
           30887:57756 prints this composite as the opaque `#141417`, and the menu column below
           now ramps FROM it, so both ends of that ramp have to speak one language. The pixel is
           unchanged — rgb(20,20,23) either way (the arithmetic is on the token). */
        background: 'var(--window-base)',
        boxShadow: '0px 8px 8px rgba(0,0,0,0.12), 0px 56px 72px rgba(0,0,0,0.12)',
      }}
    >
      {/* THE CONTENTS SETTLE INTO THE FRAME (App.tsx `usePaneSettle`, motion.ts `PANE_SETTLE`): one
          visible breath, 1.03 → .99 → 1, on what is INSIDE the window — never on the window itself,
          or a gap would open between the pane's moving rim and this border. Centre origin: a lens
          focusing, not a slide. Outside a pane (there is none today) the wrapper simply stands. */}
      <motion.div data-pane-settle className="flex h-full w-full" style={{ scale: settle ?? 1 }}>
      {/* ───────────────────────────── menu, 264 ───────────────────────────── */}
      <CloudMenu room={room} setRoom={setRoom} t={t} />

      {/* ──────────────────────────── content column ───────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* top bar 48: one button, and it is the way out */}
        <div className="flex h-12 flex-none items-center justify-end pr-2">
          <button
            type="button"
            onClick={closeSurface}
            aria-label={t({ en: 'Close', uk: 'Закрити' })}
            data-cloud-close
            /* the composer's glass, not a flat hairline (designer 23.09.2026: «на этой кнопке закрытия
               окна должно быть стекло как на кнопках в чате»): Black/700 under blur 16 and the 24 → 4 → 20 %
               diagonal rim of the «+» and the microphone, with the house hover wash and press bloom
               (`glass-interactive`). Shape stays the board's 32 / r10 — the material is what was asked for. */
            className="liquid-glass liquid-glass--composer glass-interactive grid h-8 w-8 place-items-center rounded-[10px] bg-[#09090ba3] text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:text-white"
          >
            <IconCloseM size={24} />
          </button>
        </div>

        {/*
          * THE PAGE IS A LIGHTER SHEET ON A DARKER BASE (board node `Page content`, 30816:55869 →
          * REPAINTED 30911:59222): a 1px `Neutral Alpha/100` top edge, a 6px top-right corner, and
          * a fill that is `Neutral Alpha/50` — 4 % WHITE over the window base, which flattens to
          * `--window-lift` #1d1d20. It was `--gray-900` until 24.09.2026, when the designer sent the
          * repainted board («есть отличия в цветах фона между тем что ты сделал и в макете»): the
          * sheet moved up with the menu column's foot, so the two lightest surfaces of the window
          * now agree, and the seam the ramp hides is the only line left between them.
          * ⚠️ WRITTEN FLAT, and that is the same law the ramp is written by: the row-action fade
          * below ends in this exact colour to stay invisible, and the board itself types that stop
          * opaque (`to-[#1d1d20]`) while leaving the sheet translucent, because Figma composites
          * the sheet for you and cannot composite a gradient stop. One token keeps the pair honest.
          * The base under it then shows exactly where the board shows it: behind the top bar and
          * behind the menu column. Reading only the leaf nodes had made the whole window one flat
          * tone, and the hairline under the top bar vanished with it; the designer's own crop caught it.
          */}
        <div className="flex min-h-0 flex-1 flex-col rounded-tr-[6px] border-t border-[var(--white-100)] bg-[var(--window-lift)]">
          {/* header: title · search · actions, then the column headings */}
          <div className="flex-none">
            <div className="pane-in-head flex items-center pl-9 pr-6">
              {/* 25 above and 24 below a 38.4 line make the board's 87 — a hair lower than centred */}
              {/* the title ROLLS between rooms — the verb roll of the Publish panel's card (motion.ts
                  `verbRoll`): the old word up and out in 160 ms, the next up into place from 10 px
                  below after a 60 ms beat; `popLayout` takes the leaving word out of the flow so the
                  line never doubles in height. `onUpdate` keeps the fades on the main thread. */}
              <h2 className="relative flex-none pb-6 pt-[25px] font-display text-[32px] font-bold leading-[1.2] text-white">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={title}
                    data-cloud-title-word
                    className="inline-block"
                    variants={reduce ? verbRollFade : verbRoll}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    onUpdate={noop}
                  >
                    {title}
                  </motion.span>
                </AnimatePresence>
              </h2>
              <div className="ml-14 flex min-w-0 flex-1 justify-center">
                <label className="flex h-10 w-full min-w-0 max-w-[400px] items-center gap-4 rounded-full bg-[var(--gray-900)] pl-2 pr-[7px]">
                  <span className="grid h-6 w-6 flex-none place-items-center text-[var(--gray-500)]">
                    <IconSearchM size={24} />
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

            {/* the column headings leave with the table (140 ms, flat) and come back with one (200 ms);
                keyed by "is there a table", not by which — Meals and Orders share them, and a fade between
                two identical rows would be a blink for nothing */}
            <AnimatePresence mode="wait" initial={false}>
            {table && (
              <motion.div
                key="cols"
                data-cloud-headings
                className="pane-in-cols h-[47px] overflow-hidden border-t border-[var(--gray-750)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2, ease: [0.2, 0, 0, 1] } }}
                exit={{ opacity: 0, transition: EXIT }}
                onUpdate={noop}
              >
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
              </motion.div>
            )}
            </AnimatePresence>
          </div>

          {/* page */}
          <div data-cloud-page className="min-h-0 flex-1 border-t border-[var(--gray-800)] pt-2">
            <ScrollArea className="h-full" thumb="light">
              {/* THE TABLE HANDS OVER, IT DOES NOT CROSSFADE (the question dock's double-exposure lesson):
                  under `mode="wait"` the old page is gone in 140 ms before the new one mounts, and the new
                  one fills in on its own — the rows cascade top-down (`.pane-in-row`, 30 ms apart), a room's
                  note comes up the same way (`.pane-in-note`). */}
              <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={room}
                data-cloud-pagebody
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: EXIT }}
                onUpdate={noop}
              >
              {table ? (
                <div className="flex flex-col gap-2.5 px-6">
                  <div ref={scroller} data-cloud-list className="w-full overflow-x-auto" onScroll={(e) => syncHead(e.currentTarget)}>
                    {/* ⚠️ no inline `minWidth` here: it would BEAT `min-w-full` and pin the rows
                        to their natural 1553, leaving the last column — and the actions pinned
                        after it — short of the table's right edge. `w-max` already floors the
                        column at ROW_W, which is what the scroller needs. */}
                    <div className="flex w-max min-w-full flex-col">
                      {rows.map((r, i) => (
                        <Row key={r.id} row={r} i={i} last={i === rows.length - 1} t={t} />
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
                <p className="pane-in-note px-9 py-10 text-[15px] text-[var(--white-480)]">
                  {t({ en: 'Nothing here yet.', uk: 'Тут поки порожньо.' })}
                </p>
              )}
              </motion.div>
              </AnimatePresence>
            </ScrollArea>
          </div>
        </div>
      </div>
      </motion.div>
    </div>
  )
}
