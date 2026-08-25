# "Add template" — independent QA of the picker, the composer pill and the attach chip

**Subject:** commit `76d5b28` — `prototype/src/modules/home/TemplatePicker.tsx`, the composer
half of `prototype/src/modules/home/HomePage.tsx`, the exported `TemplateCard` / `CategoryChips`
in `prototype/src/modules/home/Dock.tsx`, `fullscreenSheet` / `fullscreenContent` in
`prototype/src/ui/motion.ts`, the `.tplpick-heading` block in `prototype/src/index.css`, the four
new miniatures in `prototype/src/modules/home/thumbs.tsx`, and `templatePickerOpen` /
`attachedTemplate` in `prototype/src/state/ui.ts`.
**Reference:** Figma `GP4jNXtc37VTFVZDc9JF0a`, nodes `28616:59168` (picker) and `28364:40053`
(Home with the new composer), plus card nodes `28626:703 / 716 / 730 / 620`.
**Spec under test:** `docs/features/home-page/figma-spec-add-template.md`.
**Date:** 25 Aug 2026. **Method:** Vite dev server plus the shipped `npm run artifact` single
file, driven with Playwright/Chromium at `deviceScaleFactor 1`. Captures at
`…/scratchpad/qa3/`.

> ### ⚠️ Which revision this measures
>
> Everything below was measured against **`76d5b28`**, the commit named in the brief, plus the
> two fixes in §10. **While this pass was running, a second agent began the fluid-grid rework**
> and committed `b913356` ("Checkpoint: picker and thumbnail work in flight") — a snapshot that
> deliberately preserves both of my fixes — and then kept editing `TemplatePicker.tsx`,
> `Dock.tsx` and `index.css`. In that in-flight version the header has been lifted **out** of the
> scroller (so the heading and chips hold still while the grid moves), the content column has
> lost its `max-w-[1560px]` and the grid is fluid.
>
> Re-checked against the working tree at the end of this pass, so you know what still holds:
>
> | Section | Status against the in-flight rework |
> |---|---|
> | §2 animation, §3 paint | **holds** — `motion.ts` untouched, sheet transform-origin still `454.734px 586.078px`, still `transform`/`opacity` only |
> | §4 focus and keyboard | **holds** — re-verified after the rework: focus enters the sheet, Shift+Tab wraps to `Close`, Escape restores to `Add template`, both motion settings |
> | §5.1 grid geometry, §7 card widths | **stale in part** — sheet, scrim, ✕, heading (48, 73, 22.5) and chip row (151.5, 721.98, centre 827.99) are unchanged; the scroller now starts at y 219.5 and spans the full 1624, and the grid markup changed, so the row/column numbers need re-measuring |
> | §5.2–5.4 type widths, Figma diffs, miniatures | **holds** — none of it was touched |
> | §6 filters, §8 regression, §9 artifact | **holds**; the artifact in §9 was built from `76d5b28` + my fixes, before the rework landed |
>
> `npx tsc -b` is clean on the working tree. Re-run §5.1 and §7 once the rework settles.

**Verdict: yes — put it in front of the designer.** The geometry is exact: the sheet, heading,
chip row and 6 × 3 grid land on the spec's numbers to the pixel at the drawn size, and the
animation does what its own docstring claims — the sheet's scale is anchored to the pill's centre
to within 0.3 px on every frame of both the entrance and the exit, the content genuinely trails
the surface, and the exit is 2.1× shorter than the entrance. One real defect was found and
fixed: the picker declared `aria-modal` while leaving the keyboard entirely outside it. Eleven
smaller things are open (§11), all of them either designer questions the spec already records,
the missing licensed typefaces, miniature-fidelity calls that belong to the designer rather than
to QA, or housekeeping created by the concurrent rework noted above.

---

## 1. Method notes and the one limit worth knowing

Three measurement techniques, because no single one settles everything:

1. **Numeric per-frame trace.** An rAF loop reads the sheet's `getBoundingClientRect()`,
   inline `style.transform` and the content column's, live and unpatched. From any two frames
   at different scales the transform's **fixed point** is recoverable in closed form
   (`fx = 16 + (left − 16) / (1 − s)`), and a pure scale's fixed point *is* its
   transform-origin — so this proves where the sheet grows from without reading the source.
2. **Dense frame images.** The environment's software renderer drops frames, so a live 30 ms
   screenshot cadence is impossible. Instead the animation's *clock* was slowed 30× before the
   app loaded (wrapping the rAF timestamp motion's frameloop reads, plus `performance.now`),
   which stretches the real spring on the real DOM without touching product code. 30 ms of
   animation time then equals 900 ms of wall clock, so a full-viewport screenshot is negligible.
3. **`document.getAnimations()`** for authoritative durations and, more importantly, for the
   *actual* animated property list off each effect's keyframes — the paint audit is read from
   the engine, not from comments.

**Limit:** `getComputedStyle(el).opacity` is unreliable here. Measured: the content column read
`opacity: 0` on a frame where it was settled with `transform: none`. motion hands opacity to
WAAPI and the main thread does not always see the composited value. `Animation.setPlaybackRate`
over CDP also failed to slow those WAAPI tracks, so the **slowed-clock image sequences are
faithful for geometry only** — in them the opacity has already finished. The opacity evidence
below therefore comes from `getAnimations()` timings plus the live (unslowed) trace's ramp, and
the live compositor screencast carries the visual record of the fade. Every table says which
source it came from.

### Captures

| File | What |
|---|---|
| `contact-open-1656.png`, `contact-open-1440.png` | 15 real frames of the entrance at exact 30 ms animation-time steps |
| `contact-close-1656.png`, `contact-close-1440.png` | the exit at 30 ms steps — **geometry only** (see the limit above) |
| `contact-live-open.png`, `contact-live-close.png` | live compositor frames: true opacity *and* geometry, sparse |
| `seq/open-seq-*.png`, `seq/close-seq-*.png`, `seq/live-*.png` | the individual frames |
| `trace-1656x1196.json`, `tight-1656x1196.json`, `open-seq-*.json` | the raw per-frame numbers |
| `picker-{1656x1196,1440x900,1280x800,1200x700}.png` (+ `-scrolled`) | viewport sweep |
| `home-chip-*.png`, `filter-*.png`, `card-*.png` | the attach chip, each filter, the six cards compared to Figma |
| `artifact-*.png` | the whole flow inside the shipped single file |
| `builder-seeded.png`, `builder-after-send2.png` | the builder-shell regression |

---

## 2. The animation, frame by frame

### 2.1 Does the sheet grow from the pill? — yes, provably

Pill at 1656 × 1196: `(408, 584.08) 125.47 × 36` → **centre (470.73, 602.08)**.
Declared `transform-origin` on the sheet: `454.734px 586.078px`, i.e. exactly that centre in
sheet-local coordinates (`470.73 − 16`, `602.08 − 16`).

Fifteen real frames of the entrance, 30 ms of animation time apart. `edges` are how far each
edge still is from its settled position; `fixed` is the fixed point recovered from the box alone:

| anim-t | sheet box (l, t, r, b) | scale | edges l / t / r / b | recovered fixed point |
|---|---|---|---|---|
| 0 ms | 34.16, 39.40, 1593.31, 1156.92 | 0.9601 | 18.2 / 23.4 / **46.7** / 23.1 | (470.8, 602.0) |
| 30 | 32.25, 36.94, 1598.23, 1159.35 | 0.9643 | 16.3 / 20.9 / 41.8 / 20.7 | (470.8, 602.2) |
| 60 | 28.42, 32.01, 1608.05, 1164.21 | 0.9727 | 12.4 / 16.0 / 32.0 / 15.8 | (470.6, 602.0) |
| 90 | 24.44, 26.88, 1618.29, 1169.27 | 0.9814 | 8.4 / 10.9 / 21.7 / 10.7 | (470.5, 602.0) |
| 120 | 21.51, 23.10, 1625.84, 1173.00 | 0.9879 | 5.5 / 7.1 / 14.2 / 7.0 | (470.9, 602.1) |
| 150 | 19.35, 20.32, 1631.38, 1175.74 | 0.9926 | 3.4 / 4.3 / 8.6 / 4.3 | (470.5, 602.1) |
| 180 | 17.94, 18.50, 1635.02, 1177.54 | 0.9957 | 1.9 / 2.5 / 5.0 / 2.5 | (471.3, 602.7) |
| 210 | 17.06, 17.37, 1637.27, 1178.65 | 0.9977 | 1.1 / 1.4 / 2.7 / 1.3 | (469.0, 602.3) |
| 240 | 16.54, 16.69, 1638.62, 1179.32 | 0.9988 | 0.5 / 0.7 / 1.4 / 0.7 | (472.7, 598.0) |
| 270 | 16.26, 16.33, 1639.34, 1179.67 | 0.9994 | 0.3 / 0.3 / 0.7 / 0.3 | (475.0, 598.0) |
| **300** | **16, 16, 1640, 1180** | **1.0000** | 0 / 0 / 0 / 0 | — (settled) |

The fixed point is **(470.7 ± 0.3, 602.1 ± 0.3)** across every frame where it is recoverable —
the pill's centre. (The last two rows wander because dividing by `1 − s` at `s = 0.999` amplifies
the 0.01 px rounding of a `getBoundingClientRect`; they are noise, not drift.)

**The anchor corner is the one nearest the pill.** On the first frame the left edge is 18.2 px
from home and the right edge 46.7 px — a 2.6 : 1 ratio, i.e. the surface unmistakably opens
*rightward out of a point on the left*, where the pill is. Vertically it is near-symmetric
(23.4 / 23.1) and that is honest, not a bug: the pill's centre y is 602 and the viewport's is 598,
so the pill genuinely sits on the vertical midline at this size.

At **1440 × 900** (pill centre `(362.75, 418.2)`) the recovered fixed point is
**(362.5 – 363.3, 417.2 – 418.5)** and the first frame's edges are **l 13.9 / t 16.1 / r 42.4 /
b 18.6** — here the pill is above and left of centre and the top-left corner is correspondingly
the still one. Same proof, different corner, no special-casing.

### 2.2 Durations

Authoritative effect timings from `getAnimations()`, entrance and exit:

| Element | Entrance | Exit |
|---|---|---|
| sheet — transform (spring, main thread) | ≈ **300 ms** to settle (measured, table above) | — |
| sheet — opacity | 150 ms, `cubic-bezier(0.2, 0, 0, 1)` | **140 ms**, `cubic-bezier(0.4, 0, 1, 1)` |
| scrim — opacity | 180 ms, `cubic-bezier(0.2, 0, 0, 1)` | **120 ms** |
| content column — opacity + y | 400 ms after a **60 ms delay** | **100 ms** |

Wall-clock, in-page click to done (five runs, this frame-starved renderer):

| | cold 1st open | warm 2nd | warm 3rd |
|---|---|---|---|
| click → first painted frame | **154 ms** | 50 ms | 47 ms |
| click → scale settled | 539 ms | 380 ms | 395 ms |
| flight only (first frame → settled) | 384 ms | 329 ms | 348 ms |
| overshoot on scale | **0.000 %** | 0.000 % | 0.000 % |
| frames > 33 ms | 10 / 35 | 9 / 49 | 9 / 47 |

Exit, gesture to unmount: **213 / 214 / 211 ms** for Escape, ✕ and scrim respectively. Against a
329–384 ms entrance flight that is **1.6–1.8× shorter measured, and 2.1× shorter in animation
time** (140 ms exit vs 300 ms entrance transform). Rule 4 holds. The exit shrinks back toward the
pill too: its recovered fixed point is (470.3 – 470.9, 600.8 – 602.4), and the sheet is pulled at
`s = 0.9807` — AnimatePresence removes it on the 140 ms mark, just before the declared 0.975 is
reached, which is why the close reads as a snap rather than a retreat. The live screencast agrees:
the sheet is fully present at 0 ms and completely gone by the next delivered frame at 74 ms.

`SPRING_SOFT` (stiffness 380 / damping 36 / mass 1) is ζ = 0.923, so its theoretical overshoot is
0.05 % of a 4 % sweep — 0.02 px on a 1624 px surface. Measured max scale is exactly 1.00000 on
every run. The docstring's "one barely-perceptible overshoot" describes `SPRING`, not this; on a
sheet this size that is the right choice and it is worth knowing that it does not bounce at all.

### 2.3 Does the content arrive after the sheet? — yes

The content column's inline `translateY` through the entrance (real frames):

| anim-t | 0 | 30 | 60 | 90 | 120 | 150 | 180 | 210 | 240 | 270 | 300 | 330 | 360 | 390 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| translateY | 12 | 12 | **12** | 10.72 | 8.20 | 5.65 | 3.63 | 2.21 | 1.25 | 0.69 | 0.35 | 0.17 | 0.07 | **none** |

It has not moved at all through the first two frames and starts between 60 and 90 ms — the
declared 60 ms delay, visible. It lands at 390 ms, about 90 ms *after* the sheet settles at 300 ms.
The live trace agrees on opacity: at the frame where the sheet's opacity read 0.97 the content's
still read 0.26. Rule 3 holds, and the column moves as one block — 18 cards, one spring.

### 2.4 Jumps, double animations, re-opens

* **No double animation, no jump.** Scale starts at exactly 0.9600 on every open, with **zero
  direction changes** across every run, and the transform is a pure `scale()` — no translate
  component ever appears in the matrix.
* **First open vs second:** identical animation; the only difference is that the cold open shows
  nothing for **154 ms** before the first frame, against ~48 ms warm. That is React mounting the
  sheet, not motion: the sheet holds **985 DOM nodes** (~55 per card) and a measured grid rebuild
  costs **73 ms for 18 cards vs 15 ms for 3**. It recurs, mildly, on every open, because
  AnimatePresence unmounts the whole tree on close. It reads as a short press-and-then-open, not
  as a stutter, and no fix is proposed — but it is the thing to watch if the library grows.
* **Re-open anchors correctly** — including when the pill has been replaced by the attach chip,
  which is wider: chip centre `(512.30, 602.08)` → measured `transform-origin`
  `496.305px 586.078px`. Exact. The origin is captured in a state initializer per mount, so each
  open re-measures.
* **Re-open *inside* the exit** (Escape, then click the pill 60 ms into a 140 ms exit): exactly
  **one** dialog in the DOM, settled at `16, 16, 1624 × 1164`, `transform: none`, `opacity: 1`.
  AnimatePresence reconciles the interrupted exit cleanly; no stuck ghost, no doubled scrim.
* **`prefers-reduced-motion: reduce`**: the sheet mounts with `transform: none`, closes cleanly,
  and focus still restores. `<MotionConfig reducedMotion="user">` in `main.tsx` covers this
  surface for free.

---

## 3. Per-frame paint discipline

Read out of `document.getAnimations()` mid-flight, not from the source.

**The animation itself is clean.** Mid-entrance, four animations are live inside the dialog:

| Target | Animated properties | Duration |
|---|---|---|
| scrim `div.absolute.inset-0` | `opacity` | 180 ms |
| sheet `div.absolute.inset-4` | `opacity` | 150 ms |
| content `div.mx-auto.max-w-[1560px]` | `opacity` | 400 ms |
| — sheet + content `transform` | driven by motion's own rAF loop, so it does not register as a WAAPI animation; sampled inline it is only ever `scale()` / `translateY()` | — |

Nothing animates width, height, top, left, `filter`, `backdrop-filter` or `box-shadow` on the
sheet, the scrim or the content column. Static audit of the settled sheet and scrim:
`backdrop-filter: none`, `filter: none`, `box-shadow: none`, `will-change: auto` on both. The
sheet is opaque `rgb(24, 24, 27)` with no border and no shadow, as drawn.

**Three flags, none of them fatal:**

1. **A `box-shadow` transition fires on a grid card during the entrance.** Measured 60 ms after
   the open click: `CSSTransition props=[boxShadow] duration=120ms` on
   `div.relative.w-full.flex-1` — a template card's thumbnail. Cause: the sheet opens *under the
   cursor*, so whichever card lands beneath the pointer immediately takes
   `group-hover:ring-1`, and Tailwind's `transition-shadow` animates `box-shadow`, which
   invalidates paint every frame. It is one card, one 1 px ring, 120 ms — but it is exactly the
   property class the house rule bans, and it coincides with the largest surface animation in the
   product. **Not fixed here**, because the hover is `TemplateCard`'s and therefore also the
   dock's signed-off behaviour; changing it touches an accepted surface. Cheap fix when the
   designer next looks at the card: put the ring on a pseudo-element and transition its
   `opacity` instead.
2. **Eight elements inside the sheet carry a static `filter: blur()`** (the Serena/wellness
   miniature's abstract block ×3, plus warm glows in the restaurant and payments cards), along
   with 48 `box-shadow`s and 84 gradient backgrounds. None of them animate — but they sit inside
   the surface being scaled, and a main-thread transform on an unpromoted element re-rasters what
   it contains. This is the honest reason the entrance drops ~9 frames on a software renderer.
   `will-change: transform` is *not* set on the sheet at any point during flight (checked every
   frame), so nothing is being promoted. Worth a note in the handoff; a real GPU makes it moot.
3. **The close button's `backdrop-filter: blur(16px)` is present and static**, as the spec draws
   it (40 × 40). It is the sheet's only backdrop filter. Correct.

The chips carry only Tailwind's colour transition (`color, background-color, border-color, …`
120 ms) — colour, not paint geometry, on a 36 px pill. Fine.

---

## 4. Focus and keyboard

### 4.1 The defect (before the fix)

The dialog declares `role="dialog" aria-modal="true"` over the whole viewport, which makes a
screen reader hide everything behind it — and then left the keyboard out there:

| Step | Measured (before) |
|---|---|
| focus right after opening | `BUTTON "Add template"` — **outside the dialog**, under the scrim |
| one Tab from there | `BUTTON "Voice input"` — **still outside**; focus never entered the sheet |
| the 6 chips, 18 cards, ✕ | unreachable without Tabbing the entire page behind the sheet first |
| after Escape | focus wherever it drifted (`Voice input`), never restored |
| after ✕ or scrim click | `BODY` — focus lost entirely |

### 4.2 After the fix

| Check | Result |
|---|---|
| focus on open | the sheet itself (`DIV`, `tabIndex -1`, no visible ring) — **inside the dialog** |
| Tab order inside | `All templates → Ecommerce → Portfolio → Business & services → Health And Beauty → More → Pick …(18 cards) → Close` |
| 30 consecutive Tabs | **never leaves the sheet**; wraps from ✕ back to the first chip |
| Shift+Tab from the sheet | wraps to `Close`, then walks the grid backwards |
| Escape closes | yes; focus returns to **`Add template`** |
| ✕ closes | yes; focus returns to **`Add template`** |
| scrim click closes | yes; focus returns to **`Add template`** |
| after picking a card | focus lands in the composer **field** (the composer's own effect), and the restore deliberately stands down so the two do not fight |
| pill reachable by keyboard alone | yes — 2 Tabs from the field; `Enter` opens the picker |
| attach chip by keyboard | yes — `Change template — <name>` then `Remove template`, both real buttons |
| composer text across open → pick → detach | `"a bakery in Lisbon"` survives all three, verified at each step |
| under `prefers-reduced-motion` | identical focus behaviour |

One thing deliberately *not* changed: **`DomainModal` has the same gap** (no focus move, no trap,
no restore — only an Escape listener). It is a small centred sheet rather than a full-screen one
with 25 controls, so the damage is much smaller, but it should get the same treatment. Recorded
here rather than fixed, to keep this change inside the surface under test.

---

## 5. The grid against Figma `28616:59168`

Side by side: `picker-1656x1196.png` against the board render.

### 5.1 Geometry — exact

| Element | Spec (sheet-local) | Measured (viewport, sheet at 16, 16) | Δ |
|---|---|---|---|
| sheet | (16, 16) 1624 × 1164, r 16, `#18181b`, no border/shadow/blur | 16, 16, 1624 × 1164, r 16px, `rgb(24,24,27)`, all three `none` | **0** |
| scrim | 50 % black over the whole board | `rgba(0, 0, 0, 0.5)`, 1656 × 1196 | **0** |
| close ✕ | 40 × 40 at sheet (1568, 16), r 12 | 40 × 40 at 1584, 32 → sheet (1568, 16), r 12px | **0** |
| heading cap-top | sheet y 57 | viewport y 73 → sheet **57.0** | **0** |
| chip row | sheet y 135 → 171, 36 tall | 151.5 → 187.5 → sheet 135.5 → 171.5 | +0.5 (cap-trim) |
| grid row 1 / 2 / 3 | sheet y 203 / 507 / 811 | 219.5 / 523.5 / 827.5 → sheet 203.5 / 507.5 / 811.5 | +0.5 |
| card | 233.333 × 272, 6 columns, gaps 32 / 32 | 233.33 × 272, 6 columns, `gap: 32px`, x 48 / 313.33 / 578.66 / 843.98 / 1109.33 / 1374.66 | **0** |
| ground below row 3 | 81 | **80.5** | −0.5 |
| card thumbnail / meta | flavour-normalised 218 / 54 | 218 / 54 on all 18 | as intended |
| chip group centre | board sits at 832 (4 px right of true centre) | **827.99** = true centre of the 1560 column | intentional, spec §4/§10.4 |
| heading centre | 828 | **827.99** | **0** |

The `+0.5` on everything below the heading is the `text-box-trim` cap box resolving to 22.5 px
rather than the spec's rounded 22 — one shared cause, arithmetic, not a mistake. Nothing scrolls
at the drawn size (`scrollHeight === clientHeight === 1164`), exactly as the board draws it.

Copy, verbatim and correct: heading `Pick a template. We'll remix it` (straight `'`, no trailing
period, as drawn and as flagged); six chips `All templates / Ecommerce / Portfolio /
Business & services / Health And Beauty / More`; all 18 captions in the drawn order, with
`Homeware store website temp…` truncating as it does on the board; the ghost kebab correctly not
rendered.

### 5.2 Type widths — the missing typefaces, recorded not chased

Gilroy and Proxima Nova are absent; Outfit and Figtree stand in.

| | Figma | Built | Δ |
|---|---|---|---|
| heading ink width | 431 (the cap-trimmed box) | **425.39** | −5.6 (−1.3 %) |
| chip group | 707 | **721.98** | +14.98 (+2.1 %) |
| chip widths | 112 / 105 / 86 / 151 / 146 / 67 | 113.67 / 108.89 / 89.28 / 152.39 / 149.22 / 68.53 | +1.4 to +3.9 each |
| "Add template" pill | 123 | **125.47** | +2.47 (+2.0 %) |

All four are pure substitution deltas; both centred elements still land on 827.99.

### 5.3 What still differs

1. **No thumbnail hairlines.** The board gives AURA a near-white `#f7f7f7` 1 px border and the
   four square/new assets (Serena, crypto, restaurant, saas) a dark `#1f1f22` one, leaving three
   with none (spec §5.1, §10.7). The build has **no static border on any card** — only a
   `group-hover:ring-1`. The spec asks the designer whether it should be one rule or per
   thumbnail, so shipping without them is defensible, but it is an undocumented omission and the
   dark ones do real work on the near-black cards. **Open.**
2. **Row 3 col 1 (the Synco wordmark zoom) fills its clip.** The board draws that thumbnail at
   its natural short aspect with **61.75 px of sheet ground showing below it** inside the 218 clip.
   The build stretches it to the full 218. This is the same normalisation as the card-flavour fix
   and is probably right, but it is not called out anywhere. **Open.**
3. **Photographic assets are abstractions**, per the standing house rule — ArchiForm's building
   photo is a column skyline, Serena's portrait is a blurred block, the restaurant's dishes are
   gradient discs. Expected; recorded so the designer is not surprised.

### 5.4 The four new miniatures

`card-saas-r2c1.png` / `card-restaurant-r2c2.png` / `card-crypto-r2c3.png` /
`card-agency-r1c3.png` against `28626:703 / 716 / 730 / 620`.

**`saas` — image 386, social-media SaaS. Close.** Azure ground, white nav with a pill CTA,
two-line white headline, two pill CTAs, the white dashboard panel rising from the lower half with
its stat figures, and the white band with `Engage your audience without wasting your time` — all
present and in the right places. Differs: the board sets `social media` in a contrasting
italic/serif and the build underlines it instead (no serif face in the prototype); the board's
one-line subline under the headline is missing; the board's dashboard has a thin dark browser bar
across its top.

**`restaurant` — image 385, heritage food brand. The biggest miniature diff.** The board's
character is a **cream / maroon alternation** — cream nav, maroon hero, **cream** stats strip with
maroon numerals, **cream** "Discover Our Complete Range" section, then the gallery. The build is
maroon almost throughout: the top nav band is a darker maroon (`#521010`), the stats band is
maroon (`#5a100d`) with cream numerals, and the "Discover" section is cream-on-maroon. Only the
bottom gallery strip is cream. The scalloped mustard placemat under the platter is also absent.
Everything is structurally in the right place; the colour balance is inverted. **Not fixed** —
recolouring three bands of a carefully composed miniature is a design decision, not a QA one, and
the designer will be looking at both images side by side anyway.

**`crypto` — image 380, MineMax. Close, one copy fix.** Nav wordmark, eyebrow chip, two-line
headline, two pills, the violet orb, the two feature panels — all there. The line under the orb
read **`Join MineMax`** in the build where the spec transcribes **`Ask MineMax`**; changed to
match the spec (see §9). Differs still: no grey subline under the headline; the orb has a plain
ring where the board has radiating dashes; the right panel's `Sustainability by Nature` caption is
drawn as bars.

**`agency` — image 382 top crop. Closest of the four.** Nav, the three-line `Synco® Creative
Agency` headline, the blue wave, the white band with the full paragraph, and `50+ 100+` cut by the
clip — all matching. Differs: the board's right-hand rail is a distinct dark panel with four
labelled rows; the build draws five bare dashes at the right edge with no panel behind them.

---

## 6. Filters

Picker opened with the dock deliberately left on `Health And Beauty` first.

| Chip | Cards | Which sites | Count sensible? | Empty line |
|---|---|---|---|---|
| All templates (active on open) | **18** | all ten thumbnails | yes — the whole library | n/a |
| Ecommerce | **5** | AURA ×2, ArchiForm ×3 | yes — matches `TEMPLATE_LIBRARY` | n/a |
| Portfolio | **4** | Synco agency, WE MAKE MEDIA ×3 | yes | n/a |
| Business & services | **6** | PayNexus ×2, saas, restaurant, crypto, Synco wordmark | yes | n/a |
| Health And Beauty | **3** | Serena ×3 | yes | n/a |
| More | **18** | everything | falls through to all, same as the dock | n/a |

Every count was checked by hand against the `category` field of each of the 18 rows and all six
agree. **Independence confirmed both ways:** the picker opened on `All templates` while the dock
sat on `Health And Beauty`, and the dock was still on `Health And Beauty` after the picker closed;
leaving the picker on `Portfolio` and re-opening it gives `All templates` again, because the
filter is per-open state, as the docstring says.

**The empty state is unreachable.** Every category has at least three cards, so the quiet
`No templates in this category yet.` line cannot be produced through the UI. The branch was
reviewed instead: it is the dock's own line, same string, same token, so it will not be a blank
hole when a category first empties out — but it is untested by execution and this report will not
claim otherwise. `More` returning all 18 is the same behaviour as the dock and is already spec
§10.5's open question ("what does `More` open?").

---

## 7. Viewport sweep

| | 1656 × 1196 | 1440 × 900 | 1280 × 800 | 1200 × 700 |
|---|---|---|---|---|
| sheet | 1624 × 1164 @ 16,16 | 1408 × 868 | 1248 × 768 | 1168 × 668 |
| heading fully inside sheet | yes | yes | yes | yes |
| ✕ fully inside, top-right | yes | yes | yes | yes |
| heading overlaps ✕ | no | no | no | no |
| chip row on one line | yes | yes | yes | yes |
| columns | 6 | 6 | 6 | 6 |
| card width | 233.33 | 197.33 | 170.66 | **157.33** |
| grid overflows | no (as drawn) | yes | yes | yes |
| scrolls through `ScrollArea` | — | yes, thumb 674 px | yes, thumb 527 px | yes, thumb 398 px |
| last card reachable and fully visible | — | yes | yes | yes |
| composer row height (36 = no wrap) | 36 | 36 | 36 | 36 |
| pill → mic gap | 620.5 | 620.5 | 620.5 | 620.5 |
| chip → mic gap (attached) | 537.4 | 537.4 | 537.4 | 537.4 |
| pill/chip overlaps Build | no | no | no | no |
| pill label clipped | no | no | no | no |

Nothing clips, nothing wraps, nothing overlaps, and the overflow always goes through the house
`ScrollArea` (native bars are off app-wide; the overlay thumb appears on scroll and its height
tracks the extent). Two observations:

* **The grid never drops a column** — it holds 6 and shrinks the cards to 157 px at 1200 wide.
  That is tight but legible (`picker-1200x700.png`: captions ellipsis cleanly, thumbnails keep
  their 218 height). It is also inconsistent with the dock, whose `.home-card` stops shrinking at
  200 px and scrolls sideways instead. Spec §10.13 asks the designer exactly this question, so no
  rule was invented here. **Open.**
* **The heading scrolls away** with the column at 1280 and below, since the whole content column
  is inside the scroller. The ✕ stays put (it is outside the scroller). Nothing is drawn either
  way; flagging rather than deciding.

**Pre-existing, not from this work:** at 1200 × 700 the page's own minimum heights
(hero `min-h-[488px]` + dock `min-h-[236px]` = 724) exceed a 700 px viewport, so the bottom 24 px
of the dock is clipped and the page does not scroll. Visible with the picker closed too. Recorded
for the Home page's own backlog.

---

## 8. Regression

### 8.1 Home page — unchanged

Re-measured against the numbers in `qa-report.md` §2.1. Every entry that report recorded is
identical, to the digit:

| Element | Previous QA | Now | Δ |
|---|---|---|---|
| hero panel | 8, 8, 1640, 812 (r 20) | 8, 8, 1640, 812 | **0** |
| topbar | 8, 8, 1640, 72 | 8, 8, 1640, 72 | **0** |
| avatar | 1596, 28, 32, 32 | 1596, 28, 32, 32 | **0** |
| logo | 780, 167.89, 96, 96 | 780, 167.89, 96, 96 | **0** |
| **composer field** | 348, 498.08, 960, 138 | **348, 498.08, 960, 138** | **0** |
| composer text row | 348, 515.08, 944, 52 | 348, 515.08, 944, 52 | **0** |
| composer button row | 348, 584.08, 944, 36 | 348, 584.08, 944, 36 | **0** |
| `+` button | 364, 584.08, 36, 36 | 364, 584.08, 36, 36 | **0** |
| mic | 1154, 584.08, 36, 36 | 1154, 584.08, 36, 36 | **0** |
| Build | 1206, 584.08, 86, 36 | 1206, 584.08, 86, 36 | **0** |
| chip scroller | 348, 660.08, 912, 42 | 348, 660.08, 912, 42 | **0** |
| end-cap button | 1268, 661.08, 40, 40 | 1268, 661.08, 40, 40 | **0** |
| dock | 0, 820, 1656, 376 | 0, 820, 1656, 376 | **0** |
| dock title row | 32, 820, 1592, 80 | 32, 820, 1592, 80 | **0** |
| tab track | 32, 838, 211, 44 | 32, 838, 211, 44 | **0** |
| **dock card 1** | 32, 900, 238.667, 272 | **32, 900, 238.67, 272** | **0** |
| card 1 thumbnail | 32, 900, 238.667, 216 | 32, 900, 238.67, 216 | **0** |
| card 1 meta bar | 32, 1116, 238.667, 56 | 32, 1116, 238.67, 56 | **0** |
| kebab | 230.667, 1124, 40, 40 | 230.67, 1124, 40, 40 | **0** |

The field's own paint is also unchanged: `rgba(9, 9, 11, 0.8)`, r 32, and the rim still an
`inset 0 0 0 1px` shadow rather than a border. The new pill sits at `408, 584.08, 125.47 × 36` —
8 px right of the `+`, as the spec's `Left` wrapper says.

### 8.2 Builder shell — unchanged

Sent `make the palette warmer` from a builder reached through the picker, traced at 17 ms median:

* **Bubble spring** — 45 frames of live transform, t = 14 → 937 ms. First frame is
  `translateX(26px) translateY(52px) scaleX(0.72)`, i.e. `bubbleSend.initial` verbatim; it
  overshoots to −3.26 / −6.51 px at t ≈ 305 ms (the `bounce 0.45`) and settles by ~937 ms (the
  `duration 0.9`). Opacity is at 1 by t ≈ 300 ms on its own faster curve. Intact.
* **Thread parking scroll** — first movement at t ≈ 689 ms (the deliberate 620 ms wait, plus a
  starved frame), then `0 → 2 → 8 → 18 → 33 → 74 → 99 → 208`, landing the new bubble at viewport
  top 100 with empty space below it. Intact.
* **Siri glow** — appears at **t = 740 ms** (the documented 700 ms fora that keeps it off the
  bubble's spring) in `siri-glow--lite siri-glow--split`, and goes out at ≈ 2771 ms, which is
  exactly when the canned reply lands and its 47 words begin printing. Intact.
* **Send flash** (`.composer-glow`) mounted; **Thinking** indicator t = 14 → 2593 ms then gone.
* Zero console errors through the whole sequence.

Nothing in the send choreography was touched, as instructed.

---

## 9. The shipped artifact

`npm run artifact` → `dist/remixer-prototype.html`, 0.56 MB, four stand-in fonts embedded, the six
licensed-font rules dropped as designed. Loaded from `file://` and driven through the whole flow:

| Step | Result |
|---|---|
| load | Home page, pill reads `Add template` |
| pill → picker | sheet **1624 × 1164 @ 16,16**, 18 cards, 6 chips, heading `Pick a template. We'll remix it`, focus **inside** the dialog, `transform-origin 454.734px 586.078px` |
| filter `Portfolio` | 4 cards |
| back to `All templates` | 18 cards |
| pick a card | picker closes, pill becomes the attach chip with its live mini-thumbnail |
| Build | builder opens, first message `Remix the "AI Moodboard Canvas" template` |
| reply | canned answer prints, credits tick to 630, `Update 1` appears |

**Requests: 1 total (the file itself). External requests: 0. Console errors: 0. Console
warnings: 0.** (On the dev server there are the expected `Failed to decode downloaded font`
warnings for the six absent licensed faces — the build strips those rules, so the artifact is
silent.)

---

## 10. What I fixed

1. **Focus containment in the picker** (`TemplatePicker.tsx`). Focus now moves to the sheet on
   open, Tab and Shift+Tab cycle inside it, and dismissal returns focus to the pill or chip that
   opened it — while standing down when a card was picked, so the composer's own field-focus
   effect wins. Implemented locally to the component: a `tabIndex={-1}` focus target with
   `focus:outline-none`, one `onKeyDown` wrap handler, and a mount effect whose cleanup restores.
   No new dependency, no shared abstraction wired to a single caller. Re-verified: 30 Tabs never
   escape, all three dismissals restore, unchanged under reduced motion.
2. **`Join MineMax` → `Ask MineMax`** in the crypto miniature (`thumbs.tsx`), aligning the code
   with its own spec's transcription. ⚠️ Both that transcription and my re-read are by eye off a
   233 px MCP render — the proxy blocks the full-resolution asset, and `get_screenshot` will not
   upscale past natural canvas size — so this is a read, not a certainty. Noted in the code
   comment; confirm with the designer.

`npx tsc -b` clean; `npm run artifact` builds and runs.

---

## 11. What remains, and why

| # | Open item | Why it was not changed here |
|---|---|---|
| 1 | Thumbnail hairlines (`#f7f7f7` on AURA, `#1f1f22` on the four square assets) are absent | Spec §10.7 asks the designer for one rule vs per-thumbnail; adding them now would pre-empt that answer |
| 2 | `restaurant` miniature is maroon where the board alternates maroon / cream (nav, stats strip, "Discover" section) | Recolouring a composed miniature is a design call, not a QA fix; the side-by-side is in this report |
| 3 | `saas` missing its subline and the dashboard's browser bar; `crypto` missing its subline and orb dashes; `agency` missing the dark right-rail panel | Same reason — miniature fidelity, and the designer is about to look at all four |
| 4 | Row 3 col 1 fills its clip where the board leaves 61.75 px of ground | Almost certainly the right normalisation, but undocumented; confirm and write it down |
| 5 | The grid holds 6 columns down to 157 px cards rather than dropping columns like the dock | Spec §10.13 is exactly this question; inventing a responsive rule is what the spec says not to do |
| 6 | The heading scrolls away with the grid below 1280 tall | Nothing drawn; a sticky header is a design decision |
| 7 | A card's `box-shadow` hover transition fires during the entrance | The hover belongs to `TemplateCard`, i.e. also the signed-off dock; fix it there, once, with an opacity-transitioned ring |
| 8 | `DomainModal` has the same focus gap this fix closed | Out of the surface under test; smaller blast radius, but it should get the same treatment |
| 9 | At 1200 × 700 the Home page clips the bottom 24 px of the dock | Pre-existing, from the page's own `min-h` sums; not caused by this work |
| 10 | The empty-filter line is unreachable with the current data | Reviewed by reading, not by execution; it is the dock's own line and string |
| 11 | §5.1 grid rows/columns and §7 card widths need re-measuring | The fluid-grid rework landed mid-pass (see the box at the top); item 5 above may be answered by it |

Everything the spec itself lists as an open question for the designer (§10.1 – §10.14) is
untouched and still open — heading punctuation, whether the attached-chip state is what he wants,
whether the sheet scrolls, the two scrim strengths (50 % here vs 70 % on the checkout sheet),
placeholder captions, `More`, and the rest.

---

## 12. Verdict

**Ready for the designer.** Every number the spec gives is hit; the animation is not just
plausible but measurably anchored to its trigger at both viewports, on first open and on re-open,
including when the trigger has been replaced by the chip; the exit is properly shorter than the
entrance; nothing animates a paint-invalidating property on the sheet, the scrim, the grid or the
chips; the filters are correct and independent of the dock's; the flow survives four viewports and
runs identically inside the shipped single file with zero console errors and zero external
requests; and the Home page and the builder shell are byte-for-byte and beat-for-beat unchanged.

The one thing that was genuinely broken — a full-screen `aria-modal` dialog with the keyboard
locked outside it — is fixed and re-verified, including against the fluid-grid rework that landed
while this pass was running. What is left is a short list of miniature-fidelity differences and
questions that only the designer can answer, and every one of them is named above with a picture
next to it — plus one piece of housekeeping: the grid's own geometry wants re-measuring once the
rework settles, since it is the only part of this report that the rework moves.
