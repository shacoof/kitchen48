import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../src/config/i18n';
import { initDatabase } from '../src/db/database';
import { seedRecipesIfNeeded } from '../src/services/recipe-seeder';
import { addNotificationResponseListener } from '../src/services/notifications';
import { AppShell } from '../src/components/AppShell';
import { FontScaleProvider } from '../src/config/font-scale';
import { createLogger } from '../src/lib/logger';

const logger = createLogger('RootLayout');

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    initDatabase()
      .then(() => seedRecipesIfNeeded())
      .then(() => logger.debug('Database initialized'))
      .catch((err) => logger.error(`Database init failed: ${err}`));
  }, []);

  // Deep link from a timer notification tap: jump into the correct recipe's
  // play screen so the user can see which timer fired and dismiss it.
  useEffect(() => {
    return addNotificationResponseListener((data) => {
      router.push(`/recipe/${data.recipeId}/play`);
    });
  }, [router]);

  return (
    <SafeAreaProvider>
      <FontScaleProvider>
        <StatusBar style="dark" />
        <AppShell>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="recipe" />
            <Stack.Screen name="create" />
          </Stack>
        </AppShell>
      </FontScaleProvider>
    </SafeAreaProvider>
  );
}
