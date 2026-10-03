/**
 * THE RAIL DRAWER — a room that opens BESIDE the preview, at the right rail (designer 03.10.2026,
 * with a recording of the live editor: «галерея и Integrations должны открываться вот так как на
 * видео, только с более крутой и плавной анимацией… в нашем apple liquid glass стиле. но если
 * места не хватает для такого открытия, только в том случае оно открывается с другой анимацией…
 * поверх вебсайт превью с тенью»).
 *
 * The live editor (frames — scratchpad/gallery-open/): Website media and Integrations are a column
 * the full height of the canvas between the rail and the preview; the preview NARROWS to make room
 * and its site re-lays-out at the new width. All of it in one frame. Ours keeps the layout and
 * gives it motion — two forms, chosen by room:
 *
 *  · DOCKED (there is room): the preview's right edge gives way (`drawerP` → the canvas's right
 *    margin) and the panel is drawn out of the rail by the same value — its clip opens from the
 *    rail edge exactly as fast as the preview yields, 8 px behind it, so the two edges travel as
 *    one seam. The contents ride in with a short parallax and the rim catches the light once the
 *    panel has landed. No overshoot on the gutter: every frame of it re-lays the site out, and a
 *    bounce would re-flow the page back and forth (the chat's own collapse is the precedent —
 *    one width, eased, no spring past the target).
 *  · FLOATING (not enough room — the preview would drop under `DOCK_MIN`): the panel comes in
 *    OVER the preview as glass with a deep shadow, inflating out of its rail button. Nothing
 *    under it moves.
 *
 * `drawerP` / `drawerW` are module-level motion values: App.tsx writes the canvas margin from
 * them without a React render, the panels read their clip from them. One clock, two edges.
 */
import { motionValue } from 'motion/react'
import { create } from 'zustand'

/** The air between the preview and the drawer, and between the drawer and nothing else. */
export const DRAWER_GAP = 8
/** The preview must keep at least this much width beside a docked drawer, or the drawer floats. */
export const DOCK_MIN = 600
/** The drawer's own width — the media board's 480 (the live editor's is 512, asked). */
export const DRAWER_W = 480

/** 0 → 1: how far the preview has given way to a docked drawer. */
export const drawerP = motionValue(0)
/** The docked drawer's width, eased when the media panel widens. */
export const drawerW = motionValue(DRAWER_W)

/** The gutter: critically damped, so the site's re-layout never runs past its target. */
export const DRAWER_OPEN = { type: 'spring', duration: 0.62, bounce: 0 } as const
export const DRAWER_CLOSE = { type: 'spring', duration: 0.48, bounce: 0 } as const
/** A drawer handed to another while docked reveals itself on its own clock over the old one. */
export const DRAWER_SWAP = { type: 'spring', duration: 0.5, bounce: 0 } as const

/** The centre column's width — measured once per resize by App.tsx; both forms derive from it. */
export const useDrawerRoom = create<{ col: number; want: number }>(() => ({ col: 0, want: DRAWER_W }))

/** Does a drawer this wide fit beside a preview that stays at least `DOCK_MIN`? */
export const fitsDocked = (col: number, w: number) => col - DRAWER_GAP - (w + DRAWER_GAP) >= DOCK_MIN
