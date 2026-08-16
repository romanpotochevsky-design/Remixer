# Remixer Glow — the loading edge effect. Engineering spec

The Siri-style light that runs along the inner border of the website-preview
frame while Remixer is working (generation, agent edits, preview reload).
Designed in the prototype (`prototype/src/ui/SiriGlow.tsx` +
`prototype/src/index.css`, section "Siri edge glow"); this document is what a
production engineer needs to accept it, port it, or re-implement it.

## What it costs — the headline numbers

| Configuration | FPS |
|---|---|
| Naive implementation (animated gradient angles / masks) | **9** — rejected |
| Final implementation, software rasterizer (no GPU at all) | 25–57 |
| Final implementation, lite cut, software rasterizer | 40+ |
| Any machine with GPU compositing (normal case) | 60 |

All measurements: headless Chromium, 1600×900, effect active over a live page.
The 9fps row is why the performance contract below exists — that version
saturated the main thread so badly even a toolbar icon spin stuttered.

## The performance contract

**Nothing in this effect may invalidate paint per frame.** Every gradient,
mask and blur is painted once; the only per-frame work is GPU compositing of
`transform` and `opacity` — the two properties browsers animate for free.

How that is achieved:

- Colours live on oversized squares (side = the frame diagonal, so any
  rotation covers the frame) that ROTATE via `transform`. The conic gradient
  itself is never re-painted.
- Thickness waves are a second square with black lobes, `mix-blend-mode:
  multiply`, rotating on its own clock. Where it passes, the light thins.
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
2. `--dense` — 12px ring, blur 12: carries most of the light. Waves at 9s.
3. `--soft` — 16px ring, blur 44, opacity .6: the long falloff. Waves at 13s,
   reverse.
4. `--alt` — sparse counter-rotating colour accents, `plus-lighter`, 23s:
   makes hues recompose instead of visibly spinning.

Wave gaps are alpha holes baked into each layer's conic (flat 5-6% arcs at
near-zero alpha). Four clocks — core 10s, dense 6.5s, soft 9s, accents 12s
reverse — so the holes align and part continuously and the full pattern
repeats only on a multi-minute cycle.

## The quality governor

`SiriGlow.tsx` degrades automatically; no configuration:

- **Phones / touch devices** (`max-width: 820px` or `pointer: coarse`) get the
  lite cut immediately — no probe. Mobile GPUs pay fill-rate for every blurred
  pixel; the lite cut is indistinguishable at phone sizes.
- **Everyone else** is probed once: the component counts real frames for 1.2s
  on first activation. Under 30fps → lite cut, verdict cached for the session.
- **Lite cut** = core + dense only, waves off: 2 composited squares, 2 blurs.
- `prefers-reduced-motion` freezes all motion via the app-wide rule; the
  static ring remains as the loading indicator.

## Battery and idle cost: zero

The component only mounts while the product is actually working (world state
`generating` / chat `working` / preview reload). It unmounts when the work
ends — no hidden animation ticking in idle. Browsers additionally throttle the
CSS animations when the tab is hidden.

## Porting notes

- The CSS is self-contained (one section in `index.css`) and framework-free;
  the component is ~50 lines of React for mounting + the governor.
- Colours are the Remixer logo palette; changing the brand palette = editing
  two conic-gradient stop lists.
- ⚠️ Tailwind users: layer class names must appear as full literals in source
  (`siri-layer--dense`), never composed as `siri-layer--${k}` — the content
  scanner purges rules whose class names it cannot find verbatim. This bug
  shipped once; the component now keeps a literal class map.
- The wave squares assume `mask-composite: exclude` support (all evergreen
  browsers). No `@property`, no Houdini, no JS per frame.
