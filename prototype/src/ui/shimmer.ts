/**
 * THE SHIMMER'S CLOCKS — see THE THREE-HUE SHIMMER in index.css.
 *
 * Two hosts, two ways to start:
 *
 *  · `useShimmerSlot` — for a word that waits ALONE (`.thinking`). Its sweep starts at
 *    mount; its hue starts on the slot whose turn it is: the hue animation is delayed by a
 *    whole number of sweep periods read off the page clock, so successive waits come in
 *    successive colours instead of all starting blue. Whole periods only — the hue fades
 *    through the rest of each period, so a whole-period delay keeps the sweep in a hold.
 *
 *  · `useShimmerPhase` — for a SCOPE: a parent that carries the hue clock for a text AND a
 *    spinner (`.shimmer-hue`), and for the text inside it (`.shimmer-ink` / `.gen-work`).
 *    Both are delayed by the page clock modulo the full cycle, so whatever moment either
 *    of them mounts, both run in the page's phase and the sweep lands in the hue's holds.
 *    The spinner reads the same inherited `--sh-hue`, so it changes colour with the text
 *    (designer, 16.09.2026: «спинер синхронно с текстом тоже менял плавно и красиво цвет»).
 *    A remounting line (the build card's, keyed on the beat) therefore waits up to one
 *    period for its first pass rather than sweeping on arrival — measured 16.09 on a live
 *    build: with per-mount clocks the hue restarted on blue every ~4 s and never reached
 *    peach.
 *
 * Read once per mount (`useState` initializer, re-read when `key` changes): re-rendering
 * with a fresh value would change `animation-delay` on a running animation and jump it.
 */
import { useState, type CSSProperties } from 'react'

/** One sweep + one rest. Designer, 16.09.2026: pause halved, band speed × ⅔. */
export const SHIMMER_PERIOD_MS = 2700
export const SHIMMER_HUES = 3
export const SHIMMER_CYCLE_MS = SHIMMER_PERIOD_MS * SHIMMER_HUES

export function shimmerSlot(): CSSProperties {
  const slot = Math.floor(performance.now() / SHIMMER_PERIOD_MS) % SHIMMER_HUES
  return { '--sh-slot': String(slot) } as CSSProperties
}

export function shimmerPhase(): CSSProperties {
  return { '--sh-t': `${-(performance.now() % SHIMMER_CYCLE_MS)}ms` } as CSSProperties
}

function useOncePerKey(make: () => CSSProperties, key: unknown): CSSProperties {
  const [state, setState] = useState<{ key: unknown; style: CSSProperties }>(() => ({ key, style: make() }))
  if (state.key !== key) {
    const next = { key, style: make() }
    setState(next)
    return next.style
  }
  return state.style
}

/** The lone word's slot — pass a key to take a fresh one when the wait starts over. */
export function useShimmerSlot(key?: unknown): CSSProperties {
  return useOncePerKey(shimmerSlot, key)
}

/** A scope's (or its text's) phase — pass a key to re-read it when the element remounts. */
export function useShimmerPhase(key?: unknown): CSSProperties {
  return useOncePerKey(shimmerPhase, key)
}
