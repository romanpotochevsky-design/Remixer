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
  initial: { opacity: 0, scaleX: 0.72, scaleY: 0.48, x: 26, y: 52 },
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
    /* Longer and further than feels right on paper. Measured frame by frame the
       shorter version did render — it was simply over before the eye caught it,
       which reads as "there is no animation". Legibility beats restraint here:
       this is the one gesture the user performs. */
    transition: {
      type: 'spring',
      bounce: 0.45,
      duration: 0.9,
      opacity: { duration: 0.2, ease: [0.2, 0, 0, 1] },
    },
  },
}

/** The reply, arriving. Calmer than a send — it is not your gesture. */
export const messageIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: SPRING_SOFT },
}

/**
 * App-modal: the checkout sheet over the 70% scrim (Figma 27254/27275).
 *
 * Centred sheets have no trigger corner to grow out of, so rule 2 cannot apply —
 * the substitute is a very short rise. Scale starts nearer 1 than a popover's:
 * a 600px sheet inflating from .94 reads as a zoom, not as a surface arriving.
 */
export const modalScrim = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, ease: [0.2, 0, 0, 1] } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: [0.4, 0, 1, 1] } },
}

export const modalSheet = {
  initial: { opacity: 0, scale: 0.97, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0, transition: SPRING_SOFT },
  exit: { opacity: 0, scale: 0.985, y: 6, transition: EXIT },
}

/**
 * Content swapping UNDER something that stays — the domain lists changing while
 * the search header holds its place.
 *
 * A conveyor, not a cross-fade: the answered-with content leaves upward and the
 * new content rises from just below, so the eye reads "this was replaced by
 * that" rather than "the picture changed". Leaving is quick and flat (rule 4);
 * arriving is a spring, because arriving is the part with meaning.
 */
export const listSwap = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { ...SPRING_SOFT, staggerChildren: 0.055 } },
  exit: { opacity: 0, y: -12, transition: EXIT },
}

/** A block inside a swapped list — sections land in reading order. */
export const listSwapItem = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: SPRING_SOFT },
}

/**
 * A page from OUTSIDE the product taking the whole window — the hosting panel's
 * cart. It has to read as a NAVIGATION, not as a dialog: no scale (a sheet grows,
 * a page does not) and a short rise, so the eye reads "another page loaded" and
 * the seam between Remixer and the panel stays legible. Transform and opacity
 * only, like everything else here.
 */
export const foreignPage = {
  initial: { opacity: 0, y: 26 },
  animate: { opacity: 1, y: 0, transition: SPRING_SOFT },
  exit: { opacity: 0, y: 18, transition: EXIT },
}

/** Full-surface swaps — a screen replacing another inside the same shell. */
export const surface = {
  initial: { opacity: 0, scale: 0.985, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: SPRING_SOFT },
  exit: { opacity: 0, scale: 0.99, y: -6, transition: EXIT },
}
