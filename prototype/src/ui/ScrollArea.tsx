/**
 * A scroll surface with a phone-style overlay indicator.
 *
 * Native scrollbars are switched off app-wide (see index.css): a classic
 * scrollbar reserves its own column and paints it with the scroller's
 * background, which on the two-tone demo site drew a white strip down the whole
 * right edge — something a phone never does. Here the bar floats OVER the
 * content, fades in while the surface moves and fades out ~700ms after it stops.
 *
 * Cost per frame is one composited `transform`. The thumb's cross-axis size is
 * written only when the scrollable extent actually changes, never while scrolling.
 *
 * ⚠️ Class names are full literals (see THUMB_CLASS): the rules live inside a
 * Tailwind `@layer`, and Tailwind tree-shakes layer rules whose class name it
 * cannot find verbatim in the source. This bit us once with the glow layers.
 */
import { useCallback, useEffect, useRef } from 'react'

/** Which way the thumb is painted — a surface knows its own backdrop. */
type Thumb =
  /** light bar, for the dark builder chrome */
  | 'light'
  /** dark bar, for light panels */
  | 'dark'
  /** unknown or mixed content (a generated site): the iOS trick — a dark bar
   *  wearing a light hairline, legible over white and black alike */
  | 'auto'

/** Which way the surface moves. `x` is the Home page's card row. */
type Axis = 'y' | 'x'

const THUMB_CLASS: Record<Thumb, string> = {
  light: 'scroll-thumb scroll-thumb--light',
  dark: 'scroll-thumb scroll-thumb--dark',
  auto: 'scroll-thumb scroll-thumb--auto',
}

const AXIS_CLASS: Record<Axis, string> = {
  y: 'scroll-thumb--y',
  x: 'scroll-thumb--x',
}

const SCROLLER_CLASS: Record<Axis, string> = {
  y: 'h-full overflow-y-auto',
  x: 'h-full overflow-x-auto overflow-y-hidden',
}

/** Track inset at both ends, and the shortest the thumb may get. */
const PAD = 4
const MIN = 28

/**
 * What the indicator already had to read to place itself — handed out for
 * callers whose CHROME reacts to the scroll (the template picker's header
 * compacts once the grid has moved a little).
 *
 * Reusing this read is the point: `sync` runs on every scroll event and on
 * every resize, and it takes these three numbers off the scroller anyway, so a
 * caller that subscribes here adds NO layout read of its own — and above all
 * does not go and put a second listener on the window.
 */
export interface ScrollMetrics {
  /** scrollTop, or scrollLeft on the x axis. */
  pos: number
  /** scrollHeight / scrollWidth. */
  extent: number
  /** clientHeight / clientWidth. */
  visible: number
}

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  /** Classes for the outer box — sizing and flex behaviour live here. */
  className?: string
  /** Classes for the scroller itself — background, padding, typography. */
  innerClassName?: string
  thumb?: Thumb
  axis?: Axis
  /** Called with the scroll geometry on every scroll and every resize — see
   *  `ScrollMetrics`. Kept in a ref, so passing an inline function costs
   *  nothing and never re-arms the observer. */
  onMetrics?: (m: ScrollMetrics) => void
  /** Hands the scrollport out, for callers that need to drive the scroll
   *  themselves (the chat parks a new message at the top of the view; the Home
   *  page's chip row and card row are stepped by a button). */
  viewportRef?: React.MutableRefObject<HTMLDivElement | null>
  children: React.ReactNode
}

export function ScrollArea({
  className = '', innerClassName = '', thumb = 'light', axis = 'y',
  viewportRef, onMetrics, children, onScroll, ...rest
}: Props) {
  const scroller = useRef<HTMLDivElement | null>(null)
  const bar = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<number | undefined>(undefined)
  const lastSize = useRef(-1)
  /* A ref, not a dep: `sync` must stay stable or the ResizeObserver below
     re-arms on every render of the caller. */
  const report = useRef(onMetrics)
  report.current = onMetrics

  const sync = useCallback((reveal: boolean) => {
    const el = scroller.current
    const el2 = bar.current
    if (!el || !el2) return

    // One code path, two axes: read the pair of numbers this axis scrolls by and
    // everything below is identical.
    const horizontal = axis === 'x'
    const pos = horizontal ? el.scrollLeft : el.scrollTop
    const extent = horizontal ? el.scrollWidth : el.scrollHeight
    const visible = horizontal ? el.clientWidth : el.clientHeight
    const overflow = extent - visible
    /* Before the early return: a caller watching the scroll needs to hear about
       the frame where the content STOPPED overflowing too (filter the grid down
       to one card and the compact header has to stand back up). */
    report.current?.({ pos, extent, visible })
    if (overflow < 2) {
      el2.setAttribute('data-off', '')
      return
    }
    el2.removeAttribute('data-off')

    const track = visible - PAD * 2
    const size = Math.max(MIN, Math.round((visible / extent) * track))
    if (size !== lastSize.current) {
      el2.style[horizontal ? 'width' : 'height'] = `${size}px`
      lastSize.current = size
    }
    const offset = PAD + (track - size) * (pos / overflow)
    el2.style.transform = horizontal
      ? `translate3d(${offset}px, 0, 0)`
      : `translate3d(0, ${offset}px, 0)`

    if (reveal) {
      el2.setAttribute('data-on', '')
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
      hideTimer.current = window.setTimeout(() => el2.removeAttribute('data-on'), 700)
    }
  }, [axis])

  // Re-measure when the viewport or the content changes size — but stay silent:
  // a resize is not a scroll, so the bar must not flash.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    sync(false)
    const ro = new ResizeObserver(() => sync(false))
    ro.observe(el)
    for (const child of Array.from(el.children)) ro.observe(child)
    return () => {
      ro.disconnect()
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
    }
  }, [sync])

  return (
    <div className={`scroll-area ${className}`}>
      <div
        ref={(el) => {
          scroller.current = el
          if (viewportRef) viewportRef.current = el
        }}
        onScroll={(e) => {
          sync(true)
          onScroll?.(e)
        }}
        className={`${SCROLLER_CLASS[axis]} ${innerClassName}`}
        {...rest}
      >
        {children}
      </div>
      <b ref={bar} className={`${THUMB_CLASS[thumb]} ${AXIS_CLASS[axis]}`} data-off aria-hidden />
    </div>
  )
}
