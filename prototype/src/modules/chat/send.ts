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
  pending = setTimeout(() => {
    const now = useWorld.getState()
    const answer: Message = { id: ++seq, who: 'ai', text: replyTo(text) }
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
  }, THINKING_MS)
}
