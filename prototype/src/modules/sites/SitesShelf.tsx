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
 *   · the shelf is the canvas's home screen — a window in the house chrome, a title, a way to a
 *     new site (the Home page, where every site starts), and one card per site: its picture in a
 *     box cut to the CANVAS's aspect (the card is the canvas, smaller), its name, when it was
 *     touched. The card is the Home dock's project card in a second home; the picture of the live
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
import { IconPlus } from '@/ui/icons'
import { Thumb } from '@/modules/home/thumbs'
import { rectOf } from '@/modules/home/attachment'
import { SitePreview } from '@/modules/preview/SitePreview'
import { SiteMini } from './SiteMini'
import { CARD_RADIUS, SITE_RADIUS, closeShelf, flyIn, setParkGeometry, shelfO, shelfS, unparkNow } from './park'

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
  const aspect = canvas && canvas.height ? canvas.width / canvas.height : 1.375
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
    /* the shelf's own box at rest is the canvas box: same insets in the same parent */
    const aim = () => { const c = canvasBox(); const s = slotBox(world.site); if (c && s && root.current) setParkGeometry(c, restRect(s, root.current, c)) }
    setParkGeometry(from, restRect(slot, rootEl, from))
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
    setPick({ project, from: restRect(slot, root.current, to) })
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

  const title = t({ en: 'My projects', uk: 'Мої проєкти' })
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
     */
    <div ref={root} data-sites-clip className="absolute bottom-2 left-2 right-0 top-0 z-10 overflow-hidden rounded-[16px]">
    <motion.div
      data-sites-shelf
      role="dialog"
      aria-label={title}
      className="absolute inset-0 flex flex-col overflow-hidden rounded-[16px] bg-[var(--window-base)] shadow-[inset_0_0_0_1px_var(--gray-800)]"
      style={{ opacity: shelfO, scale: shelfS, transformOrigin: '50% 50%', willChange: 'transform, opacity' }}
    >
      {/* the title row: what this is, and the one way to a new site — the Home page, where every site starts */}
      <div className="flex flex-none items-center justify-between px-8 pb-4 pt-7">
        <h2 className="font-display text-[24px] font-semibold leading-[1.2] text-white">{title}</h2>
        <button
          type="button"
          data-sites-new
          onClick={() => goHome()}
          className="liquid-glass glass-interactive flex h-9 items-center gap-2 rounded-[10px] pl-3 pr-4 text-[13px] font-semibold text-white"
        >
          <IconPlus size={14} />
          {t({ en: 'New project', uk: 'Новий проєкт' })}
        </button>
      </div>
      <ScrollArea className="min-h-0 flex-1" thumb="light" innerClassName="px-8 pb-8 pt-2">
        <div
          data-sites-grid
          className="grid gap-6"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
        >
          {world.projects.map((p) => (
            <SiteCard
              key={p.id}
              project={p}
              aspect={aspect}
              current={p.id === world.site}
              /* the picture in the open site's slot is the parked site itself — the slot's own copy stays dark
                 so there is never a second one (reduced motion has no parked site, so it shows) */
              pictureHidden={p.id === world.site && !reduce}
              flying={pick?.project.id === p.id}
              onPick={() => choose(p)}
            />
          ))}
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

/**
 * The card — the Home dock's project card in a second home: the picture on top (here cut to the
 * canvas's aspect, since it is the canvas, smaller), a 56 meta bar with the name and when it was
 * touched. A hairline on the picture answers the pointer, as it does on the dock; the open site's
 * card wears the hairline at rest, as the one the builder stands in.
 */
function SiteCard({ project, aspect, current, pictureHidden, flying, onPick }: {
  project: HomeProject; aspect: number; current: boolean; pictureHidden: boolean; flying: boolean; onPick: () => void
}) {
  const { t } = useT()
  return (
    <div className="home-card-face group relative flex flex-col" data-site-card={project.id} data-site-current={current || undefined}>
      <div
        data-site-thumb
        className={`relative w-full overflow-hidden rounded-[12px] bg-[var(--gray-900)] transition-shadow duration-[var(--dur-fast)] ease-std ${
          current ? 'shadow-[inset_0_0_0_1px_var(--white-200)]' : 'group-hover:shadow-[inset_0_0_0_1px_var(--white-200)]'
        }`}
        style={{ aspectRatio: String(aspect) }}
      >
        {/* the picture: the live site itself, or the drawing — hidden while the real site sits in this
            slot, and while its clone is in the air */}
        <div className="absolute inset-0" style={{ visibility: pictureHidden || flying ? 'hidden' : undefined }} data-site-picture>
          {project.thumb === 'live' ? <SiteMini className="absolute inset-0" /> : <Thumb id={project.thumb} className="absolute inset-0" />}
        </div>
      </div>
      <div className="flex h-14 w-full flex-none items-center justify-between">
        <div className="flex min-w-0 flex-col gap-[5px] pb-px pl-1 pt-3">
          <p className="truncate font-display text-[16px] font-medium leading-[1.2] text-white">{project.name}</p>
          <p className="truncate text-[12px] leading-[1.4] text-[var(--white-480)]">{t(project.updatedLabel)}</p>
        </div>
      </div>
      <button
        type="button"
        data-site-open
        onClick={onPick}
        aria-label={current ? t({ en: `Back to ${project.name}`, uk: `Назад до ${project.name}` }) : t({ en: `Open ${project.name}`, uk: `Відкрити ${project.name}` })}
        aria-current={current || undefined}
        className="press-bloom absolute inset-0 rounded-[16px]"
      />
    </div>
  )
}

/**
 * THE PICKED CARD'S PICTURE, FLYING OUT TO THE CANVAS. Mounted at the DESTINATION (the canvas box) and
 * transformed back onto the card for its first frame — FLIP — so the settled frame needs no transform
 * and the content is laid out at the big end: a drawing at the canvas's width, or the live site at the
 * canvas's size, which is exactly what the stage renders once the pick lands (SiteStage.tsx). The
 * scale runs geometrically from card/canvas to 1, the translation from the fixed point; the radius
 * from the card's 12 to the stage's 16, divided by the scale. `FLIGHT_OPEN`: a surface arriving, flat.
 */
function PickFlight({ project, from, to, main, onLand }: {
  project: HomeProject; from: FlightRect; to: FlightRect; main: HTMLElement; onLand: () => void
}) {
  const p = useMotionValue(0)
  const mainBox = useMemo(() => main.getBoundingClientRect(), [main])
  const sx0 = to.width ? from.width / to.width : 1
  const sy0 = to.height ? from.height / to.height : 1
  const dx = from.left - to.left, dy = from.top - to.top
  const flatX = Math.abs(sx0 - 1) < 1e-3, flatY = Math.abs(sy0 - 1) < 1e-3
  const qx = flatX ? 0 : dx / (1 - sx0), qy = flatY ? 0 : dy / (1 - sy0)
  const sxAt = (v: number) => (flatX ? 1 : Math.pow(sx0, 1 - v))
  const syAt = (v: number) => (flatY ? 1 : Math.pow(sy0, 1 - v))
  const x = useTransform(p, (v) => (flatX ? dx * (1 - v) : qx * (1 - sxAt(v))))
  const y = useTransform(p, (v) => (flatY ? dy * (1 - v) : qy * (1 - syAt(v))))
  const scaleX = useTransform(p, sxAt)
  const scaleY = useTransform(p, syAt)
  const borderRadius = useTransform(p, (v) => {
    const k = Math.min(1, Math.max(0, v))
    const r = CARD_RADIUS + (SITE_RADIUS - CARD_RADIUS) * k
    return `${r / sxAt(v)}px / ${r / syAt(v)}px`
  })
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
        left: to.left - mainBox.left, top: to.top - mainBox.top, width: to.width, height: to.height,
        x, y, scaleX, scaleY, borderRadius, transformOrigin: '0 0', willChange: 'transform',
      }}
      aria-hidden
    >
      {project.thumb === 'live' ? (
        <div className="absolute inset-0"><SitePreview path="/" /></div>
      ) : (
        <div className="relative w-full" style={{ aspectRatio: '233.333 / 218' }}>
          <Thumb id={project.thumb} className="absolute inset-0" />
        </div>
      )}
    </motion.div>
  )
}
