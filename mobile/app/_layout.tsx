import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import '../src/config/i18n';
import { initDatabase } from '../src/db/database';
import { createLogger } from '../src/lib/logger';

const logger = createLogger('RootLayout');

export default function RootLayout() {
  useEffect(() => {
    initDatabase()
      .then(() => logger.debug('Database initialized'))
      .catch((err) => logger.error(`Database init failed: ${err}`));
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="recipe" />
        <Stack.Screen name="create" />
      </Stack>
    </>
  );
}
