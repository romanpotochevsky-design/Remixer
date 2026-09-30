/**
 * THE EDIT BAR — the glass pill at the bottom centre of the preview with the Visual Editor's two
 * tools (board 31280:115372; designer 30.09.2026: «делаем Visual Editor мод так же как у
 * lovable.dev… инструменты для редактирования сайта (бесплатно, не через чат) находятся в такой
 * панели внизу превью… с нашим крутым apple liquid glass дизайном и анимациями чтобы у нас было
 * круче визуально чем у них»; the same day: «кнопка с иконкой "T" — она и включает режим Visual
 * Editor, которая позволяет текст менять и фото»; «[вторая] это инструмент select — нажать на
 * что-то и задать контекст чату»).
 *
 * WHAT THE BOARD DRAWS (Plugin API read): 78 × 42, fill rgba(31,31,31,.67), backdrop blur 32, a
 * rim that is a 24 % → 4 % → 12 % white diagonal — our glass rim — radius 16, shadow 0 8 32 at 33 %,
 * padding 4, two 32 icon buttons (container radius 8, glyph 24) with a 4 gap. Blur 32 is drawn
 * as 16 here: past ~16 px Chrome's backdrop blur gets WORSE, not softer (CLAUDE.md, measured
 * 26.08.2026) — raised to the designer. It stands 29 px above the canvas's bottom edge (board:
 * frame at y 1095 in a 1166 frame).
 *
 * WHAT LOVABLE DOES AND WHAT THIS DOES INSTEAD (audits/lovable-visual-edits-teardown.md):
 *  · their active tool is a blue disc that fades in — ours grows from the glyph (editToolOn);
 *  · once a change is pending their bar re-forms into `1 text change · Clear · Send`, stretching
 *    its width with the words squeezed inside — ours springs its box (`layout`) and the new
 *    segment fades in a beat later (editBarSegment), the house Panel Arrival at pill size;
 *  · their verbs are Send / Clear — ours are Save / Clear, with Undo and Redo between (the
 *    designer's order), because "Send" is the chat's word and this path never touches the chat.
 *
 * THE BAR EXISTS ONLY WHERE THERE IS A SITE TO EDIT — a built project whose canvas shows the live
 * page (a drawn demo site has nothing editable: absent, not dead, the rail's rule) — and steps
 * aside with the toolbar while the sites shelf is up. It is NOT gated on the chat working: a
 * customer may keep editing while Remixer types a reply.
 */
import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useT } from '@/i18n'
import { useWorld, currentSite } from '@/state/world'
import { useUI } from '@/state/ui'
import { EDIT_BAR_SPRING, editBarIn, editBarInFade, editBarSegment, editToolOn } from '@/ui/motion'
import { draftCount, isDirty, useEditor, type Tool } from './session'
import { GlyphEditText, GlyphRedo, GlyphSelect, GlyphUndo } from './icons'

const keepOnMainThread = () => {}

function ToolButton({ tool, label, children, hidden }: { tool: Tool; label: string; children: React.ReactNode; hidden?: boolean }) {
  const active = useEditor((s) => s.tool === tool)
  const dirty = useEditor(isDirty)
  const toggle = useEditor((s) => s.toggle)
  const reduce = useReducedMotion()
  if (hidden) return null
  return (
    <button
      type="button"
      className="ve-bar-btn press-bloom"
      aria-label={label}
      aria-pressed={active}
      data-ve-tool={tool}
      /* a dirty batch leaves only through Save or Clear (session.ts) — the active tool's own
         button does nothing then, and says so */
      title={active && dirty ? undefined : label}
      onClick={() => toggle(tool)}
    >
      <AnimatePresence initial={false}>
        {active && (
          <motion.span
            key="on"
            className="absolute inset-0 rounded-[8px] bg-[var(--action)]"
            variants={reduce ? editBarInFade : editToolOn}
            initial="initial"
            animate="animate"
            exit="exit"
            onUpdate={keepOnMainThread}
            aria-hidden
          />
        )}
      </AnimatePresence>
      {children}
    </button>
  )
}

export function EditBar() {
  const { t } = useT()
  const reduce = useReducedMotion()
  const project = useWorld((s) => s.world.project)
  const live = useWorld((s) => currentSite(s.world)?.thumb === 'live')
  const surface = useUI((s) => s.surface)
  const tool = useEditor((s) => s.tool)
  const dirty = useEditor(isDirty)
  const count = useEditor(draftCount)
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)
  const { undo, redo, clear, save, close, select, openPanel, setContext } = useEditor.getState()
  const show = project === 'built' && live && surface === 'preview'

  /*
   * THE KEYBOARD, while a tool is on. Escape climbs out one level at a time: a caret → commit and
   * leave the text (the host's own handler blurs; here only the fallback), an open Image panel →
   * close it, a selection → drop it, a clean mode → off. ⌘Z / ⇧⌘Z outside a text host walk the
   * session's history (inside one the browser's own undo of the typing stands, and the commit
   * retires it — EditableText.tsx). ⌘S saves a dirty batch: the word on the button is Save.
   */
  useEffect(() => {
    if (!tool) return
    const onKey = (e: KeyboardEvent) => {
      const s = useEditor.getState()
      const el = document.activeElement as HTMLElement | null
      const typing = !!el && (el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')
      const mod = e.metaKey || e.ctrlKey
      if (e.key === 'Escape') {
        if (typing && el?.dataset.edit) { el.blur(); e.preventDefault(); return }
        if (typing) return
        if (s.panel) { openPanel(null); e.preventDefault(); return }
        if (s.tool === 'select' && s.context) { setContext(null); e.preventDefault(); return }
        if (s.selected) { select(null); e.preventDefault(); return }
        if (!isDirty(s)) { close(); e.preventDefault() }
        return
      }
      if (mod && (e.key === 'z' || e.key === 'Z') && !typing) {
        e.preventDefault()
        if (e.shiftKey) redo(); else undo()
        return
      }
      if (mod && (e.key === 'y' || e.key === 'Y') && !typing) { e.preventDefault(); redo(); return }
      if (mod && (e.key === 's' || e.key === 'S')) { e.preventDefault(); if (isDirty(s)) save() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [tool, undo, redo, save, close, select, openPanel, setContext])

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[29px] z-30 flex justify-center" data-ve-bar-host>
      <AnimatePresence initial={false}>
        {show && (
          <motion.div
            key="bar"
            data-ve-bar
            data-ve-dirty={dirty ? '' : undefined}
            layout
            className="liquid-glass pointer-events-auto relative flex items-center gap-1 rounded-[16px] p-1 shadow-[0_8px_32px_rgba(0,0,0,0.33)]"
            variants={reduce ? editBarInFade : editBarIn}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={EDIT_BAR_SPRING}
            onUpdate={keepOnMainThread}
          >
            {!reduce && <span className="glass-glint" aria-hidden />}
            <ToolButton tool="edit" label={t({ en: 'Visual Editor — edit text and photos yourself, free', uk: 'Візуальний редактор — правте текст і фото самі, безкоштовно' })}>
              <GlyphEditText size={24} />
            </ToolButton>
            {/* once a batch is pending only its own tool stays: Lovable hides the others too */}
            <ToolButton tool="select" label={t({ en: 'Select an element to ask Remixer about', uk: 'Виділити елемент, щоб спитати Remixer про нього' })} hidden={dirty}>
              <GlyphSelect size={24} />
            </ToolButton>
            <AnimatePresence initial={false}>
              {dirty && (
                <motion.div
                  key="batch"
                  className="flex items-center gap-1"
                  variants={editBarSegment}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onUpdate={keepOnMainThread}
                  data-ve-batch
                >
                  <span className="h-8 w-px bg-[var(--glass-divider)]" aria-hidden />
                  <span className="whitespace-nowrap pl-2 pr-1 text-[13px] font-medium tabular-nums text-white" data-ve-count>
                    {count === 1 ? t({ en: '1 change', uk: '1 зміна' }) : t({ en: `${count} changes`, uk: `${count} змін` })}
                  </span>
                  <button type="button" className="ve-bar-btn press-bloom" aria-label={t({ en: 'Undo', uk: 'Скасувати' })} disabled={!canUndo} onClick={undo} data-ve-undo>
                    <GlyphUndo size={22} />
                  </button>
                  <button type="button" className="ve-bar-btn press-bloom" aria-label={t({ en: 'Redo', uk: 'Повернути' })} disabled={!canRedo} onClick={redo} data-ve-redo>
                    <GlyphRedo size={22} />
                  </button>
                  <span className="h-8 w-px bg-[var(--glass-divider)]" aria-hidden />
                  <button
                    type="button"
                    className="press-bloom h-8 whitespace-nowrap rounded-[8px] px-3 text-[13px] font-semibold text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white"
                    onClick={clear}
                    data-ve-clear
                  >
                    {t({ en: 'Clear', uk: 'Очистити' })}
                  </button>
                  <button
                    type="button"
                    className="press-bloom h-8 whitespace-nowrap rounded-[8px] bg-[var(--action)] px-3 text-[13px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
                    onClick={save}
                    data-ve-save
                  >
                    {t({ en: 'Save', uk: 'Зберегти' })}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
