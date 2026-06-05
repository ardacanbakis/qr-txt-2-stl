import type {
  BaseConfig,
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
  TextAlignment,
  BarcodeFormat,
  WifiEncryption,
  ErrorCorrectionLevel,
} from '../../types/model';
import { useState } from 'react';
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

const TEXT_ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
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
  { value: 'EAN13', label: 'EAN-13' },
  { value: 'EAN8', label: 'EAN-8' },
  { value: 'UPCA', label: 'UPC-A' },
  { value: 'CODE128', label: 'CODE 128' },
  { value: 'CODE39', label: 'CODE 39' },
];

const BARCODE_DESCRIPTIONS: Record<string, string> = {
  EAN13: 'Standard retail barcode (13 digits). Used worldwide on grocery items, books (ISBN), and consumer products.',
  EAN8: 'Compact retail barcode (8 digits). Used on small packages where EAN-13 is too large.',
  UPCA: 'North American retail barcode (12 digits). Standard for products sold in the US and Canada.',
  CODE128: 'High-density alphanumeric barcode. Used in shipping labels, logistics, and supply chain management.',
  CODE39: 'Alphanumeric barcode (A-Z, 0-9, symbols). Used in military, automotive, and industrial applications.',
};

function Label({ children }: { children: string }) {
  return <label className="text-sm text-gray-300">{children}</label>;
}

function InputWarning({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-amber-400">
      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </p>
  );
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
  base,
  onBaseChange,
}: {
  content: ContentConfig;
  onChange: (u: Partial<ContentConfig>) => void;
  base?: BaseConfig;
  onBaseChange?: (u: Partial<BaseConfig>) => void;
}) {
  const charCount = content.text.length;
  const isEmpty = content.text.trim() === '';
  const isLong = charCount > 175;

  // Estimate QR module count & printable size
  const qrModuleWarning = (() => {
    if (!base || isEmpty) return null;
    const effectiveWidth = base.borderEnabled
      ? base.width - 2 * base.borderWidth
      : base.width;
    // QR version auto-selects: rough estimate is version ≈ charCount/25, minimum version 1 = 21 modules
    const estimatedModules = Math.max(21, 21 + 4 * Math.ceil(charCount / 25));
    const moduleSize = effectiveWidth / estimatedModules;
    return moduleSize < 0.4
      ? `Estimated QR module ~${moduleSize.toFixed(2)}mm — below 0.4mm printable minimum. Increase plate width or reduce content.`
      : null;
  })();

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <Label>Content</Label>
        <TextArea value={content.text} onChange={(v) => onChange({ text: v })} placeholder="Text, URL, or any string..." />
        {isEmpty ? (
          <InputWarning message="Enter some content to generate a QR code" />
        ) : (
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isLong ? 'text-amber-400' : 'text-gray-500'}`}>
              {charCount} characters
            </span>
            {isLong && (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Long text may not scan reliably
              </span>
            )}
          </div>
        )}
        {qrModuleWarning && <InputWarning message={qrModuleWarning} />}
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
        onChange={(v) => {
          onChange({ showQrLabel: v });
          if (v && base && onBaseChange && base.height <= base.width) {
            onBaseChange({ height: Math.round(base.width * 1.25) });
          } else if (!v && base && onBaseChange && base.height > base.width) {
            onBaseChange({ height: base.width });
          }
        }}
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
  const lineCount = config.text.split('\n').length;
  return (
    <div className="space-y-3">
      <Toggle
        label="Multi-line Text"
        checked={config.multiline}
        onChange={(v) => onChange({ multiline: v })}
      />
      <div className="flex flex-col gap-1">
        <Label>Text</Label>
        {config.multiline ? (
          <>
            <TextArea
              value={config.text}
              onChange={(v) => onChange({ text: v })}
              rows={4}
              placeholder={'Line 1\nLine 2\nLine 3'}
            />
            <span className="text-xs text-gray-500">{lineCount} line{lineCount !== 1 ? 's' : ''} — press Enter for a new line</span>
          </>
        ) : (
          <>
            <TextArea value={config.text} onChange={(v) => onChange({ text: v.replace(/\n/g, ' ') })} placeholder="Your text..." />
          </>
        )}
        {config.text.trim() === '' && <InputWarning message="Enter some text to generate a label" />}
      </div>
      {config.multiline && lineCount > 1 && (
        <Slider
          label="Line Spacing"
          value={config.lineSpacing}
          min={1.0}
          max={2.5}
          step={0.05}
          onChange={(v) => onChange({ lineSpacing: v })}
        />
      )}
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
      <div className="flex flex-col gap-1">
        <Label>Alignment</Label>
        <div className="flex gap-1">
          {TEXT_ALIGNMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ alignment: opt.value as TextAlignment })}
              title={opt.label}
              className={`flex-1 py-1.5 rounded text-xs font-medium border transition-colors ${
                config.alignment === opt.value
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
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
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(`Unsupported file type: ${file.type || file.name}. Please use PNG, JPG, or WEBP.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ dataUrl: reader.result as string, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-4">

      {/* Image upload + preview */}
      <div className="flex flex-col gap-2">
        <Label>Photo</Label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`rounded-md border-2 border-dashed transition-colors ${dragging ? 'border-blue-400 bg-blue-950/30' : 'border-gray-600'}`}
        >
          <label className={`flex flex-col items-center justify-center gap-1 px-3 py-3 cursor-pointer text-sm transition-colors rounded-md ${dragging ? 'text-blue-300' : 'text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600'}`}>
            <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{config.fileName || (dragging ? 'Drop to upload' : 'Click or drag photo here')}</span>
            <span className="text-xs text-gray-500">PNG, JPG, WEBP</span>
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
        {config.dataUrl && (
          <img
            src={config.dataUrl}
            alt="Preview"
            className="w-full rounded-md border border-gray-600 object-cover"
            style={{ maxHeight: 120, objectFit: 'cover' }}
          />
        )}
        {!config.dataUrl && (
          <p className="text-xs text-gray-500 italic">
            Best results with high-contrast portraits or silhouettes. Print in white filament and backlight to reveal the image.
          </p>
        )}
      </div>

      {/* Flip */}
      <div className="flex gap-3">
        <Toggle label="Flip H" checked={config.flipH} onChange={(v) => onChange({ flipH: v })} />
        <Toggle label="Flip V" checked={config.flipV} onChange={(v) => onChange({ flipV: v })} />
      </div>

      {/* Image Adjustments */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Image Adjustments</p>
        <Slider
          label="Brightness"
          value={config.brightness}
          min={-100}
          max={100}
          step={5}
          unit=""
          onChange={(v) => onChange({ brightness: v })}
        />
        <Slider
          label="Contrast"
          value={config.contrast}
          min={-100}
          max={100}
          step={5}
          unit=""
          onChange={(v) => onChange({ contrast: v })}
        />
        <Slider
          label="Gamma"
          value={config.gamma}
          min={0.5}
          max={3.0}
          step={0.1}
          unit=""
          onChange={(v) => onChange({ gamma: v })}
        />
        <Slider
          label="Sharpen"
          value={config.sharpen}
          min={0}
          max={5}
          step={0.5}
          unit=""
          onChange={(v) => onChange({ sharpen: v })}
        />
        <Toggle label="Invert" checked={config.invert} onChange={(v) => onChange({ invert: v })} />
      </div>

      {/* Print settings */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Print Settings</p>
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
        {config.minThickness >= config.maxThickness && (
          <InputWarning message="Min thickness must be less than max thickness" />
        )}
        <Slider
          label="Resolution"
          value={config.resolution}
          min={50}
          max={400}
          step={10}
          unit="px"
          onChange={(v) => onChange({ resolution: v })}
        />
        <p className="text-xs text-gray-500">Higher resolution = more detail, larger file, slower generation.</p>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Preview</p>
        <Toggle
          label="Backlit Simulation"
          checked={config.backlitPreview}
          onChange={(v) => onChange({ backlitPreview: v })}
        />
        <p className="text-xs text-gray-500">Simulates how the print looks when lit from behind.</p>
      </div>

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
  const placeholders: Record<string, string> = {
    EAN13: '4006381333931',
    EAN8: '96385074',
    UPCA: '012345678905',
    CODE128: 'Hello-123',
    CODE39: 'HELLO123',
  };
  return (
    <div className="space-y-3">
      <Select
        label="Format"
        value={config.format}
        options={BARCODE_FORMAT_OPTIONS}
        onChange={(v) => onChange({ format: v as BarcodeFormat })}
      />
      <p className="text-xs text-gray-500 italic">
        {BARCODE_DESCRIPTIONS[config.format]}
      </p>
      <div className="flex flex-col gap-1">
        <Label>Barcode Data</Label>
        <TextInput
          value={config.text}
          onChange={(v) => onChange({ text: v })}
          placeholder={placeholders[config.format] ?? 'HELLO123'}
        />
        {config.text.trim() === '' && (
          <InputWarning message={`Enter data for the barcode (e.g. ${placeholders[config.format] ?? 'HELLO123'})`} />
        )}
        {['EAN13'].includes(config.format) && config.text.trim() !== '' && config.text.replace(/\D/g, '').length !== 13 && (
          <InputWarning message="EAN-13 requires exactly 13 digits" />
        )}
        {['EAN8'].includes(config.format) && config.text.trim() !== '' && config.text.replace(/\D/g, '').length !== 8 && (
          <InputWarning message="EAN-8 requires exactly 8 digits" />
        )}
        {['UPCA'].includes(config.format) && config.text.trim() !== '' && config.text.replace(/\D/g, '').length !== 12 && (
          <InputWarning message="UPC-A requires exactly 12 digits" />
        )}
      </div>
      <Toggle label="Show Text Below" checked={config.showText} onChange={(v) => onChange({ showText: v })} />
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
  { value: 'custom', label: 'Custom Location', lat: 37.7837, lng: 27.266, radius: 500 },
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
  onMapPickerExpandedChange,
}: {
  config: MapConfig;
  onChange: (u: Partial<MapConfig>) => void;
  loading?: boolean;
  onMapPickerExpandedChange?: (expanded: boolean) => void;
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
        onExpandedChange={onMapPickerExpandedChange}
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
        max={5000}
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
