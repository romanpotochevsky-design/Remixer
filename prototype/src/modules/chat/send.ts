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

/** How long Remixer "works" before answering. Long enough to read the glow,
 *  short enough that a demo never stalls. The real thing takes far longer. */
const THINKING_MS = 2600
/** Thinking before the questions. Lovable took 15–21s on the recording; a demo
 *  cannot afford that, but it must still read as "it considered, then asked". */
const CLARIFY_MS = 2600
/** Summary card → "Got it — …". */
const ACK_MS = 1400
/** "Got it" → the first version. The glow carries this stretch. */
const BUILD_MS = 4200

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
 * Submit. The panel goes away, a summary card lands in the thread, the agent
 * acknowledges the brief in one line and — only now — the build starts.
 */
export function briefSubmit() {
  const now = useWorld.getState()
  if (now.world.brief.status !== 'asking') return
  const answers = now.world.brief.answers
  const card: Message = { id: nextId(now.world.sent), who: 'ai', kind: 'brief', text: BRIEF_STATUS }
  now.set(
    { sent: [...now.world.sent, card], chat: 'working', brief: { ...now.world.brief, status: 'ready' } },
    now.preset,
  )
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
