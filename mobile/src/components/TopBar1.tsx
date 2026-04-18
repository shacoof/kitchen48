import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useActiveSessions } from '../hooks/useActiveSessions';

interface TabDef {
  key: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  labelFallback: string;
}

const TABS: TabDef[] = [
  { key: 'recipes', path: '/', icon: 'book-outline', labelKey: 'navigation.recipes', labelFallback: 'Recipes' },
  { key: 'cooking', path: '/cooking', icon: 'flame-outline', labelKey: 'navigation.cooking', labelFallback: 'Cooking' },
  { key: 'create', path: '/create', icon: 'add-circle-outline', labelKey: 'navigation.create', labelFallback: 'Create' },
  { key: 'settings', path: '/settings', icon: 'settings-outline', labelKey: 'navigation.settings', labelFallback: 'Settings' },
];

function isTabActive(tab: TabDef, pathname: string): boolean {
  if (tab.path === '/') return pathname === '/' || pathname === '';
  return pathname === tab.path || pathname.startsWith(tab.path + '/');
}

export function TopBar1() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation('common');
  const sessions = useActiveSessions();
  const cookingCount = sessions.length;
  const isCooking = cookingCount > 0;

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const active = isTabActive(tab, pathname);
        const isCookingTab = tab.key === 'cooking';
        const highlight = isCookingTab && isCooking;
        const icon = highlight ? 'flame' : tab.icon;
        const tint = highlight
          ? '#f97316'
          : active ? '#0f172a' : '#94a3b8';
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => router.replace(tab.path as '/')}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={icon} size={22} color={tint} />
              {isCookingTab && cookingCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cookingCount}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, { color: tint }, active && styles.labelActive]}>
              {t(tab.labelKey, tab.labelFallback)}
            </Text>
            <View style={[styles.underline, active && styles.underlineActive, highlight && styles.underlineCooking]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  iconWrap: { position: 'relative' },
  label: { fontSize: 11, marginTop: 2 },
  labelActive: { fontWeight: '700' },
  underline: { height: 3, width: '60%', marginTop: 4, backgroundColor: 'transparent', borderRadius: 2 },
  underlineActive: { backgroundColor: '#0f172a' },
  underlineCooking: { backgroundColor: '#f97316' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
});
