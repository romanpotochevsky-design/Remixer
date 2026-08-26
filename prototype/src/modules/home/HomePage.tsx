/**
 * The Home page — Figma 28364:40053 (canonical) and 28375:43006 (the dock's other
 * state). Pixel source: docs/features/home-page/figma-spec.md, where every number
 * below is traceable to a node id.
 *
 * This is a top-level PAGE, not a surface inside the builder: its chrome is a
 * transparent 72px topbar floating over the hero, and there is no chat column and no
 * right rail. `Root.tsx` picks between this and the builder shell off `ui.page`.
 *
 * Composition at the design size (1656 × 1196):
 *   · page ground gray-950
 *   · hero panel  (8, 8) 1640 × 812, radius 20 — 8px on three sides, flush at the
 *     bottom, so its rounded bottom corners are the only separator from the dock
 *   · topbar      (8, 8) 1640 × 72, no fill, backdrop-blur 16 — drawn ON the hero
 *   · dock        (0, 820) 1656 × 376, full-bleed, no fill and no top edge at all
 *   · content column 1608 (a 16px inset inside the panel); composer band a fixed 960
 *
 * Away from that size (nothing responsive is drawn — spec §12.19): the panel is fluid
 * and takes the leftover height, the dock keeps its 376 and stays pinned to the bottom
 * of the viewport, the column caps at 1608, the composer holds 960 until the viewport
 * squeezes it. The page itself never scrolls vertically; the card row scrolls sideways.
 *
 * PERFORMANCE. The hero's paint in the live product is two huge blurred blooms.
 * This project has already measured what a real blur costs (4fps with the preview
 * glow on, 60 with it off), so the whole settled backdrop is static paint — two
 * fitted radial gradients, a diamond-masked brighter copy of them for the dot
 * lattice, five stroked rings. Nothing settled animates, nothing repaints per
 * frame; the ONE deliberate exception is the load-time wave (a ~2.3s one-shot
 * whose animated mask repaints while it runs — it unmounts with the theatre).
 * `backdrop-filter` is confined to what Figma draws — the topbar, the composer,
 * the chip row's end cap — plus the prompt chips, which the designer had frosted
 * on 26.08.2026. A blur costs only while its backdrop CHANGES, and the settled
 * hero never does, so the nine pills are free: measured on the software renderer,
 * idle 59.5 → 60.0fps and a chevron-driven row scroll 46.4 → 46.3fps (mean of 6)
 * across the change. They are also free during the load wave — the one moment the
 * backdrop DOES repaint — for two reasons worth knowing: the risen row is under a
 * composited opacity animation until the curtain call, which makes it a backdrop
 * root and leaves the chips nothing to sample (so the frost lands when the page
 * settles, and the wave beat measured 14.1 → 17.1fps); and with that rise removed
 * so they DO sample the wave, the beat still measured 15.3fps. No gate needed —
 * but re-measure if the row's entrance ever stops being an opacity fade.
 *
 * ⚠️ BACKGROUND & ENTRANCE SOURCE OF TRUTH (26.08.2026): the production screen
 * recording, per the designer — the board stays the truth for layout, type,
 * composer, chips and cards. Measured analysis: scratchpad/qa7/
 * production-analysis.md; the board-matched paint this replaced is in git
 * history (07093ac).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { AnimationEvent } from 'react'
import { animate, useMotionValue, useReducedMotion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useUI } from '@/state/ui'
import { useT } from '@/i18n'
import { startBuild } from '@/modules/chat/send'
import { TEMPLATE_LIBRARY } from '@/data/templates'
import { ScrollArea } from '@/ui/ScrollArea'
import { ScenarioPanel } from '@/devtools/ScenarioPanel'
import { FlowRunner } from '@/devtools/FlowPlayer'
import { LogoRemixer, IconPlus, IconMic, IconEnter, IconChevronRight, IconClose } from '@/ui/icons'
import { LogoRemixerAnimated } from '@/ui/LogoRemixerAnimated'
import { HomeDock } from './Dock'
import { TemplatePicker } from './TemplatePicker'
import { TemplateFlight } from './TemplateFlight'
import { Thumb } from './thumbs'
import { FIELD_CLOSE, FIELD_GROW } from '@/ui/motion'
import {
  FIELD_PAD_B, FIELD_RADIUS, rectOf,
  SEAT_ACK_DELAY, SEAT_BLOOM_R, SHIFT_ROW, SHIFT_TEXT, TILE, TILE_INSET,
} from './attachment'

/* ----------------------------------------------------------------- entrance */

/**
 * The load-time entrance — the choreography the LIVE product's home page plays,
 * read frame-by-frame off its screen recording (50ms burst frames; the measured
 * timeline lives with the keyframes in index.css, section HOME ENTRANCE, and
 * the analysis in scratchpad/qa7/production-analysis.md). Three phases: the
 * colour field and the dot lattice POP together out of a 60ms curtain fade at
 * t=100ms, the logo assembles itself (the designer's SVGator asset) while
 * the copy and composer rise in, and at 1.65s a WAVE of over-brightened dots
 * expands from the logo to the page edges, the five rings igniting
 * radius-ordered in its wake.
 *
 *  - 'full'  — the whole ~4.45s theatre. Plays ONCE per app session, on boot.
 *  - 'quick' — a plain 300ms fade of the already-settled page. What a RETURN
 *              from the builder gets: the demo bounces between pages, and
 *              re-running a 4.5s curtain-raiser on every bounce would make the
 *              Home page feel broken, not cinematic.
 *  - 'none'  — the settled page, byte-identical to the signed-off markup. Also
 *              the ONLY state reduced-motion users ever see (the static logo,
 *              no pop, no wave, no stagger — CSS guards the same classes as a
 *              second engine, per the project's both-engines rule).
 *
 * State drives one root attribute (`data-home-entrance`); every animation lives
 * in CSS as a one-shot scoped under it. When the LAST one-shot ends (the wave;
 * the quick fade in 'quick') the attribute comes OFF, taking every animation
 * declaration, the wave layer and the curtain with it — so the settled page is
 * not "an animation parked on its last frame", it is the exact static paint QA
 * measures at ~60fps idle with zero per-frame repaint.
 */
type Entrance = 'full' | 'quick' | 'none'

/**
 * Module-level on purpose: it must survive the component (page bounces) but die
 * with the page load (a reload replays the theatre, like the product's own).
 */
let theatrePlayed = false

/* ------------------------------------------------------------------ backdrop */

/**
 * The five ring radii, largest first so the smallest paints last. PRODUCTION's
 * set, measured off the screen recording (radial line detection around the
 * logo centre; scratchpad/qa7/production-analysis.md §5): the recording is the
 * source of truth for the hero's background. Two of the five coincide with the
 * board's `Circles` 28364:40178 (118.209, 400); the board's other three do not
 * appear in the recording. All five share one centre: the logo mark's.
 */
const RING_RADII = [704, 536, 401, 248, 118.6]

/**
 * The painted layers over the hero's colour field (the two blooms and the
 * ground are painted by the panel itself — `.home-hero` in index.css, fitted
 * to the production recording).
 *
 * Paint order, bottom to top: rings → dot lattice → (theatre only) the wave →
 * (theatre only) the curtain. The curtain must be LAST: it has to cover the
 * lattice too, so colour and dots pop together out of one reveal — production
 * shows the lattice present from the first coloured frame. The wave sits above
 * the lattice it over-brightens and below the content column (z-10), same as
 * production, where the travelling dots read through the translucent chips but
 * never over the composer body.
 */
function HeroBackdrop({ theatre }: { theatre: boolean }) {
  return (
    <>
      {/*
       * Five 1px circles, CONCENTRIC on the logo mark's centre — production's
       * radii (see RING_RADII above). The centre tracks the mark: 50%
       * horizontally (the logo is centred in a centred column) and
       * `--home-rings-y` vertically, which the height breakpoints move with
       * the logo. During the theatre each ring fades in on its own delay,
       * chasing the wavefront (index.css HOME ENTRANCE).
       */}
      <div className="home-hero-rings pointer-events-none" aria-hidden>
        {RING_RADII.map((r) => (
          <span
            key={r}
            className="home-hero-ring"
            style={{
              left: `calc(50% - ${r}px)`,
              top: `calc(var(--home-rings-y) - ${r}px)`,
              width: r * 2,
              height: r * 2,
            }}
          />
        ))}
      </div>

      {/* The dot lattice — 16px diamond grid whose brightness rides the colour
          field: a brighter copy of the blooms shown through the diamond mask,
          so the dots are loud over the colour and simply absent in the dark
          centre valley, as the recording shows (index.css). Static paint. */}
      <div className="home-hero-dots pointer-events-none" aria-hidden />

      {/*
       * THE WAVE — the recording's centrepiece beat: at ~1.65s a ring of
       * over-brightened lattice dots ignites around the logo and travels to
       * the page edges, dying by ~4.1s. Parent carries the animated annulus
       * mask, the child the wavefront's violet dot paint (index.css has the
       * full anatomy and the measured numbers). Mounted only while the full
       * theatre runs; its animationend IS the curtain call, and unmounting
       * removes the per-frame mask cost from the settled page entirely.
       */}
      {theatre && (
        <div className="home-hero-wave pointer-events-none" aria-hidden>
          <div className="home-hero-wave-veil" />
          <div className="home-hero-wave-dots" />
        </div>
      )}

      {/*
       * The entrance's curtain — a ground-coloured cover the theatre fades OUT
       * to pop the colour field and the lattice up together (the production
       * page's first beat: black to fully coloured inside ~150ms). Mounted
       * only while the full entrance runs and gone when it ends: the settled
       * panel keeps its committed single-element paint, byte-identical to the
       * QA render (index.css has the two measured alternatives this replaced).
       * LAST child, so it covers every backdrop layer while it is opaque.
       */}
      {theatre && <div className="home-hero-curtain pointer-events-none" aria-hidden />}
    </>
  )
}

/* -------------------------------------------------------------------- topbar */

function HomeTopbar() {
  const { t } = useT()
  return (
    <header
      /* 1640 × 72 at the panel's top-left, no fill, blur 16, pl 24 / pr 20.
         The blur is the ONE thing this bar does to the hero behind it. */
      /* `he-bar` is inert chrome until the entrance root attribute arms it. */
      className="he-bar absolute left-0 right-0 top-0 z-20 flex h-[72px] items-center justify-between pl-6 pr-5 backdrop-blur-[16px]"
    >
      {/* Wordmark 28364:40747 — Gilroy SemiBold 28/1.4, cap-trimmed to a 20px box,
          so it is the CAP height that is centred in the 72px bar. Figma renders it
          as a link; here it is the page you are already on, so it does nothing. */}
      <span className="font-display text-[28px] font-semibold leading-none text-white">Remixer</span>

      {/*
       * Avatar 28364:40812. The board's asset is a photograph with a violet→blue ring
       * baked into the raster; we never draw a person, so it stays an abstract disc —
       * but the RING is not decoration, it is the thing that makes this read as an
       * avatar, so it is drawn explicitly at the same 32px.
       *
       * ⚠️ The ring only reads if the disc under it is clearly darker. The first
       * version used a blue-violet disc in a violet-blue ring: same hue, same value,
       * and the ring disappeared into it — the whole control looked like a bare
       * gradient dot. The disc is now a step darker and cooler than the rim.
       */}
      <button
        aria-label={t({ en: 'Account', uk: 'Акаунт' })}
        className="grid h-8 w-8 flex-none place-items-center rounded-full p-[2px]"
        style={{ background: 'linear-gradient(140deg, #8b5cf6 0%, #7057f9 46%, #4a6bfb 100%)' }}
      >
        <span
          className="block h-full w-full rounded-full"
          style={{ background: 'linear-gradient(150deg, #5a5f8e 0%, #3a3f6b 54%, #20244a 100%)' }}
        />
      </button>
    </header>
  )
}

/* ------------------------------------------------------------------ composer */

/**
 * The prompt chips, verbatim and in the drawn order (28364:40330…40338).
 *
 * ⚠️ Nine chips, four of which are duplicates — `Landing page`, `Portfolio`,
 * `Personal Portfolio Website` and `SaaS Product Landing Page` each appear twice.
 * That is placeholder filler, not a curated set (spec §12.6), and it is reproduced
 * exactly because the page is signed off against the board. Strings stay English for
 * the same reason `data/templates.ts` does: they are drawn content, not UI copy, and
 * inventing Ukrainian for them would be inventing product content.
 */
const PROMPT_CHIPS = [
  'E-commerce Storefront',
  'Landing page',
  'Portfolio',
  'Personal Portfolio Website',
  'SaaS Product Landing Page',
  'SaaS Product Landing Page',
  'Landing page',
  'Portfolio',
  'Personal Portfolio Website',
]

/** How far one press of the end-cap chevron moves the chip row. */
const CHIP_STEP = 320

/** Width of the row's right-edge fade. The only place this number lives. */
const CHIP_FADE = 48

/**
 * The row's right-edge fade — the same one gradient the row always had, but
 * carried by the CHIPS instead of by a mask on the scroller.
 *
 * Why it moved: a `mask` on any ancestor is a Backdrop Root, so a frosted chip
 * inside a masked scroller samples an EMPTY backdrop and renders as a flat fill
 * with the hero's dot lattice untouched behind it. Measured, with the whole
 * matrix of what does and does not break sampling, in the `.home-chip` block in
 * index.css. A chip's OWN mask is harmless — only ancestors form backdrop roots.
 *
 * So each chip overlapping the last 48px gets the ramp in its own coordinates:
 * `--chip-fade-a` where it starts, `-b` where it ends, both relative to that
 * chip's left edge and both free to go negative once the chip is deep in the
 * zone. Adjacent chips therefore share one continuous ramp and the seam between
 * them is invisible. Chips clear of the zone carry no mask at all — no
 * attribute, no raster.
 *
 * Cost: ≤2 chips are ever in the zone, so a scroll frame writes 4 custom
 * properties; nothing at rest. Positions come from `offsetLeft`, which is a
 * layout offset and does not move when the scrollport scrolls — the scroll
 * offset is added once, in `start`.
 */
function useChipEdgeFade(viewport: React.MutableRefObject<HTMLDivElement | null>) {
  const sync = useCallback(() => {
    const vp = viewport.current
    if (!vp) return
    const chips = Array.from(vp.children) as HTMLElement[]
    if (!chips.length) return
    /* Where the ramp starts, in the row's content coordinates. */
    const start = vp.scrollLeft + vp.clientWidth - CHIP_FADE
    const x0 = chips[0].offsetLeft
    for (const chip of chips) {
      const from = start - (chip.offsetLeft - x0)
      if (from >= chip.offsetWidth) {
        /* wholly clear of the zone — guarded so seven of nine chips stay
           untouched on every frame of a scroll */
        if (chip.hasAttribute('data-fade')) {
          chip.removeAttribute('data-fade')
          chip.style.removeProperty('--chip-fade-a')
          chip.style.removeProperty('--chip-fade-b')
        }
      } else {
        chip.style.setProperty('--chip-fade-a', `${from}px`)
        chip.style.setProperty('--chip-fade-b', `${from + CHIP_FADE}px`)
        chip.setAttribute('data-fade', '')
      }
    }
  }, [viewport])

  useEffect(() => {
    const vp = viewport.current
    if (!vp) return
    sync()
    /* The zone moves when the scrollport is resized, and the chips move within
       it when their own widths change — a font finally loading, a locale swap.
       Observing both is what ScrollArea's own thumb does, for the same reason. */
    const ro = new ResizeObserver(sync)
    ro.observe(vp)
    for (const chip of Array.from(vp.children)) ro.observe(chip)
    return () => ro.disconnect()
  }, [sync, viewport])

  return sync
}

/**
 * ─────────────────── THE ATTACHED TEMPLATE — board 28726:64760 ───────────────────
 *
 * The tile, as drawn: 56 × 56 at (16, 16) inside the field, radius 16 with the
 * top-right cut to 8, a 10%-white rim, the template's own drawing clipped to it,
 * and an 18px ✕ badge riding that corner (centre 1px OUTSIDE the tile,
 * diagonally). The "Add template" pill does NOT move or disappear — it stays in
 * the button row exactly where it was. Numbers and node ids: ./attachment.ts.
 *
 * ⚠️ This REPLACES our own earlier proposal (a chip with a mini-thumbnail in the
 * pill's place, shipped 25.08.2026 while no board drew this state). The designer
 * has now drawn it: an attachment behaves like an image attachment, above the
 * prompt, and the pill stays live. The proposal's record is kept in
 * figma-spec-add-template.md §7.4 as history.
 *
 * OURS, still undrawn and marked as such:
 *   · clicking the tile opens the template's full preview (the picker's detail
 *     view, flown out of the tile) — a 56px thumbnail is not something you can
 *     check a template by;
 *   · the pill, with an attachment already there, re-opens the library and the
 *     next pick REPLACES the attachment — the drawn bar is 88 wide, i.e. sized
 *     for exactly one tile, and nothing anywhere draws a second one;
 *   · Build stays "Build" (no board draws a "Remix" label anywhere).
 */
function AttachedTile({ index }: { index: number }) {
  const { t } = useT()
  const { detachTemplate, openAttachedPreview } = useUI()
  const reduced = useReducedMotion()
  const tpl = TEMPLATE_LIBRARY[index]
  const box = useRef<HTMLDivElement>(null)
  const face = useRef<HTMLButtonElement>(null)
  /** Set while the collapse plays, so a second ✕ press cannot start it twice. */
  const leaving = useRef(false)
  if (!tpl) return null

  /* Click the tile → the object grows back into the stage it came from. The
     tile's rect is measured HERE, before the picker exists. */
  function preview() {
    const el = face.current
    if (!el || leaving.current) return
    openAttachedPreview(index, rectOf(el))
  }

  /*
   * REMOVE. The tile collapses toward its own ✕ — scale to 0.85 with the
   * transform-origin ON the badge, faster than the entry and with no bounce
   * (house exit doctrine) — and only when that has played does the layout
   * change, so the field's close-up follows the tile leaving instead of
   * yanking the ground out from under it. Reduced motion: a plain fade.
   *
   * WAAPI, not a CSS class: the global reduced-motion block kills CSS
   * animations outright (`animation: none`), and this is the one place that has
   * to still *complete* under that setting — its completion is what detaches.
   */
  function remove() {
    const el = box.current
    if (!el || leaving.current) return
    leaving.current = true
    const anim = el.animate(
      reduced
        ? { opacity: [1, 0] }
        : { transform: ['scale(1)', 'scale(0.85)'], opacity: [1, 1, 0] },
      { duration: reduced ? 140 : 190, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
    )
    anim.onfinish = () => {
      /* Focus would otherwise fall to <body>: the button the keyboard was on has
         just been deleted. The field is where the flow continues. */
      const input = el.closest('.he-composer')?.querySelector('input')
      detachTemplate()
      if (input instanceof HTMLElement) input.focus()
    }
  }

  return (
    <div
      ref={box}
      /* The collapse's origin: the badge's centre, at tile-local (57, 1) — the
         gesture folds the object into the control that dismissed it. */
      className="attach-tile relative flex-none"
      style={{ width: TILE, height: TILE }}
    >
      <button
        ref={face}
        data-attach-tile
        onClick={preview}
        aria-label={t({ en: `Preview the ${tpl.name} template`, uk: `Переглянути шаблон ${tpl.name}` })}
        className="attach-tile-face absolute inset-0 block overflow-hidden"
      >
        {/* the SAME drawing the card and the stage show, HEIGHT-driven so a
            1.07:1 site fills a square (the board's own image overflows its box
            the same way, being 1898/1918 in a 56 box) */}
        <span className="absolute left-0 top-0 block aspect-[233.333/218] h-full">
          <Thumb id={tpl.id} className="absolute inset-0" />
        </span>
      </button>

      <button
        onClick={remove}
        aria-label={t({ en: 'Remove template', uk: 'Прибрати шаблон' })}
        /*
         * `Close` 28734:65594 — 18px pill on the tile's corner. Glass, so it
         * takes the family's hover wash; NO ripple (`data-no-ripple`), which is
         * the standing call from the chip it replaces: blooming light through a
         * control whose whole job is to delete the thing under it celebrates
         * the wrong event. At 18px a ripple could not read as positional
         * anyway — its own radius rule would cover the control in ~2 frames.
         */
        data-no-ripple
        className="attach-badge liquid-glass liquid-glass--pill glass-interactive absolute grid place-items-center rounded-full text-white"
      >
        {/* The board's glyph box is 16 (`Frame` 28734:65595 at (1,1) inside the
            18px badge) but the ✕'s own stroke geometry is NOT recoverable — the
            icon's SVG asset URL is proxy-blocked, like every asset in this file.
            10 puts our cross at 7.5px, matched by eye against the 1 : 1 board
            render of the whole field. */}
        <IconClose size={10} />
      </button>
    </div>
  )
}

/**
 * THE SNAP-ONCE COVER (motion.ts, `FIELD_GROW`). The field's height changes in
 * ONE commit; every row that moved is put back where it was with a transform
 * and sprung home, so the eye sees a field growing while the browser reflows
 * once. Distances are the board's constants (72 for the text line, 46 for the
 * button row and the chip row) — nothing is measured, so nothing can drift.
 *
 * The inline transform is written in a LAYOUT effect, i.e. after the commit
 * that changed the layout and before the browser paints it — that is what makes
 * the first painted frame the OLD position rather than a flash of the new one.
 * The spring then drives one motion value and writes the same property.
 */
function useSnapSlide(
  ref: React.RefObject<HTMLElement>,
  distance: number,
  attached: boolean,
  /* 'grow' = this row only rides the snap when the field OPENS; on the close
     `useFieldClose` drives it, because there the row travels with the field's
     painted edge rather than against a box that has already shrunk. */
  only?: 'grow',
) {
  const reduced = useReducedMotion()
  const mv = useMotionValue(0)
  const was = useRef(attached)

  useLayoutEffect(() => {
    const from = was.current === attached ? null : attached ? -distance : distance
    was.current = attached
    const el = ref.current
    /* Reduced motion: the field just snaps. A row sliding is exactly the
       movement the setting asks us not to make. */
    if (from === null || !el || reduced) return
    if (only === 'grow' && !attached) return

    el.style.transform = `translateY(${from}px)`
    el.style.willChange = 'transform'
    mv.jump(from)
    const write = mv.on('change', (v) => { el.style.transform = `translateY(${v}px)` })
    const run = animate(mv, 0, {
      ...(attached ? FIELD_GROW : FIELD_CLOSE),
      onComplete: () => {
        /* Leave nothing behind: no transform, no compositing hint. */
        el.style.removeProperty('transform')
        el.style.removeProperty('will-change')
      },
    })
    return () => { write(); run.stop() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attached])
}

/**
 * ─────────── THE CLOSE KEEPS THE FIELD AROUND ITS OWN CONTENTS ───────────
 *
 * The snap-once cover (above) is right in ONE direction and was wrong in the
 * other, and this is the bug the designer filmed as "все элементы интейк формы
 * стремно прыгают".
 *
 * Growing, the order is forced and correct: the box has to exist before the
 * contents can move into it, so the box snaps to 184 and the rows — put back
 * with a transform — travel DOWN inside it. They are inside the field on every
 * frame.
 *
 * Closing, the same order runs backwards: the box snapped to 138 in the detach
 * commit while the rows were still 46px lower, i.e. BELOW the field's painted
 * bottom edge. Measured on the shipped build (frozen-clock film, 16ms steps,
 * scratchpad/qa15): the field's edge teleports up 46px in ONE frame and for the
 * next ~3 frames the placeholder line and the whole button row hang OUTSIDE the
 * composer, on the bare hero — and because every control on that row is
 * translucent glass over a live `backdrop-filter`, all four of them jump in
 * tone at once (the `+` fill 12,10,16 → 45,24,55; the pill 11,9,14 → 33,20,43;
 * the mic 15,14,24 → 39,36,72 — roughly a 3× luminance spike, gone again two
 * frames later). Nothing re-mounted and nothing scaled; the controls simply
 * changed the thing they were standing on. That is what read as "все кнопки
 * делают лишнюю ненужную анимацию".
 *
 * So the close defers the part of the commit that shrinks the box:
 *
 *  · the detach commit drops the tile and re-lays the rows at their unattached
 *    places (one reflow, exactly as before) but hands the field a temporary
 *    bottom padding of 16 + 46, so its BOX is still 184 and the chips row keeps
 *    the negative margin that holds the hero column's height;
 *  · the rows ride `useSnapSlide` home unchanged (+72 / +46 → 0);
 *  · the field's painted bottom edge follows them as a `clip-path: inset(0 0 N
 *    0 round 32px)`, N: 0 → 46 on the same `FIELD_CLOSE` spring, and the chips
 *    row rides the same value as a transform. Springs are linear systems, so
 *    identical parameters give the identical normalised curve whatever the
 *    distance — the edge stays exactly the field's own 16px of bottom padding
 *    below the button row on every frame, by construction rather than by tuning;
 *  · when the spring lands, the real commit happens (padding → 16, margin → 0)
 *    and the clip and transform are dropped in the effect's CLEANUP, i.e. after
 *    that commit and before the browser paints it. Both states are the same
 *    pixels, so the hand-off is invisible; clearing them in `onComplete`
 *    instead would paint one frame of an un-clipped 184px box.
 *
 * PERFORMANCE. Still no per-frame layout: `clip-path` on the field and
 * `transform` on the rows, nothing that reflows the column. `clip-path` does
 * repaint the field, but the field's backdrop (the hero's static paint) never
 * changes, so the blur behind it is cached and only the mask moves. Measured
 * three ways over five rounds each (scratchpad/qa15/README.md): the close as
 * shipped here 38.2fps, the same close with `clip-path: none !important` 35.1,
 * and with the field's `backdrop-filter` off 55.0 — i.e. the clip is free and
 * the cost is the blur the rows were always moving under. A `height` transition,
 * the obvious alternative, was already measured at 21 layouts / 4ms against this
 * mechanism's 4 / 0.7 (design-system.md §5.4) and stays banned; the deferred
 * commit takes it to 5 / 1.12.
 */
function useFieldClose(
  field: React.RefObject<HTMLElement>,
  chips: React.RefObject<HTMLElement>,
  attached: boolean,
): boolean {
  const reduced = useReducedMotion()
  const [closing, setClosing] = useState(false)
  const p = useMotionValue(0)
  const was = useRef(attached)

  useLayoutEffect(() => {
    const closed = was.current && !attached
    was.current = attached
    /* Re-attached (the pill swaps the template mid-close): the field is going
       back to 184 anyway, so the close is off and its styles are cleared by
       this hook's own cleanup. */
    if (attached) { setClosing(false); return }
    /* Reduced motion: nothing travels, so there is nothing to keep inside. */
    if (!closed || reduced) return
    setClosing(true)
  }, [attached, reduced])

  useLayoutEffect(() => {
    if (!closing) return
    const el = field.current
    const ch = chips.current
    if (!el || !ch) { setClosing(false); return }

    const write = (v: number) => {
      el.style.clipPath = `inset(0 0 ${(SHIFT_ROW * v).toFixed(2)}px 0 round ${FIELD_RADIUS}px)`
      ch.style.transform = `translateY(${(-SHIFT_ROW * v).toFixed(2)}px)`
    }
    write(0)
    el.style.willChange = 'clip-path'
    ch.style.willChange = 'transform'
    p.jump(0)
    const unsub = p.on('change', write)
    /* Only the flag flips here. The inline styles come off in the cleanup, one
       commit later, so the un-clipped box is never painted. */
    const run = animate(p, 1, { ...FIELD_CLOSE, onComplete: () => setClosing(false) })

    return () => {
      unsub()
      run.stop()
      el.style.removeProperty('clip-path')
      el.style.removeProperty('will-change')
      ch.style.removeProperty('transform')
      ch.style.removeProperty('will-change')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing])

  return closing
}

function Composer() {
  const { t } = useT()
  const { openBuilder, openTemplatePicker } = useUI()
  const attachedIndex = useUI((s) => s.attachedTemplate)
  const [draft, setDraft] = useState('')
  const field = useRef<HTMLInputElement>(null)
  const chipRow = useRef<HTMLDivElement | null>(null)
  const syncChipFade = useChipEdgeFade(chipRow)

  const attached = attachedIndex != null ? TEMPLATE_LIBRARY[attachedIndex] : null
  const hasTile = attachedIndex != null
  /* A template alone arms Build too — a lit tile beside a dead button would
     read as broken. Undrawn either way (our call, same standing as the tile). */
  const armed = draft.trim().length > 0 || attached != null

  /*
   * THE SNAP-ONCE COVER. The field's box goes 138 → 184 in one commit
   * (board 28726:64760 against 28364:40219); these three put the rows that
   * moved back where they were and spring them home, so nothing animates
   * layout. Distances are the board's: the placeholder line drops 72, the
   * button row and the chip row 46.
   *
   * ⚠️ The CLOSE defers the half of that commit which shrinks the box, so the
   * rows never travel outside the field — `useFieldClose` below owns it, and
   * owns the chips row outright on that path (hence 'grow').
   */
  const fieldBox = useRef<HTMLDivElement>(null)
  const textRow = useRef<HTMLDivElement>(null)
  const buttonRow = useRef<HTMLDivElement>(null)
  const chipsRow = useRef<HTMLDivElement>(null)
  const closing = useFieldClose(fieldBox, chipsRow, hasTile)
  useSnapSlide(textRow, SHIFT_TEXT, hasTile)
  useSnapSlide(buttonRow, SHIFT_ROW, hasTile)
  useSnapSlide(chipsRow, SHIFT_ROW, hasTile, 'grow')

  /*
   * THE FIELD ACKNOWLEDGES RECEIVING IT. When the flying template lands, the
   * field's own rim lifts and releases (~220ms) and one restrained bloom of the
   * ripple family's light pours out from under the tile as it seats. Both are
   * composited opacity/transform one-shots that unmount when they end — the
   * settled field is byte-identical to before.
   *
   * ⚠️ NO travelling sheen across the tile. A sheen is light raking over
   * transparent glass; this designer rolled one back off the Publish panel for
   * exactly that reason (CLAUDE.md, 17.08.2026), and the tile is a photograph.
   * The glass in this gesture is the FIELD and the BADGE.
   */
  const [seated, setSeated] = useState(false)
  const beat = useMotionValue(0)
  const flight = useUI((s) => s.tplFlight)
  useEffect(() => {
    if (flight?.to !== 'tile') return
    /*
     * Fired on a timer from the flight's START, not on its completion, and the
     * reason is in the frames: the seat spring is 620ms long but the object is
     * visually home at ~300 — the rest is a 2% settle nobody watches. Hanging
     * the acknowledgment off `onComplete` put the field's flash a third of a
     * second after the catch, which read as an unrelated blink.
     */
    /* Scheduled on motion's own clock, not `setTimeout`: the beat belongs to
       the flight's timeline, so it stays in step if the animation clock is ever
       scaled (which is exactly how QA films this — a wall timer filmed at 1/24
       speed fired while the object was still the size of the screen). */
    const run = animate(beat, 1, {
      duration: 0.001,
      delay: SEAT_ACK_DELAY / 1000,
      onComplete: () => setSeated(true),
    })
    return () => run.stop()
  }, [flight])

  /* Back from the picker with a template attached: focus returns to the field
     so typing — or a bare Enter — continues the flow without another click. */
  useEffect(() => {
    if (attachedIndex != null) field.current?.focus()
  }, [attachedIndex])

  /*
   * The whole point of the page: the typed prompt becomes the builder's first
   * message and the builder opens already working. `startBuild` reuses the chat's
   * own send machinery (transcript, credits, the 2.6s canned answer) rather than
   * restaging any of it here — the shell must not be able to tell which composer a
   * message came from. No send flash: the page is gone by the next frame, so there
   * is nothing left for the light to run around.
   *
   * With a template attached the seeded first message names it, so the
   * transcript shows both inputs on one line. ⚠️ The wording is OURS and the
   * real contract with generation (how prompt + template merge) is undecided —
   * README §7 records the rule "the prompt wins, the template is the starting
   * point", nothing more. `openBuilder` consumes the attachment.
   */
  function build() {
    if (!armed) return
    const text = draft.trim()
    startBuild(
      attached
        ? text
          ? `${text} — remix the “${attached.name}” template`
          : `Remix the “${attached.name}” template`
        : text,
    )
    openBuilder()
  }

  return (
    <>
      {/* ------------------------------------------- the field (28364:40219) */}
      <div
        ref={fieldBox}
        className="he-composer relative w-[960px] max-w-full flex-none rounded-[32px] bg-[var(--black-900)] backdrop-blur-[16px]"
        /* Figma's padding is 17/16/16/0 on a 138-tall box whose 1px stroke sits
           INSIDE the geometry. A CSS `border` does not: it eats a pixel of the
           content box, which put the text row, the `+` button and the caret 1px
           right of the drawn x and made the two inner rows 943 instead of 944.
           So the rim is an INSET shadow — no layout, follows the 32px radius, one
           static paint — and the padding is Figma's, unmodified. Same reason the
           shell's glass rims are drawn rather than bordered (CLAUDE.md).

           WITH AN ATTACHMENT (28726:64923) the box is 184: the top padding goes
           17 → 16 and the tile's 56px row opens above the text. The box grows
           DOWNWARD — the board keeps the composer container's own y (453.9998 on
           both boards), so everything above the field holds still and the chip
           row below it moves 46.

           WHILE THE FIELD IS CLOSING the box is still 184 — the extra 46 sits in
           the bottom padding, under the button row, and the painted edge rides
           up as a clip (`useFieldClose`). Without it the box shrank first and
           left the rows hanging on the bare hero for three frames. */
        style={{
          boxShadow: '0 16px 80px 0 rgba(0, 0, 0, 0.08), inset 0 0 0 1px var(--white-100)',
          padding: hasTile
            ? `16px 16px ${FIELD_PAD_B}px 0`
            : `17px 16px ${closing ? FIELD_PAD_B + SHIFT_ROW : FIELD_PAD_B}px 0`,
        }}
      >
        {/* THE ATTACHMENTS ROW (`Attachments bar` 28734:65591): the tile 16px in
            from the field's left edge, 56 tall, and nothing else — the row's own
            16px of padding-top is the field's, above. */}
        {attachedIndex != null && (
          <div className="flex items-start pl-4" style={{ height: TILE }}>
            <AttachedTile index={attachedIndex} />
          </div>
        )}

        {/* The seating light and the rim's acknowledgment, mounted only while
            they play. The clip is what keeps the bloom inside the field's own
            32px radius; both children animate transform/opacity only. */}
        {seated && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]"
            onAnimationEnd={(e) => { if (e.animationName === 'composer-ack') setSeated(false) }}
          >
            <span className="composer-ack absolute inset-0 rounded-[32px]" />
            <span
              className="composer-seat-bloom absolute"
              style={{
                left: TILE_INSET + TILE / 2 - SEAT_BLOOM_R,
                top: TILE_INSET + TILE / 2 - SEAT_BLOOM_R,
                width: SEAT_BLOOM_R * 2,
                height: SEAT_BLOOM_R * 2,
              }}
            />
          </span>
        )}

        {/* text row 944 × 52, pl 24 / pr 8. The row is 52 because Figma's
            placeholder carries a second, EMPTY paragraph (2 × 26); the empty line
            is not reproduced, but the space it occupies is — drop it and the whole
            composer shrinks 26px away from where the board draws it. With an
            attachment the board drops that phantom line and pads the single line
            17/17 instead (a 60 box, `Text` 28726:64925) — which is why the line
            travels 72 while the row below it travels 46. */}
        <div ref={textRow} className={hasTile ? 'mt-[17px] flex h-[26px] items-start pl-6 pr-2' : 'flex h-[52px] items-start pl-6 pr-2'}>
          <input
            ref={field}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); build() } }}
            /* Figma draws a caret at x=24 with the placeholder starting at 25: this
               is a real field, so the browser's own caret sits where the drawn one
               does and the placeholder follows it. */
            autoFocus
            aria-label={t({ en: 'Describe the site you want', uk: 'Опишіть сайт, який хочете' })}
            placeholder={t({ en: 'e.g. Bella’s Bakery', uk: 'напр. Пекарня Белли' })}
            className="h-[26px] w-full bg-transparent text-[16px] leading-[26px] text-white caret-white outline-none placeholder:text-[var(--gray-350)]"
          />
        </div>

        {/* button row 944 × 36, pl 16, space-between; the right group's edge lands
            16px inside the field, which is where the field's own padding puts it */}
        <div ref={buttonRow} className="mt-[17px] flex h-9 items-center justify-between pl-4">
          {/*
           * `Left` 28616:58687 — the "+" and the template pill, gap 8. The
           * 25.08.2026 restyle of board 28364:40053 moves all three round
           * controls from ghost (no fill, 8% rim) to the canonical Liquid
           * Glass — Black/700 + blur 16 + the top-lit TL→BR gradient rim
           * (.liquid-glass--control on the circles, --pill on the pill; the
           * stroke paints are gradients in Figma, not the flat 24% an early
           * flattened export read claimed — design-system.md § Liquid Glass).
           */}
          <div className="flex min-w-0 items-center gap-2">
            <button
              aria-label={t({ en: 'Attach', uk: 'Прикріпити' })}
              /* hover/press live on `glass-interactive` (wash + click-point
                 ripple, index.css canon block + src/ui/ripple.ts) — the old
                 darkening hover:bg is superseded by the designer's 26.08 order */
              className="liquid-glass liquid-glass--control glass-interactive grid h-9 w-9 flex-none place-items-center rounded-full text-white"
            >
              <IconPlus size={24} />
            </button>

            {/* "Add template" 28616:58682 — 123×36 r999 glass; label Proxima
                Nova REGULAR 14 at 80% white (not the Semibold the chips and
                Build wear). Width is the label's own (20px side padding), so
                the UK string fits without clipping; EN lands on the drawn 123
                to within the stand-in font's tolerance.

                IT STAYS WITH AN ATTACHMENT — board 28726:64760 draws the pill
                untouched in the button row while the tile sits above. (Our
                earlier chip replaced it here; that was a guess made before this
                board existed.) Pressing it with a template already attached
                re-opens the library and the next pick swaps the attachment —
                ours, and the only reading the drawn 88px one-tile bar allows. */}
            <button
              data-template-trigger
              onClick={openTemplatePicker}
              className="liquid-glass liquid-glass--pill glass-interactive flex h-9 flex-none items-center whitespace-nowrap rounded-full px-5 text-[14px] leading-none text-[#ffffffcc] transition-colors duration-[var(--dur-fast)] ease-std hover:text-white"
            >
              {t({ en: 'Add template', uk: 'Додати шаблон' })}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              aria-label={t({ en: 'Voice input', uk: 'Голосове введення' })}
              className="liquid-glass liquid-glass--control glass-interactive grid h-9 w-9 place-items-center rounded-full text-white"
            >
              {/* 24px icon box, 20px leaf — the two are NOT the same in Figma */}
              <span className="grid h-6 w-6 place-items-center"><IconMic size={20} /></span>
            </button>

            {/*
             * Build — 86 × 36, radius 12, label 14 Proxima Semibold + the ⏎ glyph.
             *
             * ⚠️ ACTIVE BUILD IS ACTION BLUE (designer, 26.08.2026: «да, когда она
             * активна, она синяя»), which OVERRIDES the board. The three states are
             * drawn as hidden sibling frames — 28364:40238 enabled, 40242 disabled,
             * 40246 hover/pressed — and 40238 draws a near-white #fafafa plate with
             * a #09090b label; that white plate was shipped, flagged as a departure
             * from the project's verified brand rule ("#1587FF = action", CLAUDE.md),
             * and the designer has now answered the flag: the rule wins. So enabled
             * is `--action` #1587ff with a white label, and hover / pressed are the
             * house action ramp (`--action-hover` / `--action-pressed`) that every
             * other solid blue button in the prototype uses — PublishPanel, the
             * domain sheets, and the `Choose a template` pill this page's own picker
             * turned blue on the same day. The board's hover pair (#1f1f22 plate +
             * #52525b label, 40246) belonged to the white plate and goes with it.
             *
             * The DISABLED look is untouched: an 8%-white ghost plate with a
             * 24%-white label, exactly as 40242 draws it.
             *
             * ⚠️ AND BLUE ↔ GHOST HAS A LEGIBLE MIDDLE, so the paint may ride the
             * movement again — which is why the lagged-paint machinery that used
             * to sit here is gone. `design-system.md` §5 rule 4б moved this cross
             * OFF the attachment's 46px travel because the WHITE pair inverted
             * through a grey with no readable middle: plate↔label contrast
             * 19.06 → **1.17** → 2.20 : 1, the label gone for ~3 frames while the
             * eye tracked the moving row. Re-measured on the built app with the
             * blue pair (per-frame computed values composited over the recovered
             * backdrop, `scratchpad/wp1/build-cross.mjs`, screenshot-verified at
             * both ends): arming 2.20 → **3.95** → 3.53 : 1, disarming
             * 3.53 → 3.93 → 2.20 : 1. The middle is now the MOST readable part of
             * the cross — the plate darkens in one channel while the ink brightens
             * — and no frame is worse than the state it is travelling towards
             * (2.20 : 1 IS the settled ghost, unchanged and WCAG-exempt as a
             * disabled control). Rule 4б still holds as a rule; it just no longer
             * has a case here.
             *
             * ⚑ ONE VISIBLE CONSEQUENCE for the designer: on ATTACH the button now
             * lights at the START of the flight rather than with the tile's
             * landing, so "tile lands · field flashes · button lights" is no
             * longer one event (that pairing was `ARM_PAINT_DELAY = SEAT_ACK_DELAY`).
             * Restoring it is one lagged flag; it was not restored because its only
             * documented reason was the contrast failure above.
             */}
            <button
              onClick={build}
              disabled={!armed}
              /* ONE flag for behaviour AND paint — see the blue note above.
                 Until 26.08.2026 the colours were a lagged copy of `armed`
                 (`ARM_PAINT_DELAY`), because the white↔ghost pair had no legible
                 middle; the blue pair does, so the cross rides the movement
                 again and the copy is gone. Still one static box, still one
                 `--dur-fast` colour cross: no scale, no crossfade, no swap. */
              className={`flex h-9 w-[86px] items-center justify-center gap-1.5 rounded-[12px] pl-[18px] pr-1.5 text-[14px] font-semibold leading-none transition-colors duration-[var(--dur-fast)] ease-std ${
                armed
                  ? 'bg-[var(--action)] text-white hover:bg-[var(--action-hover)] active:bg-[var(--action-pressed)]'
                  : 'bg-[var(--white-100)] text-[#ffffff3d]'
              }`}
            >
              {t({ en: 'Build', uk: 'Збудувати' })}
              <IconEnter size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-none" style={{ height: 'var(--home-gap-chips)' }} aria-hidden />

      {/* --------------------------------------- prompt chips (28364:40319) */}
      <div
        ref={chipsRow}
        className="he-chips flex h-[42px] w-[960px] max-w-full flex-none items-center"
        /*
         * The 46px the field grew comes out of the hero's BOTTOM slack, not out
         * of the column's proportional spacers — a negative bottom margin keeps
         * the column's used height constant, so the logo, headline and subtitle
         * do not move a pixel when a template lands. That is what the board
         * says: the composer container's y is 453.9998 on both boards, the chip
         * row inside it moves 162 → 208, and the slack under it goes 118 → 72.
         * Without this the shared spacers would have taken 26px off the top and
         * shifted the whole hero up.
         *
         * It stays on through the close, because through the close the field's
         * box is still 184 (`useFieldClose`) — the row's own travel up to the
         * closing edge is a transform written by that hook.
         */
        style={hasTile || closing ? { marginBottom: -SHIFT_ROW } : undefined}
      >
        <ScrollArea
          axis="x"
          className="home-chip-scroller h-[42px] min-w-0 flex-1"
          innerClassName="flex items-center gap-2"
          viewportRef={chipRow}
          /* the row's right-edge fade is carried by the chips, not by a mask on
             this scroller — a masked ancestor would kill their frost outright
             (useChipEdgeFade above, `.home-chip` in index.css) */
          onScroll={syncChipFade}
        >
          {PROMPT_CHIPS.map((label, i) => (
            <button
              // duplicates in the drawn list, so the index is the only honest key
              key={`${label}-${i}`}
              onClick={() => { setDraft(label); field.current?.focus() }}
              /* `.home-chip` carries the frosted material (fill + backdrop blur
                 + the flat drawn hairline) and `glass-interactive` the family's
                 hover wash and press ripple. Label is `White/900` = 80% white,
                 written out rather than taken from `--white-700`, which is 85%
                 (spec §9 flags it as a near miss and the chip label is the place
                 it shows). */
              className="home-chip glass-interactive h-10 flex-none whitespace-nowrap rounded-full px-5 text-[14px] text-[#ffffffcc] transition-colors duration-[var(--dur-fast)] ease-std hover:text-white"
            >
              {label}
            </button>
          ))}
        </ScrollArea>

        {/* end cap 48 × 42: an 8px gap, then the 40px circle. The glyph is a
            chevron, not an arrow with a shaft, and its 2px left padding is what
            gives Figma's 11 / 9 asymmetry inside the circle. */}
        <div className="flex h-[42px] w-12 flex-none items-center justify-end">
          <button
            onClick={() => chipRow.current?.scrollBy({ left: CHIP_STEP, behavior: 'smooth' })}
            aria-label={t({ en: 'More prompts', uk: 'Більше підказок' })}
            /* `.home-chip-cap`: the same fill and blur as the chips beside it —
               Figma already draws this one as glass (Black/300, blur 10), and
               the row now reads as ONE material at the family's 16px radius.
               Its hover is the family wash instead of the old bg swap. */
            className="home-chip-cap glass-interactive flex h-10 w-10 items-center justify-center rounded-full pl-[2px] text-white"
          >
            <IconChevronRight size={20} />
          </button>
        </div>
      </div>
    </>
  )
}

/* ---------------------------------------------------------------------- page */

export function HomePage() {
  const { t } = useT()
  const lang = useWorld((s) => s.world.lang)

  /*
   * Resolved once per MOUNT, before the first paint, so nothing flashes settled
   * and then restarts. Reduced motion wins outright — the page appears settled
   * immediately, static logo included (the maintenance page's doctrine for the
   * same SVGator pair). The flag is written in an effect, not in the
   * initializer: StrictMode calls initializers twice per mount to expose
   * exactly that impurity (the second call would have seen its own footprint
   * and downgraded the boot to 'quick').
   */
  const [entrance, setEntrance] = useState<Entrance>(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'none'
      : theatrePlayed
        ? 'quick'
        : 'full',
  )
  useEffect(() => {
    theatrePlayed = true
    /*
     * Reduce Motion flipped ON mid-theatre: the CSS guard kills the one-shots
     * where they stand, but a KILLED animation fires `animationcancel`, not
     * `animationend` — the curtain call below would never come and the stage
     * props (the attribute, the curtain, the SVGator logo) would linger. So the
     * setting change itself strikes the set.
     */
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => {
      if (mq.matches) setEntrance('none')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  /*
   * The curtain call. Animation events BUBBLE, so one listener on the page root
   * hears every one-shot finish; keying on the animation NAME (not the target)
   * means nothing else that ever animates on this page — the picker's springs
   * are JS-driven and fire no CSS events — can end the entrance early. The
   * WAVE is the theatre's last runner (it carries 350ms of dead time past its
   * own fade-out so the last ring, ending at 4.43s, is already settled); the
   * quick path has only itself.
   */
  const onEntranceEnd =
    entrance === 'none'
      ? undefined
      : (e: AnimationEvent) => {
          if (e.animationName === 'home-wave' || e.animationName === 'home-quick-in') {
            setEntrance('none')
          }
        }

  return (
    <div
      className="flex h-full flex-col overflow-hidden bg-[var(--gray-950)] text-[var(--white-900)]"
      data-home-entrance={entrance === 'none' ? undefined : entrance}
      onAnimationEnd={onEntranceEnd}
    >
      {/*
       * The hero band. 8px on the left, top and right; nothing at the bottom, so the
       * panel's rounded bottom corners meet the dock and the page ground shows
       * through them — the only separator the board draws between the two.
       *
       * `flex: 1 1 0` with a min: the hero is the band that absorbs whatever height
       * the viewport has, which is what makes the dock read as pinned to the bottom.
       * At 1196 it resolves to exactly the drawn 812.
       */}
      <div className="flex min-h-[488px] flex-1 basis-0 px-2 pt-2">
        <div className="home-hero relative w-full overflow-hidden rounded-[20px]">
          <HeroBackdrop theatre={entrance === 'full'} />
          <HomeTopbar />

          {/* content column: 1608 inside the 1640 panel, capped there on wider
              screens. The two spacers carry the drawn slack (160 above, 118 below)
              in the same 160 : 118 ratio at any height, so at 812 they land on the
              exact numbers and never squeeze the content first. */}
          <div className="relative z-10 mx-auto flex h-full w-full max-w-[1640px] flex-col items-center px-4">
            {/* The top pad is 160 of the drawn slack, but it may never fall below the
                topbar's own 72: the bar is transparent with a blur, so anything that
                slides under it comes out smeared rather than clipped. */}
            <div style={{ flex: '160 1 0', minHeight: 76 }} aria-hidden />

            {/* logo 96 × 96, horizontally centred (28364:40192).
                During the full entrance the slot stacks two marks: the SVGator
                assembly underneath (its shapes start at opacity 0 — the slot is
                EMPTY until the player's 300ms beat), and the board mark on top,
                cross-faded in by `.he-logo-static` right after the assembly's
                final bounce (1.55s). The two differ only in sparkle size and
                grey tone, so the fade reads as the logo settling — and the
                settled DOM keeps only the board mark QA signed off. `relative`
                on the static copy is what puts it ABOVE the absolutely
                positioned assembly (positioned beats non-positioned in paint
                order); both extras vanish with the entrance state. */}
            <div
              className={entrance === 'full' ? 'relative flex-none' : 'flex-none'}
              style={{ height: 'var(--home-logo)', width: 'var(--home-logo)' }}
            >
              {entrance === 'full' && (
                <LogoRemixerAnimated delay={300} className="home-logo-anim absolute inset-0" />
              )}
              <LogoRemixer
                size={96}
                className={entrance === 'full' ? 'he-logo-static relative h-full w-full' : 'h-full w-full'}
              />
            </div>

            <div className="flex-none" style={{ height: 'var(--home-gap-logo)' }} aria-hidden />

            {/* Headline 28364:40207 — TWO text nodes 8px apart, not one string with a
                space: the drawn gap is tighter than the font's own word space. */}
            <h1
              className="he-head flex flex-none flex-wrap items-start justify-center gap-2 whitespace-nowrap text-center font-display font-semibold leading-[1.2] text-white"
              style={{ fontSize: 'var(--home-h1)' }}
            >
              <span>{t({ en: 'Describe it.', uk: 'Опишіть.' })}</span>
              <span>{t({ en: 'Remixer builds it.', uk: 'Remixer збудує.' })}</span>
            </h1>

            <div className="h-[11px] flex-none" aria-hidden />

            {/* Proxima Nova Regular 20/1.4 at White/800 — 72% white, written out
                rather than taken from `--white-500`, which is 70% (spec §9). */}
            <p className="he-sub flex-none text-center text-[20px] leading-[1.4] text-[#ffffffb8]">
              {t({
                en: 'Create stunning apps & websites by chatting with AI.',
                uk: 'Створюйте чудові застосунки та сайти у розмові з AI.',
              })}
            </p>

            {/* 64 = Figma's phantom empty subtitle line (28) + the composer
                container's padding-top (36). The empty line is not rendered; the
                space it occupies is, because that is where the board puts the
                composer. */}
            <div className="flex-none" style={{ height: 'var(--home-gap-sub)' }} aria-hidden />

            {/* Keyed on the locale: switching language mid-sentence should not leave
                half a prompt sitting under a placeholder in the other one. */}
            <Composer key={lang} />

            <div className="min-h-0" style={{ flex: '118 1 0' }} aria-hidden />
          </div>
        </div>
      </div>

      <HomeDock />

      {/* The template picker is an APP-level overlay, like the builder's domain
          modal: its 50% scrim covers the hero, the topbar and the dock alike,
          so it mounts at the page root, not inside the composer. */}
      <TemplatePicker />

      {/* The template in the air between the picker's stage and the composer's
          tile — a page-level layer ABOVE the picker's scrim, because the flight
          outlives the surface it leaves. Mounted AFTER the picker on purpose:
          its layout effect measures the detail view's stage, which has to exist
          in the same commit. */}
      <TemplateFlight />

      {/* Tooling, mounted per page: the console is how the designer switches the
          dock between "no projects yet" and "one site" without touching code. */}
      <FlowRunner />
      <ScenarioPanel />
    </div>
  )
}
