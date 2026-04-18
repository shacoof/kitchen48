import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { useActiveSessions } from '../../src/hooks/useActiveSessions';

export default function TabLayout() {
  const { t } = useTranslation('common');
  const snapshots = useActiveSessions();
  const cookingCount = snapshots.length;
  const isCooking = cookingCount > 0;

  const cookingColor = isCooking ? '#f97316' : '#94a3b8';

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
        name="cooking"
        options={{
          title: t('navigation.cooking', 'Cooking'),
          tabBarLabel: t('navigation.cooking', 'Cooking'),
          tabBarActiveTintColor: isCooking ? '#f97316' : undefined,
          tabBarInactiveTintColor: isCooking ? '#fb923c' : undefined,
          tabBarBadge: isCooking ? cookingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#f97316', color: '#ffffff' },
          tabBarIcon: ({ size }) => (
            <Text style={{ fontSize: (size ?? 22) + 2, color: cookingColor }}>
              {isCooking ? '🔥' : '🍲'}
            </Text>
          ),
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
