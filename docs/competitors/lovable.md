# Lovable

> lovable.dev · pure AI builder · **the category reference**
> Detail: [`audits/synthesis-q3-2026.md`](audits/synthesis-q3-2026.md) §3 "Lovable, decoded" ·
> [`audits/lovable-builder-teardown.md`](audits/lovable-builder-teardown.md) ·
> [`../features/domains/research/connect.md`](../features/domains/research/connect.md) §5.1
> "Lovable — the reference implementation (8 states)"
>
> Markers on this page: `[status · fact ID · verification date]`, per
> [`README.md`](README.md) → *Confidence discipline*. `no row` = the register has no line for
> this claim yet; design-informing, not quotable.

## What it is

AI app-and-website builder, chat-left / preview-right, sold as a subscription with a credit meter
on top. Pro is **$25/mo** `[verified · CMP-017 · Aug 2026]` **for 100 credits**
`[verified · no row]` — read off the live upgrade modal, which is also the domain paywall. Free is
a demo: read-only code editor, no custom domain, 30 build credits a calendar month
`[verified · no row]`. All plans get **5 daily build credits resetting at 00:00 UTC**, which is a
habit loop rather than a countdown `[verified · no row]` — the *expiry* half of that mechanic is
the part the register carries (**CMP-034**).

**Registrar: yes, fully.** Sells domains in-app, registers domains with no project attached,
supports transfer-in with EPP codes, transfer-out, and a WHOIS privacy toggle. Their own docs:
*"Lovable becomes the registrar for that domain"* `[verified · CMP-006 · Aug 2026]`. This is the
fact that retired our old internal line about competitors being structurally unable to sell and
connect a domain in-flow (§1.1 "What changed in 2026").

## Why it matters to Remixer

It is the only product in the field where colour, type, elevation, motion, waiting, history and
failure are **one tokenised system with one vocabulary** — which is why it reads as expensive and
why it takes the top score on most of the audit's dimensions (§2 "The field at a glance"; count
them, do not restate a number:
`awk -F'|' '/^\| [A-Z]/ && NF>10 {gsub(/ /,"",$3); if ($3=="5") n++} END {print n}' docs/competitors/audits/synthesis-q3-2026.md`
— nine of thirteen at the last run). Our shell, our motion language and
our domain state machine are all being built toward its bar, so it is the reference frame for every
other page in this folder. It is also the product our prototype is closest to structurally, which
means its mistakes are the ones we are most likely to inherit by accident.

## Steal

- **One composer component, three contexts** — marketing hero, dashboard, in-editor chat are the
  same component with the same test id. Muscle memory forms before signup and transfers intact
  (§3.1 "Onboarding — one composer, three contexts") `[verified · no row]`.
- **Plan mode priced flat and *below* Build**, rendering an editable document with a real
  strikethrough diff and a "Describe the change…" box on any selected passage (§3.4 "The agent
  loop") `[verified · no row]`.
  The pricing asymmetry *is* the UX: thinking is cheap and predictable, doing is metered.
- **The eight-state domain machine, with a verb on every state** (`connect.md` §5.1 "Lovable — the
  reference implementation") `[likely · CMP-009 · 19 Aug 2026]`.
  Three ideas there are worth more than the rest of the research: `Ready` (DNS correct, project not
  published — the state a novice reads as broken, and **we do not have it**), `Unable to verify` as
  a *designed one-hour timeout* rather than an error, and `Retry` on the certificate stage instead
  of remove-and-re-add.
- **Recovery is free by policy, and the policy is published** — publishing, hosting, SSL, both
  security scans, "Try to fix", design-system verification turns, the first 100 inline text edits
  per user per day (§3.4 "The agent loop"). Publishing being free is the register's line
  `[verified · CMP-001 · Aug 2026]`; the rest of the free list is `[verified · no row]` and is the
  single most useful row this page still owes the register.
- **Settings that write a prompt into the chat** instead of rendering a form — "Ask Lovable to edit
  details" on the SEO surface. One editing surface, no duplicate CMS (teardown, *SEO & AI search*)
  `[verified · no row]` — seen in a logged-in account, 13 Aug 2026.
- **`✓ No security issues found` inside the publish panel** — a trust signal at the exact moment of
  exposure, and nobody else does it (teardown, *What they have that we do not*)
  `[verified · no row]` — 13 Aug 2026.
- **Blocked-action disclosure over hiding:** the custom-domain control is shown with an inline note
  naming the prerequisite — *"Publish your project before connecting a custom domain."*
  `[verified · no row]` — vendor docs, quoted again in `../features/domains/STATES.md`
  (`ready`), where it explains why our own risk of that state is **higher** than theirs.

## Traps

- **Credit expiry is the most-complained-about thing in the product** — monthly credits expire two
  months after issuance and the pricing FAQ carries three defensive questions about it
  (§3.7 "What Lovable gets wrong") `[verified · CMP-034 · Aug 2026]`. The Trustpilot line
  ("basically extortion") is a **different class of claim**: aggregate-review sourcing, the same
  class §10.1 puts on the do-not-quote list `[unverified · no row]` — real as a signal of
  direction, never quotable as a measurement.
- **Zero build credits pauses a live app's backend.** A customer-facing app breaks because the owner
  ran out of *build* credits (§3.7) `[verified · CMP-034 · Aug 2026]`.
- **Fine-grained visual edits get silently overwritten by later prompts.** Visual and chat edits
  write the same files with no lock or protected-region concept (§3.7) `[verified · no row]`. If we
  share that architecture, our free-edit lane and a lock mechanism must ship together
  (§10.2 "Open questions we must answer internally" Q5).
- **Three security incidents in thirteen months**, including a BOLA flaw exposing source code,
  Supabase credentials and full AI conversation histories — open 48 days, initially denied
  (§3.7) `[likely · no row]` — reported in the audit without a primary source, and the count is
  the audit's, not ours. The critique's point stands regardless: this is a *category* risk, not
  gossip, and when a Remixer-generated app gets popped, DreamHost's abuse desk owns it
  (critique §1).
- **The domain paywall buries what the user came for.** Six generic plan benefits with "Custom
  domains" at position two, plus `Cancel` and `✕` together on a conversion-critical dialog and a
  leaked internal plan name ("Upgrade to Pro 1") (teardown, *State 5*) `[verified · no row]` —
  13 Aug 2026, live account. Beating this is cheap.
- **A dead disabled `Publish changes`** occupies the primary footer slot in the resting state — our
  decision to put a live "Visit site" there is the better one (teardown, *State 4*)
  `[verified · no row]` — 13 Aug 2026, live account.
- **Non-primary domains 302-redirect**, so link equity never consolidates (§3.7)
  `[verified · no row]`.

## Domain / publish behaviour

Three entry doors, one of them **the publish dialog itself** — the right side of the category split
(`connect.md` §3 "Where the connect entry point lives") `[verified-doc · no row]`. Domains bought
in-product are auto-configured for root and www; external domains go through an **Entri** modal
`[verified · CMP-008 · Aug 2026]` with a documented manual fallback (A → `185.158.133.1`, TXT at
host `_lovable` starting `lovable_verify=`) (§1.1, `connect.md` §4.1 "Entri — the bought rail")
`[verified · CMP-032 · Aug 2026]`. Custom domains appear only **after the first publish** and are
gated at Pro (teardown, *State 1* / *State 5*) `[verified · no row]`. Publishing itself is free
`[verified · CMP-001 · Aug 2026]`. It sends 50,000 authenticated emails a month from your domain
and its docs state plainly that it **does not provide mailboxes** — inbound is a different business
(§8.2 "A real mailbox in the publish flow") `[verified · CMP-018 · Aug 2026]`.

## Where the detail lives

| Topic | Section |
|---|---|
| Onboarding, composer geometry, the wall that preserves the prompt | `synthesis-q3-2026.md` §3.1 "Onboarding — one composer, three contexts" |
| Anti-slop: three design directions, "design questions", and the skip list | §3.2 |
| Builder shell, four-tab switcher, keyboard model | §3.3 |
| Agent loop: Plan mode, activity cards, queue, cost receipts, version history, preview toolbar | §3.4 |
| Craft: OKLCH tokens, type scale, radius, six-step shadow ramp, motion curves, 39 keyframes | §3.5 |
| Copy: one status vocabulary, four-level finding icons, a recovery verb per failure | §3.6 |
| What it gets wrong | §3.7 |
| Field position and one-line verdict | §1.2, §2 |
| Mailbox absence as our opening | §8.2 |
| Live shell geometry, "More" surface, publish states 1–5, domain paywall | `lovable-builder-teardown.md` |
| Domain state machine (8 states), Entri rail, failure catalogue, ownership proof, collisions, transfer-in | `connect.md` §5.1 "Lovable — the reference implementation", §4.1 "Entri — the bought rail", §6 "The failure catalogue", §7 "How ownership is actually proven", §9 "Collisions", §10 "Connect vs transfer" |
| Buy-vs-connect entry copy in Project Settings → Domains | `search.md` § competitor-search-ux |

## Do not repeat

- **Lovable's chat panel width as a design target** (**CMP-031**). §3.3 "Builder shell" says it
  plainly: undocumented, could not be verified behind auth, and §10.1 forbids quoting a figure. The
  teardown's **324 px at a 2560 viewport** is a real measurement of one window size — not a spec,
  and not our 432, which came from our own Figma.
- **§3.5 craft numbers as "their product design system."** Those OKLCH ramps, the six-step shadow
  and the 39 keyframes were measured on **lovable.dev's marketing bundle**. Conclusions like "dark
  is the design-led theme" are inference about an application the auditor never got inside
  (critique §2). Label them when you cite them.
- **In-app domain registration prices.** Behind auth, not published — do not quote a figure
  (§10.1; **CMP-031**).
- **The IDE-grade keyboard model.** Single-letter shortcuts over a canvas break the moment a novice
  clicks into content and types. Their shortcut density reflects their audience, not ours — ship ⌘K
  and stop (critique §4.9).
- **"Three design directions before the build" as a straight copy.** It adds a decision and a wait
  to our one remaining advantage, and asks a novice to choose between three abstract aesthetics.
  Lovable itself skips it for app-shaped prompts. The post-build variant is the right one
  (critique §4.10).
