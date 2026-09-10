/**
 * The Home → builder transition (designer, 08.09.2026: "первый экран плавно затемняется,
 * пока всё не станет чёрным, после чего чат снизу вверх выезжает, сообщения сверху вниз,
 * панель справа и кнопки въезжают, логотип в левом верхнем углу красиво появляется"; and,
 * later the same day, on the animated mark that played in between: "этот логотип из
 * анимации перехода… он лишний… вместо него вставить плавно и красиво при переходе эффект
 * свечения на пару секунд по краю экрана").
 *
 * Three phases, timed by `openBuilder` (state/ui.ts):
 *
 *  1. DARKEN — a curtain of the builder's ground colour fades in over the Home page,
 *     which is still mounted and still itself underneath (no content swap shows).
 *  2. GLOW — the page switches under the opaque curtain, and the Remixer glow runs along
 *     the edge of the whole screen: the same `SiriGlow` the preview carries while a build
 *     runs, here on the viewport itself, square-cornered, over black. It breathes in on
 *     its own entrance (600ms, with the corner flash), runs, and breathes out over the
 *     last half second of the phase (`.boot-glow`, index.css) — so the shell arrives on a
 *     clean black frame and the glow's blur never competes with the arrival for frames
 *     (CLAUDE.md: the glow costs most of the frame budget; it starts 700ms after a send
 *     for exactly that reason).
 *  3. ARRIVE — the curtain lifts and the shell assembles on the `[data-boot='arrive']`
 *     classes in App.tsx / ChatPanel (index.css "THE ARRIVAL"): the chat rises from
 *     below, its messages cascade top-down, the rail slides in from the right, the mark
 *     lights up in the header and the wordmark unfolds beside it.
 *
 * Only `opacity` and `transform` animate. The layer unmounts when the phases end.
 *
 * The glow's quality governor (SiriGlow.tsx) runs here as anywhere: the lite cut first,
 * a probe while it is on screen, the full four layers only if the machine held its frames.
 */
import { useUI } from '@/state/ui'
import { SiriGlow } from '@/ui/SiriGlow'

export function BootCover() {
  const boot = useUI((s) => s.boot)
  if (!boot) return null
  return (
    <div className="boot-cover fixed inset-0 z-[9999]" data-phase={boot} aria-hidden>
      <div className="boot-curtain absolute inset-0 bg-[var(--gray-950)]" />
      {boot === 'glow' && (
        <div className="boot-glow absolute inset-0">
          <SiriGlow active surface="dark" />
        </div>
      )}
    </div>
  )
}
