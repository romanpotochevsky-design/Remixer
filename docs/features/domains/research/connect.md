# Remixer — "Connect a domain" — Competitive teardown (19 Aug 2026)

> Companion to `docs/research/domain-search-research.md`. That document answered **"how do
> people FIND a domain"**. This one answers **"what happens after they say 'I already have
> one'"** — the connect path, its automation rails, its state machine, and every failure
> state the category has learned to name. 17 products torn down.
>
> Read it together with `docs/handoff/domain-connection-design-handoff.md` (which it
> corrects in two places — see §11) and `docs/audits/synthesis.md` §8.1.

---

## 0. Method, and how much to trust each line

Sources are the vendors' own help/docs pages plus community threads, read in Aug 2026.
**Direct page fetch was blocked by this session's egress policy**, so official-doc content
arrived through search extraction rather than my own eyes on the page. That changes the
confidence grading, and the grading here is deliberately stricter than usual:

| Tag | Means |
| --- | --- |
| `[verified-doc]` | Attributed to the vendor's own help/docs page and consistent across ≥2 independent retrievals. Safe for internal decks. |
| `[likely]` | Single retrieval, or a good secondary source (agency/tutorial/community) describing vendor UI. Do not put a number from here in front of the CEO without re-checking. |
| `[uncertain]` | Plausible, one weak source, or inference. Design-informing only. |

Anything not tagged is analysis, not fact.

---

## 1. The one-paragraph answer

Every product in the category has converged on the **same five-beat connect flow** — entry
point → type the bare domain → detect the DNS provider → *automate it or hand out records*
→ a named waiting state that resolves to live. What separates them is not the flow, it is
**(a)** which automation rail they bought, **(b)** how honestly they name the waiting and
failure states, and **(c)** whether a collision or a dead end has a self-serve exit.
Lovable has the best-named state machine in the field (eight states, a recovery verb on
each, a `Retry` button instead of remove-and-re-add, and a `Ready` state that distinguishes
"DNS is fine, you just haven't published" from "broken"). Vercel and Netlify have the worst
names (`Invalid Configuration`, `Awaiting External DNS`) and pay for it in years of forum
threads. Nobody in the AI-builder cohort has built the state Remixer can build: **a domain
already in the same company's account, connected with zero records and zero other tabs.**
GoDaddy and Hostinger both do that for their own customers — and neither of them does it
*inside the AI builder*.

---

## 2. The canonical connect flow — five beats

Observed in some form in every one of the 17 products:

1. **A named entry point**, always separate from the buy-search field, always phrased
   conditionally: "Connect existing domain" (Shopify), "Use a domain I own" (Squarespace),
   "Connect a domain you already own" (Wix), "Connect domain" (Lovable), "Bring your own
   domain" (Canva), "Add connected domain" (Figma), "Link a domain" (Replit).
   **No product asserts ownership; every one lets the user assert it.**
2. **One field, bare domain, no scheme, no `www`.** Shopify says it in the help text:
   *"enter your domain name, such as example.com"* — "without a subdomain" `[verified-doc]`.
3. **Provider detection.** Runs silently. Shopify: *"will automatically detect the internet
   domain registrar"* `[verified-doc]`. Entri does it deeper than a WHOIS lookup `[likely]`.
4. **The fork:** automatic (registrar login / one-click template) or manual (record table).
   Every automatic path in the field keeps a manual fallback — coverage is never 100%.
5. **A named waiting state** with an explicit refresh, then live + certificate.

The interesting design work is entirely in beats 4 and 5. Beats 1–3 are solved and
copyable in an afternoon.

---

## 3. Where the connect entry point lives

Whether the user meets this flow at *publish time* or in *settings* is a real strategic
choice — it decides whether "go live on your own address" is part of the success moment or
a chore in a settings screen.

| Product | Entry point(s) | At publish time? |
| --- | --- | --- |
| **Lovable** | Project → Settings → Domains · **Publish dialog → Add domain** · Workspace settings → Workspace domains `[verified-doc]` | **Yes** — three doors, one of them the publish dialog |
| **v0 / Vercel** | Publish → Publish to Production → **Customize → Buy a Domain** `[likely]`; project Settings → Domains | **Yes** |
| **Bolt** | gear icon → All project settings → **Domains & Hosting** `[verified-doc]` | No |
| **Base44** | App settings → domains (add → configure DNS → verify) `[likely]` | No |
| **Replit** | **Deployments tab → Settings → Link a domain** `[verified-doc]` | Adjacent to deploy |
| **Framer** | Site Settings → Domains `[verified-doc]` | No |
| **Webflow** | Site settings → Publishing → Production → Add a custom domain `[verified-doc]` | Adjacent |
| **Figma Make / Sites** | Settings → Site → Domains → **Add connected domain** (after publishing) `[verified-doc]` | After first publish |
| **Canva** | Publish → Website → **Use a custom domain** `[verified-doc]` | **Yes** |
| **Shopify** | Settings → Domains → Connect existing domain `[verified-doc]` | No |
| **Wix** | Dashboard → Domains → Connect a domain you already own `[verified-doc]` | No |
| **Squarespace** | Settings → Domains → **Use a Domain I Own** `[verified-doc]` | No |
| **GoDaddy Airo AI Builder** | apps page → app → **Domain → Settings → Connect Domain → Yes, Continue** `[verified-doc]` | No — four clicks deep |
| **Hostinger Horizons** | **Publish → Connect Domain**, then hPanel for the real work `[likely]` | Yes, then ejects |
| **Durable** | Website → Domain `[likely]` | No |
| **Emergent** | in-product domain purchase; external domains "through a manual DNS step" `[likely]` | Yes for buy |
| **Netlify** | Domain management → Production domains → Add a domain `[verified-doc]` | No |

**Read:** the AI-native cohort (Lovable, v0, Canva, Horizons) puts the domain in the
publish moment. The commerce/classic cohort (Shopify, Wix, Squarespace, GoDaddy) leaves it
in settings. Our Launchpad direction (handoff ⑥-A) is on the right side of that split.

---

## 4. The three automation rails

### 4.1 Entri — the bought rail

The white-label modal that signs into the user's DNS provider and writes the records.

- Used by **Webflow** ("Quick connect… powered by Entri") `[verified-doc]`, **Lovable**
  ("Lovable opens an Entri modal") `[verified-doc]`, **Replit** (*"after you authorize it,
  Entri signs in to your DNS provider and writes the required DNS records on your
  behalf"*) `[verified-doc]`.
- **Coverage:** "60+ DNS providers with direct API login" on the product page `[likely]`;
  a 2026 third-party comparison states Entri *"automatically detect[s] and configur[es] DNS
  for 75% of domains"* `[likely]`. The older 40–50% figure in our synthesis was Domain
  Connect coverage, not Entri's — do not conflate them.
- **Fallback is part of the product**, not an afterthought: for unrecognised providers the
  modal shows *"step-by-step instructions tailored to the specific registrar"*, can
  **deep-link into that provider's DNS settings page**, and can be pointed at your own KB
  articles `[likely]`. **This is the single most stealable idea in this document** — see §12.
- Fully white-labelled: colours, logo, copy, 10+ languages `[likely]`.
- Backend gets a **webhook the moment the domain is live** `[likely]` — i.e. the "we'll
  tell you when it's done" promise the handoff had to soften is technically cheap *if* we
  buy this rail.
- **Price (2026):** ~$249/mo for 600 automatic connections a year; custom-domain
  infrastructure + automatic SSL is a separate ~$500/mo add-on → **~$749/mo before the
  first customer** `[likely]`. Matches the figure already in `synthesis.md` §1.
- Entri × GoDaddy agreement (June 2025) folds GoDaddy's Domain Connect into Entri —
  the two rails converge `[verified-doc, carried from prior research]`.

### 4.2 Domain Connect — the free rail, now standardising

- **It is becoming an actual internet standard.** IETF working group **`dconn`** exists;
  `draft-ietf-dconn-domainconnect-03` published **3 July 2026**, with a milestone to send
  the spec to the IESG for Standards Track `[verified-doc]`. This materially changes the
  build-vs-buy question in `synthesis.md` Q14 — implementing against a moving vendor spec
  is different from implementing against an RFC-track draft.
- **110+ participating providers, 300+ templates from 120+ service providers**, including
  Microsoft 365, Google Workspace, Apple iCloud+, Squarespace `[likely]`.
- **Cloudflare supports Domain Connect as a DNS provider** — it has its own docs page
  (`developers.cloudflare.com/dns/reference/domain-connect`) and appears on
  `domainconnect.org`'s provider list `[verified-doc]`. **This corrects our own
  prototype** — see §11.
- **Namecheap still does not appear** on the provider list; no support announcement found
  `[likely]`. Namecheap remains the canonical "manual" case, not Cloudflare.
- Who ships it as a product surface: **Shopify** ("Connect automatically", shown *only* for
  **Cloudflare, GoDaddy, IONOS** — still exactly three providers in Aug 2026)
  `[verified-doc]`; **Framer** ("Auto Connect", supported providers listed as Google
  Domains, GoDaddy, IONOS) `[verified-doc]`; **Canva** ("Log in and auto connect")
  `[verified-doc]`; **Wix** (automatic connect popup, with the honest disclaimer
  *"Automatic domain connection is not yet available for all users, and not all domain
  providers support automatic domain connection"*) `[verified-doc]`.
- Detection is pre-qualifiable before the user clicks: TXT `_domainconnect.{domain}` +
  a settings GET, milliseconds, server-side `[verified, prior research]`. **Discovery only
  works if the domain's AUTHORITATIVE DNS provider supports it** — a GoDaddy-registered
  domain pointed at someone else's nameservers will not discover as GoDaddy.

### 4.3 Same-house zero-record — the rail nobody in the AI cohort has built

- **GoDaddy Airo:** *"If your domain is using GoDaddy nameservers, Airo AI Builder
  automatically updates your DNS. If your domain is not using GoDaddy nameservers, you'll
  need to update DNS at your non-GoDaddy provider."* `[verified-doc]` — the exact
  behaviour §8.1 of our audit proposes. **They already have it.** What they *don't* have is
  it being reachable in one gesture: the documented path is apps page → app → Domain →
  Settings → Connect Domain → Yes, Continue, and their AI-builder domain purchase still
  ejects the user to the storefront (`synthesis.md` "Trap 7").
- **Hostinger:** Hostinger-registered domains connect automatically; external ones get
  nameserver/A-record instructions and an "I've Updated NS/DNS" button `[verified-doc,
  prior research]`. Horizons ejects to hPanel for it `[likely]`.
- **Lovable / v0 / Emergent:** domains bought in-product are auto-configured (root + www)
  `[verified-doc]`; Emergent claims *"from searching a domain to seeing your app live on
  it… less than 10 minutes"* `[likely]`. But **only for the domain they sold you today** —
  none of them is the registrar of record for a domain parked three years ago.

**Conclusion for us, stated honestly:** the mechanism is not uncopyable (the critique was
right). What is genuinely ours is the *combination* — registrar of record for a large
installed base **and** the builder in the same product — and, more importantly, the fact
that **nobody has put it in the publish moment**. The moat is the placement, not the plumbing.

---

## 5. Status vocabularies — the state machine table

This is the most transferable part of the teardown. Below, every status label the field
uses, what it actually means, and whether the product gives the user a verb.

### 5.1 Lovable — the reference implementation (8 states)

| Status | What it means | Verb offered |
| --- | --- | --- |
| **Pending** | Verification in progress, or a required record is missing `[likely]` | — |
| **Verifying** | DNS still propagating; check status re-reads the records `[likely]` | *Check status* |
| **Unable to verify** | **Verification did not complete within one hour** `[likely]` | Re-check the records |
| **Setting up** | Verification passed; certificate being issued — *"nothing for you to do"* `[likely]` | none, by design |
| **Stalled** / **Failed** | Ownership verified, certificate issuing is late or failed `[likely]` | **Retry** — *"you do not need to remove and re-add the domain"* |
| **Ready** | DNS correct, **project not published yet**; starts serving automatically on publish `[likely]` | *Publish* |
| **Live** | Verified and serving `[likely]` | *Visit* |
| **Offline** | It worked and then stopped — the DNS records changed underneath it `[likely]` | Re-check DNS |

Three ideas here are worth more than the rest of this document put together:

1. **`Unable to verify` is a designed timeout, not an error.** One hour. Past that the user
   is *"looking at wrong records, not slow ones"* `[likely]`. It converts an infinite
   spinner into a decision point. Note the honest caveat their own FAQ carries: on
   registrars with long propagation windows (GoDaddy, Squarespace) *a single trip through
   `Unable to verify` is a plausible outcome of a correct configuration* — so the state
   must not read as "you broke it".
2. **`Ready` vs `Live`.** A correctly configured domain on an unpublished project shows
   `Ready`, **not** an error. This is exactly the state a novice hits in Remixer — connects
   the domain, never presses Publish, concludes it's broken. **We do not have this state.**
3. **`Retry` on the certificate stage.** The alternative (remove and re-add) resets DNS
   propagation and is the single worst advice in this category.

### 5.2 Everyone else

| Product | Status labels | Verdict |
| --- | --- | --- |
| **Vercel** | `Valid Configuration` / **`Invalid Configuration`** / `Pending Verification` `[verified-doc]` | **Anti-pattern.** "Invalid Configuration" names the machine's opinion, not the user's next move. Community threads titled *"Domain Showing 'Invalid Configuration' Despite Correct Setup"*, *"Persistent 'Invalid Configuration' Issue"* run for years `[verified-doc]`. |
| **Netlify** | `Pending DNS verification` / **`Awaiting External DNS`** `[verified-doc]` | Same disease. Multiple forum threads of users sitting in `Awaiting External DNS` for 24–72h+. Also the honest ownership prompt: *"[domain] already has an owner. Is it you?"* → *"Yes, add domain"* `[likely]`. |
| **Bolt** | `Secure` / `Pending` / `Warning` `[likely]` | Three states is too coarse — `Warning` covers everything from a stray AAAA to a dead certificate. |
| **Replit** | `Verifying` → `Connected` `[verified-doc]` | Two states, but honest about time: *"a few minutes up to 48 hours"*. |
| **Squarespace** | *"This website is pending domain owner verification"* → green **`Connected`** label `[verified-doc]` | Plain-language, and the pending state is shown **to visitors**, which is brutal but honest. |
| **Shopify** | *"This domain requires verification"* → connected; *"up to 48 hours… to be fully live"* `[verified-doc]` | Fine, except the collision dead-end (§9). |
| **Base44** | verify step in dashboard; SSL issued automatically once verified `[likely]` | Undifferentiated. |
| **Webflow** | no rich state list; instead a **"Why is my site down?" diagnostic tool** covering missing Site plan, DNS misconfiguration, unpublished custom domain `[verified-doc]` | Different bet: fewer states, one triage tool. Worth stealing as a *second* affordance, not a replacement. |
| **Figma Sites/Make** | `Refresh` button on the Domains page; *SSL "typically takes up to 15 minutes, but can sometimes require additional time"* `[verified-doc]` | Minimal, and the SSL honesty is good. |

**The lesson:** the category's best-named states describe **what the user should do next**;
the worst describe **what the server thinks**. Our canonical checklist ("Domain settings
updated · Connected to your site · Security (SSL) on") is on the right side of that, but it
is a *success* template. We currently have no vocabulary for the eight ways it doesn't
succeed.

---

## 6. The failure catalogue — the states nobody draws

Assembled from the troubleshooting pages, which is where the truth about a flow lives.
Each row is a state our design does not currently have.

| # | Failure | Evidence | Frequency signal |
| --- | --- | --- | --- |
| 1 | **Truncated / mistyped verification string** | Lovable: *"a single character difference will cause verification to fail"*; called *"the single most common reason a domain sits on Verifying forever"* `[likely]` | Highest |
| 2 | **The TXT record was never added at all** (A record added, verification skipped) | Lovable FAQ: *"If you added the A record but forgot the TXT verification record, Lovable cannot verify ownership"* `[likely]` | Very high |
| 3 | **Leftover records from the previous host** | Bolt: *"old records sitting next to new ones is a classic cause of a domain that half works"* `[likely]`; Vercel instructs removing a conflicting CNAME before adding the A record `[verified-doc]`; Framer: *"remove any extra records"* `[verified-doc]` | Very high |
| 4 | **AAAA / IPv6 record left behind** | Base44 explicitly: remove AAAA records for hostnames used with Base44 `[likely]`. Symptom is *"my domain shows the wrong site"* for a subset of visitors — undiagnosable by a novice | High, invisible |
| 5 | **Cloudflare proxy on (orange cloud)** | Figma: *"If Cloudflare is your custom domain provider, you need to set the proxy status for the domain to DNS only. This configuration is required to successfully verify the domain."* `[verified-doc]`. Lovable exposes an advanced toggle *"Domain uses Cloudflare or a similar proxy"* `[verified-doc, prior research]` | High among the technically-adjacent |
| 6 | **CAA record blocks the certificate authority** | Vercel: add `0 issue "letsencrypt.org"` if other CAA records exist `[verified-doc]`; Base44: remove or update blocking CAA `[likely]` | Low count, 100% dead-end |
| 7 | **Certificate stalls after successful verification** | Lovable `Stalled`/`Failed` with Retry `[likely]` | Low, but looks like total failure |
| 8 | **Connected but never published** | Lovable `Ready` `[likely]` | **Novice-specific — likely our #1** |
| 9 | **Worked, then stopped** (DNS changed underneath, registrar "helpfully" reset, nameservers moved) | Lovable `Offline` `[likely]` | Long-tail, high emotion |
| 10 | **Domain already attached elsewhere** | §9 below | Medium |
| 11 | **MX records destroyed → the customer's email dies** | Squarespace: *"Don't delete MX records during this process"* `[verified-doc]`; *"When email fails immediately after connecting a domain, MX records have typically been removed or overwritten"* `[likely]` | **Highest severity.** Business-affecting, not site-affecting |
| 12 | **Nameserver connect stalls >48h** | Squarespace troubleshooting advises resetting to the provider's default nameservers and switching to record-based connect instead `[likely]` | Medium |
| 13 | **Verification abandoned → auto-unlink** | Squarespace: missing/incorrect verification CNAME → *"the domain will unlink from your site after 15 days"* `[verified-doc]` | Silent killer |

**Nothing in our Figma has a state for 1, 2, 3, 4, 6, 8, 9, 12 or 13.** Combined with the
already-flagged absence of a "domain is taken" state, the honest read is: **the connect flow
is designed for the happy path and about 40% of the real traffic.**

---

## 7. How ownership is actually proven

No product verifies ownership at search or entry time `[verified, prior research]`. Three
mechanisms, all deferred:

| Mechanism | Who | Record |
| --- | --- | --- |
| **TXT challenge** | Webflow (`_webflow` = `one-time-verification=…`), Vercel (`_vercel` = `vc-domain-verify=…`), Lovable (`_lovable` = `lovable_verify=…`), Shopify (`shopify_verification`) `[verified-doc]` | explicit |
| **Verification CNAME** | Squarespace (points to `verify.squarespace.com`; 15-day unlink if missing) `[verified-doc]` | explicit |
| **Implicit, via registrar sign-in** | Shopify/Entri/Domain Connect — *"When you connect your third-party domain to Shopify automatically, the domain is verified for domain ownership"* `[verified-doc]` | none visible |

**Design consequence:** the automatic rail doesn't merely save DNS typing — **it deletes an
entire verification concept from the user's world.** That is a bigger UX win than "saves
five minutes", and it is the argument to put in front of whoever signs the Entri PO.

For a domain **already in the DreamHost account**, all three mechanisms are unnecessary:
ownership is an internal lookup with zero latency `[verified, prior research]`. Say it in
the UI — "we already know it's yours" is a sentence no competitor can write.

---

## 8. Apex vs www — who asks and who decides

- **Figma asks at add time:** *"If using an apex domain or www subdomain, choose whether to
  redirect the subdomain to the apex domain or vice versa"*, with a toggle to disable the
  redirect `[verified-doc]`. This is the most explicit treatment in the field — and
  arguably too much choice for a novice.
- **Lovable, Webflow, Bolt, Emergent** configure **both root and www automatically**
  `[verified-doc]` — the user never meets the concept.
- **Vercel** auto-suggests the www counterpart when you add an apex `[likely]`; the
  engineering-consensus default is www-canonical with a 301 from apex, because CNAME is
  forbidden at the apex `[likely]`.
- Our audit's own rule (`synthesis.md` §7 Tier 3) is *"multi-domain with one primary and
  301 by default"*.

**Recommendation:** do what Lovable does — configure both, show one address, and expose the
apex/www choice only in an "Advanced" disclosure. A housewife-test user should never see
the word "apex". But **the 301 direction must be a real, changeable setting somewhere**,
because SEO consultants will ask and it is a two-line support answer.

---

## 9. Collisions — "this domain is already somewhere"

| Product | Copy | Resolution |
| --- | --- | --- |
| **Squarespace** | *"This domain is already connected to another Squarespace site"* `[verified-doc]` | **Self-serve** — disconnect and reconnect; Squarespace-registered domains get a **Move domain** action (pick target site → Confirm, live in 24–72h) |
| **Wix** | in-account: **Assign to a Different Site** with two explicit choices — *"Redirect it to the primary domain"* / *"Replace the current primary domain"*; cross-account: *"This domain is associated with another Wix account. To connect your domain, you need to remove it from the other account."* `[verified-doc]` | **Self-serve, best-in-class** — it names the consequence of each option |
| **Shopify** | *"This domain is already connected to another Shopify store."* `[verified-doc]` | **Contact support with proof of ownership** — a documented multi-year community pain point |
| **Lovable / Vercel** | *"domain already exists under a different context"* — a domain previously attached to a Lovable project (which runs on Vercel underneath) cannot be added to another project until it is fully released `[likely]` | **Dead end for the novice.** The user cannot even see the project holding it |

**For Remixer this is not an edge case, it is the base case.** Our users' domains sit in a
DreamHost account that very likely already serves something — a WordPress site, a parked
page, an old builder site. Our `dh-in-use` inventory axis already models it and the
prototype's guard copy is right in tone (*"Connecting will replace what visitors see at
{domain}. Your files stay safe and you can switch back."*). What's missing is **the Wix
move**: name the two options and their consequences instead of one scary confirm —
*"Show this new site at emberandoak.com"* vs *"Keep the old site there and use
www.emberandoak.com"*.

---

## 10. Connect vs transfer — the framing war

Unchanged since the last research, restated because it keeps coming up:

- **Shopify** presents a neutral decision table: connect = *"Minutes to 48 hours"*, *"No
  additional cost"*; transfer = *"Up to 20 days"*, *"1-year domain renewal fee"* — and
  frames the renewal as *"an ICANN requirement, not a separate fee charged by Shopify"*
  `[verified-doc]`.
- **WordPress.com** quantifies for novices: connect *"less than 15 minutes… takes effect
  within a few hours"*; transfer *"less than 30 minutes… takes effect within 7 days"*
  `[verified-doc]`.
- **Squarespace** is the outlier that steers toward transfer `[verified-doc]`; third-party
  educators warn novices about exactly that steering.
- **Lovable is now a full registrar with transfer-in**: paste the EPP code, *"Lovable
  becomes the registrar… and handles its renewals, registration details, DNS records, and
  connected projects"*; WHOIS privacy on automatically where the TLD supports it; auto-renew
  on by default `[verified-doc]`.
- **Webflow and Framer have no transfer path at all** and are fine `[verified-doc]` —
  connect-only is a legitimate, simpler product.

**Our line stays:** connect is the default, transfer is an optional later upsell
("$9.99 and it adds a year"), never a prerequisite. DreamHost's own KB agrees —
transfer is *"an optional step"* `[verified, prior research]`.

---

## 11. Corrections to our own knowledge base

Three things in the repo are now wrong or stale. Fix them before anyone designs against them.

### 11.1 Cloudflare is NOT a manual-only case — `prototype/src/state/world.ts`

```ts
/** External registrar without it (Namecheap, Cloudflare) — guided manual records only. */
| 'external-manual'
```

**Cloudflare supports Domain Connect as a DNS provider** (own docs page + listed on
`domainconnect.org`), and Shopify's "Connect automatically" works with exactly three
providers: **Cloudflare, GoDaddy, IONOS** `[verified-doc]`. Cloudflare belongs in the
`external-dc` bucket. **Namecheap** is the correct exemplar of `external-manual` — absent
from the provider list, no support announcement found `[likely]`.

Nuance worth keeping in the comment: a Cloudflare-fronted domain still needs the **proxy
turned off (grey cloud / "DNS only")** for verification, which is a *different* problem from
Domain Connect support (see failure #5). So Cloudflare is "automatable, but with a triage
card", not "easy".

### 11.2 The handoff's Domain Connect promise is stale — `docs/handoff/domain-connection-design-handoff.md`

The handoff still says scenario 3 offers *"Domain Connect one-click for ~50 registrars
(GoDaddy/Squarespace/IONOS/Google)"*. Later research established that **DreamHost supports
Domain Connect in no role whatsoever** (absent from the provider list, zero mentions in
help.dreamhost.com) `[verified, prior research]`, so one-click is only reachable by buying
Entri (~$749/mo all-in `[likely]`). Any Figma frame showing a one-click consent screen is
**a purchase-order-dependent design**, not a buildable one. Flagged inline in that file.

### 11.3 Price drift, already known but worth restating

The handoff carries `.io $39.99` and `.ai $179.98`; the official table gives `.io $34.99 /
$59.99 renew` and `.ai $89.99` (2-year minimum, hence the $179.98 front-page figure)
`[verified, prior research]`. `TLD_PRICES` in the prototype is correct; the handoff is not.

---

## 12. What Remixer should do — six decisions

**1. Ship a named state machine, not a spinner.** Adopt Lovable's shape, our vocabulary.
Proposed seven states, each with one verb, no jargon:

| State | Copy (EN) | Verb |
| --- | --- | --- |
| `connecting` | "Connecting your domain — usually a few minutes." | *Refresh status* |
| `waiting-on-you` | "We can't see the changes at {registrar} yet." (after ~1h — Lovable's timeout, renamed to blame the situation, not the user) | *Show me what to paste* |
| `securing` | "Almost there — turning on the padlock." | none, by design |
| `ready` | "Your domain is set up. Publish to put your site on it." | **Publish** |
| `live` | "Your site is live at {domain}." | *Visit site* |
| `needs-attention` | "Something at {registrar} changed and {domain} stopped working." | *Fix this* |
| `taken-over` | "{domain} is showing a different site right now." | *Point it here* |

`ready` and `waiting-on-you` are the two states with the highest expected traffic and the
two we currently do not have at all.

**2. Steal Entri's fallback, whether or not we buy Entri.** The valuable half of that
product is not the API login — it's the **per-registrar guided instructions plus a deep
link straight to that registrar's DNS page**. We can build that for the top 8 registrars in
DreamHost's own data for the cost of a week and a lookup table, and it works today, without
a PO. Our current `ExternalScreen` hardcodes GoDaddy — that is the right instinct,
unfinished.

**3. Show a record diff, not a record table.** The one quantitative claim found on this:
*"Support tickets drop dramatically once the DNS onboarding screen includes a simple 'we see
this record / we expected that record' diff"* `[uncertain]` — weak sourcing, but it matches
every failure in §6 (1, 2, 3, 4, 6 are all "what's there ≠ what should be there"). A diff
turns eight invisible failure modes into one visible one. **No competitor does this.** This
is a better differentiator than one-click, because one-click is buyable and this is design.

**4. Protect the email, loudly.** Failure #11 is the only business-destroying one. Before we
touch nameservers on a domain that has MX records, detect them and offer to carry them over
— DreamHost's own KB already warns that custom records stop working unless recreated first
`[verified, prior research]`. Squarespace's mitigation is a sentence of documentation
(*"Don't delete MX records"*); ours can be an actual guard. One line in the confirm:
*"Your email at {domain} keeps working — we're bringing its settings across."*

**5. Put the collision choice in the user's hands (Wix), never in support's (Shopify).**
Two named options with their consequences spelled out, on `dh-in-use`.

**6. Keep the entry point in the publish moment, and keep the zero-record case at the top
of it.** GoDaddy has the mechanism and buries it four clicks deep inside a settings tree;
Hostinger has it and ejects to hPanel. **The placement is the advantage.** That is now
better evidenced than when §8.1 was written, and it is also weaker than §8.1 claimed:
it is a head start, not an impossibility.

---

## 13. Open questions for the designer

1. **Do we draw the failure states now or ship the happy path first?** §6 says 8 missing
   states; §5 says the naming is where competitors bleed. My recommendation: draw
   `ready`, `waiting-on-you` and `needs-attention` next — they cover the majority of real
   traffic and cost three frames.
2. **Diff or table?** Decision 3 changes the anatomy of the external-connect screen. It is
   the highest-leverage single decision in this flow and it is a design decision, not an
   engineering one.
3. **Entri: do we design as if we have it?** Frames showing a one-click consent screen are
   worthless until the PO is signed, but designing without it locks us into the manual path
   for a year. Suggestion: design the manual path as the *primary* (it is what we can build),
   and keep the one-click as a clearly-labelled "if we buy Entri" variant in the Alternates
   section — not mixed into the main flow.
4. **The apex/www disclosure** — hide entirely (Lovable) or ask once (Figma)?
5. **Does the "we'll notify you" promise come back?** With Entri's webhook it becomes real;
   without it we keep "Refresh status". Still the handoff's open item #1.

---

## 14. Sources

Lovable: [docs.lovable.dev/features/custom-domain](https://docs.lovable.dev/features/custom-domain) ·
[transfer-domain](https://docs.lovable.dev/features/transfer-domain) ·
[faq/domains/setup](https://lovable.dev/faq/domains/setup) ·
[custom-domain-not-live](https://lovable.dev/faq/domains/troubleshooting/custom-domain-not-live) ·
[domain-not-verified-provisioning](https://lovable.dev/faq/domains/troubleshooting/domain-not-verified-provisioning) ·
[domain-verification-48-hours](https://lovable.dev/faq/domains/troubleshooting/domain-verification-48-hours) ·
[domain-stopped-working](https://lovable.dev/faq/domains/troubleshooting/domain-stopped-working) ·
[domain-wrong-site](https://lovable.dev/faq/domains/troubleshooting/domain-wrong-site) ·
[dns-records-needed](https://lovable.dev/faq/domains/dns-setup/dns-records-needed)

Vercel / v0: [add-a-domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain) ·
[troubleshooting domains](https://vercel.com/docs/domains/troubleshooting) ·
[deploying-and-redirecting](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting) ·
[v0 custom domains](https://v0.app/docs/custom-domains) ·
[Vercel Academy — Publish to a Domain](https://vercel.com/academy/v0-foundations/publish-and-customize-your-domain) ·
[community: domain stuck under different context](https://community.vercel.com/t/domain-stuck-under-different-context-after-disconnecting-from-lovable-dev/45307)

Bolt: [support.bolt.new/cloud/domains/connect](https://support.bolt.new/cloud/domains/connect) ·
[VibeAnswers teardown](https://vibeanswers.com/bolt/custom-domain-not-connecting/)

Base44: [docs.base44.com — Connecting an external domain](https://docs.base44.com/Setting-up-your-app/Connecting-an-external-domain) ·
[Base44 docs repo](https://github.com/Base44-app/docs/blob/main/Guides/Setting-up-a-custom-domain.mdx)

Replit: [docs.replit.com custom-domains](https://docs.replit.com/cloud-services/deployments/custom-domains) ·
[blog.replit.com/improved-domain-linking](https://blog.replit.com/improved-domain-linking)

Framer: [Domain Connect update](https://www.framer.com/updates/domain-connect) ·
[how-to-connect-a-custom-domain](https://www.framer.com/help/articles/how-to-connect-a-custom-domain/) ·
[troubleshooting-custom-domain-issues](https://www.framer.com/help/articles/troubleshooting-custom-domain-issues/)

Webflow: [Quick connect a custom domain](https://help.webflow.com/hc/en-us/articles/33961266716307-Quick-connect-a-custom-domain) ·
[Manually connect a custom domain](https://help.webflow.com/hc/en-us/articles/33961239562387-Manually-connect-a-custom-domain) ·
[How do I connect my domain to Webflow](https://help.webflow.com/hc/en-us/articles/33961334343827-How-do-I-connect-my-domain-to-Webflow)

Figma: [Manage a custom domain for your site](https://help.figma.com/hc/en-us/articles/31414274019863-Manage-a-custom-domain-for-your-site)

Canva: [Use your own domains to publish websites](https://www.canva.com/help/publishing-websites-own-domains/) ·
[Website DNS settings](https://www.canva.com/help/dns-settings/)

Netlify: [Configure external DNS](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/) ·
[Get started with domains](https://docs.netlify.com/manage/domains/get-started-with-domains/) ·
[DNS & HTTPS troubleshooting](https://docs.netlify.com/manage/domains/troubleshooting-tips/)

Shopify: [Connect automatically](https://help.shopify.com/en/manual/domains/add-a-domain/connecting-domains/connect-domain-automatic) ·
[Connect manually](https://help.shopify.com/en/manual/domains/add-a-domain/connecting-domains/connect-domain-manual) ·
[Connecting a third-party domain](https://help.shopify.com/en/manual/domains/add-a-domain/connecting-domains)

Wix: [Connecting a domain to the Wix name servers](https://support.wix.com/en/article/connecting-a-domain-to-the-wix-name-servers) ·
[Pointing vs. Name Servers](https://support.wix.com/en/article/pointing-vs-name-servers-domain-connection-methods) ·
[Transferring vs. connecting](https://support.wix.com/en/article/transferring-vs-connecting-your-domain-to-wix)

Squarespace: [Connect a third-party domain](https://support.squarespace.com/hc/en-us/articles/205812378-Connect-a-third-party-domain-to-your-Squarespace-site) ·
[Troubleshooting third-party domain connections](https://support.squarespace.com/hc/en-us/articles/206541757-Troubleshooting-third-party-domain-connections) ·
[DNS records for connecting third-party domains](https://support.squarespace.com/hc/en-us/articles/360035485391-DNS-records-for-connecting-third-party-domains) ·
[DNS records for email](https://support.squarespace.com/hc/en-us/articles/31120985010957-DNS-records-for-email)

GoDaddy: [Connect a domain to Airo AI Builder](https://www.godaddy.com/help/connect-a-domain-to-airo-ai-builder-42956)

Hostinger: [Horizons review/overview 2026](https://www.hostinger.com/blog/product-updates-2026)

Durable: [Troubleshooting your custom domain connection](https://help.durable.com/en/articles/11269187-troubleshooting-your-custom-domain-connection)

Emergent: [help.emergent.sh/custom-domains](https://help.emergent.sh/custom-domains)

Entri: [Entri Connect](https://www.entri.com/products/connect) ·
[developers.entri.com/connect/overview](https://developers.entri.com/connect/overview) ·
[Domain Connect alternative](https://www.entri.com/blog/domain-connect-alternative-how-to-simplify-domain-setup-for-users) ·
[pricing comparison (third party)](https://domainee.dev/alternatives/entri)

Domain Connect: [draft-ietf-dconn-domainconnect](https://datatracker.ietf.org/doc/draft-ietf-dconn-domainconnect/) ·
[DNS providers](https://www.domainconnect.org/dns-providers/) ·
[Service providers](https://www.domainconnect.org/service-providers/) ·
[Cloudflare DNS reference](https://developers.cloudflare.com/dns/reference/domain-connect) ·
[APNIC: a missing piece in the DNS toolbox](https://blog.apnic.net/2025/12/24/domain-connect-a-missing-piece-in-the-dns-toolbox/)
