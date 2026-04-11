import { useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { generateQRMatrix, createQRGeometry } from '../../generators/qr-generator';
import { createBasePlateGeometry } from '../../generators/base-generator';
import type { ModelConfig } from '../../types/model';

export interface GeneratedModelRef {
  getScene: () => THREE.Group | null;
  getBaseMesh: () => THREE.Mesh | null;
  getContentMesh: () => THREE.Mesh | null;
}

interface GeneratedModelProps {
  config: ModelConfig;
}

export const GeneratedModel = forwardRef<GeneratedModelRef, GeneratedModelProps>(
  ({ config }, ref) => {
    const groupRef = useRef<THREE.Group>(null);
    const baseMeshRef = useRef<THREE.Mesh>(null);
    const contentMeshRef = useRef<THREE.Mesh>(null);

    useImperativeHandle(ref, () => ({
      getScene: () => groupRef.current,
      getBaseMesh: () => baseMeshRef.current,
      getContentMesh: () => contentMeshRef.current,
    }));

    const baseGeometry = useMemo(() => {
      return createBasePlateGeometry(
        config.base.shape,
        config.base.width,
        config.base.height,
        config.base.thickness,
        config.base.cornerRadius,
      );
    }, [config.base.shape, config.base.width, config.base.height, config.base.thickness, config.base.cornerRadius]);

    const qrGeometry = useMemo(() => {
      const text = config.content.text || 'Hello';
      try {
        const { matrix, moduleCount } = generateQRMatrix(text, config.content.errorCorrection);
        return createQRGeometry(
          matrix,
          moduleCount,
          config.base.width,
          config.base.height,
          config.base.borderWidth,
          config.content.contentHeight,
          config.content.mode === 'embossed',
        );
      } catch {
        const { matrix, moduleCount } = generateQRMatrix('Hello', config.content.errorCorrection);
        return createQRGeometry(
          matrix,
          moduleCount,
          config.base.width,
          config.base.height,
          config.base.borderWidth,
          config.content.contentHeight,
          config.content.mode === 'embossed',
        );
      }
    }, [
      config.content.text,
      config.content.errorCorrection,
      config.content.contentHeight,
      config.content.mode,
      config.base.width,
      config.base.height,
      config.base.borderWidth,
    ]);

    const magnetGeometries = useMemo(() => {
      if (!config.magnets.enabled) return [];

      const diameter = config.magnets.customDiameter;
      const depth = config.magnets.customDepth;
      const radius = diameter / 2;
      const positions: [number, number][] = [];

      const w = config.base.width / 2 - radius - 2;
      const h = config.base.height / 2 - radius - 2;

      if (config.magnets.position === 'corners') {
        const count = Math.min(config.magnets.count, 4);
        const cornerPositions: [number, number][] = [[-w, -h], [w, -h], [w, h], [-w, h]];
        for (let i = 0; i < count; i++) positions.push(cornerPositions[i]);
      } else if (config.magnets.position === 'edges') {
        const count = Math.min(config.magnets.count, 4);
        const edgePositions: [number, number][] = [[0, -h], [w, 0], [0, h], [-w, 0]];
        for (let i = 0; i < count; i++) positions.push(edgePositions[i]);
      } else {
        positions.push([0, 0]);
      }

      return positions.map(([x, y]) => {
        const geo = new THREE.CylinderGeometry(radius, radius, depth, 32);
        geo.rotateX(Math.PI / 2);
        geo.translate(x, y, -(config.base.thickness / 2) + depth / 2 - 0.01);
        return geo;
      });
    }, [config.magnets, config.base.width, config.base.height, config.base.thickness]);

    const baseZPosition = config.content.mode === 'embossed' ? 0 : config.content.contentHeight / 2;
    const contentZPosition = config.content.mode === 'embossed'
      ? config.base.thickness / 2
      : config.base.thickness / 2 + config.content.contentHeight / 2;

    return (
      <group ref={groupRef}>
        <mesh
          ref={baseMeshRef}
          position={[0, 0, baseZPosition]}
          rotation={config.base.shape === 'circle' ? [Math.PI / 2, 0, 0] : [0, 0, 0]}
        >
          <primitive object={baseGeometry} attach="geometry" />
          <meshStandardMaterial color="#e0e0e0" roughness={0.4} metalness={0.1} />
        </mesh>

        <mesh
          ref={contentMeshRef}
          position={[0, 0, contentZPosition]}
        >
          <primitive object={qrGeometry} attach="geometry" />
          <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.2} />
        </mesh>

        {magnetGeometries.map((geo, i) => (
          <mesh key={i} position={[0, 0, baseZPosition]}>
            <primitive object={geo} attach="geometry" />
            <meshStandardMaterial color="#ff4444" roughness={0.5} transparent opacity={0.6} />
          </mesh>
        ))}
      </group>
    );
  }
);

GeneratedModel.displayName = 'GeneratedModel';
