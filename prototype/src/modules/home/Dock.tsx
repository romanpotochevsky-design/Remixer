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
import { hasProjects, useWorld, type HomeProject } from '@/state/world'
import { useUI } from '@/state/ui'
import { useT } from '@/i18n'
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

/** `Tabs (Small)` 28364:42996 — track 211 × 44, 4% white fill, 32% white rim. */
function DockTabs() {
  const { t } = useT()
  const { dockTab, setDockTab } = useUI()

  /* Widths are per POSITION (101 / 92), as drawn: they come from the two labels,
     not from which one is selected. Only the fill and the label colour move.
     ⚠️ The inactive tab's radius is 8 while the active pill is a full 999 — as
     drawn, flagged to the designer as probably accidental (spec §12.10). With no
     fill on the inactive tab it is invisible either way, so it costs nothing to
     keep the file honest. */
  const tabs = [
    { id: 'projects' as const, label: { en: 'My projects', uk: 'Мої проєкти' }, width: 101 },
    { id: 'templates' as const, label: { en: 'Templates', uk: 'Шаблони' }, width: 92 },
  ]

  return (
    /* 211 × 44: 6px of padding, 101 + 6 + 92 of tabs. The 1px rim comes out of the
       padding rather than adding to the track, the same reason as the composer's. */
    <div className="flex h-11 w-[211px] flex-none items-center gap-1.5 rounded-full border border-[#ffffff52] bg-[var(--white-050)] p-[5px]">
      {tabs.map((tab) => {
        const active = dockTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setDockTab(tab.id)}
            style={{ width: tab.width }}
            className={`h-8 text-[14px] leading-none transition-colors duration-[var(--dur-fast)] ease-std ${
              active
                ? 'rounded-full bg-white font-semibold text-[var(--gray-950)]'
                : 'rounded-[8px] font-medium text-[var(--white-480)] hover:text-white'
            }`}
          >
            {t(tab.label)}
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
      className={`flex flex-none flex-col px-8 pb-6 ${owned ? 'min-h-[236px]' : 'min-h-[244px]'}`}
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
        {showTemplates && <FilterChips />}
      </div>

      {/*
       * The card row. Cards are `flex: 1` and stop shrinking at 200px, so on a
       * narrow window the row scrolls sideways rather than grinding the cards down
       * past readable — through ScrollArea, because native scrollbars are off
       * app-wide and a bar that steals a row of layout is exactly what this
       * component exists to avoid.
       */}
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
    </section>
  )
}
