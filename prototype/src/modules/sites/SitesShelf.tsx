/**
 * THE SHELF OF THE CUSTOMER'S SITES — the surface behind the site's name in the chat header
 * (SiteSwitch.tsx), on the canvas, in place of the site.
 *
 * Designer, 25.09.2026, with a recording of the live editor: «клик по названию сайта… должен с
 * прикольной анимацией открывать список, анимация типа такой как на айфоне когда ты нажимаешь на
 * иконку приложения из нее сайт вылетает на весь экран… чтобы сайт очень красиво, плавно и круто в
 * стиле apple liquid glass вот так улетал в список и на сайт на который другой нажмешь он с
 * анимацией вылетал на весь экран превью сайта… на видео есть пример этого, но оно реализовано
 * плохо и некачественно». What the recording does (frame by frame, 51.6 fps): the canvas fades
 * out over ~150 ms into a Projects page; a picked card's stock screenshot scales up over ~150 ms
 * and crossfades into the real site, visibly a different picture; a switch then holds a dark
 * canvas with a violet glow for over a second while the site loads.
 *
 * OURS:
 *   · the shelf is the canvas's home screen — LAID OUT OFF ITS BOARD, 31164:75936 (29.09.2026: «сделать
 *     дизайн списка сайтов… перфект пиксель как в макете»): from the top of the canvas column (the
 *     toolbar steps aside, park.ts `toolbarP`), «Projects» in Gilroy 32, the blue `New Project +` and
 *     a tonal ✕; a grid of 320 cards 32 apart — each site's picture (its top, at the card's width,
 *     the rest cropped), its name, when it was touched, a kebab — then a dashed slot with a round
 *     `+`, then dashed empty slots filling out the rows. The card is the Home dock's project card in a second home; the picture of the live
 *     site is the site itself (SiteMini.tsx), a drawing for the rest.
 *   · OPENING flies the real site layer into its own card and leaves it there as the card's
 *     picture (park.ts) while the shelf comes into place from slightly larger behind it — the
 *     app closing into its icon. No clone, no crossfade, no second picture.
 *   · PICKING another site flies THAT card's picture out to the canvas (a clone laid out at the
 *     canvas's width, so the small end is where any mismatch lands — the template flight's
 *     rule), and on landing the builder simply IS that site: `world.site` moves, the site layer
 *     un-parks under the identical clone, the shelf goes. The glow then marks the load, once,
 *     as it marks every preview arriving. Picking the site that is open closes the shelf the way
 *     it opened, in reverse.
 *   · Esc, the header's name and the open card all close it.
 *
 * Reduced motion: no flight — the shelf fades in over the site, the site fades out, the card
 * shows its own picture, a pick swaps and fades back.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useWorld, type HomeProject } from '@/state/world'
import { useUI, type FlightRect } from '@/state/ui'
import { useT } from '@/i18n'
import { FLIGHT_OPEN } from '@/ui/motion'
import { ScrollArea } from '@/ui/ScrollArea'
import { IconAdd, IconCloseM, IconMoreVertical } from '@/ui/icons'
import { Thumb } from '@/modules/home/thumbs'
import { rectOf } from '@/modules/home/attachment'
import { SitePreview } from '@/modules/preview/SitePreview'
import { SiteMini } from './SiteMini'
import { CARD_RADIUS, SITE_RADIUS, cardClip, closeShelf, flyIn, headO, headY, pickAway, setParkGeometry, shelfO, shelfS, unparkNow } from './park'

/** The canvas box the site stands in — measured, so the cards cut to its aspect and the flight lands on it. */
const canvasBox = (): FlightRect | null => {
  const el = document.querySelector<HTMLElement>('[data-canvas-site]')
  return el ? rectOf(el) : null
}
/** A card's picture box, by site id. */
const slotBox = (id: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[data-site-card="${id}"] [data-site-thumb]`)
/**
 * WHERE A SLOT STANDS WHEN THE SHELF IS AT REST — not where it is right now. The shelf approaches
 * from 1.05 and recedes to 1.04 (`shelfS`), so a slot's `getBoundingClientRect` read while it moves
 * is the slot scaled about the shelf's centre, and a site aimed at that lands off its card (traced:
 * 44 px left and 8 % large, off a re-measure that fired mid-flight). The rest position is the
 * offset chain up to the shelf's root plus the root's own untransformed box — the canvas — less any
 * scroll between them; the same reading the pane's flyer takes for its seat (`restWithin`).
 */
function restRect(el: HTMLElement, root: HTMLElement, rootBox: FlightRect): FlightRect {
  let x = 0, y = 0
  for (let node: HTMLElement | null = el; node && node !== root; node = node.offsetParent as HTMLElement | null) {
    x += node.offsetLeft
    y += node.offsetTop
  }
  /* offsets ignore scrolling: take off what every scroller between the slot and the root has scrolled */
  for (let p = el.parentElement; p && p !== root; p = p.parentElement) { x -= p.scrollLeft; y -= p.scrollTop }
  return { left: rootBox.left + x, top: rootBox.top + y, width: el.offsetWidth, height: el.offsetHeight }
}

/** How long the pick clone stands on the landed site before the shelf goes (two painted frames). */
const LAND_FRAMES = 2
/** The glow marking the switched site's arrival — the reload's own pulse, shortened. */
const SWITCH_GLOW_MS = 2200

export function SitesShelf() {
  const { t } = useT()
  const reduce = useReducedMotion() ?? false
  const world = useWorld((s) => s.world)
  const { goHome, closeSurface, setPreviewPath, triggerReload } = useUI()
  const set = useWorld((s) => s.set)
  const preset = useWorld((s) => s.preset)
  const root = useRef<HTMLDivElement>(null)
  const [canvas] = useState<FlightRect | null>(() => canvasBox())
  const [pick, setPick] = useState<{ project: HomeProject; from: FlightRect } | null>(null)
  const landing = useRef(false)

  /* THE SITE CLOSES INTO ITS CARD. Measured in a layout effect, before the first paint: the grid has
     laid its cards out, the shelf still stands at scale 1 (its approach starts in `flyIn`), so the
     slot's box is the one the site lands on when both have settled. A slot that moves (a resize
     re-columns the grid) re-aims the parked site. */
  useLayoutEffect(() => {
    const from = canvas
    const slot = slotBox(world.site)
    const rootEl = root.current
    if (!from || !slot || !rootEl) { flyIn(true); return }
    /* the shelf's clip is never transformed (the scale rides the element inside it), so its own box IS
       its rest box — the canvas plus the toolbar band above it, which the shelf now covers (the board
       draws the list from the column's top) */
    const aim = () => { const c = canvasBox(); const s = slotBox(world.site); if (c && s && root.current) setParkGeometry(c, restRect(s, root.current, rectOf(root.current))) }
    setParkGeometry(from, restRect(slot, rootEl, rectOf(rootEl)))
    flyIn(reduce)
    const ro = new ResizeObserver(aim)
    ro.observe(slot)
    window.addEventListener('resize', aim)
    return () => { ro.disconnect(); window.removeEventListener('resize', aim) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Esc closes, the way it opened */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !pick) { e.preventDefault(); closeShelf(reduce) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reduce, pick])

  /* A card was pressed. The open site's card closes the shelf; another site's flies out. */
  const choose = (project: HomeProject) => {
    if (pick || landing.current) return
    if (project.id === world.site) { closeShelf(reduce); return }
    const slot = slotBox(project.id)
    const to = canvasBox()
    if (!slot || !to || !root.current || reduce) { land(project); return }
    pickAway(false)
    setPick({ project, from: restRect(slot, root.current, rectOf(root.current)) })
  }

  /* THE PICK LANDS. One commit makes the builder that site — `set({ site })` swaps the per-site slice
     (world.ts), the layer un-parks to full size, the preview stands on its home page — under a clone
     that shows the same pixels; two frames later the shelf and the clone go together, and the glow
     marks the arrival. Deferred, because the un-park is a motion value the compositor applies on its
     next frame while React's commit is synchronous: removing the clone in the same commit could leave
     one frame of the shelf showing through under a still-small site. */
  const land = (project: HomeProject) => {
    if (landing.current) return
    landing.current = true
    set({ site: project.id }, preset)
    setPreviewPath('/')
    unparkNow()
    let n = 0
    const step = () => {
      if (++n < LAND_FRAMES) { requestAnimationFrame(step); return }
      closeSurface()
      triggerReload(SWITCH_GLOW_MS)
    }
    requestAnimationFrame(step)
  }

  const title = t({ en: 'Projects', uk: 'Проєкти' })
  /* the grid's column count, read off its own width — the empty slots fill whole rows (see EmptySlot) */
  const grid = useRef<HTMLDivElement>(null)
  const [cols, setCols] = useState(5)
  useLayoutEffect(() => {
    const el = grid.current
    if (!el) return
    const read = () => setCols(Math.max(1, Math.floor((el.clientWidth + GAP) / (CARD_MIN + GAP))))
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const filled = world.projects.length + 1
  const slots = Math.max(cols * MIN_ROWS, Math.ceil(filled / cols) * cols) - filled
  const main = root.current?.closest('main') ?? null

  return (
    /*
     * THE APPROACH HAPPENS INSIDE THE FRAME. The shelf comes into place from 1.05 and recedes to 1.04, and
     * a scaled box is larger than its seat: unclipped, its top edge rode ~20 px up over the canvas toolbar
     * and covered the bottom of Publish and the credits pill for the length of the approach (the designer's
     * screenshot, 25.09.2026: «у анимации есть вот такие визуальные баги»). So the scaling shelf sits inside
     * a clip cut to the canvas box with the window's own radius — the way the iPhone's home screen zooms
     * behind a closing app WITHIN the screen, never over its bezel. The clip is the outer element; the
     * opacity and scale ride the inner one, which is what the suite films as `[data-sites-shelf]`.
     *
     * NO PLATE UNDER THE SHELF (designer, 25.09.2026, with a screenshot of the list on the bare ground:
     * «этому экрану со списком сайтов серый фон вообще не нужен, список не находится внутри дива с серым
     * фоном, он просто на чёрном общем фоне сайта»). The first cut wore the canvas windows' chrome — the
     * `--window-base` plate under a `gray-800` hairline. This is not a window; it is the shell's own ground
     * with the customer's sites on it, so the shelf paints nothing of its own: the cards and the title sit
     * on `--gray-950`, and the clip stays invisible (it only cuts the approach to the canvas box).
     */
    <div ref={root} data-sites-clip className="absolute bottom-2 left-2 right-0 z-10 overflow-hidden rounded-[16px]" style={{ top: 'calc(-1 * var(--topbar-h))' }}>
    <motion.div
      data-sites-shelf
      role="dialog"
      aria-label={title}
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ opacity: shelfO, scale: shelfS, transformOrigin: '50% 50%', willChange: 'transform, opacity' }}
    >
      {/* THE TITLE ROW (`Title` 31164:77049) — it takes the band the toolbar just left, a beat after (park.ts `headO`).: 96 tall under 4 px, the title's cap band and the 40 buttons on one
          centre line. The clip stands 8 in from the column's edge where the board's list stands at it, so the
          board's 32 is 24 here on the left — the title lands on the board's x. */}
      <motion.div data-sites-head className="flex h-24 flex-none items-center justify-between pl-6 pr-8" style={{ marginTop: 4, opacity: headO, y: headY }}>
        <h2 className="font-display text-[32px] font-semibold leading-[1.4] text-white [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">{title}</h2>
        <div className="flex items-start gap-4">
          {/* Filled / Blue / Medium, icon right (31164:77085): 40, r10, pl 20 · pr 8, gap 7, 14 semibold + Add 24 */}
          <button
            type="button"
            data-sites-new
            onClick={() => goHome()}
            className="press-bloom flex h-10 items-center gap-[7px] rounded-[10px] bg-[var(--action)] pl-5 pr-2 text-[14px] font-semibold leading-none text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)] active:bg-[var(--action-pressed)]"
          >
            {t({ en: 'New Project', uk: 'Новий проєкт' })}
            <IconAdd size={24} />
          </button>
          {/* Tonal / White (31168:84635): 40, r10 on Neutral Alpha/100, Close M 24 */}
          <button
            type="button"
            data-sites-close
            onClick={() => closeShelf(reduce)}
            aria-label={t({ en: 'Close projects', uk: 'Закрити проєкти' })}
            className="press-bloom grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--white-100)] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-200)]"
          >
            <IconCloseM size={24} />
          </button>
        </div>
      </motion.div>
      <ScrollArea className="min-h-0 flex-1" thumb="light" innerClassName="pb-8 pl-6 pr-8">
        {/* THE LIST (31164:77087): columns of equal width, 32 between them and between rows. The board sets five
            across 2008 (376 each); the columns here are as many as fit at ≥ 312, which is exactly five at the
            board's width and still five of 376 there, and fewer, never thinner, on a smaller canvas. */}
        <div
          ref={grid}
          data-sites-grid
          className="grid"
          style={{ gap: GAP, gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_MIN}px, 1fr))` }}
        >
          {world.projects.map((p) => (
            <SiteCard
              key={p.id}
              project={p}
              current={p.id === world.site}
              /* the picture in the open site's slot is the parked site itself — the slot's own copy stays dark
                 so there is never a second one (reduced motion has no parked site, so it shows) */
              pictureHidden={p.id === world.site && !reduce}
              flying={pick?.project.id === p.id}
              onPick={() => choose(p)}
            />
          ))}
          <NewSlot onPick={() => goHome()} label={t({ en: 'New project', uk: 'Новий проєкт' })} />
          {Array.from({ length: slots }, (_, i) => <EmptySlot key={i} />)}
        </div>
      </ScrollArea>
      {/* the picked card's picture, in the air toward the canvas — above the shelf AND the parked site,
          in the canvas's own coordinates */}
      {pick && main && canvas && createPortal(
        <PickFlight project={pick.project} from={pick.from} to={canvas} main={main} onLand={() => land(pick.project)} />,
        main,
      )}
    </motion.div>
    </div>
  )
}

/** The board's card: 320 tall, a 9 gap, a 43 meta row — the picture takes the rest (268 at the drawn width). */
const CARD_H = 320
const GAP = 32
const CARD_MIN = 312
/** At least this many rows of slots — the board draws four (the last one cut by the canvas's foot). */
const MIN_ROWS = 4

/** The dashed rim of an open slot — an SVG rect, as on the Home dock (the browser's dashed border is ≈3/3, the
    board's ≈6/6), `Neutral Alpha/200` = 12 % white in the dark theme, r16. */
function DashedRim() {
  return (
    <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" style={{ width: 'calc(100% - 1px)', height: 'calc(100% - 1px)' }} aria-hidden>
      <rect x="0.5" y="0.5" width="100%" height="100%" rx="15.5" fill="none" stroke="#ffffff1f" strokeWidth="1" strokeDasharray="6 6" />
    </svg>
  )
}

/** The slot that starts a site (31164:77117): the rim and, at its centre, the kit's Filled / Round / Large icon
    button — 48 on Neutral Alpha/200 with Add 24. A new site starts where every site starts: the Home page. */
function NewSlot({ onPick, label }: { onPick: () => void; label: string }) {
  return (
    <div data-sites-new-slot className="relative grid place-items-center" style={{ height: CARD_H }}>
      <DashedRim />
      <button
        type="button"
        onClick={onPick}
        aria-label={label}
        className="press-bloom grid h-12 w-12 place-items-center rounded-full bg-[var(--white-200)] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-300)]"
      >
        <IconAdd size={24} />
      </button>
    </div>
  )
}

/** The board's empty slots (31164:77119 and on): the card with every child at opacity 0 and a dashed rim — an
    empty box. Inert: what they mean (room for more sites, or filler) is not drawn, so nothing is invented. */
function EmptySlot() {
  return (
    <div data-sites-empty className="relative" style={{ height: CARD_H }} aria-hidden>
      <DashedRim />
    </div>
  )
}

/**
 * THE CARD (`Website` 31164:77096): 320 tall — the picture on top taking what the 43 meta row and the 9 gap
 * leave (268 at the board's width), r12 and clipped; below it the name (Gilroy Medium 18, white) over when it
 * was touched (12 / 1.4 at 48 %), 4 in from the edge, and the kit's standard icon button with the kebab.
 *
 * THE PICTURE IS THE SITE AT THE CARD'S WIDTH, TOP-ALIGNED, THE REST CROPPED — the board's `image 383` is the
 * full width of its box at its own aspect under an overflow clip, the Home dock's rule. So the live site is its
 * miniature laid out at a desktop width (SiteMini), and a drawn one is its drawing at full width, exactly as
 * the canvas shows it (SiteStage): one picture at two scales, which is what the flights need at both ends.
 *
 * A hairline on the picture answers the pointer; the open site's card wears it at rest.
 */
function SiteCard({ project, current, pictureHidden, flying, onPick }: {
  project: HomeProject; current: boolean; pictureHidden: boolean; flying: boolean; onPick: () => void
}) {
  const { t } = useT()
  return (
    <div className="home-card-face group relative flex flex-col gap-[9px]" style={{ height: CARD_H }} data-site-card={project.id} data-site-current={current || undefined}>
      <div
        data-site-thumb
        className={`relative min-h-0 w-full flex-1 overflow-hidden rounded-[12px] bg-[var(--gray-900)] transition-shadow duration-[var(--dur-fast)] ease-std ${
          current ? 'shadow-[inset_0_0_0_1px_var(--white-200)]' : 'group-hover:shadow-[inset_0_0_0_1px_var(--white-200)]'
        }`}
      >
        {/* the picture: the live site itself, or the drawing — hidden while the real site sits in this
            slot, and while its clone is in the air */}
        <div className="absolute inset-0" style={{ visibility: pictureHidden || flying ? 'hidden' : undefined }} data-site-picture>
          {project.thumb === 'live' ? (
            <SiteMini className="absolute inset-0" />
          ) : (
            <div className="relative w-full" style={{ aspectRatio: DRAWING_ASPECT }}>
              <Thumb id={project.thumb} className="absolute inset-0" />
            </div>
          )}
        </div>
      </div>
      <div className="flex w-full flex-none items-center justify-between">
        <div data-site-meta className="flex min-w-0 flex-col gap-[5px] pl-1">
          <p className="truncate font-display text-[18px] font-medium leading-[21px] text-white">{project.name}</p>
          <p className="truncate text-[12px] leading-[17px] text-[var(--white-480)]">{t(project.updatedLabel)}</p>
        </div>
        {/* the kit's standard icon button (22567:70588): its container shows only when touched. What the menu
            holds is not drawn, so it stays a button without one (the Home dock's card does the same). */}
        <button
          type="button"
          data-site-more
          aria-label={t({ en: 'Project options', uk: 'Дії з проєктом' })}
          className="press-bloom relative z-10 grid h-10 w-10 flex-none place-items-center rounded-[10px] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
        >
          <IconMoreVertical size={20} />
        </button>
      </div>
      <button
        type="button"
        data-site-open
        onClick={onPick}
        aria-label={current ? t({ en: `Back to ${project.name}`, uk: `Назад до ${project.name}` }) : t({ en: `Open ${project.name}`, uk: `Відкрити ${project.name}` })}
        aria-current={current || undefined}
        className="press-bloom absolute inset-0 rounded-[12px]"
      />
    </div>
  )
}

/** A drawn site's picture — the drawing's own proportion (thumbs.tsx), shown at full width. */
const DRAWING_ASPECT = '233.333 / 218'

/**
 * THE PICKED CARD'S PICTURE, FLYING OUT TO THE CANVAS. Mounted at the DESTINATION (the canvas box) and
 * transformed back onto the card for its first frame — FLIP — so the settled frame needs no transform and the
 * content is laid out at the big end: the drawing at the canvas's width, or the live site at the canvas's
 * size, which is exactly what the stage renders once the pick lands (SiteStage.tsx). ONE scale, card width to
 * canvas width, geometric; the translation from the fixed point; the lower part the card crops is clipped
 * and opens as it grows (`cardClip`, the park's own), the radius going from the card's 12 to the stage's 16.
 */
function PickFlight({ project, from, to, main, onLand }: {
  project: HomeProject; from: FlightRect; to: FlightRect; main: HTMLElement; onLand: () => void
}) {
  const p = useMotionValue(0)
  const mainBox = useMemo(() => main.getBoundingClientRect(), [main])
  const s0 = to.width ? from.width / to.width : 1
  const dx = from.left - to.left, dy = from.top - to.top
  const flat = Math.abs(s0 - 1) < 1e-3
  const qx = flat ? 0 : dx / (1 - s0), qy = flat ? 0 : dy / (1 - s0)
  const sAt = (v: number) => (flat ? 1 : Math.pow(s0, 1 - v))
  /* what the card shows of the page, in canvas pixels — more than the canvas's height when the card is the
     taller shape, so the clone stands that tall and the clip closes it down to the canvas as it lands */
  const visH0 = s0 ? from.height / s0 : to.height
  const cloneH = Math.max(to.height, visH0)
  const x = useTransform(p, (v) => (flat ? dx * (1 - v) : qx * (1 - sAt(v))))
  const y = useTransform(p, (v) => (flat ? dy * (1 - v) : qy * (1 - sAt(v))))
  const scale = useTransform(p, sAt)
  const clipPath = useTransform(p, (v) => cardClip(cloneH, visH0, to.height, sAt(v), v, CARD_RADIUS, SITE_RADIUS))
  useEffect(() => {
    const run = animate(p, 1, { ...FLIGHT_OPEN, onComplete: onLand })
    return () => run.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <motion.div
      data-site-flight={project.id}
      className="pointer-events-none absolute z-30 overflow-hidden bg-[var(--gray-900)]"
      style={{
        left: to.left - mainBox.left, top: to.top - mainBox.top, width: to.width, height: cloneH,
        x, y, scale, clipPath, transformOrigin: '0 0', willChange: 'transform',
      }}
      aria-hidden
    >
      {project.thumb === 'live' ? (
        <div className="absolute inset-0"><SitePreview path="/" /></div>
      ) : (
        <div className="relative w-full" style={{ aspectRatio: DRAWING_ASPECT }}>
          <Thumb id={project.thumb} className="absolute inset-0" />
        </div>
      )}
    </motion.div>
  )
}
