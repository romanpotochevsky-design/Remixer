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
import { useWorld, canUseAI, EMPTY_BRIEF, type Message } from '@/state/world'
import { useUI } from '@/state/ui'
import { baselineThread, replyTo } from './thread'
import {
  isWeakPrompt, BRIEF_INTRO, BRIEF_STATUS, BRIEF_QUESTIONS, briefAck, briefDone, OTHER,
  type BriefKey, type BriefAnswers,
} from './brief'

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
/** Approve → "Got it — …". */
const ACK_MS = 2000
/** "Got it" → the first version. The glow carries this stretch. */
const BUILD_MS = 5600

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

export function sendMessage(raw: string) {
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
    set({ sent: [...base, mine], chat: 'working', brief: EMPTY_BRIEF }, preset)
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
      brief: EMPTY_BRIEF,
      // An empty project starts building on the first message, like the real thing.
      ...(fresh ? { project: 'generating' as const } : null),
    },
    preset,
  )
  // Building needs a canvas: a collapsed preview opens itself for the first build.
  if (fresh) useUI.getState().setPreviewOpen(true)
  schedule(() => deliverAnswer(text), THINKING_MS)
}

function deliverAnswer(prompt: string) {
  const now = useWorld.getState()
  const answer: Message = { id: nextId(now.world.sent), who: 'ai', text: replyTo(prompt) }
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
}

/* ------------------------------------------------------------- the brief */

/** The agent declines to guess and opens the questions. Free — nothing was built. */
function askForDirection() {
  const now = useWorld.getState()
  const ask: Message = {
    id: nextId(now.world.sent),
    who: 'ai',
    kind: 'clarify',
    thought: Math.round(CLARIFY_MS / 1000),
    text: BRIEF_INTRO,
  }
  now.set(
    { sent: [...now.world.sent, ask], chat: 'long', brief: { status: 'asking', step: 0, answers: {} } },
    now.preset,
  )
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
 * `Approve` — the one press that spends a build. From the dock card or from the plan
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
  now.set({ sent: [...now.world.sent, ack], chat: 'working', project: 'generating' }, now.preset)
  // The canvas opens for the build — the glow is the only progress indicator we have.
  useUI.getState().setPreviewOpen(true)
  schedule(() => finishBuild(answers), BUILD_MS)
}

function finishBuild(answers: BriefAnswers) {
  const now = useWorld.getState()
  const done: Message = { id: nextId(now.world.sent), who: 'ai', text: briefDone(answers) }
  now.set(
    {
      sent: [...now.world.sent, done],
      chat: 'long',
      project: 'built',
      credits: Math.max(0, now.world.credits - COST),
      unpublished: now.world.unpublished + 1,
    },
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
  set({ project: 'empty', chat: 'empty', sent: [], unpublished: 0 }, preset)
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
    if (last.kind === 'ack') { schedule(() => finishBuild(world.brief.answers), 2400); return }
    // A 'working' flag over a transcript that already ends in an answer is a
    // leftover from a state saved by an older build — nothing to resume, just
    // settle it so the glow stops and the composer unlocks.
    set({ chat: 'long', sent: world.sent }, preset)
    return
  }
  const text = typeof last.text === 'string' ? last.text : ''
  if (world.project === 'empty' && isWeakPrompt(text)) schedule(askForDirection, 1400)
  else schedule(() => deliverAnswer(text), 1400)
}
