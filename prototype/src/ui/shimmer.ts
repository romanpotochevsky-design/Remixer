/**
 * THE SHIMMER'S CLOCK — which of the three hues a freshly mounted shimmer line starts on.
 *
 * `.thinking` / `.gen-work` (index.css, THE THREE-HUE SHIMMER) run two CSS animations in
 * lockstep: a 3.5 s sweep and a 10.5 s hue rotation (blue → lilac → peach). Both start at
 * mount, so a line that is remounted often — the build card's working line is keyed on
 * the beat and comes back every ~4 s — would start on blue every time and never reach
 * peach (measured 16.09.2026: eleven seconds of a live build, blue → lilac → blue → …).
 *
 * The fix is a phase, not a global animation: the hue animation is delayed by a whole
 * number of sweep periods read off the page clock, so the line joins the rotation where
 * the product is, while its own sweep still starts at mount — a new sentence arrives with
 * a pass of light, in the colour whose turn it is. Whole periods only: the hue keyframes
 * cross-fade during the REST of each period, and a delay that is a multiple of the period
 * keeps that rest aligned with the local sweep's rest, so no sweep ever runs mid-fade.
 *
 * Read once per mount (`useState` initializer): re-rendering with a fresh value would
 * change `animation-delay` on a running animation and jump it.
 */
import { useState, type CSSProperties } from 'react'

export const SHIMMER_PERIOD_MS = 3500
export const SHIMMER_HUES = 3

export function shimmerSlot(): CSSProperties {
  const slot = Math.floor(performance.now() / SHIMMER_PERIOD_MS) % SHIMMER_HUES
  return { '--sh-slot': String(slot) } as CSSProperties
}

/** The slot for this mount — pass a key to take a fresh one when the line's text changes. */
export function useShimmerSlot(key?: unknown): CSSProperties {
  const [state, setState] = useState<{ key: unknown; style: CSSProperties }>(() => ({ key, style: shimmerSlot() }))
  if (state.key !== key) {
    const next = { key, style: shimmerSlot() }
    setState(next)
    return next.style
  }
  return state.style
}
