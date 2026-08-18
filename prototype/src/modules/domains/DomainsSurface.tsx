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
  AI_SUGGESTIONS, OWNED_DOMAINS, CUSTOM_DOMAIN, priceFor,
  exactMatch, otherEndings, nameIdeas, type ResultRow,
} from '@/data/domains'
import { ScrollArea } from '@/ui/ScrollArea'
import {
  IconSearch, IconArrowRight, IconGlobe, IconClose, IconSparkleAI,
  IconAIMark, IconChevronDown,
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
 * Every row is available in the mockup — there is no taken state drawn anywhere
 * in the file, which is the biggest gap in this screen and is raised with the
 * designer rather than invented here.
 */
function ResultsScreen() {
  const { activeDomain, openDomainModal } = useUI()
  const { t } = useT()
  const term = activeDomain ?? 'fit-ration'

  const hero = exactMatch(term)
  const heroPrice = priceFor(hero.tld)!
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
                    {t({ en: 'Best match', uk: 'Найкращий збіг' })}
                  </span>
                </div>
                <div className="flex h-[94px] items-center justify-between gap-6 rounded-[14px] border border-[#ffffff0a] bg-[#1f1f22] px-6">
                  <div className="min-w-0 flex-1 pb-1">
                    <p className="truncate text-[22px] font-medium leading-none text-white">{hero.domain}</p>
                    <p className="mt-[7px] truncate text-[13px] leading-none text-[#ffffff7a]">{t(hero.reason)}</p>
                  </div>
                  <div className="flex h-10 flex-none items-center gap-8">
                    {/* the promo says itself: list price struck, first year large */}
                    <PriceStack register={heroPrice.register} renew={heroPrice.renew} strike />
                    <button
                      onClick={() => openDomainModal('buy', hero.domain)}
                      className="h-9 flex-none rounded-[8px] bg-[var(--action)] px-3.5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
                    >
                      {t({ en: 'Buy', uk: 'Купити' })}
                    </button>
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
/** External domain: registrar detected, guided manual path. No Domain Connect promises. */
function ExternalScreen() {
  const { set } = useWorld()
  const { activeDomain, goDomains } = useUI()
  const { t } = useT()
  const domain = activeDomain ?? 'emberandoak.com'

  const start = () => {
    set({ domain: 'connecting', inventory: 'external-manual' })
    goDomains('status', domain)
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

/** Status: the named state machine — connecting → verifying → live, one verb per stop. */
function StatusScreen() {
  const { world, set } = useWorld()
  const { activeDomain, closeSurface } = useUI()
  const { t } = useT()
  const domain = activeDomain ?? CUSTOM_DOMAIN

  const stage = world.domain === 'live' || world.domain === 'multiple' ? 2
    : world.domain === 'verifying' ? 1
    : 0

  // The canonical success checklist — one fixed order on every success screen.
  const checklist = [
    { label: { en: 'Domain settings updated', uk: 'Налаштування домену оновлено' }, done: stage >= 1 },
    { label: { en: 'Connected to your site', uk: 'Під’єднано до вашого сайту' }, done: stage >= 2 },
    { label: { en: 'Security (SSL) on', uk: 'Захист (SSL) увімкнено' }, done: stage >= 2 },
  ]

  return (
    <Screen>
      <Eyebrow>
        {stage === 2
          ? t({ en: 'Live', uk: 'Працює' })
          : t({ en: 'Connecting', uk: 'Підключення' })}
      </Eyebrow>
      <h2 className="flex items-center gap-3 font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.02em]">
        {stage === 2 ? (
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
        {stage === 2
          ? t({ en: 'Secure padlock on · anyone can visit.', uk: 'Захисний замочок увімкнено · сайт доступний усім.' })
          : t({
              en: 'Usually a few minutes — keep editing, it goes live on its own.',
              uk: 'Зазвичай кілька хвилин — редагуйте далі, сайт запуститься сам.',
            })}
      </p>

      <div className="mt-5 space-y-2.5 rounded-control border border-[var(--gray-800)] bg-[var(--gray-850)] p-4">
        {checklist.map((c) => (
          <div key={c.label.en} className="flex items-center gap-2.5 text-[14px]">
            <span
              className={`grid h-5 w-5 flex-none place-items-center rounded-full text-[11px] ${
                c.done ? 'bg-[#48ba7933] text-[var(--live)]' : 'border border-[var(--gray-700)] text-transparent'
              }`}
              aria-hidden
            >
              ✓
            </span>
            <span className={c.done ? 'text-[var(--white-700)]' : 'text-[var(--white-400)]'}>{t(c.label)}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        {stage === 2 ? (
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
              onClick={() => set({ domain: world.domain === 'connecting' ? 'verifying' : 'live' })}
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
  external: ExternalScreen,
  status: StatusScreen,
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
  const searching = domainScreen === 'home' || domainScreen === 'results'
  const owned = OWNED_DOMAINS[world.inventory] ?? []

  const submit = () => {
    const q = query.trim().toLowerCase()
    if (!q) return
    /* Intent detection, prototype-grade: a domain already in the account opens the
       checkout sheet, anything else with a dot reads as external, a bare name is a
       search.

       Typing an owned name and clicking its Connect button in the list are the same
       intent, so they must land in the same place. They used not to: the button
       opened the sheet while the field routed to a standalone screen drawn before
       the redesign, and which of the two you got depended on whether you reached for
       the mouse or the keyboard. */
    if (owned.some((o) => o.domain === q)) openDomainModal('connect-existing', q)
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