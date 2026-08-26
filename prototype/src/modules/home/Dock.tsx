/**
 * The Home page's bottom dock — Figma 28364:40053 (`My projects`) and 28375:43006
 * (`Templates`). One component, because the boards draw one band in two states:
 *
 *   · the customer HAS sites  → a segmented control `My projects | Templates` over
 *     their shelf: the real project card plus the drawn empty slots
 *   · the customer has NONE   → the `Templates` heading, the category filter chips,
 *     and the six template cards
 *
 * Which one you get is product truth (`world.projects`), not a page flag — see the
 * `projects` axis in state/world.ts. Picking the `Templates` tab shows the same
 * template content without the heading, since the tab already names it.
 *
 * Geometry: the band is 376 tall and full-bleed, with 32px side insets, an 80px title
 * row and 24px of slack under the cards. Card widths are an OUTPUT, never an input —
 * every card is `flex: 1 0 0`, which at six-up in a 1592 column is the 238.667 the
 * board reports. There is no fill, no hairline and no shadow on this band: the hero's
 * rounded bottom corners are the entire separation.
 */
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition } from 'motion/react'
import { hasProjects, useWorld, type HomeProject } from '@/state/world'
import { useUI, type DockTab } from '@/state/ui'
import { useT, type Text } from '@/i18n'
import { cardAdd, cardAddFade, cardAddScrim, listSwapBehind, listSwapFade, segmentedPill } from '@/ui/motion'
import {
  TEMPLATES, TEMPLATE_CATEGORIES, templatesIn,
  type Template, type TemplateCategoryId,
} from '@/data/templates'
import { startBuild } from '@/modules/chat/send'
import { ScrollArea } from '@/ui/ScrollArea'
import { IconMoreVertical, IconPlus } from '@/ui/icons'
import { Thumb } from './thumbs'

/** How many slots the shelf shows. Six is what the canonical board draws. */
const SLOTS = 6

/** No animation at all — see `instant` on TemplateCard. */
const NO_TIME = { duration: 0 } as const

/**
 * Which conveyor the tab switch's content rides — the house one, or the same
 * one with the movement taken out when the OS asks for less motion.
 *
 * ⚠️ `<MotionConfig reducedMotion="user">` at the root is NOT enough here, and
 * that is worth knowing: it disables transform animations, and "disabled" means
 * the value SNAPS to its target, so the conveyor's `exit: { y: -12 }` turned
 * into a 12px HOP at 90% opacity instead of a slide (measured). A hop is not
 * less motion than a slide. `listSwapFade` drops the displacement itself, which
 * is what the setting is actually asking for; see the note on it in ui/motion.ts.
 */
function useConveyor() {
  return useReducedMotion() ? listSwapFade : listSwapBehind
}

/* ------------------------------------------------------------------- header */

/**
 * `Tabs (Small)` 28364:42996 — track 211 × 44, 4% white fill, and a GRADIENT
 * rim (32% → 4% → 24% down the pixel diagonal — the loudest cut of the Liquid
 * Glass rim family; `.home-tabs-track` in index.css has the exact paint).
 * ⚠️ The old flat `32% white` here was a flattened export read, not the drawn paint.
 *
 * SEAT GEOMETRY, as drawn: 6px of padding all round, two seats 101 and 92 wide
 * with 6px between them. The widths are per POSITION, not per selection — they
 * come from the two labels, so the pill is 101 wide on the left and 92 on the
 * right. That difference is the whole reason the pill is built the way it is
 * below.
 */
const SEAT_PAD = 6
const SEAT_GAP = 6
const SEAT_H = 32
/** A 999-radius box this tall has 16px caps — the number the capsule maths needs. */
const SEAT_R = SEAT_H / 2
const SEATS: { id: DockTab; label: Text; w: number }[] = [
  { id: 'projects', label: { en: 'My projects', uk: 'Мої проєкти' }, w: 101 },
  { id: 'templates', label: { en: 'Templates', uk: 'Шаблони' }, w: 92 },
]
/** Left / right edge of seat i in the track's padding-box coordinates. */
const seatL = (i: number) => SEAT_PAD + SEATS.slice(0, i).reduce((s, t) => s + t.w + SEAT_GAP, 0)
const seatR = (i: number) => seatL(i) + SEATS[i].w
/**
 * Each half of the travelling capsule: the NARROW seat minus one cap radius.
 *
 * ⚠️ This number is not a taste call, it is the one that keeps the seam
 * invisible — see `TabPill`. The two halves overlap by `seat − CAP_W`, and that
 * overlap has to stay inside `[R, CAP_W − 2R]` = [16, 44] at BOTH seats and
 * everywhere in between: 16 so each buried cap lands inside the other half's
 * full-height run (below 16 the two arcs come within a pixel of each other and
 * Chrome composites both AA edges, which is exactly the artifact this replaced),
 * 44 so the two straight runs still touch. Overlap here is 25 and 16.
 */
const CAP_W = Math.min(...SEATS.map((s) => s.w)) - SEAT_R

/**
 * The travelling pill — the designer's order, 26.08.2026: "a smooth, great
 * animation for the segmented control switch".
 *
 * THE CAPSULE OF TWO. The seats are different widths, so the shape genuinely
 * changes (101 → 92) and the obvious `translate + scaleX` is wrong twice over:
 * scaling a 999-radius box squashes its caps (16px vertical radius against
 * 14.6 horizontal), which means the SETTLED pill is no longer the drawn one —
 * and pixel-QA'd geometry is not something an animation gets to spend.
 *
 * So the pill is two identical 76-wide capsules, one pinned to the active
 * seat's LEFT edge and one to its RIGHT edge, each animating `x` and nothing
 * else. The union of two equal-height capsules is always a capsule, so the
 * ends stay exactly round at every width in between, and both bodies are
 * opaque white, so the seam inside the union does not exist. Nothing scales,
 * nothing repaints, and each half's OWN caps are buried in the other half's
 * full-height run — which is what `CAP_W` above is chosen for, and what a
 * first cut at this got wrong: two 92-wide halves land exactly on top of each
 * other on `Templates`, Chrome composites both antialiased cap arcs, and the
 * settled pill came out 333 subpixels heavier than the one QA signed off.
 *
 * Why the two halves stay in phase: a spring is a linear system, so two
 * springs with the same parameters trace the same NORMALIZED curve whatever
 * distance they cover — 107px and 98px here. That holds through interruption
 * too, since each carries velocity proportional to its own distance. The law
 * is `segmentedPill` in ui/motion.ts.
 */
function TabPill({ active }: { active: number }) {
  return (
    /* Inset 0 = the track's PADDING box, which is also its border box (the rim
       is a mask ring on ::before, never a border) — so `left`/`top` below are
       seat coordinates straight out of the board. */
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {([0, 1] as const).map((end) => (
        <motion.div
          key={end}
          className="absolute top-[6px] h-8 rounded-full bg-white"
          style={{ width: CAP_W, left: end ? seatR(0) - CAP_W : seatL(0) }}
          /* `initial={false}`: on mount the pill IS at its seat. Without this
             it would spring in from x:0 during the Home entrance, which already
             animates the whole dock as one block (`he-dock`). */
          initial={false}
          animate={{ x: end ? seatR(active) - seatR(0) : seatL(active) - seatL(0) }}
          transition={segmentedPill.transition}
        />
      ))}
    </div>
  )
}

function DockTabs() {
  const { t } = useT()
  const { dockTab, setDockTab } = useUI()
  const active = SEATS.findIndex((s) => s.id === dockTab)

  return (
    /* 211 × 44: 6px of padding, 101 + 6 + 92 of tabs. The rim is a mask ring
       overlaying the padding's outer pixel rather than a border adding to the
       track, the same reason as the composer's. */
    <div className="home-tabs-track relative flex h-11 w-[211px] flex-none items-center gap-1.5 rounded-full p-[6px]">
      <TabPill active={active} />
      {SEATS.map((seat, i) => {
        const on = i === active
        return (
          /*
           * `relative` is load-bearing: the pill is an absolutely-positioned
           * sibling, and a non-positioned button would have its text painted
           * UNDER it (positioned boxes paint after in-flow ones).
           *
           * Interaction states belong to the INACTIVE seat only. The active
           * seat is solid white — a white wash and a white bloom on white are
           * invisible — and pressing what is already selected is a no-op, so
           * there is nothing to acknowledge. `glass-interactive` therefore
           * comes and goes with the selection; both the 8% wash and the
           * positional ripple clip to the button's own rounded box.
           *
           * ⚠️ The inactive seat's drawn radius is 8 while the active pill is
           * a full 999 — flagged to the designer as probably accidental (spec
           * §12.10). It used to be invisible either way; the wash and ripple
           * are the first things that would ever SHOW it, so they take the
           * pill's radius instead of enshrining a probable accident. The drawn
           * 8 stays recorded here and in the spec.
           */
          <button
            key={seat.id}
            onClick={() => setDockTab(seat.id)}
            style={{ width: seat.w }}
            aria-pressed={on}
            className={`group relative h-8 rounded-full text-[14px] leading-none ${on ? '' : 'glass-interactive'}`}
          >
            {/*
             * TWO INKS, CROSS-FADING IN PLACE. The label's colour is not the
             * only thing that changes between states — the WEIGHT does too
             * (semibold dark / medium muted, as drawn), and a weight cannot be
             * interpolated. So each seat carries both inks stacked in the same
             * box and only their opacity moves: no glyph travels, no glyph
             * scales, and the ink never snaps.
             *
             * What is tuned is WHEN the fade passes 50%, not how long it takes:
             * both bad states are equally invisible (near-black on the track,
             * 48%-white on the pill), so the ink has to be mid-grey exactly
             * while the pill is between the seats. See `.home-tab-ink` in
             * index.css for the measured numbers.
             */}
            {/* ⚠️ One of the two carries the accessible name and the other is
                `aria-hidden` UNCONDITIONALLY — not "whichever is visible".
                Both inks are real text, so without this the button is named
                "Templates Templates", and flipping the flag with the selection
                would make the name churn on every switch. The name is the same
                string either way; the selected state is on `aria-pressed`. */}
            <span className="home-tab-ink font-semibold text-[var(--gray-950)]" style={{ opacity: on ? 1 : 0 }}>
              {t(seat.label)}
            </span>
            <span
              aria-hidden
              className="home-tab-ink font-medium text-[var(--white-480)] group-hover:text-white"
              style={{ opacity: on ? 0 : 1 }}
            >
              {t(seat.label)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * The category chip row — `Tab Alt (Dark theme)`, one Figma component with two
 * homes: right-aligned in the dock's title row (28376:43912) and centred under
 * the template picker's heading (28626:583). Same chips, same order, same
 * styles in both, so one React component too. Controlled, because the two
 * homes keep different filter state: the dock's lives in the ui store, the
 * picker's is per-open.
 */
export function CategoryChips({
  value, onChange, swap = false,
}: {
  value: TemplateCategoryId
  onChange: (id: TemplateCategoryId) => void
  /**
   * The dock's instance is half of the segmented-control conveyor and has to
   * arrive and leave with the shelf. It rides on the ROW ITSELF rather than in
   * a wrapper around it, and that is measured, not tidiness: an extra box here
   * — same class, same measured position to 1/64 px — still moved the chips'
   * corner antialiasing by 1–2/255 on 102 pixels against the signed-off build.
   * The picker's instance leaves this off and renders exactly as before (a
   * `motion.div` with no animation props adds nothing to the DOM).
   */
  swap?: boolean
}) {
  const conveyor = useConveyor()
  return (
    <motion.div
      className="flex h-9 flex-none items-center gap-2"
      {...(swap
        ? { variants: conveyor, initial: 'initial', animate: 'animate', exit: 'exit' }
        : {})}
    >
      {TEMPLATE_CATEGORIES.map((chip) => {
        const active = value === chip.id
        return (
          <button
            key={chip.id}
            onClick={() => onChange(chip.id)}
            className={`h-9 flex-none whitespace-nowrap rounded-full px-[18px] text-[13px] font-semibold leading-none transition-colors duration-[var(--dur-fast)] ease-std ${
              active
                ? 'bg-[var(--gray-75)] text-[var(--gray-950)]'
                : 'border border-[var(--white-200)] text-white hover:bg-[var(--white-100)]'
            }`}
          >
            {/* verbatim from the board, capitalisation included — see data/templates.ts */}
            {chip.label}
          </button>
        )
      })}
    </motion.div>
  )
}

/** The dock's instance, wired to the ui store's filter — and on the conveyor. */
function FilterChips() {
  const { templateFilter, setTemplateFilter } = useUI()
  return <CategoryChips value={templateFilter} onChange={setTemplateFilter} swap />
}

/* -------------------------------------------------------------------- cards */

/**
 * The real project card (`Website` 28364:40628): thumbnail on top, a 56px meta bar
 * with the name, the relative time and the kebab.
 *
 * The thumbnail frame is `flex: 1` in Figma, so its 216 is what is left of the 272
 * card after the meta bar — which means the card survives a shorter dock by giving
 * the picture height rather than clipping the name. No hover state is drawn anywhere
 * on this page (spec §11), so the card takes the quietest one that still answers the
 * pointer: a hairline on the thumbnail.
 */
function ProjectCard({ project }: { project: HomeProject }) {
  const { t } = useT()
  const { openBuilder } = useUI()
  const { world, set, preset } = useWorld()

  /* Opening a card means standing in that site — so the project axis has to say
     `built`, otherwise the builder opens on an empty canvas for a customer who is
     looking straight at their finished site. */
  function open() {
    if (world.project !== 'built') set({ project: 'built' }, preset)
    openBuilder()
  }

  return (
    <div className="home-card group relative flex flex-col">
      {/* `home-thumb` carries the drawn 238.667 / 216 ratio instead of a bare
          `flex-1`, so the picture keeps its proportion wherever the card has the
          height for it; inside the dock's fixed band it shrinks back to 216.
          Hover duration via `--card-hover-dur` — see TemplateCard. */}
      <div className="home-thumb relative w-full overflow-hidden rounded-[12px] ring-[var(--white-200)] transition-shadow duration-[var(--card-hover-dur,var(--dur-fast))] ease-std group-hover:ring-1">
        <Thumb id={project.thumb} className="absolute inset-0" />
      </div>

      <div className="flex h-14 w-full flex-none items-center justify-between">
        <div className="flex min-w-0 flex-col gap-[5px] pb-px pl-1 pt-3">
          <p className="truncate font-display text-[18px] font-medium leading-[1.2] text-white">{project.name}</p>
          <p className="truncate text-[12px] leading-[1.4] text-[var(--white-480)]">{t(project.updatedLabel)}</p>
        </div>
        {/* 40 × 40, radius 10, 24px icon box with a 20px leaf. What the menu holds is
            not drawn anywhere (spec §12.15), so it stays a button with no menu. */}
        <button
          aria-label={t({ en: 'Project options', uk: 'Дії з проєктом' })}
          className="relative z-10 grid h-10 w-10 flex-none place-items-center rounded-[10px] text-[var(--white-480)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white"
        >
          <IconMoreVertical size={20} />
        </button>
      </div>

      {/* The card is the click target. A stretched button keeps the kebab a real
          button instead of nesting one button inside another. */}
      <button
        onClick={open}
        aria-label={t({ en: `Open ${project.name}`, uk: `Відкрити ${project.name}` })}
        className="absolute inset-0 rounded-[16px]"
      />
    </div>
  )
}

/**
 * An empty slot (`Website` 28364:40657 and siblings): structurally the real card with
 * every child at `opacity: 0` plus a dashed rim, which renders as an empty dashed box.
 *
 * Whether the five slots mean "you may have six sites" or are simply filler, and
 * whether they should start a new site when clicked, is not drawn (spec §12.16) — so
 * they stay inert rather than inventing an interaction.
 *
 * The rim is an SVG rect, not `border: 1px dashed`: Figma does not expose its dash
 * values, the measured pattern is ≈6/6, and the browser's own dashed border is nearer
 * 3/3 and cannot be told otherwise. The box is inset half a pixel so a 1px stroke
 * centred on it covers exactly the card's edge, and rx follows the 16px radius.
 */
function EmptySlot() {
  return (
    <div className="home-card relative" aria-hidden>
      <svg
        className="absolute left-0 top-0 overflow-visible"
        style={{ width: 'calc(100% - 1px)', height: 'calc(100% - 1px)' }}
      >
        <rect
          x="0.5" y="0.5" width="100%" height="100%" rx="15.5"
          fill="none" stroke="#ffffff1f" strokeWidth="1" strokeDasharray="6 6"
        />
      </svg>
    </div>
  )
}

/**
 * A template card (28375:43585 and siblings; the picker's 18 at 28626:592+ are
 * the same component, only narrower) — name 16px, description under it. One
 * card, two homes: the dock seeds the builder from it, the template picker
 * attaches it to the prompt instead, so the click action can come from the
 * caller. The picker's ghost kebab (`opacity: 0` on all 18 cards) is simply
 * not rendered — hidden as drawn, same as here.
 */
export function TemplateCard({
  template,
  className = 'home-card',
  thumbClassName = 'home-thumb home-thumb--template',
  onPick, pickLabel, dataKey, onAdd, addLabel, instant,
}: {
  template: Template
  /** Wrapper sizing. The dock's flex row sizes cards itself (`home-card`);
   *  the picker's grid column owns the width and the card takes its height
   *  from the thumbnail's ratio, so it grows proportionally. */
  className?: string
  /** The thumbnail's drawn ratio — 238.667/218 in the dock, 233.333/218 in the
   *  picker (`tplpick-thumb`). Both land on the drawn 272 card at the drawn
   *  width; see the note beside them in index.css. */
  thumbClassName?: string
  /** Overrides the default click — the picker opens its detail view instead
   *  of building. */
  onPick?: () => void
  /** Accessible name for the overriding action. */
  pickLabel?: string
  /** Rendered as `data-tpl-card` on the card root. The picker's detail view
   *  finds the clicked card by it — to fly the preview out of the thumbnail's
   *  measured rect, and back into its CURRENT rect on the way out. */
  dataKey?: number
  /**
   * THE BLUE `+`, drawn 26.08.2026 on ONE of the picker's eighteen cards —
   * `28637:42070` on the rest board, `28734:66455` on the scrolled one — in the
   * exact slot where the other seventeen park their transparent kebab, and with
   * that card's kebab switched OFF. One card of eighteen, in the state slot,
   * carrying the detail view's own glyph and the kit's Filled/Blue/Small icon
   * button: this file's idiom for "this is the hovered card". So it ships as the
   * card's hover affordance, and it does what a blue filled `+` on a template
   * says — attaches that template, the same action as `Choose a template` one
   * step earlier. Flagged to the designer (§14.6): the boards label no state and
   * say nothing about what it does.
   *
   * Passed only by the picker; the dock's cards are drawn without it.
   */
  onAdd?: () => void
  /** Accessible name for the `+`. */
  addLabel?: string
  /**
   * Reveal the `+` and its plate with no time at all — the same call the
   * thumbnail's hover ring makes through `--card-hover-dur`, and for the same
   * reason: a surface that ARRIVES under a parked cursor leaves one card hovered
   * a frame after it mounts, and a spring firing there announces itself on top
   * of the sheet's own entrance. Passed by the picker while its sheet is still
   * springing; unset everywhere else, so a settled picker and the dock both get
   * the drawn motion.
   */
  instant?: boolean
}) {
  const { t } = useT()
  const { openBuilder } = useUI()
  const reduce = useReducedMotion()

  /*
   * The hover affordance's own state, and it is REACT state rather than CSS
   * `:hover` because what it drives is a spring (motion.ts, `cardAdd`). One
   * pointer event per card, never a frame; and the two sources are kept apart so
   * that tabbing out of a card the pointer is still over does not hide the
   * button. Only wired when there IS a `+` — the dock's cards must not re-render
   * on hover for nothing.
   */
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const hot = hovered || focused
  const hover = onAdd
    ? {
        /* A tap on a touch screen fires pointerenter too, and there it would
           park the button on the card until the next tap elsewhere. Hover is a
           pointer affordance; touch gets the card's own action. */
        onPointerEnter: (e: React.PointerEvent) => { if (e.pointerType !== 'touch') setHovered(true) },
        onPointerLeave: () => setHovered(false),
        /* focusin/focusout, i.e. focus-WITHIN: reaching the card by keyboard
           shows the `+` before you reach the `+` itself. The `contains` guard is
           what stops the one-frame blink as focus moves from the card's own
           button to the `+` — focusout fires before focusin. */
        onFocus: () => setFocused(true),
        onBlur: (e: React.FocusEvent) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
        },
      }
    : null
  const add = reduce ? cardAddFade : cardAdd
  const timed = (target: TargetAndTransition) => (instant ? { ...target, transition: NO_TIME } : target)

  /*
   * What picking a template actually does is not drawn anywhere — there is no
   * preview, no confirm and no "customise" step on any board. Until there is, it
   * does the one thing the page can honestly do: hands the builder a first message
   * naming the template and lets the generation run, exactly as a typed prompt does.
   */
  function open() {
    startBuild(`Start a new site from the “${template.name}” template`)
    openBuilder()
  }

  return (
    <div className={`${className} group relative flex flex-col`} data-tpl-card={dataKey} {...hover}>
      {/* radius 8 here against the project card's 12 — as drawn on the two boards,
          flagged as probably accidental (spec §12.12)

          ⚠️ The hover ring's DURATION is a variable, not a constant, and that is
          the whole of the fix for a flicker QA caught: a surface that arrives
          under a parked cursor makes one card hovered a frame after it mounts,
          so its ring animated in — measured from `box-shadow: transparent 0px`
          at t=0 to the full hairline at ~100ms, all of it while the sheet was
          still springing. It read as the grid glitching on arrival. The card is
          the dock's signed-off component, so nothing about the ring itself moves
          — only who decides how long it takes: an owner that is still animating
          sets `--card-hover-dur: 0s`, and the ring is simply THERE when the
          sheet lands (which is honest — the pointer is over that card) instead
          of announcing itself. Unset everywhere else, so the dock and a settled
          picker both keep the drawn `--dur-fast` fade. */}
      <div className={`${thumbClassName} relative w-full overflow-hidden rounded-[8px] ring-[var(--white-200)] transition-shadow duration-[var(--card-hover-dur,var(--dur-fast))] ease-std group-hover:ring-1 group-focus-within:ring-1`}>
        <Thumb id={template.id} className="absolute inset-0" />
      </div>

      {/* THE CAPTION'S BOX NEVER MOVES — not at rest, not on hover.
          The board's hovered card measures its `Text` frame at 185.333, i.e.
          48 narrower, but that is Figma's auto-layout reacting to the button
          being inserted beside it, not a second layout to reproduce: copying it
          would jump a long name's ellipsis 48px left the instant the pointer
          arrives. The room the button needs is taken by the PLATE below, which
          fades the caption out as it reaches the button instead of re-cutting
          it. */}
      <div className="relative flex h-[54px] w-full flex-none flex-col gap-[5px] pb-px pl-1 pt-3">
        {/* verbatim from the board; the captions do not describe their own
            screenshots and two of the six repeat — see data/templates.ts */}
        <p className="truncate font-display text-[16px] font-medium leading-[1.2] text-white">{template.name}</p>
        <p className="truncate text-[12px] leading-[1.4] text-[var(--white-480)]">{template.description}</p>

        {onAdd && (
          <>
            {/* The plate — `Rectangle 1162905197` 28740:66863, the gradient that
                "looks like a shadow and stops the text running ugly into the
                button" (the designer, 26.08.2026). Geometry, the ground-colour
                rule and the two departures from the drawn rect are in
                `.home-card-scrim` in index.css. Below the button, above the
                caption, and deaf to the pointer, so hovering it still means
                hovering the card. */}
            <motion.span
              aria-hidden
              data-card-scrim
              className="home-card-scrim"
              initial={false}
              animate={timed(hot ? cardAddScrim.on : cardAddScrim.off)}
            />

            {/* 32 × 32, radius 10, Background/Blue/Default #1587ff (the export's
                #0073ec is the light-theme trap), 24-box white glyph on 4px of
                padding, flush with the card's right edge at meta-local y 16 —
                all drawn. `z-10` puts it over the card's own stretched button,
                the same way the project card's kebab sits over it, and it stays
                in the DOM at rest so the Tab order does not depend on what the
                pointer is doing. Colours on hover/press are the house convention
                for a filled blue button (PublishPanel, DomainModal, the detail
                bar's own pill) — the kit's variant here is State=Enabled and the
                boards draw no others. NOT the Liquid Glass wash and ripple:
                those belong to glass, and this is a solid CTA. */}
            <motion.button
              data-card-add
              onClick={onAdd}
              aria-label={addLabel}
              initial={false}
              animate={timed(hot ? add.on : add.off)}
              /* Deaf to the pointer while it is not on offer — an invisible
                 button in the corner of a card must not take a tap (it can
                 still be reached and pressed by keyboard, which is the point of
                 keeping it mounted). */
              className={`absolute right-0 top-4 z-10 grid h-8 w-8 place-items-center overflow-hidden rounded-[10px] bg-[var(--action)] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)] active:bg-[var(--action-pressed)] ${hot ? '' : 'pointer-events-none'}`}
            >
              <IconPlus size={24} />
            </motion.button>
          </>
        )}
      </div>

      <button
        onClick={onPick ?? open}
        aria-label={pickLabel ?? t({ en: `Start from ${template.name}`, uk: `Почати з ${template.name}` })}
        className="absolute inset-0 rounded-[16px]"
      />
    </div>
  )
}

/* --------------------------------------------------------------------- dock */

export function HomeDock() {
  const { t } = useT()
  const { world } = useWorld()
  const { dockTab, templateFilter } = useUI()
  const conveyor = useConveyor()

  const owned = hasProjects(world)
  /* No projects means no tabs to pick from — templates are all there is. */
  const showTemplates = !owned || dockTab === 'templates'
  const templates = showTemplates ? templatesIn(templateFilter) : TEMPLATES

  return (
    <section
      /*
       * Full-bleed, 32px side insets, 24px of slack below the cards, and a title
       * row whose height is the ONE thing the two boards disagree about: 80 with
       * the tabs (28364:40053, dock 376) and 88 with the `Templates` heading
       * (28375:43006, dock 384, hero 804). Carrying both means the heading and
       * the filter chips land on their drawn y instead of 4px low — and because
       * the extra 8px comes out of the hero, the card row still starts at 900 in
       * both states, exactly as the boards draw it.
       *
       * It may be squeezed on a short viewport, and when it is the cards give up
       * picture height instead of the page growing a scrollbar.
       */
      /* `he-dock`: the Home entrance's hook — the whole dock rises as ONE block
         on the composer beat (index.css, HOME ENTRANCE). The production page
         has no dock at all, so this is ours: same fade/rise as the chips, kept
         subtle. Inert until the page root carries `data-home-entrance`. */
      className={`he-dock flex flex-none flex-col px-8 pb-6 ${owned ? 'min-h-[236px]' : 'min-h-[244px]'}`}
      style={{ flex: owned ? '0 1 376px' : '0 1 384px' }}
    >
      {/* title row 1592 × 80 (tabs) / × 88 (heading) */}
      <div
        className={`flex flex-none items-center justify-between gap-6 pr-2 ${owned ? 'h-20' : 'h-[88px]'}`}
      >
        {owned ? (
          <DockTabs />
        ) : (
          /* Gilroy SemiBold 32, cap-trimmed, a literal #ffffff in Figma */
          <h2 className="flex-none font-display text-[32px] font-semibold leading-none text-white">
            {t({ en: 'Templates', uk: 'Шаблони' })}
          </h2>
        )}
        {/* The chips are the title row's half of the same conveyor — they
            arrive and leave with the shelf, on the same beat, so the switch is
            ONE gesture and not a control plus two unrelated fades. */}
        <AnimatePresence mode="wait" initial={false}>
          {showTemplates && <FilterChips key="chips" />}
        </AnimatePresence>
      </div>

      {/*
       * The card row. Cards are `flex: 1` and stop shrinking at 200px, so on a
       * narrow window the row scrolls sideways rather than grinding the cards down
       * past readable — through ScrollArea, because native scrollbars are off
       * app-wide and a bar that steals a row of layout is exactly what this
       * component exists to avoid.
       */}
      {/*
       * THE SHELF ACKNOWLEDGES THE SWITCH. The house conveyor (`listSwapBehind`
       * = `listSwap` plus the 60ms beat, ui/motion.ts), the same one the domains
       * surface uses when its lists change hands under a header that stays: the
       * old shelf leaves UPWARD, the new one rises from just below, so the eye
       * reads "this was replaced by that" instead of "the picture changed".
       * `mode="wait"` keeps twelve cards from overlapping mid-flight.
       *
       * The wrapper is OUTSIDE the ScrollArea on purpose: nothing about the
       * scroller, its flex row or the cards' `flex: 1 0 0` sizing is touched,
       * and each shelf gets a fresh scroll position and a fresh ResizeObserver
       * instead of inheriting the other's.
       *
       * `initial={false}`: the first shelf must NOT animate in — the Home
       * entrance already raises the whole dock as one block (`he-dock`), and a
       * second entrance on top of it would double-animate the row.
       */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={showTemplates ? 'templates' : 'projects'}
          variants={conveyor}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex min-h-0 flex-1 flex-col"
        >
          <ScrollArea axis="x" className="min-h-0 flex-1" innerClassName="flex items-stretch gap-8">
            {showTemplates ? (
              templates.length ? (
                templates.map((tpl) => <TemplateCard key={tpl.id} template={tpl} />)
              ) : (
                /* Not drawn on any board: no card carries a category, so the chips
                   cannot really filter (spec §12.13) and the designer has never had to
                   decide what an empty result looks like. One honest line until he does. */
                <p className="self-center text-[14px] text-[var(--white-400)]">
                  {t({ en: 'No templates in this category yet.', uk: 'У цій категорії ще немає шаблонів.' })}
                </p>
              )
            ) : (
              <>
                {world.projects.slice(0, SLOTS).map((p) => <ProjectCard key={p.id} project={p} />)}
                {Array.from({ length: Math.max(0, SLOTS - world.projects.length) }, (_, i) => (
                  <EmptySlot key={`slot-${i}`} />
                ))}
              </>
            )}
          </ScrollArea>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
