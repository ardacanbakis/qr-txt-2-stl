import type { ContentConfig, InputType } from '../../types/model';
import { Select } from '../shared/Select';

interface InputSettingsProps {
  content: ContentConfig;
  onChange: (updates: Partial<ContentConfig>) => void;
}

const INPUT_TYPE_OPTIONS = [
  { value: 'text', label: 'Text / URL' },
  { value: 'wifi', label: 'WiFi Credentials' },
  { value: 'vcard', label: 'vCard Contact' },
  { value: 'spotify', label: 'Spotify Link' },
  { value: 'label', label: 'Text Label (3D Text)' },
];

const ERROR_CORRECTION_OPTIONS = [
  { value: 'L', label: 'L - Low (7%)' },
  { value: 'M', label: 'M - Medium (15%)' },
  { value: 'Q', label: 'Q - Quartile (25%)' },
  { value: 'H', label: 'H - High (30%)' },
];

export function InputSettings({ content, onChange }: InputSettingsProps) {
  return (
    <div className="space-y-3">
      <Select
        label="Input Type"
        value={content.inputType}
        options={INPUT_TYPE_OPTIONS}
        onChange={v => onChange({ inputType: v as InputType })}
      />

      {(content.inputType === 'text' || content.inputType === 'url') && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Content</label>
            <textarea
              value={content.text}
              onChange={e => onChange({ text: e.target.value })}
              placeholder="Enter text or URL..."
              rows={3}
              className="bg-gray-700 text-gray-200 text-sm rounded-md px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
          <Select
            label="Error Correction"
            value={content.errorCorrection}
            options={ERROR_CORRECTION_OPTIONS}
            onChange={v => onChange({ errorCorrection: v as ContentConfig['errorCorrection'] })}
          />
        </>
      )}

      {content.inputType === 'wifi' && (
        <div className="space-y-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">SSID</label>
            <input
              type="text"
              placeholder="Network name..."
              className="bg-gray-700 text-gray-200 text-sm rounded-md px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
              onChange={e => {
                const wifi = `WIFI:T:WPA;S:${e.target.value};P:password;;`;
                onChange({ text: wifi });
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Password</label>
            <input
              type="text"
              placeholder="Password..."
              className="bg-gray-700 text-gray-200 text-sm rounded-md px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <p className="text-xs text-gray-500 italic">WiFi QR - full implementation coming in Phase 4</p>
        </div>
      )}

      {content.inputType === 'spotify' && (
        <div className="space-y-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Spotify Link</label>
            <input
              type="text"
              placeholder="https://open.spotify.com/..."
              className="bg-gray-700 text-gray-200 text-sm rounded-md px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
              onChange={e => onChange({ text: e.target.value })}
            />
          </div>
          <p className="text-xs text-gray-500 italic">Spotify code generation coming in Phase 4. Currently encodes as QR.</p>
        </div>
      )}

      {content.inputType === 'vcard' && (
        <p className="text-xs text-gray-500 italic">vCard input coming in Phase 4. Use Text/URL for now.</p>
      )}

      {content.inputType === 'label' && (
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Label Text</label>
          <input
            type="text"
            value={content.text}
            onChange={e => onChange({ text: e.target.value })}
            placeholder="Enter label text..."
            className="bg-gray-700 text-gray-200 text-sm rounded-md px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
          <p className="text-xs text-gray-500 italic">3D text labels coming in Phase 5. Currently encodes as QR.</p>
        </div>
      )}
    </div>
  );
}
