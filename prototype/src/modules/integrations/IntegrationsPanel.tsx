/**
 * INTEGRATIONS — what the site can be wired to, from the rail's puzzle button (designer 03.10.2026,
 * with a recording of the live editor; frames in scratchpad/gallery-open/). The live panel lists two
 * services, each a row with its mark, a name, one sentence of what it brings, and an outlined
 * chevron key at the right:
 *   Stripe — «Payments, subscriptions, checkout, plus sign-ups, logins, and backend features.»
 *   Shippo — «Shipping rates, labels, tracking, plus sign-ups, logins, and backend features.»
 * The copy is the live product's, word for word. No board yet — the geometry is read off the
 * recording (2× retina): rows ~103 tall, 4 apart inside one r16 card inset 16, mark 40 r10 at
 * 12/16, text from 68, the chevron key 32 × 72 r12 under a 24 % rim, 12 from the right.
 *
 * Where it sits and how it moves is the rail drawer's (ui/drawer.ts, ui/RailDrawer.tsx): a room
 * beside the preview when there is room, glass over it with a shadow when there is not.
 *
 * WHAT THE CHEVRON DOES — ours (the recording does not press it). Wiring a payment provider is
 * work the AI does on the site, so the key hands the ask to the chat: the line lands in the
 * composer, focused, NOT sent — the person reads it, edits it, and decides; nothing is spent
 * until they do. Asked.
 *
 * The marks are drawn by hand (no board, no asset URL through the proxy): Stripe's indigo tile
 * with its slanted flag, Shippo's green tile with a ring — stand-ins, not the brands' artwork.
 */
import { useEffect, useRef } from 'react'
import { useUI } from '@/state/ui'
import { useWorld } from '@/state/world'
import { useT } from '@/i18n'
import { RailDrawer } from '@/ui/RailDrawer'
import { DRAWER_W, fitsDocked, useDrawerRoom } from '@/ui/drawer'
import { GlyphCloseS } from '@/modules/media/icons'

const ROWS = [
  {
    id: 'stripe',
    name: 'Stripe',
    body: { en: 'Payments, subscriptions, checkout, plus sign-ups, logins, and backend features.', uk: 'Платежі, підписки, оформлення замовлення, а також реєстрація, вхід і бекенд.' },
    ask: { en: 'Connect Stripe so people can pay on my site', uk: 'Підключи Stripe, щоб на сайті можна було платити' },
  },
  {
    id: 'shippo',
    name: 'Shippo',
    body: { en: 'Shipping rates, labels, tracking, plus sign-ups, logins, and backend features.', uk: 'Тарифи доставки, етикетки, відстеження, а також реєстрація, вхід і бекенд.' },
    ask: { en: 'Connect Shippo for shipping rates and tracking', uk: 'Підключи Shippo для тарифів доставки й відстеження' },
  },
] as const

function Mark({ id }: { id: string }) {
  if (id === 'stripe')
    return (
      <span className="grid h-10 w-10 flex-none place-items-center rounded-[10px] bg-[#533afd]" aria-hidden>
        <svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 7.6 19 4.4v9.8L3 17.4z" fill="#fff" /></svg>
      </span>
    )
  return (
    <span className="grid h-10 w-10 flex-none place-items-center rounded-[10px] bg-[#4fbd7e]" aria-hidden>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <circle cx="13" cy="13" r="10.6" stroke="#0d2b1c" strokeWidth="2.2" />
        <path d="M7.4 14.6c0-3.3 2.6-5.6 5.8-5.6 2.5 0 4.6 1.3 5.4 3.4.3.8-.2 1.6-1 1.7l-1.6.2c-.5 1.9-2.2 3.2-4.3 3.2-2.4 0-4.3-1.3-4.3-2.9z" fill="#0d2b1c" />
        <circle cx="15.6" cy="11.4" r=".9" fill="#4fbd7e" />
      </svg>
    </span>
  )
}

export function IntegrationsPanel() {
  const open = useUI((s) => s.integrationsOpen)
  const toggle = useUI((s) => s.toggleIntegrations)
  const seed = useUI((s) => s.seedComposer)
  const mediaOpen = useUI((s) => s.mediaOpen)
  const page = useUI((s) => s.page)
  const built = useWorld((s) => s.world.project === 'built')
  const col = useDrawerRoom((s) => s.col)
  const { t } = useT()
  const ref = useRef<HTMLDivElement>(null)

  const shown = open && page === 'builder' && built
  const docked = fitsDocked(col, DRAWER_W)

  useEffect(() => { if (shown) useDrawerRoom.setState({ want: DRAWER_W }) }, [shown])

  /* Esc closes; an outside press closes only the FLOATING form — a docked drawer is a room, not a popover */
  useEffect(() => {
    if (!shown) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('[role="alertdialog"]')) toggle(false) }
    const onDown = (e: MouseEvent) => {
      if (docked) return
      const el = e.target as Element
      if (ref.current?.contains(el) || el.closest?.('[data-rail-integrations]') || el.closest?.('[data-console]')) return
      toggle(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown) }
  }, [shown, docked, toggle])

  return (
    <RailDrawer
      id="integrations"
      open={shown}
      docked={docked}
      handoff={mediaOpen === 'manage'}
      label={t({ en: 'Integrations', uk: 'Інтеграції' })}
      railSelector="[data-rail-integrations]"
      panelRef={ref}
      attrs={{ 'data-integrations-panel': '' }}
    >
      {/* header 71 — the media panel's: title 24 SemiBold, ✕ 32 r8 */}
      <div className="flex h-[71px] flex-none items-start justify-between pl-6 pr-3">
        <h2 className="pt-[26px] font-display text-[24px] font-semibold leading-[1.2] text-white">{t({ en: 'Integrations', uk: 'Інтеграції' })}</h2>
        <div className="pt-3">
          <button
            type="button"
            onClick={() => toggle(false)}
            aria-label={t({ en: 'Close', uk: 'Закрити' })}
            className="press-bloom grid h-8 w-8 place-items-center rounded-[8px] bg-[var(--white-100)] text-white transition-colors duration-150 hover:bg-[var(--white-200)]"
            data-integrations-close
          >
            <GlyphCloseS size={24} />
          </button>
        </div>
      </div>
      <div className="mx-4 mt-2 flex flex-col gap-1 overflow-hidden rounded-[16px]" data-integrations-list>
        {ROWS.map((r, i) => (
          <div
            key={r.id}
            className="drawer-row flex items-center gap-4 bg-[rgba(255,255,255,0.035)] py-4 pl-3 pr-3"
            style={{ '--i': i } as React.CSSProperties}
            data-integration={r.id}
          >
            <span className="self-start"><Mark id={r.id} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-medium leading-[24px] text-white">{r.name}</div>
              <p className="mt-1 text-[14px] leading-[20px] text-[rgba(255,255,255,0.56)]">{t(r.body)}</p>
            </div>
            <button
              type="button"
              onClick={() => seed(t(r.ask))}
              aria-label={t({ en: `Ask Remixer to add ${r.name}`, uk: `Попросити Remixer додати ${r.name}` })}
              className="press-bloom grid h-[72px] w-8 flex-none place-items-center rounded-[12px] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)] transition-colors duration-150 hover:bg-[var(--white-100)]"
              data-integration-go={r.id}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden><path d="m8 5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        ))}
      </div>
    </RailDrawer>
  )
}
