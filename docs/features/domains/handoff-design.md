# Remixer — Domain Connection & Publish Flow — Design Handoff

> Drop this file (and the Figma link below) into the **Design** project "Remixer AI Builder".
> It captures everything decided/researched over several days in **Code**, so you can continue in Design with full context.

## Figma (the actual designs live here)
- **File:** https://www.figma.com/design/GP4jNXtc37VTFVZDc9JF0a/AI-Website-Builder — page **"Domain Connection Flow"**
- Paste this link into Design ("Figma links … as context") so Claude can read the real frames.
- Page is organized into titled **Sections**: ① Buy a new domain · ② Connect a DreamHost domain · ③ Connect an external domain · ④ Manage domains · ⑤ Plan gate · ⑥ Publish panel · **⑥-A Launchpad** (chosen alt) · ⑥-B Site Status (alt) · ✎ Alternates (old variants) · 📱 Mobile · iOS.

## ⚠️ Corrections since this file was written (19–20 Aug 2026)

Five claims below have since been disproven or superseded. The rest of the document stands.

1. **"Domain Connect one-click for ~50 registrars" (scenario 3) is not buildable today.**
   DreamHost supports Domain Connect in **no role** — absent from `domainconnect.org`'s
   provider list, zero mentions across `help.dreamhost.com` (verified Aug 2026). One-click
   external connect requires buying **Entri** (~$249/mo for 600 connections + ~$500/mo for
   custom-domain SSL). Until that PO exists, the external path is guided manual records.
   Any frame showing a one-click consent screen is a *conditional* design — keep it in
   Alternates, not in the main flow.
2. **Domain prices are stale here.** Use the official table (verified 06 Aug 2026):
   `.io $34.99 / $59.99 renew` (not $39.99), `.ai $89.99` with a 2-year minimum (hence the
   $179.98 front-page figure), `.online $1.99`, `.store $2.99`. `prototype/src/data/domains.ts`
   carries the correct set.
3. **The connect flow's state machine is incomplete.** The teardown at
   `docs/features/domains/research/connect.md` (§5–§6) catalogues **thirteen** failure
   states the category names, and flags **nine** of them — 1, 2, 3, 4, 6, 8, 9, 12, 13 —
   as having no frame anywhere in our design. Most important of those: **"connected but not
   published yet"** (failure 8; Lovable calls it `Ready`, and it is the novice's most likely
   dead end) and the ~1-hour verification timeout (Lovable's `Unable to verify` — a
   *designed* timeout, not an error).
   **The current answer now lives in `docs/features/domains/STATES.md`, not only in the
   research.** That file names ten states, gives each verbatim EN copy and exactly one verb
   (`securing` deliberately has none), maps all thirteen failures onto them, and ends with a
   drawing order — `ready`, then `waiting-on-you`, then `needs-attention` — so start there.
   It also names what stays homeless after the mapping, and those are the real gaps to design
   against: failure 6 (a security rule blocks the padlock) has no state and is the one honest
   hand-off to support; failure 11 (the customer's email dies after connecting) is designed
   only as *pre-connect* insurance, with no after-the-fact state; failure 12's 48-hour stall
   has a state but no action while we offer only one external path; the cross-account half of
   failure 10 is named (`elsewhere-in-dreamhost`) but has no copy, because it has no policy;
   and failures 1–4 all resolve into a single **comparison** pattern ("here is what's there /
   here is what should be") that is still an open question — if it isn't approved, the four
   most common failures lose their home again.
4. **Cloudflare is in the wrong bucket (scenario 3).** The body says "manual nameservers/DNS
   for others (**Namecheap/Cloudflare**)". Cloudflare does not belong there: **Cloudflare
   supports Domain Connect as a DNS provider** — its own documentation page
   (`developers.cloudflare.com/dns/reference/domain-connect`), a listing on
   `domainconnect.org`'s provider page, and one of exactly three providers behind Shopify's
   "Connect automatically" (verified 19 Aug 2026 — `docs/features/domains/research/connect.md`
   §4.2 and §11.1; IDs STD-002 and STD-003 in `docs/product/FACTS.md`). **Namecheap is the
   canonical manual case** — absent from the provider list, no support announcement found.
   The nuance that has to travel with this fix: a Cloudflare-fronted domain still fails
   verification while the proxy is on ("orange cloud") and must be switched to **"DNS only"**
   first (STD-004), so Cloudflare is **"automatable, with a triage card" — not "easy"**, and
   that triage card is a frame we do not have. This is orthogonal to correction 1: Cloudflare
   supporting the standard does not give *us* one-click, because DreamHost supports it in no
   role — the automatable path still waits on the Entri PO. `prototype/src/state/world.ts`
   already carries this exact reasoning in its `external-dc` comment; keep the Figma frames
   and this file consistent with it.

5. **The staging host was wrong everywhere in this file — fixed in the body 20 Aug 2026.**
   It said `*.remixer.site`; the product uses **`remixer.ai`**. Unlike correction 2, this one
   was applied *in place* rather than left as a specimen: a wrong hostname on the
   most-shown screen in the product has no teaching value, and no other pointer cites it.
   The two prose lines that carried it (Trial logic, Publish panel) now read `remixer.ai`
   with the open question attached. DreamHost's own KB describes the
   arrow beside **Publish to Staging** opening "your temporary website **ending in
   remixer.ai**", and the Remixer product page sells a free 30-day preview "**on a
   remixer.ai subdomain**" (verified 20 Aug 2026 — `docs/product/FACTS.md` DH-302, restated
   in DH-005). `remixer.site` was never sourced by anything; neither was `remixer.app`,
   which the audit uses. The **zone** is now settled. What is **not** settled is the
   **left-hand label** — whether the address reads `{project}.remixer.ai`,
   `{account}-{project}.remixer.ai` or a generated id — so any frame that prints a full
   staging address is showing a placeholder shape, and **one screenshot of the live builder
   closes it**. Two knock-ons for the frames: the two places below that carried the host now
   print the corrected zone with the open label flagged, and
   `prototype/src/data/domains.ts` (`STAGING_HOST`) holds that zone in one place, printed by
   the publish panel and the shell rather than retyped by either.
   ⚠️ Do not read this correction as blessing the other half of those sentences: "**hidden
   from Google**" is a *separate* claim, and it was **downgraded to `unverified`** on the
   same day (DH-303) — no statement about indexing exists in the KB, the product page or
   the Trial Terms. Keep the two apart when quoting either.

Deeper competitor detail on the connect path — automation rails, status vocabularies,
failure catalogue, collision handling — now lives in
`docs/features/domains/research/connect.md`.

## What this is
In-builder flow for **DreamHost "Remixer"** (AI website builder): connect a domain + publish a site to a real **custom domain**. Everything renders INSIDE the dark Remixer builder, replacing the website-preview area. **Audience: a complete non-technical novice ("housewife test")** — plain language, no jargon, sells without scaring.

## Real product facts (verified from dreamhost.com, June 2026 — use these, don't invent)
- **Plan = "Remixer Build" — $9.99/mo** (billed yearly = $119.88, "Save 33%"; monthly = $9.99 first month then $14.99/mo).
- **30-day free trial, NO credit card** (DreamHost markets it as the longest no-card trial in the category).
- **Trial logic:** new user writes a prompt on the marketing page → signs up → after the first site generates, the **30-day trial auto-starts**. Building with AI = the trial. **Publishing to a CUSTOM DOMAIN requires upgrading to the paid plan.** The staging preview lives in the **`remixer.ai`** zone (DH-302) and is always **free** (DH-005, DH-303).
  **⚠ Two limits on that sentence — it used to read `*.remixer.site`, which is refuted
  (correction 5 above).** (1) Only the **zone** is verified; the **label in front of it is
  still unconfirmed** — `{project}.remixer.ai`, `{account}-{project}.remixer.ai` or a
  generated id — so **do not print a full staging address in a frame as if it were real**;
  one screenshot of the live builder closes it. (2) **"Hidden from Google" is gone from this
  line on purpose:** it is a separate claim, downgraded to `unverified` (DH-303), with no
  source in the KB, the product page or the Trial Terms. Do not put it back.
- Plan includes: hosting + global CDN (SmartEdge), **SSL**, **"Connect a Domain"**, **1,000 credits/mo** (+1,000 bonus month 1), 24/7 chat & email support. Credits power AI generate / chat-edit / publish. Add-credits (one-time, 6 mo): +1,000 = $14.99, +2,500 = $34.99 ("Best value").
- **Domain prices:** .com $9.99 (renews $19.99) · .net $4.99 · .org $7.99 · .io $39.99 · .shop $0.99 · .store $2.99 · .online $0.99 · .me $2.99 · .ai $179.98 (2-yr min). **Free WHOIS privacy forever.**
- DreamHost has **NO domain brokerage** → never show "Make an offer" on a taken domain (just "Taken — try another").
- **SSL (Let's Encrypt) takes ~10–30 min** to issue → a connected DreamHost domain is reachable in seconds but the padlock follows; don't claim "instantly secured."

## Brand / colors
- **Blue `#1587FF` = action buttons.** **Indigo/purple = Remixer brand** (logo, plan/credit/AI surfaces). **Green = live/success.** **Amber = connecting / action-needed.** Builder bg `#18181B`.

## The 3 domain scenarios (each a full flow)
1. **Buy a new domain** → search results (real prices, exact-match hero + alt TLDs) → DreamHost-style cart → live.
2. **Connect a domain already at DreamHost** → typeahead lists "Your DreamHost domains" → confirm screen ("You own this") → brief **"Setting up…"** progress → live (HTTPS ~30 min). No checkout (it's already yours). Button is just **"Connect"** (not "Connect · free").
3. **Connect an external domain** → detect registrar → **Domain Connect one-click** for ~50 registrars (GoDaddy/Squarespace/IONOS/Google — adds DNS *records* via a consent screen, NOT a nameserver rewrite) · **manual nameservers/DNS** for others (Namecheap/Cloudflare). Saved as "Connecting" + resume; status page with "Refresh status".
   **⚠ Corrected — see corrections 1 and 4 at the top of this file.** Two things in this line
   are wrong. DreamHost supports Domain Connect in **no** role, so the one-click branch is
   Entri-dependent, not buildable today. And **Cloudflare does not belong on the manual path**
   — it supports Domain Connect (automatable, with a "set the proxy to DNS only" triage card);
   **Namecheap** is the manual example to draw.

## Interaction model
**One universal field** that detects intent (buy new / connect owned / paste external). **AI suggestions = the default empty state** (buy + upsell), NOT a 3rd path. Typing a domain you OWN resolves to a "You own this → Connect" confirm (not buy results). Dropdown rows route to a **confirm** screen — they never auto-connect on a stray click. **Verb system: Add = buy · Connect = attach a domain you own · Update/Publish = republish.**

## Publish panel — THE conversion-critical screen
Two destinations: **Private preview** (free, in the **`remixer.ai`** zone — DH-302/DH-005) + **Public website** (the custom domain — the retention moment).
**⚠ It used to say `*.remixer.site`, which is refuted (correction 5 above).** The **zone** is
settled; the **subdomain shape** printed in the frames is still a placeholder until someone
screenshots the live builder, so treat any full staging address in a frame as lorem. And
"hidden from Google" has been **dropped from this line** — `unverified` (DH-303), not a
promise we can print next to a search engine's name.

**CHOSEN DIRECTION = "Launchpad" (section ⑥-A):** one dominant **hero** (eyebrow "PUBLIC WEBSITE") + a demoted **"PRIVATE PREVIEW LINK"** row below a hairline. Parallel structure: public site (hero) ↔ private preview (utility). **4 states:**
- **CASE 1 — on trial, no plan** (must upgrade): "Go live on your own domain" + "Use your own address like trulieve.com — easy to find on Google and more professional." + indigo box **"Part of the Remixer Build plan · $9.99/mo / Includes hosting, the padlock and your domain. Cancel anytime."** + **Connect a domain →**.
- **CASE 2 — has plan, no domain yet** (no upsell/price): same headline + green box **"✓ Included in your Remixer Build plan / Connect a domain you own, or buy a new one"** + **Connect a domain →**.
- **Connecting:** "Connecting your domain…" + "Usually a few minutes — keep editing, it goes live on its own." + domain chip + **Refresh status**.
- **Live:** "Your site is live" + domain chip + "Secure padlock on · anyone can visit." + **Visit site ↗**.

Alternatives kept for comparison: **⑥** (two equal cards, original) and **⑥-B "Site Status"** (Vercel/Linear status dashboard: colored dot + Draft/Connecting/Live + one action).

## Mobile (iOS) — section 📱 (10 screens)
Publish bottom-sheet (Share/Production) · Paywall/Trial · Domain home (segmented "Get a new domain / I already own one" + **AI suggestions**) · Search results · Checkout (domain $9.99 + plan $0 on trial → Due today $9.99) · Success (live) · Your domains (own) · External connect (one-click + manual) · Connecting/Status · Manage hub. Style: iOS dark + indigo brand gradient, bottom sheets, matches the team's own mobile refs ("Logged-in user" section).

## Copy / de-jargon rules
- **No jargon in primary paths:** avoid DNS, nameserver, A record, CNAME, 301, "SSL certificate provisioning", "publish to production". Use plain: "Point domain to us (easiest)", "Redirects to {domain}", "Connecting your domain", "secure padlock", canonical success checklist **"Domain settings updated · Connected to your site · Security (SSL) on"** (one fixed order on every success screen).
- **No cart surprise:** always show the plan/price *before* the cart. Monthly framing on cards ("from $9.99/mo"), full yearly total at checkout.
- Say each promise once; keep cards to ~2 short lines.

## Open items / to verify (don't ship without resolving)
1. **Email/push notification:** does Remixer actually notify when a domain goes live? "we'll email/notify you" was an **unverified assumption** — currently softened to "it goes live on its own / Refresh status". Restore the email/push line only if the product really sends it (appears on Connecting/Verify/Status screens).
2. **Mobile Paywall:** the "30-day free trial" timeline screen is really the **signup on-ramp**, NOT the in-builder go-live gate. The go-live gate (mobile) should mirror Launchpad **Case 1** (upgrade to paid). Split these two.
3. **Free-first-year-domain hook:** real DreamHost offer, but only valid IF an annual Remixer Build plan qualifies for the credit — **unconfirmed**, so it's currently NOT used in the core flow (only in an optional "promo" variant).

## Audit status (done)
Full multi-lens flow audit completed (grade was B-, now fixed): real prices + "Remixer Build" name across all purchase/search frames; realism fixes (Domain Connect = records not nameservers; removed "Make an offer"; ".ai $179.98/2yr"; labeled the "502" chip → "502 views"); pervasive de-jargon; standardized success template + state-aware CTA ("Visit site" when live). Page reorganized into the titled Sections above.
