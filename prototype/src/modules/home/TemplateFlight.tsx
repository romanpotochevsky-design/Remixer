/**
 * THE TEMPLATE IN THE AIR — the FLIP that carries one template between the
 * picker's full-screen stage and the composer's 56px attachment tile.
 *
 * ONE OBJECT. A template is a single physical thing in this product: a card in
 * the grid, a card in the dock's shelf, the stage it grows into, and the tile it
 * lands in. The grid ⇄ stage hand-off is owned by the picker itself
 * (`DetailView`, a clone INSIDE the sheet). This file owns the hand-offs that
 * cross a surface boundary:
 *
 *   · stage → tile — "Choose a template", and closing the tile's own preview
 *   · tile → stage — clicking the tile to blow the attachment back up
 *   · card → stage / stage → card — the DOCK card's preview (26.08.2026). Same
 *     construction as the tile's: the object starts outside the sheet, so the
 *     picker cannot carry it. The one thing that differs is the content layout —
 *     see `contentWidth`.
 *
 * Neither can live inside the picker, because in the very commit the flight
 * starts the picker is either unmounting (a dissolving sheet cannot carry a
 * flying object) or mounting (the tile is outside it). So the object flies in a
 * page-level fixed layer ABOVE the scrim, and the surfaces underneath only
 * fade. The source rect arrives through the store as plain viewport numbers
 * (`ui.tplFlight`), measured by whoever pressed the button.
 *
 * THE MORPH, and why it cannot be a uniform scale: the stage is ~1.47:1, the
 * tile is 1:1, and the drawing inside them is the SAME `Thumb` at 233.333/218.
 * So the OUTER clip animates translate + scaleX/scaleY (non-uniform, which is
 * what morphs the aspect and crops the drawing progressively), while an INNER
 * wrapper counter-scales per axis so the net content scale is uniform on every
 * frame — the site drawing never stretches, exactly the construction the
 * picker's card→stage flight is built on and QA measured to 0.001px.
 *
 * One extra term this flight needs and the picker's does not: the two homes
 * anchor the drawing differently. The stage is WIDTH-driven (the site fills it
 * and crops at the bottom, as drawn); the tile is HEIGHT-driven (a 1.07:1
 * drawing filling a square must crop at the side). So the content's own width
 * differs between the endpoints, and the uniform content scale `m` is
 * interpolated separately from the clip's scale instead of being equal to it.
 * Both homes anchor TOP-LEFT, so the fixed point of the morph is the box's
 * top-left corner and the crop grows out of the far edges.
 *
 * PERFORMANCE. Transform and opacity only, on two elements, plus the one
 * sanctioned exception the picker already ships: the clip's border-radius is
 * driven per frame, because a painted radius under a non-uniform scale
 * distorts (16px at scaleX 0.03 would show as 0.5px). Single transparent
 * element, composited children, ~0.6s of life.
 */
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useUI, type FlightRect, type TemplateFlight as Flight } from '@/state/ui'
import { FLIGHT_OPEN, FLIGHT_SEAT } from '@/ui/motion'
import { Thumb } from './thumbs'
import { DETAIL_HEADER_H, SHEET_INSET, STAGE_MARGIN_X, STAGE_RADIUS } from './TemplatePicker'
import { PANEL_RESERVE } from './TemplateDetailPanel'
import { rectOf, TILE_RADIUS, TILE_RADIUS_TR } from './attachment'

/** The drawn thumbnail ratio — the card's, the stage's and the tile's alike. */
const THUMB_ASPECT = 233.333 / 218

/** Corner radii as drawn, [tl, tr, br, bl]. The tile's top-right is the board's
 *  8 (`image 381` — the corner the ✕ badge sits on is cut shallower); the stage
 *  rounds its top corners only and runs off the sheet's bottom edge. */
const TILE_CORNERS = [TILE_RADIUS, TILE_RADIUS_TR, TILE_RADIUS, TILE_RADIUS] as const
const STAGE_CORNERS = [STAGE_RADIUS, STAGE_RADIUS, 0, 0] as const
/** The dock card's thumbnail — `rounded-[8px]` on all four, as drawn. */
const CARD_CORNERS = [8, 8, 8, 8] as const

const lerp = (a: number, b: number, v: number) => a + (b - a) * v

/**
 * Where the stage lands, computed from the drawn insets — the fallback for the
 * one frame in which the sheet has not mounted yet.
 *
 * ⚠️ SINCE 01.09.2026 THE STAGE IS NOT THE SHEET MINUS TWO EQUAL MARGINS. The
 * information panel takes a fixed `PANEL_RESERVE` (4 gutter + 432 panel + 8 row
 * gap = 444) off its RIGHT, while the 4 on its left is still its own `Sections`
 * padding — so `STAGE_MARGIN_X` is subtracted once, not twice. At 1656 × 1196:
 * left 20, top 68, 1176 × 1112, which is the drawn box exactly.
 */
function stageRect(): FlightRect {
  return {
    left: SHEET_INSET + STAGE_MARGIN_X,
    top: SHEET_INSET + DETAIL_HEADER_H,
    width: window.innerWidth - 2 * SHEET_INSET - STAGE_MARGIN_X - PANEL_RESERVE,
    height: window.innerHeight - 2 * SHEET_INSET - DETAIL_HEADER_H,
  }
}

/**
 * The width the drawing has inside a given home — see the header note.
 *
 * WIDTH-driven in the stage and in a dock card: the drawing fills the box's width
 * and the box crops whatever is left (the stage crops the site's bottom as drawn;
 * the card's thumbnail is 238.667/218, a hair wider than the drawn 233.333/218 the
 * clone lays out, so its bottom ~5px are cropped too). HEIGHT-driven in the tile:
 * a 1.07:1 drawing filling a 1:1 square has to crop at the SIDE instead.
 *
 * The card's 2.2% crop is the standard price of rule 3 — the content is laid out
 * at the BIG end, so every mismatch lands on the frame where the object is small.
 * Matching the card exactly would mean laying the clone out at 238.667/218 and
 * mismatching the stage instead, i.e. moving the same error onto 1.8M pixels.
 */
function contentWidth(rect: FlightRect, home: 'tile' | 'stage' | 'card'): number {
  return home === 'tile' ? rect.height * THUMB_ASPECT : rect.width
}

export function TemplateFlight() {
  const flight = useUI((s) => s.tplFlight)
  /* Keyed on the direction as well as the drawing: a tile clicked, closed and
     clicked again must get a fresh clone, never a re-aimed one. */
  return flight ? <FlightClone key={`${flight.id}-${flight.to}-${flight.card ?? ''}`} flight={flight} /> : null
}

function FlightClone({ flight }: { flight: Flight }) {
  const land = useUI((s) => s.endTemplateFlight)
  const reduced = useReducedMotion()

  /** 0 = sitting on the source rect, 1 = landed on the destination. */
  const p = useMotionValue(0)

  /*
   * The destination, measured in a LAYOUT effect: React has already committed
   * the DOM that owns it (the tile, or the detail view's stage), and the
   * browser has not painted yet — so the state this sets is flushed into the
   * same frame and the clone's FIRST PAINTED frame already sits on the source.
   * Until then this component renders nothing, which is why there is no flash.
   */
  const [dest, setDest] = useState<FlightRect | null>(null)
  /** The real destination element, hidden while the clone stands in for it. */
  const hidden = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    if (flight.to === 'stage') {
      const stage = document.querySelector<HTMLElement>('[data-detail-stage]')
      setDest(stage ? rectOf(stage) : stageRect())
      return
    }
    /* The two small homes. Both are RE-MEASURED here rather than trusted from
       the press: the dock card in particular may have moved since (a resize
       re-columns the shelf), and a FLIP that lands 4px off its slot is worse
       than one that never flew. */
    const el =
      flight.to === 'tile'
        ? document.querySelector<HTMLElement>('[data-attach-tile]')
        : document.querySelector<HTMLElement>(`[data-dock-card="${flight.card}"] .home-thumb`)
    if (!el) { land(); return }
    /* The clone covers it pixel-for-pixel at the end of the flight; hiding it
       now means there is never a second copy of the same object on screen. */
    el.style.opacity = '0'
    hidden.current = el
    setDest(rectOf(el))
    return () => { hidden.current?.style.removeProperty('opacity') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!dest) return
    /*
     * REDUCED MOTION: no flight at all. The tile simply appears (a short
     * opacity fade run through WAAPI, because the global reduced-motion CSS
     * block kills every CSS animation and transition on the page — the same
     * reason ripple.ts decides its own reduced path in JS). A fade is not
     * motion; a 1600px object crossing the screen is.
     */
    if (reduced) {
      const el = hidden.current
      hidden.current = null
      if (el) {
        el.style.removeProperty('opacity')
        el.animate({ opacity: [0, 1] }, { duration: 150, easing: 'linear' })
      }
      land()
      return
    }
    const run = animate(p, 1, {
      /* Landing in a small home is a CATCH (one hair of overshoot); growing into
         the stage is a surface arriving (flat). Motion doctrine rule 4. */
      ...(flight.to === 'stage' ? FLIGHT_OPEN : FLIGHT_SEAT),
      onComplete: () => {
        /* Reveal and unmount on the same beat: the two are identical pixels at
           this instant, so whichever the browser paints first is one picture. */
        hidden.current?.style.removeProperty('opacity')
        hidden.current = null
        land()
      },
    })
    return () => run.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dest, reduced])

  if (!dest) return null
  return <Morph p={p} flight={flight} to={dest} />
}

function Morph({ p, flight, to }: { p: MotionValue<number>; flight: Flight; to: FlightRect }) {
  const from = flight.from
  /* Where the object is coming from. A `'stage'` flight starts in the composer's
     tile unless it carries a dock card, which is the whole of the card path's
     bookkeeping (see `TemplateFlight` in state/ui.ts). */
  const src: 'tile' | 'stage' | 'card' =
    flight.to === 'stage' ? (flight.card != null ? 'card' : 'tile') : 'stage'
  /* Clip scale: source box over destination box, since the clone is MOUNTED at
     the destination (FLIP's whole point — the settled frame needs no transform). */
  const sx0 = to.width ? from.width / to.width : 1
  const sy0 = to.height ? from.height / to.height : 1
  /*
   * THE CONTENT IS ALWAYS LAID OUT AT THE STAGE'S SIZE, whichever end that is,
   * and then scaled — never laid out at the tile's 60px and magnified.
   *
   * `Thumb` draws in container units, so a 60px-wide layout blown up 27× IS the
   * same picture as a 1616px one — proportionally. What is not the same is the
   * RASTER: laying the site out at 60px and scaling it to full screen means the
   * whole stage is a 60px bitmap stretched, and any px-quantised detail inside
   * the drawing (hairlines, a clamped font size) lands at 1/27 of its share.
   * Putting the layout at the big end moves that mismatch to the moment the
   * object is 56px across — 3k pixels of the page instead of 1.8M — where the
   * swap for the real tile is invisible. It is also what the picker's own
   * card→stage flight has always done (its clone's content is `w-full` of the
   * STAGE, with the 233px card as the source).
   *
   * `s` is the drawing's on-screen scale relative to that layout width: 1 at
   * the stage end, ~0.037 at the tile end. The counter-scale then only has to
   * divide it by the clip's own per-axis scale, and uniformity is automatic.
   */
  const cw = flight.to === 'stage' ? contentWidth(to, 'stage') : contentWidth(from, 'stage')
  const s0 = cw ? contentWidth(from, src) / cw : 1
  const s1 = cw ? contentWidth(to, flight.to) / cw : 1
  const cornersOf = (home: 'tile' | 'stage' | 'card') =>
    home === 'tile' ? TILE_CORNERS : home === 'card' ? CARD_CORNERS : STAGE_CORNERS
  const corners = cornersOf(flight.to)
  const srcCorners = cornersOf(src)

  /*
   * ⚠️ THE SCALE IS INTERPOLATED GEOMETRICALLY, NOT LINEARLY — and this is the
   * one thing that makes a 29 : 1 morph survive a spring with any bounce at all.
   *
   * MEASURED, first cut of this flight (linear, `bounce: .16`): the spring
   * overshot its progress by 0.77% — nothing — and the tile arrived at 0.785×,
   * i.e. it visibly shrank to 44px and grew back. Because with a linear ramp
   * d(scale)/d(progress) is the WHOLE ratio (−27.9 here), a fraction of a
   * percent at the end of the progress is a fifth of the object's size. Under
   * `s(v) = s0^(1−v)` the same overshoot is multiplicative: 0.974×, a 2.6%
   * seat — the "small overshoot" this gesture is supposed to have. It is also
   * the perceptually even way to cross two orders of magnitude (constant
   * relative rate, which is what Keynote's magic move does).
   *
   * The morph stays RIGID under any s(v), because the translation is derived
   * from the fixed point rather than interpolated on its own: a point q in the
   * clone's local box lands at `left + e + s·q`, so demanding that the point
   * q_f never moves gives `e = q_f · (1 − s)` exactly, with
   * `q_f = d / (1 − s0)` from the endpoints. One fixed point, held by
   * construction on every frame, at any easing — which is also what QA
   * recovers from the frames.
   */
  const dx = from.left - to.left
  const dy = from.top - to.top
  /* Degenerate axis (same size, pure translation): the geometric form cannot
     express it — s ≡ 1 leaves e ≡ 0 — so that axis stays linear. */
  const flatX = Math.abs(sx0 - 1) < 1e-3
  const flatY = Math.abs(sy0 - 1) < 1e-3
  const qx = flatX ? 0 : dx / (1 - sx0)
  const qy = flatY ? 0 : dy / (1 - sy0)
  const sxAt = (v: number) => (flatX ? 1 : Math.pow(sx0, 1 - v))
  const syAt = (v: number) => (flatY ? 1 : Math.pow(sy0, 1 - v))
  /** The drawing's own scale, geometric like the clip's. */
  const sAt = (v: number) => s0 * Math.pow(s1 / s0, v)

  const x = useTransform(p, (v) => (flatX ? dx * (1 - v) : qx * (1 - sxAt(v))))
  const y = useTransform(p, (v) => (flatY ? dy * (1 - v) : qy * (1 - syAt(v))))
  const scaleX = useTransform(p, sxAt)
  const scaleY = useTransform(p, syAt)
  /** The counter-scale: net drawing scale = s on BOTH axes, i.e. uniform. */
  const innerX = useTransform(p, (v) => sAt(v) / sxAt(v))
  const innerY = useTransform(p, (v) => sAt(v) / syAt(v))
  /** Visually constant corners under a non-uniform scale — painted radius is
   *  the wanted radius divided by that axis's scale (the `/` form). */
  const radius = useTransform(p, (v) => {
    const sx = sxAt(v)
    const sy = syAt(v)
    /* Visual radius: linear in progress and clamped, since the endpoints are
       both single-digit pixels and the overshoot must not invert a corner. */
    const k = Math.min(1, Math.max(0, v))
    const c = srcCorners.map((r0, i) => lerp(r0, corners[i], k))
    return (
      `${c[0] / sx}px ${c[1] / sx}px ${c[2] / sx}px ${c[3] / sx}px / ` +
      `${c[0] / sy}px ${c[1] / sy}px ${c[2] / sy}px ${c[3] / sy}px`
    )
  })
  /** The destination's own 1px edge, arriving with it. Only lit inside the last
   *  fifth of the flight, where the scale is within a few percent of 1 and a
   *  1px line is still 1px. */
  const rimO = useTransform(p, [0.8, 1], [0, 1])

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]" aria-hidden>
      <motion.div
        data-tpl-flight={flight.to}
        style={{
          position: 'absolute',
          left: to.left,
          top: to.top,
          width: to.width,
          height: to.height,
          x,
          y,
          scaleX,
          scaleY,
          borderRadius: radius,
          transformOrigin: '0 0',
          overflow: 'hidden',
          willChange: 'transform',
        }}
      >
        <motion.div
          style={{ width: cw, scaleX: innerX, scaleY: innerY, transformOrigin: '0 0', willChange: 'transform' }}
        >
          {/* the SAME drawing both homes show, at the drawn ratio: cq units
              inside `Thumb` make any size proportionally identical, which is
              what makes this read as one object and not as two pictures */}
          <div className="relative aspect-[233.333/218] w-full">
            <Thumb id={flight.id} className="absolute inset-0" />
          </div>
        </motion.div>
        {/* The destination's own 1px edge, arriving with it — and only where the
            destination HAS one. The composer's tile draws a 10%-white rim and the
            stage a Gray/750 one; a dock card's thumbnail draws none at rest (its
            rim is a hover state, `.home-thumb-rim`), so flying one in would light
            an edge the shelf does not have. */}
        {flight.to !== 'card' && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: rimO,
              borderRadius: radius,
              boxShadow:
                flight.to === 'tile'
                  ? 'inset 0 0 0 1px var(--white-100)'
                  : 'inset 0 0 0 1px var(--gray-750)',
            }}
          />
        )}
      </motion.div>
    </div>
  )
}
