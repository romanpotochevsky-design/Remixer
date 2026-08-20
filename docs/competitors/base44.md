# Base44

> app.base44.com · pure AI builder · **owned by Wix** · best design-token system in the field
> Detail: [`audits/synthesis-q3-2026.md`](audits/synthesis-q3-2026.md) §4.2

## What it is

A two-year-old AI app builder, acquired by **Wix**, aimed at real applications rather than brochure
sites — 40-plus-page projects, a database, automations, an infinite canvas of live page frames.
Subscription plus credits. Free is **5 credits per day** (25/month) across 5 apps, which a reviewer
described as enough to "burn through just tweaking UI" `[verified]`. Elite is $160/mo and is where
data version history starts (7-day) `[verified]`. A seven-model picker is gated at $40/mo, and on
29 Jun 2026 it shipped **Base 1**, the first in-house LLM in the category (§5.2) `[verified]`.

**Registrar: reseller**, through Wix or IONOS — the audit does not establish which `[unverified]`.

## Why it matters to Remixer

Two reasons, one design and one strategic.

**Design:** it has the most mature token system in the sweep, measured off its own production CSS,
and it is the only builder that has seriously designed for scale — a searchable page switcher
holding 600 pages, and a "Files used in this page" reverse lookup that is the best bridge in the
field between a non-coder's mental model and a file system (§4.2) `[verified]`. Both are where our
design system and our multi-page future are heading.

**Strategic:** Base44 is Wix's. Wix is a registrar, a host, and sells mailboxes. That single fact is
what makes §8's load-bearing sentence — *"that combination exists nowhere else in this field"* —
false (critique §1, §5). Any positioning built on registrar + host + mail being unique has to
survive Base44's own parent company first.

## Steal

- **Two parallel neutral ramps, and never a cold grey surface.** Warm `stone` for every surface and
  border; cool `neutral` reserved for disabled states and dark shimmer (§4.2) `[verified]`. This is
  the evidence behind the audit's "warm the ladder" advice — note it is n=1 (critique §3).
- **"Premium" as a first-class semantic intent** — `--sem-fill-premium-*`, `--sem-border-premium-*`,
  a dedicated premium focus ring, `--gradient-premium`. **Upsell is designed, not bolted on.** The
  audit says steal this exact idea and it is right (§4.2) `[verified]`.
- **Interaction state tokenised as opacity, not extra colours** — disabled .4, muted .65, hover .85,
  press .75, scrim .32, plus a named z-index ladder (§4.2) `[verified]`.
- **Manual visual edits cost zero credits**, published as a list: database reads/writes, dragging,
  layout changes, direct text editing (§4.2) `[verified]`.
- **`Cmd+.` switches Default / Discuss / Edit *even while you're typing a prompt*** — intent changes
  mid-sentence, and preserving in-flight text while reclassifying it removes a retype and a decision
  (§4.2) `[verified]`. Discuss is 0.3 credits against 0.5–4 for execution.
- **Redesign returns four options side by side with previews**, scoped to project or section:
  *"AI shows previews before it touches anything."* (§4.2) `[verified]`.
- **Marketing restricts itself to two radii (6 and 8) out of a twelve-step scale.** Restraint reads
  as premium (§4.2) `[verified]`.

## Traps

- **Branches share live production data.** Marketed as "branch your app to try changes safely",
  while the docs confirm all branches read and write identical records — and branches also disable
  publishing, secrets, connectors, automations, workflows, the code editor, theme settings and
  version-history restore (§4.2) `[verified]`. The audit reads that crippling as a moat for us; the
  honest reading is that Base44 hit an unsolved problem, and our §8.4 branch play inherits it
  (critique §4.4).
- **"Credits are non-refundable for tool behavior and AI mistakes"** — the single most inflammatory
  sentence in its documentation (§4.2) `[verified]`.
- **Integration credits are burned by *your customers*** — email 1, image 1, video 5/sec, LLM 1–15,
  in-app agent messages 3–40 — and exhaustion pauses live features. The harshest paywall placement
  in the category (§4.2) `[verified]`.
- **Raw Python stack traces leak to a no-code audience**, including a `UnicodeEncodeError` triggered
  by characters in an app *name* (§4.2) `[verified]`.
- **No way to review what will change before publishing** — an open, upvoted item on its own
  feedback board (§4.2) `[verified]`.
- **The hero composer is decorative** — an animated fake cycling Build/Send, with every CTA handing
  off to the app. It wastes the highest-intent moment in the funnel (§4.2) `[verified]`. The exact
  opposite of Lovable's one-composer-three-contexts.
- **The raw Tailwind class field.** Brave, and a genuine pressure-release valve for the design
  ceiling — but in a novice product it is a support-ticket generator and an escape hatch that voids
  your own token discipline. Do not copy it without deciding who it is for (critique §4.12).

## Domain / publish behaviour

Connect lives in app settings, **not at publish time** — add → configure DNS → verify, with SSL
issued automatically once verification passes (`connect.md` §3, §5.2) `[likely]`. The status
vocabulary is undifferentiated: there is no named state machine to speak of. It is the source for
two of the ugliest invisible failures in our catalogue — **leftover AAAA/IPv6 records** (symptom:
"my domain shows the wrong site" for a subset of visitors, undiagnosable by a novice) and **CAA
records blocking the certificate authority** (`connect.md` §6, rows 4 and 6) `[likely]`. DNS
debugging is handed off to whatsmydns.net (§8.3) `[verified]`. Email is **sending-only** via
SendGrid CNAMEs — *"Custom email domains are for sending only"* — and built-in email cannot reach an
address that is not a registered app user, so a contact form emailing the owner's Gmail is not a
first-class path (§8.2) `[verified]`.

## Where the detail lives

| Topic | Section |
|---|---|
| Full teardown: token system, premium intent, free visual edits, mode switching, scale, redesign, what it gets wrong | `synthesis-q3-2026.md` §4.2 |
| Field position and one-line verdict | §1.2, §2 |
| Design-system-as-artefact and the model-picker counter-trend | §5.2 |
| Table stakes it holds that we lack (free direct manipulation, preview link, blast radius) | §5.1 rows 5, 16, 17 |
| Where its email limits become our opening | §8.2 |
| Why its branches are a warning, not a moat | §8.4 + critique §4.4 |
| Connect entry point, status vocabulary, AAAA and CAA failures | `connect.md` §3, §5.2, §6 |
| Wix ownership as the counterexample to our moat claim | critique §1, §5 |

## Do not repeat

- **The runtime ceilings.** 150 ops/min, 5,000-item request cap, 3-minute automation cutoff,
  5-minute function limit, 50 functions max, no self-serve backups/SQL/indexing — **unverifiable**,
  from a single adversarial source (escapebase44.com) which itself concedes the 150 ops/min figure
  "isn't documented anywhere" (§4.2 fact-check note, §10.1) `[unverified]`. Never in a deck.
- **Whether top-ups exist.** Two first-party sources contradict each other: the docs say no, the
  pricing blog FAQ says yes (§4.2). State the contradiction, do not pick a side.
- **Base44's warmth as proof that we should warm our own neutral ramp.** It is one company. The
  audit's "warm the ladder" recommendation is n=1 with no user data behind it, and a typeface plus
  neutral-ramp rebuild is a real engineering cost (critique §3).
