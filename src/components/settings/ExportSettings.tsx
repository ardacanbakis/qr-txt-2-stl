import type { ExportConfig, ExportQuality } from '../../types/model';
import { Select } from '../shared/Select';
import { Toggle } from '../shared/Toggle';

interface ExportSettingsProps {
  exportConfig: ExportConfig;
  onChange: (updates: Partial<ExportConfig>) => void;
  onExport: () => void;
}

const QUALITY_OPTIONS = [
  { value: 'low', label: 'Low (faster)' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High (detailed)' },
];

export function ExportSettings({ exportConfig, onChange, onExport }: ExportSettingsProps) {
  return (
    <div className="space-y-3">
      <Select
        label="Quality"
        value={exportConfig.quality}
        options={QUALITY_OPTIONS}
        onChange={v => onChange({ quality: v as ExportQuality })}
      />

      <Toggle
        label="Multi-material (separate STLs)"
        checked={exportConfig.multiMaterial}
        onChange={v => onChange({ multiMaterial: v })}
      />

      {exportConfig.multiMaterial && (
        <p className="text-xs text-gray-500">
          Downloads two STL files: base plate and content layer.
          Load both in your slicer and assign different materials.
        </p>
      )}

      <button
        onClick={onExport}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download STL
      </button>
    </div>
  );
}
