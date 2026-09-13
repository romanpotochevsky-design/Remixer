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
 *    ⚠️ FAST, BUT WE DO NOT KNOW HOW FAST, AND THE COPY MUST NOT PROMISE A MOMENT.
 *    Three of our own sources disagree about this one state: board 27071:20574 says
 *    "On DreamHost · connects in a few seconds"; the DreamHost domain-hosting FAQ says
 *    "If you recently added hosting to the domain, it can take anywhere from 4–8 hours to
 *    resolve online" (and adding the site to the web server "may take up to 15 minutes");
 *    another KB page claims a 5-minute default TTL and "usually less than 5 minutes" of
 *    downtime. That contradiction is DreamHost's, not ours, and it is not resolvable from
 *    here. So the clock is quick — this really is the fast path — while the panel's copy
 *    promises a WINDOW and a check that runs on its own, never a moment. Do not "fix" it
 *    back into a promise.
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
 * Two rules, both borrowed from the engines that already exist here:
 *
 *  · WAITS ARE COMPRESSED BUT PROPORTIONAL (state/flows.ts). Not "how long is 72 hours" —
 *    a demo cannot hold that — but "which of these is the long one". See TIMELINES.
 *
 *  · A TICK RE-READS THE STORE AND STANDS DOWN IF THE WORLD MOVED (modules/chat/build.ts).
 *    The scenario console stages `connecting` deliberately, to be looked at; a clock that
 *    kept running would drift that staged state to live under the designer's cursor. Only
 *    a connect STARTED here ticks, and only while the domain axis still holds the state
 *    this clock put there.
 */
import { useWorld, type DomainState } from '@/state/world'
import { useUI } from '@/state/ui'

/**
 * One leg of a walk: hold `from` for `at` ms from the start, then move to `to`.
 * `'finish'` is the last leg — where it lands depends on the SITE, see `walk`.
 */
type Leg = [from: DomainState, to: DomainState | 'finish', at: number]

/*
 * THE TWO TIMELINES, and what each beat stands for.
 *
 *   ATTACH   connecting   2.2s   our own records, five-minute lifetime — seconds to minutes
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

let timers: number[] = []

const clear = () => {
  timers.forEach((t) => window.clearTimeout(t))
  timers = []
}

/** Arm one timeline against one domain. Every tick re-reads the store — see the header. */
function walk(domain: string, legs: Leg[]) {
  for (const [from, to, at] of legs) {
    timers.push(
      window.setTimeout(() => {
        const s = useWorld.getState()
        if (s.world.domain !== from || s.world.customDomain !== domain) return clear()
        if (to !== 'finish') return s.set({ domain: to })
        /*
         * THE PADLOCK IS THE LAST WAIT, AND WHAT IT LANDS ON IS A FACT ABOUT THE SITE.
         * A project that has never been published has nothing for a visitor to see, so
         * the walk ends in `ready` — domain correct, nothing wrong, one button left to
         * press. That is the state Lovable ships and the one a novice is most likely to
         * sit in (failures.md №8). This used to write `published: true` on the way past,
         * which meant `ready` could not exist at all: the clock published the site on the
         * customer's behalf and the panel then titled itself as if they had.
         */
        s.set({ domain: s.world.published ? 'live' : 'ready' })
      }, at),
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
  walk(domain, bought ? BUY : ATTACH)
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
  walk(domain, ATTACH)
}

/** Stop the clock — the domain was detached, or a scenario is being staged. */
export function stopConnect() {
  clear()
}
