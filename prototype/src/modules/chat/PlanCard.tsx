/**
 * The plan, docked where the questions were — the step that gates the first build.
 *
 * IT IS DRAWN TWICE, AND BOTH ARE SHIPPED (designer, 21.09.2026, carrying the product
 * owners' call for release one: «продукт оунеры в первом релизе хотят упростить
 * функциональность показа плана… нет кнопки Review… все показываем в этом окне и нужно дать
 * редактировать текст прямо в этом окне», then «но нам нужно сохранить и более полноценный
 * вариант… нужно добавить маленький, красивый переключатель тогл»). So `world.planSimple`
 * decides which of two boards this step wears, and the footer carries the switch:
 *
 *  · SIMPLE (default, Figma 30596:27064) — one window. The whole document scrolls inside a
 *    320px box and is EDITED there; the header grows a chevron that gives the window more
 *    room; there is no `Review` and no full-canvas surface.
 *  · FULL (Figma 29816:21533) — the teaser: the document's first screen behind a fade, with
 *    `Review` opening it at full size in the canvas (PlanSurface).
 *
 * Both are the same object at the same step, so they keep the questions' shell: the glass
 * dock (`.brief-dock`), the piston that carries the edge up, the clip at the footer's line.
 * Switching between them is a STEP for the dock — the sheet's height changes and the shell's
 * edge glides there on the same spring that carries a change of question (modules/chat/dock.ts),
 * and the two bodies hand over sequentially, never crossing (`stepSwap`).
 *
 * GEOMETRY, measured off the boards (each is 770 wide there, in an 800 dock; here they span
 * the sheet, which is the composer's own width — the panel has no horizontal padding of its
 * own, so card and composer are one width, as the questions are):
 *   header       56 tall, pl 16, the title 18 SEMIBOLD white, its box trimmed to the CAP
 *                BAND (`text-box-trim`) — the board draws 12px of cap at 18px type. Simple
 *                pays 8 on the right for the chevron; full keeps the board's 16.
 *   full body    194 tall, radius 16, `Black/600` (#09090b8f) under a 1px `NA/100` rim
 *   simple body  320 tall, radius 16, `Black/200` (#09090b29) under the same rim — a
 *                LIGHTER surface, because this one is a window you read in, not a teaser
 *   both         pl 16 / pr 24 / py 18, 16 between blocks, 10 inside each, a 15 MEDIUM white
 *                line over 14 REGULAR at `NA/700` (64% white), both at leading 1.4
 *   the fade     full: the block's last 152px from y=42; simple: the last 32, at the foot of
 *                the scroller — both ending in the block's own apparent colour
 *   footer       pt 12 / pb 16 / px 10; `Start Building` right, the switch (and `Review`,
 *                in the full variant) left
 *
 * ⚠️ THE FADE IS AN OVERLAY, NOT A MASK. A mask makes its element a backdrop root, and this
 * project has already paid for that once (the prompt chips: a masked ancestor silently killed
 * the blur underneath it, CLAUDE.md). The board hands us the better construction anyway: a
 * plain gradient painted ON TOP, ending in the block's own apparent colour. Neither #101012
 * nor #161619 is a new token — they are `#09090b` at 56% and at 16% over the dock's flat
 * `#1a1a1c`, the same composite `--ring-ground` names for the answer rings. If the dock's
 * ground ever changes, all three move together.
 *
 * ⚠️ IN THE FULL VARIANT THE FADE LANDS IN TEXT, and that is the whole point of its fixed
 * 194: the plan is longer than the card, so its tail dissolving is what makes `Review` the
 * obvious way to read the rest. In the simple one the same fade means something else — there
 * is no door to point at, so it is the scroller's own soft edge.
 *
 * ⚠️ WHAT THE SIMPLE WINDOW DOES NOT DRAW: the page stack and the two decision cards. The
 * board draws prose and nothing else in that box, and that IS the simplification the product
 * owners asked for — the section's own sentences say the same facts (the palette's hexes, the
 * lettering pair, "Home first, and only Home"). Flagged to the designer rather than invented
 * back in: they are two controls built for an 800-wide column, and the full variant still
 * carries both.
 *
 * ⚠️ `Skip` is in Lovable's footer and is NOT here. There it makes sense — Plan mode is
 * optional, so skipping means "never mind the plan, just build". Here the plan IS the five
 * questions' answer; a button that means "build without the thing I just asked you for"
 * would undo the flow. Flagged to the designer rather than shipped as a no-op.
 */
import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useUI } from '@/state/ui'
import { useT, type Text } from '@/i18n'
import { ScrollArea } from '@/ui/ScrollArea'
import { Tooltip } from '@/ui/Tooltip'
import { IconFold, IconUnfold } from '@/ui/icons'
import { segmentedPill, sheetExit, stepSwap, stepSwapFade } from '@/ui/motion'
import { buildPlan, PLAN_LABEL, PLAN_START, type Plan } from './plan'
import { approvePlan, editPlanItems, editPlanText, reviewPlan, setPlanVariant } from './send'
import { PlanEditable, focusPlanBlock } from './PlanEditable'
import { useDockSheet } from './dock'

/**
 * How tall the simple window stands when it is unfolded.
 *
 * ⚠️ The ceiling is not a taste: the dock's piston hangs 320px below the seam
 * (`.dock-piston`, index.css), and anything the edge travels beyond that shows the ground
 * through the gap — the black slit the designer filmed on 09.09.2026. 620 − 320 = 300 of
 * travel, inside the overhang with room to spare. The floor is the drawn height, and the
 * viewport term keeps a short window from eating the thread it belongs to.
 */
const TALL = 'clamp(320px, calc(100vh - 460px), 620px)'

/** What this line says now: the customer's words if they wrote any, else the compiled ones. */
function useEdits() {
  const edits = useWorld((s) => s.world.planEdits)
  return {
    edits,
    read: (path: string, fallback: string) => edits.text[path] ?? fallback,
  }
}

export function PlanCard() {
  const { t } = useT()
  const reduce = useReducedMotion()
  const answers = useWorld((s) => s.world.brief.answers)
  const simple = useWorld((s) => s.world.planSimple)
  const tall = useUI((s) => s.planTall)
  const togglePlanTall = useUI((s) => s.togglePlanTall)
  const plan = buildPlan(answers)

  /* Two things change this sheet's height — the variant and the unfolded window — and the
     dock treats either as a step: it measures the new height in the same commit and glides
     the shell's edge to it. */
  const step = `${simple ? 'simple' : 'full'}:${simple && tall ? 'tall' : 'short'}`
  const sheet = useDockSheet<HTMLElement>(step)

  /* Which way the bodies travel when the switch is thrown: towards Simple is "forward". */
  const prev = useRef(simple)
  const dir = simple && !prev.current ? 1 : !simple && prev.current ? -1 : 1
  useEffect(() => { prev.current = simple }, [simple])

  return (
    <motion.section
      ref={sheet.ref}
      /* Same sheet as the questions: the dock's piston carries the edge up (index.css
         `.dock-rise`, driven by useDockSheet), `.dock-sheet` rides it and fades in behind
         it, `.dock-foot` fades in place. Motion only owns the exit's fade. */
      initial={false}
      animate={{ opacity: 1 }}
      variants={sheetExit}
      exit="exit"
      aria-label={t({ en: 'Plan, waiting for your approval', uk: 'План, очікує підтвердження' })}
      className="relative z-20"
    >
      {/* the same clip the questions travel in — index.css ".dock-clip" */}
      <div className="dock-clip">
        <div className="dock-sheet">
          {/* 29816:21536 / 30596:27067 — a 56px row, and the title's own box is the cap
              band, so the letters sit on the row's centre line rather than a line box's. */}
          <div className={`flex h-[56px] items-stretch pl-4 ${simple ? 'pr-2' : 'pr-4'}`}>
            {/*
              * ⚠️ pt 20 / pb 18, NOT `items-center`. The board's title frame is 56 tall with
              * those paddings and the cap band centred in the 18px that remain — which puts
              * the letters a pixel BELOW the row's centre line (its cap top lands at y=23,
              * where plain centring gives 22). The same optical instinct the designer applied
              * to the mode pill by eye, drawn into the board here. Reproduced literally —
              * and the chevron inherits it: sharing this padding box is what puts the 40px
              * button at y=9 rather than at a centred 8, exactly as 30596:27064 draws it.
              */}
            <div className="flex flex-1 items-center gap-2.5 pb-[18px] pt-5">
              <p className="flex-1 [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] text-[18px] font-semibold leading-[1.4] text-white">
                {t(PLAN_LABEL)}
              </p>
              {simple && (
                <Tooltip
                  interactive
                  text={tall
                    ? { en: 'Put the window back', uk: 'Повернути вікно' }
                    : { en: 'Give the plan more room', uk: 'Більше місця для плану' }}
                >
                  <button
                    type="button"
                    data-plan-unfold
                    onClick={togglePlanTall}
                    aria-pressed={tall}
                    aria-label={t(tall
                      ? { en: 'Put the plan window back', uk: 'Повернути вікно плану' }
                      : { en: 'Give the plan more room', uk: 'Більше місця для плану' })}
                    /* 30765:6001 — the kit's STANDARD icon button: 40 at radius 10 with no
                       container of its own until it is touched. */
                    className="press-bloom grid h-10 w-10 flex-none place-items-center rounded-[10px] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
                  >
                    {tall ? <IconFold size={24} /> : <IconUnfold size={24} />}
                  </button>
                </Tooltip>
              )}
            </div>
          </div>

          {/* The two bodies hand over sequentially under a `popLayout` presence: the layout
              snaps to the new one's height in one commit and the shell's edge glides there
              on the dock's spring, exactly as it does between two questions. */}
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div
              key={simple ? 'simple' : 'full'}
              custom={dir}
              variants={reduce ? stepSwapFade : stepSwap}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {simple ? <PlanWindow plan={plan} tall={tall} /> : <PlanTeaser plan={plan} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* No price line here. It read as a warning attached to the button rather than as
          information, and the footer is a decision — Review or Start Building — not a
          receipt. (Designer, 07.09.2026: "этот текст нужно убрать".) */}
      <footer className="dock-foot flex items-end justify-between px-2.5 pb-4 pt-3">
        <div className="flex items-center gap-2">
          <VariantSwitch simple={simple} />
          {!simple && (
            <button
              type="button"
              data-plan-review
              onClick={reviewPlan}
              /* 29816:21855 — a TONAL button (8% white fill), not the outlined one this card
                 shipped with: the board gives the secondary action a surface, not a rim.
                 `press-bloom` is the house click (design-system §5) — a filled button owns its
                 own hover paint, so it takes the bloom without the glass wash. */
              className="press-bloom h-8 rounded-[8px] bg-[var(--white-100)] px-3.5 text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-200)]"
            >
              {t({ en: 'Review', uk: 'Переглянути' })}
            </button>
          )}
        </div>
        <button
          type="button"
          data-plan-start
          onClick={approvePlan}
          className="press-bloom h-8 rounded-[8px] bg-[var(--action)] px-3.5 text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)] active:bg-[var(--action-pressed)]"
        >
          {t(PLAN_START)}
        </button>
      </footer>
    </motion.section>
  )
}

/* ------------------------------------------------------------------ the full variant */

/**
 * The teaser — 29816:21552, the document's first screen at a fixed height, so the card is
 * the same size whatever the plan says. Read-only on purpose: a 194px window with a fade
 * over its last 152 is not where anybody edits prose, and `Review` is one press away.
 */
function PlanTeaser({ plan }: { plan: Plan }) {
  const { t } = useT()
  const { edits, read } = useEdits()
  const first = plan.sections[0]
  const firstItems = edits.items[0] ?? (first?.items ?? []).map((x) => t(x))

  return (
    <div data-plan-body className="relative h-[194px] overflow-hidden rounded-[16px] border border-[#ffffff14] bg-[#09090b8f]">
      <div className="flex flex-col gap-4 py-[18px] pl-4 pr-6">
        <div className="flex flex-col gap-2.5">
          <p className="text-[15px] font-medium leading-[1.4] text-white">{read('title', t(plan.title))}</p>
          <p className="text-[14px] leading-[1.4] text-[#ffffffa3]">{read('goal', t(plan.goal))}</p>
        </div>
        {first && (
          <div className="flex flex-col gap-2.5">
            <p className="text-[15px] font-medium leading-[1.4] text-white">{read('s0:h', t(first.heading))}</p>
            {/* ⚠️ The section's lede, which the full document draws above the stack, is
                the sentence that says what the button actually does — "Home first, and
                only Home". The card is the first thing read and the stack is below its
                fold, so without this the teaser would drop the one new fact. */}
            {first.body && (
              <p className="text-[14px] leading-[1.4] text-[#ffffffa3]">{read('s0:b', t(first.body))}</p>
            )}
            {/* the board sets the section's lines as one text block, so they share the
                10px gap with the heading and sit on consecutive leading-1.4 lines */}
            <div className="text-[14px] leading-[1.4] text-[#ffffffa3]">
              {firstItems.map((item, j) => (
                <p key={j}>{item}</p>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* 29816:21863 — the tail dissolving into the card's own colour */}
      <div
        aria-hidden
        /* top 41, not 42: the board measures its 42 from the block's OUTER edge, and
           an absolute child is placed against the padding box — inside the 1px rim. */
        className="pointer-events-none absolute inset-x-0 top-[41px] h-[152px] rounded-b-[16px]"
        style={{ background: 'linear-gradient(to bottom, #10101200, #101012)' }}
      />
    </div>
  )
}

/* ---------------------------------------------------------------- the simple variant */

/**
 * The whole document, in the window — 30596:27083. It scrolls (through `ScrollArea`, as
 * every scrolling surface in this prototype does) and every line of it is editable in
 * place, at the same paths the full-size document writes: the two variants and the two
 * windows are one text, not three copies of one.
 *
 * ⚠️ The rim is an INSET SHADOW, not a border. Figma's stroke sits inside the geometry, so
 * the board's pl 16 is 16 from the outer edge; a CSS border would push the text to 17 and
 * take a pixel off the measure. The same correction the checkout sheet, the progress row
 * and the summary card each needed.
 *
 * ⚠️ And `.plan-edit` bleeds its hover surface 8px either side (margin −8 / padding 8), which
 * is exactly why the ink still lands on the board's 16: the box grows outwards and the text
 * is pushed back in. Nothing here compensates for it, and nothing should.
 */
function PlanWindow({ plan, tall }: { plan: Plan; tall: boolean }) {
  const { t } = useT()
  const { edits, read } = useEdits()

  return (
    <div
      data-plan-body
      className="relative overflow-hidden rounded-[16px] bg-[#09090b29] shadow-[inset_0_0_0_1px_#ffffff14]"
      style={{ height: tall ? TALL : '320px' }}
    >
      <ScrollArea className="h-full" thumb="light">
        <div className="flex flex-col gap-4 py-[18px] pl-4 pr-6">
          <div className="flex flex-col gap-2.5">
            <PlanEditable
              path="title"
              value={read('title', t(plan.title))}
              onCommit={(v) => editPlanText('title', v, t(plan.title))}
              label={t({ en: 'Plan title', uk: 'Заголовок плану' })}
              className="text-[15px] font-medium leading-[1.4] text-white"
            />
            <PlanEditable
              path="goal"
              value={read('goal', t(plan.goal))}
              onCommit={(v) => editPlanText('goal', v, t(plan.goal))}
              label={t({ en: 'The goal, in a paragraph', uk: 'Мета, одним абзацом' })}
              className="text-[14px] leading-[1.4] text-[#ffffffa3]"
            />
          </div>

          {plan.sections.map((section, i) => {
            const items = edits.items[i] ?? (section.items ?? []).map((x) => t(x))
            const setItems = (next: string[]) => editPlanItems(i, next)
            /* Hoisted: TypeScript narrows `section.body` for the JSX guard but not inside
               the callback under it, which closes over the section rather than the guard. */
            const body = section.body ? t(section.body) : null
            const after: Text | null = section.after ?? null
            return (
              <div key={section.heading.en} className="flex flex-col gap-2.5">
                <PlanEditable
                  path={`s${i}:h`}
                  value={read(`s${i}:h`, t(section.heading))}
                  onCommit={(v) => editPlanText(`s${i}:h`, v, t(section.heading))}
                  label={t({ en: 'Section heading', uk: 'Заголовок розділу' })}
                  className="text-[15px] font-medium leading-[1.4] text-white"
                />
                {body !== null && (
                  <PlanEditable
                    path={`s${i}:b`}
                    value={read(`s${i}:b`, body)}
                    onCommit={(v) => editPlanText(`s${i}:b`, v, body)}
                    label={t({ en: 'Section text', uk: 'Текст розділу' })}
                    className="text-[14px] leading-[1.4] text-[#ffffffa3]"
                  />
                )}
                {items.length > 0 && (
                  /* the board sets a section's lines as ONE text block: consecutive
                     leading-1.4 lines, no bullets, sharing the block's 10px gap */
                  <div className="text-[14px] leading-[1.4] text-[#ffffffa3]">
                    {items.map((item, j) => (
                      <PlanEditable
                        key={`${i}:${j}`}
                        path={`s${i}:${j}`}
                        value={item}
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
                    ))}
                  </div>
                )}
                {after && (
                  <PlanEditable
                    path={`s${i}:after`}
                    value={read(`s${i}:after`, t(after))}
                    onCommit={(v) => editPlanText(`s${i}:after`, v, t(after))}
                    label={t({ en: 'Section text', uk: 'Текст розділу' })}
                    className="text-[14px] leading-[1.4] text-[#ffffffa3]"
                  />
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
      {/* 30596:27093 — the scroller's own soft edge, 32 tall, ending in the window's own
          PAINTED colour. `#09090b` at 16% over the dock's flat #1a1a1c arithmetically gives
          rgb(23,23,25); the screen gives rgb(22,22,25), because the sheet rides a composited
          layer and its fill is blended premultiplied — 9 × 0.16 rounds to 1 before the
          backdrop is mixed in. Measured, not derived (scratchpad/plan-simple/ground.mjs), the
          way `--ring-ground` was. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-[16px]"
        style={{ background: 'linear-gradient(to bottom, #16161900, #161619)' }}
      />
    </div>
  )
}

/* ----------------------------------------------------------------------- the switch */

const SEATS = [
  { simple: false, label: { en: 'Full', uk: 'Повний' } as Text },
  { simple: true, label: { en: 'Simple', uk: 'Спрощений' } as Text },
]

/**
 * WHICH PLAN THIS STEP WEARS — the switch the designer asked for in the footer's bottom-left
 * corner (21.09.2026). It is the house's third segmented control and obeys the same law as
 * the Home dock's tabs and its filter chips (`segmentedPill`, ui/motion.ts): a track, one
 * pill flying between seats on the shell's spring, labels that only change colour.
 *
 * ⚠️ No capsule-of-two here. That construction exists on the other two because their seats
 * have DIFFERENT widths, and a pill that `scaleX`es between them settles with elliptical
 * caps. These seats are equal by construction (a two-column grid), so one capsule translates
 * by exactly its own width — `x: 100%` — and nothing scales.
 *
 * ⚠️ The bloom belongs to the INACTIVE seat only: pressing what is already selected is a
 * no-op, and there is nothing to acknowledge. The flight IS the acknowledgement.
 *
 * ⚠️ It is a PROTOTYPE control — two drawn designs of one step, not a product setting — so it
 * says what it switches in a tooltip rather than pretending to be a preference.
 */
function VariantSwitch({ simple }: { simple: boolean }) {
  const { t } = useT()
  const reduce = useReducedMotion()

  return (
    <Tooltip
      interactive
      text={{
        en: 'Prototype: Full opens the plan in the canvas, Simple keeps it in this window.',
        uk: 'Прототип: Повний відкриває план на полотні, Спрощений залишає його в цьому вікні.',
      }}
    >
      <div data-plan-variant className="plan-variant grid h-8 grid-cols-2 items-center rounded-full p-1">
        <motion.span
          aria-hidden
          className="plan-variant-thumb"
          style={{ top: 4, bottom: 4, left: 4, width: 'calc(50% - 4px)' }}
          /* `initial={false}`: on mount the pill IS at its seat. Without it the switch would
             spring across the track every time the card arrives in the dock. */
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
  )
}
