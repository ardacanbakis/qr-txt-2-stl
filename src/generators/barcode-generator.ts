import * as THREE from 'three';
import type { BarcodeFormat } from '../types/model';

export interface BarcodePattern {
  bars: boolean[];
  widths: number[];
}

// ---- CODE 39 ----

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

function encodeCODE39(text: string): BarcodePattern {
  const upper = text.toUpperCase().replace(/[^0-9A-Z\-. $/+%]/g, '');
  const sequence = `*${upper}*`;
  const bars: boolean[] = [];
  const widths: number[] = [];
  for (let i = 0; i < sequence.length; i++) {
    const enc = CODE39[sequence[i]] ?? CODE39['-'];
    for (let j = 0; j < 9; j++) {
      bars.push(j % 2 === 0);
      widths.push(enc[j] === 'w' ? 3 : 1);
    }
    if (i < sequence.length - 1) {
      bars.push(false);
      widths.push(1);
    }
  }
  return { bars, widths };
}

// ---- EAN / UPC encoding tables ----

const EAN_L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
const EAN_G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
const EAN_R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
const EAN13_PARITY = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];

function modulesToPattern(modules: string): BarcodePattern {
  const bars: boolean[] = [];
  const widths: number[] = [];
  let i = 0;
  while (i < modules.length) {
    const bit = modules[i];
    let count = 0;
    while (i < modules.length && modules[i] === bit) { count++; i++; }
    bars.push(bit === '1');
    widths.push(count);
  }
  return { bars, widths };
}

function encodeEAN13(text: string): BarcodePattern {
  const raw = text.replace(/\D/g, '').padEnd(12, '0').substring(0, 12);
  const d = raw.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += d[i] * (i % 2 === 0 ? 1 : 3);
  d.push((10 - (sum % 10)) % 10);

  const parity = EAN13_PARITY[d[0]];
  let m = '101';
  for (let i = 0; i < 6; i++) {
    m += parity[i] === 'G' ? EAN_G[d[i + 1]] : EAN_L[d[i + 1]];
  }
  m += '01010';
  for (let i = 7; i < 13; i++) m += EAN_R[d[i]];
  m += '101';
  return modulesToPattern(m);
}

function encodeEAN8(text: string): BarcodePattern {
  const raw = text.replace(/\D/g, '').padEnd(7, '0').substring(0, 7);
  const d = raw.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += d[i] * (i % 2 === 0 ? 3 : 1);
  d.push((10 - (sum % 10)) % 10);

  let m = '101';
  for (let i = 0; i < 4; i++) m += EAN_L[d[i]];
  m += '01010';
  for (let i = 4; i < 8; i++) m += EAN_R[d[i]];
  m += '101';
  return modulesToPattern(m);
}

function encodeUPCA(text: string): BarcodePattern {
  const raw = text.replace(/\D/g, '').padEnd(11, '0').substring(0, 11);
  const d = raw.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 11; i++) sum += d[i] * (i % 2 === 0 ? 3 : 1);
  d.push((10 - (sum % 10)) % 10);

  let m = '101';
  for (let i = 0; i < 6; i++) m += EAN_L[d[i]];
  m += '01010';
  for (let i = 6; i < 12; i++) m += EAN_R[d[i]];
  m += '101';
  return modulesToPattern(m);
}

// ---- CODE 128 (Code B — printable ASCII 32–127) ----

const C128 = [
  '11011001100','11001101100','11001100110','10010011000','10010001100',
  '10001001100','10011001000','10011000100','10001100100','11001001000',
  '11001000100','11000100100','10110011100','10011011100','10011001110',
  '10111001100','10011101100','10011100110','11001110010','11001011100',
  '11001001110','11011100100','11001110100','11101101110','11101001100',
  '11100101100','11100100110','11101100100','11100110100','11100110010',
  '11011011000','11011000110','11000110110','10100011000','10001011000',
  '10001000110','10110001000','10001101000','10001100010','11010001000',
  '11000101000','11000100010','10110111000','10110001110','10001101110',
  '10111011000','10111000110','10001110110','11101110110','11010001110',
  '11000101110','11011101000','11011100010','11011101110','11101011000',
  '11101000110','11100010110','11101101000','11101100010','11100011010',
  '11101111010','11001000010','11110001010','10100110000','10100001100',
  '10010110000','10010000110','10000101100','10000100110','10110010000',
  '10110000100','10011010000','10011000010','10000110100','10000110010',
  '11000010010','11001010000','11110111010','11000010100','10001111010',
  '10100111100','10010111100','10010011110','10111100100','10011110100',
  '10011110010','11110100100','11110010100','11110010010','11011011110',
  '11011110110','11110110110','10101111000','10100011110','10001011110',
  '10111101000','10111100010','11110101000','11110100010','10111011110',
  '10111101110','11101011110','11110101110',
  '11010000100',  // 104 = START B
  '11010010000',  // 105 = START C
  '1100011101011', // 106 = STOP
];

function encodeCODE128(text: string): BarcodePattern {
  const startVal = 104;
  let m = C128[startVal];
  let checksum = startVal;
  for (let i = 0; i < text.length; i++) {
    const idx = Math.max(0, Math.min(text.charCodeAt(i) - 32, 94));
    m += C128[idx];
    checksum += idx * (i + 1);
  }
  m += C128[checksum % 103];
  m += C128[106];
  return modulesToPattern(m);
}

// ---- Public API ----

export function encodeBarcode(text: string, format: BarcodeFormat): BarcodePattern {
  switch (format) {
    case 'EAN13': return encodeEAN13(text);
    case 'EAN8': return encodeEAN8(text);
    case 'UPCA': return encodeUPCA(text);
    case 'CODE128': return encodeCODE128(text || ' ');
    case 'CODE39':
    default: return encodeCODE39(text || 'HELLO');
  }
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
