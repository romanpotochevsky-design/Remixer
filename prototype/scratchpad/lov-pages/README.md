# Lovable — page switcher, screen recording (25.09.2026)

The designer's 30-second recording of Lovable's canvas toolbar, cut at 10 fps with
`imageio-ffmpeg` (the system ffmpeg has no `.mov` demuxer). Only the five contact sheets are
kept here; the ~300 raw frames and the full-resolution crops (21 MB) lived in the session
scratchpad and were not committed.

- `sheet-coarse.jpg` — the whole recording, every third frame.
- `sheet-A-open1.jpg` — first open: pill → menu below, search field prefilled with the current
  route and selected whole, check on the current page, first row highlighted.
- `sheet-B-select.jpg` — a row is picked: menu closes, the pill's label changes at once, the
  preview follows a beat later.
- `sheet-C-history.jpg` — the pill follows the site: a link inside the preview changes the route
  and the pill reads the new page.
- `sheet-D-search.jpg` — typing filters the list; a query with no match shows one `Go to /…` row.

What the sheets prove is written up in `docs/handoff/page-switcher-spec.md` and
`docs/knowledge/design-system.md` §7 «Переключатель страниц в тулбаре канваса».
