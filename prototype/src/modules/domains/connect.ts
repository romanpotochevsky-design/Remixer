/**
 * The connect clock — what happens after the customer pays, or attaches a domain they
 * already own.
 *
 * Connecting is not one wait, it is a queue of named waits, and the Publish panel names
 * each of them (designer, 13.09.2026: "после корзины все статусы и продолжение флоу
 * происходят тут в окне Publish"). This module is the clock that walks them, so the panel
 * can stay a pure reading of the world.
 *
 * ⚠️ THE TWO PATHS HAVE DIFFERENT PHYSICS, AND THE PROTOTYPE HAS TO SHOW IT.
 *
 *  · ATTACH SOMETHING THEY ALREADY OWN — the domain sits in their DreamHost account on
 *    our own nameservers, so the change is one we write to our own zone. DreamHost's DNS
 *    overview is explicit that there is nothing to paste: "If you purchased your domain at
 *    DreamHost … all of your DNS records are already configured to host your website and
 *    you do not need to make any changes" — root and www alike. Nothing has to reach
 *    anybody else first. This is the fast path.
 *
 *    ⚠️ FAST — BUT NOT FOR THE DOMAIN OUR CUSTOMER IS ACTUALLY CONNECTING, AND THE COPY
 *    MUST NOT PROMISE A MOMENT. DreamHost's own pages look contradictory here — "4–8 hours
 *    to resolve online" on one, a 5-minute TTL and "under five minutes" of downtime on
 *    another — and both are true, about different things. The zone's SOA MINIMUM is 14400
 *    seconds, and that value governs NEGATIVE caching: a name parked at "DNS Only" has
 *    never resolved to anything, so resolvers around the world are holding the answer
 *    "there is nothing here" for up to four hours. The five-minute TTL governs UPDATING a
 *    record that already answers, which is not this case. A domain somebody registered and
 *    parked — exactly what our customers connect — is therefore the slow half of the fast
 *    path. So: quick clock, and copy that promises a window and a check, never a moment.
 *    (Mechanism, not a guess: docs/research/dreamhost-domain-connect-research.md.)
 *
 *  · BUY A NEW NAME — two different clocks that our own facts kept conflating. The
 *    REGISTRY record is written "within 15 minutes of completing the purchase form"
 *    (verified), but a brand-new registration "typically takes 24–72 hours to be viewable
 *    online". Fifteen minutes and a working website are not the same event, so the bought
 *    path is two states, not one: `registering` (the registry) and then `propagating` (the
 *    world). It is the slow path, and it must survive the customer closing the tab —
 *    which it does, because every state of it is world state, not a variable in here.
 *
 * The padlock is a THIRD wait and it cannot start early: a certificate cannot be issued
 * until the address already answers at DreamHost, so `verifying` only ever follows one of
 * the two walks above, never runs beside it (10–30 minutes, product facts).
 *
 * Three rules, all borrowed from the engines that already exist here:
 *
 *  · WAITS ARE COMPRESSED BUT PROPORTIONAL (state/flows.ts). Not "how long is 72 hours" —
 *    a demo cannot hold that — but "which of these is the long one". See TIMELINES.
 *
 *  · A TICK RE-READS THE STORE AND STANDS DOWN IF THE WORLD MOVED (modules/chat/build.ts).
 *    The scenario console stages `connecting` deliberately, to be looked at; a clock that
 *    kept running would drift that staged state to live under the designer's cursor. Only
 *    a connect STARTED here ticks, and only while the domain axis still holds the state
 *    this clock put there.
 *
 *  · A WALK OUTLIVES THE DOCUMENT THAT STARTED IT (modules/chat/send.ts, `resumeInterrupted`).
 *    See THE TICKET below. The rule above is what makes this one hard, and the two are
 *    reconciled by the same idea: the clock only ever picks up work it can prove it left
 *    behind itself.
 */
import { useWorld, type DomainState } from '@/state/world'
import { useUI } from '@/state/ui'

/**
 * One leg of a walk: hold `from` for `at` ms from the start, then move to `to`.
 * `'finish'` is the last leg — where it lands depends on the SITE, see `settle`.
 */
type Leg = [from: DomainState, to: DomainState | 'finish', at: number]

/** Which of the two walks. Never a boolean: `retryConnect` takes the fast one for a name
 *  that was bought, so "bought" and "which timeline" are two different questions. */
type Path = 'attach' | 'buy'

/*
 * THE TWO TIMELINES, and what each beat stands for.
 *
 *   ATTACH   connecting   2.2s   our own records — quick, but up to ~4h on a parked name
 *                                (negative caching, see the header)
 *            verifying    6.6s   the certificate: 10–30 minutes
 *            ──────────── 8.8s total
 *
 *   BUY      registering  2.6s   the registry: "within 15 minutes" (verified)
 *            propagating  8.4s   the world: hours, up to 72 — the LONGEST beat, as in life
 *            verifying    6.6s   the certificate: 10–30 minutes, and it starts last
 *            ──────────── 17.6s total
 *
 * Buying is twice the walk of attaching, and the beat that makes the difference is the one
 * that really does take days. That proportion is the point; the seconds are not.
 */
const ATTACH: Leg[] = [
  ['connecting', 'verifying', 2200],
  ['verifying', 'finish', 8800],
]
const BUY: Leg[] = [
  ['registering', 'propagating', 2600],
  ['propagating', 'verifying', 11000],
  ['verifying', 'finish', 17600],
]
const LEGS: Record<Path, Leg[]> = { attach: ATTACH, buy: BUY }

let timers: number[] = []

const clear = () => {
  timers.forEach((t) => window.clearTimeout(t))
  timers = []
}

/* ------------------------------------------------------------------ the ticket */

/**
 * THE TICKET — the one thing the World deliberately does not carry.
 *
 * The bug it exists for: the walk lived in `setTimeout`s, which die with the document,
 * while every state it walks through is world state and PERSISTS (localStorage + URL).
 * Reload during `connecting` and the world came back mid-walk with no clock behind it —
 * the panel sat on "Usually quick… Keep editing — we'll keep checking" forever, which is
 * worse than a spinner: it is a promise the prototype visibly breaks. Two tabs on the same
 * state disagreed for the same reason — one had timers, one did not.
 *
 * ⚠️ AND THE OBVIOUS FIX IS THE ONE THE STAND-DOWN RULE WAS WRITTEN TO PREVENT. "On mount,
 * if the domain axis is transient, start walking it" would re-arm the clock over a state
 * the scenario console STAGED — the designer opens a link to `propagating` to look at the
 * card, and the card walks away from him. The world cannot tell the two apart: a staged
 * `propagating` and an interrupted `propagating` are byte-identical, because staging exists
 * precisely to reproduce what a real walk produces. Nothing in `World` distinguishes them,
 * and nothing in `World` should — a shareable link carries the situation, not the fact that
 * somebody's browser was in the middle of something.
 *
 * So the distinguishing bit lives HERE, outside the world, written only by `walk` and read
 * only by `resumeConnect`:
 *
 *   · A STAGED STATE CAN NEVER CARRY A TICKET. The scenario console, the flow engine and a
 *     shared URL all write the domain axis; none of them can reach this module. No ticket
 *     means nothing was ever started here, so there is nothing to resume and the clock
 *     stays down — the staged state stands still, exactly as it is meant to.
 *   · AN INTERRUPTED WALK ALWAYS LEAVES ONE, because `walk` writes it in the same
 *     synchronous tick as the world change it describes. (Same tick matters: another tab
 *     cannot run script between two writes of ours, so it never sees the world and the
 *     ticket disagree.)
 *
 * It is CONSUMED AT EVERY LOAD — read once, removed, and re-issued only for the legs this
 * document actually arms. A ticket therefore never accumulates: the only one that can
 * survive a reload is one describing a walk that is still owed beats.
 *
 * `startedAt` is wall clock, so the schedule is absolute rather than relative to a
 * document's lifetime. That is what makes two tabs agree: both derive the same beat times
 * from the same anchor, instead of each counting from its own load.
 */
interface Ticket {
  /** The name being walked. If the project's domain is no longer this, the ticket is debris. */
  domain: string
  /** Which timeline. The two are different lengths and a resume must never swap them. */
  path: Path
  /** Wall clock at the first beat — the anchor the whole schedule hangs off. */
  startedAt: number
  /** The leg that is armed and still owed. `LEGS[path][leg][0]` is what the world must read. */
  leg: number
}

/* Its own key, not a field of the world's snapshot: this is the clock's private note to
   itself and it must not travel in a shareable link or survive a world-version bump. */
const TICKET_KEY = 'remixer-prototype/connect/v1'

/** Every storage call is best-effort — inside a sandboxed embed it can throw, and the
 *  prototype must still run. A clock with no storage simply cannot resume, which is the
 *  safe half of the trade: it stands down rather than drifting something staged. */
function remember(t: Ticket) {
  try { localStorage.setItem(TICKET_KEY, JSON.stringify(t)) } catch { /* ignore */ }
}

function forget() {
  try { localStorage.removeItem(TICKET_KEY) } catch { /* ignore */ }
}

function recall(): Ticket | null {
  try {
    const raw = localStorage.getItem(TICKET_KEY)
    if (!raw) return null
    const t = JSON.parse(raw) as Partial<Ticket>
    // Anything that is not exactly the shape we wrote is debris from an older build.
    if (typeof t?.domain !== 'string' || typeof t.startedAt !== 'number' || typeof t.leg !== 'number') return null
    if (t.path !== 'attach' && t.path !== 'buy') return null
    return t as Ticket
  } catch { return null }
}

/* ------------------------------------------------------------------- the walk */

/**
 * Where a leg puts the world.
 *
 * THE PADLOCK IS THE LAST WAIT, AND WHAT IT LANDS ON IS A FACT ABOUT THE SITE.
 * A project that has never been published has nothing for a visitor to see, so the walk
 * ends in `ready` — domain correct, nothing wrong, one button left to press. That is the
 * state Lovable ships and the one a novice is most likely to sit in (failures.md №8). This
 * used to write `published: true` on the way past, which meant `ready` could not exist at
 * all: the clock published the site on the customer's behalf and the panel then titled
 * itself as if they had.
 */
function settle(to: DomainState | 'finish') {
  const s = useWorld.getState()
  s.set({ domain: to === 'finish' ? (s.world.published ? 'live' : 'ready') : to })
}

/**
 * Arm one timeline against one domain, from leg `from` onward.
 *
 * Every tick re-reads the store — see the header. `startedAt` is the walk's own anchor and
 * NOT "now": a resume passes the original one, so the beats keep their true positions on
 * the timeline instead of restarting it. A fresh start passes `Date.now()`, which makes
 * `elapsed` zero and leaves the two timelines exactly as they were measured.
 */
function walk(domain: string, path: Path, startedAt: number, from = 0) {
  const legs = LEGS[path]
  remember({ domain, path, startedAt, leg: from })
  const elapsed = Math.max(0, Date.now() - startedAt)
  for (let i = from; i < legs.length; i++) {
    const [expect, to, at] = legs[i]
    const next = i + 1
    timers.push(
      window.setTimeout(() => {
        const s = useWorld.getState()
        if (s.world.domain !== expect || s.world.customDomain !== domain) {
          /* The world moved under us — a scenario was staged, the domain was detached.
             The ticket dies with the walk it described: leaving it behind is how a
             stale note would later resume a clock over something staged by hand. */
          forget()
          return clear()
        }
        settle(to)
        if (to === 'finish') forget()
        else remember({ domain, path, startedAt, leg: next })
      }, Math.max(at - elapsed, 0)),
    )
  }
}

/**
 * Attach `domain` and walk it to live.
 *
 * `bought` marks a domain REGISTERED through us just now. It picks the timeline (the slow
 * one) and it is the only thing that starts the registrant-email clock (see world.icann):
 * attaching a domain you already own never does.
 */
export function startConnect(domain: string, opts: { bought?: boolean } = {}) {
  clear()
  const bought = opts.bought ?? false
  useWorld.getState().set({
    domain: bought ? 'registering' : 'connecting',
    customDomain: domain,
    icann: bought,
  })

  // The panel is where every one of these states is read, so it opens with the first.
  useUI.getState().togglePublish(true)
  walk(domain, bought ? 'buy' : 'attach', Date.now())
}

/**
 * "Fix this" on a domain that stopped answering — one more attempt, then the same walk.
 *
 * Always the FAST timeline, whoever registered the name: by the time a domain can stop
 * answering it exists in the registry and it has been round the world once, so replaying
 * `registering` would be theatre. And `icann` is left exactly as it stands — that clock
 * belongs to the registration, not to this attempt. (It used to be re-derived from the
 * flag here, which meant retrying a live domain whose email was still unconfirmed
 * silently re-registered it, and retrying after confirmation wiped the flag.)
 */
export function retryConnect(domain: string) {
  clear()
  useWorld.getState().set({ domain: 'connecting', customDomain: domain })
  useUI.getState().togglePublish(true)
  walk(domain, 'attach', Date.now())
}

/** Stop the clock — the domain was detached, or a scenario is being staged. */
export function stopConnect() {
  clear()
  forget()
}

/* ----------------------------------------------------------------- the resume */

/** Once per document. Exported as well as self-starting, so a future mount hook can call
 *  it without the risk of arming the same walk twice. */
let resumed = false

/**
 * Pick up a walk that a reload interrupted — the counterpart of `resumeInterrupted` in
 * modules/chat/send.ts, and the same bargain: the world persists, the timers do not.
 *
 * NO TICKET, NO RESUME. That single line is the whole of the stand-down rule as it applies
 * across a reload: a state the scenario console, a flow or a shared link put on the domain
 * axis has no ticket behind it, so this returns having touched nothing, and the state
 * stands still for as long as the designer wants to look at it.
 *
 * With a ticket, the walk is picked up WHERE THE CLOCK WOULD BE NOW, not where it stopped:
 * `startedAt` is wall clock, so the beats the reload ran past are already owed. Those are
 * settled in one step and the rest are armed at their true remaining distance. Three
 * consequences worth stating, because each one is a test:
 *
 *  · A reload of a second or two lands back inside the same beat and the walk finishes on
 *    its original schedule. The two timelines stay distinct — the ticket carries which one
 *    it is, so a bought name never finishes on the attached name's clock.
 *  · Come back long after (the tab was closed, the artifact reopened tomorrow) and every
 *    beat is owed, so the walk settles immediately on its end state. That is the honest
 *    reading of the copy — "we'll keep checking" — and the only alternative is the hang
 *    this function exists to remove.
 *  · Two tabs derive the same beat times from the same anchor, so they agree. Before the
 *    ticket they could not: one had timers, the other had none.
 *
 * The ticket is validated against the world before any of that. `leg` says which state the
 * world must be reading; if it is reading something else, this note belongs to a walk that
 * is over or to a different situation, and it is dropped without touching anything.
 *
 * ⚠️ THE WORLD IS NEVER REWOUND. `Math.max` against the ticket's own leg: if the clock
 * says "you should still be connecting" but the world already reads `verifying`, the world
 * wins. Otherwise a slow write or a clock nudged backwards would put the panel back into a
 * state the customer had already watched go by.
 */
export function resumeConnect() {
  if (resumed) return
  resumed = true

  const t = recall()
  if (!t) return
  /* Single use. Re-issued below for whatever this document actually arms, so a ticket can
     only ever outlive a document that still owed beats when it died. */
  forget()

  const legs = LEGS[t.path]
  if (t.leg < 0 || t.leg >= legs.length) return

  const { world } = useWorld.getState()
  if (world.customDomain !== t.domain) return
  if (world.domain !== legs[t.leg][0]) return

  const elapsed = Math.max(0, Date.now() - t.startedAt)
  let due = legs.findIndex(([, , at]) => at > elapsed)
  if (due < 0) due = legs.length
  const from = Math.max(t.leg, due)

  // Everything the reload ran past, settled in one step: the intermediate states are
  // already history, and replaying them would be theatre rather than a resume.
  if (from > t.leg) settle(legs[from - 1][1])
  if (from >= legs.length) return

  walk(t.domain, t.path, t.startedAt, from)
}

/*
 * Self-starting, because there is nowhere else for it to live: the Publish panel is the
 * only surface that reads these states and it is not mounted at load — the prototype opens
 * on the Home page. Running at import means the world is already correct by the time
 * anything renders, so there is no frame in which the panel shows a state the clock has
 * since moved past. The world store is created when `@/state/world` is evaluated, which is
 * before this line by the import above.
 */
resumeConnect()
