/**
 * THE TOOLTIP — a Liquid Glass bubble with a tail, the way macOS labels a Dock icon and
 * Figma a toolbar button (designer, 16.09.2026, with four reference frames, on the status
 * chip in the Publish panel: «непонятно что значат эти статусы… что такое "Ready"? нужно
 * сделать тултип стильный при ховере на статус… как в macOS при наведении на программы, или
 * как в Figma… с лёгким эффектом стекла… прикольная анимация появления и пропадания в стиле
 * Apple liquid glass… короткий и лаконичный понятный текст с описанием статусов»).
 *
 * WHAT IT IS
 *  · ONE SHAPE. Body and tail are a single rounded path (`bubblePath`), used twice: as the
 *    glass's `clip-path`, so the blur and the fill end exactly at the tail's edge (a separate
 *    triangle would meet the body with a seam and a rim that ran straight across its base),
 *    and as the RIM — an SVG stroke of the same path in the house diagonal (20 → 9 → 7 → 16 %
 *    white, the `.liquid-glass::before` amplitude). A CSS mask ring cannot turn a tail's
 *    corner; a stroked path can.
 *  · GLASS WITH SOMETHING TO BLUR. The bubble floats over whatever stands behind the chip —
 *    the panel's field and label, the chrome — so `backdrop-filter: blur(16px)` earns its
 *    layer here (the rule: look at what is behind you before you blur). Fill is the canon's
 *    glass ground, `rgba(24,24,27,.82)`; no inner top light, no shadow, no saturate.
 *  · IT GROWS OUT OF ITS TAIL. `transform-origin` is the tail's tip, 6px off the target
 *    (motion.ts `tooltipIn`: one soft overshoot in, a straight 120 ms out). As the glass forms
 *    its rim catches the light — a second, white stroke that peaks and is gone in .9 s
 *    (`.tip-rim-glint`), the glint every forming surface wears (`.card-arrive`).
 *  · IT LIVES IN <body>. Portaled and `position: fixed`: the chip sits inside a Reveal clip
 *    (`overflow: hidden`) inside a fixed panel — in place, the bubble would be cut at the
 *    row's edge. `pointer-events: none`, so it never steals the hover that raised it.
 *  · IT WAITS. 350 ms of hover before it shows — Figma's beat; a pointer crossing the row on
 *    its way elsewhere raises nothing. Leaving hides it at once; so does a click, a scroll,
 *    a resize or Escape.
 *  · IT FLIPS, AND IT STAYS ON ITS SURFACE. Above by default, tail down; with no room above
 *    (a topbar target), below, tail up. Sideways it is clamped inside the nearest dialog
 *    (`[role="dialog"]`, or an explicit `[data-tip-boundary]`) with an 8px margin, then
 *    inside the viewport: a bubble about a panel's chip belongs to the panel, and centred
 *    on a chip at the panel's left edge it hung half over the site preview. The TAIL stays
 *    on the target when the body has been pushed sideways (`tailX`) — the Figma form, arrow
 *    off-centre, is what falls out of the clamp.
 *  · IT IS MEASURED BEFORE IT IS SEEN. The bubble renders hidden at its natural width, a
 *    layout effect reads that width and the target's box, and the geometry — explicit integer
 *    width and height, so the path and the box agree to the pixel — lands before the first
 *    paint. The geometry is kept through the exit so the bubble leaves from where it stood.
 *
 * The trigger is wrapped in an inline-flex span that takes the hover and, unless the child
 * is itself a control (`interactive`), a tab stop, so the description is reachable without a
 * mouse: `role="tooltip"` + `aria-describedby`.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useT, type Text } from '@/i18n'
import { tooltipIn, tooltipInFade, tooltipText } from '@/ui/motion'

export type TipSide = 'top' | 'bottom'

/** Tail tip → the target's edge. */
export const TIP_GAP = 6
/** The tail: 14 wide at its base, 7 tall — the Dock's proportions, read against a 24px chip. */
export const TIP_TAIL_W = 14
export const TIP_TAIL_H = 7
/** Corner radius of the body. */
export const TIP_RADIUS = 10
/** Hover dwell before the bubble shows. */
export const TIP_SHOW_MS = 350
/** Keep the bubble this far inside the viewport. */
const MARGIN = 8

/**
 * The bubble as ONE path. `w` × `h` is the BODY; the element is `h + TIP_TAIL_H` tall and
 * the tail hangs off the body — side `top` (bubble above its target) puts the tail below,
 * pointing down; `bottom` puts it above, pointing up. The apex is softened by two short
 * quadratic curves: a sharp point reads as a comic's speech bubble, the Dock's is rounded.
 * `inset` shrinks the path inward so a 1px rim stroke sits wholly inside the clip.
 */
export function bubblePath(w: number, h: number, tailX: number, side: TipSide, inset = 0): string {
  const i = inset
  const r = Math.max(TIP_RADIUS - i, 0)
  const hw = TIP_TAIL_W / 2 - i
  const R = w - i
  const tx = tailX
  const f = (n: number) => String(+n.toFixed(2))
  if (side === 'top') {
    const B = h - i
    const tip = h + TIP_TAIL_H - i * 1.4
    return [
      `M${f(i + r)} ${f(i)}`,
      `H${f(R - r)} A${f(r)} ${f(r)} 0 0 1 ${f(R)} ${f(i + r)}`,
      `V${f(B - r)} A${f(r)} ${f(r)} 0 0 1 ${f(R - r)} ${f(B)}`,
      `H${f(tx + hw)} Q${f(tx + 1.6)} ${f(tip - 1.2)} ${f(tx)} ${f(tip)} Q${f(tx - 1.6)} ${f(tip - 1.2)} ${f(tx - hw)} ${f(B)}`,
      `H${f(i + r)} A${f(r)} ${f(r)} 0 0 1 ${f(i)} ${f(B - r)}`,
      `V${f(i + r)} A${f(r)} ${f(r)} 0 0 1 ${f(i + r)} ${f(i)} Z`,
    ].join(' ')
  }
  const T = TIP_TAIL_H + i
  const B = h + TIP_TAIL_H - i
  const tip = i * 1.4
  return [
    `M${f(i + r)} ${f(T)}`,
    `H${f(tx - hw)} Q${f(tx - 1.6)} ${f(tip + 1.2)} ${f(tx)} ${f(tip)} Q${f(tx + 1.6)} ${f(tip + 1.2)} ${f(tx + hw)} ${f(T)}`,
    `H${f(R - r)} A${f(r)} ${f(r)} 0 0 1 ${f(R)} ${f(T + r)}`,
    `V${f(B - r)} A${f(r)} ${f(r)} 0 0 1 ${f(R - r)} ${f(B)}`,
    `H${f(i + r)} A${f(r)} ${f(r)} 0 0 1 ${f(i)} ${f(B - r)}`,
    `V${f(T + r)} A${f(r)} ${f(r)} 0 0 1 ${f(i + r)} ${f(T)} Z`,
  ].join(' ')
}

interface Geo { left: number; top: number; w: number; h: number; tailX: number; side: TipSide }

export function Tooltip({ text, title, children, side: prefer = 'top', interactive = false, className }: {
  text: Text | string
  /** An optional lead, set bold on its own line — for a target that shows no word of its own. */
  title?: Text | string
  children: ReactNode
  side?: TipSide
  /** The child is itself focusable (a button): the wrapper takes no tab stop of its own. */
  interactive?: boolean
  className?: string
}) {
  const { t } = useT()
  const reduce = useReducedMotion()
  const uid = useId().replace(/:/g, '')
  const anchor = useRef<HTMLSpanElement>(null)
  const bubble = useRef<HTMLDivElement>(null)
  const timer = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [geo, setGeo] = useState<Geo | null>(null)

  const cancel = () => {
    if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null }
  }
  const show = useCallback((delay: number) => {
    cancel()
    timer.current = window.setTimeout(() => {
      timer.current = null
      /* geo is cleared WITH the open, in one commit: the bubble must first render at its
         natural width (hidden) so the layout effect can measure it — a stale width from the
         previous word would clamp the new one. */
      setGeo(null)
      setOpen(true)
    }, delay)
  }, [])
  const hide = useCallback(() => { cancel(); setOpen(false) }, [])
  useEffect(() => cancel, [])

  /* Anything that moves the page, or means "I acted", takes the bubble down at once. */
  useEffect(() => {
    if (!open) return
    const off = () => hide()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') hide() }
    window.addEventListener('scroll', off, true)
    window.addEventListener('resize', off)
    window.addEventListener('pointerdown', off, true)
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('scroll', off, true)
      window.removeEventListener('resize', off)
      window.removeEventListener('pointerdown', off, true)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open, hide])

  /* Measure and place — before the first paint of the open bubble. */
  useLayoutEffect(() => {
    if (!open || geo) return
    const a = anchor.current, b = bubble.current
    if (!a || !b) return
    const ar = a.getBoundingClientRect()
    const cs = getComputedStyle(b)
    /* computed width/height, not the bounding box: the glass is already at its initial
       scale(.84) on this frame, and offsetWidth would round away the fraction the path
       needs to meet the box at */
    const w = Math.ceil(parseFloat(cs.width))
    const total = Math.ceil(parseFloat(cs.height))
    const h = total - TIP_TAIL_H
    const vw = window.innerWidth, vh = window.innerHeight
    const cx = ar.left + ar.width / 2
    let side: TipSide = prefer
    let top = side === 'top' ? ar.top - TIP_GAP - total : ar.bottom + TIP_GAP
    if (side === 'top' && top < MARGIN) { side = 'bottom'; top = ar.bottom + TIP_GAP }
    else if (side === 'bottom' && top + total > vh - MARGIN) { side = 'top'; top = ar.top - TIP_GAP - total }
    /* the surface the bubble may not leave sideways: the nearest dialog, else the window */
    const bound = a.closest<HTMLElement>('[data-tip-boundary], [role="dialog"]')?.getBoundingClientRect()
    const minL = Math.max(MARGIN, bound ? bound.left + MARGIN : MARGIN)
    const maxL = Math.min(vw - w - MARGIN, bound ? bound.right - w - MARGIN : vw - w - MARGIN)
    const left = Math.round(Math.min(Math.max(cx - w / 2, minL), Math.max(maxL, minL)))
    const minTail = TIP_RADIUS + TIP_TAIL_W / 2 + 2
    const tailX = +Math.min(Math.max(cx - left, minTail), Math.max(w - minTail, minTail)).toFixed(1)
    setGeo({ left, top: Math.round(top), w, h, tailX, side })
  }, [open, geo, prefer])

  const sideNow = geo?.side ?? prefer
  const path = geo ? bubblePath(geo.w, geo.h, geo.tailX, geo.side) : undefined
  const rim = geo ? bubblePath(geo.w, geo.h, geo.tailX, geo.side, 0.5) : undefined

  return (
    <>
      <span
        ref={anchor}
        className={`tip-anchor inline-flex${className ? ` ${className}` : ''}`}
        tabIndex={interactive ? undefined : 0}
        aria-describedby={open ? uid : undefined}
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') show(TIP_SHOW_MS) }}
        onPointerLeave={hide}
        onFocus={() => show(120)}
        onBlur={hide}
      >
        {children}
      </span>
      {createPortal(
        <AnimatePresence>
          {open && (
            <div
              key="tip"
              className="tip-host"
              style={{ left: geo?.left ?? 0, top: geo?.top ?? 0, visibility: geo ? 'visible' : 'hidden' }}
            >
              <motion.div
                ref={bubble}
                id={uid}
                role="tooltip"
                className="tip-glass"
                data-side={sideNow}
                style={{
                  width: geo ? geo.w : undefined,
                  height: geo ? geo.h + TIP_TAIL_H : undefined,
                  clipPath: path ? `path('${path}')` : undefined,
                  transformOrigin: geo ? `${geo.tailX}px ${geo.side === 'top' ? '100%' : '0%'}` : '50% 100%',
                  paddingTop: sideNow === 'bottom' ? TIP_TAIL_H + 7 : 7,
                  paddingBottom: sideNow === 'top' ? TIP_TAIL_H + 7 : 7,
                }}
                variants={reduce ? tooltipInFade : tooltipIn}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <motion.span className="tip-text" variants={tooltipText}>
                  {title && <b className="tip-title">{t(title)}</b>}
                  {t(text)}
                </motion.span>
                {geo && (
                  <svg
                    className="tip-rim"
                    width={geo.w}
                    height={geo.h + TIP_TAIL_H}
                    viewBox={`0 0 ${geo.w} ${geo.h + TIP_TAIL_H}`}
                    aria-hidden
                  >
                    <defs>
                      {/* the house diagonal, top-left to bottom-right: 20 → 9 → 7 → 16 % white */}
                      <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#fff" stopOpacity="0.2" />
                        <stop offset="0.34" stopColor="#fff" stopOpacity="0.09" />
                        <stop offset="0.64" stopColor="#fff" stopOpacity="0.07" />
                        <stop offset="1" stopColor="#fff" stopOpacity="0.16" />
                      </linearGradient>
                    </defs>
                    <path className="tip-rim-line" d={rim} stroke={`url(#${uid}-rim)`} />
                    {!reduce && <path className="tip-rim-glint" d={rim} />}
                  </svg>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
