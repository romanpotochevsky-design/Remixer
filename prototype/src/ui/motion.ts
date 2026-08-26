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
 * Fullscreen sheet — the template picker (Figma 28616:59168): a 16px-inset
 * surface that covers the whole page. Unlike the centred checkout sheet this
 * one HAS a trigger, so rule 2 applies at full size: the caller sets
 * `transform-origin` to the pill that opened it and the sheet grows out of
 * that point. Scale starts much nearer 1 than a popover's — on a 1624px-wide
 * surface 4% is already a ~65px sweep at the far corner; any more reads as a
 * zoom, not as a surface arriving. Nothing here (or on the sheet) may carry a
 * live backdrop blur: the sheet is the biggest thing the product ever moves.
 */
export const fullscreenSheet = {
  initial: { opacity: 0, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    /* Opacity pulled forward on its own quick curve — the bubbleSend trick,
       for the same reason: a surface that stays translucent through the whole
       spring reads as gauze, not as a solid panel arriving. (It also shortens
       the window in which a 1624px layer needs alpha-blending, though measured
       on a software-rendered browser the open's cost is dominated by the
       full-viewport composite itself, which any full-screen motion pays.) */
    transition: { ...SPRING_SOFT, opacity: { duration: 0.15, ease: [0.2, 0, 0, 1] } },
  },
  exit: { opacity: 0, scale: 0.975, transition: EXIT },
}

/**
 * Rule 3 for the fullscreen sheet: the content column, one beat behind the
 * surface — and ONE block, never a stagger. Its grid is 18 cards; 18 springs
 * is 18 layers of cost and pure noise, so the whole column lands together.
 */
export const fullscreenContent = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { ...SPRING_SOFT, delay: 0.06 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
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
 * The same conveyor, one beat BEHIND a control that moved — the Home dock's
 * segmented control (`My projects | Templates`, Figma 28364:42996).
 *
 * Rule 3 turned sideways: the pill takes the gesture, the shelf answers it.
 * Everything is `listSwap` — same distances, same spring, same stagger — and
 * the beat is the only difference, so the two surfaces still speak one
 * language. It sits on the EXIT, because that is where the gesture starts:
 * under `AnimatePresence mode="wait"` the old shelf holds still for 60ms while
 * the pill sets off, and only then whisks up. (Delaying the entrance instead
 * would just add dead air in the middle — the exit already separates them.)
 */
export const listSwapBehind = {
  ...listSwap,
  exit: { ...listSwap.exit, transition: { ...EXIT, delay: 0.06 } },
}

/**
 * The conveyor with the movement taken out — what it becomes under
 * `prefers-reduced-motion`. Pick it with `useReducedMotion()`.
 *
 * ⚠️ THIS IS NOT REDUNDANT WITH `MotionConfig reducedMotion="user"`, and that
 * is the trap. The flag DISABLES transform animations, and "disabled" means the
 * value SNAPS to its target — so an exit whose target is `y: -12` does not stop
 * moving, it HOPS 12px, at ~90% opacity, and only then fades. A hop is not less
 * motion than a slide; it is worse motion, and it is the one thing the setting
 * exists to prevent. Measured on the dock's shelf: y = 0 → −12 in one frame at
 * opacity .906. The flag is still doing its job — nothing INTERPOLATES — but a
 * variant whose exit target is a displacement has to drop the displacement
 * itself, not just its animation.
 */
export const listSwapFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { ...SPRING_SOFT, staggerChildren: 0.055 } },
  exit: { opacity: 0, transition: { ...EXIT, delay: 0.06 } },
}

/**
 * A segmented control's pill changing seats — one object travelling, never a
 * cut. Only the LAW lives here; the seat geometry belongs to the control
 * (`DockTabs` in modules/home/Dock.tsx).
 *
 * WHICH SPRING, and why not the overlay one: `SPRING` (520/34/.9), described
 * at the top of this file as "quick, one barely-perceptible overshoot", is
 * exactly what a segmented pill wants — measured here it covers half the
 * 107px hop in ~60ms and is settled by ~250ms, with a ~2% overshoot that
 * reads as the pill seating itself rather than as a wobble. `SPRING_SOFT` is
 * for large surfaces and lands the same hop dead-flat: correct, and duller.
 * A control this small under the soft spring reads as sliding on rails.
 *
 * WHAT MOVES: nothing but `x`, on two layers. The two seats are DIFFERENT
 * widths (101 and 92, per position, as drawn), and a pill that `scaleX`es
 * between them ends its life with elliptical caps — 16px vertical radius
 * against 14.6 horizontal — i.e. a settled state that is no longer the
 * drawn one. So the travelling shape is a CAPSULE OF TWO: two identical
 * pills, one pinned to each end of the active seat, translating only.
 * The union of two equal-height capsules is always a capsule, so the ends
 * stay perfectly round at every width, and the seam is white-on-white.
 * (Their width is derived, not chosen — `CAP_W` in Dock.tsx: overlap them
 * too far and Chrome composites both antialiased cap arcs, which shows up as
 * a heavier pill in the settled pixel diff.)
 * Because a spring is a linear system, two springs with identical parameters
 * follow the same NORMALIZED curve whatever distance they cover — so the two
 * ends stay in phase, including when a click interrupts a flight already in
 * progress (both carry velocity proportional to their own distance).
 */
export const segmentedPill = { transition: SPRING } as const

/** Full-surface swaps — a screen replacing another inside the same shell. */
export const surface = {
  initial: { opacity: 0, scale: 0.985, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: SPRING_SOFT },
  exit: { opacity: 0, scale: 0.99, y: -6, transition: EXIT },
}
