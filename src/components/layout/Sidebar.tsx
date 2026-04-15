import { SectionHeader } from '../shared/SectionHeader';
import { GeneratorTabs } from '../settings/GeneratorTabs';
import { BaseSettings } from '../settings/BaseSettings';
import { ModelSettings } from '../settings/ModelSettings';
import { ExportSettings } from '../settings/ExportSettings';
import { ColorSettings } from '../settings/ColorSettings';
import {
  QRSettings,
  TextSettings,
  SpotifySettings,
  WifiSettings,
  VCardSettings,
  ImageSettings,
  LithophaneSettings,
  BarcodeSettings,
  NameplateSettings,
} from '../settings/GeneratorSettings';
import type {
  ModelConfig,
  BaseConfig,
  ContentConfig,
  MagnetHoleConfig,
  ExportConfig,
  GeneratorType,
  TextConfig,
  SpotifyConfig,
  WifiCardConfig,
  VCardConfig,
  ImageConfig,
  LithophaneConfig,
  BarcodeConfig,
  NameplateConfig,
  ColorConfig,
} from '../../types/model';

export type LayoutMode = 'single' | 'dual';

interface SidebarProps {
  config: ModelConfig;
  layout: LayoutMode;
  onLayoutChange: (l: LayoutMode) => void;
  onGeneratorChange: (g: GeneratorType) => void;
  onBaseChange: (u: Partial<BaseConfig>) => void;
  onContentChange: (u: Partial<ContentConfig>) => void;
  onTextChange: (u: Partial<TextConfig>) => void;
  onSpotifyChange: (u: Partial<SpotifyConfig>) => void;
  onWifiChange: (u: Partial<WifiCardConfig>) => void;
  onVCardChange: (u: Partial<VCardConfig>) => void;
  onImageChange: (u: Partial<ImageConfig>) => void;
  onLithophaneChange: (u: Partial<LithophaneConfig>) => void;
  onBarcodeChange: (u: Partial<BarcodeConfig>) => void;
  onNameplateChange: (u: Partial<NameplateConfig>) => void;
  onMagnetChange: (u: Partial<MagnetHoleConfig>) => void;
  onExportChange: (u: Partial<ExportConfig>) => void;
  onColorsChange: (u: Partial<ColorConfig>) => void;
  onExport: () => void;
}

const GENERATOR_LABELS: Record<GeneratorType, string> = {
  qr: 'QR Code',
  text: 'Text',
  spotify: 'Spotify Code',
  wifi: 'WiFi Card',
  vcard: 'Contact Card',
  image: 'Image',
  lithophane: 'Lithophane',
  barcode: 'Barcode',
  nameplate: 'Nameplate',
};

/** Icon: single column (one sidebar) */
function IconSingle() {
  return (
    <svg viewBox="0 0 18 14" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="1" y="1" width="5" height="12" rx="1" />
      <rect x="8" y="1" width="9" height="12" rx="1" />
    </svg>
  );
}

/** Icon: two columns (dual sidebar) */
function IconDual() {
  return (
    <svg viewBox="0 0 20 14" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="1" y="1" width="5" height="12" rx="1" />
      <rect x="7.5" y="1" width="5" height="12" rx="1" />
      <rect x="14" y="1" width="5" height="12" rx="1" />
    </svg>
  );
}

export function Sidebar(props: SidebarProps) {
  const {
    config,
    layout,
    onLayoutChange,
    onGeneratorChange,
    onBaseChange,
    onContentChange,
    onTextChange,
    onSpotifyChange,
    onWifiChange,
    onVCardChange,
    onImageChange,
    onLithophaneChange,
    onBarcodeChange,
    onNameplateChange,
    onMagnetChange,
    onExportChange,
    onColorsChange,
    onExport,
  } = props;

  const isDual = layout === 'dual';
  const showBase = config.generator !== 'lithophane';
  const showModel = config.generator !== 'lithophane' && config.generator !== 'image';

  return (
    <aside className={`${isDual ? 'w-[300px] min-w-[300px]' : 'w-[380px] min-w-[380px]'} h-full bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden transition-all`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">STL Generator</h1>
          <p className="text-xs text-gray-400 mt-0.5">3D-printable STL files</p>
        </div>
        {/* Layout toggle */}
        <button
          onClick={() => onLayoutChange(isDual ? 'single' : 'dual')}
          title={isDual ? 'Switch to single sidebar' : 'Switch to dual sidebar'}
          className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
        >
          {isDual ? <IconSingle /> : <IconDual />}
        </button>
      </div>

      {/* Generator tabs */}
      <div className="border-b border-gray-700 bg-gray-850">
        <GeneratorTabs value={config.generator} onChange={onGeneratorChange} />
      </div>

      {/* Scrollable settings */}
      <div className="flex-1 overflow-y-auto">
        <SectionHeader title={GENERATOR_LABELS[config.generator]} defaultOpen>
          {config.generator === 'qr' && <QRSettings content={config.content} onChange={onContentChange} />}
          {config.generator === 'text' && <TextSettings config={config.text} onChange={onTextChange} />}
          {config.generator === 'spotify' && <SpotifySettings config={config.spotify} onChange={onSpotifyChange} />}
          {config.generator === 'wifi' && <WifiSettings config={config.wifi} onChange={onWifiChange} />}
          {config.generator === 'vcard' && <VCardSettings config={config.vcard} onChange={onVCardChange} />}
          {config.generator === 'image' && <ImageSettings config={config.image} onChange={onImageChange} />}
          {config.generator === 'lithophane' && <LithophaneSettings config={config.lithophane} onChange={onLithophaneChange} />}
          {config.generator === 'barcode' && <BarcodeSettings config={config.barcode} onChange={onBarcodeChange} />}
          {config.generator === 'nameplate' && <NameplateSettings config={config.nameplate} onChange={onNameplateChange} />}
        </SectionHeader>

        {/* In single-sidebar mode, also show base/model/colors/export here */}
        {!isDual && (
          <>
            {showBase && (
              <SectionHeader title="Base Plate" defaultOpen>
                <BaseSettings base={config.base} onChange={onBaseChange} />
              </SectionHeader>
            )}

            {showModel && (
              <SectionHeader title="Model" defaultOpen>
                <ModelSettings
                  content={config.content}
                  magnets={config.magnets}
                  onContentChange={onContentChange}
                  onMagnetChange={onMagnetChange}
                />
              </SectionHeader>
            )}

            <SectionHeader title="Colors" defaultOpen={false}>
              <ColorSettings
                colors={config.colors}
                generator={config.generator}
                onChange={onColorsChange}
              />
            </SectionHeader>

            <SectionHeader title="Export" defaultOpen>
              <ExportSettings
                exportConfig={config.export}
                onChange={onExportChange}
                onExport={onExport}
              />
            </SectionHeader>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
        All dimensions in millimeters
      </div>
    </aside>
  );
}
