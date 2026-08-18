# The panel cart, measured — `panel.dreamhost.com/?tree=checkout.dashboard`

> Source: a **"save page → Webpage, Complete"** capture of the live cart, taken by the
> designer on **18 Aug 2026** (window wider than 1512px, so the desktop chrome and the
> 1280–1949 cart band). Reproduced in the prototype as `prototype/src/modules/panel/`.
>
> The capture itself is **not** in this repository, and must not be: it carries session
> cookies, account identifiers and the signed-in customer's avatar, and this repo is
> public. Everything worth keeping is written down here.

## 1. How the numbers were obtained (repeatable)

The cart is a React micro-frontend. Two things follow from that:

- **CSS modules survive a save.** `app(3).css` is the checkout's stylesheet: a
  230-token light theme (`.universalCheckoutLight`) plus hashed classes
  (`orderSummary-gg0Ae`, `productTile-oQaoZ`, …). Every layout value below is read
  from it, and `panel-cart.css` names the original class beside each one.
- **Emotion styles do not.** MUI's runtime styles (`css-1okv2k8`…) are injected
  through CSSOM in production, so a saved page loses them. Those few values were
  recovered from the JS bundle's `sx` props instead — e.g. the "Your order (n)"
  label is `Typography fontFamily="Gilroy" fontWeight={600} color={gray[650]}` with
  `mb:2`, and the recommendations card is `Paper borderRadius={16} p={4} mb={4}`.

Verification was not eyeballed. The saved page renders **offline with JavaScript
blocked** (its own scripts would try to boot a logged-out app over the captured DOM),
which lays the real markup out with the real CSS at any viewport. Measuring
`getBoundingClientRect()` on both that page and the prototype at the same width turns
"looks close" into a diff. At 1800px the two now agree exactly:

| element | real | prototype |
|---|---|---|
| cart header | 1069 × 161, padding 0 56 | 1069 × 161, padding 0 56 |
| cart title | 957 × 104, 32px/600 Gilroy | 957 × 104, 32px/600 |
| product card | 973 wide, padding 40 0 24, radius 20 | same |
| tile | 973 wide, padding 0 32 | same |
| product icon | 64 × 64, radius 20, glyph 32 | same |
| name / sub | 24px/700 · 14px/400 @70% | same |
| select | height 52, radius 12 0 0 12 | same |
| remove | 64 × 64, radius 12, border #ccc | same |
| summary column | 472 wide | same |
| summary title | 381 × 36, 24px/700 | same |
| total row | 397 × 36, title 17px/600, price 24px/800 | same |
| disclaimer | 397 × 176, padding 32 24 | same |

That diff caught three real mistakes: a `line-height` on the cart title the panel does
not set, the summary type sizes that drop a step in the 1024–1949 band, and the
`scrollbar-gutter: stable` that makes the summary's rows ~15px narrower than its
padding implies.

## 2. Theme (light — the only theme the cart ships)

```
page background      #f4f6f9   (.tab_checkout-dashboard .content-wrapper)
surfaces             #fff
hairline             #e9ebec   (header, summary border-left, tile border-top)
ink                  #071c27   (cart title, product name, select text)
body text            #434f58
summary text         #000
section labels       #3f3f46   (gray.650)
action               #003cd7 → hover #254ef8      (--templates-buttonSimple-bg)
blue                 #0073ec
select border        #ccc · hover #80b9f5 · active bg #e5f1fd
renewal strip        bg #fff3e0, border rgba(244,81,30,.1), icon #F4511E
card shadow          0 5px 37px rgba(31,35,62,.03)
disclaimer           bg rgba(0,60,215,.05), border rgba(0,60,215,.07)
product icon tile    rgba(51,64,169,.15) · domain: rgba(0,115,236,.102)
reco icon tile       SEO #ecf6ed · domain rgba(166,68,229,.1)
offer pill           bg rgba(0,115,236,.15), text #0073ec, radius 56
```

Typefaces are **Gilroy + Proxima Nova** — the same pair Remixer uses. Gilroy carries
the cart title, section labels, prices and the summary; Proxima Nova everything else.

## 3. Geometry per band

The cart has five responsive bands, and they are **not** a clean ladder: 1280–1512 is
a narrower override that comes *after* 1280–1949 in the stylesheet and therefore wins
inside its range. Reproduced as written, not rationalised.

| | ≥1950 | 1280–1949 | 1280–1512 | 1024–1279 | ≤1023 |
|---|---|---|---|---|---|
| cart inline padding | 64 | 56 | 30 | 32 | 24 |
| products padding | 33 / 64 | 24 / 48 | 24 / 30 | 24 / 32 | 10 / 0 |
| cart title | 37px | 32px | 32px | 32px | — |
| tile padding | 24 / 40 | 24 / 32 | 24 / 32 | 24 / 32 | 24 / 16 |
| card padding-top | 48 | 40 | 40 | 48 | radius 0, no shadow |
| summary width | 648 | 472 | 376 | 360 | fixed bottom sheet, radius 24 24 0 0 |
| summary padding | 0 32 | 0 32 | 0 30 | 0 24 | 24 |
| summary header | 70 24 24, mb 40 | 70 8 24, mb 35 | ″ | ″ | 0 0 24, mb 24 |
| summary title | 27px | 24px | 24px | 24px | 16px |
| total title / price | 24 / 27 | 17 / 24 | ″ | ″ | ″ |
| submit | h64, 18px, mb 48 | h56, 17px, mb 40 | ″ | ″ | mb 0 |
| disclaimer padding | 40 32 | 32 24 | ″ | ″ | hidden |

Chrome: header **64px** (white, `0 1px 5px 0 rgba(0,0,0,.16)`), sidebar **259px**
(`#panel-navigation-app`), burger box 72 × 64, search pill 48px tall / radius 100 /
max-width 420 / `#f0f0f0` / label `#52525b` 16px/500, bell 40 with an `#ef5350`
badge (radius 8, 11px/700), avatar 40 with a 32px image inside, Back pill h40 radius
77 15px/600 on white.

⚠️ **Below 1512 the panel switches its own chrome to a compact mode** — sidebar down
to 200px and positioned over the content, logo centred, burger shrunk
(`body.mobile_viewport_1512 …` rules, live only inside that media query). The
prototype keeps the desktop chrome at every width; the cart column, which is what was
asked for, honours all five bands. Worth knowing before anyone reviews the prototype
in a narrow window.

## 4. Copy — verbatim, do not paraphrase

```
Cart · Sort By: Newest · Remove All · Your order (n) · Recommended for you
Order Summary · n item / n items · Total · Submit Order
Renews automatically until canceled.
Oops! Your cart is empty!  /  Looks like you haven't added anything to your cart yet.
By clicking "Submit Order", you agree to our Terms.
You will be charged the price above. Exact prices including any recurring charges,
promo durations, and billing cycles are shown next to each product in your shopping
cart. Cancel anytime via your account.
```

Line-item strings, from the checkout bundle:

- domain title = the domain itself; second line = `.{tld} domain registration`
- price label = `First year at` / `First {n} years at` / `Yearly at` / `Monthly at`
- renewal = `Renews at {amount} yearly|monthly|{n} years`
- plan select = `Monthly Plan` · `Yearly Plan` · `2 Year Plan` · `3 Year Plan` · `4 Year Plan`
- the Remixer line prints **`Build:` + the credit grant** ("Build: 1,000 Credits/mo")
- catalogue: `Domain Registration` — "Find the perfect domain name for your website.";
  `Remixer` — "Describe your business, AI builds your website."; `Remixer Credits` —
  "More credits for AI editing and image generation. One-time purchase."
- multi-year sum is theirs: first year at the promo price, each further year at
  renewal (`s + h * (l - 1)`)

**The panel already sells Remixer.** `remixer` and `remixer_topup` are cart product
types with their own tiles — so a domain and the plan in one order is not something
the prototype invented.

## 5. What is traced, what is not

Traced verbatim (`icons.tsx`): all twelve navigation glyphs, the wordmark, search,
support and back icons, both product marks, the 8×5 caret, the Remove All glyph, the
14×15 trash, the 19×21 renewal mark, the add-to-cart glyph, MUI's CheckRounded, and
the 202×200 empty-cart illustration.

Ours, and labelled as such: the four Add Product glyphs in the sidebar (their art
ships in a chunk the capture did not include — drawn as coloured tiles), the SEO
Toolkit mark, and the avatar (the real one is the customer's photograph).

## 6. What happens after Submit Order — confirmed

**There is no receipt page.** [verified with the designer, 18 Aug 2026] Pressing Submit
Order charges immediately and returns the customer to Remixer; the panel shows no
confirmation or invoice screen on the way. So the prototype's behaviour is the real
one: a short "Placing your order…" on the button, then the builder again, plan active
and the domain connecting.

Two consequences worth keeping in mind:

- the seam costs *less* than assumed — the customer is not stranded in the panel
  hunting for a way back, which weakens the "buried in hPanel" objection to this flow;
- but the **return landing is ours to design and currently unconfirmed**. The
  prototype comes back to the domain status screen ("Connecting · fit-ration.com"),
  because that is what the sheet promised ("Connects automatically after checkout").
  If the real product returns somewhere else — the builder canvas, the Remixer
  dashboard in the panel — this is the line to change.

## 7. Still missing — the next capture

1. **A domain actually in the cart.** The capture holds DreamShield, whose tile has
   two selects (domain + plan). A `domreg` line's option row is inferred: one term
   select ("1 Year") plus the trash. The panel's own class map has no rule for the
   domain subtitle, so it is rendered with the description style.
2. **The mobile cart** (≤1023): the summary becomes a collapsed bottom sheet that
   expands. Its expanded design was not captured; the prototype shows a plain sheet.
3. **Error states**: outstanding balance, declined card. The panel's own copy for
   these would be worth having verbatim.
