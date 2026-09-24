/**
 * THE USERS ROOM — Figma 30971:98655 («вот макет для страницы Users в Cloud… сделай перфект
 * пиксель как в макете», 24.09.2026).
 *
 * The Cloud window's rooms were named by the first board and left empty («Nothing here yet»).
 * This is the first one with a board of its own. It lives inside the same window, the same sheet
 * and the same rolling title; what changes is everything under the title:
 *
 *   Header 90 — title (pt 25 / pb 27) · 56 · [flex-1, justify-end, gap 48: two stats · the «+»]
 *   Row of cards — px 24, gap 12: Sign-in 432 · Chart flex-1 (353)
 *   People — px 4: header 72 (title at pl 44, the search 256 at pr 20) · headings 47 · the list
 *   Sheet foot — pb 24
 *
 * ── THE STROKE IS INSIDE THE GEOMETRY, SIX MORE TIMES ──────────────────────────────────────
 *
 * Figma draws a frame's stroke inside its box and it takes no part in auto-layout; a CSS border
 * adds to the box AND pushes the content. So every drawn line here is an inset shadow: the card
 * rings, the stat divider, the search field, the two #33333a rules and the row dividers. With
 * borders the headings would sit half a pixel low (centred in 46, not 47), the list would start
 * at 9 instead of 8, and every row's content would ride half a pixel high. The Sign-in card's
 * ring is an OVERLAY, not the card's own shadow: its inner well runs edge to edge and would paint
 * over a shadow on the card — Figma draws a frame's stroke above its children, so here too.
 *
 * ── WHAT IS REPRODUCED AS DRAWN, AND FLAGGED ──────────────────────────────────────────────
 *
 * · The page title is Gilroy SEMIBOLD 32 on this board and Gilroy BOLD 32 on the Database board
 *   (30816:52075). One component, two weights — shipped per room, raised with the designer.
 * · The column headings sit 8 px RIGHT of their data (pl 44 against the list's 20 + 16 = 36), the
 *   same on every column — the Database board's headings sit 4 px left of theirs. Mock drift, as
 *   drawn, raised.
 * · The chart is titled «Chart», its axis reads 100 · 80 · 60 · 20 · 0 % on five even lines (the
 *   Analytics axis, same missing 40) and its polyline does not sit on the day ticks. There is no
 *   series behind it to put right, so the path is the board's own, to the unit (data/cloudUsers.ts),
 *   and what it should chart is a question for the designer.
 * · The last column is headed «Provider» a second time over values like «18h ago». Here there IS a
 *   single right reading — the time since the last sign-in — so it ships as «Last sign-in», the
 *   `Add Promt` class of fix, flagged.
 * · «Email and password» is OFF while three of five people signed up with a password. The switch
 *   state is the board's (it is the drawn OFF state), and the rows still read true: switching a
 *   method off stops NEW sign-ups, it does not delete the accounts already made with it.
 * · The «+» and the search field are live controls with no drawn behaviour behind them: the search
 *   filters the list by name or address (the Database table's search does the same), the «+» only
 *   answers the press, like «Add an object» — what it adds is not on any board.
 */
import { useState, type CSSProperties } from 'react'
import { useT, type Text } from '@/i18n'
import { DAYS } from '@/data/analytics'
import { PEOPLE, SIGN_IN, USERS_CHART, USERS_TOTAL, USERS_WEEK, type CloudUser, type SignInId } from '@/data/cloudUsers'
import {
  GlyphAddThin, GlyphGoogle, GlyphLanguage, GlyphMailFilled20, GlyphMailFilled24, GlyphSearchThin,
} from './boardIcons'

/** Cap band instead of line box — how the board sets its small labels and figures. */
const CAP = '[text-box-edge:cap_alphabetic] [text-box-trim:trim-both]'
/** Cloud's own purple — the switch's on-track and the chart's line (the board's #7E57C2). */
const CLOUD_PURPLE = '#7e57c2'

/* ─────────────────────────────── the header's right side ─────────────────────────────── */

/**
 * The two stats and the «+» (30971:100604). Each stat is a 48-tall tab: the label in
 * `Deep Purple/200` (#B39DDB, 13 medium) over the figure (Gilroy semibold 28), both measured by
 * their capitals, 16 apart — 9 + 16 + 20 = 45, centred in the 48. The first carries the divider
 * — 8 % white along its right edge, 24 after the figure.
 */
export function UsersHeaderTools({ t }: { t: (x: Text) => string }) {
  const stat = (label: Text, value: string, divider: boolean, id: string) => (
    <div
      data-users-stat={id}
      className={`flex h-12 flex-none items-center${divider ? ' pr-6 shadow-[inset_-1px_0_0_var(--white-100)]' : ''}`}
    >
      <div className="flex flex-col items-start gap-4">
        <span className={`${CAP} whitespace-nowrap text-[13px] font-medium leading-normal text-[#b39ddb]`}>{t(label)}</span>
        <span className={`${CAP} whitespace-nowrap font-display text-[28px] font-semibold leading-[24px] text-white`}>{value}</span>
      </div>
    </div>
  )
  return (
    <div data-users-tools className="flex min-w-0 flex-1 items-center justify-end gap-12 self-stretch">
      <div className="flex flex-none items-center gap-6">
        {stat({ en: 'Total users', uk: 'Усього користувачів' }, USERS_TOTAL, true, 'total')}
        {stat({ en: 'Last 7 days', uk: 'За 7 днів' }, USERS_WEEK, false, 'week')}
      </div>
      {/* the kit's standard icon button: no container until it is touched (its own description on
          the board), 40 at radius 10, the thin 13-wide plus white */}
      <button
        type="button"
        data-users-add
        aria-label={t({ en: 'Add a user', uk: 'Додати користувача' })}
        className="press-bloom grid h-10 w-10 flex-none place-items-center rounded-[10px] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
      >
        <GlyphAddThin size={24} />
      </button>
    </div>
  )
}

/* ─────────────────────────────────── the Sign-in card ─────────────────────────────────── */

/**
 * The board's switch (30971:100728 / 100738), 46 × 28: a full-round track in Cloud's purple when
 * on and `Gray/600` #52525B when off; a 22 knob 3 in from the edge, white on and `Gray/350` #C7C7CD
 * off. The knob travels 18 on the house curve and the track crossfades under it — only transform
 * and colour move, and the box never changes.
 */
function Switch({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      data-users-switch
      onClick={onToggle}
      className="relative h-7 w-[46px] flex-none rounded-full outline-none transition-colors duration-200 ease-std focus-visible:ring-2 focus-visible:ring-[var(--action)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1c]"
      style={{ backgroundColor: on ? CLOUD_PURPLE : 'var(--gray-600)' }}
    >
      <span
        data-users-knob
        aria-hidden
        className="absolute left-[3px] top-[3px] h-[22px] w-[22px] rounded-full transition-[transform,background-color] duration-[260ms] [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ transform: on ? 'translateX(18px)' : 'none', backgroundColor: on ? '#ffffff' : 'var(--gray-350)' }}
      />
    </button>
  )
}

const METHOD_LOOK: Record<SignInId, { tint: string; Glyph: () => JSX.Element }> = {
  public: { tint: 'rgba(255,183,77,0.15)', Glyph: () => <GlyphLanguage /> },
  password: { tint: 'rgba(179,157,219,0.15)', Glyph: () => <GlyphMailFilled20 /> },
  google: { tint: 'rgba(48,134,255,0.15)', Glyph: () => <GlyphGoogle /> },
}

/**
 * The Sign-in card (30971:100703), 432 × 350: #242427 under a #2a2a2d ring, radius 16. The header
 * 86 — title 20 semibold, 8, the line 14 at 48 % — and under it a darker well, #1a1a1c at radius
 * 16 on every corner (its top corners show the card's own grey), holding three 88-tall rows: a 40
 * avatar in the method's tint with its 20 glyph, 16, two lines (15 medium white / 13 regular 48 %,
 * 4 apart), the switch. Rows are split by 4 % white; the last is not.
 */
function SignInCard({ t }: { t: (x: Text) => string }) {
  const [state, setState] = useState<Record<SignInId, boolean>>(
    () => Object.fromEntries(SIGN_IN.map((m) => [m.id, m.on])) as Record<SignInId, boolean>,
  )
  return (
    <section data-users-signin className="pane-in-note relative w-[432px] flex-none rounded-[16px] bg-[#242427]">
      <header className="flex flex-col gap-2 px-6 py-5">
        <h3 className="font-display text-[20px] font-semibold leading-[1.2] text-white">{t({ en: 'Sign-in', uk: 'Вхід' })}</h3>
        <p className="text-[14px] leading-[14px] text-[var(--white-480)]">
          {t({ en: 'Control who can create accounts on this site.', uk: 'Керуйте тим, хто може створювати акаунти на цьому сайті.' })}
        </p>
      </header>
      <div data-users-well className="flex flex-col rounded-[16px] bg-[#1a1a1c] px-4">
        {SIGN_IN.map((m, i) => {
          const { tint, Glyph } = METHOD_LOOK[m.id]
          const last = i === SIGN_IN.length - 1
          return (
            <div
              key={m.id}
              data-users-method={m.id}
              className={`flex h-[88px] items-center gap-4${last ? '' : ' shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]'}`}
            >
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full" style={{ backgroundColor: tint }}>
                <Glyph />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-[15px] font-medium leading-[21px] text-white">{t(m.title)}</span>
                <span className="truncate text-[13px] leading-[15px] text-[var(--white-480)]">{t(m.hint)}</span>
              </div>
              <Switch on={state[m.id]} label={t(m.title)} onToggle={() => setState((s) => ({ ...s, [m.id]: !s[m.id] }))} />
            </div>
          )
        })}
      </div>
      {/* the ring above the well: Figma paints a frame's stroke over its children */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[16px] shadow-[inset_0_0_0_1px_#2a2a2d]" />
    </section>
  )
}

/* ────────────────────────────────────── the chart ────────────────────────────────────── */

/** The five gridlines of 30971:100966 — 1 px at 8 % white, centred on 7.5 · 67.75 · 128 · 188.25 · 248.5. */
const GRID_TOPS = [7, 67.25, 127.5, 187.75, 248]

/**
 * The Chart card (30971:100763), 353 tall: `Black/300` (24 % of #09090b) under a 5 %-white ring,
 * radius 16. Header 56 (pt 20 / pb 12), then the plot 284 (pt 8 / pb 16, px 24, gap 8): the axis
 * column spreads its five labels over 260 − 22, the area holds the 249 grid over the 24 day row,
 * and the series sits absolutely at the export's own origin (−0.5, 38.5), 1145 × 177 at the board's
 * width, stretching with the card. Line: Cloud's purple, 3 wide, round caps — the board draws the
 * Analytics green under it at the same path, invisible, so only the purple is kept.
 */
function ChartCard({ t }: { t: (x: Text) => string }) {
  const C = USERS_CHART
  return (
    <section
      data-users-chart
      className="pane-in-note relative h-[353px] min-w-0 flex-1 rounded-[16px] bg-[rgba(9,9,11,0.24)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
      style={{ animationDelay: '40ms' }}
    >
      <header className="px-6 pb-3 pt-5">
        <h3 className="font-display text-[20px] font-semibold leading-[1.2] text-white">{t({ en: 'Chart', uk: 'Графік' })}</h3>
      </header>
      <div className="flex h-[284px] items-start gap-2 px-6 pb-4 pt-2">
        <div
          data-users-axis
          className="flex h-full w-7 flex-none flex-col justify-between whitespace-nowrap pb-[22px] font-display text-[12px] font-medium leading-[15px] text-[var(--white-320)]"
          aria-hidden
        >
          {['100%', '80%', '60%', '20%', '0%'].map((l) => <span key={l}>{l}</span>)}
        </div>
        <div className="relative flex min-w-0 flex-1 flex-col items-end">
          <div data-users-grid className="relative h-[249px] w-full" aria-hidden>
            {GRID_TOPS.map((y) => (
              <span key={y} className="absolute left-0 right-0 h-px bg-[var(--white-100)]" style={{ top: y }} />
            ))}
          </div>
          <div className="flex w-full items-start justify-between text-[12px] font-medium leading-[24px] text-[var(--white-320)]">
            {DAYS.map((d, i) => <span key={i}>{t(d)}</span>)}
          </div>
          {/* wrapped, not stretched directly: an SVG with a viewBox and a fixed height has an intrinsic
              ratio, and Chrome sizes it from that instead of from left/right (the Analytics lesson) */}
          <div
            data-users-graph
            aria-hidden
            className="pointer-events-none absolute"
            style={{ left: -0.5, top: 38.5, width: 'calc(100% + 2px)', height: C.h }}
          >
            <svg className="block h-full w-full overflow-visible" viewBox={`0 0 ${C.w} ${C.h}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="users-chart-fill" x1="572.5" y1={C.fillFrom} x2="572.5" y2={C.fillTo} gradientUnits="userSpaceOnUse">
                  <stop stopColor={CLOUD_PURPLE} stopOpacity="0.25" />
                  <stop offset="1" stopColor={CLOUD_PURPLE} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={C.area} fill="url(#users-chart-fill)" />
              <path d={C.line} fill="none" stroke={CLOUD_PURPLE} strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────── People ───────────────────────────────────────── */

/**
 * One row of the People table (30971:101062), 72 at px 16 under a 4 %-white divider: the 64 avatar
 * column (a 40 disc, the initial in 18 regular), the 320 name column (15 medium; an Unconfirmed
 * account adds the `Gray/700` r6 chip, 12 apart), the 380 email column (14 at 48 %, truncating),
 * then three equal columns — sign-ins, the provider's mark, the last sign-in at the right.
 * The fixed columns may give way (`min-w`) when the window is narrower than the board's 2560: the
 * three flexible ones hold their 80 and the name and address shrink first, truncating.
 */
function PersonRow({ u, i, last, t }: { u: CloudUser; i: number; last: boolean; t: (x: Text) => string }) {
  const logins = u.logins === 0
    ? t({ en: 'No sign-ins', uk: 'Не входив' })
    : u.logins === 1 ? t({ en: '1 sign-in', uk: '1 вхід' }) : t({ en: `${u.logins} sign-ins`, uk: `Входів: ${u.logins}` })
  return (
    <div
      data-users-row={u.id}
      style={{ '--i': i + 4 } as CSSProperties}
      className={`pane-in-row flex h-[72px] items-center px-4${last ? '' : ' shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]'}`}
    >
      <div className="flex w-[384px] min-w-[240px] shrink items-center">
        <div className="flex w-16 flex-none items-center">
          <span className="grid h-10 w-10 place-items-center rounded-full text-[18px] leading-[1.3] text-white" style={{ backgroundColor: u.tone }} aria-hidden>
            {u.name.charAt(0)}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-center">
          <div className="flex min-w-0 max-w-[240px] items-center gap-3">
            <span className="truncate text-[15px] font-medium text-white">{u.name}</span>
            {u.unconfirmed && (
              <span data-users-chip className="flex h-6 flex-none items-center rounded-[6px] bg-[var(--gray-700)] px-2 text-[12px] font-medium text-[#e4e4e7]">
                {t({ en: 'Unconfirmed', uk: 'Не підтверджено' })}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex w-[380px] min-w-[120px] shrink items-center">
        <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--white-480)]">{u.email}</span>
      </div>
      <div className="flex w-20 flex-1 items-center">
        <span className="w-20 whitespace-nowrap text-[14px] text-[var(--white-480)]">{logins}</span>
      </div>
      <div className="flex w-20 flex-1 items-center">
        <span data-users-provider={u.provider} className={`flex w-20 items-center${u.provider === 'google' ? ' pl-0.5' : ''}`}>
          {u.provider === 'google' ? <GlyphGoogle /> : <GlyphMailFilled24 />}
          <span className="sr-only">{u.provider === 'google' ? 'Google' : t({ en: 'Email', uk: 'Пошта' })}</span>
        </span>
      </div>
      <div className="flex w-20 flex-1 items-center justify-end">
        <span className="flex w-20 justify-end whitespace-nowrap text-[15px] text-[var(--white-480)]">
          {u.last ? t(u.last) : t({ en: 'Never', uk: 'Ніколи' })}
        </span>
      </div>
    </div>
  )
}

/** The People headings (30971:101022): 12 medium at 32 %, measured by their capitals, in the row's
 *  own columns — 64 (+ the 320 the board keeps empty under the avatar's label) · 380 · three flexible. */
const HEAD = `${CAP} whitespace-nowrap text-[12px] font-medium leading-normal text-[var(--white-320)]`

function People({ t }: { t: (x: Text) => string }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const rows = PEOPLE.filter((u) => !q || `${u.name} ${u.email}`.toLowerCase().includes(q))
  return (
    <section data-users-people className="px-1">
      {/* header 72: the title at pl 44 in a 120 box, the board's empty 120 «Close button» frame, the search */}
      <div className="pane-in-note flex items-center justify-between pr-5" style={{ animationDelay: '80ms' }}>
        <div className="flex h-[72px] min-w-0 flex-1 items-center gap-14 pl-11 pr-4">
          <div className="flex w-[120px] flex-none items-start pb-[19px] pt-7">
            <h3 className="font-display text-[20px] font-semibold leading-[1.2] text-white">{t({ en: 'People', uk: 'Люди' })}</h3>
          </div>
        </div>
        <div className="w-[120px] flex-none self-stretch" aria-hidden />
        {/* 256 × 40 at radius 10 under a 12 %-white ring, no fill; pl 8 · the thin magnifier at 48 % ·
            11 · the word in `Zinc/500` #71717a, one pixel low (the board's `pt-px`) */}
        <label
          data-users-search
          className="flex h-10 w-64 min-w-0 flex-none items-center gap-[11px] rounded-[10px] pl-2 pr-[7px] shadow-[inset_0_0_0_1px_var(--white-200)]"
        >
          <span className="grid h-6 w-6 flex-none place-items-center text-[var(--white-480)]"><GlyphSearchThin size={24} /></span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t({ en: 'Search', uk: 'Пошук' })}
            aria-label={t({ en: 'Search people', uk: 'Пошук людей' })}
            className="min-w-0 flex-1 bg-transparent pt-px text-[15px] text-white outline-none placeholder:text-[var(--gray-500)]"
          />
        </label>
      </div>
      <div data-users-headings className="pane-in-note flex h-[47px] items-center pl-11 pr-9 shadow-[inset_0_1px_0_var(--gray-750)]" style={{ animationDelay: '100ms' }}>
        <div className="flex w-[384px] min-w-[240px] shrink items-center">
          <span className={`w-16 flex-none ${HEAD}`}>{t({ en: 'Name', uk: 'Імʼя' })}</span>
        </div>
        <div className="flex w-[380px] min-w-[120px] shrink items-center"><span className={HEAD}>{t({ en: 'Email', uk: 'Пошта' })}</span></div>
        <div className="flex w-20 flex-1 items-center"><span className={`w-20 ${HEAD}`}>{t({ en: 'Logins', uk: 'Входи' })}</span></div>
        <div className="flex w-20 flex-1 items-center"><span className={`w-20 ${HEAD}`}>{t({ en: 'Provider', uk: 'Спосіб' })}</span></div>
        <div className="flex w-20 flex-1 items-center justify-end">
          {/* the cap band trims only a block's own lines, so the right-aligned label is an inner span */}
          <span className="flex w-20 justify-end"><span className={HEAD}>{t({ en: 'Last sign-in', uk: 'Останній вхід' })}</span></span>
        </div>
      </div>
      <div data-users-list className="px-5 pt-2 shadow-[inset_0_1px_0_var(--gray-750)]">
        {rows.map((u, i) => <PersonRow key={u.id} u={u} i={i} last={i === rows.length - 1} t={t} />)}
        {rows.length === 0 && (
          <p className="px-4 py-10 text-[15px] text-[var(--white-480)]">{t({ en: 'Nobody matches that.', uk: 'Нікого не знайшлося.' })}</p>
        )}
      </div>
    </section>
  )
}

/* ────────────────────────────────────── the room ─────────────────────────────────────── */

/** Everything under the header: the row of cards, then People, then the sheet's 24 of foot. */
export function UsersRoom() {
  const { t } = useT()
  return (
    <div data-users-room className="flex flex-col pb-6">
      <div className="flex items-start gap-3 px-6">
        <SignInCard t={t} />
        <ChartCard t={t} />
      </div>
      <People t={t} />
    </div>
  )
}
