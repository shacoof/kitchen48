import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../src/config/i18n';
import { initDatabase } from '../src/db/database';
import { seedRecipesIfNeeded } from '../src/services/recipe-seeder';
import { AppShell } from '../src/components/AppShell';
import { createLogger } from '../src/lib/logger';

const logger = createLogger('RootLayout');

export default function RootLayout() {
  useEffect(() => {
    initDatabase()
      .then(() => seedRecipesIfNeeded())
      .then(() => logger.debug('Database initialized'))
      .catch((err) => logger.error(`Database init failed: ${err}`));
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppShell>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="recipe" />
          <Stack.Screen name="create" />
        </Stack>
      </AppShell>
    </SafeAreaProvider>
  );
}
