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
import { DEFAULT_WORLD } from './world'
import type { Text } from '../i18n'

export interface Preset {
  id: string
  label: Text
  note: Text
  patch: Partial<World>
}

/** Ordered roughly along the customer's life with us. */
export const PRESETS: Preset[] = [
  {
    id: 'first-run',
    label: { en: 'First run', uk: 'Перший запуск' },
    note: { en: 'Blank canvas, nothing generated yet', uk: 'Порожнє полотно, ще нічого не згенеровано' },
    patch: { account: 'trial', trialDay: 1, credits: 2000, bonus: true, project: 'empty', chat: 'empty', domain: 'staging', inventory: 'none', unpublished: 0 },
  },
  {
    id: 'generating',
    label: { en: 'Generating', uk: 'Іде генерація' },
    note: { en: 'The site assembles in front of you', uk: 'Сайт збирається на очах' },
    patch: { account: 'trial', trialDay: 1, credits: 1880, project: 'generating', chat: 'working', domain: 'staging', unpublished: 0 },
  },
  {
    id: 'trial-mid',
    label: { en: 'Trial, day 22', uk: 'Тріал, день 22' },
    note: { en: 'Building, credits going down, no domain yet', uk: 'Будує, кредити витрачаються, домену немає' },
    patch: { account: 'trial', trialDay: 22, credits: 640, bonus: true, project: 'built', chat: 'long', domain: 'staging', inventory: 'dh-free', unpublished: 3 },
  },
  {
    id: 'trial-low',
    label: { en: 'Credits running out', uk: 'Кредити закінчуються' },
    note: { en: 'The upsell moment', uk: 'Момент апселу' },
    patch: { account: 'trial', trialDay: 27, credits: 40, project: 'built', chat: 'long', domain: 'staging', unpublished: 1 },
  },
  {
    id: 'trial-expired',
    label: { en: 'Trial expired', uk: 'Тріал завершився' },
    note: {
      en: 'AI off, manual editing alive. Frame as an UPGRADE, never as "start a trial"',
      uk: 'AI вимкнено, ручне редагування живе. Це АПГРЕЙД, а не «почни тріал»',
    },
    patch: { account: 'trial-expired', trialDay: 30, credits: 0, bonus: false, project: 'built', chat: 'long', domain: 'staging', unpublished: 2 },
  },
  {
    id: 'paid-no-domain',
    label: { en: 'Paid, no domain', uk: 'Оплачено, домену немає' },
    note: { en: 'Plan active, site still on staging', uk: 'План активний, сайт на стейджингу' },
    patch: { account: 'paid', billing: 'yearly', credits: 1000, project: 'built', chat: 'long', domain: 'staging', inventory: 'dh-free', unpublished: 0 },
  },
  {
    id: 'dh-zero-record',
    label: { en: 'Own domain on DreamHost', uk: 'Власний домен на DreamHost' },
    note: { en: 'Our edge: connect with zero DNS records', uk: 'Наша перевага: підключення без жодного DNS-запису' },
    patch: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'searching', unpublished: 0 },
  },
  {
    id: 'connecting',
    label: { en: 'Domain connecting', uk: 'Домен підключається' },
    note: { en: 'Waiting on DNS — nothing for the user to do', uk: 'Чекаємо на DNS — користувачу нічого робити' },
    patch: { account: 'paid', credits: 980, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'connecting', unpublished: 0 },
  },
  {
    /* The padlock moment, reachable in one click: the stage where "Connected to your
       site" is ticked and "Security (SSL) on" is still running (FACTS DH-301). */
    id: 'securing',
    label: { en: 'Turning on the padlock', uk: 'Увімкнення замочка' },
    note: {
      en: 'Address answers, certificate not issued yet — the state the checklist exists to explain. Refresh status carries on to live',
      uk: 'Адреса вже відповідає, сертифіката ще немає — саме той стан, для якого й існує чекліст. «Оновити статус» веде далі, до живого',
    },
    patch: { account: 'paid', credits: 970, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'securing', unpublished: 0 },
  },
  {
    id: 'ready',
    label: { en: 'Ready, never published', uk: 'Готово, ще не опубліковано' },
    note: {
      en: 'Domain works, the site was never published — the novice’s most likely state',
      uk: 'Домен працює, сайт ніколи не публікували — найчастіший стан у новачка',
    },
    patch: { account: 'paid', credits: 960, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'ready', unpublished: 2 },
  },
  {
    id: 'live',
    label: { en: 'Live site', uk: 'Живий сайт' },
    note: { en: 'Everything published, domain working', uk: 'Все опубліковано, домен працює' },
    patch: { account: 'paid', credits: 940, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'live', unpublished: 0 },
  },
  {
    id: 'live-stale',
    label: { en: 'Live, with edits', uk: 'Живий, є правки' },
    note: { en: 'The build is newer than what is published', uk: 'Зібране новіше за опубліковане' },
    patch: { account: 'paid', credits: 900, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'live', unpublished: 4 },
  },
  {
    id: 'domain-broken',
    label: { en: 'Domain not responding', uk: 'Домен не відповідає' },
    note: { en: 'Failure state — needs a recovery verb', uk: 'Стан помилки — потрібне дієслово відновлення' },
    patch: { account: 'paid', credits: 900, project: 'built', chat: 'error', inventory: 'dh-external-ns', domain: 'unreachable', unpublished: 0 },
  },
  {
    id: 'external-dc',
    label: { en: 'Domain behind Cloudflare', uk: 'Домен за Cloudflare' },
    note: {
      en: 'Cloudflare has Domain Connect — but the proxy must be "DNS only" to verify',
      uk: 'У Cloudflare є Domain Connect — але для перевірки проксі має бути «DNS only»',
    },
    patch: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'external-dc', domain: 'verifying', unpublished: 0 },
  },
  {
    id: 'external-manual',
    label: { en: 'Domain at another registrar', uk: 'Домен в іншого реєстратора' },
    note: { en: 'Type a domain of your own to reach the guided manual path', uk: 'Введіть свій домен, щоб дійти до ручного шляху з підказками' },
    /* Opens on the domain surface, NOT mid-connect. It used to land on `connecting`,
       which dropped the viewer past the very step this preset is named for — the
       records were already pasted and there was nothing left to show. The point of
       this situation is the ENTRY: type a domain that is not in the account and watch
       the field route it to the external screen. */
    patch: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'external-manual', domain: 'searching', unpublished: 0 },
  },
]

/* ------------------------------------------------------------------ axes */

export interface AxisOption {
  value: string
  label: Text
  hint?: Text
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
}

const G = {
  product: { en: 'Product', uk: 'Продукт' },
  customer: { en: 'Customer', uk: 'Клієнт' },
  credits: { en: 'Credits', uk: 'Кредити' },
  owned: { en: 'Domains they own', uk: 'Домени клієнта' },
  domain: { en: 'Project domain', uk: 'Домен проєкту' },
  project: { en: 'Project', uk: 'Проєкт' },
  chat: { en: 'Chat', uk: 'Чат' },
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
      {
        value: 'payment-failed',
        label: { en: 'Payment failed', uk: 'Платіж не пройшов' },
        /* The hint stops at the entitlement. What happens to a live site is the
           open billing question — docs/features/account-and-billing.md §2. */
        hint: { en: 'subscription not renewed — AI off', uk: 'підписка не поновилася — AI вимкнено' },
      },
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
    /* Also on `payment-failed`: the lapsed subscription had a term, and hiding it
       would leave a stale value in the world with no way to see or change it. */
    appliesWhen: (w) => w.account === 'paid' || w.account === 'payment-failed',
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
      { value: 'securing', label: { en: 'Turning on the padlock', uk: 'Увімкнення замочка' } },
      { value: 'ready', label: { en: 'Ready to publish', uk: 'Готово до публікації' } },
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
    key: 'chat', group: G.chat, label: { en: 'History', uk: 'Історія' }, kind: 'options',
    options: [
      { value: 'empty', label: { en: 'Empty', uk: 'Порожньо' } },
      { value: 'short', label: { en: 'Short', uk: 'Коротка' } },
      { value: 'long', label: { en: 'Long', uk: 'Довга' } },
      { value: 'working', label: { en: 'Agent working', uk: 'Агент працює' } },
      { value: 'error', label: { en: 'Error', uk: 'Помилка' } },
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
  /* Its own branch, not a fall-through: without it `payment-failed` landed in the
     final `else` below and the console read it out as "Paid" — the exact silent
     miscategorisation that adding a value to an axis invites. The sentence stops
     at the subscription and says nothing about the site (account-and-billing §2). */
  else if (w.account === 'payment-failed') { en.push('Payment failed · not renewed'); uk.push('Платіж не пройшов · не поновлено') }
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
    securing: { en: 'padlock being turned on', uk: 'увімкнюється замочок' },
    ready: { en: 'domain ready, never published', uk: 'домен готовий, ще не опубліковано' },
    live: { en: 'domain live', uk: 'домен живий' },
    unreachable: { en: 'domain not reachable', uk: 'домен не відповідає' },
    multiple: { en: 'several domains', uk: 'кілька доменів' },
  }
  en.push(domain[w.domain].en); uk.push(domain[w.domain].uk)

  if (w.project === 'empty') { en.push('empty project'); uk.push('проєкт порожній') }
  else if (w.project === 'generating') { en.push('generating'); uk.push('іде генерація') }
  else if (w.unpublished > 0) {
    en.push(`${w.unpublished} unpublished changes`)
    uk.push(`${w.unpublished} неопублікованих правок`)
  }

  return { en: en.join(' · '), uk: uk.join(' · ') }
}

export const isDefault = (w: World) =>
  JSON.stringify(w) === JSON.stringify(DEFAULT_WORLD)
