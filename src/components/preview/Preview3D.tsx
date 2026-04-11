import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { forwardRef } from 'react';
import { GeneratedModel, type GeneratedModelRef } from './GeneratedModel';
import type { ModelConfig } from '../../types/model';

interface Preview3DProps {
  config: ModelConfig;
}

export const Preview3D = forwardRef<GeneratedModelRef, Preview3DProps>(({ config }, ref) => {
  return (
    <div className="w-full h-full bg-gray-900 relative">
      <Canvas
        camera={{ position: [60, 60, 80], fov: 45, near: 0.1, far: 1000 }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[50, 50, 50]} intensity={0.8} castShadow />
        <directionalLight position={[-30, 20, -20]} intensity={0.3} />
        <Environment preset="studio" />

        <GeneratedModel ref={ref} config={config} />

        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableRotate
          minDistance={20}
          maxDistance={300}
        />

        <Grid
          position={[0, 0, -config.base.thickness / 2 - 0.5]}
          args={[200, 200]}
          cellSize={5}
          cellThickness={0.5}
          cellColor="#4a4a6a"
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#6a6a9a"
          fadeDistance={150}
          infiniteGrid
        />
      </Canvas>

      <div className="absolute bottom-3 left-3 text-xs text-gray-500 bg-gray-900/80 px-2 py-1 rounded">
        LMB: Rotate &middot; RMB: Pan &middot; Scroll: Zoom
      </div>

      <div className="absolute top-3 right-3 text-xs text-gray-400 bg-gray-900/80 px-3 py-2 rounded font-mono space-y-0.5">
        <div>{config.base.width} x {config.base.height} x {config.base.thickness}mm</div>
        <div>Content: {config.content.contentHeight}mm ({config.content.mode})</div>
      </div>
    </div>
  );
});

Preview3D.displayName = 'Preview3D';
