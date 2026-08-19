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
 *    and the avatar, whose art the capture did not carry.
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
import { useWorld, runDomainTimeline, BUY_TIMELINE, CONNECT_OWN_TIMELINE } from '@/state/world'
import { useUI } from '@/state/ui'
import { cartTotal, lineCopy, money, type CartLine } from '@/data/cart'
import { foreignPage } from '@/ui/motion'
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

function Summary({
  count, total, submitting, onSubmit,
}: { count: number; total: number; submitting: boolean; onSubmit: () => void }) {
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
        <button className="dh-submit" onClick={onSubmit} disabled={count === 0 || submitting}>
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

/* -------------------------------------------------------------------- page */

export function PanelCart() {
  const { world, set } = useWorld()
  const { panel, closePanel, togglePublish, showToast, pendingSetup, setPendingSetup, openDomains } = useUI()
  const [submitting, setSubmitting] = useState(false)
  /** Which line's select is open, by tile id — one at a time, as in the panel. */
  const [openSelect, setOpenSelect] = useState<string | null>(null)

  const open = panel === 'cart'
  const lines = world.cart
  const total = cartTotal(lines)

  /* Leaving without paying is a real outcome — the cart survives it, exactly as the
     panel's does, and the builder goes back to the screen the user came from. */
  const back = () => {
    closePanel()
    set({ domain: 'searching' })
  }

  /* Escape closes an open dropdown first and the page only when nothing is open —
     otherwise one keystroke would throw the customer out of checkout. */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (openSelect) setOpenSelect(null)
      else back()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
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
     engine's rule (waits stay proportional) applies to this screen too. */
  useEffect(() => {
    if (!submitting) return
    const t = window.setTimeout(() => {
      const plan = lines.find((l) => l.kind === 'remixer')
      const bought = lines.find((l) => l.kind === 'domreg')?.domain

      /*
       * Coming back from the till, and what happens next depends on what was bought.
       *
       * A NEW registration does not connect in seconds, whatever the old boards said:
       * registration finishes inside 15 minutes, but a new registration's nameservers
       * take 24-72 hours to fully update — both DreamHost's own numbers. So the domain
       * enters `registering` and walks its real timeline from there.
       *
       * The Publish panel DOES open here, unlike the connect-what-you-own path,
       * because this wait is long and there is something to report. That is the rule:
       * the panel opens when there is a state worth carrying, and stays shut when the
       * work finishes before the customer could read about it.
       */
      /* A connect the plan gate interrupted resumes HERE, not on a dashboard: the
         customer already said which domain and what for, and the till was the last
         question. `own` finishes by itself; `external` still owes the customer their
         half of the work, so the two-lines setup screen opens (㉘ run B). */
      const resume = plan ? pendingSetup : null

      set({
        ...(plan ? { account: 'paid' as const, billing: plan.term ?? 'yearly', credits: 1000 } : null),
        ...(bought ? { domain: 'registering' as const } : null),
        /* Walking out with only a plan must not leave the domain axis parked at
           `checkout` — nothing was bought for it. Back to truth: staging. */
        ...(!bought && world.domain === 'checkout' ? { domain: 'staging' as const } : null),
        cart: [],
      })
      setSubmitting(false)
      closePanel()

      /* One line, and it names what was actually charged — the panel gave no receipt
         (confirmed against the live product), so this is the only acknowledgement.
         The toast is single-slot, so a resuming own-connect rides in the same line
         rather than fighting the receipt for it. */
      if (resume?.kind === 'own') {
        showToast({
          en: `Remixer Build added · connecting ${resume.domain}`,
          uk: `Remixer Build додано · підключаємо ${resume.domain}`,
        }, 'progress')
      } else {
        const what = plan && bought ? `${bought} and Remixer Build added`
          : bought ? `${bought} added`
          : 'Remixer Build added'
        showToast({ en: what, uk: what })
      }

      if (resume) {
        setPendingSetup(null)
        if (resume.kind === 'own') runDomainTimeline(CONNECT_OWN_TIMELINE)
        else openDomains('external', resume.domain)
      }

      if (bought) {
        togglePublish(true)
        runDomainTimeline(BUY_TIMELINE)
      }
    }, 1500)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting])

  const removeLine = (i: number) =>
    set({ cart: lines.filter((_, n) => n !== i) })

  /** Applying a choice: years on a domain line, billing term on the plan line.
   *  Both feed straight back into the totals. */
  const changeLine = (i: number, value: string) =>
    set({
      cart: lines.map((line, n) =>
        n !== i ? line
          : line.kind === 'domreg' ? { ...line, years: Number(value) }
          : { ...line, term: value as 'monthly' | 'yearly' },
      ),
    })

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
                    <button className="dh-removeall" onClick={() => set({ cart: [] })}>
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
                onSubmit={() => setSubmitting(true)}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
