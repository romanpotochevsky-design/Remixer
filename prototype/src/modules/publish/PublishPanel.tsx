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
  const connecting =
    world.domain === 'connecting' || world.domain === 'verifying' || world.domain === 'securing'
  /* The padlock is its own stop, not a side effect of arriving. This panel used to step
     connecting → live, so the moment the padlock lands was invisible here and the pair
     read as "instantly secured" — the one promise POSITIONING §7 forbids on DH-301. */
  const securing = world.domain === 'securing'
  const live = world.domain === 'live' || world.domain === 'multiple'
  /* The zone is the sourced half of the staging address (FACTS DH-302); the label
     in front of it is still a placeholder shape. Kept in one const so the field
     and the suffix can never drift apart again — they did, as `.remixer.site`. */
  const STAGING_ZONE = '.remixer.ai'
  const staging = STAGING_HOST.replace(STAGING_ZONE, '')

  /*
   * ⚠️ HISTORY, NOT SPEC. These two labels used to read `Publish · Free` and
   * `Update · N changes · Free` (uk: `… · Безкоштовно`). The `Free` token was
   * REMOVED 20 Aug 2026. Kept as a note because a deleted mistake comes back and a
   * labelled one does not — do not re-add it on the strength of a design argument.
   *
   * Why it went: publishing consumes credits today (FACTS **DH-008**, `verified`).
   * `Free` was the audit's RECOMMENDATION rendered as if it were the product's
   * behaviour, on a surface that is not a mockup: the prototype sits at a permanent
   * artifact URL that product owners, developers and SEO read, so a developer could
   * have sized work against a publish that costs nothing.
   *
   * What did NOT change, and must not be read out of this edit: the position.
   * `docs/product/POSITIONING.md` §1 "Unmeter the finish line" still argues publishing
   * must cost zero credits, and **DH-009** still records that nobody knows whether
   * getting there is a billing toggle or an architecture project. The button simply
   * stops asserting a price: it names the action and claims nothing.
   *
   * And no credit cost was substituted in the other direction — there is no verified
   * per-publish figure (**DH-009**), so a number here would be the same error mirrored.
   * `Free` comes back when DH-008 changes, not before.
   */
  /* The counter LEFT this label on 20 Aug 2026: it used to read `Update · N changes`,
     and the number is now carried by a dot instead (`docs/features/publish/DECISIONS.md`
     01, consequence 1 — if a count is ever wanted it belongs inside this opened panel,
     never in permanent chrome). One label, not a `Publish`/`Update` switch: colour and
     dot already say which of the two it is. Both states read `world.unpublished`, so
     this button, the topbar button and the copy above cannot drift apart. */
  const primary =
    world.unpublished > 0
      ? { en: 'Publish', uk: 'Опублікувати' }
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
                  <UrlField value={staging} suffix={STAGING_ZONE} />
                )}
                {connecting && (
                  <p className="px-0.5 text-[13px] leading-[1.4] text-[var(--attention)]">
                    {securing
                      ? t({
                          en: 'Almost there — turning on the padlock. Nothing for you to do.',
                          uk: 'Майже готово — увімкнюємо замочок. Від вас нічого не потрібно.',
                        })
                      : t({
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

              {/* private preview line under a live/connecting domain.
                *
                * ⚠️ HISTORY, NOT SPEC. This line used to read `Private preview · always
                * free · hidden from Google` (uk: `… · приховано від Google`). The THIRD
                * clause was REMOVED 20 Aug 2026; the note stays because a deleted mistake
                * comes back and a labelled one does not.
                *
                * Why it went: FACTS **DH-303** downgraded exactly that clause to
                * `unverified` — no statement about indexing, `noindex` or robots exists in
                * the Remixer KB, on the product page or in the trial terms, and it cannot
                * be inherited by analogy: the one DreamHost staging documented as
                * non-indexable is DreamPress, which achieves it with HTTP auth that cannot
                * be disabled — a mechanism this preview plainly does not use, since
                * sending the link is the point. An `unverified` string does not belong on
                * a surface a team reads.
                *
                * `always free` is the VERIFIED half of DH-303 (with DH-005) and stays. EN
                * and UK are two renderings of one sentence: change them together.
                * The clause returns only if the platform team confirms the response header
                * (FACTS §3, close-out item 2) — not on a design argument. */}
              {(live || connecting) && (
                <div className="flex items-center justify-between gap-3 rounded-[16px] border border-dashed border-[var(--white-200)] px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] text-[var(--white-500)]">{STAGING_HOST}</p>
                    <p className="mt-0.5 text-[12.5px] text-[var(--white-300)]">
                      {t({ en: 'Private preview · always free', uk: 'Приватне прев’ю · завжди безкоштовно' })}
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
                onClick={() => set({ domain: securing ? 'live' : 'securing' })}
                className="h-10 rounded-[10px] border border-[var(--white-200)] px-5 text-[14px] font-medium text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--gray-800)]"
              >
                {t({ en: 'Refresh status', uk: 'Оновити статус' })}
              </button>
            )}
            <button
              onClick={() => (world.unpublished > 0 ? set({ unpublished: 0 }) : togglePublish(false))}
              className="flex h-10 items-center gap-2 rounded-[10px] bg-[var(--action)] px-5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
            >
              {world.unpublished > 0 && <span className="h-1.5 w-1.5 flex-none rounded-full bg-white" aria-hidden />}
              {t(primary)}
            </button>
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
