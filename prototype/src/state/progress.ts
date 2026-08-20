/**
 * The waiting states move on their own.
 *
 * ⚠️ READ BEFORE DELETING ANYTHING HERE. On 20.08.2026 the designer asked for the
 * "Whole flows" STEPPER UI to go — the bar with arrows, a step counter and speed
 * controls — because a stepper narrating the product at you is not how a customer meets
 * an interface. That was right, and it is done (`state/flows.ts` and
 * `devtools/FlowPlayer.tsx` are gone for good). What went with it by accident was this:
 * the states used to ADVANCE BY THEMSELVES, and connecting became a screen that only
 * moved when you pressed Refresh. The stepper was scaffolding; the progression is the
 * product's own behaviour — a real domain connects while you keep working, nobody sits
 * there clicking Refresh — so it is restored here, with no UI of its own. Removing the
 * stepper must never again mean removing the progression.
 *
 * Lives at the app level on purpose. The wait has to keep running wherever the person
 * is — Publish panel open, Publish panel closed, domains surface open, nothing open —
 * so it cannot hang off a component that unmounts when a panel closes.
 */
import { useEffect } from 'react'
import { useWorld, type DomainState } from './world'

/**
 * The forward waiting path, and ONLY it.
 *
 * Every other value of the axis is deliberately absent, and each absence is a decision:
 *   · `live`        — the end of the road; nothing follows success.
 *   · `ready`       — waits for the person to press Publish. That is the whole state
 *                     (docs/features/domains/STATES.md): a domain that published itself
 *                     would delete the most common novice situation we have.
 *   · `unreachable` — a failure that healed itself on a timer would be a lie, and the
 *                     screen's verb (`Fix this`) exists precisely because a human acts.
 *   · `staging` · `searching` · `multiple` — not waits at all: they sit still until
 *                     somebody clicks something. (`checkout` used to be listed here too;
 *                     it left the axis on 20 Aug 2026 — see state/world.ts.)
 */
const NEXT: Partial<Record<DomainState, DomainState>> = {
  connecting: 'verifying',
  verifying: 'securing',
  securing: 'live',
}

/**
 * Demo time, compressed but proportional — the same order of magnitude the deleted flow
 * engine used (1.6–3.2s a stage). The real waits are minutes for the address (DH-217,
 * DH-218) and ten to thirty for the padlock (DH-301); the copy still says so. What these
 * numbers buy is that waiting READS as waiting without anyone actually waiting.
 */
const DWELL: Partial<Record<DomainState, number>> = {
  connecting: 2200,
  verifying: 2400,
  securing: 2600,
}

/**
 * One timer at a time, keyed on the state it belongs to.
 *
 * The effect re-runs on every change of `world.domain`, and its cleanup cancels the
 * pending timeout first — so `Refresh status` stays a manual accelerator that cannot
 * fight the clock: pressing it advances at once, the timer for the stage just left is
 * cancelled, and a fresh one is scheduled for the stage just entered. No stage is ever
 * skipped by a stale timeout, and React StrictMode's double-invocation in dev mounts,
 * cleans up and re-schedules rather than stacking two timers.
 *
 * No `prefers-reduced-motion` gate: this is not an animation, it is the passage of time
 * in the simulation, and nothing in the codebase gates a state change on that query.
 */
export function useDomainProgress() {
  const domain = useWorld((s) => s.world.domain)

  useEffect(() => {
    const next = NEXT[domain]
    if (!next) return
    const timer = window.setTimeout(() => {
      // Belt and braces over the cleanup: never move a state that is no longer the one
      // this timer was scheduled for.
      const store = useWorld.getState()
      if (store.world.domain !== domain) return
      store.set({ domain: next })
    }, DWELL[domain])
    return () => window.clearTimeout(timer)
  }, [domain])
}
