# Lovable

> lovable.dev · pure AI builder · **the category reference**
> Detail: [`audits/synthesis-q3-2026.md`](audits/synthesis-q3-2026.md) §3 ·
> [`audits/lovable-builder-teardown.md`](audits/lovable-builder-teardown.md) ·
> [`../features/domains/research/connect.md`](../features/domains/research/connect.md) §5.1

## What it is

AI app-and-website builder, chat-left / preview-right, sold as a subscription with a credit meter
on top. Pro is **$25/mo for 100 credits** `[verified]` — read off the live upgrade modal, which is
also the domain paywall. Free is a demo: read-only code editor, no custom domain, 30 build credits
a calendar month `[verified]`. All plans get **5 daily build credits resetting at 00:00 UTC**, which
is a habit loop rather than a countdown `[verified]`.

**Registrar: yes, fully.** Sells domains in-app, registers domains with no project attached,
supports transfer-in with EPP codes, transfer-out, and a WHOIS privacy toggle. Their own docs:
*"Lovable becomes the registrar for that domain"* `[verified]`. This is the fact that retired our
old internal line about competitors being structurally unable to sell and connect a domain in-flow
(§1.1).

## Why it matters to Remixer

It is the only product in the field where colour, type, elevation, motion, waiting, history and
failure are **one tokenised system with one vocabulary** — which is why it reads as expensive and
why the audit scores it 5 on eight of thirteen dimensions (§2). Our shell, our motion language and
our domain state machine are all being built toward its bar, so it is the reference frame for every
other page in this folder. It is also the product our prototype is closest to structurally, which
means its mistakes are the ones we are most likely to inherit by accident.

## Steal

- **One composer component, three contexts** — marketing hero, dashboard, in-editor chat are the
  same component with the same test id. Muscle memory forms before signup and transfers intact
  (§3.1) `[verified]`.
- **Plan mode priced flat and *below* Build**, rendering an editable document with a real
  strikethrough diff and a "Describe the change…" box on any selected passage (§3.4) `[verified]`.
  The pricing asymmetry *is* the UX: thinking is cheap and predictable, doing is metered.
- **The eight-state domain machine, with a verb on every state** (`connect.md` §5.1) `[likely]`.
  Three ideas there are worth more than the rest of the research: `Ready` (DNS correct, project not
  published — the state a novice reads as broken, and **we do not have it**), `Unable to verify` as
  a *designed one-hour timeout* rather than an error, and `Retry` on the certificate stage instead
  of remove-and-re-add.
- **Recovery is free by policy, and the policy is published** — publishing, hosting, SSL, both
  security scans, "Try to fix", design-system verification turns, the first 100 inline text edits
  per user per day (§3.4) `[verified]`.
- **Settings that write a prompt into the chat** instead of rendering a form — "Ask Lovable to edit
  details" on the SEO surface. One editing surface, no duplicate CMS (teardown, *SEO & AI search*).
- **`✓ No security issues found` inside the publish panel** — a trust signal at the exact moment of
  exposure, and nobody else does it (teardown, *What they have that we do not*).
- **Blocked-action disclosure over hiding:** the custom-domain control is shown with an inline note
  naming the prerequisite — *"Publish your project before connecting a custom domain."*

## Traps

- **Credit expiry is the most-complained-about thing in the product** — monthly credits expire two
  months after issuance, the pricing FAQ carries three defensive questions about it, and Trustpilot
  calls the subscription "basically extortion" (§3.7) `[verified]`.
- **Zero build credits pauses a live app's backend.** A customer-facing app breaks because the owner
  ran out of *build* credits (§3.7) `[verified]`.
- **Fine-grained visual edits get silently overwritten by later prompts.** Visual and chat edits
  write the same files with no lock or protected-region concept (§3.7) `[verified]`. If we share
  that architecture, our free-edit lane and a lock mechanism must ship together (§10.2 Q5).
- **Three security incidents in thirteen months**, including a BOLA flaw exposing source code,
  Supabase credentials and full AI conversation histories — open 48 days, initially denied
  (§3.7) `[verified]`. The critique's point stands: this is a *category* risk, not gossip, and when
  a Remixer-generated app gets popped, DreamHost's abuse desk owns it (critique §1).
- **The domain paywall buries what the user came for.** Six generic plan benefits with "Custom
  domains" at position two, plus `Cancel` and `✕` together on a conversion-critical dialog and a
  leaked internal plan name ("Upgrade to Pro 1") (teardown, *State 5*). Beating this is cheap.
- **A dead disabled `Publish changes`** occupies the primary footer slot in the resting state — our
  decision to put a live "Visit site" there is the better one (teardown, *State 4*).
- **Non-primary domains 302-redirect**, so link equity never consolidates (§3.7) `[verified]`.

## Domain / publish behaviour

Three entry doors, one of them **the publish dialog itself** — the right side of the category split
(`connect.md` §3) `[verified]`. Domains bought in-product are auto-configured for root and www;
external domains go through an **Entri** modal with a documented manual fallback (A →
`185.158.133.1`, TXT at host `_lovable` starting `lovable_verify=`) (§1.1, `connect.md` §4.1)
`[verified]`. Custom domains appear only **after the first publish** and are gated at Pro (teardown,
*State 1* / *State 5*). Publishing itself is free `[verified]`. It sends 50,000 authenticated
emails a month from your domain and its docs state plainly that it **does not provide mailboxes** —
inbound is a different business (§8.2) `[verified]`.

## Where the detail lives

| Topic | Section |
|---|---|
| Onboarding, composer geometry, the wall that preserves the prompt | `synthesis-q3-2026.md` §3.1 |
| Anti-slop: three design directions, "design questions", and the skip list | §3.2 |
| Builder shell, four-tab switcher, keyboard model | §3.3 |
| Agent loop: Plan mode, activity cards, queue, cost receipts, version history, preview toolbar | §3.4 |
| Craft: OKLCH tokens, type scale, radius, six-step shadow ramp, motion curves, 39 keyframes | §3.5 |
| Copy: one status vocabulary, four-level finding icons, a recovery verb per failure | §3.6 |
| What it gets wrong | §3.7 |
| Field position and one-line verdict | §1.2, §2 |
| Mailbox absence as our opening | §8.2 |
| Live shell geometry, "More" surface, publish states 1–5, domain paywall | `lovable-builder-teardown.md` |
| Domain state machine (8 states), Entri rail, failure catalogue, ownership proof, collisions, transfer-in | `connect.md` §5.1, §4.1, §6, §7, §9, §10 |
| Buy-vs-connect entry copy in Project Settings → Domains | `search.md` § competitor-search-ux |

## Do not repeat

- **Lovable's chat panel width as a design target.** §3.3 says it plainly: undocumented, could not
  be verified behind auth, and §10.1 forbids quoting a figure. The teardown's **324 px at a 2560
  viewport** is a real measurement of one window size — not a spec, and not our 432.
- **§3.5 craft numbers as "their product design system."** Those OKLCH ramps, the six-step shadow
  and the 39 keyframes were measured on **lovable.dev's marketing bundle**. Conclusions like "dark
  is the design-led theme" are inference about an application the auditor never got inside
  (critique §2). Label them when you cite them.
- **In-app domain registration prices.** Behind auth, not published — do not quote a figure (§10.1).
- **The IDE-grade keyboard model.** Single-letter shortcuts over a canvas break the moment a novice
  clicks into content and types. Their shortcut density reflects their audience, not ours — ship ⌘K
  and stop (critique §4.9).
- **"Three design directions before the build" as a straight copy.** It adds a decision and a wait
  to our one remaining advantage, and asks a novice to choose between three abstract aesthetics.
  Lovable itself skips it for app-shaped prompts. The post-build variant is the right one
  (critique §4.10).
