/**
 * The plan — what Remixer proposes to build, before it builds it.
 *
 * THIS IS WHERE REMIXER PARTS WAYS WITH LOVABLE (designer, 07.09.2026). Lovable's brief
 * ends at "Got it — …" and the build starts on its own. Ours ends with a PLAN the customer
 * approves: the four answers are compiled into a document, shown in the dock with `Review`
 * and `Approve`, and nothing is generated until Approve is pressed. Lovable does have this
 * shape — it is what their Plan mode does when you switch the composer from Build to Plan
 * (the screenshots the designer sent) — but they do not put it on the first generation,
 * which is exactly where it is worth the most: the customer arrived with "website", was
 * asked four questions, and now gets to see whether the answers were understood BEFORE
 * spending a build on them.
 *
 * That is also the argument for the whole brief. Asking four questions and then building
 * silently asks the customer to trust that the answers landed. Showing the plan makes the
 * questions verifiable — and it makes `Review` meaningful, because there is a document to
 * read rather than a promise to accept.
 *
 * The plan is COMPILED FROM THE ANSWERS, not a fixed lump of text: change the goal and the
 * content blocks change, change `pages` and the structure line changes, skip a question and
 * the plan says which default it took. If it were static, the four questions would be
 * theatre and a careful viewer would notice within two runs.
 *
 * Rendered in two places from this one structure — `PlanCard` (in the dock, clipped with a
 * fade) and `PlanSurface` (the full document in the canvas). One source, so the card can
 * never promise something the document does not say.
 */
import type { Text } from '@/i18n'
import { BRIEF_QUESTIONS, OTHER, optionById, type BriefAnswers, type BriefKey } from './brief'

export interface PlanSection {
  heading: Text
  /** A paragraph, for sections that read as prose. */
  body?: Text
  /** Bullets, for sections that read as a list. Either or both. */
  items?: Text[]
}

export interface Plan {
  title: Text
  /** The one-paragraph "why" — the first thing both the card and the document show. */
  goal: Text
  sections: PlanSection[]
}

const q = (key: BriefKey) => BRIEF_QUESTIONS.find((x) => x.key === key)!

/** The free text behind an answer, or undefined when it was a pick (or a skip). */
const typed = (v: string | undefined) => (v && v.startsWith(OTHER) ? v.slice(OTHER.length).trim() : undefined)

/**
 * What the plan uses for one answer, and whether the customer chose it.
 *
 * A skipped question falls back to the question's FIRST option and the plan says so —
 * "Remixer's pick" — rather than quietly pretending it was chosen. That honesty is the
 * point of showing a plan at all: the customer is approving what will actually be built,
 * including the parts they left to us.
 */
function resolve(key: BriefKey, a: BriefAnswers) {
  const question = q(key)
  const own = typed(a[key])
  if (own) return { id: undefined as string | undefined, own, picked: true, option: undefined }
  const option = optionById(question, a[key])
  if (option) return { id: option.id, own: undefined, picked: true, option }
  return { id: question.options?.[0]?.id, own: undefined, picked: false, option: question.options?.[0] }
}

/* ------------------------------------------------------- what each goal builds */

const GOAL_PITCH: Record<string, Text> = {
  enquiries: {
    en: 'Turn visitors into messages. Every screen keeps a way to reach you within arm’s length, and the form is short enough that people finish it.',
    uk: 'Перетворити відвідувачів на звернення. На кожному екрані є спосіб зв’язатися, а форма достатньо коротка, щоб її дозаповнювали.',
  },
  sell: {
    en: 'Turn visitors into orders. Prices are easy to compare, and the way to buy is never more than one screen away.',
    uk: 'Перетворити відвідувачів на замовлення. Ціни легко порівняти, а спосіб купити ніколи не далі одного екрана.',
  },
  work: {
    en: 'Put the work first. The pictures carry the page and the words stay out of their way.',
    uk: 'Поставити роботи на перше місце. Сторінку несуть зображення, а текст їм не мішає.',
  },
  explain: {
    en: 'Answer the questions people actually arrive with: what this is, where you are, and when you are open.',
    uk: 'Відповісти на питання, з якими люди приходять: що це, де ви і коли працюєте.',
  },
}

const GOAL_BLOCKS: Record<string, Text[]> = {
  enquiries: [
    { en: 'A contact block — name, email, message — with one obvious Send.', uk: 'Блок звернення — ім’я, email, повідомлення — з однією очевидною кнопкою.' },
    { en: 'Your phone number and email in the header, repeated in the footer.', uk: 'Телефон і email у шапці, повторені у футері.' },
    { en: 'A thank-you state after sending, so nobody wonders whether it went through.', uk: 'Стан «дякуємо» після відправлення, щоб ніхто не гадав, чи дійшло.' },
  ],
  sell: [
    { en: 'A product grid — a picture, a name and a price on every card.', uk: 'Сітка товарів — зображення, назва і ціна на кожній картці.' },
    { en: 'A cart that keeps what is in it while people carry on browsing.', uk: 'Кошик, який тримає вміст, поки людина далі дивиться сайт.' },
    { en: 'A checkout page with the total spelled out above the pay button.', uk: 'Сторінка оплати, де сума написана над кнопкою.' },
  ],
  work: [
    { en: 'A gallery-first home page — the work at full width, captions short.', uk: 'Головна-галерея — роботи на всю ширину, підписи короткі.' },
    { en: 'A page per project, with room for a few paragraphs and more images.', uk: 'Сторінка на проєкт, з місцем на кілька абзаців і додаткові зображення.' },
    { en: 'An about section with one photo and a way to get in touch.', uk: 'Розділ «про мене» з одним фото і способом зв’язатися.' },
  ],
  explain: [
    { en: 'A hero that says what the business is in one line.', uk: 'Герой, який одним рядком каже, що це за бізнес.' },
    { en: 'A short section on what you do, in plain words.', uk: 'Короткий розділ про те, що ви робите, простими словами.' },
    { en: 'Address, opening hours and a map link at the foot of the page.', uk: 'Адреса, години роботи і посилання на карту в кінці сторінки.' },
  ],
}

const GOAL_CHECK: Record<string, Text> = {
  enquiries: { en: 'The form sends, and its thank-you state actually appears.', uk: 'Форма відправляється, і стан «дякуємо» справді з’являється.' },
  sell: { en: 'Add to cart and checkout work end to end, with the total adding up.', uk: 'Додавання в кошик і оплата працюють від початку до кінця, сума збігається.' },
  work: { en: 'Every image loads at full size without stretching or cropping the subject.', uk: 'Кожне зображення відкривається на повний розмір без розтягування й обрізання.' },
  explain: { en: 'The address and hours are readable on a phone without zooming.', uk: 'Адресу й години видно на телефоні без зуму.' },
}

const PAGES_STRUCTURE: Record<string, Text> = {
  one: {
    en: 'One page, top to bottom, with the menu jumping to sections instead of loading new pages.',
    uk: 'Одна сторінка згори донизу, меню стрибає по розділах, а не вантажить нові сторінки.',
  },
  few: {
    en: 'Four pages — Home, About, Services and Contact — sharing one header and one footer.',
    uk: 'Чотири сторінки — Головна, Про нас, Послуги, Контакти — зі спільною шапкою і футером.',
  },
  catalogue: {
    en: 'A list page plus a page per item, built from one template so new items need no new design.',
    uk: 'Сторінка-список плюс сторінка на позицію, з одного шаблону — нові позиції не вимагають нового дизайну.',
  },
}

/* ------------------------------------------------------------------- the plan */

export function buildPlan(a: BriefAnswers): Plan {
  const goal = resolve('goal', a)
  const pages = resolve('pages', a)
  const palette = resolve('palette', a)
  const type = resolve('type', a)

  const pick = (t: Text): Text => ({ en: `${t.en} (Remixer’s pick)`, uk: `${t.uk} (на розсуд Remixer)` })

  /* ---- the title: what this is, in the fewest words that are still specific ---- */
  const titleFor: Record<string, Text> = {
    enquiries: { en: 'A site that brings in enquiries', uk: 'Сайт, який приводить звернення' },
    sell: { en: 'A site that sells', uk: 'Сайт, який продає' },
    work: { en: 'A site built around the work', uk: 'Сайт навколо робіт' },
    explain: { en: 'A site that explains the business', uk: 'Сайт, який розповідає про бізнес' },
  }
  const title = goal.own
    ? { en: `A site for ${goal.own}`, uk: `Сайт для ${goal.own}` }
    : titleFor[goal.id ?? 'enquiries']

  /* ---- goal paragraph ---- */
  const goalText: Text = goal.own
    ? { en: `In your words: “${goal.own}”. The whole page is arranged around that.`, uk: `Вашими словами: «${goal.own}». Уся сторінка вибудувана навколо цього.` }
    : GOAL_PITCH[goal.id ?? 'enquiries']

  /* ---- structure ---- */
  const structure: Text = pages.own
    ? { en: `As you described it: “${pages.own}”.`, uk: `Як ви описали: «${pages.own}».` }
    : pages.picked
      ? PAGES_STRUCTURE[pages.id ?? 'one']
      : pick(PAGES_STRUCTURE[pages.id ?? 'one'])

  /* ---- look: the palette's own hexes, so the plan is checkable rather than vague ---- */
  const paletteOpt = palette.option
  const swatches = paletteOpt?.swatches?.join(', ')
  const paletteLine: Text = palette.own
    ? { en: `Colours you named: ${palette.own}.`, uk: `Кольори, які ви назвали: ${palette.own}.` }
    : {
        en: `Palette ${paletteOpt?.name.en}${swatches ? ` — ${swatches}` : ''}.${palette.picked ? '' : ' (Remixer’s pick.)'}`,
        uk: `Палітра ${paletteOpt?.name.uk}${swatches ? ` — ${swatches}` : ''}.${palette.picked ? '' : ' (На розсуд Remixer.)'}`,
      }

  const typeOpt = type.option
  const typeLine: Text = type.own
    ? { en: `Lettering you named: ${type.own}.`, uk: `Шрифти, які ви назвали: ${type.own}.` }
    : {
        en: `${typeOpt?.heading} for headlines, ${typeOpt?.body} for text — the ${typeOpt?.name.en.toLowerCase()} pairing.${type.picked ? '' : ' (Remixer’s pick.)'}`,
        uk: `${typeOpt?.heading} у заголовках, ${typeOpt?.body} у тексті — пара «${typeOpt?.name.uk}».${type.picked ? '' : ' (На розсуд Remixer.)'}`,
      }

  const goalKey = goal.id ?? 'enquiries'
  const blocks = goal.own
    ? [
        { en: 'A hero that states the purpose in one line.', uk: 'Герой, який одним рядком заявляє мету.' },
        { en: 'The sections your description calls for, in the order it implies.', uk: 'Розділи, яких вимагає ваш опис, у порядку, який він задає.' },
        { en: 'A closing block with the next step — a form, a button or a phone number.', uk: 'Завершальний блок із наступним кроком — форма, кнопка або телефон.' },
      ]
    : GOAL_BLOCKS[goalKey]

  return {
    title,
    goal: goalText,
    sections: [
      {
        heading: { en: 'What we’ll build', uk: 'Що зберемо' },
        items: [structure, ...blocks],
      },
      {
        heading: { en: 'How it will look', uk: 'Як це виглядатиме' },
        items: [paletteLine, typeLine],
      },
      {
        heading: { en: 'What we’ll check before handing it back', uk: 'Що перевіримо, перш ніж віддати' },
        items: [
          { en: 'Opens at 390, 768 and 1280 with no sideways scrolling at any width.', uk: 'Відкривається на 390, 768 і 1280 без горизонтального скролу на жодній ширині.' },
          { en: 'Every link and button reachable from the keyboard, with a focus ring you can see.', uk: 'Кожне посилання й кнопка доступні з клавіатури, з видимим фокусом.' },
          { en: 'Text over images stays readable — contrast 4.5:1 or better.', uk: 'Текст поверх зображень читається — контраст 4.5:1 або краще.' },
          GOAL_CHECK[goalKey],
        ],
      },
      {
        heading: { en: 'Not in this pass', uk: 'Не в цьому проході' },
        items: [
          {
            en: 'It publishes to your free remixer.site preview first — hidden from Google, so you can look before anyone else does. A custom domain is a separate step.',
            uk: 'Спершу публікується на безкоштовне прев’ю remixer.site — закрите від Google, щоб ви подивилися першим. Власний домен — окремий крок.',
          },
          {
            en: 'The words on the page are placeholders written to fit. Edit any of them in place, or ask me to rewrite a section.',
            uk: 'Тексти на сторінці — заготовки за розміром. Правте їх на місці або попросіть мене переписати розділ.',
          },
          ...(goalKey === 'sell'
            ? [{ en: 'No payment processor connected yet — the checkout collects orders until you connect one.', uk: 'Платіжний провайдер поки не підключений — оплата збирає замовлення, доки ви його не підключите.' }]
            : []),
        ],
      },
    ],
  }
}

/** The dock card's label, and the plan surface's bar title. */
export const PLAN_LABEL: Text = { en: 'Plan', uk: 'План' }

/** What the thread says once the plan is on screen and waiting. */
export const PLAN_WAITING: Text = {
  en: 'Plan ready — approve it and I’ll build',
  uk: 'План готовий — підтвердьте, і я зберу',
}

/** The line that lands in the thread when the plan is approved. */
export const PLAN_APPROVED: Text = {
  en: 'Approved — building it now.',
  uk: 'Підтверджено — збираю.',
}

/** Under the buttons: the honest price of pressing Approve (COST in send.ts is 10). */
export const PLAN_COST: Text = {
  en: 'Approving spends 10 credits. Everything up to here was free.',
  uk: 'Підтвердження витрачає 10 кредитів. Усе до цього було безкоштовно.',
}
