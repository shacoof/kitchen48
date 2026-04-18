import { createContext, useContext, useEffect } from 'react';

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

export function useScreenHeader(config: ScreenHeaderConfig): void {
  const { setConfig } = useContext(ScreenHeaderContext);
  const actionsKey = (config.actions ?? []).map((a) => `${a.icon}:${a.disabled ? '1' : '0'}:${a.tint ?? ''}`).join('|');

  useEffect(() => {
    setConfig(config);
    return () => setConfig({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.title, config.showBack, actionsKey, setConfig]);
}

export function useCurrentScreenHeader(): ScreenHeaderConfig {
  return useContext(ScreenHeaderContext).config;
}
