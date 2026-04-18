import { Stack } from 'expo-router';

export default function RecipeLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]/index" options={{ title: 'Recipe', headerBackTitle: 'Back' }} />
      <Stack.Screen name="[id]/play" options={{ headerShown: false }} />
    </Stack>
  );
}
