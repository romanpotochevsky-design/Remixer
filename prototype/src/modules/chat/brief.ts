/**
 * The pre-build brief — what Remixer does with a prompt that is too thin to build from.
 *
 * The FLOW is Lovable's, captured on a screen recording by the designer on 06.09.2026
 * (docs/audits/lovable-prebuild-flow/): "Build me a website." does not start a build. The
 * agent answers with one sentence asking for direction, then docks a QUESTION PANEL above
 * the composer — one question at a time, ‹ › paging, "Skip all", "Next"/"Submit" — and
 * submitting compiles the answers into a summary card, an acknowledgement, and only then
 * the build. The panel's DESIGN is Remixer's own (Figma 29464:34335 and 25732:139123).
 *
 * THE QUESTIONS AND THE COPY ARE OURS (07.09.2026, at the designer's instruction: the text
 * drawn on the board is placeholder, "придумай сам кейс для флоу и тексты и варианты"). It
 * matters that they are not Lovable's, because two of Lovable's four are a beginner trap:
 * "What kind of website do you want to build?" and "What sections should it include?" are
 * free-text fields that hand back the very problem the customer just failed to solve. On the
 * recording the designer answered them "design portfolio" and "landing" — two words, no more
 * of a brief than the prompt was. Someone who typed "website" cannot name a business
 * category, a section list or a typeface.
 *
 * So each question here asks something a beginner CAN answer, and every option spends the
 * slot the board draws under the title on its CONSEQUENCE — what changes on the page if you
 * pick this. In order:
 *
 *   1. `goal`    — what the site is for. The one answer that changes the most.
 *   2. `pages`   — how much there is to say, instead of asking for a list of sections.
 *   3. `palette` — the drawn 2×2 swatch grid; the only question with no words to read.
 *   4. `type`    — lettering, by the feel of it, with the pair named in the consequence.
 *
 * ⚠️ `goal` and `pages` deliberately do NOT ask "what kind of business is this". That is not
 * squeamishness: the prototype renders ONE hard-coded demo site, so any answer naming a
 * business would be contradicted by the site that appears (Lovable's own demo says "design
 * portfolio" and then builds a meal-prep page). Asking about purpose and shape keeps the
 * summary true whatever the canvas shows — and it is the better question anyway.
 *
 * Nothing here talks to a model. `isWeakPrompt` is a stand-in for the real judgement.
 */
import type { Text } from '@/i18n'

export type BriefKey = 'goal' | 'pages' | 'palette' | 'type'

export interface BriefOption {
  id: string
  /** Short name — the row's title, and what the summary card prints. */
  name: Text
  /**
   * The consequence line under the title: what changes on the page if this is picked.
   * The board gives every row this slot (29464:34362) and it is the whole point of the
   * radio list — a title alone would make these four questions a quiz.
   */
  detail?: Text
  /** Four colours, left to right — the drawn palette plate (25732:139125). */
  swatches?: string[]
  /** Font pairing, named in the consequence line rather than shown as a specimen: the real
   *  faces are not embedded in the prototype, so a specimen would be a fake one. */
  heading?: string
  body?: string
  /** The fragment this answer contributes to the "Got it — …" sentence. */
  ack?: Text
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
    key: 'goal',
    kind: 'typography', // a radio list; `kind` only separates the palette grid from the rest
    label: { en: 'Goal', uk: 'Мета' },
    question: {
      en: 'What should this site do for you?',
      uk: 'Що цей сайт має для вас робити?',
    },
    placeholder: { en: 'Something else — tell me…', uk: 'Щось інше — напишіть…' },
    options: [
      {
        id: 'enquiries',
        name: { en: 'Bring in enquiries', uk: 'Приводити звернення' },
        detail: {
          en: 'A contact form and your phone number within reach on every screen.',
          uk: 'Форма звернення і телефон у межах досяжності на кожному екрані.',
        },
        ack: { en: 'built to bring in enquiries', uk: 'щоб приводив звернення' },
      },
      {
        id: 'sell',
        name: { en: 'Sell something', uk: 'Продавати' },
        detail: {
          en: 'A shop with a cart, and prices people can compare side by side.',
          uk: 'Магазин із кошиком і ціни, які можна порівняти поруч.',
        },
        ack: { en: 'built to sell', uk: 'щоб продавав' },
      },
      {
        id: 'work',
        name: { en: 'Show the work', uk: 'Показувати роботи' },
        detail: {
          en: 'The work first and big, the words short — a gallery, not an essay.',
          uk: 'Роботи спершу і великими, тексту мало — галерея, не есе.',
        },
        ack: { en: 'built around the work', uk: 'навколо робіт' },
      },
      {
        id: 'explain',
        name: { en: 'Explain the business', uk: 'Розповідати про бізнес' },
        detail: {
          en: 'One clear page that ends with your address and opening hours.',
          uk: 'Одна зрозуміла сторінка, що завершується адресою і годинами роботи.',
        },
        ack: { en: 'built to explain the business', uk: 'щоб розповідав про бізнес' },
      },
    ],
  },
  {
    key: 'pages',
    kind: 'typography',
    label: { en: 'Pages', uk: 'Сторінки' },
    question: {
      en: 'How much is there to say?',
      uk: 'Скільки треба розповісти?',
    },
    placeholder: { en: 'Describe it in your own words…', uk: 'Опишіть своїми словами…' },
    options: [
      {
        id: 'one',
        name: { en: 'One page, top to bottom', uk: 'Одна сторінка, згори донизу' },
        detail: {
          en: 'A single scroll. The fastest to read, and the fastest to publish.',
          uk: 'Один скрол. Найшвидше читати і найшвидше опублікувати.',
        },
        ack: { en: 'on a single page', uk: 'на одній сторінці' },
      },
      {
        id: 'few',
        name: { en: 'A few pages', uk: 'Кілька сторінок' },
        detail: {
          en: 'Home, About, Services and Contact, with a menu across the top.',
          uk: 'Головна, Про нас, Послуги і Контакти, з меню згори.',
        },
        ack: { en: 'across a few pages', uk: 'на кількох сторінках' },
      },
      {
        id: 'catalogue',
        name: { en: 'A page for every product or service', uk: 'Сторінка на кожен товар чи послугу' },
        detail: {
          en: 'A list you can add to later without redrawing the site.',
          uk: 'Список, до якого можна додавати, не перемальовуючи сайт.',
        },
        ack: { en: 'with a page for every item', uk: 'зі сторінкою на кожну позицію' },
      },
    ],
  },
  {
    key: 'palette',
    kind: 'palette',
    label: { en: 'Colours', uk: 'Кольори' },
    question: {
      en: 'Which colours feel right?',
      uk: 'Які кольори відчуваються правильними?',
    },
    placeholder: { en: 'Name a colour, or paste a brand hex…', uk: 'Назвіть колір або вставте hex бренду…' },
    options: [
      {
        id: 'ink-amber',
        name: { en: 'Ink & Amber', uk: 'Ink & Amber' },
        /* The three darks are steps, not shades of the same near-black: the plate sits ON
           a `#09090b8f` card, and a first cut of #111112/#1d1d21/#3b3a38 sank three of the
           four cells into it — the plate read as one amber bar on nothing. */
        swatches: ['#191a1e', '#2f3237', '#585c63', '#e0a94a'],
      },
      {
        id: 'sea-glass',
        name: { en: 'Sea Glass', uk: 'Sea Glass' },
        swatches: ['#f4f7f6', '#cfe3de', '#7fb3a8', '#2f6b60'],
      },
      {
        id: 'warm-clay',
        name: { en: 'Warm Clay', uk: 'Warm Clay' },
        swatches: ['#f3e9df', '#d8b48c', '#c4553d', '#6d3a2c'],
      },
      {
        id: 'paper-white',
        name: { en: 'Paper White', uk: 'Paper White' },
        swatches: ['#faf9f7', '#e6e3dd', '#8d8a84', '#17161a'],
      },
    ],
  },
  {
    key: 'type',
    kind: 'typography',
    label: { en: 'Lettering', uk: 'Шрифти' },
    question: {
      en: 'Which lettering suits the tone?',
      uk: 'Які шрифти пасують до тону?',
    },
    placeholder: { en: 'Name a typeface you like…', uk: 'Назвіть шрифт, який вам подобається…' },
    options: [
      {
        id: 'plain-modern',
        name: { en: 'Plain and modern', uk: 'Просто і сучасно' },
        heading: 'Space Grotesk',
        body: 'DM Sans',
        detail: {
          en: 'One geometric sans for everything. Reads as a product, not a brochure.',
          uk: 'Один геометричний sans на все. Читається як продукт, а не як брошура.',
        },
        ack: { en: 'plain, modern lettering', uk: 'простими сучасними шрифтами' },
      },
      {
        id: 'editorial',
        name: { en: 'Editorial', uk: 'Редакційно' },
        heading: 'Instrument Serif',
        body: 'Work Sans',
        detail: {
          en: 'A serif for headlines over a clean sans. Reads like a magazine.',
          uk: 'Serif у заголовках над чистим sans. Читається як журнал.',
        },
        ack: { en: 'editorial lettering', uk: 'редакційними шрифтами' },
      },
      {
        id: 'friendly',
        name: { en: 'Friendly', uk: 'Дружньо' },
        heading: 'Outfit',
        body: 'Figtree',
        detail: {
          en: 'Rounded and warm, easy to read small. Suits a local business.',
          uk: 'Округло і тепло, легко читати дрібним. Пасує локальному бізнесу.',
        },
        ack: { en: 'friendly lettering', uk: 'дружніми шрифтами' },
      },
      {
        id: 'statement',
        name: { en: 'Bold statement', uk: 'Гучна заява' },
        heading: 'DM Serif Display',
        body: 'Fira Sans',
        detail: {
          en: 'Big display headlines, quiet text. One idea per screen.',
          uk: 'Великі display-заголовки, тихий текст. Одна думка на екран.',
        },
        ack: { en: 'bold display lettering', uk: 'гучними display-шрифтами' },
      },
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
 * ("build me a website") and see what is left. Fewer than two words of substance — the
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

/**
 * The one sentence that opens the brief.
 *
 * Ours, not Lovable's ("I'd love to build you a website, but I need a little direction
 * first…"). Theirs is polite and says nothing about why it stopped; this one gives the
 * customer the reason in the only currency they care about — a guess would spend a build
 * they paid for, and the questions are free. That is a true statement about this product
 * (asking costs no credits, building costs ten) and it is the honest answer to "why are
 * you asking me instead of just doing it".
 */
export const BRIEF_INTRO: Text = {
  en: 'I can build this — but right now I would be guessing, and a guess costs you a build. Four quick questions and I will know what to make.',
  uk: 'Можу це зібрати — але зараз я лише вгадував би, а вгадування коштує вам однієї збірки. Чотири швидкі питання, і я знатиму, що робити.',
}

/** The summary card's first title, while the answers are being turned into a brief. */
export const BRIEF_STATUS: Text = {
  en: 'Turning your answers into a brief',
  uk: 'Перетворюю відповіді на бриф',
}

export function optionById(q: BriefQuestion, id: string | undefined): BriefOption | undefined {
  return id && q.options ? q.options.find((o) => o.id === id) : undefined
}

/** The question carrying one key, so the copy below never depends on array positions. */
const byKey = (key: BriefKey) => BRIEF_QUESTIONS.find((q) => q.key === key)!

/** What the summary card prints for one answer. */
export function answerText(q: BriefQuestion, value: string | undefined, lang: 'en' | 'uk'): { text: string; muted: boolean } {
  if (!value) return { text: lang === 'uk' ? 'на розсуд Remixer' : 'Remixer’s pick', muted: true }
  if (value.startsWith(OTHER)) return { text: `Other: ${value.slice(OTHER.length)}`, muted: false }
  const opt = optionById(q, value)
  return { text: opt ? opt.name[lang] : value, muted: false }
}

/**
 * "Got it — a site built to sell, across a few pages, in Warm Clay with editorial
 * lettering. Let me build that for you."
 *
 * Built from the options' own `ack` fragments rather than from their titles, because a
 * title that reads well in a list ("Show the work") does not read well in a sentence.
 * Every clause is droppable: a skipped question contributes nothing and the sentence still
 * scans, which is what makes "Skip all" a real option rather than a trap.
 */
export function briefAck(a: BriefAnswers): Text {
  const plain = (v: string | undefined) => (v && v.startsWith(OTHER) ? v.slice(OTHER.length).trim() : undefined)
  const frag = (key: BriefKey, described: Text): Text | undefined => {
    const q = byKey(key)
    const opt = optionById(q, a[key])
    if (opt?.ack) return opt.ack
    if (plain(a[key])) return described
    return undefined
  }

  const en: string[] = []
  const uk: string[] = []
  const push = (f: Text | undefined) => { if (f) { en.push(f.en); uk.push(f.uk) } }

  push(frag('goal', { en: 'built for what you described', uk: 'під те, що ви описали' }))
  push(frag('pages', { en: 'laid out the way you described', uk: 'у структурі, яку ви описали' }))

  const palette = optionById(byKey('palette'), a.palette)
  if (palette) { en.push(`in ${palette.name.en}`); uk.push(`у ${palette.name.uk}`) }
  else if (plain(a.palette)) { en.push(`in the colours you named`); uk.push('у названих вами кольорах') }

  /* The lettering is joined with "with", not another comma: it is the one clause that
     describes the site's surface rather than its purpose, and a fourth comma turned the
     sentence into a list ("…, in Warm Clay, friendly lettering."). It also has to read
     alone, when every other question was skipped: "a site with friendly lettering." */
  const type = frag('type', { en: 'the lettering you named', uk: 'шрифтами, які ви назвали' })

  const join = (parts: string[], tail: string | undefined, withWord: string) => {
    const body = parts.join(', ')
    if (!tail) return body ? ` ${body}` : ''
    return body ? ` ${body} ${withWord} ${tail}` : ` ${withWord} ${tail}`
  }

  return {
    en: `Got it — a site${join(en, type?.en, 'with')}. Let me build that for you.`,
    uk: `Зрозумів — сайт${join(uk, type?.uk, 'з')}. Збираю.`,
  }
}

/**
 * The line that lands when the first build finishes.
 *
 * Deliberately says nothing about what is ON the page. The prototype renders one
 * hard-coded demo site, so a sentence listing sections would be describing a page nobody
 * generated — the previous version echoed the free-text answers back ("your site is up:
 * landing") and read as a machine repeating itself. What is left is the only thing that is
 * always true, plus the two things the customer can do next.
 */
export function briefDone(a: BriefAnswers): Text {
  const goal = optionById(byKey('goal'), a.goal)
  const en = goal ? `, ${goal.ack!.en}` : ''
  const uk = goal ? `, ${goal.ack!.uk}` : ''
  return {
    en: `Done — the first version is up${en}. Tell me what to change, or hit Publish when it feels right.`,
    uk: `Готово — перша версія на місці${uk}. Скажіть, що змінити, або тисніть Publish, коли все влаштує.`,
  }
}
