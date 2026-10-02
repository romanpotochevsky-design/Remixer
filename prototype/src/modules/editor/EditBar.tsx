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
 *    its width with the words squeezed inside — ours stretches the glass over tools that stay put (`GlassBar`) and the new
 *    segment fades in a beat later (editBarSegment), the house Panel Arrival at pill size;
 *  · their verbs are Send / Clear — ours are Save / Clear, with Undo and Redo between (the
 *    designer's order), because "Send" is the chat's word and this path never touches the chat;
 *  · a Select pick re-forms the bar exactly as theirs does (01.10.2026, from a recording: «нам
 *    нужно сделать точно так же»): the other tool steps aside, «1 selection» and a tonal Clear —
 *    which drops the pick and keeps the tool on — come in beside the select disc.
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
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useT } from '@/i18n'
import { useWorld, currentSite } from '@/state/world'
import { useUI } from '@/state/ui'
import { EDIT_BAR_SPRING, EDIT_BAR_STRETCH, EDIT_DOCK_DISSOLVE, EDIT_DOCK_FLIGHT, EXIT, editBarAction, editBarCount, editBarIn, editBarInFade, editBarPop, editBarPopFade, editBarSegment, editBarTail, editToolAside, editToolDark, editToolOn } from '@/ui/motion'
import { draftCount, isDirty, useEditor, type Tool } from './session'
import { GlyphDockRight, GlyphEditText, GlyphSelect, GlyphUndock } from './icons'

type Rect = { x: number; y: number; width: number; height: number }
type Flight = { dir: 'dock' | 'undock'; from: Rect; to?: Rect; landed?: boolean }
const rectOf = (el: Element): Rect => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } }
/** the pop-out closes this long after the pointer leaves the rail button and its pop-out — the 8 px gap between them is crossed, not left */
const POP_LINGER_MS = 160

const keepOnMainThread = () => {}

function ToolButton({ tool, label, children, hidden, ghost, dark }: { tool: Tool; label: string; children: React.ReactNode; hidden?: boolean; ghost?: boolean; dark?: boolean }) {
  const active = useEditor((s) => s.tool === tool)
  const dirty = useEditor(isDirty)
  const toggle = useEditor((s) => s.toggle)
  const reduce = useReducedMotion()
  if (hidden) return null
  return (
    <motion.button
      type="button"
      /* the bar re-forms around the tool (the Save state, board 31562:5194): its seat moves, and the
         button RIDES to it on the glass's spring — position only, never size */
      layout="position"
      transition={reduce ? { duration: 0 } : EDIT_BAR_STRETCH}
      /* a GHOST keeps its seat in the layout (so nothing beside it moves) and fades out of reach —
         the glass cuts in over its slot (GlassBar `cut`) */
      className={`ve-bar-btn press-bloom${ghost ? ' pointer-events-none opacity-0' : ''}`}
      tabIndex={ghost ? -1 : undefined}
      aria-hidden={ghost || undefined}
      data-ve-ghost={ghost ? '' : undefined}
      aria-label={label}
      aria-pressed={active}
      data-ve-tool={tool}
      /* a dirty batch leaves only through Save or Clear (session.ts) — the active tool's own
         button does nothing then, and says so */
      title={active && dirty ? undefined : label}
      onClick={() => toggle(tool)}
    >
      <AnimatePresence initial={false}>
        {active && !dark && (
          <motion.span
            key="on"
            className="absolute inset-0 rounded-[12px] bg-[var(--action)]"
            data-ve-tool-on
            variants={reduce ? editBarInFade : editToolOn}
            initial="initial"
            animate="animate"
            exit="exit"
            onUpdate={keepOnMainThread}
            aria-hidden
          />
        )}
        {/* THE DARK DISC of the Save state (board 31562:5199: Black/600 → Black/900 under a 12 % rim,
            the glyph white): beside a blue Save the blue disc read as a second CTA (designer
            02.10.2026: «синяя иконка инструмента конфликтует с синей кнопкой CTA»); it cross-fades
            in under the glyph while the blue leaves — the glyph itself never changes */}
        {dark && (
          <motion.span
            key="dark"
            className="absolute inset-0 rounded-[12px] bg-gradient-to-b from-[#09090b8f] to-[#09090bcc] shadow-[inset_0_0_0_1px_#ffffff1f]"
            variants={reduce ? editBarInFade : editToolDark}
            initial="initial"
            animate="animate"
            exit="exit"
            onUpdate={keepOnMainThread}
            aria-hidden
            data-ve-tool-dark
          />
        )}
      </AnimatePresence>
      {children}
    </motion.button>
  )
}

/**
 * THE GLASS THAT STRETCHES — the pill's box is animated as a real box, never as a scale.
 *
 * The first cut grew the pill with motion's `layout`: the box sprang, and the buttons inside
 * were SCALED along with it for the length of the spring (designer 30.09.2026, by recording:
 * «зачем оно деформирует кнопки при анимации???»). And the pill was centred, so 41 px of growth
 * on the right pushed every tool 20 px to the left — under a pointer that was heading for one of
 * them («кнопки начинают от тебя убегать левее»). Both are the same mistake: the CONTENT moved.
 *
 * Here the content never moves. The tools are laid out once, anchored to one side (`side`), and
 * only the glass around them changes: an outer sizer holds the resting width (so the centred pill
 * sits where it did), and the glass pill itself, absolutely anchored to that side, springs its
 * WIDTH over the resting box towards the far side — clipping whatever it has not yet reached. The
 * spring overshoots (`EDIT_BAR_STRETCH`): the edge stretches past its mark and settles back, which
 * is the liquid the designer asked for. Widths are MEASURED from the content, never typed.
 *
 * A width animation on one small fixed-size element (the Reveal's measured exception); nothing
 * outside the pill lays out again.
 */
/* THE SWELL — on hover the glass grows 2 px outward on every side while the tools stay put (designer
   01.10.2026: «подкладка под кнопками становится больше, увеличиваясь во все стороны… как жидкий объект»;
   then, on the built 4 px: «на ховере должно быть 135 x 50… по 2 px»); same spring as the stretch, so the two
   edges breathe together. Only the glass moves. Hover glass: 135 × 50, radius 16 → 18. */
const GLASS_SWELL = 2
/* board 31442:44737 (01.10.2026, designer: «размер самих кнопок… с 32 на 36»): frame 86 × 46 — 1 px rim inside +
   4 padding around 36 tools (r12, glyph 24 in a 6 pad) with a 4 gap */
const BAR_PAD = 5
const BAR_TOOL = 36
const BAR_H = BAR_TOOL + 2 * BAR_PAD
/* THE SAVE STATE — board 31562:5194 (02.10.2026): frame 360 × 58 — rim 1 inside, pl 10 / pr 8 / py 8 around a
   40 row: the tool (36, on a dark disc) · 16 · the count in a 120 box (15 Medium) · 16 · Clear 73 × 40 · 8 ·
   Save 71 × 40. Deliberately BIGGER than the pill (designer: «он становится ещё больше… чтобы пользователю дать
   явно понять: чтобы изменения применились, нажми тут Save»). */
const BATCH_H = 58
function GlassBar({ side, reveal, swell = false, cut = 0, tall = false, grow = 'side', tail, tailKey, pillRef, pillProps, children }: {
  side: 'left' | 'right'
  reveal: boolean
  swell?: boolean
  /** How far the glass's anchored edge cuts IN over the tools — the slot of a ghosted tool (the
   *  Select pick: the glass leaves the Edit slot and hugs the disc, which does not move). */
  cut?: number
  /** The Save state: the row is 58 tall and padded as the board draws it (BATCH_H). */
  tall?: boolean
  /** How the glass follows a change of the CONTENT's own width: `side` — anchored to `side`, the
   *  far edge moves (the rail's pop-out hangs off the rail); `center` — both edges move, the glass
   *  grows out of its own middle (the floating pill is centred under the preview, and a re-form
   *  that re-centres it must not jump the glass to the new left edge first). A tail (the dock
   *  handle, the pick) is ALWAYS anchored to `side`: the tools stay, the glass reaches out. */
  grow?: 'side' | 'center'
  tail?: React.ReactNode
  /** Which tail is showing: a new key is measured again (the dock handle and the pick segment are
   *  two widths). */
  tailKey?: string
  pillRef?: React.Ref<HTMLDivElement>
  pillProps?: Record<string, unknown>
  children: React.ReactNode
}) {
  const reduce = useReducedMotion()
  const root = useRef<HTMLDivElement | null>(null)
  const tailRef = useRef<HTMLDivElement>(null)
  /* two widths on two springs: the content's own box (`baseV`, grows from the middle or the side)
     and what the glass reaches out over past it (`tailV`, always from the side) */
  const baseV = useMotionValue(0)
  const tailV = useMotionValue(0)
  const hV = useMotionValue(tall ? BATCH_H : BAR_H)
  const swellV = useMotionValue(0)
  const cutV = useMotionValue(cut)
  const [w, setW] = useState<{ base: number; tail: number } | null>(null)
  const baseW = w?.base ?? 0
  /* ⚠️ the centring shift is read INLINE where it is used, not through a nested transform: a
     computed value that reads another computed value saw it one frame stale, and the glass's left
     edge lagged its width by a frame — 17 px off-centre at the spring's fastest (measured) */
  const shiftOf = () => (grow === 'center' && w ? (baseW - baseV.get()) / 2 : 0)
  const glassOuterW = useTransform(() => baseV.get() + tailV.get() + 2 * swellV.get() - cutV.get())
  const glassInset = useTransform(swellV, (v) => -v)
  const glassEdge = useTransform(() => cutV.get() - swellV.get() + shiftOf())
  const glassH = useTransform(() => hV.get() + 2 * swellV.get())
  const glassR = useTransform(swellV, (v) => 16 + v)
  /* the box is the CONTENT's own, in flow — measured, never typed; the glass layer behind it takes
     that width at once (jump), and springs to it or past it afterwards */
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const measure = () => {
      const base = el.offsetWidth
      const t = tailRef.current ? tailRef.current.offsetWidth : 0
      setW((prev) => (prev && prev.base === base && prev.tail === t ? prev : { base, tail: t }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    if (tailRef.current) ro.observe(tailRef.current)
    return () => ro.disconnect()
  }, [tailKey, tall])
  const first = useRef(true)
  useEffect(() => {
    if (!w) return
    if (first.current) { first.current = false; baseV.jump(w.base); return }
    if (reduce) { baseV.jump(w.base); return }
    const ctrl = animate(baseV, w.base, EDIT_BAR_STRETCH)
    return () => ctrl.stop()
  }, [w, reduce, baseV])
  useEffect(() => {
    if (!w) return
    const target = reveal ? w.tail - BAR_PAD : 0
    if (reduce || tailV.get() === target) { tailV.jump(target); return }
    const ctrl = animate(tailV, target, EDIT_BAR_STRETCH)
    return () => ctrl.stop()
  }, [w, reveal, reduce, tailV])
  useEffect(() => {
    const target = tall ? BATCH_H : BAR_H
    if (reduce) { hV.jump(target); return }
    const ctrl = animate(hV, target, EDIT_BAR_STRETCH)
    return () => ctrl.stop()
  }, [tall, reduce, hV])
  useEffect(() => {
    const target = swell ? GLASS_SWELL : 0
    if (reduce) { swellV.jump(target); return }
    const ctrl = animate(swellV, target, EDIT_BAR_STRETCH)
    return () => ctrl.stop()
  }, [swell, reduce, swellV])
  useEffect(() => {
    if (reduce) { cutV.jump(cut); return }
    const ctrl = animate(cutV, cut, EDIT_BAR_STRETCH)
    return () => ctrl.stop()
  }, [cut, reduce, cutV])
  /* the handle sits at the content's edge in SCREEN space: the glass moved out by the swell (and in
     by the cut, and by a centred growth), so the seat moves back by all three */
  const tailSeat = useTransform(() => (w ? w.base - BAR_PAD + swellV.get() - cutV.get() - shiftOf() : 0))
  return (
    <div
      ref={(el) => { root.current = el; if (typeof pillRef === 'function') pillRef(el); else if (pillRef) (pillRef as React.MutableRefObject<HTMLDivElement | null>).current = el }}
      {...pillProps}
      className="pointer-events-auto relative"
      data-ve-stretched={reveal ? '' : undefined}
      data-ve-swollen={swell ? '' : undefined}
      data-ve-tall={tall ? '' : undefined}
    >
      {/* THE GLASS — a layer behind the tools that is free to be wider than they are */}
      <motion.div
        className="liquid-glass liquid-glass--editbar absolute z-0 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.33)]"
        style={{ width: w ? glassOuterW : '100%', top: glassInset, [side]: glassEdge, height: glassH, borderRadius: glassR }}
        data-ve-glass
        aria-hidden={!tail}
      >
        {/* the rim catches light when the bar forms — and again when it re-forms into its Save
            state (a new key replays the sweep) */}
        {!reduce && <span key={tall ? 'tall' : 'base'} className="glass-glint" aria-hidden />}
        {/* what the stretch uncovers sits inside the glass, past the content's edge, clipped until reached */}
        {tail && (
          <motion.div
            ref={tailRef}
            className="absolute flex items-center gap-1 pl-1 pr-[5px]"
            style={{ top: swellV, height: hV, ...(side === 'left' ? { left: tailSeat } : { right: tailSeat }) }}
            variants={editBarTail}
            initial="initial"
            animate={reveal ? 'animate' : 'initial'}
            onUpdate={keepOnMainThread}
            aria-hidden={!reveal}
            data-ve-tail={tailKey}
            data-ve-dock-segment={reveal && tailKey !== 'pick' ? '' : undefined}
            data-ve-picked={reveal && tailKey === 'pick' ? '' : undefined}
          >
            {tail}
          </motion.div>
        )}
      </motion.div>
      {/* THE TOOLS — in flow, on top, never scaled; the row's height is the glass's (it rides the
          same spring), its padding the board's for each state */}
      <motion.div className={`relative z-[1] flex items-center ${tall ? 'gap-4 pl-[11px] pr-[9px]' : 'gap-1 px-[5px]'}`} style={{ height: hV }}>{children}</motion.div>
    </div>
  )
}

/**
 * THE FLIGHT — one glass box between the two homes, carrying THE SAME CONTENT AS THE HOMES.
 *
 * The first cut flew a box with a single centred «T». It landed on the pill's spot ~300 ms before
 * the spring settled, sat there as a lone glyph, and then the real pill snapped in under it — «T»
 * jumping left, Select appearing in one frame (designer 30.09.2026, by recording: «1 или 2 кадра
 * разворачивает кнопки»). The swap was visible because the clone and the home were different
 * pictures. Now the clone IS the pill's picture: the two tools laid out as the pill lays them out
 * (5 + 32 + 4 + 32 + 5 — board 31442:44737), Select fading with the width it needs, «T» sliding the 4 px between its
 * seat in the pill (left 5) and its seat in the 48 rail tile (left 8). At either end the clone's
 * pixels equal the home's, so the hand-over is invisible whenever it happens.
 */
/* the drop: +30 % along the path, −12 % across it, peaking EARLY (p ≈ .4 — a drop stretches as it leaves,
   not as it lands) — raised from +12 / −5 on the designer's fifth recording («резче и быстрее… как капля воды») */
const FLIGHT_STRETCH = 0.3
const FLIGHT_THIN = 0.12
const FLIGHT_BELL_SKEW = 0.72
function Flight({ flight, onLand, onDone }: { flight: Flight & { to: Rect }; onLand: () => void; onDone: () => void }) {
  const p = useMotionValue(0)
  /* THE DISSOLVE: into the rail the glass lands on a tile that has none — so the clone stays one beat after
     touchdown, the home is revealed under it, and the clone fades (glyph over identical glyph — nothing moves) */
  const fade = useMotionValue(1)
  const lerp = (a: number, b: number) => (v: number) => a + (b - a) * v
  const { from, to } = flight
  /* THE DROP: mid-flight the glass stretches along its path and thins across it (up to +30 % / −12 %,
     a sine bell skewed early on the progress — zero at both ends, so the box is exactly the home's at
     either landing), the way liquid elongates while it moves and gathers itself when it stops. The glyphs
     are placed from the box's edge and do not scale — only the glass stretches. */
  const bell = (v: number) => Math.sin(Math.PI * Math.pow(Math.max(0, Math.min(1, v)), FLIGHT_BELL_SKEW))
  const width = useTransform(p, (v) => lerp(from.width, to.width)(v) * (1 + FLIGHT_STRETCH * bell(v)))
  const height = useTransform(p, (v) => lerp(from.height, to.height)(v) * (1 - FLIGHT_THIN * bell(v)))
  const left = useTransform(p, (v) => lerp(from.x, to.x)(v) - (lerp(from.width, to.width)(v) * FLIGHT_STRETCH * bell(v)) / 2)
  const top = useTransform(p, (v) => lerp(from.y, to.y)(v) + (lerp(from.height, to.height)(v) * FLIGHT_THIN * bell(v)) / 2)
  /* the tools follow the WIDTH, not the clock: Select is opaque once the box has room for it,
     the handle once it has room for that too; «T» sits at 4 in a pill and centred (8) in a 48 tile */
  const selO = useTransform(width, (w) => Math.max(0, Math.min(1, (w - (BAR_PAD + BAR_TOOL + 4 + 12)) / 20)))
  const tailO = useTransform(width, (w) => Math.max(0, Math.min(1, (w - (BAR_PAD + 2 * BAR_TOOL + 4 + 20)) / 20)))
  /* «T» sits at 5 in the pill (BAR_PAD) and centred (8) in the 48 tile */
  /* seat in the 48 tile: (48 − 36) / 2 = 6 */
  const tileSeat = (48 - BAR_TOOL) / 2
  const tLeft = useTransform(width, (w) => Math.max(BAR_PAD, Math.min(tileSeat, tileSeat - (w - 48) / 38)))
  const tTop = useTransform(height, (h) => (h - BAR_TOOL) / 2)
  useEffect(() => {
    let fading: ReturnType<typeof animate> | null = null
    const ctrl = animate(p, 1, {
      ...EDIT_DOCK_FLIGHT,
      onComplete: () => {
        if (flight.dir !== 'dock') { onDone(); return }
        onLand()
        fading = animate(fade, 0, { ...EDIT_DOCK_DISSOLVE, onComplete: onDone })
      },
    })
    return () => { ctrl.stop(); fading?.stop() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const btn = 'absolute grid h-9 w-9 place-items-center rounded-[12px] text-white'
  return (
    <motion.div
      data-ve-flight={flight.dir}
      className="liquid-glass liquid-glass--editbar pointer-events-none fixed z-50 overflow-hidden rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.33)]"
      style={{ left, top, width, height, opacity: fade }}
      aria-hidden
    >
      <motion.span className={btn} style={{ left: tLeft, top: tTop }}><GlyphEditText size={24} /></motion.span>
      <motion.span className={btn} style={{ left: BAR_PAD + BAR_TOOL + 4, top: tTop, opacity: selO }}><GlyphSelect size={24} /></motion.span>
      <motion.span className="absolute flex items-center gap-1" style={{ left: BAR_PAD + 2 * (BAR_TOOL + 4), top: tTop, opacity: tailO }}>
        <span className="h-9 w-px bg-[var(--glass-divider)]" />
        <span className="grid h-9 w-9 place-items-center rounded-[12px] text-white"><GlyphDockRight size={22} /></span>
      </motion.span>
    </motion.div>
  )
}

export function EditBar() {
  const { t } = useT()
  const reduce = useReducedMotion()
  const project = useWorld((s) => s.world.project)
  const busy = useWorld((s) => s.world.chat === 'working')
  const live = useWorld((s) => currentSite(s.world)?.thumb === 'live')
  const surface = useUI((s) => s.surface)
  const docked = useUI((s) => s.editBarDocked)
  const setDocked = useUI((s) => s.setEditBarDocked)
  const tool = useEditor((s) => s.tool)
  const dirty = useEditor(isDirty)
  /* the bar is in its Save state while a batch is pending. Undo / Redo were here (designer
     30.09.2026) and are hidden since 02.10.2026 — the developers asked («пока что у нас не будет
     этих функций, будет только то что в макете»); the session's history stands behind them
     (session.ts), unused */
  const history = dirty
  const count = useEditor(draftCount)
  const textCount = useEditor((s) => Object.keys(s.draft.text).length)
  /* the Select tool holds an element of the page — Lovable's bar re-forms into «1 selection · Clear» */
  const picking = useEditor((s) => s.tool === 'select' && s.contextEl !== null)
  /* THE PICK, TWO WAYS — one per home.
     · Under the preview the bar does NOT re-form in flow: the select disc stays put and the glass
       stretches right over «1 selection · Clear» (the bar's tail, as the dock handle is) while it
       cuts in over the Edit slot, which ghosts out (review 01.10.2026: an in-flow re-form re-centred
       the bar — the disc teleported 111 px in one frame and Clear painted outside the glass for six).
       `pickTail` keeps the segment in the tail while the glass shrinks back over it after Clear.
     · In the rail's pop-out the segment stays in flow; `pickSeg` holds the Edit tool back until its
       exit has finished, so the pop-out changes width once. */
  const [pickSeg, setPickSeg] = useState(false)
  const [pickTail, setPickTail] = useState(false)
  /* Clear is not under a finger that has only just picked: the segment takes the pointer a beat
     after it arrives (a double-click on the site beside the bar must not pick and clear) */
  const [pickArmed, setPickArmed] = useState(false)
  /* after Clear the pointer is still on the bar — the dock handle must not open under it */
  const [noTail, setNoTail] = useState(false)
  useEffect(() => {
    if (picking) { setPickSeg(true); setPickTail(true); const a = window.setTimeout(() => setPickArmed(true), 320); return () => window.clearTimeout(a) }
    setPickArmed(false)
    const t = window.setTimeout(() => setPickTail(false), 520)
    return () => window.clearTimeout(t)
  }, [picking])
  const { clear, save, close, select, openPanel, setContext } = useEditor.getState()
  /* an old version on the canvas is looked at, never edited — the preview bar takes the slot */
  const previewing = useUI((s) => s.versionPreview !== null)
  const show = project === 'built' && live && surface === 'preview' && !previewing
  const showRef = useRef(show)
  showRef.current = show

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
    /* the flight starts from the GLASS — stretched over the handle at this moment — not from the tools' box */
    const glass = barRef.current?.querySelector('[data-ve-glass]') ?? barRef.current
    const from = glass ? rectOf(glass) : null
    setHover(false)
    /* the clone is the two tools' picture (Flight); a bar re-formed by a batch or a pick is another
       picture, and a swap on landing would show — it steps across without a flight instead */
    if (from && !reduce && !history && !picking) setFlight({ dir: 'dock', from })
    setDocked(true)
  }
  const undock = () => {
    const from = dockRef.current ? rectOf(dockRef.current) : null
    setPopped(false)
    if (from && !reduce && !history && !picking) setFlight({ dir: 'undock', from })
    setDocked(false)
  }
  const popIn = () => { if (linger.current) { window.clearTimeout(linger.current); linger.current = null } setPopped(true) }
  const popOut = () => { if (linger.current) window.clearTimeout(linger.current); linger.current = window.setTimeout(() => { linger.current = null; setPopped(false) }, POP_LINGER_MS) }

  /*
   * THE KEYBOARD, while a tool is on. Escape climbs out one level at a time: a caret → commit and
   * leave the text (the host's own handler blurs; here only the fallback), an open Image panel →
   * close it, a selection → drop it, a clean mode → off. ⌘S saves a dirty batch: the word on the
   * button is Save. (⌘Z / ⇧⌘Z walked the session's history until 02.10.2026 — gone with the Undo /
   * Redo buttons; inside a text host the browser's own undo of the typing stands, and the commit
   * retires it — EditableText.tsx.)
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
        /* the ladder is the bar's: with the bar off screen (a canvas window, the sites shelf, an old
           version) the Escape belongs to whatever stands on top, and one press must not also drop
           the pick or turn the tool off underneath it */
        if (!showRef.current) return
        if (s.panel) { openPanel(null); e.preventDefault(); return }
        if (document.querySelector('[role="dialog"]:not([data-ve-image-panel]), [role="alertdialog"]')) return
        if (s.tool === 'select' && s.context) { setContext(null); e.preventDefault(); return }
        if (s.selected) { select(null); e.preventDefault(); return }
        if (!isDirty(s)) { close(); e.preventDefault() }
        return
      }
      if (mod && (e.key === 's' || e.key === 'S')) { e.preventDefault(); if (isDirty(s)) save() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [tool, save, close, select, openPanel, setContext])

  const clearPick = () => { setNoTail(true); setContext(null) }
  /* Save and Clear are pressed with the pointer ON the bar: the glass contracts under it, and the
     dock handle must not open there — it waits for the pointer to leave (the Clear-of-a-pick rule) */
  const settleBar = () => {
    setNoTail(true)
    /* the pressed button leaves with the batch, and a node removed while focused fires no blur —
       the bar would stay «hovered» (swollen) by focus until the pointer came back */
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    setHover(false)
  }
  const clearBatch = () => { settleBar(); clear() }
  const saveBatch = () => { settleBar(); save() }
  /* the pick segment, as the floating bar's tail (`inFlow` false) or in the pop-out's flow */
  const pickSegment = (inFlow: boolean) => (
    <>
      <span className={`whitespace-nowrap text-[13px] font-medium text-white ${inFlow ? 'pl-2' : 'pl-1'}`} data-ve-pick-count>
        {t({ en: '1 selection', uk: 'Вибрано: 1' })}
      </span>
      <button
        type="button"
        className="press-bloom ml-11 mr-0.5 h-8 whitespace-nowrap rounded-[10px] bg-[var(--white-100)] px-4 text-[13px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-200)]"
        style={inFlow || pickArmed ? undefined : { pointerEvents: 'none' }}
        tabIndex={picking ? 0 : -1}
        onClick={clearPick}
        data-ve-pick-clear
      >
        {t({ en: 'Clear', uk: 'Очистити' })}
      </button>
    </>
  )

  /* the count, as the board words it («1 text change»): what KIND of change when the batch is of
     one kind — words, or pictures (a replaced photo, its Fit, opacity, height) — and plain
     «changes» when it is mixed */
  const photoCount = count - textCount
  const countLabel = count === 0
    ? t({ en: 'No changes', uk: 'Без змін' })
    : photoCount === 0
      ? (count === 1 ? t({ en: '1 text change', uk: '1 зміна тексту' }) : t({ en: `${count} text changes`, uk: `${count} змін тексту` }))
      : textCount === 0
        ? (count === 1 ? t({ en: '1 photo change', uk: '1 зміна фото' }) : t({ en: `${count} photo changes`, uk: `${count} змін фото` }))
        : t({ en: `${count} changes`, uk: `${count} змін` })

  /* the tools — one set, rendered in whichever home is up */
  const toolsFor = (home: 'float' | 'pop') => (
    <>
      {/* a pick takes the other tool out of reach — Lovable's bar keeps only the tool in use; under
          the preview it ghosts in place, in the pop-out it leaves the flow. A pending batch puts the
          tool on the board's dark disc (`dark`). */}
      <ToolButton
        tool="edit"
        label={t({ en: 'Visual Editor — edit text and photos yourself, free', uk: 'Візуальний редактор — правте текст і фото самі, безкоштовно' })}
        hidden={home === 'pop' && (picking || pickSeg)}
        ghost={home === 'float' && picking}
        dark={history}
      >
        <GlyphEditText size={24} />
      </ToolButton>
      {/* once a batch is pending only its own tool stays (Lovable hides the others too): Select
          shrinks into its glyph and leaves the flow at once (`popLayout`), so the glass starts
          re-forming in the same frame */}
      <AnimatePresence initial={false} mode="popLayout">
        {!history && (
          <motion.div
            key="select"
            className="flex"
            variants={reduce ? editBarInFade : editToolAside}
            initial="initial"
            animate="animate"
            exit="exit"
            onUpdate={keepOnMainThread}
          >
            <ToolButton tool="select" label={t({ en: 'Select an element to ask Remixer about', uk: 'Виділити елемент, щоб спитати Remixer про нього' })}>
              <GlyphSelect size={24} />
            </ToolButton>
          </motion.div>
        )}
      </AnimatePresence>
      {home === 'pop' && (
        <AnimatePresence initial={false} onExitComplete={() => setPickSeg(false)}>
          {picking && (
            <motion.div
              key="pick"
              className="flex items-center"
              variants={editBarSegment}
              initial="initial"
              animate="animate"
              exit="exit"
              onUpdate={keepOnMainThread}
              data-ve-picked
            >
              {pickSegment(true)}
            </motion.div>
          )}
        </AnimatePresence>
      )}
      {/* THE SAVE STATE (board 31562:5194): the count · Clear · Save. In: the count slides in from
          the glass's edge, Clear and Save condense out of the glass a beat apart (editBarCount,
          editBarAction). Out: everything fades in 140 ms and leaves the flow at once, so the glass
          contracts under the fade. */}
      <AnimatePresence initial={false} mode="popLayout">
        {history && (
          <motion.div
            key="batch"
            className="flex items-center gap-4"
            exit={{ opacity: 0, transition: EXIT }}
            onUpdate={keepOnMainThread}
            data-ve-batch
          >
            <motion.span
              className="min-w-[120px] whitespace-nowrap text-[15px] font-medium leading-none text-white [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]"
              variants={reduce ? editBarInFade : editBarCount}
              initial="initial"
              animate="animate"
              onUpdate={keepOnMainThread}
              data-ve-count
            >
              {countLabel}
            </motion.span>
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                className="press-bloom h-10 whitespace-nowrap rounded-[10px] bg-[var(--white-100)] px-5 text-[14px] font-medium text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-200)]"
                variants={reduce ? editBarInFade : editBarAction}
                custom={0}
                initial="initial"
                animate="animate"
                onUpdate={keepOnMainThread}
                onClick={clearBatch}
                data-ve-clear
              >
                <span className="[text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">{t({ en: 'Clear', uk: 'Очистити' })}</span>
              </motion.button>
              <motion.button
                type="button"
                className="press-bloom h-10 whitespace-nowrap rounded-[10px] bg-[var(--action)] px-5 text-[14px] font-medium text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)] disabled:cursor-default disabled:opacity-40"
                variants={reduce ? editBarInFade : editBarAction}
                custom={1}
                initial="initial"
                animate="animate"
                onUpdate={keepOnMainThread}
                onClick={saveBatch}
                /* not while Remixer is making a change: its version is posted and lands on the site
                   as it stood — a Save in between would be built over (modules/versions) */
                disabled={!dirty || busy}
                title={busy ? t({ en: 'Wait until Remixer finishes', uk: 'Зачекайте, поки Remixer закінчить' }) : undefined}
                data-ve-save
              >
                <span className="[text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">{t({ en: 'Save', uk: 'Зберегти' })}</span>
              </motion.button>
            </div>
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
              className="pointer-events-auto relative"
              variants={reduce ? editBarInFade : editBarIn}
              initial={flight?.dir === 'undock' ? false : 'initial'}
              animate="animate"
              exit="exit"
              transition={EDIT_BAR_SPRING}
              onUpdate={keepOnMainThread}
              onPointerEnter={() => setHover(true)}
              onPointerLeave={() => { setHover(false); setNoTail(false) }}
              onFocus={() => setHover(true)}
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHover(false) }}
              style={hidden}
            >
              <GlassBar
                side="left"
                grow="center"
                tall={history}
                /* the tail is the pick segment while a pick stands (and while the glass shrinks back
                   over it), else the dock handle, uncovered by a hover — never right after Clear,
                   with the pointer still on the bar */
                reveal={picking || (hover && !history && !pickTail && !noTail)}
                swell={hover}
                cut={picking ? BAR_TOOL + 4 : 0}
                tailKey={pickTail ? 'pick' : 'dock'}
                pillRef={barRef}
                pillProps={{ 'data-ve-bar': '', 'data-ve-dirty': dirty ? '' : undefined }}
                /* the dock handle: the glass stretches to the right to uncover it — the tools do not
                   move; a pending batch keeps the pill where it is (Save/Clear are the only way out) */
                tail={pickTail ? pickSegment(false) : (
                  <>
                    <span className="h-9 w-px bg-[var(--glass-divider)]" aria-hidden />
                    <button type="button" className="ve-bar-btn press-bloom" aria-label={dockBtnLabel} title={dockBtnLabel} onClick={dock} tabIndex={hover && !history && !picking ? 0 : -1} data-ve-dock-to-rail>
                      <GlyphDockRight size={22} />
                    </button>
                  </>
                )}
              >
                {toolsFor('float')}
              </GlassBar>
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
          style={flight?.dir === 'dock' && !flight.landed ? hidden : undefined}
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
                  className="relative"
                  style={{ transformOrigin: 'right center' }}
                  variants={reduce ? editBarPopFade : editBarPop}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={EDIT_BAR_SPRING}
                  onUpdate={keepOnMainThread}
                >
                  <GlassBar side="right" reveal={false} tall={history} pillProps={{ 'data-ve-bar': '', 'data-ve-popped': '', 'data-ve-dirty': dirty ? '' : undefined }}>
                    {toolsFor('pop')}
                    <span className="h-9 w-px bg-[var(--glass-divider)]" aria-hidden />
                    <button type="button" className="ve-bar-btn press-bloom" aria-label={t({ en: 'Put the tools back under the preview', uk: 'Повернути інструменти під превʼю' })} title={t({ en: 'Put the tools back under the preview', uk: 'Повернути інструменти під превʼю' })} onClick={undock} data-ve-undock>
                      <GlyphUndock size={22} />
                    </button>
                  </GlassBar>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>,
        slot,
      )}

      {/* THE FLIGHT — the glass itself, between the two homes, above both the canvas and the rail */}
      {flight?.to && createPortal(<Flight flight={flight as Flight & { to: Rect }} onLand={() => setFlight((f) => (f ? { ...f, landed: true } : f))} onDone={() => setFlight(null)} />, document.body)}
    </>
  )
}
