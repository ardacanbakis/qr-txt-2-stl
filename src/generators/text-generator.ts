import * as THREE from 'three';
import { TextGeometry } from 'three-stdlib';
import type { Font } from 'three-stdlib';
import type { FontStyle, TextAlignment } from '../types/model';

export interface BuildTextGeometryOptions {
  text: string;
  font: Font;
  size: number;
  depth: number;
  letterSpacing?: number;
}

/**
 * Build a TextGeometry for the given text and center it on the origin.
 * Also applies a simple italic shear when requested.
 */
export function buildTextGeometry(
  opts: BuildTextGeometryOptions,
  italic = false,
): THREE.BufferGeometry {
  const { text, font, size, depth, letterSpacing = 0 } = opts;

  const safeText = text.length > 0 ? text : ' ';

  // Build per-character geometries so we can apply letter spacing.
  const partGeometries: THREE.BufferGeometry[] = [];
  let cursorX = 0;

  for (const ch of safeText) {
    if (ch === ' ') {
      cursorX += size * 0.4 + letterSpacing;
      continue;
    }
    if (ch === '\n') {
      continue;
    }
    const geo = new TextGeometry(ch, {
      font,
      size,
      // three-stdlib TextGeometry uses `height` for extrusion depth
      height: depth,
      curveSegments: 6,
      bevelEnabled: false,
    } as unknown as ConstructorParameters<typeof TextGeometry>[1]);
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const width = bb.max.x - bb.min.x;
    // Position character at cursor, offset by -minX so left edge aligns.
    geo.translate(cursorX - bb.min.x, 0, 0);
    cursorX += width + letterSpacing + size * 0.08;
    partGeometries.push(geo);
  }

  if (partGeometries.length === 0) {
    return new THREE.BufferGeometry();
  }

  const merged = mergeBufferGeometries(partGeometries);
  merged.computeBoundingBox();
  const bb = merged.boundingBox!;
  const cx = (bb.max.x + bb.min.x) / 2;
  const cy = (bb.max.y + bb.min.y) / 2;
  merged.translate(-cx, -cy, 0);

  if (italic) {
    // Apply shear along X for italic look (Three.js TextGeometry has no italic variant).
    const shear = 0.18;
    const m = new THREE.Matrix4().set(
      1, shear, 0, 0,
      0, 1,     0, 0,
      0, 0,     1, 0,
      0, 0,     0, 1,
    );
    merged.applyMatrix4(m);
  }

  for (const g of partGeometries) g.dispose();

  return merged;
}

/**
 * Scale the text geometry horizontally to fit within maxWidth.
 */
export function fitTextToWidth(
  geometry: THREE.BufferGeometry,
  maxWidth: number,
  alignment: TextAlignment = 'center',
): THREE.BufferGeometry {
  geometry.computeBoundingBox();
  if (!geometry.boundingBox) return geometry;
  const bb = geometry.boundingBox;
  const width = bb.max.x - bb.min.x;
  if (width <= 0) return geometry;

  if (width > maxWidth) {
    const s = maxWidth / width;
    geometry.scale(s, s, 1);
  }

  geometry.computeBoundingBox();
  if (!geometry.boundingBox) return geometry;
  const bb2 = geometry.boundingBox;
  const w2 = bb2.max.x - bb2.min.x;

  if (alignment === 'left') {
    geometry.translate(-maxWidth / 2 - bb2.min.x, 0, 0);
  } else if (alignment === 'right') {
    geometry.translate(maxWidth / 2 - bb2.max.x, 0, 0);
  } else {
    // center: already centered by buildTextGeometry
    geometry.translate(-(bb2.min.x + w2 / 2), 0, 0);
  }

  return geometry;
}

/**
 * Map a FontStyle to the font URL we want to load for it.
 * Italic variants reuse the regular/bold font and apply a shear at geometry time.
 */
export function fontUrlForStyle(style: FontStyle, basePath = ''): string {
  const bold = style === 'bold' || style === 'bold-italic';
  return `${basePath}fonts/${bold ? 'helvetiker_bold' : 'helvetiker_regular'}.typeface.json`;
}

export function isItalic(style: FontStyle): boolean {
  return style === 'italic' || style === 'bold-italic';
}

/**
 * Minimal geometry merge utility that works with indexed and non-indexed geometries.
 */
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const result = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let indexOffset = 0;

  for (const geo of geometries) {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    if (!pos || !norm) continue;

    for (let i = 0; i < pos.count * 3; i++) {
      positions.push(pos.array[i] as number);
      normals.push(norm.array[i] as number);
    }

    if (geo.index) {
      const idx = geo.index.array;
      for (let i = 0; i < idx.length; i++) {
        indices.push((idx[i] as number) + indexOffset);
      }
    } else {
      for (let i = 0; i < pos.count; i++) {
        indices.push(i + indexOffset);
      }
    }
    indexOffset += pos.count;
  }

  result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  result.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  result.setIndex(indices);
  return result;
}
