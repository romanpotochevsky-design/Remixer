/**
 * The conversation's content: the demo transcript each scenario starts from, and
 * the canned replies Remixer gives to what the user types.
 *
 * There is no model behind this and there never will be — the prototype's job is
 * to show the SHAPE of the interaction (send → the builder works → an answer that
 * names what changed), not to fake intelligence. Replies are matched on obvious
 * keywords so a demo can be steered live: ask about photos, get an answer about
 * photos. Anything unmatched gets one of the generic acknowledgements, rotated so
 * two messages in a row never read identically.
 */
import type { Chat, Message } from '@/state/world'

type Copy = { en: string; uk: string }

/** The transcript a freshly loaded scenario shows. */
const DEMO_THREAD: Omit<Message, 'id'>[] = [
  {
    who: 'user',
    text: {
      en: 'Build me a clean site for my meal-prep service — exact macros, weekly menus, delivery in Odesa.',
      uk: 'Збери мені акуратний сайт для сервісу готових раціонів — точне КБЖВ, тижневі меню, доставка по Одесі.',
    },
  },
  {
    who: 'ai',
    text: {
      en: 'Done — five pages with a hero, menu grid and order form. Want me to tune the palette next?',
      uk: 'Готово — п’ять сторінок: хіро, сітка меню та форма замовлення. Далі підлаштувати палітру?',
    },
  },
  {
    who: 'user',
    text: {
      en: 'Make the menu cards bigger and add photos.',
      uk: 'Зроби картки меню більшими і додай фото.',
    },
  },
]

/** How much of the demo transcript a given scenario shows. */
export function baselineThread(chat: Chat): Message[] {
  if (chat === 'empty') return []
  const take = chat === 'short' ? 1 : DEMO_THREAD.length
  return DEMO_THREAD.slice(0, take).map((m, i) => ({ ...m, id: i + 1 }))
}

/* ------------------------------------------------------------------ replies */

const MATCHED: { on: RegExp; text: Copy }[] = [
  {
    on: /colou?r|palette|theme|brand|font|typograph/i,
    text: {
      en: 'Warmed the palette and set the headings in a single family. The green now only carries actions, so the page reads calmer. Want a darker variant to compare?',
      uk: 'Зробив палітру теплішою і звів заголовки до однієї гарнітури. Зелений тепер лише на діях, сторінка читається спокійніше. Показати темніший варіант для порівняння?',
    },
  },
  {
    on: /photo|image|picture|gallery/i,
    text: {
      en: 'Added photo slots to every menu card and set them to crop square. They are placeholders for now — upload yours and they drop straight in.',
      uk: 'Додав слоти під фото в кожну картку меню, кроп — квадрат. Поки що це заглушки: завантажте свої, і вони стануть на місце.',
    },
  },
  {
    on: /mobile|phone|responsive|tablet/i,
    text: {
      en: 'Tightened the mobile layout — the nav collapses, the cards go single column and the buttons stack full width. Check it with the device switch above the canvas.',
      uk: 'Підтягнув мобільний лейаут — навігація згортається, картки в одну колонку, кнопки на всю ширину. Перевірте перемикачем девайса над канвасом.',
    },
  },
  {
    on: /price|pricing|plan|cost|subscription/i,
    text: {
      en: 'Built a pricing section with three plans and put the weekly one in the middle as the default choice. Prices are placeholders — tell me the real ones and I will set them.',
      uk: 'Зібрав секцію з трьома планами, тижневий поставив у центр як вибір за замовчуванням. Ціни — заглушки: скажіть реальні, і я їх проставлю.',
    },
  },
  {
    on: /text|copy|headline|title|wording|word/i,
    text: {
      en: 'Rewrote the headline and the intro — shorter, and the macro promise now lands in the first line. The old version is one step back in history if you prefer it.',
      uk: 'Переписав заголовок і вступ — коротше, обіцянка про КБЖВ тепер у першому рядку. Стара версія — на крок назад в історії, якщо вона краща.',
    },
  },
  {
    on: /menu|dish|meal|card|food/i,
    text: {
      en: 'The menu cards are larger now, with the calories and protein on one line under the name. Six dishes this week — say the word and I will make it a filterable list.',
      uk: 'Картки меню тепер більші, калорії та білок — одним рядком під назвою. Шість страв на тиждень; скажіть — зроблю список із фільтрами.',
    },
  },
  {
    on: /contact|form|order|email|checkout|book/i,
    text: {
      en: 'Added an order form — name, phone, delivery window and plan. Submissions land in your inbox until you connect a CRM.',
      uk: 'Додав форму замовлення — ім’я, телефон, вікно доставки та план. Заявки йтимуть на пошту, поки не підключите CRM.',
    },
  },
  {
    on: /publish|live|domain|launch|deploy/i,
    text: {
      en: 'Everything is ready to go live. Hit Publish and I will put this on your address — the preview link keeps working either way.',
      uk: 'Усе готове до запуску. Тисніть Publish — я поставлю сайт на вашу адресу; прев’ю-посилання працюватиме в будь-якому разі.',
    },
  },
  {
    on: /faq|question|about|story|team/i,
    text: {
      en: 'Added an FAQ block with six questions from the objections this kind of service usually gets. Edit any answer inline.',
      uk: 'Додав блок FAQ із шести питань — за типовими запереченнями до такого сервісу. Будь-яку відповідь можна правити прямо на сторінці.',
    },
  },
]

const GENERIC: Copy[] = [
  {
    en: 'Done. I kept the rest of the page untouched, so you can compare against the last version.',
    uk: 'Готово. Решту сторінки не чіпав, тож можете порівняти з попередньою версією.',
  },
  {
    en: 'Made that change. Anything else on this page, or shall I move to the next one?',
    uk: 'Зміну вніс. Ще щось на цій сторінці — чи переходимо до наступної?',
  },
  {
    en: 'That is in. If it is not what you pictured, describe it differently and I will redo it — this does not cost you the previous version.',
    uk: 'Готово. Якщо не те, що уявляли — опишіть інакше, і я перероблю; попередня версія від цього не зникає.',
  },
]

let generic = 0

/** Picks the canned reply for what the user just wrote. */
export function replyTo(text: string): Copy {
  const hit = MATCHED.find((r) => r.on.test(text))
  if (hit) return hit.text
  return GENERIC[generic++ % GENERIC.length]
}
