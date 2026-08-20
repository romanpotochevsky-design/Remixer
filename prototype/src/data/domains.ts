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
 * Endings the prototype recognises as real, used only to tell a domain from a typo.
 *
 * The universal field has to separate three intents, and a dot alone is not enough:
 * `mycafe.con` is a mistyped name, not somebody's external domain, and sending it to the
 * external-domain screen made the prototype announce "Registered at GoDaddy" about an
 * address that cannot exist. An unrecognised ending goes back to search, where the
 * alternatives are.
 *
 * The sellable list is TLD_PRICES; the extras below are only for detection — endings a
 * person may legitimately already own even though we do not sell them. Not a price list,
 * not a promise, and deliberately short: it is a prototype heuristic, not a registry.
 */
export const KNOWN_ENDINGS = new Set<string>([
  ...TLD_PRICES.map((p) => p.tld),
  '.co', '.dev', '.app', '.store', '.site', '.xyz', '.info', '.biz', '.us',
  '.uk', '.co.uk', '.eu', '.de', '.fr', '.es', '.it', '.nl', '.pl',
  '.ua', '.com.ua', '.ca', '.au', '.com.au', '.nz', '.in', '.br', '.mx',
])

/** True when the text ends in an ending we recognise — one or two levels deep. */
export const hasKnownEnding = (host: string) => {
  const parts = host.trim().toLowerCase().split('.')
  if (parts.length < 2 || parts.some((part) => !part)) return false
  return (
    KNOWN_ENDINGS.has(`.${parts.slice(-2).join('.')}`) ||
    KNOWN_ENDINGS.has(`.${parts[parts.length - 1]}`)
  )
}

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
    reason: { en: 'Exact brand match · the .com people try first', uk: 'Точний збіг із брендом · .com пробують першим' },
  },
  {
    domain: 'fit-ration.net', tld: '.net',
    reason: { en: 'A trusted and established extension', uk: 'Перевірена і давно знайома зона' },
  },
  {
    domain: 'fitration.shop', tld: '.shop',
    reason: { en: 'Signals ordering right in the address', uk: 'Адреса одразу каже, що тут замовляють' },
  },
  {
    domain: 'getfitration.com', tld: '.com',
    reason: { en: 'Strong call-to-action, easy to remember', uk: 'Сильний заклик до дії, легко запамʼятати' },
  },
  {
    domain: 'fitration.online', tld: '.online',
    reason: { en: 'Short and available almost everywhere', uk: 'Коротко і майже завжди вільно' },
  },
  {
    domain: 'fitration.me', tld: '.me',
    reason: { en: 'Creates a personal connection with customers', uk: 'Створює особистий звʼязок із клієнтами' },
  },
  {
    domain: 'shopfitration.com', tld: '.com',
    reason: { en: 'Ideal for your online storefront', uk: 'Ідеально для онлайн-вітрини' },
  },
  {
    domain: 'fit-ration.org', tld: '.org',
    reason: { en: 'Reads as an organisation people trust', uk: 'Читається як організація, якій довіряють' },
  },
]

/**
 * Search results (Figma 27729:14650) — built from whatever the user typed.
 *
 * Two lists, and the split is meaningful rather than cosmetic. The classic block
 * is the SAME NAME in other endings, which is why its footer reads "Show more
 * endings"; the AI block is other NAMES, each with the reason it was suggested.
 * Per-name rationales are rare in the field — the research called that gap ours
 * to take, so no row ever ships without one.
 *
 * The mockup's rows are placeholder copy (three identical `gettrulieve.com`
 * entries) and its renewal figure — $11.86 — appears nowhere in DreamHost's
 * verified price table. Prices here come from TLD_PRICES; the layout is the
 * mockup's, the numbers are the real ones.
 */
export interface ResultRow {
  domain: string
  tld: string
  reason: { en: string; uk: string }
}

/** Strip whatever ending the user typed — we are about to offer our own. */
const stem = (q: string) => {
  const clean = q.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
  return clean || 'yourbrand'
}

/** The exact match, shown as the hero: the name they asked for, in .com. */
export const exactMatch = (q: string): ResultRow => ({
  domain: `${stem(q.split('.')[0])}.com`,
  tld: '.com',
  reason: {
    en: 'Exact brand match · the .com people try first',
    uk: 'Точний збіг із брендом · .com пробують першим',
  },
})

/** Same name, other endings — the classic registrar list. */
export const otherEndings = (q: string): ResultRow[] => {
  const s = stem(q.split('.')[0])
  return [
    { domain: `${s}.net`, tld: '.net', reason: { en: 'A trusted and established extension', uk: 'Перевірена і давно знайома зона' } },
    { domain: `${s}.shop`, tld: '.shop', reason: { en: 'Perfect for e-commerce and retail', uk: 'Ідеально для торгівлі та e-commerce' } },
    { domain: `${s}.org`, tld: '.org', reason: { en: 'Reads as an organisation people trust', uk: 'Читається як організація, якій довіряють' } },
    { domain: `${s}.online`, tld: '.online', reason: { en: 'Short and available almost everywhere', uk: 'Коротко і майже завжди вільно' } },
    { domain: `${s}.io`, tld: '.io', reason: { en: 'Favoured by software and product teams', uk: 'Улюблена зона софтверних і продуктових команд' } },
  ]
}

/** Other names entirely — the AI block, each with the reason it was picked. */
export const nameIdeas = (q: string): ResultRow[] => {
  const s = stem(q.split('.')[0])
  return [
    { domain: `get${s}.com`, tld: '.com', reason: { en: 'Strong call-to-action, easy to remember', uk: 'Сильний заклик до дії, легко запамʼятати' } },
    { domain: `try${s}.com`, tld: '.com', reason: { en: 'Invites people to start right away', uk: 'Запрошує почати просто зараз' } },
    { domain: `shop${s}.com`, tld: '.com', reason: { en: 'Ideal for your online storefront', uk: 'Ідеально для онлайн-вітрини' } },
    { domain: `my${s}.com`, tld: '.com', reason: { en: 'Creates a personal connection with customers', uk: 'Створює особистий звʼязок із клієнтами' } },
    { domain: `${s}hq.com`, tld: '.com', reason: { en: 'Reads as the official home of the brand', uk: 'Читається як офіційний дім бренду' } },
  ]
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

/**
 * Names that come back TAKEN — the most common outcome of a domain search, and the
 * state the Figma file draws nowhere (OPEN-QUESTIONS 01). Hardcoded rather than
 * generated so a demo can be steered: search `coffeeshop` and the taken hero shows up.
 *
 * `fit-ration.com` is deliberately NOT here, and it must stay off. It is the default demo
 * term, so listing it made the FIRST search anyone runs land on the taken card instead of
 * the Best-match hero — and that hero is the primary screen of the whole buy flow, the one
 * you show first. The happy path is what a first search shows. The ownership turn still
 * demonstrates on the other two account domains below.
 *
 * The list deliberately includes the OWNED_DOMAINS names. A domain the customer already
 * holds also reads as "taken" to a search — and that is the case where the quiet
 * secondary turn, "Already yours? Connect it", is the whole answer. Nobody in the field
 * offers it.
 *
 * What is NOT here, permanently: any brokerage, auction, "Make an offer" or
 * secondary-market price. DreamHost sells no premium domains and runs no brokerage, so
 * offering one would promise something that does not exist (DECISIONS 03, "no retroactive
 * change"). A registry-premium name, if the feed ever returns one, shows as plain taken.
 * GoDaddy is the only competitor monetising this state ("Hire a Broker") and it reads as
 * a trap.
 */
export const TAKEN_DOMAINS = new Set<string>([
  'coffeeshop.com',
  'nike.com',
  // already in the customer's DreamHost account — the "Already yours? Connect it" case.
  // `fit-ration.com` belongs here by that logic and is left out on purpose; see above.
  'odesa-coffee-roasters.com',
  'design-portfolio.net',
  'vegan-burger-delivery.co',
])

export const isTaken = (domain: string) => TAKEN_DOMAINS.has(domain.trim().toLowerCase())

/**
 * The staging address every project gets for free.
 *
 * ⚠️ HISTORY, NOT SPEC. This line used to end ", hidden from Google". That clause was
 * REMOVED 20 Aug 2026 — recorded rather than quietly deleted, because a deleted mistake
 * comes back and a labelled one does not. FACTS **DH-303** downgraded it to `unverified`:
 * nothing in the Remixer KB, on the product page or in the trial terms says anything about
 * indexing, and the only DreamHost staging documented as non-indexable (DreamPress) gets
 * there with HTTP auth that cannot be disabled — which this preview does not use, since
 * the point of the link is that you can open and send it. "For free" is the verified half
 * of DH-303 (with DH-005) and stays. The same claim was printed in the UI by
 * `PublishPanel.tsx`; both copies were cut in one change, and either both come back or
 * neither does. What would bring it back: the platform team confirming the response header
 * (FACTS §3, close-out item 2) — the same one-minute trip that closes the open half below.
 *
 * The ZONE is sourced: `remixer.ai`, verified 20.08.2026 from DreamHost's own KB
 * ("your temporary website ending in remixer.ai") and the Remixer product page
 * ("free for 30 days on a remixer.ai subdomain") — FACTS DH-302. Corrected here
 * from `remixer.site`, which was never sourced.
 *
 * The LEFT-HAND LABEL is still ours, not the product's: whether staging really
 * reads `{project}.remixer.ai`, `{account}-{project}.remixer.ai` or a generated
 * id is unconfirmed (DH-302, open half). One screenshot of the live builder
 * closes it — until then treat `fit-ration` as a placeholder shape.
 */
export const STAGING_HOST = 'fit-ration.remixer.ai'
export const CUSTOM_DOMAIN = 'fit-ration.com'
