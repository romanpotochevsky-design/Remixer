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

import type { Easing } from 'motion/react'

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
 * A CARD ARRIVING IN THE THREAD — the brief summary after Submit, the generation outline
 * after Approve (designer, 09.09.2026: "красивую и плавную анимацию появления этих
 * компонентов в чате, анимацию в стиле apple liquid glass").
 *
 * Liquid Glass, the way iOS 26 opens a surface, is three motions at once and none of them
 * is a fade:
 *  · the glass INFLATES out of where the gesture happened, with one soft overshoot — both
 *    cards are born in the dock, where Submit / Approve were pressed, so they rise from
 *    their bottom edge (`origin-bottom` on the card);
 *  · the CONTENT lags the glass by a beat and settles the OPPOSITE way — the glass grows
 *    onto its size while the contents shrink onto theirs, which is what reads as a lens
 *    focusing rather than a picture fading in; the rows inside then arrive one after
 *    another, top to bottom;
 *  · the glass catches the LIGHT as it forms — a rim highlight that brightens and fades
 *    (`.card-arrive`, index.css "THE CARD THAT ARRIVES"). Opacity only.
 * Everything here is transform and opacity. The delay lets the dock start folding its
 * sheet into the collar first: the answers go down, and the card rises out of the fold.
 */
export const cardIn = {
  initial: { opacity: 0, scale: 0.94, y: 22 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      duration: 0.68,
      bounce: 0.2,
      delay: 0.08,
      opacity: { duration: 0.24, delay: 0.08, ease: [0.2, 0, 0, 1] },
    },
  },
}
/** The card's inner surface: one beat behind the glass, focusing onto it from slightly large. */
export const cardInBody = {
  initial: { opacity: 0, scale: 1.035, y: 4 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', duration: 0.6, bounce: 0.1, delay: 0.16, opacity: { duration: 0.22, delay: 0.16 } },
  },
}
/** Rows inside the card, one after another (`custom` = the row's index). */
export const CARD_ROW_STAGGER = 0.045
export const cardInRow = {
  initial: { opacity: 0, y: 8 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...SPRING_SOFT, delay: 0.22 + i * CARD_ROW_STAGGER, opacity: { duration: 0.2, delay: 0.22 + i * CARD_ROW_STAGGER } },
  }),
}
/* Reduced motion: the offsets and scales are DROPPED, not jumped into (the `listSwapFade`
   lesson) — the card and its rows simply come up in place. */
export const cardInFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.24, ease: [0.2, 0, 0, 1] } },
}
export const cardInBodyFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, delay: 0.1 } },
}
export const cardInRowFade = {
  initial: { opacity: 0 },
  animate: (i: number) => ({ opacity: 1, transition: { duration: 0.2, delay: 0.14 + i * 0.03 } }),
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
 * CONFIRM — the "are you sure?" dialog (Figma 30282:52052), and the softest arrival in
 * the product on purpose.
 *
 * A confirm interrupts. The checkout sheet is something you asked for and it can afford a
 * brisk spring; this one appears BECAUSE you pressed something, and it has to read as the
 * product catching your arm, not as a box being thrown at you. So: a longer, softer spring
 * with a little life in it (bounce .22 over .44s), a 10px rise and a 6% inflate — small
 * enough that a 560px sheet never reads as a zoom, large enough that the eye sees it
 * arrive rather than blink into place.
 *
 * It leaves the way everything in this product leaves: faster than it came, and without
 * the bounce (motion.ts rule 4). The scrim is one beat behind on the way in and one beat
 * ahead on the way out, so the dialog is never seen against an already-lit page.
 *
 * ⚠️ Under reduce the OFFSETS ARE THROWN AWAY, not jumped to — `confirmSheetFade` exists
 * for exactly the trap this project has fallen into four times: `MotionConfig
 * reducedMotion="user"` does not cancel a transform target, it snaps to it.
 */
export const confirmScrim = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: [0.2, 0, 0, 1] } },
  exit: { opacity: 0, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } },
}

export const confirmSheet = {
  initial: { opacity: 0, scale: 0.94, y: 10 },
  animate: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', duration: 0.44, bounce: 0.22, opacity: { duration: 0.16 } },
  },
  exit: { opacity: 0, scale: 0.975, y: 4, transition: EXIT },
}

export const confirmSheetFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.16 } },
  exit: { opacity: 0, transition: EXIT },
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

/*
 * A BLOCK UNFOLDING INSIDE A PANEL — the Publish panel's cards, its domain row, its nudge
 * (`ui/Reveal.tsx`; designer, 16.09.2026, from a recording of the connection walk: «внутри
 * формы появляются и исчезают объекты, и высота формы резко меняется… нужно чтобы оно не
 * резко прыгало, а плавно и красиво с плавной анимацией меняло высоту, а те объекты что
 * внутри появляются и пропадают тоже должны иметь плавную и красивую анимацию. в стиле
 * apple liquid glass!» — and, pointing at the brief's question dock, «с bounce effect»).
 *
 * The block's EDGE is the thing that moves. Its box springs from nothing to the content's
 * measured height with one soft overshoot — the same damping the dock's piston has
 * (ζ ≈ .68, about 5 % past the mark), because that is the bounce the designer accepted
 * there after two cuts with less («не хватает отдачи»). The glass rides in a beat behind
 * the edge (rule 3), coming up from slightly small and slightly HIGH — it is born at the
 * seam it unfolds from, so it slides out from under the block above rather than rising out
 * of nowhere — and it catches the light as it forms (`.card-arrive`, the thread cards'
 * glint). The GLASS leaves the way rule 4 says — gone in 140 ms, flat. The EDGE does not
 * leave: it is the panel's own outline moving to a new resting height, and it moves with
 * the same spring in both directions (designer, 17.09.2026, asked whether the panel's
 * shrink after Publish should carry «нашу фирменную apple liquid glass анимацию с bounce
 * effect»: «да нужен»). Below zero the clip cannot go, so `ui/Reveal.tsx` carries the
 * overshoot as a negative bottom margin: the blocks under the folding one, and the
 * panel's bottom edge with them, dip a few pixels past their resting place and come back.
 * Rule 4 is about DISMISSAL — a menu, a sheet, a block's glass; a persistent surface
 * settling to a new size is a movement, and Apple's glass bounces on the way small too
 * (the Dynamic Island shrinking back).
 *
 * ⚠️ THIS ANIMATES `height`, AND THAT IS A MEASURED EXCEPTION to this file's rule, taken
 * the way `.shell-aside`'s width took it. The panel is a fixed 432px overlay: the per-frame
 * layout is the panel's own few dozen boxes and nothing else on the page — the numbers are
 * in `ui/Reveal.tsx`. A transform cannot do this job: a card growing by `scaleY` stretches
 * its text, and a FLIP of the rows below would still leave the panel's own bottom edge —
 * the one thing the eye follows — to snap. Not a licence for anything else: the thread's
 * dock stays on its piston, the composer's field on its snap-once slide.
 */
export const REVEAL_OPEN = { type: 'spring', duration: 0.62, bounce: 0.32 } as const
/** The edge folding: the SAME physics as unfolding — one outline, one spring (17.09.2026; was
 *  .3 s flat until the designer asked for the bounce on the shrink). Only the glass inside
 *  leaves fast and flat (`revealBody.exit`). */
export const REVEAL_CLOSE = { type: 'spring', duration: 0.62, bounce: 0.32 } as const
export const revealBody = {
  initial: { opacity: 0, scale: 0.96, y: -6 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      duration: 0.62,
      bounce: 0.24,
      delay: 0.06,
      opacity: { duration: 0.26, delay: 0.1, ease: [0.2, 0, 0, 1] },
    },
  },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } },
} as const
/* Reduced motion: the offsets and the scale are DROPPED, not jumped into (the shelf-of-the-dock
   lesson) — the block simply comes up in place while its edge opens without a spring. */
export const revealBodyFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.24, ease: [0.2, 0, 0, 1] } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
} as const
/**
 * WORDS CHANGING INSIDE A BLOCK THAT STAYS — the in-flight card's stage, the address in the
 * URL field, the status chip in the domain row. A sequential hand-off under
 * `AnimatePresence mode="wait"`: the old words are gone in 120 ms before the new ones come
 * up, so two stages are never printed over each other (the question dock's double-exposure
 * lesson). The box's height difference, if any, is the Reveal around it.
 */
export const swapText = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: [0.2, 0, 0, 1] } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: [0.4, 0, 1, 1] } },
} as const

/*
 * The question dock's sheet (BriefPanel, PlanCard). The dock itself grows as a PISTON
 * (index.css "THE BUBBLE", driven by modules/chat/dock.ts): the shell's edge, rim and
 * corners travel up out of the collar around the field on one damped spring, and the
 * sheet's content rides that same curve, fading in once the edge has cleared the field —
 * all of it CSS, on the dock's classes, so that a piston and a passenger on different
 * clocks cannot tear. The exit is CSS too (`dock-sink` / `dock-out`, 220ms): the content
 * fades while the piston sinks. Leaving is quicker than arriving, and without a bounce —
 * the house rule for overlays.
 *
 * ⚠️ What motion does here is only HOLD the element in the tree for the fall: an "exit"
 * that goes to an opacity indistinguishable from 1. It used to fade the content itself,
 * and that fade — a compositor tween — hands the element back at its inline opacity of 1
 * for the one frame between finishing and React removing the node: the questions flashed
 * at full brightness over an already-gone shell (measured, one frame at t≈290ms). A CSS
 * fill-forwards fade on the dock's own classes has no such frame, so the fade lives there.
 */
export const DOCK_FALL_MS = 260
export const sheetExit = {
  exit: { opacity: 0.999, transition: { duration: DOCK_FALL_MS / 1000, ease: 'linear' } },
} as const

/*
 * Changing question (Next, ‹ ›). The shell's edge morphs to the new height on the dock's
 * spring; the question and its answers are swapped as ONE group, `popLayout`, so the
 * layout snaps to the new height at once and the outgoing group rides the edge while it
 * fades. Direction is carried in `custom`: forward, the new step comes in from the right
 * and the old leaves to the left, the way a wizard pages — back, the reverse. The footer
 * does not move: its buttons are anchored to the field, under the pointer that pressed
 * them.
 *
 * ⚠️ `stepSwapFade` is the reduced-motion variant and drops the x OFFSETS, not just the
 * spring: MotionConfig would otherwise jump x to its target and fade from there (the
 * shelf-of-the-dock lesson, 26.08.2026).
 */
/*
 * ⚠️ THE HAND-OFF IS SEQUENTIAL, NOT A CROSS-FADE (designer's screen recording,
 * 08.09.2026: "при переходах есть дефекты и глюки визуальные"). The first cut
 * had the old question fading out over 170ms while the new one's opacity was
 * already climbing from 80ms: a 90ms window in which two whole questions —
 * title, rows, card, field — were painted over each other at about half alpha
 * each. On this much content that does not read as a cross-fade, it reads as a
 * double exposure ("Which lettering suits the tone?" printed through "Which
 * colours feel right?", measured off the recording's frames 51-53).
 *
 * So the old one leaves FAST and is gone before the new one starts to appear:
 * out by 120ms, in from 140ms. One frame of the bare panel between them is the
 * price, and it is invisible — the panel's own edge is morphing through it.
 * The x spring is untouched: what was wrong was the overlap, not the travel.
 */
export const stepSwap = {
  initial: (dir: number) => ({ opacity: 0, x: 36 * dir }),
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      x: { type: 'spring', duration: 0.56, bounce: 0.2 },
      opacity: { duration: 0.2, delay: 0.14 },
    },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: -24 * dir,
    transition: { duration: 0.12, ease: [0.4, 0, 1, 1] },
  }),
} as const
export const stepSwapFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, delay: 0.12 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
} as const

/*
 * THE SCROLL-COMPACTING HEADER USED TO HAVE A SPRING HERE — `HEADER_COMPACT`
 * (duration .44 / bounce 0), the `FIELD_GROW` law one size up: the picker's
 * header snapped 215 → 146 in one commit and everything that moved was put back
 * with a transform and sprung home.
 *
 * It is GONE (26.08.2026 night) because the design it served was the designer's
 * scroll-jerk bug. Covering the snap kept the HEADER continuous while the GRID
 * moved 69px that nobody asked for — measured worst frame 16.6px of content
 * travel with `ΔscrollTop` exactly 0. The header's height is now a direct
 * function of the scroll offset (`useHeadRamp` in modules/home/TemplatePicker.tsx),
 * so there is no transition to time: the finger is the timeline. The law and its
 * numbers live in `design-system.md` §5 «Шапка, которая сжимается при скролле».
 *
 * The lesson the token carried is worth keeping even though the token is not:
 * a spring answering a gesture the user is STILL MAKING must not overshoot —
 * an overshoot on top of live scrolling reads as the scroller rubber-banding,
 * i.e. as a bug. Same reason `FLIGHT_OPEN` and `FIELD_CLOSE` are flat.
 */

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

/*
 * THE CANVAS: A PANE UNFOLDS FROM THE BUTTON THAT OPENED IT (designer, 22.09.2026, from two
 * recordings of the live editor's site ⇄ Cloud switch: «есть такая типа прикольная анимация как одно
 * окно прикольно уезжает, а другое приезжает… сделать эту анимацию перехода намного прикольнее,
 * плавнее и более стильно, чтобы… вписывалась в наш концепт Apple liquid glass… не навязчивую…
 * не бьёт по глазам»).
 *
 * WHAT THE LIVE PRODUCT DOES, measured frame by frame (52-fps recordings, scratchpad/live-editor/tr-*):
 * a vertical push. The site shrinks to 92 % over ~100 ms, holds, then LEAVES UPWARD in 4–5 frames
 * (70–80 ms, accelerating: its top at 97 → 125 → 178 → 256 → 359 on a 1400-wide frame); the Cloud
 * window rides in from below the same instant and then GROWS 92 → 100 % over ~250 ms, easing out.
 * Closing mirrors it: the site drops in from above, decelerating over ~180 ms, then grows. ~500 ms in
 * all. It reads as a carousel — two cards on a vertical belt — and what keeps it at "норм" is that the
 * belt is a hard slide with no spring, the two moves (slide, then grow) are separately visible, and
 * nothing connects the window to the button that asked for it.
 *
 * OURS — three ideas, one motion:
 *  1. IT GROWS FROM WHAT YOU TOUCHED (rule 2, taken literally). The pane stands at its final size and
 *     place from the first frame; what animates is its CLIP — `clip-path: inset(… round 16px)` from
 *     the trigger's footprint to the whole canvas. The Cloud button is a 48 × 48 tile at radius 16; the
 *     window is 1983 × 1112 at radius 16 — one shape at two sizes, so the rectangle simply unfolds out
 *     from under the rail, corners intact all the way (a scale would stretch them into ellipses). A
 *     clip is also what keeps the window's contents crisp and undistorted: the frame moves, the
 *     picture inside does not — it is revealed.
 *  2. THE SITE RECEDES; IT IS NOT PUSHED OFF. The canvas is a stack in depth, not a belt: the pane comes
 *     forward OVER the site, and the site steps back into the dark under it — scale .955, 10 px down,
 *     fading late (ease-in), so the strip the pane has not yet covered is still the site, dimming.
 *     No crossfade: the pane is opaque and its clip is a hard edge, so at every pixel it is either the
 *     pane or the site, never the two drawn through each other (the dock's double-exposure lesson).
 *     Both stand in the same box (`absolute`), the pane above (`z-10`), the site below.
 *  3. LIQUID GLASS, the house version. A spring on the clip (.62 s, bounce .12) — its overshoot lands
 *     OUTSIDE the box, so the visible edge decelerates into place and never bounces back; the
 *     contents focus onto the glass from slightly large (1.015 → 1, origin at the button — Panel
 *     Arrival's 1.03, scaled to a 1700-wide surface); the rim catches the light (`.glass-glint`) in
 *     the MODULE'S OWN TONE — the Cloud window is lit violet by the button that opened it. Inside, the
 *     window fills in a beat later (index.css «THE PANE THAT UNFOLDS»: menu from the left, header,
 *     headings, rows cascading) — rule 3, the contents lag the container.
 *
 * Leaving is rule 4: the clip folds back into the button over 360 ms, no bounce, the pane dissolving
 * over its last 200 ms so the patch melts into the tile rather than snapping off; the site comes
 * forward under it (.955 → 1 on a soft spring, opacity 260 ms) — it was there all along, one layer
 * down. The Publish panel, when a press has asked for it, still holds until the site stands (App.tsx
 * `hold`), and everything here runs on the main thread (`onUpdate` stubs): a composited fade hands
 * the element back at its pre-animation inline opacity for one frame — the three blinks traced on
 * 16.09.2026 — and main-thread animations write their last frame themselves.
 *
 * ⚠️ The pane's `custom` is captured ONCE, at mount (App.tsx `CanvasPane`): a pane must fold back to
 * the button it came from, not to whatever opened the next one. ⚠️ The clip's inset is in the pane's
 * own pixels (both ends), never `%` at one end and `px` at the other — motion cannot mix the units.
 */
/*
 * POLISH, 23.09.2026 (designer: «делай анимацию открытия/закрытия окна как ты предложил») — four things
 * the first cut lacked, all driven by ONE progress value `p` (0 = folded into the button, 1 = the canvas),
 * animated imperatively in App.tsx `CanvasPane` (motion values, not variants, so the rim and the flyer can
 * read the same clock):
 *  · A REAL EDGE ON THE MOVING CLIP (`PaneRim`). A clip opens a picture through a window, and the frame on
 *    the window does not move — the dock bubble's lesson («бордер глючит»): during the unfold the visible
 *    edge was a raw cut through the window, and the hairline plus the glint appeared only on landing.
 *    Now four 1px lines and four r16 corner arcs ride the clip edge (transform only — a 1×1 line scaled
 *    along its length stays 1px thick), LIT in the module's tone while the glass moves (`glow` 1) and
 *    cooling to nothing over .5 s once it has landed, where the window's own hairline takes over.
 *  · THE MARK FLIES WITH THE EDGE (`PaneFlyer`). The window's cloud mark rides just inside the leading
 *    corner of the clip from the rail button's glyph to its seat in the menu header — position and colour
 *    (#9575cd → #7e57c2) both functions of `p`, so it flies back on the fold for free. The real mark is
 *    hidden while `data-pane-flying` is on the pane. Two clouds are on screen for the flight — the tile
 *    keeps its own, as an iOS home-screen icon stays while its app zooms out of it.
 *  · THE CONTENTS SETTLE VISIBLY (`PANE_SETTLE`). The clip lands crisp; the picture INSIDE the frame
 *    (`data-pane-settle`, a wrapper the surface provides via `usePaneSettle`) breathes once — 1.03 → .99 →
 *    1.002 → 1 over 720 ms. A real spring on a 1.5 % travel overshoots by .06 % — invisible — so the dip
 *    is written as keyframes. On the frame itself a dip would open a gap between the rim and the window's
 *    border; on the contents it reads as the picture settling into the glass.
 *  · The pane no longer scales on the way in (the settle took that job); on the way out it still goes a
 *    hair smaller (.98) with the fold.
 * The rail button answers with its own light — see App.tsx `RailFill` (the accent floods the tile from
 * the point of the click) — and stays lit until the pane has folded back into it.
 */
/** The unfold: one spring for the clip, whose overshoot lands outside the box. */
export const PANE_OPEN = { type: 'spring', duration: 0.62, bounce: 0.12 } as const
/** The fold: faster, no bounce (rule 4). `PANE_CLOSE_MS` is the same number for the rail tile that
 *  stays lit until the pane has folded back into it (App.tsx `closingTile`). */
export const PANE_CLOSE_MS = 360
export const PANE_CLOSE = { duration: PANE_CLOSE_MS / 1000, ease: [0.4, 0, 0.2, 1] } as const
/** How long the pane counts as "just arrived" for its contents' cascade (index.css `[data-pane-fresh]`). */
export const PANE_FRESH_MS = 1100
/** The contents' settle inside the landed frame: one visible breath, written as keyframes. */
export const PANE_SETTLE_FROM = 1.03
export const PANE_SETTLE_KEYS = [PANE_SETTLE_FROM, 0.99, 1.002, 1]
export const PANE_SETTLE = { duration: 0.72, times: [0, 0.5, 0.78, 1], ease: ['easeOut', 'easeInOut', 'easeOut'] as Easing[] }
/** The pane's opacity: solid almost at once — it is glass sliding over the site, not a fade. */
export const PANE_SOLID = { duration: 0.12, ease: [0.2, 0, 0, 1] } as const
/** The fold's dissolve: spent LAST, so the leaving window is never a large translucent thing. */
export const PANE_DISSOLVE = { duration: 0.2, delay: 0.16, ease: [0.4, 0, 1, 1] } as const
/** The moving rim cools once the pane has landed and the window's own hairline shows through. */
export const PANE_RIM_COOL = { duration: 0.5, ease: [0.2, 0, 0, 1] } as const
/** How strong a TINTED light on the pane is, against the white one (designer 24.09.2026, on the Cloud
 *  window's violet edge mid-unfold: «мне не очень нравится во время анимации этот цветной бордер, я бы
 *  сделал его раза в 2 прозрачнее»). Multiplies every alpha of the pane's rim (`.pane-rim`, .62 → .31) and
 *  of its glint (`.glass-glint`, .24 / .14 / .05 → half) through `--glint-k`; the white lights — the cards',
 *  the Publish panel's, the Domains window's — keep 1. A tint reads louder than white at the same alpha
 *  because it is a HUE on a neutral ground, not just a lighter line: the same light, half the ink. */
export const PANE_TINT_K = 0.5
/** Reduced motion: the pane simply comes up and goes in place. */
export const PANE_FADE_IN = { duration: 0.24, ease: [0.2, 0, 0, 1] } as const
export const PANE_FADE_OUT = { duration: 0.16, ease: [0.4, 0, 1, 1] } as const
/** The site as the ground the pane stands on: back into the dark under an arriving pane, forward
 *  under a leaving one. */
export const SITE_FORWARD = { type: 'spring', duration: 0.6, bounce: 0.08 } as const
export const canvasSite = {
  initial: { opacity: 0, scale: 0.955, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { scale: SITE_FORWARD, y: SITE_FORWARD, opacity: { duration: 0.26, ease: [0.2, 0, 0, 1] } },
  },
  exit: {
    opacity: 0,
    scale: 0.955,
    y: 10,
    /* the pane covers it from the right as it goes; the fade is late so the uncovered strip is
       still the site, dimming — not a hole */
    transition: { duration: 0.4, ease: [0.4, 0, 0.6, 1], opacity: { duration: 0.4, ease: [0.7, 0, 1, 1] } },
  },
} as const
/*
 * TWO MORE WAYS A WINDOW CAN ARRIVE (designer, 24.09.2026, with a recording of the unfold: «в целом
 * вариант хороший и он похож на наш apple liquid glass стиль анимаций. но я бы хотел посмотреть еще
 * на какие то вариант 2 других анимаций открытия и закрытия этих больших окон и переключения между
 * ними… с другой задумкой абсолютно и концепцией… очень стильные, современные, плавные… не бить по
 * глазам и не надоедливыми»). The unfold stays in the system (`PANE_OPEN` above — the window grows out
 * of its button); these are the other two ideas, switched in the console (world.ts `PaneMotion`), and
 * each is one idea carried through open, close AND the switch from one window to another.
 * ✅ 25.09.2026 — he picked the SHEET: «сделать анимацию Sheet по умолчанию, а переключатель можно
 * оставить… пусть это будет анимация наша фирменная в дизайн системе для переключения вот таких больших
 * окон». It is the default and the design-system motion for large canvas windows; the constants below
 * are therefore house numbers, not a candidate's — change them the way the dock bubble's are changed,
 * by a measured decision. The switch stays so he can still hold the other two next to it:
 *
 *  · SHEET — the window is a sheet of glass that RISES from below the canvas and sits down, while the
 *    site steps BACK into depth like the card behind an iOS sheet (scale .94, a few px up, dimming).
 *    It condenses as it rises — clear at the first frame, solid by 160 ms — so the top 70 % of the
 *    canvas is never covered by a hard cut. One spring for the travel and the .97 → 1 growth from its
 *    bottom edge (`SHEET_OPEN`), a little bounce because a sheet sitting down has weight. Closing drops
 *    it back 22 % and dissolves it in the second half (the fold's rule: spent last). Switching windows
 *    STACKS: the old sheet steps back a notch (.955, up 1.2 %, to 55 %) as the new one rises over it,
 *    and is taken away only once covered — the depth is the hand-over.
 *  · FOCUS — the window FOCUSES INTO PLACE: from .94 and clear to 1 and solid over 380 ms on one
 *    ease-out, no travel, no bounce — the restraint of a macOS window opening. Closing defocuses it back
 *    the same way. Switching windows is a PASS THROUGH DEPTH: the old window comes forward past the
 *    viewer (→ 1.035, dissolving in 200 ms) while the new one arrives from behind (.96 → 1, a 100 ms
 *    beat later); the overlap is ~60 ms — four frames of two half-windows, the crossfade of Mission
 *    Control, not the double exposure the dock forbids over a whole second.
 *
 * Both are transform and opacity only, main-thread (motion values), and neither has a moving edge to
 * light — the window moves as one object, so its own hairline IS the edge (the dock bubble's rule
 * without the rim); the landing light is the glint the unfold also wears. Under reduced motion all
 * three collapse to `PANE_FADE_IN` / `PANE_FADE_OUT`.
 */
/** Sheet: how far below its seat it starts, as a share of its own height, and how small. */
export const SHEET_RISE_PCT = 28
export const SHEET_SCALE_FROM = 0.97
export const SHEET_OPEN = { type: 'spring', duration: 0.64, bounce: 0.16 } as const
/** …and the glass condensing as it rises: clear → solid in the first 160 ms. */
export const SHEET_CONDENSE = { duration: 0.16, ease: [0.2, 0, 0, 1] } as const
/** Closing: back down 22 %, a hair smaller, dissolving in the second half. */
export const SHEET_DROP_PCT = 22
export const SHEET_CLOSE_MS = 320
export const SHEET_CLOSE = { duration: SHEET_CLOSE_MS / 1000, ease: [0.4, 0, 0.6, 1] } as const
export const SHEET_CLOSE_DISSOLVE = { duration: 0.18, delay: 0.14, ease: [0.4, 0, 1, 1] } as const
/** Switching: the old sheet steps back behind the new one, then goes once covered. */
export const SHEET_BACK_SCALE = 0.955
export const SHEET_BACK_Y_PCT = -1.2
export const SHEET_BACK_DIM = 0.55
export const SHEET_BACK = { duration: 0.42, ease: [0.2, 0, 0, 1] } as const
export const SHEET_BACK_OUT = { duration: 0.12, ease: [0.4, 0, 1, 1] } as const
/** The site under an arriving sheet: back into depth like the card behind an iOS sheet — smaller,
 *  a few px UP (the sheet comes up, the card behind goes the other way), fading late. */
export const canvasSiteSheet = {
  initial: { opacity: 0, scale: 0.955, y: 10 },
  animate: canvasSite.animate,
  exit: {
    opacity: 0,
    scale: 0.94,
    y: -12,
    transition: { duration: 0.5, ease: [0.2, 0, 0, 1], opacity: { duration: 0.5, ease: [0.7, 0, 1, 1] } },
  },
} as const

/** Focus: into place from slightly behind, one ease-out, no bounce. */
export const FOCUS_FROM = 0.94
export const FOCUS_OPEN_MS = 380
export const FOCUS_OPEN = { duration: FOCUS_OPEN_MS / 1000, ease: [0.2, 0.7, 0.2, 1] } as const
export const FOCUS_SOLID = { duration: 0.26, ease: [0.2, 0, 0, 1] } as const
/** Defocus on close: back to .94 and clear, quicker (rule 4). */
export const FOCUS_CLOSE_MS = 240
export const FOCUS_CLOSE = { duration: FOCUS_CLOSE_MS / 1000, ease: [0.4, 0, 1, 1] } as const
/** Switching: the old window passes the viewer — forward and dissolving… */
export const FOCUS_PASS_TO = 1.035
export const FOCUS_PASS = { duration: 0.2, ease: [0.4, 0, 1, 1] } as const
/** …and the new one arrives from behind, a beat later (the beat is what keeps the overlap to ~4 frames
 *  of two half-windows — traced 24.09.2026: old at .5 by 100 ms and gone at 200, new solid from 100). */
export const FOCUS_BEHIND_FROM = 0.96
export const FOCUS_ARRIVE = { duration: 0.4, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] } as const
export const FOCUS_ARRIVE_SOLID = { duration: 0.22, delay: 0.1, ease: [0.2, 0, 0, 1] } as const

/* Reduced motion for the site: no scale, no offset — it simply comes up and goes in place. */
export const canvasSiteFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.22, ease: [0.2, 0, 0, 1] } },
  exit: { opacity: 0, transition: EXIT },
} as const

/*
 * THE PUBLISH PANEL ARRIVES AS GLASS (designer, 17.09.2026, confirming the Connect hand-over:
 * «сначала анимация закрытия окна Domains, потом плавная и стильная анимация открытия Publish в
 * стиле Apple liquid glass»). Until now the panel came in on `popover` — the menu's language: a
 * quick house spring from .94, contents 60 ms behind, no light. Liquid Glass in this product is
 * the thread cards' arrival (`cardIn`), and the panel now speaks it:
 *  · the glass INFLATES from the corner it hangs off — `origin-top-right`, the Publish button it
 *    covers — from .94 with one soft overshoot (spring .68 / bounce .2: ζ ≈ .8, the peak ~.1 %
 *    past 1, the same numbers the cards were accepted on) and a short drop of 8px, so it comes
 *    DOWN out of the topbar rather than materialising in place;
 *  · the CONTENTS lag a beat (140 ms) and focus onto the glass from slightly LARGE (1.03 → 1),
 *    the lens settling rather than a picture fading in; opacity on its own quick curve so the
 *    panel is never gauze;
 *  · the rim catches the LIGHT — `.glass-glint`, the cards' `card-glint` worn as a child
 *    element, because `.card-arrive` sets `position: relative` and the panel is `fixed`.
 * Leaving stays rule 4: 140 ms, flat, a hair smaller — a dismissal.
 */
export const panelIn = {
  initial: { opacity: 0, scale: 0.94, y: -8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', duration: 0.68, bounce: 0.2, opacity: { duration: 0.24, ease: [0.2, 0, 0, 1] } },
  },
  exit: { opacity: 0, scale: 0.97, y: -2, transition: EXIT },
} as const
/** The panel's contents: a beat behind the glass, focusing onto it from slightly large. */
export const panelInBody = {
  initial: { opacity: 0, scale: 1.03, y: 4 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', duration: 0.6, bounce: 0.1, delay: 0.14, opacity: { duration: 0.22, delay: 0.14 } },
  },
  exit: { opacity: 0, transition: { duration: 0.1 } },
} as const
/* Reduced motion: the scales and offsets are DROPPED, not jumped into — the panel and its
   contents simply come up in place. */
export const panelInFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.24, ease: [0.2, 0, 0, 1] } },
  exit: { opacity: 0, transition: EXIT },
} as const
export const panelInBodyFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, delay: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
} as const

/**
 * A TOOLTIP (ui/Tooltip.tsx) — the smallest surface in the product, and it still opens the
 * way everything else here does (designer, 16.09.2026, on the status chip in the Publish
 * panel: «прикольная анимация появления и пропадания в стиле Apple liquid glass»).
 *
 * The bubble GROWS OUT OF ITS TAIL: the transform origin is the tail's tip, which sits 6px
 * off the thing you are pointing at, so the glass inflates from the target the way a popover
 * inflates from its trigger's corner (rule 2). One soft overshoot — ζ ≈ .62 on a spring quick
 * enough for a 24px object: scale peaks ~1.01 and is settled in ~200 ms (rule 1). The words
 * arrive a beat behind the glass (rule 3). Leaving is a straight 120 ms fade with a slight
 * shrink and no bounce (rule 4).
 *
 * ⚠️ Scale and opacity animate ON THE GLASS ELEMENT, never on a wrapper around it: the
 * bubble carries a `backdrop-filter`, and an ancestor with opacity < 1 leaves the blur
 * sampling nothing (CLAUDE.md, the prompt chips' lesson). The element's own opacity fades
 * the blurred backdrop with it.
 */
export const TOOLTIP_SPRING = { type: 'spring', stiffness: 640, damping: 26, mass: 0.7 } as const
export const tooltipIn = {
  initial: { opacity: 0, scale: 0.84 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { ...TOOLTIP_SPRING, opacity: { duration: 0.16, ease: [0.2, 0, 0, 1] } },
  },
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.12, ease: [0.4, 0, 1, 1] } },
}
/** Reduced motion: the scale is DROPPED, not jumped into — the bubble appears in place. */
export const tooltipInFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.16 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
}
/** The words inside the bubble, one beat behind the glass. */
export const tooltipText = {
  initial: { opacity: 0, y: 2 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, delay: 0.05, ease: [0.2, 0, 0, 1] } },
  exit: { opacity: 0, transition: { duration: 0.08 } },
}

/*
 * THE VERB THAT ROLLS — the in-flight card's headline handing over («Connecting …» →
 * «Propagating …»; designer, 16.09.2026, from a recording: «выглядит просто как блимание в
 * 1 кадр… как эту смену текста сделать более аккуратной и плавной и изящной?», and his pick
 * from the stand of four, variant B: «меняется только глагол, имя стоит»). What the recording
 * showed was the WHOLE row — arc included — dipping to nothing for two frames between a
 * 120 ms fade-out and a 200 ms fade-in: a sequential hand-off of the row reads as a blink.
 * Here nothing leaves the screen empty: the old verb rolls UP and out, 8 px in 160 ms, flat
 * and quick (the house rule for leaving); the next rolls up INTO place from 10 px below over
 * 280 ms, after a 60 ms beat so the two are never one smear; the host glides to its new x on
 * the same curve (`HOST_GLIDE`, a `layout` animation on the span that keeps its key); the
 * spinner is not part of the hand-off at all. Only `transform` and `opacity`.
 */
export const verbRoll = {
  initial: { y: 10, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.28, delay: 0.06, ease: [0.2, 0, 0, 1] } },
  exit: { y: -8, opacity: 0, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } },
} as const
/** Reduced motion: the roll is DROPPED, not jumped into — the words simply hand over. */
export const verbRollFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, delay: 0.06, ease: [0.2, 0, 0, 1] } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: [0.4, 0, 1, 1] } },
} as const
/** The host's glide to where the new verb leaves it — the incoming verb's own curve. */
export const HOST_GLIDE = { duration: 0.28, ease: [0.2, 0, 0, 1] } as const

/*
 * THE CLOUD WINDOW'S MENU — the Database card folds and the selection plate flies
 * (modules/cloud/CloudSurface.tsx `CloudMenu`; designer, 23.09.2026, from a recording of the
 * live editor: «когда ты уходишь в другой раздел например Email меню с Database схлопывает
 * как на видео… тебе нужно сделать это более плавно и красиво в нашем стиле Apple liquid
 * glass», and on the menu's buttons: «эффект ховера и клика красивый наш, и позаботится об
 * анимации переключения и переходах»).
 *
 * What the recording shows (scratchpad/cloud-menu, 30 fps): the live card opens and closes
 * in ~5 frames, linear, and the rooms under it jump with it; the selected plate carries a
 * Material ripple artefact. What replaces it here:
 *  · ONE SPRING FOR THE WHOLE MENU. The fold's edge (the clip's height), the 5px under the
 *    card, the card's glass and the selection plate's box (top, left, size, radius) all ride
 *    `MENU_SPRING`, started on the same tick — a linear system on identical parameters follows
 *    one normalised curve, so the plate flying DOWN to a room row meets that row, gliding UP
 *    as the card folds under it, exactly at the end, and overshoots it by the same soft
 *    fraction the row overshoots its seat. Softer than the house `SPRING` (ω 17.9 rad/s, ζ .75:
 *    ~3 % past the target, at rest in ~330 ms — a 160px fold with a 4px dip and return), because
 *    the thing moving is a card of rows, not a pill on a track.
 *  · THE GLASS FOLLOWS THE EDGE (the Reveal's law): the folding content leaves fast and flat
 *    (`menuGlass.out`, 140 ms) while the edge closes on the spring; unfolding, it comes up a
 *    beat behind the edge from slightly small and slightly high, and the card's rim catches the
 *    module's violet light (`.glass-glint`). The card's own fill is a function of the same
 *    progress — 8 % white when open, nothing when folded, so the folded Database row is a plain
 *    room row and not a group with a plate around it.
 *  · Under reduced motion the fold and the plate change in one commit and the glass only fades.
 */
export const MENU_SPRING = { type: 'spring', stiffness: 320, damping: 27, mass: 1 } as const
export const menuGlass = {
  in: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', duration: 0.46, bounce: 0.2, delay: 0.05, opacity: { duration: 0.24, delay: 0.08, ease: [0.2, 0, 0, 1] } },
  },
  out: { opacity: 0, scale: 0.98, y: -4, transition: EXIT },
} as const
export const menuGlassFade = {
  in: { opacity: 1, transition: { duration: 0.24, delay: 0.06, ease: [0.2, 0, 0, 1] } },
  out: { opacity: 0, transition: EXIT },
} as const

/*
 * THE COMPOSER'S ATTACH MENU AND ITS CHIPS (modules/home/AttachMenu.tsx; HomePage.tsx
 * `AttachedChip`; designer 23.09.2026: «нужно добавить красивые и плавные анимации стильные в
 * нашем стиле для открытия и закрытия дропдауна, для появления и удаления домена внутри поля
 * ввода: нужно добавить ховер эффекты и клик эффекты!… в нашем стиле Apple liquid glass»).
 *
 *  · THE MENU GROWS OUT OF THE "+" IT COVERS. Board 30871:57297 sets the menu's box exactly on
 *    the button's (both at (16, 112) in the field), so the point it comes from is the button's
 *    centre — `transform-origin 18px 18px` — not a corner: .86 → 1 on a soft spring with one
 *    visible overshoot, opacity on its own short curve so the glass is solid before it has
 *    finished growing, the rows a beat behind (`popoverContent`), the rim catching light
 *    (`.glass-glint`, the arriving-block signature). Leaving is the house exit: 140 ms, flat,
 *    back toward the same point. Between its two levels the BOX resizes on `ATTACH_MENU_RESIZE`
 *    and the lists hand over sequentially (`stepSwap`, forward) — never two lists at once.
 *  · A CHIP ARRIVES AS GLASS — the thread cards' law (Card Arrival) at the size of a word: a beat
 *    (60 ms) after the pick, once the menu has begun to recede and the bar has opened, the pill
 *    inflates from its LEFT end (.86 → 1, one soft overshoot, 6 px of travel from where the menu
 *    stood), its word focuses in a beat later (1.06 → 1), the ✕ pops in last, and the rim
 *    glints white for 1.1 s. It LEAVES by collapsing into its ✕ (WAAPI in the chip, the tile's
 *    rule: the layout changes only once that has played, so the field's close-up follows the chip
 *    rather than pulling the ground from under it).
 *  Under reduced motion the displacements and scales are DROPPED (the `…Fade` twins), never jumped.
 */
export const ATTACH_MENU_SPRING = { type: 'spring', duration: 0.46, bounce: 0.24 } as const
export const ATTACH_MENU_RESIZE = { type: 'spring', duration: 0.42, bounce: 0.18 } as const
export const attachMenuIn = {
  initial: { opacity: 0, scale: 0.86 },
  animate: { opacity: 1, scale: 1, transition: { ...ATTACH_MENU_SPRING, opacity: { duration: 0.16, ease: [0.2, 0, 0, 1] } } },
  exit: { opacity: 0, scale: 0.94, transition: EXIT },
} as const
export const attachMenuInFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.16, ease: [0.2, 0, 0, 1] } },
  exit: { opacity: 0, transition: EXIT },
} as const
export const chipIn = {
  initial: { opacity: 0, scale: 0.86, x: -6 },
  animate: {
    opacity: 1,
    scale: 1,
    x: 0,
    /* A beat (60 ms) after the pick: the menu has begun to recede and the bar has opened before
       the object lands in it — the Card Arrival order (dock first, card 80 ms later). Filmed
       without the beat: chip and menu started on the same frame, two things at once. */
    transition: { type: 'spring', duration: 0.5, bounce: 0.26, delay: 0.06, opacity: { duration: 0.18, delay: 0.06, ease: [0.2, 0, 0, 1] } },
  },
} as const
export const chipInBody = {
  initial: { opacity: 0, scale: 1.06 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', duration: 0.44, bounce: 0.16, delay: 0.12, opacity: { duration: 0.2, delay: 0.14, ease: [0.2, 0, 0, 1] } },
  },
} as const
export const chipInBadge = {
  initial: { opacity: 0, scale: 0.5 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', duration: 0.4, bounce: 0.3, delay: 0.2, opacity: { duration: 0.12, delay: 0.2 } },
  },
} as const
export const chipInFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: [0.2, 0, 0, 1] } },
} as const
