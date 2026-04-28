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
    case 'pentagon':
      return createPentagonBase(width, height, thickness, edgeTreatment, filletRadius);
    case 'hexagon':
      return createHexagonBase(width, height, thickness, edgeTreatment, filletRadius);
    case 'rectangle':
    default:
      return createRectBase(width, height, thickness, edgeTreatment, filletRadius);
  }
}

export interface MagnetRecess {
  x: number;
  y: number;
  radius: number;
  depth: number;
}

const MAGNET_WALL = 1.2;
export const MAGNET_TOLERANCE_DIAMETER = 0.2;
export const MAGNET_TOLERANCE_DEPTH = 0.15;

export function magnetMinThickness(magnetDepth: number): number {
  return magnetDepth + MAGNET_TOLERANCE_DEPTH + MAGNET_WALL;
}

export function createBasePlateWithRecesses(
  shape: BaseShape,
  width: number,
  height: number,
  thickness: number,
  cornerRadius: number,
  edgeTreatment: EdgeTreatment,
  filletRadius: number,
  recesses: MagnetRecess[],
): THREE.BufferGeometry {
  if (recesses.length === 0) {
    return createBasePlateGeometry(shape, width, height, thickness, cornerRadius, edgeTreatment, filletRadius);
  }

  const maxDepth = Math.max(...recesses.map(r => r.depth));
  const wallThick = thickness - maxDepth;

  const topOutline = createOutlineShape(shape, width, height, cornerRadius);
  const topBevel = bevelOpts(edgeTreatment, filletRadius, wallThick);
  const topDepth = topBevel.bevelEnabled ? Math.max(0.1, wallThick - topBevel.bevelThickness * 2) : wallThick;
  const topGeo = new THREE.ExtrudeGeometry(topOutline, { depth: topDepth, ...topBevel, curveSegments: 48 });

  const bottomOutline = createOutlineShape(shape, width, height, cornerRadius);
  for (const recess of recesses) {
    const hole = new THREE.Path();
    hole.absarc(recess.x, recess.y, recess.radius, 0, Math.PI * 2, false);
    bottomOutline.holes.push(hole);
  }
  const bottomGeo = new THREE.ExtrudeGeometry(bottomOutline, { depth: maxDepth, bevelEnabled: false, curveSegments: 48 });

  topGeo.translate(0, 0, maxDepth);

  const merged = mergeGeos([bottomGeo, topGeo]);
  merged.computeBoundingBox();
  const bb = merged.boundingBox!;
  merged.translate(0, 0, -((bb.max.z + bb.min.z) / 2));
  return merged;
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
    const geo = new THREE.CylinderGeometry(radius, radius, thickness, 64);
    geo.rotateX(Math.PI / 2);
    return geo;
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


function createPentagonBase(
  width: number,
  height: number,
  thickness: number,
  edgeTreatment: EdgeTreatment,
  filletRadius: number,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const rx = width / 2;
  const ry = height / 2;
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const x = Math.cos(angle) * rx;
    const y = Math.sin(angle) * ry;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const bevel = bevelOpts(edgeTreatment, filletRadius, thickness);
  const depth = bevel.bevelEnabled ? Math.max(0.1, thickness - bevel.bevelThickness * 2) : thickness;
  return centerZ(new THREE.ExtrudeGeometry(shape, { depth, ...bevel }));
}

function createHexagonBase(
  width: number,
  height: number,
  thickness: number,
  edgeTreatment: EdgeTreatment,
  filletRadius: number,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const rx = width / 2;
  const ry = height / 2;
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = Math.cos(angle) * rx;
    const y = Math.sin(angle) * ry;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const bevel = bevelOpts(edgeTreatment, filletRadius, thickness);
  const depth = bevel.bevelEnabled ? Math.max(0.1, thickness - bevel.bevelThickness * 2) : thickness;
  return centerZ(new THREE.ExtrudeGeometry(shape, { depth, ...bevel }));
}

/** Standalone keychain tab with punched hole for non-keychain base shapes. */
export function createKeychainTabGeometry(
  plateWidth: number,
  plateHeight: number,
  holeDiameter: number,
  thickness: number,
  shape: BaseShape,
): THREE.BufferGeometry {
  const holeR = Math.max(1.5, holeDiameter / 2);
  const tabRadius = holeR + 2; // 2mm wall around hole

  if (shape === 'circle') {
    const plateR = Math.min(plateWidth, plateHeight) / 2;
    const tabCenterY = tabRadius;

    const tabShape = new THREE.Shape();
    tabShape.moveTo(-tabRadius, 0);
    tabShape.lineTo(tabRadius, 0);
    tabShape.lineTo(tabRadius, tabCenterY);
    tabShape.absarc(0, tabCenterY, tabRadius, 0, Math.PI, false);
    tabShape.lineTo(-tabRadius, 0);

    const hole = new THREE.Path();
    hole.absarc(0, tabCenterY, holeR, 0, Math.PI * 2, false);
    tabShape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(tabShape, {
      depth: thickness,
      bevelEnabled: false,
      curveSegments: 32,
    });

    geo.translate(0, plateR, 0);
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    geo.translate(0, 0, -((bb.max.z + bb.min.z) / 2));
    return geo;
  }

  const tabCenterY = tabRadius;

  const tabShape = new THREE.Shape();
  tabShape.moveTo(-tabRadius, 0);
  tabShape.lineTo(tabRadius, 0);
  tabShape.lineTo(tabRadius, tabCenterY);
  tabShape.absarc(0, tabCenterY, tabRadius, 0, Math.PI, false);
  tabShape.lineTo(-tabRadius, 0);

  const hole = new THREE.Path();
  hole.absarc(0, tabCenterY, holeR, 0, Math.PI * 2, false);
  tabShape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(tabShape, {
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

/** Visual indicator cylinders for screw holes. Circle-aware placement. */
export function createScrewHoleGeometries(
  plateWidth: number,
  plateHeight: number,
  diameter: number,
  thickness: number,
  count: number,
  shape: BaseShape = 'rectangle',
): THREE.BufferGeometry[] {
  const r = diameter / 2;
  const margin = r + 3;
  let positions: [number, number][];

  if (shape === 'circle' || shape === 'hexagon' || shape === 'pentagon') {
    const plateR = Math.min(plateWidth, plateHeight) / 2 - margin;
    const n = Math.min(count, 8);
    positions = [];
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      positions.push([Math.cos(angle) * plateR, Math.sin(angle) * plateR]);
    }
  } else {
    const w = plateWidth / 2 - margin;
    const h = plateHeight / 2 - margin;
    positions = [[-w, -h], [w, -h], [w, h], [-w, h]];
    positions = positions.slice(0, Math.min(count, 4));
  }

  return positions.map(([x, y]) => {
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

/** Physical raised border frame on top of the base plate. */
export function createBorderFrameGeometry(
  shape: BaseShape,
  width: number,
  height: number,
  borderWidth: number,
  borderHeight: number,
  cornerRadius: number,
): THREE.BufferGeometry {
  const outer = createOutlineShape(shape, width, height, cornerRadius);
  const inner = createOutlineShape(
    shape,
    width - borderWidth * 2,
    height - borderWidth * 2,
    Math.max(0, cornerRadius - borderWidth),
  );

  const hole = new THREE.Path();
  const pts = inner.getPoints(64);
  hole.setFromPoints(pts);
  outer.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(outer, {
    depth: borderHeight,
    bevelEnabled: false,
    curveSegments: 48,
  });
  geo.translate(0, 0, -borderHeight / 2);
  return geo;
}

function createOutlineShape(
  shape: BaseShape,
  width: number,
  height: number,
  cornerRadius: number,
): THREE.Shape {
  const s = new THREE.Shape();
  const w = width / 2;
  const h = height / 2;

  if (shape === 'circle') {
    const r = Math.min(w, h);
    s.absarc(0, 0, r, 0, Math.PI * 2, false);
    return s;
  }

  if (shape === 'rounded-rectangle') {
    const r = Math.min(cornerRadius, Math.min(w, h));
    s.moveTo(-w + r, -h);
    s.lineTo(w - r, -h);
    s.quadraticCurveTo(w, -h, w, -h + r);
    s.lineTo(w, h - r);
    s.quadraticCurveTo(w, h, w - r, h);
    s.lineTo(-w + r, h);
    s.quadraticCurveTo(-w, h, -w, h - r);
    s.lineTo(-w, -h + r);
    s.quadraticCurveTo(-w, -h, -w + r, -h);
    return s;
  }

  if (shape === 'pentagon') {
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      const x = Math.cos(angle) * w;
      const y = Math.sin(angle) * h;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    return s;
  }

  if (shape === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = Math.cos(angle) * w;
      const y = Math.sin(angle) * h;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    return s;
  }

  // rectangle
  s.moveTo(-w, -h);
  s.lineTo(w, -h);
  s.lineTo(w, h);
  s.lineTo(-w, h);
  s.closePath();
  return s;
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
