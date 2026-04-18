import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { I18nManager } from 'react-native';
import i18n from '../config/i18n';
import { getSetting, setSetting } from '../db/settings-db';
import { createLogger } from '../lib/logger';
import type { MeasurementSystem } from '../lib/measurement';

const logger = createLogger('useSettings');

export interface AppSettings {
  interfaceLanguage: string;
  measurementSystem: MeasurementSystem;
  hasApiKey: boolean;
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    interfaceLanguage: 'en',
    measurementSystem: 'metric',
    hasApiKey: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const lang = (await getSetting('interface_language')) ?? 'en';
      const measurement = ((await getSetting('measurement_system')) ?? 'metric') as MeasurementSystem;
      const apiKey = await SecureStore.getItemAsync('anthropic_api_key');

      setSettings({
        interfaceLanguage: lang,
        measurementSystem: measurement,
        hasApiKey: !!apiKey,
      });

      if (i18n.language !== lang) {
        await i18n.changeLanguage(lang);
      }

      const isRTL = lang === 'he' || lang === 'ar';
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.forceRTL(isRTL);
      }
    } catch (err) {
      logger.error(`Failed to load settings: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateLanguage = useCallback(async (lang: string) => {
    await setSetting('interface_language', lang);
    await i18n.changeLanguage(lang);
    const isRTL = lang === 'he' || lang === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
    }
    setSettings((prev) => ({ ...prev, interfaceLanguage: lang }));
    logger.debug(`Language changed to ${lang}`);
  }, []);

  const updateMeasurementSystem = useCallback(async (system: MeasurementSystem) => {
    await setSetting('measurement_system', system);
    setSettings((prev) => ({ ...prev, measurementSystem: system }));
    logger.debug(`Measurement system changed to ${system}`);
  }, []);

  const setApiKey = useCallback(async (key: string) => {
    await SecureStore.setItemAsync('anthropic_api_key', key);
    setSettings((prev) => ({ ...prev, hasApiKey: true }));
    logger.debug('API key saved');
  }, []);

  const clearApiKey = useCallback(async () => {
    await SecureStore.deleteItemAsync('anthropic_api_key');
    setSettings((prev) => ({ ...prev, hasApiKey: false }));
    logger.debug('API key cleared');
  }, []);

  const getApiKey = useCallback(async (): Promise<string | null> => {
    return SecureStore.getItemAsync('anthropic_api_key');
  }, []);

  return {
    settings,
    isLoading,
    updateLanguage,
    updateMeasurementSystem,
    setApiKey,
    clearApiKey,
    getApiKey,
    reload: loadSettings,
  };
}
