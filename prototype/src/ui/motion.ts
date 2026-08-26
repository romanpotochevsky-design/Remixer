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
  /* Leaving UNDER something that is still flying (the picked template on its
     way into the composer): a shade longer than the plain exit, so the page is
     not fully lit before the object has landed on it. */
  dissolve: { opacity: 0, transition: { duration: 0.24, ease: [0.4, 0, 1, 1] } },
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
  /*
   * DISSOLVE — the sheet after "Choose a template". It leaves by fading where
   * it stands, and deliberately does NOT shrink back toward the pill: the
   * chosen template is at that moment flying across the whole screen into the
   * composer, and a surface collapsing toward one corner while an object flies
   * to another is two gestures fighting for one pair of eyes. The flying object
   * owns the eye; the ground it leaves behind only gets out of the way.
   */
  dissolve: { opacity: 0, transition: { duration: 0.24, ease: [0.4, 0, 1, 1] } },
}

/**
 * The fullscreen sheet when it is NOT the thing you are watching — the picker
 * opened on the template that is already attached (the tile's preview).
 *
 * Rule 2 does not apply, and applying it anyway would be wrong: on that path
 * the object flying out of the tile is the gesture, and a 1624px surface
 * inflating from the same point at the same time gives the eye two things to
 * follow. So the ground simply materialises under the flight and dissolves out
 * from under it — a fade, nothing else moves.
 */
export const fullscreenSheetFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, ease: [0.2, 0, 0, 1] } },
  dissolve: { opacity: 0, transition: { duration: 0.24, ease: [0.4, 0, 1, 1] } },
  exit: { opacity: 0, transition: { duration: 0.24, ease: [0.4, 0, 1, 1] } },
}

/**
 * ───────────────────── THE ATTACHMENT'S CHOREOGRAPHY ─────────────────────
 *
 * ONE OBJECT DOCTRINE. A template is a single physical thing: a card in the
 * picker's grid, the full-screen stage it grows into, and the 56px tile in the
 * composer. Every hand-off between those homes is the same FLIP morph with the
 * nested counter-scale — never a fade-out here plus a fade-in there. The
 * geometry lives in modules/home/TemplateFlight.tsx; the springs are here.
 *
 * WHY A BOUNCE ON ARRIVAL AND NONE ON DEPARTURE: rule 4. The attach is the
 * object being handed to you — it seats with one small overshoot, which is what
 * makes a 1600px stage collapsing into a 56px tile read as "caught" rather than
 * "shrunk". The way back up is a plain settle: nothing is being received.
 */

/** Stage → tile. Duration-based so the whole distance is covered in one beat
 *  whatever the viewport; bounce 0.16 = the tile dips ~1px past its box and
 *  seats. */
export const FLIGHT_SEAT = { type: 'spring', duration: 0.62, bounce: 0.16 } as const

/** Tile → stage. Slightly longer and flat: a surface arriving, not a catch. */
export const FLIGHT_OPEN = { type: 'spring', duration: 0.56, bounce: 0 } as const

/**
 * THE SNAP-ONCE RULE, and it is a performance rule before it is a taste one.
 *
 * The composer's field grows 46px when a template lands in it (138 → 184, board
 * 28726:64760). Transitioning its `height` would relayout the hero column on
 * every frame of the spring — the exact per-frame layout this project's contract
 * forbids. So the layout SNAPS in the one commit that adds the tile, and the
 * rows that moved are put back where they were with a transform and sprung home:
 * the eye sees a field growing, the browser sees one reflow. `useSnapSlide` in
 * modules/home/HomePage.tsx applies it; the distances are drawn constants (the
 * text row moves 72, the button row and the chip row 46), so nothing is measured
 * and nothing can drift.
 *
 * Growing is a spring with a hair of overshoot — it is opening WITH the tile
 * that is landing. Closing is flat and quicker (rule 4).
 */
export const FIELD_GROW = { type: 'spring', duration: 0.5, bounce: 0.12 } as const
export const FIELD_CLOSE = { type: 'spring', duration: 0.3, bounce: 0 } as const

/**
 * THE SCROLL-COMPACTING HEADER — the template picker's title block collapsing
 * as the grid scrolls under it (board 28734:65603 against 28616:59168).
 *
 * SAME LAW AS FIELD_GROW, one size up: the header's layout snaps 215 → 146 in a
 * single commit and everything that moved is put back with a transform and
 * sprung home (the heading owes 17px and a 48 → 32 type size, the chip row 53,
 * the divider and the grid 69). Springing the paddings instead would relayout
 * the sheet on every frame of a SCROLL handler — the worst possible place in
 * this codebase to break the no-per-frame-layout contract.
 *
 * WHY BOUNCE 0, against the house habit of a little overshoot on arrival: this
 * is not an arrival, it is a response to a gesture the user is still making.
 * The grid is being dragged by the wheel at the same moment the spring pulls it
 * up 69px, and an overshoot on top of live scrolling reads as the list
 * rubber-banding — i.e. as a bug in the scroller, not as physics. Same reason
 * `FLIGHT_OPEN` and `FIELD_CLOSE` are flat. Duration is a shade longer than
 * FIELD_GROW's because the distance is larger and the surface is bigger.
 */
export const HEADER_COMPACT = { type: 'spring', duration: 0.44, bounce: 0 } as const

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
 * ─────────── THE FILTERED GALLERY: the cards answer the chip, one by one
 *
 * A filter change is the same conveyor as everything else — old shelf out, new
 * shelf in on `listSwapBehind`'s 60ms beat behind the pill — with the per-item
 * stagger the house `listSwap` already carries. What the ITEM does is the one
 * thing that had to be different: **it pops, it does not slide.**
 *
 * WHY NOT `listSwapItem`'s 14px rise: the dock's shelf lives inside a horizontal
 * ScrollArea, and `overflow-x: auto` forces the other axis to `auto` too — the
 * box clips vertically, and it has no slack to clip into (the cards are
 * `items-stretch` in a 272px band, so card height IS scroller height). A 14px
 * rise there cuts 14px off every card's bottom edge and opens a 14px band of
 * ground above it for the length of the animation. Scale is the one displacement
 * a clipping box cannot cut: 3.5% of a 238px card is ~8px of travel on all four
 * edges, entirely inside the box. The picker's grid has room for a rise, but it
 * gets the same variant on purpose — one dialect for "the gallery was filtered",
 * whichever home you are looking at.
 *
 * The stagger is sized to the count, because the tail is what you feel: 6 dock
 * cards × 55ms = 275ms, but the picker's 18 × 55ms would be 935ms of cards still
 * arriving long after the press. `gridSwapBehind` tightens it to 22ms (18 × 22 =
 * 396ms), which is the same cascade at the same total length.
 */
export const listSwapPop = {
  initial: { opacity: 0, scale: 0.965 },
  animate: { opacity: 1, scale: 1, transition: SPRING_SOFT },
} as const

/**
 * The same item under `prefers-reduced-motion` — opacity only.
 *
 * ⚠️ Third instance of the same trap (`listSwapFade`, `cardAddFade`): the root
 * `MotionConfig reducedMotion="user"` does not cancel a transform target, it
 * JUMPS to it, so `listSwapPop` under the setting would park every card at
 * 0.965 and snap it to 1 — a pop where the user asked for none.
 */
export const listSwapPopFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: SPRING_SOFT },
} as const

/** `listSwapBehind` with the stagger sized for the picker's 18 cards. */
export const gridSwapBehind = {
  ...listSwapBehind,
  animate: { ...listSwapBehind.animate, transition: { ...SPRING_SOFT, staggerChildren: 0.022 } },
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

/**
 * ONE LAW, TWO CONTROLS — and on the second one the capsule of two becomes a
 * CAPSULE OF THREE (the filter chips, designer's order 26.08.2026: make the
 * filter switch a gesture, not a swap).
 *
 * `CategoryChips` in modules/home/Dock.tsx flies the same white pill between
 * chips on the same `SPRING`, for the same reason and with the same proof of
 * phase (a spring is a linear system, so the normalized curve — half-way at
 * ~62ms — is the same whether the hop is 122px or 762px; only the velocity
 * scales, and so does the overshoot: 1.84% analytic, +13px measured on the long
 * one). What does NOT transfer is the ink timing: this control's pill crosses up
 * to five labels on its way, so their ink is driven by the pill's POSITION
 * rather than by a tuned delay (`.home-chip-ink`, index.css).
 *
 * What does NOT transfer is the two-capsule trick, and the arithmetic says so
 * before any eye does. Two halves of width C at seats of width W hold a seamless
 * union only while `W − C ∈ [R, C − 2R]`, i.e. `C ∈ [Wmax/2 + R, Wmin − R]`.
 * The dock's two seats (101, 92 at R 16) leave a wide window. The chips, measured
 * off the built page, run 68.53…152.39 wide at R 18 — window `[94.20, 50.53]`,
 * EMPTY, and it is empty for a structural reason: the trick needs every seat to
 * be at least twice its own height, and `More` is 1.9×.
 *
 * So the third layer is a plain RECTANGLE between the two cap centres, scaled on
 * X. It costs one more layer and buys exactness: with the pill expressed as two
 * motion values (left edge, right edge) the bar's right end is
 * `(L + R_cap) + REF · sx = R − R_cap` = the right cap's centre ALGEBRAICALLY, on
 * every frame and under interruption, instead of by two springs happening to
 * agree. A rectangle has no corner radius to distort under `scaleX`, which is
 * the whole reason the pill was never allowed to scale.
 */

/**
 * THE TEMPLATE CARD'S HOVER AFFORDANCE — the blue `+` that offers a card
 * straight to the composer, and the gradient plate that keeps the caption from
 * colliding with it. Board 28626:606: the button `28637:42070`, the plate
 * `28740:66863`. Neither is drawn with a state, so this law is ours.
 *
 * THE BUTTON SPRINGS, ITS OPACITY DOES NOT. Scale rides `SPRING`, whose ~2%
 * overshoot is what makes a 32px control read as SEATING itself rather than
 * blinking on; opacity gets its own 120ms tween, because a spring on opacity
 * would keep the button faint for a third of a second and the affordance has to
 * answer a gesture the user is still making. Together they give a control that
 * is legible almost at once and settles a beat later.
 *
 * THE PLATE FADES WITH IT, NOT AFTER IT. Same 120ms tween, same start: the
 * plate exists to stop the caption standing at full strength beside a solid
 * button, so any lag it took would show the exact collision it was added to
 * prevent. Ramping together, the text is always being covered at the rate the
 * button is arriving.
 *
 * LEAVING IS `EXIT` (rule 4), and the button gives up only a tenth of its size
 * on the way out — a control that collapses reads as cancelled, and this one is
 * simply no longer on offer.
 */
export const cardAdd = {
  off: { opacity: 0, scale: 0.9, transition: EXIT },
  on: {
    opacity: 1,
    scale: 1,
    transition: { ...SPRING, opacity: { duration: 0.12, ease: [0.2, 0, 0, 1] } },
  },
} as const

/**
 * The same affordance with the movement taken out — the plate ALWAYS (it only
 * ever had opacity), and the button under `prefers-reduced-motion`.
 *
 * ⚠️ It exists for the reason `listSwapFade` exists: `MotionConfig
 * reducedMotion="user"` does not cancel a transform target, it JUMPS to it.
 * Under the setting, `cardAdd` would park the button at 0.9 and snap it to 1 —
 * a hop where the user asked for none. A variant whose target is a
 * displacement has to drop the displacement itself, not just its animation.
 */
export const cardAddFade = {
  off: { opacity: 0, transition: EXIT },
  on: { opacity: 1, transition: { duration: 0.12, ease: [0.2, 0, 0, 1] } },
} as const

/**
 * The plate: arrives WITH the button, leaves AFTER it.
 *
 * Coming in they share one tween — see `cardAdd`. Going out they must not: a
 * button fading from 1 to 0 is translucent for most of those 140ms, and if the
 * plate fades with it the caption comes back UNDER the ghost and reads through
 * it. Filmed at 3× (scratchpad/qa16), that is the muddiest frame of the whole
 * gesture — and it is precisely the collision the plate was added to prevent, so
 * the plate has no business leaving first. It holds for 100ms while the button
 * dissolves and then lifts, which reads as a shadow being taken off the text.
 *
 * The plate is invisible on its own (it is the ground colour, on the ground), so
 * this costs nothing anywhere else on the card.
 */
export const cardAddScrim = {
  off: { opacity: 0, transition: { ...EXIT, delay: 0.1 } },
  on: cardAddFade.on,
} as const

/** Full-surface swaps — a screen replacing another inside the same shell. */
export const surface = {
  initial: { opacity: 0, scale: 0.985, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: SPRING_SOFT },
  exit: { opacity: 0, scale: 0.99, y: -6, transition: EXIT },
}
