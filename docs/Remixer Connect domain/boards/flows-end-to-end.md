# Two domain flows, end to end — what exists, what is missing, what is wrong

> Written 19 Aug 2026 in answer to a direct question: *"㉖ — где полные флоу? и где
> полный флоу когда ты ищешь и покупаешь новый домен, от поиска до момента когда
> домен уже работает?"*
>
> **Answer: neither flow exists as a chain anywhere.** Both are assembled from
> fragments spread over two Figma pages, several links have never been drawn, and
> one link that *is* drawn states a timing the verified DreamHost facts contradict.
> This file is the chain, link by link, with each link marked ✅ drawn ·
> ⬜ missing · ❌ wrong.

---

## 1. The DreamHost mechanics that decide the shape of both flows

Everything here is `[verified]` from DreamHost's own help centre via
`docs/Remixer Connect domain/research/domain-search-research.md`, except where marked otherwise.

| fact | value | source status |
|---|---|---|
| Registration completes after checkout | **"within 15 minutes of completing the purchase form"** | verified |
| **New registration's nameservers propagate** | **24–72 hours to fully update** | verified |
| Any nameserver change propagates | 4–72 hours | verified |
| DreamHost nameservers | `ns1` `162.159.26.14` · `ns2` `162.159.26.81` · `ns3` `162.159.27.84` `.dreamhost.com` | verified |
| Domain registered with us but not hosted | panel status **"DNS Only"** | verified |
| SSL (Let's Encrypt) | ~10–30 min after DNS actually resolves | verified (CLAUDE.md) |
| Registrations refundable? | **No.** Deletion grace up to ~5 days, some TLDs none, support only | verified |
| Transfer in | $9.99, adds a year, 5–7 business days, ICANN 60-day lock | verified |
| Domain Connect | **DreamHost supports it in no role** | verified |
| Premium domains / brokerage | **none** — never show "Make an offer" | verified |

### The single most important consequence

**A domain you just bought and a domain you already own behave completely
differently, and the difference is speed.**

- **Already in the account** — the nameservers are ours and long since propagated.
  Pointing it at the Remixer site changes *records on our own DNS*, not the
  nameservers. Effect is near-immediate. "Connects in a few seconds" is honest.
- **Just registered** — the domain is new to the global DNS and its nameservers
  need **24–72 hours** to fully update. It is **not** a matter of seconds.

So the two flows cannot share one shape:

> **Flow A (own domain) can be a single continuous moment. Flow B (new purchase)
> must survive the customer closing the tab, because it legitimately takes hours
> to days.**

❌ **This breaks a line that is currently drawn.** The hi-fi board `28206:66756`
state `1 connecting` is annotated *"домен куплен у DreamHost, DNS наш, счёт
секундам"*. For a **newly registered** domain that is wrong by the verified fact.
The checkout sheet's *"Connects automatically after checkout"* is not wrong, but it
is silent on duration, and a novice will read it as "immediately".

---

## 2. Flow A — connect a domain already on DreamHost (plan in hand)

The continuation of ㉖ `27071:20573`. Three entry points, one chain.

| # | step | screen | state | note |
|---|---|---|---|---|
| A0 | entry | dashboard row **Connect** · typed the owned name in search · search result ㉗ `4 в аккаунте` | ✅ | all three land on the same sheet (shipped 19 Aug) |
| A1 | confirm | ㉖ **A** — nothing on the domain: three elements, "On DreamHost · connects in a few seconds", CTA **Connect domain** | ✅ | no price, no transfer offer |
| A1b | confirm, risky | ㉖ **B** — a site is already served there: "This domain currently shows another site" / "Your email keeps working · the old site stays on your account", CTA **Replace site** | ✅ | the verb *is* the guard |
| A2 | **connecting** | built 19 Aug: toast + amber→green topbar, no panel | ✅ built | see below |
| A3 | live, padlock pending | `28206:66756` state `2 live https pending` — "Secure padlock is switching on · usually within 30 minutes · the site already works" | ✅ | |
| A4 | live, secure | `28206:66756` state `3 live secure` — padlock on, "Anyone can visit" | ✅ | |
| A5 | failure | `28206:66756` state `6 failed` — "We can't reach this domain yet" + **Check again** | ✅ | |

### A2 — the one missing screen, and what it should be

Nothing is left for the customer to do, so **the Publish panel must not open**.
That follows the rule this flow already established: *the panel opens only when
there is an action left.* Opening it here would be an interruption dressed as
progress.

So A2 is not a screen at all, it is a **transition**:

1. the sheet closes;
2. a **toast** confirms the event — "Connecting trulieve.com";
3. the **topbar address flips** from `…remixer.app` to `trulieve.com` with an
   **amber dot**;
4. within seconds the dot goes **green** and the toast is gone. The customer never
   waited on anything.

Amber → green in the topbar is the whole story. That is why this case needs no
panel, no status page and no checklist.

---

## 3. Flow B — search, buy, and go live on a new domain

| # | step | screen | state | note |
|---|---|---|---|---|
| B0 | search, empty | dashboard `HomeScreen` — 880px field, existing domains + AI suggestions | ✅ built | |
| B1 | typed a word | ㉗ `1 слово` — exact match hero, other endings, AI ideas, renewal on every row | ✅ | built at 2026 hi-fi as `ResultsScreen` |
| B1b | typed a phrase | ㉗ `2 фраза` — the one case where inventing names is right | ✅ built 19 Aug | AI block leads; footer points back to the classic path |
| B1c | **name is taken** | ㉗ `3 занят` — `Taken` chip, "Registered at GoDaddy", CTA **This is my domain**, then alternatives | ✅ built 19 Aug | opens the `connect-external` sheet → setup screen (two lines). Plan gate folds into the sheet; `pendingSetup` resumes the setup after checkout |
| B2 | confirm & price | checkout sheet `27058:100133` / `27254:11737` / `27275:33023` — first year + honest renewal; plan chooser folds in when there is no plan | ✅ built | |
| B2b | spelling guard | ㉓ `26990:20573` — **"Check the spelling — registrations are final and non-refundable"** | ✅ built 19 Aug | in the sheet, on every buy |
| B3 | checkout | hosting panel cart, `panel.dreamhost.com/?tree=checkout.dashboard` | ✅ built 1:1 | leaves Remixer |
| B4 | Submit Order → back | toast "Remixer Build added" + panel opens with the domain row | ✅ drawn (`28206:66756` state 1) | no receipt page exists — confirmed |
| B5 | **registering** | built 19 Aug: panel row "usually under 15 minutes", staging address keeps showing | ✅ built | ≤15 min, registry operation, nothing to click |
| B6 | **connecting → propagating** | built 19 Aug with the honest copy ("most visitors within a few hours, up to 72 hours worldwide") | ✅ built | the board's "seconds" annotation remains wrong for NEW registrations — redraw ㉘-style when the states get their hi-fi pass |
| B7 | **ICANN registrant verification** | `28206:66756` state `5 icann verify` — "We sent a link to roman@example.com · 14 days left" + **Resend** | ✅ drawn, ⚠️ **fact unverified** | see §4 |
| B8 | live, padlock pending | state `2 live https pending` | ✅ | |
| B9 | live, secure | state `3 live secure` | ✅ | |
| B10 | failure | state `6 failed` | ✅ | |
| B11 | plan lapsed, domain kept | state `7 not paid` | ✅ | |

### B5 + B6 — what the missing middle should say

These two are one honest sequence, and the numbers are the design:

- **B5 registering** (≤15 min). "Registering trulieve.com — usually under
  15 minutes." Nothing to do. The topbar still shows the staging address, because
  the domain genuinely does not work yet and **the address field must not lie**.
- **B6 connecting** (hours, not seconds). This is the state the current board gets
  wrong. Honest copy, in plain language and without the word DNS:
  > **"trulieve.com is on its way"**
  > "Most visitors will reach your site within a few hours. It can take up to
  > 72 hours to work everywhere in the world — that part is the internet, not us."
  > *We keep checking · nothing for you to do · you can close this.*

  The panel row carries the amber dot and **no action button**, because there
  genuinely is no action. This is also why B6 needs the resumable shape: the
  customer will leave and come back, possibly the next day, and the flow must be
  exactly where they left it.

**The staging address keeps working the whole time** — that is the reassurance that
makes a 72-hour wait tolerable, and it is already true of the product.

---

## 4. ⚠️ One number must be re-verified before it ships

Board `5 icann verify` promises **"14 days left"** and an expiring window.

- The **rule** is real: ICANN's 2013 RAA requires the registrant's email to be
  verified after a new registration or a registrant-contact change, and the domain
  is **suspended** if it is not. This is genuinely the most damaging unattended
  state in the flow — suspension takes the site *and the mail* down.
- The **number is not verified for DreamHost.** In our research the "15 days"
  figure traces to **Squarespace's** unlink rule, not to a DreamHost or ICANN page.
  ICANN's own RAA text is commonly cited as 15 days, but we have not captured it.

So: keep the state, keep the priority, **do not ship the digit** until someone
reads DreamHost's own registrant-verification article. Until then the copy should
say "before the deadline in the email" rather than inventing a countdown.

---

## 5. What actually has to be designed, in priority order

> **Status 19 Aug 2026: 1–5 are built in the prototype** (branch
> `claude/remixer-connect-domain-awdg3f`). Only §4's number is still open.

1. ✅ **B6 connecting, honest about 24–72 h** — Publish panel domain row.
2. ✅ **B5 registering** (≤15 min).
3. ✅ **A2 the connect transition** — toast + amber→green topbar, no panel.
4. ✅ **B2b the spelling guard** in the built sheet.
5. ✅ **B1b / B1c in the prototype** — the results screen derives its face from the
   query (word / phrase / taken); `3 занят` opens the `connect-external` sheet, and
   the sheet leads to the two-lines setup screen. The till interrupting either
   connect resumes on return (`pendingSetup`).
6. ⬜ **Re-verify the ICANN number** (§4) — the built copy deliberately ships
   without a digit until then.

---

## 6. Where each piece lives

| | |
|---|---|
| hi-fi page | **"🔗 Connect Domain"** `23484:69717` — section `27058:101898` (dashboard, results, 3 sheets) · section `28206:66756` (7 post-checkout states) · ㉓ `27275:36262` |
| flow page | **"Domain Connection Flow"** `23191:3719` — ㉗ `27269:5564` · ㉘ `27281:5564` · ㉖ `27071:20573` · ④ `23345:5475` · ⑩ `26336:5564` · ⑲ `26403:20573` |
| archive | **"🗄 Domain flow · Archive (pre-research)"** `28231:3810` |
| prototype | `prototype/src/modules/domains/` · `modules/panel/` · `modules/publish/` |
