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
 * THE BAR HAS TWO HOMES (designer 30.09.2026, from a Lovable recording — scratchpad/lov-dock/):
 * hovering the pill grows a glass segment with «›» («прибить этот бар в панель справа»); a click
 * FLIES the glass into the right rail's slot above the support button («вот сюда оно должно
 * перелетать и прикрепляться справа»), where it is a 48 rail button with the T glyph; hovering
 * that button pops the tools out to its left, and «‹» flies the glass back to the canvas's foot.
 * Lovable fades its bar and grows a tab at the edge (two pictures, ~100 ms each); ours is ONE
 * object in both directions. The home is `ui.editBarDocked` (session); the flight is a fixed
 * overlay whose box springs between the two rects (`EDIT_DOCK_FLIGHT`) — the one measured
 * exception to transform/opacity this component takes, on the Reveal's terms. The rail renders
 * only an empty slot (`[data-rail-dock]`); the docked button is portalled there from here, so
 * the bar's logic has one file.
 *
 * THE BAR EXISTS ONLY WHERE THERE IS A SITE TO EDIT — a built project whose canvas shows the live
 * page (a drawn demo site has nothing editable: absent, not dead, the rail's rule) — and steps
 * aside with the toolbar while the sites shelf is up. It is NOT gated on the chat working: a
 * customer may keep editing while Remixer types a reply.
 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useT } from '@/i18n'
import { useWorld, currentSite } from '@/state/world'
import { useUI } from '@/state/ui'
import { EDIT_BAR_SPRING, EDIT_DOCK_FLIGHT, editBarIn, editBarInFade, editBarPop, editBarPopFade, editBarSegment, editToolOn } from '@/ui/motion'
import { draftCount, hasHistory, isDirty, useEditor, type Tool } from './session'
import { GlyphDockRight, GlyphEditText, GlyphRedo, GlyphSelect, GlyphUndo, GlyphUndock } from './icons'

type Rect = { x: number; y: number; width: number; height: number }
type Flight = { dir: 'dock' | 'undock'; from: Rect; to?: Rect }
const rectOf = (el: Element): Rect => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } }
/** the pop-out closes this long after the pointer leaves the rail button and its pop-out — the 8 px gap between them is crossed, not left */
const POP_LINGER_MS = 160

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
            className="absolute inset-0 rounded-[12px] bg-[var(--action)]"
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
  const docked = useUI((s) => s.editBarDocked)
  const setDocked = useUI((s) => s.setEditBarDocked)
  const tool = useEditor((s) => s.tool)
  const dirty = useEditor(isDirty)
  const history = useEditor(hasHistory)
  const count = useEditor(draftCount)
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)
  const { undo, redo, clear, save, close, select, openPanel, setContext } = useEditor.getState()
  const show = project === 'built' && live && surface === 'preview'

  /* the two homes and the flight between them */
  const barRef = useRef<HTMLDivElement>(null)
  const dockRef = useRef<HTMLButtonElement>(null)
  const [flight, setFlight] = useState<Flight | null>(null)
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const [hover, setHover] = useState(false)
  const [popped, setPopped] = useState(false)
  const linger = useRef<number | null>(null)

  /* the rail's slot exists only while docked (App.tsx); find it after that commit */
  useLayoutEffect(() => {
    setSlot(docked && show ? (document.querySelector('[data-rail-dock]') as HTMLElement | null) : null)
  }, [docked, show])

  /* the flight knows where it is going one commit after it started: the slot (docking) or the
     pill, mounted hidden at its resting place (undocking) — both are measured, never computed */
  useLayoutEffect(() => {
    if (!flight || flight.to) return
    const target = flight.dir === 'dock' ? slot : barRef.current
    if (target) setFlight({ ...flight, to: rectOf(target) })
  }, [flight, slot])

  useEffect(() => () => { if (linger.current) window.clearTimeout(linger.current) }, [])
  /* leaving the preview (sites shelf, a window) folds the pop-out; the docked button hides with the bar */
  useEffect(() => { if (!show) setPopped(false) }, [show])

  const dock = () => {
    const from = barRef.current ? rectOf(barRef.current) : null
    setHover(false)
    if (from && !reduce) setFlight({ dir: 'dock', from })
    setDocked(true)
  }
  const undock = () => {
    const from = dockRef.current ? rectOf(dockRef.current) : null
    setPopped(false)
    if (from && !reduce) setFlight({ dir: 'undock', from })
    setDocked(false)
  }
  const popIn = () => { if (linger.current) { window.clearTimeout(linger.current); linger.current = null } setPopped(true) }
  const popOut = () => { if (linger.current) window.clearTimeout(linger.current); linger.current = window.setTimeout(() => { linger.current = null; setPopped(false) }, POP_LINGER_MS) }

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

  /* the tools — one set, rendered in whichever home is up */
  const tools = (
    <>
      <ToolButton tool="edit" label={t({ en: 'Visual Editor — edit text and photos yourself, free', uk: 'Візуальний редактор — правте текст і фото самі, безкоштовно' })}>
        <GlyphEditText size={24} />
      </ToolButton>
      {/* once a batch is pending only its own tool stays: Lovable hides the others too */}
      <ToolButton tool="select" label={t({ en: 'Select an element to ask Remixer about', uk: 'Виділити елемент, щоб спитати Remixer про нього' })} hidden={history}>
        <GlyphSelect size={24} />
      </ToolButton>
      <AnimatePresence initial={false}>
        {history && (
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
              {count === 0 ? t({ en: 'No changes', uk: 'Без змін' }) : count === 1 ? t({ en: '1 change', uk: '1 зміна' }) : t({ en: `${count} changes`, uk: `${count} змін` })}
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
              className="press-bloom h-8 whitespace-nowrap rounded-[8px] bg-[var(--action)] px-3 text-[13px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)] disabled:cursor-default disabled:opacity-40"
              onClick={save}
              disabled={!dirty}
              data-ve-save
            >
              {t({ en: 'Save', uk: 'Зберегти' })}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )

  /* the floating pill stays mounted (hidden) while its glass flies to the rail, so its exit fade
     plays on nothing; undocking mounts it hidden first so the flight can measure where to land */
  const floating = show && (!docked || flight?.dir === 'dock')
  const hidden: CSSProperties | undefined = flight ? { visibility: 'hidden' } : undefined
  const dockBtnLabel = docked
    ? t({ en: 'Visual Editor tools', uk: 'Інструменти візуального редактора' })
    : t({ en: 'Pin the tools to the rail', uk: 'Закріпити інструменти на панелі праворуч' })

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-[29px] z-30 flex justify-center" data-ve-bar-host>
        <AnimatePresence initial={false}>
          {floating && (
            <motion.div
              key="bar"
              ref={barRef}
              data-ve-bar
              data-ve-dirty={dirty ? '' : undefined}
              layout
              className="liquid-glass pointer-events-auto relative flex items-center gap-1 rounded-[16px] p-1 shadow-[0_8px_32px_rgba(0,0,0,0.33)]"
              variants={reduce ? editBarInFade : editBarIn}
              initial={flight?.dir === 'undock' ? false : 'initial'}
              animate="animate"
              exit="exit"
              transition={EDIT_BAR_SPRING}
              onUpdate={keepOnMainThread}
              onPointerEnter={() => setHover(true)}
              onPointerLeave={() => setHover(false)}
              onFocus={() => setHover(true)}
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHover(false) }}
              style={hidden}
            >
              {!reduce && <span className="glass-glint" aria-hidden />}
              {tools}
              {/* the dock handle grows out of the pill on hover (the box springs, the segment fades a
                  beat later — the batch segment's own choreography); a pending batch keeps the pill
                  where it is, so the handle waits until the batch is saved or cleared */}
              <AnimatePresence initial={false}>
                {hover && !history && (
                  <motion.div key="dock" className="flex items-center gap-1" variants={editBarSegment} initial="initial" animate="animate" exit="exit" onUpdate={keepOnMainThread} data-ve-dock-segment>
                    <span className="h-8 w-px bg-[var(--glass-divider)]" aria-hidden />
                    <button type="button" className="ve-bar-btn press-bloom" aria-label={dockBtnLabel} title={dockBtnLabel} onClick={dock} data-ve-dock-to-rail>
                      <GlyphDockRight size={22} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* THE DOCKED BUTTON in the rail's slot: a 48 rail tile with the T glyph, lit in the action
          blue while a tool is on (the rail's own «selected» grammar); its tools pop out to the left
          on hover, on focus, or on a click (touch), and stay out while a batch is pending */}
      {slot && createPortal(
        <div
          className="relative h-12 w-12"
          data-ve-dock-host
          style={flight?.dir === 'dock' ? hidden : undefined}
          onPointerEnter={popIn}
          onPointerLeave={popOut}
          onFocus={popIn}
          onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) popOut() }}
        >
          <button
            ref={dockRef}
            type="button"
            className={`press-bloom grid h-12 w-12 place-items-center rounded-[16px] transition-colors duration-[var(--dur-fast)] ease-std${tool ? '' : ' text-white hover:bg-[var(--white-100)]'}`}
            style={tool ? { background: 'rgba(21,135,255,0.12)', color: 'var(--action)' } : undefined}
            aria-label={dockBtnLabel}
            title={dockBtnLabel}
            aria-pressed={!!tool}
            aria-expanded={popped || history}
            onClick={() => setPopped((v) => !v)}
            data-ve-dock
          >
            <GlyphEditText size={24} />
          </button>
          <AnimatePresence initial={false}>
            {(popped || history) && !flight && (
              <div className="absolute right-[56px] top-1/2 z-50 -translate-y-1/2">
                <motion.div
                  key="pop"
                  data-ve-bar
                  data-ve-popped
                  data-ve-dirty={dirty ? '' : undefined}
                  layout
                  className="liquid-glass pointer-events-auto relative flex items-center gap-1 rounded-[16px] p-1 shadow-[0_8px_32px_rgba(0,0,0,0.33)]"
                  style={{ transformOrigin: 'right center' }}
                  variants={reduce ? editBarPopFade : editBarPop}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={EDIT_BAR_SPRING}
                  onUpdate={keepOnMainThread}
                >
                  {!reduce && <span className="glass-glint" aria-hidden />}
                  {tools}
                  <span className="h-8 w-px bg-[var(--glass-divider)]" aria-hidden />
                  <button type="button" className="ve-bar-btn press-bloom" aria-label={t({ en: 'Put the tools back under the preview', uk: 'Повернути інструменти під превʼю' })} title={t({ en: 'Put the tools back under the preview', uk: 'Повернути інструменти під превʼю' })} onClick={undock} data-ve-undock>
                    <GlyphUndock size={22} />
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>,
        slot,
      )}

      {/* THE FLIGHT — the glass itself, between the two homes, above both the canvas and the rail */}
      {flight?.to && createPortal(
        <motion.div
          data-ve-flight={flight.dir}
          className="liquid-glass pointer-events-none fixed z-50 grid place-items-center rounded-[16px] text-white shadow-[0_8px_32px_rgba(0,0,0,0.33)]"
          initial={{ left: flight.from.x, top: flight.from.y, width: flight.from.width, height: flight.from.height }}
          animate={{ left: flight.to.x, top: flight.to.y, width: flight.to.width, height: flight.to.height }}
          transition={EDIT_DOCK_FLIGHT}
          onAnimationComplete={() => setFlight(null)}
          aria-hidden
        >
          <GlyphEditText size={24} />
        </motion.div>,
        document.body,
      )}
    </>
  )
}
