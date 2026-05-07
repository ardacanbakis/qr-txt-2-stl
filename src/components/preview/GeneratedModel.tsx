import { useMemo, useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFont, Html } from '@react-three/drei';
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
  MAGNET_TOLERANCE_DIAMETER,
  MAGNET_TOLERANCE_DEPTH,
  type MagnetRecess,
} from '../../generators/base-generator';
import { buildTextGeometry, isItalic } from '../../generators/text-generator';
import { createSpotifyGeometryFromSvg, fetchSpotifySvg, parseSpotifyUri, type SpotifyGeometries } from '../../generators/spotify-generator';
import { encodeBarcode, createBarcodeGeometry } from '../../generators/barcode-generator';
import { loadImagePixels, type PixelGrid, type ImageProcessingOptions } from '../../generators/image-generator';
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
      const tolerancedRadius = (config.magnets.customDiameter + MAGNET_TOLERANCE_DIAMETER) / 2;
      const tolerancedDepth = config.magnets.customDepth + MAGNET_TOLERANCE_DEPTH;
      const recesses: MagnetRecess[] = positions.map(([x, y]) => ({
        x, y,
        radius: tolerancedRadius,
        depth: tolerancedDepth,
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
  useEffect(() => () => { geometry.dispose(); }, [geometry]);

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
  useEffect(() => () => { geometry?.dispose(); }, [geometry]);

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
  useEffect(() => () => { geometry?.dispose(); }, [geometry]);

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
    const radius = (config.magnets.customDiameter + MAGNET_TOLERANCE_DIAMETER) / 2;
    const depth = config.magnets.customDepth + MAGNET_TOLERANCE_DEPTH;
    const effectiveThickness = Math.max(config.base.thickness, magnetMinThickness(config.magnets.customDepth));

    return positions.map(([x, y]) => {
      const geo = new THREE.CylinderGeometry(radius, radius, depth, 32);
      geo.rotateX(Math.PI / 2);
      geo.translate(x, y, -(effectiveThickness / 2) + depth / 2 - 0.01);
      return geo;
    });
  }, [config.magnets, config.base.width, config.base.height, config.base.thickness, config.base.shape]);
  useEffect(() => () => { geometries.forEach(g => g.dispose()); }, [geometries]);

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
  useEffect(() => () => { screwGeos.forEach(g => g.dispose()); }, [screwGeos]);

  const wallGeo = useMemo(() => {
    if (!mounting.wallMount) return null;
    return createWallMountGeometry(base.height, mounting.wallMountKeyholeWidth, base.thickness);
  }, [mounting.wallMount, mounting.wallMountKeyholeWidth, base.height, base.thickness]);
  useEffect(() => () => { wallGeo?.dispose(); }, [wallGeo]);

  const fridgeGeo = useMemo(() => {
    if (!mounting.fridgeMagnet) return null;
    return createFridgeMagnetGeometry(
      mounting.fridgeMagnetWidth + MAGNET_TOLERANCE_DIAMETER,
      mounting.fridgeMagnetHeight + MAGNET_TOLERANCE_DIAMETER,
      mounting.fridgeMagnetDepth + MAGNET_TOLERANCE_DEPTH,
      base.thickness,
    );
  }, [mounting.fridgeMagnet, mounting.fridgeMagnetWidth, mounting.fridgeMagnetHeight, mounting.fridgeMagnetDepth, base.thickness]);
  useEffect(() => () => { fridgeGeo?.dispose(); }, [fridgeGeo]);

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
  const embossed = config.content.mode === 'embossed';
  const depth = config.content.contentHeight;
  const textBandHeight = config.content.showQrLabel ? Math.min(areaH * 0.2, 10) : 0;
  const gap = textBandHeight > 0 ? 1.5 : 0;

  const geometry = useMemo(() => {
    const text = config.content.text || 'Hello';
    const qrH = areaH - textBandHeight - gap;
    const qrSize = Math.min(areaW, qrH);
    try {
      const { matrix, moduleCount } = generateQRMatrix(text, config.content.errorCorrection);
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
      const { matrix, moduleCount } = generateQRMatrix('Hello', config.content.errorCorrection);
      return createQRGeometry(
        matrix,
        moduleCount,
        qrSize,
        qrSize,
        0,
        depth,
        embossed,
      );
    }
  }, [
    config.content.text,
    config.content.errorCorrection,
    depth,
    embossed,
    areaW,
    areaH,
    textBandHeight,
    gap,
  ]);
  useEffect(() => () => { geometry.dispose(); }, [geometry]);

  const qrYOffset = (textBandHeight + gap) / 2;
  const z = contentZ(config.base, config.content, embossed);

  return (
    <>
      <mesh position={[0, qrYOffset, z]} userData={{ part: 'content' }}>
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial color={config.colors.content} roughness={0.3} metalness={0.2} />
      </mesh>
      {config.content.showQrLabel && config.content.qrLabel && (
        <TextContent
          text={config.content.qrLabel}
          fontStyle="regular"
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
    if (geo.boundingBox) {
      const bb = geo.boundingBox;
      const w = bb.max.x - bb.min.x;
      const h = bb.max.y - bb.min.y;
      if (w > maxWidth || h > maxHeight) {
        const s = Math.min(maxWidth / Math.max(w, 0.001), maxHeight / Math.max(h, 0.001));
        geo.scale(s, s, 1);
      }
    }
    return geo;
  }, [text, font, size, depth, maxWidth, maxHeight, fontStyle]);
  useEffect(() => () => { geometry.dispose(); }, [geometry]);

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
function useSpotifySvg(url: string): { svgText: string | null; loading: boolean; error: boolean } {
  const [svgText, setSvgText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const uri = parseSpotifyUri(url);
    if (!uri) {
      setSvgText(null);
      setLoading(false);
      setError(false);
      return;
    }

    const controller = new AbortController();
    setSvgText(null);
    setLoading(true);
    setError(false);

    fetchSpotifySvg(uri, controller.signal)
      .then((text) => {
        setSvgText(text);
        setLoading(false);
      })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return;
        setSvgText(null);
        setLoading(false);
        setError(true);
      });

    return () => {
      controller.abort();
    };
  }, [url]);

  return { svgText, loading, error };
}

function SpotifyGeneratorGroup({ config }: { config: ModelConfig }) {
  const embossed = config.content.mode === 'embossed';
  const { svgText, loading, error } = useSpotifySvg(config.spotify.url);
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
  useEffect(() => () => { geometries.bars.dispose(); geometries.logo.dispose(); }, [geometries]);

  const z = contentZ(config.base, config.content, embossed);
  const hasUrl = !!parseSpotifyUri(config.spotify.url);

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
      {hasUrl && loading && (
        <Html center position={[0, 0, config.base.thickness / 2 + 1]}>
          <div style={{ background: 'rgba(0,0,0,0.7)', color: '#22d3ee', padding: '6px 12px', borderRadius: 6, fontSize: 12, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            Fetching Spotify code…
          </div>
        </Html>
      )}
      {hasUrl && error && (
        <Html center position={[0, 0, config.base.thickness / 2 + 1]}>
          <div style={{ background: 'rgba(0,0,0,0.7)', color: '#f87171', padding: '6px 12px', borderRadius: 6, fontSize: 12, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            Could not fetch Spotify code — check the URL
          </div>
        </Html>
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
  useEffect(() => () => { qrGeometry.dispose(); }, [qrGeometry]);

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
  useEffect(() => () => { qrGeometry.dispose(); }, [qrGeometry]);

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
  useEffect(() => () => { barcodeGeometry.dispose(); }, [barcodeGeometry]);

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

function useImagePixels(
  dataUrl: string,
  resolution: number,
  opts?: Partial<ImageProcessingOptions>,
): PixelGrid | null {
  const [pixels, setPixels] = useState<PixelGrid | null>(null);
  // Serialize opts so useEffect dep comparison works on primitives
  const optsKey = JSON.stringify(opts);

  useEffect(() => {
    if (!dataUrl) {
      setPixels(null);
      return;
    }
    let active = true;
    loadImagePixels(dataUrl, resolution, opts)
      .then((p) => { if (active) setPixels(p); })
      .catch(() => { if (active) setPixels(null); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUrl, resolution, optsKey]);

  return pixels;
}

// --- Lithophane Generator ---

function LithophaneGeneratorGroup({ config }: { config: ModelConfig }) {
  const litho = config.lithophane;
  const processingOpts: Partial<ImageProcessingOptions> = {
    brightness: litho.brightness,
    contrast: litho.contrast,
    gamma: litho.gamma,
    sharpen: litho.sharpen,
    flipH: litho.flipH,
    flipV: litho.flipV,
  };

  const pixels = useImagePixels(litho.dataUrl, litho.resolution, processingOpts);

  const geometry = useMemo(() => {
    if (!pixels) return new THREE.BufferGeometry();
    return createLithophaneGeometry(
      pixels,
      config.base.width,
      config.base.height,
      litho.minThickness,
      litho.maxThickness,
      litho.invert,
    );
  }, [
    pixels,
    config.base.width,
    config.base.height,
    litho.minThickness,
    litho.maxThickness,
    litho.invert,
  ]);
  useEffect(() => () => { geometry.dispose(); }, [geometry]);

  // Center the lithophane at z=0: back face at z=-maxThickness/2, front at z=+maxThickness/2
  const centerZ = -litho.maxThickness / 2;

  return (
    <>
      {litho.backlitPreview && (
        <pointLight
          position={[0, 0, centerZ - litho.maxThickness - 15]}
          intensity={3}
          color="#fff5e0"
          distance={120}
          decay={2}
        />
      )}
      <mesh position={[0, 0, centerZ]} userData={{ part: 'content' }}>
        <primitive object={geometry} attach="geometry" />
        {litho.backlitPreview ? (
          <meshStandardMaterial
            vertexColors
            roughness={0.05}
            metalness={0.0}
            emissive="#ffe8cc"
            emissiveIntensity={0.08}
          />
        ) : (
          <meshStandardMaterial
            color={config.colors.content || '#f5f5f0'}
            roughness={0.4}
            metalness={0.05}
          />
        )}
      </mesh>
    </>
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

    // Lithophane IS the plate — skip the base mesh to avoid double-layer
    const isLitho = config.generator === 'lithophane';

    return (
      <group ref={groupRef}>
        {!isLitho && <BaseMesh config={config} />}
        {!isLitho && <BorderFrameMesh config={config} />}
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
