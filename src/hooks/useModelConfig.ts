import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ModelConfig,
  BaseConfig,
  ContentConfig,
  MagnetHoleConfig,
  MountingConfig,
  ExportConfig,
  TextConfig,
  SpotifyConfig,
  WifiCardConfig,
  VCardConfig,
  LithophaneConfig,
  BarcodeConfig,
  NameplateConfig,
  MapConfig,
  ColorConfig,
  GeneratorType,
} from '../types/model';
import { DEFAULT_CONFIG } from '../types/model';
import { PLATE_PRESETS } from '../generators/plate-presets';

const HISTORY_LIMIT = 50;
const AUTOSAVE_KEY = 'stlsmith.autosave';

function loadAutosaved(): ModelConfig {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    // Shallow-merge per top-level key so newly added fields fall back to defaults
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
    return DEFAULT_CONFIG;
  }
}

export function useModelConfig() {
  const [config, setConfigRaw] = useState<ModelConfig>(() => loadAutosaved());
  const historyRef = useRef<ModelConfig[]>([config]);
  const historyIndexRef = useRef<number>(0);

  // Persist to localStorage with debounce
  useEffect(() => {
    const id = setTimeout(() => {
      try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(config)); } catch { /* quota */ }
    }, 400);
    return () => clearTimeout(id);
  }, [config]);
  // Re-render trigger for canUndo/canRedo
  const [historyVer, setHistoryVer] = useState(0);

  const setConfig = useCallback((updater: ModelConfig | ((prev: ModelConfig) => ModelConfig)) => {
    setConfigRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const hist = historyRef.current.slice(0, historyIndexRef.current + 1);
      hist.push(next);
      if (hist.length > HISTORY_LIMIT) hist.shift();
      historyRef.current = hist;
      historyIndexRef.current = hist.length - 1;
      setHistoryVer(v => v + 1);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    setConfigRaw(historyRef.current[historyIndexRef.current]);
    setHistoryVer(v => v + 1);
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    setConfigRaw(historyRef.current[historyIndexRef.current]);
    setHistoryVer(v => v + 1);
  }, []);

  // historyVer used only to force re-render when undo/redo availability changes
  void historyVer;
  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const setGenerator = useCallback((generator: GeneratorType) => {
    setConfig(prev => {
      const preset = PLATE_PRESETS[generator];
      return {
        ...prev,
        generator,
        base: {
          ...prev.base,
          width: preset.width,
          height: preset.height,
          shape: preset.shape,
          cornerRadius: preset.cornerRadius,
          borderWidth: preset.borderWidth,
          borderEnabled: preset.borderEnabled,
        },
      };
    });
  }, [setConfig]);

  const applyTemplate = useCallback((template: Partial<ModelConfig>) => {
    setConfig(prev => ({ ...prev, ...template }));
  }, [setConfig]);

  const updateBase = useCallback((updates: Partial<BaseConfig>) => {
    setConfig(prev => ({ ...prev, base: { ...prev.base, ...updates } }));
  }, [setConfig]);

  const updateContent = useCallback((updates: Partial<ContentConfig>) => {
    setConfig(prev => ({ ...prev, content: { ...prev.content, ...updates } }));
  }, [setConfig]);

  const updateText = useCallback((updates: Partial<TextConfig>) => {
    setConfig(prev => ({ ...prev, text: { ...prev.text, ...updates } }));
  }, [setConfig]);

  const updateSpotify = useCallback((updates: Partial<SpotifyConfig>) => {
    setConfig(prev => ({ ...prev, spotify: { ...prev.spotify, ...updates } }));
  }, [setConfig]);

  const updateWifi = useCallback((updates: Partial<WifiCardConfig>) => {
    setConfig(prev => ({ ...prev, wifi: { ...prev.wifi, ...updates } }));
  }, [setConfig]);

  const updateVCard = useCallback((updates: Partial<VCardConfig>) => {
    setConfig(prev => ({ ...prev, vcard: { ...prev.vcard, ...updates } }));
  }, [setConfig]);

  const updateLithophane = useCallback((updates: Partial<LithophaneConfig>) => {
    setConfig(prev => ({ ...prev, lithophane: { ...prev.lithophane, ...updates } }));
  }, [setConfig]);

  const updateBarcode = useCallback((updates: Partial<BarcodeConfig>) => {
    setConfig(prev => ({ ...prev, barcode: { ...prev.barcode, ...updates } }));
  }, [setConfig]);

  const updateNameplate = useCallback((updates: Partial<NameplateConfig>) => {
    setConfig(prev => ({ ...prev, nameplate: { ...prev.nameplate, ...updates } }));
  }, [setConfig]);

  const updateMap = useCallback((updates: Partial<MapConfig>) => {
    setConfig(prev => ({ ...prev, map: { ...prev.map, ...updates } }));
  }, [setConfig]);

  const updateMagnets = useCallback((updates: Partial<MagnetHoleConfig>) => {
    setConfig(prev => ({ ...prev, magnets: { ...prev.magnets, ...updates } }));
  }, [setConfig]);

  const updateMounting = useCallback((updates: Partial<MountingConfig>) => {
    setConfig(prev => ({ ...prev, mounting: { ...prev.mounting, ...updates } }));
  }, [setConfig]);

  const updateExport = useCallback((updates: Partial<ExportConfig>) => {
    setConfig(prev => ({ ...prev, export: { ...prev.export, ...updates } }));
  }, [setConfig]);

  const updateColors = useCallback((updates: Partial<ColorConfig>) => {
    setConfig(prev => ({ ...prev, colors: { ...prev.colors, ...updates } }));
  }, [setConfig]);

  const resetConfig = useCallback(() => {
    historyRef.current = [DEFAULT_CONFIG];
    historyIndexRef.current = 0;
    setHistoryVer(0);
    setConfigRaw(DEFAULT_CONFIG);
    try { localStorage.removeItem(AUTOSAVE_KEY); } catch { /* ignore */ }
  }, []);

  return {
    config,
    setGenerator,
    applyTemplate,
    updateBase,
    updateContent,
    updateText,
    updateSpotify,
    updateWifi,
    updateVCard,
    updateLithophane,
    updateBarcode,
    updateNameplate,
    updateMap,
    updateMagnets,
    updateMounting,
    updateExport,
    updateColors,
    resetConfig,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
