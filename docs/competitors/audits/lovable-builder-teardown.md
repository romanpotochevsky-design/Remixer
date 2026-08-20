# Lovable — live builder teardown
Captured 13 Aug 2026 from a real logged-in account, viewport **2560×1212**. Geometry read from `getBoundingClientRect`, colours from computed styles.

---

## Dashboard (`/dashboard`)

- **Left sidebar** ~256px: workspace switcher chip ("Roman's Lovable" + avatar + ⌄) · Dashboard · Search `⌘K` · Templates · Connectors · — section **Projects**: All projects / Starred / Owned by me / Shared with me · — section **Recents**: project names · bottom card **"Share Lovable — 100 credits per paid referral"** with a gift icon · avatar + notifications.
- **Main area is the same `<canvas>` mesh gradient as the marketing site, in dark.** Brand continuity between site and app is total — same typeface, same background engine.
- Personalised greeting: **"What's the vision, Roman?"**
- Announcement pill above the greeting: `New` badge + **"Lovable apps now work in ChatGPT and Claude →"**
- Prompt box: dark translucent, "+" left, **"Build ⌄"** mode selector + mic right. Animated typing placeholder ("Ask Lovable to bui…").
- Below the fold: project browser with tabs **Search / My projects / Recently viewed / Lovable templates** + "Browse all →".

## Builder shell (`/projects/{id}`)

**Measured geometry @2560px viewport:**
| element | value |
|---|---|
| top bar height | **48px** |
| chat panel width | **324px** (12.7% of a 2560 screen) |
| preview iframe | x 325, w 2227, h 1156 |
| shell background | `rgb(31,31,30)` = **#1F1F1E** — a *warm* dark grey, not neutral |
| preview surround | `rgb(39,39,38)` = #272726 (one step lighter than shell) |
| border | `rgb(65,65,61)` = #41413D (warm) |
| app typeface | **Camera Plain Variable** — same as marketing, incl. weight 480 |

**Top bar, mapped left → right (every control is a 28px-tall pill; icon buttons 28×28):**
`8,8` 32×32 logo/"Switch project" · `44,6` 168×36 project name + "Last saved version" (two-line) · `261` "View history" · `293` "Close sidebar" · **segmented group at 333: `Preview` (89w, active) · `Files` (34w) · `Code` (36w) · `More` (36w)** · centre cluster `1247` "Desktop view" · `1285` "Refresh" · **`1309` 202×28 page selector showing the route `/Homepage`** · `1543` "Open in new tab" · right `2309` **Share** · `2373` **Upgrade** · `2473` **Publish**.

**Accent discipline — measured, not inferred:**
- **Publish** = `oklch(0.5243 0.2396 264.41)` = the `--bg-accent` blue token.
- **Upgrade** = `oklch(0.5899 0.2523 294.88)` = the `--bg-special` violet token.
→ Lovable paints *action* blue and *plan/brand* violet. Identical to the rule Remixer already adopted (blue #1587FF = action, indigo = brand/plan/AI). Independent validation.

**Floating visual-edit toolbar** over the preview bottom: 32×32 buttons on a 36px pitch — **Select elements · Edit text inline · Draw annotation · (4th)**. Parked off-screen when inactive.

**Chat panel anatomy (bottom → top):**
- Composer: "Ask Lovable…" + `+` + **`Build ⌄`** mode + mic + `↑` send.
- Above it a **context chip row** (`⚙ More`) showing what the next message is scoped to.
- Above that a dismissible tip strip: **"Reuse work from other projects ⓘ ✕"** with an **"Add reference"** button.
- Above that **AI-generated follow-up suggestion chips** derived from the project — e.g. *"Harden age gate UX"*, *"Ensure reduced motion…"*. Not generic prompts: they name real deficiencies in the user's own project.
- Assistant turn = a **card**: title ("Added Heritage landing page") + a **bookmark/pin icon** + an **embedded screenshot of the generated page** + two buttons **`Details` | `Preview`** + prose summary with inline `code` spans + a reaction row 👍 👎 ⧉ ⋯.
- User turn = a card, clamped to ~4 lines with a **"Show more"** expander.

## The "More" surface — a full-width panel that replaces the preview

URL pattern `?view=more&subview=analytics|mcp|payments|…`. Left nav: **Analytics · Cloud · AI · Agent integrations · Payments · Connectors · Security · SEO & AI search**. Cloud expands to sub-items *Overview / Secrets / Logs / Usage*.

This is structurally the same move Remixer makes (module panel rendered in place of the site preview) — worth knowing we are not alone in it.

### Analytics
Title + **"Last 7 days ⌄"**. Metric selector row: **Visitors · Page views · Views per visit · Visit duration · Bounce rate** (selected one is a raised card, others dimmed). Chart area empty state → **"Publish your app to start tracking visitors" / "Share your app with a live URL to see its traffic here." + blue `Publish`**. Below, four breakdown cards: **Source · Page · Device · Country**, each "No data found for this time period."
→ **Analytics has its own home in the module nav — it is NOT in the publish panel.** This independently confirms the call already made for Remixer.

### Cloud
Two navigation cards ("Logs — Monitor application logs to debug issues ›", "Secrets — Store and manage environment variables securely ›"), then a progressive-enablement card: **"Enable more features" / "Get a full backend with database, storage, and auth — all managed for you."** with two icon rows (Built-in database · File storage) and a full-width blue **"Enable more features"**. Footer escape hatch: *"Already have a Supabase project? **Connect it here**"*.

### Agent integrations (`subview=mcp`)
Empty state: image slot + **"Your app isn't just for people anymore. It's for AI too."** / "Publish your app once and let ChatGPT, Claude, and other AI assistants use it directly" / blue **"Enable agent integrations"**.
→ They turn the *user's generated app* into an MCP server. Genuinely ahead of the field.

### Payments
Card: **"Accept payments"** / "Add payments to your app and start earning. Lovable will help you set up the best option for your needs." Two options — **Built-in payments** ("Lovable handles set-up with the optimal payment gateway…") and **Shopify connector** ("Sell physical goods… inventory and shipping") — each with a "Learn about…" link. Full-width blue **"Explore payments"**.

### Security
Header buttons **`Docs`** + **`Edit security memory`**. Row: "Run your first security scan / Scan your project to surface vulnerabilities and risky configuration." with **two graded CTAs: `Deep security scan` (blue primary) and `Basic security scan` (secondary)**. "Detected Issues" empty state = green shield + "No scan has run yet". Bottom row: "Project dependencies — 0 packages • 0 known vulnerabilities" + `Review`.
→ *"Edit security memory"* — the scanning agent keeps editable persistent memory.

### SEO & AI search
"Optimize search visibility / Help people discover your project through search engines and AI assistants." + `Open docs ↗`.
- **"How your site appears"** — a live **SERP preview card** (favicon + blue title "Northbound Register | Information Guide" + description snippet), and instead of a form, two buttons: **`Ask Lovable to edit details`** and **`Ask Lovable to edit icon`**.
  → **Settings that write a prompt into the chat instead of rendering a form.** Strong pattern: one editing surface, no duplicate CMS.
- **"Get a custom domain"** + a violet **`Pro`** badge — "A custom domain helps your site stand out and rank higher in search." with a disabled state: *"ⓘ Publish your project before connecting a custom domain."*
  → The domain upsell is placed where the *motivation* is (search visibility), not only in Publish, and it is correctly sequenced: publish first, then domain.
- Live progress card: **"Scanning your project… / Reading your pages… 0/5"**.

## Recurring templates worth stealing
1. **Empty-state card**: illustration slot → 2-line headline in sentence case → one-sentence explanation → ONE full-width blue CTA. Used identically in Agent integrations, Cloud, Payments.
2. **Blocked-action disclosure**: rather than hiding or greying a feature, they show it with an inline `ⓘ` row naming the prerequisite ("Publish your project before connecting a custom domain").
3. **Two-tier scan CTA**: `Deep` (primary) vs `Basic` (secondary) — cost/thoroughness choice exposed as two buttons, not a dropdown.
4. **"Ask Lovable to …" buttons** that hand the task back to the chat instead of building a settings form.
5. **Project-specific suggestion chips** above the composer, naming real defects in the user's own build.

---

# The Publish flow, captured end to end

A real project was published from this account to observe every state. The panel is a **popover anchored under the top-bar Publish button**, over the canvas — not a modal, not a page.

## State 1 — not published
| element | detail |
|---|---|
| header | **`● Not published`** — the status IS the title (dot + text), with a **`⋮`** kebab right |
| first-run card | dismissible ✕ · **"Ready to put your site live?"** / *"This lets visitors view what you've built. They never see the changes you make until you publish them."* |
| label | **"Website URL"** |
| URL field | favicon + **`adult-haven-guide`** (white) + **`.lovable.app`** (muted) + **✎** at the right edge |
| visibility row | 🌐 **"Visible to anyone with the link"** + `›` |
| trust row | 🛡 **"No security issues found"** (green) |
| footer | blue **`Publish`**, bottom-right |

**No custom-domain affordance is shown at all in this state** — it only appears after the first publish. The SEO tab states the rule explicitly: *"Publish your project before connecting a custom domain."*

## State 2 — publishing (~90 s observed)
- The **top-bar button itself becomes `Publishing`** — the state lives on the control that triggered it.
- The popover **replaces its entire body** with a centred spinner + **"Publishing your project"** + *"This can take a minute or two. **You can close this and keep chatting with Lovable.**"* + ✕.
- No partial UI, no disabled fields, nothing to do. The copy explicitly releases the user.

## State 3 — success
- **"Your website is live"** / *"Share it to get your first visitors."* → **`⧉ Copy link`** + **`Visit site ↗`**.
- The success copy pushes *distribution*, not just confirmation.
- Panel cross-fades between states rather than swapping.

## State 4 — published & up to date (the resting state)
| element | detail |
|---|---|
| header | **`● Published`** (green dot) + **`👁 0`** visitor counter + `⋮` |
| sub-line | muted **"Your website is up to date"** |
| announcement | dismissible card **"Icon and details have moved ↗"** / *"Ask the agent to change your app's icon, title, and description. You can review them anytime in the SEO tab."* with a heavily-blurred gradient blob of the logo bleeding off the right edge |
| section row | **"Website URL"** left · **`+ Add domain`** (blue link) + violet **`Pro`** badge right |
| URL field | favicon + two-tone domain + **exactly two icons: ✎ edit and ⧉ copy** |
| visibility | 🌐 "Visible to anyone with the link" `›` |
| trust | 🛡 "No security issues found" |
| footer | **`Publish changes`** — rendered **visibly disabled** because nothing is pending |

## State 5 — the domain paywall (`+ Add domain` → )
A ~470px centred modal over a dimmed page. Logo mark top-left, ✕ top-right.
- H1 **"Upgrade to Pro"**
- Sub: **"You need to be on a pro plan to connect a domain."**
- Price card: "Upgrade to Pro 1" + **`$25`** + "due today"
- **"You will unlock:"** ✓ User roles & permissions · ✓ **Custom domains** · ✓ Remove the Lovable badge · ✓ Email support · ✓ Unused credits rollover · ✓ On-demand credit top-ups
- **"Next billing cycle (Sep 13, 2026)"** ✓ *"Your plan will update to $25 / month for 100 credits"*
- Fine print: "Downgrade or cancel at any time." · "By upgrading you agree to our terms."
- Footer: **`Cancel`** (ghost) + **`Upgrade`** (light primary)

---

# What this confirms, and where the benchmark contradicts us

**Confirms decisions already taken for Remixer:**
1. **Visitor counter as one glyph + one number in the panel header** (`👁 0`) — this is genuinely the Lovable convention, as assumed.
2. **Disabled primary when nothing is pending** — real.
3. **Exactly two icons in the URL field** — real; three would be a guessing game.
4. **Analytics does NOT belong in the publish panel** — Lovable puts it in its own module.
5. **Progress is non-blocking**, with copy that frees the user to keep working.
6. **The plan requirement must be stated in plain words.** Their subtitle is a bare declarative sentence: *"You need to be on a pro plan to connect a domain."* No euphemism, no "included in".
7. **Domain is sequenced after first publish**, with the prerequisite disclosed inline rather than the control being hidden.

**Where Lovable does the opposite of what Remixer decided — flag honestly, do not retrofit:**
1. **`Cancel` AND `✕` together** on a conversion-critical dialog. Our rule forbids exactly this pairing. Lovable ships it anyway.
2. **A green dot on the happy state** (`● Published`). Our one-dot rule says the calm state carries zero dots and lets the green word do the work. Lovable's single dot doesn't violate the *spirit* (only one dot is ever visible), but it does violate the letter.
3. **A dead disabled `Publish changes`** in the footer's primary slot, where our ⑲ decision puts a live **`Visit site ↗`**. Our choice is the better one — a disabled control wastes the most valuable slot on the panel.
4. **No lock icon** on the gate. We specified 🔒 + bold requirement; they get the same explicitness from plain language alone.

**What they have that we do not, and should:**
1. **`✓ No security issues found` inside the publish panel** — a trust signal delivered at the exact moment of exposure. Cheap, and nobody else does it.
2. **Two-date billing disclosure** on the paywall: what is charged *today* and what recurs *from a named date*, as two separate lines.
3. **The first-run explainer card** that teaches the staging-vs-live model in two sentences, then dismisses forever.
4. **Success copy that pushes distribution** ("Share it to get your first visitors") rather than merely confirming.

**A weakness in the benchmark worth beating:** the paywall lists six generic plan benefits, with *Custom domains* buried at position two. The user arrived wanting one thing; the modal makes them hunt for it. Leading with the thing they clicked — and only then the rest — is a clear, cheap win. Also *"Upgrade to Pro 1"* leaks an internal plan-variant name into the UI.

---

**Account note:** the project *Canadian Hotel Guide* was published to `adult-haven-guide.lovable.app` to capture these states, and remains live. Unpublish or leave it as the user prefers.

