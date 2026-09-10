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

/**
 * ─────────────── ONE SLOT: WHAT HAPPENS WHEN A SECOND TEMPLATE ARRIVES ───────
 *
 * Designer, 26.08.2026: «один шаблон, если ты снова нажмёшь "Add template" и
 * выберешь, то оно просто заменит шаблон, нужна анимация для этого красивая и
 * плавная». The incoming flight is unchanged — it IS the animation — and the
 * OUTGOING drawing stays in the slot until the new one lands, then collapses
 * (scale 0.9 + fade) behind it. So the slot is never empty and no row moves: the
 * field is already tall, and its 138 → 184 snap must NOT re-run (that snap is
 * what holds the hero column's height through a negative margin — re-running it
 * would jog the whole column for a change that has no layout in it).
 *
 * ⚠️ THE COLLAPSE ENDS WHEN THE OBJECT IS VISUALLY HOME — at `SEAT_ACK_DELAY`,
 * the same 300ms beat the field's own acknowledgment keys off, NOT at "70% of the
 * 620ms spring". Measured, one frozen probe per timestamp (a polling loop starves
 * the page and stretches the timeline — the same flight read that way looked like
 * it took 818ms): out of the card's `+` the clone is 181px wide and ~525px away at
 * 30ms, 95px at 80, 67px at 130, 58.7 at 240 and home at 300 (55.7, i.e. inside
 * the tile's own 56 — the seat dip). The spring's remaining 300ms is a 2% settle
 * nobody watches. A collapse timed off 620 would therefore play its whole length
 * UNDER an object that had been sitting on the slot for a third of a second;
 * timed off 300 it is the old picture folding away as the new one lands, which is
 * the gesture that was asked for.
 *
 * ⚠️ AND ON THE `Choose a template` PATH IT IS INVISIBLE ANYWAY — measured, not
 * assumed, and it is why the collapse is not the point of this. A FLIP's clone is
 * the destination box dilated about the flight's fixed point, and on that path the
 * fixed point lands INSIDE the 56px tile (measured (12.35, 23.28) from its
 * corner), so the clone COVERS the slot on every frame from the full-screen stage
 * down: 263 of 375 sampled frames cover it strictly, and the ones that do not are
 * the final sub-pixel seat dip where the clone is 55.5 against the tile's 56.
 * Nothing drawn in that slot can be seen until the clone leaves.
 *
 * What the outgoing drawing is really FOR is the other doors — the card's blue `+`
 * today, any small source tomorrow — where the clone starts as a 233px card up in
 * the grid and does not reach the slot until ~200ms: without it the slot would
 * blink EMPTY on a page the customer is looking straight at. The collapse is how
 * it leaves once it has done that job.
 */
export const SWAP_OUT = 140
/** …so the collapse starts here, measured from the flight's start. */
export const SWAP_OUT_DELAY = SEAT_ACK_DELAY - SWAP_OUT

/**
 * The tile's answer to a press that changed nothing — picking the template that
 * is already attached. It dips and comes back (the only "settle" a photograph
 * can take without being painted over) while its edge flashes once. Not drawn;
 * ours, and the same length as the field's own catch acknowledgment so the two
 * read as one family.
 */
export const TILE_SETTLE = 280

/** The field's own radius (`rounded-[32px]` on `.he-composer`). Needed as a
 *  number by the close, which re-states the field's shape as a clip. */
export const FIELD_RADIUS = 32
/** The field's settled bottom padding (Figma's 16 on both boards). */
export const FIELD_PAD_B = 16

/*
 * WHEN BUILD'S PAINT ANSWERS THE ATTACHMENT — answer as of 26.08.2026: at once,
 * in the same commit as its `disabled` attribute. There are no paint-delay tokens
 * here any more, and this note exists so the next reader does not re-derive them.
 *
 * They existed for one measured reason. `Build` is armed by a template alone
 * (spec §13.5-1, ours and deliberate), and its enabled look used to be an opaque
 * #fafafa plate with near-black ink — the exact INVERSE of the 8%-white ghost with
 * 24%-white ink it disarms to. A simultaneous cross of an inverted pair has no
 * legible middle: measured on the shipped build, plate-to-label contrast collapsed
 * to **1.17 : 1** ~35ms in and stayed under 2 : 1 for another ~50ms — three frames
 * of a pale translucent plate with no readable label, and worse, translucent
 * exactly while the row carrying it travelled 46px, so the eye tracked it and saw
 * every frame. That was the "pale scaling blob" the designer filmed, and the fix
 * was to move the cross off the travel: `ARM_PAINT_DELAY` (= SEAT_ACK_DELAY) and
 * `DISARM_PAINT_DELAY` (= FIELD_CLOSE) held the paint a beat behind the state.
 *
 * The designer then made active Build ACTION BLUE («да, когда она активна, она
 * синяя», 26.08.2026), and blue↔ghost is not an inverted pair. Re-measured on the
 * built app: arming 2.20 → **3.95** → 3.53 : 1, disarming 3.53 → 3.93 → 2.20 : 1 —
 * the middle of the cross is now its most readable frame, and nothing dips below
 * the ghost end it is heading for. So the cross rides the movement again, the two
 * tokens and the lagged-flag hook are deleted, and the whole argument with its
 * numbers lives next to the button in `HomePage.tsx`.
 *
 * `SEAT_ACK_DELAY` above stays: the field's own acknowledgment of the catch is a
 * separate gesture and still keys off it.
 */
