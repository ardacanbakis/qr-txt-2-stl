import { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, GizmoHelper, GizmoViewcube, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { GeneratedModel, type GeneratedModelRef } from './GeneratedModel';
import { ViewToolbar } from './ViewToolbar';
import type { ModelConfig } from '../../types/model';

// --- Build plate presets ---

export interface BuildPlate {
  name: string;
  width: number;
  height: number;
}

export const BUILD_PLATES: BuildPlate[] = [
  { name: 'Bambu Lab H2D', width: 350, height: 325 },
  { name: 'Bambu Lab A1', width: 256, height: 256 },
  { name: 'Bambu Lab A1 Mini', width: 180, height: 180 },
  { name: 'Bambu Lab X1C', width: 256, height: 256 },
  { name: 'Bambu Lab P1S', width: 256, height: 256 },
];

// --- Z-up spherical helpers ---

function toZUpSpherical(v: THREE.Vector3) {
  const r = v.length();
  if (r < 0.0001) return { r: 0, phi: 0, theta: 0 };
  const phi = Math.acos(THREE.MathUtils.clamp(v.z / r, -1, 1));
  const theta = Math.atan2(v.y, v.x);
  return { r, phi, theta };
}

function fromZUpSpherical(r: number, phi: number, theta: number): THREE.Vector3 {
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
  );
}

// --- Camera command system ---

interface CameraCommand {
  type: string;
  key: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// View presets in Z-up spherical coordinates
const VIEW_PRESETS: Record<string, { phi: number; theta: number; up: [number, number, number] }> = {
  top:    { phi: 0.001,              theta: 0,             up: [0, 1, 0] },
  bottom: { phi: Math.PI - 0.001,   theta: 0,             up: [0, -1, 0] },
  front:  { phi: Math.PI / 2,       theta: -Math.PI / 2,  up: [0, 0, 1] },
  back:   { phi: Math.PI / 2,       theta: Math.PI / 2,   up: [0, 0, 1] },
  left:   { phi: Math.PI / 2,       theta: Math.PI,       up: [0, 0, 1] },
  right:  { phi: Math.PI / 2,       theta: 0,             up: [0, 0, 1] },
  home:   { phi: 0.83,              theta: -0.785,        up: [0, 0, 1] },
};

// --- Scene controller (lives inside Canvas) ---

interface AnimState {
  startPhi: number;
  startTheta: number;
  startRadius: number;
  targetPhi: number;
  targetTheta: number;
  targetRadius: number;
  targetUp: THREE.Vector3;
  progress: number;
}

function SceneController({
  command,
  modelRef,
}: {
  command: CameraCommand | null;
  modelRef: React.RefObject<THREE.Group | null>;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const animRef = useRef<AnimState | null>(null);
  const processedKey = useRef(-1);

  useEffect(() => {
    if (!command || command.key === processedKey.current) return;
    processedKey.current = command.key;

    const current = toZUpSpherical(camera.position);

    if (command.type === 'zoomIn' || command.type === 'zoomOut') {
      const factor = command.type === 'zoomIn' ? 0.8 : 1.25;
      animRef.current = {
        startPhi: current.phi,
        startTheta: current.theta,
        startRadius: current.r,
        targetPhi: current.phi,
        targetTheta: current.theta,
        targetRadius: THREE.MathUtils.clamp(current.r * factor, 10, 500),
        targetUp: camera.up.clone(),
        progress: 0,
      };
      return;
    }

    if (command.type === 'fit') {
      if (!modelRef.current) return;
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = (camera as THREE.PerspectiveCamera).fov;
      const fitDist = (maxDim / 2) / Math.tan(THREE.MathUtils.degToRad(fov / 2)) * 2;
      const home = VIEW_PRESETS.home;

      let dTheta = home.theta - current.theta;
      if (dTheta > Math.PI) dTheta -= 2 * Math.PI;
      if (dTheta < -Math.PI) dTheta += 2 * Math.PI;

      if (controlsRef.current) {
        controlsRef.current.target.copy(center);
      }

      animRef.current = {
        startPhi: current.phi,
        startTheta: current.theta,
        startRadius: current.r,
        targetPhi: home.phi,
        targetTheta: current.theta + dTheta,
        targetRadius: fitDist,
        targetUp: new THREE.Vector3(0, 0, 1),
        progress: 0,
      };
      return;
    }

    const preset = VIEW_PRESETS[command.type];
    if (!preset) return;

    const distance = Math.max(current.r, 80);

    // Shortest theta path
    let dTheta = preset.theta - current.theta;
    if (dTheta > Math.PI) dTheta -= 2 * Math.PI;
    if (dTheta < -Math.PI) dTheta += 2 * Math.PI;

    animRef.current = {
      startPhi: current.phi,
      startTheta: current.theta,
      startRadius: current.r,
      targetPhi: preset.phi,
      targetTheta: current.theta + dTheta,
      targetRadius: distance,
      targetUp: new THREE.Vector3(...preset.up),
      progress: 0,
    };
  }, [command, camera, modelRef]);

  useFrame((_, delta) => {
    if (!animRef.current) return;
    const anim = animRef.current;

    anim.progress = Math.min(anim.progress + delta * 3.5, 1);
    const t = easeOutCubic(anim.progress);

    const phi = THREE.MathUtils.lerp(anim.startPhi, anim.targetPhi, t);
    const theta = THREE.MathUtils.lerp(anim.startTheta, anim.targetTheta, t);
    const radius = THREE.MathUtils.lerp(anim.startRadius, anim.targetRadius, t);

    camera.position.copy(fromZUpSpherical(radius, phi, theta));

    // Snap up vector in the last 20% of animation
    if (t > 0.8) {
      const upT = (t - 0.8) / 0.2;
      camera.up.lerp(anim.targetUp, upT).normalize();
    }

    if (controlsRef.current) {
      controlsRef.current.update();
    }

    if (anim.progress >= 1) {
      camera.up.copy(anim.targetUp);
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
  const [buildPlateIndex, setBuildPlateIndex] = useState(0);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand | null>(null);
  const commandKey = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const modelGroupRef = useRef<THREE.Group>(null);

  const buildPlate = BUILD_PLATES[buildPlateIndex];

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
      className="w-full h-full relative overflow-hidden"
      style={{ background: bgColor, ...(isFullscreen ? { width: '100vw', height: '100vh' } : {}) }}
    >
      <Canvas
        camera={{ position: [60, -60, 80], up: [0, 0, 1], fov: 45, near: 0.1, far: 1000 }}
        style={{ background: bgColor, width: '100%', height: '100%' }}
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

        {/* Grid sized to build plate */}
        {showGrid && (
          <Grid
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, 0, -config.base.thickness / 2 - 0.5]}
            args={[buildPlate.width, buildPlate.height]}
            cellSize={10}
            cellThickness={0.5}
            cellColor={darkMode ? '#4a4a6a' : '#a8d4f0'}
            sectionSize={50}
            sectionThickness={1}
            sectionColor={darkMode ? '#6a6a9a' : '#72b8e4'}
            fadeDistance={500}
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
        buildPlateIndex={buildPlateIndex}
        buildPlates={BUILD_PLATES}
        onViewChange={(view) => sendCommand(view)}
        onHome={() => sendCommand('home')}
        onFit={() => sendCommand('fit')}
        onZoomIn={() => sendCommand('zoomIn')}
        onZoomOut={() => sendCommand('zoomOut')}
        onToggleGrid={() => setShowGrid((v) => !v)}
        onToggleDarkMode={() => setDarkMode((v) => !v)}
        onToggleFullscreen={toggleFullscreen}
        onBuildPlateChange={setBuildPlateIndex}
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
        <div className="text-[10px] opacity-70">{buildPlate.name} ({buildPlate.width}x{buildPlate.height})</div>
      </div>
    </div>
  );
});

Preview3D.displayName = 'Preview3D';
