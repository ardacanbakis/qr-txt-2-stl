import { useRef, useCallback, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { RightPanel } from './components/layout/RightPanel';
import { Preview3D } from './components/preview/Preview3D';
import { FirebasePanel } from './components/layout/FirebasePanel';
import { WelcomeScreen, useWelcomeScreen } from './components/layout/WelcomeScreen';
import { useModelConfig } from './hooks/useModelConfig';
import { exportSTL, exportSeparateParts } from './generators/stl-exporter';
import { BUILD_PLATES } from './components/preview/buildPlates';
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
    g === 'lithophane' ? (config.lithophane.fileName.replace(/\.[^.]+$/, '') || 'lithophane') :
    g === 'barcode' ? config.barcode.text :
    g === 'nameplate' ? config.nameplate.primaryText :
    g === 'map' ? 'map' :
    'model';
  return (raw || 'model').slice(0, 30).replace(/[^a-zA-Z0-9]+/g, '_') || 'model';
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
    updateLithophane,
    updateBarcode,
    updateNameplate,
    updateMap,
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
  const [layout, setLayout] = useState<LayoutMode>('dual');
  const [isExporting, setIsExporting] = useState(false);
  const [buildPlateIndex, setBuildPlateIndex] = useState(0);
  const [customPlateSize, setCustomPlateSize] = useState({ width: 200, height: 200 });
  const { showWelcome, dismiss: dismissWelcome, show: showWelcomeScreen } = useWelcomeScreen();

  const currentPlate = BUILD_PLATES[buildPlateIndex];
  const buildPlateWidth = currentPlate.custom ? customPlateSize.width : currentPlate.width;
  const buildPlateHeight = currentPlate.custom ? customPlateSize.height : currentPlate.height;

  const handleExport = useCallback(() => {
    const scene = modelRef.current?.getScene();
    if (!scene || isExporting) return;

    setIsExporting(true);
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
    onLithophaneChange: updateLithophane,
    onBarcodeChange: updateBarcode,
    onNameplateChange: updateNameplate,
    onMapChange: updateMap,
    onMagnetChange: updateMagnets,
    onMountingChange: updateMounting,
    onExportChange: updateExport,
    onColorsChange: updateColors,
    onExport: handleExport,
    isExporting,
  };

  if (showWelcome) {
    return <WelcomeScreen onDismiss={dismissWelcome} />;
  }

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100 overflow-hidden">
      <Sidebar
        {...sharedProps}
        layout={layout}
        onLayoutChange={setLayout}
        onTemplateApply={applyTemplate}
        buildPlateWidth={buildPlateWidth}
        buildPlateHeight={buildPlateHeight}
        onShowWelcome={showWelcomeScreen}
      />

      <main className="flex-1 h-full min-w-0 relative">
        <Preview3D
          ref={modelRef}
          config={config}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          buildPlateIndex={buildPlateIndex}
          onBuildPlateChange={setBuildPlateIndex}
          customPlateSize={customPlateSize}
          onCustomPlateSizeChange={setCustomPlateSize}
        />
        <div className="absolute top-2 right-2 z-10">
          <FirebasePanel config={config} onLoad={applyTemplate} />
        </div>
      </main>

      {layout === 'dual' && (
        <RightPanel
          config={config}
          onBaseChange={updateBase}
          onMagnetChange={updateMagnets}
          onMountingChange={updateMounting}
          onExportChange={updateExport}
          onExport={handleExport}
          isExporting={isExporting}
          buildPlateWidth={buildPlateWidth}
          buildPlateHeight={buildPlateHeight}
        />
      )}
    </div>
  );
}

export default App;
