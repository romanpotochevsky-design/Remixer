/**
 * Flow playback: the timer that advances a running flow, and the strip that narrates it.
 *
 * The strip is deliberately tooling-styled (light, monospace) so nobody in a demo mistakes
 * it for product chrome — it is the subtitle track, not part of the film.
 */
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FLOWS, flowById, stepDelay, useFlow, type Speed } from '@/state/flows'
import { useT } from '@/i18n'

const EASE = [0.2, 0, 0, 1] as const
const SPEEDS: { value: Speed; label: string }[] = [
  { value: 'slow', label: '0.5×' },
  { value: 'demo', label: '1×' },
  { value: 'instant', label: 'instant' },
]

/** Drives auto-advance and renders the narration strip. Mount once, near the root. */
export function FlowRunner() {
  const { t } = useT()
  const { flowId, index, playing, speed, next, pause, play, prev, stop, start } = useFlow()
  const flow = flowId ? flowById(flowId) : null
  const step = flow?.steps[index]
  const last = flow ? index === flow.steps.length - 1 : false

  useEffect(() => {
    if (!flow || !step || !playing) return
    const delay = stepDelay(step, speed)
    if (delay === null) return // awaits a real user action
    if (last) return
    const t = setTimeout(() => next(), delay)
    return () => clearTimeout(t)
  }, [flow, step, playing, speed, index, last, next])

  return (
    <AnimatePresence>
      {flow && step && (
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="fixed bottom-4 left-1/2 z-[9997] w-[620px] -translate-x-1/2 rounded-xl
                     border border-black/10 bg-[#F7F7F5] px-4 py-3 text-neutral-900 shadow-2xl"
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
            className={`w-full rounded-md border px-2.5 py-2 text-left transition-colors duration-150 ${
              flowId === f.id
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-black/10 bg-white hover:border-black/25'
            }`}
          >
            <span className="block text-[12.5px] leading-tight">{t(f.label)}</span>
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
