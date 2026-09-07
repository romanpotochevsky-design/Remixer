/**
 * The plan at full size, in the canvas — where `Review` goes.
 *
 * A SURFACE, in this shell's own sense of the word (state/ui.ts): a module that renders in
 * place of the site preview without changing the layout around it, like the domains
 * dashboard. That is the right frame for it and not a coincidence — there is no site to
 * preview yet, so the canvas is free, and a document worth approving is worth more room
 * than a 168px card. Pressing Review therefore does exactly what the designer described:
 * the chat narrows back to its split width and the plan fills the rest.
 *
 * The bar carries what the screenshots carry: ✕ on the left, the title in the middle, and
 * `Approve` on the right — so the decision can be made from here without scrolling back to
 * the card. Same frame, radius and shadow as the domains surface, because they are
 * siblings.
 *
 * ⚠️ NO EDITING TOOLBAR. Lovable's plan is an editable document (their bottom bar has
 * B / I / Title / list). Ours is not, and a toolbar whose buttons do nothing is worse than
 * no toolbar — it invites the one interaction the prototype cannot honour. Making the plan
 * editable is a real feature; it is flagged, not faked.
 */
import { motion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useT } from '@/i18n'
import { ScrollArea } from '@/ui/ScrollArea'
import { IconClose } from '@/ui/icons'
import { SPRING_SOFT, EXIT } from '@/ui/motion'
import { buildPlan, PLAN_LABEL, PLAN_COST } from './plan'
import { approvePlan, closePlanReview } from './send'

const surfaceIn = {
  initial: { opacity: 0, y: 10, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1, transition: SPRING_SOFT },
  exit: { opacity: 0, scale: 0.995, transition: EXIT },
}

export function PlanSurface() {
  const { t } = useT()
  const answers = useWorld((s) => s.world.brief.answers)
  const plan = buildPlan(answers)

  return (
    <motion.div
      variants={surfaceIn}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex h-full flex-col overflow-hidden rounded-[16px] border border-[var(--gray-800)]"
      style={{
        background: 'linear-gradient(rgba(9,9,11,0.24), rgba(9,9,11,0.24)), var(--gray-900)',
        boxShadow: '0px 8px 8px rgba(0,0,0,0.12), 0px 56px 72px rgba(0,0,0,0.12)',
      }}
    >
      {/* the bar: close · title · Approve — the same 48px height the domains surface uses */}
      <div className="grid h-12 flex-none grid-cols-[1fr_auto_1fr] items-center px-2">
        <div>
          <button
            onClick={closePlanReview}
            aria-label={t({ en: 'Close the plan', uk: 'Закрити план' })}
            className="grid h-8 w-8 place-items-center rounded-[8px] bg-[var(--white-100)] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-200)]"
          >
            <IconClose size={11} />
          </button>
        </div>
        <span className="pb-px text-[13px] font-medium text-[#e4e4e7]">{t(PLAN_LABEL)}</span>
        <div className="flex justify-end">
          <button
            onClick={approvePlan}
            className="h-8 rounded-[8px] bg-[var(--action)] px-3.5 text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
          >
            {t({ en: 'Approve', uk: 'Підтвердити' })}
          </button>
        </div>
      </div>

      {/* the document. A measure of 640 centred in whatever the canvas gives it: a plan is
          read, and prose at canvas width would be unreadable at 1600px. */}
      <div className="min-h-0 flex-1 rounded-t-[8px] border-t border-[var(--white-100)] bg-[var(--gray-900)]">
        <ScrollArea className="h-full" thumb="light">
          <div className="mx-auto w-full max-w-[640px] px-8 pb-16 pt-10">
            <h1 className="font-display text-[28px] font-semibold leading-[1.25] text-white">{t(plan.title)}</h1>

            <h2 className="mt-8 text-[15px] font-semibold leading-[1.4] text-white">
              {t({ en: 'Goal', uk: 'Мета' })}
            </h2>
            <p className="mt-2 text-[15px] leading-[1.6] text-[#ffffffd9]">{t(plan.goal)}</p>

            {plan.sections.map((section) => (
              <div key={section.heading.en}>
                <h2 className="mt-8 text-[15px] font-semibold leading-[1.4] text-white">{t(section.heading)}</h2>
                {section.body && (
                  <p className="mt-2 text-[15px] leading-[1.6] text-[#ffffffd9]">{t(section.body)}</p>
                )}
                {section.items && (
                  <ul className="mt-3 flex flex-col gap-2.5">
                    {section.items.map((item) => (
                      <li key={item.en} className="flex gap-3 text-[15px] leading-[1.6] text-[#ffffffd9]">
                        {/* a dot rather than a list-style marker: it stays aligned with the
                            first line when an item wraps to three */}
                        <span aria-hidden className="mt-[9px] h-1 w-1 flex-none rounded-full bg-[#ffffff7a]" />
                        <span>{t(item)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <p className="mt-10 border-t border-[var(--white-100)] pt-5 text-[13px] leading-[1.5] text-[#ffffff7a]">
              {t(PLAN_COST)}
            </p>
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  )
}
