import { SectionHeader } from '../shared/SectionHeader';
import { BaseSettings, BorderSettings } from '../settings/BaseSettings';
import { MountingSettings } from '../settings/MountingSettings';
import { Toggle } from '../shared/Toggle';
import type {
  ModelConfig,
  BaseConfig,
  MagnetHoleConfig,
  MountingConfig,
  ExportConfig,
} from '../../types/model';

interface RightPanelProps {
  config: ModelConfig;
  onBaseChange: (u: Partial<BaseConfig>) => void;
  onMagnetChange: (u: Partial<MagnetHoleConfig>) => void;
  onMountingChange: (u: Partial<MountingConfig>) => void;
  onExportChange: (u: Partial<ExportConfig>) => void;
  onExport: () => void;
  isExporting?: boolean;
}

export function RightPanel({
  config,
  onBaseChange,
  onMagnetChange,
  onMountingChange,
  onExportChange,
  onExport,
  isExporting,
}: RightPanelProps) {
  const showMounting = config.generator !== 'lithophane';

  return (
    <aside className="w-[280px] min-w-[280px] h-full bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <SectionHeader title="Base Plate" defaultOpen>
          <BaseSettings base={config.base} onChange={onBaseChange} />
        </SectionHeader>

        <SectionHeader title="Border Frame" defaultOpen>
          <BorderSettings base={config.base} onChange={onBaseChange} />
        </SectionHeader>

        {showMounting && (
          <SectionHeader title="Mounting" defaultOpen>
            <MountingSettings
              base={config.base}
              magnets={config.magnets}
              mounting={config.mounting}
              onBaseChange={onBaseChange}
              onMagnetChange={onMagnetChange}
              onMountingChange={onMountingChange}
            />
          </SectionHeader>
        )}
      </div>

      {/* Pinned export footer */}
      <div className="px-3 py-3 border-t border-gray-700 space-y-2">
        <div className="text-center text-[10px] text-gray-600 pb-1">
          Created with{' '}
          <svg className="inline w-2.5 h-2.5 -mt-px" viewBox="0 0 24 24" fill="#ef4444">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>{' '}
          by{' '}
          <a href="https://ardacanbakis.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 transition-colors">
            Arda Canbakis
          </a>
        </div>
        <Toggle
          label="Separate Parts (multi-color)"
          checked={config.export.separateParts}
          onChange={v => onExportChange({ separateParts: v })}
        />
        <button
          onClick={onExport}
          disabled={isExporting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isExporting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {config.export.separateParts ? 'Download ZIP (parts)' : 'Download STL'}
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
