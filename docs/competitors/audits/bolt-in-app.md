# Bolt.new — live in-app observations
Captured 13 Aug 2026 from a real logged-in account (Free plan).

## The theme discontinuity — the headline finding
**Bolt's marketing site is dark (#171719). The logged-in app is LIGHT.** Crossing from bolt.new to the product is a jarring environment change.
Contrast with **Lovable, where the dashboard runs the exact same `<canvas>` mesh-gradient engine and the same `Camera Plain Variable` typeface as the marketing site** — the product feels like a continuation of the page that sold it. That continuity is a large, under-priced part of why Lovable "feels expensive".

## Dashboard
- Left sidebar ~195px: account chip `roman.potochevsky…` + a **`Free` plan badge** + ⌄ · Home · Projects · Starred · Recently viewed · Shared with you · — · Help Center · Release notes · **Status** · bottom card **"Refer & earn — Share Bolt with friends and get rewarded when they subscribe."** + black **"🎁 Earn $50"** with a red notification dot.
- Hero identical to logged-out, over a soft blue gradient: "What will you build today?"
- Composer: `+` · **`Standard ⌄`** (quality/model tier) · a mode icon · right **`Plan`** toggle + blue `↑`.
- **Output-type chips: Website · Slides `New` · App · Prototype** — the artifact type is chosen *before* generating.
- **"or start from  ⬦ Figma · ⌥ GitHub · ⬚ Team template"** — import paths as first-class entry points ("Team template" appears only when logged in).
- Placeholder is a *suggestion*, not an instruction: "Let's build a prototype…".

## Projects grid
"All projects" + search field + `Last edited ⌄` sort + blue **`+ Create project`**. Cards 3-up: thumbnail, title, date.
**Weakness:** 8 of 9 cards render a grey placeholder "b" mark instead of a screenshot — no preview was ever captured. Lovable, by contrast, embeds a real rendered screenshot of the page inside the chat message itself.

## Builder shell
- Top bar ~30px: logo · avatar `R` · `/` · project name · ↺ history · ▥ panel toggle · segmented **`👁 Preview` | `</>` | `▥` | `⚙`** · right: GitHub mark · **`Upgrade`** (black) · **`Share`** (black) · **`Publish`** (blue).
  → Publish = blue (action). But **Upgrade is neutral black**, where Lovable paints it violet as a brand/plan colour. Bolt spends no colour on the upgrade path.
- Chat panel **~275px** (Lovable 324px).
- Composer: **"How can Bolt help you today? (or /command)"** → **slash commands**. Controls: `+` · **`Standard ⌄`** · **`Select`** (element picker, greyed until the preview is live) · **`Plan`** · blue `↑`.
- Assistant output is a **wall of structured prose** — bulleted feature list, then bolded section names (Hero — … Food Gallery — … Menu — …), then a closing paragraph on fonts/palette. Ends with an attribution line **"ⓘ Image search powered by Pexels"** and a reaction row (↻ retry · 👍 · 👎 · ⋯).
  → Compare Lovable: a compact titled card + an embedded screenshot + `Details`/`Preview` buttons. Bolt makes you *read*; Lovable lets you *look*.
- **Version checkpoints are explicit cards in the thread**: "Build Beit Al Karam restaurant website" / **"Version 1 at Jul 29 12:59 AM"** + a bookmark icon.
- **Failure state observed:** reopening a project from Jul 29 left the preview pane reading **"No preview available"** — the WebContainer did not cold-start the dev server. The in-browser runtime that is Bolt's differentiator is also its reliability tax. Lovable's preview re-rendered immediately.

## Cross-app patterns worth carrying into Remixer
1. **Plan badge next to the account in the sidebar** (`Free`) — both Lovable and Bolt do it. Cheap, constant, non-nagging awareness of plan state.
2. **Referral card pinned to the sidebar bottom** — Lovable: "Share Lovable — 100 credits per paid referral"; Bolt: "Earn $50". Both monetise the empty bottom of the nav.
3. **A quality/model tier exposed in the composer** — Bolt `Standard ⌄`, v0 `v0 Max ⌄`. The user is given an explicit cost/quality lever before spending.
4. **Import as an entry point** — Figma and GitHub sit beside the prompt box, not buried in settings.
5. **Artifact-type selection before the first prompt** — Bolt (Website/Slides/App/Prototype), Base44 (`[Apps]` • Websites • Games • Tools). Nobody makes the user describe the *format* in prose.
6. **`Status` link in the product nav** — Bolt links its status page from inside the app. For a hosting company that is table stakes, and we already have the infrastructure.

## Not captured
v0 was **not** logged in on this machine, so the v0 builder (design-system grounding, forks/versions, Design Mode) rests on public sources only. Base44's builder likewise untoured.
