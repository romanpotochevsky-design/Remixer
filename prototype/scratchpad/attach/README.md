# Attachments bar with a DOMAIN in it — the films behind the numbers (21.09.2026)

`shot.mjs` walks the Home composer through all four states and prints every box:
bare → menu → domain list → chip → tile landing ON the chip → tile removed.

What it established, and what the code now derives from it:

```
field      138 bare · 164 with a 36 chip (28726:64923) · 184 with a 56 tile
chip       36 tall at (field.left + 16, field.top + 16), pl 12 · name · gap 8 · ✕ 18 · pr 8
line       travels 52 with a chip, 72 with a tile     = barTextShift(h) = h + 16
rows       travel 26 with a chip, 46 with a tile      = barRowShift(h)  = h − 10
tile+chip  field 184, tile at +16, chip centred beside it at +10, gap 8
✕ on tile  184 → 164, NOT 184 → 138 — the travel is a difference, not a constant
```

⚠️ **Measure after the entrance has landed.** `home-rise-in` (0.8s at 1.25s) is still
lifting the composer at 900 ms: the field reads 445.25 in flight and 442.83 settled. A
2.4px error that looks exactly like a layout bug — three checks failed on it before the
cause was found.

⚠️ **The picker's blue "+" is `visibility: hidden` until the card is hovered**, so
Playwright's own click is intercepted by the card's face button and even `{force: true}`
does not land it. Use `locator.evaluate((el) => el.click())`.

⚠️ **A check block extracted into a standalone harness runs with a preamble the suite
does not have.** This one passed 24/24 standalone and then crashed the real suite on
`STORAGE_KEY is not defined` — the harness declared it, `check-brief-flow.mjs` does not.
Extract to smoke-test, but re-run the whole suite before believing it.
