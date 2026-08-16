/**
 * A scroll surface with a phone-style overlay indicator.
 *
 * Native scrollbars are switched off app-wide (see index.css): a classic
 * scrollbar reserves its own column and paints it with the scroller's
 * background, which on the two-tone demo site drew a white strip down the whole
 * right edge — something a phone never does. Here the bar floats OVER the
 * content, fades in while the surface moves and fades out ~700ms after it stops.
 *
 * Cost per frame is one composited `transform`. The thumb's height is written
 * only when the scrollable extent actually changes, never while scrolling.
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

const THUMB_CLASS: Record<Thumb, string> = {
  light: 'scroll-thumb scroll-thumb--light',
  dark: 'scroll-thumb scroll-thumb--dark',
  auto: 'scroll-thumb scroll-thumb--auto',
}

/** Track inset at top and bottom, and the shortest the thumb may get. */
const PAD = 4
const MIN = 28

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  /** Classes for the outer box — sizing and flex behaviour live here. */
  className?: string
  /** Classes for the scroller itself — background, padding, typography. */
  innerClassName?: string
  thumb?: Thumb
  /** Hands the scrollport out, for callers that need to drive the scroll
   *  themselves (the chat parks a new message at the top of the view). */
  viewportRef?: React.MutableRefObject<HTMLDivElement | null>
  children: React.ReactNode
}

export function ScrollArea({ className = '', innerClassName = '', thumb = 'light', viewportRef, children, onScroll, ...rest }: Props) {
  const scroller = useRef<HTMLDivElement | null>(null)
  const bar = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<number | undefined>(undefined)
  const lastHeight = useRef(-1)

  const sync = useCallback((reveal: boolean) => {
    const el = scroller.current
    const el2 = bar.current
    if (!el || !el2) return

    const { scrollTop, scrollHeight, clientHeight } = el
    const overflow = scrollHeight - clientHeight
    if (overflow < 2) {
      el2.setAttribute('data-off', '')
      return
    }
    el2.removeAttribute('data-off')

    const track = clientHeight - PAD * 2
    const height = Math.max(MIN, Math.round((clientHeight / scrollHeight) * track))
    if (height !== lastHeight.current) {
      el2.style.height = `${height}px`
      lastHeight.current = height
    }
    el2.style.transform = `translate3d(0, ${PAD + (track - height) * (scrollTop / overflow)}px, 0)`

    if (reveal) {
      el2.setAttribute('data-on', '')
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
      hideTimer.current = window.setTimeout(() => el2.removeAttribute('data-on'), 700)
    }
  }, [])

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
        className={`h-full overflow-y-auto ${innerClassName}`}
        {...rest}
      >
        {children}
      </div>
      <b ref={bar} className={THUMB_CLASS[thumb]} data-off aria-hidden />
    </div>
  )
}
