import type { BaseConfig, BaseShape, EdgeTreatment } from '../../types/model';
import { Select } from '../shared/Select';
import { Slider } from '../shared/Slider';
import { Toggle } from '../shared/Toggle';
import { NumberInput } from '../shared/NumberInput';

interface BaseSettingsProps {
  base: BaseConfig;
  onChange: (updates: Partial<BaseConfig>) => void;
}

const SHAPE_OPTIONS = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'rounded-rectangle', label: 'Rounded Rectangle' },
  { value: 'circle', label: 'Circle' },
  { value: 'keychain', label: 'Keychain' },
];

const EDGE_OPTIONS = [
  { value: 'none', label: 'None (sharp)' },
  { value: 'fillet', label: 'Fillet (rounded)' },
  { value: 'chamfer', label: 'Chamfer (angled)' },
];

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
        label="Width"
        value={base.width}
        min={20}
        max={150}
        step={1}
        onChange={v => onChange({ width: v })}
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

      {(base.shape === 'rounded-rectangle' || base.shape === 'keychain') && (
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
        label="Border Width"
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

      {base.shape !== 'keychain' && (
        <>
          <Toggle
            label="Keychain Hole"
            checked={base.keychainHole}
            onChange={v => onChange({ keychainHole: v })}
          />
          {base.keychainHole && (
            <NumberInput
              label="Hole Diameter"
              value={base.keychainHoleDiameter}
              min={2}
              max={10}
              step={0.5}
              onChange={v => onChange({ keychainHoleDiameter: v })}
            />
          )}
        </>
      )}
    </div>
  );
}
