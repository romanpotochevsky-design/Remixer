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

### 7.4 Attached-template state — not drawn

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

### 12.1 Header strip — `Buttons` `28637:43245`

(0, 0) **1624 × 72** on the sheet's own ground (no fill, no hairline, no shadow —
the board draws **no visible bar**). Layout: `flex; gap: 16px; padding: 16px 16px 16px 0;
justify-content: flex-end` — three zones:

| Zone | Node | Geometry (sheet-local) | Spec |
|---|---|---|---|
| Back | wrapper `28640:43368` (0, 16) 48 × 40, `pl 16` → `Icon button` **`28640:43362`** | **32 × 32 at (16, 20)** — vertically centred in the 72 | Component `Style=Standard, Shape=Square, Size=Small` (`889:7322`): container **radius 8**, state-layer `padding 4`, icon **24 × 24**. No fill until interaction (per the component's own doc: “Until the button is interacted with, its container isn’t visible”). Glyph: a plain **←**; colour `Icon/Default/Default` → **`#ffffff`** |
| Title + CTA | flex-1 container `28641:43374` (64, 16) 1488 × 40 → group `Name + Category` `28640:43353` (497, 0) **494 × 40**, `gap: 32` | group centred in the container | see below |
| Close | `Close M` `28640:43357` → state-layer `28640:43358` | **40 × 40 at (1568, 16)** — 16 from top, 16 from right | **identical to §2**: radius 12, `Black/500` `#09090b7a`, `backdrop-blur 16`, 1 px `Neutral Alpha/200` → **`#ffffff1f`** (the reference code's `rgba(9,9,11,.16)` is the light trap again), white ✕ 24-box |

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

### 12.2 The stage (site preview)

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
* The preview scrolls inside the stage via the house `ScrollArea` (tone `auto`), enabled
  after the entrance lands. The stage content keeps the CARD's drawn aspect
  (233.333 / 218), so the enlarged render is the same drawing the card showed — and at
  every tested viewport it is taller than the stage, so it always scrolls.
* Esc in detail = back to the list; Esc in the list closes the picker. ✕ and scrim-click
  close the whole picker from either view (the sheet exits showing whatever is on screen).
* Focus: opening detail lands on the back arrow; back returns focus to the opened card;
  Choose runs the existing attach path (focus → composer field).

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

### 12.7 Node-id quick reference (detail board)

Board `28637:42088` · scrim `28637:42852` · sheet `28637:42854` · header `28637:43245` ·
back `28640:43362` (wrapper `28640:43368`) · title `28640:43354` · hidden description
`28640:43355` · pill `28641:43375` · close `28640:43357/43358/43359` · stage chain
`28637:42857` → `42858` → `42911` → `42912` → `42926` → `42927` → image `28637:42930` ·
hidden meta bar `28637:42931` · hidden list-Title `28637:42859`.
