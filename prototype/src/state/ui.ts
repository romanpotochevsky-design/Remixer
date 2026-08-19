/**
 * Navigation state — what is open on screen right now.
 *
 * Deliberately separate from the world store. The world is product truth ("the user has
 * a plan, their domain is connecting"); this store is merely where the camera points
 * ("the domains surface is open, the publish popover is up"). Scenario switches and
 * flows rewrite the world; they must never have to know or care which panel happened
 * to be open. Keeping the two apart is what lets both grow for years without tangling.
 *
 * A "surface" is a module that renders in place of the site preview inside the same
 * shell — the pattern Lovable ships as its "More" section and the one Remixer already
 * uses in production. Every future module (Analytics, Library, Cloud…) becomes one
 * more entry in `Surface`, not a new layout.
 */
import { create } from 'zustand'
import type { Text } from '@/i18n'

export type Surface =
  | 'preview'
  /** The domain module: search, buy, connect, manage. */
  | 'domains'

/** Steps inside the domains surface. Kept here (not in world): it is navigation. */
export type DomainScreen =
  | 'home'      // universal field + AI suggestions (the default empty state)
  | 'results'   // search results: exact-match hero + alternatives
  /* Two screens used to live here and no longer do, for the same reason.
     'own'      — a domain already in the account is confirmed in the checkout sheet.
     'external' — the two lines to paste are a SHEET now, so the work floats over the
                  canvas you are working on instead of replacing it.
     'status'   — dissolved into the Publish panel's domain row (㉘ A3): a domain's
                  state belongs where the customer already looks for it, not on a page
                  they have to navigate to and then leave. */

/**
 * The checkout sheet that sits on top of everything (Figma 27275:33023 and siblings).
 *
 * It is an APP-modal, not a canvas-modal: the 70% scrim in the mockup covers the chat
 * column and the right rail too. Which body it renders is a product question answered
 * by the world (does the account hold a plan?), so only the intent lives here.
 *
 *  - `connect-existing` — a domain DreamHost already registers for this customer
 *  - `buy`              — a name from search or the AI suggestions
 *  - `connect-external` — a domain registered somewhere else
 */
export type DomainModalKind = 'connect-existing' | 'buy' | 'connect-external'

/**
 * Pages that are NOT Remixer.
 *
 * Buying anything today leaves the builder for the hosting panel, and the prototype
 * shows that rather than papering over it: `panel: 'cart'` is a full-window takeover
 * with the panel's own chrome, its own light theme and its own typography. It is
 * navigation, not product truth, so it belongs in this store — and it sits apart from
 * `Surface` because a surface renders INSIDE our shell, while this one replaces it.
 */
export type PanelPage = 'cart'

/**
 * A one-line confirmation of something that already happened.
 *
 * Deliberately not a status surface. It says "this is done" and leaves; anything
 * with an unfinished action in it belongs in the Publish panel's domain row, which
 * persists. Used where the flow has nothing left for the customer to do — the
 * clearest case being a domain we already host, which connects in seconds and so
 * must not be dignified with a panel (see docs/handoff/domain-flows-end-to-end.md §2).
 */
export interface Toast {
  /** Fresh id per toast so a repeat message still re-animates. */
  id: number
  text: Text
  tone: 'ok' | 'progress'
}

export interface DomainModal {
  kind: DomainModalKind
  domain: string
}

/** What to resume once the till hands the customer back. See `pendingSetup`. */
export interface PendingConnect {
  kind: 'own' | 'external' | 'external-ns'
  domain: string
}

/**
 * Canvas device emulation. Same two stops every builder in the category ships
 * (Lovable, Bolt, v0): the desktop view fills the canvas, the mobile view is a
 * phone-width frame floating on the ground. 390px is the iPhone 14/15 logical
 * width — the modal phone on the US market this product sells to.
 */
/** Chat column bounds. Below ~340 the bubbles stop reading; the upper stop and
 *  the live window check keep the canvas usable at any window size. */
export const CHAT_DEFAULT = 432
export const CHAT_MIN = 340
export const CHAT_MAX = 760

export type Device = 'desktop' | 'mobile'
/** iPhone 14/15 logical size. A fixed device, not a full-height column —
 *  measured off a Lovable screen recording: their phone frame keeps a wide
 *  margin above and below and floats in the middle of the canvas. */
export const MOBILE_WIDTH = 390
export const MOBILE_HEIGHT = 844

interface UIStore {
  surface: Surface
  domainScreen: DomainScreen
  /** The domain the user is acting on inside the domains surface. */
  activeDomain: string | null
  /** The checkout sheet over the whole app, or null when nothing is being confirmed. */
  domainModal: DomainModal | null
  publishOpen: boolean
  /** Which device the canvas is emulating. Navigation, not product truth. */
  device: Device
  /** Chat column width in px — the user can drag the divider. */
  chatWidth: number
  /** Preview reload pulse — drives the Siri edge glow for a few seconds. */
  reloading: boolean
  /** A page outside Remixer covering the whole window, or null when we are home. */
  panel: PanelPage | null
  /** The transient confirmation line, or null when nothing is being confirmed. */
  toast: Toast | null
  /**
   * A connect that was interrupted by the till, waiting to resume.
   *
   * ㉘ run **B** ("no plan") is the reason this exists: the customer asked to connect
   * a domain, hit the plan gate inside the sheet, and left for the hosting panel.
   * Coming back, the intent must still be theirs — landing on a generic dashboard
   * would make them re-find their own domain and re-state what they already said.
   * Set when the sheet hands off to checkout, consumed by the cart on the way back:
   *
   *  - `own`      — a domain in this account. Nothing left to ask, so it simply
   *                 connects (toast + amber→green), same as if the plan had existed.
   *  - `external` — registered elsewhere. The two-lines setup screen opens, because
   *                 the records are the customer's half of the work and no plan
   *                 purchase can do it for them.
   */
  pendingSetup: PendingConnect | null
  /**
   * The domain whose two-lines setup sheet is open, or null.
   *
   * A sheet, not a screen: the work is a short errand at somebody else's website, and it
   * should sit ON the thing you are building rather than replacing it. It is also why
   * this can be reopened at any time from the panel's "Finish setup" without losing place.
   */
  setupModal: string | null

  setDevice: (d: Device) => void
  setChatWidth: (px: number) => void
  openSurface: (s: Surface) => void
  openDomains: (screen?: DomainScreen, domain?: string | null) => void
  goDomains: (screen: DomainScreen, domain?: string | null) => void
  openDomainModal: (kind: DomainModalKind, domain: string) => void
  closeDomainModal: () => void
  closeSurface: () => void
  openPanel: (page: PanelPage) => void
  closePanel: () => void
  showToast: (text: Text, tone?: Toast['tone']) => void
  hideToast: () => void
  setPendingSetup: (p: PendingConnect | null) => void
  openSetupModal: (domain: string) => void
  closeSetupModal: () => void
  togglePublish: (open?: boolean) => void
  triggerReload: (ms?: number) => void
}

/** One timer at a time: mashing reload extends the pulse instead of stacking timers. */
let reloadTimer: ReturnType<typeof setTimeout> | null = null
/** Same rule for the toast: a second message replaces the first, it never queues. */
let toastTimer: ReturnType<typeof setTimeout> | null = null
let toastSeq = 0

export const useUI = create<UIStore>((set, get) => ({
  surface: 'preview',
  domainScreen: 'home',
  activeDomain: null,
  domainModal: null,
  publishOpen: false,
  device: 'desktop',
  chatWidth: CHAT_DEFAULT,
  reloading: false,
  panel: null,
  toast: null,
  pendingSetup: null,
  setupModal: null,

  setDevice: (device) => set({ device }),
  setChatWidth: (chatWidth) => set({ chatWidth }),
  openSurface: (surface) => set({ surface, publishOpen: false }),
  openDomains: (screen = 'home', domain = null) =>
    set({ surface: 'domains', domainScreen: screen, activeDomain: domain, publishOpen: false }),
  goDomains: (screen, domain) =>
    set({ domainScreen: screen, ...(domain !== undefined ? { activeDomain: domain } : {}) }),
  openDomainModal: (kind, domain) => set({ domainModal: { kind, domain } }),
  closeDomainModal: () => set({ domainModal: null }),
  closeSurface: () => set({ surface: 'preview' }),
  // Anything floating in our own chrome would show through the seam, so the
  // handoff closes the publish popover on the way out.
  openPanel: (panel) => set({ panel, publishOpen: false, domainModal: null, setupModal: null }),
  closePanel: () => set({ panel: null }),
  showToast: (text, tone = 'ok') => {
    if (toastTimer) clearTimeout(toastTimer)
    set({ toast: { id: ++toastSeq, text, tone } })
    toastTimer = setTimeout(() => set({ toast: null }), 4200)
  },
  hideToast: () => {
    if (toastTimer) clearTimeout(toastTimer)
    set({ toast: null })
  },
  setPendingSetup: (pendingSetup) => set({ pendingSetup }),
  openSetupModal: (domain) => set({ setupModal: domain, publishOpen: false, domainModal: null }),
  closeSetupModal: () => set({ setupModal: null }),
  togglePublish: (open) => set({ publishOpen: open ?? !get().publishOpen }),
  triggerReload: (ms = 3200) => {
    if (reloadTimer) clearTimeout(reloadTimer)
    set({ reloading: true })
    reloadTimer = setTimeout(() => set({ reloading: false }), ms)
  },
}))
