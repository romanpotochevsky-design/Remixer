/**
 * THE IMAGE PANEL — what opens beside a photo when its «Replace photo» is pressed in the Visual
 * Editor. Two sources, one window:
 *
 *  · The designer's own sketch, Figma 31384:21963 «Images Editor» (30.09.2026: «нашёл старый
 *    макет/набросок с тем, как выглядит окно для замены фото»): 320 wide, glass — rgba(31,31,31,.7)
 *    under a blur with an 8 % rim, radius 24, shadow 0 8 72 at 50 %; a title «Image» (Gilroy Bold 20,
 *    pt 19 / pb 16) with a 32 button slot at the right; a segmented `Fit | Fill` (track Black/400 =
 *    rgba(9,9,11,.32) r12 p4, seat White/400 = 32 % white r10 h32, labels Proxima Semibold 14 —
 *    white on the seat, 48 % off it); the picture in a 288 × 256 r8 box with a `#33333a` stroke over
 *    a CHECKERBOARD (so Fit shows honest letterboxing), and a 40 × 40 r10 AI button in its corner
 *    (gray-900, blur 4, shadow 0 2 8 at 10 %); then two 140 × 40 r8 outline buttons (24 % rim, a 40
 *    icon slot with a 20 glyph, label 14 Semibold) «Upload File» · «From Library», and under them
 *    «Generate via Prompt» 288 × 40 r12 — fill `#33333a` under a 2 px `#be59ff` violet rim with the
 *    AI glyph 24. The board dims that label to 33 %; here it reads at full white, because a control
 *    that works is not drawn as one that does not (raised to the designer).
 *  · The live editor's Image properties, from his screenshot the same day («выглядит оно как на
 *    скриншоте»): between the picture and the buttons it adds a width and a height in px and an
 *    Opacity slider — kept here in the sketch's materials, and asked about.
 *
 * It is a POPOVER anchored to the photo («рядом с фото»): to the photo's right where there is room,
 * to its left otherwise, top-aligned with it and kept inside the window. Panel Arrival out of the side
 * that faces the photo (motion.ts `panelIn` / `panelInBody`), 140 ms flat leave; the segmented seat
 * moves on `segmentedPill` (one object whose selection MOVES — ScenarioPanel's law). The board's blur
 * 40 is drawn as 16: past ~16 px Chrome's backdrop blur gets worse, not softer (CLAUDE.md, 26.08.2026).
 *
 * WHAT EACH CONTROL STAGES (session.ts — nothing reaches the world before Save):
 *  · Fit / Fill → `fit`: contain or cover.
 *  · Height → `height` in px on the photo box; the WIDTH follows the layout (a card's column, a grid
 *    cell) and is shown for information — read-only, and says so.
 *  · Opacity → `opacity` 0–100.
 *  · Upload File → the system file picker; the file is downscaled and kept in the media store
 *    (media.ts), the slot gets `{ kind: 'upload', id }`.
 *  · From Library → opens the WEBSITE MEDIA panel in pick mode (modules/media/MediaPanel.tsx, built
 *    30.09.2026 from the designer's recording): one click there hands the picture to this photo.
 *  · Generate via Prompt → the one PAID path in the editor: a new picture costs credits (the KB:
 *    generating an AI image uses credits; the price is not verified — `IMAGE_COST` is the chat's
 *    COST until the designer names one). It simulates a generation the way the chat does (a beat
 *    of work, then a result) and stages the result as a `site` picture.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useT } from '@/i18n'
import { useUI } from '@/state/ui'
import { useWorld, canUseAI } from '@/state/world'
import { panelIn, panelInBody, panelInBodyFade, panelInFade, segmentedPill } from '@/ui/motion'
import { IconCloseM, IconSparkleAI } from '@/ui/icons'
import { fitOf, heightOf, opacityOf, photoOf } from '@/modules/preview/content'
import { photoIds } from '@/modules/preview/photos'
import { photoSrc } from '@/modules/preview/site-parts'
import { fileToPhoto, putUpload } from './media'
import { useEditor } from './session'
import { GlyphLibrary, GlyphUpload } from './icons'

const keepOnMainThread = () => {}
export const PANEL_W = 320
const GAP = 12
/** What a generated picture costs — the chat's COST until a verified price exists (open question). */
export const IMAGE_COST = 10
const GENERATE_MS = 2400
/** The checkerboard the sketch lays under the picture — two 8 px squares of 8 % white. */
const CHECKER = 'repeating-conic-gradient(rgba(255,255,255,0.08) 0 25%, transparent 0 50%) 0 0 / 16px 16px'

type Anchor = { left: number; top: number; side: 'right' | 'left' }

/** The panel's tallest state (the library grid open), and the room kept under it for the edit bar
 *  at the canvas's foot — a window that covered the bar would hide Save behind the thing it saves. */
const PANEL_H = 640
const BAR_ROOM = 88

function place(el: Element): Anchor {
  const r = el.getBoundingClientRect()
  /* the Website media panel, when up, owns the right edge — this window keeps clear of it so the
     picture being picked stays visible (the panel is this window's helper in pick mode) */
  const media = document.querySelector('[data-media-panel]')?.getBoundingClientRect()
  const edge = media ? media.left - 8 : window.innerWidth - 8
  const right = r.right + GAP + PANEL_W <= edge
  const left = right ? r.right + GAP : Math.max(8, r.left - GAP - PANEL_W)
  const top = Math.max(8, Math.min(r.top, window.innerHeight - PANEL_H - BAR_ROOM))
  return { left, top, side: right ? 'right' : 'left' }
}

/* --------------------------------------------------------------- pieces */

/** The sketch's `Fit | Fill` (31384:21973): a Black/400 track, one White/400 seat that moves. */
function FitSwitch({ value, onChange }: { value: 'fill' | 'fit'; onChange: (v: 'fill' | 'fit') => void }) {
  const { t } = useT()
  const opts: Array<{ v: 'fill' | 'fit'; label: string }> = [
    { v: 'fit', label: t({ en: 'Fit', uk: 'Вписати' }) },
    { v: 'fill', label: t({ en: 'Fill', uk: 'Заповнити' }) },
  ]
  /* ONE seat that slides — a transform on the house spring, not a `layoutId` pair: a layout-projected
     element inside this popover kept AnimatePresence from ever finishing the panel's exit (the glass
     faded to 0 and stayed in the DOM, swallowing the clicks under it — measured 30.09.2026) */
  return (
    <div className="relative grid h-10 grid-cols-2 rounded-[12px] bg-[rgba(9,9,11,0.32)] p-1" role="tablist" data-ve-fit>
      <motion.span
        className="absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-[10px] bg-[rgba(255,255,255,0.32)]"
        initial={false}
        animate={{ x: value === 'fit' ? '0%' : '100%' }}
        transition={segmentedPill.transition}
        aria-hidden
        data-ve-fit-seat
      />
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          role="tab"
          aria-selected={value === o.v}
          onClick={() => onChange(o.v)}
          className={`relative h-8 rounded-[10px] text-[14px] font-semibold transition-colors duration-[var(--dur-fast)] ease-std ${value === o.v ? 'text-white' : 'text-[var(--white-480)] hover:text-white'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** The sketch's outline button (31384:22013): 140 × 40 r8, a 24 % rim, a 40 icon slot, label 14. */
function OutlineButton({ icon, label, onClick, pressed, testId }: { icon: React.ReactNode; label: string; onClick: () => void; pressed?: boolean; testId: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      data-ve-row={testId}
      className={`press-bloom flex h-10 flex-1 items-center rounded-[8px] pr-3 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] ${pressed ? 'bg-[var(--white-100)]' : ''}`}
    >
      <span className="grid h-10 w-10 flex-none place-items-center text-white">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-white">{label}</span>
    </button>
  )
}

/* ---------------------------------------------------------------- panel */

export function ImagePanel() {
  const { t } = useT()
  const reduce = useReducedMotion()
  const key = useEditor((s) => s.panel)
  const openPanel = useEditor((s) => s.openPanel)
  const stage = useEditor((s) => s.stage)
  const draft = useEditor((s) => s.draft)
  const saved = useWorld((s) => s.world.siteEdits)
  const world = useWorld((s) => s.world)
  const setWorld = useWorld((s) => s.set)
  const preset = useWorld((s) => s.preset)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [box, setBox] = useState<{ w: number; h: number } | null>(null)
  const [section, setSection] = useState<'generate' | null>(null)
  const mediaOpen = useUI((s) => s.mediaOpen)
  const openMedia = useUI((s) => s.openMedia)
  const closeMedia = useUI((s) => s.closeMedia)
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  /* the merged layer the site shows — the draft over the saved words, as SitePreview lays them */
  const edits = {
    text: { ...saved.text, ...draft.text },
    photo: { ...saved.photo, ...draft.photo },
    fit: { ...saved.fit, ...draft.fit },
    opacity: { ...saved.opacity, ...draft.opacity },
    height: { ...saved.height, ...draft.height },
  }
  const heightNow = key ? edits.height[key] : undefined

  /* anchored to the photo's box; re-measured when the site scrolls or the window changes */
  useLayoutEffect(() => {
    if (!key) { setAnchor(null); setSection(null); setPrompt(''); setUploadError(null); return }
    const find = () => document.querySelector<HTMLElement>(`[data-edit="${CSS.escape(key)}"]`)
    const measure = () => {
      const el = find()
      if (!el) { openPanel(null); return }
      setAnchor(place(el))
      const r = el.getBoundingClientRect()
      setBox({ w: Math.round(r.width), h: Math.round(r.height) })
    }
    measure()
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => { window.removeEventListener('scroll', measure, true); window.removeEventListener('resize', measure) }
  }, [key, openPanel, heightNow, mediaOpen])

  /* a press outside the panel and outside its photo closes it — a popover's law */
  useEffect(() => {
    if (!key) return
    const down = (e: PointerEvent) => {
      const el = e.target as Element | null
      if (!el) return
      if (panel.current?.contains(el)) return
      if (el.closest(`[data-edit="${CSS.escape(key)}"]`)) return
      /* the Website media panel in pick mode is this window's helper, not «outside» — nor is its lightbox */
      if (el.closest('[data-media-panel]') || el.closest('[data-media-lightbox]') || el.closest('[role="alertdialog"]')) return
      openPanel(null)
    }
    window.addEventListener('pointerdown', down, true)
    return () => window.removeEventListener('pointerdown', down, true)
  }, [key, openPanel])

  const onUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f || !key) return
    try {
      const up = await fileToPhoto(f)
      const kept = putUpload(up.id, up.src)
      setUploadError(kept ? null : t({ en: 'Kept for this session only — the browser’s storage is full.', uk: 'Збережено лише на цю сесію — сховище браузера заповнене.' }))
      stage('photo', key, { kind: 'upload', id: up.id, name: up.name })
    } catch {
      setUploadError(t({ en: 'That file is not a picture we can use.', uk: 'Цей файл не є зображенням, яке можна використати.' }))
    }
  }

  /* the paid path: a generation is AI work, so it spends credits like a chat turn and is
     refused where the chat would be (no balance, no entitlement) */
  const generate = () => {
    if (!key || !prompt.trim() || generating || !canUseAI(world)) return
    setGenerating(true)
    const current = photoOf(edits, key)
    const pool = photoIds.filter((id) => !(current.kind === 'site' && current.id === id))
    const pick = pool[(prompt.length + world.credits) % pool.length]
    window.setTimeout(() => {
      setGenerating(false)
      setWorld({ credits: Math.max(0, useWorld.getState().world.credits - IMAGE_COST) }, preset)
      stage('photo', key, { kind: 'site', id: pick })
      setPrompt('')
      setSection(null)
    }, GENERATE_MS)
  }

  const pic = key ? photoSrc(edits, key) : null
  const fit = key ? fitOf(edits, key) : 'fill'
  const opacity = key ? opacityOf(edits, key) : 100
  const height = key ? heightOf(edits, key) : undefined
  const FIELD = 'flex h-10 items-center gap-2 rounded-[10px] bg-[rgba(9,9,11,0.32)] px-3'

  return createPortal(
    <AnimatePresence>
      {key && anchor && (
        <motion.div
          key={key}
          ref={panel}
          role="dialog"
          aria-label={t({ en: 'Image', uk: 'Зображення' })}
          data-ve-image-panel
          /* the sketch's glass: rgba(31,31,31,.7) under the blur, an 8 % rim, r24, the deep 72 shadow */
          className="liquid-glass fixed z-[60] flex flex-col overflow-hidden rounded-[24px] text-white shadow-[0_8px_72px_rgba(0,0,0,0.5)]"
          style={{ left: anchor.left, top: anchor.top, width: PANEL_W, background: 'rgba(31,31,31,0.7)', transformOrigin: anchor.side === 'right' ? '0 24px' : '100% 24px' }}
          variants={reduce ? panelInFade : panelIn}
          initial="initial"
          animate="animate"
          exit="exit"
          onUpdate={keepOnMainThread}
        >
          {!reduce && <span className="glass-glint" aria-hidden />}
          <motion.div className="flex flex-col" variants={reduce ? panelInBodyFade : panelInBody} onUpdate={keepOnMainThread}>
            {/* Title (31384:21964): «Image» Gilroy Bold 20 on pt 19 / pb 16; the 32 slot at the right is the close */}
            <div className="flex items-start justify-between px-4">
              <div className="pb-4 pt-[19px]">
                <h2 className="font-display text-[20px] font-bold leading-[1.2]">{t({ en: 'Image', uk: 'Зображення' })}</h2>
              </div>
              <div className="flex h-14 items-center pb-2 pt-4">
                <button type="button" onClick={() => openPanel(null)} aria-label={t({ en: 'Close', uk: 'Закрити' })} className="press-bloom grid h-8 w-8 place-items-center rounded-[10px] text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white" data-ve-panel-close>
                  <IconCloseM size={20} />
                </button>
              </div>
            </div>

            <div className="px-4">
              <FitSwitch value={fit} onChange={(v) => stage('fit', key, v === 'fill' ? undefined : v)} />
            </div>

            <div className="flex flex-col gap-4 p-4">
              {/* the picture on the sketch's checkerboard (31384:21983): 288 × 256, r8, a #33333a stroke */}
              <div className="relative h-64 w-full overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_#33333a]" style={{ background: CHECKER }} data-ve-preview>
                {pic && <img src={pic.src} alt="" className="absolute inset-0 h-full w-full" style={{ objectFit: fit === 'fit' ? 'contain' : 'cover', opacity: opacity / 100 }} />}
                <button
                  type="button"
                  onClick={() => setSection((s) => (s === 'generate' ? null : 'generate'))}
                  aria-label={t({ en: 'Generate via prompt', uk: 'Згенерувати за промптом' })}
                  className="press-bloom absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--gray-900)] text-[#c4b5fd] shadow-[inset_0_0_0_1px_#09090b,0_2px_8px_rgba(0,0,0,0.1)] backdrop-blur-[4px]"
                  data-ve-ai-corner
                >
                  <IconSparkleAI size={22} />
                </button>
              </div>

              {/* from the live editor's screenshot: size and opacity — width follows the layout */}
              <div className="grid grid-cols-2 gap-2">
                <label className={FIELD} title={t({ en: 'Width follows the layout', uk: 'Ширина йде за макетом' })}>
                  <span className="text-[var(--white-480)]">↔</span>
                  <input readOnly value={box?.w ?? ''} className="min-w-0 flex-1 bg-transparent text-[14px] tabular-nums text-[var(--white-700)] outline-none" data-ve-w />
                  <span className="text-[12px] text-[var(--white-480)]">px</span>
                </label>
                <label className={`${FIELD} focus-within:shadow-[inset_0_0_0_1px_var(--action)]`}>
                  <span className="text-[var(--white-480)]">↕</span>
                  <input
                    type="number"
                    min={40}
                    max={1200}
                    value={height ?? box?.h ?? ''}
                    onChange={(e) => { const v = Number(e.target.value); if (v >= 40 && v <= 1200) stage('height', key, v) }}
                    className="min-w-0 flex-1 bg-transparent text-[14px] tabular-nums text-white outline-none"
                    data-ve-h
                  />
                  <span className="text-[12px] text-[var(--white-480)]">px</span>
                </label>
              </div>
              <div className="rounded-[10px] bg-[rgba(9,9,11,0.32)] px-3 pb-2 pt-2">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-[var(--white-480)]">{t({ en: 'Opacity', uk: 'Прозорість' })}</span>
                  <span className="tabular-nums text-white" data-ve-opacity-value>{opacity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={opacity}
                  onChange={(e) => stage('opacity', key, Number(e.target.value) === 100 ? undefined : Number(e.target.value))}
                  className="ve-range mt-1 w-full"
                  aria-label={t({ en: 'Opacity', uk: 'Прозорість' })}
                  data-ve-opacity
                />
              </div>

              {/* Buttons (31384:22011): a line of two outlines, then the violet-rimmed Generate */}
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <OutlineButton icon={<GlyphUpload size={20} />} label={t({ en: 'Upload File', uk: 'Завантажити файл' })} onClick={() => file.current?.click()} testId="upload" />
                  <OutlineButton icon={<GlyphLibrary size={20} />} label={t({ en: 'From Library', uk: 'З бібліотеки' })} onClick={() => (mediaOpen === 'pick' ? closeMedia() : openMedia('pick'))} pressed={mediaOpen === 'pick'} testId="library" />
                </div>
                {uploadError && <p className="-mt-2 text-[12px] text-[#fbbf24]" data-ve-upload-error>{uploadError}</p>}
                <button
                  type="button"
                  onClick={() => setSection((s) => (s === 'generate' ? null : 'generate'))}
                  aria-expanded={section === 'generate'}
                  data-ve-row="generate"
                  className="press-bloom flex h-10 w-full items-center justify-center rounded-[12px] bg-[#33333a] pr-9 shadow-[inset_0_0_0_2px_#be59ff] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#3c3c44]"
                >
                  <span className="grid h-10 w-10 place-items-center text-[#c4b5fd]"><IconSparkleAI size={22} /></span>
                  <span className="flex-1 text-center text-[14px] font-semibold text-white">{t({ en: 'Generate via Prompt', uk: 'Згенерувати за промптом' })}</span>
                </button>
              </div>

              {/* the two doors open INSIDE the window, under the buttons. They fade IN and simply leave: a
                  nested AnimatePresence here was the second thing that could hold the panel's exit open */}
              <>
                {section === 'generate' && (
                  <motion.div key="generate" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.16 } }} onUpdate={keepOnMainThread} className="flex flex-col gap-2" data-ve-generate>
                    <input
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') generate() }}
                      placeholder={t({ en: 'Describe the picture…', uk: 'Опишіть картинку…' })}
                      className="h-10 rounded-[10px] bg-[rgba(9,9,11,0.32)] px-3 text-[14px] text-white outline-none placeholder:text-[var(--white-480)] focus:shadow-[inset_0_0_0_1px_var(--action)]"
                      data-ve-prompt
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      {/* the one price tag in the editor, because this is the one paid thing in it */}
                      <span className="text-[12px] text-[var(--white-480)]">{canUseAI(world) ? t({ en: `Uses ${IMAGE_COST} credits`, uk: `Використає ${IMAGE_COST} кредитів` }) : t({ en: 'Needs credits — manual edits stay free', uk: 'Потрібні кредити — ручні правки залишаються безкоштовними' })}</span>
                      <button
                        type="button"
                        onClick={generate}
                        disabled={!prompt.trim() || generating || !canUseAI(world)}
                        className="press-bloom h-8 rounded-[8px] bg-[var(--action)] px-3 text-[13px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                        data-ve-generate-go
                      >
                        {generating ? <span className="thinking">{t({ en: 'Generating', uk: 'Генерую' })}</span> : t({ en: 'Generate', uk: 'Згенерувати' })}
                      </button>
                    </div>
                  </motion.div>
                )}
              </>
            </div>
            <input ref={file} type="file" accept="image/*" className="hidden" onChange={onUpload} data-ve-file />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
