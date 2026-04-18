import type {
  ContentConfig,
  ContentMode,
  MagnetHoleConfig,
  MagnetSize,
  MagnetPosition,
  MountingConfig,
} from '../../types/model';
import { Select } from '../shared/Select';
import { Slider } from '../shared/Slider';
import { Toggle } from '../shared/Toggle';
import { NumberInput } from '../shared/NumberInput';

interface ModelSettingsProps {
  content: ContentConfig;
  magnets: MagnetHoleConfig;
  mounting: MountingConfig;
  onContentChange: (updates: Partial<ContentConfig>) => void;
  onMagnetChange: (updates: Partial<MagnetHoleConfig>) => void;
  onMountingChange: (updates: Partial<MountingConfig>) => void;
}

const MODE_OPTIONS = [
  { value: 'embossed', label: 'Embossed (raised)' },
  { value: 'engraved', label: 'Engraved (recessed)' },
];

const MAGNET_SIZE_OPTIONS = [
  { value: '6x3', label: '6mm × 3mm' },
  { value: '8x3', label: '8mm × 3mm' },
  { value: '10x3', label: '10mm × 3mm' },
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

export function ModelSettings({
  content,
  magnets,
  mounting,
  onContentChange,
  onMagnetChange,
  onMountingChange,
}: ModelSettingsProps) {
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

      {/* Magnet holes */}
      <div className="border-t border-gray-700 pt-3 mt-1">
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

      {/* Mounting options */}
      <div className="border-t border-gray-700 pt-3 mt-1 space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Mounting</p>

        <Toggle
          label="Screw Holes"
          checked={mounting.screwHoles}
          onChange={v => onMountingChange({ screwHoles: v })}
        />
        {mounting.screwHoles && (
          <div className="space-y-2 pl-1">
            <NumberInput
              label="Screw Diameter"
              value={mounting.screwDiameter}
              min={1.5}
              max={6}
              step={0.5}
              onChange={v => onMountingChange({ screwDiameter: v })}
            />
            <NumberInput
              label="Count"
              value={mounting.screwCount}
              min={1}
              max={4}
              onChange={v => onMountingChange({ screwCount: v })}
            />
          </div>
        )}

        <Toggle
          label="Wall Mount Keyhole"
          checked={mounting.wallMount}
          onChange={v => onMountingChange({ wallMount: v })}
        />
        {mounting.wallMount && (
          <div className="pl-1">
            <NumberInput
              label="Keyhole Width"
              value={mounting.wallMountKeyholeWidth}
              min={4}
              max={12}
              step={0.5}
              onChange={v => onMountingChange({ wallMountKeyholeWidth: v })}
            />
          </div>
        )}

        <Toggle
          label="Fridge Magnet Recess"
          checked={mounting.fridgeMagnet}
          onChange={v => onMountingChange({ fridgeMagnet: v })}
        />
        {mounting.fridgeMagnet && (
          <div className="space-y-2 pl-1">
            <NumberInput
              label="Width"
              value={mounting.fridgeMagnetWidth}
              min={5}
              max={50}
              step={1}
              onChange={v => onMountingChange({ fridgeMagnetWidth: v })}
            />
            <NumberInput
              label="Height"
              value={mounting.fridgeMagnetHeight}
              min={2}
              max={20}
              step={0.5}
              onChange={v => onMountingChange({ fridgeMagnetHeight: v })}
            />
            <NumberInput
              label="Depth"
              value={mounting.fridgeMagnetDepth}
              min={0.5}
              max={3}
              step={0.1}
              onChange={v => onMountingChange({ fridgeMagnetDepth: v })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
