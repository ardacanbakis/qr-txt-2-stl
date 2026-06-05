import { useRef, useCallback, useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { RightPanel } from './components/layout/RightPanel';
import { Preview3D } from './components/preview/Preview3D';
import { FirebasePanel } from './components/layout/FirebasePanel';
import { WelcomeScreen, useWelcomeScreen } from './components/layout/WelcomeScreen';
import { useModelConfig } from './hooks/useModelConfig';
import { useShareableUrl } from './hooks/useShareableUrl';
import { exportSTL, exportSeparateParts, validateScene } from './generators/stl-exporter';
import { BUILD_PLATES } from './components/preview/buildPlates';
import type { GeneratedModelRef } from './components/preview/GeneratedModel';
import type { LayoutMode } from './components/layout/Sidebar';

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return isMobile;
}

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
  const isMobile = useIsMobile();
  const [layout, setLayout] = useState<LayoutMode>('dual');
  const [isExporting, setIsExporting] = useState(false);
  const [buildPlateIndex, setBuildPlateIndex] = useState(0);
  const [customPlateSize, setCustomPlateSize] = useState({ width: 200, height: 200 });
  const [shareToast, setShareToast] = useState<'idle' | 'copied' | 'error'>('idle');
  const { showWelcome, dismiss: dismissWelcome, show: showWelcomeScreen } = useWelcomeScreen();

  const { copyShareUrl } = useShareableUrl(config, applyTemplate);

  const handleShare = useCallback(async () => {
    const ok = await copyShareUrl();
    setShareToast(ok ? 'copied' : 'error');
    setTimeout(() => setShareToast('idle'), 2500);
  }, [copyShareUrl]);

  const currentPlate = BUILD_PLATES[buildPlateIndex];
  const buildPlateWidth = currentPlate.custom ? customPlateSize.width : currentPlate.width;
  const buildPlateHeight = currentPlate.custom ? customPlateSize.height : currentPlate.height;

  const handleExport = useCallback(() => {
    const scene = modelRef.current?.getScene();
    if (!scene || isExporting) return;

    const { valid, warnings } = validateScene(scene);
    if (!valid) {
      const proceed = window.confirm(
        `STL validation warnings:\n• ${warnings.join('\n• ')}\n\nThe file may not print correctly. Export anyway?`
      );
      if (!proceed) return;
    }

    setIsExporting(true);
    setTimeout(() => {
      try {
        const baseName = getBaseName(config);
        const binary = !config.export.asciiStl;
        const ext = binary ? 'stl' : 'stl';
        if (config.export.separateParts) {
          exportSeparateParts(scene, baseName, binary);
        } else {
          exportSTL(scene, `${baseName}.${ext}`, binary);
        }
      } finally {
        setIsExporting(false);
      }
    }, 50);
  }, [config, isExporting]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); redo(); }
      else if (e.key === 'e') { e.preventDefault(); handleExport(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, handleExport]);

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

  const effectiveLayout: LayoutMode = isMobile ? 'single' : layout;

  return (
    <div className={`${isMobile ? 'flex-col' : 'flex-row'} flex h-screen w-screen bg-gray-900 text-gray-100 overflow-hidden`}>
      {isMobile ? (
        <>
          <main className="flex-1 min-h-0 relative">
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
            <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
              <ShareButton onShare={handleShare} toast={shareToast} />
              <FirebasePanel config={config} onLoad={applyTemplate} />
            </div>
          </main>
          <div className="h-[55vh] min-h-0 overflow-hidden flex flex-col border-t border-gray-700">
            <Sidebar
              {...sharedProps}
              layout={effectiveLayout}
              onLayoutChange={setLayout}
              onTemplateApply={applyTemplate}
              buildPlateWidth={buildPlateWidth}
              buildPlateHeight={buildPlateHeight}
              onShowWelcome={showWelcomeScreen}
              isMobile={isMobile}
            />
          </div>
        </>
      ) : (
        <>
          <Sidebar
            {...sharedProps}
            layout={effectiveLayout}
            onLayoutChange={setLayout}
            onTemplateApply={applyTemplate}
            buildPlateWidth={buildPlateWidth}
            buildPlateHeight={buildPlateHeight}
            onShowWelcome={showWelcomeScreen}
            isMobile={false}
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
            <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
              <ShareButton onShare={handleShare} toast={shareToast} />
              <FirebasePanel config={config} onLoad={applyTemplate} />
            </div>
          </main>

          {effectiveLayout === 'dual' && (
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
        </>
      )}
    </div>
  );
}

function ShareButton({ onShare, toast }: { onShare: () => void; toast: 'idle' | 'copied' | 'error' }) {
  return (
    <div className="relative">
      <button
        onClick={onShare}
        title="Copy shareable link"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 rounded-lg text-xs text-gray-300 hover:text-white transition-all backdrop-blur"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>
      {toast !== 'idle' && (
        <div className={`absolute top-full mt-1.5 right-0 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg ${
          toast === 'copied' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast === 'copied' ? 'Link copied!' : 'Copy failed'}
        </div>
      )}
    </div>
  );
}

export default App;
