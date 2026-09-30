/**
 * THE SITE'S TWO KINDS OF EDITABLE THING — a text run (`T`) and a photo slot (`Photo`) — and the
 * context that tells them what to say and whether the Visual Editor is on.
 *
 * Outside the editor they render PLAIN: a `<Tag>` with the resolved string, an `<img>` in a box —
 * no wrappers, no refs, no effects (the architecture review's point: every extra host raises the
 * cost of every page swap, every mini on the shelf, every pick-flight clone). Only the canvas
 * instance with a tool on turns them into hosts:
 *  · `edit`   — `T` becomes a contentEditable host (EditableText), `Photo` grows its "Replace
 *               photo" button and opens the Image panel;
 *  · `select` — both carry `data-pick`, the overlay rings them, a click hands the key to the chat.
 *
 * `edits` is ALREADY MERGED by SitePreview: saved layer under the staged draft for the canvas,
 * saved layer alone for a picture of another site. The parts never touch a store for the text —
 * they read the context, so a mini and the canvas resolve the same key the same way.
 */
import { createContext, useContext, type CSSProperties, type ElementType } from 'react'
import { EMPTY_SITE_AI, EMPTY_SITE_EDITS, type SiteAi, type SiteEdits } from '@/state/world'
import { EditableText } from '@/modules/editor/EditableText'
import { useEditor } from '@/modules/editor/session'
import { getUpload } from '@/modules/editor/media'
import { GlyphReplacePhoto } from '@/modules/editor/icons'
import { SITE_PHOTOS } from './photos'
import { fitOf, heightOf, opacityOf, photoOf, textOf } from './content'

export interface SiteCtx {
  /** The text and photo layer — the customer's, over Remixer's rewrites (already merged). */
  edits: SiteEdits
  /** Remixer's own layer: which added blocks are in, which palette (modules/versions/changes.ts). */
  ai: SiteAi
  /** The Edit tool is on, and this is the canvas instance. */
  editing: boolean
  /** The Select tool is on, and this is the canvas instance. */
  selecting: boolean
}

export const SiteContext = createContext<SiteCtx>({ edits: EMPTY_SITE_EDITS, ai: EMPTY_SITE_AI, editing: false, selecting: false })

/** One text run of the site, by its content key. `compiled` overrides the table's default (a
 *  dish name comes from the Cloud row, a page title from the plan). */
export function T({
  k, as: Tag = 'p', className, style, compiled,
}: {
  k: string
  as?: ElementType
  className?: string
  style?: CSSProperties
  compiled?: string
}) {
  const ctx = useContext(SiteContext)
  const text = textOf(ctx.edits, k, compiled)
  if (ctx.editing) return <EditableText k={k} as={Tag} className={className} style={style} value={text} />
  if (ctx.selecting) return <Tag className={className} style={style} data-pick={k}>{text}</Tag>
  return <Tag className={className} style={style}>{text}</Tag>
}

/** Where a `PhotoRef` resolves to pixels — the site's own picture, an upload this browser holds,
 *  or (an upload from another machine, a cleared store) the slot's default picture. */
export function photoSrc(edits: SiteEdits, k: string): { src: string; alt: string } | null {
  const ref = photoOf(edits, k)
  if (ref.kind === 'upload') {
    const up = getUpload(ref.id)
    if (up) return { src: up, alt: ref.name }
  }
  const fallback = ref.kind === 'site' ? SITE_PHOTOS[ref.id] : null
  const site = fallback ?? SITE_PHOTOS[photoOf(EMPTY_SITE_EDITS, k).kind === 'site' ? (photoOf(EMPTY_SITE_EDITS, k) as { id: string }).id : '']
  return site ? { src: site.src, alt: site.alt } : null
}

/**
 * One photo slot. `className` sizes the box (the card's `h-28`, the About page's `min-h-[260px]`…);
 * the picture fills it under the customer's Fill / Fit and opacity. `tint` + `emoji` are the slot's
 * drawn stand-in for when no picture resolves at all.
 */
export function Photo({
  k, className = '', style, tint, emoji, emojiSize = 40,
}: {
  k: string
  className?: string
  style?: CSSProperties
  tint?: string
  emoji?: string
  emojiSize?: number
}) {
  const ctx = useContext(SiteContext)
  const openPanel = useEditor((s) => s.openPanel)
  const panelOpen = useEditor((s) => s.panel === k)
  const pic = photoSrc(ctx.edits, k)
  const fit = fitOf(ctx.edits, k)
  const opacity = opacityOf(ctx.edits, k)
  const height = heightOf(ctx.edits, k)
  const box = `relative overflow-hidden ${className}`
  /* a height the customer set wins over the slot's class (`h-28`, `min-h-[260px]`) */
  style = height ? { ...style, height, minHeight: height } : style
  const picture = pic ? (
    <img
      src={pic.src}
      alt={pic.alt}
      draggable={false}
      className="absolute inset-0 h-full w-full"
      style={{ objectFit: fit === 'fit' ? 'contain' : 'cover', opacity: opacity / 100 }}
    />
  ) : (
    <span className="absolute inset-0 grid place-items-center" style={{ background: tint, fontSize: emojiSize }} aria-hidden>
      {emoji}
    </span>
  )
  if (ctx.editing) {
    return (
      <div
        className={`${box} ve-photo`}
        style={style}
        data-edit={k}
        data-edit-kind="photo"
        data-panel-open={panelOpen ? '' : undefined}
        role="button"
        tabIndex={0}
        aria-label="Replace photo"
        onClick={(e) => { e.stopPropagation(); openPanel(k) }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(k) } }}
      >
        {picture}
        {/* the affordance: the house glass pill, centred, shown by the host's :hover (CSS, no React
            state on hover — the card-hover rule) and while the panel is open */}
        <span className="ve-replace liquid-glass" aria-hidden>
          <GlyphReplacePhoto size={18} />
          <span>Replace photo</span>
        </span>
      </div>
    )
  }
  if (ctx.selecting) {
    return (
      <div className={box} style={style} data-pick={k}>
        {picture}
      </div>
    )
  }
  return (
    <div className={box} style={style}>
      {picture}
    </div>
  )
}
