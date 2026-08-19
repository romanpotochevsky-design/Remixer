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
import { useState } from 'react'
import { useWorld, isCustomDomainActive } from '@/state/world'
import { useUI, type DomainScreen } from '@/state/ui'
import { useT, type Text } from '@/i18n'
import {
  AI_SUGGESTIONS, OWNED_DOMAINS, CUSTOM_DOMAIN, priceFor,
  exactMatch, otherEndings, nameIdeas, type ResultRow,
  isPhrase, looksLikeDomain, registrarFor, closeAlternatives, phraseIdeas,
} from '@/data/domains'
import { ScrollArea } from '@/ui/ScrollArea'
import {
  IconSearch, IconArrowRight, IconGlobe, IconClose, IconSparkleAI,
  IconAIMark, IconChevronDown,
} from '@/ui/icons'
import { listSwap, listSwapItem } from '@/ui/motion'


/* ------------------------------------------------------------------ shared bits */


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

/** Price stack: big figure + honest renewal line (never hidden — audit rule). */
function PriceStack({ register, renew, strike }: { register: number; renew: number; strike?: boolean }) {
  const { t } = useT()
  return (
    <div className="flex flex-col items-end gap-[5px]">
      <p className="flex items-baseline gap-1 leading-none">
        {strike && (
          <span className="font-display text-[15px] text-[#ffffff7a] line-through">${renew.toFixed(2)}</span>
        )}
        <span className="font-display text-[18px] font-medium text-[#f5f5fa]">${register.toFixed(2)}</span>
      </p>
      <p className="font-display text-[12px] font-medium leading-none text-[#ffffff7a]">
        {t({ en: `Renews at $${renew.toFixed(2)}`, uk: `Продовження $${renew.toFixed(2)}` })}
      </p>
    </div>
  )
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
  /* The verb dictionary is Add = buy · Connect = yours, and a list must never
     cross it: offering to BUY a name that is sitting in "Existing domains" one
     column over would be the product contradicting itself. Owned names drop out
     of the AI pool; the hero is simply the best remaining. */
  const ownedNames = new Set(owned.map((o) => o.domain))
  const [best, ...rest] = AI_SUGGESTIONS.filter((sg) => !ownedNames.has(sg.domain))
  const bestPrice = priceFor(best.tld)!

  /* The one custom domain this world models. While it is anywhere on its way to
     (or at) live, its row stops being an invitation: the state replaces the
     button, in the same colours the topbar dot uses. */
  const rowState = (d: string): { label: Text; tone: 'live' | 'progress' } | null => {
    if (d !== CUSTOM_DOMAIN || !isCustomDomainActive(world)) return null
    if (world.domain === 'live' || world.domain === 'multiple' || world.domain === 'icann-hold')
      return { label: { en: 'Connected', uk: 'Підключено' }, tone: 'live' }
    if (world.domain === 'unreachable') return null // failed = free to try again
    return { label: { en: 'Connecting…', uk: 'Підключається…' }, tone: 'progress' }
  }

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
                      {(() => {
                        const st = rowState(o.domain)
                        if (!st) return (
                          <RowButton
                            label={{ en: 'Connect', uk: 'Підключити' }}
                            onClick={() => openDomainModal('connect-existing', o.domain)}
                          />
                        )
                        return (
                          <span className="flex flex-none items-center gap-2 pr-1 text-[13px] font-medium"
                            style={{ color: st.tone === 'live' ? 'var(--live)' : 'var(--attention)' }}>
                            <span className="h-1.5 w-1.5 rounded-full"
                              style={{ background: st.tone === 'live' ? 'var(--live)' : 'var(--attention)' }} aria-hidden />
                            {t(st.label)}
                          </span>
                        )
                      })()}
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
          <div
            className="relative flex-none rounded-[16px] px-1 pb-1"
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
            <div className="flex h-[94px] items-center justify-between rounded-[14px] border border-[#ffffff0a] bg-[#1d1d1f] px-6">
              <div className="min-w-0 pb-1">
                <p className="truncate text-[22px] font-medium leading-normal text-white">{best.domain}</p>
                <p className="mt-[7px] truncate text-[13px] leading-normal text-[#ffffff7a]">{t(best.reason)}</p>
              </div>
              <div className="flex flex-none items-center gap-8">
                {/* honest promo: first-year price big, regular price struck */}
                <PriceStack register={bestPrice.register} renew={bestPrice.renew} strike />
                <button
                  onClick={() => openDomainModal('buy', best.domain)}
                  className="h-9 flex-none rounded-[8px] bg-[var(--action)] px-3.5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
                >
                  {t({ en: 'Buy', uk: 'Купити' })}
                </button>
              </div>
            </div>
          </div>

          {/* suggestion list (27085:107303): one card, hairline dividers, own scroll */}
          <div className="mt-4 min-h-0 flex-1 rounded-[16px] border border-[#ffffff0a] bg-[#ffffff08] py-2 pl-2 pr-3">
            <ScrollArea className="h-full">
              {rest.map((sg, i) => {
                const price = priceFor(sg.tld)!
                return (
                  <div key={sg.domain}>
                    {i > 0 && <div className="mx-5 h-px bg-[#ffffff0a]" aria-hidden />}
                    <div className="flex h-[72px] items-center justify-between gap-6 rounded-[16px] px-5 transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#ffffff0a]">
                      <div className="min-w-0 pb-0.5">
                        <p className="truncate text-[17px] font-medium leading-normal text-white">{sg.domain}</p>
                        <p className="mt-1 truncate text-[13px] leading-normal text-[#ffffff7a]">{t(sg.reason)}</p>
                      </div>
                      <div className="flex flex-none items-center gap-8">
                        <PriceStack register={price.register} renew={price.renew} />
                        <RowButton label={{ en: 'Buy', uk: 'Купити' }} onClick={() => openDomainModal('buy', sg.domain)} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </ScrollArea>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

/**
 * One result row — the same 72px component in both lists (Figma 27257:14000).
 * Name, the reason it is here, both prices, one outlined verb.
 */
function ResultRowItem({ row, onBuy }: { row: ResultRow; onBuy: () => void }) {
  const { t } = useT()
  const price = priceFor(row.tld) ?? priceFor('.com')!
  return (
    <div className="flex h-[72px] items-center justify-between gap-6 rounded-[16px] px-5 py-4 transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#ffffff0a]">
      <div className="min-w-0 flex-1 pb-0.5">
        <p className="truncate text-[16px] font-medium leading-none text-white">{row.domain}</p>
        <p className="mt-1 truncate text-[13px] leading-none text-[#ffffff52]">{t(row.reason)}</p>
      </div>
      <div className="flex h-10 flex-none items-center gap-8">
        <div className="flex flex-col items-end gap-1.5">
          <p className="font-display text-[18px] font-medium leading-none text-[#f5f5fa]">
            ${price.register.toFixed(2)}
          </p>
          <p className="font-display text-[12px] font-medium leading-none text-[#ffffff7a]">
            {t({ en: `Renews at $${price.renew.toFixed(2)}`, uk: `Продовження $${price.renew.toFixed(2)}` })}
          </p>
        </div>
        <RowButton label={{ en: 'Buy', uk: 'Купити' }} onClick={onBuy} />
      </div>
    </div>
  )
}

/** Rows separated by a hairline with 2px of air either side, none after the last. */
function RowList({ rows, onBuy, border }: { rows: ResultRow[]; onBuy: (d: string) => void; border: string }) {
  return (
    <div className={`rounded-[16px] border bg-[#ffffff08] p-2 ${border}`}>
      {rows.map((r, i) => (
        <div key={r.domain}>
          {i > 0 && <div className="my-0.5 h-px bg-[#ffffff0a]" aria-hidden />}
          <ResultRowItem row={r} onBuy={() => onBuy(r.domain)} />
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------- result heroes */

/**
 * The exact-match hero — gradient wash under a ring-masked gradient rim.
 *
 * ⚠️ The rim is a ring MASK, not a second background layer under the fill: the fill
 * is 10% alpha, so an opaque gradient behind it shows through whole and the card
 * came out a solid violet bar.
 */
function BestMatchHero({ row, eyebrow, onBuy }: { row: ResultRow; eyebrow: Text; onBuy: () => void }) {
  const { t } = useT()
  const price = priceFor(row.tld) ?? priceFor('.com')!
  return (
    <motion.div
      variants={listSwapItem}
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
          {t(eyebrow)}
        </span>
      </div>
      <div className="flex h-[94px] items-center justify-between gap-6 rounded-[14px] border border-[#ffffff0a] bg-[#1f1f22] px-6">
        <div className="min-w-0 flex-1 pb-1">
          <p className="truncate text-[22px] font-medium leading-none text-white">{row.domain}</p>
          <p className="mt-[7px] truncate text-[13px] leading-none text-[#ffffff7a]">{t(row.reason)}</p>
        </div>
        <div className="flex h-10 flex-none items-center gap-8">
          {/* the promo says itself: list price struck, first year large */}
          <PriceStack register={price.register} renew={price.renew} strike />
          <button
            onClick={onBuy}
            className="h-9 flex-none rounded-[8px] bg-[var(--action)] px-3.5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
          >
            {t({ en: 'Buy', uk: 'Купити' })}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * The taken hero — ㉗ `3 занят`.
 *
 * Deliberately NOT the gradient card: this is not a match, it is a wall, and dressing
 * a refusal in the brand's celebratory chrome would be a lie told in colour. Flat
 * surface, a `Taken` chip, and the registrar named.
 *
 * Three decisions here are load-bearing and traceable:
 *  - **"This is my domain", never "You own this."** Nothing in a registry lookup says
 *    the searcher is the registrant. The conditional verb is the honest one, and it
 *    matches every platform in the research set.
 *  - **The registrar is named.** RDAP returns the sponsoring registrar as registry-level
 *    data that WHOIS privacy does not hide, so this is a fact, not a guess. (The real
 *    product needs a silent fallback for the ~40% of ccTLDs that are WHOIS-text only —
 *    say nothing rather than invent.)
 *  - **No price and no "Make an offer".** DreamHost has no brokerage and sells no
 *    premium names, so there is nothing to quote. The pivot is alternatives.
 */
function TakenHero({ domain, onClaim }: { domain: string; onClaim: () => void }) {
  const { t } = useT()
  const registrar = registrarFor(domain)
  return (
    <motion.div
      variants={listSwapItem}
      className="flex min-h-[94px] items-center justify-between gap-6 rounded-[16px] border border-[#ffffff14] bg-[#ffffff08] px-6 py-5"
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-3">
          <p className="truncate text-[22px] font-medium leading-none text-[#ffffffa3]">{domain}</p>
          <span className="grid h-[22px] flex-none place-items-center rounded-[6px] bg-[#ffffff14] px-2 text-[12px] font-medium leading-none text-[#ffffffa3]">
            {t({ en: 'Taken', uk: 'Зайнято' })}
          </span>
        </div>
        <p className="mt-[9px] truncate text-[13px] leading-none text-[#ffffff7a]">
          {t({
            en: `Registered at ${registrar} · if it’s yours, it stays there — no transfer needed`,
            uk: `Зареєстровано на ${registrar} · якщо він ваш, там і залишиться — переносити не треба`,
          })}
        </p>
      </div>
      <RowButton label={{ en: 'This is my domain', uk: 'Це мій домен' }} onClick={onClaim} />
    </motion.div>
  )
}

/** A list section header — the AI mark, a title, and the line that says where it came from. */
function ListHeading({ title, note }: { title: Text; note: Text }) {
  const { t } = useT()
  return (
    <motion.div variants={listSwapItem} className="flex items-center justify-between px-2 pb-[22px] pt-[31px]">
      <div className="flex items-center gap-2.5">
        <IconAIMark size={24} />
        <h3 className="font-display text-[18px] font-semibold text-[#f5f5fa]">{t(title)}</h3>
      </div>
      <p className="text-[13px] text-[#ffffff7a]">{t(note)}</p>
    </motion.div>
  )
}

/**
 * Search results — Figma 27729:14650, with the two states from ㉗ that the hi-fi
 * board never got: `2 фраза` and `3 занят`.
 *
 * One screen, three modes, because what the person typed is a different QUESTION
 * each time and the answer has to be ordered to match:
 *
 *  - **word** — a bare name. First the CLASSIC registrar answer: the exact name as a
 *    hero, then the same name in other endings. That is what someone who typed a name
 *    is asking for, and burying it under AI output would be a category error. The AI
 *    block comes second, offering other NAMES.
 *  - **phrase** — a description, not a name. The naming stage is not over, so this is
 *    the one case where inventing names is the whole point and the AI block LEADS.
 *    There is no exact match to show: `odesa coffee roasters` is not an address.
 *  - **taken** — a specific address that is already registered. The classic answer is
 *    "no", said plainly, and then the two real exits: claim it if it is theirs, or
 *    take a near neighbour.
 *
 * The mode is derived from the query, never stored: the header field is the only
 * input, and a mode kept in state would drift out of step with what is in it.
 *
 * ⚠️ Availability is faked deterministically — a full address typed with its ending
 * reads as taken, a bare word reads as available. The real product asks RDAP. The
 * rule is at least stable, which is what a demo needs: the same query always answers
 * the same way in front of an audience.
 */
type ResultsMode = 'word' | 'phrase' | 'taken'

function ResultsScreen() {
  const { activeDomain, openDomainModal } = useUI()
  const term = activeDomain ?? 'fit-ration'

  const mode: ResultsMode = isPhrase(term) ? 'phrase' : looksLikeDomain(term) ? 'taken' : 'word'
  const buy = (d: string) => openDomainModal('buy', d)

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
          {/* Page pads 32 all round; the lists column inside it is a flat 1200
              wide and centred — the padding must sit OUTSIDE the max-width or
              the column comes out 64px narrow. */}
          <div className="px-8 pb-2 pt-8">
          <div className="mx-auto w-full max-w-[1200px]">
            {mode === 'word' && <WordResults term={term} onBuy={buy} />}
            {mode === 'phrase' && <PhraseResults term={term} onBuy={buy} />}
            {mode === 'taken' && (
              <TakenResults
                term={term}
                onBuy={buy}
                onClaim={() => openDomainModal('connect-external', term)}
              />
            )}
          </div>
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  )
}

/** `1 слово` — the classic answer first, AI names second. */
function WordResults({ term, onBuy }: { term: string; onBuy: (d: string) => void }) {
  const { t } = useT()
  const hero = exactMatch(term)
  return (
    <>
      {/* ------------------------------------- classic results (27729:15438) */}
      <div className="flex flex-col gap-4">
        <BestMatchHero
          row={hero}
          eyebrow={{ en: 'Best match', uk: 'Найкращий збіг' }}
          onBuy={() => onBuy(hero.domain)}
        />

        {/* the same name in other endings, plus the "there are more" footer */}
        <motion.div variants={listSwapItem} className="rounded-[16px] border border-[#ffffff14]">
          <RowList rows={otherEndings(term)} border="border-[#2a2a2d]" onBuy={onBuy} />
          <div className="flex h-16 items-center justify-between pb-2 pl-2 pr-5 pt-4">
            <button className="flex h-10 items-center gap-2 rounded-[10px] py-2.5 pl-3 pr-2 text-[15px] font-semibold text-[#ffffff7a] opacity-80 transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:opacity-100">
              {t({ en: 'Show more endings', uk: 'Більше закінчень' })}
              <IconChevronDown size={20} />
            </button>
            <p className="text-[15px] text-[#ffffff52]">
              {t({ en: '400+ more available', uk: 'Ще 400+ вільних' })}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ---------------------------------- AI name ideas (27729:15591).
          Butts straight against the block above — the air comes from this
          header's own 31px top padding, exactly as drawn. */}
      <ListHeading
        title={{ en: 'Name ideas for your site', uk: 'Ідеї назв для вашого сайту' }}
        note={{
          en: `Generated from “${term}” and your site description.`,
          uk: `Згенеровано з «${term}» та опису вашого сайту.`,
        }}
      />
      <motion.div variants={listSwapItem}>
        <RowList rows={nameIdeas(term)} border="border-[#ffffff0a]" onBuy={onBuy} />
      </motion.div>
    </>
  )
}

/**
 * `2 фраза` — they described the site instead of naming it.
 *
 * The AI block leads and there is no exact-match row, because there is nothing to
 * match: a sentence is not an address. Every row leads with the domain and explains
 * itself by spelling out how it READS as a brand — "«Roasters Coffee» — closest to
 * what you typed" — which is the per-name rationale the research found nobody in the
 * field bothers with.
 */
function PhraseResults({ term, onBuy }: { term: string; onBuy: (d: string) => void }) {
  const { t } = useT()
  const ideas = phraseIdeas(term)
  const [lead, ...rest] = ideas
  return (
    <>
      <ListHeading
        title={{ en: 'Names for your site', uk: 'Назви для вашого сайту' }}
        note={{
          en: `You described your site, so these are new names — all available.`,
          uk: 'Ви описали сайт, тож це нові назви — усі вільні.',
        }}
      />
      <div className="flex flex-col gap-4">
        <BestMatchHero
          row={lead}
          eyebrow={{ en: 'Closest to your idea', uk: 'Найближче до вашої ідеї' }}
          onBuy={() => onBuy(lead.domain)}
        />
        <motion.div variants={listSwapItem}>
          <RowList rows={rest} border="border-[#ffffff0a]" onBuy={onBuy} />
        </motion.div>
      </div>

      {/* The way back to the classic answer. Someone who lands here and then thinks of
          a name must not have to guess that the same field takes one. */}
      <motion.p variants={listSwapItem} className="px-2 pt-6 text-[13px] leading-[1.5] text-[#ffffff52]">
        {t({
          en: 'Already have a name in mind? Type it above and we’ll check every ending.',
          uk: 'Уже маєте назву? Введіть її вище — перевіримо всі закінчення.',
        })}
      </motion.p>
    </>
  )
}

/**
 * `3 занят` — the address exists and belongs to someone.
 *
 * Order matters as much as it does in `word` mode: the answer to the question asked
 * comes first, even when the answer is no. Then the two exits, in the order a real
 * person needs them — "it's mine" before "give me another", because the customer who
 * owns it is the one who will otherwise abandon.
 */
function TakenResults({
  term, onBuy, onClaim,
}: { term: string; onBuy: (d: string) => void; onClaim: () => void }) {
  const { t } = useT()
  const stemmed = term.split('.')[0]
  const alts = closeAlternatives(term)
  /* Both lists derive from the same stem, so their generators can collide
     (get<name>.com lives in each). One name offered twice reads as a glitch —
     the ideas list yields to the alternatives above it. */
  const ideas = nameIdeas(term).filter((r) => !alts.some((a) => a.domain === r.domain))
  return (
    <>
      <div className="flex flex-col gap-4">
        <TakenHero domain={term} onClaim={onClaim} />

        <motion.div variants={listSwapItem} className="rounded-[16px] border border-[#ffffff14]">
          <div className="flex h-12 items-center px-6">
            <p className="text-[14px] font-semibold text-[#f5f5fa]">
              {t({ en: 'Close alternatives', uk: 'Близькі варіанти' })}
            </p>
          </div>
          <RowList rows={alts} border="border-[#2a2a2d]" onBuy={onBuy} />
        </motion.div>
      </div>

      <ListHeading
        title={{ en: `More ideas for “${stemmed}”`, uk: `Більше ідей для «${stemmed}»` }}
        note={{
          en: 'Different names, same site — each with why it works.',
          uk: 'Інші назви для того самого сайту — і чому кожна працює.',
        }}
      />
      <motion.div variants={listSwapItem}>
        <RowList rows={ideas} border="border-[#ffffff0a]" onBuy={onBuy} />
      </motion.div>
    </>
  )
}

/* ------------------------------------------------------------------ surface */

const SCREENS: Record<DomainScreen, () => JSX.Element> = {
  home: HomeScreen,
  results: ResultsScreen,
}

export function DomainsSurface() {
  const { domainScreen, closeSurface, goDomains, openDomainModal } = useUI()
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
  const owned = OWNED_DOMAINS[world.inventory] ?? []

  const submit = () => {
    const q = query.trim().toLowerCase()
    if (!q) return
    /*
     * Two outcomes, and only one of them is a decision.
     *
     * A name already in this account is not a search — there is nothing to look up
     * and nothing to price — so it opens the confirm sheet directly. Typing it and
     * clicking its Connect button in the list are the same intent and must land in
     * the same place; they used not to, and which one you got depended on whether
     * you reached for the mouse or the keyboard.
     *
     * EVERYTHING else is a search, including a full address like `emberandoak.com`.
     * That used to jump straight to the manual-records screen, which answered a
     * question the customer had not asked yet: they typed an address to find out
     * about it, not to start pasting DNS lines. The results screen reads the query
     * and shows the right one of its three faces (word · phrase · taken) — and the
     * taken face is where "This is my domain" lives.
     */
    if (owned.some((o) => o.domain === q)) openDomainModal('connect-existing', q)
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

      {/* Only the lists change hands. mode="wait" keeps the two sets from
          overlapping mid-flight, so the conveyor reads cleanly. */}
      <AnimatePresence mode="wait">
        <Current key={domainScreen} />
      </AnimatePresence>
    </div>
  )
}