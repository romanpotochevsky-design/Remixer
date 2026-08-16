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

/**
 * Sending a message, the iMessage way.
 *
 * The bubble does not fade in where it will sit — it comes OUT of the composer:
 * small, low, and anchored at its bottom-right corner (the send button's side),
 * then springs up to full size. The spring is deliberately livelier than the
 * house one: a send is the most tactile thing in the whole product, and the
 * little overshoot is what makes it feel like the message left your hand.
 */
export const bubbleSend = {
  /*
   * Squashed, offset toward the send button, and low — so it arrives on a
   * diagonal out of the composer instead of inflating where it will sit.
   * scaleX ≠ scaleY is the whole trick: a bubble squeezed out of somewhere is
   * wider than it is tall for an instant, and watching it round out is what
   * reads as physical. Growing uniformly from a point reads as a zoom.
   */
  initial: { opacity: 0, scaleX: 0.78, scaleY: 0.6, x: 18, y: 34 },
  animate: {
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    x: 0,
    y: 0,
    /* Duration-based spring rather than stiffness/damping/mass: `bounce` says
       how much pop there is and `duration` how long it takes, which is what a
       designer actually wants to tune. Opacity is pulled forward on its own
       curve — a bubble that fades in over the whole flight looks like a ghost. */
    transition: {
      type: 'spring',
      bounce: 0.42,
      duration: 0.62,
      opacity: { duration: 0.16, ease: [0.2, 0, 0, 1] },
    },
  },
}

/** The reply, arriving. Calmer than a send — it is not your gesture. */
export const messageIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: SPRING_SOFT },
}

/** Full-surface swaps — a screen replacing another inside the same shell. */
export const surface = {
  initial: { opacity: 0, scale: 0.985, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: SPRING_SOFT },
  exit: { opacity: 0, scale: 0.99, y: -6, transition: EXIT },
}
