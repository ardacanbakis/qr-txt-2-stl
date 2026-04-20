import * as THREE from 'three';
import type { BaseShape, EdgeTreatment } from '../types/model';

export function createBasePlateGeometry(
  shape: BaseShape,
  width: number,
  height: number,
  thickness: number,
  cornerRadius: number,
  edgeTreatment: EdgeTreatment = 'none',
  filletRadius: number = 1,
): THREE.BufferGeometry {
  switch (shape) {
    case 'circle':
      return createCircleBase(Math.min(width, height) / 2, thickness, edgeTreatment, filletRadius);
    case 'rounded-rectangle':
      return createRoundedRectBase(width, height, thickness, cornerRadius, edgeTreatment, filletRadius);
    case 'keychain':
      return createKeychainBase(width, height, thickness, cornerRadius, edgeTreatment, filletRadius);
    case 'rectangle':
    default:
      return createRectBase(width, height, thickness, edgeTreatment, filletRadius);
  }
}

function bevelOpts(edgeTreatment: EdgeTreatment, filletRadius: number, thickness: number) {
  if (edgeTreatment === 'none') return { bevelEnabled: false as const };
  const r = Math.min(filletRadius, thickness * 0.4, 3);
  return {
    bevelEnabled: true as const,
    bevelThickness: r,
    bevelSize: r,
    bevelSegments: edgeTreatment === 'fillet' ? 4 : 1,
    bevelOffset: 0,
  };
}

function centerZ(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  geo.translate(0, 0, -((bb.max.z + bb.min.z) / 2));
  return geo;
}

function createRectBase(
  width: number,
  height: number,
  thickness: number,
  edgeTreatment: EdgeTreatment,
  filletRadius: number,
): THREE.BufferGeometry {
  if (edgeTreatment === 'none') {
    return new THREE.BoxGeometry(width, height, thickness);
  }
  const shape = new THREE.Shape();
  const w = width / 2;
  const h = height / 2;
  shape.moveTo(-w, -h);
  shape.lineTo(w, -h);
  shape.lineTo(w, h);
  shape.lineTo(-w, h);
  shape.closePath();

  const bevel = bevelOpts(edgeTreatment, filletRadius, thickness);
  const depth = bevel.bevelEnabled ? Math.max(0.1, thickness - bevel.bevelThickness * 2) : thickness;
  return centerZ(new THREE.ExtrudeGeometry(shape, { depth, ...bevel }));
}

function createCircleBase(
  radius: number,
  thickness: number,
  edgeTreatment: EdgeTreatment,
  filletRadius: number,
): THREE.BufferGeometry {
  if (edgeTreatment === 'none') {
    return new THREE.CylinderGeometry(radius, radius, thickness, 64);
  }
  const shape = new THREE.Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);

  const bevel = bevelOpts(edgeTreatment, filletRadius, thickness);
  const depth = bevel.bevelEnabled ? Math.max(0.1, thickness - bevel.bevelThickness * 2) : thickness;
  const geo = new THREE.ExtrudeGeometry(shape, { depth, curveSegments: 64, ...bevel });
  return centerZ(geo);
}

function createRoundedRectBase(
  width: number,
  height: number,
  thickness: number,
  radius: number,
  edgeTreatment: EdgeTreatment,
  filletRadius: number,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, Math.min(w, h));

  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);

  const bevel = bevelOpts(edgeTreatment, filletRadius, thickness);
  const depth = bevel.bevelEnabled ? Math.max(0.1, thickness - bevel.bevelThickness * 2) : thickness;
  return centerZ(new THREE.ExtrudeGeometry(shape, { depth, ...bevel }));
}

function createKeychainBase(
  width: number,
  height: number,
  thickness: number,
  cornerRadius: number,
  edgeTreatment: EdgeTreatment,
  filletRadius: number,
): THREE.BufferGeometry {
  const tabRadius = 6;
  const tabHeight = tabRadius * 2;

  const shape = new THREE.Shape();
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(cornerRadius, Math.min(w, h));

  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);

  // Tab: rectangular stem + semicircular cap, centered at x=0
  const tabArcCenterY = h + tabRadius; // arc center above plate
  shape.lineTo(tabRadius, h);
  shape.lineTo(tabRadius, tabArcCenterY);
  shape.absarc(0, tabArcCenterY, tabRadius, 0, Math.PI, false); // centered at x=0
  shape.lineTo(-tabRadius, h);

  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);

  // Hole punched through tab cap center
  const holeR = tabRadius - 2;
  const holePath = new THREE.Path();
  holePath.absarc(0, tabArcCenterY, holeR, 0, Math.PI * 2, false);
  shape.holes.push(holePath);

  const bevel = bevelOpts(edgeTreatment, filletRadius, thickness);
  const depth = bevel.bevelEnabled ? Math.max(0.1, thickness - bevel.bevelThickness * 2) : thickness;
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, ...bevel, curveSegments: 32 });
  geometry.translate(0, -tabHeight / 2, 0);
  return centerZ(geometry);
}

/** Standalone keychain tab with punched hole for non-keychain base shapes. */
export function createKeychainTabGeometry(
  plateHeight: number,
  holeDiameter: number,
  thickness: number,
): THREE.BufferGeometry {
  const holeR = Math.max(1.5, holeDiameter / 2);
  const tabRadius = holeR + 2; // 2mm wall around hole
  const tabCenterY = tabRadius; // arc center height above plate edge

  const shape = new THREE.Shape();
  shape.moveTo(-tabRadius, 0);
  shape.lineTo(tabRadius, 0);
  shape.lineTo(tabRadius, tabCenterY);
  shape.absarc(0, tabCenterY, tabRadius, 0, Math.PI, false);
  shape.lineTo(-tabRadius, 0);

  const hole = new THREE.Path();
  hole.absarc(0, tabCenterY, holeR, 0, Math.PI * 2, false);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 32,
  });

  geo.translate(0, plateHeight / 2, 0);
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  geo.translate(0, 0, -((bb.max.z + bb.min.z) / 2));
  return geo;
}

/** Visual indicator cylinders for screw holes (one per corner position). */
export function createScrewHoleGeometries(
  plateWidth: number,
  plateHeight: number,
  diameter: number,
  thickness: number,
  count: number,
): THREE.BufferGeometry[] {
  const r = diameter / 2;
  const margin = r + 3;
  const w = plateWidth / 2 - margin;
  const h = plateHeight / 2 - margin;
  const corners: [number, number][] = [[-w, -h], [w, -h], [w, h], [-w, h]];
  return corners.slice(0, Math.min(count, 4)).map(([x, y]) => {
    const geo = new THREE.CylinderGeometry(r, r, thickness + 2, 24);
    geo.rotateX(Math.PI / 2);
    geo.translate(x, y, 0);
    return geo;
  });
}

/** Visual indicator for a wall-mount keyhole slot (back face). */
export function createWallMountGeometry(
  plateHeight: number,
  keyholeWidth: number,
  thickness: number,
): THREE.BufferGeometry {
  const headR = keyholeWidth / 2;
  const neckR = headR * 0.55;
  const neckLen = 8;
  const slotDepth = Math.min(thickness * 0.55, 2);
  const yOffset = plateHeight / 2 - headR - 4;

  const headShape = new THREE.Shape();
  headShape.absarc(0, 0, headR, 0, Math.PI * 2, false);
  const headGeo = new THREE.ExtrudeGeometry(headShape, { depth: slotDepth, bevelEnabled: false, curveSegments: 32 });
  headGeo.translate(0, yOffset, -(thickness / 2));

  const neckShape = new THREE.Shape();
  neckShape.moveTo(-neckR, 0);
  neckShape.lineTo(neckR, 0);
  neckShape.lineTo(neckR, -neckLen);
  neckShape.lineTo(-neckR, -neckLen);
  neckShape.closePath();
  const neckGeo = new THREE.ExtrudeGeometry(neckShape, { depth: slotDepth, bevelEnabled: false });
  neckGeo.translate(0, yOffset, -(thickness / 2));

  return mergeGeos([headGeo, neckGeo]);
}

/** Visual indicator rectangle for a fridge magnet recess (back face). */
export function createFridgeMagnetGeometry(
  magnetWidth: number,
  magnetHeight: number,
  recessDepth: number,
  thickness: number,
): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(magnetWidth, magnetHeight, recessDepth);
  geo.translate(0, 0, -(thickness / 2 - recessDepth / 2 + 0.01));
  return geo;
}

function mergeGeos(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const out = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let offset = 0;
  for (const g of geos) {
    g.computeVertexNormals();
    const pos = g.attributes.position;
    const norm = g.attributes.normal;
    const idx = g.index;
    for (let i = 0; i < pos.count * 3; i++) {
      positions.push(pos.array[i] as number);
      normals.push(norm ? (norm.array[i] as number) : 0);
    }
    if (idx) {
      for (let i = 0; i < idx.count; i++) indices.push((idx.array[i] as number) + offset);
    } else {
      for (let i = 0; i < pos.count; i++) indices.push(i + offset);
    }
    offset += pos.count;
    g.dispose();
  }
  out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length) out.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  out.setIndex(indices);
  return out;
}
