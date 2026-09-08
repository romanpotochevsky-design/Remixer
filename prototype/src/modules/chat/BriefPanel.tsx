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
 * TWO of the four questions are GRIDS rather than rows, and both drop the radio beside
 * their "Write your own…" field, which runs full width instead:
 *  - COLOUR (25732:139123) — a 2×2 grid of four swatch plates.
 *  - LETTERING — a 2×2 grid of cards that set each pair's name IN that pair, which is
 *    Lovable's treatment and what the designer asked for by name (07.09.2026). A question
 *    about type answered in words would ask someone to pick a face they cannot see.
 * A grid holds four; only the radio list is capped at three.
 *
 * Where the board is still silent, this file says so at the point of the decision:
 *  - a selected plate has no drawn state, so it takes a 2px ring in `--action`
 *  - there is no collapse chevron: the board does not draw one (Lovable's had one)
 */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useT } from '@/i18n'
import { IconCaretLeft, IconCaretRight } from '@/ui/icons'
import { sheetExit, stepSwap, stepSwapFade } from '@/ui/motion'
import { BRIEF_QUESTIONS, OTHER, type BriefQuestion, type BriefOption } from './brief'
import { answerBrief, briefGoTo, briefNext, briefSkipAll, asOther } from './send'
import { useDockSheet } from './dock'

/**
 * The "Write your own…" / "Your answer…" field — Text field I29464:34377;17122:41625.
 * 42 tall, not 40: the board's 40 is the state layer INSIDE a 1px rim. The placeholder is
 * `text/default/secondary`, which in the dark theme is the same `gray-400` the composer's
 * own placeholder uses two rows down — one grey for "type here" inside one shell.
 */
const FIELD =
  'block h-[42px] w-full rounded-[8px] border border-[#ffffff1f] bg-[#09090b29] pl-4 pr-2 text-[14px] text-white outline-none transition-colors duration-[var(--dur-fast)] ease-std placeholder:text-[var(--gray-400,#a1a1aa)] focus:border-[var(--action)]'

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
      /* `brief-radio-off` is what the row's hover brightens to 80% white (index.css);
         a selected radio is a filled disc and has nothing to brighten. */
      className={`grid h-4 w-4 flex-none place-items-center rounded-full border ${
        on ? 'border-[var(--action)] bg-[var(--action)]' : 'brief-radio-off border-[#ffffff7a]'
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
  /*
   * The click's own light: bumping this remounts the sheen, so the band crosses the
   * ring once per press — including a press on the row that is already picked, where
   * it is the only acknowledgement there is (designer, 08.09.2026).
   */
  const [sheen, setSheen] = useState(0)
  return (
    <button
      type="button"
      onClick={() => { setSheen((n) => n + 1); answerBrief(q.key, o.id) }}
      aria-pressed={on}
      data-on={on ? '' : undefined}
      /* Named explicitly: a palette row's body is four colours and carries no text at
         all, so without this the row would announce itself by its title alone in some
         readings and by nothing in others. */
      aria-label={t(o.name)}
      /* Drawn pt-18/pb-19 with the hairline under it, and py-18 on the last row, which has
         no hairline: the extra pixel above the divider keeps the rows' rhythm equal. */
      /* `brief-opt`: the hover is a 1px ring at radius 16 and nothing else — index.css
         "THE ANSWER ROW'S HOVER", off Figma 29688:26919. No fill, no movement. */
      className={`brief-opt relative flex w-full items-start gap-3 pl-4 pr-6 pt-[18px] text-left ${
        last ? 'pb-[18px]' : 'border-b border-[#ffffff0a] pb-[19px]'
      }`}
    >
      {/* the 2px gradient ring of the picked row, and the light that crosses it on a
          press — index.css "THE SELECTED ROW", off Figma 29688:27643 */}
      {on && <span className="brief-rim" aria-hidden />}
      {sheen > 0 && (
        /* unmounted the moment it has crossed: a finished sheen is a masked
           798×80 layer with nothing left to say, and this project has been bitten
           before by an invisible layer that still cost paint (CLAUDE.md, the
           `Preview` pill at opacity 0). */
        <span key={sheen} className="brief-sheen" aria-hidden onAnimationEnd={() => setSheen(0)}>
          <i />
        </span>
      )}
      <span className="flex items-center pt-1.5">
        <Radio on={on} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-medium leading-[1.4] text-white">{t(o.name)}</span>
        {/* the consequence — what changes on the page if this is picked (29464:34362) */}
        <span className="text-[14px] leading-[1.4] text-[#ffffffa3]">{o.detail ? t(o.detail) : null}</span>
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

  /*
   * The colour question is the one with nothing to read, so the board gives it a shape of
   * its own (25732:139123): a 2×2 grid of 40px plates, four cells each, 8px between them,
   * and — this is the tell — the "Write your own…" field full width with NO radio beside
   * it. On the radio list the field is one option among several and needs its dot; here
   * selection lives on the plate, so a radio would be a second, contradictory control.
   * That is also why a text-only question renders its field alone.
   */
  const swatchGrid = q.kind === 'palette' && options.length > 0
  const typeGrid = q.kind === 'typography' && options.length > 0
  const grid = swatchGrid || typeGrid

  return (
    /* The answers card — 29464:34354: Black/600 over the shell, an 8% white rim, radius 16.
       It is the only surface inside the shell; the question and the footer sit on the glass. */
    <div className="overflow-hidden rounded-[16px] border border-[#ffffff14] bg-[#09090b8f]">
      {swatchGrid && (
        <div className="grid grid-cols-2 gap-2 px-4 pb-2 pt-4">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => answerBrief(q.key, o.id)}
              aria-pressed={picked === o.id}
              aria-label={t(o.name)}
              title={t(o.name)}
              /* Selection cue is OURS — the board draws no selected plate. A 2px ring in
                 `--action` outside the plate: the same blue the radio uses, and a
                 box-shadow rather than a border so nothing in the grid moves. */
              className="flex h-10 overflow-hidden rounded-[8px] border border-[#ffffff0a] transition-shadow duration-[var(--dur-fast)] ease-std"
              style={picked === o.id ? { boxShadow: '0 0 0 2px var(--action)' } : undefined}
            >
              {o.swatches!.map((c) => (
                <span key={c} className="h-full flex-1" style={{ background: c }} />
              ))}
            </button>
          ))}
        </div>
      )}

      {/*
        * The lettering question, as the designer asked for it (07.09.2026, "как это в
        * ловбл сделано"): a 2×2 grid of cards, and each card SETS ITS PAIR'S NAME IN THAT
        * PAIR. That is the whole point — a question about type answered in words would be
        * asking someone to choose a typeface they cannot see. All six faces are bundled
        * for it, subset to the one line each draws (index.css, src/fonts/OFL.txt).
        *
        * Two blocks with a hairline between them, exactly as Lovable's card: the specimen
        * on top, the style's name and what it reads like underneath.
        */}
      {typeGrid && (
        <div className="grid grid-cols-2 gap-3 px-4 pb-2 pt-4">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => answerBrief(q.key, o.id)}
              aria-pressed={picked === o.id}
              aria-label={t(o.name)}
              className="overflow-hidden rounded-[12px] border border-[#ffffff14] bg-[#ffffff05] text-left transition-shadow duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-050)]"
              style={picked === o.id ? { boxShadow: '0 0 0 2px var(--action)' } : undefined}
            >
              <span className="block border-b border-[#ffffff0a] px-4 pb-3 pt-3">
                <span
                  className="block text-[17px] leading-[24px] text-white"
                  style={{ fontFamily: `'${o.heading} Specimen', '${o.heading}', serif` }}
                >
                  Title - {o.heading}
                </span>
                <span
                  className="block text-[13px] leading-[19px] text-[#ffffff7a]"
                  style={{ fontFamily: `'${o.body} Specimen', '${o.body}', sans-serif` }}
                >
                  Body - {o.body}
                </span>
              </span>
              <span className="block px-4 pb-3.5 pt-3">
                <span className="block text-[13px] font-semibold leading-[18px] text-white">{t(o.name)}</span>
                <span className="mt-0.5 block text-[13px] leading-[18px] text-[#ffffffa3]">
                  {o.detail ? t(o.detail) : null}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {!grid &&
        options.map((o, i) => (
          <Row key={o.id} q={q} o={o} on={picked === o.id} last={i === options.length - 1} />
        ))}

      <div className={options.length && !grid ? 'flex items-start gap-3 px-4 pb-4 pt-2' : 'px-4 pb-4 pt-2'}>
        {options.length > 0 && !grid && (
          /* the radio centres on the field's full height (self-stretch on the board) */
          <span className="flex h-[42px] items-center">
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

/**
 * The sheet of questions. Mounted and unmounted by the dock's AnimatePresence in
 * ChatPanel (mode="wait", shared with the plan card), so the two sheets never overlap in
 * the dock and each one gets its own rise and fall (modules/chat/dock.ts).
 *
 * Inside it, the question and its answers are ONE group keyed by step, swapped under a
 * `popLayout` presence: the layout snaps to the new question's height in one commit, the
 * shell's edge glides there on the dock's spring, and the two groups cross — the old one
 * leaving toward where it came from, the new one arriving from the side you are paging
 * to. `dir` is the direction of that page, kept from the previous render.
 */
export function BriefPanel() {
  const { t } = useT()
  const reduce = useReducedMotion()
  const brief = useWorld((s) => s.world.brief)
  const step = brief.step
  const q = BRIEF_QUESTIONS[step] ?? BRIEF_QUESTIONS[0]
  const last = step === BRIEF_QUESTIONS.length - 1
  const sheet = useDockSheet<HTMLElement>(step)

  // Forward (Next, ›) is +1, back (‹) is −1; the first render has no direction to speak of.
  const prevStep = useRef(step)
  const dir = step < prevStep.current ? -1 : 1
  useEffect(() => { prevStep.current = step }, [step])

  return (
    <motion.section
      ref={sheet.ref}
      /* The rise is the dock's (index.css `.dock-rise`, driven by useDockSheet): the
         piston carries the edge, `.dock-sheet` rides it and fades in behind it, and
         `.dock-foot` fades in place. Motion only owns the exit's fade. */
      initial={false}
      animate={{ opacity: 1 }}
      variants={sheetExit}
      exit="exit"
      aria-label={t({ en: 'Questions before building', uk: 'Запитання перед збіркою' })}
      /* No horizontal padding of its own: on the board the panel and the composer are both
         full-width children of the shell, so the answers card and the field share edges. */
      className="relative z-20"
    >
      <div className="dock-sheet relative">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={q.key}
            custom={dir}
            variants={reduce ? stepSwapFade : stepSwap}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* the question, 29464:34352 — 16px semibold on the glass itself, pt 20 / pb 18 */}
            <p className="px-4 pb-[18px] pt-5 text-[16px] font-semibold leading-[1.4] text-white">
              {t(q.question)}
            </p>
            <Body q={q} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* footer 29464:34378 — paging left, Skip all + Next right, both on the glass. It
          does not travel with the edge: its buttons are anchored to the field. On the rise
          it lands last — the buttons are the decision, and they should not be there
          before the question is. pb is the board's 16 plus the shell's 2px gap to the
          composer, which here has no element of its own to carry it. */}
      <footer className="dock-foot flex items-end justify-between pb-[18px] pl-1.5 pr-2.5 pt-3">
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
  )
}
