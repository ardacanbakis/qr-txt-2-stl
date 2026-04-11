interface ViewToolbarProps {
  showGrid: boolean;
  darkMode: boolean;
  isFullscreen: boolean;
  onViewChange: (view: string) => void;
  onHome: () => void;
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleGrid: () => void;
  onToggleDarkMode: () => void;
  onToggleFullscreen: () => void;
}

export function ViewToolbar({
  showGrid,
  darkMode,
  isFullscreen,
  onViewChange,
  onHome,
  onFit,
  onZoomIn,
  onZoomOut,
  onToggleGrid,
  onToggleDarkMode,
  onToggleFullscreen,
}: ViewToolbarProps) {
  const btn = (active = false) =>
    `w-8 h-8 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
      active
        ? darkMode
          ? 'bg-blue-900/60 text-blue-300 border border-blue-500/50'
          : 'bg-blue-100 text-blue-700 border border-blue-400'
        : darkMode
          ? 'bg-gray-800/90 hover:bg-gray-700 text-gray-300 border border-gray-600/50'
          : 'bg-white/90 hover:bg-gray-100 text-gray-600 border border-gray-300'
    }`;

  const viewBtn =
    `px-2 py-1 text-[10px] font-semibold rounded cursor-pointer transition-colors ${
      darkMode
        ? 'bg-gray-800/90 hover:bg-gray-700 text-gray-300 border border-gray-600/50'
        : 'bg-white/90 hover:bg-gray-100 text-gray-600 border border-gray-300'
    }`;

  const sep = `w-6 mx-auto h-px ${darkMode ? 'bg-gray-600/50' : 'bg-gray-300'}`;

  const views: [string, string][] = [
    ['Top', 'top'],
    ['Bottom', 'bottom'],
    ['Front', 'front'],
    ['Back', 'back'],
    ['Left', 'left'],
    ['Right', 'right'],
  ];

  return (
    <div className="absolute top-[130px] left-3 flex flex-col gap-2 select-none">
      {/* View preset buttons */}
      <div className="grid grid-cols-2 gap-1">
        {views.map(([label, view]) => (
          <button
            key={view}
            className={viewBtn}
            onClick={() => onViewChange(view)}
            title={`${label} View`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={sep} />

      {/* Navigation */}
      <div className="flex flex-col gap-1.5 items-center">
        <button className={btn()} onClick={onHome} title="Home View">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 12l9-9 9 9" />
            <path d="M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
          </svg>
        </button>

        <button className={btn()} onClick={onFit} title="Fit to Screen">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
      </div>

      <div className={sep} />

      {/* Zoom */}
      <div className="flex flex-col gap-1.5 items-center">
        <button className={btn()} onClick={onZoomIn} title="Zoom In">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
          </svg>
        </button>

        <button className={btn()} onClick={onZoomOut} title="Zoom Out">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35M8 11h6" />
          </svg>
        </button>
      </div>

      <div className={sep} />

      {/* Toggles */}
      <div className="flex flex-col gap-1.5 items-center">
        <button className={btn(showGrid)} onClick={onToggleGrid} title={showGrid ? 'Hide Grid' : 'Show Grid'}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="3" width="18" height="18" rx="1" />
            <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
          </svg>
        </button>

        <button className={btn()} onClick={onToggleDarkMode} title={darkMode ? 'Light Background' : 'Dark Background'}>
          {darkMode ? (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>

        <button className={btn(isFullscreen)} onClick={onToggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
          {isFullscreen ? (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
