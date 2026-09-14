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
import type { DomainModalKind, DomainScreen, PanelPage, Surface } from './ui'
import { useUI } from './ui'
import { termYears, tldOf } from '../data/cart'
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

/**
 * WHERE THE CAMERA POINTS for a step — the half of "what is on screen" the world does
 * not carry.
 *
 * A flow used to be able to move the WORLD only (`useWorld.set`), and navigation lives in
 * a different store on purpose (state/ui.ts: the world is product truth, this is merely
 * where the camera points). So a step whose subtitle read "The Domains screen — their own
 * names on the left" played with the site preview still filling the canvas, and the room
 * read a description of a screen nobody could see (14.09.2026).
 *
 * The fields are the ui store's own names rather than invented place-words, so a step is
 * greppable against the actions the product itself calls. Each is optional and each is
 * applied ONLY when present: a step that says nothing about the camera leaves it exactly
 * where the step before put it, which is what makes a five-beat walk through one screen
 * name that screen once.
 *
 * ⚠️ IT SAYS WHAT THE STEP NEEDS, NOT WHAT THE PRODUCT ALREADY DOES. Several surfaces open
 * themselves off the world — the canvas collapses through a brief and a build and opens on
 * the page it is a preview of (App.tsx), the connect clock raises the Publish panel
 * (modules/domains/connect.ts) — and a flow that re-stated those would be a second opinion
 * about the same thing. What a flow has to add is only what nobody else does: a flow patches
 * the domain axis straight, so nothing is calling the clock, and nothing opens the panel the
 * next four subtitles describe.
 */
export interface FlowView {
  /** Which module fills the canvas. `'domains'` is implied by `domainScreen`. */
  surface?: Surface
  /** Which screen inside the domains window. */
  domainScreen?: DomainScreen
  /** The name that screen — or the sheet below — is acting on. */
  domain?: string
  /** The checkout sheet over the whole app; `null` takes it down. */
  modal?: DomainModalKind | null
  /** A page outside Remixer over the whole window; `null` comes back. */
  panel?: PanelPage | null
  /** The Publish panel over the builder. */
  publish?: boolean
  /**
   * Is the canvas on screen at all? Only ever needed to take it AWAY — asking for a
   * surface brings it back on its own (see applyView).
   *
   * The product writes this one imperatively rather than deriving it: the canvas collapses
   * off the world through a brief, a plan and a build (App.tsx), but the very first prompt
   * lands in none of those states — it is a sent message against an empty project — and in
   * the product the send itself closes the canvas on its way out of the Home page
   * (modules/chat/send.ts). A flow does not go through that door, so it says so here.
   */
  preview?: boolean
}

export interface FlowStep {
  id: string
  /** Narratable: what is happening on screen right now, in plain product language. */
  label: Text
  patch?: Partial<World>
  /** Which screen this beat needs open. See FlowView — absent means "leave it alone". */
  view?: FlowView
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
  /**
   * Set when the walk behind this flow is deliberately unfinished. Drawn ON the row,
   * before anybody clicks: the console can afford to disappoint a designer who knows
   * what is half-built, but not a product owner who does not.
   *
   * The same field, the same words and the same dashed treatment as `Preset.tag` in
   * state/scenarios.ts — the two lists sit one above the other in one panel, and two
   * phrasings for one status would read as two tools stapled together.
   */
  tag?: Text
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

/*
 * THE THREE NAMES THE DOMAIN WALKS USE, AND WHY EACH IS THE ONE IT IS.
 *
 * Every one of them comes out of data/domains.ts rather than out of a sentence in here,
 * because that file is where the answers are decided: which names are already registered
 * and by whom (`TAKEN_DOMAINS`), which are kept buyable whatever availability rule lands
 * next (`DEMO_NAMES`), and which endings can be priced at all (`TLD_PRICES` — ten verified,
 * and an eleventh would be an invented number under a real name). Pick a name this file
 * likes and the screens do the rest; pick one it does not and the walk plays against a
 * screen that disagrees with the subtitle.
 */
/** The attach walk's name: the first row of the DreamHost inventory the dashboard lists. */
const DH_OWNED = 'fit-ration.com'
/** The buy walk's first try. Registered — one of the handful the data answers "taken" for,
 *  and a plain one-word `.com` is the try every room recognises. */
const BUY_TAKEN = 'coffee.com'
/** …and the name they settle on. In `DEMO_NAMES`, so it stays buyable, and its ending is
 *  one of the ten with a verified first-year AND renewal figure — which is what lets the
 *  cards below quote both without this file ever naming a number. */
const BUY_NAME = 'emberandoak.com'
/** The iteration-2 walk's name: registered, and registered at the company that walk is
 *  named after — so the taken card, the records screen and the topbar chip agree. */
const EXTERNAL_NAME = 'trulieve.com'

export const FLOWS: Flow[] = [
  {
    id: 'thin-prompt',
    label: { en: 'Thin prompt → questions → first build', uk: 'Слабкий промпт → запитання → перша збірка' },
    note: {
      en: 'Someone types "Build me a website." and nothing is built: Remixer asks four questions, writes a build plan from the answers and waits for Start Building. No site preview until the build begins.',
      uk: 'Людина пише «Build me a website.», і нічого не будується: Remixer ставить чотири запитання, складає з відповідей план збірки й чекає на Start Building. Прев’ю сайту немає, доки не почнеться збірка.',
    },
    /* A setup is a PATCH over whatever the last flow left behind, not a fresh world, so the
       axes another flow moves have to be named here even when they are the default —
       `published`, `icann` and the cart all belong to walks below this one, and an empty
       project inheriting any of them is a contradiction the console prints in red. */
    setup: { account: 'trial', trialDay: 1, credits: 2000, bonus: true, project: 'empty', chat: 'empty', sent: [], brief: EMPTY_BRIEF, domain: 'staging', inventory: 'none', unpublished: 0, published: false, icann: false, cart: [] },
    steps: [
      /* The one beat in the prototype where the canvas has to be told to go: the world here
         is "a message against an empty project", which none of the canvas's own rules cover
         — see FlowView.preview. Everything after this is covered (an open brief, a plan and
         a running build all collapse it; the finished page opens it). */
      { id: 'typed', label: { en: '"Build me a website." is sent — Remixer thinks', uk: 'Надіслано «Build me a website.» — Remixer думає' },
        patch: { sent: [THIN_PROMPT], chat: 'working', brief: EMPTY_BRIEF }, view: { preview: false }, ms: 5200,
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
   * and buy a new one — so the two of them run together, in that order, ahead of
   * everything else. They are one product promise in two lengths: attaching is ours to
   * write and takes one wait, buying has to be registered and then wait for the world, so
   * it is twice the walk (modules/domains/connect.ts). Showing only the short one would
   * teach the room a speed the bought path cannot keep.
   *
   * The third (a name held at another company) is iteration 2, sits at the bottom of the
   * list and carries `tag` — the console draws that on the row, before the click.
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
    setup: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'staging', customDomain: DH_OWNED, icann: false, unpublished: 0, published: true, cart: [] },
    steps: [
      { id: 'open', label: { en: 'The Domains screen — their own names on the left, names for sale on the right', uk: 'Екран Domains — ліворуч власні імена, праворуч імена на продаж' },
        patch: { domain: 'searching' }, view: { surface: 'domains', domainScreen: 'home' }, awaitUser: true,
        note: { en: 'Opened from the Publish panel, "Buy or connect a domain". A name they already own carries Connect and no price — attaching it costs nothing.', uk: 'Відкривається з панелі Publish — «Buy or connect a domain». У власного імені кнопка Connect і жодної ціни: підключення нічого не коштує.' } },
      /* The sheet this opens is the one the Connect button above opens, on the name the
         board's own list leads with — so a presenter who presses it for real and a
         presenter who presses Continue are looking at the same screen. */
      { id: 'pick', label: { en: 'A name from their own account is chosen', uk: 'Обрано ім’я з власного акаунта' },
        view: { modal: 'connect-owned', domain: DH_OWNED }, ms: 2800,
        note: { en: 'The confirmation says it plainly: it is already in the DreamHost account, so there is nothing to change anywhere else', uk: 'Підтвердження каже прямо: ім’я вже в акаунті DreamHost, тож більше ніде нічого міняти не треба' } },
      { id: 'connect', label: { en: 'Connecting — Remixer sets it up on its own side', uk: 'Підключення — Remixer усе налаштовує на своєму боці' },
        patch: { domain: 'connecting' }, view: { surface: 'preview', modal: null, publish: true }, ms: 2600,
        note: { en: 'Nothing is asked of the customer, and the site stays reachable on its free address throughout. The dot beside the address turns amber.', uk: 'Від клієнта нічого не потрібно, і сайт увесь цей час доступний за безкоштовною адресою. Крапка біля адреси стає бурштиновою.' } },
      { id: 'ssl', label: { en: 'The secure padlock is switching on', uk: 'Вмикається захисний замок' }, patch: { domain: 'verifying' }, ms: 2200,
        note: { en: 'The last wait, and it can only begin once the address answers here. Nothing is asked of the customer.', uk: 'Останнє очікування, і воно починається лише тоді, коли адреса вже відповідає тут. Від клієнта нічого не потрібно.' } },
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
    id: 'buy-domain',
    label: { en: 'Buy a new domain', uk: 'Купити новий домен' },
    note: {
      en: 'The longer of the two: the customer has no name of their own, so they search for one, find their first choice registered to somebody else, buy the one they settle on at the DreamHost till and watch it come up. It ends with the one thing a bought name owes that an attached one does not.',
      uk: 'Довший із двох шляхів: власного імені немає, тож клієнт шукає його, бачить, що перше вже комусь належить, купує обране на касі DreamHost і дивиться, як воно оживає. Наприкінці — те єдине, що винен куплений домен і не винен підключений.',
    },
    /*
     * A paid account with nothing of its own, and a site that has never been out.
     *
     *  · `inventory: 'none'` — with no DreamHost names in the account the dashboard has no
     *    left-hand column at all, so the whole screen is the shop. That is the situation
     *    this walk is about; the other one has its own flow directly above.
     *  · `account: 'paid'` — this walk is about the DOMAIN. A trial account would grow the
     *    plan chooser inside the sheet and put a second line on the order, which is the
     *    subject of "Trial expires → buying a plan" below.
     *  · `published: false` — and it is what makes the end of this walk worth watching: a
     *    bought name that comes up in front of a site nobody has published lands in
     *    `ready`, the state a novice reads as "it's broken" (docs/features/domains/
     *    failures.md №8). Publishing is the last press of the flow.
     */
    setup: { account: 'paid', billing: 'yearly', credits: 1000, project: 'built', chat: 'long', inventory: 'none', domain: 'staging', customDomain: BUY_NAME, icann: false, unpublished: 0, published: false, cart: [] },
    steps: [
      { id: 'open', label: { en: 'The Domains screen — nothing of their own here, so the whole screen is the shop', uk: 'Екран Domains — власного тут нічого, тож увесь екран — це вітрина' },
        patch: { domain: 'searching' }, view: { surface: 'domains', domainScreen: 'home' }, awaitUser: true,
        note: {
          en: 'Opened from the Publish panel, "Buy or connect a domain". The ideas are taken from the site itself, and every row carries both figures — what the first year costs and what it renews at.',
          uk: 'Відкривається з панелі Publish — «Buy or connect a domain». Ідеї беруться із самого сайту, і в кожному рядку обидві суми: скільки коштує перший рік і скільки — продовження.',
        } },
      { id: 'taken', label: { en: 'The first name they try is already registered', uk: 'Перше ім’я, яке вони пробують, уже зареєстроване' },
        view: { domainScreen: 'results', domain: BUY_TAKEN }, ms: 3800,
        note: {
          en: 'No price and no Buy on somebody else’s name — the card names the company holding it and offers the one honest thing left, "This is my domain". Under it: the same name in endings that are free, then other names.',
          uk: 'На чужому імені немає ні ціни, ні кнопки Buy — картка називає компанію, яка ним володіє, і пропонує єдине чесне: «This is my domain». Під нею — те саме ім’я у вільних доменах, а далі інші імена.',
        } },
      { id: 'free', label: { en: 'The name they had in mind is free', uk: 'Ім’я, яке вони мали на думці, вільне' },
        view: { domainScreen: 'results', domain: BUY_NAME }, awaitUser: true,
        note: {
          en: 'Best match at the top, in the ending they asked for, with both figures on the card. The renewal is never the small print: a first-year price on its own is the pattern this product refuses.',
          uk: 'Найкращий збіг угорі, у тому домені, який просили, і обидві суми на картці. Ціна продовження ніколи не дрібним шрифтом: сума лише за перший рік — це прийом, від якого продукт відмовляється.',
        } },
      { id: 'sheet', label: { en: 'The checkout sheet — the name, the term, the total', uk: 'Аркуш оплати — ім’я, строк, сума' },
        view: { modal: 'buy', domain: BUY_NAME }, ms: 3400,
        note: {
          en: 'The name, what it costs and what it renews at, over the shortest term that ending is actually sold for. Nothing has been charged: the next press leaves Remixer altogether.',
          uk: 'Ім’я, його ціна і ціна продовження — на найкоротший строк, на який цей домен узагалі продається. Нічого ще не списано: наступне натискання виводить із Remixer.',
        } },
      /*
       * The seam, and the prototype shows it rather than papering over it: buying anything
       * today happens in the hosting panel, on its own page, in its own light theme
       * (modules/panel/PanelCart.tsx). The world's word for standing there is `checkout`,
       * and the line is built by the cart's own arithmetic — `termYears` clamps an ending
       * the registry only sells in blocks, so no number is asserted here.
       */
      { id: 'cart', label: { en: 'Checkout is not ours — the DreamHost cart, with the name on it', uk: 'Оплата — не наша: кошик DreamHost, і в ньому це ім’я' },
        patch: { domain: 'checkout', cart: [{ kind: 'domreg', domain: BUY_NAME, years: termYears(tldOf(BUY_NAME)) }] },
        view: { modal: null, panel: 'cart' }, awaitUser: true,
        note: {
          en: 'A different company’s page, and it looks like one. Walking out without paying is a real outcome here, and the builder says so when they come back.',
          uk: 'Сторінка іншої компанії, і виглядає вона саме так. Піти звідси, не заплативши, — теж справжній результат, і білдер це скаже, коли вони повернуться.',
        } },
      { id: 'order', label: { en: 'The order is placed — and the registry writes the name first', uk: 'Замовлення оформлено — спершу ім’я записує реєстр' },
        patch: { domain: 'registering', customDomain: BUY_NAME, icann: true, cart: [] },
        view: { panel: null, surface: 'preview', publish: true }, ms: 3000,
        note: {
          en: 'Back in the builder, and from here the whole connection is read in one place: the Publish panel. Two cards — where it has got to, and the confirmation the registrar has just posted. The letter arrives with the registration; the last step is about it.',
          uk: 'Назад у білдер — і далі все підключення читається в одному місці, у панелі Publish. Дві картки: де воно зараз і підтвердження, яке щойно надіслав реєстратор. Лист приходить разом із реєстрацією; про нього — останній крок.',
        } },
      /* The beat that makes the two walks different lengths, so it is the long one here
         too. Nothing to press and nothing to promise: the card owns the wait out loud. */
      { id: 'propagating', label: { en: 'Registered — and now it has to reach the rest of the world', uk: 'Зареєстровано — тепер ім’я має дійти до решти світу' },
        patch: { domain: 'propagating' }, ms: 5200,
        note: {
          en: 'Most visitors reach a new name within hours; everywhere in the world can take days. The card says that plainly instead of counting down to a moment nobody can promise.',
          uk: 'Більшість відвідувачів побачать нове ім’я за кілька годин; по всьому світу це може тривати кілька днів. Картка каже це прямо, замість відліку до моменту, якого ніхто не може пообіцяти.',
        } },
      { id: 'padlock', label: { en: 'The secure padlock is switching on', uk: 'Вмикається захисний замок' },
        patch: { domain: 'verifying' }, ms: 2600,
        note: {
          en: 'The last wait, and it cannot start earlier: the padlock is issued for an address that already answers here. Still nothing for the customer to do.',
          uk: 'Останнє очікування, і раніше воно початися не може: замок видають на адресу, яка вже відповідає тут. Від клієнта й далі нічого не потрібно.',
        } },
      /*
       * `ready`, and the one state in this walk that is a person's move rather than a wait.
       * Everything is correct, nothing is happening, and nobody has published — so the card
       * is the only blue thing in the panel and carries the verb itself. The press is real:
       * the button in that card writes exactly what the next step patches.
       */
      { id: 'ready', label: { en: 'The address is set up — and nothing is at it until they publish', uk: 'Адресу налаштовано — але за нею нічого немає, доки не опублікують' }, awaitUser: true,
        patch: { domain: 'ready' },
        note: {
          en: 'The state a first-timer reads as "it’s broken": everything is right and the site was simply never put out. So the panel says which press is missing, and carries it.',
          uk: 'Стан, який новачок читає як «усе зламалося»: усе правильно, просто сайт жодного разу не публікували. Тому панель каже, якого натискання бракує, і сама його пропонує.',
        } },
      /* Published and live — and the panel deliberately withholds its all-clear, because
         the registrant clock is still outstanding. The subtitle is written about the CARD
         and about that withheld all-clear rather than about the address field: which
         address the field prints while a confirmation is owed is a live argument in
         PublishPanel and has been answered both ways this week. */
      { id: 'live', label: { en: 'Published — and one card is still up', uk: 'Опубліковано — і одна картка ще лишилася' },
        patch: { domain: 'live', published: true, unpublished: 0 }, awaitUser: true,
        note: {
          en: 'Only a bought name ever gets it: until the person who registered it answers, the registrar can switch the name off. So it has its own way out, and the panel holds back its all-clear — no green tag, no "anyone can visit" — while it is up.',
          uk: 'Її отримує лише куплене ім’я: доки не відповість той, хто його зареєстрував, реєстратор може ім’я вимкнути. Тож у картки свій вихід, а панель тримає остаточне «все гаразд» — ні зеленої позначки, ні «доступно всім», — поки картка тут.',
        } },
      { id: 'confirmed', label: { en: 'Confirmed — and the panel gives its all-clear', uk: 'Підтверджено — і панель дає остаточне «все гаразд»' },
        patch: { icann: false }, awaitUser: true,
        note: {
          en: 'Padlock on, anyone can visit, and the address wears its green tag. A name attached from the DreamHost account never passes this card at all — nobody registered anything, so there is nothing to confirm.',
          uk: 'Замок увімкнено, сайт доступний усім, а адреса отримує зелену позначку. Ім’я, підключене з акаунта DreamHost, цієї картки не бачить узагалі: ніхто нічого не реєстрував, підтверджувати нема чого.',
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
    setup: { account: 'trial', trialDay: 29, credits: 40, project: 'built', chat: 'long', domain: 'staging', customDomain: DH_OWNED, inventory: 'dh-free', unpublished: 2, published: false, icann: false, cart: [] },
    steps: [
      { id: 'low', label: { en: 'The credits run down — the count in the topbar reaches ten', uk: 'Кредити добігають кінця — лічильник у верхній панелі показує десять' },
        patch: { credits: 10 }, view: { surface: 'preview' }, ms: 1600,
        note: { en: 'The balance is on screen the whole time, next to Publish — it is never a page you have to go and find', uk: 'Баланс увесь час на екрані, поруч із Publish — по нього ніколи не треба кудись іти' } },
      { id: 'expired', label: { en: 'Day 30 — AI is off; the site and hand editing are not', uk: 'День 30 — AI вимкнено; сайт і ручні правки — ні' }, patch: { account: 'trial-expired', credits: 0, trialDay: 30 }, ms: 2400,
        note: { en: 'The message field now reads "AI is off — a plan is required" and the count is zero. The site is untouched: nothing was taken away, and it can still be edited by hand.', uk: 'У полі введення тепер «AI is off — a plan is required», а лічильник на нулі. Сайт неторканий: нічого не забрали, і його й далі можна правити руками.' } },
      { id: 'gate', label: { en: 'What is needed is named in plain words: Remixer Build, $9.99 a month', uk: 'Потрібне названо прямо: Remixer Build, $9.99 на місяць' },
        view: { publish: true }, awaitUser: true,
        note: { en: 'It is said at every door the expired trial now closes — under the domain row in the Publish panel, and inside the checkout sheet, which folds the plan chooser in', uk: 'Це сказано в кожних дверях, які тепер зачинив тріал: під рядком про домен у панелі Publish і в аркуші оплати, що розгортає вибір плану' } },
      /* The chooser is drawn in ONE place in the product — inside the domain sheet, which
         grows to carry it whenever the account cannot go live yet (DomainModal, `showPlans`)
         — so this is the screen the note above is describing, on one of their own names. */
      { id: 'checkout', label: { en: 'Checkout — yearly or monthly', uk: 'Оплата — річний або щомісячний' },
        view: { modal: 'connect-owned', domain: DH_OWNED }, ms: 3000 },
      { id: 'paid', label: { en: 'The plan is active and the month’s credits are in the topbar', uk: 'План активний, місячні кредити — у верхній панелі' },
        patch: { account: 'paid', billing: 'yearly', credits: 1000 }, view: { modal: null, panel: null, publish: false }, ms: 1600 },
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
    /* `icann: false` is not decoration either: the domain axis is live here, so the store's
       own tidy-up (which clears that clock whenever the project falls back to its free
       address) never fires — and a registrant-email card left over from the bought walk
       would sit in this panel over a domain nobody registered tonight. */
    setup: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'live', customDomain: DH_OWNED, icann: false, unpublished: 4, published: true, cart: [] },
    steps: [
      { id: 'panel', label: { en: 'The Publish panel is open over the builder', uk: 'Над білдером відкрито панель Publish' },
        view: { surface: 'preview', publish: true }, awaitUser: true,
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
   * start it expecting a finished path — which `tag` now says on the row itself, before
   * the click, so the note is free to describe the walk like every other note here.
   */
  {
    id: 'connect-external',
    label: { en: 'Connect a domain registered at another company (GoDaddy)', uk: 'Підключити домен, зареєстрований в іншій компанії (GoDaddy)' },
    note: {
      en: 'A name registered elsewhere stays registered there; we never ask for a transfer. The customer copies two lines into the other company’s settings and comes back.',
      uk: 'Ім’я, зареєстроване в іншій компанії, там і лишається: переносити не просимо. Клієнт копіює два рядки в налаштування тієї компанії й повертається.',
    },
    tag: { en: 'Not this iteration', uk: 'Не ця ітерація' },
    /* The name is the one the data holds at GoDaddy, so the panel, the topbar chip and
       this narration all say the same domain even when the flow is stepped through
       without touching the screens. And `published: true` for the reason the two flows
       above carry it: a live domain in front of an unpublished site is a contradiction. */
    setup: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'external-manual', domain: 'staging', unpublished: 0, published: true, icann: false, cart: [], customDomain: EXTERNAL_NAME },
    steps: [
      { id: 'open', label: { en: 'The Domains screen — the customer types a name they already own', uk: 'Екран Domains — клієнт вводить ім’я, яким уже володіє' },
        patch: { domain: 'searching' }, view: { surface: 'domains', domainScreen: 'home' }, awaitUser: true,
        note: { en: 'Opened from the Publish panel, "Buy or connect a domain". With no DreamHost names in the account there is no list of their own to pick from, so the search field is the only way in.', uk: 'Відкривається з панелі Publish — «Buy or connect a domain». Якщо в акаунті немає імен DreamHost, власного списку для вибору теж немає, тож єдиний вхід — поле пошуку.' } },
      { id: 'typed', label: { en: 'The name comes back taken, and names the company it is registered at', uk: 'Ім’я повертається зайнятим і називає компанію, де воно зареєстроване' },
        view: { domainScreen: 'results', domain: EXTERNAL_NAME }, ms: 3000,
        note: { en: 'A taken name carries no price and no Buy — the only thing offered on it is "This is my domain"', uk: 'У зайнятого імені немає ні ціни, ні кнопки Buy — пропонується лише «This is my domain»' } },
      { id: 'detected', label: { en: 'Confirmed: it stays where it is registered, no transfer needed', uk: 'Підтверджено: ім’я лишається там, де зареєстроване, переносити не треба' },
        view: { domainScreen: 'external', domain: EXTERNAL_NAME }, ms: 2400,
        note: { en: 'The screen names the other company only when it actually knows it, and says nothing about it when it does not', uk: 'Екран називає іншу компанію лише тоді, коли справді її знає, і мовчить, коли не знає' } },
      { id: 'records', label: { en: 'Two lines to paste at the other company, a Copy button on each', uk: 'Два рядки, які треба вставити в іншій компанії, з кнопкою Copy біля кожного' }, awaitUser: true,
        note: { en: 'The steps are on the screen rather than behind a link. Unfinished here: they are written for one company only, and the first line is still a raw address.', uk: 'Кроки — на екрані, а не за посиланням. Тут не завершено: вони написані лише під одну компанію, а перший рядок — це досі сира адреса.' } },
      { id: 'saved', label: { en: 'Saved — the domain is now connecting', uk: 'Збережено — домен підключається' },
        patch: { domain: 'connecting' }, view: { surface: 'preview', modal: null, publish: true }, ms: 3400,
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

/**
 * Point the camera where a step asks for it — see FlowView.
 *
 * ORDER MATTERS, because these actions clear each other by design: `openDomains` and
 * `openSurface` close the Publish panel, `openPanel` closes the panel AND the sheet (the
 * hosting panel is a full-window takeover and nothing of ours may show through the seam).
 * So the canvas is placed first, then the foreign page, then the sheet, and the Publish
 * panel last — otherwise a step asking for two of them would have the first silently
 * undone by the second.
 */
function applyView(v: FlowView) {
  const ui = useUI.getState()
  if (v.surface || v.domainScreen) {
    /* A surface is WHAT THE CANVAS SHOWS, so asking for one asks for the canvas. With the
       preview collapsed the canvas is zero width and aria-hidden, so the domains window
       would open into nothing and the subtitle would name a screen that is not there —
       which is the whole defect this type exists to close. It is a rule and not a field on
       every step for the same reason: a field can be forgotten, and forgetting it fails
       silently. `preview` below is the deliberate exception, applied last so it wins. */
    ui.setPreviewOpen(true)
    const surface = v.surface ?? 'domains'
    if (surface === 'domains') ui.openDomains(v.domainScreen ?? 'home', v.domain ?? null)
    else ui.openSurface(surface)
  }
  if (v.panel !== undefined) v.panel ? ui.openPanel(v.panel) : ui.closePanel()
  if (v.modal !== undefined) v.modal ? ui.openDomainModal(v.modal, v.domain ?? '') : ui.closeDomainModal()
  if (v.publish !== undefined) ui.togglePublish(v.publish)
  if (v.preview !== undefined) ui.setPreviewOpen(v.preview)
}

/**
 * The camera before a flow starts: the builder, nothing open over it.
 *
 * A flow is a restaging, so it cannot inherit the last one's screens — the buy walk ends
 * with the Publish panel up and a sheet two steps behind it, and the next flow's first
 * subtitle would be read over them. Every flow's first step then only has to name what it
 * actually needs, instead of closing four things it knows nothing about.
 *
 * ⚠️ THE PAGE IS SET, NOT NAVIGATED TO. `openBuilder` is the product's own door and it
 * plays the three-phase corridor (state/ui.ts, ~3.6s of curtain and edge glow) — which is
 * right when somebody presses Build, and wrong here: it would bury the first beat of the
 * flow under an opaque cover for longer than the beat lasts. Staging a situation has never
 * played that corridor, the same way the scenario presets never have.
 */
function resetView() {
  const ui = useUI.getState()
  ui.closePanel()
  ui.closeDomainModal()
  ui.closeSurface()
  ui.togglePublish(false)
  /* `publishHintOpen` comes back with it: waving the nudge away is this session's UI, and a
     flow re-run in front of a room has to play the same both times. `goHome` restores it
     for the same reason. */
  useUI.setState({ page: 'builder', boot: null, publishHintOpen: true })
}

/** Apply a step's world patch and the screen it needs, in that order — the same order the
 *  product writes them in (the sheet writes the world while it is still up, then
 *  navigates), so nothing renders against a world that has not moved yet. */
function applyStep(flow: Flow, i: number) {
  const step = flow.steps[i]
  if (!step) return
  if (step.patch) useWorld.getState().set(step.patch)
  if (step.view) applyView(step.view)
}

/** Replay from the setup up to `target` — the world AND the camera, since both are
 *  written step by step and neither can be un-applied. */
function replay(flow: Flow, target: number) {
  resetView()
  useWorld.getState().set(flow.setup, null)
  for (let k = 0; k <= target; k++) applyStep(flow, k)
}

export const useFlow = create<FlowStore>((set, get) => ({
  flowId: null,
  index: 0,
  playing: false,
  speed: 'demo',

  start: (id) => {
    const flow = flowById(id)
    if (!flow) return
    replay(flow, 0)
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
    replay(flow, i)
    set({ index: i, playing: false })
  },
  goTo: (i) => {
    const { flowId } = get()
    const flow = flowId ? flowById(flowId) : null
    if (!flow) return
    const target = Math.max(0, Math.min(i, flow.steps.length - 1))
    replay(flow, target)
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
