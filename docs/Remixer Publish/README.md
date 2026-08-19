# Remixer · Publish

The Publish panel and everything about putting a site live: the panel's chrome, the
unpublished-changes counter, the address field, and the row where a domain reports its
progress.

**This file is a restart brief.** It is written so a new session can pick the panel up cold.

> Domains have their own folder — `docs/Remixer Connect domain/`. The dividing rule is
> **the surface owns the doc**: how this panel looks and behaves is here; how a customer
> gets, attaches or moves a domain is there. The seam between them is the domain row, and
> both sides describe it from their own end.

---

## 1. Where the work is

| | |
|---|---|
| Live prototype | https://claude.ai/code/artifact/3a24a501-7176-4bf4-8e99-cbb56b7ba1a9 |
| Figma · panel V2 | `28071:53189` — the current board, revised three times on 19 Aug 2026 |
| Figma · post-checkout states | `28206:66756` — seven domain states (㉕, partly retired chrome) |
| Code | `prototype/src/modules/publish/PublishPanel.tsx` |
| Files in this folder | `panel-v2.md` — the built spec, measurement by measurement |

⚠️ The original design handoff is titled **"Domain Connection *& Publish* Flow"** and covers
both surfaces — its sections ⑥ Publish panel and ⑥-A Launchpad (the chosen direction) are
the panel's own history. It lives with the domain work because that is the Figma page it
describes: `docs/Remixer Connect domain/boards/design-handoff.md`.

---

## 2. What the panel is, as built

```
┌ Publish                                      👥 0 ┐   header 64px
│ ┌───────────────────────────────────────────────┐ │
│ │ Website URL                                   │ │   section 1
│ │ ┌───────────────────────────────────────────┐ │ │
│ │ │ ● fit-ration.com                       ⧉  │ │ │   48px field, Copy
│ │ └───────────────────────────────────────────┘ │ │
│ ├───────────────────────────────────────────────┤ │   hairline
│ │ Secure padlock on · anyone can visit.         │ │   section 2
│ │                          Manage domains  ⚙︎   │ │
│ └───────────────────────────────────────────────┘ │
│ ● 1 unpublished change        [ Publish changes ] │   button bar
└───────────────────────────────────────────────────┘
```

A **sectioned card**, not a stack of floating blocks. Sections divided by one hairline are
what keep the panel a single object however many states it happens to be carrying — and a
domain in flight adds a third section between the two above.

---

## 3. Decisions that are settled

**The counter lives outside the button.** A blue 8px dot plus "N unpublished change(s)" at
the left of the bar; the button keeps one constant verb, "Publish changes". Putting the
number inside the label made the thing you press change width on every edit. When nothing
is pending the left side reads "Everything is published" and the button is disabled — a
primary that says "Publish" and does nothing is worse than one that is visibly unavailable.

**Blue appears once.** The dot is the panel's only use of `--action` outside the button, so
it reads as "there is something to do" rather than as decoration.

**The field's trailing control is Copy, not edit.** An address here is something you send to
someone; editing it is a rare, deliberate act that belongs on the domains surface.

**Visitors sit in the header**, opposite the title — a fact about the site as a whole, not
about the address or the domain, so it is not inside a section.

**The status line faces "Manage domains"** in section 2. Under the field it read as a
footnote to the address; beside the way to change things it reads as the site's standing. It
speaks in all three cases, including "Preview address · hidden from search engines", which
is the reassurance that makes an unpublished site tolerable.

**"Manage domains" is the panel's permanent door** to the domains surface, present in every
state. The dashed "Connect your own domain" card is still an *invitation* and appears only
when there is no domain — invitation and navigation are different jobs.

**The primary button is never handed to the domain** (㉘ A3). A domain's action is a ghost
button on its own row. Handing the primary to the domain made publishing look blocked by
something the customer could not hurry — that is what retired the ㉕ chrome.

**"Free" was in the label and is now not.** Publishing must cost 0 credits — we are the only
builder in the category that charges for it, and it is the most attackable line in any
comparison table. The claim moved out of the button when the label became constant; if it
needs saying, the left-hand line is its home.

**The address never lies.** Until a custom domain resolves, the field shows staging.
`domainResolves()` is the single predicate the panel and the topbar both read, so they cannot
disagree. `world.customDomain` exists for the same reason: it used to be a module constant,
so the panel could name one domain while a sheet named another.

---

## 4. The domain row — the seam with the other folder

A third section appears between the address and the status row whenever the domain has
something to report. Each state carries a tone, one sentence, and an action only when there
genuinely is one:

| state | tone | has an action |
|---|---|---|
| `registering` | amber | no — a registry operation, ≤15 min |
| `propagating` | amber | no — 24–72 h, nothing to hurry |
| `connecting` | amber | no |
| `verifying` | amber | no |
| `icann-hold` | amber | **Resend** |
| `unreachable` | red | **Check again** |
| external setup half-done | amber | **Finish setup** |

Amber means work in flight; red means broken. The external-setup row is amber, never red:
nothing is broken, the ball is simply in the customer's court.

Copy for each state, and the facts behind the durations, live in
`docs/Remixer Connect domain/boards/flows-end-to-end.md`.

---

## 5. Open questions

1. **The board's button colour resolves to `#0073ec`** from a component-library default,
   while the dot beside it and every other primary in the product are `#1587FF`, the
   verified brand action colour. Shipped as `--action`. Confirm which is intended.
2. **The visitor count is a static 0.** There is no analytics anywhere in the world model
   yet. A new site with no traffic honestly reads 0, so it is not wrong — but it does not
   move.
3. **The staging-address line is hidden** behind `SHOW_STAGING_LINE`, parked until its home
   is decided (designer, 19 Aug 2026). Kept in code with its argument intact.
4. **The topbar button still says Publish / Update + count**, while the panel now says
   "Publish changes". The board only draws the panel. If they should agree, the topbar is
   the one to change — it is a disclosure control, so it may legitimately differ.

---

## 6. Picking this up in a new session

1. Read `/CLAUDE.md`, then this file.
2. `git fetch --all` — parallel sessions run in other windows.
3. `cd prototype && npm install && npm run dev`, then ⌘. for the state console.
4. For anything about acquiring or attaching a domain, read
   `docs/Remixer Connect domain/README.md` next.
