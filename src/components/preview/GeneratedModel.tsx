import { useMemo, useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFont } from '@react-three/drei';
import { generateQRMatrix, createQRGeometry, generateWifiString, generateVCardString } from '../../generators/qr-generator';
import {
  createBasePlateGeometry,
  createBasePlateWithRecesses,
  createKeychainTabGeometry,
  createBorderFrameGeometry,
  createScrewHoleGeometries,
  createWallMountGeometry,
  createFridgeMagnetGeometry,
  magnetMinThickness,
  type MagnetRecess,
} from '../../generators/base-generator';
import { buildTextGeometry, isItalic } from '../../generators/text-generator';
import { createSpotifyGeometryFromSvg, fetchSpotifySvg, parseSpotifyUri, type SpotifyGeometries } from '../../generators/spotify-generator';
import { encodeBarcode, createBarcodeGeometry } from '../../generators/barcode-generator';
import { loadImagePixels, type PixelGrid } from '../../generators/image-generator';
import { createLithophaneGeometry } from '../../generators/lithophane-generator';
import type { ModelConfig, FontStyle } from '../../types/model';

export interface GeneratedModelRef {
  getScene: () => THREE.Group | null;
}

interface GeneratedModelProps {
  config: ModelConfig;
}

// --- Shared helpers ---

function contentZ(base: ModelConfig['base'], content: ModelConfig['content'], embossed: boolean): number {
  return embossed
    ? base.thickness / 2
    : base.thickness / 2 + content.contentHeight / 2;
}

function baseZ(content: ModelConfig['content']): number {
  return content.mode === 'embossed' ? 0 : content.contentHeight / 2;
}

function contentPadding(base: ModelConfig['base']): number {
  const extra = base.borderEnabled ? 1.5 : 0;
  return base.borderWidth + extra;
}

function contentArea(base: ModelConfig['base']): { w: number; h: number } {
  const pad = contentPadding(base);
  let w = base.width - pad * 2;
  let h = base.height - pad * 2;
  if (base.shape === 'circle') {
    const inscribed = Math.min(w, h) * 0.707;
    w = inscribed;
    h = inscribed;
  } else if (base.shape === 'hexagon') {
    const inscribed = Math.min(w, h) * 0.866;
    w = inscribed;
    h = inscribed;
  } else if (base.shape === 'pentagon') {
    const inscribed = Math.min(w, h) * 0.809;
    w = inscribed;
    h = inscribed;
  }
  return { w: Math.max(w, 1), h: Math.max(h, 1) };
}

function fontUrl(style: FontStyle): string {
  const bold = style === 'bold' || style === 'bold-italic';
  return `${import.meta.env.BASE_URL}fonts/${bold ? 'helvetiker_bold' : 'helvetiker_regular'}.typeface.json`;
}

// --- Magnet position helper ---

function computeMagnetPositions(config: ModelConfig): [number, number][] {
  if (!config.magnets.enabled) return [];
  const radius = config.magnets.customDiameter / 2;
  const positions: [number, number][] = [];
  const useCircularLayout = config.base.shape === 'circle' || config.base.shape === 'hexagon' || config.base.shape === 'pentagon';

  if (useCircularLayout) {
    const plateR = Math.min(config.base.width, config.base.height) / 2 - radius - 2;
    if (config.magnets.position === 'center') {
      positions.push([0, 0]);
    } else {
      const count = Math.min(config.magnets.count, 8);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
        positions.push([Math.cos(angle) * plateR, Math.sin(angle) * plateR]);
      }
    }
  } else {
    const w = config.base.width / 2 - radius - 2;
    const h = config.base.height / 2 - radius - 2;
    if (config.magnets.position === 'corners') {
      const count = Math.min(config.magnets.count, 4);
      const corners: [number, number][] = [[-w, -h], [w, -h], [w, h], [-w, h]];
      for (let i = 0; i < count; i++) positions.push(corners[i]);
    } else if (config.magnets.position === 'edges') {
      const count = Math.min(config.magnets.count, 4);
      const edges: [number, number][] = [[0, -h], [w, 0], [0, h], [-w, 0]];
      for (let i = 0; i < count; i++) positions.push(edges[i]);
    } else {
      positions.push([0, 0]);
    }
  }
  return positions;
}

// --- Shared BaseMesh ---

function BaseMesh({ config }: { config: ModelConfig }) {
  const geometry = useMemo(() => {
    if (config.magnets.enabled) {
      const positions = computeMagnetPositions(config);
      const recesses: MagnetRecess[] = positions.map(([x, y]) => ({
        x, y,
        radius: config.magnets.customDiameter / 2,
        depth: config.magnets.customDepth,
      }));
      const effectiveThickness = Math.max(config.base.thickness, magnetMinThickness(config.magnets.customDepth));
      return createBasePlateWithRecesses(
        config.base.shape,
        config.base.width,
        config.base.height,
        effectiveThickness,
        config.base.cornerRadius,
        config.base.edgeTreatment,
        config.base.filletRadius,
        recesses,
      );
    }
    return createBasePlateGeometry(
      config.base.shape,
      config.base.width,
      config.base.height,
      config.base.thickness,
      config.base.cornerRadius,
      config.base.edgeTreatment,
      config.base.filletRadius,
    );
  }, [
    config.base.shape, config.base.width, config.base.height, config.base.thickness,
    config.base.cornerRadius, config.base.edgeTreatment, config.base.filletRadius,
    config.magnets.enabled, config.magnets.customDiameter, config.magnets.customDepth,
    config.magnets.position, config.magnets.count,
  ]);

  return (
    <mesh
      position={[0, 0, baseZ(config.content)]}
      rotation={[0, 0, 0]}
      userData={{ part: 'base' }}
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={config.colors.base} roughness={0.4} metalness={0.1} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
    </mesh>
  );
}

// --- Keychain tab for non-keychain shapes (physical tab with hole, same color as base) ---

function KeychainTabMesh({ config }: { config: ModelConfig }) {
  const geometry = useMemo(() => {
    if (!config.base.keychainHole) return null;
    return createKeychainTabGeometry(
      config.base.width,
      config.base.height,
      config.base.keychainHoleDiameter,
      config.base.thickness,
      config.base.shape,
    );
  }, [config.base.keychainHole, config.base.width, config.base.height, config.base.keychainHoleDiameter, config.base.thickness, config.base.shape]);

  if (!geometry) return null;

  return (
    <mesh position={[0, 0, baseZ(config.content)]} userData={{ part: 'base' }}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={config.colors.base} roughness={0.4} metalness={0.1} />
    </mesh>
  );
}

// --- Border frame (raised border on top of base) ---

function BorderFrameMesh({ config }: { config: ModelConfig }) {
  const geometry = useMemo(() => {
    if (!config.base.borderEnabled || config.base.borderWidth <= 0) return null;
    return createBorderFrameGeometry(
      config.base.shape,
      config.base.width,
      config.base.height,
      config.base.borderWidth,
      config.base.borderHeight,
      config.base.cornerRadius,
    );
  }, [
    config.base.borderEnabled,
    config.base.shape,
    config.base.width,
    config.base.height,
    config.base.borderWidth,
    config.base.borderHeight,
    config.base.cornerRadius,
  ]);

  if (!geometry) return null;

  const z = baseZ(config.content) + config.base.thickness / 2 + config.base.borderHeight / 2;

  return (
    <mesh position={[0, 0, z]} userData={{ part: 'border' }}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={config.colors.border} roughness={0.4} metalness={0.1} />
    </mesh>
  );
}

// --- Magnet holes (visual indicators — actual recesses are built into base plate geometry) ---

function MagnetHoles({ config }: { config: ModelConfig }) {
  const geometries = useMemo(() => {
    if (!config.magnets.enabled) return [];
    const positions = computeMagnetPositions(config);
    const radius = config.magnets.customDiameter / 2;
    const depth = config.magnets.customDepth;
    const effectiveThickness = Math.max(config.base.thickness, magnetMinThickness(depth));

    return positions.map(([x, y]) => {
      const geo = new THREE.CylinderGeometry(radius, radius, depth, 32);
      geo.rotateX(Math.PI / 2);
      geo.translate(x, y, -(effectiveThickness / 2) + depth / 2 - 0.01);
      return geo;
    });
  }, [config.magnets, config.base.width, config.base.height, config.base.thickness, config.base.shape]);

  return (
    <>
      {geometries.map((geo, i) => (
        <mesh key={i} position={[0, 0, baseZ(config.content)]} userData={{ part: 'ignore' }}>
          <primitive object={geo} attach="geometry" />
          <meshStandardMaterial color="#ff4444" roughness={0.5} transparent opacity={0.6} />
        </mesh>
      ))}
    </>
  );
}

// --- Mounting indicators (screw holes, wall mount, fridge magnet) ---

function MountingIndicators({ config }: { config: ModelConfig }) {
  const { mounting, base } = config;

  const screwGeos = useMemo(() => {
    if (!mounting.screwHoles) return [];
    return createScrewHoleGeometries(
      base.width, base.height, mounting.screwDiameter, base.thickness, mounting.screwCount, base.shape,
    );
  }, [mounting.screwHoles, mounting.screwDiameter, mounting.screwCount, base.width, base.height, base.thickness, base.shape]);

  const wallGeo = useMemo(() => {
    if (!mounting.wallMount) return null;
    return createWallMountGeometry(base.height, mounting.wallMountKeyholeWidth, base.thickness);
  }, [mounting.wallMount, mounting.wallMountKeyholeWidth, base.height, base.thickness]);

  const fridgeGeo = useMemo(() => {
    if (!mounting.fridgeMagnet) return null;
    return createFridgeMagnetGeometry(
      mounting.fridgeMagnetWidth, mounting.fridgeMagnetHeight, mounting.fridgeMagnetDepth, base.thickness,
    );
  }, [mounting.fridgeMagnet, mounting.fridgeMagnetWidth, mounting.fridgeMagnetHeight, mounting.fridgeMagnetDepth, base.thickness]);

  const bz = baseZ(config.content);

  return (
    <>
      {screwGeos.map((geo, i) => (
        <mesh key={i} position={[0, 0, bz]} userData={{ part: 'ignore' }}>
          <primitive object={geo} attach="geometry" />
          <meshStandardMaterial color="#ff4444" roughness={0.5} transparent opacity={0.6} />
        </mesh>
      ))}
      {wallGeo && (
        <mesh position={[0, 0, bz]} userData={{ part: 'ignore' }}>
          <primitive object={wallGeo} attach="geometry" />
          <meshStandardMaterial color="#4488ff" roughness={0.5} transparent opacity={0.7} />
        </mesh>
      )}
      {fridgeGeo && (
        <mesh position={[0, 0, bz]} userData={{ part: 'ignore' }}>
          <primitive object={fridgeGeo} attach="geometry" />
          <meshStandardMaterial color="#44bbff" roughness={0.5} transparent opacity={0.7} />
        </mesh>
      )}
    </>
  );
}

// --- QR Generator ---

function QRGeneratorGroup({ config }: { config: ModelConfig }) {
  const { w: areaW, h: areaH } = contentArea(config.base);

  const geometry = useMemo(() => {
    const text = config.content.text || 'Hello';
    try {
      const { matrix, moduleCount } = generateQRMatrix(text, config.content.errorCorrection);
      return createQRGeometry(
        matrix,
        moduleCount,
        areaW,
        areaH,
        0,
        config.content.contentHeight,
        config.content.mode === 'embossed',
      );
    } catch {
      const { matrix, moduleCount } = generateQRMatrix('Hello', config.content.errorCorrection);
      return createQRGeometry(
        matrix,
        moduleCount,
        areaW,
        areaH,
        0,
        config.content.contentHeight,
        config.content.mode === 'embossed',
      );
    }
  }, [
    config.content.text,
    config.content.errorCorrection,
    config.content.contentHeight,
    config.content.mode,
    areaW,
    areaH,
  ]);

  const embossed = config.content.mode === 'embossed';
  const labelBand = config.content.showQrLabel ? Math.min(areaH * 0.15, 9) : 0;
  const z = contentZ(config.base, config.content, embossed);

  return (
    <>
      <mesh position={[0, labelBand / 2, z]} userData={{ part: 'content' }}>
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial color={config.colors.content} roughness={0.3} metalness={0.2} />
      </mesh>
      {config.content.showQrLabel && config.content.qrLabel && (
        <TextContent
          text={config.content.qrLabel}
          fontStyle="regular"
          size={3.5}
          depth={config.content.contentHeight}
          maxWidth={areaW}
          maxHeight={labelBand * 0.75}
          position={[0, -areaH / 2 + labelBand / 2, z]}
          color={config.colors.text}
          part="text"
        />
      )}
    </>
  );
}

// --- Text Generator ---

function TextContent({
  text,
  fontStyle,
  size,
  depth,
  maxWidth,
  maxHeight,
  position,
  color,
  part = 'text',
}: {
  text: string;
  fontStyle: FontStyle;
  size: number;
  depth: number;
  maxWidth: number;
  maxHeight: number;
  position: [number, number, number];
  color: string;
  part?: string;
}) {
  const font = useFont(fontUrl(fontStyle));

  const geometry = useMemo(() => {
    const geo = buildTextGeometry(
      { text: text || ' ', font, size, depth },
      isItalic(fontStyle),
    );
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const w = bb.max.x - bb.min.x;
    const h = bb.max.y - bb.min.y;
    if (w > maxWidth || h > maxHeight) {
      const s = Math.min(maxWidth / Math.max(w, 0.001), maxHeight / Math.max(h, 0.001));
      geo.scale(s, s, 1);
    }
    return geo;
  }, [text, font, size, depth, maxWidth, maxHeight, fontStyle]);

  return (
    <mesh position={position} userData={{ part }}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
    </mesh>
  );
}

function TextGeneratorGroup({ config }: { config: ModelConfig }) {
  const embossed = config.content.mode === 'embossed';
  const depth = config.content.contentHeight;
  const { w: areaW, h: areaH } = contentArea(config.base);

  return (
    <TextContent
      text={config.text.text}
      fontStyle={config.text.fontStyle}
      size={config.text.size}
      depth={depth}
      maxWidth={areaW}
      maxHeight={areaH}
      position={[0, 0, contentZ(config.base, config.content, embossed)]}
      color={config.colors.text}
      part="text"
    />
  );
}

// --- Spotify Generator ---

/**
 * Fetch the Spotify scannable SVG for a given URL. Returns null when the
 * URL is invalid or the fetch fails. Vector path (SVGLoader) downstream
 * keeps the bars and logo crisp at any plate size.
 */
function useSpotifySvg(url: string): string | null {
  const [svgText, setSvgText] = useState<string | null>(null);

  useEffect(() => {
    const uri = parseSpotifyUri(url);
    if (!uri) {
      Promise.resolve().then(() => setSvgText(null));
      return;
    }

    let cancelled = false;
    fetchSpotifySvg(uri)
      .then((text) => {
        if (!cancelled) setSvgText(text);
      })
      .catch(() => {
        if (!cancelled) setSvgText(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return svgText;
}

function SpotifyGeneratorGroup({ config }: { config: ModelConfig }) {
  const embossed = config.content.mode === 'embossed';
  const svgText = useSpotifySvg(config.spotify.url);
  const { w: areaW, h: areaH } = contentArea(config.base);

  const geometries = useMemo((): SpotifyGeometries => {
    const empty: SpotifyGeometries = {
      bars: new THREE.BufferGeometry(),
      logo: new THREE.BufferGeometry(),
    };
    if (!svgText) return empty;
    try {
      return createSpotifyGeometryFromSvg(
        svgText,
        areaW,
        areaH,
        0,
        config.content.contentHeight,
        config.spotify.showLogo,
        embossed,
      );
    } catch {
      return empty;
    }
  }, [
    svgText,
    areaW,
    areaH,
    config.content.contentHeight,
    config.spotify.showLogo,
    embossed,
  ]);

  const z = contentZ(config.base, config.content, embossed);

  return (
    <>
      <mesh position={[0, 0, z]} userData={{ part: 'content' }}>
        <primitive object={geometries.bars} attach="geometry" />
        <meshStandardMaterial color={config.colors.content} roughness={0.3} metalness={0.2} />
      </mesh>
      {config.spotify.showLogo && (
        <mesh position={[0, 0, z + 0.01]} userData={{ part: 'logo' }}>
          <primitive object={geometries.logo} attach="geometry" />
          <meshStandardMaterial color={config.colors.logo} roughness={0.3} metalness={0.2} />
        </mesh>
      )}
    </>
  );
}

// --- WiFi Generator ---

function WifiGeneratorGroup({ config }: { config: ModelConfig }) {
  const embossed = config.content.mode === 'embossed';
  const depth = config.content.contentHeight;
  const { w: areaW, h: areaH } = contentArea(config.base);
  const textBandHeight = config.wifi.showText ? Math.min(areaH * 0.2, 12) : 0;

  const wifiString = useMemo(
    () => generateWifiString(config.wifi.ssid, config.wifi.password, config.wifi.encryption, config.wifi.hidden),
    [config.wifi.ssid, config.wifi.password, config.wifi.encryption, config.wifi.hidden],
  );

  const qrGeometry = useMemo(() => {
    try {
      const { matrix, moduleCount } = generateQRMatrix(wifiString || 'WIFI', 'M');
      const qrH = areaH - textBandHeight;
      const qrSize = Math.min(qrH, areaW);
      return createQRGeometry(
        matrix,
        moduleCount,
        qrSize,
        qrSize,
        0,
        depth,
        embossed,
      );
    } catch {
      const { matrix, moduleCount } = generateQRMatrix('WIFI', 'M');
      return createQRGeometry(matrix, moduleCount, 20, 20, 0, depth, embossed);
    }
  }, [wifiString, areaW, areaH, depth, embossed, textBandHeight]);

  const qrYOffset = textBandHeight / 2;
  const z = contentZ(config.base, config.content, embossed);

  return (
    <>
      <mesh position={[0, qrYOffset, z]} userData={{ part: 'content' }}>
        <primitive object={qrGeometry} attach="geometry" />
        <meshStandardMaterial color={config.colors.content} roughness={0.3} metalness={0.2} />
      </mesh>
      {config.wifi.showText && (
        <TextContent
          text={config.wifi.ssid || 'WiFi'}
          fontStyle="bold"
          size={4}
          depth={depth}
          maxWidth={areaW}
          maxHeight={textBandHeight * 0.8}
          position={[0, -areaH / 2 + textBandHeight / 2, z]}
          color={config.colors.text}
          part="text"
        />
      )}
    </>
  );
}

// --- vCard Generator ---

function VCardGeneratorGroup({ config }: { config: ModelConfig }) {
  const embossed = config.content.mode === 'embossed';
  const depth = config.content.contentHeight;
  const { w: areaW, h: areaH } = contentArea(config.base);
  const textBandHeight = config.vcard.showText ? Math.min(areaH * 0.22, 14) : 0;

  const vcardString = useMemo(
    () =>
      generateVCardString(
        config.vcard.firstName,
        config.vcard.lastName,
        config.vcard.phone,
        config.vcard.email,
        config.vcard.organization,
        config.vcard.url,
      ),
    [config.vcard],
  );

  const qrGeometry = useMemo(() => {
    try {
      const { matrix, moduleCount } = generateQRMatrix(vcardString || 'CONTACT', 'M');
      const qrH = areaH - textBandHeight;
      const qrSize = Math.min(qrH, areaW);
      return createQRGeometry(matrix, moduleCount, qrSize, qrSize, 0, depth, embossed);
    } catch {
      const { matrix, moduleCount } = generateQRMatrix('CONTACT', 'M');
      return createQRGeometry(matrix, moduleCount, 20, 20, 0, depth, embossed);
    }
  }, [vcardString, areaW, areaH, depth, embossed, textBandHeight]);

  const qrYOffset = textBandHeight / 2;
  const z = contentZ(config.base, config.content, embossed);
  const fullName = `${config.vcard.firstName} ${config.vcard.lastName}`.trim() || 'Contact';

  return (
    <>
      <mesh position={[0, qrYOffset, z]} userData={{ part: 'content' }}>
        <primitive object={qrGeometry} attach="geometry" />
        <meshStandardMaterial color={config.colors.content} roughness={0.3} metalness={0.2} />
      </mesh>
      {config.vcard.showText && (
        <TextContent
          text={fullName}
          fontStyle="bold"
          size={5}
          depth={depth}
          maxWidth={areaW}
          maxHeight={textBandHeight * 0.8}
          position={[0, -areaH / 2 + textBandHeight / 2, z]}
          color={config.colors.text}
          part="text"
        />
      )}
    </>
  );
}

// --- Nameplate Generator ---

function NameplateGeneratorGroup({ config }: { config: ModelConfig }) {
  const embossed = config.content.mode === 'embossed';
  const depth = config.content.contentHeight;
  const { w: areaW, h: areaH } = contentArea(config.base);
  const halfH = areaH / 2;
  const z = contentZ(config.base, config.content, embossed);

  const hasSecondary = config.nameplate.secondaryText.length > 0;

  const primaryY = hasSecondary ? halfH * 0.2 : 0;
  const secondaryY = -halfH * 0.4;

  return (
    <>
      <TextContent
        text={config.nameplate.primaryText || 'Name'}
        fontStyle={config.nameplate.fontStyle}
        size={config.nameplate.primarySize}
        depth={depth}
        maxWidth={areaW}
        maxHeight={halfH * 0.9}
        position={[0, primaryY, z]}
        color={config.colors.text}
        part="text"
      />
      {hasSecondary && (
        <TextContent
          text={config.nameplate.secondaryText}
          fontStyle="regular"
          size={config.nameplate.secondarySize}
          depth={depth}
          maxWidth={areaW}
          maxHeight={halfH * 0.5}
          position={[0, secondaryY, z]}
          color={config.colors.secondary}
          part="secondary"
        />
      )}
    </>
  );
}

// --- Barcode Generator ---

function BarcodeGeneratorGroup({ config }: { config: ModelConfig }) {
  const embossed = config.content.mode === 'embossed';
  const depth = config.content.contentHeight;
  const { w: areaW, h: areaH } = contentArea(config.base);
  const reservedBottom = config.barcode.showText ? Math.min(areaH * 0.18, 10) : 0;

  const barcodeGeometry = useMemo(() => {
    const pattern = encodeBarcode(config.barcode.text || 'HELLO', config.barcode.format);
    return createBarcodeGeometry(
      pattern,
      areaW,
      areaH,
      0,
      reservedBottom,
      depth,
      embossed,
    );
  }, [config.barcode.text, config.barcode.format, areaW, areaH, depth, embossed, reservedBottom]);

  const z = contentZ(config.base, config.content, embossed);

  return (
    <>
      <mesh position={[0, 0, z]} userData={{ part: 'content' }}>
        <primitive object={barcodeGeometry} attach="geometry" />
        <meshStandardMaterial color={config.colors.content} roughness={0.3} metalness={0.2} />
      </mesh>
      {config.barcode.showText && (
        <TextContent
          text={config.barcode.text || 'HELLO'}
          fontStyle="regular"
          size={3.5}
          depth={depth}
          maxWidth={areaW}
          maxHeight={reservedBottom * 0.7}
          position={[0, -areaH / 2 + reservedBottom / 2, z]}
          color={config.colors.text}
          part="text"
        />
      )}
    </>
  );
}

// --- Shared image pixel loader (used by lithophane) ---

function useImagePixels(dataUrl: string, resolution: number): PixelGrid | null {
  const [pixels, setPixels] = useState<PixelGrid | null>(null);

  useEffect(() => {
    if (!dataUrl) {
      Promise.resolve().then(() => setPixels(null));
      return;
    }
    let cancelled = false;
    loadImagePixels(dataUrl, resolution).then((p) => {
      if (!cancelled) setPixels(p);
    }).catch(() => {
      if (!cancelled) setPixels(null);
    });
    return () => { cancelled = true; };
  }, [dataUrl, resolution]);

  return pixels;
}

// --- Lithophane Generator ---

function LithophaneGeneratorGroup({ config }: { config: ModelConfig }) {
  const pixels = useImagePixels(config.lithophane.dataUrl, config.lithophane.resolution);

  const geometry = useMemo(() => {
    if (!pixels) return new THREE.BufferGeometry();
    return createLithophaneGeometry(
      pixels,
      config.base.width,
      config.base.height,
      config.lithophane.minThickness,
      config.lithophane.maxThickness,
      config.lithophane.invert,
    );
  }, [pixels, config.base.width, config.base.height, config.lithophane.minThickness, config.lithophane.maxThickness, config.lithophane.invert]);

  const z = config.base.thickness / 2;

  return (
    <mesh position={[0, 0, z]} userData={{ part: 'content' }}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={config.colors.content || config.colors.base} roughness={0.5} metalness={0.05} />
    </mesh>
  );
}

// --- Map Generator ---

function useMapGeometries(config: ModelConfig) {
  const [geometries, setGeometries] = useState<{ streets: THREE.BufferGeometry; buildings: THREE.BufferGeometry } | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (config.generator !== 'map') {
      setGeometries(null);
      setLoading(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    setLoading(true);

    debounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      import('../../generators/map-generator').then(async (mod) => {
        try {
          const result = await mod.fetchAndBuildMap(
            config.map,
            config.base.width,
            config.base.height,
            config.base.borderWidth,
            config.content.contentHeight,
            config.content.mode === 'embossed',
            controller.signal,
          );
          if (!controller.signal.aborted) {
            setGeometries({ streets: result.streets, buildings: result.buildings });
            setLoading(false);
          }
        } catch {
          if (!controller.signal.aborted) {
            setGeometries(null);
            setLoading(false);
          }
        }
      });
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [
    config.generator, config.map, config.base.width, config.base.height,
    config.base.borderWidth, config.content.contentHeight, config.content.mode,
  ]);

  return { geometries, loading };
}

function MapLoadingIndicator({ config }: { config: ModelConfig }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const z = config.base.thickness / 2 + 3;

  useEffect(() => {
    let frameId: number;
    const animate = () => {
      if (meshRef.current) {
        meshRef.current.rotation.z += 0.03;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <mesh ref={meshRef} position={[0, 0, z]} userData={{ part: 'ignore' }}>
      <torusGeometry args={[4, 0.5, 8, 32, Math.PI * 1.5]} />
      <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.2} />
    </mesh>
  );
}

function MapGeneratorGroup({ config }: { config: ModelConfig }) {
  const embossed = config.content.mode === 'embossed';
  const { geometries: geos, loading } = useMapGeometries(config);
  const z = contentZ(config.base, config.content, embossed);

  const hasStreets = geos?.streets && geos.streets.attributes.position && geos.streets.attributes.position.count > 0;
  const hasBuildings = geos?.buildings && geos.buildings.attributes.position && geos.buildings.attributes.position.count > 0;

  return (
    <>
      {loading && <MapLoadingIndicator config={config} />}
      {hasStreets && (
        <mesh position={[0, 0, z]} userData={{ part: 'content' }}>
          <primitive object={geos!.streets} attach="geometry" />
          <meshStandardMaterial color={config.colors.content} roughness={0.3} metalness={0.2} />
        </mesh>
      )}
      {hasBuildings && (
        <mesh position={[0, 0, z]} userData={{ part: 'secondary' }}>
          <primitive object={geos!.buildings} attach="geometry" />
          <meshStandardMaterial color={config.colors.secondary} roughness={0.3} metalness={0.2} />
        </mesh>
      )}
    </>
  );
}

// --- Main dispatcher ---

export const GeneratedModel = forwardRef<GeneratedModelRef, GeneratedModelProps>(
  ({ config }, ref) => {
    const groupRef = useRef<THREE.Group>(null);

    useImperativeHandle(ref, () => ({
      getScene: () => groupRef.current,
    }));

    return (
      <group ref={groupRef}>
        <BaseMesh config={config} />
        <BorderFrameMesh config={config} />
        <KeychainTabMesh config={config} />
        <MagnetHoles config={config} />
        <MountingIndicators config={config} />

        {config.generator === 'qr' && <QRGeneratorGroup config={config} />}
        {config.generator === 'text' && <TextGeneratorGroup config={config} />}
        {config.generator === 'spotify' && <SpotifyGeneratorGroup config={config} />}
        {config.generator === 'wifi' && <WifiGeneratorGroup config={config} />}
        {config.generator === 'vcard' && <VCardGeneratorGroup config={config} />}
        {config.generator === 'lithophane' && <LithophaneGeneratorGroup config={config} />}
        {config.generator === 'barcode' && <BarcodeGeneratorGroup config={config} />}
        {config.generator === 'nameplate' && <NameplateGeneratorGroup config={config} />}
        {config.generator === 'map' && <MapGeneratorGroup config={config} />}
      </group>
    );
  }
);

GeneratedModel.displayName = 'GeneratedModel';
