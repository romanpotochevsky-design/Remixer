/**
 * The fullscreen template picker — Figma 28616:59168, the popup behind the Home
 * composer's "Add template" pill — and its DETAIL VIEW — Figma 28637:42088,
 * one template's site preview filling the same sheet. Pixel source:
 * docs/features/home-page/figma-spec-add-template.md (§1–11 the grid, §12 the
 * detail view) — every number below is traceable to a node id there.
 *
 * Anatomy, as drawn at 1656 × 1196:
 *   · scrim — 50% black over the whole page, topbar and dock included (the
 *     domain checkout sheet uses 70%; two strengths now exist — spec §10.10)
 *   · sheet — a uniform 16px inset from every viewport edge, radius 16, opaque
 *     `Gray/900` #18181b, overflow clipped; NO border, shadow or backdrop blur
 *   · close — 40×40, radius 12 (the Build button's radius, not the composer
 *     circles'), 12px from the sheet's top-right corner — the board draws 16/16
 *     here, and the 12 is deliberate: this is ONE button serving both views and
 *     the detail bar's own 12px padding is what its position has to satisfy
 *     (see PLATE_SIZE / PLATE_INSET_X)
 *   · content column — the sheet minus its drawn 32px side insets (1560 at the
 *     design size): heading (57 above the cap, 40 below), the dock's category
 *     chips (16 above, 32 below), then a 6-column grid of the dock's template
 *     card at 233.333 × 272 with 32px gaps — 18 cards, third row fully visible
 *     with 81px of sheet below it at the drawn size
 *
 * AWAY FROM THE DESIGN SIZE the column is FLUID: the 32px insets hold and the
 * six columns stretch, so the grid fills the window instead of parking in the
 * middle of it (the capped 1560 column left 484px of dead ground either side at
 * 2560). Card width is the column's output at every width, and the card's HEIGHT
 * follows from the thumbnail's drawn ratio, so the whole card grows in
 * proportion while its caption keeps the drawn type. Geometry and the reasoning
 * for holding six columns on very wide screens: `.tplpick-grid` in index.css.
 *
 * The board draws no scroll state (spec §10.3), but 18 cards fit the drawn
 * height exactly and a library will not stay at 18 — so the sheet body scrolls
 * through the house `ScrollArea` when the viewport is shorter than the design,
 * and on a wide one, where the taller cards outgrow the sheet. At the drawn
 * 1656 × 1196 nothing scrolls, as drawn.
 *
 * …AND WHEN IT DOES SCROLL, THE HEADER COMPACTS — board 28734:65603, drawn
 * 26.08.2026: 215 → 146, the heading 48 → 32 with its cap-top 57 → 40, the chip
 * row 131 → 78, a 1px hairline lit under the chips. ⚠️ Since 26.08.2026 (night)
 * that is a RAMP driven straight by the scroll offset, not a snap plus a spring:
 * the snap moved the grid 69px the reader never asked for and the designer filmed
 * it as «список дергается резко». The law, the arithmetic that ruled out
 * absorbing the jump, and the slip numbers for four input methods live in
 * `design-system.md` §5 «Шапка, которая сжимается при скролле»; the geometry is
 * spec §14; the machinery is `useHeadRamp` below. The same read found the REST
 * board edited too (48px, two-tone, a trailing period at last) — spec
 * §14.0/§14.1, and the reason §3 above is now history.
 *
 * MOTION (nothing is drawn — spec §9; house language from motion.ts): the
 * sheet springs in with its transform-origin at the "Add template" pill, so
 * the surface visibly grows out of the control that summoned it; the scrim
 * fades on the same beat; the content column lands ~60ms later as ONE block —
 * 18 individually-springing cards would be 18 layers of cost and pure noise.
 * Exit is faster than entry and never bounces. Transform/opacity only; the
 * sheet carries no backdrop-filter (it is the biggest surface the product
 * moves — the one static blur here is the 40px close button's, which the spec
 * draws and the budget does not feel).
 *
 * ────────────────────────────── DETAIL VIEW ──────────────────────────────
 *
 * Clicking a card no longer attaches: the board draws a detail step between
 * the card and the attach (spec §12), so the click expands the card's site
 * preview to fill the sheet, and attaching moved to the header's
 * `Choose a template` pill.
 *
 * ⚠️ THREE DOORS, ONE DETAIL SURFACE (`ui.pickerSource`) — and this is the
 * architecture answer for the dock's cards, added 26.08.2026:
 *
 *   · `'pill'` — the library. Grid, then a card opens the detail view with the
 *     picker's OWN internal flight (a clone inside this sheet).
 *   · `'tile'` — one attachment's preview, opened from the composer's tile.
 *   · `'card'` — one template's preview, opened from a DOCK card. Same sheet,
 *     no grid, and the bar's CTA reads `Remix this template` instead of
 *     `Choose a template` (two different actions must not share a word:
 *     `decisions.md`, 26.08.2026).
 *
 * The alternative was to hoist the detail view into its own module and give the
 * dock a second host for it. It was rejected on what the two paths actually
 * SHARE: the scrim, the 16px sheet, the never-moving ✕, the focus trap, the Esc
 * ladder, the plate unroll and the stage with its scroller are all this sheet's,
 * and a second host would either duplicate them or drag them out into a third
 * file that both import — for a difference that is one string and one callback.
 * The dock's path is not even a new SHAPE: `'tile'` already meant "no grid, a
 * plain fade, and a page-level flight because the object lives outside the
 * sheet", which is exactly the dock's case (a card in the shelf is as far
 * outside this sheet as the composer's tile is). So the third door is one more
 * value in a union, the same way `Surface` grows (state/ui.ts) — and the flight
 * that crosses the boundary stays in the ONE place that already owns crossing
 * flights, TemplateFlight.tsx.
 *
 * ⚠️ Why the dock's flight is NOT the picker's internal one, which would have
 * been free: the sheet on this path FADES in (there is no grid to grow out of,
 * and the object is the gesture), and a clone living inside a fading sheet flies
 * translucent. The page-level layer is above the scrim, so the object stays
 * opaque over a surface that is still arriving — the same reason the tile's path
 * is built that way.
 *
 * ⚠️ THE BAR WAS REDRAWN 26.08.2026 — the designer compressed it a notch and
 * turned the CTA blue. Layout as drawn now (§12 + the dated update block), with
 * ONE deliberate deviation — the ✕ is 40, not the 36 he drew here (see
 * PLATE_SIZE):
 * a **64px** header strip on the sheet's own ground (row `gap 16; padding
 * 12 12 12 0; justify-end` — it was 72 / `16 16 16 0`) — back ← (32px icon
 * button at **16, 16**), the template name (Gilroy Medium **16**, cap-trimmed)
 * with the pill 32px to its right (40 tall, radius 10, fill
 * `Background/Blue/Default` = **#1587ff**, the house action blue, white PN
 * Semibold 14 label, a + in a 24 box), and the ✕ — drawn **36 × 36, radius 10 at
 * (right 12, top 14)**, shipped **40 × 40, radius 12 at (right 12, top 12)**
 * because 36 is not a size in the design system (PLATE_SIZE). The title+pill group
 * is genuinely centred on the board too (both zones 64 at the drawn 36), so the old
 * 4px flex drift is gone — and our 40px ✕ puts 4px of it back on the right zone
 * (68), which changes nothing: the group has always shipped truly centred.
 * Below: the stage — 4px side margins, flush with the sheet's bottom, top
 * corners radius 8, a 1px **`Gray/750` #33333a** rim (was `Gray/800`), the
 * site cropped by the bottom edge and scrolling under the house indicator.
 *
 * THE TRANSITION IS THE DELIVERABLE, and it is one FLIP morph: the detail
 * stage mounts at its final layout and flies FROM the clicked thumbnail's
 * measured rect — transform only, one springed progress value, SPRING_SOFT.
 * The card thumb (~1.07:1) and the stage clip (~1.48:1) have different
 * aspects, so a uniform scale cannot be seamless; instead the OUTER clip
 * animates translate + scaleX/scaleY (non-uniform) while an INNER wrapper
 * counter-scales Y by exactly scaleX/scaleY per frame — the net content scale
 * is uniform on both axes, and the changing clip box crops the site's bottom
 * progressively, exactly like the board's bottom-cropped preview. Both boxes
 * are top-left-anchored: card and stage both show the site's top. The content
 * is the SAME `Thumb` drawing at the card's drawn aspect (233.333/218 — cq
 * units make the enlarged render proportionally identical to the card), which
 * is what makes the morph read as one object growing rather than a swap.
 *
 * Around the flight, on the same beat: the clicked thumbnail hides instantly
 * (the clone covers it pixel-for-pixel, so no double image); the rest of the
 * grid fades as one block (~0.18s); the heading and chips fade up ~8px
 * (~0.15s); the ✕'s glass plate "unrolls" leftward — a clone anchored at its
 * right edge springs scaleX/scaleY into the header band (sheet width minus
 * the ✕'s own 12px insets × the 64 header — both terms re-derived for the new
 * bar; the plate's centre line, 12 + 20 = 32, is still exactly the bar's
 * centre, which is why the band needs no vertical offset term — that identity
 * is the reason the ✕'s TOP inset had to be the row's 12), its fill
 * pouring 0→1→0 so it never doubles the real plate it starts on and dissolves
 * into the sheet's black (the board draws no visible bar); the band carries no
 * rim — a 1px border under a ~40× stretch smears, and the static ✕ above it
 * draws the rimmed plate. The ✕ button itself never moves — not between the two
 * views and not across either of the designer's two passes over its size, which
 * is the whole reason one number serves both (see PLATE_SIZE). Header contents
 * arrive a beat later (+60ms, house
 * rule): ← slides in from the left, the name and the pill fade up, ~30ms
 * apart. Scrolling switches on only after the spring lands, by swapping the
 * flight clone for the real `ScrollArea` stage in one commit — the two are
 * pixel-identical at that moment, so the swap is invisible.
 *
 * BACK (← or Esc) is the reverse, faster and bounceless per the house exit
 * doctrine: header contents fade ~0.1s, the plate condenses into the ✕
 * (duration-capped spring ~0.26s), the stage flies into the card's CURRENT
 * rect — re-measured at close, with the card scrolled into view first if the
 * grid moved — while grid, heading and chips fade back in under it. Esc in
 * detail goes back; Esc on the grid closes; ✕ and the scrim close the whole
 * picker from either view (the sheet exits showing the detail, which is why
 * `pickerDetail` deliberately survives the close — see state/ui.ts). Choose
 * runs the existing attach path and the whole picker leaves through its
 * normal close animation. Under reduced motion there is no flight at all —
 * the detail fades in place, and back likewise (the root MotionConfig strips
 * the variant transforms; the imperative flight branches on useReducedMotion).
 *
 * ⚠️ The one deliberate exception to "no per-frame paint": the flight clone's
 * border-radius is driven per frame, because a painted radius under a
 * non-uniform scale distorts (8px at scaleX .14 shows as ~1px, and the card's
 * corners are visibly 8). It is a single element, transparent, whose children
 * are composited layers — Chromium keeps the rounded clip on the compositor —
 * and it runs only for the ~0.5s of flight. MEASURED, A/B on the built app in
 * a software-rendered browser (the artifact panel's worst case): the flight
 * costs the same with the radius line pinned static, and the same with the
 * site swapped for flat paint — median ~66ms/frame either way against the
 * approved fullscreen sheet entrance's ~50ms and a clean 16.7ms idle. The
 * cost is the software compositor moving viewport-sized layers, the exact
 * class the sheet already pays; on GPU this is all compositor-thread work.
 * Everything else in both directions is transform/opacity.
 */
import { AnimatePresence, animate, motion, useMotionValue, usePresence, useReducedMotion, useTransform, type Variants } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useUI } from '@/state/ui'
import { useT } from '@/i18n'
import {
  libraryIn, TEMPLATES, TEMPLATE_LIBRARY,
  type Template, type TemplateCategoryId,
} from '@/data/templates'
import { startBuild } from '@/modules/chat/send'
import { ScrollArea, type ScrollMetrics } from '@/ui/ScrollArea'
import { IconArrowLeft, IconClose, IconPlus } from '@/ui/icons'
import { modalScrim, fullscreenSheet, fullscreenSheetFade, fullscreenContent, gridSwapBehind, SPRING_SOFT } from '@/ui/motion'
import { CategoryChips, TemplateCard } from './Dock'
import { Thumb } from './thumbs'
import { rectOf } from './attachment'

/** The sheet's inset from every viewport edge (board: (16, 16) 1624 × 1164). */
export const SHEET_INSET = 16
/**
 * Detail header strip — `Buttons` 28637:43245. **64 tall since the designer's
 * 26.08.2026 pass** (was 72): the row's padding went `16 16 16 0` → `12 12 12 0`,
 * so 12 + 40 (the tallest child, the title+pill group) + 12 = 64.
 */
export const DETAIL_HEADER_H = 64
/** The stage's side margins — the drawn `Sections` px-4 (spec §12.2). */
export const STAGE_MARGIN_X = 4
/** The stage's drawn clip radius (top corners; the bottom runs off the sheet). */
export const STAGE_RADIUS = 8
/**
 * The ✕ plate — the box the header band unrolls from, and the box the band's
 * right edge stays glued to. **40 × 40, radius 12, at (right 12, top 12)**.
 *
 * ⚠️ THE SIZE IS A SYSTEM RULE, NOT A BOARD READ (designer, 26.08.2026, answering
 * §12.6-Q9). The two boards disagreed — the list board 28633:14905 draws this
 * button 40 × 40 / r12 / (16, 16), the redrawn detail bar 28640:43357 draws it
 * 36 × 36 / r10 / (12, 14) — and the tie-break came from the design system rather
 * than from either drawing: «у нас в дизайн системе 3 варианта размеров у кнопок:
 * 32 (Small), 40 (Medium), 48 (Large)». 36 is not one of them, so the 36 is a
 * board accident and the answer is 40 / r12 — which is also what the Liquid Glass
 * canon table has said all along (`design-system.md` § «Liquid Glass», the
 * `.liquid-glass--dim` row: "close пикера (40×40 r12)").
 *
 * ⚠️ ITS POSITION IS ONE PAIR OF INSETS FOR BOTH VIEWS, and that is what makes the
 * numbers below deviate from both boards. This is ONE physical button: it lives on
 * the sheet, above the list and above the detail bar, and it must not jump when
 * the bar arrives (the sheen rollback of 17.08.2026 is the standing lesson about
 * motion no board draws). Of the four drawn candidates only ONE satisfies the bar:
 * the bar is 64 tall with `padding 12 … 12`, and 12 + 40 + 12 = 64 exactly, so
 * top 12 is the only inset at which the 40 box is centred in the bar — i.e. the
 * only one that keeps the plate's centre line ON the bar's (12 + 20 = 32 = 64 / 2),
 * which is the identity the whole unroll is built on. The right inset follows the
 * bar's own `padding-right: 12` for the same reason: it is the band's terminus.
 * The cost is 4px against the list board's 16/16 corner — the smallest deviation
 * available, and the alternative (16/16 in the list, 12/12 in the detail) is a
 * button that slides 4px diagonally on every open.
 */
const PLATE_SIZE = 40
/**
 * The ✕'s right inset — also the header band's left terminus when unrolled.
 * Its TOP inset is the same 12 (see above) and is deliberately not a constant: no
 * math needs it, because 12 + 40 / 2 = 32 = DETAIL_HEADER_H / 2 is an identity, so
 * the band centred on the plate is already centred on the bar. It lives as the
 * literal `top-3` on both the button and the clone (Tailwind purges non-literal
 * class names — the standing rule in CLAUDE.md), and those two must stay in step.
 */
const PLATE_INSET_X = 12

/** Everything the browser lets you Tab to inside the sheet. */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/* ────────────────── THE HEADER THAT COMPACTS AS THE GRID SCROLLS ──────────────────
 *
 * Board **28734:65603** (26.08.2026) is the same sheet, scrolled: the title
 * block has collapsed 215 → 146 and a hairline has appeared under the filter
 * chips. Everything below is that diff, and every number is a tool read — see
 * `figma-spec-add-template.md` §14.
 *
 *          rest (28626:539)                    scrolled (28734:66372)
 *   57  above the heading's cap          40
 *   48px Gilroy SemiBold, two-tone       32px, same copy, same two tones
 *   40  below                            16 (4 here + the 12 of unused cap box)
 *   16 / 36 / 32  the chip row           16 / 36 / 16, + a 1px rule at its foot
 *   ── 215 ──                            ── 146 ──
 *
 * WHAT MOVES, AND BY HOW MUCH — all four are differences of drawn numbers, so
 * nothing is measured at runtime and nothing can drift:
 */
/** The heading's cap-top: sheet y 57 → 40. */
const D_TITLE = 17
/** The chip row's top edge: 131 → 78. */
const D_CHIPS = 53
/** The chip row's own bottom padding, 32 → 16 — the rule's travel ON TOP of the
 *  row's, which adds up to the 69 of the header's bottom edge. */
const D_RULE = 16
/** The header's bottom edge, 215 → 146 — and with it the ramp's only possible
 *  length (`RAMP` below is this number, and that is not a coincidence: the foot
 *  can only track the first card row if the two are equal). */
const D_BODY = 69
/** …and the two heights themselves, which the plate needs to turn 69px of
 *  travel into a scale of its own box. */
const HEAD_H = 215
const HEAD_H_COMPACT = 146
/** The two type sizes the heading hands off between (48 → 32, cap-trimmed). */
const TITLE_LG = 48
const TITLE_SM = 32

/**
 * ⚠️ THERE IS NO TRIGGER ANY MORE, AND THAT IS THE BUG FIX (26.08.2026 night).
 *
 * Designer: «есть баг при прокрутке этого списка, когда скролишь, список дергается
 * резко». The first cut of this header was a SNAP plus a cover: `compact` flipped
 * at scrollTop 20 (released at 4), the paddings changed in one commit, and every
 * part that moved was put back with a transform and sprung home over 440ms. That
 * hides the snap from the HEADER — and says nothing about the GRID, which is the
 * half a reader actually feels. Compacting hands 69px of viewport to the scroller,
 * so at an unchanged scrollTop every card moves 69px UP; the spring only spread
 * that over five frames. Measured on the shipped build (wheel, 24 × 18px, per-frame
 * samples of `scrollTop` and the first card's viewport y): worst frame **16.6px of
 * content movement with `ΔscrollTop` exactly 0**, six frames over 3px, content
 * travelling 31.1px against 18px of scroll. Under a finger that is a lurch.
 *
 * ABSORBING IT (move `scrollTop` by what the header gave back) cannot work here,
 * and the arithmetic says so before any code does: cancelling a 69px jump needs
 * 69px of scroll to give back, and at the flip there are **36** — of which only
 * 32 can be spent before dropping under the release line and un-compacting.
 * Measured ceiling: **46 %** of the displacement, with the rest still lurching and
 * the spent 32px being itself a silent scroll the user did not ask for.
 *
 * So the header's height is now a CONTINUOUS FUNCTION OF THE SCROLL, and the
 * ramp's length is forced by geometry rather than chosen:
 *
 *   header foot(S) = 215 − 69 · min(S / R, 1)        first row's y(S) = 215 − S
 *
 * The foot rides exactly on the first row's top edge for every S ≤ R **iff
 * R = 69** — shorter and the foot outruns the content, opening a gap under the
 * header; longer and the plate eats into the row. So the collapse is paid for,
 * pixel for pixel, by the scroll that uncovers the content it gives up, and the
 * content itself only ever moves with the scroll: no snap, no spring, no clamp
 * to read, and nothing to flap at a threshold.
 */
/** The ramp: the header's own travel (`D_BODY`), which is the only length at
 *  which the foot tracks the first card row — see the derivation above. */
const RAMP = D_BODY

/** Written per frame by `useHeadRamp` — one element, its transform and,
 *  where it has one, its opacity. */
type Part = React.MutableRefObject<HTMLElement | null>

/**
 * THE RAMP — one function of the scroll offset, written imperatively.
 *
 * Nothing here changes layout, and nothing here is a spring: every part of the
 * header carries the difference between its two drawn positions as a transform
 * scaled by `u = min(scrollTop / RAMP, 1)`. The header's LAYOUT box stays at its
 * rest height 215 in both states — what you see as 146 is the plate's `scaleY` —
 * so the scroller's box never resizes, and the grid therefore never moves for any
 * reason except the scroll itself. That is the whole fix (see RAMP above).
 *
 * It is called from the scroller's own metrics callback, i.e. once per scroll
 * event (the browser coalesces those to one per frame) and once per resize.
 * Transform and opacity only; at `u === 0` every inline style is REMOVED, so a
 * header sitting at the top of the list is byte-identical to the DOM this feature
 * never touched.
 *
 * ⚠️ The parts move UP here (negative), where the old snap-and-cover moved them
 * DOWN: there the layout had already jumped to the compact geometry and the
 * transform put each part back where it had been. Same distances, opposite sign,
 * because the layout no longer moves at all.
 */
function useHeadRamp(parts: {
  plate: Part; title: Part; lg: Part; sm: Part; chips: Part
  rule: Part
}) {
  /* Whether the parts are currently promoted. Toggled at most twice per gesture
     (on leaving the top, and on landing on either end) rather than per frame:
     `will-change` written every frame is worse than not writing it at all. */
  const hot = useRef(false)
  /* The last u written. Scrolling DEEP in the list reports a new offset every
     frame while u has been pinned at 1 for hundreds of pixels — and re-writing
     six identical transforms per frame is exactly the per-frame work this file's
     contract is about. Measured on the built app, a scroll loop crossing the band:
     35.8 → 45.5 fps with this guard, against 40.8 for the snap-and-spring design
     it replaces. */
  const wrote = useRef(-1)
  return useCallback((pos: number) => {
    const u = Math.min(1, Math.max(0, pos / RAMP))
    if (u === wrote.current) return
    wrote.current = u
    const els = [parts.plate, parts.title, parts.lg, parts.sm, parts.chips, parts.rule]
    /* The plate is promoted in CSS for a measured reason (index.css); these are
       the ones that only need a layer while the ramp is actually moving. */
    const promote = [parts.title, parts.lg, parts.sm, parts.chips, parts.rule]
    const mid = u > 0 && u < 1
    if (mid !== hot.current) {
      hot.current = mid
      for (const r of promote) if (r.current) {
        if (mid) r.current.style.willChange = 'transform'
        else r.current.style.removeProperty('will-change')
      }
    }
    if (u === 0) {
      /* Home. Leave nothing behind — the CSS already says every rest value. */
      for (const r of els) if (r.current) {
        r.current.style.removeProperty('transform')
        r.current.style.removeProperty('opacity')
      }
      return
    }
    /*
     * The type size, GEOMETRICALLY: 48 · (32/48)^u. At this 1.5 : 1 ratio a linear
     * ramp would look much the same, but the house rule for a scale that crosses
     * sizes is the multiplicative one (the flight's note in TemplateFlight.tsx),
     * and it is what guarantees the identity the two inks are built on: the 48
     * ink at `shrink` and the 32 ink at `shrink · 1.5` are the SAME size on
     * screen at every value of u, which is why the hand-off shows no ghost.
     */
    const shrink = Math.pow(TITLE_SM / TITLE_LG, u)
    if (parts.plate.current) {
      /* The plate IS the header's visible height, and it is written as the two
         DRAWN heights rather than as their difference: 215 → 146, top-anchored.
         (They agree by construction — D_BODY is HEAD_H − HEAD_H_COMPACT.) */
      parts.plate.current.style.transform = `scaleY(${1 - (1 - HEAD_H_COMPACT / HEAD_H) * u})`
    }
    move(parts.title, -D_TITLE * u)
    paint(parts.lg, `scale(${shrink})`, ramp(1 - u))
    paint(parts.sm, `scale(${(shrink * TITLE_LG) / TITLE_SM})`, ramp(u))
    move(parts.chips, -D_CHIPS * u)
    /* The hairline travels its own 16 on top of the row's 53 — 69 in total, i.e.
       exactly the foot — and fades in with the state it belongs to. */
    paint(parts.rule, `translateY(${-D_RULE * u}px)`, u)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/** Each ink is fully opaque for half the flight, so the two together always
 *  cover the glyphs completely — a plain linear cross-fade would dip the text
 *  to 75% coverage in the middle and read as a flicker of weight. */
const ramp = (x: number) => Math.min(1, Math.max(0, x * 2))
const move = (r: Part, y: number) => {
  if (r.current) r.current.style.transform = `translateY(${y}px)`
}
const paint = (r: Part, transform: string, opacity: number) => {
  if (!r.current) return
  r.current.style.transform = transform
  r.current.style.opacity = String(opacity)
}

/**
 * Leaving the ATTACHMENT'S OWN PREVIEW (`pickerSource === 'tile'`): every way
 * out — ←, Esc, ✕, the scrim — is the same gesture, because on this path the
 * grid does not exist to go back to. The stage leaves the way it came: it flies
 * home into the tile through the page-level flight layer, while the sheet and
 * the scrim dissolve out from under it.
 *
 * One state write does all of it (`closeAttachedPreview`), so the detail view
 * stands down in the same commit the clone takes over — nothing is ever drawn
 * twice. If either end has gone missing (never expected), fall back to a plain
 * close rather than flying into nothing.
 */
function returnToTile(index: number) {
  const ui = useUI.getState()
  const stage =
    document.querySelector('[data-detail-stage]') ?? document.querySelector('[data-detail-clone]')
  const tile = document.querySelector('[data-attach-tile]')
  if (!stage || !tile) { ui.closeTemplatePicker(); return }
  ui.closeAttachedPreview(index, TEMPLATE_LIBRARY[index].id, rectOf(stage))
}

/**
 * The same gesture for a DOCK card's preview (`pickerSource === 'card'`): every
 * way out flies the object home into the card it grew from. The destination is
 * NOT taken from the opening measurement — the flight layer re-measures
 * `[data-dock-card="N"] .home-thumb` at landing time, because the shelf can
 * re-column under a resize while the preview is up.
 */
function returnToCard(card: number) {
  const ui = useUI.getState()
  const stage =
    document.querySelector('[data-detail-stage]') ?? document.querySelector('[data-detail-clone]')
  const home = document.querySelector(`[data-dock-card="${card}"] .home-thumb`)
  if (!stage || !home || !TEMPLATES[card]) { ui.closeTemplatePicker(); return }
  ui.closeCardPreview(card, TEMPLATES[card].id, rectOf(stage))
}

/**
 * The FLIP flight, precomputed: where the stage must fly from, as deltas in
 * the sheet's LAYOUT space. gBCR is divided by the sheet's current uniform
 * scale so a flight that starts while the sheet's own entrance spring is
 * still settling aims at the settled geometry, not at a 0.96× snapshot —
 * the clone lives inside the sheet and inherits that transform anyway.
 */
interface FlightGeom {
  /** card-thumb left/top minus the stage's layout position */
  dx: number
  dy: number
  /** card-thumb size over the stage's layout size */
  sx: number
  sy: number
  /** header-band width over the plate's 40 */
  plateSX: number
}

function flightGeometry(sheetEl: HTMLElement, index: number): FlightGeom | null {
  const thumb = sheetEl.querySelector(`[data-tpl-card="${index}"] .tplpick-thumb`)
  if (!thumb) return null
  const s = sheetEl.getBoundingClientRect()
  const k = s.width / sheetEl.offsetWidth || 1
  const r = thumb.getBoundingClientRect()
  const stageW = sheetEl.offsetWidth - STAGE_MARGIN_X * 2
  const stageH = sheetEl.offsetHeight - DETAIL_HEADER_H
  return {
    dx: (r.left - s.left) / k - STAGE_MARGIN_X,
    dy: (r.top - s.top) / k - DETAIL_HEADER_H,
    sx: r.width / k / stageW,
    sy: r.height / k / stageH,
    /* The band spans the ✕'s own insets (12 … W−12), so its right edge is the
       plate's right edge by construction — no seam. Measured off PLATE_INSET_X,
       not SHEET_INSET: those were both 16 until 26.08.2026, and are not now. */
    plateSX: (sheetEl.offsetWidth - 2 * PLATE_INSET_X) / PLATE_SIZE,
  }
}

/* ------------------------------------------------------------- list ⇄ detail
 * The list's two blocks while the detail view is up. Opacity only (the
 * heading also drifts up 8px). They must ALSO leave the Tab order and the
 * accessibility tree once faded — while keeping their layout and scroll
 * position alive, so the back flight can re-measure the clicked card's rect
 * and land in it. That is `visibility: hidden`, applied AFTER the fade.
 *
 * ⚠️ NOT via `transitionEnd`, which was built for exactly this: measured on
 * the built app, the head block (opacity + y) kept `visibility: visible`
 * after its 'detail' animation completed, while the grid block (opacity
 * only) hid correctly — with motion 11 splitting values across accelerated
 * and JS-driven animations, the post-fade write is dropped when a transform
 * rides along. Caught because the six invisible chips were still Tab stops
 * and the focus trap wrapped onto one. So the post-fade hiding is React's:
 * an `invisible` class driven off the fade's own onAnimationComplete —
 * no timers, still in step with the motion tokens. */
const listHead: Variants = {
  list: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.2, 0, 0, 1] } },
  detail: { opacity: 0, y: -8, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } },
}
const listGrid: Variants = {
  list: { opacity: 1, transition: { duration: 0.18, ease: [0.2, 0, 0, 1] } },
  detail: { opacity: 0, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
}

/** Detail header contents — rule 3, one beat after the flight starts, ~30ms
 *  apart (custom 0 = back arrow from the left, 1 = title, 2 = the pill).
 *  Leaving is a flat 0.1s fade, house exit doctrine. */
const headerBit: Variants = {
  pre: (i: number) => ({ opacity: 0, x: i === 0 ? -8 : 0, y: i === 0 ? 0 : 6 }),
  in: (i: number) => ({ opacity: 1, x: 0, y: 0, transition: { ...SPRING_SOFT, delay: 0.06 + i * 0.03 } }),
  out: { opacity: 0, transition: { duration: 0.1, ease: [0.4, 0, 1, 1] } },
}

export function TemplatePicker() {
  const open = useUI((s) => s.templatePickerOpen)
  const close = useUI((s) => s.closeTemplatePicker)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      /* Esc peels one layer, like the domain surface: detail → grid → closed.
         Read at event time — the picker stays mounted across both. */
      const s = useUI.getState()
      /* …except on the tile's own preview, where there is no grid underneath:
         one Esc flies the object home and closes the whole thing. */
      if (s.pickerSource === 'tile' && s.pickerDetail !== null) returnToTile(s.pickerDetail)
      /* …and the dock's preview, which likewise has no grid underneath. */
      else if (s.pickerSource === 'card' && s.pickerCard !== null) returnToCard(s.pickerCard)
      else if (s.pickerDetail !== null) s.closeTemplateDetail()
      else s.closeTemplatePicker()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return <AnimatePresence>{open && <PickerOverlay onClose={close} />}</AnimatePresence>
}

function PickerOverlay({ onClose }: { onClose: () => void }) {
  const { t } = useT()
  const attach = useUI((s) => s.attachTemplate)
  const detail = useUI((s) => s.pickerDetail)
  const openDetail = useUI((s) => s.openTemplateDetail)
  const backToGrid = useUI((s) => s.closeTemplateDetail)
  /* Which surface this is: the library (opened by the pill), one attachment's
     own preview (the tile), or one dock card's preview. See `ui.pickerSource`
     and the THREE DOORS note at the top of this file. */
  const source = useUI((s) => s.pickerSource)
  const card = useUI((s) => s.pickerCard)
  const fromTile = source === 'tile'
  const fromCard = source === 'card'
  /* Both of those open ONE template's preview with no grid behind it, and both
     are carried across the surface boundary by the page-level flight layer. Every
     place that only cares about "is this the library?" asks this. */
  const detailOnly = fromTile || fromCard
  const sheet = useRef<HTMLDivElement>(null)
  /*
   * True from "Choose a template" until the sheet has faded: the surface is
   * leaving in place while the chosen template flies out of it into the
   * composer. It is NOT `closeTemplatePicker` — that would hand the exit to
   * AnimatePresence, whose variant shrinks the sheet back toward the pill, and
   * a sheet collapsing toward one corner while the object flies to another is
   * two gestures for one pair of eyes (motion.ts, `dissolve`). The overlay
   * closes itself when the fade lands.
   */
  const [dissolving, setDissolving] = useState(false)
  /* Set the moment a template is chosen, so the focus restore below knows to
     stand down: the composer's own effect puts the caret back in the field
     after a pick, and two owners fighting over focus 200ms apart reads as a
     glitch. */
  const picked = useRef(false)
  /* The clicked thumbnail's flight geometry, measured IN the click handler —
     before React mounts the detail view — so the clone's very first painted
     frame already sits on the card. A ref, not state: it is consumed once, at
     the detail view's mount. */
  const flightFrom = useRef<FlightGeom | null>(null)

  /* The board draws "All templates" active. Per-open state, not the store:
     this overlay remounts on every open, so each open starts where the board
     does instead of inheriting the dock's filter (or a previous visit's). */
  const [filter, setFilter] = useState<TemplateCategoryId>('all')

  /* True once the list's fade-out under the detail view has COMPLETED — the
     moment it may take `visibility: hidden` (see the note on listHead/
     listGrid). Cleared in the card click handler, before the next fade. */
  const [listParked, setListParked] = useState(false)

  /*
   * True until the entrance spring lands. While it is, the cards' hover ring
   * gets a zero duration (`--card-hover-dur`), because the sheet arriving under
   * a parked cursor leaves one card hovered without the pointer ever moving —
   * and a ring fading itself in on a surface that is still growing reads as the
   * grid glitching. See the note on the ring in Dock.tsx's TemplateCard. One
   * boolean, flipped once by the spring's own completion: no timers to keep in
   * step with the motion tokens, and nothing per frame.
   */
  const [entering, setEntering] = useState(true)

  /*
   * THE HEADER'S HEIGHT IS A FUNCTION OF THE SCROLL (board 28734:65603 is its
   * u = 1 end; the rest board is u = 0). No state, no threshold, no spring — see
   * the RAMP note above for the bug this replaced and the arithmetic that ruled
   * out absorbing it instead.
   *
   * Driven by the scroller the house already has, through the offset its own
   * indicator reads anyway (`ScrollArea`'s `onMetrics`) — no second listener, no
   * layout read of ours, and nothing re-rendered: the ramp writes transforms
   * straight to six elements.
   */
  const scroller = useRef<HTMLDivElement | null>(null)
  const head = {
    plate: useRef<HTMLElement | null>(null),
    title: useRef<HTMLElement | null>(null),
    lg: useRef<HTMLElement | null>(null),
    sm: useRef<HTMLElement | null>(null),
    chips: useRef<HTMLElement | null>(null),
    rule: useRef<HTMLElement | null>(null),
  }
  const writeRamp = useHeadRamp(head)
  const onMetrics = useCallback(({ pos }: ScrollMetrics) => { writeRamp(pos) }, [writeRamp])

  /*
   * FOCUS. This is `aria-modal` over the whole page, which makes a screen
   * reader hide everything behind it — so leaving the keyboard out there is
   * worse than not claiming to be modal at all. Measured before this existed:
   * opening from the pill left focus ON the pill (under the scrim), and one Tab
   * went to the composer's mic — the six chips, eighteen cards and the ✕ were
   * unreachable without Tabbing the whole page behind the sheet first.
   *
   * So: focus lands on the sheet itself (not the first chip — the sheet's
   * label is what should be announced), Tab cycles inside it, and on the way
   * out focus returns to the control that opened it. The restore runs in the
   * unmount cleanup, i.e. after the exit spring, which is also the first moment
   * the trigger is safe to touch again.
   */
  useEffect(() => {
    /* Whichever control summoned this: the pill, or the tile whose preview this
       is. Two attributes rather than one, because with an attachment BOTH are on
       screen and the tile comes first in the DOM — a single shared hook would
       silently re-aim the pill's own grow-from-trigger at the tile. */
    const trigger = document.querySelector<HTMLElement>(
      fromTile
        ? '[data-attach-tile]'
        : fromCard
          ? `[data-dock-card="${card}"] > button`
          : '[data-template-trigger]',
    )
    sheet.current?.focus()
    return () => {
      if (!picked.current && trigger?.isConnected) trigger.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function trapTab(e: React.KeyboardEvent) {
    if (e.key !== 'Tab' || !sheet.current) return
    const stops = [...sheet.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
      /* The hidden view's controls are still in the DOM (the list keeps its
         layout under the detail so the back flight has a slot to land in) —
         visibility is what took them out of the Tab order, so it is what the
         trap must honour too. Runs only on a Tab press, never per frame. */
      .filter((el) => getComputedStyle(el).visibility !== 'hidden')
    if (!stops.length) return
    const first = stops[0]
    const last = stops[stops.length - 1]
    const active = document.activeElement
    /* Wrap at both ends, and catch the case where focus sits on the sheet
       itself (the state right after opening): Tab goes to the first stop,
       Shift+Tab to the last. */
    if (e.shiftKey ? active === first || active === sheet.current : active === last) {
      e.preventDefault()
      ;(e.shiftKey ? last : first).focus()
    }
  }

  /*
   * Rule 2 at full size: the sheet's transform-origin is the "Add template"
   * pill — or the attached chip standing in its place — measured once per
   * open, in sheet-local coordinates (the sheet is inset 16px from the
   * viewport). A state INITIALIZER, not an effect: it runs synchronously in
   * this component's first render, so the very first spring frame already
   * grows out of the trigger, and the captured value survives unchanged
   * through the exit animation.
   */
  const [origin] = useState(() => {
    const el = document.querySelector('[data-template-trigger]')
    if (!el) return '50% 82%' // roughly where the composer sits; never expected
    const r = el.getBoundingClientRect()
    return `${r.left + r.width / 2 - SHEET_INSET}px ${r.top + r.height / 2 - SHEET_INSET}px`
  })

  const cards = libraryIn(filter)
  /* The template on screen, from whichever index space this door indexes: the
     library on the pill/tile paths, the dock's own shelf on the card path (the
     two lists disagree on one drawing — data/templates.ts). Exactly one of the
     two is ever set; see `ui.pickerCard`. */
  const detailTpl: Template | null = fromCard
    ? (card !== null ? TEMPLATES[card] ?? null : null)
    : detail !== null
      ? TEMPLATE_LIBRARY[detail] ?? null
      : null

  /*
   * A NEW FILTER PARKS THE GRID AT THE TOP — decided, not inherited.
   *
   * Three reasons, in order of weight. (1) A filter is a new question, and the
   * answer's first card is the one that matters; keeping the old offset shows
   * the middle of a list the customer has never seen. (2) The scrolled state is
   * not free here: it holds the header COMPACT, which is the drawn state for
   * "you are deep in a list", and every new list starts shallow. (3) The clamp.
   * A shorter list cannot honour the old offset anyway — the browser clips
   * scrollTop and `useHeadCompact`'s own guard then has to un-compact, i.e. the
   * page would answer a chip press with a 69px header spring it did not ask for.
   * Resetting first makes that one predictable event instead of a conditional
   * one. The write is instant, not animated: the old position has no meaning in
   * the new list, so there is nothing to travel between.
   */
  function pickFilter(id: TemplateCategoryId) {
    if (id === filter) return
    if (scroller.current) scroller.current.scrollTop = 0
    setFilter(id)
  }

  /* Hidden only after the fade AND only while the detail is up — the moment
     the back flight starts (`detail` → null) the list is interactive again. */
  const listHidden = listParked && detail !== null

  function onCardPick(index: number) {
    if (!sheet.current) return
    flightFrom.current = flightGeometry(sheet.current, index)
    setListParked(false)
    openDetail(index)
  }

  /*
   * "Choose a template" — the hand-off. The stage's rect is measured HERE,
   * before any state changes, because one commit later this surface is already
   * dissolving; from that rect the page-level flight layer flies the object
   * into the composer's tile (which the same store write brings into existence).
   */
  /* The ✕ and the scrim. On the library path they close; on a preview with no
     grid behind it they are the same gesture as ← — the object flies home. */
  function dismiss() {
    if (fromTile && detail !== null) returnToTile(detail)
    else if (fromCard && card !== null) returnToCard(card)
    else onClose()
  }

  function onChoose(index: number) {
    /*
     * ONE SLOT. Picking the template that is ALREADY attached is not a
     * replacement — there is nothing to replace it with, and flying an object
     * into a box where an identical object already sits would be a 620ms
     * animation whose two endpoints are the same picture. So the sheet just
     * dissolves and the tile ACKNOWLEDGES the press with its own settle pulse:
     * the answer to "this one" is "yes, this one". `attach` is not called at all
     * — the store write would be a no-op, and skipping it also keeps the field's
     * snap-once machinery from seeing any transition.
     */
    if (index === useUI.getState().attachedTemplate) {
      picked.current = true
      setDissolving(true)
      useUI.getState().settleAttachedTile()
      return
    }
    picked.current = true
    const stage =
      sheet.current?.querySelector('[data-detail-stage]') ??
      sheet.current?.querySelector('[data-detail-clone]')
    setDissolving(true)
    attach(index, TEMPLATE_LIBRARY[index].id, stage ? rectOf(stage) : null)
  }

  /*
   * `Remix this template` — the dock preview's CTA, and the naming is ours
   * (delegated by the designer, recorded in `decisions.md` 26.08.2026): the
   * picker's own pill keeps `Choose a template`, because attaching a template to
   * a prompt and starting a site FROM one are two different actions and must not
   * share a word. What it DOES is exactly what a dock card's click did before
   * this preview existed — seed the builder's first message with the template's
   * name and open it. `openBuilder` unmounts the whole Home page, so there is no
   * exit to choreograph and nothing to dissolve.
   */
  function onRemix() {
    if (!detailTpl) return
    picked.current = true
    startBuild(`Start a new site from the “${detailTpl.name}” template`)
    useUI.getState().openBuilder()
  }

  /*
   * The card's blue `+` — the same hand-off as `Choose a template`, one step
   * earlier, so it runs the same path: the object flies out of the CARD'S
   * THUMBNAIL instead of out of the detail stage, and the sheet dissolves under
   * it. Nothing in the flight needs teaching: its clone lays the drawing out at
   * the source's width and the card's thumbnail is already the ratio it draws
   * (233.333 / 218), so a card is a cheaper source than the stage, not a
   * stranger one.
   */
  function onCardAdd(index: number) {
    /* Same one-slot rule as `onChoose`: the card the customer already attached
       answers with the tile's settle pulse, not with a flight to itself. */
    if (index === useUI.getState().attachedTemplate) {
      picked.current = true
      setDissolving(true)
      useUI.getState().settleAttachedTile()
      return
    }
    const thumb = sheet.current?.querySelector(`[data-tpl-card="${index}"] .tplpick-thumb`)
    picked.current = true
    setDissolving(true)
    attach(index, TEMPLATE_LIBRARY[index].id, thumb ? rectOf(thumb) : null)
  }

  return (
    <div
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-label={detailTpl ? detailTpl.name : t({ en: 'Pick a template', uk: 'Вибрати шаблон' })}
      /* Once the surface is only fading out it must stop taking clicks — the
         page underneath is already the live one. */
      style={dissolving ? { pointerEvents: 'none' } : undefined}
    >
      {/* 50% black (28616:59963) — raw value on the board, not a token.
          In the detail view it still closes the WHOLE picker: the ✕ stays on
          screen there (board §12.1), and the scrim is the same gesture. */}
      <motion.div
        variants={modalScrim}
        initial="initial"
        animate={dissolving ? 'dissolve' : 'animate'}
        exit={detailOnly ? 'dissolve' : 'exit'}
        onClick={dismiss}
        className="absolute inset-0 bg-[rgba(0,0,0,0.5)]"
      />

      {/* the sheet (28626:534) — opaque, so the spring moves no blur */}
      <motion.div
        ref={sheet}
        /* The sheet is the origin of every number in spec §12, so it is also the
           frame QA measures against — same data-hook idiom as the parts below. */
        data-picker-sheet
        /* focus target for the open, and the box the Tab cycle is trapped in.
           No ring: a focus outline around a 1624px panel is noise, and the
           thing being announced is the dialog, not a control. */
        tabIndex={-1}
        onKeyDown={trapTab}
          /* The library grows out of the pill (rule 2). A single-template preview
           only fades — there the FLYING OBJECT is the gesture, and a surface
           growing out of one corner while the object leaves another is two
           gestures for one pair of eyes. */
        variants={detailOnly ? fullscreenSheetFade : fullscreenSheet}
        initial="initial"
        animate={dissolving ? 'dissolve' : 'animate'}
        exit="exit"
        onAnimationComplete={(v) => {
          /* The dissolve's own landing is where the picker actually closes —
             see `dissolving`. Everything else means the entrance has settled. */
          if (v === 'dissolve') onClose()
          else setEntering(false)
        }}
        style={{
          transformOrigin: origin,
          ...(entering ? { '--card-hover-dur': '0s' } : null),
        } as React.CSSProperties}
        className="absolute inset-4 overflow-hidden rounded-[16px] bg-[var(--gray-900)] focus:outline-none"
      >
        {/* One motion block over both boxes, so the content still lands as the
            single ~60ms-later beat the sheet's motion note describes.
            NOT RENDERED AT ALL on the two single-template previews (the
            attachment tile's and a dock card's): the library is not part of those
            paths (nothing to go "back" to, nothing to fade under the detail
            view), and a 36-card grid mounted invisibly would be 36 thumbnails of
            cost for a surface that never shows them. */}
        {!detailOnly && (
        <motion.div
          variants={fullscreenContent}
          initial="initial"
          animate="animate"
          exit="exit"
          /* FLUID. The 32px side insets are the `px-8` on the two boxes below,
             and the content takes everything between them — no `max-width`, so
             the grid fills the sheet instead of sitting in the middle of a wide
             monitor. At the drawn 1656 this is the board's 1560 exactly. The
             heading and the chip row centre in the same box, which at 1656 is
             the same centre they had inside the capped column. */
          className="relative flex h-full flex-col"
        >
          {/*
           * HEADER — an OVERLAY over the scroller, not a box above it, and that
           * is the fix for the designer's scroll jerk (see the RAMP note at the
           * top of this file). As a flex sibling its height was the grid's top
           * edge, so collapsing it moved every card 69px that nobody asked for;
           * as an overlay its box never changes and the scroller's never resizes,
           * so the grid can only move with the scroll. What used to be its layout
           * height is now the scroller's own `padding-top` (the two are the same
           * 215, so the drawn rhythm is untouched) and what you SEE as 146 is the
           * plate's scaleY.
           *
           * It is rendered AFTER the scroller so it paints over the cards, and it
           * is deaf to the pointer except where it has something to click: with a
           * 215px box over a 146px plate, the 69px it no longer paints must belong
           * to the cards sliding under it.
           *
           * ⚠️ OURS, not drawn: the board has one column and no scroll state at
           * all (spec §10.3), so nothing says which parts of it are fixed. It
           * became a real question with the fluid grid, because cards that grow
           * with the column make the sheet scroll on a WIDE monitor too and not
           * just a short one — 366px of it at 2560 — and chips that scroll away
           * in the normal case leave the only filter in the sheet unreachable.
           * The drawn rhythm is unchanged either way: 57 + 22.5 + 40 above, then
           * 16 + 36 + 32 for the chips = 203.5, so the grid still starts at the
           * board's y. Flagged to the designer.
           */}
          <motion.div
            variants={listHead}
            initial={false}
            animate={detail !== null ? 'detail' : 'list'}
            className={`tplpick-head pointer-events-none absolute inset-x-0 top-0 px-8 ${listHidden ? 'invisible' : ''}`}
          >
            {/* the opaque ground, and the only part of the header whose height
                is visible while the flip runs — see `.tplpick-head-plate` */}
            <span aria-hidden className="tplpick-head-plate" ref={head.plate as React.RefObject<HTMLSpanElement>} />

            {/* Header 131 at rest (28626:540), 78 scrolled (28734:66373): 57/40
                above the heading's CAP, 40/16 below. The paddings are the class
                pair in index.css; this box only holds the two inks. */}
            <div className="tplpick-head-title">
              <h2 className="tplpick-title" ref={head.title as React.RefObject<HTMLHeadingElement>}>
                {/*
                 * ⚠️ RE-READ 26.08.2026, and it changed twice over: the heading
                 * is TWO-TONE and it now DOES end in a period — `Pick a
                 * template.` in white (Neutral Alpha/1000) then a plain space
                 * then `We'll remix it.` at Neutral Alpha/600 (#ffffff8f, 56%).
                 * Both boards agree; our §10.1 note about a missing period is
                 * answered, the straight ' (U+0027) still stands. And the REST
                 * board's size went 32 → 48 while this scrolled one keeps 32 —
                 * which is what the compaction actually is.
                 *
                 * Two real texts, superimposed, each crisp at its own end. The
                 * 48 carries the accessible copy; the 32 is `aria-hidden`
                 * FOREVER (not "whichever is invisible"), or the dialog would
                 * announce its heading twice and the name would flicker on
                 * every scroll — the segmented control's lesson.
                 */}
                <span className="tplpick-title-ink tplpick-title-ink--lg" ref={head.lg as React.RefObject<HTMLSpanElement>}>
                  Pick a template. <span className="tplpick-title-tail">{"We'll remix it."}</span>
                </span>
                <span aria-hidden className="tplpick-title-ink tplpick-title-ink--sm" ref={head.sm as React.RefObject<HTMLSpanElement>}>
                  Pick a template. <span className="tplpick-title-tail">{"We'll remix it."}</span>
                </span>
              </h2>
            </div>

            {/* The dock's chip row (same Figma component), centred this time.
                TRULY centred: the board's group sits 4px right of centre only
                because the dock component's asymmetric 16/8 padding leaks
                through — an accident, per spec §4/§10.4.

                SEVEN chips since 26.08.2026 on both boards. The third one the
                designer drew is a second `Ecommerce` (28734:65599 / 28734:66420)
                — a filter row with the same category twice is a bug on screen
                even when it is on a board, so it was flagged (§14.5) rather than
                built, and he answered: «не нужен дубль, придумай другой топик».
                The slot now carries `Tech & SaaS`, our label, in the drawn
                position — see note 3 in `data/templates.ts` for what is filed
                under it and why every chip is guaranteed a non-empty grid. */}
            {/* ⚠️ `pointer-events-auto` goes on the CHIPS, not on the row: the
                row's box carries 32px of bottom padding (the hairline's home), and
                with the row transformed up 53 that padding reached 16px BELOW the
                compact plate — a strip of card you could see and not click
                (measured with `elementFromPoint` 8px under the foot: it hit the
                row). The header's box is deaf so the grid keeps every pixel it
                shows; only what you actually press takes the pointer back. */}
            <div className="tplpick-head-chips" ref={head.chips as React.RefObject<HTMLDivElement>}>
              <div className="pointer-events-auto flex justify-center">
                <CategoryChips value={filter} onChange={pickFilter} />
              </div>
              {/* the scrolled state's hairline (28734:66416's inside stroke) */}
              <span aria-hidden className="tplpick-head-rule" ref={head.rule as React.RefObject<HTMLSpanElement>} />
            </div>
          </motion.div>

          <motion.div
            variants={listGrid}
            initial={false}
            animate={detail !== null ? 'detail' : 'list'}
            /* The grid's fade is the longer of the two (0.18 vs 0.15), so its
               completion is when BOTH blocks may go invisible. */
            onAnimationComplete={(v) => { if (v === 'detail') setListParked(true) }}
            className={`min-h-0 flex-1 ${listHidden ? 'invisible' : ''}`}
          >
            {/*
              * `pt-[215px]` IS THE HEADER, as layout: the overlay above paints on
              * top of this padding at rest, so the first card row still starts at
              * the drawn 215 and the scrollable range is exactly what it was when
              * the header was a flex sibling (`grid + 24 − (sheet − 215)` either
              * way). Literals, because Tailwind tree-shakes what it cannot see.
              *
              * `scroll-pt-[146px]`: the compact foot is the highest line that is
              * ever uncovered, so `scrollIntoView` — which the detail view's back
              * flight uses to bring a card into range — must not park a card under
              * the plate. It only affects programmatic scrolling.
              */}
            <ScrollArea axis="y" className="h-full" innerClassName="px-8 pt-[215px] scroll-pt-[146px]" onMetrics={onMetrics} viewportRef={scroller}>
              {/* the grid (28626:591 → 28734:66425): 6 columns, 32px gaps both
                  axes; card width is an output of the column — (1560 − 5×32) / 6
                  = 233.333, the dock's own formula over its 1592. 24px of drawn
                  slack below. Geometry and the wide-screen rule live in
                  `.tplpick-grid`.

                  ⚠️ This wrapper used to exist to COVER the compaction: the
                  scroller's box grew 69px upward in one commit and the grid was
                  put back down and sprung home. That cover is gone with the snap
                  it was covering (see the RAMP note) — the grid now only ever
                  moves with the scroll, and this box carries nothing at all. */}
              <div>
              {/*
                * THE GRID ANSWERS THE CHIP, one card at a time (designer's
                * order, 26.08.2026 evening). Same conveyor as the dock's shelf,
                * one beat behind the travelling pill, with the stagger sized to
                * eighteen cards instead of six (`gridSwapBehind`, ui/motion.ts).
                * `mode="wait"` so two filters' worth of cards never overlap
                * mid-flight, and `initial={false}` so the FIRST grid does not
                * animate in — the sheet's own entrance already brings it, and a
                * second entrance under it would double the arrival.
                */}
              <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={filter}
                variants={gridSwapBehind}
                initial="initial"
                animate="animate"
                exit="exit"
              >
              {cards.length ? (
                <div className="tplpick-grid pb-6">
                  {cards.map(({ tpl, index }) => (
                    <TemplateCard
                      key={index}
                      template={tpl}
                      /* No height and no `home-card`: the column owns the width,
                         the thumbnail's ratio owns the height (272 at the drawn
                         233.333), and `home-card`'s 200px flex floor would fight
                         a grid column that is legitimately narrower — the picker
                         is 170 wide per card at 1280. */
                      className=""
                      thumbClassName="tplpick-thumb"
                      dataKey={index}
                      pickLabel={t({ en: `Open ${tpl.name}`, uk: `Відкрити ${tpl.name}` })}
                      onPick={() => onCardPick(index)}
                      onAdd={() => onCardAdd(index)}
                      addLabel={t({ en: `Use ${tpl.name}`, uk: `Взяти ${tpl.name}` })}
                      /* Same call as `--card-hover-dur: 0s` above, for the same
                         reason: while the sheet is still springing, a card that
                         arrives under a parked cursor shows its `+` rather than
                         springing it in over the entrance. */
                      instant={entering}
                      item
                    />
                  ))}
                </div>
              ) : (
                /* Undrawn on any board (spec §10.5) — the dock's own quiet line,
                   not a new design. */
                <p className="pb-6 pt-10 text-center text-[14px] text-[var(--white-400)]">
                  {t({ en: 'No templates in this category yet.', uk: 'У цій категорії ще немає шаблонів.' })}
                </p>
              )}
              </motion.div>
              </AnimatePresence>
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
        )}

        {/* THE DETAIL VIEW — kept by AnimatePresence through its own back
            flight (usePresence inside), and through the whole picker's exit:
            closing from the detail leaves `pickerDetail` set, so the sheet
            shrinks away showing exactly what was on screen. */}
        <AnimatePresence>
          {detailTpl && (
            <DetailView
              /* One key per door AND per template: the two index spaces must
                 never collide, or a dock preview could inherit a library
                 preview's flight state. */
              key={fromCard ? `card-${card}` : `lib-${detail}`}
              tpl={detailTpl}
              /* Only the library path has a card in a grid to fly out of and
                 back into; the other two doors are external. */
              index={fromCard ? null : detail}
              sheetRef={sheet}
              geom0={flightFrom.current}
              /* On the two single-template previews the flight is not the
                 picker's: a page-level clone carries the object across the
                 surface boundary (TemplateFlight.tsx), so this view holds still
                 and only hides its stage until that clone lands. */
              external={detailOnly}
              /* Two doors, two different final actions — and deliberately two
                 different words (decisions.md, 26.08.2026). */
              ctaLabel={
                fromCard
                  ? t({ en: 'Remix this template', uk: 'Реміксувати цей шаблон' })
                  : t({ en: 'Choose a template', uk: 'Обрати шаблон' })
              }
              onCta={fromCard ? onRemix : () => detail !== null && onChoose(detail)}
              onBack={
                fromTile && detail !== null
                  ? () => returnToTile(detail)
                  : fromCard && card !== null
                    ? () => returnToCard(card)
                    : backToGrid
              }
            />
          )}
        </AnimatePresence>

        {/* close (detail board 28640:43357/43358; list board 28633:14905/14906):
            Black/500 + blur 16 + the quiet cut of the Liquid Glass gradient rim
            (12% → 4% → 8% TL→BR — `.liquid-glass--dim`; the flat 12% both boards
            export is the flattening, see spec §2's correction). The PLATE SURVIVED
            the 26.08 pass — same fill, same blur, same rim token; the box the
            designer shrank to 36 is back at **40 / r12** because 36 is not a size
            in his own system (PLATE_SIZE), and both insets are the bar's 12.
            Its blur is the sheet's single backdrop-filter — 40px square and
            static. Never moves, never distorts: the detail's plate morph is a
            separate clone that unrolls out from UNDER this button (z below it).
            The 24-box glyph is unchanged on both boards, so IconClose stays 14. */}
        <button
          onClick={dismiss}
          aria-label={t({ en: 'Close', uk: 'Закрити' })}
          className="liquid-glass liquid-glass--dim glass-interactive absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-[12px] text-white"
        >
          <IconClose size={14} />
        </button>
      </motion.div>
    </div>
  )
}

/* ----------------------------------------------------------------- detail */

/**
 * One template's detail view: header strip + the site stage, plus the flight
 * that gets it there. Owns the whole card→stage lifecycle for its index:
 * hides the source thumbnail while the morph is its stand-in, swaps the
 * flight clone for the scrollable stage at landing, flies back into the
 * card's re-measured rect on exit, and restores thumbnail + focus when done.
 */
function DetailView({
  tpl, index, sheetRef, geom0, external = false, ctaLabel, onCta, onBack,
}: {
  /** The template on screen — passed in rather than looked up, because the three
   *  doors index two different lists (see the THREE DOORS note). */
  tpl: Template
  /**
   * Its row in the picker's grid, or null when this preview was not opened from
   * that grid (the tile's and the dock card's doors). It is the handle for
   * everything that involves a card in a grid: hiding the source thumbnail,
   * measuring the flight, landing back in the re-measured slot, returning focus.
   */
  index: number | null
  sheetRef: React.RefObject<HTMLDivElement>
  /** Measured in the card's click handler, before this mounts — so the first
   *  painted frame already sits on the card. Null only defensively. */
  geom0: FlightGeom | null
  /**
   * The flight is somebody else's: on the tile's and the dock card's previews a
   * page-level clone carries the object between that home and this stage
   * (TemplateFlight.tsx), because neither end is inside this sheet's lifetime.
   * So this view mounts already landed and simply keeps its stage INVISIBLE
   * while that clone is in the air — the two are the same rect, so the reveal is
   * a hard swap of identical pixels. No internal flight, no plate unroll (there
   * is no grid to unroll away from), no thumbnail to hide.
   */
  external?: boolean
  /** `Choose a template` from the library, `Remix this template` from the dock —
   *  the bar is one component, the final action is the door's. */
  ctaLabel: string
  onCta: () => void
  /** ← : back to the grid on the library path, home into the tile or the dock
   *  card on the two external ones. */
  onBack: () => void
}) {
  const { t } = useT()
  const back = onBack
  /** True while the page-level clone is standing in for this stage. */
  const externalFlying = useUI((s) => external && s.tplFlight !== null)
  const [isPresent, safeToRemove] = usePresence()
  const reduced = useReducedMotion()
  const backBtn = useRef<HTMLButtonElement>(null)

  /** false = the flight clone is on screen; true = the real ScrollArea stage.
   *  The two are pixel-identical at the swap, which happens in one commit.
   *  Starts LANDED when the flight is external: the real stage has to be in the
   *  DOM from the first commit, both because the outside clone measures its rect
   *  and because there is no internal clone to stand in for it. */
  const [landed, setLanded] = useState(external)

  /* One springed progress for the stage flight, one for the plate — every
     transform on both is derived from these, so the counter-scale ratio is
     exact on every frame and an interrupted flight (Esc mid-open) simply
     springs back from wherever it is. */
  const p = useMotionValue(0)
  const pp = useMotionValue(0)
  /** Whole-layer opacity — only the reduced-motion path animates it. */
  const layerO = useMotionValue(reduced ? 0 : 1)

  const geom = useRef<FlightGeom>(geom0 ?? { dx: 0, dy: 0, sx: 1, sy: 1, plateSX: 1 })

  /* ---- stage flight (the FLIP outer + inner counter-scale) ---- */
  const sxAt = (v: number) => geom.current.sx + (1 - geom.current.sx) * v
  const syAt = (v: number) => geom.current.sy + (1 - geom.current.sy) * v
  const x = useTransform(p, (v) => geom.current.dx * (1 - v))
  const y = useTransform(p, (v) => geom.current.dy * (1 - v))
  const scaleX = useTransform(p, sxAt)
  const scaleY = useTransform(p, syAt)
  /** The whole trick: net content scale = outer sx on BOTH axes, uniform. */
  const counterY = useTransform(p, (v) => sxAt(v) / syAt(v))
  /*
   * Visually constant corners under a non-uniform scale (the sanctioned
   * per-frame paint — see the header note). Painted radius = wanted visual
   * radius divided by the current scale, per axis (the `/` form of
   * border-radius). Top corners hold the drawn 8 the whole way — the card's
   * thumbnail and the stage clip both draw 8. Bottom corners are the card's 8
   * at the start and the stage's square 0 from 40% in, because from there the
   * clip is visibly cropping the site and a rounded crop line reads wrong.
   */
  const radius = useTransform(p, (v) => {
    const sx = sxAt(v)
    const sy = syAt(v)
    const bot = STAGE_RADIUS * Math.max(0, 1 - v / 0.4)
    return `${STAGE_RADIUS / sx}px ${STAGE_RADIUS / sx}px ${bot / sx}px ${bot / sx}px / ${STAGE_RADIUS / sy}px ${STAGE_RADIUS / sy}px ${bot / sy}px ${bot / sy}px`
  })
  /** The stage's 1px rim — `Conteiner` 28637:42911's 1px pad, whose fill moved
   *  from `Gray/800` #27272a to **`Gray/750` #33333a** on 26.08.2026 (one step
   *  lighter). The card has no rim, so it fades in only as the flight lands
   *  (and out first on the way back). */
  const rimO = useTransform(p, [0.75, 1], [0, 1])

  /* ---- the ✕-plate unroll ---- */
  const plateScaleX = useTransform(pp, (v) => 1 + (geom.current.plateSX - 1) * v)
  /* 64 / 40 = 1.6 → the band lands exactly 64 tall, and because the plate's own
     centre line (12 + 20 = 32) IS the bar's centre, it spans 0…64 — the header,
     edge to edge, with no offset term. The identity has now held through three
     sets of numbers (72/40 at 16, 64/36 at 14, 64/40 at 12), because it is the
     one thing the ✕'s insets are chosen to satisfy — see PLATE_SIZE. */
  const plateScaleY = useTransform(pp, [0, 1], [1, DETAIL_HEADER_H / PLATE_SIZE])
  /**
   * The band's fill pours 0 → 1 → 0: it must START invisible because the
   * clone sits exactly on the real ✕ plate, whose own 48% fill it would
   * visibly double for the first frames (found on the frame captures — a
   * darker plate popping at both endpoints); and it must END dissolved into
   * the sheet's black, because the board draws no visible header bar. The
   * middle of the flight is where the unrolling band actually shows. Same
   * mapping reversed on the way back: it fades up as it condenses and lands
   * invisible under the real plate — no seam at either end.
   *
   * No rim on the band at all: a 1px border under a ~40× horizontal stretch
   * smears its side borders into wide bars (seen on the frames — the
   * predicted failure), and the static ✕ button above this clone already
   * draws the rimmed 40×40 the gesture starts and ends on. (At the drawn
   * 1656 the stretch is exactly 40×: (1624 − 2 × 12) / 40 = 40.)
   */
  const plateFill = useTransform(pp, [0, 0.15, 0.35, 0.8], [0, 1, 1, 0])

  const thumbEl = () =>
    index === null
      ? null
      : sheetRef.current?.querySelector<HTMLElement>(`[data-tpl-card="${index}"] .tplpick-thumb`) ?? null

  /** Back flight touchdown: thumbnail returns in the same commit the clone
   *  leaves (identical pixels), focus returns to the card that was opened. */
  const finishBack = () => {
    thumbEl()?.style.removeProperty('opacity')
    if (index !== null) {
      sheetRef.current?.querySelector<HTMLElement>(`[data-tpl-card="${index}"] > button`)?.focus()
    }
    safeToRemove?.()
  }

  useEffect(() => {
    const sheetEl = sheetRef.current
    if (!sheetEl) return

    /* Somebody else is flying this one: sit still at the settled geometry. The
       plate is parked unrolled, where its fill maps to 0 — i.e. invisible, as
       the board draws it (no visible bar). */
    if (external) {
      p.jump(1)
      pp.jump(1)
      if (!isPresent) safeToRemove?.()
      return
    }

    /* Reduced motion: no flight, no plate, no thumbnail games — the detail
       fades in place over the (opacity-faded) list, and out again. */
    if (reduced) {
      if (isPresent) {
        p.jump(1)
        pp.jump(1)
        setLanded(true)
        const fade = animate(layerO, 1, { duration: 0.2, ease: [0.2, 0, 0, 1] })
        return () => fade.stop()
      }
      const fade = animate(layerO, 0, { duration: 0.12, ease: [0.4, 0, 1, 1], onComplete: finishBack })
      return () => fade.stop()
    }

    if (isPresent) {
      /* OPEN. The clone's first frame is already covering the thumbnail
         pixel-for-pixel (geometry was measured in the click handler), so
         hiding the original here — one effect later — cannot flash. */
      thumbEl()?.style.setProperty('opacity', '0')
      const g = index === null ? null : flightGeometry(sheetEl, index)
      if (g) geom.current = g
      const flight = animate(p, 1, { ...SPRING_SOFT, onComplete: () => setLanded(true) })
      const plate = animate(pp, 1, { ...SPRING_SOFT })
      return () => { flight.stop(); plate.stop() }
    }

    /* BACK. Swap the scrollable stage for the clone (pixel-identical), then
       fly into the card's CURRENT rect: re-measured now — the grid may have
       re-columned under a resize — after making sure the slot is on screen.
       Faster than the open and bounceless, house exit doctrine. */
    setLanded(false)
    if (index !== null) {
      sheetEl.querySelector(`[data-tpl-card="${index}"]`)?.scrollIntoView({ block: 'nearest' })
    }
    const g = index === null ? null : flightGeometry(sheetEl, index)
    if (!g) {
      /* No slot to land in (never expected — the filter is unreachable from
         the detail view): fading out beats flying into nothing. */
      const fade = animate(layerO, 0, { duration: 0.12, ease: [0.4, 0, 1, 1], onComplete: finishBack })
      return () => fade.stop()
    }
    geom.current = g
    const flight = animate(p, 0, { type: 'spring', duration: 0.32, bounce: 0, onComplete: finishBack })
    const plate = animate(pp, 0, { type: 'spring', duration: 0.26, bounce: 0 })
    return () => { flight.stop(); plate.stop() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresent, reduced, index, external])

  /* Opening the detail moves focus to the back arrow (the trap keeps covering
     the whole sheet; the hidden list filtered out by visibility). */
  useEffect(() => { backBtn.current?.focus() }, [])

  /* Belt-and-braces thumbnail restore for every OTHER way out — Choose or ✕
     unmount the whole picker with this view still up; the interrupted-back
     cleanup above stops its animation before finishBack ever runs. */
  useEffect(() => () => { thumbEl()?.style.removeProperty('opacity') }, [])

  const stageBox = 'absolute bottom-0 left-1 right-1 top-[64px]'
  const site = (
    /* The SAME drawing the card shows, at the card's drawn aspect — cq units
       scale it proportionally, which is what makes the morph one object. At
       stage width the box is taller than the stage at every viewport we ship
       (h ≈ 0.934 × w), so the preview always crops at the bottom, as drawn,
       and always has somewhere to scroll. */
    /* `select-none`: the stage is a PICTURE of a website, not copy anybody reads
       — same reasoning as the card's face (index.css, «a card is a picture, not a
       document»). Without it a drag across the preview selected the fake site's
       text (measured: `$1,799,980`), which is the designer's original complaint
       one screen later. Scrolling is untouched — the scroller takes the wheel,
       and there is no drag-to-scroll here. */
    <div className="relative w-full select-none aspect-[233.333/218]">
      <Thumb id={tpl.id} className="absolute inset-0" />
    </div>
  )

  return (
    <motion.div
      className="absolute inset-0 z-[5]"
      /* Inert while flying back so the reappearing grid is clickable at once;
         the layer has no background — it exists to group, not to paint. */
      style={{ opacity: layerO, pointerEvents: isPresent ? 'auto' : 'none' }}
    >
      {/* the plate clone, unrolling out from under the (static, z-10) ✕. Same box,
          same insets, same radius as that button — it IS its stand-in, so the two
          class strings must be kept in step by hand (PLATE_INSET_X).
          Transform-origin right-centre: the right edge stays glued to the
          plate's, the band's centre line is the plate's own (both y 32). */}
      <motion.div
        aria-hidden
        data-detail-plate
        className="absolute right-3 top-3 h-10 w-10"
        style={{ scaleX: plateScaleX, scaleY: plateScaleY, transformOrigin: '100% 50%', willChange: 'transform' }}
      >
        <motion.div className="absolute inset-0 rounded-[12px] bg-[#09090b7a]" style={{ opacity: plateFill }} />
      </motion.div>

      {/* header strip (28637:43245): 64 on the sheet's own ground — no bar.
          Row as drawn: `gap 16; padding 12 12 12 0; justify-end`, so the left
          zone is 48 + 16 = 64 and the right zone 16 + 40 + 12 = 68 with our
          40px ✕ (the board's 36 made both 64 — see the group's max-width below).
          The 12 of that padding is also why the ✕ sits at top 12: PLATE_SIZE. */}
      <div className="absolute inset-x-0 top-0 h-[64px]">
        <motion.button
          ref={backBtn}
          data-detail-back
          custom={0}
          variants={headerBit}
          initial="pre"
          animate={isPresent ? 'in' : 'out'}
          onClick={back}
          aria-label={t({ en: 'Back to all templates', uk: 'Назад до всіх шаблонів' })}
          /* 32×32 at (16, 16), container radius 8, 24-box glyph (28640:43362).
             y is 16 now, not 20: a 32-high child centred in the py-12 row.
             No fill until interaction — the component's own rule.

             `glass-interactive` (designer's order, 26.08.2026 evening — the
             click effect on this arrow by name): the wash IS the old
             `hover:bg-[var(--white-100)]`, the same 8% white, moved onto its own
             composited layer so hovering no longer repaints the button's
             background; the press adds the positional bloom. The bloom clips to
             this button's own drawn radius 8, not the family's pill shape. */
          className="glass-interactive absolute left-4 top-4 grid h-8 w-8 place-items-center rounded-[8px] text-white transition-colors duration-[var(--dur-fast)] ease-std"
        >
          <IconArrowLeft size={20} />
        </motion.button>

        {/* Name + Choose, gap 32 (28640:43353) — centred on the sheet. The board's
            own zones came out symmetric on 26.08.2026 (64 = 48 back + 16 gap on
            the left, 64 = 16 gap + 36 ✕ + 12 pad on the right), fixing the 4px
            drift of §12.6-Q1 — and our 40px ✕ (PLATE_SIZE) puts the right zone
            back at 68. Neither number ever moved this group: it has always
            shipped truly centred, which is where the fixed board now draws it.
            What the zones DO decide is the clearance, so max-width follows the
            wider one: 100% − 2 × 68 = 100% − 136. The title gives way first on a
            narrow sheet: it truncates (the board draws its own text-overflow),
            the pill never shrinks. */}
        <div className="absolute left-1/2 top-3 flex h-10 max-w-[calc(100%-136px)] -translate-x-1/2 items-center gap-8">
          <motion.h2
            custom={1}
            variants={headerBit}
            initial="pre"
            animate={isPresent ? 'in' : 'out'}
            /* Gilroy Medium 16 (28640:43354) — was 18. Two independent reads
               agree: the cap box went 13 → 11 (≈0.70 em both times) and the
               same string's width 284 → 252, i.e. ×0.887 vs 16/18 = 0.889. */
            className="tplpick-heading min-w-0 truncate font-display text-[16px] font-medium leading-none text-white"
          >
            {tpl.name}
          </motion.h2>
          <motion.button
            data-detail-choose
            custom={2}
            variants={headerBit}
            initial="pre"
            animate={isPresent ? 'in' : 'out'}
            onClick={onCta}
            /* Filled, Icon=Right, **Color=Blue** (28641:43375 → component
               70:464; it was Color=Dark / 70:448 before 26.08.2026): 40 tall,
               radius 10, fill `Background/Blue/Default` — which resolves in the
               DARK theme to #1587ff, i.e. EXACTLY the house action blue, so it is
               `var(--action)` and not a one-off hex. (The reference code's
               #0073ec is the light-theme trap; that value is our --action-pressed.)
               Label PN Semibold 14 `Text/Default/White` #ffffff, + in a 24 box,
               state-layer `pl 20 / pr 8 / gap 7` — the gap really is 7, not the
               system's 8: get_design_context says 7 and the drawn box width
               corroborates (177 = 20 + 118 + 7 + 24 + 8; it was 178 at gap 8).
               Interaction: the board draws NO states (grepped the whole board —
               no hover/pressed/focus layer anywhere), so this is the house
               convention for a solid action button, the same one PublishPanel,
               DomainModal and DomainsSurface use — wash to --action-hover, and
               press to the already-defined --action-pressed.

               `press-bloom`: the press ripple, by the designer's name, 26.08.2026
               evening. This is the button that moved the canon — it used to say
               here that the Liquid Glass hover and ripple belong to glass and a
               filled blue button is not one; he asked for the click effect on
               it, so the bloom left glass. Bloom only, no 8% wash: the two
               colour steps above are already this button's hover and press. The
               ink stays the family's 12% white, and that is measured rather than
               assumed — over `--action-pressed`, the fill actually under the
               finger, it is ΔE 12.42 in CIE-Lab against 13.13 for the same ink
               on a glass control (index.css has the whole table). */
            className="press-bloom flex h-10 flex-none items-center gap-[7px] rounded-[10px] bg-[var(--action)] pl-5 pr-2 text-[14px] font-semibold leading-none text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)] active:bg-[var(--action-pressed)]"
          >
            {/* The label is the DOOR's, not this bar's — see `ctaLabel`. The glyph
                stays the drawn `+` in its 24 box in both cases: the board draws
                one pill and the designer's answer changed the word, not the kit
                variant. */}
            {ctaLabel}
            <span className="grid h-6 w-6 place-items-center"><IconPlus size={20} /></span>
          </motion.button>
        </div>
      </div>

      {/* THE STAGE (spec §12.2): 4px side margins, flush bottom, top corners 8,
          1px Gray/750 rim, top edge at 64 (the new bar height). Unchanged from
          the old board apart from those two: margins, radius, flush bottom and
          the vestigial `Sections` blur/r16 (still not copied) all held.
          Until the spring lands it is the flight clone —
          overflow visible inside, the outer clip does all the cropping; after,
          the real scroller, pixel-identical, swapped in one commit. */}
      {landed ? (
        <div
          data-detail-stage
          className={`${stageBox} overflow-hidden rounded-t-[8px]`}
          /* Hidden, not unmounted, while the page-level clone is in the air:
             the clone needs this box's rect to aim at, and the reveal has to be
             a swap of identical pixels rather than anything that animates. */
          style={externalFlying ? { opacity: 0 } : undefined}
        >
          <ScrollArea axis="y" thumb="auto" className="h-full">
            {site}
          </ScrollArea>
          <div aria-hidden data-detail-rim className="pointer-events-none absolute inset-0 rounded-t-[8px] border border-[var(--gray-750)]" />
        </div>
      ) : (
        <motion.div
          data-detail-clone
          className={`${stageBox} overflow-hidden`}
          style={{ x, y, scaleX, scaleY, borderRadius: radius, transformOrigin: '0 0', willChange: 'transform' }}
        >
          {/* the counter-scale: origin top-left — card and stage both show the
              site's TOP, so the top edge is the fixed edge of the morph */}
          <motion.div className="w-full" style={{ scaleY: counterY, transformOrigin: '0 0', willChange: 'transform' }}>
            {site}
          </motion.div>
          <motion.div
            aria-hidden
            data-detail-rim className="pointer-events-none absolute inset-0 rounded-t-[8px] border border-[var(--gray-750)]"
            style={{ opacity: rimO }}
          />
        </motion.div>
      )}
    </motion.div>
  )
}
