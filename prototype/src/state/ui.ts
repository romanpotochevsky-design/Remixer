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

export type Surface =
  | 'preview'
  /** The domain module: search, buy, connect, manage. */
  | 'domains'

/** Steps inside the domains surface. Kept here (not in world): it is navigation. */
export type DomainScreen =
  | 'home'      // universal field + AI suggestions (the default empty state)
  | 'results'   // search results: exact-match hero + alternatives
  | 'own'       // "You own this" confirm for a domain already in the account
  | 'external'  // external domain: registrar detected, guided manual records
  | 'status'    // connecting / verifying / live status page

/**
 * Canvas device emulation. Same two stops every builder in the category ships
 * (Lovable, Bolt, v0): the desktop view fills the canvas, the mobile view is a
 * phone-width frame floating on the ground. 390px is the iPhone 14/15 logical
 * width — the modal phone on the US market this product sells to.
 */
export type Device = 'desktop' | 'mobile'
export const MOBILE_WIDTH = 390

interface UIStore {
  surface: Surface
  domainScreen: DomainScreen
  /** The domain the user is acting on inside the domains surface. */
  activeDomain: string | null
  publishOpen: boolean
  /** Which device the canvas is emulating. Navigation, not product truth. */
  device: Device
  /** Preview reload pulse — drives the Siri edge glow for a few seconds. */
  reloading: boolean

  setDevice: (d: Device) => void
  openSurface: (s: Surface) => void
  openDomains: (screen?: DomainScreen, domain?: string | null) => void
  goDomains: (screen: DomainScreen, domain?: string | null) => void
  closeSurface: () => void
  togglePublish: (open?: boolean) => void
  triggerReload: (ms?: number) => void
}

/** One timer at a time: mashing reload extends the pulse instead of stacking timers. */
let reloadTimer: ReturnType<typeof setTimeout> | null = null

export const useUI = create<UIStore>((set, get) => ({
  surface: 'preview',
  domainScreen: 'home',
  activeDomain: null,
  publishOpen: false,
  device: 'desktop',
  reloading: false,

  setDevice: (device) => set({ device }),
  openSurface: (surface) => set({ surface, publishOpen: false }),
  openDomains: (screen = 'home', domain = null) =>
    set({ surface: 'domains', domainScreen: screen, activeDomain: domain, publishOpen: false }),
  goDomains: (screen, domain) =>
    set({ domainScreen: screen, ...(domain !== undefined ? { activeDomain: domain } : {}) }),
  closeSurface: () => set({ surface: 'preview' }),
  togglePublish: (open) => set({ publishOpen: open ?? !get().publishOpen }),
  triggerReload: (ms = 3200) => {
    if (reloadTimer) clearTimeout(reloadTimer)
    set({ reloading: true })
    reloadTimer = setTimeout(() => set({ reloading: false }), ms)
  },
}))
