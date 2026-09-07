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
 * GEOMETRY, all measured off the board (29526:455 / 29526:449 / 29612:24918):
 *   card      416 wide (the chat column), radius 16, 1px Gray/800, blocks inset 1px
 *   page rows border b/l/r + rounded-b-12 — that is what gives the stacked-card look;
 *             the first page's name is 16 semibold white, the waiting ones 13 medium 48%
 *   list box  Gray/950 fill, 1px Gray/800, radius 18, pb-16 pr-16
 *   rows      elbow column 16 wide from x=13, icon 24 at pl-4, text at gap-12, pt-3
 *   gaps      16 between rows, 24 either side of the row in hand
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
import { AnimatePresence, motion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useT } from '@/i18n'
import { IconPage, IconStepDone, IconStepQueued, IconStepRunning } from '@/ui/icons'
import { SPRING_SOFT } from '@/ui/motion'
import { ASSEMBLING, buildOutline } from './build'

const LINE = 'var(--gray-750)'

const cardIn = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1, transition: SPRING_SOFT },
}

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

export function BuildProgress() {
  const { t } = useT()
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
      variants={cardIn}
      initial="initial"
      animate="animate"
      aria-label={t({ en: 'What Remixer is building', uk: 'Що збирає Remixer' })}
      /* No inner padding: the board's blocks sit at (1,1) of the 416 card, and that
         1px IS the card's stroke — Figma draws it inside the geometry while CSS adds
         it outside. Padding on top of the border double-counts it (the repo's own
         lesson from the Home composer). */
      className="w-full max-w-[416px] overflow-hidden rounded-[16px] border border-[var(--gray-800)] bg-[#ffffff08]"
    >
      {/* ----------------------------------------- the page being built */}
      <div className="rounded-b-[12px] border-b border-l border-r border-[var(--gray-800)] px-0.5 pb-0.5">
        {/* 56, not the 24 of padding the export reports: the board's row is a
            fixed-height frame with its 20px icon centred in it (icon at y=18 of 56).
            It only grows for the assembling line, which is why min-height and not
            height. */}
        <div className="flex min-h-[56px] items-center gap-2 py-3 pl-[14px] pr-2">
          {/* self-start once the assembling line is under the title: centring a 20px
              icon against a two-line block drops it between the lines, reading as if it
              belonged to neither. */}
          <IconPage
            size={20}
            className={`flex-none text-[#ffffff7a] ${assembling ? 'self-start' : ''}`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold leading-[1.2] text-white">{t(home.name)}</p>
            {/* The assembling beat has no drawn state on the board. It belongs to the
                page rather than to any one section — every section is done by then — so
                the shimmer moves up here for the last few seconds. */}
            <AnimatePresence initial={false}>
              {assembling && <WorkLine text={t(ASSEMBLING)} beat="assembling" />}
            </AnimatePresence>
          </div>
        </div>

        <div
          className="rounded-[18px] border border-[var(--gray-800)] pb-4 pr-4"
          style={{ background: 'var(--gray-950)' }}
        >
          <ol className="relative pl-[13px] pt-4">
            {sections.map((section, i) => {
              const state = assembling || i < active ? 'done' : i === active ? 'active' : 'queued'
              const first = i === 0
              return (
                <li
                  key={section.id}
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
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      {/* --------------------------------- the pages this pass does not build */}
      {rest.map((page) => (
        <div
          key={page.id}
          className="flex h-12 items-center gap-2 rounded-b-[12px] border-b border-l border-r border-[var(--gray-800)] pl-3 pr-2"
        >
          <IconPage size={20} className="flex-none text-[#ffffff3d]" />
          <span className="text-[13px] font-medium leading-none text-[#ffffff7a]">{t(page.name)}</span>
        </div>
      ))}
    </motion.section>
  )
}
