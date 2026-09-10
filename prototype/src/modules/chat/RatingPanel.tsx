/**
 * THE SATISFACTION CARD — "How would you rate Remixer?", Figma 25744:139153.
 *
 * Asked once, after the first Autopilot proposal the customer actually answered (designer,
 * 09.09.2026: "после первого Autopilot вопроса, когда пользователь что-то выберет, нам нужно
 * узнать у кастомера насколько он доволен сгенерированным сайтом"). The gate and the copy are
 * in `autopilot.ts`; this file is the panel.
 *
 * It is the third sheet of the same dock — the questions, the proposal, and now this — so it
 * inherits the shell, the rise, the clip and the ring language rather than restating them.
 * Read in the DARK theme, the board's tokens land on the ones the panel above it already
 * uses, which is the tell that this was drawn as the same object:
 *
 *   Black/600 #09090b8f + Neutral Alpha/100 rim, radius 16   → the answers card, verbatim
 *   Neutral Alpha/200 = 12% white                            → `--white-200`, the cell's rim
 *   Text/Default/Secondary = #ffffff7a                       → 48% white, the scale's ends
 *   White/50 / White/200                                     → the note field's fill and rim
 *   Background/Blue/Default = #1587ff                        → `--action`
 *
 * ⚠️ The light-theme export disagrees with every one of those (it prints Neutral Alpha/200 as
 * `rgba(9,9,11,.16)` — a DARKER rim, at a different alpha, on a dark card). Same trap CLAUDE.md
 * records for the composer: read the tokens in the dark theme, not the fallbacks.
 *
 * ⚠️ THE CHOSEN SCORE IS A WHITE PLATE WITH BLACK FIGURES — Figma 25744:139649, sent the same
 * evening ("давай у выбранного пункта сделаем дизайн состояния с белым фоном и черным
 * текстом"). It replaces the drawn 2px ring the cells wore for the hours the board was silent
 * about them, which was recorded as ours at the time. The rim goes out as the plate comes in
 * and the figure thickens to SemiBold — all three in `index.css`, `.brief-cell[data-on]`. The
 * cells are still `Pick`, so they keep the hover ring and the house click; only the chosen
 * state is the board's own now.
 */
import { useState } from 'react'
import { motion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useT } from '@/i18n'
import { sheetExit } from '@/ui/motion'
import { PickDefs, Pick } from './BriefPanel'
import { RATE_HIGH, RATE_LOW, RATE_PLACEHOLDER, RATE_SKIP, RATE_SUBMIT, RATE_TITLE } from './autopilot'
import { pickScore, skipRating, submitRating } from './send'
import { useDockSheet } from './dock'

/** 1–10, as the board draws it: ten equal cells sharing the row, six pixels apart. */
const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export function RatingPanel() {
  const { t } = useT()
  const pick = useWorld((s) => s.world.suggest.pick)
  const sheet = useDockSheet<HTMLElement>('rating')
  /* The note is the one piece of state nothing else renders from, so it stays here rather
     than in the world — unlike the brief's free text, which the summary card reads back. */
  const [note, setNote] = useState('')

  const score = Number(pick)
  const chosen = Number.isFinite(score) && score >= 1

  return (
    <motion.section
      ref={sheet.ref}
      initial={false}
      animate={{ opacity: 1 }}
      variants={sheetExit}
      exit="exit"
      aria-label={t(RATE_TITLE)}
      className="relative z-20"
    >
      <PickDefs />
      <div className="dock-clip">
        <div className="dock-sheet relative">
          {/* the question, on the glass — px 16, pt 20 / pb 18, 16 semibold (25744:139680) */}
          <p className="px-4 pb-[18px] pt-5 text-[16px] font-semibold leading-[1.4] text-white">
            {t(RATE_TITLE)}
          </p>
          {/* the same card the questions and the proposals stand in — Black/600 under an 8% rim */}
          <div className="overflow-hidden rounded-[16px] border border-[#ffffff14] bg-[#09090b8f]">
            <div className="flex flex-col gap-[11px] px-4 pb-6 pt-[19px]">
              {/* the ends of the scale — 13px at 48% white, inset 6 so they sit over the
                  first and last cell rather than over the card's own edge (25744:140169) */}
              <div className="flex items-center justify-between px-1.5 text-[13px] leading-[1.4] text-[#ffffff7a]">
                <span>{t(RATE_LOW)}</span>
                <span>{t(RATE_HIGH)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {SCORES.map((n) => (
                  <Pick
                    key={n}
                    className="brief-cell flex h-10 flex-1 items-center justify-center rounded-[8px]"
                    on={score === n}
                    label={t({ en: `${n} out of 10`, uk: `${n} з 10` })}
                    onPick={() => pickScore(n)}
                  >
                    {/* the numerals are Gilroy — the brand sets names and figures in it. The
                        colour is INHERITED so the cell can turn it over as the plate arrives
                        (index.css, `.brief-cell[data-on]`); a literal `text-white` here would
                        leave a white figure on a white plate. */}
                    <span className="cell-digit font-display text-[15px] leading-[1.4]">{n}</span>
                  </Pick>
                ))}
              </div>
            </div>
            {/* the note — 40 tall, 4% white in a 12% rim (29751:58876) */}
            <div className="px-4 pb-4">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && chosen) { e.preventDefault(); submitRating(note) } }}
                placeholder={t(RATE_PLACEHOLDER)}
                aria-label={t(RATE_PLACEHOLDER)}
                className="block h-10 w-full rounded-[8px] border border-[var(--white-200)] bg-[var(--white-050)] pl-4 pr-2 text-[14px] text-white outline-none transition-colors duration-[var(--dur-fast)] ease-std placeholder:text-[#ffffff7a] focus:border-[var(--action)]"
              />
            </div>
          </div>

          {/* Footer 25744:139745 — the same metrics the questions and the proposal use
              (pt 12, pb 16 + the shell's 2px gap, pl 6 / pr 10), both buttons on the house
              press bloom. Submit is dead until a number is chosen: there is nothing to send
              before that, and a live button that does nothing is a worse answer than a dim one. */}
          <footer className="dock-foot flex items-end justify-end gap-2 pb-[18px] pl-1.5 pr-2.5 pt-3">
            <button
              type="button"
              onClick={skipRating}
              className="press-bloom h-8 rounded-[8px] px-3.5 text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
            >
              {t(RATE_SKIP)}
            </button>
            <button
              type="button"
              onClick={() => submitRating(note)}
              disabled={!chosen}
              className="press-bloom h-8 rounded-[8px] bg-[var(--action)] px-3.5 text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)] active:bg-[var(--action-pressed)] disabled:cursor-default disabled:bg-[var(--white-100)] disabled:text-[#ffffff3d] disabled:hover:bg-[var(--white-100)]"
            >
              {t(RATE_SUBMIT)}
            </button>
          </footer>
        </div>
      </div>
    </motion.section>
  )
}
