import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSetting, setSetting } from '../db/settings-db';
import { createLogger } from '../lib/logger';

const logger = createLogger('FontScale');

const SETTING_KEY = 'font_size';

export type FontSizeLevel = 'small' | 'normal' | 'large' | 'xlarge';

export const FONT_SIZE_LEVELS: { level: FontSizeLevel; scale: number }[] = [
  { level: 'small', scale: 0.9 },
  { level: 'normal', scale: 1 },
  { level: 'large', scale: 1.2 },
  { level: 'xlarge', scale: 1.45 },
];

function scaleFor(level: FontSizeLevel): number {
  return FONT_SIZE_LEVELS.find((l) => l.level === level)?.scale ?? 1;
}

function isLevel(value: string | null): value is FontSizeLevel {
  return FONT_SIZE_LEVELS.some((l) => l.level === value);
}

interface FontScaleContextValue {
  level: FontSizeLevel;
  scale: number;
  setLevel: (level: FontSizeLevel) => Promise<void>;
}

const FontScaleContext = createContext<FontScaleContextValue>({
  level: 'normal',
  scale: 1,
  setLevel: async () => {},
});

export function FontScaleProvider({ children }: { children: ReactNode }) {
  const [level, setLevelState] = useState<FontSizeLevel>('normal');

  useEffect(() => {
    getSetting(SETTING_KEY)
      .then((stored) => {
        if (isLevel(stored)) setLevelState(stored);
      })
      .catch((err) => logger.error(`Failed to load font size: ${err}`));
  }, []);

  const setLevel = useCallback(async (next: FontSizeLevel) => {
    setLevelState(next);
    try {
      await setSetting(SETTING_KEY, next);
      logger.debug(`Font size changed to ${next}`);
    } catch (err) {
      logger.error(`Failed to save font size: ${err}`);
    }
  }, []);

  const value = useMemo(() => ({ level, scale: scaleFor(level), setLevel }), [level, setLevel]);

  return <FontScaleContext.Provider value={value}>{children}</FontScaleContext.Provider>;
}

export function useFontScale(): FontScaleContextValue {
  return useContext(FontScaleContext);
}
