/**
 * The prototype console.
 *
 * Deliberately styled to look like *tooling*, not like Remixer: light ground, monospace
 * labels, no brand colour. In a screen share or a screenshot nobody should mistake it for
 * part of the product.
 *
 * Toggle with ⌘. (Ctrl+. on Windows) or the handle in the bottom-right corner.
 * "Режим показа" hides the handle so only the keyboard opens it.
 */
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useWorld, violations, type World } from '@/state/world'
import { AXES, GROUPS, PRESETS, PRESET_GROUPS, describe } from '@/state/scenarios'
import { ScrollArea } from '@/ui/ScrollArea'
import { useT } from '@/i18n'

const EASE = [0.2, 0, 0, 1] as const

export function ScenarioPanel() {
  const [open, setOpen] = useState(false)
  const [presenter, setPresenter] = useState(false)
  const [copied, setCopied] = useState<'ok' | 'fail' | false>(false)
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

  /** Would picking this value produce a state the real product cannot reach?
   *  Takes the option's own patch, so non-scalar axes (a list of projects) are
   *  checked as the value they actually apply, not as the option's id string. */
  const blocked = (key: keyof World, patch: Partial<World>) =>
    violations({ ...world, ...patch } as World).find((v) => v.field === key)

  /**
   * The address bar already IS the state (world.ts `syncUrl` keeps it in step), so this
   * only has to hand it over.
   *
   * ⚠️ WITH A FALLBACK, BECAUSE A PROJECTOR IS USUALLY NOT A SECURE CONTEXT. `localhost`
   * is; the `http://192.168.x.x` a laptop gets shown from is not, and there
   * `navigator.clipboard` is simply absent — the await threw, nothing was copied, and the
   * button still said "Link copied". A silent lie in front of a room is worse than a
   * button that does nothing.
   */
  const copyLink = async () => {
    const url = window.location.href
    let ok = true
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.createElement('textarea')
      el.value = url
      el.setAttribute('readonly', '')
      el.style.position = 'fixed'
      el.style.top = '0'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      try { ok = document.execCommand('copy') } catch { ok = false }
      el.remove()
    }
    setCopied(ok ? 'ok' : 'fail')
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <>
      {/* The handle earns its place by being findable, not by being visible. It rests at
          25% opacity with no fill, and only resolves on hover. ⌘. opens it without a click. */}
      {!presenter && !open && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="group fixed bottom-2.5 right-2.5 z-[9998] grid h-6 w-6 place-items-center
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
                {/*
                  * ⚠️ THE LABEL DOES NOT SAY WHAT THIS DOES. All it does is hide the little
                  * handle in the bottom-right corner, so only ⌘. / Ctrl+. opens the console
                  * — and pressing it while the console is open looks like nothing happened,
                  * because the handle is behind the panel. Then the console is closed and
                  * there is no visible way back. The title now says both halves, including
                  * the way back, since a tooltip is the only thing that can be read BEFORE
                  * the click; renaming it is a call for the designer, whose word this is
                  * («режим показа»).
                  */}
                <button
                  onClick={() => setPresenter((v) => !v)}
                  aria-pressed={presenter}
                  className={`rounded-md px-2 py-1 font-mono text-[10px] transition-colors duration-150 ${
                    presenter ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-black/5'
                  }`}
                  title={
                    presenter
                      ? 'Handle hidden — ⌘. / Ctrl+. reopens this console. Click to bring the handle back'
                      : 'Hide the handle in the bottom-right corner, so only ⌘. / Ctrl+. opens this console'
                  }
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
              {/* ⚠️ NO "WHOLE FLOWS" SECTION AND NO PLAYER. Scenarios that played
                  themselves end to end — a step card with Play / ← → / 0.5× · 1× · instant —
                  lived here and above the shell, and the designer threw them out
                  (14.09.2026: "я же давно просил это убрать, оно бесполезное"). Presets and
                  the axes below stage any state in one click, and the real paths are walked
                  by hand; a scripted walk was a third way to move the world that nobody
                  drove. `devtools/FlowPlayer.tsx` and `state/flows.ts` are deleted, not
                  disabled. Do not bring them back. */}
              {/*
                * Presets — single frozen situations, under the SAME labelled sections the
                * axes get below. Twenty-two tiles in one grid was a list nobody read: the
                * three kinds of thing (customer, project, domain) sat shuffled together
                * and the domain ones were not even in the order the product walks them.
                * The headings and the order live in scenarios.ts; this only renders them,
                * exactly as the axis loop does.
                */}
              {PRESET_GROUPS.map((group) => {
                const tiles = PRESETS.filter((p) => p.group.en === group.en)
                if (!tiles.length) return null
                return (
                  <section key={group.en} className="mb-5">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                      {t(group)}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {tiles.map((p) => {
                        const active = preset === p.id
                        return (
                          <button
                            key={p.id}
                            onClick={() => set(p.patch, p.id)}
                            title={t(p.note)}
                            /* A dashed edge for a tile whose flow is not finished — the
                               same manner the product uses for its own placeholder card,
                               and readable before the click, which a tooltip is not. */
                            className={`rounded-md border px-2.5 py-2 text-left text-[12.5px] leading-tight
                                        transition-colors duration-150 ${p.tag ? 'border-dashed' : ''} ${
                              active
                                ? 'border-neutral-900 bg-neutral-900 text-white'
                                : 'border-black/10 bg-white text-neutral-800 hover:border-black/25'
                            }`}
                          >
                            {t(p.label)}
                            {p.tag && (
                              <span
                                className={`mt-1 block font-mono text-[9px] uppercase tracking-[0.1em] ${
                                  active ? 'text-white/60' : 'text-neutral-400'
                                }`}
                              >
                                {t(p.tag)}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </section>
                )
              })}

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
                                /* `current` exists for axes whose value is not a
                                   scalar — the option id and the stored value are
                                   then different things. */
                                const patch = opt.patch ?? ({ [axis.key]: opt.value } as Partial<World>)
                                const active = axis.current
                                  ? axis.current(world) === opt.value
                                  : String(world[axis.key]) === opt.value
                                const block = blocked(axis.key, patch)
                                return (
                                  <button
                                    key={opt.value}
                                    disabled={!!block && !active}
                                    onClick={() => set(patch)}
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
                title="The address bar already carries this world — this hands it over"
                className="flex-1 rounded-md border border-black/10 bg-[#F7F7F5] px-3 py-2
                           text-[12.5px] text-neutral-800 transition-colors duration-150 hover:bg-white"
              >
                {copied === 'ok' ? 'Link copied' : copied === 'fail' ? 'Copy it from the address bar' : 'Copy link to this state'}
              </button>
              {/*
                * ⚠️ RESET IS ONE PRESS (14.09.2026). It used to ask first — arm on the first
                * click, fire on the second, disarm itself after three seconds — because a
                * mis-click in front of a room blanks the demo with no way back. The cost was
                * worse than the accident: the designer pressed it once, went to look at the
                * Publish panel, and found the world he thought he had thrown away still
                * standing ("я нажимаю ресет, потом иду в окно публиша, у меня там уже типа
                * привязывается домен"), because the arming had quietly timed out behind him.
                * A console control that sometimes does nothing is worse than one that always
                * does what it says; re-staging a world is one click away in this same panel.
                */}
              <button
                onClick={() => reset()}
                title="Back to the default demo world"
                className="rounded-md px-3 py-2 text-[12.5px] text-neutral-500 transition-colors duration-150 hover:bg-black/5"
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
