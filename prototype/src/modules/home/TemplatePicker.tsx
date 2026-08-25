/**
 * The fullscreen template picker — Figma 28616:59168, the popup behind the Home
 * composer's "Add template" pill. Pixel source:
 * docs/features/home-page/figma-spec-add-template.md — every number below is
 * traceable to a node id there.
 *
 * Anatomy, as drawn at 1656 × 1196:
 *   · scrim — 50% black over the whole page, topbar and dock included (the
 *     domain checkout sheet uses 70%; two strengths now exist — spec §10.10)
 *   · sheet — a uniform 16px inset from every viewport edge, radius 16, opaque
 *     `Gray/900` #18181b, overflow clipped; NO border, shadow or backdrop blur
 *   · close — 40×40, radius 12 (the Build button's radius, not the composer
 *     circles'), 16px from the sheet's top-right corner
 *   · content column — the sheet minus its drawn 32px side insets (1560 at the
 *     design size): heading (57 above the cap, 40 below), the dock's category
 *     chips (16 above, 32 below), then a 6-column grid of the dock's template
 *     card at 233.333 × 272 with 32px gaps — 18 cards, third row fully visible
 *     with 81px of sheet below it at the drawn size
 *
 * AWAY FROM THE DESIGN SIZE the column is FLUID: the 32px insets hold and the
 * six columns stretch, so the grid fills the window instead of parking in the
 * middle of it (the capped 1560 column left 484px of dead ground either side at
 * 2560). Card width is the column's output at every width, and the card's HEIGHT
 * follows from the thumbnail's drawn ratio, so the whole card grows in
 * proportion while its caption keeps the drawn type. Geometry and the reasoning
 * for holding six columns on very wide screens: `.tplpick-grid` in index.css.
 *
 * The board draws no scroll state (spec §10.3), but 18 cards fit the drawn
 * height exactly and a library will not stay at 18 — so the sheet body scrolls
 * through the house `ScrollArea` when the viewport is shorter than the design,
 * and on a wide one, where the taller cards outgrow the sheet. At the drawn
 * 1656 × 1196 nothing scrolls, as drawn.
 *
 * MOTION (nothing is drawn — spec §9; house language from motion.ts): the
 * sheet springs in with its transform-origin at the "Add template" pill, so
 * the surface visibly grows out of the control that summoned it; the scrim
 * fades on the same beat; the content column lands ~60ms later as ONE block —
 * 18 individually-springing cards would be 18 layers of cost and pure noise.
 * Exit is faster than entry and never bounces. Transform/opacity only; the
 * sheet carries no backdrop-filter (it is the biggest surface the product
 * moves — the one static blur here is the 40px close button's, which the spec
 * draws and the budget does not feel).
 */
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useUI } from '@/state/ui'
import { useT } from '@/i18n'
import { libraryIn, type TemplateCategoryId } from '@/data/templates'
import { ScrollArea } from '@/ui/ScrollArea'
import { IconClose } from '@/ui/icons'
import { modalScrim, fullscreenSheet, fullscreenContent } from '@/ui/motion'
import { CategoryChips, TemplateCard } from './Dock'

/** The sheet's inset from every viewport edge (board: (16, 16) 1624 × 1164). */
const SHEET_INSET = 16

/** Everything the browser lets you Tab to inside the sheet. */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

export function TemplatePicker() {
  const open = useUI((s) => s.templatePickerOpen)
  const close = useUI((s) => s.closeTemplatePicker)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  return <AnimatePresence>{open && <PickerOverlay onClose={close} />}</AnimatePresence>
}

function PickerOverlay({ onClose }: { onClose: () => void }) {
  const { t } = useT()
  const attach = useUI((s) => s.attachTemplate)
  const sheet = useRef<HTMLDivElement>(null)
  /* Set the moment a card is picked, so the focus restore below knows to stand
     down: the composer's own effect puts the caret back in the field after a
     pick, and two owners fighting over focus 200ms apart reads as a glitch. */
  const picked = useRef(false)

  /* The board draws "All templates" active. Per-open state, not the store:
     this overlay remounts on every open, so each open starts where the board
     does instead of inheriting the dock's filter (or a previous visit's). */
  const [filter, setFilter] = useState<TemplateCategoryId>('all')

  /*
   * True until the entrance spring lands. While it is, the cards' hover ring
   * gets a zero duration (`--card-hover-dur`), because the sheet arriving under
   * a parked cursor leaves one card hovered without the pointer ever moving —
   * and a ring fading itself in on a surface that is still growing reads as the
   * grid glitching. See the note on the ring in Dock.tsx's TemplateCard. One
   * boolean, flipped once by the spring's own completion: no timers to keep in
   * step with the motion tokens, and nothing per frame.
   */
  const [entering, setEntering] = useState(true)

  /*
   * FOCUS. This is `aria-modal` over the whole page, which makes a screen
   * reader hide everything behind it — so leaving the keyboard out there is
   * worse than not claiming to be modal at all. Measured before this existed:
   * opening from the pill left focus ON the pill (under the scrim), and one Tab
   * went to the composer's mic — the six chips, eighteen cards and the ✕ were
   * unreachable without Tabbing the whole page behind the sheet first.
   *
   * So: focus lands on the sheet itself (not the first chip — the sheet's
   * label is what should be announced), Tab cycles inside it, and on the way
   * out focus returns to the control that opened it. The restore runs in the
   * unmount cleanup, i.e. after the exit spring, which is also the first moment
   * the trigger is safe to touch again.
   */
  useEffect(() => {
    const trigger = document.querySelector<HTMLElement>('[data-template-trigger]')
    sheet.current?.focus()
    return () => {
      if (!picked.current && trigger?.isConnected) trigger.focus()
    }
  }, [])

  function trapTab(e: React.KeyboardEvent) {
    if (e.key !== 'Tab' || !sheet.current) return
    const stops = [...sheet.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (!stops.length) return
    const first = stops[0]
    const last = stops[stops.length - 1]
    const active = document.activeElement
    /* Wrap at both ends, and catch the case where focus sits on the sheet
       itself (the state right after opening): Tab goes to the first stop,
       Shift+Tab to the last. */
    if (e.shiftKey ? active === first || active === sheet.current : active === last) {
      e.preventDefault()
      ;(e.shiftKey ? last : first).focus()
    }
  }

  /*
   * Rule 2 at full size: the sheet's transform-origin is the "Add template"
   * pill — or the attached chip standing in its place — measured once per
   * open, in sheet-local coordinates (the sheet is inset 16px from the
   * viewport). A state INITIALIZER, not an effect: it runs synchronously in
   * this component's first render, so the very first spring frame already
   * grows out of the trigger, and the captured value survives unchanged
   * through the exit animation.
   */
  const [origin] = useState(() => {
    const el = document.querySelector('[data-template-trigger]')
    if (!el) return '50% 82%' // roughly where the composer sits; never expected
    const r = el.getBoundingClientRect()
    return `${r.left + r.width / 2 - SHEET_INSET}px ${r.top + r.height / 2 - SHEET_INSET}px`
  })

  const cards = libraryIn(filter)

  return (
    <div
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-label={t({ en: 'Pick a template', uk: 'Вибрати шаблон' })}
    >
      {/* 50% black (28616:59963) — raw value on the board, not a token */}
      <motion.div
        variants={modalScrim}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(0,0,0,0.5)]"
      />

      {/* the sheet (28626:534) — opaque, so the spring moves no blur */}
      <motion.div
        ref={sheet}
        /* focus target for the open, and the box the Tab cycle is trapped in.
           No ring: a focus outline around a 1624px panel is noise, and the
           thing being announced is the dialog, not a control. */
        tabIndex={-1}
        onKeyDown={trapTab}
        variants={fullscreenSheet}
        initial="initial"
        animate="animate"
        exit="exit"
        onAnimationComplete={() => setEntering(false)}
        style={{
          transformOrigin: origin,
          ...(entering ? { '--card-hover-dur': '0s' } : null),
        } as React.CSSProperties}
        className="absolute inset-4 overflow-hidden rounded-[16px] bg-[var(--gray-900)] focus:outline-none"
      >
        {/* One motion block over both boxes, so the content still lands as the
            single ~60ms-later beat the sheet's motion note describes. */}
        <motion.div
          variants={fullscreenContent}
          initial="initial"
          animate="animate"
          exit="exit"
          /* FLUID. The 32px side insets are the `px-8` on the two boxes below,
             and the content takes everything between them — no `max-width`, so
             the grid fills the sheet instead of sitting in the middle of a wide
             monitor. At the drawn 1656 this is the board's 1560 exactly. The
             heading and the chip row centre in the same box, which at 1656 is
             the same centre they had inside the capped column. */
          className="flex h-full flex-col"
        >
          {/*
           * HEADER — outside the scroller, so the title and the filter chips
           * hold still while the grid moves under them (the close button always
           * did, being absolute on the sheet).
           *
           * ⚠️ OURS, not drawn: the board has one column and no scroll state at
           * all (spec §10.3), so nothing says which parts of it are fixed. It
           * became a real question with the fluid grid, because cards that grow
           * with the column make the sheet scroll on a WIDE monitor too and not
           * just a short one — 366px of it at 2560 — and chips that scroll away
           * in the normal case leave the only filter in the sheet unreachable.
           * The drawn rhythm is unchanged either way: 57 + 22.5 + 40 above, then
           * 16 + 36 + 32 for the chips = 203.5, so the grid still starts at the
           * board's y. Flagged to the designer.
           */}
          <div className="flex-none px-8">
            {/* header 119 (28626:540): 57 above the cap-trimmed heading, 40 below */}
            <div className="pb-[40px] pt-[57px]">
              <h2 className="tplpick-heading whitespace-nowrap text-center font-display text-[32px] font-semibold leading-none text-white">
                {/* Verbatim from 28626:542 — a straight ' and NO trailing
                    period, where the README's candidate had one and the hero
                    pattern closes both halves. Both look like accidents;
                    flagged to the designer (spec §10.1), shipped as drawn. */}
                {"Pick a template. We'll remix it"}
              </h2>
            </div>

            {/* The dock's chip row (same Figma component), centred this time.
                TRULY centred: the board's group sits 4px right of centre only
                because the dock component's asymmetric 16/8 padding leaks
                through — an accident, per spec §4/§10.4. */}
            <div className="flex justify-center pb-8 pt-4">
              <CategoryChips value={filter} onChange={setFilter} />
            </div>
          </div>

          <ScrollArea axis="y" className="min-h-0 flex-1" innerClassName="px-8">
            {/* the grid (28626:591): 6 columns, 32px gaps both axes; card width
                is an output of the column — (1560 − 5×32) / 6 = 233.333, the
                dock's own formula over its 1592. 24px of drawn slack below.
                Geometry and the wide-screen rule live in `.tplpick-grid`. */}
            {cards.length ? (
              <div className="tplpick-grid pb-6">
                {cards.map(({ tpl, index }) => (
                  <TemplateCard
                    key={index}
                    template={tpl}
                    /* No height and no `home-card`: the column owns the width,
                       the thumbnail's ratio owns the height (272 at the drawn
                       233.333), and `home-card`'s 200px flex floor would fight
                       a grid column that is legitimately narrower — the picker
                       is 170 wide per card at 1280. */
                    className=""
                    thumbClassName="tplpick-thumb"
                    pickLabel={t({ en: `Pick ${tpl.name}`, uk: `Вибрати ${tpl.name}` })}
                    onPick={() => { picked.current = true; attach(index) }}
                  />
                ))}
              </div>
            ) : (
              /* Undrawn on any board (spec §10.5) — the dock's own quiet line,
                 not a new design. */
              <p className="pb-6 pt-10 text-center text-[14px] text-[var(--white-400)]">
                {t({ en: 'No templates in this category yet.', uk: 'У цій категорії ще немає шаблонів.' })}
              </p>
            )}
          </ScrollArea>
        </motion.div>

        {/* close (28633:14905): Black/500 + blur 16 + 12% rim; its blur is the
            sheet's single backdrop-filter — 40px square and static, as drawn */}
        <button
          onClick={onClose}
          aria-label={t({ en: 'Close', uk: 'Закрити' })}
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-[12px] border border-[#ffffff1f] bg-[#09090b7a] text-white backdrop-blur-[16px] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#09090bcc]"
        >
          <IconClose size={14} />
        </button>
      </motion.div>
    </div>
  )
}
