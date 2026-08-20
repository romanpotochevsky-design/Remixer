# Blind spots — a work order

The adversarial critique's most important structural finding is not that the audit got a claim
wrong. It is that **whole companies are missing from it** (critique §1). The audit benchmarks
Remixer against four VC-funded dev tools and one registrar, and never benchmarks it against the
cohort DreamHost actually shares a customer with.

This file is the work order for closing that. Each entry names **why it matters**, **the specific
question studying it would answer**, **how to answer it**, and a priority. It is not a reading
list — an entry is done when the question has an answer with a date and a confidence marker on it,
filed as a new page in this folder.

## Priority at a glance

| # | Subject | Priority | The one-line reason |
|---|---|---|---|
| 1 | [WordPress cohort](#1-the-wordpress-cohort--the-biggest-blind-spot-of-all) | **P0** | DreamHost's installed base *is* WordPress, and we have never asked whether Remixer eats it, migrates it, or ignores it |
| 2 | [Cloudflare](#2-cloudflare--the-most-dangerous-omission) | **P0** | Registrar + DNS + host + CDN + **free inbound email routing** — it partially guts the mailbox moat before we build it |
| 3 | [Wix Studio / Wix full stack](#3-wix-studio--the-wix-full-stack) | **P1** | Owns Base44, is a registrar, sells mailboxes — the single fact that makes §8's load-bearing sentence false |
| 4 | [Squarespace](#4-squarespace) | **P1** | The closest *brand* competitor for "small business wants a nice site", now with AI generation |
| 5 | [Webflow](#5-webflow) | **P1** | The design-quality ceiling our whole anti-generic argument should be calibrated against |
| 6 | [Canva](#6-canva) | **P2** | ~200 M MAU and a free website product — the most likely source of a prospect who never searches for an AI builder |
| 7 | [10Web](#7-10web--and-the-rest-of-the-host-with-an-ai-builder-cohort) | **P1, with #1** | The closest thing to "what Remixer would be if it generated WordPress" |
| 8 | [Durable](#8-durable) | **P3** | The extreme speed end — tests whether the agent loop matters at all at the bottom of the market |

**Before any of this:** critique §6 Q1 — instrument
`composer_submit → auth_complete → generation_start → first_edit → publish → domain_attach → day-7
return`, watch 20 session recordings, read 200 support tickets. That is worth more than all the
competitor research below combined, and blind-spot work must not be allowed to displace it. Our own
funnel is a bigger blind spot than any company on this page.

---

## 1. The WordPress cohort — the biggest blind spot of all

**Study:** 10Web, Elementor AI, WordPress.com's AI builder, Bluehost AI, Jimdo/B12 as adjacent.

**Why it matters.** DreamHost's book is overwhelmingly WordPress and DreamPress. The audit never
asks whether Remixer cannibalises it, migrates into it, or ignores it — the critique calls this
*"the largest strategic omission in the document"* and *"the audit's biggest blind spot and the
cheapest CAC in the company"* (critique §1, §6 Q4). Two threads make it urgent rather than
interesting:

- **Import / rebuild-my-site.** GoDaddy ships "Rebuild my site" as a starter chip and the audit
  flags it as a deliberate switcher hook, then never analyses it (critique §1). Importing an
  existing site is the highest-intent acquisition surface a host has, and it is the one thing we can
  do to our own installed base at zero CAC. It also has a legal precondition we have never checked
  (§10.2 Q20: do our terms permit reading a customer's own hosted pages to pre-write a rebuild
  brief, and what consent string does legal require in-flow?).
- **Cannibalisation.** Every DreamPress customer who rebuilds in Remixer is a migration, not a new
  sale — possibly a downgrade. Nobody has sized that.

**The question.** What does Remixer do *to* and *for* DreamHost's WordPress base — how large is the
"rebuild my existing DreamHost site" opportunity in accounts and dollars, and what is the
cannibalisation risk against DreamPress revenue?

**How to answer it.** Two halves. (a) Internal: query the installed base — how many accounts hold a
WordPress site plus a parked or unused domain, what those accounts pay today, what their churn rate
is. This is a data question, not research. (b) External: tear down 10Web and Elementor AI as
products — do they generate *into* WordPress or replace it, and how do they frame the switch to an
existing site owner?

**Priority: P0.** It is the only item here that changes what Remixer *is*, not how it looks.

---

## 2. Cloudflare — the most dangerous omission

**Why it matters.** It appears **zero times** in the audit, and it is the single most dangerous
structural competitor to the entire §8 thesis (critique §1). Cloudflare is a registrar at cost,
authoritative DNS with the fastest one-click domain attach in existence, a host (Pages/Workers), a
CDN with 300+ PoPs against SmartEdge's 10 — and it ships **Email Routing free**, which partially
guts the "real mailbox" moat before it is built.

Two facts sharpen this since the audit was written:

- **Cloudflare supports Domain Connect as a DNS provider** — its own docs page plus a listing on
  `domainconnect.org`, and it is one of exactly three providers in Shopify's "Connect automatically"
  (`connect.md` §4.2) `[verified]`. So *any* competitor can say "move your nameservers to
  Cloudflare" and get zero-record connect for free, forever, without being a registrar. That is our
  §8.1 play, rented for nothing.
- **The catch that makes it a design problem, not just a threat:** while the orange-cloud proxy is
  on, verification fails. Cloudflare is "automatable, but with a triage card", not "easy"
  (`connect.md` §11.1, failure #5) `[verified]`. Figma, Lovable and others all ship explicit
  "set it to DNS only" copy. We will need that card either way.

**The question.** Does Cloudflare neutralise the infrastructure moat? Concretely: **what share of
DreamHost-registered domains already use external nameservers, and how many of those are
Cloudflare?** And what does Cloudflare Registrar + Pages + Email Routing actually cost a user in
time and money compared with our §8.1 and §8.2? If the answer is "twenty minutes and zero dollars",
the moat framing has to be rewritten (critique §6 Q5).

**How to answer it.** The share question is an internal DNS query against our own registrar data and
should take a day. The comparison is a hands-on run: register a domain at Cloudflare, deploy a page,
turn on Email Routing, and time it. Then write the honest side-by-side.

**Priority: P0**, and the internal query first — it is a one-day answer that can invalidate a
quarter of strategy.

---

## 3. Wix Studio / the Wix full stack

**Why it matters.** The audit's §8 preamble says registrar + host + mail *"exists nowhere else in
this field."* Wix **owns Base44**, is a registrar, and sells mailboxes. So do GoDaddy, IONOS and
Hostinger. That sentence is factually wrong and it is the load-bearing sentence of the overtake
thesis (critique §1, §5). Wix is also best-in-class at something we need next week: its collision
handling names the *consequence* of each option — "Assign to a Different Site" offering "Redirect it
to the primary domain" versus "Replace the current primary domain" (`connect.md` §9) `[verified]`.

**The question.** What does Wix actually bundle across registrar, host, mail and AI generation at
each tier — and therefore what is the honest, defensible version of our positioning sentence?
Secondly: how does Wix Studio (the agency/pro tier) handle multi-client, white-label and
transfer-of-ownership, a whole dimension the audit covers in one line (critique §1)?

**How to answer it.** Mostly desk research on published pricing and docs, plus one paid month of Wix
to see the mail bundling and the collision UI from inside. Cheap, and the output is a corrected
positioning line that survives a hostile question in a meeting.

**Priority: P1.** Low effort, and it fixes something we are currently saying out loud that is not
true.

---

## 4. Squarespace

**Why it matters.** The closest **brand** competitor for "a small business wants a nice site", and it
now has AI generation (critique §1). We have already mined it for connect-flow precedent without ever
studying it as a competitor — and that precedent is unusually rich: self-serve collision resolution
plus a "Move domain" action, a **15-day auto-unlink** when verification is abandoned, the explicit
*"Don't delete MX records during this process"* warning, and a pending state shown **to visitors**
(`connect.md` §5.2, §6 rows 11 and 13, §9) `[verified]`. It is also the outlier that steers users
toward *transfer* rather than connect, which third-party educators warn novices about
(`connect.md` §10) `[verified]`.

**The question.** What does Squarespace's AI generation actually produce compared with ours, and how
does a company that wins on *taste* rather than on speed frame an AI builder to a non-technical
buyer? Plus the commercial shape: pricing, renewal, and what the domain and mailbox are bundled
with.

**How to answer it.** Run the standard task basket (see below) through it, and capture the
generation flow end to end. Its published help centre is unusually complete, so most of the flow
detail is desk-readable.

**Priority: P1.** It is who our customer compares us to when they are not thinking about AI at all.

---

## 5. Webflow

**Why it matters.** It is the design-quality ceiling the entire "anti-generic generation" argument
should be calibrated against (critique §1). We score ourselves 1/5 on anti-generic output and score
Lovable 5/5 — but on vibes from marketing copy, with no measurement of what actually comes out the
other end (critique §1, §6 Q2). Without a ceiling, that scale means nothing. Webflow also runs Entri
as "Quick connect" `[verified]` and makes a different structural bet on failure: no rich state list,
but a **"Why is my site down?" diagnostic tool** covering missing site plan, DNS misconfiguration and
unpublished custom domain (`connect.md` §5.2) `[verified]`.

**The question.** What is the real ceiling of AI-generated output against hand-built design — and, on
the connect flow, does one triage tool beat a named state machine, or are they complementary? The
teardown's own answer is "steal it as a *second* affordance, not a replacement", which is a
hypothesis worth testing rather than a conclusion.

**How to answer it.** For the ceiling: include Webflow-built sites as the control group in the
output-quality benchmark below. For the diagnostic: read the tool's decision tree and compare against
our failure catalogue (`connect.md` §6) — does it cover the 13 states, and with how many screens?

**Priority: P1.**

---

## 6. Canva

**Why it matters.** ~200 M MAU, a free website product, and Canva Code. The critique's framing is the
important part: it is *"the most likely source of a Remixer prospect who never even searches for an
AI builder"* (critique §1). This is a **distribution** risk rather than a feature risk — the
dangerous competitor is not the one that beats us in a comparison table, it is the one the customer
was already inside when the thought occurred to them. Canva also does two things right in our active
work area: it puts the custom domain **in the publish moment** (Publish → Website → "Use a custom
domain") and it ships Domain Connect as "Log in and auto connect" (`connect.md` §3, §4.2)
`[verified]`.

**The question.** Is our real acquisition competitor a design tool rather than a builder — and what
does the funnel look like for a user entering from a non-technical creative context rather than from
a domain search?

**How to answer it.** Walk the Canva website flow from a blank Canva account to a published site with
a custom domain, timing every step. Then ask the harder question of marketing: where do our signups
actually come from, and does "AI website builder" appear in the query at all?

**Priority: P2** — it will not change the interface, but it may change where the interface is
advertised.

---

## 7. 10Web — and the rest of the host-with-an-AI-builder cohort

**Also here:** Bluehost AI, IONOS (which is Emergent's supplier), Zyro/Hostinger's wider stack,
Durable, B12, Jimdo.

**Why it matters.** The critique's flat statement: the audit *"never benchmarks against the
host-with-an-AI-builder cohort DreamHost actually shares a customer with"* (critique §1). 10Web is
the pivot, because it generates **into WordPress** — which makes it the closest existing answer to
"what would Remixer be if it built WordPress sites instead of replacing them?" Study it as the
WordPress question (item 1), not as a separate teardown.

**The question.** For each: what does the AI builder generate, where does it live relative to the
control panel, what is bundled versus metered — and which of them has solved the migration story for
an existing customer's existing site?

**How to answer it.** One shallow pass across all of them scoring the same eight dimensions, rather
than a deep teardown of any one. The value here is the *shape of the cohort*, not the detail.

**Priority: P1, executed together with item 1.**

---

## 8. Durable

**Why it matters.** The extreme speed-and-simplicity end of the market — a site in seconds, sold to
trades and solo operators. That is the same audience GoDaddy signals with a "Pressure Washing"
starter chip (§4.3.1), and it is plausibly the bulk of DreamHost's small-business base. Durable is
the test of whether anything we are building above the generation step matters to them at all.

**The question.** At the bottom of the market, does anyone care about the agent loop — or does
time-to-site win outright? If Durable retains customers with no plan mode, no version history and no
blast-radius control, then most of our catch-up list is aimed at a segment we do not have.

**How to answer it.** Run the task basket, then read reviews and churn signals rather than docs. The
answer is behavioural, not featural.

**Priority: P3** — low effort, and a useful sanity check on the whole catch-up list, but it will not
change a decision this quarter.

---

## The other kind of blind spot

The critique also names holes that are not companies. They belong in this work order because they are
the same failure — a dimension nobody scored (critique §1, §6):

- **Output quality, measured.** Not one Lighthouse score, page-weight figure, JS payload, Core Web
  Vitals number, axe/WCAG result or schema.org check exists on any competitor's generated site — in a
  document that scores "anti-generic generation" 1–5. **The work order:** run the same 10 SMB briefs
  through Remixer, Lovable, v0, Base44, Airo, Hostinger, Squarespace and Webflow; score performance,
  weight, accessibility violations, SEO correctness and mobile rendering; add a **blind design ranking
  by five designers who do not know the sources** (critique §6 Q2). For a hosting company this is
  both a differentiator and a COGS line. **P0 alongside items 1–2.**
- **The normalised price basket.** Build one standard task — "5-page restaurant site, 3 revisions, 1
  image swap, publish, connect domain" — and run it on every competitor's cheapest paid plan,
  recording credits consumed and dollars spent (critique §6 Q8). This is the one table that would let
  anyone reason about the market, and it does not exist anywhere. Every entry above should be run
  through it. **P1.**
- **Images and licensing.** Where does each competitor's imagery come from, under what licence, with
  what indemnity? Novice SMB sites get DMCA'd and the registrar carries it. Getty gets one sentence
  in the whole audit. **P1.**
- **Abuse, fraud and deliverability.** A free-publish, free-mailbox, perpetual-free-tier AI builder
  inside an ICANN-accredited registrar is a phishing factory with a support desk attached. What did
  Vercel, Netlify, Lovable and Replit actually experience with free hosting? This is the veto question
  on three of the audit's recommendations at once (critique §6 Q7). **P0 before §8.2 ships anything.**
- **Security of the generated output.** Leaked keys, exposed endpoints and unauthenticated admin
  routes are endemic to this category — Lovable's BOLA incident is reported in the audit as gossip
  rather than as a category risk. When a Remixer-generated app gets popped, DreamHost's abuse team
  owns it. **P1.**
- **Any market data at all.** No ARR, user counts, traffic, funding or growth rate for a single
  competitor. You cannot tell from the audit whether Lovable has 50,000 users or 5 million — and
  therefore whether "the benchmark" is a benchmark or a well-designed niche. **P2**, but it is a
  day's desk research and it reframes every score in §2.
