/**
 * The AI chat column — left side of the shell in the 2026 redesign.
 *
 * Pixel source: Figma node 25819:143148 (AI Chat, 432px) and 25837:152619 (Input field).
 * User bubbles: max-width 320, padding 20/13/11, radii 24·24·8·24, a faint white
 * gradient (6% → 2%) with a hairline border; text 15/26 in gray-350.
 * Composer: 24px-radius field on white-8% with a 24%-white hairline; "+" and mic are
 * 32px glass circles; send is an outlined circle that fills blue when armed.
 *
 * The composer is live: what you type is added to the transcript and Remixer answers
 * from a canned set (modules/chat/thread.ts). See send.ts for what one message moves.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useWorld, canUseAI } from '@/state/world'
import { useT } from '@/i18n'
import {
  IconPlus, IconMic, IconArrowUp, IconChevronDown, IconCheck,
  IconReplyArrow, IconThumbUp, IconThumbDown, IconCopy, IconMore,
} from '@/ui/icons'
import { ScrollArea } from '@/ui/ScrollArea'
import { baselineThread } from './thread'
import { sendMessage, resumeInterrupted } from './send'
import { bubbleSend, cardIn, cardInBody, cardInBodyFade, cardInFade, cardInRow, cardInRowFade, popover } from '@/ui/motion'
import { BriefPanel } from './BriefPanel'
import { PlanCard } from './PlanCard'
import { SuggestPanel } from './SuggestPanel'
import { RatingPanel } from './RatingPanel'
import { BuildProgress } from './BuildProgress'
import { endDockMotion } from './dock'
import { PLAN_WAITING } from './plan'
import { BRIEF_QUESTIONS, BRIEF_STATUS, answerText } from './brief'

/**
 * The stagger step of a turn on the Home → builder arrival (index.css "THE ARRIVAL"):
 * capped so a long thread does not push the last turns past the arrival phase's end.
 */
const arriveStep = (i: number) => ({ '--i': Math.min(i, 6) } as React.CSSProperties)

/** Where a freshly sent message parks: just clear of the 48px top fade. */
const TOP_INSET = 48

function UserBubble({
  children,
  animate,
  anchorRef,
}: {
  children: React.ReactNode
  animate: boolean
  anchorRef?: React.Ref<HTMLDivElement>
}) {
  return (
    <div ref={anchorRef} className="flex justify-end">
      <motion.div
        variants={bubbleSend}
        initial={animate ? 'initial' : false}
        animate="animate"
        className="liquid-glass liquid-glass--subtle max-w-[320px] origin-bottom-right rounded-[24px] rounded-br-[8px] px-5 pb-[11px] pt-[13px]"
      >
        <p className="whitespace-pre-wrap text-[15px] leading-[26px] text-[var(--gray-350,#c7c7cd)]">{children}</p>
      </motion.div>
    </div>
  )
}

/**
 * Action row under a Remixer answer — Figma "Buttons" (25819:143308).
 * Five 32px standard icon buttons on a 1px gap: the container is invisible until
 * you touch it, which is what makes a row of five read as quiet rather than busy.
 */
function AiActions({ text }: { text: string }) {
  const { t } = useT()
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* clipboard is walled off inside sandboxed embeds — the state still reads right */
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  const btn =
    'grid h-8 w-8 place-items-center rounded-[8px] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]'

  return (
    <div className="-ml-1.5 inline-flex w-fit items-center gap-px">
      <button className={`${btn} text-[var(--white-500)] hover:text-white`} aria-label={t({ en: 'Try again', uk: 'Спробувати ще' })}>
        <IconReplyArrow size={20} />
      </button>
      <button
        onClick={() => setVote(vote === 'down' ? null : 'down')}
        aria-pressed={vote === 'down'}
        aria-label={t({ en: 'Bad answer', uk: 'Погана відповідь' })}
        className={`${btn} ${vote === 'down' ? 'text-white' : 'text-[var(--white-500)] hover:text-white'}`}
      >
        <IconThumbDown size={16} />
      </button>
      <button
        onClick={() => setVote(vote === 'up' ? null : 'up')}
        aria-pressed={vote === 'up'}
        aria-label={t({ en: 'Good answer', uk: 'Гарна відповідь' })}
        className={`${btn} ${vote === 'up' ? 'text-white' : 'text-[var(--white-500)] hover:text-white'}`}
      >
        <IconThumbUp size={16} />
      </button>
      <button
        onClick={copy}
        aria-label={t({ en: 'Copy', uk: 'Копіювати' })}
        className={`${btn} ${copied ? 'text-[var(--live)]' : 'text-[var(--white-500)] hover:text-white'}`}
      >
        <IconCopy size={16} />
      </button>
      <button className={`${btn} text-[var(--white-500)] hover:text-white`} aria-label={t({ en: 'More', uk: 'Ще' })}>
        <IconMore size={20} />
      </button>
    </div>
  )
}

/**
 * A reply revealing itself word by word, the way a streaming answer reads.
 * The whole sentence is laid out at once and each word fades up on a stagger —
 * the step shrinks as the answer grows, so a long paragraph still finishes in
 * about a second instead of crawling.
 */
/** How long the word-by-word reveal of this text will take, in ms. */
function streamDuration(text: string) {
  const n = Math.max(text.split(' ').length, 1)
  return Math.round((n - 1) * Math.min(26, 820 / n)) + 320
}

function StreamedText({ text }: { text: string }) {
  const words = text.split(' ')
  const step = Math.min(26, 820 / Math.max(words.length, 1))
  return (
    <>
      {words.map((w, i) => (
        <span key={i} className="stream-word" style={{ animationDelay: `${Math.round(i * step)}ms` }}>
          {i < words.length - 1 ? `${w} ` : w}
        </span>
      ))}
    </>
  )
}

/** Figma: message column, 9px between the text and its action row. */
function AiMessage({ text, actions, animate, thought }: { text: string; actions?: boolean; animate: boolean; thought?: number }) {
  const { t } = useT()
  return (
    /* No container fade here: the words do the arriving. Nesting a motion
       opacity animation around per-word CSS animations left the whole block
       parked at opacity 0 with the word animations sitting at currentTime 0. */
    <div className="flex flex-col gap-[9px] pr-8">
      {thought !== undefined && (
        /* Lovable: a quiet "Thought for 21s" over the turn that asked instead of built. */
        <p className="-mb-1 text-[13px] leading-[20px] text-[var(--white-400)]">
          {t({ en: `Thought for ${thought}s`, uk: `Думав ${thought} с` })}
        </p>
      )}
      <p className="whitespace-pre-wrap text-[15px] leading-[25px] text-[var(--gray-350,#c7c7cd)]">
        {animate ? <StreamedText text={text} /> : text}
      </p>
      {actions && (
        /* the row waits for the answer to finish writing itself */
        <span
          className={animate ? 'stream-word' : undefined}
          style={animate ? { animationDelay: `${streamDuration(text)}ms` } : undefined}
        >
          <AiActions text={text} />
        </span>
      )}
    </div>
  )
}

/**
 * The brief, summarised — Lovable's card after "Submit": a tool-row title over a
 * two-column table of the answers (frame 11 of the recording). Skipped questions
 * read as Remixer's pick, so nobody wonders whether an answer got lost.
 */
function BriefSummary({ animate }: { animate: boolean }) {
  const { world } = useWorld()
  const { t, lang } = useT()
  /* The shimmer says "Remixer is working". While the plan waits to be started it is NOT
     working — the turn is the customer's — so the title goes still and says so. */
  const waiting = world.brief.status === 'planning' && world.chat !== 'working'
  const settling = world.chat === 'working' && world.project !== 'built'
  const title = world.project === 'built'
    ? t({ en: 'Acknowledged brief and preferences', uk: 'Бриф і вподобання прийнято' })
    : world.project === 'generating'
      ? t({ en: 'Reviewing page layout and style choices', uk: 'Переглядаю лейаут і стилістичні рішення' })
      : waiting
        ? t(PLAN_WAITING)
        : t(BRIEF_STATUS)
  /*
   * SAME MATERIAL AS THE GENERATION OUTLINE, and full width (designer, 07.09.2026:
   * "вот в макете дизайн для этой формы … и он на всю ширину чата как в макете",
   * pointing at 29480:48478). The two cards are the same object at two moments of one
   * turn — what was agreed, then what is being built from it — so they are built from
   * the same anatomy the board gives that one: a hairline shell, a 56px header carrying
   * the title, and a darker inset box holding the rows.
   *
   * ⚠️ NOT `w-fit`. It used to shrink to its content, which made the widest row set the
   * card's width — the same card came out a different size on every run, and in the
   * collapsed chat it sat as a small box in an 800px column while every other turn
   * spanned it.
   */
  /* The arrival — motion.ts `cardIn`: the glass rises out of the dock and inflates, the
     surface inside focuses onto it a beat later, the rows follow one by one, and the rim
     catches the light (`.card-arrive`). Only a card that has just been sent animates;
     one that is on screen at the first paint (a restored transcript) stands still. */
  const reduce = useReducedMotion()
  const [glass, body, row] = reduce ? [cardInFade, cardInBodyFade, cardInRowFade] : [cardIn, cardInBody, cardInRow]
  return (
    <motion.div
      variants={glass}
      initial={animate ? 'initial' : false}
      animate="animate"
      className={`w-full origin-bottom overflow-hidden rounded-[21px] border border-[var(--gray-800)]${animate ? ' card-arrive' : ''}`}
    >
      <motion.div variants={body} className="origin-bottom rounded-[20px] border border-[var(--gray-800)] bg-[#ffffff0a] px-px pb-px">
        <p className={`flex h-[56px] items-center pl-[14px] pr-2 text-[16px] font-semibold leading-[1.2] ${settling ? 'thinking' : 'text-white'}`}>
          {title}
        </p>
        <dl
          className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-6 gap-y-[10px] rounded-[18px] border border-[var(--gray-800)] px-4 py-4 text-[14px] leading-[1.4]"
          style={{ background: 'var(--gray-950)' }}
        >
          {BRIEF_QUESTIONS.map((q, i) => {
            const a = answerText(q, world.brief.answers[q.key], lang)
            /* `display: contents` has no box to move, so the two cells of a row carry the
               row's motion themselves, on the same clock (`custom` is the row index) */
            return (
              <div key={q.key} className="contents">
                <motion.dt variants={row} custom={i} className="text-[#ffffff7a]">{t(q.label)}</motion.dt>
                <motion.dd variants={row} custom={i} className={a.muted ? 'italic text-[#ffffff7a]' : 'font-medium text-white'}>{a.text}</motion.dd>
              </div>
            )
          })}
        </dl>
      </motion.div>
    </motion.div>
  )
}

/** While the questions are open, the thread shows what the agent is up to — a
 *  collapsed tool row with the shimmer, and the "…" of a turn still in flight. */
function BriefStatusRow() {
  const { t } = useT()
  return (
    <div className="flex flex-col gap-2 pr-8">
      <p className="text-[14px] leading-[20px]">
        <span className="thinking">{t(BRIEF_STATUS)}</span>
        <span className="ml-1.5 text-[var(--white-400)]">›</span>
      </p>
      <p className="text-[15px] leading-[16px] tracking-[0.1em] text-[var(--white-500)]">…</p>
    </div>
  )
}

/** The Gemini trick: the disclaimer rides under the LAST answer instead of living
 *  below the composer, where it would cost every screen a permanent bottom margin. */
function Disclaimer() {
  const { t } = useT()
  return (
    <p className="text-[12px] leading-[26px] text-[var(--gray-500)]">
      {t({ en: 'Recorded AI chats may contain errors.', uk: 'Записані чати з AI можуть містити помилки.' })}
    </p>
  )
}

/**
 * THE COMPOSER'S MODE SWITCHER — Figma 29697:54553 (the pill 29697:55394, the open menu
 * 29697:55602; designer 08.09.2026: "нужно в чат добавить кнопку с переключателем режимов
 * Autopilot или Build… точно такой же переключатель есть у lovable.dev").
 *
 * `Autopilot` is Remixer leading: after almost every task it comes back proposing the
 * next one. `Build` is the standard mode for somebody who knows what they want. What the
 * two modes MEAN lives on the axis itself (`World.mode`); Autopilot's proposal cards are
 * the next piece of work and are deliberately not faked here.
 *
 * ⚠️ IT ONLY EXISTS ONCE THERE IS A SITE. Through the brief and the whole first build
 * there is nothing for Autopilot to lead and nothing for Build to change, and this
 * project's rule for a control with nothing to do is that it is better absent than dead
 * (the right rail's buttons, the greyed Publish — CLAUDE.md). Autopilot is the default
 * from the first generation onward, which is exactly when the pill turns up.
 *
 * The menu opens UPWARD out of the pill's right edge — 8px above it, right edges flush,
 * 200 wide, and it overlaps the field's own box as the board draws it. Motion comes from
 * the house popover (ui/motion.ts): it grows from the trigger's corner, so the origin is
 * bottom-right.
 */
const MODES = [
  {
    id: 'autopilot' as const,
    name: { en: 'Autopilot', uk: 'Автопілот' },
    detail: { en: 'Get smart suggestions', uk: 'Отримувати підказки' },
  },
  {
    id: 'build' as const,
    name: { en: 'Build', uk: 'Збирати' },
    detail: { en: 'Make changes directly', uk: 'Змінювати напряму' },
  },
]

function ModeSwitch() {
  const { world, set } = useWorld()
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const current = MODES.find((m) => m.id === world.mode) ?? MODES[0]

  /* Same dismissal as the Publish panel: a press anywhere else, or Escape. */
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t({ en: 'Chat mode', uk: 'Режим чату' })}
        /*
         * 29697:55394, measured on the board: 91×32 — a 1px stroke round a 89px padding box
         * (pl 12 / pr 6, gap 2, label 53, chevron 16). `Black/700` under blur 16, radius 999.
         *
         * ⚠️ THE RIM IS GLASS, the same 24 → 4 → 20 % diagonal its neighbours wear
         * (`.liquid-glass--composer`). The export flattened it: it binds the stroke to ONE
         * variable and writes `border-solid`, so the first pass shipped a flat 24 % rim —
         * and the designer sent it back (09.09.2026: "на кнопке нет эффекта стекла на
         * бордере, сделай как в макете"). The tell was already in the export's own variable
         * list: `Neutral Alpha/50` (4 %) appeared there with nothing to explain it, which is
         * exactly this gradient's middle stop. Same trap as the Home controls' rims.
         *
         * ⚠️ AND THAT IS WHY THE PADDING IS 13 / 7, not the board's 12 / 6. A `border` takes
         * a layout box; the glass rim is a masked `::before` inside the box and takes none.
         * The board's 91 has its 1px stroke INSIDE it (its text starts at x=13, its chevron
         * ends 7 from the right), so the padding has to carry that pixel: 13 + label + 2 +
         * 16 + 7 = the same 91, with the rim painting the outermost pixel of it.
         *
         * ⚠️ The chevron is 16, not 20, and it is CENTRED (frame y=8 of 32 on the board):
         * the 20px glyph is what the old 2px nudge was compensating for. Its ink is
         * `Neutral Alpha/500` = 48% white, which the board keeps even in the gradient state.
         */
        className="liquid-glass liquid-glass--composer glass-interactive group flex h-8 items-center gap-0.5 rounded-full bg-[#09090ba3] pl-[13px] pr-[7px]"
      >
        {/*
          * The label's box is TRIMMED TO THE CAP BAND (`text-box-trim`), as the board draws
          * it — 53×9 for 13px Proxima Nova. Two things ride on that: the glyphs sit on the
          * pill's centre line instead of a line-box centre that carries descender space
          * below the caps, and the gradient below is clipped to the same box the board
          * paints it in.
          */}
        {/*
          * ⚠️ AND ONE PIXEL DOWN FROM THERE, on the designer's eye (09.09.2026: "текст в
          * кнопке явно выше визуально, не отцентрирован по высоте"). The board centres the
          * CAP BAND — cap centre on the pill's centre line, which is what the geometry
          * measures and what shipped — but a lowercase word read against a pill's rounded
          * shape looks high there, because the eye weighs the x-height mass and not the cap.
          * Filmed as a ladder (up 1 · up .5 · as shipped · down .5 · down 1 · down 1.5,
          * scratchpad/mode/ladder-sheet.png) and 1px down is the frame that reads centred.
          * It is a deliberate optical correction, not a geometry fix: everything else about
          * the label still matches the board to a hundredth, so this is the one number to
          * turn if he wants it further either way.
          */}
        <span className="[text-box-edge:cap_alphabetic] [text-box-trim:trim-both] translate-y-px text-[13px] font-medium leading-[1.2]">
          {/*
            * ⚠️ THE INK RIDES AN INNER SPAN, AND THE TRIM STAYS ON THE OUTER ONE. A
            * background NEVER paints outside its element's border box, and `background-clip:
            * text` narrows it further to the glyphs — so a gradient on the TRIMMED box was
            * cut to the cap band: measured, the box was 9.09px tall where the glyphs need 15,
            * and the 3px above and below it went unpainted. The designer saw "Autopilot" with
            * its ascenders and the p's descender sliced off (09.09.2026: "что это за фигня?").
            * The inner inline span's box is the font's own content area, which covers every
            * glyph, while the outer box stays the cap band the board positions by — and the
            * gradient still spans exactly the word's width, as the board paints it.
            */}
          <span
            className={
              /* Autopilot's ink is the gradient (index.css "AUTOPILOT'S GRADIENT INK");
                 every other mode keeps the neutral label. */
              current.id === 'autopilot'
                ? 'mode-ink'
                : 'text-[var(--white-900)] transition-colors duration-[var(--dur-fast)] ease-std group-hover:text-white'
            }
          >
            {t(current.name)}
          </span>
        </span>
        {/* 29816:19007 — with the menu open the board FLIPS the chevron (`-scale-y-100`),
            it does not swap in a second glyph. Flipping through the middle is also why
            the two states can simply be animated into each other. */}
        <span
          className="text-[var(--white-480)] transition-transform duration-[var(--dur-fast)] ease-std"
          style={{ transform: open ? 'scaleY(-1)' : undefined }}
          aria-hidden
        >
          <IconChevronDown size={16} />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label={t({ en: 'Chat mode', uk: 'Режим чату' })}
            variants={popover}
            initial="initial"
            animate="animate"
            exit="exit"
            /*
             * 29816:18942: Gray/750, radius 10, 200 wide, px 3 / py 4 (the rows are 194
             * and sit at x=3), rim `Neutral Alpha/50` as an INSET shadow so it cannot
             * widen the 200 the board draws, drop shadow 0 8 16 / 33%.
             */
            className="absolute bottom-[calc(100%+8px)] right-0 z-30 w-[200px] origin-bottom-right rounded-[10px] bg-[var(--gray-750)] px-[3px] py-1"
            style={{ boxShadow: 'inset 0 0 0 1px #ffffff0a, 0 8px 16px rgba(0,0,0,0.33)' }}
          >
            {/* Autopilot's gradient, defined once for the check below: an SVG stroke cannot
                take `background-clip: text`, so the tick wears the same two colours as a
                real gradient paint (`stroke: url(...)` from index.css). The stops read the
                tokens, so the label and the tick can never drift apart. */}
            <svg className="absolute h-0 w-0" aria-hidden>
              <defs>
                <linearGradient id="chat-mode-ink" x1="0" y1="0" x2="1" y2="0.17">
                  <stop offset="0" stopColor="var(--ai-ink-from)" />
                  <stop offset="1" stopColor="var(--ai-ink-to)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex flex-col gap-px">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  role="menuitemradio"
                  aria-checked={m.id === world.mode}
                  onClick={() => { set({ mode: m.id }); setOpen(false) }}
                  /* `press-bloom`, not `glass-interactive`: the row's hover plate is the
                     board's own `Neutral Alpha/50` (above), so it takes the house bloom alone
                     — the designer's order for these rows, 09.09.2026 ("на кнопки в этом меню
                     тоже эффект клика добавь такой же"). */
                  className="press-bloom group flex h-[52px] w-full items-center text-left"
                >
                  {/*
                    * 29816:18945 — the state layer is `flex-1` in the 52px row, so THE
                    * HOVER PLATE FILLS THE WHOLE ROW (194 × 52, radius 8), and its paint is
                    * `Neutral Alpha/50` = 4% white. The board the switcher was first built
                    * from drew a 40px plate inset in the row at 8% — this one is the
                    * designer's hover state (09.09.2026, "вот тут ты можешь увидеть как
                    * выглядит ховер"), and it supersedes it.
                    */}
                  <span className="flex h-full w-full items-center gap-3 rounded-[8px] px-3 transition-colors duration-[var(--dur-fast)] ease-std group-hover:bg-[var(--white-050)]">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-medium leading-[22px] text-white">{t(m.name)}</span>
                      <span className="mt-0.5 block text-[12px] leading-[1.4] text-[#ffffff8f]">{t(m.detail)}</span>
                    </span>
                    {m.id === world.mode && (
                      /* 29697:55611 — a 24 frame with the glyph filling it (the old 16px
                         tick inked barely half the box), and its paint is Autopilot's
                         gradient: the board binds this frame to NO variable, which is what
                         a raw gradient paint looks like in the export, and the designer
                         asked for it by name (09.09.2026: "цвет текста и галочки не белый,
                         а градиентный"). Not `--action` blue. */
                      <span className="flex h-6 w-6 flex-none items-center justify-center" aria-hidden>
                        <IconCheck size={24} className="mode-check" />
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ChatPanel() {
  const { world } = useWorld()
  const { t } = useT()
  const [draft, setDraft] = useState('')
  /* Bumped on every send; the key restarts the flash even on rapid sends. */
  const [flash, setFlash] = useState(0)
  const field = useRef<HTMLTextAreaElement>(null)
  const viewport = useRef<HTMLDivElement | null>(null)
  const anchor = useRef<HTMLDivElement>(null)
  const spacer = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const parked = useRef<number | null>(null)
  /*
   * Which messages have already been on screen. Animation is per message, not a
   * global "have we mounted yet" flag: with a flag, every send re-rendered the
   * older answers in their animated form, so the whole transcript re-typed
   * itself — and the relayout that caused threw off the scroll measurement below.
   */
  const seen = useRef<Set<number> | null>(null)
  /* Once a message has been marked fresh it STAYS fresh: `seen` flips on the
     next render, and if `isFresh` flipped with it the animated words would be
     torn out and replaced by plain text mid-flight. */
  const fresh = useRef<Set<number>>(new Set())

  const live = world.sent.length > 0
  const thread = live ? world.sent : baselineThread(world.chat)
  const working = world.chat === 'working'
  /* The questions are open: the composer becomes the escape hatch ("Tell Remixer
     what to do instead…") and the thread shows the agent holding. */
  const asking = world.brief.status === 'asking'
  const planning = world.brief.status === 'planning'
  /* Autopilot's proposal shares the dock with those two and never argues with them: the
     brief and the plan are work the customer is in the middle of, a proposal is Remixer
     asking for the next piece of work, and there is no moment when both are true. */
  const suggesting = world.suggest.show === 'proposal' && !asking && !planning
  /* The satisfaction card is the dock's third sheet, and it shares the slot: Autopilot puts
     up either a proposal or this, never both (see `offerSuggestion`). */
  const rating = world.suggest.show === 'rating' && !asking && !planning
  const armed = draft.trim().length > 0 && canUseAI(world) && !working
  const lastUserIndex = thread.reduce((at, m, i) => (m.who === 'user' ? i : at), -1)

  // Whatever is on screen at the first paint counts as already seen.
  if (seen.current === null) {
    seen.current = new Set(thread.map((m) => m.id))
    // …and already parked. The demo threads (and a restored transcript) can END
    // on a user message; without this the parking effect treated it as a fresh
    // send and the whole thread visibly scrolled itself ~0.7s after first paint.
    const last = thread[thread.length - 1]
    parked.current = last && last.who === 'user' ? last.id : -1
  }
  for (const m of thread) if (!seen.current.has(m.id)) fresh.current.add(m.id)
  const isFresh = (id: number) => fresh.current.has(id)

  // Grow the field with the text, up to five lines, then let it scroll.
  useLayoutEffect(() => {
    const el = field.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`
  }, [draft])

  useEffect(() => {
    const vp = viewport.current
    if (vp) vp.scrollTop = vp.scrollHeight
    // a reload mid-send restores chat:'working' with no timer behind it
    resumeInterrupted()
  }, [])

  // Everything rendered this pass has now been seen.
  useEffect(() => {
    thread.forEach((m) => seen.current!.add(m.id))
  })

  /*
   * Sending parks your message at the TOP of the view, the way Lovable does it
   * (checked on a recording of their builder): the thread you already read
   * scrolls away, your request sits under the header, and the whole panel below
   * it is left empty for the answer to fill. A chat that instead sticks to the
   * bottom makes the answer shove your own message off the screen as it writes.
   *
   * That needs room to scroll INTO, so a spacer is grown to exactly the gap —
   * measured once per sent message, never during the answer, so nothing jumps
   * while the reply streams in.
   */
  useEffect(() => {
    const last = thread[thread.length - 1]
    if (!last || last.who !== 'user' || last.id === parked.current) return
    parked.current = last.id

    const vp = viewport.current
    const sp = spacer.current
    const an = anchor.current
    const ls = list.current
    if (!vp || !sp || !an || !ls) return

    // One frame later: the bubble is in the DOM and laid out, so the numbers
    // below are the ones the user will actually see.
    let park = 0
    const raf = requestAnimationFrame(() => {
      // Measure WITHOUT touching the spacer — subtract it instead of collapsing
      // it. Collapsing shortened the scrollable range mid-measurement, so the
      // browser clamped scrollTop and the thread jumped; worse, the write-then-
      // read-back is only honest if no transition is in flight, which a single
      // global CSS rule was able to break. Subtracting cannot be poisoned.
      // NOT vp.scrollHeight: it never reports less than the viewport, so on a
      // short thread it reads as "content already fills the panel" and no room
      // gets made. The list's own box is the honest measurement.
      const below = ls.offsetTop + ls.offsetHeight - sp.offsetHeight - an.offsetTop
      sp.style.height = `${Math.max(0, vp.clientHeight - TOP_INSET - below)}px`

      /*
       * The scroll waits for the bubble to land. Run both at once and the send
       * animation is simply not visible: the bubble springs while the entire
       * thread slides underneath it, and the eye follows the bigger motion.
       * Bubble first, then the thread carries it up to the top. The wait matches
       * the spring's own length — cut it shorter and the scroll starts while the
       * bubble is still growing, which is what hid it in the first place.
       */
      park = window.setTimeout(() => {
        vp.scrollTo({ top: Math.max(0, an.offsetTop - TOP_INSET), behavior: 'smooth' })
      }, 620)
    })
    /* Cancel the rAF too, not only the timer. In a hidden tab rAF callbacks
       freeze in the queue: send, tab away, and the answer commits while hidden —
       the cleanup used to run with `park` still 0, leaving the frozen callback
       to fire on return and scroll the thread against layout that no longer
       exists. */
    return () => { cancelAnimationFrame(raf); window.clearTimeout(park) }
  }, [thread])

  const composerBox = useRef<HTMLDivElement>(null)

  function submit() {
    if (!armed) return
    sendMessage(draft)
    setDraft('')
    // The flash's conic is drawn square and stretched to the box (index.css);
    // hand it the box's real aspect so the stretch is exact at any chat width.
    const el = composerBox.current
    if (el) {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--flash-sx', (r.width / Math.max(r.height, 1)).toFixed(3))
    }
    setFlash((n) => n + 1)
    field.current?.focus()
  }

  return (
    <div className="arrive-chat flex min-h-0 flex-1 flex-col">
      {/* --------------------------------------------- messages (Figma: 16/8 gutters) */}
      {/* chat-col: the thread measures itself (max 600px) and centres in whatever
          width the column has — in the 432px column that is the full width, in a
          collapsed-preview shell it is a centred column, no special mode needed.
          This is exactly how Lovable's chat reads at any width (recording, 06.09). */}
      <ScrollArea className="min-h-0 flex-1" innerClassName="chat-col pl-4 pr-2" viewportRef={viewport}>
        {/*
         * The fade under the chat toolbar — Figma "BG Gradient" (28016:43309):
         * 48px, solid #09090b straight to transparent with NO flat head. The
         * flat head is what made it read as a cut edge: content vanished
         * instantly for the first stretch instead of thinning out the whole way.
         *
         * The scroller carries NO top padding on purpose: a sticky child sticks
         * to the scrollport's padding edge, so any padding leaves a strip above
         * the fade where messages scroll past in the clear. The fade sits in the
         * flow instead, which doubles as the gap above the first message.
         */}
        <div
          className="pointer-events-none sticky top-0 z-10 -ml-4 -mr-2 h-12 flex-none"
          style={{ background: 'linear-gradient(to bottom, #09090b, #09090b00)' }}
          aria-hidden
        />

        {/* pb clears exactly the height of the bottom fade, so at rest nothing
            sits under it — the fade only bites into content once you scroll. */}
        <div ref={list} className="space-y-5 pb-8">
          {thread.length === 0 && !working ? (
            <p className="pt-10 text-center text-[14px] text-[var(--white-400)]">
              {t({ en: 'Describe what you want to build.', uk: 'Опишіть, що збудувати.' })}
            </p>
          ) : (
            thread.map((m, i) => {
              const body = typeof m.text === 'string' ? m.text : t(m.text)
              return (
                /* `arrive-msg`: on the Home → builder arrival the turns cascade in from the
                   top, one after another (`--i` is the stagger step; index.css "THE
                   ARRIVAL"). At any other time the wrapper is inert. */
                <div key={m.id} className="arrive-msg" style={arriveStep(i)}>
                  {m.who === 'user' ? (
                    <UserBubble
                      animate={isFresh(m.id)}
                      anchorRef={i === lastUserIndex ? anchor : undefined}
                    >
                      {body}
                    </UserBubble>
                  ) : m.kind === 'brief' ? (
                    <BriefSummary animate={isFresh(m.id)} />
                  ) : m.kind === 'build' ? (
                    <BuildProgress animate={isFresh(m.id)} />
                  ) : (
                    <AiMessage
                      text={body}
                      thought={m.thought}
                      /* a clarifying turn and the hand-over line are not answers to rate */
                      actions={m.kind !== 'clarify' && m.kind !== 'ack'}
                      animate={isFresh(m.id)}
                    />
                  )}
                </div>
              )
            })
          )}

          {asking && <div className="arrive-msg" style={arriveStep(thread.length)}><BriefStatusRow /></div>}

          {/* While the brief card is settling its own title carries the shimmer —
              a second "Thinking" under it would be two spinners for one wait. The
              generation outline is the same case for a whole minute: it names the
              section in hand and shimmers the line under it, so a "Thinking" below it
              would be a second, vaguer answer to a question already answered. */}
          {working
            && thread[thread.length - 1]?.kind !== 'brief'
            && thread[thread.length - 1]?.kind !== 'build' && (
            <div className="arrive-msg pr-8" style={arriveStep(thread.length)}>
              <p className="thinking text-[15px] leading-[25px]">
                {t({ en: 'Thinking', uk: 'Думаю' })}
              </p>
            </div>
          )}
          {world.chat === 'error' && (
            <div className="pr-8">
              <p className="text-[15px] leading-[25px] text-[var(--danger)]">
                {t({ en: 'Something broke — retrying usually fixes it.', uk: 'Щось зламалось — зазвичай допомагає повтор.' })}
              </p>
            </div>
          )}
          {thread.length > 0 && !working && !asking && <Disclaimer />}
          {/* grown on send so the newest message can reach the top of the view */}
          <div ref={spacer} aria-hidden />
        </div>

        {/* …and above the composer. Figma pins a 32px "BG Gradient" (28016:46454)
            immediately over the input field, transparent to solid, with no flat
            head — a short, purely graded hand-off, not a curtain. */}
        <div
          className="pointer-events-none sticky bottom-0 z-10 -ml-4 -mr-2 -mt-8 h-8 flex-none"
          style={{ background: 'linear-gradient(to bottom, #09090b00, #09090b)' }}
          aria-hidden
        />
      </ScrollArea>

      {/* ------------------------------------------------------------ composer */}
      <div className="flex-none pb-4 pl-4 pr-2" style={{ background: 'var(--black-900)' }}>
        {/*
          * `brief-dock`: while the questions are up, the panel and the composer are ONE
          * glass object — Figma 29464:34334, and the board's own structural call. Lovable
          * floats its panel 8px above a separate composer; the drawn Remixer version puts
          * a single 7%-white shell with a 15% rim around both, 2px between them, radius 24
          * on top and 28 at the bottom. Without the questions the composer stands alone,
          * the way its own board (28016:43526) draws it, so the shell is conditional.
          */}
        <div
          className={`chat-col dock${asking || planning || suggesting || rating ? ' brief-dock' : ''}`}
          /* The dock's rise, morph and fall are CSS on these classes, started by the sheet
             (dock.ts); once the piston has landed the classes go. */
          onAnimationEnd={endDockMotion}
        >
        {/*
          * The shell's paint — index.css "THE BUBBLE". A static cylinder (`.dock-shell`,
          * overflow hidden), the piston that carries the shell's top edge and rim up out of
          * the collar, and the collar itself around the field, painted over the piston.
          * Decorative and below everything; the sheet and the composer are the content.
          */}
        <div className="dock-shell" aria-hidden>
          {/* `.dock-swell` lets the piston's sides breathe with the collar at the peak of
              the bounce; the piston's own transform is the ride, so the swell needs a
              wrapper of its own (two transforms on one element would not compose). */}
          <i className="dock-swell">
            <i className="dock-piston" />
          </i>
          <i className="dock-base" />
        </div>
        {/*
          * ONE presence for both sheets, mode="wait": the questions fold fully into the
          * collar before the plan rises out of it. Overlapping them put both in the dock
          * at once for the length of an exit, and the shell's top edge jumped by a card's
          * height. The plan takes the questions' place in the same shell — same object,
          * next step — and gates the build: nothing generates until Start Building.
          */}
        <AnimatePresence mode="wait">
          {asking ? (
            <BriefPanel key="brief" />
          ) : planning ? (
            <PlanCard key="plan" />
          ) : suggesting ? (
            <SuggestPanel key="suggest" />
          ) : rating ? (
            <RatingPanel key="rating" />
          ) : null}
        </AnimatePresence>
        <div ref={composerBox} className="relative z-20">
          {/* light runs the rim once on send — Google's AI Mode flash */}
          {flash > 0 && (
            <span key={flash} className="composer-glow" aria-hidden>
              {/* Paint order right → top → left is load-bearing: each arc's hard
                  tail edge hides under the arc above it (see index.css). */}
              {/* Arcs are DIRECT children of the filtered <i> — a transformed
                  wrapper in between trips Chromium's overflow-inside-filter bug
                  and the clip stops holding. The aspect stretch lives inside
                  each arc's own keyframed transform instead. */}
              <i className="composer-glow-bloom">
                <b className="cg-arc-right" /><b className="cg-arc-top" /><b className="cg-arc-left" />
              </i>
              <i className="composer-glow-core">
                <b className="cg-arc-right" /><b className="cg-arc-top" /><b className="cg-arc-left" />
              </i>
              {/* keeps the light outside: the field is 80% translucent, and
                  without this plate the glow bleeds straight through it */}
              <s className="composer-glow-plate" />
              {/* hides the parked arcs along the bottom edge; corners stay open */}
              <s className="composer-glow-floor" />
            </span>
          )}
        <div className="composer-field relative rounded-[24px] pb-2 pr-2">
          {/* The charge — a soft light that spreads from the centre of the field and thins
              out across it as the bubble forms (designer, 08.09.2026: "как заряд энергии,
              который плавно рассеивается… эффект лёгкий"). Driven by the dock's `.dock-rise`
              (index.css "THE CHARGE"); at rest invisible and inert. */}
          <span className="dock-splash" aria-hidden>
            <i className="dock-splash-bloom" />
            <i className="dock-splash-rim" />
          </span>
          <div className="pb-4 pl-6 pr-2 pt-[17px]">
            <textarea
              ref={field}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
              disabled={!canUseAI(world)}
              placeholder={
                !canUseAI(world)
                  ? t({ en: 'AI is off — a plan is required', uk: 'AI вимкнено — потрібен план' })
                  : asking
                    ? t({ en: 'Tell Remixer what to do instead...', uk: 'Скажіть Remixer, що зробити замість цього...' })
                    : t({ en: 'Ask Remixer...', uk: 'Запитайте Remixer...' })
              }
              aria-label={t({ en: 'Message Remixer', uk: 'Повідомлення для Remixer' })}
              className="block w-full resize-none bg-transparent text-[16px] leading-[26px] text-[var(--white-900)] outline-none placeholder:text-[var(--gray-400,#a1a1aa)] disabled:cursor-not-allowed"
            />
          </div>
          <div className="flex items-center justify-between pl-2">
            <button
              aria-label={t({ en: 'Attach', uk: 'Прикріпити' })}
              /* the designer's own inspector on this button (09.09.2026): 32×32, Black/700
                 under blur 16, radius 999, and a rim of 24 → 4 → 20 % white top-left to
                 bottom-right — index.css "THE BUILDER COMPOSER'S GLASS CIRCLES".
                 `glass-interactive` is the house gesture (design-system §5): the 8 % hover
                 wash and the press bloom that opens FROM the click point — one class, the
                 delegation in ui/ripple.ts does the rest. */
              className="liquid-glass liquid-glass--composer glass-interactive grid h-8 w-8 place-items-center rounded-full bg-[#09090ba3] text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:text-white"
            >
              <IconPlus size={13} />
            </button>
            <div className="flex items-center gap-2">
              {/* the mode switcher, once there is a site to lead — see ModeSwitch above */}
              {world.project === 'built' && <ModeSwitch />}
              <button
                aria-label={t({ en: 'Voice input', uk: 'Голосове введення' })}
                className="liquid-glass liquid-glass--composer glass-interactive grid h-8 w-8 place-items-center rounded-full bg-[#09090ba3] text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:text-white"
              >
                <IconMic size={15} />
              </button>
              <button
                onClick={submit}
                disabled={!armed}
                aria-label={t({ en: 'Send', uk: 'Надіслати' })}
                /* `press-bloom`, not `glass-interactive`: a filled button already owns its
                   hover and pressed paint (--action-hover / --action-pressed), so it takes the
                   bloom alone — the split the canon draws (ui/ripple.ts, "TWO HOSTS"). */
                className={`press-bloom grid h-8 w-8 place-items-center rounded-full border transition-colors duration-[var(--dur-fast)] ease-std ${
                  armed
                    ? 'border-[var(--action)] bg-[var(--action)] text-white hover:bg-[var(--action-hover)]'
                    : /* Figma 28016:43545 — outlined, no fill, Neutral Alpha/100 rim */
                      'border-[var(--white-100)] text-[var(--white-500)]'
                }`}
              >
                <IconArrowUp size={17} />
              </button>
            </div>
          </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  )
}
