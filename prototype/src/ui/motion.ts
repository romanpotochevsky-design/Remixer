/**
 * The prototype's motion language — one place, so every overlay moves alike.
 *
 * Modelled on how iOS 26 opens things, which is four rules more than "fade in":
 *
 *  1. SPRINGS, NOT DURATIONS. A duration curve always takes the same time no
 *     matter how far it travels; a spring settles. That is why Apple's panels
 *     feel physical and a 200ms ease feels like a slideshow.
 *  2. IT GROWS FROM WHAT YOU TOUCHED. A popover scales up from its trigger's
 *     corner, so the eye never loses the causal link between click and panel.
 *     Set `transform-origin` to the anchored corner — that is the whole trick.
 *  3. THE CONTENT LAGS THE CONTAINER. The glass inflates first, the contents
 *     arrive a beat later. Simultaneous is what makes an overlay read as a
 *     picture being swapped in rather than a surface opening.
 *  4. LEAVING IS FASTER THAN ARRIVING, AND NEVER BOUNCES. Overshoot on the way
 *     out reads as indecision; dismissal should feel instant.
 *
 * Performance: springs here animate `transform` and `opacity` only — the two
 * properties the compositor handles without repainting. Nothing in this file
 * may animate width, height, blur or colour on a per-frame basis.
 */

/** The house spring: quick, one barely-perceptible overshoot, settles clean. */
export const SPRING = { type: 'spring', stiffness: 520, damping: 34, mass: 0.9 } as const

/** Softer variant for larger surfaces, which look silly moving as fast. */
export const SPRING_SOFT = { type: 'spring', stiffness: 380, damping: 36, mass: 1 } as const

/** Dismissal — no spring, no overshoot, out of the way immediately. */
export const EXIT = { duration: 0.14, ease: [0.4, 0, 1, 1] } as const

/**
 * Popover/dropdown/menu entrance. Pair with a `transform-origin` matching the
 * side the panel hangs off (`origin-top-right` for a right-aligned trigger).
 */
export const popover = {
  initial: { opacity: 0, scale: 0.94, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0, transition: SPRING },
  exit: { opacity: 0, scale: 0.97, y: -2, transition: EXIT },
}

/** Rule 3: the panel's own contents, one beat behind the glass. */
export const popoverContent = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { ...SPRING_SOFT, delay: 0.06 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
}

/** Full-surface swaps — a screen replacing another inside the same shell. */
export const surface = {
  initial: { opacity: 0, scale: 0.985, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: SPRING_SOFT },
  exit: { opacity: 0, scale: 0.99, y: -6, transition: EXIT },
}
