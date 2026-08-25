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
 *   · content column — 1560 wide (32px side insets), centred: heading (57
 *     above the cap, 40 below), the dock's category chips (16 above, 32
 *     below), then a 6-column grid of the dock's template card at 233.333 ×
 *     272 with 32px gaps — 18 cards, third row fully visible with 81px of
 *     sheet below it at the drawn size
 *
 * The board draws no scroll state (spec §10.3), but 18 cards fit the drawn
 * height exactly and a library will not stay at 18 — so the sheet body scrolls
 * through the house `ScrollArea` when the viewport is shorter than the design.
 * At 1196 nothing scrolls, as drawn.
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
import { useEffect, useState } from 'react'
import { useUI } from '@/state/ui'
import { useT } from '@/i18n'
import { libraryIn, type TemplateCategoryId } from '@/data/templates'
import { ScrollArea } from '@/ui/ScrollArea'
import { IconClose } from '@/ui/icons'
import { modalScrim, fullscreenSheet, fullscreenContent } from '@/ui/motion'
import { CategoryChips, TemplateCard } from './Dock'

/** The sheet's inset from every viewport edge (board: (16, 16) 1624 × 1164). */
const SHEET_INSET = 16

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

  /* The board draws "All templates" active. Per-open state, not the store:
     this overlay remounts on every open, so each open starts where the board
     does instead of inheriting the dock's filter (or a previous visit's). */
  const [filter, setFilter] = useState<TemplateCategoryId>('all')

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
        variants={fullscreenSheet}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ transformOrigin: origin }}
        className="absolute inset-4 overflow-hidden rounded-[16px] bg-[var(--gray-900)]"
      >
        <ScrollArea axis="y" className="h-full" innerClassName="px-8">
          <motion.div
            variants={fullscreenContent}
            initial="initial"
            animate="animate"
            exit="exit"
            className="mx-auto w-full max-w-[1560px]"
          >
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

            {/* the grid (28626:591): 6 columns, 32px gaps both axes; card width
                is an output of the column — (1560 − 5×32) / 6 = 233.333, the
                dock's own formula over its 1592. 24px of drawn slack below. */}
            {cards.length ? (
              <div className="grid grid-cols-6 gap-8 pb-6">
                {cards.map(({ tpl, index }) => (
                  <TemplateCard
                    key={index}
                    template={tpl}
                    className="h-[272px]"
                    pickLabel={t({ en: `Pick ${tpl.name}`, uk: `Вибрати ${tpl.name}` })}
                    onPick={() => attach(index)}
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
          </motion.div>
        </ScrollArea>

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
