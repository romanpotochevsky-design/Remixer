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
 * The only `backdrop-filter` on the page is the topbar's and the composer's,
 * both of which Figma draws.
 *
 * ⚠️ BACKGROUND & ENTRANCE SOURCE OF TRUTH (26.08.2026): the production screen
 * recording, per the designer — the board stays the truth for layout, type,
 * composer, chips and cards. Measured analysis: scratchpad/qa7/
 * production-analysis.md; the board-matched paint this replaced is in git
 * history (07093ac).
 */
import { useEffect, useRef, useState } from 'react'
import type { AnimationEvent } from 'react'
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
import { Thumb } from './thumbs'

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

/**
 * The attached-template chip — what stands in the "Add template" pill's place
 * once a template is picked. ⚠️ OUR proposal, pending the designer: NO board
 * draws the composer after a pick (spec §7.4, README §7 — the recorded idea is
 * exactly this chip; its Build→"Remix" half is NOT implemented, the boards draw
 * `Build` and only `Build`). Same 36px glass pill; the pill's hidden 24px
 * leading-icon slot at (6, 6) is reused for a live mini-thumbnail.
 */
function AttachedChip({ index }: { index: number }) {
  const { t } = useT()
  const { openTemplatePicker, detachTemplate } = useUI()
  const tpl = TEMPLATE_LIBRARY[index]
  if (!tpl) return null
  return (
    <div
      /* the picker's grow-from-trigger origin: with the pill replaced, the
         chip is the trigger — same attribute, same spot */
      data-template-trigger
      className="liquid-glass liquid-glass--bright flex h-9 flex-none items-center rounded-full pl-1.5 pr-1"
    >
      {/* the body re-opens the picker: picking again replaces the attachment */}
      <button
        onClick={openTemplatePicker}
        aria-label={t({ en: `Change template — ${tpl.name}`, uk: `Змінити шаблон — ${tpl.name}` })}
        className="flex min-w-0 items-center gap-2"
      >
        <span className="relative h-6 w-6 flex-none overflow-hidden rounded-[6px]">
          <Thumb id={tpl.id} className="absolute inset-0" />
        </span>
        <span className="max-w-[18ch] truncate text-[14px] leading-none text-[#ffffffcc]">
          {tpl.name}
        </span>
      </button>
      <button
        onClick={detachTemplate}
        aria-label={t({ en: 'Remove template', uk: 'Прибрати шаблон' })}
        className="ml-1 grid h-6 w-6 flex-none place-items-center rounded-full text-[#ffffff8f] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white"
      >
        <IconClose size={8} />
      </button>
    </div>
  )
}

function Composer() {
  const { t } = useT()
  const { openBuilder, openTemplatePicker } = useUI()
  const attachedIndex = useUI((s) => s.attachedTemplate)
  const [draft, setDraft] = useState('')
  const field = useRef<HTMLInputElement>(null)
  const chipRow = useRef<HTMLDivElement | null>(null)

  const attached = attachedIndex != null ? TEMPLATE_LIBRARY[attachedIndex] : null
  /* A template alone arms Build too — a lit chip beside a dead button would
     read as broken. Undrawn either way (our call, same standing as the chip). */
  const armed = draft.trim().length > 0 || attached != null

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
        className="he-composer relative w-[960px] max-w-full flex-none rounded-[32px] bg-[var(--black-900)] backdrop-blur-[16px]"
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
          {/*
           * `Left` 28616:58687 — the "+" and the template pill, gap 8. The
           * 25.08.2026 restyle of board 28364:40053 moves all three round
           * controls from ghost (no fill, 8% rim) to the builder-composer
           * glass — Black/700 + blur 16 + the 24% rim (.liquid-glass--bright);
           * the two composers now match, as CLAUDE.md always said they should.
           */}
          <div className="flex min-w-0 items-center gap-2">
            <button
              aria-label={t({ en: 'Attach', uk: 'Прикріпити' })}
              className="liquid-glass liquid-glass--bright grid h-9 w-9 flex-none place-items-center rounded-full text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#09090bcc]"
            >
              <IconPlus size={24} />
            </button>

            {attachedIndex != null ? (
              <AttachedChip index={attachedIndex} />
            ) : (
              /* "Add template" 28616:58682 — 123×36 r999 glass; label Proxima
                 Nova REGULAR 14 at 80% white (not the Semibold the chips and
                 Build wear). Width is the label's own (20px side padding), so
                 the UK string fits without clipping; EN lands on the drawn 123
                 to within the stand-in font's tolerance. */
              <button
                data-template-trigger
                onClick={openTemplatePicker}
                className="liquid-glass liquid-glass--bright flex h-9 flex-none items-center whitespace-nowrap rounded-full px-5 text-[14px] leading-none text-[#ffffffcc] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#09090bcc] hover:text-white"
              >
                {t({ en: 'Add template', uk: 'Додати шаблон' })}
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              aria-label={t({ en: 'Voice input', uk: 'Голосове введення' })}
              className="liquid-glass liquid-glass--bright grid h-9 w-9 place-items-center rounded-full text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#09090bcc]"
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
      <div className="he-chips flex h-[42px] w-[960px] max-w-full flex-none items-center">
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

      {/* Tooling, mounted per page: the console is how the designer switches the
          dock between "no projects yet" and "one site" without touching code. */}
      <FlowRunner />
      <ScenarioPanel />
    </div>
  )
}
