/**
 * The pieces the two sheets share, lifted out of DomainModal without a pixel changed.
 *
 * The point of the extraction is continuity: the customer presses "Show me what to
 * change" and the surface must not appear to be replaced, only refilled. That only holds
 * if the shell, the scrim, the 64px header, the close disc and the 48px globe tile are
 * literally the same objects — not two implementations that agree today.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { IconClose, IconGlobeLarge } from '@/ui/icons'
import { modalScrim, modalSheet } from '@/ui/motion'

/**
 * The 32px close disc (Figma 27328:11613). Black 48% + an 8%-white rim + blur —
 * the same glass recipe as the shell's controls, at the smaller radius.
 */
export function CloseButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-[10px] border border-[#ffffff14] bg-[#09090b7a] text-white backdrop-blur-[16px] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#09090bcc]"
    >
      <IconClose size={9} />
    </button>
  )
}

/**
 * The 48px globe tile the domain row hangs off. Black 64% under a 24%-white rim —
 * markedly brighter than the shell's 12% hairline, which is what makes it read as
 * a raised tile rather than an inset well.
 */
export function GlobeTile() {
  return (
    <span className="grid h-12 w-12 flex-none place-items-center rounded-[16px] border border-[#ffffff3d] bg-[#09090ba3] text-white backdrop-blur-[16px]">
      <IconGlobeLarge size={24} />
    </span>
  )
}

/**
 * The app-modal shell: 70% scrim over everything, the sheet centred and nudged 4px up.
 *
 * The scrim covers the chat column and the right rail too, which is why anything using
 * this mounts at the top of the tree rather than inside `<main>`.
 *
 * `max-h` + the column layout are inert for the short sheets and load-bearing for the
 * tall one: the setup sheet has to survive a laptop screen without pushing its button
 * off the bottom.
 */
export function ModalShell({
  open, onClose, width, label, children,
}: {
  open: boolean
  onClose: () => void
  width: number
  label: string
  children: React.ReactNode
}) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const restore = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    restore.current = document.activeElement as HTMLElement | null
    sheetRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      restore.current?.focus?.()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center" role="dialog" aria-modal="true" aria-label={label}>
          <motion.div
            variants={modalScrim}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-[rgba(0,0,0,0.7)]"
          />
          <motion.div
            ref={sheetRef}
            tabIndex={-1}
            variants={modalSheet}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative -translate-y-1 flex max-h-[calc(100vh-48px)] flex-col rounded-[24px] border border-[#ffffff0a] bg-[var(--gray-850)] outline-none"
            style={{ width, boxShadow: '0px 24px 28px rgba(0,0,0,0.33)' }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/** The 64px sheet header: title left, close disc right. */
export function SheetHeader({ title, onClose, closeLabel }: { title: string; onClose: () => void; closeLabel: string }) {
  return (
    <div className="flex h-16 flex-none items-center justify-between pl-6 pr-4">
      <h3 className="whitespace-nowrap pt-0.5 font-display text-[18px] font-semibold leading-[1.2] text-white">
        {title}
      </h3>
      <CloseButton onClick={onClose} label={closeLabel} />
    </div>
  )
}
