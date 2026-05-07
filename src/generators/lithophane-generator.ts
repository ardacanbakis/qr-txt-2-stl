import * as THREE from 'three';
import type { PixelGrid } from './image-generator';

/**
 * Build a lithophane heightmap geometry.
 *
 * Pixel brightness → thickness: darker = thicker (more opaque, blocks more backlight).
 * Produces a closed volume: flat back at z=0, varying front surface, side walls.
 * Vertex colors encode how lit each point appears when backlit (thin=white, thick=black)
 * for use with the backlit preview material.
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

  const sample = (x: number, y: number): number => {
    const xi = Math.min(cols - 1, Math.max(0, x));
    const yi = Math.min(rows - 1, Math.max(0, y));
    const v = pixels.data[yi * cols + xi];
    // Darker pixels → more material → brighter when backlit is OFF, darker when ON.
    // invert=false (default): dark image pixel → thick → opaque
    const mapped = invert ? v : 1 - v;
    return minThickness + mapped * thicknessRange;
  };

  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  // Top vertices (front face, varying Z)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = offX + x * dx;
      const py = -offY - y * dy; // Flip Y: image top → world top
      const pz = sample(x, y);
      positions.push(px, py, pz);
      // Backlit color: thin areas = bright (white light passes through), thick = dark
      const brightness = thicknessRange > 0 ? 1 - (pz - minThickness) / thicknessRange : 1;
      colors.push(brightness, brightness * 0.95, brightness * 0.88); // warm white tint
    }
  }

  // Bottom vertices (back face, flat at z=0)
  const bottomStart = cols * rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = offX + x * dx;
      const py = -offY - y * dy;
      positions.push(px, py, 0);
      // Back face is uniformly lit in backlit preview
      colors.push(0.92, 0.88, 0.80);
    }
  }

  const idxTop = (x: number, y: number) => y * cols + x;
  const idxBot = (x: number, y: number) => bottomStart + y * cols + x;

  // Top surface triangles
  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols - 1; x++) {
      const a = idxTop(x, y);
      const b = idxTop(x + 1, y);
      const c = idxTop(x + 1, y + 1);
      const d = idxTop(x, y + 1);
      indices.push(a, d, c, a, c, b);
    }
  }

  // Bottom surface (reversed winding so normals face down/back)
  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols - 1; x++) {
      const a = idxBot(x, y);
      const b = idxBot(x + 1, y);
      const c = idxBot(x + 1, y + 1);
      const d = idxBot(x, y + 1);
      indices.push(a, b, c, a, c, d);
    }
  }

  // Side walls
  const sideQuad = (t0: number, t1: number, b0: number, b1: number) => {
    indices.push(t0, b0, b1, t0, b1, t1);
  };

  for (let x = 0; x < cols - 1; x++) {
    sideQuad(idxTop(x, 0), idxTop(x + 1, 0), idxBot(x, 0), idxBot(x + 1, 0));
  }
  for (let x = 0; x < cols - 1; x++) {
    sideQuad(idxTop(x + 1, rows - 1), idxTop(x, rows - 1), idxBot(x + 1, rows - 1), idxBot(x, rows - 1));
  }
  for (let y = 0; y < rows - 1; y++) {
    sideQuad(idxTop(0, y + 1), idxTop(0, y), idxBot(0, y + 1), idxBot(0, y));
  }
  for (let y = 0; y < rows - 1; y++) {
    sideQuad(idxTop(cols - 1, y), idxTop(cols - 1, y + 1), idxBot(cols - 1, y), idxBot(cols - 1, y + 1));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
