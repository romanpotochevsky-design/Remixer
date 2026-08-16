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
import { useWorld, canUseAI } from '@/state/world'
import { useT } from '@/i18n'
import {
  IconPlus, IconMic, IconArrowUp,
  IconReplyArrow, IconThumbUp, IconThumbDown, IconCopy, IconMore,
} from '@/ui/icons'
import { ScrollArea } from '@/ui/ScrollArea'
import { baselineThread } from './thread'
import { sendMessage } from './send'

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="liquid-glass liquid-glass--subtle max-w-[320px] rounded-[24px] rounded-br-[8px] px-5 pb-[11px] pt-[13px]">
        <p className="whitespace-pre-wrap text-[15px] leading-[26px] text-[var(--gray-350,#c7c7cd)]">{children}</p>
      </div>
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

/** Figma: message column, 9px between the text and its action row. */
function AiMessage({ text, actions }: { text: string; actions?: boolean }) {
  return (
    <div className="flex flex-col gap-[9px] pr-8">
      <p className="whitespace-pre-wrap text-[15px] leading-[25px] text-[var(--gray-350,#c7c7cd)]">{text}</p>
      {actions && <AiActions text={text} />}
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
  const field = useRef<HTMLTextAreaElement>(null)
  const bottom = useRef<HTMLDivElement>(null)

  const live = world.sent.length > 0
  const thread = live ? world.sent : baselineThread(world.chat)
  const working = world.chat === 'working'
  const armed = draft.trim().length > 0 && canUseAI(world) && !working

  // Grow the field with the text, up to five lines, then let it scroll.
  useLayoutEffect(() => {
    const el = field.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`
  }, [draft])

  // Follow the conversation down as it grows, the way every chat does.
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [thread.length, working])

  function submit() {
    if (!armed) return
    sendMessage(draft)
    setDraft('')
    field.current?.focus()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* --------------------------------------------- messages (Figma: 16/8 gutters) */}
      <ScrollArea className="min-h-0 flex-1" innerClassName="pl-4 pr-2 pt-4">
        {/*
         * The fade under the chat toolbar. Figma stacks two rectangles here
         * (28016:43308 "BG" 52px solid + 28016:43309 "BG Gradient" 48px), so a
         * message scrolling up is fully gone before it reaches the logo rather
         * than being clipped by a hard edge. One gradient with a solid head does
         * the same job: opaque for the first stretch, then a long tail out.
         */}
        <div
          className="pointer-events-none sticky top-0 z-10 -ml-4 -mr-2 -mt-4 h-16 flex-none"
          style={{ background: 'linear-gradient(to bottom, #09090b 0%, #09090b 42%, #09090b00 100%)' }}
          aria-hidden
        />

        {/* pb clears exactly the height of the bottom fade, so at rest nothing
            sits under it — the fade only bites into content once you scroll. */}
        <div className="space-y-5 pb-16">
          {thread.length === 0 && !working ? (
            <p className="pt-10 text-center text-[14px] text-[var(--white-400)]">
              {t({ en: 'Describe what you want to build.', uk: 'Опишіть, що збудувати.' })}
            </p>
          ) : (
            thread.map((m) => {
              const body = typeof m.text === 'string' ? m.text : t(m.text)
              return m.who === 'user' ? (
                <UserBubble key={m.id}>{body}</UserBubble>
              ) : (
                <AiMessage key={m.id} text={body} actions />
              )
            })
          )}

          {working && (
            <div className="pr-8">
              <p className="inline-flex items-center gap-2 text-[15px] leading-[25px] text-[var(--white-400)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden />
                {t({ en: 'Working on it…', uk: 'Працюю над цим…' })}
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
          <div ref={bottom} />
        </div>

        {/* …and the mirror of it above the composer, so a message slides out of
            sight instead of being cut off by the input field's top edge. */}
        <div
          className="pointer-events-none sticky bottom-0 z-10 -ml-4 -mr-2 -mt-16 h-16 flex-none"
          style={{ background: 'linear-gradient(to top, #09090b 0%, #09090b 38%, #09090b00 100%)' }}
          aria-hidden
        />
      </ScrollArea>

      {/* ------------------------------------------------------------ composer */}
      <div className="flex-none pb-4 pl-4 pr-2" style={{ background: 'var(--black-900)' }}>
        <div className="liquid-glass rounded-[24px] pb-2 pr-2">
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
              className="liquid-glass grid h-8 w-8 place-items-center rounded-full text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:text-white"
            >
              <IconPlus size={13} />
            </button>
            <div className="flex items-center gap-2">
              <button
                aria-label={t({ en: 'Voice input', uk: 'Голосове введення' })}
                className="liquid-glass grid h-8 w-8 place-items-center rounded-full text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:text-white"
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
                    : 'border-[var(--white-100)] bg-[var(--white-100)] text-[var(--white-500)]'
                }`}
              >
                <IconArrowUp size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
