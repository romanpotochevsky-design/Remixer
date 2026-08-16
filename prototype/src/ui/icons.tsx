/**
 * Icon set, redrawn to match the Figma kit (24px grid, ~1.7px strokes).
 *
 * The Figma asset exports are unreachable from this environment, so each glyph is
 * re-authored as inline SVG against the design screenshots. Keep every icon on
 * currentColor so buttons tint them through CSS, never through props.
 */

interface IconProps {
  size?: number
  className?: string
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

/** The real Remixer mark — lifted from the maintenance page's static logo export. */
export const LogoRemixer = ({ size = 32, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 120.012 120" fill="none" className={className} aria-label="Remixer" role="img">
    <path d="M90.0026 60.0028C73.4385 60.0028 60.0061 73.4351 60.0061 89.9991V119.995H120.012V59.9902H90.0152L90.0026 60.0028Z" fill="url(#rxl-a)" />
    <path d="M60.0058 29.9963V0H0.000244141V60.0051H29.9967C46.5608 60.0051 59.9932 46.5728 59.9932 30.0088L60.0058 29.9963Z" fill="url(#rxl-b)" />
    <path d="M29.9971 60.0078C46.5635 60.008 59.9931 73.4376 59.9932 90.0039C59.9932 106.57 46.5635 120 29.9971 120C13.4305 120 0 106.57 0 90.0039C0.000106173 73.4375 13.4305 60.0078 29.9971 60.0078ZM90.0029 0C106.569 0.000219558 119.999 13.4298 119.999 29.9961C119.999 46.5624 106.569 59.992 90.0029 59.9922C73.4363 59.9922 60.0059 46.5626 60.0059 29.9961C60.0059 13.4297 73.4364 0 90.0029 0Z" fill="url(#rxl-c)" />
    <path d="M60.0061 30H90.0026V59.9963C73.4385 59.9963 60.0061 46.5514 60.0061 30Z" fill="white" />
    <path d="M29.9965 60.0078 29.9965 30.0116 59.993 30.0116C59.993 46.5756 46.548 60.0078 29.9965 60.0078Z" fill="white" />
    <path d="M60.0061 89.998H30.0096L30.0096 60.0018C46.5737 60.0018 60.0061 73.4467 60.0061 89.998Z" fill="white" />
    <path d="M90.0033 60.0078V90.0041H60.0068C60.0068 73.4401 73.4518 60.0078 90.0033 60.0078Z" fill="white" />
    <defs>
      <linearGradient id="rxl-a" x1="60.0118" y1="59.9902" x2="120.011" y2="119.99" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3F3F46" /><stop offset="1" stopColor="#71717A" />
      </linearGradient>
      <linearGradient id="rxl-b" x1="0.00593913" y1="0" x2="60.0051" y2="59.9997" gradientUnits="userSpaceOnUse">
        <stop stopColor="#71717A" /><stop offset="1" stopColor="#3F3F46" />
      </linearGradient>
      <linearGradient id="rxl-c" x1="-42.6678" y1="168.529" x2="-31.5028" y2="-70.2933" gradientUnits="userSpaceOnUse">
        <stop stopColor="#BE59FF" /><stop offset="0.19" stopColor="#9D60FF" />
        <stop offset="0.74" stopColor="#4274FF" /><stop offset="1" stopColor="#1F7CFF" />
      </linearGradient>
    </defs>
  </svg>
)

/** Clock with a counter-clockwise arrow — version history. */
export const IconHistory = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4.5 5.5V9h3.5" />
    <path d="M4.8 9a8 8 0 1 1-.8 3" />
    <path d="M12 8v4.2l3 1.8" />
  </svg>
)

/** Panel with a filled column — collapse the sidebar. */
export const IconSidebar = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <path d="M14.5 4.5v15" />
    <path d="M17 8.5h.01M17 11.5h.01" strokeWidth="2" />
  </svg>
)

/** Pencil over a square — the Visual Editor. */
export const IconVisualEditor = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M11 4.5H7a3 3 0 0 0-3 3V17a3 3 0 0 0 3 3h9.5a3 3 0 0 0 3-3v-4" />
    <path d="m13.5 12.5 6.3-6.3a1.8 1.8 0 0 0-2.5-2.5l-6.3 6.3-.7 3.2 3.2-.7Z" />
  </svg>
)

/** Circular arrow — reload the preview. */
export const IconReload = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
    <path d="M19.7 3.5v3.4h-3.4" />
  </svg>
)

export const IconMonitor = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="4.5" width="18" height="12.5" rx="2.5" />
    <path d="M9.5 20.5h5M12 17v3.5" />
  </svg>
)

export const IconPhone = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="7.5" y="3" width="9" height="18" rx="2.5" />
    <path d="M11 17.8h2" />
  </svg>
)

/** Six-dot grid — the project switcher. */
export const IconGrid = ({ size = 24, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth="0" fill="currentColor">
    <circle cx="8" cy="6.5" r="1.5" /><circle cx="16" cy="6.5" r="1.5" />
    <circle cx="8" cy="12" r="1.5" /><circle cx="16" cy="12" r="1.5" />
    <circle cx="8" cy="17.5" r="1.5" /><circle cx="16" cy="17.5" r="1.5" />
  </svg>
)

export const IconChevronDown = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="m7 10 5 5 5-5" />
  </svg>
)

/** Credit coin — filled gold, like the Figma pill. */
export const IconCoin = ({ size = 22, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
    <defs>
      <linearGradient id="rxc-g" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F5D778" /><stop offset="1" stopColor="#D9A63C" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#rxc-g)" />
    <circle cx="12" cy="12" r="7.2" fill="none" stroke="#00000038" strokeWidth="1.2" />
    <path
      d="M12 8.2v7.6M9.6 10.4c0-1 1-1.6 2.4-1.6s2.4.6 2.4 1.5c0 2.2-4.8 1.3-4.8 3.4 0 1 1 1.6 2.4 1.6s2.4-.7 2.4-1.7"
      fill="none" stroke="#7a5410" strokeWidth="1.4" strokeLinecap="round"
    />
  </svg>
)

export const IconPlus = ({ size = 13, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconMic = ({ size = 13, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
  </svg>
)

export const IconArrowUp = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth="2">
    <path d="M12 19V5m0 0-6 6m6-6 6 6" />
  </svg>
)

/** Paint blob — Website Styles. */
export const IconStyle = ({ size = 24, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3.5c4.7 0 8.5 3.4 8.5 7.6 0 2.6-2.1 4.7-4.7 4.7h-1.7a1.9 1.9 0 0 0-1.4 3.2c.3.4.5.8.5 1.3 0 .7-.6 1.2-1.3 1.2-4.6-.1-8.4-3.9-8.4-8.5S7.3 3.5 12 3.5Z" />
    <circle cx="8" cy="9" r="1.1" fill="currentColor" strokeWidth="0" />
    <circle cx="12.5" cy="7" r="1.1" fill="currentColor" strokeWidth="0" />
    <circle cx="16.4" cy="9.6" r="1.1" fill="currentColor" strokeWidth="0" />
  </svg>
)

/** Puzzle piece — integrations. */
export const IconExtension = ({ size = 24, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M9.5 4.5a2 2 0 1 1 4 0h3a1.5 1.5 0 0 1 1.5 1.5v3a2 2 0 1 1 0 4v3a1.5 1.5 0 0 1-1.5 1.5h-3.2a2 2 0 1 0-3.6 0H6.5A1.5 1.5 0 0 1 5 16v-3.2a2 2 0 1 1 0-3.6V6A1.5 1.5 0 0 1 6.5 4.5h3Z" />
  </svg>
)

export const IconAnalytics = ({ size = 24, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M8.5 15.5v-3M12 15.5V8.5M15.5 15.5v-5" />
  </svg>
)

export const IconCloud = ({ size = 24, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M7.5 18.5a4.2 4.2 0 0 1-.6-8.4 5.4 5.4 0 0 1 10.5 1.2 3.6 3.6 0 0 1-.7 7.2h-9.2Z" />
  </svg>
)

/** Rounded chat bubble — the support (freshchat) button. */
export const IconChatBubble = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className} fill="currentColor" strokeWidth="0">
    <path d="M12 3.5c-4.7 0-8.5 3.2-8.5 7.2 0 4 3.8 7.2 8.5 7.2.6 0 1.2-.05 1.8-.15l3.5 2c.5.3 1.2-.1 1.1-.7l-.4-2.6c1.9-1.3 3-3.4 3-5.7 0-4-3.3-7.25-9-7.25Z" />
    <rect x="8" y="9.6" width="8" height="1.7" rx="0.85" fill="#18181b" />
    <rect x="8" y="12.6" width="5" height="1.7" rx="0.85" fill="#18181b" />
  </svg>
)

export const IconEdit = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="m14.5 6.5 3 3L9 18l-3.8.8L6 15l8.5-8.5Z" />
    <path d="m13 8 3 3" />
  </svg>
)

export const IconCheck = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth="2.2">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
)

export const IconExternal = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M14 5h5v5M19 5l-8 8" />
    <path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
  </svg>
)

/* ------------------------------------------- AI message actions (Figma 25819:143308) */

/** Curved arrow back into the thread — "reply to this / try again". */
export const IconReplyArrow = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M8.5 7.5 4.5 11.5l4 4" />
    <path d="M4.5 11.5h9.5a5.5 5.5 0 0 1 5.5 5.5v1.5" />
  </svg>
)

export const IconThumbUp = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M7.5 21h8.6a2 2 0 0 0 2-1.7l1-6.3a1.6 1.6 0 0 0-1.6-1.9h-4.2l.7-3.6A2.2 2.2 0 0 0 11.8 5l-.4-.1L7.5 11.6" />
    <rect x="3" y="11" width="4.5" height="10" rx="1.4" />
  </svg>
)

export const IconThumbDown = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M7.5 3h8.6a2 2 0 0 1 2 1.7l1 6.3a1.6 1.6 0 0 1-1.6 1.9h-4.2l.7 3.6A2.2 2.2 0 0 1 11.8 19l-.4.1-3.9-6.7" />
    <rect x="3" y="3" width="4.5" height="10" rx="1.4" />
  </svg>
)

export const IconCopy = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2.6" />
    <path d="M15.5 4.5a2 2 0 0 0-2-2H6a2.5 2.5 0 0 0-2.5 2.5v7.5a2 2 0 0 0 2 2" />
  </svg>
)

/** Horizontal ellipsis — the overflow menu. */
export const IconMore = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth="0" fill="currentColor">
    <circle cx="5.5" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="18.5" cy="12" r="1.6" />
  </svg>
)
