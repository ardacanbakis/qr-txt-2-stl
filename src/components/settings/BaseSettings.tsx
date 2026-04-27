import type { BaseConfig, BaseShape, EdgeTreatment } from '../../types/model';
import { Select } from '../shared/Select';
import { Slider } from '../shared/Slider';
import { Toggle } from '../shared/Toggle';

interface BaseSettingsProps {
  base: BaseConfig;
  onChange: (updates: Partial<BaseConfig>) => void;
  buildPlateWidth?: number;
  buildPlateHeight?: number;
  showPlatePresets?: boolean;
}

const SHAPE_OPTIONS = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'rounded-rectangle', label: 'Rounded Rectangle' },
  { value: 'circle', label: 'Circle' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'hexagon', label: 'Hexagon' },
];

const EDGE_OPTIONS = [
  { value: 'none', label: 'None (sharp)' },
  { value: 'fillet', label: 'Fillet (rounded)' },
  { value: 'chamfer', label: 'Chamfer (angled)' },
];

const PLATE_PERCENTS = [25, 50, 75, 90] as const;

export function BorderSettings({ base, onChange }: BaseSettingsProps) {
  return (
    <div className="space-y-3">
      <Toggle
        label="Border Frame"
        checked={base.borderEnabled}
        onChange={v => onChange({ borderEnabled: v })}
      />
      {base.borderEnabled && (
        <>
          <Slider
            label="Frame Width"
            value={base.borderWidth}
            min={1}
            max={10}
            step={0.5}
            onChange={v => onChange({ borderWidth: v })}
          />
          <Slider
            label="Frame Height"
            value={base.borderHeight}
            min={0.5}
            max={5}
            step={0.1}
            onChange={v => onChange({ borderHeight: v })}
          />
        </>
      )}
    </div>
  );
}

export function BaseSettings({ base, onChange, buildPlateWidth, buildPlateHeight, showPlatePresets }: BaseSettingsProps) {
  return (
    <div className="space-y-3">
      <Select
        label="Shape"
        value={base.shape}
        options={SHAPE_OPTIONS}
        onChange={v => onChange({ shape: v as BaseShape })}
      />

      {showPlatePresets && buildPlateWidth && buildPlateHeight && (
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Build Plate %</label>
          <div className="flex gap-1.5">
            {PLATE_PERCENTS.map(pct => {
              const w = Math.round(buildPlateWidth * pct / 100);
              const h = Math.round(buildPlateHeight * pct / 100);
              const isActive = base.width === w && base.height === h;
              return (
                <button
                  key={pct}
                  onClick={() => onChange((base.shape === 'circle' || base.shape === 'hexagon') ? { width: Math.min(w, h), height: Math.min(w, h) } : { width: w, height: h })}
                  className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${
                    isActive
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white'
                  }`}
                >
                  {pct}%
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-500">
            of build plate ({buildPlateWidth}×{buildPlateHeight}mm)
          </p>
        </div>
      )}

      <Slider
        label={base.shape === 'circle' ? 'Diameter' : base.shape === 'hexagon' ? 'Size' : 'Width'}
        value={base.width}
        min={20}
        max={350}
        step={1}
        onChange={v => onChange((base.shape === 'circle' || base.shape === 'hexagon') ? { width: v, height: v } : { width: v })}
      />

      {base.shape !== 'circle' && base.shape !== 'hexagon' && (
        <Slider
          label="Height"
          value={base.height}
          min={20}
          max={350}
          step={1}
          onChange={v => onChange({ height: v })}
        />
      )}

      <Slider
        label="Thickness"
        value={base.thickness}
        min={1}
        max={10}
        step={0.5}
        onChange={v => onChange({ thickness: v })}
      />

      {(base.shape === 'rounded-rectangle') && (
        <Slider
          label="Corner Radius"
          value={base.cornerRadius}
          min={0}
          max={15}
          step={0.5}
          onChange={v => onChange({ cornerRadius: v })}
        />
      )}

      <Slider
        label="Content Padding"
        value={base.borderWidth}
        min={1}
        max={10}
        step={0.5}
        onChange={v => onChange({ borderWidth: v })}
      />

      <Select
        label="Edge Treatment"
        value={base.edgeTreatment}
        options={EDGE_OPTIONS}
        onChange={v => onChange({ edgeTreatment: v as EdgeTreatment })}
      />

      {base.edgeTreatment !== 'none' && (
        <Slider
          label={base.edgeTreatment === 'fillet' ? 'Fillet Radius' : 'Chamfer Size'}
          value={base.filletRadius}
          min={0.2}
          max={3}
          step={0.1}
          onChange={v => onChange({ filletRadius: v })}
        />
      )}

    </div>
  );
}
