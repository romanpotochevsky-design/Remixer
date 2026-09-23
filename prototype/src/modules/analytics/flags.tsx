/**
 * THE COUNTRY CARD'S FLAGS — 16 × 16, radius 3, the box the board draws in front of the name
 * (Figma 30934:95011). The board fills it with an asset per country, and figma.com's asset
 * URLs are refused by this session's proxy, so these are drawn: a flag at 16px is read by its
 * bands and its field, not by its emblem, which is why a simplified Canadian leaf and a Union
 * flag without its exact geometry are honest at this size and would not be at 64.
 *
 * Emoji were the other option and are not usable: on Windows they render as two letters in a
 * box, and the audience for this prototype is on Windows as often as on a Mac.
 */
const FIELD = { width: 16, height: 16, viewBox: '0 0 16 16' } as const

/** United States — seven bands for thirteen stripes, the canton six deep, its stars as dots. */
const US = () => (
  <svg {...FIELD}>
    <rect width="16" height="16" fill="#fff" />
    {[0, 2, 4, 6].map((i) => (
      <rect key={i} y={(i * 16) / 7} width="16" height={16 / 7} fill="#b22234" />
    ))}
    <rect width="7.2" height={(16 / 7) * 3} fill="#3c3b6e" />
    {[1.2, 3.6, 6].map((x) =>
      [1.2, 3.4, 5.6].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.55" fill="#fff" />),
    )}
  </svg>
)

/** Canada — the two red pales and a leaf reduced to its silhouette. */
const CA = () => (
  <svg {...FIELD}>
    <rect width="16" height="16" fill="#fff" />
    <rect width="4" height="16" fill="#d52b1e" />
    <rect x="12" width="4" height="16" fill="#d52b1e" />
    <path
      d="M8 3.4l.9 2.1 1.7-.5-.6 1.9 1.9.3-1.6 1.2.5 1.1-1.9-.3.1 2.4h-.2l.1-2.4-1.9.3.5-1.1L5.9 7.2l1.9-.3-.6-1.9 1.7.5z"
      fill="#d52b1e"
    />
  </svg>
)

/** United Kingdom — saltires under the cross, in the order the flag stacks them. */
const GB = () => (
  <svg {...FIELD}>
    <rect width="16" height="16" fill="#012169" />
    <path d="M0 0l16 16M16 0L0 16" stroke="#fff" strokeWidth="3.2" />
    <path d="M0 0l16 16M16 0L0 16" stroke="#c8102e" strokeWidth="1.8" />
    <path d="M8 0v16M0 8h16" stroke="#fff" strokeWidth="5.2" />
    <path d="M8 0v16M0 8h16" stroke="#c8102e" strokeWidth="3" />
  </svg>
)

/** Germany — black, red, gold. */
const DE = () => (
  <svg {...FIELD}>
    <rect width="16" height="5.34" fill="#000" />
    <rect y="5.34" width="16" height="5.33" fill="#dd0000" />
    <rect y="10.67" width="16" height="5.33" fill="#ffce00" />
  </svg>
)

/** France — blue, white, red. */
const FR = () => (
  <svg {...FIELD}>
    <rect width="5.34" height="16" fill="#0055a4" />
    <rect x="5.34" width="5.33" height="16" fill="#fff" />
    <rect x="10.67" width="5.33" height="16" fill="#ef4135" />
  </svg>
)

const FLAGS: Record<string, () => JSX.Element> = { us: US, ca: CA, gb: GB, de: DE, fr: FR }

export function Flag({ code }: { code: string }) {
  const Glyph = FLAGS[code]
  if (!Glyph) return null
  return (
    <span data-analytics-flag className="block h-4 w-4 flex-none overflow-hidden rounded-[3px]">
      <Glyph />
    </span>
  )
}
