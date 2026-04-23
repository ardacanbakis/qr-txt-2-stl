import * as THREE from 'three';
import type { MapConfig } from '../types/model';

export interface MapGeometries {
  streets: THREE.BufferGeometry;
  buildings: THREE.BufferGeometry;
  terrain: THREE.BufferGeometry;
}

// ── Overpass API types ──────────────────────────────────────────────

interface OverpassNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
}

interface OverpassWay {
  type: 'way';
  id: number;
  nodes: number[];
  tags?: Record<string, string>;
}

interface OverpassRelation {
  type: 'relation';
  id: number;
  members: Array<{ type: string; ref: number; role: string }>;
  tags?: Record<string, string>;
}

type OverpassElement = OverpassNode | OverpassWay | OverpassRelation;

interface OverpassResponse {
  elements: OverpassElement[];
}

// ── Bounding-box helpers ────────────────────────────────────────────

/**
 * Convert a center lat/lng + radius in meters to an Overpass-style
 * south,west,north,east bounding box string.
 */
function computeBBox(lat: number, lng: number, radius: number): string {
  const latDelta = radius / 111320;
  const lngDelta = radius / (111320 * Math.cos(lat * Math.PI / 180));

  const south = lat - latDelta;
  const north = lat + latDelta;
  const west = lng - lngDelta;
  const east = lng + lngDelta;

  return `${south},${west},${north},${east}`;
}

// ── Coordinate conversion ───────────────────────────────────────────

/**
 * Convert a WGS-84 lat/lng pair to local meters using simple
 * equirectangular projection centered on (centerLat, centerLng).
 *
 *   dx = (lng - centerLng) * cos(centerLat * PI/180) * 111320
 *   dy = (lat - centerLat) * 111320
 */
function latLngToLocal(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
): { x: number; y: number } {
  const dx = (lng - centerLng) * Math.cos(centerLat * Math.PI / 180) * 111320;
  const dy = (lat - centerLat) * 111320;
  return { x: dx, y: dy };
}

// ── Overpass fetch ──────────────────────────────────────────────────

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

async function fetchOsmData(
  config: MapConfig,
  signal?: AbortSignal,
): Promise<OverpassResponse> {
  const bbox = computeBBox(config.lat, config.lng, config.radius);

  const query = `
[out:json][timeout:60];
(
  way["highway"](${bbox});
  way["building"](${bbox});
  relation["building"](${bbox});
);
out body;
>;
out skel qt;
`.trim();

  const response = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
    signal,
  });

  if (!response.ok) {
    throw new Error(`Overpass API request failed (${response.status})`);
  }

  return response.json() as Promise<OverpassResponse>;
}

// ── Geometry construction helpers ───────────────────────────────────

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
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setIndex(indices);
  return merged;
}

/**
 * Build a ribbon (flat extruded strip) for a single road segment between
 * two 2D points, with the given width and height in Z.
 */
function createRibbonSegment(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  halfWidth: number,
  height: number,
  zBase: number,
): THREE.BufferGeometry {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-8) return new THREE.BufferGeometry();

  const box = new THREE.BoxGeometry(len, halfWidth * 2, height);

  // Rotate to align with segment direction
  const angle = Math.atan2(dy, dx);
  box.rotateZ(angle);

  // Translate to midpoint
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  box.translate(mx, my, zBase + height / 2);

  return box;
}

// ── Street geometry builder ─────────────────────────────────────────

function clampCoord(
  x: number,
  y: number,
  halfW: number,
  halfH: number,
): { x: number; y: number } {
  return {
    x: Math.max(-halfW, Math.min(halfW, x)),
    y: Math.max(-halfH, Math.min(halfH, y)),
  };
}

function isOutsideBounds(x: number, y: number, halfW: number, halfH: number): boolean {
  return Math.abs(x) > halfW + 1 && Math.abs(y) > halfH + 1;
}

function buildStreetGeometries(
  ways: OverpassWay[],
  nodeMap: Map<number, OverpassNode>,
  config: MapConfig,
  scaleFactor: number,
  zBase: number,
  streetHeight: number,
  halfW: number,
  halfH: number,
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const halfWidth = config.streetWidth / 2;

  for (const way of ways) {
    const coords: Array<{ x: number; y: number }> = [];
    for (const nid of way.nodes) {
      const node = nodeMap.get(nid);
      if (!node) continue;
      const local = latLngToLocal(node.lat, node.lon, config.lat, config.lng);
      const scaled = { x: local.x * scaleFactor, y: local.y * scaleFactor };
      coords.push(clampCoord(scaled.x, scaled.y, halfW, halfH));
    }

    for (let i = 0; i < coords.length - 1; i++) {
      if (isOutsideBounds(coords[i].x, coords[i].y, halfW, halfH) &&
          isOutsideBounds(coords[i + 1].x, coords[i + 1].y, halfW, halfH)) continue;
      const seg = createRibbonSegment(
        coords[i].x,
        coords[i].y,
        coords[i + 1].x,
        coords[i + 1].y,
        halfWidth,
        streetHeight,
        zBase,
      );
      if (seg.attributes.position) {
        parts.push(seg);
      }
    }
  }

  return mergeGeometries(parts);
}

// ── Building geometry builder ───────────────────────────────────────

function buildBuildingGeometries(
  ways: OverpassWay[],
  nodeMap: Map<number, OverpassNode>,
  config: MapConfig,
  scaleFactor: number,
  zBase: number,
  contentHeight: number,
  halfW: number,
  halfH: number,
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  for (const way of ways) {
    const points: THREE.Vector2[] = [];
    for (const nid of way.nodes) {
      const node = nodeMap.get(nid);
      if (!node) continue;
      const local = latLngToLocal(node.lat, node.lon, config.lat, config.lng);
      const clamped = clampCoord(local.x * scaleFactor, local.y * scaleFactor, halfW, halfH);
      points.push(new THREE.Vector2(clamped.x, clamped.y));
    }

    // Need at least 3 unique vertices for a polygon
    if (points.length < 3) continue;

    // Close the polygon if not already closed
    const first = points[0];
    const last = points[points.length - 1];
    if (Math.abs(first.x - last.x) < 1e-6 && Math.abs(first.y - last.y) < 1e-6) {
      points.pop();
    }
    if (points.length < 3) continue;

    // Determine building extrusion height
    let bHeight = config.buildingHeight;
    if (way.tags?.['building:levels']) {
      const levels = parseInt(way.tags['building:levels'], 10);
      if (!isNaN(levels) && levels > 0) {
        bHeight = levels * config.buildingHeight * 0.5;
      }
    }

    // Scale to look proportional on the plate
    const extrudeHeight = Math.min(bHeight, contentHeight);

    try {
      const shape = new THREE.Shape(points);
      const extruded = new THREE.ExtrudeGeometry(shape, {
        depth: extrudeHeight,
        bevelEnabled: false,
        steps: 1,
      });
      extruded.translate(0, 0, zBase);
      parts.push(extruded);
    } catch {
      // Skip degenerate polygons that THREE.Shape cannot handle
      continue;
    }
  }

  return mergeGeometries(parts);
}

// ── Main entry point ────────────────────────────────────────────────

function emptyGeometries(): MapGeometries {
  return {
    streets: new THREE.BufferGeometry(),
    buildings: new THREE.BufferGeometry(),
    terrain: new THREE.BufferGeometry(),
  };
}

/**
 * Fetch OpenStreetMap data via the Overpass API and build 3D geometry
 * for streets, buildings, and terrain within the configured radius of
 * the given lat/lng center point.
 *
 * @param config      Map configuration (center, radius, mode, styling)
 * @param plateWidth  Total plate width in mm
 * @param plateHeight Total plate height in mm
 * @param borderWidth Border inset in mm
 * @param contentHeight Extrusion height in mm
 * @param embossed    true → geometry at z=0 upward; false → z=-contentHeight upward
 * @param signal      Optional AbortSignal for cancellation
 */
export async function fetchAndBuildMap(
  config: MapConfig,
  plateWidth: number,
  plateHeight: number,
  borderWidth: number,
  contentHeight: number,
  embossed: boolean,
  signal?: AbortSignal,
): Promise<MapGeometries> {
  let data: OverpassResponse;
  try {
    data = await fetchOsmData(config, signal);
  } catch {
    // Network error or abort — return empty geometries gracefully
    return emptyGeometries();
  }

  // Build a lookup map from node ID → node
  const nodeMap = new Map<number, OverpassNode>();
  const highwayWays: OverpassWay[] = [];
  const buildingWays: OverpassWay[] = [];

  for (const el of data.elements) {
    if (el.type === 'node') {
      nodeMap.set(el.id, el);
    } else if (el.type === 'way') {
      if (el.tags?.['highway']) {
        highwayWays.push(el);
      }
      if (el.tags?.['building']) {
        buildingWays.push(el);
      }
    }
  }

  // Compute scale factor: map the radius extent (in meters) to fit
  // within the available plate area. Use separate axis extents since
  // the Overpass bbox is rectangular in lat/lng space.
  const availableWidth = plateWidth - borderWidth * 2;
  const availableHeight = plateHeight - borderWidth * 2;
  const mapExtent = config.radius * 2; // diameter in meters
  const scaleFactor = Math.min(availableWidth, availableHeight) / mapExtent;
  const halfW = availableWidth / 2;
  const halfH = availableHeight / 2;

  // Z positioning: embossed starts at z=0, engraved at z=-contentHeight
  const zBase = embossed ? 0 : -contentHeight;
  const streetHeight = config.mode === 'streets-only' ? contentHeight : contentHeight * 0.3;

  // Build geometries based on the selected mode
  let streets = new THREE.BufferGeometry();
  let buildings = new THREE.BufferGeometry();

  if (config.mode === 'streets' || config.mode === 'streets-only' || config.mode === 'combined') {
    streets = buildStreetGeometries(
      highwayWays,
      nodeMap,
      config,
      scaleFactor,
      zBase,
      streetHeight,
      halfW,
      halfH,
    );
  }

  if (config.mode === 'streets' || config.mode === 'combined') {
    buildings = buildBuildingGeometries(
      buildingWays,
      nodeMap,
      config,
      scaleFactor,
      zBase,
      contentHeight,
      halfW,
      halfH,
    );
  }

  // Placeholder: terrain elevation geometry.
  // TODO: Integrate a terrain elevation API (e.g. Mapbox Terrain-RGB tiles
  // or open-elevation) to build a heightmap mesh. For now, return an empty
  // geometry. The `config.terrainExaggeration` parameter will scale the
  // Z-values of the terrain mesh once implemented.
  const terrain = new THREE.BufferGeometry();

  return { streets, buildings, terrain };
}
