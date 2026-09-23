# cloud-glass — the Cloud window's close button and row-action plate, 23.09.2026

Designer, three messages: «на этой кнопке закрытия окна должно быть стекло как на кнопках в чате», «и
эффект ховера и клика», «у тебя под кнопками цвет градиента не как в макете» (board 30816:49569).

| file | what |
|---|---|
| `shoot.mjs` | opens the builder → Cloud, prints the close button's computed glass (fill, blur, rim gradient) and the action plate's fade + glyph colour; stills of the ✕ at rest / hover / pressed and of a row's actions |
| `close-sheet.png` | the three ✕ states, ×4 — rim 24 → 4 → 20 %, 8 % hover wash, press bloom from the pointer |
| `row-actions.png`, `actions-zoom.png` | the plate after the fix: fade ends in the sheet's `#18181b` (invisible), glyphs white |
| `full.mjs`, `window-3s.png` | the whole window 3 s after opening (`WAIT`, `OUT` env) |
| `edge.mjs`, `edge2.mjs`, `edge3.mjs`, `edge4.mjs` | the 1px seam hunt: fractional geometry of the row cells, `elementFromPoint` at the plate's last column, hide-the-price / paint-the-plate-red probes, full-frame vs clipped capture. Verdict: the plate's own layer edge rendered one device pixel short in full-frame captures on the software rasteriser and the price's `$` bled through — the plate now overshoots the scrollport by 1px (`right: -1px`, `pr-[9px]`, 164 wide) |

Board facts (full export of `Sort by Name` 30816:52156): `from-[rgba(24,24,27,0)] to-[#18181b] to-[38.942%]`,
icon fill `Icon/Default/Default` = #ffffff. The 22.09 reading `rgba(31,31,34,0) → #1f1f22` came from a partial export.
