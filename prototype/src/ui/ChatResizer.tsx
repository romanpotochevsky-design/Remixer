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
 * PERFORMANCE — the drag never goes through React. Re-rendering the whole shell
 * on every pointermove would re-run the chat, the preview and its container
 * queries 60 times a second. Instead the width is written straight to the
 * `--chat-w` custom property on <html>, and the bloom moves with `transform`.
 * The store is updated once, on release, so the value survives re-renders.
 */
import { useCallback, useEffect, useRef } from 'react'
import { useUI, CHAT_MIN, CHAT_MAX, CHAT_DEFAULT } from '@/state/ui'

export function ChatResizer() {
  const setChatWidth = useUI((s) => s.setChatWidth)
  const root = useRef<HTMLDivElement>(null)
  const grab = useRef<{ x: number; w: number } | null>(null)

  /** Clamp against the live window so the canvas can never be squeezed away. */
  const clamp = (px: number) =>
    Math.max(CHAT_MIN, Math.min(px, Math.min(CHAT_MAX, window.innerWidth - 520)))

  const setVar = (px: number) => document.documentElement.style.setProperty('--chat-w', `${px}px`)

  /** The bloom follows the pointer down the line — transform only. */
  const trackY = useCallback((clientY: number) => {
    const el = root.current
    if (!el) return
    el.style.setProperty('--glow-y', `${clientY - el.getBoundingClientRect().top}px`)
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      trackY(e.clientY)
      if (!grab.current) return
      setVar(clamp(grab.current.w + (e.clientX - grab.current.x)))
    }
    const onUp = () => {
      if (!grab.current) return
      grab.current = null
      root.current?.removeAttribute('data-drag')
      document.body.style.removeProperty('cursor')
      document.body.style.removeProperty('user-select')
      const now = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--chat-w'))
      if (!Number.isNaN(now)) setChatWidth(now)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [setChatWidth, trackY])

  return (
    <div
      ref={root}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize chat panel"
      className="chat-resizer"
      onPointerDown={(e) => {
        e.preventDefault()
        grab.current = {
          x: e.clientX,
          w: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--chat-w')) || CHAT_DEFAULT,
        }
        root.current?.setAttribute('data-drag', '')
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
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
