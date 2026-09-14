/**
 * Flow playback: the timer that advances a running flow, and the strip that narrates it.
 *
 * The strip is deliberately tooling-styled (light, monospace) so nobody in a demo mistakes
 * it for product chrome — it is the subtitle track, not part of the film.
 */
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FLOWS, flowById, stepDelay, useFlow, type Speed } from '@/state/flows'
import { useUI } from '@/state/ui'
import { foreignPage } from '@/ui/motion'
import { useT } from '@/i18n'

const SPEEDS: { value: Speed; label: string }[] = [
  { value: 'slow', label: '0.5×' },
  { value: 'demo', label: '1×' },
  { value: 'instant', label: 'instant' },
]

/**
 * WHERE THE STRIP STANDS SO IT NEVER COVERS WHAT IT IS TELLING SOMEBODY TO PRESS.
 *
 * It used to be pinned to the bottom centre of the window, 620 wide, which is exactly
 * where the product puts the controls a flow asks for: with the canvas away the chat owns
 * the whole shell and centres its dock there, so the strip sat on top of the plan card's
 * Review / Start Building — the presenter could read "press Start Building" and could not
 * reach it (14.09.2026).
 *
 * Two docks, chosen by the layout underneath rather than by the step, because the step does
 * not know how wide the window is or where the divider was dragged to:
 *
 *  · `canvas` — there IS a canvas (the preview, the domains window, the plan document), so
 *    the strip lives at its bottom-right: clear of the chat column and its dock, which is
 *    where every press in the chat happens, clear of the right rail, and clear of the
 *    simulated letter, which App.tsx pins to the canvas's TOP-left. The only thing it can
 *    overlay there is canvas content — the demo site, or the tail of a scrolling list —
 *    never a control a step names.
 *  · `top` — the chat owns the shell (a brief, a plan, a build) or a page from outside
 *    Remixer covers the window. Then the bottom band is all dock and there is no free
 *    620px anywhere along it, while the top of that layout carries only the header and the
 *    thread's oldest turns — nothing any flow asks anybody to press.
 *
 * Everything is expressed against the shell's own custom properties (`--chat-w` is written
 * straight to <html> by the resizer), so dragging the divider moves the strip with it and
 * nothing here has to re-render to keep up.
 */

/** Drives auto-advance and renders the narration strip. Mount once, near the root. */
export function FlowRunner() {
  const { t } = useT()
  const { flowId, index, playing, speed, next, pause, play, prev, stop, start } = useFlow()
  const flow = flowId ? flowById(flowId) : null
  const step = flow?.steps[index]
  const last = flow ? index === flow.steps.length - 1 : false

  const page = useUI((s) => s.page)
  const previewOpen = useUI((s) => s.previewOpen)
  const panel = useUI((s) => s.panel)
  const dock = page !== 'builder' || panel !== null || !previewOpen ? 'top' : 'canvas'
  const place =
    dock === 'canvas'
      ? {
          bottom: 16,
          right: 'calc(var(--rail-w) + 16px)',
          width: 'min(620px, max(320px, calc(100vw - var(--chat-w) - var(--rail-w) - 32px)))',
        }
      : /* left AND right AND a width centres it without a transform — which motion owns
           on this element, and an inline `translateX` would simply be overwritten.
           A page from outside Remixer has its own header to clear; the chat's own 52px
           header is empty in the middle, and starting above it gives the thread back two
           lines it would otherwise lose. */
        {
          top: panel ? 60 : 12,
          left: 16,
          right: 16,
          marginInline: 'auto',
          width: 'min(620px, calc(100vw - 32px))',
        }

  useEffect(() => {
    if (!flow || !step || !playing) return
    const delay = stepDelay(step, speed)
    if (delay === null) return // awaits a real user action
    if (last) return
    const t = setTimeout(() => next(), delay)
    return () => clearTimeout(t)
  }, [flow, step, playing, speed, index, last, next])

  return (
    /* `mode="wait"` and a key on the dock: when the layout underneath changes the strip
       leaves one place and arrives in the other, rather than teleporting mid-sentence.
       `foreignPage` is the house's own preset for a surface from outside the product —
       transform and opacity only, which is what this element may animate. */
    <AnimatePresence mode="wait">
      {flow && step && (
        <motion.div
          key={dock}
          variants={foreignPage}
          initial="initial"
          animate="animate"
          exit="exit"
          style={place}
          className="fixed z-[9997] rounded-xl border border-black/10 bg-[#F7F7F5]
                     px-4 py-3 text-neutral-900 shadow-2xl"
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              {t(flow.label)}
            </p>
            <p className="font-mono text-[10px] tabular-nums text-neutral-500">
              step {index + 1} / {flow.steps.length}
            </p>
          </div>

          <p className="mt-1 text-[14px] leading-snug">{t(step.label)}</p>
          {step.note && (
            <p className="mt-0.5 text-[12px] leading-snug text-neutral-500">{t(step.note)}</p>
          )}

          {/* progress */}
          <div className="mt-2.5 flex gap-1">
            {flow.steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => useFlow.getState().goTo(i)}
                title={t(s.label)}
                className={`h-1 flex-1 rounded-full transition-colors duration-150 ${
                  i < index ? 'bg-neutral-900' : i === index ? 'bg-neutral-900/60' : 'bg-black/10'
                }`}
              />
            ))}
          </div>

          <div className="mt-2.5 flex items-center gap-1.5">
            {step.awaitUser && !last && (
              <button
                onClick={() => { next(); play() }}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-[12.5px] text-white"
              >
                Continue
              </button>
            )}
            {!step.awaitUser && !last && (
              <button
                onClick={() => (playing ? pause() : play())}
                className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-[12.5px]"
              >
                {playing ? 'Pause' : 'Play'}
              </button>
            )}
            {last && (
              <button
                onClick={() => start(flow.id)}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-[12.5px] text-white"
              >
                Replay
              </button>
            )}
            <button onClick={prev} className="rounded-md px-2 py-1.5 text-[12.5px] text-neutral-600 hover:bg-black/5">
              ←
            </button>
            <button onClick={next} disabled={last} className="rounded-md px-2 py-1.5 text-[12.5px] text-neutral-600 hover:bg-black/5 disabled:opacity-30">
              →
            </button>

            <div className="ml-auto flex items-center gap-1">
              {SPEEDS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => useFlow.getState().setSpeed(s.value)}
                  className={`rounded px-1.5 py-1 font-mono text-[10px] ${
                    speed === s.value ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-black/5'
                  }`}
                >
                  {s.label}
                </button>
              ))}
              <button onClick={stop} className="rounded px-2 py-1 text-[12px] text-neutral-500 hover:bg-black/5" aria-label="Stop">
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** The flow picker, rendered inside the console. */
export function FlowList() {
  const { flowId, start } = useFlow()
  const { t } = useT()
  return (
    <section className="mb-6">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
        Whole flows
      </p>
      <div className="space-y-1.5">
        {FLOWS.map((f) => (
          <button
            key={f.id}
            onClick={() => start(f.id)}
            /* A dashed edge for a walk that is not finished, and the mono line under the
               label saying so — the same two marks the situation tiles below this list
               carry (ScenarioPanel, `Preset.tag`). One idiom for one status: the two lists
               sit in the same panel and would otherwise read as two different tools. */
            className={`w-full rounded-md border px-2.5 py-2 text-left transition-colors duration-150 ${
              f.tag ? 'border-dashed' : ''
            } ${
              flowId === f.id
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-black/10 bg-white hover:border-black/25'
            }`}
          >
            <span className="block text-[12.5px] leading-tight">{t(f.label)}</span>
            {f.tag && (
              <span
                className={`mt-1 block font-mono text-[9px] uppercase tracking-[0.1em] ${
                  flowId === f.id ? 'text-white/60' : 'text-neutral-400'
                }`}
              >
                {t(f.tag)}
              </span>
            )}
            <span
              className={`mt-0.5 block text-[11.5px] leading-tight ${
                flowId === f.id ? 'text-white/60' : 'text-neutral-500'
              }`}
            >
              {t(f.note)}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
