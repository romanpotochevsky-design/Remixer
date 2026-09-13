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
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useWorld, isCustomDomainActive } from '@/state/world'
import { useUI, type DomainScreen } from '@/state/ui'
import { useT, type Text } from '@/i18n'
import {
  AI_SUGGESTIONS, OWNED_DOMAINS, CUSTOM_DOMAIN, priceFor,
  exactMatch, featuredEndings, popularEndings, nameIdeas, type ResultRow,
  closeAlternatives, takenIdeas, registrarOf, isTaken,
} from '@/data/domains'
import { ScrollArea } from '@/ui/ScrollArea'
import {
  IconSearch, IconArrowRight, IconArrowLeft, IconGlobe, IconClose, IconSparkleAI,
  IconChevronDown,
} from '@/ui/icons'
import { surface, listSwap, listSwapItem } from '@/ui/motion'
import { startConnect } from './connect'


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
function PriceStack({
  register, renew, strike, note,
}: { register: number; renew: number; strike?: boolean; note?: Text }) {
  const { t } = useT()
  return (
    <div className="flex flex-col items-end gap-1.5">
      <p className="flex items-baseline gap-1 leading-none">
        {strike && (
          <span className="font-display text-[15px] text-[#ffffff7a] line-through">${renew.toFixed(2)}</span>
        )}
        <span className="font-display text-[18px] font-medium text-[#f5f5fa]">${register.toFixed(2)}</span>
      </p>
      <p className="whitespace-nowrap font-display text-[12px] font-medium leading-none text-[#ffffff7a]">
        {t({ en: `Renews at $${renew.toFixed(2)}`, uk: `Продовження $${renew.toFixed(2)}` })}
        {note && ` · ${t(note)}`}
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
function BestMatchCard({ row, onBuy }: { row: ResultRow; onBuy: () => void }) {
  const { t } = useT()
  const price = priceFor(row.tld) ?? priceFor('.com')!
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
      <div className="flex h-[88px] items-center justify-between gap-6 rounded-[14px] border border-[#ffffff0a] bg-[var(--gray-850)] px-6 py-4">
        <p className="min-w-0 flex-1 truncate text-[22px] font-medium leading-normal text-white">{row.domain}</p>
        <div className="flex h-10 flex-none items-center gap-8">
          {/* the promo says itself: list price struck, first year large */}
          <PriceStack register={price.register} renew={price.renew} note={price.note} strike />
          <button
            onClick={onBuy}
            className="h-9 flex-none rounded-[8px] bg-[var(--action)] px-3.5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
          >
            {t({ en: 'Buy', uk: 'Купити' })}
          </button>
        </div>
      </div>
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
function DomainRow({ row, onBuy, size = 16 }: { row: ResultRow; onBuy: () => void; size?: 16 | 17 }) {
  const price = priceFor(row.tld) ?? priceFor('.com')!
  return (
    <div className="flex h-[72px] items-center justify-between gap-6 rounded-[16px] px-5 py-4 transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#ffffff0a]">
      <p
        className="min-w-0 flex-1 truncate font-medium leading-normal text-white"
        style={{ fontSize: size }}
      >
        {row.domain}
      </p>
      <div className="flex h-10 flex-none items-center gap-8">
        <PriceStack register={price.register} renew={price.renew} note={price.note} />
        <RowButton label={{ en: 'Buy', uk: 'Купити' }} onClick={onBuy} />
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
 * The footer bar under every result list — redesigned Sep 2026 (Figma 27729:16043).
 *
 * "Show more" is CENTRED in the bar while "400+ more available" sits on the left.
 * The mockup centres it the honest way — with a second, invisible copy of the
 * left label balancing the row — and so does this: `justify-between` plus a
 * hidden twin keeps the button on the bar's true centre at any width, which a
 * flex-1 spacer would not do once the left label changes length in another
 * language.
 */
function ListFooter({ onShowMore }: { onShowMore?: () => void }) {
  const { t } = useT()
  const more = t({ en: '400+ more available', uk: 'Ще 400+ вільних' })
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
 * Material is the results screen's, not the mid-fi board's flat greys: the taken
 * answer and the available answer are the same screen wearing two faces.
 */
function TakenCard({
  domain, registrar, onClaim,
}: { domain: string; registrar: string; onClaim: () => void }) {
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
        <p className="mt-1.5 text-[13px] leading-none text-[#ffffff7a]">
          {t({ en: `Registered at ${registrar}`, uk: `Зареєстровано на ${registrar}` })}
        </p>
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
  const [best, ...rest] = AI_SUGGESTIONS

  return (
    <motion.div
      variants={listSwap}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex min-h-0 flex-1 flex-col"
    >
      {/* ------------------------------------ page sheet: the lists (27085:107102) */}
      <div className="flex min-h-0 flex-1 justify-center gap-8 rounded-t-[8px] border-t border-[#ffffff0a] bg-[var(--gray-900)] px-8 pb-2 pt-2">
        {/* Existing domains — only when the account holds any (26181:34790).
            Name + outlined Connect, nothing else: owned domains have no price. */}
        {owned.length > 0 && (
          <motion.div variants={listSwapItem} className="flex min-h-0 min-w-0 max-w-[1200px] flex-1 flex-col">
            <div className="flex h-16 flex-none items-center px-4">
              <h3 className="font-display text-[18px] font-semibold text-[#f5f5fa]">
                {t({ en: 'Existing domains', uk: 'Наявні домени' })}
              </h3>
            </div>
            <div className="min-h-0 flex-1 rounded-[16px] border border-[#ffffff0a] bg-[#ffffff08] p-2">
              <ScrollArea className="h-full">
                {owned.map((o, i) => (
                  <div key={o.domain}>
                    {i > 0 && <div className="mx-5 h-px bg-[#ffffff0a]" aria-hidden />}
                    <div className="flex h-[72px] items-center justify-between rounded-[16px] px-5 transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#ffffff0a]">
                      <p className="min-w-0 truncate text-[17px] font-medium text-white">{o.domain}</p>
                      {/* Same sheet the search's "You own this" screen opens
                          (`connect-owned`, 27071:20574 / 20591): both entrances to
                          "attach a domain I already have" land in one designed
                          modal, and the in-use warning lives there, once. */}
                      <RowButton
                        label={{ en: 'Connect', uk: 'Підключити' }}
                        onClick={() => openDomainModal('connect-owned', o.domain)}
                      />
                    </div>
                  </div>
                ))}
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

          {/* Best-match hero (27085:107276): purple tint, gradient rim fading out */}
          <div className="flex-none">
            <BestMatchCard row={best} onBuy={() => openDomainModal('buy', best.domain)} />
          </div>

          {/* suggestion list (27085:107303): one card, hairline dividers, own scroll */}
          <div className="mt-4 min-h-0 flex-1 rounded-[16px] border border-[#ffffff0a] bg-[#ffffff08] py-2 pl-2 pr-3">
            <ScrollArea className="h-full">
              {/* the dashboard board insets its dividers by 20; the results lists
                  run them full-width — kept apart on purpose */}
              {rest.map((sg, i) => (
                <Fragment key={sg.domain}>
                  {i > 0 && <div className="mx-5 h-px bg-[#ffffff0a]" aria-hidden />}
                  <DomainRow row={sg} size={17} onBuy={() => openDomainModal('buy', sg.domain)} />
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
  const { activeDomain, openDomainModal } = useUI()
  const term = activeDomain ?? 'fit-ration'
  const buy = (domain: string) => openDomainModal('buy', domain)
  const exact = exactMatch(term)

  /* Two answers, one screen: the search field above never moves, only what is
     under it changes hands (see SearchHeader). */
  if (exact.taken) return <TakenResults term={term} exact={exact} onBuy={buy} />

  return (
    <ResultsSheet>
      <motion.div variants={listSwapItem}>
        <BestMatchCard row={exact} onBuy={() => buy(exact.domain)} />
      </motion.div>

      <ResultBlock
        label={{ en: 'Featured', uk: 'Обране' }}
        rows={featuredEndings(term)}
        onBuy={buy}
      />
      <ResultBlock
        label={{ en: 'Popular', uk: 'Популярні' }}
        rows={popularEndings(term)}
        onBuy={buy}
      />
      <ResultBlock
        label={{ en: 'Suggested', uk: 'Пропозиції' }}
        rows={nameIdeas(term)}
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
  const { openDomainModal } = useUI()
  /* The list is what made the row taken, so the registrar is always there; the
     fallback only exists so a hand-set `taken` row can never render "undefined". */
  const registrar = registrarOf(exact.domain) ?? 'GoDaddy'

  return (
    <ResultsSheet>
      <motion.div variants={listSwapItem}>
        <TakenCard
          domain={exact.domain}
          registrar={registrar}
          onClaim={() => openDomainModal('connect-owned', exact.domain)}
        />
      </motion.div>

      <motion.div variants={listSwapItem} className="flex flex-col">
        <SectionTitle label={{ en: 'Close alternatives', uk: 'Близькі варіанти' }} />
        <PlainList rows={closeAlternatives(term)} onBuy={onBuy} />
      </motion.div>

      <motion.div variants={listSwapItem} className="flex flex-col">
        <IdeasTitle name={brandLabel(exact.domain)} />
        <PlainList rows={takenIdeas(term)} onBuy={onBuy} />
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
  const { activeDomain, openDomainModal } = useUI()
  const { t } = useT()
  const domain = activeDomain ?? CUSTOM_DOMAIN

  /* ITERATION 2 — OUT OF SCOPE, left reachable exactly as it was. A domain of ours
     whose settings are managed at another company cannot be attached by writing
     records on our side, so it needs its own flow (㉘ A2 gives it one, and calls the
     CTA "Show me what to change"). Not developed here, not deleted either. */
  if (world.inventory === 'dh-external-ns') return <ExternalNsScreen domain={domain} />

  return (
    <ResultsSheet>
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
            <p className="mt-1.5 text-[13px] leading-none text-[#ffffff7a]">
              {t({
                en: 'You own this — registered with DreamHost · free to connect',
                uk: 'Це ваш домен — зареєстрований у DreamHost · підключення безкоштовне',
              })}
            </p>
          </div>
          {/* The one blue thing on the screen: nothing else here is an action. */}
          <button
            onClick={() => openDomainModal('connect-owned', domain)}
            className="h-9 min-w-[110px] flex-none rounded-[8px] bg-[var(--action)] px-4 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
          >
            {t({ en: 'Connect', uk: 'Підключити' })}
          </button>
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
  const { goDomains, closeSurface } = useUI()
  const { t } = useT()

  /* The connection itself is READ in the Publish panel from here on (designer,
     13.09.2026), so attaching closes this window and opens that one — the clock in
     modules/domains/connect.ts walks the states it shows. */
  const connect = () => {
    closeSurface()
    startConnect(domain)
  }

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

/** External domain: registrar detected, guided manual path. No Domain Connect promises. */
function ExternalScreen() {
  const { set } = useWorld()
  const { activeDomain, goDomains, closeSurface } = useUI()
  const { t } = useT()
  const domain = activeDomain ?? 'emberandoak.com'

  const start = () => {
    set({ inventory: 'external-manual' })
    closeSurface()
    startConnect(domain)
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
        {t({
          en: 'Registered at GoDaddy. It stays there — no transfer needed.',
          uk: 'Зареєстровано на GoDaddy. Він там і залишиться — переносити не треба.',
        })}
      </p>

      {/* De-jargoned records card: two named values, copy buttons, inline guide. */}
      <div className="mt-5 rounded-control border border-[var(--gray-800)] bg-[var(--gray-850)] p-4">
        <p className="text-[13px] font-semibold text-[var(--white-700)]">
          {t({ en: 'Point your domain to us — 2 lines to paste at GoDaddy', uk: 'Спрямуйте домен до нас — 2 рядки вставити на GoDaddy' })}
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
          {t({
            en: 'In GoDaddy: My Products → your domain → DNS. Paste both lines, save, come back here.',
            uk: 'На GoDaddy: My Products → ваш домен → DNS. Вставте обидва рядки, збережіть і поверніться сюди.',
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
  const { world } = useWorld()
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
  const owned = OWNED_DOMAINS[world.inventory] ?? []

  const submit = () => {
    const q = query.trim().toLowerCase()
    if (!q) return
    /*
     * Intent detection, prototype-grade, in the order the boards answer:
     *  - a domain sitting in the DreamHost account short-circuits to "You own
     *    this" (㉗④ 27271:5564) — ownership known, nothing to decide;
     *  - a name that is already registered opens the taken answer (㉗③
     *    27270:5623), which is also where a person whose domain it IS finds
     *    "This is my domain", so that path stays open through this branch;
     *  - anything else with a dot reads as a domain pasted from elsewhere;
     *  - a bare name is a plain search.
     * The taken test runs on the exact match rather than the raw string, so
     * "trulieve" and "trulieve.com" answer identically — the hero is .com either
     * way (see exactMatch).
     */
    if (owned.some((o) => o.domain === q)) goDomains('own', q)
    else if (isTaken(exactMatch(q).domain)) goDomains('results', q)
    else if (q.includes('.') && !q.endsWith('.')) goDomains('external', q)
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
          compact={domainScreen === 'results'}
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