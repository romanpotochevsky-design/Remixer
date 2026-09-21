/**
 * WHICH BUILD PLAN THIS STEP WEARS — the switch, parked in the BOTTOM-LEFT CORNER OF THE
 * SCREEN (designer, 21.09.2026: «я просил это вставить в нижний левый угол экрана, а не формы»).
 *
 * ⚠️ THE CORNER IS THE POINT, AND IT WAS BUILT IN THE FOOTER FIRST — do not put it back.
 * This is an INSTRUMENT, not a control of the product: it flips between two DRAWN designs of
 * the same step (`world.planSimple`), which is a thing only we do, in front of an audience.
 * Inside the card's footer it read as a third product button beside `Review` and
 * `Start Building`, and it polluted the very component it exists to show. In the screen's
 * corner it reads as what it is — the twin of the scenario console's handle, which parks in
 * the OPPOSITE corner on the same inset (`bottom-2.5 right-2.5`, ScenarioPanel.tsx).
 *
 * ⚠️ It exists only while the step does (`brief.status === 'planning'`): "на этом шаге". A
 * switch for a card that is not on screen would be a control with nothing to switch — the
 * same rule that keeps the right rail's buttons and the mode pill away before a site exists.
 *
 * The control itself is the house's THIRD segmented control and obeys the same law as the
 * Home dock's tabs and its filter chips (`segmentedPill`, ui/motion.ts): a track, one pill
 * flying between seats on the shell's spring, labels that only change colour. No
 * capsule-of-two — that construction exists on the other two because their seats have
 * DIFFERENT widths, and a pill that `scaleX`es between them settles with elliptical caps.
 * These seats are equal by construction (a two-column grid), so one capsule translates by
 * exactly its own width (`x: 100%`) and nothing scales.
 *
 * ⚠️ The bloom belongs to the INACTIVE seat only: pressing what is already selected is a
 * no-op, and there is nothing to acknowledge. The flight IS the acknowledgement.
 */
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useUI } from '@/state/ui'
import { useT, type Text } from '@/i18n'
import { Tooltip } from '@/ui/Tooltip'
import { segmentedPill } from '@/ui/motion'
import { setPlanVariant } from './send'

const SEATS = [
  { simple: false, label: { en: 'Full', uk: 'Повний' } as Text },
  { simple: true, label: { en: 'Simple', uk: 'Спрощений' } as Text },
]

export function PlanVariantSwitch() {
  const { t } = useT()
  const reduce = useReducedMotion()
  const simple = useWorld((s) => s.world.planSimple)
  const planning = useWorld((s) => s.world.brief.status === 'planning')
  const page = useUI((s) => s.page)
  const show = planning && page === 'builder'

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          /* The console's handle sits at `bottom-2.5 right-2.5`; this is its mirror image, so
             the two instruments read as a pair of corners.
             ⚠️ `z-50`, NOT the handle's 9998: above everything the shell paints (the dock is
             20, the Publish panel 40) and below every scrim (60 the letter, 70 the modals and
             the plan's own full-screen sheet, 80 the cart). The console deliberately outranks
             modals because it must always be reachable; this switch must not float over a
             dimmed screen — the sheet it would sit on top of IS the thing it switches. */
          className="fixed bottom-2.5 left-2.5 z-50"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, transition: segmentedPill.transition }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
        >
          <Tooltip
            interactive
            text={{
              en: 'Prototype: two drawn designs of this step. Full opens the plan in the canvas, Simple keeps it in its own window.',
              uk: 'Прототип: два намальовані варіанти цього кроку. Повний відкриває план на полотні, Спрощений залишає його у власному вікні.',
            }}
          >
            <div data-plan-variant className="plan-variant grid h-8 grid-cols-2 items-center rounded-full p-1">
              <motion.span
                aria-hidden
                className="plan-variant-thumb"
                style={{ top: 4, bottom: 4, left: 4, width: 'calc(50% - 4px)' }}
                /* `initial={false}`: on mount the pill IS at its seat. Without it the switch
                   would spring across the track every time the step arrives. */
                initial={false}
                animate={{ x: simple ? '100%' : '0%' }}
                transition={reduce ? { duration: 0 } : segmentedPill.transition}
              />
              {SEATS.map((seat) => {
                const on = seat.simple === simple
                return (
                  <button
                    key={seat.label.en}
                    type="button"
                    data-plan-seat={seat.simple ? 'simple' : 'full'}
                    data-on={on || undefined}
                    aria-pressed={on}
                    onClick={() => setPlanVariant(seat.simple)}
                    className={`plan-variant-seat h-6 rounded-full px-3 text-[13px] font-medium leading-none ${on ? '' : 'press-bloom'}`}
                  >
                    {t(seat.label)}
                  </button>
                )
              })}
            </div>
          </Tooltip>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
