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

/* ─────────────────── the template detail panel's copy ───────────────────
 *
 * What the expanded template preview shows in its right-hand information panel
 * (Figma 28637:42088 → `Right` 29179:45884), asked for by the product owner as
 * "template information".
 *
 * ⚠️ EVERY STRING BELOW IS OURS, AND THAT IS NOT A LIBERTY TAKEN. The board's own
 * copy is placeholder for a DIFFERENT template: it reads `Journal-style blog` /
 * `A magazine-grade home for long-form writing` / "magazines, journals, and serious
 * blogs" while the stage beside it draws AURA, the cream SUPPLEMENT store
 * (`homeware`). So the board specifies the FIELDS, their boxes and their drawn
 * lengths; the words are ours — the same reading of note 1 that note 5 applies to
 * the captions, and applied here with more force, because this is a 32px title and
 * ~450 characters of prose rather than a 12px caption. The ONE string transcribed
 * verbatim is the second section's heading, `Who it's for` (29186:45890): that one
 * is chrome, it is identical on all nineteen sites, and it is already plain English.
 * (Straight `'` in the file, curly `’` here — the prototype's English copy is curly
 * throughout, e.g. `This week’s menu` in SitePreview. Normalised deliberately, and
 * flagged to the designer rather than silently chosen.)
 *
 * ⚠️ PER SITE, NOT PER ROW. Keyed by `ThumbId`, because the two ⚠️ lines on
 * TEMPLATE_LIBRARY above ("a site's category is the same in every row"; "and so is
 * its caption") bind hardest here: `media` occupies three rows and twelve sites
 * occupy two, so per-row copy would let ONE screenshot carry three different titles
 * and three different pitches. It also makes the two lists agree for free — they
 * disagree at index 2 (`campaign` in the dock, `agency` in the picker) and both
 * doors open this same panel.
 *
 * ⚠️ AND THE COPY DESCRIBES THE DRAWING, NOT THE CAPTION. `name` on the board's rows
 * is placeholder that contradicts its own screenshot (note 1), so nothing here is
 * derived from it: every paragraph names things that are actually drawn in
 * `modules/home/thumbs.tsx` — that jar, that $1,799,980 card, that 4.9 badge, those
 * four bag prices. No feature that is not on the drawing is claimed anywhere: no
 * subscription, no booking engine, no dashboard unless the drawing has one. That is
 * the rule the captions added in note 5 already follow, held to a longer text.
 *
 * THE BOXES, and the budget each leaves. Every number below was MEASURED in Chromium
 * in the repo's substitute faces (Outfit for Gilroy, Figtree for Proxima Nova), which
 * run 1–4% WIDER than the licensed ones — so a string that just fits in Figma can
 * wrap here, and measuring in the substitutes is the pessimistic case:
 *   · `title`     Gilroy SemiBold 32 / lh 38 in 394px → ONE line. Widest of the
 *                 nineteen is `Creative agency landing` at 356px, so ≥ 38px of slack
 *                 on every title and none of them can wrap and steal 38px from the
 *                 card below. Sentence case, no full stop.
 *   · `tagline`   Proxima 15 / lh 21 in 362px (the box is 394 with a deliberate 32px
 *                 right inset) → the drawn maximum is TWO lines. All nineteen measure
 *                 exactly two, 52–67 chars, worst line 362 → keep new ones ≤ 67.
 *   · `categoryTags` Proxima Semibold 14, `whitespace-nowrap`, flush right in a 372px
 *                 row that already spends 57px on the word `Category`, so it OVERFLOWS
 *                 rather than wraps: budget ≈ 297px. Widest here is
 *                 `Tech & SaaS, Developer tools` at 199px. Rule: ≤ 3 tags, ≤ 30 chars
 *                 joined with ", ".
 *   · `sections[0].heading` Gilroy Medium 20 / lh 24 in a frame the board FIXES at
 *                 48px = exactly two lines. A third line does not clip — it overlaps
 *                 the paragraph below — and a single line leaves 24px of dead air, so
 *                 this is the one box that must be hit, not merely fitted. Authored to
 *                 40–50 chars: what decides it is INK, not characters, and one line
 *                 holds ~372px, so every heading here measures 390–452px of ink and
 *                 lands on two lines with ≥ 18px of margin over the 1-line threshold
 *                 (enough that a ~5% narrower licensed Gilroy still wraps).
 *   · `sections[*].body`  Proxima 14 / lh 20 in 372px, ~58 chars a line, auto height
 *                 inside the scroller. Section 1 is 283–320 chars over SIX lines where
 *                 the board draws 359 over seven; section 2 is 128–157 over THREE,
 *                 where the board draws 155 over three with 0.47px to spare. The
 *                 shortfall against the board is deliberate headroom, and no line in
 *                 either paragraph fills more than 99% of its column.
 *
 * THE SHAPE OF THE PROSE, taken from the board and held for all nineteen so that no
 * two fields say the same thing twice (the board's own copy says "long-form" three
 * times and "magazine" twice, which is the failure to avoid):
 *   · `title`               what the template IS.
 *   · `tagline`             how it FEELS. One sentence, full stop.
 *   · `sections[0].heading` the STRUCTURAL claim — never a restatement of the title.
 *   · `sections[0].body`    three sentences: what it is and who for · the parts IN
 *                           PAGE ORDER · a payoff. It does not open with "This
 *                           template is", which spends five words on nothing.
 *   · `sections[1].body`    two moves: the audience NAMED, then one imperative about
 *                           the customer's own material. Those imperatives avoid
 *                           `Add`, `Connect`, `Publish` and `Update` — the four verbs
 *                           the glossary reserves for domains and publishing — so the
 *                           panel cannot teach a second meaning for any of them.
 *                           (The board writes "Add your features"; we do not.)
 *
 * The list is open on purpose — the board's scrollbar thumb is drawn for roughly
 * 400px more content than the board draws — so a third section can be pushed onto
 * `sections` with no data migration. Two is what is drawn, and two is what ships.
 *
 * ⚠️ `synco` IS HERE THOUGH IT IS NOT A TEMPLATE. It is the customer's own store on
 * the "My projects" card and appears in neither list, so no door opens this panel for
 * it today — but `Record<ThumbId, …>` makes the compiler demand all nineteen, and a
 * missing key would be a blank panel in a demo the day a project card grows a preview.
 */
export interface TemplateDetail {
  /** Panel title — descriptive of the template, in the board's voice ("Journal-style blog"). */
  title: string
  /** One line under the title. Two lines at 362px is the drawn maximum. */
  tagline: string
  /** Right-aligned in the Category row, comma-joined ("Editorial, Blog"). */
  categoryTags: string[]
  /** The drawn pair is heading + paragraph; a repeatable list so a third can be added. */
  sections: { heading: string; body: string }[]
}

/**
 * Verbatim from 29186:45890 (with the house curly apostrophe) — this heading is
 * chrome, not content, so it is the same string on every site and lives in one place.
 */
const WHO_ITS_FOR = 'Who it’s for'

export const TEMPLATE_DETAILS: Record<ThumbId, TemplateDetail> = {
  // PayNexus — deep green fintech landing page. The white balance card reading
  // $1,799,980 overlaps the photograph, and it is the thing a person reads on this
  // drawing before the headline.
  payments: {
    title: 'Fintech landing page',
    tagline: 'A deep green landing page for a product that moves money.',
    categoryTags: ['Tech & SaaS', 'Fintech'],
    sections: [
      {
        heading: 'The whole proof is a balance card, not a claim',
        body:
          'A dark green hero built so a number does the talking. The headline underlines its ' +
          'last word in lime, a white card reading $1,799,980 overlaps the photograph beside ' +
          'it, and a row of customer faces closes the fold. A pale strip below opens the next ' +
          'section. Everything else defers to that card.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Payment products, wallets, and fintech startups that lead with a live number. Swap ' +
          'in your figure, your lime accent, and the faces of people who use it.',
      },
    ],
  },

  // AURA — cream supplement brand. The hero jar, the four customer faces with a
  // review count at the top right, and the dark green band of partner logos.
  homeware: {
    title: 'Supplement brand store',
    tagline: 'A warm, unhurried storefront for a brand with one hero product.',
    categoryTags: ['Ecommerce', 'Supplements'],
    sections: [
      {
        heading: 'Everything here argues from proof, not hype',
        body:
          'A cream page for a single item you believe in. It opens on the jar under a centered ' +
          'headline, with four customer faces and a review count at the top right, then a dark ' +
          'green band of partner logos, then a closing line under the fold. Nothing shouts, ' +
          'which is why it reads as something people already buy.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Supplement, skincare, and wellness names with one item they stand behind. Bring your ' +
          'jar, your review count, and the logos you have already earned.',
      },
    ],
  },

  // The Synco hero on its own: black page, blue wave, the wordmark oversized until
  // it runs off the right edge. One screen, no second section — that is the card.
  campaign: {
    title: 'One-page brand launch',
    tagline: 'A black page that spends everything it has on one word.',
    categoryTags: ['Business', 'Launch page'],
    sections: [
      {
        heading: 'Nothing but the wordmark and one blue wave',
        body:
          'A single screen for a name people should remember. The wordmark is set big enough to ' +
          'run off the right edge, a blue wave rolls in behind it from the left, three faint ' +
          'rules hold the grid, and the nav keeps to three links with the first underlined. ' +
          'There is no second section, and that is the point.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Launches, teasers, and studios whose name is the whole pitch. Give it your word, ' +
          'pick the color of the wave, and leave the rest of the screen empty.',
      },
    ],
  },

  // WE MAKE MEDIA — dark olive editorial agency. Oversized display line, the arch
  // portrait with italic Human over its corner, cream THIS IS UI/UX band at the foot.
  media: {
    title: 'Design studio page',
    tagline: 'Editorial type on olive, for a studio that shows before it explains.',
    categoryTags: ['Portfolio', 'Creative studio'],
    sections: [
      {
        heading: 'Big type across the top, the work in an arch below',
        body:
          'A dark olive page that opens on WE MAKE MEDIA set edge to edge. Under it a portrait ' +
          'stands in an arch with the word Human in italic across its corner, a short centered ' +
          'paragraph and one outlined button follow, and a cream band reading THIS IS UI/UX ' +
          'cuts in at the bottom. Put your own name in the top line.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Design studios and creative agencies with a point of view and one image worth the ' +
          'whole fold. Trade the arch for a picture of your own.',
      },
    ],
  },

  // ArchiForm — near-white architecture studio. Half the page is the glass facade,
  // drawn as vertical columns with floor lines, one project card floating over it.
  // ⚠️ Filed under `ecommerce` because the category came from the board's caption
  // "Fashion Storefront", not from the screenshot (note 1) — and nothing on this
  // drawing is for sale: no cart, no price, no product. So these tags describe the
  // DRAWING and stay silent about the bucket rather than claim a store that is not
  // there. Raised with the designer, not fixed here.
  architecture: {
    title: 'Architecture studio',
    tagline: 'A calm white page where one building carries the screen.',
    categoryTags: ['Architecture', 'Services'],
    sections: [
      {
        heading: 'The right half of the page is the building itself',
        body:
          'A near-white studio page split down the middle. A navy headline with a small brushed ' +
          'mark takes the left, two buttons and a row of faces sit under it, and a facade drawn ' +
          'as vertical glass columns bleeds off the right edge with one project card floating ' +
          'over it. A short line about the team closes the page.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Architects, interior studios, and builders whose case is one strong facade. Point ' +
          'the panel at a project of yours and rewrite the closing line.',
      },
    ],
  },

  // Serena — pale sage mental-health site. One full-bleed photograph with a
  // floating white nav pill, a chip of faces over the middle, headline bottom left.
  wellness: {
    title: 'Mental health site',
    tagline: 'A soft, sky-lit page for care that should feel unhurried.',
    categoryTags: ['Health & beauty', 'Therapy'],
    sections: [
      {
        heading: 'One photograph, and everything floats on it',
        body:
          'A pale sage page built on a single full-bleed photograph. A white nav pill floats at ' +
          'the top, a small chip of customer faces and a short paragraph sit over the middle, ' +
          'and the headline lands bottom left with a white button and a dark circle beside it. ' +
          'One quiet sage line under the photo says what you do.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Therapists, clinics, and calm wellness brands that need warmth before detail. Use a ' +
          'photograph of your own behind it and keep the copy this short.',
      },
    ],
  },

  // Synco® Creative Agency — the full page behind the same brand. Folded blue ribbon
  // off the top-left corner, a rail of four services down the right edge, and a
  // white band whose 50+ / 100+ are cropped mid-digit by the bottom of the screen.
  agency: {
    title: 'Creative agency landing',
    tagline: 'Black ground, blue silk, and three lines that say who you are.',
    categoryTags: ['Portfolio', 'Agency'],
    sections: [
      {
        heading: 'A ribbon of blue silk poured over a black page',
        body:
          'The full agency page behind the name. A folded blue ribbon spills out of the top ' +
          'left corner, three light lines of type stand beside it, a rail of four services runs ' +
          'down the right edge, and a white band at the foot carries the manifesto with 50+ and ' +
          '100+ cropped mid-digit by the bottom of the screen.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Agencies and production studios that sell a roster of services. List yours down the ' +
          'rail and give the band your own two numbers.',
      },
    ],
  },

  // WorkPro — bright blue SaaS landing. Centered headline with "social media"
  // underlined, then the white app window: menu column, three cards, a 94,127
  // counter over its bar chart, and a white claim band under it.
  saas: {
    title: 'SaaS product landing',
    tagline: 'A bright blue page that puts the app on the table right away.',
    categoryTags: ['Tech & SaaS', 'Product'],
    sections: [
      {
        heading: 'The product window makes the whole argument',
        body:
          'A saturated blue page for software you can show. The centered headline underlines ' +
          'the two words that count, two buttons follow, and a white app window opens under ' +
          'them with a menu column, three small cards and a 94,127 counter over its own bar ' +
          'chart. A white claim band ends the fold.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Software teams with a screen worth showing and one sentence to say why. Slot your ' +
          'own window into the frame and keep the claim band to two lines.',
      },
    ],
  },

  // Burgundy restaurant page. The gold-rimmed platter fills the right and a second
  // one runs off the top corner, the darker band counts 2k / 1k / 99 / 10, and a
  // cream gallery strip is cut by the bottom edge. Its board caption is AURA's
  // (note 1); the category is ours.
  restaurant: {
    title: 'Restaurant page',
    tagline: 'Deep burgundy and gold, with the food doing the selling.',
    categoryTags: ['Business', 'Restaurant'],
    sections: [
      {
        heading: 'A platter arrives before the first word is read',
        body:
          'A burgundy page where the table is the hero. The headline sits left with a gold seal ' +
          'and four small dishes under it, a rimmed platter fills the right and a second one ' +
          'runs off the corner, and a darker band counts 2k, 1k, 99 and 10. Discover Our ' +
          'Complete Range opens the gallery strip the fold cuts.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Restaurants, caterers, and family kitchens with a signature dish and years behind ' +
          'them. Show your own plates and make the four numbers yours.',
      },
    ],
  },

  // MineMax — near-black crypto-mining landing. Circuit traces run in from both
  // edges to a violet orb with a crystal at its center; two purple cards enter at
  // the foot and the crop cuts them.
  crypto: {
    title: 'Crypto mining landing',
    tagline: 'Near-black, lit from the middle, with the rig at its center.',
    categoryTags: ['Tech & SaaS', 'Crypto'],
    sections: [
      {
        heading: 'Everything on this page points at one violet orb',
        body:
          'A near-black page built around one lit object. A tag chip, a centered headline and ' +
          'two buttons stack above the rig, where circuit lines run in from both edges to a ' +
          'bright sphere with a crystal at its heart and the ground glows under it. Two purple ' +
          'cards enter at the bottom and the fold cuts them.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Mining outfits, wallets, and protocols selling something people cannot see. Keep the ' +
          'orb, write your own two lines above it, and let the dark do the rest.',
      },
    ],
  },

  // MERIDIAN — cream-over-espresso roaster. The four-bag shelf under Single origin
  // owns more of the page than the hero does, which is the composition's own point.
  coffee: {
    title: 'Coffee roaster store',
    tagline: 'Cream over espresso, with the shelf given more room than the hero.',
    categoryTags: ['Ecommerce', 'Coffee'],
    sections: [
      {
        heading: 'The shelf gets more of the page than the hero',
        body:
          'A roaster’s store that leads with what is in stock. The espresso band up top carries ' +
          'the nav, a two-line promise and one bag; under it Single origin heads a row of four ' +
          'bags priced from $16 to $24; an espresso footer closes the page. The cream between ' +
          'them is the shop’s own light.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Roasters, tea sellers, and small food brands with a handful of bags to ship this ' +
          'week. Price your four and put your own two days in the promise.',
      },
    ],
  },

  // ODEON — paper-white lookbook store. Hard vertical split: SPRING SUMMER 26 and
  // three swatches on the left, a full-height image column with a $240 tag right.
  fashion: {
    title: 'Lookbook store',
    tagline: 'A hard split: type on paper, one long image column beside it.',
    categoryTags: ['Ecommerce', 'Fashion'],
    sections: [
      {
        heading: 'The type on the left, the season on the right',
        body:
          'A paper-white spread that reads like a magazine. SPRING SUMMER 26 fills the left ' +
          'column above three color swatches and one black button, while a tall image column ' +
          'runs full height on the right with a $240 tag and one small red flash on the shot. ' +
          'LOOKBOOK 01 sits on the footer rule.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Fashion labels and concept stores that publish a season rather than a catalog. Name ' +
          'the season, then swap the swatches for your own colors.',
      },
    ],
  },

  // forge — blue-black developer-tools landing. A mono install line starting with a
  // dollar sign on the left, the editor window with a green 1.4s build panel right.
  devtools: {
    title: 'Developer tools page',
    tagline: 'Blue-black, monospace, and one command you can copy.',
    categoryTags: ['Tech & SaaS', 'Developer tools'],
    sections: [
      {
        heading: 'One command on the left, the editor on the right',
        body:
          'A blue-black page written for people who read terminals. The pitch takes the left ' +
          'column under a small cyan chip, with an install line that starts with a dollar sign; ' +
          'the editor on the right shows eight indented lines of syntax, a tab bar above them, ' +
          'and a green build panel reading 1.4s. Five logo marks close the page.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Open-source projects and developer tools whose install is one line. Put that line in ' +
          'the box, your version in the nav, your build time in the panel.',
      },
    ],
  },

  // Lumen — cool near-white AI analytics page. The white chart card heads with 48.2k
  // and plots two series; three tiles under it carry +38%, a column chart and 0.9s.
  analytics: {
    title: 'Analytics product page',
    tagline: 'A light, chart-led page for a tool that explains numbers.',
    categoryTags: ['Tech & SaaS', 'Analytics'],
    sections: [
      {
        heading: 'One white chart card carries the right side',
        body:
          'A cool white page for software whose answer is a chart. The pitch sits left under an ' +
          'indigo chip, and a white card on the right heads with 48.2k and plots two series ' +
          'over three gridlines. Three tiles follow: a +38% change, a column chart with one bar ' +
          'picked out, and 0.9s beside a small donut.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Analytics and reporting tools that have to look trustworthy in one glance. Fill the ' +
          'card and all three tiles with numbers of your own.',
      },
    ],
  },

  // KORE STUDIO — near-black portfolio. Four columns of pictures and nothing to
  // read: no headline, no buttons, no CTA. The footer counts 01 / 24 beside
  // SELECTED WORK, and that absence is the whole design.
  photography: {
    title: 'Photography portfolio',
    tagline: 'Near-black, with no headline and nothing to read but the work.',
    categoryTags: ['Portfolio', 'Photography'],
    sections: [
      {
        heading: 'No hero, no buttons, no copy — just four columns',
        body:
          'A near-black portfolio that skips the pitch. KORE stands large in the top row beside ' +
          'one amber dot, then four columns of pictures fill everything down to the footer — ' +
          'one captioned, the rest left silent. The footer counts 01 / 24 beside the words ' +
          'SELECTED WORK. There is no headline to write.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Photographers, directors, and set designers whose work should arrive before any ' +
          'words do. Drop in your own frames and keep the count in the footer true.',
      },
    ],
  },

  // HALE & MARCH — deep navy law firm. No image anywhere, not even a gradient
  // panel: three numbered columns on gold hairlines, and 40+ / $1.2B / 98%.
  lawfirm: {
    title: 'Law firm site',
    tagline: 'Navy and gold, built from type alone, with no photographs.',
    categoryTags: ['Business', 'Law firm'],
    sections: [
      {
        heading: 'Authority from rules and gold, not from pictures',
        body:
          'A deep navy page with no image anywhere. A short gold rule opens the centered ' +
          'headline, two buttons sit under it, and three numbered columns divided by gold ' +
          'hairlines name the practice areas. A darker band closes with 40+, $1.2B and 98%. ' +
          'Nothing here needs a photograph to look expensive.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Law firms, accountants, and advisers who are hired on record rather than on imagery. ' +
          'Number your practice areas and set your own three figures in the band.',
      },
    ],
  },

  // Still — warm sand yoga studio, one tone from top to bottom. The arch is the
  // only tonal event; the timetable rows are hairlines with a button on each.
  yoga: {
    title: 'Yoga studio site',
    tagline: 'One warm sand tone from top to bottom, and a very quiet voice.',
    categoryTags: ['Health & beauty', 'Yoga'],
    sections: [
      {
        heading: 'One tone all the way down, and a single arch',
        body:
          'A sand-colored page that never changes tone. Slow flow, every morning. is set in ' +
          'the largest type on the page, an arch of soft light stands beside it, and a ' +
          'timetable underneath lists 7:00, 9:30 and 18:00 on hairline rules with a button ' +
          'at the end of each row. No band breaks it, and the arch is the only tonal event.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Yoga studios, pilates teachers, and retreats whose whole promise is calm. Set your ' +
          'three classes and let the page stay this empty.',
      },
    ],
  },

  // IRONSIDE — warm charcoal barbershop, vermilion the only accent. Capitals, the
  // hours ruled off beside them, a 4.9 badge on the interior shot, then the prices.
  barbershop: {
    title: 'Barbershop site',
    tagline: 'Charcoal with one vermilion accent, and prices in plain sight.',
    categoryTags: ['Health & beauty', 'Barbershop'],
    sections: [
      {
        heading: 'Three words, then the facts a walk-in wants',
        body:
          'A charcoal page that gets to the point. SHARP EVERY TIME stacks in capitals with the ' +
          'last word in vermilion and two buttons under it, the opening hours stand ruled off ' +
          'beside them, and a shop photograph carries a 4.9 badge. Four services follow at $35, ' +
          '$28, $45 and $22, over a vermilion footer rule.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Barbers, tattoo studios, and small shops that live on regulars and passing trade. ' +
          'List your four prices and your real opening hours.',
      },
    ],
  },

  // synco.com — the customer's own store on the project card: the same black hero,
  // with a pale strip of four captioned products under it. NOT a template row (see
  // the ⚠️ in the block comment), written so the panel is never blank if one appears.
  synco: {
    title: 'Online store',
    tagline: 'A wordmark at full volume, with a shelf of goods below it.',
    categoryTags: ['Ecommerce', 'Online store'],
    sections: [
      {
        heading: 'A hard break between the black and the light',
        body:
          'A brand hero doing double duty as a shop front. The wordmark still runs off the ' +
          'right edge over its blue wave and the nav still keeps to three links, but where a ' +
          'launch page would stop, a pale strip of four products begins, each captioned under ' +
          'its picture. The shop starts where the poster ends.',
      },
      {
        heading: WHO_ITS_FOR,
        body:
          'Small brands with a name worth shouting and a short first collection. Load in four ' +
          'products and let the hero keep doing the talking.',
      },
    ],
  },
}
