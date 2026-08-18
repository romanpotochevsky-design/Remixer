/**
 * The checkout sheet — Figma 27058:100133 · 27254:11737 · 27275:33023.
 *
 * Three boards, six drawn states, ONE component. What the boards actually vary is
 * two independent axes, so that is how this is built:
 *
 *   axis 1 — WHAT is being done
 *     connect-existing : a domain DreamHost already registers for this customer.
 *                        No price anywhere: owned domains cost nothing to attach.
 *     buy              : a name from search or the AI suggestions. Carries the
 *                        first-year figure and the honest renewal line.
 *
 *   axis 2 — DOES THE ACCOUNT HAVE A PLAN (read from the world, never passed in)
 *     yes : the lean sheet, 560×232 — one row, one button.
 *     no  : the sheet grows to 600×516, folds the Remixer Build plan chooser in
 *           underneath, and the CTA hands off to checkout instead of connecting.
 *
 * The paywall is disclosed INSIDE this surface rather than bouncing the user to a
 * pricing page, and the domain identity stays pinned at the top so the thread is
 * never lost. That is the audit's "own the 60 seconds around go-live" rendered
 * concretely — note there is no DNS, nameserver or A-record vocabulary anywhere.
 *
 * It is an APP-modal, not a canvas one: the mockup's 70% scrim covers the chat
 * column and the right rail too, so this mounts at the top of the tree.
 *
 * Two knowing departures from the pixels, both flagged to the designer:
 *  - the mockup's renewal figure ($11.86) appears nowhere in DreamHost's verified
 *    price table; the real .com renewal is $19.99 and that is what ships here;
 *  - the mockup's domain row reads `coffee-roasters.com` as static text — here it
 *    is whatever domain the user actually clicked.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useWorld, hasPlan } from '@/state/world'
import { useUI } from '@/state/ui'
import { useT, type Text } from '@/i18n'
import { priceFor } from '@/data/domains'
import type { CartLine } from '@/data/cart'
import { LogoRemixer, IconClose, IconGlobeLarge, IconLink } from '@/ui/icons'
import { modalScrim, modalSheet } from '@/ui/motion'

/** The two ways to pay for the plan, priced off the verified product facts. */
type Term = 'yearly' | 'monthly'

/* ------------------------------------------------------------------ pieces */

/**
 * The 32px close disc (Figma 27328:11613). Black 48% + an 8%-white rim + blur —
 * the same glass recipe as the shell's controls, at the smaller radius.
 */
function CloseButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-[10px] border border-[#ffffff14] bg-[#09090b7a] text-white backdrop-blur-[16px] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#09090bcc]"
    >
      <IconClose size={9} />
    </button>
  )
}

/**
 * The 48px globe tile the domain row hangs off. Black 64% under a 24%-white rim —
 * markedly brighter than the shell's 12% hairline, which is what makes it read as
 * a raised tile rather than an inset well.
 */
function GlobeTile() {
  return (
    <span className="grid h-12 w-12 flex-none place-items-center rounded-[16px] border border-[#ffffff3d] bg-[#09090ba3] text-white backdrop-blur-[16px]">
      <IconGlobeLarge size={24} />
    </span>
  )
}

/** 20px radio. Selected = white ring + a 12px white core, 4px of dark between them. */
function Radio({ on }: { on: boolean }) {
  return on ? (
    <span className="grid h-5 w-5 flex-none place-items-center rounded-full border-[1.5px] border-white" aria-hidden>
      <span className="h-3 w-3 rounded-full bg-white" />
    </span>
  ) : (
    <span className="h-5 w-5 flex-none rounded-full border border-[#ffffff8f]" aria-hidden />
  )
}

/** One plan card. Selection is the whole affordance: 2px bright ring + an 8% fill. */
function PlanCard({
  term, selected, onSelect, title, caption, price, per, footnote, badge,
}: {
  term: Term
  selected: boolean
  onSelect: () => void
  title: Text
  caption: Text
  price: string
  per: Text
  footnote: Text
  badge?: Text
}) {
  const { t } = useT()
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      /* Heights differ by 8px in the mockup (72 selected / 80 not) and so they do
         here — flagged to the designer rather than silently harmonised. */
      className={`relative flex w-full items-center justify-between rounded-[16px] px-5 py-2.5 text-left transition-colors duration-[var(--dur-base)] ease-std ${
        selected
          ? 'h-[72px] border-2 border-[#ffffffb8] bg-[#ffffff14]'
          : 'h-20 border border-[#ffffff3d] hover:bg-[#ffffff08]'
      }`}
      data-term={term}
    >
      <span className="flex min-w-0 items-center gap-4">
        <Radio on={selected} />
        <span className="min-w-0">
          <span className="block text-[16px] font-semibold leading-none text-[#f8f8fa]">{t(title)}</span>
          <span className="mt-[7px] block text-[13px] leading-none text-[#ffffff7a]">{t(caption)}</span>
        </span>
      </span>

      <span className="relative flex flex-none flex-col items-end gap-1.5">
        <span className="flex items-baseline gap-0.5">
          <span className="font-display text-[18px] font-medium leading-none text-[#f8f8fa]">{price}</span>
          <span className="text-[15px] leading-none text-[#ffffff7a]">{t(per)}</span>
        </span>
        <span className="whitespace-nowrap text-right text-[12px] leading-none text-[#ffffff7a]">{t(footnote)}</span>
        {badge && (
          /* Gray-800 under a 25% green wash — flattened, it is #2d4338. It hangs
             OFF the left edge of the price column (right:100% + 7px), not at a
             fixed -70px: the mockup's offset only works for its exact string
             width, and ours changes with the language. */
          <span
            className="absolute right-full mr-[7px] grid h-5 place-items-center whitespace-nowrap rounded-[6px] px-1.5 text-[12px] font-medium text-[#66cc87]"
            style={{ top: 25, background: '#2d4338' }}
          >
            {t(badge)}
          </span>
        )}
      </span>
    </button>
  )
}

/* ------------------------------------------------------------------- sheet */

export function DomainModal() {
  const { world, set } = useWorld()
  const { domainModal, closeDomainModal, goDomains, openPanel } = useUI()
  const { t } = useT()
  const [term, setTerm] = useState<Term>('yearly')

  const open = domainModal !== null
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDomainModal() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closeDomainModal])

  const paid = hasPlan(world)
  const buying = domainModal?.kind === 'buy'
  const domain = domainModal?.domain ?? ''
  const tld = domain.includes('.') ? domain.slice(domain.lastIndexOf('.')) : '.com'
  const price = priceFor(tld) ?? priceFor('.com')!

  /* The plan chooser is what makes the sheet tall, and it is present exactly when
     the account cannot go live yet. Everything else keys off these two booleans. */
  const showPlans = !paid

  /*
   * The guards that used to live on a separate "You own this" screen.
   *
   * Both ways of reaching a domain the customer already owns now open this sheet:
   * the dashboard's Connect button always did, and typing the name into the search
   * field used to land on a standalone screen drawn in the pre-redesign geometry.
   * One intent must not render as two different products, so that screen is gone
   * and its two protections moved here — they are the whole reason a confirm step
   * exists at all, because connecting can take down something that is serving now.
   *
   *  in-use      : the domain already shows a website, so the button's verb becomes
   *                "Replace site". The word IS the guard.
   *  external-ns : we register it, but its nameservers point at Cloudflare, so the
   *                records we write server-side will not take effect. Saying
   *                "connects in a few seconds" here would be a plain lie, so that
   *                promise is replaced rather than merely annotated.
   */
  const guard: 'in-use' | 'external-ns' | null =
    domainModal?.kind !== 'connect-existing' ? null
      : world.inventory === 'dh-in-use' ? 'in-use'
      : world.inventory === 'dh-external-ns' ? 'external-ns'
      : null

  /*
   * What actually happens when this button is pressed.
   *
   * Anything with a price on it leaves Remixer: the panel's cart owns checkout
   * (panel.dreamhost.com/?tree=checkout.dashboard), so we fill that cart and hand the
   * user over — see modules/panel/PanelCart.tsx. This used to flip the account to
   * paid on the spot, which made the demo shorter than the product and hid the one
   * seam most worth arguing about.
   *
   * Connecting a domain the customer already owns on a plan they already have is the
   * one case with nothing to buy; that still completes in place, as before.
   */
  const confirm = () => {
    const lines: CartLine[] = []
    if (buying) lines.push({ kind: 'domreg', domain, years: 1 })
    if (showPlans) lines.push({ kind: 'remixer', term })

    if (lines.length === 0) {
      set({ domain: 'connecting' })
      closeDomainModal()
      goDomains('status', domain)
      return
    }

    /* `checkout` is the world's word for "standing at the till" — the state the domain
       axis has carried since the beginning and nothing rendered until now.

       The domains screen underneath is left exactly as it was: walking out of the
       cart without paying has to land the customer back on the list they were
       browsing, not on a status page for a domain they did not buy. The status
       screen comes later, from the panel, once the order is actually placed. */
    set({ cart: lines, domain: 'checkout' })
    closeDomainModal()
    openPanel('cart')
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center" role="dialog" aria-modal="true" aria-label={t({ en: 'Connect domain', uk: 'Підключення домену' })}>
          {/* 70% black, no blur — it covers the chat and the rail, not just the canvas */}
          <motion.div
            variants={modalScrim}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={closeDomainModal}
            className="absolute inset-0 bg-[rgba(0,0,0,0.7)]"
          />

          <motion.div
            variants={modalSheet}
            initial="initial"
            animate="animate"
            exit="exit"
            /* Centred, nudged 4px up — the mockup pins it there on both boards. */
            /* 600 with the plan chooser, 560 without — as drawn on 27254/27275.
               The buy sheet was widened to 600 for a while because its row runs
               a price AND a renewal note beside the sub-label and the line
               clipped; that was the system fallback face being ~10% wider than
               Proxima Nova, and it went away once real webfonts shipped. */
            className={`relative -translate-y-1 rounded-[24px] border border-[#ffffff0a] bg-[var(--gray-850)] ${
              showPlans ? 'w-[600px]' : 'w-[560px]'
            }`}
            style={{ boxShadow: '0px 24px 28px rgba(0,0,0,0.33)' }}
          >
            {/* ------------------------------------------------- header, 64px */}
            <div className="flex h-16 items-center justify-between pl-6 pr-4">
              <h3 className="whitespace-nowrap pt-0.5 font-display text-[18px] font-semibold leading-[1.2] text-white">
                {t({ en: 'Connect domain', uk: 'Підключити домен' })}
              </h3>
              <CloseButton onClick={closeDomainModal} label={t({ en: 'Close', uk: 'Закрити' })} />
            </div>

            {/* --------------------------------------------------- body card */}
            <div className="px-1.5">
              <div className="rounded-[16px] border border-[#ffffff0a] bg-[#ffffff0a]">
                {/* -------------------------------------------- domain row */}
                <div
                  className={`flex py-6 pl-4 pr-6 ${
                    showPlans ? 'items-start gap-3' : 'items-center gap-4'
                  } ${showPlans || guard ? 'border-b border-[#ffffff0a]' : ''}`}
                >
                  {/* top-aligned rows drop the tile 8px so it lines up with the 24px name */}
                  <span className={showPlans ? 'pt-2' : undefined}>
                    <GlobeTile />
                  </span>

                  <div className="min-w-0 flex-1 pb-0.5">
                    {/* name — and, in the lean sheet, the price on the same baseline */}
                    <div className="flex h-[34px] items-baseline justify-between gap-4">
                      <p className="min-w-0 truncate font-display text-[24px] font-medium leading-[1.2] text-white">
                        {domain}
                      </p>
                      {buying && !showPlans && (
                        <p className="flex-none font-display text-[18px] font-medium leading-none text-[#f5f5fa]">
                          ${price.register.toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* sub-label — the one line that carries the whole state */}
                    <div className="flex h-5 items-baseline justify-between gap-4 pr-0.5">
                      {buying ? (
                        <p className="truncate text-[14px] leading-[1.4] text-[#ffffff8f]">
                          {t({ en: 'Connects automatically after checkout', uk: 'Підключиться автоматично після оплати' })}
                        </p>
                      ) : guard === 'external-ns' ? (
                        /* Ranked above the plan line on purpose: a plan does not
                           make this one connect either, so promising that it will
                           would be the more misleading of the two. */
                        <p className="flex items-center gap-0.5 truncate text-[14px] leading-[1.4]">
                          <span className="text-[#ffffffa3]">{t({ en: 'Managed at Cloudflare', uk: 'Керується на Cloudflare' })}</span>
                          <span className="mx-0.5 flex-none text-[rgba(255,240,186,0.9)]"><IconLink size={20} /></span>
                          <span className="text-[rgba(255,240,186,0.9)]">
                            {t({ en: 'about 5 minutes', uk: 'приблизно 5 хвилин' })}
                          </span>
                        </p>
                      ) : showPlans ? (
                        /* cream = "waiting on you". Neutral grey would read as
                           "nothing blocking", which would be a lie here. */
                        <p className="flex items-center gap-0.5 truncate text-[14px] leading-[1.4]">
                          <span className="text-[#ffffffa3]">{t({ en: 'On DreamHost', uk: 'На DreamHost' })}</span>
                          <span className="mx-0.5 flex-none text-[rgba(255,240,186,0.9)]"><IconLink size={20} /></span>
                          <span className="text-[rgba(255,240,186,0.9)]">
                            {t({ en: 'connects as soon as you add a plan', uk: 'підключиться, щойно ви оформите план' })}
                          </span>
                        </p>
                      ) : (
                        <p className="truncate text-[14px] leading-[1.4] text-[#ffffff8f]">
                          {t({ en: 'On DreamHost · connects in a few seconds', uk: 'На DreamHost · підключиться за кілька секунд' })}
                        </p>
                      )}

                      {buying && !showPlans && (
                        <p className="flex-none whitespace-nowrap text-[13px] leading-none text-[#ffffff7a]">
                          {t({ en: 'auto-renews at ', uk: 'автопродовження ' })}
                          <span className="font-display font-medium">${price.renew.toFixed(2)}</span>
                          {t({ en: '/yr', uk: '/рік' })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* the tall sheet parks the price in its own right-hand column */}
                  {buying && showPlans && (
                    <div className="flex w-[137px] flex-none flex-col items-end justify-center gap-1.5 self-stretch pt-0.5">
                      <p className="font-display text-[18px] font-medium leading-none text-[#f5f5fa]">
                        ${price.register.toFixed(2)}
                      </p>
                      <p className="whitespace-nowrap text-[13px] leading-none text-[#ffffff7a]">
                        {t({ en: 'auto-renews at ', uk: 'автопродовження ' })}
                        <span className="font-display font-medium">${price.renew.toFixed(2)}</span>
                        {t({ en: '/yr', uk: '/рік' })}
                      </p>
                    </div>
                  )}
                </div>

                {/* --------------------------------------------- the guard */}
                {guard && (
                  <div className={`px-4 py-4 ${showPlans ? 'border-b border-[#ffffff0a]' : ''}`}>
                    <p className="text-[14px] font-semibold leading-[1.4] text-[rgba(255,240,186,0.9)]">
                      {guard === 'in-use'
                        ? t({ en: 'This domain already shows a website', uk: 'На цьому домені вже є сайт' })
                        : t({ en: 'This domain is managed at Cloudflare', uk: 'Цим доменом керує Cloudflare' })}
                    </p>
                    {/* The reassurance is not decoration: without "you can switch
                        back" the warning only frightens, and a frightened customer
                        abandons the connect instead of completing it. */}
                    <p className="mt-1 text-[13px] leading-[1.45] text-[#ffffff8f]">
                      {guard === 'in-use'
                        ? t({
                            en: `Connecting replaces what visitors see at ${domain}. Your files stay safe and you can switch back.`,
                            uk: `Підключення замінить те, що бачать відвідувачі на ${domain}. Файли збережуться, і можна повернути як було.`,
                          })
                        : t({
                            en: 'Its settings live there, so we’ll show you the two lines to paste at Cloudflare. About 5 minutes.',
                            uk: 'Його налаштування живуть там, тож ми покажемо два рядки, які треба вставити на Cloudflare. Приблизно 5 хвилин.',
                          })}
                    </p>
                  </div>
                )}

                {/* ------------------------------------------- plan chooser */}
                {showPlans && (
                  <div className="rounded-[12px]">
                    <div className="flex h-24 items-center gap-4 py-6 pl-4 pr-9">
                      <span className="grid h-12 w-12 flex-none place-items-center">
                        <span className="grid h-8 w-8 place-items-center rounded-[12px] p-0.5">
                          <LogoRemixer size={32} />
                        </span>
                      </span>
                      <p className="font-display text-[18px] font-semibold text-white">
                        {t({ en: 'Remixer Build', uk: 'Remixer Build' })}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 px-4 pb-4">
                      <PlanCard
                        term="yearly"
                        selected={term === 'yearly'}
                        onSelect={() => setTerm('yearly')}
                        title={{ en: 'Yearly', uk: 'Річний' }}
                        caption={{ en: 'Best value', uk: 'Найвигідніше' }}
                        price="$9.99"
                        per={{ en: '/mo', uk: '/міс' }}
                        footnote={{ en: 'billed yearly · $119.88', uk: 'оплата за рік · $119.88' }}
                        badge={{ en: 'Save 33%', uk: 'Economія 33%' }}
                      />
                      <PlanCard
                        term="monthly"
                        selected={term === 'monthly'}
                        onSelect={() => setTerm('monthly')}
                        title={{ en: 'Monthly', uk: 'Щомісячний' }}
                        caption={{ en: 'Cancel any month', uk: 'Скасувати будь-якого місяця' }}
                        price="$14.99"
                        per={{ en: '/mo', uk: '/міс' }}
                        footnote={{ en: '$9.99 for your first month', uk: '$9.99 за перший місяць' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ----------------------------------------------- button bar, 72 */}
            <div className="flex items-center justify-end py-4 pl-4 pr-[18px]">
              <button
                onClick={confirm}
                className="h-10 rounded-[10px] bg-[var(--action)] px-5 text-[14px] font-semibold leading-none text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
              >
                {showPlans || buying
                  ? t({ en: 'Continue to checkout', uk: 'Перейти до оплати' })
                  : guard === 'in-use'
                    ? t({ en: 'Replace site', uk: 'Замінити сайт' })
                    : t({ en: 'Connect domain', uk: 'Підключити домен' })}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
