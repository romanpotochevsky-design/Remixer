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
    note: { en: 'The flow the CEO asked for. The domain stays registered at GoDaddy — we never ask for a transfer.', uk: 'Флоу, який просив CEO. Домен лишається в GoDaddy — переносити не просимо.' },
    setup: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'external-manual', domain: 'staging', unpublished: 0 },
    steps: [
      { id: 'open', label: { en: 'The "Connect a domain" screen is open', uk: 'Відкрито екран «Connect a domain»' }, patch: { domain: 'searching' }, awaitUser: true,
        note: { en: 'Entered from Publish → Add custom domain', uk: 'Вхід із Publish → Add custom domain' } },
      { id: 'typed', label: { en: 'Domain entered — detecting the registrar', uk: 'Введено домен — визначаємо реєстратора' }, ms: 900 },
      { id: 'detected', label: { en: 'Found: this domain is registered at GoDaddy', uk: 'Знайдено: домен зареєстровано в GoDaddy' }, ms: 1400,
        note: { en: 'Slim detection bar: stays at GoDaddy, no transfer needed', uk: 'Смуга детекту: лишається в GoDaddy, перенос не потрібен' } },
      { id: 'method', label: { en: 'Choosing how to connect', uk: 'Вибір способу підключення' }, awaitUser: true,
        note: { en: 'One-click Domain Connect REQUIRES Entri, which we do not have today. Manual records are the real path.', uk: 'Domain Connect в один клік ПОТРЕБУЄ Entri, якого в нас немає. Реальний шлях — ручні записи.' } },
      { id: 'records', label: { en: 'DNS records shown, ready to copy', uk: 'Показано DNS-записи для копіювання' }, awaitUser: true,
        note: { en: 'A + TXT with copy buttons; the GoDaddy guide is inline, not a link away', uk: 'A + TXT з копіюванням; інструкція GoDaddy вбудована' } },
      { id: 'saved', label: { en: 'Domain saved as "Connecting"', uk: 'Домен збережено як «Підключається»' }, patch: { domain: 'connecting' }, ms: 2200,
        note: { en: 'It persists — the domain stays in the list even if they walk away', uk: 'Персистентність: домен лишається у списку, навіть якщо піти' } },
      { id: 'propagating', label: { en: 'Waiting for DNS to propagate', uk: 'Чекаємо на поширення DNS' }, ms: 3200 },
      { id: 'verifying', label: { en: 'Records found — verifying and issuing the certificate', uk: 'Записи знайдено — перевіряємо та випускаємо сертифікат' }, patch: { domain: 'verifying' }, ms: 2600 },
      { id: 'live', label: { en: 'Domain is live, HTTPS on', uk: 'Домен живий, HTTPS увімкнено' }, patch: { domain: 'live' }, ms: 1200 },
      { id: 'done', label: { en: 'Success — the site answers on their own address', uk: 'Успіх — сайт доступний за власною адресою' }, awaitUser: true,
        note: { en: 'Success copy should push distribution, not merely confirm', uk: 'Копірайт успіху має штовхати до поширення, а не лише підтверджувати' } },
    ],
  },
  {
    id: 'connect-dreamhost',
    label: { en: 'Connect a domain already on DreamHost', uk: 'Підключити домен, який уже на DreamHost' },
    note: { en: 'Our edge: zero DNS records, no other tab, under a minute.', uk: 'Наша перевага: нуль DNS-записів, жодних інших вкладок.' },
    setup: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'staging', unpublished: 0 },
    steps: [
      { id: 'open', label: { en: 'Domains screen — "Existing domains" sits on top', uk: 'Екран доменів — зверху «Existing domains»' }, patch: { domain: 'searching' }, awaitUser: true },
      { id: 'pick', label: { en: 'Picked a domain from their DreamHost account', uk: 'Обрано домен з акаунта DreamHost' }, ms: 700,
        note: { en: 'Say it plainly: no records to change', uk: 'Сказати прямо: жодного запису змінювати не треба' } },
      { id: 'connect', label: { en: 'Records written on our side', uk: 'Записи пишуться на нашому боці' }, patch: { domain: 'connecting' }, ms: 1600 },
      { id: 'ssl', label: { en: 'Certificate being issued', uk: 'Випускається сертифікат' }, patch: { domain: 'verifying' }, ms: 1800 },
      { id: 'live', label: { en: 'Live — inside a minute', uk: 'Живий — вклалися в хвилину' }, patch: { domain: 'live' }, ms: 900 },
      { id: 'done', label: { en: 'Success', uk: 'Успіх' }, awaitUser: true },
    ],
  },
  {
    id: 'trial-to-paid',
    label: { en: 'Trial expires → buying a plan', uk: 'Тріал завершився → купівля плану' },
    note: { en: 'The gate must read as an UPGRADE, never as "start a trial".', uk: 'Гейт має читатися як АПГРЕЙД, а не «почни тріал».' },
    setup: { account: 'trial', trialDay: 29, credits: 40, project: 'built', chat: 'long', domain: 'staging', inventory: 'dh-free', unpublished: 2 },
    steps: [
      { id: 'low', label: { en: 'Credits running low — a quiet warning', uk: 'Кредити закінчуються — м\'яке попередження' }, patch: { credits: 10 }, ms: 1600 },
      { id: 'expired', label: { en: 'Trial over: AI off, manual editing still alive', uk: 'Тріал закінчився: AI вимкнено, ручні правки живі' }, patch: { account: 'trial-expired', credits: 0, trialDay: 30 }, ms: 2400,
        note: { en: 'The retention moment. Their site must not disappear.', uk: 'Момент утримання. Сайт не має зникати.' } },
      { id: 'gate', label: { en: 'Plan gate opens', uk: 'Відкрито план-гейт' }, awaitUser: true,
        note: { en: 'State the requirement in plain words: you need Remixer Build, $9.99/mo', uk: 'Сказати прямо: потрібен Remixer Build, $9.99/міс' } },
      { id: 'checkout', label: { en: 'Checkout', uk: 'Оформлення' }, ms: 1400 },
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
        note: { en: 'Progress never blocks; the copy releases the user', uk: 'Прогрес не блокує; копірайт відпускає користувача' } },
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
