/**
 * THE PLAN, FULL SCREEN — what the simplified card's chevron opens (designer, 21.09.2026:
 * «эта кнопка должна делать на всю всю экрана с отступом от верха в 16px»).
 *
 * ⚠️ IT IS A SHEET, NOT A TALLER CARD, and that is a measurement rather than a preference.
 * Growing the window inside the dock was built first: the dock sits at the bottom of the chat
 * column under its 52px header, so the card's top edge cannot reach 16 from the top of the
 * WINDOW at any height — and the height that tried pushed the composer 36px past the bottom of
 * the screen, breaking the invariant this panel has kept since 07.09 («поле ввода не двигается
 * — очень важно»). The house already had the right form for "as big as the screen": the
 * full-screen sheet at inset 16 that the template picker uses (28616:59168 — inset 16, scrim
 * 50%). This is that form, carrying the same document.
 *
 * ⚠️ AND IT IS NOT `Review` COMING BACK. Review put the document in the CANVAS beside a
 * narrowed chat — a second surface with its own bar, which is exactly what the product owners
 * asked to remove from release one. This is the same card, enlarged, over everything: one
 * object, two sizes, and the chevron is the way between them.
 *
 * The prose is `PlanDocument` — the same component the 320 window renders, writing the same
 * `world.planEdits` paths. Editing here and editing there are the same act, and no second copy
 * of the text exists anywhere.
 *
 * The measure is 800, centred, as the canvas-sized document has always been: the sheet is as
 * wide as the screen, and prose at 1568px would be unreadable.
 */
import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useUI } from '@/state/ui'
import { useT } from '@/i18n'
import { ScrollArea } from '@/ui/ScrollArea'
import { Tooltip } from '@/ui/Tooltip'
import { IconCloseM } from '@/ui/icons'
import { fullscreenSheet, modalScrim } from '@/ui/motion'
import { buildPlan, PLAN_LABEL, PLAN_START } from './plan'
import { PlanDocument } from './PlanDocument'
import { approvePlan } from './send'

export function PlanFullscreen() {
  const { t } = useT()
  const answers = useWorld((s) => s.world.brief.answers)
  const simple = useWorld((s) => s.world.planSimple)
  const planning = useWorld((s) => s.world.brief.status === 'planning')
  const tall = useUI((s) => s.planTall)
  const close = useUI((s) => s.togglePlanTall)
  const page = useUI((s) => s.page)
  const sheet = useRef<HTMLDivElement>(null)
  const open = simple && planning && tall && page === 'builder'
  const plan = buildPlan(answers)

  /* Escape closes it — the shell's own ladder, and the only keyboard way out of a sheet that
     covers the screen. Bound while it is open and nowhere else. */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      /* A line being edited owns Escape first (PlanEditable puts the old text back and
         blurs); only a press with nothing focused inside closes the sheet. */
      const el = document.activeElement as HTMLElement | null
      if (el && el.isContentEditable) return
      e.stopPropagation()
      close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  /* The sheet takes focus on open so the Tab order starts inside it, not behind it. */
  useEffect(() => { if (open) sheet.current?.focus({ preventScroll: true }) }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true"
          aria-label={t({ en: 'Build Plan, full screen', uk: 'План збірки, на весь екран' })}>
          {/* 50% black — the page's own dim, the value the picker's board gives (28616:59963).
              Clicking it is the third way out, after the chevron and Escape. */}
          <motion.div
            variants={modalScrim}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={close}
            className="absolute inset-0 bg-[rgba(0,0,0,0.5)]"
          />
          {/* inset 16 — his number, and the house's full-screen inset. The material is the
              dock's own (#1a1a1c under a 15% rim at radius 24), so the sheet reads as the same
              object the card is made of rather than as a new surface. */}
          <motion.div
            ref={sheet}
            tabIndex={-1}
            data-plan-sheet
            variants={fullscreenSheet}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-4 flex flex-col overflow-hidden rounded-[24px] bg-[#1a1a1c] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)] outline-none"
          >
            {/* the card's own header, at the same 56 with the same cap-trimmed title */}
            <div className="flex h-[56px] flex-none items-stretch pl-4 pr-2">
              <div className="flex flex-1 items-center gap-2.5 pb-[18px] pt-5">
                <p className="flex-1 [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] text-[18px] font-semibold leading-[1.4] text-white">
                  {t(PLAN_LABEL)}
                </p>
                {/* ⚠️ A ✕, not the card's fold chevron. Every full-screen surface in this shell
                    closes with the house cross (the picker, the domains window, the plan
                    surface) — and at 24px the inward chevron pair reads as a cross anyway, so
                    the honest glyph is the one the product already uses. */}
                <Tooltip interactive text={{ en: 'Put the plan back', uk: 'Повернути план' }}>
                  <button
                    type="button"
                    data-plan-fold
                    onClick={close}
                    aria-label={t({ en: 'Put the plan back', uk: 'Повернути план' })}
                    className="press-bloom grid h-10 w-10 flex-none place-items-center rounded-[10px] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
                  >
                    <IconCloseM size={24} />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* the window, grown: same material and radius as the card's, filling what is left */}
            <div className="relative mx-1.5 min-h-0 flex-1 overflow-hidden rounded-[16px] bg-[#09090b29] shadow-[inset_0_0_0_1px_#ffffff14]">
              <ScrollArea className="h-full" thumb="light">
                <div className="mx-auto w-full max-w-[800px]">
                  <PlanDocument plan={plan} />
                </div>
              </ScrollArea>
            </div>

            {/* the same decision, in the same place: the footer's own board numbers */}
            <footer className="flex flex-none items-center justify-end px-2.5 pb-4 pt-3">
              <button
                type="button"
                data-plan-start-full
                onClick={approvePlan}
                className="press-bloom h-8 rounded-[8px] bg-[var(--action)] px-3.5 text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)] active:bg-[var(--action-pressed)]"
              >
                {t(PLAN_START)}
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
