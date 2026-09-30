/**
 * THE RINGS — what the Visual Editor draws over the site: the ring under the pointer, the ring on
 * the selected element, and the one-time reveal of everything editable when the mode opens.
 *
 * ONE OVERLAY, INSIDE THE PAGE'S SCROLL CONTENT (the architecture review). It is mounted in the
 * page wrapper that scrolls, so it scrolls with the site for free, is not clipped by a card's
 * `overflow: hidden` (the dish photo is flush with its card's edge), and never touches the site's
 * own boxes — nothing in the page gets a border, a padding or a transform. The site's geometry
 * with the editor on is the site's geometry with it off.
 *
 * Positions come from `getBoundingClientRect` differences on `pointerover` (an event per ELEMENT
 * change, not per pointer move — the resizer's lesson: no React work at pointer rate) and again
 * when the page resizes. Only opacity animates; a ring appears and disappears, it does not slide.
 *
 * Blue, one blue: `--action` #1587ff. The Visual Editor is a hand tool, and the spectrum belongs
 * to AI moments (CLAUDE.md, the resizer decision of 17.08.2026). The Select tool's ring carries a
 * human name on a chip («Heading», «Photo»), never a tag — that is the one thing Lovable's chips
 * get wrong (audits/lovable-visual-edits-teardown.md §5).
 */
import { useEffect, useLayoutEffect, useState, type RefObject } from 'react'
import { labelOf } from '@/modules/preview/content'
import { useEditor } from './session'

interface Box { x: number; y: number; w: number; h: number }

const boxOf = (el: Element, host: Element): Box => {
  const a = el.getBoundingClientRect()
  const b = host.getBoundingClientRect()
  return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height }
}

const TARGET = '[data-edit],[data-pick]'
const keyOf = (el: Element) => el.getAttribute('data-edit') ?? el.getAttribute('data-pick')

/** How far outside the element the ring stands: the text's own box is tight (a heading's leading
 *  is 1.08), so a ring ON it would cut the letters. */
const GAP = 4

export function EditOverlay({ host }: { host: RefObject<HTMLDivElement | null> }) {
  const tool = useEditor((s) => s.tool)
  const selected = useEditor((s) => s.selected)
  const context = useEditor((s) => s.context)
  const setContext = useEditor((s) => s.setContext)
  const [hover, setHover] = useState<{ key: string; box: Box } | null>(null)
  const [pinned, setPinned] = useState<{ key: string; box: Box } | null>(null)
  const [reveal, setReveal] = useState<Box[] | null>(null)
  const pinKey = tool === 'select' ? context : selected

  /* hover: delegated on the page wrapper, one state change per element entered or left */
  useEffect(() => {
    const el = host.current
    if (!el) return
    const over = (e: PointerEvent) => {
      const t = (e.target as Element | null)?.closest?.(TARGET)
      if (!t || !el.contains(t)) { setHover(null); return }
      const key = keyOf(t)
      if (!key) { setHover(null); return }
      setHover((h) => (h && h.key === key ? h : { key, box: boxOf(t, el) }))
    }
    const leave = () => setHover(null)
    el.addEventListener('pointerover', over)
    el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointerover', over); el.removeEventListener('pointerleave', leave) }
  }, [host])

  /* the Select tool's pick: a click on a target hands its key to the chat and swallows the click,
     so a CTA under the pointer is chosen, not followed */
  useEffect(() => {
    const el = host.current
    if (!el || tool !== 'select') return
    const click = (e: MouseEvent) => {
      const t = (e.target as Element | null)?.closest?.(TARGET)
      if (!t || !el.contains(t)) return
      const key = keyOf(t)
      if (!key) return
      e.preventDefault()
      e.stopPropagation()
      setContext(key)
    }
    el.addEventListener('click', click, true)
    return () => el.removeEventListener('click', click, true)
  }, [host, tool, setContext])

  /* the pinned ring follows its element through resizes (the device switch, the chat divider) */
  useLayoutEffect(() => {
    const el = host.current
    if (!el || !pinKey) { setPinned(null); return }
    const measure = () => {
      const t = el.querySelector(`[data-edit="${CSS.escape(pinKey)}"],[data-pick="${CSS.escape(pinKey)}"]`)
      setPinned(t ? { key: pinKey, box: boxOf(t, el) } : null)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [host, pinKey])

  /* THE REVEAL: on entering the mode every target rings once, in reading order, a beat apart, and
     fades — so a novice sees at a glance what can be touched (Framer and Hostinger show theirs
     statically; ours breathes once and gets out of the way). Opacity only, ~25 small boxes. */
  useEffect(() => {
    const el = host.current
    if (!el || !tool) { setReveal(null); return }
    const boxes = Array.from(el.querySelectorAll(TARGET)).map((t) => boxOf(t, el))
    setReveal(boxes)
    const t = window.setTimeout(() => setReveal(null), 900 + boxes.length * 40)
    return () => window.clearTimeout(t)
  }, [host, tool])

  const ring = (b: Box, cls: string, key: string, style?: React.CSSProperties) => (
    <span
      key={key}
      className={`ve-ring ${cls}`}
      style={{ left: b.x - GAP, top: b.y - GAP, width: b.w + GAP * 2, height: b.h + GAP * 2, ...style }}
      aria-hidden
    />
  )

  return (
    <div className="ve-overlay" data-ve-overlay aria-hidden>
      {reveal?.map((b, i) => ring(b, 've-ring--reveal', `r${i}`, { animationDelay: `${i * 40}ms` }))}
      {hover && hover.key !== pinKey && ring(hover.box, 've-ring--hover', 'hover')}
      {pinned && ring(pinned.box, 've-ring--pinned', 'pinned')}
      {/* the Select tool names what it picked; the Edit tool's caret and Replace button speak for themselves */}
      {tool === 'select' && pinned && (
        <span
          className="ve-chip"
          style={{ left: pinned.box.x - GAP, top: pinned.box.y - GAP - 26 }}
          data-ve-chip
        >
          {labelOf(pinned.key)}
        </span>
      )}
    </div>
  )
}
