import { Stack } from 'expo-router';

// Intentionally no tab bar here — the global AppShell renders TopBar1 as
// the tab strip. This layout just provides a header-less stack for the tab
// group's routes.
export default function TabLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
