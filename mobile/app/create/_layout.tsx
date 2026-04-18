import { Stack } from 'expo-router';

export default function CreateLayout() {
  return (
    <Stack>
      <Stack.Screen name="manual" options={{ title: 'Create Recipe', headerBackTitle: 'Back' }} />
      <Stack.Screen name="import" options={{ title: 'Import Recipe', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
