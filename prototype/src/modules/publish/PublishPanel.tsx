/**
 * The publish panel — pixel source: Figma node 29697:36970 (480×466), which supersedes
 * the 2026 redesign frame 25819:144061 (548 wide) it grew out of.
 *
 * Card: gray-850, radius 20, hairline border, deep drop shadow, anchored under the
 * Publish button. Header 64px. Body: an inset card (white-4%, radius 16) holding — for a
 * site that has never gone live — the nudge banner, then the website-URL field and the
 * "Connect your own domain" dashed card. Button bar bottom-right.
 *
 * TWO THINGS DEPEND ON WHETHER THE SITE IS PUBLISHED (`world.published`, designer
 * 08.09.2026):
 *  · THE TITLE. An unpublished site's panel is titled by its STATUS — "Not published" —
 *    rather than by the action. Once it is live the title is the action again, "Publish".
 *  · THE NUDGE. A 120px banner, "Ready to put your site live?", purely informational:
 *    it argues for publishing and can be waved off with its own ✕ (`ui.publishHintOpen`).
 *    It is gone for good once the site is live — there is nothing left to nudge.
 * Neither hangs off `unpublished`: see the field's own note in state/world.ts.
 *
 * ⚠️ The board writes the title as "Not Publisher", which is not English — the site is
 * not published. Shipped as "Not published", the same call this project made for the
 * template panel's "Add Promt" (CLAUDE.md). Flagged to the designer, not silently kept.
 *
 * The Figma frame draws the base case; the connecting/live cases keep the Launchpad
 * logic from the handoff (⑥-A) re-dressed in the same visual language, so every world
 * state still renders. The subtitle under "Connect your own domain" is the one line
 * that changes with entitlement: trial sells the plan, paid says it's included.
 */
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useWorld, hasPlan } from '@/state/world'
import { useUI } from '@/state/ui'
import { useT } from '@/i18n'
import { STAGING_HOST } from '@/data/domains'
import { IconPlus, IconEdit, IconExternal, IconClose } from '@/ui/icons'
import { retryConnect } from '@/modules/domains/connect'
import { popover, popoverContent } from '@/ui/motion'


/**
 * The inset URL field.
 *
 * Two faces, and which one is on says what the site answers to RIGHT NOW: the staging
 * address, editable (pencil), or the custom domain under a green "Live" pill. The pill
 * replaces the trailing button rather than joining it — a domain that answers has
 * nothing to edit here, and the board draws the pill in that slot.
 */
function UrlField({ value, suffix, live }: { value: string; suffix?: string; live?: boolean }) {
  return (
    <div className="w-full rounded-[12px] shadow-[inset_0_0_0_1px_var(--white-200)]">
      <div className="flex h-12 items-center justify-between rounded-[8px] bg-[var(--black-300)] py-1 pl-4 pr-2">
        <p className="min-w-0 truncate text-[15px]">
          <span className="text-[var(--white-900)]">{value}</span>
          {suffix && <span className="text-[var(--white-500)]">{suffix}</span>}
        </p>
        {live ? (
          <span className="flex h-6 flex-none items-center gap-1.5 rounded-full bg-[#48ba7926] pl-2 pr-2.5 text-[12px] font-medium text-[var(--live)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--live)]" aria-hidden />
            Live
          </span>
        ) : (
          <button
            className="grid h-8 w-8 flex-none place-items-center rounded-[8px] text-[var(--white-400)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-[var(--white-700)]"
            aria-label="Edit address"
          >
            <IconEdit size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * One state of the connection, as a card (designer's six states, 13.09.2026).
 *
 * Amber is "in flight, and we are telling you so"; red is "stuck, and it needs you".
 * ⚠️ EVERY NON-TERMINAL STATE CARRIES ITS OWN WAY OUT — his note on the failed state,
 * and the reason the old panel's single "Refresh status" button is gone: a generic
 * refresh cannot resend a confirmation email, and a state that needs nothing from the
 * customer ("Connecting · nothing for you to do") must not offer a button that implies
 * it does.
 */
function StatusCard({
  tone, title, sub, action,
}: {
  tone: 'amber' | 'red'
  title: string
  sub: string
  action?: { label: string; onClick: () => void }
}) {
  const amber = tone === 'amber'
  return (
    <div
      className="mt-[19px] flex items-center gap-3 rounded-[12px] px-4 py-3.5"
      style={{
        background: amber ? '#e5c3591a' : '#ef44441a',
        boxShadow: `inset 0 0 0 1px ${amber ? '#e5c35959' : '#ef444459'}`,
      }}
    >
      <span
        className="mt-[7px] h-2 w-2 flex-none self-start rounded-full"
        style={{ background: amber ? 'var(--attention)' : 'var(--danger)' }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold leading-[1.3] text-white">{title}</p>
        <p className="mt-1 text-[13px] leading-[1.4] text-[#ffffffa3]">{sub}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="h-8 flex-none rounded-[8px] border border-[var(--white-200)] bg-[#ffffff0a] px-3 text-[13px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export function PublishPanel() {
  const { world, set } = useWorld()
  const { publishOpen, togglePublish, openDomains, publishHintOpen, dismissPublishHint } = useUI()
  const { t } = useT()
  const panelRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

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
   * THE SIX STATES THE PANEL CARRIES (designer, 13.09.2026 — "после корзины все статусы и
   * продолжение флоу происходят тут в окне Publish"). They are read off the world, in this
   * order of precedence:
   *
   *   unreachable  red card, the domain does not answer — the only one that blames nothing
   *                on the customer's plan ("your plan is active") and the only red
   *   connecting   records are being written; the field still shows the staging address,
   *                because that is what the site answers to until they land
   *   padlock      the certificate is being issued — the domain already answers, so the
   *                field switches to it and wears the Live pill
   *   confirmEmail the ICANN clock on a freshly registered name (world.icann)
   *   settled      live and nothing pending: no card at all, one line of prose
   *
   * The padlock beat outranks the email one when both are true: it clears in half an hour
   * and the other has a fortnight, so the transient card gets the slot first.
   */
  const attached = world.domain === 'connecting' || world.domain === 'verifying' ||
    world.domain === 'live' || world.domain === 'multiple' || world.domain === 'unreachable'
  const liveish = world.domain === 'live' || world.domain === 'multiple'
  const unreachable = world.domain === 'unreachable'
  const connecting = world.domain === 'connecting'
  const padlock = world.domain === 'verifying'
  const confirmEmail = liveish && world.icann
  const settled = liveish && !world.icann
  /** Does the domain answer? That is what the field and its Live pill report. */
  const answering = liveish || padlock
  const staging = STAGING_HOST.replace('.remixer.site', '')

  /*
   * Never live yet → the first publish, whatever the edit count says; live with edits
   * pending → an update; nothing pending → there is nothing for the button to do.
   *
   * ⚠️ NO "· Free" ON THE LABEL (designer, 08.09.2026: "убери из кнопки — Free"), which is
   * also what the board draws — an 86px button reading just "Publish". The suffix was ours,
   * arguing audit conclusion №1 (we are the only builder in the category charging credits to
   * publish, so publishing must read as free). That argument now has nowhere on this button
   * to live: if it is worth making, it belongs in the nudge banner's copy, not stapled to
   * the verb. Raised with the designer; do not put it back on the button.
   */
  const primary = answering
    ? world.unpublished > 0
      ? { en: `Update · ${world.unpublished} changes`, uk: `Оновити · змін: ${world.unpublished}` }
      : { en: 'Update', uk: 'Оновити' }
    : world.unpublished > 0
      ? world.published
        ? { en: `Update · ${world.unpublished} changes`, uk: `Оновити · змін: ${world.unpublished}` }
        : { en: 'Publish', uk: 'Опублікувати' }
      : { en: 'Continue', uk: 'Продовжити' }
  const publishes = world.unpublished > 0 || (!world.published && !attached)

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
          /*
           * WHERE IT SITS — the SHELL board 29697:54553, which is the one that shows the
           * panel in its window (designer, 09.09.2026: "сделай расположение этого открытого
           * окна Publish как в макете"). `Frame 22` is at x=2025 y=8 in the 2560×1166 frame:
           *   top    8 — it rides at the TOP of the window and COVERS the right end of the
           *          topbar, the credits pill and the Publish button that opened it. Not
           *          tucked under the 52px bar, which is where the panel's own board
           *          (29697:36970) left it because that board has no window around it.
           *   right  55 — the rail is 2504…2560, so the panel's right edge (2505) lands one
           *          pixel over its inner edge. Shipped as drawn; a pixel under an opaque
           *          rail is invisible either way, and 55 is what the board measures.
           * FIXED, not absolute: mounted inside <main>, so an absolute "right" would resolve
           * against the centre column and the panel would drift with the chat's width.
           *
           * ⚠️ 480 WIDE, not the old 548: every visible frame on 29697:36970 is laid
           * out at 480 (card 468, field 436), and the banner's copy breaks into the two
           * lines the board draws only in the 324px text column that width gives. The
           * 548 frames are still in the file, switched off.
           */
          className="fixed right-[55px] top-2 z-40 w-[480px] origin-top-right rounded-[20px] bg-[var(--gray-850)]"
          /* The rim is an INSET SHADOW, not a border, here and on the card, the banner and
             the URL field inside: Figma's 1px stroke sits inside the geometry and does not
             shrink a frame's children, while a CSS border does — four nested borders had
             the banner 4px narrower than drawn, its copy 6px short of the board's column
             and the field 2px too tall (design-system.md §5). */
          style={{ boxShadow: 'inset 0 0 0 1px #ffffff0a, 0px 24px 28px rgba(0,0,0,0.5)' }}
        >
          {/* The panel inflates first, its contents arrive a beat later (motion.ts rule 3). */}
          <motion.div variants={popoverContent}>
          {/* -------------------------------------------------------- header, 64px */}
          <div className="flex h-16 items-center pl-6">
            <h3 className="font-display text-[20px] font-semibold leading-[1.2] text-white">
              {/* A domain standing in front of the site counts as published for both of
                  these: "Not published" over a live custom domain would be a lie, and the
                  nudge argues for something that has already happened. */}
              {world.published || attached
                ? t({ en: 'Publish', uk: 'Публікація' })
                : t({ en: 'Not published', uk: 'Не опубліковано' })}
            </h3>
          </div>

          {/* ---------------------------------------------------------- body card */}
          <div className="px-1.5">
            {/* Figma 29697:36983: Neutral Alpha/50 (#ffffff0a) for both the fill and the
                hairline. The nudge and the fields are two children 8px apart; the padding
                that used to be on this card now belongs to the fields' own container, so
                the banner can sit inset 8px on its own. */}
            <div className="flex flex-col gap-2 rounded-[16px] bg-[#ffffff0a] shadow-[inset_0_0_0_1px_#ffffff0a]">
            {/* ------------------------------------------------ the nudge, 29697:37264 */}
            <AnimatePresence initial={false}>
              {!world.published && !attached && publishHintOpen && (
                <motion.div
                  key="hint"
                  /* Fades and lifts out, then the card tightens in one snap — the layout
                     is never animated (the dock's rule, ui/motion.ts). Under reduce the
                     offset itself goes, or the frame would jump into it. */
                  initial={false}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.16, ease: [0.4, 0, 1, 1] }}
                  className="px-2 pt-2"
                >
                  <div className="relative flex h-[120px] items-center overflow-hidden rounded-[12px] bg-[var(--gray-900)] px-6 shadow-[inset_0_0_0_1px_#ffffff0a]">
                    {/* the brand's dot field, dying out to the left — index.css */}
                    <span className="pub-hint-dots" aria-hidden />
                    {/* pr-20: the board holds the copy to a 324px column and leaves the
                        right 80px to the pattern, so the two never overlap */}
                    <div className="relative min-w-0 flex-1 pr-20">
                      <p className="font-display text-[18px] font-semibold leading-normal text-white">
                        {t({ en: 'Ready to put your site live?', uk: 'Готові опублікувати сайт?' })}
                      </p>
                      <p className="mt-3 text-[14px] leading-[1.4] text-[#ffffffa3]">
                        {t({
                          en: 'This lets visitors view what you’ve built. They never see the changes you make until you publish them.',
                          uk: 'Так відвідувачі побачать те, що ви зібрали. Ваші правки залишаються невидимими для них, поки ви їх не опублікуєте.',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={dismissPublishHint}
                      aria-label={t({ en: 'Dismiss', uk: 'Прибрати' })}
                      className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-[10px] border border-[#ffffff14] bg-[#09090b7a] text-white backdrop-blur-[16px] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#09090bcc]"
                    >
                      <IconClose size={11} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* --------------------------------------------- the fields, 29697:37003 */}
            <div className="px-4 pb-4 pt-[19px]">
              {/* website URL */}
              <div className="flex flex-col gap-[7px]">
                <p className="px-0.5 text-[14px] font-medium leading-[1.4] text-[var(--white-500)]">
                  {t({ en: 'Your website URL', uk: 'Адреса вашого сайту' })}
                </p>
                {answering ? (
                  <UrlField value={world.customDomain} live />
                ) : (
                  <UrlField value={staging} suffix=".remixer.site" />
                )}
              </div>

              {/* ------------------------------------------------- the state card */}
              {unreachable && (
                <StatusCard
                  tone="red"
                  title={world.customDomain}
                  sub={t({
                    en: 'We can’t reach this domain yet · your plan is active',
                    uk: 'Поки не бачимо цей домен · ваш план активний',
                  })}
                  action={{
                    label: t({ en: 'Check again', uk: 'Перевірити ще' }),
                    onClick: () => retryConnect(world.customDomain),
                  }}
                />
              )}
              {connecting && (
                <StatusCard
                  tone="amber"
                  title={world.customDomain}
                  sub={t({ en: 'Connecting · nothing for you to do', uk: 'Підключається · від вас нічого не потрібно' })}
                />
              )}
              {padlock && (
                <StatusCard
                  tone="amber"
                  title={t({ en: 'Secure padlock is switching on', uk: 'Вмикається захисний замок' })}
                  sub={t({
                    en: 'Usually within 30 minutes · the site already works',
                    uk: 'Зазвичай протягом 30 хвилин · сайт уже працює',
                  })}
                />
              )}
              {confirmEmail && (
                <StatusCard
                  tone="amber"
                  title={t({ en: 'Confirm your email to keep this domain', uk: 'Підтвердьте email, щоб зберегти домен' })}
                  sub={t({
                    en: 'We sent a link to roman@example.com · 14 days left',
                    uk: 'Ми надіслали лист на roman@example.com · лишилось 14 днів',
                  })}
                  action={{ label: t({ en: 'Resend', uk: 'Надіслати ще' }), onClick: () => undefined }}
                />
              )}
              {settled && (
                <p className="mt-[19px] px-0.5 text-[13px] leading-[1.4] text-[var(--white-400)]">
                  {t({ en: 'Padlock on · anyone can visit', uk: 'Замок увімкнено · сайт доступний усім' })}
                </p>
              )}

              {/* ---------------- the staging address, once a domain stands in front */}
              {attached && (
                <div className={settled ? 'mt-2 px-0.5' : 'mt-[19px] px-0.5'}>
                  <p className="text-[13px] leading-[1.4] text-[var(--white-400)]">
                    {t({ en: 'Staging address', uk: 'Адреса стейджингу' })}
                  </p>
                  <a
                    className="mt-0.5 inline-flex items-center gap-1 text-[13px] leading-[1.4] text-[var(--white-500)] transition-colors duration-[var(--dur-fast)] ease-std hover:text-[var(--white-700)]"
                    href="#"
                    onClick={(e) => e.preventDefault()}
                  >
                    {STAGING_HOST}
                    <IconExternal size={12} />
                  </a>
                </div>
              )}

              {/* connect your own domain — dashed card, the state before any of this */}
              {!attached && (
                <button
                  onClick={() => openDomains('home')}
                  /* Hover per Figma 26125:3832: the dashed rim brightens (NA/200 →
                     NA/300) and the "+" disc fills WHITE with a dark plus — the
                     row itself keeps its fill. Colours ease over the base duration
                     so the state melts in rather than snapping. */
                  className="group mt-[19px] flex w-full items-center gap-4 rounded-[16px] border border-dashed border-[var(--white-200)] py-4 pl-5 pr-8 text-left backdrop-blur-[16px] transition-colors duration-[var(--dur-base)] ease-std hover:border-[var(--white-300)]"
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
            </div>
            </div>
          </div>

          {/* ---------------------------------------------------------- button bar */}
          {/* One button. The old "Refresh status" lived here because the panel had no
              way to say what a connection was doing; now each state says it, and the two
              that need the customer carry their own action inside the card. */}
          <div className="flex items-center justify-end px-4 py-4">
            <button
              onClick={() => (publishes ? set({ unpublished: 0, published: true }) : togglePublish(false))}
              className="h-10 rounded-[10px] bg-[var(--action)] px-5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
            >
              {t(primary)}
            </button>
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
