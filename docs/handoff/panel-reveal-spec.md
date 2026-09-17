# Panel Reveal — how a block unfolds inside the Publish panel. Component spec

The Publish panel changes shape while a domain connects: the in-flight card changes its
words, the registrant-email card appears under the field, the domain row appears at the
bottom, and at the end the in-flight card goes away. Until 16.09.2026 every one of those was
a mount or an unmount, and the panel's height snapped with it — the designer recorded the walk
and asked for the opposite: «внутри формы появляются и исчезают объекты, и высота формы резко
меняется… нужно чтобы оно не резко прыгало, а плавно и красиво с плавной анимацией меняло
высоту, а те объекты что внутри появляются и пропадают тоже должны иметь плавную и красивую
анимацию. в стиле apple liquid glass!» — pointing at the brief's question dock as the example:
«с bounce effect».

Built as `Reveal` in `prototype/src/ui/Reveal.tsx`, with its motion in `prototype/src/ui/motion.ts`
(`REVEAL_OPEN`, `REVEAL_CLOSE`, `revealBody`, `swapText`) and its light borrowed from the thread's
cards (`.card-arrive`, `prototype/src/index.css`). Used by `modules/publish/PublishPanel.tsx`
for every block that can come and go. The Russian design-system record:
`docs/knowledge/design-system.md`, §7 «Блок, который разворачивается в панели — Reveal».

## What moves

| block | shows when | pad (unfolds with it) | radius |
|---|---|---|---|
| the nudge banner «Ready to put your site live?» | never published, no domain, not dismissed | 8 · 8 · 8 (px-2 pt-2 pb-2) | 12 |
| the in-flight card (Provisioning / Connecting / Propagating / «is connected») | any stage of the walk, or `ready` | 6 · 6 · 0 (px-1.5 pt-1.5) | 12 |
| status cards — stopped showing · older site · waiting in cart · one last step (letter) | their states | 19 on top (8 when another card stands above it) | 12 |
| the dashed door «Buy or connect a domain» | no domain attached, nothing at the till | 19 on top | 16 |
| the domain row — status chip · `Unlink` | the domain is connected | — | 16 |

Words changing INSIDE a block that stays are a different, smaller motion (`swapText`, below):
the in-flight card's stage, the address in the URL field, the chip's word in the domain row.

## Anatomy

```
Reveal (AnimatePresence initial={false})
└─ clip      motion.div · overflow hidden · height: 0 ⇄ natural (spring)          ← the moving edge
   └─ sizer  div · flow-root · the block's pad · watched by a ResizeObserver      ← the natural height
      └─ glass  motion.div · relative · origin-top · border-radius = block radius ← rides in behind the edge
         ├─ [the block itself, unchanged]
         └─ ::after via .card-arrive (only when arriving) — the rim light
```

- **The clip is the edge.** Its height is a spring between 0 and the sizer's measured height.
  Because the panel is `height: auto` and the sum of its blocks, the panel's bottom edge moves
  with every clip — one continuous motion, whatever combination of blocks is coming and going.
- **The sizer is the truth.** It is the block at its natural height, measured by a
  ResizeObserver from its LAYOUT box (`borderBoxSize`). Anything that changes inside — a longer
  sentence, a chip with more words, `Resend` becoming «Sent again…», a top inset that depends on
  a neighbour — re-targets the spring on its own; the block does not know it is animated.
- **The glass is the block**, riding in a beat behind the edge and catching the light as it
  forms. It paints nothing of its own beyond the light.
- **The pad is inside the clip.** A block's own spacing (19px over a status card, 6px around the
  in-flight card, 8px around the nudge) unfolds and folds with it. Spacing left outside would
  stand as a gap before the block arrived and after it left. This is why `StatusCard` no longer
  carries a top margin and `ProgressCard` no longer carries its 6px frame: both moved to `pad`.

## The choreography

| layer | from → to | timing |
|---|---|---|
| edge, unfolding | height 0 → natural | spring, duration .62s, **bounce .32** (ζ ≈ .68 — one soft overshoot, the dock piston's damping) |
| glass, arriving | opacity 0 → 1; scale .96 → 1; y −6 → 0 (origin top) | spring .62s / bounce .24, delay 60ms; opacity 260ms ease from 100ms |
| light | `.card-arrive::after` opacity 0 → 1 → 0 | 1.1s, peak at ~430ms, delay 100ms — the thread cards' glint, on the block's own radius |
| glass, leaving | opacity 1 → 0; scale → .98 | 140ms ease-in, no bounce |
| edge, folding | height natural → 0 | spring .3s, bounce 0 — flat and quicker |
| words handing over (`swapText`) | old opacity 1 → 0 · then new 0 → 1 | out 120ms, then in 200ms — `AnimatePresence mode="wait"`, sequential, never a cross-fade |

Why each piece:

- **The edge is what the eye follows**, so the edge is what springs. The glass coming up from
  slightly small and slightly HIGH is born at the seam it unfolds from — it slides out from
  under the block above rather than rising out of nowhere. Rule 3 of the motion language: the
  container first, the contents a beat behind.
- **The bounce is the dock's.** The designer accepted the question dock only after two cuts with
  less («не хватает отдачи») at ζ ≈ .66, and named it as the example here. `bounce .32` in
  motion's duration-spring is ζ = .68.
- **The glass leaves quicker and flat (rule 4); the EDGE bounces both ways.** The glass is gone in
  140ms. The edge folds on the same spring it unfolds on (`REVEAL_CLOSE` = .62s / bounce .32, since
  17.09.2026 — the designer's «да нужен» to whether the panel's shrink after Publish should carry
  the bounce). Rule 4 is about dismissing an OBJECT; a persistent surface settling to a new height
  is a movement, and Apple's glass bounces on the way small too. Below zero a clip cannot go, so the
  overshoot is carried as a negative bottom margin — see «Кромка — одно motion-значение» below.
- **Words hand over sequentially** because two stages painted over each other at half alpha are
  a double exposure, not a cross-fade — the question dock's lesson of 08.09.2026, measured on the
  designer's own recording. The price is one or two frames of the bare block between the old
  words and the new; the height difference between the two sentences is the Reveal's spring,
  so nothing snaps around the pause.
- **ONE in-flight card for the whole walk.** The panel used to mount a separate `ProgressCard`
  per stage, so `Connecting…` → `Propagating…` was one card vanishing and another appearing in
  the same place. It is now one element for the whole walk — wash, rim, flash band — and only
  the keyed group inside it (icon + headline + explanation) changes. `Connecting` →
  `Propagating` → `is connected` reads as the same object changing its mind.

## Measured (software renderer, 16.09.2026 — `prototype/scratchpad/reveal/`)

Console-driven walk (`d` moved from the prototype console with the panel open):

| step | panel height | intermediate frames | worst per-frame step | settled | fps while moving |
|---|---|---|---|---|---|
| Connecting → Propagating (card words + letter card + domain row arrive) | 376 → 582 (+206) | 12 | 31px | 540ms | 45 |
| Propagating → ready + letter owed (in-flight card folds, chip word changes) | 582 → 426 (−156) | 6 | 45px | 290ms | 43 |
| letter confirmed (green card unfolds, letter card folds) | 426 → 450 | 8 | 14px | 460ms | 40 |
| back to Connecting (green card words change, letter + row fold) | 450 → 384 (−66) | 5 | 21px | 260ms | 48 |

A snap is a single-frame step of the whole travel; every step above went through intermediate
heights and settled where the laid-out box is. The repair path (`unreachable` → `Fix this` →
connecting → live, the product's own six seconds) behaves the same: the red card folds below
the field while the in-flight card unfolds above it, and at the end the card folds and the chip
hands over `Not responding` → `Live`.

Cost of animating `height` here: **137 layouts in the 2.2s window of the first transition, 0.14ms
each — 18.5ms of layout in total**, 64ms of style recalculation. The panel is a fixed 432px
overlay; its layout is contained to its own few dozen boxes and nothing else on the page pays.

## The performance-contract exception, stated

The prototype's contract says only `transform` and `opacity` change per frame, because the
thread's dock and its scroller would relayout on every frame of a height animation. This
component animates `height` on purpose and is the third measured exception, after «Thinking»'s
text repaint and `.shell-aside`'s one-shot width. It is allowed where all three hold:

1. the animated box is a fixed overlay (or otherwise layout-isolated) — nothing outside it moves;
2. the box is small (a few dozen nodes) and the cost is measured, not assumed;
3. a transform cannot do the job — a card growing by `scaleY` stretches its text, and a FLIP of the
   rows below would still leave the panel's own bottom edge, the one thing the eye follows, to
   snap into place.

Not a licence for anything else: the thread's dock stays on its piston, the composer's field on
its snap-once slide.

## Rules that bit while building it

- **Measure the LAYOUT box, not the painted one.** The panel is born at `scale(.94)` (the
  `popover` entrance). Measured through that transform with `getBoundingClientRect`, every
  block came out 6% short and stayed clipped — the domain row's bottom edge stood 4px above the
  body card's, and the ResizeObserver never corrected it because the layout size had not
  changed. The observer's `borderBoxSize` is layout-true and fractional; `offsetHeight` is
  layout-true but integer.
- **`initial={false}` on the presence, so what is up when the panel opens comes in with the
  panel.** Only a block that appears LATER unfolds, and only such a block wears the glint
  (`arriving` — has this block ever been down while the Reveal was mounted).
- **The outgoing block is the one that was there.** AnimatePresence keeps rendering the element
  it last saw while the edge closes, so `{cond && <Card/>}` inside `<Reveal show={cond}>` never
  has to say what the card should show while it leaves.
- **A stable slot for a chip whose word changes**, or `justify-between` puts `Unlink` on the left
  for the 120ms in which the row has one child.
- **The prototype console is not «outside».** The panel closes on a click outside itself; the
  console is where a designer moves the world to watch the panel answer, so its tree
  (`[data-console]`) is exempt from the closer.

## Reduced motion

`useReducedMotion()`: the edge changes height in one commit (`transition: { duration: 0 }`) and
the glass only fades (`revealBodyFade`) — the offsets are dropped, not jumped into. The light's
keyframes are killed by the global rule; its base opacity is 0. `swapText` is opacity only and
needs no variant.

## API

```tsx
<Reveal show={cond} pad="pt-[19px]" radius={12}>
  {cond && <StatusCard … />}
</Reveal>
```

- `show` — is the block up. Flipping it unfolds or folds the block; the panel's height follows.
- `pad` — the block's own spacing as Tailwind classes; it unfolds with the block.
- `radius` — the block's corner radius, for the glint. Default 12.
- `className` — layout classes for the clip only, never paint.

The block itself stays as it was; it must not carry the spacing that `pad` now owns.

## Acceptance (`npm run check:brief`, the block «THE PANEL MOVES, IT DOES NOT JUMP»)

- opening the prototype console does not close the panel, and moving the world from it grows
  the panel by more than 120px on Connecting → Propagating;
- the panel's height travels through at least six intermediate frames and no single frame steps
  more than 60% of the travel; it has settled within 900ms;
- a block that is up when the panel opens wears no glint; the blocks that arrived (the letter
  card, the domain row) do; the in-flight card that stayed does not;
- the in-flight card is the same DOM node before and after the stage changes;
- folding settles under 500ms and never dips past its end (no bounce on the way out);
- every earlier geometry check still holds through the wrappers: the domain row is the body
  card's last block through paint-free wrappers only, the explanation box lies stroke on stroke
  on the card, the nudge's 8px inset is on the sizer.

## History

- 08.09.2026 — the nudge's ✕ faded the banner out and let the card tighten in one snap, on the
  dock's rule that layout is never animated. Correct for the dock; the designer's recording of
  16.09.2026 is what that snap looks like in a panel.
- 16.09.2026 — this component. Considered and not built: a FLIP on the panel and its rows (a
  transform-only answer that still snaps the panel's bottom edge, and scales text on the way);
  four cards taking turns with their own unfold/fold (the walk read as one card vanishing and
  another arriving in its place); a cross-fade of stages (the double-exposure lesson).

## Дополнение 16.09.2026 (ночь) — `follow` и Reveal внутри Reveal

**Случай.** Карточка процесса на такте `propagating` сворачивает своё описание (борд 30425:28847:
кнопка-шеврон в ряду; автоматически через 5 с). Описание обёрнуто СВОИМ Reveal внутри карточки; сама
карточка обёрнута Reveal панели. Две пружины на одной кромке гонялись бы друг за другом: внешняя
отстаёт от внутренней и на раскрытии срезает рим описания на несколько кадров.

**Проп `follow: 'spring' | 'instant'`** (по умолчанию `spring`). `instant`: смену высоты
СОДЕРЖИМОГО кромка отслеживает покадрово (`edge.jump(natural)` после первого измерения), пружина
остаётся только у появления и ухода блока целиком. Реализация: `measured` — флаг «высота измерена
хоть раз»; ветка `follow === 'instant'` в layout-эффекте на `[natural, present]`.

**Кромка — одно motion-значение, а не проп `height` (17.09.2026).** Отскок обязан пережить ноль: клип
не бывает меньше пустого, поэтому `edge` анимируется через ноль (`animate(edge, 0, REVEAL_CLOSE)`), а
на элемент пишутся `height = max(0, edge)` и `margin-bottom = min(0, edge)`. Блоки ниже сворачиваемого
и нижняя кромка панели проседают за цель и возвращаются. Оба числа пишутся из события `change`
motion-значения, не через React: инлайновый стиль из рендера показал бы значение ДО layout-эффекта,
который сажает кромку (у приходящего блока — кадр в полную высоту). Первый коммит — единственный со
стилем от React: `auto` для блока, открывшегося вместе с панелью, `0` для того, который сейчас
развернётся; с измеряющего коммита стилем владеет `paint`. ⚠️ `stop()` анимации motion РАЗРЕШАЕТ её
промис (`teardown`), поэтому финишер свёртки (`safeToRemove`), прерванной повторным появлением блока,
читает текущее присутствие через ref — иначе снял бы блок, который стоит.

**Слова внутри сворачиваемого бокса — `AnimatePresence mode="popLayout"`**, не `wait`: с `wait`
между уходом старого абзаца и приходом нового бокс на кадр пустел, и внутренняя кромка ныряла.
`popLayout` выносит уходящий абзац из потока, входящий стоит в потоке с первого кадра: высота
меняется один раз, кромка ведёт её пружиной; передача последовательная (`subSwap`: уход 120 мс,
приход 200 мс с задержкой 120).

**Пиксельный сдвиг на клипе.** Бокс описания лежит своим римом НА риме карточки (`-mx-px -mb-px`);
внутри клипа `overflow: hidden` отрицательные маргины ребёнка срезались бы — сдвиг стоит на самом
клипе (`className` Reveal).

**Замер** (`prototype/scratchpad/letter/probe.mjs`, до 17.09): свёртка описания 384 → 309 за ~250 мс без
отскока; раскрытие письма 309 → 531 → 520 (перелёт ~11 px); ручная свёртка шевроном — посадка
< 500 мс, без провала; внешняя кромка без отставания (рим описания на раскрытии не срезан).
**С 17.09.2026 (кромка с отскоком):** ручная свёртка шевроном 595,8 → 516,3 → 520,4 — провал 4,1 px на
277-й мс, в пикселе к ~400 мс (`prototype/scratchpad/reveal/fold-bounce.mjs`); сжатие панели после
Publish 449 → 302,1 → 309,6 — провал 7,5 (5,4 %) на 266-й мс спуска, в пикселе к ~430 мс
(`prototype/scratchpad/publish-shrink/bounce.mjs`). Письмо после свёртки — через 360 мс
(`LETTER_AFTER_FOLD_MS`), из возврата отскока.
