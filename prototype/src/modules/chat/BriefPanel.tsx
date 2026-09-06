/**
 * The question panel — docked ABOVE the composer while the pre-build brief is open.
 *
 * Geometry and behaviour copied from Lovable's live flow (screen recording,
 * 06.09.2026, docs/audits/lovable-prebuild-flow/06…10): one question at a time in a
 * card the width of the composer; the question as the card's header with a collapse
 * chevron; a free-text field, or a 2×2 grid of choices with a "Write your own…" field
 * under it; a footer with ‹ › paging on the left and "Skip all" + a blue "Next" on the
 * right, "Next" becoming "Submit" on the last question. The composer under it stays
 * live and re-labels itself "Tell Remixer what to do instead…".
 */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useT } from '@/i18n'
import { IconChevronLeft, IconChevronRight, IconChevronDown, IconChevronUp } from '@/ui/icons'
import { SPRING_SOFT, EXIT } from '@/ui/motion'
import { BRIEF_QUESTIONS, OTHER, type BriefQuestion } from './brief'
import { answerBrief, briefGoTo, briefNext, briefSkipAll, asOther } from './send'

const panelIn = {
  initial: { opacity: 0, y: 14, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: SPRING_SOFT },
  exit: { opacity: 0, y: 10, scale: 0.99, transition: EXIT },
}

/** A step arriving: rises a touch, the way the domain lists hand over. */
const stepIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: SPRING_SOFT },
}

const field =
  'block h-11 w-full rounded-[10px] border border-[var(--white-200)] bg-[#ffffff0a] px-3.5 text-[14px] text-white outline-none transition-colors duration-[var(--dur-fast)] ease-std placeholder:text-[var(--white-400)] focus:border-[var(--action)]'

/** One choice card. Selected = a solid white rim, exactly Lovable's cue. */
function Choice({ selected, onClick, children, className = '', label }: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      className={`overflow-hidden rounded-[10px] text-left transition-[box-shadow,border-color] duration-[var(--dur-fast)] ease-std ${
        selected
          ? 'border border-transparent shadow-[0_0_0_1.5px_#ffffff]'
          : 'border border-[var(--white-200)] hover:border-[var(--white-300)]'
      } ${className}`}
    >
      {children}
    </button>
  )
}

function Body({ q }: { q: BriefQuestion }) {
  const { t } = useT()
  const answers = useWorld((s) => s.world.brief.answers)
  const value = answers[q.key]
  const own = value && value.startsWith(OTHER) ? value.slice(OTHER.length) : ''
  const picked = value && !value.startsWith(OTHER) ? value : null
  const input = useRef<HTMLInputElement>(null)

  // The free-text field takes focus as each question arrives — you can just type.
  useEffect(() => {
    if (q.kind === 'text') input.current?.focus()
  }, [q.key])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); briefNext() }
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-4">
      {q.kind === 'palette' && q.options && (
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((o) => (
            <Choice key={o.id} selected={picked === o.id} onClick={() => answerBrief(q.key, o.id)} className="h-14" label={t(o.name)}>
              <span className="flex h-full w-full">
                {o.swatches!.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}
              </span>
            </Choice>
          ))}
        </div>
      )}

      {q.kind === 'typography' && q.options && (
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((o) => (
            <Choice key={o.id} selected={picked === o.id} onClick={() => answerBrief(q.key, o.id)} className="bg-[#ffffff05]">
              <span className="block border-b border-[var(--white-100)] px-4 pb-3 pt-3">
                <span className="block text-[17px] leading-[24px] text-white" style={{ fontFamily: `'${o.heading}', 'Outfit', system-ui, sans-serif` }}>
                  Title - {o.heading}
                </span>
                <span className="block text-[13px] leading-[18px] text-[var(--white-500)]" style={{ fontFamily: `'${o.body}', 'Figtree', system-ui, sans-serif` }}>
                  Body - {o.body}
                </span>
              </span>
              <span className="block px-4 pb-3 pt-3">
                <span className="block text-[13px] font-semibold leading-[18px] text-white">{t(o.name)}</span>
                <span className="mt-0.5 block text-[12px] leading-[17px] text-[var(--white-500)]">{o.detail ? t(o.detail) : null}</span>
              </span>
            </Choice>
          ))}
        </div>
      )}

      <input
        ref={input}
        value={own}
        onChange={(e) => answerBrief(q.key, asOther(e.target.value))}
        onKeyDown={onKey}
        placeholder={t(q.placeholder)}
        aria-label={t(q.question)}
        className={field}
      />
    </div>
  )
}

export function BriefPanel() {
  const { t } = useT()
  const brief = useWorld((s) => s.world.brief)
  const [collapsed, setCollapsed] = useState(false)
  const open = brief.status === 'asking'
  const step = brief.step
  const q = BRIEF_QUESTIONS[step]
  const last = step === BRIEF_QUESTIONS.length - 1

  // A fresh brief always arrives expanded.
  useEffect(() => { if (open) setCollapsed(false) }, [open])

  return (
    <AnimatePresence>
      {open && q && (
        <motion.section
          key="brief"
          variants={panelIn}
          initial="initial"
          animate="animate"
          exit="exit"
          aria-label={t({ en: 'Questions before building', uk: 'Запитання перед збіркою' })}
          className="brief-panel relative z-20 mb-2 origin-bottom overflow-hidden rounded-[20px] border border-[var(--white-200)] bg-[var(--gray-900)]"
        >
          <header className="flex items-start justify-between gap-4 px-4 pb-3.5 pt-4">
            <p className="text-[15px] leading-[22px] text-white">{t(q.question)}</p>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? t({ en: 'Expand question', uk: 'Розгорнути запитання' }) : t({ en: 'Collapse question', uk: 'Згорнути запитання' })}
              className="-mr-1 -mt-1 grid h-7 w-7 flex-none place-items-center rounded-[8px] text-[var(--white-500)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white"
            >
              {collapsed ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </button>
          </header>

          {!collapsed && (
            <>
              <div className="border-t border-[var(--white-100)]">
                <motion.div key={q.key} variants={stepIn} initial="initial" animate="animate">
                  <Body q={q} />
                </motion.div>
              </div>

              <footer className="flex items-center justify-between border-t border-[var(--white-100)] px-2 py-2">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => briefGoTo(step - 1)}
                    disabled={step === 0}
                    aria-label={t({ en: 'Previous question', uk: 'Попереднє запитання' })}
                    className="grid h-8 w-8 place-items-center rounded-[8px] text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] disabled:cursor-default disabled:text-[var(--white-300)] disabled:hover:bg-transparent"
                  >
                    <IconChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => briefGoTo(step + 1)}
                    disabled={last}
                    aria-label={t({ en: 'Next question', uk: 'Наступне запитання' })}
                    className="grid h-8 w-8 place-items-center rounded-[8px] text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] disabled:cursor-default disabled:text-[var(--white-300)] disabled:hover:bg-transparent"
                  >
                    <IconChevronRight size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={briefSkipAll}
                    className="h-8 rounded-[8px] px-3 text-[13px] font-medium text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white"
                  >
                    {t({ en: 'Skip all', uk: 'Пропустити все' })}
                  </button>
                  <button
                    type="button"
                    onClick={briefNext}
                    className="h-8 rounded-[8px] bg-[var(--action)] px-3.5 text-[13px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
                  >
                    {last ? t({ en: 'Submit', uk: 'Готово' }) : t({ en: 'Next', uk: 'Далі' })}
                  </button>
                </div>
              </footer>
            </>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  )
}
