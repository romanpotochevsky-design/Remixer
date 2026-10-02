/**
 * THE CATALOGUE OF WHAT A CHAT EDIT DOES TO THE SITE — the version system's other half.
 *
 * A version you can go back to (or look at) is worth nothing if every version looks the same. So
 * since 30.09.2026 a chat edit changes the demo page FOR REAL: «add testimonials» puts a section of
 * quotes under the menu, «change the colours» turns the palette, «rewrite the headline» rewrites it.
 * Each entry here is one of those changes: the card's title (past tense, a noun phrase the way the
 * board titles them — «Navigation Update», «Testimonials Section Added»), the «-ing» line the card
 * wears while Remixer works, the details a chevron unfolds, and `apply` — what it does to the AI's
 * layer (`World.siteAi`, drawn by SitePreview.tsx).
 *
 * The prompt → entry match lives in thread.ts next to the replies (one keyword table, not two):
 * `matchPrompt` returns the key this file is looked up by. A prompt that changes nothing on the page
 * (a question about publishing) gets no key, and no version: a version is a state of the SITE.
 *
 * ⚠️ WORDS A CUSTOMER READS. No file names, no «component», no «refactor» — the category's loudest
 * complaint about version cards is jargon (docs/features/versions/README.md §2). A detail line
 * names the block on the page, and a text change shows the words before and after.
 */
import type { Text } from '@/i18n'
import type { SiteAi, SiteEdits, VersionChange } from '@/state/world'
import { SITE_TEXT } from '@/modules/preview/content'

/* ------------------------------------------------------------ the palettes */

/**
 * The site's palettes. 0 is its own (the generated garden green); a «change the colours» request
 * walks 1 → 2 → 1 → 2 and never back to 0 — going back to the original is what a restore is for,
 * and a request that silently undid itself would make the history look like it lies.
 */
export interface SitePalette {
  name: string
  /** accent — buttons, the eyebrow, the logo's full stop */
  accent: string
  /** the accent on dark ground (the menu band's «Full menu →») */
  soft: string
  /** the dark band under the hero, and its cards */
  dark: string
  card: string
  /** the page's light ground */
  paper: string
}
export const PALETTES: SitePalette[] = [
  { name: 'Ivory and ink', accent: '#1b1a17', soft: '#b9b1a3', dark: '#1b1a17', card: '#26241f', paper: '#faf8f4' },
  { name: 'Terracotta', accent: '#c2562b', soft: '#f0a07a', dark: '#1c1411', card: '#271c17', paper: '#fcf8f3' },
  { name: 'Deep forest', accent: '#1f5f47', soft: '#8fd1b3', dark: '#0c1612', card: '#13211b', paper: '#f5f7f2' },
]

/* ------------------------------------------------------------ rewritten copy */

/** The two headline rewrites, walked in turn like the palettes. */
const HEADLINES = [
  {
    title: 'Macros counted. Meals cooked. At your door by 7:30.',
    lead: 'Fresh every morning and weighed to the gram — pick a plan, and stop counting for good.',
  },
  {
    title: 'Eat to your numbers without cooking a thing.',
    lead: 'A chef, a scale and a courier: your week of meals, macros exact, delivered across Odesa.',
  },
]

/** The navigation before and after «update the navigation» — the site's own anchors. */
export const NAV_BEFORE = ['Menu', 'How it works', 'Pricing', 'FAQ']
export const NAV_AFTER = ['Menu', 'Plans', 'Reviews', 'FAQ']
const NAV_CTA = 'Start my plan'

/* ----------------------------------------------------------------- entries */

export interface ChangeResult {
  ai: SiteAi
  edits: SiteEdits
  changes: VersionChange[]
  title: Text
  /** Overrides the keyword reply, for an entry whose sentence depends on what it did (palettes). */
  reply?: Text
}

interface Entry {
  /** The card's line while Remixer is making it. */
  doing: Text
  apply: (ai: SiteAi, edits: SiteEdits, prompt: string) => ChangeResult
}

const withMod = (ai: SiteAi, mod: string): SiteAi => (ai.mods.includes(mod) ? ai : { ...ai, mods: [...ai.mods, mod] })

/** Remixer rewriting a text run takes the customer's word off that key — the later hand wins. */
function rewrite(ai: SiteAi, edits: SiteEdits, text: Record<string, string>): { ai: SiteAi; edits: SiteEdits } {
  const own = { ...edits.text }
  for (const k of Object.keys(text)) delete own[k]
  return { ai: { ...ai, text: { ...ai.text, ...text } }, edits: { ...edits, text: own } }
}

/** What a text run reads right now — the customer's word, else Remixer's, else the compiled copy. */
const reads = (ai: SiteAi, edits: SiteEdits, key: string) => edits.text[key] ?? ai.text[key] ?? SITE_TEXT[key] ?? ''

/** A section added to the page — one entry per block, same shape. */
function section(mod: string, doing: Text, title: Text, what: Text): Entry {
  return {
    doing,
    apply: (ai, edits) => ({ ai: withMod(ai, mod), edits, title, changes: [{ kind: 'add', text: what }] }),
  }
}

const ENTRIES: Record<string, Entry> = {
  nav: {
    doing: { en: 'Updating the navigation', uk: 'Оновлюю навігацію' },
    apply: (ai, edits) => {
      const cta = reads(ai, edits, 'nav.cta')
      const next = rewrite(withMod(ai, 'nav'), edits, { 'nav.cta': NAV_CTA })
      return {
        ...next,
        title: { en: 'Navigation Update', uk: 'Оновлення навігації' },
        changes: [
          { kind: 'edit', text: { en: 'Navigation links', uk: 'Посилання навігації' }, before: NAV_BEFORE.join(' · '), after: NAV_AFTER.join(' · ') },
          ...(cta !== NAV_CTA ? [{ kind: 'edit' as const, text: { en: 'Header button', uk: 'Кнопка в шапці' }, before: cta, after: NAV_CTA }] : []),
        ],
      }
    },
  },
  testimonials: section(
    'testimonials',
    { en: 'Adding a testimonials section', uk: 'Додаю секцію відгуків' },
    { en: 'Testimonials Section Added', uk: 'Додано секцію відгуків' },
    { en: 'Testimonials under the menu — three customers, their plan and how long they’ve been ordering', uk: 'Відгуки під меню — три клієнти, їхній план і скільки вони замовляють' },
  ),
  pricing: section(
    'pricing',
    { en: 'Building a pricing section', uk: 'Збираю секцію цін' },
    { en: 'Pricing Section Added', uk: 'Додано секцію цін' },
    { en: 'Pricing — three plans, the weekly one in the middle as the default choice', uk: 'Ціни — три плани, тижневий у центрі як вибір за замовчуванням' },
  ),
  faq: section(
    'faq',
    { en: 'Writing the FAQ', uk: 'Пишу FAQ' },
    { en: 'FAQ Section Added', uk: 'Додано FAQ' },
    { en: 'FAQ — four questions this kind of service usually gets, answered', uk: 'FAQ — чотири типові питання до такого сервісу, з відповідями' },
  ),
  order: section(
    'order',
    { en: 'Adding an order form', uk: 'Додаю форму замовлення' },
    { en: 'Order Form Added', uk: 'Додано форму замовлення' },
    { en: 'Order form at the end of the page — name, phone, delivery window and plan', uk: 'Форма замовлення внизу сторінки — ім’я, телефон, вікно доставки та план' },
  ),
  photos: {
    doing: { en: 'Adding photos', uk: 'Додаю фото' },
    apply: (ai, edits) => ({
      ai: withMod(ai, 'photos'),
      edits,
      title: { en: 'Photo Strip Added', uk: 'Додано стрічку фото' },
      changes: [
        { kind: 'add', text: { en: 'A strip of four kitchen photos under the hero', uk: 'Стрічка з чотирьох фото кухні під хіро' } },
        { kind: 'style', text: { en: 'Menu photos crop square', uk: 'Фото меню — квадратний кроп' } },
      ],
    }),
  },
  menuBig: {
    doing: { en: 'Making the menu cards bigger', uk: 'Збільшую картки меню' },
    apply: (ai, edits) => ({
      ai: withMod(ai, 'menuBig'),
      edits,
      title: { en: 'Bigger Menu Cards', uk: 'Більші картки меню' },
      changes: [
        { kind: 'style', text: { en: 'Menu cards', uk: 'Картки меню' }, before: '3 per row', after: '2 per row' },
        { kind: 'style', text: { en: 'Dish photos', uk: 'Фото страв' }, before: '112 px', after: '176 px' },
      ],
    }),
  },
  palette: {
    doing: { en: 'Changing the colors', uk: 'Змінюю кольори' },
    apply: (ai, edits) => {
      const from = PALETTES[ai.palette] ?? PALETTES[0]
      const next = ai.palette === 1 ? 2 : 1
      const to = PALETTES[next]
      return {
        ai: { ...ai, palette: next },
        edits,
        title: next === 1 ? { en: 'Warmer Palette', uk: 'Тепліша палітра' } : { en: 'Deep Forest Palette', uk: 'Палітра «глибокий ліс»' },
        reply: next === 2
          ? { en: 'Here is the darker variant — a deep forest green on a cooler paper, and the menu band goes almost black. The warm one is one version back if you prefer it.', uk: 'Ось темніший варіант — глибокий лісовий зелений на холоднішому тлі, смуга меню майже чорна. Теплий — на версію назад, якщо він кращий.' }
          : undefined,
        changes: [
          { kind: 'style', text: { en: 'Accent', uk: 'Акцент' }, before: from.name, after: to.name, swatch: [from.accent, to.accent] },
          { kind: 'style', text: { en: 'Menu band', uk: 'Смуга меню' }, swatch: [from.dark, to.dark] },
          { kind: 'style', text: { en: 'Page background', uk: 'Тло сторінки' }, swatch: [from.paper, to.paper] },
        ],
      }
    },
  },
  headline: {
    doing: { en: 'Rewriting the headline', uk: 'Переписую заголовок' },
    apply: (ai, edits) => {
      const was = reads(ai, edits, 'home.hero.title')
      const wasLead = reads(ai, edits, 'home.hero.lead')
      const pick = HEADLINES[ai.text['home.hero.title'] === HEADLINES[0].title ? 1 : 0]
      const next = rewrite(ai, edits, { 'home.hero.title': pick.title, 'home.hero.lead': pick.lead })
      return {
        ...next,
        title: { en: 'Headline Rewritten', uk: 'Заголовок переписано' },
        changes: [
          { kind: 'edit', text: { en: 'Heading', uk: 'Заголовок' }, before: was, after: pick.title },
          { kind: 'edit', text: { en: 'Lead paragraph', uk: 'Вступ' }, before: wasLead, after: pick.lead },
        ],
      }
    },
  },
  mobile: {
    doing: { en: 'Tightening the mobile layout', uk: 'Підтягую мобільний лейаут' },
    apply: (ai, edits) => ({
      ai: withMod(ai, 'mobile'),
      edits,
      title: { en: 'Mobile Layout Tightened', uk: 'Мобільний лейаут підтягнуто' },
      changes: [
        { kind: 'style', text: { en: 'On phones: the menu collapses into one button', uk: 'На телефоні: меню згортається в одну кнопку' } },
        { kind: 'style', text: { en: 'On phones: dish cards go single column, buttons full width', uk: 'На телефоні: картки в одну колонку, кнопки на всю ширину' } },
      ],
    }),
  },
  generic: {
    doing: { en: 'Making the change', uk: 'Вношу зміну' },
    apply: (ai, edits, prompt) => ({
      ai,
      edits,
      title: { en: 'Page Updated', uk: 'Сторінку оновлено' },
      changes: [{ kind: 'edit', text: { en: `As asked: “${clip(prompt)}”`, uk: `Як просили: «${clip(prompt)}»` } }],
    }),
  },
}

const clip = (s: string) => (s.length > 90 ? `${s.slice(0, 88).trimEnd()}…` : s)

/**
 * An Autopilot proposal that builds the next page of the plan. Its key is `page:<Name>`; the page
 * already has its route in the switcher (the outline names it), so what the version records is the
 * build of it — no new block on Home.
 */
function pageEntry(name: string): Entry {
  return {
    doing: { en: `Building the ${name} page`, uk: `Збираю сторінку «${name}»` },
    apply: (ai, edits) => ({
      ai: withMod(ai, `page:${name}`),
      edits,
      title: { en: `${name} Page Added`, uk: `Додано сторінку «${name}»` },
      changes: [{ kind: 'add', text: { en: `The ${name} page, built to the plan’s sections`, uk: `Сторінка «${name}» за секціями плану` } }],
    }),
  }
}

function entryOf(key: string): Entry {
  if (key.startsWith('page:')) return pageEntry(key.slice(5))
  return ENTRIES[key] ?? ENTRIES.generic
}

/** The card's «-ing» line for a change about to be made. */
export const doingOf = (key: string): Text => entryOf(key).doing

/** Make the change: the site's two layers after it, the card's title and its details. */
export function applyChange(key: string, ai: SiteAi, edits: SiteEdits, prompt: string): ChangeResult {
  return entryOf(key).apply(ai, edits, prompt)
}

/* ------------------------------------------------------------ what a restore changes back */

const MOD_NAME: Record<string, Text> = {
  nav: { en: 'The updated navigation', uk: 'Оновлена навігація' },
  testimonials: { en: 'The testimonials section', uk: 'Секція відгуків' },
  pricing: { en: 'The pricing section', uk: 'Секція цін' },
  faq: { en: 'The FAQ', uk: 'FAQ' },
  order: { en: 'The order form', uk: 'Форма замовлення' },
  photos: { en: 'The photo strip', uk: 'Стрічка фото' },
  menuBig: { en: 'The bigger menu cards', uk: 'Більші картки меню' },
  mobile: { en: 'The tightened mobile layout', uk: 'Підтягнутий мобільний лейаут' },
}
const modName = (m: string): Text => MOD_NAME[m] ?? (m.startsWith('page:') ? { en: `The ${m.slice(5)} page`, uk: `Сторінка «${m.slice(5)}»` } : { en: m, uk: m })

/**
 * What going back to a version does to the site as it stands — the restore card's details. Blocks
 * that come back, blocks that go, the palette, and each text run whose words change, in the same
 * words a change's own card uses. The customer's own words and pictures are compared as one layer.
 */
export function restoreChanges(from: { ai: SiteAi; edits: SiteEdits }, to: { ai: SiteAi; edits: SiteEdits }): VersionChange[] {
  const out: VersionChange[] = []
  /* a built page stays in the outline and the switcher whatever the version — not a thing a restore moves */
  const blocks = (xs: string[]) => xs.filter((m) => !m.startsWith('page:'))
  for (const m of blocks(to.ai.mods)) if (!from.ai.mods.includes(m)) { const n = modName(m); out.push({ kind: 'add', text: { en: `${n.en} — restored`, uk: `${n.uk} — повернено` } }) }
  for (const m of blocks(from.ai.mods)) if (!to.ai.mods.includes(m)) { const n = modName(m); out.push({ kind: 'edit', text: { en: `${n.en} — removed`, uk: `${n.uk} — прибрано` } }) }
  if (from.ai.palette !== to.ai.palette) {
    const a = PALETTES[from.ai.palette] ?? PALETTES[0], b = PALETTES[to.ai.palette] ?? PALETTES[0]
    out.push({ kind: 'style', text: { en: 'Palette', uk: 'Палітра' }, before: a.name, after: b.name, swatch: [a.accent, b.accent] })
  }
  const keys = new Set([...Object.keys(from.ai.text), ...Object.keys(to.ai.text), ...Object.keys(from.edits.text), ...Object.keys(to.edits.text)])
  for (const k of keys) {
    const was = from.edits.text[k] ?? from.ai.text[k] ?? SITE_TEXT[k] ?? ''
    const now = to.edits.text[k] ?? to.ai.text[k] ?? SITE_TEXT[k] ?? ''
    if (was !== now && (was || now)) out.push({ kind: 'edit', text: { en: 'Text', uk: 'Текст' }, before: was, after: now })
  }
  const photos = new Set([...Object.keys(from.edits.photo), ...Object.keys(to.edits.photo)])
  let swapped = 0
  for (const k of photos) if (JSON.stringify(from.edits.photo[k]) !== JSON.stringify(to.edits.photo[k])) swapped++
  if (swapped) out.push({ kind: 'photo', text: swapped === 1 ? { en: 'One photo goes back', uk: 'Одне фото повертається' } : { en: `${swapped} photos go back`, uk: `${swapped} фото повертаються` } })
  if (!out.length) out.push({ kind: 'edit', text: { en: 'Your site already looks like this', uk: 'Сайт уже виглядає саме так' } })
  return out
}
