import { useRef, useCallback, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { RightPanel } from './components/layout/RightPanel';
import { Preview3D } from './components/preview/Preview3D';
import { FirebasePanel } from './components/layout/FirebasePanel';
import { useModelConfig } from './hooks/useModelConfig';
import { exportSTL, exportSeparateParts } from './generators/stl-exporter';
import type { GeneratedModelRef } from './components/preview/GeneratedModel';
import type { LayoutMode } from './components/layout/Sidebar';

function getBaseName(config: ReturnType<typeof useModelConfig>['config']): string {
  const g = config.generator;
  const raw =
    g === 'qr' ? config.content.text :
    g === 'text' ? config.text.text :
    g === 'spotify' ? 'spotify' :
    g === 'wifi' ? config.wifi.ssid :
    g === 'vcard' ? `${config.vcard.firstName}-${config.vcard.lastName}` :
    g === 'image' ? (config.image.fileName.replace(/\.[^.]+$/, '') || 'image') :
    g === 'lithophane' ? (config.lithophane.fileName.replace(/\.[^.]+$/, '') || 'lithophane') :
    g === 'barcode' ? config.barcode.text :
    g === 'nameplate' ? config.nameplate.primaryText :
    'model';
  return (raw || 'model').slice(0, 30).replace(/[^a-zA-Z0-9]+/g, '_') || 'model';
}

/** Thin dimension annotation bar shown at the bottom of the 3D viewport. */
function DimensionOverlay({ config }: { config: ReturnType<typeof useModelConfig>['config'] }) {
  if (config.generator === 'lithophane') return null;
  const { width, height, thickness } = config.base;
  const dim = config.base.shape === 'circle'
    ? `⌀${width} mm  ×  ${thickness} mm thick`
    : `${width} × ${height} × ${thickness} mm`;

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none z-10">
      <div className="bg-black/50 text-gray-300 text-xs font-mono px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
        {dim}
      </div>
    </div>
  );
}

function App() {
  const {
    config,
    setGenerator,
    applyTemplate,
    updateBase,
    updateContent,
    updateText,
    updateSpotify,
    updateWifi,
    updateVCard,
    updateImage,
    updateLithophane,
    updateBarcode,
    updateNameplate,
    updateMagnets,
    updateMounting,
    updateExport,
    updateColors,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useModelConfig();

  const modelRef = useRef<GeneratedModelRef>(null);
  const [layout, setLayout] = useState<LayoutMode>('single');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(() => {
    const scene = modelRef.current?.getScene();
    if (!scene || isExporting) return;

    setIsExporting(true);
    // Defer to next tick so the loading spinner renders before the blocking export.
    setTimeout(() => {
      try {
        const baseName = getBaseName(config);
        if (config.export.separateParts) {
          exportSeparateParts(scene, baseName);
        } else {
          exportSTL(scene, `${baseName}.stl`);
        }
      } finally {
        setIsExporting(false);
      }
    }, 50);
  }, [config, isExporting]);

  const sharedProps = {
    config,
    onGeneratorChange: setGenerator,
    onBaseChange: updateBase,
    onContentChange: updateContent,
    onTextChange: updateText,
    onSpotifyChange: updateSpotify,
    onWifiChange: updateWifi,
    onVCardChange: updateVCard,
    onImageChange: updateImage,
    onLithophaneChange: updateLithophane,
    onBarcodeChange: updateBarcode,
    onNameplateChange: updateNameplate,
    onMagnetChange: updateMagnets,
    onMountingChange: updateMounting,
    onExportChange: updateExport,
    onColorsChange: updateColors,
    onExport: handleExport,
    isExporting,
  };

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100 overflow-hidden">
      <Sidebar
        {...sharedProps}
        layout={layout}
        onLayoutChange={setLayout}
        onTemplateApply={applyTemplate}
      />

      <main className="flex-1 h-full min-w-0 relative">
        <Preview3D ref={modelRef} config={config} onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo} />
        <DimensionOverlay config={config} />
        {/* Firebase project save/load button — hidden when not configured */}
        <div className="absolute top-2 right-2 z-10">
          <FirebasePanel config={config} onLoad={applyTemplate} />
        </div>
      </main>

      {layout === 'dual' && (
        <RightPanel
          config={config}
          onBaseChange={updateBase}
          onContentChange={updateContent}
          onMagnetChange={updateMagnets}
          onMountingChange={updateMounting}
          onExportChange={updateExport}
          onColorsChange={updateColors}
          onExport={handleExport}
          isExporting={isExporting}
        />
      )}
    </div>
  );
}

export default App;
