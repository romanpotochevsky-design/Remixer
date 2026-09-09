/**
 * Sending a message — the one action that moves the whole shell at once.
 *
 * A send is not just a bubble: the builder goes to work (edge glow on the canvas),
 * credits are spent, and the result is an unpublished change. Wiring all of that
 * here, outside React, keeps the flow identical no matter who triggers it — the
 * composer today, a scripted flow or a keyboard shortcut tomorrow.
 *
 * Since 06.09.2026 there is a fork at the very first message. A prompt with nothing
 * to design from ("Build me a website.") does NOT start a build: Remixer asks for
 * direction and docks four questions above the composer (modules/chat/brief.ts).
 * Only the submitted answers start the build. Copied from Lovable's live flow,
 * frame by frame — see docs/audits/lovable-prebuild-flow/.
 */
import { useWorld, canUseAI, EMPTY_BRIEF, EMPTY_SUGGEST, EMPTY_PLAN_EDITS, type Message, type Suggest } from '@/state/world'
import type { Text } from '@/i18n'
import { useUI } from '@/state/ui'
import { baselineThread, replyTo, streamDuration } from './thread'
import {
  isWeakPrompt, BRIEF_INTRO, BRIEF_STATUS, BRIEF_QUESTIONS, briefAck, briefDone, OTHER,
  type BriefKey, type BriefAnswers,
} from './brief'
import { buildBeats, BUILD_INTRO } from './build'
import { nextProposal, optionOf, recommended, leadingDone, ratingSaid, ratingThanks, AUTOPILOT_OFF } from './autopilot'

/*
 * The demo's clock — slowed on 07.09.2026 at the designer's call ("медленнее, ближе к
 * правде"), because the first cut read as a magic trick rather than as work. Lovable's
 * real numbers off the recording: ~15s to the first sentence, ~21s and ~29s to the
 * questions, and a build still running when the 90s recording ended. Those are
 * unwatchable in a demo; these are the same SHAPE at about a third of the length —
 * long enough that the agent is visibly considering, short enough to click through in
 * front of a CEO. The whole thin-prompt path is now ~13s of waiting plus whatever
 * answering the four questions takes.
 */
/** How long Remixer "works" before answering an ordinary edit. */
const THINKING_MS = 3400
/** Thinking before the questions — and the number printed as "Thought for Ns". */
const CLARIFY_MS = 5200
/** Summary card → the plan appearing. Remixer is "writing" it in this window. */
const PLAN_MS = 2400
/** Start Building → "Got it — …". */
const ACK_MS = 2000
/** "Got it" → the outline card appearing, so the two arrivals read as two beats. */
const CARD_MS = 900
/*
 * The generation itself is NOT a single wait any more — it is a minute of named beats
 * driven by `buildBeats` (build.ts, Figma 29480:48478). The old constant here was 5.6
 * seconds of edge glow, which is fine for a fake and useless as a design: the real thing
 * takes five to ten minutes, and an unlabelled spinner that long is indistinguishable
 * from a hang. One minute, hardcoded, is the designer's call (07.09.2026).
 */

/** Credits per chat edit. Illustrative — no published per-message price exists;
 *  what matters is that the toolbar balance visibly moves when AI does work.
 *  The questions themselves cost nothing: asking is free, building is metered. */
const COST = 10

let seq = 1000
let pending: ReturnType<typeof setTimeout> | null = null

function schedule(fn: () => void, ms: number) {
  if (pending) clearTimeout(pending)
  pending = setTimeout(() => { pending = null; fn() }, ms)
}

/*
 * The generation's own clock, separate from `pending`.
 *
 * `pending` is one slot, and the build is a CHAIN of thirteen beats — it needs a timer
 * of its own or each beat would cancel whatever else the flow had queued. Kept module
 * level, like `pending`, so it can be stopped from anywhere that invalidates the run.
 */
let buildTimer: ReturnType<typeof setTimeout> | null = null

function stopBuildClock() {
  if (buildTimer) { clearTimeout(buildTimer); buildTimer = null }
}

/**
 * Walk the beats of the first generation, writing each one to `world.build`.
 *
 * The schedule is expanded up front (build.ts) rather than chained closure by closure,
 * which is what makes it resumable: a reload mid-build restores `world.build` from
 * storage and this picks up at that index instead of restarting the minute.
 *
 * ⚠️ Every tick re-reads the store and bails unless the project is still generating.
 * `world.set` treats a staged `chat` axis as a new situation and wipes `build` with it
 * (world.ts), so the scenario console — or a new site started from the Home page — can
 * pull the ground out from under a running clock. Without this guard the old run would
 * keep writing beats into a project that no longer exists.
 */
function runBuild(answers: BriefAnswers, from = 0) {
  stopBuildClock()
  const list = buildBeats(answers)
  const step = (i: number) => {
    const now = useWorld.getState()
    if (now.world.project !== 'generating') { stopBuildClock(); return }
    if (i >= list.length) { finishBuild(answers); return }
    const beat = list[i]
    now.set({ build: { at: beat.at, line: beat.line } }, now.preset)
    buildTimer = setTimeout(() => { buildTimer = null; step(i + 1) }, beat.hold)
  }
  step(Math.max(0, Math.min(from, list.length - 1)))
}

/** Where in the schedule a restored `world.build` sits. -1 → start from the top. */
function beatIndex(answers: BriefAnswers, at: number, line: number) {
  return buildBeats(answers).findIndex((b) => b.at === at && b.line === line)
}

/**
 * The next message id — always past everything already in the transcript.
 *
 * `seq` is a module variable and dies with the page, but `world.sent` persists
 * (localStorage) and comes back with ids 1001+. A bare `++seq` therefore reused
 * ids after a reopen, and ChatPanel keys its animations on ids: the "new"
 * message was already in its seen-set, so the send bubble and the typing reveal
 * silently didn't play. That was the "animations sometimes just don't happen"
 * bug — deterministic after any reopen that restores the transcript (clean-URL
 * open, or a reload mid-send), self-healing once new ids outran the old ones.
 */
function nextId(over: Message[]): number {
  for (const m of over) if (m.id > seq) seq = m.id
  return ++seq
}

export function sendMessage(raw: string, reply?: Text) {
  const text = raw.trim()
  if (!text) return

  const { world, set, preset } = useWorld.getState()
  if (!canUseAI(world)) return

  // The first typed message freezes the scenario's demo transcript into `sent`
  // and takes over from there; `chat` is only a status flag afterwards.
  const base = world.sent.length ? world.sent : baselineThread(world.chat)
  const mine: Message = { id: nextId(base), who: 'user', text }
  const fresh = world.project === 'empty'

  // The fork. Nothing built yet and nothing to build from → ask, don't guess.
  if (fresh && isWeakPrompt(text)) {
    set({ sent: [...base, mine], chat: 'working', brief: EMPTY_BRIEF, suggest: closed(world.suggest) }, preset)
    // The mirror of the line below: a build needs a canvas, and asking does not.
    // Nothing will be generated for as long as this turn lasts, so the canvas
    // collapses and the chat takes the whole shell — which is where the questions
    // are read. Said HERE rather than derived downstream because this send is also
    // the doorway from the Home page: `startBuild` runs the fork and only then does
    // `openBuilder` mount the shell, so by the time the shell exists the answer is
    // already in hand and it never opens on a canvas it has to take back.
    useUI.getState().setPreviewOpen(false)
    schedule(askForDirection, CLARIFY_MS)
    return
  }

  // A message typed while the questions are open overrides them ("Tell Remixer
  // what to do instead…"): the panel goes away and the prompt is taken as given.
  set(
    {
      sent: [...base, mine],
      chat: 'working',
      /* ⚠️ ONLY AN OPEN BRIEF IS OVERRIDDEN — an ANSWERED one is a record, not a panel.
         This cleared the brief on every send, and the cards that render FROM it rewrote
         themselves the next time anybody typed: the outline card sitting in the transcript
         swapped its section names (measured: "Product grid · Cart & checkout" became "What
         you offer · Enquiry form", the fallback every skipped question falls to) and the
         summary card would have gone to "Remixer's pick" in every row. That is the same
         mistake `world.set` was taught to avoid for staged situations — a live send that
         APPENDS keeps the brief — made again here by hand. Autopilot is what exposed it:
         accepting a proposal posts a message, so the card rewrote itself mid-flow. */
      brief: world.brief.status === 'asking' || world.brief.status === 'planning' ? EMPTY_BRIEF : world.brief,
      /* Typing is the soft way out of a proposal, and the reason its footer spends its
         second button on turning the MODE off rather than on a "not now": the composer
         inside the panel already is the "not now". What is dismissed is the question —
         never `started`, or the next proposal would offer a page twice. */
      suggest: closed(world.suggest),
      // An empty project starts building on the first message, like the real thing.
      ...(fresh ? { project: 'generating' as const } : null),
    },
    preset,
  )
  /* THE CANVAS STAYS AWAY FOR THE BUILD. A preview is a preview OF a page, and for the
     minute the first one takes there is no page — so the chat keeps the whole shell and
     the outline card gets its 800 (designer, 07.09.2026: "нет смысла показывать превью
     сайта, пока не сгенерируется страница первая"). It opens by itself the moment that
     page exists (App.tsx). Said here as well as there because this send is the doorway
     from the Home page and runs before the shell mounts. */
  if (fresh) useUI.getState().setPreviewOpen(false)
  // A first build and an edit are different jobs and no longer share a reply. An edit
  // gets its canned answer and is done in 3.4s; a first build gets a minute of named
  // work, because that is what the real one costs.
  if (fresh) schedule(startFirstBuild, THINKING_MS)
  else schedule(() => deliverAnswer(text, reply), THINKING_MS)
}

/**
 * The first generation on a prompt strong enough to skip the brief — "Bella's Bakery"
 * typed into the Home page, say. Remixer says what it is doing, the outline card lands,
 * and the minute starts.
 *
 * There is no brief behind this path, so the outline falls back to the first option of
 * every question, exactly as the plan does when a question is skipped.
 */
function startFirstBuild() {
  const now = useWorld.getState()
  const intro: Message = {
    id: nextId(now.world.sent),
    who: 'ai',
    /* 'ack' rather than plain text: it is a hand-over line, not an answer to rate. */
    kind: 'ack',
    thought: Math.round(THINKING_MS / 1000),
    text: BUILD_INTRO,
  }
  now.set({ sent: [...now.world.sent, intro], chat: 'working' }, now.preset)
  schedule(() => openOutline(now.world.brief.answers), CARD_MS)
}

/**
 * The outline card arrives and the clock starts.
 *
 * Both entry points land here — the brief's `Start Building` and the strong-prompt path — so
 * the generation has exactly one beginning however the customer got to it.
 */
function openOutline(answers: BriefAnswers) {
  const now = useWorld.getState()
  const card: Message = { id: nextId(now.world.sent), who: 'ai', kind: 'build', text: '' }
  now.set(
    {
      sent: [...now.world.sent, card],
      chat: 'working',
      project: 'generating',
      brief: now.world.brief,
      build: { at: 0, line: 0 },
    },
    now.preset,
  )
  runBuild(answers)
}

function deliverAnswer(prompt: string, reply?: Text) {
  const now = useWorld.getState()
  /* An accepted Autopilot proposal brings its own answer, because only it knows which page
     the row named; everything else is matched on keywords as before. */
  const answer: Message = { id: nextId(now.world.sent), who: 'ai', text: reply ?? replyTo(prompt) }
  now.set(
    {
      sent: [...now.world.sent, answer],
      chat: 'long',
      project: 'built',
      credits: Math.max(0, now.world.credits - COST),
      unpublished: now.world.unpublished + 1,
    },
    now.preset,
  )
  /* THE SITE MOVED, SO AUTOPILOT HAS SOMETHING TO LEAD ON FROM. Only here and at the end
     of the first build — never after a question that changed nothing. */
  schedule(offerSuggestion, SUGGEST_MS)
}

/* ------------------------------------------------------------- the brief */

/**
 * How long the customer gets with the line BEFORE the questions dock over it.
 *
 * The line and the panel used to land in the same commit, and since a docked form takes the
 * thread down to half (index.css `.chat-dim`), the one sentence explaining why nothing is
 * being built was dimmed while it was still writing itself. The designer caught it on his own
 * build (09.09.2026): "пользователь не успеет прочитать этот текст… нужно дать несколько
 * секунд, то есть добавить небольшую паузу перед появлением формы".
 *
 * Counted from when the line has FINISHED writing itself, not from when it starts — the
 * reveal is a second of that on its own, and `streamDuration` knows how long it takes for
 * whatever the copy happens to say (thread.ts). So this number is the reading, and only the
 * reading: turn this one to give more or less of it.
 */
const READ_MS = 2600

/** The agent declines to guess. Free — nothing was built. */
function askForDirection() {
  const now = useWorld.getState()
  const ask: Message = {
    id: nextId(now.world.sent),
    who: 'ai',
    kind: 'clarify',
    thought: Math.round(CLARIFY_MS / 1000),
    text: BRIEF_INTRO,
  }
  now.set({ sent: [...now.world.sent, ask], chat: 'long' }, now.preset)
  schedule(openQuestions, streamDuration(say(BRIEF_INTRO)) + READ_MS)
}

/**
 * …and only then asks. Nothing else moves here: the axis alone opens the panel, so none of
 * `world.set`'s staged-situation rules can fire and take the transcript with them.
 *
 * The guard is for the customer who answered in the composer instead of waiting — that send
 * clears the brief and takes the timer slot with it, so this can only arrive late, never over
 * the top of a build that has already started.
 */
function openQuestions() {
  const now = useWorld.getState()
  if (now.world.project !== 'empty') return
  now.set({ brief: { status: 'asking', step: 0, answers: {} } }, now.preset)
}

/** Record one answer. An empty value clears it (the question will count as skipped). */
export function answerBrief(key: BriefKey, value: string) {
  const { world, set, preset } = useWorld.getState()
  const answers: BriefAnswers = { ...world.brief.answers }
  if (value) answers[key] = value
  else delete answers[key]
  set({ brief: { ...world.brief, answers } }, preset)
}

export function briefGoTo(step: number) {
  const { world, set, preset } = useWorld.getState()
  const clamped = Math.max(0, Math.min(step, BRIEF_QUESTIONS.length - 1))
  set({ brief: { ...world.brief, step: clamped } }, preset)
}

/** "Next" — or "Submit" on the last question. */
export function briefNext() {
  const { world } = useWorld.getState()
  if (world.brief.step >= BRIEF_QUESTIONS.length - 1) briefSubmit()
  else briefGoTo(world.brief.step + 1)
}

/** "Skip all": whatever was answered stays; the rest is Remixer's pick. */
export function briefSkipAll() {
  briefSubmit()
}

/**
 * Submit. The panel goes away, a summary card lands in the thread — and then the PLAN,
 * which is where this flow stops being a copy of Lovable's.
 *
 * Nothing is generated here. The answers are compiled into a document (plan.ts), it is
 * docked where the questions were, and the build waits for `approvePlan`. Asking four
 * questions and then building silently would ask the customer to trust that the answers
 * landed; the plan makes them checkable, before a build is spent on them.
 */
export function briefSubmit() {
  const now = useWorld.getState()
  if (now.world.brief.status !== 'asking') return
  const card: Message = { id: nextId(now.world.sent), who: 'ai', kind: 'brief', text: BRIEF_STATUS }
  now.set(
    { sent: [...now.world.sent, card], chat: 'working', brief: { ...now.world.brief, status: 'planning' } },
    now.preset,
  )
  schedule(offerPlan, PLAN_MS)
}

/**
 * The plan has finished "writing" — it is on screen and the turn is the customer's.
 *
 * ⚠️ `sent` AND `brief` ride along even though neither changes. `world.set` reads a patch
 * that moves the `chat` axis without a transcript as STAGING A SITUATION: it clears `sent`
 * and closes the brief. Written as `set({ chat: 'long' })` this line wiped both — the
 * thread fell back to the scenario's demo transcript and the plan card never mounted,
 * because the brief it renders from was gone. Any live write that touches `chat` has to
 * hand over the transcript with it.
 */
function offerPlan() {
  const now = useWorld.getState()
  /* `chat` leaves 'working': the shimmer and the locked composer would say Remixer is
     busy, when in fact it is waiting. The plan card is the only thing moving now. */
  now.set({ chat: 'long', sent: now.world.sent, brief: now.world.brief }, now.preset)
}

/**
 * `Review` — read the plan at full size. There is no site to preview yet, so the canvas
 * is free; the chat narrows back to its split width and the document takes the rest.
 * Exactly the shape the designer asked for (07.09.2026).
 */
export function reviewPlan() {
  const ui = useUI.getState()
  ui.setPreviewOpen(true)
  ui.openSurface('plan')
}

/** ✕ in the plan surface — back to the dock card, canvas out of the way again. */
export function closePlanReview() {
  const ui = useUI.getState()
  ui.closeSurface()
  ui.setPreviewOpen(false)
}

/**
 * `Start Building` — the one press that spends a build. From the dock card or from the plan
 * surface; both land here, and the surface closes itself on the way through so the canvas
 * is showing the site by the time the glow starts.
 */
export function approvePlan() {
  const now = useWorld.getState()
  if (now.world.brief.status !== 'planning') return
  const answers = now.world.brief.answers
  const ui = useUI.getState()
  if (ui.surface === 'plan') ui.closeSurface()
  /* `sent` again: see offerPlan — a `chat` patch without it empties the transcript. */
  now.set({ chat: 'working', sent: now.world.sent, brief: { ...now.world.brief, status: 'ready' } }, now.preset)
  schedule(() => acknowledge(answers), ACK_MS)
}

function acknowledge(answers: BriefAnswers) {
  const now = useWorld.getState()
  const ack: Message = { id: nextId(now.world.sent), who: 'ai', kind: 'ack', text: briefAck(answers) }
  now.set({ sent: [...now.world.sent, ack], chat: 'working', brief: now.world.brief }, now.preset)
  /* No canvas for the build — see sendMessage. The outline card is the whole of it, and
     the chat's full width is where it reads. The user can still pull the canvas open with
     the arrow; this is a default, not a lock. */
  useUI.getState().setPreviewOpen(false)
  /* Two beats, not one: the line types itself, and then the card springs in under it.
     Landing both in the same frame made the arrival read as a single jump. */
  schedule(() => openOutline(answers), CARD_MS)
}

/**
 * The page is finished: the site appears in the canvas and the turn goes back.
 *
 * ⚠️ `build` rides along unchanged ON PURPOSE. The outline card stays in the transcript
 * as the record of what was built — every section green, the other pages still waiting —
 * so it must keep the state it ended on. Left out of the patch it would survive anyway
 * (a `chat` move WITH a non-empty transcript is not a staged situation), but stating it
 * is the difference between a decision and an accident.
 */
function finishBuild(answers: BriefAnswers) {
  stopBuildClock()
  const now = useWorld.getState()
  /* Leading changes what this line has to do: the proposal that follows it owns the list of
     what to do next, so the line stops naming one (see `leadingDone`). */
  const text = now.world.mode === 'autopilot' ? leadingDone(answers) : briefDone(answers)
  const done: Message = { id: nextId(now.world.sent), who: 'ai', text }
  now.set(
    {
      sent: [...now.world.sent, done],
      chat: 'long',
      project: 'built',
      brief: now.world.brief,
      build: now.world.build,
      credits: Math.max(0, now.world.credits - COST),
      unpublished: now.world.unpublished + 1,
    },
    now.preset,
  )
  schedule(offerSuggestion, SUGGEST_MS)
}

/* ------------------------------------------------------------ autopilot */

/**
 * How long after an answer lands the proposal rises.
 *
 * Long enough for the answer to have finished typing (`.stream-word` caps a reply at
 * ~1.1s): a panel growing out of the composer while the words above it are still
 * appearing gives the eye two things to follow and it follows neither. The two motions
 * are sequenced for the same reason the thread's scroll waits out the send spring.
 */
const SUGGEST_MS = 1300

/** The dock emptied — the question goes, everything Autopilot remembers stays. */
const closed = (s: Suggest): Suggest => ({ ...s, show: 'none', pick: '' })

/** Whichever language the prototype is being demoed in. */
const say = (text: Text) => text[useWorld.getState().world.lang]

/**
 * Dock a proposal, if Autopilot has one to make.
 *
 * Every gate here is a reason NOT to lead: the mode is off, there is no site to lead on,
 * the dock already belongs to the brief or to the plan, or the ladder has run out
 * (autopilot.ts returns null). Nothing here decides WHAT to propose — that is compiled
 * from the plan the customer already agreed to.
 */
function offerSuggestion() {
  const now = useWorld.getState()
  const w = now.world
  if (w.mode !== 'autopilot' || w.project !== 'built') return
  if (w.brief.status === 'asking' || w.brief.status === 'planning') return

  /*
   * THE SATISFACTION CARD COMES FIRST, ONCE — after the first proposal the customer actually
   * answered (designer, 09.09.2026). It takes the proposal's turn rather than stacking on top
   * of it: the dock holds one thing, and two questions in a row from a system that has just
   * been told to lead is one question too many.
   *
   * It is gated on the mode as well, and that is deliberate: somebody who has just pressed
   * "Turn off Autopilot" has said stop leading me, and following that with "how are we
   * doing?" would be the wrong sentence at the wrong moment.
   */
  if (w.suggest.taken >= 1 && !w.suggest.rated) {
    now.set({ suggest: { ...w.suggest, show: 'rating', pick: '' } }, now.preset)
    return
  }

  const proposal = nextProposal(w.brief.answers, w.suggest.started, w.published)
  if (!proposal) return
  now.set({ suggest: { ...w.suggest, show: 'proposal', pick: recommended(proposal) } }, now.preset)
}

/** Choose one of the proposal's answers. Free text arrives with the brief's `other:` prefix. */
export function pickSuggest(value: string) {
  const { world, set, preset } = useWorld.getState()
  set({ suggest: { ...world.suggest, pick: value } }, preset)
}

/**
 * Take the proposal up — the one press that acts on it.
 *
 * Accepting POSTS THE ROW'S OWN SENTENCE AS THE CUSTOMER'S, and Remixer answers it. The
 * thread is the record of what was decided, and a decision made in a panel that left no
 * turn behind would be a decision the transcript cannot account for. It also means an
 * accepted proposal costs exactly what typing the same thing costs — the credits come off
 * in `deliverAnswer`, once, wherever the sentence came from.
 */
export function acceptSuggest() {
  const now = useWorld.getState()
  const w = now.world
  const proposal = nextProposal(w.brief.answers, w.suggest.started, w.published)
  if (!proposal) return

  // The escape hatch: whatever was typed into "Something else — tell me…" is just a message.
  if (w.suggest.pick.startsWith(OTHER)) {
    const text = w.suggest.pick.slice(OTHER.length).trim()
    if (text) sendMessage(text)
    return
  }

  const option = optionOf(proposal, w.suggest.pick)
  if (!option) return

  if (option.act === 'publish') {
    now.set({ suggest: { ...closed(w.suggest), taken: w.suggest.taken + 1 } }, now.preset)
    useUI.getState().togglePublish(true)
    return
  }

  /* Remembered BEFORE the send, so the proposal that follows this edit already knows this
     page has been asked for and offers the next one instead. */
  now.set(
    {
      suggest: {
        ...closed(w.suggest),
        taken: w.suggest.taken + 1,
        started: option.page ? [...w.suggest.started, option.page] : w.suggest.started,
      },
    },
    now.preset,
  )
  if (option.say) sendMessage(say(option.say), option.reply)
}

/* ------------------------------------------------------- the satisfaction card */

/** How long Remixer takes to answer a score. A beat, not a think: nothing is being done. */
const THANKS_MS = 900

/** Pick a number on the scale. Held in `pick`, the same slot a proposal's answer uses. */
export function pickScore(score: number) {
  const { world, set, preset } = useWorld.getState()
  set({ suggest: { ...world.suggest, pick: String(score) } }, preset)
}

/**
 * Send the score.
 *
 * ⚠️ NOT THROUGH `sendMessage`. That path spends ten credits and lights the preview, and
 * charging somebody for telling us how we did — especially for telling us we did badly —
 * would be indefensible. The turn is posted directly and the reply is a beat behind it.
 */
export function submitRating(note: string) {
  const now = useWorld.getState()
  const w = now.world
  const score = Number(w.suggest.pick)
  if (!Number.isFinite(score) || score < 1) return
  const mine: Message = { id: nextId(w.sent), who: 'user', text: say(ratingSaid(score, note)) }
  now.set(
    {
      sent: [...w.sent, mine],
      suggest: { ...closed(w.suggest), rated: true, score },
    },
    now.preset,
  )
  schedule(() => {
    const then = useWorld.getState()
    const thanks: Message = { id: nextId(then.world.sent), who: 'ai', text: ratingThanks(score, note) }
    then.set({ sent: [...then.world.sent, thanks] }, then.preset)
  }, THANKS_MS)
}

/**
 * Skip it — and skipping is SILENT. A line saying the customer declined to rate us is a line
 * about us, written into their transcript, in place of the work they came here to do.
 */
export function skipRating() {
  const now = useWorld.getState()
  now.set({ suggest: { ...closed(now.world.suggest), rated: true } }, now.preset)
}

/* ------------------------------------------------------------- the plan, edited */

/**
 * Rewrite one string of the plan — a heading, the goal, a paragraph.
 *
 * Stored against the compiled document rather than replacing it, so the card in the dock and
 * the full-screen document keep showing the same words (they both read this at render). An
 * edit that comes back identical to what was there is not stored: an untouched document should
 * stay untouched, and `planEdits` is what tells the two apart.
 */
export function editPlanText(path: string, value: string, was: string) {
  const { world, set, preset } = useWorld.getState()
  const text = { ...world.planEdits.text }
  if (value === was) delete text[path]
  else text[path] = value
  set({ planEdits: { ...world.planEdits, text } }, preset)
}

/** Rewrite one section's bullets, entire — see `PlanEdits.items` for why entire. */
export function editPlanItems(section: number, items: string[]) {
  const { world, set, preset } = useWorld.getState()
  set({ planEdits: { ...world.planEdits, items: { ...world.planEdits.items, [section]: items } } }, preset)
}

/**
 * Turn Autopilot off from the panel's footer (designer, 09.09.2026, asking for this button
 * in place of a "Not now": "может вместо Not now кнопку дать типа отключить Autopilot").
 *
 * It is a mode switch, so it says so in the thread and names the control that brings it
 * back. The person most likely to press it is a beginner who meant "not this suggestion",
 * and the mode they just left is the one that exists for beginners.
 */
export function turnOffAutopilot() {
  const now = useWorld.getState()
  const line: Message = { id: nextId(now.world.sent), who: 'ai', text: AUTOPILOT_OFF }
  now.set(
    { mode: 'build', sent: [...now.world.sent, line], suggest: closed(now.world.suggest) },
    now.preset,
  )
}

/** Free-text answers carry a marker so the summary can tell them from a pick. */
export const asOther = (text: string) => (text.trim() ? `${OTHER}${text.trim()}` : '')

/* --------------------------------------------------------------- resume */

/**
 * A build started from the Home page — the page's whole reason to exist.
 *
 * Same machinery as a chat send, one step in front of it: the Home composer starts a
 * NEW site, so the project axes are cleared first and `sendMessage` then does exactly
 * what it does in the builder (seed the transcript, flip chat to 'working', put the
 * project into 'generating', schedule the canned answer). Nothing here duplicates its
 * choreography or touches its timings — the builder shell must not be able to tell
 * which composer the message came from.
 */
export function startBuild(prompt: string) {
  const text = prompt.trim()
  if (!text) return
  const { set, preset } = useWorld.getState()
  /* A generation still ticking from the previous site would keep writing beats into
     this one; the staged `chat` axis clears `world.build`, but not the timer behind it. */
  stopBuildClock()
  set(
    {
      project: 'empty', chat: 'empty', sent: [], unpublished: 0, published: false,
      /*
       * ⚠️ THE MODE BELONGS TO THE PROJECT, SO A NEW SITE GETS THE DEFAULT BACK.
       *
       * `Autopilot` is the default from the first generation onward (world.ts, designer
       * 08.09.2026), and the pill only exists while a site does — so the mode is a property
       * of the site in front of you, not a setting on the account. Left out of this patch it
       * was neither: somebody who tried `Build` on their last site started their next one in
       * it, with no proposals and no satisfaction card, and the generation signed off with
       * the build-mode line. Reported by the designer on his own build 09.09.2026 ("почему-то
       * не стоит по умолчанию в чате Autopilot и я не получил после генерации окна с
       * выбором") — one cause, both symptoms.
       *
       * `suggest` rides along for the reason `finishBuild` states about `build`: the staged
       * `chat` axis would clear it anyway, and saying so is the difference between a decision
       * and an accident.
       */
      mode: 'autopilot',
      suggest: EMPTY_SUGGEST,
      planEdits: EMPTY_PLAN_EDITS,
    },
    preset,
  )
  sendMessage(text)
}

/**
 * Pick up a send that a reload interrupted.
 *
 * The world persists (localStorage + URL — any state is a shareable link), but
 * the reply timer does not. Reload while Remixer is "working" and the restored
 * flag has no timer behind it: the glow burns forever and the composer stays
 * locked. The transcript's last turn says which job was in flight:
 *   - a user message → the answer (or, on a thin first prompt, the questions)
 *   - the brief card → the acknowledgement
 *   - the acknowledgement → the build finishing
 * A STAGED 'working' (scenario console; its transcript is the demo thread, not
 * `sent`) is left untouched — burning glow is exactly what that demo stages.
 */
export function resumeInterrupted() {
  const { world, set, preset } = useWorld.getState()
  if (world.chat !== 'working' || pending) return
  const last = world.sent[world.sent.length - 1]
  if (!last) return
  if (last.who === 'ai') {
    /* A reload during the plan's writing window: finish writing it and wait, rather than
       resuming a build the customer never approved. */
    if (last.kind === 'brief' && world.brief.status === 'planning') { schedule(offerPlan, 900); return }
    if (last.kind === 'brief') { schedule(() => acknowledge(world.brief.answers), 1400); return }
    /* Reloaded mid-generation: `world.build` came back from storage, so continue from
       the beat it stopped on rather than replaying the whole minute. */
    if (last.kind === 'build') {
      const from = beatIndex(world.brief.answers, world.build.at, world.build.line)
      runBuild(world.brief.answers, from < 0 ? 0 : from)
      return
    }
    /* An 'ack' with no card under it never got the outline open — start it. */
    if (last.kind === 'ack') { schedule(() => openOutline(world.brief.answers), 1400); return }
    // A 'working' flag over a transcript that already ends in an answer is a
    // leftover from a state saved by an older build — nothing to resume, just
    // settle it so the glow stops and the composer unlocks.
    set({ chat: 'long', sent: world.sent }, preset)
    return
  }
  const text = typeof last.text === 'string' ? last.text : ''
  if (world.project === 'empty' && isWeakPrompt(text)) schedule(askForDirection, 1400)
  else if (world.project === 'generating') schedule(startFirstBuild, 1400)
  else schedule(() => deliverAnswer(text), 1400)
}
