import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation('common');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#334155',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: true,
        headerStyle: { backgroundColor: '#f8fafc' },
        headerTitleStyle: { fontWeight: '600', color: '#0f172a' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.recipes', 'My Recipes'),
          tabBarLabel: t('navigation.recipes', 'Recipes'),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: t('navigation.create', 'Create'),
          tabBarLabel: t('navigation.create', 'Create'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('navigation.settings', 'Settings'),
          tabBarLabel: t('navigation.settings', 'Settings'),
        }}
      />
    </Tabs>
  );
}
