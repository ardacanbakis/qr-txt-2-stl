import qrcode from 'qrcode-generator';
import * as THREE from 'three';
import type { ErrorCorrectionLevel } from '../types/model';

const EC_MAP: Record<ErrorCorrectionLevel, ErrorCorrectionLevel> = {
  L: 'L',
  M: 'M',
  Q: 'Q',
  H: 'H',
};

export interface QRMatrixResult {
  matrix: boolean[][];
  moduleCount: number;
}

export function generateQRMatrix(text: string, errorCorrection: ErrorCorrectionLevel): QRMatrixResult {
  const ecLevel = EC_MAP[errorCorrection];
  const qr = qrcode(0, ecLevel);
  qr.addData(text);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const matrix: boolean[][] = [];

  for (let row = 0; row < moduleCount; row++) {
    matrix[row] = [];
    for (let col = 0; col < moduleCount; col++) {
      matrix[row][col] = qr.isDark(row, col);
    }
  }

  return { matrix, moduleCount };
}

export function createQRGeometry(
  matrix: boolean[][],
  moduleCount: number,
  plateWidth: number,
  plateHeight: number,
  borderWidth: number,
  contentHeight: number,
  embossed: boolean,
): THREE.BufferGeometry {
  const availableWidth = plateWidth - borderWidth * 2;
  const availableHeight = plateHeight - borderWidth * 2;
  const qrSize = Math.min(availableWidth, availableHeight);
  const moduleSize = qrSize / moduleCount;

  const geometries: THREE.BoxGeometry[] = [];
  const matrices: THREE.Matrix4[] = [];

  const offsetX = -qrSize / 2;
  const offsetY = -qrSize / 2;

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (matrix[row][col]) {
        const box = new THREE.BoxGeometry(moduleSize, moduleSize, contentHeight);
        const mat = new THREE.Matrix4();
        const x = offsetX + col * moduleSize + moduleSize / 2;
        const y = offsetY + (moduleCount - 1 - row) * moduleSize + moduleSize / 2;
        const z = embossed ? contentHeight / 2 : -contentHeight / 2;
        mat.makeTranslation(x, y, z);
        geometries.push(box);
        matrices.push(mat);
      }
    }
  }

  const merged = new THREE.BufferGeometry();
  if (geometries.length === 0) return merged;

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let indexOffset = 0;

  for (let i = 0; i < geometries.length; i++) {
    const geo = geometries[i].clone();
    geo.applyMatrix4(matrices[i]);

    const pos = geo.attributes.position.array;
    const norm = geo.attributes.normal.array;
    const idx = geo.index!.array;

    for (let j = 0; j < pos.length; j++) positions.push(pos[j]);
    for (let j = 0; j < norm.length; j++) normals.push(norm[j]);
    for (let j = 0; j < idx.length; j++) indices.push(idx[j] + indexOffset);

    indexOffset += pos.length / 3;
    geo.dispose();
  }

  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setIndex(indices);

  return merged;
}

export function generateWifiString(ssid: string, password: string, encryption: string, hidden: boolean): string {
  return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden ? 'true' : ''};;`;
}

export function generateVCardString(
  firstName: string,
  lastName: string,
  phone: string,
  email: string,
  org: string,
  url: string,
): string {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName}`,
    `FN:${firstName} ${lastName}`,
    phone ? `TEL:${phone}` : '',
    email ? `EMAIL:${email}` : '',
    org ? `ORG:${org}` : '',
    url ? `URL:${url}` : '',
    'END:VCARD',
  ].filter(Boolean).join('\n');
}
