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
import { useWorld, hasPlan } from '@/state/world'
import { useUI, type DomainScreen } from '@/state/ui'
import { useT, type Text } from '@/i18n'
import { AI_SUGGESTIONS, OWNED_DOMAINS, TLD_PRICES, CUSTOM_DOMAIN } from '@/data/domains'
import { ScrollArea } from '@/ui/ScrollArea'

const EASE = [0.2, 0, 0, 1] as const

/* ------------------------------------------------------------------ shared bits */

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.24, ease: EASE }}
      className="mx-auto w-full max-w-[560px] px-6 py-10"
    >
      {children}
    </motion.div>
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

/** Home: the universal field + owned domains on top + AI suggestions as empty state. */
function HomeScreen() {
  const { world } = useWorld()
  const { goDomains } = useUI()
  const { t } = useT()
  const [query, setQuery] = useState('')

  const owned = OWNED_DOMAINS[world.inventory] ?? []

  const submit = () => {
    const q = query.trim().toLowerCase()
    if (!q) return
    // Intent detection, prototype-grade: an owned domain resolves to the confirm
    // screen, anything with a dot reads as external, a bare name is a search.
    if (owned.some((o) => o.domain === q)) goDomains('own', q)
    else if (q.includes('.') && !q.endsWith('.')) goDomains('external', q)
    else goDomains('results', q)
  }

  return (
    <Screen>
      <Eyebrow>{t({ en: 'Domains', uk: 'Домени' })}</Eyebrow>
      <h2 className="font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.02em]">
        {t({ en: 'Put your site on its own address', uk: 'Дайте сайту власну адресу' })}
      </h2>

      {/* The universal field. One input, three intents. */}
      <div className="mt-5 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={t({
            en: 'Search a new name, or type a domain you own',
            uk: 'Шукайте нову назву або введіть свій домен',
          })}
          className="h-12 min-w-0 flex-1 rounded-control border border-[var(--gray-700)] bg-[var(--gray-900)] px-4 text-[15px] text-[var(--white-900)] placeholder:text-[var(--white-300)] focus:border-[var(--action)] focus:outline-none"
        />
        <button
          onClick={submit}
          className="h-12 flex-none rounded-control bg-[var(--action)] px-5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
        >
          {t({ en: 'Search', uk: 'Шукати' })}
        </button>
      </div>

      {/* Domains already in the account come first — the zero-record go-live case. */}
      {owned.length > 0 && (
        <div className="mt-7">
          <p className="mb-2 text-[13px] font-semibold text-[var(--white-500)]">
            {t({ en: 'Your DreamHost domains', uk: 'Ваші домени DreamHost' })}
          </p>
          {owned.map((o) => (
            <button
              key={o.domain}
              onClick={() => goDomains('own', o.domain)}
              className="flex w-full items-center justify-between rounded-control border border-[var(--gray-800)] bg-[var(--gray-850)] px-4 py-3.5 text-left transition-colors duration-[var(--dur-fast)] ease-std hover:border-[var(--gray-700)]"
            >
              <div>
                <p className="text-[15px] font-medium">{o.domain}</p>
                <p className="mt-0.5 text-[12.5px] text-[var(--white-400)]">{t(o.note)}</p>
              </div>
              <span className="text-[13px] font-medium text-[var(--action)]">
                {t({ en: 'Connect', uk: 'Підключити' })}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* AI suggestions ARE the empty state — not a separate mode. */}
      <div className="mt-7">
        <p className="mb-2 text-[13px] font-semibold text-[var(--white-500)]">
          {t({ en: 'Names that fit your site', uk: 'Назви, що пасують вашому сайту' })}
        </p>
        <div className="space-y-2">
          {AI_SUGGESTIONS.map((s) => {
            const price = TLD_PRICES.find((p) => p.tld === s.tld)!
            return (
              <button
                key={s.domain}
                onClick={() => goDomains('results', s.domain)}
                className="flex w-full items-center justify-between rounded-control border border-[var(--gray-800)] bg-[var(--gray-850)] px-4 py-3.5 text-left transition-colors duration-[var(--dur-fast)] ease-std hover:border-[var(--gray-700)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium">{s.domain}</p>
                  <p className="mt-0.5 text-[12.5px] text-[var(--white-400)]">{t(s.reason)}</p>
                </div>
                <div className="flex-none text-right">
                  <p className="text-[14px] font-semibold tabular-nums">${price.register}</p>
                  <p className="text-[11.5px] tabular-nums text-[var(--white-300)]">
                    {t({ en: `then $${price.renew}/yr`, uk: `далі $${price.renew}/рік` })}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </Screen>
  )
}

/** Results: exact-match hero + alternative TLDs. Taken names pivot to alternatives. */
function ResultsScreen() {
  const { activeDomain, goDomains } = useUI()
  const { t } = useT()
  const name = (activeDomain ?? 'fit-ration.com').split('.')[0]

  return (
    <Screen>
      <button onClick={() => goDomains('home')} className="mb-4 text-[13px] text-[var(--white-400)] hover:text-[var(--white-700)]">
        ← {t({ en: 'Back', uk: 'Назад' })}
      </button>

      {/* Exact-match hero — the field-wide pattern, with honest dual pricing. */}
      <div className="rounded-shell border border-[var(--action-300)] bg-[var(--action-100)] p-5">
        <p className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--action)]">
          {t({ en: 'Available', uk: 'Вільний' })}
        </p>
        <div className="flex items-end justify-between gap-4">
          <h3 className="font-display text-[22px] font-semibold tracking-[-0.02em]">{name}.com</h3>
          <div className="text-right">
            <p className="text-[18px] font-semibold tabular-nums">$9.99</p>
            <p className="text-[12px] tabular-nums text-[var(--white-400)]">
              {t({ en: 'then $19.99/yr · privacy included', uk: 'далі $19.99/рік · приватність включена' })}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <PrimaryButton label={{ en: 'Add to site →', uk: 'Додати до сайту →' }} onClick={() => goDomains('status', `${name}.com`)} />
        </div>
      </div>

      <p className="mb-2 mt-6 text-[13px] font-semibold text-[var(--white-500)]">
        {t({ en: 'More endings', uk: 'Інші закінчення' })}
      </p>
      <div className="space-y-2">
        {TLD_PRICES.filter((p) => p.tld !== '.com').slice(0, 5).map((p) => (
          <button
            key={p.tld}
            onClick={() => goDomains('status', `${name}${p.tld}`)}
            className="flex w-full items-center justify-between rounded-control border border-[var(--gray-800)] bg-[var(--gray-850)] px-4 py-3 text-left transition-colors duration-[var(--dur-fast)] ease-std hover:border-[var(--gray-700)]"
          >
            <p className="text-[15px] font-medium">
              {name}
              <span className="text-[var(--white-500)]">{p.tld}</span>
            </p>
            <div className="text-right">
              <p className="text-[14px] font-semibold tabular-nums">${p.register}</p>
              <p className="text-[11.5px] tabular-nums text-[var(--white-300)]">
                {p.note ? t(p.note) : t({ en: `then $${p.renew}/yr`, uk: `далі $${p.renew}/рік` })}
              </p>
            </div>
          </button>
        ))}
      </div>
    </Screen>
  )
}

/** "You own this" — the confirm for a domain already in the DreamHost account. */
function OwnScreen() {
  const { world, set } = useWorld()
  const { activeDomain, goDomains } = useUI()
  const { t } = useT()
  const domain = activeDomain ?? CUSTOM_DOMAIN
  const inUse = world.inventory === 'dh-in-use'
  const externalNs = world.inventory === 'dh-external-ns'

  const connect = () => {
    set({ domain: 'connecting' })
    goDomains('status', domain)
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
      {inUse && (
        <div className="mt-4 rounded-control border border-[#e5c35940] bg-[#e5c35914] p-3.5">
          <p className="text-[13px] font-semibold text-[var(--attention)]">
            {t({ en: 'This domain already shows a website', uk: 'На цьому домені вже є сайт' })}
          </p>
          <p className="mt-1 text-[13px] leading-[1.45] text-[var(--white-400)]">
            {t({
              en: `Connecting will replace what visitors see at ${domain}. Your files stay safe and you can switch back.`,
              uk: `Підключення замінить те, що бачать відвідувачі на ${domain}. Файли збережуться, і можна повернути як було.`,
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

      <div className="mt-5">
        <PrimaryButton
          label={
            inUse
              ? { en: `Replace site at ${domain}`, uk: `Замінити сайт на ${domain}` }
              : { en: 'Connect', uk: 'Підключити' }
          }
          onClick={connect}
        />
      </div>
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
  own: OwnScreen,
  external: ExternalScreen,
  status: StatusScreen,
}

export function DomainsSurface() {
  const { domainScreen, closeSurface } = useUI()
  const { world } = useWorld()
  const { t } = useT()
  const Current = SCREENS[domainScreen]

  // The plan gate: going live on a custom domain is a paid capability. The gate reads
  // as an upgrade, never as "start a trial" — the flow doc is explicit about this.
  const gated = !hasPlan(world)

  return (
    <ScrollArea
      className="h-full overflow-hidden rounded-shell"
      innerClassName="relative bg-[var(--gray-950)]"
    >
      <button
        onClick={closeSurface}
        aria-label={t({ en: 'Close', uk: 'Закрити' })}
        className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-control text-[var(--white-400)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--gray-800)] hover:text-[var(--white-700)]"
      >
        ✕
      </button>

      {gated ? (
        <Screen>
          <Eyebrow>{t({ en: 'Public website', uk: 'Публічний сайт' })}</Eyebrow>
          <h2 className="font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.02em]">
            {t({ en: 'Go live on your own domain', uk: 'Запустіть сайт на власному домені' })}
          </h2>
          <p className="mt-2 text-[14px] leading-[1.5] text-[var(--white-500)]">
            {t({
              en: 'Use your own address like fit-ration.com — easy to find on Google and more professional.',
              uk: 'Власна адреса на кшталт fit-ration.com — легше знайти в Google і виглядає професійно.',
            })}
          </p>
          <div className="mt-4 rounded-control bg-gradient-to-r from-[#9b7bff26] to-[#4a2bc326] p-3.5">
            <p className="text-[13px] font-semibold text-[var(--white-700)]">
              {t({ en: 'Part of the Remixer Build plan · $9.99/mo', uk: 'Входить у план Remixer Build · $9.99/міс' })}
            </p>
            <p className="mt-1 text-[13px] leading-[1.45] text-[var(--white-400)]">
              {t({
                en: 'Includes hosting, the padlock and your domain. Cancel anytime.',
                uk: 'Включає хостинг, захисний замочок і ваш домен. Скасувати можна будь-коли.',
              })}
            </p>
          </div>
          <div className="mt-5">
            <PrimaryButton label={{ en: 'Upgrade to Remixer Build', uk: 'Перейти на Remixer Build' }} />
          </div>
          <p className="mt-2 text-center text-[12.5px] text-[var(--white-300)]">
            {t({ en: 'Your free preview link keeps working either way', uk: 'Безкоштовне прев’ю працюватиме в будь-якому разі' })}
          </p>
        </Screen>
      ) : (
        <AnimatePresence mode="wait">
          <Current key={domainScreen} />
        </AnimatePresence>
      )}
    </ScrollArea>
  )
}
