import type { ContentConfig, ContentMode, MagnetHoleConfig, MagnetSize, MagnetPosition } from '../../types/model';
import { Select } from '../shared/Select';
import { Slider } from '../shared/Slider';
import { Toggle } from '../shared/Toggle';
import { NumberInput } from '../shared/NumberInput';

interface ModelSettingsProps {
  content: ContentConfig;
  magnets: MagnetHoleConfig;
  onContentChange: (updates: Partial<ContentConfig>) => void;
  onMagnetChange: (updates: Partial<MagnetHoleConfig>) => void;
}

const MODE_OPTIONS = [
  { value: 'embossed', label: 'Embossed (raised)' },
  { value: 'engraved', label: 'Engraved (recessed)' },
];

const MAGNET_SIZE_OPTIONS = [
  { value: '6x3', label: '6mm x 3mm' },
  { value: '8x3', label: '8mm x 3mm' },
  { value: '10x3', label: '10mm x 3mm' },
  { value: 'custom', label: 'Custom' },
];

const MAGNET_POSITION_OPTIONS = [
  { value: 'corners', label: 'Corners' },
  { value: 'edges', label: 'Edges' },
  { value: 'center', label: 'Center' },
];

const MAGNET_DIMENSIONS: Record<string, { diameter: number; depth: number }> = {
  '6x3': { diameter: 6, depth: 3 },
  '8x3': { diameter: 8, depth: 3 },
  '10x3': { diameter: 10, depth: 3 },
};

export function ModelSettings({ content, magnets, onContentChange, onMagnetChange }: ModelSettingsProps) {
  return (
    <div className="space-y-3">
      <Select
        label="Content Mode"
        value={content.mode}
        options={MODE_OPTIONS}
        onChange={v => onContentChange({ mode: v as ContentMode })}
      />

      <Slider
        label="Content Height"
        value={content.contentHeight}
        min={0.5}
        max={5}
        step={0.1}
        onChange={v => onContentChange({ contentHeight: v })}
      />

      <div className="border-t border-gray-700 pt-3 mt-3">
        <Toggle
          label="Magnet Holes"
          checked={magnets.enabled}
          onChange={v => onMagnetChange({ enabled: v })}
        />
      </div>

      {magnets.enabled && (
        <div className="space-y-3 pl-1">
          <Select
            label="Magnet Size"
            value={magnets.size}
            options={MAGNET_SIZE_OPTIONS}
            onChange={v => {
              const size = v as MagnetSize;
              const dims = MAGNET_DIMENSIONS[size];
              if (dims) {
                onMagnetChange({ size, customDiameter: dims.diameter, customDepth: dims.depth });
              } else {
                onMagnetChange({ size });
              }
            }}
          />

          {magnets.size === 'custom' && (
            <>
              <NumberInput
                label="Diameter"
                value={magnets.customDiameter}
                min={3}
                max={20}
                step={0.5}
                onChange={v => onMagnetChange({ customDiameter: v })}
              />
              <NumberInput
                label="Depth"
                value={magnets.customDepth}
                min={1}
                max={10}
                step={0.5}
                onChange={v => onMagnetChange({ customDepth: v })}
              />
            </>
          )}

          <Select
            label="Position"
            value={magnets.position}
            options={MAGNET_POSITION_OPTIONS}
            onChange={v => onMagnetChange({ position: v as MagnetPosition })}
          />

          {magnets.position !== 'center' && (
            <NumberInput
              label="Count"
              value={magnets.count}
              min={1}
              max={8}
              onChange={v => onMagnetChange({ count: v })}
            />
          )}
        </div>
      )}
    </div>
  );
}
