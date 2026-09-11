/**
 * THE PALETTE AND THE LETTERING AS DECISIONS YOU CAN RE-PICK — Figma 30121:59891
 * (product owner via the designer, 11.09.2026: "я хочу чтобы например палитра выбранная
 * цветовая выглядело более наглядно в плане, как палитра, и стили шрифтов тоже нужно
 * как-то более наглядно отобразить с превью шрифтов… можно было в плане на что то
 * кликнуть и перевыбрать быстро и удобно другой вариант").
 *
 * WHY IT IS CHEAP: the plan was never text. `buildPlan` compiles it from the brief's
 * answers, and the palette line was the SAME `swatches: string[]` the question panel draws
 * as a plate, flattened with `join(', ')` at the last step. Showing a palette as a palette
 * is not adding data — it is not flattening it. Re-picking writes another id into
 * `brief.answers` and the document recompiles itself.
 *
 * ⚠️ AND IT IS THE BEST ANSWER TO A SKIPPED QUESTION. An unanswered question prints
 * "(Remixer's pick.)" in the prose — an apology, and a dead end. As a card it becomes a
 * STATE of the control: chosen for you, here is what, here are the others, one click away.
 * The plan is also the last free moment — nothing is spent until `Start Building`.
 *
 * ⚠️ CONTROLS LOOK LIKE CONTROLS, PROSE LOOKS LIKE PROSE, and the designer agreed to make
 * that difference visible (11.09.2026). The document already had two species of content
 * with opposite meanings — rewriting a paragraph does NOT change the build, while picking
 * here does — and nothing on screen said which was which. These are objects with a rim and
 * a button; the prose around them still shows nothing at rest.
 *
 * GEOMETRY, off the board (dark theme — the export resolves every token to its LIGHT
 * fallback, which would paint a white card with black text):
 *   card        w 800, radius 16, `#232325` under a 1px rgba(255,255,255,.15), blur 16
 *   palette     container p 16, justify-between; the plate 200×40 radius 8 under a 1px
 *               `Neutral Alpha/50` (4% white), four equal cells; the text column pl 24 /
 *               pr 16, gap 3 — name 16 SEMIBOLD white over the hexes 12 REGULAR at
 *               `Text/default/secondary` (48% white)
 *   lettering   container pl 4 / pr 16 / py 4, gap 16; the block 64 tall, radius 12 under
 *               a 1px `Neutral Alpha/100` (8% white), pr 16, split by a border-r at the
 *               same alpha: the specimen pl 16 / pr 12 / py 8, gap 12, its two lines set
 *               IN THE PAIR THEY NAME; the reading pl 16 / py 8, gap 12
 *   pencil      40×40 button, container radius 10 on `Neutral Alpha/100` (8% white),
 *               state-layer p 8, glyph 24
 *
 * ⚠️ THE BOARD DRAWS ONLY THE SETTLED CARD. What the pencil opens is OURS: the question's
 * own grid, in place, with the rings and the press bloom the panel already owns — so a
 * decision is re-made in exactly the shape it was first made in.
 */
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useT, type Text } from '@/i18n'
import { BRIEF_QUESTIONS, OTHER, optionById, type BriefKey, type BriefOption } from './brief'
import { answerBrief } from './send'
import { Pick, PickDefs, Chip } from './BriefPanel'
import { IconPencil } from '@/ui/icons'

const q = (key: BriefKey) => BRIEF_QUESTIONS.find((x) => x.key === key)!

/** The option in force, and whether a person put it there — the plan's honesty rule. */
function settled(key: BriefKey, value: string | undefined) {
  const question = q(key)
  const own = value && value.startsWith(OTHER) ? value.slice(OTHER.length).trim() : ''
  if (own) return { own, option: undefined as BriefOption | undefined, picked: true }
  const option = optionById(question, value)
  return { own: '', option: option ?? question.options?.[0], picked: !!option }
}

/** The four colours, as the question panel plates them (25732:139125). */
function Plate({ swatches, className }: { swatches: string[]; className: string }) {
  return (
    <span className={`flex overflow-hidden rounded-[8px] border border-[#ffffff0a] ${className}`}>
      {swatches.map((c) => (
        <span key={c} className="h-full flex-1" style={{ background: c }} />
      ))}
    </span>
  )
}

/** The pair's name, set in the pair — the only way a type choice can be seen rather than read. */
function Specimen({ o }: { o: BriefOption }) {
  return (
    <>
      <span
        className="block text-[16px] font-semibold leading-none text-white [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]"
        style={{ fontFamily: `'${o.heading} Specimen', '${o.heading}', serif` }}
      >
        Title - {o.heading}
      </span>
      <span
        className="block text-[12px] leading-[1.4] text-[#ffffff7a] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]"
        style={{ fontFamily: `'${o.body} Specimen', '${o.body}', sans-serif` }}
      >
        Body - {o.body}
      </span>
    </>
  )
}

function Pencil({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={on}
      onClick={onClick}
      className="press-bloom grid h-10 w-10 flex-none place-items-center rounded-[10px] bg-[var(--white-100)] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-200)]"
    >
      <IconPencil size={24} />
    </button>
  )
}

/** The question's own grid, opened under the card it belongs to. */
function Grid({ k, onDone }: { k: BriefKey; onDone: () => void }) {
  const { t } = useT()
  const answers = useWorld((s) => s.world.brief.answers)
  const value = answers[k]
  const chosen = settled(k, value)
  const options = q(k).options ?? []
  const swatch = k === 'palette'
  return (
    <div className="grid grid-cols-2 gap-2 px-3 pb-3">
      {options.map((o) => (
        <Pick
          key={o.id}
          className={`brief-tile ${swatch ? 'brief-tile--swatch' : 'brief-tile--card'} flex p-1 text-left`}
          on={chosen.option?.id === o.id}
          label={t(o.name)}
          title={swatch ? t(o.name) : undefined}
          onPick={() => { answerBrief(k, o.id); onDone() }}
        >
          {swatch ? (
            <Plate swatches={o.swatches!} className="h-10 flex-1" />
          ) : (
            <span className="flex flex-1 flex-col overflow-hidden rounded-[12px] border border-[#ffffff14] bg-[#ffffff05]">
              <span className="block border-b border-[#ffffff0a] px-4 pb-3 pt-3">
                <span className="flex flex-col gap-1.5">
                  <Specimen o={o} />
                </span>
              </span>
              <span className="block px-4 pb-3.5 pt-3">
                <span className="block text-[13px] font-semibold leading-[18px] text-white">{t(o.name)}</span>
                <span className="mt-0.5 block text-[13px] leading-[18px] text-[#ffffffa3]">
                  {o.detail ? t(o.detail) : null}
                </span>
              </span>
            </span>
          )}
        </Pick>
      ))}
    </div>
  )
}

/* "Chosen for you" — a state of the control rather than an apology in the prose, and the
   same plate the questions wear as "Recommended" (BriefPanel's `Plate`). */

const PICKED_FOR_YOU: Text = { en: 'Remixer’s pick', uk: 'На розсуд Remixer' }

export function PlanDecisions() {
  const { t } = useT()
  const answers = useWorld((s) => s.world.brief.answers)
  const reduce = useReducedMotion()
  const [open, setOpen] = useState<BriefKey | null>(null)

  const palette = settled('palette', answers.palette)
  const type = settled('type', answers.type)

  /* The drawer is the only thing that moves, and only in height — the card above it never
     shifts, so the document under the pointer stays where the reader left it. */
  const drawer = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { height: 0, opacity: 0 },
        animate: { height: 'auto' as const, opacity: 1 },
        exit: { height: 0, opacity: 0 },
      }

  return (
    <div className="-mx-2 mt-3 flex flex-col gap-4">
      <PickDefs />

      {/* 30121:55288 — the palette */}
      {/* ⚠️ 74 is the board's own FIXED height (30121:55288 exports `h-[74px]`), not a
          consequence of the content — and it has to be fixed, or the chip beside the
          name pushes the card: the shared `Chip` is 24 tall against the name line's
          22.4, which measured 76. */}
      <div className="w-full overflow-hidden rounded-[16px] bg-[#232325] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">
        <div className="flex h-[74px] items-center justify-between p-4">
          {palette.option ? (
            <Plate swatches={palette.option.swatches!} className="h-10 w-[200px] flex-none" />
          ) : (
            <span className="h-10 w-[200px] flex-none rounded-[8px] border border-[#ffffff0a]" />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-[3px] pl-6 pr-4">
            <span className="flex items-center gap-2">
              <span className="truncate text-[16px] font-semibold leading-[1.4] text-white">
                {palette.own || (palette.option ? t(palette.option.name) : '')}
              </span>
              {!palette.picked && <Chip label={PICKED_FOR_YOU} />}
            </span>
            <span className="truncate text-[12px] leading-[1.4] text-[#ffffff7a]">
              {palette.option?.swatches?.join(' ') ?? t({ en: 'Colours you named', uk: 'Кольори, які ви назвали' })}
            </span>
          </div>
          <Pencil
            label={t({ en: 'Choose another palette', uk: 'Обрати іншу палітру' })}
            on={open === 'palette'}
            onClick={() => setOpen(open === 'palette' ? null : 'palette')}
          />
        </div>
        <AnimatePresence initial={false}>
          {open === 'palette' && (
            <motion.div {...drawer} transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }} className="overflow-hidden">
              <div className="border-t border-[#ffffff0a] pt-3">
                <Grid k="palette" onDone={() => setOpen(null)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 30121:59892 — the lettering, a two-column block: the specimen, then the reading */}
      <div className="w-full overflow-hidden rounded-[16px] bg-[#232325] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">
        <div className="flex items-center gap-4 py-1 pl-1 pr-4">
          {/* ⚠️ The rim is an inset shadow, not a border: Figma's stroke sits inside the
              geometry, and a border took 2px off the reading column — 389 where the
              board draws 391. The block's drawn 64 is its MINIMUM, not its height:
              the reading needs 381px on one line and the board gives it 375, which
              Proxima Nova fits and the OFL stand-in misses by 8. Same trade the
              Publish panel already carries — it lands on the board when the licensed
              faces are installed, rather than the divider being moved to chase them. */}
          <div className="flex min-h-[64px] min-w-0 flex-1 items-stretch rounded-[12px] pr-4 shadow-[inset_0_0_0_1px_var(--white-100)]">
            <div className="flex w-[317px] min-w-0 flex-none flex-col justify-center gap-3 border-r border-[var(--white-100)] py-2 pl-4 pr-3">
              {type.option ? <Specimen o={type.option} /> : <span className="text-[16px] text-white">{type.own}</span>}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 py-2 pl-4">
              <span className="flex items-center gap-2">
                <span className="truncate text-[16px] font-semibold leading-none text-white [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
                  {type.own || (type.option ? t(type.option.name) : '')}
                </span>
                {!type.picked && <Chip label={PICKED_FOR_YOU} />}
              </span>
              <span className="line-clamp-2 text-[12px] leading-[1.4] text-[#ffffff7a]">
                {type.option?.detail ? t(type.option.detail) : null}
              </span>
            </div>
          </div>
          <Pencil
            label={t({ en: 'Choose other lettering', uk: 'Обрати інші шрифти' })}
            on={open === 'type'}
            onClick={() => setOpen(open === 'type' ? null : 'type')}
          />
        </div>
        <AnimatePresence initial={false}>
          {open === 'type' && (
            <motion.div {...drawer} transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }} className="overflow-hidden">
              <div className="border-t border-[#ffffff0a] pt-3">
                <Grid k="type" onDone={() => setOpen(null)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
