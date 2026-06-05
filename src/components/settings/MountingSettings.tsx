import type {
  BaseConfig,
  MagnetHoleConfig,
  MagnetSize,
  MagnetPosition,
  MountingConfig,
} from '../../types/model';
import { Select } from '../shared/Select';
import { NumberInput } from '../shared/NumberInput';

interface MountingSettingsProps {
  base: BaseConfig;
  magnets: MagnetHoleConfig;
  mounting: MountingConfig;
  onBaseChange: (updates: Partial<BaseConfig>) => void;
  onMagnetChange: (updates: Partial<MagnetHoleConfig>) => void;
  onMountingChange: (updates: Partial<MountingConfig>) => void;
}

const MAGNET_SIZE_OPTIONS = [
  { value: '6x3', label: '6 × 3 mm' },
  { value: '8x3', label: '8 × 3 mm' },
  { value: '10x3', label: '10 × 3 mm' },
  { value: 'custom', label: 'Custom' },
];

const MAGNET_POSITION_OPTIONS = [
  { value: 'corners', label: 'Corners' },
  { value: 'edges', label: 'Edges' },
  { value: 'center', label: 'Center' },
];

const MAGNET_POSITION_OPTIONS_CIRCLE = [
  { value: 'corners', label: 'Around Edge' },
  { value: 'center', label: 'Center' },
];

const MAGNET_DIMENSIONS: Record<string, { diameter: number; depth: number }> = {
  '6x3': { diameter: 6, depth: 3 },
  '8x3': { diameter: 8, depth: 3 },
  '10x3': { diameter: 10, depth: 3 },
};

// --- Option card component ---

interface OptionCardProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}

function OptionCard({ icon, label, description, active, onClick }: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-2.5 w-full p-3 rounded-xl border text-left transition-all ${
        active
          ? 'bg-blue-600/15 border-blue-500/60 text-blue-300'
          : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:bg-gray-700/60 hover:border-gray-600 hover:text-gray-300'
      }`}
    >
      <span className={`mt-0.5 shrink-0 ${active ? 'text-blue-400' : 'text-gray-500'}`}>{icon}</span>
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className={`text-xs font-semibold leading-tight ${active ? 'text-blue-200' : 'text-gray-300'}`}>{label}</span>
        <span className="text-[10px] leading-tight text-gray-500 truncate">{description}</span>
      </span>
      <span className={`ml-auto shrink-0 mt-0.5 w-3.5 h-3.5 rounded-full border-2 transition-colors ${
        active ? 'border-blue-400 bg-blue-500' : 'border-gray-600'
      }`} />
    </button>
  );
}

// --- Expanded config panel ---

function ConfigPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pl-2 pr-0 pt-1 pb-2 space-y-2 border-l-2 border-blue-600/30 ml-1">
      {children}
    </div>
  );
}

// --- Icons ---

const KeychainIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const MagnetIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v11a3 3 0 006 0V3M5 9h14" />
  </svg>
);

const ScrewIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" strokeWidth={2} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const WallMountIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10m4 0v4a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h12a2 2 0 012 2v4z" />
  </svg>
);

const FridgeMagnetIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth={2} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6v12M15 6v12" />
  </svg>
);

// --- Main component ---

export function MountingSettings({
  base,
  magnets,
  mounting,
  onBaseChange,
  onMagnetChange,
  onMountingChange,
}: MountingSettingsProps) {
  const isCircular = base.shape === 'circle' || base.shape === 'hexagon' || base.shape === 'pentagon';

  const handleMagnetToggle = () => {
    const next = !magnets.enabled;
    onMagnetChange({ enabled: next });
    if (next) {
      const depth = MAGNET_DIMENSIONS[magnets.size]?.depth ?? magnets.customDepth;
      const minT = depth + 1.2;
      if (base.thickness < minT) onBaseChange({ thickness: Math.round(minT * 10) / 10 });
    }
  };

  const handleMagnetSize = (size: MagnetSize) => {
    const dims = MAGNET_DIMENSIONS[size];
    if (dims) {
      onMagnetChange({ size, customDiameter: dims.diameter, customDepth: dims.depth });
      const minT = dims.depth + 1.2;
      if (base.thickness < minT) onBaseChange({ thickness: Math.round(minT * 10) / 10 });
    } else {
      onMagnetChange({ size });
    }
  };

  return (
    <div className="space-y-2">
      {/* Keychain Hole */}
      <OptionCard
        icon={<KeychainIcon />}
        label="Keychain Hole"
        description="Adds a tab + hole for a keyring"
        active={base.keychainHole}
        onClick={() => onBaseChange({ keychainHole: !base.keychainHole })}
      />
      {base.keychainHole && (
        <ConfigPanel>
          <NumberInput
            label="Hole Diameter"
            value={base.keychainHoleDiameter}
            min={2}
            max={10}
            step={0.5}
            onChange={v => onBaseChange({ keychainHoleDiameter: v })}
          />
        </ConfigPanel>
      )}

      {/* Magnet Holes */}
      <OptionCard
        icon={<MagnetIcon />}
        label="Magnet Holes"
        description="Recessed pockets on back face"
        active={magnets.enabled}
        onClick={handleMagnetToggle}
      />
      {magnets.enabled && (
        <ConfigPanel>
          <Select
            label="Magnet Size"
            value={magnets.size}
            options={MAGNET_SIZE_OPTIONS}
            onChange={v => handleMagnetSize(v as MagnetSize)}
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
                onChange={v => {
                  onMagnetChange({ customDepth: v });
                  const minT = v + 1.2;
                  if (base.thickness < minT) onBaseChange({ thickness: Math.round(minT * 10) / 10 });
                }}
              />
            </>
          )}
          <Select
            label="Position"
            value={magnets.position}
            options={isCircular ? MAGNET_POSITION_OPTIONS_CIRCLE : MAGNET_POSITION_OPTIONS}
            onChange={v => onMagnetChange({ position: v as MagnetPosition })}
          />
          {magnets.position !== 'center' && (
            <NumberInput
              label="Count"
              value={magnets.count}
              min={1}
              max={8}
              unit=""
              onChange={v => onMagnetChange({ count: v })}
            />
          )}
        </ConfigPanel>
      )}

      {/* Screw Holes */}
      <OptionCard
        icon={<ScrewIcon />}
        label="Screw Holes"
        description="Corner holes for wall mounting with screws"
        active={mounting.screwHoles}
        onClick={() => onMountingChange({ screwHoles: !mounting.screwHoles })}
      />
      {mounting.screwHoles && (
        <ConfigPanel>
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
            max={isCircular ? 8 : 4}
            unit=""
            onChange={v => onMountingChange({ screwCount: v })}
          />
        </ConfigPanel>
      )}

      {/* Wall Mount Keyhole */}
      <OptionCard
        icon={<WallMountIcon />}
        label="Wall Mount Keyhole"
        description="Keyhole slot on back for nail/screw"
        active={mounting.wallMount}
        onClick={() => onMountingChange({ wallMount: !mounting.wallMount })}
      />
      {mounting.wallMount && (
        <ConfigPanel>
          <NumberInput
            label="Keyhole Width"
            value={mounting.wallMountKeyholeWidth}
            min={4}
            max={12}
            step={0.5}
            onChange={v => onMountingChange({ wallMountKeyholeWidth: v })}
          />
        </ConfigPanel>
      )}

      {/* Fridge Magnet Recess */}
      <OptionCard
        icon={<FridgeMagnetIcon />}
        label="Fridge Magnet Recess"
        description="Back recess for adhesive strip magnet"
        active={mounting.fridgeMagnet}
        onClick={() => onMountingChange({ fridgeMagnet: !mounting.fridgeMagnet })}
      />
      {mounting.fridgeMagnet && (
        <ConfigPanel>
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
        </ConfigPanel>
      )}
    </div>
  );
}
