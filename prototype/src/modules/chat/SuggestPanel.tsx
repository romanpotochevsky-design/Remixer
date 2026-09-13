/**
 * AUTOPILOT'S PROPOSAL — the panel Remixer sends by itself.
 *
 * Designer, 09.09.2026, on what the mode is: "это режим когда чат сам присылает форму с
 * выбором и рекомендацией что делать дальше… для пользователей которые вообще не шарят",
 * pointing at the question panel's own board (29464:33917) — so the FORM IS ALREADY DRAWN.
 * There is nothing new to design here and nothing invented: the shell, the answers card, the
 * rows, both rings, the "Write your own…" field and the motion all come from `BriefPanel`,
 * which is why the pieces this shares with it were lifted out of it rather than copied.
 *
 * What is different is only what a single, unasked-for question makes different:
 *
 *  · **No paging and no "Skip all".** The brief is four questions in a row; this is one.
 *    Two arrows that cannot move and a "skip ALL" with nothing behind the word would be
 *    controls describing a flow that is not happening.
 *
 *  · **The footer's second button turns the MODE off** (designer, 09.09.2026: "может вместо
 *    Not now кнопку дать типа отключить Autopilot"). The soft way out already exists and
 *    needs no button — the composer inside the shell is live, and typing dismisses the
 *    question, exactly as it does during the brief. So the space goes to the thing that has
 *    nowhere else to be: the person tired of being led is looking at this panel, not at the
 *    mode pill two rows down.
 *
 *  · **It arrives with its recommendation picked.** A proposal whose rows all start empty is
 *    a quiz; the point of the mode is that Remixer has an opinion. The picked row wears the
 *    same 2px drawn ring a chosen brief answer wears, so "recommended" and "chosen" are the
 *    same state — which is the truth: press the button and that is what happens.
 *
 * The proposal itself is compiled in `autopilot.ts` from the plan the customer agreed to.
 */
import { motion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useT } from '@/i18n'
import { sheetExit } from '@/ui/motion'
import { FIELD, PickDefs, Radio, Row } from './BriefPanel'
import { OTHER } from './brief'
import { nextProposal, recommended } from './autopilot'
import { acceptSuggest, asOther, pickSuggest, turnOffAutopilot } from './send'
import { useDockSheet } from './dock'

export function SuggestPanel() {
  const { t } = useT()
  const answers = useWorld((s) => s.world.brief.answers)
  const suggest = useWorld((s) => s.world.suggest)
  const published = useWorld((s) => s.world.published)
  /* the structure the customer drew in the plan — a proposal offers the page they named */
  const planEdits = useWorld((s) => s.world.planEdits)

  const proposal = nextProposal(answers, suggest.started, published, planEdits.outline)
  /* The dock morphs when the sheet's height changes; a proposal shrinks by a row each time
     a page is started, so the count is what identifies "a different sheet" here. */
  const sheet = useDockSheet<HTMLElement>(proposal?.options.length ?? 0)

  const own = suggest.pick.startsWith(OTHER) ? suggest.pick.slice(OTHER.length) : ''
  const picked = suggest.pick.startsWith(OTHER) ? null : suggest.pick

  // Enter in the free-text field takes the proposal up, as it does in the brief.
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); acceptSuggest() }
  }

  if (!proposal) return null

  const option = proposal.options.find((o) => o.id === picked)
  /* The blue button names what the press will DO — the plan card's rule (`Start Building`
     rather than `Approve`), applied to a panel whose rows do different things. With free
     text in the field there is nothing to name but the sending of it. */
  const verb = option ? t(option.verb) : t({ en: 'Send', uk: 'Надіслати' })

  return (
    <motion.section
      ref={sheet.ref}
      initial={false}
      animate={{ opacity: 1 }}
      variants={sheetExit}
      exit="exit"
      aria-label={t({ en: 'What Remixer suggests next', uk: 'Що Remixer пропонує далі' })}
      className="relative z-20"
    >
      <PickDefs />
      <div className="dock-clip">
        <div className="dock-sheet relative">
          {/* the question, on the glass itself — 29464:34352 */}
          <p className="px-4 pb-[18px] pt-5 text-[16px] font-semibold leading-[1.4] text-white">
            {t(proposal.question)}
          </p>
          <div className="overflow-hidden rounded-[16px] border border-[#ffffff14] bg-[#09090b8f]">
            {/* ⚠️ The FIRST row is the recommendation, and the panel already arrives with it
                chosen — "recommended" and "selected" have been one state here since 09.09,
                because the blue button does exactly that row. The plate makes the claim
                readable instead of leaving it to the ring. */}
            {proposal.options.map((o, i) => (
              <Row
                key={o.id}
                name={o.name}
                detail={o.detail}
                recommended={i === 0}
                on={picked === o.id}
                onPick={() => pickSuggest(o.id)}
              />
            ))}
            <div className="flex items-start gap-3 px-4 pb-4 pt-2">
              <span className="flex h-[42px] items-center">
                <Radio on={!!own} />
              </span>
              <input
                value={own}
                /* Clearing the field puts the RECOMMENDATION back rather than leaving nothing
                   picked: a proposal always has one, and an empty pick would leave the blue
                   button naming "Send" with nothing to send. */
                onChange={(e) => pickSuggest(e.target.value ? asOther(e.target.value) : recommended(proposal))}
                onKeyDown={onKey}
                placeholder={t(proposal.placeholder)}
                aria-label={t(proposal.question)}
                className={FIELD}
              />
            </div>
          </div>
        </div>
      </div>

      {/* The footer keeps the brief's metrics (pt 12 / pb 16 + the shell's 2px, pr 10) and
          loses its left half: there is nothing to page through. Both buttons take the house
          press bloom, and only the blue one owns a fill, so only the utilitarian one needs
          the shell's `--white-100` hover. */}
      <footer className="dock-foot flex items-end justify-end gap-2 pb-[18px] pl-1.5 pr-2.5 pt-3">
        <button
          type="button"
          onClick={turnOffAutopilot}
          className="press-bloom h-8 rounded-[8px] px-3.5 text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
        >
          {t({ en: 'Turn off Autopilot', uk: 'Вимкнути Autopilot' })}
        </button>
        <button
          type="button"
          onClick={acceptSuggest}
          className="press-bloom h-8 rounded-[8px] bg-[var(--action)] px-3.5 text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)] active:bg-[var(--action-pressed)]"
        >
          {verb}
        </button>
      </footer>
    </motion.section>
  )
}
