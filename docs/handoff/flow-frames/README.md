# Flow frames — real renders of the prototype

Every frame in the Figma page **"🧭 Domain flows · 2 цепочки целиком"** is a screenshot of
the running prototype, captured at 2× from the actual build. They are here rather than
embedded because this session's egress proxy blocks Figma's asset uploader and the plugin
API's `createImageAsync` is disabled, so the only route into the file would be base64
inside a script — which costs a lot and would force JPEG compression. Dragging the PNG
onto its named slot in Figma takes seconds and keeps full quality.

Each Figma slot is named for its file (`⛶ a1-search`), so the mapping is mechanical.

Regenerate them all with `scripts/capture-flow-frames.mjs` against a running
`npm run preview` — the script drives the real UI rather than setting states by hand, so a
frame that cannot be reached is a frame that does not get captured.

## Chain 1 — buying a new domain
| file | step |
|---|---|
| `a1-search` | the domain dashboard, one field for every intent |
| `a2-results` | results: exact match first, AI names second |
| `a3-sheet` | the confirm sheet with the first year, the honest renewal and the spelling guard |
| `a4-cart` | the hosting panel's cart — outside Remixer |
| `a5-registering` | back from the till, the registry is creating the domain (≤15 min) |
| `a6-propagating` | spreading across the internet: hours, not seconds (24–72 h) |
| `a7-verifying` | the address has changed over, the padlock is switching on |
| `a8-live` | done |
| `a9-icann` | branch: confirm your email or the domain is suspended |
| `a10-failed` | branch: we can't reach it, with a way out |

## Chain 2 — a domain held at GoDaddy
| file | step |
|---|---|
| `b1-search` | the same field, a full address typed |
| `b2-taken` | taken, registrar named, "This is my domain" |
| `b3-sheet` | the confirm sheet: stays there, email untouched |
| `b4-setup` | the two lines to paste |
| `b5-checking` | we keep checking; progress counted per line |
| `b7-verifying` | both lines in, the address has changed over |
| `b8-live` | done |
| `b9-failed` | branch: the records are not visible yet |
