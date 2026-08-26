/**
 * The attached template's geometry — board **`28726:64760`** ("Domain-Only
 * Customer", the fourth Home board, canvas −4385, 3966), read 26.08.2026.
 * Pixel source and node ids: docs/features/home-page/figma-spec-add-template.md
 * §13. These numbers are shared by three files (the composer that lays the tile
 * out, the flight that lands an object on it, the CSS that paints it), so they
 * live here rather than being retyped in each.
 *
 * What the board draws — and it corrects what we had shipped: the attachment is
 * NOT a chip in the pill's place. The **pill stays exactly where it was**, and
 * the attachment is a preview TILE in a new top row of the field, with a small
 * ✕ badge riding its top-right corner — the way an image or a video attachment
 * looks in a chat composer. The field grows to make room.
 *
 * The field, row by row (`Input field` 28726:64923, 960 × 184):
 *
 *   0 ─ 16    field padding-top            (17 when there is no attachment)
 *   16 ─ 72   the tile                     `attached template` 28734:65592
 *   72 ─ 89   17
 *   89 ─ 115  the placeholder line, 26     `Text` 28726:64925 (a 60 box, 17/17)
 *   115 ─ 132 17
 *   132 ─ 168 the button row, 36           `Buttons` 28726:64929
 *   168 ─ 184 field padding-bottom, 16
 *
 * Against the unattached board (`28364:40219`, 960 × 138: 17 · text 52 · 17 ·
 * buttons 36 · 16) that is +46 on the box and two different travels inside it —
 * the placeholder line drops 72, the button row 46. The extra 26 is the phantom
 * empty second paragraph the unattached board carries and this one does not
 * (already recorded as an accident of that board, spec §7.2); both are shipped
 * as drawn.
 */

import { FIELD_CLOSE } from '@/ui/motion'

/** `attached template` 28734:65592 — 56 × 56 at (16, 16) in the field. */
export const TILE = 56
/** Its inset from the field's left and top edges — the `Attachments bar`'s
 *  own `pt-16 px-16` (28734:65591, an 88 × 72 box around one 56px tile). */
export const TILE_INSET = 16
/** The row the tile makes: 16 + 56. The field's growth is 46, not 72, because
 *  the text row loses the phantom line at the same time. */
export const BAR_H = TILE_INSET + TILE

/** The tile's radius (the frame's 16 — `image 381` matches it on three
 *  corners). */
export const TILE_RADIUS = 16
/**
 * …and its top-RIGHT is the board's 8 (`image 381` 28734:65593:
 * `rounded-tr-[8px]`). A shallower corner exactly where the ✕ badge sits.
 * ⚠️ Figma leaves the tile FRAME's stroke at 16 there while its image child is
 * 8 — a 8px mismatch that the badge covers completely (the badge's footprint is
 * that corner). We draw the rim on the visible edge, i.e. 8, rather than
 * reproducing an invisible discrepancy. Noted in the spec.
 */
export const TILE_RADIUS_TR = 8

/** `Close` 28734:65594 — an 18 × 18 pill at tile-local (48, −8): its centre
 *  lands 1px OUTSIDE the tile's top-right corner, diagonally. */
export const BADGE = 18
export const BADGE_X = 48
export const BADGE_Y = -8
/** The glyph box inside it — `Frame` 28734:65595, 16 × 16 at (1, 1). */
export const BADGE_GLYPH = 16

/** The field, both states (28364:40219 → 28726:64923). */
export const FIELD_H = 138
export const FIELD_H_ATTACHED = 184
/** What each row below the tile has to travel when the layout snaps. */
export const SHIFT_ROW = FIELD_H_ATTACHED - FIELD_H // 46 — buttons, and the chips
export const SHIFT_TEXT = 72 // the placeholder line: y 17 → 89

/**
 * The seating bloom's radius (ours, not drawn): the light that pours under the
 * tile as it lands. 68 puts the gradient's lit core (its ≥60% stops end at 55%
 * of the radius) at ~37px — just past the 28px half-tile, so the glass around
 * the tile lights and the text row never does.
 */
export const SEAT_BLOOM_R = 68

/**
 * A viewport rect as the store carries it. Lives here because both ends of
 * every flight need it — the picker measures the stage, the composer measures
 * the tile — and a shared leaf module keeps those two files from importing each
 * other in a circle.
 */
export function rectOf(el: Element): import('@/state/ui').FlightRect {
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

/**
 * When the field acknowledges the catch, measured from the flight's start.
 * The seat spring runs 620ms but the object is visually home at ~300 — the
 * remainder is a 2% settle. Hanging the flash off the spring's completion put
 * it a third of a second late, which read as an unrelated blink.
 */
export const SEAT_ACK_DELAY = 300

/** The field's own radius (`rounded-[32px]` on `.he-composer`). Needed as a
 *  number by the close, which re-states the field's shape as a clip. */
export const FIELD_RADIUS = 32
/** The field's settled bottom padding (Figma's 16 on both boards). */
export const FIELD_PAD_B = 16

/**
 * WHEN BUILD'S PAINT ANSWERS THE ATTACHMENT — and why it is not the same
 * instant as its `disabled` attribute.
 *
 * `Build` is armed by a template alone (spec §13.5-1, ours and deliberate), so
 * removing one disarms it. Its two states are INVERTED — an opaque #fafafa
 * plate with near-black ink, against an 8%-white ghost with 24%-white ink — and
 * a simultaneous cross of an inverted pair has no legible middle: measured on
 * the shipped build, plate-to-label contrast collapses to **1.17 : 1** ~35ms in
 * and stays under 2 : 1 for another ~50ms. Three frames of a pale translucent
 * plate with no readable label, and (worse) the plate is translucent exactly
 * while the row carrying it is travelling 46px, so the eye tracks it and sees
 * every one of those frames. That is the "pale scaling blob" the designer filmed.
 *
 * A colour cross that has no good middle can only be moved, not fixed, so it
 * moves off the travel: the attachment's contribution to Build's LOOK lands one
 * beat after its contribution to Build's BEHAVIOUR. `disabled` flips in the
 * detach commit (the button must never be clickable while it is not), the paint
 * flips when the field has finished closing — the house rule "the content lags
 * the container", the same one `listSwapBehind` encodes for the dock's shelf.
 * Typing still arms it instantly: only the attachment's half of `armed` waits.
 *
 * Arming is the mirror: the paint lights when the object is HOME, not when the
 * store says it is attached — the same `SEAT_ACK_DELAY` beat the field's own
 * acknowledgment uses, so the tile landing, the rim's flash and the button
 * lighting are one event instead of three.
 */
export const ARM_PAINT_DELAY = SEAT_ACK_DELAY

/**
 * …and how long the disarm waits: the close's own spring duration
 * (`FIELD_CLOSE`, .3s). Measured on the frozen-clock film the rows are within
 * 1px of home by ~215ms and the field's painted edge lands at ~300 — so the
 * cross plays on ground that has stopped moving, which is the whole point.
 * Read from the token rather than typed, so retuning the close retunes this.
 */
export const DISARM_PAINT_DELAY = FIELD_CLOSE.duration * 1000
