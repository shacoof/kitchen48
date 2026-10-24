import { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../../src/components/ScaledText';
import { useTranslation } from 'react-i18next';
import { useActiveSessions } from '../../src/hooks/useActiveSessions';
import { SessionCard } from '../../src/components/SessionCard';
import { useScreenHeader } from '../../src/hooks/useScreenHeader';

export default function CookingScreen() {
  const { t } = useTranslation('common');
  const snapshots = useActiveSessions();

  useScreenHeader(useMemo(() => ({
    title: t('navigation.cooking', 'Cooking'),
  }), [t]));

  if (snapshots.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🍲</Text>
        <Text style={styles.emptyTitle}>{t('play.empty_title', 'Nothing cooking')}</Text>
        <Text style={styles.emptyBody}>
          {t('play.empty_body', 'Open a recipe and tap Play to start cooking.')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.active} contentContainerStyle={styles.activeContent}>
      {snapshots.map((snap) => (
        <SessionCard
          key={snap.session.id}
          snapshot={snap}
          onStopped={() => { /* refresh handled by useActiveSessions poll */ }}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  emptyBody: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  active: { flex: 1, backgroundColor: '#fff7ed' },
  activeContent: { paddingVertical: 8 },
});
