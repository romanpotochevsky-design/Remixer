/**
 * THE ANALYTICS WINDOW — Figma 30934:93319, Dashboard node 30934:94405
 * («следующее окно это аналитика … сделай перфект пиксель как в макете», 24.09.2026).
 *
 * Opened by the Analytics button in the right rail, it takes the canvas the way the Cloud
 * window, the domains dashboard and the plan document do: a surface in place of the site,
 * not a modal over it (`state/ui.ts`, `Surface`). Out is ✕, Esc, or the same rail button.
 *
 * ── THE SHAPE, OFF THE BOARD ─────────────────────────────────────────────────────────
 *
 *   Window 1984 × 1325 — the house chrome the Cloud window and DomainsSurface carry:
 *   `--window-base`, radius 16, a `--gray-800` hairline, the same double shadow.
 *
 *   ⚠️ THE MENU COLUMN IS HIDDEN ON THIS BOARD (`Menu` 30934:94406, `hidden`). Analytics
 *   has no rooms, so the content column is the whole 1984 — no 264 column, no ramp under
 *   it, and the page sheet runs the full width. The Cloud window's ramp exists to hide the
 *   seam under a menu card; there is no card here, so there is nothing to hide.
 *
 *   ├── Top bar 48 — the module's name on the left, the close on the right
 *   └── Page sheet (`--window-lift`, 8 % white top hairline, radius 16)
 *       ├── Header 88 — `pl-32 pr-24`, title at 28, the range select 168 × 40 at 24
 *       └── Content — `px-16 pb-16 gap-24`
 *           ├── metrics card 500: five tabs over one chart
 *           ├── Country · Source
 *           └── Device · Page
 *
 * ── RINGS ARE INSET SHADOWS, NOT BORDERS ─────────────────────────────────────────────
 *
 * Figma puts a stroke INSIDE the geometry; a CSS border adds to it. Every card here is
 * measured by the board to the pixel (the Country card is 314 = 63 + 8 + [16 + 212 + 15]
 * + 8), and a border would have made each of them 2 bigger and eaten 2 from every child.
 * The same cure this project has applied to the checkout sheet, the generation card, the
 * plan page block and the connection card.
 *
 * ── WHAT IS REPRODUCED AS DRAWN, AND FLAGGED ─────────────────────────────────────────
 *
 * · THE Y AXIS READS 100 · 80 · 60 · 20 · 0 ON FIVE EVENLY SPACED LINES. The gaps are
 *   79.75 each and the steps are 20, 20, 40, 20 — so one of them is wrong, and unlike a
 *   misspelling there is no single right value to put back: five even lines from 100 to 0
 *   are 100/75/50/25/0, and 100/80/60/40/20/0 needs a sixth line. Left exactly as drawn
 *   and raised with the designer, because inventing either fix would move geometry he set.
 * · THE LEFT COLUMN'S CARD HEADERS ARE 63 AND THE RIGHT COLUMN'S ARE 60 (pt 24/pb 15
 *   against pt 20/pb 16) — the same component, drifted between two columns, so the two
 *   titles in a row sit 3px apart. Drawn that way, shipped that way, raised.
 * · THE DEVICE AND PAGE LISTS END IN THREE DIVIDERS WITH NOTHING UNDER THEM. A separator
 *   with one side empty separates nothing; those are rows that were deleted from a mock.
 *   Not drawn here.
 * · THE BARS DO NOT ENCODE THEIR NUMBERS ON THE BOARD (110 gets a wider bar than 227, and
 *   five identical 227s get five different widths). Ours are the share of the row's own
 *   maximum, which is what a bar in a breakdown means.
 * · THE RANGE SAYS "Last 7 days", the board says "Last 24 hours" over a Sun…Sat axis.
 *   That one HAS a single right value, so it is shipped corrected — the `Add Promt` class.
 *
 * ── THE CHART ────────────────────────────────────────────────────────────────────────
 *
 * The board's curve is a hand-drawn polyline whose seven vertices are not evenly spaced;
 * ours are, because the axis under them is. It keeps the drawn box exactly — `top-40`,
 * 175 tall, the line spanning 143 of it — and the fill is one vertical gradient over that
 * box (not per column), which is why on the board the green under a high Saturday is
 * denser than under a low Monday. Measured off the board's own render: line #66bb6a at
 * 2px, fill from ~20 % to nothing at ~92 % of the box.
 *
 * Gridlines are 8 % white with the BASELINE at 12 % — the board's node carries both tokens,
 * and the bottom line measures twice the ink of the four above it.
 */
import { Fragment, useEffect, useState, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import { useUI } from '@/state/ui'
import { usePaneSettle } from '@/App'
import { useT, type Text } from '@/i18n'
import { ScrollArea } from '@/ui/ScrollArea'
import { BREAKDOWNS, DAYS, METRICS, RANGES, type Breakdown, type Metric } from '@/data/analytics'
import { Flag } from './flags'
import { IconAnalytics, IconCalendarM, IconChevronDown, IconCloseM } from '@/ui/icons'

/** The module's accent — the board paints the selected tab, its label, the deltas and the
 *  chart with this one green, and the rail's Analytics button wears it too. */
export const ANALYTICS_GREEN = '#66bb6a'
/** …and its opposite, for a metric that moved the wrong way (Views Per Visit on the board). */
const ANALYTICS_RED = '#ef5350'

/** Cap band instead of line box — the board measures type by its capitals all over this window. */
const CAP = '[text-box-edge:cap_alphabetic] [text-box-trim:trim-both]'

/* ──────────────────────────────── the header's range select ──────────────────────────── */

/**
 * 168 × 40, a `--gray-700` ring at radius 10 and NO fill — the board draws it as an outline
 * on the sheet (30934:94541). Content `pl-10 pr-12`, a 20 calendar, 8, the label, then the
 * caret 20 pushed down 2.
 */
function RangeSelect({ t }: { t: (x: Text) => string }) {
  const [i, setI] = useState(0)
  return (
    <button
      type="button"
      data-analytics-range
      onClick={() => setI((n) => (n + 1) % RANGES.length)}
      className="press-bloom flex h-10 w-[168px] items-center justify-between rounded-[10px] py-1 pl-[10px] pr-3 shadow-[inset_0_0_0_1px_var(--gray-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-050)]"
    >
      <span className="flex items-center gap-2">
        <span className="grid h-5 w-5 flex-none place-items-center text-[var(--white-480)]">
          <IconCalendarM size={20} />
        </span>
        <span className="text-[15px] font-medium text-white">{t(RANGES[i])}</span>
      </span>
      <span className="grid h-5 w-5 flex-none place-items-center pt-0.5 text-[var(--white-480)]">
        <IconChevronDown size={20} />
      </span>
    </button>
  )
}


/* ─────────────────────────────────── the metrics card ────────────────────────────────── */

/** The delta's own triangle — 7.18 × 10 on the board, pointing the way the number went. */
function DeltaArrow({ up }: { up: boolean }) {
  return (
    <svg width="7.18" height="10" viewBox="0 0 7.18 10" fill="currentColor" aria-hidden className="flex-none">
      {up ? <path d="M3.59 3.7 0 8.29h7.18z" /> : <path d="M3.59 8.79 0 4.2h7.18z" />}
    </svg>
  )
}

function Delta({ value }: { value: number }) {
  const up = value >= 0
  return (
    <span className="flex flex-none items-start gap-[3px]" style={{ color: up ? ANALYTICS_GREEN : ANALYTICS_RED }}>
      <DeltaArrow up={up} />
      <span className={`font-display text-[15px] font-medium leading-[12px] ${CAP}`}>{Math.abs(value)}%</span>
    </span>
  )
}

/**
 * One tab. Selected and unselected are not one box in two paints — the board gives them
 * different rings (2px green against 1px `--gray-750`), different paddings and even a
 * different label box: the selected label keeps its line box (18) while the others are cap
 * trimmed (10). Reproduced literally; the heights that fall out, 80 and 83, are the board's,
 * and `items-center` on the strip centres the shorter one exactly as it is drawn at y=9.5.
 */
function Tab({ metric, on, onPick, t }: { metric: Metric; on: boolean; onPick: () => void; t: (x: Text) => string }) {
  return (
    <button
      type="button"
      data-analytics-tab
      data-on={on || undefined}
      onClick={onPick}
      className={
        on
          ? 'press-bloom flex flex-1 items-center rounded-[16px] bg-[var(--gray-750)] pb-[18px] pl-[18px] pr-5 pt-4 shadow-[inset_0_0_0_2px_#66bb6a]'
          : 'press-bloom flex flex-1 items-center rounded-[16px] px-5 pb-[19px] pt-5 shadow-[inset_0_0_0_1px_var(--gray-750)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-050)]'
      }
    >
      <span className="flex min-w-0 flex-1 items-start justify-between">
        <span className={`flex flex-col items-start ${on ? 'gap-[15px]' : 'gap-[21px]'}`}>
          {on ? (
            /* 18 is the board's own box for this label (15 × 1.2) and it is PINNED, not left to
               `normal`: the OFL stand-in for Proxima carries a taller default line, and the tab's
               80 is arithmetic — 16 + [18 + 15 + 13] + 18. Everything else in the tab is cap-trimmed
               and so already font-independent; this one line box is not. */
            <span className="text-[15px] font-semibold leading-[18px]" style={{ color: ANALYTICS_GREEN }}>
              {t(metric.label)}
            </span>
          ) : (
            <span className={`text-[15px] font-medium text-[var(--white-480)] ${CAP}`}>{t(metric.label)}</span>
          )}
          <span className={`font-display text-[18px] font-medium leading-[24px] text-white ${CAP}`}>{metric.value}</span>
        </span>
        <Delta value={metric.delta} />
      </span>
    </button>
  )
}

/** The plot's own height: 12 above the grid, the 320 grid, then the 24 day row. */
const GRID_H = 320
const PLOT_H = 12 + GRID_H + 24
/** The graph box, exactly where the board hangs it, and the span its line is drawn across. */
const GRAPH_TOP = 40
const GRAPH_H = 175
const LINE_H = 143

function Chart({ metric, t }: { metric: Metric; t: (x: Text) => string }) {
  const lo = Math.min(...metric.series)
  const hi = Math.max(...metric.series)
  const pts = metric.series.map((v, i) => {
    const x = (i / (metric.series.length - 1)) * 1000
    const y = hi === lo ? LINE_H / 2 : ((hi - v) / (hi - lo)) * LINE_H
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })
  const area = `${pts.join(' ')} 1000,${GRAPH_H} 0,${GRAPH_H}`

  return (
    <div className="flex gap-2 pb-4 pl-6 pr-6 pt-[21px]">
      {/* the axis: five labels, `justify-between` inside 356 with 22 of floor — which is
          exactly the board's 64.75 between them. They are NOT centred on their lines; the
          board sets them about 5 above, and that offset is drawn, not derived. */}
      <div
        className="flex w-7 flex-none flex-col justify-between pb-[22px] font-display text-[12px] font-medium leading-[15px] text-[var(--white-320)]"
        style={{ height: PLOT_H }}
        aria-hidden
      >
        {['100%', '80%', '60%', '20%', '0%'].map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>

      <div className="relative min-w-0 flex-1 pt-3" style={{ height: PLOT_H }}>
        {/* five gridlines: 8 % white, and the baseline at 12 % — the board's node carries
            both tokens and the bottom line measures twice the ink of the four above it */}
        <div className="relative w-full" style={{ height: GRID_H }} aria-hidden>
          {[0, 80, 160, 240].map((y) => (
            <span key={y} className="absolute left-0 right-0 h-px bg-[var(--white-100)]" style={{ top: y }} />
          ))}
          <span data-analytics-baseline className="absolute bottom-0 left-0 right-0 h-px bg-[var(--white-200)]" />
        </div>

        <div className="flex h-6 items-start justify-between text-[12px] font-medium leading-[24px] text-[var(--white-320)]">
          {DAYS.map((d, i) => (
            <span key={i}>{t(d)}</span>
          ))}
        </div>

        {/* THE SERIES. `preserveAspectRatio="none"` stretches the box to the card's width, so
            the stroke is pinned with `non-scaling-stroke` — without it the line would thin
            and thicken with the window. */}
        {/* the SVG is wrapped, not stretched directly: with a fixed height and a viewBox it has an
            intrinsic ratio, and Chrome sizes it from THAT instead of from `left`/`right` — measured
            1000 wide in a 985 column before the wrapper went in */}
        <div
          data-analytics-graph
          className="pointer-events-none absolute left-px right-0"
          style={{ top: GRAPH_TOP, height: GRAPH_H }}
          aria-hidden
        >
        <svg
          className="h-full w-full"
          viewBox={`0 0 1000 ${GRAPH_H}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="analytics-area" x1="0" y1="0" x2="0" y2={GRAPH_H} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={ANALYTICS_GREEN} stopOpacity="0.2" />
              <stop offset="0.92" stopColor={ANALYTICS_GREEN} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={area} fill="url(#analytics-area)" />
          <polyline
            points={pts.join(' ')}
            fill="none"
            stroke={ANALYTICS_GREEN}
            strokeWidth="2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        </div>
      </div>
    </div>
  )
}

/**
 * The big card: the strip of five tabs over the chart. Its radii are not one number — the
 * board rounds the top 28 and the bottom 16, so the 24 of the tab strip inside it stays
 * concentric with the shell while the foot matches the four cards below.
 */
function MetricsCard({ pick, setPick, t }: { pick: string; setPick: (id: string) => void; t: (x: Text) => string }) {
  const metric = METRICS.find((m) => m.id === pick) ?? METRICS[0]
  return (
    <section
      data-analytics-metrics
      style={{ '--i': 0 } as CSSProperties}
      className="pane-in-row rounded-bl-[16px] rounded-br-[16px] rounded-tl-[28px] rounded-tr-[28px] bg-[rgba(255,255,255,0.05)] shadow-[inset_0_0_0_1px_var(--gray-800)]"
    >
      <div className="px-2 pt-2">
        <div className="flex items-center gap-[10px] rounded-[24px] bg-[var(--gray-850)] p-2 shadow-[inset_0_0_0_1px_var(--gray-750)]">
          {METRICS.map((m) => (
            <Tab key={m.id} metric={m} on={m.id === pick} onPick={() => setPick(m.id)} t={t} />
          ))}
        </div>
      </div>
      <Chart metric={metric} t={t} />
    </section>
  )
}


/* ───────────────────────────────── the breakdown cards ───────────────────────────────── */

/**
 * One row: a 32 bar track that the name sits ON TOP of, then the count right-aligned 16 away.
 * The bar is the row's share of its own list's maximum — the board's widths encode nothing
 * (110 draws wider than 227 there), so the only honest reading is the one a bar chart means.
 */
function Row({ row, max, flags }: { row: Breakdown; max: number; flags: boolean }) {
  const pct = max > 0 ? Math.max(2, (row.count / max) * 100) : 0
  return (
    <div className="flex items-center gap-4">
      {/* the track CLIPS, not the label: `text-box-trim` leaves the name's box as tall as its
          capitals, so an `overflow: hidden` on the label itself cuts every descender off (g, y, p
          all lost their tails before this moved out). The track is 32 tall and already rounded, so
          clipping there is free — and the cap band still centres on the row's axis, as drawn. */}
      <div className={`relative flex h-8 min-w-0 flex-1 items-center overflow-hidden whitespace-nowrap rounded-lg ${flags ? 'gap-2 pl-2' : 'pl-[10px]'}`}>
        <span
          data-analytics-bar
          className="absolute inset-y-0 left-0 rounded-lg bg-[var(--white-100)]"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
        {flags && row.flag ? <span className="relative flex-none"><Flag code={row.flag} /></span> : null}
        <span className={`relative text-[14px] font-medium text-white ${CAP}`}>{row.label}</span>
      </div>
      <span className={`font-display flex-none text-right text-[14px] text-white ${CAP}`}>
        {row.count.toLocaleString('en-US')}
      </span>
    </div>
  )
}

/**
 * ⚠️ THE TWO COLUMNS' HEADERS DIFFER BY 3 AND THAT IS THE BOARD. Left-hand cards (Country,
 * Device) are pt 24 / pb 15 = 63; right-hand ones (Source, Page) are pt 20 / pb 16 = 60, and
 * their list boxes lose a pixel of right padding the same way. One component, drifted between
 * two columns. Reproduced; raised with the designer rather than quietly evened out.
 */
function BreakdownCard({ card, right, i, t }: { card: (typeof BREAKDOWNS)[number]; right: boolean; i: number; t: (x: Text) => string }) {
  const max = Math.max(...card.rows.map((r) => r.count))
  const flags = card.id === 'country'
  return (
    <section
      data-analytics-card
      data-analytics-card-id={card.id}
      style={{ '--i': i } as CSSProperties}
      className="pane-in-row flex min-w-0 flex-1 flex-col rounded-[16px] bg-[rgba(255,255,255,0.05)] shadow-[inset_0_0_0_1px_var(--gray-800)]"
    >
      <div className={`flex flex-none items-baseline justify-between px-6 ${right ? 'pb-4 pt-5' : 'pb-[15px] pt-6'}`}>
        <h3 className="font-display text-[20px] font-semibold leading-[1.2] text-white">{t(card.title)}</h3>
        <span className="text-[15px] leading-[1.2] text-[var(--white-480)]">{t({ en: 'Visitors', uk: 'Відвідувачі' })}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-2 pb-2">
        <div
          className={`flex flex-1 flex-col gap-[6px] rounded-[12px] pb-[15px] pl-[15px] pt-4 shadow-[inset_0_0_0_1px_var(--gray-750)] ${right ? 'pr-4' : 'pr-[15px]'}`}
        >
          {card.rows.map((r, i) => (
            <Fragment key={r.id}>
              {i > 0 && <span className="h-px w-full flex-none bg-[var(--gray-800)]" aria-hidden />}
              <Row row={r} max={max} flags={flags} />
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}


/* ───────────────────────────────────── the window ────────────────────────────────────── */

export function AnalyticsSurface() {
  const { t } = useT()
  const closeSurface = useUI((s) => s.closeSurface)
  const [pick, setPick] = useState(METRICS[0].id)
  const settle = usePaneSettle()

  /* Esc closes, like every other surface and sheet in the shell. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSurface() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeSurface])

  const metric = METRICS.find((m) => m.id === pick) ?? METRICS[0]

  return (
    <div
      data-analytics-window
      className="flex h-full flex-col overflow-hidden rounded-[16px] border border-[var(--gray-800)]"
      style={{
        background: 'var(--window-base)',
        boxShadow: '0px 8px 8px rgba(0,0,0,0.12), 0px 56px 72px rgba(0,0,0,0.12)',
      }}
    >
      {/* the contents settle into the frame, never the frame itself — App.tsx `usePaneSettle` */}
      <motion.div data-pane-settle className="flex h-full w-full flex-col" style={{ scale: settle ?? 1 }}>
        {/* top bar 48: the module's name, and the way out */}
        <div className="flex h-12 flex-none items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-[#09090b8f]">
              <span data-analytics-mark className="flex text-white">
                <IconAnalytics size={24} />
              </span>
            </span>
            <span className="pb-px text-[13px] font-medium text-[var(--gray-200)]">
              {t({ en: 'Analytics', uk: 'Аналітика' })}
            </span>
          </div>
          <button
            type="button"
            onClick={closeSurface}
            aria-label={t({ en: 'Close', uk: 'Закрити' })}
            data-analytics-close
            /* the composer's glass, the same material the designer asked for on the Cloud
               window's close (23.09.2026); shape stays the board's 32 / r10 */
            className="liquid-glass liquid-glass--composer glass-interactive grid h-8 w-8 place-items-center rounded-[10px] bg-[#09090ba3] text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:text-white"
          >
            <IconCloseM size={24} />
          </button>
        </div>

        {/* the page sheet: `--window-lift`, an 8 % white top hairline, radius 16 (there is no
            menu column on this board, so the sheet runs the whole width) */}
        <div className="flex min-h-0 flex-1 flex-col rounded-[16px] border-t border-[var(--white-100)] bg-[var(--window-lift)]">
          <div className="flex h-[88px] flex-none items-start justify-between pl-8 pr-6">
            {/* 28 above a 38.4 line — the board's Title frame is 88 with the text at 28 */}
            <h2 className="pane-in-head pt-[28px] font-display text-[32px] font-semibold leading-[1.2] text-white">
              {t({ en: 'Analytics', uk: 'Аналітика' })}
            </h2>
            <div className="pane-in-head pt-6">
              <RangeSelect t={t} />
            </div>
          </div>

          {/* the board's page is 1277 tall inside a canvas that is shorter, so it scrolls */}
          <ScrollArea className="min-h-0 flex-1" innerClassName="flex flex-col gap-6 px-4 pb-4" thumb="light">
            <MetricsCard pick={pick} setPick={setPick} t={t} />
            <div className="flex items-stretch gap-6">
              <BreakdownCard card={BREAKDOWNS[0]} right={false} i={1} t={t} />
              <BreakdownCard card={BREAKDOWNS[1]} right i={2} t={t} />
            </div>
            <div className="flex items-stretch gap-6">
              <BreakdownCard card={BREAKDOWNS[2]} right={false} i={3} t={t} />
              <BreakdownCard card={BREAKDOWNS[3]} right i={4} t={t} />
            </div>
          </ScrollArea>
        </div>
      </motion.div>
      {/* which metric the chart is showing — announced, because the tab says it visually */}
      <span className="sr-only" aria-live="polite">{t(metric.label)}</span>
    </div>
  )
}
