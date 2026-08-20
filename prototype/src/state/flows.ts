/**
 * The flow engine.
 *
 * A flow is a declarative script: start it and the prototype plays the whole process
 * end to end — every intermediate state, in order, to success. That is what makes this
 * demonstrable to a CEO who wants to see "what happens when I connect a GoDaddy domain"
 * rather than click through a gallery of disconnected screens.
 *
 * Two rules keep it a prototype instead of a movie:
 *   1. Steps that carry a real decision set `awaitUser` and stop until someone acts.
 *   2. Waiting steps are compressed but stay proportional — DNS still feels longer than
 *      a button press. `speed` scales the whole timeline for a demo.
 */
import { create } from 'zustand'
import type { World } from './world'
import { useWorld } from './world'
import type { Text } from '../i18n'

export interface FlowStep {
  id: string
  /** Narratable: what is happening right now. */
  label: Text
  patch?: Partial<World>
  /** Dwell before auto-advancing, in ms at speed 1. */
  ms?: number
  /** Stop here until the user actually does something. */
  awaitUser?: boolean
  /** Design note for the team, shown in the console — not product copy. */
  note?: Text
}

export interface Flow {
  id: string
  label: Text
  note: Text
  /** World state the flow begins from. */
  setup: Partial<World>
  steps: FlowStep[]
}

/* ------------------------------------------------------------------ flows */

export const FLOWS: Flow[] = [
  {
    id: 'connect-external',
    label: { en: 'Connect a domain hosted elsewhere (GoDaddy)', uk: 'Підключити домен з іншого хостингу (GoDaddy)' },
    note: { en: 'The flow the CEO asked for. The domain stays registered at GoDaddy — we never ask for a transfer. GoDaddy is itself a Domain Connect provider (FACTS STD-001), so the axis is external-dc; we still hand out records, because that rail is Entri’s and we have not bought it.', uk: 'Флоу, який просив CEO. Домен лишається в GoDaddy — переносити не просимо. GoDaddy сам є провайдером Domain Connect (FACTS STD-001), тому вісь — external-dc; але записи все одно віддаємо руками, бо ця рейка належить Entri, а ми її не купили.' },
    /* The inventory axis is the PROVIDER's capability, not our path (see world.ts):
       GoDaddy is on the Domain Connect provider list (FACTS STD-001), so a GoDaddy
       domain is `external-dc` even though the only path we can ship for it today is
       the guided manual one. `external-manual` (Namecheap, FACTS STD-003) is the
       bucket where nobody could automate it; this flow is the sharper story — the
       rail exists, we just do not own it. Matching preset: scenarios.ts `external-dc`. */
    setup: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'external-dc', domain: 'staging', unpublished: 0 },
    steps: [
      { id: 'open', label: { en: 'The "Connect a domain" screen is open', uk: 'Відкрито екран «Connect a domain»' }, patch: { domain: 'searching' }, awaitUser: true,
        note: { en: 'Entered from Publish → “Connect your own domain” (Add = buy, Connect = attach your own — COPY-RULES)', uk: 'Вхід із Publish → «Connect your own domain» (Add = купити, Connect = підключити своє — COPY-RULES)' } },
      { id: 'typed', label: { en: 'Domain entered — detecting the registrar', uk: 'Введено домен — визначаємо реєстратора' }, ms: 900 },
      { id: 'detected', label: { en: 'Found: this domain is registered at GoDaddy', uk: 'Знайдено: домен зареєстровано в GoDaddy' }, ms: 1400,
        note: { en: 'Slim detection bar: stays at GoDaddy, no transfer needed. What we read is the registrar — public and structured over RDAP (FACTS STD-014); whether one-click were even possible depends on the authoritative DNS provider, not the registrar (STD-006).', uk: 'Смуга детекту: лишається в GoDaddy, перенос не потрібен. Читаємо саме реєстратора — це публічні структуровані дані RDAP (FACTS STD-014); а от чи можливий one-click, вирішує авторитетний DNS-провайдер, а не реєстратор (STD-006).' } },
      { id: 'method', label: { en: 'Guided manual setup opens, with GoDaddy’s own steps inline', uk: 'Відкривається ручне налаштування з підказками — кроки для GoDaddy просто тут' }, awaitUser: true,
        note: { en: 'No method to pick — one-click would put a consent screen right here, and that needs the Entri PO: DreamHost supports Domain Connect in no role (FACTS DH-201, STD-002). Until that PO exists this guided path IS the product (DECISIONS 17); the half of Entri we can steal without it is per-registrar steps (STD-011). Screen: ExternalScreen.', uk: 'Способу вибирати не треба — one-click поставив би тут екран згоди, а для нього потрібен PO на Entri: DreamHost не підтримує Domain Connect у жодній ролі (FACTS DH-201, STD-002). Доки PO немає, продукт — саме цей шлях із підказками (DECISIONS 17); те, що можна взяти в Entri без PO, — інструкції під конкретного реєстратора (STD-011). Екран: ExternalScreen.' } },
      { id: 'records', label: { en: 'DNS records shown, ready to copy', uk: 'Показано DNS-записи для копіювання' }, awaitUser: true,
        note: { en: 'A + TXT with copy buttons; the GoDaddy guide is inline, not a link away', uk: 'A + TXT з копіюванням; інструкція GoDaddy вбудована' } },
      { id: 'saved', label: { en: 'Domain saved as "Connecting"', uk: 'Домен збережено як «Підключається»' }, patch: { domain: 'connecting' }, ms: 2200,
        note: { en: 'It persists — the domain stays in the list even if they walk away. Not drawn: OWNED_DOMAINS (data/domains.ts) has no external buckets, so “Existing domains” stays empty on this path.', uk: 'Персистентність: домен лишається у списку, навіть якщо піти. Не намальовано: у OWNED_DOMAINS (data/domains.ts) немає зовнішніх кошиків, тому «Existing domains» на цьому шляху лишається порожнім.' } },
      { id: 'propagating', label: { en: 'Waiting for DNS to propagate', uk: 'Чекаємо на поширення DNS' }, ms: 3200 },
      { id: 'verifying', label: { en: 'Records found — checking them, then the padlock', uk: 'Записи знайдено — перевіряємо, далі замочок' }, patch: { domain: 'verifying' }, ms: 2600,
        note: { en: 'Compressed the hardest on this path: on an external registrar the padlock queues behind the DNS change (FACTS DH-203) and only then behind Let’s Encrypt (DH-301). Never demo this as seconds.', uk: 'Найсильніше стиснутий крок цього шляху: у зовнішнього реєстратора замочок чекає спершу на зміну DNS (FACTS DH-203), і лише потім на Let’s Encrypt (DH-301). Не показувати це як секунди.' } },
      { id: 'live', label: { en: 'Domain is live, HTTPS on', uk: 'Домен живий, HTTPS увімкнено' }, patch: { domain: 'live' }, ms: 1200 },
      { id: 'done', label: { en: 'Success — the site answers on their own address', uk: 'Успіх — сайт доступний за власною адресою' }, awaitUser: true,
        note: { en: 'Success copy should push distribution, not merely confirm', uk: 'Копірайт успіху має штовхати до поширення, а не лише підтверджувати' } },
    ],
  },
  {
    id: 'connect-dreamhost',
    label: { en: 'Connect a domain already on DreamHost', uk: 'Підключити домен, який уже на DreamHost' },
    note: { en: 'Our edge: zero records to change, no second tab, nothing to verify (FACTS DH-213) — under a minute of the user’s own work. The padlock still queues behind Let’s Encrypt (DH-301).', uk: 'Наша перевага: жодного запису змінювати не треба, жодної другої вкладки, нічого підтверджувати (FACTS DH-213) — менше хвилини роботи користувача. Замочок усе одно чекає на Let’s Encrypt (DH-301).' },
    setup: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'staging', unpublished: 0 },
    steps: [
      { id: 'open', label: { en: 'Domains screen — "Existing domains" sits on top', uk: 'Екран доменів — зверху «Existing domains»' }, patch: { domain: 'searching' }, awaitUser: true },
      { id: 'pick', label: { en: 'Picked a domain from their DreamHost account', uk: 'Обрано домен з акаунта DreamHost' }, ms: 700,
        note: { en: 'Say it plainly: no records to change', uk: 'Сказати прямо: жодного запису змінювати не треба' } },
      { id: 'connect', label: { en: 'Records written on our side', uk: 'Записи пишуться на нашому боці' }, patch: { domain: 'connecting' }, ms: 1600 },
      { id: 'ssl', label: { en: 'Padlock being set up', uk: 'Налаштовується замочок' }, patch: { domain: 'verifying' }, ms: 1800,
        note: { en: 'Compressed hard: this wait is 10–30 min (FACTS DH-301), not two seconds. The prototype has no `securing` state — `verifying` plays both roles, so the checklist ticks “Connected” and “Security (SSL) on” together (STATES.md, disagreements 2–3).', uk: 'Сильно стиснуто: це очікування — 10–30 хв (FACTS DH-301), а не дві секунди. У прототипі немає стану `securing` — `verifying` грає обидві ролі, тому чекліст закриває «Connected» і «Security (SSL) on» разом (STATES.md, розбіжності 2–3).' } },
      { id: 'live', label: { en: 'Live — and nothing was typed anywhere else', uk: 'Живий — і ніде більше нічого не вводили' }, patch: { domain: 'live' }, ms: 900,
        note: { en: 'Do not say “instantly secured”: the minute buys the address, the padlock lands behind it (FACTS DH-301).', uk: 'Не казати «миттєво захищено»: хвилина дає адресу, замочок приходить після неї (FACTS DH-301).' } },
      { id: 'done', label: { en: 'Success', uk: 'Успіх' }, awaitUser: true },
    ],
  },
  {
    id: 'trial-to-paid',
    label: { en: 'Trial expires → buying a plan', uk: 'Тріал завершився → купівля плану' },
    note: { en: 'The gate must read as an UPGRADE, never as "start a trial".', uk: 'Гейт має читатися як АПГРЕЙД, а не «почни тріал».' },
    setup: { account: 'trial', trialDay: 29, credits: 40, project: 'built', chat: 'long', domain: 'staging', inventory: 'dh-free', unpublished: 2 },
    steps: [
      { id: 'low', label: { en: 'Credits down to 10 — the toolbar number is the whole signal', uk: 'Залишилось 10 кредитів — єдиний сигнал це число в тулбарі' }, patch: { credits: 10 }, ms: 1600,
        note: { en: 'Not drawn: a low-credit state. App.tsx only changes the pill at zero. The count itself never leaves the toolbar — that part is deliberate (audit rule 6).', uk: 'Не намальовано: стан «мало кредитів». App.tsx змінює пілюлю лише на нулі. Саме число з тулбара не зникає ніколи — це навмисно (правило аудиту 6).' } },
      { id: 'expired', label: { en: 'Trial over: AI off, the site stays up', uk: 'Тріал закінчився: AI вимкнено, сайт лишається' }, patch: { account: 'trial-expired', credits: 0, trialDay: 30 }, ms: 2400,
        note: { en: 'The retention moment. Their site must not disappear — the staging preview stays free after the trial (FACTS DH-005). Unsourced, so do not promise it: “manual editing still works” has no FACTS row, and the prototype has no manual editor either — App.tsx only prints the notice.', uk: 'Момент утримання. Сайт не має зникати — прев’ю на стейджингу лишається безкоштовним і після тріалу (FACTS DH-005). Не обіцяти: «ручні правки далі працюють» не має рядка у FACTS, та й ручного редактора в прототипі немає — App.tsx лише друкує повідомлення.' } },
      { id: 'gate', label: { en: 'The upgrade moment — the requirement stated in plain words', uk: 'Момент апгрейду — вимогу сказано звичайними словами' }, awaitUser: true,
        note: { en: 'Say it plainly: you need Remixer Build, $9.99/mo (FACTS DH-001). Not drawn: there is no plan-gate screen — App.tsx prints a trial-ended notice and nothing else; the only gate that exists is inside DomainModal.', uk: 'Сказати прямо: потрібен Remixer Build, $9.99/міс (FACTS DH-001). Не намальовано: екрана план-гейта немає — App.tsx друкує лише повідомлення про кінець тріалу; єдиний наявний гейт живе в DomainModal.' } },
      { id: 'checkout', label: { en: 'Checkout — off-screen, in DreamHost’s existing billing', uk: 'Оплата — поза екраном, у наявному білінгу DreamHost' }, ms: 1400,
        note: { en: 'Not drawn, and deliberately so: the prototype has no checkout screen — the world simply comes back paid.', uk: 'Не намальовано, і це свідомо: у прототипі немає екрана оплати — світ просто повертається вже оплаченим.' } },
      { id: 'paid', label: { en: 'Plan active, credits granted', uk: 'План активний, кредити нараховано' }, patch: { account: 'paid', billing: 'yearly', credits: 1000 }, ms: 1200 },
      { id: 'done', label: { en: 'Back in the builder — AI available again', uk: 'Повернулись у білдер — AI знову доступний' }, awaitUser: true },
    ],
  },
  {
    id: 'publish',
    label: { en: 'Publishing changes', uk: 'Публікація змін' },
    note: { en: 'Publishing has to be free — it is our most attackable line against competitors.', uk: 'Публікація має бути безкоштовною — це наша найвразливіша позиція.' },
    setup: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'live', unpublished: 4 },
    steps: [
      { id: 'panel', label: { en: 'Publish panel open', uk: 'Відкрито панель публікації' }, awaitUser: true },
      { id: 'publishing', label: { en: 'Publishing — you can keep working', uk: 'Публікується — можна працювати далі' }, ms: 2600,
        note: { en: 'Progress never blocks; the copy releases the user. Not drawn: PublishPanel has no in-progress state — the button zeroes the pending count at once, so this step and the next narrate ahead of the screen.', uk: 'Прогрес не блокує; копірайт відпускає користувача. Не намальовано: у PublishPanel немає стану публікації — кнопка одразу обнуляє лічильник змін, тож цей крок і наступний випереджають екран.' } },
      { id: 'purge', label: { en: 'Refreshing the cache across every CDN point', uk: 'Оновлюється кеш на всіх точках CDN' }, ms: 1400 },
      { id: 'done', label: { en: 'Published — nothing pending', uk: 'Опубліковано, змін немає' }, patch: { unpublished: 0 }, awaitUser: true },
    ],
  },
]

export const flowById = (id: string) => FLOWS.find((f) => f.id === id)

/* ----------------------------------------------------------------- engine */

export type Speed = 'slow' | 'demo' | 'instant'
const SPEED_FACTOR: Record<Speed, number> = { slow: 2, demo: 1, instant: 0 }

interface FlowStore {
  flowId: string | null
  index: number
  playing: boolean
  speed: Speed
  start: (id: string) => void
  stop: () => void
  play: () => void
  pause: () => void
  next: () => void
  prev: () => void
  goTo: (i: number) => void
  setSpeed: (s: Speed) => void
}

/** Apply a step's world patch, if it has one. */
function applyStep(flow: Flow, i: number) {
  const step = flow.steps[i]
  if (step?.patch) useWorld.getState().set(step.patch)
}

export const useFlow = create<FlowStore>((set, get) => ({
  flowId: null,
  index: 0,
  playing: false,
  speed: 'demo',

  start: (id) => {
    const flow = flowById(id)
    if (!flow) return
    useWorld.getState().set(flow.setup, null)
    applyStep(flow, 0)
    set({ flowId: id, index: 0, playing: true })
  },
  stop: () => set({ flowId: null, index: 0, playing: false }),
  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),

  next: () => {
    const { flowId, index } = get()
    const flow = flowId ? flowById(flowId) : null
    if (!flow) return
    const i = Math.min(index + 1, flow.steps.length - 1)
    applyStep(flow, i)
    set({ index: i, playing: i < flow.steps.length - 1 })
  },
  prev: () => {
    const { flowId, index } = get()
    const flow = flowId ? flowById(flowId) : null
    if (!flow) return
    const i = Math.max(index - 1, 0)
    // Replay from the start so the world matches the step, rather than un-applying patches.
    useWorld.getState().set(flow.setup, null)
    for (let k = 0; k <= i; k++) applyStep(flow, k)
    set({ index: i, playing: false })
  },
  goTo: (i) => {
    const { flowId } = get()
    const flow = flowId ? flowById(flowId) : null
    if (!flow) return
    const target = Math.max(0, Math.min(i, flow.steps.length - 1))
    useWorld.getState().set(flow.setup, null)
    for (let k = 0; k <= target; k++) applyStep(flow, k)
    set({ index: target, playing: false })
  },
  setSpeed: (s) => set({ speed: s }),
}))

/** Dwell for the current step, scaled by the demo speed. */
export function stepDelay(step: FlowStep, speed: Speed): number | null {
  if (step.awaitUser) return null
  const base = step.ms ?? 1200
  const factor = SPEED_FACTOR[speed]
  return factor === 0 ? 60 : base * factor
}
