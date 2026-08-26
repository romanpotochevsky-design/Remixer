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
import type { ThumbId } from '@/modules/home/thumbs'

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

/**
 * A rect in viewport coordinates — the currency of the template's flights.
 *
 * The template is ONE physical object across three homes (a card in the grid, the
 * full-screen stage, the composer's attachment tile), and every hand-off between
 * them is a FLIP: measure where the object is, mount it where it belongs, fly the
 * difference. The two flights that cross a surface boundary (stage ⇄ tile) cannot
 * be measured inside either surface, because the picker is unmounting or mounting
 * in the very commit the flight starts — so the source rect travels through the
 * store as plain viewport numbers and the flight layer (modules/home/
 * TemplateFlight.tsx) does the arithmetic.
 */
export interface FlightRect {
  left: number
  top: number
  width: number
  height: number
}

/**
 * A template in the air between one of its homes and another.
 *
 * `to` names the DESTINATION, which is also who owns the landing: `'tile'` after
 * a pick (or after closing the attachment's preview), `'stage'` when a tile or a
 * dock card is opened to blow it back up, `'card'` when a dock card's preview is
 * closed and the object flies home into the shelf. Null the rest of the time;
 * cleared by the flight layer the moment the spring lands, which is the same
 * commit that reveals the real destination — the two are pixel-identical there,
 * so the swap is invisible.
 *
 * ⚠️ THE PAYLOAD CARRIES A DRAWING, NOT A LIBRARY INDEX (26.08.2026, when the
 * dock's cards got their own preview). A FLIP needs exactly three things: what
 * is in the air and the two rects. It used to carry `index` into
 * `TEMPLATE_LIBRARY`, which was fine while every flight started in the picker —
 * but the dock's shelf is `TEMPLATES`, a DIFFERENT list, and the two disagree on
 * one drawing (dock col 3 is `campaign`, the library's is `agency`, deliberately
 * — see data/templates.ts). An index would therefore have flown the wrong
 * picture out of the third dock card, so the flight names the drawing itself.
 */
export interface TemplateFlight {
  /** Which miniature site is in the air (`thumbs.tsx`) — all the clone needs. */
  id: ThumbId
  from: FlightRect
  to: 'tile' | 'stage' | 'card'
  /**
   * The dock card this flight belongs to, as an index into `TEMPLATES` — set on
   * BOTH legs of the dock's preview, so it also marks the card path for the
   * flight layer (a `'stage'` flight with `card` set comes out of a card, one
   * without comes out of the composer's tile; the two are laid out differently
   * — see `contentWidth` in TemplateFlight.tsx).
   */
  card?: number
}

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
   * WHO opened the picker, because it changes what the sheet is.
   *
   *  - `'pill'` — the composer's "Add template": the library. The sheet grows
   *    out of the pill, the grid is the content, a card opens the detail view.
   *  - `'tile'` — the composer's attachment tile: a PREVIEW of what is already
   *    attached. No grid at all (the library is not part of this path), the
   *    sheet materialises with a plain fade, and the object flies from the tile
   *    into the stage and back into the tile on the way out.
   *  - `'card'` — a template card in the HOME DOCK (designer, 26.08.2026: a dock
   *    card opens the full-screen preview instead of starting a generation).
   *    Structurally the tile's path: no grid, a fade, and a page-level flight,
   *    because the object starts OUTSIDE the sheet. What differs is only the
   *    bar's CTA — `Remix this template`, which seeds the builder — and where
   *    the object flies home to (`pickerCard`).
   */
  pickerSource: 'pill' | 'tile' | 'card'
  /**
   * Which DOCK card's preview is open, as an index into `TEMPLATES` — the dock's
   * own list, not the picker's library (they are different lists; see
   * `TemplateFlight`). Exactly one of `pickerDetail` / `pickerCard` is ever set:
   * the library path indexes the library, the dock path indexes the shelf.
   */
  pickerCard: number | null
  /**
   * The template attached to the Home composer's prompt — an index into
   * `TEMPLATE_LIBRARY` (the library repeats sites, so a position is the only
   * stable identity a picked card has). Composer state, not product truth: it
   * lives exactly as long as the draft it decorates — Build consumes it,
   * leaving the page drops it — and no scenario axis records it (a scenario
   * switch leaves it alone, the same way it leaves a half-typed draft alone).
   *
   * DRAWN, since 26.08.2026 — board `28726:64760`: a 56px preview tile in the
   * field's new top row, the "Add template" pill staying exactly where it was.
   * (Our earlier chip-in-the-pill's-place proposal is gone; the record of it
   * lives in figma-spec-add-template.md §7.4.)
   */
  attachedTemplate: number | null
  /** The template mid-flight between the stage and the tile — see TemplateFlight. */
  tplFlight: TemplateFlight | null
  /** Bumped by `settleAttachedTile` — see it. */
  tileSettle: number
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
  /**
   * A dock template card was clicked: the same full-screen sheet opens showing
   * that card alone, and the object flies out of the card's thumbnail into the
   * stage. `id` rides along because the dock's list is not the library's.
   */
  openCardPreview: (card: number, id: ThumbId, from: FlightRect) => void
  /** ←, Esc, ✕ or the scrim in that preview: the object flies home to the card. */
  closeCardPreview: (card: number, id: ThumbId, from: FlightRect) => void
  /**
   * The attachment tile acknowledges something that did NOT change it: picking
   * the template that is already attached. A monotonic nudge rather than a
   * boolean — every press has to play, including two in a row, and a one-shot
   * that unmounts itself has nothing to reset. Read by `AttachedTile`.
   */
  settleAttachedTile: () => void
  /** A card was clicked — the detail view opens over the grid. */
  openTemplateDetail: (libIndex: number) => void
  /** ← or Esc inside the detail view — back to the grid, picker stays open. */
  closeTemplateDetail: () => void
  /**
   * "Choose a template" in the detail header. Attaches, and puts the stage in
   * the air toward the tile; it does NOT close the picker — the overlay
   * dissolves itself on its own beat and closes when that lands, so the flying
   * object is never racing a surface that has already left.
   */
  attachTemplate: (libIndex: number, id: ThumbId, from: FlightRect | null) => void
  detachTemplate: () => void
  /** The attachment tile was clicked: the picker opens on that template alone
   *  and the object flies out of the tile into the stage. */
  openAttachedPreview: (libIndex: number, id: ThumbId, from: FlightRect) => void
  /** ←, Esc, ✕ or the scrim inside that preview: the object flies home. */
  closeAttachedPreview: (libIndex: number, id: ThumbId, from: FlightRect) => void
  /** The flight landed — the destination is real from this commit on. */
  endTemplateFlight: () => void
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
  pickerSource: 'pill',
  pickerCard: null,
  tileSettle: 0,
  attachedTemplate: null,
  tplFlight: null,
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
  goHome: () => set({ page: 'home', publishOpen: false, domainModal: null, templatePickerOpen: false, pickerCard: null, tplFlight: null }),
  openBuilder: () => set({ page: 'builder', templatePickerOpen: false, pickerCard: null, attachedTemplate: null, tplFlight: null }),
  setDockTab: (dockTab) => set({ dockTab }),
  setTemplateFilter: (templateFilter) => set({ templateFilter }),
  /* Every open starts on the grid, like the board draws it. The reset happens
     HERE and not when the picker closes: `pickerDetail` must survive the close
     so a picker dismissed (or chosen) from the detail view exits showing the
     detail view — clearing it at close time would fly the preview back into
     the grid underneath a sheet that is already leaving. */
  openTemplatePicker: () => set({ templatePickerOpen: true, pickerDetail: null, pickerCard: null, pickerSource: 'pill' }),
  closeTemplatePicker: () => set({ templatePickerOpen: false }),
  /* Mirrors `openAttachedPreview`: one write opens the sheet on this card alone
     and puts the object in the air toward the stage. `pickerDetail` is cleared —
     the two index spaces must never both be set. */
  openCardPreview: (card, id, from) =>
    set({
      templatePickerOpen: true,
      pickerSource: 'card',
      pickerDetail: null,
      pickerCard: card,
      tplFlight: { id, from, to: 'stage', card },
    }),
  /* …and mirrors `closeAttachedPreview`: the sheet starts dissolving, the detail
     view stands down in the same commit (so it cannot double the clone), and the
     object is in the air toward the card it came from. `pickerSource` deliberately
     survives, like `pickerDetail` does on the library path — the exiting sheet has
     to keep the fade it came in with rather than the pill's shrink. */
  closeCardPreview: (card, id, from) =>
    set({
      templatePickerOpen: false,
      pickerCard: null,
      tplFlight: { id, from, to: 'card', card },
    }),
  settleAttachedTile: () => set((st) => ({ tileSettle: st.tileSettle + 1 })),
  openTemplateDetail: (pickerDetail) => set({ pickerDetail }),
  closeTemplateDetail: () => set({ pickerDetail: null }),
  /*
   * Leaves `pickerDetail` alone on purpose — see openTemplatePicker. Leaves
   * `templatePickerOpen` alone too, which is newer: the overlay dissolves in
   * place under the flying stage and calls `closeTemplatePicker` itself when
   * that fade lands. Attaching and closing in one write made the sheet's exit
   * spring compete with the flight for the eye.
   */
  attachTemplate: (attachedTemplate, id, from) =>
    set({
      attachedTemplate,
      tplFlight: from ? { id, from, to: 'tile' } : null,
    }),
  detachTemplate: () => set({ attachedTemplate: null, tplFlight: null }),
  openAttachedPreview: (index, id, from) =>
    set({
      templatePickerOpen: true,
      pickerSource: 'tile',
      pickerDetail: index,
      pickerCard: null,
      tplFlight: { id, from, to: 'stage' },
    }),
  /* One write: the sheet starts dissolving, the detail view stands down (so it
     cannot double the clone), and the object is in the air toward the tile. */
  closeAttachedPreview: (index, id, from) =>
    set({
      templatePickerOpen: false,
      pickerDetail: null,
      tplFlight: { id, from, to: 'tile' },
    }),
  endTemplateFlight: () => set({ tplFlight: null }),
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
