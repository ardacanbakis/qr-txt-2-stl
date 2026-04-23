import { useState } from 'react';
import { SectionHeader } from '../shared/SectionHeader';
import { GeneratorTabs } from '../settings/GeneratorTabs';
import { BaseSettings, BorderSettings } from '../settings/BaseSettings';
import { ModelSettings } from '../settings/ModelSettings';
import { MountingSettings } from '../settings/MountingSettings';
import { ColorSettings } from '../settings/ColorSettings';
import { Toggle } from '../shared/Toggle';
import { TemplatesPanel } from './TemplatesPanel';
import {
  QRSettings,
  TextSettings,
  SpotifySettings,
  WifiSettings,
  VCardSettings,
  LithophaneSettings,
  BarcodeSettings,
  NameplateSettings,
  MapSettings,
} from '../settings/GeneratorSettings';
import type {
  ModelConfig,
  BaseConfig,
  ContentConfig,
  MagnetHoleConfig,
  MountingConfig,
  ExportConfig,
  GeneratorType,
  TextConfig,
  SpotifyConfig,
  WifiCardConfig,
  VCardConfig,
  LithophaneConfig,
  BarcodeConfig,
  NameplateConfig,
  MapConfig,
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
  onLithophaneChange: (u: Partial<LithophaneConfig>) => void;
  onBarcodeChange: (u: Partial<BarcodeConfig>) => void;
  onNameplateChange: (u: Partial<NameplateConfig>) => void;
  onMapChange: (u: Partial<MapConfig>) => void;
  onMagnetChange: (u: Partial<MagnetHoleConfig>) => void;
  onMountingChange: (u: Partial<MountingConfig>) => void;
  onExportChange: (u: Partial<ExportConfig>) => void;
  onColorsChange: (u: Partial<ColorConfig>) => void;
  onExport: () => void;
  onTemplateApply: (t: Partial<ModelConfig>) => void;
  isExporting?: boolean;
}

const GENERATOR_LABELS: Record<GeneratorType, string> = {
  qr: 'QR Code',
  text: 'Text',
  spotify: 'Spotify Code',
  wifi: 'WiFi Card',
  vcard: 'Contact Card',
  lithophane: 'Lithophane',
  barcode: 'Barcode',
  nameplate: 'Nameplate',
  map: 'Map',
};

function IconSingle() {
  return (
    <svg viewBox="0 0 18 14" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="1" y="1" width="5" height="12" rx="1" />
      <rect x="8" y="1" width="9" height="12" rx="1" />
    </svg>
  );
}

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
    config, layout, onLayoutChange, onGeneratorChange,
    onBaseChange, onContentChange, onTextChange, onSpotifyChange,
    onWifiChange, onVCardChange, onLithophaneChange,
    onBarcodeChange, onNameplateChange, onMapChange, onMagnetChange, onMountingChange,
    onExportChange, onColorsChange, onExport, onTemplateApply,
    isExporting,
  } = props;

  const [showTemplates, setShowTemplates] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isDual = layout === 'dual';
  const isMap = config.generator === 'map';
  const showModel = config.generator !== 'lithophane';

  if (collapsed) {
    return (
      <>
        <aside className="w-10 min-w-10 h-full bg-gray-800 border-r border-gray-700 flex flex-col items-center py-3 gap-3">
          <button
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 3l5 5-5 5" />
            </svg>
          </button>
        </aside>
      </>
    );
  }

  return (
    <>
      {showTemplates && (
        <TemplatesPanel onApply={onTemplateApply} onClose={() => setShowTemplates(false)} />
      )}

      <aside className={`${isDual ? 'w-[300px] min-w-[300px]' : isMap ? 'w-[480px] min-w-[480px]' : 'w-[380px] min-w-[380px]'} h-full bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden transition-all`}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white tracking-tight">STL Generator</h1>
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">3D-printable STL files</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Templates */}
            <button
              onClick={() => setShowTemplates(true)}
              title="Templates"
              className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <rect x="1" y="1" width="6" height="6" rx="1" />
                <rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
            </button>
            {/* Layout toggle */}
            <button
              onClick={() => onLayoutChange(isDual ? 'single' : 'dual')}
              title={isDual ? 'Switch to single sidebar' : 'Switch to dual sidebar'}
              className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              {isDual ? <IconSingle /> : <IconDual />}
            </button>
            {/* Collapse */}
            <button
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
              className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 3L5 8l5 5" />
              </svg>
            </button>
          </div>
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
            {config.generator === 'lithophane' && <LithophaneSettings config={config.lithophane} onChange={onLithophaneChange} />}
            {config.generator === 'barcode' && <BarcodeSettings config={config.barcode} onChange={onBarcodeChange} />}
            {config.generator === 'nameplate' && <NameplateSettings config={config.nameplate} onChange={onNameplateChange} />}
            {config.generator === 'map' && <MapSettings config={config.map} onChange={onMapChange} />}
          </SectionHeader>

          {/* Model section always right under generator settings */}
          {showModel && (
            <SectionHeader title="Model" defaultOpen>
              <ModelSettings
                content={config.content}
                onContentChange={onContentChange}
              />
              {/* Mounting inline in single mode only */}
              {!isDual && (
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Mounting</p>
                  <MountingSettings
                    base={config.base}
                    magnets={config.magnets}
                    mounting={config.mounting}
                    onBaseChange={onBaseChange}
                    onMagnetChange={onMagnetChange}
                    onMountingChange={onMountingChange}
                  />
                </div>
              )}
            </SectionHeader>
          )}

          {/* Base Plate only in single-sidebar mode (moves to right panel in dual) */}
          {!isDual && (
            <>
              <SectionHeader title="Base Plate" defaultOpen>
                <BaseSettings base={config.base} onChange={onBaseChange} />
              </SectionHeader>
              <SectionHeader title="Border Frame" defaultOpen>
                <BorderSettings base={config.base} onChange={onBaseChange} />
              </SectionHeader>
            </>
          )}

          <SectionHeader title="Colors" defaultOpen>
            <ColorSettings
              colors={config.colors}
              generator={config.generator}
              onChange={onColorsChange}
            />
          </SectionHeader>
        </div>

        {/* Pinned export footer */}
        <div className="px-4 py-3 border-t border-gray-700 space-y-2">
          <Toggle
            label="Separate Parts (multi-color)"
            checked={config.export.separateParts}
            onChange={v => onExportChange({ separateParts: v })}
          />
          <button
            onClick={onExport}
            disabled={isExporting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {config.export.separateParts ? 'Download ZIP (parts)' : 'Download STL'}
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
