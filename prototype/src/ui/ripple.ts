/**
 * Press ripple for the Liquid Glass controls — the Material gesture, restyled
 * as light blooming through glass (designer's order, 26.08.2026: hover = a
 * translucent white wash on the fill, press = a bloom expanding FROM THE
 * CLICK POINT — "the animation also changes position depending on where each
 * button is clicked"). CSS side: `.glass-interactive` / `.glass-ripples` /
 * `.glass-ripple` in index.css, inside the LIQUID GLASS — CONTROLS canon
 * block; the written recipe is design-system.md §5 «Интерактивные состояния».
 *
 * ONE document-level delegation, installed once from main.tsx — zero
 * per-button wiring. A control opts IN with the `glass-interactive` class
 * (full literal in tsx, per the Tailwind lesson) and opts OUT of the ripple
 * (keeping the wash) with `data-no-ripple` — the attached chip's ✕ does:
 * blooming the whole chip you are about to remove would celebrate the wrong
 * thing.
 *
 * Mechanics, and why they satisfy the performance contract:
 *  - pointerdown → the pointer's coordinates are mapped into the control's
 *    LAYOUT space (gBCR ÷ offsetWidth, so a press during the picker sheet's
 *    entrance spring — the control is mid-scale — still lands where the
 *    finger is);
 *  - one <span class="glass-ripple"> is centred there, sized so its radius is
 *    SKIRT × the distance to the farthest corner: the bloom's soft edge dies
 *    to zero, so the geometric circle is oversized 1.25× to make the LIT part
 *    (the ≥60%-alpha core, which ends at 55% of the gradient) reach past that
 *    corner — one expansion always covers the control;
 *  - the gradient is painted ONCE at spawn; the animation is transform:
 *    scale(0→1) over 500ms on the house --ease-std curve plus a 90ms opacity
 *    fade-in — compositor-only, zero per-frame paint (Web Animations API, so
 *    the global reduced-motion `animation: none` CSS cannot half-kill it: the
 *    reduced path is decided here, in JS);
 *  - release (pointerup / pointercancel / pointerleave, matched by pointerId)
 *    fades the bloom out over 200ms and REMOVES the element — but never
 *    before MIN_HOLD (180ms) after the press, so a fast click still reads.
 *    Rapid clicks spawn independent, overlapping ripples;
 *  - keyboard activation (Enter / Space on the focused control) blooms from
 *    the control's CENTRE — Material's own rule — and self-releases;
 *  - under prefers-reduced-motion nothing expands: a brief static opacity
 *    pulse of the same bloom, already at full size, then gone. The hover wash
 *    is CSS and stays (a wash is not motion).
 *
 * The ripples live in a `.glass-ripples` layer appended as the host's LAST
 * child: React never reconciles children it did not create, and the layer
 * dies with the control. The rim (`.liquid-glass::before`) is lifted to
 * z-index:1 for the interactive family in CSS, so the glass EDGE stays lit
 * over the bloom passing under it.
 */

const HOST_SELECTOR = '.glass-interactive'
const OPT_OUT_SELECTOR = '[data-no-ripple]'

/** Expansion: the house standard-decelerate curve, Material's tempo. */
const GROW_MS = 500
const GROW_EASE = 'cubic-bezier(0.2, 0, 0, 1)' /* = --ease-std */
/** Fade-in softness — a 12%-alpha layer popping on is invisible, but cheap. */
const FADE_IN_MS = 90
/** Release fade. */
const FADE_MS = 200
/** A click shorter than this still shows this much ripple before fading. */
const MIN_HOLD_MS = 180
/** Geometric oversize so the bloom's LIT core covers the farthest corner. */
const SKIRT = 1.25

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function layerFor(host: HTMLElement): HTMLElement {
  let layer = host.querySelector<HTMLElement>(':scope > .glass-ripples')
  if (!layer) {
    layer = document.createElement('span')
    layer.className = 'glass-ripples'
    layer.setAttribute('aria-hidden', 'true')
    host.appendChild(layer)
  }
  return layer
}

/**
 * Spawn one bloom at (x, y) in the host's layout space. Returns the release
 * function (fade + remove; MIN_HOLD-aware), or null when the reduced-motion
 * pulse manages its own removal.
 */
function spawn(host: HTMLElement, x: number, y: number): (() => void) | null {
  const w = host.offsetWidth
  const h = host.offsetHeight
  if (!w || !h) return null

  const r = SKIRT * Math.hypot(Math.max(x, w - x), Math.max(y, h - y))
  const el = document.createElement('span')
  el.className = 'glass-ripple'
  el.style.left = `${x - r}px`
  el.style.top = `${y - r}px`
  el.style.width = `${r * 2}px`
  el.style.height = `${r * 2}px`
  layerFor(host).appendChild(el)

  if (reducedMotion()) {
    /* No expansion — a brief static acknowledgment, then gone. */
    const pulse = el.animate({ opacity: [0, 1, 1, 0] }, { duration: 260, easing: 'linear' })
    pulse.onfinish = () => el.remove()
    return null
  }

  el.animate(
    { transform: ['scale(0)', 'scale(1)'] },
    { duration: GROW_MS, easing: GROW_EASE, fill: 'forwards' },
  )
  el.animate({ opacity: [0, 1] }, { duration: FADE_IN_MS, easing: 'linear', fill: 'forwards' })

  const t0 = performance.now()
  let released = false
  return () => {
    if (released) return
    released = true
    const wait = Math.max(0, MIN_HOLD_MS - (performance.now() - t0))
    window.setTimeout(() => {
      const fade = el.animate({ opacity: [1, 0] }, { duration: FADE_MS, easing: 'linear', fill: 'forwards' })
      fade.onfinish = () => el.remove()
    }, wait)
  }
}

/** The interactive host under an event's target, unless the press opted out. */
function hostFor(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null
  const host = target.closest<HTMLElement>(HOST_SELECTOR)
  if (!host || target.closest(OPT_OUT_SELECTOR)) return null
  if ((host as HTMLButtonElement).disabled) return null
  return host
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return // primary press only (touch and pen report 0)
  const host = hostFor(e.target)
  if (!host) return

  /* Layout-space coordinates: divide out any visual scale the host is under
     (the picker sheet mid-spring), exactly as the FLIP flight measures. */
  const rect = host.getBoundingClientRect()
  const k = rect.width / host.offsetWidth || 1
  const release = spawn(host, (e.clientX - rect.left) / k, (e.clientY - rect.top) / k)
  if (!release) return

  const id = e.pointerId
  const done = (ev: Event) => {
    if ((ev as PointerEvent).pointerId !== id) return
    window.removeEventListener('pointerup', done, true)
    window.removeEventListener('pointercancel', done, true)
    host.removeEventListener('pointerleave', done)
    release()
  }
  window.addEventListener('pointerup', done, true)
  window.addEventListener('pointercancel', done, true)
  host.addEventListener('pointerleave', done)
}

function onKeyDown(e: KeyboardEvent) {
  if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return
  const host = hostFor(e.target)
  if (!host) return
  /* Keyboard has no press point: bloom from the centre (Material's rule),
     and no release coming either — self-release (MIN_HOLD still applies). */
  spawn(host, host.offsetWidth / 2, host.offsetHeight / 2)?.()
}

let installed = false

/**
 * Install the delegation. Idempotent; called once from main.tsx. Capture
 * phase, so a component stopping propagation cannot silence the press.
 */
export function installGlassInteractions(): void {
  if (installed) return
  installed = true
  document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true })
  document.addEventListener('keydown', onKeyDown, true)
}
