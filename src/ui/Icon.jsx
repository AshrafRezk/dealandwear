const PATHS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9.5 16.5-4.6-4.6',
  quiz: 'M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  heart: 'M12 20s-7.5-4.6-9.2-9.3C1.7 7.5 3.8 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.2 0 5.3 3 4.2 6.2C19.5 15.4 12 20 12 20z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7.5 8.5c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5',
  close: 'M6 6l12 12M18 6 6 18',
  menu: 'M4 7h16M4 12h16M4 17h16',
  chevronDown: 'm6 9 6 6 6-6',
  chevronRight: 'm9 6 6 6-6 6',
  chevronLeft: 'm15 6-6 6 6 6',
  arrowRight: 'M5 12h14m-5-5 5 5-5 5',
  filter: 'M4 6h16M7 12h10m-7 6h4',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  share: 'M12 3v12m0-12L8 7m4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6',
  external: 'M14 4h6v6m0-6L11 13M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  trash: 'M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3',
  download: 'M12 4v11m0 0-4-4m4 4 4-4M5 20h14',
  info: 'M12 8h.01M11 12h1v5h1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  thumbUp: 'M7 21H4v-9h3m0 9V12l4-8a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.3l-1.2 6.7a2 2 0 0 1-2 1.7H7z',
  thumbDown: 'M17 3h3v9h-3m0-9v9l-4 8a2 2 0 0 1-2-2v-4H5.5a2 2 0 0 1-2-2.3L4.7 4.7a2 2 0 0 1 2-1.7H17z',
  skip: 'M5 5l8 7-8 7M15 5v14',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  store: 'M4 9l1.5-5h13L20 9M4 9h16M4 9v11h16V9M9 20v-6h6v6',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z',
  volume: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6m2.5-8.5a7.5 7.5 0 0 1 0 11',
  volumeOff: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5m0-5-5 5',
  phone: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm3 15h2',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z',
};

export default function Icon({ name, size = 20, title, className, strokeWidth = 1.5 }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path d={d} />
    </svg>
  );
}
