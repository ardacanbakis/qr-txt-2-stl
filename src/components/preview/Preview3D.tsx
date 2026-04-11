import { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, GizmoHelper, GizmoViewcube, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { GeneratedModel, type GeneratedModelRef } from './GeneratedModel';
import { ViewToolbar } from './ViewToolbar';
import type { ModelConfig } from '../../types/model';

// --- Camera command system ---

interface CameraCommand {
  type: string;
  key: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Camera positions for Z-up orientation
const VIEW_POSITIONS: Record<string, { pos: [number, number, number]; up: [number, number, number] }> = {
  top:    { pos: [0, 0, 1],    up: [0, 1, 0] },
  bottom: { pos: [0, 0, -1],   up: [0, -1, 0] },
  front:  { pos: [0, -1, 0],   up: [0, 0, 1] },
  back:   { pos: [0, 1, 0],    up: [0, 0, 1] },
  left:   { pos: [-1, 0, 0],   up: [0, 0, 1] },
  right:  { pos: [1, 0, 0],    up: [0, 0, 1] },
  home:   { pos: [0.5, -0.5, 0.65], up: [0, 0, 1] },
};

// --- Scene controller (lives inside Canvas) ---

function SceneController({
  command,
  modelRef,
}: {
  command: CameraCommand | null;
  modelRef: React.RefObject<THREE.Group | null>;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const animRef = useRef<{
    startPos: THREE.Vector3;
    targetPos: THREE.Vector3;
    startUp: THREE.Vector3;
    targetUp: THREE.Vector3;
    progress: number;
  } | null>(null);
  const processedKey = useRef(-1);

  useEffect(() => {
    if (!command || command.key === processedKey.current) return;
    processedKey.current = command.key;

    const currentDist = camera.position.length();
    let targetPos: THREE.Vector3;
    let targetUp: THREE.Vector3;

    if (command.type === 'zoomIn' || command.type === 'zoomOut') {
      const factor = command.type === 'zoomIn' ? 0.8 : 1.25;
      const dir = camera.position.clone().normalize();
      const newDist = THREE.MathUtils.clamp(currentDist * factor, 10, 500);
      targetPos = dir.multiplyScalar(newDist);
      targetUp = camera.up.clone();
    } else if (command.type === 'fit') {
      if (!modelRef.current) return;
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = (camera as THREE.PerspectiveCamera).fov;
      const fitDist = (maxDim / 2) / Math.tan(THREE.MathUtils.degToRad(fov / 2)) * 1.8;
      targetPos = new THREE.Vector3(
        center.x + fitDist * 0.5,
        center.y - fitDist * 0.5,
        center.z + fitDist * 0.65,
      );
      targetUp = new THREE.Vector3(0, 0, 1);
      if (controlsRef.current) {
        controlsRef.current.target.copy(center);
      }
    } else {
      const view = VIEW_POSITIONS[command.type];
      if (!view) return;
      const distance = Math.max(currentDist, 80);
      targetPos = new THREE.Vector3(...view.pos).multiplyScalar(distance);
      targetUp = new THREE.Vector3(...view.up);
    }

    animRef.current = {
      startPos: camera.position.clone(),
      targetPos,
      startUp: camera.up.clone(),
      targetUp,
      progress: 0,
    };
  }, [command, camera, modelRef]);

  useFrame((_, delta) => {
    if (!animRef.current) return;

    animRef.current.progress = Math.min(animRef.current.progress + delta * 3.5, 1);
    const t = easeOutCubic(animRef.current.progress);

    camera.position.lerpVectors(animRef.current.startPos, animRef.current.targetPos, t);
    camera.up.lerpVectors(animRef.current.startUp, animRef.current.targetUp, t).normalize();

    if (controlsRef.current) {
      controlsRef.current.update();
    }

    if (animRef.current.progress >= 1) {
      animRef.current = null;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan
      enableZoom
      enableRotate
      minDistance={10}
      maxDistance={500}
    />
  );
}

// --- Main Preview3D component ---

interface Preview3DProps {
  config: ModelConfig;
}

export const Preview3D = forwardRef<GeneratedModelRef, Preview3DProps>(({ config }, ref) => {
  const [showGrid, setShowGrid] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand | null>(null);
  const commandKey = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const modelGroupRef = useRef<THREE.Group>(null);

  const sendCommand = useCallback((type: string) => {
    commandKey.current++;
    setCameraCommand({ type, key: commandKey.current });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const bgColor = darkMode ? '#111827' : '#eef2f7';

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{ background: bgColor }}
    >
      <Canvas
        camera={{ position: [60, -60, 80], up: [0, 0, 1], fov: 45, near: 0.1, far: 1000 }}
        style={{ background: bgColor }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[50, -30, 80]} intensity={0.8} />
        <directionalLight position={[-30, 40, -20]} intensity={0.3} />
        <Environment preset="studio" />

        {/* Camera controller */}
        <SceneController command={cameraCommand} modelRef={modelGroupRef} />

        {/* Model */}
        <group ref={modelGroupRef}>
          <GeneratedModel ref={ref} config={config} />
        </group>

        {/* Grid on XY plane (Z-up) */}
        {showGrid && (
          <Grid
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, 0, -config.base.thickness / 2 - 0.5]}
            cellSize={5}
            cellThickness={0.5}
            cellColor={darkMode ? '#4a4a6a' : '#a8d4f0'}
            sectionSize={10}
            sectionThickness={1}
            sectionColor={darkMode ? '#6a6a9a' : '#72b8e4'}
            fadeDistance={150}
            infiniteGrid
          />
        )}

        {/* View cube - top left */}
        <GizmoHelper alignment="top-left" margin={[75, 75]}>
          <GizmoViewcube
            faces={['Right', 'Left', 'Back', 'Front', 'Top', 'Bottom']}
            color={darkMode ? '#374151' : '#e4e4e7'}
            hoverColor={darkMode ? '#4b5563' : '#a1a1aa'}
            textColor={darkMode ? '#d1d5db' : '#18181b'}
            strokeColor={darkMode ? '#6b7280' : '#d4d4d8'}
            opacity={0.9}
          />
        </GizmoHelper>

        {/* Axis indicator - bottom right */}
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport
            axisColors={['#ef4444', '#22c55e', '#3b82f6']}
            labelColor="white"
          />
        </GizmoHelper>
      </Canvas>

      {/* Toolbar overlay */}
      <ViewToolbar
        showGrid={showGrid}
        darkMode={darkMode}
        isFullscreen={isFullscreen}
        onViewChange={(view) => sendCommand(view)}
        onHome={() => sendCommand('home')}
        onFit={() => sendCommand('fit')}
        onZoomIn={() => sendCommand('zoomIn')}
        onZoomOut={() => sendCommand('zoomOut')}
        onToggleGrid={() => setShowGrid((v) => !v)}
        onToggleDarkMode={() => setDarkMode((v) => !v)}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Controls help - bottom left */}
      <div className={`absolute bottom-3 left-3 text-xs px-2 py-1 rounded ${
        darkMode ? 'text-gray-500 bg-gray-900/80' : 'text-gray-400 bg-white/80 border border-gray-200'
      }`}>
        LMB: Rotate &middot; RMB: Pan &middot; Scroll: Zoom
      </div>

      {/* Dimensions - top right */}
      <div className={`absolute top-3 right-3 text-xs px-3 py-2 rounded font-mono space-y-0.5 ${
        darkMode ? 'text-gray-400 bg-gray-900/80' : 'text-gray-500 bg-white/80 border border-gray-200'
      }`}>
        <div>{config.base.width} x {config.base.height} x {config.base.thickness}mm</div>
        <div>Content: {config.content.contentHeight}mm ({config.content.mode})</div>
      </div>
    </div>
  );
});

Preview3D.displayName = 'Preview3D';
