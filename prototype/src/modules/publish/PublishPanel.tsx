/**
 * The publish panel — 2026 redesign.
 *
 * **Pixel source: Figma node `28071:53189`** (548×~335), the connected-custom-domain
 * state. Node `25819:144061` is **SUPERSEDED** for this panel and must not be rebuilt
 * from; it survives only as the source of the pre-connect (staging) half, which
 * `28071:53189` does not draw.
 *
 * Card: gray-850, radius 20, hairline border, deep drop shadow, anchored under the
 * Publish button. Header 64px "Publish" (display, 20) with the viewers count on the
 * right. Body: an inset card (white-4%, radius 16) holding the `Website URL` field and,
 * under a hairline divider, the padlock line with `Manage domains` + gear. Footer:
 * `● N unpublished change(s)` on the left, `Publish changes` on the right.
 *
 * The board draws the DIRTY, connected state; the connecting/staging cases keep the
 * Launchpad logic from the handoff (⑥-A) re-dressed in the same visual language, so
 * every world state still renders. The subtitle under "Connect your own domain" is the
 * one line that changes with entitlement: trial sells the plan, paid says it's included.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useWorld, hasPlan } from '@/state/world'
import { useUI } from '@/state/ui'
import { useT } from '@/i18n'
import { STAGING_HOST, CUSTOM_DOMAIN } from '@/data/domains'
import { IconPlus, IconEdit, IconExternal, IconCopy, IconSettings, IconUsers } from '@/ui/icons'
/* The connection checklist is domain knowledge, so it lives with the domains module and
   is borrowed here — the panel and the status screen must never own two copies of it. */
import { ConnectChecklist, connectStage } from '@/modules/domains/ConnectChecklist'
import { popover, popoverContent } from '@/ui/motion'

/** Ukrainian needs three forms (1 · 2–4 · 5+), so the count sentence is built, not looked up. */
function ukPlural(n: number, one: string, few: string, many: string) {
  const d = n % 10
  const h = n % 100
  if (d === 1 && h !== 11) return one
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return few
  return many
}

/**
 * The inset URL field: value + muted suffix, one trailing icon button.
 *
 * The board (28071:53224) puts a **copy** button here on a connected domain — the address
 * is final, so the only thing left to do with it is send it to someone. The staging case
 * keeps `Edit` from the superseded node: renaming the preview subdomain is still the one
 * action that address affords, and `28071:53189` does not draw that state.
 */
function UrlField({
  value,
  suffix,
  live,
  trailing = 'edit',
}: {
  value: string
  suffix?: string
  live?: boolean
  trailing?: 'copy' | 'edit' | 'open'
}) {
  const { t } = useT()
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
          aria-label={
            trailing === 'copy'
              ? t({ en: 'Copy address', uk: 'Копіювати адресу' })
              : trailing === 'open'
                ? t({ en: 'Open site', uk: 'Відкрити сайт' })
                : t({ en: 'Edit address', uk: 'Змінити адресу' })
          }
        >
          {trailing === 'copy' ? (
            <IconCopy size={20} />
          ) : trailing === 'open' ? (
            <IconExternal size={16} />
          ) : (
            <IconEdit size={18} />
          )}
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
  /* Where the count and the dot live, per the board (28071:53279…53293) — and this
     corrects DECISIONS 01, which put the dot INSIDE the button off a GoDaddy screenshot
     without opening the designer's own frame:
       · footer left  → `● N unpublished change(s)`, blue dot on the STATUS TEXT
       · footer right → `Publish changes`, no dot, no counter in the label
     The reasoning for a dot over a bare number still stands (the question is binary, and
     a dot cannot count wrong) — it just belongs next to the sentence that names the state,
     not inside the verb. Everything reads `world.unpublished`, so this label, the topbar
     button and the status line cannot drift apart. */
  const changes = {
    en: `${world.unpublished} unpublished change${world.unpublished === 1 ? '' : 's'}`,
    uk: `${world.unpublished} ${ukPlural(
      world.unpublished,
      'неопублікована зміна',
      'неопубліковані зміни',
      'неопублікованих змін',
    )}`,
  }

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
          <div className="flex h-16 items-center justify-between pl-6 pr-4">
            <h3 className="font-display text-[20px] font-semibold leading-[1.2] text-white">
              {t({ en: 'Publish', uk: 'Публікація' })}
            </h3>
            {/* Viewers count — drawn on the board (28272:49012) as a people glyph + a
                number, and the board prints `0`. What the number counts is NOT specified
                anywhere in the frame or in our docs, so nothing here invents a meaning:
                the shape is reproduced, the value is the board's own literal. */}
            <div
              className="flex items-center gap-0.5 text-[var(--white-500)]"
              aria-label={t({ en: 'Viewers', uk: 'Глядачі' })}
            >
              <span className="grid h-6 w-6 flex-none place-items-center">
                <IconUsers size={20} />
              </span>
              <span className="text-[13px] font-medium leading-[1.4]">0</span>
            </div>
          </div>

          {/* ---------------------------------------------------------- body card */}
          <div className="px-1.5">
            {/* Figma: Neutral Alpha/50 (#ffffff0a) for both the fill and the hairline.
                Padding sits on the sections, not on the card: the board (28071:53209)
                divides the card with a full-bleed hairline, which an outer inset would cut. */}
            <div className="rounded-[16px] border border-[#ffffff0a] bg-[#ffffff0a]">
              {/* Text Input section — board 28071:53210: px 16, pt 19, pb 16, gap 16 */}
              <div className="flex flex-col gap-4 px-4 pb-4 pt-[19px]">
              {/* website URL */}
              <div className="flex flex-col gap-[7px]">
                {/* One label in every state: the board writes `Website URL` on the frame
                    that HAS a custom domain, so the old "Your domain" switch was ours. */}
                <p className="px-0.5 text-[14px] font-medium leading-[1.4] text-[var(--white-500)]">
                  {t({ en: 'Website URL', uk: 'Адреса вашого сайту' })}
                </p>
                {live || connecting ? (
                  <UrlField value={CUSTOM_DOMAIN} live={live} trailing="copy" />
                ) : (
                  <UrlField value={staging} suffix={STAGING_ZONE} trailing="edit" />
                )}
                {connecting && (
                  <p className="px-0.5 text-[13px] leading-[1.4] text-[var(--attention)]">
                    {/* One sentence, and it must never say what the checklist below already
                        says. It carries the two things ticks cannot: how long this takes,
                        and that the person is released ("keep editing" / "nothing for you
                        to do"). The `securing` line used to open with "Almost there —
                        turning on the padlock", which is now the unticked `Security (SSL)
                        on` row two inches below it; what is left is the STATES.md wording
                        for that wait (FACTS DH-301). */}
                    {securing
                      ? t({
                          en: 'Nothing for you to do. This usually takes ten to thirty minutes, sometimes a little longer.',
                          uk: 'Від вас нічого не потрібно. Зазвичай це триває від десяти до тридцяти хвилин, іноді трохи довше.',
                        })
                      : t({
                          en: 'Connecting — usually a few minutes. Keep editing, it goes live on its own.',
                          uk: 'Підключається — зазвичай кілька хвилин. Редагуйте далі, сайт запуститься сам.',
                        })}
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
                      {/* `payment-failed` (added 20 Aug 2026) lands in the lower branch,
                          and that is correct without deciding anything: connecting a NEW
                          domain does require an active plan, and this whole card is hidden
                          once a domain is live or connecting, so it makes no claim about an
                          EXISTING site — the open billing question in
                          docs/features/account-and-billing.md §2. */}
                      {paid
                        ? t({ en: 'Included in your Remixer Build plan', uk: 'Входить у ваш план Remixer Build' })
                        : t({ en: 'Requires the Remixer Build plan — $9.99/mo', uk: 'Потрібен план Remixer Build — $9.99/міс' })}
                    </span>
                  </span>
                </button>
              )}

              {/* THE CONNECTION CHECKLIST — and what this slot used to hold.
                *
                * Until 20.08.2026 this spot printed a dashed card with the staging address
                * under `Private preview · always free`. It is gone, on the designer's word,
                * and for a sharper reason than clutter: it is not on his board
                * (`28071:53189`), it survived from the earlier Launchpad direction, and it
                * was occupying the slot where he expects to watch the connection tick over.
                * Once a custom domain is on, the staging host is not the address of the site
                * and repeating it here is noise. Where there is NO custom domain the staging
                * address is still shown — in the `Website URL` field above, which is
                * genuinely where that site lives, next to the `Connect your own domain`
                * card; the two never appear together.
                *
                * ⚠️ If that line is ever restored anywhere, it comes back WITHOUT its old
                * third clause `· hidden from Google`: FACTS **DH-303** downgraded exactly
                * that claim to `unverified` — nothing in the KB, the product page or the
                * trial terms says anything about indexing, and it cannot be inherited from
                * DreamPress, which achieves it with HTTP auth this preview cannot use
                * (the link is meant to be sent to people). `always free` is the verified
                * half (DH-303 with DH-005).
                *
                * What renders instead: the canonical checklist, ticking as the state
                * advances — the flow that starts on `Connect` now finishes in THIS window,
                * and state/progress.ts is what walks it. Three items, fixed order, shared
                * with the status screen (modules/domains/ConnectChecklist.tsx); the order is
                * the information, because the padlock lands last (DH-301).
                *
                * `live` deliberately gets NO checklist: three green ticks after the fact are
                * a receipt for something the address, the padlock line and `Manage domains`
                * already report — and those three are all the board draws. */}
              {connecting && (
                <div className="rounded-[16px] border border-[var(--white-200)] px-5 py-4">
                  <ConnectChecklist stage={connectStage(world.domain)} />
                </div>
              )}
              </div>

              {/* --------------------------------- divider row, board 28071:53258
                * Hairline across the whole card, then `Secure padlock on · anyone can
                * visit.` on the left and `Manage domains` + gear on the right. The
                * padlock sentence used to hang under the field as a loose caption; the
                * board pairs it with the action that follows from it, which is why the
                * row exists at all.
                *
                * Connecting shows the row for `Manage domains` only — the padlock claim
                * would be a lie until the certificate lands (DH-301), and the honest
                * sentence for that window is already printed above the divider. */}
              {(live || connecting) && (
                <div className="border-t border-[#ffffff0a] py-4 pl-2 pr-4">
                  <div className="flex items-center justify-between gap-3 rounded-[12px] pl-2.5">
                    <p className="min-w-0 text-[13px] leading-normal text-[var(--white-400)]">
                      {live
                        ? t({
                            en: 'Secure padlock on · anyone can visit.',
                            uk: 'Захисний замочок увімкнено · сайт доступний усім.',
                          })
                        : ''}
                    </p>
                    <button
                      onClick={() => openDomains('status')}
                      className="flex h-8 flex-none items-center gap-1.5 rounded-[8px] pl-4 pr-1 text-[13px] font-semibold leading-[1.4] text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white"
                    >
                      {t({ en: 'Manage domains', uk: 'Керувати доменами' })}
                      <span className="grid h-6 w-6 flex-none place-items-center text-[var(--white-500)]">
                        <IconSettings size={20} />
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ------------------------------------ button bar, board 28071:53275
            * Left: the 8px blue dot on the STATUS TEXT. Right: `Publish changes`, a plain
            * label. The dot is `--action` (#1587FF) — the board's own `#1587ff`; the
            * sentence is `--white-500`, which lands on the board's #c7ccd6 over gray-850
            * without minting a one-off hex.
            *
            * CLEAN STATE — ⚠️ NOT ON THE BOARD, this half is a reading. `28071:53189`
            * draws the dirty state only. It used to read `Continue`, a blue CTA that only
            * closed the panel: pressing the accent colour and getting nothing teaches
            * people the accent means nothing. So with nothing to publish there is NO blue
            * button — `Manage domains` stays in the card, and `Visit site` is offered as a
            * secondary. No verb was invented for publishing what is already published. */}
          <div className="flex items-center justify-end py-4 pl-6 pr-4">
            {world.unpublished > 0 && (
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="h-2 w-2 flex-none rounded-full bg-[var(--action)]" aria-hidden />
                <p className="truncate text-[12px] leading-normal text-[var(--white-500)]">{t(changes)}</p>
              </div>
            )}
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              {connecting && (
                <button
                  /* ONE stage per press — connecting → verifying → securing → live, the
                     same road the status screen walks. It used to jump connecting →
                     securing, which was invisible while nothing else was on screen; with
                     the checklist here it would tick two rows at once and delete
                     `verifying` from the story. Refresh is an accelerator, not a shortcut:
                     it asks whether the next step has happened, and state/progress.ts
                     cancels and re-schedules its timer around every press, so nothing is
                     skipped and nothing fires twice. */
                  onClick={() =>
                    set({ domain: world.domain === 'connecting' ? 'verifying' : world.domain === 'verifying' ? 'securing' : 'live' })
                  }
                  className="h-10 rounded-[10px] border border-[var(--white-200)] px-5 text-[14px] font-medium text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--gray-800)]"
                >
                  {t({ en: 'Refresh status', uk: 'Оновити статус' })}
                </button>
              )}
              {world.unpublished > 0 ? (
                <button
                  onClick={() => set({ unpublished: 0 })}
                  className="flex h-10 items-center rounded-[10px] bg-[var(--action)] px-5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
                >
                  {t({ en: 'Publish changes', uk: 'Опублікувати зміни' })}
                </button>
              ) : (
                <button
                  onClick={() => togglePublish(false)}
                  className="flex h-10 items-center gap-2 rounded-[10px] border border-[var(--white-200)] px-5 text-[14px] font-medium text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--gray-800)] hover:text-white"
                >
                  {t({ en: 'Visit site', uk: 'Перейти на сайт' })}
                  <IconExternal size={14} />
                </button>
              )}
            </div>
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
