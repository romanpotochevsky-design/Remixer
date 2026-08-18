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
  /** e.g. "First year at" — sits to the left of the figure. */
  termLabel: string
  /** e.g. "Renews at $19.99 yearly" — the honest number, never hidden. */
  renewal: { prefix: string; amount: string; suffix: string }
  /** The label inside the line's select control. */
  option: string
}

export function lineCopy(line: CartLine): LineCopy {
  if (line.kind === 'domreg') {
    const domain = line.domain ?? ''
    const tld = tldOf(domain)
    const years = line.years ?? 1
    const price = priceFor(tld) ?? priceFor('.com')!
    return {
      product: 'domreg',
      name: domain,
      // `.{{tld}} domain registration` — the panel's own title for a domreg line.
      sub: { text: `${tld} domain registration` },
      amount: domainAmount(tld, years),
      termLabel: years === 1 ? 'First year at' : `First ${years} years at`,
      renewal: {
        prefix: 'Renews at ',
        amount: money(price.renew),
        suffix: years === 1 ? ' yearly' : ` ${years} years`,
      },
      option: years === 1 ? '1 Year' : `${years} Years`,
    }
  }

  const term = line.term ?? 'yearly'
  const plan = PLAN[term]
  return {
    product: 'remixer',
    name: 'Remixer',
    // The panel prints the plan as "Build:" + the credit grant.
    sub: { bold: 'Build:', text: `${PLAN_CREDITS.toLocaleString('en-US')} Credits/mo` },
    amount: plan.first,
    termLabel: `${plan.label} at`,
    renewal: { prefix: 'Renews at ', amount: money(plan.renew), suffix: ` ${plan.cycle}` },
    option: `${plan.label} Plan`,
  }
}

export const cartTotal = (lines: CartLine[]) =>
  lines.reduce((sum, line) => sum + lineCopy(line).amount, 0)
