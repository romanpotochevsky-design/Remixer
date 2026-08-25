/**
 * The template gallery behind the Home page dock — hardcoded, like all prototype data.
 *
 * Every name and description here is transcribed verbatim from Figma 28375:43006 (the
 * Home page with the dock in its "Templates" state), in the order the six cards are
 * drawn. Two things about that board are worth knowing before you read the rows:
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
  /** Which miniature site the card shows. Doubles as the row's key. */
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
