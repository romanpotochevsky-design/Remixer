/**
 * The Siri edge glow with a built-in quality governor.
 *
 * All motion is transform/opacity-only (see index.css for the performance
 * contract). Even so, machines without GPU compositing pay per composited
 * layer — so on first activation the component counts real frames for ~1.2s
 * and, below 30fps, drops to the lite cut: core line + dense halo, no waves.
 * The verdict is cached for the session, so the probe runs once.
 */
import { useEffect, useState } from 'react'

type Quality = 'full' | 'lite'
let verdict: Quality | null = null

/* Phones and touch devices go straight to the lite cut — no probe, no risk:
   mobile GPUs pay fill-rate for every blurred pixel, and the lite cut is
   designed to be indistinguishable at phone sizes anyway. */
if (typeof window !== 'undefined' && window.matchMedia('(max-width: 820px), (pointer: coarse)').matches) {
  verdict = 'lite'
}

function useGlowQuality(): Quality {
  const [q, setQ] = useState<Quality>(verdict ?? 'full')
  useEffect(() => {
    // 'full' is final; 'lite' from a probe re-checks on the next activation, so one
    // noisy first-load window (fonts, layout, artifact iframe warmup) can't stick.
    if (verdict === 'full') return
    let alive = true
    let frames = 0
    let t0 = 0
    const start = performance.now()
    const tick = () => {
      if (!alive) return
      const now = performance.now()
      if (now - start < 400) { requestAnimationFrame(tick); return } // warmup: skip the mount storm
      if (!t0) t0 = now
      frames++
      const dt = now - t0
      if (dt < 1200) requestAnimationFrame(tick)
      else {
        const decided: Quality = frames / (dt / 1000) < 30 ? 'lite' : 'full'
        if (decided === 'full') verdict = 'full'
        setQ(decided)
      }
    }
    requestAnimationFrame(tick)
    return () => { alive = false }
  }, [])
  return q
}

/* Class names must appear as FULL literals: Tailwind's content scanner purges any
   CSS rule whose class never occurs verbatim in source. `siri-layer--${k}` cost us
   the whole effect once — never rebuild these strings dynamically. */
const LAYER_CLASS = {
  soft: 'siri-layer siri-layer--soft',
  alt: 'siri-layer siri-layer--alt',
  dense: 'siri-layer siri-layer--dense',
  core: 'siri-layer siri-layer--core',
} as const

const LAYERS = ['soft', 'alt', 'dense', 'core'] as const
const LITE_LAYERS = ['dense', 'core'] as const

/**
 * `active` starts the glow; when it drops, the light doesn't cut — it plays a
 * 700ms dissolve (opacity out, a breath outward) and only then unmounts.
 * `surface` tells the glow what it shines over: on 'light' only the narrow
 * saturated rim survives (like real light against white); 'dark' renders the
 * full bloom. The real effect never dims the content — no scrim here.
 */
export function SiriGlow({ active, surface = 'dark' }: { active: boolean; surface?: 'light' | 'dark' | 'split' }) {
  const quality = useGlowQuality()
  const [mounted, setMounted] = useState(active)
  useEffect(() => {
    if (active) { setMounted(true); return }
    const t = setTimeout(() => setMounted(false), 750)
    return () => clearTimeout(t)
  }, [active])
  if (!mounted) return null

  const out = !active
  const layers = quality === 'lite' ? LITE_LAYERS : LAYERS
  const glowClass = [
    'siri-glow',
    quality === 'lite' ? 'siri-glow--lite' : '',
    surface === 'light' ? 'siri-glow--on-light' : surface === 'split' ? 'siri-glow--split' : '',
    out ? 'siri-glow--out' : '',
  ].join(' ').trim()

  return (
    <>
      <div className={glowClass} aria-hidden>
        <b className="siri-flash" />
        {layers.map((k) => (
          <b key={k} className={LAYER_CLASS[k]}>
            <i>
              <span className="siri-spin" />
            </i>
          </b>
        ))}
      </div>
    </>
  )
}
