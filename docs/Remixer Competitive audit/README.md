# Remixer · Competitive audit

What the rest of the category actually does, measured rather than remembered. This is
**cross-cutting knowledge**: it feeds every feature, not one of them, which is why it sits
in its own folder rather than inside a feature's.

**This file is a restart brief.** It tells a new session what is in here, what may be
quoted, and what may not.

---

## 1. What is in this folder

| file | what it is |
|---|---|
| `synthesis.md` | The full audit, Q3 2026 — ~97k characters, 10 sections: executive summary, a Lovable deep-dive, per-competitor teardowns, table stakes, a catch-up list in three tiers, the overtake list (§8), design-craft rules (§9), risks (§10). |
| `critique.md` | An adversarial read of the audit itself: what is missing, which claims must not be quoted, where the advice is actively harmful to a novice. **Read it in the same sitting as the synthesis** — it corrects the synthesis's overreach. |
| `measured-design-tokens.md` | Fonts, OKLCH palettes, shadows and motion read from the live products with `getComputedStyle`, not from articles. Lovable, Bolt, v0, Base44, Airo. |
| `teardowns/lovable.md` | The live Lovable builder from a logged-in account, geometry from `getBoundingClientRect`, plus its publish flow across five states. |
| `teardowns/bolt.md` | The live Bolt builder from a logged-in account. |
| `raw/recon_dossiers.json` | Six competitor dossiers — the source material. |
| `raw/lenses.json` | Six UX lenses (onboarding, time-to-wow, and so on) across the set. |
| `raw/factcheck_corrections.json` | Claims that were checked and refuted, with verdicts. |
| `remixer-competitive-audit.html` | The presentable document, published as an artifact: https://claude.ai/code/artifact/df670799-1873-4556-a689-584d0f11f9f1 |

---

## 2. The competitors, and why each is here

**Pure AI builders** — the category we are judged against:
- **Lovable** — the benchmark. One loop: agree → build → check → roll back.
- **Bolt** (StackBlitz) — the best reveal of code behind a `<>` icon.
- **Base44** (owned by Wix) — the most mature token system, 40+ pages.
- **v0** (Vercel) — the best "prove it before you ask them to sign up" funnel, and
  self-checking by screenshot.

**Hosts building a builder** — our structural twins:
- **GoDaddy Airo** — the closest analogue: a registrar-and-host with an AI builder.
- **Hostinger Horizons** — a cautionary tale: a builder buried inside a hosting panel.

**Known blind spots**, named by the critique and still unaddressed: Cloudflare, Squarespace,
Webflow, Canva, Wix Studio, 10Web, Durable, and the whole WordPress cohort — the last being
the largest gap, since DreamHost's own base is WordPress.

---

## 3. Conclusions that bear on day-to-day design decisions

1. **Publishing must cost 0 credits.** We are the only builder in the category that charges
   for it, apart from one rated 2.7/5. It is the most attackable line in any comparison
   table anyone ever builds against us.
2. **Own the sixty seconds around go-live**, not "selling domains" — everyone sells domains
   now. Zero-record connect for domains already in the account, and a state machine with a
   word of action at every failure.
3. **Verb dictionary:** Add = buy · Connect = attach one you own · Publish/Update = republish.
4. **De-jargon:** no DNS, nameserver, A record or SSL certificate on primary paths.
   "Point domain to us", "secure padlock", and one canonical success checklist:
   *Domain settings updated · Connected to your site · Security (SSL) on.*
5. **Price before the cart; never hide the renewal price** — hiding it is a dark pattern.
6. **Credits stay visible in the toolbar.** GoDaddy moved them to their own page and it is
   their loudest complaint.
7. **The critique's counterweight, which the synthesis understates:** real churn happens
   *before* go-live, on generation quality — where we score ourselves 1/5 on
   anti-genericness. Domains and mail are the last mile for the people who got that far.
   Balance the priorities accordingly.
8. **§9.10, uncomfortable and worth revisiting:** Inter plus an indigo gradient on a cold
   near-black is three of the four tells of "AI slop", and our blue sits three points from
   Bolt's. The palette deserves a fresh argument.

---

## 4. Facts discipline — the rule that keeps this usable

Every claim about a competitor or about DreamHost carries a **status** (verified / likely /
unconfirmed) and a **date**. Nothing marked unconfirmed may be quoted in material that goes
to leadership — see `synthesis.md` §10.1, and check `critique.md` before repeating any
headline number.

Live capture is how most of this was gathered, and it is not always possible: this
environment's proxy has at times allowed nothing but package registries and GitHub, so
before promising anyone a fresh screenshot of a competitor, test the egress first.

---

## 5. Where this connects to the feature folders

- `docs/Remixer Connect domain/` — conclusions 2, 3, 4 and 5 above are the ones that shaped
  the domain flows; the folder's README restates them as settled decisions.
- `docs/Remixer Publish/` — conclusion 1 is why the panel's copy says publishing is free.
