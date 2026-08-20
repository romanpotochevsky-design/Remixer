# Remixer — Copy rules

> The product's language, decided once. Every screen that re-decides a verb, a waiting
> promise or a price format costs us the thing that makes a product feel like one thing
> rather than a bundle of features — Lovable's single biggest craft advantage is that one
> status vocabulary is reused across unrelated subsystems.
>
> Audience: **a complete non-technical novice** ("the housewife test"). US English. Product
> copy ships in English first; `prototype/src/i18n.ts` carries EN as default with UK second.

**Rule 0 — numbers come from the register.** Any price, waiting window, plan name or credit
figure in a frame, a string or a deck cites a fact ID from `docs/product/FACTS.md`
(`DH-101`, `STD-009`). Never type a number into a Figma text layer from memory. If a number
has no ID, it does not go in the product.

---

## 1. Tone

- **Describe the effect, not the mechanism.** The user wants to know what will be true when
  this finishes, not how it works.
- **Say each promise once.** Repeating "free" or "included" in the same panel reads as a
  sales pitch and makes the offer less believable, not more.
- **Short lines.** Cards get about two short lines. If a third is needed, the design is
  answering a question the user didn't ask yet.
- **Name the situation, never the user's mistake.** "We can't see the change at {registrar}
  yet" is the shape — not "invalid configuration", not "you entered the wrong record". The
  category's worst-named states (Vercel's `Invalid Configuration`, Netlify's `Awaiting
  External DNS`) name the server's opinion and have produced multi-year forum threads
  (**CMP-010**). ⚠️ **The shipping string is not written here.** Take it verbatim from
  `docs/features/domains/STATES.md` (`waiting-on-you`): a paraphrase in this file becomes a
  second version of the same sentence, and two versions of one sentence is exactly the
  problem this document exists to prevent.
- **Every non-success state carries exactly one verb.** One thing to press. If there is no
  action available, say so on purpose — Lovable's "Setting up" offers no button *by design*
  and says "nothing for you to do" (**CMP-009**).
- **Never promise a notification, a duration or a certainty we don't have.** See §5
  "Waiting, failure, and promises we can't keep".
- Sentence case for everything except product nouns (Publish, Domains, Remixer Build).
- No exclamation marks in system copy. The site going live is the exciting part; the
  interface does not need to perform excitement.

---

## 2. The verb dictionary

One verb, one meaning, everywhere — including support articles and the marketing site.

**This table is the product-wide dictionary. The verb on a specific domain state is
`docs/features/domains/STATES.md`** — it carries the state machine, one verb per state and
the verbatim EN string. Where a state needs a verb that is not general (`Show me what to
paste`, `Keep editing`, `Finish setup`, `Point it here`), that file decides and this one does
not repeat it. If the two ever disagree, `STATES.md` wins for the state and this table is
corrected.

| Verb | Means exactly | Never use it for |
|---|---|---|
| **Buy** *(or **Add** — see the conflict below)* | Registering a **new** domain we will charge for | A domain the user already owns |
| **Connect** | Attaching a domain the user **already owns** — whether it sits in their DreamHost account or at another company. No money changes hands. | Buying. "Connect · free" is also wrong: free-ness is not news, it's the absence of a charge |
| **Publish** | Making the current version of the site public for the **first time** | Re-shipping changes |
| **Update** | Re-publishing when a live site has unpublished changes | The first go-live |
| **Visit site** | Opening the live public address | Opening the preview |
| **Refresh status** | Re-reading a state the user is waiting on | A page reload |
| **Fix this** | Starting a guided repair of a detected problem | A generic retry |
| **Try again** | Re-attempting one failed step — explicitly **not** remove-and-re-add, which resets the clock and is the worst advice in this category (**CMP-009**). This is the verb on the stuck-certificate variant of `securing` | A different operation. And never write **`Retry`**: that is Lovable's word for this state (**CMP-009**), we borrowed the *behaviour*, not the label, and `STATES.md` renders "Try again" |
| **Check again** | Asking us to re-read the situation at another company after the user says they have changed something — the second button on `waiting-on-you` | A page reload, or a state we are polling ourselves (that is **Refresh status**) |
| **Transfer** | Moving the registration itself to DreamHost — always optional, always later (**DH-206**, **DH-209**) | Connecting. These are different products and users conflate them |

### The one open conflict: `Add` vs `Buy`

| Side | Says | Provenance |
|---|---|---|
| The audit + `CLAUDE.md` | **`Add` = buy** · Connect = attach your own · Publish/Update = republish | DreamHost's own panel: the availability result's button reads **"Add For $"** (**DH-215**). "Add" is the incumbent house verb |
| The Figma domain boards + the prototype (`DomainsSurface.tsx`) | The button says **`Buy`** | Drawn and shipped that way; `CLAUDE.md` flags the divergence and leaves it open |

**Recommendation: ship `Buy`, retire `Add`.** Three reasons. (1) "Add" is the weakest word in
a checkout — the novice's question at that button is *"is this going to charge me?"*, and
`Buy` answers it in three letters while `Add` needs the price glued to it to mean anything.
(2) We already use "Add" nowhere else in the builder, so it carries no consistency benefit
inside Remixer; its consistency is with the **panel**, a surface our user is explicitly not
in. (3) The dictionary's real job is the `Buy` / `Connect` split — paying versus attaching —
and `Buy`/`Connect` is the clearer pair than `Add`/`Connect`.

**This is a recommendation, not a decision.** It needs the designer's call, because the
losing side has to change in three places at once (`CLAUDE.md`, the audit's dictionary, and
either the boards or the code). Recorded as an open conflict in `FACTS.md` §2.19 so nobody
"corrects" one side silently.

---

## 3. De-jargon: the banned list

Banned **in primary paths** — the flow a novice walks when everything is working. Each has a
plain replacement that says what will be true, not what the machine does.

| Banned | Say instead |
|---|---|
| DNS · DNS settings · zone · zone file | "your domain settings", or nothing at all — describe the outcome ("we'll get {domain} pointing at your site") |
| A record · CNAME · TXT record · AAAA · CAA | "the settings your domain needs". The real names appear **only** in the escape hatch (see below) |
| nameserver · nameservers | "point your domain to us"; on the external branch, "your domain's settings live at {registrar} right now" |
| propagation · propagating · TTL | "the change is spreading across the internet" + an honest window (§5 "Waiting") |
| verify ownership · verification record | "we're checking it's yours" — and on a domain already in the DreamHost account, **delete the concept**: "we already know it's yours" (**DH-213**) |
| SSL certificate · provisioning · issuing a certificate | "the secure padlock". The single tolerated exception is the checklist line "Security (SSL) on" — and whether even that survives is an open question (`docs/features/domains/OPEN-QUESTIONS.md` 09, §4 "The canonical success checklist" below) |
| MX · SPF · DKIM · DMARC | "your email keeps working" — named nowhere in the happy path, guarded silently (**DH-205**) |
| EPP code · auth code · authorization code | "the transfer code your current provider gives you" |
| WHOIS · WHOIS privacy | "your contact details stay private" (**DH-113**) |
| registrar | "the company your domain is with" — or, once detected, the brand name itself: "at GoDaddy" |
| 301 · redirect (as a noun) | "sends visitors to {domain}" |
| publish to production · deploy · deployment | "Publish" / "your live site" |
| staging · staging URL · sandbox | "private preview" |
| apex · root domain · www vs non-www | "with and without www" — and decide it for them rather than asking |
| premium · aftermarket · marketed | "taken". We sell neither and broker neither, so every one of those registry statuses collapses into one word (**DH-114**, **STD-022**) |
| available · unavailable · inactive/active (API vocabulary) | "available" is fine; the rest are machine words. Taken is "taken" |
| NXDOMAIN, RDAP, punycode, IDN, Public Suffix List | Never user-facing. They belong to the detection layer (**STD-013**–**STD-021**) |

### The escape hatch — and why the ban is not absolute

The record table must exist, and inside it the technical names are correct and **required**:
a user copying a value into GoDaddy's DNS page needs to read the same words GoDaddy prints.
The rule is *placement*, not vocabulary:

- Collapse it behind one line: **"Prefer to do it yourself? Show the settings."**
- Inside, use the real names, exact values, and a copy button per value.
- Do **not** hide the concept when the concept is the problem. If a domain's nameservers
  point at another company, records we write server-side will not take effect
  (**DH-308**) — saying "we'll take care of it" there produces an invisible, unexplainable
  failure. Name the situation in plain words and offer the one action that fixes it.

---

## 4. The canonical success checklist

Three lines. **This order, every time, on every success and connecting screen:**

```
Domain settings updated
Connected to your site
Security (SSL) on
```

- **The order never varies**, because the order is the information: the padlock arrives last
  (**DH-301**). A checklist whose items tick in a different order on a different screen
  teaches nothing.
- Items tick **as they complete**, and they do not tick early. Marking "Connected" and
  "Security (SSL) on" at the same instant deletes the state the checklist exists to explain
  (`FACTS.md` §2.17).
- No fourth line. If something else needs saying, it is a state, not a checklist item.
- **The one word under review is "(SSL)".** It is the single technical token the de-jargon
  rule tolerates, on the grounds that a novice recognises the acronym even without
  understanding it. That trade-off is an open question, not a settled rule
  (`docs/features/domains/OPEN-QUESTIONS.md` 09); if it loses, the line becomes
  "Secure padlock on" and changes on **every** screen at once.
- The same three lines carry the connecting state (unticked) and the live state (ticked) —
  one component, two states, never two vocabularies.

---

## 5. Waiting, failure, and promises we can't keep

**Never state a duration the path cannot honour.** The current copy "Usually a few minutes —
keep editing, it goes live on its own" is *true and excellent* for a domain already in the
DreamHost account, where we write the records ourselves (**DH-213**), and **false** for
anything requiring a change at another company, which DreamHost's own KB documents at
**4–72 hours** (**DH-203**). One string cannot serve both branches (`FACTS.md` §2.16).

| Path | Honest window |
|---|---|
| Domain already in the DreamHost account | "Usually a few minutes" |
| A domain we just registered for you | Live in minutes; full propagation up to 24–72 hours (**DH-204**) |
| Nameserver or record change at another company | "Usually under an hour, sometimes up to two days." The field says "up to 48 hours" out loud (**CMP-035**) — being vaguer than Shopify is not kindness |
| The padlock | "Usually within half an hour of connecting" (**DH-301** — unverified; get the real number before this ships) |

**Banned promises**

- "We'll email you when it's live." Nobody has confirmed the notification exists
  (**DH-311**). Until it does, the honest pair is *"it goes live on its own"* + **Refresh
  status**.
- "Instantly secured" / a padlock claimed at the moment of connection.
- "Your visitors will see the previous version within about 30 seconds" (rollback) — not
  keepable across recursive resolvers (**DH-310**).
- "One click and we'll set it up at your registrar" for external domains. We cannot do this
  today (**DH-201**, **DH-202**).

**State names and state strings.** The naming authority is
**`docs/features/domains/STATES.md`** — it carries the machine, the verb per state and the
**verbatim EN string** for each. It extends `connect.md` §12 decision 1 "Ship a named state
machine, not a spinner" (adding `unfinished`, `in-use-here`, `elsewhere-in-dreamhost`) and
renames `taken-over` → `wrong-site`; take its names, not the research's. Do **not** use the
audit's earlier list ("Provisioning DNS", "Issuing SSL certificate"): those are Lovable's
internal labels and they break §3 "De-jargon" of this document (`FACTS.md` §2.6).

**And do not copy its strings into this file.** Earlier drafts of this section quoted the
research's wording four lines after telling the reader to use `STATES.md` — so the same
sentence existed twice, in two variants, with the paraphrase in the file that calls itself
the rules. This section governs the **shape** of the copy; `STATES.md` owns the words.

Two states carry the most traffic and do not exist in our design yet — both are governed by
that file:

- **`ready`** — connected, not yet published. The novice who connects a domain and never
  presses Publish concludes the product is broken; this state is the whole fix, and its verb
  is the blue **Publish** (**CMP-009**).
- **`waiting-on-you`** — a *designed* one-hour timeout, not an error. It blames the
  situation, never the user: on a slow registrar, a single pass through this state is a
  plausible outcome of a **correct** configuration. Its verb is the one thing to press plus a
  **Check again** alongside it.

---

## 6. Price honesty

Non-negotiable, because these are the rules a novice can actually check on us:

1. **The renewal price is never hidden.** Every domain price shows the first year *and* the
   renewal: "Renews at $19.99/yr". The deltas are large enough that hiding them is a dark
   pattern by any definition — `.shop` goes $0.99 → $34.99 (**DH-105**). DreamHost's own
   pricing table already prints both columns, so this is on-brand, not a concession.
2. **Price before the cart.** The plan and the total appear in the sheet, before any payment
   step. No cart surprise, ever.
3. **Monthly framing on cards, full total at checkout.** "from $9.99/mo" on a card
   (**DH-001**); the yearly total $119.88 and the multi-year minimums stated at the moment of
   payment — including `.ai`'s two-year minimum, which is $179.98 due today (**DH-110**).
4. **Never present a promotional first year as the price.** First-year gaps are rotating
   registry promotions (**DH-112**), which is also why prices live in data
   (`TLD_PRICES`), never in a Figma text layer.
5. **No "free domain" hook.** The free-first-year credit is documented as not applying to a
   builder plan (**DH-115**).
6. **No "Make an offer", no premium pricing, no aftermarket.** We sell none of it, so a taken
   name pivots straight to alternatives (**DH-114**).
7. **Currency.** Every figure in the register is the USD reading; dreamhost.com is
   geo-currency aware (**DH-111**). A hardcoded `$` string is a bug outside the US.
8. **State what is free, in the product.** Publishing, hosting, SSL, connecting a domain,
   restoring a version, fixing Remixer's own errors — as a list the user can read, not a KB
   article they have to find. Competitors publish theirs (**CMP-037**); ours does not exist
   yet (**DH-012**).

---

## 7. One name per thing

The audit's open question 27 is a warning we will otherwise walk into: GoDaddy's own docs
name the same control two different ways. The decided names:

| Concept | The name | Not |
|---|---|---|
| The paid plan | **Remixer Build** | "the Build plan", "Pro", "premium" |
| The free address every project gets | **Private preview** | staging, sandbox, test site, dev URL |
| The custom domain destination | **Public website** | production, live URL (as a label) |
| The panel that ships the site | **Publish** | Deploy, Go live (as a panel title) |
| The domain surface | **Domains** | Domain manager, DNS, Domain settings |
| The action on a domain you own | **Connect** | Attach, Link, Point — see the note below on the one sanctioned use of "Point" |
| The action on a new domain | **Buy** (pending §2 "The verb dictionary") | Add, Get, Register (in the button) |
| The AI's balance | **credits** | tokens, points, quota |

**The one sanctioned "Point".** "Point" is banned as a **name for connecting** — the action
is Connect, everywhere, and "point your domain" is the plain-language *description* the
de-jargon table hands out in place of "nameservers" (§3), never a button. It survives in
exactly one place: `docs/features/domains/STATES.md` gives the `wrong-site` state the verb
**`Point it here`**, and that is deliberate — there the domain is already connected and is
showing somebody else's site, so the user is not connecting anything; they are redirecting an
address that already resolves. Nothing else in the product may use the word as a verb, and
this exception does not spread to `connecting`, `unfinished` or the buy flow.

When a new control needs a name, check this table and the verb dictionary first. If it isn't
here and it will appear more than once, add it here in the same change that adds the control.
