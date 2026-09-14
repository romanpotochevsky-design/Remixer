/**
 * The domains surface — renders in place of the site preview, inside the same shell.
 *
 * One universal field detects intent: buy new · connect one you own · paste an external
 * domain. AI suggestions are the default empty state, not a third path. Every list row
 * routes through a confirm screen — nothing ever auto-connects on a stray click.
 *
 * Grounded in the research, not invented:
 *  - both prices shown (register + renew) — hiding renewal is a dark pattern;
 *  - no premium / "Make an offer" states — DreamHost has no brokerage;
 *  - external domains take the guided-manual path — DreamHost has no Domain Connect
 *    and no Entri today, so one-click is designed as a future state, not promised;
 *  - no DNS jargon on primary paths; the canonical success checklist is fixed.
 */
import { AnimatePresence, motion } from 'motion/react'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useWorld, isCustomDomainActive, type DomainState } from '@/state/world'
import { useUI, type DomainScreen } from '@/state/ui'
import { useT, type Text } from '@/i18n'
import {
  AI_SUGGESTIONS, OWNED_DOMAINS, CUSTOM_DOMAIN, TLD_PRICES, priceFor,
  exactMatch, featuredEndings, popularEndings, nameIdeas, type ResultRow,
  closeAlternatives, takenIdeas, registrarOf, endingNotice, minTermYears,
} from '@/data/domains'
import { domainAmount, money } from '@/data/cart'
import { ScrollArea } from '@/ui/ScrollArea'
import {
  IconSearch, IconArrowRight, IconArrowLeft, IconGlobe, IconClose, IconSparkleAI,
  IconChevronDown,
} from '@/ui/icons'
import { surface, listSwap, listSwapItem } from '@/ui/motion'


/* ------------------------------------------------------------------ shared bits */

/** The content sheet under the top bar — every screen renders inside one. */
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={surface}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-0 flex-1 rounded-t-[8px] border-t border-[var(--white-100)] bg-[var(--gray-900)]"
    >
      <ScrollArea className="h-full">
        <div className="mx-auto w-full max-w-[560px] px-6 py-10">{children}</div>
      </ScrollArea>
    </motion.div>
  )
}

/**
 * The WIDE sheet — the one every answer to a search renders in: the result lists,
 * the taken state (27270:5623) and the "you own this" card (27271:5564). One
 * wrapper for all three so they cannot drift apart in finish, and so they swap
 * with the same conveyor (`listSwap`: the old answer leaves upward, the new one
 * rises from below, section by section).
 *
 * The page pads 32 all round; the column inside is a flat 1200 wide and centred —
 * the padding must sit OUTSIDE the max-width or the column comes out 64px narrow.
 */
function ResultsSheet({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) {
  const { t } = useT()
  return (
    <motion.div
      variants={listSwap}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="min-h-0 flex-1 rounded-t-[8px] border-r border-t border-[#ffffff0a] bg-[var(--gray-900)]">
        <ScrollArea className="h-full">
          <div className="px-8 pb-2 pt-8">
            {/* 8px between blocks: the section titles carry their own 20px of air,
                which is where the rest of the spacing comes from */}
            <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2">
              {/*
               * THE WAY BACK — ours, not drawn on any board, and reported as a defect
               * before it existed: once a search had answered, the dashboard's
               * "Existing domains" column could not be reached again without closing
               * the whole window and reopening it. That hurts the connect-what-you-own
               * path most, since those domains live on the screen you could no longer
               * get to.
               *
               * It sits INSIDE the swapped content on purpose. The search field must
               * not gain a control: `SearchHeader` is mounted once for the life of the
               * window precisely so typing survives every answer, and putting a button
               * in it would be the remount that reads as a page reload.
               * Escape and an empty submit do the same thing (see DomainsSurface).
               */}
              {onBack && (
                <motion.div variants={listSwapItem}>
                  <button
                    onClick={onBack}
                    className="-ml-1 flex h-8 items-center gap-1 rounded-full pl-1.5 pr-3 text-[13px] leading-none text-[var(--white-400)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#ffffff0a] hover:text-[var(--white-700)]"
                  >
                    <span className="grid h-5 w-5 flex-none place-items-center"><IconArrowLeft size={18} /></span>
                    {t({ en: 'All domains', uk: 'Усі домени' })}
                  </button>
                </motion.div>
              )}
              {children}
            </div>
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  )
}

/**
 * The domains this customer already holds — inventory plus whatever is attached to
 * the project right now.
 *
 * Nothing in this set may ever carry a price or a Buy button. Offering somebody
 * their own domain (QA, 13.09.2026: `fit-ration.com` stood in the Existing-domains
 * column with `Connect` AND in the Best-match hero with `Buy $9.99`, and stayed on
 * sale after it went live) is the one mistake on this screen that reads as the
 * product not knowing who the customer is. When one of them turns up in a search it
 * is not a result at all — it is the in-account state (Figma 27271:5564).
 */
function useMyDomains() {
  const { world } = useWorld()
  const inventory = world.inventory
  /* Only a domain that is actually attached counts: `customDomain` keeps its name
     for the panel's sake long before anything is connected. */
  const attached = isCustomDomainActive(world) ? world.customDomain : null
  return useMemo(() => {
    const mine = new Set((OWNED_DOMAINS[inventory] ?? []).map((o) => o.domain))
    if (attached) mine.add(attached)
    return mine
  }, [inventory, attached])
}

/* ------------------------------------------------------------ how wide is a column */

/** The dashboard's two columns are `gap-8` apart — the gap has to come out of the
 *  measurement before it can be divided. */
const COLUMN_GAP = 32
/**
 * Below this, a column cannot carry the drawn single-line row — see `useColumnFit`.
 * 440 sits well clear of both stops we demo on (343 at 1280, 508 at 1600), so the
 * screen never flips shape between a resize and a redraw at either one.
 */
const ROOMY_COLUMN = 440

/**
 * ROOMY OR TIGHT — MEASURED, NOT GUESSED, AND NOT A VIEWPORT BREAKPOINT.
 *
 * The dashboard's row is drawn for a 1200px column: name on the left, price and verb
 * on the right, one line. Inside this shell a column is nothing like 1200 — the chat
 * takes 432, the rail 56 — and at 1280×800, the width tomorrow's projector gives, each
 * column is 343px. The furniture (20px padding · 24 gap · 94 price · 32 gap · 54 verb)
 * eats 244 of it, so the NAME — the product, the thing being sold — gets 80px and
 * truncates to "getfitrati…" while the price beside it stays perfectly legible. Two
 * testers reported it as the first screen of the flow.
 *
 * So below `ROOMY_COLUMN` the row changes SHAPE rather than merely shrinking: the price
 * drops under the name and the name takes the full width (see DomainRow/BestMatchCard).
 * That buys ~130px per row instead of the ~30 that tightening every gap would, which is
 * the difference between a layout that fits and one that fits until the next name is a
 * character longer.
 *
 * ⚠️ It measures the CONTAINER, never the viewport. The chat column is draggable
 * (340–760), so window width says nothing about what this screen actually got — and the
 * drag deliberately bypasses React (CLAUDE.md), which is also why the boolean is set
 * rather than the width: `setTight` with an unchanged value is a no-op in React, so a
 * drag across 200px re-renders this screen once, at the crossing, not sixty times a
 * second.
 * ⚠️ The container's own width must not depend on `tight`, or the two chase each other.
 * Only what is INSIDE a column changes; the page padding and the gap stay put.
 */
function useColumnFit(columns: number) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [tight, setTight] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => {
      /* contentRect excludes the page padding — what is left is what the columns share. */
      const inner = entry.contentRect.width - (columns - 1) * COLUMN_GAP
      setTight(inner / columns < ROOMY_COLUMN)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [columns])
  return { ref, tight }
}

/* --------------------------------------------------- dashboard building blocks */

/** Outlined 36px action — the mockup's row button (Figma 26181:64330). */
function RowButton({ label, onClick }: { label: Text; onClick?: () => void }) {
  const { t } = useT()
  return (
    <button
      onClick={onClick}
      className="h-9 flex-none rounded-[8px] border border-[#ffffff3d] px-3.5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
    >
      {t(label)}
    </button>
  )
}

/**
 * Price stack: big figure + honest renewal line (never hidden — audit rule).
 *
 * `note` is the rest of that honesty. `.ai` is sold in TWO-YEAR blocks and nothing
 * rendered its `TLD_PRICES.note` until now, so the row read "$89.99 · Renews at
 * $89.99" as if a single year were on offer — an incomplete price claim about a
 * name that costs $179.98 to register. It rides the renewal line rather than a
 * line of its own: the two belong to one sentence about what this actually costs,
 * and a third line would push the 72px row out of shape.
 */
/**
 * `inline` is the same two figures laid along a line instead of down a column — the
 * shape the price takes when it moves UNDER the name in a tight column (see
 * `useColumnFit`). It wraps rather than truncating: on a row the pair fits on one line,
 * in the narrower hero (where the struck list price joins them) it falls onto two by
 * itself, and neither case ever drops the renewal figure — the one number this project
 * will not hide.
 *
 * ⚠️ THE BIG FIGURE IS WHAT THE CUSTOMER IS CHARGED, WHICH IS NOT ALWAYS ONE YEAR.
 * `.ai` cannot be registered for less than two (TLD_PRICES `minYears`), so the row used
 * to print $89.99 — a true per-year rate, and the only screen in the chain that never
 * named the $179.98 the customer would actually pay. The checkout sheet says
 * "$179.98 · for 2 years" and the cart "First 2 years $179.98 total"; this is the screen
 * where the decision is made, and the rule here is price before the cart with nothing
 * about the bill hidden. So the figure is `domainAmount`, the SAME arithmetic those two
 * screens use — imported rather than repeated, because recomputing it in a third place
 * is exactly what let these screens drift apart. For the other nine endings
 * `domainAmount(tld, 1)` returns the registration price unchanged, so there is no branch
 * and no second code path: the big figure is always "what you pay now".
 *
 * The `/yr` on the renewal appears only alongside a multi-year figure, where "Renews at
 * $89.99" would otherwise be ambiguous about the period. Nine rows keep their exact
 * wording. The "2-year minimum" note is the data's own (`minTermNote`) and still rides
 * the renewal line: it says WHY the term is two years, which the total cannot.
 *
 * The struck list price is a PROMO device and now needs a promo to exist — `.ai` renews
 * at what it registers for, so the hero was drawing "$89.99 $89.99", one struck, one not.
 */
function PriceStack({
  tld, strike, inline,
}: { tld: string; strike?: boolean; inline?: boolean }) {
  const { t } = useT()
  const price = priceFor(tld) ?? priceFor('.com')!
  /* The whole registration, over the shortest term the registry will sell. */
  const total = domainAmount(price.tld, 1)
  const multiYear = minTermYears(price.tld) > 1
  const renews = multiYear
    ? t({ en: `Renews at ${money(price.renew)}/yr`, uk: `Продовження ${money(price.renew)}/рік` })
    : t({ en: `Renews at ${money(price.renew)}`, uk: `Продовження ${money(price.renew)}` })
  return (
    <div className={inline
      ? 'flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1'
      : 'flex flex-col items-end gap-1.5'}>
      <p className="flex items-baseline gap-1 leading-none">
        {strike && price.register !== price.renew && (
          <span className="font-display text-[15px] text-[#ffffff7a] line-through">{money(price.renew)}</span>
        )}
        <span className="font-display text-[18px] font-medium text-[#f5f5fa]">{money(total)}</span>
      </p>
      <p className="whitespace-nowrap font-display text-[12px] font-medium leading-none text-[#ffffff7a]">
        {renews}
        {price.note && ` · ${t(price.note)}`}
      </p>
    </div>
  )
}

/**
 * The Best-match hero (Figma 27729:15439 / 27085:107276).
 *
 * A gradient wash carrying the eyebrow, with the domain sitting on an opaque
 * gray-850 card inside it. Since the descriptions came out, the card is 88px and
 * the name centres on its own — nothing else changed. One component serves both
 * boards; the dashboard draws its fill #1d1d1f against the results screen's
 * #1f1f22, so the token (gray-850) wins over a two-unit difference.
 *
 * ⚠️ The rim is a ring MASK (`.bestmatch-rim`), not a second background layer:
 * the wash is 10% alpha, so an opaque gradient behind it shows through whole.
 */
function BestMatchCard({ row, onBuy, tight = false }: { row: ResultRow; onBuy: () => void; tight?: boolean }) {
  const { t } = useT()
  const buy = (
    <button
      onClick={onBuy}
      className="h-9 flex-none rounded-[8px] bg-[var(--action)] px-3.5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
    >
      {t({ en: 'Buy', uk: 'Купити' })}
    </button>
  )
  return (
    <div
      className="relative rounded-[16px] px-1 pb-1"
      style={{ background: 'linear-gradient(90deg, rgba(174,93,255,0.10), rgba(77,114,255,0.02))' }}
    >
      <i className="bestmatch-rim" aria-hidden />
      <div className="flex h-10 items-center pl-6 pr-4">
        <span
          className="font-display text-[14px] font-semibold"
          style={{
            backgroundImage: 'linear-gradient(81deg, #cb79ff 31%, #66a6ff 118%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {t({ en: 'Best match', uk: 'Найкращий збіг' })}
        </span>
      </div>
      {/* TIGHT: the name gets the whole width and the price moves under it, next to the
          verb. The card grows from the drawn 88px to about 100 — a hero is allowed to,
          and a name the customer cannot read is not worth twelve pixels of height. */}
      {tight ? (
        <div className="flex min-h-[88px] flex-col justify-center gap-2 rounded-[14px] border border-[#ffffff0a] bg-[var(--gray-850)] px-6 py-3">
          <p className="min-w-0 truncate text-[22px] font-medium leading-normal text-white">{row.domain}</p>
          <div className="flex min-w-0 items-center justify-between gap-4">
            {/* the promo says itself: list price struck, first year large */}
            <PriceStack tld={row.tld} strike inline />
            {buy}
          </div>
        </div>
      ) : (
        <div className="flex h-[88px] items-center justify-between gap-6 rounded-[14px] border border-[#ffffff0a] bg-[var(--gray-850)] px-6 py-4">
          <p className="min-w-0 flex-1 truncate text-[22px] font-medium leading-normal text-white">{row.domain}</p>
          <div className="flex h-10 flex-none items-center gap-8">
            <PriceStack tld={row.tld} strike />
            {buy}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * One list row — 72px, name left, price and one verb right (Figma 27257:14000).
 * No second line: the descriptions are gone from every board by request.
 *
 * `size` exists because the two boards disagree by a point: the results lists draw
 * the name at 16 (27729:15575), the dashboard's suggestion list at 17
 * (27085:107303). Both are as-drawn rather than harmonised behind the designer's back.
 */
function DomainRow({
  row, onBuy, size = 16, tight = false,
}: { row: ResultRow; onBuy: () => void; size?: 16 | 17; tight?: boolean }) {
  const buy = <RowButton label={{ en: 'Buy', uk: 'Купити' }} onClick={onBuy} />
  /* TIGHT: name on its own line at full width, both prices under it, verb still on the
     right — and the row keeps its drawn 72px, because the price line is shorter than the
     button it sits beside. See `useColumnFit` for why the shape changes rather than the
     type size: dropping a point buys 8px, this buys about 130. */
  if (tight) {
    return (
      <div className="flex min-h-[72px] items-center justify-between gap-4 rounded-[16px] px-4 py-2.5 transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#ffffff0a]">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="min-w-0 truncate font-medium leading-normal text-white" style={{ fontSize: size }}>
            {row.domain}
          </p>
          <PriceStack tld={row.tld} inline />
        </div>
        {buy}
      </div>
    )
  }
  return (
    <div className="flex h-[72px] items-center justify-between gap-6 rounded-[16px] px-5 py-4 transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#ffffff0a]">
      <p
        className="min-w-0 flex-1 truncate font-medium leading-normal text-white"
        style={{ fontSize: size }}
      >
        {row.domain}
      </p>
      <div className="flex h-10 flex-none items-center gap-8">
        <PriceStack tld={row.tld} />
        {buy}
      </div>
    </div>
  )
}

/**
 * Section title over a list — 61px tall: 20px of air, a 21px line, 20px again.
 * The line height is pinned at 21px, not 1.2: rounded up to 22 the block came out
 * a pixel tall and every list below it inherited the drift.
 */
function SectionTitle({ label }: { label: Text }) {
  const { t } = useT()
  return (
    <div className="flex items-center justify-between px-2 py-5">
      <h3 className="font-display text-[18px] font-semibold leading-[21px] text-[#f5f5fa]">{t(label)}</h3>
    </div>
  )
}

/**
 * "We answered about a different ending than you typed" — one line, above the answer.
 *
 * Only ten endings have a verified price (`TLD_PRICES`), and a row may only carry a
 * price we can stand behind, so a search for `brand.xyz` is answered with `brand.com`.
 * That substitution used to happen in silence, which is the same category error as
 * burying the exact match under AI ideas: the person asked about THAT name, and an
 * answer about a different one has to say so. The string is `endingNotice` in
 * data/domains.ts — rendered as written, not paraphrased here, so the sentence has one
 * home.
 *
 * It sits ABOVE the hero because it is a condition on everything below it, and it is
 * quiet type rather than a warning tone: nothing has gone wrong, we simply do not sell
 * that ending.
 */
function EndingNotice({ notice }: { notice: Text | null }) {
  const { t } = useT()
  if (!notice) return null
  return (
    <motion.div variants={listSwapItem}>
      <p className="px-2 pb-1 pt-2 text-[13px] leading-normal text-[var(--white-500)]">{t(notice)}</p>
    </motion.div>
  )
}

/**
 * The footer bar under every result list — redesigned Sep 2026 (Figma 27729:16043).
 *
 * "Show more" is CENTRED in the bar while the left label counts what we can sell.
 * The mockup centres it the honest way — with a second, invisible copy of the
 * left label balancing the row — and so does this: `justify-between` plus a
 * hidden twin keeps the button on the bar's true centre at any width, which a
 * flex-1 spacer would not do once the left label changes length in another
 * language.
 *
 * ⚠️ THE LABEL USED TO READ "400+ more available" AND THAT NUMBER HAD NO SOURCE.
 * This product can price exactly the endings in the verified table (`TLD_PRICES`,
 * DreamHost's official list, 06.08.2026) — ten of them — and every row falls back to
 * the .com price when an ending is missing from it, which is precisely why the table
 * is the limit rather than a starting point. Four hundred was a number nobody could
 * back, printed beside a "Show more" that deliberately does nothing: rule 0 of
 * docs/features/domains/copy.md ("numbers come from the register") forbids exactly
 * this. The count is now READ from the table, so the claim cannot drift from the data
 * the way a typed figure does.
 *
 * "Show more" stays inert on purpose — there is no honest second page — and the label
 * beside it no longer promises one.
 */
function ListFooter({ onShowMore }: { onShowMore?: () => void }) {
  const { t } = useT()
  const more = t({
    en: `${TLD_PRICES.length} endings to choose from`,
    uk: `${TLD_PRICES.length} закінчень на вибір`,
  })
  return (
    <div className="flex items-center justify-between px-6 py-3">
      <p className="whitespace-nowrap text-[15px] leading-normal text-[#ffffff7a]">{more}</p>
      {/* Hover is a full pill on the faintest wash we have (NA/50, the same 4% the
          rows use): at 8% the plate read as a solid button sitting in the bar. */}
      <button
        onClick={onShowMore}
        className="flex h-10 items-center justify-center gap-1 rounded-full py-2.5 pl-6 pr-2 text-[15px] font-medium leading-none text-[#ffffffb8] opacity-80 transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#ffffff0a] hover:opacity-100"
      >
        {t({ en: 'Show more', uk: 'Показати ще' })}
        <span className="grid h-6 w-6 flex-none place-items-center">
          <IconChevronDown size={20} />
        </span>
      </button>
      <p aria-hidden className="pointer-events-none select-none whitespace-nowrap text-[15px] leading-normal opacity-0">
        {more}
      </p>
    </div>
  )
}

/**
 * A titled result list: header, then a double-rimmed card — the outer rim (NA/100)
 * wraps the rows AND the footer, the inner one (#2a2a2d, 3% white fill) wraps just
 * the rows. Rows are 2px apart with a hairline between them.
 */
function ResultBlock({
  label, rows, onBuy,
}: { label: Text; rows: ResultRow[]; onBuy: (domain: string) => void }) {
  return (
    <motion.div variants={listSwapItem} className="flex flex-col">
      <SectionTitle label={label} />
      <div className="rounded-[16px] border border-[var(--white-100)]">
        {/* rows sit 2px apart with the hairline as its own item between them —
            2 + 1 + 2, exactly the mockup's list gap */}
        <div className="flex flex-col gap-0.5 overflow-hidden rounded-[16px] border border-[#2a2a2d] bg-[#ffffff08] py-2 pl-2 pr-[9px]">
          {rows.map((r, i) => (
            <Fragment key={r.domain}>
              {i > 0 && <div className="h-px w-full bg-[#ffffff0a]" aria-hidden />}
              <DomainRow row={r} onBuy={() => onBuy(r.domain)} />
            </Fragment>
          ))}
        </div>
        <ListFooter />
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------ the name is taken (27270:5623) */

/**
 * The taken card — Figma 27270:5623 (㉗ `3 занят`), the state that was missing
 * from this screen altogether until now.
 *
 * ⚠️ THE VERB IS "This is my domain", NEVER "You own this". We cannot know that a
 * stranger's registered domain belongs to the person searching; the language of
 * ownership stays conditional everywhere except the one branch where ownership IS
 * known — the DreamHost-account screen below.
 * ⚠️ No price, no Buy, and above all no "Make an offer". DreamHost has no
 * brokerage and sells no premium names (verified), so an aftermarket price here
 * would be an offer we could not honour.
 * The registrar, on the other hand, is fair game: RDAP returns the sponsoring
 * registrar as registry-level data and WHOIS privacy does not hide it.
 *
 * ⚠️ …WHEN WE ACTUALLY HAVE IT. `registrar` is optional, and a card without one
 * simply says the name is taken and says nothing about where. This screen used to
 * print `registrarOf(domain) ?? 'GoDaddy'`, which meant any name marked taken
 * without an attribution told the room it was registered at GoDaddy — a fabricated
 * claim about a real company, on stage. It also capped how honest the search could
 * be: names could only be marked taken where a registrar claim had a basis, which is
 * why half the internet was still on sale at $9.99. The line is conditional so the
 * data can mark far more names taken without anybody having to invent a company.
 * The rest of the card — chip, "This is my domain", the alternatives below — is the
 * same in both cases; nothing else on it depends on knowing the registrar.
 *
 * Material is the results screen's, not the mid-fi board's flat greys: the taken
 * answer and the available answer are the same screen wearing two faces.
 */
function TakenCard({
  domain, registrar, onClaim,
}: { domain: string; registrar?: string | null; onClaim: () => void }) {
  const { t } = useT()
  return (
    <div className="flex min-h-[88px] items-center justify-between gap-6 rounded-[16px] border border-[#ffffff0a] bg-[#ffffff08] px-6 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <p className="min-w-0 truncate text-[18px] font-medium leading-normal text-white">{domain}</p>
          {/* neutral, not red: a taken name is a fact, not an error the user made */}
          <span className="flex h-5 flex-none items-center rounded-[10px] bg-[var(--white-100)] px-2 text-[11px] font-semibold leading-none text-[#ffffffb8]">
            {t({ en: 'Taken', uk: 'Зайнятий' })}
          </span>
        </div>
        {registrar && (
          <p className="mt-1.5 text-[13px] leading-none text-[#ffffff7a]">
            {t({ en: `Registered at ${registrar}`, uk: `Зареєстровано на ${registrar}` })}
          </p>
        )}
      </div>
      <RowButton label={{ en: 'This is my domain', uk: 'Це мій домен' }} onClick={onClaim} />
    </div>
  )
}

/**
 * A card of rows with no footer bar — the dashboard's list material
 * (27085:107303) rather than the results screen's double-rimmed block, because
 * the taken board draws no "Show more" under either list: three close
 * alternatives and two ideas are complete answers, not the top of a longer one.
 *
 * ⚠️ NO DESCRIPTION UNDER THE NAME. Board 27270:5623 carries one on every row
 * ("A trusted, established extension", "Same name, small twist", "Made for
 * selling online", "Your name + what you serve", "Your name + your city") — the
 * designer's ruling of 10.09.2026 removed per-name descriptions from EVERY
 * domain row, and the hi-fi results board has none, so they are deliberately not
 * shipped here either. Flagged to the designer; do not "restore" them.
 */
function PlainList({ rows, onBuy }: { rows: ResultRow[]; onBuy: (domain: string) => void }) {
  return (
    <div className="rounded-[16px] border border-[#ffffff0a] bg-[#ffffff08] py-2 pl-2 pr-3">
      {rows.map((r, i) => (
        <Fragment key={r.domain}>
          {i > 0 && <div className="mx-5 h-px bg-[#ffffff0a]" aria-hidden />}
          <DomainRow row={r} onBuy={() => onBuy(r.domain)} />
        </Fragment>
      ))}
    </div>
  )
}

/**
 * The AI block's header on the taken screen: sparkle, the name in curly quotes,
 * and one line saying where the ideas came from. Same 20px-of-air rhythm as
 * `SectionTitle` so the two blocks below them sit on the same grid.
 */
function IdeasTitle({ name }: { name: string }) {
  const { t } = useT()
  return (
    <div className="px-2 py-5">
      <div className="flex items-center gap-2.5">
        <IconSparkleAI size={20} />
        <h3 className="font-display text-[18px] font-semibold leading-[21px] text-[#f5f5fa]">
          {t({ en: `More ideas for “${name}”`, uk: `Більше ідей для «${name}»` })}
        </h3>
      </div>
      <p className="mt-1.5 text-[13px] leading-normal text-[#ffffff7a]">
        {t({
          en: 'From your search + what your site is about',
          uk: 'З вашого пошуку + про що ваш сайт',
        })}
      </p>
    </div>
  )
}

/** `trulieve.com` → `Trulieve` — the board titles its idea block with the bare name. */
const brandLabel = (domain: string) => {
  const stem = domain.slice(0, domain.lastIndexOf('.')) || domain
  return stem.charAt(0).toUpperCase() + stem.slice(1)
}

/**
 * The header both dashboard states share: a centred title over the search pill.
 *
 * It is mounted ONCE, by DomainsSurface, and lives OUTSIDE the screen swap: the
 * field is a persistent object, so searching never remounts it — the caret, the
 * focus and the typed text all survive. Rebuilding the header on submit is what
 * made a search feel like a page reload.
 *
 * `compact` is the only knob, and it exists because the mockups disagree: the
 * empty state (27085:107047) draws a 40px title over a white 32px submit, the
 * results screen (27729:15315) a 32px title over a dark-glass 40px one. Since
 * the header now persists, that difference has to be a TRANSITION rather than
 * two components — the hero shrinks as results appear, the way a search engine's
 * home page settles into its results page. Still flagged to the designer: if he
 * wants the header frozen instead, freeze `compact`.
 */
function SearchHeader({
  title, compact, query, setQuery, onSubmit, placeholder,
}: {
  title: Text
  /** true on the results screen: 32px title, larger glass submit. */
  compact: boolean
  query: string
  setQuery: (v: string) => void
  onSubmit: () => void
  placeholder?: Text
}) {
  const { t } = useT()
  return (
    <div className="flex-none rounded-t-[8px] border-t border-[var(--white-100)] bg-[var(--gray-900)] pt-2">
      <h2
        /* one-off type-size transition on a single short line — the same
           exception the "Thinking" shimmer gets, and for the same reason */
        className="pb-[30px] pt-[29px] text-center font-display font-semibold leading-[1.2] text-white transition-[font-size] duration-[var(--dur-slow)] ease-std"
        style={{ fontSize: compact ? 32 : 40 }}
      >
        {t(title)}
      </h2>
      <div className="flex justify-center px-8 pb-6">
        {/* the 56px pill: gray-700 under an NA/50 rim, submit inside its right end */}
        <div className="flex h-14 w-full max-w-[880px] items-center rounded-full border border-[#ffffff0a] bg-[var(--gray-700)] pl-4 pr-2">
          <span className="flex-none text-white"><IconSearch size={20} /></span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            placeholder={placeholder ? t(placeholder) : undefined}
            className="ml-4 h-full min-w-0 flex-1 bg-transparent text-[17px] text-white outline-none placeholder:text-[#ffffff7a]"
          />
          {/* ONE button in both states, never two — swapping elements here would
              re-mount the control the user just pressed. */}
          <button
            onClick={onSubmit}
            aria-label={t({ en: 'Search', uk: 'Шукати' })}
            className={`grid flex-none place-items-center rounded-full transition-all duration-[var(--dur-slow)] ease-std ${
              compact
                ? 'h-10 w-10 border border-[#ffffff3d] bg-[#09090bcc] text-white backdrop-blur-[16px] hover:bg-[#09090b]'
                : 'h-8 w-8 border border-transparent bg-white text-[#09090b] hover:bg-[#e4e4e7]'
            }`}
          >
            <IconArrowRight size={compact ? 24 : 18} />
          </button>
        </div>
      </div>
    </div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--white-400)]">
      {children}
    </p>
  )
}

function PrimaryButton({ label, onClick }: { label: Text; onClick?: () => void }) {
  const { t } = useT()
  return (
    <button
      onClick={onClick}
      className="h-11 w-full rounded-control bg-[var(--action)] text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
    >
      {t(label)}
    </button>
  )
}

/* ------------------------------------------- the domain the project is already on */

/**
 * THE ONE ROW IN "EXISTING DOMAINS" THAT IS NOT AN OFFER.
 *
 * The column used to render four identical `Connect` buttons whatever the world said,
 * including on the domain the site is LIVE on — and that button is not decoration: it
 * opens the connect sheet, which sends `domain` back to `connecting` and the Publish
 * panel back to "Not published". Two clicks from the panel's own way out ("Use a
 * different domain" / "See all your domains") a demo could take the live site off the
 * air on stage. The same list also went on offering the domain that had just failed
 * with an older website still sitting on it.
 *
 * So the attached domain trades its verb for a state, and the row goes inert — no
 * hover wash, nothing to press. Reading `world.domain` (never "is there a name in the
 * field") is the house rule the Publish panel already follows: answering and Live are
 * different claims, and the padlock sits between them (PublishPanel, D5).
 *
 * The tones are that panel's own, so the two surfaces cannot disagree about one
 * situation: amber in flight · blue when everything is set up and the next move is the
 * customer's · red when it is stuck · green only when the site is actually answering.
 * `Needs attention` is the state's name in states.md, not a phrase invented here.
 *
 * ⚠️ Only the attached domain is marked. Whether the OTHER rows are safe to connect —
 * one of them may quietly be serving a site of its own — is a per-domain fact this
 * prototype does not carry yet; see the handover note. Do not infer it from
 * `inventory`, which describes the account, not the row.
 */
const CHIP_LIVE = { fill: '#48ba7926', ink: 'var(--live)' }
const CHIP_FLIGHT = { fill: '#e5c35926', ink: 'var(--attention)' }
const CHIP_SETTLED = { fill: '#1587ff26', ink: 'var(--action)' }
const CHIP_STUCK = { fill: '#ef444426', ink: 'var(--danger)' }

const CONNECTING = { en: 'Connecting', uk: 'Підключається' }
const ATTENTION = { en: 'Needs attention', uk: 'Потребує уваги' }
const IS_LIVE = { en: 'Live', uk: 'Онлайн' }

/** Exhaustive on purpose: a new domain state has to say what this list shows for it. */
const CONNECTION_CHIP: Record<DomainState, { label: Text; tone: { fill: string; ink: string } } | null> = {
  /* The project still has only its free address — nothing is attached, every row is an offer. */
  staging: null,
  searching: null,
  checkout: null,
  registering: { label: CONNECTING, tone: CHIP_FLIGHT },
  propagating: { label: CONNECTING, tone: CHIP_FLIGHT },
  connecting: { label: CONNECTING, tone: CHIP_FLIGHT },
  verifying: { label: CONNECTING, tone: CHIP_FLIGHT },
  /* Set up, correct, and the site has simply never been published. Not a failure. */
  ready: { label: { en: 'Connected', uk: 'Підключено' }, tone: CHIP_SETTLED },
  'old-site': { label: ATTENTION, tone: CHIP_STUCK },
  unreachable: { label: ATTENTION, tone: CHIP_STUCK },
  live: { label: IS_LIVE, tone: CHIP_LIVE },
  multiple: { label: IS_LIVE, tone: CHIP_LIVE },
}

/** The Publish panel's own Live pill (PublishPanel `UrlField`), wearing four tones. */
function ConnectionChip({ state }: { state: DomainState }) {
  const { t } = useT()
  const chip = CONNECTION_CHIP[state]
  if (!chip) return null
  return (
    <span
      className="flex h-6 flex-none items-center gap-1.5 rounded-full pl-2 pr-2.5 text-[12px] font-medium leading-none"
      style={{ background: chip.tone.fill, color: chip.tone.ink }}
    >
      <span className="h-1.5 w-1.5 flex-none rounded-full bg-current" aria-hidden />
      {t(chip.label)}
    </span>
  )
}

/**
 * THE SAME FACT IN A SENTENCE — what the in-account hero (`OwnedAnswer`) says under the
 * name once the searched domain turns out to be the one this site is already on.
 *
 * The chip above is the headline and this is the line beneath it, so the two are keyed
 * by the SAME axis and written from the Publish panel's own cards — `registering`'s
 * fifteen minutes, `propagating`'s journey, `ready`'s "publish to put your site on it",
 * `old-site`'s older website that has to come off, `unreachable`'s "stopped showing your
 * site", `live`'s padlock. Three surfaces, one story about one domain.
 *
 * ⚠️ NO CLOCK IN ANY OF THEM, which is this screen's standing rule (see the note inside
 * `OwnedAnswer`) and not a stylistic preference: the panel is allowed to say "usually
 * under 15 minutes" about `registering` because it is reading ONE state, while a hero
 * that collapses four in-flight states under one `Connecting` chip would be a click away
 * from promising the attach path's speed on the bought path. The durations live once,
 * in the panel, where the state is the whole subject.
 *
 * ⚠️ Exhaustive like `CONNECTION_CHIP`, and for the same reason: a new domain state
 * cannot reach this hero without somebody deciding what it says. The three `null`s are
 * the states where nothing is attached at all (`isCustomDomainActive` excludes exactly
 * those), so the hero never reads them — it is offering to connect then, which is the
 * correct answer for a domain the site is not on.
 */
const ATTACHED_LINE: Record<DomainState, Text | null> = {
  staging: null,
  searching: null,
  checkout: null,
  registering: {
    en: 'This site’s domain — we’re registering it now.',
    uk: 'Домен цього сайту — зараз реєструємо.',
  },
  propagating: {
    en: 'This site’s domain — it’s on its way across the internet.',
    uk: 'Домен цього сайту — він уже в дорозі інтернетом.',
  },
  connecting: {
    en: 'This site’s domain — we’re connecting it now.',
    uk: 'Домен цього сайту — зараз підключаємо.',
  },
  verifying: {
    en: 'This site’s domain — the secure padlock is switching on.',
    uk: 'Домен цього сайту — вмикається захисний замок.',
  },
  ready: {
    en: 'This site’s domain — set up and waiting for you to publish.',
    uk: 'Домен цього сайту — усе налаштовано, лишилося опублікувати.',
  },
  'old-site': {
    en: 'This site’s domain — an older website on it has to come off first.',
    uk: 'Домен цього сайту — спершу треба прибрати старіший сайт на ньому.',
  },
  unreachable: {
    en: 'This site’s domain — it stopped showing your site.',
    uk: 'Домен цього сайту — він перестав показувати ваш сайт.',
  },
  live: {
    en: 'Your site is live on it · padlock on.',
    uk: 'Ваш сайт працює на ньому · замок увімкнено.',
  },
  multiple: {
    en: 'Your site is live on it · padlock on.',
    uk: 'Ваш сайт працює на ньому · замок увімкнено.',
  },
}

/* ------------------------------------------------------------------ screens */

/**
 * Home: the domain dashboard (Figma 27085:106382; two-list variant 26181:33524).
 * A 195px header (40px title + 880px search pill) over the content sheet; with
 * DreamHost domains in the account the sheet splits into "Existing domains" +
 * "AI suggestions", otherwise the suggestions column centres alone.
 */
function HomeScreen() {
  const { world } = useWorld()
  const { openDomainModal } = useUI()
  const { t } = useT()

  const owned = OWNED_DOMAINS[world.inventory] ?? []
  /* The suggestion column cannot offer to sell what the left column already lists
     as owned — the two are on screen at the same time. */
  const mine = useMyDomains()
  const [best, ...rest] = AI_SUGGESTIONS.filter((r) => !mine.has(r.domain))
  /* WHICH row is the site's own domain — the one that must not carry a verb. Read off
     the world, not off `customDomain` alone: the panel keeps that name long before
     anything is attached (see `useMyDomains`). */
  const attached = isCustomDomainActive(world) ? world.customDomain : null
  /* How wide a column actually got, which decides the row's shape — see useColumnFit. */
  const { ref: listsRef, tight } = useColumnFit(owned.length > 0 ? 2 : 1)

  return (
    <motion.div
      variants={listSwap}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex min-h-0 flex-1 flex-col"
    >
      {/* ------------------------------------ page sheet: the lists (27085:107102) */}
      <div ref={listsRef} className="flex min-h-0 flex-1 justify-center gap-8 rounded-t-[8px] border-t border-[#ffffff0a] bg-[var(--gray-900)] px-8 pb-2 pt-2">
        {/* Existing domains — only when the account holds any (26181:34790).
            Name + outlined Connect, nothing else: owned domains have no price.

            ⚠️ IN A TIGHT ROW THE TWO COLUMNS STOP BEING EQUAL, and that is the point:
            they hold different things. This one carries the customer's real domains,
            which are the longest strings on the screen (`odesa-coffee-roasters.com` is
            210px at the drawn 17px) beside a 85px verb; the suggestions column has
            handed its price a second line by then and needs far less. Splitting 1.3 : 1
            gives each what it actually asks for instead of clipping the left to keep a
            symmetry nobody can see — it leaves both columns about 30px of slack at 1280,
            where equal halves leave the left column 19px short.
            ⚠️ Ukrainian still runs over here at 1280: «Підключити» is 50px wider than
            "Connect", and no split of 696px seats that beside a 25-character name. EN is
            the product default and the demo language; the UK stop needs the row's shape
            to change too, and that is a design call, not a ratio. */}
        {owned.length > 0 && (
          <motion.div
            variants={listSwapItem}
            className={tight
              ? 'flex min-h-0 min-w-0 max-w-[1200px] flex-[1.3] flex-col'
              : 'flex min-h-0 min-w-0 max-w-[1200px] flex-1 flex-col'}
          >
            <div className="flex h-16 flex-none items-center px-4">
              <h3 className="font-display text-[18px] font-semibold text-[#f5f5fa]">
                {t({ en: 'Existing domains', uk: 'Наявні домени' })}
              </h3>
            </div>
            <div className="min-h-0 flex-1 rounded-[16px] border border-[#ffffff0a] bg-[#ffffff08] p-2">
              <ScrollArea className="h-full">
                {owned.map((o, i) => {
                  /* The project's own domain answers with its state instead of a verb,
                     and the row stops reacting to the pointer — see ConnectionChip. */
                  const state = o.domain === attached ? world.domain : null
                  return (
                    <div key={o.domain}>
                      {i > 0 && <div className="mx-5 h-px bg-[#ffffff0a]" aria-hidden />}
                      <div className={state
                        ? 'flex h-[72px] items-center justify-between gap-3 rounded-[16px] px-5'
                        : 'flex h-[72px] items-center justify-between gap-3 rounded-[16px] px-5 transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#ffffff0a]'}
                      >
                        <p className="min-w-0 truncate text-[17px] font-medium text-white">{o.domain}</p>
                        {/* Same sheet the search's "You own this" screen opens
                            (`connect-owned`, 27071:20574 / 20591): both entrances to
                            "attach a domain I already have" land in one designed
                            modal, and the in-use warning lives there, once. */}
                        {state ? (
                          <ConnectionChip state={state} />
                        ) : (
                          <RowButton
                            label={{ en: 'Connect', uk: 'Підключити' }}
                            onClick={() => openDomainModal('connect-owned', o.domain)}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </ScrollArea>
            </div>
          </motion.div>
        )}

        {/* AI suggestions (27085:107262) */}
        <motion.div variants={listSwapItem} className="flex min-h-0 min-w-0 max-w-[1200px] flex-1 flex-col">
          <div className="flex h-16 flex-none items-center gap-2.5 px-2">
            <h3 className="font-display text-[18px] font-semibold text-[#f5f5fa]">
              {t({ en: 'AI suggestions', uk: 'AI-пропозиції' })}
            </h3>
            <IconSparkleAI size={20} />
          </div>

          {/* Best-match hero (27085:107276): purple tint, gradient rim fading out.
              Guarded because the list is filtered now: a customer who somehow owned
              every suggested name would otherwise render a hero with no row. */}
          {best && (
            <div className="flex-none">
              <BestMatchCard row={best} tight={tight} onBuy={() => openDomainModal('buy', best.domain)} />
            </div>
          )}

          {/* suggestion list (27085:107303): one card, hairline dividers, own scroll */}
          <div className="mt-4 min-h-0 flex-1 rounded-[16px] border border-[#ffffff0a] bg-[#ffffff08] py-2 pl-2 pr-3">
            <ScrollArea className="h-full">
              {/* the dashboard board insets its dividers by 20; the results lists
                  run them full-width — kept apart on purpose */}
              {rest.map((sg, i) => (
                <Fragment key={sg.domain}>
                  {i > 0 && <div className="mx-5 h-px bg-[#ffffff0a]" aria-hidden />}
                  <DomainRow row={sg} size={17} tight={tight} onBuy={() => openDomainModal('buy', sg.domain)} />
                </Fragment>
              ))}
            </ScrollArea>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

/**
 * Search results — Figma 27729:14650, reworked by the designer in Sep 2026.
 *
 * The exact name still opens the screen as the hero — a person who typed a name
 * is asking about THAT name — and under it now sit THREE lists instead of two:
 * Featured · Popular · Suggested. The split is the designer's requirement; what
 * goes in each list is ours (see data/domains.ts), and it keeps the old ordering
 * logic: the same name in other endings first, other names last.
 *
 * Two things the mockup settled and this follows to the pixel:
 *  - no row carries a description any more, in any list;
 *  - the footer bar is new — "400+ more available" on the left, "Show more" on
 *    the bar's centre (see ListFooter).
 *
 * The hole this screen used to have — no "taken" state anywhere — is closed: the
 * name the user typed is the one row that can come back registered, and when it
 * does the screen answers with `TakenResults` below instead of putting a price on
 * somebody else's domain.
 */
function ResultsScreen() {
  const { activeDomain, openDomainModal, goDomains } = useUI()
  const term = activeDomain ?? 'fit-ration'
  const buy = (domain: string) => openDomainModal('buy', domain)
  const mine = useMyDomains()
  const exact = exactMatch(term)
  /* No list may quote a price on a domain this customer already holds — and none
     may repeat the hero, which the lists can now collide with: the hero carries
     the ending the customer typed (`fitration.shop`), and `.shop` is also one of
     the endings the Featured list offers. The same row twice, once large and once
     small, reads as a bug rather than as a second offer. */
  const forSale = (rows: ResultRow[]) =>
    rows.filter((r) => !mine.has(r.domain) && r.domain !== exact.domain)

  /* THREE answers, one screen — the search field above never moves, only what is
     under it changes hands (see SearchHeader):
     it is already yours · it is somebody else's · it is for sale. */
  if (mine.has(exact.domain)) return <OwnedAnswer domain={exact.domain} />
  if (exact.taken) return <TakenResults term={term} exact={exact} onBuy={buy} />

  return (
    <ResultsSheet onBack={() => goDomains('home')}>
      {/* Said before the hero, because the hero may not be the ending they typed. */}
      <EndingNotice notice={endingNotice(term)} />
      <motion.div variants={listSwapItem}>
        <BestMatchCard row={exact} onBuy={() => buy(exact.domain)} />
      </motion.div>

      <ResultBlock
        label={{ en: 'Featured', uk: 'Обране' }}
        rows={forSale(featuredEndings(term))}
        onBuy={buy}
      />
      <ResultBlock
        label={{ en: 'Popular', uk: 'Популярні' }}
        rows={forSale(popularEndings(term))}
        onBuy={buy}
      />
      <ResultBlock
        label={{ en: 'Suggested', uk: 'Пропозиції' }}
        rows={forSale(nameIdeas(term))}
        onBuy={buy}
      />
    </ResultsSheet>
  )
}

/**
 * The name is registered — Figma 27270:5623 (㉗ `3 занят`).
 *
 * Order is the argument, and it is the board's: state the fact first (taken, and
 * who holds it), give the one conditional way forward ("This is my domain"), then
 * the SAME name still reachable (`Close alternatives`), and only last other names
 * (`More ideas`). The person asked about one specific name; answering with a
 * brainstorm first would be the same category error the available screen avoids.
 *
 * `This is my domain` goes exactly where the dashboard's owned-domain Connect
 * goes — the connect sheet (`connect-owned`, Figma 27071:20574 / 20591) — so the
 * two entrances to "attach a domain I already have" land in one designed modal
 * rather than in two half-screens.
 */
function TakenResults({
  term, exact, onBuy,
}: { term: string; exact: ResultRow; onBuy: (domain: string) => void }) {
  const { goDomains } = useUI()
  const mine = useMyDomains()
  /* Same two rules as the available screen: nothing the customer owns, and never
     the name on the card above — an alternative to a taken name cannot be that
     name. */
  const forSale = (rows: ResultRow[]) =>
    rows.filter((r) => !mine.has(r.domain) && r.domain !== exact.domain)
  /* Whatever the data knows, and NOTHING when it knows nothing — no `?? 'GoDaddy'`.
     See TakenCard: an invented registrar is a claim about a real company. */
  const registrar = registrarOf(exact.domain)
  /* We may have answered about a different ending than the one they typed — say so. */
  const notice = endingNotice(term)

  return (
    <ResultsSheet onBack={() => goDomains('home')}>
      {/* The ending swap is announced on the taken answer too: `brand.xyz` reaching a
          taken `brand.com` is still an answer about a name they did not type. */}
      <EndingNotice notice={notice} />
      <motion.div variants={listSwapItem}>
        {/*
         * `This is my domain` is drawn on board 27270:5623; where it LANDS is board
         * ㉘ A1 (27281:5564) — the external-registrar setup, whose CTA there reads
         * "Show me what to change". That flow is ITERATION 2 and is not built, so
         * this is INTERIM ROUTING to the external screen that exists today.
         *
         * ⚠️ Do not "fix" this back into the connect-owned sheet. It was wired that
         * way for an afternoon and the sheet told a customer whose name is registered
         * at GoDaddy "On DreamHost · connects in a few seconds" — false about the
         * product in the one place where the customer is telling us the truth about
         * themselves. And do not assume the screen it lands on is finished: it still
         * hardcodes one registrar's instructions and prints a raw IP.
         *
         * The name is carried across, so the screen names the registrar we already
         * detected for it rather than a different one.
         */}
        <TakenCard
          domain={exact.domain}
          registrar={registrar}
          onClaim={() => goDomains('external', exact.domain)}
        />
      </motion.div>

      <motion.div variants={listSwapItem} className="flex flex-col">
        <SectionTitle label={{ en: 'Close alternatives', uk: 'Близькі варіанти' }} />
        <PlainList rows={forSale(closeAlternatives(term))} onBuy={onBuy} />
      </motion.div>

      <motion.div variants={listSwapItem} className="flex flex-col">
        <IdeasTitle name={brandLabel(exact.domain)} />
        <PlainList rows={forSale(takenIdeas(term))} onBuy={onBuy} />
      </motion.div>
    </ResultsSheet>
  )
}

/**
 * A 44px plate carrying a thin globe — the mark on the owned-domain card
 * (Figma 27271:5564). Drawn by hand, like everything in ui/icons.tsx: Figma's SVG
 * export is unreachable through our proxy.
 *
 * Three strokes and no more: the outline, ONE meridian ellipse and ONE equator
 * chord. `IconGlobeLarge` next door draws two parallels because it sits at 24px
 * inside the checkout sheet; at 22 on a dark plate that second parallel closes the
 * upper cap into a solid band. Local to this screen while it has one caller —
 * promote it into ui/icons.tsx the day a second screen wants it.
 */
function GlobePlate() {
  return (
    <span className="grid h-11 w-11 flex-none place-items-center rounded-[14px] bg-[#09090b8f] text-white">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="12" cy="12" rx="3.6" ry="8.4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.6 12h16.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  )
}

/**
 * "You own this" — the domain is already in the customer's DreamHost account.
 * Figma 27271:5564 (㉗ `4 в аккаунте`), rebuilt to that board.
 *
 * The designer's note on the board says what this screen is for: it is the ONLY
 * branch where ownership is KNOWN, so it is the only place allowed to say "You
 * own this" rather than the conditional "This is my domain" the taken card uses.
 * There is nothing to decide here — no price, no alternatives, no plan gate — so
 * the screen is one card and one blue verb.
 *
 * ⚠️ NO PRICE ANYWHERE, and that is the whole point of the state: a domain you
 * already hold costs nothing to attach. A figure on this card would invent a
 * charge the product does not make.
 *
 * ⚠️ The "this domain already shows a site" warning is NOT duplicated here. That
 * case is drawn inside the connect sheet (㉖B, 27071:20591) and the sheet decides
 * it itself off `world.inventory`; a second copy on this screen would be two
 * warnings for one situation, and they would drift apart.
 */
function OwnScreen() {
  const { world } = useWorld()
  const { activeDomain } = useUI()
  const domain = activeDomain ?? CUSTOM_DOMAIN

  /* ⚠️ THE ATTACHED DOMAIN NEVER REACHES THE SETUP SCREEN, WHATEVER THE INVENTORY SAYS.
     `ExternalNsScreen` is one long instruction for attaching a name — "we’ll show you
     the two lines to paste at Cloudflare", a Connect that opens the connect sheet — and
     every word of it is moot about the domain this site is already on, whose records
     were written long ago. Same defect as the one `OwnedAnswer` is being fixed for
     (QA, 14.09.2026), one route further out: `?i=dh-external-ns&d=live` typed its own
     live domain into the field and was handed a setup guide with a Connect at the
     bottom. The attached case answers with the state, which is what `OwnedAnswer` now
     draws; the external-NS body keeps every OTHER domain in that account. */
  const attached = isCustomDomainActive(world) && world.customDomain === domain

  /* ITERATION 2 — OUT OF SCOPE, left reachable exactly as it was. A domain of ours
     whose settings are managed at another company cannot be attached by writing
     records on our side, so it needs its own flow (㉘ A2 gives it one, and calls the
     CTA "Show me what to change"). Not developed here, not deleted either. */
  if (world.inventory === 'dh-external-ns' && !attached) return <ExternalNsScreen domain={domain} />

  return <OwnedAnswer domain={domain} />
}

/**
 * The card itself, so the two ways in draw the same answer: typing an owned domain
 * (this screen) and a search whose exact match turns out to be one already in the
 * account (ResultsScreen). Without this, the second path would have gone on
 * offering to sell the customer their own name.
 *
 * ⚠️ AND IT MUST NOT OFFER TO CONNECT THE DOMAIN THE SITE IS ALREADY ON (QA,
 * 14.09.2026 — "a very plausible demo move"). Typing the live domain into the field
 * landed here with a blue `Connect`, and that button is not decoration: it opens the
 * connect sheet, which sends `domain` back to `connecting`, reverts the Publish panel's
 * URL field to the free address and takes the live site off the air for an eleven-second
 * replay of a connection that already happened. The Existing-domains list learned this
 * the same night (see `ConnectionChip`); the SEARCH answer for the same domain is the
 * same claim about the same world and had been left behind — one surface offering what
 * the other had already marked done.
 *
 * So the state decides: attached, and the verb is replaced by the state chip and the
 * line under the name says where the connection stands — in the dashboard row's and the
 * Publish panel's own vocabulary and tones (`CONNECTION_CHIP` · `ATTACHED_LINE`), never
 * a second set invented here. Not attached — including every OTHER domain in the
 * account — and the screen is exactly what it was: one card, one blue verb.
 *
 * ⚠️ The test is `world.domain` + the name, never "is there a name in the field".
 * `customDomain` keeps its name long before anything is attached and long after a
 * connection is abandoned, so the comparison has to go through `isCustomDomainActive`
 * — the house rule the Publish panel and the list both already follow.
 *
 * The way out is untouched in both branches: the field above still searches, the "just
 * keep typing" caption still says so, and `All domains` still leads back.
 */
function OwnedAnswer({ domain }: { domain: string }) {
  const { world } = useWorld()
  const { openDomainModal, goDomains } = useUI()
  const { t } = useT()

  /* Null unless THIS name is the one the project is actually on — the same read the
     Existing-domains list makes one screen away. */
  const attached = isCustomDomainActive(world) && world.customDomain === domain
    ? world.domain
    : null
  const standing = attached ? ATTACHED_LINE[attached] : null

  return (
    <ResultsSheet onBack={() => goDomains('home')}>
      <motion.div variants={listSwapItem}>
        <div className="flex min-h-[100px] items-center gap-4 rounded-[16px] border border-[#ffffff0a] bg-[#ffffff08] px-6 py-4">
          <GlobePlate />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <p className="min-w-0 truncate text-[18px] font-medium leading-normal text-white">{domain}</p>
              <span className="flex h-5 flex-none items-center rounded-[10px] bg-[#48ba7926] px-2 text-[11px] font-semibold leading-none text-[var(--live)]">
                {t({ en: 'In your account', uk: 'У вашому акаунті' })}
              </span>
            </div>
            {/*
              * NO CLOCK ON THIS LINE, ON PURPOSE. Board 27071:20574 says "connects in
              * a few seconds" and this screen deliberately says nothing of the kind:
              * a parked domain has never resolved, so the negative answer is cached
              * under SOA MINIMUM (14400s) and "seconds" is false in the common case.
              * Full mechanism and the flag to the designer — he may prefer to change
              * the board rather than the copy — live once, in DomainModal.tsx around
              * :326-347 ("THE BOARD SAYS SECONDS"). What this line carries instead is
              * a fact: the name is ours and attaching it costs nothing. The timing
              * story belongs to the Publish panel, where the connecting state is read.
              *
              * (The older duration promise this screen used to print — "Under a
              * minute · nothing to configure" — went out with the pre-redesign
              * OwnScreen body on 18.08.2026, commit 4059a41.)
              */}
            {/* ⚠️ "free to connect" IS AN OFFER, so it goes out with the button on the
                domain that is already connected: the honest half of that sentence
                (ownership, no charge) is the reason there is no price on this card, and
                the reason has no work left to do once the connection exists. What the
                customer needs instead is where it stands — `ATTACHED_LINE`. */}
            <p className="mt-1.5 text-[13px] leading-none text-[#ffffff7a]">
              {t(standing ?? {
                en: 'You own this — registered with DreamHost · free to connect',
                uk: 'Це ваш домен — зареєстрований у DreamHost · підключення безкоштовне',
              })}
            </p>
          </div>
          {/* Attached: the verb's slot carries the state instead — the same swap the
              Existing-domains row makes, so the two screens cannot disagree about one
              situation. Otherwise the one blue thing on the screen: nothing else here
              is an action. */}
          {attached ? (
            <ConnectionChip state={attached} />
          ) : (
            <button
              onClick={() => openDomainModal('connect-owned', domain)}
              className="h-9 min-w-[110px] flex-none rounded-[8px] bg-[var(--action)] px-4 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
            >
              {t({ en: 'Connect', uk: 'Підключити' })}
            </button>
          )}
        </div>
      </motion.div>

      {/* The way out, and it is the field above — no Back button on this screen. */}
      <motion.div variants={listSwapItem}>
        <p className="px-2 pt-3 text-[13px] leading-normal text-[var(--white-400)]">
          {t({
            en: 'Looking for a different domain? Just keep typing.',
            uk: 'Шукаєте інший домен? Просто продовжуйте вводити.',
          })}
        </p>
      </motion.div>
    </ResultsSheet>
  )
}

/**
 * ITERATION 2 — our domain, but its settings are managed at another company.
 *
 * Untouched on purpose: this is the pre-board body this screen used to render for
 * `dh-external-ns`, kept reachable so the knowledge and the scenario do not go
 * missing while the state waits its turn. It does NOT follow board 27271:5564 —
 * that board draws the clean case only. When this comes up for real, ㉘ A2
 * (27281:5564) is the board, and the CTA there is "Show me what to change".
 */
function ExternalNsScreen({ domain }: { domain: string }) {
  const { goDomains, openDomainModal } = useUI()
  const { t } = useT()

  /*
   * THE PLAN GATE — AND WHY THIS BUTTON DECIDES NOTHING ITSELF.
   *
   * It used to call `startConnect(domain)` from here, which is the same defect
   * ExternalScreen was fixed for earlier tonight (see the note on that component):
   * a trial account walked connecting → verifying → ready → Publish → live on a
   * custom domain, the one combination `world.violations()` declares impossible
   * ("A custom domain needs a paid plan — checkout comes first"). QA reproduced it
   * on `?a=trial&i=dh-external-ns`. Two copies of one mistake, because this screen
   * and that one were written a day apart; going live is a paid act whichever door
   * it comes through, so the decision belongs to the sheet that owns it everywhere
   * else in this module.
   *
   * THE KIND IS `connect-owned`, NOT `connect-external`, and the kind is a claim
   * about the customer's situation rather than about this screen's layout: the name
   * IS in their DreamHost account — only its settings are managed at another company
   * — which is exactly what `connect-owned` means. `connect-external` would have the
   * sheet read "At {registrar} · you'll add two records there", and `registrarOf`
   * knows nothing about this name, so it would print the `?? 'GoDaddy'` fallback over
   * a domain the card above just named as managed at Cloudflare — the same invented
   * registrar this pass is removing from the router. No new kind and no new screen:
   * the whole state is iteration 2 (㉘ A2, 27281:5564).
   *
   * ⚠️ FOR THE SHEET'S OWNER, NOT FOR HERE: on a PAID account `connect-owned` reads
   * "On DreamHost · nothing to change anywhere else", which is true of the clean case
   * (㉖A) and not of this one — the customer does have to move the settings at the
   * other company. The trial path, which is the reproduction above, reads correctly
   * ("connects as soon as you add a plan"). Whoever builds ㉘ A2 owns that line.
   */
  const connect = () => openDomainModal('connect-owned', domain)

  return (
    <Screen>
      <button onClick={() => goDomains('home')} className="mb-4 text-[13px] text-[var(--white-400)] hover:text-[var(--white-700)]">
        ← {t({ en: 'Back', uk: 'Назад' })}
      </button>

      <Eyebrow>{t({ en: 'You own this', uk: 'Це ваш домен' })}</Eyebrow>
      <h2 className="font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.02em]">{domain}</h2>
      <p className="mt-2 text-[14px] leading-[1.5] text-[var(--white-500)]">
        {t({
          en: 'It’s already in your DreamHost account — nothing to change anywhere else.',
          uk: 'Він уже у вашому акаунті DreamHost — нічого не треба змінювати деінде.',
        })}
      </p>

      <div className="mt-4 rounded-control border border-[#e5c35940] bg-[#e5c35914] p-3.5">
        <p className="text-[13px] font-semibold text-[var(--attention)]">
          {t({ en: 'This domain is managed at Cloudflare', uk: 'Цим доменом керує Cloudflare' })}
        </p>
        <p className="mt-1 text-[13px] leading-[1.45] text-[var(--white-400)]">
          {t({
            en: 'Its settings live there, so we’ll show you the two lines to paste at Cloudflare. About 5 minutes.',
            uk: 'Його налаштування живуть там, тож ми покажемо два рядки, які треба вставити на Cloudflare. Приблизно 5 хвилин.',
          })}
        </p>
      </div>

      <div className="mt-5">
        <PrimaryButton label={{ en: 'Connect', uk: 'Підключити' }} onClick={connect} />
      </div>
    </Screen>
  )
}

/**
 * External domain: registrar detected, guided manual path. No Domain Connect promises.
 *
 * ITERATION 2 — not developed here. One thing was fixed and only one: this screen
 * used to call `startConnect` itself, which put a custom domain live for an account
 * with no plan — a combination `world.violations()` declares impossible ("A custom
 * domain needs a paid plan — checkout comes first"). Going live is a paid act
 * whichever door it comes through, so the decision now belongs to the sheet that
 * owns it, exactly as it does for a domain in the account.
 */
function ExternalScreen() {
  const { set } = useWorld()
  const { activeDomain, goDomains, openDomainModal } = useUI()
  const { t } = useT()
  const domain = activeDomain ?? 'emberandoak.com'
  /*
   * The one thing the taken screen hands over: a name it already detected a
   * registrar for arrives naming THAT company, not a second one. Everything else on
   * this screen is still written for a single registrar and stays that way until
   * iteration 2 — this substitutes a name, it does not make the screen registrar-aware.
   *
   * ⚠️ AND WHEN WE DO NOT KNOW, THE SCREEN SAYS SO RATHER THAN GUESSING. It used to
   * read `registrarOf(domain) ?? 'GoDaddy'`, so a customer arriving from a taken card
   * that had deliberately said nothing about where the name lives was told, one click
   * later, that it lives at GoDaddy — the same invented claim about a real company,
   * only further into the flow. `another provider` is the degradation states.md
   * already prescribes for `{registrar}` when the registry does not show one.
   */
  const registrar = registrarOf(domain)
  const where = registrar ?? t({ en: 'another provider', uk: 'іншого провайдера' })

  const start = () => {
    /* The inventory axis is true from this press on — the customer is attaching a
       domain they hold somewhere else, by hand — whether or not they then pay. */
    set({ inventory: 'external-manual' })
    openDomainModal('connect-external', domain)
  }

  return (
    <Screen>
      <button onClick={() => goDomains('home')} className="mb-4 text-[13px] text-[var(--white-400)] hover:text-[var(--white-700)]">
        ← {t({ en: 'Back', uk: 'Назад' })}
      </button>

      <Eyebrow>{t({ en: 'Connect your domain', uk: 'Підключення вашого домену' })}</Eyebrow>
      <h2 className="font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.02em]">{domain}</h2>
      {/* The detection bar: registrar identity is registry-level data (RDAP) — reliable. */}
      <p className="mt-2 text-[14px] leading-[1.5] text-[var(--white-500)]">
        {registrar
          ? t({
            en: `Registered at ${registrar}. It stays there — no transfer needed.`,
            uk: `Зареєстровано на ${registrar}. Він там і залишиться — переносити не треба.`,
          })
          : t({
            en: 'It stays where it is registered — no transfer needed.',
            uk: 'Він залишиться там, де зареєстрований — переносити не треба.',
          })}
      </p>

      {/* De-jargoned records card: two named values, copy buttons, inline guide. */}
      <div className="mt-5 rounded-control border border-[var(--gray-800)] bg-[var(--gray-850)] p-4">
        <p className="text-[13px] font-semibold text-[var(--white-700)]">
          {t({
            en: `Point your domain to us — 2 lines to paste at ${where}`,
            uk: `Спрямуйте домен до нас — 2 рядки вставити на ${where}`,
          })}
        </p>
        {[
          { label: 'Website address', value: '64.90.62.162' },
          { label: 'Proof it’s yours', value: `remixer-verify=${domain.split('.')[0]}` },
        ].map((r) => (
          <div key={r.label} className="mt-2.5 flex items-center justify-between gap-3 rounded-chip bg-[var(--gray-900)] px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[11.5px] uppercase tracking-[0.08em] text-[var(--white-300)]">{r.label}</p>
              <p className="truncate font-mono text-[13px] text-[var(--white-700)]">{r.value}</p>
            </div>
            <button className="flex-none text-[12.5px] font-medium text-[var(--action)] hover:text-[var(--action-hover)]">
              {t({ en: 'Copy', uk: 'Копіювати' })}
            </button>
          </div>
        ))}
        <p className="mt-3 text-[12.5px] leading-[1.5] text-[var(--white-400)]">
          {/* ⚠️ The path is GoDaddy's own menu and is NOT generic — it is right only
              while `registrar` IS GoDaddy, which is the demo case. With no registrar
              detected there is no menu to name, so the line describes the destination
              instead of pretending to know the route. Iteration 2 owns per-registrar
              instructions. */}
          {registrar
            ? t({
              en: `In ${registrar}: My Products → your domain → DNS. Paste both lines, save, come back here.`,
              uk: `На ${registrar}: My Products → ваш домен → DNS. Вставте обидва рядки, збережіть і поверніться сюди.`,
            })
            : t({
              en: 'Open your domain’s settings where it is registered. Paste both lines, save, come back here.',
              uk: 'Відкрийте налаштування домену там, де він зареєстрований. Вставте обидва рядки, збережіть і поверніться сюди.',
            })}
        </p>
      </div>

      <div className="mt-5">
        <PrimaryButton label={{ en: 'I’ve added them — check now', uk: 'Я додав(-ла) — перевірити' }} onClick={start} />
      </div>
      <p className="mt-2 text-center text-[12.5px] text-[var(--white-300)]">
        {t({
          en: 'We keep checking in the background either way — you can leave.',
          uk: 'Ми однаково перевірятимемо у фоні — можна йти.',
        })}
      </p>
    </Screen>
  )
}

/* ------------------------------------------------------------------ surface */

const SCREENS: Record<DomainScreen, () => JSX.Element> = {
  home: HomeScreen,
  results: ResultsScreen,
  own: OwnScreen,
  external: ExternalScreen,
}

export function DomainsSurface() {
  const { domainScreen, closeSurface, goDomains } = useUI()
  const { t } = useT()
  const Current = SCREENS[domainScreen]

  /*
   * The search field's state lives HERE, above the screen swap, for the same
   * reason the header itself does: the field is one persistent object across
   * home and results. Held per screen it was re-created on every search — the
   * caret jumped out, focus was lost and the whole header re-animated, which
   * read as the page reloading rather than as an answer arriving.
   */
  const [query, setQuery] = useState('')
  /* `own` joins home and results: board 27271:5564 draws the field still standing
     over the owned-domain card, and the card's own caption ("just keep typing")
     only means anything while it is there. */
  const searching = domainScreen === 'home' || domainScreen === 'results' || domainScreen === 'own'
  /* The customer's own names — inventory AND whatever is attached to the project
     right now. The router below is the only thing that reads it here; see `submit`
     for why it cannot be left to the results screen. */
  const mine = useMyDomains()

  /*
   * Escape steps back one level and only then closes the window — the same shape
   * every other overlay in the shell has. It stays silent while the checkout sheet
   * is up: that sheet listens for Escape too (DomainModal), and answering both would
   * close the sheet and navigate the window under it in one press.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (useUI.getState().domainModal) return
      if (useUI.getState().domainScreen !== 'home') goDomains('home')
      else closeSurface()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [goDomains, closeSurface])

  const submit = () => {
    const q = query.trim().toLowerCase()
    /* An empty field is not a search — it is "show me everything again", and it is
       the second way back to the dashboard (the first is the button on the sheet,
       the third is Escape). Until now it was a dead press. */
    if (!q) {
      if (domainScreen !== 'home') goDomains('home')
      return
    }
    /*
     * Intent detection, prototype-grade — and it is ONE question, not four.
     *
     * IS THIS NAME ALREADY THE CUSTOMER'S? (㉗④ 27271:5564, "You own this".) It is
     * the only thing the router has to answer, because it is the only one the
     * results screen cannot: that screen tests its exact match, which is always the
     * `.com` (see exactMatch), while the field carries whatever ending was typed —
     * `design-portfolio.net` would have sailed past it. `useMyDomains` is the whole
     * set, the DreamHost inventory AND the domain attached to the project right now,
     * so typing your own LIVE domain lands on the in-account state instead of being
     * handled as a stranger's.
     *
     * Everything else is a search, and the results screen already answers it with
     * the right one of its two faces: the taken card (㉗③ 27270:5623) when the name
     * is registered, prices when it is not.
     *
     * ⚠️ A DOT IS NOT A CLAIM OF OWNERSHIP — THAT INFERENCE WAS THE BUG, AND IT WILL
     * LOOK REASONABLE TO WHOEVER READS THIS NEXT. The branch here used to read
     * `q.includes('.')` as "pasted from another registrar" and route to the
     * external-records screen. What it did in practice: `emberandoak.com` — a name
     * this same screen had been offering at $9.99 a second earlier — came back as
     * "Registered at GoDaddy. It stays there — no transfer needed", with a raw IP and
     * two lines to paste at a company the customer has never used. The registrar was
     * invented by that screen's `?? 'GoDaddy'` fallback, and typing the ending is
     * simply how people write a domain (QA, 13.09.2026).
     *
     * SO THE EXTERNAL SCREEN IS REACHABLE FROM EXACTLY ONE PLACE, AND MUST STAY
     * THAT WAY: the conditional `This is my domain` on the taken card, where the
     * customer has told us the name is theirs. Never from bare routing — an ending
     * in the string is not a customer claim.
     */
    if (mine.has(q)) goDomains('own', q)
    else goDomains('results', q)
  }

  /*
   * No plan gate in front of this surface any more.
   *
   * It used to open on a full-screen upgrade wall for anyone without Remixer
   * Build. All three checkout-sheet boards (27058:100133, 27254:11737,
   * 27275:33023) draw a trial user standing in the FULL dashboard with the sheet
   * on top — the paywall is disclosed at the moment of purchase, inside the
   * sheet, not as a wall in front of browsing. That is also the audit's rule:
   * price before the cart. Searching a name is free; paying is where the plan
   * comes up. See DomainModal for where the gate actually lives now.
   */

  return (
    /* The dashboard window (Figma 27085:106964): radius 16, gray-800 border, a
       darker base tone (24% black over gray-900) that stays visible behind the
       top bar — the content sheets repaint themselves gray-900 below it. */
    <div
      className="flex h-full flex-col overflow-hidden rounded-[16px] border border-[var(--gray-800)]"
      style={{
        background: 'linear-gradient(rgba(9,9,11,0.24), rgba(9,9,11,0.24)), var(--gray-900)',
        boxShadow: '0px 8px 8px rgba(0,0,0,0.12), 0px 56px 72px rgba(0,0,0,0.12)',
      }}
    >
      {/* top bar (27085:106980): globe tile + label left, close right */}
      <div className="flex h-12 flex-none items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#09090b8f] text-white">
            <IconGlobe size={20} />
          </span>
          <span className="pb-px text-[13px] font-medium text-[#e4e4e7]">
            {t({ en: 'Domains', uk: 'Домени' })}
          </span>
        </div>
        <button
          onClick={closeSurface}
          aria-label={t({ en: 'Close', uk: 'Закрити' })}
          className="grid h-8 w-8 place-items-center rounded-[8px] bg-[var(--white-100)] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-200)]"
        >
          <IconClose size={11} />
        </button>
      </div>

      {/* The header is mounted ONCE, outside the swap below: searching must not
          rebuild the field the user is typing into. */}
      {searching && (
        <SearchHeader
          title={{ en: 'Find your domain name', uk: 'Знайдіть свій домен' }}
          /* Compact on every ANSWER, not only on the result lists: the hero
             settles the moment the field has been used, the way a search engine's
             home page settles into its results page, and the owned-domain answer
             (27271:5564) is as much an answer as a list of prices. */
          compact={domainScreen !== 'home'}
          query={query}
          setQuery={setQuery}
          onSubmit={submit}
          placeholder={{
            en: 'Search a name to buy, or enter one you already own',
            uk: 'Шукайте назву для купівлі або введіть свою',
          }}
        />
      )}

      {/* Only the lists change hands. mode="wait" keeps the two sets from
          overlapping mid-flight, so the conveyor reads cleanly. */}
      <AnimatePresence mode="wait">
        <Current key={domainScreen} />
      </AnimatePresence>
    </div>
  )
}