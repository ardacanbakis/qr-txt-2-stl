import { SectionHeader } from '../shared/SectionHeader';
import { InputSettings } from '../settings/InputSettings';
import { BaseSettings } from '../settings/BaseSettings';
import { ModelSettings } from '../settings/ModelSettings';
import { ExportSettings } from '../settings/ExportSettings';
import type { ModelConfig, BaseConfig, ContentConfig, MagnetHoleConfig, ExportConfig } from '../../types/model';

interface SidebarProps {
  config: ModelConfig;
  onBaseChange: (updates: Partial<BaseConfig>) => void;
  onContentChange: (updates: Partial<ContentConfig>) => void;
  onMagnetChange: (updates: Partial<MagnetHoleConfig>) => void;
  onExportChange: (updates: Partial<ExportConfig>) => void;
  onExport: () => void;
}

export function Sidebar({
  config,
  onBaseChange,
  onContentChange,
  onMagnetChange,
  onExportChange,
  onExport,
}: SidebarProps) {
  return (
    <aside className="w-[380px] min-w-[380px] h-full bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-700">
        <h1 className="text-lg font-bold text-white tracking-tight">QR-TXT-2-STL</h1>
        <p className="text-xs text-gray-400 mt-0.5">Generate 3D-printable STL files</p>
      </div>

      {/* Scrollable settings */}
      <div className="flex-1 overflow-y-auto">
        <SectionHeader title="Input" defaultOpen>
          <InputSettings content={config.content} onChange={onContentChange} />
        </SectionHeader>

        <SectionHeader title="Base Plate" defaultOpen>
          <BaseSettings base={config.base} onChange={onBaseChange} />
        </SectionHeader>

        <SectionHeader title="Model" defaultOpen>
          <ModelSettings
            content={config.content}
            magnets={config.magnets}
            onContentChange={onContentChange}
            onMagnetChange={onMagnetChange}
          />
        </SectionHeader>

        <SectionHeader title="Export" defaultOpen>
          <ExportSettings
            exportConfig={config.export}
            onChange={onExportChange}
            onExport={onExport}
          />
        </SectionHeader>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
        All dimensions in millimeters
      </div>
    </aside>
  );
}
