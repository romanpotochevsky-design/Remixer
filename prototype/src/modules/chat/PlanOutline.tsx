/**
 * THE PAGE STACK IN THE BUILD PLAN — Figma 30115:55247 (designer, 11.09.2026: "я подготовил
 * тебе макет… тебе нужно перфект пиксель сделать вот эти компоненты").
 *
 * WHY IT EXISTS. Only the first page is generated in a pass — credits, and a minute rather
 * than four (designer, same day: "мы всегда будем генерировать только одну основную
 * страницу… вот это должно как то быть учтено в плане"). The generation card has said so
 * since 07.09: Home with its sections open, the rest named and closed. The PLAN, one beat
 * earlier, said "Four pages — Home, About, Services and Contact" — which made the document
 * the customer approves the only place that promised four. So the plan now draws the same
 * stack from the same `buildOutline`, at rest: press `Start Building` and this very block
 * starts filling in.
 *
 * AND IT IS THE ONE EDITABLE THING IN THE PLAN THAT REACHES THE BUILD. Prose here is a
 * record and changes nothing (`editPlanText`); these names compile into `buildOutline`,
 * which the generation card and the Autopilot proposals read — rename "Services" to "Menu"
 * and the card builds Menu and the proposal offers Menu.
 *
 * ⚠️ A ROW IS AN OBJECT, NOT A LINE OF TEXT (designer, 11.09.2026, on the first version:
 * "бред какой то как удалить страницу или секцию? как поменять местами?"). Carrying the
 * document's Enter/Backspace idiom onto the stack read as consistency and was a
 * substitution: a bullet is nothing but text, so select-all-and-delete IS how you remove
 * one, but nobody guesses that on something drawn as a row — and it offers no way to
 * reorder at all. Each row reveals the two controls a list of objects has always had: the
 * row's own mark becomes a grip under the pointer, and an ✕ appears at its right. Space for
 * both is reserved at rest, so the row never moves. Enter and Backspace still work.
 *
 * ⚠️ MOVING A NODE IN THE DOM RELEASES ITS POINTER CAPTURE. The first drag died after its
 * first reinsertion — measured: one pointermove after pointerdown, then nothing, not even
 * pointerup. The listeners live on the window and take no capture. And the slot is chosen
 * by the pointer's position against each row's CONTENT midpoint, not by swapping with one
 * neighbour per move: a section dragged from third to first landed second, because the
 * layout shifted under the next event.
 *
 * GEOMETRY, off the board:
 *   shell        `Black/200` (black 16%), radius 24, w 800 — holds the card and "Add a page"
 *   card         `#1a1a1c` under a 1px `#353537`, radius 24
 *   page block   `Neutral Alpha/50` (4% white) under the same 1px, radius 24, px/pb 1
 *   header       48 tall, pl 14 / pr 12, icon 20, name 13 MEDIUM white on its cap band;
 *                the pill 24 tall, px 10, radius 12, WHITE plate with #09090b label,
 *                13 semibold — read in the dark theme, where `Neutral Alpha/1000` is #fff
 *   sheet        `Black/700` (black 64%) under `Neutral Alpha/200` (12% white), radius
 *                20 top / 22 bottom, pr 16 / pb 16
 *   rows         gap 8, pt 16; elbow column 16 (`Gray/750` #33333a), icon box 24, text 14
 *                MEDIUM at 48% white with pt 3
 *   add          16 of air above it, a 24 disc at x=36 and a 14 medium WHITE label at
 *                x=72 — the section columns exactly, not a column of its own
 *   waiting      48 tall, pl 12 / pr 8, icon 20, name 13 medium 48% white; every one seals
 *                its bottom with b/l/r + radius 16 EXCEPT the last, which draws nothing —
 *                the card's own corner closes it, exactly as in the generation card.
 *                The sealed ones are pulled a pixel out so their sides ride the card's rail;
 *                the last is not, because with no stroke the pull would only move its icon
 *                off x=13
 *   add a page   48 tall, a 24 disc, label 13 medium white, bottom hairline, radius 24
 */
import { useLayoutEffect, useRef, useState } from 'react'
import { useWorld } from '@/state/world'
import { useT } from '@/i18n'
import { buildOutline } from './build'
import { editPlanOutline } from './send'
import { IconPage, IconStepQueued, IconPlusDisc, IconClose } from '@/ui/icons'

/* ------------------------------------------------------------------ one editable name
 *
 * ⚠️ REACT DOES NOT OWN THE TEXT while the caret is in it — the lesson `PlanEditable`
 * already carries. The node renders EMPTY and the text is written imperatively, and only
 * when the value differs AND the node is not focused. `plaintext-only`, or a paste brings
 * somebody else's markup in.
 */
function Name({
  value, path, className, onCommit, onEnter, onEmpty, label,
}: {
  value: string
  path: string
  className: string
  onCommit: (v: string) => void
  onEnter?: () => void
  onEmpty?: () => void
  label: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const n = ref.current
    if (n && n.textContent !== value && document.activeElement !== n) n.textContent = value
  }, [value])
  return (
    <span
      ref={ref}
      data-plan-path={path}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      aria-label={label}
      className={`plan-edit ${className}`}
      onBlur={(e) => onCommit(e.currentTarget.textContent?.trim() ?? '')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onEnter) {
          e.preventDefault()
          onCommit(e.currentTarget.textContent?.trim() ?? '')
          onEnter()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          e.currentTarget.textContent = value
          e.currentTarget.blur()
        } else if (e.key === 'Backspace' && !e.currentTarget.textContent?.trim() && onEmpty) {
          e.preventDefault()
          onEmpty()
        }
      }}
    />
  )
}

/** Put the caret at the end of the line a structural edit just opened. */
function focusRow(path: string) {
  requestAnimationFrame(() => {
    const n = document.querySelector<HTMLElement>(`[data-plan-path="${path}"]`)
    if (!n) return
    n.focus()
    const r = document.createRange()
    r.selectNodeContents(n)
    r.collapse(false)
    const sel = getSelection()
    sel?.removeAllRanges()
    sel?.addRange(r)
  })
}

/* --------------------------------------------------------------- the row's two controls */

function Grip({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <span className="plan-grip" style={{ ['--grip' as string]: `${size}px` }}>
      <span className="plan-grip-mark">{children}</span>
      <svg viewBox="0 0 20 20" width={size} height={size} className="plan-grip-dots" aria-hidden>
        {[5, 10, 15].map((y) => [7, 13].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="#ffffff8f" />))}
      </svg>
    </span>
  )
}

function Remove({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} className="plan-row-x" onClick={onClick}>
      <IconClose size={10} />
    </button>
  )
}

/**
 * Drag to reorder, by the grip. The rows move in the DOM as the pointer crosses their
 * midpoints and the order is committed on release — the list is never re-rendered
 * mid-drag, because rebuilding it would throw away the node under the pointer.
 */
function useDrag(commit: (order: number[]) => void) {
  return (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    const row = (e.currentTarget as HTMLElement).closest<HTMLElement>('[data-row]')
    const box = row?.parentElement
    if (!row || !box) return
    row.dataset.dragging = ''
    const move = (ev: PointerEvent) => {
      const others = [...box.children].filter(
        (n): n is HTMLElement => n !== row && n instanceof HTMLElement && n.dataset.row !== undefined,
      )
      let target: HTMLElement | null = null
      for (const other of others) {
        const r = other.getBoundingClientRect()
        const pb = parseFloat(getComputedStyle(other).paddingBottom) || 0
        if (ev.clientY < r.top + (r.height - pb) / 2) { target = other; break }
      }
      /* never touch the DOM for a move that changes nothing — each reinsertion is a layout,
         and on the last slot this would otherwise fire on every pointermove */
      if (target) { if (row.nextSibling !== target) box.insertBefore(row, target) }
      else if (box.lastElementChild !== row) box.appendChild(row)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      delete row.dataset.dragging
      commit(
        [...box.children]
          .filter((n): n is HTMLElement => n instanceof HTMLElement && n.dataset.row !== undefined)
          .map((n) => Number(n.dataset.row)),
      )
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }
}

/* ------------------------------------------------------------------------- the stack */

export function PlanOutline() {
  const { t } = useT()
  const answers = useWorld((s) => s.world.brief.answers)
  const edits = useWorld((s) => s.world.planEdits.outline)
  const pages = buildOutline(answers, edits)
  const [home, ...rest] = pages
  const sections = home.sections ?? []
  const homeName = t(home.name)
  const names = sections.map((x) => t(x.name))
  const restNames = rest.map((p) => t(p.name))
  const [drawer, setDrawer] = useState(0) // bumps to force a fresh list after a drag

  const setSections = (next: string[]) => editPlanOutline({ sections: next })
  const setRest = (next: string[]) => editPlanOutline({ rest: next })
  const dragSections = useDrag((order) => { setSections(order.map((i) => names[i])); setDrawer((n) => n + 1) })
  const dragRest = useDrag((order) => { setRest(order.map((i) => restNames[i])); setDrawer((n) => n + 1) })

  return (
    <div data-plan-stack className="-mx-2 mt-3 rounded-[24px] bg-[var(--black-200)]">
      {/* 30107:53395 — the card the stack is drawn on */}
      <div className="w-full rounded-[24px] border border-[#353537] bg-[#1a1a1c]">
        {/* 30107:53401 — the page this pass builds: the one lit surface in the stack */}
        {/* ⚠️ PULLED A PIXEL OUT, so its stroke lands ON the card's instead of beside it
            (designer, 12.09.2026, on the first version: "у тебя тут двойные бордеры снова").
            Figma's stroke sits INSIDE the geometry, so on the board this ring and the card's
            are ONE line; a CSS border adds, and a plain child put them a pixel apart — a 2px
            rail down both sides and two arcs at every corner. The repo's rule names two
            cures, and the arcs here say which: there are rounded seams inside, so the CHILD
            is pulled (`-mx-px`, `-mt-px`), exactly as the generation card does it.
            The `px-px pb-px` is the board's own inset and comes back with the pull: the
            header still measures 796 at x=2, only now over one rail instead of two.
            `-mb-px` is the same rule at the seam BELOW it: on the board the block's bottom
            stroke IS the first waiting page's top edge (the row's frame starts at y=275,
            the last pixel of the block's own 275), so the row rides up onto it and the card
            comes out at the board's height instead of a pixel taller. */}
        <div className="-mx-px -mb-px -mt-px w-[calc(100%+2px)] rounded-[24px] border border-[#353537] bg-[var(--white-050)] px-px pb-px">
          {/* 30107:53402 — 48 tall, the name on its cap band, the pill at the far end */}
          <div className="flex h-12 items-center justify-between pl-[14px] pr-3">
            <span className="flex min-w-0 items-center gap-2">
              <IconPage size={20} className="flex-none text-[#ffffff7a]" />
              <Name
                value={homeName}
                path="outline:home"
                label={t({ en: 'The page this build makes', uk: 'Сторінка, яку збирає цей білд' })}
                className="[text-box-edge:cap_alphabetic] [text-box-trim:trim-both] text-[13px] font-medium leading-none text-white"
                onCommit={(v) => editPlanOutline({ home: v || undefined })}
              />
            </span>
            {rest.length > 0 && (
              /* 30121:60003 — `Neutral Alpha/1000` is #ffffff in the dark theme and the
                 label is `Text/default/on-default` = #09090b. The light export prints both
                 the other way round, which would draw a black pill nobody designed. */
              <span className="flex h-6 flex-none items-center rounded-[12px] bg-white px-2.5">
                <span data-plan-pill className="[text-box-edge:cap_alphabetic] [text-box-trim:trim-both] whitespace-nowrap text-[13px] font-semibold leading-none text-[var(--gray-950)]">
                  {t({ en: 'In this build', uk: 'У цьому білді' })}
                </span>
              </span>
            )}
          </div>

          {/* 30107:53410 — the sheet the sections are listed on */}
          <div className="rounded-b-[22px] rounded-t-[20px] border border-[var(--white-200)] bg-[var(--black-700)] pb-4 pr-4">
            <ol key={drawer} className="flex flex-col gap-2 pl-[13px] pt-4">
              {names.map((name, i) => (
                <li key={`${drawer}:${i}`} data-row={i} className="plan-row plan-row--step relative flex items-start">
                  {/* the elbow into this row's own icon centre: the first turns DOWN out of
                      the corner, every other arrives and turns IN */}
                  <span className="relative w-4 flex-none" aria-hidden>
                    <span
                      className={`absolute left-0 block h-2 w-4 border-l border-[var(--gray-750)] ${
                        i === 0 ? 'top-3 rounded-tl-[8px] border-t' : 'top-1 rounded-bl-[8px] border-b'
                      }`}
                    />
                  </span>
                  {/* the line onward is a child of the ROW: the gap between rows is this
                      row's own margin, and `self-stretch` would stop at the content box */}
                  {i !== names.length - 1 && (
                    <span aria-hidden className={`absolute bottom-[-8px] left-0 w-px bg-[var(--gray-750)] ${i === 0 ? 'top-5' : 'top-3'}`} />
                  )}
                  <span className="flex min-w-0 flex-1 items-start gap-3 pl-1">
                    <span className="flex-none" onPointerDown={dragSections}>
                      <Grip size={24}>
                        <IconStepQueued size={24} className="text-[#ffffff3d]" />
                      </Grip>
                    </span>
                    <span className="min-w-0 flex-1 pt-[3px]">
                      <Name
                        value={name}
                        path={`outline:sec:${i}`}
                        label={t({ en: 'Section of this page', uk: 'Розділ цієї сторінки' })}
                        className="block text-[14px] font-medium leading-[1.4] text-[#ffffff7a]"
                        onCommit={(v) => {
                          if (v) { if (v !== name) setSections(names.map((x, k) => (k === i ? v : x))) }
                          else if (names.length > 1) setSections(names.filter((_, k) => k !== i))
                        }}
                        onEnter={() => {
                          const next = [...names]; next.splice(i + 1, 0, '')
                          setSections(next); focusRow(`outline:sec:${i + 1}`)
                        }}
                        onEmpty={() => {
                          if (names.length === 1) return
                          setSections(names.filter((_, k) => k !== i))
                          focusRow(`outline:sec:${Math.max(0, i - 1)}`)
                        }}
                      />
                    </span>
                  </span>
                  {names.length > 1 && (
                    <Remove
                      label={t({ en: `Remove ${name}`, uk: `Прибрати ${name}` })}
                      onClick={() => setSections(names.filter((_, k) => k !== i))}
                    />
                  )}
                </li>
              ))}
            </ol>
            {/* 30107:53487 — the add row stands in the SAME two columns as a section: the
                board gives it its own (empty) elbow frame at x=0 w=16, so its disc lands at
                x=36 and its label at x=72, dead under the circles and their names. Read off
                the board's metadata, 12.09.2026 — the first version hung it off the sheet's
                own padding at x=20, a column of its own that nothing else stands in.
                And the air above it is 16, not 8: the board's Step 8 is a 32-tall frame
                whose icon sits at y=8 inside it, on top of the list's own 8px pitch. */}
            <button
              type="button"
              className="plan-add mt-4 flex items-start gap-3 pl-[33px]"
              onClick={() => { setSections([...names, '']); focusRow(`outline:sec:${names.length}`) }}
            >
              <IconPlusDisc size={24} className="flex-none text-white" />
              <span className="pt-[3px] text-[14px] font-medium leading-[1.4] text-white">
                {t({ en: 'Add a section', uk: 'Додати розділ' })}
              </span>
            </button>
          </div>
        </div>

        {/* the pages this pass does not build. ⚠️ Every one seals its bottom EXCEPT the
            last, which draws nothing — the card's own corner closes it. Give the last one
            a seam and it reads as a strip floating a pixel above the real corner. */}
        {restNames.map((name, i) => (
          <div
            key={`${drawer}:p:${i}`}
            data-row={i}
            className={`plan-row flex h-12 items-center gap-2 pl-3 pr-2 ${
              i === restNames.length - 1
                ? ''
                : '-mx-px w-[calc(100%+2px)] rounded-b-[16px] border-b border-l border-r border-[#353537]'
            }`}
          >
            <span className="flex-none" onPointerDown={dragRest}>
              <Grip size={20}>
                <IconPage size={20} className="text-[#ffffff3d]" />
              </Grip>
            </span>
            <Name
              value={name}
              path={`outline:page:${i}`}
              label={t({ en: 'A page for later', uk: 'Сторінка на потім' })}
              className="min-w-0 flex-1 text-[13px] font-medium leading-none text-[#ffffff7a]"
              onCommit={(v) => {
                if (v) { if (v !== name) setRest(restNames.map((x, k) => (k === i ? v : x))) }
                else setRest(restNames.filter((_, k) => k !== i))
              }}
              onEnter={() => {
                const next = [...restNames]; next.splice(i + 1, 0, '')
                setRest(next); focusRow(`outline:page:${i + 1}`)
              }}
              onEmpty={() => {
                setRest(restNames.filter((_, k) => k !== i))
                focusRow(i > 0 ? `outline:page:${i - 1}` : 'outline:home')
              }}
            />
            <Remove
              label={t({ en: `Remove ${name}`, uk: `Прибрати ${name}` })}
              onClick={() => setRest(restNames.filter((_, k) => k !== i))}
            />
          </div>
        ))}
      </div>

      {/* 30115:55249 — outside the card, inside the shell, closing its bottom corner */}
      <button
        type="button"
        className="plan-add flex h-12 w-full items-center gap-2 rounded-b-[24px] border-b border-[var(--white-100)] pl-3 pr-2"
        onClick={() => { setRest([...restNames, '']); focusRow(`outline:page:${restNames.length}`) }}
      >
        <IconPlusDisc size={24} className="flex-none text-white" />
        <span className="text-[13px] font-medium leading-none text-white">
          {t({ en: 'Add a page', uk: 'Додати сторінку' })}
        </span>
      </button>
    </div>
  )
}
