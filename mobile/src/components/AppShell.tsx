import { ReactNode, useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeaderContext, type ScreenHeaderConfig } from '../hooks/useScreenHeader';
import { TopBar1 } from './TopBar1';
import { TopBar2 } from './TopBar2';

interface Props {
  children: ReactNode;
}

export function AppShell({ children }: Props) {
  const [config, setConfig] = useState<ScreenHeaderConfig>({});
  const ctx = useMemo(() => ({ config, setConfig }), [config]);

  return (
    <ScreenHeaderContext.Provider value={ctx}>
      <SafeAreaView style={styles.root} edges={['top']}>
        <TopBar1 />
        <TopBar2 />
        <View style={styles.body}>{children}</View>
      </SafeAreaView>
    </ScreenHeaderContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  body: { flex: 1, backgroundColor: '#f8fafc' },
});
