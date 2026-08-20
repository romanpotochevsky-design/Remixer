# Remixer — Positioning

> The strategy every screen is designed against — **and the limits of that strategy**,
> stated in the same document, because the audit that produced it overclaims in places and
> the adversarial read of it says exactly where.
>
> Sources: `docs/competitors/audits/synthesis-q3-2026.md` (the audit) as corrected by
> `docs/competitors/audits/synthesis-critique.md` (the critique), plus
> `docs/features/domains/research/connect.md` §4, §12, which settled two of the arguments
> with evidence. **Where the audit and the critique disagree, the critique wins.** Numbers
> come from `docs/product/FACTS.md` by ID and are not restated here.
>
> Rule for anything built on this document: **where a claim rests on an unquantified base,
> say so in the same sentence.** Three of the four plays below do.

---

## 1. Unmeter the finish line

**The position.** Publishing must cost **zero credits** — first publish and every
republish — and the list of free actions must live inside the product, not in a KB article.

**Why this one comes first.** Publishing currently consumes credits (**DH-008**). Across the
fourteen products the audit swept, every competitor exempts it: Lovable states it in one
sentence (**CMP-001**), GoDaddy has a clean rule that publishing is not an agent action
(**CMP-002**), Bolt, Base44 and Figma Make each carve out their own free lane (**CMP-003**).
The only company that resembles us is Emergent, which charges rent on a live deployment
(**CMP-004**). That makes this the single most attackable line in any comparison table
anyone ever builds about us: it is one row, it needs no explanation, and the reader's
conclusion is that we charge for success.

Three consequences, in order of how much they cost us:

1. **It suppresses republishing** — the behaviour that drives retention and domain attach.
2. **It double-charges the agent's own mistakes**: the fix costs credits, then shipping the
   fix costs credits again.
3. **It is the reason our free/paid boundary cannot be stated in one sentence**, and every
   competitor's can.

**The limit, stated honestly.** We do not know what a publish actually costs us
(**DH-009**) — whether the charge is flat or whether publish re-runs generation work. If it
is the latter, "publishing is free" is not a billing toggle but an unbounded-cost
architecture project, and the audit's "Medium effort" rating was assigned without that
answer. The critique adds the operational caveat: unconditionally free republish inside a
registrar is also an abuse vector, so **design the fair-use boundary now** rather than
announcing "free" and walking it back later. The honest form of the promise is a stated
free-action list plus a rate limit nobody legitimate will ever meet — not the word
"unlimited".

---

## 2. Own the sixty seconds around go-live

**The position.** Not "sell a domain in the builder" — that is table stakes now
(**CMP-006**, **CMP-007**). What we own is the minute in which a site stops being a draft:
the domain attaching, the padlock arriving, the address appearing in the chrome.

**What that means concretely**, in the order it matters:

| # | The move | Why it is ours to make | Fact |
|---|---|---|---|
| 1 | **Zero-record connect for a domain already in the DreamHost account.** No record table, no second tab, no verification concept at all — ownership is an internal lookup. | We are the registrar of record for domains bought years before Remixer existed. Every AI-native competitor can only automate the domain it sold you today. | **DH-213**, **CMP-006/007** |
| 2 | **Put it in the publish moment.** One gesture, at the top of the publish sheet, above the preview address. | This is the actual differentiator — see the limit below. | `connect.md` §12.6 |
| 3 | **A named state machine with a verb on every non-green state**, including the two we do not have: `ready` ("your domain is set up, publish to put your site on it") and `waiting-on-you`. | These are the highest-traffic real states and the category's best-named ones exist to be copied. | **CMP-009**, `connect.md` §12.1 |
| 4 | **Guided per-registrar instructions with a deep link**, built for the top registrars in our own data. | The valuable half of Entri is the fallback, not the API login — and it needs no purchase order. | **STD-011** |
| 5 | **Protect the email.** Detect MX records before touching nameservers and carry them across. | The only business-destroying failure in the catalogue, and DreamHost's own KB already warns that custom records stop working unless recreated first. | **DH-205**, `connect.md` §6 (failure 11) |
| 6 | **Price honesty at the moment of purchase** — renewal never hidden, price before the cart. | Our own rule, and the one thing a novice can actually verify about us. | **DH-112**, COPY-RULES §4 |

**The limit, stated honestly.** The audit called this uncopyable four times over. It is not
(**CMP-021**). GoDaddy Airo **already ships zero-record connect** for domains on GoDaddy
nameservers, and Hostinger does it too (**CMP-014**, **CMP-015**). What neither of them has
done is put it in one gesture inside the AI builder: GoDaddy buries it four clicks deep in a
settings tree and its in-builder domain purchase ejects the user to the storefront. **The
advantage is placement, not plumbing** — a head start on an undefended position, not an
impossibility. And the size of the prize is unmeasured: "a large book of registered, unused
domains" has no number attached anywhere in this repository (**DH-307**), nor a legal read on
targeting it, nor a known share of those domains whose nameservers already point at
Cloudflare and cannot be fixed server-side at all (**DH-308**).

---

## 3. What is ours, and what is rented

The audit's §8 preamble said the registrar + host + mail combination "exists nowhere else in
this field". That sentence is **false** — Wix (which owns Base44), GoDaddy, IONOS and
Hostinger all have exactly it (**CMP-020**) — and it was load-bearing. Here is the honest
ledger.

| Asset | Ours, or rented? | Shelf life |
|---|---|---|
| **Registrar of record for an installed base of parked domains** | **Genuinely ours.** Nobody can buy this; it accumulated. | **A shelf life, not a moat.** It converts or it churns. Unquantified (**DH-307**) |
| **Placement of go-live inside the builder** | Ours today, by default — the competitors who have the mechanism have not done this | Months, not years. It is a design decision, and design decisions are copyable in a quarter |
| **One-click external DNS (Entri)** | **Rented.** A purchase order: ~$249/mo + ~$500/mo for SSL infrastructure | Available to every competitor on the same terms (**STD-009**, **CMP-008**) |
| **Domain Connect** | **Rented, and becoming free.** An open spec now on the IETF Standards Track | Whatever advantage exists here evaporates as the standard lands (**STD-007**) |
| **Mailbox at the domain** | We operate the platform (**DH-305**), which is real — but the moat claim is refuted | Cloudflare gives inbound Email Routing away free; Google, Zoho and Microsoft sell mailboxes through reseller APIs (**CMP-018**, **CMP-019**) |
| **First-party CDN (SmartEdge, 10 PoPs)** | Ours | Presented as a moat; a benchmark reads it as a liability at 300+ PoPs next door (**DH-304**, **CMP-019**) |
| **Cheapest paid entry that includes hosting, SSL and domain connect** | Ours today | Price positions are the most copyable thing in software (**DH-001**, **CMP-017**) |

**Cloudflare is the structural competitor the audit never names** (**CMP-019**): registrar at
cost, the fastest domain attach in existence, hosting, 300+ PoPs and free inbound email. Any
competitor who tells a user "just move your nameservers to Cloudflare" gets zero-record
connect for free, forever, without being a registrar. **Design as if that sentence is on the
next comparison page**, because it is free for anyone to write.

**Two things to stop saying immediately:** "nobody can copy it" and "exists nowhere else in
this field". The defensible version is *"we have a 12–18 month head start on a position
nobody is defending"* — weaker, true, and it produces a different and more useful urgency
(**CMP-021**).

---

## 4. The counter-argument that outranks all of this

Stated in full, because it is the strongest thing anyone will say to us and it may be right:

> **Every play above is post-generation infrastructure UX for users who have already built
> something they like — and most users never get there.**

The audit scores our anti-generic generation **1/5** and our agent loop **2/5**, then ranks
both *below* the domain and publish work. If output quality and edit-loop reliability are
the binding constraint, zero-record attach and a bundled mailbox are luxury fittings on a
room nobody reaches — the world's best last mile for a journey that ends at mile two. The
audit contains **no funnel data whatsoever**, so it cannot rule this out, and its own
scoring implies it. Meanwhile the competitors have shipped the upstream mechanism: three
design directions at Lovable, four at Base44, five free at Google AI Studio (**CMP-033**).

**What this means for prioritisation** — and it is not "stop the domain work":

1. **Instrument the funnel before ranking anything else.**
   `composer_submit → auth_complete → generation_start → first_edit → publish → domain_attach → day-7 return`.
   Until it exists, every priority — including the three above — is a guess.
2. **Measure the output.** Same briefs through us and six competitors; Lighthouse, page
   weight, axe/WCAG, schema/meta/sitemap, plus a blind design ranking. This decides whether
   "anti-generic" is cosmetic or existential.
3. **Keep the go-live work, but size it honestly.** Domains and publish are the last mile
   *for the people who get there*, and the two states with the highest expected traffic
   (`ready`, `waiting-on-you`) cost three frames. Cheap, high-yield, and they do not compete
   with generation quality for engineering time in the way the mailbox does.
4. **Do not fund the mailbox until the veto questions are answered:** unit cost including
   support minutes, deliverability and abuse (**DH-306**), whether MX/SPF/DKIM/DMARC can be
   written transactionally (**DH-309**), and whether SMB owners want a new mailbox at all or
   just want the contact form to reach the Gmail they already use. The last one is a
   fake-door test, not a research project.

---

## 5. Novice-first constraints that veto otherwise good ideas

Our audience is a complete non-technical novice. Several of the audit's own recommendations
fail on that constraint alone, and they are recorded here so they are not re-proposed:

- **"Never mention nameservers."** Unsafe as an absolute. A DreamHost-registered domain
  pointed at Cloudflare's nameservers will not respond to records we write server-side
  (**DH-308**), so hiding the concept entirely makes the failure invisible *and*
  unexplainable. The rule is de-jargon in the **happy path**, with an explicit
  external-nameserver branch that names the situation in plain words.
- **One-click "replace what's at this domain".** Behind a single confirmation this can take
  down a live WordPress site or, worse, live business email. Needs a harder guard and the MX
  detection above (**DH-205**).
- **"Also restore DNS records" as a rollback checkbox.** Silently breaks MX and third-party
  verification TXT records (Search Console, Stripe, Facebook). A one-click,
  hard-to-diagnose, business-affecting footgun for exactly the user who cannot diagnose it.
  And "visitors will see the previous version within about 30 seconds" is a promise we cannot
  keep across recursive resolvers (**DH-310**).
- **Per-message cost receipts on every message.** In direct tension with reducing credit
  anxiety. Putting a price tag on every sentence teaches a novice that talking is expensive
  and suppresses the iteration the product depends on. Pick one: the meter is invisible until
  it matters, or it is on every message. Not both.
- **IDE-grade keyboard model.** Single-letter shortcuts over a canvas break the moment a
  novice clicks into content and types. Ship ⌘K and stop.
- **Design directions *before* the build.** Adds a decision and a wait to the one thing we
  are (probably) ahead on, and asks a novice to choose between three abstractions. The
  post-build variant is the right one.
- **Perpetual free tier + free publishing inside an ICANN-accredited registrar.** Copy the
  retention mechanic, not the eligibility model. Lovable's abuse exposure and DreamHost's are
  not comparable.
- **Unprompted error cards from origin logs.** "Your live site returned 12 errors in the last
  hour" is the resting state of any site on the public internet with bots hitting
  `/wp-login.php`. A permanently amber panel trains people to ignore alerts.

---

## 6. Our own visual identity is a liability the audit may have overstated

The audit's §9.10 argument: Inter + an indigo→purple gradient + a cool near-black + three
rounded cards in a row are "the documented AI-slop fingerprint of 2026", we have three of the
four, and our action blue sits three points from Bolt's.

**Take the warning; do not take it as a fact.** Nobody documented that fingerprint — no
study, no source, no user data (see FACTS §3), and there is no evidence any user has seen our
blue next to Bolt's or cared. Two of the specifics have also moved since the audit was
written:

- The shell is now **`#09090b`**, not the `#18181B` the "cool near-black" complaint was
  written against (**DH-403**).
- The action blue argument compares Bolt to a colour **production does not currently paint**:
  `#1587FF` is the design-system token, while the live product ships `#0073EC` and mixes two
  hues in one blue ramp (**DH-401**, **DH-402**). Fixing that inconsistency is worth more
  than re-picking the hue.

The defensible version of the position: **we should not look like the thing we generate.**
That justifies a bespoke icon family, a real elevation and easing system, and eventually a
non-Inter face — with the brand pair (**DH-404**) already decided. It does not justify
presenting taste as measurement. Name the metric a change is supposed to move, or file it as
Tier 3 and say so.

---

## 7. Claims we do not make

Copy this list into any deck review. Each line is refuted or unverifiable in `FACTS.md`.

| Never say | Because | Fact |
|---|---|---|
| "Nobody can copy this" (any of the four plays) | Refuted four times over; the mechanism ships at two competitors | **CMP-021**, **CMP-014** |
| "Registrar + host + mail exists nowhere else in this field" | Wix, GoDaddy, IONOS, Hostinger | **CMP-020** |
| "Emergent is rated 2.7/5" | Single-source; explicitly on the do-not-quote list | **CMP-005** |
| "We render in 2–3 minutes, versus v0's 6m21s" | n=1 against an unknown p50/p90, comparing different operations | **DH-014** |
| "Making publishing free is a Medium-effort billing change" | We do not know if publish re-runs generation | **DH-009** |
| "One-click domain connect" (as a shipped capability) | DreamHost supports Domain Connect in no role; one-click needs a purchase order | **DH-201**, **DH-202** |
| "Instantly secured" / a padlock at the same instant as the connection | The certificate follows the connection | **DH-301** |
| "We'll email you when it's live" | Nobody has confirmed the notification exists | **DH-311** |
| "Get your domain free for the first year" | The credit is documented as excluding non-Web-Hosting/DreamPress plans | **DH-115** |
| "Make an offer" on a taken domain | No premium sales, no brokerage | **DH-114** |
| Any Domain Connect / Entri coverage percentage without its hedge and its measure | Three different numbers measuring three different things | **STD-008**, **STD-010** |
