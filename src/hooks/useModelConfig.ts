import { useState, useCallback } from 'react';
import type { ModelConfig, BaseConfig, ContentConfig, MagnetHoleConfig, MountingConfig, ExportConfig } from '../types/model';
import { DEFAULT_CONFIG } from '../types/model';

export function useModelConfig() {
  const [config, setConfig] = useState<ModelConfig>(DEFAULT_CONFIG);

  const updateBase = useCallback((updates: Partial<BaseConfig>) => {
    setConfig(prev => ({ ...prev, base: { ...prev.base, ...updates } }));
  }, []);

  const updateContent = useCallback((updates: Partial<ContentConfig>) => {
    setConfig(prev => ({ ...prev, content: { ...prev.content, ...updates } }));
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

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  return {
    config,
    updateBase,
    updateContent,
    updateMagnets,
    updateMounting,
    updateExport,
    resetConfig,
  };
}
