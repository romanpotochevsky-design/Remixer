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
 * `Start Building` on the right — so the decision can be made here without scrolling back to
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
import { buildPlan, PLAN_LABEL, PLAN_START } from './plan'
import { PlanEditable, focusPlanBlock } from './PlanEditable'
import { PlanOutline } from './PlanOutline'
import { PlanDecisions } from './PlanDecision'
import { editPlanItems, editPlanText } from './send'
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
  const edits = useWorld((s) => s.world.planEdits)
  /** What this line says now: the customer's words if they wrote any, else the compiled ones. */
  const read = (path: string, fallback: string) => edits.text[path] ?? fallback

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
      {/* the bar: close · title · Start Building — the same 48px the domains surface uses */}
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
            {t(PLAN_START)}
          </button>
        </div>
      </div>

      {/* the document. A measure of 640 centred in whatever the canvas gives it: a plan is
          read, and prose at canvas width would be unreadable at 1600px. */}
      <div className="min-h-0 flex-1 rounded-t-[8px] border-t border-[var(--white-100)] bg-[var(--gray-900)]">
        <ScrollArea className="h-full" thumb="light">
          {/* 30107:53167 — the document is 800 wide, centred in whatever the canvas gives it.
                Its prose sits at x=8 inside that; the blocks run the full width. */}
          <div className="px-8 pb-16 pt-10">
            {/* 30107:53167 — prose sits at x=8 of the 800, the blocks run its full width.
                  The inset is the COLUMN's: `.plan-edit` already owns a margin of
                  its own (its hover surface) and would beat a utility on the line. */}
            <div className="plan-doc mx-auto w-full max-w-[800px] px-2">
            {/*
              * THE DOCUMENT IS THE CUSTOMER'S TO REWRITE. Every line here is editable in place
              * — the heading, the goal, a paragraph, a bullet — and the bullets behave like a
              * list: Enter opens the next one, Backspace on an empty one closes it. The edits
              * are a layer over the compiled plan (`world.planEdits`), so the card in the dock
              * shows the same sentences without a second copy of them existing anywhere.
              *
              * ⚠️ EDITING THE PLAN DOES NOT RE-PLAN THE BUILD. What gets generated compiles
              * from the brief's answers, not from this prose (build.ts), and in this prototype
              * that is one hardcoded page either way. So the document is the customer's record
              * of what was agreed and can be corrected like one — it is not a command line.
              * Said here because the opposite is exactly what somebody would assume.
              */}
            <PlanEditable
              as="h1"
              path="title"
              value={read('title', t(plan.title))}
              onCommit={(v) => editPlanText('title', v, t(plan.title))}
              label={t({ en: 'Plan title', uk: 'Заголовок плану' })}
              className="font-display text-[48px] font-medium leading-[1.1] text-white"
            />

            <h2 className="mt-4 text-[20px] font-semibold leading-[25px] text-white">
              {t({ en: 'Goal', uk: 'Мета' })}
            </h2>
            <PlanEditable
              path="goal"
              value={read('goal', t(plan.goal))}
              onCommit={(v) => editPlanText('goal', v, t(plan.goal))}
              label={t({ en: 'The goal, in a paragraph', uk: 'Мета, одним абзацом' })}
              className="mt-[9px] text-[16px] leading-[1.4] text-[var(--white-720)]"
            />

            {plan.sections.map((section, i) => {
              const items = edits.items[i] ?? (section.items ?? []).map((x) => t(x))
              const setItems = (next: string[]) => editPlanItems(i, next)
              /* Hoisted: TypeScript narrows `section.body` for the JSX guard but not inside
                 the callback under it, which closes over the section rather than the guard. */
              const body = section.body ? t(section.body) : null
              return (
              <div key={section.heading.en}>
                <PlanEditable
                  as="h2"
                  path={`s${i}:h`}
                  value={read(`s${i}:h`, t(section.heading))}
                  onCommit={(v) => editPlanText(`s${i}:h`, v, t(section.heading))}
                  label={t({ en: 'Section heading', uk: 'Заголовок розділу' })}
                  className="mt-8 text-[20px] font-semibold leading-[25px] text-white"
                />
                {body !== null && (
                  <PlanEditable
                    path={`s${i}:b`}
                    value={read(`s${i}:b`, body)}
                    onCommit={(v) => editPlanText(`s${i}:b`, v, body)}
                    label={t({ en: 'Section text', uk: 'Текст розділу' })}
                    className="mt-[9px] text-[16px] leading-[1.4] text-[var(--white-720)]"
                  />
                )}
                {/* WHAT THIS SECTION DRAWS (plan.ts `draws`). The stack goes between the
                    section's lede and its bullets — the sentence introduces it, the bullets
                    describe what lands on the page it names. The decision cards REPLACE
                    their section's prose: the same two facts, as controls. */}
                {section.draws === 'outline' && <PlanOutline />}
                {section.draws === 'decisions' && <PlanDecisions />}
                {section.draws !== 'decisions' && items.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-2.5">
                    {items.map((item, j) => (
                      <li key={`${i}:${j}`} className="flex gap-3 text-[16px] leading-[1.4] text-[var(--white-720)]">
                        {/* a dot rather than a list-style marker: it stays aligned with the
                            first line when an item wraps to three */}
                        <span aria-hidden className="mt-[9px] h-1 w-1 flex-none rounded-full bg-[#ffffff7a]" />
                        <PlanEditable
                          path={`s${i}:${j}`}
                          value={item}
                          className="flex-1"
                          label={t({ en: 'Plan item', uk: 'Пункт плану' })}
                          onCommit={(v) => { if (v !== item) setItems(items.map((x, k) => (k === j ? v : x))) }}
                          onEnter={(v) => {
                            const next = items.map((x, k) => (k === j ? v : x))
                            next.splice(j + 1, 0, '')
                            setItems(next)
                            focusPlanBlock(`s${i}:${j + 1}`)
                          }}
                          onEmptyBackspace={() => {
                            if (items.length === 1) return
                            setItems(items.filter((_, k) => k !== j))
                            if (j > 0) focusPlanBlock(`s${i}:${j - 1}`)
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                )}
                {/* the closing paragraph, under whatever the section drew */}
                {section.after && (
                  <PlanEditable
                    path={`s${i}:after`}
                    value={read(`s${i}:after`, t(section.after))}
                    onCommit={(v) => editPlanText(`s${i}:after`, v, t(section.after!))}
                    label={t({ en: 'Section text', uk: 'Текст розділу' })}
                    className="mt-3 text-[16px] leading-[1.4] text-[var(--white-720)]"
                  />
                )}
              </div>
              )
            })}
            </div>
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  )
}
