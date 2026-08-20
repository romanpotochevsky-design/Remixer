# Motion — one language for the whole product

Implementation: `prototype/src/ui/motion.ts` (springs, for `motion/react`),
`prototype/src/index.css` (keyframes and the three duration/two easing tokens),
`prototype/src/main.tsx` (the reduced-motion policy).

Companion documents: `surfaces.md` (the materials that move), `siri-glow-spec.md` (the
preview-edge glow as an engineering hand-off).

**Facts carry IDs.** Statements about DreamHost or a competitor cite a row of
`docs/product/FACTS.md`; where a behaviour was only ever observed off a recording or a
live teardown, that is said instead of implying a register row exists. Cross-references
name a section by **number and heading** — renumbering has already broken pointers in
this folder, and a pointer that misses a "do not propose again" record is how a rejected
design gets re-proposed.

> **Approval flags in this document are binding.** Two effects are marked
> **designer-approved** and two are marked **designer-rejected**. Approved means the
> choreography and numbers are signed off and must not be retuned unless the designer
> asks. Rejected means it was built, shown, and turned down — re-proposing it wastes his
> time and ours. Both kinds of flag exist because both mistakes have already been made.

---

## 1. The five rules

Modelled on how iOS 26 opens things, which is four rules more than "fade in". We take
**motion** from iOS 26 and nothing else — the material is macOS-restrained and comes
from Figma (`surfaces.md` **§2, "Glass — macOS, not iOS"**).

1. **Springs, not durations.** A duration curve takes the same time no matter how far it
   travels; a spring settles. That is the difference between a panel that feels physical
   and a 200ms ease that feels like a slideshow.
2. **It grows from what you touched.** A popover scales up from its trigger's corner, so
   the eye never loses the causal link between click and panel. Setting
   `transform-origin` to the anchored corner is the whole trick
   (`origin-top-right` for a right-aligned trigger).
3. **The content lags the container — 60 ms.** The surface inflates first; its contents
   arrive a beat later (`popoverContent` carries `delay: 0.06`). Simultaneous is what
   makes an overlay read as a picture being swapped in rather than a surface opening.
4. **Leaving is faster than arriving, and never bounces.** Overshoot on the way out
   reads as indecision. Exit is a flat 140 ms `cubic-bezier(.4,0,1,1)`, no spring.
5. **Only `transform` and `opacity` animate. Ever.** These are the two properties the
   compositor handles without repainting. Nothing may animate width, height, blur,
   colour, gradient stops, or `background-position` on a large surface, per frame.

### The tokens

| Token | Value | For |
|---|---|---|
| `SPRING` | spring, stiffness 520, damping 34, mass 0.9 | the house spring — quick, one barely-perceptible overshoot |
| `SPRING_SOFT` | spring, stiffness 380, damping 36, mass 1 | larger surfaces, which look silly moving fast |
| `EXIT` | 0.14s `cubic-bezier(.4,0,1,1)` | every dismissal |
| `--dur-fast` | 120ms | hovers, colour state switches |
| `--dur-base` | 200ms | the default CSS transition |
| `--dur-slow` | 300ms | the largest CSS transition we allow |
| `--ease-std` | `cubic-bezier(.2,0,0,1)` | entrances, most things |
| `--ease-out` | `cubic-bezier(.4,0,.2,1)` | micro-interactions |

**Never `transition: all`.** Name the property.

### The variants — take one, don't write your own

| Variant | What it is |
|---|---|
| `popover` / `popoverContent` | Popovers, dropdowns, menus. Pair with a matching `transform-origin`. `0.94 → 1` scale, `-4px → 0` rise; the content variant is the 60 ms lag. |
| `modalScrim` / `modalSheet` | The app-modal checkout sheet over a 70%-black scrim. A centred sheet has no trigger corner, so rule 2 cannot apply — the substitute is a very short rise, and scale starts at **0.97** rather than a popover's 0.94: a 600px sheet inflating from 0.94 reads as a zoom, not as a surface arriving. |
| `bubbleSend` | Sending a chat message. See §4, "The chat send choreography". |
| `messageIn` | A reply arriving — `SPRING_SOFT`, 10px rise. Calmer than a send, because it is not your gesture. |
| `listSwap` / `listSwapItem` | Content swapping **under** something that stays (the domain lists changing while the search header holds). A conveyor, not a cross-fade: the old content leaves *upward* (`y: -12`, flat and quick) and the new rises from below on a `0.055s` stagger by section. Arriving is a spring because arriving is the part with meaning. |
| `surface` | A whole screen replacing another inside the same shell. |

**A note on why `listSwap` exists rather than a screen swap.** The domain search header
mounts **once**, outside `AnimatePresence`, and holds its own field state. It used to
live inside each screen, so a search replaced the whole screen, the `<input>` remounted,
and focus and caret were lost — which read as a page reload rather than as an answer
arriving. Only the lists below the header change now, and the `<input>` is verifiably the
same DOM node before and after. The header's own hero shrinks from 40px to 32px as a
**transition** (the way a search engine's home page settles into its results page), with
one morphing submit button — not two components.

---

## 2. The performance contract

**Nothing may invalidate paint per frame.** Every gradient, mask and blur is painted
once; the only per-frame work is GPU compositing of `transform` and `opacity`.

This is not a preference. **The first, naive version of the preview glow measured 9 FPS**
— it rotated conic-gradient angles and animated masks, which re-rasterises the full
frame on the CPU every frame, and it saturated the main thread so badly that even a
toolbar icon's spin stuttered. Every construction in this document that looks
over-engineered is over-engineered for that reason.

Consequences you will hit:

- **Rotating a gradient means rotating an element, not an angle.** Colours live on **one**
  oversized square per layer, rotated by `transform`; the conic gradient itself never
  repaints. A rotating square covers the frame at every angle iff its side ≥ the frame's
  diagonal, so the shipped side is **`142cqmax`** — 142% of the frame's *larger*
  dimension, which clears the diagonal for any aspect ratio (worst case is a square frame,
  diagonal 141.4%). Implement the shipped number, not the bound: "the diagonal" builds a
  square that uncovers a corner. `container-type: size` on the parent is what makes `cq*`
  units resolve.
- **Blur is the expensive part, and there is no cheap version.** Measured on the
  published build in a browser with no GPU: the preview glow renders at **4 FPS** with
  the glow on and **60 FPS** with it off. Moving the blur inside the effect, dropping to
  the "lite" cut, and switching the breathing off all failed to help — blurring large
  surfaces is simply expensive.
- **Therefore effects are staggered in time, not layered in space.** The preview glow
  starts **700 ms after** a send (`App.tsx`), because otherwise it eats the frames the
  bubble spring and the typing reveal need, and both then look like "there is no
  animation".
- **No blend modes over large filtered surfaces.** `screen` / `plus-lighter` triggered
  solid-green garbage frames on some GPU drivers. Thickness variation is done with alpha
  holes baked into the gradient instead.
- **Two exceptions, both deliberate and both tiny.** The `.thinking` word sweep animates
  `background-position` on text (one short word, alive only while an answer is being
  written), and the resizer's hover/drag colour switch is a state change, not a per-frame
  animation.
- ⚠️ **Class names must be full literals.** Tailwind's content scanner purges any
  `@layer` rule whose class never appears verbatim in source. `siri-layer--${k}` once
  deleted the entire glow. Never compose a class name.
- ⚠️ **Chrome does not render a mask or `overflow: hidden` *inside* an element that has
  a `filter`.** Tested separately: each renders alone, nested they vanish. So the clip
  and the blur must be on the **same** element — and the price is that the mask crops the
  blur's spread. This constraint shapes both signature effects below.
- ⚠️ **Verify animations in the embedded claude.ai preview panel, not only in a browser
  tab.** The same file plays fine in its own window and looks like "the animations are
  missing" in the panel, which has less frame budget. The panel is how the prototype is
  actually watched.

---

## 3. Reduced motion — both engines, or it looks broken

There are two animation engines in this app and **the media query only reaches one of
them.**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

```jsx
<MotionConfig reducedMotion="user"><App /></MotionConfig>   // main.tsx
```

Without the `MotionConfig`, `motion/react` springs ignore the setting entirely: the send
bubble kept springing while the CSS-driven typing reveal was dead. That reads as "the
animations are broken", not as an accessibility preference being honoured.

### ⚠️ Write `transition: none`, **not** the popular `transition-duration: .01ms`

The `.01ms` idiom leaves `transition-property: all` in force, so every element carries a
live micro-transition — and **a style write followed by a synchronous layout read hands
back the OLD value**, because a transition's value at `t=0` is its from-value.

Measured: writing the chat spacer from 509px to 0 and reading it back in the same frame
returned **509** under reduce and 0 without it. That 509px error fed the send-scroll
measurement, collapsed the scroll range, and teleported the whole thread 234px at
t≈50ms — straight through the bubble's spring. The idiom exists only to keep
`transitionend` firing; nothing here listens for it.

---

## 4. The chat send choreography

This is the motion language in its densest form, and the ordering is the design. All of
it lives in `prototype/src/modules/chat/ChatPanel.tsx`.

| t | What happens |
|---|---|
| 0 | The bubble springs out of the composer (`bubbleSend`) **and** the send flash fires (§5, "Signature effect: the send flash"). |
| 620 ms | The thread scrolls, carrying the new message to the top of the viewport. |
| ~700 ms | The preview's edge glow lights up (`App.tsx`). |
| ~2.6 s | The answer lands; the glow is dismissed over 220 ms and the reply types itself in over ≤ ~1.1 s. |

**The bubble** (`bubbleSend`): starts at `scaleX .72 / scaleY .48`, offset `+26 / +52`
toward the send button, `transform-origin: bottom-right`, springing to rest on
`bounce .45 / duration .9` with opacity pulled forward on its own 0.2s curve. Two
non-obvious choices:

- `scaleX ≠ scaleY` is the whole trick. Something squeezed out of somewhere is briefly
  wider than it is tall, and watching it round out is what reads as physical. Growing
  uniformly from a point reads as a zoom.
- It is **longer and further than feels right on paper.** A shorter cut (0.5s, scale .6)
  did render — verified frame by frame — but finished before the eye caught it, which
  reads as "there is no animation". This is the one gesture the *user* performs;
  legibility beats restraint here.

**The scroll to the top, not the bottom.** A send parks the message under the chat
header with empty space below it, where the answer will appear. This is Lovable's
behaviour, **observed off a recording of their builder** — an observation, not a
measurement, and it has no register row; the one measured Lovable-chat fact we hold is
that its pixel width is `unverified` (**FACTS CMP-031**). A chat that sticks to the bottom
does the opposite: it pushes your own message off screen while the reply is written. A
spacer grows at the end of the list to make the room, computed **once per send**, never
during the answer — otherwise the layout jumps.

Four hard-won details around that scroll:

- ⚠️ It waits **620 ms** — the spring's own length. Run both at once and the send
  animation is simply invisible: the bubble springs while the entire thread slides
  underneath it, and the eye follows the bigger motion.
- ⚠️ Measure "how much content is below" from **the list's own box**, not
  `vp.scrollHeight`: that never reports less than the viewport, so on a short thread it
  reads as "already full" and no room is made.
- ⚠️ **Subtract the spacer's height; do not zero it to measure.** Collapsing it shortens
  the scrollable range mid-measurement, the browser clamps `scrollTop`, and the thread
  jerks. Subtraction cannot be poisoned by a stray transition either (see §3, "Reduced
  motion — both engines").
- ⚠️ Cancel the `requestAnimationFrame` in cleanup, not just the timer. In a hidden tab
  rAF callbacks freeze in the queue and fire on return, scrolling against layout that no
  longer exists.

**The reply typing itself in** (`.stream-word`): all words are laid out at once and
revealed on a stagger — visually identical to streaming, at the cost of one render
instead of dozens. Step is `min(26, 820/n)` ms, so the total is
`(n−1)·step + 320` ms and caps around 1.1 s however long the answer is. Each word does
`opacity` plus a 2px rise, **no blur-in**: a blur-in looks lovely and re-rasterises text
every frame, with ~15 words in flight at any moment — exactly the per-frame paint banned
after the 9 FPS incident. Buttons under the answer wait for the reveal to finish.

**Freshness is per message, not global.** A `seen` set plus a `fresh` set decide what
animates; a single shared flag re-animated the whole thread on every send, and freshness
that resets on the next render tears words out mid-flight. Two traps inside that:

- ⚠️ Message ids continue from the **maximum id in the restored transcript**, not from a
  module constant. The counter dies with the page while `world.sent` survives in
  `localStorage` at ids 1001+; a bare `++seq` after reopening reused taken ids, the
  "new" message was already in `seen`, and the bubble and typing silently did not play
  until new ids outgrew the old transcript — which is why the bug looked random.
- ⚠️ A thread present on the first render counts as both *seen* and **parked**. Demo
  threads end on a user message, so without the parking flag the loader mistook it for a
  fresh send and the thread scrolled itself 0.7 s after page load.
- ⚠️ Do not wrap the typing reply in a `motion` opacity animation. The nesting killed the
  CSS word animation — the block sat at opacity 0 while the words sat at `currentTime` 0.

**`busy` is a union of three sources, and a union hides transitions.** The glow's
hold-off effect depends on `working` as well as `busy` on purpose. A send during a reload
pulse never flips `busy`, so a `[busy]`-only effect kept the glow burning at full
strength straight through the bubble spring with no grace period at all; symmetrically,
an answer landing mid-reload never flipped `busy` false and the whole typing reveal ran
under the glow at ~4 FPS. Re-running on `working` restarts the quiet window in both
directions: a send always gets its 700 ms, and a landed answer gets **1200 ms** (enough
for the capped ~1.1 s reveal) before the glow returns.

**The glow's dissolve is 220 ms, not 700.** The reply starts typing in the instant the
glow is dismissed, so every extra frame of blurred layers is taken from the text:
measured 5 FPS during the reveal with the long dissolve, 33 FPS with the short one.

---

## 5. Signature effect: the send flash

> ### ✅ Designer-approved, 17 Aug 2026 — "отлично, идеально".
> **The choreography and the timing numbers are signed off. Do not retune them without
> being asked.** They were already compressed three times at his request (from 200 ms
> hold on a 1.15 s clock down to ~30 ms on 0.7 s — "faster, and don't let it hit the
> eye"). The current numbers are his final ones.

Class `.composer-glow` in `index.css`; markup in `ChatPanel.tsx`. Material and thinness
come from a recording of Google's AI Mode: **a thin iridescent band hugging the box, the
interior perfectly clean.** That, too, is an observation off a recording — no register row,
no measured values. The choreography is the designer's own sketch.

### The choreography

Light is **born at the bottom-left corner**, pours up the left edge, across the top and
down the right edge until the whole horseshoe burns at once (the bottom stays dark) —
that pose **holds for a beat** — then the tail lets go and the light **drains** along the
same path, dying orange at the bottom-right corner.

| Phase | Keyframe window | On a 0.7 s clock | Easing |
|---|---|---|---|
| Pour | 0 → 45% | 0 → 315 ms | `cubic-bezier(.32,0,.34,1)` (decelerating into the pose) |
| **Hold** | 45 → 49.3% | **~30 ms** | linear |
| Drain | 49.3 → 100% | 345 → 700 ms | `cubic-bezier(.6,.05,.75,.5)` (accelerating away — leaving never bounces) |

Envelope: opacity `0 → 1` by 7%, `1` until 88%, `→ 0` at 100%. The envelope only softens
the entry and the last ember — **the drain itself is geometric** (the arcs park), not an
opacity fade.

Palette: one spectrum along the path — `#1F7CFF` blue at the birth corner, `#38C6FF` →
`#8B5CFF` violet up the left, `#BE59FF` → `#FF2F6D` pink/red across the top,
`#FF705C` → `#FF9D5C` orange at the death corner. **Google's yellow and green stay
absent** — that rainbow is their brand.

Two layers, same three arcs each: `.composer-glow-core` (blur 2.5, opacity .7) is the
filament, `.composer-glow-bloom` (blur 10, opacity .28) is its halo.

### Why three arcs, and not a growing conic

**A conic gradient cannot grow an arc.** Animating its angle stops is the 9 FPS trap
(§2, "The performance contract"). So the growing horseshoe is **three 90° arcs** —
`cg-arc-left`, `cg-arc-top`,
`cg-arc-right` — all parked along the bottom edge (135°–225° in square space) and rotated
out at **1× / 2× / 3× speed**: they emerge from the bottom-left corner one after another
and land exactly end to end. The drain mirrors it at 3× / 2× / 1×, everything parking
back under the bottom edge. Total rotation is **+360°, so the end state *is* the start
state.**

The parking garage is hidden by `.composer-glow-floor`: an opaque strip
(`top: calc(100% - 2px)`, inset 18px each side, 18px tall) the colour of the ground, with
**graded ends** (28px fades) rather than cut ones — the arcs slide under it fading, and
the corners stay exposed, which is what makes birth and death read as *corner* events.

### ⚠️ Seamlessness invariants — break one and holes appear

1. **All three arcs share the same timing function in every keyframe segment.** Positions
   then stay proportional and no arc ever outruns its cover.
2. **Arc bodies are opaque**, and paint order is **right → top → left**. Each arc's hard
   tail edge is always covered by the arc above it.
3. **At the full pose the butt joints land on matching colours** — violet meets violet,
   red meets red.
4. **Only the left arc's tail carries an alpha ramp.** It is the single edge that is ever
   visible: first as the birth, then as the retreating tail.

### ⚠️ The square-space trick, and where `scaleX` must live

The gradients are authored in **square space**, so the box corners fall at honest
45°/135°/225°/315°. `ChatPanel` measures the composer on every send and writes the real
aspect ratio into `--flash-sx` (default 3.4); `scaleX(var(--flash-sx))` maps the square
onto the real box.

**That stretch must sit inside each arc's own `transform`, after the `rotate` — never on
a wrapper.** A transformed wrapper between the filtered-and-clipped `<i>` and its children
is exactly the nesting Chromium's overflow-inside-filter bug eats: the clip stops holding
and the stretched square leaks far outside the field. Direct children of the filtered
element are the structure known to render.

### ⚠️ No mask, and no maskable alternative

A mask is applied **after** the element's filter, so a ring mask crops the blur's falloff
into two hard edges — that was the "thick gradient contour". The working construction is:

- the conic is clipped by a rounded box with `overflow: hidden` **on the same element as
  the blur** (Chrome renders nothing if they are nested — §2, "The performance
  contract");
- the blur then spreads the clipped shape softly outward, like actual light;
- the visible band is a small **1px overhang** past the field's edge (`inset: -1px`,
  radius 25 = the field's 24 + 1). ⚠️ One stale copy is still in circulation for this
  value: **`CLAUDE.md` says 3px**. The `index.css` comment used to say 2px and has been
  corrected; `prototype/docs/CHAT.md` used to say 3px and has been corrected. The shipped
  value is 1px — it was halved on the designer's request because it was catching too much
  eye — and 1px is what he approved;
- the inward spill lands on `.composer-glow-plate`, an opaque `#09090b` plate exactly
  under the field. The field is 80% translucent, so **without the plate the glow bleeds
  straight through it.**

### ⚠️ Two failure modes already fallen into — do not repeat

- **A hard 2px border on the field's border reads as neon**, not as light.
- **A blurred blob behind the field floods it with colour.** `inset: -42px` with
  `blur: 26–44px` looked promising and was unusable: the field is 80% translucent, so
  everything behind it shows through and the whole input turns purple.

Also retired: the earlier version — a short bright arc lapping the perimeter — read as a
"flying sausage" (*«летающая колбаска»*) and was replaced by the pour-and-drain above.

---

## 6. Signature effect: the resizer glow — mono-blue

> ### ❌ Designer-rejected: the iridescent version. **Do not propose again.**
> An iridescent resizer glow in the Siri spectrum (cyan → violet → pink) was built and
> shown on **17 Aug 2026**, argued for on the grounds of "consistency with the AI
> moments". It was rejected: *«выглядит стремно, верни как было»*.
>
> **The reasoning that survives the rejection, and generalises:** the spectrum belongs to
> **AI moments** — the send flash, the preview glow. The resizer is a **utility
> instrument**, and a rainbow on a tool reads as decoration. Applied to any future
> control: iridescence marks *the machine thinking*, nothing else.

The shipped effect is mono-blue and documented as material in `surfaces.md` **§10, "The
chat/canvas divider"**. Its motion contract:

- The bloom and core are painted once and moved by `transform` only; `--glow-y` is
  written to the element, and the drag never goes through React.
- The line's colour change is a 0.18 s `background` state switch, not an animation.
- Opacity crossfades are 0.22 s; the grip's scale-in is 0.18 s.

---

## 7. Reverted: the panel sheen (`.glass-sheen`)

> ### ❌ Reverted 17 Aug 2026, on the designer's question "why this sheen effect?"

There used to be a `.glass-sheen`: a highlight that swept the Publish panel's rim as it
opened — the iOS 26 signature that separates "a card scaled up" from "a surface
arriving". It was contract-safe (one band, painted once, moved by `transform`, inert
after one pass) and it is gone anyway, because it was **describing the wrong material**.

**A travelling sheen is evidence of glass** — light raking across a transparent surface.
The Publish panel is opaque `gray-850` in Figma (`surfaces.md` **§5, "The Publish panel
is solid, and that is final"**). So the sheen
decorated a material the panel does not have, on the one surface where translucent glass
had *already* been tried and rolled back.

The rule that generalises: **the panel keeps iOS 26's motion and Figma's material.**
Spring out of the trigger's corner, contents a beat behind — yes. Anything that implies
transparency — no.

---

## 8. The preview edge glow

Full engineering specification, including measured FPS per configuration, the layer
anatomy, the quality governor and porting notes: **`siri-glow-spec.md`**.

The motion-language facts a designer needs here:

- It is **the only loading indicator over the preview.** No skeleton, no dimming, no
  remount. The page stays visible and readable; the ignition flash plus the running edge
  carry the whole "working" signal — the same as the real effect on a device, which plays
  over whatever is on screen. **The skeleton was removed deliberately; do not bring it
  back.**
- Three surface modes, because light behaves differently over different grounds:
  `light` (a narrow saturated rim only — a wide faint tail is invisible against white),
  `dark` (the full bloom), and `split` (light page on top, dark below: a **static**
  vertical mask fades the wide layers in across the boundary, physics for free at no
  per-frame cost).
- Entry is a 0.6 s opacity/scale swell plus a one-shot full-surface ignition bloom;
  exit is **220 ms** (§4, "The chat send choreography", explains why it is not 700).
- The quality governor — lite-first open, the 250 ms settle, the 800 ms measuring window,
  promotion above 50 FPS, two sub-30 strikes to demote, phones short-circuited — is
  specified in `siri-glow-spec.md` **"The quality governor"**, which carries the current
  figures and keeps the superseded single 1.2 s pre-glow probe under an explicit history
  label. Read it there; do not restate the numbers here.

---

## 9. Checklist for a new animation

1. Does an existing variant in `motion.ts` cover it? Use it. Do not write a bespoke
   `duration` / `ease`.
2. Does it animate anything other than `transform` and `opacity`? Then it is wrong.
3. Does it grow from the control that triggered it? Set `transform-origin`.
4. Does its content arrive ~60 ms after its container?
5. Is its exit faster than its entry, with no bounce?
6. Will it play **at the same time** as the send flash, the typing reveal, or the preview
   glow? If yes, one of them has to move in time — the frame budget does not stretch.
7. Does it survive `prefers-reduced-motion` in **both** engines?
8. Are all its class names full literals?
9. Have you watched it in the embedded preview panel, not just a browser tab?
