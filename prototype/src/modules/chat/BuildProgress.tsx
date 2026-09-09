/**
 * The generation outline — Figma 29480:48478.
 *
 * The card that carries the minute the first page takes to build. It is the whole site's
 * outline: the page being built at the top with its sections open underneath, and the
 * pages that come later named and closed below it. Sections move through three states —
 * done, in hand, waiting — and the one in hand says what is happening to it right now.
 *
 * Why an outline and not a progress bar: this pass builds ONE page (see build.ts), and a
 * bar would let the customer believe a four-page site had landed when one page did. The
 * closed rows under Home are load-bearing information, not decoration.
 *
 * ⚠️ THE CARD FILLS ITS COLUMN — no max-width (designer, 07.09.2026: "когда меню
 * схлопнуто, этот компонент на всю ширину чата"). The board's 416 is not the card's size,
 * it is the width of the message column it was drawn in: at the split it is 416, and with
 * the canvas collapsed the chat's column is 800 (`.chat-col`) and every other message
 * spans it. A card pinned to 416 in that state read as a narrow object floating in a wide
 * thread rather than as one more turn in it.
 *
 * GEOMETRY — the board that owns this card is **29531:17269** (read 09.09.2026 after the
 * designer's second report on its edges: "какие-то поломанные бордеры с обрывами… должно
 * быть как в макете перфект пиксель"). It supersedes the readings taken off 29480:48478's
 * children, and it settles the edges once:
 *   card      1px #272728, radius 24 — a CONTINUOUS outline, top to bottom
 *   page blk  1px #272728, radius 24, fill Neutral Alpha/50 (4% white), padding 0/1/1
 *   header    56 tall, pl-14 pr-8, icon 20, name 16 semibold white
 *   list box  #09090b, 1px Neutral Alpha/100 (8% white), radius 20 top / 22 bottom, pb-16 pr-16
 *   rows      elbow column 16 wide from x=13, icon 24 at pl-4, text at gap-12, pt-3
 *   gaps      16 between rows, 24 either side of the row in hand
 *   waiting   48 tall, pl-12 pr-8, icon 20, name 13 medium 48% white; border b/l/r with a
 *             rounded-16 bottom on every one EXCEPT THE LAST, which draws nothing at all
 *
 * ⚠️ THE SPINE IS BUILT PER ROW, not as one line down the side. The board draws a 1px
 * line of a FIXED 204px height in its own column at x=12, plus an 8px rounded corner per
 * row at x=13 — two lines a pixel apart, which is a static mock's way of spelling one
 * continuous line. Here the rows change height as the active one moves, so a fixed spine
 * would come up short or overshoot. Instead each row draws the corner into its own icon
 * centre and, unless it is the last, a continuation down through its own bottom padding
 * to where the next row's corner begins. It tiles exactly, at any height, with no
 * measurement: the first row's corner is the top-left one (the line starts there and
 * turns down), every other row's is the bottom-left one (the line arrives and turns in).
 */
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useT } from '@/i18n'
import { IconPage, IconStepDone, IconStepQueued, IconStepRunning } from '@/ui/icons'
import { cardIn, cardInBody, cardInBodyFade, cardInFade, cardInRow, cardInRowFade } from '@/ui/motion'
import { buildOutline } from './build'

const LINE = 'var(--gray-750)'

/** How tall the gap under row `i` is: 16, or 24 next to the row in hand. */
function gapAfter(i: number, last: number, active: number) {
  if (i === last) return 0
  return i === active || i + 1 === active ? 24 : 16
}

/**
 * The line that says what is being done to this section, shimmering.
 *
 * Keyed on the beat so React remounts it when the work moves on: the entry animation
 * replays and the sentence arrives rather than being swapped underneath the reader. The
 * height animates because the sentence is one or two lines depending on which it is, and
 * a row that jumps by 20px every four seconds is the thing that would make this card
 * feel cheap.
 */
function WorkLine({ text, beat }: { text: string; beat: string }) {
  return (
    <motion.div
      key="work"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 0.61, 0.36, 1] }}
      className="overflow-hidden"
    >
      <p key={beat} className="gen-work pt-[5px] text-[14px] leading-[1.4]">
        {text}
      </p>
    </motion.div>
  )
}

/** `animate`: the card has just been sent (ChatPanel's `isFresh`) — a restored one stands still. */
export function BuildProgress({ animate }: { animate: boolean }) {
  const { t } = useT()
  /* motion.ts `cardIn` — the same arrival as the brief summary: the glass rises out of
     the dock, the page block focuses onto it, then the sections and the waiting pages
     come up one after another down the outline. */
  const reduce = useReducedMotion()
  const [glass, body, row] = reduce ? [cardInFade, cardInBodyFade, cardInRowFade] : [cardIn, cardInBody, cardInRow]
  const { brief, build } = useWorld((s) => s.world)
  const pages = buildOutline(brief.answers)
  const [home, ...rest] = pages
  const sections = home.sections ?? []
  const last = sections.length - 1
  /* `at` past the last section means every one is done and the page is being assembled —
     the beat just before the site appears in the canvas. */
  const active = build.at
  const assembling = active >= sections.length

  return (
    <motion.section
      variants={glass}
      initial={animate ? 'initial' : false}
      animate="animate"
      aria-label={t({ en: 'What Remixer is building', uk: 'Що збирає Remixer' })}
      /*
       * The card is a STROKE, not a surface: `iteration` fills it completely, so whatever
       * fill the card has never shows — the lighter surface belongs to the PAGE BLOCK
       * below, and putting it here instead lit the waiting pages too.
       *
       * ⚠️ AND ITS OWN STROKE IS THE CARD'S SPINE — the one line that runs unbroken from
       * the top corner to the bottom one. Every seam inside (the page block's rounded
       * bottom, each waiting row's) is an ARC that leaves the side 16–24px early and
       * curves inward; those arcs only read as seams because a straight rail continues
       * behind them. Take the rail away and each arc ends in mid-air: that is exactly the
       * "поломанные бордеры с обрывами" the designer photographed on 09.09.2026, and it
       * was my own fix earlier the same day for his FIRST report on these edges ("бордер
       * как будто двойной… видно внизу там где About, Services").
       *
       * Both reports are true, and the board answers both. Figma's strokes sit INSIDE the
       * geometry, so on the board the card's line and a full-width child's line are one
       * line; in CSS a border ADDS, so they landed a pixel apart as a 2px rail. The repo's
       * rule for that names two cures — pull the child out by a pixel, or drop the parent's
       * border — and the arcs above say which one this card needs: **the children are
       * pulled out** (`-mx-px`, `-mt-px`), so every child stroke lands ON the card's and
       * the rail stays 1px the whole way down. Same trick the brief summary's list uses.
       *
       * No `overflow-hidden`: the clip follows the PADDING box, so it would shave the very
       * strokes that have just been pulled onto the border. Nothing needs clipping — every
       * child carries its own radius.
       */
      className={`w-full origin-bottom rounded-[24px] border border-[#272728]${animate ? ' card-arrive' : ''}`}
    >
      {/* ----------------------------------------- the page being built */}
      {/*
        * The page being built (29612:24965): `Neutral Alpha/50` fill, a full 1px stroke,
        * radius 24 ALL ROUND — not a bottom-rounded strip, which is how I first read it
        * from the render. Read in the DARK theme: the export resolves NA/50 to
        * `rgba(9,9,11,0.04)`, which over this ground is invisible.
        *
        * Pulled a pixel out on three sides so its stroke lands ON the card's; its radius is
        * the card's own 24, so the two paths coincide exactly rather than nesting.
        *
        * `px-px pb-px` insets the list box by a pixel on three sides; the header sits
        * flush at the top. Measured against the board that lands the list at x=2 of the
        * card and the page name at x=44 — the board's own coordinates, to the pixel.
        */}
      <motion.div
        variants={body}
        className="-mx-px -mt-px w-[calc(100%+2px)] origin-bottom rounded-[24px] border border-[#272728] bg-[#ffffff0a] px-px pb-px"
      >
        {/* 56, not the 24 of padding the export reports: the board's row is a
            fixed-height frame with its 20px icon centred in it (icon at y=18 of 56).
            ⚠️ NOTHING BUT THE NAME GOES HERE. It briefly carried a shimmering "Putting
            the page together" through the assembling beat — my invention, not on the
            board, and the designer cut it (07.09.2026: "вот это лишнее"). By then every
            section is green and the page is on its way; a line saying so is a caption on
            something already said. */}
        <div className="flex h-[56px] items-center gap-2 pl-[14px] pr-2">
          <IconPage size={20} className="flex-none text-[#ffffff7a]" />
          <p className="text-[16px] font-semibold leading-[1.2] text-white">{t(home.name)}</p>
        </div>

        {/* 29526:455 — the inner surface: #09090b under a 1px Neutral Alpha/100 hairline
            (8% WHITE in the dark theme; the export's `rgba(9,9,11,.08)` is the light
            fallback), radius 20 at the top and 22 at the bottom. Not `--gray-800`: this
            line is the faint inner one, a step quieter than the card's #272728. */}
        <div
          className="rounded-b-[22px] rounded-t-[20px] border border-[var(--white-100)] pb-4 pr-4"
          style={{ background: 'var(--gray-950)' }}
        >
          <ol className="relative pl-[13px] pt-4">
            {sections.map((section, i) => {
              const state = assembling || i < active ? 'done' : i === active ? 'active' : 'queued'
              const first = i === 0
              return (
                <motion.li
                  key={section.id}
                  variants={row}
                  custom={i}
                  /* `data-state` is the state in the DOM rather than only in a colour:
                     the headless check reads it, and `aria-current` is the standard way
                     to say which step of a sequence is the live one. */
                  data-state={state}
                  aria-current={state === 'active' ? 'step' : undefined}
                  className="relative flex items-start"
                  style={{ paddingBottom: gapAfter(i, last, active) }}
                >
                  {/* The corner into this row's own icon centre. The first row's is the
                      TOP-left one (the line begins here and turns down); every other
                      row's is the bottom-left one (the line arrives and turns in). */}
                  <span className="relative w-4 flex-none" aria-hidden>
                    <span
                      className={`absolute left-0 w-4 border-l ${
                        first
                          ? 'top-3 h-2 rounded-tl-[8px] border-t'
                          : 'top-0 h-3 rounded-bl-[8px] border-b'
                      }`}
                      style={{ borderColor: LINE }}
                    />
                  </span>
                  {/*
                    * The line onward, to where the next row's corner starts.
                    *
                    * ⚠️ A CHILD OF THE ROW, not of the elbow column, and that is the whole
                    * trick. The gap between rows is this row's own `padding-bottom`, and a
                    * `self-stretch` child only reaches the flex CONTENT box — so parked in
                    * the column it stopped short and the spine came out in dashes. Absolute
                    * positioning resolves against the padding box, so `bottom-0` here lands
                    * exactly on the next row's top edge, at any row height and either gap.
                    */}
                  {i !== last && (
                    <span
                      aria-hidden
                      className={`absolute bottom-0 left-0 w-px ${first ? 'top-5' : 'top-3'}`}
                      style={{ background: LINE }}
                    />
                  )}

                  <span className="flex min-w-0 flex-1 items-start gap-3 pl-1">
                    <span className="flex-none">
                      {state === 'done' ? (
                        <IconStepDone size={24} className="text-[var(--live)]" />
                      ) : state === 'active' ? (
                        <IconStepRunning size={24} className="text-[var(--action)]" />
                      ) : (
                        <IconStepQueued size={24} className="text-[#ffffff3d]" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 pt-[3px]">
                      <span
                        className={`block text-[14px] leading-[1.4] ${
                          state === 'active'
                            ? 'font-semibold text-white'
                            : state === 'done'
                              ? 'font-semibold text-[#ffffff7a]'
                              : 'font-medium text-[#ffffff7a]'
                        }`}
                      >
                        {t(section.name)}
                      </span>
                      <AnimatePresence initial={false}>
                        {state === 'active' && (
                          <WorkLine
                            text={t(section.work[Math.min(build.line, section.work.length - 1)])}
                            beat={`${build.at}-${build.line}`}
                          />
                        )}
                      </AnimatePresence>
                    </span>
                  </span>
                </motion.li>
              )
            })}
          </ol>
        </div>
      </motion.div>

      {/* --------------------------------- the pages this pass does not build */}
      {rest.map((page, j) => (
        <motion.div
          key={page.id}
          variants={row}
          custom={sections.length + j}
          /*
           * ⚠️ EVERY WAITING ROW SEALS ITS BOTTOM — EXCEPT THE LAST, WHICH DRAWS NOTHING.
           * The board is explicit about it: `About` (29612:24911) carries a stroke on
           * bottom/left/right with a rounded-16 bottom, and `Contacts` (29612:24923) carries
           * no stroke at all. That is the whole stacked-card illusion: each row's rounded
           * bottom is a card lying on the one behind it, and the last one has nothing to lie
           * on — the CARD's own bottom corner closes it. Give the last row a seam too and it
           * reads as a floating strip inside the card, a rounded line hovering a pixel above
           * the real bottom corner.
           *
           * The sealed ones are pulled a pixel out (`-mx-px`) so their sides land on the
           * card's rail instead of beside it; the last one is not pulled, because with no
           * stroke of its own the pull would only move its icon a pixel off the board's x=13.
           *
           * NO fill on any of them: they are transparent over the chat's ground, which is
           * what makes the page being built the one lighter surface in the card.
           */
          className={`flex h-12 items-center gap-2 pl-3 pr-2 ${
            j === rest.length - 1
              ? ''
              : '-mx-px w-[calc(100%+2px)] rounded-b-[16px] border-b border-l border-r border-[#272728]'
          }`}
        >
          <IconPage size={20} className="flex-none text-[#ffffff3d]" />
          <span className="text-[13px] font-medium leading-none text-[#ffffff7a]">{t(page.name)}</span>
        </motion.div>
      ))}
    </motion.section>
  )
}
