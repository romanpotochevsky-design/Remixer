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
 * aspect — REPLACED 29.09.2026 by the board: one scale, the site's lower part cropped (see `Terms`). The corner radius is animated per frame from the stage's 16 to
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
/**
 * THE CANVAS TOOLBAR STEPS ASIDE WHILE THE SHELF IS UP (designer, 29.09.2026: «верхнюю панель (в которой
 * выбор страниц, кнопка паблиш и.т.д.) при открытии списка сайтов мы должны как-то красиво и плавно с
 * анимацией спрятать»; the board 31164:75936 draws the list from the very top of the canvas column, the
 * toolbar gone). Everything on it acts ON the open site — its pages, its device, its publish — and while
 * the site sits in its card there is nothing for it to act on. It lifts 10 px and dissolves as the site
 * leaves (faster than the flight, so the shelf's title arrives in an empty band), and comes back down on
 * the way home while the site grows out of its card. 0 — away · 1 — standing.
 */
export const toolbarP = motionValue(1)
/**
 * ⚠️ THE TOOLBAR AND THE SHELF'S TITLE ROW SHARE ONE BAND, SO THEY TAKE TURNS — never both on screen
 * (designer, 29.09.2026, two frames of «Projects» printed through «Visual Editor» and «New Project» through
 * «Publish»: «нужно чтобы оно не успевало друг на друга налазить»). The toolbar goes first and completely
 * (180 ms, rising 10 px into nothing); the title row comes into the emptied band a beat after it is gone
 * (from 8 px below, 320 ms, `HEAD_IN`). Closing is the mirror: the title row leaves first (120 ms, sinking
 * 6 px), the toolbar settles back once the band is empty. `headO` / `headY` drive the title row.
 */
export const headO = motionValue(0)
export const headY = motionValue(8)
export const TOOLBAR_AWAY = { duration: 0.18, ease: [0.4, 0, 1, 1] } as const
/* ⚠️ the title row arrives only once the parking site has sunk BELOW its band: the site's top edge crosses the
   band (52 → 100 px) for the first ~350 ms of its 620 ms flight, and a row arriving at 200 ms stood under the
   shrinking site (designer's frame, 29.09.2026: «сайт может налазить на объекты на фоне») */
export const HEAD_IN = { duration: 0.3, ease: [0.2, 0, 0, 1], delay: 0.36 } as const
export const HEAD_OUT = { duration: 0.12, ease: [0.4, 0, 1, 1] } as const
export const TOOLBAR_BACK = { duration: 0.32, ease: [0.2, 0, 0, 1], delay: 0.14 } as const

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
  const T = terms()
  /* the phone frame stands centred in its layer — a taller layer would move it, so mobile keeps the canvas's height */
  const tall = T && T.layerH > T.fromH + 0.5 && useUI.getState().device === 'desktop'
  parkH.jump(tall && T ? `${T.layerH}px` : '100%')
  /* a transform derived from `parkP` recomputes only when the value moves — nudge it by nothing.
     `jump(v, false)`: no velocity left behind for a spring to pick up, and — the second argument — the
     flight that may be running on this value is NOT stopped (a plain `jump` ends it; traced: the site
     froze at .88 of its way into the card when the slot's ResizeObserver first reported) */
  const v = parkP.get()
  parkP.jump(v + (v >= 1 ? -1e-6 : 1e-6), false)
  parkP.jump(v, false)
}

/*
 * ⚠️ SINCE THE BOARD (31164:75936, 29.09.2026) THE CARD IS NOT CUT TO THE CANVAS'S ASPECT. The board's
 * picture box is 376 × 268 while its canvas is 2072 × 1158: the card shows the TOP of the site at the
 * card's width, the rest cropped — the way every picture on the Home dock does. So the flight scales
 * ONE factor (width to width, never stretching the site) and a clip closes the site's lower part as it
 * shrinks: `clip-path: inset(0 0 b 0 round r)` in the layer's own (unscaled) pixels, `b` running from
 * 0 to the canvas's height less the card's height seen at the card's scale. The translation keeps the
 * morph's fixed point on both axes (`e = q·(1 − s)`, `q = d/(1 − s1)`), rigid under any easing.
 */
type Terms = { s1: number; dx: number; dy: number; flat: boolean; qx: number; qy: number; fromH: number; visH1: number; layerH: number }
function terms(): Terms | null {
  const f = geom.from, t = geom.to
  if (!f || !t || !f.width || !f.height) return null
  const s1 = t.width / f.width
  const dx = t.left - f.left, dy = t.top - f.top
  const flat = Math.abs(s1 - 1) < 1e-3
  const visH1 = s1 ? t.height / s1 : f.height
  const mobile = useUI.getState().device !== 'desktop'
  return { s1, dx, dy, flat, qx: flat ? 0 : dx / (1 - s1), qy: flat ? 0 : dy / (1 - s1), fromH: f.height, visH1, layerH: mobile ? f.height : Math.max(f.height, visH1) }
}
const sAt = (T: Terms, v: number) => (T.flat ? 1 : Math.pow(T.s1, v))

/**
 * ⚠️ THE CARD IS TALLER THAN THE CANVAS, SEEN AT THE CARD'S SCALE. At the board's 2560 the canvas is 2064 × 1106
 * and the card's picture 376 × 268: at 376 / 2064 the canvas is only 201 tall, and the parked site left a dark
 * band under itself in its own card (measured, 29.09.2026). The board's picture is the page's TOP, not the
 * viewport — the page goes on below the fold. So while the shelf has it, the layer stands TALLER (`parkH`, set
 * ONCE when the geometry is known — one layout, never one per frame) and the extra is clipped away: at the
 * canvas end the clip shows exactly the canvas, and it opens to the card's full height as the site shrinks.
 */
export const parkH = motionValue<string>('100%')

export type ParkStyle = { x: MotionValue<number>; y: MotionValue<number>; scale: MotionValue<number>; clipPath: MotionValue<string>; height: MotionValue<string>; opacity: MotionValue<number> }

/**
 * The clip that crops the site to its card, in the layer's own (unscaled) pixels — shared by the park and the
 * pick. `layerH` is the layer's height, `visA → visB` what shows of it from one end to the other, `k` the way
 * along; the radius goes from the stage's 16 to the card's 12, divided by the scale so it reads true.
 */
export function cardClip(layerH: number, visA: number, visB: number, s: number, k0: number, rA = SITE_RADIUS, rB = CARD_RADIUS) {
  const k = Math.min(1, Math.max(0, k0))
  const vis = visA + (visB - visA) * k
  const r = rA + (rB - rA) * k
  return `inset(0px 0px ${Math.max(0, layerH - vis)}px 0px round ${r / s}px)`
}

/** The site layer's parking wrapper reads these (App.tsx, `data-site-park`). */
export function useSitePark(): ParkStyle {
  const x = useTransform(parkP, (v) => { const T = terms(); if (!T || v === 0) return 0; return T.flat ? T.dx * v : T.qx * (1 - sAt(T, v)) })
  const y = useTransform(parkP, (v) => { const T = terms(); if (!T || v === 0) return 0; return T.flat ? T.dy * v : T.qy * (1 - sAt(T, v)) })
  const scale = useTransform(parkP, (v) => { const T = terms(); return T ? sAt(T, v) : 1 })
  const clipPath = useTransform(parkP, (v) => {
    const T = terms()
    /* no geometry: the layer is home, and the stage's own `rounded-shell` clips it */
    if (!T) return 'none'
    return cardClip(T.layerH, T.fromH, T.visH1, sAt(T, v), v)
  })
  return { x, y, scale, clipPath, height: parkH, opacity: parkO }
}

/** The layer is home — its geometry forgotten, its height the canvas's again. */
function clearPark() {
  geom.from = null
  geom.to = null
  parkH.jump('100%')
  const v = parkP.get()
  parkP.jump(v + 1e-6, false)
  parkP.jump(v, false)
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
    headO.jump(0); headY.jump(0)
    animate(toolbarP, 0, { duration: 0.16 })
    animate(headO, 1, { duration: 0.24, delay: 0.16 })
    animate(shelfO, 1, SHELF_SOLID)
    animate(parkO, 0, { duration: 0.16, ease: [0.4, 0, 1, 1] })
    return
  }
  parkO.jump(1)
  parkP.jump(0)
  shelfO.jump(0)
  shelfS.jump(SHELF_FROM)
  headO.jump(0)
  headY.jump(8)
  animate(toolbarP, 0, TOOLBAR_AWAY)
  animate(headO, 1, HEAD_IN)
  animate(headY, 0, HEAD_IN)
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
    clearPark()
    if (useUI.getState().surface === 'sites') useUI.getState().closeSurface()
  }
  if (reduce) {
    animate(headO, 0, { duration: 0.12 })
    animate(toolbarP, 1, { duration: 0.2, delay: 0.12 })
    animate(shelfO, 0, { duration: 0.16, ease: [0.4, 0, 1, 1] })
    animate(parkO, 1, { duration: 0.2, ease: [0.2, 0, 0, 1] }).then(done)
    return
  }
  animate(shelfO, 0, SHELF_DISSOLVE)
  animate(headO, 0, HEAD_OUT)
  animate(headY, 6, HEAD_OUT)
  animate(toolbarP, 1, TOOLBAR_BACK)
  animate(shelfS, SHELF_TO, FLIGHT_OPEN)
  animate(parkP, 0, FLIGHT_OPEN).then(done)
}

/**
 * A PICK TOOK OFF: the shelf dissolves and recedes under the growing card — the home screen behind an opening
 * app — the title row leaves its band first, and the old site, parked in its card, fades with the shelf. The
 * clone grows over a ground that is emptying, so nothing behind it ever shows past its edge (the designer's
 * frames: the header buttons and «Projects» peeking out from under the arriving site).
 */
export function pickAway(reduce: boolean) {
  animate(headO, 0, HEAD_OUT)
  animate(headY, 6, HEAD_OUT)
  if (reduce) { animate(shelfO, 0, { duration: 0.16, ease: [0.4, 0, 1, 1] }); return }
  animate(shelfO, 0, SHELF_DISSOLVE)
  animate(shelfS, SHELF_TO, FLIGHT_OPEN)
  animate(parkO, 0, { duration: 0.28, ease: [0.4, 0, 1, 1] })
}

/** A pick landed: the site layer is that site now, at full size, at once — no flight back. */
export function unparkNow() {
  closing = false
  parkP.jump(0)
  parkO.jump(1)
  clearPark()
  /* the picked site is on the canvas: the title row goes with the shelf, its toolbar comes back for it */
  headO.jump(0)
  animate(toolbarP, 1, TOOLBAR_BACK)
}

/** Any other way off the shelf (a window opened over it, the Home page) — the toolbar stands again. */
export function toolbarHome() {
  if (toolbarP.get() < 1 && !toolbarP.isAnimating()) animate(toolbarP, 1, TOOLBAR_BACK)
}
