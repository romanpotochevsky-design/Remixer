/**
 * THE PLAN'S PROSE — ONE EDITABLE DOCUMENT, not a stack of fields (designer, 21.09.2026:
 * «зачем ты даёшь редактировать текст так? выделяется только строка, почему не сделать так как
 * в редактировании обычных документов, как в гугл док?»).
 *
 * ⚠️ THE FIRST CUT MADE EVERY LINE ITS OWN `contentEditable`, and that is what he caught: two
 * separate editable hosts cannot hold one selection, so a drag could never cross a paragraph,
 * and each line lit a focus ring — the idiom of a FORM FIELD. A document has one caret, one
 * selection and no boxes. So the host is ONE `contentEditable` around the whole prose, and the
 * lines inside it are ordinary elements that happen to carry `data-plan-path`.
 *
 * ⚠️ REACT STILL MUST NOT OWN THE TEXT. A `contentEditable` whose children React re-renders
 * fights the caret: every keystroke re-runs the render, React replaces the text node, and the
 * caret jumps to the start. So every line is rendered EMPTY and its text is written
 * imperatively — and only while nobody is typing in this host. The document is therefore free
 * to re-render for any other reason mid-edit, which it does (the card and the unfolded window
 * are the same component).
 *
 * ⚠️ AND IT IS `plaintext-only`: a paste from a browser would otherwise bring its markup, its
 * fonts and its colours into the plan, and the store holds plain strings.
 *
 * WHERE THE EDITS GO: the same `world.planEdits` paths the canvas-sized document writes
 * (`title`, `goal`, `s{i}:h`, `s{i}:b`, `s{i}:{j}`, `s{i}:after`), committed when the host
 * loses focus. One layer over the compiled plan, whichever window somebody typed in.
 *
 * Geometry is the board's (30596:27084): pl 16 / pr 24 / py 18, 16 between blocks, 10 inside
 * each, a 15 MEDIUM white line over 14 REGULAR at 64% white, both at leading 1.4.
 */
import { useLayoutEffect, useMemo, useRef, type KeyboardEvent } from 'react'
import { useWorld } from '@/state/world'
import { useT } from '@/i18n'
import type { Plan } from './plan'
import { editPlanItems, editPlanText } from './send'

/** One line of the document: its path, what it says now, and what it would say uncompiled. */
interface Line { path: string; value: string; fallback: string }

export function PlanDocument({ plan }: { plan: Plan }) {
  const { t } = useT()
  const edits = useWorld((s) => s.world.planEdits)
  const host = useRef<HTMLDivElement>(null)

  /* What every line says now — the customer's words if they wrote any, else the compiled ones.
     Built once per render and used for both halves: writing the DOM and committing back. */
  const lines = useMemo(() => {
    const read = (path: string, fallback: string): Line => ({ path, value: edits.text[path] ?? fallback, fallback })
    const out: Line[] = [read('title', t(plan.title)), read('goal', t(plan.goal))]
    const items: string[][] = []
    plan.sections.forEach((section, i) => {
      out.push(read(`s${i}:h`, t(section.heading)))
      if (section.body) out.push(read(`s${i}:b`, t(section.body)))
      const own = edits.items[i] ?? (section.items ?? []).map((x) => t(x))
      items[i] = own
      own.forEach((item, j) => out.push({ path: `s${i}:${j}`, value: item, fallback: item }))
      if (section.after) out.push(read(`s${i}:after`, t(section.after)))
    })
    return { out, items }
  }, [plan, edits, t])

  /* The DOM carries the text. Written only when the value actually differs AND nobody is
     typing in this host — the rule that keeps the caret where the customer put it. */
  useLayoutEffect(() => {
    const el = host.current
    if (!el) return
    const active = document.activeElement
    if (active && (active === el || el.contains(active))) return
    for (const line of lines.out) {
      const node = el.querySelector<HTMLElement>(`[data-plan-path="${CSS.escape(line.path)}"]`)
      if (node && node.textContent !== line.value) node.textContent = line.value
    }
  }, [lines])

  /**
   * Read the document back and post whatever changed. Prose goes line by line; a section's
   * bullets go as a whole, because the store holds them as one array and a single changed
   * line has to travel with its neighbours.
   */
  const commit = () => {
    const el = host.current
    if (!el) return
    const textAt = (path: string) => el.querySelector<HTMLElement>(`[data-plan-path="${CSS.escape(path)}"]`)?.textContent ?? null
    for (const line of lines.out) {
      if (/^s\d+:\d+$/.test(line.path)) continue
      const now = textAt(line.path)
      if (now !== null && now !== line.value) editPlanText(line.path, now, line.fallback)
    }
    lines.items.forEach((items, i) => {
      if (!items.length) return
      const now = items.map((item, j) => textAt(`s${i}:${j}`) ?? item)
      if (now.some((v, j) => v !== items[j])) editPlanItems(i, now)
    })
  }

  /* Escape abandons the edit — the document goes back to what the store says and the caret
     leaves. An edit you cannot walk away from is a trap; the same key does the same thing on
     every other editable surface in this shell. */
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape') return
    e.preventDefault()
    e.stopPropagation()
    const el = host.current
    if (!el) return
    for (const line of lines.out) {
      const node = el.querySelector<HTMLElement>(`[data-plan-path="${CSS.escape(line.path)}"]`)
      if (node && node.textContent !== line.value) node.textContent = line.value
    }
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  const line = (path: string, className: string) => (
    <p key={path} data-plan-path={path} className={`plan-line ${className}`} />
  )

  return (
    <div
      ref={host}
      data-plan-doc
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={t({ en: 'The plan, editable', uk: 'План, можна редагувати' })}
      spellCheck={false}
      onBlur={commit}
      onKeyDown={onKeyDown}
      /* `min-h-full` so a click in the empty space below the text still lands in the document
         and puts the caret at the end, the way it does in a word processor. */
      className="plan-doc flex min-h-full flex-col gap-4 py-[18px] pl-4 pr-6 outline-none"
    >
      <div className="flex flex-col gap-2.5">
        {line('title', 'text-[15px] font-medium leading-[1.4] text-white')}
        {line('goal', 'text-[14px] leading-[1.4] text-[#ffffffa3]')}
      </div>

      {plan.sections.map((section, i) => {
        const items = lines.items[i] ?? []
        return (
          <div key={section.heading.en} className="flex flex-col gap-2.5">
            {line(`s${i}:h`, 'text-[15px] font-medium leading-[1.4] text-white')}
            {section.body && line(`s${i}:b`, 'text-[14px] leading-[1.4] text-[#ffffffa3]')}
            {items.length > 0 && (
              /* the board sets a section's lines as ONE text block: consecutive leading-1.4
                 lines, no bullets, sharing the block's 10px gap */
              <div className="text-[14px] leading-[1.4] text-[#ffffffa3]">
                {items.map((_, j) => line(`s${i}:${j}`, ''))}
              </div>
            )}
            {section.after && line(`s${i}:after`, 'text-[14px] leading-[1.4] text-[#ffffffa3]')}
          </div>
        )
      })}
    </div>
  )
}
