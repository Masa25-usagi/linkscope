import type { SVGProps } from 'react'

export type IconName =
  | 'shield'
  | 'book'
  | 'settings'
  | 'help'
  | 'menu'
  | 'file'
  | 'check'
  | 'database'
  | 'search'
  | 'filter'
  | 'download'
  | 'warning'
  | 'sparkle'
  | 'chevron-right'
  | 'chevron-down'
  | 'chevron-up'
  | 'plus'
  | 'minus'
  | 'info'
  | 'x'
  | 'reset'
  | 'user'
  | 'lock'
  | 'chat'
  | 'at'
  | 'link'
  | 'scan'
  | 'target'

const paths: Record<IconName, React.ReactNode> = {
  shield: <path d="M12 3 5 6v5c0 4.7 3 8.1 7 10 4-1.9 7-5.3 7-10V6l-7-3Z" />,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /></>,
  settings: <><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /><path d="m19 13.5 1.5 1-.9 1.6-1.7-.5a7.8 7.8 0 0 1-1.3 1.3l.5 1.7-1.6.9-1-1.5a7 7 0 0 1-1.7.2l-.9 1.6h-1.8l-.9-1.6a7 7 0 0 1-1.7-.2l-1 1.5-1.6-.9.5-1.7a7.8 7.8 0 0 1-1.3-1.3l-1.7.5-.9-1.6 1.5-1a7 7 0 0 1-.1-1.5c0-.5 0-1 .1-1.5l-1.5-1 .9-1.6 1.7.5A7.8 7.8 0 0 1 6.1 7l-.5-1.7 1.6-.9 1 1.5a7 7 0 0 1 1.7-.2l.9-1.6h1.8l.9 1.6a7 7 0 0 1 1.7.2l1-1.5 1.6.9-.5 1.7a7.8 7.8 0 0 1 1.3 1.3l1.7-.5.9 1.6-1.5 1c.1.5.1 1 .1 1.5s0 1-.1 1.5Z" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 3.9 2.1c-.9.6-1.5 1-1.5 2.2" /><path d="M12 16.5h.01" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  file: <><path d="M6 3.5h7l5 5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" /><path d="M13 3.5V9h5M8 13h6M8 17h6" /></>,
  check: <path d="m5 12 4.2 4.2L19 6.5" />,
  database: <><ellipse cx="12" cy="5.5" rx="7.5" ry="3" /><path d="M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6M4.5 11.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4.2 4.2" /></>,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  download: <><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" /></>,
  warning: <><path d="m12 3 9 17H3L12 3Z" /><path d="M12 8v5M12 16h.01" /></>,
  sparkle: <><path d="m12 3 1.2 4.8L18 9l-4.8 1.2L12 15l-1.2-4.8L6 9l4.8-1.2L12 3ZM19 14l.6 2.4L22 17l-2.4.6L19 20l-.6-2.4L16 17l2.4-.6L19 14Z" /></>,
  'chevron-right': <path d="m9 5 7 7-7 7" />,
  'chevron-down': <path d="m5 9 7 7 7-7" />,
  'chevron-up': <path d="m5 15 7-7 7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  reset: <><path d="M5 9a7.5 7.5 0 1 1-.2 6" /><path d="M5 4v5h5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  chat: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" /></>,
  at: <><circle cx="12" cy="12" r="4" /><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.6 7.2" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.8 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.8-1.7" /></>,
  scan: <><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><circle cx="12" cy="12" r="4" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
}

export function Icon({ name, size = 20, strokeWidth = 1.7, ...props }: { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  )
}

