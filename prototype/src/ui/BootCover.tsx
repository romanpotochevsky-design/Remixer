/**
 * The cover that carries the Home page → builder step.
 *
 * Lovable puts a full-screen dark plate with its mark between the dashboard and the
 * project (~1s, frame 02 of the 06.09.2026 recording) — plain navigation, no morph of
 * the composer into anything. Ours was instant: `startBuild` and `openBuilder` land in
 * one tick and `Root` swaps the page in the very next commit, so the hero vanished and a
 * fully-built shell appeared with no beat between them. The designer asked for the
 * loader (07.09.2026).
 *
 * ⚠️ The mark here is the STATIC one from icons.tsx, deliberately. The assembling
 * SVGator logo is a one-instance-per-page component (it finds its SVG by element id — see
 * LogoRemixerAnimated) and the Home page owns that instance for its own entrance, so a
 * second copy over the top would render nothing at all. It is also 1.55s long, twice the
 * length of this step, and the assembly is the page's arrival — replaying it on every
 * Build would spend the product's best animation on a corridor.
 *
 * What plays instead is a hold: the plate is opaque from the first frame (nothing is
 * allowed to flash through), the mark breathes once, and the plate fades. Only `opacity`
 * and `transform` animate, and the whole layer unmounts when it is done.
 */
import { useEffect, useState } from 'react'
import { useUI, BOOT_MS } from '@/state/ui'
import { LogoRemixer } from '@/ui/icons'

export function BootCover() {
  const booting = useUI((s) => s.booting)
  /* `leaving` is the last 300ms: the plate is still mounted but transparent, so the
     builder underneath is already live and receiving clicks by the time it goes. */
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!booting) { setLeaving(false); return }
    setLeaving(false)
    const t = setTimeout(() => setLeaving(true), BOOT_MS - 300)
    return () => clearTimeout(t)
  }, [booting])

  if (!booting) return null

  return (
    <div
      className="boot-cover fixed inset-0 z-[9999] grid place-items-center bg-[var(--gray-950)]"
      data-leaving={leaving ? '' : undefined}
      aria-hidden
    >
      <span className="boot-cover-mark">
        <LogoRemixer size={56} />
      </span>
    </div>
  )
}
