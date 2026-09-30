/**
 * The Visual Editor's glyphs. The two tool glyphs are the board's own vectors (31280:115372,
 * exported through the Plugin API — the proxy blocks figma.com asset URLs; the files are kept in
 * prototype/scratchpad/visual-editor-board/icons/). Undo / Redo are drawn here in the same box and
 * stroke as the board's Select glyph (24, stroke 1.5, round caps), since the board has no history
 * buttons yet — the designer asked for them in words (30.09.2026).
 */
type Props = { size?: number; className?: string }

/** «T» inside a selection frame with corner handles — the Edit tool (board 31280:115374). */
export const GlyphEditText = ({ size = 24, className }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path
      d="M11.4212 9.94583H9.5959C9.43192 9.94583 9.2945 9.89026 9.18365 9.7791C9.07264 9.66795 9.01714 9.53105 9.01714 9.36841C9.01714 9.20561 9.07249 9.06923 9.1832 8.95926C9.29406 8.84945 9.43133 8.79454 9.59501 8.79454H14.3979C14.5615 8.79454 14.6999 8.8496 14.813 8.95971C14.9262 9.06982 14.9829 9.2062 14.9829 9.36885C14.9829 9.53165 14.9274 9.66855 14.8164 9.77955C14.7055 9.89041 14.5681 9.94583 14.4041 9.94583H12.5788V14.6258C12.5788 14.7899 12.5233 14.9276 12.4123 15.0387C12.3013 15.1499 12.1638 15.2055 11.9998 15.2055C11.8356 15.2055 11.6982 15.1499 11.5875 15.0387C11.4767 14.9276 11.4212 14.7899 11.4212 14.6258V9.94583ZM3 20.2841V17.161C3 16.9582 3.06864 16.7882 3.20591 16.651C3.34303 16.5138 3.51302 16.4451 3.71589 16.4451H4.69867V7.55487H3.71433C3.51117 7.55487 3.34132 7.48624 3.20479 7.34896C3.06826 7.21184 3 7.04185 3 6.83899V3.71589C3 3.51302 3.06864 3.34303 3.20591 3.20591C3.34303 3.06864 3.51302 3 3.71589 3H6.83898C7.04185 3 7.21184 3.06864 7.34896 3.20591C7.48624 3.34303 7.55487 3.51302 7.55487 3.71589V4.69867H16.4451V3.71433C16.4451 3.51117 16.5138 3.34132 16.651 3.20479C16.7882 3.06826 16.9581 3 17.161 3H20.2841C20.487 3 20.657 3.06864 20.7941 3.20591C20.9314 3.34303 21 3.51302 21 3.71589V6.83899C21 7.04185 20.9314 7.21184 20.7941 7.34896C20.657 7.48624 20.487 7.55487 20.2841 7.55487H19.3013V16.4451H20.2857C20.4888 16.4451 20.6587 16.5138 20.7952 16.651C20.9317 16.7882 21 16.9582 21 17.161V20.2841C21 20.487 20.9314 20.657 20.7941 20.7941C20.657 20.9314 20.487 21 20.2841 21H17.161C16.9581 21 16.7882 20.9314 16.651 20.7941C16.5138 20.657 16.4451 20.487 16.4451 20.2841V19.3013H7.55487V20.2857C7.55487 20.4888 7.48624 20.6587 7.34896 20.7952C7.21184 20.9317 7.04185 21 6.83898 21H3.71589C3.51302 21 3.34303 20.9314 3.20591 20.7941C3.06864 20.657 3 20.487 3 20.2841ZM7.55487 18.1438H16.4451V17.1595C16.4451 16.9563 16.5138 16.7865 16.651 16.6499C16.7882 16.5134 16.9581 16.4451 17.161 16.4451H18.1438V7.55487H17.1595C16.9563 7.55487 16.7865 7.48624 16.6499 7.34896C16.5134 7.21184 16.4451 7.04185 16.4451 6.83899V5.8562H7.55487V6.84054C7.55487 7.0437 7.48624 7.21355 7.34896 7.35008C7.21184 7.48661 7.04185 7.55487 6.83898 7.55487H5.8562V16.4451H6.84054C7.0437 16.4451 7.21355 16.5138 7.35008 16.651C7.48661 16.7882 7.55487 16.9582 7.55487 17.161V18.1438ZM4.15753 6.39734H6.39734V4.15753H4.15753V6.39734ZM17.6027 6.39734H19.8425V4.15753H17.6027V6.39734ZM17.6027 19.8425H19.8425V17.6027H17.6027V19.8425ZM4.15753 19.8425H6.39734V17.6027H4.15753V19.8425Z"
      fill="currentColor"
    />
  </svg>
)

/** A pointer with rays — the Select tool (board 31280:115375). */
export const GlyphSelect = ({ size = 24, className }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path
      d="M9.49482 17.1016L8.47316 19.6096M17.1015 9.49493L19.6095 8.47327M6.4643 13.9895L3.88512 14.8151M13.9894 6.46441L14.815 3.88523M6.27426 9.3588L3.70796 8.49394M9.35869 6.27437L8.49383 3.70807M11.3219 11.3223L21.1402 14.6579L16.3044 16.3049L14.6575 21.1407L11.3219 11.3223Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/** ↶ — one step back through the staged edits. */
export const GlyphUndo = ({ size = 24, className }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M8.5 6.5 4.5 10.5l4 4M4.75 10.5H15a4.5 4.5 0 0 1 0 9h-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** ↷ — the step forward again. */
export const GlyphRedo = ({ size = 24, className }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="m15.5 6.5 4 4-4 4M19.25 10.5H9a4.5 4.5 0 0 0 0 9h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** A picture with a curved arrow — "Replace photo" on a hovered photo. */
export const GlyphReplacePhoto = ({ size = 20, className }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <rect x="3.75" y="5.75" width="16.5" height="12.5" rx="2.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="m6.5 15.5 3.6-3.9a1 1 0 0 1 1.5 0l2.4 2.6 1.6-1.6a1 1 0 0 1 1.4 0l2.5 2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="15.5" cy="9.5" r="1.25" fill="currentColor" />
  </svg>
)
