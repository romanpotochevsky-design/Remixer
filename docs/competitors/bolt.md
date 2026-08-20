# Bolt.new

> bolt.new (StackBlitz) · pure AI builder · **best at progressive code disclosure**
> Detail: [`audits/synthesis-q3-2026.md`](audits/synthesis-q3-2026.md) §4.1 ·
> [`audits/bolt-in-app.md`](audits/bolt-in-app.md)

## What it is

An AI agent wrapped around a real in-browser dev environment — StackBlitz's WebContainer, with a
file tree, a CodeMirror editor and a live POSIX-ish terminal, all hidden behind one `<>` icon.
Billing is **raw-token metered**: the public $25 Pro price is a decoy, and the real ladder (Pro 50
$50/mo, Pro 100 $100/mo, Pro 200 $200/mo) only appears after signup `[verified]`. Free is 300 K
tokens a day, reported to run out before a first build finishes `[likely]`.

**Registrar: reseller only.** Sells domains with a 60-day transfer lock, upstream registrar
plausibly Name.com — but that attribution is single-source `[unverified]` (§10.1).

## Why it matters to Remixer

One idea, and it is the best answer anyone has to a question we face directly: **how do you show
code without scaring the person who cannot read it?** The entire IDE sits behind a single `<>` icon
in the top-centre bar, framed in their own docs as *"shaped to feel approachable for anyone who
wants to dig deeper"* — one control serving both audiences with no mode switcher and no separate
"pro" surface (§4.1) `[verified]`. That is the model for our rail modules. The second idea is
**agent blast-radius control**, which we score 0 on and both Bolt and Base44 ship (§5.1 row 17).

Everything else about Bolt is a warning about token-metered economics.

## Steal

- **Right-click file governance** — "Target file" (pin the agent's attention), "Lock file", "Lock
  all", under the heading *"Guide Bolt's focus"*. One context menu answers three separate
  complaints: the AI changed something I didn't ask about, it broke another page, and it burned my
  credits re-reading everything (§4.1) `[verified]`. **The most under-copied idea in the category.**
- **The consolidated publish modal** — one surface carrying visibility with *consequence* copy
  ("Anyone on the web can view it and search engines can find and list it"), Manage access, a free
  security audit, an edit-domain pencil, Publish/Update and a two-click Unpublish (§4.1)
  `[verified]`.
- **A radius rule with real semantics:** 6 px chrome, 8 px base, **full pills reserved for
  AI-facing controls**. Chrome is rectilinear; agent actions are capsules (§4.1) `[verified]`.
- **Matched header heights** (`--header-height` and `--panel-header-height` both 50 px) so the seam
  between chat and workbench reads as one band `[verified]`.
- **Artifact-type chips before the first prompt** — Website · Slides · App · Prototype. Nobody
  should have to describe the *format* in prose (`bolt-in-app.md`, *Dashboard*).
- **Plan badge beside the account in the sidebar** (`Free`) and a referral card pinned to the nav
  bottom — cheap, constant, non-nagging plan awareness. Lovable does both too
  (`bolt-in-app.md`, *Cross-app patterns*).
- **A `Status` link inside the product nav.** For a hosting company that is table stakes and we
  already have the infrastructure.

## Traps

- **Cost scales with project size, not intent.** Their own FAQ: most token usage is syncing the file
  system to the model, so *"the larger the project, the more tokens used per message"* — a
  button-colour change on a mature project can cost more than a whole feature on a new one (§4.1)
  `[verified]`.
- **Error loops bill at full price**, with no in-app fix button. Recovery is reading the Terminal
  tab or the browser console — their docs literally tell users *"press CMD + Option + J"* (§4.1)
  `[verified]`. Compare Lovable's free "Try to fix" and GoDaddy's free self-repair.
- **The theme discontinuity is the headline live finding:** marketing is dark `#171719`, the
  logged-in app is **light**. Crossing from the page that sold you to the product is a jarring
  environment change — and it is a large, under-priced part of why Lovable feels expensive by
  contrast (`bolt-in-app.md`, *The theme discontinuity*). GoDaddy commits the same sin in the
  opposite direction (§4.3.2 Trap 8).
- **Hard signup wall with a survey inside it.** Nothing renders anonymously (§4.1) `[verified]`.
  The opposite of v0.
- **Free sites are invisible to search and go offline on bandwidth overage** (10 GB / 333,333
  requests) until the next cycle (§4.1) `[verified]`.
- **Analytics count bots**, by Bolt's own admission (§4.1) `[verified]`. Worth remembering before we
  build any alerting surface with the same defect (critique §4.5).
- **The WebContainer reliability tax.** Reopening a project left the preview reading *"No preview
  available"* — the dev server never cold-started. The in-browser runtime that is Bolt's
  differentiator is also its failure mode (`bolt-in-app.md`, *Builder shell*).
- **Chat output is a wall of structured prose.** Bolt makes you read; Lovable embeds a rendered
  screenshot of the page in the message and lets you look (`bolt-in-app.md`).

## Domain / publish behaviour

**The weakest domain story in the cohort.** Custom domains are 100 % manual DNS **even for domains
bought through Bolt** — www CNAME plus a root ALIAS/ANAME/flattened CNAME to `site-dns.bolt.host`,
TXT for subdomains, "up to 24 hours", and a manual "Verify domain status" button (§4.1)
`[verified]`. The entry point is not at publish time: gear → All project settings → **Domains &
Hosting** (`connect.md` §3) `[verified]`. Status is only three labels — `Secure` / `Pending` /
`Warning` — where `Warning` covers everything from a stray AAAA record to a dead certificate
(`connect.md` §5.2) `[likely]`. Their own docs are the source for failure #3 in our catalogue:
*"old records sitting next to new ones is a classic cause of a domain that half works"* `[likely]`.
Root and www are configured together, so the user never meets the apex concept
(`connect.md` §8) `[verified]`. **Zero mailbox capability** — MX appears only as a record type you
may add manually for someone else's host (§8.2) `[verified]`.

## Where the detail lives

| Topic | Section |
|---|---|
| Full teardown: disclosure, file governance, layout maths, radius, loading bar, publish modal, what it gets wrong | `synthesis-q3-2026.md` §4.1 |
| Field position and one-line verdict | §1.2, §2 |
| Blast-radius control as table stakes we lack | §5.1 row 17 |
| Where we stand against it on speed and publishing economics | §6 |
| Live app: theme discontinuity, dashboard, projects grid, builder shell, preview failure | `bolt-in-app.md` |
| Cross-app patterns worth carrying over | `bolt-in-app.md`, *Cross-app patterns* |
| Connect entry point, three-state vocabulary, leftover-record failure, apex/www handling | `connect.md` §3, §5.2, §6, §8 |

## Do not repeat

- **Trustpilot 1.4/5.** Single aggregate source, explicitly listed as not-for-decks (§10.1)
  `[unverified]`.
- **The hidden Pro tier token counts** (Pro 50 = 26 M etc.), the Name.com upstream attribution, and
  the reload SKU prices — all single-source `[unverified]` (§10.1).
- **The individual token-burn anecdotes** (7–12 M tokens in an afternoon, 20 M+ on one auth issue).
  The *direction* is consistent across sources; the numbers are not verified and should not be
  quoted as measurements (§4.1).
- **Our own speed comparison against Bolt.** "Bolt ~5 min" is documented marketing, ours is an
  internal 2–3 minute figure whose p50/p90 we admit we do not know (§10.2 Q2, critique §2). Do not
  lead a slide with it.
