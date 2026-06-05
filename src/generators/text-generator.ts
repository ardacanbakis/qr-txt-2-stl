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

/** Build a single line of text geometry, centered at origin. */
function buildSingleLineGeometry(
  opts: BuildTextGeometryOptions,
  italic: boolean,
): THREE.BufferGeometry {
  const { text, font, size, depth, letterSpacing = 0 } = opts;
  const safeText = text.length > 0 ? text : ' ';
  const partGeometries: THREE.BufferGeometry[] = [];
  let cursorX = 0;

  for (const ch of safeText) {
    if (ch === ' ') {
      cursorX += size * 0.4 + letterSpacing;
      continue;
    }
    const geo = new TextGeometry(ch, {
      font,
      size,
      height: depth,
      curveSegments: 6,
      bevelEnabled: false,
    } as unknown as ConstructorParameters<typeof TextGeometry>[1]);
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const width = bb.max.x - bb.min.x;
    geo.translate(cursorX - bb.min.x, 0, 0);
    cursorX += width + letterSpacing + size * 0.08;
    partGeometries.push(geo);
  }

  if (partGeometries.length === 0) return new THREE.BufferGeometry();

  const merged = mergeBufferGeometries(partGeometries);
  merged.computeBoundingBox();
  const bb = merged.boundingBox!;
  const cx = (bb.max.x + bb.min.x) / 2;
  const cy = (bb.max.y + bb.min.y) / 2;
  merged.translate(-cx, -cy, 0);

  if (italic) {
    const shear = 0.18;
    const m = new THREE.Matrix4().set(1, shear, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    merged.applyMatrix4(m);
  }

  for (const g of partGeometries) g.dispose();
  return merged;
}

/**
 * Build a TextGeometry for the given text and center it on the origin.
 * Supports multi-line text via `\n` when lineSpacing > 0.
 */
export function buildTextGeometry(
  opts: BuildTextGeometryOptions,
  italic = false,
  lineSpacing = 0,
): THREE.BufferGeometry {
  const lines = opts.text.split('\n');

  if (lines.length <= 1 || lineSpacing === 0) {
    // Single-line path (original behavior, skips \n)
    const singleOpts = { ...opts, text: opts.text.replace(/\n/g, ' ') };
    return buildSingleLineGeometry(singleOpts, italic);
  }

  // Multi-line: build each line, then stack them vertically
  const lineHeight = opts.size * lineSpacing;
  const totalHeight = lineHeight * (lines.length - 1);
  const lineGeos: THREE.BufferGeometry[] = [];

  lines.forEach((line, i) => {
    const lineOpts = { ...opts, text: line.trim() || ' ' };
    const geo = buildSingleLineGeometry(lineOpts, italic);
    // Stack: top line at +totalHeight/2, bottom at -totalHeight/2
    const y = totalHeight / 2 - i * lineHeight;
    geo.translate(0, y, 0);
    lineGeos.push(geo);
  });

  if (lineGeos.length === 0) return new THREE.BufferGeometry();

  const merged = mergeBufferGeometries(lineGeos);
  for (const g of lineGeos) g.dispose();
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
