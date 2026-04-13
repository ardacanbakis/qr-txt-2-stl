import * as THREE from 'three';
import { SVGLoader } from 'three-stdlib';

/**
 * Real Spotify scannables, fetched directly from `scannables.scdn.co`.
 * The endpoint returns a CORS-enabled SVG containing 23 bars + the Spotify
 * logo. We parse it with SVGLoader, extrude the shapes, and optionally hide
 * the logo (detected as the leftmost cluster of shapes).
 */

const SCANNABLES_ENDPOINT = 'https://scannables.scdn.co/uri/plain/svg';

/**
 * Parse any Spotify input (URL, URI, or ID) into a canonical `spotify:type:id`.
 * Accepts:
 *   - spotify:track:4uLU6hMCjMI75M1A2tKUQC
 *   - https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=...
 *   - https://open.spotify.com/intl-en/album/4uLU6hMCjMI75M1A2tKUQC
 */
export function parseSpotifyUri(input: string): string | null {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;

  if (/^spotify:[a-z]+:[a-zA-Z0-9]+$/.test(trimmed)) return trimmed;

  const m = trimmed.match(
    /spotify\.com\/(?:intl-[a-z-]+\/)?([a-z]+)\/([a-zA-Z0-9]+)/i,
  );
  if (m) return `spotify:${m[1].toLowerCase()}:${m[2]}`;

  return null;
}

/**
 * Fetch the Spotify scannable SVG. `scannables.scdn.co` serves
 * `Access-Control-Allow-Origin: *` so the direct fetch works in-browser.
 */
export async function fetchSpotifySvg(uri: string): Promise<string> {
  const url = `${SCANNABLES_ENDPOINT}/000000/white/640/${encodeURIComponent(uri)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Spotify scannable fetch failed (${response.status})`);
  }
  return response.text();
}

interface ShapeInfo {
  shape: THREE.Shape;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function computeShapeBounds(shape: THREE.Shape): Omit<ShapeInfo, 'shape'> {
  const pts = shape.extractPoints(12).shape;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, maxX, minY, maxY };
}

/**
 * Build a 3D geometry from a Spotify scannable SVG.
 *
 * The merged geometry is centered at the origin and spans
 * `[-contentHeight/2, +contentHeight/2]` in Z, matching the convention
 * used by the other content generators (so the caller can position it
 * with `contentZ()` directly).
 */
export function createSpotifyGeometryFromSvg(
  svgText: string,
  plateWidth: number,
  plateHeight: number,
  borderWidth: number,
  contentHeight: number,
  showLogo: boolean,
): THREE.BufferGeometry {
  const loader = new SVGLoader();
  const svgData = loader.parse(svgText);

  // Gather shapes, skipping the black background fill.
  const infos: ShapeInfo[] = [];
  for (const path of svgData.paths) {
    const hex = path.color.getHex();
    // Background rect is pure black (#000000). Keep only the foreground (white).
    if (hex === 0x000000) continue;

    const shapes = SVGLoader.createShapes(path);
    for (const shape of shapes) {
      infos.push({ shape, ...computeShapeBounds(shape) });
    }
  }

  if (infos.length === 0) return new THREE.BufferGeometry();

  // Compute overall foreground bounds.
  let fgMinX = Infinity;
  let fgMaxX = -Infinity;
  let fgMinY = Infinity;
  let fgMaxY = -Infinity;
  for (const s of infos) {
    if (s.minX < fgMinX) fgMinX = s.minX;
    if (s.maxX > fgMaxX) fgMaxX = s.maxX;
    if (s.minY < fgMinY) fgMinY = s.minY;
    if (s.maxY > fgMaxY) fgMaxY = s.maxY;
  }
  const fgW = fgMaxX - fgMinX;

  // Drop logo: Spotify scannables place the logo in the leftmost ~20%.
  // Any shape whose center-x falls inside that band is treated as logo.
  let kept = infos;
  if (!showLogo) {
    const logoBand = fgMinX + fgW * 0.22;
    kept = infos.filter((s) => (s.minX + s.maxX) / 2 > logoBand);
  }

  if (kept.length === 0) return new THREE.BufferGeometry();

  // Extrude each shape.
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: contentHeight,
    bevelEnabled: false,
    steps: 1,
  };
  const extruded: THREE.BufferGeometry[] = [];
  for (const s of kept) {
    extruded.push(new THREE.ExtrudeGeometry(s.shape, extrudeSettings));
  }

  const merged = mergeGeometries(extruded);

  // Recompute kept bounds (may exclude the logo region).
  let kMinX = Infinity;
  let kMaxX = -Infinity;
  let kMinY = Infinity;
  let kMaxY = -Infinity;
  for (const s of kept) {
    if (s.minX < kMinX) kMinX = s.minX;
    if (s.maxX > kMaxX) kMaxX = s.maxX;
    if (s.minY < kMinY) kMinY = s.minY;
    if (s.maxY > kMaxY) kMaxY = s.maxY;
  }
  const keptW = Math.max(kMaxX - kMinX, 0.001);
  const keptH = Math.max(kMaxY - kMinY, 0.001);
  const keptCx = (kMinX + kMaxX) / 2;
  const keptCy = (kMinY + kMaxY) / 2;

  // Normalize: center in XY, flip Y (SVG is y-down, three is y-up).
  merged.translate(-keptCx, -keptCy, 0);
  merged.scale(1, -1, 1);

  // Fit to plate while preserving aspect ratio.
  const availW = plateWidth - borderWidth * 2;
  const availH = plateHeight - borderWidth * 2;
  const scale = Math.min(availW / keptW, availH / keptH);
  merged.scale(scale, scale, 1);

  // Center Z span around 0 to match the other generators' convention.
  merged.translate(0, 0, -contentHeight / 2);

  return merged;
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
  if (normals.length) {
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  }
  merged.setIndex(indices);
  if (!normals.length) merged.computeVertexNormals();
  return merged;
}
