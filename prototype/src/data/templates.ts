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
 * 3. THE SEVENTH CHIP IS OURS TOO, topic included (designer, 26.08.2026). Both picker
 *    boards draw a seventh chip that is a duplicate `Ecommerce` (spec §14.5) — asked
 *    about it, the designer said «не нужен дубль, придумай другой топик», so the slot the
 *    duplicate occupied (third, between Ecommerce and Portfolio) now carries
 *    **`Tech & SaaS`**. Filed under it: the cards whose SCREENSHOTS are product/startup
 *    pages — PayNexus (`payments`), WorkPro (`saas`), MineMax (`crypto`) — not the ones
 *    whose placeholder captions merely sound technical. Same reading rule as note 1: the
 *    screenshot is what the customer sees, the caption is placeholder copy.
 *
 * 4. EVERY CHIP MUST RETURN AT LEAST ONE CARD IN BOTH LISTS. An empty grid under a chip
 *    is an undrawn state (spec §10.5) — the quiet line below it exists for the impossible
 *    case, not as a shipping state. So re-filing a row means re-counting both lists, and
 *    the counts as filed are: TEMPLATES 6 total — ecommerce 2 · tech 1 · portfolio 1 ·
 *    business 1 · health 1; TEMPLATE_LIBRARY 18 total — ecommerce 5 · tech 4 ·
 *    portfolio 4 · business 2 · health 3. `all` and `more` fall through to everything.
 *
 * Strings are plain English, not the `{ en, uk }` pairs used elsewhere: these are drawn
 * strings, and Figma has no Ukrainian for them. Inventing template names in a second
 * language would be inventing product content. Under the UK locale they stay English.
 */
import type { ThumbId } from '@/modules/home/thumbs'

/**
 * Every chip in the row, including the two that are not really filters — and `tech`,
 * which is ours: the board's seventh chip is a duplicated `Ecommerce` and the designer
 * asked for a different topic instead (note 3 above).
 */
export type TemplateCategoryId =
  | 'all'
  | 'ecommerce'
  | 'tech'
  | 'portfolio'
  | 'business'
  | 'health'
  | 'more'

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
    // Draws PayNexus, a dark-green fintech landing page. Category ours, and re-filed
    // 26.08.2026: a payments product page is the archetype of the new `tech` chip, and
    // it is the only card in this shelf that is one — which is also what keeps
    // `Tech & SaaS` from returning an empty dock (note 4).
    id: 'payments',
    name: 'AI Moodboard Canvas',
    description: 'Drag-and-drop images with text notes',
    category: 'tech',
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
 *
 * ⚠️ A SITE'S CATEGORY IS THE SAME IN EVERY ROW IT APPEARS IN — that is what "repeated
 * sites keep their category" means, and it is why `tech` had to be applied to all four
 * `payments`/`saas`/`crypto` rows, not just the first one: the same screenshot answering
 * two different chips would be the duplicate-category bug the seventh chip was drawn as.
 */
export const TEMPLATE_LIBRARY: Template[] = [
  // Row 1 — the dock's six cards in dock order, except col 3: under the same caption
  // the picker swaps the Synco wordmark hero for the full Synco® Creative Agency page
  // (the same screenshot, cropped much taller — see `agency` in thumbs.tsx).
  // `tech` since 26.08.2026, with the dock's row (note 3): PayNexus is a payments product.
  { id: 'payments', name: 'AI Moodboard Canvas', description: 'Drag-and-drop images with text notes', category: 'tech' },
  { id: 'homeware', name: 'Homeware store website template', description: 'Dual-image cards with saved wishlist', category: 'ecommerce' },
  // Category ours: an agency showcase is a portfolio, same reasoning as `media`.
  { id: 'agency', name: 'Marketing Campaign Hub', description: 'Launch checklists, UTM links, and funnel', category: 'portfolio' },
  { id: 'media', name: 'Budget Dashboard', description: 'CSV import with variance analytics', category: 'portfolio' },
  { id: 'architecture', name: 'Fashion Storefront', description: 'Working cart and stockists directory', category: 'ecommerce' },
  { id: 'wellness', name: 'AI Moodboard Canvas', description: 'Drag-and-drop images with text notes', category: 'health' },

  // Row 2 — three sites the dock never shows, then the tail of row 1 repeats.
  // WorkPro, a social-media scheduling tool: a SaaS product page, so `tech` since
  // 26.08.2026 — it was under `business`, which is where "sells to businesses" put it
  // before there was a chip for what it actually IS.
  { id: 'saas', name: 'AI Moodboard Canvas', description: 'Drag-and-drop images with text notes', category: 'tech' },
  // Category ours: a dining page is a service business, whatever its caption sells. This
  // row is one of the two that keep `Business & services` populated (note 4).
  { id: 'restaurant', name: 'Homeware store website template', description: 'Dual-image cards with saved wishlist', category: 'business' },
  // MineMax, a crypto-mining platform: a product/startup page, `tech` since 26.08.2026.
  { id: 'crypto', name: 'Marketing Campaign Hub', description: 'Launch checklists, UTM links, and funnel', category: 'tech' },
  { id: 'media', name: 'Budget Dashboard', description: 'CSV import with variance analytics', category: 'portfolio' },
  { id: 'architecture', name: 'Fashion Storefront', description: 'Working cart and stockists directory', category: 'ecommerce' },
  { id: 'wellness', name: 'AI Moodboard Canvas', description: 'Drag-and-drop images with text notes', category: 'health' },

  // Row 3 — the dock's six sites reshuffled. Cols 1 and 6 restore the dock pairings
  // that rows 1–2 override: the wordmark hero back under "Marketing Campaign Hub",
  // PayNexus back under "AI Moodboard Canvas".
  // The dock's Synco wordmark hero — and, with `restaurant`, the second of the two rows
  // holding `Business & services` up in this list (note 4).
  { id: 'campaign', name: 'Marketing Campaign Hub', description: 'Launch checklists, UTM links, and funnel', category: 'business' },
  { id: 'homeware', name: 'Homeware store website template', description: 'Dual-image cards with saved wishlist', category: 'ecommerce' },
  { id: 'architecture', name: 'Fashion Storefront', description: 'Working cart and stockists directory', category: 'ecommerce' },
  { id: 'wellness', name: 'AI Moodboard Canvas', description: 'Drag-and-drop images with text notes', category: 'health' },
  { id: 'media', name: 'Budget Dashboard', description: 'CSV import with variance analytics', category: 'portfolio' },
  // PayNexus again — same site, same `tech`.
  { id: 'payments', name: 'AI Moodboard Canvas', description: 'Drag-and-drop images with text notes', category: 'tech' },
]

export interface TemplateCategoryChip {
  id: TemplateCategoryId
  /**
   * Verbatim from Figma 28376:43913, including its capitalisation of "And" — with the
   * single exception of `tech`, whose label is ours because the drawn chip in that slot
   * is a duplicate (see TEMPLATE_CATEGORIES below).
   */
  label: string
}

/**
 * The filter chips, left to right as drawn — SEVEN since 26.08.2026. "All templates" is
 * the selected state on the board. "More" is an overflow control, not a bucket — no
 * template is filed under it, and nothing on the board says what it opens.
 *
 * The third one is the designer's answer to his own duplicate (note 3): the boards draw
 * `Ecommerce` twice, he asked for another topic, and the slot keeps its drawn POSITION so
 * the row's rhythm is the drawn one — 7 chips, gap 8. Its label is OURS and therefore not
 * marked "verbatim": `Tech & SaaS` follows the row's own conventions — an ampersand like
 * `Business & services`, Title case like `Health And Beauty` for the acronym-bearing half.
 * Measured, because a wider chip could re-flow two rows: `Tech & SaaS` renders **110.3px**
 * against the **108.9px** the duplicate `Ecommerce` renders at in the same type, so the
 * row grows by **1.4px** (838.9 → 840.3) — nothing downstream moves. It sits 20px wider
 * than the drawn 820 for a reason that predates this chip: the substitute faces cost every
 * chip 1.4–3.9px (`All templates` 112 → 113.7, `Ecommerce` 105 → 108.9, `Portfolio`
 * 86 → 89.3, `Business & services` 151 → 152.4, `Health And Beauty` 146 → 149.2,
 * `More` 67 → 68.5). Verified to fit in the picker and in the dock's right-aligned title
 * row down to a 1280 window (no overflow, no page scrollbar).
 */
export const TEMPLATE_CATEGORIES: TemplateCategoryChip[] = [
  { id: 'all', label: 'All templates' },
  { id: 'ecommerce', label: 'Ecommerce' },
  { id: 'tech', label: 'Tech & SaaS' },
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

/**
 * The same rule over the picker's 18-card grid — but each row keeps its
 * position in TEMPLATE_LIBRARY: sites repeat there, so the index is the only
 * stable identity a card has, and it is what `ui.attachedTemplate` records.
 */
export const libraryIn = (
  category: TemplateCategoryId,
): { tpl: Template; index: number }[] =>
  TEMPLATE_LIBRARY.map((tpl, index) => ({ tpl, index })).filter(
    ({ tpl }) => category === 'all' || category === 'more' || tpl.category === category,
  )
