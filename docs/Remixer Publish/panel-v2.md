# Publish panel V2 — the built spec

Figma `28071:53189`, revised three times on 19 Aug 2026 while it was being built. This
records what shipped and where every number came from, so the next person does not have to
re-derive it from the board.

> ⚠️ **Read Figma's token export in the DARK theme.** The MCP resolves `Neutral Alpha`
> inconsistently and hands back light-theme values: `rgba(9,9,11,0.04)` where the dark theme
> means `rgba(255,255,255,0.04)`. Taken literally it paints surfaces the colour of the
> background and they vanish. Every alpha below is the dark-theme reading.

---

## Shell

| | |
|---|---|
| position | `fixed right-[51px] top-12` — 51px off the right edge (5px over the rail), 48px down (4px over the topbar) |
| size | `w-[548px]`, radius 20 |
| fill / border | `var(--gray-850)` `#1f1f22` · `#ffffff0a` |
| shadow | `0px 24px 28px rgba(0,0,0,0.5)` |
| motion | `popover` + `popoverContent` — springs out of the Publish button's own corner, contents arrive a beat later |

`fixed`, not `absolute`: mounted inside `<main>`, `right` used to resolve against the centre
column, so the panel drifted as the chat width changed.

## Header — 64px

`pl-6 pr-5`, title left, visitors right.

- Title: `font-display text-[20px] font-semibold leading-[1.2] text-white`
- Visitors: `IconVisitors` 20px + count, `text-[13px] font-medium text-[#ffffffb8]`, count in
  `font-display tabular-nums`

## Body card

`px-1.5` wrapper. Card: `rounded-[16px] border border-[#ffffff0a] bg-[#ffffff0a]`, divided
into sections by `border-t border-[#ffffff0a]`.

### Section 1 — the address
`px-4 pb-4 pt-[19px]`, label→field gap `7px`.

- Label "Website URL": `text-[14px] font-medium leading-[1.4] text-[#ffffff8f]`, `px-0.5`
- Field: `h-12 rounded-[12px] border border-[var(--white-200)]`, `pl-4 pr-2 py-1`
- Address: `text-[15px]`, host `--white-900`, suffix `--white-500`
- Live dot: `h-2 w-2 rounded-full bg-[var(--live)]`, `mr-2`
- Copy button: `h-8 w-8 rounded-[8px] text-[var(--white-400)]`, hover `bg-[var(--white-100)]`
  → `IconCopy` 18px, becomes `IconCheck` 14px for 1400 ms

The clipboard write is wrapped in try/catch — sandboxed embeds (the published artifact is
one) reject it, and a rejected promise must not take the button down.

### Section 2 — standing, and the way to change it
`px-2 py-4`, inner row `px-2`, `justify-between`.

- Status line: `text-[13px] leading-[1.4] text-[#ffffff8f]`, `pl-2`, truncates
- "Manage domains": `h-8 rounded-[8px] pl-4 pr-1 gap-1.5 text-[13px] font-semibold
  text-[#ffffffb8]`, hover `bg-[var(--white-100)] text-white`, + `IconSettings` 20px

Three status strings, one per case: live · resolving · preview address.

### The domain row (conditional third section)
`mx-4 mb-4 rounded-[16px] border px-4 py-3.5`, tinted by tone —
amber `border-[#e5c35940] bg-[#e5c3590f]`, red `border-[#e5595940] bg-[#e559590f]`.
Pinging dot while in flight, title 15px semibold, sub-label 13px `--white-500`, ghost action
`h-9 rounded-[10px] border-[var(--white-200)] text-[13px]`.

## Button bar

`py-4 pl-6 pr-4`.

- Pending: dot `h-2 w-2 rounded-[4px] bg-[var(--action)]` + `gap-1.5` +
  `text-[12px] text-[#c7ccd6]`
- Nothing pending: `text-[12px] text-[var(--white-400)]` — "Everything is published"
- Button: `h-10 rounded-[10px] px-5 text-[14px] font-semibold`, `bg-[var(--action)]`, hover
  `--action-hover`; disabled `bg-[var(--white-100)] text-[var(--white-400)] cursor-not-allowed`

## Icons

`IconVisitors` and `IconSettings` are hand-drawn, as the whole set is — Figma's SVG export is
unreachable through this environment's proxy.

- Visitors: one figure in front, a second clipped behind it. Two complete people turn into a
  grey smudge at 20px; an overlap still reads as "more than one".
- Settings: a **solid** eight-toothed gear with the centre punched by a mask. An outlined
  gear collapses into a fuzzy ring at this size. The hole is a mask rather than a
  background-coloured circle so the icon survives a change of surface.

## Departures from the board, all deliberate

1. **Button colour.** The board resolves to `#0073ec` (a component-library default); the dot
   beside it and every other primary in the product are `#1587FF`. Shipped as `--action` so
   the panel does not disagree with the sheet it hands off to. Raised with the designer.
2. **The domain row is not on the board at all.** It is required by ㉘ A3 and carries seven
   states; it slots in as a section rather than floating, so it inherits the card's grammar.
3. **The dashed "Connect your own domain" card** is kept from board `28206:66756` state ⑦ for
   the no-domain case, even though the V2 board does not draw it — invitation and navigation
   are different jobs.
