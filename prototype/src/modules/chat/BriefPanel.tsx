/**
 * The question panel — Remixer's own, off Figma 29464:34333 / 34334 / 34335
 * (board "Website Builder / Image Library / Expanded view", read 07.09.2026 when the
 * designer pointed at it).
 *
 * ⚠️ THE PANEL AND THE COMPOSER ARE ONE GLASS OBJECT, not two stacked ones. That is the
 * board's structural decision and the biggest difference from Lovable, whose panel floats
 * 8px above its composer as a separate card. Here a single shell — 7% white over the
 * chat's ground, 15% white rim, blur 16, radius 24 on top and 28 at the bottom — holds the
 * question, the answers and the live composer, with 2px between the card and the field.
 * The shell is mounted by ChatPanel (see `.brief-dock`), because the composer has to live
 * inside it; this file draws what goes above the composer.
 *
 * The answers are a RADIO LIST, not Lovable's 2×2 grid: one row per option, a 16px radio,
 * a 15px title and a 14px line of consequence under it — "what happens if I pick this" —
 * and a last row whose body is the "Write your own…" field. That shape is why the board
 * can ask a question Lovable's grid cannot ("Show 3 design options before building?", the
 * copy drawn on the node), and it is what the designer meant by "the component where you
 * choose answers, palette, fonts".
 *
 * Where the board is silent, this file says so at the point of the decision:
 *  - the palette rows carry their swatches in the description slot (undrawn — §palette)
 *  - a text-only question renders the field alone, with no radio beside it (§text)
 *  - there is no collapse chevron: the board does not draw one (Lovable's had one)
 */
import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useT } from '@/i18n'
import { IconCaretLeft, IconCaretRight } from '@/ui/icons'
import { SPRING_SOFT, EXIT } from '@/ui/motion'
import { BRIEF_QUESTIONS, OTHER, type BriefQuestion, type BriefOption } from './brief'
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

/** The "Write your own…" / "Your answer…" field — Text field I29464:34377;17122:41625. */
const FIELD =
  'block h-10 w-full rounded-[8px] border border-[#ffffff1f] bg-[#09090b29] pl-4 pr-2 text-[14px] text-white outline-none transition-colors duration-[var(--dur-fast)] ease-std placeholder:text-[#ffffff7a] focus:border-[var(--action)]'

/**
 * The radio (29464:34358 selected / 34366 idle).
 *
 * Selected is a filled `--action` disc with an 8px white pip — Neutral Alpha/1000, which
 * resolves WHITE in the dark theme. (The MCP export prints the light-mode fallback
 * `#09090b` for that token, which would draw a hole instead of a pip; the same trap
 * CLAUDE.md records for the composer's own tokens. Read the render, not the fallback.)
 */
function Radio({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid h-4 w-4 flex-none place-items-center rounded-full border ${
        on ? 'border-[var(--action)] bg-[var(--action)]' : 'border-[#ffffff7a]'
      }`}
    >
      {on && <span className="h-2 w-2 rounded-full bg-white" />}
    </span>
  )
}

/**
 * One answer row: radio · title · consequence. The row is the click target, so picking
 * an option is a press anywhere on the line rather than on a 16px dot.
 */
function Row({ q, o, on, last }: { q: BriefQuestion; o: BriefOption; on: boolean; last: boolean }) {
  const { t } = useT()
  return (
    <button
      type="button"
      onClick={() => answerBrief(q.key, o.id)}
      aria-pressed={on}
      /* Named explicitly: a palette row's body is four colours and carries no text at
         all, so without this the row would announce itself by its title alone in some
         readings and by nothing in others. */
      aria-label={t(o.name)}
      /* Row 1 is drawn pt-18/pb-19, row 2 py-18 — a one-pixel difference that reads as
         the divider's own weight; both are taken as 18/19 with the hairline between. */
      className={`flex w-full items-start gap-3 pb-[19px] pl-4 pr-6 pt-[18px] text-left transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-050)] ${
        last ? '' : 'border-b border-[#ffffff0a]'
      }`}
    >
      <span className="flex items-center pt-1.5">
        <Radio on={on} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-medium leading-[1.4] text-white">{t(o.name)}</span>
        {/* §palette — UNDRAWN, our call, flagged to the designer: the board has no palette
            variant of this row, so the four colours ride in the consequence slot. A strip
            keeps the row's height and the eye still gets the thing it is choosing. */}
        {o.swatches ? (
          <span className="mt-1 flex h-4 w-40 overflow-hidden rounded-[4px]">
            {o.swatches.map((c) => (
              <span key={c} className="flex-1" style={{ background: c }} />
            ))}
          </span>
        ) : (
          // `detail` already names the pair — "Instrument Serif headings + Work Sans
          // body. Magazine-quality, refined." — so it prints as written; prefixing the
          // typefaces here said each of them twice.
          <span className="text-[14px] leading-[1.4] text-[#ffffffa3]">
            {o.detail ? t(o.detail) : null}
          </span>
        )}
      </span>
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
  const options = q.options ?? []

  // The field takes focus as each question arrives — you can just type.
  useEffect(() => { if (!options.length) input.current?.focus() }, [q.key, options.length])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); briefNext() }
  }

  return (
    /* The answers card — 29464:34354: Black/600 over the shell, an 8% white rim, radius 16.
       It is the only surface inside the shell; the question and the footer sit on the glass. */
    <div className="mt-[18px] overflow-hidden rounded-[16px] border border-[#ffffff14] bg-[#09090b8f]">
      {options.map((o, i) => (
        <Row key={o.id} q={q} o={o} on={picked === o.id} last={i === options.length - 1} />
      ))}

      {/* §text — a question with nothing to choose between gets the field alone. The board's
          last row pairs the field with a radio, which only means anything as one option
          among several; beside a lone field it would be a control with one setting. */}
      <div className={options.length ? 'flex items-start gap-3 px-4 pb-4 pt-2' : 'p-4'}>
        {options.length > 0 && (
          <span className="flex h-10 items-center">
            <Radio on={!!own} />
          </span>
        )}
        <input
          ref={input}
          value={own}
          onChange={(e) => answerBrief(q.key, asOther(e.target.value))}
          onKeyDown={onKey}
          placeholder={t(q.placeholder)}
          aria-label={t(q.question)}
          className={FIELD}
        />
      </div>
    </div>
  )
}

export function BriefPanel() {
  const { t } = useT()
  const brief = useWorld((s) => s.world.brief)
  const open = brief.status === 'asking'
  const step = brief.step
  const q = BRIEF_QUESTIONS[step]
  const last = step === BRIEF_QUESTIONS.length - 1

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
          className="relative z-20 origin-bottom px-1.5"
        >
          {/* the question, 29464:34352 — 16px semibold on the glass itself, pt 20 / pb 18 */}
          <p className="px-4 pb-[18px] pt-5 text-[16px] font-semibold leading-[1.4] text-white">
            {t(q.question)}
          </p>

          <motion.div key={q.key} variants={stepIn} initial="initial" animate="animate" className="-mt-[18px]">
            <Body q={q} />
          </motion.div>

          {/* footer 29464:34378 — paging left, Skip all + Next right, both on the glass */}
          <footer className="flex items-end justify-between pb-4 pl-1.5 pr-2.5 pt-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => briefGoTo(step - 1)}
                disabled={step === 0}
                aria-label={t({ en: 'Previous question', uk: 'Попереднє запитання' })}
                /* the board dims the unavailable arrow to 25% rather than recolouring it */
                className="grid h-8 w-8 place-items-center rounded-[8px] text-white transition-[background-color,opacity] duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent"
              >
                <IconCaretLeft size={24} />
              </button>
              <button
                type="button"
                onClick={() => briefGoTo(step + 1)}
                disabled={last}
                aria-label={t({ en: 'Next question', uk: 'Наступне запитання' })}
                className="grid h-8 w-8 place-items-center rounded-[8px] text-white transition-[background-color,opacity] duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent"
              >
                <IconCaretRight size={24} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={briefSkipAll}
                className="h-8 rounded-[8px] px-3.5 text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
              >
                {t({ en: 'Skip all', uk: 'Пропустити все' })}
              </button>
              <button
                type="button"
                onClick={briefNext}
                className="h-8 rounded-[8px] bg-[var(--action)] px-3.5 text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
              >
                {last ? t({ en: 'Submit', uk: 'Готово' }) : t({ en: 'Next', uk: 'Далі' })}
              </button>
            </div>
          </footer>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
