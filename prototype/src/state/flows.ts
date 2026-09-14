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

/*
 * ⚠️ EVERY STRING IN HERE IS READ OUT LOUD IN FRONT OF AN AUDIENCE.
 *
 * The console is opened in demos — product owners, and the room the CEO is in. Labels
 * and notes are printed on the narration strip under the running prototype, so they are
 * not team shorthand: they are the subtitles of the film.
 *
 * Three rules, each of them bought the hard way (14.09.2026):
 *
 *  · SAY WHAT THE VIEWER WILL SEE. A person who has never opened this prototype should
 *    read a note and know what is about to happen on screen. Our reasoning, our audit
 *    conclusions and our instructions to each other are not descriptions of a screen.
 *  · NO COMPETITOR NAMES AND NO INTERNAL VOCABULARY. "That step is ours, not Lovable's"
 *    and "the flow the CEO asked for" were both on screen in front of the room.
 *  · NOTHING THAT IS NOT TRUE OF THE PRODUCT TODAY. A flow narrating a screen that
 *    changed is worse than no flow, because it plays anyway and the room watches the
 *    mismatch. No invented price, no invented duration, and none of the jargon the
 *    product itself bans from primary paths (DNS, nameserver, records, certificate).
 */
export interface FlowStep {
  id: string
  /** Narratable: what is happening on screen right now, in plain product language. */
  label: Text
  patch?: Partial<World>
  /** Dwell before auto-advancing, in ms at speed 1. */
  ms?: number
  /** Stop here until the user actually does something. */
  awaitUser?: boolean
  /** The second line of the subtitle: what else the viewer can see in this beat. */
  note?: Text
}

export interface Flow {
  id: string
  label: Text
  /** The one-sentence description in the flow picker — what this flow shows, for a
   *  reader who has never seen the prototype. Not the argument for why we built it. */
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
const THIN_BUILD: Message = { id: 5, who: 'ai', kind: 'build', text: '' }
const THIN_DONE: Message = { id: 6, who: 'ai', text: briefDone(THIN_ANSWERS) }
/** The transcript at the point the outline card is up — every step from here uses it. */
const THIN_BUILDING = [THIN_PROMPT, THIN_ASK, THIN_CARD, THIN_ACK, THIN_BUILD]
const THIN_BRIEF_READY = { status: 'ready' as const, step: 3, answers: THIN_ANSWERS }

export const FLOWS: Flow[] = [
  {
    id: 'thin-prompt',
    label: { en: 'Thin prompt → questions → first build', uk: 'Слабкий промпт → запитання → перша збірка' },
    note: {
      en: 'Someone types "Build me a website." and nothing is built: Remixer asks four questions, writes a build plan from the answers and waits for Start Building. No site preview until the build begins.',
      uk: 'Людина пише «Build me a website.», і нічого не будується: Remixer ставить чотири запитання, складає з відповідей план збірки й чекає на Start Building. Прев’ю сайту немає, доки не почнеться збірка.',
    },
    setup: { account: 'trial', trialDay: 1, credits: 2000, bonus: true, project: 'empty', chat: 'empty', sent: [], brief: EMPTY_BRIEF, domain: 'staging', inventory: 'none', unpublished: 0 },
    steps: [
      { id: 'typed', label: { en: '"Build me a website." is sent — Remixer thinks', uk: 'Надіслано «Build me a website.» — Remixer думає' },
        patch: { sent: [THIN_PROMPT], chat: 'working', brief: EMPTY_BRIEF }, ms: 5200,
        note: { en: 'No site preview on screen: there is nothing to show yet, so the conversation fills the whole window', uk: 'Прев’ю сайту на екрані немає: показувати ще нічого, тож переписка займає все вікно' } },
      { id: 'asks', label: { en: 'Instead of building, it asks for direction', uk: 'Замість збірки — просить напрямок' },
        patch: { sent: [THIN_PROMPT, THIN_ASK], chat: 'long', brief: { status: 'asking', step: 0, answers: {} } }, awaitUser: true,
        note: { en: 'A panel of questions grows out of the message field, and the field itself stays live — typing into it drops the questions', uk: 'З поля введення виростає панель запитань, і саме поле лишається робочим — якщо писати в нього, запитання зникають' } },
      /* ⚠️ EACH OF THESE FOUR STEPS RECORDS AN ANSWER, SO THE PANEL HAS ALREADY MOVED ON
         BY THE TIME THE STRIP IS READ. `step: 1` is the SECOND question on screen. The
         labels used to be "Q1 … Q4" and pointed one question behind the panel every time
         — measured on the running flow, 14.09.2026 — so they now name the question the
         viewer is looking at, not the one just answered. */
      { id: 'q1', label: { en: 'The first answer is in — the panel moves on to how much there is to say', uk: 'Перша відповідь є — панель переходить до того, скільки треба розповісти' },
        patch: { brief: { status: 'asking', step: 1, answers: { goal: THIN_ANSWERS.goal } } }, ms: 1400,
        note: { en: 'Under every answer is the consequence of choosing it, and one carries a Recommended tag — the answer an unanswered question falls back to anyway', uk: 'Під кожною відповіддю — наслідок вибору, а на одній є позначка Recommended: саме на неї впаде пропущене запитання' } },
      { id: 'q2', label: { en: 'Answered — on to the colours, chosen from a grid of palettes', uk: 'Відповіли — далі кольори, які обирають із сітки палітр' },
        patch: { brief: { status: 'asking', step: 2, answers: { goal: THIN_ANSWERS.goal, pages: THIN_ANSWERS.pages } } }, ms: 1400,
        note: { en: 'The one question drawn as tiles rather than a list; the field under them takes a colour by name or a brand hex', uk: 'Єдине запитання, намальоване плитками, а не списком; поле під ними приймає колір за назвою або бренд-хекс' } },
      { id: 'q3', label: { en: 'Answered — on to the lettering, set in the actual typefaces', uk: 'Відповіли — далі шрифти, показані самими накресленнями' },
        patch: { brief: { status: 'asking', step: 3, answers: { goal: THIN_ANSWERS.goal, pages: THIN_ANSWERS.pages, palette: THIN_ANSWERS.palette } } }, ms: 1400 },
      { id: 'q4', label: { en: 'All four answered — Submit is the customer’s press', uk: 'Усі чотири відповіді є — Submit натискає клієнт' },
        patch: { brief: { status: 'asking', step: 3, answers: THIN_ANSWERS } }, awaitUser: true,
        note: { en: 'The questions are free. Nothing is generated and nothing is charged until Submit.', uk: 'Запитання безкоштовні. До Submit нічого не генерується і нічого не списується.' } },
      { id: 'summary', label: { en: 'The four answers come back as a card in the conversation', uk: 'Чотири відповіді повертаються карткою в переписці' },
        patch: { sent: [THIN_PROMPT, THIN_ASK, THIN_CARD], chat: 'working', brief: { status: 'planning', step: 3, answers: THIN_ANSWERS } }, ms: 2400,
        note: { en: 'Goal, pages, colours, lettering — and anything left to Remixer says so instead of pretending it was chosen', uk: 'Мета, сторінки, кольори, шрифти — а те, що лишили на розсуд Remixer, так і підписано, а не видається за вибір клієнта' } },
      { id: 'plan', label: { en: 'A build plan appears — nothing is generated until Start Building', uk: 'З’являється план збірки — до Start Building нічого не генерується' },
        patch: { sent: [THIN_PROMPT, THIN_ASK, THIN_CARD], chat: 'long', brief: { status: 'planning', step: 3, answers: THIN_ANSWERS } }, awaitUser: true,
        note: {
          en: 'The plan is written from the answers, and the customer can edit it in place. "Review" opens the same document full size beside the conversation.',
          uk: 'План складено з відповідей, і клієнт може правити його просто в тексті. «Review» відкриває той самий документ на повний розмір поруч із перепискою.',
        } },
      { id: 'ack', label: { en: 'Start Building pressed — "Got it — …" and the work starts', uk: 'Натиснуто Start Building — «Got it — …», починається робота' },
        patch: { sent: [THIN_PROMPT, THIN_ASK, THIN_CARD, THIN_ACK], chat: 'working', brief: THIN_BRIEF_READY, project: 'generating' }, ms: 2200,
        note: {
          en: 'Still no site preview: this pass builds the home page, and the preview is a preview OF that page — it arrives when the page does',
          uk: 'Прев’ю сайту й далі немає: цей прохід збирає головну, а прев’ю — це прев’ю САМЕ цієї сторінки, тож воно з’явиться разом з нею',
        } },
      /*
       * The generation, in four beats instead of its real minute.
       *
       * A scripted flow is for showing the SHAPE of a thing to a room — the real clock
       * (build.ts) is one click away from the Home page for anyone who wants to sit
       * through it. What must survive the compression is the shape itself: the whole
       * site outlined, one section in hand at a time, and the canvas empty until the
       * page it previews actually exists.
       */
      { id: 'outline', label: { en: 'The whole site is listed — the home page first', uk: 'Перелічено весь сайт — спершу головна' },
        patch: { sent: THIN_BUILDING, chat: 'working', brief: THIN_BRIEF_READY, project: 'generating', build: { at: 0, line: 0 } }, ms: 2600,
        note: {
          en: 'Only the home page is built this pass. About, Services and Contact are named underneath it and visibly waiting.',
          uk: 'Цього проходу збирається лише головна. About, Services і Contact названі під нею і видимо чекають.',
        } },
      { id: 'sections', label: { en: 'Section by section, each one named as it is written', uk: 'Секція за секцією, кожна названа, доки її пишуть' },
        patch: { sent: THIN_BUILDING, chat: 'working', brief: THIN_BRIEF_READY, project: 'generating', build: { at: 2, line: 1 } }, ms: 2600,
        note: {
          en: 'Finished above, in hand in the middle with a line saying what is happening to it, queued below',
          uk: 'Готове вище, у роботі — посередині, з рядком про те, що саме відбувається; у черзі — нижче',
        } },
      { id: 'assembling', label: { en: 'Every section done — the page is put together', uk: 'Усі секції готові — сторінка збирається' },
        patch: { sent: THIN_BUILDING, chat: 'working', brief: THIN_BRIEF_READY, project: 'generating', build: { at: 5, line: 0 } }, ms: 2200 },
      { id: 'built', label: { en: 'The home page appears, and the preview opens with it', uk: 'З’являється головна, і разом з нею відкривається прев’ю' },
        patch: { sent: [...THIN_BUILDING, THIN_DONE], chat: 'long', brief: THIN_BRIEF_READY, project: 'built', build: { at: 5, line: 0 }, credits: 1990, unpublished: 1 }, awaitUser: true,
        note: {
          en: 'The list stays in the conversation as the record of what was built and which pages were not. Ten credits for the build; the questions cost nothing.',
          uk: 'Перелік лишається в переписці як запис про те, що зібрано і які сторінки — ні. Десять кредитів за збірку; запитання не коштували нічого.',
        } },
    ],
  },
  /*
   * ITERATION 1 SHIPS TWO DOMAIN PATHS — attach a name already in the DreamHost account,
   * and buy a new one — so the finished one leads. The third (a name held at another
   * company) is iteration 2 and sits at the bottom of the list, marked in the first words
   * of its own note — the console renders a flow as label + note and has no "coming
   * later" affordance of its own, so the note is the only place this file can say it.
   */
  {
    id: 'connect-dreamhost',
    label: { en: 'Connect a domain already on DreamHost', uk: 'Підключити домен, який уже на DreamHost' },
    note: {
      en: 'The customer picks a name already sitting in their DreamHost account: nothing to paste, nothing to change at another company, no second tab. Remixer sets it up on its own side and the address in the topbar changes over.',
      uk: 'Клієнт обирає ім’я, яке вже є в його акаунті DreamHost: нічого не треба вставляти, нічого не треба міняти в іншій компанії, жодної другої вкладки. Remixer усе налаштовує на своєму боці, і адреса у верхній панелі змінюється.',
    },
    /* `published: true` is not decoration: a domain cannot be live in front of a site
       nobody ever published (world.violations), and without it the console showed the
       room a red contradiction under "On screen now" at the end of the flow. The site
       here is one that has been out on its free address and is now getting its own name. */
    setup: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'staging', unpublished: 0, published: true },
    steps: [
      { id: 'open', label: { en: 'The Domains screen — their own names on the left, names for sale on the right', uk: 'Екран Domains — ліворуч власні імена, праворуч імена на продаж' }, patch: { domain: 'searching' }, awaitUser: true,
        note: { en: 'Opened from the Publish panel, "Buy or connect a domain". A name they already own carries Connect and no price — attaching it costs nothing.', uk: 'Відкривається з панелі Publish — «Buy or connect a domain». У власного імені кнопка Connect і жодної ціни: підключення нічого не коштує.' } },
      { id: 'pick', label: { en: 'A name from their own account is chosen', uk: 'Обрано ім’я з власного акаунта' }, ms: 700,
        note: { en: 'The confirmation says it plainly: it is already in the DreamHost account, so there is nothing to change anywhere else', uk: 'Підтвердження каже прямо: ім’я вже в акаунті DreamHost, тож більше ніде нічого міняти не треба' } },
      { id: 'connect', label: { en: 'Connecting — Remixer sets it up on its own side', uk: 'Підключення — Remixer усе налаштовує на своєму боці' }, patch: { domain: 'connecting' }, ms: 1600,
        note: { en: 'Nothing is asked of the customer, and the site stays reachable on its free address throughout. The dot beside the address turns amber.', uk: 'Від клієнта нічого не потрібно, і сайт увесь цей час доступний за безкоштовною адресою. Крапка біля адреси стає бурштиновою.' } },
      { id: 'ssl', label: { en: 'The secure padlock is switching on', uk: 'Вмикається захисний замок' }, patch: { domain: 'verifying' }, ms: 1800,
        note: { en: 'The last wait, and it can only begin once the address already answers here', uk: 'Останнє очікування, і воно починається лише тоді, коли адреса вже відповідає тут' } },
      { id: 'live', label: { en: 'The site answers on the customer’s own address', uk: 'Сайт відповідає за власною адресою клієнта' }, patch: { domain: 'live' }, ms: 900,
        note: { en: 'The topbar now shows their own name with a green dot, and the panel says the padlock is on and anyone can visit', uk: 'У верхній панелі тепер їхнє власне ім’я із зеленою крапкою, а панель каже, що замок увімкнено і сайт доступний усім' } },
      { id: 'done', label: { en: 'Done — one screen, nothing to paste, no second tab', uk: 'Готово — один екран, нічого вставляти, жодної другої вкладки' }, awaitUser: true,
        note: {
          en: 'That is the whole advantage of a name already with DreamHost: no settings to move at another company, and nobody else to wait on. How long the rest of the internet takes to catch up is not ours to promise.',
          uk: 'У цьому вся перевага імені, яке вже в DreamHost: жодних налаштувань не треба міняти в іншій компанії й нікого не треба чекати. А скільки решта інтернету наздоганятиме — не наша обіцянка.',
        } },
    ],
  },
  {
    id: 'trial-to-paid',
    label: { en: 'Trial expires → buying a plan', uk: 'Тріал завершився → купівля плану' },
    note: {
      en: 'The last days of the free trial: the credits run out, editing with AI switches off, and the site itself stays exactly where it was. Buying the Remixer Build plan turns AI back on.',
      uk: 'Останні дні безкоштовного тріалу: кредити закінчуються, редагування з AI вимикається, а сам сайт лишається на місці. Купівля плану Remixer Build знову вмикає AI.',
    },
    setup: { account: 'trial', trialDay: 29, credits: 40, project: 'built', chat: 'long', domain: 'staging', inventory: 'dh-free', unpublished: 2 },
    steps: [
      { id: 'low', label: { en: 'The credits run down — the count in the topbar reaches ten', uk: 'Кредити добігають кінця — лічильник у верхній панелі показує десять' }, patch: { credits: 10 }, ms: 1600,
        note: { en: 'The balance is on screen the whole time, next to Publish — it is never a page you have to go and find', uk: 'Баланс увесь час на екрані, поруч із Publish — по нього ніколи не треба кудись іти' } },
      { id: 'expired', label: { en: 'Day 30 — AI is off; the site and hand editing are not', uk: 'День 30 — AI вимкнено; сайт і ручні правки — ні' }, patch: { account: 'trial-expired', credits: 0, trialDay: 30 }, ms: 2400,
        note: { en: 'The message field now reads "AI is off — a plan is required" and the count is zero. The site is untouched: nothing was taken away, and it can still be edited by hand.', uk: 'У полі введення тепер «AI is off — a plan is required», а лічильник на нулі. Сайт неторканий: нічого не забрали, і його й далі можна правити руками.' } },
      { id: 'gate', label: { en: 'What is needed is named in plain words: Remixer Build, $9.99 a month', uk: 'Потрібне названо прямо: Remixer Build, $9.99 на місяць' }, awaitUser: true,
        note: { en: 'It is said at every door the expired trial now closes — under the domain row in the Publish panel, and inside the checkout sheet, which folds the plan chooser in', uk: 'Це сказано в кожних дверях, які тепер зачинив тріал: під рядком про домен у панелі Publish і в аркуші оплати, що розгортає вибір плану' } },
      { id: 'checkout', label: { en: 'Checkout — yearly or monthly', uk: 'Оплата — річний або щомісячний' }, ms: 1400 },
      { id: 'paid', label: { en: 'The plan is active and the month’s credits are in the topbar', uk: 'План активний, місячні кредити — у верхній панелі' }, patch: { account: 'paid', billing: 'yearly', credits: 1000 }, ms: 1200 },
      { id: 'done', label: { en: 'Back in the builder — AI available again', uk: 'Повернулись у білдер — AI знову доступний' }, awaitUser: true,
        note: { en: 'Nothing was lost on the way through: the same site, the same conversation, the message field working again', uk: 'Дорогою нічого не загубилося: той самий сайт, та сама переписка, поле введення знову працює' } },
    ],
  },
  {
    id: 'publish',
    label: { en: 'Publishing changes', uk: 'Публікація змін' },
    note: {
      en: 'A site that is already live, with four edits visitors have not seen yet. The Publish panel shows the address and the number waiting; one press sends them out. Publishing spends no credits.',
      uk: 'Сайт, який уже живий, і чотири правки, яких відвідувачі ще не бачили. Панель Publish показує адресу і скільки їх у черзі; одне натискання — і вони виходять. Публікація не витрачає кредитів.',
    },
    /* Live in front of a site that was never published is a contradiction the console
       flags in red (world.violations) — this flow is about a site that IS out. */
    setup: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'live', unpublished: 4, published: true },
    steps: [
      { id: 'panel', label: { en: 'The Publish panel is open over the builder', uk: 'Над білдером відкрито панель Publish' }, awaitUser: true,
        note: { en: 'Opened from Update in the topbar, which carries the number of waiting edits. The panel shows the address the site answers on and the same number again.', uk: 'Відкривається кнопкою Update у верхній панелі, на якій стоїть кількість правок у черзі. У панелі — адреса, за якою відповідає сайт, і те саме число.' } },
      { id: 'publishing', label: { en: 'Publish pressed — the waiting edits go out to visitors', uk: 'Натиснуто Publish — правки з черги виходять до відвідувачів' }, ms: 2600,
        note: { en: 'Nothing is blocked: the panel stays open and the builder underneath it keeps working', uk: 'Нічого не блокується: панель лишається відкритою, а білдер під нею працює далі' } },
      { id: 'done', label: { en: 'Published — nothing pending', uk: 'Опубліковано — черги немає' }, patch: { unpublished: 0 }, awaitUser: true,
        note: { en: 'The number is gone from the topbar and the address keeps its green Live tag. The balance has not moved: publishing costs nothing.', uk: 'Число зникло з верхньої панелі, а адреса лишається із зеленою позначкою Live. Баланс не змінився: публікація нічого не коштує.' } },
    ],
  },
  /*
   * ITERATION 2, AND LAST IN THE LIST FOR THAT REASON.
   *
   * The screens exist but the path is unfinished: the instructions are written for one
   * company only and the first of the two lines is still a raw address. Nobody should
   * start it expecting a finished path, so the note says so in its first words — the
   * console has no other way to mark a flow today.
   */
  {
    id: 'connect-external',
    label: { en: 'Connect a domain registered at another company (GoDaddy)', uk: 'Підключити домен, зареєстрований в іншій компанії (GoDaddy)' },
    note: {
      en: 'Iteration 2, unfinished — not part of today’s demo. A name registered elsewhere stays registered there; we never ask for a transfer. The customer copies two lines into the other company’s settings and comes back.',
      uk: 'Ітерація 2, не завершено — сьогодні не показуємо. Ім’я, зареєстроване в іншій компанії, там і лишається: переносити не просимо. Клієнт копіює два рядки в налаштування тієї компанії й повертається.',
    },
    /* The name is the one the data holds at GoDaddy, so the panel, the topbar chip and
       this narration all say the same domain even when the flow is stepped through
       without touching the screens. And `published: true` for the reason the two flows
       above carry it: a live domain in front of an unpublished site is a contradiction. */
    setup: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'external-manual', domain: 'staging', unpublished: 0, published: true, customDomain: 'trulieve.com' },
    steps: [
      { id: 'open', label: { en: 'The Domains screen — the customer types a name they already own', uk: 'Екран Domains — клієнт вводить ім’я, яким уже володіє' }, patch: { domain: 'searching' }, awaitUser: true,
        note: { en: 'Opened from the Publish panel, "Buy or connect a domain". With no DreamHost names in the account there is no list of their own to pick from, so the search field is the only way in.', uk: 'Відкривається з панелі Publish — «Buy or connect a domain». Якщо в акаунті немає імен DreamHost, власного списку для вибору теж немає, тож єдиний вхід — поле пошуку.' } },
      { id: 'typed', label: { en: 'The name comes back taken, and names the company it is registered at', uk: 'Ім’я повертається зайнятим і називає компанію, де воно зареєстроване' }, ms: 1400,
        note: { en: 'A taken name carries no price and no Buy — the only thing offered on it is "This is my domain"', uk: 'У зайнятого імені немає ні ціни, ні кнопки Buy — пропонується лише «This is my domain»' } },
      { id: 'detected', label: { en: 'Confirmed: it stays where it is registered, no transfer needed', uk: 'Підтверджено: ім’я лишається там, де зареєстроване, переносити не треба' }, ms: 1400,
        note: { en: 'The screen names the other company only when it actually knows it, and says nothing about it when it does not', uk: 'Екран називає іншу компанію лише тоді, коли справді її знає, і мовчить, коли не знає' } },
      { id: 'records', label: { en: 'Two lines to paste at the other company, a Copy button on each', uk: 'Два рядки, які треба вставити в іншій компанії, з кнопкою Copy біля кожного' }, awaitUser: true,
        note: { en: 'The steps are on the screen rather than behind a link. Unfinished here: they are written for one company only, and the first line is still a raw address.', uk: 'Кроки — на екрані, а не за посиланням. Тут не завершено: вони написані лише під одну компанію, а перший рядок — це досі сира адреса.' } },
      { id: 'saved', label: { en: 'Saved — the domain is now connecting', uk: 'Збережено — домен підключається' }, patch: { domain: 'connecting' }, ms: 3400,
        note: { en: 'It persists: the customer can close the tab and this carries on without them. The wait is longer than for a name already at DreamHost, because the change has to travel from the other company.', uk: 'Це зберігається: можна закрити вкладку — і все триває без них. Очікування довше, ніж для імені, яке вже в DreamHost: зміна має пройти шлях від іншої компанії.' } },
      { id: 'verifying', label: { en: 'The address answers here — the secure padlock switches on', uk: 'Адреса вже відповідає тут — вмикається захисний замок' }, patch: { domain: 'verifying' }, ms: 2600 },
      { id: 'live', label: { en: 'The site answers on the customer’s own address', uk: 'Сайт відповідає за власною адресою клієнта' }, patch: { domain: 'live' }, ms: 1200 },
      { id: 'done', label: { en: 'Done — the name never left the other company', uk: 'Готово — ім’я нікуди не переїжджало' }, awaitUser: true,
        note: { en: 'Only where it points has changed. Nothing was transferred and nothing was bought.', uk: 'Змінилося лише те, куди воно вказує. Нічого не переносили і нічого не купували.' } },
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
