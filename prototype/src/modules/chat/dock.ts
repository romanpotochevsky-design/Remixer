/**
 * The dock's bubble — how a sheet (the questions, the plan) grows out of the composer.
 *
 * Designer, 07.09.2026: "пузырь, который обволакивает наше поле ввода… в стиле Apple
 * Liquid Glass". The gesture: the shell forms as a skin around the field, then rises to
 * its full height, and the content condenses inside it as it rises.
 *
 * HOW IT IS BUILT, and why not the obvious way. The obvious way animates the dock's
 * height — a relayout of the dock AND the thread's scroller on every frame, the exact
 * per-frame layout this project's contract forbids (ui/motion.ts, FIELD_GROW, made the
 * same call for the Home composer). Instead the layout SNAPS once: the sheet mounts at
 * full height, the thread above is clipped a little more at its bottom and does not move.
 * Everything the eye then sees is a `clip-path` on the dock (index.css `.dock-rise` /
 * `.dock-fall`) whose rounded top edge travels from the collar around the field up to the
 * top of the dock — and the sheet's own content condensing under that edge (motion.ts,
 * `sheetRise`). Clip is composited and, measured on this build, free.
 *
 * The clip needs one number: how far to rise. That is the sheet's own height, measured
 * here in a layout effect BEFORE the first paint and handed to CSS as `--rise`, so there
 * is no frame in which the full sheet shows unclipped.
 *
 * ⚠️ The fall (exit) is deliberately SHORTER than the sheet's exit variant (260 against
 * 300ms). The dock snaps to collar height the instant the sheet unmounts; if the fall's
 * clip were still applied at that moment — `inset(var(--rise) …)` on a box now only as
 * tall as the collar — the composer itself would be clipped away for a frame or two.
 * Finishing early, and clearing the class on both `animationend` and the sheet's own
 * unmount, closes that window from both sides.
 */
import { useLayoutEffect, useRef } from 'react'

const RISE = 'dock-rise'
const FALL = 'dock-fall'

/** The dock a sheet lives in — the composer's column, `.dock`. */
const dockOf = (sheet: HTMLElement) => sheet.closest<HTMLElement>('.dock')

function play(dock: HTMLElement, cls: string, rise: number) {
  dock.style.setProperty('--rise', `${Math.max(0, Math.round(rise))}px`)
  dock.classList.remove(RISE, FALL)
  /* Reading layout between remove and add is what restarts a CSS animation that is
     already on the element; without it, a second sheet in a row would not rise. */
  void dock.offsetWidth
  dock.classList.add(cls)
}

/** Called by the dock on `animationend`: the clip has done its job, drop it. */
export function clearDockMotion(dock: HTMLElement) {
  dock.classList.remove(RISE, FALL)
}

/**
 * A sheet in the dock. Attach the ref to the sheet's root motion element and pass the
 * handler to its `onAnimationStart`: the sheet measures itself on mount and rises, and
 * starts the fall the moment its `exit` variant begins.
 */
export function useDockSheet<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    const sheet = ref.current
    const dock = sheet && dockOf(sheet)
    if (!sheet || !dock) return
    play(dock, RISE, sheet.offsetHeight)
    return () => clearDockMotion(dock)
  }, [])

  const onAnimationStart = (definition: unknown) => {
    const sheet = ref.current
    const dock = sheet && dockOf(sheet)
    if (definition !== 'exit' || !sheet || !dock) return
    play(dock, FALL, sheet.offsetHeight)
  }

  return { ref, onAnimationStart }
}
