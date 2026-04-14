import { useState, useCallback } from 'react';
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
  ColorConfig,
  GeneratorType,
} from '../types/model';
import { DEFAULT_CONFIG } from '../types/model';
import { PLATE_PRESETS } from '../generators/plate-presets';

export function useModelConfig() {
  const [config, setConfig] = useState<ModelConfig>(DEFAULT_CONFIG);

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
  }, []);

  const updateBase = useCallback((updates: Partial<BaseConfig>) => {
    setConfig(prev => ({ ...prev, base: { ...prev.base, ...updates } }));
  }, []);

  const updateContent = useCallback((updates: Partial<ContentConfig>) => {
    setConfig(prev => ({ ...prev, content: { ...prev.content, ...updates } }));
  }, []);

  const updateText = useCallback((updates: Partial<TextConfig>) => {
    setConfig(prev => ({ ...prev, text: { ...prev.text, ...updates } }));
  }, []);

  const updateSpotify = useCallback((updates: Partial<SpotifyConfig>) => {
    setConfig(prev => ({ ...prev, spotify: { ...prev.spotify, ...updates } }));
  }, []);

  const updateWifi = useCallback((updates: Partial<WifiCardConfig>) => {
    setConfig(prev => ({ ...prev, wifi: { ...prev.wifi, ...updates } }));
  }, []);

  const updateVCard = useCallback((updates: Partial<VCardConfig>) => {
    setConfig(prev => ({ ...prev, vcard: { ...prev.vcard, ...updates } }));
  }, []);

  const updateImage = useCallback((updates: Partial<ImageConfig>) => {
    setConfig(prev => ({ ...prev, image: { ...prev.image, ...updates } }));
  }, []);

  const updateLithophane = useCallback((updates: Partial<LithophaneConfig>) => {
    setConfig(prev => ({ ...prev, lithophane: { ...prev.lithophane, ...updates } }));
  }, []);

  const updateBarcode = useCallback((updates: Partial<BarcodeConfig>) => {
    setConfig(prev => ({ ...prev, barcode: { ...prev.barcode, ...updates } }));
  }, []);

  const updateNameplate = useCallback((updates: Partial<NameplateConfig>) => {
    setConfig(prev => ({ ...prev, nameplate: { ...prev.nameplate, ...updates } }));
  }, []);

  const updateMagnets = useCallback((updates: Partial<MagnetHoleConfig>) => {
    setConfig(prev => ({ ...prev, magnets: { ...prev.magnets, ...updates } }));
  }, []);

  const updateMounting = useCallback((updates: Partial<MountingConfig>) => {
    setConfig(prev => ({ ...prev, mounting: { ...prev.mounting, ...updates } }));
  }, []);

  const updateExport = useCallback((updates: Partial<ExportConfig>) => {
    setConfig(prev => ({ ...prev, export: { ...prev.export, ...updates } }));
  }, []);

  const updateColors = useCallback((updates: Partial<ColorConfig>) => {
    setConfig(prev => ({ ...prev, colors: { ...prev.colors, ...updates } }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  return {
    config,
    setGenerator,
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
    updateMagnets,
    updateMounting,
    updateExport,
    updateColors,
    resetConfig,
  };
}
