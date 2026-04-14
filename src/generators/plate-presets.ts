import type { GeneratorType, BaseShape } from '../types/model';

export interface PlatePreset {
  width: number;
  height: number;
  shape: BaseShape;
  cornerRadius: number;
  borderWidth: number;
}

/**
 * Sensible default plate dimensions per generator type. Applied whenever the
 * user switches generators so the plate starts at a shape that fits the
 * content (square for QR, rectangular for Spotify/barcode/nameplate, etc).
 */
export const PLATE_PRESETS: Record<GeneratorType, PlatePreset> = {
  qr: {
    width: 60,
    height: 60,
    shape: 'rectangle',
    cornerRadius: 3,
    borderWidth: 3,
  },
  text: {
    width: 80,
    height: 30,
    shape: 'rounded-rectangle',
    cornerRadius: 4,
    borderWidth: 3,
  },
  spotify: {
    width: 100,
    height: 35,
    shape: 'rounded-rectangle',
    cornerRadius: 4,
    borderWidth: 3,
  },
  wifi: {
    width: 60,
    height: 75,
    shape: 'rounded-rectangle',
    cornerRadius: 3,
    borderWidth: 3,
  },
  vcard: {
    width: 60,
    height: 75,
    shape: 'rounded-rectangle',
    cornerRadius: 3,
    borderWidth: 3,
  },
  barcode: {
    width: 90,
    height: 35,
    shape: 'rounded-rectangle',
    cornerRadius: 3,
    borderWidth: 3,
  },
  image: {
    width: 70,
    height: 70,
    shape: 'rectangle',
    cornerRadius: 3,
    borderWidth: 3,
  },
  lithophane: {
    width: 80,
    height: 60,
    shape: 'rectangle',
    cornerRadius: 2,
    borderWidth: 0,
  },
  nameplate: {
    width: 85,
    height: 30,
    shape: 'rounded-rectangle',
    cornerRadius: 4,
    borderWidth: 3,
  },
};
