/**
 * The Home → builder transition (designer, 08.09.2026: "первый экран плавно затемняется,
 * пока всё не станет чёрным, после чего чат снизу вверх выезжает, сообщения сверху вниз,
 * панель справа и кнопки въезжают, логотип в левом верхнем углу красиво появляется"; and
 * about the loader: use the animated logo file and "дать ему один раз проанимироваться").
 *
 * Three phases, timed by `openBuilder` (state/ui.ts):
 *
 *  1. DARKEN — a curtain of the builder's ground colour fades in over the Home page,
 *     which is still mounted and still itself underneath (no content swap shows).
 *  2. LOGO — the page switches under the opaque curtain; the animated Remixer mark (the
 *     designer's SVGator asset, `LogoRemixerAnimated`) assembles once at the centre of
 *     the black, 96px like the hero's mark. Just before it ends, the board mark
 *     cross-fades in over the assembly's final frame — the same settle the Home entrance
 *     does — so what flies is the QA-signed mark.
 *  3. ARRIVE — the mark FLIES to its post in the builder's header (a FLIP: the header's
 *     slot is measured, the stage mark translates and scales onto it, and the header's
 *     own mark takes over on landing), the curtain lifts, and the shell assembles behind
 *     it on the `[data-boot='arrive']` classes in App.tsx / ChatPanel (index.css "THE
 *     ARRIVAL"): the chat rises from below, its messages cascade top-down, the rail
 *     slides in from the right, the wordmark unfolds beside the mark.
 *
 * Only `opacity` and `transform` animate. The layer unmounts when the phases end.
 *
 * ⚠️ The animated logo is one instance per page — its player finds the SVG by element
 * id, and the Home page mounts one for its own entrance. That is why the assembly here
 * mounts only in LOGO, after the page has switched and the Home page is gone. Mounting it
 * during DARKEN would bind the player to the Home's copy and draw nothing here.
 *
 * ⚠️ The flight vector is measured in a layout effect on the phase change, before the
 * first ARRIVE frame paints, so the mark never shows at a wrong place. If the header slot
 * is not there (a page without one), the mark simply fades where it stands.
 */
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useUI } from '@/state/ui'
import { LogoRemixer } from '@/ui/icons'
import { LogoRemixerAnimated } from '@/ui/LogoRemixerAnimated'

/** The stage mark: the hero's 96px, so the black stage reads as the hero's mark alone. */
const STAGE = 96

type Flight = { x: number; y: number; s: number }

export function BootCover() {
  const boot = useUI((s) => s.boot)
  const stage = useRef<HTMLDivElement>(null)
  const [flight, setFlight] = useState<Flight | null>(null)

  useLayoutEffect(() => {
    if (boot !== 'arrive') { setFlight(null); return }
    const from = stage.current?.getBoundingClientRect()
    const to = document.querySelector('[data-boot-mark]')?.getBoundingClientRect()
    if (!from || !to || !to.width) { setFlight({ x: 0, y: 0, s: 1 }); return }
    setFlight({
      x: to.left + to.width / 2 - (from.left + from.width / 2),
      y: to.top + to.height / 2 - (from.top + from.height / 2),
      s: to.width / from.width,
    })
  }, [boot])

  if (!boot) return null

  const vars = flight
    ? ({ '--fx': `${flight.x}px`, '--fy': `${flight.y}px`, '--fs': flight.s } as CSSProperties)
    : undefined

  return (
    <div className="boot-cover fixed inset-0 z-[9999]" data-phase={boot} aria-hidden>
      <div className="boot-curtain absolute inset-0 bg-[var(--gray-950)]" />
      {boot !== 'darken' && (
        <div
          ref={stage}
          className="boot-stage absolute"
          style={{ width: STAGE, height: STAGE, left: `calc(50% - ${STAGE / 2}px)`, top: `calc(50% - ${STAGE / 2}px)`, ...vars }}
        >
          {boot === 'logo' && <LogoRemixerAnimated className="boot-logo-anim absolute inset-0" />}
          <LogoRemixer size={STAGE} className="boot-logo-static relative h-full w-full" />
        </div>
      )}
    </div>
  )
}
