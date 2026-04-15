import { useRef, useCallback, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { RightPanel } from './components/layout/RightPanel';
import { Preview3D } from './components/preview/Preview3D';
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

function App() {
  const {
    config,
    setGenerator,
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
    updateExport,
    updateColors,
  } = useModelConfig();
  const modelRef = useRef<GeneratedModelRef>(null);
  const [layout, setLayout] = useState<LayoutMode>('single');

  const handleExport = useCallback(() => {
    const scene = modelRef.current?.getScene();
    if (!scene) return;

    const baseName = getBaseName(config);
    if (config.export.separateParts) {
      exportSeparateParts(scene, baseName);
    } else {
      exportSTL(scene, `${baseName}.stl`);
    }
  }, [config]);

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
    onExportChange: updateExport,
    onColorsChange: updateColors,
    onExport: handleExport,
  };

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100 overflow-hidden">
      <Sidebar
        {...sharedProps}
        layout={layout}
        onLayoutChange={setLayout}
      />

      <main className="flex-1 h-full min-w-0">
        <Preview3D ref={modelRef} config={config} />
      </main>

      {layout === 'dual' && (
        <RightPanel
          config={config}
          onBaseChange={updateBase}
          onContentChange={updateContent}
          onMagnetChange={updateMagnets}
          onExportChange={updateExport}
          onColorsChange={updateColors}
          onExport={handleExport}
        />
      )}
    </div>
  );
}

export default App;
