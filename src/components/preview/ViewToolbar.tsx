import type { BuildPlate } from './buildPlates';

interface ViewToolbarProps {
  showGrid: boolean;
  darkMode: boolean;
  isFullscreen: boolean;
  buildPlateIndex: number;
  buildPlates: BuildPlate[];
  onViewChange: (view: string) => void;
  onHome: () => void;
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleGrid: () => void;
  onToggleDarkMode: () => void;
  onToggleFullscreen: () => void;
  onBuildPlateChange: (index: number) => void;
}

export function ViewToolbar({
  showGrid,
  darkMode,
  isFullscreen,
  buildPlateIndex,
  buildPlates,
  onViewChange,
  onHome,
  onFit,
  onZoomIn,
  onZoomOut,
  onToggleGrid,
  onToggleDarkMode,
  onToggleFullscreen,
  onBuildPlateChange,
}: ViewToolbarProps) {
  const base = darkMode
    ? 'bg-gray-900/85 border border-gray-700/60 text-gray-300 hover:bg-gray-700/80 hover:text-white backdrop-blur-sm'
    : 'bg-white/85 border border-gray-200 text-gray-600 hover:bg-gray-100 backdrop-blur-sm';

  const active = darkMode
    ? 'bg-blue-900/70 border border-blue-500/60 text-blue-200'
    : 'bg-blue-100 border border-blue-400 text-blue-700';

  const btn = (isActive = false) =>
    `h-7 px-2 flex items-center justify-center rounded text-[11px] font-medium transition-colors cursor-pointer select-none ${isActive ? active : base}`;

  const iconBtn = (isActive = false) =>
    `w-7 h-7 flex items-center justify-center rounded transition-colors cursor-pointer select-none ${isActive ? active : base}`;

  const sep = `w-px self-stretch mx-0.5 ${darkMode ? 'bg-gray-700/60' : 'bg-gray-200'}`;

  const views: [string, string][] = [
    ['Top', 'top'],
    ['Bot', 'bottom'],
    ['Front', 'front'],
    ['Back', 'back'],
    ['Left', 'left'],
    ['Right', 'right'],
  ];

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 select-none z-10 rounded-lg overflow-hidden shadow-lg">
      {/* View presets */}
      <div className={`flex items-center gap-0.5 px-1.5 py-1 rounded-lg ${darkMode ? 'bg-gray-900/85 border border-gray-700/60 backdrop-blur-sm' : 'bg-white/85 border border-gray-200 backdrop-blur-sm'}`}>
        {views.map(([label, view]) => (
          <button
            key={view}
            className={btn()}
            onClick={() => onViewChange(view)}
            title={`${label} View`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Navigation: Home + Fit */}
      <div className={`flex items-center gap-0.5 px-1.5 py-1 rounded-lg ${darkMode ? 'bg-gray-900/85 border border-gray-700/60 backdrop-blur-sm' : 'bg-white/85 border border-gray-200 backdrop-blur-sm'}`}>
        <button className={iconBtn()} onClick={onHome} title="Home View">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 12l9-9 9 9" />
            <path d="M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
          </svg>
        </button>
        <button className={iconBtn()} onClick={onFit} title="Fit to Screen">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
      </div>

      {/* Zoom */}
      <div className={`flex items-center gap-0.5 px-1.5 py-1 rounded-lg ${darkMode ? 'bg-gray-900/85 border border-gray-700/60 backdrop-blur-sm' : 'bg-white/85 border border-gray-200 backdrop-blur-sm'}`}>
        <button className={iconBtn()} onClick={onZoomIn} title="Zoom In">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
          </svg>
        </button>
        <button className={iconBtn()} onClick={onZoomOut} title="Zoom Out">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35M8 11h6" />
          </svg>
        </button>
      </div>

      {/* Toggles */}
      <div className={`flex items-center gap-0.5 px-1.5 py-1 rounded-lg ${darkMode ? 'bg-gray-900/85 border border-gray-700/60 backdrop-blur-sm' : 'bg-white/85 border border-gray-200 backdrop-blur-sm'}`}>
        <button className={iconBtn(showGrid)} onClick={onToggleGrid} title={showGrid ? 'Hide Grid' : 'Show Grid'}>
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="3" width="18" height="18" rx="1" />
            <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
          </svg>
        </button>
        <button className={iconBtn()} onClick={onToggleDarkMode} title={darkMode ? 'Light Background' : 'Dark Background'}>
          {darkMode ? (
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
        <button className={iconBtn(isFullscreen)} onClick={onToggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
          {isFullscreen ? (
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" />
            </svg>
          )}
        </button>
      </div>

      {/* Build plate selector */}
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${darkMode ? 'bg-gray-900/85 border border-gray-700/60 backdrop-blur-sm' : 'bg-white/85 border border-gray-200 backdrop-blur-sm'}`}>
        <select
          value={buildPlateIndex}
          onChange={(e) => onBuildPlateChange(Number(e.target.value))}
          className={`text-[11px] rounded cursor-pointer bg-transparent focus:outline-none ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
          title="Build Plate"
        >
          {buildPlates.map((plate, i) => (
            <option key={plate.name} value={i} className={darkMode ? 'bg-gray-800' : 'bg-white'}>
              {plate.name}
            </option>
          ))}
        </select>
        <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'} whitespace-nowrap`}>
          {buildPlates[buildPlateIndex].width}×{buildPlates[buildPlateIndex].height}mm
        </span>
      </div>

      {/* suppress unused var warning for sep */}
      <span className={sep} style={{ display: 'none' }} />
    </div>
  );
}
