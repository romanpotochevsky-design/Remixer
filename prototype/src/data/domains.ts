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
 * Three rules this file exists to keep, and every one of them has already been
 * broken once:
 *
 *  1. NOTHING IS PRICED THAT TLD_PRICES CANNOT PRICE. Ten endings are verified;
 *     an eleventh would be an invented number under a real name.
 *  2. NOTHING IS OFFERED THAT IS NOT AVAILABLE. Every list here is OUR offer, so
 *     a row that is registered has no business in one — see `offer`.
 *  3. NOTHING CLAIMS A REGISTRAR WE CANNOT STAND BEHIND. A taken row names who
 *     holds the name, so a name may only be marked taken when the data says who.
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
  /**
   * Shortest term the registry will sell, in years. Absent means one.
   *
   * `.ai` is the only one today, and it is not decoration: a one-year `.ai` is a
   * registration DreamHost cannot place. The cart reads this (data/cart.ts,
   * `termYears`) so the year select can never offer a term we cannot sell —
   * special-casing `.ai` in a component would leave the next such ending broken.
   */
  minYears?: number
  note?: { en: string; uk: string }
}

/** "2 роки" / "5 років" — the note below is generated, so it cannot drift. */
const ukYears = (n: number) => {
  const one = n % 10
  const teen = n % 100 >= 11 && n % 100 <= 14
  if (!teen && one === 1) return 'рік'
  if (!teen && one >= 2 && one <= 4) return 'роки'
  return 'років'
}

const minTermNote = (n: number) => ({
  en: `${n}-year minimum`,
  uk: `Мінімум ${n} ${ukYears(n)}`,
})

/**
 * Every ending we can price from the verified table — and nothing else.
 * A search result with an invented price would be worse than a shorter list.
 */
const PRICED: TldPrice[] = [
  { tld: '.com', register: 9.99, renew: 19.99 },
  { tld: '.net', register: 4.99, renew: 19.99 },
  { tld: '.org', register: 7.99, renew: 21.99 },
  { tld: '.shop', register: 0.99, renew: 34.99 },
  { tld: '.store', register: 2.99, renew: 49.95 },
  { tld: '.online', register: 1.99, renew: 29.95 },
  { tld: '.co', register: 34.99, renew: 34.99 },
  { tld: '.me', register: 2.99, renew: 32.95 },
  { tld: '.io', register: 34.99, renew: 59.99 },
  { tld: '.ai', register: 89.99, renew: 89.99, minYears: 2 },
]

/** The table the app reads: the minimum term above, spelled out for the price row. */
export const TLD_PRICES: TldPrice[] = PRICED.map((p) =>
  p.minYears && p.minYears > 1 && !p.note ? { ...p, note: minTermNote(p.minYears) } : p,
)

export const priceFor = (tld: string) => TLD_PRICES.find((p) => p.tld === tld)

/** Shortest term this ending can be registered for. One, unless the registry says more. */
export const minTermYears = (tld: string) => priceFor(tld)?.minYears ?? 1

/* ------------------------------------------------- reading what was typed */

/**
 * Endings made of two labels, where the NAME is the label in front of both.
 *
 * A Public Suffix List proper has ~9,000 entries and updates weekly; this is the
 * handful a US/UK/AU demo actually meets. Without it `theirshop.co.uk` was read as
 * the name `co` under the ending `.uk` — and since `.uk` is not priced, the answer
 * came back as **co.com**, with co.net / co.org / getco.com filling the page. The
 * customer's own name never appeared anywhere on screen (demo gate, Sep 2026).
 */
const MULTI_LABEL_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'me.uk', 'ac.uk', 'net.uk', 'ltd.uk', 'plc.uk', 'sch.uk', 'gov.uk',
  'com.au', 'net.au', 'org.au', 'edu.au', 'id.au',
  'co.nz', 'net.nz', 'org.nz',
  'co.jp', 'ne.jp', 'or.jp', 'ac.jp',
  'co.za', 'org.za', 'net.za',
  'co.in', 'net.in', 'org.in',
  'co.kr', 'co.th', 'co.il', 'co.ke',
  'com.br', 'com.mx', 'com.ar', 'com.co', 'com.pe', 'com.ua', 'com.tr', 'com.pl',
  'com.sg', 'com.my', 'com.ph', 'com.hk', 'com.tw', 'com.cn', 'net.cn', 'org.cn',
  'com.es', 'com.pt', 'com.gr', 'com.vn', 'com.sa', 'com.eg', 'com.ng',
])

/**
 * Split what the customer typed into the NAME and the ENDING they put on it.
 *
 * Scheme and path are dropped first — people paste `https://brand.com/` — then the
 * suffix is taken as two labels when the pair is a known multi-label one and as one
 * label otherwise. The name is the label in front of that, NOT the first label:
 * `www.example.com` is the name `example`, and since a dot no longer routes anybody
 * to the external screen (see DomainsSurface's router) that string reaches here for
 * real.
 */
const split = (q: string): { name: string; suffix: string | null } => {
  const clean = q.trim().toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/[/?#].*$/, '')
  const parts = clean.split('.').filter(Boolean)
  if (parts.length > 2 && MULTI_LABEL_SUFFIXES.has(parts.slice(-2).join('.'))) {
    return { name: parts[parts.length - 3], suffix: `.${parts.slice(-2).join('.')}` }
  }
  if (parts.length === 2 && MULTI_LABEL_SUFFIXES.has(parts.join('.'))) {
    /* they typed a suffix and nothing else */
    return { name: '', suffix: `.${parts.join('.')}` }
  }
  if (parts.length > 1) return { name: parts[parts.length - 2], suffix: `.${parts[parts.length - 1]}` }
  return { name: parts[0] ?? '', suffix: null }
}

/** The NAME the customer typed, with whatever ending they put on it taken off. */
const stem = (q: string) => split(q).name.replace(/[^a-z0-9-]/g, '') || 'yourbrand'

/** The ending on a domain we hold, multi-label aware. `''` when there is none. */
export const endingOf = (domain: string) => split(domain).suffix ?? ''

/**
 * The ending they typed — but only when we can price it.
 *
 * An ending we have no verified price for cannot be sold in this prototype, and
 * every row falls back to the .com price when `priceFor` misses, so honouring
 * `brand.xyz` as a hero would put $9.99 under a name nobody quoted us that figure
 * for.
 */
const pricedEnding = (q: string): string | null => {
  const { suffix } = split(q)
  return suffix && priceFor(suffix) ? suffix : null
}

/**
 * The ending they asked for that we do not sell — `.xyz`, `.co.uk`, `.dev` — or
 * null when they typed one of the ten, or none at all.
 */
export const unofferedEnding = (q: string): string | null => {
  const { suffix } = split(q)
  return suffix && !priceFor(suffix) ? suffix : null
}

/**
 * What the screen owes the customer when we answer a question they did not ask.
 *
 * Typing `brand.xyz` gets `brand.com` as the hero, because `.xyz` has no verified
 * price and a priced row is the only kind this prototype may draw. That swap must
 * be SAID: silently answering about a different ending is the same category error
 * as burying the exact match under AI ideas — the person asked about THAT name.
 *
 * ⚠️ NOT RENDERED YET. The results screen (modules/domains/DomainsSurface.tsx,
 * `ResultsScreen`) has no line for it; this is the string it should carry above the
 * Best-match hero, and it is the whole of the fix that lives outside this file. The
 * same screen's footer hardcodes "400+ more available", which is a count of endings
 * we cannot back up and does not belong on an answer that is already substituting
 * one ending for another.
 */
export const endingNotice = (q: string): { en: string; uk: string } | null => {
  const suffix = unofferedEnding(q)
  if (!suffix) return null
  const name = stem(q)
  return {
    en: `We don’t sell ${suffix} names. Here’s ${name} in the endings we do.`,
    uk: `Ми не продаємо домени ${suffix}. Ось ${name} у доменах, які ми пропонуємо.`,
  }
}

/* -------------------------------------------------------- what is taken */

const normalize = (domain: string) => domain.trim().toLowerCase()

/**
 * The demo's own vocabulary — names that must stay buyable whatever rule lands
 * here next. Checked BEFORE anything below, so a broader availability rule (and
 * one will come: today's default is "available", which reality is not) can never
 * take the morning's demo down with it.
 */
const DEMO_NAMES = new Set([
  'emberandoak',
  'fit-ration', 'fitration',
  'odesa-coffee-roasters',
  'design-portfolio',
  'vegan-burger-delivery',
])

/**
 * Names the prototype answers "taken" for — a fixed list, never a dice roll.
 *
 * The value is the registrar, which is real data in the product: RDAP returns
 * the sponsoring registrar at registry level and WHOIS privacy does not hide it,
 * so the board is right to name it ("Registered at GoDaddy"). It is the one thing
 * we may state about a stranger's domain; ownership stays conditional.
 *
 * ⚠️ DETERMINISTIC ON PURPOSE. A prototype that randomly refuses to sell a name
 * during a demo is worse than one that never shows the state at all.
 *
 * ⚠️ A NAME MAY ONLY BE LISTED HERE WITH A REGISTRAR WE CAN STAND BEHIND. The
 * taken card prints "Registered at X" unconditionally, so an entry with no
 * attribution would make the screen invent one (DomainsSurface still falls back to
 * the literal string 'GoDaddy' — see the report note). Provenance, tiered:
 *   · trulieve.com — the board's own name and its own registrar (27270:5623).
 *   · The self-registrar rows — DreamHost, GoDaddy, Namecheap, Cloudflare,
 *     Squarespace, Hostinger, Wix: each of these companies IS an ICANN-accredited
 *     registrar, so "registered at themselves" is the expected RDAP answer.
 *   · The corporate-registrar rows — MarkMonitor, CSC, RegistrarSafe: the brand
 *     protection registrars these companies are publicly known to use.
 *   · The six generic one-word .com rows predate this pass and are demo dressing:
 *     the names are genuinely registered, the registrars beside them are ours.
 *     Flagged to the designer, unchanged here.
 */
export const TAKEN_DOMAINS: Record<string, string> = {
  'trulieve.com': 'GoDaddy',
  'coffee.com': 'GoDaddy',
  'pizza.com': 'Network Solutions',
  'fitness.com': 'Namecheap',
  'shop.com': 'MarkMonitor',
  'design.com': 'Namecheap',
  'studio.com': 'GoDaddy',
}

/**
 * Brands that are taken in EVERY ending we sell, keyed by the name alone.
 *
 * This is what closes the defect the gate called the night's biggest risk: the
 * search used to sell `dreamhost.com` for $9.99 with a working Buy, in a room of
 * DreamHost product owners, because only seven curated names were registered and
 * the whole rest of the internet was for sale. Typing your own company's domain is
 * the first joke anybody makes at a demo of a domain search.
 *
 * Keyed by name rather than by full domain because that is how these companies
 * hold their names — defensively, across every major ending — so `dreamhost.net`
 * and `google.shop` answer the same as the `.com`. Prefixed variants are NOT
 * covered on purpose: `getdreamhost.com` really is unregistered, and offering it
 * is exactly what a domain search is for.
 */
const TAKEN_BRANDS: Record<string, string> = {
  /* ours */
  dreamhost: 'DreamHost',
  /* the registrars and builders we compete with — each its own registrar */
  godaddy: 'GoDaddy',
  namecheap: 'Namecheap',
  cloudflare: 'Cloudflare',
  squarespace: 'Squarespace',
  hostinger: 'Hostinger',
  wix: 'Wix',
  /* household names, at the brand-protection registrars they are known to use */
  google: 'MarkMonitor',
  youtube: 'MarkMonitor',
  microsoft: 'MarkMonitor',
  amazon: 'MarkMonitor',
  netflix: 'MarkMonitor',
  wordpress: 'MarkMonitor',
  apple: 'CSC Corporate Domains',
  facebook: 'RegistrarSafe',
  instagram: 'RegistrarSafe',
}

/** Who the name is registered with, or null when it is free to buy. */
export const registrarOf = (domain: string): string | null => {
  const full = normalize(domain)
  const name = stem(full)
  if (DEMO_NAMES.has(name)) return null
  return TAKEN_DOMAINS[full] ?? TAKEN_BRANDS[name] ?? null
}

export const isTaken = (domain: string) => registrarOf(domain) !== null

/**
 * One row of any domain list — a name, the ending it prices off, and whether it
 * can still be bought. That is the whole model: name, price, verb.
 */
export interface ResultRow {
  domain: string
  tld: string
  /**
   * Already registered by somebody else. A taken row carries NO price and no
   * Buy: DreamHost has no brokerage and sells no premium names, so the only
   * honest action left on it is the conditional "This is my domain"
   * (Figma 27270:5623). Absent/false means available.
   *
   * Only the EXACT MATCH can come back true — it is the one row the customer
   * chose rather than us, and `offer` below keeps every list we compose clear of
   * names that are gone.
   */
  taken?: boolean
}

const row = (domain: string): ResultRow => ({
  domain,
  tld: endingOf(domain),
  ...(isTaken(domain) ? { taken: true } : {}),
})

/**
 * Fill a list of `count` rows from a longer pool, skipping anything registered.
 *
 * Every list below is an OFFER. A "close alternative" that is itself taken is not
 * an alternative, and the row components draw a price and a Buy on whatever they
 * are handed — they do not read `taken`. So the pools are longer than the lists
 * they fill, and a brand whose every ending is gone falls through to the prefixed
 * shapes rather than leaving a hole.
 */
const offer = (pool: string[], count: number): ResultRow[] =>
  pool.filter((d) => !isTaken(d)).slice(0, count).map(row)

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

/**
 * The exact match, shown as the hero: the name they asked for, in the ending they
 * asked for — and the one row that can come back `taken`, because it is the only
 * one the user chose rather than us. When it does, the results screen swaps the
 * hero for the taken card (Figma 27270:5623) instead of offering a price on
 * somebody's domain.
 *
 * ⚠️ The ending used to be hardcoded to `.com`, which was true enough while a
 * query carrying an ending never reached this screen at all — anything with a dot
 * was routed to the external-registrar screen, which is the defect that routing
 * pass removed. Now that `fitration.shop` lands here, answering it with a hero
 * reading `fitration.com` would be the same category error the block order exists
 * to avoid: the person asked about THAT name.
 *
 * ⚠️ An ending we cannot price still falls back to `.com` — there is no other
 * honest row to draw — but the fallback owes the customer a sentence, which is
 * `endingNotice` and which the screen does not print yet. Read that comment
 * before calling this defect fixed.
 */
export const exactMatch = (q: string): ResultRow => row(`${stem(q)}${pricedEnding(q) ?? '.com'}`)

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
  return offer(['.net', '.org', '.shop', '.store', '.online', '.me', '.co'].map((t) => `${s}${t}`), 5)
}

export const popularEndings = (q: string): ResultRow[] => {
  const s = stem(q)
  const plain = s.replace(/-/g, '')
  /* A hyphenated brand's plain spelling is the row people actually want; when the
     name has no hyphen there is nothing to unhyphenate, so the classic "…co.com"
     brandable takes the slot. Either way the list is five rows, all priced from
     the verified table. */
  const variant = plain !== s ? `${plain}.com` : `${s}co.com`
  return offer(
    [`${s}.co`, `${s}.io`, `${s}.me`, `${s}.ai`, variant, `${s}.online`, `get${s}.com`],
    5,
  )
}

export const nameIdeas = (q: string): ResultRow[] => {
  const s = stem(q)
  return offer(
    [`get${s}.com`, `try${s}.com`, `shop${s}.com`, `my${s}.com`, `${s}hq.com`, `the${s}.com`, `${s}app.com`],
    5,
  )
}

/* ------------------------------------------------------- the name is taken */

/**
 * The taken screen's two lists — Figma 27270:5623 (㉗ `3 занят`).
 *
 * A taken name has no aftermarket here (no brokerage, no premium inventory), so
 * the whole answer is "here is what you CAN have". The board splits that in two,
 * and the split is the information:
 *
 *  - `closeAlternatives` — the SAME name, still reachable: another ending, or the
 *    one small twist people actually buy (`get…`). Three rows, exactly as drawn.
 *  - `takenIdeas` — OTHER names, generated from the site's own content. Two rows.
 *
 * Both are priced off TLD_PRICES like every other row; the board's numbers
 * ($4.99 / $9.99 / $2.99 with renewals $19.99 / $19.99 / $49.95) agree with the
 * verified table to the cent, so nothing had to be substituted.
 *
 * Both also run through `offer`, which is what keeps a brand's screen sane: the
 * three drawn shapes for `dreamhost` are all taken, so the list falls through to
 * the prefixed ones instead of putting a Buy on names the company holds.
 */
export const closeAlternatives = (q: string): ResultRow[] => {
  const s = stem(q)
  return offer(
    [
      `${s}.net`, `get${s}.com`, `${s}.store`, `${s}.online`, `${s}.shop`, `${s}.me`,
      /* the tail exists for a brand whose every ending is gone — `dreamhost` has no
         free ending at all, and two rows under a heading that promises three reads
         as a list that failed rather than as an answer */
      `try${s}.com`, `my${s}.com`, `${s}hq.com`,
    ],
    3,
  )
}

/**
 * ⚠️ The two shapes are the board's own (`drinktrulieve.com`, `trulieveodesa.com`
 * — "your name + what you serve", "your name + your city"). Generalised here as a
 * prefix and a city suffix so any searched name produces two rows; the city is
 * Odesa, the one the prototype's demo data already uses
 * (`odesa-coffee-roasters.com`). In the real product both come from the site's
 * content, which is why the board's subtitle says so.
 */
export const takenIdeas = (q: string): ResultRow[] => {
  const s = stem(q)
  return offer([`drink${s}.com`, `${s}odesa.com`, `the${s}.com`, `${s}hq.com`], 2)
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
export const STAGING_HOST = 'fit-ration.remixer.ai'
export const CUSTOM_DOMAIN = 'fit-ration.com'
