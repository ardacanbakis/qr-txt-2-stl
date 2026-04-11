import { useRef, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Preview3D } from './components/preview/Preview3D';
import { useModelConfig } from './hooks/useModelConfig';
import { exportSTL } from './generators/stl-exporter';
import type { GeneratedModelRef } from './components/preview/GeneratedModel';

function App() {
  const { config, updateBase, updateContent, updateMagnets, updateExport } = useModelConfig();
  const modelRef = useRef<GeneratedModelRef>(null);

  const handleExport = useCallback(() => {
    const scene = modelRef.current?.getScene();
    if (!scene) return;

    const inputText = config.content.text || 'model';
    const safeName = inputText.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
    exportSTL(scene, `${safeName}.stl`);
  }, [config.content.text]);

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100">
      <Sidebar
        config={config}
        onBaseChange={updateBase}
        onContentChange={updateContent}
        onMagnetChange={updateMagnets}
        onExportChange={updateExport}
        onExport={handleExport}
      />
      <main className="flex-1 h-full">
        <Preview3D ref={modelRef} config={config} />
      </main>
    </div>
  );
}

export default App;
