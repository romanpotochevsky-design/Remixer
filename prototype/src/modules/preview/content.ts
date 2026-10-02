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

  /* The blocks a chat edit can add to Home (modules/versions/changes.ts). Keys like every other
     text run, so the Visual Editor edits a section Remixer added exactly as it edits the rest. */
  'ai.strip.eyebrow': 'From our kitchen, this morning',
  'ai.pricing.title': 'Pick your plan',
  'ai.pricing.lead': 'Every plan is cooked fresh and weighed to the gram. Pause or switch any week.',
  'ai.plan.0.name': 'Lunch only',
  'ai.plan.0.price': '₴1 450 / week',
  'ai.plan.0.note': 'Five lunches, Monday to Friday',
  'ai.plan.1.name': 'Weekly',
  'ai.plan.1.price': '₴2 690 / week',
  'ai.plan.1.note': 'Lunch and dinner, five days, macros to your goal',
  'ai.plan.1.badge': 'Most popular',
  'ai.plan.2.name': 'Office',
  'ai.plan.2.price': 'From ₴9 900 / week',
  'ai.plan.2.note': 'One drop for the whole team at 07:30',
  'ai.plan.cta': 'Choose',
  'ai.reviews.title': 'What our customers say',
  'ai.review.0.quote': '“I stopped weighing my food in March. The numbers on the label are the numbers.”',
  'ai.review.0.name': 'Olena K. · Weekly plan, 7 months',
  'ai.review.1.quote': '“Lunch at my desk that is actually good, and it is there before I am.”',
  'ai.review.1.name': 'Dmytro S. · Lunch only, 4 months',
  'ai.review.2.quote': '“We feed a team of twelve. One order, zero complaints, every morning at 07:30.”',
  'ai.review.2.name': 'Iryna M. · Office, 1 year',
  'ai.faq.title': 'Questions, answered',
  'ai.faq.0.q': 'Can I pause a week?',
  'ai.faq.0.a': 'Yes — pause or skip any week up to Friday noon before it.',
  'ai.faq.1.q': 'What if I have an allergy?',
  'ai.faq.1.a': 'Tell us once; the chefs swap the ingredient in every dish that has it.',
  'ai.faq.2.q': 'Where do you deliver?',
  'ai.faq.2.a': 'Across Odesa, between 06:45 and 07:45, to your door or your office.',
  'ai.faq.3.q': 'How exact are the macros?',
  'ai.faq.3.a': 'Every portion is weighed; we stay within ±2 g of what the label says.',
  'ai.order.title': 'Order your first week',
  'ai.order.lead': 'Leave your number — we call back within the hour to set your macros.',
  'ai.order.cta': 'Send my order',

  /* synco.com — the black-theme store (modules/preview/landings.tsx). Black Friday is in because its
     own transcript says the banner went up (world.ts SITE_SLICES.synco). */
  'synco.bar': 'Black Friday — 30% off the whole lineup · ends Sunday',
  'synco.nav.cta': 'Shop now',
  'synco.eyebrow': 'New · Synco Orb',
  'synco.hero.title': 'Sound that fills the room. Not the shelf.',
  'synco.hero.lead': 'A 360° speaker the size of a grapefruit. Forty hours on a charge, and it finds your other Synco speakers by itself.',
  'synco.cta.primary': 'Buy Orb — $174',
  'synco.cta.secondary': 'Hear it',
  'synco.spec.0.value': '40 h',
  'synco.spec.0.label': 'battery',
  'synco.spec.1.value': '360°',
  'synco.spec.1.label': 'sound',
  'synco.spec.2.value': '1.2 kg',
  'synco.spec.2.label': 'all of it',
  'synco.line.title': 'The lineup',
  'synco.line.badge': '−30% this week',
  'synco.p.orb.name': 'Orb',
  'synco.p.orb.text': 'Room-filling 360° sound',
  'synco.p.orb.price': '$174',
  'synco.p.orb.was': '$249',
  'synco.p.pods.name': 'Pods',
  'synco.p.pods.text': 'Earbuds that hand off to Orb',
  'synco.p.pods.price': '$118',
  'synco.p.pods.was': '$169',
  'synco.p.halo.name': 'Halo',
  'synco.p.halo.text': 'A light ring that dances to it',
  'synco.p.halo.price': '$83',
  'synco.p.halo.was': '$119',
  'synco.footer': 'synco — sound in sync · free shipping over $50',

  /* meridianroast.com — the bright roastery (modules/preview/landings.tsx). The two-week
     subscription is in because its own transcript says it was added (world.ts SITE_SLICES). */
  'meridian.nav.cta': 'Subscribe',
  'meridian.eyebrow': 'Small-batch roastery · Lisbon',
  'meridian.hero.title': 'Coffee that tastes like a good morning.',
  'meridian.hero.lead': 'Roasted on Tuesday, at your door on Thursday. Three single origins a month, picked by the two of us.',
  'meridian.cta.primary': 'Pick your roast',
  'meridian.cta.secondary': 'How we roast',
  'meridian.sticker.value': '−15%',
  'meridian.sticker.label': 'every 2 weeks',
  'meridian.strip': 'Ethiopia · Colombia · Guatemala · Kenya · Brazil · Rwanda ·',
  'meridian.roasts.title': 'This month’s roasts',
  'meridian.roasts.lead': 'Whole bean or ground to your brewer. 250 g bags, sealed the day they’re roasted.',
  'meridian.r.sunrise.name': 'Sunrise',
  'meridian.r.sunrise.notes': 'Ethiopia · peach, jasmine, honey',
  'meridian.r.sunrise.price': '$18',
  'meridian.r.cobalt.name': 'Cobalt',
  'meridian.r.cobalt.notes': 'Colombia · cocoa, cherry, caramel',
  'meridian.r.cobalt.price': '$16',
  'meridian.r.jungle.name': 'Jungle',
  'meridian.r.jungle.notes': 'Guatemala · brown sugar, orange, nuts',
  'meridian.r.jungle.price': '$17',
  'meridian.r.sub': '−15% on a subscription',
  'meridian.footer': 'meridian — roasted in Lisbon · hello@meridianroast.com',
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
  'home.hero.photo': { kind: 'site', id: 'kitchen' },
  ...Object.fromEntries(MEALS.map((m) => [m.photoKey, { kind: 'site', id: m.id } as PhotoRef])),
  ...Object.fromEntries(SERVICES.map((s) => [`svc.${s.id}.photo`, { kind: 'site', id: `svc-${s.id}` } as PhotoRef])),
  /* the two landing sites' photo slots (modules/preview/landings.tsx) */
  'synco.hero.photo': { kind: 'site', id: 'synco-hero' },
  ...Object.fromEntries(['orb', 'pods', 'halo'].map((id) => [`synco.p.${id}.photo`, { kind: 'site', id: `synco-${id}` } as PhotoRef])),
  'meridian.hero.photo': { kind: 'site', id: 'meridian-hero' },
  ...Object.fromEntries(['sunrise', 'cobalt', 'jungle'].map((id) => [`meridian.r.${id}.photo`, { kind: 'site', id: `meridian-${id}` } as PhotoRef])),
  /* the photo strip a chat edit can add under the hero */
  ...Object.fromEntries(['kitchen', 'salmon-teriyaki', 'protein-pancakes', 'svc-office-delivery'].map((id, i) => [`ai.strip.${i}.photo`, { kind: 'site', id } as PhotoRef])),
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
  /* the Website media panel's «add to chat»: `media:<n>` pictures from the library */
  if (key.startsWith('media:')) { const n = Number(key.slice(6)) || 1; return n === 1 ? 'Photo from library' : `${n} photos from library` }
  if (key.endsWith('.photo')) return 'Photo'
  /* the blocks a chat edit adds (ai.*) — their own words, before the dish-shaped rules below */
  if (key.startsWith('ai.plan.') && key.endsWith('.name')) return 'Plan name'
  if (key.startsWith('ai.review.') && key.endsWith('.name')) return 'Customer name'
  if (key.endsWith('.quote')) return 'Quote'
  if (key.endsWith('.price')) return 'Price'
  if (key.endsWith('.q')) return 'Question'
  if (key.endsWith('.a')) return 'Answer'
  if (key.endsWith('.badge')) return 'Badge'
  if (key.endsWith('.title') || key === 'home.hero.title') return 'Heading'
  if (key.endsWith('.name') && (key.startsWith('synco.') || key.startsWith('meridian.'))) return 'Product name'
  if (key.endsWith('.name')) return 'Dish name'
  if (key.endsWith('.cta') || key.startsWith('home.cta') || key === 'nav.cta') return 'Button'
  if (key.endsWith('.value')) return 'Number'
  if (key.endsWith('.label') || key.endsWith('.eyebrow') || key === 'page.eyebrow') return 'Label'
  if (key.endsWith('.macros') || key === 'item.macros') return 'Macros'
  if (key.endsWith('.lead')) return 'Lead paragraph'
  return 'Text'
}
