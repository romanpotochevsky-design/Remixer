/**
 * Hardcoded domain data — the prototype's stand-in for a backend.
 *
 * Prices are DreamHost's real ones (official pricing table, verified 06 Aug 2026).
 * Both figures are always carried: hiding the renewal price is a dark pattern and
 * the audit's rule is "price before the cart, renewal never hidden".
 *
 * DreamHost sells no premium domains and has no brokerage — a taken name pivots
 * straight to alternatives. There is no "Make an offer" state, by design.
 */

export interface TldPrice {
  tld: string
  /** First-year registration, USD. */
  register: number
  /** Renewal, USD/yr. The honest number — always shown. */
  renew: number
  note?: { en: string; uk: string }
}

export const TLD_PRICES: TldPrice[] = [
  { tld: '.com', register: 9.99, renew: 19.99 },
  { tld: '.net', register: 4.99, renew: 19.99 },
  { tld: '.org', register: 7.99, renew: 21.99 },
  { tld: '.shop', register: 0.99, renew: 34.99 },
  { tld: '.online', register: 1.99, renew: 29.95 },
  { tld: '.me', register: 2.99, renew: 32.95 },
  { tld: '.io', register: 34.99, renew: 59.99 },
  {
    tld: '.ai', register: 89.99, renew: 89.99,
    note: { en: '2-year minimum', uk: 'Мінімум 2 роки' },
  },
]

export const priceFor = (tld: string) => TLD_PRICES.find((p) => p.tld === tld)

/**
 * AI name suggestions — the default empty state of the domain search.
 * In the real product these come from the site's own content (the prompt, the pages);
 * the prototype hardcodes the fit-ration demo project's set. Each row carries a short
 * reason: the research found per-name rationales are rare in the field — that gap is
 * ours to take.
 */
export interface Suggestion {
  domain: string
  tld: string
  reason: { en: string; uk: string }
}

export const AI_SUGGESTIONS: Suggestion[] = [
  {
    domain: 'fit-ration.com', tld: '.com',
    reason: { en: 'Matches your site name — easiest to remember', uk: 'Збігається з назвою сайту — найлегше запам’ятати' },
  },
  {
    domain: 'fitration.shop', tld: '.shop',
    reason: { en: 'Signals ordering right in the address', uk: 'Адреса одразу каже, що тут замовляють' },
  },
  {
    domain: 'fitration.online', tld: '.online',
    reason: { en: 'Short and available almost everywhere', uk: 'Коротко і майже завжди вільно' },
  },
]

/** Domains already sitting in the customer's DreamHost account, per inventory axis. */
export const OWNED_DOMAINS: Record<string, { domain: string; note: { en: string; uk: string } }[]> = {
  'dh-free': [
    { domain: 'fit-ration.com', note: { en: 'In your DreamHost account · not used yet', uk: 'У вашому акаунті DreamHost · ще не використовується' } },
  ],
  'dh-in-use': [
    { domain: 'fit-ration.com', note: { en: 'In your DreamHost account · already serves a site', uk: 'У вашому акаунті DreamHost · вже обслуговує сайт' } },
  ],
  'dh-external-ns': [
    { domain: 'fit-ration.com', note: { en: 'Registered with us · managed at Cloudflare', uk: 'Зареєстровано в нас · керується на Cloudflare' } },
  ],
}

/** The staging address every project gets for free, hidden from Google. */
export const STAGING_HOST = 'fit-ration.remixer.site'
export const CUSTOM_DOMAIN = 'fit-ration.com'
