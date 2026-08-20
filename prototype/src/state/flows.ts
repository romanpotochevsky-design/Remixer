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
      { id: 'verifying', label: { en: 'Records found — the address answers here now', uk: 'Записи знайдено — адреса вже відповідає в нас' }, patch: { domain: 'verifying' }, ms: 2200,
        note: { en: 'Compressed the hardest on this path: on an external registrar this step queues behind the DNS change (FACTS DH-203), which is measured in days, not seconds. Never demo this as instant.', uk: 'Найсильніше стиснутий крок цього шляху: у зовнішнього реєстратора він чекає на зміну DNS (FACTS DH-203), а це доба, не секунди. Не показувати це як миттєвість.' } },
      { id: 'securing', label: { en: 'Almost there — turning on the padlock', uk: 'Майже готово — увімкнюємо замочок' }, patch: { domain: 'securing' }, ms: 2400,
        note: { en: 'Its own state, not a label: the certificate cannot be issued until the address already answers here (FACTS DH-301), so this wait starts only now — and on this path it stood behind DH-203 first. The screen shows no button on purpose. Compressed to seconds; the copy still says ten to thirty minutes, because that is what a real person waits.', uk: 'Це окремий стан, а не підпис: сертифікат неможливо видати, поки адреса не почала відповідати в нас (FACTS DH-301), тож це очікування починається лише тепер — а на цьому шляху перед ним стояв ще й DH-203. Кнопки на екрані немає навмисно. Стиснуто до секунд; у копірайті лишається «від десяти до тридцяти хвилин», бо саме стільки чекає справжня людина.' } },
      { id: 'live', label: { en: 'Domain is live, padlock on', uk: 'Домен живий, замочок увімкнено' }, patch: { domain: 'live' }, ms: 1200 },
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
      { id: 'ssl', label: { en: 'Almost there — turning on the padlock', uk: 'Майже готово — увімкнюємо замочок' }, patch: { domain: 'securing' }, ms: 2000,
        note: { en: 'Compressed hard: this wait is 10–30 min (FACTS DH-301), not two seconds. `securing` is now a real state, so the checklist ticks “Connected to your site” here and holds “Security (SSL) on” until the next step — the gap this state exists to show.', uk: 'Сильно стиснуто: це очікування — 10–30 хв (FACTS DH-301), а не дві секунди. `securing` тепер справжній стан, тому чекліст закриває «Connected to your site» саме тут, а «Security (SSL) on» тримає до наступного кроку — це й є розрив, заради якого стан існує.' } },
      { id: 'live', label: { en: 'Live — and nothing was typed anywhere else', uk: 'Живий — і ніде більше нічого не вводили' }, patch: { domain: 'live' }, ms: 900,
        note: { en: 'Do not say “instantly secured”: the minute buys the address, the padlock lands behind it (FACTS DH-301).', uk: 'Не казати «миттєво захищено»: хвилина дає адресу, замочок приходить після неї (FACTS DH-301).' } },
      { id: 'done', label: { en: 'Success', uk: 'Успіх' }, awaitUser: true },
    ],
  },
  {
    /*
     * The purchase path — the one anyone asks for first, and the one this file was
     * missing: `connect-external` and `connect-dreamhost` both start from a domain the
     * person already has. Added 20 Aug 2026.
     *
     * It is also our strongest story, and for a structural reason rather than a tonal
     * one: a domain bought through us lands in our own account, so there is no second
     * tab, no records to paste and nothing to verify (FACTS DH-213). That makes it
     * variant A of `connecting` — `in-account`, the ONLY variant COPY-RULES §5 permits
     * to say "a few minutes", because we write the change ourselves (DH-218) and our own
     * record lifetime is minutes (DH-217).
     *
     * The padlock is still the last thing to arrive (DH-301), which is why `securing`
     * has its own step here too. Compressed to seconds; the strings stay truthful.
     */
    id: 'buy-and-golive',
    label: { en: 'Buy a new domain → live site', uk: 'Купівля нового домену → живий сайт' },
    note: { en: 'The fast path, and the only one where the whole address change happens on our side (FACTS DH-213, DH-218). Publishing is NOT narrated as free here — it consumes credits today (DH-008); POSITIONING §1 argues it should not, which is an argument, not the product.', uk: 'Швидкий шлях і єдиний, де вся зміна адреси відбувається на нашому боці (FACTS DH-213, DH-218). Публікація тут НЕ подається як безкоштовна — сьогодні вона витрачає кредити (DH-008); POSITIONING §1 доводить, що не повинна, але це аргумент, а не продукт.' },
    setup: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'none', domain: 'staging', unpublished: 0 },
    steps: [
      { id: 'open', label: { en: 'Domains screen — AI name ideas are already there', uk: 'Екран доменів — ідеї назв від AI вже на місці' }, patch: { domain: 'searching' }, awaitUser: true,
        note: { en: 'The suggestions ARE the empty state, not a third path — nobody is asked to think of a name in front of a blank field. Inventory is `none`, so "Existing domains" is genuinely empty and the only road is search → buy → connect.', uk: 'Підсказки — це і є порожній стан, а не третій шлях: ніхто не мусить вигадувати назву перед пустим полем. Вісь inventory — `none`, тому «Existing domains» справді порожній, і єдина дорога — пошук → купівля → підключення.' } },
      { id: 'searched', label: { en: 'Name searched — the exact match on top, then other endings', uk: 'Назву знайдено — точний збіг зверху, далі інші закінчення' }, ms: 900,
        note: { en: 'Order is the argument: the classic registrar answer first (the name they typed), AI-generated OTHER names second. Each AI row carries the reason it was picked — per-name rationales are rare in the field and that gap is ours to take.', uk: 'Порядок і є арґументом: спершу класична відповідь реєстратора (та назва, яку ввели), і лише потім ІНШІ назви від AI. Кожен AI-рядок несе причину вибору — пояснення до кожної назви в полі майже ніхто не дає, і ця прогалина наша.' } },
      { id: 'picked', label: { en: 'A name is chosen', uk: 'Назву обрано' }, awaitUser: true,
        note: { en: 'A real decision — the flow stops. Nothing auto-connects on a stray click: every row routes through a confirm.', uk: 'Справжнє рішення — флоу зупиняється. Жодного авто-підключення випадковим кліком: кожен рядок веде через підтвердження.' } },
      { id: 'sheet', label: { en: 'Checkout sheet — first year and renewal, both visible', uk: 'Шит оплати — і перший рік, і продовження на екрані' }, patch: { domain: 'checkout' }, awaitUser: true,
        note: { en: 'The paywall is disclosed HERE, inside the sheet, not as a wall in front of browsing — searching a name is free. Both figures always shown (TLD_PRICES): hiding the renewal price is the dark pattern the audit names by name.', uk: 'Пейвол розкривається САМЕ ТУТ, у шиті, а не стіною перед усім переглядом — шукати назву безкоштовно. Обидві цифри показуємо завжди (TLD_PRICES): приховати ціну продовження — це і є той dark pattern, який аудит називає прямо.' } },
      { id: 'bought', label: { en: 'Domain bought — it lands in the DreamHost account', uk: 'Домен куплено — він одразу в акаунті DreamHost' }, patch: { inventory: 'dh-free' }, ms: 1400,
        note: { en: 'The structural moment: because the domain is ours, the inventory axis flips to `dh-free` and every external step of the other two flows simply does not exist — no second tab, no records, nothing to verify (FACTS DH-213).', uk: 'Структурний момент: домен наш, тому вісь inventory стає `dh-free`, і всі зовнішні кроки двох інших флоу просто зникають — жодної другої вкладки, жодних записів, нічого підтверджувати (FACTS DH-213).' } },
      { id: 'connecting', label: { en: 'Connecting — we write the change on our own side', uk: 'Підключення — зміну пишемо на своєму боці' }, patch: { domain: 'connecting' }, ms: 1600,
        note: { en: 'Variant A, `in-account`: the change is ours to make (DH-218) and our own record lifetime is minutes (DH-217), so this is the one path allowed to say "usually a few minutes". Do not lift that string onto the other two flows — it is untrue on both (FACTS §2.16).', uk: 'Варіант A, `in-account`: зміну робимо ми (DH-218), а власний час життя запису в нас — хвилини (DH-217), тому лише цей шлях має право казати «зазвичай кілька хвилин». Не переносити цей рядок на два інші флоу — там він неправда (FACTS §2.16).' } },
      { id: 'securing', label: { en: 'Almost there — turning on the padlock', uk: 'Майже готово — увімкнюємо замочок' }, patch: { domain: 'securing' }, ms: 2000,
        note: { en: 'Even on the fastest path the padlock is last: the certificate cannot be issued until the address already answers here (DH-301). The screen shows no button — nothing is required of the person, and that absence is the message. Compressed to seconds for the demo; the copy still says ten to thirty minutes, because that is the real wait.', uk: 'Навіть на найшвидшому шляху замочок приходить останнім: сертифікат не видати, поки адреса не почала відповідати в нас (DH-301). Кнопки на екрані немає — від людини нічого не потрібно, і саме ця відсутність і є повідомленням. Для демо стиснуто до секунд; у копірайті лишається «від десяти до тридцяти хвилин», бо це справжнє очікування.' } },
      { id: 'live', label: { en: 'Live on their own address, padlock on', uk: 'Живий на власній адресі, замочок увімкнено' }, patch: { domain: 'live' }, ms: 900 },
      { id: 'done', label: { en: 'Success — and the screen pushes them to share it', uk: 'Успіх — і екран штовхає поділитися' }, awaitUser: true,
        note: { en: 'Success copy sells distribution rather than merely confirming, and the most valuable slot holds a live button (Visit site) instead of a disabled one. Not drawn: there is no share sheet — the step narrates the intent, not a screen.', uk: 'Копірайт успіху продає поширення, а не просто підтверджує, і в найдорожчому слоті стоїть жива кнопка (Visit site), а не задизейблена. Не намальовано: шита поширення немає — крок описує намір, а не екран.' } },
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
