# pane-unfold — the canvas hand-over (site ⇄ Cloud / Domains / Plan), 22.09.2026

The law: `docs/knowledge/design-system.md` §7 «Окно разворачивается из своей кнопки»; the spec for
developers: `docs/handoff/pane-unfold-spec.md`. What the live editor does, frame by frame:
`../live-editor/sheet-a1.jpg … sheet-b1.jpg` and `docs/research/live-ai-editor.md`.

| file | what |
|---|---|
| `geometry.mjs` | canvas content box, site box, rail button box, chip box — the numbers `paneFrom` works from |
| `trace.mjs` | rAF-sampled film of both directions: pane clip (parsed inset), opacity, scale; site opacity, scale; glint; rows; `data-pane-fresh`; frame intervals. `BASE=` dev (5174) or preview (4173) |
| `slowmo.mjs` | stills at ×0.1 — clocks patched in `addInitScript` (motion's spring is main-thread here), CSS cascade slowed by `playbackRate`; `sheet-open.jpg` / `sheet-close.jpg` are its contact sheets |
| `chip.mjs` | the Domains window opened from the topbar chip: where its clip starts (above the canvas) |
| `phases.mjs` | hand-driven stills (styles written by hand) — superseded by `slowmo.mjs`, kept for the method |
| `domains-from-chip.png`, `open-rest-v1.png` | rest states after each opening |

Run: `CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node trace.mjs <tag>` with the dev
server on 5174 (or `BASE=http://localhost:4173` against the built preview).
