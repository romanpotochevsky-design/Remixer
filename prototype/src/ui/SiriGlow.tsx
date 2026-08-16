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

function useGlowQuality(): Quality {
  const [q, setQ] = useState<Quality>(verdict ?? 'full')
  useEffect(() => {
    if (verdict) return
    let alive = true
    let frames = 0
    const t0 = performance.now()
    const tick = () => {
      if (!alive) return
      frames++
      const dt = performance.now() - t0
      if (dt < 1200) requestAnimationFrame(tick)
      else {
        verdict = frames / (dt / 1000) < 30 ? 'lite' : 'full'
        setQ(verdict)
      }
    }
    requestAnimationFrame(tick)
    return () => { alive = false }
  }, [])
  return q
}

const LAYERS = ['soft', 'alt', 'dense', 'core'] as const
const LITE_LAYERS = ['dense', 'core'] as const

export function SiriGlow() {
  const quality = useGlowQuality()
  const layers = quality === 'lite' ? LITE_LAYERS : LAYERS
  return (
    <div className={`siri-glow ${quality === 'lite' ? 'siri-glow--lite' : ''}`} aria-hidden>
      {layers.map((k) => (
        <b key={k} className={`siri-layer siri-layer--${k}`}>
          <i>
            <span className="siri-spin siri-spin--color" />
            <span className="siri-spin siri-spin--wave" />
          </i>
        </b>
      ))}
    </div>
  )
}
