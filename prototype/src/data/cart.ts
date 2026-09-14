/**
 * What the hosting panel's cart holds, and the arithmetic it prints.
 *
 * The strings here are the panel's own, lifted from the checkout bundle rather than
 * written for the prototype: "First year at" / "Yearly at" beside the figure,
 * "Renews at <amount> yearly" beneath it, "Yearly Plan" / "Monthly Plan" in the
 * select, "Renews automatically until canceled." in the amber strip. Keeping them
 * verbatim is the point — this screen is evidence of what the customer sees today,
 * so paraphrasing it would defeat the exercise.
 *
 * The multi-year sum is also the panel's: first year at the promotional price, every
 * additional year at the renewal price (`s + h * (l - 1)` in their code). Prices come
 * from TLD_PRICES, which is DreamHost's verified table — the mockups' $11.86 renewal
 * appears nowhere in it.
 */
import type { Billing } from '@/state/world'
import { endingOf, minTermYears, priceFor } from './domains'

/** Remixer Build, from the verified product facts (CLAUDE.md). */
export const PLAN = {
  yearly: { first: 119.88, renew: 119.88, cycle: 'yearly' as const, label: 'Yearly' },
  monthly: { first: 9.99, renew: 14.99, cycle: 'monthly' as const, label: 'Monthly' },
}

/** The plan's monthly credit grant, printed on the Remixer line. */
export const PLAN_CREDITS = 1000

export const money = (n: number) => `$${n.toFixed(2)}`

/**
 * The term this line is actually sold for: never shorter than the registry's minimum.
 *
 * `.ai` is sold in two-year blocks (TLD_PRICES `minYears`, and the search row says so
 * in the price stack), but the sheet that fills this cart pushes `years: 1` for every
 * name. Clamping HERE rather than at the sheet is what keeps the two honest together:
 * the figure, the "2 Years" in the select and the Order Summary all read the same
 * number, whatever a caller asked for.
 */
export const termYears = (tld: string, years?: number) =>
  Math.max(Math.round(years ?? 1) || 1, minTermYears(tld))

/** First year at the promo price, the rest at renewal — the panel's own formula. */
export function domainAmount(tld: string, years: number) {
  const p = priceFor(tld) ?? priceFor('.com')!
  return p.register + p.renew * (termYears(tld, years) - 1)
}

/** The ending a line prices off — multi-label aware, so `.co.uk` is not read as `.uk`. */
export const tldOf = (domain: string) => endingOf(domain) || '.com'

/** One line in the panel's cart. Kept minimal: it is a shopping cart, not an order. */
export interface CartLine {
  kind: 'domreg' | 'remixer'
  /** The name being registered. Domain lines only. */
  domain?: string
  /** Registration term in years. Domain lines only. */
  years?: number
  /** Billing cycle. The plan line only. */
  term?: Billing
}

export interface LineCopy {
  /** Drives the icon and its tile colour. */
  product: 'domreg' | 'remixer'
  name: string
  /** The second line. `bold` is rendered in 700, as the panel renders "Build:". */
  sub: { bold?: string; text: string }
  amount: number
  /**
   * The promo label to the LEFT of the figure — "First year", "First month" — or ''
   * when the line carries no promotion. Taken from a live two-product capture
   * (19 Aug 2026): a discounted line reads "First 3 months $29.50/mo." with
   * "then $59.00/mo." beneath, and an undiscounted one is just "$3.00/mo.".
   */
  termLabel: string
  /** "/mo." or "/yr." — the panel prints the cycle right after the figure. */
  cycle: string
  /** The "then $X/mo." line, or null when the price does not step up. */
  then: { amount: string; cycle: string } | null
  /** The label inside the line's select control. */
  option: string
  /** What that select offers. Value is years for a domain, a term for the plan. */
  options: { value: string; label: string }[]
}

const yearLabel = (n: number) => (n === 1 ? '1 Year' : `${n} Years`)

/**
 * Registration terms offered on a domain line. The panel's real list is unknown —
 * this is a sensible 1–5, labelled the way its code pluralises ("{{count}} Year(s)").
 *
 * ⚠️ A TLD'S MINIMUM TERM IS PART OF THE LIST, NOT A SPECIAL CASE. A flat 1–5 on
 * every ending sold a one-year `.ai` at $89.99 — an order DreamHost cannot place —
 * on the same screen whose search row had just printed "2-year minimum". The
 * minimum comes off TLD_PRICES, so the next ending with one is right for free.
 */
const yearOptions = (tld: string) => {
  const min = minTermYears(tld)
  const terms: number[] = []
  for (let n = min; n <= Math.max(5, min); n += 1) terms.push(n)
  return terms.map((n) => ({ value: String(n), label: yearLabel(n) }))
}

export function lineCopy(line: CartLine): LineCopy {
  if (line.kind === 'domreg') {
    const domain = line.domain ?? ''
    const tld = tldOf(domain)
    const years = termYears(tld, line.years)
    const price = priceFor(tld) ?? priceFor('.com')!
    const promo = price.register !== price.renew
    /*
     * A MULTI-YEAR FIGURE IS A TOTAL, AND HAS TO SAY SO.
     *
     * `domainAmount` sums the whole term — $9.99 + $19.99 × 2 for three years of a
     * .com — and that is the number the Order Summary adds up, so the figure itself
     * cannot become an average: the line and the summary would stop agreeing, and a
     * per-year average ($16.66) is a price nobody is ever charged and that appears in
     * no DreamHost table. What was wrong was the SUFFIX: "First 3 years $49.97/yr."
     * claims $149.91, and ".ai 2 Years" read "$179.98/yr." Naming it a total keeps
     * the honest number and drops the false rate, and the per-year rate is still on
     * screen underneath as the renewal.
     *
     * The suffix carries a NO-BREAK space: `.dh-tile__figure` is an inline-flex box,
     * which strips a leading ordinary space and glues the word to the figure.
     */
    const multiYear = years > 1
    return {
      product: 'domreg',
      name: domain,
      // `.{{tld}} domain registration` — the panel's own title for a domreg line.
      sub: { text: `${tld} domain registration` },
      amount: domainAmount(tld, years),
      // A .com is $9.99 the first year and $19.99 after, so the line is a promo and
      // carries the step-up. A TLD that renews at its registration price shows a
      // bare figure, like DreamShield's $3.00/mo. in the capture — until the term is
      // longer than a year, where even a flat price needs to say what the sum covers.
      termLabel: multiYear ? `First ${years} years` : promo ? 'First year' : '',
      cycle: multiYear ? ' total' : '/yr.',
      // The renewal rate travels with every multi-year total, promo or not: it is the
      // only per-year number on the line, and the house rule is that the renewal
      // price never travels separately from the price above it.
      then: promo || multiYear ? { amount: money(price.renew), cycle: '/yr.' } : null,
      option: yearLabel(years),
      options: yearOptions(tld),
    }
  }

  const term = line.term ?? 'yearly'
  const plan = PLAN[term]
  const promo = plan.first !== plan.renew
  return {
    product: 'remixer',
    name: 'Remixer',
    // The panel prints the plan as "Build:" + the credit grant.
    sub: { bold: 'Build:', text: `${PLAN_CREDITS.toLocaleString('en-US')} Credits/mo` },
    amount: plan.first,
    // Monthly is $9.99 then $14.99, so it reads as a promo; yearly is flat.
    termLabel: promo ? 'First month' : '',
    cycle: term === 'yearly' ? '/yr.' : '/mo.',
    then: promo ? { amount: money(plan.renew), cycle: '/mo.' } : null,
    option: `${plan.label} Plan`,
    options: [
      { value: 'monthly', label: 'Monthly Plan' },
      { value: 'yearly', label: 'Yearly Plan' },
    ],
  }
}

export const cartTotal = (lines: CartLine[]) =>
  lines.reduce((sum, line) => sum + lineCopy(line).amount, 0)
