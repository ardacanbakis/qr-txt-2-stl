import type {
  ContentConfig,
  TextConfig,
  SpotifyConfig,
  WifiCardConfig,
  VCardConfig,
  ImageConfig,
  LithophaneConfig,
  BarcodeConfig,
  NameplateConfig,
  FontStyle,
  BarcodeFormat,
  WifiEncryption,
  ErrorCorrectionLevel,
} from '../../types/model';
import { Select } from '../shared/Select';
import { Slider } from '../shared/Slider';
import { Toggle } from '../shared/Toggle';

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

// ---- Image settings ----

export function ImageSettings({
  config,
  onChange,
}: {
  config: ImageConfig;
  onChange: (u: Partial<ImageConfig>) => void;
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
        <Label>Image File</Label>
        <label className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 border border-gray-600 cursor-pointer text-center">
          {config.fileName || 'Choose image (PNG, JPG, SVG)...'}
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
        label="Threshold"
        value={config.threshold}
        min={0}
        max={255}
        step={1}
        unit=""
        onChange={(v) => onChange({ threshold: v })}
      />
      <Slider
        label="Resolution"
        value={config.resolution}
        min={20}
        max={200}
        step={5}
        unit="px"
        onChange={(v) => onChange({ resolution: v })}
      />
      <Toggle label="Invert" checked={config.invert} onChange={(v) => onChange({ invert: v })} />
      <p className="text-xs text-gray-500 italic">
        Dark pixels become extruded shapes on the plate. Increase resolution for finer detail.
      </p>
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
        max={200}
        step={5}
        unit="px"
        onChange={(v) => onChange({ resolution: v })}
      />
      <Toggle label="Invert Brightness" checked={config.invert} onChange={(v) => onChange({ invert: v })} />
      <p className="text-xs text-gray-500 italic">
        Best with high-contrast black & white photos. Print in white filament and backlight to see the image.
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
