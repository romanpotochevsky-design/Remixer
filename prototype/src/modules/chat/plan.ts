/**
 * The plan — what Remixer proposes to build, before it builds it.
 *
 * THIS IS WHERE REMIXER PARTS WAYS WITH LOVABLE (designer, 07.09.2026). Lovable's brief
 * ends at "Got it — …" and the build starts on its own. Ours ends with a PLAN the customer
 * approves: the four answers are compiled into a document, shown in the dock with `Review`
 * and `Start Building`, and nothing is generated until that button is pressed. Lovable does have this
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
  /** A closing paragraph, under whatever the section draws. */
  after?: Text
  /**
   * What the full-screen document draws INSTEAD of, or around, the prose (Figma
   * 30115:55247 / 30121:59891). The card in the dock ignores these and renders the
   * section's text — it is a 194px window with a fade over its last 152, which is no
   * place for a control; the document is where a decision is made.
   *
   *  · `outline`   the page stack: the page this pass builds with its sections, the
   *                pages waiting under it. Editable, and the ONE edit that reaches the
   *                build (`OutlineEdits`).
   *  · `decisions` the palette and the lettering as cards you can re-pick in place.
   */
  draws?: 'outline' | 'decisions'
}

export interface Plan {
  title: Text
  /** The one-paragraph "why" — the first thing both the card and the document show. */
  goal: Text
  sections: PlanSection[]
}

const q = (key: BriefKey) => BRIEF_QUESTIONS.find((x) => x.key === key)!

/** How many pages wait under the landing page, by answer — mirrors `REST` in build.ts. */
const REST_COUNT: Record<string, number> = { few: 3, one: 0, catalogue: 2 }

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
}

const GOAL_CHECK: Record<string, Text> = {
  enquiries: { en: 'The form sends, and its thank-you state actually appears.', uk: 'Форма відправляється, і стан «дякуємо» справді з’являється.' },
  sell: { en: 'Add to cart and checkout work end to end, with the total adding up.', uk: 'Додавання в кошик і оплата працюють від початку до кінця, сума збігається.' },
  work: { en: 'Every image loads at full size without stretching or cropping the subject.', uk: 'Кожне зображення відкривається на повний розмір без розтягування й обрізання.' },
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
  }
  const title = goal.own
    ? { en: `A site for ${goal.own}`, uk: `Сайт для ${goal.own}` }
    : titleFor[goal.id ?? 'enquiries']

  /* ---- goal paragraph ---- */
  const goalText: Text = goal.own
    ? { en: `In your words: “${goal.own}”. The whole page is arranged around that.`, uk: `Вашими словами: «${goal.own}». Уся сторінка вибудувана навколо цього.` }
    : GOAL_PITCH[goal.id ?? 'enquiries']

  /*
   * ---- structure ----
   *
   * ⚠️ THE PLAN USED TO PROMISE FOUR PAGES AND THE BUILD DELIVERS ONE (designer,
   * 11.09.2026: "мы всегда будем генерировать только одну основную страницу… вот это
   * должно как то быть учтено в плане"). The generation card has told that truth since
   * 07.09 — Home with its sections open, the rest named and closed — while the document
   * the customer APPROVES said "Four pages — Home, About, Services and Contact". So the
   * prose stops describing the site's shape (the stack draws it now, from the same
   * `buildOutline`, one beat earlier) and says what the button does instead.
   *
   * In minutes and in control, not in credits: a price line lived under this plan once and
   * the designer cut it — beside the decision it read as a warning. Here it is the method.
   */
  const single = (REST_COUNT[pages.id ?? 'few'] ?? 0) === 0
  const lede: Text = single
    ? {
        en: 'One page, top to bottom — about a minute, and that is the whole site.',
        uk: 'Одна сторінка згори донизу — близько хвилини, і це весь сайт.',
      }
    : {
        en: 'Home first, and only Home — about a minute. You see it finished before anything else gets built.',
        uk: 'Спершу головна, і тільки вона — близько хвилини. Ви побачите її готовою, перш ніж збиратиметься решта.',
      }
  /* ⚠️ The honesty rule survives the redraw: a page count nobody chose still says so. The
     board draws no such tag on the stack, and the stack is not where it belongs — this is
     the sentence that introduces the stack, so the clause goes here. */
  const ledeText: Text = pages.picked ? lede : pick(lede)

  /* What happens after — and it names the window that already exists (autopilot.ts).
     True on a first build by construction: `startBuild` puts every new site in Autopilot. */
  const after: Text = single
    ? {
        en: 'When it’s ready I’ll ask what to change next, or whether to publish.',
        uk: 'Коли буде готово, запитаю, що змінити далі — або чи публікувати.',
      }
    : {
        en: 'When Home looks right I’ll ask what’s next — keep working on this page, or start the next one. One page at a time, so a change of mind costs one page and not the whole site.',
        uk: 'Коли головна буде такою, як треба, запитаю, що далі — доробляти цю сторінку чи починати наступну. По сторінці за раз: передумали — це коштує однієї сторінки, а не всього сайту.',
      }

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
        body: ledeText,
        items: blocks,
        after,
        draws: 'outline',
      },
      {
        heading: { en: 'How it will look', uk: 'Як це виглядатиме' },
        items: [paletteLine, typeLine],
        draws: 'decisions',
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
/* The card's own title — the board's words (29816:21550), not ours: this is the plan for a
   build, and the header says so. The full-canvas review surface shows the same label in its
   bar; one name for one document. */
export const PLAN_LABEL: Text = { en: 'Build Plan', uk: 'План збірки' }

/** The action that ends this step — the board's own words (29816:21584). One verb for one
 *  action, so the card and the full-canvas review surface say the same thing. */
export const PLAN_START: Text = { en: 'Start Building', uk: 'Почати збірку' }

/** What the thread says once the plan is on screen and waiting.
 *  ⚠️ It must NOT name the button — it used to say "approve it and I’ll build", and the
 *  board (29816:21584) renamed that button to `Start Building`. A status line that names a
 *  control by a label the control no longer wears is the kind of small lie a reader trips
 *  over; it points at the verb the button actually carries instead. */
export const PLAN_WAITING: Text = {
  en: 'Plan ready — start the build when it looks right',
  uk: 'План готовий — почніть збірку, коли все влаштує',
}

/** The line that lands in the thread when the plan is approved. */
export const PLAN_APPROVED: Text = {
  en: 'Approved — building it now.',
  uk: 'Підтверджено — збираю.',
}

