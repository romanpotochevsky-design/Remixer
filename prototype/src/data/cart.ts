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
import { priceFor } from './domains'

/** Remixer Build, from the verified product facts (CLAUDE.md). */
export const PLAN = {
  yearly: { first: 119.88, renew: 119.88, cycle: 'yearly' as const, label: 'Yearly' },
  monthly: { first: 9.99, renew: 14.99, cycle: 'monthly' as const, label: 'Monthly' },
}

/** The plan's monthly credit grant, printed on the Remixer line. */
export const PLAN_CREDITS = 1000

export const money = (n: number) => `$${n.toFixed(2)}`

/** First year at the promo price, the rest at renewal — the panel's own formula. */
export function domainAmount(tld: string, years: number) {
  const p = priceFor(tld) ?? priceFor('.com')!
  return p.register + p.renew * (years - 1)
}

export const tldOf = (domain: string) =>
  domain.includes('.') ? domain.slice(domain.lastIndexOf('.')) : '.com'

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

/** Registration terms offered on a domain line. The panel's real list is unknown —
 *  this is a sensible 1–5, labelled the way its code pluralises ("{{count}} Year(s)"). */
const YEAR_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({
  value: String(n),
  label: n === 1 ? '1 Year' : `${n} Years`,
}))

export function lineCopy(line: CartLine): LineCopy {
  if (line.kind === 'domreg') {
    const domain = line.domain ?? ''
    const tld = tldOf(domain)
    const years = line.years ?? 1
    const price = priceFor(tld) ?? priceFor('.com')!
    const promo = price.register !== price.renew
    return {
      product: 'domreg',
      name: domain,
      // `.{{tld}} domain registration` — the panel's own title for a domreg line.
      sub: { text: `${tld} domain registration` },
      amount: domainAmount(tld, years),
      // A .com is $9.99 the first year and $19.99 after, so the line is a promo and
      // carries the step-up. A TLD that renews at its registration price shows a
      // bare figure, like DreamShield's $3.00/mo. in the capture.
      termLabel: promo ? (years === 1 ? 'First year' : `First ${years} years`) : '',
      cycle: '/yr.',
      then: promo ? { amount: money(price.renew), cycle: '/yr.' } : null,
      option: years === 1 ? '1 Year' : `${years} Years`,
      options: YEAR_OPTIONS,
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
