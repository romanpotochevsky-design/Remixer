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
 *     circles'), 16px from the sheet's top-right corner
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
 * ⚠️ THE BAR WAS REDRAWN 26.08.2026 — the designer compressed it a notch and
 * turned the CTA blue. Layout as drawn now (§12 + the dated update block):
 * a **64px** header strip on the sheet's own ground (row `gap 16; padding
 * 12 12 12 0; justify-end` — it was 72 / `16 16 16 0`) — back ← (32px icon
 * button at **16, 16**), the template name (Gilroy Medium **16**, cap-trimmed)
 * with the pill 32px to its right (40 tall, radius 10, fill
 * `Background/Blue/Default` = **#1587ff**, the house action blue, white PN
 * Semibold 14 label, a + in a 24 box), and the ✕ at **(right 12, top 14),
 * 36 × 36, radius 10** — plate kept, box shrunk. The group is now genuinely
 * centred on the board too (both zones 64), so the old 4px flex drift is gone.
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
 * bar; the plate's centre line, 14 + 18 = 32, is still exactly the bar's
 * centre, which is why the band needs no vertical offset term), its fill
 * pouring 0→1→0 so it never doubles the real plate it starts on and dissolves
 * into the sheet's black (the board draws no visible bar); the band carries no
 * rim — a 1px border under a ~44× stretch smears, and the static ✕ above it
 * draws the rimmed plate. The ✕ button itself never moves — including across
 * the 26.08 resize, which is why both views ship the new 36 (see PLATE_SIZE). Header contents arrive a beat later (+60ms, house
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
import { useEffect, useRef, useState } from 'react'
import { useUI } from '@/state/ui'
import { useT } from '@/i18n'
import { libraryIn, TEMPLATE_LIBRARY, type TemplateCategoryId } from '@/data/templates'
import { ScrollArea } from '@/ui/ScrollArea'
import { IconArrowLeft, IconClose, IconPlus } from '@/ui/icons'
import { modalScrim, fullscreenSheet, fullscreenSheetFade, fullscreenContent, SPRING_SOFT } from '@/ui/motion'
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
 * right edge stays glued to. **36 × 36 at (right 12, top 14) since 26.08.2026**
 * (was 40 × 40 at 16/16, radius 12): `Close M` 28640:43357 is a 36-high child of
 * the py-12 row, so its 14 is derived (12 + (40 − 36) / 2), not authored.
 *
 * ⚠️ The picker LIST board (28633:14905) still draws this same physical button at
 * 40 × 40 / r12 / (16, 16) — the designer updated the detail board only. Shipped
 * on the NEW numbers in both views and flagged (§12.6-Q9): one static ✕ that
 * never moves beats two sizes that would make it slide 6 px on every open, and
 * the sheen rollback (17.08.2026) is the standing lesson about motion the boards
 * do not draw.
 */
const PLATE_SIZE = 36
/**
 * The ✕'s right inset — also the header band's left terminus when unrolled.
 * Its TOP inset, 14, is deliberately not a constant: no math needs it, because
 * 14 + 36 / 2 = 32 = DETAIL_HEADER_H / 2 is an identity, so the band centred on
 * the plate is already centred on the bar. It lives as the literal `top-[14px]`
 * on both the button and the clone (Tailwind purges non-literal class names —
 * the standing rule in CLAUDE.md), and those two must stay in step.
 */
const PLATE_INSET_X = 12

/** Everything the browser lets you Tab to inside the sheet. */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

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
  ui.closeAttachedPreview(index, rectOf(stage))
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
  /** header-band width over the plate's 36 */
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
  /* Which surface this is: the library (opened by the pill) or one attachment's
     own preview (opened by the tile). See `ui.pickerSource`. */
  const source = useUI((s) => s.pickerSource)
  const fromTile = source === 'tile'
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
      fromTile ? '[data-attach-tile]' : '[data-template-trigger]',
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
  const detailTpl = detail !== null ? TEMPLATE_LIBRARY[detail] : null

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
  /* The ✕ and the scrim. On the library path they close; on one attachment's
     preview they are the same gesture as ← — the object flies home. */
  function dismiss() {
    if (fromTile && detail !== null) returnToTile(detail)
    else onClose()
  }

  function onChoose(index: number) {
    picked.current = true
    const stage =
      sheet.current?.querySelector('[data-detail-stage]') ??
      sheet.current?.querySelector('[data-detail-clone]')
    setDissolving(true)
    attach(index, stage ? rectOf(stage) : null)
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
        exit={fromTile ? 'dissolve' : 'exit'}
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
        /* The library grows out of the pill (rule 2); one attachment's preview
           only fades, because there the flying object is the gesture. */
        variants={fromTile ? fullscreenSheetFade : fullscreenSheet}
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
            NOT RENDERED AT ALL on the attachment tile's own preview: the library
            is not part of that path (nothing to go "back" to, nothing to fade
            under the detail view), and an 18-card grid mounted invisibly would
            be 18 thumbnails of cost for a surface that never shows them. */}
        {!fromTile && (
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
          className="flex h-full flex-col"
        >
          {/*
           * HEADER — outside the scroller, so the title and the filter chips
           * hold still while the grid moves under them (the close button always
           * did, being absolute on the sheet).
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
            className={`flex-none px-8 ${listHidden ? 'invisible' : ''}`}
          >
            {/* header 119 (28626:540): 57 above the cap-trimmed heading, 40 below */}
            <div className="pb-[40px] pt-[57px]">
              <h2 className="tplpick-heading whitespace-nowrap text-center font-display text-[32px] font-semibold leading-none text-white">
                {/* Verbatim from 28626:542 — a straight ' and NO trailing
                    period, where the README's candidate had one and the hero
                    pattern closes both halves. Both look like accidents;
                    flagged to the designer (spec §10.1), shipped as drawn. */}
                {"Pick a template. We'll remix it"}
              </h2>
            </div>

            {/* The dock's chip row (same Figma component), centred this time.
                TRULY centred: the board's group sits 4px right of centre only
                because the dock component's asymmetric 16/8 padding leaks
                through — an accident, per spec §4/§10.4. */}
            <div className="flex justify-center pb-8 pt-4">
              <CategoryChips value={filter} onChange={setFilter} />
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
            <ScrollArea axis="y" className="h-full" innerClassName="px-8">
              {/* the grid (28626:591): 6 columns, 32px gaps both axes; card width
                  is an output of the column — (1560 − 5×32) / 6 = 233.333, the
                  dock's own formula over its 1592. 24px of drawn slack below.
                  Geometry and the wide-screen rule live in `.tplpick-grid`. */}
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
            </ScrollArea>
          </motion.div>
        </motion.div>
        )}

        {/* THE DETAIL VIEW — kept by AnimatePresence through its own back
            flight (usePresence inside), and through the whole picker's exit:
            closing from the detail leaves `pickerDetail` set, so the sheet
            shrinks away showing exactly what was on screen. */}
        <AnimatePresence>
          {detail !== null && TEMPLATE_LIBRARY[detail] && (
            <DetailView
              key={detail}
              index={detail}
              sheetRef={sheet}
              geom0={flightFrom.current}
              /* On the tile's own preview the flight is not the picker's: a
                 page-level clone carries the object across the surface boundary
                 (TemplateFlight.tsx), so this view holds still and only hides
                 its stage until that clone lands. */
              external={fromTile}
              onChoose={onChoose}
              onBack={fromTile ? () => returnToTile(detail) : backToGrid}
            />
          )}
        </AnimatePresence>

        {/* close (detail board 28640:43357/43358; list board 28633:14905/14906):
            Black/500 + blur 16 + the quiet cut of the Liquid Glass gradient rim
            (12% → 4% → 8% TL→BR — `.liquid-glass--dim`; the flat 12% both boards
            export is the flattening, see spec §2's correction). The PLATE SURVIVED
            the 26.08 pass — same fill, same blur, same rim token; only the box
            shrank 40 → 36 and the radius 12 → 10, insets 16/16 → 12/14.
            Its blur is the sheet's single backdrop-filter — 36px square and
            static. Never moves, never distorts: the detail's plate morph is a
            separate clone that unrolls out from UNDER this button (z below it).
            The 24-box glyph is unchanged on both boards, so IconClose stays 14. */}
        <button
          onClick={dismiss}
          aria-label={t({ en: 'Close', uk: 'Закрити' })}
          className="liquid-glass liquid-glass--dim glass-interactive absolute right-3 top-[14px] z-10 grid h-9 w-9 place-items-center rounded-[10px] text-white"
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
  index, sheetRef, geom0, external = false, onChoose, onBack,
}: {
  index: number
  sheetRef: React.RefObject<HTMLDivElement>
  /** Measured in the card's click handler, before this mounts — so the first
   *  painted frame already sits on the card. Null only defensively. */
  geom0: FlightGeom | null
  /**
   * The flight is somebody else's: on the attachment tile's own preview a
   * page-level clone carries the object between the tile and this stage
   * (TemplateFlight.tsx), because neither end is inside this sheet's lifetime.
   * So this view mounts already landed and simply keeps its stage INVISIBLE
   * while that clone is in the air — the two are the same rect, so the reveal is
   * a hard swap of identical pixels. No internal flight, no plate unroll (there
   * is no grid to unroll away from), no thumbnail to hide.
   */
  external?: boolean
  onChoose: (index: number) => void
  /** ← : back to the grid on the library path, home to the tile on the other. */
  onBack: () => void
}) {
  const { t } = useT()
  const tpl = TEMPLATE_LIBRARY[index]
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
  /* 64 / 36 = 1.7778 → the band lands exactly 64 tall, and because the plate's
     own centre line (14 + 18 = 32) IS the bar's centre, it spans 0…64 — the
     header, edge to edge, with no offset term. Same identity held at 72/40. */
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
   * draws the rimmed 40×40 the gesture starts and ends on.
   */
  const plateFill = useTransform(pp, [0, 0.15, 0.35, 0.8], [0, 1, 1, 0])

  const thumbEl = () =>
    sheetRef.current?.querySelector<HTMLElement>(`[data-tpl-card="${index}"] .tplpick-thumb`) ?? null

  /** Back flight touchdown: thumbnail returns in the same commit the clone
   *  leaves (identical pixels), focus returns to the card that was opened. */
  const finishBack = () => {
    thumbEl()?.style.removeProperty('opacity')
    sheetRef.current?.querySelector<HTMLElement>(`[data-tpl-card="${index}"] > button`)?.focus()
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
      const g = flightGeometry(sheetEl, index)
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
    sheetEl.querySelector(`[data-tpl-card="${index}"]`)?.scrollIntoView({ block: 'nearest' })
    const g = flightGeometry(sheetEl, index)
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
    <div className="relative w-full aspect-[233.333/218]">
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
      {/* the plate clone, unrolling out from under the (static, z-10) ✕.
          Transform-origin right-centre: the right edge stays glued to the
          plate's, the band's centre line is the plate's own (both y 36). */}
      <motion.div
        aria-hidden
        data-detail-plate
        className="absolute right-3 top-[14px] h-9 w-9"
        style={{ scaleX: plateScaleX, scaleY: plateScaleY, transformOrigin: '100% 50%', willChange: 'transform' }}
      >
        <motion.div className="absolute inset-0 rounded-[10px] bg-[#09090b7a]" style={{ opacity: plateFill }} />
      </motion.div>

      {/* header strip (28637:43245): 64 on the sheet's own ground — no bar.
          Row as drawn: `gap 16; padding 12 12 12 0; justify-end`, so the left
          zone is 48 + 16 = 64 and the right zone 16 + 36 + 12 = 64 — symmetric
          for the first time (see the group's max-width below). */}
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
             No fill until interaction — the component's own rule. */
          className="absolute left-4 top-4 grid h-8 w-8 place-items-center rounded-[8px] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
        >
          <IconArrowLeft size={20} />
        </motion.button>

        {/* Name + Choose, gap 32 (28640:43353) — centred on the sheet, and as of
            26.08.2026 the BOARD agrees: the row's zones are now 64 (48 back + 16
            gap) and 64 (16 gap + 36 ✕ + 12 pad), so the drawn group centre is
            812 = 1624/2 exactly. The old 4px drift (§12.6-Q1) is FIXED upstream —
            we were already shipping true centre, so nothing moves here.
            max-width follows the zones: 100% − 2 × 64.
            The title gives way first on a narrow sheet: it truncates (the
            board draws its own text-overflow), the pill never shrinks. */}
        <div className="absolute left-1/2 top-3 flex h-10 max-w-[calc(100%-128px)] -translate-x-1/2 items-center gap-8">
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
            onClick={() => onChoose(index)}
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
               press to the already-defined --action-pressed. The Liquid Glass
               hover/ripple belongs to glass controls; a filled blue button is
               not one. */
            className="flex h-10 flex-none items-center gap-[7px] rounded-[10px] bg-[var(--action)] pl-5 pr-2 text-[14px] font-semibold leading-none text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)] active:bg-[var(--action-pressed)]"
          >
            {t({ en: 'Choose a template', uk: 'Обрати шаблон' })}
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
