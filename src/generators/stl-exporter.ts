import * as THREE from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';

/** Tag applied to mesh.userData.part for separate-parts export. */
export type PartTag = 'base' | 'border' | 'content' | 'text' | 'secondary' | 'logo' | 'ignore';

export function exportSTL(scene: THREE.Object3D, filename: string = 'model.stl'): void {
  const exporter = new STLExporter();
  const stlString = exporter.parse(scene, { binary: true });
  downloadBlob(toBlob(stlString), filename);
}

/**
 * Walk the scene, group meshes by their userData.part tag, export each group
 * as a separate STL, and bundle all files into a single ZIP download.
 * Meshes with part === 'ignore' are skipped. Untagged meshes go into a
 * "combined" fallback file so nothing is silently lost.
 */
export function exportSeparateParts(scene: THREE.Object3D, baseName: string): void {
  const exporter = new STLExporter();
  const groups = new Map<string, THREE.Mesh[]>();
  const untagged: THREE.Mesh[] = [];

  scene.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    const part = (mesh.userData.part as PartTag | undefined) ?? undefined;
    if (part === 'ignore') return;
    if (part) {
      if (!groups.has(part)) groups.set(part, []);
      groups.get(part)!.push(mesh);
    } else {
      untagged.push(mesh);
    }
  });

  if (groups.size === 0 && untagged.length > 0) {
    // Nothing tagged; fall back to single export.
    exportSTL(scene, `${baseName}.stl`);
    return;
  }

  const zipFiles: { name: string; data: Uint8Array }[] = [];

  for (const [part, meshes] of groups.entries()) {
    const partScene = new THREE.Scene();
    for (const m of meshes) {
      const clone = m.clone();
      clone.updateMatrixWorld(true);
      m.updateMatrixWorld(true);
      clone.matrix.copy(m.matrixWorld);
      clone.matrix.decompose(clone.position, clone.quaternion, clone.scale);
      partScene.add(clone);
    }
    const result = exporter.parse(partScene, { binary: true });
    zipFiles.push({ name: `${baseName}-${part}.stl`, data: resultToUint8Array(result) });
  }

  if (untagged.length > 0) {
    const partScene = new THREE.Scene();
    for (const m of untagged) partScene.add(m.clone());
    const result = exporter.parse(partScene, { binary: true });
    zipFiles.push({ name: `${baseName}-other.stl`, data: resultToUint8Array(result) });
  }

  const zipBlob = buildZip(zipFiles);
  downloadBlob(zipBlob, `${baseName}-parts.zip`);
}

// --- helpers ---

function resultToUint8Array(result: string | ArrayBuffer | DataView): Uint8Array {
  if (result instanceof ArrayBuffer) return new Uint8Array(result);
  if (result instanceof DataView) return new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
  // string (ASCII binary) — convert char codes
  const out = new Uint8Array(result.length);
  for (let i = 0; i < result.length; i++) out[i] = result.charCodeAt(i) & 0xff;
  return out;
}

function toBlob(stlString: string | ArrayBuffer | DataView): Blob {
  return new Blob([stlString as BlobPart], { type: 'application/octet-stream' });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// --- Minimal stored-ZIP builder (no compression, no external dep) ---

/** CRC-32 lookup table (ISO 3309 / ITU-T V.42). */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function le16(v: number, buf: Uint8Array, off: number) {
  buf[off] = v & 0xff;
  buf[off + 1] = (v >> 8) & 0xff;
}
function le32(v: number, buf: Uint8Array, off: number) {
  buf[off] = v & 0xff;
  buf[off + 1] = (v >> 8) & 0xff;
  buf[off + 2] = (v >> 16) & 0xff;
  buf[off + 3] = (v >> 24) & 0xff;
}

/**
 * Build a stored (method 0) ZIP archive from an array of file entries.
 * No compression — file data is stored verbatim, which is fine for
 * already-binary STL files.
 */
function buildZip(files: { name: string; data: Uint8Array }[]): Blob {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const centralDirParts: Uint8Array[] = [];
  const offsets: number[] = [];
  let offset = 0;

  const dosDate = getDosDateTime();

  for (const file of files) {
    const nameBytes = enc.encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.length;

    // Local file header (30 bytes + name)
    const lh = new Uint8Array(30 + nameBytes.length);
    le32(0x04034b50, lh, 0);   // signature
    le16(20, lh, 4);            // version needed (2.0)
    le16(0, lh, 6);             // flags
    le16(0, lh, 8);             // compression method: stored
    le16(dosDate.time, lh, 10); // last mod time
    le16(dosDate.date, lh, 12); // last mod date
    le32(crc, lh, 14);          // CRC-32
    le32(size, lh, 18);         // compressed size
    le32(size, lh, 22);         // uncompressed size
    le16(nameBytes.length, lh, 26); // file name length
    le16(0, lh, 28);            // extra field length
    lh.set(nameBytes, 30);

    offsets.push(offset);
    offset += lh.length + size;
    parts.push(lh, file.data);

    // Central directory entry (46 bytes + name)
    const cd = new Uint8Array(46 + nameBytes.length);
    le32(0x02014b50, cd, 0);    // signature
    le16(20, cd, 4);             // version made by
    le16(20, cd, 6);             // version needed
    le16(0, cd, 8);              // flags
    le16(0, cd, 10);             // compression method: stored
    le16(dosDate.time, cd, 12);
    le16(dosDate.date, cd, 14);
    le32(crc, cd, 16);
    le32(size, cd, 20);
    le32(size, cd, 24);
    le16(nameBytes.length, cd, 28);
    le16(0, cd, 30);             // extra length
    le16(0, cd, 32);             // comment length
    le16(0, cd, 34);             // disk start
    le16(0, cd, 36);             // internal attr
    le32(0, cd, 38);             // external attr
    le32(offsets[offsets.length - 1], cd, 42); // local header offset
    cd.set(nameBytes, 46);
    centralDirParts.push(cd);
  }

  // End of central directory record (22 bytes)
  const cdSize = centralDirParts.reduce((s, c) => s + c.length, 0);
  const eocd = new Uint8Array(22);
  le32(0x06054b50, eocd, 0);     // signature
  le16(0, eocd, 4);               // disk number
  le16(0, eocd, 6);               // CD start disk
  le16(files.length, eocd, 8);    // entries on disk
  le16(files.length, eocd, 10);   // total entries
  le32(cdSize, eocd, 12);         // CD size
  le32(offset, eocd, 16);         // CD offset
  le16(0, eocd, 20);              // comment length

  // Cast through unknown to satisfy strict Blob constructor typing
  const blobParts = [...parts, ...centralDirParts, eocd] as unknown as BlobPart[];
  return new Blob(blobParts, { type: 'application/zip' });
}

function getDosDateTime(): { time: number; date: number } {
  const now = new Date();
  const time = ((now.getHours() & 0x1f) << 11) | ((now.getMinutes() & 0x3f) << 5) | ((now.getSeconds() >> 1) & 0x1f);
  const date = (((now.getFullYear() - 1980) & 0x7f) << 9) | (((now.getMonth() + 1) & 0x0f) << 5) | (now.getDate() & 0x1f);
  return { time, date };
}
