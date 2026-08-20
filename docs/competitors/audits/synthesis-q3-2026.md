# Remixer Competitive Audit — AI Website & App Builders, Q3 2026

**Prepared for:** DreamHost Remixer product + design
**Date:** 13 August 2026
**Basis:** six competitor dossiers, six cross-cutting UX lenses, one adversarial fact-check. **Where the fact-check contradicts a dossier, the fact-check wins and the correction is stated inline.**
**Confidence convention:** (verified) = read from a live page, live DOM, first-party docs, or DreamHost ground truth. (unverified) = single third-party source, estimated from a screenshot, or explicitly flagged by the fact-check.

---

## 1. Executive summary

### 1.1 What changed in 2026

Three structural shifts happened between April and August 2026, and all three cut against assumptions in our brief.

**The category became registrars.** Lovable is now a full registrar — it sells domains in-app, registers domains with no project attached, supports transfer-in with EPP codes carrying A/AAAA/CNAME/MX/TXT/CAA/NS records, transfer-out, and a WHOIS privacy toggle. Its docs state plainly: "Lovable becomes the registrar for that domain" (verified). Vercel sells domains inside v0's publish flow (Publish → Customize → "Buy a Domain") at registrar cost, recently cut up to 50% (verified). Bolt resells with a 60-day transfer lock, likely via Name.com (unverified upstream). Base44 resells through Wix or IONOS. Emergent — a pure AI startup with no infrastructure of its own — resells IONOS domains free for the first year with SSL provisioned in under ten minutes (verified). **Selling a domain in-flow is table stakes, not a moat.** The brief's claim that "Lovable/Bolt/v0/Base44 structurally cannot" sell and connect a domain in-flow is out of date and must be retired from all internal positioning.

**One-click external DNS got bought off the shelf.** Replit — not a registrar, not a host — closed the exact gap DreamHost still has. Its docs describe "automated DNS configuration using Entri, a third-party service that can sign into your registrar and write records on your behalf, bypassing manual entry," with a 5 June 2026 release note reading "custom domain DNS setup automated; users no longer need manual record configuration" (verified). Lovable uses Entri too, with a documented manual fallback (A → `185.158.133.1`, TXT at host `_lovable` starting `lovable_verify=`). Entri is priced at roughly $249/mo for 600 domains a year, or $749/mo with custom-domain SSL (unverified pricing). Our verified Domain Connect gap is currently *category-standard* — Bolt, Base44, Figma and GoDaddy-for-external all still hand out record tables — but it is closing around us, and the fix is a purchase order rather than a roadmap.

**The paywall moved off the finish line everywhere except here.** Lovable: "Publishing itself is free. Only backend activity — such as database operations and AI features — consumes Run credits" (verified). GoDaddy's rule: "Credits are used when you perform an action that uses Airo AI Builder's agents... Credits are not used for non-agent actions," and publishing is not an agent action (verified). Bolt exempts version restores, UI-button actions and security audits. Base44 exempts all manual visual edits and every database read/write. Across fourteen products the only analogue to Remixer's publish charge is Emergent, which bills 50 credits/month as rent on an active deployment — and Emergent sits around 2.7/5 on Trustpilot (unverified rating, consistent direction across sources).

### 1.2 Who actually leads, and on what

| Area | Leader | Why |
|---|---|---|
| Whole-product UX system | **Lovable** | The only product where colour, type, elevation, motion, waiting, history and failure are one tokenised system |
| Proof before signup | **v0** | Complete anonymous build, self-QA'd, with the wall after the payoff |
| Agent self-verification | **v0** / **Replit** | v0 screenshots its own output at desktop and mobile; Replit renders the agent's cursor clicking through your app |
| Free/paid boundary design | **Figma Make** / **Replit** | Staged credit-free direct manipulation; free source-level element edits with automatic escalation |
| Scale (a 40-page site) | **Base44** | 600-page searchable switcher, "Files used in this page" reverse lookup, infinite live-frame Canvas |
| Progressive code disclosure | **Bolt** | Entire IDE + terminal behind one `<>` icon |
| Entry-screen composition | **GoDaddy Airo** | White prompt pill in a lavender bloom on violet-black |
| Anti-generic output, cheapest | **Google AI Studio** | Five complete design directions in one free click |
| Bundled economics | **Hostinger** | Mailbox ladder (0/1/2/5) inside the AI-builder pricing table |

Nobody leads on email. Nobody has designed the registrar moment. Nobody owns the hosting-layer failure surface. Those three are the entire overtake thesis.

### 1.3 The three things that decide whether Remixer wins

**1. Unmeter the finish line.** Publishing must cost zero credits, and the free-action list must be published *inside the product*, not in a KB article. We are, as far as this audit could establish, the only major builder charging for the moment of success (verified as our ground truth; competitor exemptions verified individually). This is simultaneously our most attackable line in any comparison page, a suppressor of republish frequency (which drives retention and domain attach), and a double-charge when the agent's own error must be fixed and then re-shipped.

**2. Own the sixty seconds around go-live.** Not "sell a domain" — everyone does that now. Specifically: (a) zero-record connect for domains already in the user's DreamHost account, resolving in seconds with no record table ever shown; (b) Entri or Domain Connect for external domains so we stop being the last builder handing out a CNAME; (c) a named domain state machine where every terminal state carries a verb; (d) a **real mailbox** provisioned in the same transaction — `hello@theirdomain.com`, MX/SPF/DKIM/DMARC correct by construction. Lovable sends 50,000 authenticated emails a month from your domain and its docs state explicitly that it does not provide mailboxes (verified). Base44: "Custom email domains are for sending only" (verified). Bolt's complete domains documentation set never mentions a mailbox (verified). v0 has no email product at any tier (verified). This is the last thing that is structurally uncopyable.

**3. Stop wearing the costume of the thing we generate.** The documented AI-slop fingerprint of 2026 is "the Inter typeface, an indigo-to-purple gradient, three rounded cards in a row." Remixer's stated design language is Inter/Gilroy/Proxima Nova, an indigo/purple gradient as the AI brand mark, a cool-leaning near-black (#18181B is R24 G24 B27), and an action blue (#1587FF) within three points of Bolt's #1488FC (all verified from our own spec and Bolt's live CSS). We also have no anti-generic mechanism at generation time, while Lovable renders three design directions before writing code, Base44 returns four, and Google AI Studio returns five for free.

---

## 2. The field at a glance

Scored 1–5 per dimension. 3 = category-competent. 5 = defines the state of the art. Blank/– = no meaningful capability.

| | Lovable | v0 | Base44 | Replit | Bolt | GoDaddy Airo | Hostinger | Figma Make | **Remixer** |
|---|---|---|---|---|---|---|---|---|---|
| Onboarding / time-to-wow | 5 | 5 | 3 | 4 | 2 | 4 | 2 | – | **3** |
| Anti-generic generation | 5 | 5 | 4 | 3 | 2 | 2 | 3 | 3 | **1** |
| Generation legibility (the wait) | 5 | 4 | 4 | 5 | 4 | 3 | 3 | – | **2** |
| Builder shell & IA | 5 | 4 | 4 | 4 | 4 | 2 | 3 | 4 | **3** |
| Agent / editing loop | 5 | 4 | 4 | 4 | 3 | 2 | 2 | 4 | **2** |
| Direct manipulation (visual edit) | 4 | 4 | 5 | 4 | 2 | 3 | 3 | 5 | **?** |
| Versioning & recovery | 5 | 4 | 4 | 4 | 4 | 4 | 1 | 1 | **?** |
| Publish & deploy UX | 5 | 4 | 3 | 4 | 4 | 2 | 3 | 3 | **2** |
| Domains / DNS / SSL | 5 | 4 | 3 | 4.5 | 2 | 4 in-house / 2 external | 3 | 2 | **3** |
| Email / mailboxes | 2 | 0 | 1 | 0 | 0 | 3 (paid add-on) | 4 | 0 | **0 shipped / 5 possible** |
| Monetisation UX | 4 | 2 | 3 | 3 | 2 | 3 | 2 | 3 | **2** |
| Design craft & motion | 5 | 4 | 4 | 3 | 3 | 3 entry / 2 product | 2 | 4 | **2** |
| Post-launch (analytics/SEO/security) | 4 | 2 | 4 | 3 | 2 | 3 | 3 | – | **?** |

**One-line verdicts**

| Competitor | Verdict |
|---|---|
| **Lovable** | The benchmark. Not because any single feature is unbeatable, but because it is the only product where the whole loop — negotiate, execute, review, recover — was designed as one system with one vocabulary. Its wound is credit expiry and a live app that pauses when *build* credits hit zero. |
| **v0** | Best proof-before-ask funnel in the category and the only agent that visually QAs itself in public. Then bills you for doing so, at raw token rates, with no plan below $30/user/mo. |
| **Base44** | The most mature design token system in the field and the only builder that has seriously designed for scale. Undermined by branches that write to production data, a 5-credits-per-day free tier, and Python stack traces leaking to no-code users. |
| **Replit** | Solved the two hardest problems by buying one (Entri DNS) and inventing the other (visible in-pane agent browser). Effort-based billing is opaque enough to produce documented bill shock. |
| **Bolt** | The cleanest answer to "show code without scaring people" (one `<>` icon) and the only user-controllable agent blast radius. Everything else is hostage to raw-token billing where cost scales with project size, not intent. |
| **GoDaddy Airo** | Our strategic twin: registrar + host bolts on an AI builder. Best entry screen in the field, a clean billing rule, and a free tier that **cannot publish at all**. Four overlapping builders under one brand, one of which they are killing on 31 July 2026. |
| **Hostinger Horizons** | The closest structural mirror of Remixer, and a cautionary one. Mailboxes laddered by plan (0/1/2/5) prove the email lever converts; burying the builder in hPanel proves what happens when it has no front door. |
| **Figma Make** | Owns the single best pricing-meets-design mechanism anywhere — staged, credit-free direct manipulation until you press apply. And has no file-level version history at all. |
| **Wix Harmony** | Hybrid vibe-coding + drag-and-drop funded by hosting subscription. Hard lock-in: no code export, no custom code. Ships semantic misfires live. |
| **Google AI Studio** | Free, and ships the two cheapest quality mechanisms in the sweep ("I'm Feeling Lucky", five Design Variations). Demand-gen for the Gemini API, not a retention product. |
| **Emergent** | Proof that a startup can manufacture registrar economics by reselling IONOS. Also proof of what charging rent on a live deployment does to your reputation. |
| **Framer** | The only vendor publishing a per-action credit price list. Copy that transparency, not the scope. |

---

## 3. Lovable, decoded

This is the section to build against. Everything below is measured from the live site, live DOM/computed styles, or first-party docs (verified), except where noted.

### 3.1 Onboarding — one composer, three contexts

The single most important architectural decision Lovable made is that **the marketing hero, the dashboard "new project" box, and the in-editor chat input are the same component** — same `data-testid="chat-composer"`, same editor id `chatinput`, same affordances. The marketing site is not advertising the product; it *is* the product's primary control. Muscle memory formed before signup transfers intact.

**Composer geometry (measured):** 608 × 97 px card, 28 px radius, white at 80% alpha with `backdrop-filter: blur(4px)`, a 0.5 px hairline border, and a two-layer soft shadow. Inside: a "+" button (`aria-label="Additional actions"`), a ProseMirror contenteditable (`aria-label="Chat input"`), a "Build ⌄" mode chip, and a mic (`aria-label="Start voice recording"`).

**The placeholder teaches prompt grammar.** An `aria-hidden` span, styled `text-primary-pulse/50`, cross-fades with `transition-opacity duration-500 ease-out` through rotating suggestions: *"Ask Lovable to create a landing page for my…"*. It solves blank-page paralysis without a modal, a tooltip or a tour, and it silently trains verb-first prompt shape while the user hesitates.

**Zero pre-generation configuration.** Docs are explicit: "no templates or style pickers exist in this flow. Users describe their vision directly." Design templates exist but are gated behind the "+" menu and restricted to Business/Enterprise. One decision to first generation.

**The wall fires on submit, and the prompt survives it.** Docs: the system "preserves the prompt through the signup process." Email, Google, GitHub, Apple. The user lands in the dashboard with the build already starting. **Net: 1 type + 1 send + 1 OAuth click.**

**The session has a tomorrow.** Free, Pro and Business all receive 5 daily build credits resetting at 00:00 UTC (Free capped at 30/calendar month). Unused daily grants do not roll over. This is a habit loop, not a countdown.

### 3.2 The anti-slop mechanism — taste decided before code

For visually open-ended prompts, Lovable generates **three parallel HTML/Tailwind "design directions"** to compare side by side, refinable up to six times total while preserving the overall design language. Where a project needs a stronger identity it instead runs **"design questions"**: typography (font pairs grouped by aesthetic category), colour ("curated swatches grouped by mood"), layout (wireframes — grids, splits, masonry). Answers compile into "a detailed design brief with named fonts, hex colors, layout approach."

Critically, it **skips this entirely** for dashboards, admin tools, cloned URLs, and template/design-system projects — where the user wants speed, not art direction. That skip list is as important as the feature.

### 3.3 Builder shell

Two panes: chat left, preview right. No right icon rail.

**Top bar, left to right:** Lovable logo (opens dashboard sidebar) → project-name menu (workspace, plan, credit usage, then "Get free credits", "Settings", "Project connectors", "Remix this project", "Design system", "Rename project", "Star project", "Move to folder", "Details", "Appearance", "Help") → History toggle → Close sidebar. **Right:** preview-toolbar button, Comments, collaborator avatars, Share, Publish (collapses to an icon on narrow windows).

**Navigation is a four-tab horizontal switcher** — Preview / Files / Code / **More** — with eight secondary destinations nested under More: Analytics, Cloud, Agent integrations, Payments, Connectors, Security, SEO & AI search, Sensitive data. This is why the toolbar never grows.

**Keyboard is IDE-grade and semantically consistent:**

| Shortcut | Action | Note |
|---|---|---|
| ⌘K | Command palette | Searches projects **and settings** |
| ⌘B | Collapse chat panel | *Same key* collapses the dashboard sidebar — it means "give me more canvas" everywhere |
| ⌥P | Build ↔ Plan | Works from the composer |
| ⌥V | Dictate | |
| ⌘⇧F / ⌘F | Project search / in-file | |
| ⌘⇧L | Insert exact line reference (`file.tsx:42`) | Shipped 10 Jun 2026 |
| S / T / D / C | Preview toolbar modes | Single-key, design-tool grade |

**Panel widths are undocumented** and could not be verified behind auth. Treat any px figure for Lovable's chat panel as unverified.

### 3.4 The agent loop

**Two modes, asymmetric pricing.** Build (default, usage-priced 0.50–2.00 credits) and Plan (**flat 1 credit/message, never touches code**). The pricing asymmetry *is* the UX: thinking is cheap and predictable, doing is metered.

**Plan mode renders an editable document with a real diff.** Full-screen "Plan view" containing overview, key decisions, components, data models, APIs, sequencing and optional diagrams. Users edit the markdown directly, or select any passage to get a "Describe the change..." box (shipped 3 Aug 2026). Revisions render as a diff where "removed wording is struck through and new wording is highlighted", toggled via **"Show changes" / "Edit plan"**. Approved plans archive to `.lovable/plan/` with dated filenames. This borrows the review affordance every knowledge worker already knows from Docs and applies it to AI intent.

**Execution is legible, not a spinner.** Activity cards name each step and each file, plus expandable subagent rows with human-readable titles — *"Explore: How does the current authentication flow work?"* — showing files inspected, searches run, tools used, findings returned. Subagents cannot write files. Shipped 27 May 2026.

**The wait is productive.** Prompts sent while the agent works enter "a visible queue above the chat input" where they can be paused, reordered, edited, copied, removed, and repeated up to 50 times. Stop mid-run keeps completed work and bills only what ran.

**Cost is disclosed at the point of consumption.** Each completed response exposes Undo latest edit, Revert to this version, Copy, Rate, and a More menu showing **message cost, duration and a shareable message link**.

**Recovery is free by policy, and the policy is documented:**

| Free | Source |
|---|---|
| Publishing and republishing | "Publishing itself is free." |
| Hosting, SSL, CDN delivery | Plans cap no visitors, requests or bandwidth |
| Basic *and* Deep security scans | Both zero credits |
| "Try to fix" / "Try to fix all" | "free within our fair use policy" |
| Design-system verification turns | "billed at zero credits" |
| First 100 inline text edits per user per day | Removes the typo charge entirely |
| Adding comments in the preview | Replying to Lovable costs |

**Version history doubles as the deploy ledger.** Automatic versioning, no manual save. Two tabs (History, Bookmarks). Per version: full-screen preview, code diff, jump to chat message, Revert, Bookmark. The live version carries a **"Published" badge**. Revert is honest about limits: it "does not restore or roll back your database data", and is disabled with the tooltip *"Cannot revert this far back in history"*. Chat history survives a revert so changes can be reapplied.

**Preview toolbar — four modes, single keys, draggable.** Select elements (**S**, ⌘ to multi-select), Edit text inline (**T** — "the fastest way to fix a typo, change a headline, or update a label"), Draw annotation (**D** — freehand recognised as lines/arrows/rects/circles, "a quickly drawn circle becomes a clean one"), Add a comment (**C**). Drags to any corner or default bottom-centre, minimises to a tab, position and state persist, theme Auto/Light/Dark so it never fights the user's own design.

### 3.5 Craft — how to rebuild the feel

**Colour: OKLCH semantic tokens with hue-constant dual theming.**

Light surfaces: `--bg-depth oklch(95.49% 0 107)` → `--bg-base oklch(96.99% 0 107)` → `--bg-primary oklch(98.51% 0 107)` → secondary/tertiary/quaternary all `oklch(99.99% 0 107)`.

Foreground ramp is a clean lightness ladder: **10 / 30 / 50 / 69%**.

Semantic hues (chroma + hue only shown): accent `.2396 264.41` (blue), destructive `.2203 26.56`, special `.2523 294.88` (violet), positive `.1689 138.23`, attention `.1819 40.04`, highlight `.2244 359.16`. Every semantic also ships `-translucent` (/.16) and `-glow` variants (hover /.08, pressed /.16).

Dark redefines **only the neutral ramp** — 20.42 / 23 / 24.74 / 27.2 / 30 / 32.8% lightness, a ~2.5% step per elevation level — plus `--fg-primary oklch(100% 0 0)`. `--bg-accent` is *byte-identical in both themes*; only translucency alpha shifts .16 → .2. **This is the structural reason the product reads as one brand in two themes with zero per-theme colour hand-tuning.**

Note the asymmetry: light collapses secondary/tertiary/quaternary to a single 99.99% ceiling (3 usable elevation steps) while dark keeps 6 distinct ones. **Dark is the design-led theme.**

**Type: a proprietary variable face, and exactly two rhythms.**

`Camera Plain Variable` 100–900 woff2 (plus a 400 italic cut), self-hosted at `/assets/CameraPlainVariable-*.woff2`, licensed to "Lovable Labs Incorporated". Code is `Roboto Mono Variable` 100–700 with per-subset files. **Nothing on the page is Inter.**

| Role | Size | Line-height | Tracking | Weight |
|---|---|---|---|---|
| Hero | 48 px | 52.8 px (1.100) | −1.92 px (−0.0400em) | 600 |
| Section | 36 px | 39.6 px (1.100) | −1.44 px (−0.0400em) | 600 |
| Sub-section | 28 px | 30.8 px (1.100) | −1.12 px (−0.0400em) | 600 |
| Body | 16 px | 24 px (1.5) | — | 400 |
| Secondary body | 14 px | 24 px | — | 400 |
| Price | — | — | — | **480** |

Two rhythms — a tight 1.100 display rhythm and a loose 24 px prose baseline — with no drift between them. The 480 price weight is only possible because the face is variable, and it is exactly the sub-perceptual tuning that separates a bespoke system from a Tailwind default.

**Radius: 6 / 8 / 10 / 12 / 16 / 24 / 28 / 32 + full-round.** `--radius: .5rem`. Measured distribution: 8 px (28 uses) and 10 px (28) dominate controls, 9999px (26) for pills and icon buttons, 16 px (17) for cards, 12 px (10), 6 px (8) for small chips. Hero composer 28 px, pricing card 16 px, buttons 8 px.

**Shadow: a physically-modelled six-step ramp plus per-semantic inset bevels.**

`--shadow-surface-xxs` → `xl` compose a hairline ring plus geometrically doubling offsets: `1px/1px`, `3px/3px −1.5px`, `6px/6px −3px`, `12px/12px −6px`, `24px/24px −12px` — **every layer at `#0000000a` (4% black), not the AI-default 10%.**

Buttons get their own recipe simulating a lit bevel: `inset 0 1px 0 0 #fff, inset 0 -1px 0 0 #fffc`, with per-semantic ring colours — accent `#11318c`, destructive `#8d0e13`, special `#53388c`, positive `#1d4e04`. The pricing CTA measured a **5-layer stacked shadow**. This layered micro-lighting is the main reason controls look injection-moulded rather than flat.

**Motion: four curves, 100–500 ms, nothing overshoots.**

| Curve | Duration | Applied to |
|---|---|---|
| `cubic-bezier(0.4,0,0.2,1)` | 150 ms / 200–300 ms | opacity / transform, translate, scale, rotate |
| `cubic-bezier(0,0,0.2,1)` | 100 / 300 / 500 ms | opacity; background-color, border-color, box-shadow |
| `cubic-bezier(0.33,1,0.68,1)` | 350 ms | `all` |
| `cubic-bezier(0.16,1,0.3,1)` | 250 ms | colour, border, outline, text-decoration |
| `cubic-bezier(0.215,0.61,0.355,1)` | 225–300 ms | SVG `stroke-dashoffset` |

**Scroll reveal is one gesture only:** `opacity 0 → 1` plus `matrix(1,0,0,1,0,12)` — a **12 px** rise. Not 40 px, not a scale, not a blur. IntersectionObserver-gated, not scroll-linked.

**Waiting is branded, not borrowed.** Roughly 39 named keyframes ship on the marketing bundle alone. Notably: `heartbeat` (scale 1 → 1.07 → 1.02 → 1.02 → 1.06 → 1 — a literal double-beat on the heart logo), `loader-sweep`, `shimmer-gradient` (background-position 200% → 0), `gradient-sweep`, `status-dot-ping` (scale 1 → 2.667, opacity 1 → 0), `message-highlight`, `checkbox-draw-check` / `checkbox-draw-minus` (checkmarks are **drawn** via stroke-dashoffset, not faded in), `radio-dot-enter`, `star-pop` / `star-spray`, `view-switcher-label-enter/exit/option-enter/label-swap-enter/option-swap-enter` (a five-keyframe choreography for a single tab switcher), `mention-pill-shift`, `sonner-fade-in/out/spin`.

**Glow tokens make hover and pressed identical everywhere.** `--glow-{neutral|accent|destructive|special|positive|attention|highlight}-{hover|pressed}` at 8% and 16% alpha respectively (neutral uses black at 4%/8%). Because hover and pressed are tokens rather than ad-hoc CSS, every interactive surface responds with exactly the same weight.

**Hero is a live canvas, kept below the type.** A single `<canvas class="absolute inset-0 h-full w-full object-contain">` at 2400 × 2420 renders the animated mesh. Brand ramps: blue `#4F88FF → #5185FF → #5885FF → #6289FF → #7491FF → #91A0FF → #B0ACFE → #CEAFFB`; warm `#FF8F1B → #FE771D → #FC541F → #FB3D26 → #FA2733 → #FA1F41 → #FC1A58`. Keyframes `background-enter`, `background-enter-skip`, `background-ambient`. **The hero sits on `--bg-base` off-white with the gradient fading in across the lower two-thirds, so type never competes with the gradient for contrast** — a discipline most AI-builder landing pages break.

**Craft wart, for honesty:** `querySelector('h1')` returns "AI App Builder" at 14 px/400 in `rgb(97,97,97)`, while the visually dominant "Build something Lovable" computes at 48 px/600 and is *not* an h1.

### 3.6 Copy — the vocabulary discipline

**One status vocabulary reused across unrelated subsystems.** "Up to date" / "Out of date" / "Scanning your project…" appears identically in the Security view and the SEO & AI search tab, with buttons "Scan project" (first run) and "Scan again". This is why the product feels like one thing rather than a bundle of features.

**A four-level finding icon language**, not red/green: green check = passing, blue lightbulb = low impact, amber warning triangle = medium impact, red X = high impact. Severities carry plain-language definitions — Error: *"Critical problems that need your attention right away"*; Warning: *"Issues you should review and fix if necessary"*; Info: *"Suggestions to consider implementing"*. Groupings: Failing / Passing / Fixed / Ignored issues, with **Restore** to un-ignore.

**A recovery verb for every failure state.** Verifying → "Check status". Unable to verify → *"DNS verification did not complete within one hour"*. Stalled → "Retry". Offline → "Recover. Review displayed DNS records". Removed → "Reconnect". Branded workspace URLs progress "Provisioning DNS" → "Issuing SSL certificate" → "Active". SSL carries a stated 72-hour escalation SLA and vendor-specific rescue copy: for Cloudflare errors 1001/1003, set records to **DNS only (grey cloud)**, not Proxied.

**Marketing headers follow a fixed rhythm** — noun, comma, past-participle: "Hosting, handled" / "Your app stack, connected" / "Payments, processed" / "Safe and secure, as standard" / "Works wherever, whenever". Highly copyable.

**Deploy state is stated three ways without contradiction:** a dot on the Publish button when live is stale; a "Published" badge on the live version in History; and the model stated plainly — *"Publishing creates a snapshot of your project. Changes made afterward don't affect the live site until you republish."*

### 3.7 What Lovable gets wrong

- **Credit expiry is the most-complained-about thing in the product.** Monthly plan credits roll over but expire 2 months after issuance; annual-plan credits expire 1 month after the period ends; top-ups expire 12 months; daily grants expire same-day. The pricing FAQ carries three defensive questions — "Do credits expire?", "What happens to my credits if my subscription ends?", "Are credits refundable?" Trustpilot: *"The subscription is basically extortion. If you do not use your tokens and end the subscription, they are gone."*
- **Zero credits pauses a live app's backend.** Docs: building halts, deployed-app AI features fail, and "built-in backend services will pause" — database, storage and auth safe but inaccessible; only static pages keep serving. A customer-facing app can break because the owner ran out of *build* credits.
- **Business is 2× Pro for identical 100 credits.** The pricing FAQ literally asks "Why is the Business plan more expensive?"
- **Fine-grained visual edits get silently overwritten by later prompts** (Superblocks). Visual and chat edits write the same files with no lock or protected-region concept.
- **Non-primary domains 302-redirect** — temporary, so link equity is not consolidated.
- **Free tier is a demo:** read-only code editor, no custom domain, 30 build credits/calendar month, 5 lovable.app domains.
- **Three security incidents in thirteen months**, including a BOLA flaw exposing source code, Supabase credentials, Stripe customer IDs and full AI conversation histories — reported 3 Mar 2026, open 48 days, initially denied. The Register, 20 Apr 2026: "Lovable denies data leak, cites intentional behavior."

---

## 4. Per-competitor teardowns

### 4.1 Bolt.new (StackBlitz)

**Genuinely best at: progressive code disclosure and user-controlled agent blast radius.**

The entire IDE — file tree, CodeMirror editor (`--cm-cursor-width: 2px`), and a bottom drawer with **Bolt / Publish Output / Terminal** tabs — hides behind a single `<>` icon in the top-centre bar, framed in Bolt's own docs as *"shaped to feel approachable for anyone who wants to dig deeper."* One control serves both audiences with no mode switcher and no separate "pro" surface. The terminal is a real POSIX-ish shell against a live Node process, two clicks away, presented as just another tab — and it is themed with the Hyper Snazzy palette (fg `#eff0eb`, red `#ff5c57`, green `#5af78e`, blue `#57c7ff`, magenta `#ff6ac1`) rather than xterm defaults, which is a cheap, legible craft signal to exactly the audience most likely to judge.

**Right-click file governance is the most under-copied idea in the category.** Under the heading *"Guide Bolt's focus"*: "Target file" (pin the agent's attention), "Lock file" / "Lock all" (exclude from edits). Rationale in their own words: *"You'll get more accurate results if you're explicit about what Bolt should and shouldn't change."* One context menu answers three separate complaints — the AI changed something I didn't ask about, it broke another page, and it burned my credits re-reading everything.

**Declared layout maths (measured from live CSS, verified):**

| Token | Value |
|---|---|
| `--chat-default-width` / `--chat-min-width` | 450 px |
| `--chat-only-max-width` | `clamp(720px, 50vw, 1024px)` (pre-generation) |
| Resize handle | `rgb(var(--bolt-ds-brand) / 50%)` |
| `--header-height` / `--panel-header-height` | 50 px each (deliberately matched so the seam reads as one band) |
| `--side-menu-width` | 35 px |
| `--workbench-width` | `calc(100% - var(--chat-min-width))` |
| `--workbench-inner-width` | minus `1rem` (16 px gutter so the preview floats) |

**Radius language is bimodal with a real rule:** 6 px chrome, 8 px base (`--radius: .5rem`), **full pills (9999px) reserved for AI-facing controls** — the "Plan" toggle, "Build now", and the Figma/GitHub import chips (73×28 and 78×28). Chrome is rectilinear; agent actions are capsules.

**The loading bar is a design token, not a component:** `linear-gradient(90deg, #0a0a0a 0%, #2ba6ff 21.5%, #fff 33%, #2ba6ff 65.5%, #0a0a0a 100%)` — a five-stop sweep where the white reads as a specular glint travelling along the bar. Paired with `--shimmer-color: rgba(255,255,255,.06)`.

**Motion is one curve, one duration:** every measured button transition is `0.15s cubic-bezier(0.4,0,0.2,1)`, enumerated per property rather than `all`. Decorative glass chips run 0.2s.

**Publish is the most consolidated surface in the field.** One modal, "Publish your project": visibility dropdown with *consequence* copy (Public: "Anyone on the web can view it and search engines can find and list it"; Private: "Only your team and invited users can see it"), Manage access, **"Run security audit"** (free of tokens, 30/day, results in chat with a "Needs your action" section, resting label "Security audit up to date"), an Edit-domain pencil, Publish/Update, and Unpublish (two clicks).

**What it gets wrong:**

- **Cost scales with project size, not intent.** Bolt's own FAQ: *"Most token usage is related to syncing your project's file system to the AI: the larger the project, the more tokens used per message."* A button-colour change on a mature project can cost more than a whole feature on a new one.
- **Error loops bill at full price.** Product Hunt: *"it's unfortunate that they still get consumed when there's errors because solving the errors can take quite a while."* Reviewers estimate up to half their tokens went to errors; reports of 7–12 M tokens in an afternoon and 20 M+ on a single auth issue (unverified individual figures, consistent direction).
- **The public $25 Pro price is a decoy.** "Start at 10M tokens per month"; the real ladder (Pro 50 = $50/mo, Pro 100 = $100/mo, Pro 200 = $200/mo) only appears after signup.
- **Hard signup wall with a survey inside it.** Quickstart: "Build now" → "Sign in or sign up (Google, GitHub, or email: no credit card required)" → complete a survey → "approximately five minutes while Bolt creates your app." Nothing renders anonymously. The 300 K free daily cap is reported to run out before a first build finishes.
- **Custom domains are 100% manual DNS even for domains bought through Bolt** — www CNAME and root ALIAS/ANAME/flattened CNAME to `site-dns.bolt.host`, TXT for subdomains, "up to 24 hours", manual "Verify domain status".
- **Zero mailbox capability.** MX appears only as a record type you may add manually for someone else's host.
- **No in-app fix button.** Recovery is reading the Terminal tab, or the browser console: *"On macOS: press CMD + Option + J."*
- **Free sites are invisible to search** (SEO Boost requires paid **and** a custom domain) and **go offline** on bandwidth overage (10 GB / 333,333 requests) until the next cycle.
- **Analytics count bots** with no filtering, by Bolt's own admission.
- Trustpilot reported at 1.4/5 (unverified — single aggregate source).

### 4.2 Base44 (Wix)

**Genuinely best at: design tokens, direct manipulation, and designing for scale.**

**The token system is the most mature in the sweep for a two-year-old product** (measured from `app.base44.com/static/index-Dg-ALxaG.css`, verified):

- **Two parallel neutral ramps.** Warm `stone` (50 `#f8f6f4` → 100 `#f1eeea` → 300 `#ddd8d2` → 700 `#3d3c3a` → 950 `#1b1a19`) used for *all* surfaces and borders; cool `neutral` (50 `#fcfcfc` → 500 `#5d5d5d` → 950 `#0f0e0e`) reserved for disabled states and dark shimmer. **Base44 never uses a pure cold grey for a surface.**
- Marketing is entirely warm paper: `#f9f7f4`, `#f1eeea`, `#eeeceb`, `#edebe7`, `#e2ded7` on ink `#1e1e24` with warm grey text `#6d6a67`.
- Radius scale: `none 0, xs 2, sm 4, md 6, lg 8, xl 12, 2xl 16, 3xl 24, 4xl 32`, plus card 10, pill 100, full 9999. **Marketing restricts itself to 6 and 8 only** — restraint reads as premium.
- Strict 4 px spacing grid: 2/4/6/8/10/12/14/16/20/24/28/32/40/48/56/64/80/120.
- Shadows are warm-black at 5%: `--shadow-xs: 0 1px 10px 0 #1c1a180d, 1px 0 2px -.7px #1c1a180d`; `--shadow-md: 0 10px 20px 0 #0f0e0e0d`; `--shadow-lg: 0 20px 30px 0 #0f0e0e1a`. Plus one specular trick: `--shadow-glass-top: inset 0 1px 0 #ffffff80`.
- Motion: `--duration-instant 80ms / fast .12s / base .18s / slow .26s / slower .36s`; `--ease-out cubic-bezier(.16,1,.3,1)`, `--ease-in-out cubic-bezier(.65,0,.35,1)`, `--ease-spring cubic-bezier(.34,1.56,.64,1)`. Marketing's dominant curve is `cubic-bezier(0.22,1,0.36,1)` (easeOutQuint, 23 occurrences).
- Interaction state is tokenised as **opacity**, not extra colours: disabled .4, muted .65, hover .85, press .75, scrim .32. Plus a named z-index ladder (dropdown 1000 → tooltip 1080) and per-intent focus rings.
- Typefaces: `--font-body "Wix Madefor Text"`, `--font-titles "Wix Madefor Display"`, `--font-brand "Dazzed"`, `--font-mono "Azeret Mono"`. The Wix corporate face now sits inside the product; Dazzed survives as the startup brand mark.

**"Premium" is a first-class semantic intent.** `--sem-fill-premium-{primary,secondary,light,ghost}-{default,hover,active,disabled}`, `--sem-border-premium-*`, `--focus-ring-premium: 0 0 0 3px var(--orange-100)`, and `--gradient-premium: linear-gradient(135deg, orange-100 0%, purple-200 50%, purple-300 100%)`. **Upsell is designed, not bolted on.** Steal this exact idea.

**Manual visual edits cost zero credits.** Docs list what does not consume credits: "Database reads/writes, manual visual edits (dragging, layout changes, direct text editing)." The Edit-mode toolbar exposes real tokens — Colors, font family/size/content, text style, per-side spacing in px, corner radius in px, opacity 0–100, and a **raw Tailwind Classes field**. Shipping a Tailwind escape hatch to a non-technical audience is brave and is the pressure-release valve for the design ceiling.

**Cmd+. switches Default / Discuss / Edit "even while you're typing a prompt."** Discuss is a flat **0.3 credits** against 0.5–4 for execution. Intent changes mid-sentence; preserving in-flight text while reclassifying it removes a retype and a decision.

**Scale is designed for.** A type-to-search page dropdown holding **600 pages**; "Files used in this page" grouped by project location with "See all files" — the best bridge in the field between a non-coder's mental model (a page) and a file system. Canvas is an infinite board of live-preview frames at desktop/tablet/phone with Figma-grade shortcuts (V/H/D/N/I, ⌘1 fit, ⌘0 100%, ⇧⌘L lock) and real-time multiplayer.

**Redesign returns four options side by side** with previews, scoped to project or section: *"AI shows previews before it touches anything."*

**What it gets wrong:**

- **Branches share live production data.** Marketed as "Branch your app to try changes safely" (5 Aug 2026), but docs confirm all branches "read/write identical records". Branches also disable publishing, secrets, connectors, automations, workflows, in-app agents, the code editor, theme settings and version-history restore.
- **"Credits are non-refundable for tool behavior and AI mistakes."** The single most inflammatory sentence in its documentation.
- **Free is 5 credits per DAY** (25/month), 5 apps. A Product Hunt reviewer: *"you'll burn through them just tweaking UI."*
- **Integration credits are burned by your customers.** Email 1, image 1, video 5/sec, LLM 1–15, in-app agent messages 3–40. Exhaustion pauses live features. The harshest paywall placement in the category.
- **Raw stack traces leak to a no-code audience.** From Base44's own troubleshooting page: `Failed to load app: Error serializing to JSON: UnicodeEncodeError` (triggered by characters in an app *name*) and `'dict' object has no attribute 'lower'` — a Python AttributeError.
- **Two first-party sources contradict each other on whether top-ups exist.** Docs say no; the pricing blog FAQ says "You can top up your credits at any time without changing plans."
- **No way to review what will change before publishing.** "Provide an option to preview changes before publishing" is an open, upvoted item on Base44's own feedback board.
- **Data version history is Elite-only** ($160/mo, 7-day; Enterprise 30-day).
- Email is sending-only via SendGrid CNAMEs; built-in email reaches only registered app users, with no external addresses and no attachments.
- **The hero composer is decorative** — an animated fake cycling Build/Send against [Apps][Websites][Games][Tools], with every CTA handing off to app.base44.com. It wastes the highest-intent moment in the funnel.
- **Fact-check note:** the widely-cited runtime ceilings (150 ops/min, 5,000-item request cap, 3-minute automation cutoff, 5-minute function limit, 50 functions max) are **unverifiable** — single adversarial source (escapebase44.com), which itself concedes the 150 ops/min figure "isn't documented anywhere." Do not put these in a deck.

### 4.3 GoDaddy Airo — the strategic twin

This gets extra weight because it is the same move we are making: a registrar + host bolts an AI builder onto an existing account. Both the playbook and the traps are directly transferable.

#### 4.3.1 The playbook worth copying

**The domain-first funnel.** godaddy.com/airo sequences it as: (1) "Enter some info about your idea or business into our AI Domain Search prompt." (2) "Review domain options and purchase your domain." (3) "Publish your One-Page Site or wait to customize your full site." The domain purchase is the transaction; the site is the free gift. A domain buy unlocks 12 AI logo options, a Microsoft 365 mailbox, suggested social handles, campaign content, a free LLC filing, and a "Personalized One-Page Site, delivered instantly."

**Named agents rather than one undifferentiated assistant.** Airo.ai launched 13 Nov 2025 with six: Airo Agent (orchestrator), Airo App Builder, Compliance Agent, Domain Search and Registration Agent, Website Builder Agent, Logo Agent. Executive framing from CBO Gourav Pani: *"Small business owners do not want to master a tech stack; they want outcomes that help them start and grow."*

**The entry screen is the best single composition in the field.** Near-black violet ground (~`#150A1F`–`#1B0D2B`, **estimated from GoDaddy's own screenshot, unverified**), a headline alternating white and violet per phrase — "Describe your idea. Get a live website in minutes." — and a **pure-white full-radius prompt pill floating inside a multi-layer lavender bloom**. The glow, not a border, does the work. Trust row: "Get started for free · 50 AI credits/mo · No credit card required."

**Eight starter chips lifted from small-trade reality:** Boutique Store, Coffee Shop Website, Yoga Studio Portal, Product Launch, Freelancer Portfolio, **Rebuild my site**, **Pressure Washing**, Local Food Truck Landing Page. "Rebuild my site" is a deliberate switcher hook; "Pressure Washing" signals this is for trades, not SaaS founders.

**The wall lands after the prompt.** "Enter the prompt that you've created and click the Start Building for Free button" → "Log in to your GoDaddy account, or create your account if you don't have one." Note the direction of travel: GoDaddy's *legacy* Websites+Marketing path walls first; the newer product moved it later.

**Violet discipline.** Violet appears only on the BETA pill, alternating headline words, the prompt glow, both send buttons, and the AI sparkle in the element toolbar. Every non-AI control is neutral. This is exactly the rule our indigo/purple should follow.

**A single clean billing rule, published.** *"Credits are used when you perform an action that uses Airo AI Builder's agents (for example, using the Airo AI Builder chat). Credits are not used for non-agent actions."* The free list: Preview, Code (editing code/files), Edit (non-AI changes), uploading via Menu, Media management, and "Restore your app to a previous version using History."

**The docs actively steer users off the meter.** *"Use Edit for simple edits: If you only need to change text, swap an image or adjust a color, use Edit instead of typing a prompt. It's free, and Airo AI Builder can't make unintended changes when you're editing directly. Save the AI chat for complex tasks."*

**The agent repairs its own errors for free**, and runtime failures raise a one-click **"Ask Airo to Fix It"**.

**Restore never auto-publishes.** Both History restore and Backups restore end with the identical instruction: *"Once restored, select Publish to make it live."* Versions are previewable before restoring. This is the correct model.

**Expiry-first spend order, stated:** *"Airo Builder uses credits in order of expiration, starting with those expiring soonest. This includes both free and paid credits."* Purchased credits expire 1 year from purchase; monthly credits do not roll over.

**Downgrade is a soft landing:** the site goes offline but "your content is preserved" and is restorable on re-engagement or upgrade.

**Getty Images.** GoDaddy's own comparison tables score "Professional images: Yes — Getty Images library" against Base44 and Hostinger Horizons, both marked "AI-generated only." Licensed stock reachable from chat materially outperforms AI imagery for small-business sites.

**MCP distribution, 14 Feb 2026.** Domain search now runs inside Claude conversations — live availability, pricing, purchase link, no tab switch. Framing: *"Naming your business shouldn't feel like an interruption. It should feel like inspiration."* Roadmap: authenticated domain management, bulk checks, expansion to OpenAI, Google and Perplexity. **Treat this as urgent — the registrar is moving its top-of-funnel into other people's assistants.**

#### 4.3.2 The legacy-host traps — what we must not repeat

**Trap 1: brand sprawl.** GoDaddy maintains a help article titled *"Which GoDaddy website builder do I have?"* because it runs four overlapping products: Classic Websites+Marketing Website Builder; GoDaddy AI Website Builder (**being discontinued 31 July 2026**, customers migrated to the classic builder); Airo AI Builder (the real competitor); and Airo for WordPress. GoDaddy even has to warn: *"Although Airo AI Builder and Airo for WordPress share the Airo brand, they're separate products that build different things."* Third-party reviewers routinely conflate them — one 2026 "vibe-coding" review of Airo AI Builder actually lists Websites+Marketing prices and complains it "can't add custom code," which is false. **Needing a disambiguation article is the diagnosis.**

**Trap 2: the credit balance exiled from the work surface.** User menu → "Manage my plan" → "Total AI Credit Usage". Reviewer verdict: *"unlike other AI builders that display a running tally of your AI credit use somewhere on the dashboard, GoDaddy keeps Airo's tucked away on a separate screen"* — called "a nuisance" and named among the top complaints. **Remixer's persistent top-toolbar credits chip is already better. Never move it.**

**Trap 3: information architecture that reveals its history.** The six-item mode bar is Preview / Edit / Code / **Menu** / **Media** / Settings — with "Menu" defined as "Upload and insert images, videos or documents" and "Media" as "Edit, upload and manage your app's visuals." Two asset managers, adjacent, in a six-item bar. Settings contains only two things: Database and Secrets.

**Trap 4: label drift.** The same device selector is "Preview Desktop" in the build article and "Change device" in the publish article. The same share affordance is "View & Share" in one place and "Share link" in another.

**Trap 5: dev-server internals leaking into a no-code product.** The build doc ships a manual **"Refresh Preview"** button — an admission the preview desyncs — and the official prompt best-practices table gives the recommended fix for "Preview isn't working" as prompting **"Restart dev server."**

**Trap 6: configuration by pasted prompt.** The official contact-form article instructs users to paste GoDaddy-authored strings into chat: *"Can we update our contact form and use the new email skill to see if we need to make any changes?"*, *"CC [your email address here] to my email contact form."*, *"Change my To email address to [your GoDaddy Conversations email here]."* Non-discoverable, brittle, leaks internal agent architecture ("email skill"), and spends metered credits to change a setting.

**Trap 7: leaving the builder to buy a domain.** The documented path from the world's largest registrar: *"Go to GoDaddy domains, search for a desired domain, and then purchase it"* → return to the Airo apps page → select the app → Domain → Settings → Connect Domain → Yes, Continue. **This is the single biggest unclaimed opening in the category.**

**Trap 8: identity break at the door.** The dark violet entry screen gives way to a **light** builder interior — white chat cards, white floating toolbars, light canvas. The product you fell for is not the product you use.

**Trap 9: help pages wrapped in the storefront.** Every documentation page renders behind the full commercial mega-nav (Domains / Websites / Email / Hosting / Marketing / Commerce / SSL / Pricing / Deals).

**Trap 10: the renewal cliff.** Airo Plus $59.88/yr year one, renewing $95.88/yr. Airo All Access renewing $323.88 after a 14-day trial (both unverified, third-party sourced). Reviewers converge: *"GoDaddy advertises the first-year price and renews materially higher, so the number that matters for a budget is the two-year total, not the promo."* Remixer's flat $9.99/$14.99 with no renewal cliff is a positioning weapon we are not using.

#### 4.3.3 Fact-check corrections to the Airo dossier

These override the dossier. **Do not cite the original claims.**

| Dossier claim | Correction |
|---|---|
| Free-tier sites land on a long `site-nwujq32p6.godaddysites.com` subdomain with no rename | **Refuted.** Airo AI Builder's Free plan **cannot publish at all** — "you'll need to upgrade to a paid plan if you want to publish your website." Publishing starts at Starter ($9.99/mo). And published Airo projects land on **`*.airoapp.ai`** (observed: `eduflow.c39.airoapp.ai`), not godaddysites.com. `godaddysites.com` belongs to the separate legacy Websites+Marketing product. The competitive point survives — a free tier that cannot publish is a *harsher* gate than a bad subdomain — but the mechanism as stated is wrong. |
| Free one-click security, SEO and code-quality scans | **Refuted.** Security scan free; QA/code-quality scan free (reviewer hedges "or at least it was when I ran it"); **SEO and legal scans cost credits**; repairs cost credits in all cases. The scan-free/fix-paid seam is real but narrower. |
| No keyboard shortcuts or command palette anywhere | **Unverifiable.** GoDaddy's help and product pages returned HTTP 403 to fetching. The only support is a review of a *sibling* product. Absence of documentation is not evidence of absence. |
| No inline diffs, file chips or per-message revert | **Unverifiable.** Same 403s. Nothing found affirming these exist, nothing ruling them out. Requires in-product verification. |
| Radii bimodal (full-pill AI, 8–12 px chrome) | **Unverifiable.** Sourced to a single marketing screenshot; pixel radii cannot be confirmed that way. |
| Mobile framed as output, not authoring | **Unverifiable.** The quoted strings could not be confirmed (403). Indirect corroboration only supports the weaker reading (a QA agent checks mobile responsiveness). |

#### 4.3.4 Airo pricing (verified from GoDaddy's own pricing section)

| Plan | Price (annual) | Struck-through | Credits/mo | Published sites | Notes |
|---|---|---|---|---|---|
| Free | $0 | — | 50 | **0** | "No credit card required", unlimited building |
| Starter | $9.99/mo | $14.99 | 150 | 1 | SAVE 33% |
| Professional | $24.99/mo | $36.99 | 300 | 10 | "Most Popular"; adds Connect a domain, Download your code, Share access |
| Ultimate | $99.99/mo | $149.99 | 750 | 50 | Ultimate credit figure corroborated but not read off the tier card — **unverified** |

Measured burn: **~8 credits/prompt** (314 credits across 39 prompts over 3 days on an LMS build, unverified single reviewer). At that rate, 50 free credits ≈ six prompts.

### 4.4 v0 (Vercel)

**Genuinely best at: proof before signup, and agent self-verification.**

**No wall at all before generation.** A logged-out visitor typed "a simple landing page for a coffee shop" and received a complete, styled, multi-section, self-QA'd page (verified by direct run). The model picker even exposes third-party frontier models pre-login. The wall arrives *after* as a modal: *"Create your own app / Sign up to build your idea or duplicate this chat. Free users get $5 in credits per month."* Note the second clause — "or duplicate this chat" — converts loss-aversion directly.

**The agent declares an art direction out loud before writing code:** a step row "Generated design direction", then the sentence *"I'll commit to a warm, editorial craft-coffee direction with a deep espresso palette and amber accents."* Then it writes **theme colours and font tokens first**, before any component:

> Generated design direction → Scanned project → Explore • 3 Files → Generated beans image → **Updated theme colors** → **Added font tokens** → Set up fonts and metadata → Applied fonts to html → Created header → Created hero → … → Assembled page

**Then it screenshots its own work.** Step rows "Loaded agent-browser skill", "Verified page in browser", "Checked debug logs", "Screenshotted full page", with the literal shell line rendered in chat: `$ agent-browser screenshot /tmp/agent-browser/full.png --full`. Desktop and mobile renders appear as inline thumbnails. It found a real defect — *"there's a real error: the Button component doesn't support asChild"* → *"The Button uses base-ui, which needs a render prop instead of asChild"* → four fix steps → *"Base-ui needs nativeButton={false} when rendering as a link"* → four more — then chased a false-positive console error to ground: *"Console history is accumulating across navigations. Let me close the browser fully to clear the buffer."*

**The closing summary names design decisions in design vocabulary** — invented brand "Ember & Oak", a Fraunces/Inter pairing, espresso + cream + amber palette, sticky header with working mobile menu, pull-quote card, semantic tokens in globals.css.

**Design Mode is a real property inspector,** free on the Free tier, with Undo/Redo/Reset, a **Before/After comparison toggle**, ⌘I to switch between inspect and interact, and — the good part — typing a natural-language instruction at a selected element **auto-attaches a screenshot of that element** to the message. Apply batches edits into one real chat version.

**Design Systems 2.0 is the strongest grounding story in the field.** A design system becomes a *skill*, imported from GitHub repos, Figma frame/node URLs, Storybook, npm/`.tgz` packages, free-text notes and `NPM_TOKEN` env vars; emits a `v0.json` with up to three read-only reference sources; then runs a verification chat that builds a starter app, previews it, and **pauses for human approval before saving**. Once attached, the agent "refuses to use components, props, or tokens it cannot verify from the provided sources." Updating a skill deliberately does **not** rewrite existing projects.

**Empty states teach.** The idle code editor shows the logomark, "Describe what you want to build and let the agent help", and four shortcuts as rendered keycaps: Go to File ⌘P · Find in Files ⇧⌘F · Command Palette ⇧⌘P · Terminal ^`.

**Craft (measured):** landing ground `oklch(0 0 0)` — true black. Composer 690×108 px, 12 px radius, fill `oklch(0.182 0 0)`, 1 px border `oklch(0.39 0 0)`, placeholder "Ask v0 to build…" 14 px/400. Submit 28×28 px, 6 px radius, `oklch(0.946 0 0)`. Hero h1 is a deliberately *small* 32 px/600 at −1.28 px (exactly −0.04em). Three-radius system mapped to role: 12 px containers, 6 px controls, full-round chips. The only saturated colour anywhere is the code syntax palette: `--sh-class #00a7fd`, `--sh-string #00e7c1`, `--sh-keyword #ff0078`, `--sh-jsxliterals #ffff72`.

**What it gets wrong:**

- **Six minutes and twenty-one seconds** to first render, badged "Worked for 6m 21s", with the preview pane showing only *"Your v0 generation will show here."* the entire time.
- **The self-healing is billable.** Roughly a third of the visible steps in the measured run were spent fixing an incompatibility in **v0's own starter Button component**. Community thread "Credits are burning way too fast": *"I spent 30$ in a single day just to add a couple of category pages... We are literally paying for all the good/bad codes that v0 generates, it's terrible."* One user measured ~20% of iterations as corrections for v0-caused breakage.
- **No individual paid plan.** Free ($5 credits **and** a hard 7 messages/day) → $30/user/mo. Premium at $20 was sunsetted.
- **v0 Max is the default model** for a new anonymous user — the second-dearest tier, on a ladder with a **40× output-price spread** (Mini $1.20 vs Max Fast $50 per 1M output tokens).
- **Every builder toolbar icon ships with `aria-label` and `title` both null** — only "Add to favorites" carried a label.
- **External-domain DNS is punted entirely to the Vercel dashboard.** No record types, no verification UI, no guidance in v0's own docs.
- **No email product at any tier.**
- Design Mode is "unavailable on read-only chats or mobile viewports" — so the visual editing story does not extend to the iOS app or shared links.
- Free deployments carry a "Built with v0" badge.

---

## 5. Category-wide patterns

### 5.1 Table stakes — Remixer must match all of these

| # | Convention | Who has it | Remixer |
|---|---|---|---|
| 1 | Prompt-first funnel; wall after the prompt or none | Lovable, v0, GoDaddy, Wix, Framer | Yes (landing composer) — **handoff unverified** |
| 2 | Zero pre-generation questionnaire | Lovable, v0, GoDaddy, Bolt | Yes |
| 3 | Named, semantic generation states + elapsed time | Lovable, v0, GoDaddy, Replit, Base44 | **No** |
| 4 | Plan/Discuss mode, flat-priced *below* build | Lovable (1.0), Base44 (0.3), Bolt, Figma Make, Replit | **No** |
| 5 | Free direct-manipulation lane | Base44, Replit, Lovable (100/day), GoDaddy, Figma Make | **Unknown** |
| 6 | Published list of zero-cost actions | Lovable, GoDaddy, Bolt, Base44 | **No** |
| 7 | Per-message cost + duration receipt | Lovable only | **No** |
| 8 | Per-turn revert + preview-before-restore + restore ≠ publish | Base44, Lovable, GoDaddy, Bolt | **Unknown** |
| 9 | Free error recovery ("Try to fix") | Lovable, GoDaddy, Bolt (audits), Base44 (partial) | **Unknown** |
| 10 | Deploy state expressed consistently (stale dot + live badge + snapshot copy) | Lovable (3 ways), Bolt (2), Base44 (1) | **No** |
| 11 | Publishing free | Everyone except Emergent | **No — we charge** |
| 12 | In-flow domain purchase | Lovable, v0, Bolt, Base44, Replit, Emergent | Partial |
| 13 | Domain state machine with a recovery verb per failure | Lovable (best), Replit | **No** |
| 14 | Free security scan placed at publish | Bolt, Base44, Lovable, GoDaddy | **Unknown** |
| 15 | Anti-generic design mechanism | Lovable (3), Base44 (4), AI Studio (5), v0 (declared direction) | **No** |
| 16 | Preview/testing link for unpublished changes | Base44 (best), Lovable (7-day) | **No** |
| 17 | Agent blast-radius control (lock/freeze/target) | Bolt, Base44 | **No** |
| 18 | Daily free credit grant | Lovable, v0, Bolt, Framer, Replit, Base44 | **No** |
| 19 | Perpetual free tier | Lovable, v0, Bolt, Base44, GoDaddy, Framer, Replit, Hostinger | **No — 30-day trial** |
| 20 | Template / remix gallery | Lovable (194), Bolt, Base44 (paid marketplace), v0 | **Unknown** |
| 21 | Explicit mobile posture (app or stated absence) | Lovable, Base44, Replit, v0 | **Unknown** |

### 5.2 Emerging patterns — the next 12 months

- **Agent visual self-QA.** v0 posts its own desktop and mobile screenshots into chat; Replit renders the agent's cursor clicking through your app inside the Agent pane. This is the most legible generation state anyone has shipped, and it converts dead waiting into trust.
- **Staged, credit-free direct manipulation.** Figma Make (30 Jul 2026): edits "stage every edit in the prompt box so you can review each change before you commit to it", accumulating "staged and credit-free, until you apply them". One Apply, one credit spend, one version.
- **Design system as a portable, verified artefact.** v0 (skills + `v0.json` + human approval pause + refusal to use unverified components), Lovable (versioned Enterprise projects emitting `.lovable/design-system.json`), Bolt (design system → browsable Storybook), Base44 (brand description → generated system including tone of voice and core values).
- **The infinite canvas of live page frames.** Base44's Canvas and Replit Agent 4's Design Canvas converged independently.
- **Annotation on the running artefact.** Figma Make's numbered blue callouts carrying intent ("make this section feel calmer") and now motion ("fade this button in after a 300ms delay"); Google AI Studio's draw-on-your-app preview.
- **Hiding model choice.** Lovable published "The model picker is a dead end" on 11 Aug 2026; Bolt names agents by outcome ("Standard" / "Max"); Replit exposes a cost dial (Lite/Economy/Power + Turbo). Base44 goes the other way with a seven-model picker gated at $40/mo — and shipped its own **Base 1** model on 29 Jun 2026, the first in-house LLM in the category.
- **GEO/AEO as a first-class surface.** Base44's "SEO & GEO" dashboard tab optimises for ChatGPT and Gemini, not just Google. GoDaddy names AEO explicitly.
- **MCP distribution into other people's assistants.** GoDaddy shipped domain search into Claude on 14 Feb 2026.
- **Second and third artefact classes.** Bolt Slides (Jul 2026, with presenter mode and password gating); Replit's ten-type carousel (Web, Mobile, Slides, Animation, Design, Data Viz, Automation, 3D Game, Document, Spreadsheet).
- **Post-launch as a scheduled agent job.** Lovable's Project Monitoring (Beta, Pro+): daily/weekly, "Every time" / "If edited since last check", surfacing "View issues" above the chat with Try to fix / Skip / Ignore. It detects but never auto-fixes.

---

## 6. Where Remixer stands today

Honest, dimension by dimension. Evidence in the right column.

| Dimension | Position | Evidence |
|---|---|---|
| **Time to first render** | **Ahead** | 2–3 min (verified ground truth) vs v0 6m21s (measured), Bolt ~5 min (documented), Base44 3–5, Wix Harmony 4–7, Emergent ~10, Hostinger ~5 |
| **No-card trial length** | **Ahead** | 30 days, no card — the longest in the category. But everyone else runs *perpetual* free, so this is a differentiated shape, not an unambiguous win |
| **Cheapest paid entry including hosting+CDN+SSL+domain connect** | **Ahead** | $9.99/mo annual. Ties GoDaddy Starter; beaten only by Hostinger Explorer $6.99 (which caps at 30 credits). Lovable Pro is $25, v0 Plus $30/user |
| **Credit balance visibility** | **Ahead** | Persistent chip in the top toolbar. GoDaddy exiles it to a separate page (their loudest complaint); Base44 hides it behind the logo; Bolt behind Profile → Subscription |
| **Domain control in primary chrome** | **Ahead** | Centred domain switcher in the top bar. **No competitor puts the live address in permanent chrome** — because for them attaching a domain is a multi-hour, may-fail operation |
| **Published top-up packs with visible prices** | **Ahead** | +1,000 = $14.99, +2,500 = $34.99. GoDaddy publishes none; v0 has no packs; Base44's own sources contradict each other |
| **Structural stack (registrar + host + email + CDN)** | **Ahead, unexploited** | SmartEdge 10 PoPs first-party; DreamHost mail platform; registry records. Zero of this is surfaced in the builder |
| **Shell skeleton** | **Level** | Left chat / centre canvas / right rail is category-standard, and Replit converged onto a pinned Tools pane on 31 Jul 2026 — validating the rail bet |
| **Dark-theme consistency entry→product** | **Level/Ahead** | We hold #18181B throughout; GoDaddy breaks identity at the door (dark entry → light builder) |
| **Staging subdomain** | **Level** | Editable `*.remixer.app` with a pencil affordance. Base44 buries the rename in Dashboard → Domains → "Edit URL"; v0's sandbox host is an opaque 24-char `*.v0.build` |
| **In-account domain attach** | **Level (potential: far ahead)** | We can do zero-DNS for domains already in the account. So can GoDaddy for GoDaddy-nameserver domains. **Neither of us has built the in-builder purchase step** |
| **External domain DNS** | **Behind** | No Domain Connect (verified Aug 2026). Category-standard today (Bolt, Base44, Figma, GoDaddy-external all manual) but Lovable and Replit both bought Entri |
| **Publishing economics** | **Behind — worst in field** | Credits consumed by publishing changes (verified ground truth). Lovable, GoDaddy, Bolt, Base44, Hostinger, Figma Make, Replit all exempt it. Only Emergent charges for the live state |
| **Anti-generic generation** | **Behind** | No documented mechanism. Lovable ships 3 directions, Base44 4, AI Studio 5 free, v0 declares a named direction and writes tokens first |
| **Agent loop legibility** | **Behind** | No plan mode, no per-message cost receipt, no manipulable queue, no subagent visibility, no self-QA loop |
| **Blast-radius control** | **Behind** | No lock/freeze/target. Bolt and Base44 both ship it |
| **Design system maturity** | **Behind** | One shell hex is not a system. No published elevation ladder, radius scale, shadow ramp, spacing grid or easing set (verified from our own brief, which lists only #18181B, #1587FF, green, amber) |
| **Visual identity** | **Behind** | Inter + indigo→purple gradient + cool near-black = three of the four documented AI-slop tells. #1587FF sits 3 points from Bolt's #1488FC |
| **Email in the builder** | **Behind — 0 shipped** | We *are* a mail provider. There is currently no mailbox surface in the publish flow. Hostinger already monetises this (0/1/2/5 by tier) |
| **Free-tier / trial cliff** | **Behind** | No daily grant, no perpetual floor. On day 31 an unconverted trialist has no return path |
| **Post-launch** | **Unknown** | We have activity logs and a first-party CDN; nothing in the dossiers or brief says they surface in the builder |

---

## 7. The catch-up list

Ordered by impact ÷ effort. Everything here is table stakes someone else already ships.

### Tier 1 — do these first (high impact, low-to-medium effort)

| # | Item | Spec sketch | Effort |
|---|---|---|---|
| **1** | **Stop charging credits to publish** | Remove consumption from publish/republish. Publish sheet line: *"Publishing is free. Credits are only used when Remixer builds or edits."* Pricing page bullet beneath $9.99. | Medium |
| **2** | **"Always free" panel in the credits chip popover** | Three sections: balance + reset date; a green-tick checklist (Publishing and republishing · Hosting, SSL and CDN · Visual Editor edits · Restoring a version · Connecting a domain · Fixing Remixer's own errors); a two-column per-action cost table (New page ~40 · Chat edit ~10 · Full generation ~120 · Plan message 1). | Low |
| **3** | **Three consistent deploy signals** | (a) 6 px amber dot on Publish when the build is newer than live; (b) status pill beside the centred domain switcher — green "Live" / amber "4 changes not published" / indigo "Not connected"; (c) snapshot copy in the sheet. All derived from one state value. | Low |
| **4** | **Carry the landing prompt through DreamHost SSO** | POST to a signed short-lived draft, route to SSO with `?draft=<id>`, land in the builder with generation already running and the user's words rendered as the first chat message. Instrument `composer_submit → auth_complete → generation_start`. | Medium |
| **5** | **Generation choreography** | Past-tense semantic step rows at 13 px secondary with a 16 px glyph; next three queued steps pre-dimmed at 45% with a 1.6 s shimmer; at least two rows naming design decisions in plain language ("Set your palette — espresso, cream, amber"); completion badge **"Built in 2m 41s"**; canvas assembles live, never empty. | Medium |
| **6** | **Per-message cost receipt** | `···` menu on each completed response: "Cost: 12 credits · 41s", Copy, Revert to here. Hover shows the basis ("4 files changed · 1 image generated"). Plain secondary text, not a warning colour. | Low |
| **7** | **Manipulable message queue above the composer** | Rows with drag handle, one-line truncated prompt, edit / ×. Header "Queued — will run in order" with "Pause queue". Cap at 7. | Low |
| **8** | **State the spend order** | One line under the balance: *"We spend the credits closest to expiring first — free and bonus credits before ones you paid for."* Critical because of our 1,000 first-month bonus. | Low |
| **9** | **Restore never auto-publishes** | Confirmation: *"Restored. Your live site hasn't changed — select Publish to make this version live."* Keep the green "Live" chip on the previously published version. Inline amber note on data: *"Restoring your site does not restore your data."* | Low |
| **10** | **Post-publish success state** | Live URL as a copy chip + exactly two buttons: "Visit site" (primary), "View analytics" (secondary). One short completion chime, behind a preference and suppressed under `prefers-reduced-motion`. | Low |

### Tier 2 — high impact, higher effort

| # | Item | Why it matters |
|---|---|---|
| **11** | **Plan mode** — composer pill, flat 1 credit, ⌥P / ⌘. toggle working mid-typing, editable plan document with strikethrough diff, terminal button "Build this plan" that flips the mode | Three of five majors ship it and price it below build. It is the cheapest possible undo and a real credit-anxiety reducer |
| **12** | **Free direct-manipulation lane** with a green "Free" chip and automatic escalation ("This needs the AI — about 8 credits") | Base44, Replit, Lovable, GoDaddy and Figma Make all draw the boundary at "does this need the model" |
| **13** | **Per-turn Revert + version history with preview** — Revert icon on every AI message, clock icon opening History with a Bookmarks tab and a green "Live" chip, disabled tooltip "Can't revert this far back" | Maps undo onto the unit users actually think in |
| **14** | **Free error recovery** — "Fix this — free" on every error card, with the subline "Fixes for Remixer's own errors don't use credits" | The single most effective antidote to credit resentment; Lovable's most-praised decision |
| **15** | **Blast-radius controls** — right-click a page/file → "Guide the AI's focus" → "Focus AI here" (composer chip) / "Lock page" / "Lock all", with an amber padlock in the page dropdown and chat copy "Skipped Pricing — it's locked. Unlock it?" | Answers three complaints with one context menu; also the fix for visual edits being overwritten |
| **16** | **Design directions before the build** (or the cheaper post-build variant) — three named cards with live thumbnail, font pairing in words, three hex swatches, "Build this one"; **0 credits**; skipped for app-shaped prompts | The differentiating wow mechanism now that speed is ours |
| **17** | **One-click external DNS** — provider detection → "We can set this up for you at Namecheap. You'll sign in to Namecheap — Remixer never sees your password." Manual records collapsed behind "Prefer to do it yourself? Show the records" | Replit closed this without being a registrar. Buy Entri rather than build |
| **18** | **Domain state machine** — Pending / Provisioning DNS / Issuing SSL certificate / Live / Ready / Needs attention / Offline, one verb per non-green state, plus three detected-condition triage cards (Cloudflare proxying, AAAA on @, conflicting CAA) | Lovable's is why DNS doesn't lose them users |
| **19** | **Preview link for unpublished changes** — signed `*.remixer.app` URL, 7-day expiry, view-only, slim banner "Preview — this is not the live site" | Base44's Testing Link is the strongest staging primitive in the field |
| **20** | **Daily credit grant + a floor after day 30** — second chip "+30 today · resets 3am PT"; on day 31 drop to the daily grant rather than going dark | Every leader runs this loop; we run none |

### Tier 3 — worth doing, lower urgency

⌘K command palette · resizable/persisted/collapsible chat panel with ⌘B · single-icon `</>` code disclosure with a one-line reassurance strip · searchable page switcher plus "Files on this page" reverse lookup · publish pre-flight checklist with a four-level icon language (including a **web-font availability check**, stolen from Figma Make) · multi-domain with one primary and **301 by default** · "Live preview" off-switch showing the last completed build · Board mode (infinite canvas of live page frames) with an orphan-page detector.

---

## 8. The overtake list

Five plays. Each requires being the registrar **and** the host **and** the mail provider. That combination exists nowhere else in this field.

### 8.1 Zero-record go-live — "Your domain is already here."

**What it is.** At first publish, query the signed-in DreamHost account for domains the user already owns that aren't serving a site. Surface the best candidate at the top of the publish sheet, above the staging URL:

```
┌────────────────────────────────────────────────────┐
│  ● emberandoak.com   is in your DreamHost account  │
│    [ 0 records to change ]        [ Connect and    │
│                                     publish ]      │
└────────────────────────────────────────────────────┘
```

On click: write records server-side, provision the certificate, resolve to Live — target under 60 seconds, with the state machine visibly stepping "Provisioning DNS" → "Issuing SSL certificate" → "Live". **Never show a record table. Never ask the user to open another tab. Never mention nameservers.** If the domain currently serves something, show "currently: WordPress" and require one confirmation: *"Replace what's at emberandoak.com with this site?"*

**Why nobody can copy it.** Lovable, Vercel, Bolt, Base44, Emergent and Replit are all registrars or resellers now — but each can only automate the domain it sells you *today*. None is the registrar of record for the domain you bought three years ago and parked. For those they fall back to Entri or a copy-paste table. GoDaddy is the one company that structurally could and instead ejects you to the storefront and back through six steps.

**Our advantage.** DreamHost holds a large book of registered, unused domains. That is a targetable list, not a funnel. And it reframes the trial: instead of "publishing to a custom domain is paid", the pitch becomes *"the domain you're already paying us for goes live in a minute."*

### 8.2 A real mailbox in the publish flow

**What it is.** Immediately after a custom domain goes Live, the success state offers one card:

> **Get hello@emberandoak.com**
> `[ hello ]@emberandoak.com`  **[ Create mailbox ]**
> 25 GB, webmail, spam filtering. Included with your plan. We'll set the MX records for you.

On click, provision the mailbox and write **MX, SPF, DKIM and DMARC in the same transaction that already wrote the A record** — so alignment is correct by construction rather than by user effort. Then wire it into the build narrative: when the agent generates a contact form, the step row reads "Created contact form → delivers to hello@emberandoak.com". If a project has a form and no mailbox, the rail item carries an amber dot — the only amber in the rail — because that is a genuinely broken loop.

**Why nobody can copy it.** You have to operate a mail platform. Lovable built its own outbound delivery with auto-managed SPF/DKIM/DMARC and 50,000 messages/month included — and its docs still state it does not provide mailboxes, because inbound is a different, much heavier business. Base44: *"Custom email domains are for sending only"*, sender `no-reply@base44-apps.com` via SendGrid, and built-in email cannot reach an address that isn't a registered app user — so a contact form emailing the owner's Gmail is not a first-class path. Bolt's entire domains doc set never mentions a mailbox. v0 has no email at any tier. GoDaddy has mailboxes but **resells** Microsoft 365 at $7.99/mo, and its own comparison table concedes "Professional email: Yes — Purchase required." Hostinger bundles mailboxes but ladders them 0/1/2/5 as paid inventory.

**Our advantage.** DreamHost runs its own mail platform, so one mailbox is a provisioning call costing cents, not a reseller margin to recover. Bundle **one mailbox per published custom domain into the $9.99 Build plan** and say so on the pricing card. It changes the plan's story from "AI credits" to "your business online" — a defensible position when the credit race bottoms out.

### 8.3 Roll back the launch, not just the build

**What it is.** A "Live" tab beside History. Each row is one publish: timestamp, version label, a one-line change summary, and badges where relevant ("domain connected", "DNS changed", "SSL issued"). Every row carries **"Roll back live site"** — which restores the deployed snapshot, purges SmartEdge across all 10 PoPs, and, when that publish altered the domain or its records, offers a second checkbox: *"☑ Also restore DNS records (3 changes)"* with the records listed inline. Confirmation: *"Visitors will see the previous version within about 30 seconds."*

**Why nobody can copy it.** Restoring a build is easy; restoring the *route* to it requires holding the zone. Lovable's entire domain surface is a state machine of Verifying/Stalled/Offline/Removed with recovery verbs, not a revertible history. GoDaddy's restore paths are DNS-unaware. Base44 hands DNS debugging to whatsmydns.net.

**Our advantage.** Registrar + host + CDN in one account means "the site my customer sees" is a single revertible object spanning build, edge cache and zone file.

### 8.4 A branch that is actually safe — forked data and a quarantined mailbox

**What it is.** "Try it safely" forks the project onto `branch-name.yourproject.remixer.app`, copies the schema plus a sampled row subset, and **routes all outbound mail from the branch to a quarantine inbox at `branch@yourdomain`** — so testing a contact form, an order confirmation or a password reset never reaches a real customer. Persistent amber strip: *"Sandbox — separate data, emails go to branch@yourdomain, not to customers."* Merging opens a three-group diff: **Code changes · Schema changes · Data changes**, with the button reading "Merge to live — 4 code changes, 1 new table, 0 data changes".

**Why nobody can copy it.** Base44 shipped branches in Aug 2026 and had to cripple them — no publishing, secrets, connectors, workflows, code editor, theme settings or version-history restore, **and they share live production data** — precisely because it cannot isolate runtime side effects. Sandboxing outbound mail requires being the mail provider.

**Our advantage.** A per-branch catch-all mailbox is a provisioning call, not a product to buy. It turns the most dangerous class of AI-builder mistake — the agent rewriting a notification and silently emailing real customers — into a non-event, and makes "try it safely" a true statement.

### 8.5 Production-grounded telemetry — warn before the site breaks

**What it is.** A "Site health" panel in the right rail with four rows only a registrar + host + DNS + mail operator can compute:

| Row | Example content | Action |
|---|---|---|
| Domain expiry | "emberandoak.com renews in 41 days · Auto-renew on" | Renew (amber under 30 days) |
| Certificate | "SSL valid until 12 Nov · renews automatically" | — |
| DNS drift | "Your A record changed outside Remixer on 9 Aug — now points to 203.0.113.4" | **Restore the record** |
| Mail health | "SPF, DKIM and DMARC aligned" / amber "DMARC missing — some mail may be filtered" | **Fix** |

Plus unprompted error cards sourced from real origin logs: *"Your live site returned 12 errors in the last hour"* with "Show me" expanding actual log lines and "Fix it — free". And for mail: *"3 form submissions didn't reach hello@emberandoak.com"* with the plain-language reason.

**Why nobody can copy it.** None of them runs the origin. Bolt sends users to the browser console and admits its analytics count bots. GoDaddy rents Cloudflare. v0 hands off with "Inspect on Vercel". Lovable's Project Monitoring is a scheduled agent job inspecting the *project*, not a reader of live server logs, and "it detects but never auto-fixes."

**Our advantage.** DreamHost already ingests HTTP access/error and postfix/dovecot logs into a queryable pipeline for support, and SmartEdge is first-party, so we can report real human latency per PoP rather than bot-inflated numbers. This converts post-launch — where the whole field is thin — into our strongest chapter, and makes the $9.99 subscription keep being worth paying after launch.

---

## 9. Design-craft rules for Remixer's own interface

Numeric, concrete, extracted from the leaders. Adopt as a system, not a mood board.

### 9.1 Surfaces — publish a six-step warm dark ladder, retire the single hex

Replace `#18181B` with six OKLCH surface tokens ~2.5% lightness apart, **rotated warm** (hue 60–80, chroma ≤ 0.004) rather than our current cool-leaning near-black (R24 G24 B27).

| Token | Lightness | Role |
|---|---|---|
| `--surface-depth` | ~20.5% | App ground behind panels |
| `--surface-base` | ~23% | Canvas gutter |
| `--surface-primary` | ~24.7% | Left chat panel, right icon rail |
| `--surface-secondary` | ~27.2% | Message bubbles, cards, credits chip |
| `--surface-tertiary` | ~30% | Hovered rows, inputs, domain switcher |
| `--surface-quaternary` | ~32.8% | Popovers, menus, publish sheet |

**Rule: no raw hex in components.** Every background resolves to one of the six. When a light theme lands, keep the same six roles and change only the values — Lovable's hue-constant approach means only the neutral ramp moves between themes.

### 9.2 Type — two rhythms, exact tracking, no drift

Interim (no licensing decision required): use a display optical cut for headings only, lock display line-height to 1.0–1.1 and tracking to exactly **−0.04em at every size**, hold body at 16/24.

| Role | Size | Line-height | Tracking | Weight |
|---|---|---|---|---|
| Display XL | 48 px | 52.8 px (1.10) | −1.92 px | 600 |
| Display L | 36 px | 39.6 px (1.10) | −1.44 px | 600 |
| Display M | 28 px | 30.8 px (1.10) | −1.12 px | 600 |
| Body | 16 px | 24 px (1.5) | 0 | 400 |
| Secondary body / UI | 14 px | 24 px | 0 | 400 |
| Micro / meta | 12 px | 16 px | 0 | 500 |
| Group label | 11 px | 16 px | +0.06em, uppercase | 600 |

**Target state: get Inter out of the chrome.** Four of five majors run a proprietary or semi-proprietary face; the one that doesn't (Bolt) reads cheapest. Where a variable face is available, use non-integer weights (480 for the credits balance and price strings, per Lovable).

### 9.3 Colour discipline

- **Accent blue `#1587FF` = action only.** Buttons, links, focus. It currently sits three points from Bolt's `#1488FC` — either shift hue enough to be distinguishable in a side-by-side screenshot, or accept the category blue and differentiate entirely on type, warmth and elevation. Make this an explicit decision, not a drift.
- **Indigo/purple = AI, on exactly five surfaces.** The AI sparkle glyph; the chat composer send button; the AI-mode chip; the generating sweep; the landing composer halo. **Forbidden:** purple gradients as section/hero backgrounds, purple card borders, purple headings, purple on any non-AI CTA. Move our purple ≥12° of hue off the Tailwind indigo axis.
- **Green = live. Amber = action needed.** Do not spend either on anything else. Amber's highest-value use is the stale-publish dot and the domain "Needs attention" state.
- **Add a `metered` intent** (Base44's "premium" idea): `--intent-metered-fill-{primary,secondary,light,ghost}` × `{default,hover,active,disabled}`, `--intent-metered-border-*`, `--focus-ring-metered` (3 px at 12% alpha), one `--gradient-metered`. Derive from amber, not gold. Bind every commercial surface to it: credits chip, top-up button, trial badge, low-credit nudge, publish gate. **No control may receive a bespoke upgrade treatment outside this intent.**
- **Encode hover and pressed as alpha tokens**, per semantic: `--glow-{semantic}-hover` at 8%, `-pressed` at 16% (neutral uses white at 4%/8% on dark). Consistency of interaction weight is a large share of the "expensive" feel.

### 9.4 Radius

| Value | Use |
|---|---|
| 6 px | Small chips, tags, badges |
| 8 px | Buttons, inputs, standard controls |
| 10–12 px | Cards, panels, message bubbles |
| 16 px | Large surfaces, dialogs |
| 28 px | The composer only |
| 9999px | Pills, icon buttons, **AI-facing controls** (borrow Bolt's rule: chrome is rectilinear, agent actions are capsules) |

### 9.5 Shadow — ban single-value shadows

Six-step surface ramp: hairline ring plus geometrically doubling offsets — `1px/1px`, `3px/3px −1.5px`, `6px/6px −3px`, `12px/12px −6px`, `24px/24px −12px` — **every layer at 4% black, warm-tinted (`#1C1A18`), never pure `#000`, never 10%.**

Buttons get a separate bevel recipe: `inset 0 1px 0 0 rgba(255,255,255,.10)` + `inset 0 -1px 0 0 rgba(0,0,0,.30)`, with the top-highlight alpha raised to `.16` on the blue Publish button so it reads as primary. One specular trick for glass: `--shadow-glass-top: inset 0 1px 0 rgba(255,255,255,.08)`.

### 9.6 Motion

| Token | Duration | Curve | Applied to |
|---|---|---|---|
| `--dur-fast` | 120 ms | `cubic-bezier(0.2,0,0,1)` | colour, opacity, focus ring |
| `--dur-base` | 200 ms | `cubic-bezier(0.2,0,0,1)` | transform, panel/menu open, device switch |
| `--dur-slow` | 300 ms | `cubic-bezier(0.4,0,0.2,1)` | overlays, modals, canvas transitions |

**Rules:** no springs, no overshoot in the shell. Always enumerate transitioned properties — never `transition: all`. Scroll reveal on marketing is **one gesture**: `opacity 0→1` + `translateY(12px)`, IntersectionObserver-gated, never scroll-linked, never a scale or blur. Honour `prefers-reduced-motion` by dropping transform and keeping opacity — in the builder *and* in generated output.

The philosophical fork: Lovable's branded waiting (~39 keyframes) and Vercel's stated opposite ("Default to stillness. Never add auto-scrolling marquees, simulated typing cursors, or decorative pulsing status indicators") both read premium. **What never reads premium is the middle: unmotivated motion.** Enforce the rule that every animation must name the state it explains, or it gets cut.

### 9.7 Loading choreography

- Replace any indeterminate spinner on the canvas with a branded five-stop sweep in our blue: `linear-gradient(90deg, transparent 0%, #1587FF 21.5%, #FFFFFF 33%, #1587FF 65.5%, transparent 100%)` at 1.4 s linear infinite. Skeleton shimmer at `rgba(255,255,255,.06)`.
- Step rows: 13 px secondary, 16 px leading glyph, **past tense when done, present participle while running.** Three queued rows always visible at 45% opacity with a shimmer sweep.
- **At least two rows must name a design decision in plain language.** Not "Generated components" but "Chose a warm editorial direction" and "Paired Fraunces with Inter". This gives non-designers vocabulary for the next instruction.
- Completion badge: **"Built in 2m 41s"**. Against v0's printed 6m21s this is a competitive statement.
- Canvas assembles live, section by section. Never an empty pane.

### 9.8 Empty states — never a blank panel

| Surface | Content |
|---|---|
| Canvas before first generation | Logomark at 15% opacity + one 15 px secondary line: *"Your site will appear here as Remixer builds it."* |
| Panel loading | Centred 32 px pill, 999px radius, `--surface-tertiary`, 14 px spinner + *"Syncing project files…"* |
| Rail panel with nothing selected | Three shortcuts as rendered keycap chips: Command palette ⌘K · Toggle chat ⌘B · Publish ⇧⌘P |
| Rail item with no data yet | 6 px `--surface-quaternary` dot beside the label — absence reads as "not set up yet", not "broken" |

### 9.9 Density and layout

- Chat panel 408 px default, min 360, max 720, drag-resizable with a 4 px invisible hit-target revealing a 2 px `#1587FF`/50 bar on hover. **Width persists per user.** Double-click resets. Full drag-left collapses to a 48 px stub. ⌘B toggles — and must mean the same thing on the dashboard.
- Right rail 56 px collapsed / 240 px expanded, toggled by a persistent chevron and ⌥\. **Every icon carries an `aria-label` and a tooltip on a 200 ms delay** (v0 ships an entire toolbar with `aria-label` and `title` both null — do not repeat this).
- Group the rail by lifecycle, with 11 px/600 uppercase labels at +0.06em in the expanded state: **BUILD** (Pages, Media) · **DATA** (Database, Forms, Accounts, File uploads) · **MONEY** (Payments, Shipping) · **SHIP** (Domains, Email, Analytics, Activity logs) · **KEYS** (API keys, Settings).
- 4 px spacing grid throughout: 2/4/6/8/12/16/20/24/32/40/48/64.
- Named z-index ladder: base 0, dropdown 1000, sticky 1020, banner 1030, overlay 1040, modal 1050, popover 1060, toast 1070, tooltip 1080.

### 9.10 The AI-slop tells to design against

| Tell | Our current exposure | Fix |
|---|---|---|
| Inter as UI typeface | **Named in our spec** | Display optical cut + −0.04em now; proprietary face later |
| Indigo→purple gradient | **Named in our spec** | Reserve to five AI surfaces; ban as background; shift ≥12° off the Tailwind indigo axis |
| Cold slate/zinc surfaces | `#18181B` is blue-leaning | Warm the ladder |
| Single shadow at 10% opacity | Unknown | Six-step ramp at 4%, warm-tinted, plus inset bevels |
| `rounded-2xl shadow-lg p-6` shadcn default card | Unknown | Explicit radius scale by role |
| Three rounded cards in a row | Unknown | Audit marketing and builder for the pattern |
| Thin-line interchangeable icons | Likely (Lucide) | Bespoke 16 px chrome family; keep Lucide for generated output only |
| Gradient wash behind body copy | Unknown | Gradients live below the fold line, never behind type |
| Browser-default easing | Likely | Three durations, two curves, tokenised |

---

## 10. Risks and open questions

### 10.1 Do not quote these in a deck — the fact-check could not verify them

| Claim | Status |
|---|---|
| GoDaddy Airo free-tier sites land on `godaddysites.com` | **Refuted.** Free cannot publish at all; paid Airo projects land on `*.airoapp.ai`. `godaddysites.com` is the legacy Websites+Marketing product |
| Airo's SEO and code-quality scans are free | **Refuted.** Security and QA scans free; **SEO and legal scans cost credits**; repairs always cost |
| Wix domain renewal ≈ $17.35/yr | **Refuted.** ≈ **$13.35/yr**. Wix email is a separate add-on (Google Workspace ≈ $6/user/mo annual), not bundled |
| Firebase Studio was shut down 19 Mar 2026 | **Refuted.** 19 Mar 2026 = sunset *announcement* + migration tools; 22 Jun 2026 = new signups disabled; **22 Mar 2027 = shutdown and data deletion**. It is still running today for existing workspaces. Successors are Google AI Studio **and Google Antigravity**, not AI Studio alone |
| Hostinger Horizons has a 7-day free trial with no payment info | **Unconfirmed.** The pricing page advertises a permanently free plan with no card, plus a 30-day money-back guarantee |
| Figma "~15,000 credits for ~$350" | **Not among the listed packages** (5,000/$120, 7,500/$180, 10,000/$240) |
| Base44 runtime ceilings: 150 ops/min, 5,000-item request cap, 3-min automation cutoff, 5-min function limit, 50 functions max, no self-serve backups/SQL/indexing | **Unverifiable.** Single adversarial source which itself concedes the 150 ops/min figure "isn't documented anywhere" |
| GoDaddy Airo has no keyboard shortcuts or command palette | **Unverifiable.** Primary docs returned HTTP 403; only support is a review of a sibling product |
| GoDaddy Airo has no inline diffs, file chips or per-message revert | **Unverifiable.** Same 403s |
| GoDaddy Airo radii are bimodal (full-pill AI / 8–12 px chrome); entry-screen hex values | **Unverifiable.** Estimated from a single marketing screenshot |
| GoDaddy Airo's builder is desktop-only as an authoring surface | **Unverifiable.** The quoted strings could not be confirmed |
| Bolt Trustpilot 1.4/5; Emergent ~2.7/5; Bolt hidden Pro tier token counts (Pro 50 = 26 M etc.); Bolt's upstream registrar being Name.com; Bolt reload SKU prices | Single-source / medium confidence |
| Rocket.new, Tempo and Softr pricing | Could not be reached; unverified |
| Lovable's chat panel pixel width; Lovable's in-app domain registration prices | Behind auth / not published. Do not quote a figure |

### 10.2 Open questions we must answer internally before committing

**Funnel and product**
1. Does a prompt typed on dreamhost.com/remixer survive DreamHost SSO and start generating on arrival, or does the user land in the panel and retype? Measure `composer_submit → generation_start`. This is the largest unquantified leak in the audit.
2. What is our real p50 and p90 time-to-first-render in production, not the marketing 2–3 minutes? If p90 is 5 minutes we are level with Bolt and the speed claim stops being a weapon.
3. What is actually in the right icon rail today — exact items, order, and whether each has an accessible name? The lifecycle grouping cannot be specced further without an inventory.
4. Do we have any versioning today, at what granularity, and does restoring auto-publish?
5. Where does the Visual Editor write, and can a later chat turn silently overwrite manual visual edits? If we share Lovable's architecture, the free-edit lane and the lock mechanism must ship together or the free lane makes the problem worse.
6. What is our page-count / file-count ceiling, and where does the builder degrade? Base44 publishes 600.

**Money**
7. What does one Remixer credit buy? "1,000 credits" is not comparable to Lovable's 100 or GoDaddy's 150 and users cannot reason about it. Publish a per-action table.
8. Do credits roll over, and do they expire? Our brief does not say. This is the single largest rage generator in the category and we have no documented position.
9. What is our spend order, given the 1,000 first-month bonus? Users must be told which pool drains first.
10. What is the actual credit cost of a publish, and what share of monthly consumption does publishing represent? Needed to size the revenue impact of making it free — and is the charge flat, or does it re-run generation work (which makes it an engineering fix, not a billing one)?
11. Why is the top-up ladder priced at a **50% premium** over the annual included rate ($0.015/credit vs $0.00999), with only a **6.6%** volume discount between the 1,000 and 2,500 packs? Lovable's premium is ~20%. A weak curve punishes exactly the heavy users we want to keep.
12. What survives a zero balance — pages, forms, database writes, auth, Stripe, email? If everything stays up, that is a headline claim Lovable (which pauses backend services) and Base44 (whose end users drain the pool) cannot make.
13. Is the 30-day no-card trial converting better than a perpetual free tier with a daily grant would? Get the day-31 return rate before deciding.

**Infrastructure**
14. Domain Connect: build or buy? Entri is ~$249/mo for 600 connections a year (unverified). Also: should we become a Domain Connect **provider** so third-party apps can attach to DreamHost domains in one click — turning our registrar base into an acquisition surface?
15. What is our actual split at publish time between (a) domains already in the DreamHost account, (b) domains the user wants to buy now, (c) external registrar? This determines whether the zero-record flow or Entri is urgent.
16. Can the mail API provision a mailbox and write MX/SPF/DKIM/DMARC **transactionally** alongside the A record? That answer decides whether Email is a button in the rail or a link out — and a link out puts us level with GoDaddy rather than ahead.
17. Can a mailbox be included in the $9.99 plan without cannibalising DreamHost email revenue, or does it need to be one included plus paid additions (Hostinger's ladder)?
18. Can we quarantine outbound mail per branch without damaging the customer domain's sending reputation?
19. How fast can SmartEdge purge across all 10 PoPs? The rollback confirmation copy needs a real number.
20. Do our terms permit reading a customer's own hosted public pages to pre-write a rebuild brief, and what consent string does legal require in-flow?

**Design**
21. Can we license or commission a non-Inter UI face? What are cost and lead time, and how widely are Gilroy and Proxima Nova already deployed?
22. Does Remixer's generated **output** have a motion system, or only the chrome? Figma Make now accepts motion as an annotation, which implies generated sites are expected to ship hover, press and reveal behaviour.
23. Is dark-only permanent? Our users' sites are overwhelmingly light — does previewing a light site inside a dark shell cost design accuracy?
24. Do we move `#1587FF` off Bolt's `#1488FC`?
25. Is `prefers-reduced-motion` honoured in the builder **and** in generated output?
26. Who arbitrates when the agent's chosen aesthetic conflicts with a saved design system — do we need a lock or protected-token mechanism before shipping one at all?
27. Do we have a canonical string registry for UI labels? GoDaddy's shell has the same control named two ways across its own docs. We will drift the same way as the rail grows.

---

### Closing note

The category's centre of gravity has moved from "can it generate a good site" to "does the loop after generation respect the user's money, time and work." Lovable wins today because it answered that question as one system rather than as a feature list. v0 wins the funnel. Base44 wins the tokens and the scale. Bolt wins disclosure. GoDaddy wins the entry screen and loses everything after it.

Remixer arrives with the fastest generation in the field, the longest no-card trial, the cheapest paid entry that includes real hosting, and the only three-way structural position — registrar, host, mail provider — in the category. Two of those advantages are already eroding. The third has not been shipped at all.

The order of work is not ambiguous: **unmeter the finish line, then own the sixty seconds around it, then stop looking like the thing we generate.**