# Domain flow boards — what is current and what is retired

> Figma file **AI-Website-Builder** (`GP4jNXtc37VTFVZDc9JF0a`), page
> **"Domain Connection Flow"** — canvas id `23191:3719`, **39 top-level boards**,
> sections ①–㉘ plus mobile and a few non-domain frames.
>
> Audited **19 Aug 2026** against the verified research in
> `docs/research/domain-search-research.md` and the product facts in `CLAUDE.md`.
> The designer's instruction was to work out which boards the DreamHost research
> has since invalidated, and put those aside without touching what still holds.
>
> **The re-filing has since been carried out** at the designer's explicit request
> (19 Aug, "убрать куда-то чтобы не мешало"). 28 sections were **moved, not
> deleted**, onto a new page — see §0. Nothing was erased and every move is
> reversible.

---

## 0. What was actually moved (19 Aug 2026)

A new page **"🗄 Domain flow · Archive (pre-research)"** — canvas id `28231:3810` —
now holds the retired work. Everything was **moved**, never deleted.

**28 sections archived**, in four passes:

| pass | sections |
|---|---|
| killed by a verified fact / self-labelled old | ③ `23345:5474` · ③v2 `23728:5476` · ✎② `23345:5473` · ㉔ `26993:20573` · 📱 Mobile `23356:5472` · ✎ Alternates `23346:5473` · ① `23345:5472` · 🔎 v2 `23459:5472` · ②v2 `23477:5472` |
| converged publish rounds | ⑥ `23346:5472` · ⑥-B `23371:5472` · ⑥-A CASE2 `23465:5472` · ⑤ `23345:5476` · ⑦ `26305:5564` · ⑧ `26309:5564` · ⑨ `26311:5564` · ㉕ `27014:20573` |
| confirm / modal rounds | ⑪ `26338:5564` · ⑫ `26342:5564` · ⑬ `26370:5564` · ⑭ `26373:5564` · ⑮ `26374:5564` · ⑯ `26382:5564` |
| panel compaction & pricing refinements | ⑰ `26383:5564` · ⑱ `26398:20573` · ⑳ `26829:20573` · ㉑ `26832:20573` · ㉒ `26841:20573` |

**Left standing on "Domain Connection Flow" (`23191:3719`) — 8 domain items:**

| kept | id | why |
|---|---|---|
| ㉘ После «This is my domain» | `27281:5564` | current connect-own/external flow |
| ㉗ Умный поиск · все состояния | `27269:5564` | current search truth |
| ㉖ свой домен на DreamHost | `27071:20573` | current, matches the shipped guard |
| ㉓ Add domain · новый домен | `26990:20573` | current buy cases |
| ④ Manage domains | `23345:5475` | no replacement — multi-domain hub + stalled-DNS help |
| ⑩ Existing domain → what next | `26336:5564` | no replacement — the primary/redirect branch |
| ⑲ правило одной точки | `26403:20573` | a rule, not a screen; still disciplines panel states |
| ⑥-A Launchpad | `23386:5472` | **kept deliberately** — `CLAUDE.md` still cites it as the chosen publish direction, so it stays until that is re-confirmed |

Three non-domain frames also remain (`23209:46739` Cloud/Database, `23209:79562`
Stripe, `23329:23502` Logged-in user). They belong to other modules, so moving
them was not this audit's call.

### Correction to §3.1 — ㉕ has a hi-fi replacement after all

The hi-fi page carries **`28206:66756` "㉕ Publish panel · после чекаута ·
состояния домена"** — the highest node id in the file, i.e. the newest thing in
it — and it redraws **all seven** states in the current dark language:
`1 connecting` · `2 live https pending` · `3 live secure` · `4 external pending` ·
`5 icann verify` · `6 failed` · `7 not paid`.

So the three states §3.1 called orphaned are **not** orphaned: ICANN verification
("we sent a link to … · 14 days left" + **Resend**), the failure state
("We can't reach this domain yet · your plan is active" + **Check again**) and the
lapsed-plan state are all drawn. That removes the main reason to keep the old ㉕,
which is why it went to the archive with the rest.

### The hi-fi page was cleaned too

**"🔗 Connect Domain" (`23484:69717`) went from 99 top-level objects to 49.**
**50 leftovers** were moved to the same archive page and parked at `x + 60000`, in
their own region clear of the archived sections: stray tracing rectangles
(`Rectangle 1162905*`), pasted screenshots (`image 4**`), scratch text
(`Текст`, `Text text`, `dfdfffdffdf`), loose vectors, plus two frames that named
themselves obsolete — `23484:69718` "STATE·1 default · старый вариант" and
`23498:87366` "v2 · Default (smart field + AI suggestions)" (pre-research).

Component sets were **not** touched (`Domain`, `Button` ×2, `Connect your own
domain`, `Logo`) — instances elsewhere depend on them.

**Two things deliberately left for the designer to rule on:**

1. **15 "Website Builder / Image Library" frames** sit on this page. They are not
   domain work at all — they belong to the Images module, and may well be live.
   Moving another module's work was outside this mandate; they just need re-filing
   onto their own page.
2. **5 loose "Website Builder / Connect domain (+ Existing domains)" frames**
   (`27335:11640`, `27309:66343`, `27878:13178`, `27883:21134`, `27883:21965`) sit
   *outside* the "Connect domain" section. Two of them are **newer than everything
   inside it** (`27878`, `27883` vs the section's `27729` top), so they may be work
   in progress rather than old copies. Not guessed at either way — say which, and
   they go into the section or into the archive.

---

## 1. How "current" was decided

Three independent signals, and they agree:

1. **Node-id era.** Figma ids climb over time. The research-era work sits at
   **`26990`+**; everything at `26841` and below predates it. The boards the
   prototype was actually built from (`27058`, `27085`, `27254`, `27275`, `27729`)
   fall inside that same upper band — they were drawn in the same period.
2. **The author's own markers.** Two sections already carry a retirement note
   pointing at the replacement (§4.1). That marking pass was started and never
   finished; this file finishes it.
3. **Collision with a verified fact.** Any board that promises behaviour the
   research has since disproved is retired regardless of when it was drawn. The
   facts that do the killing are listed in §4.

⚠️ **The hi-fi boards are on a different page.** `25819:143144` (shell),
`26181:33524`, `27058:100133`, `27085:106382`, `27254:11737`, `27275:33023`,
`27729:14650`, `28016:*` return **zero** occurrences in this page's tree. They live
on the 2026 redesign page, inside section **`27058:101898` "Connect domain"**
(11169×8435), which holds exactly six things — and all six are already built:

| board | id | in the prototype |
|---|---|---|
| Domains dashboard, two inventory variants | `26181:33524` · `27085:106382` | `DomainsSurface` → `HomeScreen` |
| Search results | `27257:12068` · `27729:14650` | `ResultsScreen` |
| Checkout sheet ×3 boards, each ±Remixer Build | `27058:100133` · `27254:11737` · `27275:33023` | `DomainModal` |

That is the whole hi-fi set for Connect domain. **Everything drawn at hi-fi is
implemented; everything past the checkout sheet exists only as pre-hi-fi work on
this page.** That gap is the subject of §8.

The MCP's page listing is unreliable in this file: it reports only "UI Kit"
(`2:4`) and "UI Mockups" (`0:1`) and omits both working pages, even though each
opens fine when a node id on it is passed directly. Reach them by node id:
`23191:3719` for this page, `27058:101898` for the hi-fi section.

---

## 2. Current — build from these

### ㉗ `27269:5564` — Умный поиск · все состояния (после ресёрча)
Six boards: `1 слово` · `2 фраза` · **`3 занят`** · `4 в аккаунте` ·
`5 внешний confirm` · `6 края`. The search truth, drawn after the research and
annotated with its reasoning.

Decisions worth not re-litigating, each traceable to the research:

- **Ownership language stays conditional.** A taken domain offers
  **"This is my domain"**, never "You own this" — we cannot know that it is
  theirs. Matches `own-domain-transfer-ux`: no platform in the set claims to
  know the searcher is the owner.
- **The registrar is named** ("Registered at GoDaddy") because RDAP returns the
  sponsoring registrar as registry-level data that WHOIS privacy does not hide
  (`technical-detection`).
- **No "Make an offer" anywhere** — DreamHost has no brokerage (verified).
- AI ideas anchor on the **site's name**, not a new brand: by search time the
  naming stage is over. The one exception is `2 фраза`, where the user typed a
  description rather than a name — there inventing names is the whole point.
- Every row carries the renewal price. Never hide it.

### ㉘ `27281:5564` — После «This is my domain» · план есть / плана нет
Ten boards in four runs — the whole connect-a-domain-you-own flow, and the
direct continuation of ㉗'s "This is my domain" button:

| run | boards | what it settles |
|---|---|---|
| **A** — has Remixer Build | `A1 confirm` · `A2 setup` · `A3 panel` | nothing to pay, straight to setup |
| **B** — no plan | `B1 confirm+plan` · `B2 return` · `B3 convergence` | plan first, setup after checkout |
| **C** — came back later | `C1 entry` · `C2 resume` | pasted one record, closed the tab, returned |
| **D** — re-entry | `D1 click` · `D2 modal opens` | where "Finish setup" in the panel leads |

The load-bearing decisions, in the author's own words on the boards:

- **A1** — "оплаты нет — CTA не смеет говорить «checkout»". With a plan already
  in hand the CTA is **"Show me what to change"**. Transfer is *removed* from
  this step.
- **A2** — "Domain Connect у DreamHost нет — честный сетап". Two A records
  (`@` and `www`), copy buttons, a deep link to the registrar's DNS settings,
  automatic re-checking, and the line **"Everything else — email included —
  stays untouched"**. Transfer is offered **here**, at the moment of friction,
  where its value is visible: "$9.99, adds a year · takes 5–7 days" — which is
  exactly the verified transfer fact.
- **A3** — "поле адреса не врёт: пока домен не работает — там стейджинг".
  The domain's status lives **inside the Publish panel** as its own row with a
  ghost **"Finish setup"** action; the panel's primary button stays **"Update"**,
  because the primary is the panel's function and is never handed to the domain.

### ㉖ `27071:20573` — Connect domain · свой домен на DreamHost · план есть
Two cases, and the reasoning is a design rule worth keeping: **A** (nothing on
the domain) gets three elements and no reassurance — "риска нет, значит и
успокаивать не о чем"; **B** (a site already served there) states the
consequence *where the question arises*, not at the bottom of the window:
"This domain currently shows another site" / "Your email keeps working · the old
site stays on your account".

### ㉓ `26990:20573` — Add domain · новый домен (2 кейса)
Buying a new name, with and without a plan. Also carries an explicit **rejected**
variant: WHOIS privacy is a *benefit*, so it belongs on the search screen where
people are still comparing — not in the checkout, where it is not a term of the
deal.

---

## 3. Retired — superseded inside the research era

### 3.1 Already marked by the author (this audit only confirms them)

- **㉔ `26993:20573` — Connect domain · внешний домен (GoDaddy) · 2 кейса.**
  Carries: *"⚠ УСТАРЕЛО: «you'll approve one change there» — Domain Connect у
  DreamHost не существует (ресёрч, авг 2026). Актуальный флоу — секция ㉘."*
- **㉕ `27014:20573` — Publish panel · после чекаута · состояния домена.**
  Carries: *"⚠ Устарело дважды: Domain Connect нет, И primary панели не отдаётся
  домену — строка получает ghost «Finish setup», primary остаётся «Update». См. ㉘"*

  ⚠️ **But do not simply bin ㉕.** Three of its seven states have **no replacement
  anywhere**, and two of them are grounded in hard external requirements:
  - `5 icann verify` — "не подтвердит за 15 дней — домен отключат, сайт и почта
    умрут". ICANN's registrant-email verification really does suspend the domain;
    this is the single most damaging unhandled state in the whole flow.
  - `6 failed` — connection failed, with a way out.
  - `7 not paid` — the domain is connected but the plan lapsed.

  The *chrome* of ㉕ is dead (it hands the panel's primary button to the domain).
  The *states* are alive and need redrawing on ㉘'s model.

---

## 4. Retired — killed by a verified fact

The facts doing the work, all from `CLAUDE.md` / the research:

- **DreamHost supports Domain Connect in no role whatsoever.** One-click
  connection would require buying Entri (~$249/mo), which has not happened.
- **No brokerage, no premium domains** → no "Make an offer".
- **The free-first-year domain does not apply to the builder plan.**
- **SSL takes ~10–30 min** — never "instantly secured".
- **"We'll email you when it's live" was never verified** (open item #1 in
  `domain-connection-design-handoff.md`) and appears on several boards as if it were.

| section | id | why it is dead |
|---|---|---|
| ③ — STEP 2 · after checkout | `23345:5474` | Built entirely on Domain Connect: `STATE·4 external (Domain Connect)`, `CONSENT· GoDaddy authorize`, "Connect in one click via GoDaddy", "Approve once at GoDaddy and we connect everything for you". None of this can exist. Replaced by ㉘ A2. |
| ③ Connect an external domain · v2 | `23728:5476` | Same promise, later draft: "you'll approve one change there". Replaced by ㉘. |
| ✎ ② старый confirm (no plan gate) | `23345:5473` | Self-labelled old; predates the plan gate, and offers a one-click branch. |
| 📱 Mobile · iOS — main flow | `23356:5472` | `M·External connect` is the one-click + manual pair. Also carries the paywall/on-ramp confusion flagged as open item #2. **The mobile flow has not been redrawn since the research at all** — see §6. |
| ✎ Alternates & explorations | `23346:5473` | Self-labelled "NOT the final flow". Also contains `PUB5·promo`, which leans on the free-first-year hook, and "We'll email you when it's live". |
| ① Buy a new domain | `23345:5472` | Its own boards are labelled "старый вариант". Superseded by 🔎 v2, then by ㉗. |
| 🔎 Domain search · v2 | `23459:5472` | The pre-research smart-field draft. ㉗ is the post-research answer and differs materially (taken state, RDAP registrar, conditional ownership). |
| ② Connect a DreamHost domain · v2 | `23477:5472` | Pre-research; superseded by ㉖ + ㉘. |

---

## 5. Retired — converged explorations

These are not *wrong*, they are *spent*: rounds of variants that were narrowed
down and whose winner now lives either in the redesign page or in a later
section here. Keep for provenance, remove from the working path.

- **Confirm screen / modal rounds:** ⑪ `26338:5564` · ⑫ `26342:5564` ·
  ⑬ `26370:5564` · ⑭ `26373:5564` · ⑮ `26374:5564`. Converged into the checkout
  sheet that is drawn on the redesign page and already implemented.
- **Connect-modal refinements:** ⑳ `26829:20573` (two rows instead of a toggle) ·
  ㉑ `26832:20573` (price alignment) · ㉒ `26841:20573` (plan already held).
  Same destination.
- **Publish-panel rounds:** ⑥ `23346:5472` · ⑥-A Launchpad `23386:5472` ·
  ⑥-B Site Status `23371:5472` · ⑥-A CASE 2 `23465:5472` · ⑦ `26305:5564` ·
  ⑧ `26309:5564` · ⑨ `26311:5564` · ⑰ `26383:5564` · ⑱ `26398:20573`.
  ⚠️ `CLAUDE.md` still records **⑥-A "Launchpad" as the chosen direction**, but
  ⑰/⑱/⑲ are later and ㉘ A3 supersedes the panel's behaviour again. See §7.
- **Post-cart return:** ⑯ `26382:5564`, three variants. ㉘ B2 answers it
  post-research; ⑯'s variant 3 ("статус живёт в панели Publish") is the one that
  survived, which is worth knowing — the answer was already there.
- **Plan gate:** ⑤ `23345:5476`, single-checkout model. The shipped model puts
  the plan inside the sheet and hands off to the panel cart.

---

## 6. Live, but with no post-research replacement

Do **not** archive these — nothing has replaced them, and each holds a real state:

- **④ Manage domains `23345:5475`** — the multi-domain hub, primary vs redirect,
  and the *stalled DNS* troubleshooting screen (nameservers not changed;
  Cloudflare proxy still orange). The troubleshooting content is good and
  fact-grounded. Two repairs needed: it is written for a **nameserver** change
  while ㉘ moved to **A records**, and it promises an email we have not verified.
- **⑩ `26336:5564` — make primary (branch)** — "the site already lives on another
  domain, how should we use the new one" (primary vs redirect). ㉖ B warns about
  the collision but never offers this choice.
- **⑲ `26403:20573` — правило одной точки** — a *rule* rather than a screen (one
  dot at a time: blue = edits, amber = connecting, red = unreachable). Cheap to
  keep, and it disciplines every later panel state.
- **㉕'s states `5 icann verify` / `6 failed` / `7 not paid`** — see §3.1.

---

## 7. Calls that are the designer's, not mine

1. **Physically re-filing the boards in Figma.** I have not moved anything. If
   the sections in §4 and §5 should go into an "Archive" section (or get a `✎`
   prefix like the existing ones), say so and I will do it — but it edits your
   file, so it needs your word first.
2. **The publish panel's direction.** `CLAUDE.md` says Launchpad (⑥-A). ⑰/⑱/⑲
   came later, and ㉘ A3 rewrites the rules again (address field never lies;
   primary stays "Update"; the domain gets a ghost action). Which is current?
3. **Mobile.** The entire 📱 section predates the research and still shows
   one-click Domain Connect. Redraw, or park mobile until desktop settles?
4. **The redesign page.** Its link, so this file can name it and future sessions
   stop guessing.

---

## 8. What this changes in the prototype

Measured against the current boards, three implemented surfaces are now known to
be wrong, and one gap is real:

| prototype | verdict |
|---|---|
| `ExternalScreen` (`DomainsSurface.tsx`) | **Obsolete.** It is a full page showing an IP plus a `remixer-verify=` TXT line. ㉘ A2 is a *modal* with two A records, copy buttons, a deep link to the registrar, automatic re-checking, "email stays untouched", and the transfer offer at the friction point. |
| `StatusScreen` (`DomainsSurface.tsx`) | **Obsolete.** It is a standalone page with a success checklist — the ⑥/④ generation. ㉘ A3 puts the status *inside the Publish panel* as a row with a ghost "Finish setup". |
| `DomainModal` in-use guard | **Close, but the copy is not the drawn copy.** Shipped today carrying the old screen's wording; ㉖ B says "This domain currently shows another site" / "Your email keeps working · the old site stays on your account". |
| search "taken" state | **Missing entirely.** ㉗ `3 занят` draws it: `Taken` chip, "Registered at GoDaddy", **"This is my domain"**, then close alternatives and AI ideas. |

⚠️ **The `dh-external-ns` hole logged in `CLAUDE.md` this morning is answered.**
The CTA there must not say "Connect domain" — ㉘ A1 makes it
**"Show me what to change"**, leading to the A2 setup modal.

---

## 9. Corrections to `CLAUDE.md`

Two entries were written as "not drawn" and are wrong. Both were honest at the
time — the boards are on a page the tooling would not enumerate — but they must
not survive:

- *"⚠️ В макете НЕТ состояния «домен занят» — ни одного."* → **It exists**:
  ㉗ `3 занят` (`27270:5623`), with its reasoning annotated.
- *"КУДА он возвращается внутри Remixer — наше решение и пока не подтверждено"* →
  **Drawn**: ⑯ `26382:5564` explored three returns and ㉘ B2 `27284:5564`
  answers it post-research.
