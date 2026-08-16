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
import { useWorld, hasPlan } from '@/state/world'
import { useUI } from '@/state/ui'
import { useT } from '@/i18n'
import { STAGING_HOST, CUSTOM_DOMAIN } from '@/data/domains'
import { IconPlus, IconEdit, IconExternal } from '@/ui/icons'
import { popover } from '@/ui/motion'


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

export function PublishPanel() {
  const { world, set } = useWorld()
  const { publishOpen, togglePublish, openDomains } = useUI()
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
  const connecting = world.domain === 'connecting' || world.domain === 'verifying'
  const live = world.domain === 'live' || world.domain === 'multiple'
  const staging = STAGING_HOST.replace('.remixer.site', '')

  const primary =
    world.unpublished > 0
      ? live
        ? { en: `Update · ${world.unpublished} changes · Free`, uk: `Оновити · змін: ${world.unpublished} · Безкоштовно` }
        : { en: `Publish · Free`, uk: `Опублікувати · Безкоштовно` }
      : { en: 'Continue', uk: 'Продовжити' }

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
          className="absolute top-[var(--topbar-h)] z-40 w-[548px] origin-top-right rounded-[20px] border border-[#ffffff0a] bg-[var(--gray-850)]"
          style={{ right: 'calc(var(--rail-w) + 8px)', boxShadow: '0px 24px 28px rgba(0,0,0,0.5)' }}
        >
          {/* -------------------------------------------------------- header, 64px */}
          <div className="flex h-16 items-center pl-6">
            <h3 className="font-display text-[20px] font-semibold leading-[1.2] text-white">
              {t({ en: 'Publish', uk: 'Публікація' })}
            </h3>
          </div>

          {/* ---------------------------------------------------------- body card */}
          <div className="px-1.5">
            {/* Figma: Neutral Alpha/50 (#ffffff0a) for both the fill and the hairline */}
            <div className="rounded-[16px] border border-[#ffffff0a] bg-[#ffffff08] px-4 pb-4 pt-[19px]">
              {/* website URL */}
              <div className="mb-[19px] flex flex-col gap-[7px]">
                <p className="px-0.5 text-[14px] font-medium leading-[1.4] text-[var(--white-500)]">
                  {live || connecting
                    ? t({ en: 'Your domain', uk: 'Ваш домен' })
                    : t({ en: 'Your website URL', uk: 'Адреса вашого сайту' })}
                </p>
                {live || connecting ? (
                  <UrlField value={CUSTOM_DOMAIN} live={live} />
                ) : (
                  <UrlField value={staging} suffix=".remixer.site" />
                )}
                {connecting && (
                  <p className="px-0.5 text-[13px] leading-[1.4] text-[var(--attention)]">
                    {t({
                      en: 'Connecting — usually a few minutes. Keep editing, it goes live on its own.',
                      uk: 'Підключається — зазвичай кілька хвилин. Редагуйте далі, сайт запуститься сам.',
                    })}
                  </p>
                )}
                {live && (
                  <p className="px-0.5 text-[13px] leading-[1.4] text-[var(--white-400)]">
                    {t({ en: 'Secure padlock on · anyone can visit.', uk: 'Захисний замочок увімкнено · сайт доступний усім.' })}
                  </p>
                )}
              </div>

              {/* connect your own domain — dashed card (hidden once a domain is on) */}
              {!live && !connecting && (
                <button
                  onClick={() => openDomains('home')}
                  className="flex w-full items-center gap-4 rounded-[16px] border border-dashed border-[var(--white-200)] py-4 pl-5 pr-8 text-left backdrop-blur-[16px] transition-colors duration-[var(--dur-fast)] ease-std hover:border-[var(--white-300)] hover:bg-[var(--white-100)]/[0.04]"
                >
                  <span className="liquid-glass grid h-8 w-8 flex-none place-items-center rounded-[12px] text-[var(--white-700)]">
                    <IconPlus size={13} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[16px] font-semibold leading-normal text-white">
                      {t({ en: 'Connect your own domain', uk: 'Підключити власний домен' })}
                    </span>
                    <span className="mt-1 block text-[13px] leading-normal text-[var(--white-500)]">
                      {paid
                        ? t({ en: '✓ Included in your Remixer Build plan', uk: '✓ Входить у ваш план Remixer Build' })
                        : t({ en: 'Requires the Remixer Build plan — $9.99/mo', uk: 'Потрібен план Remixer Build — $9.99/міс' })}
                    </span>
                  </span>
                </button>
              )}

              {/* private preview line under a live/connecting domain */}
              {(live || connecting) && (
                <div className="flex items-center justify-between gap-3 rounded-[16px] border border-dashed border-[var(--white-200)] px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] text-[var(--white-500)]">{STAGING_HOST}</p>
                    <p className="mt-0.5 text-[12.5px] text-[var(--white-300)]">
                      {t({ en: 'Private preview · always free · hidden from Google', uk: 'Приватне прев’ю · завжди безкоштовно · приховано від Google' })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ---------------------------------------------------------- button bar */}
          <div className="flex items-center justify-end gap-2 px-4 py-4">
            {connecting && (
              <button
                onClick={() => set({ domain: world.domain === 'connecting' ? 'verifying' : 'live' })}
                className="h-10 rounded-[10px] border border-[var(--white-200)] px-5 text-[14px] font-medium text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--gray-800)]"
              >
                {t({ en: 'Refresh status', uk: 'Оновити статус' })}
              </button>
            )}
            <button
              onClick={() => (world.unpublished > 0 ? set({ unpublished: 0 }) : togglePublish(false))}
              className="h-10 rounded-[10px] bg-[var(--action)] px-5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
            >
              {t(primary)}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
