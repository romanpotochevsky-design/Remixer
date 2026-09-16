# Process Shimmer — the light that passes over anything that is working. Component spec

> **Status:** shipped in the prototype 16.09.2026 (artifact version 72); every number below is
> measured on the build, not read off a mockup. **Owner of the design:** the designer
> (Roman); the rhythm, the band shape and the hue order were read off his screen recording
> and his boards `30420:19876` («Gradient colors») and `30425:27467` (the connection card),
> then re-timed by him on the live build the same day.
> **Code:** `prototype/src/index.css` — blocks «THE THREE-HUE SHIMMER» and «THE CARD'S OWN
> FLASH»; `prototype/src/ui/shimmer.ts` (the clocks); hosts in `modules/chat/ChatPanel.tsx`
> (`Waiting`, `BriefSummary`), `modules/chat/BuildProgress.tsx` (`WorkLine`, the active row),
> `modules/publish/PublishPanel.tsx` (`ProgressCard`).
> **Decisions and rejections:** `docs/knowledge/decisions.md`, 16.09.2026. **Design
> language:** `docs/knowledge/design-system.md` §5 «Проблеск процесса» and §7 registry.
> **Evidence:** `prototype/scratchpad/shimmer/` — the recording's frames analysed, real-time
> recordings and frame-stepped films of every host.

## What it is, in one paragraph

Wherever the product is **working** — a wait in the chat, a section being written, a domain
being connected — the text that names the work is not static grey: once every 2.7 s a band
of light passes over it left to right in 1.35 s, a **white core led into by a hue**, and the
hue changes with every pass — blue, lilac, peach, blue… If a **spinner** stands beside the
text, the spinner wears the same hue at the same moment. If the working thing is a **card**,
the card's own wash brightens under a soft diagonal band that crosses it in the same window.
Nothing else in the product moves like this; that is what makes it read as «Remixer is doing
something» rather than as decoration.

The designer's rule, verbatim: «вставляем градиентную плашку в текст, там где идут какие-то
процессы/спинеры/загрузки», and «спинер синхронно с текстом тоже менял плавно и красиво цвет».

## Where it is used — and where it deliberately is not

| host | what shimmers | spinner | card flash |
|---|---|---|---|
| Chat — the waiting word (`Waiting`: «Thinking», the brief's status line) | the word, over `--white-400` grey | — | — |
| Chat — the brief summary's title while the answer is being written (`BriefSummary`, `settling`) | the title, over `--white-400` | — | — |
| Build card — the ACTIVE section (`BuildProgress`) | the working line under the section name (`.gen-work`), over `--white-480` | the section's running ring (`IconStepRunning`) | — |
| Publish panel — the connection card while the domain is in flight (`ProgressCard`, not `done`): «Registering …», «Connecting …», «Propagating …» | the headline, over WHITE | the arc | yes — the whole card |

**Not shimmering, on purpose:**
- the **finished** connection card (green tick) — nothing is moving;
- the **section name** of the active build row — its process text is the working line under
  it; two shimmering lines in one row would be noise;
- the **status chip** in the Publish panel's domain row (`Setting up`, `Waiting on your
  email`) — its ink already carries the status colour, and it has no spinner. Open question
  to the designer (handoff №14); do not add without his word;
- **buttons**, headings, body copy, anything that is not the name of work in progress.

## Timing (designer, 16.09.2026, set on the live build)

| | value | why |
|---|---|---|
| period | **2.7 s** | one sweep + one rest |
| sweep | **1.35 s** — the first half of the period | the recording ran ~0.9 s; he slowed the band «на треть» → × 1.5 |
| rest | **1.35 s** | the recording rested ~2.6 s; «сократил бы эту паузу раза в 2» |
| hue cycle | **8.1 s** = 3 periods | blue → lilac → peach → blue |
| hue hold | the whole sweep (0–50 % of each period) | a sweep never runs on a mixed colour |
| hue fade | the whole rest (50–100 %) | the SPINNER wears the hue and is visible all the time — a fade at the end of the rest would read as a snap on the arc |

The first cut kept the recording's own rhythm (0.9 s sweep, 3.5 s period). The designer, on
version 70: «слишком долгий тайминг и просто серого текста, иногда кажется что там нет
никакой анимации градиентного переливания». Keep this history: the pause must be short
enough that the effect is never mistaken for a static grey line.

## Tokens

| token / value | role | source |
|---|---|---|
| `#a4b9ff` | hue 1, blue | board 30420:19876, first gradient |
| `#caaafe` | hue 2, lilac | board, second |
| `#febbaa` | hue 3, peach | board, third |
| `#ffffff` | the band's core | board: the gradient's end stop |
| `--white-400` (40 % white) | resting ink of the waiting word | the word's own colour before the shimmer |
| `--white-480` (48 % white) | resting ink of the build line | the board-29480:48478 gradient's average (24 % ground, 72 % crests) — the line reads at the brightness it had |
| `#ffffff` | resting ink of the connection headline | the headline is white; on white the core vanishes into the base and only the hue is seen passing — the board's literal «white → hue → white» |
| `--white-100` (8 %) → 12 % | the card wash, rest → peak | board 30425:27467: stops 8 % / 12 % / 8 % (14 % for an hour — «слишком он яркий», re-set by the designer) |
| `@property --sh-hue` (`<color>`, inherits, initial `#a4b9ff`) | the animated hue | registered so it can cross-fade; unregistered custom properties animate discretely |
| `#5077fe` · `#a66fff` · `#ff8363` | the ARC's hues — the saturated twins of the three, paired by family (blue ↔ `#a4b9ff`, violet ↔ `#caaafe`, coral ↔ `#febbaa`) | designer, 16.09.2026 evening: «конкретно в спинере цвета более яркие и насыщенные»; the text keeps its pastels («трогать цвета не нужно») |
| `@property --sh-arc` (`<color>`, inherits, initial `#5077fe`) | the arc's animated hue, on the SAME clock as `--sh-hue` (`sh-arc` beside `sh-hue` on `.shimmer-hue`, one `animation-delay`) | so arc and text are one colour in two strengths at every frame |
| `@property --sh-p` (`<number>`, inherits, initial `1`) | the sweep's progress for a line drawn as several spans (the rolling headline) | see «A line drawn as spans» below |

The hue order is the board's top-to-bottom order, which is also the cyclic order of the
recording (pink → orange → blue → pink ≡ lilac → peach → blue → lilac).

## The band — read off the recording, frame by frame

The recording (36 s, 55 fps) was cut to frames; the text row's saturation per frame gave
the rhythm, and the ink was sampled along the glyphs at the peaks:

- the text rests grey; a band crosses it left → right; between sweeps nothing moves;
- the band is **grey → hue → white core → grey**: the WHITE LEADS, the hue trails behind it,
  and ahead of the white the text is still plain grey. One frame, left to right:
  `#8c93b4 → #838dc4 → #adb9e0 → #dedef0 → #ffffff → #9d9d9d`;
- the board draws «white → hue → white». The two agree under exactly one reading: the
  trailing white is transparent (the grey shows through), the leading white is opaque. That
  is how the gradient below is built.

```css
background-image: linear-gradient(90deg,
  var(--sh-base) 0%,  var(--sh-base) 34%,   /* grey ahead of and behind the band          */
  var(--sh-hue)  44%,                        /* the hue, trailing                          */
  #ffffff 54%,   #ffffff 58%,                /* the white core, leading                    */
  var(--sh-base) 62%, var(--sh-base) 100%);
background-size: 300% 100%;                  /* a canvas three texts wide                  */
background-repeat: no-repeat;
-webkit-background-clip: text; background-clip: text; color: transparent;
```

The canvas is three texts wide; the band is its middle third. `background-position` runs
100 % → 0 % over the sweep: the visible third slides from the canvas's right end (grey) to
its left end (grey), so the band crosses the text left → right with the white in front.

## Two kinds of host — and two clocks

**A word that waits alone** (`.thinking`) carries both animations itself:

```css
.thinking {
  animation: sh-sweep 2.7s linear infinite, sh-hue 8.1s linear infinite;
  animation-delay: 0s, calc(var(--sh-slot, 0) * -2.7s);
}
```

Its sweep starts the moment it mounts — the wait is 2.6 s long, and a sweep that waited for a
beat could miss it entirely. Its hue starts on the SLOT whose turn it is: `--sh-slot` (0 · 1 ·
2) is `floor(performance.now() / 2700) % 3`, read once at mount (`useShimmerSlot`), so
successive waits come in successive colours. Whole periods only: the hue fades through the
rest of each period, and a whole-period delay keeps the local sweep inside a hold.

**A text with a spinner beside it** is a SCOPE. The parent of the text and the spinner
carries the hue clock; both children read the inherited `--sh-hue` — the text in its gradient,
the spinner in its stroke — so they cannot disagree:

```css
.shimmer-hue            { animation: sh-hue 8.1s linear infinite;  animation-delay: var(--sh-t, 0s); }
.shimmer-ink, .gen-work { animation: sh-sweep 2.7s linear infinite; animation-delay: var(--sh-t, 0s); }
/* the spinner: stroke / color: var(--sh-hue) */
```

Both are phased to the PAGE clock: `--sh-t` = `-(performance.now() mod 8100) ms`, read at each
element's own mount (`useShimmerPhase`), so whenever the text (re)mounts its sweep lands in
the hue's holds. Measured before this existed: the build line remounts every ~4 s (keyed on
the beat) and restarted on blue every time — eleven seconds of a live build went blue →
lilac → blue, and peach never came. The price of the page phase: a fresh sentence waits up
to one period for its first pass instead of sweeping on arrival. The arc's continuity is
worth it.

```css
@keyframes sh-sweep { 0% { background-position: 100% 0 } 50% { background-position: 0% 0 } 100% { background-position: 0% 0 } }
@keyframes sh-hue   { 0%, 16.7% { --sh-hue: #a4b9ff } 33.3%, 50% { --sh-hue: #caaafe } 66.6%, 83.4% { --sh-hue: #febbaa } 100% { --sh-hue: #a4b9ff } }
```

Sweep windows in the 8.1 s cycle: 0–16.67 %, 33.33–50 %, 66.67–83.33 %. Each hold covers its
window; each fade fills the rest that follows.

## The card flash (board 30425:27467)

The board's fill is one frame of the animation: a linear gradient from the card's
bottom-left to its top-right, white 8 % → 12 % at 57 % → 8 %. Here the brighter band MOVES,
left to right, in the text's own sweep window, on the same `--sh-t` phase — text, arc and
wash breathe together.

```css
.shimmer-card       { position: relative; isolation: isolate; }
.shimmer-card-band  { position: absolute; inset: 0; z-index: -1; border-radius: inherit; overflow: hidden; pointer-events: none; }
.shimmer-card-band::before {
  content: ''; position: absolute; top: 0; bottom: 0; left: -100%; width: 300%;
  background: linear-gradient(72deg, #ffffff00 33.3%, #ffffff0a 50%, #ffffff00 66.7%);
  transform: translateX(-33.333%); will-change: transform;
  animation: sh-card 2.7s linear infinite; animation-delay: var(--sh-t, 0s);
}
@keyframes sh-card { 0% { transform: translateX(-33.333%) } 50% { transform: translateX(33.333%) } 100% { transform: translateX(33.333%) } }
```

- **Not `background-position`.** Repainting a 408×130 gradient every frame is exactly what the
  performance contract forbids on anything larger than a line of text. The band is a layer
  three cards wide moved with `transform` alone — composited, no paint.
- **A child, not a pseudo on the card.** The card must stay `overflow: visible`: its
  explanation box is pulled one pixel outward to lie ON the card's stroke (the third
  double-border of 15.09), and a clip would cut that. The wrapper clips with the card's radius;
  `z-index: -1` inside the card's own stacking context puts the band above the wash and under
  the text.
- Geometry: the layer covers −W…2W; the band is its middle third, so at `translateX(−W)` it
  lies wholly left of the card, at 0 exactly over it, at +W wholly right. Tilt 72° =
  atan(408/130): the board's gradient line runs corner to corner. Peak 8 % + 4 % = 12 %.

## Anatomy (DOM), per host

```html
<!-- the lone word -->
<span class="thinking" style="--sh-slot: 1">Thinking</span>

<!-- a scope: spinner + text (the connection card) -->
<div class="… shimmer-card" style="--sh-t: -4213ms">           <!-- card: wash + flash -->
  <span class="shimmer-card-band" aria-hidden></span>          <!-- the moving band, under the text -->
  <div class="flex … shimmer-hue" style="--sh-t: -4213ms">    <!-- scope: the hue clocks (--sh-hue + --sh-arc) -->
    <span class="relative h-6 w-6">                              <!-- the icon slot: the arc is ONE node for the whole walk -->
      <svg>…<path stroke="var(--sh-arc)" class="step-spin"/></svg>
    </span>
    <p class="relative … shimmer-line" style="--sh-t: -4213ms; --line-w: 182px">   <!-- the sweep clock: sh-run → --sh-p -->
      <span class="shimmer-seg" style="--seg-x: 0px">Connecting </span>             <!-- verb: keyed by its words, rolls -->
      <span class="shimmer-seg" style="--seg-x: 87px">fitration.shop</span>         <!-- host: one key, glides -->
    </p>
  </div>
  …
</div>

<!-- a scope: the build card's active row -->
<span class="… shimmer-hue" style="--sh-t: …">
  <span style="color: var(--sh-arc)"><IconStepRunning/></span>  <!-- currentColor ring — the arc's saturated twin -->
  … <p class="gen-work" style="--sh-t: …">Writing the header…</p>
</span>
```

## Component API (prototype)

```ts
// ui/shimmer.ts
SHIMMER_PERIOD_MS = 2700; SHIMMER_HUES = 3; SHIMMER_CYCLE_MS = 8100
useShimmerSlot(key?)   → { '--sh-slot': '0' | '1' | '2' }   // the lone word; re-read when key changes
useShimmerPhase(key?)  → { '--sh-t': '-NNNNms' }             // a scope or its text; re-read when key changes
```

Both are read once per mount (`useState` initializer, re-read only when `key` changes):
re-rendering with a fresh value would change `animation-delay` on a running animation and
jump it. Classes: `.thinking` (lone word) · `.shimmer-hue` (scope) · `.shimmer-ink` (text in a
scope; `.shimmer-ink--white` for white ink) · `.gen-work` (the build line — same as
`.shimmer-ink`, kept for the checks that read it) · `.shimmer-card` + `.shimmer-card-band`
(the flash). Class names are literals in the TSX — Tailwind purges anything assembled.

## Reduced motion

`.thinking` stops and settles on `--white-400`; `.shimmer-ink` and `.gen-work` drop the
gradient and paint their base colour (`background-clip` back to `border-box`); `.shimmer-hue`
stops, so a spinner rests on the initial blue; the card band stops and hides
(`opacity: 0`). Nothing disappears, nothing parks mid-sweep with half a sentence at 24 %.

## Performance

Per-frame repaint is allowed in this product in exactly the places that already had it —
`.thinking` and the build line — plus the connection headline, on the same terms: one short
line, alone on screen, alive only while work is happening. Everything else here is
`transform` / `opacity` / an inherited colour on two small elements. The card's flash is
composited (a 3× layer, `will-change: transform`). Do not extend the text shimmer to body
copy, lists, or anything that lives longer than a wait.

## Acceptance (measured, and what `npm run check:brief` holds)

- **Sync:** stepped through one 8.1 s cycle at 100 ms on the connection card — on **82/82
  frames** the headline's `--sh-hue` equals the arc's computed `stroke`; hues at the three
  sweep starts blue → lilac → peach.
- **Band travel:** `background-position` 100 % → 0 % over the sweep; the card band's layer
  −406 → 0 → +406 px (the card's width) on the same beats (headline at 100 % / 52 % / 0 %).
- **Card wash:** sampled on the card's blank strip — rest `rgb(55,55,58)`, under the band
  `rgb(62,62,65)` at 12 % (it was `rgb(65,65,68)` at the 14 % the designer called too bright).
- **Rotation on a live build:** with per-mount clocks the hue set over 11 s was {blue, lilac};
  with the page phase all three appear.
- **Suite:** the build card's rows are read by DOM shape (`span.block` per row — do not add
  block spans inside a row; the ring's colour lives on the existing icon wrapper for that
  reason), `.gen-work` is required under the active section, the domain-row chip is
  unaffected. 354/354 on 16.09.2026.

## The arc's saturated twin (16.09.2026, evening)

The designer, on the connection card's arc: «я хочу чтобы конкретно в спинере цвета были более
яркие и насыщенные — A66FFF · 5077FE · FF8363», and on the text: «в этом тексте трогать цвета не
нужно, они не должны быть яркими такими насыщенными». So the text keeps the board's pastels and
the arc gets a second registered hue, `--sh-arc`, animated by `sh-arc` on the same element, same
duration, same delay as `sh-hue` — the stops paired BY FAMILY (blue `#5077fe` with `#a4b9ff`,
violet `#a66fff` with `#caaafe`, coral `#ff8363` with `#febbaa`), not in the order he listed them:
his own rule is that the spinner changes colour WITH the text, and that only holds when the pairs
are one family. Worn by the connection card's arc (`stroke: var(--sh-arc)`) and the build card's
active ring (`color: var(--sh-arc)`); the Publish button's busy arc is white (his mock). Reduced
motion parks the arc on `#5077fe`.

Acceptance: pause `sh-hue` and `sh-arc` on the row and seek both into each hold, then read the
pair and the arc's stroke. ⚠️ Seek with `currentTime = hold + delay + 8100·n`, n chosen so the
local time is ≥ 0: a CSS animation with a negative delay is in its BEFORE phase at any negative
local time (before-active boundary = max(delay, 0)) — the effect is not applied and the initial
values show, which is exactly what the first probe read (blue, blue, blue). `check:brief` holds
the three pairs and the ring/arc equality on the build card.

## A line drawn as spans — the headline that rolls its verb (16.09.2026)

From a recording of the walk: «когда меняются текст типа этого "Connecting fit-ration.net" оно
происходит без какого-то аккуратного плавного перехода, выглядит просто как блимание в 1 кадр».
Frames 57–61 of the recording: the WHOLE row — arc included — dips to nothing for ~2 frames
between the 120 ms fade-out and the 200 ms fade-in of `swapText` on the row's group. His pick
from a stand of four (`prototype/scratchpad/swap/stand.html`): **variant B — only the verb
changes hands, the host stays.**

**Motion** (`RollingTitle` in `PublishPanel.tsx`; `verbRoll`, `verbRollFade`, `HOST_GLIDE` in
`ui/motion.ts`): the title is split at the host (`HOSTISH`); the host keeps ONE key across
stages and glides to its new x with `layout="position"` (280 ms, `[.2, 0, 0, 1]`); each verb is
keyed by its words — the old one rolls up and out (`y −8`, opacity → 0, 160 ms, `[.4, 0, 1, 1]`),
the new one rolls up into place (`y 10 → 0`, opacity → 1, 280 ms after a 60 ms beat).
`AnimatePresence mode="popLayout"` takes the leaving verb out of the flow at once. The arc lives
in its own 24 px slot outside the presence — one node for the whole walk; arc ⇄ tick crossfade
only on `done`. Both word orders work («Propagating {host}», «{host} is connected»).

**Why each span paints its own shimmer.** `background-clip: text` on the line cannot clip the
line's background to the glyphs of a child that has its own compositing layer (a transform): a
verb rolling inside the old one-element headline painted NOTHING for the roll. So the gradient
moves onto the spans (`.shimmer-seg`), and each span places the SAME band by arithmetic against
the line: image width `3 × --line-w` (the line writes its layout `clientWidth`), left edge
`−2·L·(1 − p) − --seg-x` (the span's `offsetLeft`), with `--sh-p` — the sweep's progress — a
registered `<number>` animated on the LINE (`.shimmer-line`, `sh-run`, 2.7 s, page phase `--sh-t`)
and inherited, so the spans cannot disagree. Word spaces live INSIDE the verb spans
(`white-space: pre`). Probed against the one-element headline (`scratchpad/swap/split/`):
pixel-identical, the band continuous across the gap, a translated span still lit. A finished
headline (the tick) carries no `sh-run`: p rests at 1, the band is parked off the glyphs, the
spans read plain white, nothing repaints.

⚠️ **The verb spans stay on the main thread** — `onUpdate={() => {}}` on the `motion.span`. A
WAAPI (accelerated) fade hands the element back at its pre-animation inline opacity for the beat
between the animation's `finish` and motion's next render: the leaving verb at 1, the arriving
one at 0 — read on the live build (t=180 op 1 leaving, t=363 op 0 arriving), and that beat is the
one-frame blink this exists to remove. `onUpdate` is the one prop that keeps motion 11 off WAAPI
(`AcceleratedAnimation.supports`); a function easing or a spring does NOT — they are pre-sampled
into `linear()` and composited anyway. On the main thread the last frame written IS the final
value: after the change, leaving .04 → removed, arriving .99 → 1 → 1.

**Measured** (`scratchpad/swap/live/probe.mjs`, `roll-01…06.png`, `ready.png`): the arc is the
same node at opacity 1 in all 44 samples; the host is the same node, x 3.7 → 0 over ~280 ms
(87 → 0 at the finish); the old verb absolute, y 0 → −7.7, opacity 1 → .04 by 180 ms, gone by 196;
the new verb y 10 → 0, opacity 0 → 1, settled ~350 ms; crossing at ~130 ms (.49 / .39).
`check:brief` holds four of these: the arc's node and opacity every frame; the host's node and
glide; both rolls with the 60 ms beat; the crossing without an empty frame and a monotonic landing.

## The busy button's word (16.09.2026)

The designer's mock for the press of Publish: «нужно в кнопку вставить вот так спинер и пусть у
текста будет градиент — пусть оно несколько секунд красиво крутит эту анимацию в кнопке при
публикации». For 2.4 s (`PUBLISHING_MS`) the button stays blue and disabled (`aria-busy`), a white
arc (24 box, stroke 2.2, `step-spin`) sits at `pl 12 / gap 8`, and the word wears `.busy-ink`: the
same `sh-sweep` as every process line with NO hue — base white 56 %, core white 100 % (his frame:
56 → 100 at 53 % → 56 is one frame of that band) — a lone-word host whose clock starts at mount.
The world changes at the END of the beat (`publishNow` via `commitRef`), so the title, the bar and
the domain move when the arc leaves. The button's arc is white, not `--sh-arc`: his mock, and on
the blue plate the saturated hues would fight it.

## Don'ts — each one was hit

- Do not animate `background-position` on a surface bigger than a line. Use a transformed
  layer under a clipping child.
- Do not start the hue at mount on an element that remounts; phase it (slot or page clock).
- Do not fade the hue only at the end of the rest when a spinner wears it — the arc snaps.
- Do not put `text-white` (or any colour utility) on a shimmering element: utilities come
  after the components layer and paint over the transparent ink; the shimmer vanishes.
- Do not wrap a shimmering spinner in a new `<span class="block">`: the build card's checks
  read section names by that selector.
- Do not add the shimmer to the status chip or the section title without the designer.
- Do not put a transformed child inside a `background-clip: text` element and expect its glyphs
  to paint: split the line into spans that paint their own shimmer (`.shimmer-seg`).
- Do not seek a negative-delay CSS animation to a negative local time to read a hold — it is in
  its before phase there; add whole cycles.
- Do not make the arc's saturated hues drive the TEXT: «в этом тексте трогать цвета не нужно».

## History (16.09.2026) — not to revisit

- Cut 1: recording rhythm (0.9 s / 3.5 s), `.thinking` and `.gen-work` only, hue at mount →
  «иногда кажется что там нет никакой анимации»; peach never reached on the build line.
- Cut 2: slot-phased hue; the designer re-set the clock (pause ÷ 2, speed × ⅔) and asked for
  the spinner to follow the text and for the shimmer «везде, где процессы» → scopes,
  `useShimmerPhase`, the connection headline; the arc's fixed `--action` blue of 14.09.2026
  superseded.
- Cut 3: the card flash off board 30425:27467 at 14 % peak → «слишком он яркий» → 12 %.
  `pkill -f` from the working shell killed the shell too — check the tree after any kill.
