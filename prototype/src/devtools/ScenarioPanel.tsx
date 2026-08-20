/**
 * The prototype console.
 *
 * Deliberately styled to look like *tooling*, not like Remixer: light ground, monospace
 * labels, no brand colour. In a screen share or a screenshot nobody should mistake it for
 * part of the product.
 *
 * Toggle with ⌘. (Ctrl+. on Windows) or the handle at the bottom of the right rail.
 *
 * ⚠️ Position is the designer's call: bottom-right, in the rail's column, ABOVE the
 * green support bubble. It collided three times, and every time because the offset
 * was GUESSED instead of read off the rail. So it is written as the arithmetic now,
 * not as a number — change the terms, not the total:
 *
 *   the rail (App.tsx) is `--rail-w: 56px` with `flex-col items-center pb-6`
 *   the support bubble is `h-9 w-9` = 36px, centred by the rail
 *   ⇒ its top edge sits at 24px (pb-6) + 36px = 60px above the bottom
 *   ⇒ bottom = 1.5rem (pb-6) + 2.25rem (bubble) + 0.5rem (air) = 68px
 *   ⇒ right = (56 − 24) / 2 = 16px = `right-4`, so this 24px handle shares the
 *     bubble's centre line instead of sitting 6px off it, which read as crooked
 *
 * If `pb-6` or the bubble's size changes, update the terms above. Do not nudge by eye,
 * and do not move it to the left side (tried, rejected by the designer).
 * "Режим показа" hides the handle so only the keyboard opens it.
 */
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useWorld, violations, type World } from '@/state/world'
import { AXES, GROUPS, PRESETS, describe } from '@/state/scenarios'
import { ScrollArea } from '@/ui/ScrollArea'
import { useT } from '@/i18n'

const EASE = [0.2, 0, 0, 1] as const

export function ScenarioPanel() {
  const [open, setOpen] = useState(false)
  const [presenter, setPresenter] = useState(false)
  const [copied, setCopied] = useState(false)
  const { world, preset, set, reset } = useWorld()
  const { t } = useT()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') { e.preventDefault(); setOpen((v) => !v) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const problems = violations(world)

  /** Would picking this value produce a state the real product cannot reach? */
  const blocked = (key: keyof World, value: unknown) =>
    violations({ ...world, [key]: value } as World).find((v) => v.field === key)

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <>
      {/* The handle earns its place by being findable, not by being visible. It rests at
          25% opacity with no fill, and only resolves on hover. ⌘. opens it without a click. */}
      {!presenter && !open && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="group fixed bottom-[calc(1.5rem+2.25rem+0.5rem)] right-4 z-[9998] grid h-6 w-6 place-items-center
                     rounded-md opacity-25 transition-opacity duration-200 ease-[cubic-bezier(.2,0,0,1)]
                     hover:bg-white/10 hover:opacity-100 focus-visible:opacity-100"
          title="Prototype console · ⌘."
          aria-label="Prototype console"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M1 3.5h10M1 8.5h10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="text-white/70" />
            <circle cx="4" cy="3.5" r="1.6" fill="#18181b" stroke="currentColor" strokeWidth="1" className="text-white/70" />
            <circle cx="8" cy="8.5" r="1.6" fill="#18181b" stroke="currentColor" strokeWidth="1" className="text-white/70" />
          </svg>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="fixed right-0 top-0 z-[9999] flex h-full w-[400px] flex-col
                       border-l border-black/10 bg-[#F7F7F5] text-neutral-900 shadow-2xl"
          >
            {/* header */}
            <header className="flex items-center justify-between border-b border-black/10 px-4 py-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                  Prototype console
                </p>
                <p className="mt-0.5 text-[13px] text-neutral-600">Not part of the product</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPresenter((v) => !v)}
                  className={`rounded-md px-2 py-1 font-mono text-[10px] transition-colors duration-150 ${
                    presenter ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-black/5'
                  }`}
                  title="Hide the handle — keyboard only"
                >
                  PRESENT
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-1 text-neutral-500 transition-colors duration-150 hover:bg-black/5"
                  aria-label="Close console"
                >
                  ✕
                </button>
              </div>
            </header>

            {/* the situation, in words */}
            <div className="border-b border-black/10 bg-white px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                On screen now
              </p>
              <p className="mt-1 text-[13.5px] leading-snug text-neutral-900">{t(describe(world))}</p>
              {problems.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {problems.map((p, i) => (
                    <li key={i} className="flex gap-1.5 text-[12px] leading-snug text-[#A33]">
                      <span aria-hidden>▲</span>
                      <span>{t(p.reason)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <ScrollArea className="min-h-0 flex-1" innerClassName="px-4 py-4" thumb="dark">
              {/* Situations — the STARTING state you pick before you start clicking.
                  The "Whole flows" player that used to sit above this (a stepper with
                  arrows, a step counter and speed controls) was deleted on 20.08.2026 at
                  the designer's request: a narrated stepper is not how a customer meets
                  the interface. Every flow is now walked by hand through the real UI, so
                  no state may be enterable without also being leavable by a click. */}
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                Situations
              </p>
              <div className="mb-6 grid grid-cols-2 gap-1.5">
                {PRESETS.map((p) => {
                  const active = preset === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => set(p.patch, p.id)}
                      title={t(p.note)}
                      className={`rounded-md border px-2.5 py-2 text-left text-[12.5px] leading-tight
                                  transition-colors duration-150 ${
                        active
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-black/10 bg-white text-neutral-800 hover:border-black/25'
                      }`}
                    >
                      {t(p.label)}
                    </button>
                  )
                })}
              </div>

              {/* axes */}
              {GROUPS.map((group) => {
                const axes = AXES.filter(
                  (a) => a.group.en === group.en && (!a.appliesWhen || a.appliesWhen(world)),
                )
                if (!axes.length) return null
                return (
                  <section key={group.en} className="mb-5">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                      {t(group)}
                    </p>
                    <div className="space-y-3">
                      {axes.map((axis) => (
                        <div key={String(axis.key)}>
                          <div className="mb-1 flex items-baseline justify-between">
                            <label className="text-[12.5px] text-neutral-700">{t(axis.label)}</label>
                            {axis.kind === 'number' && (
                              <span className="font-mono text-[12px] tabular-nums text-neutral-900">
                                {String(world[axis.key])}
                              </span>
                            )}
                          </div>

                          {axis.kind === 'options' && (
                            <div className="flex flex-wrap gap-1">
                              {axis.options!.map((opt) => {
                                const active = String(world[axis.key]) === opt.value
                                const block = blocked(axis.key, opt.value)
                                return (
                                  <button
                                    key={opt.value}
                                    disabled={!!block && !active}
                                    onClick={() => set({ [axis.key]: opt.value } as Partial<World>)}
                                    title={block ? t(block.reason) : opt.hint ? t(opt.hint) : undefined}
                                    className={`rounded border px-2 py-1 text-[12px] transition-colors duration-150 ${
                                      active
                                        ? 'border-neutral-900 bg-neutral-900 text-white'
                                        : block
                                          ? 'cursor-not-allowed border-black/5 bg-black/[0.03] text-neutral-400 line-through'
                                          : 'border-black/10 bg-white text-neutral-700 hover:border-black/30'
                                    }`}
                                  >
                                    {t(opt.label)}
                                  </button>
                                )
                              })}
                            </div>
                          )}

                          {axis.kind === 'number' && (
                            <input
                              type="range"
                              min={axis.min} max={axis.max} step={axis.step}
                              value={Number(world[axis.key])}
                              onChange={(e) =>
                                set({ [axis.key]: Number(e.target.value) } as Partial<World>)
                              }
                              className="w-full accent-neutral-900"
                            />
                          )}

                          {axis.kind === 'toggle' && (
                            <button
                              onClick={() => set({ [axis.key]: !world[axis.key] } as Partial<World>)}
                              className={`rounded border px-2 py-1 text-[12px] transition-colors duration-150 ${
                                world[axis.key]
                                  ? 'border-neutral-900 bg-neutral-900 text-white'
                                  : 'border-black/10 bg-white text-neutral-600 hover:border-black/30'
                              }`}
                            >
                              {world[axis.key] ? 'On' : 'Off'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })}
            </ScrollArea>

            {/* footer */}
            <footer className="flex items-center gap-2 border-t border-black/10 bg-white px-4 py-3">
              <button
                onClick={copyLink}
                className="flex-1 rounded-md border border-black/10 bg-[#F7F7F5] px-3 py-2
                           text-[12.5px] text-neutral-800 transition-colors duration-150 hover:bg-white"
              >
                {copied ? 'Link copied' : 'Copy link to this state'}
              </button>
              <button
                onClick={reset}
                className="rounded-md px-3 py-2 text-[12.5px] text-neutral-500
                           transition-colors duration-150 hover:bg-black/5"
              >
                Reset
              </button>
            </footer>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
