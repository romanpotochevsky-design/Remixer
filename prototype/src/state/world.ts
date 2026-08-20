/**
 * The prototype's single source of truth.
 *
 * Every screen renders from this object. Nothing keeps its own copy of "does the user
 * have a plan" — otherwise, a year from now, we would have twenty drifting versions of
 * the truth. Add a new dimension here first, then read it in the screens.
 */
import { create } from 'zustand'

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
  project: 'built',
  unpublished: 0,
  chat: 'long',
  sent: [],
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
  return out
}

/* ------------------------------------------------------------ URL coding */

/** Short keys keep the shareable link readable. */
const KEYS: Record<string, keyof World> = {
  l: 'lang', a: 'account', t: 'trialDay', b: 'billing', c: 'credits', z: 'bonus',
  i: 'inventory', d: 'domain', p: 'project', u: 'unpublished', h: 'chat',
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

const STORAGE_KEY = 'remixer-prototype/world'

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
    const world = { ...get().world, ...patch }
    syncUrl(world)
    set({ world, preset })
  },
  reset: () => {
    syncUrl(DEFAULT_WORLD)
    set({ world: DEFAULT_WORLD, preset: null })
  },
}))
