/**
 * The prototype's single source of truth.
 *
 * Every screen renders from this object. Nothing keeps its own copy of "does the user
 * have a plan" — otherwise, a year from now, we would have twenty drifting versions of
 * the truth. Add a new dimension here first, then read it in the screens.
 */
import { create } from 'zustand'
/* The demo project's default custom domain. It is DATA, so it lives in data/domains.ts;
   this file owns the FIELD that holds it. No cycle: data/domains.ts imports nothing. */
import { CUSTOM_DOMAIN, STAGING_HOST } from '../data/domains'

/* ------------------------------------------------------------------ axes */

/** Where the customer stands with us commercially. */
export type Account =
  | 'anonymous'
  | 'trial'
  | 'trial-expired'
  | 'paid'
  /**
   * The subscription existed and the renewal payment did not go through.
   * Named by the designer 20 Aug 2026 (docs/features/account-and-billing.md §2)
   * as the fifth value this axis was missing.
   *
   * ⚠️ What happens to a LIVE SITE on a custom domain in this state is a
   * BLOCKING product question owned by DreamHost billing, not by design: does
   * the site go dark at once, fall back to the `*.remixer.ai` address (DH-302),
   * sit in a grace period of N days, and does a domain bought through us keep
   * living on its own? Until billing answers, this value carries ONLY what is
   * true under every possible answer: entitlement behaves like `trial-expired`
   * (AI off, neither the site nor the project destroyed), and no screen says
   * anything about whether the site is still up. Do not fill that silence by
   * guessing — fill §2 first, from billing.
   */
  | 'payment-failed'

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
  /**
   * Authoritative DNS sits with a provider that supports Domain Connect —
   * GoDaddy, IONOS, Squarespace, NameSilo, WordPress.com and, contrary to what this
   * comment said before, **Cloudflare** (it ships its own Domain Connect docs page and
   * is one of the three providers Shopify's "Connect automatically" supports).
   * Cloudflare still needs its proxy set to "DNS only" before verification passes —
   * automatable, but with a triage card. One-click needs Entri; see
   * docs/features/domains/research/connect.md §4.
   */
  | 'external-dc'
  /** No Domain Connect on the authoritative side (Namecheap is the canonical case) —
   *  guided manual records only. */
  | 'external-manual'

/** Axis B — what the current project's domain is doing. */
export type DomainState =
  | 'staging'
  | 'searching'
  /*
   * ⚠️ `checkout` USED TO BE HERE and was removed 20 Aug 2026. Recorded rather than
   * quietly deleted, so nobody adds it back from the same reasoning that put it in.
   *
   * Why it went: paying for a domain is not a state of the PROJECT'S DOMAIN, it is a
   * sheet that springs out of a `Buy` / `Connect` press. Its six drawn states live on
   * two other axes entirely — `kind` × does-the-account-have-a-plan (modules/domains/
   * DomainModal.tsx) — and neither of them is this one. So no consumer of this axis
   * ever listed the value: it rendered bit-for-bit as `staging`, and the only thing
   * clicking it in the console changed was the console's own sentence.
   * The real path to that sheet is one click from the domains dashboard, which is also
   * how the customer gets there.
   */
  | 'connecting'
  | 'verifying'
  /** The padlock is being issued. A REAL state, not a label on `verifying`: the
   *  certificate cannot be issued until the address already answers here (FACTS
   *  DH-301), so "Connected to your site" and "Security (SSL) on" are two events
   *  with a wait between them. Added 20 Aug 2026 — before it existed the checklist
   *  ticked both at once and deleted the one state it exists to explain
   *  (docs/features/domains/STATES.md, "three items, four stages"). */
  | 'securing'
  /** The address works and the domain is attached — and the project has NEVER been
   *  published, so nothing is live and nothing is broken. Probably the most common
   *  state a novice reaches (docs/features/domains/STATES.md, `ready`): our Launchpad
   *  offers a domain before the first publish, where Lovable refuses to connect one
   *  until you have published, so falling in here is easier for us than for them.
   *  Its verb is `Publish` — the one action that resolves it. Added 20 Aug 2026;
   *  before it existed this situation rendered as success or as a spinner. */
  | 'ready'
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
}

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
  /**
   * WHICH custom domain is attached to the project. `domain` above is the PHASE
   * (connecting · securing · live …); this is the name. Two fields, on purpose:
   * they answer different questions and they change at different moments.
   *
   * It exists because the string had no home at all. The Publish panel printed the
   * `CUSTOM_DOMAIN` constant, so connecting `odesa-coffee-roasters.com` still showed
   * `fit-ration.com`; the selected name meanwhile sat in `useUI().activeDomain`, which
   * is NAVIGATION — it is nulled by opening the dashboard and overwritten by typing in
   * the search field, so "the site's address" could be changed by browsing. Every door
   * that moves `domain` to `connecting` now writes this in the same `set()`.
   */
  customDomain: string
  project: Project
  /** Edits made since the last publish. Drives the stale-publish signal. */
  unpublished: number
  chat: Chat
  /**
   * The live transcript, once the user has actually typed something.
   *
   * Empty means "render the scenario's demo thread" (see modules/chat/thread.ts);
   * the first sent message seeds this array with that demo thread and takes over,
   * after which `chat` is only a status flag. Deliberately NOT in the URL keys —
   * a shareable link carries the situation, not somebody's typing.
   */
  sent: Message[]
}

export const DEFAULT_WORLD: World = {
  lang: 'en',
  account: 'trial',
  trialDay: 22,
  billing: 'yearly',
  credits: 640,
  bonus: true,
  inventory: 'dh-free',
  domain: 'staging',
  customDomain: CUSTOM_DOMAIN,
  project: 'built',
  unpublished: 0,
  chat: 'long',
  sent: [],
}

/* ------------------------------------------------------------- selectors */

/** `payment-failed` is deliberately NOT a plan: the renewal did not happen, so
 *  entitlement mirrors `trial-expired`. Says nothing about the live site — see
 *  the `payment-failed` note above and docs/features/account-and-billing.md §2. */
export const hasPlan = (w: World) => w.account === 'paid'
export const inTrial = (w: World) => w.account === 'trial'
/** The dunning state, for the one line and one verb it is allowed to render. */
export const paymentFailed = (w: World) => w.account === 'payment-failed'
/** AI actions need both an entitlement and a balance.
 *  `payment-failed` is absent on purpose — AI off, exactly as for a lapsed trial. */
export const canUseAI = (w: World) =>
  (w.account === 'trial' || w.account === 'paid') && w.credits > 0
/** Going live on a custom domain is a paid capability. Staging is always free. */
export const canConnectDomain = (w: World) => hasPlan(w)
export const isCustomDomainActive = (w: World) =>
  w.domain === 'connecting' || w.domain === 'verifying' || w.domain === 'securing' ||
  /* `ready` counts: the custom domain is already attached, only the publish is missing,
     so it needs the paid plan exactly like the others (the violation this feeds). */
  w.domain === 'ready' ||
  w.domain === 'live' || w.domain === 'unreachable' || w.domain === 'multiple'
export const trialDaysLeft = (w: World) => Math.max(0, 30 - w.trialDay)

/*
 * TWO address selectors, not one — and that is a decision, not a leftover.
 *
 * "Where does the site answer?" and "which domain is attached?" are different
 * questions, and collapsing them is what let the address drift in the first place.
 * On `connecting` / `verifying` / `securing` they DISAGREE ON PURPOSE:
 *   · the permanent chrome (App.tsx) prints staging, because that is the only address
 *     the site actually answers on until the connection lands;
 *   · the Publish panel prints the domain being connected, because that is the thing
 *     the person is standing there watching (docs/features/publish/README.md,
 *     "Connecting {domain}"; docs/features/domains/STATES.md, `connecting`).
 * Do NOT fold them into one selector "for consistency": that deletes one of two
 * correct behaviours, and both are load-bearing.
 */

/** Where the site answers RIGHT NOW — what the permanent chrome prints. The custom
 *  domain only once it is really serving the site; otherwise staging (FACTS DH-302). */
export const siteAddress = (w: World) =>
  w.domain === 'ready' || w.domain === 'live' || w.domain === 'multiple'
    ? w.customDomain
    : STAGING_HOST

/** Which domain is ATTACHED to the project, including one still connecting — what the
 *  Publish panel shows. `null` means there is no custom domain, only staging. */
export const projectDomain = (w: World) => (isCustomDomainActive(w) ? w.customDomain : null)

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

  /*
   * The paid-plan gate on a custom domain — true for everyone who has never had
   * a plan. `payment-failed` is excluded, and the exclusion is the honest move,
   * not an oversight: whether a custom domain survives a failed renewal is the
   * open billing question (docs/features/account-and-billing.md §2). Calling the
   * combination impossible here would invent the answer AND print it in the
   * console as a settled reason. So the console lets you stage payment-failed
   * with a live domain — which is precisely the state billing has to rule on.
   * When §2 is answered, this is the line that changes.
   */
  if (isCustomDomainActive(w) && !hasPlan(w) && w.account !== 'payment-failed') {
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
  /*
   * `ready` MEANS the project has never been published (see the axis value above), so a
   * built project sitting in it cannot have an empty pending-changes count: everything
   * the site is made of is still waiting for the first publish. Staged, it made the
   * Publish panel offer `Visit site` for a site nobody has ever published — and no way
   * to publish it. Filed under `unpublished` because that is the value that has to give
   * way: the situation is real, the zero is not.
   *
   * ⚠️ NARROW ON PURPOSE — `ready` only. `live` with nothing unpublished is the normal
   * success state and `staging` with nothing unpublished is a fresh project; widening
   * this to the rest of the axis would strike out both.
   */
  if (w.project === 'built' && w.domain === 'ready' && w.unpublished === 0) {
    out.push({
      field: 'unpublished',
      value: String(w.unpublished),
      reason: {
        en: 'Nothing has ever been published on this domain — the built site’s changes are all still unpublished.',
        uk: 'На цьому домені ще нічого не публікували — усі зміни готового сайту досі неопубліковані.',
      },
    })
  }
  return out
}

/* -------------------------------------------------------- untrusted input */

/*
 * Every legal value of every CLOSED string axis, readable at runtime.
 *
 * ⚠️ This is not a second list that can drift from the unions above — `Record<Lang, true>`
 * accepts an object with EXACTLY the union's members, so leaving a value out or inventing
 * one is a `tsc` error. Edit an axis and this block stops compiling until it follows.
 * (The same trick already guards the console's sentence: `Record<World['domain'], Text>`
 * in state/scenarios.ts.) The union stays the single source of truth; this only makes it
 * visible to code that has to validate a string it did not write.
 *
 * `customDomain` is deliberately absent: it is an open axis — any domain name is legal.
 */
const values = <T extends string>(members: Record<T, true>): ReadonlySet<string> =>
  new Set(Object.keys(members))

const AXIS_VALUES = {
  lang: values<Lang>({ en: true, uk: true }),
  account: values<Account>({
    anonymous: true, trial: true, 'trial-expired': true, paid: true, 'payment-failed': true,
  }),
  billing: values<Billing>({ monthly: true, yearly: true }),
  inventory: values<Inventory>({
    none: true, 'dh-free': true, 'dh-in-use': true, 'dh-external-ns': true,
    'external-dc': true, 'external-manual': true,
  }),
  domain: values<DomainState>({
    staging: true, searching: true, connecting: true, verifying: true, securing: true,
    ready: true, live: true, unreachable: true, multiple: true,
  }),
  project: values<Project>({ empty: true, generating: true, built: true }),
  chat: values<Chat>({ empty: true, short: true, long: true, working: true, error: true }),
} satisfies Partial<Record<keyof World, ReadonlySet<string>>>

/**
 * Is this value one this axis can actually hold?
 *
 * ⚠️ THE BLACK-SCREEN CLASS — do not remove this on the grounds that "the types
 * already say so". They do not: a URL and a `localStorage` blob are strings written by
 * an OLDER BUILD, and nothing checks them. `checkout` was a legal value of `domain`
 * yesterday; a link copied then still carries `?d=checkout`, and unvalidated it lands
 * in the world as-is — where the console's `Record<DomainState, Text>` lookup returns
 * `undefined`, `.en` throws inside render, and the whole tree unmounts. A link shared
 * yesterday must never be able to kill the page today (docs/global/AGREEMENTS.md §5,
 * gate 2 — written after exactly this failure, commit 4b7992d).
 * Numbers get the same treatment: `?c=abc` is `NaN`, which renders as "NaN" forever.
 */
function legal(key: keyof World, value: unknown): boolean {
  const allowed = AXIS_VALUES[key as keyof typeof AXIS_VALUES] as ReadonlySet<string> | undefined
  if (allowed) return typeof value === 'string' && allowed.has(value)
  if (typeof DEFAULT_WORLD[key] === 'number') return typeof value === 'number' && Number.isFinite(value)
  // No axis has a legal empty string: `?n=` would print a blank address bar.
  if (typeof DEFAULT_WORLD[key] === 'string') return typeof value === 'string' && value.trim() !== ''
  return true
}

/** Drop anything an older build (or a hand-edited link) left that this one cannot hold.
 *  What is dropped simply keeps its default — a stale key degrades, it never throws. */
function sanitize(patch: Partial<World>): Partial<World> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in DEFAULT_WORLD)) continue
    if (legal(key as keyof World, value)) out[key] = value
  }
  return out as Partial<World>
}

/* ------------------------------------------------------------ URL coding */

/** Short keys keep the shareable link readable. */
const KEYS: Record<string, keyof World> = {
  l: 'lang', a: 'account', t: 'trialDay', b: 'billing', c: 'credits', z: 'bonus',
  i: 'inventory', d: 'domain', n: 'customDomain', p: 'project', u: 'unpublished', h: 'chat',
}

export function worldToParams(w: World): string {
  const q = new URLSearchParams()
  for (const [short, key] of Object.entries(KEYS)) {
    const v = w[key]
    if (v !== DEFAULT_WORLD[key]) q.set(short, String(v))
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
  // Every string here came out of somebody's address bar; see `legal` above.
  return sanitize(w as Partial<World>)
}

/* ----------------------------------------------------------------- store */

interface Store {
  world: World
  /** Name of the preset last applied, for the panel's active state. */
  preset: string | null
  set: (patch: Partial<World>, preset?: string | null) => void
  reset: () => void
}

const STORAGE_KEY = 'remixer-prototype/world'

function initialWorld(): World {
  const fromUrl = paramsToWorld(window.location.search)
  let saved: Partial<World> = {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    // Same door, same guard: this blob was written by whatever build ran last, which
    // may be a build whose axes had values this one has never heard of.
    if (raw) saved = sanitize(JSON.parse(raw) as Partial<World>)
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
    const world = { ...get().world, ...patch }
    syncUrl(world)
    set({ world, preset })
  },
  reset: () => {
    syncUrl(DEFAULT_WORLD)
    set({ world: DEFAULT_WORLD, preset: null })
  },
}))
