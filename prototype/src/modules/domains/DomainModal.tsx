/**
 * The checkout sheet — Figma 27058:100133 · 27254:11737 · 27275:33023,
 * plus the connect-owned sheet — Figma 27071:20574 (㉖A) · 27071:20591 (㉖B).
 *
 * Three boards, six drawn states, ONE component. What the boards actually vary is
 * two independent axes, so that is how this is built:
 *
 *   axis 1 — WHAT is being done
 *     connect-owned    : a domain already sitting in this customer's DreamHost
 *                        account. Iteration 1 ships exactly two paths and this is
 *                        the second one. It carries NO PRICE — the name is free to
 *                        attach and never enters the cart — but it runs axis 2 like
 *                        every other kind; see `ConnectBody` for why the boards make
 *                        that look otherwise.
 *     connect-existing : the older sheet for that same case, drawn before the ㉖
 *                        boards existed. Superseded by connect-owned, and with its
 *                        last caller gone it is now unreachable.
 *     connect-external : a domain held at another company. ITERATION 2 — the flow is
 *                        not built. It borrows `ConnectBody` for one honest line and
 *                        one honest verb, and exists here only so that this door
 *                        passes the same plan gate as the others.
 *                        ⚠️ WHERE THIS SHEET SITS IN THAT FLOW IS UNSETTLED, and the
 *                        two candidate orderings want opposite behaviour from it —
 *                        including from the no-plan cart handoff, which is the half
 *                        that looks innocent. Search this file for THE ORDERING
 *                        PROBLEM (in `confirm`) before moving it.
 *     buy              : a name from search or the AI suggestions. Carries the
 *                        first-year figure and the honest renewal line.
 *
 *   axis 2 — DOES THE ACCOUNT HAVE A PLAN (read from the world, never passed in)
 *     yes : the lean sheet — 560×232, or 540 on the connect-owned boards. One row,
 *           one button.
 *     no  : the sheet grows to 600, folds the Remixer Build plan chooser in
 *           underneath, and the CTA hands off to checkout instead of connecting.
 *           TRUE OF EVERY KIND. Going live on a custom domain is a paid capability
 *           (verified product fact) whether or not the domain itself costs anything,
 *           so this axis is about the plan, never about the name.
 *
 * The paywall is disclosed INSIDE this surface rather than bouncing the user to a
 * pricing page, and the domain identity stays pinned at the top so the thread is
 * never lost. That is the audit's "own the 60 seconds around go-live" rendered
 * concretely — note there is no DNS, nameserver or A-record vocabulary anywhere.
 *
 * It is an APP-modal, not a canvas one: the mockup's 70% scrim covers the chat
 * column and the right rail too, so this mounts at the top of the tree.
 *
 * Two knowing departures from the pixels, both flagged to the designer:
 *  - the mockup's renewal figure ($11.86) appears nowhere in DreamHost's verified
 *    price table; the real .com renewal is $19.99 and that is what ships here;
 *  - the mockup's domain row reads `coffee-roasters.com` as static text — here it
 *    is whatever domain the user actually clicked.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useWorld, hasPlan } from '@/state/world'
import { useUI } from '@/state/ui'
import { startConnect } from './connect'
import { useT, type Text } from '@/i18n'
import { priceFor, registrarOf } from '@/data/domains'
import type { CartLine } from '@/data/cart'
import { LogoRemixer, IconClose, IconGlobeLarge, IconLink } from '@/ui/icons'
import { modalScrim, modalSheet } from '@/ui/motion'

/** The two ways to pay for the plan, priced off the verified product facts. */
type Term = 'yearly' | 'monthly'

/* ------------------------------------------------------------------ pieces */

/**
 * The 32px close disc (Figma 27328:11613). Black 48% + an 8%-white rim + blur —
 * the same glass recipe as the shell's controls, at the smaller radius.
 */
function CloseButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-[10px] border border-[#ffffff14] bg-[#09090b7a] text-white backdrop-blur-[16px] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#09090bcc]"
    >
      <IconClose size={9} />
    </button>
  )
}

/**
 * The 48px globe tile the domain row hangs off. Black 64% under a 24%-white rim —
 * markedly brighter than the shell's 12% hairline, which is what makes it read as
 * a raised tile rather than an inset well.
 */
function GlobeTile() {
  return (
    <span className="grid h-12 w-12 flex-none place-items-center rounded-[16px] border border-[#ffffff3d] bg-[#09090ba3] text-white backdrop-blur-[16px]">
      <IconGlobeLarge size={24} />
    </span>
  )
}

/** 20px radio. Selected = white ring + a 12px white core, 4px of dark between them. */
function Radio({ on }: { on: boolean }) {
  return on ? (
    <span className="grid h-5 w-5 flex-none place-items-center rounded-full border-[1.5px] border-white" aria-hidden>
      <span className="h-3 w-3 rounded-full bg-white" />
    </span>
  ) : (
    <span className="h-5 w-5 flex-none rounded-full border border-[#ffffff8f]" aria-hidden />
  )
}

/** One plan card. Selection is the whole affordance: 2px bright ring + an 8% fill. */
function PlanCard({
  term, selected, onSelect, title, caption, price, per, footnote, badge,
}: {
  term: Term
  selected: boolean
  onSelect: () => void
  title: Text
  caption: Text
  price: string
  per: Text
  footnote: Text
  badge?: Text
}) {
  const { t } = useT()
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      /* Heights differ by 8px in the mockup (72 selected / 80 not) and so they do
         here — flagged to the designer rather than silently harmonised. */
      className={`relative flex w-full items-center justify-between rounded-[16px] px-5 py-2.5 text-left transition-colors duration-[var(--dur-base)] ease-std ${
        selected
          ? 'h-[72px] border-2 border-[#ffffffb8] bg-[#ffffff14]'
          : 'h-20 border border-[#ffffff3d] hover:bg-[#ffffff08]'
      }`}
      data-term={term}
    >
      <span className="flex min-w-0 items-center gap-4">
        <Radio on={selected} />
        <span className="min-w-0">
          <span className="block text-[16px] font-semibold leading-none text-[#f8f8fa]">{t(title)}</span>
          <span className="mt-[7px] block text-[13px] leading-none text-[#ffffff7a]">{t(caption)}</span>
        </span>
      </span>

      <span className="relative flex flex-none flex-col items-end gap-1.5">
        <span className="flex items-baseline gap-0.5">
          <span className="font-display text-[18px] font-medium leading-none text-[#f8f8fa]">{price}</span>
          <span className="text-[15px] leading-none text-[#ffffff7a]">{t(per)}</span>
        </span>
        <span className="whitespace-nowrap text-right text-[12px] leading-none text-[#ffffff7a]">{t(footnote)}</span>
        {badge && (
          /* Gray-800 under a 25% green wash — flattened, it is #2d4338. It hangs
             OFF the left edge of the price column (right:100% + 7px), not at a
             fixed -70px: the mockup's offset only works for its exact string
             width, and ours changes with the language. */
          <span
            className="absolute right-full mr-[7px] grid h-5 place-items-center whitespace-nowrap rounded-[6px] px-1.5 text-[12px] font-medium text-[#66cc87]"
            style={{ top: 25, background: '#2d4338' }}
          >
            {t(badge)}
          </span>
        )}
      </span>
    </button>
  )
}

/**
 * The Remixer Build chooser — the block that makes the sheet tall.
 *
 * ONE definition, used by every kind that can meet an account without a plan: buying a
 * name, and (since 13.09.2026) connecting one the customer already owns. It was inline in
 * the buy sheet until the connect-owned boards needed the same block; a second copy would
 * have been two places to keep the 72/80px card heights, the badge's offset and the two
 * verified prices in step.
 */
function PlanChooser({ term, setTerm }: { term: Term; setTerm: (t: Term) => void }) {
  const { t } = useT()
  return (
    <div className="rounded-[12px]">
      <div className="flex h-24 items-center gap-4 py-6 pl-4 pr-9">
        <span className="grid h-12 w-12 flex-none place-items-center">
          <span className="grid h-8 w-8 place-items-center rounded-[12px] p-0.5">
            <LogoRemixer size={32} />
          </span>
        </span>
        <p className="font-display text-[18px] font-semibold text-white">
          {t({ en: 'Remixer Build', uk: 'Remixer Build' })}
        </p>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-4">
        <PlanCard
          term="yearly"
          selected={term === 'yearly'}
          onSelect={() => setTerm('yearly')}
          title={{ en: 'Yearly', uk: 'Річний' }}
          caption={{ en: 'Best value', uk: 'Найвигідніше' }}
          price="$9.99"
          per={{ en: '/mo', uk: '/міс' }}
          footnote={{ en: 'billed yearly · $119.88', uk: 'оплата за рік · $119.88' }}
          badge={{ en: 'Save 33%', uk: 'Economія 33%' }}
        />
        <PlanCard
          term="monthly"
          selected={term === 'monthly'}
          onSelect={() => setTerm('monthly')}
          title={{ en: 'Monthly', uk: 'Щомісячний' }}
          caption={{ en: 'Cancel any month', uk: 'Скасувати будь-якого місяця' }}
          price="$14.99"
          per={{ en: '/mo', uk: '/міс' }}
          footnote={{ en: '$9.99 for your first month', uk: '$9.99 за перший місяць' }}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------- connect-owned (㉖A / ㉖B) */

/**
 * The body of the connect sheets — Figma 27071:20574 (㉖A) and 27071:20591 (㉖B),
 * plus the one-line external case off ㉘ A2 (27281:5564).
 *
 * It serves `connect-owned` and `connect-external`, which differ in two places and
 * nowhere else: the sub-label and the verb. (They used to differ in a third — where
 * the button led — until the external one was pointed at the same clock; see THE
 * ORDERING PROBLEM in `confirm`, which is the note to read before any of this moves.)
 * That is a poor reason for a second component and a good reason for two conditionals
 * — especially while the external flow is undesigned and the shape it eventually
 * wants is unknown.
 *
 * Two drawn boards, one difference: whether the domain is already serving a site.
 * That is not a new axis — the world has carried it since the beginning as
 * `inventory: 'dh-in-use'`, and this reads it exactly the way `OwnScreen` in
 * DomainsSurface does. Clean, the block is one row and the button says what it
 * does; in use, the same block grows a caution under a hairline and the verb
 * changes to name the consequence ("Replace and connect"), because a stray click
 * here takes down a site that is live right now.
 *
 * NO PRICE — ever. A domain already in the account costs nothing to attach, so nothing
 * on this sheet carries a figure for the NAME, and nothing about it goes in the cart.
 *
 * BUT THE PLAN GATE STILL APPLIES, and this is the correction of 13.09.2026. The boards
 * live in a Figma section titled «㉖ Connect domain · свой домен на DreamHost · план
 * есть» — PLAN EXISTS. They draw the has-plan case only, which is why there is no plan
 * block on them to copy; it is not evidence that the gate is absent. What is gated is
 * putting the site on a custom domain at all (verified product fact), not the
 * registration — so a free domain on a trial account is still a sale. Reading the boards
 * as "free, therefore ungated" let a trial user reach `domain: 'connecting'` with
 * `account: 'trial'`, a combination `world.violations()` itself declares impossible
 * ("A custom domain needs a paid plan — checkout comes first"). QA reproduced it on
 * `?i=dh-free&a=trial&b=none`.
 *
 * So the sheet has the same two cases the buy sheet has, and gets there with the same
 * block (`PlanChooser`) and the same handoff. The ONE difference from buying, and the
 * whole reason this kind exists: the cart carries the plan and nothing else. The till
 * finishes the job — PanelCart parks the name when the world moves to `checkout` with no
 * registration line in the cart, and spends it after Submit Order as
 * `startConnect(domain, { bought: false })`.
 *
 * The boards are MID-FI (Inter, flat greys, 1px strokes on nested boxes). Structure,
 * geometry and copy come from them; the surface, type scale, hairlines and radii come
 * from the sheet above, so this reads as one more state of it rather than an import.
 * Every stroke is an inset box-shadow: Figma's sit inside the geometry, a CSS `border`
 * would push the 492px content box out to 494.
 */
function ConnectBody({
  domain, inUse, external, showPlans, term, setTerm, onConfirm,
}: {
  domain: string
  inUse: boolean
  /** The domain lives at another company. Everything below has to say so. */
  external: boolean
  showPlans: boolean
  term: Term
  setTerm: (t: Term) => void
  onConfirm: () => void
}) {
  const { t } = useT()
  /* Derived here rather than passed in, exactly as DomainsSurface derives it —
     `registrarOf` is pure data and the fallback matches the demo name that screen
     uses when a domain is not in the taken list. */
  const registrar = registrarOf(domain) ?? 'GoDaddy'
  return (
    /* 24px sides against the 540 sheet is the board's 492 content width exactly;
       the board's own 23/25 asymmetry is mid-fi drift, not a decision. */
    <div className="px-6 pb-6">
      <div className="rounded-[16px] bg-[#ffffff0a] p-[18px] shadow-[inset_0_0_0_1px_#ffffff0a]">
        {/* ------------------------------------------------ the domain itself */}
        <div className="flex items-center gap-4">
          <GlobeTile />
          <div className="min-w-0 flex-1">
            <p className="min-w-0 truncate font-display text-[24px] font-medium leading-[1.2] text-white">
              {domain}
            </p>
            {/* The one line that carries the whole state. With a plan it is a
                promise of speed; without one it names what is standing in the way —
                in cream, because cream is "waiting on you". Neutral grey here would
                read as "nothing blocking", which would be a lie. Same pair of
                strings the sheet has used since the first connect board.

                An EXTERNAL domain gets neither: both describe DreamHost, and this
                name is not at DreamHost. It states the customer's own situation
                instead — whose company holds the name, and that the work happens
                over there (board ㉘ A2, 27281:5564). Deliberately NOT board ㉔'s
                "you'll approve one change there": that board assumes Domain Connect,
                which DreamHost supports in no role, and is annotated obsolete. */}
            {external ? (
              <p className="mt-1 truncate text-[14px] leading-[1.4] text-[#ffffff8f]">
                {t({
                  en: `At ${registrar} · you'll add two records there`,
                  uk: `На ${registrar} · два записи треба додати там`,
                })}
              </p>
            ) : showPlans ? (
              <p className="mt-1 flex items-center gap-0.5 truncate text-[14px] leading-[1.4]">
                <span className="text-[#ffffffa3]">{t({ en: 'On DreamHost', uk: 'На DreamHost' })}</span>
                <span className="mx-0.5 flex-none text-[rgba(255,240,186,0.9)]"><IconLink size={20} /></span>
                <span className="truncate text-[rgba(255,240,186,0.9)]">
                  {t({ en: 'connects as soon as you add a plan', uk: 'підключиться, щойно ви оформите план' })}
                </span>
              </p>
            ) : (
              <p className="mt-1 truncate text-[14px] leading-[1.4] text-[#ffffff8f]">
                {t({ en: 'On DreamHost · connects in a few seconds', uk: 'На DreamHost · підключиться за кілька секунд' })}
              </p>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------- the caution */}
        {inUse && (
          <>
            {/* 456 wide by construction: 492 less the block's own 18px padding. */}
            <div className="mt-[18px] h-px bg-[var(--white-100)]" />
            {/* The module's established caution recipe (--attention at 8% under a
                25% rim), not the board's flat #2a1d07 / #fab040 — the same one
                DomainsSurface draws its in-use guard with. */}
            <div className="mt-4 flex gap-[11px] rounded-[10px] bg-[#e5c35914] px-[15px] py-[13px] shadow-[inset_0_0_0_1px_#e5c35940]">
              <span className="mt-[7px] h-[9px] w-[9px] flex-none rounded-full bg-[var(--attention)]" aria-hidden />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-[1.35] text-[var(--attention)]">
                  {t({ en: 'This domain currently shows another site', uk: 'На цьому домені зараз інший сайт' })}
                </p>
                {/* The two things a beginner is actually afraid of, answered before
                    they ask. No DNS, no records, no "zone" — house rule. */}
                <p className="mt-1 text-[13px] leading-[1.45] text-[var(--white-400)]">
                  {t({
                    en: 'Your email keeps working · the old site stays on your account',
                    uk: 'Пошта працюватиме як раніше · старий сайт залишиться у вашому акаунті',
                  })}
                </p>
              </div>
            </div>
          </>
        )}

        {/* The plan, folded in under the domain rather than bounced to a pricing
            page — the same disclosure rule the buy sheet follows, and the same
            block. The caution above it stays put: an in-use domain on a trial
            account is still about to replace a live site, and the warning must
            not be the thing that falls out when the sheet grows. */}
        {showPlans && (
          /* Full-bleed, unlike the caution's own 456-wide rule above: this one is a
             SECTION split — the same one the buy sheet draws across its whole body
             card — not a rule between two things inside one block. */
          <div className="-mx-[18px] -mb-[18px] mt-[18px] border-t border-[#ffffff0a]">
            <PlanChooser term={term} setTerm={setTerm} />
          </div>
        )}
      </div>

      {/* Full-width, as drawn: there is exactly one thing to do on this sheet, and
          nothing to weigh it against. 40px is the house button stop (the board's 42
          is not one of them). Without a plan the next step is genuinely the till, so
          the verb says so — the connection itself resumes after Submit Order. */}
      <button
        onClick={onConfirm}
        className="mt-4 h-10 w-full rounded-[10px] bg-[var(--action)] text-[14px] font-semibold leading-none text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
      >
        {showPlans
          ? t({ en: 'Continue to checkout', uk: 'Перейти до оплати' })
          : external
            /* The dictionary's verb for exactly this moment (docs/features/domains/
               copy.md §Check again): "ask us to re-read the situation AT ANOTHER
               COMPANY after the person has said they changed something there". Not
               `Refresh status` — that is us polling our own half of the work, and
               putting it here would imply nothing was ever asked of them. */
            ? t({ en: 'Check again', uk: 'Перевірити ще раз' })
            : inUse
              ? t({ en: 'Replace and connect', uk: 'Замінити й підключити' })
              : t({ en: 'Connect domain', uk: 'Підключити домен' })}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------- sheet */

export function DomainModal() {
  const { world, set } = useWorld()
  const { domainModal, closeDomainModal, closeSurface, openPanel } = useUI()
  const { t } = useT()
  const [term, setTerm] = useState<Term>('yearly')

  const open = domainModal !== null
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDomainModal() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closeDomainModal])

  const paid = hasPlan(world)
  const buying = domainModal?.kind === 'buy'
  /** The free path: a domain already in this customer's DreamHost account (㉖A/㉖B). */
  const owned = domainModal?.kind === 'connect-owned'
  /* A domain held at another company. ITERATION 2 — the flow is not built and is not
     being built here. This kind reached the sheet on 13.09.2026 so that going live
     would pass the same plan gate as every other door (ExternalScreen used to call
     `startConnect` itself, which put a custom domain live on an account with no plan).
     It renders the same body as `owned` with three substitutions — sub-label, verb,
     destination — because the alternative was a second body for a path nobody has
     designed yet. */
  const external = domainModal?.kind === 'connect-external'
  /* Which of the two boards. Not a new axis: `dh-in-use` is the world's own word for
     "this customer's domain currently serves another site" — the same read
     DomainsSurface's OwnScreen makes. */
  const inUse = world.inventory === 'dh-in-use'
  const domain = domainModal?.domain ?? ''
  const tld = domain.includes('.') ? domain.slice(domain.lastIndexOf('.')) : '.com'
  const price = priceFor(tld) ?? priceFor('.com')!

  /* The plan chooser is what makes the sheet tall, and it is present exactly when the
     account cannot go live yet — on EVERY kind, connect-owned included. It briefly was
     not (13.09.2026): attaching a domain you already own is free, so the gate looked
     like it did not apply. It does. The plan buys the right to put the site on a custom
     domain at all; the registration is a separate purchase that this kind simply does
     not make. Dropping it let a trial account reach `domain: 'connecting'`, which
     `world.violations()` lists as impossible. */
  const showPlans = !paid

  /* The header names what the SHEET is, which is not always "connect": on the buy kind
     the customer is acquiring a name they do not have yet, and the CTA below already
     says "Continue to checkout". A sheet titled "Connect domain" over that pair told
     them they were doing something else (QA, 13.09.2026). The verb is the one the
     dashboard uses to get here — Buy for a new name, Connect for one you own (see
     docs/features/domains/README.md §5; the audit glossary's "Add" is an open question
     against these mockups, not a decision, so this follows the mockups). */
  const heading: Text = buying
    ? { en: 'Buy domain', uk: 'Купити домен' }
    : { en: 'Connect domain', uk: 'Підключити домен' }

  /*
   * What actually happens when this button is pressed.
   *
   * Anything with a price on it leaves Remixer: the panel's cart owns checkout
   * (panel.dreamhost.com/?tree=checkout.dashboard), so we fill that cart and hand the
   * user over — see modules/panel/PanelCart.tsx. This used to flip the account to
   * paid on the spot, which made the demo shorter than the product and hid the one
   * seam most worth arguing about.
   *
   * Connecting a domain the customer already owns on a plan they already have is the
   * one case with nothing to buy; that still completes in place, as before.
   */
  const confirm = () => {
    /* A domain already in the account, on an account that can already go live: the one
       path with nothing at all to pay for. Straight to the clock. `bought: false` tells
       connect.ts this name was not registered through us just now, so it does not start
       the 15-day ICANN verification clock — that belongs to a registration, not an attach.

       WITHOUT a plan this falls through to the cart below, and the cart carries the PLAN
       ONLY. The name is not a line item because it is not for sale; PanelCart parks it on
       the `domain: 'checkout'` transition (which is why that write happens below while
       this sheet is still mounted) and spends it after Submit Order with the same
       `{ bought: false }`. */
    if (owned && !showPlans) {
      closeDomainModal()
      closeSurface()
      startConnect(domain, { bought: false })
      return
    }

    /*
     * ⚠️ THE ORDERING PROBLEM — read this before moving this sheet. ⚠️
     *
     * Where this sheet sits in the external flow is not settled, and the two answers
     * want OPPOSITE behaviour from this branch.
     *
     * Board ㉘ puts the sheet BEFORE the records screen: the customer says "connect my
     * GoDaddy domain", the sheet appears, and only afterwards are they shown the two
     * records to paste. Our wiring puts it AFTER — the control that opens it is
     * `I've added them — check now`, at the bottom of ExternalScreen, pressed by
     * somebody who has already been shown the records and is telling us they pasted
     * them. Checking, at that moment, is the honest act, and it is the self-attestation
     * every platform in the field uses; so this branch starts the clock, exactly as the
     * owned case does. `bought: false` — nothing was registered here.
     *
     * IF SOMEBODY MOVES THIS SHEET TO ㉘'s ORDERING, TWO THINGS BREAK, NOT ONE:
     *
     *  1. This branch. Starting a connect clock for a domain still parked at GoDaddy,
     *     before its records have even been shown, is a lie — the verb would have to go
     *     back to showing instructions (`goDomains('external', domain)`).
     *  2. THE NO-PLAN BRANCH BELOW, WHICH IS THE ONE EASY TO MISS. It hands off to the
     *     till, and PanelCart's parking is GENERIC: it parks any sheet-opened domain
     *     whose cart carries no registration line, then connects it the moment the order
     *     is submitted (PanelCart.tsx :433-438 and :501-528). Today that is right, because
     *     the records were pasted before the sheet ever opened. In ㉘'s ordering it would
     *     connect a domain whose records the customer has never seen — paying for a plan
     *     would silently start a clock on work nobody has done. PanelCart would have to
     *     learn the difference between "owned, connect now" and "external, show the
     *     records first"; it cannot infer it from the cart, because in both cases the
     *     cart holds the plan and nothing else.
     *
     * That second one is a PanelCart change, in a file this sheet does not own.
     *
     * So: this branch is byte-identical to the owned one above and MUST NOT be merged
     * with it. They agree by coincidence of today's wiring, not by nature — the seam is
     * the whole point, and collapsing it is how the divergence above gets lost.
     */
    if (external && !showPlans) {
      closeDomainModal()
      closeSurface()
      startConnect(domain, { bought: false })
      return
    }

    const lines: CartLine[] = []
    if (buying) lines.push({ kind: 'domreg', domain, years: 1 })
    if (showPlans) lines.push({ kind: 'remixer', term })

    if (lines.length === 0) {
      // Nothing to pay for: no cart, straight to connecting — and the Publish panel,
      // which is where every state of that connection is read.
      closeDomainModal()
      closeSurface()
      startConnect(domain)
      return
    }

    /* `checkout` is the world's word for "standing at the till" — the state the domain
       axis has carried since the beginning and nothing rendered until now.

       The domains screen underneath is left exactly as it was: walking out of the
       cart without paying has to land the customer back on the list they were
       browsing, not on a status page for a domain they did not buy. The status
       screen comes later, from the panel, once the order is actually placed. */
    set({ cart: lines, domain: 'checkout' })
    closeDomainModal()
    openPanel('cart')
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center" role="dialog" aria-modal="true" aria-label={t(heading)}>
          {/* 70% black, no blur — it covers the chat and the rail, not just the canvas */}
          <motion.div
            variants={modalScrim}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={closeDomainModal}
            className="absolute inset-0 bg-[rgba(0,0,0,0.7)]"
          />

          <motion.div
            variants={modalSheet}
            initial="initial"
            animate="animate"
            exit="exit"
            /* Centred, nudged 4px up — the mockup pins it there on both boards. */
            /* 600 with the plan chooser, 560 without — as drawn on 27254/27275.
               The buy sheet was widened to 600 for a while because its row runs
               a price AND a renewal note beside the sub-label and the line
               clipped; that was the system fallback face being ~10% wider than
               Proxima Nova, and it went away once real webfonts shipped. */
            /* 540 on the connect-owned boards — the narrowest of the three, which is
               right: with a plan in hand it is the only sheet with nothing to weigh up.
               Without one it takes the same 600 every plan-bearing sheet takes, because
               it is carrying the same cards. */
            className={`relative -translate-y-1 rounded-[24px] border border-[#ffffff0a] bg-[var(--gray-850)] ${
              showPlans ? 'w-[600px]' : owned || external ? 'w-[540px]' : 'w-[560px]'
            }`}
            style={{ boxShadow: '0px 24px 28px rgba(0,0,0,0.33)' }}
          >
            {/* ------------------------------------------------- header, 64px */}
            <div className="flex h-16 items-center justify-between pl-6 pr-4">
              <h3 className="whitespace-nowrap pt-0.5 font-display text-[18px] font-semibold leading-[1.2] text-white">
                {t(heading)}
              </h3>
              <CloseButton onClick={closeDomainModal} label={t({ en: 'Close', uk: 'Закрити' })} />
            </div>

            {/* The connect-owned sheet is its own body end to end — the ㉖ boards' item
                block, the in-use caution, and (without a plan) the shared chooser. */}
            {(owned || external) && (
              <ConnectBody
                domain={domain}
                inUse={inUse}
                external={external}
                showPlans={showPlans}
                term={term}
                setTerm={setTerm}
                onConfirm={confirm}
              />
            )}

            {/* --------------------------------------------------- body card */}
            {!owned && !external && (
            <div className="px-1.5">
              <div className="rounded-[16px] border border-[#ffffff0a] bg-[#ffffff0a]">
                {/* -------------------------------------------- domain row */}
                <div
                  className={`flex py-6 pl-4 pr-6 ${
                    showPlans ? 'items-start gap-3 border-b border-[#ffffff0a]' : 'items-center gap-4'
                  }`}
                >
                  {/* top-aligned rows drop the tile 8px so it lines up with the 24px name */}
                  <span className={showPlans ? 'pt-2' : undefined}>
                    <GlobeTile />
                  </span>

                  <div className="min-w-0 flex-1 pb-0.5">
                    {/* name — and, in the lean sheet, the price on the same baseline */}
                    <div className="flex h-[34px] items-baseline justify-between gap-4">
                      <p className="min-w-0 truncate font-display text-[24px] font-medium leading-[1.2] text-white">
                        {domain}
                      </p>
                      {buying && !showPlans && (
                        <p className="flex-none font-display text-[18px] font-medium leading-none text-[#f5f5fa]">
                          ${price.register.toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* sub-label — the one line that carries the whole state */}
                    <div className="flex h-5 items-baseline justify-between gap-4 pr-0.5">
                      {buying ? (
                        <p className="truncate text-[14px] leading-[1.4] text-[#ffffff8f]">
                          {t({ en: 'Connects automatically after checkout', uk: 'Підключиться автоматично після оплати' })}
                        </p>
                      ) : showPlans ? (
                        /* cream = "waiting on you". Neutral grey would read as
                           "nothing blocking", which would be a lie here. */
                        <p className="flex items-center gap-0.5 truncate text-[14px] leading-[1.4]">
                          <span className="text-[#ffffffa3]">{t({ en: 'On DreamHost', uk: 'На DreamHost' })}</span>
                          <span className="mx-0.5 flex-none text-[rgba(255,240,186,0.9)]"><IconLink size={20} /></span>
                          <span className="text-[rgba(255,240,186,0.9)]">
                            {t({ en: 'connects as soon as you add a plan', uk: 'підключиться, щойно ви оформите план' })}
                          </span>
                        </p>
                      ) : (
                        <p className="truncate text-[14px] leading-[1.4] text-[#ffffff8f]">
                          {t({ en: 'On DreamHost · connects in a few seconds', uk: 'На DreamHost · підключиться за кілька секунд' })}
                        </p>
                      )}

                      {buying && !showPlans && (
                        <p className="flex-none whitespace-nowrap text-[13px] leading-none text-[#ffffff7a]">
                          {t({ en: 'auto-renews at ', uk: 'автопродовження ' })}
                          <span className="font-display font-medium">${price.renew.toFixed(2)}</span>
                          {t({ en: '/yr', uk: '/рік' })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* the tall sheet parks the price in its own right-hand column */}
                  {buying && showPlans && (
                    <div className="flex w-[137px] flex-none flex-col items-end justify-center gap-1.5 self-stretch pt-0.5">
                      <p className="font-display text-[18px] font-medium leading-none text-[#f5f5fa]">
                        ${price.register.toFixed(2)}
                      </p>
                      <p className="whitespace-nowrap text-[13px] leading-none text-[#ffffff7a]">
                        {t({ en: 'auto-renews at ', uk: 'автопродовження ' })}
                        <span className="font-display font-medium">${price.renew.toFixed(2)}</span>
                        {t({ en: '/yr', uk: '/рік' })}
                      </p>
                    </div>
                  )}
                </div>

                {/* ------------------------------------------- plan chooser */}
                {showPlans && <PlanChooser term={term} setTerm={setTerm} />}
              </div>
            </div>
            )}

            {/* ----------------------------------------------- button bar, 72 */}
            {!owned && !external && (
            <div className="flex items-center justify-end py-4 pl-4 pr-[18px]">
              <button
                onClick={confirm}
                className="h-10 rounded-[10px] bg-[var(--action)] px-5 text-[14px] font-semibold leading-none text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
              >
                {showPlans || buying
                  ? t({ en: 'Continue to checkout', uk: 'Перейти до оплати' })
                  : t({ en: 'Connect domain', uk: 'Підключити домен' })}
              </button>
            </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
