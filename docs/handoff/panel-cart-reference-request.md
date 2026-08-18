# Panel cart (`?tree=checkout.dashboard`) — reference request + insertion plan

> **Status: BLOCKED on source material, not on work.** 18 Aug 2026.
> The task is to reproduce the DreamHost panel's cart pixel-for-pixel and splice it into
> the prototype's buy-a-domain flow. Everything below is what is already known, what is
> missing, and exactly where the screen plugs in — so the next session is pure drawing.

## 1. Why the cart is not in the prototype yet

The cart could not be opened from the session that was asked to copy it. Two independent
walls, both verified by trying:

| Route | Result (18 Aug 2026) |
|---|---|
| `curl https://panel.dreamhost.com/?tree=checkout.dashboard` | `CONNECT tunnel failed, 403` — container egress proxy denies the host |
| Harness page fetch, same URL | `EGRESS_BLOCKED: panel.dreamhost.com` |
| `help.dreamhost.com`, `www.dreamhost.com`, `dreamhost.com` | all `EGRESS_BLOCKED` |
| `example.com` (control) | also `EGRESS_BLOCKED` — **this environment has no general web access at all** |
| Web *search* | works — returns text snippets only, never pixels |

So it is not a DreamHost-specific block: the environment's network policy allows only
package registries and GitHub. No page HTML, no CSS, no images reach this session.
(See https://code.claude.com/docs/en/claude-code-on-the-web for how the policy is set.)

**Widening the policy alone would still not be enough.** `?tree=checkout.dashboard` is
behind a panel login, and the cart page carries live billing data. An agent should not be
holding the designer's panel session, so the reference has to arrive as material the
designer captures himself (§3).

Nothing here was guessed to fill the gap. The house rule from the domain work stands:
what the mockups do not show, we do not invent — an invented DreamHost cart would be
shown to product owners as if it were the real one.

## 2. What IS verified about the panel purchase flow

Copy and behaviour from DreamHost's own KB (via search snippets, 18 Aug 2026) plus the
earlier domain research (`docs/research/domain-search-research.md`):

- **[verified]** Panel path: *Find New Domains* → type the name → **Search** → **`Add For $`**
  → "to the right you'll see it's been added to your cart" → **choose how many years** →
  **`Proceed to Checkout`**.
  (help.dreamhost.com/hc/en-us/articles/224220668, /360001191426)
- **[verified]** Multi-domain: press `ADD FOR $` on each name, then one `Proceed to Checkout`
  registers them together. (/236186608)
- **[verified]** Purchase constraints: an outstanding account balance must be cleared first;
  domain names max 67 characters; payment requires a major credit card or account credit.
- **[verified]** Prices shown promo-first-year vs higher renewal (.com $9.99/$19.99 …) —
  matches `prototype/src/data/domains.ts` (`TLD_PRICES`), which stays the price source.
- **[unknown]** Everything visual: grid, type scale, colours, the term selector's shape, row
  and summary layout, empty state, error states, and whether `checkout.dashboard` is the
  same cart as the *Find New Domains* sidebar or a separate full page. **This is the gap.**

## 3. What is needed from the designer (shot list)

Plain screenshots are enough; anything technical is optional. Please redact card digits,
account IDs and any personal billing lines before sharing — a crop or a blur is fine.

1. **Cart with one domain in it** — the whole browser window, and say roughly how wide it was.
2. **Cart with two or more domains** — shows how rows stack and how totals recalculate.
3. **Empty cart.**
4. **The years / term control**, open if it opens.
5. **Everything after `Proceed to Checkout`** — the payment step(s) and the confirmation
   or receipt screen. That last screen is where the user comes *back* to the builder,
   so it decides how the return leg is designed.
6. **Any error state** that can be triggered (outstanding balance, declined card) — the
   panel's own error copy matters more than its looks.
7. **Close-ups** of the price block, the buttons, the table header and the summary column,
   so type sizes and weights can be read off rather than approximated.
8. If easy: the same page narrow (phone width) — the prototype has a mobile mode.

*Optional, for genuinely exact numbers:* with the cart open, ⌘S → "Webpage, Complete", and
share the saved file. That carries the real fonts, colours and spacing, which turns
"looks identical" into "is identical".

## 4. Where it plugs into the prototype

The seam already exists in the state model — nothing needs restructuring:

- `prototype/src/modules/domains/DomainModal.tsx` → `confirm()` is the exact insertion
  point. Today it elides payment: it flips `account: 'paid'`, sets `domain: 'connecting'`
  and jumps to the status screen. The cart belongs **between** those two beats.
- `prototype/src/state/world.ts` → `DomainState` already carries a `'checkout'` value that
  nothing renders yet. That is the slot. Cart contents (items × term) are new data and
  belong in `world` too, since more than one screen will read them.
- `prototype/src/state/ui.ts` → one more entry in `Surface` (navigation, not product truth).
- `prototype/src/state/flows.ts` → the buy-a-domain scenario gains the cart step, so the
  CEO demo plays the purchase end to end instead of skipping the till.
- The domain handoff doc already planned for this: "Buy a new domain → search results →
  **DreamHost-style cart** → live" (`domain-connection-design-handoff.md`, scenario ①).

## 5. One thing worth deciding before it gets drawn

Reproducing the cart faithfully is the honest way to document what ships today, and
developers need it. But the flow it documents — the builder handing the user off to the
hosting panel at the moment of payment — is the failure mode this project's own knowledge
base files under Hostinger Horizons ("a builder buried in hPanel"), and it cuts against
audit conclusion #2, *own the 60 seconds around go-live*. Lovable and v0 keep checkout
inside the builder for exactly this reason.

That does not argue against building it. It argues for building it **as a labelled
reality branch**, and drawing the in-app alternative beside it, so the prototype can put
the two seams side by side instead of only inheriting the current one. `flows.ts` is
declarative, so both can live in the same prototype and be demoed back to back.

## 6. Definition of done

- A cart surface matching the screenshots 1:1 at the captured width, with the panel's real
  copy (`Add For $`, `Proceed to Checkout`, the years control, the totals).
- Wired between the checkout sheet's CTA and the `connecting` state, with a return leg
  into Remixer and no dead end.
- A `flows.ts` step so the whole purchase plays unattended for a demo.
- Prices still read from `TLD_PRICES`; renewal never hidden.
- This file updated: the shot list replaced by what the screenshots actually showed,
  and any panel copy captured verbatim.
