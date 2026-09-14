/**
 * The hosting panel's cart — the step that happens OUTSIDE Remixer.
 *
 * Pressing "Continue to checkout" in the builder does not open a Remixer screen: it
 * navigates to panel.dreamhost.com/?tree=checkout.dashboard, and the customer finishes
 * paying in the hosting panel. The prototype now plays that beat instead of skipping
 * it, because a flow that pretends the seam is not there cannot be reviewed.
 *
 * Fidelity, and where it stops:
 *  - Every layout number, colour, radius and type size comes from a "save page
 *    complete" capture of the real cart (18 Aug 2026) — see panel-cart.css, which
 *    names the original class beside each value, and the measurement notes in
 *    docs/handoff/panel-cart-measured.md.
 *  - Copy is verbatim: "Sort By: Newest", "Remove All", "Your order (n)",
 *    "Renews automatically until canceled.", the Order Summary block and the legal
 *    paragraphs under Submit Order.
 *  - Icons are traced (see icons.tsx). The exceptions, all cosmetic and all listed in
 *    the handoff: the four Add Product glyphs in the sidebar, the SEO Toolkit glyph
 *    and the avatar, whose art the capture did not carry — and the alert mark on the
 *    strip below, which is MUI's `error` in the same amber the traced marks use.
 *  - ONE THING ON THIS PAGE IS NOT THE PANEL'S: the amber "needs a plan" strip in the
 *    Order Summary (see `Summary`). DreamHost's cart has no such rule, because the rule
 *    is OURS — a custom domain only goes live on a paid plan (world.violations()). The
 *    panel would happily sell a domain registration on its own, and did, straight into a
 *    world the product declares impossible (QA, 14.09.2026). It is built out of the
 *    panel's own parts — its amber warningSimple strip, its Add button — so that the
 *    screen stays quotable even where it is saying something only Remixer would say.
 *  - There is no receipt page: Submit Order charges and drops the customer straight
 *    back into Remixer (confirmed with the designer). The wait is compressed to a
 *    short "Placing your order…" rather than removed — the panel does charge a card
 *    before it hands anything back. Where the return lands inside Remixer is OUR
 *    decision, and this file makes it: the domain status screen, because that is what
 *    the checkout sheet promised ("Connects automatically after checkout").
 *
 * The panel is English-only here. Its own localisation exists but was not captured,
 * and the value of this screen is that it is quotable evidence — a translation we
 * wrote ourselves would not be.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { hasPlan, useWorld } from '@/state/world'
import { useUI } from '@/state/ui'
import { startConnect } from '@/modules/domains/connect'
import { cartTotal, lineCopy, money, type CartLine } from '@/data/cart'
import { cardInRow, foreignPage } from '@/ui/motion'
import {
  DhAvatarGlyph, DhBack, DhCartAdd, DhCheck, DhChevron, DhEmptyCart, DhLogo,
  DhNavBillingAccount, DhNavBusinessTools, DhNavCloudServices, DhNavDomainNames,
  DhNavHome, DhNavMail, DhNavMore, DhNavProServices, DhNavRemixer, DhNavServersUsage,
  DhNavSupport, DhNavWebsites, DhProductDomain, DhProductRemixer, DhRemoveAllIcon,
  DhRenewalIcon, DhSearch, DhSeoGlyph, DhSupport, DhTrash,
} from './icons'
import './panel-cart.css'

/* ------------------------------------------------------------------- chrome */

/** The navigation, in the panel's order. Items without a caret are plain links. */
const NAV: { label: string; icon: (p: { size?: number }) => JSX.Element; expandable?: boolean }[] = [
  { label: 'Home', icon: DhNavHome },
  { label: 'Websites', icon: DhNavWebsites, expandable: true },
  { label: 'Remixer', icon: DhNavRemixer },
  { label: 'Domain Names', icon: DhNavDomainNames, expandable: true },
  { label: 'Mail', icon: DhNavMail, expandable: true },
  { label: 'Pro Services', icon: DhNavProServices, expandable: true },
  { label: 'Servers & Usage', icon: DhNavServersUsage },
  { label: 'Cloud Services', icon: DhNavCloudServices, expandable: true },
  { label: 'Billing & Account', icon: DhNavBillingAccount, expandable: true },
  { label: 'Business Tools', icon: DhNavBusinessTools, expandable: true },
  { label: 'Support', icon: DhNavSupport, expandable: true },
  { label: 'More', icon: DhNavMore, expandable: true },
]

/** The sidebar's Add Product list, with the captions the panel ships. */
const ADDONS: { name: string; note: string; colour: string; badge?: string }[] = [
  { name: 'DreamShield', note: 'Protect your website', colour: '#3340a9' },
  { name: 'CDN', note: 'Faster content delivery', colour: '#f4511e', badge: 'NEW' },
  { name: 'DreamCare', note: 'Site Monitoring & Maintenance', colour: '#7c3aed' },
  { name: 'SEO Toolkit', note: 'Get more traffic', colour: '#12a150' },
]

function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="dh-topbar">
      <div className="dh-topbar__left">
        <button className="dh-burger" aria-label="Hide menu">
          <svg width={18} height={12} viewBox="0 0 18 12" aria-hidden>
            <path d="M0 1h18M0 6h18M0 11h18" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
          </svg>
        </button>
        <span className="dh-logo"><DhLogo /></span>
      </div>

      {/* The panel puts an in-page Back beside the logo while checking out. */}
      <button className="dh-back" onClick={onBack}>
        <DhBack />
        <span>Back</span>
      </button>

      <div className="dh-userbar">
        <div className="dh-search">
          <span className="dh-search__icon"><DhSearch /></span>
          <span className="dh-search__text">Search</span>
          <span className="dh-assistant">
            <span>Assistant</span>
            <span className="dh-assistant__spark" />
          </span>
        </div>

        <div className="dh-actions">
          <button className="dh-support">
            <span>Support</span>
            <DhSupport />
          </button>
          <button className="dh-bell" aria-label="Notifications">
            <svg width={20} height={20} viewBox="0 0 20 20" aria-hidden>
              <path
                d="M10 2.5a4.5 4.5 0 0 0-4.5 4.5v3L4 12.5h12L14.5 10V7A4.5 4.5 0 0 0 10 2.5Zm0 13.5a2 2 0 0 0 2-2H8a2 2 0 0 0 2 2Z"
                fill="currentColor"
              />
            </svg>
            <span className="dh-bell__count">3</span>
          </button>
          <span className="dh-avatar">
            <span className="dh-avatar__inner"><DhAvatarGlyph /></span>
          </span>
        </div>
      </div>
    </div>
  )
}

function Sidebar() {
  return (
    <nav className="dh-sidebar" aria-label="Panel navigation">
      <div className="dh-nav">
        {NAV.map(({ label, icon: Icon, expandable }) => (
          <button key={label} className="dh-nav__item">
            <Icon />
            <span className="dh-nav__label">{label}</span>
            {expandable && <span className="dh-nav__chev"><DhChevron /></span>}
          </button>
        ))}
      </div>

      <div className="dh-addproduct">
        <p className="dh-addproduct__title">Add Product</p>
        <div className="dh-toggle">
          <button className="dh-toggle__btn" data-on="true">Add-ons</button>
          <button className="dh-toggle__btn" data-on="false">Hosting</button>
        </div>
        <div className="dh-products-list">
          {ADDONS.map((p) => (
            <button key={p.name} className="dh-products-list__row">
              <span className="dh-products-list__icon" style={{ background: p.colour }} />
              <span>
                <span className="dh-products-list__name">
                  {p.name}
                  {p.badge && <span className="dh-badge-new">{p.badge}</span>}
                </span>
                <span className="dh-products-list__note">{p.note}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

/* -------------------------------------------------------------- line items */

/**
 * One card per product type, in the order the customer added them.
 *
 * The panel groups the cart by product: a second capture (two products) shows
 * DreamCare and DreamShield as two separate white cards 24px apart, while several
 * items of the SAME product share one card and are divided by a hairline. Buying a
 * domain and the plan together therefore yields two cards, not one.
 */
function groupByKind(lines: CartLine[]) {
  const groups: { line: CartLine; index: number }[][] = []
  lines.forEach((line, index) => {
    const existing = groups.find((g) => g[0].line.kind === line.kind)
    if (existing) existing.push({ line, index })
    else groups.push([{ line, index }])
  })
  return groups
}

function Tile({
  line, onRemove, onChange, openSelect, setOpenSelect, id,
}: {
  line: CartLine
  onRemove: () => void
  onChange: (value: string) => void
  openSelect: string | null
  setOpenSelect: (id: string | null) => void
  id: string
}) {
  const copy = lineCopy(line)
  const open = openSelect === id
  return (
    <div className="dh-tile">
      <div className="dh-tile__info">
        <div className="dh-tile__title">
          <span className="dh-tile__icon" data-product={copy.product}>
            {/* .icon-GdJFT img { width: 32px } — both product marks render at 32. */}
            {copy.product === 'domreg' ? <DhProductDomain size={32} /> : <DhProductRemixer size={32} />}
          </span>
          <span className="dh-tile__meta">
            <span className="dh-tile__name">{copy.name}</span>
            <span className="dh-tile__sub">
              {copy.sub.bold && <b>{copy.sub.bold}&nbsp;</b>}
              {copy.sub.text}
            </span>
          </span>
        </div>

        {/* "First year $9.99/yr." over "then $19.99/yr." — the shape a discounted
            line takes in the panel. An undiscounted line drops both extras. */}
        <div className="dh-tile__price">
          <span className="dh-tile__amount">
            {copy.termLabel && <span className="dh-tile__term">{copy.termLabel}</span>}
            <span className="dh-tile__figure">
              {money(copy.amount)}
              <span className="dh-tile__cycle">{copy.cycle}</span>
            </span>
          </span>
          {copy.then && (
            <span className="dh-tile__renew">
              then <span>{copy.then.amount}</span>{copy.then.cycle}
            </span>
          )}
        </div>
      </div>

      <div className="dh-tile__options">
        <div className="dh-selects">
          <div className="dh-select">
            <button
              data-open={open}
              aria-expanded={open}
              onClick={() => setOpenSelect(open ? null : id)}
            >
              <span className="dh-select__value">{copy.option}</span>
              <span className="dh-select__chev"><DhChevron /></span>
            </button>
            {open && (
              <div className="dh-select__menu" role="listbox">
                <div className="dh-select__list">
                  {copy.options.map((o) => (
                    <button
                      key={o.value}
                      className="dh-select__option"
                      role="option"
                      aria-selected={o.label === copy.option}
                      data-selected={o.label === copy.option}
                      onClick={() => { onChange(o.value); setOpenSelect(null) }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <button className="dh-remove" onClick={onRemove} aria-label={`Remove ${copy.name}`}>
          <DhTrash />
        </button>
      </div>

      <div className="dh-renewal">
        <DhRenewalIcon />
        <span>Renews automatically until canceled.</span>
      </div>
    </div>
  )
}

/** Verbatim from the capture, including the three feature bullets and the price. */
function Recommendation() {
  return (
    <div className="dh-recos">
      <p className="dh-section__label">Recommended for you</p>
      <div className="dh-recos__card">
        <div className="dh-reco">
          <div className="dh-reco__left">
            <span className="dh-reco__icon" data-product="marketgoo_seo"><DhSeoGlyph /></span>
            <span className="dh-reco__meta">
              <span className="dh-reco__head">
                <span className="dh-reco__title">DreamHost SEO Toolkit</span>
              </span>
              <span className="dh-reco__text">
                Improve your search engine rankings and drive more customers to your website.
              </span>
              <span className="dh-reco__features">
                {['Personalized SEO plan', 'Keyword tracking', 'Increase organic traffic'].map((f) => (
                  <span key={f} className="dh-reco__feature"><DhCheck />{f}</span>
                ))}
              </span>
            </span>
          </div>
          <div className="dh-reco__right">
            <span className="dh-reco__price">Starting at <b>$4.99</b>/mo.</span>
            <button className="dh-reco__add"><DhCartAdd />Add</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- summary */

/** MUI `error`, in the amber the panel's traced marks use. Ours — see the header. */
function DhAlert() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        fill="#F4511E"
        d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm0 11a1 1 0 0 1-1-1V8a1 1 0 1 1 2 0v4a1 1 0 0 1-1 1Zm1 4h-2v-2h2v2Z"
      />
    </svg>
  )
}

function Summary({
  count, total, submitting, blocker, onSubmit, onRestorePlan,
}: {
  count: number
  total: number
  submitting: boolean
  /**
   * The order cannot be placed, and this is the domain it would have stranded.
   * Null the rest of the time — see `blocker` in `PanelCart` for the rule.
   */
  blocker: { domain: string } | null
  onSubmit: () => void
  onRestorePlan: () => void
}) {
  return (
    <aside className="dh-summary">
      <div className="dh-summary__header">
        <div className="dh-summary__title">Order Summary</div>
        <div className="dh-summary__count">{count === 1 ? '1 item' : `${count} items`}</div>
      </div>

      <div className="dh-summary__row dh-summary__row--total">
        <div className="dh-summary__rowtitle">Total</div>
        <div className="dh-summary__rowprice">{money(total)}</div>
      </div>

      <div className="dh-summary__submitwrap">
        {/*
          WHY THE BUTTON IS OFF, SAID OUT LOUD, AND THE ONE PRESS THAT TURNS IT BACK ON.
          A greyed Submit Order with nothing beside it is its own defect: the customer
          removed a line and the till went quiet. So the refusal names the domain it is
          protecting, names what it needs, and carries the panel's own Add button — the
          plan goes back exactly as it was, which is the only way out of this state that
          does not cost the customer the whole trip (the alternative is Back, which
          empties the cart). `.dh-renewal` is the panel's warningSimple strip, reused
          verbatim; only the glyph and the sentence are ours.
        */}
        {blocker && (
          <motion.div
            id="dh-plan-required"
            role="status"
            className="dh-renewal mb-5"
            variants={cardInRow}
            custom={0}
            initial="initial"
            animate="animate"
          >
            <DhAlert />
            <span className="min-w-0 flex-1">
              {blocker.domain} can only go live on the Remixer Build plan — add it back to
              place this order.
            </span>
            {/* `[&>svg]:mr-0` because the strip styles its own mark (`.dh-renewal svg`
                gets 12px of clearance) and that selector reaches into this button too —
                without the reset this Add sits 12px wider than the identical one in the
                recommendation card below, measured. */}
            <button className="dh-reco__add ml-3 flex-none [&>svg]:mr-0" onClick={onRestorePlan}>
              <DhCartAdd />Add
            </button>
          </motion.div>
        )}

        <button
          className="dh-submit"
          onClick={onSubmit}
          disabled={count === 0 || submitting || blocker !== null}
          aria-describedby={blocker ? 'dh-plan-required' : undefined}
        >
          {submitting ? 'Placing your order…' : 'Submit Order'}
        </button>
      </div>

      <div className="dh-disclaimer">
        <p>
          By clicking “Submit Order”, you agree to our{' '}
          <a href="#terms" onClick={(e) => e.preventDefault()}>Terms</a>.
        </p>
        <p>
          You will be charged the price above. Exact prices including any recurring charges,
          promo durations, and billing cycles are shown next to each product in your shopping
          cart. Cancel anytime via your{' '}
          <a href="#account" onClick={(e) => e.preventDefault()}>account</a>.
        </p>
      </div>
    </aside>
  )
}

/* --------------------------------------------- the intent that outlives the till */

/**
 * THE DOMAIN THE CUSTOMER CAME TO THE TILL TO CONNECT, PARKED ACROSS CHECKOUT.
 *
 * Attaching a domain that already sits in the customer's DreamHost account is FREE, so it
 * puts no line in the cart. Somebody on a trial who presses Connect on their own domain
 * therefore arrives here with exactly one line — the plan they have to buy before anything
 * can go live — and the name they came for written nowhere this page can reach it: not in
 * the cart, not in `world.customDomain` (only written once a connect actually starts), not
 * in the UI store (the sheet closes on the way out).
 *
 * This page used to read the intent off the cart, and so could only ever honour a
 * PURCHASE: it started a connect when it found a domain-registration line, and otherwise
 * just opened the Publish panel. The sheet promised "connects as soon as you add a plan",
 * the customer added the plan, and the domain was never attached — nothing on screen even
 * said so (QA, 13.09.2026). The intent was dropped on the floor between the sheet and the
 * till, so the fix is to give it somewhere to stand: one name, parked when the customer is
 * sent to checkout, spent once when the order is placed, dropped on every other way out.
 * (The August `pendingSetup` branch solved the same problem the same way.)
 *
 * IT IS PERSISTED, deliberately — and the reason is NOT the one first written here.
 *
 * The first version of this comment said the world store persists, so `world.cart`
 * survives a reload and the intent has to survive with it. Half of that is false, and the
 * false half is what the blocker of 14.09.2026 stood on. The world does write itself to
 * localStorage on every change, but `initialWorld()` lets the URL WIN WHOLE: any query
 * string at all and the snapshot is discarded except for the transcript (state/world.ts).
 * Standing at the till always puts `d=checkout` in the address bar, so a reload there
 * comes back with the domain axis still at `checkout` and the cart EMPTY — the two halves
 * of one trip, separated. The UI store is not persisted at all, so the till itself is gone
 * and the customer lands on the Home page.
 *
 * So what this key is really for is the OTHER re-entry: the prototype opened on its plain
 * URL (how the published artifact opens from the gallery, and where a browser Back lands
 * when the entry it returns to predates the query string). No params means the snapshot
 * wins whole, cart included — the abandoned trip comes back entire, and an intent kept
 * only in memory would be the one piece of it missing.
 *
 * Either way the rule below is the same and does not depend on guessing which re-entry
 * happened: the intent is written by the HAND-OFF and by nothing else, once per trip, and
 * a trip that is walked again writes it again. Same idiom as the world's own snapshot:
 * versioned key, best-effort, never fatal (the published artifact runs in a sandbox where
 * storage can be walled off).
 */
const PENDING_KEY = 'remixer-prototype/pending-connect/v1'

let pendingConnect: string | null = (() => {
  try { return localStorage.getItem(PENDING_KEY) } catch { return null }
})()

/**
 * Park a domain to be connected the moment the order is placed.
 *
 * Exported because this module is not the only place that could ever know: the checkout
 * sheet names the domain out loud, and the day it wants to say so itself rather than let
 * the till infer it (see the subscription in `PanelCart`), this is the door. One name at a
 * time — a customer stands at one till.
 */
export function rememberPendingConnect(domain: string) {
  pendingConnect = domain
  try { localStorage.setItem(PENDING_KEY, domain) } catch { /* storage may be walled off */ }
}

/** Drop it: the customer left without paying, a purchase hand-off superseded it, or the
 *  builder came back up around a trip that no longer exists. */
export function clearPendingConnect() {
  pendingConnect = null
  try { localStorage.removeItem(PENDING_KEY) } catch { /* storage may be walled off */ }
}

/** Read AND clear — an intent can be spent exactly once, however often this is called. */
function takePendingConnect(): string | null {
  const domain = pendingConnect
  if (domain) clearPendingConnect()
  return domain
}

/**
 * Read WITHOUT spending. The till renders from this — an order whose only domain is a
 * parked name still has a domain in it, and the plan gate below has to see that.
 *
 * Safe to read during render even though it is not React state: it changes at exactly
 * three moments in a trip, and every one of them is either before this page is on screen
 * (the hand-off) or is accompanied by a world write that re-renders it anyway (`writeCart`
 * dropping the plan, `back`, the submit effect).
 */
function peekPendingConnect(): string | null {
  return pendingConnect
}

/* -------------------------------------------------------------------- page */

export function PanelCart() {
  const { world, set } = useWorld()
  const { panel, closePanel, closeSurface, togglePublish } = useUI()
  const [submitting, setSubmitting] = useState(false)
  /** Which line's select is open, by tile id — one at a time, as in the panel. */
  const [openSelect, setOpenSelect] = useState<string | null>(null)
  /** The plan line the customer took out, kept so "Add" can put back that one. */
  const [removedPlan, setRemovedPlan] = useState<CartLine | null>(null)

  const open = panel === 'cart'
  const lines = world.cart
  const total = cartTotal(lines)

  /*
   * THE ONE ORDER THIS TILL REFUSES TO TAKE.
   *
   * A domain reaches this page two ways — bought here as a registration line, or already
   * owned and parked above — and in both cases what actually puts it in front of the site
   * is the PLAN, not the name. That is a product fact, not a preference: the world's own
   * `violations()` lists a custom domain on an unpaid account as a combination the real
   * product cannot produce ("A custom domain needs a paid plan — checkout comes first").
   *
   * The panel's cart, faithfully, lets you delete any line you like. So a trial customer
   * could delete the Remixer line, pay $4.99 for the domain alone, and walk out with the
   * site live on it — the impossible world, reached through the sheet that had just shown
   * them the plan as mandatory (QA, 14.09.2026). Charging them and then quietly not
   * connecting would have been worse, and letting the account go paid without being asked
   * worse still, so the order is refused while it is in that shape, and the strip in
   * `Summary` says which domain is waiting on what. `hasPlan` is what makes this a rule
   * about the ACCOUNT rather than about the cart: somebody who already pays buys a domain
   * with no plan line at all, and that order is perfectly good.
   */
  const orderDomain = lines.find((l) => l.kind === 'domreg')?.domain ?? peekPendingConnect()
  const blocker =
    orderDomain && !lines.some((l) => l.kind === 'remixer') && !hasPlan(world)
      ? { domain: orderDomain }
      : null

  /*
   * WHO PARKS THE INTENT, AND WHY IT IS CAUGHT HERE RATHER THAN READ AT RENDER.
   *
   * The sheet that sends a customer to checkout writes `cart` and `domain: 'checkout'` in
   * ONE store write — the world's own word for "standing at the till" — WHILE IT IS STILL
   * ON SCREEN, and only then closes itself and opens this page
   * (modules/domains/DomainModal.tsx). At that one instant both halves are readable: the
   * write says the customer is being sent to checkout, and `ui.domainModal` still names
   * the domain they pressed Connect on. By the time this component renders with the panel
   * open, the sheet is gone — a render-time read is a frame too late, which is why this is
   * a store subscription and not an effect on `open`.
   *
   * ⚠️ THE HAND-OFF IS A WRITE, NOT A MOVE OF THE AXIS. This used to fire only on a
   * TRANSITION into `checkout` (`prev.world.domain !== 'checkout'`), which is true exactly
   * once per browser session and then never again — because the axis persists and the till
   * does not. Reload at the till, or come back to the prototype on its plain URL, and the
   * world is ALREADY sitting at `checkout`; walk the same trip again and the sheet's write
   * moved nothing, so nothing was parked. Submit Order then took the money, emptied the
   * cart and attached no domain at all — or, when an intent from the abandoned trip was
   * still in storage, attached THAT one instead of the name on the sheet just pressed
   * (QA, 14.09.2026, reproductions A and B). The test is therefore the cart REFERENCE:
   * `set({ cart: lines, ... })` hands over a fresh array every time, while every write that
   * leaves the cart alone carries the same one through (state/world.ts `set`). One trip,
   * one hand-off, one park — however many times the customer walks it.
   *
   * AND IT WRITES EITHER WAY, so the intent can never be older than the trip on screen.
   * A registration line means the name is being BOUGHT here, and the cart carries it to
   * submit on its own; anything parked at that point belongs to a trip that was abandoned,
   * and it dies here rather than riding along on somebody else's order.
   *
   * `sheet` being null means this write is not a hand-off — the cart being edited at the
   * till, or a scenario being staged — and nothing about the intent changes.
   */
  useEffect(() =>
    useWorld.subscribe((s, prev) => {
      if (s.world.domain !== 'checkout' || s.world.cart === prev.world.cart) return
      const sheet = useUI.getState().domainModal
      if (!sheet) return
      if (s.world.cart.some((l) => l.kind === 'domreg')) clearPendingConnect()
      else rememberPendingConnect(sheet.domain)
    }), [])

  /*
   * …and the same intent is dropped when the builder comes back up around a trip that no
   * longer exists. This page lives inside the builder shell (App.tsx), so this runs on
   * every entry into it, which is where a re-entry lands: the till is UI state and does not
   * persist, so nobody can still be standing at it.
   *
   * The world tells the two re-entries apart without having to know which one happened. A
   * reload at the till comes back with `d=checkout` in the address bar and an empty cart
   * (the URL wins whole — see PENDING_KEY above), and an intent with no plan left to pay
   * for it is spent money waiting to happen: dropped. The plain-URL re-entry comes back
   * with the whole snapshot, checkout and cart together — that trip is intact and merely
   * interrupted, so the intent stands, and the hand-off above overwrites it the moment the
   * customer walks a different one.
   */
  useEffect(() => {
    const w = useWorld.getState().world
    if (w.domain !== 'checkout' || !w.cart.some((l) => l.kind === 'remixer')) clearPendingConnect()
  }, [])

  /*
   * Leaving without paying is a real outcome, and this is its one exit — the Back button
   * beside the logo, and Escape.
   *
   * THE CART LEAVES WITH THE CUSTOMER. The real panel keeps a cart between visits and this
   * page used to copy that, but the prototype has nowhere to keep it: there is no route
   * back to the till and nothing in the builder that says items are waiting, so a kept
   * cart was invisible state that could only surprise somebody later. It also contradicted
   * the line beneath it — walking out moves the domain axis off `checkout`, so the world
   * stopped standing at the till while the till stayed loaded. Emptying it makes the two
   * agree, and the parked intent goes with it: nothing was paid for, so nothing is pending.
   *
   * The honest alternative — keep the cart AND say so, with a way back into checkout from
   * the builder chrome — needs a surface outside this file. Until that exists, this is the
   * half that can be told truthfully.
   */
  const back = () => {
    clearPendingConnect()
    closePanel()
    set({ cart: [], domain: 'searching' })
  }

  /*
   * Escape closes an open dropdown first and the page only when nothing is open —
   * otherwise one keystroke would throw the customer out of checkout.
   *
   * ⚠️ ON THE CAPTURE PHASE, AND IT STOPS THERE. This page is a full-window takeover of
   * somebody else's site; nothing of ours is on screen under it, and nothing of ours
   * should be listening. The domains surface is still mounted behind it and keeps its own
   * Escape on `document` (DomainsSurface: step back a screen, then close the window), so
   * one press used to run BOTH — the cart emptied itself and walked out, and the surface
   * underneath navigated as well, so the customer landed somewhere they had not asked for
   * with a filled cart silently discarded. A capture listener on `document` runs before
   * every bubble listener on it, so stopping propagation here is what makes the takeover
   * actually take over. The in-app Back button never had the problem: it is one handler.
   */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      if (openSelect) setOpenSelect(null)
      else back()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, openSelect])

  /* A click anywhere else dismisses the menu. Captured on the panel's own root, so
     it cannot fire for clicks outside this surface. */
  useEffect(() => {
    if (!openSelect) return
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest('.dh-select')) setOpenSelect(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openSelect])

  /* Submitting is the one step with a real wait in it: the panel charges the card and
     provisions before it hands anything back. Compressed, but not to zero — the flow
     engine's rule (waits stay proportional) applies to this screen too.

     The first line is an assertion, not a branch the customer can reach: the button that
     sets `submitting` is disabled for exactly this order (see `blocker`). It is here
     because the failure it guards against is the expensive kind — charging a card and
     leaving the domain behind — and because this effect runs on a timer, which is long
     enough for the order to change under it. Refusing costs nothing; the alternative
     costs the customer their money. */
  useEffect(() => {
    if (!submitting) return
    if (blocker) { setSubmitting(false); return }
    const t = window.setTimeout(() => {
      const plan = lines.find((l) => l.kind === 'remixer')
      /* Two ways a domain can come out of this order, and only one of them is a purchase.
         A registration line is a name bought HERE; a parked intent is a name the customer
         already held, which this order merely paid for the right to put in front of the
         site. `take` reads and clears, so the intent cannot be spent twice — and a stale
         one left over from an abandoned trip dies here rather than riding along. */
      const registered = lines.find((l) => l.kind === 'domreg')?.domain
      const owned = takePendingConnect()
      set({
        ...(plan ? { account: 'paid' as const, billing: plan.term ?? 'yearly', credits: 1000 } : null),
        cart: [],
      })
      setSubmitting(false)
      closePanel()
      closeSurface()
      /* Where the return lands is OUR decision, and it is the Publish panel: the sheet
         promised "connects automatically after checkout", and the panel is where every
         state of that connection is now read (designer, 13.09.2026). A domain bought here
         is a fresh registration, so its ICANN clock starts with it; one that was already
         in the account was not registered by this transaction, so it must NOT — `bought`
         is what gates that clock (modules/domains/connect.ts). */
      if (registered) startConnect(registered, { bought: true })
      else if (owned) startConnect(owned, { bought: false })
      else togglePublish(true)
    }, 1500)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting])

  /**
   * Every write to the cart goes through here, and it keeps the one thing the customer
   * cannot get back on their own.
   *
   * Pulling the plan line out used to DROP the parked connect with it, on the reasoning
   * that an intent cannot outlive the line that pays for it. True of the money, wrong
   * about the intent: it threw away the only record of which domain the customer came
   * for, at the one moment they might want it back, and it left the till unable to say
   * what had just gone wrong — the connect-what-you-own order is a single plan line, so
   * removing it emptied the cart and the name vanished with it. The intent now stays and
   * `blocker` below holds the line instead: an order with a domain and no plan cannot be
   * placed at all, so nothing can spend it. It still dies on the way out (`back`), on the
   * next hand-off, and on re-entry into a builder whose cart no longer holds the plan.
   */
  const writeCart = (next: CartLine[]) => {
    const dropped = lines.find((l) => l.kind === 'remixer')
    if (dropped && !next.some((l) => l.kind === 'remixer')) setRemovedPlan(dropped)
    set({ cart: next })
  }

  const removeLine = (i: number) =>
    writeCart(lines.filter((_, n) => n !== i))

  /** "Add" on the refusal strip: the plan goes back exactly as it was taken out — same
   *  billing term, so the total returns to the figure the customer already agreed to. A
   *  removal this page did not see (it was made before a re-entry) falls back to the
   *  account's own billing axis rather than inventing a term. */
  const restorePlan = () => {
    writeCart([...lines, removedPlan ?? { kind: 'remixer', term: world.billing }])
    setRemovedPlan(null)
  }

  /** Applying a choice: years on a domain line, billing term on the plan line.
   *  Both feed straight back into the totals. */
  const changeLine = (i: number, value: string) =>
    writeCart(
      lines.map((line, n) =>
        n !== i ? line
          : line.kind === 'domreg' ? { ...line, years: Number(value) }
          : { ...line, term: value as 'monthly' | 'yearly' },
      ),
    )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="dh-panel"
          variants={foreignPage}
          initial="initial"
          animate="animate"
          exit="exit"
          role="region"
          aria-label="DreamHost panel — cart"
        >
          <TopBar onBack={back} />

          <div className="dh-body">
            <Sidebar />

            <div className="dh-main">
              <div className="dh-cart">
                <div className="dh-cart__header">
                  <div className="dh-cart__titlerow">
                    <div className="dh-cart__title">Cart</div>
                  </div>
                  <div className="dh-cart__filters">
                    <button className="dh-sort">
                      <span>Sort By:&nbsp;</span>
                      <span className="dh-sort__value">Newest</span>
                      <DhChevron />
                    </button>
                    <button className="dh-removeall" onClick={() => writeCart([])}>
                      <span>Remove All</span>
                      <DhRemoveAllIcon />
                    </button>
                  </div>
                </div>

                <div className="dh-cart__products">
                  {lines.length > 0 ? (
                    <>
                      <div className="dh-section">
                        {/* The count is items, not cards — two products in two cards
                            still read "Your order (2)" in the capture. */}
                        <p className="dh-section__label">Your order ({lines.length})</p>
                        {groupByKind(lines).map((group) => (
                          <div className="dh-group" key={group[0].line.kind}>
                            {group.map(({ line, index }) => (
                              <Tile
                                key={`${line.kind}-${line.domain ?? index}`}
                                id={`${line.kind}-${index}`}
                                line={line}
                                onRemove={() => removeLine(index)}
                                onChange={(value) => changeLine(index, value)}
                                openSelect={openSelect}
                                setOpenSelect={setOpenSelect}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                      <Recommendation />
                    </>
                  ) : (
                    <div className="dh-empty">
                      <DhEmptyCart />
                      <div className="dh-empty__text">
                        <p className="dh-empty__title"><span>Oops!</span> Your cart is empty!</p>
                        <p className="dh-empty__desc">
                          Looks like you haven’t added anything to your cart yet.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Summary
                count={lines.length}
                total={total}
                submitting={submitting}
                blocker={blocker}
                onSubmit={() => setSubmitting(true)}
                onRestorePlan={restorePlan}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
