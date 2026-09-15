/**
 * CONFIRM — the design system's "are you sure?", Figma 30282:51628 / 30282:52052.
 *
 * One component for every irreversible-enough action in the product; the first caller is
 * `Unlink` in the Publish panel (designer, 14.09.2026: "когда нажимаешь на Unlink домена,
 * должно всплыть подтверждение действия… это компонент для подтверждения чего либо").
 *
 * ANATOMY, straight off the board:
 *   · scrim — black over the WHOLE shell (Rectangle 886 covers the 2560×1200 frame), so
 *     this is an app-modal like the checkout sheet: it is mounted at the top of the tree,
 *     not inside the panel that asked, or the panel's own z-40 would cap it.
 *     ⚠️ **70%, NOT THE BOARD'S 50%** (designer, 15.09.2026: «можно чуть сильнее затемнять
 *     фон, чтобы каши такой не было»). At 50% the canvas keeps its full-strength colour —
 *     in his screenshot a saturated green CTA and a grid of food cards were still the
 *     loudest things on screen while a question waited for an answer, and the dialog's own
 *     `Gray/800` surface sat at nearly the value of the dimmed site behind it. This is not
 *     a guess at a number either: the checkout sheet, the product's other app-modal, has
 *     always been 70% (DomainModal, its own board) — two app-modals with two scrims is the
 *     drift, one scrim is the system. The board's 50% is what the picker and the home
 *     surfaces use, and they dim a PAGE, not a question.
 *   · sheet 560 wide, shadow 0 16 28 rgba(0,0,0,.5), card `Gray/800` under an 8%-white
 *     rim at radius 24, clipped.
 *   · inside it, inset 4 on three sides, a second panel in `Gray/750` under a 4%-white rim
 *     at radius 20 — pt 35 / pb 34 / pl 32 / pr 24, gap 21. Title Gilroy SemiBold 24/1.2;
 *     body 15/1.4 at 48% white. The nested panel is the whole reason the dialog reads as a
 *     card and not a box: the question sits on its own surface, the answers on the frame.
 *   · footer p 16, buttons right, gap 12: `Cancel` outlined at 24% white, then the verb —
 *     filled `#e53935` when the tone is danger. Both 40 tall, radius 10, px 20, 14 semibold.
 *
 * ⚠️ RIMS ARE INSET SHADOWS, not borders: Figma's stroke sits inside the geometry and does
 * not shrink a frame's children, a CSS border does — the house rule that already cost this
 * panel four nested pixels once (design-system.md §5).
 *
 * ⚠️ THE DANGER RED IS A LITERAL. `#e53935` is the board's, and it is NOT `--danger`
 * (#ef4444) — close, and not the same. Shipped as drawn and flagged rather than snapped to
 * the nearest token, which is how a board's colour quietly becomes a different colour.
 */
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import { confirmScrim, confirmSheet, confirmSheetFade } from '@/ui/motion'

export interface ConfirmRequest {
  /** The question, with its subject in it — "Disconnect apple.com?" */
  title: string
  /** What happens if they go through with it, and what is still possible after. */
  body: string
  /** The verb, never "Yes": the button says what it does. */
  confirmLabel: string
  cancelLabel: string
  /** `danger` paints the verb red. Anything reversible should not use it. */
  tone?: 'danger' | 'default'
  onConfirm: () => void
}

interface ConfirmStore {
  req: ConfirmRequest | null
  ask: (r: ConfirmRequest) => void
  close: () => void
}

/** `useConfirm.getState().ask({…})` from anywhere; the host below does the rest. */
export const useConfirm = create<ConfirmStore>((set) => ({
  req: null,
  ask: (req) => set({ req }),
  close: () => set({ req: null }),
}))

/**
 * Mounted ONCE, at the top of the shell. Everything else just calls `ask`.
 */
export function ConfirmHost() {
  const { req, close } = useConfirm()
  const reduce = useReducedMotion()
  const cancelRef = useRef<HTMLButtonElement>(null)

  /* Escape cancels — the answer a destructive dialog should be easiest to give. */
  useEffect(() => {
    if (!req) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close() } }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [req, close])

  /* …and the focus lands on Cancel, not on the red button: the keyboard's default
     answer to "are you sure?" is no. */
  useEffect(() => { if (req) cancelRef.current?.focus() }, [req])

  return (
    <AnimatePresence>
      {req && (
        <motion.div
          key="confirm"
          className="fixed inset-0 z-[70] grid place-items-center bg-[rgba(0,0,0,0.7)] px-4"
          variants={confirmScrim}
          initial="initial"
          animate="animate"
          exit="exit"
          onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={req.title}
            className="w-[560px] max-w-full drop-shadow-[0_16px_28px_rgba(0,0,0,0.5)]"
            variants={reduce ? confirmSheetFade : confirmSheet}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="overflow-hidden rounded-[24px] bg-[var(--gray-800)] shadow-[inset_0_0_0_1px_var(--white-100)]">
              <div className="px-1 pt-1">
                <div className="flex flex-col gap-[21px] rounded-[20px] bg-[var(--gray-750)] pb-[34px] pl-8 pr-6 pt-[35px] shadow-[inset_0_0_0_1px_var(--white-050)]">
                  <p className="font-display text-[24px] font-semibold leading-[1.2] text-white">{req.title}</p>
                  <p className="text-[15px] leading-[1.4] text-[var(--white-480)]">{req.body}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-4">
                <button
                  ref={cancelRef}
                  onClick={close}
                  className="press-bloom h-10 rounded-[10px] border border-[#ffffff3d] px-5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
                >
                  {req.cancelLabel}
                </button>
                <button
                  onClick={() => { req.onConfirm(); close() }}
                  className={`press-bloom h-10 rounded-[10px] px-5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std ${
                    req.tone === 'danger'
                      ? 'bg-[#e53935] hover:bg-[#f04a46]'
                      : 'bg-[var(--action)] hover:bg-[var(--action-hover)]'
                  }`}
                >
                  {req.confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
