import { Stack } from 'expo-router';

export default function RecipeLayout() {
  // Chrome is provided by AppShell's TopBar1 + TopBar2. Stack here manages
  // history so router.back() works from drill-in routes.
  return <Stack screenOptions={{ headerShown: false }} />;
}
