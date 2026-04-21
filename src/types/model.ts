export type GeneratorType =
  | 'qr'
  | 'text'
  | 'spotify'
  | 'wifi'
  | 'vcard'
  | 'image'
  | 'lithophane'
  | 'barcode'
  | 'nameplate';

export type InputType = 'text' | 'url' | 'wifi' | 'vcard' | 'spotify' | 'label';

export type BaseShape = 'rectangle' | 'rounded-rectangle' | 'circle' | 'keychain';

export type ContentMode = 'embossed' | 'engraved';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export type MagnetSize = '6x3' | '8x3' | '10x3' | 'custom';

export type MagnetPosition = 'corners' | 'edges' | 'center' | 'custom';

export type ExportQuality = 'low' | 'medium' | 'high';

export type FontStyle = 'regular' | 'bold' | 'italic' | 'bold-italic';

export type TextAlignment = 'left' | 'center' | 'right';

export type BarcodeFormat = 'CODE39' | 'CODE128' | 'EAN13';

export type WifiEncryption = 'WPA' | 'WEP' | 'nopass';

export type EdgeTreatment = 'none' | 'fillet' | 'chamfer';

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
  screwCount: number;
  wallMount: boolean;
  wallMountKeyholeWidth: number;
  fridgeMagnet: boolean;
  fridgeMagnetWidth: number;
  fridgeMagnetHeight: number;
  fridgeMagnetDepth: number;
}

export interface BaseConfig {
  shape: BaseShape;
  width: number;
  height: number;
  thickness: number;
  cornerRadius: number;
  borderWidth: number;
  borderEnabled: boolean;
  borderHeight: number;
  keychainHole: boolean;
  keychainHoleDiameter: number;
  edgeTreatment: EdgeTreatment;
  filletRadius: number;
}

export interface ContentConfig {
  inputType: InputType;
  text: string;
  contentHeight: number;
  mode: ContentMode;
  errorCorrection: ErrorCorrectionLevel;
  qrLabel: string;
  showQrLabel: boolean;
}

export interface TextConfig {
  text: string;
  fontStyle: FontStyle;
  size: number;
  letterSpacing: number;
  alignment: TextAlignment;
}

export interface SpotifyConfig {
  url: string;
  showLogo: boolean;
}

export interface WifiCardConfig {
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  hidden: boolean;
  showText: boolean;
}

export interface VCardConfig {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  organization: string;
  url: string;
  showText: boolean;
}

export interface ImageConfig {
  dataUrl: string;
  fileName: string;
  threshold: number;
  invert: boolean;
  resolution: number;
}

export interface LithophaneConfig {
  dataUrl: string;
  fileName: string;
  minThickness: number;
  maxThickness: number;
  resolution: number;
  invert: boolean;
}

export interface BarcodeConfig {
  text: string;
  format: BarcodeFormat;
  showText: boolean;
}

export interface NameplateConfig {
  primaryText: string;
  secondaryText: string;
  fontStyle: FontStyle;
  primarySize: number;
  secondarySize: number;
}

export interface ExportConfig {
  separateParts: boolean;
  quality: ExportQuality;
}

export interface ColorConfig {
  base: string;
  border: string;
  content: string;
  text: string;
  secondary: string;
  logo: string;
}

export interface ModelConfig {
  generator: GeneratorType;
  base: BaseConfig;
  content: ContentConfig;
  text: TextConfig;
  spotify: SpotifyConfig;
  wifi: WifiCardConfig;
  vcard: VCardConfig;
  image: ImageConfig;
  lithophane: LithophaneConfig;
  barcode: BarcodeConfig;
  nameplate: NameplateConfig;
  magnets: MagnetHoleConfig;
  mounting: MountingConfig;
  export: ExportConfig;
  colors: ColorConfig;
}

export const DEFAULT_CONFIG: ModelConfig = {
  generator: 'qr',
  base: {
    shape: 'rectangle',
    width: 60,
    height: 60,
    thickness: 3,
    cornerRadius: 3,
    borderWidth: 3,
    borderEnabled: true,
    borderHeight: 2,
    keychainHole: false,
    keychainHoleDiameter: 4,
    edgeTreatment: 'none',
    filletRadius: 1,
  },
  content: {
    inputType: 'text',
    text: 'Hello World',
    contentHeight: 2,
    mode: 'embossed',
    errorCorrection: 'M',
    qrLabel: '',
    showQrLabel: false,
  },
  text: {
    text: 'Hello',
    fontStyle: 'bold',
    size: 10,
    letterSpacing: 0,
    alignment: 'center',
  },
  spotify: {
    url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
    showLogo: true,
  },
  wifi: {
    ssid: 'MyNetwork',
    password: 'password123',
    encryption: 'WPA',
    hidden: false,
    showText: true,
  },
  vcard: {
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    email: 'john@example.com',
    organization: '',
    url: '',
    showText: true,
  },
  image: {
    dataUrl: '',
    fileName: '',
    threshold: 128,
    invert: false,
    resolution: 80,
  },
  lithophane: {
    dataUrl: '',
    fileName: '',
    minThickness: 0.6,
    maxThickness: 3.2,
    resolution: 100,
    invert: false,
  },
  barcode: {
    text: 'HELLO123',
    format: 'CODE39',
    showText: true,
  },
  nameplate: {
    primaryText: 'Jane Doe',
    secondaryText: 'Software Engineer',
    fontStyle: 'bold',
    primarySize: 8,
    secondarySize: 4,
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
    screwCount: 4,
    wallMount: false,
    wallMountKeyholeWidth: 6,
    fridgeMagnet: false,
    fridgeMagnetWidth: 20,
    fridgeMagnetHeight: 5,
    fridgeMagnetDepth: 1.5,
  },
  export: {
    separateParts: false,
    quality: 'high',
  },
  colors: {
    base: '#e6e6ea',
    border: '#e6e6ea',
    content: '#000000',
    text: '#000000',
    secondary: '#333333',
    logo: '#000000',
  },
};
