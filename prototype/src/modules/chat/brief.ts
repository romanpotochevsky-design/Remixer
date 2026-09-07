/**
 * The pre-build brief — what Remixer does with a prompt that is too thin to build from.
 *
 * Modelled 1:1 on Lovable's flow, captured on a screen recording by the designer on
 * 06.09.2026 (docs/audits/lovable-prebuild-flow/): "Build me a website." does not start a
 * build. The agent answers with one sentence asking for direction, then docks a QUESTION
 * PANEL above the composer — four questions, one at a time, with ‹ › paging, "Skip all" and
 * "Next"/"Submit". Two questions are free text (what kind of site, which sections), two are
 * choices (colour palette, typography pair), both with a "Write your own…" escape hatch.
 * Submitting compiles the answers into a summary card in the thread, the agent says
 * "Got it — …" and only then the build begins.
 *
 * Nothing here talks to a model. The heuristic below is a stand-in for the real "is this
 * prompt buildable" judgement; the copy is what the product would say.
 */
import type { Text } from '@/i18n'

export type BriefKey = 'type' | 'sections' | 'palette' | 'typography'

export interface BriefOption {
  id: string
  /** Short name — what the summary card prints. */
  name: Text
  /** One-line description under the name (typography cards). */
  detail?: Text
  /** Four colours, left to right (palette cards). */
  swatches?: string[]
  /** Font pairing (typography cards). */
  heading?: string
  body?: string
}

export interface BriefQuestion {
  key: BriefKey
  kind: 'text' | 'palette' | 'typography'
  question: Text
  /** Placeholder of the free-text field. */
  placeholder: Text
  options?: BriefOption[]
  /** Label of the row in the summary card. */
  label: Text
}

/** Free-text answers are stored with this prefix, so the summary can tell them from a pick. */
export const OTHER = 'other:'

export const BRIEF_QUESTIONS: BriefQuestion[] = [
  {
    key: 'type',
    kind: 'text',
    label: { en: 'Website type', uk: 'Тип сайту' },
    question: {
      en: 'What kind of website do you want to build? (e.g. personal portfolio, business landing page, blog, online store, restaurant, etc.)',
      uk: 'Який сайт ви хочете зібрати? (напр. особисте портфоліо, лендінг бізнесу, блог, інтернет-магазин, ресторан тощо)',
    },
    placeholder: { en: 'Your answer…', uk: 'Ваша відповідь…' },
  },
  {
    key: 'sections',
    kind: 'text',
    label: { en: 'Content sections', uk: 'Розділи' },
    question: {
      en: 'What sections or content should the website include? (e.g. hero, about, services, gallery, testimonials, contact, pricing)',
      uk: 'Які розділи чи контент має містити сайт? (напр. хіро, про нас, послуги, галерея, відгуки, контакти, ціни)',
    },
    placeholder: { en: 'Your answer…', uk: 'Ваша відповідь…' },
  },
  {
    key: 'palette',
    kind: 'palette',
    label: { en: 'Color palette', uk: 'Палітра' },
    question: { en: 'Which color palette fits your brand or vibe?', uk: 'Яка палітра пасує вашому бренду чи настрою?' },
    placeholder: { en: 'Write your own…', uk: 'Напишіть свою…' },
    options: [
      { id: 'midnight-indigo', name: { en: 'Midnight Indigo', uk: 'Midnight Indigo' }, swatches: ['#0a0a1b', '#151538', '#22226b', '#4a46e6'] },
      { id: 'warm-sand', name: { en: 'Warm Sand', uk: 'Warm Sand' }, swatches: ['#f8f6f1', '#efe8dc', '#c8b898', '#8a6a44'] },
      { id: 'paper-ink', name: { en: 'Paper & Ink', uk: 'Paper & Ink' }, swatches: ['#f6f5f2', '#dcdad4', '#3a3a3a', '#111111'] },
      { id: 'terracotta-garden', name: { en: 'Terracotta Garden', uk: 'Terracotta Garden' }, swatches: ['#c4553d', '#e8a071', '#8bb37a', '#4a6a3a'] },
    ],
  },
  {
    key: 'typography',
    kind: 'typography',
    label: { en: 'Typography', uk: 'Типографіка' },
    question: { en: 'Which typography style matches the tone you want?', uk: 'Яка типографіка відповідає потрібному тону?' },
    placeholder: { en: 'Write your own…', uk: 'Напишіть свою…' },
    options: [
      { id: 'modern-tech', name: { en: 'Modern Tech', uk: 'Modern Tech' }, heading: 'Space Grotesk', body: 'DM Sans',
        detail: { en: 'Space Grotesk headings + DM Sans body. Clean, geometric, startup feel.', uk: 'Заголовки Space Grotesk + текст DM Sans. Чисто, геометрично, як у стартапу.' } },
      { id: 'editorial', name: { en: 'Editorial', uk: 'Editorial' }, heading: 'Instrument Serif', body: 'Work Sans',
        detail: { en: 'Instrument Serif headings + Work Sans body. Magazine-quality, refined.', uk: 'Заголовки Instrument Serif + текст Work Sans. Журнальна якість, витончено.' } },
      { id: 'brand-storytelling', name: { en: 'Brand Storytelling', uk: 'Brand Storytelling' }, heading: 'DM Serif Display', body: 'Fira Sans',
        detail: { en: 'DM Serif Display headings + Fira Sans body. Bold, narrative-driven.', uk: 'Заголовки DM Serif Display + текст Fira Sans. Сміливо, з наративом.' } },
      { id: 'lifestyle', name: { en: 'Lifestyle', uk: 'Lifestyle' }, heading: 'Outfit', body: 'Figtree',
        detail: { en: 'Outfit headings + Figtree body. Friendly, contemporary, lifestyle brands.', uk: 'Заголовки Outfit + текст Figtree. Дружньо, сучасно, для lifestyle-брендів.' } },
    ],
  },
]

export type BriefAnswers = Partial<Record<BriefKey, string>>

/* ------------------------------------------------------------ the judgement */

/**
 * Is this prompt too thin to build from?
 *
 * Stand-in for the model's judgement. Lovable's rule (docs, 2026): it builds directly only
 * when the prompt "already commits to a concrete visual direction"; anything else with a UI
 * gets the pre-build step. Here: strip the verbs and the words that name the product itself
 * ("build me a website") and see what is left. Fewer than three words of substance — the
 * business, the audience, the content — and there is nothing to design from.
 */
const FILLER = new Set([
  // verbs and politeness
  'build', 'make', 'create', 'design', 'generate', 'develop', 'do', 'get', 'give', 'help', 'please', 'pls', 'hi', 'hello', 'hey',
  // pronouns, articles, glue
  'me', 'a', 'an', 'the', 'i', 'id', 'im', 'want', 'need', 'would', 'like', 'to', 'for', 'my', 'our', 'some', 'new', 'it', 'that',
  'this', 'and', 'with', 'of', 'in', 'on', 'can', 'you', 'us', 'we', 'something', 'thing',
  // adjectives that carry no brief
  'simple', 'nice', 'good', 'cool', 'beautiful', 'great', 'modern', 'clean', 'pretty', 'awesome', 'basic', 'quick',
  // the product itself
  'website', 'web', 'site', 'page', 'homepage', 'landing', 'app', 'application', 'online', 'presence', 'business', 'company',
  // uk / ru equivalents the designer may type in a demo
  'зроби', 'створи', 'збери', 'сайт', 'вебсайт', 'мені', 'для', 'мого', 'моєї', 'бізнесу', 'будь', 'ласка', 'сделай', 'создай',
  'мне', 'моего', 'моей', 'бизнеса', 'пожалуйста', 'веб', 'страницу', 'сторінку',
])

/**
 * The designer's rule (07.09.2026): anything shorter than ten characters is thin, full stop.
 * The word test below catches the longer-but-empty prompts ("Build me a website.").
 * The composer's own example, "Bella's Bakery", carries two words of substance and builds.
 */
export const WEAK_PROMPT_MAX_CHARS = 10

export function isWeakPrompt(raw: string): boolean {
  const text = raw.trim()
  if (text.length < WEAK_PROMPT_MAX_CHARS) return true
  const tokens = text
    .toLowerCase()
    .replace(/[’']/g, '')
    .split(/[^\p{L}\p{N}-]+/u)
    .filter(Boolean)
  const substance = tokens.filter((w) => w.length > 1 && !FILLER.has(w))
  return substance.length < 2
}

/* ------------------------------------------------------------------ copy */

/** The one sentence that opens the brief — Lovable's wording, measured off the recording. */
export const BRIEF_INTRO: Text = {
  en: 'I’d love to build you a website, but I need a little direction first. What kind of site are you imagining, and what should it include?',
  uk: 'Із радістю зберу вам сайт, але спершу потрібен напрямок. Який сайт ви уявляєте і що на ньому має бути?',
}

/** Status line while the questions are open (a tool-call row in Lovable's thread). */
export const BRIEF_STATUS: Text = { en: 'Exploring page structure and sections', uk: 'Досліджую структуру та розділи' }

export function optionById(q: BriefQuestion, id: string | undefined): BriefOption | undefined {
  return id && q.options ? q.options.find((o) => o.id === id) : undefined
}

/** What the summary card prints for one answer. */
export function answerText(q: BriefQuestion, value: string | undefined, lang: 'en' | 'uk'): { text: string; muted: boolean } {
  if (!value) return { text: lang === 'uk' ? 'на розсуд Remixer' : 'Remixer’s pick', muted: true }
  if (value.startsWith(OTHER)) return { text: `Other: ${value.slice(OTHER.length)}`, muted: false }
  const opt = optionById(q, value)
  return { text: opt ? opt.name[lang] : value, muted: false }
}

/** "Got it — a design portfolio landing page with a deep indigo palette and editorial type." */
export function briefAck(a: BriefAnswers): Text {
  const plain = (v: string | undefined) => (v && v.startsWith(OTHER) ? v.slice(OTHER.length).trim() : undefined)
  const type = plain(a.type)
  const palette = optionById(BRIEF_QUESTIONS[2], a.palette)
  const typo = optionById(BRIEF_QUESTIONS[3], a.typography)
  const what = type ? type : 'website'
  const bits: string[] = []
  if (palette) bits.push(`a ${palette.name.en.toLowerCase()} palette`)
  else if (plain(a.palette)) bits.push(`the palette you described`)
  if (typo) bits.push(`${typo.name.en.toLowerCase()} type`)
  else if (plain(a.typography)) bits.push('the type you described')
  const withBits = bits.length ? ` with ${bits.join(' and ')}` : ''
  const ukBits: string[] = []
  if (palette) ukBits.push(`палітрою ${palette.name.uk}`)
  else if (plain(a.palette)) ukBits.push('описаною вами палітрою')
  if (typo) ukBits.push(`шрифтами ${typo.name.uk}`)
  else if (plain(a.typography)) ukBits.push('описаною вами типографікою')
  const ukWith = ukBits.length ? ` з ${ukBits.join(' і ')}` : ''
  return {
    en: `Got it — a ${what}${withBits}. Let me build that for you.`,
    uk: `Зрозумів — ${type ? type : 'сайт'}${ukWith}. Збираю.`,
  }
}

/** The answer that lands when the first build finishes. */
export function briefDone(a: BriefAnswers): Text {
  const plain = (v: string | undefined) => (v && v.startsWith(OTHER) ? v.slice(OTHER.length).trim() : undefined)
  const type = plain(a.type) ?? 'site'
  const sections = plain(a.sections) ?? 'hero, about, services and contact'
  return {
    en: `Done — the first version of your ${type} is up: ${sections}. Tell me what to change, or hit Publish when it feels right.`,
    uk: `Готово — перша версія вашого сайту (${type}) на місці: ${sections}. Скажіть, що змінити, або тисніть Publish, коли все влаштує.`,
  }
}
