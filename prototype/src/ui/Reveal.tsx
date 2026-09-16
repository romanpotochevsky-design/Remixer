/**
 * REVEAL — a block that unfolds and folds inside a panel, taking the panel's height with it.
 *
 * Designer, 16.09.2026, from a screen recording of the Publish panel through a connection walk:
 * «внутри формы появляются и исчезают объекты, и высота формы резко меняется… нужно чтобы оно
 * не резко прыгало, а плавно и красиво с плавной анимацией меняло высоту, а те объекты что
 * внутри появляются и пропадают тоже должны иметь плавную и красивую анимацию. в стиле apple
 * liquid glass!» — and, pointing at the brief's question dock as the example, «с bounce effect».
 *
 * WHAT IT IS. Three boxes:
 *  · the CLIP — `overflow: hidden`, its `height` a spring between 0 and the content's measured
 *    height (`REVEAL_OPEN` on the way in, one soft overshoot; `REVEAL_CLOSE` on the way out,
 *    flat and quicker). This is the moving edge, and because the panel's own height is the sum
 *    of its blocks, the panel's bottom edge moves with it — one continuous motion instead of
 *    the snap the recording shows;
 *  · the SIZER — the content at its natural height, watched by a ResizeObserver. Whatever
 *    changes inside the block (a longer sentence, a chip with more words, a top inset that
 *    depends on a neighbour) re-targets the spring: the block does not know about it, it just
 *    changes, and the edge follows;
 *  · the GLASS — the block itself, riding in a beat behind the edge (`revealBody`: up from
 *    slightly small and slightly high, born at the seam it unfolds from) and catching the light
 *    as it forms (`.card-arrive`, the same glint the thread's cards wear).
 *
 * WHAT IS INSIDE THE CLIP AND WHAT IS NOT. The block's own spacing — the 19px over a status
 * card, the 6px around the in-flight card, the 8px around the nudge — is passed as `pad` and
 * unfolds WITH the block: spacing that stayed outside the clip would stand there as a gap
 * before the block arrived and after it left. The glass gets the block's radius (`radius`) so
 * the glint follows its corners. Nothing else: the Reveal paints nothing of its own, so a
 * block that is up when the panel opens is pixel-identical to one that was never wrapped.
 *
 * WHEN IT PLAYS. `AnimatePresence initial={false}`: whatever is up when the Reveal mounts —
 * i.e. when the panel opens — comes in with the panel and gets no unfolding of its own. Only a
 * block that appears LATER unfolds, and only such a block carries the glint (`arriving`).
 * A block whose `show` flips back within its exit is simply re-entered.
 *
 * ⚠️ `height` IS ANIMATED HERE, ON PURPOSE, AND IT IS A MEASURED EXCEPTION. The performance
 * contract forbids per-frame layout because the thread's dock and its scroller would pay for
 * it on every frame. This panel is a fixed 432px overlay: its layout is contained to its own
 * few dozen boxes, and the software renderer holds the walk at ~60 fps (`scratchpad/reveal/`).
 * A transform cannot stand in: a card growing by `scaleY` stretches its text, and a FLIP of the
 * rows below it would still leave the panel's bottom edge — the one thing the eye follows — to
 * snap into place. See motion.ts, `REVEAL_OPEN`, for the rule's wording.
 *
 * ⚠️ THE OUTGOING BLOCK IS THE ONE THAT WAS THERE. When `show` goes false, AnimatePresence keeps
 * rendering the element it last saw — old children, old props — while the edge closes. So a
 * caller may write `{cond && <Card .../>}` inside a `<Reveal show={cond}>` and never think
 * about what the card should say while it leaves.
 *
 * Under reduced motion the edge changes height in one commit and the glass only fades
 * (`revealBodyFade`): the offsets are dropped, not jumped into.
 */
import { AnimatePresence, motion, usePresence, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { REVEAL_CLOSE, REVEAL_OPEN, revealBody, revealBodyFade } from '@/ui/motion'

export function Reveal({
  show, pad, radius = 12, className, follow = 'spring', children,
}: {
  /** Is the block up? Flipping it unfolds or folds the block; the panel's height follows. */
  show: boolean
  /** The block's own spacing, as Tailwind classes — it unfolds with the block (see above). */
  pad?: string
  /** The block's corner radius, for the glint that follows its rim as it arrives. */
  radius?: number
  /** Classes for the clip itself — layout only, never paint. */
  className?: string
  /**
   * How the edge answers a change of the CONTENT'S height while the block is up. `spring`
   * (default): a sentence grows and the edge glides after it. `instant`: the edge tracks the
   * content frame by frame — for a block whose contents animate their own height (the
   * in-flight card folding its explanation, 16.09.2026): two springs on one edge chase each
   * other, the outer lagging the inner and clipping its rim on the way open. Showing and
   * hiding the block itself always springs.
   */
  follow?: 'spring' | 'instant'
  children: ReactNode
}) {
  /* Has this block ever been down while the Reveal was mounted? Only then is an appearance an
     ARRIVAL (glint, unfolding). What is up when the panel opens comes in with the panel. */
  const wasDown = useRef(!show)
  if (!show) wasDown.current = true
  return (
    <AnimatePresence initial={false}>
      {show && (
        <RevealBox key="box" pad={pad} radius={radius} className={className} follow={follow} arriving={wasDown.current}>
          {children}
        </RevealBox>
      )}
    </AnimatePresence>
  )
}

function RevealBox({
  pad, radius, className, follow, arriving, children,
}: { pad?: string; radius: number; className?: string; follow: 'spring' | 'instant'; arriving: boolean; children: ReactNode }) {
  const reduce = useReducedMotion()
  const [present, safeToRemove] = usePresence()
  const sizer = useRef<HTMLDivElement>(null)
  const removed = useRef(false)
  /* Has the edge been given a measured height once? From then on, under `follow="instant"`,
     a change of the content's height is tracked without a spring of its own. */
  const measured = useRef(false)
  /* The content's natural height, from the ResizeObserver's LAYOUT size (`borderBoxSize`) —
     delivered once on observe() and again on every change, before the frame paints. Null
     only for the first commit, where 'auto' stands in.
     ⚠️ NOT `getBoundingClientRect()`: that is the PAINTED box, and the panel is born at
     `scale(.94)` (motion.ts `popover`). Measured through that transform, every block came
     out 6 % short and stayed clipped by it — the domain row's bottom edge stood 4px above
     the body card's, and the observer never corrected it because the LAYOUT size had not
     changed. `offsetHeight` is layout-true but integer; the observer's box is both. */
  const [natural, setNatural] = useState<number | null>(null)
  useLayoutEffect(() => {
    const el = sizer.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0]?.blockSize
      setNatural(box ?? el.offsetHeight)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  useEffect(() => {
    if (present && natural !== null) measured.current = true
  }, [present, natural])
  const tracking = follow === 'instant' && present && measured.current
  return (
    <motion.div
      className={`overflow-hidden${className ? ` ${className}` : ''}`}
      initial={{ height: 0 }}
      animate={{ height: present ? natural ?? 'auto' : 0 }}
      transition={reduce || tracking ? { duration: 0 } : present ? REVEAL_OPEN : REVEAL_CLOSE}
      onAnimationComplete={() => {
        if (present || removed.current) return
        removed.current = true
        safeToRemove?.()
      }}
    >
      {/* flow-root: a child's top margin must stay INSIDE the measured box, not collapse through it */}
      <div ref={sizer} className={`flow-root${pad ? ` ${pad}` : ''}`}>
        <motion.div
          className={`relative origin-top${arriving ? ' card-arrive' : ''}`}
          style={{ borderRadius: radius }}
          variants={reduce ? revealBodyFade : revealBody}
          initial="initial"
          animate={present ? 'animate' : 'exit'}
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  )
}
