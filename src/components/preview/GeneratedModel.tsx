import { useMemo, useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFont } from '@react-three/drei';
import { generateQRMatrix, createQRGeometry, generateWifiString, generateVCardString } from '../../generators/qr-generator';
import { createBasePlateGeometry } from '../../generators/base-generator';
import { buildTextGeometry, isItalic } from '../../generators/text-generator';
import { createSpotifyGeometryFromSvg, fetchSpotifySvg, parseSpotifyUri } from '../../generators/spotify-generator';
import { encodeBarcode, createBarcodeGeometry } from '../../generators/barcode-generator';
import { loadImagePixels, createImageSilhouetteGeometry, type PixelGrid } from '../../generators/image-generator';
import { createLithophaneGeometry } from '../../generators/lithophane-generator';
import type { ModelConfig, FontStyle } from '../../types/model';

export interface GeneratedModelRef {
  getScene: () => THREE.Group | null;
}

interface GeneratedModelProps {
  config: ModelConfig;
}

// --- Shared helpers ---

const CONTENT_COLOR = '#1a1a2e';
const BASE_COLOR = '#e6e6ea';
const TEXT_COLOR = '#0f172a';

function contentZ(base: ModelConfig['base'], content: ModelConfig['content'], embossed: boolean): number {
  return embossed
    ? base.thickness / 2
    : base.thickness / 2 + content.contentHeight / 2;
}

function baseZ(content: ModelConfig['content']): number {
  return content.mode === 'embossed' ? 0 : content.contentHeight / 2;
}

function fontUrl(style: FontStyle): string {
  const bold = style === 'bold' || style === 'bold-italic';
  return `${import.meta.env.BASE_URL}fonts/${bold ? 'helvetiker_bold' : 'helvetiker_regular'}.typeface.json`;
}

// --- Shared BaseMesh ---

function BaseMesh({ config }: { config: ModelConfig }) {
  const geometry = useMemo(
    () =>
      createBasePlateGeometry(
        config.base.shape,
        config.base.width,
        config.base.height,
        config.base.thickness,
        config.base.cornerRadius,
      ),
    [config.base.shape, config.base.width, config.base.height, config.base.thickness, config.base.cornerRadius],
  );

  return (
    <mesh
      position={[0, 0, baseZ(config.content)]}
      rotation={config.base.shape === 'circle' ? [Math.PI / 2, 0, 0] : [0, 0, 0]}
      userData={{ part: 'base' }}
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={BASE_COLOR} roughness={0.4} metalness={0.1} />
    </mesh>
  );
}

// --- Magnet holes (visual only) ---

function MagnetHoles({ config }: { config: ModelConfig }) {
  const geometries = useMemo(() => {
    if (!config.magnets.enabled) return [];

    const diameter = config.magnets.customDiameter;
    const depth = config.magnets.customDepth;
    const radius = diameter / 2;
    const positions: [number, number][] = [];

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

    return positions.map(([x, y]) => {
      const geo = new THREE.CylinderGeometry(radius, radius, depth, 32);
      geo.rotateX(Math.PI / 2);
      geo.translate(x, y, -(config.base.thickness / 2) + depth / 2 - 0.01);
      return geo;
    });
  }, [config.magnets, config.base.width, config.base.height, config.base.thickness]);

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

// --- QR Generator ---

function QRGeneratorGroup({ config }: { config: ModelConfig }) {
  const geometry = useMemo(() => {
    const text = config.content.text || 'Hello';
    try {
      const { matrix, moduleCount } = generateQRMatrix(text, config.content.errorCorrection);
      return createQRGeometry(
        matrix,
        moduleCount,
        config.base.width,
        config.base.height,
        config.base.borderWidth,
        config.content.contentHeight,
        config.content.mode === 'embossed',
      );
    } catch {
      const { matrix, moduleCount } = generateQRMatrix('Hello', config.content.errorCorrection);
      return createQRGeometry(
        matrix,
        moduleCount,
        config.base.width,
        config.base.height,
        config.base.borderWidth,
        config.content.contentHeight,
        config.content.mode === 'embossed',
      );
    }
  }, [
    config.content.text,
    config.content.errorCorrection,
    config.content.contentHeight,
    config.content.mode,
    config.base.width,
    config.base.height,
    config.base.borderWidth,
  ]);

  const embossed = config.content.mode === 'embossed';

  return (
    <mesh position={[0, 0, contentZ(config.base, config.content, embossed)]} userData={{ part: 'content' }}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={CONTENT_COLOR} roughness={0.3} metalness={0.2} />
    </mesh>
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
  color = TEXT_COLOR,
  part = 'text',
}: {
  text: string;
  fontStyle: FontStyle;
  size: number;
  depth: number;
  maxWidth: number;
  maxHeight: number;
  position: [number, number, number];
  color?: string;
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
  const availW = config.base.width - config.base.borderWidth * 2;
  const availH = config.base.height - config.base.borderWidth * 2;

  return (
    <TextContent
      text={config.text.text}
      fontStyle={config.text.fontStyle}
      size={config.text.size}
      depth={depth}
      maxWidth={availW}
      maxHeight={availH}
      position={[0, 0, contentZ(config.base, config.content, embossed)]}
      part="text"
    />
  );
}

// --- Spotify Generator ---

function useSpotifySvg(url: string): { svgText: string | null; error: string | null } {
  const [svgText, setSvgText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const uri = parseSpotifyUri(url);
    if (!uri) {
      Promise.resolve().then(() => {
        setSvgText(null);
        setError('Invalid Spotify URL or URI');
      });
      return;
    }

    let cancelled = false;
    fetchSpotifySvg(uri)
      .then((text) => {
        if (!cancelled) {
          setSvgText(text);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setSvgText(null);
          setError(e.message || 'Failed to fetch Spotify scannable');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { svgText, error };
}

function SpotifyGeneratorGroup({ config }: { config: ModelConfig }) {
  const embossed = config.content.mode === 'embossed';
  const { svgText } = useSpotifySvg(config.spotify.url);

  const geometry = useMemo(() => {
    if (!svgText) return new THREE.BufferGeometry();
    try {
      return createSpotifyGeometryFromSvg(
        svgText,
        config.base.width,
        config.base.height,
        config.base.borderWidth,
        config.content.contentHeight,
        config.spotify.showLogo,
      );
    } catch {
      return new THREE.BufferGeometry();
    }
  }, [
    svgText,
    config.base.width,
    config.base.height,
    config.base.borderWidth,
    config.content.contentHeight,
    config.spotify.showLogo,
  ]);

  return (
    <mesh position={[0, 0, contentZ(config.base, config.content, embossed)]} userData={{ part: 'content' }}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={CONTENT_COLOR} roughness={0.3} metalness={0.2} />
    </mesh>
  );
}

// --- WiFi Generator ---

function WifiGeneratorGroup({ config }: { config: ModelConfig }) {
  const embossed = config.content.mode === 'embossed';
  const depth = config.content.contentHeight;
  const textBandHeight = config.wifi.showText ? Math.min(config.base.height * 0.2, 12) : 0;
  const availW = config.base.width - config.base.borderWidth * 2;

  const wifiString = useMemo(
    () => generateWifiString(config.wifi.ssid, config.wifi.password, config.wifi.encryption, config.wifi.hidden),
    [config.wifi.ssid, config.wifi.password, config.wifi.encryption, config.wifi.hidden],
  );

  const qrGeometry = useMemo(() => {
    try {
      const { matrix, moduleCount } = generateQRMatrix(wifiString || 'WIFI', 'M');
      const qrHeight = config.base.height - textBandHeight - config.base.borderWidth * 2;
      const qrSize = Math.min(qrHeight, availW);
      // Use a virtual plate matched to QR size so createQRGeometry centers correctly.
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
  }, [wifiString, config.base.height, config.base.borderWidth, availW, depth, embossed, textBandHeight]);

  const qrYOffset = textBandHeight / 2;
  const z = contentZ(config.base, config.content, embossed);

  return (
    <>
      <mesh position={[0, qrYOffset, z]} userData={{ part: 'content' }}>
        <primitive object={qrGeometry} attach="geometry" />
        <meshStandardMaterial color={CONTENT_COLOR} roughness={0.3} metalness={0.2} />
      </mesh>
      {config.wifi.showText && (
        <TextContent
          text={config.wifi.ssid || 'WiFi'}
          fontStyle="bold"
          size={4}
          depth={depth}
          maxWidth={availW}
          maxHeight={textBandHeight * 0.8}
          position={[0, -config.base.height / 2 + textBandHeight / 2 + config.base.borderWidth / 2, z]}
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
  const textBandHeight = config.vcard.showText ? Math.min(config.base.height * 0.22, 14) : 0;
  const availW = config.base.width - config.base.borderWidth * 2;

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
      const qrHeight = config.base.height - textBandHeight - config.base.borderWidth * 2;
      const qrSize = Math.min(qrHeight, availW);
      return createQRGeometry(matrix, moduleCount, qrSize, qrSize, 0, depth, embossed);
    } catch {
      const { matrix, moduleCount } = generateQRMatrix('CONTACT', 'M');
      return createQRGeometry(matrix, moduleCount, 20, 20, 0, depth, embossed);
    }
  }, [vcardString, config.base.height, config.base.borderWidth, availW, depth, embossed, textBandHeight]);

  const qrYOffset = textBandHeight / 2;
  const z = contentZ(config.base, config.content, embossed);
  const fullName = `${config.vcard.firstName} ${config.vcard.lastName}`.trim() || 'Contact';

  return (
    <>
      <mesh position={[0, qrYOffset, z]} userData={{ part: 'content' }}>
        <primitive object={qrGeometry} attach="geometry" />
        <meshStandardMaterial color={CONTENT_COLOR} roughness={0.3} metalness={0.2} />
      </mesh>
      {config.vcard.showText && (
        <TextContent
          text={fullName}
          fontStyle="bold"
          size={5}
          depth={depth}
          maxWidth={availW}
          maxHeight={textBandHeight * 0.8}
          position={[0, -config.base.height / 2 + textBandHeight / 2 + config.base.borderWidth / 2, z]}
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
  const availW = config.base.width - config.base.borderWidth * 2;
  const halfH = config.base.height / 2 - config.base.borderWidth;
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
        maxWidth={availW}
        maxHeight={halfH * 0.9}
        position={[0, primaryY, z]}
        part="text"
      />
      {hasSecondary && (
        <TextContent
          text={config.nameplate.secondaryText}
          fontStyle="regular"
          size={config.nameplate.secondarySize}
          depth={depth}
          maxWidth={availW}
          maxHeight={halfH * 0.5}
          position={[0, secondaryY, z]}
          part="secondary"
          color="#334155"
        />
      )}
    </>
  );
}

// --- Barcode Generator ---

function BarcodeGeneratorGroup({ config }: { config: ModelConfig }) {
  const embossed = config.content.mode === 'embossed';
  const depth = config.content.contentHeight;
  const reservedBottom = config.barcode.showText ? Math.min(config.base.height * 0.18, 10) : 0;

  const barcodeGeometry = useMemo(() => {
    const pattern = encodeBarcode(config.barcode.text || 'HELLO', config.barcode.format);
    return createBarcodeGeometry(
      pattern,
      config.base.width,
      config.base.height,
      config.base.borderWidth,
      reservedBottom,
      depth,
      embossed,
    );
  }, [config.barcode.text, config.barcode.format, config.base.width, config.base.height, config.base.borderWidth, depth, embossed, reservedBottom]);

  const z = contentZ(config.base, config.content, embossed);
  const availW = config.base.width - config.base.borderWidth * 2;

  return (
    <>
      <mesh position={[0, 0, z]} userData={{ part: 'content' }}>
        <primitive object={barcodeGeometry} attach="geometry" />
        <meshStandardMaterial color={CONTENT_COLOR} roughness={0.3} metalness={0.2} />
      </mesh>
      {config.barcode.showText && (
        <TextContent
          text={config.barcode.text || 'HELLO'}
          fontStyle="regular"
          size={3.5}
          depth={depth}
          maxWidth={availW}
          maxHeight={reservedBottom * 0.7}
          position={[0, -config.base.height / 2 + reservedBottom / 2 + config.base.borderWidth / 2, z]}
          part="text"
        />
      )}
    </>
  );
}

// --- Image / Silhouette Generator ---

function useImagePixels(dataUrl: string, resolution: number): PixelGrid | null {
  const [pixels, setPixels] = useState<PixelGrid | null>(null);

  useEffect(() => {
    if (!dataUrl) {
      // Clear asynchronously to avoid cascading renders inside the effect.
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

function ImageGeneratorGroup({ config }: { config: ModelConfig }) {
  const embossed = config.content.mode === 'embossed';
  const pixels = useImagePixels(config.image.dataUrl, config.image.resolution);

  const geometry = useMemo(() => {
    if (!pixels) return new THREE.BufferGeometry();
    return createImageSilhouetteGeometry(
      pixels,
      config.base.width,
      config.base.height,
      config.base.borderWidth,
      config.content.contentHeight,
      config.image.threshold,
      config.image.invert,
      embossed,
    );
  }, [pixels, config.base.width, config.base.height, config.base.borderWidth, config.content.contentHeight, config.image.threshold, config.image.invert, embossed]);

  return (
    <mesh position={[0, 0, contentZ(config.base, config.content, embossed)]} userData={{ part: 'content' }}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={CONTENT_COLOR} roughness={0.3} metalness={0.2} />
    </mesh>
  );
}

// --- Lithophane Generator (replaces base with the lithophane volume) ---

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

  return (
    <mesh position={[0, 0, 0]} userData={{ part: 'base' }}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={BASE_COLOR} roughness={0.5} metalness={0.05} />
    </mesh>
  );
}

// --- Main dispatcher ---

export const GeneratedModel = forwardRef<GeneratedModelRef, GeneratedModelProps>(
  ({ config }, ref) => {
    const groupRef = useRef<THREE.Group>(null);

    useImperativeHandle(ref, () => ({
      getScene: () => groupRef.current,
    }));

    // Lithophane has no separate base plate; it is the base.
    if (config.generator === 'lithophane') {
      return (
        <group ref={groupRef}>
          <LithophaneGeneratorGroup config={config} />
        </group>
      );
    }

    return (
      <group ref={groupRef}>
        <BaseMesh config={config} />
        <MagnetHoles config={config} />

        {config.generator === 'qr' && <QRGeneratorGroup config={config} />}
        {config.generator === 'text' && <TextGeneratorGroup config={config} />}
        {config.generator === 'spotify' && <SpotifyGeneratorGroup config={config} />}
        {config.generator === 'wifi' && <WifiGeneratorGroup config={config} />}
        {config.generator === 'vcard' && <VCardGeneratorGroup config={config} />}
        {config.generator === 'image' && <ImageGeneratorGroup config={config} />}
        {config.generator === 'barcode' && <BarcodeGeneratorGroup config={config} />}
        {config.generator === 'nameplate' && <NameplateGeneratorGroup config={config} />}
      </group>
    );
  }
);

GeneratedModel.displayName = 'GeneratedModel';
