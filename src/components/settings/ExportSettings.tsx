import type { ExportConfig, ExportQuality } from '../../types/model';
import { Select } from '../shared/Select';
import { Toggle } from '../shared/Toggle';

interface ExportSettingsProps {
  exportConfig: ExportConfig;
  onChange: (updates: Partial<ExportConfig>) => void;
  onExport: () => void;
  isExporting?: boolean;
}

const QUALITY_OPTIONS = [
  { value: 'low', label: 'Low (faster)' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High (detailed)' },
];

export function ExportSettings({ exportConfig, onChange, onExport, isExporting = false }: ExportSettingsProps) {
  return (
    <div className="space-y-3">
      <Select
        label="Quality"
        value={exportConfig.quality}
        options={QUALITY_OPTIONS}
        onChange={v => onChange({ quality: v as ExportQuality })}
      />

      <Toggle
        label="Separate Parts (multi-color)"
        checked={exportConfig.separateParts}
        onChange={v => onChange({ separateParts: v })}
      />

      {exportConfig.separateParts && (
        <p className="text-xs text-gray-500">
          All parts (base, content, text, etc.) are bundled into a single
          ZIP file. Load each STL in your slicer and assign different filaments.
        </p>
      )}

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
            Generating…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exportConfig.separateParts ? 'Download ZIP (parts)' : 'Download STL'}
          </>
        )}
      </button>
    </div>
  );
}
