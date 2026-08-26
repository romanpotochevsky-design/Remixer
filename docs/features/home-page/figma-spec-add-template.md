# Remixer Home page — «Add template» pill + template-picker popup — Figma spec

Source file: **`AI Website Builder`** — fileKey `GP4jNXtc37VTFVZDc9JF0a`
Captured: **25 Aug 2026**, via Figma MCP (`get_metadata`, `get_design_context`,
`get_variable_defs`, `get_screenshot` with `enableBase64Response` — the egress proxy
403-blocks every direct `figma.com` fetch, verified again this session).

Targets:

| Board | id | Size | What it shows | Canvas x, y |
|---|---|---|---|---|
| Template picker popup | **`28616:59168`** | 1656 × 1196 | The full Home page (tabs-dock state) under a 50 % black scrim, with a near-fullscreen template-picker sheet on top | −4385, 2610 — **directly below the canonical Home board** (−4385, 1311 + 1196 = 2507; 103 px gap), same left edge |
| Updated Home page (canonical) | **`28364:40053`** | 1656 × 1196 | Same board as `figma-spec.md`, with the composer's bottom-left button group reworked | −4385, 1311 |

Both boards are named **“Domain-Only Customer”**, like every other Home board — id is the
only way to tell them apart. This document **extends `figma-spec.md`** (25 Aug 2026): it
specs the popup in full and diffs the composer against §5 there. Everything not mentioned
here is unchanged from that spec.

## How to read this document

* Every number is from a tool response. Anything read off a render is marked **≈ measured**.
  Colour values sampled **by eye off the MCP render** are marked so — the proxy blocks the
  asset URLs, so no programmatic pixel sampling was possible this session.
* **Theme trap (standing rule from `figma-spec.md`):** `get_design_context` writes
  light-theme fallbacks. On these dark boards: `Neutral Alpha/300` fallback
  `rgba(9,9,11,.24)` → real dark value **`#ffffff3d`** (24 % white); active chip fill
  fallback `#18181b` → real **`#f7f7f7`**; chip label fallbacks are swapped the same way.
  `get_variable_defs` (dark) is the authority; its values are used throughout.
* **New `get_metadata` failure mode found this session:** the Fashion-Storefront cards’
  `Image` frames come back **childless** (self-closing) in the XML, while
  `get_design_context` shows a *visible* child image rect inside each
  (`28626:648` / `758` / `868`). Metadata cannot be trusted to prove a node has no
  children — same family of lies as the ellipse coordinates documented in `CLAUDE.md`.
* `get_screenshot` does **not** upscale past natural canvas size: a 233 px card renders at
  233 px no matter the `maxDimension`. Fine-detail reads of thumbnails are limited by that.

---

## 0. What changed vs the built page (implementer summary)

1. **Composer bottom-left: a new “Add template” pill** sits 8 px right of the `+` button —
   123 × 36, radius 999, glass. New nodes `28616:58682/58683/58693` inside a new `Left`
   wrapper `28616:58687` (gap 8) that replaces the old `Edition buttons` wrapper (gap 4).
2. **The `+`, the pill and the mic are restyled from ghost to glass:** fill `Black/700`
   `#09090ba3` (64 % black) + `backdrop-blur(16px)` + 1 px border `Neutral Alpha/300`
   `#ffffff3d` (24 % white). Previously: no fill, no blur, 1 px `Neutral Alpha/100`
   `#ffffff14` (8 %). This is **exactly the builder-shell composer button recipe** from
   `CLAUDE.md` — the home composer now matches the builder composer.
   🛠 **Correction 26.08.2026: the “1 px 24 % border” was a flattened export read, not
   the drawn paint.** The stroke paints are LINEAR GRADIENTS running top-left → bottom-right:
   the circles 24 % → 4 % → 24 % (stops bound to `Neutral Alpha/300 → 50 → 300`), the
   pill 20 % → 5 % → 15 % (literal stops; confirmed against the designer’s own
   gradient-editor screenshot). `get_design_context` flattens a gradient stroke to a
   single solid — read `node.strokes` via the Plugin API instead. Canon:
   `design-system.md` § «Liquid Glass — кнопки и контролы».
3. **Nothing else on the Home board changed.** Field, text row, Build (all three stacked
   states), right-group layout, prompt-chip row (including the hard-coded `#283a71` scrim
   rectangle), hero, topbar, dock — all byte-identical to `figma-spec.md`. Verified by
   re-reading `28364:40215` and the three Build frames.
4. **A new surface to build: the template-picker popup** — 50 % black scrim over the whole
   page, a 16 px-inset `#18181b` sheet (radius 16), close ✕ 40 px at its top-right,
   centred heading **`Pick a template. We'll remix it`** (no trailing period), the same
   six filter chips as the dock (centred this time), and a 6 × 3 grid of the dock’s
   template card at 233.33 × 272 with 32 px gaps. 18 cards, 9 distinct assets
   (10 visually distinct thumbnails — the Synco asset appears in two crops),
   **3 genuinely new site designs** (see §6).
5. **Board drift to not copy:** the Templates-dock board `28375:43006` still has the *old*
   composer (ghost buttons, no pill — verified on `28375:43176`), and the popup board’s
   own under-scrim composer is a stale intermediate (pill present but ghost-styled,
   `28616:59339/59343/59352`). **`28364:40053` is the canonical composer.**

---

## 1. Popup board anatomy (`28616:59168`)

Top-level children, bottom → top (z-order as Figma draws them):

| z | Node | Name | Geometry | What it is |
|---|---|---|---|---|
| 1 | `28616:59288` | `Frame 1228852208` | (0, 0) 1656 × 820 | the Home hero, identical composition to the canonical board |
| 2 | `28616:59692` | `Frame 1228852208` | (0, 820) 1656 × 376 | the Home dock, **tabs state** (Title 80, `Conteiner` 272 — same as canonical) |
| 3 | `28616:59831` | `Menu` | (8, 8) 1640 × 72 | the Home topbar |
| 4 | `28616:59963` | `Rectangle 1162905193` | (0, 0) **1656 × 1197** | **the scrim** — covers page + topbar; 1 px taller than the board (overshoots the bottom edge — accident) |
| 5 | `28626:533` | `Frame 1228852209` | (0, 0) 1656 × 1196 | popup layer: contains the sheet |
| hidden | `28616:59169` / `59170` / `59632` | Webmail button / Top Toolbar 56 / Trustpilot | — | the usual parked alternates, all hidden |
| parked outside | `28616:59829` / `59830` | CTA outlined (black) / CTA primary (blue) | x = 1692 / 1815 | swatches outside the frame, same as on the canonical board — not part of the page |

⚠️ The under-scrim page is **not** a pixel copy of the updated canonical board: its
composer already has the “Add template” pill but with the **old ghost styling** (no fill,
8 % border, radius 100 — `28616:59343`). It is an intermediate the designer left behind.
Implement the page from `28364:40053`, the popup from this board.

### 1.1 The scrim

| Property | Value |
|---|---|
| Node | `28616:59963`, (0, 0) 1656 × 1197 |
| Fill | **`rgba(0, 0, 0, 0.5)`** — raw value, not a token (from `get_design_context`) |
| Radius / border / blur | none |

So the popup scrim is **50 % black**, while the domain checkout sheet (`DomainModal`)
uses 70 % black (`CLAUDE.md`). Two scrim strengths now exist in the product — flagged in
§10. What the 16 px sliver around the sheet shows: the dimmed Home page — near-black at
the top, the dimmed magenta/blue hero glows at the bottom corners. Expected composited
values (arithmetic from `figma-spec.md`’s hero samples × 0.5, not new measurements):
bottom-left `#b055d8` → ≈ `#582a6c`, bottom-right `#2f4fc0` → ≈ `#182860`, top corners
≈ `#060609`.

### 1.2 The sheet

`Frame 1228852209` `28626:533` (full-board wrapper) → **`Frame 1228852208` `28626:534`
— the sheet.**

| Property | Value |
|---|---|
| Position / size | **(16, 16), 1624 × 1164** → a uniform **16 px inset** from all four board edges (1656 − 16 − 16 = 1624; 1196 − 16 − 16 = 1164) |
| Fill | **`Gray/900` → `#18181b`** — the builder-shell background colour; already in the prototype as `gray-900` |
| Radius | **16** |
| Border / shadow | **none** (no border, box-shadow or blur classes on the root) |
| Overflow | clipped |
| Content column | `Sections` `28626:537` (0, 0) 1624 × 1107 → `Webites` `28626:538` **(32, 0) 1560 × 1083** — **32 px side insets**, 24 px slack below the grid inside `Sections` |

Compare the page itself: the hero panel is an 8 px inset with r ≈ 20; the sheet is a
16 px inset with r 16. Same family, one step heavier.

### 1.3 Vertical rhythm of the sheet (y from the sheet’s top edge)

| From → to | Height | What |
|---|---|---|
| 0 → 57 | 57 | `Header` `28626:540` padding-top |
| 57 → 79 | 22 | **heading** (cap-trimmed box, 431 wide, centred) |
| 79 → 119 | 40 | `Header` padding-bottom |
| 119 → 135 | 16 | `Tabs Alt` padding-top |
| 135 → 171 | 36 | **filter chips row** |
| 171 → 203 | 32 | `Tabs Alt` padding-bottom |
| 203 → 475 | 272 | grid row 1 |
| 475 → 507 | 32 | row gap |
| 507 → 779 | 272 | grid row 2 |
| 779 → 811 | 32 | row gap |
| 811 → 1083 | 272 | grid row 3 |
| 1083 → 1164 | **81** | empty sheet (24 px of `Sections` slack + 57 px of sheet below it) |

**The third row is NOT cut by the sheet edge.** All 18 cards are fully inside, with 81 px
of clear ground below — the board is drawn as if the library fits. No scrollbar, no edge
fade, no cut card hints at scrolling. 18 cards obviously isn’t the whole library, so the
sheet almost certainly scrolls vertically — but that is **inference**; nothing is drawn
(§10.3). If it scrolls, use `ScrollArea` per house rule.

---

## 2. Close button

`Buttons` `28633:14900` — a 56 × 56 corner frame at sheet (1568, 0), i.e. flush with the
sheet’s top-right corner; `padding: 16px 16px 0 0` inside it.

| Property | Value (`Close M` `28633:14905` → `state-layer` `28633:14906`) |
|---|---|
| Visual box | **40 × 40** at sheet **(1568, 16) → (1608, 56)** — **16 px from the sheet’s top edge, 16 px from its right edge** |
| Shape | **radius 12** (rounded square — *not* a circle; matches the Build button’s r 12, not the composer circles) |
| Fill | `Black/500` → **`#09090b7a`** (48 % black) |
| Backdrop | **`backdrop-filter: blur(16px)`** |
| Border | **1 px solid** `Neutral Alpha/200` → **`#ffffff1f`** (12 % white in dark; the reference code’s `rgba(9,9,11,.16)` is the light-theme trap) |
| Glyph | `Icon` `28633:14907`, **24 × 24**, centred (8 px inset); a plain **✕**; colour `Icon/Default/Default` → **`#ffffff`** |
| Interactive | exported as `<a cursor-pointer>` |

🛠 **Correction 26.08.2026 to the Border row:** the stroke is not a flat 12 % — it is a
LINEAR GRADIENT on `state-layer` `28633:14906`, top-left → bottom-right (SVG handle line
(0,0)→(40,40)): **12 % → 4 % (at 50 %) → 8 %**, literal stops, 1 px inside. The flat read
was the export flattening the gradient. Canon: `design-system.md` § «Liquid Glass»
(`.liquid-glass--dim`).

Hidden alternates parked in the same corner frame: `28633:14904` — a 32 × 32 `Close M`
(smaller size), and `28633:14901` `Buttons` (207 × 40, hidden) — an icon button 40 × 40
(fill `Neutral Alpha/100`, radius 10) **plus a white CTA button 148 × 40** (fill
`Background/Neutral/950` → dark `#fafafa`, radius 10, label **`Add an object`** — a stock
component default string, not copy). Evidence the designer considered a primary action in
the sheet’s corner; currently switched off (§10.12).

---

## 3. Heading

`Header` `28626:540` (564.5, 0) 431 × 119 inside the 1560 content column — horizontally
**centred** (564.5 + 431/2 = 780 = 1560/2).

| Property | Value |
|---|---|
| Node | `28626:542`, box 431 × 22 |
| String (verbatim) | **`Pick a template. We'll remix it`** |
| ⚠️ Copy details | **No trailing period** — the README’s recommended candidate was «Pick a template. We'll remix it.» *with* one, and the hero headline pattern (`Describe it.` / `Remixer builds it.`) ends each half with one. And the apostrophe is a **straight `'` (U+0027)** — the composer placeholder uses the typographic `’` (U+2019). Both look like accidents; flagged §10.1. |
| Font | **Gilroy SemiBold**, **32 px**, line-height **1.4**, `text-box-trim: both / cap alphabetic` (→ the 22 px box), `white-space: nowrap`, centred |
| Colour | **`#ffffff`** (literal, matching the dock’s `Templates` heading which is also literal white) |
| Position | cap-top at **sheet y = 57** |

This is **the dock’s `Templates` heading style verbatim** (`figma-spec.md` §7.3) with new
copy. A hidden second line `Templates` (`28626:543`, squashed to 68 × 5) is parked under
it inside the same `Text` wrapper (gap 32) — remnant, off.

---

## 4. Filter chips row

`Tabs Alt` `28626:583` — (0, 119) **1560 × 84**, full content width;
`display:flex; flex-direction:column; align-items:center; padding: 16px 8px 32px 16px`
(top / right / bottom / left). `Tab group` `28626:584` — **707 × 36** at (430.5, 16),
`display:flex; gap:8px`.

**Same component, same labels, same order, same widths, same active chip as the dock’s
row** (`figma-spec.md` §7.3 — `Tab Alt (Dark theme)`, inner component ids `19656:66917`
active / `19656:66826` default are identical):

| # | Node | Label (verbatim) | Width | State |
|---|---|---|---|---|
| 1 | `28626:585` | `All templates` | 112 | **active** |
| 2 | `28626:586` | `Ecommerce` | 105 | default |
| 3 | `28626:587` | `Portfolio` | 86 | default |
| 4 | `28626:588` | `Business & services` | 151 | default |
| 5 | `28626:589` | `Health And Beauty` | 146 | default |
| 6 | `28626:590` | `More` | 67 | default |

Chip style (unchanged from §7.3, restated): height 36, radius 999, `padding: 0 18px`,
label Proxima Nova Semibold **13 px** / 1.4, cap-trimmed. Active: fill
`Background/Neutral/900` → **`#f7f7f7`**, label `Text/Default/On Default` → **`#09090b`**,
no border. Default: no fill, **1 px** `White/200` → **`#ffffff1f`**, label
`Text/Default/Default` → **`#ffffff`**.

**Differences vs the dock’s row — layout only:**

| | Dock (`28376:43912`) | Popup (`28626:583`) |
|---|---|---|
| Alignment | right-aligned in the Title row, next to the heading | **own row under the heading, centred** |
| Padding | 16 / 8 / 16 / 16 | 16 / 8 / **32** / 16 |
| Row height | 68 | 84 |

⚠️ **The chip group is 4 px right of true centre.** `items-center` centres it inside the
padding box, and the padding is asymmetric (left 16 / right 8): group centre = 784, row
centre = 780 (metadata: x = 430.5 + 707/2 = 784). The asymmetric padding is inherited from
the dock component, where it never mattered because that row was right-aligned. Almost
certainly an accident — ship truly centred, flag §10.4.

Centring rule as drawn: the chips do **not** hug the grid’s left edge (the dock’s rule);
they centre under the heading, popup-search style.

---

## 5. The grid

`Conteiner` `28626:591` (0, 203) 1560 × 880 → three `List` rows `28626:592` / `702` /
`812`, each **1560 × 272**, at y 0 / 304 / 608 → **row gap 32**.

| Property | Value |
|---|---|
| Columns | **6** — cards at x 0 / 265.333 / 530.667 / 796 / 1061.333 / 1326.667 |
| Card size | **233.333 × 272** — derived, not fixed: every card is `flex: 1 0 0`, so (1560 − 5 × 32) / 6 = 233.333. The dock’s 238.667 is the same formula over 1592. |
| Column gap | **32** |
| Row gap | **32** |
| Side margins | 32 (the `Webites` inset, §1.2) |
| Distance from chips row | 32 (the `Tabs Alt` bottom padding) |
| Rows drawn | **3** (18 cards) — third row fully visible, 81 px of sheet below it (§1.3) |

Each row also carries the dock’s hidden parked card sizes (`Website` 640 × 469 ×3 and
374 × 256, all hidden) — dead copies riding along, not states.

### 5.1 Card anatomy — the dock template card, verbatim

The card is **the same `Website` template card as `figma-spec.md` §7.4/§8** (board
`28375:43006`), only narrower (233.333 vs 238.667). Same accidental two-flavour split,
and here the flavours are *mixed within the grid*:

| | Flavour A (3 cards: r1c1, r2c1, r3c6) | Flavour B (the other 15) |
|---|---|---|
| Thumbnail frame height | **216** | **218** |
| Meta bar | 56 (y = 216) | 54 (y = 218) |
| Text block padding / gap | `14px 0 0 4px`, gap **6** | `12px 0 1px 4px`, gap **5** |

Shared card spec (all 18):

| Element | Spec |
|---|---|
| Root | radius **8 / 8 / 16 / 16** (top 8, bottom 16); no fill, no border |
| Thumbnail frame | width 100 %, **radius 8**, `overflow: clip`, gap 10 |
| Thumbnail image | width 100 % at the asset’s intrinsic aspect, radius 8, `object-fit: cover`, **top-anchored** — everything taller than the clip crops at the bottom (exceptions in §6: the two Synco crops) |
| Name | **Gilroy Medium 16 px**, line-height normal, `Text/Default/Default` → **`#ffffff`**, single line with **ellipsis** (`min-w-full; w-min-content; overflow:hidden; text-overflow:ellipsis`) |
| Description | **Proxima Nova Regular 12 px** / 1.4, `Text/Default/Secondary` → **`#ffffff7a`** (48 % white) |
| Kebab | present on **all 18** cards but **`opacity: 0`** — 40 × 40, container radius 10, `padding: 8`, icon 24-box / 20-leaf ⋮. Same ghost kebab as the dock template cards. |

**Diff vs the dock cards: none in style.** Same component family, same type, same ghost
kebab, same 8-radius thumbnails, same flavour accident (the dock had flavour A on card 1
only; the popup has it on the three cards that reuse that exact node lineage). Only two
real deltas: (a) card width 233.333 (container-derived), (b) **thumbnail hairlines** —
see §6: the AURA asset keeps its near-white `#f7f7f7` border from the dock, and the four
square/new assets gained a **1 px `Background/Neutral/100` → `#1f1f22`** border that no
dock card had.

---

## 6. Grid content — all 18 cards in drawn order

Captions repeat **five** name+description pairs (all verbatim from the dock, §8 of
`figma-spec.md`, same truncated `…and funnel`); thumbnails draw from **nine** distinct
assets, rendered as **ten** visually distinct thumbnails (the Synco asset appears in two
crops). Caption ↔ artwork pairing is placeholder-random, as on the dock.

Description strings per caption (identical on every instance):

* `AI Moodboard Canvas` → `Drag-and-drop images with text notes`
* `Homeware store website template` → `Dual-image cards with saved wishlist`
* `Marketing Campaign Hub` → `Launch checklists, UTM links, and funnel`
* `Budget Dashboard` → `CSV import with variance analytics`
* `Fashion Storefront` → `Working cart and stockists directory`

| Row·Col | Card node | Caption | Thumbnail (asset · what it shows) |
|---|---|---|---|
| 1·1 | `28626:593` | AI Moodboard Canvas | **image 383 — Payness fintech** (dock c1 / project card; aspect 1650/1734) |
| 1·2 | `28626:606` | Homeware store website template | **image 381 — AURA supplements** (dock c2; 1898/1918; keeps its 1 px `#f7f7f7` border) |
| 1·3 | `28626:620` | Marketing Campaign Hub | **image 382 — Synco Creative Agency, homepage-top crop** (dock c3 asset, `object-cover` filling the 218 box: “Synco® Creative Agency” headline + right-rail menu + white section start) |
| 1·4 | `28626:633` | Budget Dashboard | **image 387 — WE MAKE MEDIA** (dock c4; 1730/1756) |
| 1·5 | `28626:645` | Fashion Storefront | **frame-fill — ArchiForm architecture** (dock c5; see note below) |
| 1·6 | `28626:658` | AI Moodboard Canvas | **image 379 — Serena wellness** (dock c6; square 2194/2194; NEW 1 px `#1f1f22` border) |
| 2·1 | `28626:703` | AI Moodboard Canvas | **image 386 — NEW: blue social-media SaaS** (1754/1954, 1 px `#1f1f22` border) |
| 2·2 | `28626:716` | Homeware store website template | **image 385 — NEW: heritage food brand** (square 1900/1900, 1 px `#1f1f22` border) |
| 2·3 | `28626:730` | Marketing Campaign Hub | **image 380 — NEW: MineMax crypto/AI dark landing** (square 2274/2274, 1 px `#1f1f22` border) |
| 2·4 | `28626:743` | Budget Dashboard | image 387 — WE MAKE MEDIA (repeat of 1·4) |
| 2·5 | `28626:755` | Fashion Storefront | frame-fill — ArchiForm (repeat of 1·5) |
| 2·6 | `28626:768` | AI Moodboard Canvas | image 379 — Serena (repeat of 1·6) |
| 3·1 | `28626:840` | Marketing Campaign Hub | **image 382 — Synco, giant-wordmark zoom crop** (drawn 233.33 × 156.25 at natural short aspect, background zoomed to a 560 px square anchored top-left ⇒ ≈ 2.4× zoom into nav + giant “Syn” letters + blue 3D wave; **61.75 px of sheet ground shows below it** inside the 218 clip — the dock c3 short-image behaviour) |
| 3·2 | `28626:826` | Homeware store website template | image 381 — AURA (repeat of 1·2, border included) |
| 3·3 | `28626:865` | Fashion Storefront | frame-fill — ArchiForm (repeat) |
| 3·4 | `28626:878` | AI Moodboard Canvas | image 379 — Serena (repeat) |
| 3·5 | `28626:853` | Budget Dashboard | image 387 — WE MAKE MEDIA (repeat) |
| 3·6 | `28626:813` | AI Moodboard Canvas | image 383 — Payness (repeat of 1·1; flavour A card) |

Asset identity with the dock is confirmed by matching intrinsic aspect ratios
(383↔1650/1734, 381↔1898/1918, 382↔1.4933, 387↔1730/1756, 379↔square,
frame-fill↔frame-fill) **and** visually on the board render. Caption counts:
AI Moodboard Canvas ×6, the other four ×3 each.

⚠️ **The Fashion/ArchiForm cards are messy in source:** the `Image` frame paints the
ArchiForm raster as **two identical stacked image fills**, and *also* contains a child
rect (named `image 383`) whose own fill stack is Payness **underneath** ArchiForm on top.
Net visible result: ArchiForm. Don’t reproduce the archaeology — one ArchiForm paint.
(And `get_metadata` hides that child entirely — see the failure-mode note at the top.)

⚠️ The same underlying Synco asset appears as **two different-looking thumbnails**
(1·3 homepage-top vs 3·1 wordmark-zoom). If templates become real data, a “template” must
be an asset, not a crop — §10.8.

### 6.1 The three NEW site designs — redraw notes for `thumbs.tsx`

All colours here are **≈ measured by eye off the MCP render** (no pixel access — proxy).
House rule applies: draw the miniature (background + accent + layout skeleton), no
faces/photos, container-query units.

**image 386 — social-media automation SaaS (light/vivid).** Dominant: saturated azure
ground **≈ `#3b78f6`**. Skeleton: thin white nav (tiny wordmark left, links centre, white
pill CTA right) → centred two-line white headline `A powerful tool to automate your
social media` (the words “social media” in a contrasting serif/italic style) → one short
white subline → two small pill CTAs (white filled + translucent outline) → a **large white
app-dashboard screenshot** with rounded top corners rising from the lower half (left
sidebar, stat cards, a table, small charts; thin dark browser bar on top) → below the
fold a **white band** with near-black centred headline `Engage your audience without
wasting your time`. Character: bright, friendly SaaS.

**image 385 — heritage food brand (warm light + dark-red hero).** Dominant pair: warm
cream **≈ `#f4ecd9`** and deep maroon/oxblood **≈ `#5a1e17`**; accent saffron/mustard
**≈ `#e8a83c`**. Skeleton: cream nav (script logo, links) → maroon hero band: cream serif
two-line headline `A Taste of Tradition, A Promise of Quality`, small body text + round
badge left, and a big **round platter of food on a scalloped mustard placemat** bleeding
in from the right → a thin row of small icons under the hero → cream stats strip with
four maroon serif numerals (`2k · 1k · 99 · 10` + captions) → maroon serif section title
`Discover Our Complete Range` → a 4-tile food-photo gallery. Character: traditional,
editorial, warm.

**image 380 — MineMax crypto/AI landing (dark neon).** Dominant: violet-tinted
near-black **≈ `#0b0912`**; accent electric violet **≈ `#7c4df8`**; secondary deep-violet
panels **≈ `#241541`**. Skeleton: dark nav (wordmark `MineMax`, links, violet pill CTA)
→ tiny violet eyebrow chip → centred white two-line headline `AI Revolutionizing Crypto
Mining` → grey subline + two pills (violet filled, dark outline) → centrepiece: a
**glowing violet orb/emblem with radiating dashes**, flanked by faint circuit-trace lines
→ white line `Ask MineMax` → two rounded deep-violet feature panels at the bottom (orb
icons; right one captioned “Sustainability by Nature”). Character: dark, neon, techy.

For reference, the known repeats (already drawn in `thumbs.tsx` for the dock): Payness
fintech (light, green accents), AURA supplements (sage/olive, dark-green bands), Synco
agency (black, white type, blue 3D wave), WE MAKE MEDIA (sage-to-pale gradient
**≈ `#a9bfae` → `#eef0ea`**, giant white condensed caps + serif “Human”, black
`THIS IS` / boxed `UI/UX` band), ArchiForm (white/light grey, blue-sky building photo),
Serena wellness (sage/cream, closed-eyes portrait — drawn as abstract block per house
rule).

---

## 7. Composer diff vs `figma-spec.md` §5 (board `28364:40053`)

### 7.1 What changed

**(a) New left-group structure.** `Buttons` `28364:40224` (944 × 36 at y 86, `pl 16`,
`justify-between` — unchanged) now opens with **`Left` `28616:58687`** — (16, 0) 167 × 36,
`display:flex; gap:8px; align-items:center`. It replaces the old `Edition buttons`
`28364:40225` (gap 4); the old `AI Chat icon button` wrapper `28364:40226` is gone from
the tree — the `+` `container` `28364:40227` now sits directly in `Left`.

**(b) The “Add template” pill — new, spec:**

| Property | Value |
|---|---|
| Nodes | `container` **`28616:58682`** → `state-layer` `28616:58683` (0, 3.5, 123 × 29) → label `28616:58693` |
| Box | **123 × 36** at (44, 0) in `Left` → **8 px right of the `+`**; left edge at field x = 60, right edge at field x = 183 |
| Radius | **999** |
| Fill | `Black/700` → **`#09090ba3`** (64 % black) |
| Backdrop | **`backdrop-filter: blur(16px)`** |
| Border | **1 px solid** `Neutral Alpha/300` → **`#ffffff3d`** (24 % white; the reference code’s `rgba(9,9,11,.24)` is the light trap) |
| Padding | `state-layer`: `padding: 6px 20px; gap: 6` → label box 83 × 17 at (20, 9.5) — 20 px symmetric side padding, vertically centred |
| Label (verbatim) | **`Add template`** |
| Label font | **Proxima Nova Regular, 14 px**, line-height normal, `text-align:center`, `white-space:nowrap` — ⚠️ *Regular*, not the `Label Medium Strong` Semibold used by Build and the chips |
| Label colour | `White/900` → **`#ffffffcc`** (80 % white) |
| Icon | a **hidden 24 × 24 leading-icon slot** `28616:58684` at (6, 6) — designed but switched off; glyph not recoverable (SVG URL proxy-blocked). With it off, the layout is text-only. |
| Interactive | exported as `<a cursor-pointer>` — it carries a link/prototype interaction |
| Right of the pill | nothing until the right group — the row is `justify-between`; at the drawn 960 width the mic’s left edge sits at field x = 806, i.e. **623 px of empty field** after the pill |

**(c) Glass restyle of the three round controls.** All three now share one recipe —
fill `Black/700` `#09090ba3` + `backdrop-blur(16px)` + 1 px `Neutral Alpha/300`
`#ffffff3d`:

| Control | Was (§5.3) | Now |
|---|---|---|
| `+` `28364:40227` | fill none, 1 px `#ffffff14` (8 %), r 100 | **glass recipe**, r 999, 36 × 36, icon 24 unchanged |
| “Add template” `28616:58682` | — (didn’t exist) | **glass recipe**, r 999 |
| Mic `28364:40234…40237` | fill none, 1 px `#ffffff14`, border on `container` | **glass recipe** moved onto the `state-layer` `28364:40236` (r 999); `container` `28364:40235` keeps r 100 + clip; geometry unchanged (36 circle, 24-box/20-leaf icon) |

This is the **builder composer recipe** (`CLAUDE.md`: «кружки … `rgba(9,9,11,.64)` +
рамка 24 %») — the two composers now match. Note the home field itself stays `Black/900`
80 % (the builder field is `rgba(9,9,11,.8)` too — already aligned).

🛠 **Correction 26.08.2026 to (b) Border and the (c) recipe: the borders are GRADIENT
strokes, not flat.** Read off the stroke paints themselves (Plugin API + node SVG
export): the `+` and mic carry a top-left → bottom-right linear gradient
`Neutral Alpha/300 → 50 → 300` = **24 % → 4 % → 24 %** (handle line = the normalized
box diagonal, i.e. exactly CSS `to bottom right`); the pill carries **20 % → 5 % → 15 %**
with literal stops — confirmed against the designer’s own gradient-editor screenshot,
26.08.2026. The “1 px solid `Neutral Alpha/300`” rows above are what
`get_design_context` reports after flattening the gradient to its first bound variable —
the same failure family as the light-theme trap. The home field’s own 8 % stroke IS
genuinely flat (it also parks an *invisible* pink→purple gradient stroke — an experiment,
node name `Input field gradient`; do not ship). Canon + implementation:
`design-system.md` § «Liquid Glass — кнопки и контролы», `index.css`
`.liquid-glass--control` / `--pill`.

### 7.2 What did NOT change (verified, don’t churn)

* **The field** `28364:40219`: 960 × 138, fill `Black/900` `#09090bcc`* (80 % black),
  1 px `Neutral Alpha/100` `#ffffff14`, radius 32, blur 16, shadow
  `0 16px 80px rgba(0,0,0,.08)`, padding 17/16/16/0, gap 17. (*token dark value; the
  drawn rgba is `rgba(9,9,11,.8)`.)
* **Text row** `28364:40220`: caret 1 × 17 at x 24 (pt 5), placeholder
  **`e.g. Bella’s Bakery`** (typographic `’`), PN Regular 16/26, dark colour `#c7c7cd`,
  still with the phantom second paragraph (row 52 = 2 × 26).
* **Build — all three stacked states**, geometry 86 × 36 at x 52, r 12,
  `padding 10 6 10 18`, gap 6, 24 px ↵, labels all `Build`:
  idle (visible `28364:40242`) fill `Neutral Alpha/100` `#ffffff14`, label
  `Neutral Alpha/300` `#ffffff3d`; enabled (hidden `28364:40238`) fill
  `Background/Neutral/950` → **`#fafafa`**, label `Text/Default/On Default` →
  **`#09090b`**; third (hidden `28364:40246`) fill `Background/Neutral/850`
  (dark unresolved), label `Gray/600` `#52525b`. **No “Remix” label state exists
  anywhere.**
* Right group `28364:40232`: gap 16, at x 806, right edge 16 px inside the field.
* Hidden alternates unchanged: `AI Chat Button` 65 × 32, `Icon button` 40 × 40 (x 231),
  mic 32 × 32.
* **Prompt-chip row** `28364:40319`: all 9 chips, widths, the end-cap chevron **and the
  hard-coded `rgba(40,56,107,0) → #283a71` fade rectangle `28364:40378`** — all exactly
  as in §6 of the main spec (the mask-not-plate decision stands).
* Hero container `conteiner` `28364:40215` at (324, ≈454): rhythm unchanged
  (36 → composer 138 → 24 → chips 42).

### 7.3 Board drift (say-so-explicitly list)

| Board | Composer state |
|---|---|
| `28364:40053` canonical | **new**: glass buttons + pill (`28616:58682+`) — build this |
| `28616:59168` popup board (under scrim) | intermediate: pill present (`28616:59343`, r 100) but ALL left/right round controls still ghost (no fill/blur, 8 % border) |
| `28375:43006` Templates dock | **old**: `Edition buttons` wrapper, ghost `+` (no fill, 8 % border), **no pill** (verified `28375:43176`) |
| `28364:39116` superseded | not re-read; superseded stays superseded |

### 7.4 Attached-template state — not drawn *(ИСТОРИЯ — отменено §13, 26.08.2026)*

> ⚠️ **Этот раздел устарел 26.08.2026.** Дизайнер нарисовал прикреплённое состояние —
> борд **`28726:64760`**, спека **§13**: это ПЛИТКА-превью в новой верхней строке поля,
> а пилюля «Add template» остаётся на месте. Чип-вместо-пилюли из этого раздела был
> нашим предложением, он собран не был… точнее, был собран 25.08 и снят 26.08 —
> запись оставлена как история решения (правило аддитивности базы знаний).


**No attached state exists on either board or in any hidden layer**: no chip-with-
thumbnail in the composer, no ✕-dismiss, no `Remix` Build label, no filled-composer
state. The only latent affordance is the pill’s hidden 24 px leading-icon slot. The
README §7 proposal (chip with mini-thumbnail + ✕; Build → «Remix» while attached)
remains a proposal the implementer should mock for the designer — recorded as open
question §10.2.

---

## 8. Hidden layers & neighbouring states (popup board)

Hidden inside the sheet/board (tool-verified):

| id | Name | Size | What it is |
|---|---|---|---|
| `28626:535` | `Rectangle 1162905190` | 1624 × 768 | full-width plate (copy of the dock’s hidden plate) |
| `28626:536` | `Union` | 2548 × 812 | dot texture, off |
| `28626:544` | `Trustpilot` | 320.8 × 24 | off |
| `28626:577` / `28626:580` | `Tabs (Medium)` / `Tabs (Small)` | 215 × 48 / 211 × 44 | the dock’s segmented tab controls, parked in the popup Title too |
| `28626:543` | `Templates` | 68 × 5 | squashed heading remnant |
| per row | `Website` ×3 640 × 469, ×1 374 × 256 | — | parked card sizes, off |
| per card | alternate `image 38x` rects | — | crop/asset alternates under the visible one |
| `28633:14901` | corner `Buttons` | 207 × 40 | icon button + white `Add an object` CTA (§2) |
| `28633:14904` | `Close M` | 32 × 32 | smaller close |

**No hover state, no pressed state, no selected-card state, no scroll state and no
“template detail” view is drawn anywhere on this board.** Canvas siblings cannot be
enumerated: the MCP still exposes only two pages (`UI Kit` `2:4`, `UI Mockups` `0:1` —
re-verified this session) and these boards live on neither, so if a hover/selected
variant exists on a neighbouring board, it is invisible to me. Ask the designer for the
page (still open as §12.20 of the main spec).

---

## 9. Motion — nothing is drawn; recommendation

The boards carry zero animation intent (no smart-animate variants, no states). Recommend
the house overlay language (`docs/knowledge/design-system.md` §7 / `motion.ts`):

* open with the surface spring (`stiffness 380 / damping 36 / mass 1` — the “large
  surface” tuning), **`transform-origin` at the “Add template” pill** (bottom-left of the
  viewport area) so the sheet grows out of its trigger;
* scrim fades in over the same beat; content (heading → chips → grid) lands **~60 ms
  after the container**;
* exit faster than entry, **0.14 s, no bounce**, origin back toward the pill;
* animate only `transform`/`opacity`; the sheet is a huge surface — no live blur on it
  (the close button’s own `backdrop-blur 16` is fine: 40 px).

---

## 10. Open questions for the designer

1. **Heading copy:** drawn as `Pick a template. We'll remix it` — no trailing period
   (your shortlisted candidate had one, and the hero pattern `Describe it. Remixer
   builds it.` closes both halves) and a straight `'` where the composer placeholder
   uses `’`. Final string?
2. **Attached state:** what does the composer look like once a template is picked?
   Nothing is drawn. Proposal on the table (README §7): chip with mini-thumbnail + ✕ in
   the composer, Build relabels to `Remix` while attached. Implementer will mock it —
   confirm or redraw.
3. **Does the sheet scroll?** The third row fits fully with 81 px to spare, and no cut
   card / scrollbar / fade is drawn. 18 cards can’t be the whole library — assume
   vertical scroll inside the sheet (house `ScrollArea`)?
4. **Chip row is 4 px off centre** (asymmetric 16/8 padding inherited from the dock
   component). Accident? Will ship truly centred unless told otherwise.
5. **Filter chips still filter nothing:** no card carries a category (same as the dock,
   main spec §12.13) — now across 18 cards. Which template belongs to which chip, and
   what does `More` open?
6. **Card copy is placeholder filler:** five caption pairs recycled over 18 cards,
   caption ↔ artwork mismatched everywhere (e.g. `Budget Dashboard` over the WE MAKE
   MEDIA agency site), `Homeware store website template` is the odd literal name, and
   `Launch checklists, UTM links, and funnel` still ends mid-phrase. Real names/
   descriptions?
7. **Thumbnail hairlines are inconsistent:** AURA keeps its near-white `#f7f7f7` border,
   the four square/new assets (`379/380/385/386`) gained a dark `#1f1f22` border, the
   other three have none. One rule, or per-thumbnail?
8. **Two crops of the same Synco site read as two different templates** (1·3 homepage
   crop vs 3·1 wordmark zoom). When this becomes data: is a template one asset with one
   canonical crop?
9. **The 216/56 vs 218/54 card-flavour accident** from the dock is carried over onto
   three cards. Normalize to one (the prototype already normalizes)?
10. **Scrim strength:** popup scrim is 50 % black; the domain checkout sheet uses 70 %.
    One standard? (Also: the drawn scrim is 1197 tall on a 1196 board — 1 px overshoot,
    assumed accident.)
11. **Which surfaces get the new composer?** Only `28364:40053` has the glass buttons +
    pill; the Templates-dock board and the builder-shell composer still show the old
    ghost style. Do the sibling home states — and the builder composer — get the pill
    too? (Glossary note also stands: domain vocabulary defines **Add = buy**; `Add
    template` is fine while templates are free, ambiguous if a paid marketplace ever
    appears.)
12. **Hidden corner CTA:** an icon button + white `Add an object` button is parked
    hidden next to the close — dead layers, or a planned primary action in the sheet?
13. **Popup at other viewports:** the sheet is drawn once at 1656 × 1196. Does the 16 px
    inset hold everywhere (like the hero’s 8 px), and does the grid drop columns like
    the dock’s flex row, or scroll?
14. **The pill’s hidden leading icon** — if it ever switches on, which glyph?

---

## 11. Node-id quick reference

Popup: board `28616:59168` · scrim `28616:59963` · sheet `28626:534` · content column
`28626:538` · header `28626:540` · heading text `28626:542` · chips row `28626:583` ·
grid `28626:591` · rows `28626:592/702/812` · close `28633:14905` · new thumbnails
`28633:14911` (386) / `28633:14915` (385) / `28633:14917` (380).
Composer (canonical board): row `28364:40224` · Left `28616:58687` · pill
`28616:58682` · pill label `28616:58693` · `+` `28364:40227` · mic `28364:40234` ·
Build idle/enabled/third `28364:40242/40238/40246`.

---

## 12. § Detail view — board `28637:42088`

Captured **25 Aug 2026** (a later session than §§1–11), same toolchain: `get_metadata`,
`get_design_context`, `get_variable_defs`, `get_screenshot enableBase64Response` — the
proxy still 403-blocks every direct figma.com fetch, so the two icon SVGs (back arrow,
the pill's `Add` glyph) could not be exported and are redrawn by hand in the prototype's
icon set, like every other icon (`CLAUDE.md`).

| Board | id | Size | Canvas x, y | What it shows |
|---|---|---|---|---|
| Template detail | **`28637:42088`** | 1656 × 1196 | −2370, 2610 — same row as the picker board (`28616:59168` at −4385, 2610), 2015 px to its right | The same 16 px-inset sheet, now showing ONE template: a 72 px header strip (back ← · template name · white `Choose a template` pill · the usual ✕) over a full-bleed site preview cropped by the sheet's bottom edge |

Also named **“Domain-Only Customer”**. Under-scrim page: same stale-intermediate composer
as the picker board (§7.3) — not a source. The popup layer is `28637:42853` → sheet
**`28637:42854`** (16, 16) 1624 × 1164, radius 16, `Gray/900` `#18181b` — byte-identical
sheet spec to §1.2. Scrim `28637:42852`: 1656 × **1197**, 50 % black — the same 1 px
overshoot accident as §1.1.

The drawn template is the **AURA** asset (`image 381`) under its list caption
**`Homeware store website template`** — i.e. the picker's card 1·2 opened. One board
covers one card; the per-card generalization (same layout, any template) is ours.

### 12.0 ⚠️ 26.08.2026 — дизайнер переработал бар (ЧИТАТЬ ПЕРВЫМ)

Снято тем же тулчейном (`get_metadata` + `get_design_context` + `get_variable_defs` +
`get_screenshot enableBase64Response`; figma.com у прокси по-прежнему 403 — проверено
ещё раз, `connect_rejected` в его логе). Дизайнер: «поменял там размеры, отступы,
цвета». Бар **сжат на одну ступень**, CTA стал **синим**. Числа §12.1/§12.2 ниже —
ИСТОРИЯ (версия 25.08); канон — эта таблица.

| Элемент | 25.08 (было) | 26.08 (стало) | Δ |
|---|---|---|---|
| Бар `28637:43245` | (0,0) 1624 × **72** | (0,0) 1624 × **64** | −8 |
| Раскладка ряда | `gap 16; padding 16 16 16 0; justify-end` | `gap 16; padding` **`12 12 12 0`**`; justify-end` | py/pr 16→12 |
| Обёртка ← `28640:43368` | (0,16) 48 × **40**, `pl 16` | (0,16) 48 × **32**, `pl 16` | −8 |
| Кнопка ← `28640:43362` | 32 × 32 @ (16, **20**) | 32 × 32 @ (16, **16**) | y −4 |
| ← радиус / state-layer / глиф | 8 / p4 / 24 | 8 / p4 / 24 | **без изменений** |
| ← цвет | `Icon/Default/Default` #ffffff | то же | **без изменений** |
| Центр-контейнер `28641:43374` | (64, **16**) **1488** × 40 | (64, **12**) **1496** × 40 | y −4, w +8 |
| Группа `Name + Category` `28640:43353` | (**497**, 0) **494** × 40, gap 32 | (**517.5**, 0) **461** × 40, gap 32 | w −33 |
| Центр группы (x шита) | **808** — 4px левее центра | **812** — точно центр | ⚑ **случайность 4px ИСПРАВЛЕНА в макете** |
| Тайтл `28640:43354` | **284** × **13** @ (0, 13.5), Gilroy Medium **18** | **252** × **11** @ (0, 14.5), Gilroy Medium **16** | −2 pt |
| Тайтл: цвет / trim / ellipsis | #ffffff, trim-both cap-alphabetic, nowrap + ellipsis, по центру | то же | **без изменений** |
| Пилюля `28641:43375` | **178** × 40 @ (**316**, 0) | **177** × 40 @ (**284**, 0) | w −1 |
| Компонент пилюли | `Filled, Icon=Right, Size=Medium, Color=`**`Dark`**`, Shape=Square` (`70:448`) | то же, но `Color=`**`Blue`** (`70:464`) | ⚑ **свап варианта** |
| Заливка пилюли | `Background/Neutral/950` → **#fafafa** | `Background/Blue/Default` → **#1587ff** | ⚑ **это наш action-blue** |
| Пилюля: радиус / высота | 10 / 40 | 10 / 40 | **без изменений** |
| State-layer пилюли | `p 10 8 10 20; gap` **8** | `p 10 8 10 20; gap` **7** | gap −1 |
| Лейбл пилюли | PN Semibold 14, `Text/Default/On Default` **#09090b**, бокс 118 | PN Semibold 14, `Text/Default/`**`White`** **#ffffff**, бокс 118 | ⚑ инверсия |
| Глиф `Add` | 24-бокс, `Icon/Default/On Default` #09090b | 24-бокс, `Icon/Default/`**`White`** #ffffff | ⚑ инверсия |
| ✕ `28640:43357` | **40 × 40** @ (**1568**, **16**) | **36 × 36** @ (**1576**, **14**) | −4; правый инсет 16→**12** |
| ✕ радиус | **12** | **10** | −2 |
| ✕ заливка / блюр / строук | `Black/500` #09090b7a / blur 16 / 1px `Neutral Alpha/200` | те же три токена | **ПЛАСТИНА СОХРАНИЛАСЬ** |
| ✕ бокс глифа | 24 @ инсет **8** | 24 @ инсет **6** | инсет −2 |
| Сцена `Sections` `28637:42857` | (0, **72**) 1624 × **1092** | (0, **64**) 1624 × **1100** | следует за баром |
| Сцена: боковые поля / низ / клип | px-4 / вплотную / 8 8 0 0 | то же | **без изменений** |
| Обод `Conteiner` `28637:42911` | 1px `Gray/800` → **#27272a** | 1px `Gray/750` → **#33333a** | ⚑ на ступень светлее |
| Шит `28637:42854` | (16,16) 1624 × 1164, r16, `Gray/900` #18181b | то же | **без изменений** |
| Скрим `28637:42852` | 1656 × **1197**, 50% чёрного | то же (та же 1px-случайность) | **без изменений** |
| Вестигиальные `backdrop-blur 16` + r16 на `Sections` | есть, не копируем | есть, не копируем | **без изменений** |
| Волосок ассета AURA | `Background/Neutral/900` #f7f7f7 | то же (не копируем) | **без изменений** |
| Hover / pressed / focus | не нарисованы | не нарисованы (грепнут ВЕСЬ борд — ни одного слоя) | **без изменений** |

Вся вертикаль — **производная от `py-12`**, а не авторская: 32-высокий ← даёт
y = 12 + (40−32)/2 = **16**, 36-высокий ✕ даёт y = 12 + (40−36)/2 = **14**,
40-высокая группа — y = **12**. И зоны ряда стали симметричными: слева 48 + 16 = **64**,
справа 16 + 36 + 12 = **64** — отсюда точный центр 812.

**⚑ Синий — ровно наш action-blue.** `Background/Blue/Default` в ТЁМНОЙ теме =
**`#1587ff`**, то есть буква в букву `--action` прототипа (verified бренд-правило
«синий #1587FF = действие»). Светлый фолбэк экспорта — `#0073ec`, и это НЕ новый цвет:
у нас он уже живёт как `--action-pressed`, и это же тот оттенок, которым продакшен
красит Publish. Ещё одно попадание в правило «токены Figma читать в тёмной теме».

**⚑ Пластина ✕ НЕ исчезла.** Сырые пейнты `28640:43358` — те же `Black/500` + `blur 16`
+ `Neutral Alpha/200`; изменились только бокс (40→36) и радиус (12→10). Проверено
пиксельно на собранном баре: (16,16,19) — это ровно 48% `#09090b` поверх `#18181b`.
Строук экспорт снова отдаёт плоскими 12% — то самое расплющивание градиента, поправка
под §2 (12 → 4 → 8% TL→BR) остаётся в силе.

**⚠️ Конфликт двух бордов.** Дизайнер тронул ТОЛЬКО этот борд: на борде списка
(`28633:14905`, §2) тот же самый физический ✕ по-прежнему нарисован **40 × 40 / r12 /
(16, 16)**. В прототипе это ОДИН элемент, живущий в шите и обслуживающий оба вида.
Собрано по НОВЫМ числам в обоих видах (§12.6-Q9): один неподвижный ✕ лучше двух
размеров, из-за которых он ездил бы на 6px при каждом открытии, а «моушен, которого
борд не рисует» — ровно урок откатанного блика (17.08.2026).

**⚠️ `gap: 7`** в state-layer пилюли — не ошибка чтения: `get_design_context` отдаёт 7,
и нарисованная ширина подтверждает независимо (177 = 20 + 118 + **7** + 24 + 8; было
178 при gap 8). Но 7 не из шкалы системы — вероятная случайность кита, поднято
дизайнеру (§12.6-Q10). Собрано как нарисовано.

**Что это стоило морфу** (пересчитано и перепроверено, `scratchpad/qa11/`): цель полёта
сцены `dy` = y миниатюры − **64**; `sy` = h миниатюры / (h шита − **64**); лента
✕-пластины — `scaleY` **64/36 = 1.7778** и `scaleX` (W − 2 × **12**)/**36**. Инвариант
жив: центр пластины 14 + 18 = **32** = центр бара, поэтому ленте по-прежнему не нужен
вертикальный сдвиг. Замерено: первый нарисованный кадр клона = rect карточки до
**1e-4 px**, посадка сцены = **(4, 64) 1616 × 1100**, посадка ленты = **(12, 0)
1600 × 64** — оба ровно в цель.

---

### 12.1 Header strip — `Buttons` `28637:43245` (версия 25.08 — ИСТОРИЯ)

🛠 **Числа этого раздела заменены §12.0 (26.08.2026).** Ниже — как бар был нарисован
до переработки; сохранено по аддитивному правилу базы знаний: разница «было → стало»
сама по себе информация.


(0, 0) **1624 × 72** on the sheet's own ground (no fill, no hairline, no shadow —
the board draws **no visible bar**). Layout: `flex; gap: 16px; padding: 16px 16px 16px 0;
justify-content: flex-end` — three zones:

| Zone | Node | Geometry (sheet-local) | Spec |
|---|---|---|---|
| Back | wrapper `28640:43368` (0, 16) 48 × 40, `pl 16` → `Icon button` **`28640:43362`** | **32 × 32 at (16, 20)** — vertically centred in the 72 | Component `Style=Standard, Shape=Square, Size=Small` (`889:7322`): container **radius 8**, state-layer `padding 4`, icon **24 × 24**. No fill until interaction (per the component's own doc: “Until the button is interacted with, its container isn’t visible”). Glyph: a plain **←**; colour `Icon/Default/Default` → **`#ffffff`** |
| Title + CTA | flex-1 container `28641:43374` (64, 16) 1488 × 40 → group `Name + Category` `28640:43353` (497, 0) **494 × 40**, `gap: 32` | group centred in the container | see below |
| Close | `Close M` `28640:43357` → state-layer `28640:43358` | **40 × 40 at (1568, 16)** — 16 from top, 16 from right | **identical to §2**: radius 12, `Black/500` `#09090b7a`, `backdrop-blur 16`, 1 px `Neutral Alpha/200` → **`#ffffff1f`** (the reference code's `rgba(9,9,11,.16)` is the light trap again), white ✕ 24-box |

🛠 26.08.2026: the close's “1 px 12 %” is a flattened read — the stroke is the 12 → 4 →
8 % TL→BR gradient; see the correction under §2.

**Title** `28640:43354` — box 284 × 13 at group (0, 13.5):

| Property | Value |
|---|---|
| String | the template's name — here verbatim **`Homeware store website template`** |
| Font | **Gilroy Medium, 18 px**, line-height normal, `text-box-trim: trim-both / cap alphabetic` (→ the 13 px cap box), `white-space: nowrap` **+ `text-overflow: ellipsis`** (truncation is drawn in!), centred |
| Colour | `Text/Default/Default` → **`#ffffff`** (dark; the reference code's `#09090b` is the light trap) |

A new type tier: the card name is Gilroy Medium 16, the sheet heading Gilroy SemiBold 32 —
this title sits between them at Medium 18. Hidden right of it: the template's
*description* (`28640:43355`, `Dual-image cards with saved wishlist`, squashed 193 × 4) —
parked off; the header carries the name only.

**`Choose a template` pill** `28641:43375` — **178 × 40** at group (316, 0), i.e. **32 px
right of the title**:

| Property | Value |
|---|---|
| Component | `Style=Filled, Icon=Right, Size=Medium, Color=Dark, Shape=Square` (`70:448`) — the high-emphasis “final action” button of the kit |
| Box / radius | height **40**, **radius 10** (not the pill-999 of the composer, not the r12 of Build/✕) |
| Fill | `Background/Neutral/950` → **`#fafafa`** (dark) — **the Build-enabled recipe** (§7.2) |
| State-layer | `padding: 10px 8px 10px 20px; gap: 8` → label then icon |
| Label (verbatim) | **`Choose a template`** — `Label Medium Strong`: **Proxima Nova Semibold 14 px**, line-height 100 %, `Text/Default/On Default` → **`#09090b`**; drawn label box 118 × 14 |
| Icon | `Add` — a **+** in a 24 × 24 box right of the label, `Icon/Default/On Default` → `#09090b` (SVG proxy-blocked; redrawn) |
| Hover/pressed | **not drawn** — no other state of this button exists on the board |

⚠️ **The title+pill group is 4 px left of true sheet centre**: the flex row gives the
centre container 64 px on the left (48 back-zone + 16 gap) but 72 on the right (16 gap +
40 close + 16 padding), so the group centre lands at sheet x 808 vs the sheet's 812.
Same accident family as the chip row's 4 px drift (§4/§10.4) — shipped **truly centred**,
flagged (§12.6-Q1).

Hidden in the header, same parked alternates as §2: `28637:43246` (icon button + 148 × 40
white CTA `Add an object`) and a 32 × 32 `Close M` `28637:43249`.

### 12.2 The stage (site preview) — геометрия обновлена в §12.0

🛠 **26.08.2026:** верх сцены **64** (не 72), высота **1100** (не 1092), обод
**`Gray/750` → #33333a** (не `Gray/800` → #27272a). Всё остальное здесь — в силе.


`Sections` `28637:42857` (0, **72**) 1624 × 1092 → `Webites` `28637:42858` (4, 0)
1616 × 1092 → `Conteiner` `28637:42911` (0, 0) 1616 × 1092 → `List` `28637:42912` (1, 1)
1614 × 1090 → `Website` `28637:42926` → `Image` `28637:42927` (0, 0) 1614 × 1090 →
**`image 381`** `28637:42930` (0, 0) **1614 × 1631.008** (the AURA raster at its intrinsic
1898/1918 aspect, `object-fit: cover`, top-anchored).

Net drawn geometry, sheet-local:

| Property | Value |
|---|---|
| Stage box | **(4, 72) → (1620, 1164)**: side margins **4 px** (the `Sections` `px-4`), top edge at **72** (the header height), bottom edge **flush with the sheet's bottom** — NOT ≈20 px margins; the 16 px-radius sheet clip is all that shapes the bottom corners |
| Rim | `Conteiner` is a `Gray/800` → **`#27272a`** plate with **`padding: 1px`** — reads as a 1 px hairline around the preview |
| Clip radius | **8, top corners only** (`Webites` `overflow-clip; border-radius 8 8 0 0`); the inner `Image` frame clips at radius 8 all round, and the `Website` wrapper still carries the card's vestigial 8/8/16/16 |
| The site | width 100 % of the stage (1614), height its own aspect (1631 here) → **cropped by the bottom edge: 541 px of the site is below the fold**. No scrollbar, no fade is drawn — that it scrolls is inference, same as §10.3 |
| Site border | 1 px `Background/Neutral/900` → **`#f7f7f7`** in dark — this is the AURA asset's own near-white hairline from the dock cards (§5.1) following the asset into the detail view, not a stage rule. The prototype draws no per-asset hairlines on cards (§10.7 open) and none here — the `#27272a` rim is the stage's frame |

⚠️ **Vestigial paint on `Sections`, not copied:** it carries `backdrop-blur 16` and
`border-radius 16 16 0 0` — there is nothing to blur (the sheet behind it is opaque) and
nothing that shows the radius (`Webites` clips tighter inside). A live 1624 px
backdrop-filter is exactly what the perf contract forbids; treated as leftovers.

⚠️ Hidden INSIDE the stage: a 72 px meta bar `28637:42931` (32 px icon button · name +
description · second 32 px icon button — an alternate in-preview header, off), alternate
image rects (`382`, `383`) under the visible `381`, and the dock's parked `Website` card
sizes (640 × 469 ×3, 374 × 256 — one captioned `synco.com · Updated 15 minutes ago`).
The list board's whole `Title` block (heading + chips) is also here, **hidden**
(`28637:42859`) — evidence this board is the picker board mutated in place, i.e. the
detail view replaces the list inside the SAME sheet, which is how the prototype builds it.

### 12.3 Dark-theme variable values used on this board

From `get_variable_defs` on `28637:43245` / `28637:42857` (the authority; reference-code
fallbacks are light-theme): `Text/Default/Default #ffffff` · `Icon/Default/Default
#ffffff` · `Text/Default/On Default #09090b` · `Icon/Default/On Default #09090b` ·
`Background/Neutral/950 #fafafa` · `Background/Neutral/900 #f7f7f7` · `Black/500
#09090b7a` · `Neutral Alpha/200 #ffffff1f` · `Gray/800 #27272a` · `Gray/850 #1f1f22` ·
`Label/Size Base 14` · `Label/Font Family Proxima Nova` · `Label/Font Weight Strong 600`.

🛠 **Добавлено 26.08.2026** (тот же источник, тёмная тема — авторитет):
`Background/Blue/Default` **#1587ff** (светлый фолбэк экспорта #0073ec — ловушка) ·
`Text/Default/White` #ffffff · `Icon/Default/White` #ffffff · `Gray/750` **#33333a** ·
`Neutral Alpha/100` #ffffff14 · `Neutral Alpha/50` #ffffff0a.

### 12.4 What the transition does (not drawn — ours)

The board draws zero motion (one static frame, no variants, no smart-animate). The
implemented choreography — card → detail as one FLIP morph with a nested counter-scale,
the ✕-plate unrolling into the header band, the +60 ms header beat, the reverse flight
landing in the card's current slot — is the designer-briefed spec recorded in
`prototype/src/modules/home/TemplatePicker.tsx` (see the DETAIL VIEW comment block there);
numbers live in code, board-sourced geometry above.

### 12.5 Behaviour wired in the prototype (board-silent, decided by us)

* Clicking a card now opens the detail view; **attach moved to the `Choose a template`
  pill** (the board draws a detail step between card and attach — deliberate change).
  🛠 **С 26.08.2026 то же верно и для карточек ДОКА** — см. §12.5-bis: тот же шит, тот же
  бар, CTA `Remix this template`.
* The preview scrolls inside the stage via the house `ScrollArea` (tone `auto`), enabled
  after the entrance lands. The stage content keeps the CARD's drawn aspect
  (233.333 / 218), so the enlarged render is the same drawing the card showed — and at
  every tested viewport it is taller than the stage, so it always scrolls.
* Esc in detail = back to the list; Esc in the list closes the picker. ✕ and scrim-click
  close the whole picker from either view (the sheet exits showing whatever is on screen).
* Focus: opening detail lands on the back arrow; back returns focus to the opened card;
  Choose runs the existing attach path (focus → composer field).

### 12.5-bis ⚑ 26.08.2026 (вечер) — ЭТОТ БАР ОБСЛУЖИВАЕТ ТРИ ДВЕРИ, и у одной из них
своё слово на CTA

Ответ дизайнера про карточки в доке: «нет, в доке ховера + нет, только открыть превью и там
будет кнопка "Начать из этого тимплейта"». Значит один и тот же нарисованный бар
(`28637:43245`) открывается теперь из трёх мест, и всё, что в нём меняется, — ЛЕЙБЛ пилюли:

| дверь (`ui.pickerSource`) | откуда | CTA | что делает |
|---|---|---|---|
| `pill` | «Add template» → сетка → карточка | **`Choose a template`** | прикрепляет шаблон к промпту (полёт сцена → плитка) |
| `tile` | прикреплённая плитка в композере | `Choose a template` | то же (это превью того, что уже прикреплено) |
| `card` | **карточка в полке дока** | **`Remix this template`** | сеет первое сообщение билдера («Start a new site from the “…” template») и открывает билдер |

Нейминг `Remix this template` — НАШ (делегировано: «сам придумай правильное название кнопки
на английском»), записан в `decisions.md`. Причина, по которой это не то же слово, что в
пикере: прикрепить шаблон к промпту и начать сайт ИЗ шаблона — два разных действия, и одно
слово на двух действиях в одном интерфейсе читается как одно действие. Заголовок пикера уже
говорит «We'll remix it», так что глагол в продукте есть.

Геометрия бара, кит-вариант пилюли, глиф `+` в 24-боксе, ✕, ←, сцена и обод — **без
изменений**: борд рисует один бар, и ответ дизайнера сменил слово, а не вариант кита.
Единственное, чего у двери `card` нет, — сетки под шитом (её незачем рендерить: возвращаться
некуда), поэтому шит на этом пути ФЕЙДИТСЯ, как и на `tile`, а не растёт из пилюли.

### 12.6 Open questions for the designer (detail view)

1. **The title+pill group is 4 px left of sheet centre** (asymmetric 64/72 flex zones) —
   accident? Shipped truly centred, same call as the chip row.
2. **No hover/pressed states** are drawn for the back arrow or the `Choose a template`
   pill. Shipped with the house quiet hovers (icon-button `NA/100` wash; pill darkens a
   step like Build). Confirm.
3. **The stage's site border** resolves to near-white `#f7f7f7` in dark — the AURA
   asset's own hairline (§10.7) riding along. One rule for asset hairlines still needed;
   the stage ships with the drawn `#27272a` rim only.
4. **`Sections` carries a 1624 px `backdrop-blur 16`** with an opaque sheet behind it —
   vestigial? Not copied (perf contract).
5. **The hidden in-stage meta bar** (`28637:42931`: name + two icon buttons INSIDE the
   preview top edge) — dead layer, or a planned overlay state?
6. **Does the preview scroll?** Still not drawn (no bar, no fade, bottom-cropped site
   implies yes). Shipped scrolling, house indicator.
7. **Title overflow**: ellipsis is drawn on the title itself, but at what width does the
   pill/back/✕ collision resolve on narrow sheets? Shipped: title truncates first, pill
   never shrinks.
8. **What does `Choose a template` lead to?** Shipped: the attach-to-composer proposal
   (§7.4/§10.2) — still pending your after-state drawing.
9. **⚑ 26.08: два борда расходятся про ✕.** Этот борд рисует его 36 × 36 / r10 /
   (12, 14); борд списка (`28633:14905`) — 40 × 40 / r12 / (16, 16). В прототипе это
   ОДИН элемент на оба вида. Собрано по новым числам везде (так бар точен, а ✕ никуда
   не ездит). Какой размер канон — или бар списка тоже сжимается?
   ✅ **ОТВЕТ (26.08.2026): 40 × 40, радиус 12.** Тай-брейк дала система, а не борд:
   «у нас в дизайн системе 3 варианта размеров у кнопок: 32 (Small), 40 (Medium),
   48 (Large)» — 36 нелегален, значит это случайность бара. Позиция — **(right 12,
   top 12) в ОБОИХ видах**: бар 64 высотой с `padding 12 … 12`, и 12 + 40 + 12 = 64,
   то есть только top 12 держит центр пластины на центре бара (12 + 20 = 32), а на
   этой тождественности стоит вся раскатка ленты. Цена — 4 px против угла 16/16 на
   борде списка; альтернатива (16/16 в списке, 12/12 в баре) — кнопка, которая
   проезжает 4 px по диагонали на каждом открытии. Пересчитанные производные:
   лента `scaleX` = (1624 − 2 × 12) / 40 = **40.0**, `scaleY` = 64 / 40 = **1.6**,
   правая зона ряда 16 + 40 + 12 = **68** (max-width группы 100 % − 136).
   Замерено на собранном приложении: ✕ (1588, 28) 40 × 40 — одинаково в списке, в
   прокрученном состоянии и в детальном виде; посадка ленты (12, 0) 1600 × 64;
   первый нарисованный кадр морфа = rect карточки **до 0.0000 px**.
10. **⚑ 26.08: `gap: 7`** в пилюле (было 8). Подтверждено дважды — токеном и
   нарисованной шириной 177. Похоже на случайность кита, а не на решение. Оставить 7?
11. **⚑ 26.08: синяя пилюля vs почти-белая кнопка Build** на самой Home (§7.2,
   `#fafafa` + `#09090b`). Теперь на странице два «финальных действия» разной краски:
   Build белый, `Choose a template` синий. Так задумано (белый = «поехали строить»,
   синий = «выбрать») или Build тоже должен стать синим?
   ✅ **ОТВЕТ ДИЗАЙНЕРА (26.08.2026): «да, когда она активна, она синяя».** Активный
   Build = `--action` #1587ff + белый лейбл, hover/press — домашняя рампа
   (`--action-hover` #3d9bff / `--action-pressed` #0073ec), как у всех остальных
   сплошных синих кнопок. НЕАКТИВНЫЙ вид не тронут: призрак 8 % белого + лейбл 24 %.
   Борд 28364:40238 (белая плита) и его hover-пара 40246 (#1f1f22 + #52525b) этим
   перебиты — бренд-правило «синий = действие» выиграло у борда.
   Следствие: пара синий↔призрак НЕ инвертирована, у неё есть читаемая середина
   (замеры — `design-system.md` §5, правило 4б), поэтому отложенная краска Build
   («armed look one beat behind») удалена, и кросс снова едет вместе с движением.

### 12.7 Node-id quick reference (detail board)

Board `28637:42088` · scrim `28637:42852` · sheet `28637:42854` · header `28637:43245` ·
back `28640:43362` (wrapper `28640:43368`) · title `28640:43354` · hidden description
`28640:43355` · pill `28641:43375` · close `28640:43357/43358/43359` · stage chain
`28637:42857` → `42858` → `42911` → `42912` → `42926` → `42927` → image `28637:42930` ·
hidden meta bar `28637:42931` · hidden list-Title `28637:42859`.

---

## 13. § Прикреплённый шаблон в композере — борд `28726:64760`

Снято **26 Aug 2026** (сессия после §12), тот же инструментарий: `get_metadata`,
`get_design_context`, `get_variable_defs`, `get_screenshot` (`enableBase64Response` —
прямые запросы к figma.com по-прежнему 403 через прокси).

Борд: **`28726:64760`**, имя как у всех — `Domain-Only Customer`, канвас **−4385, 3966**
(четвёртый Home-борд, ровно под пикером). Показывает **композер с прикреплённым
шаблоном** — и это ОТМЕНЯЕТ наше предложение из §7.4.

### 13.0 Что борд говорит, и что он отменяет

**Прикрепление — это ПРЕВЬЮ-ПЛИТКА в новой верхней строке поля, а пилюля
«Add template» остаётся на месте.** Никакого чипа вместо пилюли (наша догадка от
25.08.2026, §7.4 — оставлена в записи как история, реализация снята). Поведение
ровно как у вложенной картинки в чат-композере: миниатюра сверху-слева, крестик
на её верхнем-правом углу, поле становится выше.

### 13.1 Геометрия (все числа — из ответов инструментов)

| Узел | id | Бокс | Что это |
|---|---|---|---|
| `Attachments bar` | **`28734:65591`** | (0, 0) **88 × 72**, `pt 16 / px 16` | строка вложений; ширина = ровно один тайл (16 + 56 + 16) |
| `attached template` | **`28734:65592`** | **(16, 16) 56 × 56**, radius **16**, 1 px `rgba(255,255,255,0.1)` | сам тайл |
| `image 381` | **`28734:65593`** | (0, **−0.295**) 56 × **56.59** | миниатюра; аспект 1898/1918, вылезает по 0.3 px сверху и снизу (object-cover) |
| — радиусы картинки | — | `16 / **8** / 16 / 16` (tl/tr/br/bl) | **верхний-правый срезан до 8** — ровно тот угол, где сидит ✕ |
| `Close` | **`28734:65594`** | **(48, −8) 18 × 18**, radius 999 | бейдж ✕; центр (57, 1) — на 1 px ВНЕ угла тайла по диагонали |
| — заливка бейджа | — | **`#1a1222`, непрозрачная** | сырое значение, не токен (см. 13.3) |
| — обводка бейджа | — | 1 px `rgba(255,255,255,0.2)` | плоский экспорт-рид; ставим градиент семейства (13.3) |
| `Frame` (глиф) | **`28734:65595`** | (1, 1) 16 × 16 | ✕; **сам SVG недоступен** (asset-URL режет прокси) |
| `Input field` | **`28726:64923`** | 960 × **184** | было 138 (`28364:40219`) → **+46** |
| `Text` | **`28726:64925`** | (0, **72**) 944 × **60** | каретка на y 17, строка 26, т.е. 17/17 — **фантомного второго абзаца больше нет** |
| `Buttons` | **`28726:64929`** | (0, **132**) 944 × 36 | было y 86 → **+46**; пилюля `28726:64935` (123 × 36) на месте |
| `conteiner` | **`28726:64920`** | (324, **453.99981689453125**) 960 × **286** | y **тот же**, что у канонического `28364:40215` → поле растёт ВНИЗ |
| ряд промпт-чипов | внутри `28726:65027` | y **208** внутри `Input field + Text` (было 162) | **+46**; слака под контейнером 118 → 72 |

Разложение поля по строкам (от верхнего края):
`16` паддинг · `56` тайл · `17` · `26` строка плейсхолдера · `17` · `36` кнопки ·
`16` паддинг = **184**. Без вложения: `17` · `52` (строка + фантомная пустая) · `17` ·
`36` · `16` = **138**.

⚠️ Отсюда ДВА разных пути у строк: **строка плейсхолдера едет на 72** (y 17 → 89),
а **кнопочный ряд и чипы — на 46**. Разница 26 — это исчезнувший фантомный абзац
канонического борда (он и там помечен как случайность, §7.2). Оба борда собраны
как нарисованы.

### 13.2 Чего на борде НЕТ (проверено, не выдумывать)

* **Ни одного скрытого варианта** в поддереве вложения: в XML борда 103 скрытых узла,
  внутри `28734:65591` — ноль. Ховера, прессы и фокуса у тайла и бейджа не нарисованы.
* **Второго вложения не нарисовано нигде**, и строка ровно под один тайл (88 = 16+56+16).
  Реализовано ОДНО вложение; следующий выбор заменяет предыдущий (13.4).
* `get_variable_defs` на всём поддереве вложения возвращает **пустой объект** — ни одна
  краска тут не привязана к токену. Это единственное место фичи, собранное «на глаз».

### 13.3 Как это реализовано (и где мы отошли от буквы)

* **Тайл — фотография, а не стекло.** Обод 10 % белого рисуется `inset box-shadow`
  (CSS-`border` съел бы пиксель бокса — стоячее правило проекта), радиусы
  `16px 8px 16px 16px` — по картинке, а не по фрейму: у фрейма Figma держит 16 и на
  верхнем-правом, где картинка уже 8. Расхождение в 8 px закрыто бейджем целиком
  (его футпринт — ровно этот угол), поэтому рисуем по ВИДИМОЙ кромке.
* **Бейдж — единственный НЕПРОЗРАЧНЫЙ член семейства Liquid Glass, и это функция:**
  ~40 % его площади лежит на миниатюре, а полупрозрачный контрол над фотографией теряет
  глиф. Борд рисует его непрозрачным и даёт `#1a1222`. Обод — градиент семейства
  `--pill` (20 → 5 → 15 %), чей первый стоп и есть тот «плоский 20 %», который отдал
  экспорт; blur снят (сквозь непрозрачную заливку смотреть нечего). Замерено: поле
  рядом = (21,14,28), т.е. бейдж на ступень СВЕТЛЕЕ поверхности — как на борде.
* **Глиф ✕ — 10 px** (крест 7.5) в нарисованном 16-боксе: собственная геометрия глифа
  не восстановима (asset-URL заблокирован), подобрано по 1 : 1-рендеру всего поля.
* **Ripple у бейджа нет** (`data-no-ripple`), промывка есть — то же решение, что было
  у ✕ старого чипа: расцветать светом на контроле, который сейчас удалит объект под
  собой, — праздник не по адресу. На 18 px риппл и не читался бы как позиционный.

### 13.4 Наше, не нарисованное (помечено в коде)

1. **Клик по тайлу открывает полный превью** — детальный вид (§12), прилетевший ИЗ
   тайла; закрытие возвращает объект в тайл, сетка библиотеки в этом пути не участвует.
   56 px — не тот размер, по которому проверяют шаблон.
2. **Пилюля с уже прикреплённым шаблоном** снова открывает библиотеку, и следующий
   выбор ЗАМЕНЯЕТ вложение (единственное чтение, которое допускает строка на один тайл).
   ✅ **ПОДТВЕРЖДЕНО ДИЗАЙНЕРОМ 26.08.2026:** «один шаблон, если ты снова нажмёшь "Add
   template" и выберешь, то оно просто заменит шаблон, нужна анимация для этого красивая и
   плавная». Как собрано — §13.7 ниже.
3. **Build остаётся «Build»** — состояния «Remix» нет ни на одном борде.
4. Хореография прилёта/ухода целиком — см. `design-system.md` §5 «Хореография
   вложенного шаблона».

### 13.7 ⚑ 26.08.2026 — ЗАМЕНА ВЛОЖЕНИЯ И ПОВТОРНЫЙ ВЫБОР (нарисованного нет; наше)

Борд рисует ОДИН тайл и бар 88 px под него — второго вложения нигде нет, и дизайнер
подтвердил чтение словами (§13.4-2). Ни одного кадра замены при этом не нарисовано, поэтому
хореография наша, и вот она — с двумя замерами, которые её определили:

| что | как собрано | почему именно так |
|---|---|---|
| прилёт нового | БЕЗ ИЗМЕНЕНИЙ — тот же `FLIGHT_SEAT` из источника в плитку | полёт и есть анимация замены |
| уходящий рисунок | клон-призрак в слоте (`.attach-tile-ghost`, ПОД лицом плитки), свёрт scale 0.9 + фейд **140 мс**, начало **160 мс**, конец **300 мс** | слот не бывает пустым; конец совпадает с «объект визуально дома» (`SEAT_ACK_DELAY`) |
| рост поля 138 → 184 | **НЕ повторяется** | оба хука снапа висят на булевом `hasTile`; замерено — у поля одно значение высоты 184 на всём жесте, герой не двинулся |
| тот же шаблон снова | полёта нет, шит растворяется, плитка даёт settle-пульс (просадка лица до 0.94 + вспышка кромки, 280 мс) | лететь некуда: оба конца — одна картинка |

**Замер 1 — когда объект «дома».** По одному замороженному пробнику на метку (полящий цикл
искажает: тот же полёт «занимал» 818 мс): из «+» карточки клон 181 px на 30-й мс, 95 на
80-й, 67 на 130-й, 58.7 на 240-й, 55.7 (внутри 56 плитки) на 300-й. Остаток пружины — 2 %
осадки. Поэтому свёрт мерится от 300, а не от 620.

**Замер 2 — где свёрт вообще видно.** Клон FLIP-а — это бокс назначения, растянутый
относительно неподвижной точки полёта. На пути `Choose a template` точка лежит ВНУТРИ плитки
((12.35, 23.28) от угла), поэтому клон накрывает слот на каждом кадре: 263 из 375 сэмплов
строго, остальные — финальная субпиксельная просадка. То есть на этом пути призрак не виден
вообще, и он сделан ради двери «+» карточки, где клон доходит до слота только к ~200 мс —
без призрака слот моргал бы пустым ~600 мс.

Полный закон — `design-system.md` §5, правило 5а; константы и рассуждение — `attachment.ts`
§ ONE SLOT; замеры — `scratchpad/wp3/`.

### 13.5 Открытые вопросы к дизайнеру (борд 28726:64760)

1. **⚑ Build на борде НЕАКТИВЕН при прикреплённом шаблоне** (видимое состояние —
   `28726:64950`, тот же слот, что и disabled `28364:40242`). Мы шипим Build
   АКТИВНЫМ: шаблон без промпта — это законный «собери из этого», и карточки шаблонов
   в доке ровно так и работают. Похоже на след дублированного фрейма, но нарисовано
   обратное — подтверди, что Build активен.
2. **Второе вложение** — бывает? Если да: тайлы в ряд с шагом 8, или ряд скроллится?
3. **Ховер/пресс у тайла и у ✕** не нарисованы. Сейчас: у тайла ярче обод (10 % → 25 %),
   у ✕ — промывка семейства. Достаточно?
4. **Плитка показывает миниатюру шаблона, но не его имя.** На 56 px имени и негде быть,
   но тогда узнать, ЧТО прикреплено, можно только по картинке (и по превью по клику).
   Так и задумано?
5. **`Choose a template` в превью уже прикреплённого шаблона** — пилюля там нарисована
   для пути «из сетки». Сейчас работает как «готово» (тот же полёт домой, что и у ←).
   Менять ли лейбл на этом пути? ⚑ Частичный ответ уже есть: у двери ДОКА лейбл теперь
   свой (`Remix this template`, §12.5-bis), так что механизм «у каждой двери своё слово»
   собран — осталось решить, нужно ли третье слово здесь.
6. **Заливка бейджа `#1a1222`** — сырой пиксель, не токен. Оставляем как нарисовано;
   если это должен быть член стеклянного семейства (`Black/700` + blur), скажи —
   но тогда глиф будет читаться поверх миниатюры хуже.

### 13.6 Node-id quick reference (борд вложения)

Борд `28726:64760` · `conteiner` `28726:64920` · `Input field` `28726:64923` ·
`Input field gradient` `28726:64924` · **`Attachments bar` `28734:65591`** ·
**`attached template` `28734:65592`** · `image 381` `28734:65593` ·
**`Close` `28734:65594`** · глиф `28734:65595` · `Text` `28726:64925` ·
каретка `28726:64926` · плейсхолдер `28726:64928` · `Buttons` `28726:64929` ·
`Left` `28726:64930` · «+» `28726:64931` · пилюля `28726:64935` (лейбл `28726:64938`) ·
микрофон `28726:64942` · Build видимый/скрытые `28726:64950` / `64946` / `64954` ·
ряд чипов `28726:65027`.

---

## 14. § Прокрученное состояние пикера — борд `28734:65603` (26.08.2026)

Снято **26.08.2026** через Figma MCP (`get_metadata`, `get_design_context`,
`get_variable_defs`, `get_screenshot` + base64 — прокси по-прежнему 403-ит любой
прямой запрос к figma.com, проверено ещё раз).

| Борд | id | Размер | Что показывает | Canvas x, y |
|---|---|---|---|---|
| Пикер, ПРОКРУЧЕННЫЙ | **`28734:65603`** | 1656 × 1196 | тот же шит со сжатой шапкой и волоском под фильтрами | −4385, **3928** |
| Пикер, в покое | `28616:59168` | 1656 × 1196 | §1–§11 выше | −4385, 2610 |

Оба называются «Domain-Only Customer», как всё на этой странице.

### 14.0 ⚠️ ЧИТАТЬ ПЕРВЫМ: борд ПОКОЯ тоже переделан

`28616:59168` больше не тот, что описан в §3/§4. Дизайнер отредактировал его в
тот же заход (id самих узлов старые — правки на месте, поэтому по id это не
видно):

| | §3/§4 (25.08) | сейчас (26.08) |
|---|---|---|
| `Sections` `28626:537` | 1624 × 1107 | 1624 × **1119** |
| `Webites` `28626:538` | 1560 × 1083 | 1560 × **1095** |
| `Title` `28626:539` (обёртка Header + Tabs Alt; в §1.2 не была названа) | 1560 × 203 | 1560 × **215** |
| `Header` `28626:540` | (564.5, 0) 431 × 119 | (450.5, 0) **659 × 131** |
| `Text` `28626:541` | (0, 57) 431 × 22 | (0, 57) **659 × 34** |
| заголовок `28626:542` | **32 px**, `Pick a template. We'll remix it`, ровный `#ffffff` | **48 px**, `Pick a template. We'll remix it.`, **ДВУХТОНОВЫЙ** |
| `Tabs Alt` `28626:583` | (0, 119) 1560 × 84 | (0, **131**) 1560 × 84 |
| `Tab group` `28626:584` | (430.5, 16) **707** × 36, **6** чипов | (374, 16) **820** × 36, **7** чипов |
| карточка r1c2 `28626:606` | кебаб-призрак | кебаб СКРЫТ, синий `+` `28637:42070` |
| сетка `28626:591` | (0, 203) | (0, **215**) |

То есть §3 и §4 выше — история. Правда покоя теперь эта таблица, и именно из неё
берётся то, ОТКУДА сжимается шапка.

### 14.1 Заголовок: две тональности и точка (ответ на §10.1)

Обе доски дают ОДНУ строку — узел так и назван: **`Pick a template. We'll remix it.`**
— **с точкой на конце**. Разбита на три спана:

| спан | текст (дословно) | цвет |
|---|---|---|
| 1 | `Pick a template.` | `Neutral Alpha/1000` → **`#ffffff`** |
| 2 | ` ` (пробел) | без своего цвета, наследует белый |
| 3 | `We'll remix it.` | `Neutral Alpha/600` → **`#ffffff8f`** (56 % белого) |

Апостроф всё ещё прямой `'` (U+0027) — единственное, что осталось от §10.1.
Так что вопрос «точка или нет» закрыт бордом: точка есть, и добавилась вторая
тональность. Реализовано как нарисовано; в прототипе 56 % — новый токен
`--white-560` (лестница шла 48 % → 70 %, 56 % — реальная ступень кита).

**Размер — это и есть компакция:** 48 в покое, 32 прокрученным. Бокс 659 × 34 и
440 × 22 — одна и та же строка в отношении 32/48 (659 × 32/48 = 439.3 против
нарисованных 440), то есть геометрически это чистый скейл.

### 14.2 Геометрия сжатой шапки (`Title` `28734:66372`, 1560 × 146)

| Узел | Что | Покой | Прокрученный |
|---|---|---|---|
| `Title` | обёртка | 1560 × **215**, БЕЗ заливки | 1560 × **146**, заливка **`Gray/900` #18181b** |
| `Header` `28734:66373` | паддинги вокруг капа | pt **57** / pb **40** → 131 | pt **40** / pb **16** → **78** |
| `Text` → текст `28734:66375` | кап-бокс | (0, 57) 659 × 34, 48 px | (0, **40**) 440 × 22, **32 px** |
| `Tabs Alt` `28734:66416` | ряд чипов | (0, 131) 1560 × 84, pt16 / pb**32**, БЕЗ обводки | (0, **78**) 1560 × **68**, pt16 / pb**16**, **border-bottom** |
| `Tab group` `28734:66417` | 7 чипов | (374, 16) 820 × 36 | то же |
| `Conteiner` `28734:66425` | сетка | (0, 215) 1560 × 880 | (0, **125**) 1560 × 880 |
| `Sections` / `Webites` | | 1119 / 1095 | **170 / 146** (сетка вываливается наружу — она отдельный слой) |
| `Buttons` `28734:66759` → `Close M` `28734:66764` | ✕ | (1568, 16) 40 × 40 | **то же, не меняется** |
| скрим `28734:66365` | | 1656 × 1197, 50 % чёрного | то же |
| шит `28734:66367` | | (16, 16) 1624 × 1164, r16 | то же |

### 14.3 Разделитель — единственный НОВЫЙ элемент

Он не отдельный узел (в поддереве шита нет ни одного `Line`/`Divider`/
`Rectangle` — грепнуто): это **strokeAlign inside** на самом `Tabs Alt`
`28734:66416`, `border-bottom`.

| свойство | значение |
|---|---|
| цвет | `Neutral Alpha/100` → **`#ffffff14`** (8 % белого; экспортное `rgba(9,9,11,0.08)` — светлая ловушка темы) |
| толщина | 1 |
| y | **145** (подошва 68-го бокса; 78 + 68 = 146) |
| протяжённость | **1560** — контентная колонка, НЕ вся ширина шита (1624) |
| в покое | **отсутствует** — у `28626:583` обводки нет вовсе |

⚠️ В CSS это НЕ `border`: строук сидит ВНУТРИ 68-и (16 + 36 + 16 = 68 ровно), а
CSS-рамка добавила бы пиксель и уронила сетку на 147. Волосок — позиционированный
элемент (плюс он всё равно должен анимировать opacity).

### 14.4 Что делает сетка под шапкой

Ничего особенного: она **прокручена под шапку**, и шапка её обрубает своей
непрозрачной заливкой. Ни маски, ни растушёвки, ни второго слоя на бордах нет —
`Title` просто получает `Gray/900`. Доказательство, что это прокрутка, а не новая
раскладка: у сжатой шапки подошва 146, а сетка нарисована на 125, то есть ровно
на **21 px выше** — `scrollTop = 21`. И в покое, и прокрученным сетка начинается
у подошвы шапки (215 / 146), поэтому 69 px, которые шапка отдаёт, достаются
сетке.

### 14.5 Седьмой чип — дубль `Ecommerce`

На обоих бордах ряд теперь из семи: `All templates` 112 · `Ecommerce` 105 ·
**`Ecommerce` 105** · `Portfolio` 86 · `Business & services` 151 ·
`Health And Beauty` 146 · `More` 67, gap 8, итого 820. Третий — новый инстанс
(`28734:65599` в покое, `28734:66420` прокрученным) с той же подписью, что второй.
**Не реализовано** (шести хватает): фильтр с одной категорией дважды — баг на
экране, даже если он на борде. Вопрос дизайнеру: это `Restaurants`/`Education`,
которому забыли сменить подпись, или случайный Ctrl-D?

✅ **ОТВЕТ ДИЗАЙНЕРА (26.08.2026): «не нужен дубль, придумай другой топик».**
Слот (третий, между `Ecommerce` и `Portfolio`) теперь несёт **`Tech & SaaS`**,
id `tech` — подпись НАША, поэтому в `data/templates.ts` она единственная не
помечена «verbatim». Под неё отнесены карточки, у которых продуктовый/стартапный
СКРИНШОТ, а не «технически звучащая» подпись-плейсхолдер: PayNexus (`payments`),
WorkPro (`saas`), MineMax (`crypto`) — во ВСЕХ строках, где эти сайты
встречаются, иначе один и тот же скриншот отвечал бы двум разным чипам.
Обязательное условие релиза — **у каждого чипа непустой результат в ОБОИХ
списках** (пустая сетка = ненарисованное состояние, §10.5). Замерено в собранном
приложении: полка дока 6 / 2 / 1 / 1 / 1 / 1 / 6 и сетка пикера
18 / 5 / 4 / 4 / 2 / 3 / 18 (порядок чипов слева направо).
⚠️ Побочный эффект для дизайнера: в ДОКЕ карточки `flex: 1`, поэтому чип с одной
карточкой растягивает её на всю полку (1592). Так было и до этой правки
(`Portfolio` и `Health And Beauty` — по одной карточке), но теперь таких чипов
четыре из шести. Ни один борд отфильтрованную полку не рисует — решение за ним.

Заодно: группа по-прежнему на 4 px правее истинного центра (784 против 780) из-за
асимметричных 16/8, унаследованных от компонента дока — та же случайность, что в
§4/§10.4, шипим по центру.

### 14.6 Синий `+` на карточке

| свойство | значение |
|---|---|
| узел | `Icon button` `28734:66455` (прокрученный) / `28637:42070` (покой), обёртка `Frame 1228852208` 32 × 54 |
| компонент | кит: **Style=Filled, State=Enabled, Shape=Square, Size=Small, Color=Blue** (`10479:73014`); описание компонента: «high-emphasis… for important, final actions that complete a flow» |
| бокс | **32 × 32**, card-local x **201.333** (вплотную к правому краю карточки), y **16** от верха 54-го мета-бара |
| радиус | **10**, `overflow: clip` |
| заливка | `Background/Blue/Default` → **`#1587ff`** (экспорт отдал `#0073ec` — светлая ловушка) |
| глиф | `Icon` 24-бокс, `Icon/Default/Default` → `#ffffff`, «+» |
| соседи | у ЭТОЙ карточки кебаб-призрак `28734:66450` **скрыт**; у остальных 17 наоборот |
| подпись рядом | `Text` 185.333 (= 233.333 − 32 − 16), поэтому именно на этой карточке имя и описание нарисованы с эллипсисами |

**Вывод: это ховер-состояние карточки.** Ни одна доска не подписывает его
«hover», но на 18 карточках он ровно один, стоит в слоте, где у всех остальных
припаркован прозрачный кебаб, у него самого кебаб выключен, и он несёт глиф и
цвет CTA детального просмотра (`+ Choose a template`, §12.0). В этом файле
«одна карточка из восемнадцати в другом состоянии» — это и есть способ
нарисовать состояние. Реализовано как ховер/фокус карточки и подключено к тому
же пути, что `Choose a template`: объект летит из МИНИАТЮРЫ карточки в плитку
композера (полёт верстает контент по источнику, а миниатюра — ровно та пропорция,
которую он рисует, так что карточка ему дешевле сцены). Место под `+` (48 =
32 + 16) отдаётся ТОЛЬКО на ховере — иначе усохли бы подписи всех 18 карточек
против борда, а борд рисует эллипсисы именно и только на карточке с кнопкой.

Вопросы дизайнеру: (а) это ховер — или кнопка должна стоять всегда? (б) что она
делает — берёт шаблон сразу (так реализовано) или открывает превью? (в) нужна ли
она в доке, где та же карточка живёт без неё?
→ **(а) и (б) ЗАКРЫТЫ дизайнером 26.08.2026, (в) остаётся открытым — см. §14.10.**

### 14.7 Скрытое и припаркованное на борде (проверено)

Внутри `Title` `28734:66372`: `Trustpilot` `28734:66377`, `Tabs (Medium)`
`28734:66410`, `Tabs (Small)` `28734:66413`, сплющенный остаток `Templates`
`28734:66376` — тот же набор, что и в покое. В шите: `Rectangle 1162905190`
`28734:66368` (1624 × 768), `Union` `28734:66369` (точечная текстура). В углу
рядом с ✕: `Buttons` `28734:66760` (207 × 40 — иконка + белая `Add an object`) и
`Close M` `28734:66763` 32 × 32. **Никаких альтернативных вариантов СЖАТОЙ шапки
не припарковано** — вариант ровно один.

### 14.8 Чего на бордах НЕТ (не выдумывать)

Ни одного кадра перехода, ни smart-animate, ни состояний, ни намёка на порог
прокрутки, кроме самих 21 px. Тайминги, пружина, гистерезис, укрытие зажима
скролла — наши; закон и цифры: `design-system.md` §5 «Шапка, которая сжимается
при скролле», замеры `scratchpad/qa14/`.

### 14.9 Node-id quick reference (борд 28734:65603)

Борд `28734:65603` · скрим `28734:66365` · шит `28734:66367` · `Sections`
`28734:66370` · `Webites` `28734:66371` · **`Title` `28734:66372`** · `Header`
`28734:66373` · заголовок `28734:66375` · `Tabs Alt` (несёт волосок)
**`28734:66416`** · `Tab group` `28734:66417` · чипы `28734:66418…66424` · сетка
`28734:66425` · карточка с `+` `28734:66440`, сам `+` `28734:66455` · ✕
`28734:66764`.

---

### 14.10 § Ховер карточки подтверждён и уточнён — узел `28626:606` (26.08.2026, вечер)

Дизайнер прислал узел **`28626:606`** (fileKey `GP4jNXtc37VTFVZDc9JF0a`) и словами
описал, что в нём нарисовано: при наведении на шаблон в списке появляется синий «+»,
который **прикрепляет шаблон, НЕ открывая полноэкранный просмотр**, а чтобы имя и
описание не наезжали на кнопку, слева от неё добавлена «плашка с градиентом, который
выглядит как тень». Снято через Figma MCP (`get_metadata`, `get_design_context`,
`get_variable_defs`, `get_screenshot` + base64; `curl` к figma.com по-прежнему 403 —
проверено ещё раз, поэтому программное сэмплирование рендера невозможно и все цифры
ниже — из ответов инструментов).

**Что в узле НОВОГО (одна фигура):** `Rectangle 1162905197` **`28740:66863`** внутри
`Frame 1228852208` `28637:42076`, ПЕРЕД инстансом кнопки (то есть под ней).

| свойство | значение (из `get_design_context`) |
|---|---|
| бокс | **48 × 38**, frame-local x **−47.6665**, y **13** → card-local **(153.667, 231)**, meta-local y **13** |
| отношение к кнопке | правый край плашки = левый край кнопки (перекрытие 0.333); по вертикали плашка на **3 px** выше и ниже кнопки (13…51 против 16…48) |
| тип заливки | линейный градиент, направление **to left** (`bg-gradient-to-l`) |
| стоп 1 | `#18181b` (Gray/900 — земля листа пикера) на **0 %** = правый край |
| стоп 2 | `#18181b` на **19.712 %** (= 9.462 px от правого края; дальше начинается спад) |
| стоп 3 | `rgba(24,24,27,0)` на **100 %** = левый край |
| z | под кнопкой, над подписью (порядок детей `Conteiner`: `Text` → скрытый кебаб → `Frame 1228852208`) |

**Node id плашки ПОЗЖЕ всего прокрученного борда** (`28740:*` против `28734:*`) —
доказательство, что она дорисована после §14, и что борд покоя снова правился на месте.

**⚠️ У прокрученного борда плашки НЕТ.** `28734:66454` содержит только `28734:66455`
(кнопку) — рассинхрон бордов, а не второе состояние. Вопрос дизайнеру: дорисовать
плашку и там, или считать прокрученный борд историей.

**Кнопка — перепроверена, всё как в §14.6:** 32 × 32, r10, `overflow: clip`,
`Background/Blue/Default` → **`#1587ff`** (экспорт снова отдал `#0073ec` — светлая
ловушка), глиф 24-бокс `Icon/Default/Default` → `#ffffff`, паддинг `state-layer` 4,
card-local (201.333, 234) = meta-local y 16, кит-вариант `Style=Filled, State=Enabled,
Shape=Square, Size=Small, Color=Blue` (`10479:73014`). **Ни одного припаркованного
варианта состояний** в поддереве карточки: единственный скрытый узел — кебаб-призрак
`28626:616` (у остальных 17 карточек он видим и на нулевой прозрачности), и ни у одной
из шести карточек первого ряда ни плашки, ни «+» нет — то есть «одна карточка из
восемнадцати» по-прежнему единственный способ, которым этот файл рисует состояние.

**Подпись: `185.333` — это AUTO-LAYOUT, а не второй лейаут.** `Conteiner` — авто-ряд
(`Text` fill + `Frame 1228852208` fixed 32, gap 16), поэтому вставка кнопки САМА сжала
`Text` с 233.333 до 185.333, а тексты внутри остались 206-широкими и подрезались
(на прокрученном борде те же тексты уже 181.333 — Figma пересчитала). Реализовано
НЕ так: подпись сохраняет ширину покоя, а хвост под кнопкой накрывает непрозрачная
часть плашки. Причина и замеры — `design-system.md` §5 «Ховер-аффорданс карточки
шаблона», короткая версия: скопировать 185.333 = подрезать подпись на ховере, и
эллипсис длинного имени прыгает на 48 px влево ровно в момент прихода курсора.

**Что этот узел ЗАКРЫВАЕТ из §14.6:**

* **(а) это ховер.** Подтверждено словами дизайнера («при наведении… должна появляться»).
  Так и было реализовано — вывод §14.6 верен.
* **(б) кнопка берёт шаблон сразу.** Подтверждено: «прикрепляет шаблон без открытия
  полноэкранного просмотра». Реализовано так же (тот же путь, что `Choose a template`:
  объект летит из МИНИАТЮРЫ карточки в плитку композера).
* **новое:** зачем плашка (чтобы текст не наезжал) и как она нарисована — таблица выше.

**Что остаётся ОТКРЫТЫМ:**

* ~~**(в) нужен ли «+» в доке?**~~ ✅ **ОТВЕТ (26.08.2026, ночь): НЕТ.** «нет, в доке
  ховера + нет, только открыть превью и там будет кнопка "Начать из этого тимплейта"».
  Так и было собрано (в доке «+» не ставился), и теперь это подтверждённый канон, а не
  наша осторожность. Заодно ответ переопределил КЛИК по карточке дока: он открывает то же
  полноэкранное превью, а генерация живёт на его CTA `Remix this template` (§12.5-bis).
  Плашка-тень в доке по-прежнему только рецепт, унаследованный от `--card-ground`
  (проверено: резолвится в `#09090b`, ровно фон страницы) — без «+» ей нечего прикрывать,
  и она там не рендерится.
* **⚑ И у карточки появился СВОЙ ховер, одинаковый в доке и в пикере** (тот же ответ:
  «но ховер нужен, можешь придумать какой-то ховер на саму карточку? он должен быть в обоих
  случаях, потому что клик по карточке открывает на весь экран превью»). Ничего из этого не
  нарисовано — аффорданс наш: зум рисунка 1.03 внутри клипа, градиентный обод канона Liquid
  Glass вместо плоского волоска, матовая пилюля `Preview` с глифом-«развернуть» внизу-СЛЕВА
  миниатюры (синий «+» остаётся вверху-справа и только в пикере — два аффорданса разведены
  пространственно). Числа, тайминги и замеры — `design-system.md` §5 «Ховер САМОЙ
  карточки»; вопрос дизайнеру: подтверди 1.03 / 240 мс / лейбл `Preview` (или дай своё
  слово) и то, что пилюля не мешает читать миниатюру.
* **состояния кнопки** (hover / pressed / focus) не нарисованы — ставим домашнюю
  конвенцию сплошной синей кнопки `#1587ff → #3d9bff → #0073ec` и помечаем как нашу.
* **плашка на прокрученном борде** (см. ⚠️ выше).
* **Tab-порядок внутри карточки:** «+» стоит в DOM ПЕРЕД растянутой кнопкой карточки
  (порядок отрисовки борда), поэтому клавиатура читает «Use …», затем «Open …».
  Порядок унаследован, не менялся; если дизайнер/a11y-ревью захочет обратный —
  это перестановка детей карточки, а её измеряют полёты (они ищут `children[1]`).

**Node-id quick reference (ховер):** карточка `28626:606` · `Conteiner` `28626:611` ·
`Text` `28626:612` (185.333) · имя `28626:614` · описание `28626:615` · скрытый кебаб
`28626:616` · обёртка `Frame 1228852208` `28637:42076` · **плашка `28740:66863`** ·
**кнопка `28637:42070`** (кит `10479:73014`).
