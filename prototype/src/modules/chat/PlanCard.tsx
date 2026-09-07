/**
 * The plan, docked where the questions were — the step that gates the first build.
 *
 * Shape from the screenshots the designer sent of Lovable's Plan mode: a card carrying the
 * plan's title and the start of its text, CLIPPED with a fade at the bottom, and a footer
 * of `Review` (outlined, left) and `Approve` (blue, right). It reuses the question panel's
 * own material — the same glass shell (`.brief-dock`), the same `#09090b8f` card at radius
 * 16, the same 32px footer buttons — because it is the same object at the next step, not a
 * new kind of thing.
 *
 * ⚠️ THE FADE IS A MASK ON THE BODY ONLY, never on an ancestor of the composer: a masked
 * ancestor is a backdrop root, and the glass controls inside the composer would sample
 * nothing and quietly stop blurring (CLAUDE.md, the prompt-chips lesson).
 *
 * ⚠️ `Skip` is in Lovable's footer and is NOT here. There it makes sense — Plan mode is
 * optional, so skipping means "never mind the plan, just build". Here the plan IS the
 * four questions' answer; a button that means "build without the thing I just asked you
 * for" would undo the flow. Flagged to the designer rather than shipped as a no-op.
 */
import { motion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useT } from '@/i18n'
import { SPRING_SOFT, EXIT } from '@/ui/motion'
import { buildPlan, PLAN_LABEL } from './plan'
import { approvePlan, reviewPlan } from './send'

const cardIn = {
  initial: { opacity: 0, y: 14, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: SPRING_SOFT },
  exit: { opacity: 0, y: 10, scale: 0.99, transition: EXIT },
}

export function PlanCard() {
  const { t } = useT()
  const answers = useWorld((s) => s.world.brief.answers)
  const plan = buildPlan(answers)
  const first = plan.sections[0]

  return (
    <motion.section
      key="plan"
      variants={cardIn}
      initial="initial"
      animate="animate"
      exit="exit"
      aria-label={t({ en: 'Plan, waiting for your approval', uk: 'План, очікує підтвердження' })}
      className="relative z-20 origin-bottom px-1.5"
    >
      <p className="px-4 pb-3 pt-5 text-[16px] font-semibold leading-[1.4] text-white">{t(PLAN_LABEL)}</p>

      <div className="overflow-hidden rounded-[16px] border border-[#ffffff14] bg-[#09090b8f]">
        {/* The clipped preview of the document. A fixed height and a mask, so the card is
            the same size whatever the plan says — and so the fade lands mid-sentence,
            which is what makes `Review` obviously the way to read the rest. */}
        <div
          className="px-4 pt-4"
          style={{
            height: 168,
            maskImage: 'linear-gradient(to bottom, #000 96px, transparent 164px)',
            WebkitMaskImage: 'linear-gradient(to bottom, #000 96px, transparent 164px)',
          }}
        >
          <p className="text-[15px] font-medium leading-[1.4] text-white">{t(plan.title)}</p>
          <p className="mt-2 text-[14px] leading-[1.5] text-[#ffffffa3]">{t(plan.goal)}</p>
          {first && (
            <p className="mt-3 text-[14px] font-medium leading-[1.4] text-white">{t(first.heading)}</p>
          )}
          {/* The whole first section, not its first line: the box is a fixed 168 and the
              fade has to land IN text. At the chat's 800px measure four short paragraphs
              did not reach the bottom, so the card read as a card with empty space rather
              than as a document that continues — which is what makes Review obvious. */}
          {first?.items?.map((item) => (
            <p key={item.en} className="mt-1 text-[14px] leading-[1.5] text-[#ffffffa3]">{t(item)}</p>
          ))}
        </div>
      </div>

      {/* No price line here. It read as a warning attached to the button rather than as
          information, and the footer is a decision — Review or Approve — not a receipt.
          (Designer, 07.09.2026: "этот текст нужно убрать".) */}
      <footer className="flex items-center justify-between pb-4 pl-1.5 pr-2.5 pt-3">
        <button
          type="button"
          onClick={reviewPlan}
          className="h-8 rounded-[8px] border border-[#ffffff3d] px-3.5 text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
        >
          {t({ en: 'Review', uk: 'Переглянути' })}
        </button>
        <button
          type="button"
          onClick={approvePlan}
          className="h-8 rounded-[8px] bg-[var(--action)] px-3.5 text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
        >
          {t({ en: 'Approve', uk: 'Підтвердити' })}
        </button>
      </footer>
    </motion.section>
  )
}
