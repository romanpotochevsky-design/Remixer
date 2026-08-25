/**
 * The animated Remixer mark — the SVGator export the designer supplied with the
 * maintenance page (maintenance-page/index.html), repackaged for React. The logo
 * assembles itself: a spark near the centre, then the quarters slide in, then a
 * final sparkle-bounce settle. This is the load-time logo of the LIVE product's
 * home page (verified frame-by-frame against the production recording) and the
 * one the Home page entrance plays.
 *
 * How it works. The SVG below carries all its shapes at opacity 0 — mounted
 * alone it shows NOTHING. Importing `svgator-player` puts SVGator's runtime on
 * `window.__SVGATOR_PLAYER__["5c7f360c"]`; calling `.build(data)` finds the SVG
 * by the root id inside the data, binds the animation and plays it ONCE
 * (`LOGO_ASSEMBLY_MS`), then stops frozen on the final frame. Nothing runs
 * per-frame after that.
 *
 * ⚠️ The final frame is NOT pixel-identical to the board mark (`LogoRemixer` in
 * icons.tsx, QA-signed against Figma 28364:40192): the SVGator asset ends on a
 * slightly larger sparkle knock-out and lighter greys (#71717a vs #52525b at the
 * outer corners). The entrance therefore cross-fades the board mark in OVER this
 * one right after the assembly ends (`.he-logo-static` in index.css) — it reads
 * as the logo's final settle — and the settled DOM keeps only the board mark, so
 * the signed-off pixels stay exactly as QA recorded them.
 *
 * ⚠️ One instance at a time: the player finds its SVG by ELEMENT ID, so a second
 * mounted copy would be invisible (its shapes stay at opacity 0 and the data
 * binds to whichever element the id resolves to first). The Home entrance is the
 * only caller and mounts exactly one.
 *
 * ⚠️ The data is kept as a JSON STRING and parsed fresh on every build: the
 * player MUTATES the object it is given (deletes keys, re-resolves options), so
 * replaying from a shared module-level object would feed it its own leftovers.
 */
import { useEffect, useRef } from 'react'
import '@/ui/svgator-player'

/** SVGator's build hash — the registry key the player IIFE registers under. */
const SVGATOR_KEY = '5c7f360c'

/** The one-shot assembly's length, per the last keyframe in the data. */
export const LOGO_ASSEMBLY_MS = 1550

const MARKUP = `<svg aria-hidden="true" focusable="false" id="ecPGq39NQdE1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 72 72" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" project-id="afa4743b384c4a12a540f815695241b9" export-id="78c8e1ac4adf4f828496c6c1e6786368" cached="false"><defs><linearGradient id="ecPGq39NQdE2-fill" x1="7" y1="70.5" x2="12.0353" y2="-15.3962" spreadMethod="pad" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 0)"><stop id="ecPGq39NQdE2-fill-0" offset="0%" stop-color="#be59ff"/><stop id="ecPGq39NQdE2-fill-1" offset="19%" stop-color="#9d60ff"/><stop id="ecPGq39NQdE2-fill-2" offset="74%" stop-color="#4274ff"/><stop id="ecPGq39NQdE2-fill-3" offset="100%" stop-color="#1f7cff"/></linearGradient><linearGradient id="ecPGq39NQdE3-fill" x1="14" y1="66.5" x2="17.367" y2="-4.10534" spreadMethod="pad" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 0)"><stop id="ecPGq39NQdE3-fill-0" offset="0%" stop-color="#be59ff"/><stop id="ecPGq39NQdE3-fill-1" offset="19%" stop-color="#9d60ff"/><stop id="ecPGq39NQdE3-fill-2" offset="74%" stop-color="#4274ff"/><stop id="ecPGq39NQdE3-fill-3" offset="100%" stop-color="#1f7cff"/></linearGradient><linearGradient id="ecPGq39NQdE4-fill" x1="0.003417" y1="0" x2="36.0034" y2="36" spreadMethod="pad" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 0)"><stop id="ecPGq39NQdE4-fill-0" offset="0%" stop-color="#71717a"/><stop id="ecPGq39NQdE4-fill-1" offset="100%" stop-color="#3f3f46"/></linearGradient><linearGradient id="ecPGq39NQdE5-fill" x1="36.0068" y1="35.9963" x2="72.0068" y2="71.9963" spreadMethod="pad" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 0)"><stop id="ecPGq39NQdE5-fill-0" offset="0%" stop-color="#3f3f46"/><stop id="ecPGq39NQdE5-fill-1" offset="100%" stop-color="#71717a"/></linearGradient></defs><path id="ecPGq39NQdE2" d="M35.14411,37.707286c.470485,0,.85189-.381406.85189-.851896s-.381405-.85189-.85189-.85189-.851891.381405-.851891.85189.381404.851896.851891.851896Z" opacity="0" fill="url(#ecPGq39NQdE2-fill)"/><path id="ecPGq39NQdE3" d="M36.657951,35.996c.361498,0,.654552-.293053.654552-.654551s-.293054-.654552-.654552-.654552-.654551.293053-.654551.654552.293053.654551.654551.654551Z" transform="translate(0.0075 -0.0076)" opacity="0" fill="url(#ecPGq39NQdE3-fill)"/><path id="ecPGq39NQdE4" d="M36.0035,35.473503v-.529873h-1.059967v1.05997h.529873c.292596,0,.52987-.237277.52987-.529873l.000224-.000224Z" transform="translate(-0.0078 -0.0076)" opacity="0" fill="url(#ecPGq39NQdE4-fill)"/><path id="ecPGq39NQdE5" d="M36.75634,35.996614c-.415773,0-.75294.337166-.75294.75294v.752941h1.506194v-1.506195h-.75294l-.000314.000314Z" opacity="0" fill="url(#ecPGq39NQdE5-fill)"/><g mask="url(#ecPGq39NQdE11)"><path id="ecPGq39NQdE7" d="M35.14411,37.707286c.470485,0,.85189-.381406.85189-.851896s-.381405-.85189-.85189-.85189-.851891.381405-.851891.85189.381404.851896.851891.851896Z" opacity="0" fill="#fff"/><path id="ecPGq39NQdE8" d="M36.657951,35.996c.361498,0,.654552-.293053.654552-.654551s-.293054-.654552-.654552-.654552-.654551.293053-.654551.654552.293053.654551.654551.654551Z" transform="translate(-0.0077 -0.0076)" opacity="0" fill="#fff"/><path id="ecPGq39NQdE9" d="M36.75634,35.996614c-.415773,0-.75294.337166-.75294.75294v.752941h1.506194v-1.506195h-.75294l-.000314.000314Z" opacity="0" fill="#fff"/><path id="ecPGq39NQdE10" d="M36.0035,35.473503v-.529873h-1.059967v1.05997h.529873c.292596,0,.52987-.237277.52987-.529873l.000224-.000224Z" transform="translate(-0.0078 -0.0076)" opacity="0" fill="#fff"/><mask id="ecPGq39NQdE11" mask-type="luminance" x="-150%" y="-150%" height="400%" width="400%"><rect id="ecPGq39NQdE12" width="35.996" height="35.996" rx="0" ry="0" transform="translate(18.0054 17.935492)" fill="#fff" stroke-width="0"/></mask></g></svg>`

const DATA = `{"root":"ecPGq39NQdE1","version":"2025-04-07","animations":[{"elements":{"ecPGq39NQdE2":{"d":[{"t":770,"v":["M",35.14411,37.707286,"C",35.614595,37.707286,35.996,37.32588,35.996,36.85539,"C",35.996,36.384905,35.614595,36.0035,35.14411,36.0035,"C",34.673623,36.0035,34.292219,36.384905,34.292219,36.85539,"C",34.292219,37.32588,34.673623,37.707286,35.14411,37.707286,"Z"],"e":[0.42,0,0.58,1]},{"t":1060,"v":["M",17.998,71.9996,"C",27.938,71.9996,35.996,63.9416,35.996,54.0015,"C",35.996,44.0615,27.938,36.0035,17.998,36.0035,"C",8.05797,36.0035,0,44.0615,0,54.0015,"C",0,63.9416,8.05797,71.9996,17.998,71.9996,"Z"]}],"opacity":[{"t":770,"v":0,"e":[0.42,0,0.58,1]},{"t":950,"v":1}]},"ecPGq39NQdE3":{"d":[{"t":270,"v":["M",36.657951,35.996,"C",37.019449,35.996,37.312503,35.702947,37.312503,35.341449,"C",37.312503,34.97995,37.019449,34.686897,36.657951,34.686897,"C",36.296453,34.686897,36.0034,34.97995,36.0034,35.341449,"C",36.0034,35.702947,36.296453,35.996,36.657951,35.996,"Z"],"e":[0.42,0,0.58,1]},{"t":560,"v":["M",54.0014,35.996,"C",63.9414,35.996,71.9994,27.938,71.9994,17.998,"C",71.9994,8.05798,63.9414,0,54.0014,0,"C",44.0614,0,36.0034,8.05798,36.0034,17.998,"C",36.0034,27.938,44.0614,35.996,54.0014,35.996,"Z"]}],"opacity":[{"t":270,"v":0,"e":[0.42,0,0.58,1]},{"t":400,"v":1}]},"ecPGq39NQdE4":{"d":[{"t":0,"v":["M",36.0035,35.473503,"L",36.0035,34.94363,"L",34.943533,34.94363,"L",34.943533,36.0036,"L",35.473406,36.0036,"C",35.766002,36.0036,36.003276,35.766323,36.003276,35.473727,"L",36.0035,35.473503,"Z"],"e":[0.42,0,0.58,1]},{"t":290,"v":["M",36.0035,17.998,"L",36.0035,0,"L",0,0,"L",0,36.0036,"L",17.998,36.0036,"C",27.9365,36.0036,35.9959,27.9441,35.9959,18.0056,"L",36.0035,17.998,"Z"]}],"opacity":[{"t":0,"v":0,"e":[0.42,0,0.58,1]},{"t":100,"v":1}]},"ecPGq39NQdE5":{"d":[{"t":540,"v":["M",36.75634,35.996614,"C",36.340567,35.996614,36.0034,36.33378,36.0034,36.749554,"L",36.0034,37.502495,"L",37.509594,37.502495,"L",37.509594,35.9963,"L",36.756654,35.9963,"L",36.75634,35.996614,"Z"],"e":[0.42,0,0.58,1]},{"t":830,"v":["M",54.0014,36.0038,"C",44.0629,36.0038,36.0034,44.0633,36.0034,54.0018,"L",36.0034,71.9998,"L",72.0069,71.9998,"L",72.0069,35.9963,"L",54.0089,35.9963,"L",54.0014,36.0038,"Z"]}],"opacity":[{"t":540,"v":0,"e":[0.42,0,0.58,1]},{"t":640,"v":1}]},"ecPGq39NQdE7":{"d":[{"t":770,"v":["M",35.14411,37.707286,"C",35.614595,37.707286,35.996,37.32588,35.996,36.85539,"C",35.996,36.384905,35.614595,36.0035,35.14411,36.0035,"C",34.673623,36.0035,34.292219,36.384905,34.292219,36.85539,"C",34.292219,37.32588,34.673623,37.707286,35.14411,37.707286,"Z"],"e":[0.42,0,0.58,1]},{"t":1060,"v":["M",17.998,71.9996,"C",27.938,71.9996,35.996,63.9416,35.996,54.0015,"C",35.996,44.0615,27.938,36.0035,17.998,36.0035,"C",8.05797,36.0035,0,44.0615,0,54.0015,"C",0,63.9416,8.05797,71.9996,17.998,71.9996,"Z"]}],"transform":{"data":{"o":{"x":-0.00858,"y":72,"type":"corner"},"t":{"x":0.00858,"y":-72}},"keys":{"s":[{"t":1010,"v":{"x":1,"y":1},"e":[0.445,0.05,0.55,0.95]},{"t":1210,"v":{"x":1.111287,"y":1.111287},"e":[0.445,0.05,0.55,0.95]},{"t":1410,"v":{"x":0.999992,"y":0.999992}}]}},"opacity":[{"t":770,"v":0,"e":[0.42,0,0.58,1]},{"t":920,"v":1}]},"ecPGq39NQdE8":{"d":[{"t":270,"v":["M",36.657951,35.996,"C",37.019449,35.996,37.312503,35.702947,37.312503,35.341449,"C",37.312503,34.97995,37.019449,34.686897,36.657951,34.686897,"C",36.296453,34.686897,36.0034,34.97995,36.0034,35.341449,"C",36.0034,35.702947,36.296453,35.996,36.657951,35.996,"Z"],"e":[0.42,0,0.58,1]},{"t":560,"v":["M",54.0014,35.996,"C",63.9414,35.996,71.9994,27.938,71.9994,17.998,"C",71.9994,8.05798,63.9414,0,54.0014,0,"C",44.0614,0,36.0034,8.05798,36.0034,17.998,"C",36.0034,27.938,44.0614,35.996,54.0014,35.996,"Z"]}],"transform":{"data":{"o":{"x":72.008899,"y":0,"type":"corner"},"t":{"x":-72.016599,"y":-0.0076}},"keys":{"s":[{"t":1010,"v":{"x":1,"y":1},"e":[0.445,0.05,0.55,0.95]},{"t":1210,"v":{"x":1.111524,"y":1.111525},"e":[0.445,0.05,0.55,0.95]},{"t":1410,"v":{"x":0.999578,"y":0.99958}}]}},"opacity":[{"t":270,"v":0,"e":[0.42,0,0.58,1]},{"t":400,"v":1}]},"ecPGq39NQdE9":{"d":[{"t":530,"v":["M",36.75634,35.996614,"C",36.340567,35.996614,36.0034,36.33378,36.0034,36.749554,"L",36.0034,37.502495,"L",37.509594,37.502495,"L",37.509594,35.9963,"L",36.756654,35.9963,"L",36.75634,35.996614,"Z"],"e":[0.42,0,0.58,1]},{"t":820,"v":["M",54.0014,36.0038,"C",44.0629,36.0038,36.0034,44.0633,36.0034,54.0018,"L",36.0034,71.9998,"L",72.0069,71.9998,"L",72.0069,35.9963,"L",54.0089,35.9963,"L",54.0014,36.0038,"Z"]}],"transform":{"data":{"o":{"x":71.9917,"y":71.9996,"type":"corner"},"t":{"x":-71.9917,"y":-71.9996}},"keys":{"s":[{"t":1010,"v":{"x":1,"y":1},"e":[0.445,0.05,0.55,0.95]},{"t":1210,"v":{"x":1.111054,"y":1.111054},"e":[0.445,0.05,0.55,0.95]},{"t":1410,"v":{"x":0.999792,"y":0.999792}}]}},"opacity":[{"t":530,"v":0,"e":[0.42,0,0.58,1]},{"t":630,"v":1}]},"ecPGq39NQdE10":{"d":[{"t":0,"v":["M",36.0035,35.473503,"L",36.0035,34.94363,"L",34.943533,34.94363,"L",34.943533,36.0036,"L",35.473406,36.0036,"C",35.766002,36.0036,36.003276,35.766323,36.003276,35.473727,"L",36.0035,35.473503,"Z"],"e":[0.42,0,0.58,1]},{"t":290,"v":["M",36.0035,17.998,"L",36.0035,0,"L",0,0,"L",0,36.0036,"L",17.998,36.0036,"C",27.9365,36.0036,35.9959,27.9441,35.9959,18.0056,"L",36.0035,17.998,"Z"]}],"transform":{"data":{"t":{"x":-0.0078,"y":-0.0076}},"keys":{"s":[{"t":1010,"v":{"x":1,"y":1},"e":[0.445,0.05,0.55,0.95]},{"t":1210,"v":{"x":1.111291,"y":1.111291},"e":[0.445,0.05,0.55,0.95]},{"t":1410,"v":{"x":1,"y":1}}]}},"opacity":[{"t":0,"v":0,"e":[0.42,0,0.58,1]},{"t":100,"v":1}]},"ecPGq39NQdE12":{"transform":{"data":{"o":{"x":36.0034,"y":35.933492,"type":"corner"},"t":{"x":-17.998,"y":-17.998}},"keys":{"s":[{"t":1150,"v":{"x":1,"y":1},"e":[0.445,0.05,0.55,0.95]},{"t":1350,"v":{"x":1.354559,"y":1.354559},"e":[0.445,0.05,0.55,0.95]},{"t":1550,"v":{"x":1.000417,"y":1.000417}}]}}}},"s":"MCDA1ZDk5NDA4MjkzOTHA3ZjkyODc4ZDhjNDBWDNTg0ZjU0NTA0ZTRhANDA4Mjg3OTBLODM4MHTkyODc4ZE44YzQwNTNg0ZjRhNDA4NzkyODMG5MDdmOTI4N1I4ZDhjDOTE0MEU1ODRmNGE0MODg0ODc4YThhNDBCNTLg0ZjRhNDA3ZjhhOTIX4MzkwTjhjN2Y5MjgzMNDA1ODg0N2Y4YTkxOHDM0YTQwOTE4ZTgzRDKgzODI0MDU4NGY0YTQHwODQ4ZTkxNDA1ODRmHTzRlVTRlOWI/"}],"options":"MPDAxMDg4RzJmODBBODJE2ZTdmODEyZjQ3MmYB3OTdjNmU3MUwyZjhhF"}`

interface Props {
  /** ms after mount before the assembly starts (the entrance's logo beat). */
  delay?: number
  className?: string
}

export function LogoRemixerAnimated({ delay = 0, className }: Props) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    /*
     * The timer is the StrictMode guard: React 18 dev mounts, unmounts and
     * remounts every effect, and building the player twice would bind two
     * animations to one SVG. The first mount's timer dies in its cleanup before
     * it can fire (the unmount is synchronous, the timer is not); only the
     * surviving mount builds. `isConnected` covers the other direction — a
     * build scheduled on a host that left the DOM during the delay.
     */
    const timer = setTimeout(() => {
      if (!host.current?.isConnected) return
      const registry = (
        window as unknown as {
          __SVGATOR_PLAYER__?: Record<string, { build?: (data: unknown) => void } | undefined>
        }
      ).__SVGATOR_PLAYER__
      registry?.[SVGATOR_KEY]?.build?.(JSON.parse(DATA))
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])

  /* The markup is a trusted constant from this repo, not user input. */
  return <div ref={host} className={className} dangerouslySetInnerHTML={{ __html: MARKUP }} />
}
