/**
 * The publish panel — direction "Launchpad" (handoff section ⑥-A).
 *
 * One dominant hero for the PUBLIC WEBSITE, one demoted row for the PRIVATE PREVIEW
 * below a hairline. The hero is the conversion-critical surface and renders one of
 * four cases from the world:
 *
 *   1. trial, no plan   → sell the plan ($9.99/mo box), CTA "Connect a domain →"
 *   2. paid, no domain  → no upsell, green "included" box, same CTA
 *   3. connecting       → progress + "keep editing", Refresh status
 *   4. live             → the address + padlock line + Visit site ↗
 *
 * Publishing itself costs nothing and says so — the audit's #1 conclusion. The word
 * system is fixed: Publish/Update = republish, Connect = attach your own, Add = buy.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useWorld, hasPlan } from '@/state/world'
import { useUI } from '@/state/ui'
import { useT } from '@/i18n'
import { STAGING_HOST, CUSTOM_DOMAIN } from '@/data/domains'

const EASE = [0.2, 0, 0, 1] as const

export function PublishPanel() {
  const { world, set } = useWorld()
  const { publishOpen, togglePublish, openDomains } = useUI()
  const { t } = useT()
  const panelRef = useRef<HTMLDivElement>(null)

  /* Dismiss on outside click / Escape — a popover must never trap anyone. */
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
  const kase =
    world.domain === 'live' || world.domain === 'multiple' ? 'live'
    : world.domain === 'connecting' || world.domain === 'verifying' ? 'connecting'
    : paid ? 'plan-no-domain'
    : 'trial-no-plan'

  return (
    <AnimatePresence>
      {publishOpen && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label={t({ en: 'Publish', uk: 'Публікація' })}
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="absolute right-2 top-[calc(var(--topbar-h)+4px)] z-40 w-[420px] origin-top-right rounded-shell border border-[var(--gray-800)] bg-[var(--gray-850)] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
        >
          {/* ------------------------------------------------ hero: public website */}
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--white-400)]">
            {t({ en: 'Public website', uk: 'Публічний сайт' })}
          </p>

          {kase === 'trial-no-plan' && (
            <>
              <h3 className="font-display text-[22px] font-semibold leading-[1.15] tracking-[-0.02em]">
                {t({ en: 'Go live on your own domain', uk: 'Запустіть сайт на власному домені' })}
              </h3>
              <p className="mt-2 text-[14px] leading-[1.5] text-[var(--white-500)]">
                {t({
                  en: 'Use your own address like fit-ration.com — easy to find on Google and more professional.',
                  uk: 'Власна адреса на кшталт fit-ration.com — легше знайти в Google і виглядає професійно.',
                })}
              </p>
              {/* The plan box: price stated before any cart, cancel-anytime said once. */}
              <div className="mt-4 rounded-control bg-gradient-to-r from-[#9b7bff26] to-[#4a2bc326] p-3.5">
                <p className="text-[13px] font-semibold text-[var(--white-700)]">
                  {t({ en: 'Part of the Remixer Build plan · $9.99/mo', uk: 'Входить у план Remixer Build · $9.99/міс' })}
                </p>
                <p className="mt-1 text-[13px] leading-[1.45] text-[var(--white-400)]">
                  {t({
                    en: 'Includes hosting, the padlock and your domain. Cancel anytime.',
                    uk: 'Включає хостинг, захисний замочок і ваш домен. Скасувати можна будь-коли.',
                  })}
                </p>
              </div>
              <button
                onClick={() => openDomains('home')}
                className="mt-4 h-11 w-full rounded-control bg-[var(--action)] text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
              >
                {t({ en: 'Connect a domain →', uk: 'Підключити домен →' })}
              </button>
            </>
          )}

          {kase === 'plan-no-domain' && (
            <>
              <h3 className="font-display text-[22px] font-semibold leading-[1.15] tracking-[-0.02em]">
                {t({ en: 'Go live on your own domain', uk: 'Запустіть сайт на власному домені' })}
              </h3>
              {/* Paid users see no price and no upsell — the handoff is explicit. */}
              <div className="mt-4 rounded-control bg-[#48ba7920] p-3.5">
                <p className="text-[13px] font-semibold text-[var(--live)]">
                  {t({ en: '✓ Included in your Remixer Build plan', uk: '✓ Входить у ваш план Remixer Build' })}
                </p>
                <p className="mt-1 text-[13px] leading-[1.45] text-[var(--white-400)]">
                  {t({
                    en: 'Connect a domain you own, or buy a new one',
                    uk: 'Підключіть свій домен або придбайте новий',
                  })}
                </p>
              </div>
              <button
                onClick={() => openDomains('home')}
                className="mt-4 h-11 w-full rounded-control bg-[var(--action)] text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
              >
                {t({ en: 'Connect a domain →', uk: 'Підключити домен →' })}
              </button>
            </>
          )}

          {kase === 'connecting' && (
            <>
              <h3 className="flex items-center gap-2.5 font-display text-[22px] font-semibold leading-[1.15] tracking-[-0.02em]">
                <span className="relative flex h-2.5 w-2.5" aria-hidden>
                  <span className="absolute h-full w-full animate-ping rounded-full bg-[var(--attention)] opacity-60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--attention)]" />
                </span>
                {t({ en: 'Connecting your domain…', uk: 'Підключаємо ваш домен…' })}
              </h3>
              <p className="mt-2 text-[14px] leading-[1.5] text-[var(--white-500)]">
                {t({
                  en: 'Usually a few minutes — keep editing, it goes live on its own.',
                  uk: 'Зазвичай кілька хвилин — редагуйте далі, сайт запуститься сам.',
                })}
              </p>
              <div className="mt-4 flex items-center justify-between rounded-control border border-[var(--gray-800)] bg-[var(--gray-900)] px-3.5 py-3">
                <span className="text-[14px] font-medium">{CUSTOM_DOMAIN}</span>
                <button
                  onClick={() => openDomains('status', CUSTOM_DOMAIN)}
                  className="text-[13px] font-medium text-[var(--action)] hover:text-[var(--action-hover)]"
                >
                  {t({ en: 'Refresh status', uk: 'Оновити статус' })}
                </button>
              </div>
            </>
          )}

          {kase === 'live' && (
            <>
              <h3 className="flex items-center gap-2.5 font-display text-[22px] font-semibold leading-[1.15] tracking-[-0.02em]">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--live)]" aria-hidden />
                {t({ en: 'Your site is live', uk: 'Ваш сайт працює' })}
              </h3>
              <div className="mt-4 flex items-center justify-between rounded-control border border-[var(--gray-800)] bg-[var(--gray-900)] px-3.5 py-3">
                <span className="text-[14px] font-medium">{CUSTOM_DOMAIN}</span>
                <a
                  href={`https://${CUSTOM_DOMAIN}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.preventDefault()}
                  className="text-[13px] font-medium text-[var(--action)] hover:text-[var(--action-hover)]"
                >
                  {t({ en: 'Visit site ↗', uk: 'Відкрити сайт ↗' })}
                </a>
              </div>
              <p className="mt-2 text-[13px] text-[var(--white-400)]">
                {t({ en: 'Secure padlock on · anyone can visit.', uk: 'Захисний замочок увімкнено · сайт доступний усім.' })}
              </p>
              {world.unpublished > 0 && (
                <button
                  onClick={() => set({ unpublished: 0 })}
                  className="mt-4 h-11 w-full rounded-control bg-[var(--action)] text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
                >
                  {t({
                    en: `Update site · ${world.unpublished} ${world.unpublished === 1 ? 'change' : 'changes'} · Free`,
                    uk: `Оновити сайт · змін: ${world.unpublished} · Безкоштовно`,
                  })}
                </button>
              )}
            </>
          )}

          {/* -------------------------------------- demoted row: private preview */}
          <div className="mt-5 border-t border-[var(--gray-800)] pt-4">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--white-300)]">
              {t({ en: 'Private preview link', uk: 'Приватне посилання-прев’ю' })}
            </p>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] text-[var(--white-500)]">{STAGING_HOST}</p>
                <p className="mt-0.5 text-[12px] text-[var(--white-300)]">
                  {t({ en: 'Always free · hidden from Google', uk: 'Завжди безкоштовно · приховано від Google' })}
                </p>
              </div>
              {world.unpublished > 0 && kase !== 'live' ? (
                <button
                  onClick={() => set({ unpublished: 0 })}
                  className="h-9 flex-none rounded-control border border-[var(--white-200)] px-3.5 text-[13px] font-medium text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--gray-800)]"
                >
                  {t({ en: 'Update preview · Free', uk: 'Оновити прев’ю · Безкоштовно' })}
                </button>
              ) : (
                <button
                  className="h-9 flex-none rounded-control border border-[var(--white-200)] px-3.5 text-[13px] font-medium text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--gray-800)]"
                >
                  {t({ en: 'Copy link', uk: 'Копіювати' })}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
