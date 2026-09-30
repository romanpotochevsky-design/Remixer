/**
 * WEBSITE MEDIA — the site's library of pictures, over the canvas at the right rail.
 *
 * Built 30.09.2026 from the designer's screen recording of the live editor
 * (`9a33f8ba-Screen_Recording_2026-09-30_at_15.04.13.mov`, «вот как работает панель для Website
 * media, ее нужно добавить») and his boards — 23383:32801 (Image, in the shell), 25812:140180
 * (Video), 22926:21849 (Audio), 22926:26659 (Docs), 23618:19852 (a selected tile) and the
 * `Image management bar` 23623:17060 — «дизайн и анимация 1 в 1 как на photos.google.com».
 * The measured spec, frame by frame and node by node, is docs/features/visual-editor/
 * media-library-spec.md; this file follows its §5.
 *
 * WHERE IT SITS. The boards were drawn in the old shell (rail on the LEFT, the panel flush to
 * it); our 2026 shell has the rail on the RIGHT, so the panel stands over the canvas at its
 * right edge — `right: rail + 8`, `top: topbar + 8`, `bottom: 8`, 480 wide (the board; the live
 * panel is 512 — asked). It lies OVER the site like the Publish panel: the live editor narrows
 * the canvas instead, which would re-run the preview's container queries on every open.
 * Gray/850 under a Gray/800 rim, r16 — the board's chrome, opaque like the Publish panel (not
 * glass: what is behind it is the site, and the board does not blur it).
 *
 * ENTRY — Panel Arrival, the same glass-inflates-from-its-button as the Publish panel and the
 * account menu (`panelIn`), with the origin at the rail button that opened it; the rail tile
 * floods with the module's accent from the point of the click (App.tsx `floodTile`). Leaving
 * is 140 ms flat. One floating window at the right edge at a time: Publish, Account and this
 * close one another (state/ui.ts).
 *
 * TWO MODES (ui.mediaOpen):
 *  · `manage` — from the rail. Browse the tabs, select (Google Photos), delete, add to chat,
 *    upload, generate.
 *  · `pick` — from the Visual Editor's Image window, «From Library». One click on a picture
 *    hands it to the photo being edited (`useEditor.stage`), the current one wears the blue
 *    ring; no multi-select, no bar. The panel STAYS up so another picture can be tried; it
 *    leaves with the Image window, or by ✕ / Esc.
 *
 * THE TILE — the Google Photos idiom the designer named, in our motion (the live editor does
 * all of it in one frame, which the spec calls a bug, not a reference):
 *  · hover → a translucent check-circle fades in at (6,6), 120 ms;
 *  · click on the circle → selected: the tile takes Gray/750, the photo shrinks to 12/14
 *    padding with r8 (spring, transform only), the circle turns #1587ff on a white disc;
 *  · click on the PHOTO → the lightbox; while anything is selected, a click anywhere on a
 *    tile toggles it instead; Shift-click selects the range from the last click; Esc clears.
 *  · the bar rises from the panel's foot over the footer — 464 × 72 Gray/750 under a Gray/700
 *    rim, r16, 0/8/32 at 50 % — «N selected ˅» · add to chat · delete.
 *
 * WHAT IS OURS, not the board's or the recording's (all asked in the spec §6): the empty states
 * for Image and Video, ‹ › keys and the file name in the lightbox, the «Select all / Clear»
 * menu under the chevron, the spring on selection, the rail button's accent, and Generate
 * adding a picture for `IMAGE_COST` credits (the board shows the button and nothing behind it).
 *
 * DATA. `world.media` — refs only, newest first, per site (SITE_AXES). Uploaded bytes live in
 * modules/editor/media.ts under their own storage key, downscaled; a full store fails ONE
 * upload loudly instead of the whole world silently.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useUI } from '@/state/ui'
import { useWorld, canUseAI, type PhotoRef } from '@/state/world'
import { useT } from '@/i18n'
import { EXIT, SPRING, panelIn, panelInBody, panelInFade, panelInBodyFade } from '@/ui/motion'
import { ScrollArea } from '@/ui/ScrollArea'
import { useConfirm } from '@/ui/ConfirmDialog'
import { SITE_PHOTOS, photoIds } from '@/modules/preview/photos'
import { fileToPhoto, getUpload, putUpload } from '@/modules/editor/media'
import { useEditor } from '@/modules/editor/session'
import { photoOf } from '@/modules/preview/content'
import { IMAGE_COST } from '@/modules/editor/ImagePanel'
import {
  GlyphArrowDown, GlyphChatAddOn, GlyphCheckCircle, GlyphCloseS, GlyphDelete, GlyphGridAll, GlyphPlay,
  GlyphStars, GlyphTabAudio, GlyphTabDocs, GlyphTabImage, GlyphTabVideo, GlyphUnfoldMore, GlyphUploadS,
} from './icons'

/** The board's width; the live editor's is 512 (asked). */
export const MEDIA_PANEL_W = 480
/** «Unfold more» in the header widens the panel to this (ours — the board draws the button, not what it does). */
const MEDIA_PANEL_WIDE = 800
/** The rail button's accent — ours until the state sheet gets a fifth row (asked). */
export const MEDIA_TILE = 'rgba(21,135,255,0.12)'
export const MEDIA_INK = '#1587ff'
/** How long a generation takes to «arrive» — the Image window's figure. */
const GENERATE_MS = 2400

type Tab = 'image' | 'video' | 'audio' | 'docs'

/* The tabs — board 23383:32815: icon 20 in its own tint, label 13; selected fill = tint at 20 %.
   ⚠️ The board's Image fill is the raw light-theme #0073ec; in the dark theme the token is #1587ff. */
const TABS: { id: Tab; label: { en: string; uk: string }; tint: string; Glyph: typeof GlyphTabImage }[] = [
  { id: 'image', label: { en: 'Image', uk: 'Фото' }, tint: '#1587ff', Glyph: GlyphTabImage },
  { id: 'video', label: { en: 'Video', uk: 'Відео' }, tint: '#4caf50', Glyph: GlyphTabVideo },
  { id: 'audio', label: { en: 'Audio', uk: 'Аудіо' }, tint: '#ef5350', Glyph: GlyphTabAudio },
  { id: 'docs', label: { en: 'Docs', uk: 'Документи' }, tint: '#f57c00', Glyph: GlyphTabDocs },
]

/* Two demo videos (board 25812:140180 draws posters with a play glyph and a duration): posters are
   the site's own pictures — the prototype ships no video bytes. Static, not world: nothing edits them. */
const VIDEOS = [
  { id: 'v-kitchen', poster: 'kitchen', name: 'kitchen-dawn.mp4', duration: '0:42' },
  { id: 'v-bowl', poster: 'power-bowl', name: 'power-bowl-plating.mp4', duration: '0:17' },
]

const keepOnMainThread = () => {}

const refId = (r: PhotoRef) => (r.kind === 'upload' ? `up:${r.id}` : `site:${r.id}`)
const refSrc = (r: PhotoRef): { src: string; name: string } | null => {
  if (r.kind === 'upload') {
    const up = getUpload(r.id)
    return up ? { src: up, name: r.name } : null
  }
  const p = SITE_PHOTOS[r.id]
  return p ? { src: p.src, name: `${r.id}.webp` } : null
}

/* ---------------------------------------------------------------- tile */

const TILE_SPRING = { type: 'spring', duration: 0.36, bounce: 0.18 } as const

function Tile({
  item, selected, selecting, current, pick, onToggle, onOpen, onPick,
}: {
  item: PhotoRef
  selected: boolean
  selecting: boolean
  current: boolean
  pick: boolean
  onToggle: (shift: boolean) => void
  onOpen: () => void
  onPick: () => void
}) {
  const pic = refSrc(item)
  const reduce = useReducedMotion()
  if (!pic) return null
  const onClick = (e: ReactMouseEvent) => {
    if (pick) { onPick(); return }
    if (selecting) { onToggle(e.shiftKey); return }
    onOpen()
  }
  return (
    <motion.div
      layout={!reduce}
      transition={TILE_SPRING}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: EXIT }}
      onUpdate={keepOnMainThread}
      data-media-tile={refId(item)}
      data-selected={selected || undefined}
      className={`media-tile group relative h-[142px] overflow-hidden rounded-[2px] ${selected ? 'bg-[var(--gray-750)]' : ''}`}
    >
      <button
        type="button"
        onClick={onClick}
        aria-pressed={pick ? current : selected}
        aria-label={pic.name}
        className="block h-full w-full overflow-hidden focus-visible:outline-none"
        data-media-open
      >
        {/* the photo shrinks INTO the tile when selected — board 23618:19955: pad 12/14, r8. A
            scale, not a padding change: only transform moves; the radius rides the same spring. */}
        <motion.img
          src={pic.src}
          alt=""
          draggable={false}
          animate={reduce ? undefined : { scale: selected ? 0.81 : 1, borderRadius: selected ? 10 : 2 }}
          transition={TILE_SPRING}
          className={`h-full w-full object-cover ${reduce && selected ? 'scale-[.81] rounded-[10px]' : ''}`}
          style={{ transformOrigin: '50% 50%' }}
        />
        {/* pick mode: the picture the photo already wears */}
        {pick && current && <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[2px] shadow-[inset_0_0_0_2px_var(--action)]" />}
      </button>
      {!pick && (
        /* the check-circle at (6,6): hidden, then 48 % white on hover, then blue on a white disc
           when selected (component `image` 22811:89593, three states) */
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggle(e.shiftKey) }}
          aria-label={selected ? 'Deselect' : 'Select'}
          aria-pressed={selected}
          data-media-check
          className={`media-check absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full transition-opacity duration-[120ms] ease-out ${selected ? 'opacity-100 text-[var(--action)]' : 'opacity-0 text-white/[.48] group-hover:opacity-100 focus-visible:opacity-100'}`}
        >
          {selected && <span aria-hidden className="absolute h-4 w-4 rounded-full bg-white" />}
          <GlyphCheckCircle size={20} className="relative" />
        </button>
      )}
    </motion.div>
  )
}

/* ---------------------------------------------------------------- lightbox */

function Lightbox({ items, index, onClose }: { items: PhotoRef[]; index: number; onClose: () => void }) {
  const reduce = useReducedMotion()
  const { t } = useT()
  const pic = refSrc(items[index])
  /* no key listener of its own: the panel's handler reads `lightbox` from STATE, so a key pressed
     while this is still fading out (AnimatePresence keeps it mounted ~120 ms) is not swallowed by a
     listener that outlived its dialog — that swallowed the Esc meant for the panel (probe, 30.09.2026) */
  return createPortal(
    <motion.div
      role="dialog"
      aria-label={t({ en: 'Photo', uk: 'Фото' })}
      data-media-lightbox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.18 } }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      onUpdate={keepOnMainThread}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-0 z-[70] grid place-items-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      {pic && (
        <motion.img
          key={refId(items[index])}
          src={pic.src}
          alt={pic.name}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1, transition: { type: 'spring', duration: 0.42, bounce: 0.12, opacity: { duration: 0.18 } } }}
          onUpdate={keepOnMainThread}
          className="pointer-events-none select-none rounded-[8px] object-contain"
          style={{ maxHeight: 'calc(100vh - 160px)', maxWidth: 'calc(100vw - 160px)' }}
        />
      )}
      <div className="pointer-events-none absolute bottom-6 left-0 right-0 text-center text-[13px] text-[var(--white-480)]">
        {pic?.name} · {index + 1} / {items.length}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t({ en: 'Close', uk: 'Закрити' })}
        className="press-bloom absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-[8px] bg-[var(--white-100)] text-white transition-colors duration-150 hover:bg-[var(--white-200)]"
        data-media-lightbox-close
      >
        <GlyphCloseS size={24} />
      </button>
    </motion.div>,
    document.body,
  )
}

/* ---------------------------------------------------------------- panel */

export function MediaPanel() {
  const mode = useUI((s) => s.mediaOpen)
  const closeMedia = useUI((s) => s.closeMedia)
  const page = useUI((s) => s.page)
  const world = useWorld((s) => s.world)
  const setWorld = useWorld((s) => s.set)
  const preset = useWorld((s) => s.preset)
  const { t } = useT()
  const reduce = useReducedMotion()
  const editorKey = useEditor((s) => s.panel)
  const stage = useEditor((s) => s.stage)
  const setContext = useEditor((s) => s.setContext)
  const draft = useEditor((s) => s.draft)

  const [tab, setTab] = useState<Tab>('image')
  const [wide, setWide] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [menu, setMenu] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const lastClick = useRef<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const ref = useRef<HTMLDivElement>(null)

  const open = mode !== null && page === 'builder' && world.project === 'built'
  const pick = mode === 'pick'
  const items = world.media
  const ids = useMemo(() => items.map(refId), [items])
  const selecting = selected.length > 0 && !pick

  /* the Image window closed → a pick-mode panel has nothing to hand a picture to */
  useEffect(() => { if (mode === 'pick' && !editorKey) closeMedia() }, [mode, editorKey, closeMedia])
  /* leaving resets the session: the next open starts clean, on the Image tab */
  useEffect(() => { if (!open) { setSelected([]); setLightbox(null); setMenu(false); setTab('image'); setNote(null) } }, [open])
  /* selection cannot outlive the items it names */
  useEffect(() => { setSelected((s) => s.filter((id) => ids.includes(id))) }, [ids])

  /* origin: the rail button that opened it — the glass inflates out of that tile */
  const origin = useMemo(() => {
    if (!open) return 'calc(100% + 12px) 50%'
    const b = document.querySelector('[data-rail-media]')?.getBoundingClientRect()
    const top = 52 + 8
    return b ? `calc(100% + 36px) ${Math.round(b.top + b.height / 2 - top)}px` : 'calc(100% + 12px) 50%'
  }, [open])

  /* Esc: menu → selection → lightbox (its own listener) → panel. Outside press closes, except on the
     rail (it toggles itself), the console, the Image window and its photo (pick mode is a helper of both). */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (lightbox !== null) {
        if (e.key === 'Escape') { e.stopPropagation(); setLightbox(null) }
        else if (e.key === 'ArrowRight') setLightbox((i) => (i === null ? null : (i + 1) % items.length))
        else if (e.key === 'ArrowLeft') setLightbox((i) => (i === null ? null : (i - 1 + items.length) % items.length))
        return
      }
      if (e.key !== 'Escape') return
      if (menu) { setMenu(false); return }
      if (selected.length) { setSelected([]); return }
      closeMedia()
    }
    const onDown = (e: MouseEvent) => {
      const el = e.target as Element
      if (ref.current?.contains(el)) return
      if (el.closest?.('[data-rail-media]') || el.closest?.('[data-console]') || el.closest?.('[data-ve-image-panel]') || el.closest?.('[data-edit-kind="photo"]') || el.closest?.('[data-media-lightbox]') || el.closest?.('[role="alertdialog"]')) return
      closeMedia()
    }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('mousedown', onDown)
    return () => { document.removeEventListener('keydown', onKey, true); document.removeEventListener('mousedown', onDown) }
  }, [open, lightbox, menu, selected.length, closeMedia, items.length])

  const toggle = useCallback((id: string, shift: boolean) => {
    /* read the anchor NOW: the updater below runs at render time, after the line that moves it */
    const anchor = lastClick.current
    setSelected((s) => {
      if (shift && anchor && ids.includes(anchor)) {
        const a = ids.indexOf(anchor), b = ids.indexOf(id)
        const range = ids.slice(Math.min(a, b), Math.max(a, b) + 1)
        return Array.from(new Set([...s, ...range]))
      }
      return s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    })
    lastClick.current = id
  }, [ids])

  const remove = () => {
    const n = selected.length
    useConfirm.getState().ask({
      title: t({ en: n === 1 ? 'Delete this image?' : `Delete ${n} images?`, uk: n === 1 ? 'Видалити це зображення?' : `Видалити ${n} зображень?` }),
      body: t({ en: 'This action cannot be undone.', uk: 'Цю дію не можна скасувати.' }),
      confirmLabel: t({ en: 'Delete', uk: 'Видалити' }),
      cancelLabel: t({ en: 'Cancel', uk: 'Скасувати' }),
      tone: 'danger',
      onConfirm: () => {
        setWorld({ media: items.filter((r) => !selected.includes(refId(r))) }, preset)
        setSelected([])
      },
    })
  }

  /* add to chat: the selection becomes the composer's context chip, like the Select tool's */
  const addToChat = () => {
    setContext(`media:${selected.length}`)
    setSelected([])
  }

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    const added: PhotoRef[] = []
    let full = false
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue
      try {
        const up = await fileToPhoto(f)
        if (!putUpload(up.id, up.src)) full = true
        added.push({ kind: 'upload', id: up.id, name: up.name })
      } catch { /* not a picture — skipped */ }
    }
    if (!added.length) { setNote(t({ en: 'Those files are not pictures we can use.', uk: 'Ці файли не є зображеннями.' })); return }
    setNote(full ? t({ en: 'Kept for this session only — the browser’s storage is full.', uk: 'Збережено лише на цю сесію — сховище браузера заповнене.' }) : null)
    setWorld({ media: [...added, ...items] }, preset)
    setTab('image')
  }

  /* the paid path — AI work spends credits like a chat turn; a picture not yet in the library «arrives» */
  const pool = photoIds.filter((id) => !ids.includes(`site:${id}`))
  const canGenerate = pool.length > 0 && canUseAI(world) && !generating
  const generate = () => {
    if (!canGenerate) return
    setGenerating(true)
    const pickId = pool[world.credits % pool.length]
    window.setTimeout(() => {
      setGenerating(false)
      const w = useWorld.getState().world
      setWorld({ credits: Math.max(0, w.credits - IMAGE_COST), media: [{ kind: 'site', id: pickId }, ...w.media] }, preset)
    }, GENERATE_MS)
  }

  /* the picture the photo wears NOW — the unsaved draft over the saved layer, as the site draws it */
  const current = pick && editorKey ? photoOf({ ...world.siteEdits, photo: { ...world.siteEdits.photo, ...draft.photo } }, editorKey) : null

  const shellIn = reduce ? panelInFade : panelIn
  const bodyIn = reduce ? panelInBodyFade : panelInBody

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="media"
          ref={ref}
          role="dialog"
          aria-label={t({ en: 'Website media', uk: 'Медіа сайту' })}
          data-media-panel={mode}
          data-media-current={current ? refId(current) : undefined}
          variants={shellIn}
          initial="initial"
          animate="animate"
          exit="exit"
          onUpdate={keepOnMainThread}
          className="fixed z-40 flex flex-col overflow-hidden rounded-[16px] bg-[var(--gray-850)] shadow-[inset_0_0_0_1px_var(--gray-800),0_2px_0_#09090b,0_8px_32px_rgba(0,0,0,.4)] transition-[width] duration-300 ease-std"
          style={{
            right: 'calc(var(--rail-w) + 8px)',
            top: 'calc(var(--topbar-h) + 8px)',
            bottom: 8,
            width: wide ? MEDIA_PANEL_WIDE : MEDIA_PANEL_W,
            transformOrigin: origin,
          }}
        >
          <span aria-hidden className="glass-glint" />
          <motion.div variants={bodyIn} onUpdate={keepOnMainThread} className="flex min-h-0 flex-1 flex-col" style={{ transformOrigin: origin }}>
            {/* header 71 — board 23383:32808: title 24 SemiBold + chevron; unfold / close 32 r8 */}
            <div className="flex h-[71px] flex-none items-start justify-between pl-6 pr-3">
              <div className="flex items-center gap-0.5 pt-[26px]">
                <h2 className="font-display text-[24px] font-semibold leading-[1.2] text-white" data-media-title>
                  {pick ? t({ en: 'Choose a photo', uk: 'Оберіть фото' }) : t({ en: 'Website media', uk: 'Медіа сайту' })}
                </h2>
                {!pick && <GlyphArrowDown size={24} className="text-white" />}
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setWide((w) => !w)}
                  aria-pressed={wide}
                  aria-label={t({ en: wide ? 'Narrow panel' : 'Widen panel', uk: wide ? 'Звузити' : 'Розширити' })}
                  className="press-bloom grid h-8 w-8 place-items-center rounded-[8px] text-white shadow-[inset_0_0_0_1px_var(--white-200)] transition-colors duration-150 hover:bg-[var(--white-100)]"
                  data-media-unfold
                >
                  <GlyphUnfoldMore size={24} />
                </button>
                <button
                  type="button"
                  onClick={() => closeMedia()}
                  aria-label={t({ en: 'Close', uk: 'Закрити' })}
                  className="press-bloom grid h-8 w-8 place-items-center rounded-[8px] bg-[var(--white-100)] text-white transition-colors duration-150 hover:bg-[var(--white-200)]"
                  data-media-close
                >
                  <GlyphCloseS size={24} />
                </button>
              </div>
            </div>

            {/* tabs 52 — pills 36 (board; the kit's button sizes are 32/40/48 — asked) */}
            <div className="flex h-[52px] flex-none items-center gap-2 px-4" role="tablist" data-media-tabs>
              {TABS.map(({ id, label, tint, Glyph }) => {
                const on = tab === id
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => { setTab(id); setSelected([]) }}
                    data-media-tab={id}
                    className={`press-bloom flex h-9 items-center gap-1.5 rounded-full pl-2 pr-[18px] text-[13px] text-white transition-colors duration-150 ${on ? 'font-semibold' : 'shadow-[inset_0_0_0_1px_var(--white-200)] hover:bg-[var(--white-100)]'}`}
                    style={on ? { background: `${tint}33` } : undefined}
                  >
                    <Glyph size={20} style={{ color: tint }} />
                    {t(label)}
                  </button>
                )
              })}
            </div>

            {/* the list — GRID 3 × 152, gap 4, pad 8/12/8/4 (board 23383:32871); wide: as many 152s as fit */}
            <ScrollArea className="min-h-0 flex-1" innerClassName="h-full" thumb="light" data-media-list>
              {tab === 'image' && (
                items.length ? (
                  <div className="grid gap-1 pb-[88px] pl-1 pr-3 pt-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }} data-ve-library={pick || undefined} data-media-grid>
                    <AnimatePresence initial={false} mode="popLayout">
                      {items.map((item, i) => {
                        const id = refId(item)
                        return (
                          <Tile
                            key={id}
                            item={item}
                            selected={selected.includes(id)}
                            selecting={selecting}
                            pick={pick}
                            current={!!current && current.kind === item.kind && current.id === item.id}
                            onToggle={(shift) => toggle(id, shift)}
                            onOpen={() => setLightbox(i)}
                            onPick={() => { if (editorKey) stage('photo', editorKey, item) }}
                          />
                        )
                      })}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Empty>{t({ en: 'No images yet', uk: 'Зображень ще немає' })}</Empty>
                )
              )}
              {tab === 'video' && (
                <div className="grid grid-cols-3 gap-1 pb-[88px] pl-1 pr-3 pt-2" data-media-grid>
                  {VIDEOS.map((v) => (
                    <div key={v.id} className="relative h-[142px] overflow-hidden rounded-[2px]" data-media-video>
                      <img src={SITE_PHOTOS[v.poster].src} alt={v.name} className="h-full w-full object-cover" />
                      <span className="absolute inset-0 grid place-items-center text-white"><GlyphPlay size={40} /></span>
                      <span className="absolute bottom-1.5 right-2 font-display text-[12px] font-medium text-white drop-shadow">{v.duration}</span>
                    </div>
                  ))}
                </div>
              )}
              {tab === 'audio' && <Empty>{t({ en: 'No audio files found', uk: 'Аудіофайлів не знайдено' })}</Empty>}
              {tab === 'docs' && <Empty>{t({ en: 'No documents found', uk: 'Документів не знайдено' })}</Empty>}
            </ScrollArea>

            {/* footer 64 — board 23383:32903: grid glyph 40 · Generate outlined · Upload Media white */}
            <div className="absolute inset-x-0 bottom-0 flex h-16 items-center justify-between bg-[var(--gray-850)] px-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,.04)]" data-media-footer>
              <button type="button" aria-label={t({ en: 'Grid', uk: 'Сітка' })} aria-pressed className="press-bloom grid h-10 w-10 place-items-center rounded-[10px] text-white hover:bg-[var(--white-100)]">
                <GlyphGridAll size={24} />
              </button>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={generate}
                  disabled={!canGenerate}
                  aria-busy={generating}
                  title={!pool.length ? t({ en: 'Every picture is already in the library', uk: 'Усі зображення вже в бібліотеці' }) : t({ en: `Generate a picture · ${IMAGE_COST} credits`, uk: `Згенерувати зображення · ${IMAGE_COST} кредитів` })}
                  className="press-bloom flex h-10 items-center gap-2 rounded-[10px] pl-5 pr-2.5 text-[14px] font-semibold text-white shadow-[inset_0_0_0_1px_var(--white-200)] transition-colors duration-150 hover:bg-[var(--white-100)] disabled:opacity-50 disabled:hover:bg-transparent"
                  data-media-generate
                >
                  {generating ? t({ en: 'Generating…', uk: 'Генерую…' }) : t({ en: 'Generate', uk: 'Згенерувати' })}
                  <GlyphStars size={24} className={generating ? 'animate-spin [animation-duration:1.6s]' : ''} />
                </button>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="press-bloom flex h-10 items-center gap-2 rounded-[10px] bg-[#fafafa] pl-5 pr-2.5 text-[14px] font-semibold text-[#09090b] transition-colors duration-150 hover:bg-[#e4e4e7]"
                  data-media-upload
                >
                  {t({ en: 'Upload Media', uk: 'Завантажити' })}
                  <GlyphUploadS size={24} />
                </button>
                <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void upload(e.target.files); e.target.value = '' }} data-media-file />
              </div>
            </div>
            {note && (
              <div className="absolute inset-x-4 bottom-[72px] rounded-[10px] bg-[var(--gray-750)] px-3 py-2 text-[13px] text-[var(--white-700)]" role="status" data-media-note>
                {note}
              </div>
            )}

            {/* the selection bar — `Image management bar` 23623:17060: 464 × 72 over the footer, rising like a sheet */}
            <AnimatePresence>
              {selecting && (
                <motion.div
                  key="bar"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0, transition: { type: 'spring', duration: 0.5, bounce: 0.22, opacity: { duration: 0.16 } } }}
                  exit={{ opacity: 0, y: reduce ? 0 : 16, transition: EXIT }}
                  onUpdate={keepOnMainThread}
                  className="absolute inset-x-2 bottom-[9px] flex h-[72px] items-center justify-between rounded-[16px] bg-[var(--gray-750)] p-4 shadow-[inset_0_0_0_1px_var(--gray-700),0_8px_32px_rgba(0,0,0,.5)]"
                  data-media-bar
                >
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMenu((m) => !m)}
                      aria-haspopup="menu"
                      aria-expanded={menu}
                      className="press-bloom flex h-10 items-center gap-[5px] rounded-[10px] pl-4 pr-1.5 text-[14px] font-semibold text-white hover:bg-[var(--white-100)]"
                      data-media-count
                    >
                      {t({ en: `${selected.length} selected`, uk: `Вибрано: ${selected.length}` })}
                      <GlyphArrowDown size={24} className={`transition-transform duration-200 ${menu ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {menu && (
                        <motion.div
                          key="menu"
                          role="menu"
                          initial={{ opacity: 0, scale: 0.94 }}
                          animate={{ opacity: 1, scale: 1, transition: SPRING }}
                          exit={{ opacity: 0, scale: 0.96, transition: EXIT }}
                          onUpdate={keepOnMainThread}
                          className="absolute bottom-[calc(100%+8px)] left-0 w-[180px] origin-bottom-left rounded-[10px] bg-[var(--gray-700)] p-1 shadow-[0_8px_32px_rgba(0,0,0,.5)]"
                          data-media-menu
                        >
                          <MenuRow onClick={() => { setSelected(ids); setMenu(false) }}>{t({ en: 'Select all', uk: 'Вибрати все' })}</MenuRow>
                          <MenuRow onClick={() => { setSelected([]); setMenu(false) }}>{t({ en: 'Clear selection', uk: 'Зняти вибір' })}</MenuRow>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={addToChat} aria-label={t({ en: 'Add to chat', uk: 'Додати в чат' })} title={t({ en: 'Add to chat', uk: 'Додати в чат' })} className="press-bloom grid h-10 w-10 place-items-center rounded-[16px] text-white hover:bg-[var(--white-100)]" data-media-chat>
                      <GlyphChatAddOn size={24} />
                    </button>
                    <button type="button" onClick={remove} aria-label={t({ en: 'Delete', uk: 'Видалити' })} title={t({ en: 'Delete', uk: 'Видалити' })} className="press-bloom grid h-10 w-10 place-items-center rounded-[10px] text-white hover:bg-[var(--white-100)]" data-media-delete>
                      <GlyphDelete size={24} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {lightbox !== null && items[lightbox] && (
              <Lightbox
                key="lightbox"
                items={items}
                index={lightbox}
                onClose={() => setLightbox(null)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="grid h-full min-h-[240px] place-items-center px-6 text-center text-[14px] text-[var(--white-480)]" data-media-empty>{children}</div>
}

function MenuRow({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className="press-bloom flex h-10 w-full items-center rounded-[8px] px-3 text-[14px] text-white hover:bg-[var(--white-100)]">
      {children}
    </button>
  )
}

/** The rail button's paint for App.tsx's `RAIL` — the same shape as the four state-sheet rows. */
export const MEDIA_RAIL: { tile: string; ink: string; style?: CSSProperties } = { tile: MEDIA_TILE, ink: MEDIA_INK }
