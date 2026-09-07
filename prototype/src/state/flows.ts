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
import type { World, Message } from './world'
import { useWorld, EMPTY_BRIEF } from './world'
import type { Text } from '../i18n'
import { BRIEF_INTRO, BRIEF_STATUS, briefAck, briefDone, type BriefAnswers } from '../modules/chat/brief'

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

/* The thin-prompt flow is scripted from real messages, so the thread reads as it would live. */
const THIN_PROMPT: Message = { id: 1, who: 'user', text: 'Build me a website.' }
const THIN_ASK: Message = { id: 2, who: 'ai', kind: 'clarify', thought: 5, text: BRIEF_INTRO }
/*
 * The demo's answers, and they are chosen to tell ONE story rather than to show off the
 * form: a person with nothing to say picks the plainest commercial goal, a small site, a
 * warm palette and friendly lettering — and the site that then appears on the canvas (a
 * food business, two-tone, priced) is exactly that. Lovable's own demo answered "design
 * portfolio" and then built a meal-prep page; a demo whose summary contradicts its own
 * canvas teaches the room to distrust the summary.
 *
 * All four are PICKED options rather than typed text, so the summary prints real names and
 * the panel gets to show both of its drawn shapes — the radio rows and the palette grid.
 */
const THIN_ANSWERS: BriefAnswers = {
  goal: 'sell',
  pages: 'few',
  palette: 'warm-clay',
  type: 'friendly',
}
const THIN_CARD: Message = { id: 3, who: 'ai', kind: 'brief', text: BRIEF_STATUS }
const THIN_ACK: Message = { id: 4, who: 'ai', kind: 'ack', text: briefAck(THIN_ANSWERS) }
const THIN_DONE: Message = { id: 5, who: 'ai', text: briefDone(THIN_ANSWERS) }

export const FLOWS: Flow[] = [
  {
    id: 'thin-prompt',
    label: { en: 'Thin prompt → questions → first build', uk: 'Слабкий промпт → запитання → перша збірка' },
    note: {
      en: 'Nothing to build from, so Remixer asks first, then shows the PLAN it compiled and waits for Approve — that last step is ours, not Lovable\'s. The preview stays collapsed until the build starts.',
      uk: 'Будувати нема з чого: Remixer спершу питає, потім показує зібраний ПЛАН і чекає Approve — цей крок наш, не Lovable. Прев’ю згорнуте, доки не почнеться збірка.',
    },
    setup: { account: 'trial', trialDay: 1, credits: 2000, bonus: true, project: 'empty', chat: 'empty', sent: [], brief: EMPTY_BRIEF, domain: 'staging', inventory: 'none', unpublished: 0 },
    steps: [
      { id: 'typed', label: { en: '"Build me a website." is sent — Remixer thinks', uk: 'Надіслано «Build me a website.» — Remixer думає' },
        patch: { sent: [THIN_PROMPT], chat: 'working', brief: EMPTY_BRIEF }, ms: 5200,
        note: { en: 'Preview collapsed: nothing to show yet, the chat owns the shell', uk: 'Прев’ю згорнуте: показувати нічого, чат займає весь шелл' } },
      { id: 'asks', label: { en: 'Instead of building, it asks for direction', uk: 'Замість збірки — просить напрямок' },
        patch: { sent: [THIN_PROMPT, THIN_ASK], chat: 'long', brief: { status: 'asking', step: 0, answers: {} } }, awaitUser: true,
        note: { en: 'The question panel docks above the composer; the composer becomes "Tell Remixer what to do instead…"', uk: 'Панель запитань стає над композером; композер — «Tell Remixer what to do instead…»' } },
      { id: 'q1', label: { en: 'Q1 — what the site is for', uk: 'В1 — для чого сайт' },
        patch: { brief: { status: 'asking', step: 1, answers: { goal: THIN_ANSWERS.goal } } }, ms: 1400 },
      { id: 'q2', label: { en: 'Q2 — how much there is to say', uk: 'В2 — скільки треба розповісти' },
        patch: { brief: { status: 'asking', step: 2, answers: { goal: THIN_ANSWERS.goal, pages: THIN_ANSWERS.pages } } }, ms: 1400 },
      { id: 'q3', label: { en: 'Q3 — a colour plate is picked from the grid', uk: 'В3 — обрано плитку кольорів' },
        patch: { brief: { status: 'asking', step: 3, answers: { goal: THIN_ANSWERS.goal, pages: THIN_ANSWERS.pages, palette: THIN_ANSWERS.palette } } }, ms: 1400 },
      { id: 'q4', label: { en: 'Q4 — lettering picked, ready to submit', uk: 'В4 — обрано шрифти, можна надсилати' },
        patch: { brief: { status: 'asking', step: 3, answers: THIN_ANSWERS } }, awaitUser: true,
        note: { en: '"Submit" is the user\'s decision — nothing is built until they press it', uk: '«Submit» — рішення користувача: до нього нічого не будується' } },
      { id: 'summary', label: { en: 'Answers compiled into a brief card', uk: 'Відповіді зібрано в картку брифу' },
        patch: { sent: [THIN_PROMPT, THIN_ASK, THIN_CARD], chat: 'working', brief: { status: 'planning', step: 3, answers: THIN_ANSWERS } }, ms: 2400 },
      { id: 'plan', label: { en: 'The PLAN is offered — nothing builds until Approve', uk: 'Показано ПЛАН — до Approve нічого не збирається' },
        patch: { sent: [THIN_PROMPT, THIN_ASK, THIN_CARD], chat: 'long', brief: { status: 'planning', step: 3, answers: THIN_ANSWERS } }, awaitUser: true,
        note: {
          en: 'Where Remixer parts ways with Lovable: the answers are compiled into a plan and the customer approves it. `Review` moves the document into the canvas at full size.',
          uk: 'Тут Remixer розходиться з Lovable: відповіді збираються в план, і клієнт його підтверджує. «Review» переносить документ у канвас на повний розмір.',
        } },
      { id: 'ack', label: { en: 'Approved — "Got it — …", the build starts, the preview opens', uk: 'Підтверджено — «Got it — …», збірка стартує, прев’ю відкривається' },
        patch: { sent: [THIN_PROMPT, THIN_ASK, THIN_CARD, THIN_ACK], chat: 'working', brief: { status: 'ready', step: 3, answers: THIN_ANSWERS }, project: 'generating' }, ms: 5600,
        note: { en: 'The glow is the only progress indicator — no skeleton, no dimming', uk: 'Свічення — єдиний індикатор прогресу: без скелетону й затемнення' } },
      { id: 'built', label: { en: 'First version is up', uk: 'Перша версія готова' },
        patch: { sent: [THIN_PROMPT, THIN_ASK, THIN_CARD, THIN_ACK, THIN_DONE], chat: 'long', brief: { status: 'ready', step: 3, answers: THIN_ANSWERS }, project: 'built', credits: 1990, unpublished: 1 }, awaitUser: true },
    ],
  },
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
