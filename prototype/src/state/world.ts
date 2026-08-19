/**
 * The prototype's single source of truth.
 *
 * Every screen renders from this object. Nothing keeps its own copy of "does the user
 * have a plan" — otherwise, a year from now, we would have twenty drifting versions of
 * the truth. Add a new dimension here first, then read it in the screens.
 */
import { create } from 'zustand'
import { CUSTOM_DOMAIN } from '@/data/domains'
import type { CartLine } from '@/data/cart'

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

/**
 * Axis B — what the current project's domain is doing.
 *
 * The order below is the real timeline, and the split between `registering`,
 * `propagating` and `connecting` is not decoration — it is DreamHost's own
 * documented behaviour, and it is the whole reason the buy flow and the
 * connect-what-you-own flow cannot share one shape:
 *
 *  - a domain **already in the account** sits on ns1/ns2/ns3.dreamhost.com and has
 *    been propagated for months. Pointing it at this site changes records on our
 *    own DNS, so it really is a matter of seconds → `connecting`.
 *  - a **freshly registered** domain is new to the global DNS. Registration itself
 *    finishes "within 15 minutes of completing the purchase form" (verified), but
 *    "new registrations' nameservers take 24-72 hrs to fully update" (verified).
 *    Calling that "a few seconds" would be a lie → `registering` then `propagating`.
 *
 * See docs/handoff/domain-flows-end-to-end.md §1.
 */
export type DomainState =
  | 'staging'
  | 'searching'
  | 'checkout'
  /** Paid; the registry is creating the domain. ≤15 min, nothing to click. */
  | 'registering'
  /** Registered, nameservers spreading across the internet. Hours, up to 72 h. */
  | 'propagating'
  /** A domain we already host being pointed at this site. Seconds. */
  | 'connecting'
  /** The domain answers; Let's Encrypt is still issuing. ~10-30 min. */
  | 'verifying'
  | 'live'
  /** Registrant email unverified. The site works, but the domain is at risk. */
  | 'icann-hold'
  | 'unreachable'
  | 'multiple'

/**
 * Does the domain actually answer for visitors right now?
 *
 * This is the one predicate the address field is allowed to trust. Everything
 * before `verifying` shows the staging address instead, because a field that
 * displays an address which does not resolve is the single most misleading thing
 * this panel could do.
 */
/**
 * Which of the two lines we can already see at the customer's registrar.
 *
 * ㉘ C is the reason this is per-line and not a boolean: somebody pastes one line, gets
 * called away, closes the tab and comes back tomorrow. "Half done" is a real state and
 * the flow has to be able to hold it.
 */
export type SetupLine = 'root' | 'www'

export interface ExternalSetup {
  domain: string
  /** external = registered somewhere else · dh-external-ns = ours, but its DNS lives away. */
  kind: 'external' | 'dh-external-ns'
  /** Where the lines get pasted. Named ONCE, here, so one domain never names two places. */
  host: string
  found: SetupLine[]
  /** A check is in flight — drives the button's waiting state. */
  checking: boolean
  /**
   * The customer has done something that could plausibly have started the work: pressed
   * Copy, or pressed the check button. Nothing is ever "found" before that. A screen that
   * fills itself in while you watch is the prototype inventing the user's action, and it
   * teaches the wrong thing to everyone who sees the demo.
   */
  armed: boolean
}

export const domainResolves = (d: DomainState) =>
  d === 'verifying' || d === 'live' || d === 'multiple' || d === 'icann-hold'

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
   * What is sitting in the hosting panel's cart.
   *
   * The cart is genuinely outside Remixer — panel.dreamhost.com owns that page — but
   * the prototype has to carry its contents to render it, and two surfaces read them
   * (the cart itself and, later, any "you have items waiting" hint we decide to show
   * in the builder). So it lives here, like every other piece of truth. Not in the
   * URL keys: a shared link carries the situation, not somebody's shopping.
   */
  cart: CartLine[]
  /**
   * The custom domain this project is going live on.
   *
   * Was a module constant, which meant the Publish panel said `fit-ration.com` while the
   * sheet the customer had just used said `emberandoak.com` — two surfaces describing one
   * domain and disagreeing. One value, read by both.
   */
  customDomain: string
  /**
   * An external domain part-way through its manual setup, or null.
   *
   * Deliberately NOT in the URL keys: the codec is scalar-only. It does persist to
   * localStorage, which is exactly what ㉘ C asks for — come back tomorrow and the
   * line you already pasted is still ticked.
   */
  externalSetup: ExternalSetup | null
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
  cart: [],
  customDomain: CUSTOM_DOMAIN,
  externalSetup: null,
  sent: [],
}

/* ----------------------------------------------------------- domain clock */

/**
 * Play a domain's real timeline out on a compressed clock.
 *
 * The prototype has no backend, but these states are not decorative — they are a
 * real sequence with real durations, and a demo that skips them would teach the
 * wrong thing about the product. So the chain runs by itself, on the same
 * "compressed but proportional" rule the flow engine uses: the long step stays
 * visibly the long one.
 *
 * Real durations, all verified (docs/handoff/domain-flows-end-to-end.md §1):
 *   registering  ≤ 15 min
 *   propagating  24-72 h   ← by far the longest, and the reason this flow must
 *                            survive the customer closing the tab
 *   verifying    10-30 min (Let's Encrypt)
 *
 * One chain at a time: starting a new one cancels whatever was in flight, so two
 * purchases in a row cannot interleave into a nonsense order.
 */
let domainTimers: ReturnType<typeof setTimeout>[] = []

export function runDomainTimeline(steps: Array<[DomainState, number]>) {
  domainTimers.forEach(clearTimeout)
  domainTimers = []
  let at = 0
  for (const [state, ms] of steps) {
    at += ms
    domainTimers.push(setTimeout(() => useWorld.getState().set({ domain: state }), at))
  }
}

/** Buying a brand-new name: registry, then the long propagation, then SSL. */
export const BUY_TIMELINE: Array<[DomainState, number]> = [
  ['registering', 400],
  ['propagating', 2600],
  ['verifying', 5200],
  ['live', 3400],
]

/** A domain we already host: no propagation step at all — that is the whole point. */
export const CONNECT_OWN_TIMELINE: Array<[DomainState, number]> = [
  ['connecting', 200],
  ['verifying', 2400],
  ['live', 3200],
]

/* ------------------------------------------------------------- selectors */

/**
 * Both lines are finally in at a third-party host.
 *
 * There is no `propagating` step here on purpose. That state models a NEWLY REGISTERED
 * domain's nameservers spreading across the internet — 24–72 h, verified. Changing one
 * address record at a registrar the domain already lives at is a different event, and we
 * have no verified number for it. So the flow states no duration at all between "the
 * lines are in" and "checking": inventing one would be the same sin as the board that
 * promised "seconds" for a new registration.
 */
export const EXTERNAL_LIVE_TIMELINE: Array<[DomainState, number]> = [
  ['verifying', 600],
  ['live', 3200],
]

/**
 * Begin (or resume) the manual setup of a domain held somewhere else.
 *
 * Re-entry RESUMES: ㉘ C and D both hinge on coming back to a job in progress, so calling
 * this again for the same domain must not wipe the line already pasted.
 */
export function startExternalSetup(domain: string, kind: ExternalSetup['kind'], host: string) {
  const cur = useWorld.getState().world.externalSetup
  if (cur?.domain === domain) return
  useWorld.getState().set({
    customDomain: domain,
    inventory: kind === 'dh-external-ns' ? 'dh-external-ns' : 'external-manual',
    /* `domain` deliberately stays 'staging'. Nothing resolves yet, so the address field
       must keep showing the staging host (㉘ A3: "поле адреса не врёт"). The screen this
       replaces wrote `domain: 'connecting'` here — the own-domain state, stamped onto a
       domain we do not control. */
    externalSetup: { domain, kind, host, found: [], checking: false, armed: false },
  })
}

/** Half-done setup outstanding — the panel shows a row for it, the dashed card hides. */
export const setupPending = (w: World) => !!w.externalSetup && w.externalSetup.found.length < 2

export const hasPlan = (w: World) => w.account === 'paid'
export const inTrial = (w: World) => w.account === 'trial'
/** AI actions need both an entitlement and a balance. */
export const canUseAI = (w: World) =>
  (w.account === 'trial' || w.account === 'paid') && w.credits > 0
/** Going live on a custom domain is a paid capability. Staging is always free. */
export const canConnectDomain = (w: World) => hasPlan(w)
export const isCustomDomainActive = (w: World) =>
  w.domain === 'registering' || w.domain === 'propagating' ||
  w.domain === 'connecting' || w.domain === 'verifying' ||
  w.domain === 'live' || w.domain === 'icann-hold' ||
  w.domain === 'unreachable' || w.domain === 'multiple'
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
  n: 'customDomain',
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
    // A named preset means somebody deliberately staged a different world, and a
    // cart filled under the previous one has nothing to do with it. Keyed on the
    // preset rather than on any field, because the composer patches the world on
    // every send and must never wipe the cart.
    if (preset !== null && patch.cart === undefined) patch = { ...patch, cart: [] }
    const world = { ...get().world, ...patch }
    syncUrl(world)
    set({ world, preset })
  },
  reset: () => {
    syncUrl(DEFAULT_WORLD)
    set({ world: DEFAULT_WORLD, preset: null })
  },
}))
