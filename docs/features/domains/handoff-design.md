# Remixer — Domain Connection & Publish Flow — Design Handoff

> Drop this file (and the Figma link below) into the **Design** project "Remixer AI Builder".
> It captures everything decided/researched over several days in **Code**, so you can continue in Design with full context.

## Figma (the actual designs live here)
- **File:** https://www.figma.com/design/GP4jNXtc37VTFVZDc9JF0a/AI-Website-Builder — page **"Domain Connection Flow"**
- Paste this link into Design ("Figma links … as context") so Claude can read the real frames.
- Page is organized into titled **Sections**: ① Buy a new domain · ② Connect a DreamHost domain · ③ Connect an external domain · ④ Manage domains · ⑤ Plan gate · ⑥ Publish panel · **⑥-A Launchpad** (chosen alt) · ⑥-B Site Status (alt) · ✎ Alternates (old variants) · 📱 Mobile · iOS.

## ⚠️ Corrections since this file was written (19 Aug 2026)

Three claims below have since been disproven or superseded. The rest of the document stands.

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
   `docs/features/domains/research/connect.md` (§5–§6) lists eight failure states
   the category names and this flow does not — most importantly **"connected but not
   published yet"** (Lovable calls it `Ready`) and the ~1-hour verification timeout.

Deeper competitor detail on the connect path — automation rails, status vocabularies,
failure catalogue, collision handling — now lives in
`docs/features/domains/research/connect.md`.

## What this is
In-builder flow for **DreamHost "Remixer"** (AI website builder): connect a domain + publish a site to a real **custom domain**. Everything renders INSIDE the dark Remixer builder, replacing the website-preview area. **Audience: a complete non-technical novice ("housewife test")** — plain language, no jargon, sells without scaring.

## Real product facts (verified from dreamhost.com, June 2026 — use these, don't invent)
- **Plan = "Remixer Build" — $9.99/mo** (billed yearly = $119.88, "Save 33%"; monthly = $9.99 first month then $14.99/mo).
- **30-day free trial, NO credit card** (DreamHost markets it as the longest no-card trial in the category).
- **Trial logic:** new user writes a prompt on the marketing page → signs up → after the first site generates, the **30-day trial auto-starts**. Building with AI = the trial. **Publishing to a CUSTOM DOMAIN requires upgrading to the paid plan.** The `*.remixer.site` staging preview is always **free + hidden from Google**.
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

## Interaction model
**One universal field** that detects intent (buy new / connect owned / paste external). **AI suggestions = the default empty state** (buy + upsell), NOT a 3rd path. Typing a domain you OWN resolves to a "You own this → Connect" confirm (not buy results). Dropdown rows route to a **confirm** screen — they never auto-connect on a stray click. **Verb system: Add = buy · Connect = attach a domain you own · Update/Publish = republish.**

## Publish panel — THE conversion-critical screen
Two destinations: **Private preview** (free `*.remixer.site`, hidden from Google) + **Public website** (the custom domain — the retention moment).

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
