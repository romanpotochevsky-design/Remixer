# Remixer — Maintenance page

One self-contained HTML file. No build step, no bundler, no assets, and it makes
**zero external requests** — the logos are inline SVG, the grid is CSS, the
animation player is inline. Drop it anywhere static.

Source design: Figma *AI Website Builder* → node `27883:21134`.

## Preview link (design review)

Upload `index.html` alone and open it. Delete `.htaccess` for a preview — a
preview should answer 200, not 503.

```bash
scp index.html user@server:~/example.com/maintenance/index.html
```

## Real maintenance mode

Keep `.htaccess` next to `index.html`. It answers every request with the page
and a **503 Service Unavailable** plus `Retry-After: 3600` and
`Cache-Control: no-store`, which is what tells Google the outage is temporary so
the URLs survive. Do **not** add `<meta name="robots" content="noindex">`.

Host it on infrastructure independent of the app (static bucket, CDN edge, a
separate box) — a maintenance page that lives with the thing it covers goes down
with it.

## Fonts

The design uses **Gilroy SemiBold** (display) and **Proxima Nova** (text). Both
are licensed, so they are not embedded. The CSS picks them up when installed
locally, which is why it looks right on the designer's machine — but on a
visitor's machine it currently falls back to the system UI font.

Before shipping: self-host the licensed `woff2` files and fill in the
`@font-face` blocks at the top of the `<style>` (`GilroyWeb` /
`ProximaNovaWeb`). Base64-inline them to keep the zero-external-requests rule.
The families are ordered `'Gilroy', 'GilroyWeb', system-ui…` on purpose, so a
missing file can never shadow an installed font.

## Motion (all one-shot, nothing loops)

| element | what happens | timing |
|---|---|---|
| logo | the SVGator export, untouched — plays once on load and holds the last frame (`start: load`, `iterations: 1`, `1620ms`) | 0.05 s |
| grid | aperture opens outward from under the logo — a radial mask grows; line brightness never changes | 0.10 s / 2.8 s |
| headline | per-line mask, each line rides up from `translateY(105%)` | 0.15 s + 0.27 s / 1.15 s |
| “Maintenance” contour | 1px gradient stroke fades up | 0.35 s / 2.9 s |
| sentence, button | rise 16px out of transparency, in order | 0.55 s, 0.72 s / 0.9 s |
| “Maintenance” fill | gradient mass fills in behind the contour | 0.80 s / 3.4 s |
| contour sheen | one slow pass of light along the outline only | 1.5 s / 3.6 s |

Easing for reveals is `cubic-bezier(.16, 1, .3, 1)` throughout.

`prefers-reduced-motion: reduce` and JS-off both render the finished state with
the static logo — nothing animates and nothing is missing.

## Wordmark paint (matches Figma exactly)

The oversized “Maintenance” is two stacked text layers:

- fill — gradient `white .12 → 0`, reaching 0 at 81.8% of the text box;
- contour — 1px inside stroke, gradient `white .08 → 0`, constant to 41.4%,
  gone by 78.6%, done with `-webkit-text-stroke` plus a mask for the fade.

Below 560px the oversized wordmark is dropped: it stops being several times the
headline size and starts colliding with it instead of sitting behind it.

## Open question for the team

If Remixer's own maintenance does **not** take customers' published sites
offline, the page should say so in one line. Right now every site owner who
lands here reads it as “my live site is down”. That is a product fact to
confirm, so it was deliberately left out rather than guessed.
