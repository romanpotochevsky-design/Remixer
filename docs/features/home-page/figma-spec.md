# Remixer Home page — Figma implementation spec

Source file: **`AI Website Builder`** — fileKey `GP4jNXtc37VTFVZDc9JF0a`
Captured: **25 Aug 2026**, via Figma MCP (`get_metadata`, `get_design_context`,
`get_variable_defs`, `get_screenshot`).

This is the **main / home page of the Remixer app** (it lives *inside* the app, not on
the marketing site): a full-bleed hero with the AI composer, and a panel pinned to the
bottom of the screen listing the customer's projects. The dock has two states — templates
when there are no projects, tabs (`My projects` | `Templates`) once a site exists.

## How to read this document

* Every number is taken from a tool response. Anything I had to read off a render is
  marked **≈ measured**.
* **Theme warning (already burned us once — see `CLAUDE.md`).** `get_design_context`
  resolves variables in the **light** theme and writes that into the CSS fallback;
  `get_variable_defs` resolves them in the **dark** theme. This page is dark. Wherever the
  two disagree, **the dark value is correct** and the fallback in the reference code is a
  trap. Example: the composer placeholder reads `var(--background/neutral/500, #71717a)` —
  the real colour is **`#c7c7cd`**. The whole `Background/Neutral/*` ramp is inverted
  between themes (see §9).
* Node ids are given for everything so any number can be re-verified.
* Layout numbers are stated as Figma auto-layout (padding / gap / fixed size), because
  that is what the boards are actually built from.

---

## 1. Boards

| Board | id | Frame size | State it shows | Canvas x, y | Age |
|---|---|---|---|---|---|
| **Domain-Only Customer** (canonical) | `28364:40053` | 1656 × 1196 | Dock = segmented tabs `My projects` \| `Templates`, **My projects** active. 1 real project + 5 dashed empty slots. | −4385, 1311 | **middle** |
| Domain-Only Customer | `28375:43006` | 1656 × 1196 | Dock = `Templates` heading + 6 category filter chips + 6 template cards. | −2510, 1311 | **newest** |
| Domain-Only Customer | `28364:39116` | 1656 × 1196 | Dock = plain `My projects` heading, 7 narrower cards (1 real + 6 dashed). Topbar carries a `Hosting` nav link. Composer has a 3 px gradient border. | −6597, 1311 | **oldest** |

All three frames carry the **same name** ("Domain-Only Customer") — an implementer cannot
tell them apart by name, only by id.

### Which is newer

`28364:39116` is the **oldest**: it sits furthest left on the canvas, its Figma local ids
are the lowest of the three, and the two features that replace it (the segmented tab
control `28364:42954` / `28364:42996` and the filter-chip row `28376:43912`) were created
in *later* Figma sessions and do not exist on it at all. `28375:43006` carries the highest
session prefixes (`28375:` / `28376:`) and sits furthest right, so it is the **newest**.

**Build the canonical board `28364:40053`.** Treat `28375:43006` as the second dock state
of the same page (it is the same hero, ±8 px of height). Treat `28364:39116` as
**superseded** — do not implement its topbar nav, its card sizes, or its composer border.

### Precise diff table

| Property | `28364:39116` (oldest) | `28364:40053` (**canonical**) | `28375:43006` (newest) |
|---|---|---|---|
| Hero wrapper (`Frame 1228852208`) | `28364:39238` — 1656 × **868** | `28364:40175` — 1656 × **820** | `28375:43126` — 1656 × **812** |
| Hero panel | `28364:39239` — 1640 × **860** @ (8, 8) | `28364:40176` — 1640 × **812** @ (8, 8) | `28375:43127` — 1640 × **804** @ (8, 8) |
| Dot-texture `Union` y-offset inside hero | **70** | **22** | **14** |
| Hero content slack under the chips row | 166 px | 118 px | 110 px |
| Topbar nav | **`Hosting`** link visible (`28364:39819`), 15 px Proxima Nova Regular, at x = 175 (board) | none (nav slot `28364:40754` hidden) | none (nav slot `28375:43711` hidden) |
| Topbar `Left` group width | 497 (logo 103 + gap 40 + nav 354) | 103 | 103 |
| Composer fill | `Black/800` `#09090bb8` (72 %) | `Black/900` `#09090bcc` (80 %) | `Black/900` `#09090bcc` (80 %) |
| Composer radius | **24** | **32** | **32** |
| Composer border | **3 px gradient** (magenta → violet → blue → grey; generator flattened it to `#c46082`) | **1 px solid** `Neutral Alpha/100` `#ffffff14` | **1 px solid** `Neutral Alpha/100` `#ffffff14` |
| Dock wrapper | `28364:39639` @ y = 868, 1656 × **328** | `28364:40576` @ y = 820, 1656 × **376** | `28375:43527` @ y = 812, 1656 × **384** |
| Dock `Title` row | 1592 × **80**, heading `My projects` (Gilroy SemiBold **24 px**) at x = 8 | 1592 × **80**, **`Tabs (Small)`** 211 × 44 at x = 0, y = 18 | 1592 × **88**, heading `Templates` (Gilroy SemiBold **32 px**) at x = 0 **+ 6 filter chips** right-aligned |
| Card grid | **7** cards, gap 32 → **200** wide × **224** tall | **6** cards, gap 32 → **238.667** wide × **272** tall | **6** cards, gap 32 → **238.667** wide × **272** tall |
| Thumbnail area height | 168 (all cards) | 216 (card 1) / 168 (placeholders) | 216 (card 1) / 218 (cards 2–6) |
| Card content | 1 real project + 6 dashed placeholders | 1 real project + 5 dashed placeholders | 6 real template cards, no placeholders |
| Kebab (⋮) button | card 1 only | card 1 only | **none** — all six are `opacity: 0` |
| Card name type | Gilroy Medium 18 px | Gilroy Medium 18 px | Gilroy Medium **16 px** |

Everything else — hero logo/headline/subtitle block, composer internals, prompt-chip row,
topbar height and avatar — is **byte-identical across all three boards**.

---

## 2. Page frame and layout intent

### As drawn

| Element | id (canonical) | Geometry |
|---|---|---|
| Page frame | `28364:40053` | 1656 × 1196, fill **`Gray/950` `#09090b`** *(inference — see note)* |
| Hero wrapper | `28364:40175` | (0, 0) 1656 × 820 — no fill |
| Hero panel | `28364:40176` | **(8, 8) 1640 × 812**, corner radius **≈ 20 px (≈ measured)** |
| Topbar (`Menu`) | `28364:40718` | **(8, 8) 1640 × 72** — floats *over* the hero panel, exactly on its top-left corner |
| Dock wrapper | `28364:40576` | **(0, 820) 1656 × 376** — full-bleed, no fill |
| Dock content (`Webites`) | `28364:40580` | (32, 0) 1592 × 352 inside the dock → 32 px left/right inset, **24 px slack at the bottom** |

So the composition is: an **8 px inset rounded hero panel** (left / top / right = 8 px,
**bottom flush at y = 820**), and below it a **full-bleed dock** that runs to the frame's
own edges. The hero's *bottom* corners are still rounded, so the page ground shows through
them — that rounded bottom edge is the only separator between hero and dock. There is **no
hairline, no border and no shadow** on the dock's top edge.

Two things I could not read from the tools and had to measure:

* **Hero panel radius ≈ 20 px.** `get_design_context` on `28364:40176` times out (60 s) in
  both directions, and `get_metadata` does not carry radii. Measured off a 1:1 render of
  `28364:40718`, whose bounds sit exactly on the hero's top-left corner. Neighbouring known
  radii for calibration: dock cards 16, composer 32. **Confirm with the designer** — 16 / 20
  / 24 are all plausible and this is the page's most visible radius.
* **Page fill `Gray/950` `#09090b`.** `Gray/950` is present in the board-level
  `get_variable_defs` output and in *no* descendant's; an isolated render of the dock frame
  (`contentsOnly`) comes back fully transparent, so the near-black ground behind the dock
  must be the page frame itself. Marked as inference.

### Fixed vs fluid

| Band | Behaviour as built |
|---|---|
| Hero panel | **fluid width** (fills the frame minus 8 px each side), fixed height 812 |
| Topbar | fluid width, fixed 72 px height, `justify-between` |
| Hero content column | fluid; `Content` `28364:40190` = 1608 wide with a **16 px inset** inside the 1640 panel |
| Logo + headline + subtitle | fluid container, content **centred**; the text itself is `whitespace-nowrap` at 56 px, so it will *not* wrap — it will overflow below ≈ 800 px of content width |
| Composer + chips (`conteiner` `28364:40215`) | **fixed 960 px, centred** (x = 324 inside 1608 → 324 both sides). The chip row also carries an explicit `max-width: 960px`. |
| Dock | fluid width, 32 px side insets |
| Card grid | **fluid** — `List` `28364:40618` is `display:flex; gap:32px` with every card `flex: 1 0 0`. 6 cards → (1592 − 5 × 32) / 6 = **238.667**. 7 cards → (1592 − 6 × 32) / 7 = **200**. |

### Intent at other viewport sizes — *inference, not drawn*

Nothing responsive is drawn; all three boards are 1656 wide. My reading of the build:

* **960 px is a hard content max-width** for the composer + chip row (it is set twice:
  fixed width on `conteiner`, `max-w-[960px]` on the chip scroller). Below ~1000 px of
  content width the composer should become fluid with the same 8 px page inset.
* **The card grid is meant to reflow, not scroll.** Cards are `flex: 1`, so on a narrower
  viewport they simply get narrower; the drawn 238.667 / 200 widths are outputs, not inputs.
  A sane implementation caps the card count per row rather than letting cards shrink past
  ~200 px (which is exactly what board `28364:39116` shows at 7-up: the meta line
  `Updated 15 minutes ago` is 128 px wide inside a 200 px card — already tight).
* **The dock is "pinned to the bottom of the screen"** per the designer. As drawn it is not
  `position: fixed` — it is the second row of a two-row page. Since the hero is a fixed
  812 px and the dock a fixed 376 px, the two only add up to the viewport at exactly
  1188 px of height. **Open question (§12): does the hero flex to fill the remaining
  viewport height with the dock pinned, or does the page scroll?** The three boards differ
  by exactly the amount the dock changed (820/376, 868/328, 812/384 — each pair sums to
  1196), which strongly suggests **the hero absorbs the difference and the dock height is
  driven by its content**.

### Hero vertical rhythm (canonical board, y measured from the hero panel's top edge)

| From → to | y range | Height | What |
|---|---|---|---|
| padding-top of `Logo + Title` `28364:40191` | 0 → 160 | **160** | empty |
| `Logo` `28364:40192` | 160 → 256 | **96** | logo mark |
| gap (`Logo + Title`, `gap: 64`) | 256 → 320 | **64** | — |
| `Title text` `28364:40207` | 320 → 387.2 | **67** | headline, 56 px × 1.2 |
| gap (`28364:40206`, `gap: 11`) | 387.2 → 398.2 | **11** | — |
| subtitle block `28364:40210` | 398 → 454 | **56** | 2 lines × 28 (second line is an empty `​`) |
| padding-top of `conteiner` `28364:40215` | 454 → 490 | **36** | — |
| composer `28364:40218` | 490 → 628 | **138** | — |
| gap (`Input field + Text`, `gap: 24`) | 628 → 652 | **24** | — |
| prompt-chip row `28364:40319` | 652 → 694 | **42** | — |
| slack | 694 → 812 | **118** | empty |

The topbar overlays rows 0–72 of this stack, i.e. it sits on top of the 160 px of padding.

---

## 3. Topbar

`Menu` `28364:40718` → `Content` `28364:40719`

| Property | Value |
|---|---|
| Position / size | (8, 8) inside the page frame — **flush with the hero panel's top-left corner**; 1640 × **72** |
| Fill | **none** (transparent) |
| Effect | `backdrop-filter: blur(16px)` — the *only* thing it does to the hero behind it |
| Border | none |
| Layout | `display:flex; align-items:center; justify-content:space-between; padding-left:24px; padding-right:20px` |
| Left group `28364:40720` | `display:flex; gap:40px; align-items:center` (the 40 px gap is what separates the wordmark from the nav list) |
| `Logo + Menu` `28364:40721` | `gap: 48` |
| `Logotype` `28364:40723` | `gap: 8`, `align-items: center`; contains a **hidden 26 × 26 icon slot** (`28364:40724`) + the wordmark — so a logo *mark* next to the wordmark is designed but switched off |

### Wordmark

| Property | Value |
|---|---|
| Node | `28364:40747`, text box 103 × 20 at (0, 26) inside the 72 px bar |
| String | `Remixer` |
| Font | **Gilroy SemiBold**, **28 px**, line-height **1.4** (39.2 px) |
| Vertical trim | `text-box-trim: both; text-box-edge: cap alphabetic` — the 20 px box height is the **cap height**, not the line box |
| Letter-spacing | 0 |
| Colour | `Text/Default/Default` → **`#ffffff`** *(reference code's `#09090b` fallback is the light-theme trap)* |
| Interactive | rendered as `<a>` in the reference code → it is a link in Figma |

### Nav link (board `28364:39116` only — superseded)

`Menu list` `28364:39818` at (167, 29.5), `display:flex; gap:32px`; wrapper
`28364:39817` = 354 × 72 with `padding-top: 8; justify-content: center`.

* `Hosting` `28364:39819` — Proxima Nova Regular **15 px** / 1.4, `Text/Default/Default`
  `#ffffff`, box 51 × 21.
* A **second hidden item `Templates`** (`28364:39820`, 68 × 21) sits after it — the nav was
  planned as `Hosting · Templates`.

### Avatar

| Property | Value |
|---|---|
| Nodes | `Right` `28364:40758` (x = 1588, 32 × 72, `gap: 20`, `justify-content: flex-end`) → `28364:40811` (32 × 32 at y = 20) → `Avatar` instance `28364:40812` |
| Size | **32 × 32** (`Avatar/Medium` = 32) |
| Shape | `border-radius: var(--radius/full)` = **9999** |
| Ring | **not a CSS ring.** The leaf `img` (`I28364:40812;18401:67231`) is **34 × 34** placed at `inset: -3.13%` — it bleeds 1 px past the 32 px box on every side, and the violet→blue ring is **baked into the raster**. |
| Position on the page | right edge at board x = 1628, i.e. **20 px inside the hero panel's right edge** |
| Ring colours | ≈ violet `#7c5cf8` at the top-left → blue `#4a6bfb` at the bottom-right (**≈ measured**) |

---

## 4. Hero

The hero background is **five stacked layers** inside `Hero` `28364:40176`, listed
bottom → top exactly as Figma orders them:

| z | Node | Name | Size / position (inside the hero) | What it is |
|---|---|---|---|---|
| 1 | `28364:40177` | `Union` | 2548 × 812.115 @ (−454, 22) | **the dotted texture** (a boolean union of thousands of dots) — *not* the colour gradient |
| 2 | `28364:40178` | `Circles` | 1660.504 × 1660.504 @ (−10.25, −622) | 5 concentric-ish hairline rings |
| 3 | `28364:40185` | `Magenta` | 4128.525 × 4128.525 | huge blurred ellipse → **violet glow rising out of the bottom-LEFT corner** |
| 4 | `28364:40186` | `Blue` | 3377.436 × 3377.436 | huge blurred ellipse → **blue glow rising out of the bottom-RIGHT corner** |
| 5 | `28364:40187` | `Shadow` | 1640 × 272 @ (0, 272) | dark plate that puts contrast behind the headline |
| 6 | `28364:40188` | `Hero content` | 1640 × 812 @ (0, 0) | logo / headline / subtitle / composer / chips |

There is also a **hidden third glow** — `Orange` `28364:40184`, 2752.9 × 2752.9 @
(818.9, 536) — present on all three boards and switched off on all three.

### 4.1 The big background gradient

**There is no single gradient layer.** The purple→blue field is produced by two enormous
blurred ellipses over the dark ground. That matters for implementation: you cannot copy one
`linear-gradient` and be done.

| Layer | Evidence | Rendered behaviour |
|---|---|---|
| `Magenta` `28364:40185` | Rasterised by Figma to a 4000 × 4000 PNG with `inset: -16.67%` → the blur radius is ≈ 688 px. Isolated render fills the whole hero. | Saturated violet **≈ `#c77dfa`** hard against the bottom-left corner, decaying to nothing along a diagonal that leaves the top-right corner clean. |
| `Blue` `28364:40186` | Isolated render is clipped to hero x = **32 → 1640** (so the glow's reach starts 32 px in from the left). | Blue **≈ `#7c93f8`** anchored at the bottom-right corner, decaying diagonally up and left. |

Both are marked **≈ measured** (colours read off isolated renders; the fills are raw, not
token-bound, and `get_design_context` rasterises any layer that carries a blur, so the
stops are not recoverable through the MCP).

Composited colours sampled off the 1:1 board render (**≈ measured**, all approximate):

| Sample point (board coords) | Colour |
|---|---|
| top-left (20, 20) | `#0d0d13` |
| top-centre (828, 20) | `#101018` |
| top-right (1630, 20) | `#0e1018` |
| mid-left (20, 400) | `#3a1f52` |
| mid-right (1630, 400) | `#1b2452` |
| bottom-left (20, 800) | `#b055d8` |
| bottom-centre (828, 810) | `#6a3fb0` |
| bottom-right (1630, 810) | `#2f4fc0` |

**Practical recipe** (equivalent, cheap, and honest about what it approximates):

```css
/* on a #09090b ground, inside the 8px-inset rounded hero panel */
background:
  radial-gradient(120% 95% at 0% 118%,  #c77dfa 0%, rgba(199,125,250,0) 62%),
  radial-gradient(115% 95% at 102% 120%, #7c93f8 0%, rgba(124,147,248,0)  60%),
  #09090b;
```

🛠 **QA correction, 25 Aug 2026 — this recipe does not reproduce the samples above.
Do not build from it; build from `.home-hero` in `prototype/src/index.css`.** Evaluate the
magenta layer at the mid-left sample (20, 400) in a 1640 × 812 panel: the ellipse is
centred at (0, 958.2) with an ending shape of 1968 × 771.4, so the point sits at
√((20/1968)² + (558.2/771.4)²) = **72.4 % of the ending shape**, past the 62 % stop where
the alpha is already 0. The recipe therefore paints **zero magenta at mid-left**, where the
table says `#3a1f52`. The blue layer fails the same way at (1630, 400). Two radial
gradients cannot carry both a near-black top edge and a saturated bottom edge without
putting their ending shapes — which are hard edges — inside the panel; the shipped version
hands the vertical ramp to a separate linear veil for exactly that reason, and the
composite is measured against all eight samples in the QA report.

⚠️ **Performance note, from this project's own history.** `CLAUDE.md` records that large
blurred surfaces cost essentially the whole frame budget (4 fps with the Siri glow on, 60
with it off). Two 4000 px blurred ellipses must **not** be implemented as real
`filter: blur()` layers. Use static radial gradients (above) or one baked PNG. Do not
animate them.

### 4.2 The `Shadow` plate

`28364:40187`, 1640 × 272 at (0, 272), radius 0:

```css
/* ❌ what get_design_context emits — the direction is REVERSED, see below */
background: linear-gradient(to bottom, rgba(18,18,23,0) 0%, #121217 80.288%);

/* ✅ what the layer actually draws */
background: linear-gradient(to bottom, #121217 0%, rgba(18,18,23,0) 80.288%);
```

🛠 **QA correction, 25 Aug 2026 — the dark end is at the TOP.** An isolated render of the
layer (`get_screenshot 28364:40187, contentsOnly`) composites its alpha over white and comes
back **opaque near-black across its top ~18 %, ramping to white by ~88 %** — i.e. alpha 1 at
the top, 0 at the bottom. Figma stores a gradient as stops *plus* handle positions and the
code export carries only the stops, so a flipped handle is invisible to it. Taken the
export's way the plate is fully opaque from y = 490 to its bottom edge at 544 and then jumps
(124, 49, 153) in RGB into the glow below — a hard line across the whole panel that the
board does not have. Both versions were built and screenshotted before trusting the render.

Two consequences the implementation has to carry:

* the plate's **top edge is the hard one**, so the field above it must already *be* `#121217`
  at y = 271 or the seam shows there instead — that is a continuity constraint on the
  background fit, not a free parameter;
* the band is **272 / 812 = 33.4975 % of the panel, not 272 absolute pixels**. Every other
  layer in the hero is proportional; pinning the plate in pixels only lines up at the drawn
  812, and at 1440 × 900 (panel 516) the edge lands at 53 % of the ramp and draws a visible
  full-width line under the subtitle.

It covers hero y 272 → 544, i.e. exactly the headline (320–387), the subtitle (398–454) and
the top of the composer (490–544). `#121217` is a **raw hex, not a token**.

### 4.3 The dotted texture

`Union` `28364:40177` — a vector union of dots, **2548 × 812.115** at (−454, 22), so only
hero x 0→1640 (= Union x 454→2094) is visible.

| Property | Value |
|---|---|
| Lattice | square grid |
| Cell size (pitch) | **≈ 12.8 px** (≈ measured off a 0.98× isolated render; 12.5–13 is the confidence band) |
| Dot diameter | **≈ 1.5 px** (≈ measured) |
| Colour | a **gradient across the whole field**: neutral grey at the top (≈ `Gray/700` `#3f3f46`, the token is present in the hero subtree), turning **magenta/pink at the bottom-left** and **blue/violet at the bottom-right** — i.e. the dots pick up the same hue axis as the glows. Dots are practically invisible in the dark top half and clearly visible in the coloured bottom half. |

Implementation:

```css
background-image: radial-gradient(circle, currentColor .75px, transparent .75px);
background-size: 12.8px 12.8px;
```
…with the colour supplied by a gradient-masked overlay. **The pitch is the one number in
this section I would confirm with the designer** (or get as a PNG/SVG export) before
shipping.

### 4.4 The concentric rings

`Circles` `28364:40178` — five ellipses, **no fill, 1 px stroke each**.

**Stroke (derived, and I am fairly confident):** a **1 px linear gradient from
`White/100` `#ffffff14` (8 % white) to `Background/Neutral/200` `#33333a`**. Evidence: the
subtree's only two colour variables are exactly those two; an isolated render on a *white*
ground shows only two arcs per ring (the `#33333a` end — the 8 %-white end disappears),
while the same ring rendered on the *dark* page shows a complete ring (both ends visible).
A solid stroke could not produce both observations. Axis appears to run **left → right**
(transparent at the left edge, `#33333a` at the right) — **≈ measured, confirm.**

Raw geometry from `get_metadata` (all sizes are exact, positions are in the coordinate
space that `get_metadata` reports for these nodes):

| Node | Name | x, y | Diameter | Derived centre | Radius |
|---|---|---|---|---|---|
| `28364:40179` | `Ellipse 3` | −10.25, −365.125 | 1660.504 | (820.00, 465.13) | 830.25 |
| `28364:40180` | `Ellipse 1180` | 404.891, 861.021 | 1305.527 | (1057.65, 1513.78) | 652.76 |
| `28364:40181` | `Ellipse 1179` | 420.004, −191.739 | 800.000 | (820.00, 208.26) | 400.00 |
| `28364:40182` | `Ellipse 2` | 820.000, −142.019 | 700.564 | (1170.28, 208.26) | 350.28 |
| `28364:40183` | `Ellipse 1` | 701.793, 326.467 | 236.418 | (820.00, 444.68) | 118.21 |

⚠️ **Coordinate-space caveat — read this before you place the rings.** Elsewhere in the
file `get_metadata` reports child coordinates **relative to the parent** (verified:
`Hero content` is 0,0 inside a `Hero` that is 8,8). For these five ellipses that
interpretation puts every ring's centre **above** the hero and makes `Ellipse 1`
invisible, which contradicts the render. Interpreting them as **hero-relative** works: it
predicts `Ellipse 1`'s top at hero y ≈ 327 near x ≈ 820, which is exactly where an arc
appears in the isolated render; and `Ellipse 1179` (r = 400) lands centred on the logo
(logo centre = 804, 208 — ring centre = 820, 208.26). **The table above uses the
hero-relative reading.**

🛠 **QA, 25 Aug 2026 — hero-relative is now VERIFIED, twice, and no longer an inference.**
`get_screenshot` on the two decisive rings reports the node's own natural size *after* the
hero's clip:

* `28364:40181` (`Ellipse 1179`, nominally 800 × 800) comes back **800 × 608** — clipped by
  exactly 192 px, which is the 191.739 the hero-relative reading predicts above the panel's
  top edge. Read parent-relative the ring would start at hero y ≈ −814 and render as nothing.
* `28364:40183` (`Ellipse 1`, 236.418²) comes back **236 × 236, unclipped** — only possible
  if it sits at hero y 326.5 → 562.9, i.e. wholly inside the panel. Parent-relative puts it
  at hero y −295 → −59, entirely above the panel.
Note the family is *not* strictly concentric — three rings share centre x = 820, two share
centre y = 208.26, and `Ellipse 1180` is an outlier that sits almost entirely below the
hero (its topmost point is at y = 861, i.e. off-panel) and contributes only via the clip.

Practically: this is decoration. If the exact centres cannot be confirmed, ship
`Ellipse 1179` (r = 400 around the logo), `Ellipse 2` (r = 350.28), `Ellipse 1`
(r = 118.21) and `Ellipse 3` (r = 830.25) at 1 px `rgba(255,255,255,.06)` and drop
`Ellipse 1180`; nobody will be able to tell.

### 4.5 The logo mark

| Property | Value |
|---|---|
| Nodes | `Logo` `28364:40192` (`display:flex; align-items:center; justify-content:center`) → `Logotype` `28364:40193` |
| Box | **96.009 × 95.9998** — treat as **96 × 96** |
| Position | (755.995, 160) inside the 1608 content column → horizontally centred |
| Padding / gap | none |

**What it looks like** (from an isolated 96 px render): a 2 × 2 arrangement of 48 px cells —
**top-left and bottom-right are grey squares** (grey gradient), **top-right is a blue
circle**, **bottom-left is a violet circle**; a **white 48 × 48 square sits over the centre
with a four-pointed concave star knocked out of it**, so the star reads dark on white.

✅ **This mark already exists in the prototype**: `LogoRemixer` in
`/home/user/Remixer/prototype/src/ui/icons.tsx`. Its `viewBox` is `0 0 120.012 120`, its
circles are at (30, 90) violet and (90, 30) blue, its grey squares use
`#71717A → #3F3F46`, and its accent gradient runs `#BE59FF → #9D60FF → #4274FF → #1F7CFF`
bottom→top. That is a pixel-for-pixel match to the Figma mark. **Reuse it at `size={96}`.**

### 4.6 Headline

| Property | Value |
|---|---|
| Container | `Title text` `28364:40207` — 735 × 67, `display:flex; gap:8px; justify-content:center; align-items:flex-start`, `text-align:center`, `white-space:nowrap` |
| Two text nodes | `28364:40208` = **`Describe it.`** (290 × 67) · `28364:40209` = **`Remixer builds it.`** (437 × 67), 8 px apart |
| Font family | **Gilroy SemiBold** (token `Title Page/Font Family` = `Gilroy`) |
| Size | **56 px** |
| Line-height | **1.2** → 67.2 px |
| Letter-spacing | **0** |
| Colour | `Text/Default/Default` → **`#ffffff`** |
| Note | `28364:40209` comes back as `<a class="cursor-pointer">` — the second half of the headline carries a **link/prototype interaction** in Figma. Almost certainly accidental; flagged in §12. |

### 4.7 Subtitle

| Property | Value |
|---|---|
| Node | `28364:40213`, box 460 × 56, inside wrapper `28364:40210` (460 × 56 at x = 137.5, `display:flex; gap:5px; align-items:center; justify-content:center`) |
| String (verbatim) | **`Create stunning apps & websites by chatting with AI.`** |
| Font | **Proxima Nova Regular**, **20 px**, line-height **1.4** → 28 px |
| Letter-spacing | 0 |
| Colour | `White/800` → **`#ffffffb8`** (72 % white) |
| ⚠️ | The text node contains a **second, empty paragraph** (a bare `​`). That is why the box is 56 px (2 × 28) instead of 28. **Do not render the empty line — but do keep the 28 px it occupies.** Render 28 px of text and add the other 28 px to the gap that follows (so the 36 px `conteiner` padding-top becomes 64 px). The empty line is invisible either way; the 28 px is *not* — it is what puts the composer at hero y = 490, which is where the board draws it. Delete the space as well as the line and the composer, the chips and the whole lower half move up 28 px. |
| 🛠 | **QA correction, 25 Aug 2026.** The instruction above used to read "take the extra 28 px out of the rhythm, or the composer lands 28 px lower than the mock", which is backwards on both halves: removing the space moves the composer *up*, and the only way to land it 28 px *low* is to render the empty line **and** keep the gap. Rewritten to state the rule as one action. |

### 4.8 Vertical gaps, one list

`160` (pad-top) → logo 96 → `64` → headline 67 → `11` → subtitle 56 (28 real + 28 phantom)
→ `36` (composer pad-top) → composer 138 → `24` → chip row 42 → `118` slack.

---

## 5. Composer

`conteiner` `28364:40215` → `Input field + Text` `28364:40216` → `28364:40217` →
`Input field` `28364:40218` → **`Input field gradient` `28364:40219`** (the visible box).

### 5.1 The field

| Property | Value (canonical `28364:40219`) |
|---|---|
| Size | **960 × 138**, fixed width, centred |
| Fill | `Black/900` → **`rgba(9, 9, 11, 0.8)`** |
| Backdrop | **`backdrop-filter: blur(16px)`** |
| Border | **1 px solid** `Neutral Alpha/100` → **`#ffffff14`** (8 % white) |
| Radius | **32** |
| Shadow | **`0 16px 80px 0 rgba(0, 0, 0, 0.08)`** |
| Padding | `padding: 17px 16px 16px 0` (the left inset is carried by the two inner rows) |
| Gap | **17** between the text row and the button row |

⚠️ **The node is named `Input field gradient` but on the canonical board the border is a
flat hairline.** The gradient border only exists on the superseded board `28364:39116`
(`28364:39282`): **3 px**, radius 24, fill `Black/800` `rgba(9,9,11,0.72)`, and a border
gradient that the code generator flattened to the single stop **`#c46082`**. Read off the
render (**≈ measured**) it runs: magenta/rose `#c46082` on the left flank → violet →
blue `#4a6bfb` across the top-left → neutral grey along the top-right and right flank →
back to violet/rose at the bottom-left. **Do not build it** — the canonical board
deliberately replaced it with the 1 px hairline. Keep the layer name in mind so nobody
"restores" a gradient that was designed away.

### 5.2 Text row

`Text` `28364:40220` — 944 × 52, `display:flex; gap:1px; align-items:flex-start;
padding-left:24px; padding-right:8px`.

| Element | Node | Spec |
|---|---|---|
| Caret | `28364:40221` (wrapper, `padding-top: 5`, stretch) → `28364:40222` | box **0 × 16**; the SVG is drawn at `inset: -3.13% -0.5px` → renders as a **1 px × 17 px** bar. Colour `Text/Default/Default` → **`#ffffff`**. Sits at x = 24. |
| Placeholder | `28364:40223`, box 128 × 52 at x = 25 | **`e.g. Bella’s Bakery`** — note the **typographic apostrophe `’` (U+2019)**. Proxima Nova Regular **16 px**, line-height **26 px**, colour `Background/Neutral/500` → **`#c7c7cd`** *(the `#71717a` in the reference code is the light-theme trap)*. |
| ⚠️ | | This node also carries a **second empty paragraph** — that is why the row is 52 px (2 × 26) instead of 26. |
| 🛠 | | **QA correction, 25 Aug 2026: this is NOT "the same caveat as the subtitle".** The subtitle's phantom line sits *between* elements, so its 28 px can be moved into the following gap. This one sits *inside* the field: 17 + **52** + 17 + 36 + 16 = the composer's drawn 138. Take the phantom out here and the field itself becomes 112 and every button in it moves — so the row keeps `height: 52` with a single 26 px line of text in it, and only the empty line is dropped. |

### 5.3 Button row

`Buttons` `28364:40224` — 944 × 36, `display:flex; align-items:center;
justify-content:space-between; padding-left:16px`.

**Left — the `+` button** (`Edition buttons` `28364:40225`, `gap: 4`):

| Property | Value |
|---|---|
| Nodes | `AI Chat icon button` `28364:40226` → `container` `28364:40227` → `state-layer` `28364:40228` → `Icon` `28364:40229` |
| Button box | **36 × 36** at x = 16 |
| Fill | **none** |
| Border | 1 px `Neutral Alpha/100` → **`#ffffff14`** |
| Radius | **100 px** (i.e. a circle) |
| Icon | **24 × 24**, centred (6 px inset all round). Glyph: a plain thin **plus**. |
| Also present, hidden | `AI Chat Button` `28364:40230` (65 × 32) and `Icon button` `28364:40231` (40 × 40) |

**Right group** `28364:40232` — 138 × 36 at x = 806, `display:flex; gap:16;
align-items:center`. Its right edge is at 944, i.e. **16 px inside the field's right edge**.

*Mic button:*

| Property | Value |
|---|---|
| Nodes | `Icon button` `28364:40234` → `container` `28364:40235` → `state-layer` `28364:40236` → `Icon` `28364:40237` |
| Box | **36 × 36** |
| Fill | none |
| Border | 1 px `Neutral Alpha/100` → **`#ffffff14`**, radius **999** (outer `container` radius 100) |
| Icon | 24 × 24 box, **leaf `Mic S` = 20 × 20** (preserve both — the leaf is *not* 24) |
| Glyph | classic microphone: rounded capsule + arc stand + base stem |

*Build button — **as drawn (reads disabled)**:*

| Property | Value (`28364:40242`) |
|---|---|
| Box | **86 × 36** at x = 52 |
| Fill | `Neutral Alpha/100` → **`#ffffff14`** (8 % white) |
| Border | **none** |
| Radius | **12** |
| Overflow | clipped |
| Inner `state-layer` `28364:40243` | `display:flex; gap:6; align-items:center; justify-content:center; padding:10px 6px 10px 18px` |
| Label `28364:40244` | **`Build`** — text style **`Label Medium Strong`** = Proxima Nova **Semibold**, size `Label/Size Base` = **14 px**, weight 600, line-height **100 %**, letter-spacing 0. Colour `Neutral Alpha/300` → **`#ffffff3d`** (24 % white). Box 32 × 17 at (18, 9.5). |
| ⏎ glyph | `Enter` `28364:40245`, **24 × 24** at (56, 6). Glyph = the standard **return arrow ↵** (a leftward arrow with an upward hook). |

### 5.4 The enabled Build state — **it IS drawn**

Three `Button` frames are stacked at the identical position `(52, 0) 86 × 36` inside
`28364:40232`; two are hidden. All three share radius 12, `padding: 10px 6px 10px 18px`,
`gap: 6`, the 14 px `Label Medium Strong` label, and the 24 × 24 `Enter` glyph — **only the
fill and label colour change**. This is the button's state set, hand-built rather than made
into a Figma variant set.

| State | Node | Visible | Fill | Label colour | Reads as |
|---|---|---|---|---|---|
| **Enabled / active** | `28364:40238` | hidden | `Background/Neutral/950` → **`#fafafa`** in dark *(light fallback `#09090b`)* | `Text/Default/On Default` → **`#09090b`** | near-white pill, near-black label |
| **Idle / disabled** (drawn) | `28364:40242` | **visible** | `Neutral Alpha/100` **`#ffffff14`** | `Neutral Alpha/300` **`#ffffff3d`** | ghost pill, 24 % label |
| **Third state** (hover or pressed) | `28364:40246` | hidden | `Background/Neutral/850` → light-theme fallback `#1f1f22`; **dark value not resolvable** (hidden nodes return no variable data) — by ramp position it is a **light grey between `#c7c7cd` and `#f7f7f7`** | `Gray/600` **`#52525b`** | light-grey pill, mid-grey label |

So: **the enabled Build button is a near-white `#fafafa` pill with a `#09090b` label — it
is not blue.** That is consistent with the active tab pill in the dock (also
`Neutral Alpha/1000` white on dark), and **inconsistent with the verified brand rule
"`#1587FF` = action"** recorded in `CLAUDE.md`. Raised in §12.

For reference, the design system's own Filled/Blue/Medium/Rounded button
(`1404:13042` enabled, `1404:13581` disabled) is: enabled = `Background/Blue/Default`
**`#0073ec`**, height 40, radius 999, `padding: 10px 8px 10px 24px`, gap 8, label
`Text/Default/White` white; disabled = **no fill**, 1 px `Neutral Alpha/200` border, label
`Neutral Alpha/400`. **The composer's Build button matches neither** — it is a detached
frame at height 36 / radius 12. The DS `Button` set (frame `36:1035`, 69 Filled variants)
carries `State = Enabled | Disabled | Hovered | Pressed` × `Style = Filled | Outlined |
Text | Tonal` × `Color = Dark | White | Blue` × `Shape = Square | Rounded` × `Size = Small |
Medium`, and **no variant matches 36 px / radius 12** — the composer buttons are bespoke.

---

## 6. Prompt chips row

`28364:40319` → `Text` `28364:40320` → **scroller `28364:40328`** → `List` `28364:40329`
+ end cap `28364:40339`.

| Property | Value |
|---|---|
| Row height | **42** |
| Scroller `28364:40328` | `flex: 1 0 0; display:flex; align-items:center; max-width: 960px; overflow: clip` |
| `List` `28364:40329` | **912** wide, `flex: 1 0 0; display:flex; gap:8px; align-items:center; overflow: clip` |
| Total intrinsic width of the 9 chips | **1502** → the list is clipped at 912, so the 6th chip is cut mid-word |
| Gap between chips | **8** |

### Chips, in drawn order

| # | Node | Label (verbatim) | Width | Height |
|---|---|---|---|---|
| 1 | `28364:40330` | `E-commerce Storefront` | 182 | **40** (y = 1) |
| 2 | `28364:40331` | `Landing page` | 124 | 42 |
| 3 | `28364:40332` | `Portfolio` | 92 | 42 |
| 4 | `28364:40333` | `Personal Portfolio Website` | 202 | 42 |
| 5 | `28364:40334` | `SaaS Product Landing Page` | 210 | 42 |
| 6 | `28364:40335` | `SaaS Product Landing Page` | 210 | 42 (clipped — only `SaaS ` is visible) |
| 7 | `28364:40336` | `Landing page` | 124 | 42 (off-screen) |
| 8 | `28364:40337` | `Portfolio` | 92 | 42 (off-screen) |
| 9 | `28364:40338` | `Personal Portfolio Website` | 202 | 42 (off-screen) |

Chips 5–9 repeat 1–4's vocabulary — the list is **placeholder filler**, not a curated set
(§12). Chip 1 is **40 px tall at y = 1** while all the others are **42 px at y = 0** —
almost certainly an accident; ship them all at 40 (see below).

### Chip style

All nine are instances of the same component,
**`Button/Outlined/Enabled/None/Medium/Dark/Rounded`** (`16407:75362`).

| Property | Value |
|---|---|
| Fill | `Black/200` → **`rgba(9, 9, 11, 0.16)`** (16 % black) |
| Border | 1 px solid `White/300` → **`#ffffff3d`** (24 % white) |
| Radius | **999** |
| Height | **40** (the component's own height; the 42 px instances are stretched) |
| Inner `state-layer` | `height: 40; padding: 10px 20px; display:flex; align-items:center; justify-content:center` |
| Label | Proxima Nova **Regular**, **14 px**, line-height `normal`, colour `White/900` → **`#ffffffcc`** (80 % white) |
| Overflow | clipped |

### End cap: the circular arrow button

`28364:40339` — 48 × 42 at x = 912, `display:flex; gap:24; align-items:center;
padding-left:8`.

| Property | Value |
|---|---|
| Button `28364:40340` | **40 × 40** at (8, 1) |
| Fill | `Black/300` → **`rgba(9, 9, 11, 0.24)`** |
| Backdrop | **`backdrop-filter: blur(10px)`** |
| Border | 1 px `White/200` → **`#ffffff1f`** (12 % white) |
| Radius | **999** |
| Layout | `gap: 8; align-items:center; justify-content:center; padding-left: 2` |
| Icon | `Frame` `28364:40343`, **20 × 20** at (11, 10) inside the 40 px circle — **not optically centred**: 11 px left / 9 px right / 10 px top / 10 px bottom |
| Glyph | **chevron-right `›`** (not a full arrow) |
| Also present, hidden | an alternate icon `28364:40341`, 20 × 20 at (−3, 10) |

### How the row's edge is faded — read this carefully

The fade is **not** a mask and **not** a gradient of the underlying background. It is an
**opaque rectangle painted on top of the last chip**, hard-coded to the hero colour at that
one spot:

`Rectangle 1162905184` `28364:40378` — **48 × 44 at (864, −1)** in the 960-wide row
(i.e. `position:absolute; right:48px; bottom:-1px; width:48px; height:44px`):

```css
background: linear-gradient(to right, rgba(40,56,107,0) 6.25%, #283a71 98.958%);
```

`#283a71` is a **raw hex** matched by eye to the hero gradient behind the right-hand end
of the chip row. Consequences:

* it will visibly mis-match the moment the hero gradient, the row's y-position or the
  viewport width changes;
* on the render it reads as a **blue highlighted chip**, not as a fade — which is how a
  reviewer will read it too.

**Implement it as a real edge fade instead** — `mask-image: linear-gradient(to right,
#000 calc(100% - 64px), transparent)` on the scroller, and let the true background show
through. Flagged in §12 as a design bug rather than a spec detail.

---

## 7. Bottom dock

### 7.1 The shell

| Property | Value |
|---|---|
| Wrapper | `28364:40576` — (0, 820) **1656 × 376**, full-bleed |
| Fill | **none** — an isolated render comes back transparent; the near-black you see is the page frame (`Gray/950` `#09090b`) |
| Top edge | **nothing**: no border, no hairline, no shadow, no blur. The hero panel's rounded bottom corners are the only visual separation. |
| `Sections` `28364:40579` | (0, 0) 1656 × 376 |
| `Webites` `28364:40580` | **(32, 0) 1592 × 352** → 32 px side insets, **24 px of unused space at the bottom** |
| `Title` row `28364:40581` | 1592 × **80**, `display:flex; align-items:center; padding-right:8px` |
| `Conteiner` `28364:40617` | (0, 80) 1592 × **272** |
| Hidden layers in this frame | `Rectangle 1162905190` (1656 × 768) and a second dot-texture `Union` (2548 × 812.115) — both switched off |
| ⚠️ | `Gray/850` `#1f1f22` appears in the dock's variable list but cannot be attributed to any *visible* layer (the visible tabs and cards do not use it). It comes from a hidden descendant — most likely the hidden 640 × 469 `Website` cards. Do not paint the dock `#1f1f22`. |

### 7.2 State (a) — segmented tabs (canonical)

`Tabs (Small)` `28364:42996` — **211 × 44** at (0, 18) inside the 80 px `Title` row, so it
is **flush with the card grid's left edge** at board x = 32.

**Track:**

| Property | Value |
|---|---|
| Fill | `Neutral Alpha/50` → **`#ffffff0a`** (4 % white) |
| Border | **1 px solid** `Neutral Alpha/400` → **`#ffffff52`** (32 % white) |
| Radius | **999** |
| Padding | **6** all round |
| Gap | **6** |
| Shadow | **none** |

**Active pill** — `Tab` `28364:42997` → `state-layer` `I28364:42997;28364:42903`:

| Property | Value |
|---|---|
| Size | **101 × 32** at (6, 6) |
| Radius | **999** |
| Fill | two stacked solid fills: `Neutral Alpha/1000` → **`#ffffff`** over `Gray/200` **`#e4e4e7`** → effectively **`#ffffff`**. *(The reference code emits `linear-gradient(90deg, rgb(9,9,11) …), linear-gradient(90deg, rgb(228,228,231) …)` — the first is the light-theme resolution of `Neutral Alpha/1000`.)* |
| Padding | `0 14px` |
| Shadow | **none** |
| Label | `My projects` — Proxima Nova **Semibold** 14 px, `text-box-trim: both / cap alphabetic`, colour `Text/Default/On Default` → **`#09090b`** |

**Inactive tab** — `Tab` `28364:42998` → `state-layer` `I28364:42998;28364:42885`:

| Property | Value |
|---|---|
| Size | **92 × 32** at (113, 6) |
| Radius | **8** ⚠️ *not* 999 — see §12 |
| Fill | none |
| Padding | `0 14px` |
| Label | **`Templates `** — note the **trailing space**. Font **`Proxima Nova W05 Medium`** (a different family string from the active tab's `Proxima Nova Semibold`), 14 px, cap-trimmed, colour `Text/Default/Secondary` → **`#ffffff7a`** (48 % white) |
| Interactive | rendered as `<a>` |

**Alternate size, hidden:** `Tabs (Medium)` `28364:42954` — **215 × 48** at (0, 16), tabs
102 × 40 and 101 × 40 at a 4 px inset. Available if 44 px feels small.

### 7.3 State (b) — Templates heading + filter chips

Board `28375:43006`. `Title` `28375:43532` — 1592 × **88**,
`display:flex; align-items:center; justify-content:space-between`.

**Heading** `28375:43534` (box 153 × 22 at (0, 33)):

| Property | Value |
|---|---|
| String | **`Templates`** |
| Font | **Gilroy SemiBold**, **32 px**, line-height **1.4**, cap-trimmed |
| Colour | literal **`#ffffff`** (not token-bound) |

**Filter chip row** `Tabs Alt` `28376:43912` — **731 × 68** at (861, 10),
`padding: 16px 8px 16px 16px`; `Tab group` `28376:43913` = **707 × 36**,
`display:flex; gap:8px; align-items:center`. Right-aligned to the 1592 content width.

| # | Node | Label (verbatim) | Width | State |
|---|---|---|---|---|
| 1 | `28376:43914` | `All templates` | 112 | **active** |
| 2 | `28376:43915` | `Ecommerce` | 105 | default |
| 3 | `28376:43916` | `Portfolio` | 86 | default |
| 4 | `28376:44055` | `Business & services` | 151 | default |
| 5 | `28376:44059` | `Health And Beauty` | 146 | default |
| 6 | `28376:44063` | `More` | 67 | default |

Component: **`Tab Alt (Dark theme)`** — active inner `19656:66917`, default `19656:66826`.

| | Active | Default |
|---|---|---|
| Height | 36 | 36 |
| Radius | 999 | 999 |
| Padding | `0 18px` | `0 18px` |
| Fill | `Background/Neutral/900` → **`#f7f7f7`** in dark *(light fallback `#18181b`)* | **none** |
| Border | none | **1 px** `White/200` → **`#ffffff1f`** (12 % white) |
| Label | Proxima Nova Semibold **13 px** / 1.4, cap-trimmed, `Text/Default/On Default` → **`#09090b`** | same type, `Text/Default/Default` → **`#ffffff`** |

Note: **`Health And Beauty`** is Title-Cased inconsistently ("And" capitalised) and
`Ecommerce` has no hyphen while the hero chip says `E-commerce Storefront` (§12).

### 7.4 The card grid

`Conteiner` `28364:40617` → `List` `28364:40618`:
`display:flex; gap:32px; align-items:flex-start; width:100%`. Every card is
**`flex: 1 0 0`**, so card width is derived, not fixed.

| Board | Cards | Card width | Card height | Thumbnail height |
|---|---|---|---|---|
| `28364:40053` | 6 | **238.667** | **272** | 216 (card 1) / 168 (placeholders) |
| `28375:43006` | 6 | **238.667** | **272** | 216 (card 1) / 218 (cards 2–6) |
| `28364:39116` | 7 | **200** | **224** | 168 |

**Real project card** — `Website` `28364:40628`:

| Element | Node | Spec |
|---|---|---|
| Root | `28364:40628` | `display:flex; flex-direction:column; align-items:flex-start`; **radius: 8 8 16 16** (top-left/top-right 8, bottom-left/bottom-right 16); **no fill, no border** |
| Thumbnail frame | `28364:40629` | `flex: 1 0 0`; `display:flex; flex-direction:column; gap:10; align-items:center; overflow:clip`; **radius 12**; width 100 % → 238.667 × **216** |
| Thumbnail image | `28364:40631` | **aspect-ratio 1650 / 1734** (= 0.9516) → intrinsic box **238.667 × 250.817**, radius 8, `object-fit: cover`. Because the box is 250.8 tall inside a 216-tall clip, **the bottom ~14 % is cropped, top-aligned.** |
| Meta bar | `28364:40632` | `display:flex; align-items:center; justify-content:space-between; width:100%` → 238.667 × **56** at y = 216 |
| Text block | `28364:40633` | `display:flex; flex-direction:column; align-items:flex-start; padding: 12px 0 1px 4px` |
| Name + meta | `28364:40634` | `display:flex; flex-direction:column; gap:5` |
| Name | `28364:40635` | **Gilroy Medium 18 px**, line-height `normal`, `Text/Default/Default` → **`#ffffff`** |
| Meta | `28364:40636` | **Proxima Nova Regular 12 px**, line-height **1.4**, `Text/Default/Secondary` → **`#ffffff7a`** (48 % white) |
| Kebab | `28364:40637` | **40 × 40** at (198.667, 8); `container` `28364:40638` radius **10**, `overflow:clip`, **no fill, no border**; `state-layer` `28364:40639` `padding: 8`; `Icon` `28364:40640` 24 × 24 box, radius 6, **leaf 20 × 20**; glyph = **vertical three-dot ⋮** |

**Dashed empty placeholder** — `Website` `28364:40657` (and `40666`, `40675`, `40684`,
`40693`):

| Property | Value |
|---|---|
| Structure | **exactly the real card**, with both children set to `opacity: 0` and a dashed border added to the root |
| Root | `border: 1px dashed` `Neutral Alpha/200` → **`#ffffff1f`** (12 % white); **radius 16** (uniform, unlike the real card's 8/8/16/16); `flex: 1 0 0; align-self: stretch; display:flex; flex-direction:column; gap:9` |
| Dash pattern | **≈ 6 px dash / 6 px gap (≈ measured)** — Figma's dash values are not exposed by the MCP; confirm |
| Size | 238.667 × 272 |
| Hidden content | thumbnail frame `h: 168`, radius 8, `opacity: 0`, image aspect **1730 / 1756** → box 238.667 × 242.254; text block `opacity: 0` |
| ⚠️ | The placeholder's hidden name uses **Gilroy SemiBold**, the real card's uses **Gilroy Medium**. Invisible, but it tells you the placeholders were duplicated from an older card. |

**Template card** (board `28375:43006`) — differences from the project card:

| Property | Value |
|---|---|
| Card 1 `28375:43585` | thumbnail frame **radius 8** (the canonical project card uses **12**); image aspect 1650/1734, radius 8 |
| Cards 2–6 | thumbnail frame height **218**, meta bar 54 at y = 218 |
| Card 2 `28376:43910` only | the thumbnail image carries **1 px solid `Background/Neutral/900`** (dark `#f7f7f7` — a near-white hairline). None of the other five has it. |
| Text block | card 1: `padding: 14px 0 0 4px`, `gap: 6` · cards 2–6: `padding: 12px 0 1px 4px`, `gap: 5` |
| Name | **Gilroy Medium 16 px** (all six) |
| Description | Proxima Nova Regular 12 px / 1.4, `Text/Default/Secondary` `#ffffff7a` |
| Kebab | present in the tree on all six but **`opacity: 0`** — no template card shows a kebab |
| Card 5 `28376:43879` | has **no child image rect** — the thumbnail fill sits on the `Image` frame itself |
| Thumbnail image boxes | card 2 `238.667 × 241.182` · card 3 `238.667 × 159.821` (**shorter than the 218 clip → 58 px of empty space below it**) · card 4 `238.667 × 242.254` · card 6 `238.667 × 238.667` (square) |

---

## 8. Card content — verbatim strings

### Board `28364:40053` (My projects)

| Slot | Node | Name | Meta |
|---|---|---|---|
| 1 (real) | `28364:40635` / `40636` | **`synco.com`** | **`Updated 1 hour ago`** |
| 2–6 (dashed, invisible) | `40664/40665`, `40673/40674`, `40682/40683`, `40691/40692`, `40700/40701` | `synco.com` | `Updated 15 minutes ago` |

### Board `28364:39116` (My projects, 7-up)

| Slot | Name | Meta |
|---|---|---|
| 1 (real) | `synco.com` | `Updated 1 hour ago` |
| 2–7 (dashed, invisible) | `synco.com` | `Updated 15 minutes ago` |

### Board `28375:43006` (Templates) — in drawn order

| # | Node (name / desc) | Name | Description |
|---|---|---|---|
| 1 | `28375:43592` / `43593` | **`AI Moodboard Canvas`** | **`Drag-and-drop images with text notes`** |
| 2 | `28376:43819` / `43820` | **`Homeware store website template`** | **`Dual-image cards with saved wishlist`** |
| 3 | `28376:43837` / `43838` | **`Marketing Campaign Hub`** | **`Launch checklists, UTM links, and funnel`** |
| 4 | `28376:43869` / `43870` | **`Budget Dashboard`** | **`CSV import with variance analytics`** |
| 5 | `28376:43885` / `43886` | **`Fashion Storefront`** | **`Working cart and stockists directory`** |
| 6 | `28376:43901` / `43902` | **`AI Moodboard Canvas`** | **`Drag-and-drop images with text notes`** |

**No card carries a category tag**, so the design does **not** say which filter chip
(`Ecommerce` / `Portfolio` / `Business & services` / `Health And Beauty`) each template
belongs to. Cards 1 and 6 are **the same name + description with different thumbnails**,
and card 3's description is **truncated mid-phrase** (`…and funnel`). All of this is
placeholder copy (§12).

---

## 9. Tokens

`get_variable_defs` on `28364:40053` (**dark theme**, which is the correct resolution for
this page):

```json
{"White/100":"#ffffff14","Background/Neutral/200":"#33333a","Gray/500":"#71717a",
 "Gray/700":"#3f3f46","Text/Blue/Default":"#1587ff","White/1000":"#ffffff",
 "Text/Default/Default":"#ffffff","Title Page/Font Family":"Gilroy","White/800":"#ffffffb8",
 "Background/Neutral/500":"#c7c7cd","Icon/Default/Default":"#ffffff",
 "Neutral Alpha/100":"#ffffff14","Neutral Alpha/300":"#ffffff3d","Label/Size Base":"14",
 "Label/Font Family":"Proxima Nova","Label/Font Weight Strong":"600",
 "Label Medium Strong":"Font(family: Label/Font Family, style: Semibold, size: Label/Size Base, weight: Label/Font Weight Strong, lineHeight: 100, letterSpacing: 0)",
 "Background/Neutral/950":"#fafafa","Neutral Alpha/200":"#ffffff1f","Black/900":"#09090bcc",
 "White/900":"#ffffffcc","Black/200":"#09090b29","White/300":"#ffffff3d","Black/300":"#09090b3d",
 "White/200":"#ffffff1f","Text/Default/On Default":"#09090b","Gray/200":"#e4e4e7",
 "Neutral Alpha/1000":"#ffffff","Text/Default/Secondary":"#ffffff7a","Neutral Alpha/50":"#ffffff0a",
 "Neutral Alpha/400":"#ffffff52","Background/Neutral/900":"#f7f7f7","Gray/850":"#1f1f22",
 "Radius/Full":"9999","Avatar/Medium":"32","Gray/950":"#09090b"}
```

Additional tokens found on sub-nodes: `Black/800` `#09090bb8` (board `28364:39116`
composer), `Background/Neutral/100` `#1f1f22` (Templates dock), `Gray/600` `#52525b`
(hidden Build state).

**The `Background/Neutral/*` ramp is inverted between themes.** In dark it ascends
`100 #1f1f22 → 200 #33333a → 500 #c7c7cd → 900 #f7f7f7 → 950 #fafafa`; in light,
`950` is `#09090b`. Every `Background/Neutral/*` fallback in the reference code is
therefore wrong for this page.

### Mapped against the prototype

Prototype sources: `prototype/tailwind.config.js` (`colors.gray`, `action`, `brand`) and
the `--white-*` / `--black-*` ramp in `prototype/src/index.css`.

| Figma token | Dark value | Prototype token | Verdict |
|---|---|---|---|
| `Gray/950` | `#09090b` | `gray-950` `#09090b` | **exact** |
| `Gray/850` | `#1f1f22` | `gray-850` `#1f1f22` | **exact** |
| `Background/Neutral/200` | `#33333a` | `gray-750` `#33333a` | **exact** |
| `Background/Neutral/100` | `#1f1f22` | `gray-850` `#1f1f22` | **exact** |
| `Gray/700` | `#3f3f46` | `gray-700` `#3f3f46` | **exact** |
| `Gray/600` | `#52525b` | `gray-600` `#52525b` | **exact** |
| `Gray/500` | `#71717a` | `gray-500` `#71717a` | **exact** |
| `Background/Neutral/500` | `#c7c7cd` | `gray-350` `#c7c7cd` | **exact** |
| `Gray/200` | `#e4e4e7` | `gray-200` `#e4e4e7` | **exact** |
| `Background/Neutral/900` | `#f7f7f7` | `gray-75` `#f7f7f7` | **exact** |
| `Background/Neutral/950` | `#fafafa` | `gray-50` `#fafafa` | **exact** |
| `White/1000` / `Neutral Alpha/1000` / `Text/Default/Default` / `Icon/Default/Default` | `#ffffff` | `white` | **exact** |
| `Text/Default/On Default` | `#09090b` | `gray-950` | **exact** |
| `White/100` / `Neutral Alpha/100` | `#ffffff14` (8 %) | `--white-100` `#ffffff14` | **exact** |
| `White/200` / `Neutral Alpha/200` | `#ffffff1f` (12 %) | `--white-200` `#ffffff1f` | **exact** |
| `Black/300` | `#09090b3d` (24 %) | `--black-300` `#09090b3d` | **exact** |
| `Black/800` | `#09090bb8` (72 %) | `--black-800` `#09090bb8` | **exact** |
| `Black/900` | `#09090bcc` (80 %) | `--black-900` `#09090bcc` | **exact** |
| `Text/Blue/Default` | `#1587ff` | `action.DEFAULT` `#1587ff` | **exact** (present in the hero subtree but not used by any visible node on this page) |
| `Radius/Full` = 9999 · `Avatar/Medium` = 32 | — | — | **exact** (concepts already in use) |
| `White/300` / `Neutral Alpha/300` | `#ffffff3d` (**24 %**) | `--white-300` `#ffffff33` (**20 %**) | **near miss** — 24 % vs 20 %. Chip borders and the disabled Build label need 24 %. |
| `Neutral Alpha/400` | `#ffffff52` (**32 %**) | `--white-400` `#ffffff66` (**40 %**) | **near miss** — 32 % vs 40 %. The tab-track border needs 32 %. |
| `White/800` | `#ffffffb8` (**72 %**) | `--white-500` `#ffffffb2` (**70 %**) | **near miss** — close enough to reuse, but the hero subtitle is drawn at 72 %. |
| `White/900` | `#ffffffcc` (**80 %**) | `--white-700` `#ffffffd9` (**85 %**) | **near miss** — 80 % vs 85 %. Chip labels need 80 %. |
| `Neutral Alpha/50` | `#ffffff0a` (**4 %**) | — | **new — must be added** (`--white-050`). Tab-track fill. |
| `Black/200` | `#09090b29` (**16 %**) | — | **new — must be added** (`--black-200`). Prompt-chip fill. |
| `Text/Default/Secondary` / `Icon/Default/Secondary` | `#ffffff7a` (**48 %**) | — | **new — must be added** (`--white-480`). Card meta, inactive tab label, kebab icon. |
| `Background/Neutral/850` | not resolvable (light fallback `#1f1f22`) | — | **unresolved** — hidden node, no dark value. Needed only for the third Build state. |
| `#121217` | raw hex | — | **new value, not a token** — the hero `Shadow` plate. Add it or express it as `gray-900` at ~92 % (`#18181b` is 6 units off). |
| `#283a71` | raw hex | — | **new value, not a token** — the chip-row scrim. **Do not add it**; replace the scrim with a CSS mask (§6). |
| `#c46082` | raw hex | — | **new value, not a token** — the flattened gradient-border stop on the superseded board. Do not add. |
| `#0073ec` (DS `Background/Blue/Default`) | raw hex | `action.pressed` `#0073ec` | **exact** — already in the prototype as the *pressed* blue. Reference only; nothing on this page paints it. |

Type tokens: `Title Page/Font Family` = `Gilroy` → `fontFamily.display`.
`Label/Font Family` = `Proxima Nova` → `fontFamily.sans`. `Label/Size Base` = 14,
`Label/Font Weight Strong` = 600. The composite style **`Label Medium Strong`** =
Proxima Nova Semibold 14 / 100 % / 0 — worth adding as a named utility, it is used by the
Build label, both tab labels and every chip.

⚠️ Neither Gilroy nor Proxima Nova is committed to this repo (licence). Everything above
will render in the OFL stand-ins (**Outfit** for Gilroy, **Figtree** for Proxima Nova) —
see the TYPEFACES block in `prototype/src/index.css`. The 56 px headline and the
cap-trimmed 28 px wordmark are the two places where that substitution will be most
visible; do not sign off type sizes against the prototype.

---

## 10. Assets

`aspect` = the intrinsic aspect ratio Figma reports for the image box.
**Every asset must end up local**: a published artifact runs under a CSP that blocks every
external request (`CLAUDE.md`), and Figma's MCP asset URLs expire in ~7 days anyway.

| # | Asset | Node | Outer box | Leaf | Recommendation |
|---|---|---|---|---|---|
| 1 | Remixer logo mark | `28364:40193` | 96.009 × 96 | same | ✅ **Reuse `LogoRemixer`** from `prototype/src/ui/icons.tsx` at `size={96}`. Verified match: violet circle bottom-left, blue top-right, grey squares top-left/bottom-right, white centre square with a 4-point star knocked out. |
| 2 | Topbar logo mark (hidden) | `28364:40724` | 26 × 26 | — | Same component at `size={26}` **if** the designer turns the slot on. |
| 3 | Composer `+` | `28364:40229` | 24 × 24 | 24 × 24 | ✅ **Reuse `IconPlus`** at `size={24}` (thin 2-px-stroke plus, matches). |
| 4 | Composer mic | `28364:40237` | **24 × 24** | **20 × 20** | ✅ **Reuse `IconMic`** at `size={20}` inside a 24 px box — **keep the two boxes separate**, the leaf is 20, not 24. |
| 5 | `⏎` on the Build button | `28364:40245` | 24 × 24 | 24 × 24 | ❌ **Hand-draw.** No return-arrow glyph in `icons.tsx`. Shape: a horizontal shaft running right→left with a chevron head at the left end and a short vertical riser at the right end turning down into the shaft (the standard ↵). 24 × 24 viewBox, 1.7 stroke, round caps. |
| 6 | Text caret | `28364:40222` | 0 × 16 box, SVG at `inset:-3.13% -0.5px` | 1 × 17 | ❌ **Do not import as SVG** — render as a 1 × 17 `<span>` / `::after` in `#ffffff`, positioned at x = 24 of the text row, `padding-top: 5`. |
| 7 | Chip-row chevron | `28364:40343` | 20 × 20 at (11, 10) in a 40 px circle | 20 × 20 | ❌ **Hand-draw** a chevron-right (`M8 5 l5 5 -5 5`, 1.8 stroke, round caps). `IconArrowRight` exists but is a full arrow-with-shaft — the wrong glyph here. |
| 8 | Card kebab ⋮ | `28364:40640` | **24 × 24** box (radius 6) | **20 × 20** | ⚠️ `IconMore` exists but is a **horizontal** ellipsis. Either add `IconMoreVertical` (3 filled circles r = 1.6 at x = 12, y = 5.5 / 12 / 18.5) or rotate `IconMore` 90°. Keep the 24-box / 20-leaf split. |
| 9 | User avatar | `I28364:40812;18401:67231` | **32 × 32** box | **34 × 34** raster at `inset:-3.13%` | ❌ **Photo — must be committed locally** to `prototype/public/`. The violet→blue ring is baked into the PNG; better to ship a plain circular crop and draw the ring in CSS (`box-shadow: 0 0 0 1.5px` on a violet→blue gradient, or a 2 px `border-image`). |
| 10 | Project thumbnail (`image 383`) | `28364:40631` | 238.667 × 250.817, **aspect 1650/1734**, radius 8, `object-fit: cover`, clipped to a 216-tall frame (radius 12) | — | ❌ Raster screenshot of a fintech site ("Payness — Fast, Smart & Secure Digital Payment Solutions"). **Commit locally.** In the prototype it can be replaced with a scaled-down render of `SitePreview.tsx`. |
| 11 | Placeholder thumbnail (`image 384`) | `28364:40660` etc. | 238.667 × 242.254, aspect 1730/1756 | — | ❌ **Do not ship at all** — it sits under `opacity: 0`. Render the dashed placeholder as an empty box. |
| 12–17 | Template thumbnails | `28375:43588` (1650/1734) · `28376:43910` (1898/1918, **+1 px `#f7f7f7` border**) · `28376:43832` (238.667 × 159.821) · `28376:44053` (238.667 × 242.254) · `28376:43879` (fill on the frame, no child) · `28376:51159` (238.667 × 238.667) | see left | — | ❌ Six raster site screenshots. **Commit locally**, or generate them from the prototype's own demo sites. |
| 18 | Hero dot texture | `28364:40177` | 2548 × 812.115 vector union | — | ❌ **Do not import as SVG** (thousands of paths). Reproduce as `radial-gradient` + `background-size` (§4.3) with a gradient-coloured overlay. |
| 19 | Hero rings | `28364:40179`–`40183` | see §4.4 | — | ❌ **Do not import.** Five absolutely-positioned `border-radius: 50%` divs with a 1 px stroke; or one inline SVG with five `<circle>`s. |
| 20 | Hero glows | `28364:40185`, `28364:40186` | 4128.5² and 3377.4², both rasterised by Figma | — | ❌ **Do not import the 4000 px PNGs.** Two static `radial-gradient`s (§4.1). Never a live `filter: blur()`. |

---

## 11. Neighbouring states

### What I could not enumerate, and why

`get_metadata` with no `nodeId` reports only **two** pages in this file —
**`UI Kit` `2:4`** and **`UI Mockups` `0:1`** — and **none of the three Home boards is on
either** (I dumped both pages in full and grepped: no `28364:40053`, no `28375:43006`, no
`Domain-Only Customer`; the same is true of `25819:143144`, the Website Builder board cited
in `CLAUDE.md`). So these boards live on a **third page the MCP does not expose**, and I
cannot list canvas siblings. Blind id probing fails (`28364:40052` and `28375:43005` both
return "node not found").

**Ask the designer for the page name / a node URL for that page**, then re-run
`get_metadata` on it. Given all three frames are called **"Domain-Only Customer"**, there
are almost certainly sibling boards for the other customer types (new customer, hosting
customer, …) sitting next to them.

### What *does* exist — the alternate states parked as hidden layers

These are real, tool-verified, and several of them answer questions the visible boards
leave open. All three boards carry near-identical hidden sets; ids below are from the
canonical board `28364:40053` (the `28364:39xxx` / `28375:43xxx` equivalents are listed in
the raw dumps).

**Composer / Build states**

| id | Name | Size | What it is |
|---|---|---|---|
| `28364:40238` | `Button` | 86 × 36 | **Build ENABLED** — `#fafafa` pill, `#09090b` label (§5.4) |
| `28364:40246` | `Button` | 86 × 36 | **Build third state** (hover/pressed) — light-grey pill, `#52525b` label |
| `28364:40230` | `AI Chat Button` | 65 × 32 | alternate left-hand button (labelled, not icon-only) |
| `28364:40231` | `Icon button` | 40 × 40 | larger variant of the `+` |
| `28364:40233` | `Icon button` | 32 × 32 | smaller variant of the mic |
| `28364:40341` | `Frame` | 20 × 20 | alternate chip-row end-cap icon |

**Hero alternates**

| id | Name | Size | What it is |
|---|---|---|---|
| `28364:40184` | `Orange` | 2752.9 × 2752.9 | a **third glow** (orange) — switched off on all three boards |
| `28364:40205` | `AI Website Builder` | 183 × 31 | eyebrow/label above the headline |
| `28364:40211` | `Websites that look like` | 197 × 25 | alternate headline, line 1 |
| `28364:40212` | `you hired a designer.` | 205 × 31 | alternate headline, line 2 |
| `28364:40214` | `Built with just your words.` | 223 × 25 | alternate subtitle |
| `28364:40327` | `Websites that look like you hired a designer` | 700 × 25 | the same headline as one line |
| `28364:40250` | `Frame 1228852208` | 960 × 24 | a 24 px strip under the composer (a hint/helper line?) |
| `28364:40321` | `Avatar Message` | 30 × 30 | social-proof avatar |
| `28364:40345` / `40379` / `40516` / `40584` | `Trustpilot` | 308.8 × 24 / 320.8 × 24 / 2560 × 88 | Trustpilot "Excellent" + rating + logo, in four placements |
| `28364:40412` | `Steps` | 2560 × 160 | a marketing "how it works" band |
| `28364:40447` | `Steps (with icon)` | 2560 × 200 | ditto, with icons |
| `28364:40482` | `Content` | 960 × 22 | — |

**Topbar alternates**

| id | Name | Size | What it is |
|---|---|---|---|
| `28364:40057` | `Top Toolbar` | 1656 × 56 | the **older 56 px toolbar** (logo 88 × 34, avatar + "Roman", etc.) |
| `28364:40724` | `Icon` | 26 × 26 | logo mark slot next to the wordmark |
| `28364:40748` | `Website Builder` | 145 × 14 | product sub-label under the wordmark |
| `28364:40749` / `28364:40754` | `Menu list` / nav slot | 329 × 26 / 354 × 72 | **the nav slot the `Hosting` link lives in on board `28364:39116`** |
| `28364:40759` | `Buttons` | 157 × 42 | right-hand button group |
| `28364:40801` | `Panel button` | 158 × 40 | right-hand CTA |
| `28364:40056` | `Webmail button` | 133.4 × 46.3 | — |
| `28364:40813` | `Splitter` | 2560 × 1 | a 1 px rule under the topbar |
| `28364:39820` (board 39116) | `Templates` | 68 × 21 | second nav item |

**Dock alternates**

| id | Name | Size | What it is |
|---|---|---|---|
| `28364:42954` | `Tabs (Medium)` | 215 × 48 | the larger segmented control |
| `28364:40582` | `Left` (`My projects`) | 128 × 17 | the plain-heading dock header (i.e. board `28364:39116`'s treatment, kept as an alternate) |
| `28375:43568` / `28375:43571` | `Tabs (Medium)` / `Tabs (Small)` | 215 × 48 / 211 × 44 | **both tab controls exist, hidden, on the Templates board** — so the Templates state is meant to be reachable *with* the tabs, not only as a separate page |
| `28364:40577` | `Rectangle 1162905190` | 1656 × 768 | full-bleed plate behind the dock |
| `28364:40578` | `Union` | 2548 × 812.1 | a second dot texture for the dock |
| `28364:40619` | `Website` | 190.25 × 220 | a third card size |
| `28364:40641` / `40702` / `40709` | `Website` | 640 × 469 | a **large hero card** with `Synco` (28 px) / `Online store` (20 px) — a different card content model (name + *category*, not name + timestamp) |
| `28375:43605` | `Website` | 374 × 256 | a fourth card size |
| `28364:40716` / `28364:40717` | `CTA outlined button (black)` / `CTA primary button (blue)` | 111 × 48 / 257 × 48 | **visible instances parked OUTSIDE the frame** at x = 1692 and 1815 (frame is 1656 wide) — swatches the designer left on the side, not part of the page |

**No hover state, no open dropdown, no filled-composer state and no mobile board exists
for this page** anywhere I can see. The only interaction states drawn are the three Build
buttons and the two tab-control sizes.

---

## 12. Open questions for the designer

1. **Hero panel corner radius.** Not readable via the MCP (`get_design_context` on
   `28364:40176` times out). I measured **≈ 20 px**. Confirm — 16 / 20 / 24 are all
   plausible and it is the page's most visible radius.
2. **Dot-texture cell size.** Measured **≈ 12.8 px** pitch, **≈ 1.5 px** dot. Confirm, or
   export the layer.
3. **Ring stroke.** Is it a 1 px gradient from `White/100` `#ffffff14` to
   `Background/Neutral/200` `#33333a`, and at what angle? And is `Ellipse 1180` meant to be
   there at all — its topmost point sits 49 px *below* the hero's bottom edge.
4. **Which Build state ships as enabled?** The drawn enabled variant (`28364:40238`) is a
   **near-white `#fafafa` pill with a `#09090b` label — not blue.** That contradicts the
   verified brand rule `#1587FF = action` in `CLAUDE.md`. Intentional, or should it be blue?
   And what is the third state (`28364:40246`, light-grey pill / `#52525b` label) — hover or
   pressed?
5. **Chip-row edge fade is hard-coded.** `28364:40378` paints an opaque
   `rgba(40,56,107,0) → #283a71` rectangle over the last chip. It reads as a highlighted
   chip, and it will mis-match the moment the hero gradient or the viewport changes. I want
   to replace it with a real `mask-image` fade. OK?
6. **Prompt chips are placeholder filler.** Nine chips, but `Landing page`, `Portfolio`,
   `Personal Portfolio Website` and `SaaS Product Landing Page` each appear twice. What are
   the real chips, in what order, and how many?
7. **Does the chip row scroll?** It is `overflow: clip` with 1502 px of chips in a 912 px
   box, and there is a chevron button at the end. Is the chevron a *scroll-right* control, a
   "see all prompts" link, or decoration?
8. **Two phantom empty text lines.** The hero subtitle (`28364:40213`) and the composer
   placeholder (`28364:40223`) each contain a second, empty paragraph, which doubles their
   box height (56 instead of 28, 52 instead of 26). I will drop them and keep the *visual*
   rhythm — confirm that is what you intended, because it changes where the composer sits.
9. **`Remixer builds it.` is a link.** `28364:40209` comes back as an anchor with a
   prototype interaction. Accidental?
10. **Inactive tab radius is 8, active is 999.** In `Tabs (Small)`: the active pill is a
    full pill, the inactive `state-layer` has radius 8. Accident? Also the two tabs use
    different font families (`Proxima Nova Semibold` vs `Proxima Nova W05 Medium`), and the
    inactive label string is **`Templates `** with a trailing space.
11. **Dock heading is not aligned with the grid.** On board `28364:39116` the `My projects`
    heading is indented 8 px; the tabs on the canonical board sit at x = 0; the `Templates`
    heading on the newest board sits at x = 0. Which is right?
12. **Card 1's thumbnail radius is 12 on the projects board and 8 on the Templates board**
    (`28364:40629` vs `28375:43586`). And only template card 2 (`28376:43910`) has a 1 px
    near-white border round its thumbnail. Both look accidental.
13. **Template card copy.** Cards 1 and 6 are the same name + description; card 3's
    description ends mid-phrase (`Launch checklists, UTM links, and funnel`). And **no card
    declares a category**, so the filter chips cannot actually filter anything — which
    template belongs to which chip?
14. **Filter chip labels.** `Ecommerce` (dock) vs `E-commerce Storefront` (hero chip) —
    pick one spelling. `Health And Beauty` has a capitalised "And". And what does `More`
    open?
15. **No kebab on template cards** (all six at `opacity: 0`) but a kebab on project cards.
    Intentional (nothing to manage on a template) — confirm, and tell me what the project
    kebab menu contains, since no dropdown is drawn.
16. **Empty-slot placeholders.** Five (or six) dashed boxes for a customer with one site —
    is that a fixed grid ("you can have 6 projects") or filler? Are they clickable ("start a
    new site")? And confirm the dash pattern (I measured ≈ 6/6).
17. **Where does the dock height come from?** Hero + dock always sums to 1196 across the
    three boards. Is the dock a fixed-height bar pinned to the bottom with the hero flexing
    to fill, or does the page scroll?
18. **Is there a "no projects at all" state?** Board `28375:43006` shows Templates with a
    `Templates` heading and *no* tabs — but the same board also carries **both** tab
    controls as hidden layers. So: does the first-run user see the heading form, and the
    returning user sees Templates *as a tab*? That is two different components.
19. **Nothing responsive and no mobile board is drawn.** All three boards are 1656 × 1196.
    What happens below ~1000 px, where the fixed 960 px composer stops fitting?
20. **What page is this on?** The MCP only exposes `UI Kit` and `UI Mockups`, and these
    boards are on neither, so I cannot see their neighbours (§11). Send me the page name or
    any node URL from that page.
21. **All three boards are named "Domain-Only Customer".** Are there sibling boards for
    other customer types that should share this spec?
22. Minor: the hidden `Orange` glow, the hidden `Trustpilot` blocks, the hidden `Steps`
    bands and the hidden 640 × 469 `Website` card (`Synco` / `Online store`) — dead layers
    to delete, or a parked direction?
