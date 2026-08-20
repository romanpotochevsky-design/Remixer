# Surfaces — the material spec

Every value here is the value the prototype actually ships
(`prototype/src/index.css`, `prototype/tailwind.config.js`, and the components named
per section). Figma node ids are given so a designer can check the source; where a
Figma export and the running code disagree, the disagreement is written down rather
than quietly resolved.

Companion document: `motion.md` (how these surfaces move). Colour meanings: `README.md`.

**Facts carry IDs.** Every statement below about DreamHost or a competitor cites a row of
`docs/product/FACTS.md` (`DH-###` / `CMP-###` / `STD-###`) rather than restating a value.
Where a measurement has no register row yet — most of the competitor *design* readings
live only in `measured-competitor-tokens.md` and the live teardowns — the source document
and its capture date are named instead, and the gap is said out loud. Cross-references
name a section by **number and heading**, because renumbering has already broken seven
pointers in this folder.

---

## 1. Shell geometry

Pixel source: **Figma node `25819:143144` "Website Builder"** (2560×1166, captured
16 Aug 2026). Implemented in `prototype/src/App.tsx`; the three numbers are CSS
variables so nothing hard-codes them.

| Region | Size | Token |
|---|---|---|
| AI chat column, **left** | **432px** (min 340, max 760, drag-resizable) | `--chat-w` |
| Both top bars (chat + canvas) | **52px** | `--topbar-h` |
| Icon rail, **right** | **56px** | `--rail-w` |
| Ground | **`#09090b`** (`--gray-950`) | `--gray-950` |
| Canvas gutter | 8px left / 8px bottom — the preview *floats* on the ground | — |
| Publish panel | 548px wide, radius 20, pinned 51px from the right edge / 48px down | — |
| Mobile preview frame | fixed **390 × 844** (iPhone 14/15 logical), centred both axes | `MOBILE_WIDTH/HEIGHT` |

Layout detail worth keeping: the chat column is 432 in Figma while everything inside it
stops at 430–431. **That last pixel is the divider.** So the `<aside>` is sized
`calc(var(--chat-w) - 1px)` and the 1px `ChatResizer` sits outside it, giving the pixel
back. Do not add a border to the aside instead — the resizer needs to own that column.

The right rail holds account avatar (32) plus Style / Integrations / Analytics / Cloud
at 48×48 on 16px radii, then support chat pinned to the bottom. **Domains and Email
still have no home in the rail** — that gap is the audit's headline finding
(`synthesis-q3-2026.md` §6, "Where Remixer stands today"), not an oversight in the
geometry. What *is* in the live rail today is itself an open question the audit could not
close (§10.2, "Open questions we must answer internally", question 3).

### ⚠️ The old live-product geometry is superseded

The shipping product's shell measured **57 / 64 / 522** (top bar 57, second bar 64,
chat column 522, chat on the right). That is dead. It must not be restored, partially
restored, or used to "correct" a mockup that follows the redesign. If you find a screen
still drawn to 57/64/522, the screen is stale, not the spec.

Also superseded: the audit (`docs/competitors/audits/synthesis-q3-2026.md` **§9.9,
"Density and layout"**) proposes a **408px** chat column with 360/720 bounds and a 2px
`#1587FF`/50 hover bar. That predates the Figma redesign. The numbers above (432, 340/760,
and the pointer-local glow of **§10, "The chat/canvas divider"**) win. Our 432 comes from
our own Figma, **not** from measuring Lovable — their chat width is `unverified` and must
not be quoted as a figure (**FACTS CMP-031**).

### Ground vs. panels

Elevation is a lightness ladder, not shadows. Which value is the ground was itself a
contradiction on record — the brief and the audit say `#18181B`, the 2026 redesign moved
the shell to `#09090b` and demoted `#18181b` to a panel colour (**FACTS DH-403**):

| Level | Colour | Used for |
|---|---|---|
| Ground | `--gray-950` `#09090B` | the app background, the chat feather colour, the flash's opaque plate |
| Panel / canvas fill | `--gray-900` `#18181B` | the preview's empty state, generated-site chrome |
| Overlay | `--gray-850` `#1F1F22` | the Publish panel, the checkout sheet, floating notices |
| Border-ish | `--gray-800` `#27272A` | the domains dashboard frame border |

**Fixed, and recorded so it is not re-diagnosed:** `index.css` used to carry a *second*
`body` rule some 700 lines below the first, painting the pre-redesign `#18181B`. Being
later in the same `@layer base`, it won — and it defeated the stated purpose of the first
rule (Figma `28016:42812` paints the whole frame `#09090B`, and without it the embedding
claude.ai preview panel shows its own backdrop through any gap or overscroll). Nobody
noticed because `App.tsx`'s root `<div>` paints `--gray-950` over the shell anyway. There
is now **exactly one `body` rule**, and the comment sitting on it says why there must
never be a second. The ground is `--gray-950`.

---

## 2. Glass — macOS, not iOS

Base source: **Figma "Preview buttons" `25819:143747`.** Implemented as
`.liquid-glass` in `index.css`.

### The recipe

```css
.liquid-glass {
  position: relative;
  background: var(--glass-bg);            /* #18181bcc = rgba(24,24,27,.8) */
  backdrop-filter: blur(16px);
}
.liquid-glass::before {                    /* the rim — see below */
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(150deg, #ffffff33 0%, #ffffff17 32%, #ffffff12 64%, #ffffff29 100%);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
}
```

| Property | Value | Token |
|---|---|---|
| Fill | `rgba(24,24,27,.8)` | `--glass-bg` `#18181bcc` |
| Backdrop blur | **16px**, no saturation lift | — |
| Rim | 1px **diagonal gradient at 150°**: 20% → 9% → 7% → 16% white | (literal) |
| Dividers *inside* a glass group | **`#ffffff0a`** (Figma Neutral Alpha/50, 4%) | `--glass-divider` |
| Radius | 12 on toolbar pills, 24 on chat bubbles, `full` on the composer circles | — |

### The rim is a gradient, and its amplitude is the whole point

Real glass catches light unevenly: brightest where it faces the light, nearly gone on
the opposite side. So the rim is a **150° diagonal gradient**, not a flat line. But it
swings *gently* around Figma's specified 12% (Neutral Alpha/200) — the average matches
the spec and only the distribution carries the material. CLAUDE.md summarises it as
**20% → 7% → 16%**; the shipped gradient is the four-stop
`20% → 9% → 7% → 16%` above. Either reading is the same design.

**What made an earlier cut read as "iOS-y" was the amplitude, plus three extra layers.
All four must stay out:**

- ❌ **32% white in the hot end** of the rim gradient — this was the single biggest
  offender; next to real macOS chrome it screams.
- ❌ an **inner top highlight** (a specular band down the top edge inside the control)
- ❌ a **drop shadow** under the glass
- ❌ **`saturate()`** in the backdrop filter (Bolt does `blur(10px) saturate(1.2)` on its
  prompt box — the iOS recipe, and not ours. Source: `measured-competitor-tokens.md`
  §2, "Bolt.new (StackBlitz)" → "Prompt box", read off live computed styles 13 Aug 2026;
  no register row yet)

macOS keeps a control quiet: a tinted translucent fill, a real blur behind it, one
restrained edge. The surface reads as glass because of what shows *through* it, not
because of light painted *on* it. Figma specifies exactly that and nothing more.

**`index.css` keeps the rejected recipe on purpose, and it is labelled.** The comment
block immediately above `.liquid-glass` opens with **"⚠️ HISTORY, NOT SPEC. The recipe in
this paragraph was TRIED AND REJECTED"**, states that the shipped recipe is the paragraph
below it, and then lists the four properties that must stay out. Leave the label and the
block alone: a deleted mistake comes back, a labelled one does not.

*(An earlier version of this section called that block "dead text passing itself off as
spec". It was — before the label was added. Check the first line of a comment before
repeating the accusation.)*

### Why the rim is a mask, not a `border`

Three reasons, all load-bearing:

1. A `border` adds to the box and **shifts layout** — a 1px rim appearing on hover
   would nudge everything inside the pill.
2. The mask trick (`padding: 1px` + `mask-composite: exclude` on the border box)
   produces a ring that **follows any `border-radius` it inherits**, so the same class
   works on a 12px pill and a 999px circle.
3. A CSS `border` cannot carry a gradient without a `border-image`, which does not
   follow a radius.

The same mask idiom is reused for the Best-match hero rim (`.bestmatch-rim`, Figma
`27085:107276`). ⚠️ **Note why it must be a ring mask there specifically:** the card's
own fill is only 10% alpha, so an opaque gradient laid *under* it as a second
`background` layer shows straight through — it did, and the whole label row went solid
purple. A rim is always a ring, never a background layer beneath a translucent fill.

### The quieter cut: `.liquid-glass--subtle`

For chat bubbles and large panels, Figma replaces the flat fill with a faint wash and
dims the rim:

| | Fill | Rim (150°) |
|---|---|---|
| `.liquid-glass` | `rgba(24,24,27,.8)` flat | 20% → 9% → 7% → 16% |
| `.liquid-glass--subtle` | `linear-gradient(to bottom, #ffffff0f, #ffffff05)` — **6% → 2%** | 15% → 7% → 5% → 12% |

---

## 3. Where glass belongs — and where it does not

Glass is **only** where Figma draws it. It is a material with a cost (a `backdrop-filter`
is a real GPU expense, and Lovable spends exactly one on their entire landing page — a
`blur(4px)` on the prompt input, the single most important element; source
`measured-competitor-tokens.md` §1, "Restraint", 13 Aug 2026, no register row yet). Ours,
in full:

**Glass, yes:**

| Surface | Class | Notes |
|---|---|---|
| Toolbar pills (version history / collapse, reload / device, Visual Editor) | `liquid-glass` via the `Glass` wrapper in `App.tsx` | radius 12, internal dividers `--glass-divider` |
| Chat user bubbles | `liquid-glass liquid-glass--subtle` | max-width 320, radii 24·24·**8**·24 (the 8 is the tail corner, bottom-right), padding 20 / 13 / 11 |
| Composer "+" and mic circles | `liquid-glass` + `bg-[#09090ba3]` | 32px circles, `--black-700` = `rgba(9,9,11,.64)` fill |

**Glass, no:**

| Surface | What it is instead | Why |
|---|---|---|
| **The Publish panel** | solid `--gray-850` | see **§5, "The Publish panel is solid"** — translucent glass was tried here and reverted |
| The checkout sheet (`DomainModal`) | solid, over a 70%-black scrim | an app-modal; nothing should show through it |
| The composer **field** | a dark translucent surface, but *not* `.liquid-glass` | see **§4, "The composer field"** — it is the ground the circles' glass sits on |
| The domains dashboard, results lists, cards | `--gray-900` / `#ffffff08` fills with NA/50 hairlines | content surfaces, not chrome |
| The right rail buttons, the project button | transparent with a hover wash | chrome that must disappear |

The general rule: **glass is for small floating chrome over the user's content.** The
moment a surface is big enough to hold a paragraph, it stops being glass.

---

## 4. The composer field

Pixel source: **Figma "Input field" `28016:43526` / `28016:43528`**, send button
`28016:43545`. Implemented as `.composer-field` plus markup in
`prototype/src/modules/chat/ChatPanel.tsx`.

```css
.composer-field {
  background: linear-gradient(#ffffff14, #ffffff14), rgba(9, 9, 11, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid #ffffff3d;    /* Neutral Alpha/300 = 24% white */
}
```

| Element | Value |
|---|---|
| Field fill | `rgba(9,9,11,.8)` with an **8% white** wash over it (lands near `#1c1c1e`) |
| Field blur | 16px |
| Field rim | **24% white** (`#ffffff3d`, Neutral Alpha/300) — brighter than the 12% generic glass |
| Field radius | **24** |
| Textarea | 16px / 26px line-height, placeholder `--gray-400` |
| "+" / mic circles | 32px, `.liquid-glass`, fill `rgba(9,9,11,.64)` (`--black-700`) |
| Send button, at rest | **outlined, no fill** — 1px `--white-100` rim, `--white-500` glyph |
| Send button, armed | fills `--action`, white glyph, hover `--action-hover` |
| Strip behind the composer | `--black-900` (`rgba(9,9,11,.8)`) |

The inversion is deliberate and it is what makes the composer read as a well rather
than a card: **the field is the DARK surface** — darker than the chrome around it — and
the circles sitting on it are the light glass. Get that backwards and both materials
stop working.

### ⚠️ The dark-mode token-reading trap

**Read Figma's tokens in the DARK theme. The MCP export resolves `Neutral Alpha`
inconsistently and the light-mode reading is actively wrong.**

Observed, on the same token, in the same export:

- on the icon buttons it returned `rgba(255,255,255,0.24)`;
- on this field it returned the light-mode `rgba(9,9,11,0.24)`;
- and it described the field's fill as **"8% black over `#09090b`"**.

Taken literally, that last one paints the field the exact colour of the chat panel
behind it. **The surface disappears** — and with it the thing the "+" and mic circles'
glass needs to sit on and blur, so they stop reading as glass too. In the dark theme the
same wash is **8% WHITE**, and the field lands visibly *lighter* than its surroundings —
which is what the mockup shows: a slightly luminous well with two dark discs on it.

Rule of thumb whenever an exported alpha looks like it cancels a surface out: you are
reading the light-mode resolution of a `Neutral Alpha` token. Switch the theme and read
again.

---

## 5. The Publish panel is solid, and that is final

Pixel source: **Figma `25819:144061`** (548 × ~335). Implemented in
`prototype/src/modules/publish/PublishPanel.tsx`.

| Property | Value |
|---|---|
| Fill | **`--gray-850` `#1F1F22`, opaque** |
| Border | 1px `#ffffff0a` (NA/50) |
| Radius | 20 |
| Shadow | `0px 24px 28px rgba(0,0,0,.5)` |
| Header | 64px, "Publish" in `font-display` 20/1.2 |
| Inner card | radius 16, fill **and** hairline both `#ffffff0a` |
| Position | `fixed`, 51px from the right edge, 48px down |

Three decisions recorded so they are not re-litigated:

1. **Translucent glass on this panel was tried and reverted.** The mockup draws a solid
   `gray-850` sheet and that is what it stays. A 548px panel full of text is not chrome.
2. **`position: fixed`, not `absolute`.** The panel mounts inside `<main>`, so `right:`
   used to resolve against the centre column and the panel drifted as the chat column
   was resized.
3. **The travelling `.glass-sheen` on its rim is gone** (reverted 17 Aug 2026). Full
   reasoning in `motion.md` **§7, "Reverted: the panel sheen (`.glass-sheen`)"** — short
   version: a sheen is evidence of *glass*, and this panel has none. What the panel keeps
   from iOS 26 is the **motion**, never the material.

---

## 6. Radii

There is no abstract radius scale to invent from; these are the radii the product
actually uses, by role. Tailwind aliases exist for the three commonest
(`rounded-shell` 16, `rounded-control` 10, `rounded-chip` 8).

| Radius | Role |
|---|---|
| 6 | tiny inline chips |
| **8** (`chip`) | icon buttons inside a message action row, inset URL field interior, chat bubble **tail corner** |
| **10** (`control`) | standard buttons — Publish, the project button, toolbar icon buttons |
| 12 | glass toolbar pills, the URL field's outer box |
| 14 | small cards |
| **16** (`shell`) | the preview stage, rail items (48×48), content cards, the domains dashboard frame, the Publish panel's inner card |
| 20 | the Publish panel, the checkout sheet |
| **24** | the composer field, chat user bubbles |
| `999` / `full` | 32px circles (+, mic, send, avatar), status pills, scroll thumbs |

Asymmetric radii are used in exactly one place — the chat bubble's 8px bottom-right
tail (`rounded-[24px] rounded-br-[8px]`). Bolt runs a whole rotating asymmetric system;
we do not, and adding one is a design decision, not a detail.

---

## 7. Hairlines and the two alpha ladders

Separation is a hairline, and there are four in use. Picking the wrong one is the most
common way a new screen looks subtly off.

| Line | Value | Figma name | Use |
|---|---|---|---|
| **4%** | `#ffffff0a` | Neutral Alpha/50 | dividers *inside* a glass group (`--glass-divider`); page/section separators; the Publish panel's own border and inner-card fill |
| **8%** | `--white-100` `#ffffff14` | Neutral Alpha/100 | the chat/canvas divider at rest; the mobile phone frame's ring; the disarmed send button's rim; hover washes |
| **12%** | `--white-200` `#ffffff1f` | Neutral Alpha/200 | the glass rim's specified average; the project button; the URL field's outer border |
| **24%** | `#ffffff3d` | Neutral Alpha/300 | the composer field's rim — deliberately the brightest line in the shell |

### ⚠️ The `--white-*` variables and Figma's `Neutral Alpha` are two different ladders

They agree at 100 and 200 and **diverge above it**:

| Step | `index.css` var | Figma Neutral Alpha |
|---|---|---|
| 50 | *(no variable — hardcoded `#ffffff0a` inline, plus `--glass-divider` in `index.css`)* | 4% `#ffffff0a` |
| 100 | `--white-100` = 8% `#ffffff14` | 8% `#ffffff14` ✓ |
| 200 | `--white-200` = 12% `#ffffff1f` | 12% `#ffffff1f` ✓ |
| 300 | `--white-300` = **20%** `#ffffff33` | **24%** `#ffffff3d` ✗ |
| 400 / 500 / 700 / 900 | 40% / 70% / 85% / 95% — a **text** ramp, not a border ramp | — |

⚠️ **Do not restate how many places hardcode `#ffffff0a`** — an earlier version of this row
said "13 places" and the real number moves with every screen added. Count it when you need it:
`grep -rc '#ffffff0a' prototype/src` (at the last check: 24 occurrences over 22 lines in four
files, two of them the `--glass-divider` definition and its comment in `index.css`). The rule
this row exists to state is that step 50 has **no `--white-*` variable**, which is why it is
inline everywhere.

So `--white-300` is *not* Neutral Alpha/300, and the composer rim therefore has to be
written as the literal `#ffffff3d`. Before adding a token named after a Figma step,
check which ladder you are on. The `--white-*` set was measured off the live product on
13 Aug 2026 — the same pass that found production's blue is not our token (**FACTS
DH-402**); the Figma set is the redesign's.

The black ladder (Figma `Black/…`, for fills on glass) is
`--black-300` 24% · `--black-700` 64% · `--black-800` 72% · `--black-900` 80%, all of
`#09090b`.

---

## 8. Shadows

Shadows are almost absent — elevation is lightness (**§1, "Shell geometry"** → "Ground
vs. panels"). Four exist in the whole product:

| Surface | Shadow |
|---|---|
| Publish panel | `0px 24px 28px rgba(0,0,0,.5)` |
| Checkout sheet | `0px 24px 28px rgba(0,0,0,.33)` |
| Domains dashboard frame | `0px 8px 8px rgba(0,0,0,.12), 0px 56px 72px rgba(0,0,0,.12)` — a near shadow plus a very wide soft one |
| Scroll thumb (`--auto` tone) | `0 0 0 1px #ffffff8c` — a hairline ring, not a shadow |

The audit's recommendation is a six-step cumulative ramp at 4% (Lovable's system: each
larger step *adds* a layer, offsets doubling and spread halving, every layer a constant
`#0000000a`, plus a `1px` hairline ring — `measured-competitor-tokens.md` §1, "Shadow
system", 13 Aug 2026, no register row yet). We have not built that ramp.

A single shadow at ~10% opacity is on the practitioner list of AI-slop tells — **cite it
as craft consensus, never as measured risk** (**FACTS DH-407**: the pattern list is
`likely` as a documented craft consensus; that it costs us anything is `unverified`). It
is reason enough not to add a fifth one-off shadow, and not reason enough to justify a
rebuild on its own.

---

## 9. Scroll surfaces

Native scrollbars are off **globally** (`scrollbar-width: none` + a zeroed
`::-webkit-scrollbar`). This is not cosmetic: a classic scrollbar takes a column out of
the layout and paints it with the scroller's own background, which drew a white strip
down the full right edge of the two-tone demo site — including its dark half.

Therefore: **every scrollable surface must be `prototype/src/ui/ScrollArea.tsx`.**
Anything scrollable that is not gets no visible indicator at all. The indicator floats
*over* the content: 4px wide, invisible at rest, appears while the surface moves or is
hovered, fades ~700ms after it stops, and only ever animates `transform` (its height is
written on resize, not per frame).

Three tones, chosen by what the bar sits on:

| Tone | Value | For |
|---|---|---|
| `light` | `#ffffff5c` | the dark shell |
| `dark` | `#09090b47` | light panels |
| `auto` | `#0000005e` + `0 0 0 1px #ffffff8c` | content whose background we do not know (a generated site) — the iOS trick: a dark bar with a light hairline stays legible on white and on black |

⚠️ Class names must be **full literals** in the source. Tailwind's content scanner
purges `@layer` rules whose class never appears verbatim, so `scroll-thumb--${tone}`
silently deletes the CSS. The same bug once cost the entire Siri glow.

### The chat panel's two feathers

Both are `sticky`, both are **pure gradients with no flat section** (a flat head reads
as a cut-off edge, not a fade):

| Feather | Height | Gradient | Figma |
|---|---|---|---|
| Top | 48px | `#09090b` → transparent | `28016:43309` |
| Bottom | 32px | transparent → `#09090b`, flush above the composer | `28016:46454` |

⚠️ **The scroller must have no top padding.** `sticky` sticks to the padding edge of the
viewport, so any `pt` leaves a gap above the feather in which messages ride past fully
visible. The feather itself sits in the flow and doubles as the space above the first
message; the column reserves `pb-8` at the bottom.

---

## 10. The chat/canvas divider

`prototype/src/ui/ChatResizer.tsx` — a 1px column that is also the resize handle.

| State | Line | Extras |
|---|---|---|
| Rest | `--white-100` (8%) | — |
| Hover | `--white-300` (20%) | bloom at 30%, core at 50%, the "◁▷" grip fades in at the pointer |
| Dragging | `#1587ff3d` (action @ 24%) | bloom and core at full, grip white |

The line **never turns fully blue.** A full-height blue bar is just a bar; light has to
be *somewhere* to read as light. So the line only takes a faint tint and everything
bright is local to the pointer — a 2px hot core (300px tall, blurred 0.6px) plus a 64px
halo (460px tall, blurred 12px) that spills onto both panels and dies well before the
top and bottom edges. Lovable's equivalent highlight is even along the whole divider;
ours puts the light where your hand is. (That comparison is an observation off a recording
of their builder, not a measurement — it has no register row, and Lovable's chat-panel
geometry is `unverified` per **FACTS CMP-031**.)

Grab target: `inset: 0 -5px` — a comfortable target either side of a 1px line.
Bounds: 340–760, default 432.

⚠️ **The drag does not go through React.** Width is written straight to `--chat-w` on
`<html>` and the bloom is moved with `transform`; the store is updated on pointer-up.
Re-rendering the shell on every `pointermove` would restart the chat, the preview and
its container queries sixty times a second.

⚠️ The glow is **mono-blue and that is a designer decision** — the iridescent version
was built, shown and rejected on 17 Aug 2026. **Do not propose it again.** The rejection
and the reasoning that generalises from it: `motion.md` **§6, "Signature effect: the
resizer glow — mono-blue"**.

---

## 11. The preview stage and the demo site

- The stage is `container-type: inline-size`. **The generated site answers container
  queries, never the browser width.** That is what makes the device switch honest —
  shrink the stage to 390px and the page re-lays-out exactly as it would on a phone,
  which is the same result other builders get from a preview iframe, without an iframe.
- Responsive sizes for the site therefore live in **CSS** (`.site-pad`, `.site-grid`,
  `.site-hero-title`, `.site-nav-links`, `.site-cta`, `.site-stats`), *not* in Tailwind
  utilities: utilities sit in a later layer and would win over the `@container` rules.
  Breakpoints in use: `max-width: 900px` (3 cols → 2) and `max-width: 640px` (phone).
- In mobile mode the frame gets a `ring-1 ring-[#ffffff14]` hairline — floating on the
  ground, the site's own dark sections would otherwise bleed into the shell. (Lovable
  outlines their preview the same way, on a warm `#41413D` — measured in
  `docs/competitors/audits/lovable-builder-teardown.md`, live logged-in account,
  13 Aug 2026; no register row yet.)
- **The demo site is deliberately two-tone** — white hero on top, dark menu section and
  footer below. It is a *test rig*: the one screen where you can see the edge glow's
  behaviour over both backgrounds at once. It is not a site design, and it should not be
  "improved" into a single-tone page.
- The device switch is **one button**, as in Lovable, whose top bar carries a single
  centre-cluster "Desktop view" control (`lovable-builder-teardown.md`, 13 Aug 2026; no
  register row yet): the icon *is* the mode you are in (monitor while desktop, phone once
  switched) and clicking flips it.

---

## 12. Reading this against Figma — the standing traps

1. **Read tokens in the dark theme** (**§4, "The composer field"**). The light-mode
   resolution of `Neutral Alpha` is not merely different, it inverts.
2. **Check which alpha ladder you are on** (**§7, "Hairlines and the two alpha ladders"**).
   `--white-300` ≠ Neutral Alpha/300.
3. **The mockups contain real inconsistencies, and we implement them as drawn and flag
   them** rather than silently "correcting" them. Currently flagged to the designer:
   the plan cards in the checkout sheet are different heights (72 selected / 80 not)
   with different label tokens; the renewal price `$11.86` in the domain boards matches
   no row of DreamHost's verified price table and is a placeholder (**FACTS DH-101…DH-110**
   for the real prices, and **FACTS §2.18**, "The renewal price in the Figma boards", for
   this exact discrepancy — prices come from `TLD_PRICES`, never from a board); the domain
   boards draw the verb **"Buy"** while the audit's verb dictionary says "Add" (**FACTS
   §2.19**, "The verb for buying"; the dictionary itself lives in
   `docs/product/COPY-RULES.md`); and **no board draws a "domain is taken" state at all**
   — the single most important state in domain search. Do not invent any of these.
4. **A missing font file is silent, on purpose.** `/fonts/...` references are absolute
   so Vite leaves them alone: an absent licensed face is a face that quietly does not
   load, not a build error. That is what lets the CSS ship before the fonts do — and it
   is also why a screenshot is not evidence about type.
5. **`body` takes `font-family: theme(fontFamily.sans)`**, never a literal stack. A
   literal there used to silently override the Tailwind config, which is how the OFL
   stand-in went missing from the body font while still being listed in
   `tailwind.config.js`.
