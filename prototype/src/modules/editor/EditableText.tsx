/**
 * ONE TEXT RUN OF THE SITE WITH A CARET IN IT — the Edit tool's host for `T` (site-parts.tsx).
 *
 * The three lessons of the plan's editor (PlanEditable.tsx) hold here word for word:
 *  · REACT MUST NOT OWN THE TEXT. The node renders empty and its text is written imperatively,
 *    only when the value differs and the node is not the one being typed in — otherwise the
 *    caret jumps to the start on every keystroke.
 *  · `plaintext-only`: a paste brings words, not somebody else's markup.
 *  · the caret goes where the click lands (the browser's own), one click — Lovable's Edit text
 *    tool does the same (audits/lovable-visual-edits-teardown.md §3).
 *
 * What differs from the plan, on purpose:
 *  · ESCAPE COMMITS, it does not revert (the UX review: for a novice Esc means "I'm done", and a
 *    reverted string that never became an undo step is gone for good). Mistakes are for Undo.
 *  · Enter commits and leaves everywhere — a site heading with two lines is not a heading, and a
 *    paragraph's line break would not survive the plain string the layer holds.
 *  · An emptied run puts its text back rather than staging an empty string: a blank heading is
 *    never what anybody meant, and the site must not lose a slot.
 *  · On commit the host's text is rewritten EVEN WHEN EQUAL. Chromium keeps ONE undo stack per
 *    document across editing hosts (verified by the architecture review's probe: ⌘Z in the chat
 *    composer walked back into a site host and reverted committed text behind the store); the
 *    rewrite retires the browser's steps for this host, so history belongs to the session's
 *    Undo alone.
 */
import { useLayoutEffect, useRef, type CSSProperties, type ElementType, type KeyboardEvent } from 'react'
import { useWorld } from '@/state/world'
import { compiledText } from '@/modules/preview/content'
import { useEditor } from './session'

export function EditableText({
  k, as: Tag = 'p', className = '', style, value,
}: {
  k: string
  as?: ElementType
  className?: string
  style?: CSSProperties
  /** What the run says now — the draft's word, the saved one, or the compiled copy. */
  value: string
}) {
  const ref = useRef<HTMLElement | null>(null)
  const stage = useEditor((s) => s.stage)
  const select = useEditor((s) => s.select)
  const savedText = useWorld((s) => s.world.siteEdits.text[k])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || el === document.activeElement) return
    if (el.textContent !== value) el.textContent = value
  }, [value])

  const commit = (el: HTMLElement) => {
    const raw = (el.textContent ?? '').replace(/ /g, ' ')
    const next = raw.trim().length ? raw : value
    el.textContent = next
    /* against the SAVED word (or the compiled copy): typing the saved word back is "no change",
       so the draft entry goes away rather than staging a look-alike */
    const base = savedText ?? compiledText(k) ?? value
    stage('text', k, next === base ? undefined : next)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.blur()
    }
  }

  return (
    <Tag
      ref={ref as never}
      data-edit={k}
      data-edit-kind="text"
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-label={k}
      spellCheck={false}
      className={`ve-text ${className}`}
      style={style}
      onKeyDown={onKeyDown}
      onFocus={() => select(k)}
      onBlur={(e: { currentTarget: HTMLElement }) => commit(e.currentTarget)}
      onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}
    />
  )
}
