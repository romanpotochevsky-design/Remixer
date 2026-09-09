/**
 * The question panel — Remixer's own, off Figma 29464:34333 / 34334 / 34335
 * (board "Website Builder / Image Library / Expanded view", read 07.09.2026 when the
 * designer pointed at it).
 *
 * ⚠️ THE PANEL AND THE COMPOSER ARE ONE GLASS OBJECT, not two stacked ones. That is the
 * board's structural decision and the biggest difference from Lovable, whose panel floats
 * 8px above its composer as a separate card. Here a single shell — 7% white over the
 * chat's ground, 15% white rim, blur 16, radius 24 on top and 28 at the bottom — holds the
 * question, the answers and the live composer, with 2px between the card and the field.
 * The shell is mounted by ChatPanel (see `.brief-dock`), because the composer has to live
 * inside it; this file draws what goes above the composer.
 *
 * The answers are a RADIO LIST, not Lovable's 2×2 grid: one row per option, a 16px radio,
 * a 15px title and a 14px line of consequence under it — "what happens if I pick this" —
 * and a last row whose body is the "Write your own…" field. That shape is why the board
 * can ask a question Lovable's grid cannot ("Show 3 design options before building?", the
 * copy drawn on the node), and it is what the designer meant by "the component where you
 * choose answers, palette, fonts".
 *
 * TWO of the four questions are GRIDS rather than rows, and both drop the radio beside
 * their "Write your own…" field, which runs full width instead:
 *  - COLOUR (25732:139123) — a 2×2 grid of four swatch plates.
 *  - LETTERING — a 2×2 grid of cards that set each pair's name IN that pair, which is
 *    Lovable's treatment and what the designer asked for by name (07.09.2026). A question
 *    about type answered in words would ask someone to pick a face they cannot see.
 * A grid holds four; only the radio list is capped at three.
 *
 * Both grids wear the rows' rings: 25732:138657 draws the hovered plate, 29745:57892 the
 * picked one, and both are the pair the rows already have — 1px 32% white, then the 2px
 * house gradient. Our blue `--action` ring, put there while the boards were silent, is
 * gone with them.
 *
 * Where the board is still silent, this file says so at the point of the decision:
 *  - there is no collapse chevron: the board does not draw one (Lovable's had one)
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useT, type Text } from '@/i18n'
import { IconCaretLeft, IconCaretRight } from '@/ui/icons'
import { sheetExit, stepSwap, stepSwapFade } from '@/ui/motion'
import { BRIEF_QUESTIONS, OTHER, type BriefQuestion } from './brief'
import { answerBrief, briefGoTo, briefNext, briefSkipAll, asOther } from './send'
import { useDockSheet } from './dock'

/**
 * The "Write your own…" / "Your answer…" field — Text field I29464:34377;17122:41625.
 * 42 tall, not 40: the board's 40 is the state layer INSIDE a 1px rim. The placeholder is
 * `text/default/secondary`, which in the dark theme is the same `gray-400` the composer's
 * own placeholder uses two rows down — one grey for "type here" inside one shell.
 */
export const FIELD =
  'block h-[42px] w-full rounded-[8px] border border-[#ffffff1f] bg-[#09090b29] pl-4 pr-2 text-[14px] text-white outline-none transition-colors duration-[var(--dur-fast)] ease-std placeholder:text-[var(--gray-400,#a1a1aa)] focus:border-[var(--action)]'

/**
 * The radio (29464:34358 selected / 34366 idle).
 *
 * Selected is a filled `--action` disc with an 8px white pip — Neutral Alpha/1000, which
 * resolves WHITE in the dark theme. (The MCP export prints the light-mode fallback
 * `#09090b` for that token, which would draw a hole instead of a pip; the same trap
 * CLAUDE.md records for the composer's own tokens. Read the render, not the fallback.)
 */
export function Radio({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      /* `brief-radio-off` is what the row's hover brightens to 80% white (index.css);
         a selected radio is a filled disc and has nothing to brighten. */
      className={`grid h-4 w-4 flex-none place-items-center rounded-full border ${
        on ? 'border-[var(--action)] bg-[var(--action)]' : 'brief-radio-off border-[#ffffff7a]'
      }`}
    >
      {on && <span className="h-2 w-2 rounded-full bg-white" />}
    </span>
  )
}

/**
 * The paint both rings are drawn with, mounted once wherever a panel of pickables lives.
 * Its own panel used to hold it inline; Autopilot's proposals wear the same rings
 * (autopilot.ts), so the definitions had to stop belonging to one of the two callers.
 */
export function PickDefs() {
  return (
    <>
      {/* The pick ring's gradient, defined once for every row (index.css "THE BORDER THAT
          DRAWS ITSELF") — the house diagonal, .98 → .55 → .82. It is worn as a MASK
          (`url(#brief-pick-mask)`, luminance = white × the stop alphas) on the ring's `.ink`
          group, not as the stroke's paint: the strokes are opaque so that overlapping dashes
          cannot seam, and the alpha the board gives the ring is applied to the flattened result.
          ⚠️ The mask's rect reaches 5% PAST the group's box: the box is the stroke's centre
          line, and a rect sized exactly to it clipped the stroke's outer pixel (the 2px ring
          rendered 1px). The gradient is `userSpaceOnUse` so that, drawn inside a mask whose
          content units are the box, it still runs −.069 → 1.069 of the BOX, not of the wider
          rect — the same pixels the stroke used to be painted with. */}
      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          <linearGradient id="brief-pick-grad" gradientUnits="userSpaceOnUse" x1="-0.069" y1="0.401" x2="1.069" y2="0.599">
            <stop offset="0" stopColor="#fff" stopOpacity="0.98" />
            <stop offset="0.48" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.82" />
          </linearGradient>
          <mask id="brief-pick-mask" maskContentUnits="objectBoundingBox" x="-0.1" y="-0.1" width="1.2" height="1.2">
            <rect x="-0.05" y="-0.05" width="1.1" height="1.1" fill="url(#brief-pick-grad)" />
          </mask>
        </defs>
      </svg>
    </>
  )
}

/**
 * A PICKABLE — the button behind every answer the panel offers, and the pair of rings it
 * wears. The rows had them first; the boards the designer sent on 08.09.2026 give the
 * colour plates the same pair (25732:138657 hover, 29745:57892 picked) and he asked for
 * the lettering cards to follow ("анимации ховера и клика возьми из компонента с обычным
 * выбором"). So the behaviour lives once, here, and each shape brings only its geometry
 * (index.css: `.brief-opt` for the row, `.brief-tile--swatch` / `--card` for the grids).
 *
 * THE BORDER DRAWS ITSELF (designer, 08.09.2026, Figma 29688:29507: "цвет бордера не
 * равномерно одновременно по всему бордеру появляется, а градиентно по бордеру наполняет
 * объект… плавно и красиво обволакивая бордером пункт. То же самое и на клик, более светлый
 * белый цвет в 2 пикселя так же плавно заполняет пункт по кругу"). So neither ring is a
 * `box-shadow` that fades in: each is an SVG stroke that RUNS once round the row from the
 * top-left corner, clockwise, until it closes on itself — the hover's 1px at 32%, the
 * pick's 2px gradient. The paint and the keyframes are in index.css, "THE
 * BORDER THAT DRAWS ITSELF"; this component only decides WHEN a draw starts:
 *
 *  · `hovKey` bumps on every pointer-enter, remounting the hover stroke so it starts from
 *    the corner again; `hovering` is what shows it. Pointer-leave hides it on a short
 *    fade WHILE it goes on drawing underneath — the light does not snap, it dims. (A CSS
 *    `:hover` could not do this: Chromium drops a removed animation straight to its base
 *    value, measured — a ring half drawn would vanish in one frame, or, with a "full"
 *    base, flash whole.) `:hover` alone is also wrong for a row that MOUNTS under a
 *    still pointer: it would light at once, without the draw.
 *  · `press` bumps on every click, remounting the pick stroke as a draw; when the draw
 *    has closed the key drops to 0 and the same stroke stands still at full — the
 *    picked ring IS the last frame of its own draw, so nothing has to cross-fade. A press
 *    on the option that is already picked draws it again: that is its acknowledgement.
 *    (The hover key drops to 0 the same way once its lap is done.)
 *
 * Under reduced motion neither key moves: the rings appear and go as state.
 */
/** Is the dock this pickable lives in mid-motion (dock.ts puts these classes on `.dock`)? */
const DOCK_MOTION = ['dock-armed', 'dock-rise', 'dock-morph']
const dockInMotion = (el: Element) => {
  const dock = el.closest('.dock')
  return !!dock && DOCK_MOTION.some((c) => dock.classList.contains(c))
}

export function Pick({ className, on, label, title, onPick, children }: {
  className: string
  on: boolean
  label: string
  title?: string
  onPick: () => void
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  const [hovering, setHovering] = useState(false)
  const [hovKey, setHovKey] = useState(0)
  const [press, setPress] = useState(0)
  return (
    <button
      type="button"
      onClick={() => { if (!reduce) setPress((n) => n + 1); onPick() }}
      /* A hover is the POINTER's gesture, not the content's. While the dock is riding —
         the rise, or a morph between questions — the rows slide under a parked pointer and
         would light one after another as they pass: the designer's recording (08.09.2026,
         frame 118) shows a ring on a row nobody pointed at, with the cursor resting on ‹.
         Measured: two rows lit in turn on one morph. So an enter that arrives while the
         dock moves is ignored; the pointer's own next move lights what is really under it. */
      onPointerEnter={(e) => {
        if (dockInMotion(e.currentTarget)) return
        setHovering(true); if (!reduce) setHovKey((n) => n + 1)
      }}
      onPointerLeave={() => setHovering(false)}
      aria-pressed={on}
      data-on={on ? '' : undefined}
      data-hov={hovering ? '' : undefined}
      data-press={press > 0 ? '' : undefined}
      /* Named explicitly: a plate's body is four colours and carries no text at all, so
         without this it would announce itself by its title alone in some readings and by
         nothing in others. */
      aria-label={label}
      title={title}
      /* `brief-pick` carries the ring clocks, the ground the strokes fade from and the
         ring's radius; the shape's own class carries its geometry and spacing. */
      className={`brief-pick relative ${className}`}
    >
      <DrawRing kind="hover" drawKey={hovKey} onDrawn={() => setHovKey(0)} />
      <DrawRing kind="pick" drawKey={press} onDrawn={() => setPress(0)} />
      {children}
    </button>
  )
}

/**
 * One answer row: radio · title · consequence. The row is the click target, so picking
 * an option is a press anywhere on the line rather than on a 16px dot.
 *
 * `brief-opt` carries the row's spacing — index.css, "THE ANSWER ROW'S HOVER" (Figma
 * 29688:26919), "THE SELECTED ROW" (29688:27643): 6px between rows so the two rings can
 * never meet, and the hairline centred in that gap. py-18 both sides: the board's 19th
 * pixel on row 1 was the divider's own weight, and the divider has moved out of the row's
 * box into the gap.
 */
export function Row({ name, detail, on, onPick }: {
  name: Text
  detail?: Text
  on: boolean
  onPick: () => void
}) {
  const { t } = useT()
  return (
    <Pick
      className="brief-opt flex w-full items-start gap-3 py-[18px] pl-4 pr-6 text-left"
      on={on}
      label={t(name)}
      onPick={onPick}
    >
      <span className="flex items-center pt-1.5">
        <Radio on={on} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-medium leading-[1.4] text-white">{t(name)}</span>
        {/* the consequence — what changes on the page if this is picked (29464:34362) */}
        <span className="text-[14px] leading-[1.4] text-[#ffffffa3]">{detail ? t(detail) : null}</span>
      </span>
    </Pick>
  )
}

/**
 * The ring that draws itself around a row — index.css "THE BORDER THAT DRAWS ITSELF".
 *
 * NOT A TRAVELLING LIGHT. The ring is `SEG_N` equal dashes of ONE rounded rectangle (each
 * rect carries `pathLength="1"`, so a dash is a fraction of the perimeter whatever the row's
 * size), and every dash FADES IN ON ITS OWN CLOCK: from nothing to the ring's colour, on a
 * long, soft ease, starting a little later than the dash before it. Nothing moves. What the
 * eye sees is the contour materialising out of nothing — brightest where it started,
 * thinning to nothing where it has not yet begun — and that gradient sweeping round the
 * row as the later dashes catch up. Read against the fifth recording (08.09.2026, "не вижу
 * никакой плавности… появление из полной прозрачности… градиентно, плавно, растушёвано и
 * не дёргано"), this is the picture the board draws: a gradient that APPEARS, not a strip
 * that ARRIVES.
 *
 * WHY THE DASH-LENGTH VERSIONS WERE WRONG, frame by frame off the designer's machine. A
 * drawn dash has a TIP, and at the speed he asked for the tip advanced ~140px a frame: the
 * whole bottom edge lit faintly between two frames ("дёргано"). And the scatter behind the
 * start was a second layer that had to fade OUT for the body to replace it — the left side
 * measured 68 → 48 → 95: lit, dimmed, relit. One value per position can neither jump nor
 * dip: each dash rises once, monotonically, and there is no tip because there is nothing
 * moving, only a schedule.
 *
 * THE SCHEDULE (`startOf`). Position p runs clockwise from the top-left corner. The first
 * fifth of the perimeter COUNTER-clockwise from the corner (the left side and the start of
 * the bottom edge) starts as early as the first fifth clockwise, mirrored — so the light
 * scatters both ways from where it ignites, as the board's corner shows and the third
 * recording asked for. The two schedules meet at p = 0.8 with the same start time, so the
 * clockwise sweep, coming round along the bottom, arrives where the corner's scatter left
 * off with no seam and no second layer. Starts are spread over `SPREAD` of the lap; each
 * dash fades over the rest.
 *
 * ⚠️ THE FADE IS A COLOUR, NOT AN OPACITY, AND THE DASHES OVERLAP. Sixty-four anti-aliased
 * dashes butted end to end seam: where a boundary falls inside a device pixel the two
 * partial coverages composite as alpha and the pixel comes out darker — measured −47/255
 * on the 2px ring, a dark tick every 27px, for the whole draw. Overlapping the dashes
 * instead trades the dark tick for a bright one wherever two translucent strokes stack.
 * So the strokes are OPAQUE: each dash fades from the colour of the GROUND under the ring
 * (`--ring-ground`: the answers card's fill over the dock's flat ground, mixed by the
 * card's alpha) to white, and where one overlaps the next the later simply covers it
 * (neighbours differ by ~3%). The ring's translucency is applied once to the flattened
 * group (`.ink`: the hover's 32% as opacity, the pick's gradient as a luminance mask), so
 * an unlit dash paints the ground at that alpha — invisible over the same ground — and a
 * lit one paints white at it, which is exactly the alpha stroke the board specifies.
 * Measured against the alpha strokes this replaces: ≤ 1/255 everywhere, and no seam at
 * any dash boundary. (A `screen` blend was tried first — exact only when no ancestor is
 * isolated, and motion's wrappers are: it left the 32% ring 8/255 too dark.)
 *
 * `drawKey` > 0 mounts the dashes drawing; at 0 the ring is one solid stroke — the last
 * frame, same pixels. Remounting on a new key restarts the draw; `onDrawn` fires when the
 * lap's own clock (a no-op animation on the group) has run out.
 *
 * Geometry (inset, radius, width) and translucency are CSS per `kind`, so the hover's 1px
 * and the pick's 2px are one component.
 */
/** Dashes round the ring: 64 is ~27px each on the wide row, ~15px in the split — the
 *  steps between neighbours' clocks are far below what the eye can pick out. */
const SEG_N = 64
const SEG_S = 1 / SEG_N
/** Each dash runs this much of the perimeter past its slot into the next dash's: ~5px on
 *  the wide row, ~3px in the split, always more than the anti-aliased edge it has to bury. */
const SEG_LAP = 0.003
/** How much of the lap the start times are spread over; the rest is each dash's own fade.
 *  (The CSS fade duration is `1 − SPREAD` of `--dur` — keep the two in step.) */
const SPREAD = 0.55
/** When a dash at clockwise position p (0…1 from the top-left corner) starts, as a share
 *  of SPREAD: clockwise the share is p itself; the last fifth before the corner mirrors the
 *  first fifth after it (4 × the distance back to the corner), so both schedules read 0.8
 *  at p = 0.8 and hand over without a seam. */
const startOf = (p: number) => Math.min(p, 4 * (1 - p)) / 0.8
const SEGS = Array.from({ length: SEG_N }, (_, k) => ({
  k,
  /* dash k covers [k·s, (k+1)·s + lap]: a single dash `s+lap 2` pushed forward by k·s */
  off: +(-(k * SEG_S)).toFixed(6),
  delay: `calc(var(--dur) * ${(startOf((k + 0.5) / SEG_N) * SPREAD).toFixed(4)})`,
}))
const SEG_DASH = `${(SEG_S + SEG_LAP).toFixed(6)} 2`

function DrawRing({ kind, drawKey, onDrawn }: { kind: 'hover' | 'pick'; drawKey: number; onDrawn?: () => void }) {
  return (
    <svg className={`brief-draw brief-draw--${kind}`} aria-hidden>
      {/* `.ink` carries the ring's translucency (index.css): its children are opaque */}
      <g className="ink">
        {drawKey > 0 ? (
          <g
            key={drawKey}
            className="is-drawing"
            onAnimationEnd={(e) => { if (e.animationName === 'brief-draw-lap') onDrawn?.() }}
          >
            {SEGS.map(({ k, off, delay }) => (
              <rect key={k} className="seg" pathLength="1" strokeDasharray={SEG_DASH} strokeDashoffset={off} style={{ animationDelay: delay }} />
            ))}
          </g>
        ) : (
          <g key={0}>
            <rect className="body" pathLength="1" />
          </g>
        )}
      </g>
    </svg>
  )
}

function Body({ q }: { q: BriefQuestion }) {
  const { t } = useT()
  const answers = useWorld((s) => s.world.brief.answers)
  const value = answers[q.key]
  const own = value && value.startsWith(OTHER) ? value.slice(OTHER.length) : ''
  const picked = value && !value.startsWith(OTHER) ? value : null
  const input = useRef<HTMLInputElement>(null)
  const options = q.options ?? []

  // The field takes focus as each question arrives — you can just type.
  useEffect(() => { if (!options.length) input.current?.focus() }, [q.key, options.length])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); briefNext() }
  }

  /*
   * The colour question is the one with nothing to read, so the board gives it a shape of
   * its own (25732:139123): a 2×2 grid of 40px plates, four cells each, and — this is the
   * tell — the "Write your own…" field full width with NO radio beside it. On the radio
   * list the field is one option among several and needs its dot; here selection lives on
   * the plate, so a radio would be a second, contradictory control. That is also why a
   * text-only question renders its field alone.
   *
   * ⚠️ EACH PLATE SITS IN A 4px BOX OF ITS OWN (the designer redrew the grid on
   * 08.09.2026: "я добавил в палитре дополнительные 4px отступы вокруг кнопки с палитрой,
   * чтобы ховер и селект выглядели хорошо и имели отступ от палитры"). The grid's own
   * numbers are unchanged — 16 round the block, 8 between the boxes, 8 under it — so the
   * boxes land where the plates used to and the plates move 4 inward: 20 from the card's
   * edge, 16 between them. The ring is drawn on the box, never on the plate.
   */
  const swatchGrid = q.kind === 'palette' && options.length > 0
  const typeGrid = q.kind === 'typography' && options.length > 0
  const grid = swatchGrid || typeGrid

  return (
    /* The answers card — 29464:34354: Black/600 over the shell, an 8% white rim, radius 16.
       It is the only surface inside the shell; the question and the footer sit on the glass. */
    <div className="overflow-hidden rounded-[16px] border border-[#ffffff14] bg-[#09090b8f]">
      {swatchGrid && (
        <div className="grid grid-cols-2 gap-2 px-4 pb-2 pt-4">
          {options.map((o) => (
            <Pick
              key={o.id}
              className="brief-tile brief-tile--swatch flex p-1"
              on={picked === o.id}
              label={t(o.name)}
              title={t(o.name)}
              onPick={() => answerBrief(q.key, o.id)}
            >
              {/* the plate — 40 tall, radius 8, a 4% white rim (25732:139125). It never
                  moves: hover and pick are strokes drawn OUTSIDE the box round it. */}
              <span className="flex h-10 flex-1 overflow-hidden rounded-[8px] border border-[#ffffff0a]">
                {o.swatches!.map((c) => (
                  <span key={c} className="h-full flex-1" style={{ background: c }} />
                ))}
              </span>
            </Pick>
          ))}
        </div>
      )}

      {/*
        * The lettering question, as the designer asked for it (07.09.2026, "как это в
        * ловбл сделано"): a 2×2 grid of cards, and each card SETS ITS PAIR'S NAME IN THAT
        * PAIR. That is the whole point — a question about type answered in words would be
        * asking someone to choose a typeface they cannot see. All six faces are bundled
        * for it, subset to the one line each draws (index.css, src/fonts/OFL.txt).
        *
        * Two blocks with a hairline between them, exactly as Lovable's card: the specimen
        * on top, the style's name and what it reads like underneath.
        *
        * The cards take the plates' treatment — the designer asked for it in the same
        * message as the colour boards ("тоже самое и для выбора шрифта можно сделать"):
        * each card sits in a 4px box, the box wears the drawn rings, and the card itself
        * keeps its own rim and never moves. The board draws no lettering grid, so the
        * numbers are read off the colour one: boxes 8 apart inside the block's 16, which
        * puts the cards 20 from the edge and 16 apart.
        */}
      {typeGrid && (
        <div className="grid grid-cols-2 gap-2 px-4 pb-2 pt-4">
          {options.map((o) => (
            <Pick
              key={o.id}
              className="brief-tile brief-tile--card flex p-1 text-left"
              on={picked === o.id}
              label={t(o.name)}
              onPick={() => answerBrief(q.key, o.id)}
            >
              <span className="flex flex-1 flex-col overflow-hidden rounded-[12px] border border-[#ffffff14] bg-[#ffffff05]">
                <span className="block border-b border-[#ffffff0a] px-4 pb-3 pt-3">
                  <span
                    className="block text-[17px] leading-[24px] text-white"
                    style={{ fontFamily: `'${o.heading} Specimen', '${o.heading}', serif` }}
                  >
                    Title - {o.heading}
                  </span>
                  <span
                    className="block text-[13px] leading-[19px] text-[#ffffff7a]"
                    style={{ fontFamily: `'${o.body} Specimen', '${o.body}', sans-serif` }}
                  >
                    Body - {o.body}
                  </span>
                </span>
                <span className="block px-4 pb-3.5 pt-3">
                  <span className="block text-[13px] font-semibold leading-[18px] text-white">{t(o.name)}</span>
                  <span className="mt-0.5 block text-[13px] leading-[18px] text-[#ffffffa3]">
                    {o.detail ? t(o.detail) : null}
                  </span>
                </span>
              </span>
            </Pick>
          ))}
        </div>
      )}

      {!grid &&
        options.map((o) => (
          <Row
            key={o.id}
            name={o.name}
            detail={o.detail}
            on={picked === o.id}
            onPick={() => answerBrief(q.key, o.id)}
          />
        ))}

      <div className={options.length && !grid ? 'flex items-start gap-3 px-4 pb-4 pt-2' : 'px-4 pb-4 pt-2'}>
        {options.length > 0 && !grid && (
          /* the radio centres on the field's full height (self-stretch on the board) */
          <span className="flex h-[42px] items-center">
            <Radio on={!!own} />
          </span>
        )}
        <input
          ref={input}
          value={own}
          onChange={(e) => answerBrief(q.key, asOther(e.target.value))}
          onKeyDown={onKey}
          placeholder={t(q.placeholder)}
          aria-label={t(q.question)}
          className={FIELD}
        />
      </div>
    </div>
  )
}

/**
 * The sheet of questions. Mounted and unmounted by the dock's AnimatePresence in
 * ChatPanel (mode="wait", shared with the plan card), so the two sheets never overlap in
 * the dock and each one gets its own rise and fall (modules/chat/dock.ts).
 *
 * Inside it, the question and its answers are ONE group keyed by step, swapped under a
 * `popLayout` presence: the layout snaps to the new question's height in one commit, the
 * shell's edge glides there on the dock's spring, and the two groups cross — the old one
 * leaving toward where it came from, the new one arriving from the side you are paging
 * to. `dir` is the direction of that page, kept from the previous render.
 */
export function BriefPanel() {
  const { t } = useT()
  const reduce = useReducedMotion()
  const brief = useWorld((s) => s.world.brief)
  const step = brief.step
  const q = BRIEF_QUESTIONS[step] ?? BRIEF_QUESTIONS[0]
  const last = step === BRIEF_QUESTIONS.length - 1
  const sheet = useDockSheet<HTMLElement>(step)

  // Forward (Next, ›) is +1, back (‹) is −1; the first render has no direction to speak of.
  const prevStep = useRef(step)
  const dir = step < prevStep.current ? -1 : 1
  useEffect(() => { prevStep.current = step }, [step])

  return (
    <motion.section
      ref={sheet.ref}
      /* The rise is the dock's (index.css `.dock-rise`, driven by useDockSheet): the
         piston carries the edge, `.dock-sheet` rides it and fades in behind it, and
         `.dock-foot` fades in place. Motion only owns the exit's fade. */
      initial={false}
      animate={{ opacity: 1 }}
      variants={sheetExit}
      exit="exit"
      aria-label={t({ en: 'Questions before building', uk: 'Запитання перед збіркою' })}
      /* No horizontal padding of its own: on the board the panel and the composer are both
         full-width children of the shell, so the answers card and the field share edges. */
      className="relative z-20"
    >
      <PickDefs />
      {/* THE SHEET TRAVELS INSIDE A CLIP — index.css ".dock-clip" (designer's screen
          recording, 08.09.2026: "при переходах есть дефекты и глюки визуальные"). The
          sheet rides the piston, so on a morph to a TALLER question it starts the height
          difference LOWER — and, unclipped, that bottom hung over the footer and over the
          composer for the first third of the spring. The clip is open at the top (where
          the panel's own edge is the boundary and it moves with the content) and closed
          at the sides and along the footer's line, which never moves. */}
      <div className="dock-clip">
      <div className="dock-sheet relative">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={q.key}
            custom={dir}
            variants={reduce ? stepSwapFade : stepSwap}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* the question, 29464:34352 — 16px semibold on the glass itself, pt 20 / pb 18 */}
            <p className="px-4 pb-[18px] pt-5 text-[16px] font-semibold leading-[1.4] text-white">
              {t(q.question)}
            </p>
            <Body q={q} />
          </motion.div>
        </AnimatePresence>
      </div>
      </div>

      {/* footer 29464:34378 — paging left, Skip all + Next right, both on the glass. It
          does not travel with the edge: its buttons are anchored to the field. On the rise
          it lands last — the buttons are the decision, and they should not be there
          before the question is. pb is the board's 16 plus the shell's 2px gap to the
          composer, which here has no element of its own to carry it.

          Every button here takes the house PRESS BLOOM — the Material gesture restyled as
          light blooming from the click point (`press-bloom`, one document-level delegation
          in `ui/ripple.ts`; designer, 08.09.2026: "на эти все кнопки нужно добавить наш
          эффект клика, который мы делали в стиле гугл"). Bloom only, no 8% wash on top:
          each of these already owns its hover — the utilitarian ones the shell's
          `--white-100`, the blue one `--action-hover`. A disabled arrow blooms nothing;
          the delegation checks `disabled` before it spawns. */}
      <footer className="dock-foot flex items-end justify-between pb-[18px] pl-1.5 pr-2.5 pt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => briefGoTo(step - 1)}
            disabled={step === 0}
            aria-label={t({ en: 'Previous question', uk: 'Попереднє запитання' })}
            /* the board dims the unavailable arrow to 25% rather than recolouring it */
            className="press-bloom grid h-8 w-8 place-items-center rounded-[8px] text-white transition-[background-color,opacity] duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent"
          >
            <IconCaretLeft size={24} />
          </button>
          <button
            type="button"
            onClick={() => briefGoTo(step + 1)}
            disabled={last}
            aria-label={t({ en: 'Next question', uk: 'Наступне запитання' })}
            className="press-bloom grid h-8 w-8 place-items-center rounded-[8px] text-white transition-[background-color,opacity] duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent"
          >
            <IconCaretRight size={24} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={briefSkipAll}
            className="press-bloom h-8 rounded-[8px] px-3.5 text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
          >
            {t({ en: 'Skip all', uk: 'Пропустити все' })}
          </button>
          <button
            type="button"
            onClick={briefNext}
            className="press-bloom h-8 rounded-[8px] bg-[var(--action)] px-3.5 text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)] active:bg-[var(--action-pressed)]"
          >
            {last ? t({ en: 'Submit', uk: 'Готово' }) : t({ en: 'Next', uk: 'Далі' })}
          </button>
        </div>
      </footer>
    </motion.section>
  )
}
