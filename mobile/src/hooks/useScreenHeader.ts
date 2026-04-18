import { createContext, useCallback, useContext } from 'react';
import { useFocusEffect } from 'expo-router';

export interface HeaderAction {
  icon: string;           // Ionicons glyph name
  onPress: () => void;
  label?: string;         // accessibility label
  tint?: string;          // override icon color (e.g. red for destructive)
  disabled?: boolean;
}

export interface ScreenHeaderConfig {
  title?: string;
  showBack?: boolean;
  actions?: HeaderAction[];
}

interface Ctx {
  config: ScreenHeaderConfig;
  setConfig: (c: ScreenHeaderConfig) => void;
}

export const ScreenHeaderContext = createContext<Ctx>({
  config: {},
  setConfig: () => { /* no-op before provider mounts */ },
});

/**
 * Registers this screen's TopBar2 config whenever the screen is focused.
 *
 * Gated on focus so background-mounted screens (e.g. the Cooking tab
 * polling every second) don't overwrite the foreground screen's config.
 * Callers should wrap `config` in useMemo so referential equality holds
 * across unchanged renders.
 */
export function useScreenHeader(config: ScreenHeaderConfig): void {
  const { setConfig } = useContext(ScreenHeaderContext);
  useFocusEffect(
    useCallback(() => {
      setConfig(config);
      return () => setConfig({});
    }, [config, setConfig])
  );
}

export function useCurrentScreenHeader(): ScreenHeaderConfig {
  return useContext(ScreenHeaderContext).config;
}
