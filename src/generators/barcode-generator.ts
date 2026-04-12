import * as THREE from 'three';
import type { BarcodeFormat } from '../types/model';

/**
 * CODE39 barcode encoder. Each character is represented by 9 elements:
 * 5 bars and 4 spaces. Three of the 9 are wide and six are narrow.
 * Encoding from Wikipedia: https://en.wikipedia.org/wiki/Code_39
 *
 * We emit a boolean array where true = bar, false = space.
 */

const CODE39: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn', '9': 'nnwwnnwnn',
  'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw', 'C': 'wnwnnwnnn', 'D': 'nnnnwwnnw',
  'E': 'wnnnwwnnn', 'F': 'nnwnwwnnn', 'G': 'nnnnnwwnw', 'H': 'wnnnnwwnn',
  'I': 'nnwnnwwnn', 'J': 'nnnnwwwnn', 'K': 'wnnnnnnww', 'L': 'nnwnnnnww',
  'M': 'wnwnnnnwn', 'N': 'nnnnwnnww', 'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn',
  'Q': 'nnnnnnwww', 'R': 'wnnnnnwwn', 'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn',
  'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw', 'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw',
  'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '$': 'nwnwnwnnn',
  '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn',
  '*': 'nwnnwnwnn',
};

export interface BarcodePattern {
  bars: boolean[]; // true = dark bar, false = space (sequence)
  widths: number[]; // narrow = 1, wide = 3 for each element
}

export function encodeBarcode(text: string, format: BarcodeFormat): BarcodePattern {
  if (format !== 'CODE39') {
    // Fall back to CODE39 with a sanitized string for unsupported formats.
    // A full CODE128/EAN13 encoder is out of scope for this pass.
    return encodeBarcode(text, 'CODE39');
  }

  const upper = text.toUpperCase().replace(/[^0-9A-Z\-. $/+%]/g, '');
  const sequence = `*${upper}*`;

  const bars: boolean[] = [];
  const widths: number[] = [];

  for (let i = 0; i < sequence.length; i++) {
    const ch = sequence[i];
    const enc = CODE39[ch] ?? CODE39['-'];
    for (let j = 0; j < 9; j++) {
      const wide = enc[j] === 'w';
      bars.push(j % 2 === 0); // even indices are bars, odd are spaces
      widths.push(wide ? 3 : 1);
    }
    if (i < sequence.length - 1) {
      // Inter-character gap (narrow space)
      bars.push(false);
      widths.push(1);
    }
  }

  return { bars, widths };
}

export function createBarcodeGeometry(
  pattern: BarcodePattern,
  plateWidth: number,
  plateHeight: number,
  borderWidth: number,
  reservedBottom: number,
  contentHeight: number,
  embossed: boolean,
): THREE.BufferGeometry {
  const availableWidth = plateWidth - borderWidth * 2;
  const availableHeight = plateHeight - borderWidth * 2 - reservedBottom;

  const totalUnits = pattern.widths.reduce((a, b) => a + b, 0);
  const unit = availableWidth / totalUnits;

  const barHeight = availableHeight * 0.9;
  const z = embossed ? contentHeight / 2 : -contentHeight / 2;
  const yOffset = reservedBottom / 2;

  const startX = -availableWidth / 2;
  const geometries: THREE.BufferGeometry[] = [];
  let cursor = 0;

  for (let i = 0; i < pattern.bars.length; i++) {
    const w = pattern.widths[i] * unit;
    if (pattern.bars[i]) {
      const box = new THREE.BoxGeometry(w, barHeight, contentHeight);
      box.translate(startX + cursor + w / 2, yOffset, z);
      geometries.push(box);
    }
    cursor += w;
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
