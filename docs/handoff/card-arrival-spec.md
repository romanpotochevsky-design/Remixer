# Card Arrival — how a card enters the chat thread. Component spec

The two cards Remixer posts into the thread before the first build — the brief summary
after Submit and the generation outline after Approve — do not fade in. They ARRIVE THE WAY
A LIQUID GLASS SURFACE OPENS: the glass inflates out of where the gesture happened, its
contents focus onto it a beat later, the rows come up one after another, and the rim
catches the light as it forms. Designed with the designer on 09.09.2026 ("красивую и
плавную анимацию появления этих компонентов в чате, в стиле apple liquid glass"). Built in
the prototype as `cardIn` / `cardInBody` / `cardInRow` in `prototype/src/ui/motion.ts`,
used by `BriefSummary` (`ChatPanel.tsx`) and `BuildProgress.tsx`; the light is the block
"THE CARD THAT ARRIVES" in `prototype/src/index.css`. The Russian design-system record:
`docs/knowledge/design-system.md`, §5 «Карточки, которые появляются в треде».

## Where it is used

| card | trigger | born where |
|---|---|---|
| brief summary (title + Goal / Pages / Colours / Lettering) | Submit in the questions panel | the dock — the panel folds into the collar and the card rises out of the fold |
| generation outline (Home + sections, waiting pages) | Approve on the plan card, ~3s later, after "Got it — …" has written itself | the dock, likewise |

Only a card that has JUST BEEN POSTED animates (`animate` = the thread's `isFresh`). A card
that is on screen at the first paint — a restored transcript, a project reopened from Home —
mounts still, with no transform and no light.

## The choreography

| layer | from → to | timing |
|---|---|---|
| glass — the card's outer shell, `transform-origin: bottom` | opacity 0 → 1; scale .94 → 1; y 22 → 0 | spring, duration .68s, bounce .2, delay 80ms; opacity on its own 240ms ease |
| body — the inner surface (header + rows box) | opacity 0 → 1; scale 1.035 → 1; y 4 → 0 | spring, duration .6s, bounce .1, delay 160ms |
| rows — each `dt`+`dd` pair of the summary, each section `li` and waiting-page row of the outline | opacity 0 → 1; y 8 → 0 | `SPRING_SOFT` (380 / 36 / 1), delay 220ms + 45ms × row index |
| light — `.card-arrive::after`, an overlay with inset shadows (rim 24% white, top edge +14%, 28px frost at 5%) | opacity 0 → 1 → 0 | 1.1s, peak at 30% (~430ms), delay 100ms |

Why each piece:

- **Glass grows onto its size while the body shrinks onto its.** The two converge from
  opposite sides, which is what reads as a lens focusing rather than a picture being faded
  in. Simultaneous, same-direction motion reads as a slide.
- **The 80ms delay is for the dock.** On Submit the questions sheet folds into the collar
  (260ms); the card starting a beat later makes the two read as one motion — the answers go
  down, the card comes up out of the fold.
- **The light is static paint whose opacity animates.** No blur, no moving sheen: a blur
  filter repaints the whole card every frame (800×430 in the collapsed chat) and is banned by
  the prototype's performance contract; a travelling sheen was rejected on the Publish panel
  as a sign of a material the surface does not have. A rim highlight that brightens and fades
  is what glass does while it forms, and it costs one composited layer.
- **Rows cascade top to bottom** because that is the reading order; the stagger (45ms) is
  short enough that an eight-row outline is fully in by ~750ms.

Measured at real speed (every frame from the card's first existence): glass .94 → 1.0009
peak → `none` by ~850ms; body 1.035 → 1; first row full by ~450ms, last by ~600ms (summary) /
~750ms (outline); light peaks 1.0 at ~430–500ms, 0 by 1.25s; worst frame 22ms. The settled
box equals the laid-out box: nothing moves once the animation is over.

## Reduced motion

`useReducedMotion()` selects the `…Fade` variants: opacity only, no scale, no offset. The
offsets are dropped, not jumped into — `MotionConfig reducedMotion="user"` alone would put
the element at its offset target instantly and then fade it. The global reduced-motion rule
kills the light's keyframes; its base opacity is 0.

## Performance

Transform and opacity only, on the glass, the body and each row (each a motion element).
The light is one overlay with a composited opacity animation. Per-frame paint: none.

## Component API (prototype)

```tsx
// ChatPanel.tsx
<BriefSummary animate={isFresh(m.id)} />
<BuildProgress animate={isFresh(m.id)} />
```

Inside: the outer `motion.div`/`motion.section` takes `variants={glass}` and
`initial={animate ? 'initial' : false}` (false = mount settled), the inner surface
`variants={body}`, each row `variants={row} custom={index}`; `className` adds `card-arrive`
only when animating. `glass/body/row` are `[cardIn, cardInBody, cardInRow]` or the `Fade`
trio under reduced motion. To give another card the same entrance: wrap it the same way, keep
`origin-bottom` if it is born in the dock (use the trigger's side otherwise), and give its rows
`custom={i}`.

## Acceptance (what `npm run check:brief` asserts, for both cards)

- first frame: opacity < .1 and scale < .96 (transparent and smaller than its box);
- the glass overshoots past 1 and settles to `transform: none`, opacity 1;
- the body starts above 1.02 while the glass is still below .98, and ends at 1;
- some frame has the first row > .8 lit while the last is < .2; both end at 1;
- the rim light peaks above .9 and ends at 0;
- the summary's box 300ms after settling equals its settled box;
- the outline appears more than 1.5s after Approve (after the acknowledgement line).
