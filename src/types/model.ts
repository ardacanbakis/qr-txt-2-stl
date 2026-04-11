export type InputType = 'text' | 'url' | 'wifi' | 'vcard' | 'spotify' | 'label';

export type BaseShape = 'rectangle' | 'rounded-rectangle' | 'circle' | 'keychain';

export type ContentMode = 'embossed' | 'engraved';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export type MagnetSize = '6x3' | '8x3' | '10x3' | 'custom';

export type MagnetPosition = 'corners' | 'edges' | 'center' | 'custom';

export type ExportQuality = 'low' | 'medium' | 'high';

export interface WifiConfig {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface VCardConfig {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  organization: string;
  url: string;
}

export interface MagnetHoleConfig {
  enabled: boolean;
  size: MagnetSize;
  customDiameter: number;
  customDepth: number;
  position: MagnetPosition;
  count: number;
}

export interface MountingConfig {
  screwHoles: boolean;
  screwDiameter: number;
  wallMount: boolean;
  fridgeMagnet: boolean;
}

export interface BaseConfig {
  shape: BaseShape;
  width: number;
  height: number;
  thickness: number;
  cornerRadius: number;
  borderWidth: number;
  keychainHole: boolean;
  keychainHoleDiameter: number;
  filletRadius: number;
}

export interface ContentConfig {
  inputType: InputType;
  text: string;
  contentHeight: number;
  mode: ContentMode;
  errorCorrection: ErrorCorrectionLevel;
}

export interface ExportConfig {
  multiMaterial: boolean;
  quality: ExportQuality;
}

export interface ModelConfig {
  base: BaseConfig;
  content: ContentConfig;
  magnets: MagnetHoleConfig;
  mounting: MountingConfig;
  export: ExportConfig;
}

export const DEFAULT_CONFIG: ModelConfig = {
  base: {
    shape: 'rectangle',
    width: 50,
    height: 50,
    thickness: 3,
    cornerRadius: 2,
    borderWidth: 3,
    keychainHole: false,
    keychainHoleDiameter: 4,
    filletRadius: 0.5,
  },
  content: {
    inputType: 'text',
    text: 'Hello World',
    contentHeight: 1.5,
    mode: 'embossed',
    errorCorrection: 'M',
  },
  magnets: {
    enabled: false,
    size: '6x3',
    customDiameter: 6,
    customDepth: 3,
    position: 'corners',
    count: 4,
  },
  mounting: {
    screwHoles: false,
    screwDiameter: 3,
    wallMount: false,
    fridgeMagnet: false,
  },
  export: {
    multiMaterial: false,
    quality: 'medium',
  },
};
