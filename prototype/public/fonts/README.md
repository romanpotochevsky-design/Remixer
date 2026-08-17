# Brand fonts go here

The prototype's type is **Gilroy** (names and numbers) and **Proxima Nova**
(prose). Both are commercial faces. DreamHost licenses them — the mockups and
the live product use them — but the files are **not committed to this repo**,
because redistributing a licensed webfont through a public GitHub repository is
not covered by a normal webfont licence.

## Installing them

Drop the licensed `.woff2` files into this folder under exactly these names:

```
Gilroy-Regular.woff2         ProximaNova-Regular.woff2
Gilroy-Medium.woff2          ProximaNova-Medium.woff2
Gilroy-SemiBold.woff2        ProximaNova-Semibold.woff2
```

Then `npm run build`. Nothing else to change — `src/index.css` already declares
these faces, and it declares them *first*, so each one takes over the moment its
file exists. You can install them one at a time; a missing file is simply a face
that does not load.

If all you have is `.otf`/`.ttf` from the brand kit, convert them first —
`.woff2` is roughly a third of the size and is the only format worth shipping:

```
npx ttf2woff2 < Gilroy-Medium.ttf > Gilroy-Medium.woff2
```

Only these six weights are used anywhere in the prototype. If a mockup later
calls for Gilroy Bold or Proxima Nova Light, add the file here and a matching
`@font-face` block in `src/index.css`.

## Why they are not already here

This repository is **public**, and a commercial webfont licence does not cover
redistribution — which is exactly what committing the file to a public repo is.
So `.gitignore` keeps `public/fonts/*.woff2` out of git: drop the files in and
they work on your machine, but git never sees them.

The cost is that they do not survive a fresh clone or a new Claude session, and
this project's whole rule is that anything valuable lives in the repo because
the container dies. **Making the repository private removes the conflict**: then
the fonts can be committed, the prototype renders in the real brand faces
everywhere and forever, and the stand-ins below can be deleted. For an
unreleased product design that is probably the right call anyway — worth a
decision rather than working around it.

Also note the npm packages that claim to ship these fonts (`@qpokychuk/gilroy`,
`@dannymichel/proxima-nova`, and others) are unlicensed repackages — one of them
labels Proxima Nova "MIT" and tags it "google fonts", neither of which is true.
Do not install them into a DreamHost repository.

## What renders until then

Two OFL (open-licensed) stand-ins committed in `src/fonts/`:

| Brand face   | Stand-in | Why this one |
|---|---|---|
| Proxima Nova | Figtree  | Same humanist-geometric text face, close x-height and widths |
| Gilroy       | Outfit   | Geometric display face with comparable proportions |

They are **not** the brand faces — the letterforms differ, and nobody should
sign a design off against them. What they buy is consistency: before this, the
prototype drew in whatever font the host machine happened to have (SF Pro on a
Mac, Segoe on Windows, DejaVu in a Linux CI browser), so the same screen laid
out three different ways and only one of them ever matched Figma.

Neither stand-in carries Cyrillic, so the Ukrainian locale falls through to the
system face per glyph. English is the product language, so that trade is fine.

## The artifact build

`.woff2` files are base64-embedded into the published single-file artifact —
both the stand-ins from `src/fonts/` and anything you add here. A strict CSP
blocks external requests from that page, so an artifact can only use fonts that
travel inside it.
