import { useState, useCallback, useRef } from 'react';
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
  ImageConfig,
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

export function useModelConfig() {
  const [config, setConfigRaw] = useState<ModelConfig>(DEFAULT_CONFIG);
  const historyRef = useRef<ModelConfig[]>([DEFAULT_CONFIG]);
  const historyIndexRef = useRef<number>(0);
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

  const updateImage = useCallback((updates: Partial<ImageConfig>) => {
    setConfig(prev => ({ ...prev, image: { ...prev.image, ...updates } }));
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
    updateImage,
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
