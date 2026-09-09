/**
 * The plan, docked where the questions were — the step that gates the first build.
 * Figma 29816:21115 (the card itself is 29816:21533; designer, 09.09.2026: "я подготовил
 * макет для компонента с готовым планом… сделай перфект пиксель как в макете").
 *
 * It is the same object as the question panel at its next step, so it keeps that panel's
 * shell: the glass dock (`.brief-dock`), the piston that carries the edge up, the clip at
 * the footer's line. What the board settles is everything inside it.
 *
 * GEOMETRY, measured off the board (the card is 770 wide there, in an 800 dock; here it
 * spans the sheet, which is the composer's own width — the panel has no horizontal padding
 * of its own, so card and composer are one width, as the questions are):
 *   header       56 tall, px 16, the title 18 SEMIBOLD white, its box trimmed to the CAP
 *                BAND (`text-box-trim`) — the board draws 12px of cap at 18px type
 *   body block   194 tall, radius 16, `Black/600` (#09090b8f) under a 1px `NA/100` rim,
 *                pl 16 / pr 24 / py 18
 *   text         two blocks, 16 between them, 10 inside each: a 15 MEDIUM white line over
 *                a 14 REGULAR line at `NA/700` (64% white), both at leading 1.4
 *   the fade     an overlay over the block's last 152px, from transparent at y=42 down to
 *                #101012, radius 16 at the bottom
 *   footer       pt 12 / pb 16 / px 10, the two buttons on the baseline of the row
 *   Review       TONAL: `NA/100` fill (8% white), radius 8, 32 tall, px 14, 13 semibold
 *   Start        `Background/Blue/Default` = our `--action`, same box, white label
 *
 * ⚠️ THE FADE IS AN OVERLAY, NOT A MASK. It was a mask on the body before, which worked —
 * but a mask makes its element a backdrop root, and this project has already paid for that
 * once (the prompt chips: a masked ancestor silently killed the blur underneath it,
 * CLAUDE.md). The board hands us the better construction anyway: a plain gradient painted
 * ON TOP, ending in the block's own apparent colour. #101012 is not a new token — it is
 * `#09090b` at 56% over the dock's flat `#1a1a1c`, the same composite `--ring-ground`
 * names for the answer rings. If the dock's ground ever changes, both move together.
 *
 * ⚠️ THE FADE LANDS IN TEXT, and that is the whole point of the fixed 194: the plan is
 * longer than the card, so its tail dissolving is what makes `Review` obviously the way to
 * read the rest. A card that ended in clear space would read as a card with nothing more
 * to say.
 *
 * ⚠️ `Skip` is in Lovable's footer and is NOT here. There it makes sense — Plan mode is
 * optional, so skipping means "never mind the plan, just build". Here the plan IS the four
 * questions' answer; a button that means "build without the thing I just asked you for"
 * would undo the flow. Flagged to the designer rather than shipped as a no-op.
 */
import { motion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useT } from '@/i18n'
import { sheetExit } from '@/ui/motion'
import { buildPlan, PLAN_LABEL, PLAN_START } from './plan'
import { approvePlan, reviewPlan } from './send'
import { useDockSheet } from './dock'

export function PlanCard() {
  const { t } = useT()
  const answers = useWorld((s) => s.world.brief.answers)
  const plan = buildPlan(answers)
  const first = plan.sections[0]

  const sheet = useDockSheet<HTMLElement>()

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
          {/* 29816:21536 — a 56px row, and the title's own box is the cap band, so the
              letters sit on the row's centre line rather than a line box's. */}
          <div className="flex h-[56px] items-stretch px-4">
            {/*
              * ⚠️ pt 20 / pb 18, NOT `items-center`. The board's title frame is 56 tall with
              * those paddings and the cap band centred in the 18px that remain — which puts
              * the letters a pixel BELOW the row's centre line (its cap top lands at y=23,
              * where plain centring gives 22). The same optical instinct the designer applied
              * to the mode pill by eye, drawn into the board here. Reproduced literally.
              */}
            <div className="flex flex-1 items-center pb-[18px] pt-5">
              <p className="[text-box-edge:cap_alphabetic] [text-box-trim:trim-both] text-[18px] font-semibold leading-[1.4] text-white">
                {t(PLAN_LABEL)}
              </p>
            </div>
          </div>

          {/* 29816:21552 — the document's first screen, at a fixed height so the card is
              the same size whatever the plan says. */}
          <div className="relative h-[194px] overflow-hidden rounded-[16px] border border-[#ffffff14] bg-[#09090b8f]">
            <div className="flex flex-col gap-4 py-[18px] pl-4 pr-6">
              <div className="flex flex-col gap-2.5">
                <p className="text-[15px] font-medium leading-[1.4] text-white">{t(plan.title)}</p>
                <p className="text-[14px] leading-[1.4] text-[#ffffffa3]">{t(plan.goal)}</p>
              </div>
              {first && (
                <div className="flex flex-col gap-2.5">
                  <p className="text-[15px] font-medium leading-[1.4] text-white">{t(first.heading)}</p>
                  {/* the board sets the section's lines as one text block, so they share the
                      10px gap with the heading and sit on consecutive leading-1.4 lines */}
                  <div className="text-[14px] leading-[1.4] text-[#ffffffa3]">
                    {first.items?.map((item) => (
                      <p key={item.en}>{t(item)}</p>
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
        </div>
      </div>

      {/* No price line here. It read as a warning attached to the button rather than as
          information, and the footer is a decision — Review or Start Building — not a
          receipt. (Designer, 07.09.2026: "этот текст нужно убрать".) */}
      <footer className="dock-foot flex items-end justify-between px-2.5 pb-4 pt-3">
        <button
          type="button"
          onClick={reviewPlan}
          /* 29816:21855 — a TONAL button (8% white fill), not the outlined one this card
             shipped with: the board gives the secondary action a surface, not a rim.
             `press-bloom` is the house click (design-system §5) — a filled button owns its
             own hover paint, so it takes the bloom without the glass wash. */
          className="press-bloom h-8 rounded-[8px] bg-[var(--white-100)] px-3.5 text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-200)]"
        >
          {t({ en: 'Review', uk: 'Переглянути' })}
        </button>
        <button
          type="button"
          onClick={approvePlan}
          className="press-bloom h-8 rounded-[8px] bg-[var(--action)] px-3.5 text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)] active:bg-[var(--action-pressed)]"
        >
          {t(PLAN_START)}
        </button>
      </footer>
    </motion.section>
  )
}
