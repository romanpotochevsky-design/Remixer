/**
 * The confirmation line — one sentence, bottom right, then gone.
 *
 * Drawn on `28206:66756` as a dark pill with a green tick, sitting in the
 * bottom-right of the canvas. It exists so that events with **nothing left to do**
 * are still acknowledged without hijacking the screen: buying a plan, or
 * connecting a domain we already host, which finishes in seconds.
 *
 * The rule that keeps it honest: a toast may only report something that has
 * ALREADY happened, or something that needs no input. The moment there is an
 * action left, it belongs in the Publish panel's domain row, which persists —
 * a message that disappears must never be the only place an instruction lived.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useUI } from '@/state/ui'
import { useT } from '@/i18n'
import { IconCheck } from '@/ui/icons'
import { SPRING, EXIT } from '@/ui/motion'

export function Toast() {
  const { toast } = useUI()
  const { t } = useT()

  return (
    /* aria-live so the confirmation is announced; the region itself stays mounted,
       otherwise a screen reader has nothing to observe when the toast appears. */
    <div
      className="pointer-events-none fixed bottom-6 right-[80px] z-[80] flex justify-end"
      aria-live="polite"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            /* Keyed on the id, not on presence: repeating the same message must
               replay the spring instead of sitting there silently. */
            key={toast.id}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING }}
            exit={{ opacity: 0, y: 8, scale: 0.98, transition: EXIT }}
            className="flex items-center gap-3 rounded-[14px] border border-[#ffffff14] bg-[var(--gray-850)] py-3 pl-3.5 pr-5 backdrop-blur-[16px]"
            style={{ boxShadow: '0px 16px 32px rgba(0,0,0,0.44)' }}
          >
            {toast.tone === 'ok' ? (
              <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-[#48ba7933] text-[var(--live)]">
                <IconCheck size={11} />
              </span>
            ) : (
              /* "progress" carries the amber dot rather than a tick — the same
                 colour the domain row and the topbar use while work is in flight,
                 so one glance links the three. */
              <span className="relative grid h-5 w-5 flex-none place-items-center" aria-hidden>
                <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-[var(--attention)] opacity-60" />
                <span className="h-2 w-2 rounded-full bg-[var(--attention)]" />
              </span>
            )}
            <p className="text-[14px] font-medium leading-[1.4] text-white">{t(toast.text)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
