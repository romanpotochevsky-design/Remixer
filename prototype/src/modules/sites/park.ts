/**
 * THE SITE PARKED IN ITS CARD — the motion under the sites shelf (SitesShelf.tsx).
 *
 * The iPhone's gesture, which the designer asked for by name (25.09.2026: «анимация типа такой как на
 * айфоне когда ты нажимаешь на иконку приложения из нее сайт вылетает на весь экран… чтобы сайт очень
 * красиво, плавно и круто в стиле apple liquid glass вот так улетал в список»): the app on screen
 * shrinks INTO its icon on the home screen; tapping an icon grows it OUT to the screen. Here the app
 * is the site on the canvas and the icon is its card on the shelf.
 *
 * ONE OBJECT, NO CLONE ON THE WAY IN. The live product crossfades its canvas into a stock screenshot
 * of the site, and the seam shows on every switch (the recording, frame by frame — CLAUDE.md). Both
 * ends of our flight are inside the canvas box, so nothing has to escape a clip: the REAL site layer
 * is transformed from where it stands (the canvas) to where its card is, and simply stays there,
 * parked, for as long as the shelf is up — it IS the card's picture. Its scroll position, its page,
 * its glow come along, and there is no second copy to disagree with it. Coming back is the same
 * transform run backwards.
 *
 * THE MATH is the template flight's (modules/home/TemplateFlight.tsx), with the element mounted at
 * the SOURCE instead of the destination: the clip's scale goes 1 → card/canvas per axis, GEOMETRICALLY
 * (`s(v) = s1^v`, so the spring's overshoot is a few percent of size at the small end rather than a
 * fifth of it), and the translation is derived from the morph's fixed point (`e = q·(1 − s)`,
 * `q = d/(1 − s1)`), which keeps it rigid under any easing. The card's box is cut to the canvas's
 * aspect (SitesShelf.tsx), so the two axes scale alike and the site is never cropped or letterboxed
 * — the card is the canvas, smaller. The corner radius is animated per frame from the stage's 16 to
 * the card's 12, divided by the scale so it reads as the wanted pixels at every size — the one
 * sanctioned per-frame paint the template flight already ships.
 *
 * All of it is transform and radius on ONE element, driven by ONE motion value `parkP` (0 = on the
 * canvas, 1 = in the card). The shelf's own approach/recession (`shelfO`, `shelfS`) rides the same
 * springs: the home screen zooming back into place as the app closes into it.
 */
import { animate, motionValue, useTransform, type MotionValue } from 'motion/react'
import { useUI, type FlightRect } from '@/state/ui'
import { FLIGHT_OPEN, FLIGHT_SEAT } from '@/ui/motion'

/** 0 — the site stands on the canvas · 1 — it sits in its card on the shelf. */
export const parkP = motionValue(0)
/** Reduced motion: no flight — the site layer simply fades behind the shelf. */
export const parkO = motionValue(1)
/** The shelf approaching (opacity, scale from slightly larger) and receding. */
export const shelfO = motionValue(0)
export const shelfS = motionValue(1)

/** The stage's own radius (`rounded-shell`) and the card's. */
export const SITE_RADIUS = 16
export const CARD_RADIUS = 12
/** How much larger the shelf stands before it settles — the home screen behind a closing app. */
export const SHELF_FROM = 1.05
export const SHELF_TO = 1.04
export const SHELF_SOLID = { duration: 0.28, ease: [0.2, 0, 0, 1] } as const
export const SHELF_DISSOLVE = { duration: 0.32, ease: [0.4, 0, 1, 1] } as const

const geom: { from: FlightRect | null; to: FlightRect | null } = { from: null, to: null }

/** The two boxes of the flight — the canvas the site stands on, the card it lands in. */
export function setParkGeometry(from: FlightRect, to: FlightRect) {
  geom.from = from
  geom.to = to
  /* a transform derived from `parkP` recomputes only when the value moves — nudge it by nothing.
     `jump(v, false)`: no velocity left behind for a spring to pick up, and — the second argument — the
     flight that may be running on this value is NOT stopped (a plain `jump` ends it; traced: the site
     froze at .88 of its way into the card when the slot's ResizeObserver first reported) */
  const v = parkP.get()
  parkP.jump(v + (v >= 1 ? -1e-6 : 1e-6), false)
  parkP.jump(v, false)
}

type Terms = { sx1: number; sy1: number; dx: number; dy: number; flatX: boolean; flatY: boolean; qx: number; qy: number }
function terms(): Terms | null {
  const f = geom.from, t = geom.to
  if (!f || !t || !f.width || !f.height) return null
  const sx1 = t.width / f.width, sy1 = t.height / f.height
  const dx = t.left - f.left, dy = t.top - f.top
  const flatX = Math.abs(sx1 - 1) < 1e-3, flatY = Math.abs(sy1 - 1) < 1e-3
  return { sx1, sy1, dx, dy, flatX, flatY, qx: flatX ? 0 : dx / (1 - sx1), qy: flatY ? 0 : dy / (1 - sy1) }
}
const sxAt = (T: Terms, v: number) => (T.flatX ? 1 : Math.pow(T.sx1, v))
const syAt = (T: Terms, v: number) => (T.flatY ? 1 : Math.pow(T.sy1, v))

export type ParkStyle = { x: MotionValue<number>; y: MotionValue<number>; scaleX: MotionValue<number>; scaleY: MotionValue<number>; borderRadius: MotionValue<string>; opacity: MotionValue<number> }

/** The site layer's parking wrapper reads these (App.tsx, `data-site-park`). */
export function useSitePark(): ParkStyle {
  const x = useTransform(parkP, (v) => { const T = terms(); if (!T || v === 0) return 0; return T.flatX ? T.dx * v : T.qx * (1 - sxAt(T, v)) })
  const y = useTransform(parkP, (v) => { const T = terms(); if (!T || v === 0) return 0; return T.flatY ? T.dy * v : T.qy * (1 - syAt(T, v)) })
  const scaleX = useTransform(parkP, (v) => { const T = terms(); return T ? sxAt(T, v) : 1 })
  const scaleY = useTransform(parkP, (v) => { const T = terms(); return T ? syAt(T, v) : 1 })
  const borderRadius = useTransform(parkP, (v) => {
    const T = terms()
    /* at rest the wrapper does not clip (App.tsx) — the stage's own `rounded-shell` does */
    if (!T || v === 0) return '0px'
    const k = Math.min(1, Math.max(0, v))
    const r = SITE_RADIUS + (CARD_RADIUS - SITE_RADIUS) * k
    return `${r / sxAt(T, v)}px / ${r / syAt(T, v)}px`
  })
  return { x, y, scaleX, scaleY, borderRadius, opacity: parkO }
}

/** Whether the parked site is in the air or in its card (for the shelf's hooks and the suite). */
export const parked = () => parkP.get() > 0.001

/** The shelf has measured: the site closes into its card, the shelf comes into place behind it. */
export function flyIn(reduce: boolean) {
  /*
   * ⚠️ `jump`, NOT `set`, FOR EVERY STARTING VALUE. `set` records a velocity from the value it
   * replaces, and `animate` hands that velocity to the spring: the shelf, put at 1.05 by `set` a
   * frame after standing at 1, launched UPWARD to 1.085 before settling (traced on the first cut
   * of this flight — and a ResizeObserver that re-measured the card's slot during that overshoot
   * parked the site 44 px off its card). `jump` resets the velocity to zero.
   */
  if (reduce) {
    shelfS.jump(1)
    animate(shelfO, 1, SHELF_SOLID)
    animate(parkO, 0, { duration: 0.16, ease: [0.4, 0, 1, 1] })
    return
  }
  parkO.jump(1)
  parkP.jump(0)
  shelfO.jump(0)
  shelfS.jump(SHELF_FROM)
  animate(shelfO, 1, SHELF_SOLID)
  animate(shelfS, 1, FLIGHT_SEAT)
  animate(parkP, 1, FLIGHT_SEAT)
}

let closing = false
/** Back to the same site: the site grows out of its card, the shelf recedes; the surface closes on landing. */
export function closeShelf(reduce: boolean) {
  if (closing) return
  const ui = useUI.getState()
  if (ui.surface !== 'sites') return
  closing = true
  const done = () => {
    closing = false
    if (useUI.getState().surface === 'sites') useUI.getState().closeSurface()
  }
  if (reduce) {
    animate(shelfO, 0, { duration: 0.16, ease: [0.4, 0, 1, 1] })
    animate(parkO, 1, { duration: 0.2, ease: [0.2, 0, 0, 1] }).then(done)
    return
  }
  animate(shelfO, 0, SHELF_DISSOLVE)
  animate(shelfS, SHELF_TO, FLIGHT_OPEN)
  animate(parkP, 0, FLIGHT_OPEN).then(done)
}

/** A pick landed: the site layer is that site now, at full size, at once — no flight back. */
export function unparkNow() {
  closing = false
  parkP.jump(0)
  parkO.jump(1)
}
