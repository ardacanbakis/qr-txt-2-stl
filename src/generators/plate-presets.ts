import type { GeneratorType, BaseShape } from '../types/model';

export interface PlatePreset {
  width: number;
  height: number;
  shape: BaseShape;
  cornerRadius: number;
  borderWidth: number;
  borderEnabled: boolean;
}

export const PLATE_PRESETS: Record<GeneratorType, PlatePreset> = {
  qr: {
    width: 60,
    height: 60,
    shape: 'rectangle',
    cornerRadius: 3,
    borderWidth: 3,
    borderEnabled: false,
  },
  text: {
    width: 80,
    height: 30,
    shape: 'rounded-rectangle',
    cornerRadius: 4,
    borderWidth: 3,
    borderEnabled: false,
  },
  spotify: {
    width: 100,
    height: 35,
    shape: 'rounded-rectangle',
    cornerRadius: 4,
    borderWidth: 5,
    borderEnabled: false,
  },
  wifi: {
    width: 60,
    height: 75,
    shape: 'rounded-rectangle',
    cornerRadius: 3,
    borderWidth: 5,
    borderEnabled: false,
  },
  vcard: {
    width: 60,
    height: 75,
    shape: 'rounded-rectangle',
    cornerRadius: 3,
    borderWidth: 5,
    borderEnabled: false,
  },
  barcode: {
    width: 90,
    height: 35,
    shape: 'rounded-rectangle',
    cornerRadius: 3,
    borderWidth: 3,
    borderEnabled: false,
  },
  lithophane: {
    width: 80,
    height: 60,
    shape: 'rectangle',
    cornerRadius: 2,
    borderWidth: 0,
    borderEnabled: false,
  },
  nameplate: {
    width: 85,
    height: 30,
    shape: 'rounded-rectangle',
    cornerRadius: 4,
    borderWidth: 3,
    borderEnabled: false,
  },
  map: {
    width: 100,
    height: 100,
    shape: 'rectangle',
    cornerRadius: 2,
    borderWidth: 3,
    borderEnabled: false,
  },
};
