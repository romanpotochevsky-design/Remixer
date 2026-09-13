/**
 * The connect clock — what happens after the customer pays, or attaches a domain they
 * already own.
 *
 * Connecting is not one wait, it is three states in a row (records → padlock → live),
 * and the Publish panel names each of them (designer, 13.09.2026: "после корзины все
 * статусы и продолжение флоу происходят тут в окне Publish"). This module is the clock
 * that walks them, so the panel can stay a pure reading of the world.
 *
 * Two rules, both borrowed from the engines that already exist here:
 *
 *  · WAITS ARE COMPRESSED BUT PROPORTIONAL (state/flows.ts). Real records land in
 *    minutes and the certificate follows in 10–30 (product facts), so the padlock beat
 *    is the longer of the two here as well. Long enough to read the state, short enough
 *    to sit through in a demo.
 *
 *  · A TICK RE-READS THE STORE AND STANDS DOWN IF THE WORLD MOVED (modules/chat/build.ts).
 *    The scenario console stages `connecting` deliberately, to be looked at; a clock that
 *    kept running would drift that staged state to live under the designer's cursor. Only
 *    a connect STARTED here ticks, and only while the domain axis still holds the state
 *    this clock put there.
 */
import { useWorld } from '@/state/world'
import { useUI } from '@/state/ui'

/** Records written and found — "Connecting · nothing for you to do". */
const PADLOCK_MS = 5000
/** Certificate issued — the padlock stops switching on and the site is fully live. */
const LIVE_MS = 11000

let timers: number[] = []

const clear = () => {
  timers.forEach((t) => window.clearTimeout(t))
  timers = []
}

/**
 * Attach `domain` and walk it to live.
 *
 * `bought` marks a domain REGISTERED through us: those, and only those, start the
 * 15-day ICANN clock on the registrant's email (see world.icann).
 */
export function startConnect(domain: string, opts: { bought?: boolean } = {}) {
  clear()
  const { set } = useWorld.getState()
  set({ domain: 'connecting', customDomain: domain, icann: opts.bought ?? false })

  // The panel is where every one of these states is read, so it opens with the first.
  useUI.getState().togglePublish(true)

  const step = (expect: string, next: 'verifying' | 'live', ms: number) =>
    window.setTimeout(() => {
      const w = useWorld.getState()
      if (w.world.domain !== expect || w.world.customDomain !== domain) return clear()
      /* Going live IS publishing: a domain cannot answer for a site that was never put
         out. Without this the panel would title itself "Not published" over a live
         address and offer "Publish" where the state is plainly an update. */
      w.set(next === 'live' ? { domain: next, published: true } : { domain: next })
    }, ms)

  timers.push(step('connecting', 'verifying', PADLOCK_MS))
  timers.push(step('verifying', 'live', LIVE_MS))
}

/** "Check again" on a domain we cannot reach yet — one retry, then the same walk. */
export function retryConnect(domain: string) {
  startConnect(domain, { bought: useWorld.getState().world.icann })
}

/** Stop the clock — the domain was detached, or a scenario is being staged. */
export function stopConnect() {
  clear()
}
