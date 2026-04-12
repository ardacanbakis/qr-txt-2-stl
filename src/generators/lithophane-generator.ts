import * as THREE from 'three';
import type { PixelGrid } from './image-generator';

/**
 * Build a lithophane heightmap geometry.
 *
 * Pixel brightness maps to thickness: darker = thicker (opaque areas block more light).
 * The mesh is a single closed volume with:
 *  - a flat back plate at z = 0
 *  - a top surface whose z varies with the sampled pixel brightness
 */
export function createLithophaneGeometry(
  pixels: PixelGrid,
  width: number,
  height: number,
  minThickness: number,
  maxThickness: number,
  invert: boolean,
): THREE.BufferGeometry {
  const cols = pixels.width;
  const rows = pixels.height;

  const imgAspect = cols / rows;
  const plateAspect = width / height;

  let w = width;
  let h = height;
  if (imgAspect > plateAspect) {
    h = width / imgAspect;
  } else {
    w = height * imgAspect;
  }

  const dx = w / (cols - 1);
  const dy = h / (rows - 1);
  const offX = -w / 2;
  const offY = -h / 2;

  const thicknessRange = maxThickness - minThickness;

  // Sample brightness -> height function.
  const sample = (x: number, y: number) => {
    const xi = Math.min(cols - 1, Math.max(0, x));
    const yi = Math.min(rows - 1, Math.max(0, y));
    const v = pixels.data[yi * cols + xi];
    // Darker pixels (low v) should produce thicker material for lithophanes.
    const inverted = invert ? v : 1 - v;
    return minThickness + inverted * thicknessRange;
  };

  const positions: number[] = [];
  const indices: number[] = [];

  // Top vertices
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = offX + x * dx;
      // Image Y is top-down; flip for world Y
      const py = -offY - y * dy;
      const pz = sample(x, y);
      positions.push(px, py, pz);
    }
  }

  // Bottom vertices at z = 0 (same count, same x/y)
  const bottomStart = cols * rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = offX + x * dx;
      const py = -offY - y * dy;
      positions.push(px, py, 0);
    }
  }

  // Top surface triangles
  const idxTop = (x: number, y: number) => y * cols + x;
  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols - 1; x++) {
      const a = idxTop(x, y);
      const b = idxTop(x + 1, y);
      const c = idxTop(x + 1, y + 1);
      const d = idxTop(x, y + 1);
      indices.push(a, d, c, a, c, b);
    }
  }

  // Bottom surface triangles (reversed winding so normals point down)
  const idxBot = (x: number, y: number) => bottomStart + y * cols + x;
  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols - 1; x++) {
      const a = idxBot(x, y);
      const b = idxBot(x + 1, y);
      const c = idxBot(x + 1, y + 1);
      const d = idxBot(x, y + 1);
      indices.push(a, b, c, a, c, d);
    }
  }

  // Side walls around the perimeter
  const sideQuad = (t0: number, t1: number, b0: number, b1: number) => {
    indices.push(t0, b0, b1, t0, b1, t1);
  };

  // Top edge (y=0)
  for (let x = 0; x < cols - 1; x++) {
    sideQuad(idxTop(x, 0), idxTop(x + 1, 0), idxBot(x, 0), idxBot(x + 1, 0));
  }
  // Bottom edge (y=rows-1)
  for (let x = 0; x < cols - 1; x++) {
    sideQuad(idxTop(x + 1, rows - 1), idxTop(x, rows - 1), idxBot(x + 1, rows - 1), idxBot(x, rows - 1));
  }
  // Left edge (x=0)
  for (let y = 0; y < rows - 1; y++) {
    sideQuad(idxTop(0, y + 1), idxTop(0, y), idxBot(0, y + 1), idxBot(0, y));
  }
  // Right edge (x=cols-1)
  for (let y = 0; y < rows - 1; y++) {
    sideQuad(idxTop(cols - 1, y), idxTop(cols - 1, y + 1), idxBot(cols - 1, y), idxBot(cols - 1, y + 1));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
