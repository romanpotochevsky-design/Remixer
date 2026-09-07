/**
 * The dock's bubble — how a sheet (the questions, the plan) grows out of the composer,
 * changes height between questions, and folds back into it.
 *
 * Designer, 07.09.2026: "пузырь, который обволакивает наше поле ввода… в стиле Apple
 * Liquid Glass"; then "не хватает отдачи, жидкости… Bounce effect"; then, from a screen
 * recording of the second cut, "анимации практически не видно, бордер глючит".
 *
 * HOW IT IS BUILT (the paint is in index.css, "THE BUBBLE"). The layout SNAPS once: the
 * sheet mounts at full height, the thread above is clipped a little more at its bottom and
 * does not move, and the FIELD does not move either. Everything the eye then sees is a
 * PISTON — the shell's own body, rim and rounded top — travelling up out of the collar
 * around the field by `transform`, with the sheet's content riding the same curve and
 * fading in behind the edge. Transform and opacity only, so it is composited and keeps
 * its frames when the main thread is busy, which the recording showed it is.
 *
 * Why not animate the height: that is a relayout of the dock AND the thread's scroller on
 * every frame, the exact per-frame layout this project's contract forbids (ui/motion.ts,
 * FIELD_GROW, made the same call for the Home composer).
 *
 * Why not a clip (the previous cut): a clip reveals a pre-drawn plate through a moving
 * window, so the visible edge is a raw cut — the rim is not on it — and the corners are the
 * window's, not the shell's. Measured on the designer's recording the rim appeared only at
 * the very end, which is the "бордер глючит". A piston carries its rim with it.
 *
 * THE NUMBERS the CSS needs, set here on the dock as custom properties:
 *  · `--rise` — the sheet's height: where the collar (`.dock-base`) begins, how tall the
 *    piston is, and where the fall ends. Kept fresh by a ResizeObserver, because the
 *    column can change width under an open sheet and rewrap it.
 *  · `--from` — where the motion starts, in px of translateY: the whole height for the
 *    rise, the signed height DIFFERENCE for a morph between questions, and — when a new
 *    motion interrupts one in flight — the piston's current offset added in, so it
 *    continues from where it is rather than jumping to where it would have been.
 *
 * ⚠️ THE FIRST FRAME IS PAINTED BEFORE THE MOTION STARTS. On mount the dock is `armed`:
 * piston and content parked at their start values, statically. Then two frames later the
 * animation class goes on. The recording's first painted frame already had the previous
 * cut's clip half open — the frame that creates the layers and rasters the tiles is slow,
 * and a time-based animation started on it loses its first ~150ms. Painting the parked
 * state first makes the motion's first frame cheap, so it is actually seen.
 */
import { useLayoutEffect, useRef } from 'react'
import { useIsPresent } from 'motion/react'

const ARMED = 'dock-armed'
const RISE = 'dock-rise'
const MORPH = 'dock-morph'
const FALL = 'dock-fall'
const ALL = [ARMED, RISE, MORPH, FALL]

/**
 * Animation names whose end means the dock's motion is over (index.css). The FALL is not
 * here on purpose: its classes hold the sheet's content at zero until the sheet is gone
 * (the unmount cleanup clears them) — clearing them a frame earlier is exactly the frame
 * in which the content, handed back by motion at inline opacity 1, would flash.
 */
const ENDS = new Set(['dock-ride'])

/** The dock a sheet lives in — the composer's column, `.dock`. */
const dockOf = (sheet: HTMLElement) => sheet.closest<HTMLElement>('.dock')
const px = (n: number) => `${Math.round(n)}px`

/** The piston's current translateY — 0 at rest, its live offset mid-flight. */
function pistonY(dock: HTMLElement): number {
  const piston = dock.querySelector<HTMLElement>('.dock-piston')
  const t = piston && getComputedStyle(piston).transform
  const m = t && t !== 'none' ? /matrix\(([^)]+)\)/.exec(t) : null
  return m ? Number(m[1].split(',')[5]) || 0 : 0
}

/**
 * Swap the motion class. Only when the same class is already on the dock (a morph
 * interrupting a morph) is a reflow forced in between — that is what restarts a running
 * animation of the same name. Otherwise the swap is one style change, so it lands in the
 * same recalc as whatever the commit changed on the dock (`.brief-dock` coming or going).
 */
function restart(dock: HTMLElement, cls: string) {
  if (dock.classList.contains(cls)) {
    dock.classList.remove(cls)
    void dock.offsetWidth
  }
  dock.classList.remove(...ALL)
  dock.classList.add(cls)
}

/** Called by the dock on `animationend` once the piston has landed: drop the motion. */
export function endDockMotion(e: { animationName: string; currentTarget: HTMLElement }) {
  if (ENDS.has(e.animationName)) e.currentTarget.classList.remove(...ALL)
}

/**
 * A sheet in the dock. Attach the ref to the sheet's root motion element. The sheet
 * measures itself on mount and rises; when `step` changes and its height with it, the
 * shell's edge morphs to the new height; and the fall starts in the very commit that
 * removes the sheet from the tree (`useIsPresent`), which is also the commit that drops
 * `.brief-dock` — so the shell's own fade and the piston's sink are on one clock.
 * (Motion's `onAnimationStart` for the exit fires a frame later; a shell fade that had
 * already begun could not be re-timed from there.)
 */
export function useDockSheet<T extends HTMLElement>(step?: unknown) {
  const ref = useRef<T>(null)
  const height = useRef<number | null>(null)
  const frame = useRef(0)
  const present = useIsPresent()

  // Mount: arm, let the browser paint that frame, then rise.
  useLayoutEffect(() => {
    const sheet = ref.current
    const dock = sheet && dockOf(sheet)
    if (!sheet || !dock) return
    const h = sheet.offsetHeight
    height.current = h
    dock.style.setProperty('--rise', px(h))
    dock.style.setProperty('--from', px(h))
    dock.classList.remove(...ALL)
    dock.classList.add(ARMED)
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => restart(dock, RISE))
    })

    // The column can change width under an open sheet (the preview opening) and rewrap
    // it; the collar has to follow the composer, so `--rise` follows the sheet. A step
    // change lands here too, but the morph effect below has measured it first.
    const ro = new ResizeObserver(() => {
      const now = sheet.offsetHeight
      if (now === height.current) return
      height.current = now
      dock.style.setProperty('--rise', px(now))
    })
    ro.observe(sheet)

    return () => {
      cancelAnimationFrame(frame.current)
      ro.disconnect()
      dock.classList.remove(...ALL)
      dock.style.setProperty('--rise', '0px')
      dock.style.setProperty('--from', '0px')
    }
  }, [])

  // A step change: the sheet is already laid out at its new height (the outgoing content
  // has been popped out of the flow), so the edge visibly still stands at the OLD height
  // and glides to the new one on the same spring as the rise.
  useLayoutEffect(() => {
    const sheet = ref.current
    const dock = sheet && dockOf(sheet)
    if (!sheet || !dock || height.current == null) return
    const h = sheet.offsetHeight
    const prev = height.current
    if (h === prev) return
    height.current = h
    const inFlight = pistonY(dock)
    dock.style.setProperty('--rise', px(h))
    dock.style.setProperty('--from', px(h - prev + inFlight))
    restart(dock, MORPH)
  }, [step])

  // The fall: the sheet is leaving (its exit is playing), so the piston sinks back into
  // the collar from wherever it is, and the shell fades out behind it.
  useLayoutEffect(() => {
    if (present) return
    const sheet = ref.current
    const dock = sheet && dockOf(sheet)
    if (!sheet || !dock) return
    cancelAnimationFrame(frame.current)
    const inFlight = pistonY(dock)
    dock.style.setProperty('--rise', px(sheet.offsetHeight))
    dock.style.setProperty('--from', px(inFlight))
    restart(dock, FALL)
  }, [present])

  return { ref }
}
