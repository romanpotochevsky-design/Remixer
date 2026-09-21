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
import { DEFAULT_WORLD, DEMO_PROJECTS, isCustomDomainActive, registrantUnconfirmed } from './world'
import type { Text } from '../i18n'
import { leadingDone } from '../modules/chat/autopilot'
import { BRIEF_INTRO, BRIEF_STATUS, BRIEF_QUESTIONS } from '../modules/chat/brief'
import { CUSTOM_DOMAIN } from '../data/domains'

export interface Preset {
  id: string
  /**
   * Which labelled section of the Situations list this tile stands in. Same shape and
   * same mechanism as an axis `group` — one list of tiles with three headings over it,
   * not a second grouping idiom beside the one the axes already use.
   *
   * The rule that decides it: A TILE BELONGS TO THE GROUP OF THE AXIS IT ACTUALLY STAGES.
   * "Live, with edits" moves `unpublished`, which is a Project axis, so it is a project
   * situation even though it needs a live domain to be worth looking at; "Live site"
   * moves `domain`, so it is where the domain walk ends. Guessing by what the tile
   * reminds you of puts the two in the same place and then neither heading means
   * anything.
   */
  group: Text
  label: Text
  note: Text
  /**
   * Set when the flow behind the tile is deliberately unfinished. It is drawn ON the
   * tile, before anybody clicks: the console can afford to disappoint a designer who
   * knows what is half-built, but not a product owner who does not.
   */
  tag?: Text
  patch: Partial<World>
}

/**
 * The three headings.
 *
 * Twenty-two tiles in one grid is a list nobody reads — somebody hunting for "the state
 * where the padlock is still coming" had to scan all of them, and the domain ones were
 * not even in the order the product walks them, so the list gave no hint that they are a
 * sequence at all. They answer three different questions, and the headings are those
 * questions: where does the CUSTOMER stand with us, where does the PROJECT stand, and
 * where does the DOMAIN stand.
 *
 * Project first because that is where a demo starts (a blank canvas and a thin prompt);
 * customer second, because those are commercial facts read over whatever is on screen;
 * domain last, because it is the longest section and the only one that has to be read as
 * a walk from top to bottom.
 */
const PG = {
  project: { en: 'Project situations', uk: 'Ситуації проєкту' },
  customer: { en: 'Customer situations', uk: 'Ситуації клієнта' },
  domain: { en: 'Domain situations', uk: 'Ситуації домену' },
}

/**
 * The answers the staged demo presets are built on — one brief, so the generation card, the
 * plan and Autopilot's proposals all describe the same site wherever a preset shows them.
 */
/*
 * The one brief the staged presets share, so the summary card, the plan and the Autopilot
 * proposals all describe the same site.
 *
 * ⚠️ `site` is the ONLY typed answer in it, and deliberately so: it is the brief's only
 * free-text question, and staging it with the `other:` prefix is what makes every preset
 * exercise the typed path — the one that used to eat spaces — instead of four clean picks.
 */
const DEMO_BRIEF = { site: 'other:a small bakery', goal: 'sell', pages: 'few', palette: 'warm-clay', type: 'friendly' } as const

export const PRESETS: Preset[] = [
  /*
   * ───────────────────────────────────────────────────────────── the project
   * A project's life in order: nothing made → too little to build from → the minute it
   * takes → what Remixer does with the site once it exists → edits waiting to go out.
   */
  {
    id: 'first-run',
    group: PG.project,
    label: { en: 'First run', uk: 'Перший запуск' },
    note: {
      en: 'Nothing made yet — the Home page opens on templates and the builder has an empty canvas',
      uk: 'Ще нічого не створено — головна відкривається на шаблонах, полотно білдера порожнє',
    },
    patch: { account: 'trial', trialDay: 1, credits: 2000, bonus: true, project: 'empty', chat: 'empty', domain: 'staging', inventory: 'none', unpublished: 0, published: false, projects: [] },
  },
  {
    id: 'weak-prompt',
    group: PG.project,
    label: { en: 'New project — thin prompt', uk: 'Новий проєкт — слабкий промпт' },
    note: {
      en: 'Type "Build me a website." — too little to build from, so Remixer asks five questions and writes a plan before it spends a build',
      uk: 'Введіть «Build me a website.» — будувати нема з чого, тож Remixer ставить п’ять запитань і складає план, перш ніж витратити білд',
    },
    patch: { account: 'trial', trialDay: 1, credits: 2000, bonus: true, project: 'empty', chat: 'empty', sent: [], domain: 'staging', inventory: 'none', unpublished: 0, published: false },
  },
  {
    id: 'plan-waiting',
    group: PG.project,
    label: { en: 'Plan — waiting for approval', uk: 'План — очікує підтвердження' },
    note: {
      en: 'The five answers are compiled and the Build Plan is docked, one press from spending a build — the step the two drawn variants live in',
      uk: 'П’ять відповідей скомпільовано, план збірки стоїть у доці за один дотик від витрати білда — крок, у якому живуть два намальовані варіанти',
    },
    /*
     * THE STEP THE PLAN IS FOR, staged. The live path to it is five questions and two
     * pauses for reading; this is the same world in one click, which is what the console is
     * for — and it is the only way to show the same moment in both of its drawn variants
     * (`planSimple`) without walking the brief twice.
     *
     * The transcript is the one the live flow leaves behind, quoting the product's own
     * strings rather than retyping them (the lesson the Autopilot preset records): the thin
     * prompt, the line that explains why nothing is being built yet, and the summary card,
     * whose title reads itself off `brief.status` — "Plan ready" here, not "Turning your
     * answers into a brief".
     *
     * ⚠️ `chat: 'long'` and NOT 'working': the plan is not Remixer being busy, it is
     * Remixer waiting. The shimmer and the locked composer would say the opposite — which
     * is exactly the note `offerPlan` carries in send.ts.
     */
    patch: {
      account: 'trial', trialDay: 1, credits: 2000, bonus: true, project: 'empty', chat: 'long',
      domain: 'staging', inventory: 'none', unpublished: 0, published: false, projects: [],
      brief: { status: 'planning', step: BRIEF_QUESTIONS.length - 1, answers: { ...DEMO_BRIEF } },
      sent: [
        { id: 1001, who: 'user', text: 'Build me a website.' },
        { id: 1002, who: 'ai', kind: 'clarify', text: BRIEF_INTRO },
        { id: 1003, who: 'ai', kind: 'brief', text: BRIEF_STATUS },
      ],
    },
  },
  {
    id: 'generating',
    group: PG.project,
    label: { en: 'Generating — mid-build', uk: 'Іде генерація — середина' },
    note: {
      en: 'One section done, one being written, the rest and the other pages waiting — frozen mid-build, so nobody has to sit out the minute',
      uk: 'Одна секція готова, одна пишеться, решта й інші сторінки чекають — заморожено посеред білду, щоб не сидіти цілу хвилину',
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
    group: PG.project,
    label: { en: 'Autopilot — the first proposal', uk: 'Autopilot — перша пропозиція' },
    note: {
      en: 'The home page has just landed and Remixer proposes what to do next — the panel the whole mode exists for',
      uk: 'Головна щойно приїхала, і Remixer пропонує, що робити далі — панель, заради якої існує весь режим',
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
            en: 'Got it — a site built to sell, across a few pages, in Warm Clay with friendly lettering. Let me build that for you.',
            uk: 'Зрозумів — сайт, який продає, на кілька сторінок, у палітрі Warm Clay і дружніми шрифтами. Збираю.',
          },
        },
        { id: 1003, who: 'ai', kind: 'build', text: '' },
        { id: 1004, who: 'ai', text: leadingDone(DEMO_BRIEF) },
      ],
    },
  },
  {
    id: 'rating',
    group: PG.project,
    label: { en: 'Autopilot — the satisfaction ask', uk: 'Autopilot — питання про враження' },
    note: {
      en: '"How would you rate Remixer?" — the 1–10 card, asked once, after the first proposal was answered',
      uk: '«How would you rate Remixer?» — картка 1–10, яку питають один раз, після відповіді на першу пропозицію',
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
            en: 'About is in — the same grid, palette and lettering as the home page, and linked from the nav so the site reads as one piece. Tell me what belongs on it and I will fill it in.',
            uk: 'Сторінка «Про нас» на місці — та сама сітка, палітра і шрифти, що на головній.',
          },
        },
      ],
    },
  },
  {
    id: 'live-stale',
    group: PG.project,
    label: { en: 'Live, with edits', uk: 'Живий, є правки' },
    note: {
      en: 'Four edits made since the last publish — the topbar button reads Update and carries the count',
      uk: 'Чотири правки після останньої публікації — кнопка в топбарі каже «Update» і показує лічильник',
    },
    patch: { account: 'paid', credits: 900, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'live', icann: false, unpublished: 4, published: true, projects: DEMO_PROJECTS },
  },

  /*
   * ──────────────────────────────────────────────────────────── the customer
   * Where they stand with us commercially, in the order they meet it.
   */
  {
    id: 'trial-mid',
    group: PG.customer,
    label: { en: 'Trial, day 22', uk: 'Тріал, день 22' },
    note: {
      en: 'Day 22 of 30, credits going down, and the site still answers on its free address',
      uk: 'День 22 з 30, кредити спадають, сайт досі відповідає на безкоштовній адресі',
    },
    patch: { account: 'trial', trialDay: 22, credits: 640, bonus: true, project: 'built', chat: 'long', domain: 'staging', inventory: 'dh-free', unpublished: 3, published: false, projects: DEMO_PROJECTS },
  },
  {
    id: 'trial-low',
    group: PG.customer,
    label: { en: 'Credits running out', uk: 'Кредити закінчуються' },
    note: {
      en: '40 credits left on day 27 — the moment buying more has to be easy to find',
      uk: 'Лишилось 40 кредитів, день 27 — момент, коли докупити кредити має бути легко',
    },
    patch: { account: 'trial', trialDay: 27, credits: 40, project: 'built', chat: 'long', domain: 'staging', unpublished: 1, published: false, projects: DEMO_PROJECTS },
  },
  {
    id: 'trial-expired',
    group: PG.customer,
    label: { en: 'Trial expired', uk: 'Тріал завершився' },
    note: {
      en: 'The 30 days are up: AI is off, manual editing still works, and the way back is an upgrade',
      uk: '30 днів минуло: AI вимкнено, ручне редагування працює, а шлях назад — апгрейд',
    },
    patch: { account: 'trial-expired', trialDay: 30, credits: 0, bonus: false, project: 'built', chat: 'long', domain: 'staging', unpublished: 2, published: false, projects: DEMO_PROJECTS },
  },
  {
    id: 'paid-no-domain',
    group: PG.customer,
    label: { en: 'Paid, no domain', uk: 'Оплачено, домену немає' },
    note: {
      en: 'Paying customer, site built — and it still answers only on its free address',
      uk: 'Клієнт платить, сайт зібрано — і він досі відповідає лише на безкоштовній адресі',
    },
    patch: { account: 'paid', billing: 'yearly', credits: 1000, project: 'built', chat: 'long', domain: 'staging', inventory: 'dh-free', unpublished: 0, published: false, projects: DEMO_PROJECTS },
  },

  /*
   * ────────────────────────────────────────────────────────────── the domain
   * IN THE ORDER THE PRODUCT WALKS IT, not in the order the tiles were written. The walk
   * itself is state/world.ts's `DomainState` union and the two timelines in
   * modules/domains/connect.ts:
   *
   *   choose a name              searching → checkout
   *   buy a new one              registering → propagating ┐
   *   attach one they own        connecting ──────────────┴→ ready | live
   *
   * So: choosing, the cart, the two beats only a PURCHASE has, the one beat only an
   * ATTACH has, the padlock both of them end on — then the ways it stalls, then live.
   *
   * The stalls are not a judgement call either: PublishPanel.tsx names them itself,
   * `const stalled = ready || oldSite || unreachable` — nothing is moving and the hold-up
   * is this name. `icann` joins them as the fourth — and NOT, as this note claimed for one
   * draft, because "the site works perfectly and can still be switched off". That was the
   * refuted reading (state/world.ts, `World.icann`): a DreamHost developer, asked directly
   * on 14.09.2026, says the name does not resolve at all while the confirmation is owed.
   * It is a stall in the plainest sense — the bought walk stops dead at `registering` and
   * one click in somebody's inbox is the only thing that starts it again.
   *
   * ⚠️ EVERY TILE BELOW NAMES `icann`, INCLUDING THE ONES THAT WANT IT OFF. The clock is
   * only auto-cleared when the domain axis walks back to a state with no custom domain in
   * it (world.ts `set`), so between two domain presets it is STICKY: click "Email not
   * confirmed yet" (which stages the pair on purpose) and then "Live site", and the live
   * site arrived owing a registrant email — a pairing `violations` now calls impossible in
   * red, and which the tile's own name flatly contradicts. Nothing in the world is wrong
   * there; a patch that leaves an axis out is simply not staging it. So a domain preset
   * states the clock the way it states the domain, and the console's summary line says
   * which of the two you are looking at (`describe`).
   */
  {
    id: 'dh-zero-record',
    group: PG.domain,
    label: { en: 'Own domain on DreamHost', uk: 'Власний домен на DreamHost' },
    note: {
      en: 'The domain window, with a name they already own on DreamHost — connecting it needs nothing copied anywhere',
      uk: 'Вікно доменів з іменем, яке вже є в них на DreamHost — щоб підключити, нічого нікуди копіювати не треба',
    },
    patch: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'searching', unpublished: 0, published: false, projects: DEMO_PROJECTS },
  },
  {
    id: 'left-at-checkout',
    group: PG.domain,
    label: { en: 'Left standing at checkout', uk: 'Покинув оформлення' },
    note: {
      en: 'A name sitting in the cart and nobody paid — the site is exactly where they left it, and nothing pretends to be connecting',
      uk: 'Ім’я лежить у кошику, оплати не було — сайт рівно там, де його лишили, і ніщо не вдає підключення',
    },
    /* ⚠️ The cart rides IN the patch. A named preset normally empties the cart (world.set),
       which is right for every other preset here and would leave this one staging the state
       with nothing standing in it. */
    patch: {
      account: 'trial', trialDay: 22, credits: 640, project: 'built', chat: 'long',
      inventory: 'none', domain: 'checkout', unpublished: 2, published: false,
      projects: DEMO_PROJECTS, cart: [{ kind: 'domreg', domain: 'fit-ration.com', years: 1 }],
    },
  },
  /*
   * THE BOUGHT PATH, BEAT BY BEAT. Its two opening states do not exist on the attach path
   * at all: the registry writes the name in minutes, and the name then spends hours — up
   * to 72 — becoming visible around the world (modules/domains/connect.ts). Staged here
   * one click apart, because nobody is sitting through the real thing and both are states
   * a customer can close the tab on and come back to.
   */
  {
    id: 'registering',
    group: PG.domain,
    /* ⚠️ THE TILE SPEAKS THE AXIS'S WORD. It read "registering" — the axis's old name,
       renamed to `provisioning` on 14.09.2026 when the designer named the three statuses —
       while the axis, its hints and the panel's own card all said Provisioning. One word,
       and the console is the panel a designer opens in front of a room. */
    label: { en: 'Just bought — provisioning', uk: 'Щойно куплено — реєстрація' },
    note: {
      en: 'Bought a minute ago: the registry has the order and the name is not theirs yet. Minutes — and not the same thing as a working website',
      uk: 'Куплено хвилину тому: реєстр має замовлення, імені ще немає. Це хвилини — і це не те саме, що працюючий сайт',
    },
    /* ⚠️ THE CONFIRMED HALF OF THIS BEAT, and a real purchase reaches it second: the
       walk holds at `registering` until the registrant confirms (see "Email not confirmed
       yet" below, and modules/domains/connect.ts). This tile is what the registry wait
       looks like once that is out of the way. */
    patch: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'none', domain: 'provisioning', icann: false, unpublished: 0, published: true, projects: DEMO_PROJECTS },
  },
  {
    id: 'propagating',
    group: PG.domain,
    label: { en: 'Just bought — on its way', uk: 'Щойно куплено — у дорозі' },
    note: {
      en: 'Registered and confirmed, now travelling the world — hours, up to 72, the longest wait anywhere in the flow',
      uk: 'Зареєстровано й підтверджено, тепер розходиться світом — години, до 72: найдовше очікування в усьому флоу',
    },
    /* ⚠️ `icann: false`, AND THAT IS THE FACT AND NOT A TIDY-UP. This tile used to stage
       the pair, so the panel read "Most visitors will reach your site within a few hours"
       directly above "the address starts working once you confirm" — two sentences that
       cannot both be true. A name only reaches this beat once the confirmation is in
       (modules/domains/connect.ts, THE GATE); the tile below stages the wait BEFORE it. */
    patch: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'none', domain: 'propagating', icann: false, unpublished: 0, published: true, projects: DEMO_PROJECTS },
  },
  {
    id: 'connecting',
    group: PG.domain,
    label: { en: 'Domain connecting', uk: 'Домен підключається' },
    note: {
      en: 'The amber card in Publish: connecting, nothing for them to do, and the free address still serving the site',
      uk: 'Бурштинова картка в Publish: підключається, робити нічого не треба, а сайт поки на безкоштовній адресі',
    },
    patch: { account: 'paid', credits: 980, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'connecting', icann: false, unpublished: 0, published: true, projects: DEMO_PROJECTS },
  },
  {
    id: 'domain-ready',
    group: PG.domain,
    label: { en: 'Domain ready, never published', uk: 'Домен готовий, сайт не публікували' },
    note: {
      en: 'The domain is set up and the site was never published — nothing is wrong, nothing is at the address, and one button is left',
      uk: 'Домен налаштовано, а сайт не публікували — нічого не зламано, за адресою порожньо, лишилась одна кнопка',
    },
    patch: { account: 'paid', credits: 990, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'ready', icann: false, unpublished: 2, published: false, projects: DEMO_PROJECTS },
  },
  {
    id: 'old-site',
    group: PG.domain,
    label: { en: 'Publish blocked by an old site', uk: 'Публікацію блокує старий сайт' },
    note: {
      en: 'Publishing fails because the address still holds an older website — support has to clear it first. Common here, where that is usually WordPress',
      uk: 'Публікація не проходить, бо за адресою лежить старіший сайт — спершу його має прибрати підтримка. У нас це зазвичай WordPress',
    },
    patch: { account: 'paid', credits: 990, project: 'built', chat: 'long', inventory: 'dh-in-use', domain: 'old-site', icann: false, unpublished: 2, published: false, projects: DEMO_PROJECTS },
  },
  {
    id: 'domain-broken',
    group: PG.domain,
    label: { en: 'Domain not responding', uk: 'Домен не відповідає' },
    note: {
      en: 'The red card in Publish: the address stopped answering, the site is still safe on its free one, and Fix this is the way out',
      uk: 'Червона картка в Publish: адреса перестала відповідати, сайт у безпеці на безкоштовній, вихід — «Fix this»',
    },
    patch: { account: 'paid', credits: 900, project: 'built', chat: 'error', inventory: 'dh-external-ns', domain: 'unreachable', icann: false, unpublished: 0, published: true, projects: DEMO_PROJECTS },
  },
  {
    id: 'icann-verify',
    group: PG.domain,
    label: { en: 'Email not confirmed yet', uk: 'Пошту ще не підтверджено' },
    note: {
      en: 'Bought, connected, and going no further until the registrant confirms their email: the address does not answer yet, the site stays on its free one, and the letter beside the panel is the way on',
      uk: 'Куплено, підключено — і далі нічого не відбувається, доки реєстрант не підтвердить пошту: адреса ще не відповідає, сайт лишається на безкоштовній, а вихід — лист поруч із панеллю',
    },
    /*
     * ⚠️ `live` UNTIL TONIGHT, AND THAT WAS THE BUG STAGED AS A TILE. A DreamHost
     * developer, asked directly (14.09.2026): without the confirmation «вебсайт поідеї не
     * буде працювати якщо запаблішити». So a live domain owing one cannot exist — the
     * walk holds until the letter lands (modules/domains/connect.ts) and `violations`
     * calls the old pairing impossible. This tile stages where the walk actually stops.
     *
     * ⚠️ AND WHERE IT STOPS IS `ready`, NOT `provisioning` (designer, 14.09.2026: the mail
     * is not mentioned until the domain has connected). Staged at the first beat this tile
     * would now show the provisioning card and NO letter at all — the one thing it exists
     * to show. `published: false` for the same reason: it makes the tile's after-state the
     * real one, the green "connected, one press to go" card, instead of a panel with
     * nothing on it.
     *
     * ⚠️ AND IT DOES NOT WALK ON WHEN THE LETTER IS PRESSED, because nothing started it:
     * a staged state carries no ticket, which is the console's oldest rule (a clock that
     * re-armed itself would drift the state out from under the person looking at it).
     * Confirming here clears the card and the letter and leaves the world at `ready`; the
     * resuming version of this beat is a real purchase through the cart.
     */
    patch: { account: 'paid', credits: 960, project: 'built', chat: 'long', inventory: 'none', domain: 'ready', icann: true, unpublished: 0, published: false, projects: DEMO_PROJECTS },
  },
  {
    id: 'live',
    group: PG.domain,
    label: { en: 'Live site', uk: 'Живий сайт' },
    note: {
      en: 'Published, the domain answers, the padlock is on — where both walks end',
      uk: 'Опубліковано, домен відповідає, замок увімкнено — кінець обох шляхів',
    },
    patch: { account: 'paid', credits: 940, project: 'built', chat: 'long', inventory: 'dh-free', domain: 'live', icann: false, unpublished: 0, published: true, projects: DEMO_PROJECTS },
  },
  {
    id: 'external-manual',
    group: PG.domain,
    label: { en: 'Domain at another registrar', uk: 'Домен в іншого реєстратора' },
    note: {
      en: 'A name registered somewhere else, where we cannot write the records ourselves. The screens behind this tile are not built yet — it stages the world, not a finished flow',
      uk: 'Ім’я зареєстроване деінде, де ми не можемо самі прописати записи. Екранів за цією плиткою ще немає — вона ставить стан світу, а не готовий флоу',
    },
    /* The external-registrar path is a second iteration and is not being demoed. The tag
       is on the TILE and not only in this note, because a note is a tooltip and a tooltip
       arrives after the decision to click. */
    tag: { en: 'Not this iteration', uk: 'Не ця ітерація' },
    patch: { account: 'paid', credits: 1000, project: 'built', chat: 'long', inventory: 'external-manual', domain: 'connecting', icann: false, unpublished: 0, published: true, projects: DEMO_PROJECTS },
  },
]

/** Distinct preset groups, in the order they first appear — the same derivation as
 *  `GROUPS` below, so the console renders both lists through one idiom. */
export const PRESET_GROUPS: Text[] = PRESETS.reduce<Text[]>((acc, p) => {
  if (!acc.some((g) => g.en === p.group.en)) acc.push(p.group)
  return acc
}, [])

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
      /* ⚠️ THREE STATUSES, AND TWO OF THEM BELONG TO A PURCHASE (designer, 14.09.2026):
         `provisioning` and `propagating` happen only to a name bought through us, and a
         domain the customer already owns has exactly one beat — `connecting`. The
         certificate stage this list used to carry is gone with the state. */
      { value: 'provisioning', label: { en: 'Provisioning (bought)', uk: 'Реєструється (куплений)' }, hint: { en: 'the registry — under 15 min', uk: 'реєстр — до 15 хв' } },
      { value: 'connecting', label: { en: 'Connecting', uk: 'Підключається' }, hint: { en: 'the only beat an owned domain has', uk: 'єдиний такт для свого домену' } },
      { value: 'propagating', label: { en: 'Propagating (bought)', uk: 'Пропагується (куплений)' }, hint: { en: 'the world — hours, up to 72', uk: 'світ — години, до 72' } },
      { value: 'ready', label: { en: 'Ready, not published', uk: 'Готовий, не опубліковано' }, hint: { en: 'the novice’s №1 failure', uk: 'сбій №1 у новачка' } },
      { value: 'live', label: { en: 'Live', uk: 'Живий' } },
      { value: 'old-site', label: { en: 'Publish blocked — old site', uk: 'Публікацію блокує старий сайт' }, hint: { en: 'the address is not clean', uk: 'адреса не порожня' } },
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
    /*
     * The ICANN clock on a freshly REGISTERED domain (designer's state ⑤): the panel
     * carries it in its own amber card until the registrant confirms the email. Only
     * reachable once a domain is actually attached — a staging site has nothing to
     * confirm.
     *
     * ⚠️ HIDDEN AND NOT DISABLED, decided 14.09.2026 and deliberately. Hiding the switch
     * used to TRAP the flag: nothing cleared it when the domain axis walked back to
     * staging, so the one control that could take it off disappeared exactly when it was
     * needed. That is fixed at the source now (`world.set` clears the clock with the
     * domain), so hiding no longer hides a problem — it reads the way `trialDay` off
     * trial and `billing` off a paid plan already read in this console: an axis that has
     * no meaning here is not on screen. A visible-but-enabled switch would be worse, not
     * better — it would let a presenter stage a world `violations` calls impossible, in
     * front of the room; and a visible-but-greyed one would mean teaching the console's
     * toggle renderer a disabled state it does not have (only `options` consult
     * `blocked`), which is ScenarioPanel's business, not this table's.
     */
    key: 'icann', group: G.domain, label: { en: 'Email unconfirmed', uk: 'Email не підтверджено' }, kind: 'toggle',
    appliesWhen: (w) => isCustomDomainActive(w),
  },
  {
    /* The designer's A/B on the status chip's word (16.09.2026): tone (off) or white (on).
       The dot keeps the tone either way. Shown only while a chip is on screen to flip. */
    key: 'chipInkWhite', group: G.domain, label: { en: 'Status chip — white word', uk: 'Плашка статусу — біле слово' }, kind: 'toggle',
    appliesWhen: (w) => isCustomDomainActive(w),
  },
  {
    /* The composer's mode switcher (Figma 29697:54553). Autopilot is the default from
       the first generation on; it only has anything to lead once a site exists. */
    /*
     * WHICH BUILD PLAN THE STEP WEARS (21.09.2026). Two drawn designs, both shipped: the
     * simplified window of release one, and the full card with `Review`. During the step the
     * switch stands in the screen's bottom-left corner (PlanVariantSwitch.tsx); this axis is
     * what stages either one BEFORE walking into it. A design A/B like the status chip's ink —
     * not a project fact, so `startBuild` leaves it alone.
     */
    key: 'planSimple', group: G.chat, label: { en: 'Build Plan — simplified', uk: 'План збірки — спрощений' }, kind: 'toggle',
  },
  {
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
  {
    /*
     * HOW THE CUSTOMER GOT HERE (board 28726:64760 «Domain-Only Customer»). The designer's
     * scenario is a DreamHost panel customer who has already chosen a domain there, picked
     * Remixer as the way to build, and been handed over to this page — so the page can open
     * with the name already in the composer. Attaching it by hand through the "+" is the
     * same axis, reached the other way.
     *
     * ⚠️ NOT a toggle, although it has two tiles: the axis holds a NAME, and the console
     * should stage the one the rest of the demo talks about rather than a boolean somebody
     * has to translate. `null` needs the explicit patch — the console's default
     * `{ key: value }` would store the empty string.
     */
    key: 'intakeDomain', group: G.home, label: { en: 'Domain attached to the prompt', uk: 'Домен, прикріплений до промпту' }, kind: 'options',
    current: (w) => w.intakeDomain ?? 'none',
    options: [
      {
        value: 'none', label: { en: 'None', uk: 'Немає' },
        hint: { en: 'a plain new site', uk: 'звичайний новий сайт' },
        patch: { intakeDomain: null },
      },
      {
        value: CUSTOM_DOMAIN, label: { en: CUSTOM_DOMAIN, uk: CUSTOM_DOMAIN },
        hint: { en: 'arrived from the DreamHost panel', uk: 'прийшов з панелі DreamHost' },
        patch: { intakeDomain: CUSTOM_DOMAIN },
      },
    ],
  },
]

/** Distinct groups, in the order they first appear. */
export const GROUPS: Text[] = AXES.reduce<Text[]>((acc, a) => {
  if (!acc.some((g) => g.en === a.group.en)) acc.push(a.group)
  return acc
}, [])

/**
 * "N unpublished changes", counted properly in both languages.
 *
 * This line is READ ALOUD in a demo, so "1 unpublished changes" is not a typo somebody
 * forgives — it is the sentence a product owner hears while looking at the screen. Two of
 * the presets here stage exactly one edit.
 */
function edits(n: number): Text {
  const ones = n % 10
  const tens = n % 100
  const uk =
    ones === 1 && tens !== 11
      ? 'неопублікована правка'
      : ones >= 2 && ones <= 4 && (tens < 12 || tens > 14)
        ? 'неопубліковані правки'
        : 'неопублікованих правок'
  return { en: `${n} unpublished ${n === 1 ? 'change' : 'changes'}`, uk: `${n} ${uk}` }
}

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
    provisioning: { en: 'domain being registered', uk: 'домен реєструється' },
    propagating: { en: 'domain on its way', uk: 'домен у дорозі' },
    connecting: { en: 'domain connecting', uk: 'домен підключається' },
    ready: { en: 'domain ready, not published', uk: 'домен готовий, не опубліковано' },
    'old-site': { en: 'publish blocked by an old site', uk: 'публікацію блокує старий сайт' },
    live: { en: 'domain live', uk: 'домен живий' },
    unreachable: { en: 'domain not reachable', uk: 'домен не відповідає' },
    multiple: { en: 'several domains', uk: 'кілька доменів' },
  }
  en.push(domain[w.domain].en); uk.push(domain[w.domain].uk)

  /*
   * The registrant-email clock has no word of its own above, and the domain axis cannot
   * speak for it: "domain being registered" is the line for both the tile that is simply
   * waiting on the registry and the tile that is waiting on somebody's inbox — and only
   * the second one is stuck. A summary that cannot tell the room which of the two is on
   * screen is worse than no summary, because it is read out with confidence.
   */
  /* ⚠️ THE SELECTOR, NOT THE RAW FLAG (designer, 14.09.2026). `icann` is genuinely true
     from the moment a name is bought, but nothing on any product surface mentions the mail
     until the domain has CONNECTED — so a summary read off the flag made the console the
     one place that announced the letter before the product did, and it is the line that
     gets read out loud in a demo. The console's own toggle stays visible throughout, which
     is right: it is the instrument, not a surface. */
  if (registrantUnconfirmed(w)) { en.push('email not confirmed'); uk.push('пошту не підтверджено') }

  if (!w.projects.length) { en.push('no sites yet'); uk.push('сайтів ще немає') }
  if (w.brief.status === 'asking') { en.push('asking for direction'); uk.push('уточнює напрямок') }
  else if (w.brief.status === 'planning') { en.push('plan awaiting approval'); uk.push('план очікує підтвердження') }
  else if (w.project === 'empty') { en.push('empty project'); uk.push('проєкт порожній') }
  else if (w.project === 'generating') { en.push('generating'); uk.push('іде генерація') }
  else if (w.unpublished > 0) {
    const e = edits(w.unpublished)
    en.push(e.en); uk.push(e.uk)
  }

  /*
   * What the dock is holding, when Autopilot put something in it. Same idiom as the
   * brief's two states above — the line names the thing the room is actually looking at.
   * Without it the two Autopilot presets describe themselves only by their credit
   * balance, which is the one number nobody in the room is reading.
   */
  if (w.suggest.show === 'proposal') { en.push('Autopilot proposing what is next'); uk.push('Autopilot пропонує, що далі') }
  else if (w.suggest.show === 'rating') { en.push('asking how it went'); uk.push('питає про враження') }

  return { en: en.join(' · '), uk: uk.join(' · ') }
}

export const isDefault = (w: World) =>
  JSON.stringify(w) === JSON.stringify(DEFAULT_WORLD)
