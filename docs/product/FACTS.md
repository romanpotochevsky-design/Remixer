# Remixer — Fact register

> **The operating rule: other documents cite a fact ID. They do not restate the value.**
>
> If a hand-off, a Figma note, a code comment or a deck needs a number — a price, a
> waiting window, a plan name, a competitor's behaviour — it names the ID (`DH-104`,
> `STD-009`) and, at most, quotes the row verbatim. It never re-types the number in its
> own words, because a re-typed number is a number that will drift. When a value changes,
> it changes **here, in one row**, and everything that cited the ID is correct again.
>
> Why this file exists: on 20 Aug 2026 the same four facts were carried at three different
> values across `CLAUDE.md`, the domain hand-off, the research and the prototype. Section 2
> lists every such collision we know of. That section is the point of this document.

## How to use it

- **Citing:** `Plan price — see FACTS DH-001.` Never `Plan price $9.99 (verified)`.
- **Adding a row:** append; never reuse or renumber an ID. `DH-###` = DreamHost / our own
  product. `CMP-###` = a competitor. `STD-###` = standards and market mechanics (ICANN,
  RDAP, Domain Connect, Entri, the registry layer).
- **Changing a value:** edit the row, bump its date, and check the *Depends on it* column —
  those are the places that will now be wrong until someone touches them.
- **Deleting a row:** don't. Set it to `refuted` and say what replaced it. A refuted row is
  what stops a mistake from coming back a second time; six of them below are things this
  project believed and shipped into documents.
- **A `verified` row still has a date.** Prices, provider lists and competitor pricing rot
  in weeks. A verified row older than a quarter is a *likely* row that hasn't admitted it.

## Status vocabulary

| Status | Means | Allowed in |
|---|---|---|
| `verified` | Read from a first-party page, first-party docs, a live DOM, or our own product. Source and date recorded. | Anything, including material for leadership |
| `likely` | Single retrieval, a good secondary source, or a first-party marketing claim we could not independently confirm. | Design work; internal discussion. **Re-check before it goes in front of the CEO.** |
| `unverified` | Plausible, inferred, self-reported without a source, or explicitly flagged unverifiable by the fact-check. | Design-informing only. **Never quotable** — see `docs/competitors/audits/synthesis-q3-2026.md` §10.1 |
| `refuted` | We believed it; it is wrong. Row kept on purpose. | Nowhere, except as a warning |

---

## 1. The register

*128 rows as of 20 Aug 2026 — 90 verified (10 of them verified only in part, which the
status cell states), 11 likely, 20 unverified, 7 refuted. Recount when you add rows; a
register whose header lies about its own contents is the failure mode this file exists to
prevent.*

### 1A. Plan, trial, credits

| ID | Fact | Status | Date | Source | Depends on it |
|---|---|---|---|---|---|
| **DH-001** | The paid plan is called **"Remixer Build"**, $9.99/mo billed yearly — $119.88 up front, marketed as "Save 33%". | verified | Jun 2026 | dreamhost.com, via `docs/features/domains/handoff-design.md` "Real product facts" | `DomainModal.tsx` plan cards · `PublishPanel.tsx` Case 1 · `flows.ts` · every publish/paywall frame |
| **DH-002** | Paid monthly: **$9.99 for the first month, then $14.99/mo**. | verified | Jun 2026 | as DH-001 | `DomainModal.tsx` monthly card + footnote · `scenarios.ts` billing hints |
| **DH-003** | Free trial is **30 days with no credit card**. DreamHost markets it as the longest no-card trial in the category; the audit confirms the length but notes every competitor runs a *perpetual* free tier instead, so it is a differently-shaped offer, not an unambiguous win. | verified (length) / likely (superlative) | Aug 2026 | handoff "Real product facts"; `synthesis-q3-2026.md` §6, §5.1 row 19 | Trial copy · paywall framing · POSITIONING |
| **DH-004** | The trial **starts after the first site generates**, not at signup. Building with AI is the trial. | verified | Jun 2026 | handoff "Trial logic" | Onboarding copy · trial-day counter (`world.trialDay`) |
| **DH-005** | Publishing to a **custom domain requires the paid plan**. The `*.remixer.site` preview is free during and after trial. | verified | Jun 2026 | handoff "Trial logic" | `PublishPanel.tsx` gate · `DomainModal.tsx` plan step · Launchpad Case 1/2 |
| **DH-006** | Credits: **1,000/mo included, plus a 1,000 bonus in the first month**. | verified | Jun 2026 | handoff "Plan includes" | Credits chip · `world.credits` / `world.bonus` · spend-order copy (DH-011) |
| **DH-007** | Top-ups, one-time, valid 6 months: **+1,000 = $14.99 · +2,500 = $34.99** ("Best value"). | verified | Jun 2026 | handoff "Plan includes" | Credits popover · pricing surfaces |
| **DH-008** | **Publishing consumes credits today.** As far as the audit could establish we are the only major builder that charges for the moment of success. | verified (our ground truth) | Aug 2026 | `synthesis-q3-2026.md` §1.3, §5.1 row 11, §6 | POSITIONING §1 · publish sheet copy · the whole "always free" panel idea |
| **DH-009** | **Unknown: what a publish actually costs in credits, and whether the charge is flat or re-runs generation work.** This decides whether "publishing is free" is a billing toggle or an unbounded-cost architecture project. | unverified | Aug 2026 | `synthesis-q3-2026.md` §10.2 Q10; `synthesis-critique.md` §2 | POSITIONING §1 (effort estimate) · any "publishing is free" copy |
| **DH-010** | **Unknown: whether credits roll over and whether they expire.** We have no documented position. The category's single largest rage generator (see CMP-035). | unverified | Aug 2026 | `synthesis-q3-2026.md` §10.2 Q8 | Credits popover · plan FAQ · churn messaging |
| **DH-011** | **Unknown: the spend order** between included, bonus and purchased credits. Matters because of the first-month bonus (DH-006). | unverified | Aug 2026 | §10.2 Q9 | Credits popover line "we spend the credits closest to expiring first" |
| **DH-012** | **No per-action credit price list exists.** "1,000 credits" is not comparable to Lovable's 100 or GoDaddy's 150, and users cannot reason about it. | unverified (absence) | Aug 2026 | §10.2 Q7 | Credits popover · pricing page · Framer comparison (CMP-037) |
| **DH-013** | The plan includes hosting, the first-party global CDN (SmartEdge — see DH-304), SSL, "Connect a Domain", and 24/7 chat + email support. | verified | Jun 2026 | handoff "Plan includes" | Plan cards · Launchpad Case 2 green box |
| **DH-014** | Time to first render is quoted as **2–3 minutes**. This is a marketing/ground-truth figure with n=1 behind it; our real p50/p90 is unknown, and the audit's "Ahead" rating against v0's measured 6m21s compares different output classes. | unverified | Aug 2026 | `synthesis-q3-2026.md` §6 vs §10.2 Q2; `synthesis-critique.md` §2 | POSITIONING (speed claim) · any comparison table |

### 1B. Domain prices

All rows below come from **one source read on one day**: DreamHost's official pricing table
at `dreamhost.com/domains/pricing`, read in USD on **06 Aug 2026** and recorded in
`docs/features/domains/research/search.md` §dreamhost-facts. Register / Renew / Transfer,
USD. Every row was flagged "Sale" on the page, which is why first-year and renewal diverge
(DH-112). `prototype/src/data/domains.ts` (`TLD_PRICES`) is the machine-readable copy and
is correct as of that date; the hand-off is not (see §2).

| ID | Fact | Status | Date | Source | Depends on it |
|---|---|---|---|---|---|
| **DH-101** | `.com` — register **$9.99**, renew **$19.99**, transfer $9.99. | verified | 06 Aug 2026 | official pricing table → `search.md` §dreamhost-facts | `TLD_PRICES` · every search/checkout frame · hero pricing |
| **DH-102** | `.net` — register **$4.99**, renew **$19.99**, transfer $13.95. | verified | 06 Aug 2026 | as above | `TLD_PRICES` · `otherEndings()` |
| **DH-103** | `.org` — register **$7.99**, renew **$21.99**, transfer $15.99. | verified | 06 Aug 2026 | as above | `TLD_PRICES` · `otherEndings()` |
| **DH-104** | `.io` — register **$34.99**, renew **$59.99**, transfer $59.99. | verified | 06 Aug 2026 | as above | `TLD_PRICES` · `otherEndings()` · **hand-off still says $39.99 → §2.1** |
| **DH-105** | `.shop` — register **$0.99**, renew **$34.99**, transfer $34.99. | verified | 06 Aug 2026 | as above | `TLD_PRICES` · the renewal-honesty example (largest delta) |
| **DH-106** | `.store` — register **$2.99**, renew **$49.95**, transfer $49.95. | verified | 06 Aug 2026 | as above | Hand-off search frames. **Not in `TLD_PRICES`** — the prototype never offers `.store`, so no priceless row today; add both together if it ever appears |
| **DH-107** | `.online` — register **$1.99**, renew **$29.95**, transfer $29.95. | verified | 06 Aug 2026 | as above | `TLD_PRICES` · `otherEndings()` · **hand-off says $0.99 → §2.2** |
| **DH-108** | `.me` — register **$2.99**, renew **$32.95**, transfer $32.95. | verified | 06 Aug 2026 | as above | `TLD_PRICES` · `AI_SUGGESTIONS` |
| **DH-109** | `.co` — register **$34.99**, renew **$34.99**, transfer $34.99. | verified | 06 Aug 2026 | as above | `OWNED_DOMAINS` (`vegan-burger-delivery.co`) — a `.co` row must not be priced from `.com` |
| **DH-110** | `.ai` — **$89.99/yr with a 2-year minimum**, so **$179.98 due at checkout**. Renew $89.99. The front page shows the $179.98 figure. | verified | 06 Aug 2026 | as above | `TLD_PRICES` (`note: 2-year minimum`) · checkout sheet · **hand-off prints $179.98 as if annual → §2.3** |
| **DH-111** | Prices on dreamhost.com are **geo-currency aware** (the site defaulted to EUR; selector offers $ USD / € EUR / £ GBP). Every figure above is the USD reading. | verified | 06 Aug 2026 | as above | Any hardcoded `$` string · i18n · non-US demos |
| **DH-112** | First-year-vs-renewal gaps are **registry promotions that rotate**: "some TLD registries will offer a promotion on first-year registrations… this list is constantly changing". | verified | 06 Aug 2026 | pricing-page FAQ → `search.md` | Why prices live in `TLD_PRICES` and not in Figma text layers · POSITIONING (price honesty) |
| **DH-113** | **WHOIS privacy is free for the life of the domain** and auto-renews. Some TLDs don't support it — during transfer-in, the absence of the privacy checkbox is the tell. | verified | Aug 2026 | dreamhost.com/domains + KB 215250318 → `search.md` | Checkout sheet trust line · transfer frames |
| **DH-114** | **DreamHost does not sell premium domains and has no brokerage:** "you need to register it directly with Enom or another registrar selling them." | verified | Aug 2026 | KB 360001191426 → `search.md` | No "Make an offer" state anywhere · taken-name behaviour · `domains.ts` header comment |
| **DH-115** | The **free first-year domain credit applies only to annual Web Hosting or DreamPress plans**, must be used in the first month, and "is not available under any other hosting plan" — as documented, a builder plan does not qualify. | verified | Aug 2026 | KB 360001191426 → `search.md` | **Do not use the free-domain hook in the core flow.** Hand-off open item 3 still calls this "unconfirmed" → §2.12 |
| **DH-116** | Registrations are generally **non-refundable**; most TLDs have a deletion grace window of up to 5 days, some none, support-only. | verified | Aug 2026 | pricing FAQ + KB 224220668 → `search.md` | Checkout confirmation copy · "I bought the wrong name" support path (undrawn) |
| **DH-117** | DreamHost's purchase flow caps a domain name at **67 characters**; an outstanding account balance blocks purchase and transfer; multiple domains can go through one checkout; payment needs a card or account credit. | verified | Aug 2026 | KB 360001191426 / 224220668 / 215250318 → `search.md` | Search-field validation (contrast STD-020: 63/253 is the DNS limit, 67 is the product limit) · checkout errors |

### 1C. Domains — connect, transfer, registrar mechanics

| ID | Fact | Status | Date | Source | Depends on it |
|---|---|---|---|---|---|
| **DH-201** | **DreamHost supports Domain Connect in no role at all** — absent from `domainconnect.org`'s provider list, zero mentions across `help.dreamhost.com`. Connecting a domain whose DNS lives elsewhere is therefore always manual records or nameservers. | verified | Aug 2026 | `domainconnect.org/dns-providers` + site search of help.dreamhost.com → `search.md`, `connect.md` §11.2 | `ExternalScreen` in `DomainsSurface.tsx` · **hand-off scenario 3 still promises one-click → §2.5** · POSITIONING (rented rails) |
| **DH-202** | One-click external connect is reachable **only by buying Entri** (STD-009). Until that PO exists, any frame showing a one-click consent screen is a conditional design and belongs in Alternates. | verified (as a consequence of DH-201) | 19 Aug 2026 | `connect.md` §11.2; hand-off corrections block | Figma "Alternates" section · roadmap framing |
| **DH-203** | Nameservers are **ns1/ns2/ns3.dreamhost.com** (162.159.26.14 / 162.159.26.81 / 162.159.27.84). **"Nameserver changes can take anywhere from 4–72 hours to fully update online."** | verified | Aug 2026 | KB 216385467 / 360004289812 → `search.md` | Every "how long will this take" line on the external path → §2.16 · guided-manual screens |
| **DH-204** | A new registration **completes within ~15 minutes** of the purchase form; its nameservers take **24–72 hours** to fully update. | verified | Aug 2026 | KB 224220668 / 360001191426 → `search.md` | Buy-flow success copy · why in-house purchase feels instant but isn't fully propagated |
| **DH-205** | **Custom DNS records do not survive a nameserver switch:** "any custom DNS records configured at your current host will no longer function. These records must be recreated in your DreamHost panel *before* you point your DNS to DreamHost." | verified | Aug 2026 | KB 360001193503 → `search.md` | The email guard (failure #11 in `connect.md` §6) · the confirm step on `dh-external-ns` and external paths · **the reason "never mention nameservers" is unsafe advice** |
| **DH-206** | **Transfer-in:** `.com` costs **$9.99 and includes a 1-year extension**; takes **5–7 business days**; needs unlock + auth/EPP code at the old registrar; **DNS records are not moved**; the site keeps working wherever the nameservers point; point nameservers *before* starting, because they cannot be changed mid-transfer. | verified | Aug 2026 | KB 215250318 + 360001193503 + transfer landing page → `search.md` | Transfer as a *later* upsell, never a prerequisite · transfer frames |
| **DH-207** | **ICANN 60-day transfer lock** applies within 60 days of registration, within 60 days of a previous transfer, and after any change to registrant name/org/email — **including a privacy-setting change**. A panel toggle can opt out in advance. | verified | Aug 2026 | KB 235175787 (ICANN Transfer Policy) → `search.md` | Why transfer can be *impossible* right after purchase · error copy on transfer |
| **DH-208** | **Cannot be transferred in:** `.AM .AT .BZ .FM .JP .NGO .ONG .OOO .PLACE .WS` ($0 in the Transfer column). `.co.uk` uses no EPP code — the old registrar sets the IPS tag to `ENOM` (capitals). | verified | Aug 2026 | KB 360001193503 / 215250318 + pricing table → `search.md` | Transfer-eligibility check before offering transfer at all |
| **DH-209** | DreamHost's own KB calls transferring **optional** ("this is an optional step, it's highly recommended") and documents nameserver pointing as the recommended way to host a domain registered elsewhere. | verified | Aug 2026 | KB 360004289812 / 360001193503 → `search.md` | Connect-first framing (`connect.md` §10) · never defaulting a novice into transfer |
| **DH-210** | **The customer must perform the transfer** ("Can DreamHost transfer my registration for me? No."). A transfer in progress can be cancelled in the panel. | verified | Aug 2026 | KB 360001193503 / 215250318 → `search.md` | Support expectations · cancel affordance |
| **DH-211** | DreamHost's registrar backend appears to be **Enom** for at least some TLDs (the `.co.uk` IPS tag is ENOM; the premium FAQ points users at Enom). | likely | Aug 2026 | KB 215250318 + 360001191426 → `search.md` | Nothing user-facing. Relevant only if we ever surface registrar-of-record |
| **DH-212** | A domain registered with DreamHost but without hosting shows status **"DNS Only"** in the panel. | verified | Aug 2026 | KB 216385467 → `search.md` | Inventory wording for `dh-free` — "in your DreamHost account · not used yet" |
| **DH-213** | For a domain **already in the user's DreamHost account, ownership is an internal lookup** — no TXT challenge, no verification CNAME, no waiting. No competitor can write the sentence "we already know it's yours". | verified | 19 Aug 2026 | `connect.md` §7; `search.md` §technical-detection | The zero-record path · `world.inventory: 'dh-free'` · POSITIONING §2 |
| **DH-214** | The public domain search on dreamhost.com is served by `marketing-api-aws.dreamhost.io/ajax.cgi?cmd=domreg-availability` behind an **invisible reCAPTCHA score gate**; low scores get HTTP 500 and the UI shows *"Something went wrong! Please try your search again, or contact support for assistance."* There is also a 30-second timeout state. | verified | 06 Aug 2026 | observed live in browser console → `search.md` | The search error state (which our Figma does not draw) · rate-limit/error copy |
| **DH-215** | DreamHost's **panel** domain search is a plain availability checker with no AI suggestions; the AI naming play is a separate free **Business Name Generator** (keywords + industry → names → live availability check → register). The public search page claims it offers "suggestions" but that UI could not be exercised. | verified (panel) / likely (public page) | Aug 2026 | KB 360001191426 / 224220668 + dreamhost.com/domains → `search.md` | Precedent for our AI suggestions · the "Add For $" button that seeded the `Add = buy` verb (see COPY-RULES) |
| **DH-216** | DreamHost's current AI builder **Liftoff has no domain search inside the builder** — domain choice happens in the panel hosting flow. Meanwhile dreamhost.com actively markets "Remixer". | verified | 06 Aug 2026 | KB 30431847335828 + observed banner/FAQ → `search.md` | Why in-builder domain purchase is new ground for us · POSITIONING §2 |

### 1D. Infrastructure, hosting, staging, mail

| ID | Fact | Status | Date | Source | Depends on it |
|---|---|---|---|---|---|
| **DH-301** | SSL is Let's Encrypt and is said to take **~10–30 minutes** to issue, so a connected domain resolves before the padlock appears. | unverified | Aug 2026 | **No traceable source.** Appears only in `CLAUDE.md` and the hand-off "Real product facts"; no research document or KB citation anywhere in the repo | "Don't claim instantly secured" · the third checklist item · `StatusScreen` (which currently ticks SSL and Connected together → §2.17) |
| **DH-302** | The free staging host is **`*.remixer.site`** in the current design artefacts and **`*.remixer.app`** in the audit and the raw dossiers. One of them is wrong; neither cites a first-party page. | unverified (conflict) | 20 Aug 2026 | `.site`: `CLAUDE.md`, hand-off, `domains.ts` `STAGING_HOST`, `PublishPanel.tsx`. `.app`: `synthesis-q3-2026.md` §6/§7-19/§8.4, `archive/raw-research/lenses.json` | Every frame that prints the preview address → §2.9. **Confirm against the live product before any copy ships** |
| **DH-303** | The staging preview is **always free and hidden from Google**. | likely | Jun 2026 | hand-off "Trial logic"; self-report, no KB or robots/noindex evidence in the repo | `PublishPanel.tsx` "Private preview · always free · hidden from Google" · Launchpad structure |
| **DH-304** | **SmartEdge**, DreamHost's first-party CDN, runs **10 PoPs**. The number is not disputed; the audit's framing of it as a moat is (Cloudflare runs 300+). | likely | Aug 2026 | `synthesis-q3-2026.md` §6; `synthesis-critique.md` §2 (framing) | POSITIONING §3 (rented vs owned) · rollback copy (DH-310) |
| **DH-305** | DreamHost **operates its own mail platform** — so we are registrar + host + mail provider in one account. This structural fact is what §8.2 of the audit is built on. | verified (our ground truth) | Aug 2026 | `synthesis-q3-2026.md` §1.3, §8.2 | POSITIONING §3 · the mailbox play · but see DH-306 and CMP-018/CMP-020 |
| **DH-306** | "One mailbox is a provisioning call costing cents." | unverified | Aug 2026 | `synthesis-q3-2026.md` §8.2, challenged in `synthesis-critique.md` §2 — provisioning is cents; deliverability, IP reputation, KYC, abuse and mail support are not | Any economics claim about bundling a mailbox into DH-001 |
| **DH-307** | "DreamHost holds a large book of registered, unused domains." **No number exists anywhere in this repo**, and whether registration data may legally be targeted this way was never examined. | unverified | Aug 2026 | `synthesis-q3-2026.md` §8.1; `synthesis-critique.md` §2, §5 | The entire zero-record thesis rests on this. POSITIONING states the dependency explicitly |
| **DH-308** | **Unknown: what share of DreamHost-registered domains already point their nameservers elsewhere** (mostly Cloudflare). Those domains cannot be fixed by records we write server-side. | unverified | Aug 2026 | `synthesis-critique.md` §6 Q5; `world.ts` axis `dh-external-ns` | Sizing the zero-record play · why the `dh-external-ns` branch must exist · why "never mention nameservers" is unsafe |
| **DH-309** | **Unknown: whether the mail API can provision a mailbox and write MX/SPF/DKIM/DMARC transactionally** alongside the A record. Decides whether Email is a button in the rail or a link out. | unverified | Aug 2026 | `synthesis-q3-2026.md` §10.2 Q16 | Mailbox card design · "correct by construction" claim |
| **DH-310** | **Unknown: how fast SmartEdge purges across its PoPs.** The audit's rollback copy ("visitors will see the previous version within about 30 seconds") has no measured basis and the critique calls it unkeepable across recursive resolvers. | unverified | Aug 2026 | §10.2 Q19; `synthesis-critique.md` §4.2 | Any rollback confirmation copy |
| **DH-311** | **Unknown: whether Remixer emails or pushes a notification when a domain goes live.** Assumed once, then softened out of the copy. | unverified | Jun 2026 | hand-off open item 1 | The "we'll email you" line is **banned** until this resolves — see COPY-RULES · Connecting/Status frames use "Refresh status" instead |

### 1E. Brand, colour, type

| ID | Fact | Status | Date | Source | Depends on it |
|---|---|---|---|---|---|
| **DH-401** | Colour semantics in our design system: **blue `#1587FF` = action · indigo/violet = brand, plan, AI · green = live · amber = connecting / needs attention.** | verified (our spec) | Aug 2026 | `CLAUDE.md` verified-facts block; hand-off "Brand / colors"; matches Lovable's discipline | Every control · `index.css` `--action` · `--live` / `--attention` |
| **DH-402** | **What production actually paints is not DH-401.** Measured on the live Remixer (`panel.dreamhost.com/ai-editor`, 13 Aug 2026): Publish is `#0073EC` (the light-mode token) and `#1587FF` is defined but unused; the production blue ramp mixes two hues — `--blue-100…500` are alphas of `#2554F7`, `--blue-600…1000` are `#0073EC`. The prototype deliberately corrects both. | verified | 13 Aug 2026 | measurement recorded in `prototype/src/index.css` token-layer comment | §2.10 · any "verified brand rule" statement · the dev hand-off (this is a production bug, not a token to copy) |
| **DH-403** | **Shell background:** the brief and the audit say `#18181B`; the 2026 Figma redesign (node 25819:143144, captured 16 Aug 2026) puts the shell on **`#09090b`** and demotes `#18181b` to `gray-900`, a panel colour. | verified | 16 Aug 2026 | Figma redesign → `CLAUDE.md` geometry block; `prototype/tailwind.config.js`, `index.css` | §2.11 · every surface token · the audit's "cool near-black" AI-slop argument, which was written against the old value |
| **DH-404** | Brand typefaces are **Gilroy** (names, numbers) and **Proxima Nova** (prose) — both commercial, not committed to this public repo. The prototype renders OFL stand-ins: **Figtree for Proxima Nova, Outfit for Gilroy**. Design cannot be approved on the stand-ins. | verified | Aug 2026 | `CLAUDE.md` fonts block; `prototype/public/fonts/README.md` | Every screenshot's line lengths · the checkout sheet's 600px width decision · audit §9.2 |
| **DH-405** | The credit balance sits **permanently in the top toolbar**. GoDaddy exiles it to a separate page — their single loudest complaint (CMP-038). | verified (ours) | Aug 2026 | `synthesis-q3-2026.md` §6 | Toolbar layout · the "credits always visible" rule |
| **DH-406** | The **live address sits in primary chrome** (centred domain switcher). The audit adds that no competitor does this; the *explanation* it offers ("because for them attaching a domain is a multi-hour operation") is an invented cause, per the critique. | verified (ours) / unverified (the causal claim) | Aug 2026 | `synthesis-q3-2026.md` §6; `synthesis-critique.md` §2 | Toolbar · POSITIONING (state the observation, never the invented reason) |

### 1F. Competitors (`CMP`)

Only the competitor facts our own design decisions lean on. Deeper detail stays in
`docs/competitors/`. Where the audit and the critique disagree, the critique wins and the
row says so.

| ID | Fact | Status | Date | Source | Depends on it |
|---|---|---|---|---|---|
| **CMP-001** | **Lovable:** *"Publishing itself is free. Only backend activity — such as database operations and AI features — consumes Run credits."* | verified | Aug 2026 | Lovable docs → `synthesis-q3-2026.md` §1.1 | POSITIONING §1 — the comparison line that beats us |
| **CMP-002** | **GoDaddy Airo:** credits are consumed only by agent actions; *"Credits are not used for non-agent actions"* — and publishing is not an agent action. | verified | Aug 2026 | GoDaddy docs → §1.1 | POSITIONING §1 |
| **CMP-003** | **Bolt** exempts version restores, UI-button actions and security audits. **Base44** exempts all manual visual edits and every database read/write. **Figma Make** stages edits credit-free until you press apply. | verified | Aug 2026 | §1.1, §5.2 | POSITIONING §1 · the free-lane idea |
| **CMP-004** | **Emergent** is the only product in the sweep with an analogue to our publish charge: **50 credits/month as rent on an active deployment**. | likely | Aug 2026 | §1.1 (fourteen products compared) | POSITIONING §1 — the only company we resemble on this line |
| **CMP-005** | Emergent's Trustpilot rating of ~2.7/5. | unverified | Aug 2026 | §10.1 "single-source / medium confidence" | **Do not quote in any deck.** `CLAUDE.md` currently states it as fact → §2.14 |
| **CMP-006** | **Lovable is a full registrar** — sells domains in-app, registers with no project attached, supports transfer-in with EPP, transfer-out, WHOIS privacy toggle: *"Lovable becomes the registrar for that domain."* | verified | Aug 2026 | Lovable docs → §1.1 | POSITIONING §2 — "selling a domain" is table stakes, not a moat |
| **CMP-007** | **v0/Vercel** sells domains inside the publish flow (Publish → Customize → Buy a Domain) at registrar cost. **Bolt** resells; **Base44** resells via Wix or IONOS; **Emergent** resells IONOS free for year one with SSL in under ten minutes. | verified | Aug 2026 | §1.1 | POSITIONING §2 |
| **CMP-008** | **Lovable and Replit both bought Entri.** Replit's release note, 5 Jun 2026: *"custom domain DNS setup automated; users no longer need manual record configuration."* Webflow uses it too ("Quick connect… powered by Entri"). | verified | Aug 2026 | Replit/Lovable/Webflow docs → §1.1, `connect.md` §4.1 | POSITIONING §3 (the rail is buyable) · STD-009 |
| **CMP-009** | **Lovable's domain state machine has 8 named states with a verb on each:** Pending · Verifying · Unable to verify (a *designed* 1-hour timeout) · Setting up · Stalled/Failed (**Retry**, explicitly not remove-and-re-add) · **Ready** (DNS fine, project not published) · Live · Offline. The best-named machine in the field. | likely | 19 Aug 2026 | Lovable docs/FAQ read via search extraction → `connect.md` §5.1 | Our state vocabulary · the two states we lack (`ready`, `waiting-on-you`) · COPY-RULES |
| **CMP-010** | **The anti-patterns:** Vercel's `Invalid Configuration` and Netlify's `Awaiting External DNS` name the machine's opinion, not the user's next move — and generate multi-year forum threads. | verified | 19 Aug 2026 | vendor docs + community threads → `connect.md` §5.2 | COPY-RULES (failure copy) |
| **CMP-011** | **Shopify** auto-detects the registrar and shows "Connect automatically" for **exactly three providers: Cloudflare, GoDaddy, IONOS**; everyone else gets manual instructions. Auto-connect also *silently satisfies ownership verification*. | verified | Aug 2026 | Shopify help → `search.md`, `connect.md` §4.2, §7 | Our fork design · the argument for buying a rail (it deletes a whole concept) |
| **CMP-012** | **Collisions:** Squarespace resolves "already connected to another site" **self-serve**; Shopify dead-ends the user into contacting support with proof of ownership — a documented, recurring complaint. | verified | Aug 2026 | vendor help + community → `search.md`, `connect.md` §9 | `dh-in-use` design — put the choice in the user's hands |
| **CMP-013** | **Wix** offers two named options with consequences spelled out: *"Redirect it to the primary domain"* / *"Replace the current primary domain… the site's current domain will be disconnected."* | verified | Aug 2026 | Wix help → `search.md` | `dh-in-use` copy model |
| **CMP-014** | **GoDaddy Airo already does zero-record connect** for domains on GoDaddy nameservers ("Airo AI Builder automatically updates your DNS") — but it sits four clicks deep in a settings tree, and their in-builder domain purchase ejects to the storefront. | verified | 19 Aug 2026 | GoDaddy help → `connect.md` §4.3 | **POSITIONING §2/§3 — the mechanism is not ours, the placement is** → §2.18 |
| **CMP-015** | **Hostinger** auto-connects its own domains and hands out nameserver/A-record instructions plus an "I've Updated NS/DNS" button for external ones; **Horizons ejects the user to hPanel** to do it. | verified-doc / likely (Horizons) | 19 Aug 2026 | Hostinger docs → `connect.md` §4.3 | POSITIONING §2 · the cautionary twin |
| **CMP-016** | **GoDaddy Airo pricing:** Free $0 / 50 credits / **0 published sites** · Starter $9.99 (150 credits, 1 site) · Professional $24.99 (300, 10; adds Connect a domain) · Ultimate $99.99 (750, 50 — credit figure unverified). Measured burn ~8 credits/prompt (single reviewer). | verified (tiers) / unverified (Ultimate credits, burn) | Aug 2026 | GoDaddy pricing → §4.3.4 | Price comparison tables · the "free tier that cannot publish" contrast |
| **CMP-017** | Cheapest paid entries elsewhere: **Lovable Pro $25/mo · v0 Plus $30/user/mo · Hostinger Explorer $6.99** (capped at 30 credits). | verified | Aug 2026 | §6 | DH-001's "cheapest paid entry" claim |
| **CMP-018** | **Nobody in the AI-builder cohort ships a mailbox.** Lovable does outbound only and its docs say it does not provide mailboxes; Base44: *"Custom email domains are for sending only"*; Bolt's domain docs never mention mail; v0 has none; GoDaddy **resells** Microsoft 365 at $7.99/mo; Hostinger ladders mailboxes 0/1/2/5 by tier. | verified | Aug 2026 | vendor docs → §8.2 | The mailbox play — but read with CMP-019/CMP-020 before calling it a moat |
| **CMP-019** | **Cloudflare gives away the two things the moat is built on:** registrar at cost, the fastest one-click domain attach in existence, Pages/Workers hosting, 300+ PoPs, **and free inbound Email Routing**. It is absent from the audit entirely. | verified | 16 Aug 2026 | `synthesis-critique.md` §1, §5 | POSITIONING §3 · the strongest counter to §8.1/§8.2 |
| **CMP-020** | The audit's claim that registrar + host + mail *"exists nowhere else in this field"* is **wrong**: Wix (which owns Base44), GoDaddy, IONOS and Hostinger all have exactly that combination. | refuted | 16 Aug 2026 | `synthesis-critique.md` §1 | **This was the load-bearing sentence of §8.** POSITIONING must never repeat it |
| **CMP-021** | The audit's four "why nobody can copy it" claims are refuted. Correct framing: **a 12–18 month head start on an undefended position.** Entri is a purchase order, Domain Connect is an open spec, Cloudflare Email Routing is free, and GoDaddy is conceded to be structurally capable. | refuted | 16 Aug 2026 | `synthesis-critique.md` §2 | POSITIONING throughout |
| **CMP-022** | Airo free-tier sites land on `godaddysites.com`. | refuted | Aug 2026 | §10.1 — free cannot publish at all; paid Airo lands on `*.airoapp.ai`; `godaddysites.com` is the legacy Websites+Marketing product | Any Airo comparison frame |
| **CMP-023** | Airo's SEO and code-quality scans are free. | refuted | Aug 2026 | §10.1 — security and QA scans are free; **SEO and legal scans cost credits**; repairs always cost | Comparison of free-action lists |
| **CMP-024** | Wix domain renewal ≈ $17.35/yr. | refuted | Aug 2026 | §10.1 — it is ≈ **$13.35/yr**; Wix email is a separate add-on (Google Workspace ≈ $6/user/mo annual), not bundled | Price comparison tables |
| **CMP-025** | Firebase Studio was shut down on 19 Mar 2026. | refuted | Aug 2026 | §10.1 — 19 Mar 2026 was the *announcement*; new signups off 22 Jun 2026; **shutdown and data deletion 22 Mar 2027**. Successors: Google AI Studio **and Google Antigravity** | "Google killed it" as a trust argument |
| **CMP-026** | Hostinger Horizons has a 7-day no-card trial. | unverified | Aug 2026 | §10.1 — the pricing page advertises a permanently free plan with no card plus a 30-day money-back guarantee | Trial comparison (DH-003) |
| **CMP-027** | Figma sells "~15,000 credits for ~$350". | refuted | Aug 2026 | §10.1 — not among the listed packages (5,000/$120 · 7,500/$180 · 10,000/$240) | Top-up ladder comparison (DH-007) |
| **CMP-028** | Base44 runtime ceilings (150 ops/min, 5,000-item cap, 3-min automation cutoff, 5-min function limit, 50 functions, no self-serve backups/SQL/indexing). | unverified | Aug 2026 | §10.1 — single adversarial source that itself concedes the figure "isn't documented anywhere" | Nothing may cite these |
| **CMP-029** | Airo has no keyboard shortcuts / no inline diffs / bimodal radii / is desktop-only. | unverified | Aug 2026 | §10.1 — primary docs returned HTTP 403; estimated from one marketing screenshot | Nothing may cite these |
| **CMP-030** | Bolt Trustpilot 1.4/5 · Bolt hidden Pro-tier token counts · Bolt's upstream registrar being Name.com · Bolt reload SKU prices. | unverified | Aug 2026 | §10.1 — single-source / medium confidence | Nothing may cite these |
| **CMP-031** | Lovable's chat-panel pixel width and Lovable's in-app domain registration prices. | unverified | Aug 2026 | §10.1 — behind auth / not published. **Do not quote a figure** | Our chat width came from *our own* Figma (432px), not from Lovable |
| **CMP-032** | **Lovable's manual fallback records:** A → `185.158.133.1`, TXT at host `_lovable` starting `lovable_verify=`. Ownership proof patterns elsewhere: `_vercel`/`vc-domain-verify=`, `_webflow`, `shopify_verification`, Squarespace's verification CNAME to `verify.squarespace.com`. | verified | Aug 2026 | vendor docs → §1.1, `connect.md` §7 | What a record table looks like when we must show one |
| **CMP-033** | **Anti-generic mechanisms in the field:** Lovable renders 3 design directions before writing code, Base44 returns 4, Google AI Studio returns 5 free, v0 declares a named direction and writes tokens first. We have none. | verified | Aug 2026 | §1.3, §5.1 row 15 | POSITIONING §5 (the upstream constraint) |
| **CMP-034** | **Lovable's own wounds:** credit expiry is its most-complained-about feature (monthly credits expire 2 months after issue; annual 1 month after period end; top-ups 12 months; daily grants same-day) and **a zero balance pauses a live app's backend**. | verified | Aug 2026 | Lovable pricing FAQ + docs → §3.7 | DH-010 (our undefined position is worse than a bad defined one) |
| **CMP-035** | **Honest waiting copy in the field:** Figma Sites — SSL *"typically takes up to 15 minutes, but can sometimes require additional time"*; Replit — *"a few minutes up to 48 hours"*; Shopify — *"up to 48 hours… to be fully live"*; Squarespace shows the pending state **to visitors**. | verified | 19 Aug 2026 | vendor docs → `connect.md` §5.2 | COPY-RULES (waiting copy) → §2.16 |
| **CMP-036** | **Squarespace auto-unlinks a domain after 15 days** if the verification CNAME is missing or wrong. | verified | 19 Aug 2026 | Squarespace help → `connect.md` §6 (failure 13) | The abandoned-connect state we don't draw |
| **CMP-037** | **Framer is the only vendor publishing a per-action credit price list.** | verified | Aug 2026 | §2 field table → DH-012 | The "always free / what things cost" panel |
| **CMP-038** | **GoDaddy exiles the credit balance to a separate page** — their loudest documented complaint. | verified | Aug 2026 | §6 | DH-405 — why the chip stays in the toolbar |

### 1G. Standards and market mechanics (`STD`)

| ID | Fact | Status | Date | Source | Depends on it |
|---|---|---|---|---|---|
| **STD-001** | `domainconnect.org`'s live **DNS-provider list: IONOS, Cloudflare, Domain Chief, Glauca Digital, GoDaddy, NameSilo, Plesk, Vercel, WordPress.com.** DreamHost is not on it (DH-201). | verified | Aug 2026 | domainconnect.org/dns-providers → `search.md` | `world.ts` `external-dc` bucket · registrar-detection design |
| **STD-002** | **Cloudflare supports Domain Connect as a DNS provider** — its own docs page (`developers.cloudflare.com/dns/reference/domain-connect`) plus the provider list, plus it is one of Shopify's three auto-connect providers. | verified | 19 Aug 2026 | Cloudflare docs + STD-001 → `connect.md` §4.2, §11.1 | **This corrected our own `world.ts`** → §2.4. Still wrong in the hand-off |
| **STD-003** | **Namecheap does not support Domain Connect** — absent from the provider list, no support announcement found. It is the canonical manual case, not Cloudflare. | likely | 19 Aug 2026 | absence on STD-001 list → `connect.md` §4.2 | `world.ts` `external-manual` exemplar |
| **STD-004** | A Cloudflare-fronted domain still fails verification while the **proxy is on ("orange cloud")** — it must be set to **DNS only**. Figma states the requirement verbatim; Lovable ships an advanced toggle for it. | verified | 19 Aug 2026 | Figma + Lovable docs → `connect.md` §6 (failure 5) | The Cloudflare triage card · "automatable, but with a triage card" |
| **STD-005** | Domain Connect support is **detectable before the user clicks**: TXT `_domainconnect.{domain}` → settings GET → template GET. Three silent server-side calls, milliseconds. | verified | Aug 2026 | Domain Connect spec + Vercel docs → `search.md` §technical-detection | The fork in the connect flow can be decided *before* showing the user anything |
| **STD-006** | Discovery only works if the domain's **authoritative DNS provider** supports it: *"The settings endpoint returns a 404 if the domain is not using Vercel's nameservers."* A GoDaddy-registered domain pointed elsewhere will not discover as GoDaddy. | verified | Aug 2026 | Vercel docs → `search.md` | Why registrar ≠ DNS provider in our copy · DH-308 |
| **STD-007** | Domain Connect is **becoming an internet standard**: IETF working group `dconn`, `draft-ietf-dconn-domainconnect-03` published **3 Jul 2026**, milestone to send to the IESG for Standards Track. | verified | 19 Aug 2026 | IETF datatracker → `connect.md` §4.2 | The build-vs-buy calculus (STD-009) · POSITIONING §3 |
| **STD-008** | Three different Domain Connect "size" numbers are on record and they measure different things: **9 live DNS providers** (STD-001) · **110+ participating providers, 300+ templates from 120+ service providers** · APNIC's **~20 implementing providers managing 35% of the `.com` zone** (as of May 2024). Do not merge them. | likely | 19 Aug 2026 | domainconnect.org; APNIC Dec 2025 → `search.md`, `connect.md` §4.2 | Any coverage claim in a deck → §2.7 |
| **STD-009** | **Entri pricing: ~$249/mo for 600 automatic connections a year, plus ~$500/mo for custom-domain SSL infrastructure ≈ ~$749/mo before the first customer.** Both source documents hedge this figure. | unverified | 19 Aug 2026 | `synthesis-q3-2026.md` §1.1 marks it "(unverified pricing)"; `connect.md` §4.1 marks it `[likely]` | Every "buy the rail" argument. **`CLAUDE.md` states it without a hedge** → §2.8 |
| **STD-010** | **Entri coverage: "60+ DNS providers with direct API login"** (product page) and a 2026 third-party comparison claiming it *"automatically detect[s] and configur[es] DNS for 75% of domains"*. The 40–50% figure in the audit was **Domain Connect's** coverage, not Entri's. | likely | 19 Aug 2026 | `connect.md` §4.1 | §2.7 · sizing the manual fallback |
| **STD-011** | **Entri's most stealable half is the fallback, not the API:** per-registrar step-by-step instructions, a **deep link into that provider's DNS settings page**, pointer to your own KB articles, full white-labelling, and a **webhook the moment the domain is live**. | likely | 19 Aug 2026 | Entri product material → `connect.md` §4.1, §12.2 | The guided-manual screens we can build without a PO · DH-311 (the webhook is what would make "we'll tell you" real) |
| **STD-012** | **Entri × GoDaddy (Jun 2025)** folds GoDaddy's Domain Connect into Entri — the two rails are converging. | verified | 19 Aug 2026 | prior research → `connect.md` §4.1 | Build-vs-buy timing |
| **STD-013** | **ICANN sunset WHOIS for gTLDs on 28 Jan 2025**; RDAP is now the authoritative registration-data protocol, so every gTLD registry runs an RDAP server. | verified | Aug 2026 | icann.org announcement → `search.md` | Availability + registrar detection architecture |
| **STD-014** | **RDAP mechanics:** `rdap.verisign.com/com/v1/domain/{name}`; **404 = not in the registry**, which is *not* the same as "buyable" (reserved and registry-premium names complicate it); the **registrar name and IANA ID are always public and structured**, never redacted by privacy — so "Registered at GoDaddy" is reliable for gTLDs. | verified | Aug 2026 | Verisign/RDAP docs → `search.md` | The taken-domain state (which our Figma still lacks) · registrar detection copy |
| **STD-015** | **~60% of ccTLDs have deployed RDAP**; `.de .uk .cn .jp .ca .au` still answer only over WHOIS, so registrar detection there means parsing unstructured text. | likely | Feb 2026 | APNIC blog → `search.md` | Where "we can see who it's registered with" stops being true |
| **STD-016** | **Rate limits are the real constraint:** Verisign publishes none but signals 429 + `Retry-After`; `rdap.org` is capped at 10 requests / 10 seconds; port-43 WHOIS blocks after as few as 2–3 requests, for minutes to 24 hours. | verified | Aug 2026 | RDAP/WHOIS docs → `search.md` | Search-as-you-type architecture · error states |
| **STD-017** | **DNS NXDOMAIN** is a millisecond first-pass availability signal but false-positives on parked, expired-in-grace and nameserver-less domains. Production pattern: DNS → RDAP to confirm → authoritative registrar/EPP check at checkout. | verified | Aug 2026 | canyougrab.it guide → `search.md` | Why a search result can flip between typing and checkout |
| **STD-018** | **Registrable-domain extraction is the Public Suffix List** (eTLD+1). Naive dot-splitting breaks on `co.uk`; `https://shop.trulieve.com/page` must resolve to `trulieve.com` + subdomain `shop`. | verified | Aug 2026 | publicsuffix.org / tldextract → `search.md` | The universal field's paste handling |
| **STD-019** | **1,437 delegated TLDs** in the IANA root (June 2026 snapshot). Validating the last label against that list is how a field knows `.xyz123` is not real. | verified | Jun 2026 | IANA root snapshot → `search.md` | Field validation · "did you mean .com" |
| **STD-020** | **DNS length limits: 63 octets per label, 253 characters total** (RFC 1035). Note this is a *different* limit from DreamHost's 67-character purchase-flow cap (DH-117). | verified | Aug 2026 | RFC 1035 → `search.md` | Field validation copy — say which limit was hit |
| **STD-021** | **IDNs normalise via UTS-46** (NFC → ToASCII/punycode per label); Verisign RDAP accepts both forms; four characters stay ambiguous between IDNA2003/2008 (German sharp-s, Greek final sigma, ZWJ, ZWNJ). | verified | Aug 2026 | unicode.org TR46 → `search.md` | Non-ASCII input handling |
| **STD-022** | **Registry-premium pricing is exposed via the EPP Registry Fee Extension (RFC 8748)** — which is how other registrars can render a premium state in real time. Irrelevant to our UI because of DH-114: premium and aftermarket statuses collapse to plain "taken". | verified | Aug 2026 | RFC 8748 → `search.md` | Why our taken-state has no price and no offer |
| **STD-023** | **Domainr's status vocabulary** is the industry vocabulary for a search field: `inactive` (available) · `active` (registered) · `premium` · `marketed` · `reserved` · `transferable` · `pending` · `deleting` · `expiring` · `invalid` ("technically invalid, e.g. too long or too short"). | verified | Aug 2026 | domainr API docs → `search.md` | The states our search must be able to render |
| **STD-024** | **Search-as-you-type mechanics:** ~300 ms debounce, cancel stale requests, fire only when the string parses to a complete valid domain, cache client-side. Sub-200 ms responses are the commercial benchmark. | likely | Aug 2026 | multiple API guides → `search.md` | Interaction spec for the universal field |
| **STD-025** | **GoDaddy's availability API** is the reference shape: returns `available`, `definitive` (live registry vs cached), `inventory`, `prices[]` in cents with `renewalPrice`; 60 req/min; prices are "indicative" at search time and lock only at quote generation. | verified | Aug 2026 | developer.godaddy.com → `search.md` | Why a shown price is provisional (DH-112) · what our own API must return |
| **STD-026** | **What automation is worth, in the field's own words:** *"What took 40 minutes with a 50% failure rate now succeeds virtually every time in under a minute."* | verified | Dec 2025 | APNIC on Domain Connect → `search.md` | The argument to put in front of whoever signs the Entri PO |

---

## 2. Contradictions on record

Every place in this repository where two documents state different values for the same
fact. Each entry names the fact ID, quotes both sides with paths, and says which one wins
and why. **Nothing here is a hypothetical.** Items marked ⚑ were found while building this
register and had not been recorded anywhere before.

*How a contradiction gets closed:* fix the losing document (or delete the sentence), set
the register row to the winning value, and leave the entry below in place with a
`closed dd Mon yyyy` note. Entries are not deleted — a closed contradiction is the record
of why a value looks the way it does. The resolution rule is source strength; where two
sources are equally strong, **both** drop to `likely` and the fact becomes an open question
(the full procedure is playbook 3 in `docs/global/PLAYBOOKS.md`, and the decision behind
this file is `docs/decisions/0004-facts-live-once-in-a-register.md`).

### 2.1 `.io` price — DH-104

- `docs/features/domains/handoff-design.md` → "Domain prices: … `.io $39.99`"
- `docs/features/domains/research/search.md` §dreamhost-facts + `prototype/src/data/domains.ts` → `.io $34.99 / $59.99 renew`
- **Winner: $34.99 / $59.99.** The research read the official pricing table in USD on a
  named date; the hand-off's figure predates it and carries no source. The hand-off's own
  corrections block (19 Aug 2026) already concedes this, but the body text still prints
  $39.99 — a reader who skips the block gets the wrong number.

### 2.2 ⚑ `.online` price — DH-107

- `docs/features/domains/handoff-design.md`, body ("Domain prices") → "`.online $0.99`"
- **The same file**, corrections block at the top → "`.online $1.99`"
- Research + `domains.ts` → `.online $1.99 / $29.95 renew`
- **Winner: $1.99.** This is the one collision that is *inside a single document*: the
  hand-off's correction block fixes `.online` and the price list twelve lines below it still
  says $0.99. Anyone reading the file top-to-bottom takes the corrected number; anyone
  jumping to the price list — which is what a designer filling in a frame does — takes the
  wrong one. The fix is to correct the list in place, not to add a third note.

### 2.3 `.ai` price shape — DH-110

- Hand-off → "`.ai $179.98 (2-yr min)`", printed in a list of annual first-year prices
- Research → `.ai $89.99/yr` with a 2-year minimum, "front page shows $179.98/2 yr"
- **Winner: both numbers, stated as two facts.** $89.99 is the yearly price; $179.98 is
  what the customer pays today because the minimum term is two years. The hand-off's
  version reads as a one-year price of $179.98, which makes `.ai` look twice as expensive
  as it is. `TLD_PRICES` carries `register: 89.99` plus the note "2-year minimum" — correct,
  but the checkout sheet must show the $179.98 total or it will surprise at the card step
  (violating price-before-cart).

### 2.4 Cloudflare and Domain Connect — STD-002

- `prototype/src/state/world.ts` (before 19 Aug 2026) → "External registrar without it
  (Namecheap, **Cloudflare**) — guided manual records only"
- Hand-off, scenario 3 → "manual nameservers/DNS for others (Namecheap/**Cloudflare**)"
- `connect.md` §4.2/§11.1 + `search.md` §technical-detection → **Cloudflare supports Domain
  Connect** (own docs page, on the provider list, one of Shopify's three auto-connect providers)
- **Winner: Cloudflare supports it; Namecheap is the manual exemplar.** `world.ts` and
  `CLAUDE.md` are fixed; **the hand-off is not** — its correction block never mentions
  Cloudflare, so scenario 3 still tells a designer to draw Cloudflare on the manual path.
  Caveat that must travel with the fix: STD-004 — Cloudflare is *automatable with a triage
  card*, not "easy".

### 2.5 One-click Domain Connect for external domains — DH-201, DH-202

- Hand-off, scenario 3 → "**Domain Connect one-click** for ~50 registrars
  (GoDaddy/Squarespace/IONOS/Google)"
- `search.md` + `connect.md` §11.2 → DreamHost supports Domain Connect **in no role**;
  one-click requires buying Entri (STD-009)
- **Winner: the research.** The hand-off's corrections block agrees, and the rule it sets
  is the one to keep: a one-click consent frame is a *purchase-order-dependent design* and
  lives in Alternates, never in the main flow. The "~50 registrars" number is also wrong on
  its own terms — see 2.7.

### 2.6 ⚑ Where the state machine's names come from — CMP-009

- `synthesis-q3-2026.md` Tier 2 item 18 → states named "Pending / **Provisioning DNS** /
  **Issuing SSL certificate** / Live / Ready / Needs attention / Offline"
- `connect.md` §12.1 → seven states named for the user's next move: `connecting`,
  `waiting-on-you`, `securing`, `ready`, `live`, `needs-attention`, `taken-over`
- **Winner: `connect.md`.** The audit's own list breaks the audit's own de-jargon rule —
  "Provisioning DNS" and "Issuing SSL certificate" are exactly the vocabulary CLAUDE.md
  bans in primary paths, and they are lifted verbatim from Lovable's *internal* labels. Use
  `connect.md`'s vocabulary; keep the audit's list only as evidence of what Lovable shows.

### 2.7 Entri vs Domain Connect coverage — STD-008, STD-010

- `synthesis-q3-2026.md` §1.1 → an Entri coverage figure of 40–50%
- `connect.md` §4.1 → "60+ DNS providers with direct API login"; a 2026 third-party claim of
  "75% of domains"; and the explicit note that **the 40–50% figure was Domain Connect's
  coverage, not Entri's**
- Hand-off → "~50 registrars" for Domain Connect
- **Winner: `connect.md`.** Three numbers describing three different things had been
  collapsed into one. Nothing here is `verified`; any coverage claim in a deck must carry
  the hedge and the measure it belongs to (STD-008).

### 2.8 ⚑ The status of the Entri price — STD-009

- `CLAUDE.md`, section "Ключевые проверенные факты" (i.e. *verified* facts) → "~$249/mo за
  600 подключений + ~$500/mo … = ~$749/mo", stated flat
- `synthesis-q3-2026.md` §1.1 → "(unverified pricing)"; `connect.md` §4.1 → `[likely]`
- **Winner: unverified.** The number itself is fine to design against; what drifted is its
  *status*. It now sits in the project's own list of verified facts, which is precisely how
  an unverified number ends up in a board deck. Fix by citing STD-009 rather than the value.

### 2.9 ⚑ The staging host — DH-302

- `.remixer.site`: `CLAUDE.md`, hand-off ("The `*.remixer.site` staging preview"),
  `prototype/src/data/domains.ts` (`STAGING_HOST`), `PublishPanel.tsx`, `App.tsx`
- `.remixer.app`: `synthesis-q3-2026.md` §6 ("Editable `*.remixer.app` with a pencil
  affordance"), Tier 2 item 19, §8.4 (`branch-name.yourproject.remixer.app`), plus
  `docs/archive/raw-research/lenses.json` and `recon_dossiers.json` throughout
- **Winner: undecided — and that is the finding.** Neither side cites a first-party page.
  The working default stays `.site` (three current artefacts plus project memory), but the
  register keeps DH-302 at `unverified` until someone reads the live product, because a
  wrong preview host is a wrong string on the single most-shown screen in the product. The
  `.app` spelling is also load-bearing in the audit's branch-URL and preview-link
  proposals, which will inherit the error if it is the wrong one.

### 2.10 ⚑ The action blue — DH-401 vs DH-402

- `CLAUDE.md` + hand-off → "**Verified brand rule: blue `#1587FF` = action**"
- `prototype/src/index.css` token-layer comment, measured on the live product 13 Aug 2026 →
  "Production paints Publish `#0073EC`, the light-mode token; `#1587FF` is defined in the
  system and goes unused" — and the production blue ramp mixes `#2554F7` alphas with `#0073EC`
- **Winner: both, at different layers.** `#1587FF` is the design system's action token and
  is what we design and hand off with; `#0073EC` is what production paints today, and that
  is a defect to fix, not a fact to copy. What must stop is the word *verified* attached to
  a rule the shipped product breaks — a developer reading only `CLAUDE.md` will assume the
  code already matches. The audit's "our blue is 3 points from Bolt's" argument (§9.10) also
  compares Bolt to a colour we do not currently ship.

### 2.11 ⚑ The shell background — DH-403

- `CLAUDE.md` verified-facts block → "Фон билдера **#18181B**"; audit §6 → "we hold #18181B throughout"
- `CLAUDE.md` prototype block + Figma redesign 25819:143144 (16 Aug 2026) +
  `prototype/tailwind.config.js` → shell is **`#09090b`**; `#18181b` is `gray-900`, a panel colour
- **Winner: `#09090b`** for anything drawn after 16 Aug 2026. `CLAUDE.md` states both values,
  in two different sections. Consequence worth noting: the audit's AI-slop argument about our "cool
  near-black" was written against `#18181B` and has not been re-run against the darker
  shell (see POSITIONING).

### 2.12 ⚑ Free first-year domain eligibility — DH-115

- Hand-off, open item 3 → "real DreamHost offer, but only valid IF an annual Remixer Build
  plan qualifies for the credit — **unconfirmed**"
- `search.md` §dreamhost-facts → `[verified]` the credit "applies only to ANNUAL Web Hosting
  or DreamPress plans… **This free credit is not available under any other hosting plan**"
- **Winner: the research.** The question is answered, not open: as documented, a builder
  plan does not qualify. Treat it as excluded until DreamHost says otherwise **in writing** —
  and note that the hand-off keeps a "promo" variant alive on the strength of the older,
  softer wording.

### 2.13 ⚑ Zero-record connect: unique or merely unbuilt — CMP-014, CMP-021

- `synthesis-q3-2026.md` §8.1 → "**Why nobody can copy it** … GoDaddy is the one company
  that structurally could and instead ejects you to the storefront"
- `connect.md` §4.3 → GoDaddy Airo `[verified-doc]`: *"If your domain is using GoDaddy
  nameservers, Airo AI Builder automatically updates your DNS"* — **"They already have it."**
  Hostinger has it too. §12.6: "it is a head start, not an impossibility"
- **Winner: `connect.md` and the critique.** The mechanism is built and shipping at two
  competitors. What is ours is the *placement* (in the publish moment, one gesture) and the
  installed base — and the second of those is unquantified (DH-307).

### 2.14 ⚑ Emergent's rating — CMP-005

- `CLAUDE.md`, audit-conclusions list, item 1 → "мы единственные… (кроме Emergent **с
  рейтингом 2.7/5**)", stated as fact in the project's own memory
- `synthesis-q3-2026.md` §10.1 → listed under "**Do not quote these in a deck**",
  single-source / medium confidence
- **Winner: §10.1.** Keep the *structural* fact (CMP-004: Emergent is the only product that
  charges rent on a live deployment) and drop the rating whenever the sentence leaves the
  team. The argument does not need it.

### 2.15 ⚑ "Ahead on speed" vs "we don't know our speed" — DH-014

- `synthesis-q3-2026.md` §6, first row → time to first render "**Ahead** — 2–3 min
  (verified ground truth)"
- Same document, §10.2 Q2 → "What is our real p50 and p90 … not the marketing 2–3 minutes?
  If p90 is 5 minutes we are level with Bolt and the speed claim stops being a weapon"
- **Winner: §10.2.** A document cannot lead a scoreboard with a number it later files as
  unknown. The critique adds that the comparison target (v0's measured 6m21s) included image
  generation and browser QA, so the two figures are not the same operation.

### 2.16 ⚑ "Usually a few minutes" on a path documented at 4–72 hours — DH-203, CMP-035

- `prototype/src/modules/publish/PublishPanel.tsx` and `DomainsSurface.tsx` `StatusScreen`,
  and hand-off ⑥-A Connecting → "**Usually a few minutes** — keep editing, it goes live on
  its own."
- DH-203 (DreamHost KB) → "Nameserver changes can take anywhere from **4–72 hours** to
  fully update online." The field's honest copy for the same operation is "up to 48 hours"
  (CMP-035).
- **Winner: the facts, per path.** "A few minutes" is true and excellent for the in-account
  zero-record case (DH-213: records written server-side, our nameservers already in place)
  and false for anything requiring a nameserver change at another company. One string cannot
  serve both branches; the external branch needs its own honest window. This is currently a
  promise the product cannot keep for an unknown share of users (DH-308).

### 2.17 ⚑ The success checklist ticks SSL too early — DH-301

- `DomainsSurface.tsx` `StatusScreen` → "Connected to your site" and "Security (SSL) on"
  both light up at the same stage (`stage >= 2`)
- DH-301 → the certificate is said to take ~10–30 minutes *after* the domain resolves;
  the hand-off's own rule is "don't claim instantly secured"
- **Winner: the fact.** The checklist's three lines exist precisely to show that the padlock
  arrives last (that is why the order never varies — see COPY-RULES). Ticking items 2 and 3
  together deletes the state the checklist was built to explain. Note DH-301 is itself
  unverified, so the fix needs the real number first.

### 2.18 The renewal price in the Figma boards — DH-101…DH-110

- Figma checkout boards 27058:100133 / 27254:11737 / 27275:33023 → renewal "$11.86"
- Verified pricing table → no TLD renews at $11.86; `.com` renews at $19.99 (DH-101)
- **Winner: the table.** $11.86 is placeholder text. Already flagged in `CLAUDE.md` and in
  `DomainModal.tsx`'s header comment; recorded here so the next person who opens the board
  doesn't re-import it. Same class of problem as the board's three identical
  `gettrulieve.com` result rows.

### 2.19 The verb for buying — see COPY-RULES

- Audit + `CLAUDE.md` → "**Add = buy** · Connect = attach a domain you own · Publish/Update = republish"
- Figma domain boards + `prototype/src/modules/domains/DomainsSurface.tsx` → the button says **Buy**
- **Unresolved, deliberately.** Both sides have provenance: DreamHost's own panel button
  reads "Add For $" (DH-215), which is where "Add" came from; the boards and the prototype
  ship "Buy". The recommendation and the reasoning live in `COPY-RULES.md` §2 — this row
  exists so nobody "fixes" one side silently.

---

## 3. Stated as fact, with no traceable source

Claims that circulate in this repository as facts and cannot be traced to any page, KB
article, measurement or dated observation. They are not necessarily false — they are
unaudited, and each one is currently load-bearing somewhere.

| ID | Claim | Where it is used as if verified | What it would take to close |
|---|---|---|---|
| **DH-301** | SSL (Let's Encrypt) issues in ~10–30 minutes | `CLAUDE.md` verified-facts list; hand-off "Real product facts"; the third line of the success checklist | One measurement on a real connect, or the platform team's number. Competitors publish theirs (CMP-035) |
| **DH-302** | The preview host is `*.remixer.site` | Every publish frame and the prototype | Open the live product once |
| **DH-303** | The preview is hidden from Google | Printed verbatim in `PublishPanel.tsx` | Confirm the `noindex`/robots behaviour with the platform team |
| **DH-307** | DreamHost holds "a large book" of registered, unused domains | The whole zero-record thesis (audit §8.1) and the "targetable list, not a funnel" framing | A query. Also a legal read on whether registration data may be targeted this way |
| **DH-306** | A mailbox "costs cents" | The mailbox-bundling economics | Real unit cost including support minutes, deliverability and abuse |
| **DH-014** | 2–3 minutes to first render | The audit's headline "Ahead" | p50/p90 from production telemetry |
| **DH-304** | SmartEdge = 10 PoPs, first-party | Presented as a structural advantage | Not the number — the *comparison*. 300+ PoPs is the competing figure (CMP-019) |
| **DH-311** | Remixer notifies the user when a domain goes live | Was in the copy; softened out. Still assumed in "it goes live on its own" | Ask whether the notification exists. STD-011 is what would make it real |
| — | "The documented AI-slop fingerprint of 2026" (Inter + indigo gradient + cool near-black + three rounded cards) | Justifies a typeface migration and a palette rebuild (audit §1.3, §9.10) | The critique's question, unanswered: **documented by whom?** No study, no source, no user data. Treat as a taste hypothesis, not a fact |
| — | "No competitor puts the live address in permanent chrome *because* attaching a domain is a multi-hour operation for them" | Used to explain DH-406 | The observation is ours and fine; the *because* is invented. Drop the clause or test it |
