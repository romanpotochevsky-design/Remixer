/**
 * ONE EDITABLE LINE OF THE PLAN — the piece that makes the Build Plan behave like a document
 * (designer, 09.09.2026: "нужно добавить возможность редактировать Build Plan текст как в
 * обычном ворд документе, кастомер может менять текст плана"). It closes the note the plan
 * shipped with on 07.09, when the document was read-only and the missing toolbar was recorded
 * as a deliberate absence rather than an oversight.
 *
 * ⚠️ REACT MUST NOT OWN THE TEXT. A `contentEditable` node whose children React re-renders
 * fights the caret: every keystroke re-runs the render, React replaces the text node, and the
 * caret jumps to the start (or the browser drops it). So the element is rendered EMPTY and its
 * text is written imperatively — and only when the value actually differs AND the node is not
 * the focused one. The document is therefore free to re-render for any other reason while
 * somebody is typing in it, which it does: the card in the dock reads the same edits.
 *
 * ⚠️ `plaintext-only` rather than `true`: a plan is prose, and a paste from a browser would
 * otherwise bring its markup, its fonts and its colours into the document. It also keeps the
 * committed value a plain string, which is what the store holds.
 *
 * The keys are the ones a document has, and no more than that:
 *  · Enter commits. In a list it opens the next bullet — the first thing anybody tries — and
 *    everywhere else it just leaves the field, because a heading with two lines is not a
 *    heading.
 *  · Escape puts back what was there and leaves. An edit you cannot abandon is a trap.
 *  · Backspace in an empty bullet removes it and puts the caret at the end of the one above,
 *    which is how every list in every editor closes a line.
 */
import { useLayoutEffect, useRef, type ElementType, type KeyboardEvent } from 'react'

export function PlanEditable({
  as: Tag = 'p', value, onCommit, onEnter, onEmptyBackspace, className = '', label, path,
}: {
  as?: ElementType
  /** What the document says here now — the compiled string, or the customer's own. */
  value: string
  onCommit: (next: string) => void
  /** A list gives this: open the next bullet instead of leaving. */
  onEnter?: (next: string) => void
  onEmptyBackspace?: () => void
  className?: string
  label: string
  /** Addresses the node so a freshly opened bullet can be focused after it mounts. */
  path: string
}) {
  const ref = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || el === document.activeElement) return
    if (el.textContent !== value) el.textContent = value
  }, [value])

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const el = e.currentTarget
    if (e.key === 'Enter') {
      e.preventDefault()
      const next = el.textContent ?? ''
      if (onEnter) onEnter(next)
      else { onCommit(next); el.blur() }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      el.textContent = value
      el.blur()
      return
    }
    if (e.key === 'Backspace' && onEmptyBackspace && !(el.textContent ?? '').length) {
      e.preventDefault()
      onEmptyBackspace()
    }
  }

  return (
    <Tag
      ref={ref as never}
      data-plan-path={path}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-label={label}
      spellCheck={false}
      className={`plan-edit ${className}`}
      onKeyDown={onKeyDown}
      onBlur={(e: { currentTarget: HTMLElement }) => onCommit(e.currentTarget.textContent ?? '')}
    />
  )
}

/** Put the caret at the end of the block at `path`, once it exists. */
export function focusPlanBlock(path: string) {
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>(`[data-plan-path="${CSS.escape(path)}"]`)
    if (!el) return
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  })
}
