/**
 * The prototype's single source of truth.
 *
 * Every screen renders from this object. Nothing keeps its own copy of "does the user
 * have a plan" — otherwise, a year from now, we would have twenty drifting versions of
 * the truth. Add a new dimension here first, then read it in the screens.
 */
import { create } from 'zustand'
import type { ThumbId } from '@/modules/home/thumbs'
import type { BriefKey } from '@/modules/chat/brief'

/* ------------------------------------------------------------------ axes */

/** Where the customer stands with us commercially. */
export type Account = 'anonymous' | 'trial' | 'trial-expired' | 'paid'

export type Billing = 'monthly' | 'yearly'

/**
 * Axis A — what the customer already owns.
 * This decides which "Connect a domain" entry screen is even reachable, and it is
 * independent of what the current project's domain is doing (axis B).
 */
export type Inventory =
  /** Nothing. The only path is search → buy → connect. */
  | 'none'
  /** Unused domain(s) sitting in their DreamHost account — the zero-record go-live case. */
  | 'dh-free'
  /** A DreamHost domain that already serves a site. Connecting can take it down. */
  | 'dh-in-use'
  /** Registered with us, but nameservers point elsewhere (usually Cloudflare):
   *  records we write server-side will NOT take effect. Must be detected and explained. */
  | 'dh-external-ns'
  /** External registrar that supports Domain Connect (GoDaddy, Squarespace, IONOS…). */
  | 'external-dc'
  /** External registrar without it (Namecheap, Cloudflare) — guided manual records only. */
  | 'external-manual'

/** Axis B — what the current project's domain is doing. */
export type DomainState =
  | 'staging'
  | 'searching'
  | 'checkout'
  | 'connecting'
  | 'verifying'
  | 'live'
  | 'unreachable'
  | 'multiple'

/** Product UI language. English is the default — this ships to the US market. */
export type Lang = 'en' | 'uk'

export type Project = 'empty' | 'generating' | 'built'
export type Chat = 'empty' | 'short' | 'long' | 'working' | 'error'

/**
 * One line of the conversation.
 *
 * User text is verbatim — whatever was typed. Canned Remixer replies carry both
 * languages, because the prototype can be demoed in either.
 */
export interface Message {
  id: number
  who: 'user' | 'ai'
  text: string | { en: string; uk: string }
  /**
   * What kind of turn this is. Plain text unless said otherwise:
   *  - 'clarify' — the agent asking for direction instead of building (opens the brief)
   *  - 'brief'   — the summary card of the answered questions (renders from `world.brief`)
   *  - 'ack'     — "Got it — …", the line that hands over to the build
   *  - 'build'   — the generation outline (renders from `world.build`). A MESSAGE and
   *                not a floating panel on purpose: it stays in the transcript once the
   *                page is done, as the record of what was built and of which pages are
   *                still waiting, and it scrolls away like any other turn.
   */
  kind?: 'text' | 'clarify' | 'brief' | 'ack' | 'build'
  /** Seconds the agent "thought" before this turn — Lovable prints "Thought for 21s". */
  thought?: number
}

/**
 * Axis D — the sites this customer has already generated.
 *
 * This is product truth, not navigation: it is what the Home page's dock reads to
 * decide whether it opens on "My projects" at all. An EMPTY list is the first-run
 * customer, who is shown templates instead — the two states drawn on Figma
 * 28364:40053 (one project + five empty slots) and 28375:43006 (templates).
 *
 * The list is deliberately not derived from `project`: that axis describes the ONE
 * project currently open in the builder, while this is the customer's shelf. A
 * customer can stand in a generating project and still own three finished sites.
 */
export interface HomeProject {
  id: string
  /** The card's title. Figma titles it with the live address, `synco.com`. */
  name: string
  /** Pre-rendered relative time: the prototype has no clock to derive one from. */
  updatedLabel: { en: string; uk: string }
  /** Which miniature site the card shows (see modules/home/thumbs.tsx). */
  thumb: ThumbId
}

/**
 * The one project Figma draws, verbatim (28364:40635 / 40636).
 *
 * ⚠️ `payments` is not a mistake. The board fills this card with template card 1's
 * screenshot (the PayNexus fintech page) — Figma placeholder reuse, the same habit
 * that gives two template cards the identical caption — and the page is signed off by
 * comparing renders side by side, so the drawn screenshot is the one to draw. A
 * dedicated `synco` thumbnail exists in thumbs.tsx for the day the real asset lands:
 * swap this one field and nothing else changes.
 */
export const DEMO_PROJECTS: HomeProject[] = [
  {
    id: 'synco',
    name: 'synco.com',
    updatedLabel: { en: 'Updated 1 hour ago', uk: 'Оновлено годину тому' },
    thumb: 'payments',
  },
]

/**
 * The pre-build brief: the questions Remixer asks when the first prompt is too thin
 * to build from (see modules/chat/brief.ts).
 *
 *  - 'asking'   the question panel is docked above the composer
 *  - 'planning' the answers are compiled into a PLAN and it is waiting to be approved
 *               (modules/chat/plan.ts) — nothing is generated in this state, which is
 *               the whole point: this is where Remixer differs from Lovable's brief
 *  - 'ready'    approved; the build may start
 */
export type BriefStatus = 'none' | 'asking' | 'planning' | 'ready'
export interface Brief {
  status: BriefStatus
  /** Which question the panel shows, 0-based. */
  step: number
  answers: Partial<Record<BriefKey, string>>
}
export const EMPTY_BRIEF: Brief = { status: 'none', step: 0, answers: {} }

/**
 * How far the FIRST generation has got — the axis behind the progress card
 * (modules/chat/build.ts, Figma 29480:48478).
 *
 * A generation is not one wait, it is a queue of named pieces of work, and the customer
 * is entitled to see which one is in hand. `at` indexes the section of the FIRST page
 * being written; `line` picks which of that section's work lines is on screen. `at`
 * equal to the section count means every section is done and the page is being
 * assembled — the beat just before the site appears in the canvas.
 *
 * Why it lives in the World and not in the card: the card must be inspectable without
 * waiting out a minute of clock, and staging "half-way through the hero" is exactly
 * what the scenario console is for. It also means a reload mid-build comes back where
 * it left (send.ts resumes the remaining beats from `at`).
 */
export interface Build {
  /** Section under construction. -1 = nothing is being generated. */
  at: number
  /** Which of that section's work lines is showing. */
  line: number
}
export const EMPTY_BUILD: Build = { at: -1, line: 0 }

/**
 * What Autopilot is proposing right now — the mode's entire behaviour.
 *
 * `mode: 'autopilot'` is a promise that Remixer LEADS (designer, 09.09.2026: "это режим
 * когда чат сам присылает форму с выбором и рекомендацией что делать дальше… для
 * пользователей которые вообще не шарят"). This axis is where that promise is kept: after
 * every edit that actually moved the site, a one-question panel docks above the composer —
 * the same panel the brief uses, arriving on its own instead of at the start.
 *
 * The proposal itself is never stored, only COMPILED (modules/chat/autopilot.ts) from the
 * brief's answers, from what has already been asked for and from whether the site is live.
 * Storing the text would let a proposal outlive the site it describes; compiling it means
 * the panel can only ever offer pages the plan actually promised.
 *
 *  - `open`    is a proposal docked?
 *  - `pick`    which option is chosen. A proposal ARRIVES with its recommendation already
 *              picked — that is what makes it a recommendation and not a quiz. Free text
 *              carries the same `other:` prefix the brief uses.
 *  - `started` pages Remixer has already been asked to start, so the next proposal never
 *              offers one twice. Without it the loop reads as broken: accept "Start on
 *              About" and the very next panel offers About again.
 */
export interface Suggest {
  /**
   * What is docked. The dock holds ONE thing, so this is a slot and not a set of flags:
   * Autopilot can put either a proposal or the satisfaction card in it, never both.
   */
  show: 'none' | 'proposal' | 'rating'
  pick: string
  started: string[]
  /**
   * Proposals the customer has actually acted on. The satisfaction card is asked after
   * the FIRST one (designer, 09.09.2026: "после первого Autopilot вопроса, когда
   * пользователь что-то выберет, нам нужно узнать у кастомера насколько он доволен").
   * Dismissing a proposal by typing does not count — nothing was answered.
   */
  taken: number
  /** Whether the satisfaction card has been put up. Asked ONCE, answered or skipped. */
  rated: boolean
  /** What they said, 1–10. null = never answered. */
  score: number | null
}
export const EMPTY_SUGGEST: Suggest = { show: 'none', pick: '', started: [], taken: 0, rated: false, score: null }

/**
 * The customer's own edits to the build plan (designer, 09.09.2026: "нужно добавить
 * возможность редактировать Build Plan текст как в обычном ворд документе, кастомер может
 * менять текст плана"). This closes the note the plan shipped with on 07.09 — the document was
 * read-only and said so.
 *
 * A LAYER OVER THE COMPILED PLAN, never a copy of it. `buildPlan` still writes the document
 * from the brief's answers; this only says which of its strings the customer has since made
 * their own. A stored copy would go stale the moment the plan's wording changed under it, and
 * both the card in the dock and the full-screen document render from one source — so an edit
 * has to reach both, which it does by being read at render rather than baked in.
 *
 *  - `text`  scalars by path: `title`, `goal`, `s0:h` (a section's heading), `s0:b` (its body)
 *  - `items` a section's bullets, ENTIRE, once any one of them was touched, keyed by the
 *            section's index. Whole-list rather than per-bullet because a document has to let
 *            you add and remove lines, and an override map keyed by position cannot say where
 *            a new line goes without inventing fractional keys.
 */
export interface PlanEdits {
  text: Record<string, string>
  items: Record<string, string[]>
  /** The structure the customer drew — see `OutlineEdits`. */
  outline: OutlineEdits
}

/**
 * THE ONE EDIT THAT REACHES THE BUILD (Figma 30115:55247; designer, 11.09.2026, on the
 * stack drawn in the plan: "как удалить страницу или секцию? как поменять местами?").
 *
 * Rewriting the plan's PROSE does not change what gets generated — the document is the
 * record of what was agreed, and `buildPlan` compiles it from the brief's answers. The
 * STRUCTURE is different: page and section names compile into `buildOutline`, which the
 * generation card and the Autopilot proposals already read. So renaming "Services" to
 * "Menu" here renames it in the card that builds it and in the proposal that offers it.
 *
 * A layer, like the rest of `PlanEdits`: absent means "as compiled", present means "the
 * customer drew this list". Present ENTIRE for the same reason the bullets are — a list
 * you can add to and reorder cannot be described by an override map keyed by position.
 */
export interface OutlineEdits {
  /** The page this pass builds, renamed. */
  home?: string
  /** Its sections, entire, once any one was touched. */
  sections?: string[]
  /** The pages waiting under it, entire. */
  rest?: string[]
}
export const EMPTY_PLAN_EDITS: PlanEdits = { text: {}, items: {}, outline: {} }

export interface World {
  /** Which language the simulated product renders in. */
  lang: Lang
  account: Account
  /** 1–30. Only meaningful while `account === 'trial'`. */
  trialDay: number
  billing: Billing
  credits: number
  /** The +1,000 first-month bonus. */
  bonus: boolean
  inventory: Inventory
  domain: DomainState
  project: Project
  /** Edits made since the last publish. Drives the stale-publish signal. */
  unpublished: number
  /**
   * How the chat behaves once there is a site — Figma 29697:54553, designer 08.09.2026.
   *
   *  · `autopilot` — Remixer leads. After almost every task it comes back with a card
   *    proposing the next one, so somebody who does not know what a website needs is
   *    walked through it. This is the default from the first generation onward.
   *  · `build` — the standard mode for people who know what they want: the chat does
   *    what it is asked and nothing else.
   *
   * Lovable has the same control with Build ↔ Plan; our Plan mode comes later (the plan
   * document already exists, but as a step in the first build, not as a composer mode).
   */
  mode: ChatMode
  /**
   * Whether this site has ever gone live.
   *
   * The Publish panel's title and its "Ready to put your site live?" banner hang off
   * THIS and not off `unpublished` (Figma 29697:36970): a live site with three pending
   * edits IS published — its panel says Publish and shows no banner — while a site
   * generated a minute ago and never published is not, whatever its edit count. Deriving
   * it from `unpublished > 0` would have flipped the title back to "Not published" the
   * moment somebody edited a live site.
   */
  published: boolean
  chat: Chat
  /** Every site this customer has generated. Empty = the first-run Home page. */
  projects: HomeProject[]
  /**
   * The live transcript, once the user has actually typed something.
   *
   * Empty means "render the scenario's demo thread" (see modules/chat/thread.ts);
   * the first sent message seeds this array with that demo thread and takes over,
   * after which `chat` is only a status flag. Deliberately NOT in the URL keys —
   * a shareable link carries the situation, not somebody's typing.
   */
  sent: Message[]
  /** Where the pre-build brief stands. Lives with the transcript, dies with it. */
  brief: Brief
  /** How far the first generation has got. Lives with the transcript, dies with it. */
  build: Build
  /** What Autopilot is proposing. Lives with the transcript, dies with it. */
  suggest: Suggest
  /** The customer's own edits to the plan. Lives with the transcript, dies with it. */
  planEdits: PlanEdits
}

/** The composer's mode switcher (Figma 29697:54553). See `World.mode`. */
export type ChatMode = 'autopilot' | 'build'

export const DEFAULT_WORLD: World = {
  lang: 'en',
  account: 'trial',
  trialDay: 22,
  billing: 'yearly',
  credits: 640,
  bonus: true,
  inventory: 'dh-free',
  domain: 'staging',
  project: 'built',
  unpublished: 0,
  mode: 'autopilot',
  /*
   * The demo customer's site — synco.com, the first card in the Home dock — has NOT been
   * published yet (designer, 08.09.2026: "у кастомера этот сайт первый в списке… пусть он
   * будет по умолчанию неопубликованным"). So the default demo opens the Publish panel on
   * the state the board draws: titled "Not published", carrying the nudge. `published: true`
   * now belongs to the presets that actually put a domain in front of the site.
   */
  published: false,
  chat: 'long',
  projects: DEMO_PROJECTS,
  sent: [],
  brief: EMPTY_BRIEF,
  build: EMPTY_BUILD,
  suggest: EMPTY_SUGGEST,
  planEdits: EMPTY_PLAN_EDITS,
}

/* ------------------------------------------------------------- selectors */

export const hasPlan = (w: World) => w.account === 'paid'
export const inTrial = (w: World) => w.account === 'trial'
/** AI actions need both an entitlement and a balance. */
export const canUseAI = (w: World) =>
  (w.account === 'trial' || w.account === 'paid') && w.credits > 0
/** Going live on a custom domain is a paid capability. Staging is always free. */
export const canConnectDomain = (w: World) => hasPlan(w)
export const isCustomDomainActive = (w: World) =>
  w.domain === 'connecting' || w.domain === 'verifying' ||
  w.domain === 'live' || w.domain === 'unreachable' || w.domain === 'multiple'
export const trialDaysLeft = (w: World) => Math.max(0, 30 - w.trialDay)
/** First run on the Home page: nothing generated yet, so the dock shows templates. */
export const hasProjects = (w: World) => w.projects.length > 0

/* ------------------------------------------------------------- validity */

export interface Violation {
  field: keyof World
  value: string
  reason: { en: string; uk: string }
}

/**
 * Combinations the real product cannot produce. The switcher greys these out and shows
 * the reason, so we never spend a morning designing a state that cannot exist.
 */
export function violations(w: World): Violation[] {
  const out: Violation[] = []

  if (isCustomDomainActive(w) && !hasPlan(w)) {
    out.push({
      field: 'domain',
      value: w.domain,
      reason: { en: 'A custom domain needs a paid plan — checkout comes first.', uk: 'Власний домен працює лише на платному плані — спершу оплата.' },
    })
  }
  if (w.account === 'anonymous' && w.project !== 'empty') {
    out.push({
      field: 'project',
      value: w.project,
      reason: { en: 'Before signup there is no project yet — only a blank canvas.', uk: 'До реєстрації проєкту ще немає — лише порожнє полотно.' },
    })
  }
  if (w.account === 'trial-expired' && w.credits > 0) {
    out.push({
      field: 'credits',
      value: String(w.credits),
      reason: { en: 'The trial ends with the credits — the balance must be zero.', uk: 'Тріал завершується разом із кредитами — баланс має бути нульовим.' },
    })
  }
  if (w.project === 'empty' && w.unpublished > 0) {
    out.push({
      field: 'unpublished',
      value: String(w.unpublished),
      reason: { en: 'Nothing to publish in an empty project.', uk: 'У порожньому проєкті нічого публікувати.' },
    })
  }
  if (w.project === 'empty' && w.published) {
    out.push({
      field: 'published',
      value: 'true',
      reason: { en: 'There is no site yet, so nothing can be live.', uk: 'Сайту ще немає — публікувати нічого.' },
    })
  }
  if (w.published === false && (w.domain === 'live' || w.domain === 'multiple')) {
    out.push({
      field: 'published',
      value: 'false',
      reason: {
        en: 'A domain cannot be live in front of a site that was never published.',
        uk: 'Домен не може бути живим перед сайтом, який ніколи не публікували.',
      },
    })
  }
  return out
}

/* ------------------------------------------------------------ URL coding */

/** Short keys keep the shareable link readable. */
const KEYS: Record<string, keyof World> = {
  l: 'lang', a: 'account', t: 'trialDay', b: 'billing', c: 'credits', z: 'bonus',
  i: 'inventory', d: 'domain', p: 'project', u: 'unpublished', v: 'published', h: 'chat',
  m: 'mode',
}

/**
 * `projects` is a LIST, so it cannot ride the scalar table above — but the Home
 * page's whole shape hangs off it, and a demo state that cannot be linked is a demo
 * state nobody else can open. What a link needs to carry is the axis, not the rows:
 * it travels as a COUNT (`w=0` is the first-run customer with an empty dock), and
 * anything else restores the drawn demo project.
 */
const PROJECTS_KEY = 'w'

export function worldToParams(w: World): string {
  const q = new URLSearchParams()
  for (const [short, key] of Object.entries(KEYS)) {
    const v = w[key]
    if (v !== DEFAULT_WORLD[key]) q.set(short, String(v))
  }
  if (w.projects.length !== DEFAULT_WORLD.projects.length) {
    q.set(PROJECTS_KEY, String(w.projects.length))
  }
  return q.toString()
}

export function paramsToWorld(search: string): Partial<World> {
  const q = new URLSearchParams(search)
  const w: Record<string, unknown> = {}
  for (const [short, key] of Object.entries(KEYS)) {
    const raw = q.get(short)
    if (raw === null) continue
    const ref = DEFAULT_WORLD[key]
    w[key] = typeof ref === 'number' ? Number(raw)
      : typeof ref === 'boolean' ? raw === 'true'
      : raw
  }
  const count = q.get(PROJECTS_KEY)
  if (count !== null) w.projects = DEMO_PROJECTS.slice(0, Math.max(0, Number(count) || 0))
  return w as Partial<World>
}

/* ----------------------------------------------------------------- store */

interface Store {
  world: World
  /** Name of the preset last applied, for the panel's active state. */
  preset: string | null
  set: (patch: Partial<World>, preset?: string | null) => void
  reset: () => void
}

/*
 * ⚠️ THE KEY CARRIES A VERSION, AND CHANGING A DEFAULT MEANS BUMPING IT.
 *
 * The whole world is written here on every change and read back over `DEFAULT_WORLD` on
 * load, so a browser that has already run an older build keeps ITS value for every axis —
 * including one whose default has since changed. That is exactly how 08.09.2026 went: the
 * demo site's `published` flag was flipped to false, the designer reloaded the artifact and
 * still saw the published panel, because his snapshot said `published: true` from an hour
 * earlier. Bumping the version retires those snapshots (the old entry is simply left
 * behind), which is the only way a changed default reaches somebody who has already opened
 * the prototype.
 */
/* v3: `planEdits` grew an `outline` layer (11.09.2026). A snapshot from v2 has no such
   key, and every reader of it would have to guard — the version is cheaper and is the
   rule this project already follows when a stored shape changes. */
const STORAGE_KEY = 'remixer-prototype/world/v3'

function initialWorld(): World {
  const fromUrl = paramsToWorld(window.location.search)
  let saved: Partial<World> = {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) saved = JSON.parse(raw) as Partial<World>
  } catch { /* ignore corrupt storage */ }

  if (Object.keys(fromUrl).length) {
    /*
     * The URL wins — it is the shareable state — but the transcript never
     * travels in it. A reload mid-send therefore used to restore chat:'working'
     * with an empty transcript: a working flag with no answer ever coming, the
     * glow burning and the composer locked. In exactly that case (and no other,
     * so a shared scenario link stays a clean stage) carry the transcript over
     * from storage; send.ts resumes the interrupted job from it on mount.
     */
    const resumable =
      fromUrl.chat === 'working' &&
      Array.isArray(saved.sent) &&
      saved.sent.length > 0 &&
      saved.sent[saved.sent.length - 1].who === 'user'
    return { ...DEFAULT_WORLD, ...fromUrl, ...(resumable ? { sent: saved.sent } : null) }
  }
  if (Object.keys(saved).length) return { ...DEFAULT_WORLD, ...saved }
  return DEFAULT_WORLD
}

/** Keep the address bar in step so any state is a shareable link.
 *  Both calls are best-effort: inside a sandboxed embed (the published artifact)
 *  history and storage may be walled off, and the prototype must still run. */
function syncUrl(w: World) {
  const qs = worldToParams(w)
  const url = window.location.pathname + (qs ? `?${qs}` : '')
  try { window.history.replaceState(null, '', url) } catch { /* ignore */ }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(w)) } catch { /* ignore */ }
}

export const useWorld = create<Store>((set, get) => ({
  world: initialWorld(),
  preset: null,
  set: (patch, preset = null) => {
    // Moving the chat axis means a different situation is being staged, so a
    // transcript typed under the old one is stale — unless the caller is the
    // composer, which always hands over both at once.
    if (patch.chat !== undefined && patch.sent === undefined) patch = { ...patch, sent: [] }
    // Staging a situation (chat axis moves, transcript cleared or absent) closes any
    // open brief with it. A live send that APPENDS to the transcript keeps the brief:
    // the summary card renders from it long after the questions are answered.
    if (patch.chat !== undefined && patch.brief === undefined && (patch.sent === undefined || patch.sent.length === 0)) {
      patch = { ...patch, brief: EMPTY_BRIEF }
    }
    // …and any generation in flight. Same test, same reason: a progress card left over
    // from the previous situation would tick against a project that no longer exists.
    if (patch.chat !== undefined && patch.build === undefined && (patch.sent === undefined || patch.sent.length === 0)) {
      patch = { ...patch, build: EMPTY_BUILD }
    }
    // …and anything Autopilot was proposing. A panel offering "Start on About" belongs to
    // one site's plan; carried into a staged situation it would offer pages that nobody
    // ever planned. Same test as the two above, for the same reason.
    if (patch.chat !== undefined && patch.suggest === undefined && (patch.sent === undefined || patch.sent.length === 0)) {
      patch = { ...patch, suggest: EMPTY_SUGGEST }
    }
    // …and the plan the customer had rewritten. It belongs to one brief; carried into a staged
    // situation it would put their sentences into somebody else's document.
    if (patch.chat !== undefined && patch.planEdits === undefined && (patch.sent === undefined || patch.sent.length === 0)) {
      patch = { ...patch, planEdits: EMPTY_PLAN_EDITS }
    }
    const world = { ...get().world, ...patch }
    syncUrl(world)
    set({ world, preset })
  },
  reset: () => {
    syncUrl(DEFAULT_WORLD)
    set({ world: DEFAULT_WORLD, preset: null })
  },
}))
