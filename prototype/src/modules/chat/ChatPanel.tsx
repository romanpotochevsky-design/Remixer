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
import { motion } from 'motion/react'
import { useWorld, canUseAI } from '@/state/world'
import { useT } from '@/i18n'
import {
  IconPlus, IconMic, IconArrowUp,
  IconReplyArrow, IconThumbUp, IconThumbDown, IconCopy, IconMore,
} from '@/ui/icons'
import { ScrollArea } from '@/ui/ScrollArea'
import { baselineThread } from './thread'
import { sendMessage } from './send'
import { bubbleSend } from '@/ui/motion'

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
function AiMessage({ text, actions, animate }: { text: string; actions?: boolean; animate: boolean }) {
  return (
    /* No container fade here: the words do the arriving. Nesting a motion
       opacity animation around per-word CSS animations left the whole block
       parked at opacity 0 with the word animations sitting at currentTime 0. */
    <div className="flex flex-col gap-[9px] pr-8">
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
  const armed = draft.trim().length > 0 && canUseAI(world) && !working
  const lastUserIndex = thread.reduce((at, m, i) => (m.who === 'user' ? i : at), -1)

  // Whatever is on screen at the first paint counts as already seen.
  if (seen.current === null) seen.current = new Set(thread.map((m) => m.id))
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
    requestAnimationFrame(() => {
      sp.style.height = '0px'
      // NOT vp.scrollHeight: it never reports less than the viewport, so on a
      // short thread it reads as "content already fills the panel" and no room
      // gets made. The list's own box is the honest measurement.
      const below = ls.offsetTop + ls.offsetHeight - an.offsetTop
      sp.style.height = `${Math.max(0, vp.clientHeight - TOP_INSET - below)}px`
      vp.scrollTo({ top: Math.max(0, an.offsetTop - TOP_INSET), behavior: 'smooth' })
    })
  }, [thread])

  function submit() {
    if (!armed) return
    sendMessage(draft)
    setDraft('')
    setFlash((n) => n + 1)
    field.current?.focus()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* --------------------------------------------- messages (Figma: 16/8 gutters) */}
      <ScrollArea className="min-h-0 flex-1" innerClassName="pl-4 pr-2" viewportRef={viewport}>
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
              return m.who === 'user' ? (
                <UserBubble
                  key={m.id}
                  animate={isFresh(m.id)}
                  anchorRef={i === lastUserIndex ? anchor : undefined}
                >
                  {body}
                </UserBubble>
              ) : (
                <AiMessage key={m.id} text={body} actions animate={isFresh(m.id)} />
              )
            })
          )}

          {working && (
            <div className="pr-8">
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
          {thread.length > 0 && !working && <Disclaimer />}
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
        <div className="relative">
          {/* light runs the rim once on send — Google's AI Mode flash */}
          {flash > 0 && (
            <span key={flash} className="composer-glow" aria-hidden>
              <i className="composer-glow-bloom"><b /></i>
              <i className="composer-glow-core"><b /></i>
            </span>
          )}
        <div className="composer-field relative rounded-[24px] pb-2 pr-2">
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
                canUseAI(world)
                  ? t({ en: 'Ask Remixer...', uk: 'Запитайте Remixer...' })
                  : t({ en: 'AI is off — a plan is required', uk: 'AI вимкнено — потрібен план' })
              }
              aria-label={t({ en: 'Message Remixer', uk: 'Повідомлення для Remixer' })}
              className="block w-full resize-none bg-transparent text-[16px] leading-[26px] text-[var(--white-900)] outline-none placeholder:text-[var(--gray-400,#a1a1aa)] disabled:cursor-not-allowed"
            />
          </div>
          <div className="flex items-center justify-between pl-2">
            <button
              aria-label={t({ en: 'Attach', uk: 'Прикріпити' })}
              className="grid h-8 w-8 place-items-center rounded-full border border-[#ffffff3d] bg-[#09090ba3] text-[var(--white-700)] backdrop-blur-[16px] transition-colors duration-[var(--dur-fast)] ease-std hover:text-white"
            >
              <IconPlus size={13} />
            </button>
            <div className="flex items-center gap-2">
              <button
                aria-label={t({ en: 'Voice input', uk: 'Голосове введення' })}
                className="grid h-8 w-8 place-items-center rounded-full border border-[#ffffff3d] bg-[#09090ba3] text-[var(--white-700)] backdrop-blur-[16px] transition-colors duration-[var(--dur-fast)] ease-std hover:text-white"
              >
                <IconMic size={15} />
              </button>
              <button
                onClick={submit}
                disabled={!armed}
                aria-label={t({ en: 'Send', uk: 'Надіслати' })}
                className={`grid h-8 w-8 place-items-center rounded-full border transition-colors duration-[var(--dur-fast)] ease-std ${
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
  )
}
