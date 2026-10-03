/**
 * THE RAIL DRAWER'S SHELL — the box both Website media and Integrations live in (ui/drawer.ts has
 * the law). One component, two forms:
 *
 *  · DOCKED — a column beside the preview. The box stands in its final place from the first frame
 *    and is CLIPPED open from its right edge (the rail) by `min(drawerP, q)`: `drawerP` is the
 *    preview's own give-way, so the panel's left edge and the preview's right edge travel as one
 *    seam 8 px apart; `q` is the panel's own clock, used only when it arrives over another docked
 *    drawer (the preview has nothing left to give — the new room reveals itself over the old, which
 *    fades under it). The contents ride 56 px of parallax behind the edge and come up between 15 %
 *    and 70 % of the reveal; once landed, the rim catches the light (Rim Sweep). Leaving, the box
 *    HOLDS while the preview takes its width back and the clip closes into the rail.
 *  · FLOATING — glass over the preview with a deep shadow, slid and inflated out of its rail button
 *    (one soft overshoot, contents a beat behind, Rim Sweep). Leaving is 160 ms flat, back toward
 *    the rail. Nothing under it moves.
 *
 * ⚠️ The exit is chosen by AnimatePresence's `custom`, not by the element's own props: the props an
 * exiting child keeps are the ones from the render where it was still open, and only `custom`
 * reaches it afterwards (docked or floating, a handoff or a close).
 */
import { useEffect, useLayoutEffect, useMemo, useState, type CSSProperties, type ReactNode, type Ref } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'motion/react'
import { EXIT, panelInBody, panelInBodyFade } from '@/ui/motion'
import { DRAWER_SWAP, drawerP, drawerW } from '@/ui/drawer'

const keepOnMainThread = () => {}

type Custom = { docked: boolean; handoff: boolean; reduce: boolean }

const FLOAT_SHADOW =
  'inset 0 0 0 1px var(--gray-800), 0 2px 0 #09090b, 0 28px 72px rgba(0,0,0,.58), 0 10px 28px rgba(0,0,0,.36)'

const shell = {
  initial: (c: Custom) => (c.docked ? { opacity: 1, x: 0, scale: 1 } : c.reduce ? { opacity: 0 } : { opacity: 0, x: 28, scale: 0.96 }),
  animate: (c: Custom) =>
    c.docked
      ? { opacity: 1, x: 0, scale: 1 }
      : {
          opacity: 1,
          x: 0,
          scale: 1,
          transition: { type: 'spring', duration: 0.64, bounce: 0.18, opacity: { duration: 0.22, ease: [0.2, 0, 0, 1] } },
        },
  exit: (c: Custom) =>
    c.docked
      ? c.handoff
        ? { opacity: 0, zIndex: 39, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }
        /* hold while the clip closes — `drawerP` runs DRAWER_CLOSE (.48 s) */
        : { opacity: 0.999, transition: { duration: 0.5 } }
      : c.reduce
        ? { opacity: 0, transition: EXIT }
        : { opacity: 0, x: 16, scale: 0.98, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } },
}

export function RailDrawer({
  id, open, docked, handoff, label, railSelector, panelRef, attrs, children,
}: {
  id: string
  open: boolean
  docked: boolean
  /** another docked drawer is taking this one's place */
  handoff: boolean
  label: string
  /** the rail button the floating form inflates out of */
  railSelector: string
  panelRef?: Ref<HTMLDivElement>
  attrs?: Record<string, string | undefined>
  children: ReactNode
}) {
  const reduce = !!useReducedMotion()
  const custom: Custom = { docked, handoff, reduce }
  return (
    <AnimatePresence custom={custom}>
      {open && (
        <DrawerBox key={id} custom={custom} label={label} railSelector={railSelector} panelRef={panelRef} attrs={attrs}>
          {children}
        </DrawerBox>
      )}
    </AnimatePresence>
  )
}

function DrawerBox({
  custom, label, railSelector, panelRef, attrs, children,
}: {
  custom: Custom
  label: string
  railSelector: string
  panelRef?: Ref<HTMLDivElement>
  attrs?: Record<string, string | undefined>
  children: ReactNode
}) {
  const { docked, reduce } = custom
  /* the panel's own clock — 1 unless it arrives over a drawer that is already docked */
  const q = useMotionValue(1)
  const [swap, setSwap] = useState(false)
  useLayoutEffect(() => {
    if (!docked || reduce || drawerP.get() < 0.98) return
    q.jump(0)
    setSwap(true)
    const a = animate(q, 1, DRAWER_SWAP)
    return () => a.stop()
    // mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const reveal = useTransform(() => Math.min(drawerP.get(), q.get()))
  const clipPath = useTransform(reveal, (r) => `inset(0px 0px 0px ${((1 - r) * 100).toFixed(3)}% round 16px)`)
  const bodyX = useTransform(reveal, (r) => (reduce ? 0 : (1 - r) * 56))
  const bodyO = useTransform(reveal, [0.15, 0.7], [0, 1])

  /* the rim catches the light once the docked panel has landed (a floating one: on arrival) */
  const [landed, setLanded] = useState(false)
  useMotionValueEvent(reveal, 'change', (r) => { if (r > 0.985 && !landed) setLanded(true) })
  useEffect(() => { if (docked && reveal.get() > 0.985) setLanded(true) }, [docked, reveal])

  /* floating: the glass inflates out of the rail button that opened it */
  const origin = useMemo(() => {
    const b = document.querySelector(railSelector)?.getBoundingClientRect()
    const top = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 52) + 8
    return b ? `calc(100% + 36px) ${Math.round(b.top + b.height / 2 - top)}px` : 'calc(100% + 12px) 50%'
  }, [railSelector])

  const box: CSSProperties = docked
    ? { right: 'var(--rail-w)', top: 'var(--topbar-h)', bottom: 2, boxShadow: 'inset 0 0 0 1px var(--gray-800)', zIndex: swap ? 41 : 40 }
    : { right: 'calc(var(--rail-w) + 8px)', top: 'calc(var(--topbar-h) + 8px)', bottom: 8, boxShadow: FLOAT_SHADOW, transformOrigin: origin, zIndex: 40 }

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-label={label}
      data-rail-drawer={docked ? 'docked' : 'floating'}
      {...attrs}
      custom={custom}
      variants={shell}
      initial="initial"
      animate="animate"
      exit="exit"
      onUpdate={keepOnMainThread}
      className="fixed flex flex-col overflow-hidden rounded-[16px] bg-[var(--gray-850)]"
      style={{ ...box, width: drawerW, clipPath: docked ? clipPath : undefined, willChange: docked ? 'clip-path' : 'transform, opacity' }}
    >
      {(docked ? landed : true) && <span aria-hidden className="glass-glint" />}
      {docked ? (
        <motion.div className="flex min-h-0 flex-1 flex-col" style={{ x: bodyX, opacity: bodyO }}>
          {children}
        </motion.div>
      ) : (
        <motion.div
          variants={reduce ? panelInBodyFade : panelInBody}
          onUpdate={keepOnMainThread}
          className="flex min-h-0 flex-1 flex-col"
          style={{ transformOrigin: origin }}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  )
}
