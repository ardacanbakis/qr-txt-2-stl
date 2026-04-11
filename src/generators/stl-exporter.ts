import * as THREE from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';

export function exportSTL(scene: THREE.Scene | THREE.Group, filename: string = 'model.stl'): void {
  const exporter = new STLExporter();
  const stlString = exporter.parse(scene, { binary: true });

  const blob = new Blob([stlString], { type: 'application/octet-stream' });
  downloadBlob(blob, filename);
}

export function exportMultiMaterialSTL(
  baseMesh: THREE.Mesh,
  contentMesh: THREE.Mesh,
  baseFilename: string = 'base.stl',
  contentFilename: string = 'content.stl',
): void {
  const exporter = new STLExporter();

  const baseScene = new THREE.Scene();
  baseScene.add(baseMesh.clone());
  const baseSTL = exporter.parse(baseScene, { binary: true });

  const contentScene = new THREE.Scene();
  contentScene.add(contentMesh.clone());
  const contentSTL = exporter.parse(contentScene, { binary: true });

  downloadBlob(new Blob([baseSTL], { type: 'application/octet-stream' }), baseFilename);
  setTimeout(() => {
    downloadBlob(new Blob([contentSTL], { type: 'application/octet-stream' }), contentFilename);
  }, 500);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
