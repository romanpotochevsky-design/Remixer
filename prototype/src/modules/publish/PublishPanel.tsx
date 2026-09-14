/**
 * The publish panel — pixel source: Figma node 29697:36970 (480×466), which supersedes
 * the 2026 redesign frame 25819:144061 (548 wide) it grew out of.
 *
 * Card: gray-850, radius 20, hairline border, deep drop shadow, anchored under the
 * Publish button. Header 64px. Body: an inset card (white-4%, radius 16) holding — for a
 * site that has never gone live — the nudge banner, then the website-URL field and the
 * "Buy or connect a domain" dashed card. Button bar bottom-right.
 *
 * THREE THINGS DEPEND ON WHETHER THE SITE IS PUBLISHED (`world.published`, designer
 * 08.09.2026):
 *  · THE TITLE. An unpublished site's panel is titled by its STATUS — "Not published" —
 *    rather than by the action. Once it is live the title is the action again, "Publish".
 *  · THE NUDGE. A 120px banner, "Ready to put your site live?", purely informational:
 *    it argues for publishing and can be waved off with its own ✕ (`ui.publishHintOpen`).
 *    It is gone for good once the site is live — there is nothing left to nudge.
 *  · THE MARKER beside the free address (14.09.2026). Neither of the two above is a
 *    RESULT — a title changing one word and a banner leaving are both things the panel
 *    stops doing — so on a site with no custom domain the headline verb had no visible
 *    outcome at all and read as a broken button. The marker is the outcome, and it is
 *    the small honest one: the green Live pill and the padlock stay the property of a
 *    working custom domain. See UrlField.
 * None of the three hangs off `unpublished`: see the field's own note in state/world.ts.
 *
 * ⚠️ The board writes the title as "Not Publisher", which is not English — the site is
 * not published. Shipped as "Not published", the same call this project made for the
 * template panel's "Add Promt" (CLAUDE.md). Flagged to the designer, not silently kept.
 *
 * The Figma frame draws the base case; the connecting/live cases keep the Launchpad
 * logic from the handoff (⑥-A) re-dressed in the same visual language, so every world
 * state still renders. The subtitle under "Buy or connect a domain" is the one line
 * that changes with entitlement: on trial it names the plan and its price, on a paid
 * account it says what the plan covers — publishing on a custom domain, never the name
 * itself, which is a purchase on every plan (see the card).
 */
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useWorld, hasPlan, isCustomDomainActive, type World } from '@/state/world'
import { useUI } from '@/state/ui'
import { useT } from '@/i18n'
import { STAGING_HOST } from '@/data/domains'
import { IconPlus, IconClose } from '@/ui/icons'
import { retryConnect } from '@/modules/domains/connect'
import { peekPendingConnect } from '@/modules/panel/PanelCart'
import { cardInBody, cardInBodyFade, popover, popoverContent } from '@/ui/motion'

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
 * PUBLISHING HAS TO LAND — the two clocks that make it land.
 *
 * `PUBLISH_SETTLE_MS` is how long the footer button refuses to be a dismiss button after
 * a publish. The gate found that a double-press published AND closed the panel, so the
 * one moment the whole panel exists for was thrown away by the second half of a gesture
 * people make constantly on a button that has just changed under their finger. For this
 * beat the button states the result instead — "Published" — and only then offers the way
 * out. It is not a dead button: it is a button that answers before it moves on.
 *
 * `PUBLISH_FRESH_MS` is how long "just now" stays true. After it, the marker beside the
 * address keeps the fact and drops the timing rather than ageing into a lie — the world
 * persists `published` to localStorage and cannot say WHEN, so "just now" is knowable
 * only inside the session that pressed the button.
 */
const PUBLISH_SETTLE_MS = 1800
const PUBLISH_FRESH_MS = 60000


/**
 * DOES THE ADDRESS ANSWER WITH THE SITE? — the one reading, for the whole shell.
 *
 * Exported because the topbar chip prints an address too (App.tsx), and until tonight
 * the two derived it separately: the panel counted the padlock beat as answering, the
 * chip did not, so for the ~6.6 seconds of `verifying` the window held the custom domain
 * and the topbar the staging one — two addresses and two statuses at once, which is the
 * same failure as the second link the designer struck out of this panel (13.09.2026:
 * "у нас будет только одна ссылка отображаться в этом окне"). One function, both readers.
 *
 * `verifying` qualifies ONLY on a published site, and the asymmetry is the mechanism: a
 * certificate cannot be issued until the address already answers here, so by this beat
 * the domain does resolve — but if nobody ever pressed Publish it resolves to an empty
 * site, and printing it as "your website URL" would be the one outright lie in the panel.
 */
export const domainAnswers = (w: World) =>
  w.domain === 'live' || w.domain === 'multiple' || (w.domain === 'verifying' && w.published)

/**
 * A hostname never breaks mid-word.
 *
 * `fit-ration.remixer.ai` was wrapping as `fit-` / `ration.remixer.ai`: a hyphen is a
 * break opportunity to every browser, and half an address reads as a different address.
 * (The brand faces are absent — Figtree stands in for Proxima Nova and runs wider — so
 * these cards wrap a word earlier here than they will in the product. That is a reason
 * the break SHOWS, not the reason it is wrong: it would be wrong at any width.)
 *
 * Done here rather than inside the strings so every card gets it — six of the seven print
 * a domain — and so the copy stays the plain sentence the deliverable quotes.
 */
const HOSTISH = /([A-Za-z0-9][A-Za-z0-9-]*(?:\.[A-Za-z0-9][A-Za-z0-9-]*)*\.[A-Za-z]{2,})/
const keepHostsWhole = (text: string) =>
  /* split() with one capture group hands back [text, host, text, host, …] — the odd
     slots are the matches, and only those get the nowrap. */
  text.split(HOSTISH).map((part, i) =>
    i % 2 ? <span key={i} className="whitespace-nowrap">{part}</span> : part,
  )

/**
 * …and a card title never ends on a one-word line. `{domain} still has an older website
 * on it` was leaving "it" alone under two full lines; binding the last word to the one
 * before it moves the pair down together. Titles only: they are the sentence-sized,
 * semibold line where a widow is loud, and the 13px subs below are prose.
 */
const bindWidow = (s: string) => s.replace(/\s+(\S+)$/, ' $1')

/**
 * The inset URL field.
 *
 * Three faces, and which one is on says what the site answers to RIGHT NOW:
 *  · `bare` — an address and nothing beside it. Two situations land here, and they agree:
 *    the free address before anybody has pressed Publish (nothing has happened yet), and
 *    the custom domain while the padlock is still switching on (the amber card directly
 *    beneath already says where this has got to, and a pill repeating it would be the
 *    panel talking about one thing twice).
 *  · `published` — the free address, with the quiet marker that the site is out on it.
 *    See the marker itself below for why it is not green.
 *  · `live` — the custom domain under the green pill. The pill replaces the trailing
 *    button rather than joining it, and the board draws it in that slot.
 *
 * ⚠️ THERE IS NO PENCIL (demo-readiness gate, 14.09.2026). The free address used to
 * carry an "Edit address" button — hover fill, aria-label, and no handler — and it was
 * the ONLY trailing control in the panel's opening frame, which is to say the one thing
 * a person reaches for while the presenter is saying "this is your address". It is
 * REMOVED rather than wired: there is no design for what editing the free address would
 * mean (rename the subdomain? against what taken-name check? with what effect on a link
 * already shared?), and answering those questions in code at night is how a prototype
 * starts teaching a product that does not exist. Do not put a pencil back without the
 * screens behind it.
 *
 * ⚠️ THE GREEN PILL IS NOT PAINTED BY "there is a domain in the field" (D5, 14.09.2026).
 * It used to be, so during `verifying` the field said Live directly above a card saying
 * the padlock was still switching on. Live in this product means the checklist's third
 * line is closed; while it is not, the address answers and that is a different claim.
 */
function UrlField({ value, suffix, slot, publishedLabel }: {
  value: string
  suffix?: string
  slot: 'bare' | 'live' | 'published'
  /** Read on `published` only. The freshness lives in the WORDING, not in the paint. */
  publishedLabel?: string
}) {
  const reduce = useReducedMotion()
  /* The field's right padding belongs to whatever is (or is not) in the trailing slot:
     8px is the inset a 24px pill wants, and with the slot empty it left the address
     sitting 16px from the left rim and 8px from the right — an off-centre box that read
     as a control missing rather than a control absent. Nothing there, nothing implied. */
  const trailing = slot !== 'bare'
  return (
    <div className="w-full rounded-[12px] shadow-[inset_0_0_0_1px_var(--white-200)]">
      <div className={`flex h-12 items-center justify-between rounded-[8px] bg-[var(--black-300)] py-1 pl-4 ${trailing ? 'pr-2' : 'pr-4'}`}>
        <p className="min-w-0 truncate text-[15px]">
          <span className="text-[var(--white-900)]">{value}</span>
          {suffix && <span className="text-[var(--white-500)]">{suffix}</span>}
        </p>
        {slot === 'live' && (
          <span className="flex h-6 flex-none items-center gap-1.5 rounded-full bg-[#48ba7926] pl-2 pr-2.5 text-[12px] font-medium text-[var(--live)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--live)]" aria-hidden />
            Live
          </span>
        )}
        {/*
         * THE SMALLER, HONEST SIGNAL — same shape as the Live pill, deliberately not its
         * colour. Green and the word Live are this product's claim that a working custom
         * domain is answering with the padlock on (D5 above, and the checklist in
         * copy.md §5); the free address earns neither, and never will — we do not promise
         * a padlock on it. What IS true is the fact the panel refused to state at all
         * until tonight: the site is out, on the address we gave you. So: the same 24px
         * pill, in the hairline ink the rest of the chrome uses, saying exactly that.
         *
         * `initial={false}` so it animates only when it ARRIVES — a press of Publish —
         * and is simply there on every later opening of the panel. The nudge banner
         * leaves in the same beat (160ms), and cardInBody's own 160ms delay is what
         * lands this after the reflow instead of underneath it.
         */}
        <AnimatePresence initial={false}>
          {slot === 'published' && (
            <motion.span
              key="published"
              variants={reduce ? cardInBodyFade : cardInBody}
              initial="initial"
              animate="animate"
              className="flex h-6 flex-none items-center gap-1.5 rounded-full bg-[var(--white-100)] pl-2 pr-2.5 text-[12px] font-medium text-[var(--white-700)]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--white-400)]" aria-hidden />
              {publishedLabel}
            </motion.span>
          )}
        </AnimatePresence>
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
        {/* Hostnames stay whole and the title keeps its last two words together —
            see keepHostsWhole / bindWidow above. */}
        <p className="break-words text-[15px] font-semibold leading-[1.3] text-white">
          {keepHostsWhole(bindWidow(title))}
        </p>
        <p className="mt-1 text-[13px] leading-[1.4] text-[#ffffffa3]">{keepHostsWhole(sub)}</p>
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
  /* Did the publish happen in FRONT of this person, and how long ago? Session state for
     the same reason `resent` is: it describes this press, not the customer's situation —
     `world.published` is the situation, and it survives a reload, which is exactly why it
     cannot be asked what time it is. Two clocks, see the constants above. */
  const [settling, setSettling] = useState(false)
  const [justPublished, setJustPublished] = useState(false)
  useEffect(() => {
    if (!settling) return
    const t = window.setTimeout(() => setSettling(false), PUBLISH_SETTLE_MS)
    return () => window.clearTimeout(t)
  }, [settling])
  useEffect(() => {
    if (!justPublished) return
    const t = window.setTimeout(() => setJustPublished(false), PUBLISH_FRESH_MS)
    return () => window.clearTimeout(t)
  }, [justPublished])

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
  /*
   * A NAME LEFT STANDING AT THE TILL — see the card for how this maps to board state ⑦.
   *
   * TWO TRIPS REACH CHECKOUT AND ONLY ONE OF THEM PUTS THE NAME IN THE CART. Buying one
   * leaves a registration line; connecting one the customer ALREADY OWNS is free, so that
   * order is the plan and nothing else, and the name rides across checkout as the intent
   * parked in `PanelCart` (its PENDING_KEY note). This read was the cart alone, so the
   * connect-owned customer who walked out came back to the dashed "Buy or connect a
   * domain" card as if the trip had never happened, over a cart they could not see and
   * had no way back into (14.09.2026 — the visible half of that night's blocker).
   *
   * ⚠️ PEEK, NEVER TAKE. The intent is spent exactly once, by the till at Submit Order.
   * A panel that merely renders must not consume it, or this card would destroy the
   * connection it is announcing. Reading it during render is safe for the reason given
   * where it is defined: it only ever moves alongside a world write, which re-renders
   * this panel anyway.
   *
   * ⚠️ AND THE FALLBACK STAYS NARROW. The parked name counts only while the PLAN is still
   * in the cart, which is exactly the abandoned trip and exactly the shape `PanelCart`'s
   * own re-entry check keeps alive (a checkout with no plan line drops the intent as
   * money waiting to be spent). A cart holding a plan for some other reason has nothing
   * parked, so there is no name, and this card does not appear.
   */
  const cartRegistration = world.cart.find((l) => l.kind === 'domreg')?.domain
  const parkedConnect =
    !cartRegistration && world.cart.some((l) => l.kind === 'remixer')
      ? peekPendingConnect() ?? undefined
      : undefined
  const cartDomain = cartRegistration ?? parkedConnect
  const waitingOnCheckout = world.domain === 'checkout' && !!cartDomain
  /**
   * Does the domain answer WITH THE SITE? That is which ADDRESS the field prints — and
   * the topbar chip prints the same one, off the same function (see `domainAnswers`).
   * It is NOT what paints the green pill: answering and Live are two different claims,
   * and the padlock beat sits between them (D5).
   */
  const answering = domainAnswers(world)
  /** Is a connection state showing? The email card stacks under it when so. */
  const stageCard = unreachable || connecting || registering || propagating || padlock || ready || oldSite
  /**
   * …and while one is up, THIS PANEL IS THE ONLY DOOR IN THE SHELL (D3, 14.09.2026).
   *
   * The topbar chip routes every one of these states here rather than to the domains
   * window (App.tsx: "the chip opens that panel, not the domains window"), and the dashed
   * "Connect your own domain" card below is gone the moment a domain is attached — so
   * from `ready`, `old-site` or `propagating` there was no way back to the dashboard at
   * all: press the chip, get this panel, close it, press again, get this panel.
   *
   * The way out is a quiet one, on purpose. Every non-terminal state already carries its
   * own verb inside its card, and a second button of equal weight would compete with it;
   * this is a text row under the card, in the kit's own small text button (`Text / Small
   * / Dark`, 32px, 56% white, no fill and no rim). It is NOT the shared footer button
   * that was removed — it belongs to the card above it, it appears only while that card
   * is up, and a state that needs nothing from the customer still asks for nothing.
   */
  const stalled = ready || oldSite || unreachable

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
  /* A press that WORKED starts both clocks; the `dh-in-use` branch is a publish that
     failed, and a failure that congratulates itself is the worst thing in this file. */
  const markPublished = () => { setSettling(true); setJustPublished(true) }
  const publishNow = () => {
    if (ready && world.inventory === 'dh-in-use') return set({ domain: 'old-site' })
    set({ unpublished: 0, published: true, ...(ready ? { domain: 'live' as const } : null) })
    markPublished()
  }
  /* The second attempt, after support has cleared the address. The prototype cannot model
     the clearing, so this one lands — a demo that dead-ends teaches nothing. */
  const retryPublish = () => {
    set({ domain: 'live', published: true, unpublished: 0 })
    markPublished()
  }

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
  /*
   * …AND FOR ONE BEAT AFTER A PRESS IT SAYS WHAT HAPPENED (see PUBLISH_SETTLE_MS).
   * The slot is the same one the press was made in, so the answer arrives under the
   * finger that asked; then it stands down into "Keep editing" on its own. This is the
   * half of the fix the customer feels; the marker beside the address is the half they
   * can still read a minute later.
   */
  const settleLabel = settling && !publishes
  const primary = settleLabel
    ? { en: 'Published', uk: 'Опубліковано' }
    : !publishes
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
                  <UrlField value={world.customDomain} slot={liveish ? 'live' : 'bare'} />
                ) : (
                  /* The free address. It gets the marker the moment the site is out on it
                     — including while a custom domain is still connecting behind the
                     scenes, because that is precisely when "where IS my site right now"
                     is the question, and the answer is: here. */
                  <UrlField
                    value={STAGING_NAME}
                    suffix={STAGING_SUFFIX}
                    slot={world.published ? 'published' : 'bare'}
                    publishedLabel={justPublished
                      ? t({ en: 'Published · just now', uk: 'Опубліковано · щойно' })
                      : t({ en: 'Published', uk: 'Опубліковано' })}
                  />
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

              {/* `connecting · in-account`, states.md variant A — the records are ours to
                  write, so this is the fast path and the only variant of three allowed to
                  say anything about speed at all.
                  ⚠️ A WINDOW AND A CHECK, NEVER A MOMENT — and NOT the document's "usually
                  a few minutes", which predates the mechanism. The zone's SOA MINIMUM is
                  14400s and it governs NEGATIVE caching: a name parked at "DNS Only" has
                  never resolved, so the world is holding "there is nothing here" for up to
                  four hours. The five-minute TTL applies to updating a record that already
                  answers — not to this. The domains our customers connect are precisely
                  the never-used ones, so the honest shape is "usually quick, sometimes a
                  few hours, and we are checking". "We'll keep checking" is states.md's own
                  phrase (variant B); it replaces "it goes live on its own" because that
                  reads as a countdown, and there is nothing to count down — we cannot know
                  when a given visitor's cached "nothing here" expires. */}
              {connecting && (
                <StatusCard
                  tone="amber"
                  title={t({
                    en: `Connecting ${world.customDomain}`,
                    uk: `Підключаємо ${world.customDomain}`,
                  })}
                  sub={t({
                    en: 'Usually quick, sometimes a few hours. Keep editing — we’ll keep checking.',
                    uk: 'Зазвичай швидко, іноді кілька годин. Працюйте далі — ми перевіряємо.',
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
                  /* ⚠️ THE REASSURANCE HAS TO BE TRUE ON THE PATH THAT REACHES THIS CARD
                     (D9, 14.09.2026). It read "your site is safe at {staging} meanwhile"
                     inside a panel titled "Not published" — and the organic route here is
                     `dh-in-use` → Replace and connect → `ready` → Publish, where the site
                     has never been published and therefore is not at the free address
                     either: the panel's own nudge says so in as many words ("they never
                     see the changes you make until you publish them").
                     So the clause splits on the one fact it depends on. Published: the
                     free address really is still serving, and this says it in the words
                     states.md already approved for `needs-attention`. Never published:
                     the true reassurance is about the WORK, not an address — rule 4 asks
                     the state to say the site is intact, not to name a URL. */
                  sub={world.published
                    ? t({
                        en: `It has to come off before your site can go on — support can clear it for you. Your site is safe meanwhile — it’s still at ${STAGING_HOST}.`,
                        uk: `Його треба прибрати, перш ніж стане ваш — підтримка може це зробити. Ваш сайт тим часом цілий — він і далі за адресою ${STAGING_HOST}.`,
                      })
                    : t({
                        en: 'It has to come off before your site can go on — support can clear it for you. Nothing you’ve built is lost — it’s all still here.',
                        uk: 'Його треба прибрати, перш ніж стане ваш — підтримка може це зробити. Нічого зі зробленого не втрачено — усе лишається тут.',
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
                  /* Two sentences for the two trips, because the cart holds a different
                     thing in each and the card is read WITH the cart open a press later.
                     A bought name really is sitting there as a line. An owned one is not
                     — it is free, the cart shows the plan alone — so telling that
                     customer their domain is in the cart would be contradicted by the
                     very screen the button opens. Same card, same verb, same route back;
                     only the claim is made true. */
                  title={parkedConnect
                    ? t({
                        en: `${cartDomain} connects as soon as you check out`,
                        uk: `${cartDomain} підключиться, щойно ви завершите оплату`,
                      })
                    : t({
                        en: `${cartDomain} is waiting in your cart`,
                        uk: `${cartDomain} чекає у вашому кошику`,
                      })}
                  sub={parkedConnect
                    ? t({
                        en: 'Your Remixer plan is waiting in your cart.',
                        uk: 'Ваш план Remixer чекає у вашому кошику.',
                      })
                    : t({
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
              {/* ⚠️ NO PROTOTYPE STAND-IN UNDER THIS CARD. A dashed "Confirm email" strip
                  used to sit here, and the designer threw it out on sight (14.09.2026:
                  "зачем ты это ставил в окно? это же не часть интерфейса?!!!!!"). He is
                  right twice over: the panel is the PRODUCT, and the one move this state
                  is waiting for does not happen in the product at all — it happens in the
                  customer's inbox. The stand-in still exists, because the walk has to be
                  finishable; it now floats ABOVE the shell as the simulated email itself
                  (`SimulatedEmail`, App.tsx), which is where an email belongs. Do not put
                  a confirm control back inside this panel. */}

              {/* ------------------------------------- the way back to the domains window
                  See `stalled` upstairs for why this is here and why it is quiet.
                  Two labels, because the honest offer is not the same in both halves:
                   · stalled — `ready`, `old-site`, `unreachable`. Nothing is moving and
                     the hold-up is this NAME (at `old-site` a website they have to clear
                     first), so the escape is the one a person actually wants: another one.
                   · in flight — `connecting`, `registering`, `propagating`, `verifying`.
                     Offering a different domain there would read as "abandon this", over a
                     card that just said there is nothing to do, and on the bought path over
                     a name they have already paid for. So it is plain navigation.
                  `openDomains` closes this panel on its way (state/ui.ts) — one write. */}
              {stageCard && (
                <button
                  onClick={() => openDomains('home')}
                  className="mt-2 flex h-8 items-center rounded-[8px] px-0.5 text-[13px] font-semibold leading-[1.4] text-[var(--white-560)] transition-colors duration-[var(--dur-fast)] ease-std hover:text-white"
                >
                  {stalled
                    ? t({ en: 'Use a different domain', uk: 'Використати інший домен' })
                    : t({ en: 'See all your domains', uk: 'Переглянути всі ваші домени' })}
                </button>
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
                  {/*
                    * ⚠️ THE DOOR NAMES BOTH THINGS BEHIND IT (demo-readiness gate,
                    * 14.09.2026). It read "Connect your own domain", and `openDomains`
                    * opens a dashboard whose larger half is names FOR SALE — so on the
                    * commonest account of all, a paid one with no domains, the whole
                    * screen behind a door marked Connect was a shop. `Connect` in this
                    * product means attaching a name the person already owns and no money
                    * moving (copy.md §1, and the same table's `Buy` for registering a new
                    * one); a door onto both has to say both, and the two sanctioned verbs
                    * are exactly the two halves of that screen.
                    * `Buy`, not `Add`: the conflict copy.md §2 leaves open is settled the
                    * way the boards and DomainsSurface already ship it.
                    */}
                  <span className="min-w-0">
                    <span className="block text-[16px] font-semibold leading-normal text-white">
                      {t({ en: 'Buy or connect a domain', uk: 'Купити або підключити домен' })}
                    </span>
                    {/*
                      * ⚠️ AND CLAIMS ONLY WHAT THE PLAN ACTUALLY COVERS. This line used to
                      * tell a paid customer the domain was "Included in your Remixer Build
                      * plan" while every name on the other side of the door cost between
                      * $0.99 and $89.99. The plan buys the CAPABILITY — publishing on a
                      * custom domain at all — and nothing else; the name is a purchase,
                      * every time, on every plan. Said once and plainly, per copy.md's
                      * "каждое обещание — один раз": no price and no teaser here, because
                      * a first-year figure without its renewal beside it is the dark
                      * pattern the audit's rule 5 exists to stop, and prices belong on the
                      * screen that can show both.
                      * The trial line is untouched and is now framed correctly by the
                      * title: the plan is what publishing on a custom domain requires.
                      */}
                    <span className="mt-1 block text-[13px] leading-normal text-[var(--white-500)]">
                      {paid
                        ? t({
                            en: 'Your Remixer Build plan covers publishing on one',
                            uk: 'Ваш план Remixer Build покриває публікацію на ньому',
                          })
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
              is blue whatever it does teaches people not to read it.
              ⚠️ AND IT DOES NOT CLOSE THE PANEL ON THE BEAT AFTER A PUBLISH. The press
              that publishes turns this button from a verb into an exit under the finger
              that pressed it, so the second half of a double-click dismissed the panel
              and the payoff was never seen at all (gate, 14.09.2026). While `settling`
              the button holds the result instead — see PUBLISH_SETTLE_MS. */}
          <div className="flex items-center justify-end px-4 py-4">
            <button
              onClick={() => {
                if (publishes) return publishNow()
                if (settleLabel) return
                togglePublish(false)
              }}
              aria-disabled={settleLabel || undefined}
              className={
                publishes
                  ? 'h-10 rounded-[10px] bg-[var(--action)] px-5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]'
                  : settleLabel
                    ? 'h-10 cursor-default rounded-[10px] border border-[var(--white-100)] px-5 text-[14px] font-semibold text-[var(--white-500)] transition-colors duration-[var(--dur-fast)] ease-std'
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
