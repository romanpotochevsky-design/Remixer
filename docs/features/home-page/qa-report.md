# Home page — independent pixel QA

**Subject:** the Home page as built — `prototype/src/Root.tsx`,
`prototype/src/modules/home/{HomePage,Dock,thumbs}.tsx`, the `HOME PAGE` section of
`prototype/src/index.css`, and the `projects` axis in `prototype/src/state/{world,ui,scenarios}.ts`.
**Reference:** Figma `GP4jNXtc37VTFVZDc9JF0a`, nodes `28364:40053` (dock = tabs, *My projects*)
and `28375:43006` (dock = *Templates*).
**Spec under test:** `docs/features/home-page/figma-spec.md`.
**Date:** 25 Aug 2026. **Method:** built with `npm run build`, served from `dist`, driven with
Playwright/Chromium at **1656 × 1196, deviceScaleFactor 1**. Every geometry number below is a
`getBoundingClientRect()` read out of the DOM; every colour is a pixel sampled out of the PNG.
Nothing here was eyeballed except where it says so.

**Verdict: yes — put it in front of the designer.** Every element the spec gives a number for
now lands on that number to the pixel, in both dock states, and everything that is still off is
either (a) the missing licensed typefaces, (b) an asset that is not in the repo, or (c) something
the spec itself raises as a question for him. Four things were wrong and are fixed; four spec
claims were checked and the spec was corrected. Details below, deviations first.

---

## 1. Captures

At `…/scratchpad/qa/`:

| File | What |
|---|---|
| `01-my-projects.png` | 1656 × 1196, default world (one site), *My projects* |
| `02-templates-tab.png` | same world, *Templates* tab picked |
| `03-no-projects.png` | `?w=0` — no sites yet, the templates shelf |
| `04-composer-filled.png` | text typed, Build in its enabled state |
| `05-narrow-1440x900.png` | the same page at 1440 × 900 |

**`ref-my-projects.png` / `ref-templates.png` were NOT written.** The egress proxy refuses
`www.figma.com` (`CONNECT tunnel failed, response 403`), and the MCP hands the render back only
as an inline image — there is no path from that to bytes on disk. The two reference renders were
read inline and compared by eye against the captures; every numeric comparison in this report is
against the spec's tabulated values, which are themselves reads off those renders.

Note: the tiny 24 × 24 mark at 25 % opacity in the bottom-right corner of each capture is the
prototype console handle (`ScenarioPanel`), not part of the page.

---

## 2. Geometry — expected vs actual vs delta

All values in page pixels at 1656 × 1196. "expected" is the spec's number for the canonical
board. Anything ≥ 1 px is a finding.

### 2.1 Board `28364:40053` — everything that is exact

| Element | Expected x, y, w, h | Actual | Δ |
|---|---|---|---|
| Hero panel | 8, 8, 1640, 812 | 8, 8, 1640, 812 | **0** |
| Topbar | 8, 8, 1640, 72 | 8, 8, 1640, 72 | **0** |
| Wordmark cap box | x 32, cap 34 → 54 (20 px) | x 32, cap 34 → 54 | **0** |
| Avatar | 1596, 28, 32, 32 | 1596, 28, 32, 32 | **0** |
| Logo | 780, 168, 96, 96 | 780, 167.89, 96, 96 | −0.11 y |
| Composer field | 348, 498, 960, 138 | 348, 498.08, 960, 138 | +0.08 y |
| Composer text row | 348, 515, 944, 52 | 348, 515.08, 944, 52 | **0** *(was +1 x / −1 w — fixed)* |
| Caret / placeholder x | 372 | 372 | **0** *(was +1 — fixed)* |
| Composer button row | 348, 584, 944, 36 | 348, 584.08, 944, 36 | **0** *(was +1 x / −1 w — fixed)* |
| `+` button | 364, 584, 36, 36 | 364, 584.08, 36, 36 | **0** *(was +1 x — fixed)* |
| Right group | 1154, 584, 138, 36 | 1154, 584.08, 138, 36 | **0** |
| Mic button / icon box / leaf | 1154, 584, 36, 36 / 1160, 590, 24, 24 / 1162, 592, 20, 20 | identical | **0** |
| Build button | 1206, 584, 86, 36 | 1206, 584.08, 86, 36 | **0** |
| ⏎ glyph | 1262, 590, 24, 24 | 1261.77, 590.08, 24, 24 | −0.23 x |
| Chip row | 348, 660, 960, 42 | 348, 660.08, 960, 42 | **0** |
| Chip scroller | 348, 660, 912, 42 | 348, 660.08, 912, 42 | **0** |
| Chip y / height | 661, 40 | 661.08, 40 | +0.08 |
| End cap / button / icon | 1260, 660, 48, 42 / 1268, 661, 40, 40 / 1279, 671, 20, 20 | identical | **0** |
| Dock | 0, 820, 1656, 376 | 0, 820, 1656, 376 | **0** |
| Dock title row | 32, 820, 1592, 80 | 32, 820, 1592, 80 | **0** |
| Tab track | 32, 838, 211, 44 | 32, 838, 211, 44 | **0** |
| Active pill | 38, 844, 101, 32 | 38, 844, 101, 32 | **0** |
| Inactive tab | 145, 844, 92, 32 | 145, 844, 92, 32 | **0** |
| Card container | 32, 900, 1592, 272 | 32, 900, 1592, 272 | **0** |
| Card 1 | 32, 900, 238.667, 272 | 32, 900, 238.67, 272 | **0** |
| Card 1 thumbnail | 32, 900, 238.667, 216 | 32, 900, 238.67, 216 | **0** |
| Card 1 meta bar | 32, 1116, 238.667, 56 | 32, 1116, 238.67, 56 | **0** |
| Card 1 name x | 36 | 36 | **0** |
| Kebab | 230.667, 1124, 40, 40 | 230.67, 1124, 40, 40 | **0** |
| Dashed slots 2–6 | 302.667 / 573.333 / 844 / 1114.667 / 1385.333, 900, 238.667, 272 | same ±0.03 | ≤0.03 |

The sub-pixel −0.11 / +0.08 on the vertical rhythm is one shared cause and it is arithmetic, not
a mistake: the headline's line box is 56 × 1.2 = **67.2**, which the spec rounds to 67, so the
content stack is 534.19 rather than 534 and the two proportional spacers each give up 0.1 px.

### 2.2 Board `28375:43006` (no projects) — after the fix

| Element | Expected | Before | After |
|---|---|---|---|
| Hero panel | 1640 × **804** @ (8, 8) | 1640 × 812 | **1640 × 804** ✓ |
| Dock wrapper | 1656 × **384** @ y **812** | 1656 × 376 @ 820 | **1656 × 384 @ 812** ✓ |
| Dock title row | 1592 × **88** @ y 812 | 1592 × 80 @ 820 | **1592 × 88 @ 812** ✓ |
| `Templates` heading | x 32, cap box y 845 → 867 | cap ≈ 848.6 (**+3.6**) | cap ≈ 844.6 (**−0.4**) |
| Filter chip row | y **838**, h 36, right edge 1616 | y 842 (**+4**) | **y 838** ✓, right edge 1616 ✓ |
| Card row | 32, 900, 1592, 272 | 32, 900 ✓ | 32, 900 ✓ |

The 8 px the Templates board takes off the hero goes back to the title row, so the card row still
starts at y = 900 in **both** states — which is what the two boards do, and why one page can serve
both without moving the shelf.

### 2.3 Geometry deviations that remain

| # | Element | Expected | Actual | Δ | Verdict |
|---|---|---|---|---|---|
| G1 | Headline box | 735 wide @ x 460.5 | 724.52 @ 465.73 | **−10.5 w, +5.2 x** | **Font substitution.** Outfit stands in for Gilroy SemiBold. Optically centred at 827.99 vs the drawn 828. Not closeable in this repo. |
| G2 | Headline halves | 290 / 437 | 286.17 / 430.34 | −3.8 / −6.7 | Same. The 8 px gap between them is exact. |
| G3 | Subtitle | 460 wide @ x 598 | 472.97 @ 591.52 | **+13 w, −6.5 x** | **Font substitution** (Figtree for Proxima Nova). Centre 828.0 exact. |
| G4 | Prompt chips 1–5 | 182 / 124 / 92 / 202 / 210 | 192.2 / 126.5 / 95.8 / 207.1 / 214.3 | +10.2 … +2.5 | **Font substitution.** Padding (20 px) and height (40) are exact; the label sets the width. |
| G5 | Filter chips 1–6 | 112 / 105 / 86 / 151 / 146 / 67 | 113.7 / 108.9 / 89.3 / 152.4 / 149.2 / 68.5 | +1.4 … +3.9 | Same. Right-aligned, so only the left end of the row moves (−15 total). |
| G6 | Chips 2–9 height | 42 @ y 660 | 40 @ y 661 | −2 h, +1 y | **Deliberate**, and the spec's own recommendation (§6: chip 1 is 40 @ y 1 and the rest are stretched instances — "ship them all at 40"). |
| G7 | Template card 1 | thumbnail 216 / text block 56 | 218 / 54 | ±2 | **Deliberate.** The board gives card 1 216/56 and cards 2–6 218/54, which §12.12 flags as accidental. All six are built the same. One card, 2 px, reversible in one line if he wants the accident. |
| G8 | Card 1 text block | 56 tall | 56.39 | +0.39 | Sub-pixel: the name's line-height is 1.2 (21.6) where Gilroy's "normal" resolves to ≈21.2. Font metrics. |
| G9 | Template names | fit at 16 px | `Homeware store website templ…` truncates | — | **Font substitution.** Figtree at 16 px is wider than Proxima Nova in a 238.667 card. |
| G10 | Avatar ring | raster bleeds 1 px **outside** the 32 box | 1.5 px ring **inside** the box | 1 px | Asset gap — see A1. |

---

## 3. Colour samples

Sampled out of `01-my-projects.png` at the **board coordinates** the spec uses (§4.1). Per-channel
deltas, actual − expected.

| Point | Spec | Actual | ΔR | ΔG | ΔB |
|---|---|---|---|---|---|
| top-left (20, 20) | `#0d0d13` | `#0e0e15` | +1 | +1 | +2 |
| top-centre (828, 20) | `#101018` | `#0e0f15` | −2 | −1 | −3 |
| top-right (1630, 20) | `#0e1018` | `#0e0e16` | 0 | −2 | −2 |
| **mid-left (20, 400)** | `#3a1f52` | `#351f43` | **−5** | 0 | **−15** |
| **mid-right (1630, 400)** | `#1b2452` | `#1f2147` | **+4** | −3 | **−11** |
| bottom-left (20, 800) | `#b055d8` | `#af54db` | −1 | −1 | +3 |
| bottom-centre (828, 810) | `#6a3fb0` | `#6946b0` | −1 | +7 | 0 |
| bottom-right (1630, 810) | `#2f4fc0` | `#2e4fc2` | −1 | 0 | +2 |

Six of eight land within 5/255 on every channel. **The two mid-height flank samples are short of
blue by 15 and 11** — the flanks read a touch warmer, a touch less indigo, halfway down the panel.
Left as fitted; the reasoning is in §6.

Everything else, sampled and compared against its token:

| Surface | Expected | Actual | Result |
|---|---|---|---|
| Composer fill | `Black/900` `rgba(9,9,11,.8)` | `rgba(9,9,11,0.8)` | ✓ |
| Composer rim | 1 px `#ffffff14` | 1 px at x 348 / 1307, measured `#2e2538` over the local field = 8 % white | ✓ |
| Composer radius / blur / shadow | 32 / `blur(16px)` / `0 16px 80px rgba(0,0,0,.08)` | identical | ✓ |
| Placeholder | `Background/Neutral/500` `#c7c7cd` (dark) | `#c7c7cd` | ✓ |
| `+` and mic rims | 1 px `#ffffff14`, no fill | `rgba(255,255,255,0.08)`, transparent | ✓ |
| Build **idle** | fill `#ffffff14`, label `#ffffff3d`, r 12 | `rgba(255,255,255,0.08)` / `rgba(255,255,255,0.24)` / 12 | ✓ |
| Build **enabled** | fill `#fafafa`, label `#09090b` | sampled `#fafafa` / `#09090b` | ✓ |
| Prompt-chip fill | `Black/200` `rgba(9,9,11,.16)` | `rgba(9,9,11,0.16)`; composite at the rim measured (140,103,170) vs (141,105,170) predicted | ✓ |
| Prompt-chip border | `White/300` `#ffffff3d` (24 %) | `rgba(255,255,255,0.24)` | ✓ |
| Prompt-chip label | `White/900` `#ffffffcc` (80 %) | **was 85 %** (`--white-700`) → now `#ffffffcc` | **fixed** |
| End-cap button | `Black/300` `rgba(9,9,11,.24)`, 1 px `#ffffff1f`, `blur(10px)` | identical | ✓ |
| Tab track | fill `#ffffff0a` (4 %), border `#ffffff52` (32 %) | `rgba(255,255,255,0.04)` / `rgba(255,255,255,0.32)`; fill sampled `#121214` = 4 % over `#09090b` | ✓ |
| Active pill | `#ffffff`, label `#09090b`, r 999, 14/600 | sampled `#ffffff`; 600 | ✓ |
| Inactive tab | no fill, label `#ffffff7a` (48 %), r **8**, weight **500** | transparent / `rgba(255,255,255,0.48)` / 8 / 500 | ✓ *(radius 8 is as drawn — §12.10)* |
| Filter chip active / default | `#f7f7f7` + `#09090b` / no fill + 1 px `#ffffff1f` + white | `rgb(247,247,247)` / matches | ✓ |
| Dashed placeholder stroke | `#ffffff1f` (12 %), ≈6/6 dash, r 16 | 1 px column sampled `#262628` = **38** vs 38.5 predicted; `stroke-dasharray="6 6"`, `rx 15.5` on a half-pixel inset | ✓ |
| Card name / meta | Gilroy Medium 18 `#ffffff` / Proxima 12/1.4 `#ffffff7a` | 18/500 white / 12/16.8 `rgba(255,255,255,0.48)` | ✓ |
| Dock ground | page frame `Gray/950` `#09090b`, no fill on the dock | sampled `#09090b` at (828, 890) and (1000, 1185) | ✓ |
| Hero panel radius | ≈20 (measured, §12.1) | 20 | ✓ (still his call) |

---

## 4. The four spec claims — checked independently

| Claim | Verdict | Evidence |
|---|---|---|
| §4.2's `Shadow` gradient direction is **reversed** in the export | **TRUE. Spec corrected.** | `get_screenshot 28364:40187 contentsOnly` composites the layer's alpha over white and returns **opaque near-black across the top ~18 %, white by ~88 %** — alpha 1 at the top, 0 at the bottom. The export's direction would leave the plate fully opaque from y 490 to its edge at 544 and then jump (124, 49, 153) in RGB into the glow: a hard line across the panel the board does not have. |
| §4.1's "practical recipe" evaluates to **zero magenta at mid-left** | **TRUE. Spec corrected.** | Magenta layer centred (0, 958.2), ending shape 1968 × 771.4. At (20, 400): √((20/1968)² + (558.2/771.4)²) = **0.724** — past the 62 % stop, alpha 0. The table says `#3a1f52`. The blue layer fails the same way at (1630, 400). |
| §4.4's ring coordinates resolve **hero-relative** | **TRUE, and now verified twice. Spec upgraded from inference to verified.** | `28364:40181` (`Ellipse 1179`, nominally 800²) renders at **800 × 608** — clipped by exactly the 192 px the hero-relative reading predicts above the panel. `28364:40183` (`Ellipse 1`, 236.4²) renders **236 × 236 unclipped**, which only that reading allows. Parent-relative puts both entirely above the hero, where they would render as nothing. The implementation's four ring positions were re-derived and all four match to 0.01 px. |
| §5.2's phantom-line advice **contradicts itself** | **TRUE. Both §4.7 and §5.2 corrected.** | §4.7 said "take the extra 28 px out of the rhythm, or the composer lands 28 px lower" — backwards on both halves: removing the space moves the composer *up*, and the only way to land it 28 px *low* is to render the empty line *and* keep the gap. §5.2's "same caveat as the subtitle" is worse than ambiguous: the composer's phantom 26 px is *inside* the field (17 + 52 + 17 + 36 + 16 = the drawn 138), so it cannot be moved into any gap — remove it and the field itself becomes 112. The implementation does the right thing in both places. |

---

## 5. Interaction checklist — 37/37 pass

Driven with Playwright against the built page. Zero failures.

| # | Check | Result |
|---|---|---|
| 1 | Build is disabled with an empty composer | ✓ |
| 2 | Typing enables Build | ✓ |
| 3 | Enabled pill is `#fafafa` with a `#09090b` label | ✓ |
| 4 | Idle pill is 8 % white with a 24 % label | ✓ |
| 5 | Enter submits | ✓ |
| 6 | Enter lands in the builder | ✓ |
| 7 | The typed prompt is the builder's first chat message, verbatim | ✓ |
| 8 | Generation is running on arrival (`chat: working`, `project: generating`) | ✓ |
| 9 | The canned reply lands ~2.6 s later and settles the chat | ✓ (−10 credits, +1 unpublished) |
| 10 | The builder's topbar logo returns Home | ✓ |
| 11 | A prompt chip fills the composer | ✓ |
| 12 | A chip click leaves the caret in the field | ✓ |
| 13 | All nine chips fill the composer with their own label | ✓ |
| 14 | The end-cap chevron scrolls the chip row (0 → 320) | ✓ |
| 15 | The dock opens on *My projects*: 1 card + 5 dashed slots | ✓ |
| 16 | The *Templates* tab shows six template cards | ✓ |
| 17 | A filter chip narrows the shelf | ✓ |
| 18 | The active filter chip is `#f7f7f7` | ✓ |
| 19 | *All templates* restores six | ✓ |
| 20 | No filter chip leaves a dead shelf (every one either has cards or the honest empty line) | ✓ |
| 21 | A project card opens the builder | ✓ |
| 22 | …on a `built` project, not an empty canvas | ✓ |
| 23 | A template card enters the builder | ✓ |
| 24 | …seeding a first message that names the template | ✓ |
| 25 | …with generation running | ✓ |
| 26 | The prototype console opens on Ctrl+. | ✓ |
| 27 | It carries the new "Sites they have" axis | ✓ |
| 28 | The axis flips the dock to the Templates heading | ✓ |
| 29 | The no-projects state is a shareable link (`?w=0`) | ✓ |
| 30 | No console error anywhere except the missing licensed fonts (six 404s) | ✓ |
| 31 | **Regression:** the builder still mounts from Home | ✓ |
| 32 | **Regression:** the sent bubble is mid-spring 140 ms after send | ✓ (8 transformed nodes) |
| 33 | **Regression:** the thread still parks the sent message at the top | ✓ (scrollTop 0 → 330) |
| 34 | **Regression:** the Siri glow still comes up during the send | ✓ (`siri-glow siri-glow--lite siri-glow--split`, 2 layers — the quality governor correctly starting on the light cut) |
| 35 | **Regression:** the reply still types in word by word | ✓ (27 words, 27 animated) |
| 36 | **Regression:** the send settles | ✓ |
| 37 | The page never scrolls vertically at 1656×1196, 1440×900 or 1280×720 | ✓ |

### The artifact a designer will actually open

`npm run artifact` → `dist/remixer-prototype.html`, 0.53 MB, four OFL faces embedded as base64,
the six licensed `@font-face` rules dropped. Loaded from `file://`:

* **1 network request total** (the file itself). **Zero** non-`file:`/`data:` requests — nothing
  for the artifact CSP to block.
* **Zero console messages** — no errors, no warnings.
* No `<script src>`, no `<link href>`, no `<img>` with a remote source.
* Geometry identical to the served build (hero 8, 8, 1640, 812 / dock 0, 820, 1656, 376).
* Interactive: Build arms on typing, Enter enters the builder, the logo returns Home.

### Responsive sweep

| Viewport | Hero panel | Dock | Title row | Card row | Card width | Page scroll | Row scroll |
|---|---|---|---|---|---|---|---|
| 1656 × 1196, projects | 1640 × 812 | 376 @ 820 | 80 | 1592 × 272 @ 900 | 238.67 | 0 | 0 |
| 1656 × 1196, templates | 1640 × **804** | **384** @ **812** | **88** | 1592 × 272 @ 900 | 238.67 | 0 | 0 |
| 1440 × 900, projects | 1424 × 516 | 376 @ 524 | 80 | 1376 × 272 | 202.67 | 0 | 0 |
| 1440 × 900, templates | 1424 × 508 | 384 @ 516 | 88 | 1376 × 272 | 202.67 | 0 | 0 |
| 1280 × 720, projects | 1264 × 480 | 236 (floor) | 80 | 1216 × 132 | 200 (floor) | 0 | 144 |

Nothing responsive is drawn (§12.19), so this is the implementation's own reading: the hero
absorbs the height, the dock holds its 376/384 until its floor, and past that the cards stop
shrinking at 200 and the row scrolls sideways instead of grinding them down.

---

## 6. What I changed

Four fixes. Each was re-measured after the change.

1. **The composer's rim was eating a pixel of its own content box.**
   `prototype/src/modules/home/HomePage.tsx`. A Figma stroke sits *inside* the geometry; a CSS
   `border` does not — it takes a pixel off the content box. The implementation had compensated
   in the padding (`16px 15px 15px 0` instead of the drawn `17px 16px 16px 0`), which restored the
   outer 138 but pushed the two inner rows to **x 349, width 943** and the caret, the placeholder
   and the `+` button to **x + 1**. Replaced the border with `inset 0 0 0 1px var(--white-100)`
   folded into the existing `box-shadow` — no layout, follows the 32 px radius, one static paint,
   and the same "draw the rim, don't border it" rule the shell's glass already uses (`CLAUDE.md`).
   Padding restored to Figma's. Text row and button row now measure **348 / 944**, caret **372**,
   `+` **364**. Rim verified by pixel scan: a single 1 px column at x 348 and x 1307.

2. **The prompt-chip label was 85 % white where the board draws 80 %.**
   `HomePage.tsx`. It used `--white-700` (`#ffffffd9`); Figma's `White/900` is `#ffffffcc`.
   §9 of the spec already flagged that pair as a near miss and named the chip label as the place
   it shows. Now the literal `#ffffffcc`, with the reason in a comment. Sampled: `#e2d8ea`
   against `#e1d8e9` predicted.

3. **The Templates state used the projects board's dock geometry.**
   `prototype/src/modules/home/Dock.tsx`. Both states were 376/80; board `28375:43006` draws
   **384/88** with the hero at **804**. The heading and all six filter chips therefore sat 4 px
   low. The dock's flex-basis, its min-height floor and the title row's height are now keyed to
   which header form is showing. Both boards are now exact, and because the extra 8 px comes out
   of the hero rather than the shelf, the card row still starts at y = 900 in both.

4. **The `Shadow` plate was pinned in pixels, and its top edge was a cliff.**
   `prototype/src/index.css`. Two separate problems on one layer.
   *Pixels:* every other layer in the hero is proportional (the field's stops are percentages),
   so `top: 272px; height: 272px` only lined up at the drawn 812. At 1440 × 900 the panel is 516
   and the plate's opaque top edge landed at 53 % of the ramp — a **visible full-width horizontal
   line under the subtitle**, measured as a 5-unit step with the dot texture stopping dead on it.
   Now `33.4975%` for both, which resolves to exactly 272 px at the design size and keeps the edge
   on the same line of the ramp at any height.
   *Cliff:* the plate arrives fully opaque, the field it lands on is a least-squares fit, and the
   plate covers the dot texture — so even at the design size there was a 3–4/255 step plus a
   texture that ended on a line (measured (21,15,27) above, (18,18,23) below). Added a 1.8 %
   (≈5 px) ramp at the top edge: the step is now ≤2 units per pixel and the texture dissolves.
   Verified at both 1656 × 1196 and 1440 × 900.

Plus one comment corrected rather than left to mislead: the CSS claimed "seven of the eight land
within 5/255 per channel". Re-measured off the built page it is **six**, with the two mid-height
samples short of blue by 15 and 11. The comment now says so and says why it was left.

**Spec corrections** (`docs/features/home-page/figma-spec.md`, all marked 🛠 and dated):
§4.1 (the recipe paints no magenta at mid-left — do not build from it), §4.2 (direction reversed,
plus the two consequences: the top edge is the hard one, and the band is a fraction not a pixel
count), §4.4 (hero-relative upgraded from inference to verified, with the two clipped-render
proofs), §4.7 and §5.2 (the phantom-line rule restated as one action, and §5.2's "same caveat"
replaced with the opposite instruction).

Nothing was touched in `thumbs.tsx`, `data/templates.ts`, `package.json`, or anywhere inside the
builder shell's chat / glow / composer choreography. The only pre-existing file outside the Home
page module that this feature touches is `App.tsx`, where the topbar logo became a button — one
wrapper, verified not to disturb the send choreography (checks 31–36).

---

## 7. What is still off, and whether it can be closed

| # | Deviation | Closeable? |
|---|---|---|
| **T1** | **Type.** Gilroy and Proxima Nova are not in the repo (licence — `CLAUDE.md`); Outfit and Figtree stand in. Consequences measured above: headline −10.5 px wide, subtitle +13, prompt chips +2.5…+10, filter chips +1.4…+3.9, one template name truncating, card-name line box +0.4. Letterforms differ. | **Not here.** Make the repo private, drop `public/fonts/*.woff2` from `.gitignore`, commit the six files — they are already wired first in the `@font-face` stack and will take over the moment they exist. **Do not sign off type sizes against these captures.** |
| **A1** | **Avatar.** The board's is a photograph with a violet→blue ring baked into a 34 × 34 raster that bleeds 1 px outside the 32 box. Ours is an abstract gradient disc in a 1.5 px ring inside the box. | Closeable the moment an avatar asset is committed to `public/`. Drawing a person is not something a prototype should invent. |
| **A2** | **Thumbnails.** Seven raster site screenshots on the boards; ours are drawn miniatures (`thumbs.tsx`). Also not reproduced: template card 3's short image (159.8 in a 218 clip → 58 px of empty space) and card 2's 1 px near-white hairline — both of which §12.12 flags as accidents. | Closeable with committed assets. The miniatures are the honest stand-in and they are the same *sites* the board shows. |
| **C1** | **Mid-height flanks are short of blue** by 15 (left) and 11 (right) out of 255, within 5 on the other two channels — the flanks read slightly warmer halfway down. | **Closeable but I chose not to, and I would not let anyone do it blind.** The two flanks need *different* hue corrections (mid-left wants +5R/+15B, mid-right wants −4R/+3G/+11B), so no uniform overlay fixes both — it needs the two glows refitted. Any overlay also has to pass under the opaque top of the `Shadow` plate, which is the mechanism that produced the three visible artefacts the CSS comment documents. The reference numbers are themselves "≈ measured, all approximate" (§4.1). **Check by eye against the board first; if he sees it, refit the glows, don't patch them.** |
| **D1** | **Chip-row right edge.** Figma paints an opaque `rgba(40,56,107,0) → #283a71` rectangle over the last chip; we mask the scroller's last 48 px so the real background shows through. Reads differently: the board shows "SaaS" on a blue plate, we show a chip dissolving. | Deliberate, raised as §12.5. **This is a decision for him, not a bug to close.** |
| **D2** | Chips 2–9 are 40 tall at y 661, the board stretches them to 42 at y 660. | Deliberate — the spec's own recommendation (§6). One line to reverse. |
| **D3** | Template card 1 is 218/54 like its five siblings; the board draws it 216/56. | Deliberate — §12.12 flags it as accidental. One line to reverse. |
| **D4** | The inactive tab's radius is 8 while the active pill is 999. | **Built as drawn**, invisible with no fill on the inactive tab. §12.10. |
| **U1** | **Ring stroke.** Ours is a 1 px gradient, `White/100` → `Background/Neutral/200`, left to right — the spec's ≈measured reading. Against the reference render the arcs read slightly more even in brightness than ours, which is dimmer on its left end. | Unresolved by design: §12.3 asks him for the stroke and its angle. One value to change once he answers. |
| **U2** | **Dot texture.** 12.8 px pitch, 1.5 px dot, `Gray/700` at the top — as specified. I could not settle its strength numerically: the reference bytes cannot reach disk, and an isolated render of the `Union` (composited on white, downscaled) is consistent with anything from a 1.0 px opaque dot to a 1.5 px dot at ~45 % alpha. Side by side at the resolution I *can* read, ours and the board's look comparable, and I am recording that rather than tuning to a guess. §4.3's prose ("practically invisible in the dark top half, clearly visible in the coloured bottom half") describes the opposite distribution to what any overlay produces — measured contrast at the dot centres: **+38** in the dark top band, **−19 B / +18 G** in the bright bottom-left. | §12.2 already asks him to confirm the pitch and dot size. **Ask for a PNG/SVG export of `28364:40177` and this closes exactly.** |

---

## 8. What the designer should look at

Plain words, in the order I would look.

1. **Everything with a number on it is right.** Panel, topbar, avatar, logo, headline block,
   composer and every button in it, the chip row and its end cap, the tabs, the card grid, the
   dashed slots — all on the drawn pixel, in both dock states. You can compare the captures to
   the boards at 100 % and measure anything you doubt.

2. **The type is not your type.** Outfit and Figtree are standing in for Gilroy and Proxima Nova,
   which cannot be committed to a public repo. Sizes, weights and positions are the drawn ones,
   but every *width* is wrong by a few pixels and the letterforms are not ours — the headline
   is 10 px narrower than the board and one template name truncates because of it. **Do not judge
   type here.** If you want to, say the word and the repo goes private and the real faces go in.

3. **Two things are drawn but not built, because the assets are not in the repo:** the avatar
   photograph (you get an abstract disc in the same ring, at the same 32 px) and the seven site
   screenshots (you get drawn miniatures of the same sites). Hand over the images and both close.

4. **The chip row's right edge is deliberately not what you drew.** The board paints an opaque
   `#283a71` rectangle over the sixth chip — a colour hand-matched to the hero at that one spot.
   It reads as a highlighted blue chip, and it will mismatch the moment the gradient, the row's
   position or the window width changes. We built a real fade instead, so the true background
   shows through. **Look at both and tell us which you want** (§12.5).

5. **Look at the left and right flanks of the hero, halfway down.** The purple field is two
   4000 px blurred ellipses in Figma and static gradients here — it has to be, or the page runs at
   4 fps. Six of the eight sampled points match within 5/255. The two mid-height flanks are about
   6 % short of blue, so they read a touch warmer than the board. If you can see it, we refit the
   glows properly rather than patching over them.

6. **The dot texture.** Pitch and dot size are what the spec measured (12.8 px / 1.5 px), and it
   says both need your confirmation. **An export of that layer would settle it in one step** — it
   is the only thing on this page I could not verify to a number.

7. **The ring stroke** (§12.3): is it the 1 px `#ffffff14` → `#33333a` gradient, and at what
   angle? Ours runs left to right, which makes the left-hand arcs dimmer than the right-hand ones.

8. **Three places where we built the board's accident away, on purpose** — each is one line to
   put back: chips 2–9 are all 40 tall rather than 42 (§6 recommends it), template card 1 matches
   its siblings at 218/54 rather than 216/56 (§12.12), and the inactive tab keeps its drawn
   radius 8 next to the active pill's 999 (§12.10 — invisible either way).

9. **The Templates board's 8 px.** That board's hero is 804 and its dock 384 with an 88 px title
   row; the projects board is 812/376/80. We carry both, which is why the shelf starts at exactly
   the same height in both states. If you want one dock height, say which.

10. **Still open from the spec, unanswered and unbuilt:** what the project kebab menu contains
    (§12.15), whether the dashed slots are clickable (§12.16), which template belongs to which
    filter chip (§12.13 — no card declares a category, so the chips filter on data we invented),
    what `More` opens (§12.14), and whether the Build pill really is `#fafafa` rather than the
    brand's action blue (§12.4 — built as drawn).
