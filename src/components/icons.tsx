// Compact, consistent 24×24 stroke icons used across the shell.
type P = { size?: number }
const base = (size = 20) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  'aria-hidden': true as const,
})
const stroke = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export const IconKanban = ({ size }: P) => (
  <svg {...base(size)}>
    <rect x="3" y="4" width="5" height="16" rx="1.5" {...stroke} />
    <rect x="10" y="4" width="5" height="10" rx="1.5" {...stroke} />
    <rect x="17" y="4" width="4" height="13" rx="1.5" {...stroke} />
  </svg>
)
export const IconList = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" {...stroke} />
  </svg>
)
export const IconCalendar = ({ size }: P) => (
  <svg {...base(size)}>
    <rect x="3" y="5" width="18" height="16" rx="2" {...stroke} />
    <path d="M3 10h18M8 3v4M16 3v4" {...stroke} />
  </svg>
)
export const IconTimeline = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M6 4v16" {...stroke} />
    <circle cx="6" cy="8" r="2" {...stroke} />
    <circle cx="6" cy="16" r="2" {...stroke} />
    <path d="M10 8h10M10 16h7" {...stroke} />
  </svg>
)
export const IconSearch = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="11" cy="11" r="7" {...stroke} />
    <path d="M20 20l-3.2-3.2" {...stroke} />
  </svg>
)
export const IconCommand = ({ size }: P) => (
  <svg {...base(size)}>
    <path
      d="M9 6a3 3 0 10-3 3h12a3 3 0 10-3-3v12a3 3 0 103-3H6a3 3 0 10 3 3V6z"
      {...stroke}
    />
  </svg>
)
export const IconSettings = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="3" {...stroke} />
    <path
      d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"
      {...stroke}
    />
  </svg>
)
export const IconSun = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="4" {...stroke} />
    <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" {...stroke} />
  </svg>
)
export const IconMoon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" {...stroke} />
  </svg>
)
export const IconContrast = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" {...stroke} />
    <path d="M12 3v18a9 9 0 000-18z" fill="currentColor" />
  </svg>
)
export const IconSparkle = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" {...stroke} />
  </svg>
)
export const IconTarget = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="8" {...stroke} />
    <circle cx="12" cy="12" r="3" {...stroke} />
  </svg>
)
export const IconBolt = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" {...stroke} />
  </svg>
)
export const IconBook = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z" {...stroke} />
    <path d="M4 19a2 2 0 012-2h13" {...stroke} />
  </svg>
)
export const IconMenu = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 6h16M4 12h16M4 18h16" {...stroke} />
  </svg>
)
export const IconChevron = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M9 6l6 6-6 6" {...stroke} />
  </svg>
)
export const IconClose = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M6 6l12 12M18 6L6 18" {...stroke} />
  </svg>
)
export const IconLogo = ({ size = 24 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="8" height="8" rx="2" fill="var(--primary)" />
    <rect x="13" y="3" width="8" height="5" rx="2" fill="var(--secondary)" />
    <rect x="13" y="10" width="8" height="11" rx="2" fill="var(--accent)" />
    <rect x="3" y="13" width="8" height="8" rx="2" fill="var(--primary)" opacity="0.55" />
  </svg>
)
export const IconCheck = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M5 12.5l4.5 4.5L19 7.5" {...stroke} />
  </svg>
)
export const IconPlus = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M12 5v14M5 12h14" {...stroke} />
  </svg>
)
export const IconPin = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M9 4h6l-1 6 4 4H6l4-4-1-6zM12 14v6" {...stroke} />
  </svg>
)
export const IconExternal = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" {...stroke} />
  </svg>
)
