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
import { useWorld, canUseAI, hasPlan, trialDaysLeft } from '@/state/world'
import { useT } from '@/i18n'
import { IconPlus, IconMic, IconArrowUp } from '@/ui/icons'
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

function AiMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="pr-8">
      <p className="text-[15px] leading-[26px] text-[var(--white-700)]">{children}</p>
    </div>
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
        {/* scroll fade under the toolbar (Figma: BG + BG Gradient, 48px) */}
        <div
          className="pointer-events-none sticky top-0 z-10 -ml-4 -mr-2 -mt-4 h-12 flex-none"
          style={{ background: 'linear-gradient(to bottom, #09090b, #09090b00)' }}
          aria-hidden
        />

        {!hasPlan(world) && (
          <div className="mb-4 flex justify-center">
            <span className="rounded-full bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] px-3 py-1 text-[12px] font-medium text-white">
              {world.account === 'trial'
                ? t({ en: `Free trial · ${trialDaysLeft(world)} days left`, uk: `Тріал · ${trialDaysLeft(world)} дн.` })
                : t({ en: 'Plan required', uk: 'Потрібен план' })}
            </span>
          </div>
        )}

        <div className="space-y-5 pb-6">
          {thread.length === 0 && !working ? (
            <p className="pt-10 text-center text-[14px] text-[var(--white-400)]">
              {t({ en: 'Describe what you want to build.', uk: 'Опишіть, що збудувати.' })}
            </p>
          ) : (
            thread.map((m) =>
              m.who === 'user' ? (
                <UserBubble key={m.id}>{typeof m.text === 'string' ? m.text : t(m.text)}</UserBubble>
              ) : (
                <AiMessage key={m.id}>{typeof m.text === 'string' ? m.text : t(m.text)}</AiMessage>
              ),
            )
          )}

          {working && (
            <AiMessage>
              <span className="inline-flex items-center gap-2 text-[var(--white-400)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden />
                {t({ en: 'Working on it…', uk: 'Працюю над цим…' })}
              </span>
            </AiMessage>
          )}
          {world.chat === 'error' && (
            <AiMessage>
              <span className="text-[var(--danger)]">
                {t({ en: 'Something broke — retrying usually fixes it.', uk: 'Щось зламалось — зазвичай допомагає повтор.' })}
              </span>
            </AiMessage>
          )}
          <div ref={bottom} />
        </div>
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
