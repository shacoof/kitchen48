import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCurrentScreenHeader } from '../hooks/useScreenHeader';

export function TopBar2() {
  const router = useRouter();
  const { title, showBack, actions } = useCurrentScreenHeader();

  if (!title && !showBack && (!actions || actions.length === 0)) {
    return null;
  }

  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {showBack ? (
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color="#0f172a" />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.titleWrap}>
        {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : null}
      </View>
      <View style={[styles.side, styles.sideRight]}>
        {(actions ?? []).map((action, idx) => (
          <Pressable
            key={`${action.icon}-${idx}`}
            style={[styles.iconBtn, action.disabled && styles.iconBtnDisabled]}
            onPress={action.onPress}
            disabled={action.disabled}
            accessibilityRole="button"
            accessibilityLabel={action.label ?? action.icon}
            hitSlop={8}
          >
            <Ionicons
              name={action.icon as keyof typeof Ionicons.glyphMap}
              size={22}
              color={action.tint ?? '#334155'}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 48,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  side: { flexDirection: 'row', alignItems: 'center' },
  sideRight: { justifyContent: 'flex-end' },
  titleWrap: { flex: 1, paddingHorizontal: 8 },
  title: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  iconBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  iconBtnDisabled: { opacity: 0.4 },
});
