import * as THREE from 'three';
import { SVGLoader } from 'three-stdlib';

/**
 * Real Spotify scannables fetched directly from `scannables.scdn.co`.
 * The endpoint serves a CORS-enabled SVG containing 23 rectangular bars
 * plus the Spotify logo. We parse it with SVGLoader and extrude the
 * vector shapes directly — no rasterization — so bars stay crisp and
 * the logo stays perfectly circular at any plate size.
 *
 * The generator returns two separate geometries (`bars` and `logo`)
 * that share a common centroid/scale so they align when rendered as
 * independent meshes. This lets the UI give them different colors and
 * export them as separate STL parts.
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

export interface SpotifyGeometries {
  bars: THREE.BufferGeometry;
  logo: THREE.BufferGeometry;
}

interface ShapeInfo {
  shape: THREE.Shape;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function computeShapeBounds(shape: THREE.Shape): Omit<ShapeInfo, 'shape'> {
  const pts = shape.extractPoints(24).shape;
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
 * Build 3D geometries from a Spotify scannable SVG.
 *
 * Returns `{ bars, logo }` — two independent `BufferGeometry`s that
 * share a common centroid and scale so they can be rendered as
 * separate meshes and still align within the plate.
 *
 * Both geometries span `[0, contentHeight]` in Z for embossed mode
 * and `[-contentHeight, 0]` for engraved mode, matching the convention
 * used by `createImageSilhouetteGeometry`. The caller positions them
 * with `contentZ()` from GeneratedModel.
 */
export function createSpotifyGeometryFromSvg(
  svgText: string,
  plateWidth: number,
  plateHeight: number,
  borderWidth: number,
  contentHeight: number,
  showLogo: boolean,
  embossed: boolean,
): SpotifyGeometries {
  const empty = (): SpotifyGeometries => ({
    bars: new THREE.BufferGeometry(),
    logo: new THREE.BufferGeometry(),
  });

  const loader = new SVGLoader();
  const svgData = loader.parse(svgText);

  // Gather foreground shapes, skipping the pure-black background rect.
  const infos: ShapeInfo[] = [];
  for (const path of svgData.paths) {
    const hex = path.color.getHex();
    if (hex === 0x000000) continue;

    const shapes = SVGLoader.createShapes(path);
    for (const shape of shapes) {
      infos.push({ shape, ...computeShapeBounds(shape) });
    }
  }

  if (infos.length === 0) return empty();

  // Overall foreground bounds (logo + bars).
  let fgMinX = Infinity;
  let fgMaxX = -Infinity;
  for (const s of infos) {
    if (s.minX < fgMinX) fgMinX = s.minX;
    if (s.maxX > fgMaxX) fgMaxX = s.maxX;
  }
  const fgW = fgMaxX - fgMinX;

  // Split shapes into logo (leftmost ~22% by centroid) vs bars.
  const logoBand = fgMinX + fgW * 0.22;
  const logoShapes: ShapeInfo[] = [];
  const barShapes: ShapeInfo[] = [];
  for (const s of infos) {
    const cx = (s.minX + s.maxX) / 2;
    if (cx <= logoBand) logoShapes.push(s);
    else barShapes.push(s);
  }

  // The shapes we actually render (used for the shared plate-fit bounds).
  const kept: ShapeInfo[] = showLogo ? infos : barShapes;
  if (kept.length === 0) return empty();

  // Compute bounds of the kept set so bars and logo share the same
  // centroid and fit-to-plate scale.
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

  const availW = plateWidth - borderWidth * 2;
  const availH = plateHeight - borderWidth * 2;
  const scale = Math.min(availW / keptW, availH / keptH);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: contentHeight,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 48,
  };

  // Transform a group of shapes using the shared keptCx/Cy/scale so the
  // logo and bars remain perfectly aligned inside the plate.
  function extrudeGroup(group: ShapeInfo[]): THREE.BufferGeometry {
    if (group.length === 0) return new THREE.BufferGeometry();

    const parts: THREE.BufferGeometry[] = [];
    for (const s of group) {
      parts.push(new THREE.ExtrudeGeometry(s.shape, extrudeSettings));
    }
    const merged = mergeGeometries(parts);

    // Shared normalization: SVG y-down → three y-up, center on kept
    // centroid, then fit to plate.
    merged.translate(-keptCx, -keptCy, 0);
    merged.scale(1, -1, 1);
    merged.scale(scale, scale, 1);

    // ExtrudeGeometry spans [0, contentHeight] in Z. For engraved mode
    // flip it below the XY plane so contentZ() from GeneratedModel
    // positions it carving into the base.
    if (!embossed) {
      merged.translate(0, 0, -contentHeight);
    }

    merged.computeVertexNormals();
    return merged;
  }

  return {
    bars: extrudeGroup(barShapes),
    logo: showLogo ? extrudeGroup(logoShapes) : new THREE.BufferGeometry(),
  };
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
  return merged;
}
