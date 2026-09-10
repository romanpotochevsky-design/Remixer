/**
 * Hardcoded domain data — the prototype's stand-in for a backend.
 *
 * Prices are DreamHost's real ones (official pricing table, verified 06 Aug 2026).
 * Both figures are always carried: hiding the renewal price is a dark pattern and
 * the audit's rule is "price before the cart, renewal never hidden".
 *
 * DreamHost sells no premium domains and has no brokerage — a taken name pivots
 * straight to alternatives. There is no "Make an offer" state, by design.
 *
 * ⚠️ No row carries a description any more. Per-name rationales ("Short and
 * brandable", "Describes what you do") were a deliberate differentiator — the
 * research across ten competitors found nobody ships them — but the designer
 * removed them from every board on 10 Sep 2026 and stated it as a requirement.
 * The knowledge stays in docs/research/domain-search-research.md; the UI does not
 * render it. Do not reintroduce reason lines without being asked.
 */

export interface TldPrice {
  tld: string
  /** First-year registration, USD. */
  register: number
  /** Renewal, USD/yr. The honest number — always shown. */
  renew: number
  note?: { en: string; uk: string }
}

/**
 * Every ending we can price from the verified table — and nothing else.
 * A search result with an invented price would be worse than a shorter list.
 */
export const TLD_PRICES: TldPrice[] = [
  { tld: '.com', register: 9.99, renew: 19.99 },
  { tld: '.net', register: 4.99, renew: 19.99 },
  { tld: '.org', register: 7.99, renew: 21.99 },
  { tld: '.shop', register: 0.99, renew: 34.99 },
  { tld: '.store', register: 2.99, renew: 49.95 },
  { tld: '.online', register: 1.99, renew: 29.95 },
  { tld: '.co', register: 34.99, renew: 34.99 },
  { tld: '.me', register: 2.99, renew: 32.95 },
  { tld: '.io', register: 34.99, renew: 59.99 },
  {
    tld: '.ai', register: 89.99, renew: 89.99,
    note: { en: '2-year minimum', uk: 'Мінімум 2 роки' },
  },
]

export const priceFor = (tld: string) => TLD_PRICES.find((p) => p.tld === tld)

/**
 * One row of any domain list — a name and the ending it prices off. That is the
 * whole model: name, price, verb.
 */
export interface ResultRow {
  domain: string
  tld: string
}

const row = (domain: string): ResultRow => ({
  domain,
  tld: domain.slice(domain.lastIndexOf('.')),
})

/**
 * AI name suggestions — the default empty state of the domain dashboard.
 * In the real product these come from the site's own content (the prompt, the
 * pages); the prototype hardcodes the fit-ration demo project's set.
 */
export const AI_SUGGESTIONS: ResultRow[] = [
  row('fit-ration.com'),
  row('fit-ration.net'),
  row('fitration.shop'),
  row('getfitration.com'),
  row('fitration.online'),
  row('fitration.me'),
  row('shopfitration.com'),
  row('fit-ration.org'),
]

/* ------------------------------------------------------------------ search */

/** Strip whatever ending the user typed — we are about to offer our own. */
const stem = (q: string) => {
  const clean = q.trim().toLowerCase().split('.')[0].replace(/[^a-z0-9-]/g, '')
  return clean || 'yourbrand'
}

/** The exact match, shown as the hero: the name they asked for, in .com. */
export const exactMatch = (q: string): ResultRow => row(`${stem(q)}.com`)

/**
 * Search results — Figma 27729:14650, reworked Sep 2026.
 *
 * The screen now carries THREE lists (Featured · Popular · Suggested), which the
 * designer set as a requirement. The mockup's rows are placeholder copy (three
 * identical `gettrulieve.com` entries in every list), so the split of meaning is
 * ours, and it keeps the ordering principle the research argued for: a person who
 * typed a name is asking about THAT name first, other names come last.
 *
 *  - Featured  — the exact name in the endings we lead with.
 *  - Popular   — the exact name in the endings people pick for a brand, plus the
 *                hyphen-free spelling, which is the most-bought variant of a
 *                hyphenated name.
 *  - Suggested — other names entirely, generated from the site description.
 */
export const featuredEndings = (q: string): ResultRow[] => {
  const s = stem(q)
  return ['.net', '.org', '.shop', '.store', '.online'].map((t) => row(`${s}${t}`))
}

export const popularEndings = (q: string): ResultRow[] => {
  const s = stem(q)
  const plain = s.replace(/-/g, '')
  /* A hyphenated brand's plain spelling is the row people actually want; when the
     name has no hyphen there is nothing to unhyphenate, so the classic "…co.com"
     brandable takes the slot. Either way the list is five rows, all priced from
     the verified table. */
  const variant = plain !== s ? `${plain}.com` : `${s}co.com`
  return [`${s}.co`, `${s}.io`, `${s}.me`, `${s}.ai`, variant].map(row)
}

export const nameIdeas = (q: string): ResultRow[] => {
  const s = stem(q)
  return [`get${s}.com`, `try${s}.com`, `shop${s}.com`, `my${s}.com`, `${s}hq.com`].map(row)
}

/** Domains already sitting in the customer's DreamHost account, per inventory axis. */
export const OWNED_DOMAINS: Record<string, { domain: string; note: { en: string; uk: string } }[]> = {
  'dh-free': [
    { domain: 'fit-ration.com', note: { en: 'In your DreamHost account · not used yet', uk: 'У вашому акаунті DreamHost · ще не використовується' } },
    { domain: 'odesa-coffee-roasters.com', note: { en: 'In your DreamHost account', uk: 'У вашому акаунті DreamHost' } },
    { domain: 'design-portfolio.net', note: { en: 'In your DreamHost account', uk: 'У вашому акаунті DreamHost' } },
    { domain: 'vegan-burger-delivery.co', note: { en: 'In your DreamHost account', uk: 'У вашому акаунті DreamHost' } },
  ],
  'dh-in-use': [
    { domain: 'fit-ration.com', note: { en: 'In your DreamHost account · already serves a site', uk: 'У вашому акаунті DreamHost · вже обслуговує сайт' } },
    { domain: 'odesa-coffee-roasters.com', note: { en: 'In your DreamHost account', uk: 'У вашому акаунті DreamHost' } },
    { domain: 'design-portfolio.net', note: { en: 'In your DreamHost account', uk: 'У вашому акаунті DreamHost' } },
  ],
  'dh-external-ns': [
    { domain: 'fit-ration.com', note: { en: 'Registered with us · managed at Cloudflare', uk: 'Зареєстровано в нас · керується на Cloudflare' } },
    { domain: 'design-portfolio.net', note: { en: 'Registered with us', uk: 'Зареєстровано в нас' } },
  ],
}

/** The staging address every project gets for free, hidden from Google. */
export const STAGING_HOST = 'fit-ration.remixer.site'
export const CUSTOM_DOMAIN = 'fit-ration.com'
