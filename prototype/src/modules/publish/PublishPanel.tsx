/**
 * The publish panel — 2026 redesign, pixel source: Figma node 25819:144061 (548×~335).
 *
 * Card: gray-850, radius 20, hairline border, deep drop shadow, anchored under the
 * Publish button. Header 64px "Publish" (display, 20). Body: an inset card (white-4%,
 * radius 16) holding the website-URL field, then the "Connect your own domain" dashed
 * card. Button bar bottom-right.
 *
 * The Figma frame draws the base case; the connecting/live cases keep the Launchpad
 * logic from the handoff (⑥-A) re-dressed in the same visual language, so every world
 * state still renders. The subtitle under "Connect your own domain" is the one line
 * that changes with entitlement: trial sells the plan, paid says it's included.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useWorld, hasPlan, domainResolves, isCustomDomainActive } from '@/state/world'
import { useUI } from '@/state/ui'
import { useT, type Text } from '@/i18n'
import { STAGING_HOST, CUSTOM_DOMAIN } from '@/data/domains'
import { IconPlus, IconEdit, IconExternal } from '@/ui/icons'
import { popover, popoverContent } from '@/ui/motion'


/** The inset URL field: value + muted suffix, one trailing icon button. */
function UrlField({ value, suffix, live }: { value: string; suffix?: string; live?: boolean }) {
  return (
    <div className="w-full rounded-[12px] border border-[var(--white-200)]">
      <div className="flex h-12 items-center justify-between rounded-[8px] bg-[var(--black-300)] py-1 pl-4 pr-2">
        <p className="min-w-0 truncate text-[15px]">
          {live && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--live)]" aria-hidden />}
          <span className="text-[var(--white-900)]">{value}</span>
          {suffix && <span className="text-[var(--white-500)]">{suffix}</span>}
        </p>
        <button
          className="grid h-8 w-8 flex-none place-items-center rounded-[8px] text-[var(--white-400)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-[var(--white-700)]"
          aria-label={live ? 'Open site' : 'Edit address'}
        >
          {live ? <IconExternal size={16} /> : <IconEdit size={18} />}
        </button>
      </div>
    </div>
  )
}

/**
 * The staging-address line under the domain row, parked by the designer on 19 Aug 2026
 * until its home is decided. Off means the panel shows only the live address.
 */
const SHOW_STAGING_LINE = false

export function PublishPanel() {
  const { world, set } = useWorld()
  const { publishOpen, togglePublish, openDomains, showToast } = useUI()
  const { t } = useT()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!publishOpen) return
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) togglePublish(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') togglePublish(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [publishOpen, togglePublish])

  const paid = hasPlan(world)
  /*
   * What the domain row says, per world state.
   *
   * Two rules run this table, both from the flow map
   * (docs/handoff/domain-flows-end-to-end.md):
   *
   *  1. **The row exists only while something is in flight or wrong.** Once the
   *     domain is live and secure there is nothing to report, so the row is gone
   *     and the address field carries the whole story.
   *  2. **A ghost action appears only when there IS an action.** Amber with a
   *     button reads as "your move"; amber without one reads as "we are working".
   *     Putting a button on `propagating` would invite the customer to fix DNS
   *     propagation, which nobody can.
   *
   * The durations are DreamHost's own, verified: registration completes inside
   * 15 minutes, a NEW registration's nameservers take 24-72 h, and Let's Encrypt
   * issues in roughly 10-30 min once the domain answers.
   */
  const row: {
    tone: 'progress' | 'error'
    sub: Text
    action?: { label: Text; onClick: () => void }
  } | null = (() => {
    switch (world.domain) {
      case 'registering':
        return {
          tone: 'progress',
          sub: { en: 'Registering — usually under 15 minutes', uk: 'Реєструємо — зазвичай менше 15 хвилин' },
        }
      case 'propagating':
        return {
          tone: 'progress',
          sub: {
            en: 'On its way — most visitors within a few hours, up to 72 hours worldwide',
            uk: 'У дорозі — більшість відвідувачів за кілька годин, до 72 годин по всьому світу',
          },
        }
      case 'connecting':
        return {
          tone: 'progress',
          sub: { en: 'Connecting — nothing for you to do', uk: 'Підключаємо — від вас нічого не потрібно' },
        }
      case 'verifying':
        return {
          tone: 'progress',
          sub: {
            en: 'Secure padlock is switching on — usually within 30 minutes. The site already works.',
            uk: 'Увімкнеться захисний замочок — зазвичай до 30 хвилин. Сайт уже працює.',
          },
        }
      case 'icann-hold':
        /* The one state where inaction destroys something that works: an
           unverified registrant email gets the domain suspended, taking the site
           AND the mail down. No countdown is printed — the "15 days" figure on the
           board traces to Squarespace in our own research, not to DreamHost or
           ICANN, so the deadline lives in the email until someone verifies it.
           See docs/handoff/domain-flows-end-to-end.md §4. */
        return {
          tone: 'progress',
          sub: {
            en: 'Confirm your email to keep this domain — check the link we sent you',
            uk: 'Підтвердьте email, щоб зберегти домен — перевірте надісланий лист',
          },
          action: {
            label: { en: 'Resend', uk: 'Надіслати ще раз' },
            onClick: () => showToast({ en: 'Confirmation email sent again', uk: 'Лист надіслано ще раз' }),
          },
        }
      case 'unreachable':
        return {
          tone: 'error',
          sub: { en: 'We can’t reach this domain yet · your plan is active', uk: 'Ми ще не бачимо цей домен · ваш план активний' },
          action: {
            label: { en: 'Check again', uk: 'Перевірити ще раз' },
            onClick: () => set({ domain: 'verifying' }),
          },
        }
      default:
        return null
    }
  })()

  const resolves = domainResolves(world.domain)
  const hasDomain = isCustomDomainActive(world)
  const staging = STAGING_HOST.replace('.remixer.site', '')

  const live = world.domain === 'live' || world.domain === 'multiple'

  /*
   * The primary button is the panel's OWN function: it publishes the site. It is never
   * handed to the domain (㉘ A3), and it never becomes a way to dismiss the panel —
   * which is what the old "Continue" fallback had turned it into. A primary that says
   * "Continue" states nothing: it names neither what happens nor to what.
   *
   * So there are exactly two shapes, and the count is what separates them:
   *   changes pending → the real action, carrying how many and that it costs nothing
   *   nothing pending → the same verb, disabled. Saying "Publish" and doing nothing
   *                     would be worse than being visibly unavailable.
   *
   * "Free" stays in the label because publishing for credits is the single most
   * attackable line in any comparison table against us — the panel says so out loud.
   */
  const pending = world.unpublished > 0
  const n = world.unpublished
  const primary = !pending
    ? { en: 'Publish', uk: 'Опублікувати' }
    : live
      ? { en: `Update · ${n} ${n === 1 ? 'change' : 'changes'} · Free`, uk: `Оновити · змін: ${n} · Безкоштовно` }
      : { en: `Publish · ${n} ${n === 1 ? 'change' : 'changes'} · Free`, uk: `Опублікувати · змін: ${n} · Безкоштовно` }

  return (
    <AnimatePresence>
      {publishOpen && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label={t({ en: 'Publish', uk: 'Публікація' })}
          /* iOS-26 motion: springs out of the Publish button's own corner, then
             the contents arrive a beat later. See ui/motion.ts for the rules. */
          variants={popover}
          initial="initial"
          animate="animate"
          exit="exit"
          /* Figma pins it at x1961 y48 on the 2560 frame: 51px off the right edge
             (5px over the rail), 48px down (4px over the topbar). FIXED, not
             absolute: mounted inside <main>, "right" used to resolve against the
             centre column, so the panel drifted with the chat width. */
          className="fixed right-[51px] top-12 z-40 w-[548px] origin-top-right rounded-[20px] border border-[#ffffff0a] bg-[var(--gray-850)]"
          style={{ boxShadow: '0px 24px 28px rgba(0,0,0,0.5)' }}
        >
          {/* The panel inflates first, its contents arrive a beat later (motion.ts rule 3). */}
          <motion.div variants={popoverContent}>
          {/* -------------------------------------------------------- header, 64px */}
          <div className="flex h-16 items-center pl-6">
            <h3 className="font-display text-[20px] font-semibold leading-[1.2] text-white">
              {t({ en: 'Publish', uk: 'Публікація' })}
            </h3>
          </div>

          {/* ---------------------------------------------------------- body card */}
          <div className="px-1.5">
            {/* Figma: Neutral Alpha/50 (#ffffff0a) for both the fill and the hairline */}
            <div className="rounded-[16px] border border-[#ffffff0a] bg-[#ffffff0a] px-4 pb-4 pt-[19px]">
              {/* -------------------------------------------------- website URL
                  The field shows the custom domain ONLY once it actually answers
                  (`domainResolves`). Before that it shows the staging address,
                  because a field displaying an address that does not resolve is the
                  most misleading thing this panel could do — the customer copies it,
                  sends it to someone, and it fails. */}
              <div className="mb-[19px] flex flex-col gap-[7px]">
                <p className="px-0.5 text-[14px] font-medium leading-[1.4] text-[var(--white-500)]">
                  {resolves
                    ? t({ en: 'Your domain', uk: 'Ваш домен' })
                    : t({ en: 'Your website URL', uk: 'Адреса вашого сайту' })}
                </p>
                {resolves ? (
                  <UrlField value={CUSTOM_DOMAIN} live />
                ) : (
                  <UrlField value={staging} suffix=".remixer.site" />
                )}
                {live && (
                  <p className="px-0.5 text-[13px] leading-[1.4] text-[var(--white-400)]">
                    {t({ en: 'Secure padlock on · anyone can visit.', uk: 'Захисний замочок увімкнено · сайт доступний усім.' })}
                  </p>
                )}
              </div>

              {/* ------------------------------------------------- the domain row
                  Its own row, never the panel's primary button: the primary belongs
                  to the panel's own job (Update), and handing it to the domain would
                  make publishing look blocked by something the customer cannot
                  hurry. So the domain's action is a ghost, on its own line. */}
              {row && (
                <div
                  className={`mb-4 flex items-center gap-3 rounded-[16px] border px-4 py-3.5 ${
                    row.tone === 'error'
                      ? 'border-[#e5595940] bg-[#e559590f]'
                      : 'border-[#e5c35940] bg-[#e5c3590f]'
                  }`}
                >
                  <span className="relative grid h-3 w-3 flex-none place-items-center" aria-hidden>
                    {row.tone === 'progress' && (
                      <span className="absolute h-3 w-3 animate-ping rounded-full bg-[var(--attention)] opacity-50" />
                    )}
                    <span
                      className={`h-2 w-2 rounded-full ${
                        row.tone === 'error' ? 'bg-[#e55959]' : 'bg-[var(--attention)]'
                      }`}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold leading-[1.3] text-white">{CUSTOM_DOMAIN}</p>
                    <p className="mt-0.5 text-[13px] leading-[1.45] text-[var(--white-500)]">{t(row.sub)}</p>
                  </div>
                  {row.action && (
                    <button
                      onClick={row.action.onClick}
                      className="h-9 flex-none rounded-[10px] border border-[var(--white-200)] px-3.5 text-[13px] font-semibold text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
                    >
                      {t(row.action.label)}
                    </button>
                  )}
                </div>
              )}

              {/* connect your own domain — dashed card, only when there is no domain */}
              {!hasDomain && (
                <button
                  onClick={() => openDomains('home')}
                  /* Hover per Figma 26125:3832: the dashed rim brightens (NA/200 →
                     NA/300) and the "+" disc fills WHITE with a dark plus — the
                     row itself keeps its fill. Colours ease over the base duration
                     so the state melts in rather than snapping. */
                  className="group flex w-full items-center gap-4 rounded-[16px] border border-dashed border-[var(--white-200)] py-4 pl-5 pr-8 text-left backdrop-blur-[16px] transition-colors duration-[var(--dur-base)] ease-std hover:border-[var(--white-300)]"
                >
                  {/* Figma 26125:3802: NA/100 fill + 15%-white rim, not the shell glass */}
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-[12px] border border-[#ffffff26] bg-[#ffffff14] text-[var(--white-700)] backdrop-blur-[16px] transition-colors duration-[var(--dur-base)] ease-std group-hover:border-[#ffffff40] group-hover:bg-white group-hover:text-[#09090b]">
                    <IconPlus size={13} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[16px] font-semibold leading-normal text-white">
                      {t({ en: 'Connect your own domain', uk: 'Підключити власний домен' })}
                    </span>
                    <span className="mt-1 block text-[13px] leading-normal text-[var(--white-500)]">
                      {paid
                        ? t({ en: 'Included in your Remixer Build plan', uk: 'Входить у ваш план Remixer Build' })
                        : t({ en: 'Requires the Remixer Build plan — $9.99/mo', uk: 'Потрібен план Remixer Build — $9.99/міс' })}
                    </span>
                  </span>
                </button>
              )}

              {/* Staging address — HIDDEN for now (designer, 19 Aug 2026: "пока не знаю
                  что с ним делать, будет он или нет, или если убрать то куда").
                  The line is kept rather than deleted because the argument for it is
                  still live: it is the reassurance that makes a 24–72 h wait tolerable —
                  whatever the domain is doing, this link keeps working. Flip the flag to
                  bring it back; where it finally lives is an open design question. */}
              {SHOW_STAGING_LINE && hasDomain && (
                <div className="px-1">
                  <p className="text-[12.5px] leading-[1.4] text-[var(--white-300)]">
                    {t({ en: 'Staging address', uk: 'Адреса стейджингу' })}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[var(--white-500)]">
                    {STAGING_HOST}
                    <IconExternal size={12} />
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ---------------------------------------------------------- button bar */}
          <div className="flex items-center justify-end gap-2 px-4 py-4">
            <button
              onClick={() => set({ unpublished: 0 })}
              disabled={!pending}
              className={`flex h-10 items-center gap-2 rounded-[10px] px-5 text-[14px] font-semibold transition-colors duration-[var(--dur-fast)] ease-std ${
                pending
                  ? 'bg-[var(--action)] text-white hover:bg-[var(--action-hover)]'
                  : 'cursor-not-allowed bg-[var(--white-100)] text-[var(--white-400)]'
              }`}
            >
              {/* The pending-changes dot. Asked for as blue; rendered WHITE because the
                  button it sits on IS the blue — a blue dot on --action is invisible.
                  Same signal, the only fill that reads against it. */}
              {pending && <span className="h-1.5 w-1.5 flex-none rounded-full bg-white/90" aria-hidden />}
              {t(primary)}
            </button>
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
