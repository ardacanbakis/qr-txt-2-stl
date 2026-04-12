import * as THREE from 'three';

export interface PixelGrid {
  width: number;
  height: number;
  /** Grayscale brightness 0..1 per pixel (row-major, top-left origin). */
  data: Float32Array;
}

/**
 * Load an image (raster or SVG via data URL) and sample it into a grayscale grid.
 */
export async function loadImagePixels(dataUrl: string, maxResolution: number): Promise<PixelGrid> {
  const img = await loadImage(dataUrl);
  const aspect = img.width / img.height;

  let w = maxResolution;
  let h = maxResolution;
  if (aspect > 1) h = Math.round(maxResolution / aspect);
  else w = Math.round(maxResolution * aspect);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);

  const data = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = imgData.data[i * 4];
    const g = imgData.data[i * 4 + 1];
    const b = imgData.data[i * 4 + 2];
    const a = imgData.data[i * 4 + 3] / 255;
    // Pre-multiply alpha so transparent pixels are treated as white background.
    const gray = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    data[i] = gray * a + (1 - a);
  }

  return { width: w, height: h, data };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Create a pixelated extruded geometry (silhouette) from a grayscale pixel grid.
 * Pixels below (or above when inverted) the threshold become boxes extruded to contentHeight.
 */
export function createImageSilhouetteGeometry(
  pixels: PixelGrid,
  plateWidth: number,
  plateHeight: number,
  borderWidth: number,
  contentHeight: number,
  threshold: number,
  invert: boolean,
  embossed: boolean,
): THREE.BufferGeometry {
  const availableWidth = plateWidth - borderWidth * 2;
  const availableHeight = plateHeight - borderWidth * 2;
  const imgAspect = pixels.width / pixels.height;
  const plateAspect = availableWidth / availableHeight;

  let drawW = availableWidth;
  let drawH = availableHeight;
  if (imgAspect > plateAspect) {
    drawH = availableWidth / imgAspect;
  } else {
    drawW = availableHeight * imgAspect;
  }

  const px = drawW / pixels.width;
  const py = drawH / pixels.height;
  const z = embossed ? contentHeight / 2 : -contentHeight / 2;
  const t = threshold / 255;

  const offsetX = -drawW / 2;
  const offsetY = -drawH / 2;

  // Build a boolean occupancy grid, then merge runs horizontally into strips for efficiency.
  const occ: boolean[][] = [];
  for (let y = 0; y < pixels.height; y++) {
    occ[y] = [];
    for (let x = 0; x < pixels.width; x++) {
      const v = pixels.data[y * pixels.width + x];
      const dark = v < t;
      occ[y][x] = invert ? !dark : dark;
    }
  }

  const geometries: THREE.BufferGeometry[] = [];
  for (let y = 0; y < pixels.height; y++) {
    let runStart = -1;
    for (let x = 0; x <= pixels.width; x++) {
      const on = x < pixels.width && occ[y][x];
      if (on && runStart === -1) runStart = x;
      if (!on && runStart !== -1) {
        const runLen = x - runStart;
        const box = new THREE.BoxGeometry(runLen * px, py, contentHeight);
        const cx = offsetX + (runStart + runLen / 2) * px;
        const cy = offsetY + (pixels.height - 1 - y) * py + py / 2;
        box.translate(cx, cy, z);
        geometries.push(box);
        runStart = -1;
      }
    }
  }

  return mergeGeometries(geometries);
}

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();
  if (geometries.length === 0) return merged;

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let offset = 0;

  for (const g of geometries) {
    const pos = g.attributes.position;
    const norm = g.attributes.normal;
    const idx = g.index!;
    for (let i = 0; i < pos.count * 3; i++) {
      positions.push(pos.array[i] as number);
      normals.push(norm.array[i] as number);
    }
    for (let i = 0; i < idx.count; i++) {
      indices.push((idx.array[i] as number) + offset);
    }
    offset += pos.count;
    g.dispose();
  }

  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setIndex(indices);
  return merged;
}
