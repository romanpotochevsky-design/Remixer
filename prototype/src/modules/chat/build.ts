/**
 * The first generation — what gets built, in what order, and how long each piece takes.
 *
 * Figma 29480:48478. The board answers a question the old build never asked: WHAT is
 * happening for the minute the customer is waiting. Our previous first build was 5.6
 * seconds of edge glow, which is fine for a fake and useless as a design: the real thing
 * takes five to ten minutes, and a spinner that long is indistinguishable from a hang.
 *
 * Three product facts shape the whole card, and all three come from the designer
 * (07.09.2026):
 *
 *  1. ONLY THE FIRST PAGE IS GENERATED in this pass. The other pages are planned, named
 *     and visibly waiting — that is why the card shows the whole site's outline and not
 *     just a progress bar. Anything else would let the customer believe a four-page site
 *     landed when one page did.
 *  2. THE PREVIEW APPEARS WHEN THAT PAGE IS DONE, not when the build starts. So the
 *     canvas is empty for the whole minute and this card is the only thing to look at.
 *     It has to carry the wait on its own.
 *  3. ONE MINUTE, HARDCODED. The section durations below add up to it.
 *
 * The outline is COMPILED FROM THE BRIEF ANSWERS, for the same reason the plan is
 * (plan.ts): the plan promised particular blocks, and a progress card naming different
 * ones would expose the plan as decoration. `goal` picks the landing page's sections,
 * `pages` picks how many pages stand under it. An unanswered brief falls back to the
 * first option of each question, exactly as the plan does.
 *
 * ⚠️ THE SECTION NAMES DESCRIBE WORK, NOT A BUSINESS. The prototype renders one
 * hardcoded demo site, so a card that said "Menu · Reservations" would be contradicted
 * by the canvas seconds later — the same trap the brief questions avoid by not asking
 * what the business is. "Hero", "Gallery", "Footer" survive whatever the canvas shows.
 */
import type { Text } from '@/i18n'
import { BRIEF_QUESTIONS, OTHER, optionById, type BriefAnswers, type BriefKey } from './brief'

export interface BuildSection {
  id: string
  name: Text
  /**
   * The lines that appear under the section while it is being written, one after the
   * other. This is the text the board shims with a moving gradient — it is the only
   * place in the card that says what the machine is actually doing right now.
   */
  work: Text[]
  /** How long this section holds the active slot, ms. */
  ms: number
}

export interface BuildPage {
  id: string
  name: Text
  /** Only the first page has them: it is the only page this pass builds. */
  sections?: BuildSection[]
}

/* --------------------------------------------------------------- the clock */

/**
 * One minute, split unevenly on purpose.
 *
 * Equal slices read as a progress bar wearing a costume. A hero that takes longer than
 * a footer is the shape of real work, and it is also the shape Lovable's recording has:
 * scaffolding is quick, the big visual block is the long pole, the tail is quick again.
 */
const ASSEMBLE_MS = 4000

/* ------------------------------------------------- the landing page's sections */

/** Every landing page starts with the frame around it and ends with the footer. */
const NAV: BuildSection = {
  id: 'nav',
  name: { en: 'Layout & navigation', uk: 'Каркас і навігація' },
  ms: 8000,
  work: [
    { en: 'Setting up the project and the page grid', uk: 'Створюю проєкт і сітку сторінки' },
    { en: 'Writing the header, the links and the mobile menu', uk: 'Збираю шапку, посилання та мобільне меню' },
  ],
}

const HERO: BuildSection = {
  id: 'hero',
  name: { en: 'Hero', uk: 'Герой' },
  ms: 14000,
  work: [
    { en: 'Choosing the type scale and setting the headline', uk: 'Обираю типографічну шкалу і набираю заголовок' },
    { en: 'Placing the image and balancing it against the text', uk: 'Ставлю зображення і балансую його з текстом' },
    { en: 'Checking the headline holds at 390, 768 and 1280', uk: 'Перевіряю заголовок на 390, 768 і 1280' },
  ],
}

const FOOTER: BuildSection = {
  id: 'footer',
  name: { en: 'Footer', uk: 'Футер' },
  ms: 9000,
  work: [
    { en: 'Laying out the footer links and the small print', uk: 'Розкладаю посилання футера і дрібний текст' },
    { en: 'Wiring every link to a real anchor', uk: 'Прив’язую кожне посилання до справжнього якоря' },
  ],
}

/** The two middle sections — the ones the goal actually decides. */
const MIDDLE: Record<string, BuildSection[]> = {
  enquiries: [
    {
      id: 'offer',
      name: { en: 'What you offer', uk: 'Що ви пропонуєте' },
      ms: 13000,
      work: [
        { en: 'Writing three cards from your description', uk: 'Пишу три картки за вашим описом' },
        { en: 'Sizing them so the row does not break at 768', uk: 'Підганяю розміри, щоб ряд не ламався на 768' },
      ],
    },
    {
      id: 'enquiry-form',
      name: { en: 'Enquiry form', uk: 'Форма звернення' },
      ms: 12000,
      work: [
        { en: 'Building the name, email and message fields', uk: 'Роблю поля «ім’я», «email» і «повідомлення»' },
        { en: 'Adding validation and the thank-you state', uk: 'Додаю перевірку і стан «дякуємо»' },
        { en: 'Making every field reachable from the keyboard', uk: 'Роблю кожне поле доступним з клавіатури' },
      ],
    },
  ],
  sell: [
    {
      id: 'products',
      name: { en: 'Product grid', uk: 'Сітка товарів' },
      ms: 13000,
      work: [
        { en: 'Building the card — picture, name, price', uk: 'Збираю картку — зображення, назва, ціна' },
        { en: 'Filling the grid with placeholder items', uk: 'Наповнюю сітку заготовками позицій' },
        { en: 'Reflowing four across to two, then one', uk: 'Перебудовую чотири в ряд на два, тоді на один' },
      ],
    },
    {
      id: 'cart',
      name: { en: 'Cart & checkout', uk: 'Кошик і оплата' },
      ms: 12000,
      work: [
        { en: 'Wiring add-to-cart and the running total', uk: 'Підключаю додавання в кошик і підрахунок суми' },
        { en: 'Writing the checkout page with the total above the button', uk: 'Роблю сторінку оплати, сума над кнопкою' },
      ],
    },
  ],
  work: [
    {
      id: 'gallery',
      name: { en: 'Gallery', uk: 'Галерея' },
      ms: 13000,
      work: [
        { en: 'Laying out the images at full width', uk: 'Розкладаю зображення на всю ширину' },
        { en: 'Writing short captions that stay out of the way', uk: 'Пишу короткі підписи, які не мішають' },
        { en: 'Checking nothing stretches or crops the subject', uk: 'Перевіряю, що нічого не тягнеться і не ріже головне' },
      ],
    },
    {
      id: 'about',
      name: { en: 'About', uk: 'Про вас' },
      ms: 12000,
      work: [
        { en: 'Setting one photo against a short paragraph', uk: 'Ставлю одне фото проти короткого абзацу' },
        { en: 'Adding the way to get in touch', uk: 'Додаю спосіб зв’язатися' },
      ],
    },
  ],
}

/* ----------------------------------------------------- the pages under it */

/**
 * The rest of the site: named, in order, and NOT built this pass.
 *
 * These come straight off `pages`, and they are the reason the card is an outline. The
 * board draws Home with its sections open and About and Contacts closed underneath —
 * the shape of "one page now, these next".
 */
const REST: Record<string, Text[]> = {
  one: [],
  few: [
    { en: 'About', uk: 'Про нас' },
    { en: 'Services', uk: 'Послуги' },
    { en: 'Contact', uk: 'Контакти' },
  ],
  catalogue: [
    { en: 'Catalogue', uk: 'Каталог' },
    { en: 'Item page', uk: 'Сторінка позиції' },
  ],
}

/** Which option a brief answer lands on — first option when skipped, as the plan does. */
function chose(key: BriefKey, a: BriefAnswers): string {
  const question = BRIEF_QUESTIONS.find((x) => x.key === key)!
  const raw = a[key]
  // Free text names no option, so it takes the same fallback a skip does: there is no
  // way to turn "something arty" into a section list, and inventing one would put a
  // promise on screen that nothing behind it can keep.
  if (raw && !raw.startsWith(OTHER)) {
    const option = optionById(question, raw)
    if (option) return option.id
  }
  return question.options?.[0]?.id ?? ''
}

/** The whole outline: the page being built, then the pages waiting. */
export function buildOutline(a: BriefAnswers): BuildPage[] {
  const goal = chose('goal', a)
  const pages = chose('pages', a)
  const [first, second] = MIDDLE[goal] ?? MIDDLE.enquiries
  return [
    {
      id: 'home',
      name: { en: 'Home', uk: 'Головна' },
      sections: [NAV, HERO, first, second, FOOTER],
    },
    ...(REST[pages] ?? []).map((name, i) => ({ id: `page-${i}`, name })),
  ]
}

/** The sections of the page this pass builds. */
export const buildSections = (a: BriefAnswers) => buildOutline(a)[0].sections ?? []

/* ---------------------------------------------------------------- the beats */

/**
 * One tick of the generation.
 *
 * The whole minute is expanded up front rather than chained timer-by-timer, so the
 * schedule is a value you can read, test and resume from an index instead of a set of
 * closures that only exist while the page is alive. `at === sections.length` is the last
 * beat: every section is done and the page is being put together.
 */
export interface Beat {
  at: number
  line: number
  /** How long this beat holds before the next one, ms. */
  hold: number
}

export function buildBeats(a: BriefAnswers): Beat[] {
  const sections = buildSections(a)
  const beats: Beat[] = []
  sections.forEach((section, at) => {
    const lines = Math.max(1, section.work.length)
    // The section's own time, split across its work lines. Integer ms so the total is
    // exactly the sum of the sections and not a drifting fraction of it.
    const hold = Math.round(section.ms / lines)
    for (let line = 0; line < lines; line++) beats.push({ at, line, hold })
  })
  beats.push({ at: sections.length, line: 0, hold: ASSEMBLE_MS })
  return beats
}

/** What the whole generation costs in wall-clock ms — one minute, by construction. */
export const buildDuration = (a: BriefAnswers) =>
  buildBeats(a).reduce((sum, b) => sum + b.hold, 0)

/* ---------------------------------------------------------------- the copy */

/**
 * The line Remixer says as it starts, on the path that skips the brief.
 *
 * ⚠️ It names the WORK, not the business. The board's version is "I'll build a
 * fully-featured diner website with a menu, reservations…" — fine in a mock, wrong here:
 * the prototype has one hardcoded demo site, so a promise about diners is disproved by
 * the canvas within the minute. It also does the one job the customer needs done at this
 * moment, which the board's line does not: it says the preview is coming LATER, so an
 * empty canvas reads as "not yet" instead of "broken".
 */
export const BUILD_INTRO: Text = {
  en: 'Starting on your home page — layout first, then the hero, the content blocks and the footer. It appears here the moment that page is finished; the other pages come after.',
  uk: 'Починаю з головної — спершу каркас, тоді герой, змістові блоки і футер. Вона з’явиться тут, щойно сторінка буде готова; інші сторінки — після неї.',
}

/** The card's own label — the page being built, and the beat under it. */
export const ASSEMBLING: Text = {
  en: 'Putting the page together',
  uk: 'Збираю сторінку докупи',
}
