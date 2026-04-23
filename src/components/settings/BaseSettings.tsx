import type { BaseConfig, BaseShape, EdgeTreatment } from '../../types/model';
import { Select } from '../shared/Select';
import { Slider } from '../shared/Slider';
import { Toggle } from '../shared/Toggle';

interface BaseSettingsProps {
  base: BaseConfig;
  onChange: (updates: Partial<BaseConfig>) => void;
}

const SHAPE_OPTIONS = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'rounded-rectangle', label: 'Rounded Rectangle' },
  { value: 'circle', label: 'Circle' },
];

const EDGE_OPTIONS = [
  { value: 'none', label: 'None (sharp)' },
  { value: 'fillet', label: 'Fillet (rounded)' },
  { value: 'chamfer', label: 'Chamfer (angled)' },
];

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

export function BaseSettings({ base, onChange }: BaseSettingsProps) {
  return (
    <div className="space-y-3">
      <Select
        label="Shape"
        value={base.shape}
        options={SHAPE_OPTIONS}
        onChange={v => onChange({ shape: v as BaseShape })}
      />

      <Slider
        label={base.shape === 'circle' ? 'Diameter' : 'Width'}
        value={base.width}
        min={20}
        max={150}
        step={1}
        onChange={v => onChange(base.shape === 'circle' ? { width: v, height: v } : { width: v })}
      />

      {base.shape !== 'circle' && (
        <Slider
          label="Height"
          value={base.height}
          min={20}
          max={150}
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
