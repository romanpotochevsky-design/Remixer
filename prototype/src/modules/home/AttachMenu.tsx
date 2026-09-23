/**
 * THE COMPOSER'S ATTACH MENU — Figma 28726:64760, the `Menu` frame 30871:57297 (designer,
 * 21.09.2026: «в макете показано как выглядит дропдаун и как он открывается с выбором
 * прикрепить любой файл или прикрепить домен»; 23.09.2026, with a side-by-side of the board
 * and the build: «еще раз посмотри и сравни внимательно как выглядит и как расположен
 * дропдаун в макете и как у тебя… нужно добавить красивые и плавные анимации стильные в
 * нашем стиле для открытия и закрытия дропдауна»).
 *
 * WHAT THE BOARD DRAWS (re-read 23.09.2026 — it had moved since the 21.09 reading):
 *  · the menu's box sits EXACTLY ON THE "+" BUTTON'S BOX — `Menu` at (16, 112) inside the
 *    field, where `Buttons › Left` puts the 36 × 36 "+" at (16, 112). No offset: the menu
 *    covers the button it grew from, top-left corner to top-left corner. The 21.09 build read
 *    the (then) instance at +24 / +8 and left a sliver of the "+" showing beside the menu —
 *    the very thing the designer's screenshot pair points at;
 *  · `Gray/600` at radius 10, 2 px of side padding and 4 top and bottom, the drop shadow
 *    `0 8px 16px rgba(39,39,39,.33)`; rows are the kit's `-2 density`: 48 tall at radius 8,
 *    px 12, gap 12, a 24 leading element, the label 15/24 regular white. Two rows → 105 tall
 *    (4 + 48 + 1 + 48 + 4);
 *  · BOTH ROWS ARE WHITE. `Attach File` is drawn enabled, so it is enabled: it opens the
 *    browser's file picker, and the chosen file's NAME becomes a chip in the attachments bar
 *    (`ui.attachedFile`) — the same 36-tall glass the domain wears. Nothing downstream reads
 *    it (this prototype has no upload), exactly as nothing downstream reads the template's
 *    picture; a control that answers a press with a real object is not a dead one.
 *
 * WHAT THE BOARD DOES NOT DRAW, and is ours:
 *  · WHICH domain gets attached. The customer's own names live in `OWNED_DOMAINS[inventory]`
 *    — the same list the domains dashboard calls "Existing domains" — so `Attach Domain`
 *    replaces the two rows with that list rather than guessing a name. Same box, same
 *    motion, same 48-tall rows; a name is one press away. The names carry no subtitle (all
 *    four would read "In your DreamHost account"), and that level is 280 wide because a real
 *    name does not fit the drawn 208.
 *  · THE MOTION (ui/motion.ts § attach menu): the glass grows out of the "+" it covers — from
 *    the button's centre, .86 → 1 with one soft overshoot, rows a beat behind, the rim
 *    catching light for a second; it leaves in 140 ms, flat, back toward the same point.
 *    Changing level, the BOX resizes on a spring (208 × 105 → 280 × the list) while the rows
 *    hand over sequentially — the old list is gone before the new one comes, never two at once.
 *  · Hover is the house wash (8 % white) and the press the house bloom, on every row.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useT } from '@/i18n'
import { OWNED_DOMAINS } from '@/data/domains'
import { IconAttachFile, IconLanguage } from '@/ui/icons'
import { ATTACH_MENU_RESIZE, attachMenuIn, attachMenuInFade, popoverContent, stepSwap, stepSwapFade } from '@/ui/motion'

/** The kit's `-2 density` row and the menu's own inset, all the board's numbers. */
const ROW_H = 48
const ROW_GAP = 1
const PAD_Y = 4
/** The board's width for its two rows; the domain list is ours and needs a real name's width. */
const ROOT_W = 208
const LIST_W = 280
/** The menu's box for `n` rows: 105 for the board's two. */
const boxHeight = (n: number) => PAD_Y * 2 + n * ROW_H + Math.max(0, n - 1) * ROW_GAP
/** The "+" is 36 × 36 and the menu's corner is its corner, so the button's centre is (18, 18). */
const ORIGIN = 18
/** Air kept under the menu if the window is too short for it to open at the anchor. */
const VIEWPORT_PAD = 8
/**
 * ⚠️ A no-op `onUpdate` is the one prop that keeps motion 11 off WAAPI for an element
 * (AcceleratedAnimation.supports). A composited fade hands the element back with its
 * PRE-animation inline opacity for one frame between `finish` and the next render — filmed
 * on this menu before the stub: the glass at opacity 0 for a frame at 182 ms of its own
 * entrance, at 1 for a frame before unmount, and the domain list invisible for a frame at
 * 356 ms of the level change. Same lesson as the Publish panel's rolling verb.
 */
const keepOnMainThread = () => {}

/** One row of the kit's menu: a 24 leading element, 12 of air, the label — 48 tall at radius 8. */
function Row({
  icon, label, onClick, disabled,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      /* `press-bloom` is the house click and the hover plate is the house 8 % (the wash every
         glass control here lights by; the kit's 4 % is invisible on Gray/600). A disabled row
         — only the empty account's one line — takes neither: it is there to be read. */
      className={`press-bloom flex h-12 w-full items-center gap-3 rounded-[8px] px-3 text-left transition-colors duration-[var(--dur-fast)] ease-std ${
        disabled ? 'cursor-default opacity-40' : 'hover:bg-[var(--white-100)]'
      }`}
    >
      <span className="grid h-6 w-6 flex-none place-items-center text-white">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[15px] leading-[24px] text-white">{label}</span>
    </button>
  )
}

export function AttachMenu({ open, onClose, onDomain, onFile, anchor }: {
  open: boolean
  onClose: () => void
  onDomain: (domain: string) => void
  /** `Attach File` — the caller opens its file input. */
  onFile: () => void
  /** The "+" the menu grows out of; its box is read when the menu opens. */
  anchor: React.RefObject<HTMLElement | null>
}) {
  const { t } = useT()
  const reduce = useReducedMotion()
  const inventory = useWorld((s) => s.world.inventory)
  const owned = OWNED_DOMAINS[inventory] ?? []
  const [level, setLevel] = useState<'root' | 'domains'>('root')
  const [at, setAt] = useState<{ left: number; top: number } | null>(null)
  const box = useRef<HTMLDivElement>(null)

  const rows = level === 'root' ? 2 : Math.max(1, owned.length)
  const width = level === 'root' ? ROOT_W : LIST_W
  const height = boxHeight(rows)

  /*
   * ⚠️ IT IS A PORTAL, and that is what lets the board's placement be taken literally.
   * The hero is a clipped panel (`.home-hero`, `overflow: hidden` for its rings and dot
   * field), and a menu opening downward out of a "+" that sits 52px above the field's
   * bottom edge runs out of panel before the domain list ends — measured on the first
   * build: the third name sliced in half by the panel's edge. Out in `<body>` nothing
   * clips it, so the only thing left to respect is the window.
   */
  useLayoutEffect(() => {
    if (!open) { setAt(null); return }
    const place = () => {
      const a = anchor.current
      if (!a) return
      const r = a.getBoundingClientRect()
      setAt({
        left: r.left,
        /* Only ever pulled UP, and only by what the window is short of — against the box's
           TARGET height, because the box is still growing when this runs; at every size the
           prototype is shown at this is the board's number untouched. */
        top: Math.min(r.top, Math.max(VIEWPORT_PAD, window.innerHeight - VIEWPORT_PAD - height)),
      })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open, height, anchor])

  /* Every menu in this shell closes the same three ways: Escape, a click outside it, and a
     pick. Reset to the first level on the way out, so it never reopens mid-way down. */
  useEffect(() => {
    if (!open) { setLevel('root'); return }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
    const onDown = (e: PointerEvent) => {
      const el = box.current
      if (el && !el.contains(e.target as Node) && !(e.target as HTMLElement).closest('[data-attach-open]')) onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onDown) }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={box}
          role="menu"
          aria-label={t({ en: 'Attach to the prompt', uk: 'Прикріпити до промпту' })}
          variants={reduce ? attachMenuInFade : attachMenuIn}
          initial="initial"
          animate="animate"
          exit="exit"
          onUpdate={keepOnMainThread}
          /* It grows out of the "+" it covers: the button's centre is the menu's (18, 18). */
          style={{ transformOrigin: `${ORIGIN}px ${ORIGIN}px`, left: at?.left ?? -9999, top: at?.top ?? -9999, visibility: at ? undefined : 'hidden' }}
          className="fixed z-50"
        >
          {/* THE BOX — the board's Gray/600 at radius 10 with its shadow — resizes between the
              levels on a spring; its top-left corner, the one on the "+", never moves. The clip
              is what keeps the departing list inside while the box is still growing. */}
          <motion.div
            data-attach-box
            initial={false}
            animate={{ width, height }}
            transition={reduce ? { duration: 0 } : ATTACH_MENU_RESIZE}
            className="relative overflow-hidden rounded-[10px] bg-[var(--gray-600)] px-0.5 py-1 shadow-[0px_8px_16px_rgba(39,39,39,0.33)]"
          >
            {/* the rim catches the light as the glass arrives — the arriving-block signature */}
            {!reduce && <span className="glass-glint" aria-hidden />}
            <motion.div variants={popoverContent} onUpdate={keepOnMainThread} className="h-full">
              <AnimatePresence mode="popLayout" initial={false} custom={1}>
                <motion.div
                  key={level}
                  custom={1}
                  variants={reduce ? stepSwapFade : stepSwap}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onUpdate={keepOnMainThread}
                  className="flex flex-col gap-px"
                  style={{ width: width - 4 }}
                >
                  {level === 'root' ? (
                    <>
                      <Row
                        icon={<IconAttachFile size={24} />}
                        label={t({ en: 'Attach File', uk: 'Прикріпити файл' })}
                        onClick={() => { onFile(); onClose() }}
                      />
                      <Row
                        icon={<IconLanguage size={24} />}
                        label={t({ en: 'Attach Domain', uk: 'Прикріпити домен' })}
                        onClick={() => setLevel('domains')}
                      />
                    </>
                  ) : owned.length ? (
                    owned.map((d) => (
                      <Row
                        key={d.domain}
                        icon={<IconLanguage size={24} />}
                        label={d.domain}
                        onClick={() => { onDomain(d.domain); onClose() }}
                      />
                    ))
                  ) : (
                    <Row
                      icon={<IconLanguage size={24} />}
                      label={t({ en: 'No domains in this account', uk: 'У цьому акаунті немає доменів' })}
                      disabled
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
