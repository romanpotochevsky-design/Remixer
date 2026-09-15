/**
 * The checkout sheet — Figma 27112:11792 · 27275:34146 · 27275:35672 (the hi-fi set of
 * 14.09.2026, which supersedes 27058:100133 · 27254:11737 · 27275:33023 for every metric),
 * plus the connect-owned sheet — Figma 27071:20574 (㉖A) · 27071:20591 (㉖B), which are
 * mid-fi and now contribute COPY AND CASES ONLY, never a number.
 *
 * ⚠️ ALL THREE HI-FI BOARDS DRAW ONE CHASSIS, and everything below is a reading of it:
 * 600×516 with the plan chooser, 560×232 without, header 64 (pl 24 / pr 16), body inset 6,
 * one card at radius 16 with no padding of its own, a 72px Button Bar with the button
 * right-aligned at pl 16 / pr 18. The connect kinds had their own second body until
 * 14.09.2026 and it had drifted off all of that — see ONE BODY, EVERY KIND in the render.
 *
 * Three boards, six drawn states, ONE component. What the boards actually vary is
 * two independent axes, so that is how this is built:
 *
 *   axis 1 — WHAT is being done
 *     connect-owned    : a domain already sitting in this customer's DreamHost
 *                        account. Iteration 1 ships exactly two paths and this is
 *                        the second one. It carries NO PRICE — the name is free to
 *                        attach and never enters the cart — but it runs axis 2 like
 *                        every other kind; the ㉖ boards draw the has-plan case only,
 *                        which is why no plan block appears on them to copy.
 *     connect-existing : the older sheet for that same case, drawn before the ㉖
 *                        boards existed. Superseded by connect-owned, and with its
 *                        last caller gone it is now unreachable.
 *     connect-external : a domain held at another company. ITERATION 2 — the flow is
 *                        not built. It borrows `SubLabel` for one honest line and
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
 *     yes : the lean sheet — 560×232 (27275:35672). One row, one button. NOT 540: that
 *           was read off the mid-fi ㉖ boards and is the one width no hi-fi board draws.
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
import { domainAmount, termYears, tldOf, type CartLine } from '@/data/cart'
import { LogoRemixer, IconCloseM, IconGlobeLarge, IconLink } from '@/ui/icons'
import { modalScrim, modalSheet } from '@/ui/motion'

/** The two ways to pay for the plan, priced off the verified product facts. */
type Term = 'yearly' | 'monthly'

/**
 * "2 роки" / "5 років" — agreement for the term line below.
 *
 * ⚠️ A SECOND COPY of the rule in data/domains.ts (`ukYears`, which generates the
 * search row's note). It is duplicated rather than imported because that helper is
 * module-private there; exporting it is the right fix and belongs to that file's
 * owner. Both are generated from `n`, so neither can drift into a wrong number —
 * only into a different wording, and there is one wording here.
 */
const ukYears = (n: number) => {
  const one = n % 10
  const teen = n % 100 >= 11 && n % 100 <= 14
  if (!teen && one === 1) return 'рік'
  if (!teen && one >= 2 && one <= 4) return 'роки'
  return 'років'
}

/**
 * "for 2 years" — the term the figure beside it covers, or null when it covers one.
 *
 * Null is the whole of the normal case: nine of the ten verified endings have no
 * minimum, so nothing renders and their sheets are the sheets they were.
 */
const termCovered = (years: number): Text | null =>
  years > 1 ? { en: `for ${years} years`, uk: `на ${years} ${ukYears(years)}` } : null

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
      {/* The DS glyph at the frame's own 24 — see `IconCloseM` for why this is not
          `IconClose` at some size. The ink is 9.018 square inside that 24, which is what
          the board draws and what `IconClose` at 9 was 13% short of. */}
      <IconCloseM size={24} />
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
  term, selected, onSelect, title, caption, price, per, footnote, badgeWord, badgeFigure,
}: {
  term: Term
  selected: boolean
  onSelect: () => void
  title: Text
  caption: Text
  price: string
  per: Text
  footnote: Text
  /* The badge arrives in two runs because the board sets it in two faces — see the label. */
  badgeWord?: Text
  badgeFigure?: Text
}) {
  const { t } = useT()
  /* Which of the two the board drew in the lighter grey — the yearly one. Read off `term`
     rather than `selected`, for the reason the caption below spells out. */
  const selectedTone = term === 'yearly'
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      /* Heights differ by 8px in the mockup (72 selected / 80 not) and so they do
         here — flagged to the designer rather than silently harmonised. */
      /* ⚠️ THE RINGS ARE INSET SHADOWS, NOT `border`s, and the reason is the radio. Figma's
         strokes sit inside the geometry, so the board's 20px padding is measured from the
         card's outer edge and the radio lands at x=20 (27275:34290). Tailwind's border-box
         keeps the card 72 tall either way, but padding starts INSIDE a CSS border — so the
         2px selected ring pushed the whole content in and the radio sat at 22. One
         measurable pixel-pair per card, and it moved every number to its right with it. */
      className={`relative flex w-full items-center justify-between rounded-[16px] px-5 py-2.5 text-left transition-colors duration-[var(--dur-base)] ease-std ${
        selected
          ? 'h-[72px] bg-[#ffffff14] shadow-[inset_0_0_0_2px_#ffffffb8]'
          : 'h-20 shadow-[inset_0_0_0_1px_#ffffff3d] hover:bg-[#ffffff08]'
      }`}
      data-term={term}
    >
      <span className="flex min-w-0 items-center gap-4">
        <Radio on={selected} />
        <span className="min-w-0">
          <span className="block text-[16px] font-semibold leading-none text-[#f8f8fa]">{t(title)}</span>
          {/* ⚠️ THE TWO CARDS DO NOT SHARE THE GREY, AND THE BOARDS ARE EXPLICIT ABOUT IT:
              the yearly card's caption and footnote are Neutral Alpha/500 (48% white) and
              its footnote 12px, the monthly card's are Neutral Alpha/600 (56%) at 13px
              (27112:11946 / 11954 against 11964 / 11972, and the same pair on 27275:34300 /
              34308 against 34318 / 34326). Drawn per PLAN, not per selection state — the
              boards only ever draw Yearly selected, so nothing in them says what Monthly's
              caption does when it is picked, and inventing a rule for that is how the
              72/80 heights above would have been "tidied up". Flagged to the designer as
              probably the same accident as those heights rather than fixed silently. */}
          <span className={`mt-[7px] block text-[13px] leading-none ${selectedTone ? 'text-[#ffffff7a]' : 'text-[#ffffff8f]'}`}>{t(caption)}</span>
        </span>
      </span>

      <span className="relative flex flex-none flex-col items-end gap-1.5">
        <span className="flex items-baseline gap-0.5">
          <span className="font-display text-[18px] font-medium leading-none text-[#f8f8fa]">{price}</span>
          <span className="text-[15px] leading-none text-[#ffffff7a]">{t(per)}</span>
        </span>
        <span className={`whitespace-nowrap text-right leading-none ${selectedTone ? 'text-[12px] text-[#ffffff7a]' : 'text-[13px] text-[#ffffff8f]'}`}>{t(footnote)}</span>
        {badgeWord && badgeFigure && (
          /* Gray-800 under a 25% green wash — flattened, it is #2d4338. It hangs
             OFF the left edge of the price column (right:100% + 7px), not at a
             fixed -70px: the mockup's offset only works for its exact string
             width, and ours changes with the language. */
          <span
            className="absolute right-full mr-[7px] flex h-5 items-center whitespace-nowrap rounded-[6px] px-1.5 text-[12px] font-medium text-[#66cc87]"
            style={{ top: 25, background: '#2d4338' }}
          >
            {/* ⚠️ THE NUMERALS ARE GILROY, THE WORD IS PROXIMA — the board sets them in two
                faces inside one label (27112:11958: a `ProximaNovaW05-Medium` span for
                "Save" inside a `Gilroy:Medium` text node carrying " 33%"). Which is the
                house rule stated in one label: Gilroy carries names and figures, Proxima
                carries prose. Ours was one Proxima run for both. */}
            <span>{t(badgeWord)}</span>
            <span className="font-display">&nbsp;{t(badgeFigure)}</span>
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
          /* `Економія` with a Cyrillic Е — it was typed with a Latin one, which is
             invisible on screen and breaks search, sorting and any spellcheck. */
          badgeWord={{ en: 'Save', uk: 'Економія' }}
          badgeFigure={{ en: '33%', uk: '33%' }}
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

/* ------------------------------------- the row's one line of state (㉖A / ㉖B / ㉘A2) */

/**
 * THE SUB-LABEL — the single line under the name that carries the whole situation, in the
 * four shapes the boards and the flow between them need.
 *
 * It was the body of a whole second component (`ConnectBody`) until 14.09.2026, which is
 * what let the connect sheets drift into a different CHASSIS from the buy sheet — a card
 * with its own 18px padding, a full-width button and no Button Bar at all, none of which
 * any board draws. The line itself is the only thing those boards actually said
 * differently, so the line is all that is left of them.
 *
 * ⚠️ THE GREY IS THE SHEET'S, NOT THE SENTENCE'S. The wide boards set this line in
 * Neutral Alpha/700 (64% white — 27112:11867, 27275:34221) and the narrow one sets the
 * very same string in /600 (56% — 27275:35746). Read per SHEET, since that is the only
 * thing that varies between the three, and flagged to the designer as likely drift rather
 * than harmonised on our own.
 */
function SubLabel({
  domain, buying, external, inUse, wide,
}: {
  domain: string
  buying: boolean
  /** The domain lives at another company. Everything here has to say so. */
  external: boolean
  inUse: boolean
  /** The 600 sheet — the one with the plan chooser. Decides the grey; see above. */
  wide: boolean
}) {
  const { t } = useT()
  const tone = wide ? 'text-[#ffffffa3]' : 'text-[#ffffff8f]'
  /*
   * Derived here rather than passed in, exactly as DomainsSurface derives it —
   * `registrarOf` is pure data.
   *
   * ⚠️ AND IT NAMES NOBODY WE CANNOT NAME. This read `registrarOf(domain) ?? 'GoDaddy'`
   * until 14.09.2026, which told a customer whose registrar we do not know that their name
   * is held at GoDaddy — an invented claim about a real company, said out loud on screen.
   * The same fabrication was removed the same night from the two screens on either side of
   * this sheet (DomainsSurface's taken card and ExternalScreen); this copy survived only
   * because it is unreachable today — the external sheet is opened from a taken card, and
   * a row may only be marked taken where the data says who holds it (data/domains.ts rule
   * 3). Unreachable is exactly how an invented registrar gets to outlive the ones that
   * were caught.
   *
   * `another provider` is ExternalScreen's own degradation, word for word — the wording
   * states.md prescribes for `{registrar}` when the registry does not show one. The
   * Ukrainian differs from that screen's only in case: this sentence's preposition takes
   * the locative ("На іншому провайдері"), that one's an object.
   */
  const where = registrarOf(domain) ?? t({ en: 'another provider', uk: 'іншому провайдері' })

  /* A name held somewhere else: both DreamHost sentences below are false of it, so it
     states the customer's own situation instead — whose company holds the name, and that
     the work happens over there (board ㉘ A2, 27281:5564). Deliberately NOT board ㉔'s
     "you'll approve one change there": that board assumes Domain Connect, which DreamHost
     supports in no role, and is annotated obsolete. */
  if (external) {
    return (
      <p className={`truncate text-[14px] leading-[1.4] ${tone}`}>
        {t({
          en: `At ${where} · you'll add two records there`,
          uk: `На ${where} · два записи треба додати там`,
        })}
      </p>
    )
  }

  /* A name being bought: nothing is owed by the customer and nothing is owed to another
     company, so the line is a plain statement of what happens next (27275:34221). */
  if (buying) {
    return (
      <p className={`truncate text-[14px] leading-[1.4] ${tone}`}>
        {t({ en: 'Connects automatically after checkout', uk: 'Підключиться автоматично після оплати' })}
      </p>
    )
  }

  /* Their own name, and the plan is what stands between it and the site — board A
     (27112:11866). In cream, because cream is "waiting on you"; neutral grey here would
     read as "nothing blocking", which would be a lie. */
  if (wide) {
    return (
      /* ⚠️ 2px EACH SIDE OF THE GLYPH, NOT 4. Board A spaces the three parts by the row's
         own 2px gap and nothing else — "On DreamHost" ends at 92, the 20px glyph starts at
         94, the cream half at 116 (27112:11866/11868/11870). The glyph span also carried
         `mx-0.5`, which doubled it and pushed the cream sentence 4px right. */
      <p className="flex items-center gap-0.5 truncate text-[14px] leading-[1.4]">
        <span className="text-[#ffffffa3]">{t({ en: 'On DreamHost', uk: 'На DreamHost' })}</span>
        <span className="flex-none text-[rgba(255,240,186,0.9)]"><IconLink size={20} /></span>
        <span className="truncate text-[rgba(255,240,186,0.9)]">
          {t({ en: 'connects as soon as you add a plan', uk: 'підключиться, щойно ви оформите план' })}
        </span>
      </p>
    )
  }

  /*
   * ⚠️ THE BOARD SAYS SECONDS. WE DO NOT — flagged to the designer.
   *
   * 27071:20574 reads "On DreamHost · connects in a few seconds", and the panel this sheet
   * hands the customer to thirty seconds later reads "Usually quick, sometimes a few
   * hours" (PublishPanel, states.md variant A). Two promises about one event, and the
   * sheet's is the one the product cannot keep: a domain parked at DNS Only has never
   * resolved to anything, so resolvers are holding the answer "there is nothing here"
   * under the zone's SOA MINIMUM — 14400s, four hours. DreamHost's five-minute TTL governs
   * UPDATING a record that already answers and does nothing here, and a
   * registered-and-parked name is exactly what customers connect. So "seconds" is not
   * merely optimistic, it is false in the common case. (Mechanism: connect.ts:19-31 and
   * the domain-connect research.)
   *
   * What survives is the better half, and it is a fact rather than a forecast: DreamHost's
   * own KB says a domain registered with them already carries every record it needs, root
   * and www alike. Nothing to paste, nothing to change at another company — the product's
   * real advantage, and it does not depend on a clock. The timing belongs to the panel,
   * which is where the connecting state is actually read and which says it in the
   * researched shape: a window and a check, never a moment.
   *
   * ⚠️ …AND THE SECOND HALF COMES OFF WHEN THE DOMAIN IS IN USE (14.09.2026). "Nothing to
   * change anywhere else" is a statement about OTHER COMPANIES — no registrar to visit,
   * nothing to paste — and on a clean domain that is the whole story. On ㉖B it lands
   * directly above a caution saying this domain currently shows another site, and the pair
   * reads as a contradiction: something on the customer's own account IS about to change,
   * which is exactly why that caution is there and why the button below it says "Replace
   * and connect". The caution already carries the truth in full, so the fix is to say LESS
   * rather than add a claim — the location alone, which is the half that holds on both
   * boards.
   */
  return (
    <p className={`truncate text-[14px] leading-[1.4] ${tone}`}>
      {inUse
        ? t({ en: 'On DreamHost', uk: 'На DreamHost' })
        : t({
          en: 'On DreamHost · nothing to change anywhere else',
          uk: 'На DreamHost · нічого не треба змінювати деінде',
        })}
    </p>
  )
}

/**
 * The caution for a domain that is serving a site right now (board ㉖B) — a stray click
 * here takes down something that is live.
 *
 * ⚠️ NO BOARD OF 14.09.2026 DRAWS IT, and that is not permission to drop it: ㉖B does, and
 * the three new boards simply never staged an in-use name. So it keeps the module's own
 * caution recipe (`--attention` at 8% under a 25% rim — the same one DomainsSurface draws
 * its in-use guard with, not the board's flat #2a1d07 / #fab040) and takes the card's own
 * 16px gutter, which is the only geometry the new chassis can lend it. Raised to the
 * designer as a block with no board rather than styled from guesswork.
 */
function InUseCaution() {
  const { t } = useT()
  return (
    <div className="px-4 pb-4">
      <div className="flex gap-[11px] rounded-[10px] bg-[#e5c35914] px-[15px] py-[13px] shadow-[inset_0_0_0_1px_#e5c35940]">
        <span className="mt-[7px] h-[9px] w-[9px] flex-none rounded-full bg-[var(--attention)]" aria-hidden />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-[1.35] text-[var(--attention)]">
            {t({ en: 'This domain currently shows another site', uk: 'На цьому домені зараз інший сайт' })}
          </p>
          {/* The two things a beginner is actually afraid of, answered before they ask.
              No DNS, no records, no "zone" — house rule. */}
          <p className="mt-1 text-[13px] leading-[1.45] text-[var(--white-400)]">
            {t({
              en: 'Your email keeps working · the old site stays on your account',
              uk: 'Пошта працюватиме як раніше · старий сайт залишиться у вашому акаунті',
            })}
          </p>
        </div>
      </div>
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
  /*
   * THE FIGURE ON THIS SHEET IS THE ONE THE CART IS ABOUT TO CHARGE, AND IT IS
   * COMPUTED BY THE CART'S OWN ARITHMETIC.
   *
   * `.ai` is sold in two-year blocks (TLD_PRICES `minYears`, verified — a one-year
   * `.ai` is an order DreamHost cannot place), and the search row a click earlier
   * prints "2-year minimum". This sheet used to read `$89.99 · auto-renews at
   * $89.99`, which is the shape of an ordinary one-year registration: it named a
   * price nobody is charged, over a term nobody is sold, between two screens that
   * both said otherwise — the cart one click later reads 2 Years / $179.98.
   *
   * So every number below comes from data/cart.ts, the module the cart itself
   * reads: `tldOf` for the ending (multi-label aware, so `.co.uk` is not priced off
   * `.uk`), `termYears` for the shortest term the registry will sell, `domainAmount`
   * for the sum over it (first year at the promo price, the rest at renewal — the
   * panel's own formula). Recomputing any of that here is how the two screens got
   * out of step in the first place.
   */
  const tld = tldOf(domain)
  const price = priceFor(tld) ?? priceFor('.com')!
  /* One for every normal ending; more only where the registry says so. */
  const years = termYears(tld)
  const amount = domainAmount(tld, years)
  const covers = termCovered(years)

  /* The plan chooser is what makes the sheet tall, and it is present exactly when the
     account cannot go live yet — on EVERY kind, connect-owned included. It briefly was
     not (13.09.2026): attaching a domain you already own is free, so the gate looked
     like it did not apply. It does. The plan buys the right to put the site on a custom
     domain at all; the registration is a separate purchase that this kind simply does
     not make. Dropping it let a trial account reach `domain: 'connecting'`, which
     `world.violations()` lists as impossible. */
  const showPlans = !paid

  /*
   * WHETHER A FIGURE RIDES IN THE ROW — and the answer is "only a purchase".
   *
   * A domain already in the customer's DreamHost account costs nothing to attach, so
   * nothing on those sheets carries a figure for the NAME and nothing about it goes in the
   * cart; a name held at another company is not for sale by us either. Which is why this
   * is `buying` and not `!showPlans`: the price and the plan are two independent questions,
   * and the boards answer them separately — 27275:35672 is a narrow sheet WITH a figure,
   * 27112:11792 a wide one WITHOUT.
   *
   * It also decides two of the row's own numbers, because the boards make the figure pay
   * for its own space: gap 16 and a right padding of 24 where a price column stands
   * (27275:34185 / 35710), gap 12 and 16 where none does (27112:11831).
   */
  const withPrice = buying

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
    /* `years`, not 1. The cart clamps a short term to the registry's minimum on
       arrival (data/cart.ts, `termYears`) and would have corrected this, but a sheet
       that has just printed a two-year total has no business asserting one year on
       its way out — and the correction would be invisible to the next caller that
       reads this line back. */
    if (buying) lines.push({ kind: 'domreg', domain, years })
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
            /*
             * ⚠️ CENTRED AND NUDGED 4px UP, WHICH IS MEASURED AND NOT A FEELING. All three
             * boards of 14.09.2026 pin the sheet in a 1166-tall frame with 4px more air
             * under it than over it: 27112:11792 and 27275:34146 at y=321 with h=516
             * (321 over, 329 under), 27275:35672 at y=463 with h=232 (463 / 471). Two
             * different sheet heights, the same 4px — so it is the offset, not a rounding.
             *
             * ⚠️ TWO WIDTHS, AND 540 IS NOT ONE OF THEM. 600 with the plan chooser
             * (27112:11792 and 27275:34146, both 600×516), 560 without (27275:35672,
             * 560×232). The connect sheets used to take 540 off the mid-fi ㉖ boards, which
             * is the one number none of the hi-fi ones draws.
             *
             * ⚠️ AND THE HAIRLINE IS AN INSET SHADOW, NOT A `border`. Figma's strokes sit
             * INSIDE the geometry; a CSS border sits outside the content box, so a 600 sheet
             * with `border` hands its body 598 and the card lands on 586 where every board
             * says 588. Measured in the browser before and after — this is the same lesson
             * the nested boxes in this file already carry, applied to the sheet itself.
             *
             * ⚠️ THE DROP SHADOW'S ALPHA IS THE ONE NUMBER THE BOARDS DISAGREE ON: 20% black
             * on 27112:11792 and 27275:34146, 33% on 27275:35672. One component, two values,
             * so it reads as drift rather than a decision about sheet size — the deeper of
             * the two is kept (it is what shipped) and the choice is the designer's.
             */
            className={`relative -translate-y-1 rounded-[24px] bg-[var(--gray-850)] ${
              showPlans ? 'w-[600px]' : 'w-[560px]'
            }`}
            style={{ boxShadow: 'inset 0 0 0 1px #ffffff0a, 0px 24px 28px rgba(0,0,0,0.33)' }}
          >
            {/* ------------------------------------------------- header, 64px */}
            <div className="flex h-16 items-center justify-between pl-6 pr-4">
              <h3 className="whitespace-nowrap pt-0.5 font-display text-[18px] font-semibold leading-[1.2] text-white">
                {t(heading)}
              </h3>
              <CloseButton onClick={closeDomainModal} label={t({ en: 'Close', uk: 'Закрити' })} />
            </div>

            {/*
              * ───────────────────────── ONE BODY, EVERY KIND ─────────────────────────
              *
              * Figma 27112:11792 (a name they already own, no plan — 600×516),
              * 27275:34146 (a name with a price, no plan — 600×516) and
              * 27275:35672 (a name with a price, plan in hand — 560×232).
              *
              * THE THREE BOARDS ARE ONE COMPONENT, and that is the correction of
              * 14.09.2026. The connect kinds used to render a second body of their own
              * (`ConnectBody`) which had drifted into a different chassis entirely: a card
              * carrying its own 18px padding, a button stretched across the full width, and
              * no Button Bar at all. Every board draws the same frame instead — header 64,
              * body inset 6, one card with NO padding of its own, and a 72px Button Bar
              * with the button right-aligned in it — so the differences between the kinds
              * are what they always were: one line of prose, one verb, and whether a figure
              * rides along.
              *
              * What the boards vary, and therefore what is read off a flag here:
              *
              *   the plan chooser   `showPlans` — and with it the sheet's whole size: 600
              *                      and a 104-tall row set from the top, against 560 and a
              *                      96-tall row set on the centre line.
              *   the price          `buying` — and WHERE it goes is structural, not a
              *                      variant: its own 137-wide column on the wide sheet
              *                      (27275:36364), inline on the two baselines on the
              *                      narrow one (27335:13349 / 13347).
              *   the gap and the right padding  16/24 when a figure is present
              *                      (27275:34185, 27275:35710), 12/16 when it is not
              *                      (27112:11831). Both are the boards' own numbers.
              */}
            <div className="px-1.5">
              {/* ⚠️ The card's stroke is an INSET shadow for the same reason the sheet's is
                  (see the sheet): with a `border` the row inside came out 586 where all
                  three boards draw 588. */}
              <div className="rounded-[16px] bg-[#ffffff0a] shadow-[inset_0_0_0_1px_#ffffff0a]">
                {/* ------------------------------------ the domain, and its caution
                    One section, because the hairline belongs UNDER both: it is the split
                    between "the name" and "the plan", and on ㉖B the caution is part of
                    what there is to say about the name. It is an inset shadow rather than
                    `border-b` so that it sits inside the row's 104, as Figma's strokes do,
                    instead of making it 105. */}
                <div className={showPlans ? 'shadow-[inset_0_-1px_0_#ffffff0a]' : undefined}>
                  <div
                    className={`flex pl-4 ${withPrice ? 'gap-4 pr-6' : 'gap-3 pr-4'} ${
                      showPlans ? 'items-start py-6' : 'h-24 items-center'
                    }`}
                  >
                    {/* The wide boards drop the tile 8px so it lines up with the 24px name
                        (27112:11832 and 27275:34186 are 48×56 boxes holding a 48 tile);
                        the narrow one centres tile and text on one line instead. */}
                    <span className={showPlans ? 'pt-2' : undefined}>
                      <GlobeTile />
                    </span>

                    {/* 54 tall on the wide boards (34 + 20), 56 on the narrow one, which
                        carries 2px under the label — 27275:35728 against 27275:34203. */}
                    <div className={`min-w-0 flex-1 ${showPlans ? '' : 'pb-0.5'}`}>
                      {/* name — and, on the narrow sheet, the figure on its baseline.
                          ⚠️ TWO LEVELS, AS DRAWN. All three boards put a 29-tall baseline
                          group inside the 34-tall row and CENTRE it (27112:11851 and
                          27275:34205 at y=2.5, 27275:35730 the same) — flattened into one
                          baseline-aligned row the name rode 2.5px high, which measured as
                          the name's box starting at the row's own top edge. */}
                      <div className="flex h-[34px] items-center">
                        <div className="flex min-w-0 flex-1 items-baseline justify-between gap-4">
                        <p className="min-w-0 truncate font-display text-[24px] font-medium leading-[1.2] text-white">
                          {domain}
                        </p>
                        {withPrice && !showPlans && (
                          /* The figure, and — only where a term longer than a year is
                             being bought — what it covers, sitting on the same baseline in
                             the sub-label's 13px grey. The renewal stays on the line
                             directly below, where it has always been: the renewal figure
                             never travels apart from the figure above it (house rule, and
                             the audit's). */
                          <p className="flex flex-none items-baseline gap-1.5">
                            {/* ⚠️ leading 1.2, NOT `leading-none`. The boards set these runs at
                                Figma's own "normal" — the 18px figure in a 21-tall box, the 13px
                                renewal in a 15-tall one (27275:35730 / 35745, 27275:36364) — and
                                since the row aligns them on the BASELINE, the box height is what
                                decides where the glyphs land: at `leading-none` the figure sat
                                8px under the name's top where the board draws 6, and the wide
                                sheet's price column measured 36 tall against the board's 42. */}
                            <span className="font-display text-[18px] font-medium leading-[1.2] text-[#f5f5fa]">
                              ${amount.toFixed(2)}
                            </span>
                            {covers && (
                              <span className="whitespace-nowrap text-[13px] leading-[1.2] text-[#ffffff7a]">
                                {t(covers)}
                              </span>
                            )}
                          </p>
                        )}
                        </div>
                      </div>

                      {/* the one line that carries the whole state — and, on the narrow
                          sheet, the renewal on its baseline */}
                      <div className="flex h-5 items-baseline justify-between gap-4 pr-0.5">
                        <SubLabel
                          domain={domain}
                          buying={buying}
                          external={external}
                          inUse={inUse}
                          wide={showPlans}
                        />
                        {withPrice && !showPlans && (
                          <p className="flex-none whitespace-nowrap text-[13px] leading-[1.2] text-[#ffffff7a]">
                            {t({ en: 'auto-renews at ', uk: 'автопродовження ' })}
                            <span className="font-display font-medium">${price.renew.toFixed(2)}</span>
                            {t({ en: '/yr', uk: '/рік' })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* the wide sheet parks the figure in its own right-hand column —
                        137 wide, 6 between its lines, 2 of lead (27275:36364) */}
                    {withPrice && showPlans && (
                      <div className="flex w-[137px] flex-none flex-col items-end justify-center gap-1.5 self-stretch pt-0.5">
                        {/* Same pair as the narrow sheet, stacked instead of strung out:
                            this column is 137px and the term will not share a line with
                            the figure inside it. The order is the sentence — what you pay,
                            what it covers, what it renews at. */}
                        <p className="font-display text-[18px] font-medium leading-[1.2] text-[#f5f5fa]">
                          ${amount.toFixed(2)}
                        </p>
                        {covers && (
                          <p className="whitespace-nowrap text-[13px] leading-[1.2] text-[#ffffff7a]">
                            {t(covers)}
                          </p>
                        )}
                        <p className="whitespace-nowrap text-[13px] leading-[1.2] text-[#ffffff7a]">
                          {t({ en: 'auto-renews at ', uk: 'автопродовження ' })}
                          <span className="font-display font-medium">${price.renew.toFixed(2)}</span>
                          {t({ en: '/yr', uk: '/рік' })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* The caution stays put when the sheet grows: an in-use domain on a
                      trial account is still about to replace a live site, and the warning
                      must not be the thing that falls out. */}
                  {inUse && !buying && !external && <InUseCaution />}
                </div>

                {/* ------------------------------------------- plan chooser */}
                {showPlans && <PlanChooser term={term} setTerm={setTerm} />}
              </div>
            </div>

            {/* --------------------------------------------- Button Bar, 72 (27112:12184,
                27275:34538, 27275:35770): 16 of air over and under a 40px button, the
                container 16 in on the left and 18 on the right — not a symmetrical inset,
                and the same asymmetry on all three boards. The button takes its own width
                from its label; the boards draw 175 for "Continue to checkout". */}
            <div className="flex items-center justify-end py-4 pl-4 pr-[18px]">
              <button
                onClick={confirm}
                className="h-10 rounded-[10px] bg-[var(--action)] px-5 text-[14px] font-semibold leading-none text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
              >
                {showPlans || buying
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
