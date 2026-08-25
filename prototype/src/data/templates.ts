/**
 * The template gallery behind the Home page dock, and the fullscreen template picker's
 * grid — hardcoded, like all prototype data.
 *
 * Every name and description here is transcribed verbatim from Figma — `TEMPLATES` from
 * 28375:43006 (the Home page with the dock in its "Templates" state), `TEMPLATE_LIBRARY`
 * from 28616:59168 (the fullscreen picker, "Pick a template. We'll remix it") — in the
 * order the cards are drawn. Two things about those boards are worth knowing before you
 * read the rows:
 *
 * 1. The captions do not describe their own screenshots. The card captioned "Budget
 *    Dashboard" shows a media agency; "Fashion Storefront" shows an architecture studio;
 *    "Marketing Campaign Hub" shows a storefront called Synco. And cards 1 and 6 carry
 *    the *identical* caption, "AI Moodboard Canvas", over two different sites. This is
 *    placeholder copy paired with placeholder screenshots, not a spec — so `id` names the
 *    site that is actually drawn (see `ThumbId` in `modules/home/thumbs.tsx`) while `name`
 *    and `description` stay exactly as written. Flagged to the designer; not "fixed" here.
 *
 * 2. Nothing on the board assigns a card to a filter chip. Every `category` below is OURS,
 *    picked so the chips actually filter something in the prototype. Marked per row.
 *
 * Strings are plain English, not the `{ en, uk }` pairs used elsewhere: these are drawn
 * strings, and Figma has no Ukrainian for them. Inventing template names in a second
 * language would be inventing product content. Under the UK locale they stay English.
 */
import type { ThumbId } from '@/modules/home/thumbs'

/** Every chip on the board, including the two that are not really filters. */
export type TemplateCategoryId = 'all' | 'ecommerce' | 'portfolio' | 'business' | 'health' | 'more'

/** What a template can actually be filed under — `all` and `more` are controls, not buckets. */
export type TemplateCategory = Exclude<TemplateCategoryId, 'all' | 'more'>

export interface Template {
  /**
   * Which miniature site the card shows. Doubles as the row's key in TEMPLATES, where
   * ids are unique; TEMPLATE_LIBRARY repeats sites, so there a row's key is its index.
   */
  id: ThumbId
  /** Verbatim from Figma. */
  name: string
  /** Verbatim from Figma. */
  description: string
  category: TemplateCategory
}

export const TEMPLATES: Template[] = [
  {
    // Draws PayNexus, a dark-green fintech landing page. Category ours: a payments
    // landing page is the closest thing on the board to "business & services".
    id: 'payments',
    name: 'AI Moodboard Canvas',
    description: 'Drag-and-drop images with text notes',
    category: 'business',
  },
  {
    // Draws AURA, a cream supplement brand. The only card whose caption and screenshot
    // agree that it sells things, so the category is the designer's in spirit.
    id: 'homeware',
    name: 'Homeware store website template',
    description: 'Dual-image cards with saved wishlist',
    category: 'ecommerce',
  },
  {
    // Draws the Synco storefront hero. Category ours: the caption sells a marketing tool.
    id: 'campaign',
    name: 'Marketing Campaign Hub',
    description: 'Launch checklists, UTM links, and funnel',
    category: 'business',
  },
  {
    // Draws "WE MAKE MEDIA", a dark editorial agency page. Category ours: an agency
    // showcase is a portfolio, whatever the caption says about dashboards.
    id: 'media',
    name: 'Budget Dashboard',
    description: 'CSV import with variance analytics',
    category: 'portfolio',
  },
  {
    // Draws ArchiForm, an architecture studio. Category ours, taken from the caption
    // rather than the screenshot — a storefront belongs under Ecommerce.
    id: 'architecture',
    name: 'Fashion Storefront',
    description: 'Working cart and stockists directory',
    category: 'ecommerce',
  },
  {
    // Draws Serena, a mental-health site — the one card that gives "Health And Beauty"
    // something to filter to. Category ours, taken from the screenshot.
    id: 'wellness',
    name: 'AI Moodboard Canvas',
    description: 'Drag-and-drop images with text notes',
    category: 'health',
  },
]

/**
 * The fullscreen template picker (Figma 28616:59168) — all eighteen cards of its 6×3
 * grid, row by row, left to right. The picker recycles the dock's six captions across
 * the eighteen cards and mixes four new site designs (`agency`, `saas`, `restaurant`,
 * `crypto`) in among the six known screenshots — the board's placeholder pairing,
 * reproduced verbatim rather than "fixed", same policy as TEMPLATES above. Ids repeat,
 * so a row's key is its position in this list. Categories stay OURS: repeated sites
 * keep the category their TEMPLATES row has, the four new sites are filed below.
 */
export const TEMPLATE_LIBRARY: Template[] = [
  // Row 1 — the dock's six cards in dock order, except col 3: under the same caption
  // the picker swaps the Synco wordmark hero for the full Synco® Creative Agency page
  // (the same screenshot, cropped much taller — see `agency` in thumbs.tsx).
  { id: 'payments', name: 'AI Moodboard Canvas', description: 'Drag-and-drop images with text notes', category: 'business' },
  { id: 'homeware', name: 'Homeware store website template', description: 'Dual-image cards with saved wishlist', category: 'ecommerce' },
  // Category ours: an agency showcase is a portfolio, same reasoning as `media`.
  { id: 'agency', name: 'Marketing Campaign Hub', description: 'Launch checklists, UTM links, and funnel', category: 'portfolio' },
  { id: 'media', name: 'Budget Dashboard', description: 'CSV import with variance analytics', category: 'portfolio' },
  { id: 'architecture', name: 'Fashion Storefront', description: 'Working cart and stockists directory', category: 'ecommerce' },
  { id: 'wellness', name: 'AI Moodboard Canvas', description: 'Drag-and-drop images with text notes', category: 'health' },

  // Row 2 — three sites the dock never shows, then the tail of row 1 repeats.
  // Category ours: a social-media tool sells to businesses.
  { id: 'saas', name: 'AI Moodboard Canvas', description: 'Drag-and-drop images with text notes', category: 'business' },
  // Category ours: a dining page is a service business, whatever its caption sells.
  { id: 'restaurant', name: 'Homeware store website template', description: 'Dual-image cards with saved wishlist', category: 'business' },
  // Category ours: a mining platform is a business page, not a portfolio.
  { id: 'crypto', name: 'Marketing Campaign Hub', description: 'Launch checklists, UTM links, and funnel', category: 'business' },
  { id: 'media', name: 'Budget Dashboard', description: 'CSV import with variance analytics', category: 'portfolio' },
  { id: 'architecture', name: 'Fashion Storefront', description: 'Working cart and stockists directory', category: 'ecommerce' },
  { id: 'wellness', name: 'AI Moodboard Canvas', description: 'Drag-and-drop images with text notes', category: 'health' },

  // Row 3 — the dock's six sites reshuffled. Cols 1 and 6 restore the dock pairings
  // that rows 1–2 override: the wordmark hero back under "Marketing Campaign Hub",
  // PayNexus back under "AI Moodboard Canvas".
  { id: 'campaign', name: 'Marketing Campaign Hub', description: 'Launch checklists, UTM links, and funnel', category: 'business' },
  { id: 'homeware', name: 'Homeware store website template', description: 'Dual-image cards with saved wishlist', category: 'ecommerce' },
  { id: 'architecture', name: 'Fashion Storefront', description: 'Working cart and stockists directory', category: 'ecommerce' },
  { id: 'wellness', name: 'AI Moodboard Canvas', description: 'Drag-and-drop images with text notes', category: 'health' },
  { id: 'media', name: 'Budget Dashboard', description: 'CSV import with variance analytics', category: 'portfolio' },
  { id: 'payments', name: 'AI Moodboard Canvas', description: 'Drag-and-drop images with text notes', category: 'business' },
]

export interface TemplateCategoryChip {
  id: TemplateCategoryId
  /** Verbatim from Figma 28376:43913, including its capitalisation of "And". */
  label: string
}

/**
 * The filter chips, left to right as drawn. "All templates" is the selected state on the
 * board. "More" is an overflow control, not a bucket — no template is filed under it, and
 * nothing on the board says what it opens.
 */
export const TEMPLATE_CATEGORIES: TemplateCategoryChip[] = [
  { id: 'all', label: 'All templates' },
  { id: 'ecommerce', label: 'Ecommerce' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'business', label: 'Business & services' },
  { id: 'health', label: 'Health And Beauty' },
  { id: 'more', label: 'More' },
]

/** The chip filter. "All templates" and "More" both fall through to the full set. */
export const templatesIn = (category: TemplateCategoryId): Template[] =>
  category === 'all' || category === 'more'
    ? TEMPLATES
    : TEMPLATES.filter((tpl) => tpl.category === category)
