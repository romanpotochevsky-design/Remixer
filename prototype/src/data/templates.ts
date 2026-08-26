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
 * 4. EVERY CHIP MUST RETURN AT LEAST ONE CARD IN BOTH LISTS — and, now that the picker's
 *    list is 36 rows (note 5), at least TWO there: a single card alone under a chip in a
 *    six-column grid reads as a broken filter rather than as a short list. An empty grid
 *    is an undrawn state (spec §10.5) — the quiet line below it exists for the impossible
 *    case, not as a shipping state. So re-filing a row means re-counting both lists, and
 *    the counts as filed are: TEMPLATES 6 total — ecommerce 2 · tech 1 · portfolio 1 ·
 *    business 1 · health 1; TEMPLATE_LIBRARY 36 total — ecommerce 9 · tech 8 ·
 *    portfolio 6 · business 6 · health 7. `all` and `more` fall through to everything.
 *    ⚠️ Only `all` fills its last row exactly (36 = 6×6). Every chip leaves a partial
 *    last row, and making the chips orphan-free too would mean every per-chip count being
 *    a multiple of six — which at 36 rows means handing one chip twelve of them and
 *    skewing the mix. Left skewed-free and orphaned per chip; designer's call.
 *
 * 5. HALF THE PICKER'S ROWS ARE OURS NOW (designer, 26.08.2026: «добавь больше вариантов
 *    в список чтобы скрол был больше»). Eight sites were drawn for it today — `coffee`,
 *    `fashion`, `devtools`, `analytics`, `photography`, `lawfirm`, `yoga`, `barbershop` in
 *    `ThumbId` — and the board has no cards for them, so no captions either. On those rows
 *    `name` and `description` are OURS, marked per row, and unlike the board's they DO
 *    describe their own screenshot: that is note 1 read as a rule instead of a complaint.
 *    It matters more than it looks, because the picker's grid draws no caption at all — a
 *    row's `name` is what assistive tech announces for the thumbnail ("Open Coffee Roaster
 *    Store"), and `description` is only ever rendered by the dock. TEMPLATES is untouched:
 *    those six cards and their order are drawn on 28375:43006.
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
  /** Verbatim from Figma on the board's rows; ours on the rows we added (note 5). */
  name: string
  /** Verbatim from Figma on the board's rows; ours on the rows we added (note 5). */
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
 * The fullscreen template picker (Figma 28616:59168) — SIX rows of six since 26.08.2026,
 * where the board draws three. The designer asked for a list long enough to scroll
 * properly, and 36 is the number that answers it twice over: it divides by the grid's six
 * `1fr` columns exactly, so the last row is full and no card is orphaned, and it leaves the
 * scroll-compacting header (spec §14.0) enough travel to actually compact.
 *
 * Two provenances live in this list, and every row below says which it is:
 *  · BOARD — the eighteen cards of Figma's 6×3 grid: captions verbatim, categories ours as
 *    always, drawn ORDER intact. They are still a strict subsequence of this list — the
 *    board's first card is first here, its last is last — with our rows interleaved
 *    between them, never appended after them. Interleaved on purpose: eight fresh sites in
 *    a block at the end, under eighteen repeats, is the same repetition the designer
 *    complained about, moved below the fold.
 *  · OURS — eighteen more rows: the eight new sites twice each (16), plus a third row for
 *    `restaurant` and for `campaign`, the two sites that keep `Business & services` from
 *    being the one thin chip in a 36-card grid.
 *
 * ⚠️ A SITE'S CATEGORY IS THE SAME IN EVERY ROW IT APPEARS IN — that is what "repeated
 * sites keep their category" means, and it is why `tech` had to be applied to all four
 * `payments`/`saas`/`crypto` rows, not just the first one: the same screenshot answering
 * two different chips would be the duplicate-category bug the seventh chip was drawn as.
 * ⚠️ AND SO IS ITS CAPTION. Every row of a site carries that site's `name` and
 * `description` — the board obeys this too (every `media` row is "Budget Dashboard"), and
 * breaking it for variety's sake would hand-build note 1's caption/screenshot mismatch in
 * the rows where we are the author and have no excuse.
 * ⚠️ Ids repeat, so a row's key is its POSITION here — and positions moved when the new
 * rows went in. Nothing persists an index (`ui.attachedTemplate` is in-memory state, no
 * localStorage), so there is no stale attachment pointing at the wrong site; that is why
 * renumbering was safe, not a lucky escape.
 */
export const TEMPLATE_LIBRARY: Template[] = [
  // Row 1 — THE BOARD'S ROW 1, UNTOUCHED, and the one row ours does not enter: these are
  // the six cards the designer just clicked past in the dock, in dock order, so the grid
  // opens on what he was already looking at. It costs nothing in variety — they are six
  // DIFFERENT sites; the board's repetition starts in its row 2, which is where ours does.
  // Col 3 is the picker's own swap: under the same caption it shows the full Synco®
  // Creative Agency page instead of the wordmark hero (`agency` in thumbs.tsx). Col 1 is
  // `tech` since 26.08.2026, with the dock's row (note 3): PayNexus is a payments product.
  { id: 'payments', name: 'AI Moodboard Canvas', description: 'Drag-and-drop images with text notes', category: 'tech' },
  { id: 'homeware', name: 'Homeware store website template', description: 'Dual-image cards with saved wishlist', category: 'ecommerce' },
  { id: 'agency', name: 'Marketing Campaign Hub', description: 'Launch checklists, UTM links, and funnel', category: 'portfolio' },
  { id: 'media', name: 'Budget Dashboard', description: 'CSV import with variance analytics', category: 'portfolio' },
  { id: 'architecture', name: 'Fashion Storefront', description: 'Working cart and stockists directory', category: 'ecommerce' },
  { id: 'wellness', name: 'AI Moodboard Canvas', description: 'Drag-and-drop images with text notes', category: 'health' },

  // Row 2 — ours in cols 1, 2 and 5; the board's row 2 keeps its order in 3, 4 and 6.
  // MERIDIAN (`coffee`) is a roaster's shelf of bags under a price grid — `ecommerce` for
  // what it sells, the same reading as `homeware`. KORE STUDIO (`photography`) is a mosaic
  // of work with no headline, no button and no CTA — the purest `portfolio` in the list.
  // ODEON (`fashion`) prices a garment and shows swatches, so `ecommerce` too.
  // ⚠️ Its caption avoids the word "Fashion" on purpose: the board already spends
  // "Fashion Storefront" on `architecture` (note 1), and two cards reading Fashion-something
  // in one grid is the repetition this row exists to break — hence "Editorial Lookbook".
  { id: 'coffee', name: 'Coffee Roaster Store', description: 'Product grid with per-bag prices', category: 'ecommerce' },  // caption ours
  { id: 'photography', name: 'Photography Portfolio', description: 'Image mosaic with a numbered work index', category: 'portfolio' },  // caption ours
  { id: 'saas', name: 'AI Moodboard Canvas', description: 'Drag-and-drop images with text notes', category: 'tech' },
  { id: 'restaurant', name: 'Homeware store website template', description: 'Dual-image cards with saved wishlist', category: 'business' },
  { id: 'fashion', name: 'Editorial Lookbook Store', description: 'Seasonal lookbook with color swatches', category: 'ecommerce' },  // caption ours
  { id: 'crypto', name: 'Marketing Campaign Hub', description: 'Launch checklists, UTM links, and funnel', category: 'tech' },

  // Row 3 — ours in cols 1, 3, 4 and 6; the board's `media` and `architecture` in 2 and 5.
  // Lumen (`analytics`) and forge (`devtools`) are both `tech` and both product pages, so
  // they sit two apart rather than side by side: one is near-white and chart-led, the other
  // blue-black with a code pane, and adjacency is the one place that difference has to
  // carry. Still (`yoga`) is `health`, with `wellness`. HALE & MARCH (`lawfirm`) is
  // `business` — professional services, and the only card here with no image anywhere.
  { id: 'analytics', name: 'AI Analytics Product Page', description: 'Trend chart with three metric tiles', category: 'tech' },  // caption ours
  { id: 'media', name: 'Budget Dashboard', description: 'CSV import with variance analytics', category: 'portfolio' },
  { id: 'yoga', name: 'Yoga Studio Site', description: 'Class timetable with per-class booking', category: 'health' },  // caption ours
  { id: 'devtools', name: 'Developer Tools Landing', description: 'Install command with code preview and build status', category: 'tech' },  // caption ours
  { id: 'architecture', name: 'Fashion Storefront', description: 'Working cart and stockists directory', category: 'ecommerce' },
  { id: 'lawfirm', name: 'Law Firm Website', description: 'Practice areas with case results', category: 'business' },  // caption ours

  // Row 4 — the board's `wellness`, `campaign` and `homeware` (in that order) with ours
  // between them. IRONSIDE (`barbershop`) is `health`: the chip is "Health And Beauty" and
  // a barbershop is the beauty half of it — which is also why it is not filed as a service
  // `business` next to the law firm. Cols 3 and 6 are the second rows of `coffee` and
  // `photography`; a second row carries the site's own caption, never a new one.
  { id: 'wellness', name: 'AI Moodboard Canvas', description: 'Drag-and-drop images with text notes', category: 'health' },
  { id: 'campaign', name: 'Marketing Campaign Hub', description: 'Launch checklists, UTM links, and funnel', category: 'business' },
  { id: 'coffee', name: 'Coffee Roaster Store', description: 'Product grid with per-bag prices', category: 'ecommerce' },  // caption ours
  { id: 'barbershop', name: 'Barbershop Website', description: 'Service price list with hours and ratings', category: 'health' },  // caption ours
  { id: 'homeware', name: 'Homeware store website template', description: 'Dual-image cards with saved wishlist', category: 'ecommerce' },
  { id: 'photography', name: 'Photography Portfolio', description: 'Image mosaic with a numbered work index', category: 'portfolio' },  // caption ours

  // Row 5 — the board's `architecture`, `wellness` and `media` (in order); ours are the
  // second `lawfirm` and `analytics` plus an extra `restaurant`. That extra is one of the
  // two rows added for no reason but arithmetic: with `lawfirm` alone, `Business & services`
  // came to four rows against nine for `Ecommerce`, so `restaurant` and `campaign` each got
  // a third row. Being a board site, it repeats the board's own pairing, caption included.
  { id: 'architecture', name: 'Fashion Storefront', description: 'Working cart and stockists directory', category: 'ecommerce' },
  { id: 'lawfirm', name: 'Law Firm Website', description: 'Practice areas with case results', category: 'business' },  // caption ours
  { id: 'wellness', name: 'AI Moodboard Canvas', description: 'Drag-and-drop images with text notes', category: 'health' },
  { id: 'restaurant', name: 'Homeware store website template', description: 'Dual-image cards with saved wishlist', category: 'business' },  // our row, board's caption
  { id: 'analytics', name: 'AI Analytics Product Page', description: 'Trend chart with three metric tiles', category: 'tech' },  // caption ours
  { id: 'media', name: 'Budget Dashboard', description: 'CSV import with variance analytics', category: 'portfolio' },

  // Row 6 — ours except the last card, which is the board's last card, still last. Second
  // rows for `campaign` (the other business row), `fashion`, `devtools`, `yoga` and
  // `barbershop`. Four of these six are dark sites: the library runs 19 dark rows to 17
  // light, so one row has to carry the excess, and the two light ones are spread through it
  // rather than stacked at an end.
  { id: 'campaign', name: 'Marketing Campaign Hub', description: 'Launch checklists, UTM links, and funnel', category: 'business' },  // our row, board's caption
  { id: 'fashion', name: 'Editorial Lookbook Store', description: 'Seasonal lookbook with color swatches', category: 'ecommerce' },  // caption ours
  { id: 'devtools', name: 'Developer Tools Landing', description: 'Install command with code preview and build status', category: 'tech' },  // caption ours
  { id: 'yoga', name: 'Yoga Studio Site', description: 'Class timetable with per-class booking', category: 'health' },  // caption ours
  { id: 'barbershop', name: 'Barbershop Website', description: 'Service price list with hours and ratings', category: 'health' },  // caption ours
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
 * The same rule over the picker's 36-card grid — but each row keeps its
 * position in TEMPLATE_LIBRARY: sites repeat there, so the index is the only
 * stable identity a card has, and it is what `ui.attachedTemplate` records.
 */
export const libraryIn = (
  category: TemplateCategoryId,
): { tpl: Template; index: number }[] =>
  TEMPLATE_LIBRARY.map((tpl, index) => ({ tpl, index })).filter(
    ({ tpl }) => category === 'all' || category === 'more' || tpl.category === category,
  )
