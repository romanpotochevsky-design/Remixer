/**
 * Presets and axis metadata.
 *
 * The console renders itself from AXES — adding a dimension later is one entry here, not
 * surgery on the UI. Presets are only shortcuts that set several axes at once; they never
 * hold state of their own.
 *
 * Every user-facing string is a bilingual pair. English is the product default (US market),
 * Ukrainian is the second language.
 */
import type { World } from './world'
import { DEFAULT_WORLD, DEMO_PROJECTS } from './world'
import type { Text } from '../i18n'
import { leadingDone } from '../modules/chat/autopilot'

export interface Preset {
  id: string
  label: Text
  note: Text
  patch: Partial<World>
}

/** Ordered roughly along the customer's life with us. */
/**
 * The answers the staged demo presets are built on — one brief, so the generation card, the
 * plan and Autopilot's proposals all describe the same site wherever a preset shows them.
 */
const DEMO_BRIEF = { goal: 'sell', pages: 'few', palette: 'warm-clay', type: 'friendly' } as const

export const PRESETS: Preset[] = [
  {
    id: 'weak-prompt',
    label: { en: 'New project — thin prompt', uk: 'Новий проєкт — слабкий промпт' },
    note: {
      en: 'Type "Build me a website." — Remixer asks four questions before it builds (Lovable, 06.09.2026)',
      uk: 'Введіть «Build me a website.» — Remixer ставить чотири запитання, перш ніж будувати (Lovable, 06.09.2026)',
    },
    patch: { account: 'trial', trialDay: 1, credits: 2000, bonus: true, project: 'empty', chat: 'empty', sent: [], domain: 'staging', inventory: 'none', unpublished: 0, published: false },
  },
  {
    id: 'first-run',
    label: { en: 'First run', uk: 'Перший запуск' },
    note: { en: 'Blank canvas, nothing generated yet', uk: 'Порожнє полотно, ще нічого не згенеровано' },
    patch: { account: 'trial', trialDay: 1, credits: 2000, bonus: true, project: 'empty', chat: 'empty', domain: 'staging', inventory: 'none', unpublished: 0, published: false, projects: [] },
  },
  {
    id: 'generating',
    label: { en: 'Generating — mid-build', uk: 'Іде генерація — середина' },
    note: {
      en: 'The outline card frozen on the hero, so the states can be looked at without waiting out the minute (Figma 29480:48478)',
      uk: 'Картка плану, заморожена на герої — можна розглянути стани, не чекаючи хвилину (Figma 29480:48478)',
    },
    /*
     * A STAGED mid-generation, and deliberately frozen: no clock runs behind a preset,
     * so every state of the outline — done, in hand with its shimmering work line,
     * waiting, and the pages this pass does not build — is on screen to be looked at.
     * The live minute is one click away from the Home page; this is for the design.
     *
     * ⚠️ `sent`, `brief` and `build` all ride in the patch. `world.set` reads a `chat`
     * move with an empty transcript as staging a fresh situation and clears the brief and
     * the build with it — which is right for every other preset here and would leave this
     * one showing a generating project with no card in it.
     */
    patch: {
      account: 'trial', trialDay: 1, credits: 1880, project: 'generating', chat: 'working',
      domain: 'staging', unpublished: 0, published: false, projects: [],
      brief: { status: 'ready', step: 0, answers: DEMO_BRIEF },
      build: { at: 1, line: 1 },
      sent: [
        { id: 1001, who: 'user', text: 'A shop for my ceramics studio' },
        {
          id: 1002, who: 'ai', kind: 'ack',
          text: {
            en: 'Got it — a site built to sell, across a few pages, in Warm Clay with friendly lettering. Let me build that for you.',
            uk: 'Зрозумів — сайт, який продає, на кілька сторінок, у палітрі Warm Clay і дружніми шрифтами. Збираю.',
          },
        },
        { id: 1003, who: 'ai', kind: 'build', text: '' },
      ],
    },
  },
  {
    id: 'autopilot',
    label: { en: 'Autopilot — the first proposal', uk: 'Autopilot — перша пропозиція' },
    note: {
      en: 'The home page has just landed and Remixer asks what to do next — the whole behaviour of the mode, without waiting out the minute',
      uk: 'Головна щойно приїхала, і Remixer питає, що далі — уся поведінка режиму, без хвилини очікування',
    },
    /*
     * THE MOMENT AUTOPILOT IS FOR, staged. The live path to it is a real generation from the
     * Home page and takes a minute, which is a minute too long to spend in front of an
     * audience; this is the same state, reached in one click.
     *
     * The transcript ends on the hand-over line, produced by the SAME function the live flow
     * uses (`leadingDone`) rather than retyped here — a preset that quotes the product back
     * at itself drifts the first time the copy changes, and then demonstrates a version of
     * the product that no longer exists.
     *
     * ⚠️ `sent`, `brief`, `build` and `suggest` all ride in the patch, for the reason the
     * preset above spells out: a `chat` move whose transcript did not come with it reads as
     * staging a fresh situation and clears all four.
     */
    patch: {
      account: 'trial', trialDay: 1, credits: 1870, project: 'built', chat: 'long',
      domain: 'staging', unpublished: 1, published: false, projects: [], mode: 'autopilot',
      brief: { status: 'ready', step: 0, answers: DEMO_BRIEF },
      /* Every section green: `at` equal to the section count is the assemble beat, and that
         is where a finished build leaves the card standing in the transcript. */
      build: { at: 5, line: 0 },
      suggest: { show: 'proposal', pick: 'stay', started: [], taken: 0, rated: false, score: null },
      sent: [
        { id: 1001, who: 'user', text: 'A shop for my ceramics studio' },
        {
          id: 1002, who: 'ai', kind: 'ack',
          text: {
            en: 'Got it \u2014 a site built to sell, across a few pages, in Warm Clay with friendly lettering. Let me build that for you.',
            uk: '\u0417\u0440\u043e\u0437\u0443\u043c\u0456\u0432 \u2014 \u0441\u0430\u0439\u0442, \u044f\u043a\u0438\u0439 \u043f\u0440\u043e\u0434\u0430\u0454, \u043d\u0430 \u043a\u0456\u043b\u044c\u043a\u0430 \u0441\u0442\u043e\u0440\u0456\u043d\u043e\u043a, \u0443 \u043f\u0430\u043b\u0456\u0442\u0440\u0456 Warm Clay \u0456 \u0434\u0440\u0443\u0436\u043d\u0456\u043c\u0438 \u0448\u0440\u0438\u0444\u0442\u0430\u043c\u0438. \u0417\u0431\u0438\u0440\u0430\u044e.',
          },
        },
        { id: 1003, who: 'ai', kind: 'build', text: '' },
        { id: 1004, who: 'ai', text: leadingDone(DEMO_BRIEF) },
      ],
    },
  },
  {
    id: 'rating',
    label: { en: 'Autopilot — the satisfaction ask', uk: 'Autopilot — питання про враження' },
    note: {
      en: 'The 1–10 card, asked once after the first proposal was answered (Figma 25744:139153)',
      uk: 'Картка 1–10, що з’являється раз після першої відповіді на пропозицію (Figma 25744:139153)',
    },
    /*
     * One step past the preset above: the proposal was answered, About is under way, and the
     * card asks how the site landed. `taken: 1` is what earns it and `rated: false` is what
     * keeps it — set `rated` and the card is spent, which is the state a second run leaves.
     */
    patch: {
      account: 'trial', trialDay: 1, credits: 1860, project: 'built', chat: 'long',
      domain: 'staging', unpublished: 2, published: false, projects: [], mode: 'autopilot',
      brief: { status: 'ready', step: 0, answers: DEMO_BRIEF },
      build: { at: 5, line: 0 },
      suggest: { show: 'rating', pick: '', started: ['About'], taken: 1, rated: false, score: null },
      sent: [
        { id: 1001, who: 'user', text: 'A shop for my ceramics studio' },
        { id: 1003, who: 'ai', kind: 'build', text: '' },
        { id: 1004, who: 'ai', text: leadingDone(DEMO_BRIEF) },
        { id: 1005, who: 'user', text: 'Start the About page.' },
        {
          id: 1006, who: 'ai',
          text: {
            en: 'About is in \u2014 the same grid, palette and lettering as the home page, and linked from the nav so the site reads as one piece. Tell me what belongs on it and I will fill it in.',
            uk: '\u0421\u0442\u043e\u0440\u0456\u043d\u043a\u0430 \u00ab\u041f\u0440\u043e \u043d\u0430\u0441\u00bb \u043d\u0430 \u043c\u0456\u0441\u0446\u0456 \u2014 \u0442\u0430 \u0441\u0430\u043c\u0430 \u0441\u0456\u0442\u043a\u0430, \u043f\u0430\u043b\u0456\u0442\u0440\u0430 \u0456 \u0448\u0440\u0438\u0444\u0442\u0438, \u0449\u043e \u043d\u0430 \u0433\u043e\u043b\u043e\u0432\u043d\u0456\u0439.',
          },
        },
      ],
    },
  },
  {
    id: 'trial-mid',
    label: { en: 'Trial, day 22', uk: 'Тріал, день 22' },
    note: { en: 'Building, credits going down, no domain yet', uk: 'Будує, кредити витрачаються, домену немає' },
    patch: { account: 'trial', trialDay: 22, credits: 640, bonus: true, project: 'built', chat: 'long', domain: 'staging', inventory: 'dh-free', unpublished: 3, published: false, projects: DEMO_PROJECTS },
  },
  {
    id: 'trial-low',
    label: { en: 'Credits running out', uk: 'Кредити закінчуються' },
    note: { en: 'The upsell moment', uk: 'Момент апселу' },
    patch: { account: 'trial', trialDay: 27, credits: 40, project: 'built', chat: 'long', domain: 'staging', unpublished: 1, published: false, projects: DEMO_PROJECTS },
  },
  {
    id: 'trial-expired',
    label: { en: 'Trial expired', uk: 'Тріал завершився' },
    note: {
      en: 'AI off, manual editing alive. Frame as an UPGRADE, never as "start a trial"',
      uk: 'AI вимкнено, ручне редагування живе. Це АПГРЕЙД, а не «почни тріал»',
    },
    patch: { account: 'trial-expired', trialDay: 30, credits: 0, bonus: false, project: 'built', chat: 'long', domain: 'staging', unpublished: 2, published: false, projects: DEMO_PROJECTS },
  },
  {
    id: 'paid-no-domain',
    label: { en: 'Paid, no domain', uk: 'Оплачено, домену немає' },
    note: { en: 'Plan active, site still on staging', uk: 'План активний, сайт на стейджингу' },
    patch: { account: 'paid', billing: 'yearly', credits: 1000, project: 'built', chat: 'long', domain: 'staging', inventory: 'dh-free', unpublished: 0, published: false, projects: DEMO_PROJECTS },
  },
  {
    id: 'dh-zero-record',
    label: { en: 'Own domain on DreamHost', uk: 'Власний домен на DreamHost' },
    note: { en: 'Our edge: connect with zero DNS records', uk: 'Наша перевага: підключення без жодного DNS-запису' },
    patch: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'searching', unpublished: 0, published: false, projects: DEMO_PROJECTS },
  },
  {
    id: 'connecting',
    label: { en: 'Domain connecting', uk: 'Домен підключається' },
    note: { en: 'Waiting on DNS — nothing for the user to do', uk: 'Чекаємо на DNS — користувачу нічого робити' },
    patch: { account: 'paid', credits: 980, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'connecting', unpublished: 0, published: true, projects: DEMO_PROJECTS },
  },
  {
    id: 'live',
    label: { en: 'Live site', uk: 'Живий сайт' },
    note: { en: 'Everything published, domain working', uk: 'Все опубліковано, домен працює' },
    patch: { account: 'paid', credits: 940, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'live', unpublished: 0, published: true, projects: DEMO_PROJECTS },
  },
  {
    id: 'live-stale',
    label: { en: 'Live, with edits', uk: 'Живий, є правки' },
    note: { en: 'The build is newer than what is published', uk: 'Зібране новіше за опубліковане' },
    patch: { account: 'paid', credits: 900, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'live', unpublished: 4, published: true, projects: DEMO_PROJECTS },
  },
  {
    id: 'domain-broken',
    label: { en: 'Domain not responding', uk: 'Домен не відповідає' },
    note: { en: 'Failure state — needs a recovery verb', uk: 'Стан помилки — потрібне дієслово відновлення' },
    patch: { account: 'paid', credits: 900, project: 'built', chat: 'error', inventory: 'dh-external-ns', domain: 'unreachable', unpublished: 0, published: true, projects: DEMO_PROJECTS },
  },
  {
    id: 'external-manual',
    label: { en: 'Domain at another registrar', uk: 'Домен в іншого реєстратора' },
    note: { en: 'Namecheap / Cloudflare — manual records only', uk: 'Namecheap / Cloudflare — лише ручні записи' },
    patch: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'external-manual', domain: 'connecting', unpublished: 0, published: true, projects: DEMO_PROJECTS },
  },
]

/* ------------------------------------------------------------------ axes */

export interface AxisOption {
  value: string
  label: Text
  hint?: Text
  /**
   * For axes whose value is NOT a scalar (a list, an object): the patch this option
   * applies, instead of the console's default `{ [key]: value }`. `projects` is the
   * first such axis — the dock's two states are "an empty shelf" and "one site".
   */
  patch?: Partial<World>
}

export interface Axis {
  key: keyof World
  group: Text
  label: Text
  kind: 'options' | 'number' | 'toggle'
  options?: AxisOption[]
  min?: number
  max?: number
  step?: number
  /** Hide the axis when it cannot apply (e.g. trial day when not on trial). */
  appliesWhen?: (w: World) => boolean
  /** Non-scalar axes: which option value reads as active right now. */
  current?: (w: World) => string
}

const G = {
  product: { en: 'Product', uk: 'Продукт' },
  customer: { en: 'Customer', uk: 'Клієнт' },
  credits: { en: 'Credits', uk: 'Кредити' },
  owned: { en: 'Domains they own', uk: 'Домени клієнта' },
  domain: { en: 'Project domain', uk: 'Домен проєкту' },
  project: { en: 'Project', uk: 'Проєкт' },
  chat: { en: 'Chat', uk: 'Чат' },
  home: { en: 'Home page', uk: 'Головна' },
}

export const AXES: Axis[] = [
  {
    key: 'lang', group: G.product, label: { en: 'Interface language', uk: 'Мова інтерфейсу' }, kind: 'options',
    options: [
      { value: 'en', label: { en: 'English', uk: 'English' }, hint: { en: 'Default — US market', uk: 'За замовчуванням — ринок США' } },
      { value: 'uk', label: { en: 'Українська', uk: 'Українська' }, hint: { en: 'Second language', uk: 'Друга мова' } },
    ],
  },
  {
    key: 'account', group: G.customer, label: { en: 'Status', uk: 'Статус' }, kind: 'options',
    options: [
      { value: 'anonymous', label: { en: 'Not signed up', uk: 'Не зареєстрований' } },
      { value: 'trial', label: { en: 'On trial', uk: 'Тріал' } },
      { value: 'trial-expired', label: { en: 'Trial expired', uk: 'Тріал завершився' } },
      { value: 'paid', label: { en: 'Paid', uk: 'Оплачено' } },
    ],
  },
  {
    key: 'trialDay', group: G.customer, label: { en: 'Trial day', uk: 'День тріалу' }, kind: 'number',
    min: 1, max: 30, step: 1,
    appliesWhen: (w) => w.account === 'trial',
  },
  {
    key: 'billing', group: G.customer, label: { en: 'Billing', uk: 'Тариф' }, kind: 'options',
    options: [
      { value: 'monthly', label: { en: 'Monthly', uk: 'Щомісячно' }, hint: { en: '$14.99/mo', uk: '$14.99/міс' } },
      { value: 'yearly', label: { en: 'Yearly', uk: 'Річний' }, hint: { en: '$9.99/mo', uk: '$9.99/міс' } },
    ],
    appliesWhen: (w) => w.account === 'paid',
  },
  {
    key: 'credits', group: G.credits, label: { en: 'Balance', uk: 'Баланс' }, kind: 'number',
    min: 0, max: 2000, step: 20,
  },
  {
    key: 'bonus', group: G.credits, label: { en: 'First-month bonus', uk: 'Бонус першого місяця' }, kind: 'toggle',
  },
  {
    key: 'inventory', group: G.owned, label: { en: 'What they have', uk: 'Що в них є' }, kind: 'options',
    options: [
      { value: 'none', label: { en: 'No domains', uk: 'Доменів немає' }, hint: { en: 'must buy one', uk: 'лише купівля' } },
      { value: 'dh-free', label: { en: 'Free one on DreamHost', uk: 'Вільний на DreamHost' }, hint: { en: 'zero records — our edge', uk: 'нуль записів — наша перевага' } },
      { value: 'dh-in-use', label: { en: 'On DreamHost, serving a site', uk: 'На DreamHost, зайнятий сайтом' }, hint: { en: 'needs a replace confirmation', uk: 'потрібне підтвердження заміни' } },
      { value: 'dh-external-ns', label: { en: 'Ours, but external NS', uk: 'Наш, але NS назовні' }, hint: { en: 'our records will not apply', uk: 'наші записи не застосуються' } },
      { value: 'external-dc', label: { en: 'External, with Domain Connect', uk: 'Чужий, з Domain Connect' }, hint: { en: 'needs Entri — not ours yet', uk: 'потребує Entri — поки не наше' } },
      { value: 'external-manual', label: { en: 'External, manual only', uk: 'Чужий, лише вручну' }, hint: { en: 'copy DNS records', uk: 'ручні записи' } },
    ],
  },
  {
    key: 'domain', group: G.domain, label: { en: 'State', uk: 'Стан' }, kind: 'options',
    options: [
      { value: 'staging', label: { en: 'Staging only', uk: 'Лише стейджинг' } },
      { value: 'searching', label: { en: 'Choosing', uk: 'Обирає' } },
      { value: 'checkout', label: { en: 'Checkout', uk: 'Оформлення' } },
      { value: 'connecting', label: { en: 'Connecting', uk: 'Підключається' } },
      { value: 'verifying', label: { en: 'Verifying', uk: 'Перевіряється' } },
      { value: 'live', label: { en: 'Live', uk: 'Живий' } },
      { value: 'unreachable', label: { en: 'Not reachable', uk: 'Не відповідає' } },
      { value: 'multiple', label: { en: 'Several domains', uk: 'Кілька доменів' } },
    ],
  },
  {
    key: 'project', group: G.project, label: { en: 'State', uk: 'Стан' }, kind: 'options',
    options: [
      { value: 'empty', label: { en: 'Empty', uk: 'Порожній' } },
      { value: 'generating', label: { en: 'Generating', uk: 'Генерується' } },
      { value: 'built', label: { en: 'Built', uk: 'Зібраний' } },
    ],
  },
  {
    key: 'unpublished', group: G.project, label: { en: 'Unpublished changes', uk: 'Неопублікованих правок' }, kind: 'number',
    min: 0, max: 12, step: 1,
  },
  {
    /* What the Publish panel's title and its nudge banner hang off (Figma 29697:36970):
       "has this site ever gone live", which is not the same question as "are there
       edits pending". Only meaningful once there is a site at all. */
    key: 'published', group: G.project, label: { en: 'Ever published', uk: 'Публікувався' }, kind: 'toggle',
    appliesWhen: (w) => w.project !== 'empty',
  },
  {
    /* The composer's mode switcher (Figma 29697:54553). Autopilot is the default from
       the first generation on; it only has anything to lead once a site exists. */
    key: 'mode', group: G.chat, label: { en: 'Chat mode', uk: 'Режим чату' }, kind: 'options',
    options: [
      { value: 'autopilot', label: { en: 'Autopilot', uk: 'Автопілот' }, hint: { en: 'Remixer proposes the next task', uk: 'Remixer пропонує наступний крок' } },
      { value: 'build', label: { en: 'Build', uk: 'Збирати' }, hint: { en: 'Does what it is asked', uk: 'Робить те, що просять' } },
    ],
  },
  {
    key: 'chat', group: G.chat, label: { en: 'History', uk: 'Історія' }, kind: 'options',
    options: [
      { value: 'empty', label: { en: 'Empty', uk: 'Порожньо' } },
      { value: 'short', label: { en: 'Short', uk: 'Коротка' } },
      { value: 'long', label: { en: 'Long', uk: 'Довга' } },
      { value: 'working', label: { en: 'Agent working', uk: 'Агент працює' } },
      { value: 'error', label: { en: 'Error', uk: 'Помилка' } },
    ],
  },
  {
    /*
     * The Home page dock has exactly two shapes, and which one you get is decided
     * here rather than by a flag on the page: a customer with nothing generated is
     * shown templates, a customer with a site is shown their shelf with the
     * `My projects | Templates` tabs over it (Figma 28375:43006 / 28364:40053).
     */
    key: 'projects', group: G.home, label: { en: 'Sites they have', uk: 'Створені сайти' }, kind: 'options',
    current: (w) => (w.projects.length ? 'one' : 'none'),
    options: [
      {
        value: 'none', label: { en: 'No projects yet', uk: 'Ще нічого немає' },
        hint: { en: 'first run — the dock shows templates', uk: 'перший запуск — у доку шаблони' },
        patch: { projects: [] },
      },
      {
        value: 'one', label: { en: 'One site', uk: 'Один сайт' },
        hint: { en: 'the dock shows My projects', uk: 'у доку «My projects»' },
        patch: { projects: DEMO_PROJECTS },
      },
    ],
  },
]

/** Distinct groups, in the order they first appear. */
export const GROUPS: Text[] = AXES.reduce<Text[]>((acc, a) => {
  if (!acc.some((g) => g.en === a.group.en)) acc.push(a.group)
  return acc
}, [])

/** One human sentence describing the current situation — read it aloud in a demo. */
export function describe(w: World): Text {
  const en: string[] = []
  const uk: string[] = []

  if (w.account === 'anonymous') { en.push('Not signed up'); uk.push('Не зареєстрований') }
  else if (w.account === 'trial') { en.push(`Trial · day ${w.trialDay} of 30`); uk.push(`Тріал · день ${w.trialDay} з 30`) }
  else if (w.account === 'trial-expired') { en.push('Trial expired'); uk.push('Тріал завершився') }
  else if (w.billing === 'yearly') { en.push('Paid · yearly'); uk.push('Оплачено · річний') }
  else { en.push('Paid · monthly'); uk.push('Оплачено · щомісячно') }

  if (w.credits === 0) { en.push('no credits'); uk.push('кредитів немає') }
  else { en.push(`${w.credits} credits`); uk.push(`${w.credits} кредитів`) }

  const domain: Record<World['domain'], Text> = {
    staging: { en: 'no custom domain', uk: 'домен не підключено' },
    searching: { en: 'choosing a domain', uk: 'обирає домен' },
    checkout: { en: 'at checkout', uk: 'оформлює покупку' },
    connecting: { en: 'domain connecting', uk: 'домен підключається' },
    verifying: { en: 'domain verifying', uk: 'домен перевіряється' },
    live: { en: 'domain live', uk: 'домен живий' },
    unreachable: { en: 'domain not reachable', uk: 'домен не відповідає' },
    multiple: { en: 'several domains', uk: 'кілька доменів' },
  }
  en.push(domain[w.domain].en); uk.push(domain[w.domain].uk)

  if (!w.projects.length) { en.push('no sites yet'); uk.push('сайтів ще немає') }
  if (w.brief.status === 'asking') { en.push('asking for direction'); uk.push('уточнює напрямок') }
  else if (w.brief.status === 'planning') { en.push('plan awaiting approval'); uk.push('план очікує підтвердження') }
  else if (w.project === 'empty') { en.push('empty project'); uk.push('проєкт порожній') }
  else if (w.project === 'generating') { en.push('generating'); uk.push('іде генерація') }
  else if (w.unpublished > 0) {
    en.push(`${w.unpublished} unpublished changes`)
    uk.push(`${w.unpublished} неопублікованих правок`)
  }

  return { en: en.join(' · '), uk: uk.join(' · ') }
}

export const isDefault = (w: World) =>
  JSON.stringify(w) === JSON.stringify(DEFAULT_WORLD)
