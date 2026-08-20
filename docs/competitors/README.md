# Competitors — the map

This folder is a **routing layer**, not a second audit. Everything we actually know about a
competitor lives in the four large documents in [`audits/`](audits/) plus the domain research
under [`../features/domains/research/`](../features/domains/research/). The pages here exist so
that "what do we know about Base44?" is one file open instead of four greps.

**Rule for this folder: route, do not duplicate.** A dossier page says what a company is, why it
matters to Remixer specifically, what to steal, what to avoid — and then points at the exact
section where the detail lives. If a page starts restating an audit paragraph, the page is wrong;
fix it by linking instead.

---

## The two families

The split that matters to us is not "who is best" — it is **who shares our structure**. A pure AI
builder can copy our interface but not our stack. A hosting company with an AI builder is making
the identical bet, hits the identical organisational traps, and is the honest comparison for
anything we claim about registrar + host + mail.

### Pure AI builders — the craft and product benchmark

| Page | Company | Read it for |
|---|---|---|
| [`lovable.md`](lovable.md) | Lovable | **The category reference.** The only product where negotiate → execute → review → recover is one system with one vocabulary |
| [`bolt.md`](bolt.md) | Bolt.new (StackBlitz) | Progressive code disclosure behind one `<>` icon; user-controlled agent blast radius |
| [`base44.md`](base44.md) | Base44 (owned by Wix) | The most mature design-token system in the field, and the only builder designed for scale |
| [`v0.md`](v0.md) | v0 (Vercel) | Best proof-before-signup funnel; the only agent that visually QAs itself in public |

### Hosting companies building an AI builder — our structural twins

| Page | Company | Read it for |
|---|---|---|
| [`godaddy-airo.md`](godaddy-airo.md) | GoDaddy Airo AI Builder | **Our closest twin.** Registrar + host bolts on an AI builder. They already ship the zero-record connect our audit proposed as an overtake play — and bury it |
| [`hostinger.md`](hostinger.md) | Hostinger Horizons | The closest structural mirror, and the cautionary one: a builder with no front door, buried in a control panel |

### Not covered anywhere yet

[`_blind-spots.md`](_blind-spots.md) — whole companies missing from our audit, with the question
each one would answer and a priority. Cloudflare and the WordPress cohort are the two that can
change strategy, not just design. Treat that file as a work order, not a reading list.

---

## Study order, and why

Read in this order. It is ordered by *how much a page changes what we do next*, not by how
impressive the company is.

1. **[Lovable](lovable.md)** — every other page is scored against it, and our shell, motion
   language and state vocabulary are all being built toward its bar. Reading anything else first
   means reading it without a reference frame.
2. **[GoDaddy Airo](godaddy-airo.md)** — the same move we are making, by a company that made it
   first. Both the playbook and the ten organisational traps transfer directly, and they hold the
   one play we told ourselves was ours.
3. **[Hostinger](hostinger.md)** — the only shipped proof that the email lever converts, and the
   clearest picture of what happens when the builder lives inside the control panel. That is one
   org-chart decision away from being us.
4. **[Base44](base44.md)** — the reference for our design system and for multi-page scale; also
   Wix's, which is the single fact that makes our moat sentence false.
5. **[Bolt](bolt.md)** — two strong ideas (disclosure, blast radius). Read for those; its
   economics are a warning, not a model.
6. **[v0](v0.md)** — read when working on generation choreography and the pre-signup funnel, the
   two dimensions where we score worst.

---

## The four source documents

| Document | What it is for |
|---|---|
| [`audits/synthesis-q3-2026.md`](audits/synthesis-q3-2026.md) | The full audit, 13 Aug 2026, ~98 KB, 10 numbered sections. Field scoring (§2), Lovable decoded (§3), per-competitor teardowns (§4), table stakes (§5.1), where we stand (§6), catch-up list (§7), overtake list (§8), design-craft rules (§9), risks (§10). **The section numbers used across this folder are its.** |
| [`audits/synthesis-critique.md`](audits/synthesis-critique.md) | The adversarial read of the audit above. Names what is missing (§1), which claims are asserted rather than observed (§2), where the advice is generic (§3), which recommendations would hurt novices (§4), the strongest counter-argument to the whole thesis (§5), and the eight research questions worth more than the audit (§6). **Never quote the audit without checking here first.** |
| [`audits/lovable-builder-teardown.md`](audits/lovable-builder-teardown.md) | Lovable's live builder from a real logged-in account, 13 Aug 2026, 2560×1212. Measured shell geometry, the "More" surface control-by-control, and the publish flow captured across five states including the domain paywall. |
| [`audits/bolt-in-app.md`](audits/bolt-in-app.md) | Bolt's live app from a real Free-plan account, 13 Aug 2026. Short. The headline is the theme discontinuity between marketing and product; also a real preview cold-start failure. |

Also here: [`audits/remixer-competitive-audit.html`](audits/remixer-competitive-audit.html) — the
audit rewritten as a self-contained document (largely in Russian) for showing to people. It already carries
the fact-check corrections inline, so it is safe to show; the markdown synthesis is the one that
still states some refuted claims flatly.

**Adjacent, and the freshest material on all six competitors' domain behaviour:**

- [`../features/domains/research/connect.md`](../features/domains/research/connect.md) — 19 Aug
  2026, 17 products, "what happens when the user already owns a domain". The status-vocabulary
  table (§5) and failure catalogue (§6) are the most transferable pages of competitive research we
  have. §11 corrects our own repo.
- [`../features/domains/research/search.md`](../features/domains/research/search.md) — the
  companion on domain **search**, with verified live captures of GoDaddy, Hostinger and Lovable
  result screens. Five named blocks, no numbered sections; cite as
  `search.md § competitor-search-ux`.

---

## Confidence discipline

Every claim on these pages carries a marker and, where it matters, a date. The convention is
inherited from the source documents:

| Marker | Means |
|---|---|
| `[verified]` | Read from a live page, live DOM, or the vendor's own docs. In `connect.md` this is `[verified-doc]` — attributed to vendor docs and consistent across two independent retrievals. Safe for a deck. |
| `[likely]` | One retrieval, or a good secondary source describing vendor UI. Fine for design decisions. **Re-check before it goes in front of the CEO.** |
| `[unverified]` | Single third-party source, estimated from a screenshot, or explicitly flagged by the fact-check. Design-informing only, never quotable. |

Two standing cautions:

- **"Verified" was doing too much work in the original audit.** It lumps "read from a live DOM"
  together with "DreamHost ground truth", which is unsourced self-report, and no observation
  carries a method or an account state (critique §2, last bullet). When a number matters, go find
  where it came from.
- **`synthesis-q3-2026.md` §10.1 is a list of things not to quote.** Refuted or unverifiable
  claims survive verbatim in the audit body — §8's "that combination exists nowhere else in this
  field" is the most quotable sentence in the document and it is false (critique §1, §5). Each
  dossier here ends with a **Do not repeat** block for exactly this reason.

*Anything on these pages without a marker is analysis, not fact.*
