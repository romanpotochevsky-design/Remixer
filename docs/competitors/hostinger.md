# Hostinger (Horizons)

> hostinger.com/horizons · **hosting company with an AI builder — the closest structural mirror**
> Detail: [`audits/synthesis-q3-2026.md`](audits/synthesis-q3-2026.md) §2, §6, §8.2 ·
> [`../features/domains/research/connect.md`](../features/domains/research/connect.md) §4.3

## What it is

A mass-market host and registrar with its own mail platform, selling an AI builder called
**Horizons** as part of the hosting subscription rather than as a standalone product. Cheapest paid
entry in the whole field — Explorer at **$6.99/mo**, though it caps at 30 credits `[verified]`. There
is a permanently free plan with no card plus a 30-day money-back guarantee `[verified]`. Mailboxes
are **laddered by plan: 0 / 1 / 2 / 5**, inside the AI-builder pricing table `[verified]`.

**Registrar: yes**, and annual plans include a free first-year domain claimed through a "Claim your
free domain" flow `[verified]`.

## Why it matters to Remixer

It is our mirror. Registrar + host + mail platform + AI builder, sold on price, aimed at the same
customer. Which makes it simultaneously our **only shipped proof** and our **clearest warning**.

**The proof:** its mailbox ladder is the only evidence anywhere in the field that the email lever
converts — the audit's §1.2 gives Hostinger the "bundled economics" crown for exactly this, and our
entire §8.2 mailbox play leans on it (§8.2, §6). Note the *shape*, though: Hostinger sells mailboxes
as **priced inventory laddered across tiers**, not as a giveaway. Given the critique's veto on
bundling a free mailbox into $9.99 — the highest-volume, lowest-margin ticket class in hosting,
inherited from an audience that by definition cannot debug it, on shared sending reputation, with no
abuse or KYC plan (critique §4.1) — the ladder is the safer design and the one with evidence behind
it. That is worth more than our own version of the idea.

## The cautionary lesson: a builder with no front door

This is the sentence to carry out of this page. The audit's own verdict (§2):

> *"The closest structural mirror of Remixer, and a cautionary one. Mailboxes laddered by plan
> (0/1/2/5) prove the email lever converts; **burying the builder in hPanel proves what happens
> when it has no front door.**"*

Horizons publishes to a live URL and then hands the real work to the control panel: Publish →
Connect Domain **ejects the user into hPanel** `[likely]`, and Horizons has **no in-builder domain
search at all** `[verified]`. The builder is a feature of a hosting account, not a product a person
arrives at. Its scores show what that costs — 2/5 onboarding, 2/5 agent loop, **1/5 versioning and
recovery**, 2/5 design craft (§2). A bundled builder can be structurally advantaged and still lose
on every dimension a user actually feels.

**And here is the part that is about us, not them.** The critique's sharpest procedural finding is
that the audit *named* this lesson and then never applied it to the DreamHost panel — *"which is
where Remixer actually lives"* (critique §1, final paragraph). That is an open action item, not a
settled one. Every question it raises is ours too: does Remixer have a front door of its own, or is
it a tile in a hosting panel? Does the marketing composer carry the prompt through SSO into a running
generation, or does the user land in the panel and retype (§7 Tier 1 item #4, §10.2 Q1)? Is the
builder's identity continuous from the page that sold it — the failure Bolt and GoDaddy both commit
at the door?

## Steal

- **The mailbox ladder inside the AI-builder pricing table** (0/1/2/5). Priced inventory, tier by
  tier, with the first mailbox as the upgrade hook (§1.2, §8.2) `[verified]`. Our open question 17
  — can a mailbox be included in $9.99 without cannibalising DreamHost email revenue, or does it
  need to be one included plus paid additions — is literally "should we copy Hostinger's ladder"
  (§10.2 Q17).
- **An explicit user-driven re-check button.** External domains get nameserver/A-record instructions
  plus an **"I've Updated NS/DNS"** button `[verified]`. It gives the user an action instead of a
  spinner, which is the same instinct as Lovable's *Check status* — and it is the cheap version we
  can build without buying an automation rail.
- **Same-house automatic connect** for Hostinger-registered domains `[verified]` — the second
  existence proof, after GoDaddy, that the zero-record mechanism is copyable and that our advantage
  is placement (see [`godaddy-airo.md`](godaddy-airo.md)).
- **The free-first-year domain as a claim flow**, not a silent entitlement `[verified]`. Worth noting
  the constraint on our side: DreamHost's free-domain offer applies only to annual Web Hosting and
  DreamPress, and the builder plan does not qualify — so we cannot use this hook in the main flow.

## Traps

- **The builder buried in the control panel** — above. The single most transferable failure in this
  folder, because it is an org-chart decision rather than a design one.
- **Publish that ejects.** Putting the connect entry point in the publish moment is worth nothing if
  the click leaves for another product's UI (`connect.md` §3). GoDaddy buries it in settings;
  Hostinger surfaces it and then hands off. Both lose the moment.
- **1/5 on versioning and recovery** (§2). Bundling into a hosting plan does not buy you an
  undo — and recovery is where the whole category's retention now lives.
- **AI-generated imagery only.** GoDaddy's comparison tables score Horizons alongside Base44 as
  "AI-generated only" against its own Getty library (§4.3.1) — competitor-sourced, so `[likely]`,
  but consistent with Horizons having no stock library documented anywhere.
- **Cheapest is not a moat.** Explorer undercuts us at $6.99 and caps at 30 credits (§6)
  `[verified]`. Price-led bundling is the one competitive move a host can always make, which is
  precisely why we should not try to win on it.

## Domain / publish behaviour

Hostinger-registered domains connect automatically; external domains get nameserver or A-record
instructions plus an "I've Updated NS/DNS" button `[verified]`. Horizons itself has no in-builder
domain search, and its Publish → Connect Domain path leads to hPanel for the actual work
— the absence of in-builder search is `[verified]`, the hPanel handoff `[likely]` (`connect.md` §3,
§4.3; `search.md` § competitor-search-ux, which carries the live capture of its search-results and
taken-domain screens). Mailboxes exist and are laddered, which makes Hostinger the only competitor
in this folder with a real inbound mail story.

## Where the detail lives

| Topic | Section |
|---|---|
| One-line verdict — the cautionary mirror — and the full scoring row | `synthesis-q3-2026.md` §2 |
| "Bundled economics" crown for the mailbox ladder | §1.2 |
| Where we stand: time to render, cheapest entry, publishing economics, email | §6 (four rows) |
| Our mailbox play, and Hostinger as the evidence under it | §8.2 |
| Whether a bundled mailbox cannibalises DreamHost email revenue | §10.2 Q17 |
| Perpetual free tier as table stakes | §5.1 row 19 |
| Same-house automatic connect; Horizons ejecting to hPanel | `connect.md` §4.3, §3 |
| Live captures: domain checker, available/taken results, bundle card, connect copy | `search.md` § competitor-search-ux |
| Why the mailbox bundle is the audit's most dangerous recommendation | critique §4.1 |
| The hPanel lesson never applied to the DreamHost panel | critique §1 |

## Do not repeat

- **"Hostinger Horizons has a 7-day free trial with no payment info" — unconfirmed and superseded**
  (§10.1). The pricing page advertises a permanently free plan with no card, plus a 30-day
  money-back guarantee. Do not use the 7-day figure.
- **Anything beyond the tables.** There is **no dedicated Hostinger teardown section in the
  synthesis** — every mention is a row, a cell or an aside inside someone else's section. Do not
  restate a list of section numbers here (an earlier version of this line named five places and
  missed three); count them when you need them:
  `awk '/^#{2,3} /{sec=$0} /[Hh]ostinger/{print NR": "sec}' docs/competitors/audits/synthesis-q3-2026.md`
  — at the last check 14 mentions, spread over §1, §2, §4, §5, §6, §8 and §10, none of them a
  teardown. Everything we know about Horizons' actual interface is second-hand. It is the
  thinnest coverage of any company in this folder and, given that it is our structural mirror, that
  is a gap worth closing — see [`_blind-spots.md`](_blind-spots.md), where the whole
  host-with-an-AI-builder cohort sits unbenchmarked (critique §1).
- **Treating its bundling as proof our economics work.** Hostinger bundles a builder into a hosting
  subscription it already sells at scale. We are proposing to unmeter publish, bundle a mailbox, add
  a daily grant and fund frontier-model inference on $9.99 — three strategies stacked, with no unit
  economics behind them (critique §5, third strand).
