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
import { useEffect, useRef, useState } from 'react'
import { useWorld, hasPlan, isCustomDomainActive } from '@/state/world'
import { useUI } from '@/state/ui'
import { useT } from '@/i18n'
import { STAGING_HOST } from '@/data/domains'
import { IconPlus, IconEdit, IconClose } from '@/ui/icons'
import { retryConnect } from '@/modules/domains/connect'
import { popover, popoverContent } from '@/ui/motion'

/*
 * The free address, split at its FIRST dot: the name is white, the host behind it grey.
 * Derived, never written out — this line used to be `STAGING_HOST.replace('.remixer.site',
 * '')` against a literal `.remixer.site` suffix below it, so the day the host became
 * `remixer.ai` (five first-party sources) the field would have printed the whole host and
 * then the old suffix after it: "fit-ration.remixer.ai.remixer.site".
 */
const STAGING_DOT = STAGING_HOST.indexOf('.')
const STAGING_NAME = STAGING_DOT > 0 ? STAGING_HOST.slice(0, STAGING_DOT) : STAGING_HOST
const STAGING_SUFFIX = STAGING_DOT > 0 ? STAGING_HOST.slice(STAGING_DOT) : ''

/**
 * How long "Resend" stays spent before it can be pressed again.
 *
 * ⚠️ INVENTED — no board draws a second state for this button, and it had none: it was
 * wired to `() => undefined`. A confirmation mail that can be fired ten times in ten
 * seconds is a support ticket, so the button spends itself, says so, and comes back. The
 * real cooldown would be a minute; compressed here like every other wait in the prototype
 * (state/flows.ts), so the designer can watch it return instead of timing it.
 */
const RESEND_COOLDOWN_MS = 9000


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
 * Three tones, and the tone is the claim:
 *  · amber — in flight, and we are telling you so. Nothing is wrong.
 *  · red   — stuck, and it needs you.
 *  · blue  — nothing is wrong AND nothing is in flight: everything is set up and the
 *            next move is the customer's. `ready` is the only one, and it must not wear
 *            amber (states.md: "не ошибку и не спиннер"). Blue is this project's colour
 *            for an action, which is exactly what the state is.
 *
 * ⚠️ EVERY NON-TERMINAL STATE CARRIES ITS OWN WAY OUT — the designer's note on the failed
 * state, and the reason the old panel's single "Refresh status" button is gone: a generic
 * refresh cannot resend a confirmation email, and a state that needs nothing from the
 * customer ("nothing for you to do") must not offer a button that implies it does.
 *
 * The title WRAPS rather than truncating. It used to be one truncated line, which was
 * fine while every title was a bare domain; the states below are sentences ("{domain} is
 * ready — publish to put your site on it"), and half a sentence is worse than two lines.
 */
function StatusCard({
  tone, title, sub, action, stacked,
}: {
  tone: 'amber' | 'red' | 'blue'
  title: string
  sub: string
  action?: { label: string; onClick?: () => void; primary?: boolean; disabled?: boolean }
  /** Sits under another card rather than under the field — a tighter gap. */
  stacked?: boolean
}) {
  const skin = {
    amber: { fill: '#e5c3591a', rim: '#e5c35959', dot: 'var(--attention)' },
    red: { fill: '#ef44441a', rim: '#ef444459', dot: 'var(--danger)' },
    blue: { fill: '#1587ff1a', rim: '#1587ff59', dot: 'var(--action)' },
  }[tone]
  return (
    <div
      className={`${stacked ? 'mt-2' : 'mt-[19px]'} flex items-center gap-3 rounded-[12px] px-4 py-3.5`}
      style={{ background: skin.fill, boxShadow: `inset 0 0 0 1px ${skin.rim}` }}
    >
      <span
        className="mt-[7px] h-2 w-2 flex-none self-start rounded-full"
        style={{ background: skin.dot }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="break-words text-[15px] font-semibold leading-[1.3] text-white">{title}</p>
        <p className="mt-1 text-[13px] leading-[1.4] text-[#ffffffa3]">{sub}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          disabled={action.disabled}
          className={
            action.primary
              ? 'h-8 flex-none rounded-[8px] bg-[var(--action)] px-3 text-[13px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]'
              : 'h-8 flex-none rounded-[8px] border border-[var(--white-200)] bg-[#ffffff0a] px-3 text-[13px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] disabled:cursor-default disabled:border-[var(--white-100)] disabled:bg-transparent disabled:text-[var(--white-400)] disabled:hover:bg-transparent'
          }
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export function PublishPanel() {
  const { world, set } = useWorld()
  const { publishOpen, togglePublish, openDomains, openPanel, publishHintOpen, dismissPublishHint } = useUI()
  const { t } = useT()
  const panelRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  /* Has the confirmation mail just been sent again? The button's second state, and it
     stands down on its own — see RESEND_COOLDOWN_MS. Session state, not world state: it
     describes this press, not the customer's situation. */
  const [resent, setResent] = useState(false)
  useEffect(() => {
    if (!resent) return
    const t = window.setTimeout(() => setResent(false), RESEND_COOLDOWN_MS)
    return () => window.clearTimeout(t)
  }, [resent])

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
   * EVERY STATE THE PANEL CARRIES (the designer's six of 13.09.2026 — "после корзины все
   * статусы и продолжение флоу происходят тут в окне Publish" — plus the ones the two
   * walks, our own KB and board 28206:66756 say have to exist). Read straight off the
   * world, and only one connection card is ever up at a time:
   *
   *   waitingOn…   the name is in the cart and checkout was abandoned (board state ⑦)
   *   unreachable  red — it worked and stopped. The only red besides a failed publish
   *   registering  bought: the registry has the order. Minutes
   *   propagating  bought: registered, travelling the world. Hours, up to 72
   *   connecting   attached: the records are ours and we are writing them
   *   padlock      either path: the address answers here, so the certificate can be issued
   *   ready        blue — set up, correct, never published. The novice's №1 "it's broken"
   *   old-site     red — the publish FAILED: an older website still sits on the address
   *   confirmEmail the registrant-email clock on a freshly registered name (world.icann)
   *   settled      live and nothing pending: no card at all, one line of prose
   *
   * ⚠️ confirmEmail NO LONGER WAITS ITS TURN. The old rule gave the slot to the padlock
   * because "it clears in half an hour and the other has a fortnight" — but the only path
   * that sets this flag is the BOUGHT one, which now spends hours in `registering` and
   * `propagating`, so the fortnight card would have been invisible for exactly the window
   * in which it is the one thing the customer must act on. It is a different question from
   * "where has the connection got to", so it is a second card under the first, not a
   * competitor for one slot.
   */
  const attached = isCustomDomainActive(world)
  const liveish = world.domain === 'live' || world.domain === 'multiple'
  const unreachable = world.domain === 'unreachable'
  const connecting = world.domain === 'connecting'
  const registering = world.domain === 'registering'
  const propagating = world.domain === 'propagating'
  const padlock = world.domain === 'verifying'
  const ready = world.domain === 'ready'
  const oldSite = world.domain === 'old-site'
  const confirmEmail = attached && world.icann
  const settled = liveish && !world.icann
  /** A name left standing at the till — see the card for how this maps to board state ⑦. */
  const cartDomain = world.cart.find((l) => l.kind === 'domreg')?.domain
  const waitingOnCheckout = world.domain === 'checkout' && !!cartDomain
  /**
   * Does the domain answer WITH THE SITE? That is what the field and its Live pill report,
   * and the padlock beat only qualifies if the site was ever published — on the way to
   * `ready` the certificate goes on in front of a site nobody has put out yet, and a green
   * "Live" pill over that address would be the one outright lie in the panel.
   */
  const answering = liveish || (padlock && world.published)
  /** Is a connection state showing? The email card stacks under it when so. */
  const stageCard = unreachable || connecting || registering || propagating || padlock || ready || oldSite

  /*
   * Our own KB, on publishing to a domain that already serves something: the target "must
   * be associated with a clean hosting environment, as the tool is not compatible with
   * existing sites (e.g. WordPress or other types of installations)" — leave the old files
   * there and "publishing to production will fail". DreamHost's base is WordPress, so on
   * the attach path this is likely, not exotic.
   *
   * ⚠️ MODELLED ON THE INVENTORY AXIS: the first publish onto a domain that is `dh-in-use`
   * fails. That is deliberate and it is reachable in a demo by accident — say so before
   * showing the happy path. Flip `inventory` to any other value in the scenario console and
   * the same press goes live.
   */
  const publishNow = () => {
    if (ready && world.inventory === 'dh-in-use') return set({ domain: 'old-site' })
    set({ unpublished: 0, published: true, ...(ready ? { domain: 'live' as const } : null) })
  }
  /* The second attempt, after support has cleared the address. The prototype cannot model
     the clearing, so this one lands — a demo that dead-ends teaches nothing. */
  const retryPublish = () => set({ domain: 'live', published: true, unpublished: 0 })

  /*
   * THE PRIMARY BUTTON SAYS WHAT IT DOES, IN EVERY STATE.
   *
   * It used to read "Continue" while actually publishing (a never-published site with no
   * pending edits), and "Update"/"Continue" while merely closing the panel (connecting,
   * verifying, unreachable) — a publish-shaped button that does not publish is the first
   * thing a product owner presses. So: there is either something to publish, in which case
   * the button is blue and names it, or there is not, in which case it stops pretending —
   * it becomes the quiet "Keep editing", the house's own permission to walk away
   * (states.md, every waiting state).
   *
   * `ready` is excluded on purpose even though it CAN publish: that state carries its own
   * Publish inside its card, where the sentence explaining it is, and two identical blue
   * verbs in one 480px panel is one too many. `old-site` is excluded because publishing is
   * precisely what just failed there.
   *
   * ⚠️ NO "· Free" ON THE LABEL (designer, 08.09.2026: "убери из кнопки — Free"), which is
   * also what the board draws — an 86px button reading just "Publish". The suffix was ours,
   * arguing audit conclusion №1 (we are the only builder in the category charging credits to
   * publish, so publishing must read as free). That argument now has nowhere on this button
   * to live: if it is worth making, it belongs in the nudge banner's copy, not stapled to
   * the verb. Raised with the designer; do not put it back on the button.
   */
  const publishes = !ready && !oldSite && (world.unpublished > 0 || !world.published)
  const primary = !publishes
    ? { en: 'Keep editing', uk: 'Далі редагувати' }
    : !world.published
      ? { en: 'Publish', uk: 'Опублікувати' }
      : { en: `Update · ${world.unpublished} changes`, uk: `Оновити · змін: ${world.unpublished}` }

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
              {/* A domain ANSWERING in front of the site counts as published: "Not
                  published" over a live custom domain would be a lie. Merely having one
                  attached does not — a domain that is connecting, or `ready` and waiting
                  for the first press, stands in front of nothing, and titling that panel
                  "Publish" would hide the very thing it is there to say. */}
              {world.published || answering
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
                  <UrlField value={STAGING_NAME} suffix={STAGING_SUFFIX} />
                )}
              </div>

              {/* ------------------------------------------------- the state card
                  Copy comes from docs/features/domains/states.md wherever that document
                  has a string for the state — it is the deliverable, quoted in Figma and
                  here, and a second copy of a sentence drifts from the first inside a
                  month. Where it has none, the line is marked INVENTED below. */}

              {/* `needs-attention` in states.md: it worked and it stopped. The first thing
                  a person thinks is "I've lost my site", so the first thing the card says
                  is that they have not. The old line ("We can't reach this domain yet ·
                  your plan is active") reassured them about their BILLING in the middle of
                  an outage, and wrapped one word short at 480px besides.
                  ⚠️ states.md opens the sub with "Something changed at {registrar} on
                  {date}." — dropped, not reworded: the world carries neither a registrar
                  name nor a date, and inventing either is how a demo starts lying. */}
              {unreachable && (
                <StatusCard
                  tone="red"
                  title={t({
                    en: `${world.customDomain} stopped showing your site`,
                    uk: `${world.customDomain} більше не показує ваш сайт`,
                  })}
                  sub={t({
                    en: `Your site is safe — it’s still at ${STAGING_HOST}.`,
                    uk: `Ваш сайт цілий — він і далі за адресою ${STAGING_HOST}.`,
                  })}
                  action={{
                    label: t({ en: 'Fix this', uk: 'Виправити' }),
                    onClick: () => retryConnect(world.customDomain),
                  }}
                />
              )}

              {/* `connecting · in-account`, states.md variant A — the one variant of three
                  entitled to say "a few minutes", because the records are ours to write.
                  ⚠️ A WINDOW AND A CHECK, NEVER A MOMENT. Board 27071:20574 says "connects
                  in a few seconds"; DreamHost's own FAQ says a freshly hosted domain "can
                  take anywhere from 4–8 hours to resolve online"; another KB page claims a
                  five-minute TTL. Their contradiction, not ours — so the promise stays a
                  window, and "it goes live on its own" carries the check. */}
              {connecting && (
                <StatusCard
                  tone="amber"
                  title={t({
                    en: `Connecting ${world.customDomain}`,
                    uk: `Підключаємо ${world.customDomain}`,
                  })}
                  sub={t({
                    en: 'Usually a few minutes. Keep editing — it goes live on its own.',
                    uk: 'Зазвичай кілька хвилин. Працюйте далі — він увімкнеться сам.',
                  })}
                />
              )}

              {/* `registering`, states.md §5. The registry, and only the registry: fifteen
                  minutes is verified ("within 15 minutes of completing the purchase form")
                  and it is NOT the same event as a working website — that is the next
                  card. No action: there is none. */}
              {registering && (
                <StatusCard
                  tone="amber"
                  title={t({
                    en: `Registering ${world.customDomain}`,
                    uk: `Реєструємо ${world.customDomain}`,
                  })}
                  sub={t({
                    en: 'Usually under 15 minutes. Nothing for you to do.',
                    uk: 'Зазвичай менш ніж 15 хвилин. Від вас нічого не потрібно.',
                  })}
                />
              )}

              {/* `propagating`, states.md §5 — verbatim, including the last clause, which
                  is the only honest way to own a 72-hour wait. This is the state the
                  checkout sheet's "connects automatically after checkout" was silently
                  promising away. No action: there is none, and the free address works the
                  whole time. */}
              {propagating && (
                <StatusCard
                  tone="amber"
                  title={t({
                    en: `${world.customDomain} is on its way`,
                    uk: `${world.customDomain} уже в дорозі`,
                  })}
                  sub={t({
                    en: 'Most visitors will reach your site within a few hours. It can take up to 72 hours to work everywhere in the world — that part is the internet, not us.',
                    uk: 'Більшість відвідувачів побачать сайт за кілька годин. По всьому світу це може зайняти до 72 годин — це вже інтернет, а не ми.',
                  })}
                />
              )}

              {/* `securing`, states.md. The padlock is the LAST wait and it cannot start
                  early — a certificate needs the address to answer here first — which is
                  why this is its own card and not a line inside the one above.
                  ⚠️ The old sub said "the site already works". On the way to `ready` it
                  does not: nobody has published it yet. */}
              {padlock && (
                <StatusCard
                  tone="amber"
                  title={t({ en: 'Secure padlock is switching on', uk: 'Вмикається захисний замок' })}
                  sub={t({
                    en: 'Nothing for you to do · usually ten to thirty minutes',
                    uk: 'Від вас нічого не потрібно · зазвичай десять–тридцять хвилин',
                  })}
                />
              )}

              {/* `ready`, states.md — verbatim, and the state nobody had drawn. Everything
                  is correct and nothing is happening; the customer concludes the product
                  is broken. (They may even be looking at DreamHost's own empty-site page —
                  "Well, this is awkward. The site you're looking for is not here." — while
                  this panel says all is well. Worth a line one day; it is not in the
                  approved copy, so it is not invented in here tonight.)
                  The verb lives INSIDE the card, and it is the only blue thing in the
                  panel while this state is up. */}
              {ready && (
                <StatusCard
                  tone="blue"
                  title={t({
                    en: `${world.customDomain} is ready — publish to put your site on it`,
                    uk: `${world.customDomain} готовий — опублікуйте, щоб сайт став на нього`,
                  })}
                  sub={t({
                    en: 'Your address is set up. Visitors will see your site the moment you publish.',
                    uk: 'Адресу налаштовано. Відвідувачі побачать сайт тієї ж миті, коли ви опублікуєте.',
                  })}
                  action={{
                    label: t({ en: 'Publish', uk: 'Опублікувати' }),
                    onClick: publishNow,
                    primary: true,
                  }}
                />
              )}

              {/* The dirty-domain publish failure — failures.md №15, "дырки нет даже на
                  бумаге": no board, no state, and on a WordPress customer base the likely
                  one. Our KB says the publish fails while the old site's files are there.
                  ⚠️ OUR WORDING, PENDING THE REAL STRING. DreamHost's exact message for
                  this case is the single most valuable string missing from the research —
                  the four we do have verbatim are all about ADDING a domain, not
                  publishing to it ("Sorry, this domain is already in our system on another
                  account." · "The domain looks like a subdomain." · "…registered with
                  another provider and may require its DNS to be pointed to DreamHost." ·
                  "…not yet registered and would need to be purchased…"). None covers this.
                  The remedies in the KB are: clear the files, move the old site, or
                  contact support. The first two are an SFTP session — no builder customer
                  is doing that from this card — so the card names the one they can act on
                  and keeps the verb for afterwards. */}
              {oldSite && (
                <StatusCard
                  tone="red"
                  title={t({
                    en: `${world.customDomain} still has an older website on it`,
                    uk: `На ${world.customDomain} досі стоїть старіший сайт`,
                  })}
                  sub={t({
                    en: `It has to come off before your site can go on — support can clear it for you. Your site is safe at ${STAGING_HOST} meanwhile.`,
                    uk: `Його треба прибрати, перш ніж стане ваш — підтримка може це зробити. Тим часом ваш сайт живий за адресою ${STAGING_HOST}.`,
                  })}
                  action={{
                    label: t({ en: 'Try again', uk: 'Спробувати ще' }),
                    onClick: retryPublish,
                  }}
                />
              )}

              {/* Board 28206:66756 draws a seventh state, `7 not paid`, and this is our
                  reading of it: the domain was chosen, the cart was filled and the
                  customer walked out of checkout. The world already carries that state
                  (`domain: 'checkout'` with lines in the cart — DomainModal writes both)
                  and the panel used to render it as if nothing had happened, offering
                  "Connect your own domain" over a domain already sitting in their cart.
                  ⚠️ The mapping is OURS — the board's own frame has not been re-read — so
                  the card claims nothing beyond what the world says and hands straight
                  back to the till, which is where the price lives. */}
              {waitingOnCheckout && (
                <StatusCard
                  tone="amber"
                  title={t({
                    en: `${cartDomain} is waiting in your cart`,
                    uk: `${cartDomain} чекає у вашому кошику`,
                  })}
                  sub={t({
                    en: 'It connects on its own once checkout is done.',
                    uk: 'Він підключиться сам, щойно ви завершите оплату.',
                  })}
                  action={{
                    label: t({ en: 'Finish checkout', uk: 'Завершити оплату' }),
                    onClick: () => openPanel('cart'),
                  }}
                />
              )}

              {/* The registrant-email clock (state ⑤ on board 28206:66756). A SECOND card
                  under whichever one is above it — see the precedence note upstairs.
                  ⚠️ NO COUNTDOWN. The board draws "14 days left" and the world comment used
                  to say fifteen; the digit traces to Squarespace's unlink rule, not to
                  DreamHost or ICANN (states.md §5), so the card points at the deadline in
                  the mail instead of inventing one. The address is the board's own
                  placeholder and stays until the world carries an account email. */}
              {confirmEmail && (
                <StatusCard
                  stacked={stageCard}
                  tone="amber"
                  title={t({ en: 'Confirm your email to keep this domain', uk: 'Підтвердьте email, щоб зберегти домен' })}
                  sub={resent
                    ? t({
                        en: 'Sent again to roman@example.com — check your inbox.',
                        uk: 'Надіслали ще раз на roman@example.com — перевірте пошту.',
                      })
                    : t({
                        en: 'We sent a link to roman@example.com · confirm before the deadline in the email',
                        uk: 'Ми надіслали посилання на roman@example.com · підтвердьте до терміну, вказаного в листі',
                      })}
                  action={resent
                    ? { label: t({ en: 'Sent', uk: 'Надіслано' }), disabled: true }
                    : { label: t({ en: 'Resend', uk: 'Надіслати ще' }), onClick: () => setResent(true) }}
                />
              )}
              {/* ------------------------------------------ the prototype's stand-in
                  The one state whose exit happens OUTSIDE the product: the customer
                  confirms in their inbox, and a prototype has no inbox — so the flow
                  could be walked up to here and never finished (designer, 13.09.2026).
                  Deliberately tooling-styled — dashed, muted, its own PROTOTYPE tag —
                  the same convention the scenario console uses, so nobody watching a
                  demo mistakes it for a control the product ships. */}
              {confirmEmail && (
                <div className="mt-2 flex items-center justify-between gap-4 rounded-[12px] border border-dashed border-[var(--white-200)] px-4 py-3">
                  <p className="min-w-0 text-[12.5px] leading-[1.45] text-[var(--white-400)]">
                    <span className="mr-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--white-300)]">
                      Prototype
                    </span>
                    {t({
                      en: 'stands in for opening the email and clicking the link inside it',
                      uk: 'замість того, щоб відкрити лист і натиснути посилання в ньому',
                    })}
                  </p>
                  <button
                    onClick={() => set({ icann: false })}
                    className="h-8 flex-none rounded-[8px] border border-[var(--white-200)] px-3 text-[13px] font-semibold text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white"
                  >
                    {t({ en: 'Confirm email', uk: 'Підтвердити лист' })}
                  </button>
                </div>
              )}

              {settled && (
                <p className="mt-[19px] px-0.5 text-[13px] leading-[1.4] text-[var(--white-400)]">
                  {t({ en: 'Padlock on · anyone can visit', uk: 'Замок увімкнено · сайт доступний усім' })}
                </p>
              )}

              {/* ⚠️ NO STAGING-ADDRESS BLOCK. It used to sit here, under the card, the way
                  the designer's states were drawn — and he took it out on sight
                  (13.09.2026): "у нас будет только одна ссылка отображаться в этом окне".
                  The field at the top already carries the one address the site answers to,
                  and a second link under it made the panel answer a question nobody asked
                  twice. Do not put it back.
                  ⚠️ The two RED cards do name the free address inside their sentence, and
                  that is a different thing: not a second link in the happy path, but the
                  one line that answers "have I lost my site" in the only two states where
                  the customer is asking it (states.md rule 4, and its accepted copy for
                  `needs-attention` says it word for word). */}

              {/* connect your own domain — dashed card, the state before any of this.
                  Not while a name is standing at the till: the card above is about that
                  name, and offering to start again under it reads as "your purchase went
                  nowhere". */}
              {!attached && !waitingOnCheckout && (
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
              way to say what a connection was doing; now each state says it, and every
              state that needs the customer carries its own action inside its card.
              Blue while it publishes, quiet when it does not — a panel whose primary slot
              is blue whatever it does teaches people not to read it. */}
          <div className="flex items-center justify-end px-4 py-4">
            <button
              onClick={() => (publishes ? publishNow() : togglePublish(false))}
              className={
                publishes
                  ? 'h-10 rounded-[10px] bg-[var(--action)] px-5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]'
                  : 'h-10 rounded-[10px] border border-[var(--white-200)] px-5 text-[14px] font-semibold text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white'
              }
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
