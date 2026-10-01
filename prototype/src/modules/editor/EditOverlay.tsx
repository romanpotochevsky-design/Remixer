/**
 * THE RINGS — what the Visual Editor draws over the site.
 *
 * ONE OVERLAY, INSIDE THE PAGE'S SCROLL CONTENT (the architecture review). It is mounted in the
 * page wrapper that scrolls, so it scrolls with the site for free, is not clipped by a card's
 * `overflow: hidden` (the dish photo is flush with its card's edge), and never touches the site's
 * own boxes — nothing in the page gets a border, a padding or a transform. The site's geometry
 * with the editor on is the site's geometry with it off.
 *
 * Two tools, two pictures:
 *  · EDIT — the ring under the pointer and on the selected text/photo, 4 px outside the element
 *    (a heading's own box is tight: a ring ON it would cut the letters), r8, fading; and the
 *    one-time reveal of everything editable when the mode opens.
 *  · SELECT — Lovable's tool, frame for frame, in our blue (designer 01.10.2026, with a recording:
 *    «мне нравится как выглядит и работает (поведение) инструмент селекта, нам нужно сделать точно
 *    так же, только используй наш фирменный синий цвет»; scratchpad/lov-select/). ANY element is a
 *    target — the deepest under the pointer; the ring sits 1 px ON its box, square, over a faint
 *    tint, and jumps (no fade, no slide); a pill with the element's tag rides at the cursor; a
 *    click picks and never follows; the pick keeps its ring while the pointer rings others.
 *
 * ⚠️ THE OVERLAY FINDS ITS PAGE FROM ITS OWN NODE (`root.parentElement`), never from a ref the page
 * hands down. Each page of the site mounts its own wrapper under AnimatePresence, and a shared ref
 * is nulled by the page that LEAVES — after a page switch every overlay read `null` and the tool was
 * dead (clicks followed links). And a ref of an ancestor is still `null` in a child's layout effect
 * on mount (CLAUDE.md, the pane flyer lesson): a site layer remounted with the tool on (a canvas
 * window round trip) lost its pick ring for good.
 *
 * Positions come from `getBoundingClientRect` differences on `pointerover` (an event per ELEMENT
 * change, not per pointer move — the resizer's lesson: no React work at pointer rate). The one
 * thing that does move at pointer rate — the Select tool's tag pill — is written straight into
 * its transform from a rAF, never through React.
 *
 * Blue, one blue: `--action` #1587ff. The Visual Editor is a hand tool, and the spectrum belongs
 * to AI moments (CLAUDE.md, the resizer decision of 17.08.2026).
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useWorld } from '@/state/world'
import { useEditor } from './session'
import { pickKey, pickName, pickTarget } from './pick'

interface Box { x: number; y: number; w: number; h: number }

/** An element's box in the page wrapper's own (layout) pixels. Read while an ancestor is scaled —
 *  the site layer steps back to .94 behind a canvas window and springs home — screen rects are
 *  scaled with it, and a ring measured then would stay that small once the layer is home (a
 *  transform fires no resize): the scale is divided out. */
const boxOf = (el: Element, host: HTMLElement): Box => {
  const a = el.getBoundingClientRect()
  const b = host.getBoundingClientRect()
  const k = host.offsetWidth ? b.width / host.offsetWidth : 1
  return { x: (a.left - b.left) / k, y: (a.top - b.top) / k, w: a.width / k, h: a.height / k }
}
const sameBox = (a: Box | null, b: Box | null) => !!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h

export function EditOverlay() {
  const tool = useEditor((s) => s.tool)
  if (tool === 'select') return <SelectOverlay />
  return <EditRings />
}

/** The page wrapper the overlay sits in, read from the overlay's own node before the first paint. */
function useHost() {
  const root = useRef<HTMLDivElement>(null)
  const [host, setHost] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => { setHost(root.current?.parentElement ?? null) }, [])
  return [root, host] as const
}

/* ─────────────────────────────── EDIT ─────────────────────────────── */

const TARGET = '[data-edit],[data-pick]'
const keyOf = (el: Element) => el.getAttribute('data-edit') ?? el.getAttribute('data-pick')

/** How far outside the element the Edit ring stands: the text's own box is tight (a heading's
 *  leading is 1.08), so a ring ON it would cut the letters. */
const GAP = 4

function EditRings() {
  const [root, host] = useHost()
  const tool = useEditor((s) => s.tool)
  const selected = useEditor((s) => s.selected)
  const [hover, setHover] = useState<{ key: string; box: Box } | null>(null)
  const [pinned, setPinned] = useState<{ key: string; box: Box } | null>(null)
  const [reveal, setReveal] = useState<Box[] | null>(null)

  /* hover: delegated on the page wrapper, one state change per element entered or left */
  useEffect(() => {
    const el = host
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

  /* the pinned ring follows its element through resizes (the device switch, the chat divider) */
  useLayoutEffect(() => {
    const el = host
    if (!el || !selected) { setPinned(null); return }
    const measure = () => {
      const t = el.querySelector(`[data-edit="${CSS.escape(selected)}"],[data-pick="${CSS.escape(selected)}"]`)
      setPinned(t ? { key: selected, box: boxOf(t, el) } : null)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [host, selected])

  /* THE REVEAL: on entering the mode every target rings once, in reading order, a beat apart, and
     fades — so a novice sees at a glance what can be touched (Framer and Hostinger show theirs
     statically; ours breathes once and gets out of the way). Opacity only, ~25 small boxes. */
  useEffect(() => {
    const el = host
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
    <div ref={root} className="ve-overlay" data-ve-overlay aria-hidden>
      {reveal?.map((b, i) => ring(b, 've-ring--reveal', `r${i}`, { animationDelay: `${i * 40}ms` }))}
      {hover && hover.key !== selected && ring(hover.box, 've-ring--hover', 'hover')}
      {pinned && ring(pinned.box, 've-ring--pinned', 'pinned')}
    </div>
  )
}

/* ─────────────────────────────── SELECT ─────────────────────────────── */

/** Where the tag pill rides relative to the cursor's hotspot — measured on the recording: the
 *  crosshair's centre to the pill's top-left corner. */
const TAG_DX = 14
const TAG_DY = 18
/** The pill never leaves the preview: this far inside its edges at the most. */
const TAG_EDGE = 4

function SelectOverlay() {
  const [root, host] = useHost()
  const names = useWorld((s) => s.world.selectNames)
  const pickEl = useEditor((s) => s.contextEl)
  const pickId = useEditor((s) => s.context)
  const setContext = useEditor((s) => s.setContext)
  const [hover, setHover] = useState<{ el: Element; box: Box; name: string } | null>(null)
  const [pinned, setPinned] = useState<Box | null>(null)
  const tag = useRef<HTMLSpanElement>(null)
  const hoverEl = useRef<Element | null>(null)
  const placeRef = useRef<(() => void) | null>(null)
  const measureRef = useRef<(() => void) | null>(null)
  const namesRef = useRef(names)
  namesRef.current = names

  useEffect(() => {
    const el = host
    const port = el?.parentElement /* the page's scroller: the preview's visible box */
    if (!el || !port) return
    let x = -1
    let y = -1
    let raf = 0
    let scrolledSince = false

    const ringOn = (t: Element | null) => {
      hoverEl.current = t
      setHover((h) => {
        if (!t) return null
        const box = boxOf(t, el)
        if (h && h.el === t && sameBox(h.box, box)) return h
        return { el: t, box, name: pickName(t, namesRef.current) }
      })
    }
    /* THE PILL lives in the overlay, inside the page's scroll content — so the preview's own clip
       and the edit bar above the canvas cover it, as Lovable's iframe and toolbar do — and is placed
       from the hotspot in screen space: kept inside the preview, flipped above the hotspot at its foot */
    const place = () => {
      raf = 0
      if (scrolledSince) {
        /* scrolling moved the page under a still pointer: ask again what it points at, and re-seat
           the pick (a sticky element's box moves against the page while it scrolls) */
        scrolledSince = false
        if (x >= 0) ringOn(pickTarget(document.elementFromPoint(x, y), el))
        measureRef.current?.()
      }
      const p = tag.current
      if (!p || x < 0) return
      const v = port.getBoundingClientRect()
      const o = el.getBoundingClientRect()
      const k = el.offsetWidth ? o.width / el.offsetWidth : 1 /* an ancestor's scale, as in boxOf */
      const w = p.offsetWidth * k
      const h = p.offsetHeight * k
      let px = x + TAG_DX
      let py = y + TAG_DY
      if (px + w > v.right - TAG_EDGE) px = v.right - TAG_EDGE - w
      if (px < v.left + TAG_EDGE) px = v.left + TAG_EDGE
      if (py + h > v.bottom - TAG_EDGE) py = y - TAG_DY - h + 4
      if (py < v.top + TAG_EDGE) py = v.top + TAG_EDGE
      p.style.transform = `translate3d(${Math.round((px - o.left) / k)}px, ${Math.round((py - o.top) / k)}px, 0)`
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(place) }
    placeRef.current = place

    /* the ring and the pill's word change in the SAME frame as the pill moves — rendered at once
       (one render per element crossed, the rate this file already pays), not a scheduler task later */
    const over = (e: PointerEvent) => { x = e.clientX; y = e.clientY; flushSync(() => ringOn(pickTarget(e.target, el))); schedule() }
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY
      /* a tool turned on under a resting pointer has had no `pointerover` yet: the first move seeds it */
      if (!hoverEl.current) { const t = pickTarget(e.target, el); if (t) flushSync(() => ringOn(t)) }
      schedule()
    }
    const leave = () => { x = -1; flushSync(() => ringOn(null)) }
    const scrolled = () => { scrolledSince = true; schedule() }
    /* a click PICKS — it never follows a link, presses a button or focuses a field */
    const click = (e: MouseEvent) => {
      const t = pickTarget(e.target, el)
      if (!t) return
      e.preventDefault()
      e.stopPropagation()
      setContext(pickKey(t), { el: t, label: pickName(t, namesRef.current) })
    }
    const swallow = (e: Event) => {
      if (!pickTarget(e.target, el)) return
      e.preventDefault()
    }
    el.addEventListener('pointerover', over)
    el.addEventListener('pointermove', move, { passive: true })
    el.addEventListener('pointerleave', leave)
    el.addEventListener('click', click, true)
    el.addEventListener('mousedown', swallow, true)
    el.addEventListener('auxclick', swallow, true)
    port.addEventListener('scroll', scrolled, { passive: true })
    return () => {
      if (raf) cancelAnimationFrame(raf)
      el.removeEventListener('pointerover', over)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('click', click, true)
      el.removeEventListener('mousedown', swallow, true)
      el.removeEventListener('auxclick', swallow, true)
      port.removeEventListener('scroll', scrolled)
      placeRef.current = null
    }
  }, [host, setContext])

  /* a pill that has just mounted, or changed its word (and so its width), is placed before it is
     painted — otherwise its first frame stands at the overlay's corner */
  const shownName = hover?.name
  useLayoutEffect(() => { if (shownName) placeRef.current?.() }, [shownName])

  /* the console's word switch renames the element under the pointer at once */
  useEffect(() => {
    setHover((h) => (h ? { ...h, name: pickName(h.el, names) } : h))
  }, [names])

  /* both rings follow their elements through resizes (the device switch, the chat divider, a
     photo that finished loading) — re-measured, never animated */
  useLayoutEffect(() => {
    const el = host
    if (!el) return
    const measure = () => {
      const t = pickEl ? relocate(pickEl, pickId, el) : null
      /* the node the session holds is gone (the page re-rendered under it, the site layer came back
         from a canvas window): the same element on the new page takes its place, and a pick nothing
         on the page can stand for any more is dropped — a chip naming an element nobody can see
         would be the composer lying */
      if (pickEl && t && t !== pickEl) useEditor.setState({ contextEl: t })
      else if (pickEl && !t && !pickEl.isConnected) setContext(null)
      const box = t ? boxOf(t, el) : null
      setPinned((b) => (b && box && sameBox(b, box) ? b : box))
      const h = hoverEl.current
      if (h) setHover((cur) => {
        if (!cur || cur.el !== h) return cur
        if (!h.isConnected) return null
        const nb = boxOf(h, el)
        return sameBox(cur.box, nb) ? cur : { ...cur, box: nb }
      })
    }
    measureRef.current = measure
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    if (pickEl?.isConnected && el.contains(pickEl)) ro.observe(pickEl)
    return () => { ro.disconnect(); measureRef.current = null }
  }, [host, pickEl, pickId, setContext])

  const ring = (b: Box, key: string, attr: Record<string, string>) => (
    <span key={key} className="ve-sel" style={{ left: b.x, top: b.y, width: b.w, height: b.h }} aria-hidden {...attr} />
  )

  return (
    <div ref={root} className="ve-overlay" data-ve-overlay aria-hidden>
      {pinned && ring(pinned, 'pick', { 'data-ve-pick': '' })}
      {hover && hover.el !== (pickEl ?? null) && ring(hover.box, 'hover', { 'data-ve-hover': '' })}
      {hover && <span ref={tag} className="ve-tag" data-ve-tag>{hover.name}</span>}
    </div>
  )
}

/**
 * The pick on THIS page: the node itself while it stands here; else the same element found again
 * — by its content key, or (an element the table does not know) by its position under the page
 * wrapper, read off the detached node's own ancestry and accepted only if the tag and the words
 * match, so a pick never silently moves to a different element.
 */
function relocate(pick: Element, id: string | null, host: Element): Element | null {
  if (pick.isConnected) return host.contains(pick) ? pick : null
  if (id && !id.startsWith('el:') && !id.startsWith('media:')) {
    return host.querySelector(`[data-pick="${CSS.escape(id)}"]`)
  }
  const path: number[] = []
  let n: Element | null = pick
  while (n && !n.hasAttribute('data-site-root')) {
    const parent: Element | null = n.parentElement
    if (!parent) return null
    path.unshift(Array.prototype.indexOf.call(parent.children, n))
    n = parent
  }
  if (!n) return null
  let m: Element | undefined = host
  for (const i of path) { m = m?.children[i]; if (!m) return null }
  if (!m || m.tagName !== pick.tagName || (m.textContent ?? '').slice(0, 80) !== (pick.textContent ?? '').slice(0, 80)) return null
  return m
}
