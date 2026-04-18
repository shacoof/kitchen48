import { Stack } from 'expo-router';

export default function CreateLayout() {
  return (
    <Stack>
      <Stack.Screen name="manual" options={{ title: 'Create Recipe', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
