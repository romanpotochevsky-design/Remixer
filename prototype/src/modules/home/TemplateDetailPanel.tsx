/**
 * THE TEMPLATE DETAIL PANEL — Figma 28637:42088 → `Right` **29179:45884**,
 * redesigned in place 01.09.2026.
 *
 * The product owner asked for template information inside the expanded preview,
 * and the designer answered by emptying the detail bar: the centred template
 * name (`28640:43354`) and the blue `Choose a template` pill (`28641:43375`) are
 * **deleted from the file** (grepped — 0 hits each, while every other bar node is
 * still there), the bar drops 64 → **52** and keeps only navigation, and the name
 * reappears here at 32px with the CTA under it. So this file is not a new
 * feature bolted onto the detail view; it is where two thirds of the old bar went.
 *
 * WHAT IT IS, OUTSIDE IN, at the drawn 1656 × 1196:
 *
 *   wrapper `29179:45884`   436 × 1112 at sheet (1188, 52) — 4px right/bottom gutter
 *     panel `29179:45851`   432 × 1108, r12, Gray/800 #27272a, 1px 4%-white rim,
 *                           padding 33/4/4/4, gap 24
 *       head  `29179:45852` 422 × 283, gap 26, px 14 → a 394 column
 *         title            394 × 38   Gilroy SemiBold 32 / 38
 *         tagline          362 × 42   Proxima 15 / 21, 56% white, in a 394 row
 *                                     with `padding-right: 32` — the 32 is drawn
 *                                     intent, not a wrap artefact
 *         buttons          394 × 158, gap 12
 *           tray `147663`  394 × 98,  r16, Black/200, 20%-white ring, p 6, gap 4
 *             Use Template 380 × 48   r12, #1587ff
 *             + Add Prompt 380 × 32   r10, no surface at all
 *           Preview        382 × 48   r12, rim only (see PREVIEW_W)
 *       info  `29179:45859` 422 × flex-1, r12, 4% white + 4% rim
 *         category row     420 × 59,  p 22/24/19/24, 1px 8%-white bottom edge
 *         body             420 × hug, p 30/24/24/24, gap 31 → a 372 column
 *
 * The vertical stack closes on the drawn pixel and that is the strongest evidence
 * the read is right — `1 + 33 + 38 + 19 + 42 + 26 + 158 + 24 + 762 + 4 + 1 = 1108`,
 * with three of those terms independently confirmed by metadata boxes.
 *
 * THE PANEL IS THE ONLY FIXED WIDTH IN THE SHEET (`w-[436px]`). Everything else
 * is fluid, so the stage absorbs every window change and this column never moves.
 * Its height, though, is entirely fluid: `head` and `buttons` hug, the info card
 * is `flex: 1`, so **`infoCardH = innerH − 434`** and the ~301px of empty tail the
 * board draws under the last paragraph is slack, not design. See `.tpldetail-info`.
 *
 * ⚠️ THE DRAWN SCROLLBAR IS NOT DECORATION, and the first read of this board got
 * that backwards. At the board's own 1196px window the copy under-flows by 301px
 * and nothing scrolls — but `innerH − 434` is a *browser* inner height: a
 * 1440 × 900 MacBook Air gives the card 346px against 461px of copy, i.e. 115px
 * cut, and the designer's 63% thumb is roughly what his own machine produces. The
 * scroller is mandatory. What scrolls is the info card BELOW the category row —
 * the only evidence for that boundary is the drawn track's own geometry (panel y
 * 401…1102, which is 293px outside the frame it is parented to), so the category
 * row is a static header and the head block never yields.
 *
 * MOTION. `get_motion_context` on this panel returns `{"nodes":[]}` — nothing is
 * authored, so the entrance is house convention: one beat behind the bar's own
 * contents (`headerBit`, +60ms), fade plus a 12px slide from the right, spring
 * `SPRING_SOFT`; leaving is a flat 0.1s fade, faster and bounceless.
 * ⚠️ TRANSFORM AND OPACITY ONLY, AND NOT ONE LAYOUT PROPERTY — and here that rule
 * protects a *sibling*, not this panel. `TemplateFlight` measures
 * `[data-detail-stage]`'s rect in a layout effect, once, for the tile and dock
 * doors; a panel that animated its width, its flex-basis or its mount would move
 * the stage's rect between t=0 and t=1 and land those two flights on the wrong
 * box — silently, and only on two of the three doors. The panel is therefore
 * absolutely positioned (it shares no layout with the stage at all) and holds its
 * full 432 × H from the first commit.
 *
 * COPY comes from `TEMPLATE_DETAILS` in `data/templates.ts`, keyed per SITE
 * (`ThumbId`), because 42 library+dock rows draw 19 sites and that file's own
 * invariant is that a site keeps one caption and one category in every row it
 * appears in — an invariant that matters far more for a 32px headline and 500
 * characters of prose than for a 12px card caption. The board's own strings are
 * placeholder for a different template than the one on its stage (a journal blog
 * described beside a cream supplement store), so they are the field list and the
 * drawn lengths, never the content.
 *
 * FOUR UNDRAWN CONTENT STATES, each handled here rather than left to chance:
 *   · a title that wraps to two lines — the head block hugs and the info card
 *     gives up 38px; nothing clips, nothing is hard-coded (one of the 19 titles
 *     needs it today, and a second is ~20px from needing it)
 *   · a three-word tagline — one 21px line instead of two; the 32px right inset
 *     still holds, so the measure stays 362 whatever the string does
 *   · one tag, or four — the value is comma-joined, `nowrap`, flush right, and
 *     ellipsised rather than wrapped: a second line would break the 59px row that
 *     `pt 22 / pb 19` around a 17px line establishes
 *   · a third section — sections are a list. The board draws two blocks at two
 *     different heading sizes (20px content, 18px label), so item 0 keeps the 20
 *     and every later item gets the 18, in the same 31/23 rhythm with no new box.
 *
 * ⚠️ The first heading's frame `29179:45868` is drawn with a FIXED `h-[48px]`
 * while its structurally identical sibling hugs. It is not clipped (there is no
 * overflow on it), so a third line would land ON the paragraph below, and a
 * one-line heading leaves 24px of dead air. Built as a HUG with an explicit
 * `line-height: 24px`, which reproduces the drawn 48 exactly for the drawn
 * two-line copy and cannot break for any other. Same reason every leading here is
 * px and not a ratio: Outfit's `normal` is 1.25 against Gilroy's ~1.18, so
 * `leading-normal` would ship the title at 40 instead of 38 and this heading at 50
 * inside its 48. Explicit px reproduces the board under the stand-in faces AND
 * under the licensed ones.
 */
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useT } from '@/i18n'
import { TEMPLATE_DETAILS } from '@/data/templates'
import type { ThumbId } from './thumbs'
import { ScrollArea } from '@/ui/ScrollArea'
import { IconPlus } from '@/ui/icons'
import { SPRING_SOFT } from '@/ui/motion'

/**
 * The panel's painted width, and its two gutters. The wrapper `29179:45884` is
 * 436 with `padding-right: 4` and `padding-bottom: 4`; the result — not the
 * mechanism — is what is ported, because the sheet's matching 4 on the other side
 * comes from a completely different node (`Sections`' `padding-left`).
 * ⚠️ `PANEL_W + PANEL_GUTTER` is the number the stage's right edge is measured
 * from, and `PANEL_GAP` the row gap between them — all three live here so the
 * flight arithmetic in TemplatePicker/TemplateFlight has one source.
 */
export const PANEL_W = 432
export const PANEL_GUTTER = 4
export const PANEL_GAP = 8
/** What the stage gives up on its right: 4 gutter + 432 panel + 8 gap = 444. */
export const PANEL_RESERVE = PANEL_GUTTER + PANEL_W + PANEL_GAP

/**
 * ⚠️ `Use Template` and `Preview` are drawn 1px out on BOTH edges — 380 at
 * panel-x 26 inside the tray, 382 at panel-x 25 below it — purely because the
 * tray has a 1px stroke that eats a pixel of its 6px padding and the `Preview`
 * wrapper has no stroke to eat one. All five reads of this board call it an
 * accident. Two stacked full-width CTAs must not be 1px apart, so both land at
 * **380 @ 26**: the tray's padding is 7 (6 + the pixel its ring no longer takes)
 * and the `Preview` wrapper's is 7 as well. Deviation from the board: `Preview`
 * loses 2px of width and gains 1px of left inset.
 */
const PREVIEW_PAD = 7

/** One beat behind the bar's own contents (`headerBit` runs at +60ms). */
const panelIn: Variants = {
  pre: { opacity: 0, x: 12 },
  in: { opacity: 1, x: 0, transition: { ...SPRING_SOFT, delay: 0.09 } },
  out: { opacity: 0, transition: { duration: 0.1, ease: [0.4, 0, 1, 1] } },
}
/**
 * Reduced motion: the SAME fade with the displacement thrown away rather than
 * jumped into. `MotionConfig reducedMotion="user"` disables transform animation
 * by snapping it to its target, which is harmless on the way in (the target is
 * `x: 0`) but is exactly the trap CLAUDE.md records four times over — so the
 * variant that carries an offset is selected out, not relied upon.
 */
const panelInFade: Variants = {
  pre: { opacity: 0 },
  in: { opacity: 1, transition: { duration: 0.2, ease: [0.2, 0, 0, 1] } },
  out: { opacity: 0, transition: { duration: 0.1, ease: [0.4, 0, 1, 1] } },
}

export function TemplateDetailPanel({
  id, barH, present, onUse, onAddPrompt, onPreview,
}: {
  /** The SITE on the stage — the panel's copy is keyed per site, not per row. */
  id: ThumbId
  /** The bar above it (`DETAIL_HEADER_H`): the panel's top edge butts it with no
   *  gap, while its bottom floats 4px above the sheet — drawn that way, and the
   *  4 is what makes its radius concentric with the sheet's. */
  barH: number
  /** false once the detail view is leaving — fade out ahead of the stage. */
  present: boolean
  onUse: () => void
  onAddPrompt: () => void
  onPreview: () => void
}) {
  const { t } = useT()
  const reduced = useReducedMotion()
  const d = TEMPLATE_DETAILS[id]

  return (
    <motion.aside
      data-detail-panel
      variants={reduced ? panelInFade : panelIn}
      initial="pre"
      animate={present ? 'in' : 'out'}
      /* Absolutely positioned, so this panel and the stage share no layout —
         see the ⚠️ in the header note. `right/bottom 4` are the wrapper's
         gutters; the top butts the bar. */
      className="tpldetail-panel absolute bottom-1 right-1 flex w-[432px] flex-col gap-[24px]"
      style={{ top: barH, willChange: 'transform, opacity' }}
    >
      {/* `Text + Buttons` 29179:45852 — 422 wide, `px 14` → the 394 column */}
      <div className="flex w-full shrink-0 flex-col gap-[26px] px-[14px]">
        {/* title block 29179:45853, gap 19 */}
        <div className="flex flex-col gap-[19px]">
          {/*
           * 29179:45854 — Gilroy SemiBold 32, line box 38, raw #ffffff (the only
           * text in the panel outside the file's own token system: proven, not
           * inferred — an isolated variable read of this block returns exactly
           * one entry, the tagline's 56%). It is also the surface's accessible
           * name now that the bar has none, hence `<h2>`.
           */}
          <h2
            data-detail-title
            className="break-words font-display text-[32px] font-semibold leading-[38px] text-white"
          >
            {d.title}
          </h2>
          {/*
           * 29179:45883 — a 394 row reserving 32 on the right, so the measure is
           * 362. Implemented as the intent (a right inset), not as a max-width:
           * a hugging text node would have exported a content-sized width, and
           * this one exports `flex: 1 0 0` inside a `pr-[32px]` row.
           */}
          <div className="w-full pr-[32px]">
            <p className="font-sans text-[15px] leading-[21px] text-[var(--white-560)]">
              {d.tagline}
            </p>
          </div>
        </div>

        {/* `Buttons` 29179:45856, gap 12 */}
        <div className="flex w-full flex-col gap-[12px]">
          {/*
           * THE TRAY `29186:147663`. Grouping is the strongest semantic signal on
           * this board: these two share a container and `Preview` does not, so
           * the tray says «these two are the same decision» and `Preview` says
           * «this is a different kind of act». The emphasis ladder inside is
           * unambiguous — Filled/Blue/Large (the kit's own doc: "final actions
           * that complete a flow") over Text/Small at 56% white.
           */}
          <div className="tpldetail-well flex w-full flex-col items-center gap-[4px]">
            {/*
             * `Use Template` — component 36:728, `Filled / Enabled / Icon=None /
             * Large / Blue / Square`. Fill `Background/Blue/Default`, which
             * resolves in the DARK theme to #1587ff, i.e. exactly `var(--action)`
             * — the export's #0073ec is the light-theme trap and is our
             * `--action-pressed`, so pasting it would ship the pressed tone.
             * Label `Label Large Strong` = PN Semibold 15, lh 100%, centred.
             *
             * ⚠️ Casing is the board's (`Use Template`), against this product's
             * sentence case everywhere else (`Add template`, `Choose a template`,
             * `Remix this template`). Kept verbatim and raised, not silently
             * fixed. Interaction is the house convention for a solid action
             * button — the board draws no hover, pressed or focus layer anywhere.
             */}
            <button
              data-detail-choose
              onClick={onUse}
              className="press-bloom h-[48px] w-full rounded-[12px] bg-[var(--action)] text-center font-sans text-[15px] font-semibold leading-none text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)] active:bg-[var(--action-pressed)]"
            >
              {t({ en: 'Use Template', uk: 'Використати шаблон' })}
            </button>
            {/*
             * `+ Add Prompt` — component 57:417, `Text / Icon=Left / Small /
             * Dark`. No fill and no rim at all; the 24px `Add` glyph and the
             * label are the same 56% white.
             *
             * ⚠️ SPELLING IS OURS. The file says `Add Promt` — nine bytes, no `p`
             * between `m` and `t`, confirmed from two independent reads and
             * visible in the render. Shipped correct and raised.
             * ⚠️ TRULY CENTRED, also ours. The kit's state-layer is
             * `padding-left 4 / padding-right 16` under `justify-center`, which
             * puts the icon+label group 6px left of the button's own centre —
             * the shape of a left-aligned small text button stretched to full
             * width. 6px on a 380px row is invisible; a real centre is what the
             * drawing looks like. Raised.
             * The glyph is our hand-drawn `IconPlus` at 20 in the drawn 24 box
             * (Figma's SVG export is proxy-blocked for this whole project), and
             * it is decorative — the label carries the meaning.
             */}
            <button
              data-detail-addprompt
              onClick={onAddPrompt}
              className="flex h-[32px] w-full items-center justify-center gap-[6px] rounded-[10px] font-sans text-[13px] font-semibold leading-[1.4] text-[var(--white-560)] transition-colors duration-[var(--dur-fast)] ease-std hover:text-white"
            >
              <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center">
                <IconPlus size={20} />
              </span>
              {t({ en: 'Add Prompt', uk: 'Додати промпт' })}
            </button>
          </div>

          {/*
           * `Preview` — component 36:740, `Outlined / Enabled / Icon=None /
           * Large / Dark`. No fill (the panel's #27272a shows through), 1px flat
           * 12% white rim, white 15px label: the DS's Filled-vs-Outlined pair
           * with the CTA above it, distinguished only by fill and rim.
           * `glass-interactive` for the wash and the press bloom — the ring
           * recipe only, not the whole `.liquid-glass--dim` class, because this
           * button has neither a fill nor a blur.
           */}
          <div className="w-full" style={{ paddingInline: PREVIEW_PAD }}>
            <button
              data-detail-preview
              onClick={onPreview}
              className="tpldetail-preview glass-interactive h-[48px] w-full text-center font-sans text-[15px] font-semibold leading-none text-white"
            >
              {t({ en: 'Preview', uk: 'Перегляд' })}
            </button>
          </div>
        </div>
      </div>

      {/* THE INFORMATION CARD 29179:45859 — `flex: 1`, so it owns all the slack */}
      <div className="tpldetail-info flex min-h-0 w-full flex-1 flex-col">
        {/*
         * The category row `29179:45860` — a STATIC header: the drawn track
         * starts 2px below its divider, so this row is outside the scroller.
         * `items-baseline` with `justify-between`; the value is flush right at
         * the column's full 372 (metadata: x 285 + w 87 = 372).
         *
         * ⚠️ `Category` shows a DIFFERENT taxonomy from the filter chips the
         * reader just used (`Editorial, Blog` is none of Ecommerce / Tech & SaaS
         * / Portfolio / Business & services / Health And Beauty). The content
         * file resolves it by making tag 1 the chip's own label, so the row is
         * never in visible contradiction with the filter — but the label may
         * want to be `Style` instead. Raised.
         * ⚠️ Empty tags hide the whole row, divider included: a dangling label
         * with nothing on its right reads as a bug, and the body's own `pt 30`
         * is enough top breathing room on its own.
         */}
        {d.categoryTags.length > 0 && (
          <div className="tpldetail-catrow shrink-0 px-[24px] pb-[20px] pt-[22px]">
            <div className="flex items-baseline justify-between gap-[16px]">
              <span className="shrink-0 font-sans text-[14px] font-medium leading-[17px] text-[var(--white-480)]">
                {t({ en: 'Category', uk: 'Категорія' })}
              </span>
              {/*
               * ONE text run, not chips — the file has a single text node with
               * the `, ` inside it, no per-tag frame, padding, radius or fill
               * anywhere in the subtree. `nowrap` is the board's own
               * (`whitespace-nowrap` sits on the container), so the failure mode
               * for four long tags is an ellipsis, never a second line.
               */}
              <span className="min-w-0 truncate text-right font-sans text-[14px] font-semibold leading-[17px] text-white">
                {d.categoryTags.join(', ')}
              </span>
            </div>
          </div>
        )}

        {/*
         * The scroll region. `light` tone — the house tone for a dark surface,
         * and the panel is dark. Two departures from the drawing, both the
         * project's standing rule rather than an oversight: the board draws the
         * thumb VISIBLE AT REST at 12% white in an 8px track, and `ScrollArea`
         * is invisible at rest, 4px, fading 700ms after the surface stops. The
         * width matches; the resting visibility does not, and a permanently
         * visible bar on a panel that usually does not overflow is noise.
         * ⚠️ `tabIndex` + a name: `ScrollArea` hides native scrollbars app-wide,
         * so without this the ~500 characters below are unreachable by keyboard
         * at exactly the laptop heights where they are also cut.
         * `overscroll-contain` keeps a wheel that runs out of copy here from
         * bubbling into whatever gains a scroller above.
         */}
        <ScrollArea
          axis="y"
          thumb="light"
          className="min-h-0 flex-1"
          innerClassName="overscroll-contain"
          tabIndex={0}
          aria-label={t({ en: 'Template details', uk: 'Деталі шаблона' })}
        >
          {/*
           * The body `29179:45867` — padding 30/24/24/24, gap 31, and NO surface:
           * its drawn radius 16, like the category row's, paints nothing. It is a
           * content column, not a card; do not give it a fill "to match".
           */}
          {d.sections.length > 0 && (
            <div className="flex flex-col gap-[31px] px-[24px] pb-[24px] pt-[30px]">
              {d.sections.map((s, i) => (
                <div key={i} className="flex flex-col gap-[23px]">
                  {/*
                   * Item 0 carries the board's 20px/24 heading — a per-template
                   * SENTENCE, i.e. content. Every later item carries its 18px/21
                   * — a LABEL (`Who it's for`), i.e. chrome. The board draws
                   * exactly those two sizes and a flat list would have averaged
                   * the distinction away; a third section therefore renders as a
                   * second label, which is what it is.
                   */}
                  <h3
                    className={
                      i === 0
                        ? 'font-display text-[20px] font-medium leading-[24px] text-white'
                        : 'font-display text-[18px] font-medium leading-[21px] text-white'
                    }
                  >
                    {s.heading}
                  </h3>
                  {/*
                   * Proxima Regular 14 at `Neutral Alpha/800` = 72% white — the
                   * one rung the ladder was missing (`--white-720`).
                   * ⚠️ Leading is **20px, not the exported ratio 1.4**. The ratio
                   * is genuine (14 × 1.4 = 19.6) but Figma laid the boxes out at
                   * a whole pixel, and the drawn 140 (7 lines) and 60 (3 lines)
                   * are each confirmed by three closing parent equations. 1.4
                   * would miss both by 2.84 and 1.22px.
                   */}
                  <p className="font-sans text-[14px] leading-[20px] text-[var(--white-720)]">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </motion.aside>
  )
}
