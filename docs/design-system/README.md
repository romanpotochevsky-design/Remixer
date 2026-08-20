# Remixer design system

**Status:** living spec. Last reconciled against the prototype 20 Aug 2026.
**Audience:** anyone designing a new Remixer screen, and the DreamHost engineers who
will implement one.

---

## What the language is

Remixer is a dark tool that hosts a light artefact. The builder shell is a cold
near-black ground (`#09090b`) carrying almost no colour of its own; the thing the
user made — their generated website — floats on it and is the only bright object on
screen. Everything the shell contributes is either a *hairline* (a 4–12% white line
that separates without drawing attention) or *glass* (a translucent tinted pill that
lets the ground show through). Colour is rationed: one blue means "you can act here",
one violet gradient means "this is the AI", and green and amber are reserved for the
two facts a user actually needs at a glance — the site is live, or the site needs you.
Motion carries the product's only real personality: springs rather than durations,
panels that grow out of the control you touched, and two iridescent signature
effects — a light that pours around the composer when you send, and a Siri-style band
that runs the preview's edge while the agent works. Everything animates on `transform`
and `opacity` only, because the first version of that glow measured 9 FPS and taught us
what a blurred surface costs.

The reference points are Apple's macOS chrome (for material — quiet, not glossy) and
iOS 26 (for motion only), plus Lovable for the interaction model. What we deliberately
do *not* borrow is iOS's "liquid glass" glossiness; see `surfaces.md`.

---

## Colour semantics

### The semantic roles — and the discipline

| Role | Token | Hex | Means | Where it may appear |
|---|---|---|---|---|
| **Action** | `--action` | `#1587FF` | "You can do this." | Primary buttons, links, focus rings, the armed send button, the resizer while dragged |
| | `--action-hover` | `#3D9BFF` | | hover |
| | `--action-pressed` | `#0073EC` | | active/pressed |
| | `--action-100/200/300` | `#1587FF` @ 8% / 12% / 20% | | tints, selected rows, drag hairline |
| **Brand / plan / AI** | `--brand-from` → `--brand-to` | `#9B7BFF` → `#4A2BC3` | "This is Remixer's intelligence, or the thing you pay for." | AI surfaces, plan/upgrade moments, the Best-match hero rim |
| **Live** | `--live` | `#48BA79` | "Your site is published and reachable." | the status dot beside a live address, the live badge, the support-chat bubble |
| **Action needed** | `--attention` | `#E5C359` | "Something is mid-flight or waiting on you." | connecting / verifying status dots, low-credit warning border |
| **Failure** | `--danger` | `#EF4444` | "This broke, or you are out." | error states, the credits pill at zero |

### The rules that make the palette mean anything

1. **Blue is the only interactive colour.** If something is blue, clicking it does
   something. Nothing decorative is blue. (Open question the audit raised: `#1587FF`
   sits three points from Bolt's `#1488FC` — see the risk note below.)
2. **The violet gradient is never a background.** It marks AI and paid surfaces, at
   small scale — a rim, a badge, an icon wash. A violet-to-indigo field behind body
   copy is the single loudest generic-AI tell in the category.
3. **Green and amber are never spent on anything else.** Not on a decorative chart,
   not on a "success" toast for a trivial action, not on a brand accent. They exist
   so that a glance at the toolbar answers one question — *is my site up?* — and every
   extra green pixel elsewhere costs that answer a little accuracy. Green means
   *reachable on the internet*. Amber means *you or we still have work to do*. If a new
   state is neither, it gets grey or blue.
4. **Everything else is grey or white-alpha.** The greys are Tailwind zinc as shipped
   (`--gray-950 #09090B` ground → `--gray-900 #18181B` panels → `--gray-850 #1F1F22`
   overlays → `--gray-800 #27272A` borders); separation and elevation come from the
   white-alpha ladder, not from colour. Full ladders and their traps: `surfaces.md`.
5. **The Siri spectrum is not part of the palette.** `#1F7CFF · #38C6FF · #8B5CFF ·
   #BE59FF · #FF2F6D · #FF705C · #FF9D5C` exists only inside the two AI motion effects
   (send flash, preview glow). It is never a static fill, and it never lands on a
   utility control — a rainbow on a tool reads as decoration. That was tested and
   rejected; see `motion.md`.

**One documented adjacency, so nobody "fixes" it by accident:** the credits pill uses
its own warm gold (`#FFE082` at 17% → 7% fill, 15% rim), which is *not* `--attention`.
Credits are a permanent readout, not a state, so they get a separate token — and the
pill must stay in the toolbar permanently (GoDaddy moving credits to their own page is
their loudest complaint).

---

## Type

**The brand pair is Gilroy for names and numbers, Proxima Nova for prose.** The split
is systematic in every mockup: `font-display` (Gilroy) on the product name, headings,
prices and counts; `font-sans` (Proxima Nova) on everything you read as a sentence.

Both are commercial faces DreamHost licenses, and **the licensed `.woff2` files are not
in this repository** — it is public, and committing them would be redistribution. What
actually renders today is an OFL stand-in bundled in `prototype/src/fonts/`: **Figtree
for Proxima Nova, Outfit for Gilroy.**

What that means in practice:

- **Do not accept type decisions from a prototype screenshot.** Letterforms differ.
  Metrics are close (a test line measures 244px against the brand's 271px, versus a
  wild system fallback) but they are not the same face.
- The stand-in exists for *consistency*, not fidelity. Before it, the prototype drew in
  whatever the host had — SF Pro on the designer's Mac, Segoe on Windows, DejaVu in a
  Linux CI browser: three different layouts, only one of which matched Figma.
- Neither stand-in carries Cyrillic, so the Ukrainian locale falls through to the
  system face per glyph. EN is the product language; that trade is accepted.
- Dropping the real files into `prototype/public/fonts/` under the exact names listed
  at the top of `prototype/src/index.css` is the whole install — the `@font-face` rules
  are declared first, so a file wins the moment it exists.
- To keep them permanently, the repository has to go **private** first.
- The npm packages that promise these faces (`@qpokychuk/gilroy`,
  `@dannymichel/proxima-nova`) are unlicensed repackagings. They must not enter a
  DreamHost repository.

A type *scale* is not yet specified here. What exists is the sizes the prototype
uses per surface (documented at each component) and the competitors' measured scales
in `measured-competitor-tokens.md` — where the one durable rule is that every serious
player tracks display type −0.02…−0.06em and leads it at 1.0–1.1, and the one player
that does not (GoDaddy Airo: `letter-spacing: normal`, `line-height: 1.25` on every
heading) reads as dated because of it.

---

## What is in this folder

| Document | Answers |
|---|---|
| `README.md` (this file) | What is the language, what does each colour mean, what type do we use, where do I look next? |
| `surfaces.md` | **Material.** Shell geometry, the ground and the elevation ladder, the glass recipe and everything banned from it, radii, hairlines, the composer field, the Publish panel, where glass belongs and where it does not. Includes the token-reading traps that have already caused wrong values. |
| `motion.md` | **Behaviour.** The spring language, the performance contract, reduced motion in both engines, the chat send choreography, and the two signature effects with their approval status. Read the approval flags before proposing a change. |
| `siri-glow-spec.md` | The preview-edge loading glow as an engineering spec: measured FPS per configuration, layer anatomy, the quality governor, porting notes. Written for a production engineer accepting the effect. |
| `measured-competitor-tokens.md` | What Lovable, Bolt, v0, Base44 and GoDaddy Airo actually ship — typefaces, type scales, OKLCH/RGB token systems, shadow ramps, radii, easings — read from live computed styles on 13 Aug 2026, not from articles. Use it to check a proposal against the category before defending it on taste. |

Related, outside this folder: `docs/competitors/audits/synthesis-q3-2026.md` §9 is the
design-craft chapter the rules above answer to, and `§10.1` lists the claims that must
never be quoted to leadership.

---

## Open risk: our palette scores three of the four AI-slop tells

This is not solved, and stating it as solved in a review would be wrong.

The audit's documented 2026 "AI-slop fingerprint" is *Inter + an indigo-to-purple
gradient + cold slate surfaces + three rounded cards in a row*. Measured against our
own spec, Remixer currently hits three of the four:

| Tell | Our exposure | Direction of fix |
|---|---|---|
| Inter as the UI typeface | named in our spec (and every stand-in in the category is a neo-grotesk) | display optical cut plus −0.04em tracking now; the proprietary pair later |
| Indigo → purple gradient as the AI mark | `#9B7BFF → #4A2BC3` is exactly that axis | keep it to a handful of AI surfaces, ban it as a background, shift ≥12° off the Tailwind indigo axis |
| Cold slate/zinc surfaces | `#09090B` / `#18181B` are blue-leaning zinc | warm the grey ladder (Lovable's greys sit on a warm hue 107, never neutral) |
| Three rounded cards in a row | unaudited in our own screens | audit both marketing and builder for the pattern |

And separately: **`#1587FF` sits three points from Bolt's `#1488FC`.** In a
side-by-side screenshot our action blue and Bolt's are the same blue. There are only
two honest answers — move the hue far enough to be told apart, or accept the category
blue on purpose and differentiate entirely on type, warmth and elevation. Either is
defensible; drifting into it without deciding is not. The decision is still open
(audit §10.2, question 24).

Treat the four rows above as a standing brief on every new screen, not as a backlog
item somebody else owns.
