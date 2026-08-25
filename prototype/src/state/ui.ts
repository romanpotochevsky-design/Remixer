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
import type { TemplateCategoryId } from '@/data/templates'

/**
 * Which top-level page is on screen.
 *
 * The Home page (Figma 28364:40053) is NOT a surface inside the builder — it has its
 * own chrome: a transparent topbar over the hero, no chat column, no right rail. So it
 * cannot be an entry in `Surface`; it sits one level up, and `Root.tsx` picks between
 * the two. Every future top-level page (account, billing, the hosting panel) becomes
 * one more value here rather than another special case inside the builder shell.
 */
export type Page = 'home' | 'builder'

/** The Home page dock's two halves (Figma 28364:42996 — the segmented control). */
export type DockTab = 'projects' | 'templates'

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

export interface DomainModal {
  kind: DomainModalKind
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
  page: Page
  /** Which half of the Home dock is showing. Only meaningful with projects in hand. */
  dockTab: DockTab
  /** Which template category chip is active. `all` is the drawn default. */
  templateFilter: TemplateCategoryId
  /** The fullscreen template picker over the Home page (Figma 28616:59168).
   *  Reachable ONLY from the composer's "Add template" pill — the dock keeps
   *  its own behaviour. Like the domain modal, an app-level overlay: its scrim
   *  covers the hero, the topbar and the dock alike. */
  templatePickerOpen: boolean
  /**
   * The picker's detail view (Figma 28637:42088): which template's site
   * preview fills the sheet, as an index into `TEMPLATE_LIBRARY`, or null for
   * the card grid. Navigation, exactly like `domainScreen` — a step INSIDE an
   * open surface, not product truth. Clicking a card now opens this instead of
   * attaching (deliberate change: the board draws a detail step between the
   * card and the attach — attaching moved to the detail's "Choose a template"
   * button, see `attachTemplate`).
   */
  pickerDetail: number | null
  /**
   * The template attached to the Home composer's prompt — an index into
   * `TEMPLATE_LIBRARY` (the library repeats sites, so a position is the only
   * stable identity a picked card has). Composer state, not product truth: it
   * lives exactly as long as the draft it decorates — Build consumes it,
   * leaving the page drops it — and no scenario axis records it (a scenario
   * switch leaves it alone, the same way it leaves a half-typed draft alone).
   * ⚠️ The attached state is OUR proposal (home README §7, spec §7.4): no
   * board draws the composer after a pick. Pending the designer.
   */
  attachedTemplate: number | null
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

  goHome: () => void
  openBuilder: () => void
  setDockTab: (tab: DockTab) => void
  setTemplateFilter: (id: TemplateCategoryId) => void
  openTemplatePicker: () => void
  closeTemplatePicker: () => void
  /** A card was clicked — the detail view opens over the grid. */
  openTemplateDetail: (libIndex: number) => void
  /** ← or Esc inside the detail view — back to the grid, picker stays open. */
  closeTemplateDetail: () => void
  /** "Choose a template" in the detail header (was: picking a card). One
   *  gesture, one state write — choosing closes the whole picker. */
  attachTemplate: (libIndex: number) => void
  detachTemplate: () => void
  setDevice: (d: Device) => void
  setChatWidth: (px: number) => void
  openSurface: (s: Surface) => void
  openDomains: (screen?: DomainScreen, domain?: string | null) => void
  goDomains: (screen: DomainScreen, domain?: string | null) => void
  openDomainModal: (kind: DomainModalKind, domain: string) => void
  closeDomainModal: () => void
  closeSurface: () => void
  togglePublish: (open?: boolean) => void
  triggerReload: (ms?: number) => void
}

/** One timer at a time: mashing reload extends the pulse instead of stacking timers. */
let reloadTimer: ReturnType<typeof setTimeout> | null = null

export const useUI = create<UIStore>((set, get) => ({
  /* The prototype opens where the product does — on the Home page. */
  page: 'home',
  dockTab: 'projects',
  templateFilter: 'all',
  templatePickerOpen: false,
  pickerDetail: null,
  attachedTemplate: null,
  surface: 'preview',
  domainScreen: 'home',
  activeDomain: null,
  domainModal: null,
  publishOpen: false,
  device: 'desktop',
  chatWidth: CHAT_DEFAULT,
  reloading: false,

  /* Leaving a page closes what was open inside it: coming back to a half-open
     publish popover — or to a stale attached-template chip over an empty field —
     from another page reads as a bug, not as continuity. Build consumes the
     attachment via `openBuilder`, which is exactly when it should die. */
  goHome: () => set({ page: 'home', publishOpen: false, domainModal: null, templatePickerOpen: false }),
  openBuilder: () => set({ page: 'builder', templatePickerOpen: false, attachedTemplate: null }),
  setDockTab: (dockTab) => set({ dockTab }),
  setTemplateFilter: (templateFilter) => set({ templateFilter }),
  /* Every open starts on the grid, like the board draws it. The reset happens
     HERE and not when the picker closes: `pickerDetail` must survive the close
     so a picker dismissed (or chosen) from the detail view exits showing the
     detail view — clearing it at close time would fly the preview back into
     the grid underneath a sheet that is already leaving. */
  openTemplatePicker: () => set({ templatePickerOpen: true, pickerDetail: null }),
  closeTemplatePicker: () => set({ templatePickerOpen: false }),
  openTemplateDetail: (pickerDetail) => set({ pickerDetail }),
  closeTemplateDetail: () => set({ pickerDetail: null }),
  /* Leaves `pickerDetail` alone on purpose — see openTemplatePicker. */
  attachTemplate: (attachedTemplate) => set({ attachedTemplate, templatePickerOpen: false }),
  detachTemplate: () => set({ attachedTemplate: null }),
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
  togglePublish: (open) => set({ publishOpen: open ?? !get().publishOpen }),
  triggerReload: (ms = 3200) => {
    if (reloadTimer) clearTimeout(reloadTimer)
    set({ reloading: true })
    reloadTimer = setTimeout(() => set({ reloading: false }), ms)
  },
}))
