/**
 * Sending a message — the one action that moves the whole shell at once.
 *
 * A send is not just a bubble: the builder goes to work (edge glow on the canvas),
 * credits are spent, and the result is an unpublished change. Wiring all of that
 * here, outside React, keeps the flow identical no matter who triggers it — the
 * composer today, a scripted flow or a keyboard shortcut tomorrow.
 */
import { useWorld, canUseAI, type Message } from '@/state/world'
import { baselineThread, replyTo } from './thread'

/** How long Remixer "works" before answering. Long enough to read the glow,
 *  short enough that a demo never stalls. The real thing takes far longer. */
const THINKING_MS = 2600

/** Credits per chat edit. Illustrative — no published per-message price exists;
 *  what matters is that the toolbar balance visibly moves when AI does work. */
const COST = 10

let seq = 1000
let pending: ReturnType<typeof setTimeout> | null = null

export function sendMessage(raw: string) {
  const text = raw.trim()
  if (!text) return

  const { world, set, preset } = useWorld.getState()
  if (!canUseAI(world)) return

  // The first typed message freezes the scenario's demo transcript into `sent`
  // and takes over from there; `chat` is only a status flag afterwards.
  const base = world.sent.length ? world.sent : baselineThread(world.chat)
  const mine: Message = { id: ++seq, who: 'user', text }

  set(
    {
      sent: [...base, mine],
      chat: 'working',
      // An empty project starts building on the first message, like the real thing.
      ...(world.project === 'empty' ? { project: 'generating' as const } : null),
    },
    preset,
  )

  if (pending) clearTimeout(pending)
  pending = setTimeout(() => deliverAnswer(text), THINKING_MS)
}

function deliverAnswer(prompt: string) {
  const now = useWorld.getState()
  const answer: Message = { id: ++seq, who: 'ai', text: replyTo(prompt) }
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

/**
 * Pick up a send that a reload interrupted.
 *
 * The world persists (localStorage + URL — any state is a shareable link), but
 * the reply timer does not. Reload while Remixer is "working" and the restored
 * flag has no timer behind it: the glow burns forever and the composer stays
 * locked. If the transcript ends on an unanswered user message, the job is
 * clearly a real interrupted send — resume it and answer shortly after load.
 * A STAGED 'working' (scenario console; its transcript is the demo thread, not
 * `sent`) is left untouched — burning glow is exactly what that demo stages.
 */
export function resumeInterrupted() {
  const { world, set, preset } = useWorld.getState()
  if (world.chat !== 'working' || pending) return
  const last = world.sent[world.sent.length - 1]
  if (!last) return
  if (last.who !== 'user') {
    // A 'working' flag over a transcript that already ends in an answer is a
    // leftover from a state saved by an older build — nothing to resume, just
    // settle it so the glow stops and the composer unlocks.
    set({ chat: 'long' }, preset)
    return
  }
  const text = typeof last.text === 'string' ? last.text : ''
  pending = setTimeout(() => deliverAnswer(text), 1400)
}
