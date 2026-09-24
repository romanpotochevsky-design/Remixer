/**
 * THE LIVE SITE AS A PICTURE — the generated site itself, laid out at a desktop width and
 * scaled into whatever box holds it (a card on the Home dock, a card on the sites shelf).
 *
 * It exists so that a card can show THE SAME PIXELS the canvas shows. The site switcher's
 * whole animation rests on that: when the canvas flies into its card (SitesShelf.tsx) the
 * card has to be the place the site lands, not a different picture of it — Lovable's editor
 * crossfades its canvas into a stock screenshot, and the seam is visible on every switch
 * (the designer's recording, 25.09.2026: «реализовано плохо и некачественно»). Here the
 * miniature and the canvas are one component at two scales, the way a template card and the
 * picker's stage are one drawing at two scales (design-system §5).
 *
 * MEASURED, NOT COMPUTED. The scale is host width / `MINI_LAYOUT_W`, read off a
 * ResizeObserver: a CSS `calc(100cqw / 1100px)` would do the same, but the site inside is a
 * real page with its own scroller and container queries, and a `container-type` host would
 * hand it a second container to answer to. The layout width is the canvas's own at the drawn
 * shell (1656 − 432 − 56 − 16 ≈ 1152, rounded to a desktop the site's queries treat the same
 * as the canvas), so the miniature shows the desktop layout the canvas shows — never the
 * phone one a narrow box would trigger.
 *
 * It is a PICTURE: pointer-blind, hidden from the tree, pinned to the home page. Nothing in
 * it can be scrolled or clicked, which is also what lets the card's own stretched button take
 * every press.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import { SitePreview } from '@/modules/preview/SitePreview'

export const MINI_LAYOUT_W = 1152

export function SiteMini({ className = '' }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const el = host.current
    if (!el) return
    /* a picture has no tab stops: the site's own buttons and links inside are inert */
    ;(el as HTMLElement & { inert: boolean }).inert = true
    const read = () => { const r = el.getBoundingClientRect(); setBox({ w: r.width, h: r.height }) }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const k = box ? box.w / MINI_LAYOUT_W : 0
  return (
    <div ref={host} className={`site-mini overflow-hidden ${className}`} aria-hidden data-site-mini>
      {box && (
        <div
          className="pointer-events-none absolute left-0 top-0"
          style={{ width: MINI_LAYOUT_W, height: box.h / k, transform: `scale(${k})`, transformOrigin: '0 0' }}
        >
          <SitePreview path="/" />
        </div>
      )}
    </div>
  )
}
