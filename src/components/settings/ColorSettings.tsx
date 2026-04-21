import type { ColorConfig, GeneratorType } from '../../types/model';

interface ColorSettingsProps {
  colors: ColorConfig;
  generator: GeneratorType;
  onChange: (u: Partial<ColorConfig>) => void;
}

interface ColorRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function ColorRow({ label, value, onChange }: ColorRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-600"
          aria-label={`${label} color`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value.trim();
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          className="w-20 bg-gray-700 text-gray-200 text-xs font-mono rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>
    </div>
  );
}

/**
 * Which color slots are used by each generator. Hides rows that don't apply
 * to the current template so the panel stays focused.
 */
const COLOR_SLOTS: Record<GeneratorType, Array<keyof ColorConfig>> = {
  qr:         ['base', 'border', 'content'],
  text:       ['base', 'border', 'text'],
  spotify:    ['base', 'border', 'content', 'logo'],
  wifi:       ['base', 'border', 'content', 'text'],
  vcard:      ['base', 'border', 'content', 'text'],
  image:      ['base', 'border', 'content'],
  lithophane: ['base'],
  barcode:    ['base', 'border', 'content', 'text'],
  nameplate:  ['base', 'border', 'text', 'secondary'],
};

const LABELS: Record<keyof ColorConfig, string> = {
  base: 'Base Plate',
  border: 'Border',
  content: 'Content',
  text: 'Text',
  secondary: 'Secondary Text',
  logo: 'Logo',
};

export function ColorSettings({ colors, generator, onChange }: ColorSettingsProps) {
  const slots = COLOR_SLOTS[generator];

  return (
    <div className="space-y-2">
      {slots.map((slot) => (
        <ColorRow
          key={slot}
          label={LABELS[slot]}
          value={colors[slot]}
          onChange={(v) => onChange({ [slot]: v } as Partial<ColorConfig>)}
        />
      ))}
      <p className="text-xs text-gray-500 italic pt-1">
        Colors apply to the 3D preview only. When exporting separate parts,
        each colored piece becomes its own STL file.
      </p>
    </div>
  );
}
