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
 *    path is two states, not one: `provisioning` (the registry) and then `propagating` (the
 *    world). It is the slow path, and it must survive the customer closing the tab —
 *    which it does, because every state of it is world state, not a variable in here.
 *
 *    ⚠️ AND IT DOES NOT START AT ALL UNTIL THE REGISTRANT EMAIL IS CONFIRMED. A DreamHost
 *    developer, asked directly (14.09.2026): the domain can be connected, publishing
 *    probably goes through, but «вебсайт поідеї не буде працювати якщо запаблішити» — and,
 *    on "so you can publish, but without confirming the email the link will not work",
 *    «так». The name does not resolve AT ALL while the confirmation is owed. So the
 *    confirmation is a GATE on this walk, not a clock beside it — see THE GATE below.
 *
 * The padlock is a THIRD wait and it cannot start early: a certificate cannot be issued
 * until the address already answers at DreamHost, so the spread only ever follows one of
 * the two walks above, never runs beside it (10–30 minutes, product facts).
 *
 * Three rules, all borrowed from the engines that already exist here:
 *
 *  · WAITS ARE COMPRESSED BUT PROPORTIONAL. Not "how long is 72 hours" —
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
import { useWorld, type DomainState, type World } from '@/state/world'
import { useUI } from '@/state/ui'

/**
 * One leg of a walk: hold `from` for `at` ms from the start, then move to `to`.
 * `'finish'` marks the LAST leg — every walk ends in the same place, see `settle`, so the
 * word says "this is the end of the walk" and nothing about where it lands.
 */
type Leg = [from: DomainState, to: DomainState | 'finish', at: number]

/**
 * Which walk. Never a boolean: `retryConnect` takes the fast one for a name that was
 * bought, so "bought" and "which timeline" are two different questions.
 *
 * ⚠️ AND `repair` SHARES ATTACH'S LEGS WHILE ENDING SOMEWHERE ELSE, so it cannot just be
 * `attach` again (see `settle`). A repair puts back a connection that was ALREADY carrying
 * the site; a fresh connect hands the customer a working address and waits for the press.
 * Same six seconds, two different endings — and the ending has to survive a reload, so it
 * is the WALK's identity that carries it, not a flag somebody sets beside it.
 */
type Path = 'attach' | 'buy' | 'repair'

/*
 * THE TWO TIMELINES, and what each beat stands for.
 *
 * ⚠️ THREE STATUSES EXIST, AND ONLY THREE (designer, 14.09.2026): `provisioning` while the
 * name is being registered, `connecting` while it is being pointed at the project, and
 * `propagating` while it spreads. The first and the last belong ONLY to a name bought
 * through us — a domain the customer already owns has exactly one beat, `connecting`.
 * The certificate beat that used to sit at the end of both walks ("Secure padlock is
 * switching on") is GONE: it was a stage of ours, not of the product.
 *
 *   ATTACH   connecting   6.0s   pointing our own records at the site — quick, but up to
 *                                ~4h on a parked name (negative caching, see the header)
 *            ──────────── 6.0s total
 *
 *   BUY      provisioning 2.6s   the registry: "within 15 minutes" (verified)
 *            connecting   6.0s   the same pointing, once the name exists
 *            propagating 17.6s   the world: hours, up to 72 — the LONGEST beat, as in life
 *            ready       17.6s   not a beat at all: the same instant, and the state the
 *                                gate below holds while a confirmation is owed
 *            ──────────── 17.6s total
 *
 * Buying is three times the walk of attaching, and the beat that makes the difference is
 * the one that really does take days. That proportion is the point; the seconds are not.
 *
 * ⚠️ THE FOURTH BUY LEG CARRIES NO TIME. It is due at the same 17.6s as the one before it
 * — two `setTimeout`s at one delay, which the spec runs in the order they were armed — and
 * it exists so that the park has a leg of its own to be re-armed at: `resumeFromPark`
 * matches the ticket's leg against the state the world is actually reading, so a walk
 * parked at `ready` needs a leg whose `from` is `ready`. Without it the release found the
 * world at `ready` where the ticket said `propagating` and quietly stood down, leaving a
 * confirmed registration stuck one press short of live.
 */
const ATTACH: Leg[] = [
  ['connecting', 'finish', 6000],
]
const BUY: Leg[] = [
  ['provisioning', 'connecting', 2600],
  ['connecting', 'propagating', 8600],
  ['propagating', 'ready', 17600],
  ['ready', 'finish', 17600],
]
const LEGS: Record<Path, Leg[]> = { attach: ATTACH, buy: BUY, repair: ATTACH }

/*
 * ─────────────────────────────── THE GATE ───────────────────────────────
 *
 * WHERE THE BOUGHT WALK STOPS UNTIL SOMEBODY OPENS THEIR MAIL.
 *
 * The registrant-email confirmation used to run as a SECOND clock beside this one:
 * `startConnect` set `icann` in the same write as `provisioning` and then nothing in the
 * walk ever read it again, so the walk carried straight on to `connecting`, `propagating`
 * and `live` while the confirmation was still owed. The product therefore manufactured,
 * reliably and on its happy path, a domain the topbar painted green and the panel called
 * live — in front of a name that, on the developer's answer (see the header), does not
 * resolve at all. It also ran the whole spread, which is the world being told about an
 * address that cannot be validated.
 *
 * So the flag is a GATE: the walk HOLDS while `icann` stands, and clearing it (the
 * simulated letter in App.tsx, or the console's own toggle — both are one `set`) releases
 * the park so the remaining beats play at their true remaining distance.
 *
 * ⚠️ AND THE GATE STANDS AT THE END OF THE WALK, NOT AT ITS FIRST BEAT (designer,
 * 14.09.2026: the confirmation notice is shown only once the domain has connected — while
 * it has not, we do not mention the mail at all). It used to hold at `provisioning`, which
 * put the one card the customer must act on in the one window where the product had also
 * just promised to be busy on its own: the panel said "the registry has the order" and,
 * under it, "the address starts working once you confirm your email" — the second of which
 * asks for a press while the first says there is nothing to do. Holding at the END puts
 * the letter where it is the ONLY thing left, and it costs nothing in honesty: the three
 * stages are OUR side of the work (the order, the pointing, the spread) and they really do
 * complete; what the unconfirmed mail withholds is the name ANSWERING, which is exactly
 * what `ready` means — connected, correct, and not yet open.
 *
 * ⚠️ AND SINCE 15.09.2026 THE GATE NO LONGER GUARDS `live` — IT GUARDS THE WALK. It used
 * to be the only thing standing between an unconfirmed name and a green chip, because the
 * last leg landed on `live` for anyone who had published before. That landing is gone
 * (see `settle`): no walk reaches `live` at all now, so `live` + `icann` is out of this
 * clock's reach whatever the gate does, and the one door left carries its own guard
 * (`publishNow`). What the gate still does is keep the walk from writing over a park —
 * the ticket stays honest across a reload, and a release replays the remainder at its
 * true remaining length instead of settling an hour of owed beats in one frame.
 *
 * `ready` + `icann` is the pairing that panel has always been written for, and it is now
 * the one the product produces rather than one only the console could stage.
 */
const PARKED_AT: DomainState = 'ready'
const parked = (w: World) => w.domain === PARKED_AT && w.icann

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
 * ⚠️ EVERY WALK ENDS AT `ready`, WHOEVER THE CUSTOMER IS — CONNECTING IS NOT PUBLISHING
 * (designer, 15.09.2026, watching an attach on a site he had already published: «почему
 * после привязки кастомного домена, у меня в окне паблиш статус Опубликовано? типа как
 * будто сразу после привязки кастомного домена произошла сразу публикация автоматически
 * перед капотом?»). It had: this function read `published && !icann ? 'live' : 'ready'`,
 * so a site that had ever been out went LIVE on the new name the moment the pointing
 * finished — a release nobody asked for, announced by a panel that then titled itself
 * "Published" for a publish that never happened.
 *
 * The two acts are different things. This walk makes the ADDRESS work; putting the site
 * on it is a press. Nobody would accept a registrar that moved their site the instant a
 * record was written, and the customer who attaches a domain is the one person in the
 * flow who already has something to lose by it.
 *
 * Which is also what the boards say. 30289:59972 draws the END of a connect as a green
 * "{domain} is connected" card over a button reading `Publish to {domain}` — a drawn
 * state that the old landing made unreachable for the commonest customer of all (the one
 * who had already published) and reachable only by the one who had not. Same walk, two
 * different endings, and the one that skipped the press was the default.
 *
 * So `live` now has exactly ONE door in this product: that button (`publishNow` in
 * PublishPanel, where the `!icann` guard this branch used to carry already lives, for the
 * same reason — a name owing its registrant confirmation does not answer, so publishing
 * puts the site out on the FREE address and must not move the domain axis at all).
 *
 * `ready` is therefore the terminal state of both timelines: domain correct, nothing
 * wrong, one button left to press. It is the state Lovable ships and the one a novice is
 * most likely to sit in (failures.md №8).
 *
 * ⚠️ WITH ONE EXCEPTION, AND IT IS THE OPPOSITE CASE, NOT A LOOPHOLE: a REPAIR. `Fix this`
 * on `unreachable` is "it worked and it stopped" — the site was published on that name and
 * the address broke under it — so bringing the address back is not a release, it is the end
 * of an outage, and asking for a press to "move your site onto it" would be false about a
 * site that is already there. So a repair lands where it came from: `live` if the site has
 * been published, `ready` if it never has (`live` in front of a site that was never
 * published is the pairing `violations()` calls impossible, and rightly).
 */
function settle(to: DomainState | 'finish', path: Path) {
  const s = useWorld.getState()
  const finish: DomainState = path === 'repair' && s.world.published ? 'live' : 'ready'
  s.set({ domain: to === 'finish' ? finish : to })
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
        /*
         * THE GATE. The beat is due and the confirmation is not in, so the walk stops
         * here rather than settling — see THE GATE above. The remaining timers come
         * down with it (left armed, the next one would fire against a world still
         * reading `ready`, mistake it for a staged state and destroy the ticket
         * this park depends on), and the ticket is re-issued AT THIS LEG: it is still
         * owed, which is exactly what makes a reload come back parked instead of
         * running the rest of the walk off a stale anchor.
         */
        if (parked(s.world)) {
          clear()
          return remember({ domain, path, startedAt, leg: i })
        }
        settle(to, path)
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
 *
 * ⚠️ Neither call walks a domain to `live` any more — that is a press, not a clock (see
 * `settle`). A bought name goes through all three stages and stops at `ready`, and while
 * the flag this write sets still stands it stops there with the letter as the only thing
 * on screen (see THE GATE). Nothing else has to know: the walk arms exactly as before.
 */
export function startConnect(domain: string, opts: { bought?: boolean } = {}) {
  clear()
  const bought = opts.bought ?? false
  useWorld.getState().set({
    domain: bought ? 'provisioning' : 'connecting',
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
 * `provisioning` would be theatre. And `icann` is left exactly as it stands — that clock
 * belongs to the registration, not to this attempt. (It used to be re-derived from the
 * flag here, which meant retrying a live domain whose email was still unconfirmed
 * silently re-registered it, and retrying after confirmation wiped the flag.)
 */
export function retryConnect(domain: string) {
  clear()
  useWorld.getState().set({ domain: 'connecting', customDomain: domain })
  useUI.getState().togglePublish(true)
  walk(domain, 'repair', Date.now())
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
  /* A ticket written by an older build can name a walk this one does not have. */
  if (!legs || t.leg < 0 || t.leg >= legs.length) return

  const { world } = useWorld.getState()
  if (world.customDomain !== t.domain) return
  if (world.domain !== legs[t.leg][0]) return

  /*
   * ⚠️ A PARKED WALK IS NOT A LATE ONE, AND THE ARITHMETIC BELOW CANNOT TELL THEM APART.
   * `startedAt` is wall clock, so after an hour at the gate every beat reads as owed and
   * the block below would settle the lot in one step — landing `live` on a name that does
   * not resolve, which is the whole defect, re-entered through the resume door. The park
   * is world truth (`provisioning` + `icann`), so it survives a reload by simply being
   * read: re-issue the ticket at the same leg and stand down. `resumeFromPark` is the
   * only thing that may pick it up again, and only when the confirmation lands.
   */
  if (parked(world)) return remember(t)

  const elapsed = Math.max(0, Date.now() - t.startedAt)
  let due = legs.findIndex(([, , at]) => at > elapsed)
  if (due < 0) due = legs.length
  const from = Math.max(t.leg, due)

  // Everything the reload ran past, settled in one step: the intermediate states are
  // already history, and replaying them would be theatre rather than a resume.
  if (from > t.leg) settle(legs[from - 1][1], t.path)
  if (from >= legs.length) return

  walk(t.domain, t.path, t.startedAt, from)
}

/* -------------------------------------------------------- releasing the gate */

/**
 * The confirmation landed — let the bought walk go.
 *
 * NO TICKET, NO WALK, exactly as at load. A world staged at `provisioning` + `icann` from
 * the console or a shared link has never been through `startConnect`, so flipping the
 * clock off there leaves it standing — which is what staging is for. A domain the
 * customer actually bought carries the ticket the park re-issued, and that one moves.
 *
 * ⚠️ THE ANCHOR IS RE-CUT, NOT REUSED. `startedAt` is wall clock and the park is open
 * ended: keep the original and every remaining beat is already owed, so the walk would
 * jump straight to its end state the instant the letter is pressed — the customer would
 * watch a purchase go from "registering" to "live" in one frame. Anchoring so that the
 * PARKED leg falls due now replays the rest at its true remaining length: the registry
 * beat is genuinely finished (it ran before the gate), and what is left — the world, then
 * the padlock — plays as measured.
 */
function resumeFromPark() {
  const t = recall()
  if (!t) return

  const { world } = useWorld.getState()
  const legs = LEGS[t.path]
  if (!legs || t.leg < 0 || t.leg >= legs.length) return
  if (world.customDomain !== t.domain) return
  if (world.domain !== legs[t.leg][0]) return

  clear()
  walk(t.domain, t.path, Date.now() - legs[t.leg][2], t.leg)
}

/*
 * THE PARK'S ONLY WATCHER — it does the two jobs a running beat does for itself.
 *
 * Watched at the store rather than at either button: the simulated letter (App.tsx) and
 * the console's "Email unconfirmed" toggle write the same `set({ icann: false })`, and a
 * third way out — a flow step, a shared link — would write it too. One release, wherever
 * the press happens, instead of a `resumeFromPark()` call remembered at every call site.
 *
 * ⚠️ AND IT ALSO STANDS DOWN WHEN THE WORLD MOVES, which is the header's second rule and
 * which a parked walk cannot obey on its own: it has no timers left, so nothing of its own
 * ever re-reads the store. Its ticket would simply sit in storage — and then a scenario or
 * a flow that staged `provisioning` on the same name again would hand that stale note to
 * the release below and start a real clock racing the steps somebody is presenting. A
 * running walk already gets this for free (every tick checks, and drops the ticket if the
 * world moved past it); the park gets it here.
 */
useWorld.subscribe((s, prev) => {
  if (!parked(prev.world) || parked(s.world)) return
  const released =
    s.world.domain === PARKED_AT && !s.world.icann && s.world.customDomain === prev.world.customDomain
  if (released) resumeFromPark()
  else { clear(); forget() }
})

/*
 * Self-starting, because there is nowhere else for it to live: the Publish panel is the
 * only surface that reads these states and it is not mounted at load — the prototype opens
 * on the Home page. Running at import means the world is already correct by the time
 * anything renders, so there is no frame in which the panel shows a state the clock has
 * since moved past. The world store is created when `@/state/world` is evaluated, which is
 * before this line by the import above.
 */
resumeConnect()
