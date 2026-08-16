/**
 * Phone-style scrollbar reveal: the thumb is invisible at rest and fades in
 * while the surface is actually being scrolled (plus on hover, via CSS).
 * Attach to any scrollable container: <div onScroll={revealScrollbar}>.
 *
 * Background awareness is by surface, not by pixel: dark chrome shows a
 * white-alpha thumb (default), light surfaces opt in with `.scroll-light`
 * for a black-alpha one. CSS cannot sample the backdrop; each surface in
 * this app knows its own theme, so the marking is deterministic.
 */
const timers = new WeakMap<Element, number>()

export function revealScrollbar(e: { currentTarget: HTMLElement }) {
  const el = e.currentTarget
  el.setAttribute('data-scrolling', '')
  const prev = timers.get(el)
  if (prev) window.clearTimeout(prev)
  timers.set(el, window.setTimeout(() => el.removeAttribute('data-scrolling'), 700))
}
