/**
 * The AI chat column — left side of the shell in the 2026 redesign.
 *
 * Pixel source: Figma node 25819:143148 (AI Chat, 432px) and 25837:152619 (Input field).
 * User bubbles: max-width 320, padding 20/13/11, radii 24·24·8·24, a faint white
 * gradient (6% → 2%) with a hairline border; text 15/26 in gray-350.
 * Composer: 24px-radius field on white-8% with a 24%-white hairline; "+" and mic are
 * 32px glass circles; send is an outlined circle that fills blue when armed.
 */
import { useWorld, canUseAI, hasPlan, trialDaysLeft } from '@/state/world'
import { useT } from '@/i18n'
import { IconPlus, IconMic, IconArrowUp } from '@/ui/icons'
import { revealScrollbar } from '@/ui/scroll'

/** Demo transcript for the fit-ration project — hardcoded, like all prototype data. */
const DEMO_THREAD = [
  {
    who: 'user' as const,
    text: {
      en: 'Build me a clean site for my meal-prep service — exact macros, weekly menus, delivery in Odesa.',
      uk: 'Збери мені акуратний сайт для сервісу готових раціонів — точне КБЖВ, тижневі меню, доставка по Одесі.',
    },
  },
  {
    who: 'ai' as const,
    text: {
      en: 'Done — five pages with a hero, menu grid and order form. Want me to tune the palette next?',
      uk: 'Готово — п’ять сторінок: хіро, сітка меню та форма замовлення. Далі підлаштувати палітру?',
    },
  },
  {
    who: 'user' as const,
    text: {
      en: 'Make the menu cards bigger and add photos.',
      uk: 'Зроби картки меню більшими і додай фото.',
    },
  },
]

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="liquid-glass liquid-glass--subtle max-w-[320px] rounded-[24px] rounded-br-[8px] px-5 pb-[11px] pt-[13px]">
        <p className="text-[15px] leading-[26px] text-[var(--gray-350,#c7c7cd)]">{children}</p>
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* --------------------------------------------- messages (Figma: 16/8 gutters) */}
      <div onScroll={revealScrollbar} className="relative min-h-0 flex-1 overflow-y-auto pl-4 pr-2 pt-4">
        {/* scroll fade under the toolbar (Figma: BG + BG Gradient, 48px) */}
        <div
          className="pointer-events-none sticky top-0 -ml-4 -mr-2 -mt-4 h-12 flex-none"
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
          {world.chat === 'empty' ? (
            <p className="pt-10 text-center text-[14px] text-[var(--white-400)]">
              {t({ en: 'Describe what you want to build.', uk: 'Опишіть, що збудувати.' })}
            </p>
          ) : (
            <>
              {DEMO_THREAD.slice(0, world.chat === 'short' ? 1 : DEMO_THREAD.length).map((m, i) =>
                m.who === 'user' ? (
                  <UserBubble key={i}>{t(m.text)}</UserBubble>
                ) : (
                  <AiMessage key={i}>{t(m.text)}</AiMessage>
                ),
              )}
              {world.chat === 'working' && (
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
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------ composer */}
      <div className="flex-none pb-4 pl-4 pr-2" style={{ background: 'var(--black-900)' }}>
        <div className="liquid-glass rounded-[24px] pb-2 pr-2">
          <div className="pb-4 pl-6 pr-2 pt-[17px]">
            <p className="text-[16px] leading-[26px] text-[var(--gray-400,#a1a1aa)]">
              {canUseAI(world)
                ? t({ en: 'Ask Remixer...', uk: 'Запитайте Remixer...' })
                : t({ en: 'AI is off — a plan is required', uk: 'AI вимкнено — потрібен план' })}
            </p>
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
                aria-label={t({ en: 'Send', uk: 'Надіслати' })}
                className="grid h-8 w-8 place-items-center rounded-full border border-[var(--white-100)] bg-[var(--white-100)] text-[var(--white-500)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-200)] hover:text-white"
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
