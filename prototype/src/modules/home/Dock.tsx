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
import { AnimatePresence, motion } from 'motion/react'
import { hasProjects, useWorld, type HomeProject } from '@/state/world'
import { useUI, type DockTab } from '@/state/ui'
import { useT, type Text } from '@/i18n'
import { listSwapBehind, segmentedPill } from '@/ui/motion'
import {
  TEMPLATES, TEMPLATE_CATEGORIES, templatesIn,
  type Template, type TemplateCategoryId,
} from '@/data/templates'
import { startBuild } from '@/modules/chat/send'
import { ScrollArea } from '@/ui/ScrollArea'
import { IconMoreVertical } from '@/ui/icons'
import { Thumb } from './thumbs'

/** How many slots the shelf shows. Six is what the canonical board draws. */
const SLOTS = 6

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
const SEATS: { id: DockTab; label: Text; w: number }[] = [
  { id: 'projects', label: { en: 'My projects', uk: 'Мої проєкти' }, w: 101 },
  { id: 'templates', label: { en: 'Templates', uk: 'Шаблони' }, w: 92 },
]
/** Left / right edge of seat i in the track's padding-box coordinates. */
const seatL = (i: number) => SEAT_PAD + SEATS.slice(0, i).reduce((s, t) => s + t.w + SEAT_GAP, 0)
const seatR = (i: number) => seatL(i) + SEATS[i].w
/** The travelling pill's own width: the NARROWEST seat (see the capsule below). */
const CAP_W = Math.min(...SEATS.map((s) => s.w))

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
 * So the pill is two identical 92-wide capsules, one pinned to the active
 * seat's LEFT edge and one to its RIGHT edge, each animating `x` and nothing
 * else. The union of two equal-height capsules is always a capsule, so the
 * ends stay exactly round at every width in between; both bodies are opaque
 * white, so the seam inside the union does not exist. Nothing scales, nothing
 * repaints, and at rest the two coincide (on `Templates`, both seats being 92
 * apart) or overlap by 83px (on `My projects`) into the drawn 101.
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
          className="absolute top-[6px] h-8 w-[92px] rounded-full bg-white"
          style={{ left: end ? seatR(0) - CAP_W : seatL(0) }}
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
             * The fade is deliberately late (see `.home-tab-ink`): the pill is
             * halfway across in ~60ms, so ink that changed on the click would
             * leave dark text sitting on the dark track for a few frames.
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
  value, onChange,
}: {
  value: TemplateCategoryId
  onChange: (id: TemplateCategoryId) => void
}) {
  return (
    <div className="flex h-9 flex-none items-center gap-2">
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
    </div>
  )
}

/** The dock's instance, wired to the ui store's filter. */
function FilterChips() {
  const { templateFilter, setTemplateFilter } = useUI()
  return <CategoryChips value={templateFilter} onChange={setTemplateFilter} />
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
  onPick, pickLabel, dataKey,
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
}) {
  const { t } = useT()
  const { openBuilder } = useUI()

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
    <div className={`${className} group relative flex flex-col`} data-tpl-card={dataKey}>
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
      <div className={`${thumbClassName} relative w-full overflow-hidden rounded-[8px] ring-[var(--white-200)] transition-shadow duration-[var(--card-hover-dur,var(--dur-fast))] ease-std group-hover:ring-1`}>
        <Thumb id={template.id} className="absolute inset-0" />
      </div>

      <div className="flex h-[54px] w-full flex-none flex-col gap-[5px] pb-px pl-1 pt-3">
        {/* verbatim from the board; the captions do not describe their own
            screenshots and two of the six repeat — see data/templates.ts */}
        <p className="truncate font-display text-[16px] font-medium leading-[1.2] text-white">{template.name}</p>
        <p className="truncate text-[12px] leading-[1.4] text-[var(--white-480)]">{template.description}</p>
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
          {showTemplates && (
            <motion.div
              key="chips"
              variants={listSwapBehind}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-none"
            >
              <FilterChips />
            </motion.div>
          )}
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
          variants={listSwapBehind}
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
