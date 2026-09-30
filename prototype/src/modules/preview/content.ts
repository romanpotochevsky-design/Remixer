/**
 * THE SITE'S COPY, ADDRESSED — every text run and every photo of the demo site under a STABLE
 * KEY, so the Visual Editor (modules/editor) can lay the customer's own words over it.
 *
 * Until 30.09.2026 the copy sat as JSX literals in SitePreview.tsx and the dish cards were keyed
 * by name. That was fine for a picture; it is not for a page somebody edits: a layer of edits
 * (`World.siteEdits`, the plan's `planEdits` rule) needs an address that survives a rename — edit
 * the Power Bowl's name and the card keyed by its name would remount under the caret.
 *
 * THE KEYS ARE ENTITIES WHERE THE SITE HAS ENTITIES. A dish appears on Home, on the Menu page, on
 * the Item page and in the Cloud table; `meal.<id>.name` is one key for all four, so one edit
 * lands everywhere (the UX critique's point: novices edit the dish, not the spot on the page).
 * Page titles are `page.<id>.title`, separate from the page NAME the plan owns — editing the big
 * heading on About must not rename the page or move its route (pages.ts derives both from the
 * name). Mixed nodes are split per text run (`home.stat.0.value` / `.label`): one contentEditable
 * host holds one plain string, so a `<b>` and a `<br/>` cannot be typed away.
 *
 * WHAT IS DELIBERATELY NOT A KEY: the logo (a brand mark), the nav anchors (spans of a one-pager),
 * the footer's page links (they navigate), the 404 page, the contact form's placeholders
 * (decorative, aria-hidden). Those are not targets in the editor.
 *
 * The site is the CUSTOMER'S copy, so it is English whatever the shell's locale: an override
 * replaces the string in every locale (the footer tagline used to be bilingual builder copy —
 * it is the site's now).
 */
import { CLOUD_MEALS, type CloudRow } from '@/data/cloud'
import type { PhotoRef, SiteEdits } from '@/state/world'

/* ------------------------------------------------------------------ text */

export const SITE_TEXT: Record<string, string> = {
  'nav.cta': 'Order now',

  'home.eyebrow': 'Meal prep · Odesa delivery',
  'home.hero.title': 'Chef-made meals with exact macros',
  'home.hero.lead': 'Weekly menus cooked fresh every morning. Calories, protein, fat and carbs counted to the gram — so you don’t have to.',
  'home.cta.primary': 'Build my plan',
  'home.cta.secondary': 'See the menu',
  'home.stat.0.value': '4 000+',
  'home.stat.0.label': 'meals delivered',
  'home.stat.1.value': '±2 g',
  'home.stat.1.label': 'macro accuracy',
  'home.stat.2.value': '07:30',
  'home.stat.2.label': 'at your door',
  'home.menu.title': 'This week’s menu',
  'home.menu.more': 'Full menu →',

  'footer.tagline': 'Ready when you are.',
  'footer.line': 'fit. — chef-made meals, Odesa · hello@fit-ration.com',

  'page.eyebrow': 'fit. · Odesa',

  'about.lead': 'A small kitchen in Odesa that cooks every morning for people who count their macros.',
  'about.p1': 'We started in 2023 with one oven, two chefs and a spreadsheet of macros. Today the kitchen cooks around 400 meals a day and still weighs every portion to the gram.',
  'about.p2': 'Menus change weekly. Nothing is frozen, nothing sits overnight — what leaves the kitchen at 06:30 is on your doorstep by 07:30.',
  'about.stat.0.value': '2',
  'about.stat.0.label': 'chefs',
  'about.stat.1.value': '400',
  'about.stat.1.label': 'meals a day',
  'about.stat.2.value': '1',
  'about.stat.2.label': 'oven, still',

  'contact.lead': 'Questions about a plan, an allergy or a delivery window — write, call or come by.',
  'contact.kitchen.label': 'Kitchen',
  'contact.kitchen.value': 'Kanatna 42, Odesa · Mon–Sat 06:00–14:00',
  'contact.write.label': 'Write',
  'contact.write.value': 'hello@fit-ration.com',
  'contact.call.label': 'Call',
  'contact.call.value': '+380 48 700 12 34',
  'contact.form.cta': 'Send',

  'item.desc': 'Quinoa, roast chicken, avocado, pickled cabbage and a tahini dressing. Cooked this morning, delivered cold, ready in two minutes.',
  'item.macros': '520 kcal · 42 g protein · 18 g fat · 44 g carbs',
  'item.cta': 'Add to my plan',

  'services.lead': 'Everything fit. cooks and delivers, in one place.',
  'svc.weekly-plan.title': 'Weekly plan',
  'svc.weekly-plan.text': 'Five days of lunches and dinners, macros set to your goal.',
  'svc.custom-macros.title': 'Custom macros',
  'svc.custom-macros.text': 'Tell us the numbers; the chefs build the menu around them.',
  'svc.office-delivery.title': 'Office delivery',
  'svc.office-delivery.text': 'One drop for the whole team, 07:30 at the door.',
}

/** The three service tiles, in the order the Services page draws them. */
export const SERVICES = [
  { id: 'weekly-plan', tint: 'linear-gradient(135deg,#dff1e4,#b7dfc4)', emoji: '📅' },
  { id: 'custom-macros', tint: 'linear-gradient(135deg,#f6e8d9,#eacdaa)', emoji: '⚖️' },
  { id: 'office-delivery', tint: 'linear-gradient(135deg,#e7ecf6,#c3d2ec)', emoji: '🏢' },
] as const

/* ----------------------------------------------------------------- meals */

/** A dish as the site prints it — the Cloud table's row plus its keys in the edits layer. */
export interface Meal {
  id: string
  name: string
  kcal: number
  protein: number
  tint: string
  emoji: string
  nameKey: string
  macrosKey: string
  photoKey: string
}

const mealOf = (r: CloudRow): Meal => ({
  id: r.id,
  name: r.name,
  kcal: r.kcal ?? 0,
  protein: r.protein ?? 0,
  tint: r.tint,
  emoji: r.emoji,
  nameKey: `meal.${r.id}.name`,
  macrosKey: `meal.${r.id}.macros`,
  photoKey: `meal.${r.id}.photo`,
})

/** The six dishes, from the Cloud table — one source for the menu and the database window. */
export const MEALS: Meal[] = CLOUD_MEALS.map(mealOf)

/** The compiled macros line under a dish. A key of its own so it can be edited as one string. */
export const mealMacros = (m: Meal) => `${m.kcal} kcal · ${m.protein} g protein`

/* ---------------------------------------------------------------- photos */

/**
 * Which picture each photo slot shows before the customer touches it. Every default is a `site`
 * photo (modules/preview/photos.ts ships them inside the artifact); an `upload` only ever comes
 * from the editor.
 */
export const SITE_PHOTO_DEFAULTS: Record<string, PhotoRef> = {
  'about.photo': { kind: 'site', id: 'kitchen' },
  ...Object.fromEntries(MEALS.map((m) => [m.photoKey, { kind: 'site', id: m.id } as PhotoRef])),
  ...Object.fromEntries(SERVICES.map((s) => [`svc.${s.id}.photo`, { kind: 'site', id: `svc-${s.id}` } as PhotoRef])),
}

/* -------------------------------------------------------------- resolving */

/** What a text run says: the customer's word if they changed it, else the compiled copy. */
export function textOf(edits: SiteEdits, key: string, compiled?: string): string {
  const own = edits.text[key]
  if (own !== undefined) return own
  return compiled ?? SITE_TEXT[key] ?? ''
}

/** Which picture a photo slot shows. */
export function photoOf(edits: SiteEdits, key: string): PhotoRef {
  return edits.photo[key] ?? SITE_PHOTO_DEFAULTS[key] ?? { kind: 'site', id: 'kitchen' }
}

export const fitOf = (edits: SiteEdits, key: string): 'fill' | 'fit' => edits.fit[key] ?? 'fill'
export const opacityOf = (edits: SiteEdits, key: string): number => edits.opacity[key] ?? 100
/** A height the customer set on a photo box, or undefined: the layout's own. */
export const heightOf = (edits: SiteEdits, key: string): number | undefined => edits.height[key]

/** The compiled value of a text key — the string an edit is measured against. */
export function compiledText(key: string): string | undefined {
  if (SITE_TEXT[key] !== undefined) return SITE_TEXT[key]
  const meal = MEALS.find((m) => m.nameKey === key || m.macrosKey === key)
  if (meal) return key === meal.nameKey ? meal.name : mealMacros(meal)
  return undefined
}

const samePhoto = (a: PhotoRef | undefined, b: PhotoRef | undefined) =>
  !!a && !!b && a.kind === b.kind && a.id === b.id

/**
 * The draft laid over the saved layer, with everything that equals the compiled site dropped:
 * a key holds a value only when it DIFFERS (World.siteEdits), so "changed it back by hand" is
 * the same as "never touched it" and an untouched site stays `{}`.
 */
export function mergeEdits(saved: SiteEdits, draft: SiteEdits): SiteEdits {
  const text: Record<string, string> = {}
  for (const [k, v] of Object.entries({ ...saved.text, ...draft.text })) {
    if (v !== compiledText(k)) text[k] = v
  }
  const photo: Record<string, PhotoRef> = {}
  for (const [k, v] of Object.entries({ ...saved.photo, ...draft.photo })) {
    if (!samePhoto(v, SITE_PHOTO_DEFAULTS[k])) photo[k] = v
  }
  const fit: Record<string, 'fill' | 'fit'> = {}
  for (const [k, v] of Object.entries({ ...saved.fit, ...draft.fit })) if (v !== 'fill') fit[k] = v
  const opacity: Record<string, number> = {}
  for (const [k, v] of Object.entries({ ...saved.opacity, ...draft.opacity })) if (v !== 100) opacity[k] = v
  const height: Record<string, number> = {}
  for (const [k, v] of Object.entries({ ...saved.height, ...draft.height })) if (v > 0) height[k] = v
  return { text, photo, fit, opacity, height }
}

export function sameEdits(a: SiteEdits, b: SiteEdits): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** How many texts and photos differ between two layers — the bar's "N changes" and Save's count. */
export function countEdits(e: SiteEdits): number {
  return Object.keys(e.text).length + Object.keys(e.photo).length + Object.keys(e.fit).length + Object.keys(e.opacity).length + Object.keys(e.height).length
}

/* ---------------------------------------------------------------- labels */

/**
 * A human name for an element — what the Select tool puts on the composer's chip and what the
 * editor's rings announce. Lovable's chips say `span` / `div` / `h1`; a customer does not know
 * what a span is (audits/lovable-visual-edits-teardown.md §5).
 */
export function labelOf(key: string): string {
  if (key.endsWith('.photo')) return 'Photo'
  if (key.endsWith('.title') || key === 'home.hero.title') return 'Heading'
  if (key.endsWith('.name')) return 'Dish name'
  if (key.endsWith('.cta') || key.startsWith('home.cta') || key === 'nav.cta') return 'Button'
  if (key.endsWith('.value')) return 'Number'
  if (key.endsWith('.label') || key.endsWith('.eyebrow') || key === 'page.eyebrow') return 'Label'
  if (key.endsWith('.macros') || key === 'item.macros') return 'Macros'
  if (key.endsWith('.lead')) return 'Lead paragraph'
  return 'Text'
}
