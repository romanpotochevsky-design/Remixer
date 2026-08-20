# GoDaddy Airo AI Builder

> godaddy.com/airo · **hosting company with an AI builder — our closest structural twin**
> Detail: [`audits/synthesis-q3-2026.md`](audits/synthesis-q3-2026.md) §4.3 ·
> [`../features/domains/research/connect.md`](../features/domains/research/connect.md) §4.3

## What it is

The world's largest registrar and a mass-market host, bolting an AI builder onto an account
system that already holds the customer, the domain and the payment method. Exactly our move.
Airo.ai launched 13 Nov 2025 with **six named agents** — orchestrator, App Builder, Compliance,
Domain Search and Registration, Website Builder, Logo — rather than one undifferentiated
assistant `[likely]`.

Pricing, read off GoDaddy's own pricing section `[verified]`:

| Plan | Annual price | Credits/mo | Published sites |
|---|---|---|---|
| Free | $0 | 50 | **0 — cannot publish at all** |
| Starter | $9.99/mo | 150 | 1 |
| Professional | $24.99/mo | 300 | 10 |
| Ultimate | $99.99/mo | 750 | 50 |

Measured burn is ~8 credits per prompt, so 50 free credits is about six prompts — single-reviewer
figure `[unverified]`. **Registrar: yes, the largest in the world.**

## Why it matters to Remixer

Everything, and more sharply than any other page in this folder. Same structure, same customer,
same organisational gravity. The audit gives it extra weight for exactly that reason, and both the
playbook and the traps transfer directly (§4.3).

### They already have the play we called an overtake

Our §8.1 proposes "zero-record go-live" — attach a domain already in the user's account with no
record table, no second tab, no nameserver talk — and calls it something nobody can copy. GoDaddy's
own documentation says: *"If your domain is using GoDaddy nameservers, Airo AI Builder automatically
updates your DNS. If your domain is not using GoDaddy nameservers, you'll need to update DNS at your
non-GoDaddy provider."* (`connect.md` §4.3) `[verified]`. **That is our play, already shipped.**
Hostinger has it too, for Hostinger-registered domains.

**And they bury it.** The documented path is apps page → app → Domain → **Settings** → Connect
Domain → Yes, Continue — four clicks deep in a settings tree (`connect.md` §3, §4.3) `[verified]`.
Buying a domain is worse: the world's largest registrar sends you *out of the builder* — *"Go to
GoDaddy domains, search for a desired domain, and then purchase it"* → return to the apps page →
select the app → Domain → Settings → Connect Domain → Yes, Continue (§4.3.2, Trap 7) `[verified]`.

So the honest version of our advantage is **placement, not plumbing**. The mechanism is copyable —
the critique was right about that (critique §2) — and `connect.md` §4.3 states the corrected
conclusion plainly: *"The moat is the placement, not the plumbing… a head start, not an
impossibility."* Nobody has put the zero-record case in the publish moment. That is what is ours,
and it has a shelf life, not a fence around it.

### MCP distribution is the urgent one

On **14 Feb 2026** GoDaddy shipped domain search into Claude conversations — live availability,
pricing, a purchase link, no tab switch — framed as *"Naming your business shouldn't feel like an
interruption. It should feel like inspiration."* The stated roadmap is authenticated domain
management, bulk checks, and expansion to OpenAI, Google and Perplexity (§4.3.1) `[verified]`.

The audit flags this "urgent" and then **generates no recommendation anywhere in its three tiers** —
one of the internal gaps the critique names (critique §1, final paragraph). It deserves one, because
it is not a UI question. **The registrar is moving its top-of-funnel out of the browser and into
other people's assistants.** If the naming-and-buying moment happens inside an assistant
conversation, our domain search screen is not the front door — it is a fallback. Two consequences
worth putting in front of product:

- Distribution: does DreamHost ship an MCP surface for domain search and, later, authenticated
  domain management? Lovable is pushing the same way from the other end — its dashboard already
  advertises *"Lovable apps now work in ChatGPT and Claude"*, and its Agent-integrations surface
  turns the **user's generated app** into an MCP server (`lovable-builder-teardown.md`).
- Design: if the domain is chosen elsewhere, the flow that matters most is not search but
  **connect** — which is where our current work already is.

## Steal

- **The domain-first funnel, where the domain is the transaction and the site is the free gift.**
  Enter your idea → review and purchase a domain → publish a one-page site. A domain buy unlocks 12
  logo options, a mailbox, social handles, campaign content, a free LLC filing and a personalised
  one-page site delivered instantly (§4.3.1) `[verified]`.
- **Named agents rather than one assistant.** Outcomes, not a tech stack — their CBO's framing:
  *"Small business owners do not want to master a tech stack; they want outcomes."* (§4.3.1).
- **The entry screen — the best single composition in the field.** Near-black violet ground, a
  headline alternating white and violet per phrase, and a **pure-white full-radius prompt pill
  floating in a multi-layer lavender bloom**. The glow, not a border, does the work (§4.3.1).
  *Hex values are estimated from a marketing screenshot — see Do not repeat.*
- **Violet discipline.** Violet appears only on the BETA pill, alternating headline words, the prompt
  glow, the send buttons and the AI sparkle. Every non-AI control is neutral (§4.3.1). This is
  exactly the rule our indigo/purple should follow, and it independently matches the blue = action /
  violet = brand split measured in Lovable's live top bar.
- **One published billing rule:** *"Credits are used when you perform an action that uses Airo AI
  Builder's agents… Credits are not used for non-agent actions."* Plus a published free list
  (§4.3.1) `[verified]`.
- **Docs that actively steer users off the meter:** *"If you only need to change text, swap an image
  or adjust a color, use Edit instead of typing a prompt. It's free… Save the AI chat for complex
  tasks."* (§4.3.1) `[verified]`.
- **The agent repairs its own errors for free**, and runtime failures raise a one-click **"Ask Airo
  to Fix It"** (§4.3.1) `[verified]`.
- **Restore never auto-publishes.** Both History and Backups restore end with the identical
  instruction: *"Once restored, select Publish to make it live."* Versions are previewable before
  restoring. This is the correct model and it is already our Tier 1 item #9 (§4.3.1) `[verified]`.
- **Expiry-first spend order, stated in the product:** credits are spent in order of expiration,
  free and paid alike (§4.3.1) `[verified]`. Critical for us because of the 1,000 first-month bonus.
- **Downgrade as a soft landing** — the site goes offline but *"your content is preserved"* and is
  restorable on re-engagement (§4.3.1) `[verified]`.
- **Getty Images reachable from chat.** GoDaddy's own comparison tables score licensed stock against
  Base44 and Hostinger Horizons, both "AI-generated only" (§4.3.1) `[likely]` — vendor marketing
  about competitors, so read the direction not the detail. Licensed imagery materially
  outperforms AI imagery for small-business sites — and note the critique's warning that image
  licensing and indemnity is a legal exposure the whole audit never names: novice SMB sites get
  DMCA'd, and the registrar carries it (critique §1).

## Traps — the legacy-host failure modes we are closest to repeating

All ten are in §4.3.2. These are the ones with our name on them:

1. **Brand sprawl.** GoDaddy maintains a help article titled *"Which GoDaddy website builder do I
   have?"* because it runs four overlapping products, one of which was discontinued 31 July 2026,
   and has to warn that Airo AI Builder and Airo for WordPress "are separate products".
   **Needing a disambiguation article is the diagnosis** `[verified]`.
2. **The credit balance exiled from the work surface** — User menu → Manage my plan → Total AI Credit
   Usage. Named among the top complaints: *"unlike other AI builders that display a running tally…
   GoDaddy keeps Airo's tucked away on a separate screen"* `[verified]`. **Our persistent
   top-toolbar credits chip is already better. Never move it.**
3. **IA that reveals its history** — a six-item mode bar containing **two adjacent asset managers**
   ("Menu" and "Media"), and a Settings screen holding exactly two things.
4. **Label drift** — the same device selector is "Preview Desktop" in one doc and "Change device" in
   another; the same share affordance is "View & Share" and "Share link". We will drift the same way
   as the rail grows unless there is a canonical string registry (§10.2 Q27).
5. **Dev-server internals leaking into a no-code product** — a manual "Refresh Preview" button, and
   an official best-practices table whose fix for "Preview isn't working" is to prompt *"Restart dev
   server."*
6. **Configuration by pasted prompt** — the official contact-form article tells users to paste
   GoDaddy-authored strings into chat. Non-discoverable, brittle, leaks internal agent architecture
   ("email skill"), and spends metered credits to change a setting.
7. **Leaving the builder to buy a domain** — see above. *"The single biggest unclaimed opening in the
   category."*
8. **Identity break at the door** — dark violet entry screen, **light** builder interior. The product
   you fell for is not the product you use. Bolt does the same thing in reverse; we hold #09090B
   throughout and should keep doing so.
9. **Help pages wrapped in the storefront**, behind the full commercial mega-nav.
10. **The renewal cliff** — first-year price advertised, materially higher renewal. Our flat
    $9.99/$14.99 with no cliff is a positioning weapon we are not using `[unverified pricing]`.

## Domain / publish behaviour

Zero-record automatic DNS for domains on GoDaddy nameservers, manual instructions at the user's
provider otherwise `[verified]` — but reached only through four clicks of settings, never at publish
time (`connect.md` §3). Buying a domain ejects the user to the storefront. The Free tier **cannot
publish at all**, and published Airo projects land on `*.airoapp.ai` `[verified]`. Note also that
the **Entri × GoDaddy agreement (June 2025) folds GoDaddy's Domain Connect into Entri** — the two
automation rails are converging, which matters for our own build-vs-buy question (`connect.md` §4.2,
§10.2 Q14) `[verified]`. GoDaddy has mailboxes but **resells Microsoft 365** at $7.99/mo, and its own
comparison table concedes "Professional email: Yes — Purchase required" (§8.2) `[verified]`.

## Where the detail lives

| Topic | Section |
|---|---|
| The playbook worth copying — funnel, agents, entry screen, billing rule, restore model, Getty, MCP | `synthesis-q3-2026.md` §4.3.1 |
| The ten legacy-host traps, in full | §4.3.2 |
| Fact-check corrections that override the dossier | §4.3.3 |
| Verified pricing table and measured credit burn | §4.3.4 |
| Field position, one-line verdict, "wins the entry screen and loses everything after it" | §1.2, §2, §10 closing note |
| Where we stand against them (ties on price, ahead on credit visibility) | §6 |
| Our zero-record play, and why it needs rewriting | §8.1 + `connect.md` §4.3 |
| Same-house zero-record rail, connect entry depth, Entri×GoDaddy convergence | `connect.md` §4.2, §4.3, §3, §12 decision 6 |
| Verified live captures of GoDaddy's available/taken domain result screens and connect options | `search.md` § competitor-search-ux |
| Why "nobody can copy it" is the wrong frame | critique §2 |
| The MCP gap and the Hostinger lesson never applied to our own panel | critique §1 |

## Do not repeat

Six claims about Airo are refuted or unverifiable, and they are the ones most likely to end up in a
deck (§4.3.3, §10.1):

- **`godaddysites.com` free-tier subdomains — refuted.** Airo's Free plan cannot publish at all, and
  paid projects land on `*.airoapp.ai`. `godaddysites.com` belongs to the separate legacy
  Websites+Marketing product. The competitive point survives and is *stronger* — a free tier that
  cannot publish is a harsher gate than an ugly subdomain — but the mechanism as originally stated is
  wrong.
- **"SEO and code-quality scans are free" — refuted.** Security and QA scans are free; **SEO and
  legal scans cost credits**; repairs always cost.
- **"No keyboard shortcuts or command palette", "no inline diffs, file chips or per-message revert" —
  unverifiable.** GoDaddy's help and product pages returned HTTP 403 to fetching. Absence of
  documentation is not evidence of absence; this needs in-product verification.
- **Bimodal radii and the entry-screen hex values — unverifiable.** Sourced to a single marketing
  screenshot; pixel radii and exact hexes cannot be confirmed that way. Use the *composition* of
  that entry screen, not its numbers.
- **"Desktop-only as an authoring surface" — unverifiable.** The quoted strings could not be
  confirmed; indirect corroboration only supports the weaker reading that a QA agent checks mobile
  responsiveness.
- **Airo Plus $59.88 → $95.88 and All Access → $323.88 renewals — third-party sourced,
  `[unverified]`.** The renewal-cliff *pattern* is corroborated by multiple reviewers; the specific
  numbers are not. The Ultimate tier's 750-credit figure is likewise corroborated but not read off
  the tier card.
