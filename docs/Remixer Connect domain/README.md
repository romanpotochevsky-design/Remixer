# Remixer · Connect domain

Everything about domains: finding a name, buying one, connecting one you already own,
transferring, and the states a domain moves through until the site answers on it.

**This file is written to be the first thing a new session reads.** It is a restart brief,
not a summary — enough to pick the work up cold, without re-deriving decisions or
re-litigating settled arguments.

> The Publish panel has its own folder — `docs/Remixer Publish/`. The two touch
> constantly, because a domain reports its progress inside the panel. The dividing rule
> is **the surface owns the doc**: how the panel looks and behaves lives there; how a
> customer gets, attaches or moves a domain lives here. Where they meet, each side links
> to the other.

---

## 1. Where the work actually is

| | |
|---|---|
| Live prototype | https://claude.ai/code/artifact/3a24a501-7176-4bf4-8e99-cbb56b7ba1a9 |
| Figma · hi-fi boards | page **"🔗 Connect Domain"** `23484:69717` |
| Figma · flow map | page **"🧭 Domain flows · 2 цепочки целиком"** `28247:3810` |
| Figma · lo-fi reasoning | page **"Domain Connection Flow"** `23191:3719` |
| Figma · archive | page **"🗄 Domain flow · Archive (pre-research)"** `28231:3810` |
| Code | `prototype/src/modules/domains/`, `prototype/src/modules/panel/`, `prototype/src/state/externalSetup.ts` |
| Branch | `claude/remixer-connect-domain-awdg3f` |

### The files in this folder

- `boards/board-status.md` — an audit of all 39 Figma domain boards with a verdict on each:
  what the research retired, what still stands, what was re-filed to the archive. Read this
  before trusting any board.
- `boards/flows-end-to-end.md` — both flows link by link, each marked drawn / missing /
  wrong, plus the DreamHost mechanics table that decides their shape.
- `boards/design-handoff.md` — the original handoff for the domain flow and publish panel.
- `research/domain-search-research.md` — the deep research (5 agents, 433 queries): DreamHost
  facts, how search works at 10 competitors, AI suggestions, "my own domain", technical
  detection (RDAP, PSL, Domain Connect probing).
- `panel-cart/measured.md` — measurements of the real hosting-panel cart, taken from a saved
  page. Every value in `panel-cart.css` is annotated with its source class.
- `panel-cart/reference-request.md` — how to copy a screen that lives behind a login, and why
  the first attempt failed.
- `frames/` — screenshots of every step of both chains, taken from the running prototype,
  with a table mapping each file to its step.

---

## 2. The two chains, as built

Both are walkable end to end in the prototype. Open the console (the handle above the
support bubble, or ⌘.) to jump straight to any state.

### Buying a new domain
search → results → confirm sheet (first year + honest renewal + spelling guard) →
**hosting-panel cart** → back in the builder: `registering` (≤15 min) → `propagating`
(24–72 h) → `verifying` → `live`. Branches: `icann-hold`, `unreachable`.

### Connecting a domain held elsewhere
type the full address → **taken** (registrar named, "This is my domain") → confirm sheet
("stays at GoDaddy, email untouched", CTA **"Show me what to change"**) → **the two-lines
sheet** → we keep checking → `verifying` → `live`.

The second chain's sheet is the one place in the product where the customer must do work we
cannot do for them, because DreamHost supports Domain Connect in no role.

---

## 3. Decisions that are settled — do not re-open without a reason

**Vocabulary.** Add = buy · Connect = attach one you own · Publish/Update = republish.
A taken domain offers **"This is my domain"**, never "You own this": nothing in a registry
lookup says the searcher is the registrant.

**No jargon in our prose** — no DNS, nameserver, A record or SSL certificate on primary
paths. But the *values* on the two-lines sheet are exact (`A`, `@`, the IP), because the
customer is retyping them into a form we do not control. Prose is ours; data is theirs.

**Price before the cart, renewal never hidden.** Every row carries both figures.

**No "Make an offer", ever** — DreamHost has no brokerage and sells no premium domains.

**One intent, one surface.** Owning a domain always opens the confirm sheet, whether the
customer clicked a Connect button or typed the name. It used to depend on which they did.

**The panel opens only when there is an action left.** Connecting a domain we already host
finishes in seconds, so it gets a toast and an amber→green dot in the topbar — no panel, no
status page.

**The address field never shows a domain that does not resolve.** Until it answers, the
field shows staging. `domainResolves()` is the single predicate every surface reads.

**Progress on the external setup is per line, not a boolean.** Paste one line, close the
tab, come back tomorrow — the other is still waiting. The checker lives in a module, not a
component, so "we keep checking, you can close this" is true rather than decorative.
Nothing is ever found until the customer has done something that could plausibly have
started the work.

**The status page is gone.** A domain reports itself in the Publish panel's row (㉘ A3).
Deleting it removed four states where it lied.

---

## 4. Verified facts — use these, never invent around them

All from DreamHost's own material via `research/domain-search-research.md`.

| fact | value |
|---|---|
| Registration completes after checkout | within **15 minutes** |
| A **new** registration's nameservers | **24–72 hours** to fully update |
| Any nameserver change | 4–72 hours |
| DreamHost nameservers | ns1 / ns2 / ns3 `.dreamhost.com` |
| SSL (Let's Encrypt) | ~10–30 min *after* the domain resolves — never "instantly secured" |
| Registrations refundable? | **No.** Deletion grace ~5 days on some TLDs, none on others, support only |
| Transfer in | $9.99, adds a year, 5–7 business days, ICANN 60-day lock |
| Domain Connect | **supported in no role.** One-click would need Entri (~$249/mo), not bought |
| Premium domains / brokerage | none |
| Prices (verified 06 Aug 2026) | .com $9.99/$19.99 · .net $4.99 · .org $7.99 · .shop $0.99/$34.99 · .online $1.99/$29.95 · .me $2.99/$32.95 · .io $34.99/$59.99 · .ai $89.99 × 2 yr min |
| WHOIS privacy | free, forever |
| Free first-year domain | annual Web Hosting / DreamPress only — **the builder plan does not qualify** |

### Numbers that must NOT ship
- **The ICANN verification deadline.** The rule is real (an unverified registrant email
  suspends the domain, taking the site *and* the mail down) but the "15 days" figure in our
  research traces to Squarespace, not to DreamHost or ICANN. The built copy deliberately
  carries no digit. Someone must read DreamHost's own registrant-verification article.
- **$11.86**, the renewal figure on several boards. It appears in no verified price table.
- Any propagation duration for a *record* edit at a third-party registrar. `propagating` and
  its "up to 72 hours" were measured for a new registration's nameservers, which is a
  different event.

---

## 5. Open questions for the designer

1. **The five registrar DNS links** (`REGISTRAR_DNS` was proposed and not shipped) are
   unverified — this session has no web egress. Nothing renders a deep link today.
2. **No board draws a failure for the external path** — "we checked for an hour and the
   lines still are not there". The interim honest line exists; a real failure face does not.
3. **The staging-address line is hidden** behind `SHOW_STAGING_LINE` in the panel, parked
   until its home is decided. The argument for it is still live: it is what makes a 24–72 h
   wait tolerable.
4. **`Buy` vs `Add`** — the audit's vocabulary says Add = buy, the boards draw `Buy`. Built
   as drawn.
5. **Plan-card heights differ by 8px** in the checkout sheet (72 selected / 80 not). Built
   as drawn, flagged as probably accidental.
6. **The flow-map frames are not embedded in Figma.** They are in `frames/`; drop each PNG
   onto the slot named for it. This session's proxy blocks Figma's asset uploader, the
   plugin API's `createImageAsync` is disabled and it has no `fetch`, so there is no
   automated route from here — and hand-carrying the bytes through a script forces JPEG
   compression on work that should be lossless.

---

## 6. Picking this up in a new session

1. Read `/CLAUDE.md` (project rules, who the designer is, working agreements).
2. Read this file.
3. `git fetch --all` and check whether a parallel session's branch is ahead — sessions run
   in several windows and one branch has already been a superset of another.
4. Open the prototype: `cd prototype && npm install && npm run dev`.
5. For anything about the panel itself, read `docs/Remixer Publish/README.md` next.
