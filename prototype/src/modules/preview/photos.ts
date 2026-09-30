/**
 * THE DEMO SITE'S PHOTOGRAPHS — one raster image per dish, service tile and the About-page
 * kitchen scene, shipped INSIDE the bundle as data: URLs.
 *
 * WHY THESE EXIST. The site in the preview (SitePreview.tsx) has never had a photograph:
 * every "photo" is a div painted with the dish's gradient tint and an emoji. The Visual
 * Editor's photo replacement needs real raster images — something a customer can click,
 * see selected and swap — and a gradient div is not that. The designer will supply real
 * food photography; until then these are PLACEHOLDERS, generated procedurally by
 * `scratchpad/visual-editor-photos/make.py` (deterministic, fixed seed): moody out-of-focus
 * bokeh in each dish's colour family, the ghost of a plate, a little grain. They read as
 * photographs, not as tiles, which is what the editor needs to demonstrate; they are not
 * the content, and no design decision should be made on them.
 *
 * WHY DATA URLS, AND WHY AS LITERALS. The prototype ships as a single-file artifact, and the
 * published page's CSP blocks every external request — no CDN, no `/assets/…` path, not even
 * a same-origin file. So the pixels have to travel in the JS the way the fonts travel in the
 * CSS. The obvious route, `import x from './x.webp?inline'`, does NOT work on Vite 5.4: there
 * `?inline` is a CSS-only query (asset `?inline` arrived in Vite 6), and the build quietly
 * emitted the ten files as `/assets/*.webp` — measured, not assumed. Raising
 * `assetsInlineLimit` would mean editing vite.config.ts for one feature. Instead make.py
 * writes `./photos/data.ts`, a generated module holding each file as a base64 string
 * literal: no loader, no config, and it re-encodes the designer's real files the moment
 * they replace the placeholders (`make.py --encode-only`).
 *
 * THE BUDGET IS DELIBERATE. Ten WebPs at 560×360, q70, ~11 KB each — 108 KB of pixels,
 * ~145 KB as base64 — against the artifact host's page ceiling tracked in
 * scripts/build-artifact.mjs. A real photo set must stay in the same envelope: hand the
 * designer these dimensions and the ≤ 20 KB-per-image target.
 *
 * Keys are the meal `id`s from `data/cloud.ts` (verbatim, so the Cloud table and the site
 * agree on which photo is which) plus `kitchen` and the three `svc-*` service tiles —
 * the same ids `content.ts` resolves a photo slot to.
 */
import { PHOTO_DATA, type PhotoId } from './photos/data'

export interface SitePhoto {
  id: string
  /** A `data:image/webp;base64,…` URL — usable as `<img src>` or `url()` with no request. */
  src: string
  w: number
  h: number
  /** English, in the site's own voice — it is the site's alt text, not the prototype's. */
  alt: string
}

const W = 560
const H = 360

/** English alt texts, in the voice of the meal-delivery site itself. */
const ALT: Record<PhotoId, string> = {
  'power-bowl': 'Power Bowl — quinoa, roasted chickpeas and grilled chicken with lemon-tahini dressing',
  'lean-beef-rice': 'Lean Beef & Rice — slow-cooked beef over jasmine rice with steamed greens',
  'salmon-teriyaki': 'Salmon Teriyaki — glazed Norwegian salmon on soba noodles with sesame and pickled ginger',
  'chicken-pesto-pasta': 'Chicken Pesto Pasta — wholegrain fusilli, basil pesto and shredded chicken with pine nuts',
  'greek-wrap': 'Greek Wrap — feta, olives, cucumber and herbed yoghurt in a wholemeal wrap',
  'protein-pancakes': 'Protein Pancakes — oat and whey pancakes with berry compote',
  kitchen: 'Our kitchen in Odesa at dawn — the ovens on, the day’s meals being weighed to the gram',
  'svc-weekly-plan': 'Weekly plan — five days of lunches and dinners, packed and labelled for the week',
  'svc-custom-macros': 'Custom macros — a plate portioned to your numbers, protein first',
  'svc-office-delivery': 'Office delivery — the team’s meals in one drop, at the door by 07:30',
}

/** Every photo id, in menu order: the six meals, the kitchen, then the three service tiles. */
export const photoIds: string[] = Object.keys(PHOTO_DATA)

export const SITE_PHOTOS: Record<string, SitePhoto> = Object.fromEntries(
  (Object.keys(PHOTO_DATA) as PhotoId[]).map((id) => [id, { id, src: PHOTO_DATA[id], w: W, h: H, alt: ALT[id] }]),
)
