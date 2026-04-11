import * as THREE from 'three';
import type { BaseShape } from '../types/model';

export function createBasePlateGeometry(
  shape: BaseShape,
  width: number,
  height: number,
  thickness: number,
  cornerRadius: number,
): THREE.BufferGeometry {
  switch (shape) {
    case 'circle':
      return createCircleBase(Math.min(width, height) / 2, thickness);
    case 'rounded-rectangle':
      return createRoundedRectBase(width, height, thickness, cornerRadius);
    case 'keychain':
      return createKeychainBase(width, height, thickness, cornerRadius);
    case 'rectangle':
    default:
      return createRectBase(width, height, thickness);
  }
}

function createRectBase(width: number, height: number, thickness: number): THREE.BufferGeometry {
  return new THREE.BoxGeometry(width, height, thickness);
}

function createCircleBase(radius: number, thickness: number): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radius, radius, thickness, 64);
}

function createRoundedRectBase(
  width: number,
  height: number,
  thickness: number,
  radius: number,
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

  const extrudeSettings = {
    depth: thickness,
    bevelEnabled: false,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.translate(0, 0, -thickness / 2);
  return geometry;
}

function createKeychainBase(
  width: number,
  height: number,
  thickness: number,
  cornerRadius: number,
): THREE.BufferGeometry {
  const tabRadius = 6;
  const tabHeight = tabRadius * 2 + 2;

  const shape = new THREE.Shape();
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(cornerRadius, Math.min(w, h));

  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);

  const tabW = tabRadius + 2;
  shape.lineTo(tabW, h);
  shape.lineTo(tabW, h + tabHeight - tabRadius);
  shape.arc(0, 0, tabRadius, 0, Math.PI, false);
  shape.lineTo(-tabW, h + tabHeight - tabRadius);
  shape.lineTo(-tabW, h);

  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);

  const holePath = new THREE.Path();
  const holeY = h + tabHeight - tabRadius;
  holePath.absarc(0, holeY, tabRadius - 2, 0, Math.PI * 2, false);
  shape.holes.push(holePath);

  const extrudeSettings = {
    depth: thickness,
    bevelEnabled: false,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.translate(0, -tabHeight / 2, -thickness / 2);
  return geometry;
}

export function createKeychainHoleGeometry(
  _width: number,
  height: number,
  holeDiameter: number,
  thickness: number,
): THREE.BufferGeometry {
  const radius = holeDiameter / 2;
  const holeGeo = new THREE.CylinderGeometry(radius, radius, thickness + 2, 32);
  holeGeo.rotateX(Math.PI / 2);
  holeGeo.translate(0, height / 2 + radius + 2, 0);
  return holeGeo;
}
