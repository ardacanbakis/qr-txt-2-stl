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
 * Create a smooth extruded silhouette from a grayscale pixel grid using
 * marching squares contour tracing instead of blocky pixel boxes.
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
  const t = threshold / 255;
  const W = pixels.width;
  const H = pixels.height;

  // Build scalar field (1 = "on", 0 = "off") with 1-cell padding
  const padW = W + 2;
  const padH = H + 2;
  const field = new Float32Array(padW * padH);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = pixels.data[y * W + x];
      const dark = v < t;
      const on = invert ? !dark : dark;
      field[(y + 1) * padW + (x + 1)] = on ? 1 : 0;
    }
  }

  // Marching squares
  const contours = marchingSquares(field, padW, padH, 0.5);
  if (contours.length === 0) return new THREE.BufferGeometry();

  // Simplify contours
  const pxSize = 1; // field coords are 1 unit per pixel
  const epsilon = 0.3 * pxSize;
  const simplified = contours.map(c => rdpSimplify(c, epsilon)).filter(c => c.length >= 3);
  if (simplified.length === 0) return new THREE.BufferGeometry();

  // Convert field coords back to pixel-space (remove padding offset)
  const paths: [number, number][][] = simplified.map(c =>
    c.map(([x, y]) => [x - 1, y - 1] as [number, number])
  );

  // Fit to plate
  const availW = plateWidth - borderWidth * 2;
  const availH = plateHeight - borderWidth * 2;
  const imgAspect = W / H;
  const plateAspect = availW / availH;
  let drawW = availW;
  let drawH = availH;
  if (imgAspect > plateAspect) drawH = availW / imgAspect;
  else drawW = availH * imgAspect;

  const scaleX = drawW / W;
  const scaleY = drawH / H;

  // Convert to plate-centered coordinates (flip Y: pixel Y is top-down)
  const platePaths: [number, number][][] = paths.map(path =>
    path.map(([px, py]) => [
      px * scaleX - drawW / 2,
      (H - py) * scaleY - drawH / 2,
    ] as [number, number])
  );

  // Classify outer shapes vs holes
  const outers: { shape: THREE.Shape; points: [number, number][] }[] = [];
  const holes: { path: THREE.Path; points: [number, number][] }[] = [];

  for (const pts of platePaths) {
    const v2 = pts.map(p => new THREE.Vector2(p[0], p[1]));
    const cw = THREE.ShapeUtils.isClockWise(v2);
    // In our coordinate system, CW = hole, CCW = outer
    if (cw) {
      const path = new THREE.Path();
      path.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]);
      path.closePath();
      holes.push({ path, points: pts });
    } else {
      const shape = new THREE.Shape();
      shape.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
      shape.closePath();
      outers.push({ shape, points: pts });
    }
  }

  // Assign holes to their containing outer shape
  for (const hole of holes) {
    const hp = hole.points[0];
    let best: typeof outers[0] | null = null;
    let bestArea = Infinity;
    for (const outer of outers) {
      if (pointInPolygon(hp, outer.points)) {
        const area = Math.abs(polygonArea(outer.points));
        if (area < bestArea) { bestArea = area; best = outer; }
      }
    }
    if (best) best.shape.holes.push(hole.path);
  }

  // Extrude
  const z = embossed ? contentHeight / 2 : -contentHeight / 2;
  const geometries: THREE.BufferGeometry[] = [];
  for (const { shape } of outers) {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: contentHeight,
      bevelEnabled: false,
      curveSegments: 1,
    });
    geo.translate(0, 0, -contentHeight / 2);
    geo.translate(0, 0, z);
    geometries.push(geo);
  }

  return mergeGeometries(geometries);
}

// --- Marching squares ---

type Pt = [number, number];

const EDGE_TABLE: number[][] = [
  [],           // 0000
  [[3, 0]],    // 0001
  [[0, 1]],    // 0010
  [[3, 1]],    // 0011
  [[1, 2]],    // 0100
  [[3, 0], [1, 2]], // 0101 (saddle)
  [[0, 2]],    // 0110
  [[3, 2]],    // 0111
  [[2, 3]],    // 1000
  [[2, 0]],    // 1001
  [[0, 1], [2, 3]], // 1010 (saddle)
  [[2, 1]],    // 1011
  [[1, 3]],    // 1100
  [[1, 0]],    // 1101
  [[0, 3]],    // 1110
  [],           // 1111
];

function marchingSquares(field: Float32Array, w: number, h: number, iso: number): Pt[][] {
  // Build edge segments
  const segments: [Pt, Pt][] = [];

  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const tl = field[y * w + x];
      const tr = field[y * w + x + 1];
      const br = field[(y + 1) * w + x + 1];
      const bl = field[(y + 1) * w + x];

      let idx = 0;
      if (tl >= iso) idx |= 8;
      if (tr >= iso) idx |= 4;
      if (br >= iso) idx |= 2;
      if (bl >= iso) idx |= 1;

      const edges = EDGE_TABLE[idx];
      if (edges.length === 0) continue;

      // Interpolate edge positions
      const pts: Pt[] = [
        lerp2(x, y, x + 1, y, tl, tr, iso),         // edge 0: top
        lerp2(x + 1, y, x + 1, y + 1, tr, br, iso), // edge 1: right
        lerp2(x, y + 1, x + 1, y + 1, bl, br, iso), // edge 2: bottom
        lerp2(x, y, x, y + 1, tl, bl, iso),          // edge 3: left
      ];

      for (let i = 0; i < edges.length; i += 1) {
        const [a, b] = edges[i];
        segments.push([pts[a], pts[b]]);
      }
    }
  }

  // Chain segments into contour loops
  return chainSegments(segments);
}

function lerp2(x0: number, y0: number, x1: number, y1: number, v0: number, v1: number, iso: number): Pt {
  const t = Math.abs(v1 - v0) < 1e-10 ? 0.5 : (iso - v0) / (v1 - v0);
  return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)];
}

function chainSegments(segments: [Pt, Pt][]): Pt[][] {
  if (segments.length === 0) return [];

  const EPS = 1e-6;
  const key = (p: Pt) => `${(p[0] * 1e4) | 0},${(p[1] * 1e4) | 0}`;

  // Build adjacency: map from point-key to list of segment indices
  const adj = new Map<string, number[]>();
  for (let i = 0; i < segments.length; i++) {
    const k0 = key(segments[i][0]);
    const k1 = key(segments[i][1]);
    if (!adj.has(k0)) adj.set(k0, []);
    if (!adj.has(k1)) adj.set(k1, []);
    adj.get(k0)!.push(i);
    adj.get(k1)!.push(i);
  }

  const used = new Uint8Array(segments.length);
  const contours: Pt[][] = [];

  for (let si = 0; si < segments.length; si++) {
    if (used[si]) continue;
    used[si] = 1;

    const chain: Pt[] = [segments[si][0], segments[si][1]];

    // Extend forward
    let extended = true;
    while (extended) {
      extended = false;
      const tail = chain[chain.length - 1];
      const tk = key(tail);
      const neighbors = adj.get(tk);
      if (!neighbors) break;
      for (const ni of neighbors) {
        if (used[ni]) continue;
        const seg = segments[ni];
        const d0 = dist2(tail, seg[0]);
        const d1 = dist2(tail, seg[1]);
        if (d0 < EPS) {
          used[ni] = 1;
          chain.push(seg[1]);
          extended = true;
          break;
        } else if (d1 < EPS) {
          used[ni] = 1;
          chain.push(seg[0]);
          extended = true;
          break;
        }
      }
    }

    if (chain.length >= 3 && dist2(chain[0], chain[chain.length - 1]) < EPS) {
      chain.pop(); // close the loop
    }

    if (chain.length >= 3) contours.push(chain);
  }

  return contours;
}

function dist2(a: Pt, b: Pt): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

// --- Ramer-Douglas-Peucker simplification ---

function rdpSimplify(points: Pt[], epsilon: number): Pt[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], start, end);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }

  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIdx + 1), epsilon);
    const right = rdpSimplify(points.slice(maxIdx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [start, end];
}

function perpDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-12) return Math.sqrt(dist2(p, a));
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq;
  const cx = a[0] + t * dx;
  const cy = a[1] + t * dy;
  return Math.sqrt((p[0] - cx) ** 2 + (p[1] - cy) ** 2);
}

// --- Point-in-polygon ---

function pointInPolygon(pt: [number, number], polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function polygonArea(pts: [number, number][]): number {
  let area = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    area += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  }
  return area / 2;
}

// --- Geometry merge ---

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();
  if (geometries.length === 0) return merged;

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let offset = 0;

  for (const g of geometries) {
    g.computeVertexNormals();
    const pos = g.attributes.position;
    const norm = g.attributes.normal;
    const idx = g.index;
    for (let i = 0; i < pos.count * 3; i++) {
      positions.push(pos.array[i] as number);
      normals.push(norm ? (norm.array[i] as number) : 0);
    }
    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        indices.push((idx.array[i] as number) + offset);
      }
    } else {
      for (let i = 0; i < pos.count; i++) {
        indices.push(i + offset);
      }
    }
    offset += pos.count;
    g.dispose();
  }

  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setIndex(indices);
  return merged;
}
