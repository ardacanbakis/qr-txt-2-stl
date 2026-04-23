import type {
  ContentConfig,
  TextConfig,
  SpotifyConfig,
  WifiCardConfig,
  VCardConfig,
  LithophaneConfig,
  BarcodeConfig,
  NameplateConfig,
  MapConfig,
  MapMode,
  FontStyle,
  BarcodeFormat,
  WifiEncryption,
  ErrorCorrectionLevel,
} from '../../types/model';
import { Select } from '../shared/Select';
import { Slider } from '../shared/Slider';
import { Toggle } from '../shared/Toggle';
import { MapPicker } from './MapPicker';

const FONT_STYLE_OPTIONS = [
  { value: 'regular', label: 'Regular' },
  { value: 'bold', label: 'Bold' },
  { value: 'italic', label: 'Italic' },
  { value: 'bold-italic', label: 'Bold Italic' },
];

const ERROR_CORRECTION_OPTIONS = [
  { value: 'L', label: 'L - Low (7%)' },
  { value: 'M', label: 'M - Medium (15%)' },
  { value: 'Q', label: 'Q - Quartile (25%)' },
  { value: 'H', label: 'H - High (30%)' },
];

const WIFI_ENCRYPTION_OPTIONS = [
  { value: 'WPA', label: 'WPA / WPA2' },
  { value: 'WEP', label: 'WEP' },
  { value: 'nopass', label: 'None (open)' },
];

const BARCODE_FORMAT_OPTIONS = [
  { value: 'CODE39', label: 'CODE 39' },
  { value: 'CODE128', label: 'CODE 128 (encoded as CODE 39)' },
  { value: 'EAN13', label: 'EAN-13 (encoded as CODE 39)' },
];

function Label({ children }: { children: string }) {
  return <label className="text-sm text-gray-300">{children}</label>;
}

function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder = '',
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="bg-gray-700 text-gray-200 text-sm rounded-md px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
    />
  );
}

function TextInput({
  value,
  onChange,
  placeholder = '',
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-gray-700 text-gray-200 text-sm rounded-md px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
    />
  );
}

// ---- QR settings ----

export function QRSettings({
  content,
  onChange,
}: {
  content: ContentConfig;
  onChange: (u: Partial<ContentConfig>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <Label>Content</Label>
        <TextArea value={content.text} onChange={(v) => onChange({ text: v })} placeholder="Text, URL, or any string..." />
      </div>
      <Select
        label="Error Correction"
        value={content.errorCorrection}
        options={ERROR_CORRECTION_OPTIONS}
        onChange={(v) => onChange({ errorCorrection: v as ErrorCorrectionLevel })}
      />
      <Toggle
        label="Add Text Label Below"
        checked={content.showQrLabel}
        onChange={(v) => onChange({ showQrLabel: v })}
      />
      {content.showQrLabel && (
        <div className="flex flex-col gap-1">
          <Label>Label Text</Label>
          <TextInput
            value={content.qrLabel}
            onChange={(v) => onChange({ qrLabel: v })}
            placeholder="Label..."
          />
        </div>
      )}
    </div>
  );
}

// ---- Text settings ----

export function TextSettings({
  config,
  onChange,
}: {
  config: TextConfig;
  onChange: (u: Partial<TextConfig>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <Label>Text</Label>
        <TextArea value={config.text} onChange={(v) => onChange({ text: v })} placeholder="Your text..." />
      </div>
      <Select
        label="Font Style"
        value={config.fontStyle}
        options={FONT_STYLE_OPTIONS}
        onChange={(v) => onChange({ fontStyle: v as FontStyle })}
      />
      <Slider
        label="Font Size"
        value={config.size}
        min={3}
        max={30}
        step={0.5}
        onChange={(v) => onChange({ size: v })}
      />
      <Slider
        label="Letter Spacing"
        value={config.letterSpacing}
        min={-1}
        max={5}
        step={0.1}
        onChange={(v) => onChange({ letterSpacing: v })}
      />
    </div>
  );
}

// ---- Spotify settings ----

export function SpotifySettings({
  config,
  onChange,
}: {
  config: SpotifyConfig;
  onChange: (u: Partial<SpotifyConfig>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <Label>Spotify URL or URI</Label>
        <TextInput
          value={config.url}
          onChange={(v) => onChange({ url: v })}
          placeholder="https://open.spotify.com/track/... or spotify:track:..."
        />
      </div>
      <Toggle
        label="Include Spotify Logo"
        checked={config.showLogo}
        onChange={(v) => onChange({ showLogo: v })}
      />
      <p className="text-xs text-gray-500 italic">
        Fetches the real scannable code from Spotify. Works with tracks, albums,
        artists, playlists, and episodes. Disable the logo to print bars only.
      </p>
    </div>
  );
}

// ---- WiFi settings ----

export function WifiSettings({
  config,
  onChange,
}: {
  config: WifiCardConfig;
  onChange: (u: Partial<WifiCardConfig>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <Label>Network (SSID)</Label>
        <TextInput value={config.ssid} onChange={(v) => onChange({ ssid: v })} placeholder="MyNetwork" />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Password</Label>
        <TextInput value={config.password} onChange={(v) => onChange({ password: v })} placeholder="Password" />
      </div>
      <Select
        label="Encryption"
        value={config.encryption}
        options={WIFI_ENCRYPTION_OPTIONS}
        onChange={(v) => onChange({ encryption: v as WifiEncryption })}
      />
      <Toggle label="Hidden Network" checked={config.hidden} onChange={(v) => onChange({ hidden: v })} />
      <Toggle label="Show SSID as Label" checked={config.showText} onChange={(v) => onChange({ showText: v })} />
    </div>
  );
}

// ---- vCard settings ----

export function VCardSettings({
  config,
  onChange,
}: {
  config: VCardConfig;
  onChange: (u: Partial<VCardConfig>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label>First Name</Label>
          <TextInput value={config.firstName} onChange={(v) => onChange({ firstName: v })} placeholder="Jane" />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Last Name</Label>
          <TextInput value={config.lastName} onChange={(v) => onChange({ lastName: v })} placeholder="Doe" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label>Phone</Label>
        <TextInput value={config.phone} onChange={(v) => onChange({ phone: v })} placeholder="+1 555 123 4567" />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Email</Label>
        <TextInput value={config.email} onChange={(v) => onChange({ email: v })} placeholder="jane@example.com" />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Organization</Label>
        <TextInput value={config.organization} onChange={(v) => onChange({ organization: v })} placeholder="Company" />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Website</Label>
        <TextInput value={config.url} onChange={(v) => onChange({ url: v })} placeholder="https://..." />
      </div>
      <Toggle label="Show Name as Label" checked={config.showText} onChange={(v) => onChange({ showText: v })} />
    </div>
  );
}

// ---- Lithophane settings ----

export function LithophaneSettings({
  config,
  onChange,
}: {
  config: LithophaneConfig;
  onChange: (u: Partial<LithophaneConfig>) => void;
}) {
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ dataUrl: reader.result as string, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <Label>Photo File</Label>
        <label className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 border border-gray-600 cursor-pointer text-center">
          {config.fileName || 'Choose photo (PNG, JPG)...'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
      </div>
      <Slider
        label="Min Thickness"
        value={config.minThickness}
        min={0.2}
        max={2}
        step={0.1}
        onChange={(v) => onChange({ minThickness: v })}
      />
      <Slider
        label="Max Thickness"
        value={config.maxThickness}
        min={1}
        max={6}
        step={0.1}
        onChange={(v) => onChange({ maxThickness: v })}
      />
      <Slider
        label="Resolution"
        value={config.resolution}
        min={40}
        max={400}
        step={10}
        unit="px"
        onChange={(v) => onChange({ resolution: v })}
      />
      <Toggle label="Invert Brightness" checked={config.invert} onChange={(v) => onChange({ invert: v })} />
      <p className="text-xs text-gray-500 italic">
        Best with high-contrast black & white photos. Print in white filament and backlight to see the image.
        Higher resolution produces more detail but increases generation time.
      </p>
    </div>
  );
}

// ---- Barcode settings ----

export function BarcodeSettings({
  config,
  onChange,
}: {
  config: BarcodeConfig;
  onChange: (u: Partial<BarcodeConfig>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <Label>Barcode Data</Label>
        <TextInput value={config.text} onChange={(v) => onChange({ text: v })} placeholder="HELLO123" />
      </div>
      <Select
        label="Format"
        value={config.format}
        options={BARCODE_FORMAT_OPTIONS}
        onChange={(v) => onChange({ format: v as BarcodeFormat })}
      />
      <Toggle label="Show Text Below" checked={config.showText} onChange={(v) => onChange({ showText: v })} />
      <p className="text-xs text-gray-500 italic">
        CODE 39 supports 0-9, A-Z, and symbols (- . $ / + % space). Other characters are dropped.
      </p>
    </div>
  );
}

// ---- Nameplate settings ----

export function NameplateSettings({
  config,
  onChange,
}: {
  config: NameplateConfig;
  onChange: (u: Partial<NameplateConfig>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <Label>Primary Text</Label>
        <TextInput value={config.primaryText} onChange={(v) => onChange({ primaryText: v })} placeholder="Jane Doe" />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Secondary Text</Label>
        <TextInput value={config.secondaryText} onChange={(v) => onChange({ secondaryText: v })} placeholder="Title / subtitle" />
      </div>
      <Select
        label="Font Style"
        value={config.fontStyle}
        options={FONT_STYLE_OPTIONS}
        onChange={(v) => onChange({ fontStyle: v as FontStyle })}
      />
      <Slider
        label="Primary Size"
        value={config.primarySize}
        min={3}
        max={20}
        step={0.5}
        onChange={(v) => onChange({ primarySize: v })}
      />
      <Slider
        label="Secondary Size"
        value={config.secondarySize}
        min={2}
        max={12}
        step={0.5}
        onChange={(v) => onChange({ secondarySize: v })}
      />
    </div>
  );
}

// ---- Map settings ----

const MAP_MODE_OPTIONS = [
  { value: 'streets', label: 'Streets & Buildings' },
  { value: 'streets-only', label: 'Streets Only' },
  { value: 'terrain', label: 'Terrain Relief' },
  { value: 'combined', label: 'Combined' },
];

const SKYLINE_PRESETS: { value: string; label: string; lat: number; lng: number; radius: number }[] = [
  { value: 'custom', label: 'Custom Location', lat: 0, lng: 0, radius: 500 },
  { value: 'istanbul', label: 'Istanbul', lat: 41.0082, lng: 28.9784, radius: 800 },
  { value: 'new-york', label: 'New York (Manhattan)', lat: 40.7580, lng: -73.9855, radius: 600 },
  { value: 'paris', label: 'Paris', lat: 48.8566, lng: 2.3522, radius: 700 },
  { value: 'london', label: 'London', lat: 51.5074, lng: -0.1278, radius: 700 },
  { value: 'tokyo', label: 'Tokyo', lat: 35.6762, lng: 139.6503, radius: 600 },
  { value: 'dubai', label: 'Dubai', lat: 25.1972, lng: 55.2744, radius: 500 },
  { value: 'rome', label: 'Rome', lat: 41.9028, lng: 12.4964, radius: 600 },
  { value: 'barcelona', label: 'Barcelona', lat: 41.3851, lng: 2.1734, radius: 600 },
  { value: 'san-francisco', label: 'San Francisco', lat: 37.7749, lng: -122.4194, radius: 600 },
  { value: 'singapore', label: 'Singapore', lat: 1.2838, lng: 103.8591, radius: 500 },
];

export function MapSettings({
  config,
  onChange,
  loading,
}: {
  config: MapConfig;
  onChange: (u: Partial<MapConfig>) => void;
  loading?: boolean;
}) {
  const handlePreset = (v: string) => {
    const preset = SKYLINE_PRESETS.find(p => p.value === v);
    if (preset && preset.value !== 'custom') {
      onChange({
        skylinePreset: v,
        lat: preset.lat,
        lng: preset.lng,
        radius: preset.radius,
      });
    } else {
      onChange({ skylinePreset: v });
    }
  };

  return (
    <div className="space-y-3">
      <Select
        label="City Preset"
        value={config.skylinePreset}
        options={SKYLINE_PRESETS.map(p => ({ value: p.value, label: p.label }))}
        onChange={handlePreset}
      />
      <Select
        label="Mode"
        value={config.mode}
        options={MAP_MODE_OPTIONS}
        onChange={(v) => onChange({ mode: v as MapMode })}
      />
      <MapPicker
        lat={config.lat}
        lng={config.lng}
        radius={config.radius}
        onChange={onChange}
      />
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label>Latitude</Label>
          <TextInput
            value={String(config.lat)}
            onChange={(v) => { const n = parseFloat(v); if (!isNaN(n)) onChange({ lat: n, skylinePreset: 'custom' }); }}
            placeholder="41.0082"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Longitude</Label>
          <TextInput
            value={String(config.lng)}
            onChange={(v) => { const n = parseFloat(v); if (!isNaN(n)) onChange({ lng: n, skylinePreset: 'custom' }); }}
            placeholder="28.9784"
          />
        </div>
      </div>
      <Slider
        label="Radius"
        value={config.radius}
        min={100}
        max={2000}
        step={50}
        unit="m"
        onChange={(v) => onChange({ radius: v })}
      />
      {(config.mode === 'streets' || config.mode === 'streets-only' || config.mode === 'combined') && (
        <>
          {config.mode !== 'streets-only' && (
            <Slider
              label="Building Height"
              value={config.buildingHeight}
              min={0.5}
              max={8}
              step={0.5}
              onChange={(v) => onChange({ buildingHeight: v })}
            />
          )}
          <Slider
            label="Street Width"
            value={config.streetWidth}
            min={0.5}
            max={4}
            step={0.25}
            onChange={(v) => onChange({ streetWidth: v })}
          />
        </>
      )}
      {(config.mode === 'terrain' || config.mode === 'combined') && (
        <Slider
          label="Terrain Exaggeration"
          value={config.terrainExaggeration}
          min={0.5}
          max={5}
          step={0.5}
          onChange={(v) => onChange({ terrainExaggeration: v })}
        />
      )}
      {loading && (
        <div className="flex items-center gap-2 text-xs text-blue-400">
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Fetching map data...
        </div>
      )}
      <p className="text-xs text-gray-500 italic">
        Uses OpenStreetMap data. Select a city preset or enter coordinates manually.
      </p>
    </div>
  );
}
