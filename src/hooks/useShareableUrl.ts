import { useEffect, useCallback } from 'react';
import type { ModelConfig } from '../types/model';
import { DEFAULT_CONFIG } from '../types/model';

const HASH_PREFIX = 'cfg=';

// Keys whose values can be large binary blobs — strip before encoding
const STRIP_KEYS: Set<keyof ModelConfig> = new Set(['lithophane'] as (keyof ModelConfig)[]);

function stripLargeData(config: ModelConfig): Partial<ModelConfig> {
  const copy: Partial<ModelConfig> = { ...config };
  for (const key of STRIP_KEYS) {
    // Remove dataUrl from any generator that has one
    const sub = copy[key] as Record<string, unknown> | undefined;
    if (sub && typeof sub === 'object' && 'dataUrl' in sub) {
      (copy as Record<string, unknown>)[key] = { ...sub, dataUrl: '', fileName: '' };
    }
  }
  return copy;
}

export function encodeConfig(config: ModelConfig): string {
  const stripped = stripLargeData(config);
  const json = JSON.stringify(stripped);
  return btoa(encodeURIComponent(json));
}

export function decodeConfig(encoded: string): Partial<ModelConfig> | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json) as Partial<ModelConfig>;
    // Merge with defaults so added fields still fall back correctly
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      base: { ...DEFAULT_CONFIG.base, ...(parsed.base ?? {}) },
      content: { ...DEFAULT_CONFIG.content, ...(parsed.content ?? {}) },
      text: { ...DEFAULT_CONFIG.text, ...(parsed.text ?? {}) },
      spotify: { ...DEFAULT_CONFIG.spotify, ...(parsed.spotify ?? {}) },
      wifi: { ...DEFAULT_CONFIG.wifi, ...(parsed.wifi ?? {}) },
      vcard: { ...DEFAULT_CONFIG.vcard, ...(parsed.vcard ?? {}) },
      lithophane: { ...DEFAULT_CONFIG.lithophane, ...(parsed.lithophane ?? {}) },
      barcode: { ...DEFAULT_CONFIG.barcode, ...(parsed.barcode ?? {}) },
      nameplate: { ...DEFAULT_CONFIG.nameplate, ...(parsed.nameplate ?? {}) },
      map: { ...DEFAULT_CONFIG.map, ...(parsed.map ?? {}) },
      magnets: { ...DEFAULT_CONFIG.magnets, ...(parsed.magnets ?? {}) },
      mounting: { ...DEFAULT_CONFIG.mounting, ...(parsed.mounting ?? {}) },
      export: { ...DEFAULT_CONFIG.export, ...(parsed.export ?? {}) },
      colors: { ...DEFAULT_CONFIG.colors, ...(parsed.colors ?? {}) },
    };
  } catch {
    return null;
  }
}

function getShareUrl(config: ModelConfig): string {
  const encoded = encodeConfig(config);
  const url = new URL(window.location.href);
  url.hash = HASH_PREFIX + encoded;
  return url.toString();
}

/** Returns the encoded config from the current URL hash, or null if absent/invalid. */
export function readConfigFromHash(): Partial<ModelConfig> | null {
  const hash = window.location.hash.slice(1); // remove leading #
  if (!hash.startsWith(HASH_PREFIX)) return null;
  return decodeConfig(hash.slice(HASH_PREFIX.length));
}

/** Clears the config hash from the URL without a page reload. */
export function clearConfigHash() {
  const url = new URL(window.location.href);
  url.hash = '';
  window.history.replaceState(null, '', url.toString());
}

export function useShareableUrl(config: ModelConfig, onLoad?: (c: Partial<ModelConfig>) => void) {
  // On mount, load from hash if present
  useEffect(() => {
    const fromHash = readConfigFromHash();
    if (fromHash && onLoad) {
      onLoad(fromHash);
      clearConfigHash();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyShareUrl = useCallback(async () => {
    const url = getShareUrl(config);
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      // Fallback: create temporary input
      const el = document.createElement('input');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      return true;
    }
  }, [config]);

  return { copyShareUrl, getShareUrl: () => getShareUrl(config) };
}
