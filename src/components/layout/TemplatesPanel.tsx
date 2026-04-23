import type { ModelConfig } from '../../types/model';
import { DEFAULT_CONFIG } from '../../types/model';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Partial<ModelConfig>;
}

const TEMPLATES: Template[] = [
  {
    id: 'business-card-qr',
    name: 'Business Card QR',
    description: 'Credit-card sized plate with QR code',
    icon: '💼',
    config: {
      generator: 'qr',
      base: { ...DEFAULT_CONFIG.base, shape: 'rounded-rectangle', width: 85, height: 54, thickness: 2, cornerRadius: 3, borderWidth: 4, edgeTreatment: 'chamfer', filletRadius: 0.5 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.2, mode: 'embossed' },
    },
  },
  {
    id: 'wifi-sign',
    name: 'WiFi Sign',
    description: 'Large sign with WiFi QR code and network name',
    icon: '📶',
    config: {
      generator: 'wifi',
      base: { ...DEFAULT_CONFIG.base, shape: 'rounded-rectangle', width: 100, height: 80, thickness: 3, cornerRadius: 5, borderWidth: 5, edgeTreatment: 'fillet', filletRadius: 1 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.5, mode: 'embossed' },
      wifi: { ...DEFAULT_CONFIG.wifi, showText: true },
    },
  },
  {
    id: 'spotify-keychain',
    name: 'Spotify Keychain',
    description: 'Keychain with your favorite track code',
    icon: '🎵',
    config: {
      generator: 'spotify',
      base: { ...DEFAULT_CONFIG.base, shape: 'rounded-rectangle', width: 100, height: 40, thickness: 3, cornerRadius: 4, borderWidth: 5, borderEnabled: true, keychainHole: true, edgeTreatment: 'fillet', filletRadius: 0.8 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.2, mode: 'embossed' },
      spotify: { ...DEFAULT_CONFIG.spotify, showLogo: true },
    },
  },
  {
    id: 'name-tag',
    name: 'Name Tag',
    description: 'Badge-sized nameplate with primary and secondary text',
    icon: '🏷️',
    config: {
      generator: 'nameplate',
      base: { ...DEFAULT_CONFIG.base, shape: 'rounded-rectangle', width: 90, height: 55, thickness: 2.5, cornerRadius: 4, borderWidth: 5, edgeTreatment: 'chamfer', filletRadius: 0.8 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.5, mode: 'embossed' },
      nameplate: { ...DEFAULT_CONFIG.nameplate },
    },
  },
  {
    id: 'barcode-label',
    name: 'Barcode Label',
    description: 'Rectangular label with CODE 39 barcode',
    icon: '📦',
    config: {
      generator: 'barcode',
      base: { ...DEFAULT_CONFIG.base, shape: 'rectangle', width: 80, height: 30, thickness: 2, borderWidth: 3, edgeTreatment: 'none', filletRadius: 0.5 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.2, mode: 'embossed' },
      barcode: { ...DEFAULT_CONFIG.barcode, showText: true },
    },
  },
  {
    id: 'vcard-circle',
    name: 'Contact Coin',
    description: 'Round plate with vCard QR code',
    icon: '👤',
    config: {
      generator: 'vcard',
      base: { ...DEFAULT_CONFIG.base, shape: 'circle', width: 60, height: 60, thickness: 3, borderWidth: 4, edgeTreatment: 'fillet', filletRadius: 1 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.5, mode: 'embossed' },
    },
  },
  {
    id: 'fridge-magnet',
    name: 'Fridge Magnet',
    description: 'Compact magnet with text label on back recess',
    icon: '🧲',
    config: {
      generator: 'nameplate',
      base: { ...DEFAULT_CONFIG.base, shape: 'rounded-rectangle', width: 70, height: 40, thickness: 4, cornerRadius: 4, borderWidth: 4, edgeTreatment: 'fillet', filletRadius: 1 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.5, mode: 'embossed' },
      mounting: { ...DEFAULT_CONFIG.mounting, fridgeMagnet: true, fridgeMagnetWidth: 20, fridgeMagnetHeight: 5, fridgeMagnetDepth: 1.5 },
    },
  },
  {
    id: 'lithophane-frame',
    name: 'Lithophane',
    description: 'Backlit photo panel, standard size',
    icon: '🖼️',
    config: {
      generator: 'lithophane',
      base: { ...DEFAULT_CONFIG.base, width: 80, height: 80, thickness: 3 },
      lithophane: { ...DEFAULT_CONFIG.lithophane, minThickness: 0.6, maxThickness: 3.2 },
    },
  },
];

interface TemplatesPanelProps {
  onApply: (config: Partial<ModelConfig>) => void;
  onClose: () => void;
}

export function TemplatesPanel({ onApply, onClose }: TemplatesPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-[480px] max-w-[95vw] max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="text-base font-semibold text-gray-100">Templates</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-4 grid grid-cols-2 gap-3">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => { onApply(t.config); onClose(); }}
              className="flex flex-col gap-1 p-3 bg-gray-750 hover:bg-gray-700 border border-gray-600 hover:border-blue-500 rounded-lg text-left transition-all group"
            >
              <span className="text-2xl">{t.icon}</span>
              <span className="text-sm font-medium text-gray-200 group-hover:text-white">{t.name}</span>
              <span className="text-xs text-gray-400 leading-snug">{t.description}</span>
            </button>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-gray-700 text-xs text-gray-500">
          Selecting a template replaces the current base and generator settings.
        </div>
      </div>
    </div>
  );
}
