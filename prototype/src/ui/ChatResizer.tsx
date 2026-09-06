/**
 * The draggable divider between the chat column and the canvas.
 *
 * Lovable lights their divider solid blue while you drag it and parks a small
 * chevron handle at the pointer. This does that, plus the thing they don't: the
 * light is not uniform — a bloom rides with your cursor along the line and the
 * rest of it falls off, so the divider reads as something you are holding, not
 * a bar that changed colour. Grabbing it fires one pulse outward from the grab
 * point.
 *
 * Two more moves, both Lovable's (recording, 06.09.2026): drag the divider far
 * enough right that the canvas would drop under PREVIEW_MIN and the preview
 * COLLAPSES — the chat takes the shell and centres itself. And while it is
 * collapsed a small grip waits at the right edge; pull it left and the preview
 * comes back at the width you drag it to.
 *
 * PERFORMANCE — the drag never goes through React. Re-rendering the whole shell
 * on every pointermove would re-run the chat, the preview and its container
 * queries 60 times a second. Instead the width is written straight to the
 * `--chat-w` custom property on <html>, and the bloom moves with `transform`.
 * The store is updated once, on release, so the value survives re-renders.
 * `data-drag` on <html> switches the aside's width transition off for the
 * duration, otherwise every pointermove would be smoothed into lag.
 */
import { useCallback, useEffect, useRef } from 'react'
import { useUI, CHAT_MIN, CHAT_MAX, CHAT_DEFAULT, PREVIEW_MIN } from '@/state/ui'

const RAIL = 56

/** The widest the chat may get while the canvas stays open. */
const maxOpen = () => Math.min(CHAT_MAX, window.innerWidth - RAIL - PREVIEW_MIN)

const setVar = (px: number) => document.documentElement.style.setProperty('--chat-w', `${px}px`)
const readVar = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--chat-w')) || CHAT_DEFAULT

function beginDrag() {
  document.documentElement.setAttribute('data-drag', '')
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}
function endDrag() {
  document.documentElement.removeAttribute('data-drag')
  document.body.style.removeProperty('cursor')
  document.body.style.removeProperty('user-select')
}

export function ChatResizer() {
  const setChatWidth = useUI((s) => s.setChatWidth)
  const previewOpen = useUI((s) => s.previewOpen)
  const setPreviewOpen = useUI((s) => s.setPreviewOpen)
  const root = useRef<HTMLDivElement>(null)
  const grab = useRef<{ x: number; w: number } | null>(null)
  /** Reopen drag from the collapsed grip: the pointer's start, and whether it opened yet. */
  const pull = useRef<{ x: number; opened: boolean } | null>(null)

  /** Clamp against the live window so the canvas can never be squeezed away. */
  const clamp = (px: number) => Math.max(CHAT_MIN, Math.min(px, maxOpen()))

  /** The bloom follows the pointer down the line — transform only. */
  const trackY = useCallback((clientY: number) => {
    const el = root.current
    if (!el) return
    el.style.setProperty('--glow-y', `${clientY - el.getBoundingClientRect().top}px`)
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      trackY(e.clientY)
      if (grab.current) {
        const want = grab.current.w + (e.clientX - grab.current.x)
        // Past the canvas minimum: let go of the width and collapse the preview.
        if (want > maxOpen() + 24) {
          grab.current = null
          root.current?.removeAttribute('data-drag')
          endDrag()
          setChatWidth(clamp(readVar()))
          setPreviewOpen(false)
          return
        }
        setVar(clamp(want))
        return
      }
      if (pull.current) {
        const dx = pull.current.x - e.clientX
        if (!pull.current.opened) {
          if (dx < 32) return
          pull.current.opened = true
          setPreviewOpen(true)
        }
        setVar(clamp(e.clientX))
      }
    }
    const onUp = () => {
      if (grab.current) {
        grab.current = null
        root.current?.removeAttribute('data-drag')
        endDrag()
        setChatWidth(clamp(readVar()))
      }
      if (pull.current) {
        const opened = pull.current.opened
        pull.current = null
        endDrag()
        if (opened) setChatWidth(clamp(readVar()))
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [setChatWidth, setPreviewOpen, trackY])

  if (!previewOpen) {
    /* Collapsed: a grip hugging the right edge of the chat. Click to reopen at the
       remembered width, or pull it left to reopen at the width you want. */
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Show preview"
        className="chat-reopen"
        onPointerDown={(e) => {
          e.preventDefault()
          pull.current = { x: e.clientX, opened: false }
          beginDrag()
        }}
        onClick={() => {
          if (pull.current?.opened) return
          setPreviewOpen(true)
        }}
      >
        <span className="chat-reopen-grip" aria-hidden>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor">
            <path d="M4.6 1v8L.8 5.2a.3.3 0 0 1 0-.4L4.6 1Z" />
            <path d="M9.4 1v8l3.8-3.8a.3.3 0 0 0 0-.4L9.4 1Z" />
          </svg>
        </span>
      </div>
    )
  }

  return (
    <div
      ref={root}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize chat panel"
      className="chat-resizer"
      onPointerDown={(e) => {
        e.preventDefault()
        grab.current = { x: e.clientX, w: readVar() }
        root.current?.setAttribute('data-drag', '')
        beginDrag()
      }}
      onDoubleClick={() => {
        setVar(CHAT_DEFAULT)
        setChatWidth(CHAT_DEFAULT)
      }}
      onPointerMove={(e) => trackY(e.clientY)}
    >
      <span className="chat-resizer-line" aria-hidden />
      <span className="chat-resizer-bloom" aria-hidden />
      <span className="chat-resizer-core" aria-hidden />
      <span className="chat-resizer-grip" aria-hidden>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor">
          <path d="M4.6 1v8L.8 5.2a.3.3 0 0 1 0-.4L4.6 1Z" />
          <path d="M9.4 1v8l3.8-3.8a.3.3 0 0 0 0-.4L9.4 1Z" />
        </svg>
      </span>
    </div>
  )
}
