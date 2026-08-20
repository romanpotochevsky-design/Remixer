# Remixer Glow — the loading edge effect. Engineering spec

The Siri-style light that runs along the inner border of the website-preview
frame while Remixer is working (generation, agent edits, preview reload).
Designed in the prototype (`prototype/src/ui/SiriGlow.tsx` +
`prototype/src/index.css`, section "Siri edge glow"); this document is what a
production engineer needs to accept it, port it, or re-implement it.

## What it costs — the headline numbers

Each row is one measurement on one rig, so read the rig with the number. The
glow's cost swings by more than an order of magnitude between environments;
none of these figures is a promise.

| Configuration | Rig, and what was on screen | FPS |
|---|---|---|
| Naive implementation (animated gradient angles / masks) | headless Chromium 1600×900, dev build, effect active over the live preview | **9** — rejected |
| Final implementation, full cut | headless Chromium 1600×900, **software rasterizer (no GPU at all)**, dev build, effect active over the live preview | 25–57 |
| Final implementation, lite cut | same rig, software rasterizer | 40+ |
| Final implementation, full cut | **published single-file build** (CSS/JS/fonts inlined), browser with no GPU, glow on over the live preview | **4** |
| Same page, glow switched off | published single-file build, browser with no GPU | 60 |
| Final implementation | any machine with GPU compositing — the normal case | 60 |

⚠️ **The 25–57 row and the 4 row are both real, and they are not in conflict:
different rig, different build.** The first is the dev server under headless
Chromium; the second is the published artifact in a GPU-less browser, which is
also roughly how the prototype gets watched inside the claude.ai preview panel.
That second measurement, and the "blur is the expensive part, and there is no
cheap version" analysis around it, is in `motion.md` §2. Do not quote either
number as *the* frame rate — 4 is the floor we have seen and 60 the ceiling.

**The honest conclusion: port the governor, not a headline number.** Because the
spread is this wide, nothing static can be promised about the glow on an unknown
machine. What makes it safe to ship is the quality governor below — it opens on
the cheap cut, counts real frames with the glow on screen, and demotes when the
machine cannot keep up. The 9fps row is why the performance contract exists at
all: that version saturated the main thread so badly even a toolbar icon spin
stuttered.

## The performance contract

**Nothing in this effect may invalidate paint per frame.** Every gradient,
mask and blur is painted once; the only per-frame work is GPU compositing of
`transform` and `opacity` — the two properties browsers animate for free.

How that is achieved:

- Colours live on oversized squares (side = the frame diagonal, so any
  rotation covers the frame) that ROTATE via `transform`. The conic gradient
  itself is never re-painted.
- Thickness waves are alpha holes baked into each layer's conic (flat 5-6%
  arcs at near-zero alpha). NO blend modes anywhere: exotic blends over large
  filtered surfaces triggered solid-green garbage frames on some GPU drivers.
- Each layer is a rounded ring: the child is masked to the ring, the BLUR
  sits on the wrapper. Blurring the parent softens the already-masked ring, so
  the falloff follows the corner radius with no hard edges — and the blur is
  computed once, not per frame.
- Breathing is an `opacity` keyframe. Entrance is one 600ms `opacity/scale`.

Anything that violates the contract (animating gradient stops, angles,
`background-position` on large surfaces, masks, filters) re-rasterizes the
full frame on the CPU every frame. That is the 9fps failure mode.

## Layer anatomy (full quality)

1. `--core` — 7px ring, blur 4, saturation/brightness lift: the hot edge line.
2. `--dense` — 12px ring, blur 12: carries most of the light (6.5s clock).
3. `--soft` — 16px ring, blur 44: the long falloff. Dark surfaces only.
4. `--alt` — sparse counter-rotating colour accents (12s, reverse).

Plus the ignition flash: a full-surface coloured bloom (opacity-only, plays
once, ends invisible) that recedes into the ring — like the real effect
lighting up.

**Surface awareness** (matched against photos of the real effect over a white
app and a black app): the content is NEVER dimmed; over a `light` surface only
the narrow saturated rim renders (a faint wide tail is invisible against white
anyway — `--soft` is dropped, saturation lifted), over `dark` the full bloom.
The host passes `surface="light" | "dark" | "split"` — each screen knows its
own theme. `split` is for pages that are light on top and dark below (a common
real-site shape): a static vertical mask fades the wide layers in across the
boundary, so the top edge stays a narrow rim while the bottom half blooms.
The mask is painted once — it does not violate the performance contract.

The glow is the ONLY loading indicator over the preview: no skeleton, no
overlay, no remount. The page stays fully visible and readable underneath;
the ignition flash plus the moving edge carry the entire "working" signal —
same as the real effect, which plays over whatever is on screen.

Wave gaps are alpha holes baked into each layer's conic (flat 5-6% arcs at
near-zero alpha). Four clocks — core 8s, dense 6.5s, soft 9s, accents 12s
reverse — so the holes align and part continuously and the full pattern
repeats only on a multi-minute cycle.

## The quality governor

`SiriGlow.tsx` degrades automatically; no configuration. The rule is **start
cheap, earn expensive**: the glow always opens on the lite cut, and the machine
has to prove it can afford more.

- **Phones / touch devices** (`max-width: 820px` or `pointer: coarse`) get the
  lite cut immediately — no probe. Mobile GPUs pay fill-rate for every blurred
  pixel; the lite cut is indistinguishable at phone sizes.
- **Everyone else opens on the lite cut too, and is probed once.** After a 250ms
  settle for the mount, the component counts real frames for 800ms — **while the
  glow is on screen**. Above 50fps → promote to the full four layers; anything
  less keeps the lite cut. The verdict is cached for the session.
- **`full` is provisional, and counting continues after it.** The probe
  necessarily ran on the *lite* cut, so it only proved the machine carries two
  layers, not four. While the full cut is on screen the same 800ms windows keep
  being measured, and **two consecutive windows below 30fps demote to lite for
  the rest of the session**. Two, not one: a single window can be eaten by an
  unrelated GC pause.
- **Lite cut** = core + dense only, waves off: 2 composited squares, 2 blurs.
- `prefers-reduced-motion` freezes all motion via the app-wide rule; the
  static ring remains as the loading indicator.

⚠️ **Two earlier versions of this governor protected nobody. Both failures are
the reason for the shape above — do not "simplify" back into either.**

1. **The probe used to run before the glow existed**, over a single 1.2s window:
   it measured an idle shell, concluded "fast machine", cached `full` and never
   looked again. Five consecutive loads all landed on the four-layer cut. A frame
   count only says something about the glow if the glow is running while it
   counts — hence the lite-first open and the 250ms settle.
2. **Promotion used to be permanent.** A borderline machine — the embedded
   claude.ai preview panel, a laptop on battery — passed the probe, got `full`,
   and then stuttered on every later send: "works right after a reload, degrades
   afterwards". The two-strike demotion above is what fixed that.

## Battery and idle cost: zero

The component only mounts while the product is actually working (world state
`generating` / chat `working` / preview reload). It unmounts when the work
ends — no hidden animation ticking in idle. Browsers additionally throttle the
CSS animations when the tab is hidden.

## Porting notes

- The CSS is self-contained (one section in `index.css`) and framework-free.
  `SiriGlow.tsx` is **153 lines**, and the governor is the bulk of it: the
  `useGlowQuality` hook is **61 lines** of code (lines 35–95 — 82 lines if you
  count the module-level cached verdict, the phone short-circuit and their
  comments), against **34 lines** for mounting and render (44 with comments).
  An earlier version of this note said "~50 lines for mounting + the governor";
  that was true before the governor grew its promote-then-watch loop, and it
  under-budgets the port by a factor of three.
- Colours are the Remixer logo palette; changing the brand palette = editing
  **four** conic-gradient stop lists, one per layer (`--core`, `--dense`,
  `--soft`, `--alt`), plus the ignition flash's radial stops. "Two" was the
  two-layer-era count.
- ⚠️ Tailwind users: layer class names must appear as full literals in source
  (`siri-layer--dense`), never composed as `siri-layer--${k}` — the content
  scanner purges rules whose class names it cannot find verbatim. This bug
  shipped once; the component now keeps a literal class map.
- The RING MASK assumes `mask-composite: exclude` (plus the `-webkit-mask*`
  pair beside it): two `linear-gradient(#fff 0 0)` layers, one of them
  `content-box`, differenced on `.siri-layer > i` — so the `padding` on that
  element is what sets each ring's width. Supported by all evergreen browsers.
  No `@property`, no Houdini, no JS per frame. ⚠️ This bullet used to read "the
  **wave squares** assume `mask-composite: exclude`" — wording left over from a
  two-square build in which a second square multiplied black wave lobes over the
  colour square. That build is gone: there is one square per layer, the waves
  are alpha holes in its own conic, and the square needs no mask at all. The
  ring does.
