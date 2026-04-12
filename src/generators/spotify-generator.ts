import * as THREE from 'three';

/**
 * Spotify scan codes consist of 23 vertical bars next to a circular logo area.
 * Each bar has one of 8 heights. Without access to the Spotify API we generate
 * a deterministic pattern from a hash of the input URL so that the preview
 * looks like a Spotify code and is consistent for a given URL.
 */

const NUM_BARS = 23;
const HEIGHT_LEVELS = 8;

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function generatePattern(url: string): number[] {
  const base = hashString(url || 'spotify');
  const bars: number[] = [];
  let state = base;
  for (let i = 0; i < NUM_BARS; i++) {
    state = (state * 1103515245 + 12345) >>> 0;
    bars.push((state % HEIGHT_LEVELS) + 1);
  }
  return bars;
}

export interface SpotifyGeometryResult {
  geometry: THREE.BufferGeometry;
  logoGeometry: THREE.BufferGeometry;
}

export function createSpotifyGeometry(
  url: string,
  plateWidth: number,
  plateHeight: number,
  borderWidth: number,
  contentHeight: number,
  embossed: boolean,
): SpotifyGeometryResult {
  const availableWidth = plateWidth - borderWidth * 2;
  const availableHeight = plateHeight - borderWidth * 2;

  // Layout: circular logo on the left, bars fill the rest.
  const logoRadius = Math.min(availableHeight * 0.35, availableWidth * 0.13);
  const logoCenterX = -availableWidth / 2 + logoRadius + 1;
  const barsAreaWidth = availableWidth - (logoRadius * 2) - 4;
  const barsStartX = logoCenterX + logoRadius + 2;

  const barSpacing = barsAreaWidth / NUM_BARS;
  const barWidth = barSpacing * 0.55;
  const maxBarHeight = availableHeight * 0.7;
  const minBarHeight = maxBarHeight * 0.2;

  const pattern = generatePattern(url);
  const z = embossed ? contentHeight / 2 : -contentHeight / 2;

  const geometries: THREE.BufferGeometry[] = [];

  for (let i = 0; i < NUM_BARS; i++) {
    const level = pattern[i];
    const h = minBarHeight + ((maxBarHeight - minBarHeight) * level) / HEIGHT_LEVELS;
    const box = new THREE.BoxGeometry(barWidth, h, contentHeight);
    const x = barsStartX + i * barSpacing + barSpacing / 2;
    box.translate(x, 0, z);
    geometries.push(box);
  }

  // Logo = simple ring: outer cylinder + hole pattern approximated with 4 smaller cylinders removed.
  // For a simple visual we use a disc.
  const disc = new THREE.CylinderGeometry(logoRadius, logoRadius, contentHeight, 48);
  disc.rotateX(Math.PI / 2);
  disc.translate(logoCenterX, 0, z);

  return {
    geometry: mergeGeometries(geometries),
    logoGeometry: disc,
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
