import * as THREE from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';

/** Tag applied to mesh.userData.part for separate-parts export. */
export type PartTag = 'base' | 'border' | 'content' | 'text' | 'secondary' | 'logo' | 'ignore';

export function exportSTL(scene: THREE.Object3D, filename: string = 'model.stl'): void {
  const exporter = new STLExporter();
  const stlString = exporter.parse(scene, { binary: true });
  downloadBlob(toBlob(stlString), filename);
}

/**
 * Walk the scene and export each mesh tagged with userData.part as its own STL file.
 * Meshes with part === 'ignore' are skipped. Meshes without a part tag are exported
 * as part of a "combined" fallback file so nothing is ever silently lost.
 */
export function exportSeparateParts(scene: THREE.Object3D, baseName: string): void {
  const exporter = new STLExporter();
  const groups = new Map<string, THREE.Mesh[]>();
  const untagged: THREE.Mesh[] = [];

  scene.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    const part = (mesh.userData.part as PartTag | undefined) ?? undefined;
    if (part === 'ignore') return;
    if (part) {
      if (!groups.has(part)) groups.set(part, []);
      groups.get(part)!.push(mesh);
    } else {
      untagged.push(mesh);
    }
  });

  if (groups.size === 0 && untagged.length > 0) {
    // Nothing tagged; fall back to single export.
    exportSTL(scene, `${baseName}.stl`);
    return;
  }

  let delay = 0;
  const step = 400;

  for (const [part, meshes] of groups.entries()) {
    const partScene = new THREE.Scene();
    for (const m of meshes) {
      const clone = m.clone();
      clone.updateMatrixWorld(true);
      m.updateMatrixWorld(true);
      clone.matrix.copy(m.matrixWorld);
      clone.matrix.decompose(clone.position, clone.quaternion, clone.scale);
      partScene.add(clone);
    }
    const stlString = exporter.parse(partScene, { binary: true });
    const blob = toBlob(stlString);
    setTimeout(() => downloadBlob(blob, `${baseName}-${part}.stl`), delay);
    delay += step;
  }

  if (untagged.length > 0) {
    const partScene = new THREE.Scene();
    for (const m of untagged) partScene.add(m.clone());
    const stlString = exporter.parse(partScene, { binary: true });
    const blob = toBlob(stlString);
    setTimeout(() => downloadBlob(blob, `${baseName}-other.stl`), delay);
  }
}

function toBlob(stlString: string | ArrayBuffer | DataView): Blob {
  return new Blob([stlString as BlobPart], { type: 'application/octet-stream' });
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
