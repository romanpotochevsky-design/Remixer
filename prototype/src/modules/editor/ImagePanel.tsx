/**
 * THE IMAGE PANEL — what opens beside a photo when its «Replace photo» is pressed in the Visual
 * Editor (designer, 30.09.2026, with a screenshot of the live editor's Image properties: «при
 * нажатии на фото у нас должно открыться попап окно рядом с фото и выглядит оно как на
 * скриншоте»).
 *
 * WHAT THE SCREENSHOT DRAWS, top to bottom: a title «Image» with a collapse glyph at the right;
 * a segmented Fill | Fit; the picture itself with a small AI button in its corner; a width and a
 * height field in px; an Opacity slider with its percentage; then three rows with a chevron —
 * «Upload Image», «Image from Library», «Generate via Prompt». That is the live product's
 * right-hand properties panel; here it is a POPOVER anchored to the photo — his word: «рядом с
 * фото» — 360 wide, standing to the photo's right where there is room and to its left otherwise,
 * top-aligned with it and kept inside the window.
 *
 * MATERIAL AND MOTION are the house's, not the screenshot's: a solid `gray-850` panel under the
 * 8 % rim (the Publish panel's canon — an opaque panel, no glass), Panel Arrival out of the side
 * that faces the photo (motion.ts `panelIn` / `panelInBody`), 140 ms flat leave; the segmented
 * control's seat moves on `segmentedPill` (a segmented control is one object whose selection
 * MOVES, ScenarioPanel's law); the slider and the fields are blue where the live one is orange —
 * blue is the action colour here.
 *
 * WHAT EACH CONTROL STAGES (session.ts — nothing reaches the world before Save):
 *  · Fill / Fit → `fit`: cover or contain.
 *  · Height → `height` in px on the photo box; the WIDTH follows the layout (a card's column, a
 *    grid cell) and is shown for information — the field is read-only and says so.
 *  · Opacity → `opacity` 0–100.
 *  · Upload Image → the system file picker; the file is downscaled and kept in the media store
 *    (media.ts), the slot gets `{ kind: 'upload', id }`.
 *  · Image from Library → the site's own pictures, inline, until the designer's Website media
 *    panel is built from his recording (docs/features/visual-editor/media-library-spec.md); then
 *    this row opens THAT.
 *  · Generate via Prompt → the one PAID path in the editor: a new picture costs credits (the KB:
 *    generating an AI image uses credits; the price is not verified — `IMAGE_COST` is the chat's
 *    COST until the designer names one). It simulates a generation the way the chat does (a beat
 *    of work, then a result) and stages the result as a `site` picture.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useT } from '@/i18n'
import { useWorld, canUseAI } from '@/state/world'
import { EXIT, panelIn, panelInBody, panelInBodyFade, panelInFade, segmentedPill } from '@/ui/motion'
import { IconCloseM, IconChevronRight, IconSparkleAI } from '@/ui/icons'
import { fitOf, heightOf, labelOf, opacityOf, photoOf } from '@/modules/preview/content'
import { SITE_PHOTOS, photoIds } from '@/modules/preview/photos'
import { photoSrc } from '@/modules/preview/site-parts'
import { fileToPhoto, putUpload } from './media'
import { useEditor } from './session'
import { GlyphReplacePhoto } from './icons'

const keepOnMainThread = () => {}
export const PANEL_W = 360
const GAP = 12
/** What a generated picture costs — the chat's COST until a verified price exists (open question). */
export const IMAGE_COST = 10
const GENERATE_MS = 2400

type Anchor = { left: number; top: number; side: 'right' | 'left' }

function place(el: Element): Anchor {
  const r = el.getBoundingClientRect()
  const h = 560
  const right = r.right + GAP + PANEL_W <= window.innerWidth - 8
  const left = right ? r.right + GAP : Math.max(8, r.left - GAP - PANEL_W)
  const top = Math.max(8, Math.min(r.top, window.innerHeight - h - 8))
  return { left, top, side: right ? 'right' : 'left' }
}

/* --------------------------------------------------------------- pieces */

function Segmented({ value, onChange }: { value: 'fill' | 'fit'; onChange: (v: 'fill' | 'fit') => void }) {
  const { t } = useT()
  const opts: Array<{ v: 'fill' | 'fit'; label: string }> = [
    { v: 'fill', label: t({ en: 'Fill', uk: 'Заповнити' }) },
    { v: 'fit', label: t({ en: 'Fit', uk: 'Вписати' }) },
  ]
  return (
    <div className="relative grid h-10 grid-cols-2 rounded-[12px] bg-[var(--gray-900)] p-1 shadow-[inset_0_0_0_1px_var(--white-050)]" role="tablist" data-ve-fit>
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          role="tab"
          aria-selected={value === o.v}
          onClick={() => onChange(o.v)}
          className={`relative z-10 rounded-[9px] text-[14px] font-semibold transition-colors duration-[var(--dur-fast)] ease-std ${value === o.v ? 'text-white' : 'text-[var(--white-480)] hover:text-white'}`}
        >
          {/* the seat: ONE pill that moves between positions (segmentedPill), never two plates */}
          {value === o.v && <motion.span layoutId="ve-fit-seat" className="absolute inset-0 -z-10 rounded-[9px] bg-[var(--white-100)]" {...segmentedPill} />}
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Row({ icon, label, onClick, open, children, testId }: { icon: React.ReactNode; label: string; onClick: () => void; open?: boolean; children?: React.ReactNode; testId: string }) {
  return (
    <div className="border-t border-[var(--white-050)] first:border-t-0">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={children ? open : undefined}
        data-ve-row={testId}
        className="press-bloom flex h-12 w-full items-center gap-3 rounded-[10px] px-2 text-left transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
      >
        <span className="grid h-6 w-6 place-items-center text-white">{icon}</span>
        <span className="flex-1 text-[15px] font-semibold text-white">{label}</span>
        <span className="grid h-6 w-6 place-items-center text-[var(--white-480)]" style={{ transform: open ? 'rotate(90deg)' : undefined, transition: 'transform .2s var(--ease-std)' }}>
          <IconChevronRight size={18} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && children && (
          <motion.div
            key="body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.16 } }}
            exit={{ opacity: 0, transition: EXIT }}
            onUpdate={keepOnMainThread}
            className="pb-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
  const [section, setSection] = useState<'library' | 'generate' | null>(null)
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
  }, [key, openPanel, heightNow])

  /* a press outside the panel and outside its photo closes it — a popover's law */
  useEffect(() => {
    if (!key) return
    const down = (e: PointerEvent) => {
      const el = e.target as Element | null
      if (!el) return
      if (panel.current?.contains(el)) return
      if (el.closest(`[data-edit="${CSS.escape(key)}"]`)) return
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

  return createPortal(
    <AnimatePresence>
      {key && anchor && (
        <motion.div
          key={key}
          ref={panel}
          role="dialog"
          aria-label={t({ en: 'Image', uk: 'Зображення' })}
          data-ve-image-panel
          className="fixed z-[60] flex flex-col gap-3 rounded-[16px] bg-[var(--gray-850)] p-4 text-white shadow-[inset_0_0_0_1px_var(--white-100),0_16px_48px_rgba(0,0,0,0.5)]"
          style={{ left: anchor.left, top: anchor.top, width: PANEL_W, transformOrigin: anchor.side === 'right' ? '0 24px' : '100% 24px' }}
          variants={reduce ? panelInFade : panelIn}
          initial="initial"
          animate="animate"
          exit="exit"
          onUpdate={keepOnMainThread}
        >
          <motion.div className="flex flex-col gap-3" variants={reduce ? panelInBodyFade : panelInBody} onUpdate={keepOnMainThread}>
            {/* header: the screenshot's «Image» and its close */}
            <div className="flex items-center justify-between pl-1">
              <div className="min-w-0">
                <h2 className="font-display text-[20px] font-semibold leading-[1.2]">{t({ en: 'Image', uk: 'Зображення' })}</h2>
                <p className="truncate text-[12px] text-[var(--white-480)]">{labelOf(key)} · {key}</p>
              </div>
              <button type="button" onClick={() => openPanel(null)} aria-label={t({ en: 'Close', uk: 'Закрити' })} className="press-bloom grid h-8 w-8 place-items-center rounded-[10px] text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white" data-ve-panel-close>
                <IconCloseM size={20} />
              </button>
            </div>

            <Segmented value={fit} onChange={(v) => stage('fit', key, v === 'fill' ? undefined : v)} />

            {/* the picture as the site shows it, with the AI corner button the screenshot draws */}
            <div className="relative overflow-hidden rounded-[12px] bg-[var(--gray-900)]" style={{ aspectRatio: '560 / 360' }} data-ve-preview>
              {pic && <img src={pic.src} alt="" className="absolute inset-0 h-full w-full" style={{ objectFit: fit === 'fit' ? 'contain' : 'cover', opacity: opacity / 100 }} />}
              <button
                type="button"
                onClick={() => setSection((s) => (s === 'generate' ? null : 'generate'))}
                aria-label={t({ en: 'Generate via prompt', uk: 'Згенерувати за промптом' })}
                className="liquid-glass press-bloom absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-[10px] text-[#c4b5fd]"
              >
                <IconSparkleAI size={18} />
              </button>
            </div>

            {/* width follows the layout; height is the customer's */}
            <div className="grid grid-cols-2 gap-2">
              <label className="flex h-10 items-center gap-2 rounded-[10px] bg-[var(--gray-900)] px-3 shadow-[inset_0_0_0_1px_var(--white-050)]" title={t({ en: 'Width follows the layout', uk: 'Ширина йде за макетом' })}>
                <span className="text-[var(--white-480)]">↔</span>
                <input readOnly value={box?.w ?? ''} className="min-w-0 flex-1 bg-transparent text-[14px] tabular-nums text-[var(--white-700)] outline-none" data-ve-w />
                <span className="text-[12px] text-[var(--white-480)]">px</span>
              </label>
              <label className="flex h-10 items-center gap-2 rounded-[10px] bg-[var(--gray-900)] px-3 shadow-[inset_0_0_0_1px_var(--white-050)] focus-within:shadow-[inset_0_0_0_1px_var(--action)]">
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

            {/* opacity */}
            <div className="rounded-[12px] bg-[var(--gray-900)] px-3 pb-3 pt-2 shadow-[inset_0_0_0_1px_var(--white-050)]">
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

            {/* the three doors */}
            <div className="-mx-2">
              <Row icon={<GlyphReplacePhoto size={22} />} label={t({ en: 'Upload Image', uk: 'Завантажити зображення' })} onClick={() => file.current?.click()} testId="upload" />
              {uploadError && <p className="px-2 pb-2 text-[12px] text-[#fbbf24]" data-ve-upload-error>{uploadError}</p>}
              <Row icon={<IconGridSmall />} label={t({ en: 'Image from Library', uk: 'Зображення з бібліотеки' })} onClick={() => setSection((s) => (s === 'library' ? null : 'library'))} open={section === 'library'} testId="library">
                <div className="grid grid-cols-3 gap-2 px-2" data-ve-library>
                  {photoIds.map((id) => {
                    const cur = photoOf(edits, key)
                    const on = cur.kind === 'site' && cur.id === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => stage('photo', key, { kind: 'site', id })}
                        aria-pressed={on}
                        title={SITE_PHOTOS[id].alt}
                        className={`relative aspect-[14/9] overflow-hidden rounded-[8px] transition-shadow duration-[var(--dur-fast)] ease-std ${on ? 'shadow-[inset_0_0_0_2px_var(--action)]' : 'hover:shadow-[inset_0_0_0_1px_var(--white-300)]'}`}
                      >
                        <img src={SITE_PHOTOS[id].src} alt="" className="h-full w-full object-cover" />
                      </button>
                    )
                  })}
                </div>
              </Row>
              <Row icon={<IconSparkleAI size={22} className="text-[#c4b5fd]" />} label={t({ en: 'Generate via Prompt', uk: 'Згенерувати за промптом' })} onClick={() => setSection((s) => (s === 'generate' ? null : 'generate'))} open={section === 'generate'} testId="generate">
                <div className="flex flex-col gap-2 px-2" data-ve-generate>
                  <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') generate() }}
                    placeholder={t({ en: 'Describe the picture…', uk: 'Опишіть картинку…' })}
                    className="h-10 rounded-[10px] bg-[var(--gray-900)] px-3 text-[14px] text-white shadow-[inset_0_0_0_1px_var(--white-050)] outline-none placeholder:text-[var(--white-480)] focus:shadow-[inset_0_0_0_1px_var(--action)]"
                    data-ve-prompt
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
                </div>
              </Row>
            </div>
            <input ref={file} type="file" accept="image/*" className="hidden" onChange={onUpload} data-ve-file />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** A 2×2 of pictures — the library row's glyph. */
function IconGridSmall() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.75" y="3.75" width="7" height="7" rx="1.75" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13.25" y="3.75" width="7" height="7" rx="1.75" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3.75" y="13.25" width="7" height="7" rx="1.75" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13.25" y="13.25" width="7" height="7" rx="1.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
