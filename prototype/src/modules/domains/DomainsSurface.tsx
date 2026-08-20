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
import { useWorld } from '@/state/world'
import { useUI, type DomainScreen } from '@/state/ui'
import { useT, type Text } from '@/i18n'
import {
  AI_SUGGESTIONS, OWNED_DOMAINS, CUSTOM_DOMAIN, STAGING_HOST, priceFor, isTaken, hasKnownEnding,
  registrarFor, exactMatch, otherEndings, nameIdeas, type ResultRow,
} from '@/data/domains'
import { ScrollArea } from '@/ui/ScrollArea'
import {
  IconSearch, IconArrowRight, IconGlobe, IconClose, IconSparkleAI,
  IconAIMark, IconChevronDown,
} from '@/ui/icons'
import { surface, listSwap, listSwapItem } from '@/ui/motion'
import { ConnectChecklist, connectStage } from './ConnectChecklist'


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
  const bestPrice = priceFor(best.tld)!

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
                      <RowButton
                        label={{ en: 'Connect', uk: 'Підключити' }}
                        onClick={() => openDomainModal('connect-existing', o.domain)}
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

/**
 * Search results — Figma 27729:14650.
 *
 * Two blocks, and the order is the point. First the CLASSIC registrar answer: the
 * exact name as a hero, then the same name in other endings — that is what a
 * person who typed a name is actually asking for, and burying it under AI output
 * would be a category error. Only then the AI block, which offers other NAMES,
 * each carrying the reason it was picked.
 *
 * THE TAKEN STATE lives on the hero, added 20 Aug 2026. The mockup draws every row as
 * available, which is the one thing a real search never does — a person types the name of
 * their own coffee shop and the .com is gone. There is still no Figma frame for it
 * (OPEN-QUESTIONS 01), and the design settled here is NOT a verdict but a question.
 *
 * There is no system-level difference between "taken" and "mine": one name is registered,
 * and who holds it is unknown to us. `research/connect.md` §7 and the own-domain block of
 * `research/search.md` are unanimous — no platform verifies ownership at search or entry
 * time; Shopify, Wix, Squarespace and Netlify all phrase it conditionally and let the
 * record change be the proof, and Netlify's "[domain] already has an owner. Is it you?" is
 * the pattern the research names to copy. So: state the registrar (RDAP, registry-level,
 * never redacted for gTLDs), ask about the rest, and give the question two real exits —
 * yes goes to the connect path, no is the list of alternatives already sitting underneath.
 * Asking it here, on the results screen, is the thing no competitor does: everyone else
 * makes the person find a separate "connect a domain you own" entry point.
 *
 * Never a brokerage, never "Make an offer", never a premium price — DreamHost has none of
 * those and DECISIONS 03 makes that permanent. Never a bare "unavailable" with no way out.
 */
function ResultsScreen() {
  const { activeDomain, openDomainModal, goDomains } = useUI()
  const { world } = useWorld()
  const { t } = useT()
  const term = activeDomain ?? 'fit-ration'

  /* The ownership question outranks anything we could sell, so it takes the top block —
     the hero position, above the other endings and the name ideas. It is not a second row
     next to the Best match: when the name is registered there is no Best match to buy. */
  const registrar = registrarFor(world.inventory)
  /* The only ownership we may state is account membership: that domain is referenced in
     the account, so we know. For every other registered name — including the one the
     external situations stage — we do not, and `research/connect.md` §7 says nobody does
     at this moment. The affirmative therefore routes to the screen that can actually settle
     it: the record change at the other company IS the proof, which is why it is deferred. */

  const hero = exactMatch(term)
  const inAccount = (OWNED_DOMAINS[world.inventory] ?? []).some((o) => o.domain === hero.domain)
  const heroPrice = priceFor(hero.tld)!
  const heroTaken = isTaken(hero.domain)
  const endings = otherEndings(term)
  const ideas = nameIdeas(term)

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
            {/* ------------------------------------- classic results (27729:15438) */}
            <div className="flex flex-col gap-4">
              {/* exact-match hero: gradient wash under a ring-masked gradient rim */}
              {/* Same box, same geometry, two states. The purple wash and the gradient
                  rim are the buy celebration and they do not travel to a name that is
                  already registered — that one gets the flat surface, no price and an
                  outlined button, so it cannot be mistaken for something on sale. */}
              <motion.div
                variants={listSwapItem}
                className="relative rounded-[16px] px-1 pb-1"
                style={
                  heroTaken
                    ? { background: 'var(--white-100)' }
                    : { background: 'linear-gradient(90deg, rgba(174,93,255,0.10), rgba(77,114,255,0.02))' }
                }
              >
                {!heroTaken && <i className="bestmatch-rim" aria-hidden />}
                <div className="flex h-10 items-center pl-6 pr-4">
                  {heroTaken ? (
                    /* Never "taken". That word describes someone else's domain and
                       prejudges the very question this row exists to ask; "registered" is
                       the fact, and it is the same fact whether the owner is a stranger or
                       the person reading it. */
                    <span className="font-display text-[14px] font-semibold text-[#ffffff7a]">
                      {t({ en: 'Already registered', uk: 'Вже зареєстровано' })}
                    </span>
                  ) : (
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
                  )}
                </div>
                <div className="flex min-h-[94px] items-center justify-between gap-6 rounded-[14px] border border-[#ffffff0a] bg-[#1f1f22] px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[22px] font-medium leading-none text-white">{hero.domain}</p>
                    {heroTaken ? (
                      <>
                        {/* Fact, then question — in that order, and the question is the
                            whole design. The fact is the registrar, which is registry-level
                            data (RDAP) and never redacted for gTLDs. The question is
                            everything else: nobody can know at this moment whether the name
                            is theirs, and per `research/connect.md` §7 no platform even
                            tries — Shopify, Wix, Squarespace and Netlify all phrase it
                            conditionally and let the record change be the proof. The shape
                            borrows Netlify's honest prompt ("… already has an owner. Is it
                            you?"), which the research names as the pattern to copy. */}
                        <p className="mt-[7px] truncate text-[13px] leading-none text-[#ffffff7a]">
                          {t({
                            en: `Registered at ${registrar}. Is it yours?`,
                            uk: `Зареєстровано на ${registrar}. Це ваш домен?`,
                          })}
                        </p>
                        {/* Both exits named in one line, because a question with one answer
                            is not a question. "Yes" is honest about the cost of yes: a
                            change the person makes themselves at the other company. That
                            is effort time, not a waiting window — STATES.md keeps the two
                            apart and exempts effort from the fact-ID rule. A domain inside
                            the DreamHost account is the opposite case and says so: zero
                            records, no other tab. */}
                        <p className="mt-[7px] text-[12.5px] leading-[1.45] text-[var(--white-300)]">
                          {inAccount
                            ? t({
                                en: 'If it is, it’s in your DreamHost account already — nothing to change anywhere else. If it isn’t, the names below are free.',
                                uk: 'Якщо так — він уже у вашому акаунті DreamHost, і нічого не треба змінювати деінде. Якщо ні — імена нижче вільні.',
                              })
                            : t({
                                en: `If it is, you make one change at ${registrar} — about five minutes of your own work, and we walk you through it. If it isn’t, the names below are free.`,
                                uk: `Якщо так — ви робите одну зміну на ${registrar}: близько пʼяти хвилин вашої роботи, і ми проведемо вас крок за кроком. Якщо ні — імена нижче вільні.`,
                              })}
                        </p>
                      </>
                    ) : (
                      <p className="mt-[7px] truncate text-[13px] leading-none text-[#ffffff7a]">{t(hero.reason)}</p>
                    )}
                  </div>
                  <div className="flex flex-none items-center gap-8">
                    {heroTaken ? (
                      /* The turn nobody in the field offers on a results screen: the
                         ownership question asked right here, instead of being hidden behind
                         a separate "connect a domain you own" entry point. Outlined, not
                         blue — the alternatives below are the other road, equally open. No
                         price (we are not selling something that may already be theirs) and
                         no brokerage in its place (DECISIONS 03). The verb is the dictionary
                         one; the "Yes" in front of it is what makes it an answer. */
                      <RowButton
                        label={{ en: 'Yes, connect it', uk: 'Так, підключити' }}
                        onClick={() => goDomains(inAccount ? 'own' : 'external', hero.domain)}
                      />
                    ) : (
                      <>
                        {/* the promo says itself: list price struck, first year large */}
                        <PriceStack register={heroPrice.register} renew={heroPrice.renew} strike />
                        <button
                          onClick={() => openDomainModal('buy', hero.domain)}
                          className="h-9 flex-none rounded-[8px] bg-[var(--action)] px-3.5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
                        >
                          {t({ en: 'Buy', uk: 'Купити' })}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* the same name in other endings, plus the "there are more" footer */}
              <motion.div variants={listSwapItem} className="rounded-[16px] border border-[#ffffff14]">
                <RowList rows={endings} border="border-[#2a2a2d]" onBuy={(d) => openDomainModal('buy', d)} />
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
            <motion.div variants={listSwapItem} className="flex items-center justify-between px-2 pb-[22px] pt-[31px]">
              <div className="flex items-center gap-2.5">
                <IconAIMark size={24} />
                <h3 className="font-display text-[18px] font-semibold text-[#f5f5fa]">
                  {t({ en: 'Name ideas for your site', uk: 'Ідеї назв для вашого сайту' })}
                </h3>
              </div>
              <p className="text-[13px] text-[#ffffff7a]">
                {t({
                  en: `Generated from “${term}” and your site description.`,
                  uk: `Згенеровано з «${term}» та опису вашого сайту.`,
                })}
              </p>
            </motion.div>
            <motion.div variants={listSwapItem}>
              <RowList rows={ideas} border="border-[#ffffff0a]" onBuy={(d) => openDomainModal('buy', d)} />
            </motion.div>
          </div>
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  )
}

/** "You own this" — the confirm for a domain already in the DreamHost account. */
function OwnScreen() {
  const { world, set } = useWorld()
  const { activeDomain, goDomains, closeSurface, togglePublish } = useUI()
  const { t } = useT()
  const domain = activeDomain ?? CUSTOM_DOMAIN
  const inUse = world.inventory === 'dh-in-use'
  const externalNs = world.inventory === 'dh-external-ns'

  /*
   * The handoff: connecting continues IN THE PUBLISH PANEL, not on a full-page screen.
   * The designer's call, 20.08.2026 — a whole page devoted to waiting is not where this
   * belongs; the panel already renders every stage of it, and the person stays in the
   * builder where the copy tells them to keep working. So: set the state, remember which
   * domain it is, close the surface, and OPEN THE PANEL — a surface that just vanished
   * with nothing appearing in its place would be worse than the page.
   *
   * `goDomains` here does not navigate anywhere (the surface closes on the next line);
   * it is the only writer of `activeDomain`, so it keeps the picked domain — and the
   * screen `Manage domains` would land on — pointing at the right thing.
   */
  const connect = () => {
    set({ domain: 'connecting' })
    goDomains('status', domain)
    closeSurface()
    togglePublish(true)
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

      {/* Guards. A stray click must never take down a live site or working email. */}
      {/*
        * The in-account collision: this domain already serves something — WordPress, a
        * parking page, an older builder site. For us that is the base case, not an edge
        * one, and `DECISIONS.md` 20 settles who resolves it: THE USER, not support.
        * Shopify's "contact support with proof of ownership" is a documented multi-year
        * community pain and Lovable/Vercel dead-end the person without even naming the
        * project holding the domain. We copy the best in the category instead — Wix,
        * whose two choices each name their OUTCOME.
        *
        * So: one screen, two named options, and no lone "are you sure?". The old single
        * confirm read `Replace site at {domain}`, which asked for a decision while
        * describing only one half of it. Copy is the collisions section of STATES.md
        * verbatim; `Cancel` is the third line, per the same section.
        */}
      {inUse && (
        <div className="mt-4 rounded-control border border-[#e5c35940] bg-[#e5c35914] p-3.5">
          <p className="text-[13px] font-semibold text-[var(--attention)]">
            {t({ en: `${domain} already shows a website`, uk: `На ${domain} вже є сайт` })}
          </p>
          <p className="mt-1 text-[13px] leading-[1.45] text-[var(--white-400)]">
            {t({
              en: 'Choose what visitors see. Nothing is deleted either way.',
              uk: 'Виберіть, що бачитимуть відвідувачі. У жодному з варіантів нічого не видаляється.',
            })}
          </p>
        </div>
      )}
      {externalNs && (
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
      )}

      {inUse ? (
        <div className="mt-5 space-y-3">
          {/* Option A — the primary one. Naming the reversal is what makes it safe to pick. */}
          <div className="rounded-control border border-[var(--gray-800)] bg-[var(--gray-850)] p-4">
            <p className="text-[15px] font-semibold leading-[1.3] text-white">
              {t({ en: `Show this new site at ${domain}`, uk: `Показувати на ${domain} цей новий сайт` })}
            </p>
            <p className="mt-1 text-[13px] leading-[1.45] text-[var(--white-500)]">
              {t({
                en: 'Your old site stays in your account, and you can switch back any time.',
                uk: 'Старий сайт залишиться у вашому акаунті — повернути його можна будь-коли.',
              })}
            </p>
            <div className="mt-3">
              <PrimaryButton label={{ en: 'Use this site', uk: 'Використати цей сайт' }} onClick={connect} />
            </div>
          </div>

          {/* Option B — a DIFFERENT outcome, not a softer wording of A: the old site keeps
              the domain and the new one keeps its own address, so nothing about the
              address changes and there is nothing to watch.
              ⚠️ Which address the new site gets is deliberately left as "a different
              address": `research/connect.md` §9 proposes `www.{domain}`, but "your site
              lives on www and the old one on the bare name" is a trap for a novice, so the
              question is open (STATES.md, collisions). Do not invent the answer here. */}
          <div className="rounded-control border border-[var(--gray-800)] p-4">
            <p className="text-[15px] font-semibold leading-[1.3] text-white">
              {t({ en: `Keep the old site at ${domain}`, uk: `Залишити на ${domain} старий сайт` })}
            </p>
            <p className="mt-1 text-[13px] leading-[1.45] text-[var(--white-500)]">
              {t({
                en: `Your new site gets a different address, and visitors to ${domain} keep seeing the old site.`,
                uk: `Новий сайт отримає іншу адресу, а відвідувачі ${domain} й далі бачитимуть старий сайт.`,
              })}
            </p>
            <button
              onClick={closeSurface}
              className="mt-3 h-11 w-full rounded-control border border-[var(--white-200)] text-[14px] font-medium text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--gray-800)]"
            >
              {t({ en: 'Keep the old one', uk: 'Залишити старий' })}
            </button>
          </div>

          <button
            onClick={() => goDomains('home')}
            className="w-full text-center text-[13px] text-[var(--white-400)] transition-colors duration-[var(--dur-fast)] ease-std hover:text-[var(--white-700)]"
          >
            {t({ en: 'Cancel', uk: 'Скасувати' })}
          </button>
        </div>
      ) : (
        <div className="mt-5">
          <PrimaryButton label={{ en: 'Connect', uk: 'Підключити' }} onClick={connect} />
        </div>
      )}
      {!inUse && !externalNs && (
        <p className="mt-2 text-center text-[12.5px] text-[var(--white-300)]">
          {t({ en: 'Under a minute · nothing to configure', uk: 'Менше хвилини · нічого не треба налаштовувати' })}
        </p>
      )}
    </Screen>
  )
}

/** External domain: registrar detected, guided manual path. No Domain Connect promises. */
function ExternalScreen() {
  const { world, set } = useWorld()
  const { activeDomain, goDomains, closeSurface, togglePublish } = useUI()
  const { t } = useT()
  const domain = activeDomain ?? 'emberandoak.com'
  /* The registrar was hardcoded "GoDaddy" on every path. Once the external situations own a
     domain, the row one click back names Namecheap or Cloudflare — and this screen answered
     with a third company. Same source for both now (`registrarFor`), so the sentence cannot
     drift from the row that led here. GoDaddy stays the fallback for a hand-typed domain in
     a bucket that knows nothing about it. */
  const registrar = registrarFor(world.inventory)

  const start = () => {
    /* Only the domain state moves. This used to also write `inventory: 'external-manual'`,
       silently rewriting the world axis mid-flow — and doing it on a screen that says
       "Registered at GoDaddy", which is `external-dc`: the button contradicted the
       sentence above it. The inventory axis describes what the customer HAS; it is set by
       the scenario, never by a click inside one. */
    set({ domain: 'connecting' })
    /* Same handoff as OwnScreen: the wait continues in the Publish panel, and the
       full-page status screen is not where this flow goes any more. See the comment
       on `connect` there for why, and for what `goDomains` is doing on a screen that
       is about to close. */
    goDomains('status', domain)
    closeSurface()
    togglePublish(true)
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
          en: `Registered at ${registrar}. It stays there — no transfer needed.`,
          uk: `Зареєстровано на ${registrar}. Він там і залишиться — переносити не треба.`,
        })}
      </p>

      {/* De-jargoned records card: two named values, copy buttons, inline guide. */}
      <div className="mt-5 rounded-control border border-[var(--gray-800)] bg-[var(--gray-850)] p-4">
        <p className="text-[13px] font-semibold text-[var(--white-700)]">
          {t({
            en: `Point your domain to us — 2 lines to paste at ${registrar}`,
            uk: `Спрямуйте домен до нас — 2 рядки вставити на ${registrar}`,
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
          {t({
            en: `In ${registrar}: find ${domain} in your list of domains, open its settings, paste both lines, save, and come back here.`,
            uk: `На ${registrar}: знайдіть ${domain} у списку своїх доменів, відкрийте налаштування, вставте обидва рядки, збережіть і поверніться сюди.`,
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

/**
 * Status: the named state machine — connecting → securing → live, one verb per stop.
 *
 * ⚠️ IT SURVIVES ON PURPOSE, even though connecting no longer routes here (20.08.2026 —
 * that handoff now closes the surface and opens the Publish panel instead). Two states
 * have NO OTHER HOME: `ready` (the address works, nobody ever pressed Publish) and
 * `unreachable` (the domain stopped answering). Both are reached from the toolbar's
 * address button, which is the only hand-driven way in — delete this screen and those two
 * situations become undesignable again, which is exactly the hole that was closed here
 * earlier today. The connecting stages still render here for anyone who opens
 * `Manage domains` mid-wait; they are simply not where the flow is handed off.
 *
 * FOUR stages behind THREE checklist items, and the fourth stage is the whole point:
 * the padlock cannot be issued until the address already answers here (FACTS DH-301),
 * so "Connected to your site" and "Security (SSL) on" are two events with a wait
 * between them. They used to tick together on one `stage >= 2`, which deleted
 * `securing` — the single state the checklist exists to explain. Fixed 20 Aug 2026;
 * copy and the no-button rule come verbatim from docs/features/domains/STATES.md
 * ("three items, four stages" + the `securing` card).
 */
function StatusScreen() {
  const { world, set } = useWorld()
  const { activeDomain, closeSurface } = useUI()
  const { t } = useT()
  const domain = activeDomain ?? CUSTOM_DOMAIN

  /* Stage and rows come from ConnectChecklist — the Publish panel shows the same three
     items now, and two copies of one checklist drift. */
  const stage = connectStage(world.domain)
  const done = stage === 3
  /* `securing` used to render NO BUTTON BAR AT ALL — the absence was the message: nothing
     is required of the person here (STATES.md, `securing` — "Глагол. Нет, намеренно").
     That held while a flow player advanced the state on a timer. The player was deleted on
     20.08.2026 at the designer's request (every flow is now walked by hand), which turned
     this screen into the only state you could enter and not leave: no click anywhere in the
     product moved `securing` → `live`.

     Fixed by giving it the SAME bar the other waiting states already carry — `Refresh
     status`, which advances exactly one stage per click, plus the quiet `Keep editing`
     escape. The copy still says "nothing for you to do", and that stays true of the
     DOMAIN: refreshing does not hurry the padlock, it asks whether it has arrived, which
     is the honest gesture and the one the customer will make anyway. What it must never
     become is `Try again` or `Fix` — those claim the wait is the person's to shorten. */
  const securing = stage === 2

  /*
   * `needs-attention` — its own screen, not a stage.
   *
   * The `unreachable` axis value existed with no screen behind it, so a failure fell
   * through the "Connecting" branch and told the person their broken address was
   * progress (STATES.md, disagreement 4; DECISIONS 26). Copy is the `needs-attention`
   * card verbatim: what happened, then the reassurance that the SITE is fine, then one
   * verb. No DNS vocabulary. The date and the registrar name are demo data, the same
   * grade as `emberandoak.com` elsewhere on this surface — not facts.
   *
   * `Fix this` should open the `waiting-on-you` comparison ("what's there now / what it
   * should be"); that screen is not drawn yet (OPEN-QUESTIONS 03), so it takes the
   * state-machine edge instead — needs-attention → connecting, i.e. "fixed, watching
   * again". It never says "remove it and add it again", which STATES.md forbids.
   */
  /*
   * `ready` — the address works, the project has never been published.
   *
   * STATES.md calls this "probably the most common state a novice reaches in the whole
   * flow": they connect a domain, never press Publish, and conclude it is broken. Before
   * this branch existed the prototype had nothing for it, so the situation rendered as
   * success or as a spinner — both lies. It is neither an error nor a wait: no spinner,
   * no amber, no green live dot, one blue verb.
   *
   * Copy is the `ready` card from STATES.md — MINUS its third sentence, "Publishing is
   * free". That claim was deliberately removed from this prototype on 20 Aug 2026
   * (see the HISTORY note in modules/publish/PublishPanel.tsx): publishing consumes
   * credits today (FACTS **DH-008**, `verified`), the free-publish line is our POSITION,
   * not the product's behaviour, and this artifact is read by developers who would size
   * work against it. The card's own wording predates that removal — do not paste the
   * third sentence back in on the strength of the card.
   *
   * The verb is `Publish`, the one action that resolves the state, and it takes the
   * `ready → live` edge of the state machine while clearing the pending changes.
   */
  if (world.domain === 'ready') {
    return (
      <Screen>
        <Eyebrow>{t({ en: 'Ready to publish', uk: 'Готово до публікації' })}</Eyebrow>
        <h2 className="font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.02em]">{domain}</h2>
        <p className="mt-2 text-[14px] leading-[1.5] text-[var(--white-500)]">
          {t({
            en: 'Your address is set up. Visitors will see your site the moment you publish.',
            uk: 'Вашу адресу налаштовано. Відвідувачі побачать ваш сайт, щойно ви опублікуєте.',
          })}
        </p>
        <div className="mt-5">
          <PrimaryButton
            label={{ en: 'Publish', uk: 'Опублікувати' }}
            onClick={() => set({ domain: 'live', unpublished: 0 })}
          />
        </div>
        <button
          onClick={closeSurface}
          className="mt-3 w-full text-center text-[13px] text-[var(--white-400)] transition-colors duration-[var(--dur-fast)] ease-std hover:text-[var(--white-700)]"
        >
          {t({ en: 'Keep editing', uk: 'Редагувати далі' })}
        </button>
      </Screen>
    )
  }

  if (world.domain === 'unreachable') {
    return (
      <Screen>
        <Eyebrow>{t({ en: 'Stopped showing your site', uk: 'Перестав показувати ваш сайт' })}</Eyebrow>
        <h2 className="flex items-center gap-3 font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.02em]">
          <span className="h-2.5 w-2.5 flex-none rounded-full bg-[var(--attention)]" aria-hidden />
          {domain}
        </h2>
        <p className="mt-2 text-[14px] leading-[1.5] text-[var(--white-500)]">
          {t({
            en: `Something changed at GoDaddy on 18 August. Your site is safe — it’s still at ${STAGING_HOST}.`,
            uk: `Щось змінилося на боці GoDaddy 18 серпня. Ваш сайт у безпеці — він і далі за адресою ${STAGING_HOST}.`,
          })}
        </p>
        <div className="mt-5">
          <PrimaryButton
            label={{ en: 'Fix this', uk: 'Виправити' }}
            onClick={() => set({ domain: 'connecting' })}
          />
        </div>
        <button
          onClick={closeSurface}
          className="mt-3 w-full text-center text-[13px] text-[var(--white-400)] transition-colors duration-[var(--dur-fast)] ease-std hover:text-[var(--white-700)]"
        >
          {t({ en: 'Keep editing', uk: 'Редагувати далі' })}
        </button>
      </Screen>
    )
  }

  return (
    <Screen>
      <Eyebrow>
        {done
          ? t({ en: 'Live', uk: 'Працює' })
          : securing
            ? t({ en: 'Almost there — turning on the padlock', uk: 'Майже готово — увімкнюємо замочок' })
            : t({ en: 'Connecting', uk: 'Підключення' })}
      </Eyebrow>
      <h2 className="flex items-center gap-3 font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.02em]">
        {done ? (
          <span className="h-2.5 w-2.5 flex-none rounded-full bg-[var(--live)]" aria-hidden />
        ) : (
          <span className="relative flex h-2.5 w-2.5 flex-none" aria-hidden>
            <span className="absolute h-full w-full animate-ping rounded-full bg-[var(--attention)] opacity-60" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--attention)]" />
          </span>
        )}
        {domain}
      </h2>
      <p className="mt-2 text-[14px] leading-[1.5] text-[var(--white-500)]">
        {done
          ? t({ en: 'Secure padlock on · anyone can visit.', uk: 'Захисний замочок увімкнено · сайт доступний усім.' })
          : securing
            ? t({
                en: 'Nothing for you to do. This usually takes ten to thirty minutes, sometimes a little longer.',
                uk: 'Від вас нічого не потрібно. Зазвичай це триває від десяти до тридцяти хвилин, іноді трохи довше.',
              })
            : t({
                en: 'Usually a few minutes — keep editing, it goes live on its own.',
                uk: 'Зазвичай кілька хвилин — редагуйте далі, сайт запуститься сам.',
              })}
      </p>

      <div className="mt-5 rounded-control border border-[var(--gray-800)] bg-[var(--gray-850)] p-4">
        <ConnectChecklist stage={stage} />
      </div>

      {/* One bar for every unfinished stage, `securing` included — see the note above. */}
      <div className="mt-5 flex gap-2">
        {done ? (
          <>
            <button
              onClick={closeSurface}
              className="h-11 flex-1 rounded-control bg-[var(--action)] text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
            >
              {t({ en: 'Back to editing', uk: 'Назад до редагування' })}
            </button>
            <button className="h-11 flex-1 rounded-control border border-[var(--white-200)] text-[14px] font-medium text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--gray-800)]">
              {t({ en: 'Visit site ↗', uk: 'Відкрити сайт ↗' })}
            </button>
          </>
        ) : (
          <>
            <button
              /* connecting → verifying → securing → live, ONE stage per click — the only
                 engine this story has now that the flow player is gone. The padlock is a
                 stop on this road, not a side effect of arriving: skipping it is what
                 printed "instantly secured". */
              onClick={() => set({ domain: stage === 0 ? 'verifying' : stage === 1 ? 'securing' : 'live' })}
              className="h-11 flex-1 rounded-control border border-[var(--white-200)] text-[14px] font-medium text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--gray-800)]"
            >
              {t({ en: 'Refresh status', uk: 'Оновити статус' })}
            </button>
            <button
              onClick={closeSurface}
              className="h-11 flex-1 rounded-control text-[14px] font-medium text-[var(--white-400)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--gray-800)] hover:text-[var(--white-700)]"
            >
              {t({ en: 'Keep editing', uk: 'Редагувати далі' })}
            </button>
          </>
        )}
      </div>
    </Screen>
  )
}

/* ------------------------------------------------------------------ surface */

const SCREENS: Record<DomainScreen, () => JSX.Element> = {
  home: HomeScreen,
  results: ResultsScreen,
  own: OwnScreen,
  external: ExternalScreen,
  status: StatusScreen,
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
  const searching = domainScreen === 'home' || domainScreen === 'results'
  const owned = OWNED_DOMAINS[world.inventory] ?? []

  const submit = () => {
    const q = query.trim().toLowerCase()
    if (!q) return
    /* Intent detection, prototype-grade: an owned domain resolves to the confirm screen,
       a RECOGNISED ending reads as an external domain, and everything else is a search.
       It used to be "anything with a dot", so `mycafe.con` opened the external-domain
       screen and the prototype announced "Registered at GoDaddy" about an address that
       cannot exist. A typo belongs in search, next to the alternatives. */
    if (owned.some((o) => o.domain === q)) goDomains('own', q)
    /* A name we know is registered goes to the QUESTION, not to the records. Typing
       `emberandoak.com` used to open the external screen directly — which hands someone
       the two lines to paste and, in doing so, asserts the domain is theirs without ever
       asking. Nobody can know that at this moment (`research/connect.md` §7), so the fact
       and the question come first and the records come after the person answers. */
    else if (isTaken(q)) goDomains('results', q)
    else if (hasKnownEnding(q)) goDomains('external', q)
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