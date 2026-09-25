/**
 * The page menu's glyphs, off its own board (Figma 31076:31629, the frame `Menu` 31076:37714),
 * exported through the Plugin API (`node.exportAsync({ format: 'SVG_STRING' })`, 25.09.2026) — the
 * asset URLs on www.figma.com are cut by the session's proxy, the export is not. Paths are the
 * export's to the unit; only the paint moved to `currentColor` where the host sets the ink.
 *
 *  · `search` (31076:37717) — Material Symbols' filled search on the 24 grid, drawn at 32 % white
 *    (`Neutral Alpha/400` in the dark theme); the field sets that ink.
 *  · the check (31076:37727, the row's leading 24 box) — white, the 20 glyph centred in its 24.
 */
type P = { className?: string }

export const GlyphSearch24 = ({ className }: P) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.6675 14.0629H15.3782L19.8674 18.6369L18.5269 20L14.0288 15.4351V14.7124L13.7859 14.4563C12.7603 15.3528 11.4288 15.8925 9.98043 15.8925C6.75075 15.8925 4.13281 13.2304 4.13281 9.94626C4.13281 6.66209 6.75075 4 9.98043 4C13.2101 4 15.828 6.66209 15.828 9.94626C15.828 11.4191 15.2973 12.773 14.4156 13.8159L14.6675 14.0629ZM5.93205 9.94606C5.93205 12.2239 7.74031 14.0627 9.9804 14.0627C12.2205 14.0627 14.0287 12.2239 14.0287 9.94606C14.0287 7.66819 12.2205 5.82943 9.9804 5.82943C7.74031 5.82943 5.93205 7.66819 5.93205 9.94606Z"
      fill="currentColor"
    />
  </svg>
)

export const GlyphCheck24 = ({ className }: P) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path
      d="M10.1044 14.6171L16.4698 8.25167C16.5785 8.14153 16.7059 8.08514 16.8519 8.0825C16.9977 8.07986 17.1283 8.13625 17.2438 8.25167C17.3592 8.36708 17.4169 8.49528 17.4169 8.63625C17.4169 8.77736 17.3619 8.90292 17.2519 9.01292L10.59 15.6844C10.4545 15.821 10.2964 15.8894 10.1158 15.8894C9.93514 15.8894 9.7764 15.821 9.63959 15.6844L6.76459 12.8094C6.65459 12.6992 6.59695 12.5728 6.59167 12.4302C6.58626 12.2877 6.64126 12.1588 6.75667 12.0433C6.87209 11.9279 7.00091 11.8702 7.14313 11.8702C7.28535 11.8702 7.41188 11.9279 7.52271 12.0433L10.1044 14.6171Z"
      fill="currentColor"
    />
  </svg>
)
