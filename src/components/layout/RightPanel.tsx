import { SectionHeader } from '../shared/SectionHeader';
import { BaseSettings } from '../settings/BaseSettings';
import { ModelSettings } from '../settings/ModelSettings';
import { ColorSettings } from '../settings/ColorSettings';
import { Toggle } from '../shared/Toggle';
import type {
  ModelConfig,
  BaseConfig,
  ContentConfig,
  MagnetHoleConfig,
  MountingConfig,
  ExportConfig,
  ColorConfig,
} from '../../types/model';

interface RightPanelProps {
  config: ModelConfig;
  onBaseChange: (u: Partial<BaseConfig>) => void;
  onContentChange: (u: Partial<ContentConfig>) => void;
  onMagnetChange: (u: Partial<MagnetHoleConfig>) => void;
  onMountingChange: (u: Partial<MountingConfig>) => void;
  onExportChange: (u: Partial<ExportConfig>) => void;
  onColorsChange: (u: Partial<ColorConfig>) => void;
  onExport: () => void;
  isExporting?: boolean;
}

export function RightPanel({
  config,
  onBaseChange,
  onContentChange,
  onMagnetChange,
  onMountingChange,
  onExportChange,
  onColorsChange,
  onExport,
  isExporting,
}: RightPanelProps) {
  const showBase = config.generator !== 'lithophane';
  const showModel = config.generator !== 'lithophane' && config.generator !== 'image';

  return (
    <aside className="w-[280px] min-w-[280px] h-full bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
      <div className="px-3 py-3 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-300 tracking-tight">Model Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {showBase && (
          <SectionHeader title="Base Plate" defaultOpen>
            <BaseSettings base={config.base} onChange={onBaseChange} />
          </SectionHeader>
        )}

        {showModel && (
          <SectionHeader title="Model" defaultOpen>
            <ModelSettings
              content={config.content}
              base={config.base}
              magnets={config.magnets}
              mounting={config.mounting}
              onContentChange={onContentChange}
              onBaseChange={onBaseChange}
              onMagnetChange={onMagnetChange}
              onMountingChange={onMountingChange}
            />
          </SectionHeader>
        )}

        <SectionHeader title="Colors" defaultOpen={false}>
          <ColorSettings
            colors={config.colors}
            generator={config.generator}
            onChange={onColorsChange}
          />
        </SectionHeader>
      </div>

      {/* Pinned export footer */}
      <div className="px-3 py-3 border-t border-gray-700 space-y-2">
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
