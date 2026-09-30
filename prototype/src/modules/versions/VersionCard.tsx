/**
 * THE VERSION CARD — a change to the site, as the chat records it (Figma 31422:42642; designer,
 * 30.09.2026: «как выглядит сообщение в чате с этим изменением и версией, ну и кнопку вернуться на
 * версию или посмотреть старую какую-то версию»). The model is ./model.ts; the research and every
 * decision behind the shape is docs/features/versions/README.md.
 *
 * ANATOMY (the board, to the pixel — scratchpad/version-cards/board-spec.md):
 *  · 416 × 56, 8 px wider than the text column on the left (the thread's gutter is 16, the board's
 *    card sits at 8): `#171719`, the gradient rim INSIDE, radius 16, `py 2` round a 52 row;
 *  · left, a 32 slot — the customer's own edit wears the edit bar's «T in a frame» at 48 % white;
 *    the CURRENT version wears the green mark (a 2 px ring #A0DDAA round an 8 px core #57BC67);
 *    a card with no slot starts its title at 20;
 *  · the title, 15 semibold white, cut to its cap band;
 *  · right, [revert · eye] 36 each 4 apart, then 8, then the tonal chevron 36. The current version
 *    has only the chevron — there is nothing to go back to and nothing else to look at.
 *
 * WHAT THE BOARD DOES NOT DRAW, AND WE DECIDED (README §4, all flagged to the designer):
 *  · the WORKING card — Remixer's change is posted at once with its «-ing» line and the house
 *    spinner in the slot (the board's hidden «Message + Loader», Lovable's writing title), and
 *    settles into the past-tense title with the green mark when the change lands;
 *  · the DETAILS the chevron unfolds — a `Reveal` (the design system's unfolding block): the
 *    version's number, time and price, then what changed in words — the words before and after, the
 *    colours as swatches, the photos as thumbnails. No file names, no code;
 *  · the PREVIEW — the eye puts that version on the canvas; the card's rim turns blue while it is
 *    there, and the bar at the canvas's foot says so (PreviewBar.tsx);
 *  · the REVERT asks first, in words that promise what is true: nothing is deleted.
 */
import { AnimatePresence, animate, motion, motionValue, useReducedMotion, type MotionValue } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useT } from '@/i18n'
import { useWorld, type PhotoRef, type Version, type VersionChange } from '@/state/world'
import { useUI } from '@/state/ui'
import { Reveal } from '@/ui/Reveal'
import { Tooltip } from '@/ui/Tooltip'
import { useConfirm } from '@/ui/ConfirmDialog'
import { useShimmerPhase } from '@/ui/shimmer'
import {
  SPRING, cardIn, cardInBody, cardInFade, cardInBodyFade, verbRoll, verbRollFade, HOST_GLIDE,
  vcButtonIn, vcButtonInFade, vcSlotSwap, chipInBadge, chipInFade, STACK_SPRING, STACK_VEIL_IN, STACK_VEIL_OUT,
} from '@/ui/motion'
import { GlyphEditText } from '@/modules/editor/icons'
import { getUpload } from '@/modules/editor/media'
import { SITE_PHOTOS } from '@/modules/preview/photos'
import { GlyphCurrent, GlyphDetails, GlyphPreview, GlyphRevert } from './icons'
import { closeCleanEditor, isEditorDirty, restoreVersion, timeOf, versionBlock } from './model'
import { useEditor } from '@/modules/editor/session'

const keepOnMainThread = () => {}

/* ================================================================== the card */

export function VersionCard({
  v, current, fresh, badge, folded = false, previewing,
}: {
  v: Version
  /** Is this the version the site is on? */
  current: boolean
  /** Just posted — plays the Card Arrival (the thread's glass entry). */
  fresh: boolean
  /** The count on a folded stack's front card. */
  badge?: number
  /** Behind the front of a folded stack: its details close and it takes no focus. */
  folded?: boolean
  previewing: boolean
}) {
  const { t, lang } = useT()
  const reduce = useReducedMotion()
  const chat = useWorld((s) => s.world.chat)
  const published = useWorld((s) => s.world.published)
  const [open, setOpen] = useState(false)
  useEffect(() => { if (folded) setOpen(false) }, [folded])
  const working = !!v.pending
  useEffect(() => { if (working) setOpen(false) }, [working])
  const slot: 'spin' | 'current' | 'edit' | null = working ? 'spin' : current ? 'current' : v.kind === 'edit' ? 'edit' : null
  const phase = useShimmerPhase(working)
  /* subscribed, not read once: the card re-renders when the editor's batch turns dirty or clean */
  const dirty = useEditor(isEditorDirty)
  const block = versionBlock({ chat }, dirty)
  const title = t(working && v.doing ? v.doing : v.title)

  const preview = () => {
    const ui = useUI.getState()
    if (ui.versionPreview === v.n) { ui.setVersionPreview(null); return }
    if (versionBlock(useWorld.getState().world)) return
    closeCleanEditor()
    ui.setVersionPreview(v.n)
  }
  const revert = () => {
    if (versionBlock(useWorld.getState().world)) return
    closeCleanEditor()
    useConfirm.getState().ask(restoreAsk(v, lang, published, t))
  }

  const showActs = !working && !current
  const card = (
    <div
      className={`vcard py-[2px]${fresh ? ' card-arrive' : ''}`}
      data-version-card={v.n}
      data-version-kind={v.kind}
      data-version-current={current ? '' : undefined}
      data-version-working={working ? '' : undefined}
      data-previewing={previewing ? '' : undefined}
      {...(folded ? { inert: '' } : {})}
    >
      <span className="vc-ring" aria-hidden />
      <div
        className={`flex h-[52px] items-center pr-[10px] ${slot ? 'pl-2' : 'pl-5'}${working ? ' shimmer-hue' : ''}`}
        style={working ? phase : undefined}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {slot && (
            <motion.span
              key="slot"
              className="relative mr-2 grid h-8 w-8 flex-none place-items-center rounded-[8px]"
              variants={reduce ? vcButtonInFade : vcSlotSwap}
              initial="initial"
              animate="animate"
              exit="exit"
              onUpdate={keepOnMainThread}
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={slot}
                  className="absolute inset-0 grid place-items-center"
                  variants={reduce ? vcButtonInFade : vcSlotSwap}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onUpdate={keepOnMainThread}
                >
                  {slot === 'spin' ? <Spinner /> : slot === 'current' ? (
                    <Tooltip text={{ en: 'This is your site right now', uk: 'Це ваш сайт зараз' }} className="grid h-8 w-8 place-items-center">
                      <GlyphCurrent />
                    </Tooltip>
                  ) : (
                    <Tooltip text={{ en: 'Your own edit in the editor · free', uk: 'Ваша правка в редакторі · безкоштовно' }} className="grid h-8 w-8 place-items-center text-[var(--white-480)]">
                      <GlyphEditText size={24} />
                    </Tooltip>
                  )}
                </motion.span>
              </AnimatePresence>
              {/* the folded stack's count (31422:42821): on the slot's corner, cut out of the card */}
              <AnimatePresence initial={false}>
                {badge !== undefined && (
                  <motion.span
                    key="badge"
                    data-version-badge
                    className="vc-badge font-display pointer-events-none absolute left-[19px] top-[-3px] z-[3] h-4 min-w-4 max-w-[34px] rounded-full px-1 text-center text-[11px] font-semibold leading-4 tabular-nums"
                    variants={reduce ? chipInFade : chipInBadge}
                    initial="initial"
                    animate="animate"
                    exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.12 } }}
                    onUpdate={keepOnMainThread}
                  >
                    {badge}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.span>
          )}
        </AnimatePresence>

        {/* the title glides to its new x when the slot comes or goes; the words roll when the
            working line lands as the past-tense title (the in-flight card's Verb Roll) */}
        <motion.span layout="position" transition={reduce ? { duration: 0 } : SPRING} className="relative flex min-w-0 flex-1 overflow-hidden py-1">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={title}
              data-version-title
              /* ⚠️ cut to the cap band — and so its box is only as tall as the capitals: `truncate`'s
                 `overflow: hidden` would shear every descender off (g, p, y — «Navigation Update»
                 lost its tails). `overflow: clip` with a 4 px clip margin keeps the ellipsis and
                 lets the tails hang below the box, inside the row's own 4 px of padding. */
              className={`block min-w-0 overflow-clip text-ellipsis whitespace-nowrap text-[15px] font-semibold leading-[1.2] [overflow-clip-margin:4px] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] ${working ? '' : 'text-white'}`}
              variants={reduce ? verbRollFade : verbRoll}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={HOST_GLIDE}
              onUpdate={keepOnMainThread}
            >
              {/* the shimmer paints on an INNER span with room above and below: `background-clip: text`
                 never paints past its own box, and the trimmed box is only as tall as the capitals —
                 on a GPU the tails and the tops of the tall letters would be cut (the mode pill's lesson) */}
              {working ? <span className="shimmer-ink py-1" style={phase}>{title}</span> : title}
            </motion.span>
          </AnimatePresence>
        </motion.span>

        <div className="ml-2 flex flex-none items-center gap-2">
          <AnimatePresence initial={false}>
            {showActs && (
              <motion.div key="acts" className="flex items-center gap-1" exit={{ opacity: 0, transition: { duration: 0.12 } }}>
                <motion.span custom={0} variants={reduce ? vcButtonInFade : vcButtonIn} initial="initial" animate="animate" onUpdate={keepOnMainThread}>
                  <Tooltip text={block ?? { en: 'Go back to this version', uk: 'Повернутися до цієї версії' }} interactive>
                    <button
                      type="button"
                      data-version-revert
                      aria-label={t({ en: `Go back to “${v.title.en}”`, uk: `Повернутися до «${v.title.uk}»` })}
                      disabled={!!block}
                      onClick={revert}
                      className="vc-icon press-bloom grid h-9 w-9 place-items-center"
                    >
                      <GlyphRevert />
                    </button>
                  </Tooltip>
                </motion.span>
                <motion.span custom={1} variants={reduce ? vcButtonInFade : vcButtonIn} initial="initial" animate="animate" onUpdate={keepOnMainThread}>
                  <Tooltip text={block ?? (previewing ? { en: 'Back to the current version', uk: 'Назад до поточної версії' } : { en: 'Preview this version', uk: 'Переглянути цю версію' })} interactive>
                    <button
                      type="button"
                      data-version-preview
                      aria-pressed={previewing}
                      aria-label={t({ en: `Preview “${v.title.en}”`, uk: `Переглянути «${v.title.uk}»` })}
                      disabled={!!block && !previewing}
                      data-on={previewing ? '' : undefined}
                      onClick={preview}
                      className="vc-icon press-bloom grid h-9 w-9 place-items-center"
                    >
                      <GlyphPreview />
                    </button>
                  </Tooltip>
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {!working && (
              <motion.span key="chev" custom={2} variants={reduce ? vcButtonInFade : vcButtonIn} initial="initial" animate="animate" exit="exit" onUpdate={keepOnMainThread}>
                <Tooltip text={open ? { en: 'Hide details', uk: 'Сховати деталі' } : { en: 'What changed', uk: 'Що змінилося' }} interactive>
                  <button
                    type="button"
                    data-version-details
                    aria-expanded={open}
                    aria-label={t(open ? { en: 'Hide details', uk: 'Сховати деталі' } : { en: 'Show what changed', uk: 'Показати, що змінилося' })}
                    onClick={() => setOpen((o) => !o)}
                    className="vc-tonal press-bloom grid h-9 w-9 place-items-center"
                  >
                    <motion.span className="grid place-items-center" animate={{ rotate: open ? 180 : 0 }} transition={reduce ? { duration: 0 } : SPRING}>
                      <GlyphDetails />
                    </motion.span>
                  </button>
                </Tooltip>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Reveal show={open} radius={16} glint={false}>
        <Details v={v} current={current} />
      </Reveal>
    </div>
  )

  if (!fresh) return card
  /* THE CARD ARRIVES AS GLASS (Card Arrival, docs/handoff/card-arrival-spec.md): the card inflates
     from its bottom edge with one soft overshoot, its contents a beat behind, the rim catches the
     light (`.card-arrive`, the Rim Sweep). Only a card that has just been posted. */
  return (
    <motion.div className="origin-bottom" variants={reduce ? cardInFade : cardIn} initial="initial" animate="animate" onUpdate={keepOnMainThread}>
      <motion.div variants={reduce ? cardInBodyFade : cardInBody} initial="initial" animate="animate" onUpdate={keepOnMainThread}>
        {card}
      </motion.div>
    </motion.div>
  )
}

/**
 * THE QUESTION BEFORE GOING BACK — shared by the card's arrow and the preview bar. Worded for what a
 * beginner gets wrong about this button: it does NOT undo the change on the card, it takes the site
 * to how it looked RIGHT AFTER it (the UX review of 30.09.2026; Lovable's own complaint list). So
 * the title says «go back to», the body says «exactly as it looked right after this change» first
 * and the reassurance second, and the button names the act.
 */
export function restoreAsk(v: Version, lang: 'en' | 'uk', published: boolean, t: (x: { en: string; uk: string }) => string) {
  const when = timeOf(v.at, lang)
  return {
    title: t({ en: `Go back to “${v.title.en}”?`, uk: `Повернутися до «${v.title.uk}»?` }),
    body: t({
      en: `Your site will look exactly as it did right after this change — Version ${v.n}, ${when}. Nothing is deleted: the versions after it stay in the chat, and you can switch back anytime. Free.${published ? ' Your live site won’t change until you publish.' : ''}`,
      uk: `Сайт виглядатиме точно так, як одразу після цієї зміни — версія ${v.n}, ${when}. Нічого не видаляється: наступні версії лишаються в чаті, повернутися можна будь-коли. Безкоштовно.${published ? ' Опублікований сайт не зміниться, доки ви не опублікуєте.' : ''}`,
    }),
    confirmLabel: t({ en: 'Restore version', uk: 'Відновити версію' }),
    cancelLabel: t({ en: 'Cancel', uk: 'Скасувати' }),
    onConfirm: () => restoreVersion(v.n),
  }
}

/** The house spinner, in the slot while Remixer works — the arc on the scope's saturated hue. */
function Spinner() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden data-version-spinner>
      <circle cx="12" cy="12" r="8" stroke="var(--white-200)" strokeWidth="1.8" />
      <path d="M12 4a8 8 0 0 1 8 8" stroke="var(--sh-arc)" strokeWidth="1.8" strokeLinecap="round" className="step-spin" />
    </svg>
  )
}

/* ================================================================== the details */

function Details({ v, current }: { v: Version; current: boolean }) {
  const { t, lang } = useT()
  const meta = [
    t({ en: `Version ${v.n}`, uk: `Версія ${v.n}` }),
    timeOf(v.at, lang),
    v.cost ? t({ en: `${v.cost} credits`, uk: `${v.cost} кредитів` }) : t({ en: 'Free', uk: 'Безкоштовно' }),
    ...(v.from ? [t({ en: `Back to Version ${v.from}`, uk: `Повернення до версії ${v.from}` })] : []),
    ...(current ? [t({ en: 'Current version', uk: 'Поточна версія' })] : []),
  ]
  return (
    <div className="mx-5 border-t border-[var(--white-100)] pb-[18px] pt-3" data-version-body>
      <p className="font-display text-[12px] leading-[16px] tabular-nums text-[var(--white-480)]">{meta.join(' · ')}</p>
      <ul className="mt-3 flex flex-col gap-3">
        {v.changes.map((c, i) => <ChangeRow key={i} c={c} />)}
      </ul>
    </div>
  )
}

function ChangeRow({ c }: { c: VersionChange }) {
  const { t } = useT()
  const label = typeof c.text === 'string' ? c.text : t(c.text)
  const inline = c.kind === 'style' && (c.before || c.after) && !(c.before && c.after && c.before.length + c.after.length > 34)
  return (
    <li className="flex gap-2.5 text-[14px] leading-[20px] text-[var(--white-800,rgba(255,255,255,0.8))]" data-version-change={c.kind}>
      <span className="mt-0.5 grid h-4 w-4 flex-none place-items-center text-[var(--white-480)]"><KindIcon kind={c.kind} /></span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{label}</span>
          {c.swatch && (
            <span className="inline-flex items-center gap-1.5" aria-hidden>
              <Swatch c={c.swatch[0]} />
              <Arrow />
              <Swatch c={c.swatch[1]} />
            </span>
          )}
          {inline && (
            <span className="text-[13px] text-[var(--white-480)]">
              {c.before ? <>{c.before} <Arrow inline /> </> : null}<span className="text-white">{c.after}</span>
            </span>
          )}
        </p>
        {!inline && (c.before !== undefined || c.after !== undefined) && (
          <div className="mt-1 flex flex-col gap-0.5 text-[13px] leading-[18px]">
            {c.before ? <p className="text-[var(--white-400)] line-through decoration-[var(--white-300)]">{c.before}</p> : null}
            {c.after ? <p className="text-white">{c.after}</p> : null}
          </div>
        )}
        {c.photo && (
          <div className="mt-2 flex items-center gap-2" aria-hidden>
            <Thumb r={c.photo[0]} />
            <Arrow />
            <Thumb r={c.photo[1]} />
          </div>
        )}
      </div>
    </li>
  )
}

function Swatch({ c }: { c: string }) {
  return <span className="inline-block h-3.5 w-3.5 rounded-[4px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]" style={{ background: c }} />
}

function Arrow({ inline = false }: { inline?: boolean }) {
  return (
    <svg width={inline ? 12 : 14} height={inline ? 12 : 14} viewBox="0 0 14 14" fill="none" className={`${inline ? 'inline-block -mt-px' : ''} text-[var(--white-400)]`} aria-hidden>
      <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function thumbSrc(r: PhotoRef): string | undefined {
  if (r.kind === 'upload') return getUpload(r.id) ?? undefined
  return SITE_PHOTOS[r.id]?.src
}

function Thumb({ r }: { r: PhotoRef }) {
  const src = thumbSrc(r)
  return (
    <span className="relative block h-9 w-12 overflow-hidden rounded-[6px] bg-[var(--gray-800)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">
      {src && <img src={src} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />}
    </span>
  )
}

/** The detail line's mark — what kind of change it was, in one quiet 16 px glyph. */
function KindIcon({ kind }: { kind: VersionChange['kind'] }) {
  const common = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (kind === 'add') return <svg {...common}><path d="M8 3.5v9M3.5 8h9" /></svg>
  if (kind === 'photo') return <svg {...common}><rect x="2.5" y="3.5" width="11" height="9" rx="2" /><path d="m3.5 11 3-3 2.5 2.5L11 8.5l1.5 1.5" /><circle cx="10.5" cy="6" r=".9" fill="currentColor" stroke="none" /></svg>
  if (kind === 'style') return <svg {...common}><path d="M8 2.5c3 0 5.5 2.1 5.5 4.7 0 1.6-1.3 2.3-2.4 2.3H9.8c-.7 0-1.1.8-.7 1.4.5.8 0 2.6-1.1 2.6-3 0-5.5-2.4-5.5-5.5S5 2.5 8 2.5Z" /><circle cx="5.5" cy="7" r=".8" fill="currentColor" stroke="none" /><circle cx="8" cy="5.2" r=".8" fill="currentColor" stroke="none" /><circle cx="10.6" cy="6.4" r=".8" fill="currentColor" stroke="none" /></svg>
  return <svg {...common}><path d="M10.2 3.3 12.7 5.8 6 12.5H3.5V10Z" /><path d="m9 4.5 2.5 2.5" /></svg>
}

/* ================================================================== the stack */

interface CardMV { y: MotionValue<number>; sx: MotionValue<number>; op: MotionValue<number>; mid: MotionValue<number>; back: MotionValue<number>; flow: number; h: number; seen: boolean }

/** Where card k-from-the-front sits on a folded stack (31422:42821): front at 16, then 8, then 0. */
/* `lift` — the pointer is over a folded stack: the peeks rise 3 px more each, the way a stack of
   cards gives under a finger. Not iOS (a phone has no hover) — the desktop's cue that it can be opened. */
function folded(k: number, flow: number, lift = false) {
  const d = lift ? 3 : 0
  if (k === 0) return { y: 16 - flow, sx: 1, op: 1, mid: 0, back: 0 }
  if (k === 1) return { y: 8 - d - flow, sx: 408 / 416, op: 1, mid: 1, back: 0 }
  if (k === 2) return { y: 0 - 2 * d - flow, sx: 400 / 416, op: 0.33, mid: 0, back: 1 }
  return { y: 0 - 2 * d - flow, sx: 400 / 416, op: 0, mid: 0, back: 1 }
}
const FANNED = { y: 0, sx: 1, op: 1, mid: 0, back: 0 }

/** The gap between cards: the thread's own rhythm while they stand apart, iOS's 8 in a fanned stack. */
const GAP_APART = 24
const GAP_STACK = 8

/**
 * THE STACK — a run of the customer's own edits in a row (designer: «когда ты сделал больше 2-х
 * бесплатных изменений подряд, они схлопываются в 1 стек… как у iPhone iOS в шторке… кружок
 * показывает сколько уведомлений в стеке»). Two stand apart like any two turns; the third folds
 * all of them into one card with the older ones peeking above it and the count on its corner.
 *
 * iOS's behaviour, copied: a tap anywhere on the stack fans it out (the front card's own buttons
 * still act on the front version); «Show less» folds it back; a new edit arriving on a folded stack
 * lands on top and the one it replaces tucks in behind; a stack you fanned out stays fanned out.
 *
 * HOW IT MOVES. Every card stays in the flow, at its fanned position, and a fold is a TRANSFORM
 * back to its peek — `y` to 16 / 8 / 0, `scaleX` to 408 and 400 of 416, the depth veils up. The
 * stack's height is the lowest visible card's bottom, recomputed on every frame of any card's `y`,
 * so the thread under the stack moves with it and never with a jump. A fold is a FLIP: before a
 * card retargets, its `y` is re-based so it stays exactly where it was on screen (the gap changes
 * from 24 to 8 and a header row appears when a run becomes a stack; nothing may jump for that).
 * All of it rides `STACK_SPRING`. Transform and opacity; the one height is the stack's own box,
 * the Reveal's measured exception (motion.ts `REVEAL_OPEN`) on a box of a few cards.
 */
export function VersionRun({
  items, current, previewN, isFresh,
}: {
  items: { id: number; v: Version }[]
  current: number | undefined
  previewN: number | null
  isFresh: (id: number) => boolean
}) {
  const { t } = useT()
  const reduce = useReducedMotion()
  const n = items.length
  const stackable = n >= 3
  const [open, setOpen] = useState(false)
  const stacked = stackable && !open
  const [lift, setLift] = useState(false)
  const lifted = stacked && lift
  const col = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const mvs = useRef(new Map<number, CardMV>())
  const recompute = useRef(() => {})
  recompute.current = () => {
    const el = box.current
    if (!el) return
    let bottom = 0
    for (const [, x] of mvs.current) if (x.op.get() > 0 || !stacked) bottom = Math.max(bottom, x.flow + x.y.get() + x.h)
    el.style.height = `${Math.max(0, bottom)}px`
  }
  const mv = (id: number): CardMV => {
    let x = mvs.current.get(id)
    if (!x) {
      x = { y: motionValue(0), sx: motionValue(1), op: motionValue(1), mid: motionValue(0), back: motionValue(0), flow: 0, h: 56, seen: false }
      x.y.on('change', () => recompute.current())
      mvs.current.set(id, x)
    }
    return x
  }

  /* lay the cards out — `flip` on a change of the stack itself (a card more, a fold, a fan-out),
     `follow` when only the content changed size (a card's details unfolding) */
  const arrange = (mode: 'flip' | 'follow') => {
    const c = col.current
    if (!c) return
    const els = Array.from(c.querySelectorAll<HTMLElement>(':scope > [data-run-card]'))
    const ids = new Set<number>()
    els.forEach((el, i) => {
      const id = Number(el.dataset.id)
      ids.add(id)
      const x = mv(id)
      const flow = el.offsetTop
      const h = el.offsetHeight
      const k = els.length - 1 - i
      const to = stacked ? folded(k, flow, lifted) : FANNED
      if (!x.seen) {
        /* a card that has never been laid out lands where it belongs — its own entry is the Card Arrival */
        x.y.jump(to.y); x.sx.jump(to.sx); x.op.jump(to.op); x.mid.jump(to.mid); x.back.jump(to.back)
      } else if (mode === 'flip' || flow !== x.flow) {
        /* stay put on screen through the re-layout, then travel */
        x.y.jump(x.flow + x.y.get() - flow)
      }
      x.flow = flow
      x.h = h
      const was = x.seen
      x.seen = true
      if (!was) return
      if (reduce) { x.y.jump(to.y); x.sx.jump(to.sx); x.op.jump(to.op); x.mid.jump(to.mid); x.back.jump(to.back); return }
      if (mode === 'flip') {
        animate(x.y, to.y, STACK_SPRING)
        animate(x.sx, to.sx, STACK_SPRING)
        const veil = stacked ? STACK_VEIL_IN : STACK_VEIL_OUT
        animate(x.op, to.op, veil)
        animate(x.mid, to.mid, veil)
        animate(x.back, to.back, veil)
      } else if (!x.y.isAnimating()) {
        x.y.jump(to.y)
      } else {
        animate(x.y, to.y, STACK_SPRING)
      }
    })
    for (const id of [...mvs.current.keys()]) if (!ids.has(id)) mvs.current.delete(id)
    recompute.current()
  }

  useLayoutEffect(() => { arrange('flip') }, [n, stacked, lifted]) // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const c = col.current
    if (!c) return
    const ro = new ResizeObserver(() => arrange('follow'))
    for (const el of Array.from(c.children)) ro.observe(el)
    return () => ro.disconnect()
  }, [n, stacked]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={box}
      className={`relative${stacked ? ' cursor-pointer' : ''}`}
      data-version-run={n}
      data-version-stacked={stacked ? '' : undefined}
      onClick={(e) => { if (stacked && !(e.target as Element).closest('button')) { setLift(false); setOpen(true) } }}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setLift(true) }}
      onPointerLeave={() => setLift(false)}
    >
      <div ref={col} className="flex flex-col" style={{ gap: stackable ? GAP_STACK : GAP_APART }}>
        {stackable && (
          <motion.div
            data-run-head
            className="flex h-8 items-center justify-between pl-2"
            initial={false}
            animate={{ opacity: open ? 1 : 0 }}
            transition={open ? STACK_VEIL_OUT : STACK_VEIL_IN}
            style={{ pointerEvents: open ? 'auto' : 'none' }}
          >
            <span className="text-[13px] text-[var(--white-480)]">
              {t({ en: `${n} edits · free`, uk: `${n} ${ukEdits(n)} · безкоштовно` })}
            </span>
            <button
              type="button"
              data-version-collapse
              tabIndex={open ? 0 : -1}
              onClick={(e) => { e.stopPropagation(); setOpen(false) }}
              className="liquid-glass liquid-glass--pill glass-interactive inline-flex h-8 items-center gap-1 rounded-full pl-3 pr-2 text-[13px] font-medium text-white"
            >
              {t({ en: 'Show less', uk: 'Згорнути' })}
              <span className="grid rotate-180 place-items-center"><GlyphDetails size={18} /></span>
            </button>
          </motion.div>
        )}
        {items.map(({ id, v }, i) => {
          const x = mv(id)
          const k = n - 1 - i
          return (
            <Layered key={id} id={id} x={x}>
              <VersionCard
                v={v}
                current={current === v.n}
                fresh={isFresh(id)}
                badge={stacked && k === 0 ? n : undefined}
                folded={stacked && k > 0}
                previewing={previewN === v.n}
              />
            </Layered>
          )
        })}
      </div>
      {/* keyboard and screen readers: the folded stack's tap, as a real control */}
      {stacked && (
        <button type="button" className="sr-only" onClick={() => setOpen(true)} data-version-expand>
          {t({ en: `Show all ${n} edits`, uk: `Показати всі ${n} ${ukEdits(n)}` })}
        </button>
      )}
    </div>
  )
}

/** «3 правки», «5 правок», «21 правка» — Ukrainian counts. */
function ukEdits(n: number) {
  const d = n % 10, h = n % 100
  if (d === 1 && h !== 11) return 'правка'
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return 'правки'
  return 'правок'
}

function Layered({ id, x, children }: { id: number; x: CardMV; children: ReactNode }) {
  return (
    <motion.div data-run-card data-id={id} className="relative" style={{ y: x.y, scaleX: x.sx, opacity: x.op, transformOrigin: '50% 0%' }}>
      {children}
      <motion.span className="vc-veil vc-veil--mid rounded-[16px]" style={{ opacity: x.mid }} aria-hidden />
      <motion.span className="vc-veil vc-veil--back rounded-[16px]" style={{ opacity: x.back }} aria-hidden />
    </motion.div>
  )
}
