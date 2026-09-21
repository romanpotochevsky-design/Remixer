/**
 * THE COMPOSER'S ATTACH MENU — Figma 28726:64760, the instance 30771:31103 (designer,
 * 21.09.2026: «в макете показано как выглядит дропдаун и как он открывается с выбором
 * прикрепить любой файл или прикрепить домен»).
 *
 * The board draws two rows, Attach File and Attach Domain, on the kit's `-4 density` menu:
 * `Gray/600` at radius 10, 2px of side padding and 4 top and bottom, rows 40 tall at radius 8
 * with px 12 and a 20px leading glyph 12 from its label, the label 14/22 regular white.
 *
 * WHAT THE BOARD DOES NOT DRAW, and is ours:
 *  · WHICH domain gets attached. The customer's own names live in `OWNED_DOMAINS[inventory]`
 *    — the same list the domains dashboard calls "Existing domains" — so `Attach Domain`
 *    replaces the two rows with that list rather than guessing a name. Same box, same
 *    motion, same 40-tall rows; a name is one press away.
 *
 *    ⚠️ AND THE NAMES CARRY NO SUBTITLE, although `OWNED_DOMAINS` has one. Every row in
 *    that list would read "In your DreamHost account", which is the one thing all four
 *    have in common — four repetitions of the menu's own title. Dropping it also keeps
 *    the rows at the drawn 40.
 *  · `Attach File` is DIMMED. There are no files in this prototype and nothing to show after
 *    picking one. It is drawn because the board draws it and disabled because it cannot work
 *    here — which is as close as this menu can get to the house law that a control with
 *    nothing to do is better absent than dead, without deleting a row the designer pointed at.
 *
 * ⚠️ AND IT CARRIES NO REASON, because the board's own height forbids one: the instance is
 *    208 × 89 = 4 + 40 + 1 + 40 + 4, i.e. exactly two plain rows. A line saying "not in this
 *    prototype" grows that row to 54 and the menu stops being the drawn box. Raised to the
 *    designer rather than decided here; the domain rows below DO carry notes, because that
 *    level is ours and nothing draws it.
 */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useWorld } from '@/state/world'
import { useT } from '@/i18n'
import { OWNED_DOMAINS } from '@/data/domains'
import { IconGlobe, IconPaperclip } from '@/ui/icons'
import { popover, popoverContent } from '@/ui/motion'

/** One row of the kit's menu: a 20px glyph, 12 of air, the label — 40 tall at radius 8. */
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
      /* `press-bloom` is the house click; the hover plate is the kit's own 4% white. A
         disabled row takes neither — it is there to be read, not pressed. */
      className={`press-bloom flex h-10 w-full items-center gap-3 rounded-[8px] px-3 text-left transition-colors duration-[var(--dur-fast)] ease-std ${
        disabled ? 'cursor-default opacity-40' : 'hover:bg-[var(--white-050)]'
      }`}
    >
      <span className="flex-none text-white">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[14px] leading-[22px] text-white">{label}</span>
    </button>
  )
}

export function AttachMenu({ open, onClose, onDomain }: {
  open: boolean
  onClose: () => void
  onDomain: (domain: string) => void
}) {
  const { t } = useT()
  const inventory = useWorld((s) => s.world.inventory)
  const owned = OWNED_DOMAINS[inventory] ?? []
  const [level, setLevel] = useState<'root' | 'domains'>('root')
  const box = useRef<HTMLDivElement>(null)

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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={box}
          role="menu"
          aria-label={t({ en: 'Attach to the prompt', uk: 'Прикріпити до промпту' })}
          variants={popover}
          initial="initial"
          animate="animate"
          exit="exit"
          /* It grows out of its own bottom-left corner — the corner nearest the "+" that
             opened it. House law for every popover (ui/motion.ts): origin at the trigger,
             contents a beat behind. */
          style={{ transformOrigin: 'bottom left' }}
          /*
           * ⚠️ IT HANGS ABOVE THE FIELD, and it is positioned against the FIELD rather
           * than against the "+" — `bottom-full left-4 mb-2` on the composer's own box,
           * which is 8px of air over the drawn edge and the same 16px column the "+"
           * stands in. Two measurements forced it:
           *  · DOWNWARD IT GETS CUT. The hero is a clipped panel and its bottom edge is
           *    ~145px under the field; the root menu's 89 fits, the domain list does not
           *    (filmed: the third name sliced in half by the panel's edge). Above the
           *    field there are ~430.
           *  · ANCHORED TO THE BUTTON IT WOULD DRIFT. The "+" sits lower whenever an
           *    attachment opens the bar, so a constant offset from it is a different
           *    distance from the field's edge in each state; anchored to the field, the
           *    menu stands in exactly one place in all three.
           */
          className={`absolute bottom-full left-4 z-30 mb-2 rounded-[10px] bg-[var(--gray-600)] px-0.5 py-1 shadow-[0px_8px_16px_rgba(39,39,39,0.33)] ${
            /* 208 is the board's own width, and it is the board's own two short labels
               that fit in it. A list of real names does not — `odesa-coffee-roasters.com`
               needs 280 — and that level is ours, undrawn. The box changes size between
               levels because its contents do; its bottom-left corner, the one by the "+",
               does not move. */
            level === 'root' ? 'w-[208px]' : 'w-[280px]'
          }`}
        >
          <motion.div variants={popoverContent} className="flex flex-col gap-px">
            {level === 'root' ? (
              <>
                <Row
                  icon={<IconPaperclip size={20} />}
                  label={t({ en: 'Attach File', uk: 'Прикріпити файл' })}
                  disabled
                />
                <Row
                  icon={<IconGlobe size={20} />}
                  label={t({ en: 'Attach Domain', uk: 'Прикріпити домен' })}
                  onClick={() => setLevel('domains')}
                />
              </>
            ) : owned.length ? (
              owned.map((d) => (
                <Row
                  key={d.domain}
                  icon={<IconGlobe size={20} />}
                  label={d.domain}
                  onClick={() => { onDomain(d.domain); onClose() }}
                />
              ))
            ) : (
              <Row
                icon={<IconGlobe size={20} />}
                label={t({ en: 'No domains in this account', uk: 'У цьому акаунті немає доменів' })}
                disabled
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
