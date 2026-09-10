# Drawn Ring — the hover and selection border of every answer the brief panel offers. Component spec

The 1px hover ring and the 2px selection ring around anything pickable in the
brief panel (the four questions Remixer asks before the first build) do not switch on:
they APPEAR AS A GRADIENT THAT SWEEPS ROUND THE ROW — brightest where it began,
thinning to nothing where it has not begun yet — and settle into a plain ring.
Designed against Figma 29688:26919 (hover), 29688:27643 (selected) and
29688:29507 (the mid-draw frame) with the designer over five screen recordings
on 08.09.2026. Built in the prototype as `DrawRing` in
`prototype/src/modules/chat/BriefPanel.tsx` plus the block "THE BORDER THAT
DRAWS ITSELF" in `prototype/src/index.css`; the Russian design-system record
with the full history is `docs/knowledge/design-system.md`, section «Бордер,
который рисует себя». This document is what an engineer needs to accept it, port
it or re-implement it, and what a designer needs to reuse it on another control.

## Where it is used

| control | box the ring is drawn on | radius | stroke sits |
|---|---|---|---|
| answer row of a radio-list question (goal, pages) — Figma 29688:26919 / 27643 | the row itself | 16 | INSIDE the box (`--ring-side: 1`) |
| palette tile (2×2 grid) — Figma 25732:138657 hover / 29745:57892 picked | the plate plus the designer's 4px | 12 (8 + 4) | OUTSIDE the box (`--ring-side: -1`) |
| lettering card (2×2 grid) — no board; follows the palette on the designer's word | the card plus the same 4px | 16 (12 + 4) | OUTSIDE the box |

Nothing ever changes size, fill or position in any state: both rings are
strokes on an overlay, never a border. Where the board puts the stroke inside
the geometry (the row) the rect is inset by half the stroke; where a gap has to
survive the stroke thickening (the grids, whose 4px is the designer's breathing
room and not room for the ring to sit in) the rect is offset outward by half
the stroke instead, so only the ring's outer edge grows. Rows sit 6px apart with
the hairline divider centred in the gap, and the grids' boxes 8px apart, so a
picked ring and its neighbour's hover ring can never touch.

## States

| state | what is on screen | how it gets there |
|---|---|---|
| rest | nothing; hairline dividers between rows; radio at 48% white | — |
| hover, drawing | the 1px 32%-white ring materialising clockwise from the top-left corner over **220ms**; radio brightens to 80%; dividers on both sides of the row fade | `pointerenter` |
| hover, drawn | the solid 1px ring | the lap's clock runs out |
| leaving | the ring fades over 160ms — while a draw still in flight goes on drawing under the fade (the light dims, it does not snap) — then `visibility: hidden` | `pointerleave` |
| picked, drawing | the 2px gradient ring materialising the same way over **280ms**; the hover ring fades out under it | `click` (also on an already-picked row: redrawing is the confirmation) |
| picked, drawn | the solid 2px gradient ring, `aria-pressed="true"`; no hover ring on a picked row | the lap's clock runs out |
| given up | the old row's 2px ring fades over 160ms while the new row draws | another row is picked |

## Tokens

| | hover | selected |
|---|---|---|
| stroke width | 1px | 2px |
| inset (rect x/y) | 0.5px | 1px |
| corner radius of the stroke path | 15.5px (row 16 − ½ stroke) | 15px |
| colour | white at **32%** (the designer's number, 08.09.2026; the board's flattened `NA/500` read 48% and was too loud) | white under the house gradient: alpha **.98 → .55 (at 48%) → .82** along the vector (−.069, .401) → (1.069, .599) of the ring's box; its mean is .72 = the board's flattened `Neutral Alpha/800` |
| draw duration | **220ms** | **280ms** |
| fade-out on leave / on giving up | 160ms, `--ease-std` | same |

Timings are the designer's third speed (700/880 → 350/440 → 220/280): a hover
fires on every row the pointer crosses, so its draw has to be over before the
eye tires of it.

Colour of an unlit dash (`--ring-ground`): `rgb(16 16 18)` — the answers card
(`#09090b` at 143/255) over the dock's flat `#1a1a1c`. See "Rendering rules".

## The model — a schedule of fades, not a travelling light

The ring is **96 equal dashes of ONE rounded rectangle**. Each dash fades in on
its own clock, from nothing to the ring's colour, starting a little later than
the dash before it. Nothing moves. What the eye sees is the contour
materialising — and, because later dashes are still faint while earlier ones
are full, a soft gradient that sweeps round the row as they catch up.

| parameter | value | note |
|---|---|---|
| `SEG_N` | 96 | ~18px per dash on the 800px row, ~10px in the 432px split |
| `SEG_LAP` | 0.003 of the perimeter | each dash overlaps the next by ~5px (~3px in the split) — see seams |
| `SPREAD` | 0.35 of the lap | the start times are spread over this much of the duration |
| fade of one dash | 0.65 of the lap, `cubic-bezier(0.25, 0, 0.75, 1)`, fill-mode both | `1 − SPREAD`: the last dash to start ends exactly with the lap |
| schedule | `startOf(p) = BLOOM(min(p, 1 − p) / 0.5)` for the dash at clockwise position p (0…1 from the top-left corner); delay = `startOf · SPREAD · duration`, inline per dash | |
| `BLOOM` | the integral of a velocity that rises from nothing over the first 0.2 of an arm, holds, and falls to nothing over the last 0.3 | sampled once at module load; the same curve for every ring |
| "drawn" signal | a no-op animation on the group, the length of the lap; its `animationend` swaps the dashes for one solid stroke | |

The light scatters BOTH ways from where it ignites — that is what the board's
corner shows — and the two arms are **halves of the perimeter**, so p and 1 − p
always start together and the schedule is symmetric about the corner by
construction. Inside an arm the front is not launched at full speed and does not
arrive at full speed: it accelerates out of the ignition corner and decelerates
into the far one, where the two fronts fade into each other instead of meeting.

**The quantity being minimised is CURVATURE, not slope.** The eye reads a bend in
a gradient as an edge (Mach banding) however gentle the slope beside it, so the
softest ramp is not the flattest one: a linear per-dash rise measures the lowest
slope of anything tried and still reads harder, because it has two corners — where
a dash starts brightening and where it stops — and the sweep drags both round the
ring. Hence the eased ends of `BLOOM` (no bend where the front starts or stops)
and a per-dash curve with zero slope at both ends (no bend where a dash starts or
stops).

Measured over the whole draw, on the model and again on the live build by pausing
every dash's animation and stepping `currentTime`:

| | before 10.09.2026 | now |
|---|---|---|
| worst curvature | 4.28 | **0.00** |
| worst slope (%full per 1% of perimeter) | 16.7 | **1.9** |
| banding between neighbouring dashes | 24.6% | **2.1%** |
| one point of the border, invisible → full | 45 ms | **94 ms** (same 220 ms clock) |

Also still true at real speed (rAF sampling of every dash's computed `stroke`):
every dash monotonic, no position ever dims, worst frame 20ms, the row's box
identical in every sample, frame zero empty.

**Why not a dash that grows** (the four versions before this one, all rejected
by the designer on screen recordings). A growing dash has a TIP, and at the
speed he asked for the tip crossed ~140 CSS px a frame — the whole bottom edge
lit between two frames («дёргано»). Every attempt to soften it (a long feathered
head ahead of the tip, a "burst" scattering behind the start) was a SECOND LAYER
that had to fade out for the body to replace it, so one position went
lit → dim → lit (measured 68 → 48 → 95 on the left side — «глючно»). A schedule
of fades has one value per position, rising once. Do not go back to a moving
light.

## Anatomy (DOM)

```
<button class="brief-pick brief-opt|brief-tile--swatch|brief-tile--card"
        data-hov? data-on? data-press? aria-pressed>
  <svg class="brief-draw brief-draw--hover">          ← overlay, inset 0, pointer-events none
    <g class="ink">                                   ← carries the ring's translucency
      <g class="is-drawing">  (while drawing)         ← no-op lap animation → animationend
        <rect class="seg" pathLength="1" stroke-dasharray="{SEG_S+SEG_LAP} 2"
              stroke-dashoffset="-{k·SEG_S}" style="animation-delay: …" /> × 96
      </g>
      <g> <rect class="body" pathLength="1" /> </g>   (at rest — one solid stroke)
    </g>
  </svg>
  <svg class="brief-draw brief-draw--pick"> … same … </svg>
  …radio, title, consequence line…
</button>
```

Shared, defined once per panel:

```
<linearGradient id="brief-pick-grad" gradientUnits="userSpaceOnUse"
                x1="-0.069" y1="0.401" x2="1.069" y2="0.599">  white at .98 / .55@.48 / .82
<mask id="brief-pick-mask" maskContentUnits="objectBoundingBox" x=-.1 y=-.1 width=1.2 height=1.2>
  <rect x="-0.05" y="-0.05" width="1.1" height="1.1" fill="url(#brief-pick-grad)" />
```

`pathLength="1"` normalises the dash units to FRACTIONS OF THE PERIMETER, so the
same dash pattern and the same keyframes fit a 400px row in the split and an
800px row in the collapsed chat. The rect's path starts on the top edge just
past the top-left corner and runs clockwise; dash k is one dash of length
`SEG_S + SEG_LAP` pushed forward by k·SEG_S through a negative
`stroke-dashoffset`. The gap (2) is longer than the path, so the pattern's
second copy can never land on the path.

## Rendering rules — each one is a measured trap

1. **The dashes are OPAQUE and OVERLAP; the fade is a COLOUR.** Sixty-four
   anti-aliased dashes butted end to end seam: where a boundary falls inside a
   device pixel the two partial coverages composite as alpha and the pixel comes
   out darker — measured −47/255 on the 2px ring, a dark tick every 27px for the
   whole draw. Overlapping translucent dashes trades that for a bright tick
   wherever two stack. So each dash animates its `stroke` from `--ring-ground`
   (the colour of the ground under the ring) to `#fff`, and the later dash
   simply covers the earlier where they overlap (neighbours differ by ~3%).
2. **The ring's translucency is applied ONCE, to the flattened group `.ink`:**
   hover `opacity: .32`; selected `mask: url(#brief-pick-mask)` — the gradient's
   alphas as a luminance mask over white. An unlit dash therefore paints the
   ground at the ring's alpha over the same ground — nothing — and a lit one
   paints white at the ring's alpha, which is exactly the alpha stroke the board
   specifies. Resting rings measure pixel-identical to plain
   `rgba(255,255,255,.32)` / gradient-alpha strokes.
3. **No blend modes.** `mix-blend-mode: screen` (opaque grey g ≡ white at alpha
   g) was exact on a test page and 8/255 too dark in the app: blending is exact
   only when no ancestor isolates, and motion's wrappers around the sheet
   (transform / opacity) do.
4. **`--ring-ground` is a legacy `rgb()`, not the `color-mix()` it equals.** CSS
   interpolates two legacy sRGB colours in sRGB — the straight line "white at
   alpha g" follows — but a `color-mix()` result is not legacy and pulled the
   whole fade into Oklab (measured `oklab(…)` computed values: brighter
   mid-tones than the alpha stroke this stands in for).
5. **The mask's rect reaches 5% past the group's box** and the gradient is
   `userSpaceOnUse`. The box is the stroke's centre line; a mask rect sized
   exactly to it clipped the stroke's outer pixel (the 2px ring rendered 1px).
   In a mask whose content units are the box, a `userSpaceOnUse` gradient still
   runs −.069 → 1.069 of the BOX, not of the wider rect.
6. **`--ring-ground` must track the card's fill and the dock's ground.** The
   check suite compares it with a real pixel of the card beside the row (±2).
   One drifted token and the unlit dashes would draw a faint ring of the old
   colour for the first frames of every draw.
7. **Hidden rings are `visibility: hidden`, not `opacity: 0`** — invisible
   layers still cost paint (the project learned this on the template card's
   `Preview` pill).

## Behaviour — a JS key, not `:hover`

Chromium drops a removed CSS animation to its base value instantly, with no
transition from the animated value (measured: 0.1972 → 0 in the next frame).
Under `:hover` a half-drawn ring would either vanish in one frame or, with a
"full" base, flash on whole. And `:hover` is wrong for a row that MOUNTS under
a motionless pointer (the next question appears under the cursor): it would
light at once, without drawing. So:

| event | what happens |
|---|---|
| `pointerenter` | `hovKey++` — the hover group remounts and draws from the corner; `data-hov` shows the overlay at once |
| `pointerleave` | `data-hov` removed — the overlay fades 160ms while the draw goes on under the fade; then hidden |
| lap ends | `animationend` of the no-op lap animation → key back to 0 → the group remounts as one solid stroke (same pixels) |
| `click` | `press++` — the pick group remounts and draws the 2px ring; `data-on` (and `aria-pressed`) show it |
| click on an already-picked row | draws again — that is the confirmation |
| another row picked | the old row's `data-on` goes → its ring fades 160ms |
| picked while hovered | the hover overlay fades under the 2px draw; a picked row never carries the hover ring |

Reduced motion: the keys are not bumped, so the solid `.body` mounts at once —
the ring appears as a state (no draw), and `data-press` can never stick waiting
for an `animationend` that will not come.

## Component API (prototype)

```tsx
<DrawRing kind="hover" | "pick" drawKey={number} onDrawn={() => void} />
```

- `drawKey > 0` mounts the 96 dashes drawing (a new value restarts the draw);
  `0` mounts the resting solid stroke.
- `kind` selects the geometry, clock and translucency (`--dur`, `.ink` opacity
  or mask) in CSS; the component itself knows nothing about widths or colours.
- `onDrawn` fires once per draw, from the lap animation's `animationend`.
- The host supplies `data-hov` / `data-on` / `data-press` for the show/hide
  rules; in the prototype that host is `Pick`, one button behind the row, the
  plate and the card, which owns the hover and press keys and mounts both rings.
- `.brief-pick` carries the clocks (`--draw-hover` 220ms, `--draw-pick` 280ms)
  and `--ring-ground`; the SHAPE's own class carries the geometry:

```css
.brief-opt          { --ring-r: 16px; }                     /* stroke inside  */
.brief-tile         { --ring-side: -1; }                    /* stroke outside */
.brief-tile--swatch { --ring-r: 12px; }
.brief-tile--card   { --ring-r: 16px; }
```

⚠️ The DEFAULTS (`16px`, `1`) live in the `var()` fallbacks where the rect is
written, never as declarations on `.brief-pick`: both classes land on the same
element with the same specificity, so a declaration there would win or lose by
source order alone. Measured on the first build — the plate drew the row's ring
(`rx` 15.5 instead of 12.5) because `.brief-pick` sits lower in the file.

To reuse on another rounded control: give it a `position: relative` box, the two
overlays, the three data attributes, a `--ring-ground` equal to what is painted
under its edge, and the two geometry variables. The only part that knows the
shape is the rect: `rx = --ring-r − --ring-side × ½ stroke`.

## Performance

Animating `stroke` re-rasters the ring every frame — per-frame paint, allowed on
the same terms as the "Thinking" shimmer and the build card's working line: one
ring on one row, alive for ≤ 280ms, on the user's own gesture. Only the
overlay's fade is composited. Measured on the prototype build: 60fps, worst
frame 20ms, the row's box identical in every sample. The masked group costs one
small mask raster per frame while drawing; at rest nothing animates.

## Acceptance (what `npm run check:brief` asserts)

- Part-way into a hover the ring is drawing, partly lit (0.05 < mean < 0.9) and
  a gradient: the corner's first dashes brighter than the far side.
- Drawn: one solid 1px white stroke, `.ink` at opacity .32, radius 15.5 on a
  16px row, no fill, no box-shadow, hairlines on both sides gone, rows 6px
  apart, no row moved by a pixel.
- The unlit dash colour equals a real pixel of the card (±2).
- The ring leaves with the pointer (opacity 0, hidden).
- A press draws the 2px ring in the gradient mask; it settles solid with
  `aria-pressed`; the hover ring is given up; a picked row and a hovered
  neighbour keep ≥ 6px; picking another row fades the old ring while the new
  one is still drawing.
- On the grids: every plate sits 4px inside its own box and the boxes stand 8
  apart; a hovered plate takes the 1px ring at `.ink` .32 with `rx` 12.5 on a
  12px box (which is what proves the stroke is drawn outside it); a picked plate
  takes the 2px masked ring at `rx` 13 with no box-shadow — the blue `--action`
  ring is gone; a picked lettering card the same at `rx` 17 on a 16px box; and
  no box or plate moves by a pixel, hovered, picked or at rest.

## History (all 08.09.2026, all on the designer's recordings) — not to revisit

| version | read as | what the recording showed |
|---|---|---|
| two beams from the corner meeting bottom-right | "left to right, not round the object" | on a row ten times wider than tall both beams run right |
| one lap, short stepped head | "a strip with no gradient" | 100px of tail at 2.5px/ms is two or three frames |
| long feather .36 + burst .22 behind the corner + group fade-in | "hard and wooden" → then "a hover on a hover" | 58% of the ring faintly lit in frame zero, then the bright body ran over it |
| light growing out of the corner, twice as fast | "glitchy… no softness… from full transparency" | tip at 140px/frame; left side 68 → 48 → 95 |
| schedule of fades, arms 80/20 | accepted 08.09, then **"слишком грубо… поломанные бордеры с обрывами"** (10.09.2026) | the arms carried the same range of start times over 80% and 20% of the perimeter: the gradient ran 0.65 of the ring on one side and 0.16 on the other, and the fronts collided a third of the way along the bottom edge — 25% brightness step between neighbouring dashes, measured on his own recording |
| **schedule of fades, symmetric arms with eased ends** (this) | chosen by the designer on 10.09.2026 from a bench of six recipes: "я тоже почему то F посчитал самым мягким и приятным" | curvature 0.00, slope 1.9, banding 2.1%, a point rises in 94ms |

Two lessons from the rejected versions survive in the model: **light scattering
both ways from the corner**, and **one value per position, rising once**.

⚠️ The third lesson used to read "one CLOCKWISE lap — the direction is part of
the meaning". It is gone: the 80/20 split existed to keep most of the ring
sweeping clockwise, and that is exactly what made one side four times harder
than the other. The direction survives as a bias, not as a rule — the ring still
ignites at the top-left corner, but both arms are equal now.
