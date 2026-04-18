import { SectionHeader } from '../shared/SectionHeader';
import { BaseSettings } from '../settings/BaseSettings';
import { ModelSettings } from '../settings/ModelSettings';
import { ExportSettings } from '../settings/ExportSettings';
import { ColorSettings } from '../settings/ColorSettings';
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
              magnets={config.magnets}
              mounting={config.mounting}
              onContentChange={onContentChange}
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

        <SectionHeader title="Export" defaultOpen>
          <ExportSettings
            exportConfig={config.export}
            onChange={onExportChange}
            onExport={onExport}
            isExporting={isExporting}
          />
        </SectionHeader>
      </div>

      <div className="px-3 py-2 border-t border-gray-700 text-xs text-gray-500">
        All dimensions in millimeters
      </div>
    </aside>
  );
}
