# cloud-menu — the Cloud window's left menu: fold, flying plate, hover + bloom, 23.09.2026

Designer, two messages: «на эти кнопки тоже нужно добавить эффект ховера и клика красивый наш, и позаботится об
анимации переключения и переходах в стиле Apple liquid glass» and, with a recording of the LIVE editor: «когда ты
уходишь в другой раздел например Email меню с Database схлопывает как на видео… сделать это более плавно и красиво».

| file | what |
|---|---|
| `f-*.jpg` (not committed), `sheet-a…f.jpg`, `ov-*.jpg` | the designer's recording cut at 30 fps (3422×1530 → 1711 wide); contact sheets of the six switches in the live editor: Database unfolds in ~5 frames, linear, pushing the rooms down; leaving to Users / Secrets folds it in ~5 frames; ripple artefact on the selected plate; the collapsed Database row is a plain menu row |
| `trace.mjs` | real-time rAF trace on the built preview: fold height, the Secrets row's y, the plate's box and radius, glass opacity / visibility / inert, card fill, `data-cloud-moving`, title words, headings, rows — for leave → Secrets, back → Database, hop → Orders, leave from Orders → Users, room → Storage |
| `film.mjs`, `film/` (not committed), `sheet-leave.jpg`, `sheet-back.jpg`, `sheet-hop.jpg` | slow motion (motion's JS clock scaled ×6 via a `performance.now` patch after load; CSS keyframes are not slowed) — 14 stills per direction of the menu column and the page title |
| `close-frames.mjs` | A/B of the pane-close film's frame profile on the 22.09 build (served from a worktree on :4174) and this one: first frame after Escape 36–39 vs 36–41 ms, 15 vs 14–16 samples in the first 300 ms — the suite's rail-tile check flaked on the sampler, not on a regression; its sample floor went 10 → 8 |
| `hover.mjs`, `sheet-pointer.jpg` | a real pointer: 8 % wash on an unselected row, none on the selected, one `.glass-ripple` on press, `press-bloom` + `aria-expanded` on the Database header when Orders is on, `data-cloud-moving` right after a click and no wash on any row while moving |

Numbers (built preview, 1600×900): fold 159 → 0 in ~230 ms, rooms 270 → 106 with a dip to 101.6 at ~300 ms, at rest
by ~500 ms; reopening 0 → 163.2 (4.2 over) → 159. Before the plate rode the fold's clock, two identical springs put the
plate 5.6 px under the Secrets row during the bounce (plate overshooting down off 43 px, the row up off 164 px); glued
to the row's live position it reads 103/103 · 102/102 · 104.2/104.2 through the dip. Worst frame 33 ms (software
rasteriser, 29 samples / 900 ms).
