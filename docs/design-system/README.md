# Remixer design system

**Status:** living spec. Last reconciled against the prototype 20 Aug 2026.
**Audience:** anyone designing a new Remixer screen, and the DreamHost engineers who
will implement one.

**How facts are handled in this folder.** Every claim about DreamHost or a competitor
cites a row of `docs/product/FACTS.md` by ID (`DH-###` / `CMP-###` / `STD-###`) instead of
restating the value — that is `docs/global/AGREEMENTS.md` §3, "Дисциплина фактов", and
`docs/decisions/0004-facts-live-once-in-a-register.md`, and the two most embarrassing
errors this folder has carried both came from restating instead of citing. Most competitor
*design* readings (type scales, token systems, shadow ramps, measured hexes) have **no
register row yet**; where that is the case the source document and its capture date are
named and the gap is said out loud, never dressed up as a verified fact. Cross-references
name a section by **number and heading**, because renumbering has already broken pointers
here.

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
do *not* borrow is iOS's "liquid glass" glossiness; see `surfaces.md` **§2, "Glass —
macOS, not iOS"**.

---

## Colour semantics

### The semantic roles — and the discipline

| Role | Token | Hex | Means | Where it may appear |
|---|---|---|---|---|
| **Action** | `--action` | `#1587FF` | "You can do this." | Primary buttons, links, focus rings, the armed send button, the resizer while dragged |
| | `--action-hover` | `#3D9BFF` | | hover |
| | `--action-pressed` | `#0073EC` | | active/pressed |
| | `--action-100/200/300` | `#1587FF` @ 8% / 12% / 20% | | tints, selected rows, drag hairline |
| **Brand / plan / AI** | `--brand-from` → `--brand-to` | `#9B7BFF` → `#4A2BC3` | "This is Remixer's intelligence, or the thing you pay for." | AI surfaces, plan/upgrade moments. ⚠️ **Declared and currently unused** — see the open question below |
| **Live** | `--live` | `#48BA79` | "Your site is published and reachable." | the status dot beside a live address, the live badge, the support-chat bubble |
| **Action needed** | `--attention` | `#E5C359` | "Something is mid-flight or waiting on you." | connecting / verifying status dots, low-credit warning border |
| **Failure** | `--danger` | `#EF4444` | "This broke, or you are out." | error states, the credits pill at zero |

### The rules that make the palette mean anything

1. **Blue is the only interactive colour.** If something is blue, clicking it does
   something. Nothing decorative is blue. (`#1587FF` is our *spec* — **FACTS DH-401** —
   and it is **not** what production paints today: the live builder ships `#0073EC` and
   leaves `#1587FF` unused, **FACTS DH-402**. On the "our blue is Bolt's blue" worry, see
   the risk note at the end of this file; it is narrower than it has been stated.)
2. **The violet gradient is never a background.** It marks AI and paid surfaces, at
   small scale — a rim, a badge, an icon wash. A violet-to-indigo field behind body copy
   is the loudest item on the practitioner list of generic-AI tells — **cite it as craft
   consensus (FACTS DH-407), not as measured risk.** It is a good enough reason to keep
   the gradient small; it is not evidence that a user would bounce.
3. **Green and amber are never spent on anything else.** Not on a decorative chart,
   not on a "success" toast for a trivial action, not on a brand accent. They exist
   so that a glance at the toolbar answers one question — *is my site up?* — and every
   extra green pixel elsewhere costs that answer a little accuracy. Green means
   *reachable on the internet*. Amber means *you or we still have work to do*. If a new
   state is neither, it gets grey or blue.
4. **Everything else is grey or white-alpha.** The greys are Tailwind zinc as shipped
   (`--gray-950 #09090B` ground → `--gray-900 #18181B` panels → `--gray-850 #1F1F22`
   overlays → `--gray-800 #27272A` borders); separation and elevation come from the
   white-alpha ladder, not from colour. Which value is the *ground* was a live
   contradiction until the redesign settled it on `#09090b` (**FACTS DH-403**). Full
   ladders and their traps: `surfaces.md` **§7, "Hairlines and the two alpha ladders"**.
5. **The Siri spectrum is not part of the palette.** `#1F7CFF · #38C6FF · #8B5CFF ·
   #BE59FF · #FF2F6D · #FF705C · #FF9D5C` exists only inside the two AI motion effects
   (send flash, preview glow). It is never a static fill, and it never lands on a
   utility control — a rainbow on a tool reads as decoration. That was built, shown and
   rejected on 17 Aug 2026; **do not propose it again** — `motion.md` **§6, "Signature
   effect: the resizer glow — mono-blue"**. ⚠️ One live exception, unresolved: the
   Best-match rim paints `#BE59FF` as a static hairline — see the open question that
   follows this list.

**One documented adjacency, so nobody "fixes" it by accident:** the credits pill uses
its own warm gold (`#FFE082` at 17% → 7% fill, 15% rim), which is *not* `--attention`.
Credits are a permanent readout, not a state, so they get a separate token — and the
pill must stay in the toolbar permanently (**FACTS DH-405**; GoDaddy exiling credits to
their own page is their loudest documented complaint, **FACTS CMP-038**).

### ⚠️ Open question for the designer: two violets, and one of them breaks rule 5

This is raised, not resolved — it is a colour decision, not a lookup.

- `--brand-from` / `--brand-to` (`#9B7BFF → #4A2BC3`) are **declared in `index.css` and
  `tailwind.config.js` and referenced by nothing.** `grep var(--brand` over
  `prototype/src` returns no hits, and no Tailwind `*-brand-*` utility is used either.
- The surface this table used to credit them for — the Best-match hero rim
  (`.bestmatch-rim`) — paints a **different** gradient: `#BE59FF` →
  `rgba(77,114,255,.4)` → transparent, i.e. **`#BE59FF → #4D72FF`** along 90°.
- And `#BE59FF` is a Siri-spectrum stop, which **rule 5 above says is never a static
  fill.** A 1px rim on one hero card is about the smallest possible violation, but it is
  one, and it is the only place the spectrum currently leaks out of motion.

Three coherent answers, and the designer picks: (a) repoint the rim at
`--brand-from/--brand-to` and delete the literals; (b) redefine the brand tokens *to* the
rim's measured values and use them everywhere; (c) keep both and narrow rule 5 to say the
spectrum may appear as a hairline rim on AI surfaces. What is not an option is leaving a
declared-but-unused token pair while a hand-written gradient does the job — that is
exactly the drift the fact register exists to stop (**FACTS DH-401** on the semantics,
**DH-402** on what happens when a token and a painted value disagree).

---

## Type

**The brand pair is Gilroy for names and numbers, Proxima Nova for prose**
(**FACTS DH-404**). The split is systematic in every mockup: `font-display` (Gilroy) on
the product name, headings, prices and counts; `font-sans` (Proxima Nova) on everything
you read as a sentence. **Inter is not in this spec anywhere** — worth saying out loud,
because the audit's AI-slop table claims it is, and that claim is what inflated the risk
count at the end of this file.

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
in `measured-competitor-tokens.md`.

The one rule that survives that measurement is about **tracking, not leading.** Every
serious player tracks display type negative — Lovable −0.04em, Bolt −0.025em, v0
−0.02→−0.06em, Base44 −0.04em — and the single player at `letter-spacing: normal` on every
heading (GoDaddy Airo) reads as dated because of it.

⚠️ **Leading is not a rule, and this file used to claim it was ("1.0–1.1").** The same
measured table shows the spread is wide and the middle is not where we said: Bolt 1.00 ·
Base44 0.89–1.05 · Lovable 1.10 · **v0 1.17** · Airo 1.25. v0 is a benchmark, not an
outlier, so 1.17 refutes the range rather than proving it. Pick a display leading on the
grounds of our own face and line lengths; do not defend it with a category consensus that
does not exist. (Source: `measured-competitor-tokens.md`, "Cross-cutting, at a glance",
live computed styles 13 Aug 2026 — these readings have no fact-register row yet.)

And whatever scale gets chosen, it gets chosen on the real faces: design cannot be
approved on the Figtree/Outfit stand-ins (**FACTS DH-404**).

---

## What is in this folder

| Document | Answers |
|---|---|
| `README.md` (this file) | What is the language, what does each colour mean, what type do we use, where do I look next? |
| `surfaces.md` | **Material.** Shell geometry, the ground and the elevation ladder, the glass recipe and everything banned from it, radii, hairlines, the composer field, the Publish panel, where glass belongs and where it does not. Includes the token-reading traps that have already caused wrong values. |
| `motion.md` | **Behaviour.** The spring language, the performance contract, reduced motion in both engines, the chat send choreography, and the two signature effects with their approval status. Read the approval flags before proposing a change. |
| `siri-glow-spec.md` | The preview-edge loading glow as an engineering spec: measured FPS per configuration, layer anatomy, the quality governor, porting notes. Written for a production engineer accepting the effect. |
| `measured-competitor-tokens.md` | What Lovable, Bolt, v0, Base44 and GoDaddy Airo actually ship — typefaces, type scales, OKLCH/RGB token systems, shadow ramps, radii, easings — read from live computed styles on 13 Aug 2026, not from articles. Use it to check a proposal against the category before defending it on taste. |

Related, outside this folder:

- `docs/competitors/audits/synthesis-q3-2026.md` **§9, "Design-craft rules for Remixer's
  own interface"** — the chapter the rules above answer to; **§10.1, "Do not quote these
  in a deck"** lists the claims that must never reach leadership; **§10.2, "Open questions
  we must answer internally"** holds the design questions still open (21–27).
- `docs/product/FACTS.md` — the register. `docs/product/COPY-RULES.md` — the verb
  dictionary and de-jargon rules, which a screen must not re-decide for itself.

---

## Open risk: the AI-slop tells, counted honestly

This is not solved, and stating it as solved in a review would be wrong. It is also
weaker evidence than this file used to imply, and that matters more than the count.

**Status first — read it before quoting any of this.** The 2026 "AI-slop fingerprint"
(*Inter + an indigo-to-purple gradient + cold slate surfaces + three rounded cards in a
row*) is **FACTS DH-407**, and the row splits in two: the pattern list is `likely` — a
real, heavily-repeated **craft consensus** with named 2026 write-ups, all tracing the
cause to Tailwind's `indigo-500` default reflected out of model training data. The half
our documents actually lean on is `unverified`: that any user notices, that it costs
conversion, or that our blue's proximity to Bolt's is a competitive liability. Nobody has
shown a user seeing two builders side by side, let alone caring. So: **design against it
as taste — the designer may well be right — and never cost it out as measured risk.**
Drop the word "documented" unless you say documented *by whom*.

Counted against our own spec, the four tells land like this:

| Tell | Our exposure | Direction of fix |
|---|---|---|
| Inter as the UI typeface | **No.** Our spec names Gilroy + Proxima Nova (**FACTS DH-404**); the stand-ins shipping today are Figtree and Outfit. Inter appears nowhere in this folder's spec or in the prototype. The audit's §9.10 row "Named in our spec" describes the *older brief*, not this design system | nothing to fix here; keep the pair, and note that "some neo-grotesk" is not the tell — *Inter specifically* is |
| Indigo → purple gradient as the AI mark | **Yes.** `#9B7BFF → #4A2BC3` is exactly that axis (though it is currently unused — see the open question in "Colour semantics") | keep it to a handful of AI surfaces, ban it as a background, shift ≥12° off the Tailwind indigo axis |
| Cold slate/zinc surfaces | **Yes.** `#09090B` ground / `#18181B` panels are blue-leaning Tailwind zinc (**FACTS DH-403**) | warm the grey ladder — Lovable's greys sit on a warm hue 107, never neutral (`measured-competitor-tokens.md` §1, "Colour — full OKLCH semantic system", 13 Aug 2026; no register row) |
| Three rounded cards in a row | **Unaudited** in our own screens | audit both marketing and builder for the pattern |

**So the count is two of four confirmed, one refuted, one unaudited** — not three of four.
The old headline inherited the audit's "Inter, named in our spec" row and inflated itself
by one. If you need a number, count it again against the table above; if you do not, cite
the rule instead of the score.

### And the blue: the comparison was against Bolt's *hover* state

Our `#1587FF` is three points from **`#1488FC`** — and by our own measurement `#1488FC` is
Bolt's **hover** blue. Bolt's resting brand token is **`#2BA6FF`**
(`measured-competitor-tokens.md` §2, "Bolt.new (StackBlitz)" → "Colour — `--bolt-ds-*`",
which records `43 166 255` brand and `20 136 252` hover; live computed styles, 13 Aug 2026;
no register row). In HSL:

| | Hue | Lightness |
|---|---|---|
| Remixer `#1587FF` | 211° | 54% |
| Bolt **hover** `#1488FC` | 210° | 53% |
| Bolt **resting** `#2BA6FF` | 205° | 58% |

So the true statement is narrower than "our blue and Bolt's blue are the same blue": our
resting blue is indistinguishable from the colour **Bolt shows under the cursor**, and
about 6° and 4 points of lightness from the blue Bolt actually rests at. In a side-by-side
screenshot the two products' buttons are close but not identical; hover one of Bolt's and
they are the same. That is a real adjacency and a much smaller one than the file used to
claim — and per **FACTS DH-407** its cost is `unverified` either way.

Two honest answers remain — move the hue far enough to be told apart, or take the category
blue on purpose and differentiate entirely on type, warmth and elevation. Either is
defensible; drifting into it without deciding is not. The decision is open as audit
**§10.2, question 24** ("Do we move `#1587FF` off Bolt's `#1488FC`?"), and note that the
question as written compares against the hover value. There is a **third** open blue
question underneath it: production paints `#0073EC` while the system defines `#1587FF`
and never uses it (**FACTS DH-402**, and **FACTS §2.10**, "The action blue"). Deciding the
hue without deciding that is deciding half of it.

Treat the table above as a standing brief on every new screen, not as a backlog item
somebody else owns.
