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
 * PERFORMANCE. The hero as drawn is two 4000px ellipses under a real Gaussian blur.
 * This project has already measured what that costs (4fps with the preview glow on,
 * 60 with it off), so the whole backdrop is static paint — radial gradients, one
 * linear plate, a tiled mask, four stroked rings. Nothing here animates, nothing
 * repaints per frame, and the only `backdrop-filter` on the page is the topbar's and
 * the composer's, both of which Figma draws.
 */
import { useRef, useState } from 'react'
import { useWorld } from '@/state/world'
import { useUI } from '@/state/ui'
import { useT } from '@/i18n'
import { startBuild } from '@/modules/chat/send'
import { ScrollArea } from '@/ui/ScrollArea'
import { ScenarioPanel } from '@/devtools/ScenarioPanel'
import { FlowRunner } from '@/devtools/FlowPlayer'
import { LogoRemixer, IconPlus, IconMic, IconEnter, IconChevronRight } from '@/ui/icons'
import { HomeDock } from './Dock'

/* ------------------------------------------------------------------ backdrop */

/**
 * `Circles` 28364:40178 — the five ring radii, largest first so the smallest paints
 * last. Exact values from `get_metadata` (widths / 2). All five share one centre:
 * the logo mark's, hero (820, 208.25). See HeroBackdrop for the proof.
 */
const RING_RADII = [830.252, 652.763, 400, 350.282, 118.209]

/**
 * The three painted layers over the hero's colour field.
 *
 * Three of the board's six hero layers; the two glows and the ground are painted by
 * the panel itself (`.home-hero` in index.css).
 *
 * Figma stacks them dots → rings → magenta → blue → shadow, i.e. the texture and the
 * rings sit UNDER the glows and under the plate. Taken literally that hides both: the
 * glows are ~90% opaque along the bottom, and the plate is fully opaque at its top, so
 * the dots survive only in the band above y=272 — which is the opposite of the board,
 * where the lattice runs the full height. Figma is compositing those layers with a
 * blend the MCP does not expose, so the order here is the RENDERED one: field, rings,
 * plate, then the lattice on top of everything.
 */
function HeroBackdrop() {
  return (
    <>
      {/*
       * `Circles` 28364:40178 — five 1px circles, and they are CONCENTRIC: every one
       * of them shares the logo mark's centre, hero (820, 208.25). On the board they
       * read as a target centred on the mark.
       *
       * ⚠️ The per-ellipse centres in spec §4.4 are WRONG and produced a set of
       * off-centre sweeps with no ring around the mark at all. `get_metadata` reports
       * one usable coordinate per ellipse and garbage for the other; the proof is the
       * parent frame's own bounding box, which is 1660.504 square at hero
       * (−10.25, −622) — i.e. EXACTLY the bounding box of a d=1660.504 circle centred
       * on (820, 208.25). A frame's bbox is the union of its children, and the union
       * can only equal the largest circle's own bbox if every other circle sits inside
       * it sharing that centre. Radii (exact, from get_metadata widths): 830.252,
       * 652.763, 400.000, 350.282, 118.209.
       *
       * The centre tracks the mark: 50% horizontally (the logo is centred in a centred
       * column) and `--home-rings-y` vertically, which the height breakpoints move with
       * the logo.
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

      {/* `Shadow` 28364:40187 — the plate behind the headline. Dark at its TOP: an
          isolated render of the layer says so, the code export says the opposite,
          and only one of the two leaves the board without a hard line (index.css). */}
      <div className="home-hero-shadow pointer-events-none" aria-hidden />

      {/* The dotted texture (`Union` 28364:40177), painted LAST — above the plate.
          Under it (Figma's own z-order) the plate's opaque top wiped the lattice out
          from y=272 down, so the texture ended on a straight line under the logo and
          read as strongest exactly where the board's is quietest. One uniform
          low-alpha white lattice over the whole panel instead: no mask, no edge, and
          the local contrast decides where it reads (see index.css). */}
      <div className="home-hero-dots pointer-events-none" aria-hidden />

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
      className="absolute left-0 right-0 top-0 z-20 flex h-[72px] items-center justify-between pl-6 pr-5 backdrop-blur-[16px]"
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

function Composer() {
  const { t } = useT()
  const { openBuilder } = useUI()
  const [draft, setDraft] = useState('')
  const field = useRef<HTMLInputElement>(null)
  const chipRow = useRef<HTMLDivElement | null>(null)
  const armed = draft.trim().length > 0

  /*
   * The whole point of the page: the typed prompt becomes the builder's first
   * message and the builder opens already working. `startBuild` reuses the chat's
   * own send machinery (transcript, credits, the 2.6s canned answer) rather than
   * restaging any of it here — the shell must not be able to tell which composer a
   * message came from. No send flash: the page is gone by the next frame, so there
   * is nothing left for the light to run around.
   */
  function build() {
    if (!armed) return
    startBuild(draft)
    openBuilder()
  }

  return (
    <>
      {/* ------------------------------------------- the field (28364:40219) */}
      <div
        className="relative w-[960px] max-w-full flex-none rounded-[32px] bg-[var(--black-900)] backdrop-blur-[16px]"
        /* Figma's padding is 17/16/16/0 on a 138-tall box whose 1px stroke sits
           INSIDE the geometry. A CSS `border` does not: it eats a pixel of the
           content box, which put the text row, the `+` button and the caret 1px
           right of the drawn x and made the two inner rows 943 instead of 944.
           So the rim is an INSET shadow — no layout, follows the 32px radius, one
           static paint — and the padding is Figma's, unmodified. Same reason the
           shell's glass rims are drawn rather than bordered (CLAUDE.md). */
        style={{
          boxShadow: '0 16px 80px 0 rgba(0, 0, 0, 0.08), inset 0 0 0 1px var(--white-100)',
          padding: '17px 16px 16px 0',
        }}
      >
        {/* text row 944 × 52, pl 24 / pr 8. The row is 52 because Figma's
            placeholder carries a second, EMPTY paragraph (2 × 26); the empty line
            is not reproduced, but the space it occupies is — drop it and the whole
            composer shrinks 26px away from where the board draws it. */}
        <div className="flex h-[52px] items-start pl-6 pr-2">
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
        <div className="mt-[17px] flex h-9 items-center justify-between pl-4">
          <button
            aria-label={t({ en: 'Attach', uk: 'Прикріпити' })}
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--white-100)] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
          >
            <IconPlus size={24} />
          </button>

          <div className="flex items-center gap-4">
            <button
              aria-label={t({ en: 'Voice input', uk: 'Голосове введення' })}
              className="grid h-9 w-9 place-items-center rounded-full border border-[var(--white-100)] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
            >
              {/* 24px icon box, 20px leaf — the two are NOT the same in Figma */}
              <span className="grid h-6 w-6 place-items-center"><IconMic size={20} /></span>
            </button>

            {/*
             * Build — 86 × 36, radius 12, label 14 Proxima Semibold + the ⏎ glyph.
             *
             * ⚠️ The enabled state is a near-white #fafafa pill with a #09090b
             * label, NOT action blue. That is a deliberate departure from this
             * project's verified brand rule ("#1587FF = action", CLAUDE.md): the
             * board draws all three states as hidden sibling frames (28364:40238
             * enabled, 40242 disabled, 40246 hover/pressed) and is explicit about
             * it, and the same white-on-dark treatment carries the active tab in
             * the dock. Raised with the designer as spec §12.4 and accepted.
             */}
            <button
              onClick={build}
              disabled={!armed}
              className={`flex h-9 w-[86px] items-center justify-center gap-1.5 rounded-[12px] pl-[18px] pr-1.5 text-[14px] font-semibold leading-none transition-colors duration-[var(--dur-fast)] ease-std ${
                armed
                  ? 'bg-[var(--gray-50)] text-[var(--gray-950)] hover:bg-[var(--gray-850)] hover:text-[var(--gray-600)]'
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
      <div className="flex h-[42px] w-[960px] max-w-full flex-none items-center">
        <ScrollArea
          axis="x"
          className="home-chip-scroller h-[42px] min-w-0 flex-1"
          innerClassName="flex items-center gap-2"
          viewportRef={chipRow}
        >
          {PROMPT_CHIPS.map((label, i) => (
            <button
              // duplicates in the drawn list, so the index is the only honest key
              key={`${label}-${i}`}
              onClick={() => { setDraft(label); field.current?.focus() }}
              /* Label is `White/900` = 80% white, written out rather than taken
                 from `--white-700`, which is 85% (spec §9 flags it as a near miss
                 and the chip label is the place it shows). */
              className="h-10 flex-none whitespace-nowrap rounded-full border border-[#ffffff3d] bg-[var(--black-200)] px-5 text-[14px] text-[#ffffffcc] transition-colors duration-[var(--dur-fast)] ease-std hover:text-white"
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
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--white-200)] bg-[var(--black-300)] pl-[2px] text-white backdrop-blur-[10px] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
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

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--gray-950)] text-[var(--white-900)]">
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
          <HeroBackdrop />
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

            {/* logo 96 × 96, horizontally centred (28364:40192) */}
            <div className="flex-none" style={{ height: 'var(--home-logo)', width: 'var(--home-logo)' }}>
              <LogoRemixer size={96} className="h-full w-full" />
            </div>

            <div className="flex-none" style={{ height: 'var(--home-gap-logo)' }} aria-hidden />

            {/* Headline 28364:40207 — TWO text nodes 8px apart, not one string with a
                space: the drawn gap is tighter than the font's own word space. */}
            <h1
              className="flex flex-none flex-wrap items-start justify-center gap-2 whitespace-nowrap text-center font-display font-semibold leading-[1.2] text-white"
              style={{ fontSize: 'var(--home-h1)' }}
            >
              <span>{t({ en: 'Describe it.', uk: 'Опишіть.' })}</span>
              <span>{t({ en: 'Remixer builds it.', uk: 'Remixer збудує.' })}</span>
            </h1>

            <div className="h-[11px] flex-none" aria-hidden />

            {/* Proxima Nova Regular 20/1.4 at White/800 — 72% white, written out
                rather than taken from `--white-500`, which is 70% (spec §9). */}
            <p className="flex-none text-center text-[20px] leading-[1.4] text-[#ffffffb8]">
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

      {/* Tooling, mounted per page: the console is how the designer switches the
          dock between "no projects yet" and "one site" without touching code. */}
      <FlowRunner />
      <ScenarioPanel />
    </div>
  )
}
